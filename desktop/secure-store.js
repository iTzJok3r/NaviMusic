'use strict';
/**
 * Encrypted credential storage for the desktop app.
 *
 * The Navidrome password never reaches the renderer and is never written in
 * plaintext: Electron's safeStorage encrypts it with the OS keystore (DPAPI on
 * Windows, Keychain on macOS, libsecret on Linux) and only the ciphertext is
 * written to disk. If the OS keystore is unavailable we refuse to persist rather
 * than silently falling back to plaintext.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app, safeStorage } = require('electron');

const FILE_VERSION = 1;

function storePath() {
  return path.join(app.getPath('userData'), 'credentials.bin');
}

function canPersist() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch (e) {
    return false;
  }
}

function emptyCredentials() {
  return { username: '', password: '', serverUrl: '' };
}

/** { username, password, serverUrl } or empty strings. */
function getCredentials() {
  try {
    const raw = fs.readFileSync(storePath());
    const payload = JSON.parse(raw.toString('utf8'));
    if (!payload || payload.version !== FILE_VERSION || !payload.data) return emptyCredentials();
    const json = safeStorage.decryptString(Buffer.from(payload.data, 'base64'));
    const parsed = JSON.parse(json);
    return {
      username: parsed.username || '',
      password: parsed.password || '',
      serverUrl: parsed.serverUrl || ''
    };
  } catch (e) {
    return emptyCredentials();
  }
}

function hasCredentials() {
  const c = getCredentials();
  return !!(c.username && c.password && c.serverUrl);
}

function saveCredentials(username, password, serverUrl) {
  if (!canPersist()) {
    return { ok: false, error: 'os-keystore-unavailable' };
  }
  try {
    const json = JSON.stringify({
      username: String(username || ''),
      password: String(password || ''),
      serverUrl: String(serverUrl || '')
    });
    const encrypted = safeStorage.encryptString(json).toString('base64');
    const payload = JSON.stringify({ version: FILE_VERSION, data: encrypted });
    fs.mkdirSync(path.dirname(storePath()), { recursive: true });
    fs.writeFileSync(storePath(), payload, { encoding: 'utf8', mode: 0o600 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function clearCredentials() {
  try {
    fs.rmSync(storePath(), { force: true });
    return true;
  } catch (e) {
    return false;
  }
}

const CLIENT_NAME = 'ArchimedesDesktop';
const API_VERSION = '1.16.1';

/**
 * Subsonic token auth parameters. The salt is regenerated per call and only the
 * md5(password + salt) digest leaves this module - the password itself never does.
 */
function authParams() {
  const { username, password } = getCredentials();
  if (!username || !password) return {};
  const salt = crypto.randomBytes(8).toString('hex').slice(0, 16);
  const token = crypto.createHash('md5').update(password + salt, 'utf8').digest('hex');
  return { u: username, t: token, s: salt, v: API_VERSION, c: CLIENT_NAME, f: 'json' };
}

/** Full request URL including auth, used by the main-process API call. */
function buildUrl(serverUrl, endpoint, extraParams) {
  const base = String(serverUrl || '').replace(/\/+$/, '');
  const params = new URLSearchParams({ ...authParams(), ...(extraParams || {}) });
  return `${base}/rest/${endpoint}?${params.toString()}`;
}

module.exports = {
  getCredentials,
  hasCredentials,
  saveCredentials,
  clearCredentials,
  authParams,
  buildUrl,
  canPersist
};
