/* ═══════════════════════════════════════════════════════
   PALANTİS — GUILD SAYFASI
   js/page-guild.js — v1.4
═══════════════════════════════════════════════════════ */
var GUILD_DATA = null;

async function loadGuild() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('guild-content');
  try {
    var resp = await fetch(API_BASE + '/api/guild/benim', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c;padding:20px">' + (data.error || 'Hata') + '</div>'; return; }
    GUILD_DATA = data;

    if (!data.guild) {
      renderGuildYok(el);
    } else {
      renderGuild(el, data);
    }
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c;padding:20px">Baglanti hatasi</div>';
  }
}

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ isim: isim, tag: tag })
    });
    var data = await resp.json();
    if (resp.ok && data.basarili) {
      if (typeof toast === 'function') toast(data.mesaj);
      loadGuild();
    } else {
      if (msg) msg.innerHTML = '<span style="color:#e74c3c">' + (data.error || 'Hata') + '</span>';
    }
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
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/katil', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (resp.ok) { if (typeof toast === 'function') toast(data.mesaj); loadGuild(); }
    else { alert(data.error || 'Hata'); }
  } catch(e) { alert('Baglanti hatasi'); }
}

function renderGuild(el, data) {
  var g = data.guild;
  var uyeler = data.uyeler || [];
  var kasa = data.kasa || {};
  var diplomasi = data.diplomasi || [];
  var rutbe = data.benim_rutbem;
  var isLider = rutbe === 'lider';
  var isYardimci = rutbe === 'yardimci';
  var fmt = function(n) { return (n||0).toLocaleString('tr-TR'); };

  // Kasa kaynaklari
  var kasaHTML = ['altin','odun','metal','bugday','balik','kereste','islenmis'].map(function(k) {
    var icons = {altin:'💰',odun:'🌳',metal:'⛏️',bugday:'🌾',balik:'🐟',kereste:'🪵',islenmis:'🔩'};
    return '<div style="display:flex;align-items:center;gap:4px;font-size:10px"><span>' + (icons[k]||'') + '</span><span style="color:#d4af37;font-weight:bold">' + fmt(kasa[k]) + '</span><span style="color:#666">' + k + '</span></div>';
  }).join('');

  // Uye listesi
  var uyeHTML = uyeler.map(function(u) {
    var rutbeIcon = u.rutbe === 'lider' ? '👑' : u.rutbe === 'yardimci' ? '⭐' : '🏅';
    var aksiyonlar = '';
    if (isLider && u.player_id !== data.guild.lider_id) {
      aksiyonlar = '<button style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:9px" onclick="guildAt(' + g.id + ',' + u.player_id + ')">At</button>' +
        '<select style="background:#111;border:1px solid #333;color:#ddd;font-size:9px;border-radius:3px;padding:1px" onchange="guildRutbe(' + g.id + ',' + u.player_id + ',this.value)">' +
          '<option value="uye"' + (u.rutbe==='uye'?' selected':'') + '>Uye</option>' +
          '<option value="yardimci"' + (u.rutbe==='yardimci'?' selected':'') + '>Yardimci</option>' +
        '</select>';
    }
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1a1a1a;font-size:11px">' +
      '<span>' + rutbeIcon + ' ' + u.kullanici_adi + ' <span style="color:#555;font-size:9px">Cag ' + (u.cag||1) + '</span></span>' +
      '<div style="display:flex;gap:4px;align-items:center">' + aksiyonlar + '</div>' +
    '</div>';
  }).join('');

  // Bagis
  var bagisHTML = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">' +
    ['altin','odun','metal'].map(function(k) {
      return '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="guildBagis(' + g.id + ',\'' + k + '\')">💰 ' + k + ' bagisla</button>';
    }).join('') +
  '</div>';

  el.innerHTML =
    // Guild bilgi karti
    '<div class="card" style="border-left-color:var(--race-color)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<div><span style="font-family:Cinzel,serif;font-size:16px;color:var(--race-color);font-weight:bold">[' + g.tag + '] ' + g.isim + '</span> <span style="font-size:10px;color:#888">Sv.' + g.seviye + ' | ' + uyeler.length + ' uye</span></div>' +
        (!isLider ? '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:10px;background:#333;color:#e74c3c" onclick="guildAyril(' + g.id + ')">Ayril</button>' : '') +
      '</div>' +
      (g.duyuru ? '<div style="background:#0a0a0a;border-left:2px solid var(--race-color);padding:6px 10px;font-size:10px;color:#ccc;margin-bottom:8px;border-radius:4px">📢 ' + g.duyuru + '</div>' : '') +
      (isLider ? '<div style="margin-bottom:8px"><textarea id="guild-duyuru-inp" rows="2" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px" placeholder="Duyuru yaz...">' + (g.duyuru||'') + '</textarea><button class="btn-action" style="width:auto;padding:3px 10px;font-size:9px;margin-top:2px" onclick="guildDuyuruKaydet(' + g.id + ')">Kaydet</button></div>' : '') +
    '</div>' +

    // Kasa
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">💰 Guild Kasasi</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' + kasaHTML + '</div>' +
      bagisHTML +
    '</div>' +

    // Uyeler
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">👥 Uyeler (' + uyeler.length + ')</div>' +
      uyeHTML +
    '</div>' +

    // Diplomasi
    '<div class="card">' +
      '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">⚔️ Diplomasi</div>' +
      (diplomasi.length === 0 ? '<div style="font-size:10px;color:#555">Aktif antlasma yok</div>' :
        diplomasi.map(function(d) {
          var karsi = d.guild1_id === g.id ? d.guild2_adi : d.guild1_adi;
          var karsiTag = d.guild1_id === g.id ? d.guild2_tag : d.guild1_tag;
          var tipIcon = d.tip === 'savas' ? '⚔️' : '🤝';
          return '<div style="font-size:10px;padding:3px 0">' + tipIcon + ' [' + karsiTag + '] ' + karsi + ' — ' + d.tip + '</div>';
        }).join('')) +
    '</div>';
}

async function guildAyril(guildId) {
  if (!confirm('Guildden ayrilmak istediginize emin misiniz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/ayril', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildAt(guildId, playerId) {
  if (!confirm('Bu uyeyi atmak istediginize emin misiniz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/at', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ playerId: playerId })
    });
    var data = await resp.json();
    if (resp.ok) { toast('Uye atildi'); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function guildRutbe(guildId, playerId, rutbe) {
  var token = getToken(); if (!token) return;
  try {
    await fetch(API_BASE + '/api/guild/' + guildId + '/rutbe', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ playerId: playerId, rutbe: rutbe })
    });
    toast('Rutbe guncellendi'); loadGuild();
  } catch(e) {}
}

async function guildDuyuruKaydet(guildId) {
  var token = getToken(); if (!token) return;
  var duyuru = document.getElementById('guild-duyuru-inp')?.value || '';
  try {
    await fetch(API_BASE + '/api/guild/' + guildId + '/duyuru', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ duyuru: duyuru })
    });
    toast('Duyuru kaydedildi');
  } catch(e) {}
}

async function guildBagis(guildId, kaynak) {
  var miktar = prompt(kaynak + ' ne kadar bagislamak istiyorsunuz?');
  if (!miktar || isNaN(miktar) || parseInt(miktar) <= 0) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/guild/' + guildId + '/bagis', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ kaynak: kaynak, miktar: parseInt(miktar) })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadGuild(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadGuild(); }
  }, 500);
});
