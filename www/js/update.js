// ===== Update system (Firebase) =====
// Firebase (Realtime Database), see docs/firebase-structure.png:
//     system/version : "14.1 (Short note)"   <- number first, optional note in ( )
//     system/url     : "https://.../Ludo_King_v14.1.apk"   (direct https link of the new APK)
//
// OB update    = bigger first number than the installed app (14 -> 15): MANDATORY. No "Later". The game cannot be used until updated.
//                It is remembered on the phone, so even if the player goes offline and opens the game again, the popup comes back.
// Patch update = same first number, newer after the dot (14 -> 14.1): popup with "Later" (game can be played).
// Offline when the game opens (and nothing remembered) = no check at all. Online = live check (also when it changes while playing).
// Download + install are done by the Android app (window.AndroidApp, see android/ .../UpdateBridge.java).
(function(){
'use strict';
const SYS='system',PK='bl_updreq',NA=window.AndroidApp||null;

// ---- version helpers ----
const parse=s=>{const m=String(s==null?'':s).match(/\d+(?:\.\d+)*/);return m?{n:m[0].split('.').map(Number),t:m[0]}:null};
const cmp=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x>y?1:-1}return 0};
const note=s=>{const m=String(s||'').match(/\(([^)]*)\)/);return m?m[1].trim():''};
const CUR=parse(typeof APP_VERSION!=='undefined'?APP_VERSION:'0')||{n:[0],t:'0'};
const kindOf=v=>{const r=parse(v);if(!r||cmp(r.n,CUR.n)<=0)return '';return r.n[0]>CUR.n[0]?'ob':'patch'};

const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const L=()=>(typeof LANG!=='undefined'&&LANG==='bn')?'bn':'en';
const TXT={
 en:{tOb:'Update required',tPa:'Update available',mOb:'A new version is out. You must update to keep playing.',mPa:'A new version is ready to download.',
  upd:'Update',later:'Later',cancel:'Cancel',retry:'Retry',inst:'Install',set:'Open settings',dl:'Downloading…',ver:'Version',
  net:'Connect to the internet, then tap Update.',perm:'Allow Ludo King to install apps, then come back here.',ready:'Download finished. Tap Install.',insg:'Installing…',err:'Update failed'},
 bn:{tOb:'আপডেট দরকার',tPa:'নতুন আপডেট',mOb:'নতুন ভার্সন এসেছে। খেলা চালিয়ে যেতে আপডেট করতেই হবে।',mPa:'নতুন ভার্সন ডাউনলোডের জন্য তৈরি।',
  upd:'আপডেট',later:'পরে',cancel:'বাতিল',retry:'আবার চেষ্টা',inst:'ইনস্টল',set:'সেটিংস খোলো',dl:'ডাউনলোড হচ্ছে…',ver:'ভার্সন',
  net:'ইন্টারনেট চালু করে আপডেট চাপো।',perm:'Ludo King কে অ্যাপ ইনস্টলের অনুমতি দাও, তারপর ফিরে এসো।',ready:'ডাউনলোড শেষ। ইনস্টল চাপো।',insg:'ইনস্টল হচ্ছে…',err:'আপডেট হয়নি'}};
const t=k=>TXT[L()][k];

// ---- state ----
let info=null;            // {t:'15', note:'', url:'', kind:'ob'|'patch'}
let phase='idle';         // idle | prompt | downloading | needperm | ready | installing | error
let err='',prog={d:0,t:0};
const later={};           // patch versions the player skipped (this app session)

