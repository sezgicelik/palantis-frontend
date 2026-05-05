/* page-gorev.js — Gorev sistemi frontend v1.4 */

async function loadGorevler() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('gorev-content');
  try {
    var resp = await fetch(API_BASE + '/api/gorev/liste', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (data.error||'Hata') + '</div>'; return; }

    var gorevler = data.gorevler || [];
    if (!gorevler.length) {
      el.innerHTML = '<div class="card" style="text-align:center;padding:30px"><div style="font-size:30px;margin-bottom:8px">📜</div><div style="font-size:11px;color:#555">Henuz gorev tanimlanmamis.</div></div>';
      return;
    }

    var anaGorevler = gorevler.filter(function(g) { return g.tip === 'ana'; });
    var yanGorevler = gorevler.filter(function(g) { return g.tip === 'yan'; });

    var html = '';

    // Ana gorevler
    if (anaGorevler.length > 0) {
      html += '<div style="font-size:12px;color:var(--race-color);font-weight:bold;font-family:Cinzel,serif;margin-bottom:8px">📋 Ana Gorevler</div>';
      html += anaGorevler.map(function(g) { return gorevKart(g); }).join('');
    }

    // Yan gorevler
    if (yanGorevler.length > 0) {
      html += '<div style="font-size:12px;color:var(--race-color);font-weight:bold;font-family:Cinzel,serif;margin:16px 0 8px">⭐ Yan Gorevler</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">';
      html += yanGorevler.map(function(g) { return gorevKart(g); }).join('');
      html += '</div>';
    }

    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>'; }
}

function gorevKart(g) {
  var tamamlandi = g.durum === 'tamamlandi';
  var odulAlindi = g.durum === 'odul_alindi';
  var kilitli = g.kilitli;
  var yuzde = g.hedef > 0 ? Math.min(100, Math.round(g.ilerleme / g.hedef * 100)) : 0;

  var borderColor = odulAlindi ? '#2ecc71' : tamamlandi ? '#f1c40f' : kilitli ? '#333' : 'var(--race-color)';
  var opacity = kilitli ? '0.4' : '1';

  // Odul gosterimi
  var odulStr = '';
  if (g.odul && typeof g.odul === 'object') {
    var icons = {altin:'💰',odun:'🌳',metal:'⛏️',bugday:'🌾',balik:'🐟',kereste:'🪵',islenmis:'🔩',koylu:'👥'};
    odulStr = Object.entries(g.odul).map(function(e) {
      return '<span style="font-size:11px;padding:1px 5px;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.15);border-radius:3px">' + (icons[e[0]]||'📦') + ' +' + e[1].toLocaleString('tr-TR') + '</span>';
    }).join(' ');
  }

  // Durum ikonu
  var durumIcon = odulAlindi ? '✅' : tamamlandi ? '🏆' : kilitli ? '🔒' : '⏳';
  var durumText = odulAlindi ? 'Odul alindi' : tamamlandi ? 'Tamamlandi!' : kilitli ? 'Kilitli' : g.ilerleme + ' / ' + g.hedef;

  // Ilerleme bari
  var barHTML = !kilitli && !odulAlindi ? '<div style="height:3px;background:#1a1a1a;border-radius:2px;margin:6px 0 4px;overflow:hidden"><div style="height:100%;width:' + yuzde + '%;background:' + (tamamlandi ? '#f1c40f' : 'var(--race-color)') + ';border-radius:2px;transition:width .5s"></div></div>' : '';

  // Butonlar
  var btnHTML = '';
  if (tamamlandi && !odulAlindi) {
    btnHTML = '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:11px;margin-top:4px" onclick="gorevOdulAl(' + g.id + ')">🎁 Odulu Al</button>';
  }

  return '<div class="card" style="padding:10px 12px;border-left-color:' + borderColor + ';opacity:' + opacity + '">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      '<div>' +
        '<div style="font-size:11px;font-weight:bold;color:' + (odulAlindi ? '#2ecc71' : tamamlandi ? '#f1c40f' : '#ddd') + '">' + durumIcon + ' ' + g.baslik + '</div>' +
        (g.aciklama ? '<div style="font-size:11px;color:#888;margin-top:2px">' + g.aciklama + '</div>' : '') +
      '</div>' +
      '<div style="font-size:11px;color:#666;text-align:right">' + durumText + '</div>' +
    '</div>' +
    barHTML +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">' +
      '<div style="display:flex;gap:3px;flex-wrap:wrap">' + odulStr + '</div>' +
      btnHTML +
    '</div>' +
  '</div>';
}

async function gorevOdulAl(gorevId) {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/gorev/' + gorevId + '/odul', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (resp.ok) {
      toast(data.mesaj);
      loadGorevler();
      if (typeof loadGameData === 'function') loadGameData();
    } else noxAlert(data.error);
  } catch(e) { noxAlert('Hata'); }
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() { attempts++; if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadGorevler(); } }, 500);
});
