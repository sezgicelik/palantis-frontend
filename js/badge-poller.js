/* ═══════════════════════════════════════════════════════
   BADGE POLLER — Sidebar badge'leri (ozel mesaj, gorev) guncel tut
   v1.14.1.53
   Her 60 saniyede bir backend'i kontrol et, badge'leri guncelle.
   Yeni mesaj geldiyse toast goster (ek olarak push notif gonderiliyor).
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if (window._noxBadgePoller) return;
  window._noxBadgePoller = true;

  var lastOzelCount = 0;
  var lastSeen = {};
  try { lastSeen = JSON.parse(localStorage.getItem('noxara_badge_lastseen') || '{}'); } catch {}

  function tokenAl() {
    if (typeof getToken === 'function') return getToken();
    try { return localStorage.getItem('palantis_token'); } catch { return null; }
  }

  function setBadge(id, count) {
    var el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
      el.style.display = 'inline-block';
      el.textContent = count > 99 ? '99+' : count;
    } else {
      el.style.display = 'none';
    }
  }

  function inAppToast(mesaj) {
    if (typeof toast === 'function') { toast(mesaj); return; }
    // Fallback: kendi mini toast
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:80px;right:10px;background:#1a1a2e;border:1px solid #d4af37;border-radius:6px;padding:10px 14px;z-index:99999;color:#e0e0e0;font-size:12px;font-family:system-ui;box-shadow:0 4px 12px rgba(0,0,0,0.5);max-width:280px';
    div.textContent = mesaj;
    document.body.appendChild(div);
    setTimeout(function(){ div.style.opacity = '0'; div.style.transition = 'opacity 0.5s'; }, 4000);
    setTimeout(function(){ div.remove(); }, 4600);
  }

  async function poll() {
    if (!tokenAl()) return;
    if (typeof API_BASE === 'undefined') return;
    var token = tokenAl();
    var hdr = { 'Authorization': 'Bearer ' + token };

    // 1. Ozel mesaj sayisi
    try {
      var r = await fetch(API_BASE + '/api/meydan/ozel', { headers: hdr });
      if (r.ok) {
        var d = await r.json();
        var unread = d.okunmamis || 0;
        setBadge('ozel-mesaj-badge', unread);   // sidebar
        setBadge('bn-sosyal-badge', unread);    // v1.14.1.56: bottom nav
        if (unread > lastOzelCount && lastOzelCount > 0) {
          inAppToast('✉️ ' + (unread - lastOzelCount) + ' yeni özel mesaj!');
        }
        lastOzelCount = unread;
      }
    } catch(e) { /* sessiz */ }

    // 2. v1.14.1.56: Gelen ordular (saldiri/takviye) — bottom nav Ordu badge'i
    try {
      var r2 = await fetch(API_BASE + '/api/game/gelen-ordular', { headers: hdr });
      if (r2.ok) {
        var d2 = await r2.json();
        if (d2.ok) {
          // Sadece gelen saldiri (takviye degil — takviye iyi haber)
          var gelenSaldiri = (d2.saldiri_sayisi || 0) + (d2.kadim_saldiri_sayisi || 0);
          setBadge('bn-army-badge', gelenSaldiri);
        }
      }
    } catch(e) { /* sessiz */ }
  }

  // Sayfa yuklendikten 3 sn sonra ilk poll, sonra her 60 sn
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(poll, 3000);
  } else {
    window.addEventListener('DOMContentLoaded', function(){ setTimeout(poll, 3000); });
  }
  setInterval(poll, 60000);

  // Public
  window.badgePoller = { poll: poll, setBadge: setBadge, toast: inAppToast };
})();
