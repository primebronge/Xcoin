#!/usr/bin/env bash
# Builds the Android project around the game. Run from GitHub Actions (or locally: npm install && bash scripts/prepare-android.sh).
set -euo pipefail
cd "$(dirname "$0")/.."

# 1) Version = latest "(vNN)" heading in README.md
CODE=$(grep -E '^## ' README.md | grep -oE '\(v[0-9]+' | tr -d '(v' | sort -n | tail -1 || true)
if [ -z "${CODE:-}" ]; then echo "ERROR: no '(vNN)' heading found in README.md"; exit 1; fi
NAME="$CODE"
echo "App version: $NAME (versionCode $CODE)"
echo "$CODE" > .apk-version

# 2) Web files -> www/  (only what the game needs)
rm -rf www && mkdir www
cp -r index.html assets css js lib www/
rm -f www/assets/ui/pb_intro.mp4        # not used by the game (24 MB)
# offline copy of the Firebase SDK (optional - the game falls back to the CDN if this fails)
for f in firebase-app-compat firebase-database-compat; do
  curl -fsSL --retry 3 "https://www.gstatic.com/firebasejs/10.12.2/$f.js" -o "www/lib/$f.js" || rm -f "www/lib/$f.js"
done

# 3) Android project (package com.pb.ludoking, name "Ludo King" from capacitor.config.json)
if [ ! -d android ]; then npx cap add android; fi

# 4) Our files: manifest, plugin, MainActivity, icons, theme, file provider paths
APP=android/app/src/main
mkdir -p "$APP/java/com/pb/ludoking"
cp android-overrides/java/*.java "$APP/java/com/pb/ludoking/"
cp android-overrides/AndroidManifest.xml "$APP/AndroidManifest.xml"
cp -r android-overrides/res/. "$APP/res/"
rm -rf "$APP/res/mipmap-anydpi-v26"      # use our own square/round icons from assets/img/icon.png

# 5) versionCode / versionName
GR=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode $CODE/; s/versionName \"[^\"]*\"/versionName \"$NAME\"/" "$GR"
grep -q "versionCode $CODE" "$GR" && grep -q "versionName \"$NAME\"" "$GR" || { echo "ERROR: could not set version in $GR"; exit 1; }

# 6) copy www into the android project
npx cap sync android
echo "Android project ready."
