/* utils.js — Palantis utility functions */

function numFmt(v){
  // Sayiyi binlik ayiracli formatla (Turkce: 1.234.567)
  const n = Number(v);
  if(typeof v === 'number' && Number.isFinite(n)){
    return Math.floor(n).toLocaleString('tr-TR');
  }
  return v;
}
function setText(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.innerText = numFmt(value);
}
// Artik sekmeler yok — eski hudSetTab cagrilari icin no-op
function hudSetTab(tab, btn){}

function pad2(n){ return String(n).padStart(2,'0'); }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

const canAfford=cost=>Object.entries(cost).every(([r,a])=>(RES[r]||0)>=a);
const spendCost=cost=>Object.entries(cost).forEach(([r,a])=>{RES[r]=(RES[r]||0)-a;});
// 1 Palantis gunu = 3600 saniye = 1 gercek saat
const fmtT=sec=>{
  const gun=sec/3600;
  if(gun>=1) return `${gun.toFixed(1)} P.G.`;
  if(gun>=0.1) return `${gun.toFixed(2)} P.G.`;
  return `${gun.toFixed(3)} P.G.`;
};

function romanCag(n) {
  return ['','I','II','III','IV','V'][n] || n;
}

function findIrk(id) {
  return [...(IRKLAR.iyi || []), ...(IRKLAR.kotu || [])].find(i => i.id === id);
}

/* Extra kaynak yeterlilik kontrolu */
function canAffordExtra(extraCost) {
  if (!extraCost) return true;
  return Object.entries(extraCost).every(([r,a]) => (EXTRA_RES[r]||0) >= a);
}
/* Extra kaynak harca */
function spendExtra(extraCost) {
  if (!extraCost) return;
  Object.entries(extraCost).forEach(([r,a]) => { EXTRA_RES[r] = (EXTRA_RES[r]||0) - a; });
}
