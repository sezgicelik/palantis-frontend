/* ═══════════════════════════════════════════════════════
   NOXARA MODAL — site-içi custom modal (alert/confirm/prompt)
   v1.14.3.0 — Sezgi: 'tarayıcı popup'ları çirkin'
   ═══════════════════════════════════════════════════════
   Kullanım:
     await noxAlert('Mesaj')
     const onayli = await noxConfirm('Emin misin?')
     const adet = await noxPrompt('Kaç adet?', '1')   // string|null
     const secim = await noxChoice('Tip seç?', 'Hızlı', 'Normal')  // 0|1|null

   Hepsi Promise döner. ESC kapatma destekli.
═══════════════════════════════════════════════════════ */

(function() {
  if (window.noxAlert) return; // tek yükleme

  // CSS inject (her sayfada bir kez)
  function _ensureCss() {
    if (document.getElementById('nox-modal-css')) return;
    const css = document.createElement('style');
    css.id = 'nox-modal-css';
    css.textContent = `
      .nox-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.78); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 16px; opacity: 0; transition: opacity .15s ease;
      }
      .nox-overlay.show { opacity: 1; }
      .nox-modal {
        background: linear-gradient(180deg, #1a1410 0%, #0a0604 100%);
        border: 2px solid #c8a96e;
        border-radius: 10px;
        max-width: 460px; width: 100%;
        padding: 22px;
        color: #e8dcc4;
        font-family: 'Crimson Pro', system-ui, sans-serif;
        box-shadow: 0 0 50px rgba(212,175,55,.2);
        transform: translateY(-10px); transition: transform .15s ease;
      }
      .nox-overlay.show .nox-modal { transform: translateY(0); }
      .nox-modal-title {
        font-family: 'Cinzel', serif;
        font-size: 16px; font-weight: 700;
        color: #d4af37;
        margin: 0 0 10px;
        letter-spacing: 2px;
        text-align: center;
      }
      .nox-modal-msg {
        font-size: 14px; line-height: 1.6;
        color: #e8dcc4;
        margin: 0 0 16px;
        white-space: pre-wrap;
      }
      .nox-modal-input {
        width: 100%; box-sizing: border-box;
        padding: 9px 12px;
        background: #0a0604;
        border: 1px solid #3a3020;
        border-radius: 5px;
        color: #e8dcc4;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        margin-bottom: 14px;
      }
      .nox-modal-input:focus { outline: none; border-color: #c8a96e; }
      .nox-modal-btns {
        display: flex; gap: 8px; justify-content: center;
        flex-wrap: wrap;
      }
      .nox-modal-btn {
        padding: 8px 22px; border-radius: 5px;
        border: 1px solid #3a3020;
        background: rgba(212,175,55,.06);
        color: #c8a96e;
        cursor: pointer;
        font-family: 'Cinzel', serif;
        font-size: 12px;
        letter-spacing: 1px;
        font-weight: 600;
        transition: all .12s;
        min-width: 100px;
      }
      .nox-modal-btn:hover {
        background: #d4af37; color: #0a0604; border-color: #d4af37;
      }
      .nox-modal-btn.primary {
        background: rgba(212,175,55,.15);
        border-color: #c8a96e;
        color: #d4af37;
      }
      .nox-modal-btn.danger {
        background: rgba(231,76,60,.10);
        border-color: rgba(231,76,60,.5);
        color: #e74c3c;
      }
      .nox-modal-btn.danger:hover { background: #e74c3c; color: #fff; border-color: #e74c3c; }
      @media (max-width: 480px) {
        .nox-modal { padding: 18px; }
        .nox-modal-btn { flex: 1; min-width: 0; padding: 10px 14px; }
      }
    `;
    document.head.appendChild(css);
  }

  // Generic modal — buttons array: [{label, value, primary?, danger?}]
  function _modal({ title, msg, input, defaultInput, buttons }) {
    _ensureCss();
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'nox-overlay';

      const modal = document.createElement('div');
      modal.className = 'nox-modal';
      modal.tabIndex = -1;

      let html = '';
      if (title) html += `<h3 class="nox-modal-title">${_esc(title)}</h3>`;
      if (msg) html += `<div class="nox-modal-msg">${_esc(msg)}</div>`;
      if (input) {
        html += `<input class="nox-modal-input" id="nox-modal-input" placeholder="${_esc(input)}" value="${_esc(defaultInput || '')}">`;
      }
      html += `<div class="nox-modal-btns">`;
      buttons.forEach((b, i) => {
        const cls = b.primary ? 'primary' : (b.danger ? 'danger' : '');
        html += `<button class="nox-modal-btn ${cls}" data-i="${i}">${_esc(b.label)}</button>`;
      });
      html += `</div>`;
      modal.innerHTML = html;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Animate in
      requestAnimationFrame(() => overlay.classList.add('show'));

      const inputEl = modal.querySelector('.nox-modal-input');
      if (inputEl) {
        setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
      }

      function close(value) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 180);
        document.removeEventListener('keydown', onKey);
        resolve(value);
      }

      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(null); }
        if (e.key === 'Enter' && (inputEl || buttons.find(b => b.primary))) {
          e.preventDefault();
          const val = inputEl ? inputEl.value : true;
          // Primary butonun değerini al
          const primIdx = buttons.findIndex(b => b.primary);
          const primaryBtn = buttons[primIdx >= 0 ? primIdx : 0];
          close(input ? val : primaryBtn.value);
        }
      }
      document.addEventListener('keydown', onKey);

      // Button click
      modal.querySelectorAll('.nox-modal-btn').forEach(btn => {
        btn.onclick = () => {
          const i = parseInt(btn.dataset.i);
          const btnDef = buttons[i];
          const val = input && btnDef.value !== false ? (inputEl ? inputEl.value : btnDef.value) : btnDef.value;
          close(val);
        };
      });

      // Overlay click — kapat
      overlay.onclick = (e) => { if (e.target === overlay) close(null); };
    });
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  }

  // alert eşdeğeri — tek "Tamam" butonu
  window.noxAlert = function(msg, title = '') {
    return _modal({
      title: title || 'Bilgi',
      msg,
      buttons: [{ label: 'Tamam', value: true, primary: true }]
    });
  };

  // confirm eşdeğeri — Evet/Hayır
  window.noxConfirm = function(msg, title = '') {
    return _modal({
      title: title || 'Onay',
      msg,
      buttons: [
        { label: 'İptal', value: false },
        { label: 'Onayla', value: true, primary: true }
      ]
    }).then(v => v === true);
  };

  // prompt eşdeğeri — input + Tamam/İptal
  window.noxPrompt = function(msg, defaultValue = '', title = '') {
    return _modal({
      title: title || 'Giriş',
      msg,
      input: defaultValue || '...',
      defaultInput: defaultValue,
      buttons: [
        { label: 'İptal', value: null },
        { label: 'Tamam', value: '__INPUT__', primary: true }
      ]
    }).then(v => {
      if (v === null || v === false) return null;
      // _modal Enter'da input value döndürür, button click'te '__INPUT__' işareti
      // ama input varsa buton tıklanırsa direk input'tan alır — _modal'da handled
      return typeof v === 'string' ? v : null;
    });
  };

  // 2 seçenekli soru — örn "Hızlı (1) / Normal (2)"
  // dönen: 0 (ilk), 1 (ikinci), null (iptal)
  window.noxChoice = function(msg, secenek1, secenek2, title = '') {
    return _modal({
      title: title || 'Seçim',
      msg,
      buttons: [
        { label: 'İptal', value: null },
        { label: secenek1, value: 0 },
        { label: secenek2, value: 1, primary: true }
      ]
    }).then(v => v);
  };

  // Tehlikeli onay (kırmızı) — örn yıkım, ban, silme
  window.noxConfirmDanger = function(msg, title = 'DİKKAT', onayLabel = 'Yık') {
    return _modal({
      title,
      msg,
      buttons: [
        { label: 'İptal', value: false, primary: true },
        { label: onayLabel, value: true, danger: true }
      ]
    }).then(v => v === true);
  };
})();
