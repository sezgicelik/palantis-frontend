/* ═══════════════════════════════════════════════════════
   NOXARA — GUILD SAYFASI
   js/page-guild.js — v1.10 (Tab yapisi + Yetki + İşçi + Ambar)
═══════════════════════════════════════════════════════ */
var GUILD_DATA = null;
var GUILD_CONFIG = null;
var GUILD_AKTIF_TAB = 'genel';

var KAYNAK_IKON = {altin:'💰',odun:'🌳',metal:'⛏️',bugday:'🌾',balik:'🐟',kereste:'🪵',islenmis:'🔩'};
var ISCI_IKON = {oduncu:'🪓',madenci:'⛏️',ciftci:'🌾',balikci:'🐟',tuccar:'💼'};

function guildHdr() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}
function fmt(n) {
  // v1.13.68.11: string geldiginde toLocaleString format uygulamiyor — Number'a cevir
  var num = typeof n === 'number' ? n : (parseFloat(n) || 0);
  return num.toLocaleString('tr-TR');
}

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
      const hudEl = document.getElementById('guild-page-hud');
      if (hudEl) hudEl.innerHTML = '';
    } else {
      renderGuildTabs(el, data);
      renderGuildPageHUD(data);
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
        '<button class="btn-action" style="width:auto;padding:8px 20px" onclick="guildKurModal()">🏰 Guild Kur (50K Altın)</button>' +
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
    // v1.14.0.39: Bekleyen istekler + 'Uyelik Iste' butonu
    var bekR = {};
    try {
      var bResp = await fetch(API_BASE + '/api/guild/bekleyen-isteklerim', { headers: { 'Authorization': 'Bearer ' + token } });
      var bD = await bResp.json();
      (bD.istekler || []).forEach(function(i){ bekR[i.guild_id] = i; });
    } catch(e) {}
    wrap.innerHTML = '<div style="font-size:10px;color:#888;margin-bottom:6px">Aktif Guildler:</div>' +
      data.map(function(g) {
        var bekliyor = !!bekR[g.id];
        var btn = bekliyor
          ? '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px;background:#555;color:#fff" onclick="guildIstegiIptal(' + g.id + ')">⏳ Bekliyor (İptal)</button>'
          : '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px" onclick="guildIstekGonder(' + g.id + ',\'' + (g.isim||'').replace(/[\'"]/g,'') + '\')">📨 Üyelik İste</button>';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#111;border:1px solid #222;border-radius:6px;margin-bottom:4px">' +
          '<div><span style="color:var(--race-color);font-weight:bold;font-size:12px">[' + (g.tag||'?') + ']</span> <span style="font-size:11px">' + (g.isim||'?') + '</span> <span style="font-size:11px;color:#888">(' + (g.uye_sayisi||0) + ' uye)</span></div>' +
          btn +
        '</div>';
      }).join('');
  } catch(e) { wrap.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

async function guildIstekGonder(guildId, guildIsim) {
  var token = getToken(); if (!token) return;
  var mesaj = prompt(guildIsim + ' guildine mesajınız (opsiyonel, guild yetkilileri görür):', '');
  if (mesaj === null) return; // cancel
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/katil', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesaj: mesaj })
    });
    var data = await resp.json();
    if (resp.ok) {
      if (typeof toast === 'function') toast(data.mesaj);
      else alert(data.mesaj);
      loadGuild();
    } else alert(data.error || 'Hata');
  } catch(e) { alert('Baglanti hatasi'); }
}

async function guildIstegiIptal(guildId) {
  if (!confirm('Bekleyen üyelik isteğini iptal etmek istediğine emin misin?')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/istegim-iptal', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (resp.ok) { if (typeof toast === 'function') toast('İstek iptal edildi'); loadGuild(); }
    else alert(data.error || 'Hata');
  } catch(e) { alert('Baglanti hatasi'); }
}

// Geri uyumluluk: eski guildKatil cagrilari
async function guildKatil(guildId) { return guildIstekGonder(guildId, ''); }

// ═══════════════════════════════════
//   TAB YAPISI
// ═══════════════════════════════════
var GUILD_TABS = [
  { id: 'genel',    label: '🏰 Genel',       aktif: true },
  { id: 'uyeler',   label: '👥 Uyeler',       aktif: true },
  { id: 'uye-ozet', label: '📊 Uye Ozeti',    aktif: true, yetki: 'ambar_gor' }, // v1.13.25
  { id: 'kasa',     label: '💰 Kasa',         aktif: true },
  { id: 'isciler',  label: '⚒️ İşçiler',     aktif: true },
  { id: 'binalar',  label: '🏗️ Binalar',     aktif: true },
  { id: 'ordu',     label: '🛡️ Ordu',        aktif: true },
  { id: 'market',   label: '🏪 Market',       aktif: true },
  { id: 'dagitim',  label: '📦 Dagitim',     aktif: true },
  { id: 'mezarlik', label: '⚰️ Mezarlik',    aktif: true },
  { id: 'kusatma',  label: '⚔️ Kusatma',      aktif: true },  // v1.13.39 Faz 3b.0
  { id: 'diplomasi', label: '🤝 Diplomasi', aktif: true }, // v1.14.0.30
  { id: 'sohbet',   label: '💬 Sohbet',       aktif: true }, // v1.14.0.42 A2
  { id: 'arastirma',label: '🔬 Araştırma',    aktif: true }, // v1.14.0.42 D
  { id: 'savas',    label: '⚔️ Savas Odasi', aktif: true }, // v1.14.0.70
  { id: 'raporlar', label: '📜 Raporlar',     aktif: true },
  // v1.13.68.5: Ekonomi Ozet Tablosu (oyuncu sayfasindaki ile ayni format)
  { id: 'ekonomi-ozet', label: '📊 Ekonomi Ozet', aktif: true }
];

// v1.13.2: Guild sayfasi ust HUD seridi (tum tab'larda gorunur)
function renderGuildPageHUD(data) {
  const hudEl = document.getElementById('guild-page-hud');
  if (!hudEl || !data.guild) return;

  const g = data.guild;
  const mevcut = data.mevcut_nufus ?? 0;
  const siniri = data.nufus_siniri ?? 0;
  const moral = data.ordu_morali ?? 100;
  const alanT = (data.guild_alan && data.guild_alan.toplam) || 0;
  const alanK = (data.guild_alan && data.guild_alan.kullanilan) || 0;
  const n = data.guild_nufus || {};
  const wsT = (parseInt(n.worshipper_beyaz)||0) + (parseInt(n.worshipper_kirmizi)||0)
            + (parseInt(n.worshipper_mavi)||0) + (parseInt(n.worshipper_yesil)||0)
            + (parseInt(n.worshipper)||0);
  const kasa = data.kasa || {};
  const mb = parseFloat(kasa.mana_beyaz)||0, mk = parseFloat(kasa.mana_kirmizi)||0,
        mm = parseFloat(kasa.mana_mavi)||0, my = parseFloat(kasa.mana_yesil)||0;

  const moralRenk = moral >= 70 ? '#2ecc71' : (moral >= 40 ? '#f39c12' : '#e74c3c');
  const nufusYuzde = siniri > 0 ? Math.min(100, Math.round(mevcut / siniri * 100)) : 0;
  const nufusRenk = nufusYuzde >= 95 ? '#e74c3c' : (nufusYuzde >= 80 ? '#f39c12' : '#2ecc71');
  const alanYuzde = alanT > 0 ? Math.round(alanK / alanT * 100) : 0;
  const alanRenk = alanYuzde >= 90 ? '#e74c3c' : (alanYuzde >= 75 ? '#f39c12' : '#d4af37');

  hudEl.innerHTML = `
    <div class="card" style="padding:8px 12px;margin-bottom:12px;background:linear-gradient(90deg,rgba(212,175,55,0.05),transparent);border-left:3px solid var(--race-color);display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:11px">
      <span style="font-family:Cinzel,serif;color:var(--race-color);font-weight:bold;font-size:13px">🏰 [${g.tag}] ${g.isim}</span>
      <span style="color:#888">|</span>
      <span>👥 Nüfus: <b style="color:${nufusRenk}">${mevcut}/${siniri}</b> <span style="color:#666">(%${nufusYuzde})</span></span>
      <span style="color:#888">|</span>
      <span>🎖 Moral: <b style="color:${moralRenk}">${moral}/100</b></span>
      <span style="color:#888">|</span>
      <span>📐 Alan: <b style="color:${alanRenk}">${alanK}/${alanT}</b> <span style="color:#666">(%${alanYuzde})</span></span>
      <span style="color:#888">|</span>
      <span>🙏 WS: <b style="color:#9b59b6">${wsT}</b></span>
      ${mb+mk+mm+my > 0 ? `
      <span style="color:#888">|</span>
      <span>🔮 Mana:
        <b style="color:#ecf0f1">${mb.toFixed(0)}</b>/
        <b style="color:#e74c3c">${mk.toFixed(0)}</b>/
        <b style="color:#3498db">${mm.toFixed(0)}</b>/
        <b style="color:#2ecc71">${my.toFixed(0)}</b>
      </span>` : ''}
      <span style="color:#888">|</span>
      <span style="color:#666;font-size:10px">Uye: ${data.uye_sayisi || 0}</span>
    </div>
  `;
}

function renderGuildTabs(el, data) {
  // v1.13.25 FIX: Backend alanlari data.benim_yetkilerim + data.benim_rutbem (data.uye DIYE bir alan YOK)
  var yetkiler = data.benim_yetkilerim || {};
  var rutbe = data.benim_rutbem || 'uye';
  var gorunurTabs = GUILD_TABS.filter(function(t) {
    if (!t.yetki) return true; // yetki gerekmiyorsa herkes gorur
    if (rutbe === 'lider') return true; // lider her seyi gorur
    return yetkiler[t.yetki] === true;
  });

  var tabBar = '<div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:12px;border-bottom:1px solid #222;padding-bottom:8px">' +
    gorunurTabs.map(function(t) {
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
    case 'diplomasi': renderTabDiplomasi(el, data); break;
    case 'sohbet':   renderTabSohbet(el, data); break;
    case 'arastirma':renderTabArastirma(el, data); break;
    case 'ekonomi-ozet': renderTabEkonomiOzet(el, data); break;
    case 'uye-ozet': renderTabUyeOzet(el, data); break;
    case 'kusatma':  renderTabKusatma(el, data); break;
    case 'savas':    if (typeof renderTabSavasOdasi === 'function') renderTabSavasOdasi(el, data); else el.innerHTML = '<div class="card" style="padding:20px;color:#e74c3c">page-guild-savas.js yuklenemedi</div>'; break;
    default:        el.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:#555"><div style="font-size:30px;margin-bottom:8px">🔒</div><p style="font-size:12px">Bu ozellik Faz 3\'te aktif olacak.</p></div>';
  }
}

// ═══════════════════════════════════
//   TAB: KUSATMA (v1.13.39 Faz 3b.0)
// ═══════════════════════════════════
var KUSATMA_DATA = null;

async function renderTabKusatma(el, data) {
  el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:#888">Kusatma durumu yukleniyor...</div>';
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/guild/' + data.guild.id + '/kusatma-durum',
      { headers: { Authorization: 'Bearer ' + token } }).then(function(r){ return r.json(); });
    if (!r.ok) { el.innerHTML = '<div class="card" style="padding:20px;color:#e74c3c">Hata: ' + (r.error||'bilinmeyen') + '</div>'; return; }
    KUSATMA_DATA = r;
    renderKusatmaIcerik(el, data);
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;color:#e74c3c">Sunucu hatasi</div>'; }
}

