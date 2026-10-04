const { app, BrowserWindow, ipcMain, dialog, shell, net, session } = require('electron');

// Startup failures used to be silent: the window simply never appeared. Surface
// them instead, both in a dialog and in a log file next to the user data.
function reportFatal(where, err) {
  const message = `${where}: ${(err && err.stack) || err}`;
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(app.getPath('userData'), 'startup-error.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  } catch (e) { /* logging is best effort */ }
  try { dialog.showErrorBox('Archimedes Music - startup error', message); } catch (e) { /* headless */ }
  console.error('[fatal]', message);
}

process.on('uncaughtException', (err) => reportFatal('uncaughtException', err));
process.on('unhandledRejection', (err) => reportFatal('unhandledRejection', err));

// Opt-in DevTools endpoint for automated UI checks. Off unless the environment
// variable is set by whoever starts the app (an attacker who can set its env
// already has code execution on this machine).
if (process.env.ARCHIMEDES_CDP_PORT) {
  app.commandLine.appendSwitch('remote-debugging-port', String(process.env.ARCHIMEDES_CDP_PORT));
}
const os = require('os');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { spawn } = require('child_process');
const readline = require('readline');

// Zero-Trust Local Network Guard for Desktop Client
function isLocalAddress(host) {
  if (!host) return false;
  const h = host.toLowerCase().split(':')[0];
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.local')) {
    return true;
  }
  // Check private RFC1918 ranges
  const parts = h.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
  }
  return false;
}

/* =============================================================================
   Loopback origin for the UI
   =============================================================================
   The window used to load the UI with loadFile(), i.e. from file://. A file://
   document has an OPAQUE origin, and that single fact is the root cause of
   YouTube Error 153 on Electron:

     - Chromium sends no HTTP Referer for requests originating from file://
     - there is no origin to declare to the embed, so the old shared code
       substituted origin=https://www.youtube.com — a value YouTube can see is
       false, because the embedding document's real origin is "null"
     - enablejsapi needs a matching http(s) origin for its postMessage handshake,
       so it could never work either

   Serving the same files from http://127.0.0.1:<port> gives the page a real,
   stable origin. The Referer is then genuine, origin= matches, and the official
   IFrame API works — which is also what makes 100/101/150/153 reportable at all.

   Security: bound to 127.0.0.1 only (never 0.0.0.0), an ephemeral port, and an
   explicit allow-list of UI files, so it is not a general-purpose file server.
   ============================================================================= */
const UI_FILES = new Set([
  'renderer.html', 'renderer.js', 'youtube-embed.js',
  'styles.css', 'design-system.css', 'shell.css', 'icon.png',
]);

let uiServer = null;
let uiOrigin = '';

function startUiServer() {
  return new Promise((resolve) => {
    try {
      uiServer = http.createServer((req, res) => {
        try {
          const raw = decodeURIComponent(String(req.url || '/').split('?')[0]);
          const name = raw.replace(/^\/+/, '') || 'renderer.html';
          if (!UI_FILES.has(name)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('not found');
            return;
          }
          const body = fs.readFileSync(path.join(__dirname, name));
          const type = name.endsWith('.css') ? 'text/css'
            : name.endsWith('.js') ? 'application/javascript'
              : name.endsWith('.png') ? 'image/png'
                : 'text/html';
          res.writeHead(200, {
            'Content-Type': type + '; charset=utf-8',
            'Cache-Control': 'no-store',
            // Same-origin only; nothing outside this page needs these files.
            'X-Content-Type-Options': 'nosniff',
          });
          res.end(body);
        } catch (e) {
          try { res.writeHead(500); res.end(); } catch (e2) { /* ignore */ }
        }
      });
      uiServer.on('error', () => { uiOrigin = ''; resolve(''); });
      uiServer.listen(0, '127.0.0.1', () => {
        try {
          /* The page is ADDRESSED by name, not by the bare loopback literal.

             Measured with a single-variable trial (same Electron, same Chromium,
             same CSP, same embed URL, same playerVars, same client identity, only
             the host changed):

               http://127.0.0.1:<port>   -> YouTube error 150, player title generic
               https://127.0.0.1:<port>  -> YouTube error 150
               https://localhost:<port>  -> no error, real title, playback starts
               https://appassets.test:<port> -> no error, real title, playback starts

             YouTube refuses to initialise this video when the embedding origin and
             Referer are an IP literal, while accepting the identical embed served
             from a host name. Android never had the problem because its origin is a
             name (appassets.androidplatform.net). The listener is unchanged and
             still bound to loopback only; just the advertised origin differs. */
          uiOrigin = 'http://localhost:' + uiServer.address().port;
        } catch (e) { uiOrigin = ''; }
        resolve(uiOrigin);
      });
    } catch (e) {
      uiOrigin = '';
      resolve('');
    }
  });
}

function stopUiServer() {
  try { if (uiServer) uiServer.close(); } catch (e) { /* ignore */ }
  uiServer = null;
}

let mainWindow = null;
let savedBounds = null;

/* The server the renderer is currently talking to, reported over IPC. Needed
   because the encrypted credential store can be unwritable (see the CORS hook in
   app.whenReady), in which case the renderer still knows the URL but main does
   not. Empty until the renderer reports one. */
