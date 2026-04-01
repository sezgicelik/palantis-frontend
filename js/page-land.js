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
  if(age === 1) return 300;
  if(age === 2) return 600;
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

function getCycleKey(now){
  const d = new Date(now);
  d.setMinutes(0,0,0);
  const h = now.getHours();
  d.setHours(h%2===0 ? h : h-1);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}`;
}

function next2h(now){
  const t = new Date(now);
  t.setMinutes(0,0,0);
  const h = now.getHours();
  const nh = (h%2===0) ? h+2 : h+1;
  t.setHours(nh);
  return t;
}

function generateOffers(){
  const r = offerRange(landState.age);
  const remaining = landState.landLimit - landState.land;
  if (remaining <= 0) return [];

  const used = new Set();
  const arr = [];

  let guard = 0;
  while (arr.length < 4 && guard < 200){
    guard++;
    const maxAllowed = Math.min(r.max, remaining);
    const minAllowed = Math.min(r.min, maxAllowed);
    if (maxAllowed < 1) break;
    const amount = randInt(minAllowed, maxAllowed);
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
        <span class="info">\ud83d\udcb0 ${o.price} Altin</span>
        <button class="btn-action land-buy" ${disabledAttr}>${label}</button>
      </div>
    `;
    div.querySelector('button.land-buy').addEventListener('click', ()=>buyOffer(o.id));
    box.appendChild(div);
  });
}

async function buyOffer(id){
  if(landState.chosenThisCycle){
    toast("Bu dongude zaten 1 arazi aldin.");
    return;
  }
  const offer = landState.offers.find(x=>x.id===id);
  if(!offer || offer.status!=="active") return;

  if(RES.altin < offer.price){
    toast("Yetersiz altin.");
    return;
  }
  if(landState.land + offer.amount > landState.landLimit){
    toast("Cag limitini asiyorsun.");
    return;
  }

  const token = getToken();
  if(token) {
    try {
      const resp = await fetch(API_BASE + '/api/game/alan/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ miktar: offer.amount, fiyat: offer.price })
      });
      const data = await resp.json();
      if(!resp.ok){ toast(data.error || 'Hata'); return; }
      landState.land = data.yeni_alan;
      RES.altin -= offer.price;
    } catch(e) { toast('Sunucu hatasi'); return; }
  } else {
    RES.altin -= offer.price;
    landState.land += offer.amount;
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
    landState.offers = generateOffers();
    applyLandCapRules();
    refreshLandNumbers();
    renderOffers();
  }
  const target = next2h(now);
  const diff = target - now;
  const tEl = document.getElementById('land-timer');
  const gunKalan = diff / 3600000;
  if(tEl) tEl.innerText = gunKalan > 0 ? `${gunKalan.toFixed(2)} P.G.` : '\u2014';
}

setInterval(landTick, 1000);
landTick();

document.addEventListener('DOMContentLoaded', () => {
  landTick();
  applyLandCapRules();
  refreshLandNumbers();
  renderOffers();
});
