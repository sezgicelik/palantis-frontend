/* page-ayarlar.js — Oyuncu ayarlari + Telegram bildirim v1.4 */

var AYAR_DATA = null;

async function loadAyarlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('ayar-content');
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!resp.ok) { el.innerHTML = '<div style="color:#e74c3c">' + (data.error||'Hata') + '</div>'; return; }
    AYAR_DATA = data;
    renderAyarlar(el, data);
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>'; }
}

function renderAyarlar(el, data) {
  var tg = data.telegram || {};
  var bil = data.bildirimler || {};

  var bildirimler = [
    { key:'saldiri', label:'Sehrine saldiri geldiginde', icon:'⚔️' },
    { key:'koloni_bitis', label:'Koloni suresi dolduğunda', icon:'🏰' },
    { key:'gorev_tamam', label:'Gorev tamamlandiginda', icon:'📜' },
    { key:'casus_rapor', label:'Casus raporu geldiginde', icon:'🕵️' },
    { key:'casus_operasyon', label:'Sehrine casus operasyonu duzenlendiginde', icon:'🕵️‍♂️' },
    { key:'buyu_saldiri', label:'Sehrine ofansif buyu atildiginda', icon:'🔮' },
    { key:'ozel_mesaj', label:'Ozel mesaj aldiginda', icon:'✉️' },
    { key:'maas_eksik', label:'Ordu maasi odenemediginde', icon:'💸' },
    { key:'guild_duyuru', label:'Guild duyurusu yapildiginda', icon:'🏰' },
  ];

  el.innerHTML =
    // Telegram Baglanti
    '<div class="card">' +
      '<div style="font-size:12px;font-weight:bold;color:var(--race-color);margin-bottom:8px;font-family:Cinzel,serif">📱 Telegram Bildirimler</div>' +
      (tg.bagli ?
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<span style="font-size:20px">✅</span>' +
          '<div>' +
            '<div style="font-size:11px;color:#2ecc71;font-weight:bold">Telegram Bagli</div>' +
            '<div style="font-size:10px;color:#888">@' + (tg.kullanici_adi || '?') + '</div>' +
          '</div>' +
          '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:9px;background:#27ae60;color:#fff;margin-left:8px" onclick="telegramTest()">Test Gonder</button>' +
          '<button class="btn-action" style="width:auto;padding:4px 12px;font-size:9px;background:#333;color:#e74c3c;margin-left:4px" onclick="telegramKopar()">Baglantiyi Kes</button>' +
        '</div>'
      :
        '<div style="margin-bottom:8px">' +
          (tg.baglanti_kodu ?
            '<div style="background:#0a0a0a;border:1px solid #333;border-radius:6px;padding:10px;text-align:center">' +
              '<div style="font-size:10px;color:#888;margin-bottom:4px">Telegram bota su komutu yazin:</div>' +
              '<div style="font-size:14px;font-family:monospace;color:var(--race-color);font-weight:bold;padding:6px;background:#111;border-radius:4px;display:inline-block">/baglanti ' + tg.baglanti_kodu + '</div>' +
              '<div style="font-size:9px;color:#555;margin-top:6px">Bot: <a href="https://t.me/palantis_game_bot" target="_blank" style="color:var(--race-color)">@palantis_game_bot</a></div>' +
            '</div>'
          :
            '<div style="text-align:center">' +
              '<div style="font-size:10px;color:#888;margin-bottom:6px">Telegram ile oyun bildirimlerini alin</div>' +
              '<button class="btn-action" style="width:auto;padding:6px 16px;font-size:10px" onclick="telegramBagla()">📱 Telegram Bagla</button>' +
            '</div>'
          ) +
        '</div>'
      ) +
    '</div>' +

    // Bildirim Tercihleri
    '<div class="card">' +
      '<div style="font-size:12px;font-weight:bold;color:var(--race-color);margin-bottom:8px;font-family:Cinzel,serif">🔔 Bildirim Tercihleri</div>' +
      '<div style="font-size:9px;color:#666;margin-bottom:8px">Hangi olaylarda Telegram bildirimi almak istiyorsunuz?</div>' +
      bildirimler.map(function(b) {
        var acik = bil[b.key] !== false;
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a1a">' +
          '<span style="font-size:11px">' + b.icon + ' ' + b.label + '</span>' +
          '<label style="position:relative;display:inline-block;width:36px;height:20px;cursor:pointer">' +
            '<input type="checkbox" id="bil-' + b.key + '" ' + (acik ? 'checked' : '') + ' onchange="bildirimKaydet()" style="opacity:0;width:0;height:0">' +
            '<span style="position:absolute;inset:0;background:' + (acik ? '#2ecc71' : '#333') + ';border-radius:10px;transition:.3s"></span>' +
            '<span style="position:absolute;left:' + (acik ? '18px' : '2px') + ';top:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.3s"></span>' +
          '</label>' +
        '</div>';
      }).join('') +
    '</div>' +

    // Tatil Modu
    '<div class="card" style="margin-top:12px">' +
      '<div style="font-size:12px;font-weight:bold;color:var(--race-color);margin-bottom:8px;font-family:Cinzel,serif">🏖️ Tatil Modu</div>' +
      '<div id="tatil-content" style="font-size:11px;color:#888">Yukleniyor...</div>' +
    '</div>' +

    // Bakıcılık
    '<div class="card" style="margin-top:12px">' +
      '<div style="font-size:12px;font-weight:bold;color:var(--race-color);margin-bottom:8px;font-family:Cinzel,serif">🔑 Bakıcılık</div>' +
      '<div id="bakicilik-content" style="font-size:11px;color:#888">Yukleniyor...</div>' +
    '</div>';

  // Tatil ve bakıcılık durumunu yükle
  setTimeout(loadTatilDurum, 300);
  setTimeout(loadBakicilikDurum, 400);
}

