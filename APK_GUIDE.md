# Ludo King - APK + auto update guide

App: **Ludo King** | package: `com.pb.ludoking` | logo: `www/assets/img/icon.png` | intro: `www/assets/ui/pb_intro.mp4`
Current version: see `www/js/version.js` (now **14**, latest in README.md)

## Folders
| Folder | What |
|---|---|
| `www/` | The game (index.html, css, js, assets). `admin.html` is NOT here (removed on purpose). |
| `android/` | Android app shell (intro video, WebView, update download/install, back button). |
| `.github/workflows/build-apk.yml` | GitHub builds the APK for you. |
| `docs/` | `firebase-structure.png` (Firebase layout) and your original `apk.txt`. |

## 1. Build the APK on GitHub (first time)
1. Make a new GitHub repository (**Private** is better, see "Signing key" below).
2. Upload everything in this folder (keep the folders, including the hidden `.github` folder).
3. Open the **Actions** tab. The workflow **Build Ludo King APK** starts by itself (or press *Run workflow*).
4. When it is green, open the run and download **Ludo_King_v14** from *Artifacts* - that zip contains the APK.

## 2. Firebase (one time)
Realtime Database > **Rules** - the update check reads `system`, so it must be readable (keep your existing `rooms` rule):
```json
{
  "rules": {
    "rooms":  { ".read": true, ".write": true },
    "system": { ".read": true, ".write": false }
  }
}
```
Realtime Database > **Data** - add (see `docs/firebase-structure.png`):
```
system
  ├─ version : "14.1 (Fix sounds)"      <- number first, short note in ( ) is optional
  └─ url     : "https://.../Ludo_King_v14.1.apk"   <- direct https download link of the APK
```
Firebase config of the game is in `www/js/firebase-config.js`.

## 3. Publish an update
1. Change the game. Bump `APP_VERSION` in `www/js/version.js` (e.g. `'14.1'` for a patch, `'15'` for an OB update) and add a note to `README.md`.
2. Push to GitHub, then create a tag with the same number, e.g. `v14.1` (`git tag v14.1 && git push --tags`, or GitHub > Releases > new release with that tag).
   The workflow builds `Ludo_King_v14.1.apk` and attaches it to the Release.
3. Copy the APK's download link from the Release (right-click the file > copy link) into Firebase `system/url`, then set `system/version` to `14.1 (note)`.
   **Set the version last** - players are notified the moment `version` changes.

## 4. How the update works in the game
| Firebase version vs installed | Type | What the player sees |
|---|---|---|
| same or lower | - | nothing |
| 14 -> **14.1**, 14.2 ... (same first number) | Patch | popup **Update / Later**. Later = keep playing (asked again next time the app opens). |
| 14 -> **15** (bigger first number) | OB | popup **Update** only. Cannot play, Back does not close it. |

* Player **offline** when opening the game = no check (unless an OB update was already seen, see next line).
* Player was online, an **OB update** appeared, then goes offline and opens the game again = the OB popup comes back (it is remembered). They must connect to the internet and update.
* If an OB update is published while someone is already playing online, the popup appears right away.
* Update flow: tap **Update** > download with progress bar > the app asks (once) to *allow installing apps from Ludo King* > Android's installer opens > tap **Install**.
  Android never allows an app to install silently, so that last Android "Install" screen always appears.

## 5. Phone behaviour (from apk.txt)
* Intro video plays full screen first, then the game opens (status bar visible, game starts below the notch, not full screen).
* Screen stays on while the game is open.
* Portrait only.
* **Back button**: closes popups / goes back one screen / in a match asks "Exit match?". On the **game home screen press Back twice to exit the app**.

## 6. Good to know
* **Signing key**: `android/app/ludoking.jks` is used for every build. A new APK can only install over the old one if it is signed with the *same* key, so never delete or change it.
  Because the key is in the repo, keep the repo **private**. (To use your own key: replace the file and set GitHub secrets / env vars `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.)
* The update link must be **https** and a **direct file link** (GitHub Release links work; Google Drive / Mega page links do not).
* The app checks the downloaded file: it must be Ludo King and **newer** than the installed one. If you forget to bump `version.js`, the player sees "The update file is not newer".
* version.js `14.1` -> versionCode 14001, `15` -> 15000 (patch number must stay under 1000).
* The workflow downloads the Firebase SDK into `www/lib` so the APK has it offline (if that fails, the game loads it from the CDN like before).
* Build on your own PC (optional): JDK 17 + Android SDK + Gradle 8.9, then `cd android && gradle assembleRelease` (APK: `android/app/build/outputs/apk/release/`).
