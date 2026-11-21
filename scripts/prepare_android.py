#!/usr/bin/env python3
"""`npx cap add android` er por cholbe. Generated android/ project ke Ludo King onujayi sajay:
  - logo (launcher icon) + splash screen
  - portrait lock
  - fullscreen (status/navigation bar lukano) + screen on rakha
  - versionCode / versionName (GitHub run number theke)
Protita step alada; kono cosmetic step fail korle warning dey, build thame na."""
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ANDROID = ROOT / "android"
APP = ANDROID / "app"
MAIN = APP / "src" / "main"
RES = MAIN / "res"
SRC_RES = ROOT / "resources" / "android" / "res"


def icons_and_splash():
    # Template er purano icon/splash muche felo, jate duplicate resource error na hoy
    for d in RES.glob("mipmap-*"):
        for f in list(d.glob("ic_launcher.*")) + list(d.glob("ic_launcher_round.*")):
            f.unlink()
    for d in RES.glob("drawable*"):
        for f in d.glob("splash.*"):
            f.unlink()
    shutil.copytree(SRC_RES, RES, dirs_exist_ok=True)


def manifest():
    mf = MAIN / "AndroidManifest.xml"
    txt = mf.read_text(encoding="utf-8")
    if "android:screenOrientation" not in txt:
        txt = re.sub(r"<activity\b", '<activity\n            android:screenOrientation="portrait"', txt, count=1)
    mf.write_text(txt, encoding="utf-8")


def main_activity():
    files = list((MAIN / "java").rglob("MainActivity.java"))
    if not files:
        raise RuntimeError("MainActivity.java paoa jayni (Kotlin hole skip)")
    f = files[0]
    pkg = re.search(r"^\s*package\s+([\w.]+)\s*;", f.read_text(encoding="utf-8"), re.M).group(1)
    f.write_text(
        f"""package {pkg};

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        // Game cholar somoy screen off hobe na
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // Notch er pashe-o fullscreen
        if (Build.VERSION.SDK_INT >= 28) {{
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }}
        hideSystemBars();
    }}

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {{
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {{
            hideSystemBars();
        }}
    }}

    private void hideSystemBars() {{
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }}
}}
""",
        encoding="utf-8",
    )


def version():
    code = os.environ.get("APP_VERSION_CODE", "1")
    g = APP / "build.gradle"
    t = g.read_text(encoding="utf-8")
    t = re.sub(r"versionCode\s*=?\s*\d+", f"versionCode {code}", t, count=1)
    t = re.sub(r'versionName\s*=?\s*"[^"]*"', f'versionName "1.0.{code}"', t, count=1)
    g.write_text(t, encoding="utf-8")


def main():
    if not APP.exists():
        sys.exit("android/ folder nai. Age `npx cap add android` chalao.")
    ok = True
    for name, fn in [
        ("icon + splash", icons_and_splash),
        ("portrait lock", manifest),
        ("fullscreen + keep screen on", main_activity),
        ("version", version),
    ]:
        try:
            fn()
            print(f"[ok]   {name}")
        except Exception as e:  # cosmetic step, build cholte dao
            ok = False
            print(f"[warn] {name}: {e}")
    print("done" if ok else "done (kichu step skip hoyeche)")


if __name__ == "__main__":
    main()
