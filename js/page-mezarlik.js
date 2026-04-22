/* ═══════════════════════════════════════════════════════
   NOXARA — MEZARLIK SAYFASI
   js/page-mezarlik.js
   v1.14.0.97: Tumunu Dirilt butonu + 4 PG egitim sure bilgisi + ejderha gizle
═══════════════════════════════════════════════════════ */

let _MEZ_LISTE = [];

async function loadMezarlik() {
  const token = getToken();
  if (!token) return;
  const container = document.getElementById('mezarlik-list');

  try {
    const resp = await fetch(API_BASE + '/api/mezarlik?_cb=' + Date.now(), {
      headers: { 'Authorization': 'Bearer ' + token },
      cache: 'no-store'
    });
    const data = await resp.json();
    if (!resp.ok) {
      container.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:20px">' + (data.error || 'Hata') + '</div>';
      return;
    }

    _MEZ_LISTE = data;

    if (!data.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:40px;font-size:13px">Mezarlıkta diriltilecek ünite yok.</div>';
      return;
    }

    // v1.14.0.97: Ust kisim — toplu istatistik + Tumunu Dirilt butonu
    let toplamBirim = 0, toplamMaliyet = 0;
    data.forEach(m => {
      const kalan = m.dirilt_max - m.diriltilen;
      toplamBirim += kalan;
      if (m.taraf === 'saldiran' && m.maliyet_altin > 0) {
        toplamMaliyet += kalan * m.maliyet_altin;
      }
    });

    const ustBar = '<div style="background:linear-gradient(135deg,rgba(212,175,55,.12),rgba(139,105,20,.08));border:1px solid var(--gold);border-radius:8px;padding:14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<div>' +
        '<div style="font-family:\'Cinzel\',serif;font-size:14px;color:var(--gold);font-weight:bold">💀 Toplu Diriltme</div>' +
        '<div style="font-size:11px;color:var(--text-dim);margin-top:2px">' +
          '<b style="color:var(--gold)">' + toplamBirim.toLocaleString('tr-TR') + '</b> birim · ' +
          'Toplam maliyet: <b style="color:var(--gold)">' + toplamMaliyet.toLocaleString('tr-TR') + ' altın</b> · ' +
          '<span style="color:#f39c12">⏱ 4 PG sonra orduna katılır</span>' +
        '</div>' +
      '</div>' +
      '<button onclick="diriltTumu()" style="padding:10px 22px;background:linear-gradient(180deg,#9c7f5e,#7a5a38,#6c4824);color:#fff8e0;border:1px solid #3a2410;border-radius:4px;cursor:pointer;font-family:\'Cinzel\',serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-shadow:0 1px 1px rgba(0,0,0,.4)">⚰️ TÜMÜNÜ DİRİLT</button>' +
    '</div>';

    const kartlar = data.map(function(m) {
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
            '<span style="font-size:1.4rem">' + icon + '</span>' +
            '<div>' +
              '<div style="font-weight:600;font-size:13px">' + name + '</div>' +
              '<div style="font-size:11px;color:var(--text-dim)">Ölen: ' + m.adet + ' · Diriltme hakkı: ' + kalanHak + ' / ' + m.dirilt_max + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:11px;color:' + tarafColor + '">' + tarafLabel + '</div>' +
            '<div style="font-size:10px;color:var(--text-dim)">⏱ ' + saatKalan + 's ' + dakikaKalan + 'dk kaldı</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<span style="font-size:11px;color:var(--text-dim)">Maliyet: <span style="color:' + (m.maliyet_altin > 0 ? 'var(--gold,#ffd700)' : '#5cb85c') + '">' + maliyetStr + '</span></span>' +
          '<input type="number" id="dirilt-adet-' + m.id + '" min="1" max="' + kalanHak + '" value="' + kalanHak + '" style="width:70px;padding:4px 6px;background:#1a1a1a;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
          '<button onclick="diriltUnite(' + m.id + ')" style="padding:5px 14px;background:rgba(40,167,69,.15);border:1px solid rgba(40,167,69,.3);color:#5cb85c;border-radius:4px;cursor:pointer;font-size:11px">💀 Dirilt</button>' +
          (m.maliyet_altin > 0 ? '<span id="dirilt-toplam-' + m.id + '" style="font-size:11px;color:var(--gold)">Toplam: ' + (m.maliyet_altin * kalanHak).toLocaleString('tr-TR') + ' altın</span>' : '') +
          '<span style="font-size:10px;color:#f39c12;margin-left:auto">⏱ 4 PG eğitim</span>' +
        '</div>' +
        '<div id="dirilt-msg-' + m.id + '" style="font-size:11px;min-height:14px;margin-top:4px"></div>' +
      '</div>';
    }).join('');

    container.innerHTML = ustBar + kartlar;

    // Adet degisince toplam maliyet guncelle
    data.forEach(function(m) {
      if (m.maliyet_altin > 0) {
        var inp = document.getElementById('dirilt-adet-' + m.id);
        var tot = document.getElementById('dirilt-toplam-' + m.id);
        if (inp && tot) {
          inp.addEventListener('input', function() {
            var a = Math.max(1, Math.min(parseInt(inp.value) || 1, m.dirilt_max - m.diriltilen));
            tot.textContent = 'Toplam: ' + (m.maliyet_altin * a).toLocaleString('tr-TR') + ' altın';
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
      var msg = data.diriltilen + 'x ' + data.unite_adi + ' — 4 PG sonra orduna katılacak' + (data.maliyet > 0 ? ' (-' + data.maliyet.toLocaleString('tr-TR') + ' altın)' : '');
      if (msgEl) msgEl.innerHTML = '<span style="color:#5cb85c">' + msg + '</span>';
      if (typeof showToast === 'function') showToast('⚰️ ' + msg, 'success');
      setTimeout(loadMezarlik, 1200);
    } else {
      if (msgEl) msgEl.innerHTML = '<span style="color:#e74c3c">' + (data.error || 'Hata') + '</span>';
    }
  } catch(e) {
    if (msgEl) msgEl.innerHTML = '<span style="color:#e74c3c">Bağlantı hatası</span>';
  }
}

/* v1.14.0.97: Tumunu Dirilt — tek istekle tum aktif mezarliklari dirilt */
async function diriltTumu() {
  var token = getToken();
  if (!token) return;

  if (!confirm('Tum mezarlik kayitlarin diriltilecek (ejderhalar haric). Yetecek altin varsa tumu, yoksa kismi dirilir. Birimler 4 PG sonra orduna katilacak. Onayliyor musun?')) return;

  try {
    var resp = await fetch(API_BASE + '/api/mezarlik/tumu/dirilt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: '{}'
    });
    var data = await resp.json();
    if (resp.ok && data.basarili) {
      var msg = '✓ ' + data.toplam_birim.toLocaleString('tr-TR') + ' birim diriltildi' +
        (data.toplam_maliyet > 0 ? ' (-' + data.toplam_maliyet.toLocaleString('tr-TR') + ' altın)' : '') +
        ' — 4 PG sonra orduna katılır';
      if (typeof showToast === 'function') showToast(msg, 'success');
      else alert(msg);
      setTimeout(loadMezarlik, 1200);
    } else {
      var err = data.error || 'Hata';
      if (typeof showToast === 'function') showToast('❌ ' + err, 'error');
      else alert(err);
    }
  } catch(e) {
    if (typeof showToast === 'function') showToast('❌ Bağlantı hatası', 'error');
    else alert('Baglanti hatasi');
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

if (typeof window !== 'undefined') {
  window.diriltUnite = diriltUnite;
  window.diriltTumu = diriltTumu;
  window.loadMezarlik = loadMezarlik;
}
