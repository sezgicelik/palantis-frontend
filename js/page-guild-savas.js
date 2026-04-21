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

  // v1.14.0.71: Istatistik paneli
  var istatistikHtml = renderSavasIstatistik(savas.istatistik || {}, d.benim_guild.isim, savas.rakip_guild.isim);

  // v1.14.0.71: Plan paneli placeholder (faz 2 will populate)
  var planHtml = '<div id="savas-plan-wrap-' + savas.rakip_guild.id + '" style="margin-bottom:12px"></div>';

  // Matrix tablosu
  var matrixHtml = renderSavasMatrix(savas, d.benim_guild);

  el.innerHTML = tabBar + head + istatistikHtml + planHtml + matrixHtml;

  // Plan paneli yukle (faz 2)
  if (typeof loadSavasPlanlari === 'function') loadSavasPlanlari(savas.rakip_guild.id);
}

function renderSavasIstatistik(ist, benimIsim, rakipIsim) {
  if (!ist || !ist.toplam_savas) {
    return '<div class="card" style="padding:14px;margin-bottom:12px;text-align:center;color:#888;font-size:12px">' +
           '📊 Henüz savaş olmadı. İlk saldırıyla istatistikler başlayacak.' +
           '</div>';
  }
  var fmt = function(n) { return (+n || 0).toLocaleString('tr-TR'); };
  var kazanRenk = ist.benim_kazanim >= ist.rakip_kazanim ? '#2ecc71' : '#e74c3c';
  var pBenim = ist.toplam_savas > 0 ? Math.round(100 * ist.benim_kazanim / ist.toplam_savas) : 0;
  var pRakip = 100 - pBenim;
  return '<div class="card" style="padding:14px;margin-bottom:12px;background:#0f0805">' +
    '<div style="font-family:Cinzel,serif;color:#c8a96e;font-size:13px;margin-bottom:10px">📊 Savaş İstatistikleri (' + fmt(ist.toplam_savas) + ' savaş)</div>' +
    // Kazanim bar
    '<div style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">' +
        '<span style="color:#2ecc71">🏆 ' + escHtml(benimIsim) + ': ' + fmt(ist.benim_kazanim) + ' zafer (%' + pBenim + ')</span>' +
        '<span style="color:#e74c3c">🏆 ' + escHtml(rakipIsim) + ': ' + fmt(ist.rakip_kazanim) + ' zafer (%' + pRakip + ')</span>' +
      '</div>' +
      '<div style="height:8px;background:#2a2a2a;border-radius:4px;overflow:hidden;display:flex">' +
        '<div style="width:' + pBenim + '%;background:#2ecc71"></div>' +
        '<div style="width:' + pRakip + '%;background:#e74c3c"></div>' +
      '</div>' +
    '</div>' +
    // Grid stats
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;font-size:11px">' +
      _istBox('⚔️ Rakip kaybı', fmt(ist.rakip_kayip_unite) + ' ünite', '#2ecc71') +
      _istBox('💀 Benim kaybım', fmt(ist.benim_kayip_unite) + ' ünite', '#e74c3c') +
      _istBox('💰 Aldığım altın', fmt(ist.benim_ganimet_altin), '#d4af37') +
      _istBox('💸 Kaybettiğim altın', fmt(ist.rakip_ganimet_altin), '#888') +
      _istBox('🔒 Aldığım esir', fmt(ist.benim_esir), '#9b59b6') +
      _istBox('🔗 Kaybettiğim esir', fmt(ist.rakip_esir), '#666') +
    '</div>' +
  '</div>';
}
function _istBox(label, val, renk) {
  return '<div style="padding:6px 8px;background:#1a1a1a;border-left:2px solid ' + renk + ';border-radius:3px">' +
    '<div style="color:#888;font-size:10px">' + label + '</div>' +
    '<div style="color:' + renk + ';font-weight:bold;margin-top:2px">' + val + '</div>' +
  '</div>';
}

/* ════════════════════════════════════════════════════
   v1.14.0.71: SAVAS PLAN (Faz 2 — Sync saldiri)
════════════════════════════════════════════════════ */
var SAVAS_PLAN_DATA = null;