function renderKusatmaIcerik(el, data) {
  var r = KUSATMA_DATA;
  var korumaRenk = r.korumali ? '#2ecc71' : '#666';
  var korumaIkon = r.korumali ? '✅' : '⚪';
  var korumaMetin = r.korumali ? 'KORUMA AKTIF (Kusatma devam ediyor — uye sehirleri saldiriya kapali)' : 'Koruma yok (kusatma aktif degil)';

  // Ordu listesi (yetki kontrol)
  var yetkiler = data.benim_yetkilerim || {};
  var isLider = data.benim_rutbem === 'lider';
  var gonderebilir = isLider || yetkiler.guild_ordusu_gonder;

  // Mevcut guild ordulari (sehirde ve yeterli unite)
  // v1.14.1.01 FIX: r.ordu_listesi (kusatma-durum response) — data.ordu_listesi DEGIL
  var minOrdu = (r.config && r.config.kusatma_min_ordu) || 500;
  var orduListesi = (r.ordu_listesi || r.guild_ordular || data.ordu_listesi || []).filter(function(o) {
    return (o.durum === 'sehirde' || !o.durum) && (o.toplam_unite || 0) >= minOrdu;
  });

  var kadimOpsiyonlar = (r.kadim_sehirler || []).map(function(s) {
    var kilit = (s.kusatma_durumu === 'kusatmada' || s.kusatma_durumu === 'tutuluyor') && s.holding_guild_id && s.holding_guild_id !== data.guild.id;
    return '<option value="' + s.id + '"' + (kilit?' disabled':'') + '>' + s.isim + ' (' + s.taraf + ') — ' + s.kusatma_durumu + (kilit?' [kapali]':'') + '</option>';
  }).join('');

  var orduOpsiyonlar = orduListesi.map(function(o) {
    return '<option value="' + o.id + '">' + o.isim + ' (' + (o.toplam_unite||0) + ' unite)</option>';
  }).join('');

  var gonderForm = '';
  if (gonderebilir) {
    gonderForm =
      '<div class="card" style="padding:12px;margin-bottom:10px">' +
        '<h4 style="margin:0 0 8px;font-size:12px;color:#d4af37">⚔️ Kusatma Baslat</h4>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
          '<select id="kus-sehir" style="padding:4px;background:#1a1a1a;border:1px solid #333;color:#ddd;font-size:11px">' + kadimOpsiyonlar + '</select>' +
          '<select id="kus-ordu" style="padding:4px;background:#1a1a1a;border:1px solid #333;color:#ddd;font-size:11px">' +
            (orduOpsiyonlar || '<option disabled>' + minOrdu + '+ unite ordu yok</option>') +
          '</select>' +
          '<button class="btn-action" onclick="kusatmaGonder(' + data.guild.id + ')" style="padding:4px 12px;font-size:11px;width:auto">Gonder</button>' +
          // v1.14.1.08: Test savasi — DB'ye yazmaz, rapor doner
          '<button onclick="kusatmaSimule(' + data.guild.id + ')" style="padding:4px 12px;font-size:11px;background:#2980b9;color:#fff;border:1px solid #1a5682;border-radius:3px;cursor:pointer" title="Savas simulasyonu — DB etkilenmez, rapor onizleme">🎯 Test Savasi</button>' +
        '</div>' +
        '<div style="font-size:10px;color:#666;margin-top:4px">Min ' + minOrdu + ' unite | Grace ' + (r.config.grace_periyot_pg) + ' PG | Holding ' + (r.config.holding_sure_pg) + ' PG</div>' +
      '</div>';
  }

  var aktifOrdularHtml = '';
  if (r.aktif_ordular && r.aktif_ordular.length > 0) {
    aktifOrdularHtml = '<div class="card" style="padding:10px;margin-bottom:10px">' +
      '<h4 style="margin:0 0 6px;font-size:12px;color:#d4af37">🚶 Aktif Ordular</h4>' +
      r.aktif_ordular.map(function(o) {
        var durumRenk = o.durum==='kusatmada'?'#e74c3c':(o.durum==='yolda_gidis'?'#f39c12':'#3498db');
        var varis = o.varis_zamani ? 'Varis: ' + new Date(o.varis_zamani).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) : '';
        var hedef = o.sehir_isim ? '→ ' + o.sehir_isim : '';
        var geriCagir = o.durum === 'kusatmada' || o.durum === 'yolda_gidis' ?
          ' <button class="btn-action" onclick="kusatmaGeriCagir(' + data.guild.id + ',' + o.id + ')" style="padding:2px 8px;font-size:11px;width:auto;border-color:#f39c12;color:#f39c12">Geri Cagir</button>' : '';
        return '<div style="font-size:11px;padding:3px 0;border-top:1px solid #222">' +
          '<b>' + o.isim + '</b> ' + hedef + ' <span style="color:' + durumRenk + '">[' + o.durum + ']</span> <span style="color:#666">' + (o.toplam_unite||0) + ' unite | ' + varis + '</span>' + geriCagir +
        '</div>';
      }).join('') +
    '</div>';
  }

  var tutulanHtml = '';
  if (r.tutulan_sehirler && r.tutulan_sehirler.length > 0) {
    tutulanHtml = '<div class="card" style="padding:10px;margin-bottom:10px;border-left:3px solid #d4af37">' +
      '<h4 style="margin:0 0 6px;font-size:12px;color:#d4af37">🏛️ Tuttugumuz Kadim Sehirler</h4>' +
      r.tutulan_sehirler.map(function(s) {
        var kalan = s.zafer_zamani ? Math.max(0, (new Date(s.zafer_zamani).getTime() - Date.now()) / 3600000) : 0;
        var graceKalan = s.grace_bitis ? Math.max(0, (new Date(s.grace_bitis).getTime() - Date.now()) / 3600000) : 0;
        return '<div style="font-size:11px;padding:3px 0">' +
          '<b>' + s.isim + '</b> <span style="color:#2ecc71">[' + s.kusatma_durumu + ']</span> ' +
          (s.kusatma_durumu === 'tutuluyor' ? '<span style="color:#f1c40f">Zafere ' + kalan.toFixed(1) + ' PG</span>' : '') +
          (s.kusatma_durumu === 'grace' ? '<span style="color:#f39c12">Grace kalan: ' + graceKalan.toFixed(1) + ' PG</span>' : '') +
        '</div>';
      }).join('') +
    '</div>';
  }

  var logHtml = '';
  if (r.son_loglar && r.son_loglar.length > 0) {
    logHtml = '<div class="card" style="padding:10px">' +
      '<h4 style="margin:0 0 6px;font-size:12px;color:#888">📜 Son Olaylar</h4>' +
      r.son_loglar.map(function(l, idx) {
        var t = new Date(l.created_at).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        // v1.14.1.07: savas_turu → Detayli Rapor butonu (oyuncu rapor modali)
        var expandId = 'kus-log-' + idx;
        var hasDetail = l.olay === 'savas_turu' && l.detay;
        var baslik = '<span style="color:#666">' + t + '</span> | <b>' + l.olay + '</b> ' + (l.sehir_isim||'');
        if (!hasDetail) {
          return '<div style="font-size:10px;color:#aaa;padding:2px 0;border-top:1px solid #222">' + baslik + '</div>';
        }
        // v1.14.1.07: DETAYLI RAPOR butonu (log.id ile)
        var detayliBtn = l.id ? '<button onclick="kusatmaRaporDetayli(' + data.guild.id + ',' + l.id + ')" style="font-size:10px;padding:3px 10px;background:#c0392b;color:#fff;border:1px solid #8b1a1a;border-radius:3px;cursor:pointer;margin-left:8px">📜 Detaylı Rapor</button>' : '';
        var d = (typeof l.detay === 'string') ? (function(){ try{return JSON.parse(l.detay)}catch(e){return {}} })() : l.detay;
        var turler = d.turler || [];
        var guildDmg = d.guild_damage || {};
        var ordular = d.ordular || [];
        var turTable = turler.map(function(t){
          return '<tr><td>Tur ' + t.tur + '</td><td style="color:#9b59b6">NPC Guc: <b>' + (t.npc_guc||0).toLocaleString('tr-TR') + '</b></td><td style="color:#e74c3c">NPC Kayip: <b>' + (t.npc_kayip||0).toLocaleString('tr-TR') + '</b></td><td style="color:#f39c12">Guild ATK: <b>' + (t.guild_atk||0).toLocaleString('tr-TR') + '</b></td><td>' + (t.ordu_sayisi||0) + ' ordu</td></tr>';
        }).join('');
        var orduList = ordular.map(function(o){
          var sonuc = o.unite > 0 ? ('kalan <b style="color:#2ecc71">' + o.unite + '</b>') : '<b style="color:#e74c3c">YOK EDILDI</b>';
          return '<div style="padding:2px 0;font-size:10px">⚔️ <b>' + o.isim + '</b> (guild ' + o.guild_id + ') — ' + sonuc + '</div>';
        }).join('');
        var dmgList = Object.entries(guildDmg).map(function(e){
          return '<span style="background:rgba(212,175,55,0.1);padding:1px 6px;border-radius:3px;margin:2px">Guild ' + e[0] + ': <b>' + parseInt(e[1]).toLocaleString("tr-TR") + '</b> hasar</span>';
        }).join(' ');
        return '<div style="font-size:10px;color:#aaa;padding:4px 0;border-top:1px solid #222">' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<span style="cursor:pointer" onclick="document.getElementById(\'' + expandId + '\').style.display = document.getElementById(\'' + expandId + '\').style.display===\'none\' ? \'block\' : \'none\'">' +
              baslik + ' <span style="color:#c8a96e;font-size:9px">(tıkla → ozet ▼)</span>' +
            '</span>' +
            detayliBtn +
          '</div>' +
          '<div id="' + expandId + '" style="display:none;margin-top:6px;padding:8px;background:rgba(0,0,0,0.3);border:1px solid #2a2a2a;border-radius:4px">' +
            '<div style="color:#c8a96e;font-weight:bold;margin-bottom:4px;font-size:11px">⚔️ Savaş Detayı — ' + turler.length + ' tur</div>' +
            (turTable ? '<table style="width:100%;font-size:10px;color:#ccc;border-collapse:collapse"><thead><tr style="color:#888"><th style="text-align:left;padding:3px">#</th><th style="text-align:left;padding:3px">NPC Güç</th><th style="text-align:left;padding:3px">NPC Kayıp</th><th style="text-align:left;padding:3px">Guild ATK</th><th style="text-align:left;padding:3px">Aktif</th></tr></thead><tbody>' + turTable + '</tbody></table>' : '') +
            '<div style="margin-top:8px;color:#888;font-size:10px">NPC Son Güç: <b style="color:#9b59b6">' + (d.npc_guc_kalan||0).toLocaleString('tr-TR') + '</b></div>' +
            (orduList ? '<div style="margin-top:6px">' + orduList + '</div>' : '') +
            (dmgList ? '<div style="margin-top:6px;font-size:10px;color:#888">🏆 Hasar Sıralaması: ' + dmgList + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  el.innerHTML =
    '<div class="card" style="padding:10px;margin-bottom:10px;border-left:3px solid ' + korumaRenk + '">' +
      '<div style="font-size:13px;color:' + korumaRenk + '">' + korumaIkon + ' ' + korumaMetin + '</div>' +
    '</div>' +
    gonderForm + aktifOrdularHtml + tutulanHtml + logHtml;
}

async function kusatmaGonder(guildId) {
  var sehirEl = document.getElementById('kus-sehir');
  var orduEl = document.getElementById('kus-ordu');
  if (!sehirEl.value || !orduEl.value) { toast('Sehir ve ordu secin'); return; }
  var token = getToken();
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/ordu/kusatma-gonder', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ army_id: parseInt(orduEl.value), hedef_sehir_id: parseInt(sehirEl.value) })
    }).then(function(r){ return r.json(); });
    if (r.ok) { toast(r.mesaj || 'Ordu yolda'); if (typeof loadGuildData==='function') loadGuildData(); }
    else toast(r.error || 'Hata');
  } catch(e) { toast('Sunucu hatasi'); }
}

async function kusatmaGeriCagir(guildId, armyId) {
  if (!confirm('Ordu geri cagirilacak. Emin misiniz?')) return;
  var token = getToken();
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/ordu/' + armyId + '/kusatma-geri-cagir', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }
    }).then(function(r){ return r.json(); });
    if (r.ok) { toast(r.mesaj); if (typeof loadGuildData==='function') loadGuildData(); }
    else toast(r.error || 'Hata');
  } catch(e) { toast('Sunucu hatasi'); }
}

/* v1.14.1.07 — Kusatma savas_turu detayli rapor (oyuncu rapor modalı) */
async function kusatmaRaporDetayli(guildId, logId) {
  var token = getToken();
  if (!token) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/kusatma-rapor/' + logId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    var d = await r.json();
    if (!r.ok || !d.ok) {
      if (typeof toast === 'function') toast(d.error || 'Rapor yuklenemedi');
      else alert(d.error || 'Rapor yuklenemedi');
      return;
    }
    if (typeof showSavasRapor === 'function') {
      showSavasRapor(d.sonuc, d.benimTaraf || 'saldiran', d.opts || {});
    } else {
      alert('Rapor modalı yuklenemedi — sayfayi yenile');
    }
  } catch(e) {
    alert('Baglanti hatasi: ' + e.message);
  }
}
if (typeof window !== 'undefined') window.kusatmaRaporDetayli = kusatmaRaporDetayli;

