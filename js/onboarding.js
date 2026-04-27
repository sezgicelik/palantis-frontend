/* ══════════════════════════════════
   NOXARA — ONBOARDING + LANDING
   Landing → Sunucu Sec → Login → Taraf → Irk
══════════════════════════════════ */

let obMode = 'login';
let obSelectedSide = null;
let obSelectedIrk = null;
let obSelectedKral = '';
let obSelectedSehir = '';
let obSelectedPass = '';
let _selectedServerId = null;

/* ── Landing: Sunucu kartlarini render et ── */
function renderServerGrid() {
  const grid = document.getElementById('server-grid');
  if (!grid) return;
  grid.innerHTML = '';
  SUNUCULAR.forEach(srv => {
    const card = document.createElement('div');
    card.className = 'server-card' + (srv.durum === 'yakinda' ? ' yakinda' : '') + (_selectedServerId === srv.id ? ' selected' : '');
    card.innerHTML =
      '<div class="server-card-icon">' + srv.ikon + '</div>' +
      '<div class="server-card-name">' + srv.isim + '</div>' +
      '<div class="server-card-status ' + srv.durum + '">' + (srv.durum === 'aktif' ? 'AKTIF' : 'YAKINDA') + '</div>' +
      (srv.durum === 'aktif' ? '<div class="server-card-players" id="srv-players-' + srv.id + '"></div>' : '');
    if (srv.durum === 'aktif') {
      card.onclick = () => {
        _selectedServerId = srv.id;
        setSelectedServer(srv.id);
        renderServerGrid();
        document.getElementById('landing-cta').disabled = false;
      };
      // Oyuncu sayisini cek
      fetchServerPlayerCount(srv);
    }
    grid.appendChild(card);
  });
}

function fetchServerPlayerCount(srv) {
  fetch(srv.url + '/api/stats/sides')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      const el = document.getElementById('srv-players-' + srv.id);
      if (el) el.textContent = ((data.iyi || 0) + (data.kotu || 0)) + ' oyuncu';
    })
    .catch(() => {});
}

/* ── Landing → Onboarding gecis ── */
function landingEnter() {
  if (!_selectedServerId) return;
  document.getElementById('landing').classList.add('landing-hidden');
  document.getElementById('ob-overlay').style.display = 'flex';
  // Secili sunucu badge
  const srv = getSelectedServer();
  const badge = document.getElementById('ob-server-badge');
  if (badge && srv) badge.textContent = srv.ikon + ' ' + srv.isim;
  showObStep('login');
}

function landingGeri() {
  document.getElementById('ob-overlay').style.display = 'none';
  document.getElementById('landing').classList.remove('landing-hidden');
}

/* ── Sayfa yuklenince kontrol ── */
(function obInit() {
  // Sunucu gridini render et
  renderServerGrid();

  // Onceki secili sunucu varsa hatirlat
  const prevSrv = getSelectedServer();
  if (prevSrv) {
    _selectedServerId = prevSrv.id;
    renderServerGrid();
    const ctaBtn = document.getElementById('landing-cta');
    if (ctaBtn) ctaBtn.disabled = false;
  }

  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlSetup = params.get('setup');

  if (urlToken) {
    setToken(urlToken);
    window.history.replaceState({}, '', window.location.pathname);
    // Google OAuth donusu — landing'i atla
    document.getElementById('landing').classList.add('landing-hidden');
    document.getElementById('ob-overlay').style.display = 'flex';
    if (urlSetup === 'false') {
      loadPlayerFromAPI().then(p => {
        if (p) obSelectedKral = p.username || p.kral || '';
        showObStep('side');
      });
      return;
    }
    loadPlayerFromAPI().then(p => {
      if (p && p.setup_done) { savePlayer(p); obApplyPlayer(p); window.location.href = 'home.html'; }
      else showObStep('login');
    });
    return;
  }

  if (getToken() && prevSrv) {
    // Kayitli kullanici + secili sunucu — direkt kontrol
    document.getElementById('landing').classList.add('landing-hidden');
    document.getElementById('ob-overlay').style.display = 'flex';
    loadPlayerFromAPI().then(p => {
      if (p && p.setup_done) {
        savePlayer(p);
        obApplyPlayer(p);
        document.getElementById('ob-welcome-name').textContent = p.kral + ' \u00b7 ' + p.sehir;
        const irkData = findIrk(p.irk);
        document.getElementById('ob-welcome-irk').textContent =
          (irkData ? irkData.icon + ' ' + irkData.name : p.irk) +
          ' \u00b7 ' + (p.taraf === 'iyi' ? '\u2600\ufe0f Aydinlik' : '\ud83c\udf11 Karanlik');
        const badge = document.getElementById('ob-server-badge');
        if (badge && prevSrv) badge.textContent = prevSrv.ikon + ' ' + prevSrv.isim;
        showObStep('welcome');
      } else if (p) {
        obSelectedKral = p.username || p.kral || '';
        showObStep('side');
      } else {
        clearToken();
        showObStep('login');
      }
    });
  }
  // Token yoksa veya sunucu secilmemisse → landing gosterilir (zaten default)
})();

