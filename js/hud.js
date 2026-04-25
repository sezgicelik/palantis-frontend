/* =====================================================
   hud.js — HUD guncelleme fonksiyonlari
   updateTopTimers, setHUD, updatePopulationUI,
   updateCityStats, updateBars, finishBuild
===================================================== */

/* Rate elementine deger + renk class'i ata
   v1.14.0.99: HUD format moduna gore — 'tam' / 'sayi-kisa' (rate kisa) / 'kaynak-kisa' (rate tam) */
function setRate(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = Number(value) || 0;
  const sign = v >= 0 ? '+' : '';
  const mode = (typeof getHudFormat === 'function') ? getHudFormat() : 'kaynak-kisa';
  // sayi-kisa -> rate kisa ("+1,8K"); diger modlarda rate tam ("+1.840")
  if (mode === 'sayi-kisa' && typeof fmtK === 'function') {
    el.textContent = sign + fmtK(v, 1);
  } else {
    el.textContent = sign + numFmt(v);
  }
  el.title = sign + Math.floor(v).toLocaleString('tr-TR') + ' / Palantis Günü';
  el.className = 'res-rate ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu');
}

/* =====================================================
   ÜST ŞERİT TIMERLAR (SAAT + HASAT)
===================================================== */
let _lastCronHour = -1; // son cron tetiklenen saat

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

  // Saat basi veri yenileme (cron backend'de node-cron ile calisir)
  if(now.getMinutes() === 0 && _lastCronHour !== now.getHours()) {
    _lastCronHour = now.getHours();
    if(typeof loadGameData==='function') setTimeout(loadGameData, 5000);
  }

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
  // v1.13.70: Mutluluk artik sehir_morali + bina_moral_bonus gosterimi (eger GPS data var ise)
  const gps = window._GPS_DATA;
  if (gps && gps.mutluluk_toplam !== undefined) {
    // "1500 / 5000 (+250 bina)" formati
    const binaStr = gps.bina_moral_bonus > 0 ? ` +${gps.bina_moral_bonus}` : '';
    setText('hud-sehir-moral', `${gps.mutluluk_toplam} / ${gps.moral_max}${binaStr}`);
    // Tooltip'i gun icinde guncelle (data-tip)
    const el = document.getElementById('hud-sehir-moral');
    if (el && el.parentElement && el.parentElement.parentElement) {
      el.parentElement.parentElement.setAttribute('data-tip',
        `MUTLULUK · GPS %${gps.gps} · Moral ${gps.sehir_morali} + Bina ${gps.bina_moral_bonus}`);
    }
  } else if (d.genel.sehir_morali !== undefined) {
    setText('hud-sehir-moral', d.genel.sehir_morali);
  }
  setText('hud-moral',  d.genel.moral);
  setText('hud-hunger', d.genel.aclik + '%');

  setText('hud-used',  d.genel.kullanilan_alan);
  setText('hud-land',  d.genel.mevcut_alan);
  setText(
    'hud-limit',
    d.genel.cag_limiti === Infinity ? '∞' : d.genel.cag_limiti
  );
}

/* =====================================================
   setGuildHUD — v1.13.2 — Guild satirini HUD'da goster
   Oyuncu guilddeyse: [TAG] | Nufus | Moral | Alan | Mana ozet
===================================================== */
function setGuildHUD(g){
  const row = document.getElementById('hud-guild-row');
  const stats = document.getElementById('hud-guild-stats');
  if (!row || !stats || !g || !g.guild) return;
  row.style.display = '';

  const tag = g.guild.tag || '';
  const isim = g.guild.isim || '';
  const mevcut = g.mevcut_nufus ?? 0;
  const siniri = g.nufus_siniri ?? 0;
  const moral = g.ordu_morali ?? 100;
  const alanT = (g.guild_alan && g.guild_alan.toplam) || 0;
  const alanK = (g.guild_alan && g.guild_alan.kullanilan) || 0;
  const kasa = g.kasa || {};
  const mb = parseFloat(kasa.mana_beyaz)||0, mk = parseFloat(kasa.mana_kirmizi)||0,
        mm = parseFloat(kasa.mana_mavi)||0, my = parseFloat(kasa.mana_yesil)||0;
  const manaToplam = (mb+mk+mm+my).toFixed(0);

  const moralRenk = moral >= 70 ? '#2ecc71' : (moral >= 40 ? '#f39c12' : '#e74c3c');
  const nufusRenk = (siniri > 0 && mevcut/siniri >= 0.95) ? '#e74c3c' : '#d4af37';

  // Kart seklinde 5 ozet kutusu
  stats.innerHTML = `
    <div class="stat-box" data-tip="GUILD" style="cursor:pointer" onclick="location.href='guild.html'">
      <span class="res-icon">🏰</span>
      <div class="res-details"><span class="res-label">${tag||'GUILD'}</span><span class="res-amount" style="font-size:10px">${isim}</span></div>
    </div>
    <div class="stat-box" data-tip="GUILD NUFUS">
      <span class="res-icon">👥</span>
      <div class="res-details"><span class="res-label">G.Nufus</span><span class="res-amount" style="color:${nufusRenk}">${mevcut}/${siniri}</span></div>
    </div>
    <div class="stat-box" data-tip="GUILD ORDU MORAL">
      <span class="res-icon">🎖</span>
      <div class="res-details"><span class="res-label">G.Moral</span><span class="res-amount" style="color:${moralRenk}">${moral}/100</span></div>
    </div>
    <div class="stat-box" data-tip="GUILD ALAN">
      <span class="res-icon">📐</span>
      <div class="res-details"><span class="res-label">G.Alan</span><span class="res-amount">${alanK}/${alanT}</span></div>
    </div>
    <div class="stat-box" data-tip="GUILD MANA (toplam)">
      <span class="res-icon">🔮</span>
      <div class="res-details"><span class="res-label">G.Mana</span><span class="res-amount">${manaToplam}</span></div>
    </div>
  `;
}

