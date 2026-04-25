/* ══════════════════════════════════
   NUFUS & ISCILER SAYFASI
   Extracted from index.html
══════════════════════════════════ */

// İşçi tipi -> bina eslesmesi
// v1.13.15: demir_madeni kaldirildi, madenci serbest
// v1.13.67: wood (oduncu) kapasite kontrolu kaldirildi — backend'de de yok (oduncu serbest ata)
// SADECE ciftci→tarla enforce ediliyor (backend routes/game.js:311)
const ISCI_BINA_MAP = {
  // wood: bina kapasitesi YOK — oduncu serbest ata
  // iron: bina kapasitesi YOK (v1.12.0'da demir_madeni kaldirildi) — madenci serbest ata
  farm:     { binaId: 'tarla',        kapasite: 50, ad: 'Tarla' },
  // fish: backend'de enforce edilmiyor — serbest ata (HUD'de bilgi gosterilmeye devam edilir)
  // merchant: Pazar binasi eklenince baglanacak — simdilik serbest
  // v1.14.2.0 (FAZ X.4): Katip — Akademi seviye x 50 kapasitesi
  katip:    { binaId: 'akademi',      kapasite: 50, ad: 'Akademi' },
  // v1.14.2.1: Izci — Bina-bagli degil, max 50 (sabit)
  izci:     { binaId: null,           kapasite: 50, ad: 'Izci', sabitKapasite: true },
};

function getWorkerCapacity(type) {
  const map = ISCI_BINA_MAP[type];
  if (!map) return Infinity; // Tüccar vb. serbest
  // v1.14.2.1: Sabit kapasiteli isci (izci max 50)
  if (map.sabitKapasite) return map.kapasite;
  const binaAdet = BLDGS[map.binaId]?.lv || 0;
  return binaAdet * map.kapasite;
}

function assignWorker(type, delta){
  const abs = Math.abs(delta);
  if(delta > 0 && population.free < abs) { toast('Yeterli boş köylü yok!'); return; }
  if(delta < 0 && population[type] < abs) return;

  // Bina kapasite kontrolu (artirma icin)
  if(delta > 0) {
    const kapasite = getWorkerCapacity(type);
    const mevcut = population[type] || 0;
    if(mevcut + delta > kapasite) {
      const map = ISCI_BINA_MAP[type];
      const binaAdet = map ? (BLDGS[map.binaId]?.lv || 0) : 0;
      if(kapasite === 0) {
        toast('⚠️ ' + (map?.ad || type) + ' binası yok! Önce inşa et.');
      } else {
        toast('⚠️ Kapasite dolu! ' + kapasite + ' max (' + binaAdet + ' bina × ' + (map?.kapasite||0) + ')');
      }
      return;
    }
  }

  population[type] = Math.max(0, population[type] + delta);
  population.free -= delta;
  // v1.13.68.7: skipBackendFetch=true — lokal degisiklik backend fetch ile overwrite edilmesin
  updatePopulationUI(true);
}

/* -- Pisirme Orani -- */
let PISIRME = { bugday: 34, balik: 33, et: 33 };

async function loadPisirme() {
  const token = getToken();
  if (!token) return;
  try {
    const r = await fetch(API_BASE + '/api/game/pisirme', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) return;
    const d = await r.json();
    PISIRME.bugday = parseInt(d.bugday_oran) || 34;
    PISIRME.balik  = parseInt(d.balik_oran)  || 33;
    PISIRME.et     = parseInt(d.et_oran)      || 33;
    updatePisirmeUI();
  } catch(e) {}
}

function pisirmeAdj(tip, delta) {
  const keys = { bugday:'bugday', balik:'balik', et:'et' };
  const k = keys[tip];
  PISIRME[k] = Math.max(0, Math.min(100, PISIRME[k] + delta));
  updatePisirmeUI();
}

