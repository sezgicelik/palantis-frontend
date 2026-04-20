/* rehber.js — Noxara Interaktif Rehber Motoru v1.0
   Gorev sistemiyle entegre spotlight + tooltip rehber.
   - Mevcut gorev_tanimlari.rehber_adim > 0 olan gorevleri rehber olarak gosterir
   - Spotlight overlay + pozisyonlanmis tooltip
   - Sayfa yonlendirme + hedef element vurgulama
   - localStorage'da tamamlandi durumu
*/

const REHBER_STORAGE = 'noxara_rehber_tamamlandi';
const REHBER_ADIM_STORAGE = 'noxara_rehber_adim';
const REHBER_BANNER_GIZLI = 'noxara_rehber_banner_gizli'; // v1.13.21

/* ── Rehber Adim Tanimlari (frontend config) ──
   Her adim:
   - sayfa: hangi sayfada gosterilecek (pathname match)
   - hedef: CSS selector — spotlight bu elemente odaklanir
   - pozisyon: tooltip pozisyonu (bottom/top/left/right)
   - baslik, aciklama: tooltip icerigi
   - bekle: hedef element yoksa kac ms bekle (default 2000)
*/
const REHBER_ADIMLARI = [
  {
    adim: 1,
    sayfa: 'home.html',
    hedef: null,
    pozisyon: 'bottom',
    baslik: 'Noxara\'ya Hos Geldin! 👋',
    aciklama: 'Bu senin kralligin. Sehirlerin kuracak, ordular olusturacak, buyuler yapacaksin. Seni adim adim rehberlik edecegim.',
    ozelTip: 'merkez'
  },
  {
    adim: 2,
    sayfa: 'city.html',
    hedef: '[data-bina="oduncu"],.bina-card[onclick*="oduncu"],.bina-slot[data-id="oduncu"]',
    pozisyon: 'right',
    baslik: 'Ilk Binani Yap: Oduncu 🪓',
    aciklama: 'Oduncu binasi kereste uretir. Kereste tum binalarin temel malzemesidir. Hemen bir oduncu insa et!',
    kosulTipi: 'bina_yap',
    kosulDeger: 'oduncu:1'
  },
  {
    adim: 3,
    sayfa: 'population.html',
    hedef: '#isci-oduncu,.isci-row[data-tip="oduncu"],.worker-card[data-job="oduncu"]',
    pozisyon: 'right',
    baslik: 'İşçi Ata: Oduncu 👷',
    aciklama: 'Koylulerini isciye donustur. Oduncu iscileri her saat kereste uretir. En az 3 isci ata!',
    kosulTipi: 'isci_ata',
    kosulDeger: 'oduncu:3'
  },
  {
    adim: 4,
    sayfa: 'city.html',
    hedef: '[data-bina="isleme"],.bina-card[onclick*="isleme"],.bina-slot[data-id="isleme"]',
    pozisyon: 'right',
    baslik: 'Metal Isleme Kur ⚙️',
    aciklama: 'Isleme binasi metali islenmis metale cevirir. Tum gelismis binalar ve uniteler islenmis metal gerektirir.',
    kosulTipi: 'bina_yap',
    kosulDeger: 'isleme:2'
  },
  {
    adim: 5,
    sayfa: 'population.html',
    hedef: '#isci-madenci,.isci-row[data-tip="madenci"],.worker-card[data-job="madenci"]',
    pozisyon: 'right',
    baslik: 'Madenci Ata ⛏️',
    aciklama: 'Madenci iscileri saatte metal uretir. Starter pack 10 madenci atanmis veriyor, sen arttir.',
    kosulTipi: 'isci_ata',
    kosulDeger: 'madenci:15'
  },
  {
    adim: 6,
    sayfa: '/army',
    hedef: '.btn-unite-egit,.unite-card:first-child,#egitim-form',
    pozisyon: 'bottom',
    baslik: 'Ilk Uniteni Egit 🗡️',
    aciklama: 'Askerlerinden unite olustur. Piyade en temel unite — 10 adet egit ve ilk ordunu kur!',
    kosulTipi: 'unite_egit',
    kosulDeger: 'piyade:10'
  },
  {
    adim: 8,
    sayfa: '/army',
    hedef: '.btn-ordu-olustur,#ordu-olustur-btn,[onclick*="orduOlustur"]',
    pozisyon: 'bottom',
    baslik: 'Ordunu Kur 🏴',
    aciklama: 'Unitelerini bir orduya ata. Ordu olmadan saldiri yapamazsin! Orduna isim ver ve unitelerini ekle.',
    kosulTipi: 'ordu_kur',
    kosulDeger: '1'
  },
  {
    adim: 9,
    sayfa: 'map.html',
    hedef: '#harita-canvas,.harita-container,.tile-grid',
    pozisyon: 'top',
    baslik: 'Haritayi Kesfet 🗺️',
    aciklama: 'Haritada bos kolonileri bul ve fethet. Koloniler sana ekstra kaynak saglar!',
    kosulTipi: 'koloni_fethet',
    kosulDeger: '1'
  },
  {
    adim: 10,
    sayfa: 'home.html',
    hedef: null,
    pozisyon: 'bottom',
    baslik: 'Tebrikler! Rehber Tamamlandi 🎉',
    aciklama: 'Artik Noxara\'nin temellerini biliyorsun. Sehir gelistirmeler, buyuler, guild sistemi ve daha fazlasi seni bekliyor. Bol sans Kral!',
    ozelTip: 'merkez'
  }
];

