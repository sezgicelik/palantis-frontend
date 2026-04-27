/* ═══════════════════════════════════════════════════════
   TURNSTILE INIT — Cloudflare bot koruması
   v1.14.1.58
   ═══════════════════════════════════════════════════════
   Backend /api/auth/cf-config endpoint'ten site_key alir.
   Eger TURNSTILE_SITE_KEY env yoksa pasif (dev mode).
   getCfToken() async fonksiyonu — login/register form'da çağrılır.
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if (window._noxTurnstile) return;
  window._noxTurnstile = true;

  var _config = null;
  var _scriptYuklendi = false;

  async function configAl() {
    if (_config !== null) return _config;
    if (typeof API_BASE === 'undefined') return { enabled: false };
    try {
      var r = await fetch(API_BASE + '/api/auth/cf-config');
      if (r.ok) _config = await r.json();
      else _config = { enabled: false };
    } catch(e) {
      _config = { enabled: false };
    }
    return _config;
  }

  function scriptYukle() {
    return new Promise(function(resolve) {
      if (_scriptYuklendi) return resolve(true);
      if (window.turnstile) { _scriptYuklendi = true; return resolve(true); }
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      s.onload = function() { _scriptYuklendi = true; resolve(true); };
      s.onerror = function() { resolve(false); };
      document.head.appendChild(s);
    });
  }

  /* ── Public: getCfToken() ──
     Login/register form bunu çağırır.
     - Turnstile pasifse null döner (backend bypass)
     - Aktifse invisible challenge çalıştırır, token döner
  */
  window.getCfToken = async function() {
    var cfg = await configAl();
    if (!cfg.enabled || !cfg.site_key) return null;
    var ok = await scriptYukle();
    if (!ok || !window.turnstile) return null;

    return new Promise(function(resolve) {
      var container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(container);
      try {
        window.turnstile.render(container, {
          sitekey: cfg.site_key,
          size: 'invisible',
          callback: function(token) {
            resolve(token);
            setTimeout(function(){ container.remove(); }, 100);
          },
          'error-callback': function() {
            resolve(null);
            setTimeout(function(){ container.remove(); }, 100);
          },
          'timeout-callback': function() {
            resolve(null);
            setTimeout(function(){ container.remove(); }, 100);
          }
        });
      } catch(e) {
        resolve(null);
        try { container.remove(); } catch {}
      }
    });
  };

  // Sayfa yuklendiginde config al (cache icin)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    configAl();
  } else {
    window.addEventListener('DOMContentLoaded', configAl);
  }
})();