function updatePisirmeUI() {
  const set = (id, v) => { const e=document.getElementById(id); if(e) e.innerText=v; };
  set('pisirme-bugday', PISIRME.bugday);
  set('pisirme-balik',  PISIRME.balik);
  set('pisirme-et',     PISIRME.et);
  const toplam = PISIRME.bugday + PISIRME.balik + PISIRME.et;
  const totEl = document.getElementById('pisirme-toplam');
  if (totEl) { totEl.innerText = toplam; totEl.style.color = toplam === 100 ? '#2ecc71' : '#e74c3c'; }
  const ocak  = (BLDGS.ocak?.lv  || 0);
  const firin = (BLDGS.firin?.lv || 0);
  const bKap = ocak*100 + firin*200;
  const baKap = ocak*75 + firin*150;
  const eKap  = ocak*50 + firin*100;
  set('pisirme-kap-bugday', Math.floor(bKap  * PISIRME.bugday / 100));
  set('pisirme-kap-balik',  Math.floor(baKap * PISIRME.balik  / 100));
  set('pisirme-kap-et',     Math.floor(eKap  * PISIRME.et     / 100));
}

async function pisirmeKaydet() {
  const token = getToken();
  if (!token) return;
  const toplam = PISIRME.bugday + PISIRME.balik + PISIRME.et;
  const msgEl = document.getElementById('pisirme-msg');
  if (toplam !== 100) {
    if (msgEl) { msgEl.style.color='#e74c3c'; msgEl.innerText=`Toplam ${toplam}% \u2014 100 olmali!`; }
    return;
  }
  try {
    const r = await fetch(API_BASE + '/api/game/pisirme', {
      method: 'PUT',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
      body: JSON.stringify({ bugday_oran: PISIRME.bugday, balik_oran: PISIRME.balik, et_oran: PISIRME.et })
    });
    const d = await r.json();
    if (r.ok) {
      if (msgEl) { msgEl.style.color='#2ecc71'; msgEl.innerText='Kaydedildi'; }
      setTimeout(() => { if(msgEl) msgEl.innerText=''; }, 3000);
    } else {
      if (msgEl) { msgEl.style.color='#e74c3c'; msgEl.innerText=d.error||'Hata'; }
    }
  } catch(e) {
    if (msgEl) { msgEl.style.color='#e74c3c'; msgEl.innerText='Baglanti hatasi'; }
  }
}

async function saveWorkers(){
  const token = getToken();
  if (!token) { toast('Giris yapmalisin!'); return; }
  try {
    const resp = await fetch(API_BASE + '/api/game/workers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        oduncu: population.wood || 0,
        madenci: population.iron || 0,
        ciftci: population.farm || 0,
        balikci: population.fish || 0,
        tuccar: population.merchant || 0,
        katip:  population.katip || 0, // v1.14.2.0 (FAZ X.4)
        izci:   population.izci  || 0  // v1.14.2.1
      })
    });
    if (resp.ok) {
      toast('İşçi dagilimi kaydedildi!');
      // v1.13.68.7: Kayittan sonra backend'le tam senkron (skipBackendFetch=false)
      if (typeof updatePopulationUI === 'function') updatePopulationUI(false);
    } else { const err = await resp.json(); toast(err.error || 'Hata'); }
  } catch(e) { toast('Sunucu hatasi'); }
}

/* ── HAYVAN KESİM SİSTEMİ (Besi + At/Kurt) ── */
let KESIM_MIKTAR = 0;
let KESIM_TIP = 'besi'; // 'besi' veya 'at_kurt'

function kesimTabDegistir(tip) {
  KESIM_TIP = tip;
  KESIM_MIKTAR = 0;
  // Sekme buton stilleri
  const tabBesi = document.getElementById('kesim-tab-besi');
  const tabAskeri = document.getElementById('kesim-tab-askeri');
  if (tabBesi) { tabBesi.className = tip === 'besi' ? 'btn' : 'btn ghost'; }
  if (tabAskeri) { tabAskeri.className = tip === 'at_kurt' ? 'btn' : 'btn ghost'; }
  kesimInit();
}

