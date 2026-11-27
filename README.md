# Ludo King

Chalate: `index.html` browser e kholo. Local (PASS N PLAY) game internet charai cholbe.

- js/firebase-config.js -> tomar Firebase config (update er somoy ei file bodlano hoy na)
- js/config.js -> shob asset er path (PNG, sound, font, lib). theme.mp3 / start.mp3 dile age oita use hobe, na hole .wav
- assets/img: bg.jpg (shob screen er background), pawn_red/green/yellow/blue.png | assets/sound: theme, start, dice_roll, step, pawn_out, capture, home, win, ui (6 pele alada kono sound baje na)
- lib/ -> offline Firebase SDK (lib/README.txt dekho)

Firebase Rules (test): {"rules":{"rooms":{".read":true,".write":true}}}
Data: rooms/<code>/{playerCount, matchStarted, isLocalMatch, nextDice, players/player0../{name,color}, gameState/{...}}
nextDice shudhu dice dewar somoy generate hoy, guti chalale bodlay na.

## Sound / theme
- assets/sound/theme.mp3 (menu music, loop) ar start.mp3 (match shuru hole) nijer file diye bodlano jay. mp3 thakle oita agey use hoy, na thakle .wav.
- Match shuru hole start sound baje ar theme band hoye jay.

## Local match + Firebase
Net thakle local match o rooms/<3 digit key> e write hoy ar Firebase theke guti nora-chora korle local e dekhay. Net gele locally cholte thake, net ashle abar sync hoy.
nextDice shudhu dice roll er somoy ekbar generate hoy, guti challe bodlay na.

## Layout / scale / performance (v2)
- Game ekta fixed 400 x (780+) "stage" er moddhe cole; js/game.js er `fit()` stage ke screen er size onujayi uniform scale kore. Tai DPI / display size / screen ratio jai hok, sob phone e same look. `DW`/`DH` (game.js) bodlale design size bodlay.
- Page scroll / drag / pull-to-refresh / pinch zoom bondho (home e drag kora jay na).
- Match e board screen er thik majhkhane; upore chal er text (status) nei. Chal bojha jay dice er glow + tir chinh theke.
- Guti `transform` diye chale (GPU), filter nai; background alada fixed layer; sound pool kore bajano hoy (clone kora hoy na).
- Home e shudhu button (ONLINE / TEAM UP / FRIENDS / COMPUTER / PASS N PLAY) er animation ase, baki sob animation bondho.

## Notun rule (v3): Block / Safe ghor + Auto move
- **Block:** ek ghore ek-i player er 2 ba tar beshi guti thakle oi ghor safe. Joto enemy-i ashuk keo kono guti khete pare na, shobai ek ghore boshe thake. Block er guti te sonali ring dekhay.
- **Block bhenge gele:** 2 ta theke 1 ta hole, oi ghore enemy thakle amar bakita auto kheye felbe. Jodi oi ghore alada alada 2+ enemy thake (jemon amar 2 + 2 ta alada enemy = 4), tahole amar bakita ar oi sob enemy single, mot 3 tai-i khawa hoy.
- Star / start ghor age-er moto sobsomoy safe (okhane kono kata-kati nai).
- **Auto move:** dice dewar por jodi mot ekta-i alada chal thake (jemon 4 guti yard e + 6 -> auto ber hoy, ba ekta-i guti norano jay) tahole oi chal auto hoye jay. Tomar shudhu dice dite hobe.
- Code: `js/game.js` er `doMove()` (block logic), `uniq()/autoMv()` (auto move), `draw()` (block ring). Firebase data format bodlay ni.

