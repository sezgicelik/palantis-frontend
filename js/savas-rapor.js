/* ═══════════════════════════════════════════════════════
   PALANTİS — SAVAŞ RAPORU MODAL
   js/savas-rapor.js
   v1.3: Gerçek savaş sonuçlarını gösteren modal
═══════════════════════════════════════════════════════ */

// Modal HTML'i body'ye ekle (sayfa yüklendiğinde)
(function initSavasRaporModal() {
  if (document.getElementById('savas-rapor-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'savas-rapor-modal';
  modal.className = 'sr-overlay';
  modal.innerHTML = '<div class="sr-box" id="savas-rapor-box"></div>';
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeSavasRapor();
  });
  document.body.appendChild(modal);

  // CSS ekle
  const style = document.createElement('style');
  style.textContent = `
    .sr-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.85); z-index:9999; overflow-y:auto; padding:20px; }
    .sr-overlay.open { display:flex; justify-content:center; align-items:flex-start; }
    .sr-box { background:var(--card-bg,#1a1a2e); border:1px solid var(--border,#333); border-radius:12px; max-width:800px; width:100%; padding:24px; color:var(--text,#e0e0e0); font-family:'Segoe UI',sans-serif; margin:20px auto; }
    .sr-title { font-family:'Cinzel',serif; font-size:1.2rem; text-align:center; color:var(--gold,#ffd700); margin-bottom:4px; }
    .sr-sub { text-align:center; font-size:.65rem; color:var(--text-dim,#888); margin-bottom:12px; }
    .sr-result { text-align:center; font-size:1rem; font-weight:bold; padding:8px; border-radius:8px; margin-bottom:16px; }
    .sr-result.win { background:rgba(40,167,69,.15); color:#5cb85c; border:1px solid rgba(40,167,69,.3); }
    .sr-result.lose { background:rgba(220,53,69,.15); color:#dc3545; border:1px solid rgba(220,53,69,.3); }
    .sr-result.draw { background:rgba(255,193,7,.15); color:#ffc107; border:1px solid rgba(255,193,7,.3); }
    .sr-cards { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
    .sr-card { flex:1; min-width:200px; background:rgba(255,255,255,.03); border:1px solid var(--border,#333); border-radius:8px; padding:12px; }
    .sr-card-title { font-family:'Cinzel',serif; font-size:.7rem; margin-bottom:8px; text-align:center; }
    .sr-card-title.atk { color:#E8A0A0; }
    .sr-card-title.def { color:#A0C8F0; }
    .sr-stat { display:flex; justify-content:space-between; font-size:.65rem; padding:2px 0; border-bottom:1px solid rgba(255,255,255,.05); }
    .sr-stat-k { color:var(--text-dim,#888); }
    .sr-stat-v { font-weight:600; }
    .sr-vs { display:flex; align-items:center; font-family:'Cinzel',serif; font-size:.8rem; color:var(--gold,#ffd700); padding:0 8px; }
    .sr-div { border-top:1px solid var(--border,#333); margin:12px 0; }
    .sr-sec { font-family:'Cinzel',serif; font-size:.7rem; color:var(--gold,#ffd700); margin-bottom:8px; }
    .sr-table { width:100%; border-collapse:collapse; font-size:.6rem; }
    .sr-table th { background:rgba(255,255,255,.05); padding:6px 4px; text-align:center; border:1px solid var(--border,#333); }
    .sr-table td { padding:5px 4px; text-align:center; border:1px solid rgba(255,255,255,.05); }
    .sr-table .td-tur { font-weight:bold; color:var(--gold,#ffd700); }
    .sr-table .td-kayip { color:#dc3545; }
    .sr-table .td-kalan { font-weight:600; }
    .sr-table tr:nth-child(even) { background:rgba(255,255,255,.02); }
    .sr-ganimet { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
    .sr-ganimet-item { background:rgba(255,215,0,.08); border:1px solid rgba(255,215,0,.2); border-radius:6px; padding:4px 10px; font-size:.6rem; }
    .sr-ganimet-item span { color:var(--gold,#ffd700); font-weight:bold; }
    .sr-close { position:absolute; top:8px; right:12px; background:none; border:none; color:var(--text-dim,#888); font-size:.8rem; cursor:pointer; }
    .sr-close:hover { color:#fff; }
    .sr-btn-row { display:flex; justify-content:center; gap:8px; margin-top:12px; }
    .sr-btn { padding:6px 16px; border-radius:6px; border:1px solid var(--border,#333); background:rgba(255,255,255,.05); color:var(--text,#e0e0e0); cursor:pointer; font-size:.6rem; }
    .sr-btn:hover { background:rgba(255,255,255,.1); }
    .sr-kayip-detail { font-size:.55rem; color:var(--text-dim,#888); margin-top:4px; }
    @media (max-width:600px) { .sr-cards { flex-direction:column; } .sr-vs { display:none; } }
  `;
  document.head.appendChild(style);
})();

