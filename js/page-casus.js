/* page-casus.js — Casus sistemi frontend v1.7.4 (11 operasyon) */

var GOREV_TIPLERI = {};

const GOREV_ISIMLERI = {
  bolge_incele:'Bolge Incele', koloni_incele:'Koloni Incele', ordu_incele:'Ordu Incele',
  yemek_hirsizligi:'Yemek Hirsizligi', ordu_saldiri_incele:'Saldiri İstihbarat',
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
// v1.14.3.30 — Operasyon detay aciklamasi (FIX 8: tooltip "Kargasa ne ise yarar?")
const GOREV_ACIKLAMA = {
  bolge_incele:        'Hedefin bulundugu bolge ID\'sini ve koordinatini ogrenir.',
  koloni_incele:       'Hedefin tum kolonileri + kaynak tipi + bonus oranlarini listeler.',
  ordu_incele:         'Hedefin tum ordulari, ATK/DEF gucleri ve unite sayilarini gosterir.',
  ordu_saldiri_incele: 'Hedefin yolda olan ordularini (saldiri/donus) tespit eder.',
  yemek_hirsizligi:    'Hedefin bugday/balik/pismis ekmek stogundan calar (max %15 stok).',
  kaynak_hirsizligi:   'Hedefin altin/odun/metal/kereste/islenmis stogundan calar (max %10).',
  kargasa:             'Hedefin SEHIR moralini -100 dusurur (yuksek riskli, koylu kacisi tetikleyebilir).',
  bilim_hirsizligi:    'Hedeften bilim/teknoloji bilgisi sızdırır (gelisim_puani transfer).',
  stratejik_bilgiler:  'Hedefin ORDU moralini ve cesaret puanini ogrenir.',
  katliam:             'Hedefin koylu nufusunu oldurur (50-200 koylu, agir gizlilik maliyeti).',
  sabotaj:             'Hedefin 1-3 binasina 20-40 dayaniklilik hasari verir.'
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

    // v1.14.3.33 — Casus sayfasi yeniden tasarim
    // Layout: 1) Casus listesi (tikla = sec) + 2) Hedef arama + 3) Operasyon kartlari (HER ZAMAN GORUNUR aciklamali)
    var hazirCasuslar = casuslar.filter(c=>c.durum==='hazir');
    var ilkHazir = hazirCasuslar[0]?.id || null;

    var casusListHtml = casuslar.length === 0
      ? '<div style="color:#a89880;font-size:12px;padding:10px">Henüz casusunuz yok. Lonca binası yaparak gizlilik puanı kazanın.</div>'
      : casuslar.map(function(c) {
          var durumRenk = c.durum === 'hazir' ? '#2ecc71' : c.durum === 'gorevde' ? '#f1c40f' : '#e74c3c';
          var kalanStr = '';
          if (c.bitis && c.durum === 'gorevde') {
            var kalan = new Date(c.bitis).getTime() - Date.now();
            if (kalan > 0) kalanStr = ' (' + Math.ceil(kalan/3600000) + ' PG)';
            else kalanStr = ' (Dönüş)';
          }
          var canStr = c.can !== undefined ? ' ❤️' + (c.can||0) + ' XP:' + (c.deneyim||0) : '';
          var gorevStr = '';
          if (c.durum === 'gorevde' && c.gorev_tipi) {
            var gIkon = GOREV_IKONLARI[c.gorev_tipi] || '🕵️';
            var gIsim = GOREV_ISIMLERI[c.gorev_tipi] || c.gorev_tipi;
            var hedefAdi = c.hedef_kral ? _escCasus(c.hedef_kral) : '?';
            gorevStr = ' • ' + gIkon + ' ' + gIsim + ' → ' + hedefAdi;
          }
          var secilebilir = c.durum === 'hazir';
          return '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(20,18,14,0.5);border:1px solid #2a2820;border-radius:5px;margin-bottom:4px;' +
            (secilebilir ? 'cursor:pointer' : 'opacity:0.5;cursor:not-allowed') + '">' +
            (secilebilir
              ? '<input type="radio" name="casus-radio" value="' + c.id + '"' + (c.id === ilkHazir ? ' checked' : '') + ' style="cursor:pointer">'
              : '<span style="width:14px;display:inline-block"></span>') +
            '<span style="font-size:14px">🕵️</span>' +
            '<span style="font-size:13px;color:#e8d4a8;font-weight:bold">Casus #' + c.id + '</span>' +
            '<span style="font-size:11px;color:#a89880">Sv.' + (c.seviye||1) + canStr + '</span>' +
            '<span style="font-size:11px;color:' + durumRenk + ';margin-left:auto;font-weight:bold">' + c.durum + kalanStr + gorevStr + '</span>' +
          '</label>';
        }).join('');

    // Operasyon kartlari — aciklamalar HER ZAMAN GORUNUR
    var operasyonKartlari = Object.entries(GOREV_TIPLERI).map(function(entry) {
      var tip = entry[0], g = entry[1];
      var isim = GOREV_ISIMLERI[tip] || tip;
      var ikon = GOREV_IKONLARI[tip] || '🕵️';
      var renk = GOREV_RENK[tip] || '#888';
      var aciklama = GOREV_ACIKLAMA[tip] || '';
      return '<div style="background:rgba(20,18,14,0.7);border:1px solid ' + renk + '33;border-left:3px solid ' + renk + ';border-radius:5px;padding:10px 12px;display:flex;flex-direction:column;gap:6px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
          '<div style="font-family:Cinzel,serif;font-weight:bold;font-size:13px;color:' + renk + '">' + ikon + ' ' + isim + '</div>' +
          (hazirCasuslar.length > 0
            ? '<button style="padding:5px 14px;font-size:11px;background:' + renk + ';color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold" onclick="casusGonderSecili(\'' + tip + '\')">Gönder →</button>'
            : '<span style="font-size:11px;color:#888">Hazır casus yok</span>') +
        '</div>' +
        '<div style="font-size:12px;color:#d4cfc0;line-height:1.4">' + aciklama + '</div>' +
        '<div style="font-size:11px;color:#a89880;display:flex;gap:14px;flex-wrap:wrap">' +
          '<span>⏱️ Süre: <b style="color:#e8d4a8">' + g.sure + ' PG</b></span>' +
          '<span>🕵️ Gizlilik: <b style="color:#e8d4a8">' + g.gizlilik + '</b></span>' +
          '<span>✅ Başarı: <b style="color:#e8d4a8">%' + g.baz_basari + '</b></span>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
          '<span style="font-size:12px;color:#c8b896;font-weight:bold">CASUSLAR: <span style="color:#e8d4a8">' + casuslar.filter(c=>c.durum!=='oldu').length + ' / ' + maxSlot + '</span> • GİZLİLİK: <span style="color:#5dade2">' + gizlilik.toFixed(1) + '</span></span>' +
          (casuslar.filter(c=>c.durum!=='oldu').length < maxSlot ? '<button class="btn-action" style="width:auto;padding:6px 14px;font-size:11px" onclick="casusEgit()">🕵️ Yeni Casus Eğit</button>' : '') +
        '</div>' +

        // 1. Casus secimi (radio list)
        '<div style="font-size:12px;color:#c8b896;font-weight:bold;margin-bottom:6px">1️⃣ CASUS SEÇ</div>' +
        '<div style="margin-bottom:12px">' + casusListHtml + '</div>' +

        // 2. Hedef secimi
        (hazirCasuslar.length > 0 ?
          '<div style="font-size:12px;color:#c8b896;font-weight:bold;margin-bottom:6px">2️⃣ HEDEF OYUNCU</div>' +
          '<div style="margin-bottom:14px;padding:10px;background:rgba(0,0,0,0.3);border-radius:5px">' +
            '<input id="casus-hedef-isim" type="text" placeholder="Kral ismi yazın..." style="width:200px;padding:6px 8px;background:#0a0a0a;border:1px solid #3a3020;color:#e8d4a8;border-radius:4px;font-size:12px">' +
            '<button onclick="casusHedefAra()" style="padding:6px 14px;background:#3a3020;border:1px solid #c8a96e;color:#e8d4a8;border-radius:4px;cursor:pointer;font-size:11px;margin-left:6px;font-weight:bold">🔍 Ara</button>' +
            '<div id="casus-hedef-sonuc" style="font-size:11px;margin-top:6px;min-height:18px;color:#d4cfc0"></div>' +
            '<input id="casus-hedef" type="hidden">' +
          '</div>' +

          // 3. Operasyon secimi
          '<div style="font-size:12px;color:#c8b896;font-weight:bold;margin-bottom:6px">3️⃣ OPERASYON SEÇ → GÖNDER</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px">' + operasyonKartlari + '</div>'
        : '') +
      '</div>' +
      '<div id="casus-raporlar" style="margin-top:14px"></div>';

    loadCasusRaporlar();
  } catch(e) { el.innerHTML = '<div style="color:#e74c3c">Baglanti hatasi</div>'; }
}

// v1.14.3.33 — Yeni: secili casus ile gonder (radio'dan oku)
async function casusGonderSecili(gorevTipi) {
  var radio = document.querySelector('input[name="casus-radio"]:checked');
  if (!radio) { noxAlert('Önce bir casus seçin (1️⃣ adım)'); return; }
  var hedef = parseInt(document.getElementById('casus-hedef')?.value);
  if (!hedef) { noxAlert('Önce hedef oyuncu seçin (2️⃣ adım — isim arayıp tıklayın)'); return; }
  var casusId = parseInt(radio.value);
  return casusGonder(casusId, gorevTipi);
}

async function casusEgit() {
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/casus/egit', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadCasus(); } else noxAlert(data.error);
  } catch(e) { noxAlert('Hata'); }
}

// v1.14.3.33 — Casus gonderme paneli yeniden tasarim: eski modal akisi kaldirildi,
// yerine loadCasus() icindeki inline kart geldi (her operasyon bir KART).

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
        '<span style="color:var(--race-color)">' + p.kullanici_adi + '</span> <span style="color:#555;font-size:11px">(' + p.koord_x + ':' + p.koord_y + ') Cag ' + (p.cag||1) + '</span>' +
      '</div>';
    }).join('');
  } catch(e) { sonuc.innerHTML = '<span style="color:#e74c3c">Hata</span>'; }
}

