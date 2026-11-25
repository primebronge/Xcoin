// ===== Ludo King =====
// Color index: 0 Lal (bam-upor), 1 Sobuj (dan-upor), 2 Holud (dan-niche), 3 Nil (bam-niche)
const COL=['#e8202a','#12a83a','#ffd21f','#1e9bf0'],CN=['red','green','yellow','blue'];
const SEG=[[6,1,0,1,5],[5,6,-1,0,6],[0,7,0,1,2],[1,8,1,0,5],[6,9,0,1,6],[7,14,1,0,2],[8,13,0,-1,5],[9,8,1,0,6],[14,7,0,-1,2],[13,6,-1,0,5],[8,5,0,-1,6],[7,0,-1,0,2]];
const PATH=[];SEG.forEach(([r,c,dr,dc,k])=>{for(let i=0;i<k;i++)PATH.push([r+dr*i,c+dc*i])});
const HB=[[7,1,0,1],[1,7,1,0],[7,13,0,-1],[13,7,-1,0]],YB=[[0,0],[0,9],[9,9],[9,0]];
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const $=id=>document.getElementById(id),clone=o=>JSON.parse(JSON.stringify(o)),esc=s=>String(s).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
let db,conn=0,mode='L',me=-1,base=null,code='',owned=0,N=4,TM=0,S,P={},TK,busy=0,seen=-1,rolling=0,prev=null,won=0,muted=0,AC,AN=0,CR={};   // CR: kon seat er crown ekbar dekhano hoye gese (rank soho)
const LV={0:1,1:1,2:1,3:1},RA={};let LAST=null;
let fbs=0,tl=0,fc=0,synced=0,syncing=0,lst=0,LN=2,LP=0,CPUG=0,CPUM=0,RMS=-1,aiT=0,BSL=0,BSP=null,SO=0;
const NMV=['Player 1','Player 2','Player 3','Player 4'],IMG={},SND={},PL={},rn=()=>1+Math.random()*6|0;

// ===== Scale: 400 x (780+) design stage ke screen er size onujayi uniform scale kore =====
// DPI / display-size / screen ratio jai hok, sob phone e same look & same anupat. Page scroll hoy na.
const DW=400,DH=780;let FH=0;
const inp=()=>{const a=document.activeElement;return !!a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)};
function fit(){
 const vw=innerWidth,vh=innerHeight;if(!vw||!vh)return;
 if(inp()&&vh<FH)return;                      // keyboard khulle UI chhoto hobe na
 if(!inp())FH=vh;
 const s=Math.min(vw/DW,vh/DH),st=$('stage');
 st.style.height=vh/s+'px';st.style.transform='translate('+(vw-DW*s)/2+'px,0) scale('+s+')';st.style.visibility='visible'}
fit();addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,250));
addEventListener('load',()=>{fit();setTimeout(fit,300)});document.addEventListener('focusout',()=>setTimeout(fit,150));
// drag / pull-to-refresh / pinch zoom bondho
document.addEventListener('touchmove',e=>{if(!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))e.preventDefault()},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
window.scrollTo(0,0);

// ===== Asset loader (path system) =====
const IMGP=Promise.all(Object.entries(ASSETS.img).map(([k,p])=>new Promise(ok=>{const i=new Image();i.onload=()=>{IMG[k]=p;if(k==='bg'){const b=$('bgl');b.style.backgroundImage='url('+p+')';b.classList.add('img')}ok()};i.onerror=()=>ok();i.src=p})));   // IMGP = sob image load shesh (match e dhukar age ei porjonto opekkha kora hoy)
Object.entries(ASSETS.snd).forEach(([k,p])=>{const L=[].concat(p),tr=i=>{if(i>=L.length)return;const a=new Audio();a.preload='auto';a.oncanplaythrough=()=>{if(SND[k])return;SND[k]=a;if(k!=='theme')PL[k]={l:[a,a.cloneNode(),a.cloneNode()],i:0}};a.onerror=()=>tr(i+1);a.src=L[i]};tr(0)});
Object.entries(ASSETS.font).forEach(([n,p])=>{try{new FontFace(n,'url('+p+')').load().then(f=>document.fonts.add(f)).catch(()=>{})}catch(e){}});

// ===== Sound: file thakle file, na thakle synth =====
function tn(f,d,ty,v,w,f2){const t=AC.currentTime+(w||0),o=AC.createOscillator(),g=AC.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}
function nz(d,f,q,v,w,ty){const t=AC.currentTime+(w||0),b=AC.createBuffer(1,AC.sampleRate*d|0,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type=ty||'bandpass';fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(t)}
const bell=(f,w,v)=>{tn(f,.5,'sine',v,w);tn(f*2.01,.3,'sine',v/3,w)};
const SY={
 safe:()=>{[880,1175,1568].forEach((f,i)=>bell(f,i*.07,.18))},
 ui:()=>{nz(.03,2500,2,.3);tn(600,.05,'sine',.15)},
 roll:()=>{let t=0;for(let i=0;i<12;i++){const v=.7-i*.04;nz(.05,1500+Math.random()*2500,3,v,t);tn(130+Math.random()*70,.07,'sine',v*.5,t,60);t+=.045+i*.011+Math.random()*.02}nz(.09,800,2,.9,t);tn(110,.14,'sine',.6,t,45)},
 step:()=>{tn(850,.06,'sine',.35,0,320);nz(.035,2200,2,.35)},
 out:()=>{tn(260,.14,'sine',.45,0,900);nz(.05,1500,2,.3)},
 cut:()=>{tn(560,.5,'sawtooth',.16,0,60);nz(.3,500,1,.6);tn(90,.25,'sine',.6,.05,40)},
 home:()=>{[1047,1319,1568,2093].forEach((f,i)=>bell(f,i*.09,.2))},
 start:()=>{[523,659,784,1047,1319].forEach((f,i)=>bell(f,i*.1,.22))},
 win:()=>{[523,659,784,1047,784,1047,1319].forEach((f,i)=>{bell(f,i*.17,.25);tn(f/2,.4,'triangle',.1,i*.17)})}};
function sfx(k){if(muted)return;const p=PL[k];if(p){const b=p.l[p.i++%p.l.length];try{b.currentTime=0}catch(e){}b.play().catch(()=>{});return}
 const a=SND[k];if(a){const b=a.cloneNode();b.play().catch(()=>{});return}
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();SY[k]&&SY[k]()}catch(e){}}
function music(on){const a=SND.theme;if(!a)return;a.loop=true;a.volume=.45;if(on&&!muted){if(a.paused)a.play().catch(()=>{})}else a.pause()}
function mute(){muted=!muted;sv('muted',muted?1:0);uiS();if(muted)music(0);else if(document.body.dataset.s!=='game')music(1)}
document.addEventListener('click',e=>{if(e.target.closest('.gb,.nb,.bk,.sm,.mx,.hb.fn'))sfx('ui')});
document.addEventListener('pointerdown',()=>{const s=document.body.dataset.s;if(s!=='game'&&s!=='splash')music(1)});

// ===== Engine (pos: -1 yard, 0..50 path, 51..55 home column, 56 mukhe) =====
const init=(cs,ow,o={})=>{const n=cs.length,st=Math.max(0,cs.indexOf(o.first)),nmz=[];
 const am=cs.map(()=>0);for(let k=0;k<n;k++){nmz[(st+k)%n]=(o.names&&o.names[k])||'Player '+(k+1);am[(st+k)%n]=o.ai?+!!o.ai[k]:0}
 return {n,cs,ow,turn:st,ph:'r',d:0,ri:0,ls:st,win:-1,msg:'',team:!!o.team,fk:!!o.fk,bs:!!o.bs,sx:cs.map(()=>0),dl:0,nm:nmz,pos:cs.map(()=>[o.oto?0:-1,-1,-1,-1]),dr:cs.map(()=>0),rk:cs.map(()=>0),out:cs.map(()=>0),ai:o.ai?am:null}};
// pos: -1 yard | 0..50 1st round track | 51..55 home road | 56 finish | 57+ = Break Safe "kaca" korar por abar ghurle track (ghore dhukte abar gate paar korte hobe)
const onTr=p=>p>=0&&(p<=50||p>=57);                              // main track e ase?
const cellOf=(col,p)=>(p<=50?p+13*col:p-6+13*col)%52;             // track er cell index (PATH)
const mOf=p=>p<=50?p-50:p-56,gateOf=m=>m>0?52*Math.ceil(m/52):0;  // m=0 mane home gate (arrow) cell
function dest(p,d,brk){                                            // chal er por notun pos (-2 = chal nai). brk=kaca: gate paar hoye track e cholte thake
 if(p<0)return d===6?0:-2;
 if(p>=51&&p<=56)return p+d<=56?p+d:-2;
 const m=mOf(p),g=gateOf(m),n=m+d;
 if(n<=g)return p<=50?p+d:56+n;
 return brk?56+n:50+n-g}
function steps(a,b){                                               // guti ekta ekta cell e hop korar talika
 if(a<0)return [0];const r=[];
 if(a>=57&&b>=51&&b<=56){const g=gateOf(mOf(a));for(let p=a+1;p<=56+g;p++)r.push(p);for(let p=51;p<=b;p++)r.push(p);return r}
 if(a<=50&&b>=57){for(let p=a+1;p<=50;p++)r.push(p);for(let p=57;p<=b;p++)r.push(p);return r}
 for(let p=a+1;p<=b;p++)r.push(p);return r}
