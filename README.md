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