async function casusGonder(casusId, gorevTipi) {
  var hedef = parseInt(document.getElementById('casus-hedef')?.value);
  if (!hedef) { noxAlert('Once hedef oyuncu secin (isim ile arayip tiklayin)'); return; }
  var token = getToken(); if (!token) return;
  try {
    var resp = await fetch(API_BASE + '/api/casus/gonder', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ casusId: casusId, gorevTipi: gorevTipi, hedefPlayerId: hedef })
    });
    var data = await resp.json();
    if (resp.ok) { toast(data.mesaj); loadCasus(); } else noxAlert(data.error);
  } catch(e) { noxAlert('Hata'); }
}

// v1.14.3.96: TEK doğruluk — merkez LABELS dict'inden (kucuk harf eski tutarsizdi)
var KAYNAK_ISIM = (typeof LABELS !== 'undefined' && LABELS.kaynak) || {};
function _fmtNum(n){ n=parseInt(n)||0; return n.toLocaleString('tr-TR'); }
// v1.14.3.34 — XSS: apostrof + slash + backtick eklendi (attribute injection korumasi)
function _escCasus(s){ s=String(s==null?'':s); return s.replace(/[&<>"'`\/]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;','/':'&#x2F;'}[c]; }); }
function casusDetayMetin(r) {
  var s = r.sonuc || {};
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch(e){ s = {}; } }
  var d = s.detay || {};
  if (!r.basarili) return 'Casus görevi başaramadı.';
  switch (r.gorev_tipi) {
    case 'kaynak_hirsizligi':
    case 'yemek_hirsizligi': {
      var c = d.calinan || {};
      var parca = Object.keys(c).filter(function(k){ return (parseInt(c[k])||0) > 0; })
        .map(function(k){ return _fmtNum(c[k]) + ' ' + (KAYNAK_ISIM[k]||k); });
      if (!parca.length) return 'Çalacak bir şey bulunamadı.';
      return '💰 Çalınan: ' + parca.join(', ');
    }
    case 'sabotaj':
      return '💣 ' + (d.hasarli||0) + ' binaya sabotaj yapıldı (20-40 dayanıklılık hasarı).';
    case 'kargasa':
      return '🔥 Şehirde kargaşa çıkarıldı! Hedef moral -100.';
    case 'katliam':
      return '💀 ' + _fmtNum(d.oldurulen||0) + ' köylü öldürüldü.';
    case 'ordu_incele': {
      var ord = d.ordular || [];
      if (!ord.length) return 'Hedefin ordusu bulunamadı.';
      return '⚔️ ' + ord.length + ' ordu tespit edildi:<br>' + ord.map(function(a){
        return '&nbsp;&nbsp;• <b>' + _escCasus(a.isim||'Ordu') + '</b>: ' + _fmtNum(a.toplam_unite) + ' ünite, ATK ' + _fmtNum(a.toplam_atk) + ' / DEF ' + _fmtNum(a.toplam_def) + ' (' + _escCasus(a.durum||'?') + ')';
      }).join('<br>');
    }
    case 'ordu_saldiri_incele': {
      var ord2 = d.ordular || [];
      if (!ord2.length) return 'Hedef ordu hareketi yok.';
      return '🎯 ' + ord2.map(function(a){ return _escCasus(a.isim||'?') + ' (' + _escCasus(a.durum||'?') + ', ' + _fmtNum(a.toplam_unite) + ' ünite)'; }).join(', ');
    }
    case 'koloni_incele': {
      var kol = d.koloniler || [];
      if (!kol.length) return 'Hedefin kolonisi yok.';
      return '🏰 ' + kol.length + ' koloni: ' + kol.map(function(k){ return (k.kaynak_tipi||'?') + ' (+%' + (k.bonus_oran||0) + ')'; }).join(', ');
    }
    case 'bolge_incele':
      return '🗺️ Bölge: ' + (d.bolge_id||'?') + ' · Koordinat: ' + (d.koord||'?');
    case 'stratejik_bilgiler':
      return '📊 Hedef ordu morali: ' + (d.ordu_morali!=null? d.ordu_morali : '?');
    case 'bilim_hirsizligi':
      return '📚 ' + (d.mesaj || 'Bilim hırsızlığı denendi');
    default:
      return d.mesaj || '';
  }
}

async function loadCasusRaporlar() {
  var token = getToken(); if (!token) return;
  var el = document.getElementById('casus-raporlar');
  if (!el) return;
  try {
    var resp = await fetch(API_BASE + '/api/casus/raporlar', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await resp.json();
    if (!data.length) { el.innerHTML = '<div class="card"><div style="font-size:10px;color:#555">Henuz rapor yok</div></div>'; return; }
    // v1.14.0.19: "Gonderdigim" + "Uzerime Gelen" raporlari ayri renkle
    el.innerHTML = '<div class="card"><div style="font-size:11px;color:var(--race-color);font-weight:bold;margin-bottom:6px">📋 Raporlar (gönderdiğim + üstüme gelen)</div>' +
      data.map(function(r) {
        var icon = r.basarili ? '✅' : '❌';
        var gorevIkon = GOREV_IKONLARI[r.gorev_tipi] || '🕵️';
        var gorevIsim = GOREV_ISIMLERI[r.gorev_tipi] || r.gorev_tipi;
        var detay = casusDetayMetin(r);
        var renk = r.basarili ? '#2ecc71' : '#e74c3c';
        var uzerimeGeldi = r.yon === 'uzerime_geldi';
        var yonBadge = uzerimeGeldi
          ? '<span style="background:rgba(231,76,60,0.15);color:#e74c3c;padding:1px 5px;border-radius:3px;font-size:11px;margin-right:4px">⬅ ÜSTÜME</span>'
          : '<span style="background:rgba(52,152,219,0.15);color:#3498db;padding:1px 5px;border-radius:3px;font-size:11px;margin-right:4px">➡ GÖNDERDİM</span>';
        var yon = uzerimeGeldi
          ? ' ← <b style="color:#e74c3c">' + _escCasus(r.hedef_adi||'?') + '</b>'  // hedef_adi burada SALDIRAN oyuncu
          : ' → ' + _escCasus(r.hedef_adi||'?');
        return '<div style="font-size:10px;padding:6px 4px;border-bottom:1px solid #1a1a1a' + (uzerimeGeldi?';background:rgba(231,76,60,0.04)':'') + '">' +
          '<div style="display:flex;justify-content:space-between;gap:6px">' +
            '<span>' + yonBadge + icon + ' ' + gorevIkon + ' <b>' + _escCasus(gorevIsim) + '</b>' + yon + '</span>' +
            '<span style="color:#555;font-size:11px;white-space:nowrap">' + new Date(r.created_at).toLocaleString('tr-TR') + '</span>' +
          '</div>' +
          (detay ? '<div style="margin-top:3px;color:' + renk + ';padding-left:18px">' + detay + '</div>' : '') +
          '</div>';
      }).join('') + '</div>';
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var check = setInterval(function() { attempts++; if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 20) { clearInterval(check); loadCasus(); } }, 500);
});
