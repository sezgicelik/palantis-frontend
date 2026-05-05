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

    // v1.14.1.30 — SECENEK B: Ayri kayit + gruplu UI
    // Ayni unite_id'nin farkli savaslarindan kayitlari tek grup altinda gosterir.
    // Her grubun kendi FIFO dirilt butonu (sureye göre dolmak üzere olandan başlar).
    const gruplar = {};
    data.forEach(m => {
      if (!gruplar[m.unite_id]) gruplar[m.unite_id] = [];
      gruplar[m.unite_id].push(m);
    });
    // Her grupta eskiden yeniye (en once dolmak uzere olan ustte)
    Object.values(gruplar).forEach(arr => arr.sort((a,b) => new Date(a.son_tarih) - new Date(b.son_tarih)));

    const kartlar = Object.entries(gruplar).map(([uniteId, kayitlar]) => {
      const uniteDef = (typeof UNITS !== 'undefined') ? UNITS[uniteId] : null;
      const icon = uniteDef ? uniteDef.icon : '⚔';
      const name = uniteDef ? uniteDef.name : uniteId;
      let grupToplamHak = 0, grupToplamOlen = 0, grupToplamMaliyet = 0;
      kayitlar.forEach(m => {
        const kalanHak = m.dirilt_max - m.diriltilen;
        grupToplamHak += kalanHak;
        grupToplamOlen += m.adet;
        if (m.taraf === 'saldiran') grupToplamMaliyet += kalanHak * m.maliyet_altin;
      });
      const ilkId = kayitlar[0].id; // FIFO icin en eski (en yakin dolmaya)

      // Alt satirlar (her savas kaydi)
      const altSatirlar = kayitlar.map(m => {
        const kalanSure = m.kalan_sure_ms;
        const saatKalan = Math.max(0, Math.floor(kalanSure / 3600000));
        const dakKalan = Math.max(0, Math.floor((kalanSure % 3600000) / 60000));
        const kalanHak = m.dirilt_max - m.diriltilen;
        const tarafLabel = m.taraf === 'saldiran' ? '⚔' : '🛡';
        const tarafColor = m.taraf === 'saldiran' ? '#e67e22' : '#3498db';
        const aciliyetRenk = saatKalan < 2 ? '#e74c3c' : (saatKalan < 8 ? '#e67e22' : '#888');
        const maliyetStr = m.maliyet_altin > 0 ? (m.maliyet_altin.toLocaleString('tr-TR') + ' altın/br') : 'Ücretsiz';
        return '<div style="background:#0a0a0a;border:1px solid #1e1e1e;border-radius:5px;padding:8px 10px;margin-top:6px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;flex-wrap:wrap;gap:6px">' +
            '<div>' +
              '<span style="color:' + tarafColor + ';font-size:10px">' + tarafLabel + '</span> ' +
              '<span style="color:#aaa">Savaş #' + m.savas_id + '</span> · ' +
              '<span style="color:#ccc">' + m.adet.toLocaleString('tr-TR') + ' ölü</span> · ' +
              '<span style="color:#d4af37">' + kalanHak.toLocaleString('tr-TR') + ' hak</span>' +
            '</div>' +
            '<div style="color:' + aciliyetRenk + ';font-size:10px;font-weight:bold">⏱ ' + saatKalan + 's ' + dakKalan + 'dk kaldı</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">' +
            '<span style="font-size:10px;color:#666">' + maliyetStr + '</span>' +
            '<input type="number" id="dirilt-adet-' + m.id + '" min="1" max="' + kalanHak + '" value="' + kalanHak + '" style="width:70px;padding:3px 6px;background:#111;border:1px solid #2a2a2a;color:#ddd;border-radius:3px;font-size:11px">' +
            '<button onclick="diriltUnite(' + m.id + ')" style="padding:4px 10px;background:rgba(40,167,69,.15);border:1px solid rgba(40,167,69,.3);color:#5cb85c;border-radius:3px;cursor:pointer;font-size:10px">💀 Dirilt</button>' +
            (m.maliyet_altin > 0 ? '<span id="dirilt-toplam-' + m.id + '" style="font-size:10px;color:var(--gold)">Top: ' + (m.maliyet_altin * kalanHak).toLocaleString('tr-TR') + '</span>' : '') +
          '</div>' +
          '<div id="dirilt-msg-' + m.id + '" style="font-size:11px;min-height:14px;margin-top:2px"></div>' +
        '</div>';
      }).join('');

      // Grup basligi
      return '<div style="background:rgba(255,255,255,.03);border:1px solid var(--border,#333);border-radius:8px;padding:12px;margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            '<span style="font-size:1.8rem">' + icon + '</span>' +
            '<div>' +
              '<div style="font-weight:700;font-size:14px;color:var(--gold)">' + name + '</div>' +
              '<div style="font-size:11px;color:#888">' +
                grupToplamOlen.toLocaleString('tr-TR') + ' ölü · ' +
                '<b style="color:#2ecc71">' + grupToplamHak.toLocaleString('tr-TR') + ' hak</b>' +
                ' · ' + kayitlar.length + ' kayıt' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;align-items:center">' +
            (grupToplamMaliyet > 0 ? '<span style="font-size:10px;color:#888">Tümü: ' + grupToplamMaliyet.toLocaleString('tr-TR') + ' altın</span>' : '') +
            '<button onclick="grupFifoDirilt(\'' + uniteId + '\')" title="FIFO: Süresi dolmak üzere olandan başla" style="padding:5px 12px;background:linear-gradient(180deg,#9c7f5e,#7a5a38);color:#fff8e0;border:1px solid #3a2410;border-radius:3px;cursor:pointer;font-size:10px;font-weight:bold;letter-spacing:0.5px">⚡ FIFO Dirilt</button>' +
          '</div>' +
        '</div>' +
        altSatirlar +
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

  if (!await noxConfirm('Tum mezarlik kayitlarin diriltilecek (ejderhalar haric). Yetecek altin varsa tumu, yoksa kismi dirilir. Birimler 4 PG sonra orduna katilacak. Onayliyor musun?')) return;

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
      else noxAlert(msg);
      setTimeout(loadMezarlik, 1200);
    } else {
      var err = data.error || 'Hata';
      if (typeof showToast === 'function') showToast('❌ ' + err, 'error');
      else noxAlert(err);
    }
  } catch(e) {
    if (typeof showToast === 'function') showToast('❌ Bağlantı hatası', 'error');
    else noxAlert('Baglanti hatasi');
  }
}