function kesimInit() {
  const taraf = OYUNCU?.taraf || 'iyi';
  const isLight = taraf === 'iyi';
  const lbl = document.getElementById('kesim-hayvan-lbl');
  const aciklama = document.getElementById('kesim-taraf-aciklama');

  if (KESIM_TIP === 'besi') {
    if (lbl) lbl.textContent = '🐄 BESİ HAYVANI';
    if (aciklama) aciklama.textContent = 'Besi hayvanları çiftlikten gelir. Her besi hayvanı = 20 çiğ et.';
    setText('kesim-hayvan', EXTRA_RES.besi_hayvani || 0);
  } else {
    const hayvanAdi = isLight ? 'At' : 'Kurt';
    const hayvanIcon = isLight ? '🐴' : '🐺';
    if (lbl) lbl.textContent = hayvanIcon + ' ' + hayvanAdi.toUpperCase();
    if (aciklama) aciklama.textContent = isLight
      ? '🐴 Aydınlık taraf at keser. Her at = 50 çiğ et.'
      : '🐺 Karanlık taraf kurt keser. Her kurt = 50 çiğ et.';
    const hayvanSayisi = isLight ? (EXTRA_RES.at || 0) : (EXTRA_RES.kurt || 0);
    setText('kesim-hayvan', hayvanSayisi);
  }

  setText('kesim-cig-et', RES.cig_et || 0);
  KESIM_MIKTAR = 0;
  setText('kesim-miktar', 0);
  setText('kesim-miktar-preview', 0);
  setText('kesim-et-preview', 0);
}

function kesimAdjust(delta) {
  const taraf = OYUNCU?.taraf || 'iyi';
  const isLight = taraf === 'iyi';
  let max;
  if (KESIM_TIP === 'besi') {
    max = EXTRA_RES.besi_hayvani || 0;
  } else {
    max = isLight ? (EXTRA_RES.at || 0) : (EXTRA_RES.kurt || 0);
  }
  const etCarpan = KESIM_TIP === 'besi' ? 20 : 50;
  KESIM_MIKTAR = Math.max(0, Math.min(KESIM_MIKTAR + delta, max));
  setText('kesim-miktar', KESIM_MIKTAR);
  setText('kesim-miktar-preview', KESIM_MIKTAR);
  setText('kesim-et-preview', KESIM_MIKTAR * etCarpan);
}

async function kesimYap() {
  if (KESIM_MIKTAR <= 0) {
    document.getElementById('kesim-sonuc').textContent = '⚠️ Kesilecek miktar gir!';
    return;
  }
  const token = getToken();
  if (!token) { toast('Giriş yapmalısın!'); return; }

  try {
    const resp = await fetch(API_BASE + '/api/game/resources/slaughter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ miktar: KESIM_MIKTAR, tip: KESIM_TIP })
    });
    const data = await resp.json();
    if (!resp.ok) {
      document.getElementById('kesim-sonuc').textContent = '⚠️ ' + (data.error || 'Hata');
      return;
    }
    const etCarpan = KESIM_TIP === 'besi' ? 20 : 50;
    const uretilen = KESIM_MIKTAR * etCarpan;
    document.getElementById('kesim-sonuc').textContent =
      '✅ ' + KESIM_MIKTAR + ' hayvan kesildi → ' + uretilen + ' çiğ et üretildi!';
    document.getElementById('kesim-sonuc').style.color = '#2ecc71';
    // Kaynaklari guncelle
    if (data.extra_res) {
      EXTRA_RES.at = data.extra_res.at || 0;
      EXTRA_RES.kurt = data.extra_res.kurt || 0;
    }
    if (data.besi_hayvani !== undefined) EXTRA_RES.besi_hayvani = data.besi_hayvani;
    if (data.cig_et !== undefined) RES.cig_et = data.cig_et;
    KESIM_MIKTAR = 0;
    kesimInit();
    setTimeout(() => {
      const el = document.getElementById('kesim-sonuc');
      if (el) { el.textContent = ''; el.style.color = '#888'; }
    }, 4000);
  } catch(e) {
    document.getElementById('kesim-sonuc').textContent = '⚠️ Bağlantı hatası';
  }
}

/* ═══════════════════════════════════════════
   VERGİ SİSTEMİ UI
═══════════════════════════════════════════ */
// v1.14.1.24: 0-25 tam skala (backend ceza_tablosu ile senkron)
const VERGI_MORAL_TABLO = {
  0:0, 1:-1, 2:-3, 3:-5, 4:-10, 5:-18, 6:-28, 7:-40, 8:-55, 9:-72,
  10:-90, 11:-110, 12:-132, 13:-156, 14:-182, 15:-210, 16:-240,
  17:-272, 18:-306, 19:-342, 20:-380, 21:-420, 22:-462, 23:-506,
  24:-552, 25:-600
};
let VERGI_ORANI = 0;

