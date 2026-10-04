'use strict';
/**
 * Persistent, main-process-owned settings for the desktop app.
 *
 * Everything the renderer is allowed to touch lives in here. In particular the
 * folder allow-list: reading arbitrary files is never exposed to the renderer,
 * a path is only readable after the user has picked its folder through a native
 * dialog (or picked the file itself). That keeps a renderer-side XSS from turning
 * into an arbitrary file-read primitive.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULTS = {
  subtitleRoots: [],        // folders the user explicitly granted for .srt/.lrc/.vtt
  activeSubtitleRoot: null, // which of those is currently scanned
  musicRoots: []            // extra local-music folders the user added
};

let cache = null;

function settingsPath() {
  return path.join(app.getPath('userData'), 'archimedes-settings.json');
}

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    cache = { ...DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch (e) {
    cache = { ...DEFAULTS };
  }
  if (!Array.isArray(cache.subtitleRoots)) cache.subtitleRoots = [];
  if (!Array.isArray(cache.musicRoots)) cache.musicRoots = [];
  return cache;
}

function save() {
  try {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(load(), null, 2), 'utf8');
    return true;
  } catch (e) {
    console.warn('[settings] save failed:', e.message);
    return false;
  }
}

function get() {
  return { ...load() };
}

function set(patch) {
  cache = { ...load(), ...(patch || {}) };
  save();
  return get();
}

function addRoot(kind, dir) {
  const key = kind === 'music' ? 'musicRoots' : 'subtitleRoots';
  const s = load();
  const abs = path.resolve(dir);
  const list = Array.isArray(s[key]) ? s[key].slice() : [];
  if (!list.some(d => path.resolve(d) === abs)) list.push(abs);
  const patch = { [key]: list };
  if (key === 'subtitleRoots') patch.activeSubtitleRoot = abs;
  return set(patch);
}

/** True when `target` is the root itself or lives underneath it. */
function isInside(target, root) {
  try {
    const t = path.resolve(target);
    const r = path.resolve(root);
    if (t === r) return true;
    return t.startsWith(r.endsWith(path.sep) ? r : r + path.sep);
  } catch (e) {
    return false;
  }
}

function isInsideAnyRoot(target, roots) {
  return (roots || []).some(r => isInside(target, r));
}

/** Guard for every renderer-supplied path: extension + allow-listed folder. */
const SUBTITLE_EXTS = new Set(['.srt', '.lrc', '.vtt', '.ass', '.ssa', '.txt']);
const AUDIO_EXTS = new Set(['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.aac', '.opus', '.wma', '.mp4', '.webm']);

function validateSubtitlePath(target) {
  if (!target || typeof target !== 'string') return null;
  const abs = path.resolve(target);
  if (!SUBTITLE_EXTS.has(path.extname(abs).toLowerCase())) return null;
  const s = load();
  if (!isInsideAnyRoot(abs, s.subtitleRoots)) return null;
  return abs;
}

function validateAudioPath(target) {
  if (!target || typeof target !== 'string') return null;
  const abs = path.resolve(target);
  if (!AUDIO_EXTS.has(path.extname(abs).toLowerCase())) return null;
  const s = load();
  const roots = [...s.musicRoots, ...s.subtitleRoots];
  if (!isInsideAnyRoot(abs, roots)) return null;
  return abs;
}

module.exports = {
  get,
  set,
  addRoot,
  isInsideAnyRoot,
  validateSubtitlePath,
  validateAudioPath,
  SUBTITLE_EXTS,
  AUDIO_EXTS
};
