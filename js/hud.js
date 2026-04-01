/* =====================================================
   hud.js — HUD guncelleme fonksiyonlari
   updateTopTimers, setHUD, updatePopulationUI,
   updateCityStats, updateBars, finishBuild
===================================================== */

/* Rate elementine deger + renk class'i ata */
function setRate(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = Number(value) || 0;
  el.textContent = (v >= 0 ? '+' : '') + numFmt(v);
  el.className = 'res-rate ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu');
}

/* =====================================================
   ÜST ŞERİT TIMERLAR (SAAT + HASAT)
===================================================== */
function updateTopTimers(){
  const now = new Date();

  // Saat
  const cNow = document.getElementById('c-now');
  if(cNow) cNow.innerText = now.toLocaleTimeString('tr-TR');

  // Hasada kalan (bir sonraki saat başı)
  const nextHour = new Date(now);
  nextHour.setMinutes(0,0,0);
  nextHour.setHours(now.getHours() + 1);

  const diff = nextHour - now;
  const m = Math.floor(diff/60000);
  const s = Math.floor((diff%60000)/1000);

  const cNext = document.getElementById('c-next');
  if(cNext) cNext.innerText = `${(diff/3600000).toFixed(3)} P.G.`;
}

/* =====================================================
   setHUD — Kaynak verilerini HUD'a yazar
===================================================== */
function setHUD(d){
  // HAM
  setText('hud-w', d.ham.odun);
  setText('hud-wg',d.ham.odun_g);

  setText('hud-m',d.ham.metal);
  setText('hud-mg',d.ham.metal_g);

  setText('hud-bu',d.ham.bugday);
  setText('hud-bug',d.ham.bugday_g);

  setText('hud-ba',d.ham.balik);
  setText('hud-bag',d.ham.balik_g);

  setText('hud-t',d.ham.tas);
  setText('hud-tg',d.ham.tas_g);

  setText('hud-g',d.ham.altin);
  setText('hud-gg',d.ham.altin_g);

  // İŞLENMİŞ
  setText('hud-k',d.islenmis.kereste);
  setText('hud-kg',d.islenmis.kereste_g);

  setText('hud-im',d.islenmis.islenmis_metal);
  setText('hud-img',d.islenmis.islenmis_metal_g);

  setText('hud-e',d.islenmis.ekmek);
  setText('hud-eg',d.islenmis.ekmek_g);

  setText('hud-pb',d.islenmis.pismis_balik);
  setText('hud-pbg',d.islenmis.pismis_balik_g);

  // GENEL
  setText('hud-moral',  d.genel.moral + '%');
  setText('hud-hunger', d.genel.aclik + '%');

  setText('hud-used',  d.genel.kullanilan_alan);
  setText('hud-land',  d.genel.mevcut_alan);
  setText(
    'hud-limit',
    d.genel.cag_limiti === Infinity ? '∞' : d.genel.cag_limiti
  );
}

/* =====================================================
   updatePopulationUI — Nüfus & İşçi panelini günceller
===================================================== */
function updatePopulationUI(){
  const set = (id, v) => { const e=document.getElementById(id); if(e) e.innerText=v; };

  // Nüfus hesabı: Köylü (boşta) + İşçi (atanmış) + Asker+Tapınak (sabit) + Ünite (orduda)
  const isci   = (population.wood||0)+(population.stone||0)+(population.iron||0)+
                 (population.farm||0)+(population.fish||0)+(population.hunter||0)+(population.merchant||0);
  const sabit  = (population.asker||0)+(population.worshipper||0);
  const unite  = population.unite||0;
  const koylu  = Math.max(0, population.free||0);
  const nufus  = population.nufus_toplam || (population.total + unite);
  const sinir  = population.nufus_siniri || population.max || 1000;

  // Nüfus özet (Nüfus & İşçiler sayfası)
  set('pop-total', nufus);
  set('pop-free',  koylu);
  set('pop-max',   sinir);
  set('pop-unite', unite);

  // Şehrim sayfası cs-pop
  set('cs-pop', nufus);

  // HUD nüfus: kullanılan (isci+asker+worshipper) / toplam köylü
  const atananKoylu = isci + sabit;
  set('hud-nufus', atananKoylu);
  set('hud-nufus-sinir', population.total || nufus);
  // Yeni stat-box icin birlesik gosterim
  const nufusBox = document.getElementById('hud-nufus-box');
  if(nufusBox) nufusBox.textContent = atananKoylu + '/' + (population.total || nufus);
  // Ana ekran hızlı stats
  const hn=document.getElementById('hs-nufus'); if(hn) hn.textContent=nufus;

  // Boş köylü senkronu — ordu sayfasındaki sm-koylu aynı değeri göstersin
  try { set('sm-koylu', Math.max(0, koylu - ASKER_SAYISI)); } catch(e) {}

  // Dağılım barı
  const topBar = nufus || 1;
  const pct = v => (v/topBar*100).toFixed(1)+'%';
  ['bar-koylu','bar-isci','bar-sabit','bar-unite'].forEach((id,i)=>{
    const el=document.getElementById(id);
    const vals=[koylu,isci,sabit,unite];
    if(el) el.style.width=pct(vals[i]);
  });
  set('bar-koylu-lbl', koylu);
  set('bar-isci-lbl',  isci);
  set('bar-sabit-lbl', sabit);
  set('bar-unite-lbl', unite);

  // İşçi sayıları
  set('w-wood', population.wood);
  set('w-stone', population.stone);
  set('w-iron', population.iron);
  set('w-farm', population.farm||0);
  set('w-fish', population.fish||0);
  set('w-merchant', population.merchant||0);

  // Saatlik üretim
  set('p-wood',     population.wood * 40);
  set('p-stone',    population.stone * 30);
  set('p-iron',     population.iron * 25);
  set('p-farm',     (population.farm||0) * 50);
  set('p-fish',     (population.fish||0) * 20);
  set('p-merchant', (population.merchant||0) * 15);

  // Bina kapasite gosterimi (sayfa icerisindeki isci satirlarina)
  if(typeof getWorkerCapacity === 'function') {
    const kapTypes = ['wood','stone','iron','farm','fish'];
    kapTypes.forEach(t => {
      const el = document.getElementById('kap-'+t);
      if(!el) return;
      const kap = getWorkerCapacity(t);
      const mevcut = population[t] || 0;
      if(kap === Infinity || kap === 0) {
        el.textContent = kap === 0 ? 'Bina yok!' : '';
        el.style.color = kap === 0 ? '#e74c3c' : '#888';
      } else {
        el.textContent = mevcut + '/' + kap;
        el.style.color = mevcut >= kap ? '#e74c3c' : '#2ecc71';
      }
    });
  }
}

