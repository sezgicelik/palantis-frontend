/* ═══════════════════════════════════════════════════════
   BAN HANDLER — 403 ban response yakalama + UI
   v1.14.1.58
   ═══════════════════════════════════════════════════════
   Backend authMiddleware ban kontrolü 403 döner:
     { error, ban_tipi, ban_scope, ban_sebep, kalan_saat, bitis_at }

   Bu script global fetch'i sarar — ban response gelince modal gösterir.
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if (window._noxBanHandler) return;
  window._noxBanHandler = true;

  var _origFetch = window.fetch;
  var _modalGosterildi = false;

  window.fetch = function() {
    return _origFetch.apply(this, arguments).then(function(res) {
      // Sadece API ban response'ları (kendi backend'imizden)
      if (res.status === 403 && !_modalGosterildi) {
        // Clone response (body'yi tekrar okuyabilelim)
        res.clone().json().then(function(d) {
          if (d.ban_tipi || d.ban_scope) {
            _modalGosterildi = true;
            _banModalGoster(d);
          }
        }).catch(()=>{});
      }
      return res;
    });
  };

  function _banModalGoster(banData) {
    // Var olan modal varsa kaldir
    var mevcut = document.getElementById('nox-ban-modal');
    if (mevcut) mevcut.remove();

    var TIP_ISIM = {
      multi_account: '🔁 Multi Hesap',
      ticaret:       '💰 Ticaret İhlali',
      kufur:         '🚫 Küfür / Hakaret',
      manuel:        '⚠️ Manuel Ban'
    };
    var SCOPE_ACIKLAMA = {
      oyun:   'Tüm oyun erişimin engellendi.',
      meydan: 'Sadece Şehir Meydanı (chat + özel mesaj) erişimin engellendi. Oyunun geri kalanı çalışıyor.'
    };

    var bitisDate = banData.bitis_at ? new Date(banData.bitis_at) : null;
    var bitisStr = bitisDate ? bitisDate.toLocaleString('tr-TR', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    }) : '—';

    var modal = document.createElement('div');
    modal.id = 'nox-ban-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;backdrop-filter:blur(4px)';

    var sadeceMeydan = banData.ban_scope === 'meydan';
    modal.innerHTML = ''
      + '<div style="background:linear-gradient(135deg,#1a0a0a,#0a0505);border:2px solid #c0392b;border-radius:12px;padding:28px;max-width:480px;color:#e0e0e0;box-shadow:0 8px 40px rgba(192,57,43,0.4)">'
      + '  <div style="text-align:center;margin-bottom:20px">'
      + '    <div style="font-size:48px;margin-bottom:8px">🔨</div>'
      + '    <h2 style="margin:0;color:#e74c3c;font-family:Cinzel,serif;font-size:24px;letter-spacing:1px">HESAP BANLANMIŞ</h2>'
      + '  </div>'
      + '  <div style="background:rgba(231,76,60,0.1);border-left:3px solid #e74c3c;padding:12px;border-radius:4px;margin-bottom:14px;font-size:13px">'
      + '    <div style="margin-bottom:6px"><b style="color:#fca5a5">Tip:</b> ' + (TIP_ISIM[banData.ban_tipi] || banData.ban_tipi || '?') + '</div>'
      + '    <div style="margin-bottom:6px"><b style="color:#fca5a5">Kapsam:</b> ' + (SCOPE_ACIKLAMA[banData.ban_scope] || banData.ban_scope) + '</div>'
      + (banData.ban_sebep ? '    <div style="margin-bottom:6px"><b style="color:#fca5a5">Sebep:</b> ' + banData.ban_sebep + '</div>' : '')
      + '    <div style="margin-bottom:6px"><b style="color:#fca5a5">Kalan:</b> ' + (banData.kalan_saat || 0) + ' saat (' + Math.ceil((banData.kalan_saat||0)/24) + ' gün)</div>'
      + '    <div><b style="color:#fca5a5">Bitiş:</b> ' + bitisStr + '</div>'
      + '  </div>'
      + (sadeceMeydan
          ? '<div style="background:rgba(46,204,113,0.08);border-left:3px solid #2ecc71;padding:10px;border-radius:4px;margin-bottom:16px;font-size:12px;color:#86efac">ℹ️ Sadece chat banı — oyununuzu oynamaya devam edebilirsiniz, ama Şehir Meydanı/özel mesaj kullanamazsınız.</div>'
          : '<div style="background:rgba(231,76,60,0.05);border-left:3px solid #c0392b;padding:10px;border-radius:4px;margin-bottom:16px;font-size:12px;color:#fca5a5">⚠️ Tüm oyun erişiminiz kapalı. Süre dolduğunda otomatik açılır.</div>')
      + '  <div style="font-size:11px;color:#888;margin-bottom:18px;text-align:center">İtirazlarını <a href="bug-bildir.html" style="color:#d4af37">bug bildir</a> üzerinden iletebilirsin.</div>'
      + '  <div style="display:flex;gap:8px">'
      + (sadeceMeydan
          ? '    <button id="nox-ban-devam" style="flex:1;padding:10px;background:#2ecc71;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:13px">Oyuna Devam Et</button>'
          : '    <button id="nox-ban-cikis" style="flex:1;padding:10px;background:#1a0a0a;border:1px solid #3a1a1a;color:#c0392b;border-radius:6px;font-weight:bold;cursor:pointer;font-size:13px">🚪 Çıkış Yap</button>')
      + '  </div>'
      + '</div>';

    document.body.appendChild(modal);

    // Kapatma handler'ları
    var devamBtn = document.getElementById('nox-ban-devam');
    if (devamBtn) {
      devamBtn.onclick = function() {
        modal.remove();
        _modalGosterildi = false; // tekrar gosterilebilir
      };
    }
    var cikisBtn = document.getElementById('nox-ban-cikis');
    if (cikisBtn) {
      cikisBtn.onclick = function() {
        try { localStorage.removeItem('palantis_token'); } catch {}
        window.location.href = 'index.html';
      };
    }
  }
})();