let activeServerUrl = '';

/** Only ever an http(s) origin; anything else is ignored. */
function sanitizeServerUrl(value) {
  try {
    const u = new URL(String(value || ''));
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return (u.protocol + '//' + u.host).replace(/\/+$/, '');
  } catch (e) {
    return '';
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, 'icon.png'),
    title: 'Archimedes Music - Navidrome Client',
    webPreferences: {
      // Hardened renderer: no Node inside the page, isolated context, sandbox on,
      // web security enabled. Everything the page needs goes through preload.js.
      // API traffic is proxied by the main process, which is what the old
      // `webSecurity: false` was papering over - at the cost of turning any XSS
      // into native code execution.
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      // Tell the renderer the origin it is actually served from, so the YouTube
      // layer never has to guess or invent one.
      additionalArguments: ['--app-origin=' + (uiOrigin || '')],
    },
  });

  // Only the local renderer may load; anything else is handed to the OS browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') shell.openExternal(parsed.toString());
    } catch (e) { /* ignore malformed */ }
    return { action: 'deny' };
  });

  // Block any navigation to external public sites (keeps UI safe inside app)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl);
      if (!isLocalAddress(parsed.hostname)) {
        console.warn(`[SECURITY BLOCKED] Disallowed public navigation: ${navigationUrl}`);
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // Load from the loopback origin when the server is up: a real http(s) origin
  // is what YouTube requires (see startUiServer). Falling back to loadFile keeps
  // the app usable even if the port could not be bound — YouTube then reports the
  // missing origin honestly instead of failing silently.
  if (uiOrigin) {
    mainWindow.loadURL(uiOrigin + '/renderer.html');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
  }
}

// IPC Handlers for Mini-Player & Fullscreen
ipcMain.handle('toggle-mini-mode', (event, enableMini) => {
  if (!mainWindow) return false;
  if (enableMini) {
    savedBounds = mainWindow.getBounds();
    mainWindow.setMinimumSize(320, 180);
    mainWindow.setBounds({ width: 380, height: 230 });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    return true;
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMinimumSize(900, 600);
    if (savedBounds) {
      mainWindow.setBounds(savedBounds);
    } else {
      mainWindow.setSize(1200, 800);
      mainWindow.center();
    }
    return false;
  }
});

ipcMain.handle('toggle-fullscreen', () => {
  if (!mainWindow) return false;
  const isFs = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(isFs);
  return isFs;
});

ipcMain.handle('get-window-state', () => {
  if (!mainWindow) return { isFullScreen: false, isAlwaysOnTop: false };
  return {
    isFullScreen: mainWindow.isFullScreen(),
    isAlwaysOnTop: mainWindow.isAlwaysOnTop(),
  };
});

// ---------------------------------------------------------------------------
// Server-side deletion
// ---------------------------------------------------------------------------
// These handlers used to accept a renderer-supplied base directory and then fall
// back to (a) a recursive basename search across the whole share and (b) an
// `ssh ... "rm -rf ..."` shell command. Combined with the renderer's XSS surface
// that was effectively a delete-anything-on-the-LAN primitive. The fallbacks are
// gone: deletion now happens only under a root the user actually granted, with
// every path component validated.

const DEFAULT_MUSIC_SHARE = '\\\\your-server.local\\Music1';

/** Only the built-in share, or a folder the user granted, can be a delete root. */
function resolveDeleteBase(customBase) {
  const base = String(customBase || DEFAULT_MUSIC_SHARE);
  if (base === DEFAULT_MUSIC_SHARE) return base;
  const store = require('./config-store');
  const settings = store.get();
  const roots = [...settings.musicRoots, ...settings.subtitleRoots];
  if (!store.isInsideAnyRoot(base, roots)) return null;
  return path.resolve(base);
}