function xy(col,p,t){
 if(p<0){const [a,b]=YB[col];return [a+(t<2?1.5:3.5),b+(t%2?3.5:1.5)]}
 if(onTr(p))return PATH[cellOf(col,p)];
 const [r,c,dr,dc]=HB[col],k=p-51;return [r+dr*k,c+dc*k]}
const who=s=>s.team&&s.pos[s.turn].every(x=>x===56)?(s.turn+2)%4:s.turn;          // team mode: sob guti home hole partner er guti chale
// "side": Team Up e (Friendly Kill off) 2 teammate ek-i side, na hole nijer-i side. Block ar kata dui-i side diye hishab hoy
const side=(s,o)=>s.team&&!s.fk?o%2:o;
const foe=(s,a,o)=>side(s,a)!==side(s,o);                                           // team mate ke kate na (Friendly Kill off thakle)
// finish hoye gele (team chara) tar chal skip hoy
const adv=s=>{for(let i=0;i<s.n;i++){s.turn=(s.turn+1)%s.n;if(s.out[s.turn])continue;if(s.team||s.win>=0||!s.rk[s.turn])break}};
function movable(s){const r=[];s.pos[who(s)].forEach((p,t)=>{if(p<0?s.d===6:dest(p,s.d)>=0)r.push(t)});return r}
const stuck=s=>s.pos[who(s)].every(p=>p<0||p===56);   // chalar moto kono guti nai (sob ghore / sob finish)
function afterRoll(s,d){s.ls=s.turn;s.sx=s.sx||[0,0,0,0];s.sx[s.turn]=d===6?(s.sx[s.turn]|0)+1:0;s.dr[s.turn]=d===6||!stuck(s)?0:(s.dr[s.turn]||0)+1;s.d=d;s.ri++;s.msg='';if(movable(s).length)s.ph='m';else{s.ph='r';adv(s);s.msg='1'}}
// ===== Block rule: ek ghore ek player er 2+ guti thakle oi ghor safe, keo kono guti khete pare na =====
const SAFE=a=>a%13===0||a%13===8;                                                    // start / star ghor (age theke safe)
const at=(s,a)=>{const r=[];s.pos.forEach((arr,o)=>arr.forEach((x,u)=>{if(onTr(x)&&cellOf(s.cs[o],x)===a)r.push([o,u])}));return r};  // oi ghor e kon kon guti ase
const blk=(s,L)=>{const c={};L.forEach(([o])=>{const k=side(s,o);c[k]=(c[k]||0)+1});return Object.values(c).some(n=>n>1)};    // kono ekjon er (Team Up e: ek team er) 2+ guti ase? teammate er guti mile-o block hoy
function doMove(s,t,brk){
 const q=who(s),col=s.cs[q];let p=s.pos[q][t],extra=s.d===6;
 const oa=onTr(p)?cellOf(col,p):-1,wasB=oa>=0&&at(s,oa).filter(([o])=>side(s,o)===side(s,q)).length>1;   // jachchi oi ghor e amar (ba amar team er) block chilo?
 p=dest(p,s.d,brk);s.pos[q][t]=p;   // brk = Break Safe kaca: ghore na dhuke main track e cholte thake (abar full round)
 if(onTr(p)){const a=cellOf(col,p),L=at(s,a);
  if(!SAFE(a)&&!blk(s,L))L.forEach(([o,u])=>{if(foe(s,q,o)){s.pos[o][u]=-1;extra=true}})}     // block ghor e keo kate na
 if(wasB){const L=at(s,oa);                                                                // block bhenge 1 ta thakle
  if(!SAFE(oa)&&!blk(s,L)){const F=[...new Set(L.map(([o])=>o).filter(o=>foe(s,q,o)))];
   if(F.length)L.forEach(([o,u])=>{if(side(s,o)===side(s,q)||(F.length>1&&F.includes(o)))s.pos[o][u]=-1})}}  // 1 jon enemy: amar (ba teammate er) bakita khay | 2+ enemy: sob single khay
 if(p===56)extra=true;
 if(s.pos[q].every(x=>x===56)&&!s.rk[q]){s.rk[q]=Math.max(0,...s.rk)+1;   // crown: finish korar order (1,2,3)
  if(s.team?s.pos[(q+2)%4].every(x=>x===56):s.rk.filter((x,i)=>x||s.out[i]).length>=s.n-1){   // team: 2 jon-i finish / normal: 1 jon baki thakle match shesh
   if(!s.team){const l=s.rk.findIndex((x,i)=>!x&&!s.out[i]);if(l>=0)s.rk[l]=s.n;s.win=s.rk.indexOf(1)}else s.win=q}}
 s.ph='r';if(s.win>=0)return;if(!extra||(!s.team&&s.rk[s.turn]))adv(s)}

// ===== Dice: puro random (1-6 sobar chance soman, kono balance/bias nai) =====
const genDice=()=>rn();
// porer dice roll er somoy ekbar-i generate hoy, guti challe ar bodlay na.

// ===== Firebase data: rooms/<code>/{playerCount,matchStarted,teamMode,isLocalMatch,nextDice,players/player0../{name,color},gameState/{...}} =====
const enc=s=>{const tp={},rw={};s.cs.forEach((c,i)=>{tp[CN[c]]=s.pos[i];rw[CN[c]]=s.dr[i]});
 return {playerCount:s.n,seatColors:s.cs.map(c=>CN[c]),seatPlayerIndexes:s.ow,playerNames:s.nm,teamMode:!!s.team,friendlyKill:!!s.fk,breakSafeEnabled:!!s.bs,sixStreak:s.sx||[],turnDeadlineServerTime:s.dl||0,currentTurnSeat:s.turn,phase:s.ph==='r'?'waitingForRoll':'waitingForMove',currentDice:s.d,rollCount:s.ri,lastRollerSeat:s.ls,winnerSeat:s.win,finishRank:s.rk,noMoveOnLastRoll:!!s.msg,tokenPositions:tp,rollsSinceLastSix:rw,removedSeats:s.out}};
const dec=v=>{const cs=v.seatColors.map(c=>CN.indexOf(c));
 return {n:v.playerCount,cs,ow:v.seatPlayerIndexes,nm:v.playerNames||[],team:!!v.teamMode,fk:!!v.friendlyKill,bs:!!v.breakSafeEnabled,sx:cs.map((_,i)=>(v.sixStreak||[])[i]|0),dl:v.turnDeadlineServerTime||0,turn:v.currentTurnSeat,ph:v.phase==='waitingForRoll'?'r':'m',d:v.currentDice,ri:v.rollCount,ls:v.lastRollerSeat,win:v.winnerSeat,rk:cs.map((_,i)=>(v.finishRank||[])[i]||0),msg:v.noMoveOnLastRoll?'1':'',pos:cs.map(c=>v.tokenPositions[CN[c]]),dr:cs.map(c=>(v.rollsSinceLastSix||{})[CN[c]]||0),out:cs.map((_,i)=>(v.removedSeats||[])[i]|0)}};

const nm=s=>S.nm[s]||t('c'+S.cs[s]);
const canAct=()=>S.win>=0?false:!AN&&!(S.ai&&S.ai[S.turn])&&(mode==='L'||S.ow[S.turn]===me);

// ===== Actions (dice: Firebase theke read, sathe sathe porer dice generate hoye write; move e nextDice bodlay na) =====
async function roll(c,ai){
 if(busy||!(ai?S.win<0&&!AN:canAct())||S.ph!=='r'||S.cs[S.turn]!==c)return;
 busy=1;setTimeout(()=>{busy=0},4000);
 const fbm=base&&(mode==='O'||(conn&&synced));let d;
 try{if(fbm)d=await Promise.race([base.child('nextDice').once('value').then(s=>s.val()),new Promise(r=>setTimeout(r,3000))])}catch(e){}
 if(!(d>=1&&d<=6))d=genDice();
 {const k=S.dr[S.turn]||0;if(d!==6&&stuck(S)&&k>=4&&Math.random()<Math.min(.85,(k-3)*.12))d=6}   // 4 bar 6 na hole chance barte thake
 if(d===6&&((S.sx||[])[S.turn]|0)>=2)d=1+Math.random()*5|0;   // eksathe 3 bar 6 hobe na: 2 bar 6 er por 1-5
 const N2=clone(S);afterRoll(N2,d);if(mode==='O')N2.dl=sNow()+TT;
 if(fbm)base.update({gameState:enc(N2),nextDice:genDice()});
 if(mode==='L'){S=N2;busy=0;show()}}
function move(t,ai,brk){
 if(!(ai?S.win<0&&!AN:canAct())||S.ph!=='m'||!movable(S).includes(t)||(brk&&!(S.bs&&goesHome(S,t))))return;
 const N2=clone(S);doMove(N2,t,brk);if(mode==='O')N2.dl=sNow()+TT;
 if(mode==='O')base.update({gameState:enc(N2)});
 else{S=N2;show();if(base&&conn&&synced)base.update({gameState:enc(N2)})}}