## Notun rule (v4): Team Up e teammate er guti mile block + 6 er sound bondho
- **Team Up block:** amar ek guti + teammate er ek guti ek ghore thakle oitao block (safe ghor), enemy keo kate na. Ager moto ek-i player er 2 guti thakleo block. Block e sonali ring dekhay.
- Block bhenge gele (jemon ami sore gelam, oi ghore teammate ar enemy ase) → age-er rule onujayi bakita (teammate er guti) khay.
- **Friendly Kill ON** thakle teammate ke-o kata jay, tai teammate er guti mile block hoy na (shudhu ek-i player er 2 guti hole block).
- **6 er sound:** dice e 6 ashle ager extra "six" sound ar baje na (shudhu normal dice roll sound baje).
- Code: `js/game.js` er `side()`, `blk(s,L)`, `doMove()`, `draw()`.

## Notun (v5)
- **3D dice:** dice ekta cube, spin kore sothik face e theme jay. Sobar dice section sobsomoy solid thake, shudhu jar roll tar dice er pase tir ashe.
- **Board:** screenshot er moto - boro star, patla cell border, notun yard (white box + 4 circle). Block er sonali ring shudhu sada ghore (star / safe ghore ring nai).
- **Ghor theke ber:** 6 pele guti ghor theke nijer hate tap kore ber korte hoy. Onno kono chal na thakle ekta-i chal auto hoy.
- **safe sound:** star / safe ghore guti gele `assets/sound/safe.mp3` baje (file na dile built-in sound). Tomar `safe.mp3` ta ekhane rakho.
- **6 er chance:** chalar moto guti nai (sob ghore / finish) + 4 bar 6 na hole porer proti roll e 6 er chance bare, 6 na asha porjonto.
- **Menu (3 line, upore):** Mute/Unmute + Remove player (player select -> confirm). Remove hole oi player er ghore `assets/img/player_left.png` logo dekhay, bakira match chalay. (Team Up / Computer e remove nai)
- **COMPUTER:** offline AI. 2/3/4 jon select kora jay, opponent sob AI. Firebase e kichu lekha hoy na.
- Pass N Play theke 5P / 6P button soriye deya hoyeche.

## Notun (v6)
- **Board arrow:** ghore dhokar rastar 4 ta arrow ekhon SVG (font charai), choto, cell er thik majhkhane (ar kono device e niche/baye soren na).
- **Dice tray:** screenshot er moto - dice ghor boro, majhkhane curve, guti ghor choto. Tray er guti ar board er guti ekoi PNG (`assets/img/pin_*.png`). Dice er dot mota ar garo kalo.
- **Shudhu jar chal tar dice:** baki der dice invisible (faka ghor thake). Guti gulo screenshot er moto boro kora hoyeche.
- **ONLINE (1 vs 1 matchmaking):** ONLINE button e click korle searching screen ashe. Onno keu ONLINE e click korle auto match hoy. Keu na thakle khujte thake; match hoye gele 3rd jon notun opponent khuje. Firebase path: `rooms/onlineMatchmaking/{waitingPlayer, matchAssignments}` (`rooms` er moddhe, tai rules bodlate hobe na). Online e Break Safe sobsomoy ON.
- **Break Safe:** ON thakle, dice er point guti te challe jodi guti ghore (home column) dhuke, guti te tap korle popup ashe. Sobuj tir = ghore dhuko, Lal tir = kaca (guti yard e fire jay). Ekbar ghore dhukle ar kaca kora jay na. Computer (AI) sobsomoy ghore dhuke.
  - Team Up / Pass N Play / Computer: start dewar age "Break Safe" tick option.
  - FRIENDS (Custom match): lobby te "Break Safe" tick, shudhu host change korte pare.
  - Firebase: `breakSafeEnabled` (room + gameState). Code: `goesHome()`, `tap()`, `openBS()`, `doMove(s,t,brk)` in `js/game.js`.

