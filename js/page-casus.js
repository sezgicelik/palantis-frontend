/* page-casus.js — Casus sistemi frontend v1.7.4 (11 operasyon) */

var GOREV_TIPLERI = {};

const GOREV_ISIMLERI = {
  bolge_incele:'Bolge Incele', koloni_incele:'Koloni Incele', ordu_incele:'Ordu Incele',
  yemek_hirsizligi:'Yemek Hirsizligi', ordu_saldiri_incele:'Saldiri Istihbarat',
  kaynak_hirsizligi:'Kaynak Hirsizligi', kargasa:'Kargasa', bilim_hirsizligi:'Bilim Hirsizligi',
  stratejik_bilgiler:'Stratejik Bilgiler', katliam:'Katliam', sabotaj:'Sabotaj'
};
const GOREV_IKONLARI = {
  bolge_incele:'🗺️', koloni_incele:'🏰', ordu_incele:'⚔️', yemek_hirsizligi:'🍞',
  ordu_saldiri_incele:'🎯', kaynak_hirsizligi:'💰', kargasa:'🔥', bilim_hirsizligi:'📚',
  stratejik_bilgiler:'📊', katliam:'💀', sabotaj:'💣'
};
const GOREV_RENK = {
  bolge_incele:'#3498db', koloni_incele:'#3498db', ordu_incele:'#3498db',
  yemek_hirsizligi:'#f39c12', ordu_saldiri_incele:'#3498db',
  kaynak_hirsizligi:'#f39c12', kargasa:'#e74c3c', bilim_hirsizligi:'#9b59b6',
  stratejik_bilgiler:'#3498db', katliam:'#e74c3c', sabotaj:'#e74c3c'
};

