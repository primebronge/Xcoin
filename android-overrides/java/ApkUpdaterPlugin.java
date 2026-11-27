package com.pb.ludoking;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * In-app update helper (JS name: "ApkUpdater").
 *
 *  getVersion()        -> { versionName, versionCode }   (installed app)
 *  download({url})     -> downloads the APK to cache/update, fires "progress" events
 *  install()           -> opens the system installer. If "Install unknown apps" is not
 *                         allowed yet it opens that settings page and returns
 *                         { status: "needs_permission" }; when the player comes back
 *                         with the permission granted the installer starts by itself.
 */
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private volatile boolean downloading = false;
    private volatile boolean pendingInstall = false;

    private File apkFile() {
        File dir = new File(getContext().getCacheDir(), "update");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return new File(dir, "LudoKing-update.apk");
    }

    @SuppressWarnings("deprecation")
    private long codeOf(PackageInfo pi) {
        if (Build.VERSION.SDK_INT >= 28) {
            return pi.getLongVersionCode();
        }
        return pi.versionCode;
    }

    @SuppressWarnings("deprecation")
    private PackageInfo installedInfo() throws Exception {
        Context ctx = getContext();
        return ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
    }

    @SuppressWarnings("deprecation")
    private PackageInfo archiveInfo(File f) {
        return getContext().getPackageManager().getPackageArchiveInfo(f.getAbsolutePath(), 0);
    }

    private boolean canInstall() {
        return Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
    }

    /** Remove a leftover download from an earlier update (already installed or broken). */
    @Override
    public void load() {
        try {
            File f = apkFile();
            File part = new File(f.getPath() + ".part");
            if (part.exists()) {
                part.delete();
            }
            if (f.exists()) {
                PackageInfo a = archiveInfo(f);
                if (a == null || codeOf(a) <= codeOf(installedInfo())) {
                    f.delete();
                }
            }
        } catch (Exception ignored) {
        }
    }

    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            PackageInfo pi = installedInfo();
            JSObject ret = new JSObject();
            ret.put("versionName", pi.versionName);
            ret.put("versionCode", codeOf(pi));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("version_failed");
        }
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) {
            call.reject("bad_url");
            return;
        }
        if (downloading) {
            call.reject("busy");
            return;
        }
        downloading = true;

        new Thread(() -> {
            HttpURLConnection c = null;
            try {
                // follow redirects by hand (GitHub releases redirect to another host)
                String cur = url;
                int hops = 0;
                while (true) {
                    c = (HttpURLConnection) new URL(cur).openConnection();
                    c.setInstanceFollowRedirects(false);
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(30000);
                    c.setRequestProperty("User-Agent", "LudoKing-Updater");
                    int code = c.getResponseCode();
                    if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                        String loc = c.getHeaderField("Location");
                        c.disconnect();
                        if (loc == null || ++hops > 6) {
                            throw new Exception("redirect_failed");
                        }
                        cur = new URL(new URL(cur), loc).toString();
                        continue;
                    }
                    if (code != 200) {
                        throw new Exception("http_" + code);
                    }
                    break;
                }

                long total = c.getContentLengthLong();
                File out = apkFile();
                File part = new File(out.getPath() + ".part");
                if (part.exists()) {
                    part.delete();
                }

                InputStream in = c.getInputStream();
                OutputStream os = new FileOutputStream(part);
                byte[] buf = new byte[32768];
                long done = 0;
                int n;
                int lastPct = -1;
                long lastT = 0;
                try {
                    while ((n = in.read(buf)) != -1) {
                        os.write(buf, 0, n);
                        done += n;
                        int pct = total > 0 ? (int) (done * 100 / total) : -1;
                        long now = System.currentTimeMillis();
                        if (pct != lastPct && now - lastT > 150) {
                            lastPct = pct;
                            lastT = now;
                            JSObject p = new JSObject();
                            p.put("percent", pct);
                            p.put("loaded", done);
                            p.put("total", total);
                            notifyListeners("progress", p);
                        }
                    }
                    os.flush();
                } finally {
                    os.close();
                    in.close();
                }

                if (total > 0 && done != total) {
                    part.delete();
                    throw new Exception("incomplete");
                }
                if (out.exists()) {
                    out.delete();
                }
                if (!part.renameTo(out)) {
                    throw new Exception("rename_failed");
                }

                // must be a valid APK of this very app
                PackageInfo a = archiveInfo(out);
                if (a == null || !getContext().getPackageName().equals(a.packageName)) {
                    out.delete();
                    throw new Exception("bad_apk");
                }

                JSObject p = new JSObject();
                p.put("percent", 100);
                p.put("loaded", done);
                p.put("total", done);
                notifyListeners("progress", p);

                JSObject ret = new JSObject();
                ret.put("size", done);
                call.resolve(ret);
            } catch (Exception e) {
                String m = e.getMessage();
                call.reject(m == null ? "download_failed" : m);
            } finally {
                downloading = false;
                if (c != null) {
                    c.disconnect();
                }
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        File f = apkFile();
        if (!f.exists()) {
            call.reject("no_file");
            return;
        }
        JSObject ret = new JSObject();
        if (!canInstall()) {
            pendingInstall = true;
            try {
                if (Build.VERSION.SDK_INT >= 26) {
                    Intent i = new Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + getContext().getPackageName()));
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(i);
                }
            } catch (Exception ignored) {
            }
            ret.put("status", "needs_permission");
            call.resolve(ret);
            return;
        }
        pendingInstall = false;
        if (launchInstaller(f)) {
            ret.put("status", "installing");
            call.resolve(ret);
        } else {
            call.reject("install_failed");
        }
    }

    /** Back from the "Install unknown apps" screen: continue the update automatically. */
    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (pendingInstall && canInstall()) {
            pendingInstall = false;
            File f = apkFile();
            if (f.exists() && launchInstaller(f)) {
                notifyListeners("installing", new JSObject());
            }
        }
    }

    private boolean launchInstaller(File f) {
        try {
            Context ctx = getContext();
            Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