// ===== Break Safe: guti ghore dhukar age popup. Sobuj tir = ghore dhuko (paka), Lal tir = kaca banao (abar full round ghoro) =====
// popup shudhu tokhon, jokhon dice er point guti te challe guti ghor er road e dhukbe. Lal tir = kaca: ghore na giye main track e point onujayi cholbe, abar full round ghurbe. ekbar ghore dhukle ar kaca kora jay na.
const goesHome=(s,t)=>{const p=s.pos[who(s)][t];if(!onTr(p))return false;const m=mOf(p);return m+s.d>gateOf(m)};   // ei chal e guti ghor er road e dhukbe?
function tap(t){
 if(!canAct()||S.ph!=='m'||!movable(S).includes(t))return;
 if(S.bs&&goesHome(S,t)){if(BSP&&BSP.t===t)closeBS();else openBS(t);return}
 closeBS();move(t)}
function closeBS(){BSP=null;const e=$('bsp');if(e)e.classList.remove('on')}
function openBS(t){
 const e=TK[who(S)][t],cs=380/15,w=112,h=66,cx=(e.X+.5)*cs,L=Math.max(-10,Math.min(380-w+10,cx-w/2)),tx=Math.max(110,Math.min(690,(cx-L)/w*800)),st='stroke="#000" stroke-width="9" stroke-linejoin="round"',p=$('bsp');
 BSP={t,ri:S.ri};
 p.innerHTML='<svg viewBox="0 0 800 470"><path d="M43,5H753Q793,5 793,45V315Q793,355 753,355H'+(tx+140)+'L'+tx+',455L'+(tx-140)+',355H43Q3,355 3,315V45Q3,5 43,5Z" fill="#ffc20e" stroke="#000" stroke-width="18" stroke-linejoin="round"/>'
  +'<polygon transform="translate(134 78)" fill="#ec1c24" '+st+' points="72,3 142,74 110,74 110,127 158,127 158,188 34,188 34,74 2,74"/>'
  +'<polygon transform="translate(480 76)" fill="#22b14c" '+st+' points="85,3 167,100 128,100 128,192 43,192 43,100 5,100"/>'
  +'<rect class="h" x="0" y="0" width="400" height="360" fill="transparent" onclick="bsPick(1)"/><rect class="h" x="400" y="0" width="400" height="360" fill="transparent" onclick="bsPick(0)"/></svg>';
 p.style.left=L+'px';p.style.top=(e.Y*cs-.8*cs-h-2)+'px';p.style.transformOrigin=(cx-L)+'px 100%';p.classList.add('on')}
function bsPick(r){if(!BSP)return;const t=BSP.t;closeBS();move(t,0,r)}   // r=1 lal (kaca: abar ghurbe), r=0 sobuj (ghore dhuko)

// ===== In-match menu (mute + remove player) =====
function openM(){$('mrp').style.display=mode==='L'&&!S.team&&!S.ai&&S.win<0?'':'none';$('mm').classList.add('on')}
function openR(){$('mm').classList.remove('on');RMS=-1;$('rmok').disabled=true;
 $('rml').innerHTML=S.cs.map((c,s)=>s).filter(s=>!S.out[s]&&!S.rk[s]).map(s=>'<div class="rr2" data-s="'+s+'" onclick="selR('+s+')">'+pinI(S.cs[s])+'<b>'+esc(nm(s))+'</b></div>').join('');$('rm').classList.add('on')}
function selR(s){RMS=s;$('rmok').disabled=false;document.querySelectorAll('.rr2').forEach(e=>e.classList.toggle('sel',+e.dataset.s===s))}
function doRm(){const s=RMS;$('rm').classList.remove('on');if(s<0||!S||S.out[s]||S.win>=0||AN||rolling)return;
 const N2=clone(S);leaveSeat(N2,s);
 S=N2;prev=clone(S.pos);if(base&&conn&&synced)base.update({gameState:enc(N2)});show()}

// ===== Screens =====
function sc(id){
 document.querySelectorAll('.scr').forEach(e=>e.classList.remove('on'));$('game').style.display=id==='game'?'flex':'none';
 if(id!=='game')$(id).classList.add('on');document.body.dataset.s=id;
 if(id==='onl'){$('ob').style.display='';$('cr').classList.remove('on');$('jn').classList.remove('on');err()}}
const err=m=>{$('err').textContent=m||''};
function oSub(id){$('ob').style.display='none';$(id).classList.add('on');const n=myName();if(n){if(!$('nm1').value)$('nm1').value=n;if(!$('nm2').value)$('nm2').value=n}}
function oBack(){const o=$('cr').classList.contains('on')||$('jn').classList.contains('on');sc(o?'onl':'home')}

// ===== Pass N Play / Team Up setup (Ludo King style) =====
const pinI=c=>'<img class="pi" src="'+ASSETS.img['pawn'+c]+'">';   // guti sobsomoy PNG (coded SVG guti ar nai)
const nrow=(c,i)=>CPUM&&i>0?'<div class="nr">'+pinI(c)+'<input value="Computer '+i+'" disabled><i class="rd"></i></div>':'<div class="nr">'+pinI(c)+'<input value="'+esc(NMV[i])+'" maxlength="12" oninput="NMV['+i+']=this.value"><i class="rd" onclick="rnd('+i+',this)">🎲</i></div>';
function rnd(i,el){const L=['Rahim','Karim','Sumi','Tuli','Rony','Mim','Sajib','Nila'];NMV[i]=L[Math.random()*L.length|0];el.parentNode.querySelector('input').value=NMV[i]}
const BLK={2:[[3,1],[0,2]],3:[[3,0,1]],4:[[3,0,1,2]]};
function openL(c){CPUM=c?1:0;sc('lset');lN(LN)}
function lN(n){LN=n;LP=0;document.querySelectorAll('#lset .nb[data-n]').forEach(b=>b.classList.toggle('sel',+b.dataset.n===n));
 $('lrows').innerHTML=BLK[n].map((b,k)=>'<div class="blk'+(n===2&&k?' off':'')+'" onclick="selB('+k+')">'+(n===2?'<span class="ck'+(k?'':' on')+'">✔</span>':'')+'<div>'+b.map((c,i)=>nrow(c,i)).join('')+'</div></div>').join('')}
function selB(k){if(LN!==2)return;LP=k;document.querySelectorAll('.blk').forEach((e,i)=>{e.classList.toggle('off',i!==k);e.querySelector('.ck').classList.toggle('on',i===k)})}
function playLocal(oto){const b=BLK[LN][LN===2?LP:0],o={first:b[0],names:NMV.slice(0,LN),oto,bs:$('bsL').checked};
 if(CPUM){o.ai=[0,1,1,1].slice(0,LN);o.names=[NMV[0],'Computer 1','Computer 2','Computer 3'].slice(0,LN)}   // computer: sob opponent AI, offline
 local([...b].sort((x,y)=>x-y),o)}
function openT(){CPUM=0;sc('tset');
 const tm=(l,cl,a,b)=>'<div class="th"><span class="tg" style="background:'+cl+'">'+l+'</span><div style="flex:1">'+nrow(a,a===3?0:2)+nrow(b,b===3?0:2)+'</div></div>';
 $('trows').innerHTML='<div class="th"><span class="tg" style="background:#1e9bf0">'+t('ta')+'</span><div style="flex:1">'+nrow(3,0)+nrow(1,2)+'</div></div><div class="vs">VS</div><div class="th"><span class="tg" style="background:#e8202a">'+t('tb')+'</span><div style="flex:1">'+nrow(0,1)+nrow(2,3)+'</div></div>'}
function playTeam(oto){local([0,1,2,3],{first:3,names:NMV.slice(0,4),oto,team:1,fk:$('fk').checked,bs:$('bsT').checked})}

