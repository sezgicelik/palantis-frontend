/* ═══════════════════════════════════════════════════════
   NOXARA CODEX PALETTE — Ctrl+K her sayfada global arama
   v1.14.0.54 — codex-data.js gerektirir
═══════════════════════════════════════════════════════ */
(function() {
  if (window.noxCodexPaletteInited) return;
  window.noxCodexPaletteInited = true;

  // codex-data.js yuklenene kadar bekle
  function waitData(cb) {
    if (window.CODEX_NODES && window.CODEX_KATEGORILER) return cb();
    setTimeout(() => waitData(cb), 50);
  }

  const STYLE = `
    #nox-cxp-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9998; display:none; align-items:flex-start; justify-content:center; padding-top:10vh; }
    #nox-cxp-backdrop.on { display:flex; animation: nox-cxp-fade 0.15s ease-out }
    @keyframes nox-cxp-fade { from { opacity:0 } to { opacity:1 } }
    #nox-cxp-modal { background:#0d0d10; border:1px solid rgba(212,162,87,0.4); border-radius:8px; width:min(600px, 92vw); max-height:70vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 12px 60px rgba(0,0,0,0.6); }
    #nox-cxp-input { width:100%; padding:14px 16px; background:transparent; border:none; border-bottom:1px solid rgba(212,162,87,0.2); color:#e8dcc8; font-size:15px; font-family:'Crimson Pro',serif; outline:none; }
    #nox-cxp-input::placeholder { color:#666 }
    #nox-cxp-list { overflow-y:auto; max-height:50vh; }
    .nox-cxp-item { display:flex; align-items:center; gap:10px; padding:10px 16px; cursor:pointer; border-left:3px solid transparent; }
    .nox-cxp-item:hover, .nox-cxp-item.sel { background:rgba(212,162,87,0.1); border-left-color:#d4a257 }
    .nox-cxp-icon { font-size:20px; flex-shrink:0 }
    .nox-cxp-mid { flex:1; min-width:0 }
    .nox-cxp-title { font-size:13px; font-weight:600; color:#d4a257 }
    .nox-cxp-ozet { font-size:11px; color:#888; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
    .nox-cxp-kat { font-size:10px; color:#666; padding:2px 6px; border-radius:8px; background:rgba(255,255,255,0.05); flex-shrink:0 }
    .nox-cxp-hint { padding:8px 16px; border-top:1px solid rgba(255,255,255,0.05); font-size:10px; color:#666; display:flex; gap:12px }
    .nox-cxp-kbd { padding:1px 5px; background:rgba(255,255,255,0.08); border-radius:3px; font-family:monospace; font-size:10px }
    .nox-cxp-empty { padding:30px; text-align:center; color:#666; font-size:13px }
    .nox-cxp-lock { opacity:0.5 }
  `;

  function inject() {
    if (document.getElementById('nox-cxp-style')) return;
    const s = document.createElement('style'); s.id = 'nox-cxp-style'; s.textContent = STYLE;
    document.head.appendChild(s);

    const bd = document.createElement('div'); bd.id = 'nox-cxp-backdrop';
    bd.innerHTML = `
      <div id="nox-cxp-modal" onclick="event.stopPropagation()">
        <input id="nox-cxp-input" type="text" placeholder="🔍 Codex'te ara... (birim, bina, mekanik, kaynak)" autocomplete="off">
        <div id="nox-cxp-list"></div>
        <div class="nox-cxp-hint">
          <span><span class="nox-cxp-kbd">↑↓</span> gez</span>
          <span><span class="nox-cxp-kbd">Enter</span> aç</span>
          <span><span class="nox-cxp-kbd">Esc</span> kapat</span>
          <span style="margin-left:auto">Codex</span>
        </div>
      </div>`;
    bd.addEventListener('click', close);
    document.body.appendChild(bd);
  }

  let aktif = [], sel = 0;

  function render(q) {
    const list = document.getElementById('nox-cxp-list');
    q = q.trim().toLowerCase();
    if (!q || q.length < 1) {
      // Defaultta ilk 8 node'u goster (populer ornekler)
      aktif = window.CODEX_NODES.slice(0, 8);
    } else {
      aktif = window.CODEX_NODES.filter(n =>
        n.baslik.toLowerCase().includes(q) ||
        n.ozet.toLowerCase().includes(q) ||
        n.id.includes(q) ||
        (n.aciklama && n.aciklama.toLowerCase().includes(q))
      ).slice(0, 20);
    }
    sel = 0;
    if (!aktif.length) {
      list.innerHTML = '<div class="nox-cxp-empty">Sonuç yok. <br><span style="font-size:11px">Farklı bir kelime dene.</span></div>';
      return;
    }
    const kategoriMap = Object.fromEntries(window.CODEX_KATEGORILER.map(k => [k.id, k]));
    list.innerHTML = aktif.map((n, i) => {
      const k = kategoriMap[n.kategori];
      const kilitli = n.kilit?.aktif;
      return `<div class="nox-cxp-item ${i===0?'sel':''} ${kilitli?'nox-cxp-lock':''}" data-id="${n.id}" data-idx="${i}">
        <div class="nox-cxp-icon">${kilitli ? '🔒' : n.ikon}</div>
        <div class="nox-cxp-mid">
          <div class="nox-cxp-title" style="color:${k?.renk||'#d4a257'}">${kilitli ? '???' : n.baslik}</div>
          <div class="nox-cxp-ozet">${kilitli ? (n.kilit.ipucu||'Kilitli') : n.ozet}</div>
        </div>
        <div class="nox-cxp-kat">${k?.ikon||''} ${k?.isim||''}</div>
      </div>`;
    }).join('');
    Array.from(list.querySelectorAll('.nox-cxp-item')).forEach(el => {
      el.addEventListener('click', () => go(el.dataset.id));
      el.addEventListener('mouseenter', () => setSel(parseInt(el.dataset.idx)));
    });
  }

  function setSel(i) {
    sel = Math.max(0, Math.min(aktif.length - 1, i));
    Array.from(document.querySelectorAll('.nox-cxp-item')).forEach((el, j) => {
      el.classList.toggle('sel', j === sel);
    });
    const selEl = document.querySelectorAll('.nox-cxp-item')[sel];
    if (selEl) selEl.scrollIntoView({ block:'nearest' });
  }

  function go(id) {
    close();
    window.location.href = 'codex.html?node=' + encodeURIComponent(id);
  }

  function open() {
    const bd = document.getElementById('nox-cxp-backdrop');
    bd.classList.add('on');
    render('');
    setTimeout(() => document.getElementById('nox-cxp-input').focus(), 50);
  }

  function close() {
    const bd = document.getElementById('nox-cxp-backdrop');
    bd.classList.remove('on');
    document.getElementById('nox-cxp-input').value = '';
  }

  waitData(() => {
    inject();
    document.getElementById('nox-cxp-input').addEventListener('input', (e) => render(e.target.value));
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open();
        return;
      }
      const bd = document.getElementById('nox-cxp-backdrop');
      if (!bd || !bd.classList.contains('on')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(sel + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(sel - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const id = aktif[sel]?.id; if (id) go(id);
      }
    });
    // Expose global
    window.noxCodexOpen = open;
  });
})();
