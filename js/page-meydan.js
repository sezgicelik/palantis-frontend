/* page-meydan.js — Sehir Meydani + Ozel Mesajlar v1.4 */

function meydanTab(tab) {
  document.getElementById('meydan-tab').style.display = tab === 'meydan' ? 'block' : 'none';
  document.getElementById('ozel-tab').style.display = tab === 'ozel' ? 'block' : 'none';
  document.getElementById('tab-meydan').className = 'atab' + (tab === 'meydan' ? ' on' : '');
  document.getElementById('tab-ozel').className = 'atab' + (tab === 'ozel' ? ' on' : '');
  if (tab === 'meydan') { loadMeydanMesajlar(); loadAktifOyuncular(); }
  if (tab === 'ozel') loadOzelMesajlar();
}

/* ═══════════════════════════════════════════════════════
   v1.14.3.35 — Aktif Oyuncular Paneli (sag yan)
   Veri kaynagi: backend /api/meydan/aktif-oyuncular
   Kategoriler: 🟢 Online (5dk) / 🟡 Aktif (30dk) / ⚪ Yakin (2sa)
   ═══════════════════════════════════════════════════════ */
async function loadAktifOyuncular() {
  var token = getToken(); if (!token) return;
  var liste = document.getElementById('aktif-liste');
  var ozet  = document.getElementById('aktif-ozet');
  if (!liste) return;
  try {
    var resp = await fetch(API_BASE + '/api/meydan/aktif-oyuncular', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { liste.innerHTML = '<div style="color:#e74c3c">Yüklenemedi</div>'; return; }
    var data = await resp.json();
    var oyuncular = data.oyuncular || [];
    var o = data.ozet || { online:0, aktif:0, yakin:0, toplam:0 };

    if (ozet) {
      ozet.innerHTML = '⏱️ Aktif: <span style="color:#e8d4a8">' + o.toplam + '</span> ' +
        '<span style="color:#666">(</span>' +
        '<span style="color:#2ecc71" title="Son 5 dakika">🟢' + o.online + '</span> ' +
        '<span style="color:#f1c40f" title="Son 30 dakika">🟡' + o.aktif + '</span> ' +
        '<span style="color:#888" title="Son 2 saat">⚪' + o.yakin + '</span>' +
        '<span style="color:#666">)</span>';
    }

    if (!oyuncular.length) {
      liste.innerHTML = '<div style="color:#666;font-size:11px;padding:6px;text-align:center">Aktif oyuncu yok</div>';
      return;
    }

    // v1.14.3.34 — XSS escape (kullanici_adi backend'den geliyor ama yine de escape)
    function _esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s||''); }

    function _zaman(sn) {
      if (sn < 60) return 'şimdi';
      if (sn < 3600) return Math.floor(sn/60) + ' dk önce';
      return Math.floor(sn/3600) + ' sa önce';
    }
    function _renk(durum) {
      if (durum === 'online') return '#2ecc71';
      if (durum === 'aktif')  return '#f1c40f';
      return '#888';
    }
    function _ikon(durum) {
      if (durum === 'online') return '🟢';
      if (durum === 'aktif')  return '🟡';
      return '⚪';
    }
    function _tarafRenk(t) { return t === 'iyi' ? '#d4af37' : '#9370f7'; }

    // v1.14.3.36 — Tikla → ozel mesaj formu o oyuncuyla doldurulur
    liste.innerHTML = oyuncular.map(function(p) {
      var guildEt = p.guild_tag ? '<span style="color:#888">[' + _esc(p.guild_tag) + ']</span> ' : '';
      var koord = p.koord ? '<span style="color:#666;font-size:10px"> ' + _esc(p.koord) + '</span>' : '';
      var safeIsim = (p.kullanici_adi||'').replace(/['"\\<>]/g,'');
      return '<div onclick="aktifOyuncuyaMesaj(\'' + safeIsim + '\')" ' +
             'style="padding:5px 6px;border-bottom:1px solid #1a1a1a;line-height:1.4;cursor:pointer;transition:background 0.15s" ' +
             'onmouseover="this.style.background=\'rgba(212,175,55,0.06)\'" ' +
             'onmouseout="this.style.background=\'\'" ' +
             'title="✉️ ' + _esc(p.kullanici_adi) + ' kullanicisina mesaj gonder">' +
        '<div>' +
          '<span style="font-size:10px">' + _ikon(p.durum) + '</span> ' +
          guildEt +
          '<span style="color:' + _tarafRenk(p.taraf) + ';font-weight:bold">' + _esc(p.kullanici_adi) + '</span>' +
          koord +
          '<span style="float:right;color:#666;font-size:11px">✉️</span>' +
        '</div>' +
        '<div style="font-size:10px;color:' + _renk(p.durum) + ';margin-left:14px">' + _zaman(p.saniye_once) + '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    liste.innerHTML = '<div style="color:#e74c3c;font-size:11px">Bağlantı hatası</div>';
  }
}

// Otomatik yenileme — 30 saniyede bir
(function _autoRefreshAktif() {
  if (typeof window === 'undefined') return;
  setInterval(function() {
    var meydanTabAcik = document.getElementById('meydan-tab')?.style.display !== 'none';
    if (meydanTabAcik && document.getElementById('aktif-liste')) loadAktifOyuncular();
  }, 30000);
})();

/* ═══════════════════════════════════════════════════════
   v1.14.3.36 — Aktif oyuncuya tikla -> ozel mesaj formu
   Tek tikla: tab gecisi + form acma + isim arama + secim
   ═══════════════════════════════════════════════════════ */
async function aktifOyuncuyaMesaj(kullaniciAdi) {
  if (!kullaniciAdi) return;
  // 1) Ozel Mesajlar tab'ina gec
  meydanTab('ozel');
  // 2) Mesaj gonder formunu ac (kapaliysa)
  var modalEl = document.getElementById('ozel-gonder-modal');
  if (!modalEl || modalEl.style.display === 'none') {
    ozelMesajGonderModal();
  }
  // 3) Hedef arama input'unu doldur + ara
  setTimeout(async function() {
    var inp = document.getElementById('ozel-hedef-isim');
    if (inp) {
      inp.value = kullaniciAdi;
      // Otomatik ara — backend'den oyuncu listesi getir
      try {
        var token = getToken(); if (!token) return;
        var resp = await fetch(API_BASE + '/api/player/ara?isim=' + encodeURIComponent(kullaniciAdi),
          { headers: { 'Authorization': 'Bearer ' + token } });
        var data = await resp.json();
        // Tam eslesen oyuncuyu otomatik sec
        var tam = data.find(p => p.kullanici_adi === kullaniciAdi) || data[0];
        if (tam) {
          var hidden = document.getElementById('ozel-hedef');
          var sonuc  = document.getElementById('ozel-hedef-sonuc');
          if (hidden) hidden.value = tam.id;
          if (sonuc)  sonuc.innerHTML = '<span style="color:#2ecc71">✓ Seçildi: <b>' + escapeHtml(tam.kullanici_adi) + '</b> (' + tam.koord_x + ':' + tam.koord_y + ')</span>';
        }
        // Mesaj alanina focus
        var msgArea = document.getElementById('ozel-mesaj');
        if (msgArea) msgArea.focus();
      } catch(e) { /* sessiz */ }
    }
  }, 150);
}
window.aktifOyuncuyaMesaj = aktifOyuncuyaMesaj;

function ozelSubTab(sub) {
  document.getElementById('ozel-mesajlar').style.display = sub === 'gelen' ? 'block' : 'none';
  document.getElementById('ozel-gonderilenler').style.display = sub === 'giden' ? 'block' : 'none';
  document.getElementById('ozel-sub-gelen').className = 'atab' + (sub === 'gelen' ? ' on' : '');
  document.getElementById('ozel-sub-giden').className = 'atab' + (sub === 'giden' ? ' on' : '');
  if (sub === 'gelen') loadOzelMesajlar();
  if (sub === 'giden') loadGonderilenler();
}

async function loadGonderilenler() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('ozel-gonderilenler');
  try {
    var resp = await fetch(API_BASE + '/api/meydan/ozel/gonderilenler', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { el.innerHTML = '<div style="color:#555;font-size:11px">Gonderilegn mesaj yok.</div>'; return; }
    el.innerHTML = data.map(function(m) {
      var tarih = new Date(m.created_at).toLocaleString('tr-TR');
      return '<div class="card" style="padding:8px 10px;margin-bottom:4px">' +
        '<div style="display:flex;justify-content:space-between;font-size:10px">' +
          '<span>📤 Kime: <b>' + (m.alan_adi||'?') + '</b>' + (m.baslik ? ' — ' + m.baslik : '') + '</span>' +
          '<span style="color:#555">' + tarih + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#ccc;margin-top:3px">' + escapeHtml(m.mesaj).substring(0, 200) + '</div>' +
      '</div>';
    }).join('');
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Hata</div>'; }
}

async function loadMeydanMesajlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('meydan-mesajlar');
  try {
    var resp = await fetch(API_BASE + '/api/meydan/mesajlar', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { el.innerHTML = '<div style="color:#555;text-align:center;padding:40px">Henuz mesaj yok. Ilk mesaji siz yazin!</div>'; return; }
    // v1.14.3.34 — XSS guvenlik: kullanici_adi + guild_tag escape edildi
    el.innerHTML = data.map(function(m) {
      var tarafRenk = m.taraf === 'iyi' ? '#d4af37' : '#9370f7';
      var guildTag = m.guild_tag ? '<span style="color:#888;font-size:11px">[' + escapeHtml(m.guild_tag) + ']</span> ' : '';
      var saat = new Date(m.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'});
      return '<div style="padding:4px 0;border-bottom:1px solid #1a1a1a">' +
        '<span style="color:#555;font-size:11px;margin-right:4px">' + saat + '</span>' +
        guildTag +
        '<span style="color:' + tarafRenk + ';font-weight:bold;font-size:11px">' + escapeHtml(m.kullanici_adi) + ':</span> ' +
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
    else { noxAlert('Meydan hatasi: ' + (data.error || 'Bilinmeyen hata')); }
  } catch(e) { noxAlert('Baglanti hatasi: ' + e.message); }
}

// Enter ile gonder + sayfa init
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var inp = document.getElementById('meydan-inp');
    if (inp) inp.addEventListener('keyup', function(e) { if (e.key === 'Enter') { e.preventDefault(); meydanYaz(); } });
  }, 500);
});

async function loadOzelMesajlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('ozel-mesajlar');
  try {
    var resp = await fetch(API_BASE + '/api/meydan/ozel', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    var mesajlar = data.mesajlar || [];
    var okunmamis = data.okunmamis || 0;

    // Badge guncelle
    var badge = document.getElementById('ozel-badge');
    if (badge) { if (okunmamis > 0) { badge.style.display='inline'; badge.textContent=okunmamis; } else badge.style.display='none'; }

    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:11px;color:#888">Gelen Mesajlar' + (okunmamis > 0 ? ' <span style="color:#e74c3c;font-weight:bold">(' + okunmamis + ' yeni)</span>' : '') + '</span>' +
        '<button class="btn-action" style="width:auto;padding:4px 10px;font-size:11px" onclick="ozelMesajGonderModal()">Yeni Mesaj</button>' +
      '</div>' +
      '<div id="ozel-gonder-modal" style="display:none;margin-bottom:8px"></div>' +
      (mesajlar.length === 0 ? '<div style="color:#555;font-size:11px">Mesaj yok.</div>' :
        mesajlar.map(function(m) {
          var okunduIcon = m.okundu ? '📧' : '📩';
          var tarih = new Date(m.created_at).toLocaleString('tr-TR');
          // v1.14.3.34 — XSS guvenlik: gonderen_adi + baslik escape edildi
          return '<div class="card" style="padding:8px 10px;margin-bottom:4px;' + (!m.okundu ? 'border-left-color:#e74c3c' : '') + '">' +
            '<div style="display:flex;justify-content:space-between;font-size:10px">' +
              '<span>' + okunduIcon + ' <b>' + escapeHtml(m.gonderen_adi) + '</b>' + (m.baslik ? ' — ' + escapeHtml(m.baslik) : '') + '</span>' +
              '<span style="color:#555">' + tarih + '</span>' +
            '</div>' +
            '<div style="font-size:10px;color:#ccc;margin-top:3px">' + escapeHtml(m.mesaj).substring(0, 200) + '</div>' +
            (!m.okundu ? '<button style="background:none;border:none;color:#2ecc71;cursor:pointer;font-size:11px;margin-top:3px" onclick="ozelOku(' + m.id + ')">Okundu isaretle</button>' : '') +
          '</div>';
        }).join(''));
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Hata</div>'; }
}

function ozelMesajGonderModal() {
  var m = document.getElementById('ozel-gonder-modal');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
  m.innerHTML = '<div class="card" style="padding:10px">' +
    '<div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">Ozel Mesaj Gonder</div>' +
    '<div style="margin-bottom:4px"><label style="font-size:11px;color:#888">Kime (isim yazin)</label>' +
      '<div style="display:flex;gap:4px">' +
        '<input id="ozel-hedef-isim" type="text" placeholder="Kral ismi..." style="flex:1;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px">' +
        '<button onclick="ozelHedefAra()" style="padding:4px 8px;background:#333;border:1px solid #555;color:#ddd;border-radius:4px;cursor:pointer;font-size:11px">Ara</button>' +
      '</div>' +
      '<div id="ozel-hedef-sonuc" style="font-size:10px;margin-top:4px;min-height:14px"></div>' +
      '<input id="ozel-hedef" type="hidden">' +
    '</div>' +
    '<div style="margin-bottom:4px"><label style="font-size:11px;color:#888">Baslik</label><input id="ozel-baslik" maxlength="100" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px"></div>' +
    '<div style="margin-bottom:6px"><textarea id="ozel-mesaj" rows="3" maxlength="2000" style="width:100%;padding:4px;background:#111;border:1px solid #333;color:#ddd;border-radius:4px;font-size:10px" placeholder="Mesajiniz..."></textarea></div>' +
    '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:11px" onclick="ozelGonder()">Gonder</button>' +
    '<span id="ozel-gonder-msg" style="font-size:10px;margin-left:6px"></span>' +
  '</div>';
}

async function ozelHedefAra() {
  var isim = document.getElementById('ozel-hedef-isim')?.value?.trim();
  var sonuc = document.getElementById('ozel-hedef-sonuc');
  if (!isim) { sonuc.innerHTML = '<span style="color:#e74c3c">Isim girin</span>'; return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/player/ara?isim=' + encodeURIComponent(isim), { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { sonuc.innerHTML = '<span style="color:#e74c3c">Oyuncu bulunamadi</span>'; return; }
    sonuc.innerHTML = data.map(function(p) {
      return '<div style="cursor:pointer;padding:2px 4px;border-radius:3px;margin:1px 0" onmouseover="this.style.background=\'#222\'" onmouseout="this.style.background=\'none\'" onclick="document.getElementById(\'ozel-hedef\').value=\'' + p.id + '\';document.getElementById(\'ozel-hedef-sonuc\').innerHTML=\'<span style=color:#2ecc71>Secildi: ' + p.kullanici_adi + '</span>\'">' +
        '<span style="color:var(--race-color)">' + p.kullanici_adi + '</span> <span style="color:#555;font-size:11px">(' + p.koord_x + ':' + p.koord_y + ')</span>' +
      '</div>';
    }).join('');
  } catch(e) { sonuc.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

async function ozelGonder() {
  var hedef = parseInt(document.getElementById('ozel-hedef')?.value);
  var baslik = document.getElementById('ozel-baslik')?.value || '';
  var mesaj = document.getElementById('ozel-mesaj')?.value?.trim();
  var msgEl = document.getElementById('ozel-gonder-msg');
  if (!hedef) { if(msgEl) msgEl.innerHTML='<span style="color:#e74c3c">Once oyuncu secin (isim yazip arayin)</span>'; return; }
  if (!mesaj) { if(msgEl) msgEl.innerHTML='<span style="color:#e74c3c">Mesaj yazin</span>'; return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/meydan/ozel/gonder', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ hedefPlayerId: hedef, baslik: baslik, mesaj: mesaj })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadOzelMesajlar(); } else noxAlert(data.error);
  } catch(e) { noxAlert('Hata'); }
}

async function ozelOku(mesajId) {
  var token = getToken(); if (!token) return;
  await fetch(API_BASE + '/api/meydan/ozel/' + mesajId + '/oku', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
  loadOzelMesajlar();
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) {
      clearInterval(check);
      // v1.14.3.36 — URL ?tab=ozel veya ?tab=ozel&yeni=ISIM ile gelirse direkt ozel mesaj
      var params = new URLSearchParams(location.search);
      if (params.get('tab') === 'ozel') {
        meydanTab('ozel');
        var yeniIsim = params.get('yeni');
        if (yeniIsim) {
          aktifOyuncuyaMesaj(decodeURIComponent(yeniIsim));
        }
      } else {
        loadMeydanMesajlar();
        loadAktifOyuncular();
      }
    }
  }, 500);
  // Otomatik yenileme: 30 saniyede bir yeni mesajlari getir
  setInterval(function() {
    var meydanEl = document.getElementById('meydan-tab');
    if (meydanEl && meydanEl.style.display !== 'none') loadMeydanMesajlar();
  }, 30000);
});
