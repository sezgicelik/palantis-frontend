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

  // 4) Auto-login — eğer henuz token yoksa
  async function telegramAutoLogin() {
    if (!tg.initData) {
      console.warn('[telegram-webapp] initData yok — auto-login atlandi');
      return false;
    }
    if (typeof getToken === 'function' && getToken()) {
      // Zaten girisli
      return true;
    }
    if (typeof API_BASE === 'undefined') return false;

    try {
      const r = await fetch(API_BASE + '/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData })
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        console.warn('[telegram-auto-login] Hata:', d.error || r.status);
        return false;
      }
      // Token kaydet
      if (typeof setToken === 'function') {
        setToken(d.token);
      } else {
        try { localStorage.setItem('palantis_token', d.token); } catch {}
      }
      console.log('[telegram-auto-login] ✓ Giris basarili —', d.user.username);

      // Setup tamamlanmadiysa onboarding'e yonlendir
      if (!d.setupDone) {
        try { tg.HapticFeedback.notificationOccurred('success'); } catch {}
        // Yeni kullanici — setup
        if (window.location.pathname.indexOf('index.html') === -1) {
          // Index'e (onboarding) yonlendir, kullanici taraf+irk secsin
          window.location.href = './index.html?tg=1';
        }
      } else {
        // Mevcut user — home'a (zaten oradayiz muhtemelen)
        try { tg.HapticFeedback.notificationOccurred('success'); } catch {}
      }
      return true;
    } catch (e) {
      console.warn('[telegram-auto-login]', e.message);
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