// ===== Board / UI =====
const ARW=d=>'<svg class="ra" viewBox="0 0 24 24" style="transform:rotate('+d+'deg)"><path d="M3.5 12H20.5M14.5 5.8L20.5 12L14.5 18.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
const PW=c=>'<img src="'+ASSETS.img['pawn'+c]+'">';   // age IMG load hoyeche kina dekhe coded SVG guti dekhato (glitch). Ekhon sobsomoy PNG, kono fallback nai
const pn=(c,r)=>'<div class="pl'+(r?' r':'')+'" id="pl'+c+'"><div class="tray"><div class="tkn"><svg class="tmr" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" fill="none" stroke="#0007" stroke-width="4"/><circle class="tf" cx="22" cy="22" r="19" fill="none" stroke="#3ddc4a" stroke-width="4" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="0" transform="rotate(-90 22 22)"/></svg>'+PW(c)+'</div><div class="dsw"><button class="dsq" id="dc'+c+'" onclick="roll('+c+')"><div class="cub" id="de'+c+'">'+FACES+'</div></button></div></div><svg class="ar" viewBox="0 0 34 38"><use href="#ptr"/></svg></div>';
function goGame(){
 sc('game');music(0);sfx('start');
 $('top').innerHTML=pn(0)+pn(1,1);$('bot').innerHTML=pn(3)+pn(2,1);
 const AR={},cell={},GL=[0,90,180,270].map(ARW),STAR='<svg viewBox="0 0 24 24"><path d="M12 1.2l3.2 7.1 7.7.8-5.8 5.1 1.7 7.6L12 17.9l-6.8 3.9 1.7-7.6-5.8-5.1 7.7-.8z" fill="#fff" stroke="#555" stroke-width="1.1" stroke-linejoin="round"/></svg>';COL.forEach((_,j)=>AR[(50+13*j)%52]=j);
 PATH.forEach(([r,c],i)=>cell[r+','+c]={bg:i%13?'#fff':COL[i/13],t:i%13===8?STAR:AR[i]!=null?GL[AR[i]]:'',k:AR[i]!=null?COL[AR[i]]:'#444'});
 HB.forEach(([r,c,dr,dc],i)=>{for(let k=0;k<5;k++)cell[(r+dr*k)+','+(c+dc*k)]={bg:COL[i]}});
 let h='';
 for(let r=0;r<15;r++)for(let c=0;c<15;c++){
  const y=(r<6||r>8)&&(c<6||c>8),x=cell[r+','+c];
  h+='<div class="c" style="background:'+(y?'transparent':x?x.bg:'transparent')+(x&&x.k?';color:'+x.k:'')+'">'+((x&&x.t)||'')+'</div>'}
 for(let c=0;c<4;c++)h+='<div class="yd c'+c+'" id="yd'+c+'" style="--c:'+COL[c]+';left:'+(c==1||c==2?60:0)+'%;top:'+(c>1?60:0)+'%"><b></b><img class="gn" src="'+ASSETS.img.left+'">'+['24.1,24.1','57.5,24.1','24.1,57.5','57.5,57.5'].map(q=>'<i style="left:'+q.split(',')[0]+'%;top:'+q.split(',')[1]+'%"></i>').join('')+'<em class="yn" id="yn'+c+'"></em><u class="tb" id="tb'+c+'"></u><s class="cw" id="cw'+c+'"><svg viewBox="0 0 60 44"><use href="#crown"/></svg><b></b></s></div>';
 $('bd').insertAdjacentHTML('afterbegin',h);
 if(IMG.board){$('bd').classList.add('pg');$('bd').style.backgroundImage='url('+IMG.board+')'}
 $('ct').style.background='conic-gradient(from -45deg,'+COL[1]+' 0 90deg,'+COL[2]+' 90deg 180deg,'+COL[3]+' 180deg 270deg,'+COL[0]+' 270deg)';
 TK=S.pos.map((a,s)=>a.map((_,t)=>{const e=document.createElement('div');e.className='tk';e.innerHTML=PW(S.cs[s]);e.onclick=()=>{if(s===who(S))tap(t)};$('bd').appendChild(e);return e}));
 $('bd').insertAdjacentHTML('beforeend','<div id="bsp"></div>');$('bd').addEventListener('click',e=>{if(BSP&&!e.target.closest('#bsp,.tk'))closeBS()})}

// ===== 3D dice: 6 ta face-wala cube, spin kore sothik face e theme jay =====
const FIN={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]},CB={},CUV={};
const FACES=[1,2,3,4,5,6].map(v=>'<div class="fc f'+v+'">'+Array.from({length:9},(_,i)=>'<i'+(PIPS[v].includes(i)?' class="o"':'')+'></i>').join('')+'</div>').join('');
function cube(c,v,spin){const e=$('de'+c),b=CB[c]=CB[c]||[0,0];
 if(spin){b[0]+=360*(1+(Math.random()*2|0));b[1]+=360*(1+(Math.random()*2|0))}
 e.style.transition=spin?'':'none';e.style.transform='rotateX('+(b[0]+FIN[v][0])+'deg) rotateY('+(b[1]+FIN[v][1])+'deg)';CUV[c]=v;
 if(!spin){void e.offsetWidth;e.style.transition=''}}
const snap=(c,v)=>{if(CUV[c]!==v)cube(c,v)};
function rollAnim(c,v,cb){const b=$('dc'+c);b.classList.add('rl');RA[c]=1;cube(c,v,1);setTimeout(()=>{b.classList.remove('rl');RA[c]=0;LV[c]=v;cb()},700)}   // dice spin ager cheye 250ms druto (950 -> 700); CSS .cub transition ar .dsq.rl hop o same
// ===== Auto move: dice dewar por jodi mot ekta-i alada chal thake (jemon 4 guti yard e + 6, ba ekta-i guti norano jay) tahole oi chal auto hoye jay =====
// yard er sob guti ek-i chal, ek ghorer guti-o ek-i chal (fol ek-i), tai alada kore gona hoy
function uniq(s){const q=who(s),k={},r=[];movable(s).forEach(t=>{const p=s.pos[q][t];if(!k[p]){k[p]=1;r.push(t)}});return r}
const hm=s=>{const u=uniq(s);return !!s.bs&&u.length>0&&goesHome(s,u[0])};   // Break Safe ON + ei chal e ghore dhukbe -> auto na, player tap kore popup dekhbe
let amv=0;
function autoMv(){
 if(amv||!S||S.win>=0||S.ph!=='m'||!canAct()||uniq(S).length!==1||S.pos[who(S)][uniq(S)[0]]<0||hm(S))return;
 amv=1;setTimeout(()=>{amv=0;if(S&&S.win<0&&S.ph==='m'&&canAct()){const u=uniq(S);if(u.length===1&&S.pos[who(S)][u[0]]>=0&&!hm(S))move(u[0])}},100)}   // auto-move delay 400 -> 100ms
// ===== Computer (AI): sob opponent bot, offline =====
function best(s){const q=who(s),col=s.cs[q];let b=-1e9,r=0;
 const yd=x=>x.pos.reduce((a,v,o)=>a+(foe(x,q,o)?v.filter(p=>p<0).length:0),0);
 uniq(s).forEach(t=>{const p=s.pos[q][t],n=clone(s);doMove(n,t);const np=n.pos[q][t],a=onTr(np)?cellOf(col,np):-1;
  let v=(yd(n)-yd(s))*100+(np===56?90:0)+(p<0?60:0)+(np>50&&np<57?25:0)+np*.4+(onTr(np)&&SAFE(a)?30:0);
  if(onTr(np)&&!SAFE(a)&&!blk(n,at(n,a)))n.pos.forEach((v2,o)=>{if(foe(n,q,o))v2.forEach(x=>{if(!onTr(x))return;const dd=(a-cellOf(n.cs[o],x)+52)%52;if(dd>0&&dd<=6)v-=20})});
  v+=Math.random()*8;if(v>b){b=v;r=t}});return r}
function aiGo(){
 if(aiT||!S||!S.ai||S.win>=0||!S.ai[S.turn]||AN||rolling)return;
 aiT=setTimeout(()=>{aiT=0;if(!S||S.win>=0||!S.ai[S.turn]||AN||rolling)return;
  if(S.ph==='r')roll(S.cs[S.turn],1);else{const u=uniq(S);move(u.length===1?u[0]:best(S),1)}},S.ph==='r'?500:300)}   // computer: roll 900->500ms, move 650->300ms
function show(){
 if(S.ri!==seen){seen=S.ri;
  if(S.ri){const d=S.d;rolling=1;sfx('roll');rollAnim(S.cs[S.ls||0],d,()=>{rolling=0;draw();autoMv()})}}
 if(!rolling)draw()}

// guti position: transform diye (layout hoy na, GPU te cole). 1 cell = guti er nijer width => translate(%) = cell
function put(e,x,y){e.X=x;e.Y=y;const v='translate('+x*100+'%,'+y*100+'%)';if(e.v===v)return;
 if(!e.i){e.i=1;e.style.transition='none';e.style.transform=v;void e.offsetWidth;e.style.transition=''}else e.style.transform=v;e.v=v}
// guti ekta ekta kore ghor e hop kore jay
function anim(s,t,a,b){
 const e=TK[s][t],col=S.cs[s],st=steps(a,b);e.a=1;AN++;
 // non-safe ghore giye ek-i player er (Team Up e teammate soho) 2+ guti hole ghor safe (block) hoye gelo => shesh hop e "step" er bodle safe.mp3
 const ce=a>=0&&onTr(b)?cellOf(col,b):-1,mkB=ce>=0&&!SAFE(ce)&&at(S,ce).filter(([o])=>side(S,o)===side(S,s)).length>1;
 st.forEach((p,k)=>setTimeout(()=>{const [r,c]=xy(col,p,t);put(e,c,r);e.style.zIndex=50;
  e.classList.remove('hp');void e.offsetWidth;e.classList.add('hp');sfx(a<0?'out':mkB&&k===st.length-1?'safe':'step')},k*190));
 setTimeout(()=>{e.a=0;AN--;e.classList.remove('hp');if(b===56)sfx('home');else if(a>=0&&onTr(b)&&SAFE(cellOf(col,b)))sfx('safe');draw()},st.length*190+60)}

// ===== Kheye dile: guti oi kot theke ager rasta dhore ulte (pichone) cell by cell yard e cole jay. Laf nai (hop nai), kothao thame na, druto =====
function backPos(q){            // q (kheye dewar age pos) theke start ghor (pos 0) porjonto ulte pos er talika
 const r=[];let p=q-1;
 if(q>=57){for(;p>=57;p--)r.push(p);p=50}     // Break Safe kaca: 57 (2nd round) er pichone 50 (ghore dhokar road bad)
 for(;p>=0;p--)r.push(p);return r}
