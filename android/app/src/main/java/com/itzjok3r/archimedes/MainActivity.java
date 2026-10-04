package com.itzjok3r.archimedes;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.ContentUris;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.cert.Certificate;
import java.util.HashMap;
import java.util.Map;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

public class MainActivity extends AppCompatActivity {

    /** JSONObject.put declares a checked JSONException; this cannot throw, so it
     *  is safe to call from inside catch blocks and from the JS bridge. */
    private static void putQuiet(JSONObject target, String key, Object value) {
        try { target.put(key, value); } catch (Exception ignored) { }
    }
    private static final int PERMISSION_REQ_CODE = 404;
    private static final int SUBTITLE_PICK_REQ_CODE = 405;
    private static final int NOTIFICATION_PERMISSION_REQ_CODE = 406;
    private static final int DELETE_REQ_CODE = 407;

    /** MediaStore id waiting on the system delete confirmation (-1 = none). */
    private long pendingDeleteAudioId = -1;
    private static final int MAX_SUBTITLE_BYTES = 2 * 1024 * 1024;

    /** Request code for Android's own "save as" dialog used by track downloads. */
    private static final int REQ_CREATE_DOCUMENT = 4711;

    /** Polled by JavaScript via getDownloadResult(); see startDownload in the bridge. */
    private volatile String downloadResult = "{\"state\":\"idle\"}";
    private volatile String pendingDownloadId = "";
    private volatile String pendingDownloadName = "";
    /** Held so onActivityResult can hand the chosen destination to the bridge. */
    private ArchimedesAndroidBridge nativeBridge = null;

    /** Origin the UI is served from (WebViewAssetLoader). Real https, on-device. */
    static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final String SUBTITLE_DIR_NAME = "subtitles";
    private static final String DEFAULT_SUBTITLE_NAME = "subtitle.srt";
    private static final String SECURE_PREFS_FILE = "archimedes_secure_credentials";
    private static final String PLAIN_PREFS_FILE = "archimedes_plain_credentials";
    private static final String KEY_USER = "user";
    private static final String KEY_PASS = "pass";
    private static final String KEY_URL = "url";
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // ------------------------------------------------------------------------
    // First-run default server, base64 encoded.
    // ========================================================================
    //  >>> DELETE THIS BLOCK (and its desktop twin in desktop/main.js) BEFORE
    //  >>> PUBLISHING TO GITHUB.  It is the only place a default credential
    //  >>> exists.  Base64 is obfuscation, NOT secrecy: it keeps the values out
    //  >>> of plain-text greps and out of the renderer, nothing more.
    // ========================================================================
    /**
     * First-run provisioning reads an untracked local file.
     *
     * The username, password and server URL used to be hardcoded here as base64
     * constants. Base64 is obfuscation and NOT secrecy - anyone with the source or the
     * APK can decode it - so the values were removed before the repository was
     * published. The file is read from the app's private files directory and is never
     * shipped inside the APK; without it, first run shows the login screen.
     *
     * Push it with:
     *   adb push provision.local.properties /data/local/tmp/
     *   adb shell run-as <pkg> cp /data/local/tmp/provision.local.properties files/
     *
     * @return {username, password, serverUrl} or null when the file is absent/incomplete.
     */
    private String[] loadLocalDefaults() {
        java.io.File file = new java.io.File(getFilesDir(), "provision.local.properties");
        if (!file.exists()) return null;
        try (java.io.FileInputStream in = new java.io.FileInputStream(file)) {
            java.util.Properties props = new java.util.Properties();
            props.load(in);
            String user = props.getProperty("username", "").trim();
            String pass = props.getProperty("password", "").trim();
            String url = props.getProperty("serverUrl", "").trim();
            if (user.isEmpty() || pass.isEmpty() || url.isEmpty()) return null;
            return new String[]{ user, pass, url };
        } catch (Exception e) {
            return null;
        }
    }

    private WebView webView;
    private SharedPreferences credentialPrefs;
    private boolean credentialPrefsResolved;

    /** Weak handle used by PlaybackService to reach the page for media buttons. */
    private static java.lang.ref.WeakReference<MainActivity> visibleInstance;

    public static MainActivity getVisibleInstance() {
        return visibleInstance == null ? null : visibleInstance.get();
    }

    /** Routes a notification / headset / Bluetooth media key into the WebView. */
    public void dispatchMediaButton(final String action) {
        final WebView view = webView;
        if (view == null || action == null) return;
        view.post(new Runnable() {
            @Override
            public void run() {
                String js = "if (typeof onMediaButton === 'function') onMediaButton(" + org.json.JSONObject.quote(action) + ");";
                view.evaluateJavascript(js, null);
            }
        });
    }

    public class ArchimedesAndroidBridge {
        /** Last connection-diagnostic result, written by a background thread. */
        private volatile String diagnosticResult = "{}";

