/* ═══════════════════════════════════════════════════════
   TELEGRAM WEBAPP — Auto-auth + integration
   v1.14.1.61
   ═══════════════════════════════════════════════════════
   Telegram WebApp olarak acildiginda:
   - window.Telegram.WebApp algila
   - tg.expand() → tam ekran
   - tg.initData → backend'e auto-login
   - Theme'i Noxara'ya uydur (dark zaten)
   - Back button native handle

   Telegram dışında (normal browser) açıldığında: pasif.
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if (window._noxTelegramWebApp) return;
  window._noxTelegramWebApp = true;

  const tg = window.Telegram?.WebApp;

  // Telegram WebApp degilse cik
  if (!tg) {
    window.isTelegramWebApp = false;
    return;
  }

  window.isTelegramWebApp = true;
  console.log('[telegram-webapp] Telegram WebApp algilandi, version:', tg.version);

  // 1) Tam ekran
  try { tg.expand(); } catch {}
  try { tg.ready(); } catch {}

  // 2) Theme — Noxara koyu, Telegram sistemi takip etmesin
  try {
    tg.setHeaderColor('#0a0a0a');
    tg.setBackgroundColor('#0a0a0a');
  } catch {}

  // 3) BackButton — sayfa hierarsisi gibi davranir
  try {
    if (window.location.pathname.includes('/home.html')) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        // Tarayici geri tusunu tetikle
        if (window.history.length > 1) window.history.back();
        else window.location.href = './home.html';
      });
    }
  } catch {}

  // v1.14.1.65: Debug overlay — Telegram'dan acildiginda durumu goster
  function _debugOverlay(durum, detay) {
    let el = document.getElementById('tg-debug-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tg-debug-overlay';
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#0a0a0a;color:#d4af37;padding:8px 12px;font-family:monospace;font-size:11px;z-index:99999;border-bottom:1px solid #d4af37;max-height:40vh;overflow-y:auto;line-height:1.4';
      document.body.appendChild(el);
    }
    el.innerHTML = '<b>[Telegram Debug]</b> ' + durum + '<br>' + (detay ? `<span style="color:#888">${detay}</span>` : '');
    setTimeout(() => { try { el.remove(); } catch {} }, 8000); // 8 sn sonra kaldir
  }

  // 4) Auto-login — eğer henuz token yoksa
  async function telegramAutoLogin() {
    if (!tg.initData) {
      console.warn('[telegram-webapp] initData yok — auto-login atlandi');
      _debugOverlay('❌ initData YOK — Telegram WebApp degil mi?');
      return false;
    }
    _debugOverlay('🔄 Auto-login basliyor...', 'initData uzunlugu: ' + tg.initData.length);

    if (typeof getToken === 'function' && getToken()) {
      _debugOverlay('✓ Zaten giris yapilmis', 'Token var');
      return true;
    }
    if (typeof API_BASE === 'undefined') {
      _debugOverlay('❌ API_BASE tanimli degil');
      return false;
    }

    try {
      const r = await fetch(API_BASE + '/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData })
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        const msg = d.error || ('HTTP ' + r.status);
        console.warn('[telegram-auto-login] Hata:', msg);
        _debugOverlay('❌ Auth fail: ' + msg, JSON.stringify(d));
        return false;
      }
      // Token kaydet
      if (typeof setToken === 'function') {
        setToken(d.token);
      } else {
        try { localStorage.setItem('palantis_token', d.token); } catch {}
      }
      console.log('[telegram-auto-login] ✓ Giris basarili —', d.user.username);
      _debugOverlay('✓ Giris OK: ' + d.user.username,
        'setupDone=' + d.setupDone + ', kral=' + (d.player?.kral || '-') +
        ', taraf=' + (d.player?.taraf || '-'));

      // Setup tamamlanmadiysa onboarding'e yonlendir
      if (!d.setupDone) {
        try { tg.HapticFeedback.notificationOccurred('success'); } catch {}
        if (window.location.pathname.indexOf('index.html') === -1) {
          _debugOverlay('→ Onboarding\'e yonlendiriliyor (setup yok)');
          setTimeout(() => { window.location.href = './index.html?tg=1'; }, 2000);
        }
      } else {
        try { tg.HapticFeedback.notificationOccurred('success'); } catch {}
        _debugOverlay('✓ Setup tamam — home\'a yukleniyor', 'Yenile/loadGameData calisacak');
        // Mevcut user — sayfayi yenile ki loadGameData token ile cagirsin
        setTimeout(() => {
          if (typeof loadGameData === 'function') {
            loadGameData();
          } else {
            window.location.reload();
          }
        }, 1500);
      }
      return true;
    } catch (e) {
      console.warn('[telegram-auto-login]', e.message);
      _debugOverlay('❌ Network/parse hata: ' + e.message);
      return false;
    }
  }

  // 5) Auto-login tetikle (sayfa yuklenince)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(telegramAutoLogin, 200);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(telegramAutoLogin, 200));
  }

  // 6) Mainsbutton — onboarding'de "Devam" tarzı
  // (Sayfaya ozel logic onu kullanir)

  // Public API
  window.telegramWebApp = {
    tg,
    autoLogin: telegramAutoLogin,
    haptic: (type) => { try { tg.HapticFeedback.notificationOccurred(type || 'success'); } catch {} },
    showAlert: (msg) => { try { tg.showAlert(msg); } catch { alert(msg); } },
    showConfirm: (msg) => new Promise(r => {
      try { tg.showConfirm(msg, ok => r(ok)); } catch { r(confirm(msg)); }
    }),
    paylas: (text, url) => {
      // Native share via Telegram
      try {
        const shareText = url ? `${text} ${url}` : text;
        tg.openTelegramLink('https://t.me/share/url?text=' + encodeURIComponent(shareText));
      } catch {}
    }
  };
})();
