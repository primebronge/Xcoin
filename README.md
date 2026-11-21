# Ludo King - APK (GitHub Actions)

Ei repo te Ludo King game (`www/`) ke Capacitor diye Android APK banano hoy. APK GitHub er server e build hoy, tomar PC te kichu install korte hoy na.

## Kivabe APK banabe
1. GitHub e notun repository banao (jemon `ludo-king`).
2. Ei folder er **shob file** (`.github` folder shoho) repo te upload koro. Web e: *Add file -> Upload files*, shob file/folder drag kore dao -> *Commit changes*.
   - Jodi `.github` folder upload na hoy (hidden folder), tahole *Add file -> Create new file* e giye naam e `.github/workflows/build-apk.yml` likhe oi file er content paste koro.
3. Repo er **Actions** tab e jao -> *Build Ludo King APK* -> build shesh hoite ~5-8 min lage.
   (Push korlei auto start hoy. Na hole *Run workflow* button chaPo.)
4. APK pabe 2 jaygay:
   - repo er **Releases** (dan pashe) -> `Ludo-King.apk` (phone theke download kora shohoj)
   - Actions -> oi run -> **Artifacts** -> `Ludo-King-APK`
5. Phone e APK install koro (Unknown sources allow korte hote pare).

## Ki ki ase
- App name: **Ludo King**, icon: `resources/icon_l.png` theke banano (shob size er launcher icon + splash).
- Portrait, fullscreen, screen on thake. Android back button: match e exit popup, menu te age-r screen e jay, home e app bondho.
- Firebase SDK build er somoy download hoye APK te dhoke (offline e o cholbe); download fail hole CDN theke load hobe.
- Game er kaj `www/` folder e. Game er notes: `GAME_NOTES.md`.

## Kichu bodlate chaile
- Package id / app name: `capacitor.config.json` (`appId`, `appName`).
- Game update: `www/` er file bodlao, commit koro -> notun APK auto build hobe.
- Icon bodlate: `resources/android/res/mipmap-*` er PNG gulo replace koro.

## Signing (jante rakho)
APK ta *debug key* (`signing/debug.keystore`, public standard key) diye sign kora. Phone e install/update er jonno ei-i jothesto, ar protibar same key tai notun build purono tar upor update hoy. Play Store e dite chaile alada private release key lagbe.
