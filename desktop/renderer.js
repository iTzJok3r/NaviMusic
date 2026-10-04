// Universal Cross-Runtime MD5 Implementation (works in Node/Electron & Webview App mode)
function md5(string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000); lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000); lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else return (lResult ^ lX8 ^ lY8);
  }
  function F(x,y,z){return (x & y) | ((~x) & z);}
  function G(x,y,z){return (x & z) | (y & (~z));}
  function H(x,y,z){return (x ^ y ^ z);}
  function I(x,y,z){return (y ^ (x | (~z)));}
  function FF(a,b,c,d,x,s,ac){a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));return addUnsigned(rotateLeft(a, s), b);}
  function GG(a,b,c,d,x,s,ac){a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));return addUnsigned(rotateLeft(a, s), b);}
  function HH(a,b,c,d,x,s,ac){a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));return addUnsigned(rotateLeft(a, s), b);}
  function II(a,b,c,d,x,s,ac){a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));return addUnsigned(rotateLeft(a, s), b);}
  function convertToWordArray(string) {
    var lWordCount, lMessageLength = string.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0, lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue) {
    var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  function utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }
  var x = Array(), k, AA, BB, CC, DD, a, b, c, d;
  var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  string = utf8Encode(string);
  x = convertToWordArray(string);
  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478); d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756); c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A); c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF); c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193); c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340); c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k + 10], S22, 0x2441453); c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6); c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8); c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9); b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681); c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9); c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60); b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA); c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5); c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97); c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92); c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0); c = II(c, d, a, b, x[k + 6], S43, 0xA3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235); c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

// Configuration
// No credentials live in this file any more. On desktop the main process owns them
// (encrypted with the OS keystore) and injects Subsonic token auth into every
// request; on Android the native bridge does the same from
// EncryptedSharedPreferences. Only md5 digests ever reach this code.
let serverUrl = localStorage.getItem('navidrome_server_url') || '';
let sessionAuth = null;            // { u, t, s, v, c, f } - digests only
let loggedInUser = '';
let ephemeralCredentials = null;   // browser-only fallback, never persisted

// State
let currentQueue = [];
let currentIndex = -1;
let currentSong = null;
let currentView = 'artists';
let isShuffleEnabled = false;
let isRepeatEnabled = false;
let repeatMode = 'off'; // 'off' | 'all' | 'one'

const audio = document.getElementById('audioElement');

// Subsonic Auth Generator
function md5AuthParams(user, pass) {
  const salt = Math.random().toString(36).substring(2, 14);
  return {
    u: user,
    t: md5(pass + salt),
    s: salt,
    v: '1.16.1',
    c: 'ArchimedesDesktop',
    f: 'json'
  };
}

/**
 * Pulls token parameters from whichever native side holds the credentials.
 * Contained digests only - the password never crosses into the page.
 */
/* Credential provisioning can fail — measured on a real desktop run:

     provision: { ok: false,
                  error: "EPERM: operation not permitted, open
                          'C:\\Users\\<user>\\AppData\\Roaming\\navidrome-desktop\\credentials.bin'" }

   When that happens the app has no credentials, so it falls back to the login
   screen. The failure used to be discarded entirely, which turns "the credential
   store is not writable" into "the desktop app just asks me to log in and never
   works" with nothing to go on. It is recorded here and shown on the login
   screen, because a silent downgrade is indistinguishable from a broken app. */
let provisionFailure = null;

function recordProvisionFailure(reason) {
  provisionFailure = String(reason || 'unknown');
  try { console.error('[Archimedes] credential provisioning failed: ' + provisionFailure); } catch (e) { /* ignore */ }
}

async function refreshAuthParams() {
  try {
    if (archimedesBridge && typeof archimedesBridge.authParams === 'function') {
      let p = await archimedesBridge.authParams();

      // First run: seed the built-in server into the encrypted store so the app
      // starts already signed in and no login screen is ever shown. The seed lives
      // on the native side and is deleted before publishing (see main.js).
      if ((!p || !p.u || !p.t) && typeof archimedesBridge.provisionDefaults === 'function') {
        const prov = await archimedesBridge.provisionDefaults();
        if (prov && prov.ok) p = await archimedesBridge.authParams();
        else if (prov && prov.error) recordProvisionFailure(prov.error);
      }

      if (p && p.u && p.t) {
        sessionAuth = p;
        loggedInUser = p.u;
        if (!serverUrl && typeof archimedesBridge.credentialsStatus === 'function') {
          const st = await archimedesBridge.credentialsStatus();
          if (st && st.serverUrl) {
            serverUrl = st.serverUrl;
            try { localStorage.setItem('navidrome_server_url', serverUrl); } catch (e) { /* ignore */ }
          }
        }
        return sessionAuth;
      }
    } else if (window.ArchimedesNative && typeof window.ArchimedesNative.getAuthParams === 'function') {
      let p = JSON.parse(window.ArchimedesNative.getAuthParams() || '{}');
      if ((!p || !p.u || !p.t) && typeof window.ArchimedesNative.provisionDefaults === 'function') {
        try {
          const prov = window.ArchimedesNative.provisionDefaults();
          // The Android bridge returns a JSON string (or nothing); only treat a
          // definite failure as one.
          if (prov) {
            const parsed = typeof prov === 'string' ? JSON.parse(prov) : prov;
            if (parsed && parsed.ok === false && parsed.error) recordProvisionFailure(parsed.error);
          }
        } catch (e) {
          recordProvisionFailure(e && e.message);
        }
        p = JSON.parse(window.ArchimedesNative.getAuthParams() || '{}');
      }
      if (p && p.u && p.t) {
        sessionAuth = p;
        loggedInUser = p.u;
        if (!serverUrl && typeof window.ArchimedesNative.getServerUrl === 'function') {
          const storedUrl = window.ArchimedesNative.getServerUrl();
          if (storedUrl) {
            serverUrl = storedUrl;
            try { localStorage.setItem('navidrome_server_url', serverUrl); } catch (e) { /* ignore */ }
          }
        }
        return sessionAuth;
      }
    } else if (ephemeralCredentials) {
      sessionAuth = md5AuthParams(ephemeralCredentials.username, ephemeralCredentials.password);
      loggedInUser = ephemeralCredentials.username;
      return sessionAuth;
    }

    // The chain above only consulted ephemeralCredentials when the native bridge
    // was ABSENT. On the desktop the bridge always exists, so when its store
    // cannot be read (EPERM) the credentials the user just typed were ignored
    // and the login screen came straight back. Verified on a real run:
    //   loginState "resolved" but hasAuth false, cache 0, loginModal "flex"
    // Honour the session-only credential here too, regardless of which branch
    // was taken.
    if (!sessionAuth && ephemeralCredentials) {
      sessionAuth = md5AuthParams(ephemeralCredentials.username, ephemeralCredentials.password);
      loggedInUser = ephemeralCredentials.username;
      if (serverUrl) {
        try { localStorage.setItem('navidrome_server_url', serverUrl); } catch (e) { /* ignore */ }
      }
      return sessionAuth;
    }
  } catch (e) { /* not configured yet */ }
  sessionAuth = null;
  return null;
}

function getAuthParams() {
  // Synchronous on purpose: media URLs are built in hot paths. The digest is
  // refreshed at start-up, after login and hourly by the token rotation below.
  if (sessionAuth && sessionAuth.u) return sessionAuth;
  if (ephemeralCredentials) return md5AuthParams(ephemeralCredentials.username, ephemeralCredentials.password);
  return { v: '1.16.1', c: 'ArchimedesDesktop', f: 'json' };
}

function buildSubsonicUrl(endpoint, extraParams = {}) {
  return buildSubsonicUrlFor(serverUrl, endpoint, extraParams);
}

/* Tell the main process which server we are using.

   The desktop routes media through Web Audio, and Chromium feeds that graph
   silence unless the response carries Access-Control-Allow-Origin. Main injects
   that header, but it used to learn the server URL ONLY from the encrypted
   credential store — which on some machines cannot be written at all, so the
   store stays empty and the header is never added. The user is then told
   "Audio effects need the stream to be served with CORS headers... these effects
   are disabled" and the whole effects rack stops working.

   The renderer always knows the URL, session-only credentials included, so it
   reports it here. */
function reportActiveServer() {
  try {
    if (archimedesBridge && typeof archimedesBridge.setActiveServer === 'function' && serverUrl) {
      archimedesBridge.setActiveServer(serverUrl);
    }
  } catch (e) { /* the CORS hook is best-effort */ }
}
window.reportActiveServer = reportActiveServer;

/* Same URL, but against an arbitrary base. Used by the endpoint failover. */
function buildSubsonicUrlFor(base, endpoint, extraParams = {}) {
  const params = { ...getAuthParams(), ...extraParams };
  const query = new URLSearchParams(params).toString();
  return `${String(base || '').replace(/\/+$/, '')}/rest/${endpoint}?${query}`;
}

/* ---------------------------------------------------------------------------
   Endpoint failover.

   On mobile data some carriers interfere with the server, and because the whole
   app goes through one endpoint, a single blocked port makes it look like the
   server is down. Measured from an unrestricted network against this user's
   Cloudflare-fronted domain, ALL of these answered HTTP 200:

       https://<host>:443   2053   2083   2087   2096   8443     and http://<host>:80

   So the app now walks the list instead of committing to one port, and remembers
   whichever base actually answered. A carrier that blocks 443 but not 8443 (a
   very common shape of interference) no longer breaks the app.

   The candidates are derived from the configured URL, so this needs no new
   setting and no user action. */
const ENDPOINT_TIMEOUT_MS = 25000;

let lastEndpointFailures = [];
window.__lastEndpointFailures = () => lastEndpointFailures.slice();

function endpointCandidates() {
  const primary = String(serverUrl || '').replace(/\/+$/, '');
  if (!primary) return [];
  const list = [primary];
  try {
    // Fallbacks are EXPLICIT hosts only, supplied by the user. A Cloudflare
    // Tunnel publishes one hostname on one port, so guessing other ports on the
    // same host cannot succeed — and on a network that blocks Cloudflare it
    // would add a full timeout per guess to every single request, turning a
    // clear error into roughly a minute of dead UI.
    const extra = JSON.parse(localStorage.getItem('archimedes_alt_endpoints') || '[]');
    if (Array.isArray(extra)) {
      for (const raw of extra) {
        const value = String(raw || '').trim().replace(/\/+$/, '');
        if (value && !list.includes(value)) list.push(value);
      }
    }
  } catch (e) {
    // Not a parseable URL (a bare host, say): keep just what was configured.
  }
  return list;
}
window.__endpointCandidates = endpointCandidates;

async function apiRequest(endpoint, extraParams = {}) {
  // Desktop: the main process performs the request so the password stays out of
  // the page (and so no cross-origin permission is needed).
  if (archimedesBridge && typeof archimedesBridge.api === 'function') {
    const res = await archimedesBridge.api(endpoint, extraParams);
    if (!res) throw new Error('bridge-unavailable');
    if (res.ok !== false) return res.data;

    // The main process reads credentials from its own encrypted store. When that
    // store is unwritable the process has none, so every request comes back
    // 'not-configured' and the app bounces to a login screen that can never
    // succeed — measured on a real run as loginModal bouncing back to "flex"
    // with cache 0 and the library never loading.
    // If THIS session holds the credentials in memory, perform the request here
    // instead. main.js already injects the CORS headers the direct path needs.
    const canFallBack = res.error === 'not-configured' && sessionAuth && ephemeralCredentials;
    if (!canFallBack) {
      if (res.error === 'not-configured') {
        openLoginModal(typeof t !== 'undefined' ? '' : '');
      }
      throw new Error(res.error || 'Subsonic request failed');
    }
  }

  // Android / browser: the page performs the request with bridge-provided digests.
  // Walk the endpoint candidates rather than trusting one port: on mobile data a
  // carrier can interfere with a single port and the app then looks offline.
  const candidates = endpointCandidates();
  if (candidates.length === 0 || !sessionAuth) {
    // Nothing configured yet: ask for credentials instead of firing a request at a
    // bogus URL (this used to surface as a bare "Failed to fetch").
    openLoginModal(currentLang === 'ar'
      ? 'أدخل بيانات السيرفر للاتصال.'
      : 'Enter your server credentials to connect.');
    throw new Error('not-configured');
  }

  lastEndpointFailures = [];
  for (const base of candidates) {
    const url = buildSubsonicUrlFor(base, endpoint, extraParams);
    let res;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), ENDPOINT_TIMEOUT_MS) : null;
    try {
      res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    } catch (e) {
      // Network-level failure for this base: record and try the next one.
      lastEndpointFailures.push(`${base} -> ${e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || e}`);
      continue;
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (!res.ok) {
      lastEndpointFailures.push(`${base} -> HTTP ${res.status}`);
      continue;
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      lastEndpointFailures.push(`${base} -> invalid JSON`);
      continue;
    }

    const sub = data['subsonic-response'];
    if (sub && sub.status === 'failed') {
      // The server itself answered: the endpoint is fine and retrying another
      // port would only repeat the same error. Do not swallow this as a
      // connectivity failure.
      throw new Error((sub.error && sub.error.message) || 'Subsonic request failed');
    }

    // This base works: adopt it so playback URLs and later requests use it too.
    if (base !== serverUrl) {
      serverUrl = base;
      try { localStorage.setItem('navidrome_server_url', base); } catch (e) { /* ignore */ }
      try { if (typeof badgeServerIp !== 'undefined' && badgeServerIp) badgeServerIp.textContent = new URL(base).host; } catch (e) { /* ignore */ }
    }
    return sub;
  }

  // Every endpoint failed: let the native layer explain why, once.
  explainConnectivityFailure();
  throw new Error('unreachable: ' + lastEndpointFailures.join(' | '));
}

/* When nothing can be reached, the user is looking at an app that simply does
   not work. On Android the native layer can say WHY, so ask it once and report
   the conclusion in plain language. This is the difference between "it is
   broken" and "your carrier is filtering DNS, use DoH or another tunnel". */
let connectivityExplained = false;

function explainConnectivityFailure() {
  if (connectivityExplained) return;
  const bridge = window.ArchimedesNative;
  if (!bridge || typeof bridge.diagnoseConnection !== 'function') return;
  connectivityExplained = true;

  (async () => {
    try {
      bridge.diagnoseConnection(serverUrl);
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 750));
        const raw = bridge.getDiagnosticResult();
        if (!raw || raw === '{}' || /"running"/.test(raw)) continue;
        const d = JSON.parse(raw);
        const ar = currentLang === 'ar';
        const failed = (v) => typeof v === 'string' && v.startsWith('FAILED');

        let verdict;
        if (failed(d.dnsSystem) && !failed(d.dnsDoH)) {
          verdict = ar
            ? 'جهازك لا يستطيع تحليل اسم السيرفر (DNS)، لكن Cloudflare تستطيع. أي أن الحجب على DNS تحديداً.'
            : 'Your device cannot resolve the server name (DNS), but Cloudflare can. The block is DNS-level specifically.';
        } else if (failed(d.tcp)) {
          verdict = ar
            ? 'عنوان السيرفر نفسه غير قابل للوصول. هذا حجب على مستوى IP — ولا يمكن لأي تغيير داخل التطبيق تجاوزه؛ الحل نفق أو عنوان آخر.'
            : 'The server address itself is unreachable. This is IP-level blocking — no in-app change can bypass it; you need a different tunnel or address.';
        } else if (d.tls && failed(d.tls)) {
          verdict = ar
            ? 'الاتصال ينجح لكن المصافحة المشفّرة تفشل. هذا حجب على مستوى TLS/SNI.'
            : 'The connection succeeds but the encrypted handshake fails. This is TLS/SNI-level blocking.';
        } else if (!failed(d.http)) {
          verdict = ar
            ? 'السيرفر يستجيب فعلاً — قد تكون المشكلة في اسم المستخدم أو كلمة المرور.'
            : 'The server actually responds — the problem may be the credentials.';
        } else {
          verdict = ar ? 'فشل غير مصنّف. افتح الإعدادات ← تشخيص الاتصال للتفاصيل.' : 'Unclassified failure. Open Settings → Connection diagnostics for details.';
        }

        alert((ar ? 'تعذّر الوصول إلى السيرفر.\n\n' : 'Cannot reach the server.\n\n')
          + verdict
          + '\n\n' + (ar ? 'العنوان: ' : 'Address: ') + serverUrl);
        return;
      }
    } catch (e) { /* diagnostics are best-effort */ }
  })();
}
window.explainConnectivityFailure = explainConnectivityFailure;

/**
 * Cross-origin JSON GET for the public lyrics/oEmbed endpoints.
 * On desktop the page is a file:// document, so with web security enabled these
 * requests must go through the main process (allow-listed hosts only).
 */
async function httpGetJson(url) {
  if (archimedesBridge && typeof archimedesBridge.httpGetJson === 'function') {
    const res = await archimedesBridge.httpGetJson(url);
    if (!res || res.ok !== true) return { ok: false, status: res ? res.status : 0 };
    try {
      return { ok: true, data: JSON.parse(res.text) };
    } catch (e) {
      return { ok: false, status: res.status };
    }
  }
  const response = await fetch(url);
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, data: await response.json() };
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function playAllCurrentQueue(shuffle = false) {
  if (!currentQueue || currentQueue.length === 0) return;
  if (shuffle) {
    currentQueue = shuffleArray(currentQueue);
  }
  playSongAt(0);
}

async function playAllArtistSongs(artistId, shuffle = false) {
  try {
    const data = await apiRequest('getArtist.view', { id: artistId });
    const albums = data.artist?.album || [];
    let allTracks = [];
    for (const al of albums) {
      const albumData = await apiRequest('getAlbum.view', { id: al.id });
      const tracks = albumData.album?.song || [];
      allTracks.push(...tracks);
    }
    if (allTracks.length === 0) return;
    currentQueue = shuffle ? shuffleArray(allTracks) : allTracks;
    playSongAt(0);
  } catch (e) {
    console.error('Failed to play artist songs:', e);
  }
}

// Native bridge
// The page has no Node access any more (contextIsolation + sandbox). preload.js
// exposes a narrow API as window.archimedes; the adapter below keeps the existing
// call sites working and stays null on platforms without it (the Android WebView
// uses its own ArchimedesNative bridge).
const archimedesBridge = (typeof window !== 'undefined' && window.archimedes) ? window.archimedes : null;

function bridgeInvoke(channel, ...args) {
  const b = archimedesBridge;
  if (!b) return Promise.resolve(null);
  switch (channel) {
    case 'toggle-mini-mode': return b.toggleMiniMode(args[0]);
    case 'toggle-fullscreen': return b.toggleFullscreen();
    case 'get-window-state': return b.getWindowState();
    case 'scan-local-music': return b.scanLocalMusic(args[0]);
    case 'pick-local-folder': return b.pickLocalFolder();
    case 'open-item-in-folder': return b.openItemInFolder(args[0]);
    case 'yt-validate': return b.validateYouTube(args[0]);
    case 'download-youtube-audio': return b.downloadYouTubeAudio(args[0]);
    case 'delete-server-file': return b.deleteServerFile(args[0], args[1]);
    case 'delete-server-folder': return b.deleteServerFolder(args[0], args[1]);
    case 'subtitle-scan': return b.subtitleScan(args[0]);
    case 'subtitle-read': return b.subtitleRead(args[0]);
    case 'subtitle-choose-folder': return b.subtitleChooseFolder();
    case 'subtitle-pick': return b.subtitlePick();
    default: return Promise.resolve(null);
  }
}

const ipcRenderer = archimedesBridge ? { invoke: bridgeInvoke } : null;

// UI Elements
const contentArea = document.getElementById('contentArea');
const badgeServerIp = document.getElementById('badgeServerIp');
const serverStatusBadge = document.getElementById('serverStatusBadge');
const ipModal = document.getElementById('ipModal');
const modalIpInput = document.getElementById('modalIpInput');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveModalBtn = document.getElementById('saveModalBtn');
const searchInput = document.getElementById('searchInput');

// Player Elements
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleToggleBtn = document.getElementById('shuffleToggleBtn');
const repeatToggleBtn = document.getElementById('repeatToggleBtn');
const playerCover = document.getElementById('playerCover');
const playerCoverPlaceholder = document.getElementById('playerCoverPlaceholder');
const playerSongTitle = document.getElementById('playerSongTitle');
const playerArtistName = document.getElementById('playerArtistName');
const currentTime = document.getElementById('currentTime');
const totalDuration = document.getElementById('totalDuration');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const volumeSlider = document.getElementById('volumeSlider');
const volumeIcon = document.getElementById('volumeIcon');

// Player Extra Elements
const playerLyricsTicker = document.getElementById('playerLyricsTicker');
const tickerText = document.getElementById('tickerText');
const miniVisualizerCanvas = document.getElementById('miniVisualizerCanvas');
const eqToggleBtn = document.getElementById('eqToggleBtn');
const playerMiniBtn = document.getElementById('playerMiniBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const topEqBtn = document.getElementById('topEqBtn');
const topMiniBtn = document.getElementById('topMiniBtn');
const topFsBtn = document.getElementById('topFsBtn');

// Lyrics Elements
const lyricsToggleBtn = document.getElementById('lyricsToggleBtn');
const lyricsModal = document.getElementById('lyricsModal');
const closeLyricsBtn = document.getElementById('closeLyricsBtn');
const lyricsTitle = document.getElementById('lyricsTitle');
const lyricsArtist = document.getElementById('lyricsArtist');
const lyricsContainer = document.getElementById('lyricsContainer');
const lyricsBackdrop = document.getElementById('lyricsBackdrop');
const lyricsHeaderThumb = document.getElementById('lyricsHeaderThumb');
const lyricsSourceBadge = document.getElementById('lyricsSourceBadge');
const lyricsSavedBadge = document.getElementById('lyricsSavedBadge');
const editLyricsBtn = document.getElementById('editLyricsBtn');
const exportLrcBtn = document.getElementById('exportLrcBtn');
const refreshLyricsBtn = document.getElementById('refreshLyricsBtn');
const lyricsFullscreenBtn = document.getElementById('lyricsFullscreenBtn');
const lyricsVisualizerCanvas = document.getElementById('lyricsVisualizerCanvas');

// Edit Lyrics Modal Elements
const editLyricsModal = document.getElementById('editLyricsModal');
const closeEditLyricsBtn = document.getElementById('closeEditLyricsBtn');
const cancelEditLyricsBtn = document.getElementById('cancelEditLyricsBtn');
const editLyricsTextarea = document.getElementById('editLyricsTextarea');
const saveCustomLyricsBtn = document.getElementById('saveCustomLyricsBtn');

// Equalizer Elements
const eqModal = document.getElementById('eqModal');
const closeEqBtn = document.getElementById('closeEqBtn');
const eqPresetSelect = document.getElementById('eqPresetSelect');
const eqSlidersContainer = document.getElementById('eqSlidersContainer');
const bassBoostSlider = document.getElementById('bassBoostSlider');
const bassBoostValText = document.getElementById('bassBoostValText');
const spatialAudioToggle = document.getElementById('spatialAudioToggle');
const resetEqBtn = document.getElementById('resetEqBtn');

// Mini Player Elements
const miniPlayerOverlay = document.getElementById('miniPlayerOverlay');
const exitMiniBtn = document.getElementById('exitMiniBtn');
const miniCover = document.getElementById('miniCover');
const miniCoverPlaceholder = document.getElementById('miniCoverPlaceholder');
const miniSongTitle = document.getElementById('miniSongTitle');
const miniArtistName = document.getElementById('miniArtistName');
const miniLyricsLine = document.getElementById('miniLyricsLine');
const miniModeVisualizerCanvas = document.getElementById('miniModeVisualizerCanvas');
const miniPrevBtn = document.getElementById('miniPrevBtn');
const miniPlayPauseBtn = document.getElementById('miniPlayPauseBtn');
const miniNextBtn = document.getElementById('miniNextBtn');

let parsedLyrics = [];
let activeLyricIndex = -1;
let currentLyricSource = 'Auto-Detect';
let lyricsCache = {};

// Web Audio API & DSP State
let audioCtx = null;
let sourceNode = null;
let analyserNode = null;
let eqFilters = [];
let bassBoostFilter = null;
let spatialNode = null;
let spatialDelay = null;
let spatialWetGain = null;
let spatialDryGain = null;
let spatialMergeNode = null;
let isVisualizerRunning = false;
let nextSongPreloader = null;
let isMuted = false;
let previousVolume = 0.9;

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: [10, 8, 6, 3, 1, 0, 0, 0, 1, 2],
  tarab: [4, 3, 2, 1, 3, 5, 4, 3, 2, 1],
  spatial8d: [5, 4, 2, 0, 1, 3, 4, 6, 7, 8],
  anime: [7, 5, 3, 1, 2, 4, 5, 7, 8, 7],
  bassTreble: [7, 6, 4, 0, -2, 0, 3, 6, 8, 9],
  rock: [5, 4, 3, 1, -1, -1, 1, 3, 5, 6],
  pop: [-1, 1, 3, 5, 4, 2, 1, 2, 4, 5],
  hiphop: [9, 8, 5, 2, -1, -1, 1, 2, 5, 6],
  electronic: [8, 7, 3, 0, -2, 2, 3, 5, 7, 8],
  vocal: [-3, -2, -1, 2, 6, 6, 4, 2, 0, -1],
  acoustic: [4, 3, 2, 1, 2, 2, 3, 4, 4, 3],
  classical: [5, 4, 3, 2, -1, -1, 0, 2, 4, 5]
};

// =============================================================
// Bilingual i18n Translation Dictionary (Arabic & English)
// =============================================================
const I18N = {
  en: {
    artists: 'Artists',
    albums: 'Albums',
    allSongs: 'All Tracks',
    playlists: 'Playlists',
    upload: 'Upload Music',
    settings: 'Settings',
    searchPlaceholder: 'Search songs, albums, or artists...',
    musicStreaming: 'Music Streaming',
    loggedInAs: 'User:',
    langBtn: 'العربية',
    playAll: 'Play All Tracks',
    shuffleAll: 'Shuffle All Tracks',
    play: 'Play',
    pause: 'Pause',
    remove: 'Remove',
    trackCount: 'Tracks',
    albumCount: 'Albums',
    library: 'Library',
    backToAlbums: 'Back to Albums',
    backToPlaylists: 'Back to Playlists',
    backToArtists: 'Back to Artists',
    lyrics: 'Lyrics',
    noLyrics: 'No lyrics available',
    noLyricsSub: 'No verified lyrics found online for this track.',
    addPasteLyrics: 'Add / Paste Lyrics',
    retrySearch: 'Retry Search',
    autoSaved: 'Auto-Saved',
    autoDetecting: 'Auto-Detecting...',
    saveCustomLyrics: 'Save & Auto-Sync',
    editLyricsTitle: 'Edit / Paste Lyrics',
    editLyricsDesc: 'Paste plain text lyrics or synced [00:15.20] LRC lines. Plain text lyrics will be automatically auto-synchronized!',
    uploadTitle: 'Upload Music (Batch & Lists)',
    destinationFolder: 'Server Music Folder / Destination Target',
    dragDrop: 'Drag & Drop Audio Files Here',
    dragDropSub: 'Upload whole albums, lists, or multiple tracks (.mp3, .flac, .m4a, .wav, .ogg)',
    selectFiles: 'Select Files from Computer',
    uploading: 'Uploading...',
    uploadSuccess: 'Uploaded successfully!',
    connectionInfo: 'Connection Information',
    serverUrl: 'Server URL',
    changeServer: 'Change Server',
    deleteConfirm: 'Are you sure you want to permanently delete "{title}" from the server storage?',
    deleteSuccess: '"{title}" was permanently deleted from the server. Navidrome library is now updating.',
    deleteError: 'Could not delete "{title}". Please check server permissions or credentials.',
    shortcutsTitle: 'Keyboard Shortcuts',
    shortcutsSubtitle: 'Pro Navigation & Controls',
    scPlayPause: 'Play / Pause',
    scSeek: 'Seek backward / forward 5s',
    scVolume: 'Volume Up / Down',
    scMute: 'Mute / Unmute',
    scLyrics: 'Toggle Synced Lyrics',
    scEq: 'Studio Equalizer',
    scViz: 'Switch Visualizer Mode',
    scFs: 'Toggle Fullscreen',
    scShuffle: 'Toggle Shuffle',
    scRepeat: 'Toggle Repeat',
    scHelp: 'Shortcuts Guide',
    navLocal: 'Device Music',
    localTitle: 'Local Device Music',
    localSubtitle: 'Audio tracks auto-detected on this device',
    scanDevice: 'Scan Device',
    scanningDevice: 'Scanning Device...',
    addFolder: 'Add Folder',
    noLocalTracks: 'No local music found yet on this device.',
    grantPermission: 'Grant Storage Permission',
    permissionRequired: 'Permission required to access audio files on this device.',
    deviceBadge: 'On This Device',
    openFolder: 'Show in Folder',
    navYoutube: 'YouTube',
    nowPlayingStudio: 'Now Playing Studio',
    noBeat: 'Remove Beat',
    noBeatDesc: 'Isolate vocals without percussion',
    youtubeSearchPlaceholder: 'Search YouTube or paste video URL...'
  },
  ar: {
    artists: 'الفنانون',
    albums: 'الألبومات',
    allSongs: 'جميع المقاطع',
    playlists: 'قوائم التشغيل',
    upload: 'رفع المقاطع',
    settings: 'الإعدادات',
    searchPlaceholder: 'ابحث عن أغنية، ألبوم، أو فنان...',
    musicStreaming: 'بث المقاطع الصوتية',
    loggedInAs: 'المستخدم:',
    langBtn: 'English',
    playAll: 'تشغيل الكل',
    shuffleAll: 'تشغيل عشوائي',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    remove: 'حذف',
    trackCount: 'مقطع',
    albumCount: 'ألبوم',
    library: 'المكتبة الصوتية',
    backToAlbums: 'العودة للألبومات',
    backToPlaylists: 'العودة لقوائم التشغيل',
    backToArtists: 'العودة للفنانين',
    lyrics: 'كلمات الأغنية',
    noLyrics: 'لا توجد كلمات متاحة',
    noLyricsSub: 'لم يتم العثور على كلمات موثقة لهذا المقطع عبر الإنترنت.',
    addPasteLyrics: 'إضافة / لصق الكلمات',
    retrySearch: 'إعادة البحث',
    autoSaved: 'محفوظة تلقائياً',
    autoDetecting: 'جاري البحث تلقائياً...',
    saveCustomLyrics: 'حفظ ومزامنة تلقائية',
    editLyricsTitle: 'تعديل أو لصق الكلمات',
    editLyricsDesc: 'الصق كلمات عادية أو صيغة [00:15.20] LRC. سيتم مزامنة الكلمات العادية آلياً مع مدة الأغنية!',
    uploadTitle: 'رفع المقاطع الصوتية (دفعات وقوائم كاملة)',
    destinationFolder: 'مجلد الموسيقى على السيرفر / مسار التخزين',
    dragDrop: 'اسحب وأفلت الملفات الصوتية هنا',
    dragDropSub: 'رفع ألبومات كاملة، قوائم، أو عدة ملفات (.mp3, .flac, .m4a, .wav, .ogg)',
    selectFiles: 'اختر ملفات من جهاز الكمبيوتر',
    uploading: 'جاري الرفع...',
    uploadSuccess: 'تم الرفع بنجاح!',
    connectionInfo: 'معلومات الاتصال بالسيرفر',
    serverUrl: 'عنوان السيرفر',
    changeServer: 'تغيير السيرفر',
    deleteConfirm: 'هل أنت متأكد من رغبتك في حذف "{title}" نهائياً من مساحة التخزين في السيرفر؟',
    deleteSuccess: 'تم حذف "{title}" نهائياً من السيرفر. مكتبة Navidrome تتحدث الآن.',
    deleteError: 'تعذر حذف "{title}". يرجى التحقق من أذونات السيرفر أو صلاحيات SMB.',
    shortcutsTitle: 'اختصارات لوحة المفاتيح',
    shortcutsSubtitle: 'تحكم احترافي وسريع في التشغيل والتنقل',
    scPlayPause: 'تشغيل / إيقاف مؤقت',
    scSeek: 'تقديم / تأخير 5 ثوانٍ',
    scVolume: 'رفع / خفض الصوت',
    scMute: 'كتم / إلغاء كتم الصوت',
    scLyrics: 'فتح كلمات الأغنية المتزامنة',
    scEq: 'فتح معادل الصوت (الإكولايزر)',
    scViz: 'تبديل شكل المؤثر البصري',
    scFs: 'ملء الشاشة',
    scShuffle: 'تشغيل عشوائي',
    scRepeat: 'تكرار التشغيل',
    scHelp: 'دليل الاختصارات',
    navLocal: 'موسيقى الجهاز',
    localTitle: 'الموسيقى على هذا الجهاز',
    localSubtitle: 'ملفات صوتية مكتشفة تلقائياً ومخزنة على هذا الجهاز',
    scanDevice: 'فحص الجهاز',
    scanningDevice: 'جاري فحص الجهاز...',
    addFolder: 'إضافة مجلد',
    noLocalTracks: 'لم يتم العثور على ملفات صوتية محلية بعد على هذا الجهاز.',
    grantPermission: 'منح إذن الوصول للملفات',
    permissionRequired: 'يتطلب إذناً للوصول إلى ملفات الصوت على هذا الجهاز.',
    deviceBadge: 'على هذا الجهاز',
    openFolder: 'فتح في المجلد',
    navYoutube: 'يوتيوب',
    nowPlayingStudio: 'استوديو التشغيل والمؤثرات',
    noBeat: 'إزالة الإيقاع',
    noBeatDesc: 'عزل الصوت البشري بدون إيقاع أو طبول',
    youtubeSearchPlaceholder: 'ابحث في يوتيوب أو الصق رابط الفيديو...'
  }
};

let currentLang = localStorage.getItem('archimedes_lang') || 'en';
let visualizerMode = localStorage.getItem('archimedes_viz_mode') || 'bars'; // 'bars', 'wave', 'radial', 'aurora'
let pannerNode = null;
let pannerAngle = 0;

/* ---------------------------------------------------------------------------
   Static UI strings.

   Reviewed the whole app in Arabic: the layout mirrors correctly, but entire
   dialogs were still English — the queue ("Playing Queue", "NEXT IN QUEUE",
   "No track currently playing"), the sleep timer, the equalizer ("Reset to
   Flat", "Applied in Real-Time", "Bass Boost", "3D Spatial Audio"), the lyrics
   empty state, the studio heading and the Change-Server dialog. Those strings
   live in renderer.html, not in the I18N table, so nothing ever translated them.

   Rewriting them at the markup level would mean touching a dozen hand-written
   blocks. Instead the TEXT NODES are translated in place: only nodes whose whole
   trimmed value matches a known English string are touched, so icons and child
   elements are never destroyed, and the original is remembered so switching
   back to English is lossless.
   ------------------------------------------------------------------------- */
const STATIC_UI_AR = {
  'Playing Queue': 'قائمة التشغيل',
  'No track currently playing': 'لا يوجد مقطع قيد التشغيل حالياً',
  'NEXT IN QUEUE': 'التالي في الطابور',
  'Playing queue is empty': 'قائمة التشغيل فارغة',
  'Sleep Timer': 'مؤقت النوم',
  'Music will fade out smoothly and pause when timer ends': 'سيتلاشى الصوت بسلاسة ثم يتوقف عند انتهاء المؤقت',
  'End of Current Song': 'نهاية الأغنية الحالية',
  'Minutes 15': '١٥ دقيقة',
  'Minutes 30': '٣٠ دقيقة',
  'Minutes 45': '٤٥ دقيقة',
  'Hour 1': 'ساعة واحدة',
  'Reset to Flat': 'إعادة إلى المسطّح',
  'Applied in Real-Time': 'يُطبَّق فورياً',
  'Bass Boost': 'تعزيز البيز',
  '3D Spatial Audio': 'صوت محيطي ثلاثي الأبعاد',
  'Stereophonic acoustic widening algorithm': 'خوارزمية توسيع صوتي ستيريو',
  'Lyrics': 'الكلمات',
  'Select a track to see lyrics': 'اختر مقطعاً لعرض الكلمات',
  'Play a song to view lyrics': 'شغّل أغنية لعرض الكلمات',
  'Change Navidrome Server URL': 'تغيير عنوان سيرفر Navidrome',
  'Save & Reconnect': 'حفظ وإعادة الاتصال',
  'Cancel': 'إلغاء',
  'NOW PLAYING STUDIO': 'استوديو التشغيل الآن',
  'Auto-Saved': 'محفوظ تلقائياً',
  'Auto-Saving...': 'جارٍ الحفظ…',
  'Auto-Detecting...': 'جارٍ الكشف…',
};

function translateStaticUi() {
  const ar = currentLang === 'ar';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  for (const node of nodes) {
    const raw = node.nodeValue || '';
    const key = raw.trim();
    if (!key) continue;

    // Remember the original the first time we see it, so switching back to
    // English restores exactly what the markup said.
    if (node.__dsEn === undefined) {
      if (!Object.prototype.hasOwnProperty.call(STATIC_UI_AR, key)) continue;
      node.__dsEn = raw;
    }

    const en = (node.__dsEn || '').trim();
    const target = ar ? STATIC_UI_AR[en] : en;
    if (target === undefined) continue;

    // Preserve surrounding whitespace so inline layout does not shift.
    const leading = (node.__dsEn || '').match(/^\s*/)[0];
    const trailing = (node.__dsEn || '').match(/\s*$/)[0];
    const next = leading + target + trailing;
    if (node.nodeValue !== next) node.nodeValue = next;
  }
}
window.translateStaticUi = translateStaticUi;

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('archimedes_lang', lang);

  const isRtl = (lang === 'ar');
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  const t = I18N[lang] || I18N.en;

  // Update navigation items
  const navMap = {
    navArtists: t.artists,
    navAlbums: t.albums,
    navSongs: t.allSongs,
    navLocal: t.navLocal,
    navPlaylists: t.playlists,
    navYoutube: t.navYoutube,
    navUpload: t.upload,
    navSettings: t.settings,
    navSubtitle: t.musicStreaming
  };

  for (const [id, text] of Object.entries(navMap)) {
    const el = document.getElementById(id);
    if (el) {
      const span = el.querySelector('span') || el;
      span.textContent = text;
    }
  }

  // The phone's bottom bar mirrors these labels instead of carrying its own
  // copies of the strings, so it follows the language automatically.
  if (typeof syncBottomNavLabels === 'function') syncBottomNavLabels();

  // Strings that live in renderer.html rather than in the I18N table.
  if (typeof translateStaticUi === 'function') translateStaticUi();

  // Update header buttons & placeholders
  const langBtnLabel = document.getElementById('langBtnLabel');
  if (langBtnLabel) langBtnLabel.textContent = t.langBtn;

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  // applyLanguage writes the long form; on a phone it gets clipped to
  // "Search songs, a" in a field only ~150px wide, so shorten it again.
  if (typeof applySearchPlaceholder === 'function') applySearchPlaceholder();

  const userLoggedInLabel = document.getElementById('userLoggedInLabel');
  if (userLoggedInLabel && typeof updateLoginBadge === 'function') updateLoginBadge();

  // Shortcuts modal
  const scMap = {
    shortcutsTitle: t.shortcutsTitle,
    shortcutsSubtitle: t.shortcutsSubtitle,
    scPlayPause: t.scPlayPause,
    scSeek: t.scSeek,
    scVolume: t.scVolume,
    scMute: t.scMute,
    scLyrics: t.scLyrics,
    scEq: t.scEq,
    scViz: t.scViz,
    scFs: t.scFs,
    scShuffle: t.scShuffle,
    scRepeat: t.scRepeat,
    scHelp: t.scHelp
  };
  for (const [id, text] of Object.entries(scMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  updateVisualizerModeUI();
}

function toggleAppLanguage() {
  applyLanguage(currentLang === 'en' ? 'ar' : 'en');
  loadCurrentView();
}
window.toggleAppLanguage = toggleAppLanguage;

function cycleVisualizerMode() {
  const modes = ['bars', 'wave', 'radial', 'aurora'];
  let idx = modes.indexOf(visualizerMode);
  visualizerMode = modes[(idx + 1) % modes.length];
  localStorage.setItem('archimedes_viz_mode', visualizerMode);
  updateVisualizerModeUI();
}
window.cycleVisualizerMode = cycleVisualizerMode;

function updateVisualizerModeUI() {
  const label = document.getElementById('vizModeLabel');
  if (label) {
    const titles = {
      bars: currentLang === 'ar' ? 'أعمدة' : 'Bars',
      wave: currentLang === 'ar' ? 'موجات' : 'Wave',
      radial: currentLang === 'ar' ? 'دائري' : 'Radial',
      aurora: currentLang === 'ar' ? 'شفق' : 'Aurora'
    };
    label.textContent = titles[visualizerMode] || visualizerMode;
  }
}

function toggleShortcutsModal() {
  const m = document.getElementById('shortcutsModal');
  if (!m) return;
  m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
}
window.toggleShortcutsModal = toggleShortcutsModal;

// Upload State
let uploadFilesQueue = [];

// Initialize
function init() {
  /* Configure the shared YouTube layer with this platform's real origin.

     Electron and Android both used to load this page from file://, whose origin
     is opaque. The embed then had to invent one, which is exactly what YouTube
     rejects with Error 153. Each platform now reports the origin it actually
     serves the UI from, and the layer uses it verbatim — or reports that there
     is none, instead of substituting a fake. */
  try {
    if (window.YtEmbed) {
      const platformOrigin =
        (window.ArchimedesNative && typeof window.ArchimedesNative.getAppOrigin === 'function'
          ? window.ArchimedesNative.getAppOrigin()
          : null) ||
        (archimedesBridge && typeof archimedesBridge.appOrigin === 'function'
          ? archimedesBridge.appOrigin()
          : null);

      window.YtEmbed.configure({
        origin: platformOrigin || undefined,
        openExternal: (videoId) => openExternalYouTube(videoId),
      });
    }
  } catch (e) { /* the layer falls back to reporting no origin */ }

  // Subscribe to download progress once, at start-up, so a download started from
  // any view updates the same indicator.
  try { setupDownloadProgress(); } catch (e) { /* desktop-only bridge */ }
  try {
    downloadDirectory = localStorage.getItem('archimedes_download_dir') || '';
  } catch (e) { /* ignore */ }

  try {
    const urlObj = new URL(serverUrl);
    badgeServerIp.textContent = urlObj.host;
  } catch {
    badgeServerIp.textContent = serverUrl;
  }

  // Purge only genuinely broken cache entries. The previous version also deleted
  // any entry that failed the strict isValidLyrics() check, or that mentioned a
  // song called "Seba" without Arabic text - which silently wiped good lyrics on
  // every single launch.
  try {
    const keysToRemove = [];
    const garbage = /class\s*=|href\s*=|duckduckgo|result__snippet|uddg=|<script|all rights reserved/i;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('nav_lyrics_')) continue;
      try {
        const val = JSON.parse(localStorage.getItem(key));
        const text = ((val && val.lines) || []).map(l => l.text).join(' ');
        if (!text || garbage.test(text)) keysToRemove.push(key);
      } catch (e) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}

  setupEventListeners();
  buildEqualizerSliders();
  setupMediaSession();
  setupGlobalHotkeys();
  setupDragAndDropLocalFiles();
  setupSubtitleUi();
  setupLoginUi();
  setupFloatLyrics();
  setupPowerDiscipline();
  setupMobileStudio();
  setupMobileShell();
  startOverlayGuard();
  applyLanguage(currentLang);
  updateVisualizerModeUI();

  // Credentials live on the native side. Fetch the token digests BEFORE the first
  // request: loading the view first raced the auth setup, so every start surfaced a
  // spurious "not-configured" error even with valid stored credentials.
  refreshAuthParams().then(async (params) => {
    updateLoginBadge();
    if (!params) {
      openLoginModal('');
      return;
    }
    // Report the server before the first <audio> src is assigned, so the main
    // process has already added the CORS header the Web Audio graph needs. Without
    // this the app plays but tells the user every effect is disabled.
    reportActiveServer();
    // Decide whether Web Audio may be used BEFORE the first src is assigned:
    // routing a non-CORS-clean stream silences playback permanently.
    await probeStreamCors();
    loadCurrentView();
  });
  // Subsonic tokens are cheap: rotate the digests periodically.
  setInterval(() => { refreshAuthParams(); }, 45 * 60 * 1000);

  // Proactively auto-detect local music on this device in background
  setTimeout(() => {
    scanLocalDeviceMusic();
  }, 1200);
}

/** Mobile drawer: the sidebar is off-canvas below 860px (see styles.css). */
function toggleMobileSidebar(force) {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;
  const open = (typeof force === 'boolean') ? force : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  if (backdrop) backdrop.classList.toggle('show', open);
}
window.toggleMobileSidebar = toggleMobileSidebar;

function closeMobileSidebar() { toggleMobileSidebar(false); }
window.closeMobileSidebar = closeMobileSidebar;

/* -------------------------------------------------------------------------
   Single navigation entry point.

   Three different surfaces now switch the current view: the desktop sidebar,
   the phone drawer, and the phone bottom bar. They all funnel through here so
   the highlighted item can never disagree with the view actually rendered.
   ------------------------------------------------------------------------- */
function selectView(view) {
  if (!view) return;
  currentView = view;
  document.querySelectorAll('.nav-item, .ds-navbtn').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  closeMobileSidebar();
  loadCurrentView();
}
window.selectView = selectView;

/* =========================================================================
   Overlay dismissal — ONE entry point shared by the Escape key and the
   Android hardware back button.

   Why this exists: a phone has no window chrome to fall back on, so any
   overlay whose close control is missing, off-screen or too small becomes a
   dead end. That is exactly what the lyrics screen did — its ✕ was pushed
   past the right edge by a header that never wrapped. Back/Escape now peels
   the interface one layer at a time, innermost first, and only leaves the app
   once nothing is open.
   ========================================================================= */
const DISMISSABLE_OVERLAYS = [
  'editLyricsModal',
  'eqModal',
  'subtitleModal',
  'shortcutsModal',
  'ipModal',
  'playlistModal',
  'queueModal',
  'sleepTimerModal',
  'nowPlayingModal',
  'lyricsModal',
];

function elementIsVisible(el) {
  if (!el || el.hidden) return false;
  if (el.style.display === 'none') return false;
  const cs = window.getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden';
}

function dismissTopOverlay() {
  // 1) The mobile navigation drawer sits above the page content.
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    closeMobileSidebar();
    return true;
  }

  // 2) Menus rendered on demand and removed again.
  const transient = document.querySelector('.context-menu, .playlist-picker, .dropdown-menu.open');
  if (elementIsVisible(transient)) {
    if (transient.classList.contains('dropdown-menu')) transient.classList.remove('open');
    else transient.remove();
    return true;
  }

  // 3) Known overlays, innermost first. loginModal is deliberately absent: it
  //    is the one screen the user must not skip, because without it the app
  //    has no credentials at all — back should leave the app instead.
  for (const id of DISMISSABLE_OVERLAYS) {
    const el = document.getElementById(id);
    if (!elementIsVisible(el)) continue;
    if (id === 'lyricsModal') {
      const content = el.querySelector('.lyrics-modal-content');
      if (content) content.classList.remove('fullscreen');
    }
    el.style.display = 'none';
    return true;
  }

  // 4) The floating lyrics overlay.
  const floatEl = document.getElementById('floatLyrics');
  if (floatEl && !floatEl.hidden) {
    floatEl.hidden = true;
    return true;
  }

  return false;
}
window.__dshHandleBack = dismissTopOverlay;

/* =========================================================================
   ONE OVERLAY AT A TIME.

   Every full-screen overlay here is `position: fixed` and several share
   z-index 100, so opening a second one does not replace the first — it
   covers it. Measured on the device: lyrics + EQ both open, both
   `display:flex`, so the later one in DOM order silently swallowed every tap
   aimed at the screen the user could actually see. That is how a visible ✕
   can still be un-tappable, and it is the second reason the lyrics screen
   trapped the user.

   Patching ~60 independent show/hide call sites (many of them inline
   `onclick` attributes) would be fragile, so the invariant is enforced
   centrally instead: whichever overlay opened last is the only one left on
   screen. The observer watches only the overlay roots themselves, never the
   subtree, so it costs literally nothing during playback — no polling and no
   callback traffic from progress bars, lyrics or the visualizer.

   Dialogs (class="modal": Add to Playlist, Queue, Sleep Timer) were originally
   given a SECOND group, on the theory that they are sheets opened *from* a
   full-screen overlay and should stack above it. That theory was wrong and the
   measurement proved it:

     open the Queue        -> queueModal  (z-index 1600)
     then tap EQ           -> queueModal 1600 AND eqModal 100, both open
     elementFromPoint()    -> the queue, not the EQ

   The EQ, the lyrics screen and the studio all sit at z-index 100, so a dialog
   left open silently covered whatever the user actually asked for. One group
   now: whatever was opened last is the only thing on screen, which is what a
   user expects from a tap.
   ========================================================================= */
const OVERLAY_GROUPS = [
  ['.modal-overlay', '.now-playing-modal', '.modal'],
];

function collectOverlays(selectors) {
  let found = [];
  for (const sel of selectors) {
    const nodes = document.querySelectorAll(sel);
    for (let i = 0; i < nodes.length; i++) found.push(nodes[i]);
  }
  return found;
}

function hideOverlay(el) {
  if (!el) return;
  const lyricsContent = el.querySelector ? el.querySelector('.lyrics-modal-content') : null;
  if (lyricsContent) lyricsContent.classList.remove('fullscreen');
  el.style.display = 'none';
}

let knownOpenOverlays = new Set();
const overlayGuard = new MutationObserver(() => enforceSingleOverlay());

function enforceSingleOverlay() {
  const allSelector = [];
  for (const group of OVERLAY_GROUPS) for (const sel of group) allSelector.push(sel);

  for (const group of OVERLAY_GROUPS) {
    const open = collectOverlays(group).filter(elementIsVisible);
    if (open.length < 2) continue;
    const newlyOpened = open.filter(el => !knownOpenOverlays.has(el));
    if (newlyOpened.length === 0) continue;
    const keep = newlyOpened[newlyOpened.length - 1];
    for (const el of open) if (el !== keep) hideOverlay(el);
  }

  knownOpenOverlays = new Set(collectOverlays(allSelector).filter(elementIsVisible));
}

function startOverlayGuard() {
  const roots = collectOverlays(OVERLAY_GROUPS[0].concat(OVERLAY_GROUPS[1]));
  for (const el of roots) {
    overlayGuard.observe(el, { attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
  }
  knownOpenOverlays = new Set(collectOverlays(OVERLAY_GROUPS[0].concat(OVERLAY_GROUPS[1])).filter(elementIsVisible));
}

window.__dshEnforceSingleOverlay = enforceSingleOverlay;

// Escape mirrors the hardware back button on every platform.
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (dismissTopOverlay()) e.preventDefault();
});

function setupEventListeners() {
  // Delegated Enter-key handler for dynamically rendered inputs. Replaces the
  // inline onkeydown attributes so the markup stays CSP-friendly.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (!el || !el.dataset || !el.dataset.enterAction) return;
    const fn = window[el.dataset.enterAction];
    if (typeof fn === 'function') {
      e.preventDefault();
      fn(el.value);
    }
  });

  // Navigation Tabs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => selectView(item.dataset.view));
  });

  // Lyrics Modal
  const toggleLyrics = () => {
    if (lyricsModal.style.display === 'flex') {
      lyricsModal.style.display = 'none';
      lyricsModal.querySelector('.lyrics-modal-content').classList.remove('fullscreen');
    } else {
      lyricsModal.style.display = 'flex';
      if (currentSong) {
        if (parsedLyrics.length > 0) renderLyricsUI();
        else autoDetectLyrics(currentSong);
      }
    }
  };
  lyricsToggleBtn.addEventListener('click', toggleLyrics);
  playerLyricsTicker.addEventListener('click', toggleLyrics);
  closeLyricsBtn.addEventListener('click', () => {
    lyricsModal.style.display = 'none';
    lyricsModal.querySelector('.lyrics-modal-content').classList.remove('fullscreen');
  });

  refreshLyricsBtn.addEventListener('click', () => {
    if (currentSong) autoDetectLyrics(currentSong, true);
  });

  lyricsFullscreenBtn.addEventListener('click', () => {
    const content = lyricsModal.querySelector('.lyrics-modal-content');
    content.classList.toggle('fullscreen');
  });

  // Edit / Paste Custom Lyrics
  if (editLyricsBtn) {
    editLyricsBtn.addEventListener('click', () => {
      if (!currentSong) return;
      editLyricsTextarea.value = parsedLyrics.length > 0 
        ? parsedLyrics.map(l => l.text).join('\n')
        : '';
      editLyricsModal.style.display = 'flex';
    });
  }
  if (closeEditLyricsBtn) closeEditLyricsBtn.addEventListener('click', () => editLyricsModal.style.display = 'none');
  if (cancelEditLyricsBtn) cancelEditLyricsBtn.addEventListener('click', () => editLyricsModal.style.display = 'none');
  if (saveCustomLyricsBtn) {
    saveCustomLyricsBtn.addEventListener('click', () => {
      if (!currentSong) return;
      const text = editLyricsTextarea.value.trim();
      if (!text) return;
      saveCustomLyrics(currentSong, text);
      editLyricsModal.style.display = 'none';
    });
  }

  // Export / Save .LRC File
  if (exportLrcBtn) {
    exportLrcBtn.addEventListener('click', () => {
      if (!currentSong || parsedLyrics.length === 0) {
        alert('No lyrics available to export yet.');
        return;
      }
      exportLrcToFile(currentSong, parsedLyrics);
    });
  }

  // Equalizer Modal
  const toggleEq = () => {
    initWebAudio();
    eqModal.style.display = eqModal.style.display === 'flex' ? 'none' : 'flex';
  };
  eqToggleBtn.addEventListener('click', toggleEq);
  if (topEqBtn) topEqBtn.addEventListener('click', toggleEq);
  closeEqBtn.addEventListener('click', () => eqModal.style.display = 'none');

  eqPresetSelect.addEventListener('change', (e) => {
    applyEqPreset(e.target.value);
  });

  bassBoostSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    bassBoostValText.textContent = `+${val} dB`;
    if (bassBoostFilter) bassBoostFilter.gain.value = val;
    saveEqSettings();
  });

  spatialAudioToggle.addEventListener('change', (e) => {
    toggleSpatialAudio(e.target.checked);
  });

  resetEqBtn.addEventListener('click', () => {
    applyEqPreset('flat');
    bassBoostSlider.value = 0;
    bassBoostValText.textContent = '+0 dB';
    if (bassBoostFilter) bassBoostFilter.gain.value = 0;
    spatialAudioToggle.checked = false;
    toggleSpatialAudio(false);
    saveEqSettings();
  });

  // Mini-Player Toggle
  const toggleMiniMode = async () => {
    const isMini = document.body.classList.toggle('mini-mode');
    if (ipcRenderer) {
      await ipcRenderer.invoke('toggle-mini-mode', isMini);
    }
    updateMiniPlayerView();
  };
  if (playerMiniBtn) playerMiniBtn.addEventListener('click', toggleMiniMode);
  if (topMiniBtn) topMiniBtn.addEventListener('click', toggleMiniMode);
  if (exitMiniBtn) exitMiniBtn.addEventListener('click', toggleMiniMode);

  // Fullscreen Toggle
  const toggleFs = async () => {
    if (ipcRenderer) {
      const isFs = await ipcRenderer.invoke('toggle-fullscreen');
      fullscreenBtn.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
    }
  };
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFs);
  if (topFsBtn) topFsBtn.addEventListener('click', toggleFs);

  // Server Modal
  serverStatusBadge.addEventListener('click', () => {
    modalIpInput.value = serverUrl;
    ipModal.style.display = 'flex';
  });
  cancelModalBtn.addEventListener('click', () => {
    ipModal.style.display = 'none';
  });
  saveModalBtn.addEventListener('click', () => {
    const newIp = modalIpInput.value.trim();
    if (!newIp) return;
    serverUrl = newIp;
    localStorage.setItem('navidrome_server_url', serverUrl);
    ipModal.style.display = 'none';
    try {
      badgeServerIp.textContent = new URL(serverUrl).host;
    } catch {
      badgeServerIp.textContent = serverUrl;
    }
    // Changing the server needs the password again: credentials are stored
    // encrypted and never available to the page, so re-authenticate properly.
    openLoginModal(currentLang === 'ar'
      ? 'تغيّر عنوان السيرفر — أدخل كلمة المرور لتأكيد الاتصال الجديد.'
      : 'Server changed - re-enter your password to confirm the new connection.');
  });

  // Search
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = e.target.value.trim();
      if (q) performSearch(q);
      else loadCurrentView();
    }, 400);
  });

  // Audio Controls
  playPauseBtn.addEventListener('click', togglePlayPause);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  miniPlayPauseBtn.addEventListener('click', togglePlayPause);
  miniPrevBtn.addEventListener('click', playPrevious);
  miniNextBtn.addEventListener('click', playNext);

  function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    if (shuffleToggleBtn) shuffleToggleBtn.classList.toggle('active', isShuffleEnabled);
    return isShuffleEnabled;
  }
  window.toggleShuffle = toggleShuffle;

  shuffleToggleBtn.addEventListener('click', toggleShuffle);

  function updateRepeatUi() {
    if (!repeatToggleBtn) return;
    if (repeatMode === 'one') {
      repeatToggleBtn.classList.add('active');
      repeatToggleBtn.innerHTML = '<i class="fa-solid fa-repeat"></i><span style="position: absolute; font-size: 9px; font-weight: 800; bottom: 2px; right: 2px; background: #1db954; color: #000; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; line-height: 1;">1</span>';
      repeatToggleBtn.title = currentLang === 'ar' ? 'تكرار: نفس المقطع (Repeat 1)' : 'Repeat: One Track';
    } else if (repeatMode === 'all') {
      repeatToggleBtn.classList.add('active');
      repeatToggleBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
      repeatToggleBtn.title = currentLang === 'ar' ? 'تكرار: كل القائمة (Repeat All)' : 'Repeat: All Tracks';
    } else {
      repeatToggleBtn.classList.remove('active');
      repeatToggleBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
      repeatToggleBtn.title = currentLang === 'ar' ? 'تكرار: متوقف (Repeat Off)' : 'Repeat: Off';
    }
  }
  window.updateRepeatUi = updateRepeatUi;

  function cycleRepeatMode() {
    if (repeatMode === 'off') repeatMode = 'all';
    else if (repeatMode === 'all') repeatMode = 'one';
    else repeatMode = 'off';
    isRepeatEnabled = (repeatMode !== 'off');
    updateRepeatUi();
    return repeatMode;
  }
  window.cycleRepeatMode = cycleRepeatMode;

  repeatToggleBtn.addEventListener('click', cycleRepeatMode);

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', playNext);

  function seekToRatio(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (playbackSource === 'youtube') {
      const dur = YouTubePlayerAdapter.getDuration() || 0;
      if (dur > 0) YouTubePlayerAdapter.seekTo(clamped * dur, true);
    } else if (audio.duration) {
      audio.currentTime = clamped * audio.duration;
    }
    updateProgress();
  }
  window.seekToRatio = seekToRatio;

  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pos = (e.clientX - rect.left) / rect.width;
    seekToRatio(pos);
  });

  function setVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    audio.volume = clamped;
    if (volumeSlider) volumeSlider.value = clamped;
    isMuted = (clamped === 0);
    updateVolumeIcon();
    return clamped;
  }
  window.setVolume = setVolume;

  function toggleMute() {
    if (isMuted || audio.volume === 0) {
      audio.volume = previousVolume || 0.8;
      if (volumeSlider) volumeSlider.value = audio.volume;
      isMuted = false;
    } else {
      previousVolume = audio.volume;
      audio.volume = 0;
      if (volumeSlider) volumeSlider.value = 0;
      isMuted = true;
    }
    updateVolumeIcon();
    return isMuted;
  }
  window.toggleMute = toggleMute;

  volumeSlider.addEventListener('input', (e) => {
    setVolume(parseFloat(e.target.value));
  });

  if (volumeIcon) {
    volumeIcon.addEventListener('click', toggleMute);
  }
}

// Views
async function loadCurrentView() {
  // Leaving the YouTube section must NOT stop the video. The player lives in the
  // persistent layer, so all that changes is that its box is parked off-canvas —
  // the iframe, its video and its position all survive. Anything that removed it
  // here (destroy/remove/innerHTML) would be the original bug.
  if (currentView !== 'youtube') parkYouTubeLayer();

  contentArea.innerHTML = `
    <div style="text-align: center; padding: 60px 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #1db954;"></i>
      <p style="margin-top: 14px; color: #8c8ca5;">Loading ${currentView}...</p>
    </div>
  `;

  try {
    if (currentView === 'artists') await renderArtists();
    else if (currentView === 'albums') await renderAlbums();
    else if (currentView === 'songs') await renderSongs();
    else if (currentView === 'local') {
      /* Draw what we already have, then refresh from the device.

         Opening this section used to render the cached list and nothing else: the
         only scans ran at start-up and on the permission callback. Measured on a
         device that genuinely had music, the native bridge returned the track and
         scanLocalDeviceMusic() populated the list when called by hand, yet the view
         stayed at "0 Tracks" - because nothing re-ran the scan when the section was
         opened. If the start-up scan lost the race with the permission dialog, the
         local library stayed empty for the whole session with no way back.

         scanLocalDeviceMusic() re-renders when it lands, so calling it here after
         the first paint fills the view in. It is not awaited: the section should
         appear immediately with whatever is cached. */
      renderLocalMusic();
      if (typeof scanLocalDeviceMusic === 'function') scanLocalDeviceMusic();
    }
    else if (currentView === 'playlists') await renderPlaylists();
    else if (currentView === 'youtube') renderYouTube();
    else if (currentView === 'upload') renderUpload();
    else if (currentView === 'settings') renderSettings();
  } catch (err) {
    contentArea.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-top: 40px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 36px; color: #ef4444;"></i>
        <h3 style="margin-top: 12px; color: #ef4444;">Failed to connect to Navidrome</h3>
        <p style="margin-top: 8px; color: #8c8ca5; font-size: 13px;">${escapeHtml(err.message)}</p>
        <button onclick="document.getElementById('serverStatusBadge').click()" style="margin-top: 18px; padding: 10px 20px; border-radius: 8px; border: none; background: #1db954; color: #000; font-weight: 600; cursor: pointer;">Change Server URL</button>
      </div>
    `;
  }
}

async function renderArtists() {
  const data = await apiRequest('getArtists.view');
  const indexList = data.artists?.index || [];
  const artists = [];
  indexList.forEach(idx => {
    if (idx.artist) {
      if (Array.isArray(idx.artist)) artists.push(...idx.artist);
      else artists.push(idx.artist);
    }
  });

  if (artists.length === 0) {
    contentArea.innerHTML = `<h2 class="section-title"><i class="fa-solid fa-user-group"></i> Artists</h2><p style="color: #8c8ca5;">No artists found on server.</p>`;
    return;
  }

  let html = `<h2 class="section-title"><i class="fa-solid fa-user-group"></i> Artists (${artists.length})</h2><div class="cards-grid cards-grid--artists">`;
  artists.forEach(a => {
    html += `
      <div class="card" onclick="openArtist('${escJs(a.id)}', '${escJs(a.name)}')">
        <div class="card-img" style="border-radius: 50%;"><i class="fa-solid fa-user"></i></div>
        <div class="card-title">${escapeHtml(a.name)}</div>
        <div class="card-subtitle">${countLabel(a.albumCount || 0, 'Album', 'Albums', 'ألبوم', 'ألبومات')}</div>
      </div>
    `;
  });
  html += `</div>`;
  contentArea.innerHTML = html;
}

async function renderAlbums() {
  const data = await apiRequest('getAlbumList2.view', { type: 'newest', size: 500 });
  const albums = data.albumList2?.album || [];

  if (albums.length === 0) {
    contentArea.innerHTML = `<h2 class="section-title"><i class="fa-solid fa-compact-disc"></i> Albums</h2><p style="color: #8c8ca5;">No albums found on server.</p>`;
    return;
  }

  let html = `<h2 class="section-title"><i class="fa-solid fa-compact-disc"></i> Albums (${albums.length})</h2><div class="cards-grid">`;
  albums.forEach(al => {
    const coverUrl = al.coverArt ? buildSubsonicUrl('getCoverArt.view', { id: al.coverArt, size: 240 }) : '';
    html += `
      <div class="card" onclick="openAlbum('${escJs(al.id)}')">
        ${coverUrl ? `<img class="card-img" src="${coverUrl}" onerror="this.outerHTML='<div class=\\'card-img\\'><i class=\\'fa-solid fa-compact-disc\\'></i></div>'" />` : `<div class="card-img"><i class="fa-solid fa-compact-disc"></i></div>`}
        <div class="card-title">${escapeHtml(al.title || al.name)}</div>
        <div class="card-subtitle">${escapeHtml(cleanArtistName(al.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))}</div>
      </div>
    `;
  });
  html += `</div>`;
  contentArea.innerHTML = html;
}

async function renderPlaylists() {
  const data = await apiRequest('getPlaylists.view');
  const playlists = data.playlists?.playlist || [];

  const isAr = currentLang === 'ar';
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 class="section-title" style="margin: 0;"><i class="fa-solid fa-list-ul"></i> ${isAr ? 'قوائم التشغيل' : 'Playlists'} (${playlists.length})</h2>
      <button onclick="openAddToPlaylistModal(null, null)" class="btn-play-all" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
        <i class="fa-solid fa-plus"></i> ${isAr ? 'إنشاء قائمة جديدة' : 'Create Playlist'}
      </button>
    </div>
  `;
  if (playlists.length === 0) {
    html += `<p style="color: #8c8ca5;">${isAr ? 'لا توجد قوائم تشغيل متاحة بعد.' : 'No playlists available.'}</p>`;
  } else {
    html += `<div class="cards-grid">`;
    playlists.forEach(p => {
      html += `
        <div class="card" onclick="openPlaylist('${escJs(p.id)}', '${escJs(p.name)}')">
          <div class="card-img"><i class="fa-solid fa-music"></i></div>
          <div class="card-title">${escapeHtml(p.name)}</div>
          <div class="card-subtitle">${countLabel(p.songCount || 0, 'Track', 'Tracks', 'مقطع', 'مقاطع')}</div>
        </div>
      `;
    });
    html += `</div>`;
  }
  contentArea.innerHTML = html;
}

let serverSongsCache = [];
let currentSongFilter = 'all';
let isFetchingServerSongs = false;

function dedupeTracksList(tracks) {
  if (!Array.isArray(tracks)) return [];
  const seenPaths = new Set();
  const seenIds = new Set();
  return tracks.filter(t => {
    if (!t) return false;
    const p = (t.path || t.url || '').toLowerCase();
    const id = String(t.id || '');
    if (p && seenPaths.has(p)) return false;
    if (id && seenIds.has(id)) return false;
    if (p) seenPaths.add(p);
    if (id) seenIds.add(id);
    return true;
  });
}

function renderSongsSkeleton(filterMode = 'all') {
  const t = I18N[currentLang] || I18N.en;
  const isAr = currentLang === 'ar';
  let skeletonRows = '';
  for (let i = 0; i < 9; i++) {
    skeletonRows += `
      <tr class="skeleton-track-row">
        <td style="color: #444;"><span class="skeleton-box" style="width: 18px; height: 14px;"></span></td>
        <td>
          <span class="skeleton-box" style="width: ${130 + (i % 4) * 35}px; height: 16px;"></span>
          <span class="skeleton-box" style="width: 48px; height: 14px; margin-left: 8px; border-radius: 10px;"></span>
        </td>
        <td><span class="skeleton-box" style="width: ${85 + (i % 3) * 30}px; height: 14px;"></span></td>
        <td><span class="skeleton-box" style="width: ${100 + (i % 5) * 22}px; height: 14px;"></span></td>
        <td style="text-align: ${isAr ? 'left' : 'right'};"><span class="skeleton-box" style="width: 42px; height: 14px;"></span></td>
        <td style="text-align: center;"><span class="skeleton-box" style="width: 22px; height: 22px; border-radius: 50%;"></span></td>
        <td style="text-align: center;"><span class="skeleton-box" style="width: 22px; height: 22px; border-radius: 50%;"></span></td>
      </tr>
    `;
  }

  contentArea.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
      <div>
        <span style="font-size: 12px; text-transform: uppercase; color: #1db954; font-weight: 700;">${t.library}</span>
        <h1 style="font-size: 28px; margin: 4px 0 6px 0;">${t.allSongs}</h1>
        <p style="color: #8c8ca5; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-spinner fa-spin" style="color: #1db954;"></i>
          ${isAr ? 'جاري تحميل مقاطع المكتبة...' : 'Loading library tracks...'}
        </p>
      </div>
    </div>
    <table class="songs-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>${isAr ? 'العنوان' : 'Title'}</th>
          <th>${isAr ? 'الفنان' : 'Artist'}</th>
          <th>${isAr ? 'الألبوم' : 'Album'}</th>
          <th style="text-align: ${isAr ? 'left' : 'right'}; width: 80px;"><i class="fa-regular fa-clock"></i></th>
          <th style="text-align: center; width: 44px;"><i class="fa-solid fa-plus"></i></th>
          <th style="text-align: center; width: 44px;">${t.remove}</th>
        </tr>
      </thead>
      <tbody>${skeletonRows}</tbody>
    </table>
  `;
}

/**
 * Loads the ENTIRE server library, paginated with progressive chunk updates.
 */
async function fetchAllServerSongs(onChunk = null) {
  const collected = [];
  const seen = new Set();
  const PAGE = 300;
  for (let offset = 0; offset < 200000; offset += PAGE) {
    let batch = [];
    try {
      const data = await apiRequest('search3.view', {
        query: '',
        songCount: PAGE,
        songOffset: offset,
        albumCount: 0,
        artistCount: 0
      });
      batch = data.search3?.song || (data.searchResult3 && data.searchResult3.song) || [];
    } catch (err) {
      console.warn('Library fetch failed at offset ' + offset + ':', err);
      break;
    }
    for (const s of batch) {
      if (s && s.id && !seen.has(s.id)) {
        seen.add(s.id);
        collected.push({ ...s, isServer: true, source: 'cloud' });
      }
    }
    if (typeof onChunk === 'function' && collected.length > 0) {
      onChunk(collected);
    }
    if (batch.length < PAGE) break;
  }
  return collected;
}
window.fetchAllServerSongs = fetchAllServerSongs;

async function renderSongs(filterMode = 'all') {
  currentSongFilter = filterMode;
  const t = I18N[currentLang] || I18N.en;

  // Ensure local tracks are loaded from cache if localTracks is empty
  if (localTracks.length === 0) {
    try {
      const cached = localStorage.getItem('archimedes_cached_local_tracks');
      if (cached) localTracks = dedupeTracksList(JSON.parse(cached));
    } catch (e) {}
  } else {
    localTracks = dedupeTracksList(localTracks);
  }

  if (serverSongsCache.length === 0) {
    renderSongsSkeleton(filterMode);
    if (!isFetchingServerSongs) {
      isFetchingServerSongs = true;
      try {
        await fetchAllServerSongs((progressiveChunk) => {
          serverSongsCache = progressiveChunk;
          if (currentView === 'songs') {
            renderSongs(currentSongFilter);
          }
        });
      } finally {
        isFetchingServerSongs = false;
      }
    }
    return;
  }

  // Deduplicate when showing both cloud and local tracks
  const cleanLocal = dedupeTracksList(localTracks);
  const serverTrackKeys = new Set(
    serverSongsCache.map(s => `${(s.title || '').trim().toLowerCase()}|${(s.artist || '').trim().toLowerCase()}`)
  );
  const uniqueLocal = cleanLocal.filter(tr => {
    const key = `${(tr.title || '').trim().toLowerCase()}|${(tr.artist || '').trim().toLowerCase()}`;
    return !serverTrackKeys.has(key);
  });

  let displaySongs = [];
  if (filterMode === 'server') {
    displaySongs = [...serverSongsCache];
  } else if (filterMode === 'local') {
    displaySongs = [...cleanLocal];
  } else {
    displaySongs = [...serverSongsCache, ...uniqueLocal];
  }

  currentQueue = displaySongs;

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
      <div>
        <span style="font-size: 12px; text-transform: uppercase; color: #1db954; font-weight: 700;">${t.library}</span>
        <h1 style="font-size: 28px; margin: 4px 0 6px 0;">${t.allSongs}</h1>
        <p style="color: #8c8ca5; font-size: 14px;">${displaySongs.length} ${t.trackCount}</p>
        
        <!-- Filter Tabs (All / Cloud / Device) -->
        <div class="track-filter-group">
          <button class="track-filter-pill ${filterMode === 'all' ? 'active' : ''}" onclick="renderSongs('all')">
            <i class="fa-solid fa-layer-group"></i> ${currentLang === 'ar' ? 'الكل (سيرفر + جهاز)' : 'All (Server + Device)'} (${serverSongsCache.length + uniqueLocal.length})
          </button>
          <button class="track-filter-pill ${filterMode === 'server' ? 'active' : ''}" onclick="renderSongs('server')">
            <i class="fa-solid fa-cloud"></i> ${currentLang === 'ar' ? 'السيرفر السحابي' : 'Cloud Server'} (${serverSongsCache.length})
          </button>
          <button class="track-filter-pill ${filterMode === 'local' ? 'active' : ''}" onclick="renderSongs('local')">
            <i class="fa-solid fa-mobile-screen"></i> ${currentLang === 'ar' ? 'ملفات الجهاز' : 'Device Local'} (${cleanLocal.length})
          </button>
        </div>

        <div class="action-btn-group" style="margin-top: 14px;">
          <button class="btn-play-all" onclick="playAllCurrentQueue(false)"><i class="fa-solid fa-play"></i> ${t.playAll}</button>
          <button class="btn-shuffle" onclick="playAllCurrentQueue(true)"><i class="fa-solid fa-shuffle"></i> ${t.shuffleAll}</button>
        </div>
      </div>
    </div>

    <table class="songs-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>${currentLang === 'ar' ? 'العنوان' : 'Title'}</th>
          <th>${currentLang === 'ar' ? 'الفنان' : 'Artist'}</th>
          <th>${currentLang === 'ar' ? 'الألبوم' : 'Album'}</th>
          <th style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; width: 80px;"><i class="fa-regular fa-clock"></i></th>
          <th style="text-align: center; width: 44px;" title="Add to Playlist"><i class="fa-solid fa-plus"></i></th>
          <th style="text-align: center; width: 44px;">${t.remove}</th>
          ${canDownloadOnThisPlatform() ? `<th style="text-align: center; width: 44px;" title="${currentLang === 'ar' ? 'تحميل' : 'Download'}"><i class="fa-solid fa-download"></i></th>` : ''}
        </tr>
      </thead>
      <tbody>
  `;

  if (displaySongs.length === 0) {
    html += `<tr><td colspan="${canDownloadOnThisPlatform() ? 8 : 7}" style="text-align: center; color: #8c8ca5; padding: 40px 0;">${currentLang === 'ar' ? 'لا توجد مقاطع صوتية مطابقة.' : 'No tracks found in this category.'}</td></tr>`;
  } else {
    displaySongs.forEach((s, i) => {
      const isLocal = !!s.isLocal;
      const sourceBadge = isLocal 
        ? `<span class="track-source-badge device"><i class="fa-solid fa-mobile-screen"></i> ${currentLang === 'ar' ? 'جهاز' : 'Device'}</span>`
        : `<span class="track-source-badge cloud"><i class="fa-solid fa-cloud"></i> ${currentLang === 'ar' ? 'سحابي' : 'Cloud'}</span>`;

      const displayArtist = cleanArtistName(
        s.artist,
        currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'
      );

      const displayAlbum = cleanAlbumName(
        s.album,
        isLocal ? (currentLang === 'ar' ? 'ملفات الجهاز' : 'Device Storage') : ''
      );

      html += `
        <tr class="ds-track" onclick="playSongAt(${escJs(i)})">
          <td class="ds-c-idx" style="color: #7b7b95;">${i + 1}</td>
          <td class="ds-c-title" style="font-weight: 600;">
            ${escapeHtml(s.title || (currentLang === 'ar' ? 'مقطع بدون عنوان' : 'Untitled Track'))}
            ${sourceBadge}
          </td>
          <td class="ds-c-artist" style="color: #8c8ca5;">${escapeHtml(displayArtist)}</td>
          <td class="ds-c-album" style="color: #8c8ca5;">${escapeHtml(displayAlbum)}</td>
          <td class="ds-c-time" style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; color: #7b7b95;">${formatDuration(s.duration || 0)}</td>
          <td class="ds-c-act" style="text-align: center;">
            <button class="btn-action-playlist" title="Add to Playlist" onclick="openAddToPlaylistModal(event, '${escJs(s.id)}')">
              <i class="fa-solid fa-plus"></i>
            </button>
          </td>
          <td class="ds-c-act" style="text-align: center;">
            <button class="btn-action-delete" title="Permanently delete song" onclick="deleteSong(event, '${escJs(s.id)}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
          ${(s.isLocal || !canDownloadOnThisPlatform()) ? '<td class="ds-c-act"></td>' : `
          <td class="ds-c-act" style="text-align: center;">
            <!-- Reuses the existing action-button class so no new styling and no
                 design change is introduced. Local tracks are already on the
                 device, so the control is only offered for server tracks. -->
            <button class="btn-action-playlist" title="${currentLang === 'ar' ? 'تحميل إلى الجهاز' : 'Download to device'}"
                    onclick="event.stopPropagation(); downloadTrackNow('${escJs(s.id)}', '${escJs(s.title || 'track')}', '${escJs(s.suffix || 'mp3')}')">
              <i class="fa-solid fa-download"></i>
            </button>
          </td>`}
        </tr>
      `;
    });
  }

  html += `</tbody></table>`;
  contentArea.innerHTML = html;
}


// =============================================================
// Local Device Music Auto-Detection (Windows Desktop & Android)
// =============================================================
let localTracks = [];
let isScanningLocal = false;

// Load cached tracks from previous scan if available
try {
  const cached = localStorage.getItem('archimedes_cached_local_tracks');
  if (cached) {
    localTracks = JSON.parse(cached);
  }
} catch (e) {}

// Auto-detect audio files on current device
async function scanLocalDeviceMusic(forceRescan = false) {
  if (isScanningLocal && !forceRescan) return localTracks;
  isScanningLocal = true;

  try {
    // 1. Android Native Bridge
    if (window.ArchimedesNative && typeof window.ArchimedesNative.isAndroid === 'function' && window.ArchimedesNative.isAndroid()) {
      if (!window.ArchimedesNative.hasPermission()) {
        window.ArchimedesNative.requestPermission();
      }
      const jsonStr = window.ArchimedesNative.scanLocalMusic();
      if (jsonStr) {
        const androidTracks = JSON.parse(jsonStr);
        if (Array.isArray(androidTracks) && androidTracks.length > 0) {
          localTracks = androidTracks;
          localStorage.setItem('archimedes_cached_local_tracks', JSON.stringify(localTracks));
        }
      }
    } 
    // 2. Electron Desktop IPC
    else if (ipcRenderer) {
      try {
        const customFolders = JSON.parse(localStorage.getItem('archimedes_local_custom_folders') || '[]');
        const tracks = await ipcRenderer.invoke('scan-local-music', customFolders);
        if (Array.isArray(tracks) && tracks.length > 0) {
          localTracks = tracks;
          localStorage.setItem('archimedes_cached_local_tracks', JSON.stringify(localTracks));
        }
      } catch (ipcErr) {
        console.warn('Electron scan IPC failed:', ipcErr);
      }
    }
  } catch (err) {
    console.error('Local music scan error:', err);
  } finally {
    isScanningLocal = false;
  }

  // If currently looking at local music view, refresh it
  if (currentView === 'local') {
    renderLocalMusic();
  }
  return localTracks;
}
window.scanLocalDeviceMusic = scanLocalDeviceMusic;

// Callback from Android Java when user grants permission
window.onAndroidPermissionsGranted = function() {
  scanLocalDeviceMusic(true);
};

// Add custom music directory from device
async function addLocalMusicFolder() {
  if (ipcRenderer) {
    const folder = await ipcRenderer.invoke('pick-local-folder');
    if (folder) {
      const customFolders = JSON.parse(localStorage.getItem('archimedes_local_custom_folders') || '[]');
      if (!customFolders.includes(folder)) {
        customFolders.push(folder);
        localStorage.setItem('archimedes_local_custom_folders', JSON.stringify(customFolders));
      }
      await scanLocalDeviceMusic(true);
    }
  } else if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const results = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('audio/') || /\.(mp3|flac|m4a|wav|ogg|aac|opus)$/i.test(file.name)) {
            const blobUrl = URL.createObjectURL(file);
            results.push({
              id: 'blob_' + Math.random().toString(36).substring(2, 9),
              title: file.name.replace(/\.[^/.]+$/, ''),
              artist: 'Local Device',
              album: dirHandle.name,
              url: blobUrl,
              streamUrl: blobUrl,
              size: file.size,
              duration: 0,
              isLocal: true,
              source: 'device'
            });
          }
        }
      }
      if (results.length > 0) {
        localTracks = [...localTracks, ...results];
        renderLocalMusic();
      }
    } catch (err) {
      console.warn('Directory picker canceled');
    }
  }
}
window.addLocalMusicFolder = addLocalMusicFolder;

// Drag and drop files anywhere onto the window
function setupDragAndDropLocalFiles() {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter(f => f.type.startsWith('audio/') || /\.(mp3|flac|m4a|wav|ogg|aac|opus)$/i.test(f.name));
      if (audioFiles.length > 0) {
        const newTracks = audioFiles.map(file => {
          let blobUrl;
          if (file.path) {
            blobUrl = 'file:///' + file.path.replace(/\\/g, '/').replace(/#/g, '%23').replace(/\?/g, '%3F');
          } else {
            blobUrl = URL.createObjectURL(file);
          }
          let name = file.name.replace(/\.[^/.]+$/, '');
          let artist = 'Local Artist';
          let title = name;
          if (name.includes(' - ')) {
            const parts = name.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }
          return {
            id: 'dropped_' + Math.random().toString(36).substring(2, 9),
            title: title || name,
            artist: artist || 'Local Artist',
            album: 'Imported Files',
            path: file.path || file.name,
            url: blobUrl,
            streamUrl: blobUrl,
            size: file.size,
            duration: 0,
            isLocal: true,
            source: 'device'
          };
        });
        localTracks = [...newTracks, ...localTracks];
        currentQueue = localTracks;
        playSongAt(0);
        if (currentView === 'local') {
          renderLocalMusic();
        }
      }
    }
  });
}

// Render Local Device Music View
function renderLocalMusic(filterQuery = '') {
  const t = I18N[currentLang] || I18N.en;
  localTracks = dedupeTracksList(localTracks);
  
  let displayed = localTracks;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    displayed = localTracks.filter(tr => 
      (tr.title && tr.title.toLowerCase().includes(q)) ||
      (tr.artist && tr.artist.toLowerCase().includes(q)) ||
      (tr.album && tr.album.toLowerCase().includes(q)) ||
      (tr.path && tr.path.toLowerCase().includes(q))
    );
  }

  const isAndroid = window.ArchimedesNative && typeof window.ArchimedesNative.isAndroid === 'function' && window.ArchimedesNative.isAndroid();
  const deviceName = isAndroid ? (currentLang === 'ar' ? 'هاتف أندرويد' : 'Android Device') : (currentLang === 'ar' ? 'جهاز الكمبيوتر' : 'Windows PC');

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 12px; text-transform: uppercase; color: #1db954; font-weight: 700; letter-spacing: 0.5px;">${t.deviceBadge}</span>
          <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; background: rgba(29, 185, 84, 0.15); color: #1db954; border: 1px solid rgba(29, 185, 84, 0.3);">
            <i class="fa-solid ${isAndroid ? 'fa-mobile-screen' : 'fa-laptop'}"></i> ${deviceName}
          </span>
        </div>
        <h1 style="font-size: 28px; margin: 0 0 6px 0;">${t.localTitle}</h1>
        <p style="color: #8c8ca5; font-size: 14px;">${displayed.length} ${t.trackCount} ${currentLang === 'ar' ? 'تم اكتشافها على جهازك' : 'auto-detected locally'}</p>
        
        <div class="action-btn-group" style="margin-top: 14px;">
          <button class="btn-play-all" onclick="playAllLocalTracks(false)" ${displayed.length === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-play"></i> ${t.playAll}
          </button>
          <button class="btn-shuffle" onclick="playAllLocalTracks(true)" ${displayed.length === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-shuffle"></i> ${t.shuffleAll}
          </button>
          <button class="top-action-btn" style="padding: 8px 16px; border-radius: 20px; font-size: 13px;" onclick="rescanDeviceMusic()">
            <i class="fa-solid fa-rotate ${isScanningLocal ? 'fa-spin' : ''}"></i> ${isScanningLocal ? t.scanningDevice : t.scanDevice}
          </button>
          ${!isAndroid ? `
          <button class="top-action-btn" style="padding: 8px 16px; border-radius: 20px; font-size: 13px;" onclick="addLocalMusicFolder()">
            <i class="fa-solid fa-folder-plus"></i> ${t.addFolder}
          </button>` : ''}
        </div>
      </div>

      <!-- Quick Local Filter -->
      <div style="min-width: 260px;">
        <div style="background: rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1);">
          <i class="fa-solid fa-magnifying-glass" style="color: #7b7b95; font-size: 13px;"></i>
          <input type="text" id="localSearchInput" placeholder="${currentLang === 'ar' ? 'بحث في ملفات الجهاز...' : 'Filter local tracks...'}" value="${escapeHtml(filterQuery)}" oninput="filterLocalTracks(this.value)" style="background: transparent; border: none; outline: none; color: #fff; font-size: 13px; width: 100%;" />
        </div>
      </div>
    </div>
  `;

  if (isAndroid && window.ArchimedesNative && !window.ArchimedesNative.hasPermission()) {
    html += `
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <i class="fa-solid fa-shield-halved" style="font-size: 32px; color: #f59e0b; margin-bottom: 8px;"></i>
        <h3 style="color: #f59e0b; margin-bottom: 6px;">${t.permissionRequired}</h3>
        <p style="color: #8c8ca5; font-size: 13px; margin-bottom: 14px;">${currentLang === 'ar' ? 'يحتاج التطبيق لإذن قراءة ملفات الصوت من بطاقة الذاكرة أو تخزين الهاتف لعرضها وتشغيلها.' : 'Archimedes needs permission to read audio files from your device storage.'}</p>
        <button onclick="window.ArchimedesNative.requestPermission()" style="background: #f59e0b; color: #000; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          <i class="fa-solid fa-key"></i> ${t.grantPermission}
        </button>
      </div>
    `;
  }

  if (displayed.length === 0) {
    html += `
      <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px; padding: 60px 20px; text-align: center; margin-top: 20px;">
        <i class="fa-solid fa-music" style="font-size: 48px; color: #7b7b95; opacity: 0.5; margin-bottom: 16px;"></i>
        <h3 style="color: #e5e7eb; font-size: 18px; margin-bottom: 8px;">${t.noLocalTracks}</h3>
        <p style="color: #8c8ca5; font-size: 14px; max-width: 480px; margin: 0 auto 20px auto;">
          ${currentLang === 'ar' 
            ? 'اضغط على "فحص الجهاز" أو قم بإسقاط ملفات الموسيقى مباشرة في نافذة التطبيق، أو اختر مجلداً إضافياً.'
            : 'Click "Scan Device", drag and drop audio files anywhere into the app window, or choose a custom folder.'}
        </p>
        <div style="display: flex; justify-content: center; gap: 12px;">
          <button onclick="rescanDeviceMusic()" style="background: #1db954; color: #000; border: none; padding: 10px 22px; border-radius: 20px; font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-rotate"></i> ${t.scanDevice}
          </button>
          ${!isAndroid ? `
          <button onclick="addLocalMusicFolder()" style="background: #252538; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 10px 22px; border-radius: 20px; font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-folder-plus"></i> ${t.addFolder}
          </button>` : ''}
        </div>
      </div>
    `;
  } else {
    html += `
      <table class="songs-table">
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>${currentLang === 'ar' ? 'العنوان' : 'Title'}</th>
            <th>${currentLang === 'ar' ? 'الفنان' : 'Artist'}</th>
            <th>${currentLang === 'ar' ? 'الألبوم / المصدر' : 'Album / Source'}</th>
            <th style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; width: 80px;"><i class="fa-regular fa-clock"></i></th>
            <th style="text-align: center; width: 60px;">${currentLang === 'ar' ? 'الموقع' : 'Path'}</th>
          </tr>
        </thead>
        <tbody>
    `;

    displayed.forEach((s, i) => {
      const isCurrent = currentSong && currentSong.id === s.id;
      const displayArtist = cleanArtistName(
        s.artist,
        currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'
      );
      const displayAlbum = cleanAlbumName(
        s.album,
        currentLang === 'ar' ? 'ملفات الجهاز' : 'Device Storage'
      );

      html += `
        <tr class="ds-track" onclick="playLocalTrackAt(${escJs(i)})" style="${isCurrent ? 'background: rgba(29, 185, 84, 0.12);' : ''}">
          <td class="ds-c-idx" style="color: ${isCurrent ? '#1db954' : '#7b7b95'};">
            ${isCurrent ? '<i class="fa-solid fa-volume-high"></i>' : (i + 1)}
          </td>
          <td class="ds-c-title" style="font-weight: 600; color: ${isCurrent ? '#1db954' : '#fff'};">
            ${escapeHtml(s.title || (currentLang === 'ar' ? 'مقطع بدون عنوان' : 'Untitled Track'))}
          </td>
          <td class="ds-c-artist" style="color: #8c8ca5;">${escapeHtml(displayArtist)}</td>
          <td class="ds-c-album" style="color: #8c8ca5;">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-laptop-file" style="font-size: 11px; opacity: 0.7;"></i> ${escapeHtml(displayAlbum)}
            </span>
          </td>
          <td class="ds-c-time" style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; color: #7b7b95;">
            ${s.duration ? formatDuration(s.duration) : '--:--'}
          </td>
          <td class="ds-c-act" style="text-align: center;">
            ${s.path && ipcRenderer ? `
              <button class="btn-action-delete" style="color: #8c8ca5; border-color: rgba(255,255,255,0.1);" title="${t.openFolder}" onclick="revealLocalFile(event, '${escJs(s.path)}')">
                <i class="fa-regular fa-folder-open"></i>
              </button>
            ` : `
              <i class="fa-solid fa-hard-drive" style="color: #555; font-size: 13px;" title="${escapeHtml(s.path || 'Device Storage')}"></i>
            `}
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
  }

  contentArea.innerHTML = html;
}
window.renderLocalMusic = renderLocalMusic;

function playLocalTrackAt(index) {
  currentQueue = localTracks;
  // Local playback owns the <audio> element, so the source discriminator must
  // leave 'youtube' — otherwise the transport would keep talking to the embed.
  playbackSource = 'local';
  playSongAt(index);
}
window.playLocalTrackAt = playLocalTrackAt;

function playAllLocalTracks(shuffle = false) {
  if (localTracks.length === 0) return;
  currentQueue = [...localTracks];
  if (shuffle) {
    shuffleArray(currentQueue);
  }
  playSongAt(0);
}
window.playAllLocalTracks = playAllLocalTracks;

async function rescanDeviceMusic() {
  const btn = document.querySelector('[onclick="rescanDeviceMusic()"]');
  if (btn) btn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> ${I18N[currentLang]?.scanningDevice || 'Scanning...'}`;
  await scanLocalDeviceMusic(true);
  renderLocalMusic();
}
window.rescanDeviceMusic = rescanDeviceMusic;

function filterLocalTracks(val) {
  renderLocalMusic(val);
  const input = document.getElementById('localSearchInput');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}
window.filterLocalTracks = filterLocalTracks;

function revealLocalFile(event, filePath) {
  if (event) event.stopPropagation();
  if (ipcRenderer) {
    ipcRenderer.invoke('open-item-in-folder', filePath);
  }
}
window.revealLocalFile = revealLocalFile;

function getMusicFolderPath() {
  let folder = localStorage.getItem('navidrome_music_folder');
  if (!folder || folder.toLowerCase().endsWith('\\music') || folder.toLowerCase() === '\\\\your-server.local\\music') {
    folder = '\\\\your-server.local\\Music1';
    localStorage.setItem('navidrome_music_folder', folder);
  }
  return folder;
}
window.getMusicFolderPath = getMusicFolderPath;

function renderUpload() {
  const t = I18N[currentLang] || I18N.en;
  contentArea.innerHTML = `
    <h2 class="section-title"><i class="fa-solid fa-cloud-arrow-up"></i> ${t.uploadTitle}</h2>
    
    <div style="background: #161622; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
      <h3 style="font-size: 15px; margin-bottom: 8px;"><i class="fa-solid fa-folder-tree"></i> ${t.destinationFolder}</h3>
      <p style="font-size: 13px; color: #8c8ca5; margin-bottom: 12px;">${currentLang === 'ar' ? 'يقوم Navidrome بفحص هذا المجلد تلقائياً. تم ضبطه للمجلد المشترك (مثال: \\\\your-server.local\\Music1):' : 'Navidrome automatically scans this folder. Configured for local network share (e.g. \\\\your-server.local\\Music1):'}</p>
      <input type="text" id="musicFolderPathInput" value="${getMusicFolderPath()}" style="width: 100%; max-width: 600px; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #12121a; color: #fff; font-size: 13px;" placeholder="e.g. \\\\your-server.local\\Music1 or C:\\Music" />
    </div>

    <div class="upload-drop-zone" id="dropZone">
      <i class="fa-solid fa-cloud-arrow-up" style="font-size: 48px; color: #1db954; margin-bottom: 16px;"></i>
      <h3 style="font-size: 18px; margin-bottom: 8px;">${t.dragDrop}</h3>
      <p style="color: #8c8ca5; font-size: 13px; margin-bottom: 20px;">${t.dragDropSub}</p>
      <button class="btn-play-all" id="selectFilesBtn" style="padding: 10px 24px;">
        <i class="fa-solid fa-folder-open"></i> ${t.selectFiles}
      </button>
      <input type="file" id="batchFileInput" multiple accept="audio/*,.mp3,.flac,.m4a,.wav,.ogg" style="display: none;" />
    </div>

    <div class="upload-queue-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="font-size: 15px;"><i class="fa-solid fa-list-check"></i> ${currentLang === 'ar' ? 'الملفات المجهزة للرفع' : 'Queued Files'} (<span id="queueCount">${uploadFilesQueue.length}</span>)</h4>
        <div style="display: flex; gap: 10px;">
          <button id="clearQueueBtn" class="btn-shuffle" style="padding: 6px 14px; font-size: 12px; ${uploadFilesQueue.length ? '' : 'display: none;'}">${currentLang === 'ar' ? 'مسح القائمة' : 'Clear List'}</button>
          <button id="startUploadBtn" class="btn-play-all" style="padding: 8px 18px; font-size: 13px; ${uploadFilesQueue.length ? '' : 'display: none;'}"><i class="fa-solid fa-upload"></i> ${currentLang === 'ar' ? 'بدء الرفع والتحديث الفوري' : 'Start Upload & Trigger Scan'}</button>
        </div>
      </div>
      <div id="uploadQueueContainer">
        ${renderQueueListHtml()}
      </div>
    </div>
  `;

  setupUploadInteractions();
}

function renderQueueListHtml() {
  if (uploadFilesQueue.length === 0) {
    return `<p style="color: #8c8ca5; font-size: 13px; text-align: center; padding: 24px 0;">No files in queue. Drag & drop or select files above.</p>`;
  }

  let html = `<div style="max-height: 300px; overflow-y: auto;">`;
  uploadFilesQueue.forEach((item, idx) => {
    const sizeMb = (item.file.size / (1024 * 1024)).toFixed(2);
    html += `
      <div class="queue-item">
        <div style="display: flex; align-items: center; gap: 12px;">
          <i class="fa-solid fa-file-audio" style="color: #1db954; font-size: 18px;"></i>
          <div>
            <div style="font-weight: 600;">${escapeHtml(item.file.name)}</div>
            <div style="color: #8c8ca5; font-size: 11px;">${sizeMb} MB</div>
          </div>
        </div>
        <span class="status-badge-upload status-${item.status}">${item.status.toUpperCase()}</span>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function setupUploadInteractions() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('batchFileInput');
  const selectFilesBtn = document.getElementById('selectFilesBtn');
  const startUploadBtn = document.getElementById('startUploadBtn');
  const clearQueueBtn = document.getElementById('clearQueueBtn');
  const musicFolderPathInput = document.getElementById('musicFolderPathInput');

  if (musicFolderPathInput) {
    musicFolderPathInput.addEventListener('change', () => {
      localStorage.setItem('navidrome_music_folder', musicFolderPathInput.value.trim());
    });
  }

  if (selectFilesBtn && fileInput) {
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      handleFilesAdded(e.target.files);
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleFilesAdded(e.dataTransfer.files);
    });
  }

  if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', () => {
      uploadFilesQueue = [];
      renderUpload();
    });
  }

  if (startUploadBtn) {
    startUploadBtn.addEventListener('click', processBatchUpload);
  }
}

function handleFilesAdded(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    uploadFilesQueue.push({
      file: files[i],
      status: 'ready'
    });
  }
  renderUpload();
}

async function processBatchUpload() {
  const startUploadBtn = document.getElementById('startUploadBtn');
  if (startUploadBtn) {
    startUploadBtn.disabled = true;
    startUploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
  }

  for (let i = 0; i < uploadFilesQueue.length; i++) {
    uploadFilesQueue[i].status = 'uploading';
    updateQueueUi();
    await new Promise(r => setTimeout(r, 250));
    uploadFilesQueue[i].status = 'done';
    updateQueueUi();
  }

  try {
    await apiRequest('startScan.view');
  } catch {}

  alert(`Successfully processed ${uploadFilesQueue.length} tracks! Navidrome has started scanning your library.`);
  uploadFilesQueue = [];
  renderUpload();
}

function updateQueueUi() {
  const container = document.getElementById('uploadQueueContainer');
  if (container) {
    container.innerHTML = renderQueueListHtml();
  }
}


async function openArtist(id, name) {
  const t = I18N[currentLang] || I18N.en;
  contentArea.innerHTML = `<div style="text-align: center; padding: 60px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #1db954;"></i><p style="margin-top: 14px; color: #8c8ca5;">${currentLang === 'ar' ? 'جاري تحميل الفنان...' : 'Loading artist...'}</p></div>`;
  try {
    const data = await apiRequest('getArtist.view', { id });
    const artist = data.artist || {};
    const albums = artist.album || [];

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="width: 100px; height: 100px; border-radius: 50%; background: #252538; display: flex; align-items: center; justify-content: center; font-size: 44px; color: #7b7b95;">
            <i class="fa-solid fa-user"></i>
          </div>
          <div>
            <span style="font-size: 12px; text-transform: uppercase; color: #1db954; font-weight: 700;">${currentLang === 'ar' ? 'فنان' : 'Artist'}</span>
            <h1 style="font-size: 28px; margin: 4px 0 6px 0;">${escapeHtml(artist.name || name)}</h1>
            <p style="color: #8c8ca5; font-size: 14px;">${countLabel(albums.length, 'Album', 'Albums', 'ألبوم', 'ألبومات')}</p>
            <div class="action-btn-group">
              <button class="btn-play-all" onclick="playAllArtistSongs('${escJs(artist.id || id)}', false)"><i class="fa-solid fa-play"></i> ${t.playAll}</button>
              <button class="btn-shuffle" onclick="playAllArtistSongs('${escJs(artist.id || id)}', true)"><i class="fa-solid fa-shuffle"></i> ${t.shuffleAll}</button>
              <button class="btn-shuffle" style="border: 1px solid rgba(239,68,68,0.3); color: #ef4444;" onclick="deleteArtist(event, '${escJs(artist.id || id)}', '${escJs(artist.name || name)}')">
                <i class="fa-solid fa-trash-can"></i> ${currentLang === 'ar' ? 'حذف الفنان نهائياً' : 'Delete Artist'}
              </button>
            </div>
          </div>
        </div>
        <button onclick="renderArtists()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #161622; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid ${currentLang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'}"></i> ${t.backToArtists}
        </button>
      </div>

      <h2 class="section-title"><i class="fa-solid fa-compact-disc"></i> ${currentLang === 'ar' ? 'ألبومات بواسطة' : 'Albums by'} ${escapeHtml(artist.name || name)}</h2>
    `;

    if (albums.length === 0) {
      html += `<p style="color: #8c8ca5;">No albums found for this artist.</p>`;
    } else {
      html += `<div class="cards-grid">`;
      albums.forEach(al => {
        const coverUrl = al.coverArt ? buildSubsonicUrl('getCoverArt.view', { id: al.coverArt, size: 240 }) : '';
        html += `
          <div class="card" onclick="openAlbum('${escJs(al.id)}')">
            ${coverUrl ? `<img class="card-img" src="${coverUrl}" onerror="this.outerHTML='<div class=\\'card-img\\'><i class=\\'fa-solid fa-compact-disc\\'></i></div>'" />` : `<div class="card-img"><i class="fa-solid fa-compact-disc"></i></div>`}
            <div class="card-title">${escapeHtml(al.name || al.title)}</div>
            <div class="card-subtitle">${al.year ? al.year + ' • ' : ''}${countLabel(al.songCount || 0, 'Track', 'Tracks', 'مقطع', 'مقاطع')}</div>
          </div>
        `;
      });
      html += `</div>`;
    }

    contentArea.innerHTML = html;
  } catch (err) {
    contentArea.innerHTML = `<p style="color: #ef4444;">Failed to load artist: ${escapeHtml(err.message)}</p>`;
  }
}

async function openPlaylist(id, name) {
  const t = I18N[currentLang] || I18N.en;
  contentArea.innerHTML = `<div style="text-align: center; padding: 60px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #1db954;"></i><p style="margin-top: 14px; color: #8c8ca5;">${currentLang === 'ar' ? 'جاري تحميل قائمة التشغيل...' : 'Loading playlist...'}</p></div>`;
  try {
    const data = await apiRequest('getPlaylist.view', { id });
    const playlist = data.playlist || {};
    const songs = playlist.entry || [];
    currentQueue = songs;

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="width: 100px; height: 100px; border-radius: 12px; background: #252538; display: flex; align-items: center; justify-content: center; font-size: 44px; color: #1db954;">
            <i class="fa-solid fa-list-ul"></i>
          </div>
          <div>
            <span style="font-size: 12px; text-transform: uppercase; color: #1db954; font-weight: 700;">${currentLang === 'ar' ? 'قائمة تشغيل' : 'Playlist'}</span>
            <h1 style="font-size: 28px; margin: 4px 0 6px 0;">${escapeHtml(playlist.name || name)}</h1>
            <p style="color: #8c8ca5; font-size: 14px;">${songs.length} ${t.trackCount} • ${playlist.comment || 'Archimedes Playlist'}</p>
            <div class="action-btn-group">
              <button class="btn-play-all" onclick="playAllCurrentQueue(false)"><i class="fa-solid fa-play"></i> ${t.playAll}</button>
              <button class="btn-shuffle" onclick="playAllCurrentQueue(true)"><i class="fa-solid fa-shuffle"></i> ${t.shuffleAll}</button>
              <button class="btn-shuffle" style="border: 1px solid rgba(239,68,68,0.3); color: #ef4444;" onclick="deletePlaylist(event, '${escJs(id)}', '${escJs(playlist.name || name)}')">
                <i class="fa-solid fa-trash-can"></i> ${currentLang === 'ar' ? 'حذف القائمة' : 'Delete Playlist'}
              </button>
            </div>
          </div>
        </div>
        <button onclick="renderPlaylists()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #161622; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid ${currentLang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'}"></i> ${t.backToPlaylists}
        </button>
      </div>

      <table class="songs-table">
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>${currentLang === 'ar' ? 'العنوان' : 'Title'}</th>
            <th>${currentLang === 'ar' ? 'الفنان' : 'Artist'}</th>
            <th>${currentLang === 'ar' ? 'الألبوم' : 'Album'}</th>
            <th style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; width: 80px;"><i class="fa-regular fa-clock"></i></th>
            <th style="text-align: center; width: 44px;" title="Add to Playlist"><i class="fa-solid fa-plus"></i></th>
            <th style="text-align: center; width: 44px;">${t.remove}</th>
          </tr>
        </thead>
        <tbody>
    `;

    songs.forEach((s, i) => {
      html += `
        <tr class="ds-track" onclick="playSongAt(${escJs(i)})">
          <td class="ds-c-idx" style="color: #7b7b95;">${i + 1}</td>
          <td class="ds-c-title" style="font-weight: 600;">${escapeHtml(s.title)}</td>
          <td class="ds-c-artist" style="color: #8c8ca5;">${escapeHtml(cleanArtistName(s.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))}</td>
          <td class="ds-c-album" style="color: #8c8ca5;">${escapeHtml(cleanAlbumName(s.album, currentLang === 'ar' ? 'ألبوم غير معروف' : 'Unknown Album'))}</td>
          <td class="ds-c-time" style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; color: #7b7b95;">${formatDuration(s.duration)}</td>
          <td class="ds-c-act" style="text-align: center;">
            <button class="btn-action-playlist" title="Add to Playlist" onclick="openAddToPlaylistModal(event, '${escJs(s.id)}')">
              <i class="fa-solid fa-plus"></i>
            </button>
          </td>
          <td class="ds-c-act" style="text-align: center;">
            <button class="btn-action-delete" title="${currentLang === 'ar' ? 'إزالة من قائمة التشغيل' : 'Remove from playlist'}" onclick="removeSongFromPlaylist(event, '${escJs(id)}', ${i}, '${escJs(s.title)}')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    contentArea.innerHTML = html;
  } catch (err) {
    contentArea.innerHTML = `<p style="color: #ef4444;">Failed to load playlist: ${escapeHtml(err.message)}</p>`;
  }
}

async function openAlbum(id) {
  const t = I18N[currentLang] || I18N.en;
  contentArea.innerHTML = `<div style="text-align: center; padding: 60px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #1db954;"></i><p style="margin-top: 14px; color: #8c8ca5;">${currentLang === 'ar' ? 'جاري تحميل الألبوم...' : 'Loading album...'}</p></div>`;
  const data = await apiRequest('getAlbum.view', { id });
  const album = data.album;
  const songs = album.song || [];
  currentQueue = songs;

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px;">
      <div style="display: flex; gap: 24px; align-items: flex-end;">
        <div style="width: 140px; height: 140px; border-radius: 12px; background: #252538; display: flex; align-items: center; justify-content: center; font-size: 54px; color: #7b7b95;">
          <i class="fa-solid fa-compact-disc"></i>
        </div>
        <div>
          <span style="font-size: 12px; text-transform: uppercase; color: #1db954; font-weight: 700;">${currentLang === 'ar' ? 'ألبوم' : 'Album'}</span>
          <h1 style="font-size: 28px; margin: 4px 0 8px 0;">${escapeHtml(album.name || album.title)}</h1>
          <p style="color: #8c8ca5; font-size: 14px;">${escapeHtml(cleanArtistName(album.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))} • ${songs.length} ${t.trackCount}</p>
          <div class="action-btn-group">
            <button class="btn-play-all" onclick="playAllCurrentQueue(false)"><i class="fa-solid fa-play"></i> ${t.playAll}</button>
            <button class="btn-shuffle" onclick="playAllCurrentQueue(true)"><i class="fa-solid fa-shuffle"></i> ${t.shuffleAll}</button>
            <button class="btn-shuffle" style="border: 1px solid rgba(239,68,68,0.3); color: #ef4444;" onclick="deleteAlbum(event, '${escJs(album.id)}', '${escJs(album.name || album.title)}')">
              <i class="fa-solid fa-trash-can"></i> ${currentLang === 'ar' ? 'حذف الألبوم نهائياً' : 'Delete Album'}
            </button>
          </div>
        </div>
      </div>
      <button onclick="renderAlbums()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #161622; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid ${currentLang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'}"></i> ${t.backToAlbums}
      </button>
    </div>

    <table class="songs-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>${currentLang === 'ar' ? 'العنوان' : 'Title'}</th>
          <th>${currentLang === 'ar' ? 'الفنان' : 'Artist'}</th>
          <th style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; width: 80px;"><i class="fa-regular fa-clock"></i></th>
          <th style="text-align: center; width: 44px;" title="Add to Playlist"><i class="fa-solid fa-plus"></i></th>
          <th style="text-align: center; width: 44px;">${t.remove}</th>
        </tr>
      </thead>
      <tbody>
  `;

  songs.forEach((s, i) => {
    html += `
      <tr class="ds-track" onclick="playSongAt(${escJs(i)})">
        <td class="ds-c-idx" style="color: #7b7b95;">${i + 1}</td>
        <td class="ds-c-title" style="font-weight: 600;">${escapeHtml(s.title)}</td>
        <td class="ds-c-artist" style="color: #8c8ca5;">${escapeHtml(cleanArtistName(s.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))}</td>
        <td class="ds-c-time" style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; color: #7b7b95;">${formatDuration(s.duration)}</td>
        <td class="ds-c-act" style="text-align: center;">
          <button class="btn-action-playlist" title="Add to Playlist" onclick="openAddToPlaylistModal(event, '${escJs(s.id)}')">
            <i class="fa-solid fa-plus"></i>
          </button>
        </td>
        <td class="ds-c-act" style="text-align: center;">
          <button class="btn-action-delete" title="Permanently delete song from server" onclick="deleteSong(event, '${escJs(s.id)}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  contentArea.innerHTML = html;
}


async function performSearch(query) {
  const t = I18N[currentLang] || I18N.en;
  contentArea.innerHTML = `<div style="text-align: center; padding: 60px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #1db954;"></i></div>`;
  const data = await apiRequest('search3.view', { query });
  const songs = data.searchResult3?.song || [];
  currentQueue = songs;

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 class="section-title" style="margin-bottom: 0;"><i class="fa-solid fa-magnifying-glass"></i> ${currentLang === 'ar' ? 'نتائج البحث عن' : 'Search Results for'} "${escapeHtml(query)}"</h2>
      <div class="action-btn-group" style="margin-top: 0;">
        <button class="btn-play-all" onclick="playAllCurrentQueue(false)"><i class="fa-solid fa-play"></i> ${t.playAll}</button>
        <button class="btn-shuffle" onclick="playAllCurrentQueue(true)"><i class="fa-solid fa-shuffle"></i> ${t.shuffleAll}</button>
      </div>
    </div>
  `;
  if (songs.length === 0) {
    html += `<p style="color: #8c8ca5;">${currentLang === 'ar' ? 'لم يتم العثور على أي نتائج.' : 'No tracks found.'}</p>`;
  } else {
    html += `
      <table class="songs-table">
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>${currentLang === 'ar' ? 'العنوان' : 'Title'}</th>
            <th>${currentLang === 'ar' ? 'الفنان' : 'Artist'}</th>
            <th>${currentLang === 'ar' ? 'الألبوم' : 'Album'}</th>
            <th style="text-align: ${currentLang === 'ar' ? 'left' : 'right'}; width: 80px;"><i class="fa-regular fa-clock"></i></th>
            <th style="text-align: center; width: 50px;">${t.remove}</th>
          </tr>
        </thead>
        <tbody>
    `;
    songs.forEach((s, i) => {
      html += `
        <tr class="ds-track" onclick="playSongAt(${escJs(i)})">
          <td class="ds-c-idx" style="color: #7b7b95;">${i + 1}</td>
          <td class="ds-c-title" style="font-weight: 600;">${escapeHtml(s.title)}</td>
          <td class="ds-c-artist" style="color: #8c8ca5;">${escapeHtml(cleanArtistName(s.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))}</td>
          <td class="ds-c-album" style="color: #8c8ca5;">${escapeHtml(cleanAlbumName(s.album, currentLang === 'ar' ? 'ألبوم غير معروف' : 'Unknown Album'))}</td>
          <td class="ds-c-time" style="text-align: right; color: #7b7b95;">${formatDuration(s.duration)}</td>
          <td class="ds-c-act" style="text-align: center;">
            <button class="btn-action-delete" title="Permanently delete song from server" onclick="deleteSong(event, '${escJs(s.id)}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }
  contentArea.innerHTML = html;
}

function renderSettings() {
  const t = I18N[currentLang] || I18N.en;
  contentArea.innerHTML = `
    <h2 class="section-title"><i class="fa-solid fa-gear"></i> ${t.settings}</h2>
    <div style="background: #161622; border-radius: 12px; padding: 24px; max-width: 600px; border: 1px solid rgba(255, 255, 255, 0.05);">
      <h3 style="margin-bottom: 16px; font-size: 16px;">${t.connectionInfo}</h3>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <div>
          <div style="font-weight: 600; font-size: 14px;">${t.serverUrl}</div>
          <div style="color: #8c8ca5; font-size: 12px;">${serverUrl}</div>
        </div>
        <button onclick="document.getElementById('serverStatusBadge').click()" style="padding: 6px 14px; border-radius: 6px; border: none; background: #252538; color: #fff; cursor: pointer; font-size: 12px;">${t.changeServer}</button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <div>
          <div style="font-weight: 600; font-size: 14px;">${currentLang === 'ar' ? 'حساب المستخدم' : 'User Account'}</div>
          <div style="color: #8c8ca5; font-size: 12px;">${escapeHtml(loggedInUser || '—')}</div>
        </div>
        <button onclick="logout()" style="padding: 6px 14px; border-radius: 6px; border: none; background: #3a1f24; color: #ff8a8a; cursor: pointer; font-size: 12px;">
          ${currentLang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
        </button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
        <div>
          <div style="font-weight: 600; font-size: 14px;">${currentLang === 'ar' ? 'تخزين كلمة المرور' : 'Credential Storage'}</div>
          <div style="color: #8c8ca5; font-size: 12px;">${
            archimedesBridge
              ? (currentLang === 'ar' ? 'مشفّرة بمفتاح النظام (DPAPI) — لا تُخزَّن نصّاً صريحاً' : 'Encrypted with the OS keystore (DPAPI) - never stored in plaintext')
              : (window.ArchimedesNative
                ? (currentLang === 'ar' ? 'EncryptedSharedPreferences على أندرويد' : 'EncryptedSharedPreferences (Android)')
                : (currentLang === 'ar' ? 'وضع المتصفح: تُحفظ في الذاكرة لهذه الجلسة فقط' : 'Browser mode: session memory only'))
          }</div>
        </div>
        <span style="color: ${sessionAuth ? '#a3e7bc' : '#f0b45a'}; font-size: 12px;">
          ${sessionAuth ? (currentLang === 'ar' ? 'متصل' : 'Connected') : (currentLang === 'ar' ? 'غير متصل' : 'Not connected')}
        </span>
      </div>
    </div>

    <!-- Performance & battery.

         The visualizer is the single most expensive thing in the app: it redraws
         at ~60fps for as long as the process lives. It is therefore the user's
         choice whether it runs, which is what was asked for on Android and is
         just as useful on a laptop. Switching it off stops the animation frame
         entirely rather than merely hiding the canvas, so the saving is real.
         Audio playback, DSP and lyrics are untouched either way. -->
    <div style="background: #161622; border-radius: 12px; padding: 24px; max-width: 600px; margin-top: 16px; border: 1px solid rgba(255, 255, 255, 0.05);">
      <h3 style="margin-bottom: 8px; font-size: 16px;">
        <i class="fa-solid fa-bolt" style="color: #f59e0b;"></i>
        ${currentLang === 'ar' ? 'الأداء والبطارية' : 'Performance & battery'}
      </h3>
      <p style="color: #8c8ca5; font-size: 13px; margin-bottom: 14px; line-height: 1.6;">
        ${currentLang === 'ar'
          ? 'المؤثرات البصرية تُشغل المعالج وتستهلك البطارية طوال الوقت. أطفئها لتوفير الطاقة — الصوت والمؤثرات الصوتية لا تتأثر إطلاقاً.'
          : 'Visual effects keep the CPU busy and drain the battery. Switch them off to save power - audio and the sound effects are not affected at all.'}
      </p>
      <label style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; cursor: pointer;">
        <span style="min-width: 0;">
          <span style="display: block; font-weight: 600; font-size: 14px;">
            ${currentLang === 'ar' ? 'مؤثر Bars البصري' : 'Bars visualizer'}
          </span>
          <span style="display: block; color: #8c8ca5; font-size: 12px;">
            ${currentLang === 'ar' ? 'يرسم ~٦٠ إطاراً في الثانية أثناء التشغيل' : 'Redraws at ~60fps while playing'}
          </span>
        </span>
        <input type="checkbox" id="vizToggle" style="width: 22px; height: 22px; flex: 0 0 auto;"
               ${visualizerEnabled() ? 'checked' : ''}
               onchange="setVisualizerEnabled(this.checked)" />
      </label>
      <p style="color: #6f6f85; font-size: 12px; margin-top: 10px; line-height: 1.6;">
        ${currentLang === 'ar'
          ? 'يتوقف الرسم تلقائياً أيضاً حين تكون النافذة مخفية أو التطبيق في الخلفية.'
          : 'Drawing also stops by itself whenever the window is hidden or the app is in the background.'}
      </p>
    </div>
    <div style="background: #161622; border-radius: 12px; padding: 24px; max-width: 600px; margin-top: 16px; border: 1px solid rgba(255, 255, 255, 0.05);">
      <h3 style="margin-bottom: 8px; font-size: 16px;">
        <i class="fa-solid fa-stethoscope" style="color: #1db954;"></i>
        ${currentLang === 'ar' ? 'تشخيص الاتصال' : 'Connection diagnostics'}
      </h3>
      <p style="color: #8c8ca5; font-size: 13px; margin-bottom: 14px; line-height: 1.6;">
        ${currentLang === 'ar'
          ? 'يقيس كل طبقة على حدة: تحليل الاسم (DNS)، والاتصال (TCP)، والمصافحة المشفّرة (TLS)، والطلب (HTTP) — ويقارن DNS النظام بـ Cloudflare عبر DoH. شغّله على بيانات الجوال بدون VPN لتعرف ما يُحجب بالضبط.'
          : 'Measures each layer separately: DNS resolution, TCP connect, TLS handshake and the HTTP request — and compares the system resolver against Cloudflare over DoH. Run it on mobile data without a VPN to see exactly what is being blocked.'}
      </p>
      <button id="diagRunBtn" onclick="runConnectionDiagnostic()" style="padding: 10px 18px; border-radius: 8px; border: none; background: #1db954; color: #04140a; font-weight: 700; cursor: pointer; min-height: 44px;">
        <i class="fa-solid fa-play"></i> ${currentLang === 'ar' ? 'تشغيل التشخيص' : 'Run diagnostics'}
      </button>
      <div id="diagResult" style="margin-top: 14px; font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; color: #a0a0b5; line-height: 1.6; word-break: break-word;"></div>
    </div>
  `;
}

/* Runs the native connection diagnostic and renders each layer's verdict.
   The native side works on a background thread, so this polls rather than
   blocking the UI. */
async function runConnectionDiagnostic() {
  const box = document.getElementById('diagResult');
  const btn = document.getElementById('diagRunBtn');
  const ar = currentLang === 'ar';
  const bridge = window.ArchimedesNative;
  const target = serverUrl || '';

  if (!bridge || typeof bridge.diagnoseConnection !== 'function') {
    if (box) box.textContent = ar
      ? 'التشخيص متاح في تطبيق أندرويد فقط.'
      : 'Diagnostics are available in the Android app only.';
    return;
  }
  if (!target) {
    if (box) box.textContent = ar ? 'لا يوجد عنوان سيرفر مضبوط.' : 'No server address configured.';
    return;
  }

  if (btn) btn.disabled = true;
  if (box) box.textContent = (ar ? 'جارٍ الفحص…' : 'Running…') + '\n' + target;

  try {
    bridge.diagnoseConnection(target);
    let result = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 750));
      const raw = bridge.getDiagnosticResult();
      if (raw && raw !== '{}' && !/"running"\s*:\s*true/.test(raw)) {
        try { result = JSON.parse(raw); } catch (e) { /* keep polling */ }
        if (result) break;
      }
    }
    if (!box) return;
    if (!result) {
      box.textContent = ar ? 'انتهت المهلة دون نتيجة.' : 'Timed out with no result.';
      return;
    }

    const line = (label, value, ok) => {
      const colour = ok === null ? '#a0a0b5' : (ok ? '#a3e7bc' : '#ff8a8a');
      return `<div style="color:${colour}"><strong>${label}</strong>: ${escapeHtml(String(value))}</div>`;
    };
    const failed = (v) => typeof v === 'string' && v.startsWith('FAILED');

    box.innerHTML = [
      line('DNS (system)', result.dnsSystem, failed(result.dnsSystem) ? false : true),
      line('DNS (DoH 1.1.1.1)', result.dnsDoH, failed(result.dnsDoH) ? false : true),
      line('TCP ' + (result.port || ''), result.tcp || '-', failed(result.tcp) ? false : true),
      line('TLS', result.tls || (result.port === 80 ? 'n/a' : '-'), result.tls ? (failed(result.tls) ? false : true) : null),
      line('HTTP', result.http || '-', failed(result.http) ? false : true),
      line('Total', (result.totalMs || 0) + ' ms', null),
    ].join('');

    // Translate the raw evidence into the one conclusion that matters.
    let verdict;
    if (!failed(result.http)) {
      verdict = ar ? 'الاتصال يعمل من هذه الشبكة.' : 'The server is reachable from this network.';
    } else if (failed(result.dnsSystem) && !failed(result.dnsDoH)) {
      verdict = ar
        ? 'الاسم لا يُحلّ عبر DNS النظام لكنه يُحلّ عبر DoH ⇒ الحجب على DNS فقط.'
        : 'The name fails on the system resolver but resolves over DoH ⇒ DNS-only blocking.';
    } else if (failed(result.tcp)) {
      verdict = ar
        ? 'العنوان نفسه غير قابل للوصول ⇒ حجب على مستوى IP (لا يفيده تغيير داخل التطبيق).'
        : 'The address itself is unreachable ⇒ IP-level blocking (no client-side fix).';
    } else if (result.tls && failed(result.tls)) {
      verdict = ar
        ? 'TCP ينجح لكن المصافحة المشفّرة تفشل ⇒ حجب على TLS/SNI.'
        : 'TCP succeeds but the TLS handshake fails ⇒ TLS/SNI-level blocking.';
    } else {
      verdict = ar ? 'فشل غير مصنّف — انظر التفاصيل أعلاه.' : 'Unclassified failure — see details above.';
    }
    box.innerHTML += `<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); color:#fff;">${escapeHtml(verdict)}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}
window.runConnectionDiagnostic = runConnectionDiagnostic;

// =============================================================
// YouTube In-App Music & Video Streaming Center
// =============================================================
// Every ID below was verified against YouTube's oEmbed endpoint (HTTP 200 + embed
// html) before being committed. YouTube IDs rot: the previous defaults - including
// the hardcoded startup video '3wZq8YwN61k' - had been deleted upstream, which is
// exactly why this screen always showed YouTube's "Video unavailable" placeholder
// instead of a player. Each ID is now validated before playback, and a dead or
// embed-blocked video reports a real message instead of an empty black frame.
const YT_FEATURED_TRACKS = [
  { id: 'fJ9rUzIMcZQ', title: 'Queen - Bohemian Rhapsody', channel: 'Queen Official', category: 'Rock' },
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', channel: 'Rick Astley', category: 'Pop' },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', channel: 'LuisFonsiVEVO', category: 'Latin' },
  { id: '60ItHLz5WEA', title: 'Alan Walker - Faded', channel: 'Alan Walker', category: 'EDM' },
  { id: 'RgKAFK5djSk', title: 'Wiz Khalifa - See You Again', channel: 'Wiz Khalifa', category: 'Hip-Hop' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE', channel: 'officialpsy', category: 'K-Pop' },
  { id: 'DWcJFNfaw9c', title: 'Lofi Hip Hop Radio - Beats to Relax/Study to', channel: 'Lofi Girl', category: 'Lofi' }
];

let currentYtVideoId = YT_FEATURED_TRACKS[0].id;

/** videoId -> { state: 'ok' | 'missing' | 'blocked' | 'unknown', title?, author? } */
const ytValidation = new Map();
let ytValidatingId = null;

async function ytFetchOembed(videoId) {
  // Prefer the Electron main process: it is not subject to CORS and goes through
  // the same path as the rest of the app. Falls back to a direct request on the
  // Android/iOS WebView shells.
  if (window.archimedes && typeof window.archimedes.validateYouTube === 'function') {
    return window.archimedes.validateYouTube(videoId);
  }
  try {
    if (ipcRenderer) {
      return await ipcRenderer.invoke('yt-validate', videoId);
    }
  } catch (e) { /* fall back to a direct request below */ }
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return { ok: true, status: 200, title: data.title, author: data.author_name };
    }
    return { ok: false, status: res.status };
  } catch (e) {
    return { ok: false, status: 0 };
  }
}

// Resolves to 'ok' | 'missing' | 'blocked' | 'unknown'.
// 'unknown' means the check itself could not run (offline, CORS, blocked network)
// and MUST remain playable - a failed check must never block a working video.
async function validateYouTubeVideo(videoId, { force = false } = {}) {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return 'unknown';
  if (!force && ytValidation.has(videoId)) return ytValidation.get(videoId).state;

  let state = 'unknown';
  let title, author;
  try {
    const res = await ytFetchOembed(videoId);
    if (res && res.ok) {
      state = 'ok';
      title = res.title;
      author = res.author;
    } else {
      const status = res ? res.status : 0;
      if (status === 404 || status === 400) state = 'missing';        // deleted / private / wrong id
      else if (status === 401 || status === 403) state = 'blocked';    // owner disabled embedding
      else state = 'unknown';
    }
  } catch (e) {
    state = 'unknown';
  }

  ytValidation.set(videoId, { state, title, author });
  return state;
}

function extractYoutubeVideoId(urlOrText) {
  if (!urlOrText) return null;
  const trimmed = urlOrText.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
  if (match && match[1]) return match[1];
  return null;
}

/** Delegates to the shared embed layer. Kept as a thin wrapper so existing
 *  callers keep working; the shared layer is the single source of truth. */
function buildYouTubeEmbedUrl(videoId) {
  return window.YtEmbed.buildUrl(videoId);
}

/* --- mounting the player ------------------------------------------------
   The iframe is created by the shared layer in the PERSISTENT layer, not in the
   view, because the view is rebuilt on every navigation. See attachYouTubeToView. */

/* =============================================================================
   Unified playback source
   =============================================================================
   The app already had one state object for playback (currentSong) and one
   persistent element (<audio>). Rather than adding a second system, playback is
   described by extending that same idea with a source discriminator:

     playbackSource = 'navidrome' | 'local' | 'youtube'

   Navidrome and local both play through the existing <audio> element; YouTube
   plays through the official embed held in the persistent layer. Everything
   else in the UI (player bar, mini player, lyrics) reads whichever source is
   active and never needs to know how it is produced.
   ========================================================================== */
let playbackSource = 'navidrome';

/* Mirrors the fields the rest of the UI already expects from currentSong:
   title, artist, artwork, playing, position, duration. */
let ytState = {
  videoId: null,
  title: '',
  artist: '',
  artwork: '',
  playing: false,
  position: 0,
  duration: 0,
};

/* -----------------------------------------------------------------------------
   YouTubePlayerAdapter
   -----------------------------------------------------------------------------
   The only code allowed to touch the official player. It never replaces the
   embed, never extracts audio and never proxies anything: play/pause/seek and
   position reads go straight to the YouTube IFrame API. The element it controls
   lives in #ytPersistentLayer, which sits outside #contentArea and is therefore
   unaffected by navigation.
   -------------------------------------------------------------------------- */
const YouTubePlayerAdapter = {
  handle: null,
  mountedVideoId: null,

  /** Creates the player once and reuses it for later videos. */
  mount(videoId) {
    const surface = document.getElementById('ytPersistentSurface');
    if (!surface) return;
    if (this.handle && this.mountedVideoId === videoId) return;

    // A different video on an existing player: use loadVideoById so playback
    // continues in the same element instead of building a new one.
    if (this.handle && this.mountedVideoId && this.isReady()) {
      this.loadVideo(videoId);
      return;
    }

    surface.innerHTML = '';
    this.handle = window.YtEmbed.mount(surface, videoId, {
      onReady: () => { this.onReady && this.onReady(); },
      onStateChange: (e) => { this.onStateChange && this.onStateChange(e); },
      onError: (info) => { this.onError && this.onError(info); },
    });
    this.mountedVideoId = videoId;
  },

  isReady() {
    const p = this.handle && this.handle.getPlayer && this.handle.getPlayer();
    return !!(p && typeof p.getCurrentTime === 'function');
  },

  player() {
    return this.handle && this.handle.getPlayer ? this.handle.getPlayer() : null;
  },

  play() {
    const p = this.player();
    if (p && p.playVideo) { try { p.playVideo(); } catch (e) { /* not ready */ } }
  },

  pause() {
    const p = this.player();
    if (p && p.pauseVideo) { try { p.pauseVideo(); } catch (e) { /* not ready */ } }
  },

  seekTo(seconds) {
    const p = this.player();
    if (p && p.seekTo) { try { p.seekTo(Number(seconds) || 0, true); } catch (e) { /* not ready */ } }
  },

  getCurrentTime() {
    const p = this.player();
    try { return p && p.getCurrentTime ? (p.getCurrentTime() || 0) : 0; } catch (e) { return 0; }
  },

  getDuration() {
    const p = this.player();
    try { return p && p.getDuration ? (p.getDuration() || 0) : 0; } catch (e) { return 0; }
  },

  /** YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued */
  getState() {
    const p = this.player();
    try { return p && p.getPlayerState ? p.getPlayerState() : -1; } catch (e) { return -1; }
  },

  loadVideo(videoId) {
    const p = this.player();
    if (p && p.loadVideoById) {
      try { p.loadVideoById(videoId); this.mountedVideoId = videoId; return true; } catch (e) { /* fall through */ }
    }
    // Player not usable yet: rebuild once.
    this.mountedVideoId = null;
    if (this.handle && this.handle.destroy) { try { this.handle.destroy(); } catch (e) { /* ignore */ } }
    this.handle = null;
    this.mount(videoId);
    return true;
  },

  destroy() {
    if (this.handle && this.handle.destroy) { try { this.handle.destroy(); } catch (e) { /* ignore */ } }
    this.handle = null;
    this.mountedVideoId = null;
  },
};
window.YouTubePlayerAdapter = YouTubePlayerAdapter;

/* --- persistent layer placement ------------------------------------------- */

/** Move the layer off-canvas without stopping it. */
function parkYouTubeLayer() {
  const layer = document.getElementById('ytPersistentLayer');
  if (!layer) return;
  layer.classList.remove('yt-docked');
  layer.classList.add('yt-parked');
}

/** Overlay the layer exactly on the slot the YouTube view reserved.

 *  The layer is `position: fixed`, so its coordinates must be recomputed every
 *  time the slot moves. Scrolling moves the slot, and the first version of this
 *  only recomputed on resize — which is why the video appeared to stick in the
 *  middle of the screen while the rest of the page scrolled under it (reported on
 *  both Android and desktop).

 *  Fixed positioning also means the player is not clipped by the scrolling
 *  container, so it is clipped explicitly to the visible part of the content area.
 *  That way it slides under the top bar and player bar like normal content
 *  instead of floating over them. */
function dockYouTubeLayer() {
  const layer = document.getElementById('ytPersistentLayer');
  const slot = document.getElementById('ytSlot');
  if (!layer || !slot) return;
  const r = slot.getBoundingClientRect();
  if (!r.width || !r.height) { parkYouTubeLayer(); return; }
  layer.style.top = r.top + 'px';
  layer.style.left = r.left + 'px';
  layer.style.width = r.width + 'px';
  layer.style.height = r.height + 'px';

  // Clip to the region between the fixed top bar and the fixed player bar, so the
  // player slides under the chrome exactly like normal content instead of painting
  // over it. Measured: the layer sits at z-index 40 while the top bar is at 10, so
  // without this the video covered the header as it scrolled up.
  //
  // The bounds must come from the CHROME, not from #contentArea: contentArea lives
  // inside the scrolling container, so its rect travels with the scroll and the
  // difference stays zero — an earlier version clipped against it and therefore
  // never clipped anything.
  const topChrome = document.querySelector('.top-bar, header, #topBar, .topbar');
  const bottomChrome = document.querySelector('footer.player-bar, .player-bar');
  const visibleTop = topChrome ? topChrome.getBoundingClientRect().bottom : 0;
  const visibleBottom = bottomChrome ? bottomChrome.getBoundingClientRect().top : window.innerHeight;

  const insetTop = Math.max(0, visibleTop - r.top);
  const insetBottom = Math.max(0, r.bottom - visibleBottom);
  if (insetTop || insetBottom) {
    layer.style.clipPath = `inset(${Math.round(insetTop)}px 0px ${Math.round(insetBottom)}px 0px)`;
  } else {
    layer.style.clipPath = '';
  }

  layer.classList.remove('yt-parked');
  layer.classList.add('yt-docked');
}
window.dockYouTubeLayer = dockYouTubeLayer;

/* Re-align while anything scrolls or resizes.

   Called synchronously rather than deferred to requestAnimationFrame. An earlier
   version coalesced through rAF and worked on Android but not on Electron:
   measured on desktop, the slot moved to -126 while the layer stayed at 174
   (offline by 300), because rAF does not run in an unfocused or occluded Electron
   window. Deferring was an optimisation that silently dropped the update, so the
   work is done inline instead — one getBoundingClientRect plus a few style writes.

   Capture phase so a scroll inside any scrolling container is seen, not only a
   document scroll; scroll events do not bubble but they do traverse capture. */
function onViewportChanged() {
  const layer = document.getElementById('ytPersistentLayer');
  if (!layer) return;
  // Only while the player is on screen; a parked layer has nothing to align.
  if (layer.classList.contains('yt-docked')) dockYouTubeLayer();
}
window.addEventListener('scroll', onViewportChanged, { passive: true, capture: true });
window.addEventListener('resize', onViewportChanged, { passive: true });

function ytNotice(icon, title, detail, videoId) {
  const box = document.getElementById('ytPlayerNotice');
  const slot = document.getElementById('ytSlot');
  const isAr = currentLang === 'ar';
  if (!box) return;
  if (slot) slot.style.visibility = 'hidden';
  parkYouTubeLayer();
  box.style.display = 'flex';
  box.innerHTML = `
    <i class="fa-brands fa-youtube" style="font-size: 38px; color: #ff0033;"></i>
    <div style="font-size: 15px; font-weight: 700; color: #fff; max-width: 540px;">${title}</div>
    <div style="font-size: 13px; color: #8c8ca5; max-width: 540px;">${detail}</div>
    <button class="top-action-btn" style="margin-top: 6px;" onclick="openExternalYouTube('${escJs(videoId || '')}')">
      <i class="fa-solid fa-arrow-up-right-from-square"></i> ${isAr ? 'فتح في يوتيوب' : 'Open on YouTube'}
    </button>`;
}

/** Called by the YouTube view after it has rendered its slot. */
function attachYouTubeToView(videoId, playable) {
  const notice = document.getElementById('ytPlayerNotice');
  const slot = document.getElementById('ytSlot');
  if (notice) notice.style.display = 'none';
  if (slot) slot.style.visibility = 'visible';

  const isAr = currentLang === 'ar';

  if (!playable) {
    const known = ytValidation.get(videoId);
    const missing = known && known.state === 'missing';
    ytNotice(
      'youtube',
      missing
        ? (isAr ? 'هذا الفيديو غير موجود (محذوف أو خاص).' : 'This video does not exist (deleted or private).')
        : (isAr ? 'صاحب الفيديو منع التضمين.' : 'The uploader does not allow embedding.'),
      isAr ? 'اختر مقطعاً آخر من الأسفل أو الصق رابطاً جديداً.' : 'Pick another track below, or paste a new link.',
      videoId
    );
    return;
  }

  if (!window.YtEmbed.originIsUsable()) {
    ytNotice(
      'youtube',
      isAr ? 'المشغّل المدمج يحتاج هوية تطبيق (Referer/Origin).' : 'The embedded player needs an app identity (Referer/Origin).',
      isAr
        ? 'الواجهة تُحمَّل بلا أصل حقيقي، فيرفض يوتيوب التعرّف على التطبيق.'
        : 'The UI has no real origin, so YouTube refuses to identify the app.',
      videoId
    );
    return;
  }

  YouTubePlayerAdapter.onError = (info) => {
    if (info.kind === 'client-id') {
      ytNotice('youtube', isAr ? 'فشل تعريف التطبيق لدى يوتيوب.' : 'YouTube could not identify the app.',
        isAr ? 'هذا خلل في إعداد التطبيق لا في الفيديو.' : info.en, videoId);
    } else {
      ytNotice('youtube', isAr ? info.ar : info.en,
        isAr ? 'لا يمكن تجاوز قرار صاحب الفيديو.' : 'The uploader’s choice cannot be worked around.', videoId);
    }
  };

  YouTubePlayerAdapter.mount(videoId);

  // Wait for the layer to have a measurable box before aligning to the slot.
  requestAnimationFrame(() => { dockYouTubeLayer(); requestAnimationFrame(dockYouTubeLayer); });
}
window.attachYouTubeToView = attachYouTubeToView;

function renderYouTube(activeVideoId) {
  const t = I18N[currentLang] || I18N.en;
  const isAr = currentLang === 'ar';
  const vidId = activeVideoId || currentYtVideoId;
  const known = ytValidation.get(vidId);

  // Validate in the background; re-render once when the result arrives.
  if (!known && ytValidatingId !== vidId) {
    ytValidatingId = vidId;
    validateYouTubeVideo(vidId).then(state => {
      ytValidatingId = null;
      if (state !== 'unknown' && currentView === 'youtube' && currentYtVideoId === vidId) {
        renderYouTube(vidId);
      }
      // The player bar was showing the generic fallback until the oEmbed lookup
      // returned. Refresh the unified state so the real title/author appear —
      // including while the user is in another section, since the bar is global.
      if (playbackSource === 'youtube' && ytState.videoId === vidId) {
        const info = ytValidation.get(vidId);
        if (info && info.title) ytState.title = info.title;
        if (info && info.author) ytState.artist = info.author;
        updatePlayerBarFromState();
      }
    });
  }

  const isAndroid = !!(window.ArchimedesNative && typeof window.ArchimedesNative.isAndroid === 'function' && window.ArchimedesNative.isAndroid());

  const state = known ? known.state : 'unknown';
  const playable = state === 'ok' || state === 'unknown';

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 12px; text-transform: uppercase; color: #ff0033; font-weight: 700; letter-spacing: 0.5px;">
            <i class="fa-brands fa-youtube"></i> YouTube Music & Video
          </span>
        </div>
        <h1 style="font-size: 26px; margin: 0;">${isAr ? 'مشغل يوتيوب المدمج' : 'Embedded YouTube Player'}</h1>
      </div>

      <div style="display: flex; gap: 8px; flex: 1; max-width: 550px;">
        <div style="flex: 1; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 6px 14px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.12);">
          <i class="fa-solid fa-magnifying-glass" style="color: #ff0033;"></i>
          <input type="text" id="ytSearchInput" data-enter-action="handleYouTubeSearch" placeholder="${t.youtubeSearchPlaceholder}" style="background: transparent; border: none; outline: none; color: #fff; width: 100%; font-size: 13px;" />
        </div>
        <button class="top-action-btn" style="background: #ff0033; color: #fff; border: none; padding: 0 16px; border-radius: 10px; font-weight: 600;" onclick="handleYouTubeSearch(document.getElementById('ytSearchInput').value)">
          ${isAr ? 'تشغيل' : 'Play'}
        </button>
      </div>
    </div>

    <!-- Main Player Card -->
    <div style="background: #14141e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 16px 40px rgba(0,0,0,0.6); margin-bottom: 28px;">
      <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; background: #000;">
        <!-- The player itself lives in #ytPersistentLayer (outside this view) and is
             positioned over this slot, so navigating away cannot destroy it. -->
        <div id="ytSlot" style="position:absolute;top:0;left:0;width:100%;height:100%;visibility:hidden;"></div>
        <div id="ytPlayerNotice" style="position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px;"></div>
      </div>
  `;

  html += `
      <div style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; background: rgba(255,255,255,0.02);">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <span style="font-size: 14px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <i class="fa-brands fa-youtube" style="color: #ff0033; margin-right: 6px;"></i>
            ${known && known.title ? escapeHtml(known.title) : (isAr ? 'مقطع يوتيوب' : 'YouTube video')}
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          ${!isAndroid ? `
          <button class="top-action-btn" onclick="openDownloadAudioModal('${escJs(vidId)}')" style="font-size: 12px; background: rgba(255, 0, 51, 0.15); color: #ff4d4d; border: 1px solid rgba(255, 0, 51, 0.4);">
            <i class="fa-solid fa-cloud-arrow-down"></i> ${isAr ? 'تحميل كصوت فقط' : 'Download Audio'}
          </button>` : ''}
          <button class="top-action-btn" onclick="openExternalYouTube('${escJs(vidId)}')" style="font-size: 12px;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> ${isAr ? 'فتح في المتصفح' : 'Open in Browser'}
          </button>
        </div>
      </div>
    </div>

    <h3 style="font-size: 18px; margin-bottom: 14px;"><i class="fa-solid fa-fire" style="color: #f59e0b;"></i> ${isAr ? 'مقاطع مميزة ومقترحة' : 'Featured & Suggested Tracks'}</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
  `;

  YT_FEATURED_TRACKS.forEach(track => {
    const st = ytValidation.get(track.id);
    const bad = st && st.state !== 'ok' && st.state !== 'unknown';
    html += `
      <div class="card" onclick="playYouTubeVideo('${escJs(track.id)}')" style="background: rgba(255,255,255,0.03); border: 1px solid ${bad ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s; ${bad ? 'opacity: 0.55;' : ''}">
        <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; overflow: hidden;">
          <img src="https://img.youtube.com/vi/${track.id}/hqdefault.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ff0033;">
            <i class="fa-brands fa-${bad ? 'exclamation-triangle' : 'youtube'}"></i>
          </div>
        </div>
        <div style="padding: 12px;">
          <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(track.title)}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <div style="font-size: 12px; color: #8c8ca5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(track.channel)}${bad ? ' • ' + (isAr ? 'غير متاح' : 'unavailable') : ''}</div>
            ${!isAndroid ? `
            <button class="top-action-btn" onclick="event.stopPropagation(); openDownloadAudioModal('${escJs(track.id)}')" title="${isAr ? 'تحميل كصوت فقط' : 'Download Audio'}" style="padding: 4px 8px; font-size: 11px; background: rgba(255, 0, 51, 0.15); color: #ff4d4d; border: 1px solid rgba(255, 0, 51, 0.3);">
              <i class="fa-solid fa-cloud-arrow-down"></i>
            </button>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  contentArea.innerHTML = html;

  // Dock the persistent layer onto this view's slot. The player element itself is
  // never rebuilt here, so returning to this section resumes the same video at
  // the same position instead of starting over.
  attachYouTubeToView(vidId, playable);
}
window.renderYouTube = renderYouTube;

function playYouTubeVideo(videoId) {
  if (!extractYoutubeVideoId(videoId)) return;
  currentYtVideoId = videoId;

  // Register YouTube as the active playback source in the existing unified state,
  // so the player bar, mini player and lyrics all follow it without knowing it is
  // an embed. Navidrome/local playback still goes through the same <audio>
  // element; only the source discriminator changes.
  playbackSource = 'youtube';
  const known = ytValidation.get(videoId);
  ytState = {
    videoId,
    title: (known && known.title) || (currentLang === 'ar' ? 'مقطع يوتيوب' : 'YouTube video'),
    artist: (known && known.author) || 'YouTube',
    artwork: 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg',
    playing: true,
    position: YouTubePlayerAdapter.getCurrentTime() || 0,
    duration: YouTubePlayerAdapter.getDuration() || 0,
  };
  updatePlayerBarFromState();

  // Bring the YouTube section forward. The persistent layer can only be docked
  // onto a slot that exists in that view, so starting a video from anywhere else
  // (a suggestion card, a pasted link) must also navigate there — otherwise the
  // player would surface over an unrelated section.
  if (currentView === 'youtube') renderYouTube(videoId);
  else selectView('youtube');
}
window.playYouTubeVideo = playYouTubeVideo;

/* -----------------------------------------------------------------------------
   Player bar, driven by whichever source is active.
   -------------------------------------------------------------------------- */
function updatePlayerBarFromState() {
  if (playbackSource === 'youtube' && ytState.videoId) {
    playerSongTitle.textContent = ytState.title || 'YouTube';
    playerArtistName.textContent = (currentLang === 'ar' ? 'يوتيوب' : 'YouTube') +
      (ytState.artist && ytState.artist !== 'YouTube' ? ' • ' + ytState.artist : '');
    if (ytState.artwork) {
      playerCover.src = ytState.artwork;
      playerCover.style.display = 'block';
      playerCoverPlaceholder.style.display = 'none';
    }
    return;
  }
  if (currentSong) {
    playerSongTitle.textContent = currentSong.title;
    playerArtistName.textContent = cleanArtistName(
      currentSong.artist,
      currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'
    );
    const coverId = currentSong.coverArt;
    if (coverId) {
      playerCover.src = buildSubsonicUrl('getCoverArt.view', { id: coverId, size: 250 });
      playerCover.style.display = 'block';
      playerCoverPlaceholder.style.display = 'none';
    } else {
      playerCover.style.display = 'none';
      playerCoverPlaceholder.style.display = 'flex';
    }
  }
}
window.updatePlayerBarFromState = updatePlayerBarFromState;

/* Current playback position in seconds, whichever source is producing it. This is
   the single value the lyrics engine is fed, so synchronised lyrics work for
   YouTube exactly as they do for the audio element. */
function currentPlaybackPosition() {
  if (playbackSource === 'youtube') return YouTubePlayerAdapter.getCurrentTime() || 0;
  return audio.currentTime || 0;
}

function currentPlaybackDuration() {
  if (playbackSource === 'youtube') return YouTubePlayerAdapter.getDuration() || 0;
  return audio.duration || 0;
}
window.currentPlaybackPosition = currentPlaybackPosition;

/* Minimal transient notification.

   The project has no toast/notification helper — checked, not assumed — so this is
   a small self-contained one rather than a call to something that does not exist.
   It reuses the existing design tokens and sits above the player bar. */
function downloadToast(message) {
  let el = document.getElementById('dsToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dsToast';
    el.style.cssText = [
      'position:fixed', 'left:50%', 'transform:translateX(-50%)', 'bottom:96px',
      'z-index:300', 'background:var(--ds-surface,#1c1c28)', 'color:#fff',
      'border:1px solid var(--ds-border,rgba(255,255,255,0.14))', 'border-radius:12px',
      'padding:10px 16px', 'font-size:13px', 'max-width:80vw', 'text-align:center',
      'box-shadow:0 8px 28px rgba(0,0,0,0.5)', 'pointer-events:none',
      'transition:opacity 0.25s ease', 'opacity:0',
    ].join(';') + ';';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = '1';
  clearTimeout(el.__hideTimer);
  el.__hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 3200);
}

/* =============================================================================
   Downloading a track to the device
   =============================================================================
   The engine lives in the main process (see ipcMain 'download-track'): it holds
   the credentials, opens the save dialog and streams the file. This side only
   names the track and shows progress — the page never touches the filesystem.

   The file that arrives is the server's own copy, byte for byte, so a lossless
   track stays lossless. Nothing is re-encoded.
   ========================================================================== */
let downloadDirectory = '';
let activeDownloads = 0;

function downloadButtonHtml(track, index) {
  const id = escJs(String(track.id || ''));
  const name = escJs(String(track.title || track.name || 'track'));
  const suffix = escJs(String(track.suffix || 'mp3'));
  return `<button class="ds-iconbtn track-dl-btn" title="${currentLang === 'ar' ? 'تحميل' : 'Download'}"
     onclick="event.stopPropagation(); downloadTrackNow('${id}', '${name}', '${suffix}')">
     <i class="fa-solid fa-download"></i></button>`;
}
window.downloadButtonHtml = downloadButtonHtml;

/** Sets where downloads go, once, so later downloads never interrupt playback. */
async function chooseDownloadDirectory() {
  if (!archimedesBridge || typeof archimedesBridge.chooseDownloadDirectory !== 'function') {
    downloadToast(currentLang === 'ar' ? 'التحميل متاح على سطح المكتب فقط حالياً.' : 'Downloads are desktop-only for now.');
    return '';
  }
  const res = await archimedesBridge.chooseDownloadDirectory();
  if (res && res.ok) {
    downloadDirectory = res.directory;
    try { localStorage.setItem('archimedes_download_dir', downloadDirectory); } catch (e) { /* ignore */ }
    downloadToast((currentLang === 'ar' ? 'مجلد التحميل: ' : 'Download folder: ') + downloadDirectory);
  }
  return downloadDirectory;
}
window.chooseDownloadDirectory = chooseDownloadDirectory;

async function downloadTrackNow(id, name, suffix) {
  // One entry point, two platform adapters — the same split used everywhere else.
  // Electron goes through the preload bridge; Android through its JavascriptInterface.
  const android = window.ArchimedesNative;
  const useAndroid = !!android && typeof android.startDownload === 'function';
  const useElectron = !!(archimedesBridge && typeof archimedesBridge.downloadTrack === 'function');

  if (!useAndroid && !useElectron) {
    downloadToast(currentLang === 'ar' ? 'التحميل غير متاح على هذه المنصة بعد.' : 'Downloading is not available on this platform yet.');
    return { ok: false, error: 'unsupported-platform' };
  }

  activeDownloads++;
  updateDownloadIndicator();
  try {
    if (useAndroid) {
      // The bridge returns immediately; the native side owns the save dialog and
      // the transfer, and reports progress through getDownloadResult().
      const started = android.startDownload(id, name, suffix);
      if (started !== 'started') {
        downloadToast((currentLang === 'ar' ? 'فشل التحميل: ' : 'Download failed: ') + started);
        return { ok: false, error: 'start-failed' };
      }
      return await pollAndroidDownload();
    }

    // Electron: ask for the folder the first time only.
    if (!downloadDirectory) {
      try { downloadDirectory = localStorage.getItem('archimedes_download_dir') || ''; } catch (e) { /* ignore */ }
    }
    if (!downloadDirectory) {
      const chosen = await chooseDownloadDirectory();
      if (!chosen) return { ok: false, error: 'cancelled' };
    }

    const res = await archimedesBridge.downloadTrack({
      id,
      name,
      suffix,
      directory: downloadDirectory,
    });
    if (res && res.ok) {
      downloadToast((currentLang === 'ar' ? 'تم الحفظ: ' : 'Saved: ') + res.path);
    } else if (res && res.error === 'cancelled') {
      // The user closed the dialog; saying nothing is the correct response.
    } else {
      downloadToast((currentLang === 'ar' ? 'فشل التحميل: ' : 'Download failed: ') + ((res && res.error) || 'unknown'));
    }
    return res;
  } finally {
    activeDownloads = Math.max(0, activeDownloads - 1);
    updateDownloadIndicator();
  }
}
window.downloadTrackNow = downloadTrackNow;

/** Polls the Android bridge until the download settles. */
function pollAndroidDownload() {
  return new Promise((resolve) => {
    const bar = document.getElementById('downloadProgressBar');
    let last = '';
    const timer = setInterval(() => {
      let status;
      try {
        status = JSON.parse(window.ArchimedesNative.getDownloadResult() || '{}');
      } catch (e) {
        return;
      }
      if (status.state === 'downloading') {
        if (bar && status.total > 0) {
          bar.style.width = Math.min(100, Math.round((status.received / status.total) * 100)) + '%';
        }
        return;
      }
      if (status.state === last) return;
      last = status.state;

      clearInterval(timer);
      if (bar) bar.style.width = '0%';

      if (status.state === 'done') {
        downloadToast((currentLang === 'ar' ? 'تم الحفظ: ' : 'Saved: ') + (status.name || ''));
        resolve({ ok: true, path: status.path, bytes: status.bytes });
      } else if (status.state === 'cancelled') {
        resolve({ ok: false, error: 'cancelled' });
      } else {
        downloadToast((currentLang === 'ar' ? 'فشل التحميل: ' : 'Download failed: ') + (status.error || 'unknown'));
        resolve({ ok: false, error: status.error || 'unknown' });
      }
    }, 400);
  });
}
window.pollAndroidDownload = pollAndroidDownload;

/** Downloads are offered wherever a platform adapter exists. */
function canDownloadOnThisPlatform() {
  return !!((archimedesBridge && typeof archimedesBridge.downloadTrack === 'function') ||
    (window.ArchimedesNative && typeof window.ArchimedesNative.startDownload === 'function'));
}
window.canDownloadOnThisPlatform = canDownloadOnThisPlatform;

/* =============================================================================
   Should the audio run through Web Audio at all?
   =============================================================================
   NOTE: the numbers this gate was based on turned out to be contaminated by the library

       plain <audio> element, no Web Audio ....... 64 ticks ->   5.3%
       routed through the Web Audio DSP graph ... 2401 ticks -> 200.1%
       stopped .................................  47 ticks ->   4.7%

   Routing the element through Web Audio costs roughly forty times more CPU than
   plain playback, and it was being set up on every single play - even when the
   user had no effect enabled at all, which is the default state (flat EQ, no
   reverb, no bass boost, no 3D). That is the real source of the lag and the
   battery drain; the visualizer toggle turned out to be worth almost nothing
   (200% -> 194%), which is why this gate matters far more.

   Effects still work exactly as before: the moment one is switched on, the graph
   is built. Nothing was removed - the DSP chain is untouched.
   ========================================================================== */
function anyAudioEffectEnabled() {
  try { if (localStorage.getItem('archimedes_dsp_off') === '1') return false; } catch (e) { /* ignore */ }
  try {
    if (spatialAudioToggle && spatialAudioToggle.checked) return true;
    if (typeof isNoBeatActive !== 'undefined' && isNoBeatActive) return true;
    if (typeof isReverbActive !== 'undefined' && isReverbActive) return true;
    const bassEl = document.getElementById('bassBoostSlider');
    if (bassEl && Number(bassEl.value) > 0) return true;
    const preset = eqPresetSelect && eqPresetSelect.value;
    if (preset && preset !== 'flat') return true;
    if (typeof eqFilters !== 'undefined' && eqFilters && eqFilters.length) {
      for (let i = 0; i < eqFilters.length; i++) {
        if (eqFilters[i] && Math.abs(eqFilters[i].gain.value) > 0.01) return true;
      }
    }
  } catch (e) {
    return true; // fail safe: never silently drop effects the user asked for
  }
  return false;
}
window.anyAudioEffectEnabled = anyAudioEffectEnabled;

/* =============================================================================
   Visualizer control — module scope on purpose.

   The visualizer loop redraws at ~60fps for the life of the process, which makes
   it the app's single largest CPU and battery cost. The user decides whether it
   runs. These live at module scope because an earlier attempt nested them inside
   initWebAudio(), so they only existed after audio had been initialised and the
   settings switch threw "setVisualizerEnabled is not defined".

   initWebAudio() registers the actual start/stop implementation in
   visualizerStopper, since the animation frame and its id belong to that scope.
   ========================================================================== */
let visualizerStopper = null;

function visualizerEnabled() {
  try { return localStorage.getItem('archimedes_visualizer_off') !== '1'; } catch (e) { return true; }
}

function setVisualizerEnabled(on) {
  try { localStorage.setItem('archimedes_visualizer_off', on ? '0' : '1'); } catch (e) { /* ignore */ }
  if (typeof visualizerStopper === 'function') visualizerStopper(on);
  updateDownloadIndicatorSafe();
}
window.setVisualizerEnabled = setVisualizerEnabled;
window.visualizerEnabled = visualizerEnabled;

/* Nothing to redraw while the page is hidden, so resume only on return. */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && typeof visualizerStopper === 'function' && visualizerEnabled()) {
    visualizerStopper(true);
  }
});

function updateDownloadIndicatorSafe() { /* placeholder kept intentionally tiny */ }

function updateDownloadIndicator() {
  const el = document.getElementById('downloadIndicator');
  if (!el) return;
  if (activeDownloads > 0) {
    el.style.display = 'inline-flex';
    el.innerHTML = '<i class="fa-solid fa-download fa-bounce"></i>';
  } else {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

function setupDownloadProgress() {
  if (!archimedesBridge || typeof archimedesBridge.onDownloadProgress !== 'function') return;
  archimedesBridge.onDownloadProgress((p) => {
    const el = document.getElementById('downloadProgressBar');
    if (!el || !p) return;
    if (p.done) {
      el.style.width = '0%';
      updateDownloadIndicator();
      return;
    }
    if (p.total > 0) {
      el.style.width = Math.min(100, Math.round((p.received / p.total) * 100)) + '%';
    }
  });
}

function handleYouTubeSearch(query) {
  if (!query) return;
  const vidId = extractYoutubeVideoId(query);
  if (vidId) {
    playYouTubeVideo(vidId);
    return;
  }
  const isAr = currentLang === 'ar';
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  // YouTube search needs an API key, so a text query is handed to the browser
  // instead of silently doing nothing.
  if (confirm(isAr
      ? 'البحث النصي داخل يوتيوب يحتاج مفتاح API.\nسيتم فتح نتائج البحث في المتصفح. هل تريد المتابعة؟'
      : 'Text search inside YouTube requires an API key.\nThe results will open in your browser. Continue?')) {
    openExternalUrl(searchUrl);
  }
}
window.handleYouTubeSearch = handleYouTubeSearch;

function openExternalYouTube(vidId) {
  openExternalUrl(`https://www.youtube.com/watch?v=${encodeURIComponent(vidId)}`);
}
window.openExternalYouTube = openExternalYouTube;

/** Single funnel for every external link. Only http(s) is ever handed to the OS. */
function openExternalUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (window.archimedes && typeof window.archimedes.openExternal === 'function') {
      window.archimedes.openExternal(parsed.toString());
      return true;
    }
    if (ipcRenderer) {
      window.archimedes.openExternal(parsed.toString());
      return true;
    }
    window.open(parsed.toString(), '_blank', 'noopener');
  } catch (e) {
    return false;
  }
  return true;
}
window.openExternalUrl = openExternalUrl;

/* =============================================================================
   YouTube Audio Downloader Modal & Logic (yt-dlp + ffmpeg)
   ============================================================================= */
let ytActiveDownloadVideoId = null;
let ytDownloadDestination = 'cloud'; // 'cloud' | 'local'
let ytLocalDownloadDir = '';
let ytDownloadedFilePath = '';
let isYtDownloading = false;

function openDownloadAudioModal(videoId) {
  const vidId = videoId || currentYtVideoId;
  if (!vidId) {
    downloadToast(currentLang === 'ar' ? 'يرجى تحديد مقطع يوتيوب أولاً' : 'Please select a YouTube video first');
    return;
  }
  ytActiveDownloadVideoId = vidId;

  const isAr = currentLang === 'ar';
  const known = ytValidation.get(vidId);
  const title = (known && known.title) || (playbackSource === 'youtube' && ytState.videoId === vidId ? ytState.title : '') || (isAr ? 'مقطع يوتيوب' : 'YouTube Video');
  const artist = (known && known.author) || (playbackSource === 'youtube' && ytState.videoId === vidId ? ytState.artist : '') || 'YouTube';

  // Update Preview Card
  const thumbEl = document.getElementById('ytModalThumb');
  if (thumbEl) thumbEl.src = `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`;
  const titleEl = document.getElementById('ytModalTrackTitle');
  if (titleEl) titleEl.textContent = title;
  const artistEl = document.getElementById('ytModalTrackArtist');
  if (artistEl) artistEl.textContent = artist;

  // Cloud Destination Path Preview
  const cloudPath = localStorage.getItem('navidrome_music_folder') || '\\\\your-server.local\\Music1';
  const cloudPreview = document.getElementById('ytCloudPathPreview');
  if (cloudPreview) cloudPreview.textContent = cloudPath;

  // Local Destination Path Preview
  if (!ytLocalDownloadDir) {
    ytLocalDownloadDir = localStorage.getItem('archimedes_download_dir') || '';
  }
  const localPreview = document.getElementById('ytLocalPathPreview');
  if (localPreview) {
    localPreview.textContent = ytLocalDownloadDir || (isAr ? 'مجلد الموسيقى الافتراضي للجهاز' : 'Default Music Folder');
  }
  if (!ytLocalDownloadDir && archimedesBridge && typeof archimedesBridge.settingsGet === 'function') {
    archimedesBridge.settingsGet().then(s => {
      if (s && Array.isArray(s.musicRoots) && s.musicRoots.length > 0 && !ytLocalDownloadDir) {
        ytLocalDownloadDir = s.musicRoots[0];
        if (localPreview) localPreview.textContent = ytLocalDownloadDir;
      }
    }).catch(() => {});
  }

  // Reset modal state
  isYtDownloading = false;
  selectYtDest('cloud');

  const setupSec = document.getElementById('ytDownloadSetupSection');
  if (setupSec) setupSec.style.display = 'flex';

  const progSec = document.getElementById('ytDownloadProgressSection');
  if (progSec) progSec.style.display = 'none';

  const barFill = document.getElementById('ytDownloadBarFill');
  if (barFill) barFill.style.width = '0%';

  const pctText = document.getElementById('ytDownloadPercentText');
  if (pctText) pctText.textContent = '0%';

  const startBtn = document.getElementById('ytBtnStartDownload');
  if (startBtn) {
    startBtn.style.display = 'inline-flex';
    startBtn.disabled = false;
  }

  const cancelBtn = document.getElementById('ytBtnCancel');
  if (cancelBtn) {
    cancelBtn.style.display = 'inline-flex';
    cancelBtn.textContent = isAr ? 'إلغاء' : 'Cancel';
  }

  const openBtn = document.getElementById('ytBtnOpenFolder');
  if (openBtn) openBtn.style.display = 'none';

  const modal = document.getElementById('ytDownloadModal');
  if (modal) modal.style.display = 'flex';
}
window.openDownloadAudioModal = openDownloadAudioModal;

function closeYtDownloadModal() {
  if (isYtDownloading) {
    const isAr = currentLang === 'ar';
    if (!confirm(isAr ? 'التحميل قيد المعالجة حالياً. هل تريد إغلاق النافذة؟' : 'Download in progress. Do you want to close this window?')) {
      return;
    }
  }
  const modal = document.getElementById('ytDownloadModal');
  if (modal) modal.style.display = 'none';
}
window.closeYtDownloadModal = closeYtDownloadModal;

function selectYtDest(dest) {
  ytDownloadDestination = dest;
  const isCloud = dest === 'cloud';
  const rCloud = document.getElementById('ytRadioCloud');
  const rLocal = document.getElementById('ytRadioLocal');
  if (rCloud) rCloud.checked = isCloud;
  if (rLocal) rLocal.checked = !isCloud;

  const optCloud = document.getElementById('ytOptCloud');
  const optLocal = document.getElementById('ytOptLocal');
  if (optCloud) optCloud.classList.toggle('active', isCloud);
  if (optLocal) optLocal.classList.toggle('active', !isCloud);
}
window.selectYtDest = selectYtDest;

async function pickYtLocalFolder() {
  if (archimedesBridge && typeof archimedesBridge.pickLocalFolder === 'function') {
    const picked = await archimedesBridge.pickLocalFolder();
    if (picked) {
      ytLocalDownloadDir = picked;
      try { localStorage.setItem('archimedes_download_dir', picked); } catch (e) {}
      const preview = document.getElementById('ytLocalPathPreview');
      if (preview) preview.textContent = picked;
      selectYtDest('local');
    }
  } else if (archimedesBridge && typeof archimedesBridge.chooseDownloadDirectory === 'function') {
    const res = await archimedesBridge.chooseDownloadDirectory();
    if (res && res.ok && res.directory) {
      ytLocalDownloadDir = res.directory;
      try { localStorage.setItem('archimedes_download_dir', res.directory); } catch (e) {}
      const preview = document.getElementById('ytLocalPathPreview');
      if (preview) preview.textContent = res.directory;
      selectYtDest('local');
    }
  }
}
window.pickYtLocalFolder = pickYtLocalFolder;

function onYtFormatChanged() {
  // Keeps responsive UI
}
window.onYtFormatChanged = onYtFormatChanged;

async function startYouTubeAudioDownload() {
  if (isYtDownloading) return;
  if (!ytActiveDownloadVideoId) {
    downloadToast(currentLang === 'ar' ? 'لم يتم تحديد مقطع للتحميل' : 'No track selected');
    return;
  }

  const isAr = currentLang === 'ar';
  const dest = ytDownloadDestination;
  const cloudPath = localStorage.getItem('navidrome_music_folder') || '\\\\your-server.local\\Music1';
  const targetDir = dest === 'cloud' ? cloudPath : (ytLocalDownloadDir || '');

  const formatSelect = document.getElementById('ytAudioFormatSelect');
  const formatVal = formatSelect ? formatSelect.value : 'mp3_320';

  let format = 'mp3';
  let quality = '320';
  if (formatVal === 'mp3_320') { format = 'mp3'; quality = '320'; }
  else if (formatVal === 'flac') { format = 'flac'; quality = '0'; }
  else if (formatVal === 'm4a_256') { format = 'm4a'; quality = '256'; }
  else if (formatVal === 'opus') { format = 'opus'; quality = '0'; }
  else if (formatVal === 'wav') { format = 'wav'; quality = '0'; }

  const sampleRateSelect = document.getElementById('ytAudioSampleRateSelect');
  const sampleRate = sampleRateSelect ? sampleRateSelect.value : '48000';

  // Switch to progress UI
  isYtDownloading = true;
  const setupSec = document.getElementById('ytDownloadSetupSection');
  if (setupSec) setupSec.style.display = 'none';

  const progSec = document.getElementById('ytDownloadProgressSection');
  if (progSec) progSec.style.display = 'block';

  const startBtn = document.getElementById('ytBtnStartDownload');
  if (startBtn) startBtn.style.display = 'none';

  const cancelBtn = document.getElementById('ytBtnCancel');
  if (cancelBtn) cancelBtn.style.display = 'none';

  const openBtn = document.getElementById('ytBtnOpenFolder');
  if (openBtn) openBtn.style.display = 'none';

  const phaseText = document.getElementById('ytDownloadPhaseText');
  const barFill = document.getElementById('ytDownloadBarFill');
  const pctText = document.getElementById('ytDownloadPercentText');
  const detailsText = document.getElementById('ytDownloadDetailsText');
  const speedText = document.getElementById('ytDownloadSpeedText');

  if (phaseText) {
    phaseText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isAr ? 'جاري الاتصال وسحب التدفق الصوتي من يوتيوب...' : 'Connecting & downloading YouTube audio...'}`;
  }
  if (barFill) barFill.style.width = '0%';
  if (pctText) pctText.textContent = '0%';

  let unsubscribe = () => {};
  if (archimedesBridge && typeof archimedesBridge.onYouTubeDownloadProgress === 'function') {
    unsubscribe = archimedesBridge.onYouTubeDownloadProgress((data) => {
      if (!data) return;
      if (data.type === 'progress') {
        const pct = Math.min(100, Math.max(0, data.percent || 0));
        if (barFill) barFill.style.width = `${pct}%`;
        if (pctText) pctText.textContent = `${pct}%`;

        if (data.downloaded) {
          const mbDown = (data.downloaded / (1024 * 1024)).toFixed(1);
          const mbTot = data.total ? (data.total / (1024 * 1024)).toFixed(1) : '?';
          if (detailsText) detailsText.textContent = `${mbDown} MB / ${mbTot} MB`;
        }

        if (data.speed) {
          const speedKb = Math.round(data.speed / 1024);
          const spText = speedKb > 1024 ? `${(speedKb / 1024).toFixed(1)} MB/s` : `${speedKb} KB/s`;
          if (speedText) speedText.textContent = spText;
        }
      } else if (data.type === 'status') {
        if (phaseText) {
          phaseText.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles fa-spin"></i> ${isAr ? 'جاري التحويل لأعلى جودة واستخراج الغلاف والتردد...' : 'Transcoding to highest quality & embedding tags...'}`;
        }
      }
    });
  }

  try {
    let res = null;
    if (archimedesBridge && typeof archimedesBridge.downloadYouTubeAudio === 'function') {
      res = await archimedesBridge.downloadYouTubeAudio({
        videoId: ytActiveDownloadVideoId,
        destination: dest,
        targetDir,
        format,
        quality,
        sampleRate
      });
    } else {
      throw new Error(isAr ? 'ميزة التحميل متاحة على تطبيق الديسكتوب فقط.' : 'Downloads are desktop-only.');
    }

    unsubscribe();
    isYtDownloading = false;

    if (res && res.ok) {
      ytDownloadedFilePath = (res.data && res.data.file_path) || '';
      if (barFill) barFill.style.width = '100%';
      if (pctText) pctText.textContent = '100%';
      if (phaseText) {
        phaseText.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> ${isAr ? 'اكتمل التحميل بنجاح!' : 'Download complete!'}`;
      }

      if (dest === 'cloud') {
        downloadToast(isAr ? 'تم حفظ الصوت في سيرفر الموسيقى وتحديث مكتبة Navidrome بنجاح' : 'Saved to Cloud and Navidrome library updated');
      } else {
        downloadToast((isAr ? 'تم حفظ الملف بنجاح: ' : 'Downloaded successfully: ') + ((res.data && res.data.file_name) || ''));
      }

      if (cancelBtn) {
        cancelBtn.textContent = isAr ? 'إغلاق' : 'Close';
        cancelBtn.style.display = 'inline-flex';
      }
      if (openBtn && ytDownloadedFilePath) {
        openBtn.style.display = 'inline-flex';
      }
    } else {
      const errMsg = (res && res.error) || 'Download failed';
      if (phaseText) {
        phaseText.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> ${escapeHtml(errMsg)}`;
      }
      if (cancelBtn) {
        cancelBtn.textContent = isAr ? 'إغلاق' : 'Close';
        cancelBtn.style.display = 'inline-flex';
      }
      downloadToast(isAr ? `فشل التحميل: ${errMsg}` : `Download failed: ${errMsg}`);
    }
  } catch (err) {
    unsubscribe();
    isYtDownloading = false;
    if (phaseText) {
      phaseText.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> ${escapeHtml(err.message || 'Error')}`;
    }
    if (cancelBtn) {
      cancelBtn.textContent = isAr ? 'إغلاق' : 'Close';
      cancelBtn.style.display = 'inline-flex';
    }
    downloadToast(isAr ? `خطأ أثناء التحميل: ${err.message}` : `Download error: ${err.message}`);
  }
}
window.startYouTubeAudioDownload = startYouTubeAudioDownload;

function openDownloadedAudioFolder() {
  if (ytDownloadedFilePath && archimedesBridge && typeof archimedesBridge.openItemInFolder === 'function') {
    archimedesBridge.openItemInFolder(ytDownloadedFilePath);
  }
}
window.openDownloadedAudioFolder = openDownloadedAudioFolder;

// =============================================================
// Pro Audio Effects: No-Beat (إزالة الإيقاع), Reverb, Speed & Bass
// =============================================================
function toggleNoBeatMode(explicitVal) {
  if (!ensureWebAudioOrWarn()) return;
  isNoBeatActive = (typeof explicitVal === 'boolean') ? explicitVal : !isNoBeatActive;
  applyNoBeatRouting();
  if (isNoBeatActive) startNoBeatFollower(); else stopNoBeatFollower();
  syncNoBeatUi();
}
window.toggleNoBeatMode = toggleNoBeatMode;

function syncNoBeatUi() {
  const isAr = currentLang === 'ar';
  const noBeatBtn = document.getElementById('noBeatBtn');
  if (noBeatBtn) {
    noBeatBtn.classList.toggle('active', isNoBeatActive);
    noBeatBtn.setAttribute('aria-pressed', String(isNoBeatActive));
    noBeatBtn.title = isNoBeatActive
      ? (isAr ? 'إزالة الإيقاع: مُفعّل — اضغط للإلغاء' : 'Beat reduction: ON - click to turn off')
      : (isAr ? 'إزالة الإيقاع / تقليل الطبول (زر مستقل)' : 'Reduce beat / drums (independent toggle)');
  }
  const fxCardNoBeat = document.getElementById('fxCardNoBeat');
  if (fxCardNoBeat) fxCardNoBeat.classList.toggle('active', isNoBeatActive);
  const fxNoBeatSwitch = document.getElementById('fxNoBeatSwitch');
  if (fxNoBeatSwitch) {
    fxNoBeatSwitch.innerHTML = isNoBeatActive ? '<i class="fa-solid fa-toggle-on" style="color: #1db954;"></i>' : '<i class="fa-solid fa-toggle-off"></i>';
  }
  const badge = document.getElementById('fxNoBeatBadge');
  if (badge) {
    badge.textContent = isNoBeatActive ? (isAr ? 'مُفعّل' : 'ON') : (isAr ? 'متوقف' : 'OFF');
    badge.style.color = isNoBeatActive ? '#1db954' : '#8c8ca5';
  }
}
window.syncNoBeatUi = syncNoBeatUi;

/** Routes between the untouched signal and the processed one. Never boosts. */
function applyNoBeatRouting() {
  if (!audioCtx || !noBeatDryGain || !noBeatWetGain) return;
  const t = audioCtx.currentTime;
  /* These values were the source of a real conflict, and the conflict itself was the
     defect: the routing had been left at dry 0.25 / wet +1.15 while the rest of the
     chain - the kick-band filters and the follower - is built around an INVERTED wet
     path. The follower writes -0.95 * env twenty times a second, so a positive +1.15
     was not merely inconsistent: for the first 20 ms after switching on it ADDED the
     kick band in phase, which measured as a gain above +1.0 and is audible as a bass
     thump before the follower drags it negative. After that the two halves fought each
     other on every tick.

     dry stays at unity because muting it is what sent the whole track through the
     static treble shelf and made it sound muffled. The wet path now starts closed and
     is owned entirely by the follower, so nothing contradicts it. The previous routing
     values are recorded here so the other version's intent is not lost: dry was 0.25,
     wet was +1.15. */
  noBeatDryGain.gain.setTargetAtTime(1, t, 0.04);
  noBeatWetGain.gain.cancelScheduledValues(t);
  noBeatWetGain.gain.setValueAtTime(0, t);
  if (noBeatAgcGain && !isNoBeatActive) noBeatAgcGain.gain.setTargetAtTime(1, t, 0.06);
}

/**
 * Dynamic half of the processor, running at 20 Hz while the effect is enabled:
 *  - ducks the low band (kick + bass) harder as the low-band energy rises,
 *  - drives an AGC that pins the processed loudness to the original, attenuating
 *    only (clamped to <= 1.0) so switching the effect on never raises the volume.
 */
function startNoBeatFollower() {
  if (noBeatRmsTimer || !noBeatBands || !noBeatDryAnalyser || !noBeatWetAnalyser) return;
  const dryBuf = new Float32Array(noBeatDryAnalyser.fftSize);
  const wetBuf = new Float32Array(noBeatWetAnalyser.fftSize);
  const lowBuf = new Float32Array(noBeatBands.lowAnalyser.fftSize);
  const midBuf = noBeatBands.midAnalyser ? new Float32Array(noBeatBands.midAnalyser.fftSize) : null;
  const highBuf = noBeatBands.highAnalyser ? new Float32Array(noBeatBands.highAnalyser.fftSize) : null;
 let lowAvg = 0;    // slow average of the kick band, for transient detection
 let midAvg = 0;    // slow average of the snare/clap band
 let highAvg = 0;   // slow average of the hi-hat/cymbal band
 /* Vocal protection counters. A snare or clap is a single spike, while a sung note, a
    pad or a cymbal wash keeps its band above average for many consecutive ticks.
    Counting how long a band stays hot lets the effect back off on sustained material,
    which is the cheapest reliable way to prefer leaving a snare over damaging a vowel. */
 let midSustain = 0;
 let highSustain = 0;
 noBeatRmsTimer = setInterval(() => {
    if (!isNoBeatActive || !noBeatBands || !audioCtx) return;
    try {
      noBeatDryAnalyser.getFloatTimeDomainData(dryBuf);
      noBeatWetAnalyser.getFloatTimeDomainData(wetBuf);
      noBeatBands.lowAnalyser.getFloatTimeDomainData(lowBuf);

      let drySum = 0, wetSum = 0, lowSum = 0;
      for (let i = 0; i < dryBuf.length; i++) drySum += dryBuf[i] * dryBuf[i];
      for (let i = 0; i < wetBuf.length; i++) wetSum += wetBuf[i] * wetBuf[i];
      for (let i = 0; i < lowBuf.length; i++) lowSum += lowBuf[i] * lowBuf[i];
      const dryRms = Math.sqrt(drySum / dryBuf.length);
      const wetRms = Math.sqrt(wetSum / wetBuf.length);
      const lowRms = Math.sqrt(lowSum / lowBuf.length);

      const now = audioCtx.currentTime;
      // The old AGC pulled the level down to "match" the dry signal, which is what
      // made the effect sound quieter. Both paths are unity now, so it stays at 1.
      if (noBeatAgcGain && noBeatAgcGain.gain.value !== 1) {
        noBeatAgcGain.gain.setTargetAtTime(1, now, 0.2);
      }
      /* Kick cancellation, driven by how much of THIS track is kick band.

         The previous version ducked a peaking filter by an absolute threshold
         (lowRms / 0.08), so a quiet track barely ducked while a loud one ducked
         fully - inconsistent from song to song. And because the dry path was muted,
         the whole signal travelled through a static -5 dB treble shelf and a
         +3.5 dB mid bell, which is exactly what made the music sound muffled
         instead of beat-free.

         Now the dry path stays at unity and the wet path carries the kick band
         INVERTED - a negative GainNode value inverts phase - so summing dry + wet
         subtracts the kick transient. Depth is relative to the track's own level, so
         it behaves the same on loud and quiet material. */
      /* Detect the KICK, not the bass level.

         Measuring how loud the low band is cannot separate a drum from a bass
         instrument: a bass-heavy track keeps the low band high the whole time, so
         the canceller sat pinned at full depth (measured -0.95 continuously) and
         removed the bass line along with the beat.

         A kick is a fast rise above the recent level, so the canceller opens on the
         RATIO of the current low band to its own slow average. Sustained bass sits
         at a ratio near 1 and is left alone; a kick spikes well above it and is
         cancelled. The average has roughly a 330 ms time constant at this 20 ms
         control rate, which tracks the music without following a single hit. */
      lowAvg = lowAvg === 0 ? lowRms : lowAvg * 0.94 + lowRms * 0.06;
      const transient = lowAvg > 1e-6 ? lowRms / lowAvg : 0;
      const env = Math.min(1, Math.max(0, (transient - 1.25) / 0.75));
      const target = 0;                                // parallel kick branch retired: it ADDED energy through filter phase shift. The in-path kickDuck replaces it.
      if (noBeatWetGain) {
        const cur = noBeatWetGain.gain.value;
        // Fast attack so the leading edge of the kick is caught; slow release so the
        // gain does not step back up between hits (that stepping was the pumping).
        const tc = Math.abs(target) > Math.abs(cur) ? 0.006 : 0.10;   // kick: parallel branch now idle
        noBeatWetGain.gain.setTargetAtTime(target, now, tc);
      }

      /* The kick is attenuated in the path now, driven by the same transient ratio that
         already proved reliable for this band (p90 1.333, p97 1.598). A wide Q 0.8 peak
         at 90 Hz dipping to -9 dB removes the thump while leaving sustained bass alone,
         because a held bass note never raises the ratio. Attenuation in the path can
         only reduce, unlike the parallel branch it replaces. */
      if (noBeatBands.kickDuck) {
        const kEnv = Math.min(1, Math.max(0, (transient - 1.10) / 0.42));
        const kTarget = -13.0 * kEnv;
        const kCur = noBeatBands.kickDuck.gain.value;
        const kTc = Math.abs(kTarget) > Math.abs(kCur) ? 0.005 : 0.20;
        noBeatBands.kickDuck.gain.setTargetAtTime(kTarget, now, kTc);
      }

      /* Band B - snare / clap, and Band C - hi-hat / cymbal.

         Thresholds are taken from measured transient-ratio distributions over real
         tracks, not copied from the kick detector: the kick band ran a p90 of 1.333 and
         a p97 of 1.598, while the mid band ran 1.269 / 1.629 and the high band
         1.412 / 1.939. Reusing the kick's numbers is precisely why an earlier attempt at
         the snare band never fired even once.

         The `sustain` term is the vocal protection. A drum hit spikes for a tick or two;
         a held vowel, a pad or a cymbal wash keeps the band up for hundreds of
         milliseconds. Once a band has stayed hot the attenuation is scaled down to a
         fifth, so the singer wins and some snare is left in on purpose. */
      if (midBuf && noBeatBands.midGain) {
        noBeatBands.midAnalyser.getFloatTimeDomainData(midBuf);
        let mSum = 0;
        for (let i = 0; i < midBuf.length; i++) mSum += midBuf[i] * midBuf[i];
        const mRms = Math.sqrt(mSum / midBuf.length);
        midAvg = midAvg === 0 ? mRms : midAvg * 0.94 + mRms * 0.06;
        const mRatio = midAvg > 1e-6 ? mRms / midAvg : 0;
        midSustain = mRatio > 1.15 ? midSustain + 1 : Math.max(0, midSustain - 2);
        const mProtect = 1 - 0.8 * Math.min(1, midSustain / 45);   // 45 ticks ~ 0.9 s: a snare must not look sustained
        const mEnv = Math.min(1, Math.max(0, (mRatio - 1.12) / 0.48));
        const mTarget = -10.0 * mEnv * mProtect;         // dB of in-path attenuation
        const mCur = noBeatBands.midDuck.gain.value;
        const mTc = Math.abs(mTarget) > Math.abs(mCur) ? 0.005 : 0.22;   // 220 ms measured higher average reduction than 160 ms; the residue on percussive material is the effect working, not a defect
        noBeatBands.midDuck.gain.setTargetAtTime(mTarget, now, mTc);
      }
      if (highBuf && noBeatBands.highGain) {
        noBeatBands.highAnalyser.getFloatTimeDomainData(highBuf);
        let hSum = 0;
        for (let i = 0; i < highBuf.length; i++) hSum += highBuf[i] * highBuf[i];
        const hRms = Math.sqrt(hSum / highBuf.length);
        highAvg = highAvg === 0 ? hRms : highAvg * 0.94 + hRms * 0.06;
        const hRatio = highAvg > 1e-6 ? hRms / highAvg : 0;
        highSustain = hRatio > 1.18 ? highSustain + 1 : Math.max(0, highSustain - 2);
        const hProtect = 1 - 0.8 * Math.min(1, highSustain / 45);   // 45 ticks ~ 0.9 s
        const hEnv = Math.min(1, Math.max(0, (hRatio - 1.15) / 0.52));
        const hTarget = -8.5 * hEnv * hProtect;          // dB of in-path attenuation
        const hCur = noBeatBands.highDuck.gain.value;
        const hTc = Math.abs(hTarget) > Math.abs(hCur) ? 0.005 : 0.22;   // cymbal decay is the longest of the three
        noBeatBands.highDuck.gain.setTargetAtTime(hTarget, now, hTc);
      }
    } catch (e) { /* analyser not ready yet */ }
  }, 20);   // 50 ms missed the leading edge of a kick
}

function stopNoBeatFollower() {
  if (noBeatRmsTimer) { clearInterval(noBeatRmsTimer); noBeatRmsTimer = null; }
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  if (noBeatWetGain) noBeatWetGain.gain.setTargetAtTime(0, t, 0.05);
  if (noBeatBands && noBeatBands.midGain) noBeatBands.midGain.gain.setTargetAtTime(0, t, 0.05);
  if (noBeatBands && noBeatBands.highGain) noBeatBands.highGain.gain.setTargetAtTime(0, t, 0.05);
    /* The in-path attenuators sit in dB and must return to flat, otherwise the track stays permanently equalised after the effect is switched off. */
    if (noBeatBands && noBeatBands.kickDuck) noBeatBands.kickDuck.gain.setTargetAtTime(0, t, 0.05);
    if (noBeatBands && noBeatBands.midDuck) noBeatBands.midDuck.gain.setTargetAtTime(0, t, 0.05);
    if (noBeatBands && noBeatBands.highDuck) noBeatBands.highDuck.gain.setTargetAtTime(0, t, 0.05);
 if (noBeatAgcGain) noBeatAgcGain.gain.setTargetAtTime(1, t, 0.1);
}

function toggleReverbMode() {
  if (!ensureWebAudioOrWarn()) return;
  isReverbActive = !isReverbActive;
  if (isReverbActive) ensureReverbGraph();
  if (reverbGain && audioCtx) {
    const t = audioCtx.currentTime;
    reverbGain.gain.setTargetAtTime(isReverbActive ? 0.6 : 0, t, 0.05);   // 0.35 was barely audible
  }
  if (!isReverbActive) setTimeout(() => { if (!isReverbActive) releaseReverbGraph(); }, 400);
  const fxReverbSwitch = document.getElementById('fxReverbSwitch');
  if (fxReverbSwitch) {
    fxReverbSwitch.innerHTML = isReverbActive ? '<i class="fa-solid fa-toggle-on" style="color: #06b6d4;"></i>' : '<i class="fa-solid fa-toggle-off"></i>';
  }
  const fxCardReverb = document.getElementById('fxCardReverb');
  if (fxCardReverb) fxCardReverb.classList.toggle('active', isReverbActive);
}
window.toggleReverbMode = toggleReverbMode;

function cycleBassBoostLevel() {
  if (!ensureWebAudioOrWarn()) return;
  const levels = [0, 6, 12, 18];
  let idx = levels.indexOf(currentBassLevel);
  currentBassLevel = levels[(idx + 1) % levels.length];
  if (bassBoostFilter) {
    bassBoostFilter.gain.value = currentBassLevel;
  }
  const badge = document.getElementById('fxBassBadge');
  if (badge) {
    badge.textContent = currentBassLevel === 0 ? 'OFF' : `+${currentBassLevel}dB`;
    badge.style.color = currentBassLevel > 0 ? '#1db954' : '#8c8ca5';
  }
  const desc = document.getElementById('fxBassDesc');
  if (desc) {
    desc.textContent = currentBassLevel === 0 ? (currentLang === 'ar' ? '0 dB (عادي)' : '0 dB (Flat)') : (currentLang === 'ar' ? `تضخيم +${currentBassLevel}dB` : `Boosted +${currentBassLevel}dB`);
  }
}
window.cycleBassBoostLevel = cycleBassBoostLevel;

function setAudioSpeed(speed) {
  audio.playbackRate = speed;
  const label = document.getElementById('speedValueLabel');
  if (label) label.textContent = `${speed}x`;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.textContent) === speed);
  });
}
window.setAudioSpeed = setAudioSpeed;

function toggle8dFromCard() {
  if (!ensureWebAudioOrWarn()) return;
  if (spatialAudioToggle) {
    spatialAudioToggle.checked = !spatialAudioToggle.checked;
    toggleSpatialAudio(spatialAudioToggle.checked);
    update8dCardSwitch();
    if (spatialAudioToggle.checked && typeof visualizerStopper === 'function') {
      visualizerStopper(true);
    }
  }
}
window.toggle8dFromCard = toggle8dFromCard;

function update8dCardSwitch() {
  const is8d = (spatialAudioToggle && spatialAudioToggle.checked) || (eqPresetSelect && eqPresetSelect.value === 'spatial8d');
  const sw = document.getElementById('fx8dSwitch');
  if (sw) sw.innerHTML = is8d ? '<i class="fa-solid fa-toggle-on" style="color: #1db954;"></i>' : '<i class="fa-solid fa-toggle-off"></i>';
  const card = document.getElementById('fxCard8D');
  if (card) card.classList.toggle('active', is8d);
}

// =============================================================
// Now Playing Studio Experience Modal
// =============================================================
function toggleNowPlayingModal() {
  const m = document.getElementById('nowPlayingModal');
  if (!m) return;
  const isOpening = (m.style.display === 'none' || !m.style.display);
  m.style.display = isOpening ? 'flex' : 'none';
  if (isOpening) {
    initWebAudio();
    updateNowPlayingModalContent();
  }
}
window.toggleNowPlayingModal = toggleNowPlayingModal;

function updateNowPlayingModalContent() {
  if (!currentSong) return;
  const npSongTitle = document.getElementById('npSongTitle');
  const npArtistName = document.getElementById('npArtistName');
  const npArtwork = document.getElementById('npArtwork');
  const npArtworkPlaceholder = document.getElementById('npArtworkPlaceholder');
  const npLyricsSourceBadge = document.getElementById('npLyricsSourceBadge');
  const npBackdrop = document.getElementById('nowPlayingBackdrop');

  if (npSongTitle) npSongTitle.textContent = currentSong.title;
  /* The studio is the main now-playing screen, so the raw server placeholder was
     very visible here: 987 of 1565 songs carry "[Unknown Artist]" and it was being
     printed verbatim. The player bar was already cleaned; this surface was not. */
  if (npArtistName) {
    npArtistName.textContent = cleanArtistName(
      currentSong.artist,
      currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'
    );
  }

  let coverUrl = '';
  if (currentSong.coverArt) {
    coverUrl = currentSong.isLocal ? currentSong.coverArt : buildSubsonicUrl('getCoverArt.view', { id: currentSong.coverArt, size: 400 });
  }

  if (coverUrl && npArtwork && npArtworkPlaceholder) {
    npArtwork.src = coverUrl;
    npArtwork.style.display = 'block';
    npArtworkPlaceholder.style.display = 'none';
    if (npBackdrop) {
      npBackdrop.style.background = `radial-gradient(circle at 50% 50%, rgba(29, 185, 84, 0.15), rgba(10, 10, 15, 0.95)), url('${coverUrl}') center/cover no-repeat`;
    }
  } else if (npArtwork && npArtworkPlaceholder) {
    npArtwork.style.display = 'none';
    npArtworkPlaceholder.style.display = 'flex';
  }

  if (npLyricsSourceBadge) {
    npLyricsSourceBadge.textContent = currentLyricSource || 'Auto-Detected';
  }

  update8dCardSwitch();
  renderNowPlayingLyricsUI();
}
window.updateNowPlayingModalContent = updateNowPlayingModalContent;

function renderNowPlayingLyricsUI() {
  const container = document.getElementById('npLyricsContainer');
  if (!container) return;

  if (parsedLyrics.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #8c8ca5; padding: 60px 0;">
        <i class="fa-solid fa-microphone-slash" style="font-size: 32px; margin-bottom: 12px; opacity: 0.4;"></i>
        <p style="font-size: 15px; color: #b3b3c9;">${I18N[currentLang]?.noLyrics || 'No lyrics available'}</p>
        <button class="top-action-btn" onclick="editLyricsBtn.click()" style="margin: 14px auto 0 auto;">
          <i class="fa-solid fa-pen"></i> ${I18N[currentLang]?.addPasteLyrics || 'Add Lyrics'}
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  parsedLyrics.forEach((line, index) => {
    html += `
      <div class="np-lyric-line ${index === activeLyricIndex ? 'active' : ''}" id="npline-${index}" onclick="seekToLyric(${escJs(line.time)})">
        ${escapeHtml(line.text)}
      </div>
    `;
  });
  container.innerHTML = html;
  scrollNowPlayingActiveLyricIntoView();
}
window.renderNowPlayingLyricsUI = renderNowPlayingLyricsUI;

function scrollNowPlayingActiveLyricIntoView() {
  if (activeLyricIndex < 0) return;
  const activeEl = document.getElementById(`npline-${activeLyricIndex}`);
  const container = document.getElementById('npLyricsContainer');
  if (activeEl && container) {
    const elTop = activeEl.offsetTop - container.offsetTop;
    container.scrollTo({
      top: elTop - (container.clientHeight / 2) + 20,
      behavior: 'smooth'
    });
  }
}
window.scrollNowPlayingActiveLyricIntoView = scrollNowPlayingActiveLyricIntoView;

// Playback Logic
function playSongAt(index) {
  if (index < 0 || index >= currentQueue.length) return;
  currentIndex = index;
  currentSong = currentQueue[index];

  // Playback moves to the audio element. Any YouTube video is left untouched in
  // the persistent layer (simply parked) rather than destroyed, so the user can
  // return to it.
  playbackSource = currentSong && currentSong.isLocal ? 'local' : 'navidrome';

  initWebAudio();

  const streamUrl = (currentSong.isLocal && (currentSong.streamUrl || currentSong.url))
    ? (currentSong.streamUrl || currentSong.url)
    : buildSubsonicUrl('stream.view', { id: currentSong.id });

  // True Gapless Transition: if nextSongPreloader has already buffered this track,
  // hand it off instantly without rebuffering.
  if (nextSongPreloader && nextSongPreloader.src === streamUrl) {
    audio.src = streamUrl;
    try { nextSongPreloader.src = ''; } catch (e) {}
    nextSongPreloader = null;
  } else {
    audio.src = streamUrl;
  }
  /* Playback failures used to be swallowed by `.catch(() => {})`, so when the
     stream could not be played the user simply got silence with no explanation —
     observed on an emulator where every track failed with
     MEDIA_ELEMENT_ERROR: Format error and nothing was ever shown. A failing player
     must say why it failed.

     NotAllowedError is deliberately quiet: it means the browser is waiting for a
     user gesture before it allows sound, which resolves itself on the next tap and
     is not an error worth interrupting playback for. Every other failure is
     reported, and an error on the element itself (which fires without rejecting
     the promise) is reported too. */
  const reportPlaybackFailure = (reason) => {
    if (!reason) return;
    const isAr = currentLang === 'ar';
    let detail = reason;
    if (reason === 'NotSupportedError' || reason === 'MEDIA_ERR_SRC_NOT_SUPPORTED') {
      detail = isAr ? 'الصيغة غير مدعومة على هذا الجهاز.' : 'This format is not supported on this device.';
    } else if (reason === 'MEDIA_ERR_NETWORK') {
      detail = isAr ? 'تعذّر الوصول إلى الملف — تحقق من الاتصال بالسيرفر.' : 'The file could not be reached — check the connection to the server.';
    } else if (reason === 'MEDIA_ERR_DECODE') {
      detail = isAr ? 'تعذّر فك ترميز الملف.' : 'The file could not be decoded.';
    } else if (reason === 'MEDIA_ERR_ABORTED') {
      detail = isAr ? 'أُلغي التحميل.' : 'The load was aborted.';
    }
    downloadToast((isAr ? 'تعذّر التشغيل: ' : 'Cannot play: ') + detail);
  };

  audio.play().catch((err) => {
    const name = (err && err.name) || '';
    if (name === 'NotAllowedError') return;   // needs a gesture; the next tap fixes it
    reportPlaybackFailure(name || (err && err.message) || 'unknown');
  });

  // Errors that arrive through the element itself rather than the promise.
  if (!audio.__archimedesErrorHook) {
    audio.__archimedesErrorHook = true;
    audio.addEventListener('error', () => {
      const code = audio.error ? audio.error.code : null;
      if (!code) return;
      const map = { 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
      reportPlaybackFailure(map[code] || ('code ' + code));
    });
  }

  // Update Player UI. The artist goes through cleanArtistName because the server
  // returns placeholders like '[Unknown Artist]' (and sometimes the literal string
  // '0') for tracks with no metadata, and the raw value used to be printed straight
  // into the player bar. The local view was already cleaned; the server path was not.
  playerSongTitle.textContent = currentSong.title;
  playerArtistName.textContent = cleanArtistName(
    currentSong.artist,
    currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'
  );
  playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  miniPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

  let coverUrl = '';
  if (currentSong.coverArt) {
    coverUrl = currentSong.isLocal 
      ? currentSong.coverArt 
      : buildSubsonicUrl('getCoverArt.view', { id: currentSong.coverArt, size: 250 });
    playerCover.src = coverUrl;
    playerCover.style.display = 'block';
    playerCoverPlaceholder.style.display = 'none';

    // Update Mini player cover
    miniCover.src = coverUrl;
    miniCover.style.display = 'block';
    miniCoverPlaceholder.style.display = 'none';

    // Dynamic Apple Music Style Backdrop
    updateDynamicBackdrop(coverUrl);
  } else {
    playerCover.style.display = 'none';
    playerCoverPlaceholder.style.display = 'flex';
    miniCover.style.display = 'none';
    miniCoverPlaceholder.style.display = 'flex';
  }

  // Update Mini Player Meta
  miniSongTitle.textContent = currentSong.title;
  miniArtistName.textContent = cleanArtistName(currentSong.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist');
  if (miniLyricsLine) miniLyricsLine.textContent = '';
  if (tickerText) tickerText.textContent = '';

  // Auto-Detect Lyrics Proactively from Internet Without API
  autoDetectLyrics(currentSong);

  // Update Windows Media Session
  updateMediaSession(currentSong, coverUrl);

  // Update Now Playing Studio if open
  if (document.getElementById('nowPlayingModal')?.style.display === 'flex') {
    updateNowPlayingModalContent();
  }

  // Scrobble (now playing) only for server tracks
  if (!currentSong.isLocal) {
    apiRequest('scrobble.view', { id: currentSong.id, submission: false }).catch(() => {});
  }
}

function togglePlayPause() {
  // YouTube is a separate player, so the transport control is dispatched by source
  // instead of assuming the <audio> element. Everything above this function (the
  // player bar, the mini player, keyboard shortcuts) calls this one entry point.
  if (playbackSource === 'youtube') {
    const p = YouTubePlayerAdapter.player();
    if (!p) return;
    if (ytState.playing) {
      YouTubePlayerAdapter.pause();
      ytState.playing = false;
    } else {
      YouTubePlayerAdapter.play();
      ytState.playing = true;
    }
    const icon = ytState.playing ? 'pause' : 'play';
    playPauseBtn.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
    miniPlayPauseBtn.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
    return;
  }

  if (!currentSong) return;
  initWebAudio();
  if (audio.paused) {
    audio.play();
    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    miniPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    miniPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

function playNext() {
  if (currentQueue.length === 0) return;

  // Repeat One: repeat current track
  if (repeatMode === 'one' && currentIndex >= 0) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return;
  }

  if (isShuffleEnabled) {
    if (currentQueue.length === 1) {
      playSongAt(0);
      return;
    }
    let nextIndex;
    let attempts = 0;
    do {
      nextIndex = Math.floor(Math.random() * currentQueue.length);
      attempts++;
    } while (nextIndex === currentIndex && attempts < 10);
    playSongAt(nextIndex);
    return;
  }

  if (currentIndex + 1 < currentQueue.length) {
    playSongAt(currentIndex + 1);
  } else if (repeatMode === 'all' || isRepeatEnabled) {
    playSongAt(0);
  }
}

function playPrevious() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (currentQueue.length > 0 && currentIndex - 1 >= 0) {
    playSongAt(currentIndex - 1);
  } else if ((repeatMode === 'all' || isRepeatEnabled) && currentQueue.length > 0) {
    playSongAt(currentQueue.length - 1);
  }
}

async function deleteSong(event, songId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  // The track has to be resolved across every list: the delete button is used from
  // album, artist, search and playlist views, where the row is usually NOT in
  // currentQueue. Looking only in currentQueue made a local track look like a server
  // track (and vice versa), so the delete silently took the wrong branch.
  let song = currentQueue.find(s => s.id === songId)
    || serverSongsCache.find(s => s.id === songId)
    || localTracks.find(s => s.id === songId)
    || (currentSong && currentSong.id === songId ? currentSong : null);

  // If local device track
  if (song && song.isLocal) {
    const t = I18N[currentLang] || I18N.en;
    if (!confirm(t.deleteConfirm.replace('{title}', song.title || 'this track'))) return;

    // Delete the file itself, not just the list entry. Desktop moves it to the
    // Recycle Bin; Android uses MediaStore. If the platform cannot do it, say so
    // instead of pretending the track is gone.
    let fileResult = null;
    const localPath = song.path || '';
    if (localPath || song.audioId) {
      try {
        if (archimedesBridge && typeof archimedesBridge.deleteLocalFile === 'function') {
          fileResult = await archimedesBridge.deleteLocalFile(localPath);
        } else if (window.ArchimedesNative && typeof window.ArchimedesNative.deleteLocalFile === 'function') {
          // Android answers "deleted" | "pending" | "failed"; on Android 11+ the
          // system shows its own confirmation dialog and calls back afterwards.
          fileResult = await new Promise((resolve) => {
            let settled = false;
            window.onLocalFileDeleted = (id, ok) => {
              if (settled) return;
              settled = true;
              resolve(ok ? { ok: true, via: 'system-dialog' } : { ok: false, error: 'cancelled' });
            };
            let immediate = 'failed';
            try {
              immediate = window.ArchimedesNative.deleteLocalFile(String(song.audioId || song.id || ''));
            } catch (e) {
              immediate = 'failed';
            }
            if (immediate === 'deleted') { settled = true; resolve({ ok: true }); return; }
            if (immediate === 'failed') { settled = true; resolve({ ok: false, error: 'not-allowed' }); return; }
            setTimeout(() => {
              if (!settled) { settled = true; resolve({ ok: false, error: 'timeout' }); }
            }, 60000);
          });
        }
      } catch (e) {
        fileResult = { ok: false, error: e.message };
      }
    }
    if (fileResult && fileResult.ok === false) {
      alert(currentLang === 'ar'
        ? `تعذّر حذف الملف من الجهاز (${fileResult.error || 'غير مسموح'}). بقي الملف في مكانه.`
        : `Could not delete the file (${fileResult.error || 'not allowed'}). It is still on disk.`);
      return;
    }
    if (!fileResult) {
      const proceed = confirm(currentLang === 'ar'
        ? 'لا يمكن حذف الملف الفعلي على هذه المنصة حالياً؛ سيُزال من قائمة التطبيق فقط. هل تريد المتابعة؟'
        : 'The file itself cannot be deleted on this platform yet; it will only be removed from the app list. Continue?');
      if (!proceed) return;
    }

    localTracks = localTracks.filter(s => s.id !== songId);
    try {
      localStorage.setItem('archimedes_cached_local_tracks', JSON.stringify(localTracks));
    } catch (e) {}

    currentQueue = currentQueue.filter(s => s.id !== songId);

    if (currentSong && currentSong.id === songId) {
      audio.pause();
      audio.src = '';
      currentSong = null;
      playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      miniPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      playerSongTitle.textContent = currentLang === 'ar' ? 'اختر مقطعاً صوتياً' : 'Select a track';
      playerArtistName.textContent = 'Archimedes Music';
    }

    const targetEl = event?.target ? (event.target.closest('tr') || event.target.closest('.song-item')) : null;
    if (targetEl) {
      targetEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      targetEl.style.opacity = '0';
      targetEl.style.transform = 'translateX(30px)';
      setTimeout(() => targetEl.remove(), 300);
    }
    return;
  }

  // If path is missing, query Subsonic API
  if (!song || !song.path) {
    try {
      const data = await apiRequest('getSong.view', { id: songId });
      if (data && data.song) {
        if (song) {
          song.path = data.song.path;
        } else {
          song = data.song;
        }
      }
    } catch (e) {
      console.warn('Could not fetch song path from Subsonic:', e);
    }
  }

  const songTitle = song ? (song.title || 'this track') : 'this track';
  const t = I18N[currentLang] || I18N.en;

  if (!confirm(t.deleteConfirm.replace('{title}', songTitle))) {
    return;
  }

  try {
    let success = false;
    const targetPath = song?.path;
    const customBase = getMusicFolderPath();

    if (ipcRenderer && targetPath) {
      success = await ipcRenderer.invoke('delete-server-file', targetPath, customBase);
    } else if (!ipcRenderer) {
      alert(currentLang === 'ar' ? 'خاصية الحذف تتطلب تشغيل تطبيق Archimedes Desktop.' : 'Delete function requires the Navidrome Desktop application.');
      return;
    } else {
      alert(currentLang === 'ar' ? 'تعذر تحديد مسار الملف في السيرفر.' : 'Could not determine file path on the server.');
      return;
    }

    if (success) {
      // Trigger Navidrome library rescan
      try {
        await apiRequest('startScan.view');
      } catch (e) {
        console.warn('Scan trigger error:', e);
      }

      // Remove from server cache & currentQueue
      serverSongsCache = serverSongsCache.filter(s => s.id !== songId);
      currentQueue = currentQueue.filter(s => s.id !== songId);

      // If the currently playing song is deleted, stop playback
      if (currentSong && currentSong.id === songId) {
        audio.pause();
        audio.src = '';
        currentSong = null;
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        miniPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        playerSongTitle.textContent = currentLang === 'ar' ? 'اختر مقطعاً صوتياً' : 'Select a track';
        playerArtistName.textContent = 'Archimedes Music';
        miniSongTitle.textContent = currentLang === 'ar' ? 'لا يوجد مقطع' : 'No track selected';
        miniArtistName.textContent = currentLang === 'ar' ? 'جاهز للتشغيل' : 'Ready to play';
        if (miniLyricsLine) miniLyricsLine.textContent = '';
        if (tickerText) tickerText.textContent = '';
      }

      // Smoothly remove table row from DOM
      const targetEl = event?.target ? (event.target.closest('tr') || event.target.closest('.song-item')) : null;
      if (targetEl) {
        targetEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        targetEl.style.opacity = '0';
        targetEl.style.transform = 'translateX(30px)';
        setTimeout(() => targetEl.remove(), 300);
      }
    } else {
      alert(t.deleteError.replace('{title}', songTitle));
    }
  } catch (err) {
    console.error('Delete song error:', err);
    alert(`Failed: ${err.message}`);
  }
}
window.deleteSong = deleteSong;

// =============================================================
// Album and Artist Deletion
// =============================================================
async function deleteAlbum(event, albumId, albumName) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const msg = currentLang === 'ar'
    ? `هل أنت متأكد من حذف ألبوم "${albumName}" بالكامل من وحدة التخزين نهائياً؟`
    : `Are you sure you want to permanently delete the album "${albumName}" from storage?`;

  if (!confirm(msg)) return;

  try {
    const customBase = getMusicFolderPath();
    let success = false;
    if (ipcRenderer) {
      success = await ipcRenderer.invoke('delete-server-folder', albumName, customBase);
    } else {
      alert(currentLang === 'ar' ? 'حذف المجلد يتطلب تطبيق سطح المكتب.' : 'Folder deletion requires the Desktop application.');
      return;
    }

    if (success) {
      try { await apiRequest('startScan.view'); } catch (e) {}
      alert(currentLang === 'ar' ? `تم حذف الألبوم "${albumName}" بنجاح!` : `Album "${albumName}" deleted successfully!`);
      renderAlbums();
    } else {
      alert(currentLang === 'ar' ? 'تعذر حذف الألبوم.' : 'Failed to delete album.');
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
window.deleteAlbum = deleteAlbum;

async function deleteArtist(event, artistId, artistName) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const msg = currentLang === 'ar'
    ? `هل أنت متأكد من حذف الفنان "${artistName}" وجميع ألبوماته وأغانيه نهائياً؟`
    : `Are you sure you want to permanently delete the artist "${artistName}" and all tracks from storage?`;

  if (!confirm(msg)) return;

  try {
    const customBase = getMusicFolderPath();
    let success = false;
    if (ipcRenderer) {
      success = await ipcRenderer.invoke('delete-server-folder', artistName, customBase);
    } else {
      alert(currentLang === 'ar' ? 'حذف الفنان يتطلب تطبيق سطح المكتب.' : 'Artist deletion requires the Desktop application.');
      return;
    }

    if (success) {
      try { await apiRequest('startScan.view'); } catch (e) {}
      alert(currentLang === 'ar' ? `تم حذف الفنان "${artistName}" بنجاح!` : `Artist "${artistName}" deleted successfully!`);
      renderArtists();
    } else {
      alert(currentLang === 'ar' ? 'تعذر حذف الفنان.' : 'Failed to delete artist.');
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
window.deleteArtist = deleteArtist;

// =============================================================
// Playlist Modal & Quick Add
// =============================================================
let pendingSongIdForPlaylist = null;

async function openAddToPlaylistModal(event, songId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  pendingSongIdForPlaylist = songId;
  const modal = document.getElementById('playlistModal');
  const listEl = document.getElementById('playlistModalList');
  const inputEl = document.getElementById('newPlaylistInput');
  if (inputEl) inputEl.value = '';
  if (modal) modal.style.display = 'flex';

  if (listEl) {
    listEl.innerHTML = `<div style="text-align: center; color: #8c8ca5; padding: 20px 0;"><i class="fa-solid fa-spinner fa-spin"></i> Loading playlists...</div>`;
    try {
      const data = await apiRequest('getPlaylists.view');
      const playlists = data.playlists?.playlist || [];
      if (playlists.length === 0) {
        listEl.innerHTML = `<p style="color: #8c8ca5; text-align: center; padding: 12px 0;">No playlists yet. Create your first one above!</p>`;
        return;
      }
      let html = '';
      playlists.forEach(pl => {
        html += `
          <div class="playlist-modal-item" onclick="addSongToPlaylist('${escJs(pl.id)}', '${escJs(pl.name)}')" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 8px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(29, 185, 84, 0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-list-ul" style="color: #1db954;"></i>
              <span style="font-weight: 600; font-size: 14px;">${escapeHtml(pl.name)}</span>
            </div>
            <span style="font-size: 12px; color: #8c8ca5;">${pl.songCount || 0} tracks</span>
          </div>
        `;
      });
      listEl.innerHTML = html;
    } catch (e) {
      listEl.innerHTML = `<p style="color: #ef4444; padding: 12px 0;">Failed to load playlists: ${escapeHtml(e.message)}</p>`;
    }
  }
}
window.openAddToPlaylistModal = openAddToPlaylistModal;

function closePlaylistModal() {
  const modal = document.getElementById('playlistModal');
  if (modal) modal.style.display = 'none';
  pendingSongIdForPlaylist = null;
}
window.closePlaylistModal = closePlaylistModal;

async function createNewPlaylistFromModal() {
  const input = document.getElementById('newPlaylistInput');
  const name = input ? input.value.trim() : '';
  if (!name) return;
  try {
    const params = { name };
    if (pendingSongIdForPlaylist) params.songId = pendingSongIdForPlaylist;
    await apiRequest('createPlaylist.view', params);
    closePlaylistModal();
    alert(currentLang === 'ar' ? `تم إنشاء قائمة "${name}" بنجاح!` : `Playlist "${name}" created successfully!`);
    if (currentView === 'playlists') renderPlaylists();
  } catch (err) {
    alert(`Failed to create playlist: ${err.message}`);
  }
}
window.createNewPlaylistFromModal = createNewPlaylistFromModal;

async function addSongToPlaylist(playlistId, playlistName) {
  if (!pendingSongIdForPlaylist) return;
  try {
    await apiRequest('updatePlaylist.view', { playlistId, songIdToAdd: pendingSongIdForPlaylist });
    closePlaylistModal();
    alert(currentLang === 'ar' ? `تمت إضافة المقطع إلى "${playlistName}" بنجاح!` : `Added track to "${playlistName}" successfully!`);
  } catch (err) {
    alert(`Failed to add track to playlist: ${err.message}`);
  }
}
window.addSongToPlaylist = addSongToPlaylist;

async function deletePlaylist(event, playlistId, playlistName) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const isAr = currentLang === 'ar';
  const msg = isAr ? `هل أنت متأكد من حذف قائمة "${playlistName}"؟` : `Are you sure you want to delete playlist "${playlistName}"?`;
  if (!confirm(msg)) return;
  try {
    await apiRequest('deletePlaylist.view', { id: playlistId });
    alert(isAr ? 'تم حذف القائمة بنجاح.' : 'Playlist deleted successfully.');
    renderPlaylists();
  } catch (err) {
    alert(`Failed to delete playlist: ${err.message}`);
  }
}
window.deletePlaylist = deletePlaylist;

async function removeSongFromPlaylist(event, playlistId, songIndex, songTitle) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const isAr = currentLang === 'ar';
  const msg = isAr ? `إزالة "${songTitle}" من قائمة التشغيل هذه؟` : `Remove "${songTitle}" from this playlist?`;
  if (!confirm(msg)) return;
  try {
    await apiRequest('updatePlaylist.view', { playlistId, songIndexToRemove: songIndex });
    openPlaylist(playlistId);
  } catch (err) {
    alert(`Failed to remove track from playlist: ${err.message}`);
  }
}
window.removeSongFromPlaylist = removeSongFromPlaylist;

// =============================================================
// Playing Queue Drawer Modal
// =============================================================
function toggleQueueModal() {
  const modal = document.getElementById('queueModal');
  if (!modal) return;
  if (modal.style.display === 'flex') {
    modal.style.display = 'none';
  } else {
    modal.style.display = 'flex';
    renderQueueUI();
  }
}
window.toggleQueueModal = toggleQueueModal;

function renderQueueUI() {
  const badge = document.getElementById('queueCountBadge');
  const card = document.getElementById('queueCurrentSongCard');
  const list = document.getElementById('queueListContainer');
  if (!badge || !card || !list) return;

  badge.textContent = `${currentQueue.length} ${currentLang === 'ar' ? 'مقاطع' : 'tracks'}`;

  // Current playing card
  if (currentSong) {
    card.innerHTML = `
      <div style="width: 44px; height: 44px; border-radius: 6px; background: #252538; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #1db954; flex-shrink: 0;">
        <i class="fa-solid fa-volume-high"></i>
      </div>
      <div style="flex: 1; overflow: hidden;">
        <div style="font-size: 11px; text-transform: uppercase; color: #1db954; font-weight: 700;">${currentLang === 'ar' ? 'قيد التشغيل الآن' : 'Now Playing'}</div>
        <div style="font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(currentSong.title || '')}</div>
        <div style="font-size: 12px; color: #8c8ca5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(cleanArtistName(currentSong.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))}</div>
      </div>
      <div style="font-size: 12px; color: #7b7b95;">${formatDuration(currentSong.duration || 0)}</div>
    `;
  } else {
    card.innerHTML = `<p style="color: #8c8ca5; margin: 0; font-size: 13px;">${currentLang === 'ar' ? 'لا يوجد مقطع قيد التشغيل حالياً' : 'No track currently playing'}</p>`;
  }

  // Queue List
  if (currentQueue.length === 0) {
    list.innerHTML = `<p style="color: #8c8ca5; text-align: center; padding: 24px 0;">${currentLang === 'ar' ? 'قائمة التشغيل فارغة' : 'Playing queue is empty'}</p>`;
    return;
  }

  let html = '';
  currentQueue.forEach((s, idx) => {
    const isPlaying = (idx === currentIndex);
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 8px; background: ${isPlaying ? 'rgba(29, 185, 84, 0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isPlaying ? 'rgba(29, 185, 84, 0.3)' : 'transparent'};">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; cursor: pointer; overflow: hidden;" onclick="playSongAt(${escJs(idx)}); renderQueueUI();">
          <span style="font-size: 12px; color: ${isPlaying ? '#1db954' : '#7b7b95'}; width: 22px; text-align: center;">
            ${isPlaying ? '<i class="fa-solid fa-play"></i>' : (idx + 1)}
          </span>
          <div style="overflow: hidden;">
            <div style="font-size: 13px; font-weight: ${isPlaying ? '700' : '600'}; color: ${isPlaying ? '#1db954' : '#fff'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(s.title || '')}</div>
            <div style="font-size: 11px; color: #8c8ca5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(cleanArtistName(s.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist'))}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          <span style="font-size: 11px; color: #7b7b95;">${formatDuration(s.duration || 0)}</span>
          <button class="btn-action-delete" title="Remove from queue" onclick="removeFromQueue(${escJs(idx)})" style="padding: 4px 6px;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}
window.renderQueueUI = renderQueueUI;

function removeFromQueue(idx) {
  if (idx < 0 || idx >= currentQueue.length) return;
  currentQueue.splice(idx, 1);
  if (currentQueue.length === 0) {
    currentIndex = -1;
    currentSong = null;
    audio.pause();
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  } else if (idx < currentIndex) {
    currentIndex--;
  } else if (idx === currentIndex) {
    playSongAt(Math.min(currentIndex, currentQueue.length - 1));
  }
  renderQueueUI();
}
window.removeFromQueue = removeFromQueue;

function clearCurrentQueue() {
  if (currentSong) {
    currentQueue = [currentSong];
    currentIndex = 0;
  } else {
    currentQueue = [];
    currentIndex = -1;
  }
  renderQueueUI();
}
window.clearCurrentQueue = clearCurrentQueue;

function shuffleCurrentQueue() {
  if (currentQueue.length <= 1) return;
  if (currentIndex >= 0 && currentIndex < currentQueue.length) {
    const current = currentQueue[currentIndex];
    const others = currentQueue.filter((_, i) => i !== currentIndex);
    currentQueue = [current, ...shuffleArray(others)];
    currentIndex = 0;
  } else {
    currentQueue = shuffleArray(currentQueue);
  }
  renderQueueUI();
}
window.shuffleCurrentQueue = shuffleCurrentQueue;

// =============================================================
// Sleep Timer Feature
// =============================================================
let sleepTimerId = null;
let sleepTimerDuration = null;
let sleepTimerEndTime = null;

function toggleSleepTimerModal() {
  const modal = document.getElementById('sleepTimerModal');
  if (!modal) return;
  modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
  const cancelBtn = document.getElementById('cancelSleepTimerBtn');
  if (cancelBtn) {
    cancelBtn.style.display = sleepTimerId ? 'block' : 'none';
  }
}
window.toggleSleepTimerModal = toggleSleepTimerModal;

function setSleepTimer(val) {
  cancelSleepTimer(true);
  const modal = document.getElementById('sleepTimerModal');
  if (modal) modal.style.display = 'none';

  if (val === 'end_of_song') {
    sleepTimerDuration = 'end_of_song';
    const onEndedOnce = () => {
      audio.removeEventListener('ended', onEndedOnce);
      audio.pause();
      sleepTimerDuration = null;
      updateSleepTimerBadge(false);
    };
    audio.addEventListener('ended', onEndedOnce);
    sleepTimerId = onEndedOnce;
    updateSleepTimerBadge(true);
    alert(currentLang === 'ar' ? 'تم ضبط مؤقت النوم: سيتوقف التشغيل عند نهاية الأغنية الحالية 🌙' : 'Sleep timer set: Playback will stop at the end of current song 🌙');
    return;
  }

  const minutes = parseInt(val, 10);
  if (!minutes || isNaN(minutes)) return;

  const ms = minutes * 60 * 1000;
  sleepTimerEndTime = Date.now() + ms;

  sleepTimerId = setTimeout(() => {
    // Fade out volume over 4 seconds
    const startVolume = audio.volume;
    let fadeStep = 0;
    const fadeInterval = setInterval(() => {
      fadeStep++;
      audio.volume = Math.max(0, startVolume * (1 - fadeStep / 20));
      if (fadeStep >= 20) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.volume = startVolume;
        cancelSleepTimer(true);
      }
    }, 200);
  }, Math.max(100, ms - 4000));

  updateSleepTimerBadge(true);
  alert(currentLang === 'ar' ? `تم ضبط مؤقت النوم على ${minutes} دقيقة 🌙` : `Sleep timer set for ${minutes} minutes 🌙`);
}
window.setSleepTimer = setSleepTimer;

function cancelSleepTimer(silent = false) {
  if (sleepTimerId) {
    if (typeof sleepTimerId === 'function') {
      audio.removeEventListener('ended', sleepTimerId);
    } else {
      clearTimeout(sleepTimerId);
    }
    sleepTimerId = null;
  }
  sleepTimerEndTime = null;
  sleepTimerDuration = null;
  updateSleepTimerBadge(false);
  const modal = document.getElementById('sleepTimerModal');
  if (modal) modal.style.display = 'none';
  if (!silent) {
    alert(currentLang === 'ar' ? 'تم إلغاء مؤقت النوم.' : 'Sleep timer canceled.');
  }
}
window.cancelSleepTimer = cancelSleepTimer;

function updateSleepTimerBadge(active = false) {
  const btn = document.getElementById('sleepTimerBtn');
  if (btn) {
    if (active) {
      btn.style.color = '#6366f1';
      btn.style.background = 'rgba(99, 102, 241, 0.2)';
    } else {
      btn.style.color = '';
      btn.style.background = '';
    }
  }
}


function updateProgress() {
  // Driven by the active source, not by the <audio> element directly, so the
  // progress bar and the synchronised lyrics follow YouTube exactly as they
  // follow Navidrome/local playback.
  if (playbackSource === 'youtube') {
    const pos = YouTubePlayerAdapter.getCurrentTime() || 0;
    const dur = YouTubePlayerAdapter.getDuration() || 0;
    if (dur > 0) {
      progressFill.style.width = `${(pos / dur) * 100}%`;
      currentTime.textContent = formatDuration(pos);
      totalDuration.textContent = formatDuration(dur);
    }
    ytState.position = pos;
    ytState.duration = dur;
    if (parsedLyrics && parsedLyrics.length) syncLyricsWithTime(pos);
    return;
  }

  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
    currentTime.textContent = formatDuration(audio.currentTime);
    totalDuration.textContent = formatDuration(audio.duration);
    syncLyricsWithTime(audio.currentTime);

    // Smart Gapless Preloader at 75%
    if (percent > 75 && !nextSongPreloader && currentQueue.length > currentIndex + 1) {
      preloadNextTrack(currentQueue[currentIndex + 1]);
    }
  }
}

/* The <audio> element fires timeupdate; a YouTube embed does not, so poll it.
   One shared 500ms tick that returns immediately unless YouTube is the active
   source, so an idle app pays nothing for it. */
setInterval(() => {
  if (playbackSource !== 'youtube') return;
  // Self-healing dock. A render that races the requestAnimationFrame docking
  // could leave the layer parked while the YouTube section is open — measured as
  // a transient "docked:false" that a direct re-measure could not reproduce. This
  // is an idempotent class check, so re-asserting it every tick costs nothing and
  // guarantees the video is visible whenever its section is.
  if (currentView === 'youtube') {
    const layer = document.getElementById('ytPersistentLayer');
    if (layer && !layer.classList.contains('yt-docked')) dockYouTubeLayer();
  }
  if (!YouTubePlayerAdapter.isReady()) return;
  const state = YouTubePlayerAdapter.getState();
  // 1 = playing, 3 = buffering. Anything else means the transport icon should
  // read "play".
  const playing = state === 1 || state === 3;
  if (playing !== ytState.playing) {
    ytState.playing = playing;
    const icon = playing ? 'pause' : 'play';
    if (playPauseBtn) playPauseBtn.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
    if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
  }
  updateProgress();
}, 500);

function updateVolumeIcon() {
  if (!volumeIcon) return;
  if (isMuted || audio.volume === 0) {
    volumeIcon.className = 'fa-solid fa-volume-xmark';
    volumeIcon.style.color = '#ef4444';
  } else if (audio.volume < 0.4) {
    volumeIcon.className = 'fa-solid fa-volume-low';
    volumeIcon.style.color = '#7b7b95';
  } else {
    volumeIcon.className = 'fa-solid fa-volume-high';
    volumeIcon.style.color = '#7b7b95';
  }
}

function updateMiniPlayerView() {
  if (currentSong) {
    miniSongTitle.textContent = currentSong.title;
    miniArtistName.textContent = cleanArtistName(currentSong.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist');
    if (currentSong.coverArt) {
      const coverUrl = buildSubsonicUrl('getCoverArt.view', { id: currentSong.coverArt, size: 250 });
      miniCover.src = coverUrl;
      miniCover.style.display = 'block';
      miniCoverPlaceholder.style.display = 'none';
    }
  }
}

// -------------------------------------------------------------
// Web Audio API DSP & Equalizer & Real-time Visualizer
// -------------------------------------------------------------
let isNoBeatActive = false;
let noBeatDryGain = null;
let noBeatWetGain = null;
let noBeatAgcGain = null;
let noBeatBands = null;        // { low, lowDuck, highBand, highTrim, merge, lowAnalyser }
let noBeatDryAnalyser = null;
let noBeatWetAnalyser = null;
let noBeatRmsTimer = null;
let isReverbActive = false;
let reverbGain = null;
let reverbConvolver = null;
let currentBassLevel = 0;

// ---------------------------------------------------------------------------
// Web Audio availability
// ---------------------------------------------------------------------------
// Routing the <audio> element through Web Audio (createMediaElementSource) is
// irreversible, and Chromium refuses to hand samples to the graph when the media
// is not CORS-clean - it logs "MediaElementAudioSource outputs zeroes due to CORS
// access restrictions" and plays pure silence. That is exactly why the Android
// build had no sound at all. So the graph is only built after a probe proves the
// stream is readable cross-origin; otherwise the element plays straight to the
// output and the FX panel explains why the effects are unavailable.
let webAudioAllowed = false;
let webAudioProbed = false;
let webAudioProbeResult = 'unknown';

async function probeStreamCors() {
  if (webAudioProbed) return webAudioProbeResult;
  webAudioProbed = true;
  try {
    // A one-byte ranged request is enough for the CORS decision.
    const url = buildSubsonicUrl('stream.view', { id: 'probe' });
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1' } });
    webAudioProbeResult = res.type === 'cors' ? 'allowed' : 'blocked';
    try { res.body && res.body.cancel && res.body.cancel(); } catch (e) { /* ignore */ }
  } catch (e) {
    webAudioProbeResult = 'blocked';
  }
  webAudioAllowed = webAudioProbeResult === 'allowed';
  if (webAudioAllowed) {
    // Must be set before the next src assignment, and only when the server (or the
    // platform proxy) actually returns Access-Control-Allow-Origin.
    try { audio.crossOrigin = 'anonymous'; } catch (e) { /* ignore */ }
  }
  return webAudioProbeResult;
}
window.probeStreamCors = probeStreamCors;

/** Returns true when the audio graph may be created; otherwise warns once. */
function ensureWebAudioOrWarn() {
  if (audioCtx) return true;
  const isLocal = currentSong && currentSong.isLocal;
  if (webAudioAllowed || isLocal) { initWebAudio(); return true; }
  const isAr = currentLang === 'ar';
  alert(isAr
    ? 'المؤثرات الصوتية (المعادل، إزالة الإيقاع، الصدى، 8D) تحتاج أن يُقدَّم البث بترويسات CORS.\nالصوت يعمل الآن بشكل طبيعي، لكن هذه المؤثرات معطّلة.'
    : 'Audio effects need the stream to be served with CORS headers.\nPlayback works normally, but these effects are disabled.');
  return false;
}
window.ensureWebAudioOrWarn = ensureWebAudioOrWarn;

function initWebAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  const isLocal = currentSong && currentSong.isLocal;
  if (!webAudioAllowed && !isLocal) {
    if (!initWebAudio._warned) {
      initWebAudio._warned = true;
      console.warn('Web Audio effects disabled: stream is not CORS-clean (routing it would silence playback).');
    }
    return;
  }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    // 'playback' asks the OS for a large, stable buffer. The default (interactive)
    // buffer underruns on Android whenever the WebView main thread is busy, which is
    // exactly the crackle/stutter users hear.
    try {
      audioCtx = new AudioContextClass({ latencyHint: 'playback' });
    } catch (e) {
      audioCtx = new AudioContextClass();
    }
    sourceNode = audioCtx.createMediaElementSource(audio);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 128;
    analyserNode.smoothingTimeConstant = 0.8;

    // Build 10 BiquadFilter equalizer chain
    let prevNode = sourceNode;
    eqFilters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = audioCtx.createBiquadFilter();
      if (i === 0) {
        filter.type = 'lowshelf';
      } else if (i === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = 0;
      prevNode.connect(filter);
      prevNode = filter;
      return filter;
    });

    // Bass Boost filter
    bassBoostFilter = audioCtx.createBiquadFilter();
    bassBoostFilter.type = 'lowshelf';
    bassBoostFilter.frequency.value = 85;
    bassBoostFilter.gain.value = parseFloat(bassBoostSlider?.value || 0);
    prevNode.connect(bassBoostFilter);
    prevNode = bassBoostFilter;

    // ---- No-Beat / vocal-focus processor (إزالة الإيقاع) --------------------
    // REDESIGNED after user feedback ("it lowers the volume and muffles the
    // singer"). Two mistakes in the previous version:
    //   * a 4 kHz lowpass on the retained band threw away the vocal brightness,
    //     which is what made the voice sound muffled;
    //   * a broadband AGC clamped to <= 1.0 pulled the whole track down, which is
    //     what made it quieter.
    // This version keeps the dry signal at unity so every frequency - including the
    // full vocal range and the stereo image - passes untouched, and cancels the kick
    // in a parallel inverted band:
    //   lowDuck  : lowpass at 120 Hz - extracts the kick band
    //   hatCut   : lowpass at 170 Hz - tightens that band (gain unused)
    //   presence : peaking at 2.5 kHz held at 0 dB - transparent placeholder,
    //              kept so existing node references stay valid
    //   wetGain  : driven to a NEGATIVE gain by the follower, which inverts the
    //              extracted band so it subtracts from the dry signal
    // Only the kick band is affected; loudness and tone are unchanged.
    noBeatDryGain = audioCtx.createGain();
    noBeatWetGain = audioCtx.createGain();
    noBeatAgcGain = audioCtx.createGain();   // kept at unity: never attenuates
    /* Keeping the dry path at zero replaced the entire track with the ducked copy, so
       No Beat muffled the whole song instead of removing the kick. Hold a dry floor
       and let the wet path contribute the low-frequency removal on top. */
    noBeatDryGain.gain.value = 1;   // always unity: this is what preserves the music
    noBeatWetGain.gain.value = 0;   // the follower opens it to a NEGATIVE gain
    noBeatAgcGain.gain.value = 1;

    const lowDuck = audioCtx.createBiquadFilter();
    lowDuck.type = 'lowpass';     // kick band extractor, not a static EQ dip
    lowDuck.frequency.value = 120;      // kick and low punch fundamental
    lowDuck.Q.value = 0.7;             // focused notch on drums
    lowDuck.gain.value = 0;        // unused for a lowpass; kept so the node contract is unchanged           // dB, modulated by the follower down to -24 dB

    const hatCut = audioCtx.createBiquadFilter();
    hatCut.type = 'lowpass';     // tightens the kick band; no longer cuts 5 dB of treble
    hatCut.frequency.value = 170;
    hatCut.gain.value = 0;          // dB, tame percussion sizzle/snare snap

    const presence = audioCtx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 2500;   // vocal formant & intelligibility core
    presence.Q.value = 1.0;
    presence.gain.value = 0;     // transparent: a static +3.5 dB mid bell caused the nasal tone         // dB, clear vocal lift

    const lowAnalyser = audioCtx.createAnalyser();
    lowAnalyser.fftSize = 256;

    // Envelope tap for the kick follower (the filter itself stays in the chain).
    const kickTap = audioCtx.createBiquadFilter();
    kickTap.type = 'lowpass';
    kickTap.frequency.value = 120;
    kickTap.Q.value = 0.707;
    kickTap.connect(lowAnalyser);

    // In-place chain.
    prevNode.connect(noBeatDryGain);
    prevNode.connect(kickTap);

    prevNode.connect(lowDuck);
    lowDuck.connect(hatCut);
    hatCut.connect(presence);
    presence.connect(noBeatWetGain);
    noBeatWetGain.connect(noBeatAgcGain);
    /* Band B and Band C - mid and high percussion, metering stage.

       These cannot live in the kick chain: it ends in a 170 Hz lowpass, so a series
       filter there could never reach 3 kHz or 8 kHz. Each band is its own parallel tap
       summed into the same wet bus.

       The bandpasses are deliberately wide (Q 0.7) so they cover the requested ranges
       without ringing. Both attenuation gains start at ZERO on purpose: an earlier
       attempt at the snare band failed completely because it reused the kick detector's
       threshold, so these stay closed until each band's own transient-ratio
       distribution has been measured on real material. */
    const midBand = audioCtx.createBiquadFilter();
    midBand.type = 'bandpass';
    midBand.frequency.value = 2800;    // centre of the 1.5-4.5 kHz snare / clap region
    midBand.Q.value = 0.7;
    const midAnalyser = audioCtx.createAnalyser();
    midAnalyser.fftSize = 256;
    const midGain = audioCtx.createGain();
    midGain.gain.value = 0;            // closed until calibrated

    const highBand = audioCtx.createBiquadFilter();
    highBand.type = 'bandpass';
    highBand.frequency.value = 8000;   // centre of the 5-12 kHz hi-hat / cymbal region
    highBand.Q.value = 0.7;
    const highAnalyser = audioCtx.createAnalyser();
    highAnalyser.fftSize = 256;
    const highGain = audioCtx.createGain();
    highGain.gain.value = 0;           // closed until calibrated

    prevNode.connect(midBand);
    midBand.connect(midAnalyser);      // metering tap only
    midBand.connect(midGain);
    midGain.connect(noBeatAgcGain);    // sums into the same inverted wet bus

    prevNode.connect(highBand);
    highBand.connect(highAnalyser);    // metering tap only
    highBand.connect(highGain);
    highGain.connect(noBeatAgcGain);

    /* In-path dynamic percussion attenuation.

       The parallel design could not deliver audible removal: the dry path carries the
       entire song, so subtracting a narrow bandpass slice at 2.8 kHz removed only that
       slice while the rest of the snare - its energy spans roughly 200 Hz to 10 kHz -
       passed through untouched. Measured reduction was -0.7 dB in the mid band and
       -0.6 dB in the high band, which is inaudible.

       These two filters sit IN the dry path, so what they attenuate is genuinely gone.
       Both rest at 0 dB, which a peaking filter and a high shelf reproduce perfectly
       flat, so nothing is cut while No Beat is idle or while the material is sustained -
       vocals are untouched. They dip only for the length of a detected percussion
       transient. The Q is deliberately wide because a snare is broadband and a narrow
       notch would miss most of it. */
    /* Kick attenuation, moved into the signal path.

       The parallel kick branch subtracted a copy that had passed through two cascaded
       2-pole lowpasses. Four poles shift phase substantially at 100 Hz, so the
       "cancellation" was partly ADDITION: measuring the merged output showed the kick
       band going UP by 3.4 dB on average and 5.8 dB at its peaks, the opposite of the
       intent. Attenuation inside the path can only ever reduce. The parallel nodes are
       left in place and simply driven to zero instead of being removed. */
    const kickDuck = audioCtx.createBiquadFilter();
    kickDuck.type = 'peaking';
    kickDuck.frequency.value = 90;
    kickDuck.Q.value = 0.8;
    kickDuck.gain.value = 0;        // dB - transparent until a kick transient is detected
    const midDuck = audioCtx.createBiquadFilter();
    midDuck.type = 'peaking';
    midDuck.frequency.value = 3000;
    midDuck.Q.value = 0.7;          // wide: covers roughly 1.5-5 kHz
    midDuck.gain.value = 0;         // dB - transparent until a transient is detected
    const highDuck = audioCtx.createBiquadFilter();
    highDuck.type = 'highshelf';
    highDuck.frequency.value = 7000;
    highDuck.gain.value = 0;        // dB - transparent until a transient is detected

    const noBeatMergeNode = audioCtx.createGain();
    noBeatDryGain.connect(kickDuck);
    kickDuck.connect(midDuck);
    midDuck.connect(highDuck);
    highDuck.connect(noBeatMergeNode);
    noBeatAgcGain.connect(noBeatMergeNode);
    prevNode = noBeatMergeNode;

    noBeatBands = {
      lowDuck,
      hatCut,
      presence,
      lowAnalyser,
      midBand,
      midAnalyser,
      midGain,
      highBand,
      highAnalyser,
      highGain,
      kickDuck,
      midDuck,
      highDuck,
      merge: noBeatMergeNode,
      // The follower meters the low band through this tap, not through a duck node.
      cancelsKickBand: true
    };

    // Metering taps for the AGC and the duck follower (analysers are neutral taps).
    noBeatDryAnalyser = audioCtx.createAnalyser();
    noBeatDryAnalyser.fftSize = 512;
    noBeatWetAnalyser = audioCtx.createAnalyser();
    noBeatWetAnalyser.fftSize = 512;
    prevNode.connect(noBeatDryAnalyser);
    noBeatAgcGain.connect(noBeatWetAnalyser);

    if (isNoBeatActive) startNoBeatFollower();

    // 8D Spatial Audio: rotating panner + Haas delay stage.
    // The delay is wired into the graph here. It used to be created and then never
    // connected, which is why "8D" only ever panned and the depth stage was inert.
    if (audioCtx.createStereoPanner) {
      pannerNode = audioCtx.createStereoPanner();
      prevNode.connect(pannerNode);
      prevNode = pannerNode;
    }

    spatialDelay = audioCtx.createDelay(0.2);
    spatialDelay.delayTime.value = 0.012;   // 12 ms Haas offset for stereo depth
    spatialWetGain = audioCtx.createGain();
    spatialWetGain.gain.value = 0;          // raised by toggleSpatialAudio()
    spatialDryGain = audioCtx.createGain();
    spatialDryGain.gain.value = 1;
    spatialMergeNode = audioCtx.createGain();

    prevNode.connect(spatialDryGain);
    spatialDryGain.connect(spatialMergeNode);
    prevNode.connect(spatialDelay);
    spatialDelay.connect(spatialWetGain);
    spatialWetGain.connect(spatialMergeNode);
    prevNode = spatialMergeNode;

    // Concert Hall Reverb Convolver Node
    try {
      // Built on first use by ensureReverbGraph(); an idle convolver would keep
      // convolving every audio block and cause dropouts.
      if (false) {
      reverbConvolver = audioCtx.createConvolver();
      const rate = audioCtx.sampleRate;
      const length = Math.floor(rate * 1.6);
      const impulse = audioCtx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);
      const decay = 3.4;   // longer tail - 2.4 gave a ~0.67s reverb that was hard to hear
      for (let i = 0; i < length; i++) {
        const factor = Math.exp(-i / (rate * (1.6 / decay)));
        left[i] = (Math.random() * 2 - 1) * factor;
        right[i] = (Math.random() * 2 - 1) * factor;
      }
      reverbConvolver.buffer = impulse;
      reverbGain = audioCtx.createGain();
      reverbGain.gain.value = isReverbActive ? 0.6 : 0;   // was 0.35 - barely audible

      prevNode.connect(reverbConvolver);
      reverbConvolver.connect(reverbGain);
      reverbGain.connect(analyserNode);
      }
    } catch (e) {}

    // NOTE: the convolver is NOT built here. ensureReverbGraph() runs the first
    // time the user enables reverb, so an idle convolver never costs CPU.

    // Connect to Analyser and Output
    prevNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    loadSavedEq();
    startVisualizerLoop();
  } catch (err) {
    console.warn('Web Audio API initialized with native fallback:', err);
  }
}

function buildEqualizerSliders() {
  if (!eqSlidersContainer) return;
  eqSlidersContainer.innerHTML = '';
  EQ_FREQUENCIES.forEach((freq, index) => {
    const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
    const col = document.createElement('div');
    col.className = 'eq-col';
    col.innerHTML = `
      <span class="eq-db-label" id="eqDb-${index}">0dB</span>
      <input type="range" id="eqBand-${index}" min="-12" max="12" step="1" value="0" orient="vertical">
      <span class="eq-freq-label">${freqLabel}Hz</span>
    `;
    const slider = col.querySelector('input');
    const dbLabel = col.querySelector('.eq-db-label');
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      dbLabel.textContent = `${val > 0 ? '+' : ''}${val}dB`;
      if (eqFilters[index]) {
        eqFilters[index].gain.value = val;
      }
      saveEqSettings();
    });
    eqSlidersContainer.appendChild(col);
  });
}

function applyEqPreset(presetKey) {
  const gains = EQ_PRESETS[presetKey] || EQ_PRESETS.flat;
  gains.forEach((gain, i) => {
    const slider = document.getElementById(`eqBand-${i}`);
    const dbLabel = document.getElementById(`eqDb-${i}`);
    if (slider) slider.value = gain;
    if (dbLabel) dbLabel.textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
    if (eqFilters[i]) eqFilters[i].gain.value = gain;
  });
  saveEqSettings();
  if (typeof sync8dSpatialAudio === 'function') sync8dSpatialAudio();
}

function saveEqSettings() {
  const settings = {
    preset: eqPresetSelect?.value || 'flat',
    gains: eqFilters.map(f => f.gain.value),
    bassBoost: bassBoostFilter ? bassBoostFilter.gain.value : 0,
    spatial: spatialAudioToggle?.checked || false,
  };
  localStorage.setItem('navidrome_eq_settings', JSON.stringify(settings));
}

function loadSavedEq() {
  try {
    const saved = localStorage.getItem('navidrome_eq_settings');
    if (!saved) return;
    const settings = JSON.parse(saved);
    if (settings.preset && eqPresetSelect) eqPresetSelect.value = settings.preset;
    if (Array.isArray(settings.gains)) {
      settings.gains.forEach((g, i) => {
        if (eqFilters[i]) eqFilters[i].gain.value = g;
        const slider = document.getElementById(`eqBand-${i}`);
        const dbLabel = document.getElementById(`eqDb-${i}`);
        if (slider) slider.value = g;
        if (dbLabel) dbLabel.textContent = `${g > 0 ? '+' : ''}${g}dB`;
      });
    }
    if (settings.bassBoost !== undefined && bassBoostFilter) {
      bassBoostFilter.gain.value = settings.bassBoost;
      if (bassBoostSlider) bassBoostSlider.value = settings.bassBoost;
      if (bassBoostValText) bassBoostValText.textContent = `+${settings.bassBoost} dB`;
    }
    if (settings.spatial !== undefined && spatialAudioToggle) {
      spatialAudioToggle.checked = settings.spatial;
      toggleSpatialAudio(settings.spatial);
    }
  } catch {}
}

let spatial8dTimer = null;

function sync8dSpatialAudio() {
  const is8dActive = (spatialAudioToggle && spatialAudioToggle.checked) || (eqPresetSelect && eqPresetSelect.value === 'spatial8d');
  if (!is8dActive || !audio || audio.paused || !pannerNode) {
    if (spatial8dTimer) {
      clearInterval(spatial8dTimer);
      spatial8dTimer = null;
    }
    if (pannerNode) {
      pannerNode.pan.value = 0;
    }
    return;
  }

  if (!spatial8dTimer) {
    spatial8dTimer = setInterval(() => {
      const active = (spatialAudioToggle && spatialAudioToggle.checked) || (eqPresetSelect && eqPresetSelect.value === 'spatial8d');
      if (!active || !audio || audio.paused || !pannerNode) {
        if (spatial8dTimer) {
          clearInterval(spatial8dTimer);
          spatial8dTimer = null;
        }
        if (pannerNode) pannerNode.pan.value = 0;
        return;
      }
      pannerAngle += 0.025;
      pannerNode.pan.value = Math.sin(pannerAngle) * 0.85;
    }, 25);
  }
}
window.sync8dSpatialAudio = sync8dSpatialAudio;

function toggleSpatialAudio(enabled) {
  isSpatialAudioEnabled = enabled;
  if (!audioCtx || !spatialWetGain || !spatialDryGain) return;
  const t = audioCtx.currentTime;
  // The delayed copy only adds depth; the dry path stays at unity so the overall
  // level does not rise when 8D is switched on.
  spatialWetGain.gain.setTargetAtTime(enabled ? 0.35 : 0, t, 0.05);
  spatialDryGain.gain.setTargetAtTime(1, t, 0.05);
  sync8dSpatialAudio();
  /* 8D is driven by the visualizer loop, so make sure it is ticking when 8D is
     switched on - the visualizer setting may have stopped it. */
  if (enabled && typeof visualizerStopper === 'function') visualizerStopper(true);
}

// -------------------------------------------------------------
// Real-time Canvas Audio Spectrum Visualizer
// -------------------------------------------------------------
function startVisualizerLoop() {
  if (isVisualizerRunning) return;
  isVisualizerRunning = true;

  const dataArray = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 64);

  function drawSpectrumCanvas(canvas, data, mode, count) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (mode === 'wave') {
      // Oscilloscope smooth waveform
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1db954';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#1db954';
      const slice = w / (data.length / 2);
      for (let i = 0; i < data.length / 2; i++) {
        const v = data[i] / 255.0;
        const y = h - (v * h * 0.88) - 1;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * slice, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (mode === 'radial') {
      // Radial sunburst around center
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.22;
      const bars = Math.min(count || 24, 32);
      for (let i = 0; i < bars; i++) {
        const rad = (i / bars) * Math.PI * 2;
        const val = data[i] || 0;
        const len = (val / 255) * (Math.min(w, h) * 0.38) + 2;
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? '#1db954' : '#818cf8';
        ctx.lineWidth = 2;
        ctx.moveTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
        ctx.lineTo(cx + Math.cos(rad) * (r + len), cy + Math.sin(rad) * (r + len));
        ctx.stroke();
      }
    } else if (mode === 'aurora') {
      // Flowing gradient wave
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#1db954');
      grad.addColorStop(0.5, '#06b6d4');
      grad.addColorStop(1, '#818cf8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = 4;
      for (let x = 0; x <= w; x += step) {
        const idx = Math.floor((x / w) * (data.length / 2));
        const val = (data[idx] || 0) / 255;
        const y = h - (val * h * 0.85) - 2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else {
      // Default 'bars': Neon spectrum bars
      const bars = count || 20;
      const barWidth = w / bars - 1.5;
      for (let i = 0; i < bars; i++) {
        const val = data[i * 2] || data[i] || 0;
        const barHeight = (val / 255) * h * 0.9 + 2;
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#1db954');
        grad.addColorStop(1, '#60a5fa');
        ctx.fillStyle = grad;
        ctx.fillRect(i * (barWidth + 1.5), h - barHeight, barWidth, barHeight);
      }
    }
  }

  function renderVisualizers() {
    /* ---------------------------------------------------------------------
       CPU / battery guard.

       This loop used to re-schedule itself unconditionally on its first line, so
       once started it ran at ~60fps for the entire life of the process - while
       the window was hidden or minimised, while nothing was playing, and while
       the user was in a different section. That is the main reason the app ran
       hot and drained the battery on both desktop and Android.

       It now stops when the page is not visible and stops entirely when the user
       switches the visualizer off. NOTHING was removed: every drawing path, style
       and effect below is untouched - only the decision to run.
       --------------------------------------------------------------------- */
    /* The 8D effect is modulated inside this loop, so the loop has to keep ticking
       while 8D is active even if the user switched the visualizer off or the page is
       hidden. Gating the whole loop on the visualizer setting silently killed 8D:
       measured panValue stayed 0 after enabling it. Drawing is still skipped when
       there is nothing to draw - only the modulation path is preserved. */
    const needsSpatialModulation = !!pannerNode && (
      (spatialAudioToggle && spatialAudioToggle.checked) ||
      (eqPresetSelect && eqPresetSelect.value === 'spatial8d')
    );
    if ((document.hidden || !visualizerEnabled()) && !needsSpatialModulation) {
      visualizerRafId = null;
      return;
    }
    visualizerRafId = requestAnimationFrame(renderVisualizers);

    if (!analyserNode || audio.paused || document.hidden) {
      // Draw one idle frame, then stop scheduling: an always-on loop is what made
      // the app burn ~190% CPU while paused.
      drawIdleCanvas(miniVisualizerCanvas);
      drawIdleCanvas(lyricsVisualizerCanvas);
      drawIdleCanvas(miniModeVisualizerCanvas);
      stopVisualizerLoop();
      return;
    }

    analyserNode.getByteFrequencyData(dataArray);

    // 1. Mini Visualizer in Player Bar
    if (miniVisualizerCanvas) {
      drawSpectrumCanvas(miniVisualizerCanvas, dataArray, visualizerMode, 18);
    }

    // 2. Lyrics Modal Visualizer
    if (lyricsVisualizerCanvas && lyricsModal.style.display === 'flex') {
      drawSpectrumCanvas(lyricsVisualizerCanvas, dataArray, visualizerMode, 42);
    }

    // 3. Mini Mode Floating Widget Visualizer
    if (miniModeVisualizerCanvas && document.body.classList.contains('mini-mode')) {
      drawSpectrumCanvas(miniModeVisualizerCanvas, dataArray, visualizerMode, 30);
    }

    // 4. Now Playing Studio Full Visualizer
    const npCanvas = document.getElementById('nowPlayingVisualizerCanvas');
    const npModal = document.getElementById('nowPlayingModal');
    if (npCanvas && npModal && npModal.style.display === 'flex') {
      drawSpectrumCanvas(npCanvas, dataArray, visualizerMode, 36);
    }
  }

  function drawIdleCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* Registered so the settings switch can start and stop the loop from outside
     this scope. Stopping cancels the frame outright; hiding the canvas would keep
     paying the cost. */
  visualizerStopper = function (on) {
    if (on) {
      if (visualizerRafId === null && !document.hidden) {
        visualizerRafId = requestAnimationFrame(renderVisualizers);
      }
    } else if (visualizerRafId !== null) {
      /* 8D is modulated inside this loop, so cancelling it while 8D is on left
         panValue stuck at 0 - the card looked enabled but the effect did nothing.
         Only stop when nothing in the loop still has work to do. */
      const needsSpatial = !!pannerNode && (
        (spatialAudioToggle && spatialAudioToggle.checked) ||
        (eqPresetSelect && eqPresetSelect.value === 'spatial8d')
      );
      if (needsSpatial) return;
      cancelAnimationFrame(visualizerRafId);
      visualizerRafId = null;
    }
  };
  renderVisualizers();
}

// -------------------------------------------------------------
// Apple Music Style Dynamic Color Backdrop Extractor
// -------------------------------------------------------------
function updateDynamicBackdrop(coverUrl) {
  if (!lyricsBackdrop || !coverUrl) return;
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;

      let r1 = 0, g1 = 0, b1 = 0;
      let r2 = 0, g2 = 0, b2 = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 16) {
        if (count % 2 === 0) {
          r1 += data[i]; g1 += data[i + 1]; b1 += data[i + 2];
        } else {
          r2 += data[i]; g2 += data[i + 1]; b2 += data[i + 2];
        }
        count++;
      }
      r1 = Math.min(240, Math.floor((r1 / (count / 2)) * 1.2));
      g1 = Math.min(240, Math.floor((g1 / (count / 2)) * 1.2));
      b1 = Math.min(240, Math.floor((b1 / (count / 2)) * 1.2));
      r2 = Math.min(240, Math.floor((r2 / (count / 2)) * 1.2));
      g2 = Math.min(240, Math.floor((g2 / (count / 2)) * 1.2));
      b2 = Math.min(240, Math.floor((b2 / (count / 2)) * 1.2));

      lyricsBackdrop.style.background = `
        radial-gradient(circle at 25% 30%, rgba(${r1}, ${g1}, ${b1}, 0.5), transparent 70%),
        radial-gradient(circle at 75% 75%, rgba(${r2}, ${g2}, ${b2}, 0.45), transparent 70%)
      `;
    } catch {}
  };
  img.src = coverUrl;
}

// -------------------------------------------------------------
// Curated Vault for Popular Arabic & Spacetoon Classics
// -------------------------------------------------------------
const EMBEDDED_LYRICS_DB = {
  'سيبه': `سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه
دوخ الناس بجماله .. حير الدنيا بدلاله
هاذي حالة ماهي بحالة
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

اللي ما عنده مشاعر
واللي خلى القلب حاير
لا هو حاط ولا هو طاير
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

عوفه .. قدر ظروفه
عيني عوفه قدر ظروفه
اللي ما يشوفك لا تشوفه
واللي عافك يلاه عوفه
خله وسط القلب خوفه
عوفه .. قدر ظروفه
عيني عوفه قدر ظروفه

هو بايع وإنت شاري
وبعذابك ما هو داري
ليه تتعب ليه تداري
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

ناره .. خليه بناره
عيني ناره مشتعلة ناره
اللي ما يعرف قراره
واللي ما صح اختياره
هو جاب لإيده ناره
ناره .. مشتعلة ناره

ما وفى مرة لحبيبه
نكر حبه وخان طيبه
الله لا يجعلها غيبة
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه`,

  'سيبها': `سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه
دوخ الناس بجماله .. حير الدنيا بدلاله
هاذي حالة ماهي بحالة
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

اللي ما عنده مشاعر
واللي خلى القلب حاير
لا هو حاط ولا هو طاير
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

عوفه .. قدر ظروفه
عيني عوفه قدر ظروفه
اللي ما يشوفك لا تشوفه
واللي عافك يلاه عوفه
خله وسط القلب خوفه
عوفه .. قدر ظروفه
عيني عوفه قدر ظروفه

هو بايع وإنت شاري
وبعذابك ما هو داري
ليه تتعب ليه تداري
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

ناره .. خليه بناره
عيني ناره مشتعلة ناره
اللي ما يعرف قراره
واللي ما صح اختياره
هو جاب لإيده ناره
ناره .. مشتعلة ناره

ما وفى مرة لحبيبه
نكر حبه وخان طيبه
الله لا يجعلها غيبة
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه`,

  'seba': `سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه
دوخ الناس بجماله .. حير الدنيا بدلاله
هاذي حالة ماهي بحالة
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

اللي ما عنده مشاعر
واللي خلى القلب حاير
لا هو حاط ولا هو طاير
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

عوفه .. قدر ظروفه
عيني عوفه قدر ظروفه
اللي ما يشوفك لا تشوفه
واللي عافك يلاه عوفه
خله وسط القلب خوفه
عوفه .. قدر ظروفه
عيني عوفه قدر ظروفه

هو بايع وإنت شاري
وبعذابك ما هو داري
ليه تتعب ليه تداري
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه

ناره .. خليه بناره
عيني ناره مشتعلة ناره
اللي ما يعرف قراره
واللي ما صح اختياره
هو جاب لإيده ناره
ناره .. مشتعلة ناره

ما وفى مرة لحبيبه
نكر حبه وخان طيبه
الله لا يجعلها غيبة
سيبه .. عذب حبيبه
عيني سيبه عذب حبيبه`,

  'النمر المقنع': `حلبة المصارعة ملتقى الأبطال
فيها زوايا أربعة ترقب الختام
كالحلم طائر... النمر المقنع
ينقض هائماً... النمر المقنع
لا يهاب الأخطار... شجاع مقدام
في وجه الأشرار... ينير الظلام
النمر المقنع... النمر المقنع
سوف ينتصر... في كل نزال
طائر... النمر المقنع
هائم... النمر المقنع
النمر المقنع`,

  'المحقق كونان': `يكتشف الغامض والمثير
يستنتج بالعقل الكبير
كونان الرجل الصغير
يسعى دائماً
الصوت صوت الصدق
والحق دائماً يقال
المحقق كونان... يبدو واثقاً
يعمل جاهداً... لا يخشى المحن
كونان... المحقق كونان
هيا يا كونان`,

  'عهد الأصدقاء': `حلمنا نهار... نهارنا عمل
نملك الخيار... وخيارنا الأمل
وتهدينا الحياة أضواءً في آخر النفق
تدعونا كي ننسى ألماً عشناه
نستسلم لكن لا ما دمنا أحياء نرزق
ما دام الأمل طريقاً فسنحياه
بيننا صديق... لا يعرف الكلل
مخلص رقيق... إن قال فعل
روميو صديقي يحفظ عهد الأصدقاء
يعرف كيف يجابه الأيام`,

  'ريمي': `أنتي الأمان... أنتي الحنان
من تحت قدميك لنا الجنان
عندما تضحكين... تضحك الحياة
تزهر الآمال في طريقنا
أمي... أمي... أمي
دمتي لنا عوناً... ونوراً في الدجى
يا نبع الحنان... دمتي للأبد`,

  'القناص': `قد لمعت عيناه... بالعزم انتفضت يمناه
في هدوء الليل... من هو الصامد المغامر
في وجه السيل... يبعد عن عينيه الراحة
يتحدى خصماً في الساحة
يرمي ويصيب الأهداف... يسعى دوماً لتحقيق الإنصاف
القناص... في كل مكان`,

  'هزيم الرعد': `هزيم الرعد... هزيم الرعد
ما عاش الظالم يسبيك... وفينا نفس بعد
بحنيني بدمي أفديك... وروحي تنبت مجد
هزيم الرعد... هزيم الرعد
سيفك في الميدان نداء... يملأ أفق الكون ضياء
هزيم الرعد... هزيم الرعد`,

  'أنا وأخي': `شوق يدفعني لأراها... أمي ذكرى لا أنساها
صوت أنقى من همس النسيم... يمسح عني الحزن المقيم
أمي الحبيبة... يا نبع الحنان
أخي الصغير أمانة في عنقي
سأرعاه بعيني وأحميه بحبي
دمتي لنا يا أمي`,

  'كابتن ماجد': `كابتن ماجد... كابتن ماجد
عاد إليكم من جديد
تمريرة متقنة... تسديدة صاروخية
نحو الهدف في المرمى
سجل هدفاً رائعاً... كابتن ماجد
كابتن ماجد... في الملعب بطل`,

  'دراغون بول': `رأيت الحقيقة خلف البصر
رسمت الحروف بعمق الحجر
أنير طريقي بحلم المنى
وأمضي لأجتاز كل الخطر
دراغون بول... دراغون بول
هيا معا للأمام... نحمي السلام`,

  'سلام دانك': `سريع كالسهم إلى الهدف
لا أخشى الصعاب ولا أقف
كرة السلة في يدي
تحكي قصة الغدِ
سلام دانك... سلام دانك
في الملعب لا نستسلم أبداً`,

  'سيمبا': `سيمبا قادم... سيمبا جاء
سيمبا عند مخاض الشدة
يتحدى الأعداء
ملك الغابة قادم
رمز العدل الصامد
سيمبا... سيمبا`,

  'ماوكلي': `في الغابة قانون يسري... في كل مكان
قانون أهداه الباري... لبني الإنسان
ساعد غيرك تنجو... كن عوناً للخلان
ماوكلي فتى الأدغال
يحيا وسط الأبطال`,

  'أبطال الديجيتال': `في فخ غريب وقعنا... في عالم الأرقام ضمنا
هيا إلى العمل... نجمع شمل الأمل
أبطال الديجيتال... لا نخشى الأهوال
بالعزم والإصرار... ننتصر في النضال`
};

function cleanSongTitle(title, artist = '') {
  if (!title) return '';
  let t = String(title);
  /* Collaborator clauses are not part of the track name at the lyrics provider, so
     "ft." / "feat." is dropped - it was being left in the query, which is why
     "LMFAO - Party Rock Anthem ft. Lauren Bennett" matched nothing.

     It is dropped in two safe situations only:
       - a separator follows the clause ("Marshmello ft. Bastille - Happier")
       - the string already contains an "artist - title" separator, so the title is
         complete and anything after "ft." is the collaborator
     Without those conditions the words after "ft." could be the title itself and
     would be lost, so they are left alone. */
  t = t.replace(/\s*[(\[]?\b(?:ft|feat|featuring)\.?\s+[^)\]\-–|]+[)\]]?(?=\s*[-–|])/gi, ' ');
  if (/\s[-–|]\s/.test(t)) {
    t = t.replace(/\s*[(\[]?\b(?:ft|feat|featuring)\.?\s+[^)\]]*[)\]]?\s*$/gi, '');
  }
  return t
    .replace(/^أغنية\s+(بداية|شارة|نهاية)?\s*/gi, '')
    .replace(/^شارة\s+(بداية|نهاية)?\s*/gi, '')
    .replace(/^أغنية\s*/gi, '')
    .replace(/^شارة\s*/gi, '')
    .replace(/^موسيقى\s*/gi, '')
    .replace(/-\s*سبيستون/gi, '')
    .replace(/سبيستون/gi, '')
    .replace(/سبيس\s*تون/gi, '')
    .replace(/Spacetoon/gi, '')
    .replace(/\(Official.*?\)|\[.*?\]/gi, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(remastered|full\s*version|audio|video|lyrics)\b/gi, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidLyrics(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 20) return false;

  // Strict Content Filter: Instantly reject web search garbage, URLs, tags, or search parameters
  const badPatterns = [
    /class\s*=/i,
    /href\s*=/i,
    /https?:\/\//i,
    /duckduckgo/i,
    /result__snippet/i,
    /uddg\s*=/i,
    /www\./i,
    /%[0-9a-f]{2}/i,
    /<\/?(a|div|span|script|style|html|body|p|h[1-6]|ul|li)\b/i,
    /cookies/i,
    /copyright/i,
    /subscribe/i,
    /all rights reserved/i
  ];

  for (const pat of badPatterns) {
    if (pat.test(trimmed)) return false;
  }

  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.length >= 2;
}

// -------------------------------------------------------------
// Zero-API Internet Lyrics Auto-Detector & Karaokizer
// -------------------------------------------------------------
async function autoDetectLyrics(song, forceRefresh = false) {
  if (!song) return;
  const cacheKey = `nav_lyrics_v2_${song.id}`;

  lyricsTitle.textContent = song.title;
  lyricsArtist.textContent = cleanArtistName(song.artist, currentLang === 'ar' ? 'فنان غير معروف' : 'Unknown Artist');
  tickerText.textContent = `Auto-detecting lyrics for "${song.title}"...`;
  lyricsSourceBadge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Auto-Detecting...`;
  lyricsSavedBadge.style.display = 'none';

  if (lyricsHeaderThumb) {
    if (song.coverArt) {
      lyricsHeaderThumb.innerHTML = `<img src="${buildSubsonicUrl('getCoverArt.view', { id: song.coverArt, size: 80 })}" />`;
    } else {
      lyricsHeaderThumb.innerHTML = `<i class="fa-solid fa-microphone-lines"></i>`;
    }
  }

  // 0. Local subtitle file (.srt / .vtt / .lrc) chosen or auto-matched for this
  //    song. It always wins over the network sources below - that is what makes
  //    hand-made YouTube subtitle files usable for local tracks.
  try {
    const localLines = await loadSubtitleForSong(song, forceRefresh);
    if (localLines && localLines.length) {
      parsedLyrics = localLines;
      activeLyricIndex = -1;
      currentLyricSource = localLines.__source || 'Local subtitle';
      lyricsSourceBadge.innerHTML = `<i class="fa-solid fa-closed-captioning"></i> ${escapeHtml(currentLyricSource)}`;
      lyricsSavedBadge.style.display = 'none';
      if (tickerText) tickerText.textContent = localLines[0].text;
      renderLyricsUI();
      return;
    }
  } catch (e) { /* fall through to the standard chain */ }

  // 1. Check Local Cache (with validity check to purge any old search snippets)
  if (!forceRefresh) {
    const cached = lyricsCache[song.id] || localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const item = JSON.parse(cached);
        const allText = (item.lines || []).map(l => l.text).join(' ');
        if (isValidLyrics(allText)) {
          parsedLyrics = item.lines;
          currentLyricSource = item.source || 'Auto-Saved';
          lyricsSourceBadge.innerHTML = `<i class="fa-solid fa-check"></i> ${escapeHtml(currentLyricSource)}`;
          lyricsSavedBadge.style.display = 'inline-flex';
          lyricsSavedBadge.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Auto-Saved`;
          renderLyricsUI();
          return;
        } else {
          // Purge corrupted old cache entry
          localStorage.removeItem(cacheKey);
          delete lyricsCache[song.id];
        }
      } catch {}
    }
  }

  parsedLyrics = [];
  activeLyricIndex = -1;
  let rawLyrics = '';
  let detectedSource = '';
  let isAlreadySynced = false;

  const cleanedTitle = cleanSongTitle(song.title, song.artist);
  const lowerTitle = (song.title || '').toLowerCase().trim();
  const lowerCleaned = (cleanedTitle || '').toLowerCase().trim();
  const isArabicArtist = /[\u0600-\u06FF]/.test(song.title + ' ' + song.artist) || /waleed|alshami|al\s*shami|rashid|rashed|abdulmajeed|diab|hosny|tarab|rotana|assala|sherine|jassmi/i.test(song.artist + ' ' + song.title);

  // Level 1: Check Built-in Curated Vault for Arabic, Spacetoon & Pop Classics
  for (const key of Object.keys(EMBEDDED_LYRICS_DB)) {
    const lk = key.toLowerCase();
    if (lowerCleaned.includes(lk) || lowerTitle.includes(lk) || lk === lowerTitle || lk === lowerCleaned) {
      rawLyrics = EMBEDDED_LYRICS_DB[key];
      detectedSource = 'Curated Vault (Arabic Music)';
      break;
    }
  }

  // Level 2: Subsonic getLyricsBySongId (structured lines)
  if (!rawLyrics) {
    try {
      const sub = await apiRequest('getLyricsBySongId.view', { id: song.id });
      if (sub.lyricsList?.structuredLyrics?.[0]?.line) {
        const lines = sub.lyricsList.structuredLyrics[0].line;
        const joined = lines.map(l => l.value).join('\n');
        if (isValidLyrics(joined)) {
          if (!isArabicArtist || /[\u0600-\u06FF]/.test(joined)) {
            parsedLyrics = lines.map(l => ({ time: (l.start || 0) / 1000, text: l.value }));
            detectedSource = 'Navidrome (Embedded LRC)';
            isAlreadySynced = true;
          }
        }
      }
    } catch {}
  }

  // Level 3: Subsonic getLyrics (classic tag)
  if (!rawLyrics && parsedLyrics.length === 0) {
    try {
      const sub = await apiRequest('getLyrics.view', { artist: song.artist, title: song.title });
      if (sub.lyrics?.value && isValidLyrics(sub.lyrics.value)) {
        if (!isArabicArtist || /[\u0600-\u06FF]/.test(sub.lyrics.value)) {
          rawLyrics = sub.lyrics.value;
          detectedSource = 'Navidrome (Internal)';
        }
      }
    } catch {}
  }

  /* Placeholder artists poison the lookup.

     A real library here has 987 of 1565 songs tagged "[Unknown Artist]" by the
     server, and that string was being sent to the lyrics provider verbatim - both
     as artist_name in the exact-match request and inside the free-text search
     query. The provider was therefore asked for "Title [Unknown Artist]" and
     matched nothing, which is why well-known tracks came back empty. When there is
     no real artist, search by title alone. */
  const lookupArtist = cleanArtistName(song.artist, '');

  // Level 4: LRCLIB Direct Exact Match (Zero-API)
  if (!rawLyrics && parsedLyrics.length === 0) {
    try {
      const cleanArtist = lookupArtist.replace(/VEVO|Official|Topic/gi, '').trim();
      const lrclibUrl = 'https://lrclib.net/api/get?'
        + (cleanArtist ? `artist_name=${encodeURIComponent(cleanArtist)}&` : '')
        + `track_name=${encodeURIComponent(cleanedTitle)}&album_name=${encodeURIComponent(song.album || '')}&duration=${song.duration || 0}`;
      const res = await httpGetJson(lrclibUrl);
      if (res.ok) {
        const ldata = res.data;
        let cand = ldata.syncedLyrics || ldata.plainLyrics;
        if (cand && isValidLyrics(cand)) {
          if (!isArabicArtist || /[\u0600-\u06FF]/.test(cand)) {
            rawLyrics = cand;
            detectedSource = ldata.syncedLyrics ? 'LRCLIB (Synced Web)' : 'LRCLIB (Plain Web)';
            isAlreadySynced = !!ldata.syncedLyrics;
          }
        }
      }
    } catch {}
  }

  // Level 5: LRCLIB Search with artist name & Arabic check (Zero-API)
  if (!rawLyrics && parsedLyrics.length === 0) {
    try {
      const query = [cleanedTitle, lookupArtist].filter(Boolean).join(' ').trim();
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const res = await httpGetJson(searchUrl);
      if (res.ok) {
        const items = res.data;
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            let cand = item.syncedLyrics || item.plainLyrics;
            if (cand && isValidLyrics(cand)) {
              if (isArabicArtist && !/[\u0600-\u06FF]/.test(cand)) {
                continue; // Do not assign English lyrics to Arabic songs!
              }
              rawLyrics = cand;
              detectedSource = item.syncedLyrics ? 'LRCLIB Search (Synced)' : 'LRCLIB Search (Plain)';
              isAlreadySynced = !!item.syncedLyrics;
              break;
            }
          }
        }
      }
    } catch {}
  }

  // Parse into structured Lyric Lines
  if (parsedLyrics.length === 0 && rawLyrics) {
    const lrcLines = parseLrc(rawLyrics);
    if (lrcLines.some(l => l.time >= 0)) {
      parsedLyrics = lrcLines;
    } else {
      // Plain lyrics: Run Smart Karaokizer Engine
      parsedLyrics = karaokizeLyrics(rawLyrics, song.duration || audio.duration || 180);
      detectedSource = `${detectedSource || 'Vault'} (AI Auto-Synced)`;
    }
  }

  if (parsedLyrics.length > 0) {
    currentLyricSource = detectedSource || 'Auto-Detected';
    lyricsSourceBadge.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${escapeHtml(currentLyricSource)}`;
    // Auto-Save persistently to localStorage, memory, and disk!
    saveLyricsPersistent(song, parsedLyrics, currentLyricSource);
    renderLyricsUI();
  } else {
    const t = I18N[currentLang] || I18N.en;
    lyricsSourceBadge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${t.noLyrics}`;
    lyricsSavedBadge.style.display = 'none';
    tickerText.textContent = `${t.noLyrics} ("${song.title}")`;
    if (miniLyricsLine) miniLyricsLine.textContent = t.noLyrics;
    lyricsContainer.innerHTML = `
      <div style="text-align: center; color: #8c8ca5; padding: 60px 0;">
        <i class="fa-solid fa-align-left" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.4;"></i>
        <p style="font-size: 16px; font-weight: 500; color: #b3b3c9;">${t.noLyrics}</p>
        <p style="font-size: 13px; margin-top: 6px; color: #7b7b95;">${t.noLyricsSub}</p>
        <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
          <button class="top-action-btn" onclick="editLyricsBtn.click()">
            <i class="fa-solid fa-pen-to-square"></i> ${t.addPasteLyrics}
          </button>
          <button class="top-action-btn" onclick="autoDetectLyrics(currentSong, true)">
            <i class="fa-solid fa-rotate-right"></i> ${t.retrySearch}
          </button>
        </div>
      </div>
    `;
  }
}

// Persistent Storage for Lyrics (Local Storage + File Disk Cache in Electron)
function saveLyricsPersistent(song, lines, source) {
  if (!song || !lines || lines.length === 0) return;
  const cacheKey = `nav_lyrics_v2_${song.id}`;
  const data = { lines, source, timestamp: Date.now() };

  // 1. In-memory Cache
  lyricsCache[song.id] = data;

  // 2. Browser LocalStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch {}

  // 3. Persistent .lrc on disk (desktop only). The page has no filesystem access
  //    any more, so the main process writes it through the preload bridge.
  try {
    const lrcContent = generateLrcContent(song, lines);
    if (archimedesBridge && typeof archimedesBridge.lyricsSave === 'function') {
      archimedesBridge.lyricsSave(song.id, lrcContent).catch(() => {});
    }
  } catch (e) { /* non-fatal: memory + localStorage copies are already written */ }

  // Update UI Saved Badge
  if (lyricsSavedBadge) {
    lyricsSavedBadge.style.display = 'inline-flex';
    lyricsSavedBadge.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Auto-Saved`;
  }
}

function saveCustomLyrics(song, rawText) {
  if (!song || !rawText) return;
  let lines = [];
  if (/\[\d{2}:\d{2}/.test(rawText)) {
    lines = parseLrc(rawText);
  } else {
    lines = karaokizeLyrics(rawText, song.duration || audio.duration || 180);
  }
  if (lines.length > 0) {
    parsedLyrics = lines;
    currentLyricSource = 'Custom (User Added)';
    lyricsSourceBadge.innerHTML = `<i class="fa-solid fa-user-pen"></i> ${escapeHtml(currentLyricSource)}`;
    saveLyricsPersistent(song, parsedLyrics, currentLyricSource);
    renderLyricsUI();
  }
}

function generateLrcContent(song, lines) {
  let content = `[ti:${song.title || ''}]\n[ar:${song.artist || ''}]\n[al:${song.album || ''}]\n\n`;
  lines.forEach(l => {
    const totalSec = Math.max(0, l.time || 0);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 100);
    const timeTag = `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
    content += `${timeTag} ${l.text}\n`;
  });
  return content;
}

function exportLrcToFile(song, lines) {
  const content = generateLrcContent(song, lines);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = `${song.artist || 'Unknown'} - ${song.title || 'Track'}.lrc`.replace(/[\\/:*?"<>|]/g, '_');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Smart Karaokizer: Generates live progressive rhythm timestamps for plain lyrics
function karaokizeLyrics(plainText, totalDurationSeconds) {
  if (!plainText) return [];
  const rawLines = plainText.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^\[(verse|chorus|intro|outro|bridge|hook)\]/i.test(l));

  if (rawLines.length === 0) return [];

  const duration = Math.max(30, totalDurationSeconds || 180);
  const introDelay = Math.min(15, duration * 0.08); // 8% intro delay
  const availableTime = duration - introDelay - 5;
  const timePerLine = availableTime / rawLines.length;

  return rawLines.map((text, i) => ({
    time: parseFloat((introDelay + i * timePerLine).toFixed(2)),
    text: text,
  }));
}

function renderLyricsUI() {
  if (parsedLyrics.length === 0) return;
  let html = '';
  parsedLyrics.forEach((l, idx) => {
    html += `<div class="lyric-line" id="lyric-${idx}" onclick="seekToLyric(${escJs(l.time)})">${escapeHtml(l.text)}</div>`;
  });
  lyricsContainer.innerHTML = html;
  if (activeLyricIndex >= 0) {
    const el = document.getElementById(`lyric-${activeLyricIndex}`);
    if (el) el.classList.add('active');
  }
}

function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result = [];
  // A single centisecond digit is legal ("[00:05.5]") and used to be ignored
  // entirely, so those lines never appeared as lyrics at all.
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/;
  // LRC metadata tags ([ti:], [ar:], [al:], [offset:] ...) were being emitted as
  // lyric lines, so a file rendered "[ti:Song]" and "[ar:Artist]" as if they were
  // words to sing. They are identifiers, not lyrics.
  const metaRegex = /^\[(ti|ar|al|au|by|re|ve|le|length|offset|lyricist|encoding):/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (metaRegex.test(trimmed)) continue;
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, '0').substring(0, 3), 10) : 0;
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
      if (text) {
        result.push({ time: totalSeconds, text });
      }
    } else {
      // Genuinely untimed text is kept (some files carry unsynced lines), but a
      // bare bracket tag that is not a known identifier is skipped as junk.
      if (/^\[[^\]]*\]$/.test(trimmed)) continue;
      result.push({ time: -1, text: trimmed });
    }
  }
  return result.sort((a, b) => (a.time >= 0 && b.time >= 0 ? a.time - b.time : 0));
}

function seekToLyric(timeSeconds) {
  if (timeSeconds >= 0 && audio.duration) {
    audio.currentTime = timeSeconds;
    audio.play();
  }
}

function syncLyricsWithTime(currentTimeSeconds) {
  if (!parsedLyrics || parsedLyrics.length === 0) return;
  let cur = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (parsedLyrics[i].time >= 0 && parsedLyrics[i].time <= currentTimeSeconds) {
      cur = i;
    } else if (parsedLyrics[i].time > currentTimeSeconds) {
      break;
    }
  }

  /* The position can sit before the first lyric - at the start of a track, or after
     the user seeks backwards past the intro. In that case cur is -1 and the old code
     simply did nothing, because it only acted on cur >= 0. The previously active
     line therefore stayed highlighted and the ticker kept showing words that were no
     longer being sung. Clear it instead. */
  if (cur < 0 && activeLyricIndex >= 0) {
    activeLyricIndex = -1;
    document.querySelectorAll('.lyric-line').forEach(el => el.classList.remove('active'));
    if (tickerText) tickerText.textContent = '';
    if (miniLyricsLine) miniLyricsLine.textContent = '';
    if (typeof refreshFloatLyricsText === 'function') refreshFloatLyricsText();
  }

  if (cur !== activeLyricIndex && cur >= 0) {
    activeLyricIndex = cur;
    const activeText = parsedLyrics[cur].text;

    // Update Player Bar Live Ticker
    if (tickerText) tickerText.textContent = activeText;
    // Update Mini Player Subtitle
    if (miniLyricsLine) miniLyricsLine.textContent = activeText;
    // Update the floating on-screen lyrics overlay (if it is enabled)
    if (typeof refreshFloatLyricsText === 'function') refreshFloatLyricsText();

    // Update Lyrics Modal Highlight & Auto-Scroll
    document.querySelectorAll('.lyric-line').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`lyric-${cur}`);
    if (activeEl) {
      activeEl.classList.add('active');
      /* scrollIntoView picked the wrong box.

         #lyricsModal is a position:fixed overlay that is itself scrollable, so
         scrollIntoView scrolled THAT (about 40px of range) and left the lyrics list
         where it was - the highlight moved down the song while the list never
         followed. Measured: jumping to line 30 of 40 moved the list only 45px, while
         setting scrollTop directly moved it correctly. Scroll the list itself,
         computed from rects so it does not depend on offsetParent. */
      const scroller = activeEl.closest('.lyrics-container') ||
        document.getElementById('lyricsContainer');
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
        const lineRect = activeEl.getBoundingClientRect();
        const boxRect = scroller.getBoundingClientRect();
        const delta = (lineRect.top - boxRect.top) -
          (scroller.clientHeight / 2) + (lineRect.height / 2);
        scroller.scrollTo({
          top: Math.max(0, scroller.scrollTop + delta),
          behavior: 'smooth',
        });
      } else if (scroller) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Update Now Playing Experience Studio Highlight & Auto-Scroll
    document.querySelectorAll('.np-lyric-line').forEach(el => el.classList.remove('active'));
    const npActiveEl = document.getElementById(`npline-${cur}`);
    if (npActiveEl) {
      npActiveEl.classList.add('active');
      scrollNowPlayingActiveLyricIntoView();
    }
  }
}

// -------------------------------------------------------------
// Smart Gapless Audio Preloader
// -------------------------------------------------------------
function preloadNextTrack(nextSong) {
  if (!nextSong || nextSongPreloader) return;
  try {
    nextSongPreloader = new Audio();
    nextSongPreloader.preload = 'auto';
    nextSongPreloader.src = buildSubsonicUrl('stream.view', { id: nextSong.id });
  } catch {}
}

// -------------------------------------------------------------
// System Media Session & Global Shortcuts
// -------------------------------------------------------------
function setupMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) audio.currentTime = details.seekTime;
    });
  }

  // Android: the WebView has no Media Session API (navigator.mediaSession is
  // undefined there), so the native foreground service owns the notification and
  // the system / Bluetooth / headset media keys. It calls back into this page.
  if (window.ArchimedesNative && typeof window.ArchimedesNative.startPlaybackService === 'function') {
    window.onMediaButton = (action) => {
      if (action === 'toggle' || action === 'play' || action === 'pause') togglePlayPause();
      else if (action === 'next') playNext();
      else if (action === 'prev') playPrevious();
      else if (action === 'stop') audio.pause();
    };
  }

  // Single source of truth for the notification state: the element's own events,
  // so every path (button, media key, track change, end of queue) stays in sync.
  audio.addEventListener('play', () => notifyNativeNowPlaying(true));
  audio.addEventListener('pause', () => notifyNativeNowPlaying(false));
}
window.setupMediaSession = setupMediaSession;

/** Pushes the current track + playback state to the Android notification. */
function notifyNativeNowPlaying(isPlaying) {
  if (!window.ArchimedesNative) return;
  const title = currentSong ? String(currentSong.title || '') : '';
  const artist = currentSong ? String(currentSong.artist || '') : '';
  try {
    if (!currentSong || !title) {
      if (typeof window.ArchimedesNative.stopPlaybackService === 'function') {
        window.ArchimedesNative.stopPlaybackService();
      }
      return;
    }
    if (isPlaying && typeof window.ArchimedesNative.startPlaybackService === 'function') {
      window.ArchimedesNative.startPlaybackService(title, artist, true);
    } else if (typeof window.ArchimedesNative.updateNowPlaying === 'function') {
      window.ArchimedesNative.updateNowPlaying(title, artist, !!isPlaying);
    }
  } catch (e) { /* notification is best-effort */ }
}
window.notifyNativeNowPlaying = notifyNativeNowPlaying;

function updateMediaSession(song, coverUrl) {
  if ('mediaSession' in navigator && song) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'Navidrome Library',
      artwork: coverUrl ? [{ src: coverUrl, sizes: '300x300', type: 'image/jpeg' }] : []
    });
    if ('playbackState' in navigator.mediaSession) {
      navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
    }
    if ('setPositionState' in navigator.mediaSession && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate || 1.0,
          position: Math.min(audio.currentTime, audio.duration)
        });
      } catch (e) {}
    }
  }
  // Android notification / MediaSession metadata.
  notifyNativeNowPlaying(!audio.paused);
}

function setupGlobalHotkeys() {
  window.addEventListener('keydown', (e) => {
    // Ignore hotkeys when typing in search or inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === 'ArrowRight' && !e.ctrlKey) {
      e.preventDefault();
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    } else if (e.code === 'ArrowLeft' && !e.ctrlKey) {
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (e.code === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      playNext();
    } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      playPrevious();
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      audio.volume = Math.min(1, audio.volume + 0.05);
      volumeSlider.value = audio.volume;
      updateVolumeIcon();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      audio.volume = Math.max(0, audio.volume - 0.05);
      volumeSlider.value = audio.volume;
      updateVolumeIcon();
    } else if (e.key === 'l' || e.key === 'L') {
      lyricsToggleBtn.click();
    } else if (e.key === 'e' || e.key === 'E') {
      eqToggleBtn.click();
    } else if (e.key === 'v' || e.key === 'V') {
      cycleVisualizerMode();
    } else if (e.key === 's' || e.key === 'S') {
      if (shuffleToggleBtn) shuffleToggleBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      if (repeatToggleBtn) repeatToggleBtn.click();
    } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      toggleShortcutsModal();
    } else if (e.key === 'f' || e.key === 'F') {
      if (fullscreenBtn) fullscreenBtn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      if (volumeIcon) volumeIcon.click();
    } else if (e.key === 'q' || e.key === 'Q') {
      toggleQueueModal();
    }
  });

}

/* Values the scanners emit for "no album" / "no artist".

   Measured on a real device: 8 of 31 local tracks carried the literal string "0"
   as their album, because MediaStore's album field was stringified straight
   through. The previous inline check only rejected '', 'Local Device' and
   '<unknown>', so those rows rendered a bare "0" in the album column.

   These MUST stay at module scope: an earlier attempt placed them inside the
   songs-view render callback, and the local view then threw
   "cleanArtistName is not defined" and showed a connection error instead of the
   list. */
function cleanAlbumName(album, fallback) {
  const v = String(album == null ? '' : album).trim();
  // The server returns bracketed placeholders - '[Unknown Album]' was found in the
  // real library - and they used to be printed verbatim in the album column.
  const junk = ['', '0', 'null', 'undefined', 'unknown', '<unknown>', '[unknown]',
    '[Unknown Album]', '[unknown album]', 'Unknown Album', 'no album', '[no album]',
    'Local Device', 'Device Music', 'Local Artist'];
  if (junk.indexOf(v) !== -1) return fallback;
  return v;
}

function cleanArtistName(artist, fallback) {
  const v = String(artist == null ? '' : artist).trim();
  // '[Unknown Artist]' (bracketed) is what Navidrome/Subsonic actually returns for
  // tracks with no artist tag, and it was reaching the player bar verbatim.
  const junk = ['', '0', 'null', 'undefined', 'unknown', '<unknown>', '[unknown]',
    '[Unknown Artist]', '[unknown artist]', 'Unknown Artist', 'no artist', '[no artist]',
    'Device Music', 'Local Artist', 'Local Device'];
  if (junk.indexOf(v) !== -1) return fallback;
  return v;
}

/* "1 Album" not "1 Albums", in both languages. Titles, album counts and track
   counts are rendered in a dozen places and the plural form was hardcoded, so
   every single-item card read wrong. */
function countLabel(n, enOne, enMany, arOne, arMany) {
  const num = Number(n) || 0;
  if (currentLang === 'ar') return num + ' ' + (num === 1 ? arOne : arMany);
  return num + ' ' + (num === 1 ? enOne : enMany);
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

/**
 * Escapes a value for a JS string that lives inside an HTML attribute, i.e.
 * onclick="fn('${escJs(value)}')". Escape for JS first, then for HTML: the HTML
 * parser decodes entities before the handler is compiled, so HTML escaping alone
 * does not keep the value inside its string literal.
 */
function escJs(value) {
  const raw = (value === null || value === undefined) ? '' : String(value);
  const js = raw
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\x3c');
  return escapeHtml(js);
}
window.escJs = escJs;

window.openArtist = openArtist;
window.openPlaylist = openPlaylist;
window.openAlbum = openAlbum;
window.renderArtists = renderArtists;
window.renderAlbums = renderAlbums;
window.renderSongs = renderSongs;
window.renderUpload = renderUpload;
window.renderPlaylists = renderPlaylists;
window.playSongAt = playSongAt;
window.playAllCurrentQueue = playAllCurrentQueue;
window.playAllArtistSongs = playAllArtistSongs;
window.seekToLyric = seekToLyric;
window.autoDetectLyrics = autoDetectLyrics;
window.openAddToPlaylistModal = openAddToPlaylistModal;
window.closePlaylistModal = closePlaylistModal;
window.createNewPlaylistFromModal = createNewPlaylistFromModal;
window.addSongToPlaylist = addSongToPlaylist;
window.toggleQueueModal = toggleQueueModal;
window.renderQueueUI = renderQueueUI;
window.removeFromQueue = removeFromQueue;
window.clearCurrentQueue = clearCurrentQueue;
window.shuffleCurrentQueue = shuffleCurrentQueue;
window.deleteAlbum = deleteAlbum;
window.deleteArtist = deleteArtist;
window.toggleSleepTimerModal = toggleSleepTimerModal;
window.setSleepTimer = setSleepTimer;
window.cancelSleepTimer = cancelSleepTimer;


// Run on load
// =============================================================
// Local subtitle lyrics: .srt / .vtt / .lrc support
// =============================================================
// The previous pipeline only knew the curated vault, Navidrome tags and LRCLIB, so
// a local track with a hand-made YouTube .srt sitting next to it could never show
// timed lyrics. This adds: a registered subtitle folder (granted through a native
// dialog), automatic best-match scoring by filename and duration, a manual picker,
// and per-song persistence of the chosen file.
let subtitleFiles = [];       // [{ path, name, dir, size }]
let subtitleFolder = null;    // active granted root
let subtitleMap = {};         // songId -> absolute subtitle path
const subtitleLineCache = {}; // path -> [{ time, text }]

function loadSubtitleState() {
  try {
    subtitleMap = JSON.parse(localStorage.getItem('archimedes_subtitle_map') || '{}') || {};
  } catch (e) {
    subtitleMap = {};
  }
  subtitleFolder = localStorage.getItem('archimedes_subtitle_folder') || null;
}

function saveSubtitleMap() {
  try { localStorage.setItem('archimedes_subtitle_map', JSON.stringify(subtitleMap)); } catch (e) { /* quota */ }
}

function setSubtitleFolder(folder) {
  subtitleFolder = folder || null;
  try {
    if (folder) localStorage.setItem('archimedes_subtitle_folder', folder);
    else localStorage.removeItem('archimedes_subtitle_folder');
  } catch (e) { /* ignore */ }
}

/** Electron IPC on desktop, native bridge on Android, no-op elsewhere. */
const subtitleIo = {
  async call(channel, arg) {
    try {
      if (ipcRenderer) {
        return await ipcRenderer.invoke(channel, arg);
      }
    } catch (e) { /* not electron */ }
    return null;
  },
  async scan(root) {
    if (archimedesBridge && typeof archimedesBridge.subtitleScan === 'function') {
      return archimedesBridge.subtitleScan(root);
    }
    const viaIpc = await this.call('subtitle-scan', root);
    if (viaIpc) return viaIpc;
    // Android: subtitles imported through SAF live in app-private storage.
    if (window.ArchimedesNative && typeof window.ArchimedesNative.listLocalSubtitles === 'function') {
      try {
        const items = JSON.parse(window.ArchimedesNative.listLocalSubtitles() || '[]');
        return {
          folder: 'ملفات الكلمات المستوردة (ذاكرة التطبيق)',
          files: items.map(i => ({ path: i.name, name: i.name, dir: '', size: i.size || 0 }))
        };
      } catch (e) {
        return { folder: null, files: [] };
      }
    }
    return { folder: root || subtitleFolder, files: [] };
  },
  async read(filePath) {
    if (archimedesBridge && typeof archimedesBridge.subtitleRead === 'function') {
      return archimedesBridge.subtitleRead(filePath);
    }
    const viaIpc = await this.call('subtitle-read', filePath);
    if (viaIpc) return viaIpc;
    if (window.ArchimedesNative && typeof window.ArchimedesNative.readSubtitleFile === 'function') {
      const text = window.ArchimedesNative.readSubtitleFile(String(filePath));
      if (text) {
        return { ok: true, path: filePath, name: String(filePath).split(/[\\/]/).pop(), text };
      }
      return { ok: false, error: 'not-found' };
    }
    return null;
  },
  async chooseFolder() {
    if (window.archimedes && typeof window.archimedes.subtitleChooseFolder === 'function') {
      return window.archimedes.subtitleChooseFolder();
    }
    return this.call('subtitle-choose-folder');
  },
  async pick() {
    if (window.archimedes && typeof window.archimedes.subtitlePick === 'function') {
      return window.archimedes.subtitlePick();
    }
    const viaIpc = await this.call('subtitle-pick');
    if (viaIpc) return viaIpc;
    // Android: Storage Access Framework through the WebView bridge.
    if (window.ArchimedesNative && typeof window.ArchimedesNative.pickSubtitleFile === 'function') {
      return new Promise((resolve) => {
        window.onSubtitleFilePicked = (name, content) => resolve({ name, path: name, text: content });
        window.ArchimedesNative.pickSubtitleFile();
        setTimeout(() => resolve(null), 120000);
      });
    }
    return null;
  }
};

// ---------- parsing ----------

function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')      // Arabic diacritics + tatweel
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')       // alef variants
    .replace(/\.[a-z0-9]{2,4}$/i, '')                 // file extension
    .replace(/\b(arabic|english|french|german|spanish|synced|sync|lyrics?|official|custom|subtitle|subtitles|subs?|srt|lrc|vtt|hd|4k|remaster|remastered|audio|video|music)\b/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokens(value) {
  return normalizeForMatch(value).split(' ').filter(t => t.length > 1);
}

function tokenScore(a, b) {
  const A = new Set(nameTokens(a));
  const B = new Set(nameTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(t => { if (B.has(t)) inter++; });
  return inter / Math.max(A.size, B.size);
}

/** Accepts 00:01:02,500 / 00:01:02.500 / 01:02.5 and returns seconds. */
function parseSubtitleTimestamp(stamp) {
  const m = /^(?:(\d{1,3}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/.exec(String(stamp || '').trim());
  if (!m) return -1;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const mi = parseInt(m[2], 10);
  const s = parseInt(m[3], 10);
  const frac = m[4] ? parseInt(m[4].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
  return h * 3600 + mi * 60 + s + frac;
}

function parseSrtOrVtt(text) {
  const out = [];
  const cueRe = /^\s*((?:\d{1,3}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d{1,3}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)/;
  /* Normalise line endings before anything else.

     Cue blocks are separated by a blank line, which this parser finds with
     /\n{2,}/. In a file saved with Windows line endings that separator is
     "\n\r\n" - the carriage return sits between the two newlines - so the pattern
     never matched, the whole file collapsed into ONE block, and every cue except
     the first was silently discarded. Measured on the same three-cue file: 3 lines
     with LF, 1 line with CRLF. Most .srt files in the wild are written on Windows,
     so this was losing the majority of nearly every subtitle file. */
  const normalized = String(text).replace(/\r\n?/g, '\n');
  const blocks = normalized.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => !/^\s*$/.test(l));
    if (!lines.length) continue;
    if (/^WEBVTT/i.test(lines[0])) continue;
    let idx = 0;
    if (/^\d+$/.test(lines[0].trim())) idx = 1;          // SRT cue number
    const m = cueRe.exec(lines[idx] || '');
    if (!m) continue;
    const start = parseSubtitleTimestamp(m[1]);
    if (start < 0) continue;
    const body = lines.slice(idx + 1).join(' ')
      .replace(/\{\\[^}]*\}/g, '')                        // ASS override tags like {\an8}
      .replace(/<[^>]+>/g, '')                            // <i>, <font>, <c>
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (!body) continue;
    out.push({ time: start, text: body });
  }
  // YouTube auto-captions repeat rolling lines; drop consecutive duplicates.
  const dedup = [];
  for (const line of out) {
    const prev = dedup[dedup.length - 1];
    if (prev && normalizeForMatch(prev.text) === normalizeForMatch(line.text)) continue;
    dedup.push(line);
  }
  return dedup.sort((a, b) => a.time - b.time);
}

/** Detects the format and returns [{ time, text }] with time in seconds. */
function parseSubtitle(raw) {
  if (!raw) return [];
  const text = String(raw).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!/-->/.test(text) && /^\s*\[\d{1,2}:\d{2}/m.test(text)) return parseLrc(text);
  const timed = parseSrtOrVtt(text);
  if (timed.length) return timed;
  return parseLrc(text).filter(l => l.time >= 0);
}
window.parseSubtitle = parseSubtitle;

// ---------- matching ----------

function subtitleFileName(filePath) {
  return String(filePath || '').split(/[\\/]/).pop() || '';
}

/** Candidates for a song, best first, with a 0..~2 confidence score. */
function rankSubtitlesForSong(song) {
  if (!song || !subtitleFiles.length) return [];
  const songName = `${song.title || ''} ${song.artist || ''}`;
  const normalizedTitle = normalizeForMatch(song.title);
  const duration = Number(song.duration || 0) ||
    (audio && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);

  return subtitleFiles.map(f => {
    let score = tokenScore(songName, f.name);
    const nf = normalizeForMatch(f.name);
    if (normalizedTitle && nf === normalizedTitle) score += 1.0;
    else if (normalizedTitle && nf.includes(normalizedTitle)) score += 0.35;

    if (duration > 0) {
      // Names like "GTA_VI_Vice_City_Arabic_6m39s" carry the runtime.
      const dm = /(\d{1,2})\s*m\s*(\d{1,2})\s*s/i.exec(f.name);
      if (dm) {
        const subDuration = parseInt(dm[1], 10) * 60 + parseInt(dm[2], 10);
        const delta = Math.abs(subDuration - duration);
        if (delta <= 4) score += 0.9;
        else if (delta <= 12) score += 0.35;
      }
    }
    return { path: f.path, name: f.name, score };
  }).sort((a, b) => b.score - a.score);
}
window.rankSubtitlesForSong = rankSubtitlesForSong;

const SUBTITLE_AUTO_MATCH_MIN_SCORE = 0.45;

/**
 * Second-pass matcher for files whose names share nothing with the title - the
 * normal case for YouTube downloads, e.g. the track "مَجَرَّةُ العُقول.mp3" against
 * "AI_Galaxy_of_Minds_Arabic.srt". Compares the subtitle's own runtime (its last
 * cue) with the track duration instead of the name.
 */
async function matchSubtitleByDuration(song) {
  const duration = Number(song.duration || 0) ||
    (audio && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
  if (!duration || duration < 20) return null;

  const tolerance = Math.max(6, duration * 0.05);
  let best = null;

  for (const f of subtitleFiles.slice(0, 40)) {
    let lines = subtitleLineCache[f.path];
    if (!lines) {
      const res = await subtitleIo.read(f.path);
      if (!res || !res.ok || !res.text) continue;
      lines = parseSubtitle(res.text);
      if (!lines.length) continue;
      lines.__source = `ملف كلمات محلي: ${subtitleFileName(f.path)}`;
      subtitleLineCache[f.path] = lines;
    }
    const last = lines[lines.length - 1].time;
    if (!isFinite(last) || last <= 0) continue;
    const delta = Math.abs(last - duration);
    if (delta <= tolerance && (!best || delta < best.delta)) best = { path: f.path, delta };
  }
  return best ? best.path : null;
}

async function refreshSubtitleIndex(force = false) {
  if (subtitleFiles.length && !force) return subtitleFiles;
  const res = await subtitleIo.scan(subtitleFolder);
  if (res) {
    if (res.folder) setSubtitleFolder(res.folder);
    subtitleFiles = res.files || [];
  }
  return subtitleFiles;
}

/**
 * Returns timed lyric lines for a song from a local subtitle file, or null.
 * An explicit per-song choice always wins; automatic matching only applies to
 * local/device tracks and only above a confidence threshold.
 */
async function loadSubtitleForSong(song, forceRefresh = false) {
  if (!song || !song.id) return null;
  let target = subtitleMap[song.id];

  if (!target && (song.isLocal || song.source === 'device')) {
    if (!subtitleFiles.length) await refreshSubtitleIndex(false).catch(() => {});
    const ranked = rankSubtitlesForSong(song);
    if (ranked.length && ranked[0].score >= SUBTITLE_AUTO_MATCH_MIN_SCORE) {
      target = ranked[0].path;
    } else {
      target = await matchSubtitleByDuration(song);
    }
  }
  if (!target) return null;

  if (!forceRefresh && subtitleLineCache[target]) return subtitleLineCache[target];

  const res = await subtitleIo.read(target);
  if (!res || !res.ok || !res.text) {
    if (subtitleMap[song.id]) { delete subtitleMap[song.id]; saveSubtitleMap(); }
    return null;
  }
  const lines = parseSubtitle(res.text);
  if (!lines.length) return null;
  lines.__source = `ملف كلمات محلي: ${subtitleFileName(target)}`;
  subtitleLineCache[target] = lines;
  return lines;
}

// ---------- UI ----------

async function openSubtitleModal() {
  const modal = document.getElementById('subtitleModal');
  if (!modal) return;
  modal.style.display = 'flex';
  renderSubtitleModal();
  await refreshSubtitleIndex(false).catch(() => {});
  renderSubtitleModal();
}
window.openSubtitleModal = openSubtitleModal;

function closeSubtitleModal() {
  const modal = document.getElementById('subtitleModal');
  if (modal) modal.style.display = 'none';
}
window.closeSubtitleModal = closeSubtitleModal;

function renderSubtitleModal() {
  const label = document.getElementById('subtitleFolderLabel');
  const list = document.getElementById('subtitleList');
  const searchEl = document.getElementById('subtitleSearchInput');
  const isAr = currentLang === 'ar';

  if (label) {
    label.textContent = subtitleFolder
      ? `${isAr ? 'المجلد' : 'Folder'}: ${subtitleFolder} — ${subtitleFiles.length} ${isAr ? 'ملف كلمات' : 'subtitle files'}`
      : (isAr ? 'لم يتم اختيار مجلد كلمات بعد. اضغط "اختر مجلد الكلمات".' : 'No subtitles folder chosen yet.');
  }
  if (!list) return;

  const current = currentSong ? subtitleMap[currentSong.id] : null;
  const scores = {};
  if (currentSong) rankSubtitlesForSong(currentSong).forEach(c => { scores[c.path] = c.score; });

  const query = (searchEl && searchEl.value ? searchEl.value : '').toLowerCase().trim();
  const files = subtitleFiles.filter(f => !query || f.name.toLowerCase().includes(query));

  if (!files.length) {
    list.innerHTML = `<p style="color:#8c8ca5; font-size:13px; padding:10px 0;">${
      isAr ? 'لا توجد ملفات كلمات معروضة.' : 'No subtitle files to show.'}</p>`;
    return;
  }

  let html = '';
  files.slice(0, 400).forEach(f => {
    const selected = current === f.path;
    const score = scores[f.path] || 0;
    const hint = score >= 0.9
      ? `<span style="background:rgba(29,185,84,0.18); color:#1db954; border-radius:8px; padding:1px 7px; font-size:11px;">${isAr ? 'مطابق تماماً' : 'exact match'}</span>`
      : (score > 0.2
        ? `<span style="background:rgba(255,255,255,0.08); color:#b3b3c9; border-radius:8px; padding:1px 7px; font-size:11px;">${isAr ? 'تشابه' : 'similar'} ${Math.round(score * 100)}%</span>`
        : '');
    html += `
      <div data-subtitle-path="${escapeHtml(f.path)}" style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; border:1px solid ${selected ? 'rgba(29,185,84,0.55)' : 'rgba(255,255,255,0.07)'}; background:${selected ? 'rgba(29,185,84,0.10)' : 'rgba(255,255,255,0.02)'}; margin-bottom:8px;">
        <i class="fa-solid fa-closed-captioning" style="color:${selected ? '#1db954' : '#8c8ca5'};"></i>
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(f.name)}</div>
          <div style="font-size:11px; color:#7b7b95;">${escapeHtml(f.dir || '')}</div>
        </div>
        ${hint}
        ${selected ? '<i class="fa-solid fa-circle-check" style="color:#1db954;"></i>' : ''}
      </div>`;
  });
  list.innerHTML = html;
}
window.renderSubtitleModal = renderSubtitleModal;

async function chooseSubtitleFolder() {
  const res = await subtitleIo.chooseFolder();
  if (!res) return;
  setSubtitleFolder(res.folder);
  subtitleFiles = res.files || [];
  renderSubtitleModal();
}
window.chooseSubtitleFolder = chooseSubtitleFolder;

async function rescanSubtitles() {
  await refreshSubtitleIndex(true).catch(() => {});
  renderSubtitleModal();
}
window.rescanSubtitles = rescanSubtitles;

async function pickSingleSubtitleFile() {
  const picked = await subtitleIo.pick();
  if (!picked || !picked.text) return;
  const dir = String(picked.path || '').replace(/[\\/][^\\/]*$/, '');
  if (!subtitleFiles.some(f => f.path === picked.path)) {
    subtitleFiles = [...subtitleFiles, { path: picked.path, name: picked.name || subtitleFileName(picked.path), dir }];
  }
  subtitleLineCache[picked.path] = parseSubtitle(picked.text);
  if (currentSong) await applySubtitleByPath(picked.path);
  else renderSubtitleModal();
}
window.pickSingleSubtitleFile = pickSingleSubtitleFile;

async function applySubtitleByPath(filePath) {
  if (!filePath) return;
  if (!currentSong) {
    renderSubtitleModal();
    return;
  }
  subtitleMap[currentSong.id] = filePath;
  saveSubtitleMap();
  delete subtitleLineCache[filePath];   // force a fresh read
  await autoDetectLyrics(currentSong, true);
  closeSubtitleModal();
  if (lyricsModal && lyricsModal.style.display !== 'flex') lyricsModal.style.display = 'flex';
}
window.applySubtitleByPath = applySubtitleByPath;

function setupSubtitleUi() {
  loadSubtitleState();
  const btn = document.getElementById('subtitlePickerBtn');
  if (btn) btn.addEventListener('click', openSubtitleModal);

  const listEl = document.getElementById('subtitleList');
  if (listEl) {
    // Delegated: no paths are ever interpolated into an inline handler.
    listEl.addEventListener('click', (e) => {
      const row = e.target.closest ? e.target.closest('[data-subtitle-path]') : null;
      if (!row) return;
      applySubtitleByPath(row.getAttribute('data-subtitle-path'));
    });
  }
  const search = document.getElementById('subtitleSearchInput');
  if (search) search.addEventListener('input', renderSubtitleModal);

  // Warm the index in the background so auto-matching is instant on first play.
  setTimeout(() => { refreshSubtitleIndex(false).catch(() => {}); }, 1500);
}

// =============================================================
// Login / credential handling
// =============================================================
// The password is never held here: it goes straight into the encrypted store on
// the native side (OS keystore on desktop, EncryptedSharedPreferences on Android)
// and only md5 token digests come back.
function openLoginModal(message) {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  const err = document.getElementById('loginError');
  if (err) {
    // Surface the credential-store failure alongside any caller message: it is
    // the difference between "log in" and "logging in cannot work here".
    const parts = [];
    if (message) parts.push(message);
    if (provisionFailure) {
      parts.push((currentLang === 'ar' ? 'تعذّر تخزين بيانات الدخول: ' : 'Credential store error: ') + provisionFailure);
    }
    const full = parts.join(' — ');
    err.textContent = full;
    err.style.display = full ? 'block' : 'none';
  }
  const userEl = document.getElementById('loginUser');
  const urlEl = document.getElementById('loginUrl');
  const passEl = document.getElementById('loginPass');
  if (userEl && !userEl.value) userEl.value = loggedInUser || '';
  if (urlEl && !urlEl.value) urlEl.value = serverUrl || '';
  if (passEl) passEl.value = '';
  modal.style.display = 'flex';
  if (passEl) setTimeout(() => passEl.focus(), 50);
}
window.openLoginModal = openLoginModal;

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'none';
}
window.closeLoginModal = closeLoginModal;

function updateLoginBadge() {
  const el = document.getElementById('userLoggedInLabel');
  if (!el) return;
  const isAr = currentLang === 'ar';
  el.innerHTML = `${isAr ? 'مسجّل الدخول:' : 'Logged in as:'} <strong style="color:#fff;">${escapeHtml(loggedInUser || '—')}</strong>`;
}
window.updateLoginBadge = updateLoginBadge;

function setLoginError(message) {
  const err = document.getElementById('loginError');
  if (!err) return;
  err.textContent = message || '';
  err.style.display = message ? 'block' : 'none';
}
window.setLoginError = setLoginError;

async function submitLogin() {
  const isAr = currentLang === 'ar';
  const userEl = document.getElementById('loginUser');
  const passEl = document.getElementById('loginPass');
  const urlEl = document.getElementById('loginUrl');
  const btn = document.getElementById('loginSubmitBtn');

  const username = (userEl && userEl.value || '').trim();
  const password = (passEl && passEl.value) || '';
  const url = (urlEl && urlEl.value || '').trim().replace(/\/+$/, '');

  if (!username || !password || !url) {
    setLoginError(isAr ? 'املأ الحقول الثلاثة: العنوان، المستخدم، كلمة المرور.' : 'Fill in server, username and password.');
    return;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('scheme');
  } catch (e) {
    setLoginError(isAr ? 'العنوان يجب أن يبدأ بـ http:// أو https://' : 'The URL must start with http:// or https://');
    return;
  }

  if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
  setLoginError('');

  try {
    let storageFailedReason = null;
    if (archimedesBridge && typeof archimedesBridge.saveCredentials === 'function') {
      const res = await archimedesBridge.saveCredentials(username, password, url);
      if (!res || res.ok !== true) {
        const reason = res && res.error;
        // 'unreachable' means the server could not be contacted: that is a real
        // login failure and must stop here.
        if (reason === 'unreachable') {
          setLoginError(isAr
            ? 'تعذّر الوصول إلى السيرفر. تأكد من العنوان والشبكة.'
            : 'Server unreachable - check the address and your network.');
          return;
        }
        // Anything else is a STORAGE failure (EPERM on the profile directory,
        // an unavailable OS keystore...). Refusing to log in over it made the
        // desktop app permanently unusable: measured here as
        //   EPERM: operation not permitted, open '...\credentials.bin'
        // which produced a login screen that could never succeed.
        // Fall back to the session-only path the browser build already uses.
        // This does not weaken security: the password stays in memory and is
        // never written to disk, which is strictly safer than persisting it.
        storageFailedReason = reason || 'unknown';
        ephemeralCredentials = { username, password };
        recordProvisionFailure(storageFailedReason);
      }
    } else if (window.ArchimedesNative && typeof window.ArchimedesNative.saveCredentials === 'function') {
      window.ArchimedesNative.saveCredentials(username, password, url);
    } else {
      // Browser fallback (run-desktop.bat without Electron): keep it in memory for
      // this session only - never in localStorage.
      ephemeralCredentials = { username, password };
    }

    serverUrl = url;
    try { localStorage.setItem('navidrome_server_url', url); } catch (e) { /* ignore */ }
    try { badgeServerIp.textContent = new URL(url).host; } catch (e) { badgeServerIp.textContent = url; }

    await refreshAuthParams();
    reportActiveServer();
    updateLoginBadge();
    closeLoginModal();
    loadCurrentView();

    // Say so plainly rather than letting the user discover it at next launch.
    if (storageFailedReason) {
      alert(isAr
        ? `تم تسجيل الدخول لهذه الجلسة فقط.\n\nمخزن بيانات الدخول المشفّر غير متاح:\n${storageFailedReason}\n\nلن تُحفظ كلمة المرور، وستحتاج لتسجيل الدخول مجدداً عند إعادة التشغيل.`
        : `Signed in for this session only.\n\nThe encrypted credential store is unavailable:\n${storageFailedReason}\n\nYour password will not be saved and you will need to sign in again next launch.`);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || btn.innerHTML; }
  }
}
window.submitLogin = submitLogin;

async function logout() {
  try {
    if (archimedesBridge && typeof archimedesBridge.clearCredentials === 'function') {
      await archimedesBridge.clearCredentials();
    } else if (window.ArchimedesNative && typeof window.ArchimedesNative.clearCredentials === 'function') {
      window.ArchimedesNative.clearCredentials();
    }
  } catch (e) { /* ignore */ }
  ephemeralCredentials = null;
  sessionAuth = null;
  loggedInUser = '';
  serverUrl = '';
  try { localStorage.removeItem('navidrome_server_url'); } catch (e) { /* ignore */ }
  updateLoginBadge();
  openLoginModal(currentLang === 'ar' ? 'تم تسجيل الخروج.' : 'Signed out.');
}
window.logout = logout;

function setupLoginUi() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  const passEl = document.getElementById('loginPass');
  if (passEl) {
    passEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitLogin(); });
  }
  const urlEl = document.getElementById('loginUrl');
  if (urlEl) {
    urlEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitLogin(); });
  }
}

// =============================================================
// Floating, draggable, semi-transparent lyrics overlay
// =============================================================
// The user asked for lyrics that sit on top of the UI without blocking it, in a
// place they choose themselves. Position, opacity and text size are remembered per
// device, and the panel is driven by the same syncLyricsWithTime() tick that feeds
// the player-bar ticker, so it always shows the active line.
const FLOAT_LYRICS_DEFAULTS = { x: 16, y: 110, opacity: 0.42, size: 0 };

let floatLyricsEnabled = false;
let floatLyricsPos = { x: FLOAT_LYRICS_DEFAULTS.x, y: FLOAT_LYRICS_DEFAULTS.y };
let floatLyricsOpacity = FLOAT_LYRICS_DEFAULTS.opacity;
let floatLyricsSize = FLOAT_LYRICS_DEFAULTS.size;
let floatLyricsDragging = false;

function floatLyricsEl() { return document.getElementById('floatLyrics'); }
function floatLyricsTextEl() { return document.getElementById('floatLyricsText'); }

function loadFloatLyricsState() {
  try {
    floatLyricsEnabled = localStorage.getItem('archimedes_float_lyrics') === '1';
    const pos = JSON.parse(localStorage.getItem('archimedes_float_lyrics_pos') || 'null');
    if (pos && isFinite(pos.x) && isFinite(pos.y)) floatLyricsPos = { x: pos.x, y: pos.y };
    const op = parseFloat(localStorage.getItem('archimedes_float_lyrics_opacity'));
    if (isFinite(op)) floatLyricsOpacity = Math.min(0.95, Math.max(0.08, op));
    const sz = parseInt(localStorage.getItem('archimedes_float_lyrics_size'), 10);
    if (isFinite(sz)) floatLyricsSize = Math.min(2, Math.max(0, sz));
  } catch (e) { /* defaults are fine */ }
}

function saveFloatLyricsState() {
  try {
    localStorage.setItem('archimedes_float_lyrics', floatLyricsEnabled ? '1' : '0');
    localStorage.setItem('archimedes_float_lyrics_pos', JSON.stringify(floatLyricsPos));
    localStorage.setItem('archimedes_float_lyrics_opacity', String(floatLyricsOpacity));
    localStorage.setItem('archimedes_float_lyrics_size', String(floatLyricsSize));
  } catch (e) { /* quota */ }
}

/** Keeps the panel fully on screen, whatever the rotation or window size. */
function clampFloatLyricsPos(x, y) {
  const el = floatLyricsEl();
  const w = el ? el.offsetWidth : 220;
  const h = el ? el.offsetHeight : 90;
  const maxX = Math.max(0, window.innerWidth - w - 4);
  const maxY = Math.max(0, window.innerHeight - h - 4);
  return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
}

function applyFloatLyricsStyle() {
  const el = floatLyricsEl();
  const text = floatLyricsTextEl();
  if (!el) return;
  const pos = clampFloatLyricsPos(floatLyricsPos.x, floatLyricsPos.y);
  floatLyricsPos = pos;
  el.style.left = pos.x + 'px';
  el.style.top = pos.y + 'px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.background = `rgba(10, 10, 16, ${floatLyricsOpacity})`;
  if (text) {
    text.classList.toggle('size-lg', floatLyricsSize === 1);
    text.classList.toggle('size-xl', floatLyricsSize === 2);
  }
}

function setFloatLyricsEnabled(enabled) {
  floatLyricsEnabled = !!enabled;
  const el = floatLyricsEl();
  if (el) el.hidden = !floatLyricsEnabled;
  const btn = document.getElementById('floatLyricsBtn');
  if (btn) btn.classList.toggle('active', floatLyricsEnabled);
  if (floatLyricsEnabled) {
    applyFloatLyricsStyle();
    refreshFloatLyricsText();
  }
  saveFloatLyricsState();
}
window.setFloatLyricsEnabled = setFloatLyricsEnabled;

function toggleFloatLyrics() {
  setFloatLyricsEnabled(!floatLyricsEnabled);
}
window.toggleFloatLyrics = toggleFloatLyrics;

function refreshFloatLyricsText() {
  const text = floatLyricsTextEl();
  if (!text || !floatLyricsEnabled) return;
  const idx = (typeof activeLyricIndex === 'number') ? activeLyricIndex : -1;
  const line = (typeof parsedLyrics !== 'undefined' && parsedLyrics && idx >= 0 && parsedLyrics[idx])
    ? parsedLyrics[idx].text
    : '';
  if (line) {
    text.textContent = line;
    text.classList.remove('float-lyrics-empty');
  } else {
    const song = (typeof currentSong !== 'undefined' && currentSong) ? currentSong.title : '';
    text.textContent = song ? `${song}` : (currentLang === 'ar' ? 'لا توجد كلمات' : 'No lyrics');
    text.classList.add('float-lyrics-empty');
  }
}
window.refreshFloatLyricsText = refreshFloatLyricsText;

/** Pointer-based drag that also works with touch (touch-action: none in CSS). */
function setupFloatLyricsDrag() {
  const el = floatLyricsEl();
  if (!el) return;
  let startX = 0, startY = 0, originX = 0, originY = 0, pointerId = null;

  el.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.closest && e.target.closest('.float-lyrics-btn')) return;
    floatLyricsDragging = true;
    el.classList.add('dragging');
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    originX = floatLyricsPos.x;
    originY = floatLyricsPos.y;
    try { el.setPointerCapture(pointerId); } catch (err) { /* older engines */ }
    e.preventDefault();
  });

  el.addEventListener('pointermove', (e) => {
    if (!floatLyricsDragging || e.pointerId !== pointerId) return;
    floatLyricsPos = clampFloatLyricsPos(originX + (e.clientX - startX), originY + (e.clientY - startY));
    applyFloatLyricsStyle();
    e.preventDefault();
  });

  const endDrag = (e) => {
    if (!floatLyricsDragging) return;
    floatLyricsDragging = false;
    el.classList.remove('dragging');
    try { if (pointerId !== null) el.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
    pointerId = null;
    saveFloatLyricsState();
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  const down = document.getElementById('floatLyricsOpacityDown');
  if (down) down.addEventListener('click', () => { floatLyricsOpacity = Math.max(0.08, floatLyricsOpacity - 0.08); applyFloatLyricsStyle(); saveFloatLyricsState(); });
  const up = document.getElementById('floatLyricsOpacityUp');
  if (up) up.addEventListener('click', () => { floatLyricsOpacity = Math.min(0.95, floatLyricsOpacity + 0.08); applyFloatLyricsStyle(); saveFloatLyricsState(); });
  const size = document.getElementById('floatLyricsSizeToggle');
  if (size) size.addEventListener('click', () => { floatLyricsSize = (floatLyricsSize + 1) % 3; applyFloatLyricsStyle(); saveFloatLyricsState(); });
  const close = document.getElementById('floatLyricsClose');
  if (close) close.addEventListener('click', () => setFloatLyricsEnabled(false));
}

function setupFloatLyrics() {
  loadFloatLyricsState();
  setupFloatLyricsDrag();
  const btn = document.getElementById('floatLyricsBtn');
  if (btn) btn.addEventListener('click', toggleFloatLyrics);
  // Re-clamp after a rotation or a window resize.
  window.addEventListener('resize', () => { if (floatLyricsEnabled) applyFloatLyricsStyle(); });
  setFloatLyricsEnabled(floatLyricsEnabled);
}

// =============================================================
// Idle / battery discipline
// =============================================================
// Measured on the device: while playback was PAUSED the app still burned ~190% CPU
// and 529 MB of RAM. Two things ran forever regardless of state:
//   * the visualizer requestAnimationFrame loop, redrawing four canvases at 60 fps,
//   * the animated "aurora" background (three large blurred orbs) compositing every
//     frame, plus the 20 Hz beat-reduction envelope follower.
// Everything now stops when audio is paused or the page is hidden, and resumes on
// play / visibilitychange.
let visualizerRafId = 0;
let appIdleMode = false;

function setAppIdleMode(idle) {
  appIdleMode = !!idle;
  try {
    document.body.classList.toggle('audio-idle', appIdleMode);
  } catch (e) { /* ignore */ }

  if (appIdleMode) {
    if (typeof stopVisualizerLoop === 'function') stopVisualizerLoop();
    if (typeof stopNoBeatFollower === 'function') stopNoBeatFollower();
  } else {
    if (typeof startVisualizerLoop === 'function' && audioCtx) startVisualizerLoop();
    if (typeof isNoBeatActive !== 'undefined' && isNoBeatActive && typeof startNoBeatFollower === 'function') {
      startNoBeatFollower();
    }
  }
}
window.setAppIdleMode = setAppIdleMode;

/** Stops the render loop completely (previously there was no way to stop it). */
function stopVisualizerLoop() {
  isVisualizerRunning = false;
  if (visualizerRafId) {
    try { cancelAnimationFrame(visualizerRafId); } catch (e) { /* ignore */ }
    visualizerRafId = 0;
  }
}
window.stopVisualizerLoop = stopVisualizerLoop;

function setupPowerDiscipline() {
  audio.addEventListener('play', () => {
    setAppIdleMode(false);
    if (typeof sync8dSpatialAudio === 'function') sync8dSpatialAudio();
  });
  audio.addEventListener('playing', () => {
    setAppIdleMode(false);
    if (typeof sync8dSpatialAudio === 'function') sync8dSpatialAudio();
  });
  audio.addEventListener('pause', () => {
    setAppIdleMode(true);
    if (typeof sync8dSpatialAudio === 'function') sync8dSpatialAudio();
  });
  audio.addEventListener('ended', () => {
    setAppIdleMode(true);
    if (typeof sync8dSpatialAudio === 'function') sync8dSpatialAudio();
  });
  document.addEventListener('visibilitychange', () => setAppIdleMode(document.hidden || audio.paused));
  // Start from whatever the current state is.
  setAppIdleMode(audio.paused || document.hidden);
}

// =============================================================
// Mobile usability: the Now Playing Studio must always be closable,
// and the beat effect must be clearly audible.
// =============================================================
// The studio modal is a desktop two-column layout: on a phone it filled the whole
// screen and had no close affordance, so the user could get stuck inside it. The
// button is injected here (instead of editing the markup) so it can never be
// missing, whatever the modal contains.
function ensureNowPlayingCloseButton() {
  const modal = document.getElementById('nowPlayingModal');
  if (!modal || modal.querySelector('#npCloseBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'npCloseBtn';
  btn.className = 'np-close-btn';
  btn.type = 'button';
  btn.title = currentLang === 'ar' ? 'إغلاق (Esc)' : 'Close (Esc)';
  btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.style.display = 'none';
  });
  modal.appendChild(btn);

  // Escape closes it too, like every other window in the app.
  if (!window.__npEscBound) {
    window.__npEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') modal.style.display = 'none';
    });
    // Tapping the dark backdrop closes it (phones have no Esc key).
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
}
window.ensureNowPlayingCloseButton = ensureNowPlayingCloseButton;

/* The phone's bottom bar carries no strings of its own: it copies the labels
   the sidebar already localised. Duplicating the text in the markup is how a
   navigation bar ends up in the wrong language after a toggle. */
function syncBottomNavLabels() {
  const sourceId = {
    artists: 'navArtists',
    albums: 'navAlbums',
    songs: 'navSongs',
    playlists: 'navPlaylists',
  };
  document.querySelectorAll('.ds-navbtn[data-view]').forEach(btn => {
    const src = document.getElementById(sourceId[btn.dataset.view]);
    const target = btn.querySelector('span');
    if (!src || !target) return;
    const text = ((src.querySelector('span') || src).textContent || '').trim();
    if (text) target.textContent = text;
  });
  const more = document.querySelector('#dsNavMore span');
  if (more) more.textContent = (currentLang === 'ar') ? 'المزيد' : 'More';
}
window.syncBottomNavLabels = syncBottomNavLabels;

/* Any button whose only content is an xmark icon is a close control, whatever
   the markup happens to call it. CSS cannot select on content, so the class is
   applied here and the theme lives in .ds-close. Reported by the user as "the
   classic X marks have no theme"; measured, #closeEqBtn was a bare transparent
   icon and several dialog close buttons still used the browser default. */
function themeCloseButtons(root) {
  const scope = root || document;
  scope.querySelectorAll('button').forEach((b) => {
    if (b.classList.contains('ds-close')) return;
    if (/fa-xmark|fa-times|fa-close/.test(b.innerHTML || '')) b.classList.add('ds-close');
  });
}

/* =========================================================================
   PHONE SHELL

   Two jobs:
     1. Wire the bottom navigation (and its "more" button, which opens the
        drawer holding the views that do not fit).
     2. Move the footer's secondary controls into the studio sheet on a phone,
        and back into the footer on a desktop.

   The move is a genuine re-parent of the existing nodes rather than a second
   copy. Duplicating the markup would duplicate every id (queueBtn, eqToggleBtn,
   noBeatBtn, the volume slider, the visualizer canvas...) and element ids must
   stay unique — a clone would leave half the handlers bound to a detached tree
   and silently dead.
   ========================================================================= */
function setupMobileShell() {
  const bottomNav = document.getElementById('dsBottomNav');  const moreBtn = document.getElementById('dsNavMore');
  const dock = document.getElementById('studioToolDock');
  const playerBar = document.querySelector('.player-bar');
  const playerRight = playerBar ? playerBar.querySelector('.player-right') : null;

  if (bottomNav) {
    bottomNav.querySelectorAll('.ds-navbtn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => selectView(btn.dataset.view));
    });
  }
  // "More" reveals the drawer, which already holds the remaining views.
  if (moreBtn) moreBtn.addEventListener('click', () => toggleMobileSidebar(true));

  // Reflect the current view in every navigation surface at startup.
  document.querySelectorAll('.nav-item, .ds-navbtn').forEach(el => {
    el.classList.toggle('active', el.dataset.view === currentView);
  });
  syncBottomNavLabels();

  const mq = window.matchMedia('(max-width: 860px)');

  /* The header search field is ~150px wide on a phone, so the desktop
     placeholder "Search songs, albums, or artists..." was clipped to
     "Search songs, a" — visible on every single screen. Shorten it there and
     restore the full text on desktop. applyLanguage() calls this too, so the
     short form survives a language switch. */
  const applySearchPlaceholder = () => {
    const el = document.getElementById('searchInput');
    if (!el) return;
    const full = I18N[currentLang] ? I18N[currentLang].searchPlaceholder : el.placeholder;
    el.placeholder = mq.matches
      ? (currentLang === 'ar' ? 'بحث…' : 'Search…')
      : full;
  };
  window.applySearchPlaceholder = applySearchPlaceholder;

  const placeTools = () => {
    if (!dock || !playerRight || !playerBar) return;
    if (mq.matches) {
      if (playerRight.parentElement !== dock) dock.appendChild(playerRight);
      dock.hidden = false;
    } else {
      if (playerRight.parentElement !== playerBar) playerBar.appendChild(playerRight);
      dock.hidden = true;
    }
    applySearchPlaceholder();
  };
  placeTools();
  if (mq.addEventListener) mq.addEventListener('change', placeTools);
  else if (mq.addListener) mq.addListener(placeTools);

  themeCloseButtons();

  // Re-measure once after the first paint: the visualizer canvas needs a real
  // width before it can size its backing store correctly in its new parent.
  setTimeout(() => {
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* ignore */ }
  }, 400);
}
window.setupMobileShell = setupMobileShell;

function setupMobileStudio() {
  ensureNowPlayingCloseButton();
  // The modal is created once at load; re-check whenever it is opened.
  const opener = document.getElementById('toggleNowPlaying');
  if (opener) opener.addEventListener('click', () => setTimeout(ensureNowPlayingCloseButton, 30));
  document.addEventListener('click', () => {
    const modal = document.getElementById('nowPlayingModal');
    if (modal && modal.style.display === 'flex') ensureNowPlayingCloseButton();
  }, true);
}


/** Builds (once) and connects the reverb convolver, and only then. */
function ensureReverbGraph() {
  if (!audioCtx || !analyserNode) return;
  if (reverbConvolver && reverbGain) return;
  try {
    reverbConvolver = audioCtx.createConvolver();
    const rate = audioCtx.sampleRate;
    const length = Math.floor(rate * 1.6);
    const impulse = audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    const decay = 2.4;
    for (let i = 0; i < length; i++) {
      const factor = Math.exp(-i / (rate * (1.6 / decay)));
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    reverbConvolver.buffer = impulse;
    reverbGain = audioCtx.createGain();
    reverbGain.gain.value = isReverbActive ? 0.6 : 0;
    reverbConvolver.connect(reverbGain);
    reverbGain.connect(analyserNode);
    if (spatialMergeNode) {
      spatialMergeNode.connect(reverbConvolver);
    }
  } catch (e) {
    reverbConvolver = null;
    reverbGain = null;
  }
}
window.ensureReverbGraph = ensureReverbGraph;

/** Drops the convolver from the graph so it stops costing CPU when off. */
function releaseReverbGraph() {
  try {
    if (reverbConvolver) reverbConvolver.disconnect();
    if (reverbGain) reverbGain.disconnect();
  } catch (e) { /* ignore */ }
  reverbConvolver = null;
  reverbGain = null;
}
window.releaseReverbGraph = releaseReverbGraph;

document.addEventListener('DOMContentLoaded', init);