## Notun (v7)
- **Break Safe, Lal tir (kaca):** guti yard e jay na. Ghore (home road) na dhuke main track e dice er point onujayi cholte thake, abar full round ghure ashe. Second round er gate e abar popup ashe. Ghore dhukle ar kaca kora jay na. Code: `dest()`, `steps()`, `goesHome()` (pos 57+ = second round).
- **6 er rule:** ek player er kokhono por por 3 bar 6 hobe na. 2 bar 6 hole porer dice 1-5.
- **Dice:** 5 ar 6 er dot ektu choto.
- **Online + Custom match timer (30s):** dice dewar jonno 30s, guti chalar jonno 30s. Jar chal tar guti er chardike circle progress. Roll korle timer abar 30s. 30s e roll na korle hat next player er; roll kore guti na chalale hat cancel hoye next player dice dey. Duration: `TT` (game.js).
- **Back / offline:** 1v1 e opponent auto win. 4 player e oi player match theke bad (board e "player left" logo). Back dile sathe sathe, offline hole ~8-30s e. Team Up e ek jon gele oi team harbe.
- **Crown:** shudhu 1st, 2nd, 3rd (last place = lost, crown nai). Number boro kore white + brown outline.
- **Firebase auto cleanup:** match shesh / cancel / sob player offline hole room remove. Match cholar somoy heartbeat (`lastActivityServerTime`, `presence`). Jekono client (app khulle + 5 min por por) bash hoye thaka room (60s er beshi inactive) ar purono room (heartbeat field nai) muche dey.
- **Net off -> on glitch fix:** Firebase SDK load ar sync ar `navigator.onLine` er upor nirbhor kore na, fail hole 2.5s por por abar chesta kore.
- **Profile:** main menu er upor-baam er avatar e click kore naam dao. Online match ar Custom match e oi naam dekhay (random naam nai).

## Notun (v8)
- **Background:** `assets/img/bg.jpg` shob screen e (home, setting, match - board er charpashe o) fixed background hishebe thake. Bodlate chaile `js/config.js` er `ASSETS.img.bg` path bodlao (purono `bg.png` ar use hoy na).
- **Dice fix:** next player er chal ashar sathe sathe ager player er dice invisible hoye jay (age 0.8s delay chilo; `css/style.css` er `.pl:not(.act) .cub`).

## Notun (v9)
- **Match menu:** ager ✕ (back) button soriye deya hoyeche. Tar kaj ekhon 3-line menu r vetor "ম্যাচ থেকে বের হও / Exit match" button e (tap korle age-er moto confirm popup ashe). 3-line button ta ager ✕ er jaygay (bam-niche) ar ektu choto (`#mn` in `css/style.css`).
- **Guti animation:** jar chal tar guti ar upore-niche lafay na. Tar poriborte guti er niche sada-kalo dashed circle (ring) ghure (`.tk.mv::before`, `@keyframes rg`, 1.8s/ghurni; ghurar speed bodlate `rg 1.8s` er `1.8s` bodlao).
- **Dice:** spin ager cheye 250ms druto (950ms -> 700ms). Code: `rollAnim()` (game.js), `.cub` transition ar `.dsq.rl` hop (style.css) - ei 3 ta ekshathe bodlate hobe.

## Notun (v10)
- **Default language English.** Setting e giye "বাংলা" chap-le Bangla hoy (`LANG` default: game.js). Age-e Bangla select kora thakle oi phone e Bangla-i thakbe.
- **Delay:** Auto-move 400ms -> 100ms (`autoMv()`). Computer: dice 900ms -> 500ms, guti chal 650ms -> 300ms (`aiGo()`).
- **Menu:** "বন্ধ করো" button soriye popup er daan-upore ✕ (`.mx`) dewa hoyeche, click korle popup bondho.
- **Guti ring:** ekhon video er moto 7 ta lomba sada dash + choto kalo gap, PNG er lal circle er border hishebe (cell er thik majhkhane). Ghurar speed 1s/ghurni (`@keyframes rg`, `.tk.mv::before` in style.css).
- **Fix:** chal-er somoy guti 10px niche cole jaito. Karon `.mv` class (matchmaking screen er VS box) `margin:10px 0 4px` guti (`.tk.mv`) ke-o dhakka dito. Ekhon oi rule shudhu `#mmk .mv` e.

