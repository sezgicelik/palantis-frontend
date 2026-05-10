/* ══════════════════════════════════════
   Noxara — In-Game Bildirim Pop-up (v1.0)
   Oyuncu için gün geçişi tarzı anlık bildirimler
   Kaynak: /api/game/bildirimler (30 sn polling)
══════════════════════════════════════ */

(function() {
  var _popupSayac = 0;
  var _aktifPopuplar = [];

  /* CSS inject — bir kez */
  if (!document.getElementById('bildirim-popup-style')) {
    var style = document.createElement('style');
    style.id = 'bildirim-popup-style';
    style.textContent = [
      '.nxPopup {',
      '  position:fixed; right:-380px; z-index:10000;',
      '  background:linear-gradient(135deg,#1a1a2e 0%,#0f0f1a 100%);',
      '  border:1px solid #c9a84c; border-radius:10px;',
      '  padding:12px 14px; width:300px;',
      '  display:flex; align-items:flex-start; gap:10px;',
      '  box-shadow:0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.1);',
      '  transition:right 0.4s cubic-bezier(0.34,1.56,0.64,1);',
      '  cursor:pointer;',
      '}',
      '.nxPopup.goster { right:16px; }',
      '.nxPopup-ikon { font-size:22px; flex-shrink:0; margin-top:1px; }',
      '.nxPopup-body { flex:1; min-width:0; }',
      '.nxPopup-mesaj { font-size:11px; color:#ddd; line-height:1.4; word-break:break-word; }',
      '.nxPopup-kapat { font-size:14px; color:#555; flex-shrink:0; padding:0 2px; line-height:1; }',
      '.nxPopup-kapat:hover { color:#c9a84c; }',
      '.nxPopup-bar { height:2px; background:#c9a84c; border-radius:2px; margin-top:8px; transform-origin:left; }',
      '.nxPopup-bar.animasyon { animation: nxBarShrink 5s linear forwards; }',
      '@keyframes nxBarShrink { from{transform:scaleX(1)} to{transform:scaleX(0)} }',
    ].join('');
    document.head.appendChild(style);
  }

  function _yeniden_pozisyonla() {
    _aktifPopuplar.forEach(function(el, i) {
      el.style.bottom = (16 + i * 76) + 'px';
    });
  }

  function gosterPopup(b) {
    var el = document.createElement('div');
    el.className = 'nxPopup';
    el.style.bottom = '16px';

    var bar = document.createElement('div');
    bar.className = 'nxPopup-bar';

    el.innerHTML =
      '<div class="nxPopup-ikon">' + (b.ikon || '🔔') + '</div>' +
      '<div class="nxPopup-body">' +
        '<div class="nxPopup-mesaj">' + b.mesaj + '</div>' +
      '</div>' +
      '<div class="nxPopup-kapat" onclick="this.parentNode.remove()">✕</div>';

    el.appendChild(bar);
    document.body.appendChild(el);
    _aktifPopuplar.push(el);
    _yeniden_pozisyonla();

    // Animasyon: slide-in
    requestAnimationFrame(function() {
      el.classList.add('goster');
      setTimeout(function() { bar.classList.add('animasyon'); }, 50);
    });

    // Tıklayınca kapat
    el.addEventListener('click', function(e) {
      if (e.target.className !== 'nxPopup-kapat') kapat(el);
    });

    // 5 sn sonra otomatik kapat
    var timer = setTimeout(function() { kapat(el); }, 5000);
    el._timer = timer;
  }

  function kapat(el) {
    clearTimeout(el._timer);
    el.classList.remove('goster');
    setTimeout(function() {
      var idx = _aktifPopuplar.indexOf(el);
      if (idx >= 0) _aktifPopuplar.splice(idx, 1);
      if (el.parentNode) el.parentNode.removeChild(el);
      _yeniden_pozisyonla();
    }, 400);
  }

  function kontrol() {
    var token = (typeof getToken === 'function') ? getToken() : null;
    if (!token) return;
    var base = (typeof API_BASE !== 'undefined') ? API_BASE : '';
    fetch(base + '/api/game/bildirimler', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || !data.bildirimler || !data.bildirimler.length) return;
      data.bildirimler.slice().reverse().forEach(function(b, i) {
        // v1.14.3.65: Epik olay (nadir ejderha) — kucuk popup yerine tam ekran animasyon
        if (b.tip === 'epik_ejderha' && typeof window.nxEpikEjderhaGoster === 'function') {
          setTimeout(function() { window.nxEpikEjderhaGoster(b); }, i * 500);
        } else {
          setTimeout(function() { gosterPopup(b); }, i * 500);
        }
      });
    })
    .catch(function() {});
  }

  // Sayfa yüklenince başlat
  var _basladi = false;
  function baslat() {
    if (_basladi) return;
    _basladi = true;
    setTimeout(kontrol, 3000);        // İlk kontrol 3 sn sonra
    setInterval(kontrol, 30000);      // Sonra her 30 sn
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }

  // Global erişim (isteğe bağlı manuel tetikleme)
  window.nxBildirimTest = function(mesaj) {
    gosterPopup({ ikon: '🔔', mesaj: mesaj || 'Test bildirimi!' });
  };
})();
