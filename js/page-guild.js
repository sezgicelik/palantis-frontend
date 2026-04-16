/* ═══════════════════════════════════════════════════════
   NOXARA — GUILD SAYFASI
   js/page-guild.js — v1.10 (Tab yapisi + Yetki + Isci + Ambar)
═══════════════════════════════════════════════════════ */
var GUILD_DATA = null;
var GUILD_CONFIG = null;
var GUILD_AKTIF_TAB = 'genel';

var KAYNAK_IKON = {altin:'💰',odun:'🌳',metal:'⛏️',bugday:'🌾',balik:'🐟',kereste:'🪵',islenmis:'🔩'};
var ISCI_IKON = {oduncu:'🪓',madenci:'⛏️',ciftci:'🌾',balikci:'🐟',tuccar:'💼'};

function guildHdr() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}
function fmt(n) { return (n||0).toLocaleString('tr-TR'); }

async function loadGuild() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('guild-content');
  try {
    var resp = await fetch(API_BASE + '/api/guild/benim', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c;padding:20px">' + (data.error || 'Hata') + '</div>'; return; }
    GUILD_DATA = data;

    // Config yukle (1 kere)
    if (!GUILD_CONFIG) {
      try {
        var cfgResp = await fetch(API_BASE + '/api/guild/config', { headers: { 'Authorization': 'Bearer ' + token } });
        if (cfgResp.ok) GUILD_CONFIG = await cfgResp.json();
      } catch(e) {}
    }

    if (!data.guild) {
      renderGuildYok(el);
    } else {
      renderGuildTabs(el, data);
    }
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c;padding:20px">Baglanti hatasi</div>';
  }
}

// ═══════════════════════════════════
//   GUILD YOK — Kur / Katil
// ═══════════════════════════════════
function renderGuildYok(el) {
  el.innerHTML =
    '<div style="text-align:center;padding:40px">' +
      '<div style="font-size:40px;margin-bottom:12px">🏰</div>' +
      '<h2 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:8px">Guild</h2>' +
      '<p style="font-size:11px;color:#888;margin-bottom:20px">Bir guilde uye degilsiniz. Guild kurun veya mevcut bir guilde katillin.</p>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn-action" style="width:auto;padding:8px 20px" onclick="guildKurModal()">🏰 Guild Kur (50K Altin)</button>' +
        '<button class="btn-action" style="width:auto;padding:8px 20px;background:#333;color:#ccc" onclick="guildListele()">📋 Guild Listesi</button>' +
      '</div>' +
      '<div id="guild-liste-wrap" style="margin-top:20px"></div>' +
      '<div id="guild-kur-modal" style="display:none;margin-top:20px;text-align:left">' +
        '<div class="card">' +
          '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:8px">Guild Kur</h3>' +
          '<div style="margin-bottom:6px"><label style="font-size:10px;color:#888">Guild Ismi</label><input id="guild-isim" maxlength="30" style="width:100%;padding:6px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:12px"></div>' +
          '<div style="margin-bottom:8px"><label style="font-size:10px;color:#888">Tag (2-5 harf)</label><input id="guild-tag" maxlength="5" style="width:80px;padding:6px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:12px;text-transform:uppercase"></div>' +
          '<button class="btn-action" style="width:auto;padding:6px 16px" onclick="guildKur()">Kur</button>' +
          '<div id="guild-kur-msg" style="font-size:11px;margin-top:6px;min-height:16px"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function guildKurModal() {
  var m = document.getElementById('guild-kur-modal');
  if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

async function guildKur() {
  var token = getToken(); if (!token) return;
  var isim = document.getElementById('guild-isim')?.value?.trim();
  var tag = document.getElementById('guild-tag')?.value?.trim();
  var msg = document.getElementById('guild-kur-msg');
  if (!isim || !tag) { if (msg) msg.innerHTML = '<span style="color:#e74c3c">Isim ve tag girin</span>'; return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/kur', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ isim: isim, tag: tag })
    });
    var data = await resp.json();
    if (resp.ok && data.basarili) { if (typeof toast === 'function') toast(data.mesaj); loadGuild(); }
    else { if (msg) msg.innerHTML = '<span style="color:#e74c3c">' + (data.error || 'Hata') + '</span>'; }
  } catch(e) { if (msg) msg.innerHTML = '<span style="color:#e74c3c">Baglanti hatasi</span>'; }
}

async function guildListele() {
  var token = getToken(); if (!token) return;
  var wrap = document.getElementById('guild-liste-wrap');
  if (!wrap) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/liste/tumu', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { wrap.innerHTML = '<p style="color:#888;font-size:11px">Henuz guild yok.</p>'; return; }
    wrap.innerHTML = '<div style="font-size:10px;color:#888;margin-bottom:6px">Aktif Guildler:</div>' +
      data.map(function(g) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#111;border:1px solid #222;border-radius:6px;margin-bottom:4px">' +
          '<div><span style="color:var(--race-color);font-weight:bold;font-size:12px">[' + g.tag + ']</span> <span style="font-size:11px">' + g.isim + '</span> <span style="font-size:9px;color:#888">(' + g.uye_sayisi + ' uye)</span></div>' +
          '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px" onclick="guildKatil(' + g.id + ')">Katil</button>' +
        '</div>';
      }).join('');
  } catch(e) { wrap.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

async function guildKatil(guildId) {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/katil', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (resp.ok) { if (typeof toast === 'function') toast(data.mesaj); loadGuild(); }
    else { alert(data.error || 'Hata'); }
  } catch(e) { alert('Baglanti hatasi'); }
}

// ═══════════════════════════════════
//   TAB YAPISI
// ═══════════════════════════════════
var GUILD_TABS = [
  { id: 'genel',    label: '🏰 Genel',       aktif: true },
  { id: 'uyeler',   label: '👥 Uyeler',       aktif: true },
  { id: 'kasa',     label: '💰 Kasa',         aktif: true },
  { id: 'isciler',  label: '⚒️ Isciler',     aktif: true },
  { id: 'binalar',  label: '🏗️ Binalar',     aktif: true },
  { id: 'ordu',     label: '🛡️ Ordu',        aktif: true },
  { id: 'market',   label: '🏪 Market',       aktif: true },
  { id: 'dagitim',  label: '📦 Dagitim',     aktif: true },
  { id: 'mezarlik', label: '⚰️ Mezarlik',    aktif: true },
  { id: 'savas',    label: '⚔️ Savas Odasi', aktif: false },
  { id: 'raporlar', label: '📜 Raporlar',     aktif: true }
];

function renderGuildTabs(el, data) {
  var tabBar = '<div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:12px;border-bottom:1px solid #222;padding-bottom:8px">' +
    GUILD_TABS.map(function(t) {
      var cls = t.id === GUILD_AKTIF_TAB ? 'background:var(--race-color);color:#000' : 'background:#1a1a1a;color:#888';
      var opacity = t.aktif ? '1' : '0.4';
      return '<button onclick="guildTabDegistir(\'' + t.id + '\')" style="padding:6px 12px;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;' + cls + ';opacity:' + opacity + '">' + t.label + '</button>';
    }).join('') +
  '</div>';

  el.innerHTML = tabBar + '<div id="guild-tab-content"></div>';
  guildTabIcerikGoster(data);
}

function guildTabDegistir(tabId) {
  var tab = GUILD_TABS.find(function(t) { return t.id === tabId; });
  if (!tab || !tab.aktif) { toast('Bu ozellik yakinda aktif olacak'); return; }
  GUILD_AKTIF_TAB = tabId;
  // Tab bar renklerini guncelle
  var el = document.getElementById('guild-content');
  if (el && GUILD_DATA) renderGuildTabs(el, GUILD_DATA);
}

function guildTabIcerikGoster(data) {
  var el = document.getElementById('guild-tab-content');
  if (!el) return;
  switch(GUILD_AKTIF_TAB) {
    case 'genel':   renderTabGenel(el, data); break;
    case 'uyeler':  renderTabUyeler(el, data); break;
    case 'kasa':    renderTabKasa(el, data); break;
    case 'isciler': renderTabIsciler(el, data); break;
    case 'binalar':  renderTabBinalar(el, data); break;
    case 'ordu':     renderTabOrdu(el, data); break;
    case 'market':   renderTabMarket(el, data); break;
    case 'dagitim':  renderTabDagitim(el, data); break;
    case 'mezarlik': renderTabMezarlik(el, data); break;
    case 'raporlar': renderTabRaporlar(el, data); break;
    default:        el.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:#555"><div style="font-size:30px;margin-bottom:8px">🔒</div><p style="font-size:12px">Bu ozellik Faz 3\'te aktif olacak.</p></div>';
  }
}

