/* ══════════════════════════════════
   ARAZI RANDOM TEKLIF MOTORU (2 SAATTE BIR)
   Extracted from index.html
══════════════════════════════════ */

const landState = {
  gold: 999,
  land: 100,
  age: 1,
  landLimit: 300,
  chosenThisCycle: false,
  cycleKey: null,
  offers: []
};

function ageLandLimit(age){
  if(age === 1) return 500;
  if(age === 2) return 800;
  if(age === 3) return 1000;
  if(age === 4) return 1500;
  return Infinity;
}

// Cag ve alan backend'den guncellenecek (loadGameData ile)
landState.age = 1;
landState.landLimit = ageLandLimit(landState.age);

function offerRange(age){
  if(age===1) return {min:5,  max:35};
  if(age===2) return {min:10, max:50};
  if(age===3) return {min:15, max:65};
  if(age===4) return {min:20, max:80};
  return {min:25, max:95};
}

function applyLandCapRules(){
  const remaining = landState.landLimit - landState.land;
  if (remaining <= 0){
    landState.offers = landState.offers.map(o => {
      if (o.status === "sold") return o;
      return { ...o, status: "disabled" };
    });
  } else {
    landState.offers = landState.offers.map(o => {
      if (o.status !== "active") return o;
      if (o.amount > remaining) return { ...o, status: "disabled" };
      return o;
    });
  }
}