/* ── State ── */
let _rehberAktif = false;
let _mevcutAdim = 0;
let _tooltipEl = null;
let _spotlightEl = null;
let _backdropEl = null;
let _bannerEl = null;

/* ── Init — sayfa yuklendiginde cagrilir ── */
function rehberInit() {
  // Tamamlandiysa gosterme
  if (localStorage.getItem(REHBER_STORAGE) === '1') return;

  // Token yoksa (giris yapilmamis) gosterme
  if (typeof getToken === 'function' && !getToken()) return;

  // Mevcut adimi oku
  _mevcutAdim = parseInt(localStorage.getItem(REHBER_ADIM_STORAGE)) || 1;

  // Bu sayfada gosterilecek adim var mi?
  const adim = REHBER_ADIMLARI.find(a => a.adim === _mevcutAdim);
  if (!adim) return;

  // v1.13.21: HUD rehber butonunu her durumda goster (aktif rehber var)
  rehberHudButonGoster(adim);

  // Sayfa eslesmesi kontrol
  const currentPage = window.location.pathname;
  if (!sayfaEslesiyor(currentPage, adim.sayfa)) {
    // v1.13.21: Yanlis sayfada — banner sadece kullanici gizlememisse
    if (localStorage.getItem(REHBER_BANNER_GIZLI) !== '1') {
      rehberBannerGoster(adim);
    }
    return;
  }

  // Dogru sayfadayiz — rehberi baslat
  setTimeout(() => rehberAdimGoster(adim), 1000);
}

// v1.13.21: HUD'daki rehber butonu — her sayfada gorulur, tikla banner'i toggle eder
function rehberHudButonGoster(adim) {
  const el = document.getElementById('hud-rehber-btn');
  const adimEl = document.getElementById('hud-rehber-adim');
  if (!el || !adimEl) return;
  el.style.display = 'flex';
  adimEl.textContent = adim.adim + '/' + REHBER_ADIMLARI.length;
}

// Kullanici HUD rehber butonuna tiklayinca — banner'i toggle
function rehberHudTikla() {
  const banner = document.querySelector('.rehber-banner');
  if (banner) {
    // Acik → gizle
    localStorage.setItem(REHBER_BANNER_GIZLI, '1');
    rehberBannerKaldir();
    return;
  }
  // Kapali → ac
  localStorage.removeItem(REHBER_BANNER_GIZLI);
  const adim = REHBER_ADIMLARI.find(a => a.adim === _mevcutAdim);
  if (adim) rehberBannerGoster(adim);
}

function sayfaEslesiyor(currentPath, hedefSayfa) {
  return currentPath.includes(hedefSayfa);
}

/* ── Banner (yanlis sayfadayken) — v1.13.21: kompakt + kapatma ── */
function rehberBannerGoster(adim) {
  rehberBannerKaldir();
  _bannerEl = document.createElement('div');
  _bannerEl.className = 'rehber-banner';
  _bannerEl.innerHTML =
    '<span class="rehber-banner-text">📜 Adim ' + adim.adim + '/' + REHBER_ADIMLARI.length + ': ' + adim.baslik + '</span>' +
    '<div style="display:flex;gap:6px;align-items:center">' +
      '<button class="rehber-banner-btn" onclick="rehberSayfayaGit()">Git →</button>' +
      '<button class="rehber-banner-btn" onclick="rehberAtla()" style="color:#666;border-color:#333">Atla</button>' +
      '<button class="rehber-banner-btn rehber-banner-close" onclick="rehberBannerGizle()" title="Kapat (rehber butonundan tekrar ac)" style="color:#888;border:none;background:transparent;font-size:16px;padding:2px 8px">✕</button>' +
    '</div>';
  document.body.appendChild(_bannerEl);
}

