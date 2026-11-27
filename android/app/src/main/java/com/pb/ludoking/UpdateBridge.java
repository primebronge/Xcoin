package com.pb.ludoking;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.webkit.JavascriptInterface;

import androidx.core.content.pm.PackageInfoCompat;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * JavaScript <-> Android bridge, available in the game as  window.AndroidApp
 * Used by js/update.js : download the new APK, then ask Android to install it.
 */
public class UpdateBridge {

    private final MainActivity act;
    private volatile boolean cancelled = false;
    private volatile boolean busy = false;
    private volatile File apk = null;

    UpdateBridge(MainActivity activity) {
        this.act = activity;
    }

    File apkFile() {
        return apk;
    }

    // ---- small helpers --------------------------------------------------------------------

    private long installedVersionCode() {
        try {
            PackageInfo pi = act.getPackageManager().getPackageInfo(act.getPackageName(), 0);
            return PackageInfoCompat.getLongVersionCode(pi);
        } catch (Exception e) {
            return 0;
        }
    }

    private void state(String s, String msg) {
        act.js("window.__upd&&window.__upd.onState(" + JSONObject.quote(s) + "," + JSONObject.quote(msg == null ? "" : msg) + ")");
    }

    // ---- exposed to JavaScript ------------------------------------------------------------

    @JavascriptInterface
    public String getVersionName() {
        try {
            return act.getPackageManager().getPackageInfo(act.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public void exitApp() {
        act.runOnUiThread(act::finishAndRemoveTask);
    }

    /** Download the APK from url (https only) with progress, then open the installer. */
    @JavascriptInterface
    public synchronized void startUpdate(final String url) {
        if (busy) return;
        busy = true;
        cancelled = false;
        new Thread(() -> {
            try {
                download(url);
            } catch (CancelledException ce) {
                state("cancelled", "");
            } catch (Exception e) {
                String m = e.getMessage();
                state("error", m == null || m.isEmpty() ? e.getClass().getSimpleName() : m);
            } finally {
                busy = false;
            }
        }, "ludo-update").start();
    }

    @JavascriptInterface
    public void cancelUpdate() {
        cancelled = true;
    }

    /** Open the Android installer for the already-downloaded APK (also asks for the install permission). */
    @JavascriptInterface
    public void installUpdate() {
        act.runOnUiThread(act::tryInstall);
    }

    @JavascriptInterface
    public boolean hasDownloadedUpdate() {
        File f = apk;
        return f != null && f.exists();
    }

    // ---- download -------------------------------------------------------------------------

    private static class CancelledException extends IOException { }

    private void download(String urlStr) throws IOException {
        File dir = new File(act.getFilesDir(), "updates");
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create download folder");
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
            f.delete();
        apk = null;

        URL url = new URL(urlStr);
        if (!"https".equalsIgnoreCase(url.getProtocol())) throw new IOException("Update link must start with https://");

        File tmp = new File(dir, "update.tmp");
        File out = new File(dir, "update.apk");
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        try {
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(true);
            c.setRequestProperty("User-Agent", "LudoKing-Updater");
            int code = c.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) throw new IOException("Server replied " + code);
            long total = c.getContentLengthLong();
            state("downloading", "");

            try (InputStream in = new BufferedInputStream(c.getInputStream(), 65536);
                 FileOutputStream fo = new FileOutputStream(tmp)) {
                byte[] buf = new byte[32768];
                long done = 0, lastEmit = 0;
                int n;
                while ((n = in.read(buf)) > 0) {
                    if (cancelled) throw new CancelledException();
                    fo.write(buf, 0, n);
                    done += n;
                    long now = System.currentTimeMillis();
                    if (now - lastEmit > 150) {
                        lastEmit = now;
                        act.js("window.__upd&&window.__upd.onProgress(" + done + "," + total + ")");
                    }
                }
                fo.getFD().sync();
                act.js("window.__upd&&window.__upd.onProgress(" + done + "," + (total > 0 ? total : done) + ")");
            }
            if (total > 0 && tmp.length() != total) throw new IOException("Download incomplete, try again");
        } finally {
            c.disconnect();
            if (cancelled && tmp.exists()) //noinspection ResultOfMethodCallIgnored
                tmp.delete();
        }

        // Safety: it must be THIS app (same package) and NEWER than the installed one
        PackageManager pm = act.getPackageManager();
        PackageInfo pi = pm.getPackageArchiveInfo(tmp.getAbsolutePath(), 0);
        if (pi == null || !act.getPackageName().equals(pi.packageName)) {
            //noinspection ResultOfMethodCallIgnored
            tmp.delete();
            throw new IOException("This is not a valid Ludo King update file");
        }
        if (PackageInfoCompat.getLongVersionCode(pi) <= installedVersionCode()) {
            //noinspection ResultOfMethodCallIgnored
            tmp.delete();
            throw new IOException("The update file is not newer than the installed app (" + pi.versionName + ")");
        }
        if (!tmp.renameTo(out)) throw new IOException("Cannot save the update file");
        apk = out;

        state("downloaded", "");
        act.runOnUiThread(act::tryInstall);
    }
}
