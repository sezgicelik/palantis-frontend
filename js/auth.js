/* auth.js — Noxara authentication and player persistence */

const STORAGE_KEY = 'palantis_player';
const API_BASE = getApiBase();
const SITE_URL = 'https://sezgicelik.github.io/palantis-frontend';
function getToken() { return localStorage.getItem('palantis_token'); }
function setToken(t) { localStorage.setItem('palantis_token', t); }
function clearToken() { localStorage.removeItem('palantis_token'); localStorage.removeItem(STORAGE_KEY); }
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