function back(s,t,q,done){
 const e=TK[s][t],col=S.cs[s],yd=xy(col,-1,t);
 if(S.out[s]||!e.animate||!(q>=0)||e.X==null){put(e,yd[1],yd[0]);return done()}
 const pts=[[e.X,e.Y]];backPos(q).forEach(p=>{const [r,c]=xy(col,p,t);pts.push([c,r])});pts.push([yd[1],yd[0]]);
 const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 const T=L[L.length-1]||1,dur=Math.max(300,Math.min(1100,T*36));   // ~36ms per cell (forward hop 190ms), min 0.3s max 1.1s
 const an=e.animate(pts.map((p,i)=>({transform:'translate('+p[0]*100+'%,'+p[1]*100+'%)',offset:L[i]/T})),{duration:dur,easing:'linear',fill:'forwards'});   // linear + dhrubo gotee = thame na
 e.style.zIndex=45;
 setTimeout(()=>{e.style.transition='none';put(e,yd[1],yd[0]);try{an.cancel()}catch(x){}void e.offsetWidth;e.style.transition='';done()},dur+30)}

function draw(){
 if(prev){let md=0;const vs=[];
  S.pos.forEach((a,s)=>a.forEach((p,t)=>{const q=prev[s][t];if(p===q)return;if(p<0)vs.push([s,t]);else{anim(s,t,q,p);md=Math.max(md,steps(q,p).length*190)}}));
  vs.forEach(([s,t])=>{const e=TK[s][t],q=prev[s][t];e.a=1;AN++;   // q = kheye dewar age guti kon pos e chilo (ager rasta ulte jaoar jonno)
   setTimeout(()=>{sfx('cut');back(s,t,q,()=>{e.a=0;AN--;draw()})},md+90)})}
 prev=clone(S.pos);
 if(S.win>=0&&!won){won=1;setTimeout(()=>{sfx('win');showRes()},1500)}
 const col=S.cs[S.turn],A=who(S),ca=canAct(),mv=ca&&S.ph==='m'?movable(S):[],tot={},ix={};
 const bc={},xs=S.pos.map((a,s)=>a.map((p,t)=>{const q=xy(S.cs[s],p,t);tot[q+'']=(tot[q+'']||0)+1;if(onTr(p))bc[side(S,s)+'|'+q]=(bc[side(S,s)+'|'+q]||0)+1;return q}));
 xs.forEach((a,s)=>a.forEach(([r,c],t)=>{
  const e=TK[s][t],m=s===A&&mv.includes(t),P0=S.pos[s][t];e.classList.toggle('mv',m);e.style.display=S.out[s]?'none':'';e.classList.toggle('bk',onTr(P0)&&!SAFE(cellOf(S.cs[s],P0))&&bc[side(S,s)+'|'+r+','+c]>1);if(e.a)return;
  const k=r+','+c,i=ix[k]=(ix[k]||0)+1,n=tot[k],o=n>1?(i-1-(n-1)/2)*.22:0;
  put(e,c+o,r);e.style.zIndex=m?40:Math.round(r)+1}));
 [0,1,2,3].forEach(c=>{
  const s=S.cs.indexOf(c),p=$('pl'+c),tb=$('tb'+c);const gn=s>=0&&S.out[s];p.classList.toggle('hid',s<0||gn);$('yd'+c).classList.toggle('gone',!!gn);$('yn'+c).textContent=s<0?'':nm(s);
  tb.style.display=S.team&&s>=0?'flex':'none';tb.textContent=c%2?'A':'B';tb.style.background=COL[(c+2)%4];
  if(s<0)return;
  const r0=S.out[s]?0:S.rk[s]||0,rk=r0&&(!AN||CR[s]===r0)?r0:0,cr=rk&&rk<=3&&rk<S.n?rk:0,cw=$('cw'+c);if(rk)CR[s]=rk;cw.style.display=cr?'flex':'none';cw.lastChild.textContent=cr||'';$('yd'+c).classList.toggle('rk',!!cr);p.classList.toggle('fin',!!rk&&!S.team);
  const on=s===S.turn&&S.win<0&&!S.out[s],go=on&&ca&&S.ph==='r';p.classList.toggle('act',on);p.classList.toggle('go',on&&S.ph==='r');p.classList.toggle('me',go);$('dc'+c).disabled=!go;
  if(!RA[c])snap(c,LV[c])});
 $('st').style.borderColor=COL[col];
 $('st').textContent=S.win>=0?(S.team?t('twin',S.cs[S.win]%2?'A':'B'):t('win',nm(S.win))):(ca?nm(S.turn)+' — '+t(S.ph==='r'?'tap':'pick'):t('turn',nm(S.turn)))+(S.msg?' ('+t('nomove')+')':'');if(BSP&&(S.ri!==BSP.ri||S.ph!=='m'||!canAct()))closeBS();
 if(mode==='O'){const ms=S.ow.indexOf(me);$('lv').classList.toggle('on',ms>=0&&!!S.out[ms])}
 if(mode==='L'&&S.win>=0&&!LDONE)lClean();aiGo()}

// ===== Storage + language =====
const myName=()=>(ld('pname')||'').trim();   // main menu > profile e deya naam, Online / Custom match e ei naam dekhay
function openP(){$('pfn').value=myName();$('pf').classList.add('on')}
function saveName(){const n=$('pfn').value.trim().slice(0,12);if(!n){$('pfn').focus();return}sv('pname',n);$('pf').classList.remove('on')}
const ld=k=>{try{return localStorage.getItem('bl_'+k)}catch(e){return null}},sv=(k,v)=>{try{localStorage.setItem('bl_'+k,v)}catch(e){}};
let LANG=ld('lang')||'en';   // default English; Settings theke Bangla kora jaymuted=+ld('muted')||0;
const T={
bn:{cname:'রঙ ও নাম বাছাই করো',play:'খেলো',oto:'- এক গুটি বের -',ta:'টিম A',tb:'টিম B',fk:'ফ্রেন্ডলি কিল',set:'সেটিংস',lang:'ভাষা',snd:'সাউন্ড',on:'চালু',off:'বন্ধ',create:'রুম তৈরি করুন',join:'রুমে জয়েন করুন',yname:'তোমার নাম',rcode:'রুম কোড',mk:'রুম তৈরি করো',jn:'জয়েন করো',tmo:'টিম আপ (৪ জন)',p2:'২ জন',p3:'৩ জন',p4:'৪ জন',rc:'রুম কোড:',go:'ম্যাচ শুরু করো',wait:'অপেক্ষা করছি…',lw:'লিডার শুরু করলে ম্যাচ শুরু হবে',exitq:'সত্যিই ম্যাচ থেকে বের হবে?',yes:'হ্যাঁ, বের হও',no:'না, থাকো',tap:'ডাইসে ট্যাপ করো',pick:'গুটি চালাও',turn:'{n} এর চাল',nomove:'চাল নেই',win:'🏆 {n} জিতেছে!',twin:'🏆 টিম {n} জিতেছে!',noconn:'ইন্টারনেট/সার্ভার কানেক্ট হচ্ছে না',c5:'৫ অক্ষরের রুম কোড দাও',noroom:'রুম পাওয়া যায়নি',started:'ম্যাচ শুরু হয়ে গেছে',full:'রুম পূর্ণ',tapstart:'শুরু করতে ট্যাপ করো',c0:'লাল',c1:'সবুজ',c2:'হলুদ',c3:'নীল',cg:'অভিনন্দন!',won:'জিতেছে',lost:'হেরেছে',wn:'জয়',ls:'হার',mute:'সাউন্ড বন্ধ করো',unmute:'সাউন্ড চালু করো',rmp:'প্লেয়ার বাদ দাও',close:'বন্ধ করো',rmq:'কোন প্লেয়ারকে বাদ দেবে?',cfm:'নিশ্চিত করো',no2:'বাতিল',bs:'Break Safe',onl:'অনলাইন',srch:'প্রতিপক্ষ খোঁজা হচ্ছে…',found:'প্লেয়ার পাওয়া গেছে!',conn2:'সার্ভারের সাথে কানেক্ট হচ্ছে…',prof:'প্রোফাইল',save:'সেভ করো',removed:'তুমি ম্যাচ থেকে বাদ পড়েছ',home:'হোম',roomgone:'রুম বন্ধ হয়ে গেছে',leave:'ম্যাচ থেকে বের হও'},
en:{cname:'CHOOSE COLOR AND NAME',play:'Play',oto:'- One Token Out -',ta:'TEAM A',tb:'TEAM B',fk:'Friendly Kill',set:'Settings',lang:'Language',snd:'Sound',on:'On',off:'Off',create:'Create room',join:'Join room',yname:'Your name',rcode:'Room code',mk:'Create',jn:'Join',tmo:'Team Up (4 players)',p2:'2 Players',p3:'3 Players',p4:'4 Players',rc:'Room code:',go:'Start match',wait:'Waiting…',lw:'The match starts when the leader begins',exitq:'Really leave the match?',yes:'Yes, leave',no:'No, stay',tap:'Tap the dice',pick:'Move a piece',turn:"{n}'s turn",nomove:'No move',win:'🏆 {n} wins!',twin:'🏆 Team {n} wins!',noconn:'No internet / server connection',c5:'Enter the 5-letter room code',noroom:'Room not found',started:'Match already started',full:'Room is full',tapstart:'Tap to start',c0:'Red',c1:'Green',c2:'Yellow',c3:'Blue',cg:'Congratulations!',won:'Won',lost:'Lost',wn:'WIN',ls:'LOSE',mute:'Mute sound',unmute:'Unmute sound',rmp:'Remove player',close:'Close',rmq:'Which player to remove?',cfm:'Confirm',no2:'Cancel',bs:'Break Safe',onl:'ONLINE',srch:'Searching for a player…',found:'Player found!',conn2:'Connecting…',prof:'Profile',save:'Save',removed:'You left the match',home:'Home',roomgone:'Room closed',leave:'Exit match'}};
const t=(k,n)=>(T[LANG][k]||k).replace('{n}',n);
function uiS(){$('mmu').textContent=t(muted?'unmute':'mute');$('sb').textContent=t(muted?'off':'on')}
function applyLang(){
 document.documentElement.lang=LANG;
 document.querySelectorAll('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));
 document.querySelectorAll('[data-p]').forEach(e=>e.placeholder=t(e.dataset.p));
 $('lbn').classList.toggle('sel',LANG==='bn');$('len').classList.toggle('sel',LANG==='en');uiS();
 if(S&&TK)draw();if($('lobby').classList.contains('on'))lobby();if($('tset').classList.contains('on'))openT()}
function setLang(l){LANG=l;sv('lang',l);applyLang()}

// ===== Firebase: SDK lazy load (local lib -> CDN) + network tick =====
const to=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(no,ms||5000))]);
const loadScript=(s,bust)=>new Promise((ok,no)=>{const e=document.createElement('script'),tm=setTimeout(()=>{e.remove();no('timeout')},9000);
 e.onload=()=>{clearTimeout(tm);ok()};e.onerror=()=>{clearTimeout(tm);e.remove();no('error')};e.src=bust?s+(s.includes('?')?'&':'?')+'r='+Date.now():s;document.head.appendChild(e)});