/* v1.14.1.08 — Test Savas Simulasyonu (DB'ye yazmaz) */
async function kusatmaSimule(guildId) {
  var token = getToken(); if (!token) return;
  var sehirSel = document.getElementById('kus-sehir');
  if (!sehirSel || !sehirSel.value) { alert('Once bir kadim sehir sec'); return; }
  var sehirId = parseInt(sehirSel.value);
  var orduSel = document.getElementById('kus-ordu');
  var orduIdRaw = orduSel && orduSel.value && !orduSel.selectedOptions[0]?.disabled ? parseInt(orduSel.value) : null;

  try {
    var body = orduIdRaw ? JSON.stringify({ army_id: orduIdRaw }) : '{}';
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/kusatma-simule/' + sehirId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: body,
    });
    var d = await r.json();
    if (!r.ok || !d.ok) {
      alert('Simulasyon hata: ' + (d.error || 'Bilinmeyen'));
      return;
    }
    if (typeof showSavasRapor === 'function') {
      showSavasRapor(d.sonuc, d.benimTaraf || 'saldiran', d.opts || {});
    } else {
      alert('Rapor modali yuklenemedi');
    }
  } catch(e) {
    alert('Baglanti hatasi: ' + e.message);
  }
}
if (typeof window !== 'undefined') window.kusatmaSimule = kusatmaSimule;

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
      (isLider ? '<div style="margin-bottom:8px"><textarea id="guild-duyuru-inp" rows="2" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px" placeholder="Duyuru yaz...">' + (g.duyuru||'') + '</textarea><button class="btn-action" style="width:auto;padding:3px 10px;font-size:11px;margin-top:2px" onclick="guildDuyuruKaydet(' + g.id + ')">Kaydet</button></div>' : '') +
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
        '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">👥 Nufus & İşçiler</div>' +
        '<div style="margin-bottom:6px;font-size:10px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="color:#888">Nufus</span><span style="color:' + doluRenk + ';font-weight:bold">' + fmt(mevcutNufus) + ' / ' + fmt(nufusSiniri) + '</span></div>' +
          '<div style="height:4px;background:#0a0a0a;border-radius:2px;overflow:hidden"><div style="width:' + doluYuzde + '%;height:100%;background:' + doluRenk + '"></div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:10px;margin-bottom:6px">' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:11px">Köylü</div><div style="color:#d4af37;font-weight:bold">' + fmt(n.koylu||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:11px">Asker</div><div style="color:#e74c3c;font-weight:bold">' + fmt(n.asker||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:11px">WS</div><div style="color:#9b59b6;font-weight:bold">' + fmt(wsToplam) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:#777">' +
          (w.oduncu ? '<span>🪓 Oduncu: ' + w.oduncu + '</span>' : '') +
          (w.madenci ? '<span>⛏️ Madenci: ' + w.madenci + '</span>' : '') +
          (w.ciftci ? '<span>🌾 Ciftci: ' + w.ciftci + '</span>' : '') +
          (w.balikci ? '<span>🎣 Balikci: ' + w.balikci + '</span>' : '') +
          (w.tuccar ? '<span>💼 Tüccar: ' + w.tuccar + '</span>' : '') +
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
        '<div style="font-size:11px;color:#555;margin-top:4px">Maas odenirse +5 (max 100), odenemezse -10</div>' +
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
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:11px">Beyaz</div><div style="color:#ecf0f1;font-weight:bold">' + mb.toFixed(1) + '</div></div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:11px">Kirmizi</div><div style="color:#e74c3c;font-weight:bold">' + mk.toFixed(1) + '</div></div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:11px">Mavi</div><div style="color:#3498db;font-weight:bold">' + mm.toFixed(1) + '</div></div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center"><div style="color:#888;font-size:11px">Yesil</div><div style="color:#2ecc71;font-weight:bold">' + my.toFixed(1) + '</div></div>' +
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
                '<button class="btn-action" style="width:auto;padding:3px 12px;font-size:11px" onclick="guildSehirTasi(' + g.id + ')">Tasi</button>' +
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
            '<div style="color:#888;font-size:11px">Ordular</div><div style="color:#d4af37;font-weight:bold">' + (vs.ordu_sayisi||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:11px">Uniteler</div><div style="color:#2ecc71;font-weight:bold">' + fmt(vs.toplam_unite||0) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:11px">ATK</div><div style="color:#e74c3c;font-weight:bold">' + fmt(Math.floor(vs.toplam_atk||0)) + '</div>' +
          '</div>' +
          '<div style="background:#0a0a0a;padding:4px 8px;border-radius:4px;text-align:center">' +
            '<div style="color:#888;font-size:11px">DEF</div><div style="color:#3498db;font-weight:bold">' + fmt(Math.floor(vs.toplam_def||0)) + '</div>' +
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

  // v1.14.0.39: Gelen uyelik istekleri paneli (oyuncu_kabul yetkisi)
  var istekHTML = '';
  if (myYetkiler.oyuncu_kabul) {
    istekHTML = '<div class="card" style="margin-bottom:10px;padding:10px;border-left:3px solid #f39c12">' +
      '<div style="font-size:12px;font-weight:bold;color:#f39c12;margin-bottom:8px">📨 Gelen Üyelik İstekleri <span id="gi-count" style="color:#888;font-size:10px">(yükleniyor)</span></div>' +
      '<div id="gelen-istekler-wrap" style="font-size:11px;color:#888">Yükleniyor...</div>' +
    '</div>';
    setTimeout(function(){ _loadGelenIstekler(g.id); }, 100);
  }

  var uyeHTML = uyeler.map(function(u) {
    var rutbeIcon = u.rutbe === 'lider' ? '👑' : u.rutbe === 'yardimci' ? '⭐' : '🏅';
    var aksiyonlar = '';

    // Takviye
    if (u.player_id !== data.benim_player_id) {
      aksiyonlar += '<button style="background:none;border:1px solid #9b59b6;color:#9b59b6;cursor:pointer;font-size:11px;border-radius:3px;padding:1px 6px" onclick="guildTakviyeGonder(' + u.player_id + ',\'' + (u.kullanici_adi||'').replace(/'/g,'') + '\')">🛡️</button>';
    }

    // Lider islemleri
    if (isLider && u.player_id !== g.lider_id) {
      // v1.14.0.44: Taraf kisiti kaldirildi — guildler.taraf kuruluste sabit, lider degisse bile uretim ayni
      aksiyonlar += '<button style="background:none;border:1px solid #f1c40f;color:#f1c40f;cursor:pointer;font-size:11px;border-radius:3px;padding:1px 6px" onclick="guildLiderlikDevret(' + g.id + ',' + u.player_id + ',\'' + (u.kullanici_adi||'').replace(/\'/g,'') + '\')">👑 Lider Yap</button>' +
        '<button style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:11px" onclick="guildAt(' + g.id + ',' + u.player_id + ')">At</button>' +
        '<select style="background:#111;border:1px solid #333;color:#ddd;font-size:11px;border-radius:3px;padding:1px" onchange="guildRutbe(' + g.id + ',' + u.player_id + ',this.value)">' +
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
      '<span>' + rutbeIcon + ' ' + u.kullanici_adi + ' <span style="color:#555;font-size:11px">Cag ' + (u.cag||1) + extraInfo + '</span></span>' +
      '<div style="display:flex;gap:4px;align-items:center">' + aksiyonlar + '</div>' +
    '</div>';
  }).join('');

  // Yetki yonetimi (sadece lider veya yetki_duzenle yetkisi)
  var yetkiHTML = '';
  if (myYetkiler.yetki_duzenle) {
    yetkiHTML = '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🔑 Yetki Yonetimi</div>' +
      '<p style="font-size:11px;color:#555;margin-bottom:8px">Uye ismine tiklayarak yetkilerini duzenleyebilirsiniz</p>' +
      '<div id="guild-yetki-panel">Yukleniyor...</div>' +
    '</div>';
  }

  el.innerHTML =
    istekHTML +
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">👥 Uyeler (' + uyeler.length + ')</div>' +
      uyeHTML +
    '</div>' +
    yetkiHTML;

  if (myYetkiler.yetki_duzenle) guildYetkilerYukle(g.id);
}

// v1.14.0.39: Gelen uyelik istekleri
async function _loadGelenIstekler(guildId) {
  var wrap = document.getElementById('gelen-istekler-wrap');
  var cnt = document.getElementById('gi-count');
  if (!wrap) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/uyelik-istekleri', { headers: guildHdr() });
    var d = await r.json();
    if (!r.ok) { wrap.innerHTML = '<span style="color:#e74c3c">' + (d.error||'Hata') + '</span>'; return; }
    var ist = d.istekler || [];
    if (cnt) cnt.textContent = '(' + ist.length + ')';
    if (ist.length === 0) { wrap.innerHTML = '<div style="color:#666;font-size:10px">Bekleyen istek yok</div>'; return; }
    wrap.innerHTML = ist.map(function(i){
      var tarih = new Date(i.created_at).toLocaleString('tr-TR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});
      return '<div style="padding:8px 10px;background:#111;border-radius:4px;margin-bottom:6px;border-left:3px solid #f39c12">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">' +
          '<div>' +
            '<div><b style="color:#f39c12">' + (i.kral||'?') + '</b> <span style="color:#666;font-size:11px">ID ' + i.player_id + ' · Çağ ' + (i.cag||1) + ' · ' + (i.taraf||'?') + ' · ' + (i.irk||'?') + '</span></div>' +
            (i.mesaj ? '<div style="color:#ccc;font-size:10px;font-style:italic;margin-top:3px">"' + i.mesaj.replace(/</g,'&lt;') + '"</div>' : '') +
            '<div style="color:#555;font-size:11px;margin-top:2px">' + tarih + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:4px">' +
            '<button class="btn-action" onclick="istekKabul(' + guildId + ',' + i.player_id + ')" style="background:#27ae60;color:#fff;font-size:10px;padding:4px 10px">✅ Kabul</button>' +
            '<button class="btn-action" onclick="istekRed(' + guildId + ',' + i.player_id + ')" style="background:#95a5a6;color:#fff;font-size:10px;padding:4px 10px">❌ Reddet</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) { wrap.innerHTML = '<span style="color:#e74c3c">' + e.message + '</span>'; }
}

async function istekKabul(guildId, playerId) {
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/uyelik-istek/' + playerId + '/kabul', { method:'POST', headers: guildHdr() });
    var d = await r.json();
    if (r.ok) { if (typeof toast === 'function') toast(d.mesaj); loadGuild(); }
    else alert(d.error || 'Hata');
  } catch(e) { alert(e.message); }
}

async function istekRed(guildId, playerId) {
  if (!confirm('Bu isteği reddetmek istediğine emin misin?')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/uyelik-istek/' + playerId + '/red', { method:'POST', headers: guildHdr() });
    var d = await r.json();
    if (r.ok) { _loadGelenIstekler(guildId); }
    else alert(d.error || 'Hata');
  } catch(e) { alert(e.message); }
}

// v1.14.0.42 B1: Liderlik devret
async function guildLiderlikDevret(guildId, playerId, isim) {
  if (!confirm('⚠️ LİDERLİK DEVRİ!\n\n' + isim + ' oyuncusuna liderliği devretmek istediğine EMİN MİSİN?\n\nSen "yardımcı" rütbesine düşeceksin. Geri alınamaz (yeni lider tekrar sana devretmedikçe).')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + guildId + '/liderlik-devret', {
      method:'POST', headers: guildHdr(), body: JSON.stringify({ yeni_lider_id: playerId })
    });
    var d = await r.json();
    if (r.ok) { alert('👑 ' + (d.mesaj || 'Devredildi')); loadGuild(); }
    else alert(d.error || 'Hata');
  } catch(e) { alert(e.message); }
}

// v1.14.0.42 A2: Guild Sohbet
async function renderTabSohbet(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div class="card" style="padding:12px"><h3 style="color:#3498db;margin-top:0">💬 Guild Sohbet</h3>' +
    '<div id="sohbet-list" style="max-height:450px;overflow-y:auto;background:#0a0a0a;border:1px solid #222;border-radius:4px;padding:8px;font-size:11px;margin-bottom:8px">Yükleniyor...</div>' +
    '<div style="display:flex;gap:4px">' +
      '<input id="sohbet-inp" type="text" maxlength="500" placeholder="Mesajın..." onkeypress="if(event.key===\'Enter\')sohbetGonder(' + gId + ')" style="flex:1;padding:6px;background:#111;border:1px solid #444;color:#ddd;border-radius:4px;font-size:11px">' +
      '<button class="btn-action" style="width:auto;padding:6px 14px;font-size:11px" onclick="sohbetGonder(' + gId + ')">Gönder</button>' +
    '</div>' +
    '<div style="font-size:11px;color:#666;margin-top:6px">Son 50 mesaj · Lider/yardımcı tüm mesajları silebilir, diğer üyeler sadece kendi mesajını</div></div>';
  await _loadSohbet(gId, data.benim_player_id, data.benim_rutbem);
  // Auto-refresh 20 sn
  if (window._sohbetIntv) clearInterval(window._sohbetIntv);
  window._sohbetIntv = setInterval(function(){ _loadSohbet(gId, data.benim_player_id, data.benim_rutbem); }, 20000);
}

async function _loadSohbet(gId, benId, benRutbe) {
  var wrap = document.getElementById('sohbet-list');
  if (!wrap) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + gId + '/chat', { headers: guildHdr() });
    var d = await r.json();
    if (!r.ok) { wrap.innerHTML = '<span style="color:#e74c3c">' + (d.error||'Hata') + '</span>'; return; }
    var ms = d.mesajlar || [];
    if (!ms.length) { wrap.innerHTML = '<div style="color:#666;text-align:center;padding:10px">Henüz mesaj yok. İlk olmaya cesaret et!</div>'; return; }
    var silYetki = benRutbe === 'lider' || benRutbe === 'yardimci';
    wrap.innerHTML = ms.map(function(m){
      var ikon = m.yazan_rutbe === 'lider' ? '👑' : m.yazan_rutbe === 'yardimci' ? '⭐' : '🏅';
      var renk = m.yazan_rutbe === 'lider' ? '#f1c40f' : m.yazan_rutbe === 'yardimci' ? '#3498db' : '#95a5a6';
      var tarih = new Date(m.created_at).toLocaleString('tr-TR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});
      var silBtn = (silYetki || m.player_id === benId) ? ' <button onclick="sohbetSil(' + gId + ',' + m.id + ')" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:10px" title="Sil">🗑</button>' : '';
      return '<div style="padding:5px 6px;border-bottom:1px solid #1a1a1a">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span>' + ikon + ' <b style="color:' + renk + '">' + (m.kral || '?') + '</b></span>' +
          '<span style="color:#555;font-size:11px">' + tarih + silBtn + '</span>' +
        '</div>' +
        '<div style="color:#ddd;margin-top:2px;word-break:break-word">' + (m.mesaj||'').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>' +
      '</div>';
    }).join('');
    wrap.scrollTop = wrap.scrollHeight;
  } catch(e) { wrap.innerHTML = '<span style="color:#e74c3c">' + e.message + '</span>'; }
}

async function sohbetGonder(gId) {
  var inp = document.getElementById('sohbet-inp');
  var msj = (inp?.value || '').trim();
  if (!msj) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + gId + '/chat', {
      method:'POST', headers: guildHdr(), body: JSON.stringify({ mesaj: msj })
    });
    var d = await r.json();
    if (r.ok) { inp.value = ''; _loadSohbet(gId, GUILD_DATA.benim_player_id, GUILD_DATA.benim_rutbem); }
    else alert(d.error || 'Hata');
  } catch(e) { alert(e.message); }
}
async function sohbetSil(gId, mid) {
  if (!confirm('Mesajı sil?')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + gId + '/chat/' + mid, { method:'DELETE', headers: guildHdr() });
    if (r.ok) _loadSohbet(gId, GUILD_DATA.benim_player_id, GUILD_DATA.benim_rutbem);
    else { var d = await r.json(); alert(d.error || 'Hata'); }
  } catch(e) { alert(e.message); }
}

