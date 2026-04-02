/* ═══════════════════════════════════════════════════════
   PALANTIS — HARITA TILE SPRITE SİSTEMİ
   Nano Banana tarzı detaylı arazi tile'ları
   Canvas üzerinde pre-render edilir
═══════════════════════════════════════════════════════ */

const TILE_SIZE = 48; // Her tile piksel boyutu
const TILE_CACHE = {}; // Pre-rendered tile cache

// Deterministik pseudo-random
function tileRand(x, y, seed) {
  let h = (x * 374761 + y * 668265 + (seed||0) * 982451) & 0x7fffffff;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return (h & 0xffff) / 0xffff;
}

// ─── RENK PALETLERİ ───
const PAL = {
  // Orman
  orman_zemin:  ['#2d5a1e','#3a6b2a','#2a5020','#356328'],
  orman_agac:   ['#1a4010','#225518','#1d4a12','#286020'],
  orman_govde:  ['#5a3a1a','#4a3018','#6a4420'],
  orman_yaprak: ['#3a8a2a','#4a9a3a','#2a7a1a','#5aaa3a'],
  // Dağ
  dag_zemin:    ['#5a5a6a','#4a4a5a','#6a6a7a','#555568'],
  dag_kaya:     ['#7a7a8a','#6a6a7a','#8a8a9a'],
  dag_kar:      ['#d0d5e0','#c0c8d5','#e0e5f0'],
  dag_golge:    ['#3a3a4a','#2a2a3a'],
  // Deniz
  deniz_zemin:  ['#1a4a7a','#1a3a6a','#2a5a8a','#15406a'],
  deniz_dalga:  ['#3a7aaa','#4a8aba','#2a6a9a'],
  deniz_kopuk:  ['#8ac0e0','#9ad0f0','#7ab0d0'],
  // Ova
  ova_zemin:    ['#5a7a2a','#6a8a3a','#4a6a20','#5a8030'],
  ova_bugday:   ['#c8a040','#d4b050','#b89030','#dac060'],
  ova_cim:      ['#4a7a28','#5a8a38','#3a6a18'],
  // Çöl
  col_zemin:    ['#c8a050','#b89040','#d8b060','#a88030'],
  col_kumul:    ['#d8c070','#e8d080','#c8b060'],
  col_golge:    ['#8a6830','#9a7840'],
  // Bataklık
  batak_zemin:  ['#2a4a28','#3a5a38','#1a3a18'],
  batak_su:     ['#3a6a5a','#2a5a4a','#4a7a6a'],
  batak_bitki:  ['#4a8a3a','#5a9a4a','#3a7a2a'],
  // Tundra
  tundra_zemin: ['#6a7a8a','#5a6a7a','#7a8a9a'],
  tundra_buz:   ['#a0b8d0','#b0c8e0','#90a8c0'],
  tundra_tas:   ['#7a7a8a','#8a8a9a'],
  // Merkez (antik şehir)
  merkez_zemin: ['#4a4a30','#5a5a40','#3a3a20'],
  merkez_yol:   ['#6a6a50','#7a7a60','#5a5a40'],
};

function pickColor(arr, x, y, seed) {
  return arr[Math.floor(tileRand(x, y, seed) * arr.length)];
}

// ─── TILE ÇİZİM FONKSİYONLARI ───

