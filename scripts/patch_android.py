#!/usr/bin/env python3
"""Runs after `npx cap add android`. Customises the generated Android project:
app name, launcher icon, splash, portrait + fullscreen, back button, version code."""
import glob, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'android', 'app')
MAIN = os.path.join(APP, 'src', 'main')
RES = os.path.join(MAIN, 'res')

def log(msg): print('[patch]', msg, flush=True)

if not os.path.isdir(MAIN):
    sys.exit('android project not found - run "npx cap add android" first')

cfg = json.load(open(os.path.join(ROOT, 'capacitor.config.json'), encoding='utf-8'))
APP_ID, APP_NAME = cfg['appId'], cfg['appName']

def read(p): return open(p, encoding='utf-8').read()
def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)

# 1) icons + splash resources (copied over the generated res/ folder)
for f in glob.glob(os.path.join(RES, 'drawable*', 'splash.*')):
    os.remove(f)                      # remove default Capacitor splash images
src_res = os.path.join(ROOT, 'resources', 'android', 'res')
shutil.copytree(src_res, RES, dirs_exist_ok=True)
log('icons + splash copied')

# 2) app name
sp = os.path.join(RES, 'values', 'strings.xml')
if os.path.exists(sp):
    s = read(sp)
    for key in ('app_name', 'title_activity_main'):
        s = re.sub(r'(<string name="%s">)[^<]*(</string>)' % key, r'\g<1>%s\g<2>' % APP_NAME, s)
    write(sp, s)
    log('app name = %s' % APP_NAME)

# 3) manifest: portrait + internet permission
mp = os.path.join(MAIN, 'AndroidManifest.xml')
m = read(mp)
if 'android:screenOrientation' not in m:
    m = m.replace('<activity', '<activity android:screenOrientation="portrait"', 1)
if 'android.permission.INTERNET' not in m:
    m = m.replace('<application', '<uses-permission android:name="android.permission.INTERNET" />\n    <application', 1)
write(mp, m)
log('manifest patched (portrait)')

# 4) MainActivity: immersive fullscreen, keep screen on, Android back button -> game
pkg_dir = os.path.join(MAIN, 'java', *APP_ID.split('.'))
for old in glob.glob(os.path.join(MAIN, 'java', '**', 'MainActivity.java'), recursive=True):
    os.remove(old)
write(os.path.join(pkg_dir, 'MainActivity.java'), '''package %s;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private OnBackPressedCallback backCb;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
        installBackHandler();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    // Back button: let the game handle it (close popup / go to previous screen); on home -> exit app.
    private void installBackHandler() {
        if (backCb != null) backCb.remove();
        backCb = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                try {
                    getBridge().getWebView().evaluateJavascript(
                        "(function(){try{return window.__ludoBack?window.__ludoBack():false}catch(e){return false}})()",
                        value -> { if (!"true".equals(value)) finish(); });
                } catch (Exception e) {
                    finish();
                }
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCb);
    }
}
''' % APP_ID)
log('MainActivity written')

# 5) version code / name (so each build can update the previous one)
bg = os.path.join(APP, 'build.gradle')
if os.path.exists(bg):
    n = os.environ.get('BUILD_NUMBER', '1')
    g = read(bg)
    g = re.sub(r'versionCode\s+\d+', 'versionCode %s' % n, g, count=1)
    g = re.sub(r'versionName\s+"[^"]*"', 'versionName "1.0.%s"' % n, g, count=1)
    write(bg, g)
    log('versionCode = %s' % n)
log('done')
