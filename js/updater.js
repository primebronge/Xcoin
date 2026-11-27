// ===== Auto update (APK only) =====
// Online hole Firebase Realtime Database er  /system  = { url: "<apk link>", version: "<number>" }  porbe.
// App er version (README er latest "(vNN)") er theke Firebase version boro hole update popup ashe.
// Offline hole / browser e khulle kichu hoy na. Download -> install permission -> direct install: native plugin ApkUpdater.
(function () {
  'use strict';
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;   // browser e update nai
  var P = null;
  try { P = (Cap.Plugins && Cap.Plugins.ApkUpdater) || Cap.registerPlugin('ApkUpdater'); } catch (e) {}
  if (!P) return;

  var TX = {
    en: {
      title: 'Update available',
      msg: 'Version {n} is ready. You have version {c}.',
      go: 'Update', later: 'Later', retry: 'Retry', inst: 'Install',
      dl: 'Downloading… {p}%',
      perm: 'Allow "Install unknown apps" for Ludo King, then come back. The update will install by itself.',
      ing: 'Installing the update…',
      err: 'Update failed. Check your internet and try again.'
    },
    bn: {
      title: 'আপডেট এসেছে',
      msg: 'নতুন ভার্সন {n} এসেছে। আপনার ভার্সন {c}।',
      go: 'আপডেট', later: 'পরে', retry: 'আবার চেষ্টা', inst: 'ইনস্টল',
      dl: 'ডাউনলোড হচ্ছে… {p}%',
      perm: '"Install unknown apps" অনুমতি দিন, তারপর ফিরে আসুন। আপডেট নিজে থেকেই ইনস্টল হবে।',
      ing: 'আপডেট ইনস্টল হচ্ছে…',
      err: 'আপডেট হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।'
    }
  };
  function lang() { return (typeof LANG !== 'undefined' && TX[LANG]) ? LANG : 'en'; }
  function tr(k, v) {
    var s = TX[lang()][k] || k;
    if (v) for (var x in v) s = s.replace('{' + x + '}', v[x]);
    return s;
  }

  // "1.0 (Example)" -> [1,0] ; "15" -> [15]
  function nums(v) { var m = String(v == null ? '' : v).match(/\d+(?:\.\d+)*/); return m ? m[0].split('.').map(Number) : [0]; }
  function cmp(a, b) {
    a = nums(a); b = nums(b);
    for (var i = 0, n = Math.max(a.length, b.length); i < n; i++) {
      var x = a[i] || 0, y = b[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  function getJSON(url, ms) {
    return new Promise(function (ok, no) {
      var done = 0, tm = setTimeout(function () { if (!done) { done = 1; no('timeout'); } }, ms);
      fetch(url, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(function (j) { if (!done) { done = 1; clearTimeout(tm); ok(j); } })
        .catch(function (e) { if (!done) { done = 1; clearTimeout(tm); no(e); } });
    });
  }

  // ---------- popup ----------
  var css = document.createElement('style');
  css.textContent =
    '#upd .pbar{height:16px;border:2px solid var(--g);border-radius:10px;background:#0006;overflow:hidden;margin:2px 0 14px}' +
    '#upd .pbar i{display:block;height:100%;width:0;background:linear-gradient(#ffe36b,#ffa000);transition:width .15s}' +
    '#upd .mb{font-size:20px}';
  document.head.appendChild(css);

  var info = null, cur = null, state = '', box = null, $ = function (id) { return document.getElementById(id); };

  function build() {
    box = document.createElement('div');
    box.id = 'upd';
    box.className = 'md on';
    box.innerHTML = '<div class="mb"><h2 class="ti" id="updT"></h2><p id="updM"></p>' +
      '<div class="pbar" id="updB" style="display:none"><i></i></div>' +
      '<div class="row" id="updR"><button class="gb" id="updGo"></button><button class="gb" id="updNo"></button></div></div>';
    (document.getElementById('stage') || document.body).appendChild(box);
    $('updGo').onclick = function () {
      if (state === 'ask' || state === 'err') download(); else install();
    };
    $('updNo').onclick = function () { if (box) { box.remove(); box = null; } };
  }

  function set(s, pct) {
    if (!box) return;
    state = s;
    var go = $('updGo'), no = $('updNo'), bar = $('updB');
    $('updT').textContent = tr('title');
    bar.style.display = s === 'dl' ? 'block' : 'none';
    go.style.display = (s === 'dl' || s === 'ing') ? 'none' : '';
    no.style.display = s === 'dl' ? 'none' : '';
    no.textContent = tr('later');
    go.textContent = tr(s === 'err' ? 'retry' : (s === 'perm' || s === 'ing') ? 'inst' : 'go');
    if (s === 'ask') $('updM').textContent = tr('msg', { n: String(info.version).trim(), c: cur.versionName });
    else if (s === 'dl') {
      var p = Math.max(0, Math.min(100, pct | 0));
      $('updM').textContent = tr('dl', { p: p });
      bar.firstChild.style.width = p + '%';
    }
    else if (s === 'perm') $('updM').textContent = tr('perm');
    else if (s === 'ing') { $('updM').textContent = tr('ing'); go.style.display = ''; go.textContent = tr('inst'); }
    else if (s === 'err') $('updM').textContent = tr('err');
  }

  function download() {
    set('dl', 0);
    var hp = null;
    try { hp = P.addListener('progress', function (e) { if (state === 'dl' && e && e.percent >= 0) set('dl', e.percent); }); } catch (e) {}
    function off() { try { Promise.resolve(hp).then(function (h) { if (h && h.remove) h.remove(); }); } catch (e) {} }
    P.download({ url: String(info.url).trim() })
      .then(function () { off(); install(); })
      .catch(function () { off(); set('err'); });
  }

  function install() {
    P.install()
      .then(function (r) { set(r && r.status === 'needs_permission' ? 'perm' : 'ing'); })
      .catch(function () { set('err'); });
  }

  // ---------- check ----------
  function check() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;   // offline: check nai
    var base = (typeof firebaseConfig !== 'undefined' && firebaseConfig.databaseURL) ? String(firebaseConfig.databaseURL).replace(/\/+$/, '') : '';
    if (!base) return;
    Promise.all([P.getVersion(), getJSON(base + '/system.json', 8000)]).then(function (r) {
      cur = r[0]; info = r[1];
      if (!cur || !info || !info.url || info.version == null) return;
      if (cmp(info.version, cur.versionName) <= 0) return;      // already latest
      whenReady(function () { build(); set('ask'); });
    }).catch(function () {});                                   // net nai / Firebase read hoy ni -> chupchap bad
  }

  // popup shudhu loading splash shesh hole dekhabe
  function whenReady(cb) {
    var n = 0, iv = setInterval(function () {
      var s = document.getElementById('splash');
      if (!s || !s.classList.contains('on') || ++n > 240) { clearInterval(iv); setTimeout(cb, 500); }
    }, 500);
  }

  check();
})();
