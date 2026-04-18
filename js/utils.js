/* utils.js — Palantis utility functions */

function numFmt(v){
  // Sayiyi binlik ayiracli formatla (Turkce: 1.234.567)
  // v1.13.58.1: String branch kaldirildi — TR locale "218.168" zaten formatli,
  //             regex bunu float sanip Math.floor yapiyordu (218 bug'i)
  const n = Number(v);
  if(typeof v === 'number' && Number.isFinite(n)){
    return Math.floor(n).toLocaleString('tr-TR');
  }
  return v; // Zaten string/formatlanmissa dokunma
}

// v1.13.55: Global alias — tum sayfalarda fmt(n) kullanilabilir
// Lokal fmt fonksiyonlari (page-army.js, page-guild.js, savas-rapor.js) ile uyumlu
if (typeof window !== 'undefined') {
  window.numFmt = numFmt;
  window.fmt = numFmt;
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

// v1.13.31: Kalan sureyi PG biriminde formatla — dakika/saniye yerine yuzdelik PG
// Ornek: 3600 sn = "1 P.G.", 1800 sn = "%50 P.G.", 5400 sn = "1 P.G. %50",
//        2844 sn = "%79 P.G.", 0 sn = "Tamamlaniyor"
function fmtKalanSure(sec){
  sec = Math.max(0, Math.floor(sec));
  if (sec <= 0) return 'Tamamlanıyor';
  if (sec < 36) return '< %1 P.G.'; // 36sn altı = 1 PG'nin %1'inden az

  const tamPg = Math.floor(sec / 3600);
  const kalanSn = sec - tamPg * 3600;
  // 3600/100 = 36sn → 1%. Yuvarla ama 100'e varmasin (o zaman +1 PG olmali)
  let yuzde = Math.round(kalanSn / 36);
  if (yuzde >= 100) yuzde = 99;

  if (tamPg === 0) return `%${yuzde} P.G.`;
  if (yuzde === 0) return `${tamPg} P.G.`;
  return `${tamPg} P.G. %${yuzde}`;
}

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