// ═══ TATİL MODU ═══
async function loadTatilDurum() {
  var el = document.getElementById('tatil-content'); if (!el) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/game/tatil', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (data.tatil_modu) {
      el.innerHTML = '<div style="background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.3);border-radius:6px;padding:10px;margin-bottom:8px">' +
        '<div style="color:#2ecc71;font-weight:bold;font-size:13px">🏖️ TATİL MODUNDASINIZ</div>' +
        '<div style="color:#888;margin-top:4px">Kalan: <strong style="color:#f0e8d8">' + Math.round(data.kalan_pg) + ' PG</strong></div>' +
        '<div style="color:#888;margin-top:2px">Bitis: ' + (data.tatil_bitis ? new Date(data.tatil_bitis).toLocaleString('tr-TR') : '-') + '</div>' +
        '<button class="btn-action" style="margin-top:8px;width:auto;padding:5px 14px;font-size:10px;background:#c0392b" onclick="tatilIptal()">Tatili Iptal Et</button>' +
        '<div style="font-size:9px;color:#666;margin-top:4px">(Iptal sonrasi ' + (data.config?.tatil_cooldown||48) + ' PG cooldown baslar)</div>' +
      '</div>';
    } else {
      var cooldownMsg = data.cooldown_kalan > 0 ?
        '<div style="color:#e74c3c;margin-bottom:6px">Cooldown: ' + Math.round(data.cooldown_kalan) + ' PG beklemeniz gerekiyor</div>' : '';
      el.innerHTML = cooldownMsg +
        '<div style="color:#888;margin-bottom:6px">Tatil modunda sehriniz korunur: saldiri/buyu/casus engellenir, uretim durur.</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
          '<label style="font-size:10px;color:#888">Sure (PG):</label>' +
          '<input id="tatil-sure" type="number" value="' + (data.config?.tatil_min_sure||24) + '" min="' + (data.config?.tatil_min_sure||24) + '" max="' + (data.config?.tatil_max_sure||336) + '" style="width:60px;padding:3px;background:#111;border:1px solid #333;color:#ddd;border-radius:3px;font-size:11px">' +
          '<span style="font-size:9px;color:#555">(' + (data.config?.tatil_min_sure||24) + '-' + (data.config?.tatil_max_sure||336) + ')</span>' +
        '</div>' +
        '<button class="btn-action" style="width:auto;padding:5px 14px;font-size:10px" onclick="tatilBaslat()" ' + (data.cooldown_kalan > 0 ? 'disabled style="opacity:0.4;width:auto;padding:5px 14px;font-size:10px"' : '') + '>🏖️ Tatil Modunu Baslat</button>';
    }
  } catch(e) { el.innerHTML = '<span style="color:#e74c3c">Yukleme hatasi</span>'; }
}

async function tatilBaslat() {
  var sure = parseInt(document.getElementById('tatil-sure')?.value);
  if (!sure) { alert('Sure girin'); return; }
  if (!confirm('Tatil modunu ' + sure + ' PG icin aktiflestireceksiniz. Emin misiniz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/game/tatil', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ sure: sure })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj || 'Tatil modu aktif!'); loadTatilDurum(); }
    else alert(data.error || 'Hata');
  } catch(e) { alert('Sunucu hatasi'); }
}

async function tatilIptal() {
  if (!confirm('Tatili iptal etmek istediginize emin misiniz? Cooldown baslar.')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/game/tatil', {
      method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj || 'Tatil iptal edildi'); loadTatilDurum(); }
    else alert(data.error || 'Hata');
  } catch(e) { alert('Sunucu hatasi'); }
}

