/* ══════════════════════════════════
   GAME DATA — Oyuncu, Irk, Nüfus, Çağ, Backend Yükleme
   Extracted from index.html
══════════════════════════════════ */

let OYUNCU = {
  kral: null, sehir: null, irk: null, taraf: null, cag: 1
};
let selectedSide = 'iyi';
let selectedIrk = null;

function selectSide(side, el) {
  selectedSide = side;
  selectedIrk = null;
  document.querySelectorAll('.side-btn').forEach(b => {
    b.style.background = '#0d0d0d';
    b.style.borderColor = '#2a2a2a';
    b.style.color = '#666';
  });
  el.style.background = 'rgba(241,196,15,.08)';
  el.style.borderColor = 'var(--race-color)';
  el.style.color = 'var(--race-color)';
  renderIrkGrid();
}

function renderIrkGrid() {
  const grid = document.getElementById('irk-grid');
  if (!grid) return;
  const irklar = IRKLAR[selectedSide] || [];
  grid.innerHTML = '';
  irklar.forEach(irk => {
    const isOn = selectedIrk === irk.id;
    const div = document.createElement('div');
    div.style.cssText = 'background:#0d0d0d;border:1px solid ' + (isOn ? irk.color : '#2a2a2a') + ';border-radius:10px;padding:14px;cursor:pointer;transition:.2s;box-shadow:' + (isOn ? '0 0 14px ' + irk.color + '44' : 'none');
    div.onclick = () => selectIrk(irk.id);
    div.innerHTML = '<div style="font-size:22px;margin-bottom:6px">' + irk.icon + '</div>'
      + '<div style="font-family:Cinzel,serif;font-size:12px;color:' + irk.color + ';font-weight:700;margin-bottom:4px">' + irk.name + '</div>'
      + '<div style="font-size:11px;color:#555;margin-bottom:8px;line-height:1.5">' + irk.desc + '</div>'
      + irk.bonuslar.map(b => '<div style="font-size:10px;color:#2ecc71;margin:1px 0">' + b + '</div>').join('');
    grid.appendChild(div);
  });
}

function selectIrk(id) {
  selectedIrk = id;
  renderIrkGrid();
}

function startGame() {
  const kral = document.getElementById('inp-kral')?.value.trim();
  const sehir = document.getElementById('inp-sehir')?.value.trim();
  if (!kral) { toast('Kral adi gir!'); return; }
  if (!sehir) { toast('Sehir adi gir!'); return; }
  if (!selectedIrk) { toast('Irk sec!'); return; }

  const irkData = [...IRKLAR.iyi, ...IRKLAR.kotu].find(i => i.id === selectedIrk);
  OYUNCU = { kral, sehir, irk: selectedIrk, irkData, taraf: selectedSide, cag: 1 };

  if (irkData) document.documentElement.style.setProperty('--race-color', irkData.color);

  document.getElementById('setup-wrap').style.display = 'none';
  document.getElementById('main-home').style.display = 'block';
  const mw = document.getElementById('main-welcome');
  if (mw) mw.textContent = kral || '\u2014';
  const sl = document.getElementById('home-sehir-lbl');
  if (sl) sl.textContent = sehir || '\u2014';
  const il = document.getElementById('home-irk-lbl');
  if (il) il.textContent = irkData ? irkData.name : (selectedIrk || '\u2014');
  const ii = document.getElementById('home-irk-icon');
  if (ii) ii.textContent = irkData?.icon || '\ud83d\udc51';
  document.getElementById('home-kral').textContent = kral;
  document.getElementById('home-sehir').textContent = sehir;
  document.getElementById('home-irk').textContent = irkData ? irkData.icon + ' ' + irkData.name : selectedIrk;

  const sidebarName = document.getElementById('sidebar-kral');
  if (sidebarName) sidebarName.textContent = kral;

  const sIrk = document.getElementById('sidebar-irk');
  if (sIrk && irkData) sIrk.textContent = irkData.icon + ' ' + irkData.name;
  toast(`${kral} kralligi kuruldu! ${irkData?.icon||''} ${irkData?.name||''} irkisin.`);
}