function closeSavasRapor() {
  document.getElementById('savas-rapor-modal').classList.remove('open');
}

/**
 * Savaş sonucunu modal olarak göster
 * @param {Object} sonuc - Backend'den gelen savaş sonucu
 * @param {string} benimTaraf - 'saldiran' veya 'savunan'
 * @param {Object} opts - { saldiranAdi, savunanAdi, tip }
 */
function showSavasRapor(sonuc, benimTaraf, opts) {
  const fmt = n => (n || 0).toLocaleString('tr-TR');
  const box = document.getElementById('savas-rapor-box');

  const kazandim = (benimTaraf === 'saldiran' && sonuc.kazanan === 'saldiran') ||
                   (benimTaraf === 'savunan' && sonuc.kazanan === 'savunan');
  const berabere = sonuc.kazanan === 'berabere';
  const resultClass = berabere ? 'draw' : (kazandim ? 'win' : 'lose');
  const resultText = berabere ? 'BERABERE' : (kazandim ? 'ZAFER!' : 'YENILGI');
  const resultIcon = berabere ? '⚔' : (kazandim ? '🏆' : '💀');

  const saldiranAdi = opts?.saldiranAdi || 'Saldıran';
  const savunanAdi = opts?.savunanAdi || 'Savunan';
  const tip = opts?.tip === 'koloni' ? 'Koloni Muharebesi' : 'PvP Muharebe';

  // Kayip detaylarini olustur
  function kayipStr(kayiplar) {
    if (!kayiplar || Object.keys(kayiplar).length === 0) return 'Kayıp yok';
    return Object.entries(kayiplar).map(function(e) {
      const uid = e[0], adet = e[1];
      const u = typeof UNITS !== 'undefined' ? UNITS[uid] : null;
      const name = u ? (u.name || uid) : uid;
      return name + ': -' + fmt(adet);
    }).join(', ');
  }

  // v1.14.0.5: Baslangic ordu kompozisyonu
  function baslangicStr(uniteler) {
    if (!uniteler || Object.keys(uniteler).length === 0) return 'Bilinmiyor';
    // Sentetik ID'leri temizle (e.g. "piyade__army_47")
    const temizlenmis = {};
    for (const [key, adet] of Object.entries(uniteler)) {
      const realId = key.replace(/__army_\d+$/, '');
      temizlenmis[realId] = (temizlenmis[realId] || 0) + adet;
    }
    return Object.entries(temizlenmis).map(function(e) {
      const uid = e[0], adet = e[1];
      const u = typeof UNITS !== 'undefined' ? UNITS[uid] : null;
      const name = u ? (u.name || uid) : uid;
      return name + ': ' + fmt(adet);
    }).join(', ');
  }
  function baslangicToplam(uniteler) {
    if (!uniteler) return 0;
    return Object.entries(uniteler).reduce(function(t, e) {
      // Kule virtual uniteleri sayma (kule_okcu vs. zaten kule unit) — ama safety
      return t + (parseInt(e[1]) || 0);
    }, 0);
  }

  // Tur detay satırlari
  let turRows = '';
  if (sonuc.tur_detay && sonuc.tur_detay.length > 0) {
    turRows = sonuc.tur_detay.map(function(t) {
      return '<tr>' +
        '<td class="td-tur">' + t.tur + '</td>' +
        '<td>' + fmt(t.saldiran_atk) + '</td>' +
        '<td class="td-kayip">' + (t.savunan_hasar > 0 ? '-' + fmt(t.savunan_hasar) : '0') + '</td>' +
        '<td class="td-kalan">' + fmt(t.saldiran_kalan) + '</td>' +
        '<td>' + fmt(t.savunan_atk) + '</td>' +
        '<td class="td-kayip">' + (t.saldiran_hasar > 0 ? '-' + fmt(t.saldiran_hasar) : '0') + '</td>' +
        '<td class="td-kalan">' + fmt(t.savunan_kalan) + '</td>' +
        '</tr>';
    }).join('');
  }

  // Ganimet — v1.13.68: yapisal gosterim (savas_alani + sehir_yagmasi + alan + koylu + esir)
  let ganimetHTML = '';
  const g = sonuc.ganimet || {};
  const ganimetItemleri = [];
  const ikon = function(k) { return (typeof RICONS !== 'undefined' && RICONS[k]) ? RICONS[k] : ''; };
  // Savas alani ganimeti (olen unite maliyeti bazli kaynak)
  if (g.savas_alani && Object.keys(g.savas_alani).length > 0) {
    for (const [k, v] of Object.entries(g.savas_alani)) {
      if (v > 0) ganimetItemleri.push('<div class="sr-ganimet-item" title="Savas alaninda dusman kayiplarindan elde edilen ganimet">' + ikon(k) + ' ' + k + ': <span>+' + fmt(v) + '</span></div>');
    }
  }
  // Sehir yagmasi
  if (g.sehir_yagmasi && Object.keys(g.sehir_yagmasi).length > 0) {
    for (const [k, v] of Object.entries(g.sehir_yagmasi)) {
      if (v > 0) ganimetItemleri.push('<div class="sr-ganimet-item" title="Sehir yagmasi — hedef oyuncudan alindi">🏴 ' + ikon(k) + ' ' + k + ': <span>+' + fmt(v) + '</span></div>');
    }
  }
  // Alan transferi
  if (g.alan_transferi && g.alan_transferi.miktar > 0) {
    const serapNot = g.alan_transferi.serap_etkisi ? ' (Serap Kd.' + g.alan_transferi.serap_kademe + ' azalttı)' : '';
    ganimetItemleri.push('<div class="sr-ganimet-item" title="Hedefin toplam alanından transfer edildi">📐 Alan: <span>+' + fmt(g.alan_transferi.miktar) + '</span>' + serapNot + '</div>');
  }
  // Koylu olumu (saldiran kazandiysa hedefin koylusu oldu)
  if (g.koylu_olum > 0) {
    ganimetItemleri.push('<div class="sr-ganimet-item" title="Yagma sirasinda oldurulen hedef koylu">💀 Koylu olumu: <span>' + fmt(g.koylu_olum) + '</span></div>');
  }
  // Esir alinan
  if (g.esir_alinan > 0) {
    ganimetItemleri.push('<div class="sr-ganimet-item" title="Savas sonu kazanilan esir (donus varisinda kampa eklenir, dolu ise kacar)">🔒 Esir alindi: <span>+' + fmt(g.esir_alinan) + '</span></div>');
  }
  if (ganimetItemleri.length > 0) {
    ganimetHTML = '<div class="sr-div"></div>' +
      '<div class="sr-sec">💰 GANİMET</div>' +
      '<div class="sr-ganimet">' + ganimetItemleri.join('') + '</div>';
  }

  // Koloni fethi
  let koloniHTML = '';
  if (sonuc.koloni_fethi && sonuc.kazanan === 'saldiran') {
    koloniHTML = '<div class="sr-div"></div>' +
      '<div class="sr-sec">🏰 KOLONİ FETHEDİLDİ</div>' +
      '<div style="font-size:.65rem;color:#5cb85c">Koloni başarıyla fethedildi!</div>';
  }

  box.innerHTML =
    '<button class="sr-close" onclick="closeSavasRapor()">✕ KAPAT</button>' +
    '<div class="sr-title">⚔ SAVAŞ RAPORU</div>' +
    '<div class="sr-sub">Noxara Muharebe Kayıtları — ' + tip + '</div>' +
    '<div class="sr-result ' + resultClass + '">' + resultIcon + ' ' + resultText + '</div>' +

    '<div class="sr-cards">' +
      '<div class="sr-card">' +
        '<div class="sr-card-title atk">⚔ ' + saldiranAdi + '</div>' +
        (sonuc.saldiran_baslangic && Object.keys(sonuc.saldiran_baslangic).length > 0 ?
          '<div class="sr-stat" style="align-items:flex-start"><span class="sr-stat-k">Başlangıç Ordusu</span><span class="sr-stat-v" style="color:#aaa;font-size:10px;text-align:right;max-width:60%">' + baslangicStr(sonuc.saldiran_baslangic) + ' <b style="color:#c8a96e">(Toplam: ' + fmt(baslangicToplam(sonuc.saldiran_baslangic)) + ')</b></span></div>' : '') +
        '<div class="sr-stat"><span class="sr-stat-k">Kalan Ünite</span><span class="sr-stat-v" style="color:' + (sonuc.saldiran_kalan > 0 ? 'var(--gold,#ffd700)' : '#dc3545') + '">' + fmt(sonuc.saldiran_kalan) + '</span></div>' +
        '<div class="sr-stat"><span class="sr-stat-k">Toplam Kayıp</span><span class="sr-stat-v" style="color:#dc3545">' + kayipStr(sonuc.saldiran_kayip) + '</span></div>' +
      '</div>' +
      '<div class="sr-vs">VS</div>' +
      '<div class="sr-card">' +
        '<div class="sr-card-title def">🛡 ' + savunanAdi + '</div>' +
        (sonuc.savunan_baslangic && Object.keys(sonuc.savunan_baslangic).length > 0 ?
          '<div class="sr-stat" style="align-items:flex-start"><span class="sr-stat-k">Başlangıç Ordusu</span><span class="sr-stat-v" style="color:#aaa;font-size:10px;text-align:right;max-width:60%">' + baslangicStr(sonuc.savunan_baslangic) + ' <b style="color:#c8a96e">(Toplam: ' + fmt(baslangicToplam(sonuc.savunan_baslangic)) + ')</b></span></div>' : '') +
        '<div class="sr-stat"><span class="sr-stat-k">Kalan Ünite</span><span class="sr-stat-v" style="color:' + (sonuc.savunan_kalan > 0 ? 'var(--gold,#ffd700)' : '#dc3545') + '">' + fmt(sonuc.savunan_kalan) + '</span></div>' +
        '<div class="sr-stat"><span class="sr-stat-k">Toplam Kayıp</span><span class="sr-stat-v" style="color:#dc3545">' + kayipStr(sonuc.savunan_kayip) + '</span></div>' +
      '</div>' +
    '</div>' +

    '<div class="sr-div"></div>' +
    '<div class="sr-sec">TUR BAZLI MUHAREBE — ' + (sonuc.tur_sayisi || 0) + ' Tur</div>' +
    '<div style="overflow-x:auto">' +
      '<table class="sr-table">' +
        '<thead><tr>' +
          '<th rowspan="2">TUR</th>' +
          '<th colspan="3" style="color:#E8A0A0">⚔ SALDIRAN</th>' +
          '<th colspan="3" style="color:#A0C8F0">🛡 SAVUNAN</th>' +
        '</tr><tr>' +
          '<th>ATK</th><th>Hasar</th><th>Kalan</th>' +
          '<th>ATK</th><th>Hasar</th><th>Kalan</th>' +
        '</tr></thead>' +
        '<tbody>' + turRows + '</tbody>' +
      '</table>' +
    '</div>' +

    ganimetHTML +
    koloniHTML +

    '<div class="sr-btn-row">' +
      '<button class="sr-btn" onclick="closeSavasRapor()">Kapat</button>' +
    '</div>';

  document.getElementById('savas-rapor-modal').classList.add('open');
}