// ---- popup ----
let el=null;
function build(){
 if(el)return;
 el=document.createElement('div');el.id='upd';el.className='md';
 el.innerHTML='<div class="mb"><h2 class="ti" id="updT"></h2><p id="updM"></p><div class="ld" id="updB"><i></i></div><p class="us" id="updS"></p>'+
  '<button class="gb" id="updY"></button><button class="gb" id="updN"></button></div>';
 (document.getElementById('stage')||document.body).appendChild(el);
 el.addEventListener('pointerdown',e=>e.stopPropagation());           // taps here must not start the menu music behind
 document.getElementById('updY').onclick=onYes;
 document.getElementById('updN').onclick=onNo;
}
const q=id=>document.getElementById(id);
const mb=b=>(b/1048576).toFixed(1);
function render(){
 if(phase==='idle'||!info){if(el)el.classList.remove('on');return}
 build();
 const ob=info.kind==='ob',Y=q('updY'),N=q('updN'),B=q('updB'),M=q('updM'),S=q('updS');
 q('updT').textContent=t(ob?'tOb':'tPa');
 let m=t(ob?'mOb':'mPa'),s=t('ver')+' '+info.t+(info.note?' · '+info.note:'');
 B.style.display='none';Y.style.display='';N.style.display='none';Y.disabled=false;
 if(phase==='prompt'){Y.textContent=t('upd');if(!info.url)s+='\n'+t('net');if(!ob){N.style.display='';N.textContent=t('later')}}
 else if(phase==='downloading'){
  m=t('dl');B.style.display='';const p=prog.t>0?Math.min(100,prog.d/prog.t*100):0;B.firstElementChild.style.width=p+'%';
  s=(prog.t>0?Math.round(p)+'%  ·  '+mb(prog.d)+' / '+mb(prog.t)+' MB':mb(prog.d)+' MB');Y.style.display='none';N.style.display='';N.textContent=t('cancel')}
 else if(phase==='needperm'){m=t('perm');Y.textContent=t('set');if(!ob){N.style.display='';N.textContent=t('later')}}
 else if(phase==='ready'){m=t('ready');Y.textContent=t('inst');if(!ob){N.style.display='';N.textContent=t('later')}}
 else if(phase==='installing'){m=t('insg');Y.style.display='none'}
 else if(phase==='error'){m=t('err')+(err?': '+err:'');Y.textContent=t('retry');if(!ob){N.style.display='';N.textContent=t('later')}}
 M.textContent=m;S.textContent=s;S.style.whiteSpace='pre-line';
 el.classList.add('on');
}
function hide(){phase='idle';render()}

// ---- buttons ----
function onYes(){
 if(phase==='needperm'||phase==='ready'){if(NA)NA.installUpdate();return}
 if(!info||!info.url){try{toast(t('net'))}catch(e){}return}          // remembered OB update but no internet yet
 if(!NA){window.open(info.url,'_blank');return}                      // opened in a normal browser
 err='';prog={d:0,t:0};phase='downloading';render();
 try{NA.startUpdate(info.url)}catch(e){phase='error';err=String(e);render()}
}
function onNo(){
 if(phase==='downloading'){try{NA.cancelUpdate()}catch(e){}return}
 if(info&&info.kind==='patch'){later[info.t]=1;hide()}
}

// ---- called by the Android app ----
window.__upd={
 onProgress(d,tt){prog={d:d,t:tt};if(phase!=='downloading'){phase='downloading'}render()},
 onState(s,m){
  if(s==='downloading')phase='downloading';
  else if(s==='downloaded')phase='ready';
  else if(s==='needperm')phase='needperm';
  else if(s==='installing')phase='installing';
  else if(s==='cancelled')phase='prompt';
  else if(s==='error'){phase='error';err=m||''}
  render()},
 onResume(){if(phase==='installing'){phase='ready';render()}},       // installer was closed without installing
 onBack(){                                                           // Android back button: true = handled here
  if(phase==='idle'||!info)return false;
  if(info.kind==='patch'&&phase!=='downloading'&&phase!=='installing'){later[info.t]=1;hide()}
  return true}
};

// ---- Firebase value arrived (live) ----
function onSys(v){
 const ver=v&&v.version,k=kindOf(ver);
 if(!k){                                                             // up to date, or update withdrawn
  store.del(PK);
  if(phase==='prompt'||phase==='error'||phase==='idle')hide();
  return}
 const r=parse(ver);
 info={t:r.t,note:note(ver),url:v&&v.url?String(v.url):'',kind:k};
 if(k==='ob')store.set(PK,JSON.stringify({v:r.t}));
 if(k==='patch'&&later[r.t]&&phase==='idle')return;                  // player tapped "Later" for this one
 if(phase==='idle'||phase==='prompt'||phase==='error')phase='prompt';
 render()}

// ---- boot ----
// 1) an OB update that was seen earlier but not installed: block right away, even offline
try{
 const st=JSON.parse(store.get(PK)||'null'),r=st&&parse(st.v);
 if(r&&r.n[0]>CUR.n[0]){info={t:r.t,note:'',url:'',kind:'ob'};phase='prompt';render()}
 else if(st)store.del(PK)
}catch(e){store.del(PK)}
// 2) online: listen to Firebase (db is created by game.js when the Firebase SDK is loaded; offline = no event = no check)
let attached=0;
function attach(){
 if(attached||typeof db==='undefined'||!db)return;attached=1;
 try{db.ref(SYS).on('value',s=>onSys(s.val()),e=>console.warn('update check: cannot read /'+SYS+' (Firebase rules need ".read": true for "system")',e))}
 catch(e){attached=0}}
attach();setInterval(attach,1000);
})();
