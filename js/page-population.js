/* ══════════════════════════════════
   NUFUS & ISCILER SAYFASI
   Extracted from index.html
══════════════════════════════════ */

// Isci tipi -> bina eslesmesi
// v1.13.15: demir_madeni kaldirildi, madenci serbest
// v1.13.67: wood (oduncu) kapasite kontrolu kaldirildi — backend'de de yok (oduncu serbest ata)
// SADECE ciftci→tarla enforce ediliyor (backend routes/game.js:311)
const ISCI_BINA_MAP = {
  // wood: bina kapasitesi YOK — oduncu serbest ata
  // iron: bina kapasitesi YOK (v1.12.0'da demir_madeni kaldirildi) — madenci serbest ata
  farm:     { binaId: 'tarla',        kapasite: 50, ad: 'Tarla' },
  // fish: backend'de enforce edilmiyor — serbest ata (HUD'de bilgi gosterilmeye devam edilir)
  // merchant: Pazar binasi eklenince baglanacak — simdilik serbest
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
const VERGI_MORAL_TABLO = {0:0, 1:-1, 2:-3, 3:-5, 4:-10, 5:-18, 6:-28, 7:-40, 8:-55, 9:-72, 10:-90};
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
  // Isci/Limit
  const isciLimitEl = document.getElementById('pop-isci-limit');
  if (isciLimitEl) {
    const isci = (population.wood||0)+(population.iron||0)+(population.farm||0)+(population.fish||0)+(population.merchant||0);
    const cag = OYUNCU?.cag || 1;
    const CAG_ISCI_LIMIT = {1:1500, 2:2000, 3:2500, 4:3000, 5:3500};
    isciLimitEl.textContent = `${isci} / ${CAG_ISCI_LIMIT[cag]||200}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updatePopulationUI();
  loadPisirme();
  updatePisirmeUI();
  kesimInit();
  vergiYukle();
  setTimeout(bonusEtkileriGuncelle, 2000);
});
