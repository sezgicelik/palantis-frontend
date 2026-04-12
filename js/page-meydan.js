/* page-meydan.js — Sehir Meydani + Ozel Mesajlar v1.4 */

function meydanTab(tab) {
  document.getElementById('meydan-tab').style.display = tab === 'meydan' ? 'block' : 'none';
  document.getElementById('ozel-tab').style.display = tab === 'ozel' ? 'block' : 'none';
  document.getElementById('tab-meydan').className = 'atab' + (tab === 'meydan' ? ' on' : '');
  document.getElementById('tab-ozel').className = 'atab' + (tab === 'ozel' ? ' on' : '');
  if (tab === 'meydan') loadMeydanMesajlar();
  if (tab === 'ozel') loadOzelMesajlar();
}

async function loadMeydanMesajlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('meydan-mesajlar');
  try {
    var resp = await fetch(API_BASE + '/api/meydan/mesajlar', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { el.innerHTML = '<div style="color:#555;text-align:center;padding:40px">Henuz mesaj yok. Ilk mesaji siz yazin!</div>'; return; }
    el.innerHTML = data.map(function(m) {
      var tarafRenk = m.taraf === 'iyi' ? '#d4af37' : '#9370f7';
      var guildTag = m.guild_tag ? '<span style="color:#888;font-size:9px">[' + m.guild_tag + ']</span> ' : '';
      var saat = new Date(m.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'});
      return '<div style="padding:4px 0;border-bottom:1px solid #1a1a1a">' +
        '<span style="color:#555;font-size:9px;margin-right:4px">' + saat + '</span>' +
        guildTag +
        '<span style="color:' + tarafRenk + ';font-weight:bold;font-size:11px">' + m.kullanici_adi + ':</span> ' +
        '<span style="color:#ccc">' + escapeHtml(m.mesaj) + '</span>' +
      '</div>';
    }).join('');
    el.scrollTop = el.scrollHeight;
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>'; }
}

function escapeHtml(t) {
  var d = document.createElement('div'); d.textContent = t; return d.innerHTML;
}

async function meydanYaz() {
  var inp = document.getElementById('meydan-inp');
  var mesaj = inp?.value?.trim();
  if (!mesaj) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/meydan/yaz', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ mesaj: mesaj })
    });
    var data = await resp.json();
    if (resp.ok) { inp.value = ''; loadMeydanMesajlar(); }
    else { toast(data.error || 'Hata'); }
  } catch(e) { toast('Baglanti hatasi'); }
}

// Enter ile gonder
document.addEventListener('DOMContentLoaded', function() {
  var inp = document.getElementById('meydan-inp');
  if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') meydanYaz(); });
});

async function loadOzelMesajlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('ozel-mesajlar');
  try {
    var resp = await fetch(API_BASE + '/api/meydan/ozel', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    var mesajlar = data.mesajlar || [];
    var okunmamis = data.okunmamis || 0;

    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:11px;color:#888">Gelen Mesajlar' + (okunmamis > 0 ? ' <span style="color:#e74c3c;font-weight:bold">(' + okunmamis + ' yeni)</span>' : '') + '</span>' +
        '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:9px" onclick="ozelMesajGonderModal()">Yeni Mesaj</button>' +
      '</div>' +
      '<div id="ozel-gonder-modal" style="display:none;margin-bottom:8px"></div>' +
      (mesajlar.length === 0 ? '<div style="color:#555;font-size:11px">Mesaj yok.</div>' :
        mesajlar.map(function(m) {
          var okunduIcon = m.okundu ? '📧' : '📩';
          var tarih = new Date(m.created_at).toLocaleString('tr-TR');
          return '<div class="card" style="padding:8px 10px;margin-bottom:4px;' + (!m.okundu ? 'border-left-color:#e74c3c' : '') + '">' +
            '<div style="display:flex;justify-content:space-between;font-size:10px">' +
              '<span>' + okunduIcon + ' <b>' + m.gonderen_adi + '</b>' + (m.baslik ? ' — ' + m.baslik : '') + '</span>' +
              '<span style="color:#555">' + tarih + '</span>' +
            '</div>' +
            '<div style="font-size:10px;color:#ccc;margin-top:3px">' + escapeHtml(m.mesaj).substring(0, 200) + '</div>' +
            (!m.okundu ? '<button style="background:none;border:none;color:#2ecc71;cursor:pointer;font-size:9px;margin-top:3px" onclick="ozelOku(' + m.id + ')">Okundu isaretle</button>' : '') +
          '</div>';
        }).join(''));
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Hata</div>'; }
}

function ozelMesajGonderModal() {
  var m = document.getElementById('ozel-gonder-modal');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
  m.innerHTML = '<div class="card" style="padding:10px">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">Ozel Mesaj Gonder</div>' +
    '<div style="margin-bottom:4px"><label style="font-size:9px;color:#888">Hedef Oyuncu ID</label><input id="ozel-hedef" type="number" style="width:80px;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px"></div>' +
    '<div style="margin-bottom:4px"><label style="font-size:9px;color:#888">Baslik</label><input id="ozel-baslik" maxlength="100" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px"></div>' +
    '<div style="margin-bottom:6px"><textarea id="ozel-mesaj" rows="3" maxlength="2000" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px" placeholder="Mesajiniz..."></textarea></div>' +
    '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:9px" onclick="ozelGonder()">Gonder</button>' +
  '</div>';
}

async function ozelGonder() {
  var hedef = parseInt(document.getElementById('ozel-hedef')?.value);
  var baslik = document.getElementById('ozel-baslik')?.value || '';
  var mesaj = document.getElementById('ozel-mesaj')?.value?.trim();
  if (!hedef || !mesaj) { alert('Hedef ve mesaj gerekli'); return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/meydan/ozel/gonder', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ hedefPlayerId: hedef, baslik: baslik, mesaj: mesaj })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadOzelMesajlar(); } else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function ozelOku(mesajId) {
  var token = getToken(); if (!token) return;
  await fetch(API_BASE + '/api/meydan/ozel/' + mesajId + '/oku', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
  loadOzelMesajlar();
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() { attempts++; if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadMeydanMesajlar(); } }, 500);
});
