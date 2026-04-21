/* ═══════════════════════════════════════════════════════
   NOXARA — GUILD SAVAŞ ODASI (v1.14.0.70)
   page-guild-savas.js
   Matrix: benim uyelerim × dusman uyeler
   Her hucre: saldırılabilir / kilit
   Tiklayinca (kendi satirim × ✓ hucresi) → eylem modal
═══════════════════════════════════════════════════════ */
var SAVAS_ODASI_DATA = null;
var SAVAS_ODASI_AKTIF_SAVAS_IDX = 0;

async function renderTabSavasOdasi(el, data) {
  el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:#888">Savas odasi yukleniyor...</div>';
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/guild/savas-odasi', {
      headers: { Authorization: 'Bearer ' + token }
    });
    var d = await r.json();
    if (!d.ok) { el.innerHTML = '<div class="card" style="padding:20px;color:#e74c3c">Hata: ' + (d.error||'bilinmeyen') + '</div>'; return; }
    SAVAS_ODASI_DATA = d;
    renderSavasOdasiIcerik(el);
  } catch(e) {
    el.innerHTML = '<div class="card" style="padding:20px;color:#e74c3c">Sunucu hatasi: ' + e.message + '</div>';
  }
}

function renderSavasOdasiIcerik(el) {
  var d = SAVAS_ODASI_DATA;
  if (!d || !d.savaslar || !d.savaslar.length) {
    el.innerHTML =
      '<div class="card" style="padding:24px;text-align:center">' +
      '<div style="font-size:40px;margin-bottom:10px">🕊️</div>' +
      '<h3 style="color:#c8a96e;margin-bottom:8px">Barış içindesin</h3>' +
      '<p style="color:#888;font-size:12px">Hiçbir guildle savaşta değilsin.<br>Diplomasi sekmesinden savaş ilan edebilirsin.</p>' +
      '</div>';
    return;
  }

  var cfg = d.deger_config || { alt_yuzde: 70, ust_yuzde: 143 };
  var savas = d.savaslar[SAVAS_ODASI_AKTIF_SAVAS_IDX] || d.savaslar[0];

  // Savas tab'lari (birden fazla savas varsa)
  var tabBar = '';
  if (d.savaslar.length > 1) {
    tabBar = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
    d.savaslar.forEach(function(s, i) {
      var aktif = i === SAVAS_ODASI_AKTIF_SAVAS_IDX;
      tabBar += '<button onclick="savasOdasiTabDegistir(' + i + ')" style="padding:6px 12px;font-size:11px;background:' + (aktif?'#8B0000':'#1a1a1a') + ';color:' + (aktif?'#fff':'#c8a96e') + ';border:1px solid ' + (aktif?'#8B0000':'#333') + ';border-radius:4px;cursor:pointer">⚔️ ' + escHtml(s.rakip_guild.isim) + ' [' + escHtml(s.rakip_guild.tag||'') + ']</button>';
    });
    tabBar += '</div>';
  }

  // Ust bilgi banner
  var head =
    '<div class="card" style="padding:14px;margin-bottom:12px;background:linear-gradient(90deg,#1a0a0a,#2a1010)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
        '<div>' +
          '<div style="color:#e74c3c;font-family:Cinzel,serif;font-size:18px;font-weight:bold">⚔️ ' + escHtml(d.benim_guild.isim) + ' vs ' + escHtml(savas.rakip_guild.isim) + '</div>' +
          '<div style="color:#888;font-size:11px;margin-top:4px">Üyelerim: ' + savas.benim_uyelerim.length + ' · Düşman: ' + savas.dusman_uyeler.length + ' · Değer aralığı: %' + cfg.alt_yuzde + ' − %' + cfg.ust_yuzde + '</div>' +
        '</div>' +
        '<div style="font-size:10px;color:#c8a96e">' +
          '<span style="background:rgba(46,204,113,0.15);color:#2ecc71;padding:2px 6px;border-radius:4px;margin-right:4px">✓ saldırılabilir</span>' +
          '<span style="background:rgba(231,76,60,0.15);color:#e74c3c;padding:2px 6px;border-radius:4px">🔒 engelli</span>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Matrix tablosu
  var matrixHtml = renderSavasMatrix(savas, d.benim_guild);

  el.innerHTML = tabBar + head + matrixHtml;
}

