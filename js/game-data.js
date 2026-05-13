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
  // v1.13.42.3: ?.value.trim() element yoksa crash ederdi — null-safe
  const kral = (document.getElementById('inp-kral')?.value || '').trim();
  const sehir = (document.getElementById('inp-sehir')?.value || '').trim();
  if (!kral) { toast('Kral adı gir!'); return; }
  if (!sehir) { toast('Şehir adı gir!'); return; }
  if (!selectedIrk) { toast('Irk seç!'); return; }

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
  wood: 0, iron: 0,
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
  // v1.14.0.65: Skeleton UI — data yuklenene kadar body'de data-loaded class YOK
  try { document.body.classList.remove('data-loaded'); } catch(e) {}
  try {
    // v1.13.36: Tum API cagrilari TEK Promise.all'da paralel + cache layer
    // Eskiden guild/gorev SIRALI idi (+1.2sn). Simdi hepsi paralel.
    const authH = { 'Authorization': 'Bearer ' + token };
    const cf = (typeof cachedFetch === 'function') ? cachedFetch : null;

    // Cached yoksa (cache-fetch.js yuklenmediyse) normal fetch fallback
    const fetchJson = async (url) => {
      if (cf) return await cf(API_BASE + url, { headers: authH });
      try { const r = await fetch(API_BASE + url, { headers: authH }); return r.ok ? await r.json() : null; }
      catch(e) { return null; }
    };

    // 14 endpoint paralel (eskiden 10 + 3 sequential = 13)
    // v1.14.0.89: let (const degil) — stale fallback icin reassign edilebilir
    let [
      pData, resRaw, prodRaw, workRaw, alanRaw, takvimRaw,
      armyRaw, kvRaw, tatilRaw, ateskesRaw, gorevRaw, gRaw, maliyetRaw, nufusRaw, gpsRaw
    ] = await Promise.all([
      fetchJson('/api/player/me'),
      fetchJson('/api/game/resources'),
      fetchJson('/api/game/production'),
      fetchJson('/api/game/workers'),
      fetchJson('/api/game/alan'),
      fetchJson('/api/takvim'),
      fetchJson('/api/army/state'),
      fetchJson('/api/kervan/liste'),
      fetchJson('/api/game/tatil'),
      fetchJson('/api/game/ateskes'),
      fetchJson('/api/gorev/liste'),
      fetchJson('/api/guild/benim'),
      fetchJson('/api/game/bina-maliyetler'),
      fetchJson('/api/game/nufus'),
      fetchJson('/api/game/gps'),          // v1.13.70: GPS + bina bonus + mutluluk
    ]);

    // v1.14.0.89: localStorage fallback — fetch fail olursa eski veriyi kullan
    const _lsKey = (k) => '_hud_' + k;
    const _saveLS = (key, data) => { try { if (data) localStorage.setItem(_lsKey(key), JSON.stringify(data)); } catch(e){} };
    const _readLS = (key) => { try { const r = localStorage.getItem(_lsKey(key)); return r ? JSON.parse(r) : null; } catch(e){ return null; } };
    const _withFallback = (key, data) => {
      if (data !== null && data !== undefined) {
        _saveLS(key, data);
        return { data, stale: false };
      }
      const old = _readLS(key);
      return { data: old, stale: !!old };
    };

    // Her fetch'i localStorage fallback ile sarmala
    const _player   = _withFallback('player', pData);
    const _resRaw   = _withFallback('resources', resRaw);
    const _prodRaw  = _withFallback('production', prodRaw);
    const _workRaw  = _withFallback('workers', workRaw);
    const _alanRaw  = _withFallback('alan', alanRaw);
    const _takvimRaw= _withFallback('takvim', takvimRaw);
    const _armyRaw  = _withFallback('army', armyRaw);
    const _kvRaw    = _withFallback('kervan', kvRaw);
    const _nufusRaw = _withFallback('nufus', nufusRaw);
    const _gpsRaw   = _withFallback('gps', gpsRaw);

    // Herhangi biri stale ise bir kez uyari toast
    const staleSayisi = [_player,_resRaw,_prodRaw,_workRaw,_alanRaw,_takvimRaw,_armyRaw,_nufusRaw,_gpsRaw].filter(x => x.stale).length;
    if (staleSayisi >= 2 && typeof showToast === 'function' && !window._hudStaleNotified) {
      showToast('⚠️ Bağlantı yavaş — bazı veriler önceki oturumdan. Birkaç saniye sonra güncellenecek.', 'warning');
      window._hudStaleNotified = true;
      setTimeout(() => { window._hudStaleNotified = false; }, 30000); // 30 sn boyunca spam etme
    }

    // v1.13.70: GPS verisini globale koy (HUD + city page kullanir)
    window._GPS_DATA = _gpsRaw.data || null;

    // Override orijinal degiskenleri fallback'li olanlarla
    pData = _player.data;
    nufusRaw = _nufusRaw.data;
    gpsRaw = _gpsRaw.data;

    // Null guard + downstream degiskenleri (eski isimlerle uyumluluk)
    const res       = _resRaw.data   || {};
    const work      = _workRaw.data  || {};
    // v1.14.1.33: workers global expose — market.html esir_tuccar icin gerekli
    try { window.workersRaw = work; } catch(_){ }
    const alanData  = _alanRaw.data  || {};
    const takvimData= _takvimRaw.data;
    const prodData  = _prodRaw.data  || {};
    const prod      = prodData.toplam || prodData;
    // v1.14.1.22: home-dashboard icin prod global expose — Uretim paneli (`—` bug fix)
    try { window.prod = prod; } catch(_){ }
    const kvData    = _kvRaw.data;
    const tatilResp = { ok: !!tatilRaw,   data: tatilRaw };
    const ateskesResp = { ok: !!ateskesRaw, data: ateskesRaw };
    armyRaw = _armyRaw.data;

    // Player verisi
    let playerGuildId = null;
    try {
      if (pData) {
        savePlayer(pData);
        obApplyPlayer(pData);
        playerGuildId = pData.guild_id;
        // v1.13.69: Sidebar kosullu menuler (premium, guild_binasi)
        if (typeof updateConditionalMenus === 'function') updateConditionalMenus(pData);
      }
    } catch(e) {}

    // Guild HUD
    if (playerGuildId && gRaw) {
      try { if (typeof setGuildHUD === 'function') setGuildHUD(gRaw); } catch(e) {}
    } else {
      const gRow = document.getElementById('hud-guild-row');
      if (gRow) gRow.style.display = 'none';
    }

    // Bina maliyetleri globale yaz (loadBuildingsFromBackend icin cache)
    if (maliyetRaw && maliyetRaw.maliyetler) {
      window._BINA_MALIYETLER = maliyetRaw.maliyetler;
    }

    // Gorev badge
    try {
      if (gorevRaw && gorevRaw.gorevler) {
        const bekleyen = gorevRaw.gorevler.filter(g => g.durum === 'tamamlandi').length;
        const badge = document.getElementById('gorev-badge');
        if (badge) {
          if (bekleyen > 0) { badge.style.display = 'inline'; badge.textContent = bekleyen; }
          else badge.style.display = 'none';
        }
      }
    } catch(e) {}

    // Army state — toplam ATK/DEF (sehir degeri icin)
    try {
      const a = armyRaw || {};
      window._palantisToplamAtk = a.toplam_atk || 0;
      window._palantisToplamDef = a.toplam_def || 0;
      window._palantisReyting = a.reyting || 0;
      window._palantisOrduMorali = a.ordu_morali ?? 0;
      const sehirEssek = parseInt(res.essek) || 0;
      const kervanEssek = (kvData && kvData.kervanlar) ? kvData.kervanlar.reduce((s,k) => s + (k.essek_sayisi || 0), 0) : 0;
      setText('hud-essek', sehirEssek + ' / ' + (sehirEssek + kervanEssek));
      if (typeof updateCityStats === 'function') updateCityStats();
    } catch(e) {}

    // Arazi verisi guncelle
    if (alanData.alan !== undefined) {
      const toplamAlan = parseInt(alanData.alan) || 100;
      const kullanilanAlan = parseInt(alanData.kullanilan_alan) || 0;
      // Moral HUD — iki ayrı moral
      if (alanData.ordu_morali !== undefined) {
        setText('hud-moral', alanData.ordu_morali);
      }
      // v1.13.70.3: Mutluluk = ham moral + bina bonusu (gps endpoint'inden)
      // Onceden sadece alanData.sehir_morali yaziliyordu (ham value). Simdi bileske.
      if (gpsRaw && gpsRaw.mutluluk_toplam !== undefined) {
        const binaStr = gpsRaw.bina_moral_bonus > 0 ? ` +${gpsRaw.bina_moral_bonus}` : '';
        setText('hud-sehir-moral', `${gpsRaw.mutluluk_toplam} / ${gpsRaw.moral_max}${binaStr}`);
        // Tooltip guncelle
        const el = document.getElementById('hud-sehir-moral');
        if (el && el.parentElement && el.parentElement.parentElement) {
          el.parentElement.parentElement.setAttribute('data-tip',
            `MUTLULUK · GPS %${gpsRaw.gps} · Moral ${gpsRaw.sehir_morali} + Bina ${gpsRaw.bina_moral_bonus}`);
        }
      } else if (alanData.sehir_morali !== undefined) {
        // Fallback — GPS endpoint yok ise eski davranis
        setText('hud-sehir-moral', alanData.sehir_morali);
      }
      window._palantisToplamAlan = toplamAlan;
      // landState (arazi sayfasi)
      if (typeof landState !== 'undefined') {
        landState.land = toplamAlan;
        landState.age = OYUNCU?.cag || 1;
        landState.landLimit = typeof ageLandLimit === 'function'
          ? ageLandLimit(landState.age) : toplamAlan;
        landState.gold = RES.altin || 0;
      }
      // HUD stat-box
      const alanBox = document.getElementById('hud-alan-box');
      if (alanBox) alanBox.textContent = kullanilanAlan + '/' + toplamAlan;
      // Eski ID uyumluluk
      const landEl = document.getElementById('hud-land');
      if (landEl) landEl.textContent = toplamAlan;
      const usedEl = document.getElementById('hud-used');
      if (usedEl) usedEl.textContent = kullanilanAlan;
      // Arazi sayfasindaki gosterim
      setText('land-current', toplamAlan);
    }

    // Palantis takvim HUD
    if (takvimData) {
      const takvimEl = document.getElementById('hud-takvim');
      if (takvimEl) takvimEl.textContent = takvimData.formatted || (takvimData.palantis_gun + '/' + takvimData.palantis_ay + '/' + takvimData.palantis_yil);
    }

    // Backend'den gelen kaynaklari RES objesine yaz
    if (res.odun !== undefined) RES.odun = parseInt(res.odun) || 0;
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
    // v1.14.2.0: GP/KP backend'ten oku
    if (res.gelisim_puani !== undefined) RES.gelisim_puani = parseInt(res.gelisim_puani) || 0;
    if (res.kultur_puani  !== undefined) RES.kultur_puani  = parseInt(res.kultur_puani)  || 0;
    // Mana degerlerini yukle
    if (res.mana_beyaz !== undefined) RES.mana_beyaz = parseFloat(res.mana_beyaz) || 0;
    if (res.mana_kirmizi !== undefined) RES.mana_kirmizi = parseFloat(res.mana_kirmizi) || 0;
    if (res.mana_mavi !== undefined) RES.mana_mavi = parseFloat(res.mana_mavi) || 0;
    if (res.mana_yesil !== undefined) RES.mana_yesil = parseFloat(res.mana_yesil) || 0;

    // v1.2.0: Extra kaynaklar (at, kurt, gizlilik, buyulu_yumurta)
    if (res.at !== undefined) EXTRA_RES.at = parseInt(res.at) || 0;
    if (res.kurt !== undefined) EXTRA_RES.kurt = parseInt(res.kurt) || 0;
    if (res.gizlilik !== undefined) EXTRA_RES.gizlilik = parseFloat(res.gizlilik) || 0;
    if (res.buyulu_yumurta !== undefined) EXTRA_RES.buyulu_yumurta = parseFloat(res.buyulu_yumurta) || 0;
    if (res.besi_hayvani !== undefined) EXTRA_RES.besi_hayvani = parseInt(res.besi_hayvani) || 0;
    if (res.cig_et !== undefined) EXTRA_RES.cig_et = parseInt(res.cig_et) || 0;
    // v1.13.40.1 FIX: EXTRA_RES.mana kisisel bilge rengine gore (yoksa tarafa gore)
    // Oncesinde set edilmedigi icin buyucu/kara_elf uretimi "Yetersiz: mana" hatasi veriyordu
    // Bilge: window.__KISISEL_BILGE veya localStorage'dan oku (buyucu-kulesi sayfasinda set)
    var _pt = (typeof loadPlayer === 'function') ? (loadPlayer()?.taraf) : null;
    var _kisi = null;
    try { _kisi = localStorage.getItem('noxara_kisisel_bilge'); } catch {}
    var _renk = (_kisi && ['beyaz','kirmizi','mavi','yesil'].includes(_kisi)) ? _kisi
              : (_pt === 'kotu' ? 'kirmizi' : 'beyaz');
    EXTRA_RES.mana = parseFloat(res['mana_' + _renk]) || 0;

    // HUD Ham kaynaklar (miktar + rate)
    // v1.14.0.98: setHudNum/setHudRate — kisa format (K/M/B) + tooltip'te tam deger
    const _hudN = (typeof setHudNum === 'function') ? setHudNum : setText;
    const _hudR = (typeof setHudRate === 'function') ? setHudRate : (id, v) => { if(typeof setRate==='function') setRate(id, v); else setText(id, v); };
    _hudN('hud-w',   RES.odun);       _hudR('hud-wg',  prod.odun   ?? 0);
    _hudN('hud-m',   RES.metal);      _hudR('hud-mg',  prod.metal  ?? 0);
    _hudN('hud-bu',  RES.bugday);     _hudR('hud-bug', prod.bugday ?? 0);
    _hudN('hud-ba',  RES.balik);      _hudR('hud-bag', prod.balik  ?? 0);
    _hudN('hud-g',   RES.altin);      _hudR('hud-gg',  prod.altin  ?? 0);

    // v1.14.1.46: İşlenmiş kaynaklar HUD — rate eklendi (kereste atolyesi × 20, isleme × 10/saat)
    //   Eski: rate gosterilmiyor cunku "isleme cron ile" denmis. Aslinda backend prod.kereste/islenmis dondurur.
    _hudN('hud-ke',  RES.kereste);    _hudR('hud-keg', prod.kereste  ?? 0);
    _hudN('hud-is',  RES.islenmis);   _hudR('hud-isg', prod.islenmis ?? 0);
    _hudN('hud-ek',  RES.ekmek);
    _hudN('hud-pb',  RES.pismis);
    _hudN('hud-ce',  RES.cig_et);
    _hudN('hud-pe',  RES.pismis_et);

    // v1.14.2.0 (FAZ X.4): KP/GP HUD gostergesi
    _hudN('hud-gp',  RES.gelisim_puani || 0);
    _hudN('hud-kp',  RES.kultur_puani  || 0);

    // Mana HUD + üretim rate
    _hudN('hud-mana-beyaz',   Math.floor(RES.mana_beyaz   || 0));
    _hudN('hud-mana-kirmizi', Math.floor(RES.mana_kirmizi || 0));
    _hudN('hud-mana-mavi',    Math.floor(RES.mana_mavi    || 0));
    _hudN('hud-mana-yesil',   Math.floor(RES.mana_yesil   || 0));
    _hudR('hud-mana-beyaz-g',   prod.mana_beyaz   ?? (parseInt(work?.worshipper_beyaz)   || 0) * 0.1);
    _hudR('hud-mana-kirmizi-g', prod.mana_kirmizi ?? (parseInt(work?.worshipper_kirmizi) || 0) * 0.1);
    _hudR('hud-mana-mavi-g',    prod.mana_mavi    ?? (parseInt(work?.worshipper_mavi)    || 0) * 0.1);
    _hudR('hud-mana-yesil-g',   prod.mana_yesil   ?? (parseInt(work?.worshipper_yesil)   || 0) * 0.1);

    // Nufus & İşçiler
    if (work) {
      if (work.total !== undefined) population.total = parseInt(work.total) || 10;
      population.wood     = parseInt(work.oduncu)  || 0;
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
      // v1.2.0: Backend free_koylu hesapliyor — tek dogru kaynak
      if (work.free_koylu !== undefined) {
        population.free = parseInt(work.free_koylu) || 0;
      } else {
        const atanan = population.wood + population.iron + population.farm
                     + population.fish + population.merchant
                     + population.asker + population.worshipper;
        population.free = Math.max(0, population.total - atanan);
      }
      updatePopulationUI();
    }

    // İşçi dagilimi guncelle
    const isciMap = { oduncu:'w-oduncu', madenci:'w-madenci', ciftci:'w-ciftci', balikci:'w-balikci', tuccar:'w-tuccar' };
    for (const [key, elId] of Object.entries(isciMap)) {
      const inp = document.getElementById(elId);
      if (inp && work[key] !== undefined) inp.value = work[key];
      const gainEl = document.getElementById('gain-' + elId.replace('w-',''));
      if (gainEl) gainEl.textContent = '+' + (prod[key === 'oduncu' ? 'odun' : key === 'madenci' ? 'metal' : key === 'ciftci' ? 'bugday' : key === 'balikci' ? 'balik' : 'altin'] || 0) + '/s';
    }

    // Asker sayisini worker tablosundan al
    if (work.asker !== undefined) {
      ASKER_SAYISI = parseInt(work.asker) || 0;
    }

    // v1.13.36: Sayfa-ozel fonksiyonlar artik PARALEL (eskiden sequential, 4 x 600ms = 2.4 sn)
    const pageLoaders = [];
    if(typeof loadPisirme === 'function')              pageLoaders.push(loadPisirme());
    if(typeof loadBuildingsFromBackend === 'function') pageLoaders.push(loadBuildingsFromBackend());
    if(typeof loadTrainingQueue === 'function')        pageLoaders.push(loadTrainingQueue());
    if(typeof loadArmyPool === 'function')             pageLoaders.push(loadArmyPool());
    if(pageLoaders.length) await Promise.all(pageLoaders);

    // Gorev badge: zaten yukarida yapildi (gorevRaw'dan), bu bolum kaldirildi

    // ── Tatil + Ateşkes global flag ──
    try {
      window.TATIL_AKTIF = false;
      window.TATIL_KALAN_PG = 0;
      window.ATESKES_AKTIF = false;
      window.ATESKES_ACIKLAMA = '';

      if (tatilRaw) {
        window.TATIL_AKTIF = !!tatilRaw.tatil_modu;
        window.TATIL_KALAN_PG = tatilRaw.kalan_pg || 0;
      }
      if (ateskesRaw) {
        window.ATESKES_AKTIF = !!(ateskesRaw.aktif && ateskesRaw.bitis && new Date(ateskesRaw.bitis) > new Date());
        window.ATESKES_ACIKLAMA = ateskesRaw.aciklama || '';
      }

      // HUD banner güncelle
      const atkB = document.getElementById('hud-ateskes-banner');
      if (atkB) {
        if (window.ATESKES_AKTIF) { atkB.textContent = '⚔️ ATEŞKES — ' + window.ATESKES_ACIKLAMA; atkB.style.display = 'block'; }
        else atkB.style.display = 'none';
      }
      const tatB = document.getElementById('hud-tatil-banner');
      if (tatB) {
        if (window.TATIL_AKTIF) { tatB.textContent = '🏖️ TATİL MODU — ' + Math.round(window.TATIL_KALAN_PG) + ' PG kaldı'; tatB.style.display = 'block'; }
        else tatB.style.display = 'none';
      }
    } catch(e) {}

    // v1.14.0.76: Kadim sehir saldiri geri sayim
    try {
      if (typeof loadKadimHudBanner === 'function') loadKadimHudBanner();
    } catch(e) {}

  } catch(e) {
    console.error('[loadGameData]', e);
  } finally {
    // v1.14.0.65: Skeleton UI bitir — success/fail fark etmez, skeleton gizle
    try { document.body.classList.add('data-loaded'); } catch(e) {}
  }
}

