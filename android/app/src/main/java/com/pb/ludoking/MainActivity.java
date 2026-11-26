package com.pb.ludoking;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Ludo King - game (HTML/JS) ekta WebView er moddhe chole.
 * Game file gulo APK er assets/www te thake, https://appassets.androidplatform.net/app/ theke load hoy
 * (tai fetch / Web Audio / Firebase shob browser er moto kaj kore).
 *
 * Update system: js/native.js Firebase (system/version, system/url) check kore popup dekhay,
 * "UPDATE" chaple LudoNative.startUpdate(url) -> APK download -> install permission -> install.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/app/index.html";

    private WebView web;
    private WebViewAssetLoader loader;

    // ---- update state ----
    private volatile boolean downloading = false;
    private File readyApk = null;       // download + verify hoye gese, install er opekkhay
    private String readyUrl = null;
    private boolean waitingPermission = false;
    private boolean waitingInstaller = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        // purono downloaded update APK muche dao (notun version cholar por ar lage na)
        new Thread(new Runnable() {
            @Override
            public void run() {
                cleanUpdateDir();
            }
        }, "update-clean").start();

        final WebViewAssetLoader.AssetsPathHandler assets = new WebViewAssetLoader.AssetsPathHandler(this);
        loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/app/", new WebViewAssetLoader.PathHandler() {
                    @Override
                    public WebResourceResponse handle(String path) {
                        return assets.handle("www/" + path);
                    }
                })
                .build();

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0D3D96"));
        setContentView(web);
        setupWebView();
        hideSystemBars();
        web.loadUrl(START_URL);
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    private void setupWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setHapticFeedbackEnabled(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                return true;
            }
        });

        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        web.addJavascriptInterface(new Bridge(), "LudoNative");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNav(request.getUrl());
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNav(Uri.parse(url));
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        recreate();
                    }
                });
                return true;
            }
        });
    }

    /** game er nijer page hole WebView e thakbe, onno link browser e khulbe. */
    private boolean handleNav(Uri u) {
        if (u == null) return true;
        if (HOST.equals(u.getHost())) return false;
        String sc = u.getScheme();
        if ("http".equals(sc) || "https".equals(sc) || "mailto".equals(sc)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (Exception ignored) {
            }
        }
        return true;
    }

    // =====================================================================
    //  JavaScript bridge  (window.LudoNative)
    // =====================================================================
    private class Bridge {
        @JavascriptInterface
        public String getVersionName() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                return pi.versionName == null ? "" : pi.versionName;
            } catch (Exception e) {
                return "";
            }
        }

        @SuppressWarnings("deprecation")
        @JavascriptInterface
        public int getVersionCode() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                return Build.VERSION.SDK_INT >= 28 ? (int) pi.getLongVersionCode() : pi.versionCode;
            } catch (Exception e) {
                return 0;
            }
        }

        @JavascriptInterface
        public void startUpdate(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    beginUpdate(url);
                }
            });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        }
    }

    /** JS e event pathay: window.LudoUpdate.onNative(type, data) */
    private void sendJs(String type, String data) {
        final String js = "window.LudoUpdate&&window.LudoUpdate.onNative(" + q(type) + "," + q(data) + ")";
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) web.evaluateJavascript(js, null);
            }
        });
    }

    private static String q(String s) {
        if (s == null) s = "";
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ").replace("\r", " ") + "'";
    }

    // =====================================================================
    //  In-app update: download -> verify -> install permission -> install
    // =====================================================================
    private File updateDir() {
        File base = getExternalFilesDir(null);
        if (base == null) base = getFilesDir();
        return new File(base, "updates");
    }

    private void cleanUpdateDir() {
        try {
            File[] fs = updateDir().listFiles();
            if (fs != null) {
                for (File f : fs) {
                    //noinspection ResultOfMethodCallIgnored
                    f.delete();
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void beginUpdate(final String url) {
        if (downloading) return;
        if (url == null || !url.startsWith("https://")) {
            sendJs("error", "bad_url");
            return;
        }
        // ekoi URL theke age-i download hoye thakle abar download na kore sorasori install
        if (readyApk != null && readyApk.exists() && url.equals(readyUrl)) {
            installApk();
            return;
        }
        downloading = true;
        sendJs("progress", "0");
        new Thread(new Runnable() {
            @Override
            public void run() {
                download(url);
            }
        }, "apk-download").start();
    }

    private void download(String url) {
        File dir = updateDir();
        File part = new File(dir, "update.apk.part");
        File out = new File(dir, "update.apk");
        HttpURLConnection c = null;
        InputStream in = null;
        OutputStream os = null;
        try {
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
            if (part.exists()) //noinspection ResultOfMethodCallIgnored
                part.delete();
            if (out.exists()) //noinspection ResultOfMethodCallIgnored
                out.delete();

            // redirect nijera handle kori (GitHub releases -> objects.githubusercontent.com), shudhu https
            String cur = url;
            for (int i = 0; i < 8; i++) {
                c = (HttpURLConnection) new URL(cur).openConnection();
                c.setInstanceFollowRedirects(false);
                c.setConnectTimeout(15000);
                c.setReadTimeout(20000);
                c.setRequestProperty("Accept-Encoding", "identity");
                c.setRequestProperty("User-Agent", "LudoKing-Updater");
                int code = c.getResponseCode();
                if (code >= 300 && code < 400) {
                    String loc = c.getHeaderField("Location");
                    c.disconnect();
                    c = null;
                    if (loc == null) throw new Exception("redirect");
                    cur = new URL(new URL(cur), loc).toString();
                    if (!cur.startsWith("https://")) throw new Exception("insecure redirect");
                    continue;
                }
                if (code != 200) throw new Exception("http " + code);
                break;
            }
            if (c == null) throw new Exception("too many redirects");

            int total = c.getContentLength();   // -1 hole size jana nai
            if (total <= 0) sendJs("progress", "-1");

            in = c.getInputStream();
            os = new FileOutputStream(part);
            byte[] buf = new byte[32 * 1024];
            long done = 0;
            int last = -1;
            int n;
            while ((n = in.read(buf)) != -1) {
                os.write(buf, 0, n);
                done += n;
                if (total > 0) {
                    int p = (int) (done * 100L / total);
                    if (p != last) {
                        last = p;
                        sendJs("progress", String.valueOf(p));
                    }
                }
            }
            os.flush();
            os.close();
            os = null;
            in.close();
            in = null;

            if (total > 0 && done != total) throw new Exception("incomplete");
            if (done < 1024) throw new Exception("empty");
            if (!part.renameTo(out)) throw new Exception("rename");

            // ei app er-i APK kina check (onno file hole install korbo na)
            PackageInfo info = getPackageManager().getPackageArchiveInfo(out.getAbsolutePath(), 0);
            if (info == null || !getPackageName().equals(info.packageName)) {
                //noinspection ResultOfMethodCallIgnored
                out.delete();
                downloading = false;
                sendJs("error", "bad_apk");
                return;
            }

            readyApk = out;
            readyUrl = url;
            downloading = false;
            sendJs("progress", "100");
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    installApk();
                }
            });
        } catch (Exception e) {
            downloading = false;
            try {
                if (os != null) os.close();
            } catch (Exception ignored) {
            }
            //noinspection ResultOfMethodCallIgnored
            part.delete();
            sendJs("error", "download");
        } finally {
            try {
                if (in != null) in.close();
            } catch (Exception ignored) {
            }
            if (c != null) c.disconnect();
        }
    }

    /** permission na thakle age settings e pathay; thakle sorasori system installer khole. */
    private void installApk() {
        if (readyApk == null || !readyApk.exists()) {
            sendJs("error", "download");
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            waitingPermission = true;
            sendJs("permission", "");
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())));
            } catch (Exception e) {
                waitingPermission = false;
                sendJs("error", "permission_denied");
            }
            return;
        }
        try {
            Uri uri = Build.VERSION.SDK_INT >= 24
                    ? FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", readyApk)
                    : Uri.fromFile(readyApk);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            waitingInstaller = true;
            sendJs("installing", "");
            startActivity(i);
        } catch (Exception e) {
            waitingInstaller = false;
            sendJs("error", "install");
        }
    }

    // =====================================================================
    //  Lifecycle / UI
    // =====================================================================
    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        hideSystemBars();
        if (waitingPermission) {
            waitingPermission = false;
            if (Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls()) {
                installApk();
            } else {
                sendJs("error", "permission_denied");
            }
        } else if (waitingInstaller) {
            // user installer bondho kore ferot esheche (install cancel)
            waitingInstaller = false;
            sendJs("idle", "");
        }
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.removeJavascriptInterface("LudoNative");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    /** Back: age game er JS (popup / screen) handle kore, na korle app bondho. */
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (web == null) {
            finish();
            return;
        }
        web.evaluateJavascript(
                "(function(){try{return window.__ludoBack?window.__ludoBack():false}catch(e){return false}})()",
                new android.webkit.ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"true".equals(value)) finish();
                    }
                });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
}
