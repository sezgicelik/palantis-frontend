/* auth.js — Noxara authentication and player persistence */

const STORAGE_KEY = 'palantis_player';
const API_BASE = (typeof getApiBase === 'function') ? getApiBase() : 'https://palantis-backend-production.up.railway.app';
const SITE_URL = 'https://sezgicelik.github.io/palantis-frontend';
function getToken() { return localStorage.getItem('palantis_token'); }
function setToken(t) { localStorage.setItem('palantis_token', t); }
function clearToken() { localStorage.removeItem('palantis_token'); localStorage.removeItem(STORAGE_KEY); }

/* ═══════════════════════════════════════════════════════
   v1.14.3.34 — GUVENLIK: Global 401 handler
   ═══════════════════════════════════════════════════════
   Token expire/revoke olunca tum sayfa otomatik logout'a gider.
   Eski: 401 alinca hicbir sey olmuyordu, kullanici bos sayfa goruyordu.
   Yeni: window.fetch wrap edildi — 401 yakalanirsa token temizlenir + login sayfasina yonlendirilir.
   ═══════════════════════════════════════════════════════ */
(function _wrap401Handler() {
  if (window._noxFetchWrapped) return;
  window._noxFetchWrapped = true;
  const _origFetch = window.fetch.bind(window);
  // Login sayfalari — 401 alinca redirect etme (zaten loginde)
  const LOGIN_PAGES = ['/index.html', '/', '/login.html'];
  const isLoginPage = () => LOGIN_PAGES.some(p => location.pathname.endsWith(p));
  let _redirecting = false;
  window.fetch = async function(...args) {
    const resp = await _origFetch(...args);
    if (resp.status === 401 && !_redirecting && !isLoginPage()) {
      _redirecting = true;
      try { clearToken(); } catch {}
      // Toast goster (varsa) ve 800ms sonra redirect
      try { if (typeof toast === 'function') toast('Oturum süresi doldu — tekrar giriş yapın', 'error'); } catch {}
      setTimeout(() => { location.href = SITE_URL + '/index.html'; }, 800);
    }
    return resp;
  };
})();

function loadPlayerFromAPI() {
  return fetch(API_BASE + '/api/player/me', {
    headers: { 'Authorization': 'Bearer ' + getToken() }
  }).then(r => r.ok ? r.json() : null).catch(() => null);
}

function savePlayer(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}