// SDK load: navigator.onLine er upor nirbhor kore na (kichu WebView e net ashar por-o false thake). Fail hole 2.5s por abar chesta kore; cache-bust diye.
let FBT=0,FBN=0;
async function loadFB(){
 if(fbs||firebaseConfig.apiKey.startsWith('YOUR'))return;fbs=1;FBN++;
 try{
  for(const L of [ASSETS.lib.local,ASSETS.lib.cdn]){
   for(const u of L){if(/database/.test(u)?(window.firebase&&firebase.database):window.firebase)continue;
    try{await loadScript(u,FBN>1&&L===ASSETS.lib.cdn)}catch(e){break}}
   if(window.firebase&&firebase.database)break}
  if(!(window.firebase&&firebase.database))throw 0;
  if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);db=firebase.database();fbs=2;
  db.ref('.info/serverTimeOffset').on('value',s=>{SO=+s.val()||0});
  db.ref('.info/connected').on('value',s=>{fc=!!s.val();setConn()})
 }catch(e){fbs=0;FBT=Date.now()}}
function setConn(){const c=!!(fc&&db);if(c&&!conn){conn=1;synced=0;syncL();janitor()}else if(!c){conn=0;synced=0}}
function tick(){setConn();if(!fbs&&Date.now()-FBT>2500)loadFB();if(conn&&mode==='L'&&S&&!synced&&!syncing&&!LDONE)syncL();lbeat()}

// ===== Local match: 3 digit key = Firebase child key. Net thakle online er moto Firebase er sathe two-way connected =====
const rc=()=>String(100+Math.random()*900|0);
async function syncL(){
 if(CPUG||mode!=='L'||!S||!db||!conn||syncing||LDONE)return;syncing=1;
 try{
  if(!owned){for(let i=0;i<30;i++){if(!(await to(db.ref('rooms/'+code).once('value'),8000)).exists())break;code=rc()}owned=1;$('ck').textContent='#'+code}
  const b=db.ref('rooms/'+code);await to(b.update({playerCount:S.n,matchStarted:true,isLocalMatch:true,teamMode:!!S.team,nextDice:genDice(),lastActivityServerTime:sNow(),createdAtServerTime:sNow(),gameState:enc(S)}),8000);base=b;synced=1;
  if(!lst){lst=1;b.on('value',s=>{ // Firebase theke guti nora-chora korle local e o dekhabe
   if(mode!=='L'||!conn||!synced)return;const v=s.val();if(!v){if(!LDONE)synced=0;return}if(!v.gameState)return;const ns=dec(v.gameState);
   if(JSON.stringify(enc(ns))!==JSON.stringify(enc(S))){S=ns;busy=0;show()}})}
 }catch(e){console.warn('sync',e)}
 syncing=0}
function local(cs,o){
 if(base){try{base.off()}catch(e){}}
 mode='L';me=-1;base=null;owned=0;synced=0;lst=0;LDONE=0;code=rc();CPUG=!!o.ai;$('ck').textContent=CPUG?'':'#'+code;
 LAST={cs,o};S=init(cs,cs.map((_,i)=>i),o);goGame();show();if(!CPUG)tick()}   // computer mode e Firebase e kichu lekha hoy na

// ===== Online room (FRIENDS) =====
const dbOk=()=>{if(!db||!conn){err(t('noconn'));return false}err();return true};
async function create(){
 if(!dbOk())return;
 const tm=$('tm').checked,n=tm?4:+$('pn').value,A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',nme=$('nm1').value.trim()||myName()||'Player';
 let id;try{for(let i=0;i<20;i++){id=Array.from({length:5},()=>A[Math.random()*A.length|0]).join('');if(!(await db.ref('rooms/'+id).once('value')).exists())break}
  await db.ref('rooms/'+id).set({playerCount:n,matchStarted:false,teamMode:tm,breakSafeEnabled:false,nextDice:rn(),lastActivityServerTime:sNow(),createdAtServerTime:sNow(),players:{player0:{name:nme,color:'red'}}});enter(id,0)}catch(e){err(e.message)}}
async function join(){
 if(!dbOk())return;
 const id=$('rid').value.trim().toUpperCase(),nme=$('nm2').value.trim()||myName()||'Player';
 if(id.length<5)return err(t('c5'));
 try{
  const snap=await db.ref('rooms/'+id).once('value');
  if(!snap.exists())return err(t('noroom'));
  if(snap.val().matchStarted)return err(t('started'));
  const n=snap.val().playerCount;let seat=-1;
  await db.ref('rooms/'+id+'/players').transaction(p=>{
   p=p||{};seat=-1;const used=Object.values(p).map(x=>x.color);
   for(let i=0;i<n;i++)if(!p['player'+i]){seat=i;p['player'+i]={name:nme,color:[0,2,1,3].map(x=>CN[x]).find(x=>!used.includes(x))};return p}
   return});
  if(seat<0)return err(t('full'));
  enter(id,seat);
 }catch(e){err(e.message)}}
function enter(id,seat){
 me=seat;mode='O';code=id;ROOMGONE=0;base=db.ref('rooms/'+id);$('ck').textContent=id;
 base.on('value',s=>{const v=s.val();
  if(!v){ROOMGONE=1;if(!S){try{base.off()}catch(e){}sc('onl');err(t('roomgone'))}return}   // host room bondho kore dile
  ROOMGONE=0;N=v.playerCount;TM=!!v.teamMode;BSL=!!v.breakSafeEnabled;STARTED=v.matchStartedServerTime||0;P=v.players||{};
  if(v.matchStarted&&v.gameState){S=dec(v.gameState);busy=0;if(!TK)goGame();olMatch();show()}else{olLobby();lobby()}})}
function lobby(){
 sc('lobby');$('lc').textContent=code;const host=me===0;
 $('pls').innerHTML=Array.from({length:N},(_,i)=>{const p=P['player'+i],c=p?CN.indexOf(p.color):0;
  return p?'<div class="lp"><span class="dot" style="background:'+COL[c]+'"></span><b>'+esc(p.name)+(i?'':' ★')+'</b>'+(TM?'<em class="tg2">'+t(c%2?'ta':'tb')+'</em>':'')+(host?[0,1,2,3].map(x=>'<i class="sw" style="background:'+COL[x]+'" onclick="setc('+i+','+x+')"></i>').join(''):'')+'</div>':'<div class="lp off">'+t('wait')+'</div>'}).join('');
 $('go').style.display=host?'block':'none';{const bo=$('bsO');bo.checked=!!BSL;bo.disabled=!host;bo.parentNode.style.opacity=host?1:.75}$('go').disabled=Object.keys(P).length<N;
 $('wt').textContent=host?'':t('lw')}
function setBS(v){if(me!==0||!base)return;base.update({breakSafeEnabled:!!v})}   // shudhu host (Custom match)
function setc(i,c){ // shudhu leader color change korte pare
 if(me!==0)return;const j=Array.from({length:N},(_,k)=>k).find(k=>k!==i&&P['player'+k]&&P['player'+k].color===CN[c]),u={};
 u['players/player'+i+'/color']=CN[c];if(j!=null)u['players/player'+j+'/color']=P['player'+i].color;base.update(u)}