function showObStep(step) {
  ['login','side','irk','welcome'].forEach(s => {
    const el = document.getElementById('ob-step-' + s);
    if (el) el.style.display = s === step ? 'block' : 'none';
  });
  if (step === 'side') loadSideStats();
}

function loadSideStats() {
  fetch(API_BASE + '/api/stats/sides')
    .then(r => r.ok ? r.json() : {iyi: 0, kotu: 0})
    .then(data => {
      if (!data) return;
      const iEl = document.getElementById('stat-iyi');
      const kEl = document.getElementById('stat-kotu');
      const _f = (typeof fmt === 'function') ? fmt : (n => Number(n||0).toLocaleString('tr-TR'));
      if (iEl) iEl.textContent = _f(data.iyi || 0);
      if (kEl) kEl.textContent = _f(data.kotu || 0);
    })
    .catch(() => {
      const iEl = document.getElementById('stat-iyi');
      const kEl = document.getElementById('stat-kotu');
      if (iEl) iEl.textContent = 0;
      if (kEl) kEl.textContent = 0;
    });
}

/* -- Giris / Kayit toggle -- */
function obToggleRegister() {
  obMode = obMode === 'login' ? 'register' : 'login';
  const emailWrap = document.getElementById('ob-email-wrap');
  const pass2Wrap = document.getElementById('ob-pass2-wrap');
  const txt = document.getElementById('ob-toggle-txt');
  const btn = document.getElementById('ob-main-btn');
  const davetWrap = document.getElementById('ob-davet-wrap');
  if (obMode === 'register') {
    if(emailWrap) emailWrap.style.display = 'block';
    if(pass2Wrap) pass2Wrap.style.display = 'block';
    if(davetWrap) davetWrap.style.display = 'block';
    txt.innerHTML = 'Hesabin var mi? <u>Giris yap</u>';
    if(btn) btn.textContent = 'KAYIT OL';
  } else {
    if(emailWrap) emailWrap.style.display = 'none';
    if(pass2Wrap) pass2Wrap.style.display = 'none';
    if(davetWrap) davetWrap.style.display = 'none';
    txt.innerHTML = 'Hesabin yok mu? <u>Kayit ol</u>';
    if(btn) btn.textContent = 'GIRIS YAP';
  }
}

/* -- Google login -- */
function obGoogleLogin() {
  window.location.href = API_BASE + '/api/auth/google';
}

/* -- Giris / Kayit -- */
function obLogin() {
  const username = document.getElementById('ob-username').value.trim();
  const password = document.getElementById('ob-password').value;
  const errEl = document.getElementById('ob-login-err');
  errEl.classList.remove('ob-show');

  if (!username) { showObErr('Kullanici adi gir!'); return; }
  if (!password) { showObErr('Sifre gir!'); return; }

  if (obMode === 'register') {
    const email = document.getElementById('ob-email').value.trim();
    const pass2 = document.getElementById('ob-password2').value;
    if (!email) { showObErr('E-mail adresi gir!'); return; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) { showObErr('Gecerli bir e-mail adresi gir!'); return; }
    if (password !== pass2) { showObErr('Sifreler eslesmiyor!'); return; }
    if (password.length < 8) { showObErr('Sifre en az 8 karakter olmali!'); return; }
    const davet_kodu = document.getElementById('ob-davet')?.value?.trim();
    if (!davet_kodu) { showObErr('Davet kodu gerekli!'); return; }
    // v1.13.49: UA Client Hints (model/platform) — mobile cihaz modeli icin
    (async () => {
      let client_hints = {};
      try {
        if (navigator.userAgentData?.getHighEntropyValues) {
          const h = await navigator.userAgentData.getHighEntropyValues(['model','platform','platformVersion']);
          client_hints = { model: h.model||null, platform: h.platform||null, platformVersion: h.platformVersion||null };
        }
      } catch(e) {}
      fetch(API_BASE + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, davet_kodu, screen_width: screen.width, screen_height: screen.height, client_hints })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) { showObErr(data.error); return; }
        setToken(data.token);
        obSelectedKral = username;
        obGoTo('side');
      })
      .catch(() => showObErr('Sunucuya baglanamadi!'));
    })();
  } else {
    // v1.13.49: UA Client Hints login icin de
    (async () => {
      let client_hints = {};
      try {
        if (navigator.userAgentData?.getHighEntropyValues) {
          const h = await navigator.userAgentData.getHighEntropyValues(['model','platform','platformVersion']);
          client_hints = { model: h.model||null, platform: h.platform||null, platformVersion: h.platformVersion||null };
        }
      } catch(e) {}
      fetch(API_BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, screen_width: screen.width, screen_height: screen.height, client_hints })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) { showObErr(data.error); return; }
        setToken(data.token);
        if (data.setupDone && data.player) {
          obApplyPlayer(data.player);
          window.location.href = 'home.html';
        } else {
          obSelectedKral = username;
          obGoTo('side');
        }
      })
      .catch(() => showObErr('Sunucuya baglanamadi!'));
    })();
  }
}