## Notun (v11)
- **Guti glitch fix (coded guti <-> PNG):** age `PW()` shudhu tokhon PNG dito jokhon `IMG[...]` load hoye gese, na hole coded SVG guti dekhato. Replay (▶) dile page reload hoye sathe sathe match shuru hoto, tokhon PNG load hoy nai => ager coded guti ashto. Ekhon: `PW()`/`pinI()` sobsomoy `ASSETS.img.pawnX` PNG, kono SVG fallback nai; `<symbol id="pin">` index.html theke muche dewa hoyeche; logo er guti-o PNG (`<image>`); replay e `IMGP` (sob image load) shesh hole match shuru (max 3s); index.html e pawn PNG `preload`. Name-row / Remove player / result e-o PNG guti.
- **Chal-er ring:** v10 er moto 7 ta lomba sada dash + choto gap + dui pashe patla border, tobe kalo er bodle dark gray (`#4d4d4d` base, `#383838` border), tai sada cell eo clear dekha jay. Color bodlate `.tk.mv::before` er data-URL e `%234d4d4d` / `%23383838` bodlao.
- **Safe sound:** non-safe ghore giye ek-i player er (Team Up e teammate soho) 2+ guti hole (ghor safe/block hoy) shesh hop er "step" sound er bodle `assets/sound/safe.mp3` baje. Code: `anim()` e `mkB`. Star / start ghor er age-er safe sound ager moto.
- **Kheye dile pichone yard e:** kheye dewa guti oi kot theke ager rasta dhore ulte (cell by cell, 57 -> 50 / 0 porjonto, Break Safe 2nd round soho) shoja yard e cole jay. Laf (hop) nai, kothao thame na, ~36ms/cell (min 0.3s, max 1.1s). Code: `back()`, `backPos()`, `draw()` er `vs`. Speed bodlate `back()` er `T*36` bodlao.

## Notun (v12): Preload + progress bar, Tap-to-start nai, Sound fix, Dice 6 er chance
- **Preload:** game kholar somoy `ASSETS` er sob image + sob sound + sob font load hoy. Progress bar ekhon sotti load er sathe barte thake (age ekta fake 1.6s animation chilo). Sob load hole (bar 100%) direct main menu. **"Tap to start" ar nai.** Kono asset 25s er beshi atke thakle oitake bad diye egiye jay, jate game kokhono atke na thake. Code: `js/game.js` er `loadImg / loadSnd / loadFnt / reg`, boot ekdom niche. Bar: `#ldb` (`.ld i` in style.css).
- **Sound glitch fix (root cause):** `assets/sound/*.wav` file gulo ashole **MP3** chilo (extension bhul). Safari / Android WebView e MIME mismatch hoye `canplaythrough` fire hoto na => sound file load hoto na => built-in synth sound baje jeto, tai kokhono file er sound kokhono onno sound. Ekhon: file gulor extension `.mp3` kore deya hoyeche, ar sound Web Audio diye (fetch -> decodeAudioData -> AudioBuffer) load hoy. Kon sound file theke, kon built-in, ta load er shomoy-i thik hoye jay; khelar majhe ar bodlay na. Fallback: Web Audio na hole HTMLAudio, ta-o na hole built-in synth.
- **Autoplay:** browser prothom tap/click chhara music baja allow kore na. Tai main menu te music prothom tap er por-i shuru hoy (menu te ashar age theke music queue kora thake).
- **Mute restore bug:** `muted=+ld('muted')` ekta `//` comment er vitor chilo, tai save kora mute reload e ar ferot ashto na. Ekhon thik.
- **Dice (6 er chance) [v13 e bodle gese, niche dekho]:** guti kotota board e ber ase tar upor. `js/config.js` er `DICE`:
  - sob guti yard e: ~33% (besi, tobe 6 hobei emon na) | 1 ta ber: ~17% | 2 ta ber: ~13% | 3+ ta ber: ~10%
  - 6 er por abar 6 er chance kome (x0.6), por por 3 bar 6 hobe na (age er moto)
  - yard e atke thaka player por por 4 bar 6 na pele proti bar +12% kore barte thake (max 85%)
  - Simulation: yard theke prothom 6 pete gorpora ~2.8 roll (age ~6), 99% case e 8 roll er moddhe (age 26). 1-5 er moddhe soman chance.
  - **Note:** eta Ludo King er hubohu number na (original apk er dice logic native code, number ber kora jayni). Tomar bola niyom onujayi banano number, `DICE` bodle tune koro. Code: `shape()`, `nOut()` in game.js; `roll()` e `d=shape(d,S)`.

