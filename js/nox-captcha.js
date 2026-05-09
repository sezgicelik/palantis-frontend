/* ═══════════════════════════════════════════════════════════
   nox-captcha.js — KLANLAR-TARZI PERIODIC BOT KORUMA (v1.14.3.39)
   ═══════════════════════════════════════════════════════════
   Backend HTTP 428 + { captcha_required: true } donerse modal acilir.
   Cloudflare Turnstile widget yuklenir. Kullanici cozer.
   Token backend'e gonderilir, dogrulama basariliysa modal kapanir.

   Tum aksiyonlar bu sirada bekler — kullanici devam edemez.
   Bot'lar Turnstile'i cozemez (Cloudflare ML modeli).

   API:
     window.NoxCaptcha.show()      → modal goster (manuel)
     window.NoxCaptcha.hide()      → kapat
     window.NoxCaptcha.handle428() → fetch 428 yakalandiginda cagir
   ═══════════════════════════════════════════════════════════ */
(function() {
  if (window.NoxCaptcha) return; // tek yukleme

  let _modalEl = null;
  let _tokenCallback = null;
  let _isOpen = false;
  let _siteKey = null;
  let _turnstileLoaded = false;
  let _widgetId = null;
  let _bekletmeKuyrugu = []; // captcha esnasinda biriken fetch cagrilari

  function getApi() {
    return (typeof API_BASE !== 'undefined') ? API_BASE : 'https://palantis-backend-production.up.railway.app';
  }
  function getTok() { return localStorage.getItem('palantis_token'); }

  // CSS inject
  function _ensureCss() {
    if (document.getElementById('nox-captcha-css')) return;
    const css = document.createElement('style');
    css.id = 'nox-captcha-css';
    css.textContent = `
      .nox-captcha-overlay {
        position:fixed; inset:0; background:rgba(0,0,0,.92); z-index:99999;
        display:flex; align-items:center; justify-content:center; padding:16px;
        animation: noxCaptchaFadeIn .25s ease-out;
      }
      @keyframes noxCaptchaFadeIn {
        from { opacity:0; }
        to { opacity:1; }
      }
      .nox-captcha-modal {
        background:linear-gradient(180deg, #1a1410 0%, #0a0604 100%);
        border:2px solid #d4af37; border-radius:12px;
        max-width:480px; width:100%; padding:28px;
        color:#e8dcc4; font-family:'Crimson Pro',serif;
        box-shadow:0 0 80px rgba(212,175,55,0.35);
      }
      .nox-captcha-title {
        font-family:'Cinzel',serif; font-size:20px; font-weight:700;
        color:#d4af37; margin:0 0 6px; letter-spacing:1.5px; text-align:center;
      }
      .nox-captcha-icon {
        font-size:42px; text-align:center; margin-bottom:8px;
      }
      .nox-captcha-msg {
        font-size:14px; line-height:1.6; color:#c8b896;
        margin:8px 0 18px; text-align:center;
      }
      .nox-captcha-warn {
        font-size:12px; color:#e74c3c; text-align:center; margin-top:12px;
        background:rgba(231,76,60,0.1); padding:8px; border-radius:5px;
      }
      .nox-captcha-widget {
        display:flex; justify-content:center; min-height:65px;
        margin:16px 0;
      }
      .nox-captcha-deneme {
        font-size:11px; color:#888; text-align:center; margin-top:8px;
      }
    `;
    document.head.appendChild(css);
  }

  // Turnstile script yukle
  function _loadTurnstile() {
    return new Promise((resolve, reject) => {
      if (_turnstileLoaded || window.turnstile) { _turnstileLoaded = true; return resolve(); }
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      s.onload = () => { _turnstileLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('Turnstile script yuklenemedi'));
      document.head.appendChild(s);
    });
  }

  // Site key al
  async function _getSiteKey() {
    if (_siteKey) return _siteKey;
    try {
      const r = await fetch(getApi() + '/api/auth/captcha-status', {
        headers: { 'Authorization': 'Bearer ' + getTok() }
      });
      if (r.ok) {
        const d = await r.json();
        _siteKey = d.turnstile_site_key || null;
        return _siteKey;
      }
    } catch {}
    return null;
  }

  // Modal olustur
  function _buildModal(failBilgisi) {
    _ensureCss();
    if (_modalEl) _modalEl.remove();

    const overlay = document.createElement('div');
    overlay.className = 'nox-captcha-overlay';
    overlay.id = 'nox-captcha-overlay';

    const modal = document.createElement('div');
    modal.className = 'nox-captcha-modal';

    const icon = document.createElement('div');
    icon.className = 'nox-captcha-icon';
    icon.textContent = '🛡️';

    const title = document.createElement('h3');
    title.className = 'nox-captcha-title';
    title.textContent = 'ROBOT MUSUN?';

    const msg = document.createElement('div');
    msg.className = 'nox-captcha-msg';
    msg.innerHTML = 'Bot koruma sistemimiz periyodik olarak insan olduğunu doğruluyor.<br>' +
                    '<span style="color:#d4af37">Aşağıdaki kutucuğa tıkla, devam et.</span>';

    const widget = document.createElement('div');
    widget.className = 'nox-captcha-widget';
    widget.id = 'nox-captcha-widget-mount';

    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(msg);
    modal.appendChild(widget);

    if (failBilgisi && failBilgisi.kalan_deneme) {
      const deneme = document.createElement('div');
      deneme.className = 'nox-captcha-warn';
      deneme.textContent = `⚠️ Kalan deneme: ${failBilgisi.kalan_deneme} (Tüm denemeler bitince 24 saat ban)`;
      modal.appendChild(deneme);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    _modalEl = overlay;
    return widget.id;
  }

  // Backend'e token gonder
  async function _verifyToken(token) {
    try {
      const r = await fetch(getApi() + '/api/auth/captcha-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getTok()
        },
        body: JSON.stringify({ token })
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        // Basarili — modal kapat, biriken cagrilari serbest birak
        _close();
        if (typeof showToast === 'function') showToast('✓ Doğrulandı, devam edebilirsin', 'success');
        // Bekleyen fetch'leri tetikle (oyuncu yeniden tıklamak zorunda kalmasın)
        _bekletmeKuyrugu.forEach(cb => { try { cb(); } catch{} });
        _bekletmeKuyrugu = [];
        return true;
      } else if (d.banned) {
        // Ban geldi — login sayfasına yönlendir
        if (typeof showToast === 'function') showToast(`❌ Bot koruma: ${d.kalan_saat} saat banlandın`, 'error');
        setTimeout(() => {
          try { localStorage.removeItem('palantis_token'); } catch{}
          location.href = (typeof SITE_URL !== 'undefined' ? SITE_URL : '') + '/index.html';
        }, 3000);
        return false;
      } else {
        // Bassiz — yeniden dene
        if (window.turnstile && _widgetId) {
          try { window.turnstile.reset(_widgetId); } catch {}
        }
        return false;
      }
    } catch(e) {
      console.error('[NoxCaptcha] verify hata:', e);
      return false;
    }
  }

  // Modal göster
  async function show(failBilgisi) {
    if (_isOpen) return;
    _isOpen = true;

    const widgetMountId = _buildModal(failBilgisi);

    try {
      const siteKey = await _getSiteKey();
      if (!siteKey) {
        // Turnstile pasif — direkt onayla (dev fallback)
        const ok = await _verifyToken('dev-fallback');
        if (!ok) {
          // Hata gosterilir
          const w = document.getElementById(widgetMountId);
          if (w) w.innerHTML = '<div style="color:#e74c3c">Captcha sistem hatasi — sayfayi yenile</div>';
        }
        return;
      }

      await _loadTurnstile();

      // Render Turnstile widget
      if (window.turnstile) {
        _widgetId = window.turnstile.render('#' + widgetMountId, {
          sitekey: siteKey,
          theme: 'dark',
          callback: async (token) => {
            await _verifyToken(token);
          },
          'error-callback': () => {
            console.warn('[NoxCaptcha] Turnstile error');
          },
          'expired-callback': () => {
            try { window.turnstile.reset(_widgetId); } catch{}
          }
        });
      }
    } catch(e) {
      console.error('[NoxCaptcha] show hata:', e);
      const w = document.getElementById(widgetMountId);
      if (w) w.innerHTML = '<div style="color:#e74c3c">Captcha yuklenemedi: ' + e.message + '</div>';
    }
  }

  function _close() {
    if (_modalEl) {
      _modalEl.remove();
      _modalEl = null;
    }
    _isOpen = false;
    _widgetId = null;
  }

  // Fetch wrapper'dan 428 yakalandiginda cagir
  function handle428(failBilgisi, retryCallback) {
    if (retryCallback) _bekletmeKuyrugu.push(retryCallback);
    if (!_isOpen) show(failBilgisi);
  }

  // EXPORT
  window.NoxCaptcha = { show, hide: _close, handle428 };
})();

// ═══════════════════════════════════════════════════════════
// FETCH INTERCEPTOR — 428 (Captcha Required) yakalama
// ═══════════════════════════════════════════════════════════
(function _captcha428Interceptor() {
  if (window._captcha428Wrapped) return;
  window._captcha428Wrapped = true;
  const _origFetch = window.fetch.bind(window);
  window.fetch = async function(...args) {
    const resp = await _origFetch(...args);
    if (resp.status === 428) {
      // Captcha required — clone response (read body multiple times için)
      try {
        const cloned = resp.clone();
        const data = await cloned.json();
        if (data.captcha_required) {
          window.NoxCaptcha?.handle428(null);
        }
      } catch {}
    } else if (resp.status === 401) {
      // 401 handler zaten auth.js'de var — burada işlem yok
    }
    return resp;
  };
})();
