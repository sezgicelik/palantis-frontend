/* ═══════════════════════════════════════════════════════════════════════
   nufus-render.js  (v1.13.35)
   TEK DOGRULUK KAYNAGI: /api/game/nufus
   Hicbir sayfa artik kendi matematigini yapmaz. Buradan ne gelirse o.
═══════════════════════════════════════════════════════════════════════ */

// Global cache — son fetch sonucu
window.NUFUS_DATA = null;

/* ----- Fetch ----- */
async function loadNufus() {
  const token = (typeof getToken === 'function') ? getToken() : localStorage.getItem('palantis_token');
  if (!token || typeof API_BASE === 'undefined') return null;
  try {
    const r = await fetch(API_BASE + '/api/game/nufus', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) return null;
    const d = await r.json();
    window.NUFUS_DATA = d;
    renderNufus(d);
    return d;
  } catch (e) {
    console.warn('[nufus] fetch basarisiz', e);
    return null;
  }
}

/* ----- Tek render fonksiyonu — tum UI alanlarini gunceller ----- */
function renderNufus(d) {
  if (!d || !d.ok) return;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };

  // ── HUD ustteki "Nufus X/Y" box ──
  const box = document.getElementById('hud-nufus-box');
  if (box) {
    box.textContent = d.nufus.mevcut + '/' + d.nufus.sinir;
    box.style.color = d.nufus.mevcut > d.nufus.sinir ? '#e74c3c' : '';
  }
  set('hud-nufus',        d.isci.toplam + d.asker.ham + d.worshipper.toplam); // atanan
  set('hud-nufus-sinir',  d.koylu.total);

  // ── Nufus & İşçi paneli (population.html veya HUD detay) ──
  set('pop-total',  d.nufus.mevcut);
  set('pop-free',   d.koylu.bos);
  set('pop-isci',   d.isci.toplam);
  set('pop-asker',  d.asker.ham);
  set('pop-worshipper', d.worshipper.toplam);
  set('pop-unite',  d.unite.toplam);
  set('pop-max',    d.nufus.sinir);

  // ── Sidebar / inline nufus bar (Köylü / İşçi / Asker+Tapinak / Unite) ──
  const koylu  = d.koylu.bos;
  const isci   = d.isci.toplam;
  const sabit  = d.asker.ham + d.worshipper.toplam;
  const unite  = d.unite.toplam;
  set('bar-koylu-lbl', koylu);
  set('bar-isci-lbl',  isci);
  set('bar-sabit-lbl', sabit);
  set('bar-unite-lbl', unite);

  // Bar yuzdeleri
  const top = Math.max(1, d.nufus.mevcut || 1);
  const pct = v => (v / top * 100).toFixed(1) + '%';
  ['bar-koylu','bar-isci','bar-sabit','bar-unite'].forEach((id, i) => {
    const el = document.getElementById(id);
    const vals = [koylu, isci, sabit, unite];
    if (el) el.style.width = pct(vals[i]);
  });

  // ── İşçi sayilari (oduncu, madenci, vs) ──
  set('w-wood',  d.isci.oduncu);
  set('w-iron',  d.isci.madenci);
  set('w-farm',  d.isci.ciftci);
  set('w-fish',  d.isci.balikci);
  set('w-merch', d.isci.tuccar);
  set('w-katip', d.isci.katip || 0);  // v1.14.2.0 (FAZ X.4): Katip yeni isci tipi

  // ── Asker sayfasi (army.html) — ham asker ve bos koylu ──
  set('sm-asker', d.asker.ham);
  set('sm-koylu', d.koylu.bos);

  // ── Population eski obje ile uyumluluk (geciste) ──
  if (typeof population !== 'undefined') {
    population.total         = d.koylu.total;
    population.free          = d.koylu.bos;
    population.wood          = d.isci.oduncu;
    population.iron          = d.isci.madenci;
    population.farm          = d.isci.ciftci;
    population.fish          = d.isci.balikci;
    population.merchant      = d.isci.tuccar;
    population.katip         = d.isci.katip || 0;  // v1.14.2.0 (FAZ X.4)
    population.asker         = d.asker.ham;
    population.worshipper_beyaz   = d.worshipper.beyaz;
    population.worshipper_kirmizi = d.worshipper.kirmizi;
    population.worshipper_mavi    = d.worshipper.mavi;
    population.worshipper_yesil   = d.worshipper.yesil;
    population.worshipper    = d.worshipper.toplam;
    population.unite         = d.unite.toplam;
    population.unite_havuz   = d.unite.havuz;
    population.unite_orduda  = d.unite.orduda;
    population.nufus_toplam  = d.nufus.mevcut;
    population.nufus_siniri  = d.nufus.sinir;
    population.doyma_yuzde   = d.nufus.doyma_yuzde;
  }

  // ── Global ASKER_SAYISI (army.html icin) ──
  if (typeof ASKER_SAYISI !== 'undefined') {
    window.ASKER_SAYISI = d.asker.ham;
  }
}

/* ----- Otomatik polling: 60 saniyede bir ----- */
(function autoPoll() {
  if (typeof window === 'undefined') return;
  // Sayfa yuklendikten 1 sn sonra ilk fetch, sonra her 60 sn
  setTimeout(() => { loadNufus(); }, 1000);
  setInterval(() => { loadNufus(); }, 60000);
})();

// Disariya ac
window.loadNufus   = loadNufus;
window.renderNufus = renderNufus;
