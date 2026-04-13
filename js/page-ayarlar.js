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
    '</div>';
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