        @JavascriptInterface
        public boolean isAndroid() {
            return true;
        }

        /**
         * The real origin this WebView serves the UI from.
         *
         * Reported so the shared YouTube layer never has to invent one: an
         * opaque origin (file://) is exactly what made YouTube answer Error 153,
         * and a made-up value makes it worse rather than better.
         */
        @JavascriptInterface
        public String getAppOrigin() {
            return APP_ORIGIN;
        }

        @JavascriptInterface
        public boolean hasPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED;
            } else {
                return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
            }
        }

        @JavascriptInterface
        public void requestPermission() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.READ_MEDIA_AUDIO}, PERMISSION_REQ_CODE);
                } else {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQ_CODE);
                }
            });
        }

        @JavascriptInterface
        public String scanLocalMusic() {
            JSONArray songList = new JSONArray();
            try {
                Uri uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                String[] projection = new String[]{
                        MediaStore.Audio.Media._ID,
                        MediaStore.Audio.Media.TITLE,
                        MediaStore.Audio.Media.ARTIST,
                        MediaStore.Audio.Media.ALBUM,
                        MediaStore.Audio.Media.DURATION,
                        MediaStore.Audio.Media.ALBUM_ID,
                        MediaStore.Audio.Media.SIZE,
                        MediaStore.Audio.Media.DATA
                };

                String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0";
                String sortOrder = MediaStore.Audio.Media.TITLE + " ASC";

                Cursor cursor = getContentResolver().query(uri, projection, selection, null, sortOrder);
                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                    int titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                    int artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                    int albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                    int durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                    int albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID);
                    int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                    int dataCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);

                    while (cursor.moveToNext()) {
                        long id = cursor.getLong(idCol);
                        String title = cursor.getString(titleCol);
                        String artist = cursor.getString(artistCol);
                        String album = cursor.getString(albumCol);
                        long durationMs = cursor.getLong(durationCol);
                        long albumId = cursor.getLong(albumIdCol);
                        long size = cursor.getLong(sizeCol);
                        String dataPath = cursor.getString(dataCol);

                        JSONObject songObj = new JSONObject();
                        songObj.put("id", "android_" + id);
                        songObj.put("audioId", id);
                        songObj.put("title", (title != null && !title.isEmpty()) ? title : "Unknown Track");
                        songObj.put("artist", (artist != null && !artist.isEmpty() && !artist.equalsIgnoreCase("<unknown>")) ? artist : "Unknown Artist");
                        songObj.put("album", (album != null && !album.isEmpty() && !album.equalsIgnoreCase("<unknown>")) ? album : "Local Device");
                        songObj.put("duration", Math.round(durationMs / 1000.0));
                        songObj.put("size", size);
                        songObj.put("path", dataPath != null ? dataPath : "");
                        songObj.put("url", "http://archimedes.local/audio/" + id);
                        songObj.put("streamUrl", "http://archimedes.local/audio/" + id);
                        if (albumId > 0) {
                            songObj.put("coverArt", "http://archimedes.local/art/" + albumId);
                        }
                        songObj.put("isLocal", true);
                        songObj.put("source", "device");

                        songList.put(songObj);
                    }
                    cursor.close();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return songList.toString();
        }

        /**
         * First-run seeding so the app starts already signed in and never shows a
         * login screen; the renderer only ever receives md5 digests afterwards.
         *
         * =====================================================================
         *  >>> DELETE THIS METHOD (and its desktop twin in desktop/main.js)
         *  >>> BEFORE PUBLISHING TO GITHUB.  It is the only place a default
         *  >>> credential exists.  The values are base64 so they are not
         *  >>> plain-text greppable, which is obfuscation and NOT secrecy.
         * =====================================================================
         */
        @JavascriptInterface
        public boolean provisionDefaults() {
            if (hasCredentials()) {
                return true;
            }
            try {
                String[] defaults = loadLocalDefaults();
                if (defaults == null) return false;
                writeCredential(KEY_USER, defaults[0]);
                writeCredential(KEY_PASS, defaults[1]);
                writeCredential(KEY_URL, defaults[2]);
                return hasCredentials();
            } catch (Exception e) {
                return false;
            }
        }

        /**
         * Starts (or refreshes) the foreground playback notification. Called from
         * the page whenever playback actually starts, so the process keeps running
         * while the app is in the background.
         */
        @JavascriptInterface
        public void startPlaybackService(String title, String artist, boolean playing) {
            try {
                PlaybackService.push(MainActivity.this, title, artist, playing);
            } catch (Exception e) {
                // A missing notification must never break playback.
            }
        }

        /** Updates the notification text/state without restarting the service. */
        @JavascriptInterface
        public void updateNowPlaying(String title, String artist, boolean playing) {
            startPlaybackService(title, artist, playing);
        }

        /** Removes the notification and stops the service. */
        @JavascriptInterface
        public void stopPlaybackService() {
            try {
                PlaybackService.dismiss(MainActivity.this);
            } catch (Exception e) {
                // ignore
            }
        }

        /**
         * Deletes a device track from the MediaStore (which removes the file).
         *
         * Returns "deleted" when the file is gone, "pending" when Android 11+ is
         * showing its own confirmation dialog (the answer arrives through
         * onLocalFileDeleted), or "failed".
         */
        @JavascriptInterface
        public String deleteLocalFile(String audioIdOrPath) {
            long audioId;
            try {
                audioId = Long.parseLong(String.valueOf(audioIdOrPath).replaceAll("[^0-9]", ""));
            } catch (Exception e) {
                audioId = -1;
            }
            if (audioId < 0) {
                return "failed";
            }

            Uri contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, audioId);
            pendingDeleteAudioId = audioId;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+ owns the confirmation UI for files the app does not own.
                try {
                    java.util.ArrayList<Uri> uris = new java.util.ArrayList<>();
                    uris.add(contentUri);
                    PendingIntent request = MediaStore.createDeleteRequest(getContentResolver(), uris);
                    startIntentSenderForResult(request.getIntentSender(), DELETE_REQ_CODE, null, 0, 0, 0);
                    return "pending";
                } catch (Exception e) {
                    pendingDeleteAudioId = -1;
                    return "failed";
                }
            }

            // Android 10 and below: a direct delete, granted at install time.
            try {
                int rows = getContentResolver().delete(contentUri, null, null);
                pendingDeleteAudioId = -1;
                return rows > 0 ? "deleted" : "failed";
            } catch (Exception e) {
                pendingDeleteAudioId = -1;
                return "failed";
            }
        }

        @JavascriptInterface
        public boolean hasCredentials() {
            return !readCredential(KEY_USER).isEmpty() && !readCredential(KEY_PASS).isEmpty();
        }

        @JavascriptInterface
        public void saveCredentials(String username, String password, String serverUrl) {
            writeCredential(KEY_USER, username);
            writeCredential(KEY_PASS, password);
            writeCredential(KEY_URL, serverUrl);
        }

        @JavascriptInterface
        public void clearCredentials() {
            clearStore(credentialPrefs());
            // Also drop the fallback file so a keystore that recovers later cannot resurrect old values.
            clearStore(getSharedPreferences(PLAIN_PREFS_FILE, MODE_PRIVATE));
        }

        @JavascriptInterface
        public String getUsername() {
            return readCredential(KEY_USER);
        }

        /**
         * Connection diagnostic.
         *
         * Written because "it only works on a VPN" has several very different
         * causes and guessing between them wastes everyone's time. This measures
         * each layer separately and returns raw evidence:
         *
         *   dnsSystem  what the device resolver says (this is what an ISP that
         *              filters DNS will lie about)
         *   dnsDoH     what Cloudflare's DNS-over-HTTPS says, fetched by IP so it
         *              cannot itself be resolved dishonestly
         *   tcp/tls/http  whether the address is actually reachable once known
         *
         * If dnsSystem fails or disagrees with dnsDoH but tcp/tls then succeed
         * against the DoH answer, the block is DNS-only and can be worked around
         * inside the app. If tcp fails even with a correct address, the address
         * itself is blocked and no client-side change can help.
         *
         * Runs on a BACKGROUND thread: the whole point is to sit on timeouts, and
         * blocking the WebView's JS thread would freeze the UI for up to half a
         * minute. JavaScript polls getDiagnosticResult() instead.
         */
        @JavascriptInterface
        public String diagnoseConnection(String urlString) {
            diagnosticResult = "{\"running\":true}";
            final String target = urlString;
            new Thread(() -> { diagnosticResult = runDiagnostics(target); }).start();
            return "started";
        }

        @JavascriptInterface
        public String getDiagnosticResult() {
            return diagnosticResult;
        }

        private String runDiagnostics(String urlString) {
            JSONObject r = new JSONObject();
            String host = "";
            int port = 443;
            boolean https = true;
            try {
                URL u = new URL(urlString);
                host = u.getHost();
                https = "https".equalsIgnoreCase(u.getProtocol());
                port = u.getPort() > 0 ? u.getPort() : (https ? 443 : 80);
                putQuiet(r, "url", urlString);
                putQuiet(r, "host", host);
                putQuiet(r, "port", port);
            } catch (Exception e) {
                try { putQuiet(r, "error", "bad-url: " + e.getMessage()); } catch (Exception ignored) {}
                return r.toString();
            }

            long t0 = System.currentTimeMillis();

            // 1. The device resolver.
            String systemIp = "";
            try {
                InetAddress[] all = InetAddress.getAllByName(host);
                JSONArray arr = new JSONArray();
                for (InetAddress a : all) arr.put(a.getHostAddress());
                putQuiet(r, "dnsSystem", arr);
                if (all.length > 0) systemIp = all[0].getHostAddress();
                putQuiet(r, "dnsSystemMs", System.currentTimeMillis() - t0);
            } catch (Exception e) {
                putQuiet(r, "dnsSystem", "FAILED: " + e.getClass().getSimpleName() + " " + e.getMessage());
            }

            // 2. Cloudflare DoH, asked by literal IP so a lying resolver cannot
            //    interfere with reaching the resolver itself.
            try {
                long d0 = System.currentTimeMillis();
                HttpsURLConnection c = (HttpsURLConnection) new URL(
                        "https://1.1.1.1/dns-query?name=" + host + "&type=A").openConnection();
                c.setRequestProperty("accept", "application/dns-json");
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                c.setHostnameVerifier((h, s) -> true);   // reached by IP; cert is for the name
                int code = c.getResponseCode();
                StringBuilder sb = new StringBuilder();
                try (BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 400 ? c.getErrorStream() : c.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                }
                JSONObject body = new JSONObject(sb.toString());
                JSONArray answers = body.optJSONArray("Answer");
                JSONArray ips = new JSONArray();
                if (answers != null) {
                    for (int i = 0; i < answers.length(); i++) {
                        JSONObject a = answers.optJSONObject(i);
                        if (a != null && a.optInt("type") == 1) ips.put(a.optString("data"));
                    }
                }
                putQuiet(r, "dnsDoH", ips);
                putQuiet(r, "dnsDoHMs", System.currentTimeMillis() - d0);
            } catch (Exception e) {
                putQuiet(r, "dnsDoH", "FAILED: " + e.getClass().getSimpleName() + " " + e.getMessage());
            }

            // 3. TCP to the address the system resolver gave (if any).
            String probeIp = systemIp.isEmpty() ? host : systemIp;
            try {
                long c0 = System.currentTimeMillis();
                Socket s = new Socket();
                s.connect(new InetSocketAddress(probeIp, port), 8000);
                putQuiet(r, "tcp", "OK " + probeIp + ":" + port + " in " + (System.currentTimeMillis() - c0) + "ms");
                s.close();
            } catch (Exception e) {
                putQuiet(r, "tcp", "FAILED: " + e.getClass().getSimpleName() + " " + e.getMessage());
            }

            // 4. TLS handshake — what SNI-based filtering breaks.
            //    Must be created with the HOSTNAME, not the bare address: the
            //    handshake sends SNI, and Cloudflare correctly refuses a TLS
            //    connection whose SNI is an IP (measured: SSLV3_ALERT_HANDSHAKE_FAILURE).
            //    A failure here with the hostname really does mean interference.
            if (https) {
                try {
                    long s0 = System.currentTimeMillis();
                    SSLSocket s = (SSLSocket) SSLSocketFactory.getDefault().createSocket(host, port);
                    s.setSoTimeout(8000);
                    s.startHandshake();
                    Certificate[] chain = s.getSession().getPeerCertificates();
                    putQuiet(r, "tls", "OK " + s.getSession().getProtocol() + " certs=" + chain.length
                            + " sni=" + host + " in " + (System.currentTimeMillis() - s0) + "ms");
                    s.close();
                } catch (Exception e) {
                    putQuiet(r, "tls", "FAILED: " + e.getClass().getSimpleName() + " " + e.getMessage());
                }
            }

            // 5. The actual request, through the normal stack.
            try {
                long h0 = System.currentTimeMillis();
                URLConnection c = new URL(urlString + "/rest/ping.view?v=1.16.1&c=diag&u=x&t=x&s=x").openConnection();
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                if (c instanceof HttpsURLConnection) ((HttpsURLConnection) c).setInstanceFollowRedirects(true);
                int code = ((java.net.HttpURLConnection) c).getResponseCode();
                putQuiet(r, "http", "HTTP " + code + " in " + (System.currentTimeMillis() - h0) + "ms");
                InputStream is = code >= 400 ? ((java.net.HttpURLConnection) c).getErrorStream()
                                             : c.getInputStream();
                if (is != null) {
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    byte[] buf = new byte[512];
                    int n = is.read(buf);
                    if (n > 0) bos.write(buf, 0, n);
                    putQuiet(r, "httpBody", bos.toString("UTF-8").replaceAll("\\s+", " ").substring(0, Math.min(160, bos.size())));
                }
            } catch (Exception e) {
                putQuiet(r, "http", "FAILED: " + e.getClass().getSimpleName() + " " + e.getMessage());
            }

            try { putQuiet(r, "totalMs", System.currentTimeMillis() - t0); } catch (Exception ignored) {}
            return r.toString();
        }

        @JavascriptInterface
        public String getServerUrl() {
            return readCredential(KEY_URL);
        }

        /** Subsonic token auth; the password itself never leaves this method. */
        @JavascriptInterface
        public String getAuthParams() {
            String username = readCredential(KEY_USER);
            String password = readCredential(KEY_PASS);
            if (username.isEmpty() || password.isEmpty()) {
                return "{}";
            }
            try {
                String salt = randomSalt(16);
                JSONObject params = new JSONObject();
                params.put("u", username);
                params.put("t", md5Hex(password + salt));
                params.put("s", salt);
                params.put("v", "1.16.1");
                params.put("c", "ArchimedesAndroid");
                params.put("f", "json");
                return params.toString();
            } catch (Exception e) {
                e.printStackTrace();
                return "{}";
            }
        }

        /* =====================================================================
           Downloading a track from the user's own server to this device
           =====================================================================
           Same shape as diagnoseConnection: the JavascriptInterface call returns
           immediately and JavaScript polls getDownloadResult(), because a
           download cannot finish inside a synchronous bridge call.

           download.view returns the server's file byte for byte, so a lossless
           track stays lossless. Nothing is re-encoded here either.

           The destination is chosen by the user through Android's own save
           dialog (ACTION_CREATE_DOCUMENT), which is the supported way to let an
           app write to a location the user picks without holding storage
           permissions.
           ===================================================================== */

        @JavascriptInterface
        public String startDownload(String id, String name, String suffix) {
            if (id == null || !id.matches("[A-Za-z0-9_-]{1,64}")) {
                downloadResult = "{\"state\":\"error\",\"error\":\"bad-id\"}";
                return downloadResult;
            }
            if (readCredential(KEY_URL).isEmpty() || readCredential(KEY_USER).isEmpty()) {
                downloadResult = "{\"state\":\"error\",\"error\":\"not-configured\"}";
                return downloadResult;
            }

            String safeName = (name == null ? "track" : name).replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").trim();
            if (safeName.isEmpty()) safeName = "track";
            if (safeName.length() > 120) safeName = safeName.substring(0, 120);
            String safeSuffix = (suffix == null ? "mp3" : suffix).replaceAll("[^A-Za-z0-9]", "");
            if (safeSuffix.isEmpty()) safeSuffix = "mp3";

            pendingDownloadId = id;
            pendingDownloadName = safeName + "." + safeSuffix;
            downloadResult = "{\"state\":\"picking\"}";

            try {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("audio/*");
                intent.putExtra(Intent.EXTRA_TITLE, pendingDownloadName);
                startActivityForResult(intent, REQ_CREATE_DOCUMENT);
                return "started";
            } catch (Exception e) {
                String msg = String.valueOf(e.getMessage()).replace("\\", "\\\\").replace("\"", "\\\"");
                downloadResult = "{\"state\":\"error\",\"error\":\"" + msg + "\"}";
                return downloadResult;
            }
        }

        @JavascriptInterface
        public String getDownloadResult() {
            return downloadResult;
        }

        /** Streams the server's file into the destination the user picked. */
        void beginDownload(Uri destination) {
            final String id = pendingDownloadId;
            final String displayName = pendingDownloadName;
            downloadResult = "{\"state\":\"downloading\",\"received\":0,\"total\":0}";

            new Thread(() -> {
                InputStream in = null;
                OutputStream out = null;
                try {
                    JSONObject auth = new JSONObject(getAuthParams());
                    StringBuilder url = new StringBuilder(readCredential(KEY_URL).replaceAll("/+$", ""));
                    url.append("/rest/download.view?id=").append(Uri.encode(id));
                    for (java.util.Iterator<String> it = auth.keys(); it.hasNext(); ) {
                        String k = it.next();
                        url.append('&').append(Uri.encode(k)).append('=').append(Uri.encode(auth.getString(k)));
                    }

                    HttpURLConnection conn = (HttpURLConnection) new URL(url.toString()).openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    int status = conn.getResponseCode();
                    if (status != 200) {
                        downloadResult = "{\"state\":\"error\",\"error\":\"http-" + status + "\"}";
                        return;
                    }
                    long total = conn.getContentLength();

                    in = conn.getInputStream();
                    out = getContentResolver().openOutputStream(destination);
                    if (out == null) {
                        downloadResult = "{\"state\":\"error\",\"error\":\"cannot-open-destination\"}";
                        return;
                    }

                    byte[] buffer = new byte[64 * 1024];
                    long received = 0;
                    long lastReport = 0;
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        received += read;
                        long now = System.currentTimeMillis();
                        if (now - lastReport > 250) {
                            lastReport = now;
                            JSONObject p = new JSONObject();
                            putQuiet(p, "state", "downloading");
                            putQuiet(p, "received", received);
                            putQuiet(p, "total", total);
                            downloadResult = p.toString();
                        }
                    }
                    out.flush();

                    JSONObject done = new JSONObject();
                    putQuiet(done, "state", "done");
                    putQuiet(done, "received", received);
                    putQuiet(done, "total", total);
                    putQuiet(done, "bytes", received);
                    putQuiet(done, "name", displayName);
                    putQuiet(done, "path", String.valueOf(destination));
                    downloadResult = done.toString();
                } catch (Exception e) {
                    JSONObject err = new JSONObject();
                    putQuiet(err, "state", "error");
                    putQuiet(err, "error", String.valueOf(e.getMessage()));
                    downloadResult = err.toString();
                } finally {
                    try { if (in != null) in.close(); } catch (Exception ignored) {}
                    try { if (out != null) out.close(); } catch (Exception ignored) {}
                }
            }, "archimedes-download").start();
        }

        @JavascriptInterface
        public String listLocalSubtitles() {            JSONArray subtitles = new JSONArray();
            File[] files = subtitleDir().listFiles();
            if (files == null) {
                return subtitles.toString();
            }
            for (File file : files) {
                if (!file.isFile()) {
                    continue;
                }
                try {
                    JSONObject entry = new JSONObject();
                    entry.put("name", file.getName());
                    entry.put("size", file.length());
                    subtitles.put(entry);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return subtitles.toString();
        }

        @JavascriptInterface
        public String readSubtitleFile(String name) {
            if (name == null || name.isEmpty()) {
                return "";
            }
            // Imported subtitles live in one flat directory, so any separator or ".." is illegitimate.
            if (name.indexOf('/') >= 0 || name.indexOf('\\') >= 0 || name.contains("..")) {
                return "";
            }
            File file = new File(subtitleDir(), name);
            if (!file.isFile()) {
                return "";
            }
            try {
                return readSubtitleText(file);
            } catch (Exception e) {
                e.printStackTrace();
                return "";
            }
        }

        @JavascriptInterface
        public void pickSubtitleFile() {
            runOnUiThread(() -> launchSubtitlePicker());
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Let the playback service route media keys back into this page.
        visibleInstance = new java.lang.ref.WeakReference<>(this);

        // Android 13+ needs a runtime grant before any notification can appear.
        requestNotificationPermissionIfNeeded();

        // Immersive dark status bar
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#0e0e14"));
        window.setNavigationBarColor(Color.parseColor("#0e0e14"));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // The UI is served by WebViewAssetLoader over https (see below), so the
        // WebView no longer needs raw file:// access at all. Turning it off
        // removes one whole class of local-file exposure while changing nothing
        // about what the page can legitimately do.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setBackgroundColor(Color.parseColor("#0e0e14"));

        // Register Archimedes Android Native Bridge
        nativeBridge = new ArchimedesAndroidBridge();
        webView.addJavascriptInterface(nativeBridge, "ArchimedesNative");
        /* =====================================================================
           Serve the UI over https instead of file://
           =====================================================================
           This is the Android half of the YouTube Error 153 fix.

           The page used to be loaded from file:///android_asset/index.html. A
           file:// document has an opaque origin: it produces no meaningful HTTP
           Referer and no origin the embed can declare, so YouTube could not
           identify the client and answered 153. Android has no equivalent of
           Electron's header interception for sub-resource requests — the only
           correct fix is to give the page a real https origin.

           WebViewAssetLoader is the platform's supported way to do that. It maps
           /assets/ to the APK's asset folder and serves it from
           https://appassets.androidplatform.net, which is a genuine https origin
           (and is not a real network host, so nothing leaves the device).
           ===================================================================== */
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // 1. Assets for the UI itself.
                WebResourceResponse assetResponse = null;
                try {
                    assetResponse = assetLoader.shouldInterceptRequest(request.getUrl());
                } catch (Exception e) {
                    e.printStackTrace();
                }
                if (assetResponse != null) {
                    return assetResponse;
                }

                // 2. Device audio and album art, served from MediaStore.
                Uri reqUri = request.getUrl();
                if (reqUri != null && "archimedes.local".equalsIgnoreCase(reqUri.getHost())) {
                    String path = reqUri.getPath();
                    if (path != null && path.startsWith("/audio/")) {
                        try {
                            String idStr = reqUri.getLastPathSegment();
                            if (idStr != null) {
                                long audioId = Long.parseLong(idStr);
                                Uri contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, audioId);
                                InputStream inStream = getContentResolver().openInputStream(contentUri);
                                Map<String, String> headers = new HashMap<>();
                                headers.put("Access-Control-Allow-Origin", "*");
                                headers.put("Accept-Ranges", "bytes");
                                return new WebResourceResponse("audio/mpeg", "UTF-8", 200, "OK", headers, inStream);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    } else if (path != null && path.startsWith("/art/")) {
                        try {
                            String artIdStr = reqUri.getLastPathSegment();
                            if (artIdStr != null) {
                                long albumId = Long.parseLong(artIdStr);
                                Uri artUri = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId);
                                InputStream inStream = getContentResolver().openInputStream(artUri);
                                Map<String, String> headers = new HashMap<>();
                                headers.put("Access-Control-Allow-Origin", "*");
                                return new WebResourceResponse("image/jpeg", "UTF-8", 200, "OK", headers, inStream);
                            }
                        } catch (Exception e) {
                            // Album art not available
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        // Served by WebViewAssetLoader; see the comment where the loader is built.
        webView.loadUrl(APP_ORIGIN + "/assets/index.html");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            if (webView != null) {
                webView.post(() -> webView.evaluateJavascript("if (typeof onAndroidPermissionsGranted === 'function') onAndroidPermissionsGranted();", null));
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SUBTITLE_PICK_REQ_CODE) {
            handleSubtitleResult(resultCode, data);
        } else if (requestCode == DELETE_REQ_CODE) {
            // The system has already performed the deletion when the user allowed it.
            long id = pendingDeleteAudioId;
            pendingDeleteAudioId = -1;
            notifyLocalFileDeleted(id, resultCode == RESULT_OK);
        } else if (requestCode == REQ_CREATE_DOCUMENT) {
            // The user picked where the track should be saved (or cancelled).
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                if (nativeBridge != null) nativeBridge.beginDownload(data.getData());
            } else {
                downloadResult = "{\"state\":\"cancelled\"}";
            }
        }
    }

    /** Tells the page how the MediaStore delete request ended. */
    private void notifyLocalFileDeleted(final long audioId, final boolean ok) {
        final WebView view = webView;
        if (view == null) return;
        view.post(new Runnable() {
            @Override
            public void run() {
                view.evaluateJavascript(
                        "if (typeof onLocalFileDeleted === 'function') onLocalFileDeleted(\""
                                + audioId + "\", " + (ok ? "true" : "false") + ");", null);
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // With launchMode="singleTask" reopening the app reuses THIS instance, so the
        // page is never reloaded and never starts a second player. Bringing the
        // window forward is all that is needed.
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-announce the current track: the notification used to be missing after
        // returning to the app.
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript(
                            "if (typeof onAppResumed === 'function') onAppResumed();", null);
                }
            });
        }
    }

    @Override
    protected void onDestroy() {
        if (visibleInstance != null && visibleInstance.get() == this) {
            visibleInstance = null;
        }
        // A leaked WebView keeps decoding audio after the activity is gone, which is
        // how the app ended up playing several tracks at once with no notification:
        // every return created a new player while the old one was still alive.
        try {
            if (webView != null) {
                webView.stopLoading();
                webView.loadUrl("about:blank");
                webView.destroy();
                webView = null;
            }
        } catch (Exception e) {
            // ignore
        }
        super.onDestroy();
    }

    /** Runtime notification permission (API 33+); silently skipped below that. */
    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        try {
            if (ContextCompat.checkSelfPermission(this, "android.permission.POST_NOTIFICATIONS")
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{"android.permission.POST_NOTIFICATIONS"}, NOTIFICATION_PERMISSION_REQ_CODE);
            }
        } catch (Exception e) {
            // The notification is best-effort.
        }
    }

    @Override
    public void onBackPressed() {
        // Back must never land on a dead end. The page gets the first chance to
        // close whatever is open (lyrics screen, studio, EQ sheet, drawer...)
        // through the single window.__dshHandleBack entry point; only when it
        // reports nothing to dismiss do we fall back to WebView history and
        // finally to leaving the app.
        final WebView view = webView;
        if (view == null) {
            super.onBackPressed();
            return;
        }
        view.evaluateJavascript(
                "(function(){try{return (window.__dshHandleBack&&window.__dshHandleBack())?'true':'false';}catch(e){return 'false';}})()",
                value -> {
                    boolean handled = value != null && value.contains("true");
                    if (!handled) performDefaultBack();
                });
    }

    private void performDefaultBack() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // ---------- encrypted credential store ----------

    private synchronized SharedPreferences credentialPrefs() {
        if (credentialPrefsResolved) {
            return credentialPrefs;
        }
        credentialPrefsResolved = true;
        try {
            MasterKey masterKey = new MasterKey.Builder(this)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            credentialPrefs = EncryptedSharedPreferences.create(
                    this,
                    SECURE_PREFS_FILE,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
        } catch (Exception e) {
            // The keystore can be unavailable or corrupt on some devices; a plain file keeps the app usable.
            e.printStackTrace();
            credentialPrefs = getSharedPreferences(PLAIN_PREFS_FILE, MODE_PRIVATE);
        }
        return credentialPrefs;
    }

    private String readCredential(String key) {
        try {
            String value = credentialPrefs().getString(key, "");
            return value != null ? value : "";
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    private void writeCredential(String key, String value) {
        try {
            // commit() rather than apply(): JavaScript may read the value back immediately.
            credentialPrefs().edit().putString(key, value == null ? "" : value).commit();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void clearStore(SharedPreferences prefs) {
        try {
            prefs.edit().clear().commit();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String md5Hex(String input) {
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(Character.forDigit((b >> 4) & 0x0F, 16));
                hex.append(Character.forDigit(b & 0x0F, 16));
            }
            return hex.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    private static String randomSalt(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder salt = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            salt.append(ALPHANUMERIC.charAt(random.nextInt(ALPHANUMERIC.length())));
        }
        return salt.toString();
    }

    // ---------- subtitle import (Storage Access Framework) ----------

    private void launchSubtitlePicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        // Many devices report .srt as application/octet-stream, so the subtitle MIME types
        // are listed explicitly to keep .srt/.vtt files selectable.
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/x-subrip", "text/plain", "text/vtt"});
        try {
            startActivityForResult(intent, SUBTITLE_PICK_REQ_CODE);
        } catch (Exception e) {
            e.printStackTrace();
            notifySubtitlePicked("", ""); // no document provider available: settle the JavaScript promise
        }
    }

    private void handleSubtitleResult(int resultCode, Intent data) {
        Uri uri = (data != null) ? data.getData() : null;
        if (resultCode != RESULT_OK || uri == null) {
            notifySubtitlePicked("", ""); // user backed out: settle the JavaScript promise
            return;
        }

        String name = "";
        String content = "";
        try {
            name = safeSubtitleName(uri);
            content = readSubtitleText(uri);
            saveSubtitleFile(name, content);
        } catch (Exception e) {
            // Any failure still calls back (with empty content when the read failed).
            e.printStackTrace();
        }
        notifySubtitlePicked(name, content);
    }

    private void notifySubtitlePicked(String name, String content) {
        if (webView == null) {
            return;
        }
        // JSONObject.quote already yields a valid, escaped double-quoted JavaScript string literal.
        String script = "if (typeof onSubtitleFilePicked === 'function') onSubtitleFilePicked("
                + JSONObject.quote(name == null ? "" : name) + ","
                + JSONObject.quote(content == null ? "" : content) + ");";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private File subtitleDir() {
        File dir = new File(getFilesDir(), SUBTITLE_DIR_NAME);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    private String safeSubtitleName(Uri uri) {
        String name = subtitleDisplayName(uri);
        if (name == null || name.trim().isEmpty()) {
            name = uri.getLastPathSegment();
        }
        if (name == null) {
            name = "";
        }
        int separator = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (separator >= 0) {
            name = name.substring(separator + 1);
        }
        name = name.replace("..", "").trim();
        return name.isEmpty() ? DEFAULT_SUBTITLE_NAME : name;
    }

    private String subtitleDisplayName(Uri uri) {
        Cursor cursor = null;
        try {
            cursor = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    return cursor.getString(index);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
        return null;
    }

    private String readSubtitleText(Uri uri) throws IOException {
        InputStream in = getContentResolver().openInputStream(uri);
        if (in == null) {
            throw new IOException("Cannot open " + uri);
        }
        try {
            return stripBom(new String(readAllBytes(in, MAX_SUBTITLE_BYTES), StandardCharsets.UTF_8));
        } finally {
            in.close();
        }
    }

    private String readSubtitleText(File file) throws IOException {
        InputStream in = new FileInputStream(file);
        try {
            return stripBom(new String(readAllBytes(in, MAX_SUBTITLE_BYTES), StandardCharsets.UTF_8));
        } finally {
            in.close();
        }
    }

    private void saveSubtitleFile(String name, String content) throws IOException {
        File dir = subtitleDir();
        if (!dir.isDirectory()) {
            throw new IOException("Cannot create " + dir);
        }
        try (FileOutputStream out = new FileOutputStream(new File(dir, name))) {
            out.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    private static String stripBom(String text) {
        if (text == null) {
            return "";
        }
        return (!text.isEmpty() && text.charAt(0) == '\uFEFF') ? text.substring(1) : text;
    }

    private static byte[] readAllBytes(InputStream in, int maxBytes) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        while (total < maxBytes) {
            int read = in.read(buffer, 0, Math.min(buffer.length, maxBytes - total));
            if (read <= 0) {
                break;
            }
            out.write(buffer, 0, read);
            total += read;
        }
        return out.toByteArray();
    }
}
