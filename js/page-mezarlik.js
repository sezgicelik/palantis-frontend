/* ═══════════════════════════════════════════════════════
   PALANTİS — MEZARLIK SAYFASI
   js/page-mezarlik.js
   v1.3: Savas sonrasi unite diriltme
═══════════════════════════════════════════════════════ */

async function loadMezarlik() {
  const token = getToken();
  if (!token) return;
  const container = document.getElementById('mezarlik-list');

  try {
    const resp = await fetch(API_BASE + '/api/mezarlik', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await resp.json();
    if (!resp.ok) {
      container.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:20px">' + (data.error || 'Hata') + '</div>';
      return;
    }

    if (!data.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:40px;font-size:13px">Mezarlıkta diriltilecek ünite yok.</div>';
      return;
    }

    container.innerHTML = data.map(function(m) {
      var kalanSure = m.kalan_sure_ms;
      var saatKalan = Math.max(0, Math.floor(kalanSure / 3600000));
      var dakikaKalan = Math.max(0, Math.floor((kalanSure % 3600000) / 60000));
      var uniteDef = (typeof UNITS !== 'undefined') ? UNITS[m.unite_id] : null;
      var icon = uniteDef ? uniteDef.icon : '';
      var name = uniteDef ? uniteDef.name : m.unite_id;
      var kalanHak = m.dirilt_max - m.diriltilen;
      var tarafLabel = m.taraf === 'saldiran' ? '⚔ Saldıran' : '🛡 Savunan';
      var tarafColor = m.taraf === 'saldiran' ? '#E8A0A0' : '#A0C8F0';
      var maliyetStr = m.maliyet_altin > 0 ? (m.maliyet_altin + ' altın/birim') : 'Ücretsiz';

      return '<div style="background:rgba(255,255,255,.03);border:1px solid var(--border,#333);border-radius:8px;padding:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:1.2rem">' + icon + '</span>' +
            '<div>' +
              '<div style="font-weight:600;font-size:.75rem">' + name + '</div>' +
              '<div style="font-size:.55rem;color:var(--text-dim)">Ölen: ' + m.adet + ' · Diriltme hakkı: ' + kalanHak + ' / ' + m.dirilt_max + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:.55rem;color:' + tarafColor + '">' + tarafLabel + '</div>' +
            '<div style="font-size:.55rem;color:var(--text-dim)">⏱ ' + saatKalan + 's ' + dakikaKalan + 'dk kaldı</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<span style="font-size:.6rem;color:var(--text-dim)">Maliyet: <span style="color:' + (m.maliyet_altin > 0 ? 'var(--gold,#ffd700)' : '#5cb85c') + '">' + maliyetStr + '</span></span>' +
          '<input type="number" id="dirilt-adet-' + m.id + '" min="1" max="' + kalanHak + '" value="' + kalanHak + '" style="width:60px;padding:3px 6px;background:#1a1a1a;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
          '<button onclick="diriltUnite(' + m.id + ')" style="padding:4px 12px;background:rgba(40,167,69,.15);border:1px solid rgba(40,167,69,.3);color:#5cb85c;border-radius:4px;cursor:pointer;font-size:11px">💀 Dirilt</button>' +
          (m.maliyet_altin > 0 ? '<span id="dirilt-toplam-' + m.id + '" style="font-size:.55rem;color:var(--gold)">Toplam: ' + (m.maliyet_altin * kalanHak) + ' altın</span>' : '') +
        '</div>' +
        '<div id="dirilt-msg-' + m.id + '" style="font-size:.55rem;min-height:14px;margin-top:4px"></div>' +
      '</div>';
    }).join('');

    // Adet degisince toplam maliyet guncelle
    data.forEach(function(m) {
      if (m.maliyet_altin > 0) {
        var inp = document.getElementById('dirilt-adet-' + m.id);
        var tot = document.getElementById('dirilt-toplam-' + m.id);
        if (inp && tot) {
          inp.addEventListener('input', function() {
            var a = Math.max(1, Math.min(parseInt(inp.value) || 1, m.dirilt_max - m.diriltilen));
            tot.textContent = 'Toplam: ' + (m.maliyet_altin * a) + ' altın';
          });
        }
      }
    });

  } catch(e) {
    container.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:20px">Bağlantı hatası</div>';
  }
}

async function diriltUnite(mezarlikId) {
  var token = getToken();
  if (!token) return;
  var inp = document.getElementById('dirilt-adet-' + mezarlikId);
  var msgEl = document.getElementById('dirilt-msg-' + mezarlikId);
  var adet = parseInt(inp?.value) || 1;

  try {
    var resp = await fetch(API_BASE + '/api/mezarlik/' + mezarlikId + '/dirilt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ adet: adet })
    });
    var data = await resp.json();
    if (resp.ok && data.basarili) {
      if (msgEl) msgEl.innerHTML = '<span style="color:#5cb85c">' + data.diriltilen + 'x ' + data.unite_adi + ' diriltildi!' + (data.maliyet > 0 ? ' (-' + data.maliyet + ' altın)' : '') + '</span>';
      if (typeof toast === 'function') toast(data.diriltilen + 'x ' + data.unite_adi + ' diriltildi!');
      setTimeout(loadMezarlik, 1500);
    } else {
      if (msgEl) msgEl.innerHTML = '<span style="color:#e74c3c">' + (data.error || 'Hata') + '</span>';
    }
  } catch(e) {
    if (msgEl) msgEl.innerHTML = '<span style="color:#e74c3c">Bağlantı hatası</span>';
  }
}

// Sayfa yuklendiginde
document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) {
      clearInterval(check);
      loadMezarlik();
    }
  }, 500);
});
