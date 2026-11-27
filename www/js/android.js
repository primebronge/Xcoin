// ===== Android back button =====
// The Android app calls window.__nativeBack() when Back is pressed. Return true = handled here.
//  - update popup (js/update.js)      : OB update blocks Back, patch popup = "Later"
//  - open popup (menu / exit / ...)   : close it
//  - in a match                        : opens "exit match?" popup (same as 3-line menu > Exit match)
//  - result screen                     : go home
//  - any sub screen                    : its own back button (↩)
//  - HOME screen                       : press Back twice to exit the app
(function(){
'use strict';
let last=0;
const on=id=>{const e=document.getElementById(id);return !!e&&e.classList.contains('on')};
const msg=()=>(typeof LANG!=='undefined'&&LANG==='bn')?'বেরিয়ে যেতে আবার Back চাপো':'Press back again to exit';
window.__nativeBack=function(){
 if(window.__upd&&window.__upd.onBack&&window.__upd.onBack())return true;
 if(on('lv'))return true;                                            // "you were removed" popup: only its Home button
 for(const id of ['rm','ad','pf','mm','md']){if(on(id)){document.getElementById(id).classList.remove('on');return true}}
 const s=document.body.dataset.s;
 if(s==='game'){
  if(on('rs')){exitG();return true}
  document.getElementById('md').classList.add('on');return true}
 if(s&&s!=='home'&&s!=='splash'){const b=document.querySelector('.scr.on .bk');if(b){b.click();return true}}
 const n=Date.now();
 if(n-last<2000){if(window.AndroidApp)window.AndroidApp.exitApp();return true}
 last=n;try{toast(msg())}catch(e){}return true};
})();