async function loadCasus() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('casus-content');
  try {
    var resp = await fetch(API_BASE + '/api/casus/liste', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (data.error||'Hata') + '</div>'; return; }

    var casuslar = data.casuslar || [];
    var maxSlot = data.max_slot || 1;
    var gizlilik = data.gizlilik || 0;
    GOREV_TIPLERI = data.gorev_tipleri || {};

    el.innerHTML =
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:11px;color:#888">Casuslar: ' + casuslar.filter(c=>c.durum!=='oldu').length + ' / ' + maxSlot + ' | Gizlilik: ' + gizlilik.toFixed(1) + '</span>' +
          (casuslar.filter(c=>c.durum!=='oldu').length < maxSlot ? '<button class="btn-action" style="width:auto;padding:5px 14px;font-size:10px" onclick="casusEgit()">🕵️ Yeni Casus Egit</button>' : '') +
        '</div>' +
        (casuslar.length === 0 ? '<div style="color:#555;font-size:11px">Henuz casusunuz yok. Lonca binasi yaparak gizlilik puani kazanin.</div>' :
          casuslar.map(function(c) {
            var durumRenk = c.durum === 'hazir' ? '#2ecc71' : c.durum === 'gorevde' ? '#f1c40f' : '#e74c3c';
            var kalanStr = '';
            if (c.bitis && c.durum === 'gorevde') {
              var kalan = new Date(c.bitis).getTime() - Date.now();
              if (kalan > 0) kalanStr = ' (' + Math.ceil(kalan/3600000) + ' PG kaldi)';
              else kalanStr = ' (Donus bekleniyor)';
            }
            var canBar = c.can !== undefined ? '<div style="font-size:8px;color:#888;margin-top:2px">❤️ ' + (c.can||0) + '/100 | XP: ' + (c.deneyim||0) + '</div>' : '';
            return '<div style="padding:6px 0;border-bottom:1px solid #1a1a1a">' +
              '<div style="display:flex;align-items:center;justify-content:space-between">' +
                '<div><span style="font-size:12px">🕵️</span> Casus #' + c.id + ' <span style="font-size:9px;color:#888">Sv.' + (c.seviye||1) + '</span>' + canBar + '</div>' +
                '<div style="display:flex;align-items:center;gap:6px">' +
                  '<span style="font-size:10px;color:' + durumRenk + '">' + c.durum + kalanStr + '</span>' +
                  (c.durum === 'hazir' ? '<button class="btn-action" style="width:auto;padding:3px 8px;font-size:9px" onclick="casusGonderModal(' + c.id + ')">Goreve Gonder</button>' : '') +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('')) +
      '</div>' +
      '<div id="casus-gonder-modal" style="display:none"></div>' +
      '<div id="casus-raporlar"></div>';

    loadCasusRaporlar();
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>'; }
}

async function casusEgit() {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/casus/egit', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadCasus(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

function casusGonderModal(casusId) {
  var m = document.getElementById('casus-gonder-modal');
  m.style.display = 'block';

  // Dinamik görev butonları (backend'den gelen 11 görev tipi)
  var butonlar = Object.entries(GOREV_TIPLERI).map(function(entry) {
    var tip = entry[0], g = entry[1];
    var isim = GOREV_ISIMLERI[tip] || tip;
    var ikon = GOREV_IKONLARI[tip] || '🕵️';
    var renk = GOREV_RENK[tip] || '#555';
    return '<button style="padding:5px 10px;font-size:9px;background:' + renk + '22;border:1px solid ' + renk + '44;color:' + renk + ';border-radius:4px;cursor:pointer;font-family:Cinzel,serif;letter-spacing:0.5px" ' +
      'onclick="casusGonder(' + casusId + ',\'' + tip + '\')" title="Sure: ' + g.sure + ' PG | Gizlilik: ' + g.gizlilik + ' | Basari: %' + g.baz_basari + '">' +
      ikon + ' ' + isim + ' <span style="font-size:7px;color:#888">(' + g.sure + 'PG / ' + g.gizlilik + 'G)</span></button>';
  }).join('');

  m.innerHTML = '<div class="card" style="margin-top:8px">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:8px">Goreve Gonder — Casus #' + casusId + '</div>' +
    '<div style="margin-bottom:8px"><label style="font-size:10px;color:#888">Hedef Oyuncu Adi</label>' +
      '<input id="casus-hedef-isim" type="text" placeholder="Kral ismi yazin..." style="width:160px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px">' +
      '<button onclick="casusHedefAra()" style="padding:4px 8px;background:#333;border:1px solid #555;color:#ddd;border-radius:4px;cursor:pointer;font-size:10px;margin-left:4px">Ara</button>' +
      '<div id="casus-hedef-sonuc" style="font-size:10px;margin-top:4px;min-height:16px"></div>' +
      '<input id="casus-hedef" type="hidden">' +
    '</div>' +
    '<div style="font-size:9px;color:#555;margin-bottom:6px">Gorev secin (hover ile detay gorun):</div>' +
    '<div style="display:flex;gap:4px;flex-wrap:wrap">' + butonlar + '</div>' +
  '</div>';
}

async function casusHedefAra() {
  var isim = document.getElementById('casus-hedef-isim')?.value?.trim();
  var sonuc = document.getElementById('casus-hedef-sonuc');
  if (!isim) { sonuc.innerHTML = '<span style="color:#e74c3c">Isim girin</span>'; return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/player/ara?isim=' + encodeURIComponent(isim), { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (data.length === 0) { sonuc.innerHTML = '<span style="color:#e74c3c">Oyuncu bulunamadi</span>'; return; }
    sonuc.innerHTML = data.map(function(p) {
      return '<div style="cursor:pointer;padding:2px 4px;border-radius:3px;margin:1px 0" onmouseover="this.style.background=\'#222\'" onmouseout="this.style.background=\'none\'" onclick="document.getElementById(\'casus-hedef\').value=\'' + p.id + '\';document.getElementById(\'casus-hedef-sonuc\').innerHTML=\'<span style=color:#2ecc71>Secildi: ' + p.kullanici_adi + ' (' + p.koord_x + ':' + p.koord_y + ')</span>\'">' +
        '<span style="color:var(--race-color)">' + p.kullanici_adi + '</span> <span style="color:#555;font-size:9px">(' + p.koord_x + ':' + p.koord_y + ') Cag ' + (p.cag||1) + '</span>' +
      '</div>';
    }).join('');
  } catch(e) { sonuc.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

async function casusGonder(casusId, gorevTipi) {
  var hedef = parseInt(document.getElementById('casus-hedef')?.value);
  if (!hedef) { alert('Once hedef oyuncu secin (isim ile arayip tiklayin)'); return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/casus/gonder', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ casusId: casusId, gorevTipi: gorevTipi, hedefPlayerId: hedef })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadCasus(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function loadCasusRaporlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('casus-raporlar');
  if (!el) return;
  try {
    var resp = await fetch(API_BASE + '/api/casus/raporlar', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { el.innerHTML = '<div class="card"><div style="font-size:10px;color:#555">Henuz rapor yok</div></div>'; return; }
    el.innerHTML = '<div class="card"><div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">📋 Raporlar</div>' +
      data.map(function(r) {
        var icon = r.basarili ? '✅' : '❌';
        return '<div style="font-size:10px;padding:3px 0;border-bottom:1px solid #1a1a1a">' + icon + ' ' + r.gorev_tipi + ' → ' + (r.hedef_adi||'?') + ' <span style="color:#555">' + new Date(r.created_at).toLocaleString('tr-TR') + '</span></div>';
      }).join('') + '</div>';
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() { attempts++; if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadCasus(); } }, 500);
});