/* -- NUFUS -- */
let population = {
  total: 10, free: 10, max: 1000,
  wood: 0, stone: 0, iron: 0,
  farm: 0, fish: 0, hunter: 0, merchant: 0,
  asker: 0, worshipper: 0, unite: 0,
  nufus_siniri: 1000, nufus_toplam: 10
};

const QUEUE=[];
let activeCat='all';
let modalId=null;

/* -- Backend kaynaklar ve HUD yukle -- */
async function loadGameData() {
  const token = getToken();
  if (!token) return;
  try {
    const [resRes, prodRes, workRes, alanRes, takvimRes] = await Promise.all([
      fetch(API_BASE + '/api/game/resources', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_BASE + '/api/game/production', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_BASE + '/api/game/workers',    { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_BASE + '/api/game/alan',       { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_BASE + '/api/takvim'),
    ]);
    const res  = resRes.ok  ? await resRes.json()  : {};
    const prodData = prodRes.ok ? await prodRes.json() : {};
    const prod = prodData.toplam || prodData;
    const work = workRes.ok ? await workRes.json() : {};
    const alanData = alanRes.ok ? await alanRes.json() : {};
    const takvimData = takvimRes.ok ? await takvimRes.json() : null;

    // Arazi verisi guncelle (F5 persist)
    if (alanData.alan !== undefined) {
      landState.land = parseInt(alanData.alan) || 100;
      const landEl = document.getElementById('hud-land');
      if (landEl) landEl.textContent = landState.land;
    }

    // Palantis takvim HUD
    if (takvimData) {
      const takvimEl = document.getElementById('hud-takvim');
      if (takvimEl) takvimEl.textContent = takvimData.formatted || (takvimData.palantis_gun + '/' + takvimData.palantis_ay + '/' + takvimData.palantis_yil);
    }

    // Backend'den gelen kaynaklari RES objesine yaz
    if (res.odun !== undefined) RES.odun = parseInt(res.odun) || 0;
    if (res.tas !== undefined) RES.tas = parseInt(res.tas) || 0;
    if (res.metal !== undefined) RES.metal = parseInt(res.metal) || 0;
    if (res.altin !== undefined) RES.altin = parseInt(res.altin) || 0;
    if (res.bugday !== undefined) RES.bugday = parseInt(res.bugday) || 0;
    if (res.balik !== undefined) RES.balik = parseInt(res.balik) || 0;
    if (res.kereste !== undefined) RES.kereste = parseInt(res.kereste) || 0;
    if (res.islenmis !== undefined) RES.islenmis = parseInt(res.islenmis) || 0;
    if (res.ekmek !== undefined) RES.ekmek = parseInt(res.ekmek) || 0;
    if (res.pismis !== undefined) RES.pismis = parseInt(res.pismis) || 0;
    if (res.cig_et !== undefined) RES.cig_et = parseInt(res.cig_et) || 0;
    if (res.pismis_et !== undefined) RES.pismis_et = parseInt(res.pismis_et) || 0;
    // Mana degerlerini yukle
    if (res.mana_beyaz !== undefined) RES.mana_beyaz = parseFloat(res.mana_beyaz) || 0;
    if (res.mana_kirmizi !== undefined) RES.mana_kirmizi = parseFloat(res.mana_kirmizi) || 0;
    if (res.mana_mavi !== undefined) RES.mana_mavi = parseFloat(res.mana_mavi) || 0;
    if (res.mana_yesil !== undefined) RES.mana_yesil = parseFloat(res.mana_yesil) || 0;

    // HUD Ham kaynaklar (miktar + rate)
    setText('hud-w',   RES.odun);
    if(typeof setRate==='function') setRate('hud-wg', prod.odun ?? 0); else setText('hud-wg', prod.odun ?? 0);
    setText('hud-m',   RES.metal);
    if(typeof setRate==='function') setRate('hud-mg', prod.metal ?? 0); else setText('hud-mg', prod.metal ?? 0);
    setText('hud-bu',  RES.bugday);
    if(typeof setRate==='function') setRate('hud-bug', prod.bugday ?? 0); else setText('hud-bug', prod.bugday ?? 0);
    setText('hud-ba',  RES.balik);
    if(typeof setRate==='function') setRate('hud-bag', prod.balik ?? 0); else setText('hud-bag', prod.balik ?? 0);
    setText('hud-t',   RES.tas);
    if(typeof setRate==='function') setRate('hud-tg', prod.tas ?? 0); else setText('hud-tg', prod.tas ?? 0);
    setText('hud-g',   RES.altin);
    if(typeof setRate==='function') setRate('hud-gg', prod.altin ?? 0); else setText('hud-gg', prod.altin ?? 0);

    // Islenmis kaynaklar HUD
    setText('hud-ke',  RES.kereste);
    setText('hud-is',  RES.islenmis);
    setText('hud-ek',  RES.ekmek);
    setText('hud-pb',  RES.pismis);
    setText('hud-ce',  RES.cig_et);
    setText('hud-pe',  RES.pismis_et);

    // Mana HUD
    setText('hud-mana-beyaz',   Math.floor(RES.mana_beyaz || 0));
    setText('hud-mana-kirmizi', Math.floor(RES.mana_kirmizi || 0));
    setText('hud-mana-mavi',    Math.floor(RES.mana_mavi || 0));
    setText('hud-mana-yesil',   Math.floor(RES.mana_yesil || 0));

    // Nufus & Isciler
    if (work) {
      if (work.total !== undefined) population.total = parseInt(work.total) || 10;
      population.wood     = parseInt(work.oduncu)  || 0;
      population.stone    = parseInt(work.tasci)   || 0;
      population.iron     = parseInt(work.madenci) || 0;
      population.farm     = parseInt(work.ciftci)  || 0;
      population.fish     = parseInt(work.balikci) || 0;
      population.merchant = parseInt(work.tuccar)  || 0;
      population.asker    = parseInt(work.asker)   || 0;
      population.worshipper_beyaz   = parseInt(work.worshipper_beyaz)   || 0;
      population.worshipper_kirmizi = parseInt(work.worshipper_kirmizi) || 0;
      population.worshipper_mavi    = parseInt(work.worshipper_mavi)    || 0;
      population.worshipper_yesil   = parseInt(work.worshipper_yesil)   || 0;
      population.worshipper = population.worshipper_beyaz + population.worshipper_kirmizi
                            + population.worshipper_mavi + population.worshipper_yesil;
      population.unite         = parseInt(work.unite_toplam)  || 0;
      population.nufus_siniri  = parseInt(work.nufus_siniri)  || population.total;
      population.nufus_toplam  = parseInt(work.nufus_toplam)  || population.total;
      const atanan = population.wood + population.stone + population.iron + population.farm
                   + population.fish + population.hunter + population.merchant
                   + population.asker + population.worshipper;
      population.free = Math.max(0, population.total - atanan);
      updatePopulationUI();
    }

    // Isci dagilimi guncelle
    const isciMap = { oduncu:'w-oduncu', tasci:'w-tasci', madenci:'w-madenci', ciftci:'w-ciftci', balikci:'w-balikci', tuccar:'w-tuccar' };
    for (const [key, elId] of Object.entries(isciMap)) {
      const inp = document.getElementById(elId);
      if (inp && work[key] !== undefined) inp.value = work[key];
      const gainEl = document.getElementById('gain-' + elId.replace('w-',''));
      if (gainEl) gainEl.textContent = '+' + (prod[key === 'oduncu' ? 'odun' : key === 'tasci' ? 'tas' : key === 'madenci' ? 'metal' : key === 'ciftci' ? 'bugday' : key === 'balikci' ? 'balik' : 'altin'] || 0) + '/s';
    }

    // Asker sayisini worker tablosundan al
    if (work.asker !== undefined) {
      ASKER_SAYISI = parseInt(work.asker) || 0;
    }

    // Sayfa-ozel fonksiyonlar — sadece tanimli ise cagir
    if(typeof loadPisirme === 'function') await loadPisirme();
    if(typeof loadBuildingsFromBackend === 'function') await loadBuildingsFromBackend();
    if(typeof loadTrainingQueue === 'function') await loadTrainingQueue();
    if(typeof loadArmyPool === 'function') await loadArmyPool();

  } catch(e) {
    console.error('[loadGameData]', e);
  }
}

/* -- Binalari backend'den yukle -- */
async function loadBuildingsFromBackend() {
  const token = getToken();
  if (!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/game/buildings', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) return;
    const buildings = await resp.json();
    let usedArea = 0;
    for (const [binaId, data] of Object.entries(buildings)) {
      if (BLDGS[binaId]) {
        if (data.inQueue && data.queueEnd) {
          const endTime = new Date(data.queueEnd).getTime();
          if (Date.now() >= endTime) {
            BLDGS[binaId].lv = data.seviye + 1;
            completeBuildingOnBackend(binaId);
          } else {
            BLDGS[binaId].lv = data.seviye;
            if (!QUEUE.find(q => q.id === binaId)) {
              const dur = 3600 * 1000;
              QUEUE.push({id: binaId, targetLv: data.seviye + 1, start: endTime - dur, dur, kalanInsa: data.kalanInsa || 0});
            }
          }
        } else {
          BLDGS[binaId].lv = data.seviye;
        }
        usedArea += BLDGS[binaId].lv * binaAlanFE(binaId);
      }
    }
    setText('hud-used', usedArea);
    if (document.getElementById('city')?.classList.contains('active-panel')) {
      renderGrid(); renderQueue();
    }
  } catch(e) {
    console.error('[loadBuildings]', e);
  }
}

/* -- Backend'de bina seviyesini tamamla -- */
async function completeBuildingOnBackend(binaId) {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(API_BASE + '/api/game/buildings/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ binaId })
    });
  } catch(e) { console.error('[completeBuild]', e); }
}