## Notun (v13): Dice memory, Comparative, Advance, CUSTOM, GIF icon
- **Dice (protyek player er alada memory):** ager `shape()` bad. Ekhon roll er shomoy-i *shob player er* porer dice age theke generate hoye Firebase e jay (`gameState/nextDiceByColor/{red,green,yellow,blue}`), seat roll korle nijer ta-i pay, guti chalale ar bodlay na. Generate korar shomoy dekha hoy oi player er ekhon kon point sotti dorkar (`gameState/neededPointsByColor`): yard theke ber korte **6** (kono guti ber na thakle ekdom dorkar), ghor er roadey **exact point**, ar halka chance e **kheye dewar point**. Dorkari point na ashle protyek player er alada counter (`neededPointMissStreakByColor`) barte thake, tai chance dhire dhire barhe; ashle / dorkar na thakle counter 0. Jar 6 dorkar nei tar 6 ektu kom ashe, por por 3 bar 6 kokhono hoy na. Code: `needOf()`, `makeDice()`, `fillNext()`, `afterRoll()`, `roll()` (game.js). Shob number: `DICE` (config.js, comment dekho).
  - Simulation (4 jon, random chal): chalar moto guti nai emon por por roll: age gorpora 5.2 (max 35), ekhon 2.5 (max ~10). Yard theke prothom 6: age gorpora 2.8, ekhon 2.4 (95% 5 roll er moddhe).
  - Admin panel e hate `nextDice` boshale oita porer ekbar roll e use hoy. `rollsSinceLastSix` er bodle `neededPointMissStreakByColor` (admin reset o update kora).
- **Team Up > Advance:** 3 ta tick er bodle ekta **Advance** button; click korle popup e Break Safe (default ON), **Comparative** (default ON), Friendly Kill (default OFF). Code: `TO`, `openAdv()`, `playTeam()`.
- **Comparative (Team Up):** duijoner-i kom pokkhe 1 ta guti yard theke ber thakle dice er point teammate er gutite-o chala jay (teammate er guti tap korlei hoy). Kono ekjoner 4 guti-i yard e thakle ei rule kaj kore na; 1 ta ber + 3 ta yard e thakle kore. **"Ber" mane yard theke beriye jaoa: guti board e thakuk, ba finish hoye ghore uthe geleo (pos 56) ber hishabe dhora hoy** (fix: ager version e finish howa guti ke "ber" dhorto na, tai 1 ta guti uthe 3 ta yard e thakle duijoner-i comparative bondho hoye jeto). Teammate er guti kate ba finish korle shob rule ager moto (block, kata, extra chal). Firebase: `comparativeEnabled`. Code: `cmpOn()`, `hasOut()`, `tkn()` (t = 0-3 nijer guti, 4-7 teammate er guti), `movable()`, `doMove()`.
- **Break Safe default ON** shob jaygay (Pass N Play, Computer, Team Up Advance, Custom lobby); chaile tick tule off kora jay.
- **Home:** FRIENDS -> **CUSTOM**, logo = custom room (ghor + gear). Home er shob emoji er jaygay animated GIF: `assets/gif/*.gif` (26 ta), path `js/config.js` er `ASSETS.gif`. Baki asset er sathe-i load hoy (progress bar e dhora hoy); kono GIF na pele emoji-i thake. Code: `useGifs()` (game.js), `.gi` (style.css).
- **Computer mode:** profile e deya naam ekhon default boshe (na thakle Player 1). Computer mode e naam bodlale sheta-i thake.
- **Dice spin:** 700ms -> 550ms (`rollAnim()`, `.cub` transition, `.dsq.rl` hop).

