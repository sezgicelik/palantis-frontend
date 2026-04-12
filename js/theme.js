/* theme.js — Palantis irk temasi
   V4 uyumlu: irk bazli accent renk + arka plan gecisi */

const RACE_THEMES = {
  insan:    { side:'light', accent:'#d4a257', bg:'#1a1608' },
  elf:      { side:'light', accent:'#4CAF50', bg:'#0a160a' },
  cuce:     { side:'light', accent:'#FF9800', bg:'#1a1205' },
  bucukluk: { side:'light', accent:'#8BC34A', bg:'#0f1608' },
  kara_elf: { side:'dark',  accent:'#9C27B0', bg:'#140a16' },
  ork:      { side:'dark',  accent:'#f44336', bg:'#1a0a08' },
  ogre_irk: { side:'dark',  accent:'#795548', bg:'#160f0a' },
  undead:   { side:'dark',  accent:'#607D8B', bg:'#0a0f14' },
};

function applyTheme(irk) {
  // Tum tema siniflarini temizle
  const temaIrklar = Object.keys(RACE_THEMES);
  temaIrklar.forEach(function(t) { document.body.classList.remove('theme-' + t); });
  if (irk && RACE_THEMES[irk]) {
    document.body.classList.add('theme-' + irk);
    // Radial glow efekti
    var r = RACE_THEMES[irk];
    document.body.style.background = 'linear-gradient(145deg, #08080c 0%, ' + r.bg + ' 50%, #0a0a0f 100%)';
    // Meta theme-color guncelle (mobil tarayici)
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = r.accent;
  }
}
