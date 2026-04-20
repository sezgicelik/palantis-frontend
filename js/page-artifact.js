/* page-artifact.js — Artifact sistemi frontend v1.4 */

async function loadArtifact() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('artifact-content');
  try {
    var resp = await fetch(API_BASE + '/api/artifact/liste', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (data.error||'Hata') + '</div>'; return; }

    var artlar = data.artifactlar || [];
    var tanimlar = data.tanimlar || {};

    if (!artlar.length) {
      el.innerHTML = '<div class="card" style="text-align:center;padding:30px"><div style="font-size:30px;margin-bottom:8px">🧰</div><div style="font-size:11px;color:#555">Henuz artifactiniz yok. Savas kazanarak artifact elde edebilirsiniz.</div></div>';
      return;
    }

    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">' +
      artlar.map(function(a) {
        var t = a.tanim || tanimlar[a.artifact_id] || {};
        var aktifStr = '';
        if (a.aktif && a.aktif_bitis) {
          var kalan = new Date(a.aktif_bitis).getTime() - Date.now();
          if (kalan > 0) aktifStr = '<div style="font-size:11px;color:#2ecc71;margin-top:3px">Aktif — ' + Math.ceil(kalan/3600000) + ' PG kaldi</div>';
          else aktifStr = '<div style="font-size:11px;color:#888;margin-top:3px">Suresi doldu</div>';
        }
        return '<div class="card" style="padding:10px;text-align:center">' +
          '<div style="font-size:24px">' + (t.ikon || '❓') + '</div>' +
          '<div style="font-size:11px;font-weight:bold;color:var(--race-color);margin-top:4px">' + (t.isim || a.artifact_id) + '</div>' +
          '<div style="font-size:11px;color:#888;margin-top:2px">' + (t.aciklama || '') + '</div>' +
          '<div style="font-size:10px;color:#d4af37;margin-top:4px">x' + a.adet + '</div>' +
          aktifStr +
          (a.adet > 0 && !a.aktif ? '<button class="btn-action" style="width:auto;padding:3px 10px;font-size:11px;margin-top:6px" onclick="artifactKullan(' + a.id + ')">Kullan</button>' : '') +
        '</div>';
      }).join('') +
    '</div>';
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>'; }
}

async function artifactKullan(artId) {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/artifact/' + artId + '/kullan', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadArtifact(); if (typeof loadGameData === 'function') loadGameData(); }
    else alert(data.error);
  } catch(e) { alert('Hata'); }
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() { attempts++; if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadArtifact(); } }, 500);
});