/* -- Binalari backend'den yukle -- */
async function loadBuildingsFromBackend() {
  const token = getToken();
  if (!token) return;
  try {
    // v1.13.5: Bina aciklamalari admin panelinden degistirilebilir — backend'den al, BLDGS.desc override
    try {
      const mr = await fetch(API_BASE + '/api/game/bina-maliyetler', { headers: { 'Authorization': 'Bearer ' + token } });
      if (mr.ok) {
        const maliyetler = await mr.json();
        for (const [id, m] of Object.entries(maliyetler)) {
          if (BLDGS[id] && m.aciklama) BLDGS[id].desc = m.aciklama;
        }
      }
    } catch(e) {}

    const resp = await fetch(API_BASE + '/api/game/buildings', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) return;
    const buildings = await resp.json();
    // v1.14.0.60: İnşaat mod bilgisi — BLDGS dışında ayrı global
    window._insaatInfo = buildings._insaat || { mod: 'klasik' };
    delete buildings._insaat;
    let usedArea = 0;
    for (const [binaId, data] of Object.entries(buildings)) {
      if (BLDGS[binaId]) {
        // Kilit koylu aktar
        BLDGS[binaId]._kilitKoylu = data.kilitKoylu || 0;
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
        // Dayanıklılık bilgisini aktar
        BLDGS[binaId]._dayaniklilik = data.dayaniklilik ?? 100;
        BLDGS[binaId]._repairQueue = data.repairQueue || false;
        BLDGS[binaId]._repairGunKalan = data.repairGunKalan || 0;
        // v1.14.3.1: Toplu inşa kuyruğu sayısı (Sezgi: lonca 18+7 ama görünmüyordu)
        BLDGS[binaId]._kalanInsa = data.kalanInsa || 0;
        usedArea += BLDGS[binaId].lv * binaAlanFE(binaId);
      }
    }
    setText('hud-used', usedArea);
    // Sehir Degeri hesapla ve HUD'a yaz (bina + ordu)
    if (typeof updateCityStats === 'function') updateCityStats();
    // Alan box guncelle
    const alanBox = document.getElementById('hud-alan-box');
    const toplamAlanG = window._palantisToplamAlan || 0;
    if (alanBox) alanBox.textContent = usedArea + '/' + toplamAlanG;
    // Sehir grid'i guncelle
    if (typeof renderGrid === 'function') { renderGrid(); }
    if (typeof renderQueue === 'function') { renderQueue(); }
    // Pisirme kapasitesini guncelle (ocak/firin lv degisti)
    if (typeof updatePisirmeUI === 'function') { updatePisirmeUI(); }
    // İşçi kapasite badge'lerini guncelle
    if (typeof updatePopulationUI === 'function') { updatePopulationUI(); }
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
  // v1.14.1.27: koord_x/y de dahil — home-dashboard hpLoadBaslik OYUNCU.koord_x okuyor
  OYUNCU = { kral: p.kral, sehir: p.sehir, irk: p.irk, taraf: p.taraf, cag: p.cag || 1,
             koord_x: p.koord_x, koord_y: p.koord_y, id: p.id, premium: p.premium };
  try { window.OYUNCU = OYUNCU; } catch(_){ }
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
  // Sidebar Cag gosterimi
  set('sidebar-cag', romanCag(p.cag || 1) + '. Cag');
  // Koordinat sidebar'da göster
  if (p.koord_x) set('sidebar-koord', '📍 ' + p.koord_x + ':' + p.koord_y);

  if ((p.cag || 1) > 1) {
    const el = document.getElementById('cag1-uyari');
    if (el) el.style.display = 'none';
  }

  // Bonus ozet karti
  const bonusEl = document.getElementById('home-bonus-content');
  if (bonusEl) {
    let html = '';
    // Irk bonusu
    if (p.irk_bonuslari && Object.keys(p.irk_bonuslari).length > 0) {
      const bonusParts = Object.entries(p.irk_bonuslari).map(([k,v]) => `${k} +%${v}`).join(', ');
      html += `<div style="padding:8px;background:#111;border-radius:4px;border-left:2px solid var(--race-color,#c8a96e)">
        <div style="font-size:10px;color:var(--race-color,#c8a96e);font-weight:bold">Irk: ${p.irk||'-'}</div>
        <div style="font-size:11px;color:#bbb;margin-top:3px">${bonusParts}</div>
      </div>`;
    }
    // Bolge bonusu
    if (p.bolge_bilgi) {
      const bParts = Object.entries(p.bolge_bilgi.bonuslar||{}).map(([k,v]) => `${k} +%${v}`).join(', ');
      html += `<div style="padding:8px;background:#111;border-radius:4px;border-left:2px solid #3498db">
        <div style="font-size:10px;color:#3498db;font-weight:bold">${p.bolge_bilgi.ikon||''} ${p.bolge_bilgi.ad||'Bolge'}</div>
        <div style="font-size:11px;color:#bbb;margin-top:3px">${bParts || 'Bonus yok'}</div>
      </div>`;
    }
    // Premium
    if (p.premium && p.premium.aktif) {
      html += `<div style="padding:8px;background:#111;border-radius:4px;border-left:2px solid #f1c40f">
        <div style="font-size:10px;color:#f1c40f;font-weight:bold">Premium: ${(p.premium.paket||'').toUpperCase()}</div>
        <div style="font-size:11px;color:#bbb;margin-top:3px">${Math.max(0,Math.ceil((new Date(p.premium.bitis)-new Date())/(1000*60*60*24)))} gun kaldi</div>
      </div>`;
    }
    if (!html) html = '<div style="color:#555;font-size:11px">Aktif bonus yok</div>';
    bonusEl.innerHTML = html;
    // Aktif buyu bonuslarini async olarak ekle (obApplyPlayer sync oldugu icin)
    _loadAktifBuyuBonus(bonusEl, html);
    _loadArtifactBonus(bonusEl);
  }

  // Sezon rozetleri
  const rozetContainer = document.getElementById('home-rozetler');
  if (rozetContainer && p.rozetler && p.rozetler.length > 0) {
    const TARAF_RENK = { iyi:'#f1c40f', kotu:'#3498db' };
    const TARAF_ISIM = { iyi:'Aydınlık', kotu:'Karanlık' };
    const CAG_ROMA = ['','I','II','III','IV','V'];
    rozetContainer.style.display = 'flex';
    rozetContainer.innerHTML = p.rozetler.map(r => {
      const renk = TARAF_RENK[r.taraf] || '#888';
      const bg = r.taraf === 'iyi' ? 'rgba(241,196,15,0.15)' : 'rgba(52,152,219,0.15)';
      return `<div title="Sezon ${r.sezon_no}: ${TARAF_ISIM[r.taraf]||r.taraf} ${CAG_ROMA[r.cag]||r.cag}. Çağ"
        style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;
        border:1px solid ${renk};color:${renk};background:${bg};white-space:nowrap;cursor:default">
        S${r.sezon_no} ${r.taraf==='iyi'?'☀️':'🌙'} Ç${r.cag}
      </div>`;
    }).join('');
  }

  // Premium rozeti — yalnizca gizli tutulur, bonus ozet panelinde gosteriliyor
  const premBadge = document.getElementById('home-premium-badge');
  const premInfo = document.getElementById('home-premium-info');
  if (premBadge) premBadge.style.display = 'none';
  if (premInfo) premInfo.style.display = 'none';
}

/* -- Logout -- */
async function logoutGame() {
  if (!await noxConfirm('Oyundan cikmak istedigine emin misin?')) return;
  clearToken();
  OYUNCU = { kral: null, sehir: null, irk: null, taraf: null, cag: 1 };
  QUEUE.length = 0;
  Object.values(BLDGS).forEach(b => b.lv = 0);
  population = { total: 10, free: 10, max: 1000, wood:0, iron:0,
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
  // v1.14.1.27: sidebar-cag element kaldirildi — guard ekle
  const sbc = document.getElementById('sidebar-cag');
  if (sbc) sbc.textContent = roman[OYUNCU.cag] + '. Cag';
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

/* Gercek maliyet hesapla (askeri gelistirme indirimi: %10/seviye) */
function realCost(baseCost) {
  const c = {...baseCost};
  if (c.altin && ASKERI_GEL_SEV > 0) {
    c.altin = Math.floor(c.altin * (1 - ASKERI_GEL_SEV * 0.10));
  }
  return c;
}
/* Gercek maas hesapla (maas gelistirme: %5/seviye) */
function realMaas(baseMaas) {
  return Math.floor(baseMaas * (1 - MAAS_GEL_SEV * 0.05));
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

/* -- Aktif buyu bonuslarini async yukle (bonus ozet kartina ekler) -- */
function _loadAktifBuyuBonus(bonusEl, baseHtml) {
  try {
    const bToken = getToken();
    if (!bToken || !bonusEl) return;
    fetch(API_BASE + '/api/buyucu-kulesi/aktif', { headers: { Authorization: 'Bearer ' + bToken } })
      .then(r => r.ok ? r.json() : null)
      .then(bData => {
        if (!bData || !bData.ok || !bData.aktifler || !bData.aktifler.length) return;
        const BUYU_ISIM = {
          motivasyon_h:'Motivasyon (H)', motivasyon_y:'Motivasyon (Y)', ejderha_sevinci:'Ejderha Sevinci',
          koruma:'Koruma', sessizlik:'Sessizlik', kum_firtinasi:'Kum Fırtınası', hiz:'Hız',
          mistik_defans:'Mistik Defans', mistik_atak:'Mistik Atak', serap:'Serap',
          buyu_kalkani:'Büyü Kalkanı', hipnoz:'Hipnoz', sadakat:'Sadakat', yakaris:'Yakarış', kabus:'Kâbus'
        };
        const aktifHTML = bData.aktifler.map(a => {
          const isim = BUYU_ISIM[a.buyu_id] || a.buyu_id;
          const kalan = Math.max(0, new Date(a.bitis) - new Date());
          const saat = Math.floor(kalan / 3600000);
          const dk = Math.floor((kalan % 3600000) / 60000);
          const kalanStr = saat > 0 ? saat + 's ' + dk + 'dk' : dk + 'dk';
          let etkiStr = '';
          if (a.etki) {
            if (a.etki.uretim_bonus) etkiStr = 'Uretim +%' + a.etki.uretim_bonus;
            else if (a.etki.moral_bonus) etkiStr = 'Moral +' + a.etki.moral_bonus;
            else if (a.etki.koruma) etkiStr = 'Saldiri engeli';
            else if (a.etki.buyu_kalkan) etkiStr = 'Tum buyuler etkisiz';
            else if (a.etki.maas_muaf) etkiStr = 'Maas muafiyeti';
            else if (a.etki.koloni_bonus) etkiStr = 'Koloni +%' + a.etki.koloni_bonus;
            else if (a.etki.mana_carpan) etkiStr = 'Mana x' + a.etki.mana_carpan;
            else if (a.etki.hiz_bonus) etkiStr = 'Hiz +%' + a.etki.hiz_bonus;
            else if (a.etki.def_bonus) etkiStr = 'DEF +' + a.etki.def_bonus;
            else if (a.etki.atk_bonus) etkiStr = 'ATK +' + a.etki.atk_bonus;
            else if (a.etki.casus_engel) etkiStr = 'Casus -%' + a.etki.casus_engel;
          }
          return '<div style="display:flex;justify-content:space-between;font-size:11px;color:#bbb;margin-top:2px">' +
            '<span>\u{1F52E} ' + isim + ' (K' + a.kademe + ')' + (etkiStr ? ' \u2014 ' + etkiStr : '') + '</span>' +
            '<span style="color:#8e44ad;font-size:10px">' + kalanStr + '</span></div>';
        }).join('');
        const buyuDiv = '<div style="padding:8px;background:#111;border-radius:4px;border-left:2px solid #8e44ad">' +
          '<div style="font-size:10px;color:#8e44ad;font-weight:bold">\u{1F52E} Aktif Buyuler</div>' +
          aktifHTML + '</div>';
        bonusEl.innerHTML = (baseHtml || '') + buyuDiv;
      }).catch(() => {});
  } catch(e) {}
}

function _loadArtifactBonus(bonusEl) {
  try {
    const aToken = getToken();
    if (!aToken || !bonusEl) return;
    fetch(API_BASE + '/api/artifact/aktif-bonuslar', { headers: { Authorization: 'Bearer ' + aToken } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.artifactlar || !data.artifactlar.length) return;
        const artifactHTML = data.artifactlar.map(a => {
          const etkiParts = Object.entries(a.etki || {}).map(([k, v]) => `${k} +%${v}`).join(', ');
          return '<div style="display:flex;justify-content:space-between;font-size:11px;color:#bbb;margin-top:2px">' +
            '<span>' + (a.ikon || '\u{1F9F0}') + ' ' + (a.isim || a.artifact_id) + (etkiParts ? ' \u2014 ' + etkiParts : '') + '</span>' +
            '<span style="color:#e67e22;font-size:10px">' + (a.kalan_pg || 0) + ' PG kald\u0131</span></div>';
        }).join('');
        const artifactDiv = '<div style="padding:8px;background:#111;border-radius:4px;border-left:2px solid #e67e22">' +
          '<div style="font-size:10px;color:#e67e22;font-weight:bold">\u{1F9F0} Artifact Bonuslar\u0131</div>' +
          artifactHTML + '</div>';
        bonusEl.innerHTML += artifactDiv;
      }).catch(() => {});
  } catch(e) {}
}