// ═══════════════════════════════════
//   TAB: GENEL
// ═══════════════════════════════════
function renderTabGenel(el, data) {
  var g = data.guild;
  var rutbe = data.benim_rutbem;
  var isLider = rutbe === 'lider';
  var sehir = data.guild_sehir;

  el.innerHTML =
    '<div class="card" style="border-left-color:var(--race-color)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<div><span style="font-family:Cinzel,serif;font-size:16px;color:var(--race-color);font-weight:bold">[' + g.tag + '] ' + g.isim + '</span> <span style="font-size:10px;color:#888">Sv.' + g.seviye + ' | ' + data.uye_sayisi + ' uye</span></div>' +
        (!isLider ? '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px;background:#333;color:#e74c3c" onclick="guildAyril(' + g.id + ')">Ayril</button>' : '') +
      '</div>' +
      (g.duyuru ? '<div style="background:#0a0a0a;border-left:2px solid var(--race-color);padding:6px 10px;font-size:10px;color:#ccc;margin-bottom:8px;border-radius:4px">📢 ' + g.duyuru + '</div>' : '') +
      (isLider ? '<div style="margin-bottom:8px"><textarea id="guild-duyuru-inp" rows="2" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px" placeholder="Duyuru yaz...">' + (g.duyuru||'') + '</textarea><button class="btn-action" style="width:auto;padding:3px 10px;font-size:9px;margin-top:2px" onclick="guildDuyuruKaydet(' + g.id + ')">Kaydet</button></div>' : '') +
    '</div>' +

    // v1.13: Guild nufus + isci ozet + nufus siniri + tuccar
    (function() {
      var n = data.guild_nufus || {};
      var w = data.guild_isciler || {};
      var wsToplam = (n.worshipper||0) + (n.worshipper_beyaz||0) + (n.worshipper_kirmizi||0) + (n.worshipper_mavi||0) + (n.worshipper_yesil||0);
      var mevcutNufus = data.mevcut_nufus != null ? data.mevcut_nufus :
        ((n.koylu||0) + (n.asker||0) + wsToplam + (w.oduncu||0) + (w.madenci||0) + (w.ciftci||0) + (w.balikci||0) + (w.tuccar||0));
      var nufusSiniri = data.nufus_siniri || 100;
      var doluYuzde = Math.min(100, Math.round(mevcutNufus / nufusSiniri * 100));
      var doluRenk = doluYuzde >= 95 ? '#e74c3c' : (doluYuzde >= 80 ? '#f39c12' : '#2ecc71');
      return '<div class="card">' +
        '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">👥 Nufus & Isciler</div>' +
        '<div style="margin-bottom:6px;font-size:10px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="color:#888">Nufus</span><span style="color:' + doluRenk + ';font-weight:bold">' + fmt(mevcutNufus) + ' / ' + fmt(nufusSiniri) + '</span></div>' +
          '<div style="height:4px;background:#0a0a0a;border-radius:2px;overflow:hidden"><div style="width:' + doluYuzde + '%;height:100%;background:' + doluRenk + '"></div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:10px;margin-bottom:6px">' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">Koylu</div><div style="color:#d4af37;font-weight:bold">' + fmt(n.koylu||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">Asker</div><div style="color:#e74c3c;font-weight:bold">' + fmt(n.asker||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">WS</div><div style="color:#9b59b6;font-weight:bold">' + fmt(wsToplam) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:#777">' +
          (w.oduncu ? '<span>🪓 Oduncu: ' + w.oduncu + '</span>' : '') +
          (w.madenci ? '<span>⛏️ Madenci: ' + w.madenci + '</span>' : '') +
          (w.ciftci ? '<span>🌾 Ciftci: ' + w.ciftci + '</span>' : '') +
          (w.balikci ? '<span>🎣 Balikci: ' + w.balikci + '</span>' : '') +
          (w.tuccar ? '<span>💼 Tuccar: ' + w.tuccar + '</span>' : '') +
        '</div>' +
      '</div>';
    })() +

    // v1.13: Ordu durumu + morali
    (function() {
      var morali = data.ordu_morali != null ? data.ordu_morali : 100;
      var moralRenk = morali >= 70 ? '#2ecc71' : (morali >= 40 ? '#f39c12' : '#e74c3c');
      return '<div class="card">' +
        '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🎖 Ordu Morali</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px"><span style="color:#888">Moral</span><span style="color:' + moralRenk + ';font-weight:bold">' + morali + ' / 100</span></div>' +
        '<div style="height:6px;background:#0a0a0a;border-radius:3px;overflow:hidden"><div style="width:' + morali + '%;height:100%;background:' + moralRenk + '"></div></div>' +
        '<div style="font-size:9px;color:#555;margin-top:4px">Maas odenirse +5 (max 100), odenemezse -10</div>' +
      '</div>';
    })() +

    // v1.13: Mana ozeti (tapinak worshipperlari uretir)
    (function() {
      var kasa = data.kasa || {};
      var mb = parseFloat(kasa.mana_beyaz)||0, mk = parseFloat(kasa.mana_kirmizi)||0, mm = parseFloat(kasa.mana_mavi)||0, my = parseFloat(kasa.mana_yesil)||0;
      if (mb + mk + mm + my <= 0) return '';
      return '<div class="card">' +
        '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🔮 Mana</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:10px">' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:9px">Beyaz</div><div style="color:#ecf0f1;font-weight:bold">' + mb.toFixed(1) + '</div></div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:9px">Kirmizi</div><div style="color:#e74c3c;font-weight:bold">' + mk.toFixed(1) + '</div></div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:9px">Mavi</div><div style="color:#3498db;font-weight:bold">' + mm.toFixed(1) + '</div></div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:9px">Yesil</div><div style="color:#2ecc71;font-weight:bold">' + my.toFixed(1) + '</div></div>' +
        '</div>' +
      '</div>';
    })() +

    // Guild sehir bilgisi + tasima
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🏰 Guild Sehri</div>' +
      (sehir ?
        '<div style="font-size:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px">' +
          '<div>Konum: <span style="color:#d4af37">' + sehir.x + ':' + sehir.y + '</span></div>' +
          '<div>Alan: <span style="color:#d4af37">' + fmt(sehir.alan) + '</span></div>' +
        '</div>' +
        (isLider ? (function() {
          var maxT = (GUILD_CONFIG && GUILD_CONFIG.max_tasima_hakki) || 5;
          var kullanilan = sehir.tasima_sayaci || 0;
          var kalan = Math.max(0, maxT - kullanilan);
          return '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #222">' +
            '<div style="font-size:10px;color:#888;margin-bottom:6px">Sehir Tasi <span style="color:' + (kalan > 0 ? '#2ecc71' : '#e74c3c') + '">(' + kalan + '/' + maxT + ' hak kaldi)</span></div>' +
            (kalan > 0 ?
              '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
                '<span style="font-size:10px;color:#888">X:</span>' +
                '<input id="guild-tasi-x" type="number" min="1" max="200" placeholder="' + sehir.x + '" style="width:55px;padding:3px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px">' +
                '<span style="font-size:10px;color:#888">Y:</span>' +
                '<input id="guild-tasi-y" type="number" min="1" max="50" placeholder="' + sehir.y + '" style="width:55px;padding:3px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px">' +
                '<button class="btn-action" style="width:auto;padding:3px 12px;font-size:9px" onclick="guildSehirTasi(' + g.id + ')">Tasi</button>' +
              '</div>' +
              '<div id="guild-tasi-msg" style="font-size:10px;margin-top:4px;min-height:14px"></div>'
            : '<div style="font-size:10px;color:#e74c3c">Tasima hakkiniz kalmadi.</div>') +
          '</div>';
        })() : '') :
        '<div style="font-size:10px;color:#555">Sehir bilgisi yok</div>') +
    '</div>' +

    // Guild VS (ATK/DEF) ozet
    (function() {
      var vs = data.guild_vs || {};
      return '<div class="card">' +
        '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚔️ Savas Gucu</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:10px">' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">Ordular</div><div style="color:#d4af37;font-weight:bold">' + (vs.ordu_sayisi||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">Uniteler</div><div style="color:#2ecc71;font-weight:bold">' + fmt(vs.toplam_unite||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">ATK</div><div style="color:#e74c3c;font-weight:bold">' + fmt(Math.floor(vs.toplam_atk||0)) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:9px">DEF</div><div style="color:#3498db;font-weight:bold">' + fmt(Math.floor(vs.toplam_def||0)) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    })() +

    // Guild binalar ozet
    (function() {
      var binalar = data.guild_binalar_ozet || [];
      if (binalar.length === 0) return '';
      var BINA_IKON = {oduncu:'🪓',kereste_atolyesi:'🪚',tarla:'🌾',balikci:'🎣',isleme:'🔩',ocak:'🔥',firin:'🍞',surlar:'🏰',ev:'🏠',koy:'🏘️',kasaba:'🏙️',ciftlik:'🐄',ahir:'🐴',lonca:'🎯',buyulu_tarla:'🥚',rathe_tapinagi:'⚔️',xegony_tapinagi:'💫',fennin_tapinagi:'🔥',tunare_tapinagi:'🌿'};
      var binaAlan = function(id){ return id==='koy'?5:(id==='kasaba'?25:(id==='firin'?5:1)); };
      var toplamAlan = (data.guild_alan && data.guild_alan.toplam) || 5000;
      var kullanilanAlan = (data.guild_alan && data.guild_alan.kullanilan) || 0;
      return '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<span style="font-size:11px;color:var(--race-color);font-weight:bold">🏗 Binalar</span>' +
          '<span style="font-size:10px;color:#888">Alan: <span style="color:#d4af37;font-weight:bold">' + fmt(kullanilanAlan) + ' / ' + fmt(toplamAlan) + '</span></span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
        binalar.map(function(b) {
          var adet = b.adet != null ? b.adet : b.seviye;
          return '<span style="font-size:10px;background:#0a0a0a;padding:3px 8px;border-radius:4px">' + (BINA_IKON[b.bina_id]||'🏗️') + ' ' + b.bina_id + ' <span style="color:#d4af37">×' + adet + '</span></span>';
        }).join('') +
        '</div></div>';
    })() +

    // Diplomasi
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚔️ Diplomasi</div>' +
      (data.diplomasi.length === 0 ? '<div style="font-size:10px;color:#555">Aktif antlasma yok</div>' :
        data.diplomasi.map(function(d) {
          var karsi = d.guild1_id === g.id ? d.guild2_adi : d.guild1_adi;
          var karsiTag = d.guild1_id === g.id ? d.guild2_tag : d.guild1_tag;
          var tipIcon = d.tip === 'savas' ? '⚔️' : '🤝';
          return '<div style="font-size:10px;padding:3px 0">' + tipIcon + ' [' + karsiTag + '] ' + karsi + ' — ' + d.tip + '</div>';
        }).join('')) +
    '</div>' +

    // Takviye paneli
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🛡️ Takviye Ordulari</div>' +
      '<div id="guild-takviye-panel" style="font-size:10px;color:#555">Yukleniyor...</div>' +
    '</div>';

  guildTakviyeDurumYukle();
}

// ═══════════════════════════════════
//   TAB: UYELER
// ═══════════════════════════════════
function renderTabUyeler(el, data) {
  var g = data.guild;
  var uyeler = data.uyeler || [];
  var isLider = data.benim_rutbem === 'lider';
  var myYetkiler = data.benim_yetkilerim || {};

  var uyeHTML = uyeler.map(function(u) {
    var rutbeIcon = u.rutbe === 'lider' ? '👑' : u.rutbe === 'yardimci' ? '⭐' : '🏅';
    var aksiyonlar = '';

    // Takviye
    if (u.player_id !== data.benim_player_id) {
      aksiyonlar += '<button style="background:none;border:1px solid #9b59b6;color:#9b59b6;cursor:pointer;font-size:9px;border-radius:3px;padding:1px 6px" onclick="guildTakviyeGonder(' + u.player_id + ',\'' + (u.kullanici_adi||'').replace(/'/g,'') + '\')">🛡️</button>';
    }

    // Lider islemleri
    if (isLider && u.player_id !== g.lider_id) {
      aksiyonlar += '<button style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:9px" onclick="guildAt(' + g.id + ',' + u.player_id + ')">At</button>' +
        '<select style="background:#111;border:1px solid #333;color:#ddd;font-size:9px;border-radius:3px;padding:1px" onchange="guildRutbe(' + g.id + ',' + u.player_id + ',this.value)">' +
          '<option value="uye"' + (u.rutbe==='uye'?' selected':'') + '>Uye</option>' +
          '<option value="yardimci"' + (u.rutbe==='yardimci'?' selected':'') + '>Yardimci</option>' +
        '</select>';
    }

    // Sehir degeri / ATK-DEF goster (yetki varsa)
    var extraInfo = '';
    if (myYetkiler.sehir_degeri_gor && u.sehir_degeri !== undefined) {
      extraInfo += ' SD:' + fmt(u.sehir_degeri);
    }

    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1a1a1a;font-size:11px">' +
      '<span>' + rutbeIcon + ' ' + u.kullanici_adi + ' <span style="color:#555;font-size:9px">Cag ' + (u.cag||1) + extraInfo + '</span></span>' +
      '<div style="display:flex;gap:4px;align-items:center">' + aksiyonlar + '</div>' +
    '</div>';
  }).join('');

  // Yetki yonetimi (sadece lider veya yetki_duzenle yetkisi)
  var yetkiHTML = '';
  if (myYetkiler.yetki_duzenle) {
    yetkiHTML = '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🔑 Yetki Yonetimi</div>' +
      '<p style="font-size:9px;color:#555;margin-bottom:8px">Uye ismine tiklayarak yetkilerini duzenleyebilirsiniz</p>' +
      '<div id="guild-yetki-panel">Yukleniyor...</div>' +
    '</div>';
  }

  el.innerHTML =
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">👥 Uyeler (' + uyeler.length + ')</div>' +
      uyeHTML +
    '</div>' +
    yetkiHTML;

  if (myYetkiler.yetki_duzenle) guildYetkilerYukle(g.id);
}

async function guildYetkilerYukle(guildId) {
  var el = document.getElementById('guild-yetki-panel');
  if (!el) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/yetkiler', { headers: { 'Authorization': 'Bearer ' + getToken() } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<span style="color:#e74c3c">Yuklenemedi</span>'; return; }

    var YETKI_LABEL = {
      oyuncu_kabul:'Oyuncu Kabul', oyuncu_at:'Oyuncu At', yetki_duzenle:'Yetki Duzenle',
      ambar_gor:'Ambar Gor', sehir_degeri_gor:'Sehir Degeri Gor', atk_def_gor:'ATK/DEF Gor',
      ambar_istek_onayla:'Istek Onayla', guild_ordusu_gonder:'Ordu Gonder', guild_ordusu_kur:'Ordu Kur',
      guild_unite_uret:'Unite Uret', isci_ata:'Isci Ata', market_satis:'Market Satis',
      koylu_bagisi:'Koylu Bagisi', vergi_dagit:'Vergi Dagit', market_otosatis:'Oto Satis',
      guild_bina_yap:'Bina Yap'
    };

    var html = '<div style="overflow-x:auto"><table style="width:100%;font-size:9px;border-collapse:collapse">' +
      '<thead><tr style="color:#888;border-bottom:1px solid #333"><th style="text-align:left;padding:4px">Uye</th><th style="text-align:left;padding:4px">Rutbe</th>';
    Object.keys(YETKI_LABEL).forEach(function(k) {
      html += '<th style="padding:4px;text-align:center;white-space:nowrap" title="' + YETKI_LABEL[k] + '">' + YETKI_LABEL[k].substring(0,6) + '</th>';
    });
    html += '</tr></thead><tbody>';

    (data.uyeler || []).forEach(function(u) {
      var isLdr = u.rutbe === 'lider';
      html += '<tr style="border-bottom:1px solid #1a1a1a"><td style="padding:4px;color:#ccc">' + u.kullanici_adi + '</td><td style="padding:4px;color:#888">' + u.rutbe + '</td>';
      Object.keys(YETKI_LABEL).forEach(function(k) {
        var checked = u.yetkiler[k] ? 'checked' : '';
        var disabled = isLdr ? 'disabled' : '';
        html += '<td style="text-align:center;padding:2px"><input type="checkbox" ' + checked + ' ' + disabled +
          ' onchange="guildYetkiDegistir(' + guildId + ',' + u.player_id + ',\'' + k + '\',this.checked)" style="cursor:pointer"></td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

async function guildYetkiDegistir(guildId, playerId, yetki, deger) {
  try {
    // Oncelikle mevcut yetkileri al, sonra guncelle
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/yetkiler', { headers: { 'Authorization': 'Bearer ' + getToken() } });
    var data = await resp.json();
    var uye = (data.uyeler || []).find(function(u) { return u.player_id === playerId; });
    if (!uye) return;
    var yetkiler = Object.assign({}, uye.yetkiler);
    yetkiler[yetki] = deger;

    await fetch(API_BASE + '/api/guild/' + guildId + '/yetkiler/' + playerId, {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ yetkiler: yetkiler })
    });
    toast('Yetki guncellendi');
  } catch(e) { alert('Hata'); }
}

// ═══════════════════════════════════
//   TAB: KASA / AMBAR
// ═══════════════════════════════════
function renderTabKasa(el, data) {
  var g = data.guild;
  var kasa = data.kasa || {};
  var myYetkiler = data.benim_yetkilerim || {};

  // Kasa kaynaklari
  var kasaHTML = ['altin','odun','metal','bugday','balik','kereste','islenmis'].map(function(k) {
    return '<div style="display:flex;align-items:center;gap:4px;font-size:10px"><span>' + (KAYNAK_IKON[k]||'') + '</span><span style="color:#d4af37;font-weight:bold">' + fmt(kasa[k]) + '</span><span style="color:#666">' + k + '</span></div>';
  }).join('');

  // Bagis butonlari (config'e gore dinamik)
  var izinliKaynaklar = (GUILD_CONFIG && GUILD_CONFIG.izinli_kaynaklar) || ['altin','odun','metal'];
  var bagisHTML = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">' +
    izinliKaynaklar.map(function(k) {
      return '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="guildBagis(' + g.id + ',\'' + k + '\')">' + (KAYNAK_IKON[k]||'📦') + ' ' + k + '</button>';
    }).join('') +
  '</div>';
  var limitInfo = '<div style="font-size:9px;color:#555;margin-top:4px">Max: kaynaklarinizin %' + ((GUILD_CONFIG && GUILD_CONFIG.bagis_yuzde_limit) || 20) + '\'i | ' +
    ((GUILD_CONFIG && GUILD_CONFIG.hammadde_bagis_24pg) || 3) + ' bagis/24PG</div>';

  // Koylu bagisi
  var koyluBagisHTML = '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #222">' +
    '<div style="font-size:10px;color:#aaa;margin-bottom:4px">👨‍🌾 Koylu Bagisi</div>' +
    '<div style="display:flex;gap:4px;align-items:center">' +
      '<input id="koylu-bagis-adet" type="number" min="1" placeholder="Adet" style="width:80px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
      '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="guildKoyluBagis(' + g.id + ')">Gonder</button>' +
      '<span style="font-size:9px;color:#555">Max ' + ((GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_limit) || 100) + ' ' + ((GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_tip) || 'adet') + ' | ' + ((GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_24pg) || 2) + '/24PG</span>' +
    '</div>' +
  '</div>';

  // Ambar istek
  var ambarIstekHTML = '';
  if (myYetkiler.ambar_gor) {
    ambarIstekHTML = '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">📋 Ambar Istekleri</div>' +
      '<div style="display:flex;gap:4px;align-items:center;margin-bottom:8px">' +
        '<select id="ambar-istek-kaynak" style="padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px">' +
          ['altin','odun','metal','bugday','balik','kereste','islenmis'].map(function(k) {
            return '<option value="' + k + '">' + (KAYNAK_IKON[k]||'') + ' ' + k + '</option>';
          }).join('') +
        '</select>' +
        '<input id="ambar-istek-miktar" type="number" min="1" placeholder="Miktar" style="width:80px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
        '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="guildAmbarIstek(' + g.id + ')">Talep Et</button>' +
      '</div>' +
      '<div id="ambar-istek-liste">Yukleniyor...</div>' +
    '</div>';
  }

  el.innerHTML =
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">💰 Guild Kasasi</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' + kasaHTML + '</div>' +
      bagisHTML + limitInfo + koyluBagisHTML +
    '</div>' +
    ambarIstekHTML;

  if (myYetkiler.ambar_gor) guildAmbarIsteklerYukle(g.id);
}

async function guildAmbarIsteklerYukle(guildId) {
  var el = document.getElementById('ambar-istek-liste');
  if (!el) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/ambar-istekler', { headers: { 'Authorization': 'Bearer ' + getToken() } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<span style="color:#e74c3c">Yuklenemedi</span>'; return; }

    var istekler = data.istekler || [];
    if (istekler.length === 0) { el.innerHTML = '<span style="font-size:10px;color:#555">Bekleyen istek yok</span>'; return; }

    var myYetkiler = GUILD_DATA?.benim_yetkilerim || {};

    el.innerHTML = istekler.map(function(i) {
      var durumRenk = i.durum === 'bekliyor' ? '#f39c12' : i.durum === 'onaylandi' ? '#2ecc71' : '#e74c3c';
      var butonlar = '';
      if (i.durum === 'bekliyor' && myYetkiler.ambar_istek_onayla) {
        butonlar = '<button style="background:#2ecc71;color:#000;border:none;padding:2px 8px;border-radius:3px;font-size:9px;cursor:pointer" onclick="guildAmbarIstekOnayla(' + guildId + ',' + i.id + ',\'onayla\')">Onayla</button>' +
                   '<button style="background:#e74c3c;color:#fff;border:none;padding:2px 8px;border-radius:3px;font-size:9px;cursor:pointer" onclick="guildAmbarIstekOnayla(' + guildId + ',' + i.id + ',\'reddet\')">Reddet</button>';
      }
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1a1a1a;font-size:10px">' +
        '<span>' + i.kullanici_adi + ': ' + (KAYNAK_IKON[i.kaynak]||'') + ' ' + fmt(i.miktar) + ' ' + i.kaynak + '</span>' +
        '<div style="display:flex;gap:4px;align-items:center"><span style="color:' + durumRenk + '">' + i.durum + '</span>' + butonlar + '</div>' +
      '</div>';
    }).join('');
  } catch(e) { el.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

// ═══════════════════════════════════
//   TAB: ISCILER
// ═══════════════════════════════════
function renderTabIsciler(el, data) {
  var g = data.guild;
  var nufus = data.guild_nufus || { koylu:0, asker:0, worshipper:0 };
  var isciler = data.guild_isciler || { oduncu:0, madenci:0, ciftci:0, balikci:0, tuccar:0 };
  var myYetkiler = data.benim_yetkilerim || {};
  var toplam_isci = (isciler.oduncu||0) + (isciler.madenci||0) + (isciler.ciftci||0) + (isciler.balikci||0) + (isciler.tuccar||0);

  // v1.13: Bina kapasite hesabi (oyuncu ile ayni)
  var binaAdet = {};
  (data.guild_binalar_ozet || []).forEach(function(b){ binaAdet[b.bina_id] = b.adet != null ? b.adet : b.seviye; });
  var kapasite = {
    oduncu:  (binaAdet.oduncu||0) * 40,
    ciftci:  (binaAdet.tarla||0) * 50,
    balikci: (binaAdet.balikci||0) * 20,
    madenci: 999999,
    tuccar:  999999
  };

  var nufusHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:12px">' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">👨‍🌾</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.koylu) + '</div><div style="font-size:9px;color:#888">Koylu</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">⚒️</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(toplam_isci) + '</div><div style="font-size:9px;color:#888">Isci</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">⚔️</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.asker) + '</div><div style="font-size:9px;color:#888">Asker</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">🙏</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.worshipper) + '</div><div style="font-size:9px;color:#888">Worshipper</div></div>' +
    '</div>';

  // v1.13: Isci dagilimi (5 tip + kapasite gostergesi)
  var isciHTML = '<div class="card">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚒️ Isci Dagilimi</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      ['oduncu','madenci','ciftci','balikci','tuccar'].map(function(tip) {
        var mevcut = isciler[tip] || 0;
        var kap = kapasite[tip];
        var kapText = kap < 999999 ? ' <span style="color:#666;font-size:9px">/ ' + fmt(kap) + '</span>' : '';
        var doluRenk = kap < 999999 && mevcut >= kap ? '#e74c3c' : '#d4af37';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:#111;border-radius:4px">' +
          '<span style="font-size:10px">' + (ISCI_IKON[tip]||'') + ' ' + tip + ': <span style="color:' + doluRenk + ';font-weight:bold">' + fmt(mevcut) + '</span>' + kapText + '</span>' +
          (myYetkiler.isci_ata ? '<div style="display:flex;gap:2px">' +
            '<button style="background:#2ecc71;color:#000;border:none;padding:2px 6px;border-radius:3px;font-size:9px;cursor:pointer" onclick="guildIsciAta(' + g.id + ',\'' + tip + '\')">+</button>' +
            '<button style="background:#e74c3c;color:#fff;border:none;padding:2px 6px;border-radius:3px;font-size:9px;cursor:pointer" onclick="guildIsciCikar(' + g.id + ',\'' + tip + '\')">-</button>' +
          '</div>' : '') +
        '</div>';
      }).join('') +
    '</div>' +
    '<div style="font-size:9px;color:#555;margin-top:6px">Kapasite: tarla×50 ciftci, balikci×20, oduncu×40</div>' +
  '</div>';

  // Asker yap butonu
  var askerHTML = '';
  if (myYetkiler.isci_ata) {
    askerHTML = '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚔️ Asker Yap</div>' +
      '<div style="display:flex;gap:4px;align-items:center">' +
        '<input id="guild-asker-adet" type="number" min="1" placeholder="Adet" style="width:80px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
        '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="guildAskerYap(' + g.id + ')">Koylu → Asker</button>' +
        '<span style="font-size:9px;color:#555">Mevcut koylu: ' + fmt(nufus.koylu) + '</span>' +
      '</div>' +
    '</div>';
  }

  el.innerHTML = nufusHTML + isciHTML + askerHTML;
}

// ═══════════════════════════════════
//   API FONKSIYONLARI
// ═══════════════════════════════════
async function guildAyril(guildId) {
  if (!confirm('Guildden ayrilmak istediginize emin misiniz?\nBagisladiginiz koyluleri geri ALAMAZSINIZ!')) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/ayril', { method: 'POST', headers: { 'Authorization': 'Bearer ' + getToken() } });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildAt(guildId, playerId) {
  if (!confirm('Bu uyeyi atmak istediginize emin misiniz?')) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/at', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ playerId: playerId })
    });
    var data = await resp.json();
    if (resp.ok) { toast('Uye atildi'); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildRutbe(guildId, playerId, rutbe) {
  try {
    await fetch(API_BASE + '/api/guild/' + guildId + '/rutbe', {
      method: 'PUT', headers: guildHdr(), body: JSON.stringify({ playerId: playerId, rutbe: rutbe })
    });
    toast('Rutbe guncellendi'); loadGuild();
  } catch(e) {}
}

async function guildDuyuruKaydet(guildId) {
  var duyuru = document.getElementById('guild-duyuru-inp')?.value || '';
  try {
    await fetch(API_BASE + '/api/guild/' + guildId + '/duyuru', {
      method: 'PUT', headers: guildHdr(), body: JSON.stringify({ duyuru: duyuru })
    });
    toast('Duyuru kaydedildi');
  } catch(e) {}
}

async function guildSehirTasi(guildId) {
  var x = parseInt(document.getElementById('guild-tasi-x')?.value);
  var y = parseInt(document.getElementById('guild-tasi-y')?.value);
  var msg = document.getElementById('guild-tasi-msg');
  if (!x || !y) { if(msg) msg.innerHTML = '<span style="color:#e74c3c">X ve Y gerekli</span>'; return; }
  if (!confirm('Guild sehrini ' + x + ':' + y + ' konumuna tasimak istediginize emin misiniz?')) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/sehir-tasi', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ x: x, y: y })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); }
    else { if(msg) msg.innerHTML = '<span style="color:#e74c3c">' + (data.error||'Hata') + '</span>'; }
  } catch(e) { if(msg) msg.innerHTML = '<span style="color:#e74c3c">Baglanti hatasi</span>'; }
}

async function guildBagis(guildId, kaynak) {
  var miktar = prompt(kaynak + ' ne kadar bagislamak istiyorsunuz?');
  if (!miktar || isNaN(miktar) || parseInt(miktar) <= 0) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/bagis', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ kaynak: kaynak, miktar: parseInt(miktar) })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildKoyluBagis(guildId) {
  var adet = parseInt(document.getElementById('koylu-bagis-adet')?.value);
  if (!adet || adet <= 0) { alert('Gecerli bir adet girin'); return; }
  if (!confirm(adet + ' koylu guilde gonderilecek. Geri ALINAMAZ! Emin misiniz?')) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/koylu-bagis', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ adet: adet })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildIsciAta(guildId, tip) {
  var adet = prompt(tip + ' icin kac koylu atamak istiyorsunuz?');
  if (!adet || isNaN(adet) || parseInt(adet) <= 0) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/isci-ata', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ tip: tip, adet: parseInt(adet) })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildIsciCikar(guildId, tip) {
  var adet = prompt(tip + ' kac isciyi koyluye donusturmek istiyorsunuz?');
  if (!adet || isNaN(adet) || parseInt(adet) <= 0) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/isci-cikar', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ tip: tip, adet: parseInt(adet) })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildAskerYap(guildId) {
  var adet = parseInt(document.getElementById('guild-asker-adet')?.value);
  if (!adet || adet <= 0) { alert('Gecerli bir adet girin'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/asker-yap', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ adet: adet })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildAmbarIstek(guildId) {
  var kaynak = document.getElementById('ambar-istek-kaynak')?.value;
  var miktar = parseInt(document.getElementById('ambar-istek-miktar')?.value);
  if (!kaynak || !miktar || miktar <= 0) { alert('Kaynak ve miktar girin'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/ambar-istek', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ kaynak: kaynak, miktar: miktar })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); guildAmbarIsteklerYukle(guildId); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildAmbarIstekOnayla(guildId, istekId, karar) {
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/ambar-istek/' + istekId + '/onayla', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ karar: karar })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); guildAmbarIsteklerYukle(guildId); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

// ═══════════════════════════════════
//   v1.9.3: TAKVİYE SİSTEMİ
// ═══════════════════════════════════
async function guildTakviyeGonder(hedefPlayerId, hedefIsim) {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/army/state', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { alert('Ordular yuklenemedi'); return; }
    var armies = (data.armies || []).filter(function(a) { return !a.is_busy && a.konum_tipi === 'sehir' && a.total_units >= 100; });
    if (armies.length === 0) { alert('Gonderilecek uygun ordu yok (min 100 unite, mesgul olmayan, evdeki)'); return; }

    var secim = prompt('Takviye olarak gondermek icin ordu secin:\n' + armies.map(function(a, i) { return (i+1) + '. ' + a.isim + ' (' + a.total_units + ' unite)'; }).join('\n') + '\n\nNumara girin:', '1');
    if (!secim) return;
    var idx = parseInt(secim) - 1;
    if (idx < 0 || idx >= armies.length) { alert('Gecersiz secim'); return; }
    var ordu = armies[idx];

    if (!confirm(ordu.isim + ' ordusunu ' + hedefIsim + ' oyuncusuna takviye olarak gondermek istiyor musunuz?')) return;

    var res = await fetch(API_BASE + '/api/takviye/gonder', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ orduId: ordu.id, hedefPlayerId: hedefPlayerId })
    });
    var result = await res.json();
    if (res.ok) { toast(result.mesaj || 'Takviye yola cikti!'); guildTakviyeDurumYukle(); }
    else { alert(result.error || 'Hata'); }
  } catch(e) { alert('Baglanti hatasi'); }
}

async function guildTakviyeDurumYukle() {
  var el = document.getElementById('guild-takviye-panel');
  if (!el) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/takviye/durum', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { el.innerHTML = '<span style="color:#555">Yuklenemedi</span>'; return; }
    var data = await resp.json();
    var html = '';

    if (data.gonderilen.length > 0) {
      html += '<div style="margin-bottom:8px"><div style="color:#9b59b6;font-weight:bold;margin-bottom:4px">Gonderilen Takviyeler</div>';
      data.gonderilen.forEach(function(t) {
        var durum = t.is_busy ? '<span style="color:#e67e22">Gorevde</span>' : '<span style="color:#2ecc71">Konuslanmis</span>';
        html += '<div style="padding:3px 0;border-bottom:1px solid #1a1a1a">🛡️ ' + (t.army_isim||'Ordu') + ' → ' + (t.hedef_kral||'?') + ' (' + t.konum_x + ':' + t.konum_y + ') — ' + durum + '</div>';
      });
      html += '</div>';
    }
    if (data.alinan.length > 0) {
      html += '<div style="margin-bottom:8px"><div style="color:#27ae60;font-weight:bold;margin-bottom:4px">Gelen Takviyeler</div>';
      data.alinan.forEach(function(t) {
        html += '<div style="padding:3px 0;border-bottom:1px solid #1a1a1a">🛡️ ' + (t.gonderen_kral||'?') + ' → ' + (t.army_isim||'Ordu') + ' (' + (t.toplam_unite||0) + ' unite)</div>';
      });
      html += '</div>';
    }
    if (data.koloni_usleri.length > 0) {
      html += '<div style="margin-bottom:8px"><div style="color:#e67e22;font-weight:bold;margin-bottom:4px">Koloni Usleri</div>';
      data.koloni_usleri.forEach(function(t) {
        html += '<div style="padding:3px 0;border-bottom:1px solid #1a1a1a">🏰 ' + (t.army_isim||'Ordu') + ' → ' + (t.koloni_isim||'Koloni') + ' (' + t.konum_x + ':' + t.konum_y + ')</div>';
      });
      html += '</div>';
    }
    if (data.yoldaki.length > 0) {
      html += '<div><div style="color:#f39c12;font-weight:bold;margin-bottom:4px">Yoldaki Hareketler</div>';
      data.yoldaki.forEach(function(t) {
        var tipLabel = t.tip === 'takviye' ? 'Takviye' : t.tip === 'koloni_us' ? 'Koloni Us' :
                       t.tip === 'rolu_saldiri' ? 'Relay Saldiri' : t.tip.startsWith('donus_') ? 'Donus' : t.tip;
        html += '<div style="padding:3px 0;border-bottom:1px solid #1a1a1a">🚀 ' + tipLabel + ' — ' + (t.efektif_sure||'?') + ' PG</div>';
      });
      html += '</div>';
    }

    if (!html) html = '<span style="color:#555">Aktif takviye yok</span>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<span style="color:#555">Hata</span>'; }
}

// ═══════════════════════════════════
//   TAB: BİNALAR
// ═══════════════════════════════════
var GUILD_BINA_DATA = null;

async function renderTabBinalar(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/binalar/config', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }
    GUILD_BINA_DATA = d;

    var yetkiler = data.benim_yetkilerim || {};
    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:10px">🏗️ Guild Binalari</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';

    for (var binaId in d.binalar) {
      var b = d.binalar[binaId];
      var inQueue = b.in_queue;
      var maliyetHtml = '';
      for (var k in b.maliyet) {
        maliyetHtml += '<span style="margin-right:6px">' + (KAYNAK_IKON[k]||'') + ' ' + fmt(b.maliyet[k]) + '</span>';
      }
      var surePG = Math.ceil(b.sure_sn / 3600);

      var aksiyonHtml = '';
      if (inQueue) {
        var kalan = b.queue_end ? Math.max(0, Math.ceil((new Date(b.queue_end) - Date.now()) / 60000)) : 0;
        aksiyonHtml = '<span style="color:#f39c12;font-size:10px">🔨 Insaatta (' + kalan + ' dk kaldi)</span>';
      } else if (yetkiler.guild_bina_yap) {
        aksiyonHtml = '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px" onclick="guildBinaUpgrade(\'' + binaId + '\')">+1 ' + b.isim + '</button>';
      }

      // v1.13: seviye → adet terminolojisi
      var adet = b.adet != null ? b.adet : b.seviye;
      html += '<div class="card" style="padding:10px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
          '<span style="font-size:20px">' + b.icon + '</span>' +
          '<div><div style="font-family:Cinzel,serif;font-size:12px;color:var(--race-color)">' + b.isim + ' <span style="color:#888">Adet: ' + adet + '</span></div>' +
          '<div style="font-size:10px;color:#666">' + b.aciklama + '</div></div>' +
        '</div>' +
        '<div style="font-size:10px;color:#aaa;margin-bottom:4px">Maliyet: ' + maliyetHtml + '</div>' +
        '<div style="font-size:10px;color:#aaa;margin-bottom:6px">Sure: ' + surePG + ' P.G.</div>' +
        aksiyonHtml +
      '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>';
  }
}

async function guildBinaUpgrade(binaId) {
  if (!GUILD_DATA) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/binalar/upgrade', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ binaId: binaId })
    });
    var d = await resp.json();
    if (resp.ok) { toast(d.mesaj || 'Insa baslatildi'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

// ═══════════════════════════════════
//   TAB: ORDU
// ═══════════════════════════════════
async function renderTabOrdu(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/ordu', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }

    var yetkiler = data.benim_yetkilerim || {};
    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:6px">🛡️ Guild Ordusu</h3>' +
      '<div style="font-size:10px;color:#888;margin-bottom:10px">Lider Taraf: <b style="color:#ccc">' + d.lider_taraf + '</b> | Asker: <b style="color:#e74c3c">' + fmt(d.nufus.asker) + '</b> | Max ' + d.max_ordu + ' ordu</div>';

    // Egitim kuyrugu
    if (d.kuyruk.length > 0) {
      html += '<div class="card" style="padding:10px;margin-bottom:10px">' +
        '<div style="font-size:11px;color:#f39c12;margin-bottom:4px">🔨 Egitim Kuyrugu</div>';
      d.kuyruk.forEach(function(k) {
        var kalan = Math.max(0, Math.ceil((new Date(k.queue_end) - Date.now()) / 60000));
        html += '<div style="font-size:11px;color:#ccc">' + k.adet + 'x ' + k.unite_id + ' — ' + kalan + ' dk kaldi</div>';
      });
      html += '</div>';
    }

    // Havuz + ata butonlari
    if (d.havuz.length > 0) {
      html += '<div class="card" style="padding:10px;margin-bottom:10px">' +
        '<div style="font-size:11px;color:var(--race-color);margin-bottom:4px">📦 Unite Havuzu</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">';
      d.havuz.forEach(function(u) {
        html += '<div style="font-size:11px;background:#1a1a1a;padding:4px 8px;border-radius:4px;display:flex;align-items:center;gap:4px">' +
          '<span>' + u.unite_id + ': <b>' + fmt(u.adet) + '</b></span>';
        if (yetkiler.guild_ordusu_kur && d.ordular.length > 0) {
          html += '<select id="havuz-hedef-' + u.unite_id + '" style="font-size:9px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:1px">';
          d.ordular.forEach(function(o) { html += '<option value="' + o.id + '">' + o.isim + '</option>'; });
          html += '</select>' +
            '<input id="havuz-adet-' + u.unite_id + '" type="number" min="1" max="' + u.adet + '" value="' + Math.min(u.adet, 10) + '" style="width:40px;font-size:9px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:1px">' +
            '<button style="font-size:8px;padding:2px 6px;background:#2a5a2a;color:#ccc;border:none;border-radius:3px;cursor:pointer" onclick="guildOrduAta(\'' + u.unite_id + '\')">Ata</button>';
        }
        html += '</div>';
      });
      html += '</div></div>';
    }

    // Ordular
    html += '<div style="font-size:12px;color:var(--race-color);font-family:Cinzel,serif;margin:10px 0 6px">Ordular (' + d.ordular.length + '/' + d.max_ordu + ')</div>';
    if (d.ordular.length === 0) {
      html += '<div class="card" style="padding:15px;text-align:center;color:#555;font-size:11px">Henuz guild ordusu kurulmamis</div>';
    }
    d.ordular.forEach(function(ordu) {
      html += '<div class="card" style="padding:10px;margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<span style="font-family:Cinzel,serif;font-size:12px;color:var(--race-color)">' + ordu.isim + '</span>' +
          '<span style="font-size:10px;color:#888">' + fmt(ordu.toplam_unite) + ' unite';
      if (d.atk_def_gorunur) {
        html += ' | ATK:' + Number(ordu.toplam_atk).toFixed(0) + ' DEF:' + Number(ordu.toplam_def).toFixed(0);
      }
      html += '</span></div>';
      if (ordu.uniteler && ordu.uniteler.length > 0) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
        ordu.uniteler.forEach(function(u) {
          html += '<div style="font-size:10px;background:#111;padding:2px 6px;border-radius:3px;display:inline-flex;align-items:center;gap:3px">' +
            '<span>' + u.unite_id + ':' + fmt(u.adet) + '</span>';
          if (yetkiler.guild_ordusu_kur) {
            html += '<input id="cikar-adet-' + ordu.id + '-' + u.unite_id + '" type="number" min="1" max="' + u.adet + '" value="' + Math.min(u.adet, 10) + '" style="width:35px;font-size:8px;background:#222;color:#ccc;border:1px solid #444;border-radius:2px;padding:0 2px">' +
              '<button style="font-size:7px;padding:1px 4px;background:#5a2a2a;color:#ccc;border:none;border-radius:2px;cursor:pointer" onclick="guildOrduCikar(' + ordu.id + ',\'' + u.unite_id + '\')">Cikar</button>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      if (yetkiler.guild_ordusu_kur) {
        html += '<div style="margin-top:6px;display:flex;gap:4px">' +
          '<button class="btn-action" style="width:auto;padding:3px 10px;font-size:9px;background:#333" onclick="guildOrduSil(' + ordu.id + ')">🗑️ Sil</button>' +
        '</div>';
      }
      html += '</div>';
    });

    // Ordu kur butonu
    if (yetkiler.guild_ordusu_kur && d.ordular.length < d.max_ordu) {
      html += '<div style="margin-top:8px">' +
        '<input id="guild-ordu-isim" placeholder="Ordu ismi" style="padding:4px 8px;border:1px solid #333;background:#111;color:#ccc;border-radius:4px;font-size:11px;width:150px"> ' +
        '<button class="btn-action" style="width:auto;padding:4px 14px;font-size:10px" onclick="guildOrduKur()">+ Ordu Kur</button>' +
      '</div>';
    }

    // Egitim formu (dropdown ile lider tarafi uniteleri)
    if (yetkiler.guild_unite_uret && d.nufus.asker > 0) {
      var uniteOpts = '';
      if (d.taraf_uniteleri && d.taraf_uniteleri.length > 0) {
        d.taraf_uniteleri.forEach(function(u) {
          uniteOpts += '<option value="' + u.id + '">' + u.id + ' (T' + u.tier + ' | ATK:' + u.baseAtk + ' DEF:' + u.baseDef + ' | ' + u.trainDays + 'PG)</option>';
        });
      }
      html += '<div class="card" style="padding:10px;margin-top:10px">' +
        '<div style="font-size:11px;color:var(--race-color);margin-bottom:6px">⚔️ Unite Egit (' + d.lider_taraf + ' tarafi)</div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<select id="guild-egit-unite" style="padding:4px 8px;border:1px solid #333;background:#111;color:#ccc;border-radius:4px;font-size:11px;width:260px">' + uniteOpts + '</select>' +
          '<input id="guild-egit-adet" type="number" min="1" value="10" style="padding:4px 8px;border:1px solid #333;background:#111;color:#ccc;border-radius:4px;font-size:11px;width:60px">' +
          '<button class="btn-action" style="width:auto;padding:4px 14px;font-size:10px" onclick="guildOrduEgit()">EGIT</button>' +
        '</div>' +
        '<div style="font-size:9px;color:#555;margin-top:4px">Mevcut asker: ' + fmt(d.nufus.asker) + ' (her unite 1 asker harcar)</div>' +
      '</div>';
    }

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>';
  }
}

async function guildOrduKur() {
  if (!GUILD_DATA) return;
  var isim = document.getElementById('guild-ordu-isim');
  if (!isim || !isim.value.trim()) { toast('Ordu ismi girin', 'error'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/ordu/kur', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ isim: isim.value.trim() })
    });
    var d = await resp.json();
    if (resp.ok) { toast('Ordu kuruldu'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

async function guildOrduSil(armyId) {
  if (!GUILD_DATA || !confirm('Bu orduyu silmek istediginize emin misiniz? Uniteler havuza aktarilir.')) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/ordu/sil', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ army_id: armyId })
    });
    var d = await resp.json();
    if (resp.ok) { toast('Ordu silindi'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

async function guildOrduEgit() {
  if (!GUILD_DATA) return;
  var unite = document.getElementById('guild-egit-unite');
  var adet = document.getElementById('guild-egit-adet');
  if (!unite || !unite.value.trim() || !adet || !adet.value) { toast('Unite ve adet girin', 'error'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/ordu/egit', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ unite_id: unite.value.trim(), adet: parseInt(adet.value) })
    });
    var d = await resp.json();
    if (resp.ok) { toast(d.mesaj || 'Egitim baslatildi'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

async function guildOrduAta(uniteId) {
  if (!GUILD_DATA) return;
  var hedef = document.getElementById('havuz-hedef-' + uniteId);
  var adetEl = document.getElementById('havuz-adet-' + uniteId);
  if (!hedef || !adetEl) { toast('Secim hatasi', 'error'); return; }
  var adet = parseInt(adetEl.value);
  if (!adet || adet < 1) { toast('Gecerli adet girin', 'error'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/ordu/ata', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ army_id: parseInt(hedef.value), unite_id: uniteId, adet: adet })
    });
    var d = await resp.json();
    if (resp.ok) { toast(d.mesaj || 'Unite atandi'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

async function guildOrduCikar(armyId, uniteId) {
  if (!GUILD_DATA) return;
  var adetEl = document.getElementById('cikar-adet-' + armyId + '-' + uniteId);
  var adet = adetEl ? parseInt(adetEl.value) : 0;
  if (!adet || adet < 1) { toast('Gecerli adet girin', 'error'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/ordu/cikar', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ army_id: armyId, unite_id: uniteId, adet: adet })
    });
    var d = await resp.json();
    if (resp.ok) { toast(d.mesaj || 'Unite havuza cikarildi'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

// ═══════════════════════════════════
//   v1.13: TAB: MARKET — 10 hammadde (oyuncu market ile ayni)
// ═══════════════════════════════════
var HAMMADDE_IKON = {
  gumus:'💿', mitril:'✨', bakir:'🟤', obsidyen:'⚫', ejderha_tasi:'🐉',
  kalay:'⚪', kehribar:'🟡', yakut:'🔴', zumrut:'💚', elmas:'💎'
};

async function renderTabMarket(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/market', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }

    var yetkiler = data.benim_yetkilerim || {};
    var satisYetki = yetkiler.market_satis;

    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:10px">🏪 Guild Market — Hammadde Satisi</h3>';

    var fiyatlar = d.fiyatlar || {};
    var kurTarih = d.kur_guncelleme ? new Date(d.kur_guncelleme).toLocaleString('tr-TR') : '-';

    html += '<div style="font-size:10px;color:#888;margin-bottom:10px">Kur son guncelleme: ' + kurTarih + ' | Kurlar saatte bir %70-130 arasi dalgalanir</div>';

    if (!satisYetki) {
      html += '<div style="font-size:10px;color:#f39c12;margin-bottom:10px">ℹ️ Sadece market satis yetkiniz olan uyeler satis yapabilir</div>';
    }

    // Hammadde tablosu
    html += '<div class="card" style="padding:10px">';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';

    Object.keys(fiyatlar).forEach(function(key) {
      var f = fiyatlar[key];
      var ikon = HAMMADDE_IKON[key] || '💠';
      var kurRenk = f.kur >= 110 ? '#2ecc71' : (f.kur <= 90 ? '#e74c3c' : '#d4af37');
      html += '<div style="background:#0a0a0a;padding:8px;border-radius:4px;border:1px solid #1a1a1a">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<span style="font-size:12px"><span style="font-size:16px">' + ikon + '</span> <b>' + f.isim + '</b></span>' +
          '<span style="font-size:10px;color:' + kurRenk + ';font-weight:bold">kur %' + f.kur + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#aaa;margin-bottom:4px">Stok: <span style="color:#d4af37;font-weight:bold">' + fmt(f.miktar) + '</span> | Fiyat: <span style="color:#d4af37">' + f.satis_fiyat + '</span> altin/adet <span style="color:#555;font-size:9px">(baz: ' + f.baz_fiyat + ')</span></div>' +
        (satisYetki ?
          '<div style="display:flex;gap:4px;align-items:center">' +
            '<input id="gmkt-inp-' + key + '" type="number" min="1" max="' + f.miktar + '" value="0" style="padding:3px;border:1px solid #333;background:#111;color:#ccc;border-radius:3px;font-size:10px;width:70px" placeholder="adet">' +
            '<button class="btn-action" style="width:auto;padding:3px 10px;font-size:9px;background:#27ae60" onclick="guildMarketSat(\'' + key + '\')" ' + (f.miktar <= 0 ? 'disabled' : '') + '>SAT</button>' +
            '<span id="gmkt-kzn-' + key + '" style="font-size:9px;color:#666"></span>' +
          '</div>'
          : '') +
      '</div>';
    });

    html += '</div></div>';

    // Son islemler
    if (d.islemler && d.islemler.length > 0) {
      html += '<div class="card" style="padding:10px;margin-top:10px">' +
        '<div style="font-size:11px;color:#aaa;margin-bottom:6px">Son Islemler</div>';
      d.islemler.forEach(function(i) {
        var renk = i.islem_tipi === 'satis' ? '#2ecc71' : '#3498db';
        var ikon = i.islem_tipi === 'satis' ? '📤' : '📥';
        var tarih = new Date(i.created_at).toLocaleString('tr-TR');
        html += '<div style="font-size:10px;color:#999;margin-bottom:3px">' +
          ikon + ' <span style="color:' + renk + '">' + (i.oyuncu_adi||'Sistem') + '</span> — ' +
          fmt(i.miktar) + ' ' + i.kaynak + ' (' + fmt(i.altin) + ' altin) <span style="color:#444">' + tarih + '</span></div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi: ' + e.message + '</div>';
  }
}

async function guildMarketSat(hammadde) {
  if (!GUILD_DATA) return;
  var inp = document.getElementById('gmkt-inp-' + hammadde);
  if (!inp) return;
  var miktar = parseInt(inp.value);
  if (!miktar || miktar < 1) { toast('Gecersiz miktar', 'error'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/market/sat', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ hammadde: hammadde, miktar: miktar })
    });
    var d = await resp.json();
    if (resp.ok) {
      toast(d.mesaj || 'Satildi');
      var kzn = document.getElementById('gmkt-kzn-' + hammadde);
      if (kzn) kzn.textContent = '+' + fmt(d.kazanc) + ' altin (kur %' + d.kur + ')';
      loadGuild();
    } else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

// v1.13: Eski guildMarketSat'a yonlendirme kaldirildi, parametre ile cagriliyor
// v1.12.4: /market/al endpoint'i backend'den kaldirildi. Uye-guild transfer icin /ambar-istek sistemi var.
// v1.13: Eski 6-basic market yerine 10 hammadde market gecildi (oyuncu market ile ayni).

// ═══════════════════════════════════
//   v1.13: TAB: DAGITIM (Kaynak dagitim oranlari)
// ═══════════════════════════════════
var DAGITIM_KAYNAKLAR = ['odun','metal','altin','bugday','balik','kereste','islenmis'];
var DAGITIM_ISIM = { odun:'Odun', metal:'Metal', altin:'Altin', bugday:'Bugday', balik:'Balik', kereste:'Kereste', islenmis:'Islenmis Metal' };

async function renderTabDagitim(el, data) {
  var gId = data.guild.id;
  var rutbe = data.benim_rutbem;
  var isLiderYardimci = (rutbe === 'lider' || rutbe === 'yardimci');
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/dagitim', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }
    var dag = d.dagitim || {};

    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:10px">📦 Kaynak Dagitim Oranlari</h3>';
    html += '<div class="card"><div style="font-size:10px;color:#aaa;margin-bottom:10px">Guild iscilerinin urettigi kaynaklarin <b>% kaci</b> uyelere esit dagitilir (saatte bir). Kalan kasada kalir.</div>';

    if (!isLiderYardimci) {
      html += '<div style="font-size:10px;color:#f39c12;margin-bottom:8px">ℹ️ Sadece lider ve yardimci oranlari degistirebilir</div>';
    }

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    DAGITIM_KAYNAKLAR.forEach(function(k) {
      var val = parseInt(dag[k]) || 0;
      var icon = KAYNAK_IKON[k] || '';
      html += '<div style="padding:6px;background:#0a0a0a;border-radius:4px">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:3px">' +
          '<span style="font-size:10px">' + icon + ' ' + DAGITIM_ISIM[k] + '</span>' +
          '<span id="dag-val-' + k + '" style="font-size:10px;color:#d4af37;font-weight:bold">%' + val + '</span>' +
        '</div>' +
        (isLiderYardimci
          ? '<input id="dag-inp-' + k + '" type="range" min="0" max="100" value="' + val + '" oninput="guildDagitimSliderGuncelle(\'' + k + '\')" style="width:100%">'
          : '<div style="height:6px;background:#1a1a1a;border-radius:3px"><div style="width:' + val + '%;height:100%;background:#d4af37;border-radius:3px"></div></div>') +
      '</div>';
    });
    html += '</div>';

    if (isLiderYardimci) {
      html += '<div style="margin-top:12px;text-align:right">' +
        '<button class="btn-action" style="width:auto;padding:6px 16px;font-size:11px" onclick="guildDagitimKaydet(' + gId + ')">💾 Kaydet</button>' +
      '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>';
  }
}

function guildDagitimSliderGuncelle(kaynak) {
  var val = document.getElementById('dag-inp-' + kaynak).value;
  var disp = document.getElementById('dag-val-' + kaynak);
  if (disp) disp.textContent = '%' + val;
}

async function guildDagitimKaydet(gId) {
  var body = {};
  DAGITIM_KAYNAKLAR.forEach(function(k) {
    var inp = document.getElementById('dag-inp-' + k);
    body[k] = inp ? parseInt(inp.value) || 0 : 0;
  });
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/dagitim', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify(body)
    });
    var d = await resp.json();
    if (resp.ok) { toast('Dagitim oranlari kaydedildi'); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

// ═══════════════════════════════════
//   TAB: RAPORLAR
// ═══════════════════════════════════
// v1.13: yeni event tipleri eklendi (guild_maas, guild_dagitim, guild_dagitim_ayar, guild_tuccar_uretim)
var GUILD_RAPOR_KATEGORI = {
  uretim:  { isim:'Uretim',  renk:'#2ecc71', tipler:['guild_isci_uretim','guild_bina_uretim','guild_nufus','guild_tuccar_uretim','guild_dagitim'] },
  askeri:  { isim:'Askeri',   renk:'#e74c3c', tipler:['guild_egitim_tamam','guild_egitim_baslat','guild_ordu','guild_maas'] },
  bina:    { isim:'Bina',     renk:'#f39c12', tipler:['guild_bina_tamam','guild_bina_baslat'] },
  ticaret: { isim:'Ticaret',  renk:'#3498db', tipler:['guild_market_satis','guild_market_alis'] },
  uye:     { isim:'Uye',      renk:'#9b59b6', tipler:['guild_bagis','guild_ambar','guild_katilim','guild_ayrilma','guild_dagitim_ayar'] }
};
var GUILD_EVENT_IKON = {
  guild_isci_uretim:'⚒️', guild_bina_uretim:'🏗', guild_nufus:'👥',
  guild_tuccar_uretim:'💼', guild_dagitim:'📦', guild_dagitim_ayar:'⚙️',
  guild_egitim_tamam:'⚔️', guild_egitim_baslat:'⚔️', guild_ordu:'🎖',
  guild_maas:'💰', guild_bina_tamam:'🏗', guild_bina_baslat:'🔨',
  guild_market_satis:'💵', guild_market_alis:'💸',
  guild_bagis:'🎁', guild_ambar:'📦', guild_katilim:'➕', guild_ayrilma:'➖'
};
var GUILD_RAPOR_FILTRE = 'hepsi';

async function renderTabRaporlar(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/raporlar', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }

    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:10px">📜 Guild Raporlari</h3>';

    // Filtre butonlari
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">';
    html += '<button onclick="guildRaporFiltre(\'hepsi\')" style="padding:3px 10px;border:none;border-radius:4px;font-size:10px;cursor:pointer;' +
      (GUILD_RAPOR_FILTRE === 'hepsi' ? 'background:var(--race-color);color:#000' : 'background:#1a1a1a;color:#888') + '">Hepsi</button>';
    for (var kat in GUILD_RAPOR_KATEGORI) {
      var k = GUILD_RAPOR_KATEGORI[kat];
      html += '<button onclick="guildRaporFiltre(\'' + kat + '\')" style="padding:3px 10px;border:none;border-radius:4px;font-size:10px;cursor:pointer;' +
        (GUILD_RAPOR_FILTRE === kat ? 'background:' + k.renk + ';color:#000' : 'background:#1a1a1a;color:' + k.renk) + '">' + k.isim + '</button>';
    }
    html += '</div>';

    // Raporlari filtrele
    var raporlar = d.raporlar || [];
    if (GUILD_RAPOR_FILTRE !== 'hepsi') {
      var tipler = GUILD_RAPOR_KATEGORI[GUILD_RAPOR_FILTRE]?.tipler || [];
      raporlar = raporlar.filter(function(r) { return tipler.indexOf(r.event_type) >= 0; });
    }

    if (raporlar.length === 0) {
      html += '<div class="card" style="padding:20px;text-align:center;color:#555;font-size:11px">Rapor bulunamadi</div>';
    } else {
      // Tarih bazli gruplama
      var gruplar = {};
      raporlar.forEach(function(r) {
        var tarih = r.palantis_gun + '/' + r.palantis_ay + '/' + r.palantis_yil;
        if (!gruplar[tarih]) gruplar[tarih] = [];
        gruplar[tarih].push(r);
      });

      for (var tarih in gruplar) {
        html += '<div style="font-size:10px;color:#888;margin:8px 0 4px;border-bottom:1px solid #222;padding-bottom:2px">📅 ' + tarih + ' (' + gruplar[tarih].length + ' kayit)</div>';
        gruplar[tarih].forEach(function(r) {
          var renk = '#888';
          for (var kat2 in GUILD_RAPOR_KATEGORI) {
            if (GUILD_RAPOR_KATEGORI[kat2].tipler.indexOf(r.event_type) >= 0) { renk = GUILD_RAPOR_KATEGORI[kat2].renk; break; }
          }
          html += '<div style="font-size:10px;color:#aaa;padding:2px 0;border-left:2px solid ' + renk + ';padding-left:8px">' +
            '<span style="color:' + renk + '">' + r.event_type + '</span> ' + r.mesaj +
            (r.oyuncu_adi ? ' <span style="color:#555">(' + r.oyuncu_adi + ')</span>' : '') +
          '</div>';
        });
      }
    }

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>';
  }
}

function guildRaporFiltre(filtre) {
  GUILD_RAPOR_FILTRE = filtre;
  if (GUILD_DATA) {
    var el = document.getElementById('guild-tab-content');
    if (el) renderTabRaporlar(el, GUILD_DATA);
  }
}

// ═══════════════════════════════════
//   TAB: MEZARLIK
// ═══════════════════════════════════
async function renderTabMezarlik(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/mezarlik', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }

    var yetkiler = data.benim_yetkilerim || {};
    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:10px">⚰️ Guild Mezarligi</h3>';

    // Kasa altin
    html += '<div style="font-size:10px;color:#888;margin-bottom:10px">Guild Kasasi: <b style="color:#d4af37">' + fmt(d.guild_altin) + ' altin</b></div>';

    if (d.kayitlar.length === 0) {
      html += '<div class="card" style="padding:20px;text-align:center;color:#555;font-size:12px">' +
        '<div style="font-size:30px;margin-bottom:8px">⚰️</div>Savastan gelen kayip yok</div>';
    } else {
      d.kayitlar.forEach(function(k) {
        var kalanDk = Math.max(0, Math.floor(k.kalan_sure_ms / 60000));
        var kalanSaat = Math.floor(kalanDk / 60);
        var kalanDkRem = kalanDk % 60;
        var sureTxt = kalanSaat > 0 ? kalanSaat + 's ' + kalanDkRem + 'dk' : kalanDk + 'dk';
        html += '<div class="card" style="padding:10px;margin-bottom:8px;border-left:2px solid #5a2a2a">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
            '<span style="font-size:12px;color:#ccc">' + (k.unite_icon || '⚔️') + ' ' + (k.unite_adi || k.unite_id) + '</span>' +
            '<span style="font-size:9px;color:#888">⏱ ' + sureTxt + ' kaldi</span>' +
          '</div>' +
          '<div style="font-size:10px;color:#aaa;margin-bottom:6px">' +
            'Toplam: <b>' + k.adet + '</b> | ' +
            'Diriltildi: <b style="color:#2ecc71">' + k.diriltilen + '</b> | ' +
            'Kalan Hak: <b style="color:#e67e22">' + k.kalan_diriltme + '</b> | ' +
            'Birim Maliyet: <b style="color:#d4af37">' + fmt(k.birim_maliyet) + ' altin</b>' +
          '</div>';
        if (yetkiler.guild_ordusu_kur && k.kalan_diriltme > 0) {
          html += '<div style="display:flex;gap:6px;align-items:center">' +
            '<input id="mez-adet-' + k.id + '" type="number" min="1" max="' + k.kalan_diriltme + '" value="' + Math.min(k.kalan_diriltme,5) + '" style="width:55px;padding:3px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px">' +
            '<button class="btn-action" style="width:auto;padding:3px 10px;font-size:9px;background:#2a5a2a" onclick="guildMezarlikDirilt(' + gId + ',' + k.id + ')">Dirilt (' + fmt(k.birim_maliyet) + '/unit)</button>' +
          '</div>';
        }
        html += '</div>';
      });
    }

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>';
  }
}

async function guildMezarlikDirilt(guildId, mezId) {
  var adetEl = document.getElementById('mez-adet-' + mezId);
  var adet = parseInt(adetEl?.value);
  if (!adet || adet <= 0) { toast('Gecerli adet girin', 'error'); return; }
  if (!confirm(adet + ' unite diriltilecek. Altın kasadan kesilecek. Emin misiniz?')) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/mezarlik/' + mezId + '/dirilt', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ adet })
    });
    var d = await resp.json();
    if (resp.ok) { toast(d.diriltilen + ' unite diriltildi. Maliyet: ' + fmt(d.maliyet) + ' altin'); loadGuild(); }
    else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadGuild(); }
  }, 500);
});
