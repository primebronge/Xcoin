# Ludo King – APK build (GitHub Actions)

Ei project e game er shob file `www/` folder e ache. `android/` folder ta oi game ke ekta full-screen WebView app e muri dey,
ar `.github/workflows/build-apk.yml` GitHub er server e APK banay. Tomar computer e Android Studio lagbe na.

## APK banabo kibhabe (ekbar-i setup)

1. GitHub e notun repository banao (Public ba Private, duitai cholbe). Nam jekono.
2. Ei zip extract kore **pura folder er shob kichu** repository te upload koro
   (repo page → **Add file → Upload files** → extract kora folder er bhitorer shob file/folder drag kore dao → **Commit changes**).
3. **`.github` folder ta upload hoyeche kina dekho.** Na hole (hidden folder boliye onek somoy ta upload hoy na):
   - **Add file → Create new file**
   - File name e lekho: `.github/workflows/build-apk.yml`
   - `build-apk.yml.txt` file ta khule tar shob content copy kore ekhane paste koro → **Commit**
4. Repository er **Actions** tab e jao → left e **Build APK** → **Run workflow** (green button).
   (Prothom bar "I understand my workflows, go ahead and enable them" dekhale oita click koro.)
5. 3–6 minute por build shesh hole APK pabe duibhabe:
   - Repo er home page er daan side e **Releases → Ludo King build N → Ludo-King.apk** (phone theke sorasori download kora jay), ba
   - Actions → oi run → niche **Artifacts → Ludo-King-APK** (zip, bhitore apk).
6. Phone e APK ta khule install koro (prothombar "Install unknown apps" allow korte hobe).

Pore game e kichu bodlale (jemon `www/js/game.js`) file ta GitHub e replace/commit korlei notun APK nijei toiri hoy.
Notun APK purono tar upor update hishebe install hoy (uninstall lage na).

## Kothay ki bodlabe

| Ki | Kothay |
|---|---|
| App er nam (phone e jeta dekhay) | `android/app/src/main/res/values/strings.xml` |
| Game er code / sound / chhobi | `www/` folder |
| Firebase config (online er jonno) | `www/js/firebase-config.js` |
| App icon | `android/app/src/main/res/mipmap-*/ic_launcher*.png` ar `drawable-nodpi/ic_launcher_foreground.png`, `ic_launcher_background.png` |
| Version name | `android/app/build.gradle` → `versionName` |
| Package id (`com.sck.ludolite`) | `android/app/build.gradle` (`namespace`, `applicationId`) + `AndroidManifest.xml`/`java/...` er folder nam ek-i rakhte hobe |

## Signing (keystore)

- Repo te `android/app/sideload.keystore` ache (password `ludoking`, alias `ludo`). Eta shudhu nijer/bondhuder phone e sideload korar jonno; sobai eta dekhte pay.
- Play Store e dite chaile nijer keystore banao ar GitHub → Settings → Secrets and variables → Actions e ei 4 ta secret dao:
  `KEYSTORE_BASE64` (keystore file er base64: `base64 -w0 my.keystore`), `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.
  Workflow oi secret thakle nijei oita use kore.
- Play Store er jonno aro lagbe: nijer unique nam + icon, `targetSdk` 35+ (`android/app/build.gradle`), ar privacy policy.

## Jani rakhar moto

- Game offline-e cholbe (Pass n Play). Online / Friends / Team Up room er jonno internet lagbe.
- Back button: game er bhitore menu/confirm dekhay, home e thakle app bondho hoy.
- Screen portrait e lock kora ar status bar/nav bar lukano (swipe korle ashe).
- Build fail hole Actions → fail howa run → **Build release APK** step er log pathao, dekhe thik kore dibo.
