package com.ludoking.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Ludo King - full screen WebView wrapper.
 * The game files live in app/src/main/assets/www and are served from a private
 * https origin, so localStorage, Firebase and audio behave like on a normal website.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/www/index.html";
    private static final int BG = 0xFF0D3D96;

    // Lets us pause/resume game music when the app goes to the background.
    private static final String AUDIO_HOOK =
            "(function(){if(window.__lkHook)return;window.__lkHook=1;"
            + "var P=HTMLMediaElement.prototype,op=P.play,act=new Set();"
            + "P.play=function(){act.add(this);return op.apply(this,arguments);};"
            + "window.__lkPause=function(){act.forEach(function(a){if(!a.paused){a.__lkWas=1;a.pause();}});};"
            + "window.__lkResume=function(){act.forEach(function(a){if(a.__lkWas){a.__lkWas=0;"
            + "var r=a.play();if(r&&r.catch)r.catch(function(){});}});};})();";

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(BG);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        setContentView(web, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setAllowFileAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return serve(request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(AUDIO_HOOK, null);
            }
        });

        web.loadUrl(START_URL);
    }

    /** Serves files from the assets folder (with HTTP Range support for audio). */
    private WebResourceResponse serve(WebResourceRequest request) {
        Uri u = request.getUrl();
        if (!HOST.equals(u.getHost())) {
            return null; // normal network request (Firebase, CDN, ...)
        }
        String path = u.getPath();
        if (path == null || !path.startsWith("/assets/") || path.contains("..")) {
            return notFound();
        }
        String assetPath = path.substring("/assets/".length());

        byte[] data;
        try (InputStream in = getAssets().open(assetPath)) {
            data = readAll(in);
        } catch (IOException e) {
            return notFound();
        }

        String mime = mimeFor(path);
        String encoding = (mime.startsWith("text/") || mime.equals("application/json")) ? "utf-8" : null;

        Map<String, String> headers = new HashMap<>();
        headers.put("Accept-Ranges", "bytes");
        headers.put("Access-Control-Allow-Origin", "*");

        int len = data.length;
        String range = null;
        Map<String, String> reqHeaders = request.getRequestHeaders();
        if (reqHeaders != null) {
            range = reqHeaders.get("Range");
        }
        if (range != null && range.startsWith("bytes=")) {
            try {
                String spec = range.substring(6).trim();
                int dash = spec.indexOf('-');
                int start;
                int end;
                if (dash == 0) { // suffix range: last N bytes
                    int n = Integer.parseInt(spec.substring(1).trim());
                    start = Math.max(0, len - n);
                    end = len - 1;
                } else {
                    start = Integer.parseInt(spec.substring(0, dash).trim());
                    String endStr = spec.substring(dash + 1).trim();
                    end = endStr.isEmpty() ? len - 1 : Math.min(Integer.parseInt(endStr), len - 1);
                }
                if (start >= 0 && start < len && end >= start) {
                    int count = end - start + 1;
                    headers.put("Content-Range", "bytes " + start + "-" + end + "/" + len);
                    headers.put("Content-Length", String.valueOf(count));
                    return new WebResourceResponse(mime, encoding, 206, "Partial Content",
                            headers, new ByteArrayInputStream(data, start, count));
                }
            } catch (NumberFormatException ignored) {
                // fall through and send the whole file
            }
        }
        headers.put("Content-Length", String.valueOf(len));
        return new WebResourceResponse(mime, encoding, 200, "OK", headers, new ByteArrayInputStream(data));
    }

    private WebResourceResponse notFound() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                headers, new ByteArrayInputStream(new byte[0]));
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) != -1) {
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }

    private static String mimeFor(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot >= 0 ? path.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
        switch (ext) {
            case "html": return "text/html";
            case "js": return "text/javascript";
            case "css": return "text/css";
            case "json": return "application/json";
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "gif": return "image/gif";
            case "webp": return "image/webp";
            case "svg": return "image/svg+xml";
            case "ico": return "image/x-icon";
            case "wav": return "audio/wav";
            case "mp3": return "audio/mpeg";
            case "ogg": return "audio/ogg";
            case "ttf": return "font/ttf";
            case "otf": return "font/otf";
            case "woff": return "font/woff";
            case "woff2": return "font/woff2";
            default: return "application/octet-stream";
        }
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUi();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        web.evaluateJavascript("window.__lkResume&&window.__lkResume()", null);
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript("window.__lkPause&&window.__lkPause()", null);
        web.pauseTimers();
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
        }
        super.onDestroy();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        new AlertDialog.Builder(this)
                .setTitle("Exit Ludo King?")
                .setMessage("Do you want to close the game?")
                .setPositiveButton("Yes", (dialog, which) -> finish())
                .setNegativeButton("No", null)
                .show();
    }
}