// v1.14.0.42 D: Arastirma / Tech Tree
async function renderTabArastirma(el, data) {
  var gId = data.guild.id;
  var isLiderYard = data.benim_rutbem === 'lider' || data.benim_rutbem === 'yardimci';
  el.innerHTML = '<div class="card" style="padding:12px"><h3 style="color:#9b59b6;margin-top:0">🔬 Guild Araştırma (Tech Tree)</h3>' +
    '<div id="arastirma-content" style="font-size:11px">Yükleniyor...</div></div>';
  try {
    var r = await fetch(API_BASE + '/api/guild/' + gId + '/arastirma', { headers: guildHdr() });
    var d = await r.json();
    if (!r.ok) { document.getElementById('arastirma-content').innerHTML = '<span style="color:#e74c3c">' + (d.error||'Hata') + '</span>'; return; }
    var cfg = d.config || {};
    var sev = d.seviyeler || {};
    var kyr = {};
    (d.kuyruk || []).forEach(function(k){ kyr[k.teknoloji] = k; });

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
    Object.keys(cfg).forEach(function(key){
      var tek = cfg[key];
      if (!tek || !tek.max_sev) return; // baz_maliyet/sure_pg gibi ayar alanlarını atla
      var mev = sev[key] || 0;
      var hedef = mev + 1;
      var kuyruk = kyr[key];
      var maxSev = tek.max_sev;
      var yuzde = tek.etki_yuzde || 0;
      var toplamYuzde = mev * yuzde;
      var bitisMs = kuyruk ? new Date(kuyruk.bitis).getTime() - Date.now() : 0;
      var kalanPg = kuyruk ? Math.ceil(bitisMs / 3600000) : 0;

      // Maliyet K{hedef}
      var baz = cfg.baz_maliyet || { odun:50000, metal:50000, altin:10000, islenmis:5000 };
      var carpan = Math.pow(2, hedef - 1);
      var maliyetStr = Object.entries(baz).map(function(kv){ return '<span style="color:#d4af37">' + (kv[1] * carpan).toLocaleString('tr-TR') + ' ' + kv[0] + '</span>'; }).join(' · ');

      html += '<div style="padding:10px;background:#111;border-left:3px solid ' + (mev >= maxSev ? '#2ecc71' : '#9b59b6') + ';border-radius:4px">' +
        '<div style="font-size:13px;color:#9b59b6;font-weight:bold">' + (tek.isim || key) + '</div>' +
        '<div style="font-size:10px;color:#888;margin:2px 0 6px">' + (tek.aciklama || '') + '</div>' +
        '<div style="margin-bottom:6px">' +
          '<span style="color:#ccc">Seviye: <b>' + mev + '/' + maxSev + '</b></span>' +
          (toplamYuzde > 0 ? ' · <span style="color:#2ecc71">+' + toplamYuzde + '% aktif</span>' : '') +
        '</div>' +
        '<div style="height:6px;background:#0a0a0a;border-radius:3px;overflow:hidden;margin-bottom:6px">' +
          '<div style="width:' + (mev/maxSev*100) + '%;height:100%;background:#9b59b6"></div>' +
        '</div>' +
        (kuyruk ? '<div style="color:#f39c12;font-size:10px">⏳ K' + kuyruk.hedef_seviye + ' araştırılıyor · ' + kalanPg + ' PG kaldı</div>'
         : mev >= maxSev ? '<div style="color:#2ecc71;font-size:10px">✅ Max seviye</div>'
         : isLiderYard ?
            '<div style="font-size:11px;color:#888;margin-bottom:4px">K' + hedef + ' maliyet: ' + maliyetStr + '</div>' +
            '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px;background:#9b59b6;color:#fff" onclick="arastirmaBaslat(' + gId + ',\'' + key + '\')">🔬 K' + hedef + ' Başlat (' + (cfg.sure_pg || 12) + ' PG)</button>'
         : '<div style="font-size:10px;color:#666">Lider/yardımcı başlatabilir</div>'
        ) +
      '</div>';
    });
    html += '</div>';
    html += '<div style="font-size:10px;color:#888;margin-top:10px;padding:8px;background:#0a0a0a;border-left:2px solid #666">' +
      '<b>NOT:</b> <b>Üretim</b> ve <b>Ekonomi</b> teknolojileri aktif — tüm üyelerin saatlik üretiminde bonus. ' +
      '<b>Savunma / Ordu Disiplini / Hızlı İnşaat</b> teknolojileri seviyeleri kaydedilir; savaş motoru entegrasyonu bir sonraki sürümde (şimdilik görünür, pasif).' +
      '</div>';
    document.getElementById('arastirma-content').innerHTML = html;
  } catch(e) {
    document.getElementById('arastirma-content').innerHTML = '<span style="color:#e74c3c">' + e.message + '</span>';
  }
}