// ═══ BAKICILIK ═══
async function loadBakicilikDurum() {
  var el = document.getElementById('bakicilik-content'); if (!el) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar/bakicilik', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) {
      el.innerHTML = '<div style="color:#888">Bakicilik sistemi hazirlaniyor...</div>';
      return;
    }
    var data = await resp.json();
    if (data.aktif_token) {
      var izinGoster = '';
      if (data.aktif_token.izinler) {
        var iz = data.aktif_token.izinler;
        izinGoster = '<div style="font-size:8px;color:#888;margin-top:4px;display:flex;flex-wrap:wrap;gap:3px">' +
          Object.entries(iz).map(function(e) {
            return '<span style="padding:1px 4px;border-radius:2px;background:' + (e[1] ? 'rgba(46,204,113,0.15);color:#2ecc71;border:1px solid rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.1);color:#e74c3c;border:1px solid rgba(231,76,60,0.2)') + '">' + (e[1]?'✅':'❌') + ' ' + e[0] + '</span>';
          }).join('') + '</div>';
      }
      el.innerHTML = '<div style="background:rgba(212,162,87,0.1);border:1px solid rgba(212,162,87,0.3);border-radius:6px;padding:10px">' +
        '<div style="color:#c9a84c;font-weight:bold">🔑 Aktif Bakici Tokeni</div>' +
        '<div style="font-family:monospace;font-size:14px;color:#f0e8d8;margin:6px 0;padding:6px;background:#111;border-radius:4px;text-align:center;letter-spacing:2px">' + data.aktif_token.token + '</div>' +
        '<div style="font-size:9px;color:#888">Bitis: ' + new Date(data.aktif_token.bitis).toLocaleString('tr-TR') + '</div>' +
        izinGoster +
        '<button class="btn-action" style="margin-top:6px;width:auto;padding:4px 10px;font-size:9px;background:#c0392b" onclick="bakicilikIptal()">Tokeni Iptal Et</button>' +
      '</div>';
    } else {
      var izinListesi = [
        { key:'bina_insaat', label:'Bina insaati baslatma', varsayilan:true },
        { key:'isci_atama', label:'Isci atama/degistirme', varsayilan:true },
        { key:'unite_egitim', label:'Unite egitimi', varsayilan:true },
        { key:'festival', label:'Festival duzenleme', varsayilan:true },
        { key:'savunma_buyu', label:'Kendine buyu yapma', varsayilan:true },
        { key:'saldiri', label:'Ordu saldiri gonderme', varsayilan:false },
        { key:'koloni_fetih', label:'Koloni fethi', varsayilan:false },
        { key:'ofansif_buyu', label:'Ofansif buyu yapma', varsayilan:false },
        { key:'ozel_mesaj', label:'Ozel mesaj okuma', varsayilan:false },
        { key:'guild_kasa', label:'Guild kasa erisimi', varsayilan:false },
        { key:'pazar_ticaret', label:'Pazar ticareti', varsayilan:false },
        { key:'daragaci', label:'Daragaci kullanma', varsayilan:false },
        { key:'vergi_degistir', label:'Vergi orani degistirme', varsayilan:false },
        { key:'ayarlar', label:'Ayarlari degistirme', varsayilan:false },
      ];
      el.innerHTML =
        '<div style="color:#888;margin-bottom:8px">Hesabinizi baska birine emanet edin. Bakici oyuncuyu secin, yetkileri belirleyin.</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
          '<label style="font-size:10px;color:#888">Bakici Oyuncu:</label>' +
          '<input id="bakici-isim" type="text" placeholder="Kral adi ara..." style="width:140px;padding:3px 6px;background:#111;border:1px solid #333;color:#ddd;border-radius:3px;font-size:10px">' +
          '<button onclick="bakiciAra()" style="padding:3px 8px;background:#333;border:1px solid #555;color:#ddd;border-radius:3px;cursor:pointer;font-size:9px">Ara</button>' +
        '</div>' +
        '<div id="bakici-sonuc" style="font-size:9px;margin-bottom:6px;min-height:14px"></div>' +
        '<input id="bakici-hedef-id" type="hidden">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
          '<label style="font-size:10px;color:#888">Sure (gun):</label>' +
          '<input id="bakici-gun" type="number" value="3" min="1" max="6" style="width:40px;padding:3px;background:#111;border:1px solid #333;color:#ddd;border-radius:3px">' +
        '</div>' +
        '<div style="font-size:10px;color:#c9a84c;margin-bottom:4px;font-family:Cinzel,serif">Bakici Yetkileri:</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:8px">' +
          izinListesi.map(function(iz) {
            var renk = iz.varsayilan ? '#2ecc71' : '#e74c3c';
            return '<label style="font-size:9px;color:#888;display:flex;align-items:center;gap:4px;padding:2px 0;cursor:pointer">' +
              '<input type="checkbox" id="bak-iz-' + iz.key + '" ' + (iz.varsayilan ? 'checked' : '') + ' style="accent-color:' + renk + '">' +
              '<span>' + iz.label + '</span></label>';
          }).join('') +
        '</div>' +
        '<button class="btn-action" style="width:auto;padding:5px 14px;font-size:10px" onclick="bakiciTokenOlustur()">🔑 Bakici Tokeni Olustur</button>';
    }
  } catch(e) { el.innerHTML = '<span style="color:#888">Bakicilik sistemi hazirlaniyor...</span>'; }
}

