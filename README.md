# Ludo King (APK project)

HTML game ta **Capacitor** diye Android app e convert hoy, ar **GitHub Actions** nijei APK banay. Computer e kono kichu install korte hobe na.

- App name: **Ludo King**
- Logo: `resources/logo.png` (icon + splash auto bose jay)
- Package id: `com.primebronge.ludoking`
- Portrait, fullscreen, screen on thake

## APK banabo kibhabe

1. GitHub e notun repository banao (Public hole Releases e shobai download korte pare).
2. Ei folder er **shob file** repository te upload koro. `.github` folder ta obosshoi lagbe, na hole APK build hobe na.
   - Jodi `.github` upload na hoy: GitHub e **Add file → Create new file** → name e likho `.github/workflows/build-apk.yml` → `build-apk.yml` file er content paste koro → Commit.
3. Repository er **Actions** tab e jao. Workflow **Build Ludo King APK** auto cholbe (na cholle: workflow select kore **Run workflow**).
4. 5-10 minute por green tick ashle APK pabe dui jayga e:
   - Repository er right side e **Releases** → `Ludo-King.apk`
   - Actions → oi run → niche **Artifacts** → `Ludo-King-APK` (zip, khulle APK)
5. APK phone e pathao, install koro (Settings e "Install unknown apps" allow korte hote pare).

Notun build e same signing key use hoy, tai purano app uninstall na kore update hishebe install hoy.

## Kichu bodlate chaile

| Ki bodlabe | Kothay |
|---|---|
| Game er code / sound / image | `www/` folder e (`index.html`, `js/`, `css/`, `assets/`) |
| App er name | `capacitor.config.json` → `appName` |
| Package id | `capacitor.config.json` → `appId` |
| Logo | `resources/logo.png` bodlao, tarpor `pip install pillow && python3 scripts/make_icons.py` chalao, ar `resources/android/` upload koro |

Game er rule/notes: `docs/GAME_NOTES.md`

## Jodi build fail kore

Actions → red run → fail howa step e click koro → error er lekha ta pathaw, thik kore dibo.

## Note

Eta debug-signed APK, phone e install kore khelar jonno thik ache. Google Play Store e dite chaile alada release keystore lagbe, ar "Ludo King" name/logo er trademark Gametion er, tai Play Store e dile name ar logo bodlate hobe.
