/* page-casus.js — Casus sistemi frontend v1.4 */

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

    el.innerHTML =
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:11px;color:#888">Casuslar: ' + casuslar.length + ' / ' + maxSlot + ' | Gizlilik: ' + gizlilik.toFixed(1) + '</span>' +
          (casuslar.length < maxSlot ? '<button class="btn-action" style="width:auto;padding:5px 14px;font-size:10px" onclick="casusEgit()">🕵️ Yeni Casus Egit (10K Altin)</button>' : '') +
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
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1a1a">' +
              '<div><span style="font-size:12px">🕵️</span> Casus #' + c.id + ' <span style="font-size:9px;color:#888">Sv.' + c.seviye + '</span></div>' +
              '<div style="display:flex;align-items:center;gap:6px">' +
                '<span style="font-size:10px;color:' + durumRenk + '">' + c.durum + kalanStr + '</span>' +
                (c.durum === 'hazir' ? '<button class="btn-action" style="width:auto;padding:3px 8px;font-size:9px" onclick="casusGonderModal(' + c.id + ')">Goreve Gonder</button>' : '') +
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
  m.innerHTML = '<div class="card" style="margin-top:8px">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">Goreve Gonder — Casus #' + casusId + '</div>' +
    '<div style="margin-bottom:6px"><label style="font-size:10px;color:#888">Hedef Oyuncu ID</label><input id="casus-hedef" type="number" style="width:80px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:11px"></div>' +
    '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
      '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="casusGonder(' + casusId + ',\'kaynak_casusu\')">Kaynak Casusu (3PG)</button>' +
      '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="casusGonder(' + casusId + ',\'ordu_casusu\')">Ordu Casusu (4PG)</button>' +
      '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px;background:#c0392b" onclick="casusGonder(' + casusId + ',\'sabotaj\')">Sabotaj (6PG)</button>' +
    '</div>' +
  '</div>';
}

async function casusGonder(casusId, gorevTipi) {
  var hedef = parseInt(document.getElementById('casus-hedef')?.value);
  if (!hedef) { alert('Hedef oyuncu ID girin'); return; }
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
