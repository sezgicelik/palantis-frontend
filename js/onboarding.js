/* ══════════════════════════════════
   ONBOARDING SiSTEMi
   localStorage ile kayitli kullanici takibi
   Extracted from index.html
══════════════════════════════════ */

let obMode = 'login';
let obSelectedSide = null;
let obSelectedIrk = null;
let obSelectedKral = '';
let obSelectedSehir = '';
let obSelectedPass = '';

/* -- Sayfa yuklenince kontrol -- */
(function obInit() {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlSetup = params.get('setup');
  if (urlToken) {
    setToken(urlToken);
    window.history.replaceState({}, '', window.location.pathname);
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
  if (getToken()) {
    loadPlayerFromAPI().then(p => {
      if (p && p.setup_done) {
        savePlayer(p);
        obApplyPlayer(p);
        document.getElementById('ob-welcome-name').textContent = p.kral + ' \u00b7 ' + p.sehir;
        const irkData = findIrk(p.irk);
        document.getElementById('ob-welcome-irk').textContent =
          (irkData ? irkData.icon + ' ' + irkData.name : p.irk) +
          ' \u00b7 ' + (p.taraf === 'iyi' ? '\u2600\ufe0f Aydinlik' : '\ud83c\udf11 Karanlik');
        showObStep('welcome');
      } else if (p) {
        obSelectedKral = p.username || p.kral || '';
        showObStep('side');
      } else {
        clearToken();
        showObStep('login');
      }
    });
  } else {
    showObStep('login');
  }
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
      if (iEl) iEl.textContent = data.iyi || 0;
      if (kEl) kEl.textContent = data.kotu || 0;
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
  if (obMode === 'register') {
    if(emailWrap) emailWrap.style.display = 'block';
    if(pass2Wrap) pass2Wrap.style.display = 'block';
    txt.innerHTML = 'Hesabin var mi? <u>Giris yap</u>';
    if(btn) btn.textContent = 'KAYIT OL';
  } else {
    if(emailWrap) emailWrap.style.display = 'none';
    if(pass2Wrap) pass2Wrap.style.display = 'none';
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
    if (password !== pass2) { showObErr('Sifreler eslesmiyorl'); return; }
    if (password.length < 4) { showObErr('Sifre en az 4 karakter olmali!'); return; }
    fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, screen_width: screen.width, screen_height: screen.height })
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) { showObErr(data.error); return; }
      setToken(data.token);
      obSelectedKral = username;
      obGoTo('side');
    })
    .catch(() => showObErr('Sunucuya baglanamadi!'));
  } else {
    fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, screen_width: screen.width, screen_height: screen.height })
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
  }
}

function showObErr(msg) {
  const el = document.getElementById('ob-login-err');
  el.textContent = msg;
  el.classList.add('ob-show');
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
    console.warn('obFinish: obSelectedKral bos, API\'den cekiliyor...');
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

function obGoTo(step) {
  showObStep(step);
}

/* Enter tusu ile login */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const overlay = document.getElementById('ob-overlay');
    if (overlay && !overlay.classList.contains('ob-hidden')) {
      const loginStep = document.getElementById('ob-step-login');
      if (loginStep && loginStep.style.display !== 'none') obLogin();
    }
  }
});