async function arastirmaBaslat(gId, teknoloji) {
  if (!confirm('Bu teknolojiyi araştırmaya başlatmak istiyor musun? Guild kasasından maliyet düşülecek.')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild/' + gId + '/arastirma/yukselt', {
      method:'POST', headers: guildHdr(), body: JSON.stringify({ teknoloji: teknoloji })
    });
    var d = await r.json();
    if (r.ok) { alert('🔬 ' + (d.mesaj || 'Başlatıldı')); renderTabArastirma(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert(d.error || 'Hata');
  } catch(e) { alert(e.message); }
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
      guild_unite_uret:'Unite Uret', isci_ata:'İşçi Ata', market_satis:'Market Satis',
      koylu_bagisi:'Köylü Bagisi', vergi_dagit:'Vergi Dagit', market_otosatis:'Oto Satis',
      guild_bina_yap:'Bina Yap'
    };

    // v1.14.0.37: Toggle switch kart formati (ayarlar.html ile ayni stil)
    var YETKI_IKON = {
      oyuncu_kabul:'👋', oyuncu_at:'🚪', yetki_duzenle:'🔑',
      ambar_gor:'📦', sehir_degeri_gor:'🏰', atk_def_gor:'⚔️',
      ambar_istek_onayla:'✅', guild_ordusu_gonder:'🚀', guild_ordusu_kur:'🛡️',
      guild_unite_uret:'⚒️', isci_ata:'👷', market_satis:'🏪',
      koylu_bagisi:'🎁', vergi_dagit:'💰', market_otosatis:'🔄',
      guild_bina_yap:'🏗️'
    };

    var html = '';
    (data.uyeler || []).forEach(function(u) {
      var isLdr = u.rutbe === 'lider';
      var rutbeIkon = isLdr ? '👑' : u.rutbe === 'yardimci' ? '⭐' : '🏅';
      var rutbeRenk = isLdr ? '#f1c40f' : u.rutbe === 'yardimci' ? '#3498db' : '#95a5a6';

      html += '<div class="card" style="margin-bottom:10px;padding:10px;border-left:3px solid ' + rutbeRenk + '">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #222">' +
          '<span style="font-size:18px">' + rutbeIkon + '</span>' +
          '<div style="flex:1">' +
            '<div style="font-size:12px;color:' + rutbeRenk + ';font-weight:bold">' + (u.kullanici_adi || '?') + '</div>' +
            '<div style="font-size:11px;color:#888;text-transform:uppercase">' + u.rutbe + '</div>' +
          '</div>' +
          (isLdr ? '<span style="font-size:11px;color:#666;font-style:italic">lider tüm yetkilere sahip</span>' : '') +
        '</div>' +
        (isLdr ? '' : '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px">');
      if (!isLdr) {
        Object.keys(YETKI_LABEL).forEach(function(k) {
          var acik = !!u.yetkiler[k];
          var inputId = 'yetki-' + u.player_id + '-' + k;
          html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:#0f0f0f;border-radius:4px">' +
            '<span style="font-size:10px;color:#ccc">' + (YETKI_IKON[k]||'•') + ' ' + YETKI_LABEL[k] + '</span>' +
            '<label style="position:relative;display:inline-block;width:32px;height:18px;cursor:pointer;flex-shrink:0">' +
              '<input type="checkbox" id="' + inputId + '" ' + (acik ? 'checked' : '') + ' onchange="guildYetkiToggle(' + guildId + ',' + u.player_id + ',\'' + k + '\',this.checked,\'' + inputId + '\')" style="opacity:0;width:0;height:0">' +
              '<span class="yetki-slider" style="position:absolute;inset:0;background:' + (acik ? '#2ecc71' : '#333') + ';border-radius:10px;transition:.2s"></span>' +
              '<span class="yetki-knob" style="position:absolute;left:' + (acik ? '16px' : '2px') + ';top:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:.2s"></span>' +
            '</label>' +
          '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    if (!html) html = '<div style="color:#666;font-size:10px;padding:10px">Üye yok</div>';
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

// v1.14.0.37: Toggle switch — anlik UI update + backend kaydet
async function guildYetkiToggle(guildId, playerId, yetki, deger, inputId) {
  // Anlik UI guncelle (slider rengi + knob pozisyonu)
  var inp = document.getElementById(inputId);
  if (inp) {
    var label = inp.parentElement;
    var slider = label.querySelector('.yetki-slider');
    var knob = label.querySelector('.yetki-knob');
    if (slider) slider.style.background = deger ? '#2ecc71' : '#333';
    if (knob) knob.style.left = deger ? '16px' : '2px';
  }
  await guildYetkiDegistir(guildId, playerId, yetki, deger);
}

// ═══════════════════════════════════
//   TAB: KASA / AMBAR
// ═══════════════════════════════════
function renderTabKasa(el, data) {
  var g = data.guild;
  var kasa = data.kasa || {};
  var myYetkiler = data.benim_yetkilerim || {};
  // v1.13.47: bagis loglari fetch
  _loadGuildBagislar(g.id);

  // Kasa kaynaklari
  var kasaHTML = ['altin','odun','metal','bugday','balik','kereste','islenmis'].map(function(k) {
    return '<div style="display:flex;align-items:center;gap:4px;font-size:10px"><span>' + (KAYNAK_IKON[k]||'') + '</span><span style="color:#d4af37;font-weight:bold">' + fmt(kasa[k]) + '</span><span style="color:#666">' + k + '</span></div>';
  }).join('');

  // Bagis butonlari (config'e gore dinamik)
  var izinliKaynaklar = (GUILD_CONFIG && GUILD_CONFIG.izinli_kaynaklar) || ['altin','odun','metal'];
  var bagisHTML = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">' +
    izinliKaynaklar.map(function(k) {
      return '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:11px" onclick="guildBagis(' + g.id + ',\'' + k + '\')">' + (KAYNAK_IKON[k]||'📦') + ' ' + k + '</button>';
    }).join('') +
  '</div>';
  // v1.13.67: Bagis cooldown bilgisi — backend'den gelir
  var cdH = (GUILD_DATA && GUILD_DATA.bagis_cooldown && GUILD_DATA.bagis_cooldown.hammadde) || null;
  var cdK = (GUILD_DATA && GUILD_DATA.bagis_cooldown && GUILD_DATA.bagis_cooldown.koylu)    || null;
  // v1.14.0.38: Kalan PG integer (saat basi hassasiyeti, dk gosterme)
  var fmtKalan = function(saat) {
    if (!saat || saat <= 0) return '';
    var pg = Math.ceil(saat);
    return pg + ' PG';
  };
  var cdHText = cdH
    ? (cdH.dolu
        ? '<span style="color:#dc3545">⏳ Dolu — ' + fmtKalan(cdH.kalan_saat) + ' sonra reset</span>'
        : '<span style="color:#5cb85c">✓ ' + cdH.kalan_bagis + '/' + cdH.max + ' hakki kaldi' + (cdH.sayac>0 ? ' (' + fmtKalan(cdH.kalan_saat) + ' sonra reset)' : '') + '</span>')
    : '';
  var cdKText = cdK
    ? (cdK.dolu
        ? '<span style="color:#dc3545">⏳ Dolu — ' + fmtKalan(cdK.kalan_saat) + ' sonra reset</span>'
        : '<span style="color:#5cb85c">✓ ' + cdK.kalan_bagis + '/' + cdK.max + ' hakki kaldi' + (cdK.sayac>0 ? ' (' + fmtKalan(cdK.kalan_saat) + ' sonra reset)' : '') + '</span>')
    : '';

  var limitInfo = '<div style="font-size:11px;color:#555;margin-top:4px">Max: kaynaklarinizin %' + ((GUILD_CONFIG && GUILD_CONFIG.bagis_yuzde_limit) || 20) + '\'i | ' +
    ((GUILD_CONFIG && GUILD_CONFIG.hammadde_bagis_24pg) || 3) + ' bagis/24PG ' + cdHText + '</div>';

  // Köylü bagisi
  // v1.14.0.41: Input'a max attribute + frontend validation
  var koyluMax = (GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_limit) || 100;
  var koyluTip = (GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_tip) || 'adet';
  var koyluBagisHTML = '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #222">' +
    '<div style="font-size:10px;color:#aaa;margin-bottom:4px">👨‍🌾 Köylü Bagisi</div>' +
    '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">' +
      '<input id="koylu-bagis-adet" type="number" min="1" max="' + koyluMax + '" placeholder="Max ' + koyluMax + '" style="width:100px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px" oninput="if(this.value>' + koyluMax + ')this.value=' + koyluMax + '">' +
      '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:11px" onclick="guildKoyluBagis(' + g.id + ',' + koyluMax + ')">Gonder</button>' +
      '<span style="font-size:11px;color:#555">Max <b style="color:#aaa">' + koyluMax + '</b> ' + koyluTip + ' | ' + ((GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_24pg) || 2) + '/24PG</span>' +
    '</div>' +
    '<div style="font-size:11px;margin-top:4px">' + cdKText + '</div>' +
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
        '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:11px" onclick="guildAmbarIstek(' + g.id + ')">Talep Et</button>' +
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
    // v1.13.47: Son bagislar kartı
    '<div class="card" id="guild-bagis-kart">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🎁 Son Bağışlar (Son 20)</div>' +
      '<div id="guild-bagis-liste" style="font-size:10px;color:#888">Yukleniyor...</div>' +
    '</div>' +
    ambarIstekHTML;

  if (myYetkiler.ambar_gor) guildAmbarIsteklerYukle(g.id);
}

// v1.13.47: Son bagislar yukle (GET /kasa son_bagislar)
async function _loadGuildBagislar(guildId) {
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/kasa', { headers: { 'Authorization': 'Bearer ' + getToken() } });
    var d = await resp.json();
    var el = document.getElementById('guild-bagis-liste');
    if (!el) return;
    var bagis = d.son_bagislar || [];
    if (!bagis.length) { el.innerHTML = '<span style="color:#555">Henuz bagis yapilmadi</span>'; return; }
    var _escB = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
    var _fmtN = function(n){ n=parseInt(n)||0; return n.toLocaleString('tr-TR'); };
    el.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:10px">' +
      '<thead><tr style="color:#c9a84c;border-bottom:1px solid #2a2a1a">' +
        '<th style="text-align:left;padding:4px">Oyuncu</th>' +
        '<th style="text-align:left;padding:4px">Bağış</th>' +
        '<th style="text-align:right;padding:4px">Miktar</th>' +
        '<th style="text-align:right;padding:4px">Tarih</th>' +
      '</tr></thead><tbody>' +
      bagis.map(function(b) {
        var ikon = b.kaynak === 'koylu' ? '👨‍🌾' : (KAYNAK_IKON[b.kaynak] || '📦');
        return '<tr style="border-bottom:1px solid #1a1a1a;color:#aaa">' +
          '<td style="padding:3px"><b style="color:#d4af37">' + _escB(b.kullanici_adi) + '</b></td>' +
          '<td style="padding:3px">' + ikon + ' ' + _escB(b.kaynak) + '</td>' +
          '<td style="padding:3px;text-align:right;color:#2ecc71">+' + _fmtN(b.miktar) + '</td>' +
          '<td style="padding:3px;text-align:right;color:#555;font-size:11px">' + new Date(b.created_at).toLocaleString('tr-TR') + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table>';
  } catch(e) {
    var el = document.getElementById('guild-bagis-liste');
    if (el) el.innerHTML = '<span style="color:#e74c3c">Yuklenemedi</span>';
  }
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

    // v1.13.42.3: HTML escape helper - XSS korumasi
    var _escHtml = function(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
      });
    };
    el.innerHTML = istekler.map(function(i) {
      var durumRenk = i.durum === 'bekliyor' ? '#f39c12' : i.durum === 'onaylandi' ? '#2ecc71' : '#e74c3c';
      var butonlar = '';
      if (i.durum === 'bekliyor' && myYetkiler.ambar_istek_onayla) {
        // guildId ve i.id numeric, parseInt ile guvenli hale getir
        var gId = parseInt(guildId) || 0;
        var rId = parseInt(i.id) || 0;
        butonlar = '<button style="background:#2ecc71;color:#000;border:none;padding:2px 8px;border-radius:3px;font-size:11px;cursor:pointer" onclick="guildAmbarIstekOnayla(' + gId + ',' + rId + ',\'onayla\')">Onayla</button>' +
                   '<button style="background:#e74c3c;color:#fff;border:none;padding:2px 8px;border-radius:3px;font-size:11px;cursor:pointer" onclick="guildAmbarIstekOnayla(' + gId + ',' + rId + ',\'reddet\')">Reddet</button>';
      }
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1a1a1a;font-size:10px">' +
        '<span>' + _escHtml(i.kullanici_adi) + ': ' + (KAYNAK_IKON[i.kaynak]||'') + ' ' + fmt(i.miktar) + ' ' + _escHtml(i.kaynak) + '</span>' +
        '<div style="display:flex;gap:4px;align-items:center"><span style="color:' + durumRenk + '">' + _escHtml(i.durum) + '</span>' + butonlar + '</div>' +
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
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">👨‍🌾</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.koylu) + '</div><div style="font-size:11px;color:#888">Köylü</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">⚒️</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(toplam_isci) + '</div><div style="font-size:11px;color:#888">İşçi</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">⚔️</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.asker) + '</div><div style="font-size:11px;color:#888">Asker</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">🙏</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.worshipper) + '</div><div style="font-size:11px;color:#888">Worshipper</div></div>' +
    '</div>';

  // v1.13: İşçi dagilimi (5 tip + kapasite gostergesi)
  var isciHTML = '<div class="card">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚒️ İşçi Dagilimi</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      ['oduncu','madenci','ciftci','balikci','tuccar'].map(function(tip) {
        var mevcut = isciler[tip] || 0;
        var kap = kapasite[tip];
        var kapText = kap < 999999 ? ' <span style="color:#666;font-size:11px">/ ' + fmt(kap) + '</span>' : '';
        var doluRenk = kap < 999999 && mevcut >= kap ? '#e74c3c' : '#d4af37';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:#111;border-radius:4px">' +
          '<span style="font-size:10px">' + (ISCI_IKON[tip]||'') + ' ' + tip + ': <span style="color:' + doluRenk + ';font-weight:bold">' + fmt(mevcut) + '</span>' + kapText + '</span>' +
          (myYetkiler.isci_ata ? '<div style="display:flex;gap:2px">' +
            '<button style="background:#2ecc71;color:#000;border:none;padding:2px 6px;border-radius:3px;font-size:11px;cursor:pointer" onclick="guildIsciAta(' + g.id + ',\'' + tip + '\')">+</button>' +
            '<button style="background:#e74c3c;color:#fff;border:none;padding:2px 6px;border-radius:3px;font-size:11px;cursor:pointer" onclick="guildIsciCikar(' + g.id + ',\'' + tip + '\')">-</button>' +
          '</div>' : '') +
        '</div>';
      }).join('') +
    '</div>' +
    '<div style="font-size:11px;color:#555;margin-top:6px">Kapasite: tarla×50 ciftci, balikci×20, oduncu×40</div>' +
  '</div>';

  // Asker yap butonu
  var askerHTML = '';
  if (myYetkiler.isci_ata) {
    askerHTML = '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚔️ Asker Yap</div>' +
      '<div style="display:flex;gap:4px;align-items:center">' +
        '<input id="guild-asker-adet" type="number" min="1" placeholder="Adet" style="width:80px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
        '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:11px" onclick="guildAskerYap(' + g.id + ')">Köylü → Asker</button>' +
        '<span style="font-size:11px;color:#555">Mevcut koylu: ' + fmt(nufus.koylu) + '</span>' +
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

async function guildKoyluBagis(guildId, maxLimit) {
  var adet = parseInt(document.getElementById('koylu-bagis-adet')?.value);
  if (!adet || adet <= 0) { alert('Gecerli bir adet girin'); return; }
  // v1.14.0.41: max limit frontend clamp (kullanici 6000 yazsa da 1000'e cekilir)
  var max = parseInt(maxLimit) || (GUILD_CONFIG && GUILD_CONFIG.koylu_bagis_limit) || 1000;
  if (adet > max) {
    if (!confirm('⚠ Girdiğin ' + adet + ' adet, izin verilen MAX ' + max + '\'in üzerinde. ' + max + ' adet olarak gönderilsin mi?')) return;
    adet = max;
    var inp = document.getElementById('koylu-bagis-adet');
    if (inp) inp.value = max;
  }
  // v1.13.67: Cooldown durumunu confirm'e dahil et
  var cdK = GUILD_DATA && GUILD_DATA.bagis_cooldown && GUILD_DATA.bagis_cooldown.koylu;
  var cdMsg = '';
  if (cdK) {
    if (cdK.dolu) {
      alert('24 PG icinde max ' + cdK.max + ' koylu bagisi yapabilirsiniz. Dolu! Kalan: ' + Math.ceil(cdK.kalan_saat) + ' PG sonra reset.');
      return;
    }
    cdMsg = '\n\nHak: ' + cdK.kalan_bagis + '/' + cdK.max + ' (24 PG icinde)';
    if (cdK.sayac > 0) {
      cdMsg += '\nReset: ' + Math.ceil(cdK.kalan_saat) + ' PG sonra';
    }
  }
  if (!confirm(adet + ' koylu guilde gonderilecek. Geri ALINAMAZ! Emin misiniz?' + cdMsg)) return;
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
        var kalanSn = b.queue_end ? Math.max(0, Math.floor((new Date(b.queue_end) - Date.now()) / 1000)) : 0;
        aksiyonHtml = '<span style="color:#f39c12;font-size:10px">🔨 Insaatta (' + fmtKalanSure(kalanSn) + ')</span>';
      } else if (yetkiler.guild_bina_yap) {
        // v1.13.41.3: Adet input + toplu insa (oyuncu gibi)
        aksiyonHtml = '<div style="display:flex;gap:4px;align-items:center">' +
          '<input id="gb-adet-' + binaId + '" type="number" value="1" min="1" max="100" style="width:55px;padding:3px 6px;background:#0a0a0a;border:1px solid #333;color:#ddd;border-radius:3px;font-size:11px">' +
          '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px" onclick="guildBinaUpgrade(\'' + binaId + '\')">+ Yap</button>' +
        '</div>';
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
  // v1.13.41.3: Adet al
  var adetEl = document.getElementById('gb-adet-' + binaId);
  var adet = Math.max(1, Math.min(100, parseInt(adetEl?.value) || 1));
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/binalar/upgrade', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ binaId: binaId, adet: adet })
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
        var kalanSn = Math.max(0, Math.floor((new Date(k.queue_end) - Date.now()) / 1000));
        html += '<div style="font-size:11px;color:#ccc">' + k.adet + 'x ' + k.unite_id + ' — ' + fmtKalanSure(kalanSn) + '</div>';
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
          html += '<select id="havuz-hedef-' + u.unite_id + '" style="font-size:11px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:1px">';
          d.ordular.forEach(function(o) { html += '<option value="' + o.id + '">' + o.isim + '</option>'; });
          html += '</select>' +
            '<input id="havuz-adet-' + u.unite_id + '" type="number" min="1" max="' + u.adet + '" value="' + Math.min(u.adet, 10) + '" style="width:40px;font-size:11px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:1px">' +
            '<button style="font-size:11px;padding:2px 6px;background:#2a5a2a;color:#ccc;border:none;border-radius:3px;cursor:pointer" onclick="guildOrduAta(\'' + u.unite_id + '\')">Ata</button>';
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
            html += '<input id="cikar-adet-' + ordu.id + '-' + u.unite_id + '" type="number" min="1" max="' + u.adet + '" value="' + Math.min(u.adet, 10) + '" style="width:35px;font-size:11px;background:#222;color:#ccc;border:1px solid #444;border-radius:2px;padding:0 2px">' +
              '<button style="font-size:11px;padding:1px 4px;background:#5a2a2a;color:#ccc;border:none;border-radius:2px;cursor:pointer" onclick="guildOrduCikar(' + ordu.id + ',\'' + u.unite_id + '\')">Cikar</button>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      if (yetkiler.guild_ordusu_kur) {
        html += '<div style="margin-top:6px;display:flex;gap:4px">' +
          '<button class="btn-action" style="width:auto;padding:3px 10px;font-size:11px;background:#333" onclick="guildOrduSil(' + ordu.id + ')">🗑️ Sil</button>' +
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
        '<div style="font-size:11px;color:#555;margin-top:4px">Mevcut asker: ' + fmt(d.nufus.asker) + ' (her unite 1 asker harcar)</div>' +
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
    // v1.13.51: Market + oto-sat birlikte cekilir
    var [resp, otoResp] = await Promise.all([
      fetch(API_BASE + '/api/guild/' + gId + '/market', { headers: guildHdr() }),
      fetch(API_BASE + '/api/guild/' + gId + '/market/oto-sat', { headers: guildHdr() })
    ]);
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }
    var otoAyarlar = {};
    if (otoResp.ok) { var otoData = await otoResp.json(); otoAyarlar = otoData.hammaddeler || {}; }
    window._GUILD_OTO_AYARLAR = otoAyarlar;
    window._GUILD_MARKET_GID = gId;
    window._GUILD_MKT_FIYATLAR = d.fiyatlar || {}; // v1.13.51.1: adjust icin stok bilgisi

    var yetkiler = data.benim_yetkilerim || {};
    var satisYetki = yetkiler.market_satis;

    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:10px">🏪 Guild Market — Hammadde Satisi</h3>';

    var fiyatlar = d.fiyatlar || {};
    var kurTarih = d.kur_guncelleme ? new Date(d.kur_guncelleme).toLocaleString('tr-TR') : '-';

    // v1.13.45: Tüccar durumu gosterimi
    var tuccarSayi = (data.guild_isciler || {}).tuccar || 0;
    var toplamStok = Object.keys(fiyatlar).reduce(function(s,k){ return s + (parseInt(fiyatlar[k].miktar)||0); }, 0);
    if (tuccarSayi === 0) {
      html += '<div style="background:rgba(231,76,60,0.1);border:1px solid #e74c3c;padding:8px;border-radius:4px;margin-bottom:10px;font-size:11px;color:#e74c3c">' +
        '⚠️ <b>Hiç tüccar atanmamış!</b> Tüccar saatte 300-500 rastgele hammadde getirir. ' +
        '<a href="#" onclick="guildTab(\'isciler\');return false" style="color:#f39c12;text-decoration:underline">İşçiler sekmesine git</a> ve köylülerden 💼 Tüccar ata.' +
      '</div>';
    } else {
      html += '<div style="font-size:10px;color:#2ecc71;margin-bottom:6px">💼 ' + tuccarSayi + ' tüccar aktif — saatte ~' + (tuccarSayi*400) + ' hammadde (ortalama)' +
        (toplamStok === 0 ? ' · <span style="color:#f39c12">Toplam stok 0 — bir sonraki cron (XX:00) için bekle</span>' : ' · Toplam stok: ' + fmt(toplamStok)) +
      '</div>';
    }

    html += '<div style="font-size:10px;color:#888;margin-bottom:10px">Kur son guncelleme: ' + kurTarih + ' | Kurlar saatte bir %70-130 arasi dalgalanir</div>';

    // v1.13.51: Oto-sat master bar
    var otoAktifSayi = Object.values(otoAyarlar).filter(function(v){ return v.aktif; }).length;
    if (satisYetki) {
      html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px;background:#0d0a06;border:1px solid rgba(201,168,76,0.25);border-radius:4px;margin-bottom:10px">' +
        '<span style="font-size:16px">🔄</span>' +
        '<div style="flex:1;min-width:150px">' +
          '<div style="color:#c8a96e;font-weight:bold;font-size:12px">Oto-Sat Kontrol</div>' +
          '<div style="color:#888;font-size:10px">Her saat stok > eşik ise sabit %100 baz fiyat ile kasaya akar (komisyonsuz) — ' +
            '<b style="color:' + (otoAktifSayi>0?'#2ecc71':'#888') + '">' + otoAktifSayi + '/10 AKTİF</b></div>' +
        '</div>' +
        '<button class="btn-action" style="padding:5px 12px;font-size:10px;background:#27ae60;color:#000;width:auto" onclick="guildOtoSatToplu(true)">✓ Tümünü Aç</button>' +
        '<button class="btn-action" style="padding:5px 12px;font-size:10px;background:#e74c3c;color:#fff;width:auto" onclick="guildOtoSatToplu(false)">✗ Tümünü Kapat</button>' +
      '</div>';
    }

    if (!satisYetki) {
      html += '<div style="font-size:10px;color:#f39c12;margin-bottom:10px">ℹ️ Sadece market satis yetkiniz olan uyeler satis yapabilir</div>';
    }

    // v1.13.51.1: Oyuncu market UI ile ayni yapi — flex row, adjust butonlari
    html += '<div style="display:flex;flex-direction:column;gap:2px">';
    if (!window._GMKT_SATIS_MIKTAR) window._GMKT_SATIS_MIKTAR = {};

    Object.keys(fiyatlar).forEach(function(key) {
      var f = fiyatlar[key];
      var ikon = HAMMADDE_IKON[key] || '💠';
      var kurRenk = f.kur >= 110 ? '#2ecc71' : (f.kur <= 90 ? '#e74c3c' : '#d4af37');
      var kurOk = f.kur >= 100 ? '▲' : '▼';
      window._GMKT_SATIS_MIKTAR[key] = window._GMKT_SATIS_MIKTAR[key] || 0;

      var oto = otoAyarlar[key] || { aktif:false, esik:0 };
      var otoBorder = oto.aktif ? '#1a4a1a' : '#1e1e1e';
      var otoBadge = oto.aktif ? '<span style="background:#103a10;color:#2ecc71;padding:1px 5px;border-radius:3px;font-size:11px;margin-left:4px">🔄 OTO</span>' : '';

      html += '<div style="padding:6px 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#111;border:1px solid ' + otoBorder + ';border-radius:4px;margin-bottom:2px">' +
        '<span style="font-size:20px;width:24px;text-align:center">' + ikon + '</span>' +
        '<div style="min-width:100px">' +
          '<div style="color:#d4af37;font-weight:bold;font-size:12px">' + f.isim + otoBadge + '</div>' +
          '<div style="color:#888;font-size:10px">Stok: <b style="color:#fff">' + fmt(f.miktar) + '</b></div>' +
        '</div>' +
        '<div style="min-width:120px">' +
          '<span style="color:#666;font-size:10px">Kur: </span>' +
          '<span style="color:' + kurRenk + ';font-weight:bold;font-size:11px">' + kurOk + ' %' + f.kur + '</span>' +
          '<span style="color:#f1c40f;font-size:12px;font-weight:bold;margin-left:6px">' + f.satis_fiyat + ' altın/adet</span>' +
        '</div>' +
        (satisYetki ?
          '<div style="flex:1;display:flex;align-items:center;gap:4px;justify-content:flex-end;min-width:200px">' +
            '<button class="btn-action" style="padding:2px 6px;font-size:10px;background:#222;width:auto" onclick="guildMktAdjust(\'' + key + '\',-100)">−100</button>' +
            '<button class="btn-action" style="padding:2px 5px;font-size:10px;background:#222;width:auto" onclick="guildMktAdjust(\'' + key + '\',-10)">−10</button>' +
            '<span id="gmkt-m-' + key + '" style="min-width:48px;text-align:center;font-weight:bold;color:#d4af37;font-size:12px">' + window._GMKT_SATIS_MIKTAR[key] + '</span>' +
            '<button class="btn-action" style="padding:2px 5px;font-size:10px;background:#222;width:auto" onclick="guildMktAdjust(\'' + key + '\',10)">+10</button>' +
            '<button class="btn-action" style="padding:2px 6px;font-size:10px;background:#222;width:auto" onclick="guildMktAdjust(\'' + key + '\',100)">+100</button>' +
            '<button class="btn-action" style="padding:2px 6px;font-size:10px;background:#2a2a2a;color:#f1c40f;width:auto" onclick="guildMktAdjust(\'' + key + '\',\'max\')">MAX</button>' +
            '<button class="btn-action" style="min-width:60px;padding:3px 8px;font-size:10px;background:#27ae60;color:#000;width:auto" onclick="guildMarketSat(\'' + key + '\')" ' + (f.miktar <= 0 ? 'disabled' : '') + '>💰 Sat</button>' +
            '<input id="gmkt-inp-' + key + '" type="hidden" value="0">' +
          '</div>'
        : '') +
        // Oto-sat ek satir
        (satisYetki ?
          '<div style="width:100%;display:flex;align-items:center;gap:6px;padding-top:4px;border-top:1px dashed #2a2a2a">' +
            '<label style="display:flex;align-items:center;gap:4px;font-size:10px;color:' + (oto.aktif?'#2ecc71':'#888') + ';cursor:pointer">' +
              '<input type="checkbox" ' + (oto.aktif?'checked':'') + ' onchange="guildOtoSatToggle(\'' + key + '\', this.checked)">' +
              '🔄 Oto-Sat (sabit ' + (f.baz_fiyat||1) + ' altın/adet)' +
            '</label>' +
            '<span style="font-size:10px;color:#888;margin-left:auto">Eşik:</span>' +
            '<input id="gmkt-esik-' + key + '" type="number" min="0" value="' + (oto.esik||0) + '"' +
              ' onblur="guildOtoSatEsikKaydet(\'' + key + '\')"' +
              ' onkeydown="if(event.key===\'Enter\')this.blur()"' +
              ' style="width:80px;padding:2px 4px;background:#0a0a0a;border:1px solid #333;color:#ddd;border-radius:3px;font-size:10px">' +
            '<span style="font-size:11px;color:#666">(stok > eşik ise fazlası satılır)</span>' +
          '</div>'
        : '') +
      '</div>';
    });

    html += '</div>';

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

// v1.13.51: Guild oto-sat handler'lari
async function guildOtoSatToggle(key, aktif) {
  var gId = window._GUILD_MARKET_GID;
  if (!gId) return;
  var esik = parseInt(document.getElementById('gmkt-esik-'+key)?.value) || 0;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/market/oto-sat', {
      method: 'PUT', headers: guildHdr(),
      body: JSON.stringify({ hammadde: key, aktif: aktif, esik: esik })
    });
    var d = await resp.json();
    if (resp.ok) {
      if (!window._GUILD_OTO_AYARLAR[key]) window._GUILD_OTO_AYARLAR[key] = {};
      window._GUILD_OTO_AYARLAR[key].aktif = aktif;
      window._GUILD_OTO_AYARLAR[key].esik = esik;
      toast('🔄 Oto-sat ' + (aktif?'AÇIK':'KAPALI'));
      if (GUILD_DATA) renderTabMarket(document.getElementById('guild-tab-content'), GUILD_DATA);
    } else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}
async function guildOtoSatEsikKaydet(key) {
  var gId = window._GUILD_MARKET_GID;
  if (!gId) return;
  var esik = parseInt(document.getElementById('gmkt-esik-'+key)?.value) || 0;
  var aktif = !!(window._GUILD_OTO_AYARLAR||{})[key]?.aktif;
  try {
    await fetch(API_BASE + '/api/guild/' + gId + '/market/oto-sat', {
      method: 'PUT', headers: guildHdr(),
      body: JSON.stringify({ hammadde: key, aktif: aktif, esik: esik })
    });
    if (!window._GUILD_OTO_AYARLAR[key]) window._GUILD_OTO_AYARLAR[key] = {};
    window._GUILD_OTO_AYARLAR[key].esik = esik;
    toast('Eşik: ' + esik.toLocaleString('tr-TR'));
  } catch(e) {}
}
async function guildOtoSatToplu(aktif) {
  var gId = window._GUILD_MARKET_GID;
  if (!gId) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/market/oto-sat/toplu', {
      method: 'POST', headers: guildHdr(),
      body: JSON.stringify({ aktif: aktif })
    });
    var d = await resp.json();
    if (resp.ok) {
      toast('🔄 Tüm oto-sat ' + (aktif?'AÇILDI':'KAPATILDI'));
      if (GUILD_DATA) renderTabMarket(document.getElementById('guild-tab-content'), GUILD_DATA);
    } else toast(d.error || 'Hata', 'error');
  } catch(e) { toast('Baglanti hatasi', 'error'); }
}

// v1.13.51.1: Oyuncu market ile ayni adjust sistemi
function guildMktAdjust(key, delta) {
  if (!window._GMKT_SATIS_MIKTAR) window._GMKT_SATIS_MIKTAR = {};
  var fiyatlar = window._GUILD_MKT_FIYATLAR || {};
  var f = fiyatlar[key];
  var maxStok = f ? parseInt(f.miktar)||0 : 0;
  if (delta === 'max') {
    window._GMKT_SATIS_MIKTAR[key] = maxStok;
  } else {
    window._GMKT_SATIS_MIKTAR[key] = Math.max(0, Math.min((window._GMKT_SATIS_MIKTAR[key]||0) + delta, maxStok));
  }
  var el = document.getElementById('gmkt-m-' + key);
  if (el) el.textContent = window._GMKT_SATIS_MIKTAR[key].toLocaleString('tr-TR');
  var inp = document.getElementById('gmkt-inp-' + key);
  if (inp) inp.value = window._GMKT_SATIS_MIKTAR[key];
}

async function guildMarketSat(hammadde) {
  if (!GUILD_DATA) return;
  // v1.13.51.1: state'den veya input'tan (backward compat)
  var miktar = (window._GMKT_SATIS_MIKTAR || {})[hammadde] || 0;
  if (!miktar) {
    var inp = document.getElementById('gmkt-inp-' + hammadde);
    miktar = inp ? (parseInt(inp.value)||0) : 0;
  }
  if (!miktar || miktar < 1) { toast('Satilacak miktar belirle (±ile ayarla ya da MAX)', 'error'); return; }
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + GUILD_DATA.guild.id + '/market/sat', {
      method: 'POST', headers: guildHdr(), body: JSON.stringify({ hammadde: hammadde, miktar: miktar })
    });
    var d = await resp.json();
    if (resp.ok) {
      toast('+' + fmt(d.kazanc) + ' altın (kur %' + d.kur + ')');
      if (window._GMKT_SATIS_MIKTAR) window._GMKT_SATIS_MIKTAR[hammadde] = 0;
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
var DAGITIM_ISIM = { odun:'Odun', metal:'Metal', altin:'Altın', bugday:'Buğday', balik:'Balık', kereste:'Kereste', islenmis:'İşlenmiş Metal' };

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

// v1.14.0.61: event_type -> Türkçe etiket (okunabilirlik)
var GUILD_EVENT_LABEL = {
  bina_tamam:'Bina Tamamlandı', egitim_tamam:'Ünite Eğitimi Bitti',
  maas:'Maaş Kesildi', isci_uretim:'İşçi Üretimi',
  ekonomi:'Ekonomi Hareketi', bolge_bonus:'Bölge Bonusu', irk_bonus:'Irk Bonusu',
  mana_uretim:'Mana Üretimi', pisirme:'Pişirme',
  savas:'Savaş', kadim_saldiri:'Kadim Saldırı', takviye:'Takviye',
  ambar:'Ambar Hareketi', bagis:'Bağış', tasi:'Kaynak Taşıma',
  dagitim:'Kaynak Dağıtımı', pazar:'Pazar Satışı', market:'Market',
  guild_kurma:'Guild Kuruluşu', uye_katildi:'Üye Katıldı', uye_ayrildi:'Üye Ayrıldı',
  uye_kick:'Üye Atıldı', lider_degisim:'Lider Değişti',
  diplomasi:'Diplomasi', kusatma:'Kuşatma',
  arastirma:'Araştırma', admin:'Admin Müdahalesi'
};

async function renderTabRaporlar(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:13px">📜 Raporlar yükleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/raporlar', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c;padding:20px">' + (d.error || 'Hata') + '</div>'; return; }

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px">';
    html += '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin:0;font-size:16px">📜 Guild Raporlari</h3>';
    html += '<span style="font-size:11px;color:#666">(' + (d.liste?.length || 0) + ' kayıt)</span>';
    html += '</div>';

    // Filtre butonlari — pill stili, daha büyük
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
    html += '<button onclick="guildRaporFiltre(\'hepsi\')" style="padding:5px 14px;border:1px solid ' +
      (GUILD_RAPOR_FILTRE === 'hepsi' ? 'var(--race-color)' : '#2a2a2a') + ';border-radius:12px;font-size:11px;font-weight:bold;cursor:pointer;' +
      (GUILD_RAPOR_FILTRE === 'hepsi' ? 'background:rgba(212,162,87,0.2);color:var(--race-color)' : 'background:#111;color:#888') + '">Hepsi</button>';
    for (var kat in GUILD_RAPOR_KATEGORI) {
      var k = GUILD_RAPOR_KATEGORI[kat];
      var aktif = GUILD_RAPOR_FILTRE === kat;
      html += '<button onclick="guildRaporFiltre(\'' + kat + '\')" style="padding:5px 14px;border:1px solid ' +
        (aktif ? k.renk : '#2a2a2a') + ';border-radius:12px;font-size:11px;font-weight:bold;cursor:pointer;' +
        (aktif ? 'background:' + k.renk + '22;color:' + k.renk : 'background:#111;color:' + k.renk + 'bb') + '">' + k.isim + '</button>';
    }
    html += '</div>';

    // v1.13.25 FIX: Backend {raporlar:[{palantis_yil,...,olaylar:[]}], liste:[]}
    var events = d.liste || [];
    if (GUILD_RAPOR_FILTRE !== 'hepsi') {
      var tipler = GUILD_RAPOR_KATEGORI[GUILD_RAPOR_FILTRE]?.tipler || [];
      events = events.filter(function(r) { return tipler.indexOf(r.event_type) >= 0; });
    }

    if (events.length === 0) {
      html += '<div class="card" style="padding:40px;text-align:center;color:#666;font-size:13px">📭<br>Bu filtreye uyan rapor yok.</div>';
    } else {
      // Tarih bazli gruplama
      var gruplar = {};
      events.forEach(function(r) {
        var tarih = r.palantis_gun + '. ay ' + r.palantis_ay + ' / yıl ' + r.palantis_yil;
        if (!gruplar[tarih]) gruplar[tarih] = [];
        gruplar[tarih].push(r);
      });

      for (var tarih in gruplar) {
        // Tarih başlığı — büyük + belirgin
        html += '<div style="font-family:Cinzel,serif;font-size:13px;color:var(--race-color);margin:18px 0 8px;padding:6px 12px;background:rgba(212,162,87,0.08);border-left:3px solid var(--race-color);border-radius:0 4px 4px 0">' +
          '📅 ' + tarih + ' <span style="color:#888;font-size:11px;margin-left:6px">(' + gruplar[tarih].length + ' olay)</span></div>';

        gruplar[tarih].forEach(function(r) {
          var renk = '#888';
          var ikon = GUILD_EVENT_IKON[r.event_type] || '•';
          var label = GUILD_EVENT_LABEL[r.event_type] || r.event_type || 'Bilinmeyen';
          for (var kat2 in GUILD_RAPOR_KATEGORI) {
            if (GUILD_RAPOR_KATEGORI[kat2].tipler.indexOf(r.event_type) >= 0) { renk = GUILD_RAPOR_KATEGORI[kat2].renk; break; }
          }
          // Kart bazlı — daha okunabilir
          html += '<div style="display:flex;gap:10px;padding:10px 12px;background:#0d0d0d;border:1px solid #1a1a1a;border-left:3px solid ' + renk + ';border-radius:3px;margin-bottom:6px">' +
            '<div style="font-size:18px;flex-shrink:0">' + ikon + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap">' +
                '<span style="color:' + renk + ';font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.3px">' + label + '</span>' +
                (r.oyuncu_adi ? '<span style="color:#888;font-size:11px">· 👤 ' + r.oyuncu_adi + '</span>' : '') +
              '</div>' +
              '<div style="color:#d4cbb8;font-size:12px;line-height:1.4">' + (r.mesaj || '—') + '</div>' +
            '</div>' +
          '</div>';
        });
      }
    }

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c;padding:20px">Baglanti hatasi: ' + e.message + '</div>';
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
//   TAB: DIPLOMASI (v1.14.0.30)
// ═══════════════════════════════════
async function renderTabDiplomasi(el, data) {
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild-iliski/benim', { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }

    var isLider = data.benim_rutbem === 'lider';
    var iliskiler = d.iliskiler || [];

    // Durum badge'i
    function durumBadge(durum) {
      var colors = {
        BARIS: { bg: 'rgba(149,165,166,0.15)', fg: '#95a5a6', ikon: '☮️' },
        ANTLASMA: { bg: 'rgba(46,204,113,0.15)', fg: '#2ecc71', ikon: '🤝' },
        SAVAS: { bg: 'rgba(231,76,60,0.18)', fg: '#e74c3c', ikon: '⚔️' },
        TABIYET: { bg: 'rgba(155,89,182,0.15)', fg: '#9b59b6', ikon: '👑' }
      };
      var c = colors[durum] || colors.BARIS;
      return '<span style="background:' + c.bg + ';color:' + c.fg + ';padding:2px 8px;border-radius:3px;font-size:11px;font-weight:bold">' + c.ikon + ' ' + durum + '</span>';
    }

    function fmtT(ts) { return ts ? new Date(ts).toLocaleString('tr-TR', {hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}) : '-'; }
    function fmtKalan(bitisAt) {
      if (!bitisAt) return '-';
      var ms = new Date(bitisAt).getTime() - Date.now();
      if (ms <= 0) return '<span style="color:#e74c3c">geçti</span>';
      var h = Math.floor(ms / 3600000);
      return h + ' PG';
    }

    var html = '<div style="max-width:1200px;margin:0 auto">';

    // LIDER teklif formu — dropdown ile rakip guild secimi
    if (isLider) {
      // Tum guildleri cek (kendi haric)
      var kendiGid = data.guild.id;
      var mevcutIliskiMap = {};
      for (var ii = 0; ii < iliskiler.length; ii++) mevcutIliskiMap[iliskiler[ii].rakip.id] = iliskiler[ii].durum;
      var guildListHTML = '<option value="">-- Rakip guild seç --</option>';
      try {
        var gResp = await fetch(API_BASE + '/api/guild/liste/tumu', { headers: guildHdr() });
        var gData = await gResp.json();
        if (Array.isArray(gData)) {
          var sorted = gData.filter(function(g){ return g.id !== kendiGid; });
          sorted.sort(function(a,b){ return (a.isim||'').localeCompare(b.isim||'','tr'); });
          for (var gi = 0; gi < sorted.length; gi++) {
            var g = sorted[gi];
            var mevcut = mevcutIliskiMap[g.id];
            var durumEki = mevcut ? ' [' + mevcut + ']' : '';
            guildListHTML += '<option value="' + g.id + '">' + (g.isim || '?') + ' ' + (g.tag ? '[' + g.tag + ']' : '') + ' · ' + (g.uye_sayisi || 0) + ' üye' + durumEki + '</option>';
          }
        }
      } catch(e) {}

      html += '<div class="card" style="margin-bottom:16px;padding:14px">' +
        '<h3 style="color:#3498db;margin-top:0">🤝 Yeni Teklif Gönder (Lider)</h3>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<select id="dip-rakip" style="padding:6px;background:#1a1a1a;color:#fff;border:1px solid #444;border-radius:3px;min-width:280px">' + guildListHTML + '</select>' +
          '<button class="btn-action" onclick="dipTeklif(\'antlasma\')" style="background:#27ae60;color:#fff">🤝 ANTLAŞMA Teklif Et</button>' +
          '<button class="btn-action" onclick="dipTeklif(\'savas\')" style="background:#e74c3c;color:#fff">⚔️ SAVAŞ Teklif Et</button>' +
        '</div>' +
        '<div style="font-size:10px;color:#888;margin-top:8px">• <b>ANTLAŞMA</b>: karşılıklı saldırı yasağı. İptal = 48+24 PG uyarı + SAVAŞ (ihanet -6% ATK/DEF)<br>• <b>SAVAŞ</b>: karşı tarafa teklif, 5 PG içinde <i>Kabul = eşit savaş</i>, <i>Red veya zaman aşımı = savaş başlar + reddedene -6% debuff</i><br>• <b>TABIYET</b>: yalnızca SAVAŞ aktifken teklif edilebilir (savaş kartında buton çıkar)</div>' +
        '</div>';
    }

    // BEKLEYEN TEKLIFLER
    var bekleyenler = iliskiler.filter(function(i){ return i.bekleyen_teklif && !i.ben_teklif_ettim; });
    if (bekleyenler.length > 0) {
      html += '<div class="card" style="margin-bottom:16px;padding:14px;border-left:3px solid #f39c12">' +
        '<h3 style="color:#f39c12;margin-top:0">🔔 Gelen Teklifler (' + bekleyenler.length + ')</h3>';
      for (var i = 0; i < bekleyenler.length; i++) {
        var il = bekleyenler[i];
        var aciklama = il.teklif_tip === 'ANTLASMA' ? 'Size ANTLAŞMA teklif ediyor (karşılıklı saldırı yasağı)'
                     : il.teklif_tip === 'BARIS' ? 'Size BARIŞ teklif ediyor (savaşı bitir)'
                     : il.teklif_tip === 'TABIYET' ? 'Sizi TABIYET altına almak istiyor (onlar HAKIM, siz BAĞLI)'
                     : il.teklif_tip === 'SAVAS' ? '⚠️ Size SAVAŞ teklif ediyor. Red = savaş yine başlar + sizde -6% debuff! Zaman aşımı da aynı sonuç.' : '';
        var kalan = fmtKalan(il.teklif_bitis_at);
        html += '<div style="padding:10px;background:#111;border-radius:4px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div><b style="color:#f39c12">' + (il.rakip.isim || '?') + '</b> ' + durumBadge(il.teklif_tip) + ' <span style="color:#666">(ID ' + il.rakip.id + ')</span>' +
          (il.teklif_bitis_at ? ' <span style="color:#e74c3c;font-size:10px">⏳ Kalan: ' + kalan + '</span>' : '') +
          '<br><span style="color:#ccc;font-size:11px">' + aciklama + '</span></div>' +
          (isLider ? '<div style="display:flex;gap:6px"><button class="btn-action" onclick="dipKabul(\'' + il.teklif_tip + '\',' + il.rakip.id + ')" style="background:#27ae60;color:#fff;font-size:11px">✅ Kabul</button>' +
          '<button class="btn-action" onclick="dipRed(\'' + il.teklif_tip + '\',' + il.rakip.id + ')" style="background:#95a5a6;color:#fff;font-size:11px">❌ Reddet</button></div>' : '<span style="color:#666">Lider kabul/red eder</span>') +
          '</div>';
      }
      html += '</div>';
    }

    // AKTIF ILISKILER
    html += '<div class="card" style="padding:14px">' +
      '<h3 style="color:#3498db;margin-top:0">📋 Aktif İlişkiler (' + iliskiler.length + ')</h3>';
    if (iliskiler.length === 0) {
      html += '<div style="color:#666;padding:8px">Henüz ilişki yok. Yukarıdan teklif gönderin.</div>';
    } else {
      for (var j = 0; j < iliskiler.length; j++) {
        var il = iliskiler[j];
        var extra = '';
        if (il.durum === 'ANTLASMA' && il.savas_hazirlik_bitis_at) {
          extra = '<div style="color:#e74c3c;font-size:11px;margin-top:4px">⚠ İPTAL SÜRECİ: ' + fmtKalan(il.savas_hazirlik_bitis_at) + ' sonra SAVAŞ' + (il.ben_ihanet_eden ? ' (siz ihanet ediyorsunuz)' : ' (rakip ihanet ediyor)') + '</div>';
        } else if (il.durum === 'TABIYET') {
          var rolStr = il.ben_hakim ? '👑 Siz HAKIM' : '⛓ Siz BAĞLI';
          extra = '<div style="color:#9b59b6;font-size:11px;margin-top:4px">' + rolStr + ' — Bitiş: ' + fmtKalan(il.tabiyet_bitis_at) + '</div>';
        } else if (il.durum === 'SAVAS') {
          extra = '<div style="color:#e74c3c;font-size:11px;margin-top:4px">⚔️ Savaş başlangıç: ' + fmtT(il.savas_baslangic_at) + (il.ben_ihanet_eden ? ' · <b>Siz ihanet eden</b> (-6% ATK/DEF)' : il.ihanet_eden_id ? ' · <b>Rakip ihanet eden</b> (-6% onlarda)' : '') + '</div>';
        }
        var aksiyon = '';
        if (isLider) {
          if (il.durum === 'ANTLASMA' && !il.savas_hazirlik_bitis_at) {
            aksiyon = '<button class="btn-action" onclick="dipIptalAntlasma(' + il.rakip.id + ')" style="background:#e74c3c;color:#fff;font-size:11px">⚠️ Antlaşmayı İptal Et</button>';
          } else if (il.durum === 'SAVAS' && !il.bekleyen_teklif) {
            aksiyon = '<button class="btn-action" onclick="dipTeklifBaris(' + il.rakip.id + ')" style="background:#2ecc71;color:#fff;font-size:11px;margin-right:4px" title="Savaşı bitir. Kabul ederlerse BARIŞ durumuna geçer.">🕊️ Barış Teklif Et</button>' +
                      '<button class="btn-action" onclick="dipTeklifTabiyet(' + il.rakip.id + ')" style="background:#9b59b6;color:#fff;font-size:11px" title="Teslim ol teklifi: rakip kabul ederse savaş biter ve onlar senin HAKIMIYETINE girer (%30 üretim sana akar). Reddederlerse savaş devam eder.">👑 Teslim Ol Teklif Et (sen HAKIM)</button>';
          } else if (il.durum === 'TABIYET' && il.ben_hakim) {
            aksiyon = '<button class="btn-action" onclick="dipSonlandirTabiyet(' + il.rakip.id + ')" style="background:#f39c12;color:#fff;font-size:11px">🔓 Tabiyeti Sonlandır</button>';
          } else if (il.bekleyen_teklif && il.ben_teklif_ettim) {
            aksiyon = '<span style="color:#888;font-size:11px">⌛ Teklif bekleniyor</span>';
          }
        }
        html += '<div style="padding:10px;background:#111;border-radius:4px;margin-bottom:6px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
            '<div><b>' + (il.rakip.isim || '?') + '</b> <span style="color:#666">(ID ' + il.rakip.id + ', ' + (il.rakip.taraf||'?') + ')</span></div>' +
            '<div>' + durumBadge(il.durum) + '</div>' +
            '<div>' + aksiyon + '</div>' +
          '</div>' + extra +
          '</div>';
      }
    }
    html += '</div></div>';

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Hata: ' + e.message + '</div>';
  }
}

async function dipTeklif(tip) {
  var sel = document.getElementById('dip-rakip');
  var rakip = parseInt(sel ? sel.value : 0);
  if (!rakip) { alert('Rakip guild seç'); return; }
  var endpoint = tip === 'antlasma' ? 'teklif-antlasma' : tip === 'savas' ? 'teklif-savas' : 'teklif-tabiyet';
  var onayMsj = tip === 'antlasma' ? 'Antlaşma teklif edilecek. Onayla?'
              : tip === 'savas' ? '⚔️ SAVAŞ teklif edilecek. Karşı taraf 5 PG içinde kabul/red etmezse savaş otomatik başlar ve reddedene -6% debuff gelir. Onayla?'
              : 'TABIYET teklif edilecek (siz HAKIM olacaksınız). Onayla?';
  if (!confirm(onayMsj)) return;
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/' + endpoint, { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) { alert('✅ ' + (d.mesaj||'Tamam')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}
async function dipKabul(tip, rakip) {
  var endpoint = tip === 'ANTLASMA' ? 'kabul-antlasma'
               : tip === 'BARIS' ? 'kabul-baris'
               : tip === 'SAVAS' ? 'kabul-savas'
               : 'kabul-tabiyet';
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/' + endpoint, { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) { alert('✅ ' + (d.mesaj||'Tamam')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}
async function dipRed(tip, rakip) {
  // SAVAS teklifi reddi -> ozel endpoint + debuff uyarisi
  if (tip === 'SAVAS') {
    if (!confirm('⚠️ Savaş teklifini reddetsen de SAVAŞ otomatik başlar ve sen -6% ATK/DEF debuff alırsın. Kabul etmek daha avantajlı olabilir. Yine de reddet?')) return;
    try {
      var r = await fetch(API_BASE + '/api/guild-iliski/red-savas', { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
      var d = await r.json();
      if (d.ok) { alert('⚔️ ' + (d.mesaj||'')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
      else alert('Hata: ' + (d.error||''));
    } catch(e) { alert('Hata: ' + e.message); }
    return;
  }
  // ANTLASMA/TABIYET/BARIS teklifi reddi -> genel red-teklif
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/red-teklif', { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA);
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}
async function dipTeklifTabiyet(rakip) {
  if (!confirm('TABIYET teklif edeceksin (siz HAKIM olacaksınız). Karşı kabul ederse 336 PG boyunca üretimin %30\'u kasanıza akar. Onayla?')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/teklif-tabiyet', { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) { alert('👑 ' + (d.mesaj||'Tamam')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}
async function dipIptalAntlasma(rakip) {
  if (!confirm('⚠️ Antlaşmayı iptal edeceksin — SİZ İHANET EDEN olarak kayıt edileceksin. Savaşta -6% ATK/DEF debuff alacaksın. 48+24=72 PG sonra SAVAŞ. Onayla?')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/iptal-antlasma', { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) { alert('⚠️ ' + (d.mesaj||'')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}
async function dipTeklifBaris(rakip) {
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/teklif-baris', { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) { alert('🕊️ ' + (d.mesaj||'')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}
async function dipSonlandirTabiyet(rakip) {
  if (!confirm('TABİYETİ erken sonlandıracaksın. Tazminat akışı kesilir. Onayla?')) return;
  try {
    var r = await fetch(API_BASE + '/api/guild-iliski/sonlandir-tabiyet', { method:'POST', headers:guildHdr(), body:JSON.stringify({rakip_gid:rakip}) });
    var d = await r.json();
    if (d.ok) { alert('🔓 ' + (d.mesaj||'')); renderTabDiplomasi(document.getElementById('guild-tab-content'), GUILD_DATA); }
    else alert('Hata: ' + (d.error||''));
  } catch(e) { alert('Hata: ' + e.message); }
}

// ═══════════════════════════════════
//   TAB: UYE OZETI (v1.13.25)
//   24 saatlik verdi/aldi tablosu
// ═══════════════════════════════════
var UYE_OZET_SAAT = 24; // default pencere

async function renderTabUyeOzet(el, data) {
  var gId = data.guild.id;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Yukleniyor...</div>';
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/uye-ozet?saat=' + UYE_OZET_SAAT, { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (d.error || 'Hata') + '</div>'; return; }

    var KAYNAK_IKON_LOCAL = {
      koylu:'👥', altin:'💰', odun:'🌳', metal:'⛏️', bugday:'🌾', balik:'🎣',
      kereste:'🪵', islenmis:'⚙️', ekmek:'🍞', pismis:'🍳', pismis_et:'🍖', cig_et:'🥩',
      at:'🐎', kurt:'🐺', gizlilik:'🌑', buyulu_yumurta:'🥚',
      mana_beyaz:'🤍', mana_kirmizi:'❤️', mana_mavi:'💙', mana_yesil:'💚'
    };
    var KAYNAK_ISIM_LOCAL = {
      koylu:'Köylü', altin:'Altın', odun:'Odun', metal:'Metal', bugday:'Buğday', balik:'Balık',
      kereste:'Kereste', islenmis:'İşlenmiş', ekmek:'Ekmek', pismis:'Pis.Balık', pismis_et:'Pis.Et', cig_et:'Çiğ Et',
      at:'At', kurt:'Kurt', gizlilik:'Gizlilik', buyulu_yumurta:'Buyulu Yumurta',
      mana_beyaz:'Beyaz Mana', mana_kirmizi:'Kirmizi Mana', mana_mavi:'Mavi Mana', mana_yesil:'Yesil Mana'
    };
    var RUTBE_ETKI = { lider: '👑', yardimci: '⭐', uye: '' };

    var html = '<h3 style="font-family:Cinzel,serif;color:var(--race-color);margin-bottom:6px">📊 Uye Ozeti</h3>';
    html += '<p style="font-size:11px;color:#888;margin-bottom:10px">Guild uyelerinin son ' + d.saat + ' saatte verdigi ve aldigi kaynaklar (bagis + ambar + dagitim log).</p>';

    // Zaman penceresi secimi
    html += '<div style="display:flex;gap:6px;margin-bottom:12px;align-items:center;flex-wrap:wrap">';
    html += '<span style="font-size:11px;color:#888">Zaman:</span>';
    [24,48,72,168].forEach(function(s){
      var lbl = s===24?'24 saat':(s===48?'2 gun':(s===72?'3 gun':'7 gun'));
      html += '<button onclick="uyeOzetSaat(' + s + ')" style="padding:3px 10px;border:none;border-radius:4px;font-size:10px;cursor:pointer;' +
        (UYE_OZET_SAAT===s ? 'background:var(--race-color);color:#000;font-weight:bold' : 'background:#1a1a1a;color:#888') + '">' + lbl + '</button>';
    });
    html += '</div>';

    // Toplam aktivite
    html += '<div style="font-size:10px;color:#666;margin-bottom:8px">' + d.log_sayisi + ' log kaydi islendi · ' + d.uyeler.length + ' uye</div>';

    // Her uye icin kart
    var varBilgi = false;
    d.uyeler.forEach(function(u) {
      var verdiKeys = Object.keys(u.verdi || {}).filter(function(k){ return u.verdi[k] > 0; });
      var aldiKeys  = Object.keys(u.aldi  || {}).filter(function(k){ return u.aldi[k]  > 0; });
      if (verdiKeys.length === 0 && aldiKeys.length === 0) return; // hic aktivitesi yok
      varBilgi = true;

      var rutbeIkon = RUTBE_ETKI[u.rutbe] || '';
      html += '<div class="card" style="padding:12px;margin-bottom:8px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #222">';
      html += '<span style="font-family:Cinzel,serif;color:var(--race-color);font-size:13px;font-weight:bold">' + rutbeIkon + ' ' + (u.kral || '?') + '</span>';
      html += '<span style="font-size:10px;color:#666">' + (u.rutbe || 'uye') + '</span>';
      html += '</div>';

      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';

      // Verdi sutunu
      html += '<div>';
      html += '<div style="font-size:10px;color:#2ecc71;margin-bottom:4px;font-weight:bold">🎁 VERDI</div>';
      if (verdiKeys.length === 0) {
        html += '<div style="color:#444;font-size:10px">—</div>';
      } else {
        verdiKeys.forEach(function(k){
          html += '<div style="font-size:11px;color:#ccc;padding:2px 0">' +
            (KAYNAK_IKON_LOCAL[k] || '•') + ' ' +
            '<b style="color:#2ecc71">' + u.verdi[k].toLocaleString('tr-TR') + '</b> ' +
            '<span style="color:#888">' + (KAYNAK_ISIM_LOCAL[k] || k) + '</span>' +
          '</div>';
        });
      }
      html += '</div>';

      // Aldi sutunu
      html += '<div>';
      html += '<div style="font-size:10px;color:#f39c12;margin-bottom:4px;font-weight:bold">📦 ALDI</div>';
      if (aldiKeys.length === 0) {
        html += '<div style="color:#444;font-size:10px">—</div>';
      } else {
        aldiKeys.forEach(function(k){
          html += '<div style="font-size:11px;color:#ccc;padding:2px 0">' +
            (KAYNAK_IKON_LOCAL[k] || '•') + ' ' +
            '<b style="color:#f39c12">' + u.aldi[k].toLocaleString('tr-TR') + '</b> ' +
            '<span style="color:#888">' + (KAYNAK_ISIM_LOCAL[k] || k) + '</span>' +
          '</div>';
        });
      }
      html += '</div>';

      html += '</div></div>';
    });

    if (!varBilgi) {
      html += '<div class="card" style="padding:30px;text-align:center;color:#555;font-size:11px">' +
        'Son ' + d.saat + ' saatte hicbir uye bagis/ambar islemi yapmadi.' +
      '</div>';
    }

    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi: ' + e.message + '</div>';
  }
}

function uyeOzetSaat(s) {
  UYE_OZET_SAAT = s;
  if (GUILD_DATA) {
    var el = document.getElementById('guild-tab-content');
    if (el) renderTabUyeOzet(el, GUILD_DATA);
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
            '<span style="font-size:11px;color:#888">⏱ ' + sureTxt + ' kaldi</span>' +
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
            '<button class="btn-action" style="width:auto;padding:3px 10px;font-size:11px;background:#2a5a2a" onclick="guildMezarlikDirilt(' + gId + ',' + k.id + ')">Dirilt (' + fmt(k.birim_maliyet) + '/unit)</button>' +
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

// v1.13.68.5: Guild Ekonomi Ozet tablosu (oyuncu sayfasindaki ile ayni format)
var GUILD_OZET_SAAT = 24;
var GUILD_KAYNAK_LABEL = {
  altin:'💰 Altın', metal:'⛏️ Metal', odun:'🌳 Odun', kereste:'🪵 Kereste', islenmis:'⚙️ İşlenmiş',
  bugday:'🌾 Buğday', balik:'🎣 Balık', cig_et:'🥩 Çiğ Et', ekmek:'🍞 Ekmek', pismis:'🍳 Pis.Balık', pismis_et:'🍖 Pis.Et',
  mana_beyaz:'🤍 B.Mana', mana_kirmizi:'❤️ K.Mana', mana_mavi:'💙 M.Mana', mana_yesil:'💚 Y.Mana'
};

function renderTabEkonomiOzet(el, data) {
  var g = data.guild || {};
  el.innerHTML =
    '<div class="card">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
        '<h3 style="color:#c8a96e;font-family:\'Cinzel\',serif;margin:0">📊 Guild Ekonomi Ozet Tablosu</h3>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<span style="font-size:10px;color:#888">Zaman:</span>' +
          ['24','48','72','168'].map(function(s){
            return '<button class="btn-gozet-saat" id="gozet-saat-' + s + '" onclick="guildOzetSaatDegistir(' + s + ',' + g.id + ')">' + s + ' P.G.</button>';
          }).join('') +
          '<button class="btn-action" onclick="loadGuildEkonomiOzet(' + g.id + ')" style="padding:4px 12px;font-size:11px;width:auto">↻ Yenile</button>' +
        '</div>' +
      '</div>' +
      '<p style="font-size:11px;color:#888;margin-bottom:10px">Guild kasasindaki son N PG kaynak hareketleri. İşçi uretim, uye bagisi, dagitim, savas ganimeti, yemek tuketim... hepsi burada.</p>' +
      '<style>' +
        '.btn-gozet-saat { padding:4px 10px;font-size:10px;background:#1a1a1a;border:1px solid #333;color:#888;border-radius:4px;cursor:pointer }' +
        '.btn-gozet-saat.on { background:#c8a96e;color:#000;border-color:#c8a96e;font-weight:bold }' +
        '.gozet-tbl { width:100%;border-collapse:collapse;font-size:10px;background:#0a0a08 }' +
        '.gozet-tbl th,.gozet-tbl td { padding:4px 6px;border:1px solid #1e1e1e;text-align:right;white-space:nowrap }' +
        '.gozet-tbl th { background:#1a1510;color:#c8a96e;font-weight:bold;position:sticky;top:0 }' +
        '.gozet-tbl th:first-child,.gozet-tbl td:first-child,.gozet-tbl td:nth-child(2) { text-align:left }' +
        '.gozet-tbl td.yon-gelir { color:#2ecc71 }' +
        '.gozet-tbl td.yon-gider { color:#e74c3c }' +
        '.gozet-tbl tr.toplam-row { background:#150f08;font-weight:bold }' +
        '.gozet-tbl tr.toplam-gelir td { color:#2ecc71 }' +
        '.gozet-tbl tr.toplam-gider td { color:#e74c3c }' +
        '.gozet-tbl tr.toplam-net td { color:#d4af37;border-top:2px solid #d4af37 }' +
      '</style>' +
      '<div id="gozet-loading" style="color:#888;font-size:13px;text-align:center;padding:40px">Yukleniyor...</div>' +
      '<div id="gozet-wrap" style="display:none;overflow-x:auto;max-height:70vh"></div>' +
      '<div id="gozet-empty" style="display:none;color:#777;font-size:13px;text-align:center;padding:40px">Bu zaman araliginda ekonomik hareket yok.</div>' +
    '</div>';
  loadGuildEkonomiOzet(g.id);
}

function guildOzetSaatDegistir(s, gId) { GUILD_OZET_SAAT = s; loadGuildEkonomiOzet(gId); }

async function loadGuildEkonomiOzet(gId) {
  if (!gId) return;
  var loading = document.getElementById('gozet-loading');
  var wrap = document.getElementById('gozet-wrap');
  var empty = document.getElementById('gozet-empty');
  if (loading) loading.style.display = 'block';
  if (wrap) wrap.style.display = 'none';
  if (empty) empty.style.display = 'none';
  ['24','48','72','168'].forEach(function(s){
    var b = document.getElementById('gozet-saat-' + s);
    if (b) b.classList.toggle('on', String(GUILD_OZET_SAAT) === s);
  });
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + gId + '/ekonomi-ozet?saat=' + GUILD_OZET_SAAT, { headers: guildHdr() });
    var d = await resp.json();
    if (!resp.ok || !d.ok) throw new Error(d.error || 'Hata');
    if ((!d.gelirler || !d.gelirler.length) && (!d.giderler || !d.giderler.length)) {
      if (loading) loading.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    var kullanilanSet = {};
    (d.gelirler||[]).concat(d.giderler||[]).forEach(function(r){ Object.keys(r.toplamlar).forEach(function(k){ kullanilanSet[k] = 1; }); });
    Object.keys(d.toplam_gelir||{}).forEach(function(k){ kullanilanSet[k] = 1; });
    Object.keys(d.toplam_gider||{}).forEach(function(k){ kullanilanSet[k] = 1; });
    var kaynaklar = (d.kaynaklar||[]).filter(function(k){ return kullanilanSet[k]; });
    var fmt = function(n) { return n ? Math.round(n).toLocaleString('tr-TR') : '—'; };
    var html = '<table class="gozet-tbl"><thead><tr><th style="width:60px">Tip</th><th style="min-width:180px">Kategori</th>';
    kaynaklar.forEach(function(k){ html += '<th style="min-width:90px">' + (GUILD_KAYNAK_LABEL[k] || k) + '</th>'; });
    html += '</tr></thead><tbody>';
    (d.gelirler||[]).forEach(function(r){
      html += '<tr><td style="color:#2ecc71;font-weight:bold">📈 Gelir</td><td>' + r.isim + '</td>';
      kaynaklar.forEach(function(k){ html += '<td class="yon-gelir">' + fmt(r.toplamlar[k]) + '</td>'; });
      html += '</tr>';
    });
    if ((d.gelirler||[]).length) {
      html += '<tr class="toplam-row toplam-gelir"><td>📈 TOPLAM</td><td>Gelir</td>';
      kaynaklar.forEach(function(k){ html += '<td>' + fmt(d.toplam_gelir[k]) + '</td>'; });
      html += '</tr>';
    }
    (d.giderler||[]).forEach(function(r){
      html += '<tr><td style="color:#e74c3c;font-weight:bold">📉 Gider</td><td>' + r.isim + '</td>';
      kaynaklar.forEach(function(k){ html += '<td class="yon-gider">' + fmt(r.toplamlar[k]) + '</td>'; });
      html += '</tr>';
    });
    if ((d.giderler||[]).length) {
      html += '<tr class="toplam-row toplam-gider"><td>📉 TOPLAM</td><td>Gider</td>';
      kaynaklar.forEach(function(k){ html += '<td>' + fmt(d.toplam_gider[k]) + '</td>'; });
      html += '</tr>';
    }
    html += '<tr class="toplam-row toplam-net"><td>⚖️ NET</td><td>Gelir − Gider</td>';
    kaynaklar.forEach(function(k){ var v = d.net[k] || 0; html += '<td>' + (v > 0 ? '+' : '') + fmt(v) + '</td>'; });
    html += '</tr>';
    html += '</tbody></table>';
    if (wrap) { wrap.innerHTML = html; wrap.style.display = 'block'; }
    if (loading) loading.style.display = 'none';
  } catch(e) {
    if (loading) loading.textContent = 'Hata: ' + e.message;
  }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadGuild(); }
  }, 500);
});