async function loadSavasPlanlari(rakipGuildId) {
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/guild/savas-plan/aktif', {
      headers: { Authorization: 'Bearer ' + token }
    });
    var d = await r.json();
    if (!d.ok) return;
    SAVAS_PLAN_DATA = d.planlar || [];
    renderSavasPlanPaneli(rakipGuildId);
  } catch(e) { /* sessiz */ }
}

function renderSavasPlanPaneli(rakipGuildId) {
  var wrap = document.getElementById('savas-plan-wrap-' + rakipGuildId);
  if (!wrap) return;

  var savas = (SAVAS_ODASI_DATA && SAVAS_ODASI_DATA.savaslar) ? SAVAS_ODASI_DATA.savaslar[SAVAS_ODASI_AKTIF_SAVAS_IDX] : null;
  if (!savas) return;
  var dusmanIdSet = new Set((savas.dusman_uyeler || []).map(u => u.player_id));

  // Sadece bu savastaki dusmanlara yapilan planlar
  var planlar = (SAVAS_PLAN_DATA || []).filter(p => dusmanIdSet.has(p.hedef.player_id));

  var isLider = false, isYardimci = false;
  if (typeof GUILD_DATA !== 'undefined' && GUILD_DATA && GUILD_DATA.benim_rutbem) {
    isLider = GUILD_DATA.benim_rutbem === 'lider';
    isYardimci = GUILD_DATA.benim_rutbem === 'yardimci';
  }

  var html = '<div class="card" style="padding:12px;background:#0a0f05">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px">' +
      '<div style="font-family:Cinzel,serif;color:#c8a96e;font-size:13px">🎯 Aktif Sync Saldırı Planları (' + planlar.length + ')</div>' +
      ((isLider || isYardimci) ? '<button class="btn-action" onclick="savasPlanAcOlusturModal(' + rakipGuildId + ')" style="padding:4px 12px;font-size:11px;width:auto">+ Yeni Plan</button>' : '') +
    '</div>';

  if (!planlar.length) {
    html += '<div style="color:#666;font-size:11px;text-align:center;padding:12px">Henüz sync plan yok. Lider/yardımcı plan oluşturabilir.</div>';
  } else {
    html += planlar.map(p => renderSavasPlanKart(p)).join('');
  }
  html += '</div>';
  wrap.innerHTML = html;
}

function renderSavasPlanKart(p) {
  var varis = new Date(p.varis_zamani);
  var kalanMin = Math.max(0, Math.round((varis - Date.now()) / 60000));
  var kalanStr = kalanMin > 60 ? Math.round(kalanMin/60) + ' sa ' + (kalanMin%60) + ' dk' : kalanMin + ' dk';
  var renk = kalanMin < 30 ? '#e74c3c' : kalanMin < 120 ? '#f39c12' : '#2ecc71';

  var kat = p.katilimlar || [];
  var katilimMetin = kat.map(k => {
    var now = new Date();
    var kalkis = k.kalkis_at ? new Date(k.kalkis_at) : null;
    var kalkisStr = kalkis ? (kalkis < now ? '✓ yola cikti' : Math.ceil((kalkis - now) / 60000) + ' dk sonra kalkar') : '';
    return '<span style="display:inline-block;margin-right:8px;padding:2px 6px;background:#1a1a1a;border-radius:3px;font-size:10px;color:#aaa">' +
      escHtml(k.kral) + (kalkisStr ? ' <span style="color:#666">(' + kalkisStr + ')</span>' : '') + '</span>';
  }).join('');

  var benimId = SAVAS_ODASI_BENIM_ID();
  var canIptal = p.olusturan.id === benimId || (typeof GUILD_DATA !== 'undefined' && GUILD_DATA?.benim_rutbem === 'lider');

  return '<div style="padding:10px;background:#1a1a1a;border-left:3px solid ' + renk + ';border-radius:4px;margin-bottom:8px">' +
    '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:6px">' +
      '<div>' +
        '<b style="color:#E8A0A0">🎯 ' + escHtml(p.hedef.kral) + '</b> ' +
        '<span style="color:#666;font-size:10px">(' + p.hedef.koord_x + ':' + p.hedef.koord_y + ')</span>' +
      '</div>' +
      '<div style="color:' + renk + ';font-weight:bold;font-size:12px">⏱ ' + varis.toLocaleTimeString('tr-TR').slice(0,5) + ' · ' + kalanStr + ' kaldı</div>' +
    '</div>' +
    (p.not_metin ? '<div style="color:#888;font-size:10px;margin-bottom:6px">📝 ' + escHtml(p.not_metin) + '</div>' : '') +
    '<div style="color:#666;font-size:10px;margin-bottom:4px">Katılım (' + kat.length + '): ' + (kat.length ? katilimMetin : '<em>henüz kimse katılmadı</em>') + '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      (p.ben_katildim
        ? '<span style="padding:4px 10px;background:#1a4a1a;color:#2ecc71;border-radius:3px;font-size:11px">✓ Katıldın</span>'
        : '<button class="btn-action" onclick="savasPlanKatilModal(' + p.id + ')" style="padding:4px 10px;font-size:11px;background:#8B0000;color:#fff;width:auto">⚔️ Katıl</button>') +
      '<a href="buyucu-kulesi.html?hedef_id=' + p.hedef.player_id + '&hedef_kral=' + encodeURIComponent(p.hedef.kral) + '&kategori=dusmana" style="padding:4px 10px;background:#5a3a8a;color:#fff;border-radius:3px;font-size:11px;text-decoration:none">🔮 Büyü At</a>' +
      (canIptal ? '<button class="btn-action" onclick="savasPlanIptal(' + p.id + ')" style="padding:4px 10px;font-size:11px;background:#333;color:#aaa;width:auto">✕ İptal</button>' : '') +
    '</div>' +
  '</div>';
}