function vergiSliderChange(val) {
  VERGI_ORANI = parseInt(val) || 0;
  const el = document.getElementById('vergi-deger');
  if (el) el.textContent = VERGI_ORANI;
  const freeKoylu = population.free || 0;
  const gelir = freeKoylu * VERGI_ORANI;
  const gelirEl = document.getElementById('vergi-gelir');
  if (gelirEl) gelirEl.textContent = gelir.toLocaleString() + ' altın';
  const moralEl = document.getElementById('vergi-moral-etki');
  const moralVal = VERGI_MORAL_TABLO[VERGI_ORANI] || 0;
  if (moralEl) {
    moralEl.textContent = moralVal === 0 ? '0' : moralVal;
    moralEl.style.color = moralVal === 0 ? '#2ecc71' : moralVal > -20 ? '#e67e22' : '#e74c3c';
  }
}

async function vergiYukle() {
  const token = getToken(); if (!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/game/vergi', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) return;
    const data = await resp.json();
    VERGI_ORANI = data.vergi_orani || 0;
    const slider = document.getElementById('vergi-slider');
    if (slider) slider.value = VERGI_ORANI;
    vergiSliderChange(VERGI_ORANI);
  } catch(e) {}
}

async function vergiKaydet() {
  const token = getToken(); if (!token) return;
  const sonuc = document.getElementById('vergi-sonuc');
  try {
    const resp = await fetch(API_BASE + '/api/game/vergi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ vergi_orani: VERGI_ORANI })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (sonuc) { sonuc.textContent = err.error || 'Hata!'; sonuc.style.color = '#e74c3c'; }
      return;
    }
    if (sonuc) { sonuc.textContent = '✅ Vergi oranı %' + VERGI_ORANI + ' olarak kaydedildi.'; sonuc.style.color = '#2ecc71'; }
    setTimeout(() => { if (sonuc) { sonuc.textContent = ''; sonuc.style.color = '#888'; } }, 3000);
  } catch(e) {
    if (sonuc) { sonuc.textContent = '⚠️ Bağlantı hatası'; sonuc.style.color = '#e74c3c'; }
  }
}

function bonusEtkileriGuncelle() {
  // Irk
  const irkEl = document.getElementById('bonus-irk-detay');
  if (irkEl && OYUNCU?.irkData) {
    const p = localStorage.getItem('palantis_player');
    try {
      const pd = JSON.parse(p);
      if (pd?.irk_bonuslari) {
        const parts = Object.entries(pd.irk_bonuslari).map(([k,v]) => `${k} +%${v}`);
        irkEl.textContent = parts.length > 0 ? parts.join(', ') : 'Bonus yok';
      }
    } catch(e) {}
  }
  // Bolge
  const bolgeEl = document.getElementById('bonus-bolge-detay');
  if (bolgeEl) {
    try {
      const pd = JSON.parse(localStorage.getItem('palantis_player'));
      if (pd?.bolge_bilgi) {
        const parts = Object.entries(pd.bolge_bilgi.bonuslar||{}).map(([k,v]) => `${k} +%${v}`);
        bolgeEl.textContent = `${pd.bolge_bilgi.ad}: ${parts.join(', ') || 'Bonus yok'}`;
      }
    } catch(e) {}
  }
  // Moral
  const moralEl = document.getElementById('bonus-moral-detay');
  if (moralEl) {
    const m = parseInt(document.getElementById('hud-sehir-moral')?.textContent) || 0;
    if (m >= 50) moralEl.textContent = 'Normal (%100 üretim)';
    else moralEl.textContent = `Düşük! Üretim: %${Math.round(m/50*100)}`;
    moralEl.style.color = m >= 50 ? '#2ecc71' : '#e74c3c';
  }
  // Premium
  const premEl = document.getElementById('bonus-prem-detay');
  if (premEl) {
    try {
      const pd = JSON.parse(localStorage.getItem('palantis_player'));
      if (pd?.premium?.aktif) premEl.textContent = `${pd.premium.paket} paketi aktif`;
      else premEl.textContent = 'Aktif değil';
    } catch(e) {}
  }
  // Artifact
  const artifactEl = document.getElementById('bonus-artifact-detay');
  if (artifactEl) {
    try {
      const aToken = getToken();
      if (aToken) {
        fetch(API_BASE + '/api/artifact/aktif-bonuslar', { headers: { Authorization: 'Bearer ' + aToken } })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data || !data.artifactlar || !data.artifactlar.length) {
              artifactEl.textContent = 'Aktif artifact yok';
              return;
            }
            artifactEl.innerHTML = data.artifactlar.map(a => {
              const etkiParts = Object.entries(a.etki || {}).map(([k, v]) => `${k} +%${v}`).join(', ');
              return `<div>${a.ikon || '🧰'} ${a.isim || a.artifact_id}: ${etkiParts || '-'} <span style="color:#e67e22">(${a.kalan_pg || 0} PG)</span></div>`;
            }).join('');
          }).catch(() => {});
      }
    } catch(e) {}
  }
  // İşçi/Limit
  const isciLimitEl = document.getElementById('pop-isci-limit');
  if (isciLimitEl) {
    const isci = (population.wood||0)+(population.iron||0)+(population.farm||0)+(population.fish||0)+(population.merchant||0);
    const cag = OYUNCU?.cag || 1;
    const CAG_ISCI_LIMIT = {1:1500, 2:2000, 3:2500, 4:3000, 5:3500};
    isciLimitEl.textContent = `${isci} / ${CAG_ISCI_LIMIT[cag]||200}`;
  }
  // v1.14.1.28: Detayli uretim tablosunu doldur
  doldurUretimDetayTablo();
}

