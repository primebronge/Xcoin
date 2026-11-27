package com.pb.ludoking;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/**
 * Plays assets/ui/pb_intro.mp4 FULL SCREEN (status bar, navigation bar and notch area included),
 * then opens MainActivity (the game, index.html).
 */
public class IntroActivity extends Activity implements SurfaceHolder.Callback {

    private static final String INTRO_ASSET = "assets/ui/pb_intro.mp4";

    private FrameLayout root;
    private SurfaceView surface;
    private MediaPlayer player;
    private boolean prepared = false;
    private boolean finished = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);          // display stays on
        if (Build.VERSION.SDK_INT >= 28) {                                    // draw into the notch too
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(lp);
        }
        WindowCompat.setDecorFitsSystemWindows(w, false);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        surface = new SurfaceView(this);
        root.addView(surface, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT, Gravity.CENTER));
        setContentView(root);
        surface.getHolder().addCallback(this);
        hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), root);
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    // ---- video -----------------------------------------------------------------------------

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        try {
            player = new MediaPlayer();
            AssetFileDescriptor afd = getAssets().openFd(INTRO_ASSET);
            player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            player.setDisplay(holder);
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE).build());
            player.setOnPreparedListener(mp -> {
                prepared = true;
                fillScreen(mp.getVideoWidth(), mp.getVideoHeight());
                if (hasWindowFocus() || !isFinishing()) mp.start();
            });
            player.setOnCompletionListener(mp -> openGame());
            player.setOnErrorListener((mp, what, extra) -> { openGame(); return true; });
            player.prepareAsync();
        } catch (Exception e) {
            openGame();                                  // no video? just go to the game
        }
    }

    /** Scale the video so it covers the whole screen (centre-crop, aspect ratio kept). */
    private void fillScreen(int vw, int vh) {
        if (vw <= 0 || vh <= 0) return;
        int sw = root.getWidth(), sh = root.getHeight();
        if (sw <= 0 || sh <= 0) {
            sw = getResources().getDisplayMetrics().widthPixels;
            sh = getResources().getDisplayMetrics().heightPixels;
        }
        float scale = Math.max((float) sw / vw, (float) sh / vh);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                Math.round(vw * scale), Math.round(vh * scale), Gravity.CENTER);
        surface.setLayoutParams(lp);
    }

    @Override public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) { }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        releasePlayer();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { if (player != null && prepared && player.isPlaying()) player.pause(); } catch (Exception ignored) { }
    }

    @Override
    protected void onResume() {
        super.onResume();
        try { if (player != null && prepared && !player.isPlaying() && !finished) player.start(); } catch (Exception ignored) { }
    }

    private void releasePlayer() {
        try { if (player != null) { player.setDisplay(null); player.release(); } } catch (Exception ignored) { }
        player = null;
        prepared = false;
    }

    private void openGame() {
        if (finished) return;
        finished = true;
        releasePlayer();
        startActivity(new Intent(this, MainActivity.class));
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }

    @Override
    protected void onDestroy() {
        releasePlayer();
        super.onDestroy();
    }
}
