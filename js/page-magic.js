/* ══════════════════════════════════
   WORSHIPPER & MANA SiSTEMi
   Extracted from index.html
══════════════════════════════════ */

function setWorshippers(n) {
  WORSHIPPERS.count = Math.min(Math.max(0, n), WORSHIPPERS.max);
  WORSHIPPERS.manaPerHour = Math.floor(WORSHIPPERS.count * 0.5);
  const el = document.getElementById('worshipper-count');
  if (el) el.textContent = WORSHIPPERS.count;
  const mp = document.getElementById('worshipper-mana');
  if (mp) mp.textContent = WORSHIPPERS.manaPerHour;
}