async function doldurUretimDetayTablo() {
  const tbody = document.getElementById('uretim-detay-tbody');
  if (!tbody) return;
  try {
    const tok = getToken(); if (!tok) return;
    const r = await fetch(API_BASE + '/api/game/production?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store'
    });
    if (!r.ok) { tbody.innerHTML = '<tr><td colspan="7" style="padding:10px;text-align:center;color:#e74c3c">API hata</td></tr>'; return; }
    const d = await r.json();
    const baz = d.baz || {};
    const bolge = d.bolge_bonus || {};
    const irk = d.irk_bonus || {};
    const buyu = d.buyu_bonus || {}; // { hammadde, mana_carpan, yiyecek }
    const toplam = d.toplam || {};
    // Premium: baz × 10% (hammadde + yiyecek için)
    // Detayli premium oran'ı kullaniciya gore farklı olabilir (paket); burada yaklasik
    const pData = (() => { try { return JSON.parse(localStorage.getItem('palantis_player') || 'null'); } catch { return null; } })();
    const premAktif = !!(pData?.premium?.aktif);
    const premYuzde = premAktif ? 10 : 0; // yaklasik %10 (admin paneli farklıysa gerçek değer backend'den gelir)

    const fmt = (n) => Math.floor(n || 0).toLocaleString('tr-TR');
    const hammaddeKaynaklar = ['odun', 'metal', 'altin', 'kereste', 'islenmis'];
    const yiyecekKaynaklar = ['bugday', 'balik'];
    const kaynakIkon = {
      odun:'🌳 Odun', metal:'⛓ Metal', altin:'💰 Altın',
      bugday:'🌾 Buğday', balik:'🐟 Balık',
      kereste:'🪵 Kereste', islenmis:'🔩 İşlenmiş'
    };

    const satirlar = [];
    for (const [kaynak, icon] of Object.entries(kaynakIkon)) {
      const bazMiktar = parseFloat(baz[kaynak]) || 0;
      const bolgeYuzde = parseFloat(bolge[kaynak]) || 0;
      const irkYuzde = parseFloat(irk[kaynak]) || 0;
      const buyuYuzde = hammaddeKaynaklar.includes(kaynak) ? (parseFloat(buyu.hammadde)||0)
                    : yiyecekKaynaklar.includes(kaynak) ? (parseFloat(buyu.yiyecek)||0) : 0;
      const bolgeEk = Math.floor(bazMiktar * bolgeYuzde / 100);
      const irkEk = Math.floor(bazMiktar * irkYuzde / 100);
      const premEk = Math.floor(bazMiktar * premYuzde / 100);
      const buyuEk = Math.floor(bazMiktar * buyuYuzde / 100);
      const hesaplanan = bazMiktar + bolgeEk + irkEk + premEk + buyuEk;
      const toplamDeger = parseFloat(toplam[kaynak]) || hesaplanan;
      satirlar.push(
        '<tr style="border-bottom:1px solid #151515">' +
        '<td style="padding:6px 10px;color:#ccc">' + icon + '</td>' +
        '<td style="padding:6px;text-align:right;color:#aaa">' + fmt(bazMiktar) + '</td>' +
        '<td style="padding:6px;text-align:right;color:#3498db">' + (bolgeEk > 0 ? '+' + fmt(bolgeEk) : '—') + '</td>' +
        '<td style="padding:6px;text-align:right;color:#e67e22">' + (irkEk > 0 ? '+' + fmt(irkEk) : '—') + '</td>' +
        '<td style="padding:6px;text-align:right;color:#f1c40f">' + (premEk > 0 ? '+' + fmt(premEk) : '—') + '</td>' +
        '<td style="padding:6px;text-align:right;color:#9b59b6">' + (buyuEk > 0 ? '+' + fmt(buyuEk) : '—') + '</td>' +
        '<td style="padding:6px 10px;text-align:right;color:#2ecc71;font-weight:bold">' + fmt(toplamDeger) + '/saat</td>' +
        '</tr>'
      );
    }
    // Mana satirlari
    for (const renk of ['beyaz', 'kirmizi', 'mavi', 'yesil']) {
      const key = 'mana_' + renk;
      const manaVal = parseFloat(toplam[key]) || 0;
      if (manaVal > 0) {
        const manaRenk = { beyaz:'#f5f5f5', kirmizi:'#e74c3c', mavi:'#3498db', yesil:'#2ecc71' }[renk];
        satirlar.push(
          '<tr style="border-bottom:1px solid #151515">' +
          '<td style="padding:6px 10px;color:' + manaRenk + '">🔮 Mana ' + renk.charAt(0).toUpperCase() + renk.slice(1) + '</td>' +
          '<td colspan="5" style="padding:6px;text-align:right;color:#555;font-size:10px">(Bilge + yakariş dahil)</td>' +
          '<td style="padding:6px 10px;text-align:right;color:' + manaRenk + ';font-weight:bold">' + fmt(manaVal) + '/saat</td>' +
          '</tr>'
        );
      }
    }
    tbody.innerHTML = satirlar.join('') || '<tr><td colspan="7" style="padding:10px;text-align:center;color:#555">Üretim verisi yok</td></tr>';
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:10px;text-align:center;color:#e74c3c">Hata: ' + e.message + '</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updatePopulationUI();
  loadPisirme();
  updatePisirmeUI();
  kesimInit();
  vergiYukle();
  setTimeout(bonusEtkileriGuncelle, 2000);
  setTimeout(loadEsirler, 400);
});

