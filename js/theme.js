/* theme.js — Palantis theme application */

function applyTheme(irk) {
  // Tum tema siniflarini temizle
  const temaIrklar = ['insan','elf','cuce','bucukluk','kara_elf','ork','ogre_irk','undead'];
  temaIrklar.forEach(t => document.body.classList.remove('theme-' + t));
  if (irk) document.body.classList.add('theme-' + irk);
}
