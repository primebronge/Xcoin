# Ludo King

Chalate: `index.html` browser e kholo. Local (PASS N PLAY) game internet charai cholbe.

- js/firebase-config.js -> tomar Firebase config (update er somoy ei file bodlano hoy na)
- js/config.js -> shob asset er path (PNG, sound, font, lib). theme.mp3 / start.mp3 dile age oita use hobe, na hole .wav
- assets/img: bg.png, pawn_red/green/yellow/blue.png | assets/sound: theme, start, dice_roll, step, pawn_out, capture, six, home, win, ui
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
