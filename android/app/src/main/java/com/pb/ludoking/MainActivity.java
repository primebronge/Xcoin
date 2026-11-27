package com.pb.ludoking;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * The game: index.html (from the APK assets) inside a WebView.
 *  - status bar stays visible, content sits below the status bar / notch (no full screen)
 *  - display stays on while the game is open
 *  - Back button is forwarded to the game (js/android.js); on the game's home screen press Back twice to exit
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";

    private WebView web;
    private FrameLayout root;
    private UpdateBridge bridge;
    private boolean pendingInstall = false;
    private long lastBack = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);          // Always-on display
        WindowCompat.setDecorFitsSystemWindows(w, true);                      // status bar visible, no full screen

        root = new FrameLayout(this);
        root.setBackgroundColor(getResources().getColor(R.color.game_bg));
        // Safety net: if the system ever draws edge-to-edge (e.g. targetSdk 35+), keep the game below status bar + notch
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets b = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);                         // game sounds / music
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // Serve the game from the APK assets on a real https origin (Firebase, audio, fetch all work normally)
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new AssetHandler())
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        bridge = new UpdateBridge(this);
        web.addJavascriptInterface(bridge, "AndroidApp");

        // a finished/old download is no longer needed
        File dir = new File(getFilesDir(), "updates");
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
            f.delete();

        web.loadUrl(START_URL);
    }

    /** Reads files from the APK assets (www/ folder of the repo). */
    private class AssetHandler implements WebViewAssetLoader.PathHandler {
        @Override
        public WebResourceResponse handle(String path) {
            if (path == null || path.isEmpty() || path.contains("..")) return null;
            try {
                InputStream is = getAssets().open(path);
                return new WebResourceResponse(mime(path), null, is);
            } catch (IOException e) {
                return null;                                                   // -> 404
            }
        }
    }

    private static String mime(String p) {
        String s = p.toLowerCase(Locale.ROOT);
        if (s.endsWith(".html")) return "text/html";
        if (s.endsWith(".js")) return "application/javascript";
        if (s.endsWith(".css")) return "text/css";
        if (s.endsWith(".json")) return "application/json";
        if (s.endsWith(".png")) return "image/png";
        if (s.endsWith(".jpg") || s.endsWith(".jpeg")) return "image/jpeg";
        if (s.endsWith(".gif")) return "image/gif";
        if (s.endsWith(".svg")) return "image/svg+xml";
        if (s.endsWith(".webp")) return "image/webp";
        if (s.endsWith(".mp3")) return "audio/mpeg";
        if (s.endsWith(".wav")) return "audio/wav";
        if (s.endsWith(".ogg")) return "audio/ogg";
        if (s.endsWith(".mp4")) return "video/mp4";
        if (s.endsWith(".ttf")) return "font/ttf";
        if (s.endsWith(".otf")) return "font/otf";
        if (s.endsWith(".woff")) return "font/woff";
        if (s.endsWith(".woff2")) return "font/woff2";
        if (s.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    // ---- JS helper ------------------------------------------------------------------------

    void js(final String code) {
        runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript(code, null);
        });
    }

    // ---- install the downloaded update ------------------------------------------------------

    void tryInstall() {
        File f = bridge.apkFile();
        if (f == null || !f.exists()) {
            js("window.__upd&&window.__upd.onState('error','Update file not found, download again')");
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            // ask the user once: "Allow from this source"; we continue automatically when they come back (onResume)
            pendingInstall = true;
            js("window.__upd&&window.__upd.onState('needperm','')");
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
            } catch (Exception e) {
                js("window.__upd&&window.__upd.onState('error','Open Settings > Apps > Ludo King > Install unknown apps and allow it')");
            }
            return;
        }
        pendingInstall = false;
        try {
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            js("window.__upd&&window.__upd.onState('installing','')");
            startActivity(i);
        } catch (Exception e) {
            js("window.__upd&&window.__upd.onState('error','Cannot open the installer')");
        }
    }

    // ---- lifecycle / back -------------------------------------------------------------------

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        if (pendingInstall && (Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls())) {
            tryInstall();                                                      // permission was just given -> install
        }
        js("window.__upd&&window.__upd.onResume&&window.__upd.onResume()");
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();                                        // music stops when the app goes to background
        super.onPause();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // 1) let the game handle it (close popup / go back a screen / "press again to exit" on home)
        web.evaluateJavascript(
                "(function(){try{return window.__nativeBack?window.__nativeBack():false}catch(e){return false}})()",
                value -> {
                    if ("true".equals(value)) return;
                    // 2) game not ready / did not handle it: native "press back twice to exit"
                    long now = SystemClock.elapsedRealtime();
                    if (now - lastBack < 2000) {
                        finishAndRemoveTask();
                    } else {
                        lastBack = now;
                        Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            root.removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}
