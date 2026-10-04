package com.itzjok3r.archimedes;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service that keeps playback alive in the background and shows the
 * current track with previous / play-pause / next controls.
 *
 * The WebView keeps decoding audio as long as the process lives; without a
 * foreground service Android is free to freeze or kill it, which is why the app
 * went silent whenever it left the screen. The service also owns a framework
 * MediaSession, so system, Bluetooth and headset media keys are routed back into
 * the page through MainActivity.dispatchMediaButton().
 *
 * No extra dependency is used on purpose: android.media.session.MediaSession is
 * part of the platform (API 21+) and NotificationCompat comes with appcompat.
 */
public class PlaybackService extends Service {

    public static final String CHANNEL_ID = "archimedes_playback";
    public static final int NOTIFICATION_ID = 4711;

    public static final String ACTION_START = "com.itzjok3r.archimedes.START";
    public static final String ACTION_UPDATE = "com.itzjok3r.archimedes.UPDATE";
    public static final String ACTION_TOGGLE = "com.itzjok3r.archimedes.TOGGLE";
    public static final String ACTION_NEXT = "com.itzjok3r.archimedes.NEXT";
    public static final String ACTION_PREV = "com.itzjok3r.archimedes.PREV";
    public static final String ACTION_STOP = "com.itzjok3r.archimedes.STOP";

    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_PLAYING = "playing";

    private static String currentTitle = "";
    private static String currentArtist = "";
    private static boolean currentPlaying = false;

    private MediaSession mediaSession;

    /** Starts or refreshes the notification with the given track. */
    public static void push(Context context, String title, String artist, boolean playing) {
        Intent intent = new Intent(context, PlaybackService.class);
        intent.setAction(ACTION_UPDATE);
        intent.putExtra(EXTRA_TITLE, title == null ? "" : title);
        intent.putExtra(EXTRA_ARTIST, artist == null ? "" : artist);
        intent.putExtra(EXTRA_PLAYING, playing);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    /** Stops the service and removes the notification. */
    public static void dismiss(Context context) {
        Intent intent = new Intent(context, PlaybackService.class);
        intent.setAction(ACTION_STOP);
        context.startService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        createMediaSession();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();

        if (ACTION_STOP.equals(action)) {
            stopForegroundCompat();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_TOGGLE.equals(action)) {
            forwardToPage("toggle");
        } else if (ACTION_NEXT.equals(action)) {
            forwardToPage("next");
        } else if (ACTION_PREV.equals(action)) {
            forwardToPage("prev");
        } else if (intent != null && (ACTION_UPDATE.equals(action) || ACTION_START.equals(action))) {
            currentTitle = intent.getStringExtra(EXTRA_TITLE) == null ? currentTitle : intent.getStringExtra(EXTRA_TITLE);
            currentArtist = intent.getStringExtra(EXTRA_ARTIST) == null ? currentArtist : intent.getStringExtra(EXTRA_ARTIST);
            currentPlaying = intent.getBooleanExtra(EXTRA_PLAYING, currentPlaying);
        } else if (intent != null && intent.getBooleanExtra(EXTRA_PLAYING, false)) {
            currentPlaying = true;
        }

        // startForeground must happen promptly on every path.
        startForegroundCompat();
        updateMediaSessionState();
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * The user swiped the app out of recents: the page that was driving playback is
     * gone, so nothing may keep playing (and no stale notification may linger).
     */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        currentPlaying = false;
        currentTitle = "";
        currentArtist = "";
        stopForegroundCompat();
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }

    // ---------------------------------------------------------------- helpers

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Archimedes playback",
                NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("إشعار تشغيل الأغنية الحالية");
        channel.setShowBadge(false);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    private void createMediaSession() {
        try {
            mediaSession = new MediaSession(this, "ArchimedesPlayback");
            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() { forwardToPage("play"); }

                @Override
                public void onPause() { forwardToPage("pause"); }

                @Override
                public void onSkipToNext() { forwardToPage("next"); }

                @Override
                public void onSkipToPrevious() { forwardToPage("prev"); }

                @Override
                public void onStop() { forwardToPage("stop"); }
            });
            mediaSession.setActive(true);
        } catch (Exception e) {
            mediaSession = null;
        }
    }

    private void updateMediaSessionState() {
        if (mediaSession == null) return;
        try {
            int state = currentPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
            PlaybackState.Builder builder = new PlaybackState.Builder()
                    .setState(state, PlaybackState.PLAYBACK_POSITION_UNKNOWN, currentPlaying ? 1f : 0f)
                    .setActions(PlaybackState.ACTION_PLAY
                            | PlaybackState.ACTION_PAUSE
                            | PlaybackState.ACTION_PLAY_PAUSE
                            | PlaybackState.ACTION_SKIP_TO_NEXT
                            | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                            | PlaybackState.ACTION_STOP);
            mediaSession.setPlaybackState(builder.build());
            mediaSession.setMetadata(new MediaMetadata.Builder()
                    .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
                    .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
                    .build());
        } catch (Exception e) {
            // Metadata is cosmetic; never let it break playback.
        }
    }

    /** Sends a control action into the WebView page. */
    private void forwardToPage(String action) {
        final MainActivity activity = MainActivity.getVisibleInstance();
        if (activity != null) {
            activity.dispatchMediaButton(action);
            return;
        }
        // Activity is gone: keep the notification honest instead of crashing.
        if ("play".equals(action)) currentPlaying = true;
        if ("pause".equals(action) || "stop".equals(action)) currentPlaying = false;
        if ("toggle".equals(action)) currentPlaying = !currentPlaying;
        updateMediaSessionState();
        startForegroundCompat();
    }

    private PendingIntent serviceIntent(String action, int requestCode) {
        Intent intent = new Intent(this, PlaybackService.class);
        intent.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this, requestCode, intent, flags);
    }

    private void startForegroundCompat() {
        PendingIntent contentIntent = null;
        try {
            Intent launch = new Intent(this, MainActivity.class);
            launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            contentIntent = PendingIntent.getActivity(this, 0, launch, flags);
        } catch (Exception e) {
            // Without a content intent the notification still shows the controls.
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle(currentTitle.isEmpty() ? "Archimedes" : currentTitle)
                .setContentText(currentArtist)
                .setOngoing(currentPlaying)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(android.R.drawable.ic_media_previous, "السابق", serviceIntent(ACTION_PREV, 11))
                .addAction(currentPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        currentPlaying ? "إيقاف" : "تشغيل", serviceIntent(ACTION_TOGGLE, 12))
                .addAction(android.R.drawable.ic_media_next, "التالي", serviceIntent(ACTION_NEXT, 13));

        if (contentIntent != null) builder.setContentIntent(contentIntent);
        if (mediaSession != null) builder.setStyle(new NotificationCompat.BigTextStyle().bigText(currentArtist));

        Notification notification = builder.build();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification,
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            // If the system refuses the foreground promotion, fall back to a plain
            // notification so the user at least sees what is playing.
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.notify(NOTIFICATION_ID, notification);
        }
    }

    private void stopForegroundCompat() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
        } catch (Exception e) {
            // ignore
        }
    }
}