function start(){
 if(me!==0)return;const ps=Object.keys(P).map(k=>({i:+k.slice(6),c:CN.indexOf(P[k].color),n:P[k].name})).sort((a,b)=>a.c-b.c),cs=ps.map(p=>p.c),g=init(cs,ps.map(p=>p.i),{team:TM,first:cs[0],bs:BSL});
 g.nm=ps.map(p=>p.n);g.dl=sNow()+TT+3000;base.update({matchStarted:true,matchStartedServerTime:sNow(),lastActivityServerTime:sNow(),nextDice:genDice(),gameState:enc(g)})}

// ===== ONLINE (1 vs 1 matchmaking): rooms/onlineMatchmaking/{waitingPlayer, matchAssignments/<playerId>} =====
// Ekjon waitingPlayer e boshe khoje. Pore je ashe se transaction diye take niye nei (waitingPlayer faka hoye jay), room banay, tar sathe match hoy.
// Tarpor 3rd jon ashle waitingPlayer faka thake, se notun kore onno player khoje. Break Safe Online e sobsomoy ON.
const MMP='rooms/onlineMatchmaking/';let PID='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const MM={on:0,busy:0,tm:0,l:0,nm:'',t0:0,ar:null},sNow=()=>Date.now()+SO,mmTxt=k=>{$('mmt').textContent=t(k)};
const mk=(ps,o)=>{ps=[...ps].sort((a,b)=>a.c-b.c);const g=init(ps.map(p=>p.c),ps.map(p=>p.i),o);g.nm=ps.map(p=>p.n);return g};
function goOnline(){
 if(MM.on)return;MM.on=1;MM.busy=0;MM.l=0;MM.t0=Date.now();
 MM.nm=myName()||'Player';const n=MM.nm;
 $('mme').textContent=n;$('mmn').textContent='';$('mmo').textContent='?';$('mmo').classList.add('q');$('mmb').style.display='';mmTxt('conn2');sc('mmk');
 clearInterval(MM.tm);MM.tm=setInterval(mmTick,3000);mmTick()}
function mmDone(){clearInterval(MM.tm);try{if(MM.ar)MM.ar.off()}catch(e){}MM.l=0}
function mmShow(n,cb){$('mmn').textContent=n;$('mmo').textContent='👤';$('mmo').classList.remove('q');$('mmb').style.display='none';mmTxt('found');setTimeout(cb,1300)}
async function mmTick(){      // idempotent: waiting e boshao / heartbeat dao / keu thakle take niye match koro
 if(!MM.on||MM.busy)return;
 if(!(db&&conn)){mmTxt(Date.now()-MM.t0>8000?'noconn':'conn2');return}
 if(!MM.l){MM.l=1;MM.ar=db.ref(MMP+'matchAssignments/'+PID);MM.ar.on('value',s=>{const v=s.val();if(v&&MM.on)mmFound(v.opponentName,v.roomCode,v.seatIndex)})}
 MM.busy=1;let cl=null,r;
 try{r=await db.ref(MMP+'waitingPlayer').transaction(cur=>{cl=null;
   if(cur&&cur.playerId!==PID&&sNow()-(cur.lastHeartbeatTime||0)<12000){cl=cur;return null}
   return {playerId:PID,playerName:MM.nm,lastHeartbeatTime:sNow()}},undefined,false)}
 catch(e){MM.busy=0;return}
 MM.busy=0;
 if(r.committed&&cl)return mmMatch(cl);                       // opponent pelam -> room banai
 if(!MM.on){db.ref(MMP+'waitingPlayer').transaction(c=>c&&c.playerId===PID?null:c);return}   // cancel hoye gese
 if(r.committed){db.ref(MMP+'waitingPlayer').onDisconnect().remove();mmTxt('srch')}}
async function mmMatch(o){    // ami pore ashechi: room banai, opponent ke janiye dei
 MM.on=0;mmDone();
 try{
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let id;
  for(let i=0;i<20;i++){id=Array.from({length:5},()=>A[Math.random()*A.length|0]).join('');if(!(await to(db.ref('rooms/'+id).once('value'))).exists())break}
  const ps=[{i:0,c:3,n:o.playerName},{i:1,c:1,n:MM.nm}],g=mk(ps,{first:[1,3][Math.random()*2|0],bs:1});g.dl=sNow()+TT+5000;
  await to(db.ref('rooms/'+id).set({playerCount:2,matchStarted:true,teamMode:false,isOnlineMatchmaking:true,breakSafeEnabled:true,matchStartedServerTime:sNow(),lastActivityServerTime:sNow(),createdAtServerTime:sNow(),nextDice:genDice(),
   players:{player0:{name:o.playerName,color:'blue'},player1:{name:MM.nm,color:'green'}},gameState:enc(g)}));
  await to(db.ref(MMP+'matchAssignments/'+o.playerId).set({roomCode:id,seatIndex:0,opponentName:MM.nm,createdAtServerTime:sNow()}));
  mmShow(o.playerName,()=>enter(id,1))
 }catch(e){MM.on=1;MM.t0=Date.now();clearInterval(MM.tm);MM.tm=setInterval(mmTick,3000);mmTxt('conn2')}}
function mmFound(n,id,seat){  // jar jonno wait korchilam: keu amake niye room baniyeche
 if(!MM.on)return;MM.on=0;mmDone();
 try{const w=db.ref(MMP+'waitingPlayer');w.onDisconnect().cancel();w.transaction(c=>c&&c.playerId===PID?null:c);db.ref(MMP+'matchAssignments/'+PID).remove()}catch(e){}
 mmShow(n,()=>enter(id,seat))}
function mmCancel(){
 MM.on=0;mmDone();
 if(db&&conn){try{const w=db.ref(MMP+'waitingPlayer');w.onDisconnect().cancel();w.transaction(c=>c&&c.playerId===PID?null:c)}catch(e){}}
 sc('home')}

// ===== Online / Custom match: 30s timer, back / offline = match theke bad, Firebase room auto cleanup =====
// rooms/<id>: lastActivityServerTime (live heartbeat), matchStartedServerTime, presence/player<n>/{isOnline,lastSeenServerTime}, gameState.turnDeadlineServerTime
let TT=30000,OLL=0,OLM=0,PRS={},STARTED=0,ENDT=0,HBT=0,OLT=0,TMB=0,RMB={},LDONE=0,LHB=0,JAN=0,ENDD=20000,ROOMGONE=0,LEFT=0;
const offl=(p,n,st)=>p?((p.isOnline===false&&n-(p.lastSeenServerTime||0)>8000)||n-(p.lastSeenServerTime||0)>30000):(n-st>45000);   // offline? (disconnect 8s, heartbeat 30s)
function leaveSeat(N2,s){       // ei player match theke bad (back / offline / manual remove)
 N2.out[s]=1;N2.pos[s]=[-1,-1,-1,-1];
 if(N2.team){N2.win=N2.cs.findIndex(c=>c%2!==N2.cs[s]%2);N2.ph='r';return}      // Team Up: ek jon gele oi team harbe
 const al=N2.cs.map((_,i)=>i).filter(i=>!N2.out[i]&&!N2.rk[i]);
 if(al.length<2){if(al.length)N2.rk[al[0]]=N2.rk.some(Boolean)?N2.n:1;N2.win=N2.rk.indexOf(1);N2.ph='r'}   // 1v1 e opponent auto win
 else if(N2.turn===s){N2.ph='r';N2.msg='';adv(N2)}}
function olBeat(){
 if(mode!=='O'||!base||!conn||ROOMGONE||LEFT||(S&&S.win>=0))return;
 const u={lastActivityServerTime:sNow()};if(OLM){u['presence/player'+me+'/isOnline']=true;u['presence/player'+me+'/lastSeenServerTime']=sNow()}
 base.update(u).catch(()=>{})}
function olLobby(){             // lobby: host chole gele room remove, joiner chole gele nijer seat remove
 if(OLL)return;OLL=1;
 try{if(me===0)base.onDisconnect().remove();else base.child('players/player'+me).onDisconnect().remove()}catch(e){}
 olBeat();if(!HBT)HBT=setInterval(olBeat,8000)}
function olMatch(){             // match shuru: presence + heartbeat + timer + offline watcher (ekbar)
 if(OLM)return;OLM=1;
 try{if(OLL){if(me===0)base.onDisconnect().cancel();else base.child('players/player'+me).onDisconnect().cancel()}}catch(e){}
 try{base.child('presence/player'+me).onDisconnect().set({isOnline:false,lastSeenServerTime:firebase.database.ServerValue.TIMESTAMP})}catch(e){}
 base.child('presence').on('value',s=>{PRS=s.val()||{}});
 olBeat();if(!HBT)HBT=setInterval(olBeat,8000);
 OLT=setInterval(olTick,250);setInterval(olWatch,2000);
 addEventListener('pagehide',()=>{if(!LEFT&&!ROOMGONE&&!(S&&S.win>=0)){try{base.child('presence/player'+me+'/isOnline').set(false)}catch(e){}}})}