async function bakiciAra() {
  var isim = document.getElementById('bakici-isim')?.value?.trim();
  var sonuc = document.getElementById('bakici-sonuc');
  if (!isim || isim.length < 2) { sonuc.innerHTML = '<span style="color:#e74c3c">En az 2 karakter girin</span>'; return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/player/ara?isim=' + encodeURIComponent(isim), { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { sonuc.innerHTML = '<span style="color:#e74c3c">Oyuncu bulunamadi</span>'; return; }
    sonuc.innerHTML = data.map(function(p) {
      return '<span style="cursor:pointer;padding:2px 6px;border:1px solid #333;border-radius:3px;margin:1px;display:inline-block" onclick="document.getElementById(\'bakici-hedef-id\').value=\'' + p.id + '\';document.getElementById(\'bakici-sonuc\').innerHTML=\'<span style=color:#2ecc71>Secildi: ' + p.kullanici_adi + '</span>\'">' + p.kullanici_adi + ' <span style="color:#555;font-size:8px">(C' + (p.cag||1) + ')</span></span>';
    }).join(' ');
  } catch(e) { sonuc.innerHTML = '<span style="color:#e74c3c">Arama hatasi</span>'; }
}

async function bakiciTokenOlustur() {
  var bakiciId = parseInt(document.getElementById('bakici-hedef-id')?.value);
  if (!bakiciId) { alert('Once bakici olacak oyuncuyu secin!'); return; }
  var gun = parseInt(document.getElementById('bakici-gun')?.value) || 3;
  // İzinleri topla
  var izinler = {};
  document.querySelectorAll('[id^="bak-iz-"]').forEach(function(cb) {
    izinler[cb.id.replace('bak-iz-', '')] = cb.checked;
  });
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar/bakicilik/token-olustur', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ gun: gun, izinler: izinler, bakici_id: bakiciId })
    });
    var data = await resp.json();
    if (resp.ok) { toast('Token olusturuldu!'); loadBakicilikDurum(); }
    else alert(data.error || 'Hata');
  } catch(e) { alert('Sunucu hatasi'); }
}

async function bakicilikIptal() {
  if (!confirm('Bakici tokenini iptal etmek istediginize emin misiniz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar/bakicilik/iptal', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.ok) { toast('Token iptal edildi'); loadBakicilikDurum(); }
  } catch(e) { alert('Hata'); }
}

async function telegramBagla() {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar/telegram/bagla', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (resp.ok) { toast('Baglanti kodu olusturuldu!'); loadAyarlar(); }
    else alert(data.error);
  } catch(e) { alert('Hata'); }
}

async function telegramTest() {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar/telegram/test', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (resp.ok) toast('Test bildirimi gonderildi! Telegram\'i kontrol edin.');
    else alert(data.error || 'Hata');
  } catch(e) { alert('Hata'); }
}

async function telegramKopar() {
  if (!confirm('Telegram baglantisini kesmek istediginize emin misiniz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/ayarlar/telegram/kopar', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.ok) { toast('Baglanti kesildi'); loadAyarlar(); }
  } catch(e) { alert('Hata'); }
}

async function bildirimKaydet() {
  var token = getToken(); if (!token) return;
  var keys = ['saldiri','koloni_bitis','gorev_tamam','casus_rapor','ozel_mesaj','maas_eksik','guild_duyuru'];
  var body = {};
  keys.forEach(function(k) {
    var cb = document.getElementById('bil-' + k);
    if (cb) body[k] = cb.checked;
  });
  try {
    await fetch(API_BASE + '/api/ayarlar/bildirim', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    toast('Bildirim ayarlari kaydedildi');
    // Toggle gorunumunu guncelle
    loadAyarlar();
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() { attempts++; if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadAyarlar(); } }, 500);
});