/* ════════════════════════════════════════
   v1.14.0.80: Esirler panel
════════════════════════════════════════ */
async function loadEsirler() {
  const wrap = document.getElementById('esir-icerik');
  if (!wrap) return;
  const token = (typeof getToken === 'function') ? getToken() : localStorage.getItem('palantis_token');
  if (!token) { wrap.textContent = 'Giris gerekli'; return; }
  try {
    const r = await fetch(API_BASE + '/api/game/esirler', { headers: { Authorization: 'Bearer ' + token } });
    const d = await r.json();
    if (!r.ok) { wrap.innerHTML = '<span style="color:#e74c3c">Hata: ' + (d.error||'?') + '</span>'; return; }

    const e = d.esir || {};
    const toplam = (e.bos||0) + (e.oduncu||0) + (e.madenci||0) + (e.ciftci||0) + (e.balikci||0) + (e.tuccar||0);
    // v1.14.1.02 FIX: Backend d.kamp objesi doner (d.kamp.seviye), d.kamp_seviye top-level degil
    const kampSev = d.kamp?.seviye || d.kamp_seviye || 0;
    const kampKap = d.kamp?.kapasite || d.kamp_kapasite || 0;
    const izinli = d.donusum_izinli_uniteler || d.izinli_uniteler || [];

    if (kampSev === 0) {
      wrap.innerHTML = '<div style="padding:16px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c">🔒 <b>Esir Kampi yok!</b> Savas sonrasi gelen esirler kacar. <a href="city.html" style="color:#f1c40f">Sehir sayfasindan</a> Esir Kampi insa et.</div>';
      return;
    }

    const satir = (ad, sayi, icon) =>
      '<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#1a0f15;border:1px solid #3a2030;border-radius:4px;min-width:120px">' +
        '<span style="color:#c9a4c4">' + icon + ' ' + ad + '</span>' +
        '<span style="color:#9b59b6;font-weight:bold">' + (sayi||0).toLocaleString('tr-TR') + '</span>' +
      '</div>';

    let html =
      '<div style="display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px;padding:10px;background:#0f0815;border:1px solid #2a1a2a;border-radius:6px">' +
        '<div><div style="font-size:10px;color:#888">Kapasite</div><div style="font-size:14px;color:#9b59b6;font-weight:bold">' + toplam.toLocaleString("tr-TR") + ' / ' + kampKap.toLocaleString("tr-TR") + '</div></div>' +
        '<div><div style="font-size:10px;color:#888">Kamp Seviyesi</div><div style="font-size:14px;color:#9b59b6;font-weight:bold">' + kampSev + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
        satir('Bosta', e.bos, '⛓️') +
        satir('Oduncu', e.oduncu, '🪓') +
        satir('Madenci', e.madenci, '⛏️') +
        satir('Ciftci', e.ciftci, '🌾') +
        satir('Balikci', e.balikci, '🎣') +
        satir('Tuccar', e.tuccar, '💼') +
      '</div>';

    if ((e.bos||0) > 0) {
      // v1.14.0.82: Esir -> Isci cevirme formu
      html +=
        '<div style="padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:6px;margin-bottom:10px">' +
          '<div style="color:#c8a96e;font-weight:bold;margin-bottom:8px">⚒️ Esir\'i Isci Yap (ucretsiz)</div>' +
          '<div style="font-size:11px;color:#888;margin-bottom:8px">Bos esiri isci olarak ata: oduncu/madenci/ciftci/balikci/tuccar. Maliyet yok.</div>' +
          '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
            '<select id="esir-isci-tip" style="padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px;font-size:12px">' +
              '<option value="oduncu">🪓 Oduncu</option>' +
              '<option value="madenci">⛏️ Madenci</option>' +
              '<option value="ciftci">🌾 Ciftci (tarla gerekli)</option>' +
              '<option value="balikci">🎣 Balikci</option>' +
              '<option value="tuccar">💼 Tuccar</option>' +
            '</select>' +
            '<input id="esir-isci-adet" type="number" min="1" max="' + (e.bos||0) + '" value="1" style="width:80px;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px;font-size:12px">' +
            '<button class="btn" onclick="esirIsciyeCevir()" style="padding:6px 14px;font-size:12px;background:#2ecc71;color:#000">✓ Atanacak</button>' +
          '</div>' +
          '<div id="esir-isci-sonuc" style="margin-top:6px;font-size:11px;color:#888"></div>' +
        '</div>';

      // Esir -> Unite cevirme formu (mevcut)
      if (izinli.length > 0) {
        const opts = izinli.map(u => '<option value="' + u + '">' + u + '</option>').join('');
        html +=
          '<div style="padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:6px">' +
            '<div style="color:#c8a96e;font-weight:bold;margin-bottom:8px">⚔️ Esir\'den Unite Olustur (%50 altin)</div>' +
            '<div style="font-size:11px;color:#888;margin-bottom:8px">Maliyet: normal unite altin fiyatinin %50\'si. Aninda egitilir, havuza eklenir.</div>' +
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
              '<select id="esir-unite-sec" style="padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px;font-size:12px">' + opts + '</select>' +
              '<input id="esir-unite-adet" type="number" min="1" max="' + (e.bos||0) + '" value="1" style="width:80px;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:3px;font-size:12px">' +
              '<button class="btn" onclick="esirUniteyeCevir()" style="padding:6px 14px;font-size:12px">✓ Cevir</button>' +
            '</div>' +
            '<div id="esir-sonuc" style="margin-top:6px;font-size:11px;color:#888"></div>' +
          '</div>';
      }
    } else {
      html += '<div style="color:#666;font-size:11px;padding:8px;background:#1a1a1a;border-radius:4px">Bosta esir yok (tumu isci/unite atanmis).</div>';
    }

    wrap.innerHTML = html;
  } catch(err) {
    wrap.innerHTML = '<span style="color:#e74c3c">Sunucu hatasi: ' + err.message + '</span>';
  }
}