function olTick(){              // 30s ring + timeout + match shesh hole data remove
 if(mode!=='O'||!S||!TK)return;
 const now=sNow();
 [0,1,2,3].forEach(c=>{const s=S.cs.indexOf(c),p=$('pl'+c);if(!p)return;
  const on=s>=0&&s===S.turn&&S.win<0&&!S.out[s]&&S.dl>0;p.classList.toggle('tm',on);
  if(on){const f=Math.max(0,Math.min(1,(S.dl-now)/TT)),e=p.querySelector('.tf');e.style.strokeDashoffset=(119.4*(1-f)).toFixed(1);e.style.stroke=f>.5?'#3ddc4a':f>.25?'#ffc21f':'#ff3b30'}});
 if(S.win>=0){if(!ENDT){try{base.child('presence/player'+me).onDisconnect().cancel()}catch(e){}ENDT=setTimeout(()=>{if(!LEFT)try{base.remove()}catch(e){}},ENDD)}return}
 const mine=S.ow[S.turn]===me;
 if(S.dl&&now>S.dl+(mine?400:3500+me*400)&&!TMB){TMB=1;olTimeout().then(()=>{TMB=0},()=>{TMB=0})}}
async function olTimeout(){     // 30s e roll / move hoy nai: hat next player er
 const d0=S.dl;
 try{await to(base.child('gameState').transaction(gs=>{
  if(!gs)return gs;if(gs.winnerSeat>=0||gs.turnDeadlineServerTime!==d0)return;     // onno keu age kore felse
  const g=dec(gs);g.ph='r';g.msg='';g.sx[g.turn]=0;adv(g);g.dl=sNow()+TT;return enc(g)},undefined,false),8000)}catch(e){}}
function olWatch(){             // onno player offline hoyeche?
 if(mode!=='O'||!S||S.win>=0||!base||!conn)return;
 const n=sNow();S.cs.forEach((c,s)=>{if(S.out[s]||S.ow[s]===me)return;if(offl(PRS['player'+S.ow[s]],n,STARTED))olRemove(s,'stale')})}
async function olRemove(s,why){ // seat s ke match theke remove (transaction: ekbar-i hoy)
 if(RMB[s])return;RMB[s]=1;setTimeout(()=>{RMB[s]=0},3000);
 const pi=S.ow[s];
 try{await to(base.transaction(room=>{
  if(!room||!room.gameState||room.gameState.winnerSeat>=0)return room;
  const g=dec(room.gameState);if(g.out[s]||g.win>=0)return room;
  if(why==='stale'&&!offl((room.presence||{})['player'+pi],sNow(),room.matchStartedServerTime||0))return room;
  leaveSeat(g,s);g.dl=sNow()+TT;room.gameState=enc(g);return room},undefined,false),8000)}catch(e){}}
async function exitG(){         // back / exit: online e hole age match theke bad + data clean, tarpor reload
 try{sessionStorage.setItem('bl_home','1')}catch(e){}
 LEFT=1;try{await to(leaveClean(),2500)}catch(e){}
 location.reload()}
async function leaveClean(){
 if(!db||!base)return;
 if(mode==='O'){
  const pr=base.child('presence/player'+me);
  try{base.onDisconnect().cancel()}catch(e){}
  if(!S||!OLM){if(me===0)await base.remove();else await base.child('players/player'+me).remove();return}   // lobby / search cancel
  if(S.win>=0){await base.remove();return}
  const s=S.ow.indexOf(me);if(s>=0&&!S.out[s])await olRemove(s,'left');
  await pr.set({isOnline:false,lastSeenServerTime:sNow()});
  const room=(await base.once('value')).val()||{},g=room.gameState,n=sNow();
  const live=g&&(g.seatPlayerIndexes||[]).some((pi,k)=>pi!==me&&!(g.removedSeats||[])[k]&&!offl((room.presence||{})['player'+pi],n,room.matchStartedServerTime||0));
  if(!live)await base.remove()}                                                                   // keu live nai -> match remove
 else if(mode==='L'&&synced&&base&&!LDONE){base.off();await base.remove()}}
function lClean(){LDONE=1;if(base&&conn&&synced){try{base.off();base.remove()}catch(e){}}synced=0;base=null}   // local match shesh -> Firebase data remove
function lbeat(){if(mode==='L'&&synced&&base&&!LDONE&&conn&&Date.now()-LHB>8000){LHB=Date.now();base.update({lastActivityServerTime:sNow()}).catch(()=>{})}}
async function janitor(){       // bash hoye thaka / sob offline match remove (app khola thakle protibar + 5 min por por)
 if(!db||!conn||JAN)return;JAN=1;setTimeout(()=>{JAN=0},60000);
 try{
  const all=(await to(db.ref('rooms').once('value'),10000)).val()||{},n=sNow();
  for(const k of Object.keys(all)){const r=all[k]||{};
   if(k==='onlineMatchmaking'){
    const w=r.waitingPlayer;if(w&&n-(w.lastHeartbeatTime||0)>30000)db.ref(MMP+'waitingPlayer').remove();
    Object.keys(r.matchAssignments||{}).forEach(p=>{if(n-((r.matchAssignments[p]||{}).createdAtServerTime||0)>120000)db.ref(MMP+'matchAssignments/'+p).remove()});continue}
   if(k===code)continue;
   if(n-(r.lastActivityServerTime||0)>60000)db.ref('rooms/'+k).remove()}}catch(e){}}

// ===== Match result + baji (fireworks) =====
function showRes(){
 const A=S.cs[S.win]%2,W=s=>S.team?S.cs[s]%2===A:!S.out[s]&&S.rk[s]<S.n,
  o=S.cs.map((_,s)=>s).sort((a,b)=>(W(b)-W(a))||((S.rk[a]||99)-(S.rk[b]||99))),nw=o.filter(W).length,
  cr='<svg class="ci" viewBox="0 0 60 44"><use href="#crown"/></svg>';
 $('rrows').innerHTML=o.map((s,i)=>'<div class="rr'+(i?'':' g')+'">'+(S.rk[s]&&S.rk[s]<=3&&S.rk[s]<S.n?'<span class="cr3"><svg viewBox="0 0 60 44"><use href="#crown"/></svg><b>'+S.rk[s]+'</b></span>':'<i class="ci"></i>')+pinI(S.cs[s])+'<b>'+esc(nm(s))+'</b><em>'+(i?t(W(s)?'won':'lost'):'🪙 +500')+'</em></div>').join('');
 $('rw').textContent=nw;$('rl').textContent=S.n-nw;
 const co=(+ld('coins')||2250)+500;sv('coins',co);$('co').textContent=co.toLocaleString();
 $('rep').style.display=mode==='O'?'none':'';$('rs').classList.add('on');fire()}
function replay(){if(!LAST)return;try{sessionStorage.setItem('bl_rp',JSON.stringify(LAST))}catch(e){}location.reload()}
function share(){const x=$('st').textContent+' — Ludo King';if(navigator.share)navigator.share({text:x}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(x)}
const FX={p:[],r:[],on:0};
function fire(){
 const cv=$('fx'),g=cv.getContext('2d');cv.style.display='block';cv.width=innerWidth;cv.height=innerHeight;if(FX.on)return;FX.on=1;
 const launch=()=>FX.r.push({x:cv.width*(.1+Math.random()*.8),y:cv.height,vy:-cv.height*(.011+Math.random()*.004),ty:cv.height*(.1+Math.random()*.4),h:Math.random()*360});
 const boom=r=>{const n=70,sp=1.5+Math.random()*2.5;for(let i=0;i<n;i++){const a=6.283*i/n,s=sp*(.6+Math.random()*.8);FX.p.push({x:r.x,y:r.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,h:r.h+Math.random()*50})}};
 for(let i=0;i<5;i++)setTimeout(launch,i*220);
 (function f(){
  g.globalCompositeOperation='destination-out';g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,0,cv.width,cv.height);g.globalCompositeOperation='lighter';
  if(Math.random()<.08)launch();
  FX.r=FX.r.filter(r=>{r.y+=r.vy;g.fillStyle='hsl('+r.h+',100%,85%)';g.fillRect(r.x-1.5,r.y,3,16);if(r.y<=r.ty){boom(r);return false}return true});
  FX.p=FX.p.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.04;p.vx*=.985;p.l-=.011;g.fillStyle='hsla('+p.h+',100%,60%,'+Math.max(p.l,0)+')';g.beginPath();g.arc(p.x,p.y,2.3,0,6.3);g.fill();return p.l>0});
  requestAnimationFrame(f)})()}

// ===== Boot =====
applyLang();loadFB();
window.addEventListener('online',tick);window.addEventListener('offline',setConn);document.addEventListener('visibilitychange',tick);setInterval(tick,2500);setInterval(janitor,300000);
setTimeout(()=>$('tp').classList.add('show'),1700);
$('splash').onclick=()=>{if($('tp').classList.contains('show')){sc('home');music(1)}};
try{if(sessionStorage.getItem('bl_home')){sessionStorage.removeItem('bl_home');sc('home')}}catch(e){}

$('lg').innerHTML=$('logo').innerHTML;if(ld('coins'))$('co').textContent=(+ld('coins')).toLocaleString();
// Replay: reload er por sathe sathe match shuru hoy, tokhon PNG load hoy nai => ager coded guti ashto. Ekhon image load hobar por match shuru (max 3s opekkha)
try{const R=sessionStorage.getItem('bl_rp');if(R){sessionStorage.removeItem('bl_rp');const r=JSON.parse(R);sc('home');
 Promise.race([IMGP,new Promise(ok=>setTimeout(ok,3000))]).then(()=>local(r.cs,r.o)).catch(e=>console.warn('replay',e))}}catch(e){}
