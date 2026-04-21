/* ═══════════════════════════════════════════════════════
   NOXARA CODEX TOOLTIP — data-codex-id ile hover preview
   v1.14.0.54 — her sayfada auto-wire
═══════════════════════════════════════════════════════ */
(function() {
  if (window.noxCodexTooltipInited) return;
  window.noxCodexTooltipInited = true;

  function waitData(cb) {
    if (window.CODEX_NODES) return cb();
    setTimeout(() => waitData(cb), 50);
  }

  const STYLE = `
    #nox-cxt-tip { position:fixed; z-index:9997; background:#0d0d10; border:1px solid rgba(212,162,87,0.5); border-radius:6px; padding:10px 12px; max-width:280px; box-shadow:0 8px 24px rgba(0,0,0,0.6); font-family:'Crimson Pro',serif; pointer-events:none; opacity:0; transform:translateY(4px); transition:0.15s; }
    #nox-cxt-tip.on { opacity:1; transform:translateY(0) }
    #nox-cxt-tip .cxt-head { display:flex; align-items:center; gap:8px; margin-bottom:6px }
    #nox-cxt-tip .cxt-ikon { font-size:24px }
    #nox-cxt-tip .cxt-title { font-size:13px; font-weight:700; color:#d4a257; font-family:'Cinzel',serif }
    #nox-cxt-tip .cxt-kat { font-size:10px; color:#888; padding:2px 6px; border-radius:8px; background:rgba(255,255,255,0.05); margin-left:auto }
    #nox-cxt-tip .cxt-ozet { font-size:12px; color:#bbb; line-height:1.4 }
    #nox-cxt-tip .cxt-footer { font-size:10px; color:#666; margin-top:6px; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px }
    [data-codex-id]:not(a) { cursor:help; border-bottom:1px dotted rgba(212,162,87,0.3) }
    .nox-cxt-badge { display:inline-block; font-size:10px; padding:1px 5px; background:rgba(212,162,87,0.15); color:#d4a257; border-radius:3px; margin-left:4px; cursor:pointer }
    .nox-cxt-badge:hover { background:rgba(212,162,87,0.3) }
  `;

  let tipEl;
  function ensureTip() {
    if (tipEl) return tipEl;
    const s = document.createElement('style'); s.textContent = STYLE; document.head.appendChild(s);
    tipEl = document.createElement('div'); tipEl.id = 'nox-cxt-tip';
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function show(target) {
    const id = target.dataset.codexId;
    const node = window.codexGetNode(id);
    if (!node) return;
    const kat = window.CODEX_KATEGORILER.find(k => k.id === node.kategori);
    const tip = ensureTip();
    tip.innerHTML = `
      <div class="cxt-head">
        <div class="cxt-ikon">${node.ikon}</div>
        <div class="cxt-title">${node.baslik}</div>
        <div class="cxt-kat">${kat?.ikon||''} ${kat?.isim||''}</div>
      </div>
      <div class="cxt-ozet">${node.ozet||''}</div>
      <div class="cxt-footer">📖 Tıkla → Codex'te aç</div>`;
    const r = target.getBoundingClientRect();
    const vw = window.innerWidth;
    let x = r.left + r.width / 2 - 140;
    let y = r.bottom + 8;
    if (x < 8) x = 8;
    if (x + 280 > vw - 8) x = vw - 288;
    if (y + 120 > window.innerHeight - 8) y = r.top - 120;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.classList.add('on');
    tip.style.pointerEvents = 'auto';
    tip.onclick = () => { window.location.href = 'codex.html?node=' + encodeURIComponent(id); };
  }

  function hide() {
    if (!tipEl) return;
    tipEl.classList.remove('on');
    tipEl.style.pointerEvents = 'none';
  }

  waitData(() => {
    // Event delegation — sayfa her yenilendiginde yeni element'ler icin calisir
    document.addEventListener('mouseenter', (e) => {
      const t = e.target.closest ? e.target.closest('[data-codex-id]') : null;
      if (t) show(t);
    }, true);
    document.addEventListener('mouseleave', (e) => {
      const t = e.target.closest ? e.target.closest('[data-codex-id]') : null;
      if (t) setTimeout(hide, 200);
    }, true);
    document.addEventListener('click', (e) => {
      const t = e.target.closest ? e.target.closest('[data-codex-id][data-codex-link]') : null;
      if (t) {
        e.preventDefault();
        window.location.href = 'codex.html?node=' + encodeURIComponent(t.dataset.codexId);
      }
    });
  });
})();