function savasPlanAcOlusturModal(rakipGuildId) {
  var savas = (SAVAS_ODASI_DATA && SAVAS_ODASI_DATA.savaslar) ? SAVAS_ODASI_DATA.savaslar[SAVAS_ODASI_AKTIF_SAVAS_IDX] : null;
  if (!savas) return;
  var modal = document.createElement('div');
  modal.id = 'savas-plan-olustur-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999';

  var hedefOpts = savas.dusman_uyeler.map(u =>
    '<option value="' + u.player_id + '">' + escHtml(u.kral) + ' (' + u.koord_x + ':' + u.koord_y + ')</option>'
  ).join('');

  modal.innerHTML =
    '<div class="card" style="max-width:420px;width:90%;padding:20px;background:#0f0805;border:1px solid #5a3020">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<h3 style="color:#c8a96e;font-family:Cinzel,serif;margin:0">🎯 Yeni Sync Plan</h3>' +
        '<button onclick="document.getElementById(\'savas-plan-olustur-modal\').remove()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer">×</button>' +
      '</div>' +
      '<div style="display:grid;gap:10px">' +
        '<label style="color:#aaa;font-size:11px">Hedef düşman oyuncu:' +
          '<select id="splan-hedef" style="width:100%;margin-top:4px;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px">' + hedefOpts + '</select>' +
        '</label>' +
        '<label style="color:#aaa;font-size:11px">Varış zamanı (tarih + saat):' +
          '<input type="datetime-local" id="splan-varis" style="width:100%;margin-top:4px;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px">' +
        '</label>' +
        '<label style="color:#aaa;font-size:11px">Not (opsiyonel):' +
          '<textarea id="splan-not" maxlength="200" style="width:100%;margin-top:4px;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px;resize:vertical;min-height:50px"></textarea>' +
        '</label>' +
        '<button class="btn-action" onclick="savasPlanOlusturSubmit()" style="padding:10px;background:#8B0000;color:#fff;font-weight:bold">🎯 Plan Oluştur + Üyelere Bildir</button>' +
      '</div>' +
      '<div style="color:#666;font-size:10px;margin-top:10px">Plan oluşunca tüm üyeler görür ve "katıl" butonuyla ordusunu uygun zamana planlar.</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

  // Varsayilan: 3 saat sonra (yuvarla)
  var def = new Date(Date.now() + 3*3600000);
  def.setMinutes(0,0,0);
  var defStr = def.getFullYear() + '-' + String(def.getMonth()+1).padStart(2,'0') + '-' + String(def.getDate()).padStart(2,'0') + 'T' + String(def.getHours()).padStart(2,'0') + ':00';
  document.getElementById('splan-varis').value = defStr;
}

