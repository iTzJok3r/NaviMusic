/* =============================================================================
   Archimedes — shared YouTube embed layer
   =============================================================================
   ONE place that knows how to embed a YouTube video, used unchanged by Electron,
   Android WebView and the browser fallback. It deliberately contains no
   platform-specific trickery: each host supplies exactly two things through
   YtEmbed.configure(), and everything else is shared.

   Why this file exists at all
   ---------------------------
   Error 153 means YouTube received no usable client identification (no HTTP
   Referer and no equivalent). The old shared code tried to paper over that by
   inventing an origin:

       const originUrl = /^https?:$/.test(location.protocol)
         ? location.origin
         : 'https://www.youtube.com';        // <- a lie
       params: origin=<that>, widget_referrer=<that>, enablejsapi=1

   On both platforms the UI is served from file://, whose origin is opaque, so
   every embed shipped origin=https://www.youtube.com while the actual embedding
   document had origin "null". YouTube rejects the mismatch — that is the 153.
   Electron's Referer injection could not compensate, because the declared origin
   parameter still contradicted the real one.

   The rule here: the origin is never invented. If the host provides a real
   http(s) origin we use it and the official IFrame API works, which also gives
   us error callbacks. If the host provides nothing, we say so loudly rather than
   faking a value, and we do not enable the JS API, which cannot work from an
   opaque origin.
   ============================================================================= */
