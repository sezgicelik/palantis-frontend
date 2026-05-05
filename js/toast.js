/* toast.js — Noxara toast notification (v2.0 modern + stackable + mobile-first)
 *
 * Geriye uyumlu: toast(msg), showToast(msg, type) — tum eski cagrilar calisir.
 * Yeni:
 *   - Stack: birden fazla toast alt alta dizilir (oncekini ezmez)
 *   - Tip-bazli ikon + renk
 *   - Tip-bazli sure (success 3sn, info 3sn, warning 4sn, error 5sn)
 *   - Mobil: alt-orta full-width, dokunma ile kapanir
 *   - Desktop: sag-alt, hover'da pause
 *   - X butonu ile manuel kapatma
 *   - Coklu cagri ust uste binmek yerine sira ile dizilir (max 5 gorunur)
 */

(function(){
  'use strict';

  // === STACK CONTAINER ===
  let stackEl = null;
  function ensureStack(){
    if (stackEl) return stackEl;
    stackEl = document.createElement('div');
    stackEl.id = 'nox-toast-stack';
    document.body.appendChild(stackEl);
    injectStyles();
    return stackEl;
  }

  function injectStyles(){
    if (document.getElementById('nox-toast-styles')) return;
    const css = document.createElement('style');
    css.id = 'nox-toast-styles';
    css.textContent = `
      #nox-toast-stack {
        position: fixed;
        right: 16px;
        bottom: 22px;
        z-index: 99999;
        display: flex;
        flex-direction: column-reverse;
        gap: 8px;
        max-width: 380px;
        pointer-events: none;
      }
      .nox-toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #1a1410;
        border: 1px solid #3a3020;
        border-left: 4px solid #2980b9;
        color: #f0e8d8;
        padding: 11px 36px 11px 14px;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.5);
        font-family: 'Cinzel', 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.4;
        min-width: 260px;
        max-width: 380px;
        opacity: 0;
        transform: translateX(20px) scale(0.96);
        transition: opacity .25s ease, transform .25s ease;
        position: relative;
        cursor: default;
      }
      .nox-toast.show { opacity: 1; transform: translateX(0) scale(1); }
      .nox-toast.hide { opacity: 0; transform: translateX(20px) scale(0.95); }

      .nox-toast-icon {
        font-size: 20px;
        line-height: 1;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .nox-toast-msg {
        flex: 1;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      .nox-toast-close {
        position: absolute;
        top: 6px; right: 8px;
        background: none; border: none;
        color: rgba(255,255,255,0.5);
        font-size: 18px; line-height: 1;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all .15s;
      }
      .nox-toast-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

      .nox-toast-progress {
        position: absolute;
        bottom: 0; left: 0;
        height: 2px;
        background: currentColor;
        opacity: 0.5;
        animation: nox-toast-progress linear forwards;
        border-bottom-left-radius: 8px;
      }
      @keyframes nox-toast-progress {
        from { width: 100%; }
        to   { width: 0%; }
      }

      /* Tip varyantlari */
      .nox-toast.t-success { border-left-color: #27ae60; }
      .nox-toast.t-success .nox-toast-icon { color: #27ae60; }
      .nox-toast.t-error   { border-left-color: #c0392b; }
      .nox-toast.t-error   .nox-toast-icon { color: #ff6b6b; }
      .nox-toast.t-warning { border-left-color: #e67e22; }
      .nox-toast.t-warning .nox-toast-icon { color: #f39c12; }
      .nox-toast.t-info    { border-left-color: #2980b9; }
      .nox-toast.t-info    .nox-toast-icon { color: #5dade2; }
      .nox-toast.t-coin    { border-left-color: #d4af37; }
      .nox-toast.t-coin    .nox-toast-icon { color: #f1c40f; }
      .nox-toast.t-war     { border-left-color: #c0392b; }
      .nox-toast.t-war     .nox-toast-icon { color: #ff6b6b; }

      /* Mobile — alt-orta full-width */
      @media (max-width: 768px) {
        #nox-toast-stack {
          left: 8px;
          right: 8px;
          bottom: 90px; /* bottom-nav uzerinde */
          max-width: none;
        }
        .nox-toast {
          min-width: 0;
          max-width: none;
          font-size: 14px;
          padding: 12px 38px 12px 14px;
        }
        .nox-toast-close { font-size: 20px; padding: 6px 10px; }
      }

      /* Tema-parsomen uyumu */
      body.tema-parsomen .nox-toast {
        background: linear-gradient(180deg, #f4e7c7 0%, #ebdbb5 100%);
        color: #1a1208;
        border-color: #8b6914;
      }
      body.tema-parsomen .nox-toast-close { color: rgba(26,18,8,0.5); }
      body.tema-parsomen .nox-toast-close:hover { background: rgba(0,0,0,0.08); color: #1a1208; }

      /* Eski #toast elementi varsa — gizle (yeni stack kullaniliyor) */
      #toast { display: none !important; }
    `;
    document.head.appendChild(css);
  }

  // === CONFIG ===
  const ICONS = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
    coin:    '🪙',
    war:     '⚔',
  };
  const DURATIONS = {
    success: 3000,
    info:    3000,
    coin:    3500,
    warning: 4000,
    error:   5000,
    war:     5000,
  };

  // === MAX TOAST COUNT ===
  const MAX_VISIBLE = 5;

  // === SHOW LOGIC ===
  function show(msg, type){
    if (!msg) return;
    type = (type && ICONS[type]) ? type : 'info';
    ensureStack();

    // Limit: en eski toast'i kaldir
    while (stackEl.children.length >= MAX_VISIBLE) {
      const old = stackEl.children[0];
      if (old) dismiss(old);
      else break;
    }

    const toastEl = document.createElement('div');
    toastEl.className = 'nox-toast t-' + type;
    toastEl.innerHTML = `
      <span class="nox-toast-icon">${ICONS[type]}</span>
      <span class="nox-toast-msg"></span>
      <button class="nox-toast-close" aria-label="Kapat">×</button>
      <div class="nox-toast-progress" style="animation-duration: ${DURATIONS[type]}ms; color: currentColor"></div>
    `;
    toastEl.querySelector('.nox-toast-msg').textContent = msg;

    // Close button
    toastEl.querySelector('.nox-toast-close').addEventListener('click', () => dismiss(toastEl));

    // Hover pause (desktop)
    let timer = null;
    let remaining = DURATIONS[type];
    let startedAt = 0;

    function startTimer(){
      startedAt = Date.now();
      timer = setTimeout(() => dismiss(toastEl), remaining);
    }
    function pauseTimer(){
      if (!timer) return;
      clearTimeout(timer); timer = null;
      remaining -= (Date.now() - startedAt);
    }

    toastEl.addEventListener('mouseenter', () => {
      pauseTimer();
      const prog = toastEl.querySelector('.nox-toast-progress');
      if (prog) prog.style.animationPlayState = 'paused';
    });
    toastEl.addEventListener('mouseleave', () => {
      if (remaining > 0) startTimer();
      const prog = toastEl.querySelector('.nox-toast-progress');
      if (prog) prog.style.animationPlayState = 'running';
    });

    // Mobile: dokunma ile kapan (uzun basis degil, kisa tap)
    let touchStartX = 0; let touchStartY = 0;
    toastEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    }, { passive: true });
    toastEl.addEventListener('touchend', (e) => {
      const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
      const dy = (e.changedTouches[0]?.clientY || 0) - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dy) < 30) dismiss(toastEl); // swipe horizontal
    });

    stackEl.appendChild(toastEl);
    // Trigger animation
    requestAnimationFrame(() => toastEl.classList.add('show'));
    startTimer();
  }

  function dismiss(toastEl){
    if (!toastEl || toastEl.classList.contains('hide')) return;
    toastEl.classList.add('hide');
    toastEl.classList.remove('show');
    setTimeout(() => { if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); }, 280);
  }

  // === BACKWARD-COMPAT API ===
  // toast(msg) — eski cagrilar
  function toast(msg){ show(msg, 'info'); }

  // showToast(msg, type) — eski cagrilar
  function showToast(msg, type){
    // Tip aliaslari (eskiler 'success'/'error'/'warning'/'info' gondermis)
    const t = (type || 'info').toString().toLowerCase();
    show(msg, t);
  }

  // Yeni temiz API — kullanici hangi tipi istiyorsa
  const NoxToast = {
    show, dismiss,
    success: (m) => show(m, 'success'),
    error:   (m) => show(m, 'error'),
    warning: (m) => show(m, 'warning'),
    info:    (m) => show(m, 'info'),
    coin:    (m) => show(m, 'coin'),
    war:     (m) => show(m, 'war'),
    clear:   () => { if (stackEl) stackEl.innerHTML = ''; },
  };

  // === EXPORT ===
  if (typeof window !== 'undefined') {
    window.toast = toast;
    window.showToast = showToast;
    window.NoxToast = NoxToast;
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureStack);
  } else {
    ensureStack();
  }
})();
