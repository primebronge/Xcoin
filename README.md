# Ludo King - Android project

A ready-to-build Android app (full screen WebView) that contains your Ludo game.
App name: **Ludo King**. Launcher icon: your `icon_l.png`, already resized for every screen density.
Package id: `com.ludoking.app`. Portrait only. Needs Android 5.0+ (API 21).

## Easiest way: get the APK from GitHub (nothing to install)

1. Create a free GitHub account and a new repository (private is fine).
2. Upload everything in this folder, **including the hidden `.github` folder**.
   Dragging the folder onto the GitHub upload page works. If `.github` is missing, use
   "Add file > Create new file", type `.github/workflows/build-apk.yml` as the name
   and paste the content of that file.
3. Open the **Actions** tab. The "Build Ludo King APK" job starts by itself
   (or press "Run workflow"). It takes about 3 to 5 minutes.
4. Open the finished run, scroll to **Artifacts**, download **Ludo-King-APK**, unzip it
   and you have `Ludo-King.apk`. Send it to your phone and install it
   (allow "Install unknown apps" when asked).

## Or: build with Android Studio

1. Install Android Studio, choose **Open** and select this folder. Wait for Gradle sync.
2. Open **Build > Select Build Variant** and choose **release**.
3. **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. The APK is at `app/build/outputs/apk/release/app-release.apk`.

## Updating the game later

Replace the files inside `app/src/main/assets/www/` (index.html, css, js, assets) with
the new version of your game and build again. Raise `versionCode` in `app/build.gradle`
each time so the new APK installs over the old one.

## Notes

- Online / Firebase features need an internet connection, same as the website.
  Firebase scripts load from Google's CDN. To bundle them, put
  `firebase-app-compat.js` and `firebase-database-compat.js` in `app/src/main/assets/www/lib/`.
- `app/ludoking.jks` is a ready signing key (password `ludoking123`) so every build
  has the same signature. It is fine for sharing the APK directly. For Google Play,
  generate your own private key and replace it.
- Back button asks "Exit Ludo King?". Music pauses when the app goes to the background.