function savasOdasiTabDegistir(idx) {
  SAVAS_ODASI_AKTIF_SAVAS_IDX = idx;
  var el = document.getElementById('guild-tab-content');
  if (el) renderSavasOdasiIcerik(el);
}

function renderSavasMatrix(savas, benimGuild) {
  var benim = savas.benim_uyelerim;
  var dusman = savas.dusman_uyeler;
  var matrix = savas.matrix || {};

  if (!benim.length || !dusman.length) {
    return '<div class="card" style="padding:16px;color:#888;text-align:center">Üye yok — matrix gösterilemiyor.</div>';
  }

  // Stok sizeable container, sticky header
  var html = '<div class="card" style="padding:0;overflow:auto;max-height:70vh">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px">';

  // Header: first cell + dusman uyeler
  html += '<thead><tr style="background:#1a0a0a;position:sticky;top:0;z-index:2">';
  html += '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #3a1515;min-width:160px;position:sticky;left:0;background:#1a0a0a;z-index:3">Benim Üyem ↓ / Düşman →</th>';
  dusman.forEach(function(en) {
    var degerK = fmtDeger(en.sehir_degeri);
    var koord = '(' + en.koord_x + ':' + en.koord_y + ')';
    var cagBadge = en.cag < 2 ? ' 🛡️' : '';
    var tatilBadge = en.tatil_modu ? ' 🏖️' : '';
    html += '<th style="padding:6px 8px;text-align:center;border-bottom:2px solid #3a1515;min-width:90px;color:#E8A0A0;font-size:10px">' +
      '<div style="font-weight:bold">' + escHtml(en.kral) + cagBadge + tatilBadge + '</div>' +
      '<div style="color:#888;font-size:9px;margin-top:2px">' + degerK + ' · ' + koord + '</div>' +
      '</th>';
  });
  html += '</tr></thead><tbody>';

  // Rows: benim uyelerim
  benim.forEach(function(me) {
    var myRowBg = me.tatil_modu ? '#1a1508' : '#0d0d0d';
    html += '<tr style="background:' + myRowBg + '">';
    // First cell: my info
    var myDeger = fmtDeger(me.sehir_degeri);
    var myKoord = '(' + me.koord_x + ':' + me.koord_y + ')';
    var myOrdu = me.ordu_sayisi ? ((me.ordu_sayisi - me.is_busy_sayisi) + '/' + me.ordu_sayisi + ' ordu') : 'ordu yok';
    var rutbeBadge = me.rutbe === 'lider' ? '👑 ' : me.rutbe === 'yardimci' ? '⭐ ' : '';
    html += '<td style="padding:8px 10px;border-bottom:1px solid #1a1a1a;position:sticky;left:0;background:' + myRowBg + ';z-index:1">' +
      '<div style="color:#A0C8F0;font-weight:bold">' + rutbeBadge + escHtml(me.kral) + '</div>' +
      '<div style="color:#888;font-size:9px;margin-top:2px">' + myDeger + ' · ' + myKoord + ' · ' + myOrdu + '</div>' +
      '</td>';

    dusman.forEach(function(en) {
      var key = me.player_id + '__' + en.player_id;
      var cell = matrix[key];
      var isMe = me.player_id === SAVAS_ODASI_BENIM_ID();
      html += renderMatrixCell(cell, me, en, isMe);
    });

    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

function renderMatrixCell(cell, me, en, isMe) {
  if (!cell) return '<td style="padding:6px;text-align:center;color:#444">—</td>';

  var bg, txt, clickAttr = '';
  if (cell.saldirilabilir) {
    bg = isMe ? 'rgba(46,204,113,0.2)' : 'rgba(46,204,113,0.08)';
    if (isMe) {
      clickAttr = 'onclick="savasOdasiAcEylemModal(' + en.player_id + ',\'' + escAttr(en.kral) + '\',' + en.koord_x + ',' + en.koord_y + ')" style="cursor:pointer"';
      txt = '<div style="color:#2ecc71;font-weight:bold">⚔️ 🔮</div><div style="color:#888;font-size:9px;margin-top:2px">tıkla</div>';
    } else {
      txt = '<div style="color:#2ecc71">✓</div>';
    }
  } else {
    bg = 'rgba(231,76,60,0.06)';
    txt = '<div style="color:#888;font-size:10px">🔒</div>' +
          (cell.sebep ? '<div style="color:#666;font-size:9px;margin-top:1px">' + escHtml(cell.sebep) + '</div>' : '');
  }

  return '<td ' + clickAttr + ' style="padding:6px 4px;text-align:center;border-bottom:1px solid #1a1a1a;border-left:1px solid #1a1a1a;background:' + bg + '">' + txt + '</td>';
}

function SAVAS_ODASI_BENIM_ID() {
  // page-guild.js GUILD_DATA yüklerken backend'den benim_player_id gelir
  if (typeof GUILD_DATA !== 'undefined' && GUILD_DATA && GUILD_DATA.benim_player_id) return GUILD_DATA.benim_player_id;
  return null;
}

function savasOdasiAcEylemModal(hedefId, hedefKral, hx, hy) {
  var modal = document.getElementById('savas-odasi-eylem-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'savas-odasi-eylem-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999';
    document.body.appendChild(modal);
  }
  modal.innerHTML =
    '<div class="card" style="max-width:400px;padding:20px;background:#0f0805;border:1px solid #5a3020">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<h3 style="color:#c8a96e;font-family:Cinzel,serif;margin:0">⚔️ Saldırı Seçenekleri</h3>' +
        '<button onclick="document.getElementById(\'savas-odasi-eylem-modal\').remove()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer">×</button>' +
      '</div>' +
      '<div style="padding:10px;background:#1a0a0a;border-radius:4px;margin-bottom:14px">' +
        '<div style="color:#E8A0A0;font-weight:bold">🎯 ' + escHtml(hedefKral) + '</div>' +
        '<div style="color:#888;font-size:11px;margin-top:4px">Koordinat: ' + hx + ':' + hy + '</div>' +
      '</div>' +
      '<div style="display:grid;gap:10px">' +
        '<a href="savas-baslat.html?hedef_id=' + hedefId + '&hedef_x=' + hx + '&hedef_y=' + hy + '&hedef_kral=' + encodeURIComponent(hedefKral) + '" style="padding:12px;background:#8B0000;color:#fff;text-align:center;border-radius:4px;text-decoration:none;font-weight:bold">⚔️ Ordu Gönder</a>' +
        '<a href="buyucu-kulesi.html?hedef_id=' + hedefId + '&hedef_kral=' + encodeURIComponent(hedefKral) + '&kategori=dusmana" style="padding:12px;background:#5a3a8a;color:#fff;text-align:center;border-radius:4px;text-decoration:none;font-weight:bold">🔮 Saldırı Büyüsü Yap</a>' +
        '<a href="map.html?x=' + hx + '&y=' + hy + '" style="padding:12px;background:#1a4a1a;color:#fff;text-align:center;border-radius:4px;text-decoration:none;font-weight:bold">📍 Haritada Göster</a>' +
      '</div>' +
      '<div style="margin-top:14px;color:#666;font-size:10px;text-align:center">İpucu: Eş zamanlı saldırı için üyelerle chat üstünden anlaş.</div>' +
    '</div>';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
}

// ─── Utility ─────────────
function fmtDeger(d) {
  d = +d || 0;
  if (d >= 1000000) return (d/1000000).toFixed(1) + 'M';
  if (d >= 1000) return (d/1000).toFixed(1) + 'k';
  return String(Math.round(d));
}
function escHtml(s) {
  return String(s||'').replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
}
function escAttr(s) { return escHtml(s).replace(/'/g,'&#39;'); }