(function () {
  'use strict';

  /* --- configuration supplied by the platform adapter ------------------- */

  let appOrigin = null;      // real, stable http(s) origin, or null
  let openExternalFn = null;  // (videoId) => void

  function configure(options) {
    const opts = options || {};
    if (typeof opts.origin === 'string') {
      const clean = opts.origin.replace(/\/+$/, '');
      appOrigin = /^https?:\/\//i.test(clean) ? clean : null;
    }
    if (typeof opts.openExternal === 'function') openExternalFn = opts.openExternal;
    return { origin: resolveOrigin() };
  }

  /* The origin of the document that will host the iframe.
     http(s) -> usable.  file:// or anything else -> null, and callers must cope
     instead of substituting a fake. */
  function resolveOrigin() {
    if (appOrigin) return appOrigin;
    try {
      if (location.protocol === 'http:' || location.protocol === 'https:') return location.origin;
    } catch (e) { /* opaque */ }
    return null;
  }

  function originIsUsable() { return resolveOrigin() !== null; }

  /* --- video id --------------------------------------------------------- */

  function extractVideoId(urlOrText) {
    if (!urlOrText) return null;
    const trimmed = String(urlOrText).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
    );
    return match && match[1] ? match[1] : null;
  }

  /* --- URL -------------------------------------------------------------- */

  /* Only parameters that are valid and meaningful for the resolved origin.
     docs: origin/enablejsapi require a matching http(s) origin; playsinline is
     required for inline playback in a WebView; rel/modestbranding are cosmetic
     and legal. */
  function buildUrl(videoId) {
    const origin = resolveOrigin();
    const params = new URLSearchParams();
    params.set('playsinline', '1');
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('autoplay', '1');

    if (origin) {
      params.set('origin', origin);
      params.set('enablejsapi', '1');
      params.set('widget_referrer', origin);
    }
    // No origin: omit origin/widget_referrer entirely. Sending a made-up value is
    // what produced Error 153.

    return 'https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(videoId) + '?' + params.toString();
  }

  /* --- error model ------------------------------------------------------ */
  /* 100 / 101 / 150 are YouTube's own verdicts about the video and must never be
     worked around. 153 is different: it is a configuration fault on OUR side. */

  const ERRORS = {
    2:   { kind: 'bad-id',   ar: 'معرّف الفيديو غير صالح.', en: 'The video id is not valid.' },
    5:   { kind: 'html5',    ar: 'تعذّر تشغيل المشغل في هذه البيئة.', en: 'This player cannot run in this environment.' },
    100: { kind: 'missing',  ar: 'الفيديو غير موجود (محذوف أو خاص).', en: 'This video does not exist (deleted or private).' },
    101: { kind: 'blocked',  ar: 'صاحب الفيديو منع التضمين.', en: 'The uploader does not allow this video to be embedded.' },
    150: { kind: 'blocked',  ar: 'صاحب الفيديو منع التضمين.', en: 'The uploader does not allow this video to be embedded.' },
    153: { kind: 'client-id', ar: 'يوتيوب لم يتعرّف على هوية التطبيق (Referer/Origin). هذا خلل في إعداد التطبيق لا في الفيديو.', en: 'YouTube could not identify the embedding client (Referer/Origin). This is an app configuration fault, not a problem with the video.' },
    // 152 is not in the published error table but behaves exactly like 153:
    // measured on Windows while a header hook was rewriting the Referer, every
    // video returned 152. Treated as the same class of fault.
    152: { kind: 'client-id', ar: 'يوتيوب لم يتعرّف على هوية التطبيق (Referer/Origin) — رمز 152.', en: 'YouTube could not identify the embedding client (Referer/Origin) — code 152.' },
  };

  function describeError(code) {
    // An unrecognised code must be reported AS ITSELF. The first version of this
    // fell back to the entry for code 5, so a real 152 was displayed as
    // "this player cannot run in this environment" — which sent the
    // investigation after codecs and autoplay policy instead of client
    // identification. Never relabel an error we do not recognise.
    const entry = ERRORS[code];
    if (!entry) {
      return {
        code,
        kind: 'unknown',
        showFallback: true,
        ar: 'خطأ من يوتيوب بالرمز ' + code + '.',
        en: 'YouTube reported error ' + code + '.',
      };
    }
    return {
      code,
      kind: entry.kind,
      // 100/150/101 are the uploader's or YouTube's decision: offer the exit.
      showFallback: code !== 153,
      ar: entry.ar,
      en: entry.en,
    };
  }

  /* --- official IFrame API ---------------------------------------------- */

  let apiPromise = null;

  function loadApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) { resolve(window.YT); return; }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try { if (typeof prev === 'function') prev(); } catch (e) { /* ignore */ }
        resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => reject(new Error('iframe-api-unavailable'));
      document.head.appendChild(s);
    });
    return apiPromise;
  }

  /* --- mounting --------------------------------------------------------- */

  /* Creates the player inside `container`.
     Returns { mode, destroy } so the caller knows whether it got the real API
     (with error callbacks) or only a bare iframe. */
  function mount(container, videoId, handlers) {
    const h = handlers || {};
    const origin = resolveOrigin();

    if (!origin) {
      // A bare iframe is all that is possible without a real origin, and it will
      // very likely show Error 153 inside the frame. The host must be told so it
      // can surface that honestly.
      const frame = document.createElement('iframe');
      frame.id = 'ytIframePlayer';
      frame.src = buildUrl(videoId);
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      frame.setAttribute('allowfullscreen', '');
      frame.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;';
      container.appendChild(frame);
      return { mode: 'iframe-no-origin', destroy() { frame.remove(); } };
    }

    // Real origin available: use the official API so errors are reportable.
    let player = null;
    let destroyed = false;

    loadApi().then((YT) => {
      if (destroyed) return;
      const host = document.createElement('div');
      host.id = 'ytApiHost';
      host.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      container.appendChild(host);

      player = new YT.Player(host, {
        videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          autoplay: 1,
          origin,
          enablejsapi: 1,
          widget_referrer: origin,
        },
        events: {
          onReady: (e) => { if (typeof h.onReady === 'function') h.onReady(e); },
          onStateChange: (e) => { if (typeof h.onStateChange === 'function') h.onStateChange(e); },
          onError: (e) => {
            const info = describeError(e && e.data);
            if (typeof h.onError === 'function') h.onError(info);
          },
        },
      });
    }).catch((err) => {
      if (typeof h.onError === 'function') {
        h.onError({ code: 0, kind: 'api-unavailable', showFallback: true, en: String(err && err.message || err), ar: 'تعذّر تحميل واجهة يوتيوب.' });
      }
    });

    return {
      mode: 'iframe-api',
      // The raw player is exposed so a controller can drive it (play/pause/seek
      // and reading position). The embed layer itself stays unaware of any
      // application playback state.
      getPlayer() { return player; },
      isReady() { return !!(player && typeof player.getCurrentTime === 'function'); },
      destroy() {
        destroyed = true;
        try { if (player && player.destroy) player.destroy(); } catch (e) { /* ignore */ }
        container.innerHTML = '';
        player = null;
      },
    };
  }

  function openExternal(videoId) {
    const url = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
    if (openExternalFn) { openExternalFn(videoId); return; }
    try { window.open(url, '_blank', 'noopener'); } catch (e) { /* ignore */ }
  }

  window.YtEmbed = {
    configure,
    resolveOrigin,
    originIsUsable,
    extractVideoId,
    buildUrl,
    describeError,
    mount,
    openExternal,
    ERRORS,
  };
})();