// Arazi borsasi her 4 Palantis gunu (= 4 gercek saat) yenilenir
function getCycleKey(now){
  const d = new Date(now);
  d.setMinutes(0,0,0);
  const h = now.getHours();
  d.setHours(h - (h % 4)); // 4 saatlik bloklar: 0,4,8,12,16,20
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}`;
}

function next2h(now){
  const t = new Date(now);
  t.setMinutes(0,0,0);
  const h = now.getHours();
  const nh = h + (4 - (h % 4)); // sonraki 4 saatlik blok
  t.setHours(nh);
  return t;
}

// v1.14.0.64: Deterministik seed — ayni (player_id + cycleKey) kombinasyonu hep ayni teklifleri uretir
function _seedFromString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}
function _seededPRNG(seed) {
  let x = seed;
  return function() {
    x = Math.imul(x, 1597334677) + 1013904243 >>> 0;
    return (x >>> 0) / 4294967295;
  };
}
function _seededRandInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateOffers(cycleKey){
  const r = offerRange(landState.age);
  const remaining = landState.landLimit - landState.land;
  if (remaining <= 0) return [];

  // Player ID + cycle key → deterministik seed
  const playerId = (typeof OYUNCU !== 'undefined' && OYUNCU?.id) ? OYUNCU.id : 0;
  const seed = _seedFromString('land:' + playerId + ':' + (cycleKey || landState.cycleKey || 'x'));
  const rng = _seededPRNG(seed);

  const used = new Set();
  const arr = [];

  let guard = 0;
  while (arr.length < 4 && guard < 200){
    guard++;
    const maxAllowed = Math.min(r.max, remaining);
    const minAllowed = Math.min(r.min, maxAllowed);
    if (maxAllowed < 1) break;
    const amount = _seededRandInt(rng, minAllowed, maxAllowed);
    if (used.has(amount)) continue;
    used.add(amount);

    arr.push({
      id: arr.length + 1,
      amount,
      price: amount * LAND_PRICE_PER_TILE,
      status: "active"
    });
  }

  return arr;
}

function refreshLandNumbers(){
  setText('land-current', landState.land);
  setText('land-limit',   landState.landLimit);
  let usedAlan = 0;
  try { usedAlan = Object.values(BLDGS).filter(b=>b.lv>0).length; } catch(e) {}
  setText('hud-used', usedAlan);
  setText('hud-land', landState.land);
  setText('hud-limit', landState.landLimit);
  try { setText('hud-g', RES.altin); } catch(e) {}
}

function renderOffers(){
  const box = document.getElementById('land-offers');
  if(!box) return;
  box.innerHTML = '';
  landState.offers.forEach(o=>{
    const div = document.createElement('div');
    div.className = `land-offer ${o.status==="sold"?"sold":""} ${o.status==="disabled"?"disabled":""}`;
    const label = o.status==="sold" ? "ALINDI" : (o.status==="disabled" ? "PASIF" : "Satin Al");
    const disabledAttr = o.status==="active" ? "" : "disabled";
    div.innerHTML = `
      <div class="land-left">\ud83c\udf31 <b>+${o.amount}</b> Alan</div>
      <div class="land-right">
        <span class="info">\ud83d\udcb0 ${o.price} Altın</span>
        <button class="btn-action land-buy" ${disabledAttr}>${label}</button>
      </div>
    `;
    div.querySelector('button.land-buy').addEventListener('click', ()=>buyOffer(o.id));
    box.appendChild(div);
  });
}

async function buyOffer(id){
  // v1.14.3.26 FIX: Sezgi "alan satin alamiyorum"
  // - chosenThisCycle frontend flag'i hatali check (sayfa yenilenince false kaliyor)
  // - Backend zaten 4 saatlik dongu kontrolu yapiyor — UI flag gereksiz
  // - Hata durumunda detayli toast
  const offer = landState.offers.find(x=>x.id===id);
  if(!offer || offer.status!=="active") {
    toast("Bu teklif aktif degil.");
    return;
  }

  if(RES.altin < offer.price){
    toast("Yetersiz altin (gereken: " + offer.price.toLocaleString('tr-TR') + ", mevcut: " + (RES.altin||0).toLocaleString('tr-TR') + ")");
    return;
  }
  if(landState.land + offer.amount > landState.landLimit){
    toast("Cag limitini asiyorsun (" + landState.landLimit + ")");
    return;
  }

  const token = getToken();
  if(!token) {
    toast("Giris yapman gerekli.");
    return;
  }
  try {
    const resp = await fetch(API_BASE + '/api/game/alan/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ miktar: offer.amount, fiyat: offer.price })
    });
    const data = await resp.json();
    if(!resp.ok){
      toast((data.error || 'Hata') + (data.detail ? ' — ' + data.detail : ''));
      console.warn('[alan/buy fail]', resp.status, data);
      return;
    }
    landState.land = data.yeni_alan || (landState.land + offer.amount);
    RES.altin = Math.max(0, RES.altin - offer.price);

    if (window.NoxToast) NoxToast.success('🌱 +' + offer.amount + ' alan satın alındı! Toplam: ' + landState.land);
    else toast('Alan alındı: +' + offer.amount);
  } catch(e) {
    toast('Sunucu hatasi: ' + e.message);
    console.error('[alan/buy error]', e);
    return;
  }

  landState.chosenThisCycle = true;
  landState.offers = landState.offers.map(o=>{
    if(o.id===id) return {...o, status:"sold"};
    return {...o, status:"disabled"};
  });

  refreshLandNumbers();
  renderOffers();
}

function landTick(){
  const now = new Date();
  const key = getCycleKey(now);
  if(landState.cycleKey !== key){
    landState.cycleKey = key;
    landState.chosenThisCycle = false;
    landState.offers = generateOffers(key);
    applyLandCapRules();
    refreshLandNumbers();
    renderOffers();
  }
  const target = next2h(now);
  const diff = target - now;
  const tEl = document.getElementById('land-timer');
  const gunKalan = diff / 3600000;
  const kalanSn = Math.max(0, Math.floor(diff / 1000));
  if(tEl) tEl.innerText = kalanSn > 0 ? fmtKalanSure(kalanSn) : '\u2014';
}

setInterval(landTick, 1000);
landTick();

document.addEventListener('DOMContentLoaded', () => {
  landTick();
  applyLandCapRules();
  refreshLandNumbers();
  renderOffers();
});