async function savasPlanOlusturSubmit() {
  var hedef = document.getElementById('splan-hedef').value;
  var varisLocal = document.getElementById('splan-varis').value;
  var not = document.getElementById('splan-not').value;
  if (!hedef || !varisLocal) { alert('Hedef ve varış zamanı zorunlu'); return; }
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/guild/savas-plan', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hedef_player_id: parseInt(hedef), varis_zamani: new Date(varisLocal).toISOString(), not_metin: not })
    });
    var d = await r.json();
    if (!d.ok) { alert('Hata: ' + (d.error || '?')); return; }
    document.getElementById('savas-plan-olustur-modal').remove();
    alert('🎯 Plan oluşturuldu');
    var savas = (SAVAS_ODASI_DATA && SAVAS_ODASI_DATA.savaslar) ? SAVAS_ODASI_DATA.savaslar[SAVAS_ODASI_AKTIF_SAVAS_IDX] : null;
    if (savas) loadSavasPlanlari(savas.rakip_guild.id);
  } catch(e) { alert('Sunucu hatasi: ' + e.message); }
}

async function savasPlanKatilModal(planId) {
  // Ordu sec
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/army', { headers: { Authorization: 'Bearer ' + token } });
    var d = await r.json();
    var ordular = (d.armies || d || []).filter(a => !a.is_busy);
    if (!ordular.length) { alert('Müsait ordu yok'); return; }

    var modal = document.createElement('div');
    modal.id = 'savas-plan-katil-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999';
    var opts = ordular.map(a =>
      '<option value="' + a.id + '">' + escHtml(a.isim || 'Ordu #'+a.id) + ' — ' + (a.toplam_unite||0) + ' ünite</option>'
    ).join('');
    modal.innerHTML =
      '<div class="card" style="max-width:360px;width:90%;padding:20px;background:#0f0805;border:1px solid #5a3020">' +
        '<h3 style="color:#c8a96e;font-family:Cinzel,serif;margin:0 0 12px">⚔️ Plana Katıl</h3>' +
        '<label style="color:#aaa;font-size:11px">Gönderecek ordu:' +
          '<select id="splan-katil-ordu" style="width:100%;margin-top:4px;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px">' + opts + '</select>' +
        '</label>' +
        '<div style="display:flex;gap:6px;margin-top:14px">' +
          '<button class="btn-action" onclick="savasPlanKatilSubmit(' + planId + ')" style="flex:1;padding:10px;background:#8B0000;color:#fff">✓ Katıl</button>' +
          '<button class="btn-action" onclick="document.getElementById(\'savas-plan-katil-modal\').remove()" style="padding:10px;background:#333;color:#aaa">İptal</button>' +
        '</div>' +
        '<div style="color:#666;font-size:10px;margin-top:10px">Ordunuz varış zamanına göre hesaplanmış kalkış zamanında otomatik yola çıkacak.</div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  } catch(e) { alert('Ordu listesi alinamadi'); }
}

async function savasPlanKatilSubmit(planId) {
  var armyId = document.getElementById('splan-katil-ordu').value;
  if (!armyId) return;
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/guild/savas-plan/' + planId + '/katil', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ army_id: parseInt(armyId) })
    });
    var d = await r.json();
    if (!d.ok) { alert('Hata: ' + (d.error || '?')); return; }
    document.getElementById('savas-plan-katil-modal').remove();
    alert('✓ Katıldın! Kalkış: ' + d.dakika_kala + ' dk sonra');
    var savas = (SAVAS_ODASI_DATA && SAVAS_ODASI_DATA.savaslar) ? SAVAS_ODASI_DATA.savaslar[SAVAS_ODASI_AKTIF_SAVAS_IDX] : null;
    if (savas) loadSavasPlanlari(savas.rakip_guild.id);
  } catch(e) { alert('Sunucu hatasi: ' + e.message); }
}

async function savasPlanIptal(planId) {
  if (!confirm('Plani iptal et?')) return;
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/guild/savas-plan/' + planId + '/iptal', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    var d = await r.json();
    if (!d.ok) { alert('Hata: ' + (d.error || '?')); return; }
    var savas = (SAVAS_ODASI_DATA && SAVAS_ODASI_DATA.savaslar) ? SAVAS_ODASI_DATA.savaslar[SAVAS_ODASI_AKTIF_SAVAS_IDX] : null;
    if (savas) loadSavasPlanlari(savas.rakip_guild.id);
  } catch(e) { alert('Sunucu hatasi: ' + e.message); }
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
