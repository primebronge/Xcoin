// ===== Firebase config (tomar project er) =====
const firebaseConfig = {
  apiKey: "AIzaSyCOGlJGLE-0QH4cr0mTk6kfT0A519QkwY4",
  authDomain: "app-store-sck.firebaseapp.com",
  databaseURL: "https://app-store-sck-default-rtdb.firebaseio.com",
  projectId: "app-store-sck",
  storageBucket: "app-store-sck.appspot.com",
  messagingSenderId: "515743484540",
  appId: "1:515743484540:web:b5cd4bbf48074383a257f9",
  measurementId: "G-809GT91F6B"
};

// ===== Shob asset er path. Sound: age .mp3, na thakle .wav. File na thakle built-in use hoy =====
const snd=n=>['assets/sound/'+n+'.mp3','assets/sound/'+n+'.wav'];
const ASSETS={
 img:{bg:'assets/img/bg.jpg',left:'assets/img/player_left.png',
  pawn0:'assets/img/pin_red.png',pawn1:'assets/img/pin_green.png',pawn2:'assets/img/pin_yellow.png',pawn3:'assets/img/pin_blue.png'},
 gif:{avatar:'assets/gif/avatar.gif',gear:'assets/gif/gear.gif',mail:'assets/gif/mail.gif',gem:'assets/gif/gem.gif',coin:'assets/gif/coin.gif',cart:'assets/gif/cart.gif',
  gift:'assets/gif/gift.gif',crown:'assets/gif/crown.gif',money:'assets/gif/money.gif',target:'assets/gif/target.gif',puzzle:'assets/gif/puzzle.gif',question:'assets/gif/question.gif',
  globe:'assets/gif/globe.gif',sword:'assets/gif/sword.gif',custom_room:'assets/gif/custom_room.gif',mic_badge:'assets/gif/mic_badge.gif',phone:'assets/gif/phone.gif',people:'assets/gif/people.gif',
  dice:'assets/gif/dice.gif',snake:'assets/gif/snake.gif',clap:'assets/gif/clap.gif',wheel:'assets/gif/wheel.gif',home:'assets/gif/home.gif',event:'assets/gif/event.gif',mic:'assets/gif/mic.gif',chat:'assets/gif/chat.gif'},
 snd:{theme:snd('theme'),start:snd('start'),ui:snd('ui'),roll:snd('dice_roll'),step:snd('step'),out:snd('pawn_out'),cut:snd('capture'),home:snd('home'),safe:snd('safe'),win:snd('win')},
 lib:{local:['lib/firebase-app-compat.js','lib/firebase-database-compat.js'],
  cdn:['https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js']},
 font:{LudoFont:'assets/fonts/LilitaOne-Regular.ttf',BnFont:'assets/fonts/NotoSansBengali-Regular.ttf'},
 // ===== Board themes (v14) =====
 // The list of boards lives in assets/boards/boards.json (add a PNG + one JSON entry = a new board, no code change).
 // `fallback` is only used when the JSON cannot be read (for example index.html opened straight from disk in desktop Chrome). Keep it in sync with boards.json.
 boards:{dir:'assets/boards/',manifest:'assets/boards/boards.json',
  fallback:[{id:'classic',name:'Classic',file:'classic.png'},{id:'jungle',name:'Jungle',file:'jungle.png'},{id:'solar_system',name:'Solar System',file:'solar_system.png',cover:'dark'},{id:'heaven',name:'Heaven',file:'heaven.png'},{id:'nether',name:'Nether',file:'nether.png',cover:'dark'}]}};

// ===== Dice: protyek player er alada memory (js/game.js er needOf / makeDice). Shob number ekhane bodlano jay =====
// Roll er shomoy shobar porer dice age theke generate hoy: oi player er ekhon je point sotti dorkar tar chance bare, dorkari point onek bar na ashle aro bare.
// stuck = chalar moto kono guti nai (sob yard e) -> 6 er base chance | yard = 1+ guti ber ase kintu yard e-o ase -> 6 er base chance
// home = ghor er roadey exact point lage (onno guti-o ase) | homeOnly = shudhu ghor er roadey-i guti baki -> exact point er base chance
// cap = kheye dewar point er halka chance (sobsomoy na) | no6 = 6 dorkar nei emon player er 6 hole koto % abar re-roll hoy (6 kom ashe)
// grace = koy bar miss er por chance barte shuru | step / step2 = proti miss e koto barbe (ekdom atke thakle step, onno guti chale thakle step2) | max / softMax = shorbochcho chance
const DICE={stuck:.20,yard:.04,home:.14,homeOnly:.20,cap:.10,no6:.40,grace:1,step:.16,step2:.035,max:.85,softMax:.33};
