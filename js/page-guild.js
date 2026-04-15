/* ═══════════════════════════════════════════════════════
   NOXARA — GUILD SAYFASI
   js/page-guild.js — v1.10 (Tab yapisi + Yetki + Isci + Ambar)
═══════════════════════════════════════════════════════ */
var GUILD_DATA = null;
var GUILD_CONFIG = null;
var GUILD_AKTIF_TAB = 'genel';

var KAYNAK_IKON = {altin:'💰',odun:'🌳',metal:'⛏️',bugday:'🌾',balik:'🐟',kereste:'🪵',islenmis:'🔩'};
var ISCI_IKON = {oduncu:'🪓',madenci:'⛏️',ciftci:'🌾',balikci:'🐟'};

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
  { id: 'genel',  label: '🏰 Genel',    aktif: true },
  { id: 'uyeler', label: '👥 Uyeler',    aktif: true },
  { id: 'kasa',   label: '💰 Kasa',      aktif: true },
  { id: 'isciler',label: '⚒️ Isciler',  aktif: true },
  { id: 'market', label: '🏪 Market',    aktif: false },
  { id: 'binalar',label: '🏗️ Binalar',  aktif: false },
  { id: 'savas',  label: '⚔️ Savas Odasi', aktif: false }
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
    case 'genel':  renderTabGenel(el, data); break;
    case 'uyeler': renderTabUyeler(el, data); break;
    case 'kasa':   renderTabKasa(el, data); break;
    case 'isciler':renderTabIsciler(el, data); break;
    default:       el.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:#555"><div style="font-size:30px;margin-bottom:8px">🔒</div><p style="font-size:12px">Bu ozellik Faz 2\'de aktif olacak.</p></div>';
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

    // Guild sehir bilgisi
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">🏰 Guild Sehri</div>' +
      (sehir ?
        '<div style="font-size:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px">' +
          '<div>Konum: <span style="color:#d4af37">' + sehir.x + ':' + sehir.y + '</span></div>' +
          '<div>Alan: <span style="color:#d4af37">' + fmt(sehir.alan) + '</span></div>' +
        '</div>' :
        '<div style="font-size:10px;color:#555">Sehir bilgisi yok</div>') +
    '</div>' +

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
      koylu_bagisi:'Koylu Bagisi', vergi_dagit:'Vergi Dagit', market_otosatis:'Oto Satis'
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
  var isciler = data.guild_isciler || { oduncu:0, madenci:0, ciftci:0, balikci:0 };
  var myYetkiler = data.benim_yetkilerim || {};
  var toplam_isci = (isciler.oduncu||0) + (isciler.madenci||0) + (isciler.ciftci||0) + (isciler.balikci||0);

  var nufusHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:12px">' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">👨‍🌾</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.koylu) + '</div><div style="font-size:9px;color:#888">Koylu</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">⚒️</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(toplam_isci) + '</div><div style="font-size:9px;color:#888">Isci</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">⚔️</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.asker) + '</div><div style="font-size:9px;color:#888">Asker</div></div>' +
      '<div class="card" style="text-align:center;padding:8px"><div style="font-size:18px">🙏</div><div style="font-size:14px;color:#d4af37;font-weight:bold">' + fmt(nufus.worshipper) + '</div><div style="font-size:9px;color:#888">Worshipper</div></div>' +
    '</div>';

  // Isci dagilimi
  var isciHTML = '<div class="card">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚒️ Isci Dagilimi</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      ['oduncu','madenci','ciftci','balikci'].map(function(tip) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:#111;border-radius:4px">' +
          '<span style="font-size:10px">' + (ISCI_IKON[tip]||'') + ' ' + tip + ': <span style="color:#d4af37;font-weight:bold">' + fmt(isciler[tip]) + '</span></span>' +
          (myYetkiler.isci_ata ? '<div style="display:flex;gap:2px">' +
            '<button style="background:#2ecc71;color:#000;border:none;padding:2px 6px;border-radius:3px;font-size:9px;cursor:pointer" onclick="guildIsciAta(' + g.id + ',\'' + tip + '\')">+</button>' +
            '<button style="background:#e74c3c;color:#fff;border:none;padding:2px 6px;border-radius:3px;font-size:9px;cursor:pointer" onclick="guildIsciCikar(' + g.id + ',\'' + tip + '\')">-</button>' +
          '</div>' : '') +
        '</div>';
      }).join('') +
    '</div>' +
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

// Init
document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadGuild(); }
  }, 500);
});
