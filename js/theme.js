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
  // v1.14.0.96: irk temasi uygulandiktan sonra parsomen override (parsomen aktifse)
  if (typeof applyColorTheme === 'function') applyColorTheme();
}

/* ═══════════════════════════════════════════════════════════
   v1.14.0.96 — RENK TEMASI (karanlik / parsomen)
   Ayarlar > sablon karti'nda secilen modu uygular.
   Parsomen modu irk renklerinin uzerine gelir — body bg'yi override eder.
═══════════════════════════════════════════════════════════ */
function applyColorTheme(mode) {
  try {
    // Arg verilmediyse localStorage'dan oku
    if (!mode) mode = localStorage.getItem('noxara_renk_temasi') || 'karanlik';
  } catch(e) { mode = 'karanlik'; }

  if (mode === 'parsomen') {
    document.body.classList.add('tema-parsomen');
    // Parsomen kendi zeminini --dark-bg'den alir; irk bg'sini sifirla
    document.body.style.background = '';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#d2c09e';
  } else {
    document.body.classList.remove('tema-parsomen');
  }
}

// Auto-apply: her sayfa yuklendiginde localStorage'dan renk temasini uygula
if (typeof window !== 'undefined') {
  window.applyColorTheme = applyColorTheme;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ applyColorTheme(); });
  } else {
    applyColorTheme();
  }
}