/* =====================================================
   updatePopulationUI — Nüfus & İşçi panelini günceller
   v1.13.35: Eger nufus-render.js yuklendiyse ONA devret.
   Aksi durumda eski (yerel hesap) fallback calissin.
===================================================== */
function updatePopulationUI(skipBackendFetch){
  const set = (id, v) => { const e=document.getElementById(id); if(e) e.innerText=v; };

  // v1.13.35: Tek dogruluk kaynagi — nufus-render.js
  // v1.13.68.7: assignWorker sonrasinda skipBackendFetch=true ile cagrilir (local state'i overwrite etmesin diye).
  //             Backend senkronu saveWorkers() basari sonrasi tekrar cagrilir.
  if (typeof window.loadNufus === 'function' && !skipBackendFetch) {
    window.loadNufus(); // backend'den cek, renderNufus icerideki tum UI'i gunceller
    // Asagisi (uretim degerleri, bina kapasite) hala lokal hesap
  }

  // ─────────── ESKI FALLBACK (nufus-render.js yuklenmediyse) ───────────
  // Nüfus hesabı: Köylü (boşta) + İşçi (atanmış) + Asker+Tapınak (sabit) + Ünite (orduda)
  const isci   = (population.wood||0)+(population.iron||0)+
                 (population.farm||0)+(population.fish||0)+(population.merchant||0);
  const sabit  = (population.asker||0)+(population.worshipper||0);
  const unite  = population.unite||0;
  const koylu  = Math.max(0, population.free||0);
  const nufus  = population.nufus_toplam || (population.total + unite);
  const sinir  = population.nufus_siniri || population.max || 1000;

  // Nufus render yuklu degilse eski yerel dagitim devrede
  if (typeof window.renderNufus !== 'function') {
    // Nüfus özet (Nüfus & İşçiler sayfası)
    set('pop-total', nufus);
    set('pop-free',  koylu);
    set('pop-max',   sinir);
    set('pop-unite', unite);

    // HUD nüfus
    const atananKoylu = isci + sabit;
    set('hud-nufus', atananKoylu);
    set('hud-nufus-sinir', population.total || nufus);
    const nufusBox = document.getElementById('hud-nufus-box');
    if(nufusBox) {
      nufusBox.textContent = nufus + '/' + sinir;
      nufusBox.style.color = nufus > sinir ? '#e74c3c' : '';
    }
    try { set('sm-koylu', koylu); } catch(e) {}

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
  }

  // Sehrim sayfasi cs-pop — iki durumda da guncellenir
  set('cs-pop', nufus);
  const hn=document.getElementById('hs-nufus'); if(hn) hn.textContent=nufus;

  // İşçi sayıları
  set('w-wood', population.wood);
  set('w-iron', population.iron);
  set('w-farm', population.farm||0);
  set('w-fish', population.fish||0);
  set('w-merchant', population.merchant||0);
  set('w-katip', population.katip||0);  // v1.14.2.0 (FAZ X.4)

  // Saatlik üretim
  set('p-wood',     population.wood * 40);
  set('p-iron',     population.iron * 25);
  set('p-farm',     (population.farm||0) * 50);
  set('p-fish',     (population.fish||0) * 20);
  set('p-merchant', (population.merchant||0) * 15);

  // Bina kapasite gosterimi (sayfa icerisindeki isci satirlarina)
  if(typeof getWorkerCapacity === 'function') {
    const kapTypes = ['wood','iron','farm','fish'];
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

  // Kesim panelini de guncelle (at/kurt sayisi)
  if(typeof kesimInit === 'function') try { kesimInit(); } catch(e) {}
}

/* =====================================================
   updateCityStats — Şehir istatistiklerini günceller
===================================================== */
function updateCityStats(){
  const active=Object.values(BLDGS).reduce((s,b)=>s+(b.lv||0),0);
  const e1=document.getElementById('cs-active');if(e1)e1.innerText=active;
  const e2=document.getElementById('cs-constr');if(e2)e2.innerText=QUEUE.length;
  // Çağ bilgisi her yerde senkron
  const roman = ['','I','II','III','IV','V'];
  const cag = OYUNCU?.cag || 1;
  const cagStr = roman[cag] + '. Çağ';
  const csAge=document.getElementById('cs-age');if(csAge)csAge.textContent=cagStr;
  const sidebarCag=document.getElementById('sidebar-cag');if(sidebarCag)sidebarCag.textContent=cagStr;
  // HUD alan
  const usedArea=Object.values(BLDGS).reduce((s,b)=>s+b.lv*binaAlanFE(b.id),0);
  // Toplam alan global'den al (loadGameData'da set edilir)
  const toplamAlan = window._palantisToplamAlan || 0;
  const alanBox = document.getElementById('hud-alan-box');
  if(alanBox) alanBox.textContent = usedArea + '/' + toplamAlan;
  // Sehir Degeri: bina degeri + tum unite gucu (ATK+DEF)/2
  const binaDegeri = Object.values(BLDGS).reduce((s,b) => s + (b.lv || 0) * (b.deger || 0), 0);
  const toplamAtk = window._palantisToplamAtk || 0;
  const toplamDef = window._palantisToplamDef || 0;
  const orduDegeri = Math.floor((toplamAtk + toplamDef) / 2);
  const sehirDegeri = binaDegeri + orduDegeri;
  setText('hud-sehir-deger', sehirDegeri); // v1.13.58.1: int ver, setText numFmt formatlar — double format bug fix
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

/* =====================================================
   v1.14.0.76: Kadim Sehir Saldiri HUD Banner
===================================================== */
async function loadKadimHudBanner() {
  const token = (typeof getToken === "function") ? getToken() : localStorage.getItem("palantis_token");
  if (!token) return;
  const box = document.getElementById("hud-ksaldiri-box");
  const pgEl = document.getElementById("hud-ksaldiri-pg");
  const sehirEl = document.getElementById("hud-ksaldiri-sehir");
  if (!box || !pgEl) return;
  try {
    const r = await fetch(API_BASE + "/api/kadim-sehir/?_t=" + Date.now(), {
      headers: { Authorization: "Bearer " + token, "Cache-Control": "no-cache" },
      cache: "no-store"
    });
    if (!r.ok) { box.style.display = "none"; return; }
    const d = await r.json();
    if (!d.ok || !d.sehirler) { box.style.display = "none"; return; }

    const aktifler = d.sehirler.filter(s => s.faz === "yolda" || s.faz === "uyari" || s.faz === "hareket_bekleniyor" || (s.faz === "geri_sayim" && s.kalan_pg != null));
    if (!aktifler.length) { box.style.display = "none"; return; }

    aktifler.sort((a, b) => {
      const ap = a.faz === "yolda" ? -1000 + (a.kalan_pg || 0) : (a.kalan_pg || 999);
      const bp = b.faz === "yolda" ? -1000 + (b.kalan_pg || 0) : (b.kalan_pg || 999);
      return ap - bp;
    });
    const s = aktifler[0];

    let renk, fazIkon;
    if (s.faz === "yolda")                              { renk = "#e74c3c"; fazIkon = "⚔️"; }
    else if (s.faz === "uyari" || s.faz === "hareket_bekleniyor") { renk = "#e67e22"; fazIkon = "⚠️"; }
    else                                                 { renk = "#9b59b6"; fazIkon = "⏳"; }

    pgEl.textContent = s.kalan_pg + " PG";
    pgEl.style.color = renk;
    const sehirAd = s.isim.length > 8 ? s.isim.slice(0,7) + "…" : s.isim;
    const extra = aktifler.length > 1 ? " +" + (aktifler.length - 1) : "";
    sehirEl.textContent = fazIkon + " " + sehirAd + extra;
    box.style.borderLeftColor = renk;
    box.title = "KADİM SALDIRI: " + s.isim + " — " + s.kalan_pg + " PG · Bütçe: " + (s.tahmini_saldiri_altin || 0).toLocaleString("tr-TR") + " altın (tıkla → pazar)";
    box.style.display = "flex";
  } catch (e) {
    box.style.display = "none";
  }
}

// 60 sn de bir yenile
if (typeof window !== "undefined") {
  setInterval(() => { if (typeof loadKadimHudBanner === "function") loadKadimHudBanner(); }, 60000);
}

