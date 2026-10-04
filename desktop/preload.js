'use strict';
/**
 * Preload bridge.
 *
 * The renderer runs with contextIsolation + sandbox enabled and no Node
 * integration, so this file is the ONLY channel between the page and the main
 * process. Every entry below is a narrow, named operation - the page can never
 * pass an arbitrary channel name, an arbitrary path or a shell command.
 */
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

/* The origin the main process serves this page from (http://127.0.0.1:<port>).
   Passed as a launch argument rather than over IPC so the renderer can read it
   synchronously, before it builds any YouTube embed URL. Empty when the loopback
   server could not start, in which case the page is on file:// and the YouTube
   layer is told there is no usable origin instead of inventing one. */
const APP_ORIGIN = (() => {
  try {
    const arg = (process.argv || []).find((a) => a.startsWith('--app-origin='));
    return arg ? arg.slice('--app-origin='.length) : '';
  } catch (e) { return ''; }
})();

contextBridge.exposeInMainWorld('archimedes', {
  // --- platform identity ---------------------------------------------------
  platform: 'electron',
  appOrigin: () => APP_ORIGIN,
  // --- Subsonic API -------------------------------------------------------
  // The main process owns the credentials and injects the token auth, so the
  // password is never present in the page.
  api: (endpoint, params) => invoke('subsonic-request', endpoint, params),
  authParams: () => invoke('auth-params'),
  // Reports the active server to main, so the CORS header hook that Web Audio
  // depends on keeps working even when the credential store is empty.
  setActiveServer: (url) => invoke('set-active-server', url),

  // --- Downloads ----------------------------------------------------------
  // The page cannot touch the filesystem; the main process owns the save dialog,
  // the credentials and the file write. Only the track id, its display name and
  // an optional pre-chosen folder cross the boundary.
  downloadTrack: (opts) => invoke('download-track', opts),
  chooseDownloadDirectory: () => invoke('choose-download-directory'),
  onDownloadProgress: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },

  // --- Credentials (encrypted with the OS keystore) -----------------------
  credentialsStatus: () => invoke('credentials-status'),
  saveCredentials: (username, password, serverUrl) =>
    invoke('credentials-save', username, password, serverUrl),
  clearCredentials: () => invoke('credentials-clear'),
  // First-run seeding of the built-in server (see main.js; deleted before publish).
  provisionDefaults: () => invoke('provision-defaults'),

  // --- Local subtitle lyrics ---------------------------------------------
  subtitleScan: (root) => invoke('subtitle-scan', root),
  subtitleRead: (filePath) => invoke('subtitle-read', filePath),
  subtitleChooseFolder: () => invoke('subtitle-choose-folder'),
  subtitlePick: () => invoke('subtitle-pick'),

  // --- Local music --------------------------------------------------------
  scanLocalMusic: (dirs) => invoke('scan-local-music', dirs),
  pickLocalFolder: () => invoke('pick-local-folder'),
  openItemInFolder: (filePath) => invoke('open-item-in-folder', filePath),
  // Moves a scanned local audio file to the OS trash (allow-listed paths only).
  deleteLocalFile: (filePath) => invoke('delete-local-file', filePath),

  // --- Lyrics persistence -------------------------------------------------
  lyricsSave: (songId, text) => invoke('lyrics-save', songId, text),
  lyricsRead: (songId) => invoke('lyrics-read', songId),
  lyricsList: () => invoke('lyrics-list'),

  // --- Server-side deletion (validated in the main process) ---------------
  deleteServerFile: (relPath, base) => invoke('delete-server-file', relPath, base),
  deleteServerFolder: (folderName, base) => invoke('delete-server-folder', folderName, base),

  // --- Window controls ----------------------------------------------------
  toggleMiniMode: (enable) => invoke('toggle-mini-mode', enable),
  toggleFullscreen: () => invoke('toggle-fullscreen'),
  getWindowState: () => invoke('get-window-state'),
  settingsGet: () => invoke('settings-get'),

  // --- Misc ---------------------------------------------------------------
  validateYouTube: (videoId) => invoke('yt-validate', videoId),
  downloadYouTubeAudio: (opts) => invoke('download-youtube-audio', opts),
  onYouTubeDownloadProgress: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('youtube-download-progress', listener);
    return () => ipcRenderer.removeListener('youtube-download-progress', listener);
  },
  openExternal: (url) => invoke('open-external-url', url),

  // Allow-listed HTTPS JSON GET (lrclib.net, youtube.com oEmbed) for the lyrics
  // chain, which can no longer fetch cross-origin from a file:// page.
  httpGetJson: (url) => invoke('http-get-json', url)
});