function drawForestTile(ctx, x, y) {
  const S = TILE_SIZE;
  // Zemin
  ctx.fillStyle = pickColor(PAL.orman_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Çim detay
  for (let i = 0; i < 6; i++) {
    const gx = tileRand(x, y, i*10) * S;
    const gy = tileRand(x, y, i*10+1) * S;
    ctx.fillStyle = pickColor(PAL.ova_cim, x, y, i);
    ctx.fillRect(gx, gy, 3 + tileRand(x,y,i*10+2)*4, 2);
  }
  // Ağaçlar (2-4 adet)
  const agacSayisi = 2 + Math.floor(tileRand(x, y, 99) * 3);
  for (let i = 0; i < agacSayisi; i++) {
    const tx = 6 + tileRand(x, y, i*20) * (S - 12);
    const ty = 8 + tileRand(x, y, i*20+1) * (S - 18);
    // Gövde
    ctx.fillStyle = pickColor(PAL.orman_govde, x, y, i);
    ctx.fillRect(tx - 1, ty, 3, 8);
    // Yaprak (üçgen yığını)
    ctx.fillStyle = pickColor(PAL.orman_yaprak, x, y, i);
    ctx.beginPath();
    ctx.moveTo(tx, ty - 2);
    ctx.lineTo(tx - 5, ty + 4);
    ctx.lineTo(tx + 5, ty + 4);
    ctx.fill();
    ctx.fillStyle = pickColor(PAL.orman_agac, x, y, i+50);
    ctx.beginPath();
    ctx.moveTo(tx, ty - 6);
    ctx.lineTo(tx - 4, ty);
    ctx.lineTo(tx + 4, ty);
    ctx.fill();
  }
}

function drawMountainTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.dag_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Dağ şekilleri (1-2)
  const dagSayisi = 1 + Math.floor(tileRand(x, y, 88) * 2);
  for (let i = 0; i < dagSayisi; i++) {
    const dx = 4 + tileRand(x, y, i*30) * (S - 8);
    const dw = 14 + tileRand(x, y, i*30+1) * 12;
    const dh = 16 + tileRand(x, y, i*30+2) * 14;
    // Gölge
    ctx.fillStyle = pickColor(PAL.dag_golge, x, y, i);
    ctx.beginPath();
    ctx.moveTo(dx, S - 2);
    ctx.lineTo(dx - dw/2 - 2, S - 2);
    ctx.lineTo(dx, S - dh - 2);
    ctx.fill();
    // Dağ gövde
    ctx.fillStyle = pickColor(PAL.dag_kaya, x, y, i);
    ctx.beginPath();
    ctx.moveTo(dx, S - dh);
    ctx.lineTo(dx - dw/2, S - 2);
    ctx.lineTo(dx + dw/2, S - 2);
    ctx.fill();
    // Kar tepesi
    ctx.fillStyle = pickColor(PAL.dag_kar, x, y, i);
    ctx.beginPath();
    ctx.moveTo(dx, S - dh);
    ctx.lineTo(dx - dw/5, S - dh + 5);
    ctx.lineTo(dx + dw/5, S - dh + 5);
    ctx.fill();
  }
  // Küçük taşlar
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = pickColor(PAL.dag_kaya, x, y, i+70);
    const rx = tileRand(x,y,i*15) * S;
    const ry = S - 6 + tileRand(x,y,i*15+1) * 4;
    ctx.fillRect(rx, ry, 3, 2);
  }
}

function drawSeaTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.deniz_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Dalgalar
  for (let i = 0; i < 4; i++) {
    const wy = 4 + i * (S / 4);
    ctx.strokeStyle = pickColor(PAL.deniz_dalga, x, y, i);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const offset = tileRand(x, y, i*5) * 10;
    ctx.moveTo(offset, wy);
    ctx.quadraticCurveTo(S*0.25 + offset, wy - 3, S*0.5 + offset, wy);
    ctx.quadraticCurveTo(S*0.75 + offset, wy + 3, S + offset, wy);
    ctx.stroke();
  }
  // Köpük
  if (tileRand(x, y, 77) > 0.6) {
    ctx.fillStyle = pickColor(PAL.deniz_kopuk, x, y, 0);
    const fx = tileRand(x, y, 78) * (S - 8);
    const fy = tileRand(x, y, 79) * (S - 4);
    ctx.fillRect(fx, fy, 4, 1);
    ctx.fillRect(fx + 2, fy + 1, 3, 1);
  }
}

function drawPlainsTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.ova_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Buğday deseni
  const bugdaySayisi = 3 + Math.floor(tileRand(x, y, 55) * 4);
  for (let i = 0; i < bugdaySayisi; i++) {
    const bx = tileRand(x, y, i*12) * S;
    const by = tileRand(x, y, i*12+1) * S;
    ctx.strokeStyle = pickColor(PAL.ova_bugday, x, y, i);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + 6);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.fillStyle = pickColor(PAL.ova_bugday, x, y, i+30);
    ctx.fillRect(bx - 1, by - 1, 3, 2);
  }
  // Çim parçaları
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = pickColor(PAL.ova_cim, x, y, i+40);
    const gx = tileRand(x,y,i*8+60) * S;
    const gy = tileRand(x,y,i*8+61) * S;
    ctx.fillRect(gx, gy, 2, 1);
  }
}

function drawDesertTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.col_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Kumul
  if (tileRand(x, y, 33) > 0.4) {
    ctx.fillStyle = pickColor(PAL.col_kumul, x, y, 0);
    const kw = 10 + tileRand(x,y,34) * 20;
    const kx = tileRand(x,y,35) * (S - kw);
    const ky = 10 + tileRand(x,y,36) * (S - 15);
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.quadraticCurveTo(kx + kw/2, ky - 5, kx + kw, ky);
    ctx.quadraticCurveTo(kx + kw/2, ky + 2, kx, ky);
    ctx.fill();
  }
  // Gölge
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = pickColor(PAL.col_golge, x, y, i);
    const sx = tileRand(x,y,i*7+40) * S;
    const sy = tileRand(x,y,i*7+41) * S;
    ctx.fillRect(sx, sy, 5, 1);
  }
}

function drawSwampTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.batak_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Su birikintileri
  if (tileRand(x, y, 22) > 0.3) {
    ctx.fillStyle = pickColor(PAL.batak_su, x, y, 0);
    const sw = 6 + tileRand(x,y,23) * 10;
    const sx = tileRand(x,y,24) * (S - sw);
    const sy = tileRand(x,y,25) * (S - sw);
    ctx.beginPath();
    ctx.ellipse(sx + sw/2, sy + sw/3, sw/2, sw/3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bitkiler
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = pickColor(PAL.batak_bitki, x, y, i);
    const px = tileRand(x,y,i*6+30) * S;
    const py = tileRand(x,y,i*6+31) * S;
    ctx.fillRect(px, py - 4, 1, 5);
    ctx.fillRect(px - 1, py - 4, 3, 1);
  }
}

function drawTundraTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.tundra_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Buz parçaları
  if (tileRand(x, y, 11) > 0.5) {
    ctx.fillStyle = pickColor(PAL.tundra_buz, x, y, 0);
    const bx = tileRand(x,y,12) * (S - 10);
    const by = tileRand(x,y,13) * (S - 6);
    ctx.fillRect(bx, by, 8, 4);
  }
  // Taşlar
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = pickColor(PAL.tundra_tas, x, y, i);
    const tx = tileRand(x,y,i*9+20) * S;
    const ty = tileRand(x,y,i*9+21) * S;
    ctx.fillRect(tx, ty, 4, 3);
  }
}

function drawCenterTile(ctx, x, y) {
  const S = TILE_SIZE;
  ctx.fillStyle = pickColor(PAL.merkez_zemin, x, y, 0);
  ctx.fillRect(0, 0, S, S);
  // Yol deseni
  if (tileRand(x, y, 5) > 0.5) {
    ctx.fillStyle = pickColor(PAL.merkez_yol, x, y, 0);
    if (tileRand(x,y,6) > 0.5) {
      ctx.fillRect(0, S/2 - 2, S, 4); // Yatay yol
    } else {
      ctx.fillRect(S/2 - 2, 0, 4, S); // Dikey yol
    }
  }
}

// Bölge → çizim fonksiyonu mapping
const TILE_DRAW = {
  kuzey_bati: drawForestTile,
  kuzey_orta: drawMountainTile,
  kuzey_dogu: drawTundraTile,
  orta_bati:  drawPlainsTile,
  merkez:     drawCenterTile,
  orta_dogu:  drawDesertTile,
  guney_bati: drawSeaTile,
  guney_orta: drawDesertTile,
  guney_dogu: drawSwampTile,
};

// ─── OYUNCU / KOLONİ ÇİZİM ───

function drawCastle(ctx, renk, isim, benMi) {
  const S = TILE_SIZE;
  const cx = S / 2;
  // Kale tabanı
  ctx.fillStyle = benMi ? 'rgba(46,204,113,0.3)' : (renk === '#3498db' ? 'rgba(52,152,219,0.25)' : 'rgba(231,76,60,0.25)');
  ctx.fillRect(2, 2, S - 4, S - 4);
  // Kale duvarı
  ctx.fillStyle = renk;
  ctx.fillRect(cx - 8, 10, 16, 14);
  // Kale kuleleri
  ctx.fillRect(cx - 10, 8, 4, 4);
  ctx.fillRect(cx + 6, 8, 4, 4);
  ctx.fillRect(cx - 2, 6, 4, 4);
  // Kapı
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(cx - 2, 18, 4, 6);
  // Bayrak
  ctx.fillStyle = renk;
  ctx.fillRect(cx - 1, 2, 1, 6);
  ctx.fillRect(cx, 2, 4, 3);
  // İsim
  ctx.fillStyle = renk;
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isim.substring(0, 7), cx, S - 3);
  // Ben çerçeve
  if (benMi) {
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, S - 2, S - 2);
  }
}

function drawKoloni(ctx, kaynakTipi, sahipli) {
  const S = TILE_SIZE;
  const cx = S / 2;
  // Zemin overlay
  ctx.fillStyle = sahipli ? 'rgba(230,126,34,0.2)' : 'rgba(241,196,15,0.15)';
  ctx.fillRect(2, 2, S - 4, S - 4);
  // Maden/kaynak sembolü
  const renk = sahipli ? '#e67e22' : '#f1c40f';
  ctx.fillStyle = renk;
  // Kazma sembolü
  ctx.fillRect(cx - 1, 8, 2, 16);
  ctx.fillRect(cx - 6, 8, 12, 3);
  ctx.fillRect(cx - 6, 8, 3, 6);
  ctx.fillRect(cx + 3, 8, 3, 6);
  // Kaynak yazısı
  ctx.font = '7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(kaynakTipi, cx, S - 4);
  // Çerçeve
  ctx.strokeStyle = renk;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(2, 2, S - 4, S - 4);
  ctx.setLineDash([]);
}

// ─── TILE ÖNBELLEK SİSTEMİ ───

function getTile(x, y, bolgeId) {
  const key = bolgeId + ':' + x + ':' + y;
  if (TILE_CACHE[key]) return TILE_CACHE[key];
  const off = document.createElement('canvas');
  off.width = TILE_SIZE;
  off.height = TILE_SIZE;
  const ctx = off.getContext('2d');
  const drawFn = TILE_DRAW[bolgeId] || drawCenterTile;
  drawFn(ctx, x, y);
  TILE_CACHE[key] = off;
  return off;
}
