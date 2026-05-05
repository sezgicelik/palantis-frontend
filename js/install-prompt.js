/* ═══════════════════════════════════════════════════════
   INSTALL PROMPT — Custom "Ana Ekrana Ekle" UI
   v1.14.1.51 (PWA Asama 1)
   ═══════════════════════════════════════════════════════
   - Chrome / Edge: beforeinstallprompt event yakalar, kendi banner'imizi gosterir
   - iOS Safari: Manuel rehber (Paylas → Ana Ekrana Ekle adimlari)
   - Android: beforeinstallprompt destekler (PNG icon zorunlu — manifest'te var)

   Public API:
     installPrompt.iste()       → kullanici buton tikinca (sadece destekleniyorsa)
     installPrompt.kullanilebilir() → boolean (event yakalandi mi)
     installPrompt.kuruldu()    → boolean (zaten kurulu mu)
     installPrompt.banner()     → otomatik banner goster (5sn sonra)
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';

  const NS_DISMISSED = 'noxara_install_dismissed';
  const NS_LAST_PROMPT = 'noxara_install_last_prompt';

  let _deferredPrompt = null;
  let _kuruldu = false;

  /* ── Standalone mode = zaten kurulu ── */
  function _isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true  // iOS Safari
        || document.referrer.startsWith('android-app://');
  }

  /* ── iOS detection ── */
  function _isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  /* ── beforeinstallprompt event yakala (Chrome/Edge/Android) ── */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Chrome'un default banner'ini engelle
    _deferredPrompt = e;
    console.log('[install] beforeinstallprompt yakalandi');
  });

  /* ── App kuruldu olayi ── */
  window.addEventListener('appinstalled', () => {
    _kuruldu = true;
    _deferredPrompt = null;
    console.log('[install] App kuruldu!');
    try { localStorage.setItem('noxara_installed', '1'); } catch {}
    _bannerKaldir();
  });

  /* ── Public: Install promp'u tetikle ── */
  async function iste() {
    if (_isStandalone()) {
      noxAlert('Uygulama zaten kurulu!');
      return false;
    }
    if (_isIOS()) {
      _iosRehber();
      return false;
    }
    if (!_deferredPrompt) {
      // Chrome banner henuz hazir degil veya zaten dismiss edilmis
      noxAlert('Tarayicinizdan menuden "Ana Ekrana Ekle" / "Uygulamayi Yukle" yapabilirsiniz.\n\nChrome menusu (3 nokta) → Ana ekrana ekle');
      return false;
    }
    try {
      _deferredPrompt.await noxPrompt();
      const choice = await _deferredPrompt.userChoice;
      _deferredPrompt = null;
      console.log('[install] Kullanici tercihi:', choice.outcome);
      return choice.outcome === 'accepted';
    } catch(e) {
      console.warn('[install] Hata:', e.message);
      return false;
    }
  }

  /* ── iOS rehber modal ── */
  function _iosRehber() {
    const overlay = document.createElement('div');
    overlay.id = 'install-ios-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui';
    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a2e,#0a0a1a);border:1px solid #d4af37;border-radius:12px;padding:24px;max-width:380px;color:#e0e0e0">
        <h3 style="color:#d4af37;margin:0 0 14px;font-family:Cinzel,serif">📱 Ana Ekrana Ekle (iOS)</h3>
        <p style="font-size:13px;color:#aaa;margin:0 0 18px">Noxara'yi telefonunda app gibi kullanmak icin:</p>
        <ol style="font-size:13px;line-height:1.8;padding-left:20px;margin:0 0 20px">
          <li>Safari alt menude <b style="color:#d4af37">⬆️ Paylas</b> butonuna dokun</li>
          <li>Kaydir ve <b style="color:#d4af37">"Ana Ekrana Ekle"</b> sec</li>
          <li>Sag ust <b style="color:#d4af37">"Ekle"</b> dokun</li>
        </ol>
        <div style="background:rgba(212,175,55,0.08);border-left:3px solid #d4af37;padding:10px;border-radius:4px;font-size:11px;color:#888;margin-bottom:18px">
          💡 Bu islem sadece <b style="color:#d4af37">Safari</b>'de calisir. Chrome iOS'ta PWA yuklemiyor.
        </div>
        <button id="install-ios-close" style="width:100%;padding:10px;background:#d4af37;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:13px;font-family:Cinzel,serif;letter-spacing:1px">ANLADIM</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('install-ios-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  /* ── Otomatik banner — engagement sonrasi ── */
  function banner() {
    if (_isStandalone()) return;
    try {
      if (localStorage.getItem('noxara_installed') === '1') return;
      if (localStorage.getItem(NS_DISMISSED) === '1') return;
      // 7 gun once dismiss edildiyse tekrar gostermesin
      const last = parseInt(localStorage.getItem(NS_LAST_PROMPT)) || 0;
      if (Date.now() - last < 7 * 24 * 60 * 60 * 1000) {
        if (last > 0) return; // gosterildi yakin zamanda
      }
    } catch {}

    // Sadece login olmussa goster (token kontrol)
    const tokenAl = () => {
      if (typeof getToken === 'function') return getToken();
      try { return localStorage.getItem('palantis_token'); } catch { return null; }
    };
    if (!tokenAl()) return;

    // Mobile veya iOS olmali (desktop'ta zaten Chrome auto goster)
    const isMobile = /mobile|iphone|ipad|android/i.test(navigator.userAgent);
    if (!isMobile && !_deferredPrompt) return; // desktop'ta Chrome yok kanal yok

    // Ek 8 saniye bekle (sayfa yuklensin, kullanici engaged)
    setTimeout(() => _bannerGoster(), 8000);
  }

  async function _bannerGoster() {
    if (document.getElementById('install-banner')) return;
    if (_isStandalone()) return;
    const div = document.createElement('div');
    div.id = 'install-banner';
    div.style.cssText = 'position:fixed;bottom:80px;left:10px;right:10px;max-width:420px;margin:0 auto;'
      + 'background:linear-gradient(135deg,#1a1a2e,#0a0a1a);border:1px solid #d4af37;border-radius:8px;'
      + 'padding:12px 16px;z-index:99998;display:flex;gap:10px;align-items:center;'
      + 'box-shadow:0 4px 16px rgba(0,0,0,0.6);font-family:system-ui';
    const isIos = _isIOS();
    div.innerHTML = `
      <div style="font-size:24px">${isIos ? '🍎' : '📲'}</div>
      <div style="flex:1;font-size:11px;color:#e0e0e0">
        <b style="color:#d4af37">Ana Ekrana Ekle</b><br>
        <span style="color:#aaa">${isIos ? 'iOS Safari ile telefonuna app gibi yukle' : 'Tek tikla telefonuna kur'}</span>
      </div>
      <button id="install-yes" style="padding:6px 12px;background:#d4af37;color:#000;border:none;border-radius:4px;font-weight:bold;cursor:pointer;font-size:11px">YUKLE</button>
      <button id="install-no"  style="padding:6px 8px;background:transparent;color:#888;border:1px solid #333;border-radius:4px;cursor:pointer;font-size:11px">×</button>
    `;
    document.body.appendChild(div);

    document.getElementById('install-yes').onclick = async () => {
      try { localStorage.setItem(NS_LAST_PROMPT, Date.now().toString()); } catch {}
      _bannerKaldir();
      await iste();
    };
    document.getElementById('install-no').onclick = () => {
      try { localStorage.setItem(NS_DISMISSED, '1'); } catch {}
      _bannerKaldir();
    };
  }

  function _bannerKaldir() {
    const el = document.getElementById('install-banner');
    if (el) el.remove();
  }

  /* ── Public API ── */
  window.installPrompt = {
    iste,
    kullanilabilir: () => !!_deferredPrompt || _isIOS(),
    kuruldu: () => _isStandalone() || _kuruldu,
    banner,
    iosRehber: _iosRehber
  };

  // Auto-banner: sayfa yuklendikten sonra
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    banner();
  } else {
    window.addEventListener('DOMContentLoaded', banner);
  }
})();