/* v1.14.1.30: Grup bazli FIFO Dirilt — ayni unite_id'nin tum kayitlari,
   sureSi dolmak uzere olandan baslayarak sirayla dirilir. */
async function grupFifoDirilt(uniteId) {
  const gruptakiler = _MEZ_LISTE.filter(m => m.unite_id === uniteId);
  if (!gruptakiler.length) return;
  const toplamHak = gruptakiler.reduce((s, m) => s + (m.dirilt_max - m.diriltilen), 0);
  const toplamMaliyet = gruptakiler.reduce((s, m) => s + (m.taraf === 'saldiran' ? (m.dirilt_max - m.diriltilen) * m.maliyet_altin : 0), 0);
  const ad = (typeof UNITS !== 'undefined' && UNITS[uniteId]) ? UNITS[uniteId].name : uniteId;
  if (!await noxConfirm('⚡ FIFO Dirilt — ' + ad + '\n\n' +
    '• Toplam: ' + toplamHak.toLocaleString('tr-TR') + ' birim\n' +
    '• Maliyet: ' + toplamMaliyet.toLocaleString('tr-TR') + ' altın\n' +
    '• Sıra: süresi dolmak üzere olan kayıtlardan başlar\n\n' +
    'Devam edilsin mi?')) return;
  const token = getToken(); if (!token) return;
  // Eskiden yeniye sırala (FIFO) — ilk kayit en yakin dolmaya
  const sirali = gruptakiler.slice().sort((a,b) => new Date(a.son_tarih) - new Date(b.son_tarih));
  let dirilenToplam = 0, harcanan = 0, hata = null;
  for (const m of sirali) {
    const kalanHak = m.dirilt_max - m.diriltilen;
    if (kalanHak <= 0) continue;
    try {
      const r = await fetch(API_BASE + '/api/mezarlik/' + m.id + '/dirilt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ adet: kalanHak })
      });
      const d = await r.json();
      if (r.ok && d.basarili) {
        dirilenToplam += d.diriltilen || 0;
        harcanan += d.maliyet || 0;
      } else {
        hata = d.error || 'Hata';
        break; // Altin bitebilir, devam etme
      }
    } catch(e) { hata = e.message; break; }
  }
  const mesaj = '⚡ FIFO sonucu: ' + dirilenToplam.toLocaleString('tr-TR') + ' ' + ad +
    (harcanan > 0 ? ' (−' + harcanan.toLocaleString('tr-TR') + ' altın)' : '') +
    (hata ? ' · ⚠ ' + hata : '');
  if (typeof showToast === 'function') showToast(mesaj, hata ? 'error' : 'success');
  else noxAlert(mesaj);
  setTimeout(loadMezarlik, 1200);
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
  window.grupFifoDirilt = grupFifoDirilt;
  window.diriltTumu = diriltTumu;
  window.loadMezarlik = loadMezarlik;
}