// v1.13.21: Kullanici ✕'ya bastiginda banner gizlenir (HUD butonu kalir)
function rehberBannerGizle() {
  localStorage.setItem(REHBER_BANNER_GIZLI, '1');
  rehberBannerKaldir();
}

function rehberBannerKaldir() {
  if (_bannerEl) { _bannerEl.remove(); _bannerEl = null; }
}

function rehberSayfayaGit() {
  const adim = REHBER_ADIMLARI.find(a => a.adim === _mevcutAdim);
  if (adim) window.location.href = adim.sayfa;
}

/* ── Adim Gosterimi ── */
function rehberAdimGoster(adim) {
  rehberTemizle();
  _rehberAktif = true;

  // Backdrop
  _backdropEl = document.createElement('div');
  _backdropEl.className = 'rehber-backdrop';
  _backdropEl.onclick = function() {}; // Click'i engelle
  document.body.appendChild(_backdropEl);

  // Hedef element bul
  let hedefEl = null;
  if (adim.hedef) {
    const selectors = adim.hedef.split(',');
    for (const sel of selectors) {
      hedefEl = document.querySelector(sel.trim());
      if (hedefEl) break;
    }
  }

  // Spotlight
  if (hedefEl) {
    const rect = hedefEl.getBoundingClientRect();
    const pad = 8;
    _spotlightEl = document.createElement('div');
    _spotlightEl.className = 'rehber-spotlight';
    _spotlightEl.style.left = (rect.left - pad) + 'px';
    _spotlightEl.style.top = (rect.top - pad) + 'px';
    _spotlightEl.style.width = (rect.width + pad * 2) + 'px';
    _spotlightEl.style.height = (rect.height + pad * 2) + 'px';
    document.body.appendChild(_spotlightEl);

    // Backdrop'u spotlight deligi ile guncelle
    _backdropEl.style.background = 'none';
  }

  // Tooltip
  _tooltipEl = document.createElement('div');
  _tooltipEl.className = 'rehber-tooltip';

  // Adim noktalari
  let dotsHTML = '<div class="rehber-dots">';
  REHBER_ADIMLARI.forEach(a => {
    const cls = a.adim === adim.adim ? 'aktif' : a.adim < adim.adim ? 'tamamlandi' : '';
    dotsHTML += '<div class="rehber-dot ' + cls + '"></div>';
  });
  dotsHTML += '</div>';

  // Odul gosterimi (eger backend goreviyle eslesmisse)
  let odulHTML = '';
  // Frontend'de odul gostermiyoruz — gorev sayfasinda gosterilir

  // Gorev adimi mi (hedef var) yoksa bilgi adimi mi (merkez)?
  const gorevAdimi = adim.ozelTip !== 'merkez' && adim.hedef;

  _tooltipEl.innerHTML =
    '<div class="rehber-adim-no">Adim ' + adim.adim + ' / ' + REHBER_ADIMLARI.length + '</div>' +
    '<div class="rehber-baslik">' + adim.baslik + '</div>' +
    '<div class="rehber-aciklama">' + adim.aciklama + '</div>' +
    odulHTML +
    '<div class="rehber-buttons">' +
      '<button class="rehber-btn rehber-btn-atla" onclick="rehberAtla()">Atla</button>' +
      (adim.adim >= REHBER_ADIMLARI.length
        ? '<button class="rehber-btn rehber-btn-ileri" onclick="rehberTamamla()">🎉 Tamamla</button>'
        : gorevAdimi
          ? '<button class="rehber-btn rehber-btn-ileri" onclick="rehberKapat()">👍 Tamam, Yapacagim!</button>'
          : '<button class="rehber-btn rehber-btn-ileri" onclick="rehberIleri()">Anladim →</button>'
      ) +
    '</div>' +
    dotsHTML;

  document.body.appendChild(_tooltipEl);

  // Pozisyonla
  if (adim.ozelTip === 'merkez' || !hedefEl) {
    // Ortada goster
    _tooltipEl.style.left = '50%';
    _tooltipEl.style.top = '50%';
    _tooltipEl.style.transform = 'translate(-50%, -50%)';
  } else {
    tooltipPozisyonla(adim.pozisyon, hedefEl);
  }
}