/** Rejects traversal, drive letters, absolute paths and wildcard characters. */
function isSafeRelativePath(rel) {
  if (!rel || typeof rel !== 'string') return false;
  if (rel.includes('\0')) return false;
  if (/^[a-zA-Z]:/.test(rel)) return false;
  if (/^[\\/]/.test(rel)) return false;
  if (/[*?"<>|]/.test(rel)) return false;
  return !rel.split(/[\\/]/).some(part => part === '..' || part === '.');
}

/** Resolves `rel` under `baseDir` and refuses anything that escapes it. */
function safeResolveUnder(baseDir, rel) {
  try {
    const base = path.resolve(baseDir);
    const target = path.resolve(path.join(base, rel));
    if (target === base) return null;
    return target.startsWith(base.endsWith(path.sep) ? base : base + path.sep) ? target : null;
  } catch (e) {
    return null;
  }
}

function deletePath(target) {
  const stats = fs.statSync(target);
  if (stats.isDirectory()) fs.rmSync(target, { recursive: true, force: true });
  else fs.unlinkSync(target);
}

// Delete a single track from the configured music share.
ipcMain.handle('delete-server-file', async (event, relPath, customBase) => {
  if (!relPath) return false;
  const baseDir = resolveDeleteBase(customBase);
  if (!baseDir) {
    console.warn('[security] delete-server-file rejected an unregistered base directory');
    return false;
  }

  // Strip the Docker/Linux mount prefixes Navidrome reports.
  const sanitizedRel = String(relPath)
    .replace(/^\/data\/AppData\/Music1\/?/i, '')
    .replace(/^\/music\/?/i, '')
    .replace(/\//g, '\\');

  if (!isSafeRelativePath(sanitizedRel)) {
    console.warn('[security] delete-server-file rejected an unsafe relative path');
    return false;
  }

  const direct = safeResolveUnder(baseDir, sanitizedRel);
  if (!direct) return false;

  try {
    if (fs.existsSync(direct)) {
      deletePath(direct);
      return true;
    }
  } catch (err) {
    console.warn('Direct unlink failed:', err.message);
  }

  // Bounded fallback: one level deep, exact basename match only.
  try {
    const wanted = path.basename(sanitizedRel).toLowerCase();
    if (fs.existsSync(baseDir)) {
      for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
        if (entry.name.toLowerCase() !== wanted) continue;
        const full = safeResolveUnder(baseDir, entry.name);
        if (!full) continue;
        deletePath(full);
        return true;
      }
    }
  } catch (err) {
    console.warn('Fallback delete failed:', err.message);
  }

  return false;
});

// Delete a whole album/artist folder. Matching is exact on purpose: the previous
// substring match could delete a folder called "Rocky" when asked for "Rock".
ipcMain.handle('delete-server-folder', async (event, folderName, customBase) => {
  if (!folderName) return false;
  const baseDir = resolveDeleteBase(customBase);
  if (!baseDir) {
    console.warn('[security] delete-server-folder rejected an unregistered base directory');
    return false;
  }

  const name = String(folderName).trim();
  if (!isSafeRelativePath(name) || name.includes('\\') || name.includes('/')) {
    console.warn('[security] delete-server-folder rejected an unsafe folder name');
    return false;
  }

  const direct = safeResolveUnder(baseDir, name);
  if (!direct) return false;

  try {
    if (fs.existsSync(direct)) {
      deletePath(direct);
      return true;
    }
    const wanted = name.toLowerCase();
    if (fs.existsSync(baseDir)) {
      for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.toLowerCase() !== wanted) continue;
        const full = safeResolveUnder(baseDir, entry.name);
        if (!full) continue;
        fs.rmSync(full, { recursive: true, force: true });
        return true;
      }
    }
  } catch (err) {
    console.warn('Folder deletion error:', err.message);
  }

  return false;
});

// Supported Local Audio Formats
const AUDIO_EXTS = new Set(['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.aac', '.opus', '.wma']);

async function scanDirectoryRecursive(dirPath, maxDepth = 4, currentDepth = 0, results = []) {
  if (currentDepth > maxDepth || results.length >= 8000) return results;
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // ignore hidden folders like .git, .cache
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await scanDirectoryRecursive(fullPath, maxDepth, currentDepth + 1, results);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (AUDIO_EXTS.has(ext)) {
          try {
            const stats = await fs.promises.stat(fullPath);
            let rawName = path.basename(entry.name, ext);
            let artist = 'Local Artist';
            let title = rawName;
            let album = path.basename(dirPath);

            // Clean common patterns: "01 - Artist - Title" or "Artist - Title"
            if (rawName.includes(' - ')) {
              const parts = rawName.split(' - ');
              if (parts.length >= 2) {
                // Check if first part is a track number (e.g. "01")
                if (/^\d+$/.test(parts[0].trim()) && parts.length >= 3) {
                  artist = parts[1].trim();
                  title = parts.slice(2).join(' - ').trim();
                } else {
                  artist = parts[0].trim();
                  title = parts.slice(1).join(' - ').trim();
                }
              }
            }

            // Generate clean unique ID
            const id = 'local_' + Buffer.from(fullPath).toString('base64').replace(/=/g, '');
            const encodedFileUrl = 'file:///' + fullPath.replace(/\\/g, '/').replace(/#/g, '%23').replace(/\?/g, '%3F');

            results.push({
              id,
              title: title || rawName,
              artist: artist || 'Local Artist',
              album: album || 'Local Device',
              path: fullPath,
              url: encodedFileUrl,
              streamUrl: encodedFileUrl,
              size: stats.size,
              duration: 0,
              isLocal: true,
              source: 'device'
            });
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    // Permission denied or unreadable directory, skip silently
  }
  return results;
}

// Auto-Detect Local Music across standard directories & custom user paths
ipcMain.handle('scan-local-music', async (event, customDirs = []) => {
  const defaultDirs = [
    path.join(os.homedir(), 'Music'),
    path.join(os.homedir(), 'Downloads'),
    process.env.PUBLIC ? path.join(process.env.PUBLIC, 'Music') : null
  ].filter(Boolean);

  // Renderer-supplied folders are filtered through the allow-list: a directory is
  // only scanned after the user added it through the native folder picker.
  const stored = require('./config-store').get();
  const granted = (Array.isArray(customDirs) ? customDirs : [])
    .filter(d => typeof d === 'string' && require('./config-store').isInsideAnyRoot(d, stored.musicRoots));
  const scanDirs = Array.from(new Set([...defaultDirs, ...granted]));
  let allTracks = [];

  for (const dir of scanDirs) {
    try {
      if (fs.existsSync(dir)) {
        const tracks = await scanDirectoryRecursive(dir, 4);
        allTracks.push(...tracks);
      }
    } catch (e) {}
  }

  // Deduplicate by path
  const seen = new Set();
  const deduped = [];
  for (const t of allTracks) {
    if (!seen.has(t.path)) {
      seen.add(t.path);
      deduped.push(t);
    }
  }
  return deduped;
});

// Pick native folder on device
ipcMain.handle('pick-local-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Music Folder / اختر مجلد الموسيقى',
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) return null;
  require('./config-store').addRoot('music', result.filePaths[0]);
  return result.filePaths[0];
});