/* -- Bina Birlestirme -- */
async function mergeBina(target) {
  const kural = BINA_BIRLESTIRME_FE[target];
  if (!kural) return;
  const srcAdet = BLDGS[kural.source]?.lv || 0;
  if (srcAdet < kural.miktar) {
    toast(`${kural.miktar} adet ${kural.source} gerekli (mevcut: ${srcAdet})`);
    return;
  }
  const token = getToken();
  if (!token) { toast('Oturum bulunamadi!'); return; }
  try {
    const resp = await fetch(API_BASE + '/api/game/buildings/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ target })
    });
    const data = await resp.json();
    if (!resp.ok) { toast(data.error || 'Birlestirme basarisiz'); return; }
    if (data.buildings) {
      Object.entries(data.buildings).forEach(([id, adet]) => {
        if (BLDGS[id]) BLDGS[id].lv = adet;
      });
    }
    const usedArea = Object.values(BLDGS).reduce((s,b)=>s+b.lv*binaAlanFE(b.id),0);
    setText('hud-used', usedArea);
    renderGrid();
    toast(`${kural.miktar} ${kural.source} -> 1 ${target} birlestirildi!`);
  } catch(e) {
    toast('Baglanti hatasi');
  }
}

/* -- Oyuncu verilerini uygula -- */
function obApplyPlayer(p) {
  OYUNCU = { kral: p.kral, sehir: p.sehir, irk: p.irk, taraf: p.taraf, cag: p.cag || 1 };
  const irkData = findIrk(p.irk);
  OYUNCU.irkData = irkData;

  applyTheme(p.irk);

  if (irkData) document.documentElement.style.setProperty('--race-color', irkData.color);
  const set = (id, v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  set('home-kral', p.kral);
  set('home-sehir', p.sehir);
  set('home-irk', irkData ? irkData.icon + ' ' + irkData.name : p.irk);
  set('home-cag', romanCag(p.cag || 1) + '. Cag');
  set('sidebar-kral', p.kral);
  set('sidebar-irk', irkData ? irkData.icon + ' ' + irkData.name : p.irk);
  set('main-welcome', 'Hos geldin, ' + p.kral + '!');

  if ((p.cag || 1) > 1) {
    const el = document.getElementById('cag1-uyari');
    if (el) el.style.display = 'none';
  }
}

/* -- Logout -- */
function logoutGame() {
  if (!confirm('Oyundan cikmak istedigine emin misin?')) return;
  clearToken();
  OYUNCU = { kral: null, sehir: null, irk: null, taraf: null, cag: 1 };
  QUEUE.length = 0;
  Object.values(BLDGS).forEach(b => b.lv = 0);
  population = { total: 10, free: 10, max: 1000, wood:0, stone:0, iron:0,
    farm:0, fish:0, hunter:0, merchant:0, asker:0, worshipper:0, unite:0,
    nufus_siniri:1000, nufus_toplam:10 };
  window.location.href = 'index.html';
}

/* -- Cag Kisitlamalari -- */
function checkCagRestrictions(action) {
  if (!OYUNCU || OYUNCU.cag > 1) return true;
  const restricted = ['savas', 'guild', 'attack'];
  if (restricted.includes(action)) {
    toast('I. Cagda bu islem yapilamaz! II. Caga gec.');
    return false;
  }
  return true;
}

/* -- Sonraki Cag -- */
function nextCag() {
  if (!OYUNCU) return;
  if (OYUNCU.cag >= 5) { toast('Maksimum cagdasin!'); return; }
  OYUNCU.cag++;
  const roman = ['','I','II','III','IV','V'];
  document.getElementById('cs-age').textContent = roman[OYUNCU.cag] + '. Cag';
  document.getElementById('home-cag').textContent = roman[OYUNCU.cag] + '. Cag';
  const hcl = document.getElementById('home-cag-lbl');
  if (hcl) hcl.textContent = roman[OYUNCU.cag] + '. Cag';
  document.getElementById('sidebar-cag').textContent = roman[OYUNCU.cag] + '. Cag';
  if (OYUNCU.cag > 1) {
    const uyari = document.getElementById('cag1-uyari');
    if (uyari) uyari.style.display = 'none';
  }
  toast(`${roman[OYUNCU.cag]}. Caga gecildi! Yeni binalar ve uniteler acildi.`);
  population.max = 1500 + (OYUNCU.cag - 1) * 500;
  updatePopulationUI();
}

/* -- Ordu Gelistirme Degiskenleri -- */
let ASKERI_GEL_SEV = 0;
let MAAS_GEL_SEV = 0;
let UNIT_GEL = {};

/* Gercek maliyet hesapla (askeri gelistirme indirimi) */
function realCost(baseCost) {
  const c = {...baseCost};
  if (c.altin && ASKERI_GEL_SEV > 0) {
    c.altin = Math.floor(c.altin * (1 - ASKERI_GEL_SEV * 0.01));
  }
  return c;
}
/* Gercek maas hesapla */
function realMaas(baseMaas) {
  return Math.floor(baseMaas * (1 - MAAS_GEL_SEV * 0.02));
}
/* Gercek ATK/DEF hesapla */
function realAtk(unitId) {
  const u = UNITS[unitId]; if (!u) return 0;
  const gel = UNIT_GEL[unitId] || {atk:0, def:0};
  return u.baseAtk + (gel.atk * u.atkGelArtis);
}
function realDef(unitId) {
  const u = UNITS[unitId]; if (!u) return 0;
  const gel = UNIT_GEL[unitId] || {atk:0, def:0};
  return u.baseDef + (gel.def * u.defGelArtis);
}

/* -- Asker Yonetimi Degiskenleri -- */
let SM_MIKTAR = 0;
let ASKER_SAYISI = 0;

/* -- Ordu Yonetimi Degiskenleri -- */
let ORDULAR = [];
let ORDU_MIKTAR = 1;

/* -- Worshippers -- */
let WORSHIPPERS = { count: 0, max: 2000, manaPerHour: 0 };

/* -- Formation State -- */
let FORMATION_STATE = [[], [], [], []];
let FORMATION_ARMY_ID = null;
let PICKING_SAF = null;
let PICKING_SLOT = null;