function tooltipPozisyonla(pozisyon, hedefEl) {
  const rect = hedefEl.getBoundingClientRect();
  const pad = 16;

  // Once sinifi ekle (ok yonu icin)
  _tooltipEl.classList.add('pos-' + pozisyon);

  // Tooltip boyutunu ol
  const tRect = _tooltipEl.getBoundingClientRect();

  let left, top;
  switch (pozisyon) {
    case 'bottom':
      left = rect.left;
      top = rect.bottom + pad;
      break;
    case 'top':
      left = rect.left;
      top = rect.top - tRect.height - pad;
      break;
    case 'right':
      left = rect.right + pad;
      top = rect.top;
      break;
    case 'left':
      left = rect.left - tRect.width - pad;
      top = rect.top;
      break;
  }

  // Ekran disina tasmamasi
  left = Math.max(8, Math.min(left, window.innerWidth - tRect.width - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - tRect.height - 8));

  _tooltipEl.style.left = left + 'px';
  _tooltipEl.style.top = top + 'px';
}

/* ── Overlay kapat, banner birak (gorev adimlari icin) ── */
function rehberKapat() {
  rehberTemizle();
  const adim = REHBER_ADIMLARI.find(a => a.adim === _mevcutAdim);
  if (adim) rehberGorevBanner(adim);
}

function rehberGorevBanner(adim) {
  rehberBannerKaldir();
  _bannerEl = document.createElement('div');
  _bannerEl.className = 'rehber-banner';
  _bannerEl.innerHTML =
    '<span class="rehber-banner-text">📜 Adim ' + adim.adim + ': ' + adim.baslik + '</span>' +
    '<div style="display:flex;gap:6px">' +
      '<button class="rehber-banner-btn" onclick="rehberGorevTamamla()" style="background:rgba(46,204,113,.15);border-color:rgba(46,204,113,.3);color:#2ecc71">✓ Tamamladim</button>' +
      '<button class="rehber-banner-btn" onclick="rehberBannerTekrarGoster()">📖 Tekrar Goster</button>' +
      '<button class="rehber-banner-btn" onclick="rehberAtla()" style="color:#666;border-color:#333">Atla</button>' +
    '</div>';
  document.body.appendChild(_bannerEl);
}

function rehberGorevTamamla() {
  rehberBannerKaldir();
  rehberIleri();
}

function rehberBannerTekrarGoster() {
  rehberBannerKaldir();
  const adim = REHBER_ADIMLARI.find(a => a.adim === _mevcutAdim);
  if (adim) rehberAdimGoster(adim);
}

/* ── Ilerleme Kontrolleri ── */
function rehberIleri() {
  _mevcutAdim++;
  localStorage.setItem(REHBER_ADIM_STORAGE, _mevcutAdim);

  const sonrakiAdim = REHBER_ADIMLARI.find(a => a.adim === _mevcutAdim);
  if (!sonrakiAdim) {
    rehberTamamla();
    return;
  }

  // Ayni sayfadaysa direkt goster
  if (sayfaEslesiyor(window.location.pathname, sonrakiAdim.sayfa)) {
    rehberAdimGoster(sonrakiAdim);
  } else {
    // Farkli sayfaya yonlendir
    rehberTemizle();
    window.location.href = sonrakiAdim.sayfa;
  }
}

function rehberAtla() {
  if (confirm('Rehberi atlamak istediginize emin misiniz? Ayarlar sayfasindan tekrar baslatabilirsiniz.')) {
    rehberTamamla();
  }
}

function rehberTamamla() {
  localStorage.setItem(REHBER_STORAGE, '1');
  localStorage.removeItem(REHBER_ADIM_STORAGE);
  rehberTemizle();
  rehberBannerKaldir();
  if (typeof toast === 'function') toast('Rehber tamamlandi! Gorevler sayfasinda devam edebilirsin.');
}

function rehberSifirla() {
  localStorage.removeItem(REHBER_STORAGE);
  localStorage.removeItem(REHBER_ADIM_STORAGE);
  _mevcutAdim = 1;
  if (typeof toast === 'function') toast('Rehber sifirlandi. Sayfa yenilenince baslar.');
}

function rehberTemizle() {
  _rehberAktif = false;
  if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
  if (_spotlightEl) { _spotlightEl.remove(); _spotlightEl = null; }
  if (_backdropEl) { _backdropEl.remove(); _backdropEl = null; }
}

/* ── Sayfa yuklendiginde basla ── */
document.addEventListener('DOMContentLoaded', function() {
  // OYUNCU verisi yuklenmesini bekle (layout.js gibi)
  let attempts = 0;
  const check = setInterval(function() {
    attempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || attempts > 30) {
      clearInterval(check);
      if (typeof OYUNCU !== 'undefined' && OYUNCU?.kral) {
        rehberInit();
      }
    }
  }, 500);
});