// Show file in Windows File Explorer
ipcMain.handle('open-item-in-folder', async (event, filePath) => {
  if (!filePath) return false;
  try {
    shell.showItemInFolder(filePath);
    return true;
  } catch (e) {
    return false;
  }
});

// Validate a YouTube video id through the public oEmbed endpoint (no API key).
// 200 => exists and embeddable, 401/403 => the owner disabled embedding,
// 404/400 => deleted, private or a malformed id. Done in the main process because
// the renderer's fetch() is subject to CORS and file:// has a null origin.
ipcMain.handle('yt-validate', async (event, videoId) => {
  const id = String(videoId || '');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return { ok: false, status: 400 };
  try {
    const target = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`;
    const res = await net.fetch(target, { method: 'GET' });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json().catch(() => ({}));
    return { ok: true, status: 200, title: data.title, author: data.author_name };
  } catch (err) {
    return { ok: false, status: 0, error: String((err && err.message) || err) };
  }
});

// Single funnel for handing a link to the OS browser. http(s) only, everything
// else (file:, javascript:, custom schemes) is refused.
ipcMain.handle('open-external-url', async (event, url) => {
  try {
    const parsed = new URL(String(url));
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    await shell.openExternal(parsed.toString());
    return true;
  } catch (e) {
    return false;
  }
});

// ---------------------------------------------------------------------------
// YouTube Audio Extraction & Download (yt-dlp + ffmpeg)
// ---------------------------------------------------------------------------
ipcMain.handle('download-youtube-audio', async (event, opts) => {
  const req = opts || {};
  let videoId = String(req.videoId || '').trim();
  let url = String(req.url || '').trim();
  if (!url && videoId) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return { ok: false, error: 'invalid-video-id' };
    url = `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (!url) return { ok: false, error: 'missing-url-or-id' };

  /* SECURITY: the URL used to be passed to the downloader completely unchecked, so
     anything running in the page could hand it any target at all — an internal
     address (SSRF against the LAN or a cloud metadata endpoint), a file:// path,
     or an unrelated site the downloader happens to support. The argument is passed
     as an array element so there was never shell injection, but "which host may be
     contacted" was unbounded. Only YouTube hosts are accepted now, and the value is
     rebuilt from the parsed URL so nothing smuggled into the string survives. */
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return { ok: false, error: 'invalid-url' };
  }
  if (parsedUrl.protocol !== 'https:') return { ok: false, error: 'https-only' };
  const host = parsedUrl.hostname.toLowerCase();
  const YT_HOSTS = new Set([
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
    'youtu.be', 'www.youtu.be',
  ]);
  if (!YT_HOSTS.has(host)) return { ok: false, error: 'host-not-allowed' };
  url = parsedUrl.toString();

  const destType = req.destination === 'cloud' ? 'cloud' : 'local';
  let targetDir = '';

  if (destType === 'cloud') {
    targetDir = req.targetDir ? String(req.targetDir).trim() : DEFAULT_MUSIC_SHARE;
    // Cloud target must be the default share or a validated base
    const base = resolveDeleteBase(targetDir);
    if (!base && targetDir !== DEFAULT_MUSIC_SHARE) {
      targetDir = DEFAULT_MUSIC_SHARE;
    }
    if (!fs.existsSync(targetDir)) {
      return { ok: false, error: 'cloud-share-unreachable', path: targetDir };
    }
  } else {
    // Local destination: restrict to default user music/downloads or granted roots
    const defaultLocalDirs = [
      app.getPath('music'),
      app.getPath('downloads'),
      path.join(os.homedir(), 'Music'),
      path.join(os.homedir(), 'Downloads'),
    ].filter(Boolean);
    const settings = settingsStore.get();
    const allowedRoots = [...defaultLocalDirs, ...settings.musicRoots];

    if (req.targetDir && typeof req.targetDir === 'string') {
      try {
        const candidate = path.resolve(req.targetDir);
        if (settingsStore.isInsideAnyRoot(candidate, allowedRoots) && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          targetDir = candidate;
        }
      } catch (e) {}
    }
    if (!targetDir) {
      targetDir = app.getPath('music') || path.join(os.homedir(), 'Music');
    }
  }

  const allowedFormats = new Set(['mp3', 'flac', 'm4a', 'opus', 'wav']);
  const format = allowedFormats.has(String(req.format).toLowerCase()) ? String(req.format).toLowerCase() : 'mp3';

  const allowedQualities = new Set(['320', '256', '192', '128', '0']);
  const quality = allowedQualities.has(String(req.quality)) ? String(req.quality) : '320';

  const allowedSampleRates = new Set(['48000', '44100', 'source', 'auto']);
  const sampleRate = allowedSampleRates.has(String(req.sampleRate)) ? String(req.sampleRate) : '48000';

  const pythonBin = process.env.PYTHON || 'python';
  let scriptPath = path.join(__dirname, 'yt-audio-downloader.py');
  if (scriptPath.includes('app.asar')) {
    const unpacked = scriptPath.replace('app.asar', 'app.asar.unpacked');
    if (fs.existsSync(unpacked)) {
      scriptPath = unpacked;
    } else {
      const cachedScript = path.join(app.getPath('userData'), 'yt-audio-downloader.py');
      try {
        const content = fs.readFileSync(path.join(__dirname, 'yt-audio-downloader.py'), 'utf8');
        fs.writeFileSync(cachedScript, content, 'utf8');
        scriptPath = cachedScript;
      } catch (e) {}
    }
  }

  const args = [
    scriptPath,
    '--url', url,
    '--dir', targetDir,
    '--format', format,
    '--quality', quality,
    '--sample-rate', sampleRate
  ];

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(pythonBin, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (spawnErr) {
      return resolve({ ok: false, error: spawnErr.message });
    }

    let lastResult = null;
    let errOutput = '';

    const rl = readline.createInterface({
      input: child.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.type === 'complete') {
            lastResult = parsed;
          }
          try {
            event.sender.send('youtube-download-progress', parsed);
          } catch (e) {}
        } catch (e) {}
      }
    });

    child.stderr.on('data', (data) => {
      errOutput += data.toString();
    });

    child.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    child.on('close', (code) => {
      if (code === 0 && lastResult) {
        // If saved to cloud Navidrome music folder, notify Subsonic to rescan
        if (destType === 'cloud') {
          try {
            const creds = secureStore.getCredentials();
            if (creds && creds.serverUrl) {
              const scanUrl = secureStore.buildUrl(creds.serverUrl, 'startScan.view', {});
              net.fetch(scanUrl, { method: 'GET' }).catch(() => {});
            }
          } catch (e) {}
        }
        resolve({
          ok: true,
          destination: destType,
          targetDir,
          data: lastResult
        });
      } else {
        const msg = (lastResult && lastResult.error) || errOutput.slice(0, 300) || `Process exited with code ${code}`;
        resolve({ ok: false, error: msg });
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Settings + local subtitle lyrics (.srt / .lrc / .vtt)
// ---------------------------------------------------------------------------
// Reading a file from the renderer is only possible after the user granted its
// folder through a native dialog; see config-store.js for the allow-list.
const settingsStore = require('./config-store');

function scanSubtitleFiles(root, maxDepth = 3, maxFiles = 3000) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > maxDepth || out.length >= maxFiles) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      if (out.length >= maxFiles) return;
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!settingsStore.SUBTITLE_EXTS.has(path.extname(entry.name).toLowerCase())) continue;
      let stat = null;
      try { stat = fs.statSync(full); } catch (e) { /* unreadable */ }
      out.push({
        path: full,
        name: entry.name,
        dir,
        size: stat ? stat.size : 0,
        mtime: stat ? stat.mtimeMs : 0
      });
    }
  };
  walk(root, 0);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

