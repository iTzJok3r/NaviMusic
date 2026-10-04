# Archimedes Music — Navidrome / Subsonic client

An **Arabic-first** music player for a self-hosted **Navidrome / Subsonic** server, shipped as two
apps that share **one web UI** (`desktop/renderer.js` + `desktop/renderer.html` + three CSS layers):

| Target | Shell | Source |
| :--- | :--- | :--- |
| **Windows / macOS / Linux** | Electron 33 | `desktop/main.js`, `desktop/preload.js` |
| **Android** | `WebView` shell loading the same HTML/JS/CSS from assets | `android/app/src/main/java/com/itzjok3r/archimedes/MainActivity.java` |

> **Note on `lib/` (Flutter/Dart):** that tree is a **legacy skeleton**. It has no Android host,
> no iOS host (only `ios/Runner/Info.plist`), no desktop host, and was never built or shipped —
> the shipped APKs/EXEs contain zero Dart code. It is kept for reference only. The `ios/`
> directory cannot be built in any form.

---

## Features

- Browse artists / albums / playlists, search the library, play, shuffle, repeat, gapless preload.
- Local ("Device") music: recursive scan of your own folders, plus Android `MediaStore` scan.
- **Local subtitle lyrics (SRT / VTT / LRC)** for local tracks, with a manual picker and
  automatic matching by filename or by runtime (see below).
- Online lyrics fallback: Navidrome tags → LRCLIB (exact + fuzzy) with karaoke auto-sync.
- Studio FX: 10-band EQ, bass boost, reverb, 8D (panner + Haas delay), playback speed.
- **Percussion reduction ("إزالة الإيقاع")** — see the section below; it is dynamic multi-band
  attenuation, not source separation.
- Embedded YouTube player with per-video validation (see below), queue drawer, sleep timer,
  mini-player, background playback with a 3-action notification, media keys, EN/AR with RTL.

## Percussion reduction ("No Beat")

Described accurately: **dynamic multi-band percussion reduction using Web Audio DSP.** It is
*not* drum-stem separation and it does not remove drums completely — snare and cymbal overlap
the vocal range and no filter can separate them.

The dry signal is always the primary signal at unity gain. Three bands sit **in the signal path**
and rest at **0 dB** (a peaking filter and a high shelf at 0 dB are perfectly flat), dipping only
for the length of a detected percussion transient:

```
input ─┬────────────────────────────────────────────► dry (unity)
       ├─ kickTap(LP120)  → analyser      [detect kick]
       ├─ midBand(BP2800) → analyser      [detect snare / clap]
       ├─ highBand(BP8000)→ analyser      [detect hi-hat / cymbal]
       └─► kickDuck(90Hz) ► midDuck(3kHz) ► highDuck(7kHz) ► merge
```

Each band tracks its own slow average and reacts to the **ratio** of the current level to that
average. A drum hit spikes; a held vocal, a pad or a bass note does not. A sustain counter backs
the attenuation off to a fifth once a band has stayed hot for ~0.9 s, so a sustained note is
never treated as percussion.

**Measured on device** (same track, same timestamps, band-pass taps at the merge point): average
band reduction of about **−3 to −4 dB**, **−5.5 dB** on transients in the mid band, with the
envelope at exactly **0** on sustained material. At idle every gain returns to 0 dB, so switching
the effect off leaves the track untouched.

**Not implemented:** stereo-correlation vocal confidence, and any form of AI/ML source
separation. Real-time stem separation was evaluated and rejected: the models are 80–150 MB plus
PyTorch or TensorFlow, run slower than real time on CPU, and are impractical on a mid-range
Android device.

## Local subtitle lyrics

Put your `.srt` / `.lrc` / `.vtt` files in a folder, then:

1. Open the lyrics panel → <kbd>CC</kbd> button, or **Settings → subtitles**.
2. Choose the subtitles folder (Windows/macOS/Linux) or import files one by one (Android, via
   the system file picker — no storage permission needed).