/* =====================================================
   updateCityStats — Şehir istatistiklerini günceller
===================================================== */
function updateCityStats(){
  const active=Object.values(BLDGS).filter(b=>b.lv>0).length;
  const e1=document.getElementById('cs-active');if(e1)e1.innerText=active;
  const e2=document.getElementById('cs-constr');if(e2)e2.innerText=QUEUE.length;
  // HUD alan
  const usedArea=Object.values(BLDGS).reduce((s,b)=>s+b.lv*binaAlanFE(b.id),0);
  setText('hud-used', usedArea);
  // Yeni stat-box alan gosterimi
  const alanBox = document.getElementById('hud-alan-box');
  const landVal = document.getElementById('hud-land')?.textContent || '0';
  if(alanBox) alanBox.textContent = usedArea + '/' + landVal;
  // Sehir Degeri: her binanin deger * adet toplami
  const sehirDegeri = Object.values(BLDGS).reduce((s,b) => s + (b.lv || 0) * (b.deger || 0), 0);
  setText('hud-sehir-deger', sehirDegeri);
  // Ana ekran hızlı stats
  const bEl=document.getElementById('hs-bina'); if(bEl) bEl.textContent=active;
  const aEl=document.getElementById('hs-alan'); if(aEl) aEl.textContent=usedArea+'/'+landVal;
}

/* =====================================================
   updateBars — İnşaat progress barlarını günceller
===================================================== */
function updateBars(){
  [...QUEUE].forEach(q=>{
    const el=Date.now()-q.start;
    const pct=Math.min(100,el/q.dur*100);
    const rem=Math.max(0,Math.ceil((q.dur-el)/1000));
    const bf=document.getElementById(`bfill-${q.id}`);if(bf)bf.style.width=pct+'%';
    const bp=document.getElementById(`bpct-${q.id}`);if(bp)bp.innerText=`%${Math.floor(pct)}`;
    const qf=document.getElementById(`qf-${q.id}`);if(qf)qf.style.width=pct+'%';
    const qt=document.getElementById(`qt-${q.id}`);if(qt)qt.innerText=fmtT(rem);
    if(pct>=100)finishBuild(q);
  });
}

/* =====================================================
   finishBuild — İnşaat tamamlanınca çağrılır
===================================================== */
function finishBuild(q){
  const idx=QUEUE.indexOf(q);if(idx===-1)return;
  const b=BLDGS[q.id];if(b)b.lv=q.targetLv;
  QUEUE.splice(idx,1);

  // Backend'de bina seviyesini güncelle
  completeBuildingOnBackend(q.id);

  // Alan sayacını güncelle (ağırlıklı)
  const usedArea = Object.values(BLDGS).reduce((s,bl)=>s+bl.lv*binaAlanFE(bl.id),0);
  setText('hud-used', usedArea);
  updateCityStats();

  toast(`✅ ${b?.name} inşaatı tamamlandı!`);
  renderGrid();renderQueue();
}
