# Ludo King - APK banano (GitHub Actions diye)

App info: **Ludo King** | package `com.pb.ludoking` | version **11.2** (versionCode 112) | portrait

## Kibhabe APK banabe

1. GitHub e notun repository kholo (Private rakhle bhalo).
2. Ei folder er **shob file** (hidden `.github` folder shoho) repo te push koro:
   ```bash
   git init
   git add .
   git commit -m "Ludo King 11.2"
   git branch -M main
   git remote add origin https://github.com/<tomar-username>/<repo-name>.git
   git push -u origin main
   ```
   > Browser e drag-drop korle `.github` folder miss hote pare. Tokhon GitHub e
   > **Add file -> Create new file** e path `.github/workflows/build-apk.yml` likhe
   > oi file er content paste koro.
3. Push korlei build shuru hoy. Na hole: repo -> **Actions** -> **Build Ludo King APK** -> **Run workflow**.
4. ~5-10 minute por build sesh hole oi run e dhukle niche **Artifacts** e `LudoKing-11.2-apk` pabe. Download kore zip khulle APK.
5. Phone e install: APK ta phone e pathao, "Install unknown apps" allow koro.

Output:
- `LudoKing-11.2-debug.apk` - shob shomoy toiri hoy, shoja install kora jay.
- `LudoKing-11.2.apk` - signed release; shudhu niche er secrets dile toiri hoy.

## Version bodlano
`.github/workflows/build-apk.yml` er upore `APP_VERSION_NAME` ar `APP_VERSION_CODE` (code protibar baraite hobe, jemon 11.3 -> 113). Package name / app name: `capacitor.config.json`.

## Logo bodlano
`resources/android/mipmap-*/ic_launcher.png` ar `ic_launcher_round.png` replace koro
(48 / 72 / 96 / 144 / 192 px). Original logo: `resources/icon.png`.

## Signed release APK (optional)
Play Store ba update-compatible APK er jonno nijer keystore lagbe. Ekbar banao, **hariye felo na** (hariye gele update dewa jabe na):
```bash
keytool -genkeypair -v -keystore ludoking.jks -alias ludoking -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 ludoking.jks    # Mac e: base64 -i ludoking.jks
```
Repo -> Settings -> Secrets and variables -> Actions e 4 ta secret:
`KEYSTORE_BASE64` (uporer output), `KEYSTORE_PASSWORD`, `KEY_ALIAS` (= ludoking), `KEY_PASSWORD`.

## Notes
- Firebase SDK build er somoy download hoye APK te bundle hoy (net na thakleo local game cholbe).
- `js/firebase-config.js` e tomar Firebase config ase. Realtime Database er rules ekhon shobar jonno khola (`.read/.write: true`) - public app e dile rules tight kora uchit.
- Build fail hole Actions e fail howa step er log copy kore pathao.
