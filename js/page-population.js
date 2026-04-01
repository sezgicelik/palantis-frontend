/* ══════════════════════════════════
   NUFUS & ISCILER SAYFASI
   Extracted from index.html
══════════════════════════════════ */

// Isci tipi -> bina eslesmesi
const ISCI_BINA_MAP = {
  wood:     { binaId: 'oduncu',       kapasite: 40, ad: 'Oduncu Kampı' },
  stone:    { binaId: 'tas_ocagi',    kapasite: 30, ad: 'Taş Ocağı' },
  iron:     { binaId: 'demir_madeni', kapasite: 50, ad: 'Demir Madeni' },
  farm:     { binaId: 'tarla',        kapasite: 50, ad: 'Tarla' },
  fish:     { binaId: 'balikci',      kapasite: 20, ad: 'Balıkçı Limanı' },
  // merchant: Market binasi eklenince baglanacak — simdilik serbest
};

function getWorkerCapacity(type) {
  const map = ISCI_BINA_MAP[type];
  if (!map) return Infinity; // Tuccar vb. serbest
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
  updatePopulationUI();
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
        tasci: population.stone || 0,
        madenci: population.iron || 0,
        ciftci: population.farm || 0,
        balikci: population.fish || 0,
        tuccar: population.merchant || 0
      })
    });
    if (resp.ok) { toast('Isci dagilimi kaydedildi!'); }
    else { const err = await resp.json(); toast(err.error || 'Hata'); }
  } catch(e) { toast('Sunucu hatasi'); }
}

/* ── AT/KURT KESİM SİSTEMİ ── */
let KESIM_MIKTAR = 0;

function kesimInit() {
  // Taraf bazli aciklama ve label
  const taraf = OYUNCU?.taraf || 'iyi';
  const isLight = taraf === 'iyi';
  const hayvanAdi = isLight ? 'At' : 'Kurt';
  const hayvanIcon = isLight ? '🐴' : '🐺';

  const lbl = document.getElementById('kesim-hayvan-lbl');
  if (lbl) lbl.textContent = hayvanIcon + ' ' + hayvanAdi.toUpperCase();

  const aciklama = document.getElementById('kesim-taraf-aciklama');
  if (aciklama) aciklama.textContent = isLight
    ? '🐴 Aydınlık taraf at keser. Her at = 50 çiğ et.'
    : '🐺 Karanlık taraf kurt keser. Her kurt = 50 çiğ et.';

  // Mevcut hayvan ve et sayisi
  const hayvanSayisi = isLight ? (EXTRA_RES.at || 0) : (EXTRA_RES.kurt || 0);
  setText('kesim-hayvan', hayvanSayisi);
  setText('kesim-cig-et', RES.cig_et || 0);
  KESIM_MIKTAR = 0;
  setText('kesim-miktar', 0);
  setText('kesim-miktar-preview', 0);
  setText('kesim-et-preview', 0);
}

function kesimAdjust(delta) {
  const taraf = OYUNCU?.taraf || 'iyi';
  const isLight = taraf === 'iyi';
  const max = isLight ? (EXTRA_RES.at || 0) : (EXTRA_RES.kurt || 0);
  KESIM_MIKTAR = Math.max(0, Math.min(KESIM_MIKTAR + delta, max));
  setText('kesim-miktar', KESIM_MIKTAR);
  setText('kesim-miktar-preview', KESIM_MIKTAR);
  setText('kesim-et-preview', KESIM_MIKTAR * 50);
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
      body: JSON.stringify({ miktar: KESIM_MIKTAR })
    });
    const data = await resp.json();
    if (!resp.ok) {
      document.getElementById('kesim-sonuc').textContent = '⚠️ ' + (data.error || 'Hata');
      return;
    }
    const uretilen = KESIM_MIKTAR * 50;
    document.getElementById('kesim-sonuc').textContent =
      '✅ ' + KESIM_MIKTAR + ' hayvan kesildi → ' + uretilen + ' çiğ et üretildi!';
    document.getElementById('kesim-sonuc').style.color = '#2ecc71';
    // Kaynaklari guncelle
    if (data.extra_res) {
      EXTRA_RES.at = data.extra_res.at || 0;
      EXTRA_RES.kurt = data.extra_res.kurt || 0;
    }
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

document.addEventListener('DOMContentLoaded', () => {
  updatePopulationUI();
  loadPisirme();
  updatePisirmeUI();
  kesimInit();
});