function showObErr(msg) {
  const el = document.getElementById('ob-login-err');
  el.textContent = msg;
  el.classList.add('ob-show');
}

/* -- Bakici Girisi -- */
function obBakiciToggle() {
  const form = document.getElementById('ob-bakici-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function obBakiciGiris() {
  const email = document.getElementById('ob-bak-email')?.value?.trim();
  const password = document.getElementById('ob-bak-pass')?.value;
  const bakiciToken = document.getElementById('ob-bak-token')?.value?.trim();
  const errEl = document.getElementById('ob-bak-err');
  errEl.textContent = '';

  if (!email) { errEl.textContent = 'Email girin'; return; }
  if (!password) { errEl.textContent = 'Sifre girin'; return; }
  if (!bakiciToken) { errEl.textContent = 'Bakici tokeni girin (BAK-xxxxx)'; return; }

  fetch(API_BASE + '/api/auth/bakici-giris', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, bakici_token: bakiciToken })
  })
  .then(r => r.json())
  .then(data => {
    if (data.error) { errEl.textContent = data.error; return; }
    if (data.basarili) {
      setToken(data.token);
      localStorage.setItem('palantis_bakici_modu', JSON.stringify({
        aktif: true,
        izinler: data.izinler || {},
        hesap_kral: data.hesap_kral,
        token_id: data.bakici_token_id
      }));
      alert('Bakici girisi basarili! ' + (data.hesap_kral || '') + ' hesabina kisitli yetkilerle giriyorsunuz.');
      window.location.href = 'home.html';
    }
  })
  .catch(() => { errEl.textContent = 'Sunucuya baglanamadi'; });
}

/* -- Taraf secimi -- */
function obSelectSide(side, el) {
  obSelectedSide = side;
  document.querySelectorAll('.ob-side-card').forEach(c => c.classList.remove('ob-on'));
  el.classList.add('ob-on');
  document.getElementById('ob-side-btn').disabled = false;
}

function obGoToIrk() {
  if (!obSelectedSide) return;
  renderObIrkGrid();
  obGoTo('irk');
}

/* -- Irk grid -- */
function renderObIrkGrid() {
  const grid = document.getElementById('ob-irk-grid');
  if (!grid) return;
  const irklar = IRKLAR[obSelectedSide] || [];
  grid.innerHTML = '';
  irklar.forEach(irk => {
    const div = document.createElement('div');
    div.className = 'ob-irk-card';
    div.style.borderColor = obSelectedIrk === irk.id ? irk.color : '';
    div.style.boxShadow = obSelectedIrk === irk.id ? '0 0 16px ' + irk.color + '33' : '';
    div.innerHTML =
      '<div class="ob-irk-head">' +
        '<span class="ob-irk-icon">' + irk.icon + '</span>' +
        '<span class="ob-irk-name" style="color:' + irk.color + '">' + irk.name + '</span>' +
      '</div>' +
      '<div class="ob-irk-bonus">' +
        irk.bonuslar.map(b => '<span>' + b + '</span><br>').join('') +
      '</div>';
    div.onclick = () => {
      obSelectedIrk = irk.id;
      document.getElementById('ob-irk-btn').disabled = false;
      renderObIrkGrid();
    };
    grid.appendChild(div);
  });
}

/* -- Bitir -- oyuna gir -- */
function obFinish() {
  if (!obSelectedIrk || !obSelectedSide) return;
  if (!obSelectedKral) {
    loadPlayerFromAPI().then(p => {
      if (p) { obSelectedKral = p.username || p.kral || 'Kral'; }
      else { obSelectedKral = 'Kral'; }
      obFinish();
    });
    return;
  }
  const sehirAdi = obSelectedKral + "'in Sehri";
  fetch(API_BASE + '/api/player/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify({ kral: obSelectedKral, sehir: sehirAdi, irk: obSelectedIrk, taraf: obSelectedSide })
  })
  .then(async r => {
    const data = await r.json();
    if (r.status === 409) {
      loadPlayerFromAPI().then(p => {
        if (p) { savePlayer(p); obApplyPlayer(p); window.location.href = 'home.html'; }
      });
      return;
    }
    if (data.error) { alert(data.error); return; }
    savePlayer(data.player);
    obApplyPlayer(data.player);
    window.location.href = 'home.html';
  })
  .catch(() => alert('Sunucuya baglanamadi!'));
}

function obEnterGame() {
  window.location.href = 'home.html';
}

function obGoTo(step) {
  showObStep(step);
}

/* Enter tusu ile login */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const overlay = document.getElementById('ob-overlay');
    if (overlay && overlay.style.display !== 'none') {
      const loginStep = document.getElementById('ob-step-login');
      if (loginStep && loginStep.style.display !== 'none') obLogin();
    }
  }
});
