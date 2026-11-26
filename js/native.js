/* Ludo King - Android app bridge
   1) Firebase update check (system/version + system/url) -> popup -> download -> install (native kaj MainActivity.java te)
   2) Android Back button handling
   Browser e khulle (window.LudoNative nai) ei file kichui kore na. */
(function () {
  'use strict';
  var N = window.LudoNative;
  if (!N) return;

  var $id = function (i) { return document.getElementById(i); };
  var lang = function () { try { return LANG === 'bn' ? 'bn' : 'en'; } catch (e) { return 'en'; } };

  var T = {
    en: {
      t: 'Update Available', m: 'A new version ({v}) is available.', ok: 'UPDATE', later: 'LATER', retry: 'RETRY',
      dl: 'Downloading… {p}%', dl0: 'Downloading…',
      perm: 'Allow "Install unknown apps" for Ludo King, then come back.',
      inst: 'Opening installer…',
      err: 'Update failed. Check your internet and try again.',
      bad: 'Update file is not valid. Try again later.',
      deny: 'Permission not given. Tap UPDATE to try again.',
      exit: 'Press back again to exit'
    },
    bn: {
      t: 'আপডেট এসেছে', m: 'নতুন ভার্সন ({v}) পাওয়া গেছে।', ok: 'আপডেট', later: 'পরে', retry: 'আবার',
      dl: 'ডাউনলোড হচ্ছে… {p}%', dl0: 'ডাউনলোড হচ্ছে…',
      perm: '"অজানা অ্যাপ ইনস্টল" অনুমতি চালু করুন, তারপর ফিরে আসুন।',
      inst: 'ইনস্টলার খুলছে…',
      err: 'আপডেট হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।',
      bad: 'আপডেট ফাইলটি ঠিক নেই। পরে চেষ্টা করুন।',
      deny: 'অনুমতি দেওয়া হয়নি। আবার চেষ্টা করতে আপডেট চাপুন।',
      exit: 'বের হতে আবার Back চাপুন'
    }
  };
  var tx = function (k, o) {
    var s = (T[lang()] || T.en)[k] || '';
    if (o) for (var x in o) s = s.replace('{' + x + '}', o[x]);
    return s;
  };

  // ---------- version compare: "13", "v14", "1.2", "1.0 (Example)" shob chole ----------
  function nums(s) {
    var m = String(s == null ? '' : s).match(/\d+(?:\.\d+)*/);
    return m ? m[0].split('.').map(Number) : [];
  }
  function cmp(a, b) {
    var n = Math.max(a.length, b.length);
    for (var i = 0; i < n; i++) {
      var x = a[i] || 0, y = b[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  // ---------- popup ----------
  var url = '', state = 'ask', verText = '';

  function injectCss() {
    if ($id('lkup-css')) return;
    var st = document.createElement('style');
    st.id = 'lkup-css';
    st.textContent =
      '#lkup{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.62);' +
      "font-family:LudoFont,'Lilita One',Impact,BnFont,'Noto Sans Bengali','Hind Siliguri',system-ui,sans-serif;-webkit-user-select:none;user-select:none}" +
      '#lkup.on{display:flex}' +
      '#lkup .bx{width:min(84vw,330px);box-sizing:border-box;padding:20px 18px 18px;border-radius:22px;background:linear-gradient(#2f86ea,#0d3d96);border:4px solid #fff3a0;box-shadow:0 10px 30px rgba(0,0,0,.6);text-align:center;color:#fff}' +
      '#lkup h3{margin:0 0 8px;font-size:26px;font-weight:400;color:#ffe45c;text-shadow:0 2px 0 #7a4a00}' +
      '#lkup p{margin:0 0 14px;font-size:17px;line-height:1.35}' +
      '#lkup .bar{height:16px;border-radius:9px;background:#0a2a6b;border:2px solid #fff;overflow:hidden;margin:0 0 12px;display:none}' +
      '#lkup .bar i{display:block;height:100%;width:0;background:linear-gradient(#7dff6a,#14a83a);transition:width .15s}' +
      '#lkup .bar.ind i{width:40%;animation:lkind 1s linear infinite alternate}' +
      '@keyframes lkind{from{margin-left:0}to{margin-left:60%}}' +
      '#lkup .row{display:flex;gap:10px;justify-content:center}' +
      '#lkup button{font:inherit;font-size:20px;padding:8px 18px;border-radius:14px;border:3px solid #fff;color:#fff;min-width:100px}' +
      '#lkup .ok{background:linear-gradient(#52e04a,#13902f)}' +
      '#lkup .no{background:linear-gradient(#6aa8f5,#2457b8)}' +
      '#lkuptoast{position:fixed;left:50%;bottom:9%;transform:translateX(-50%);z-index:99998;background:rgba(0,0,0,.78);color:#fff;padding:9px 18px;border-radius:18px;font-size:16px;' +
      "font-family:system-ui,'Noto Sans Bengali',sans-serif;pointer-events:none;white-space:nowrap}";
    document.head.appendChild(st);
  }

  function build() {
    if ($id('lkup')) return $id('lkup');
    injectCss();
    var d = document.createElement('div');
    d.id = 'lkup';
    d.innerHTML = '<div class="bx"><h3></h3><p></p><div class="bar"><i></i></div>' +
      '<div class="row"><button class="ok"></button><button class="no"></button></div></div>';
    document.body.appendChild(d);
    d.querySelector('.ok').onclick = startDownload;
    d.querySelector('.no').onclick = function () { d.classList.remove('on'); };
    return d;
  }

  function render(pct) {
    var d = build();
    var h = d.querySelector('h3'), p = d.querySelector('p'), bar = d.querySelector('.bar'),
      row = d.querySelector('.row'), ok = d.querySelector('.ok'), no = d.querySelector('.no');
    h.textContent = tx('t');
    var showBar = false, showBtns = false, okTxt = tx('ok');
    if (state === 'ask') { p.textContent = tx('m', { v: verText }); showBtns = true; }
    else if (state === 'down') {
      showBar = true;
      p.textContent = pct >= 0 ? tx('dl', { p: pct }) : tx('dl0');
      bar.classList.toggle('ind', !(pct >= 0));
      bar.firstChild.style.width = pct >= 0 ? pct + '%' : '';
    }
    else if (state === 'perm') { p.textContent = tx('perm'); }
    else if (state === 'inst') { p.textContent = tx('inst'); }
    else if (state === 'deny') { p.textContent = tx('deny'); showBtns = true; }
    else if (state === 'bad') { p.textContent = tx('bad'); showBtns = true; okTxt = tx('retry'); }
    else { p.textContent = tx('err'); showBtns = true; okTxt = tx('retry'); }
    bar.style.display = showBar ? 'block' : 'none';
    row.style.display = showBtns ? 'flex' : 'none';
    ok.textContent = okTxt;
    no.textContent = tx('later');
    d.classList.add('on');
  }

  function startDownload() {
    state = 'down';
    render(0);
    try { N.startUpdate(url); } catch (e) { state = 'err'; render(); }
  }

  // MainActivity.java theke ashe
  window.LudoUpdate = {
    onNative: function (type, data) {
      if (!$id('lkup')) return;
      if (type === 'progress') { state = 'down'; render(parseInt(data, 10)); }
      else if (type === 'permission') { state = 'perm'; render(); }
      else if (type === 'installing') { state = 'inst'; render(); }
      else if (type === 'idle') { state = 'ask'; render(); }
      else if (type === 'error') {
        state = data === 'permission_denied' ? 'deny' : (data === 'bad_apk' ? 'bad' : 'err');
        render();
      }
    }
  };

  // ---------- Firebase version check (shudhu online thakle; offline e kichu hoy na) ----------
  function whenReady(fn) {
    var iv = setInterval(function () {
      var s = document.body && document.body.dataset.s;
      if (s && s !== 'splash' && s !== 'game') { clearInterval(iv); fn(); }
    }, 500);
  }

  async function check() {
    var base = '';
    try { base = String(firebaseConfig.databaseURL || '').replace(/\/+$/, ''); } catch (e) { }
    if (!base) return;
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var tm = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) { } }, 8000);
    var d = null;
    try {
      var r = await fetch(base + '/system.json?_=' + Date.now(), { cache: 'no-store', signal: ctl ? ctl.signal : undefined });
      if (!r.ok) return;
      d = await r.json();
    } catch (e) {
      return;            // offline / rules bondho / timeout -> chupchap bad
    } finally {
      clearTimeout(tm);
    }
    if (!d || typeof d !== 'object') return;
    var rv = nums(d.version), lv = nums(N.getVersionName());
    var u = String(d.url || '');
    if (!rv.length || cmp(rv, lv) <= 0) return;      // app already latest
    if (!/^https:\/\//i.test(u)) return;              // url thik na
    url = u;
    verText = rv.join('.');
    state = 'ask';
    whenReady(function () { render(); });
  }

  // ---------- Android Back button ----------
  var lastBack = 0;
  function toast(msg) {
    var t = $id('lkuptoast');
    if (!t) { injectCss(); t = document.createElement('div'); t.id = 'lkuptoast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.style.display = 'none'; }, 1800);
  }

  // true = game nijei handle korlo; false = app bondho hobe
  window.__ludoBack = function () {
    var pop = $id('lkup');
    if (pop && pop.classList.contains('on')) {
      if (state === 'ask' || state === 'err' || state === 'bad' || state === 'deny') pop.classList.remove('on');
      return true;
    }
    var open = document.querySelectorAll('.md.on');
    if (open.length) { for (var i = 0; i < open.length; i++) open[i].classList.remove('on'); return true; }
    var s = document.body.dataset.s;
    try {
      if (s === 'splash') return true;
      if (s === 'lset' || s === 'tset' || s === 'set') { sc('home'); return true; }
      if (s === 'onl') { oBack(); return true; }
      if (s === 'mmk') { mmCancel(); return true; }
      if (s === 'lobby') { exitG(); return true; }
      if (s === 'game') {
        if (typeof S !== 'undefined' && S && S.win >= 0) exitG(); else openM();
        return true;
      }
    } catch (e) { }
    var now = Date.now();
    if (now - lastBack < 2000) return false;
    lastBack = now;
    toast(tx('exit'));
    return true;
  };

  check();
})();
