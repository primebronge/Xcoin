#!/usr/bin/env bash
# `npx cap add android` er por run hoy: version, icon, portrait, splash set kore.
set -euo pipefail

VERSION_NAME="${APP_VERSION_NAME:-11.2}"
VERSION_CODE="${APP_VERSION_CODE:-112}"
APP="android/app"
RES="$APP/src/main/res"
MANIFEST="$APP/src/main/AndroidManifest.xml"
GRADLE="$APP/build.gradle"

[ -f "$GRADLE" ] || { echo "android/app/build.gradle nai - age 'npx cap add android' chalao"; exit 1; }

# 1) Version
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/; s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" "$GRADLE"
grep -q "versionCode ${VERSION_CODE}" "$GRADLE" || { echo "versionCode set hoy nai"; exit 1; }
grep -q "versionName \"${VERSION_NAME}\"" "$GRADLE" || { echo "versionName set hoy nai"; exit 1; }

# 2) Launcher icon (tomar logo) - adaptive icon bad, PNG icon use hobe
rm -rf "$RES/mipmap-anydpi-v26"
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p "$RES/mipmap-$d"
  cp "resources/android/mipmap-$d/ic_launcher.png"       "$RES/mipmap-$d/ic_launcher.png"
  cp "resources/android/mipmap-$d/ic_launcher_round.png" "$RES/mipmap-$d/ic_launcher_round.png"
done

# 3) Shudhu portrait
if ! grep -q 'android:screenOrientation' "$MANIFEST"; then
  sed -i 's|<activity|<activity android:screenOrientation="portrait"|' "$MANIFEST"
fi
grep -q 'android:screenOrientation="portrait"' "$MANIFEST" || { echo "portrait lock set hoy nai"; exit 1; }

# 4) Status bar / navigation bar er color game er background er moto
mkdir -p "$RES/values"
cat > "$RES/values/ludo_colors.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ludo_bg">#245489</color>
</resources>
XML
STYLES="$RES/values/styles.xml"
if [ -f "$STYLES" ] && ! grep -q 'android:statusBarColor' "$STYLES"; then
  sed -i 's|<item name="windowNoTitle">true</item>|&\n        <item name="android:statusBarColor">@color/ludo_bg</item>\n        <item name="android:navigationBarColor">@color/ludo_bg</item>|' "$STYLES"
fi

# 5) Default splash (Capacitor er chobi) bad - game er rong + logo
find "$RES" -type f -name 'splash*.png' -delete
mkdir -p "$RES/drawable"
cat > "$RES/drawable/splash.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/ludo_bg"/>
    <item>
        <bitmap android:gravity="center" android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
XML

echo "Android project patched: v${VERSION_NAME} (${VERSION_CODE})"