3. Matching order for each song: your explicit choice → filename similarity → **runtime match**
   (the subtitle's last timestamp vs the track duration). This is what maps
   `مَجَرَّةُ العُقول.mp3` to `AI_Galaxy_of_Minds_Arabic.srt`, whose names share nothing.

Line endings are normalised before parsing. Windows-style CRLF files previously lost every cue
except the first, because the cue separator is a blank line and `\n{2,}` does not match `\n\r\n`.

## YouTube player

Video IDs rot, and a dead ID makes YouTube render its empty "Video unavailable" shell, so every
ID is checked against YouTube's oEmbed endpoint before playback.

**A real origin is required.** When the UI was served from `file://` the page origin was opaque
and the embed failed with error 153. Electron now serves the UI over a loopback HTTP server and
Android uses `WebViewAssetLoader`, so both platforms send a genuine origin. Note that the bare
IP literal `127.0.0.1` produced error 150 while `localhost` works — keep `localhost`.

## Credentials

**There are no credentials in this repository.** The first-run provisioning defaults that used to
be hardcoded in `desktop/main.js` and its `MainActivity.java` twin — a base64 username, server URL
and password — were removed before the repository was published. Base64 was obfuscation, not
secrecy: anyone with the source or the binary could decode it.

Those particular values also turned out to be **stale**, and the current server rejects them
(verified: the host pings and Navidrome answers, but the login fails). The running app had worked
only because the real password was typed into the login screen once and stored encrypted in the OS
keystore and in `EncryptedSharedPreferences` — not because of this block. Removing it therefore
cost no functionality: log in once manually and the credentials are stored encrypted as before.

First-run provisioning still works, but it reads an untracked local file instead of constants:

| Platform | File | Read from |
| :--- | :--- | :--- |
| Desktop | `defaults.local.json` | the project root (excluded by `.gitignore`) |
| Android | `provision.local.properties` | the app's private `files/` directory, pushed over adb |

Without that file, first run simply shows the login screen — nothing else changes.

Everything else about credential handling does hold:

- **Desktop:** the login screen hands the password to the main process, which encrypts it with
  the OS keystore (`safeStorage` → DPAPI on Windows, Keychain on macOS, libsecret on Linux,
  `credentials.bin`, mode 0600). All API calls are proxied by the main process; only
  `md5(password + salt)` digests ever reach the renderer.
- **Android:** `EncryptedSharedPreferences` (AES-256-GCM master key). `getAuthParams()` returns
  the digests computed natively — there is no method that returns the password.
- Passwords are never written to `localStorage` and never logged.

## Security model (renderer)

`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`, a
Content-Security-Policy, denied permission requests, `setWindowOpenHandler` that only forwards
`http(s)` to the browser, and a narrow preload API (`desktop/preload.js`) instead of raw IPC.
Filesystem access from the page is limited to folders the user granted through a native dialog
(`desktop/config-store.js`), and server-side deletion validates every path component — the old
recursive-basename search and the `ssh ... "rm -rf ..."` fallback are gone. Subtitle reads reject
path traversal, and the YouTube download IPC enforces an https-only host allow-list.

**Known gaps, stated as to-dos rather than as done:**

- `script-src` still needs `'unsafe-inline'` because ~56 places build markup with inline
  `onclick` attributes; converting them to delegated listeners is the last step before that can
  be removed.
- **13 of 19 `innerHTML` sites have not been audited.** The six that were checked are static
  strings; anything interpolating server data must pass through `escapeHtml`.
- `diagnoseConnection` accepts an arbitrary host and port by design; restricting it would defeat
  its purpose. Low severity, noted rather than changed.

## Build / run

```powershell
# Desktop (Windows) — dev
.\run-desktop.bat

# Desktop — portable build (close Archimedes/electron/7za first)
cd desktop; npx electron-builder --win portable

# Android: copy the shared web UI into the WebView assets first, every time
powershell -ExecutionPolicy Bypass -File .\sync-android-assets.ps1
.\android\gradlew.bat --project-dir android assembleDebug
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

# Always syntax-check the shared renderer before packaging
node --check desktop\renderer.js
```

`sync-android-assets.ps1` copies `renderer.html → index.html`, `renderer.js`, the CSS layers,
`youtube-embed.js` and `icon.png` into `android/app/src/main/assets/`. The Android APK will run
**stale UI** if you forget it.

The shipped `Archimedes-Music.apk` is a **debug** build (package `com.itzjok3r.archimedes.debug`,
`android:debuggable=true`). Sign a release build before distributing it.

> **Emulator caveat:** the Android emulator image cannot decode MP3
> (`MEDIA_ELEMENT_ERROR: Format error`) while WAV plays fine — verified by comparison, so it is an
> image limitation, not an app bug. Test audio on a real device.

## Layout

```
desktop/            Electron app (the real product)
  main.js           window, hardened IPC, API proxy, loopback UI server, folder allow-lists
  preload.js        the only bridge exposed to the page
  secure-store.js   OS-keystore-encrypted credentials
  config-store.js   granted folders / settings
  renderer.{js,html}, design-system.css, styles.css, shell.css   shared UI (also used by Android)
  youtube-embed.js  shared embed layer, kept outside #contentArea so renders do not wipe it
android/            WebView shell + native bridge (credentials, MediaStore, SAF subtitles)
lib/, ios/, test/   legacy Flutter skeleton (unbuilt; see the note above)
```

CSS load order matters: `design-system.css` → `styles.css` → `shell.css`.

## Documentation

- **`ARCHIMEDES-MUSIC-PROJECT.md`** — full project description: architecture, measured feature
  status, security review, build, and the root cause of every defect fixed.
- **`ANTIGRAVITY-HANDOFF.md`** — remaining tasks, measurement methodology, and the rules for
  working on this codebase.

## Status

Built and verified on a real Android 12 device (`M2010J19SC`, arm64-v8a) and on Windows. Verified
working: transport, seek, volume and mute, shuffle, repeat, gapless preload, the full DSP chain
(equalizer, bass boost, reverb, 8D, percussion reduction), synchronised and scrolling lyrics in
four subtitle formats, local MediaStore discovery and playback, offline downloads, background
playback with its notification, and the YouTube embed.