// v1.14.0.82: Esir -> Isci cevirme (PUT /api/game/workers esir_X artir)
async function esirIsciyeCevir() {
  const tip = document.getElementById('esir-isci-tip').value;
  const adet = parseInt(document.getElementById('esir-isci-adet').value) || 0;
  const sonuc = document.getElementById('esir-isci-sonuc');
  if (!tip || adet <= 0) { sonuc.textContent = 'Tip ve adet sec'; return; }
  sonuc.textContent = 'Isleniyor...';
  sonuc.style.color = '#888';
  try {
    const token = getToken();
    // v1.14.1.26 FIX: Normal iscileri BACKEND'TEN direkt oku (STATE.population
    // undefined olabiliyordu → tum iscileri 0 yapiyordu, BUYUK VERI KAYBI bug'i).
    // Artik /api/game/workers'tan mevcut degerleri al, sadece esir alanini guncelle.
    const wR = await fetch(API_BASE + '/api/game/workers?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!wR.ok) { sonuc.textContent = '✗ Isci verisi alinamadi'; sonuc.style.color = '#e74c3c'; return; }
    const w = await wR.json();
    // Normal isci'ler — mevcut degerleri koru
    const normalIsci = {
      oduncu:  parseInt(w.oduncu)  || 0,
      madenci: parseInt(w.madenci) || 0,
      ciftci:  parseInt(w.ciftci)  || 0,
      balikci: parseInt(w.balikci) || 0,
      tuccar:  parseInt(w.tuccar)  || 0
    };
    // Mevcut esir dagilimi — mevcut degerler + seciilene adet ekle
    const yeniEsir = {
      esir_oduncu:  parseInt(w.esir_oduncu)  || 0,
      esir_madenci: parseInt(w.esir_madenci) || 0,
      esir_ciftci:  parseInt(w.esir_ciftci)  || 0,
      esir_balikci: parseInt(w.esir_balikci) || 0,
      esir_tuccar:  parseInt(w.esir_tuccar)  || 0
    };
    yeniEsir['esir_' + tip] += adet;
    // PUT /api/game/workers
    const body = Object.assign({}, normalIsci, yeniEsir);
    const r = await fetch(API_BASE + '/api/game/workers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) { sonuc.textContent = '✗ ' + (d.error || 'Hata'); sonuc.style.color = '#e74c3c'; return; }
    sonuc.textContent = '✓ ' + adet + ' esir ' + tip + ' olarak atandi';
    sonuc.style.color = '#2ecc71';
    loadEsirler();
    if (typeof loadGameData === 'function') loadGameData();
  } catch(err) {
    sonuc.textContent = '✗ Sunucu hatasi: ' + err.message;
    sonuc.style.color = '#e74c3c';
  }
}

async function esirUniteyeCevir() {
  const unite = document.getElementById('esir-unite-sec').value;
  const adet = parseInt(document.getElementById('esir-unite-adet').value) || 0;
  const sonuc = document.getElementById('esir-sonuc');
  if (!unite || adet <= 0) { sonuc.textContent = 'Unite ve adet sec'; return; }
  sonuc.textContent = 'Isleniyor...';
  sonuc.style.color = '#888';
  try {
    const token = getToken();
    const r = await fetch(API_BASE + '/api/game/esir/uniteye-cevir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ adet, unite_id: unite })
    });
    const d = await r.json();
    if (!r.ok) { sonuc.textContent = '✗ ' + (d.error || 'Hata'); sonuc.style.color = '#e74c3c'; return; }
    sonuc.textContent = '✓ ' + (d.mesaj || adet + ' ' + unite + ' olusturuldu');
    sonuc.style.color = '#2ecc71';
    loadEsirler();
    if (typeof loadGameData === 'function') loadGameData();
  } catch(e) {
    sonuc.textContent = '✗ Sunucu hatasi';
    sonuc.style.color = '#e74c3c';
  }
}
