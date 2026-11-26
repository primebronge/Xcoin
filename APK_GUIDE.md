# Ludo King - APK build + auto update guide

## 1) APK banano (GitHub diye)
1. GitHub e notun repo khulo, ei folder er **shob kichu** (`.github`, `android`, `index.html`, `js`, `css`, `assets`, `README.md` ...) upload / push koro. Branch: `main`.
2. Repo > **Actions** tab e "Build Ludo King APK" cholbe (nije nije, ba "Run workflow" chap).
3. Shesh hole 2 jaygay APK pabe:
   - Actions > oi run > **Artifacts** (`LudoKing-v13-apk`)
   - Repo > **Releases** > `Ludo King v13` > `LudoKing.apk`

Package: `com.pb.ludoking` | Name: Ludo King | Logo: `assets/img/icon.png`
Version: `README.md` er sob `(vN)` heading er shorbochcho N (ekhon **13**). README te `## Notun (v14)` lekhle APK version 14 hoye jay.
`admin.html` delete kora hoyeche, APK te nai.

## 2) Firebase update system
Realtime Database (`js/firebase-config.js` er `databaseURL`) e ei node banao:

```
system
 ├─ version: "14"
 └─ url: "https://github.com/<USER>/<REPO>/releases/latest/download/LudoKing.apk"
```
- `version` e shudhu number (14, 15 ...). App er version er cheye boro hole popup ashe.
- `url` ekbar boshale-i hoy (`releases/latest/download/...` sobsomoy latest release er APK dey).
- Rules e `system` read allow korte hobe (`rooms` er rules ager moto thakbe):
  `{"rules":{"rooms":{".read":true,".write":true},"system":{".read":true,".write":false}}}`
- Player offline hole kono check hoy na. Online hole app khulle version check hoy, notun version thakle popup > UPDATE > download > install permission > install.

## 3) Notun update dewar niyom
1. Game e change koro, `README.md` te `## Notun (v14): ...` section lekho, GitHub e push koro.
2. Action shesh hole Release e `v14` APK thake.
3. Firebase e `system/version` = `14` kore dao. Player der app e popup ashbe.

## 4) Signing key (khub dorkari)
`android/keystore/ludoking.jks` diye shob APK sign hoy. **Ei file ar `android/app/build.gradle` er password ke thik rakho**; key bodlale purono app er upor update install hobe na. Repo public hole keystore shobai dekhte pabe - private repo bhalo.