ipcMain.handle('settings-get', () => settingsStore.get());

ipcMain.handle('subtitle-choose-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر مجلد ملفات الكلمات (SRT / LRC) / Choose a subtitles folder',
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const folder = result.filePaths[0];
  settingsStore.addRoot('subtitle', folder);
  return { folder, files: scanSubtitleFiles(folder) };
});

ipcMain.handle('subtitle-scan', async (event, root) => {
  const s = settingsStore.get();
  const target = (root && settingsStore.isInsideAnyRoot(root, s.subtitleRoots))
    ? path.resolve(root)
    : s.activeSubtitleRoot;
  if (!target) return { folder: null, files: [] };
  if (!fs.existsSync(target)) return { folder: target, files: [], missing: true };
  return { folder: target, files: scanSubtitleFiles(target) };
});

ipcMain.handle('subtitle-read', async (event, filePath) => {
  const abs = settingsStore.validateSubtitlePath(filePath);
  if (!abs) return { ok: false, error: 'path-not-allowed' };
  try {
    const text = fs.readFileSync(abs, 'utf8').replace(/^\uFEFF/, '');
    return { ok: true, path: abs, name: path.basename(abs), text };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('subtitle-pick', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر ملف الكلمات / Choose a subtitle file',
    properties: ['openFile'],
    filters: [
      { name: 'Subtitles', extensions: ['srt', 'lrc', 'vtt', 'ass', 'ssa', 'txt'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const picked = result.filePaths[0];
  settingsStore.addRoot('subtitle', path.dirname(picked));
  const abs = settingsStore.validateSubtitlePath(picked);
  if (!abs) return null;
  try {
    const text = fs.readFileSync(abs, 'utf8').replace(/^\uFEFF/, '');
    return { path: abs, name: path.basename(abs), text };
  } catch (e) {
    return null;
  }
});

// ---------------------------------------------------------------------------
// Credentials + proxied Subsonic API
// ---------------------------------------------------------------------------
// The renderer never holds the password. It asks the main process to perform
// requests; the main process injects the Subsonic token auth from the encrypted
// store (see secure-store.js).
const secureStore = require('./secure-store');

const MAX_PARAM_COUNT = 24;

function sanitizeApiParams(params) {
  const out = {};
  if (!params || typeof params !== 'object') return out;
  let count = 0;
  for (const [key, value] of Object.entries(params)) {
    if (count++ >= MAX_PARAM_COUNT) break;
    if (!/^[A-Za-z0-9_]{1,32}$/.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') out[key] = value.slice(0, 512);
    else if (typeof value === 'number' || typeof value === 'boolean') out[key] = String(value);
  }
  return out;
}

ipcMain.handle('subsonic-request', async (event, endpoint, params) => {
  const creds = secureStore.getCredentials();
  if (!creds.username || !creds.password || !creds.serverUrl) {
    return { ok: false, error: 'not-configured' };
  }
  if (typeof endpoint !== 'string' || !/^[A-Za-z0-9_.]{1,48}\.view$/.test(endpoint)) {
    return { ok: false, error: 'bad-endpoint' };
  }
  try {
    const url = secureStore.buildUrl(creds.serverUrl, endpoint, sanitizeApiParams(params));
    const res = await net.fetch(url, { method: 'GET' });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: 'bad-json', status: res.status };
    }
    const sub = data['subsonic-response'];
    if (!sub) return { ok: false, error: 'bad-response', status: res.status };
    if (sub.status === 'failed') {
      return {
        ok: false,
        error: (sub.error && sub.error.message) || 'subsonic-failed',
        code: (sub.error && sub.error.code) || -1
      };
    }
    return { ok: true, data: sub };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

/* =============================================================================
   Download a track to disk
   =============================================================================
   Uses download.view, which returns the file EXACTLY as it sits on the server:
   a FLAC stays FLAC, an MP3 stays MP3, same sample rate, same bitrate. Nothing is
   re-encoded, so this is the highest quality that can exist for the track — the
   original. That is only true of the user's own library; a re-encoded stream from
   anywhere else would by definition be a lossy copy of a copy.

   The file is streamed rather than buffered, so a large lossless track costs no
   meaningful memory, and progress is reported to the renderer while it writes.
   The renderer cannot touch the filesystem itself; this stays in the main process
   where the credentials and the save dialog live.
   ============================================================================= */
ipcMain.handle('download-track', async (event, opts) => {
  const creds = secureStore.getCredentials();
  if (!creds.username || !creds.password || !creds.serverUrl) {
    return { ok: false, error: 'not-configured' };
  }

  const track = opts || {};
  const id = String(track.id || '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return { ok: false, error: 'bad-id' };

  // Keep the server's own file name; only strip characters a filesystem rejects.
  const wanted = String(track.name || 'track').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  const base = (wanted || 'track').slice(0, 120);
  const ext = (String(track.suffix || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)) || 'mp3';

  // If the renderer already asked for a destination folder, use it silently;
  // otherwise ask, defaulting to the user's Music folder.
  let target = '';
  if (typeof track.directory === 'string' && track.directory) {
    try {
      const stat = fs.statSync(track.directory);
      if (stat.isDirectory()) target = path.join(track.directory, base + '.' + ext);
    } catch (e) { /* fall through to the dialog */ }
  }
  if (!target) {
    const picked = await dialog.showSaveDialog(mainWindow, {
      title: 'Save track',
      defaultPath: path.join(app.getPath('music'), base + '.' + ext),
      filters: [{ name: 'Audio', extensions: [ext] }],
    });
    if (picked.canceled || !picked.filePath) return { ok: false, error: 'cancelled' };
    target = picked.filePath;
  }

  try {
    const url = secureStore.buildUrl(creds.serverUrl, 'download.view', { id });
    const res = await net.fetch(url, { method: 'GET' });
    if (!res.ok) return { ok: false, error: 'http-' + res.status };
    if (!res.body) return { ok: false, error: 'empty-body' };

    const total = Number(res.headers.get('content-length') || 0);
    let received = 0;
    let lastSent = 0;

    const source = Readable.fromWeb(res.body);
    source.on('data', (chunk) => {
      received += chunk.length;
      // Throttle to ~10 updates/second: enough for a smooth bar, cheap enough not
      // to flood IPC on a fast local network.
      const now = Date.now();
      if (now - lastSent < 100) return;
      lastSent = now;
      try { event.sender.send('download-progress', { id, received, total }); } catch (e) { /* window gone */ }
    });

    await pipeline(source, fs.createWriteStream(target));

    try { event.sender.send('download-progress', { id, received, total: total || received, done: true }); } catch (e) { /* ignore */ }
    return { ok: true, path: target, bytes: received };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

/* Where should downloads go by default? The renderer asks once so the user can
   pick a folder, and every later download goes there without a dialog. */
ipcMain.handle('choose-download-directory', async () => {
  const picked = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose download folder',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: app.getPath('music'),
  });
  if (picked.canceled || !picked.filePaths.length) return { ok: false, error: 'cancelled' };
  try {
    settingsStore.addRoot('music', picked.filePaths[0]);
  } catch (e) {}
  return { ok: true, directory: picked.filePaths[0] };
});

// Token parameters for media URLs (stream / cover art). Contains md5 digests only.
ipcMain.handle('auth-params', async () => {
  const creds = secureStore.getCredentials();
  if (!creds.username || !creds.password) return {};
  return secureStore.authParams();
});

/* The renderer reports which server it is using, so the CORS header hook keeps
   working even when the credential store is empty (session-only login). */
ipcMain.handle('set-active-server', async (_event, url) => {
  activeServerUrl = sanitizeServerUrl(url);
  return { ok: true, activeServerUrl };
});

ipcMain.handle('credentials-status', async () => {
  const creds = secureStore.getCredentials();
  return {
    configured: !!(creds.username && creds.password && creds.serverUrl),
    username: creds.username,
    serverUrl: creds.serverUrl,
    encryptedStorage: secureStore.canPersist()
  };
});

ipcMain.handle('credentials-save', async (event, username, password, serverUrl) => {
  const user = String(username || '').trim();
  const url = String(serverUrl || '').trim().replace(/\/+$/, '');
  const pass = String(password || '');
  if (!user || !pass || !url) return { ok: false, error: 'missing-fields' };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'bad-url' };
    }
  } catch (e) {
    return { ok: false, error: 'bad-url' };
  }

  // Verify before persisting so a typo cannot lock the app out.
  const probe = secureStore.buildUrl(url, 'ping.view', {});
  const previous = secureStore.getCredentials();
  const saved = secureStore.saveCredentials(user, pass, url);
  if (!saved.ok) return saved;
  try {
    const res = await net.fetch(probe, { method: 'GET' });
    const data = await res.json();
    const sub = data['subsonic-response'];
    if (!sub || sub.status !== 'ok') {
      if (previous.username) secureStore.saveCredentials(previous.username, previous.password, previous.serverUrl);
      else secureStore.clearCredentials();
      return { ok: false, error: (sub && sub.error && sub.error.message) || 'auth-failed' };
    }
  } catch (e) {
    if (previous.username) secureStore.saveCredentials(previous.username, previous.password, previous.serverUrl);
    else secureStore.clearCredentials();
    return { ok: false, error: 'unreachable' };
  }
  return { ok: true, username: user, serverUrl: url };
});

ipcMain.handle('credentials-clear', async () => ({ ok: secureStore.clearCredentials() }));

// ---------------------------------------------------------------------------
// Lyrics disk cache (replaces the renderer's require('fs') usage)
// ---------------------------------------------------------------------------
function lyricsDir() {
  return path.join(app.getPath('userData'), 'lyrics');
}

function safeSongId(songId) {
  const id = String(songId || '');
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null;
}

ipcMain.handle('lyrics-save', async (event, songId, text) => {
  const id = safeSongId(songId);
  if (!id || typeof text !== 'string') return false;
  try {
    fs.mkdirSync(lyricsDir(), { recursive: true });
    fs.writeFileSync(path.join(lyricsDir(), `${id}.lrc`), text.slice(0, 512 * 1024), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('lyrics-read', async (event, songId) => {
  const id = safeSongId(songId);
  if (!id) return null;
  try {
    return fs.readFileSync(path.join(lyricsDir(), `${id}.lrc`), 'utf8');
  } catch (e) {
    return null;
  }
});

ipcMain.handle('lyrics-list', async () => {
  try {
    return fs.readdirSync(lyricsDir()).filter(f => f.endsWith('.lrc'));
  } catch (e) {
    return [];
  }
});

// ---------------------------------------------------------------------------
// Allow-listed JSON GET proxy
// ---------------------------------------------------------------------------
// With webSecurity enabled the renderer can no longer make cross-origin fetches
// from a file:// page, so the few public endpoints the app uses go through here.
// Only these hosts are reachable, and only over HTTPS.
const JSON_PROXY_HOSTS = new Set(['lrclib.net', 'www.youtube.com', 'youtube.com']);

ipcMain.handle('http-get-json', async (event, url) => {
  let parsed;
  try {
    parsed = new URL(String(url));
  } catch (e) {
    return { ok: false, error: 'bad-url' };
  }
  if (parsed.protocol !== 'https:') return { ok: false, error: 'https-only' };
  if (!JSON_PROXY_HOSTS.has(parsed.hostname)) return { ok: false, error: 'host-not-allowed' };
  try {
    const res = await net.fetch(parsed.toString(), { method: 'GET' });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    return { ok: true, status: res.status, text: text.slice(0, 4 * 1024 * 1024) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------------------------------------------------------------------------
// First-run provisioning
// ---------------------------------------------------------------------------
// The user asked for a client that starts already signed in and never shows a
// login screen, while keeping the values encrypted and off the page.
//
// ===========================================================================
//  >>> DELETE THIS BLOCK (and its Android twin in MainActivity.java) BEFORE
//  >>> PUBLISHING TO GITHUB.  It is the only place a default credential exists.
// ===========================================================================
// The values are base64 so they are not plain-text greppable, which is obfuscation
// and NOT secrecy: anyone with the binary can decode them. They are only ever
// written into the OS-keystore-encrypted store (secure-store.js) and are never
// exposed to the renderer - it only ever sees md5 digests.
/* First-run provisioning reads an untracked local file.

   The username, password and server URL used to be hardcoded right here. Base64 is
   obfuscation and NOT secrecy - anyone with the source or the binary can decode it -
   so the values were removed before the repository was published. defaults.local.json
   is excluded by .gitignore. Without that file, first run simply shows the login
   screen and nothing else changes. */
function loadLocalDefaults() {
  try {
    const file = path.join(__dirname, '..', 'defaults.local.json');
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || !parsed.username || !parsed.password || !parsed.serverUrl) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function decodeDefault(value) {
  return Buffer.from(String(value || ''), 'base64').toString('utf8');
}

ipcMain.handle('provision-defaults', async () => {
  if (secureStore.hasCredentials()) return { ok: true, alreadyProvisioned: true };
  const d = loadLocalDefaults();
  if (!d) return { ok: false, error: 'no-defaults' };
  const username = d.username;
  const password = d.password;
  const serverUrl = d.serverUrl;
  const saved = secureStore.saveCredentials(username, password, serverUrl);
  return saved.ok ? { ok: true, provisioned: true } : saved;
});

// Move a local audio file to the OS trash. Only files inside a folder the app
// already scans (or one the user granted) can be touched, and only audio
// extensions - so this can never be used as a general file-deletion primitive.
ipcMain.handle('delete-local-file', async (event, filePath) => {
  if (!filePath || typeof filePath !== 'string') return { ok: false, error: 'bad-path' };
  let abs;
  try {
    abs = path.resolve(filePath);
  } catch (e) {
    return { ok: false, error: 'bad-path' };
  }

  const defaultDirs = [
    path.join(os.homedir(), 'Music'),
    path.join(os.homedir(), 'Downloads'),
    process.env.PUBLIC ? path.join(process.env.PUBLIC, 'Music') : null
  ].filter(Boolean);
  const settings = settingsStore.get();
  const allowedRoots = [...settings.musicRoots, ...defaultDirs];
  if (!settingsStore.isInsideAnyRoot(abs, allowedRoots)) {
    console.warn('[security] delete-local-file rejected a path outside the scanned folders');
    return { ok: false, error: 'not-allowed' };
  }
  const ext = path.extname(abs).toLowerCase();
  if (!settingsStore.AUDIO_EXTS.has(ext)) return { ok: false, error: 'not-audio' };

  try {
    await shell.trashItem(abs);   // Recycle Bin / Trash: recoverable, not unlink
    return { ok: true, path: abs };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(() => {
  // The renderer is a file:// document, so any media it routes through Web Audio
  // must be CORS-clean: without Access-Control-Allow-Origin, Chromium feeds the
  // audio graph pure silence ("MediaElementAudioSource outputs zeroes due to CORS
  // access restrictions") and the app plays nothing. Navidrome sends no CORS
  // headers, so add them for the configured server only.
  //
  // This USED to read the server URL only from the encrypted credential store.
  // On a machine where that store cannot be written (measured here as EPERM on
  // credentials.bin) it stays empty, so no header was injected — and the user is
  // then told "Audio effects need the stream to be served with CORS headers.
  // Playback works normally, but these effects are disabled." The whole effects
  // rack silently stops working.
  //
  // The renderer knows the server URL even when it is holding a session-only
  // credential, so it reports it here (IPC 'set-active-server') and that value is
  // used as well.
  try {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = Object.assign({}, details.responseHeaders);
      try {
        let base = activeServerUrl;
        if (!base) {
          const creds = secureStore.getCredentials();
          base = String(creds.serverUrl || '').replace(/\/+$/, '');
        }
        if (base && details.url.startsWith(base + '/')) {
          responseHeaders['Access-Control-Allow-Origin'] = ['*'];
          responseHeaders['Access-Control-Allow-Headers'] = ['*'];
          responseHeaders['Access-Control-Expose-Headers'] = ['*'];
        }
      } catch (e) { /* keep the original headers */ }
      callback({ responseHeaders });
    });
  } catch (e) {
    console.warn('[security] header hook setup failed:', e.message);
  }

  /* The YouTube Referer/Origin injection that used to live here has been REMOVED.

     It existed to compensate for the window loading the UI from file://, where
     Chromium sends no usable Referer. Now that the UI is served from the loopback
     origin (startUiServer below), the browser sends the correct Referer by itself
     — and the hook had become actively harmful: it overwrote that genuine value
     with `Referer: https://www.youtube.com/` and `Origin: https://www.youtube.com`,
     claiming the embed was hosted on YouTube itself. Measured on Windows with the
     hook in place, every video failed with code 152 (the same client-identification
     family as 153) while Android, which has no such hook, played normally.

     Two fixes for one problem were fighting each other. Letting the browser speak
     for itself is the correct behaviour; nothing here should rewrite YouTube's
     view of who is embedding. */

  // Bring up the loopback origin BEFORE the window: the renderer needs to know
  // the origin it is served from, and it arrives through additionalArguments.
  startUiServer().then((origin) => {
    if (origin) console.log('[ui] serving from ' + origin);
    else console.warn('[ui] loopback server unavailable; falling back to file:// (YouTube embed will report a missing origin)');
    createWindow();
  });
});

app.on('will-quit', () => { stopUiServer(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