## New (v14): Theme button, board themes (PNG + JSON), host board in Custom rooms
- **Bottom bar:** `ADDA` is now **THEME** (palette icon). It opens the Theme screen with three animated cards: **Dice** (spinning dice), **Token** (bouncing pawns) and **Board** (preview of the board you are using, with its name). Only **Board** is active; Dice and Token show "Coming soon" (tap = toast). Code: `openTheme()`, `soon()`, `themeTile()` in `js/game.js`, screen `#theme` in `index.html`.
- **Board list:** Board opens a scrollable 2-column list with every board. Tap one to use it; the green tick and the glow show the selected one. Saved on this device (`localStorage` key `bl_board`). Code: `openBoards()`, `pickBoard()`, screen `#bsel`.
- **Every board is a PNG now**, including the old coded board (`assets/boards/classic.png`, rendered from the real game board). New boards: **Jungle**, **Solar System**, **Heaven**, **Nether**. Files: `assets/boards/*.png` (1140x1140 px = 15x15 cells of 76 px). Cells, yards, home triangle, stars and arrows are part of the PNG; the game only draws pawns, player names, crowns and the "player left" logo on top.
- **How to add your own board (no code change):**
  1. Open `assets/boards/_template.png` - it shows exactly where cells, yards, the 4 token circles per yard, safe stars, entry arrows and the home triangle must be. Paint your board on the same 1140x1140 grid.
  2. Save it in `assets/boards/` (for example `ocean.png`).
  3. Add one entry to `assets/boards/boards.json`: `{ "id": "ocean", "name": "Ocean", "file": "ocean.png" }`. Optional: `"cover": "dark"` for dark boards (dark overlay when a player finishes or leaves). `id` = letters, digits, `_` or `-`. The order in the file is the order in the list.
  4. Done. It is loaded with the other assets and appears in the Board list. A board whose PNG fails to load is simply hidden.
  - `ASSETS.boards.fallback` in `js/config.js` is a built-in copy of the list, used only when `boards.json` cannot be read (for example `index.html` opened straight from disk in desktop Chrome). Boards you add only to the JSON need a web server or the APK.
- **Online vs Custom:** in **ONLINE** (1v1) matches every player sees **their own** board on their own device (nothing is shared). In **CUSTOM** rooms the **host's** board is saved in the room (`rooms/<code>/boardTheme`, written when the room is created and again at START) and **every player sees it**, the lobby shows "Board: <name>". If a player does not have the host's board, their own board is shown. Code: `matchBoard()`, `RBT`, `create()`, `start()`, `enter()`.
- **Loading:** all boards are preloaded behind the loading screen (`reg('boards', ...)`, included in the progress bar), so nothing loads after you enter a match. If every board PNG fails, the old coded board is drawn as a safety net.
- **Also:** the board list can scroll (`.scrl` is exempt from the global touch-move block); new strings have English and Bengali text (`thm`, `thmh`, `dice`, `token`, `board`, `soon`, `bhint`). `admin.html` is unchanged.

## APK / GitHub (v14)
- Game files are in `www/`. Android app shell is in `android/`. GitHub builds the APK (`.github/workflows/build-apk.yml`). Full guide: **APK_GUIDE.md**.
- **Version** is set in `www/js/version.js` (`APP_VERSION`) - the APK and the update check both read it. Now: `14`.
- **Auto update** (Firebase `system/version` + `system/url`): first number bigger (14 -> 15) = OB update, mandatory, no "Later" (remembered, so offline start is blocked too). Same first number, newer after the dot (14 -> 14.1) = patch, has "Later". Code: `js/update.js` + `android/.../UpdateBridge.java`.
- **Android back button:** `js/android.js` (popup close / screen back / "exit match?" / home: press twice to exit).
- `admin.html` is not part of the repo/APK.
- Firebase config now lives only in `js/firebase-config.js` (index.html loads it before `js/config.js`).
