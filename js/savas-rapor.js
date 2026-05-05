/* ═══════════════════════════════════════════════════════
   PALANTIS — SAVAŞ RAPORU MODAL (v1.14.0.9 — Eski Palantis Formati)
   js/savas-rapor.js
   Zengin format: ganimet ikon, koordinatlar, moral, tur tur komp., birim detay
═══════════════════════════════════════════════════════ */

// Modal HTML'i body'ye ekle (sayfa yüklendiğinde)
(function initSavasRaporModal() {
  if (document.getElementById('savas-rapor-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'savas-rapor-modal';
  modal.className = 'sr-overlay';
  modal.innerHTML = '<div class="sr-box" id="savas-rapor-box"></div>';
  modal.addEventListener('click', function(e) { if (e.target === modal) closeSavasRapor(); });
  document.body.appendChild(modal);

  const style = document.createElement('style');
  style.textContent = `
    .sr-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.88); z-index:9999; overflow-y:auto; padding:12px; }
    .sr-overlay.open { display:flex; justify-content:center; align-items:flex-start; }
    .sr-box { background:linear-gradient(180deg,#15120a 0%,#0a0604 100%); border:2px solid #c8a96e; border-radius:10px; max-width:920px; width:100%; padding:22px; color:#e8dcc4; font-family:'Crimson Pro','Segoe UI',serif; margin:20px auto; box-shadow:0 0 40px rgba(212,175,55,.15); }
    .sr-close { position:absolute; top:14px; right:18px; background:none; border:none; color:#888; font-size:18px; cursor:pointer; font-family:Cinzel,serif; }
    .sr-close:hover { color:#e74c3c; }
    .sr-title { font-family:'Cinzel',serif; font-size:18px; text-align:center; color:#d4af37; margin-bottom:2px; letter-spacing:2px; text-shadow:0 0 8px rgba(212,175,55,.3); }
    .sr-sub { text-align:center; font-size:11px; color:#888; margin-bottom:4px; letter-spacing:1px; }
    .sr-meta { text-align:center; font-size:11px; color:#c8a96e; margin-bottom:14px; font-family:Cinzel,serif; }
    .sr-result { text-align:center; font-size:16px; font-weight:700; padding:10px; border-radius:6px; margin-bottom:14px; font-family:Cinzel,serif; letter-spacing:3px; }
    .sr-result.win  { background:rgba(46,204,113,.12); color:#27ae60; border:1px solid rgba(46,204,113,.3); }
    .sr-result.lose { background:rgba(231,76,60,.12); color:#c0392b; border:1px solid rgba(231,76,60,.3); }
    .sr-result.draw { background:rgba(241,196,15,.12); color:#d4af37; border:1px solid rgba(241,196,15,.3); }

    .sr-ganimet-wrap { background:rgba(212,175,55,.04); border:1px solid rgba(212,175,55,.2); border-radius:6px; padding:12px; margin-bottom:14px; }
    .sr-ganimet-title { font-family:Cinzel,serif; font-size:12px; color:#d4af37; margin-bottom:8px; letter-spacing:2px; text-align:center; }
    .sr-ganimet-grid { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
    .sr-gani-item { background:#0a0604; border:1px solid #3a2f1a; border-radius:4px; padding:5px 10px; font-size:12px; display:flex; align-items:center; gap:6px; }
    .sr-gani-item .ico { font-size:14px; }
    .sr-gani-item .val { color:#e0c97f; font-weight:700; font-family:'Courier New',monospace; }
    .sr-gani-item.neg .val { color:#e67e22; }
    .sr-gani-cat { font-size:10px; color:#999; margin:6px 0 4px; text-align:center; letter-spacing:1px; }

    .sr-armies { display:grid; grid-template-columns:1fr auto 1fr; gap:10px; margin-bottom:14px; }
    .sr-army-card { background:rgba(255,255,255,.02); border:1px solid #3a3020; border-radius:6px; padding:12px; }
    .sr-army-card.atk { border-color:rgba(231,76,60,.4); }
    .sr-army-card.def { border-color:rgba(52,152,219,.4); }
    .sr-army-title { font-family:Cinzel,serif; font-size:13px; font-weight:700; text-align:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #2a2a2a; }
    .sr-army-title.atk { color:#E8A0A0; }
    .sr-army-title.def { color:#A0C8F0; }
    .sr-army-sub { font-size:10px; color:#888; text-align:center; margin-bottom:8px; font-style:italic; }
    .sr-army-stat { display:flex; justify-content:space-between; font-size:11px; padding:3px 0; border-bottom:1px dashed #2a2a2a; }
    .sr-army-stat.total { background:rgba(212,175,55,.08); padding:4px 6px; margin-top:4px; border-radius:3px; font-weight:700; color:#e0c97f; }
    .sr-vs { display:flex; align-items:center; padding:0 6px; font-family:Cinzel,serif; font-size:18px; color:#d4af37; text-shadow:0 0 6px rgba(212,175,55,.4); }

    .sr-sec-title { font-family:Cinzel,serif; font-size:13px; color:#d4af37; margin:16px 0 8px; padding-bottom:4px; border-bottom:1px solid #3a3020; letter-spacing:2px; }

    .sr-table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:6px; }
    .sr-table th { background:rgba(212,175,55,.1); padding:6px 4px; text-align:center; border:1px solid #3a3020; font-family:Cinzel,serif; font-size:10px; letter-spacing:1px; }
    .sr-table td { padding:5px 6px; text-align:center; border:1px solid rgba(58,48,32,.4); font-family:'Courier New',monospace; }
    .sr-table .td-tur  { background:rgba(212,175,55,.08); font-weight:bold; color:#d4af37; }
    .sr-table .td-kayip { color:#c0392b; }
    .sr-table .td-atk { color:#e74c3c; }
    .sr-table .td-def { color:#3498db; }
    .sr-table tr:nth-child(even) td { background:rgba(255,255,255,.02); }

    .sr-turn-detail { margin:10px 0; padding:10px; background:rgba(0,0,0,.25); border-left:3px solid #3a3020; border-radius:3px; }
    .sr-turn-detail .turn-hdr { font-family:Cinzel,serif; color:#d4af37; font-size:12px; margin-bottom:6px; letter-spacing:2px; }
    .sr-turn-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .sr-turn-side { background:rgba(0,0,0,.3); padding:6px 8px; border-radius:3px; font-size:10px; }
    .sr-turn-side .side-hdr { color:#c8a96e; font-family:Cinzel,serif; font-size:10px; margin-bottom:3px; }
    .sr-turn-side .kayip-row { color:#e67e22; font-family:'Courier New',monospace; font-size:10px; }

    .sr-unit-detay { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px; }
    .sr-unit-box { background:rgba(0,0,0,.3); border:1px solid #3a3020; border-radius:4px; padding:8px; }
    .sr-unit-box .box-title { font-family:Cinzel,serif; font-size:11px; color:#c8a96e; padding-bottom:4px; border-bottom:1px solid #2a2a2a; margin-bottom:6px; text-align:center; letter-spacing:1px; }
    .sr-unit-row { display:grid; grid-template-columns:1fr auto auto auto; gap:8px; padding:3px 0; font-size:11px; border-bottom:1px dotted rgba(58,48,32,.3); align-items:center; }
    .sr-unit-row .u-name { color:#e8dcc4; font-weight:600; }
    .sr-unit-row .u-start { color:#888; font-family:'Courier New',monospace; }
    .sr-unit-row .u-dead { color:#c0392b; font-family:'Courier New',monospace; min-width:56px; text-align:right; }
    .sr-unit-row .u-rest { color:#27ae60; font-family:'Courier New',monospace; min-width:56px; text-align:right; font-weight:bold; }

    .sr-buyu-sec { margin:10px 0; padding:8px 10px; background:rgba(155,89,182,.06); border-left:3px solid #9b59b6; border-radius:3px; font-size:11px; color:#c8a96e; }

    .sr-btn-row { display:flex; justify-content:center; gap:8px; margin-top:14px; }
    .sr-btn { padding:7px 20px; border-radius:4px; border:1px solid #3a3020; background:rgba(212,175,55,.05); color:#c8a96e; cursor:pointer; font-family:Cinzel,serif; font-size:11px; letter-spacing:1px; }
    .sr-btn:hover { background:#d4af37; color:#0a0604; }

    @media (max-width:700px) {
      .sr-armies, .sr-turn-grid, .sr-unit-detay { grid-template-columns:1fr; }
      .sr-vs { display:none; }
    }
  `;
  document.head.appendChild(style);
})();

function closeSavasRapor() {
  const modal = document.getElementById('savas-rapor-modal');
  if (modal) modal.classList.remove('open');
}

// v1.14.0.10: Tur tur tam ordu kompozisyon tablosu — eski Palantis formati
// Her tur icin saldiran + savunan komp yan yana, her birim icin Sayi/ATK/DEF
function renderTurKomposizyonlari(turDetay, saldiranAdi, savunanAdi) {
  const fmt = n => (n == null ? '—' : (+n).toLocaleString('tr-TR'));
  // v1.14.0.68.3: float precision fix — ATK/DEF tek ondalık, toplam virgülle ayır
  const fmtStat = n => {
    if (n == null || n === '-' || n === '?') return n;
    const num = +n;
    if (isNaN(num)) return n;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };
  const fmtTotal = n => (n == null ? '—' : Math.round(+n).toLocaleString('tr-TR'));
  function birimIsim(uid) {
    const realId = (uid||'').replace(/^kule_/, '').replace(/__army_\d+$/, '');
    const u = typeof UNITS !== 'undefined' ? UNITS[realId] : null;
    return { name: u ? (u.name || realId) : realId, isKule: (uid||'').startsWith('kule_') };
  }
  function tablo(komp, kimAdi, renk) {
    if (!komp || Object.keys(komp).length === 0) {
      return `<div class="sr-turn-side">
        <div class="side-hdr" style="color:${renk}">- ${kimAdi} -</div>
        <div style="color:#c0392b;font-size:10px;padding:6px;text-align:center">💀 Ordu tamamen yok oldu</div>
      </div>`;
    }
    let satirlar = '';
    let toplamAdet = 0, toplamAtk = 0, toplamDef = 0;
    for (const [uid, info] of Object.entries(komp)) {
      const adet = info?.adet || 0;
      const birimAtk = info?.atk ?? '?';
      const birimDef = info?.def ?? '?';
      if (!adet) continue;
      toplamAdet += adet;
      if (typeof birimAtk === 'number') toplamAtk += birimAtk * adet;
      if (typeof birimDef === 'number') toplamDef += birimDef * adet;
      const b = birimIsim(uid);
      const kuleEt = b.isKule ? ' <span style="color:#9b59b6;font-size:11px">(Kule)</span>' : '';
      satirlar += `<div style="display:grid;grid-template-columns:1fr 50px 35px 35px;gap:4px;padding:2px 0;font-size:10px;border-bottom:1px dotted #2a2a2a">
        <span style="color:#e8dcc4">${b.name}${kuleEt}</span>
        <span style="color:#c8a96e;text-align:right;font-family:'Courier New'">${fmt(adet)}</span>
        <span style="color:#e74c3c;text-align:right">${fmtStat(birimAtk)}</span>
        <span style="color:#3498db;text-align:right">${fmtStat(birimDef)}</span>
      </div>`;
    }
    return `<div class="sr-turn-side">
      <div class="side-hdr" style="color:${renk}">- ${kimAdi} -</div>
      <div style="display:grid;grid-template-columns:1fr 50px 35px 35px;gap:4px;font-size:11px;color:#666;margin-bottom:3px;padding-bottom:2px;border-bottom:1px solid #2a2a2a">
        <span>Unite</span><span style="text-align:right">Sayi</span><span style="text-align:right">ATK</span><span style="text-align:right">DEF</span>
      </div>
      ${satirlar}
      <div style="display:grid;grid-template-columns:1fr 50px 35px 35px;gap:4px;padding:4px 0 0;margin-top:4px;border-top:1px solid #3a3020;font-size:10px;font-family:'Courier New'">
        <span style="color:#d4af37">Toplam</span>
        <span style="color:#d4af37;text-align:right">${fmt(toplamAdet)}</span>
        <span style="color:#e74c3c;text-align:right">${fmtTotal(toplamAtk)}</span>
        <span style="color:#3498db;text-align:right">${fmtTotal(toplamDef)}</span>
      </div>
    </div>`;
  }

  // v1.14.1.46: Eski Palantis formatinda rahip dirilis satiri (her tur sonunda)
  //   "OBAAAAAA : Ordumuzda bulunan 469 rahip; Bu tur sonunda 2986 Paladin, ..., canlandirdilar"
  function dirilisSatiri(adi, dirilis, isKaranlik) {
    if (!dirilis || !dirilis.toplamDirilen || dirilis.toplamDirilen <= 0) return '';
    var rahipKelime = isKaranlik ? 'kara rahip' : 'rahip';
    var renk = isKaranlik ? '#9b59b6' : '#f1c40f';
    var dets = Object.entries(dirilis.dirilen || {}).map(function(e){
      var info = birimIsim(e[0]);
      return fmt(e[1]) + ' ' + info.name;
    }).join(', ');
    return '<div style="margin:6px 0 0;padding:6px 10px;background:rgba(241,196,15,0.06);border-left:3px solid ' + renk + ';border-radius:3px;font-size:11px;color:#e8dcc4;font-style:italic">' +
      '<b style="color:' + renk + '">' + adi + '</b> : Ordumuzda bulunan <b>' + fmt(dirilis.rahipSayi) + '</b> ' + rahipKelime + '; Bu tur sonunda <b>' + dets + '</b>, canlandırdılar' +
    '</div>';
  }

  let html = '';
  if (turDetay.some(t => t.saldiran_komp || t.savunan_komp)) {
    html = '<div class="sr-sec-title">🔍 HER TUR BİRİM DETAYI</div>';
    turDetay.forEach((t, i) => {
      if (!t.saldiran_komp && !t.savunan_komp) return;
      // Saldiran ve savunan icin rahip taraf bilgisi: dirilen birim adlarindan tahmin
      // Iyi taraf: rahip; Kotu taraf: kara_rahip. Saldiran/savunan unit_id'lerinden anlayabilir.
      var sIsKaranlik = false, vIsKaranlik = false;
      try {
        var sBaslangicIds = Object.keys((t.saldiran_komp||{}));
        var vBaslangicIds = Object.keys((t.savunan_komp||{}));
        var KARANLIK = ['iskelet','goblin','ogre','troll','ork','kara_sovalye','kara_elf','golem','golge_savasci','kara_rahip','kirmizi_ejderha','siyah_ejderha'];
        sIsKaranlik = sBaslangicIds.some(function(u){ return KARANLIK.indexOf(u.replace(/__army_\d+$/,'')) >= 0; });
        vIsKaranlik = vBaslangicIds.some(function(u){ return KARANLIK.indexOf(u.replace(/__army_\d+$/,'')) >= 0; });
      } catch(e) {}
      html += `<div class="sr-turn-detail">
        <div class="turn-hdr">${i+1}. TUR — Ordu Durumu</div>
        <div class="sr-turn-grid">
          ${tablo(t.saldiran_komp, saldiranAdi, '#E8A0A0')}
          ${tablo(t.savunan_komp, savunanAdi, '#A0C8F0')}
        </div>
        ${dirilisSatiri(saldiranAdi, t.saldiran_dirilis, sIsKaranlik)}
        ${dirilisSatiri(savunanAdi,  t.savunan_dirilis, vIsKaranlik)}
      </div>`;
    });
  } else {
    html = '<div class="sr-buyu-sec" style="text-align:center;color:#666;margin-top:10px">ℹ️ Eski savaşlar için tur bazlı detay yok. Yeni savaşlarda (v1.14.0.10+) otomatik görünecek.</div>';
  }
  return html;
}

// ═══════════════════════════════════════════════════
// Ana gosterim fonksiyonu
// ═══════════════════════════════════════════════════
function showSavasRapor(sonuc, benimTaraf, opts) {
  const fmt = n => (n == null ? '—' : (+n).toLocaleString('tr-TR'));
  const box = document.getElementById('savas-rapor-box');

  const kazandim = (benimTaraf === 'saldiran' && sonuc.kazanan === 'saldiran') ||
                   (benimTaraf === 'savunan' && sonuc.kazanan === 'savunan');
  const berabere = sonuc.kazanan === 'berabere';
  const resultClass = berabere ? 'draw' : (kazandim ? 'win' : 'lose');
  const resultText = berabere ? 'BERABERE' : (kazandim ? 'ZAFER!' : 'YENILGI');
  const resultIcon = berabere ? '⚔' : (kazandim ? '🏆' : '💀');

  const saldiranAdi = opts?.saldiranAdi || 'Saldiran';
  const savunanAdi = opts?.savunanAdi || 'Savunan';
  const saldiranKoord = opts?.saldiranKoord || '—';
  const savunanKoord = opts?.savunanKoord || '—';
  const tipLabel = opts?.tip === 'koloni' ? 'Koloni Muharebesi' : opts?.tip === 'kadim_saldiri' ? 'Kadim Sehir Saldirisi' : 'PvP Muharebesi';
  const saldiranMoral = opts?.saldiranMoral ?? 100;
  const savunanMoral = opts?.savunanMoral ?? 100;

  // ── RESOURCE ICONS ──
  const RESOURCE_ICONS = { odun:'🌳', kereste:'🪵', metal:'⛏️', islenmis:'🔩', altin:'💰', bugday:'🌾', ekmek:'🍞', balik:'🎣', pismis:'🍳', cig_et:'🥩', pismis_et:'🍖', at:'🐴', kurt:'🐺', gizlilik:'🎯', buyulu_yumurta:'🥚', mana_beyaz:'🤍', mana_kirmizi:'❤️', mana_mavi:'💙', mana_yesil:'💚' };
  const ikon = k => RESOURCE_ICONS[k] || '📦';

  // ── UNIT NAME + ATK + DEF map ──
  function birimInfo(uid) {
    const realId = (uid||'').replace(/^kule_/, '').replace(/__army_\d+$/, '');
    const isKule = (uid||'').startsWith('kule_');
    const u = typeof UNITS !== 'undefined' ? UNITS[isKule ? realId : realId] : null;
    return {
      name: u ? (u.name || realId) : realId,
      atk: u ? u.baseAtk : (isKule ? '-' : '?'),
      def: u ? u.baseDef : '?',
      isKule
    };
  }
  function temizId(uid) { return (uid||'').replace(/__army_\d+$/, ''); }

  // ── GANIMET BLOCK ──
  // v1.14.1.18: Ganimet attribution — kaybettigim savasta "Dusman Topladi" (kirmizi)
  // gosterelim; kazandigimda "Topladim" (yesil). Rapor iki oyuncuda aynidir ama
  // ganimet kazanana ait — etiket kullanicinin perspektifine gore yazilir.
  const g = sonuc.ganimet || {};
  const signStr = kazandim ? '+' : '−';
  const signColor = kazandim ? '#2ecc71' : '#e74c3c';
  const ganimetBaslik = kazandim ? '💰 TOPLADIKLARIM'
                       : berabere ? '💰 SAVAŞ GANİMETLERİ (beraberlik — dağılmadı)'
                       : '⚠️ DÜŞMAN TOPLADI (senin kaybın)';
  let ganimetItemleri = [];
  if (g.savas_alani && Object.keys(g.savas_alani).length > 0) {
    const arr = [];
    for (const [k,v] of Object.entries(g.savas_alani)) {
      if (v > 0) arr.push(`<div class="sr-gani-item" style="color:${signColor}"><span class="ico">${ikon(k)}</span><span class="val">${signStr}${fmt(v)}</span></div>`);
    }
    if (arr.length > 0) ganimetItemleri.push({ cat: 'Savas Alanindan Toplananlar', items: arr });
  }
  if (g.sehir_yagmasi && Object.keys(g.sehir_yagmasi).length > 0) {
    const arr = [];
    for (const [k,v] of Object.entries(g.sehir_yagmasi)) {
      if (v > 0) arr.push(`<div class="sr-gani-item" style="color:${signColor}"><span class="ico">🏴</span><span class="ico">${ikon(k)}</span><span class="val">${signStr}${fmt(v)}</span></div>`);
    }
    if (arr.length > 0) ganimetItemleri.push({ cat: 'Sehir Yagmasi', items: arr });
  }
  const diger = [];
  if (g.alan_transferi && g.alan_transferi.miktar > 0) {
    diger.push(`<div class="sr-gani-item" style="color:${signColor}"><span class="ico">📐</span>Alan <span class="val">${signStr}${fmt(g.alan_transferi.miktar)}</span></div>`);
  }
  if (g.koylu_olum > 0) {
    diger.push(`<div class="sr-gani-item neg"><span class="ico">💀</span>Olen Köylü <span class="val">${fmt(g.koylu_olum)}</span></div>`);
  }
  if (g.esir_alinan > 0) {
    diger.push(`<div class="sr-gani-item" style="color:${signColor}"><span class="ico">🔒</span>Esir Alindi <span class="val">${signStr}${fmt(g.esir_alinan)}</span></div>`);
  }
  if (diger.length > 0) ganimetItemleri.push({ cat: 'Diger Kazanimlar', items: diger });

  let ganimetHTML = '';
  if (ganimetItemleri.length > 0) {
    const wrapBorder = kazandim ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.35)';
    const wrapBg = kazandim ? 'rgba(46,204,113,0.05)' : 'rgba(231,76,60,0.06)';
    ganimetHTML = '<div class="sr-ganimet-wrap" style="border-color:' + wrapBorder + ';background:' + wrapBg + '">';
    ganimetHTML += '<div class="sr-ganimet-title" style="color:' + signColor + '">' + ganimetBaslik + '</div>';
    for (const blok of ganimetItemleri) {
      ganimetHTML += `<div class="sr-gani-cat">${blok.cat}</div>`;
      ganimetHTML += `<div class="sr-ganimet-grid">${blok.items.join('')}</div>`;
    }
    ganimetHTML += '</div>';
  }

  // ── ARMY CARDS (başlangıç — eski Palantis "Üniteler" tablosu) ──
  function armyCard(taraf, adi, koord, moral, baslangic, kalan, kayip) {
    const isAtk = taraf === 'atk';
    let satirlar = '';
    let toplamAdet = 0, toplamAtk = 0, toplamDef = 0;
    for (const [uid, adet] of Object.entries(baslangic || {})) {
      if (!adet) continue;
      const info = birimInfo(uid);
      const birimAtk = typeof info.atk === 'number' ? info.atk : 0;
      const birimDef = typeof info.def === 'number' ? info.def : 0;
      toplamAdet += adet;
      toplamAtk += birimAtk * adet;
      toplamDef += birimDef * adet;
      const kule = info.isKule ? ' <span style="color:#9b59b6;font-size:11px">(Kule)</span>' : '';
      satirlar += `<div class="sr-army-stat">
        <span>${info.name}${kule}</span>
        <span style="color:#c8a96e;font-family:'Courier New'">${fmt(adet)}</span>
        <span style="color:#e74c3c;font-size:10px">A:${info.atk}</span>
        <span style="color:#3498db;font-size:10px">D:${info.def}</span>
      </div>`;
    }
    if (!satirlar) satirlar = '<div style="color:#666;text-align:center;padding:8px;font-size:10px">Birim yok</div>';

    // v1.14.1.18: Benim/Dusman rozeti — kara rahip gibi karsi taraf unitelerinin
    // kimin ordusunda oldugunu aciklasin diye.
    const benim = (isAtk && benimTaraf === 'saldiran') || (!isAtk && benimTaraf === 'savunan');
    const rozet = benim
      ? '<span style="background:#2ecc71;color:#000;padding:1px 7px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">BENİM</span>'
      : '<span style="background:#c0392b;color:#fff;padding:1px 7px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">DÜŞMAN</span>';
    return `<div class="sr-army-card ${taraf}">
      <div class="sr-army-title ${taraf}">${isAtk ? '⚔' : '🛡'} ${adi}${rozet}</div>
      <div class="sr-army-sub">📍 ${koord || '—'} · 😊 Moral %${moral}</div>
      ${satirlar}
      <div class="sr-army-stat total"><span>Toplam Unite</span><span>${fmt(toplamAdet)}</span></div>
      <div class="sr-army-stat total"><span>Toplam ATK</span><span>${fmt(toplamAtk)}</span></div>
      <div class="sr-army-stat total"><span>Toplam DEF</span><span>${fmt(toplamDef)}</span></div>
      <div class="sr-army-stat total" style="background:rgba(231,76,60,.1);color:#e67e22">
        <span>Kalan Unite</span>
        <span>${fmt(kalan)}</span>
      </div>
    </div>`;
  }

  const saldiranCard = armyCard('atk', saldiranAdi, saldiranKoord, saldiranMoral, sonuc.saldiran_baslangic, sonuc.saldiran_kalan, sonuc.saldiran_kayip);
  const savunanCard = armyCard('def', savunanAdi, savunanKoord, savunanMoral, sonuc.savunan_baslangic, sonuc.savunan_kalan, sonuc.savunan_kayip);

  // ── TURN TABLE ──
  let turRows = '';
  let buyuBoluml = '';
  if (sonuc.tur_detay && sonuc.tur_detay.length > 0) {
    turRows = sonuc.tur_detay.map(function(t) {
      return `<tr>
        <td class="td-tur">${t.tur}</td>
        <td class="td-atk">${fmt(Math.round(t.saldiran_atk))}</td>
        <td class="td-kayip">${t.savunan_hasar > 0 ? '-' + fmt(Math.round(t.savunan_hasar)) : '0'}</td>
        <td>${fmt(t.saldiran_kalan)}</td>
        <td class="td-atk">${fmt(Math.round(t.savunan_atk))}</td>
        <td class="td-kayip">${t.saldiran_hasar > 0 ? '-' + fmt(Math.round(t.saldiran_hasar)) : '0'}</td>
        <td>${fmt(t.savunan_kalan)}</td>
      </tr>`;
    }).join('');

    // v1.14.1.14: Tur bazli savas buyuleri gosterim
    buyuBoluml = sonuc.tur_detay.map(function(t, i) {
      const rows = [];
      // Saldiran buyuleri
      const sBuyu = t.saldiran_buyuler || [];
      for (const b of sBuyu) {
        rows.push(`<div class="sr-buyu-sec" style="color:#e74c3c">${i+1}. Tur · ⚔ SALDIRAN · ${b.ikon||'✨'} <b>${b.isim}</b>: ${b.aciklama}</div>`);
      }
      // Savunan buyuleri
      const vBuyu = t.savunan_buyuler || [];
      for (const b of vBuyu) {
        rows.push(`<div class="sr-buyu-sec" style="color:#3498db">${i+1}. Tur · 🛡 SAVUNAN · ${b.ikon||'✨'} <b>${b.isim}</b>: ${b.aciklama}</div>`);
      }
      return rows.join('');
    }).join('');

    // v1.14.1.03: Rahip dirilis bolumu — her tur diriltilen birimler
    var rahipBoluml = sonuc.tur_detay.map(function(t, i) {
      const sD = t.saldiran_dirilis;
      const svD = t.savunan_dirilis;
      const rows = [];
      if (sD && sD.toplamDirilen > 0) {
        const dets = Object.entries(sD.dirilen || {}).map(([uid, adet]) => {
          const info = (typeof birimInfo === 'function') ? birimInfo(uid) : { name: uid };
          return `${fmt(adet)} ${info.name}`;
        }).join(', ');
        rows.push(`<div class="sr-buyu-sec" style="color:#f1c40f">${i+1}. Tur · ⚔ SALDIRAN · <b>${sD.rahipSayi} rahip</b> → <b>${fmt(sD.toplamDirilen)} birim</b> canlandırdı <span style="color:#888">(${dets})</span></div>`);
      }
      if (svD && svD.toplamDirilen > 0) {
        const dets = Object.entries(svD.dirilen || {}).map(([uid, adet]) => {
          const info = (typeof birimInfo === 'function') ? birimInfo(uid) : { name: uid };
          return `${fmt(adet)} ${info.name}`;
        }).join(', ');
        rows.push(`<div class="sr-buyu-sec" style="color:#f1c40f">${i+1}. Tur · 🛡 SAVUNAN · <b>${svD.rahipSayi} rahip</b> → <b>${fmt(svD.toplamDirilen)} birim</b> canlandırdı <span style="color:#888">(${dets})</span></div>`);
      }
      return rows.join('');
    }).join('');
    if (rahipBoluml) buyuBoluml = (buyuBoluml || '') + rahipBoluml;
  }

  // ── UNIT-LEVEL DETAIL (başlangıç - ölü = kalan) ──
  function unitDetayList(taraf, baslangic, kayip) {
    const lines = [];
    for (const [uid, adet] of Object.entries(baslangic || {})) {
      if (!adet) continue;
      const realId = temizId(uid);
      const info = birimInfo(uid);
      // Kayip 'piyade', baslangic 'piyade' (normal ID) veya 'kule_okcu_kulesi' formatinda
      const olen = parseInt(kayip?.[uid] ?? kayip?.[realId] ?? 0) || 0;
      const kalan = Math.max(0, adet - olen);
      lines.push(`<div class="sr-unit-row">
        <span class="u-name">${info.name}${info.isKule ? ' <span style="color:#9b59b6;font-size:11px">Kule</span>' : ''}</span>
        <span class="u-start">${fmt(adet)} baslangic</span>
        <span class="u-dead">-${fmt(olen)}</span>
        <span class="u-rest">${fmt(kalan)}</span>
      </div>`);
    }
    return lines.join('') || '<div style="color:#666;text-align:center;padding:10px;font-size:11px">Birim yok</div>';
  }

  // ── FULL HTML ──
  box.innerHTML = `
    <button class="sr-close" onclick="closeSavasRapor()">✕ KAPAT</button>
    <div class="sr-title">⚔ SAVAŞ RAPORU</div>
    <div class="sr-sub">Noxara Muharebe Kayitlari</div>
    <div class="sr-meta">${saldiranAdi} [${saldiranKoord}] ordusu ile ${savunanAdi} [${savunanKoord}] savaşı · ${tipLabel}</div>
    <div class="sr-result ${resultClass}">${resultIcon} ${resultText}</div>

    ${ganimetHTML}

    ${renderSafDizilim(sonuc, saldiranAdi, savunanAdi, benimTaraf)}

    <div class="sr-sec-title">⚔️ ORDULAR (Başlangıç Kompozisyonu)</div>
    <div class="sr-armies">
      ${saldiranCard}
      <div class="sr-vs">VS</div>
      ${savunanCard}
    </div>

    <div class="sr-sec-title">📜 TUR BAZLI MUHAREBE — ${sonuc.tur_sayisi || 0} Tur</div>
    <div style="overflow-x:auto">
      <table class="sr-table">
        <thead>
          <tr>
            <th rowspan="2">TUR</th>
            <th colspan="3" style="color:#E8A0A0">⚔ SALDIRAN</th>
            <th colspan="3" style="color:#A0C8F0">🛡 SAVUNAN</th>
          </tr>
          <tr>
            <th>ATK</th><th>Hasar Alan</th><th>Kalan</th>
            <th>ATK</th><th>Hasar Alan</th><th>Kalan</th>
          </tr>
        </thead>
        <tbody>${turRows}</tbody>
      </table>
    </div>

    ${renderTurKomposizyonlari(sonuc.tur_detay || [], saldiranAdi, savunanAdi)}

    ${buyuBoluml ? `<div class="sr-sec-title">✨ TUR BAZLI BÜYÜLER & RAHİP DİRİLTMESİ</div>${buyuBoluml}` : '<div class="sr-buyu-sec" style="text-align:center;color:#666">Bu savaşta büyü kullanılmadı, rahip canlandırması da olmadı.</div>'}

    <div class="sr-sec-title">📋 BİRİM SEVİYESİNDE DETAY (Başlangıç → Ölü → Kalan)</div>
    <div class="sr-unit-detay">
      <div class="sr-unit-box">
        <div class="box-title">⚔ ${saldiranAdi}</div>
        ${unitDetayList('atk', sonuc.saldiran_baslangic, sonuc.saldiran_kayip)}
      </div>
      <div class="sr-unit-box">
        <div class="box-title">🛡 ${savunanAdi}</div>
        ${unitDetayList('def', sonuc.savunan_baslangic, sonuc.savunan_kayip)}
      </div>
    </div>

    <div style="margin-top:10px;padding:8px;background:rgba(241,196,15,.06);border-left:3px solid #f1c40f;border-radius:3px;font-size:10px;color:#999;font-style:italic">
      ⚠ Not: Moral %100 → ATK tam değerde. Düşük moralde her tur ATK azalır (floor %20).
    </div>

    <div class="sr-btn-row">
      <button class="sr-btn" onclick="closeSavasRapor()">Kapat</button>
      <button class="sr-btn" onclick="savasRaporIndirPdf(${data.id})" style="background:rgba(46,204,113,.1);color:#2ecc71;border-color:rgba(46,204,113,.4)">📄 PDF İndir</button>
      <button class="sr-btn" onclick="savasRaporTelegramPdf(${data.id})" style="background:rgba(52,152,219,.1);color:#3498db;border-color:rgba(52,152,219,.4)">📨 Telegram'a Gönder</button>
    </div>
  `;

  document.getElementById('savas-rapor-modal').classList.add('open');
}

/* ════════════════════════════════════════════════════════
   PDF üret (html2pdf.js CDN — lazy load)
   v1.14.2.5
═══════════════════════════════════════════════════════ */
async function _ensureHtml2Pdf() {
  if (window.html2pdf) return window.html2pdf;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('html2pdf.js yuklenemedi'));
    document.head.appendChild(s);
  });
  return window.html2pdf;
}

async function _savasRaporPdfBlob(savasId) {
  const box = document.getElementById('savas-rapor-box');
  if (!box) throw new Error('Rapor modal acik degil');
  // Telegram/PDF butonlarını gizle (PDF içinde görünmesin)
  const btnRow = box.querySelector('.sr-btn-row');
  const oldDisplay = btnRow ? btnRow.style.display : null;
  if (btnRow) btnRow.style.display = 'none';
  try {
    const html2pdf = await _ensureHtml2Pdf();
    const opt = {
      margin: 8,
      filename: `savas-rapor-${savasId}.pdf`,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { scale: 2, backgroundColor: '#0a0604', useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    return await html2pdf().set(opt).from(box).output('blob');
  } finally {
    if (btnRow) btnRow.style.display = oldDisplay || '';
  }
}

async function savasRaporIndirPdf(savasId) {
  try {
    const blob = await _savasRaporPdfBlob(savasId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `savas-rapor-${savasId}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    if (typeof toast === 'function') toast('PDF üretilemedi: ' + e.message);
    else noxAlert('PDF üretilemedi: ' + e.message);
  }
}

async function savasRaporTelegramPdf(savasId) {
  try {
    const token = (typeof getToken === 'function') ? getToken() : localStorage.getItem('palantis_token');
    if (!token) { noxAlert('Giriş yap'); return; }
    if (typeof toast === 'function') toast('PDF üretiliyor...');
    const blob = await _savasRaporPdfBlob(savasId);
    if (typeof toast === 'function') toast('Telegram\'a yükleniyor...');
    const r = await fetch(API_BASE + '/api/savas/' + savasId + '/pdf-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf', 'Authorization': 'Bearer ' + token },
      body: blob,
    });
    const d = await r.json();
    if (!r.ok) {
      const msg = d?.error || ('HTTP ' + r.status);
      if (typeof toast === 'function') toast('Hata: ' + msg);
      else noxAlert('Hata: ' + msg);
      return;
    }
    if (typeof toast === 'function') toast('✅ Telegram\'a gönderildi!');
    else noxAlert('✅ Telegram\'a gönderildi!');
  } catch (e) {
    if (typeof toast === 'function') toast('PDF gönderilemedi: ' + e.message);
    else noxAlert('PDF gönderilemedi: ' + e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   v1.14.1.18 — SAF DIZILIMI TABLOSU
   Kaynak: sonuc.ganimet._saflar_saldiran / _saflar_savunan
           veya sonuc.saldiran_saflar / sonuc.savunan_saflar (fallback)
   Format: her saf icin [{unite_id, baslangic, kalan, olen}]
   Layout: user orneklemesi — her saf satiri merkezde slot kartlari halinde
     Saf 1 (3 slot):       ■ ■ ■
     Saf 2 (3 slot):       ■ ■ ■
     Saf 3 (5 slot):     ■ ■ ■ ■ ■
     Saf 4 (3 slot):       ■ ■ ■
   Her slot: ikon + isim + adet (baslangic→kalan)
═══════════════════════════════════════════════════════════════════ */
function renderSafDizilim(sonuc, saldiranAdi, savunanAdi, benimTaraf) {
  var g = sonuc.ganimet || {};
  var sSaflar = g._saflar_saldiran || sonuc.saldiran_saflar || null;
  var vSaflar = g._saflar_savunan  || sonuc.savunan_saflar  || null;
  var fmt = function(n){ return (n==null?'—':(+n).toLocaleString('tr-TR')); };
  var SAF_LIMITS = [3, 3, 5, 3];

  // v1.14.1.19: ESKI RAPORLAR ICIN TAHMINI SAF
  // Saf bilgisi DB'de yoksa (eski savaslar), birim tipi + tier + savas_turlarina
  // bakarak mantikli bir dizilim **tahmin et**. Kullanici "savaştayken gerçekte
  // hangi dizilim vardı" bilgisine ulasamaz — ama tip bazli yaklasik goruntu sunar.
  var tahminMi = false;
  function safTahmin(baslangic, kayip) {
    if (!baslangic || Object.keys(baslangic).length === 0) return null;
    var saflar = [[], [], [], []];
    for (var uid in baslangic) {
      var adet = parseInt(baslangic[uid]) || 0;
      if (adet <= 0) continue;
      var realId = uid.replace(/__army_\d+$/, '').replace(/^kule_/, '');
      var u = (typeof UNITS !== 'undefined') ? UNITS[realId] : null;
      var olen = parseInt((kayip||{})[uid] ?? (kayip||{})[realId] ?? 0) || 0;
      var slot = { unite_id: realId, baslangic: adet, kalan: Math.max(0, adet - olen), olen: olen };
      // Tier + isim heuristic
      // Saf 4 (arka elit): Ejderha (tier 4), Rahip, Kara Rahip
      // Saf 3 (menzilli + elit): Okçu, Büyücü, Kara Elf, Kolcu, Paladin, Işığın/Gölge Savaşçısı
      // Saf 2 (orta tank): Şövalye, Süvari, Troll, Ork, Golem, Kara Şövalye
      // Saf 1 (ön hat): Piyade, Baltacı, İskelet, Goblin, Savaşçı, İskelet Okçu, Ogre Savaşçı
      var arkaBirim = ['rahip','kara_rahip'].includes(realId) || (u && u.tier === 4);
      var menzilli = ['okcu','buyucu','kara_elf','iskelet_okcu','kolcu','paladin','isin_savasci','golge_savasci'].includes(realId);
      var ortaTank = ['sovalye','suvari','troll','ork','golem','kara_sovalye'].includes(realId);
      var hedefSaf = arkaBirim ? 3 : (menzilli ? 2 : (ortaTank ? 1 : 0));
      saflar[hedefSaf].push(slot);
    }
    // Her safi limit'e sigdir — taşanlar bir sonraki saf'a
    var out = [[], [], [], []];
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < saflar[i].length; j++) {
        var placed = false;
        for (var k = i; k < 4 && !placed; k++) {
          if (out[k].length < SAF_LIMITS[k]) {
            out[k].push(saflar[i][j]);
            placed = true;
          }
        }
      }
    }
    return out;
  }
  if (!sSaflar && sonuc.saldiran_baslangic) {
    sSaflar = safTahmin(sonuc.saldiran_baslangic, sonuc.saldiran_kayip);
    if (sSaflar) tahminMi = true;
  }
  if (!vSaflar && sonuc.savunan_baslangic) {
    vSaflar = safTahmin(sonuc.savunan_baslangic, sonuc.savunan_kayip);
    if (vSaflar) tahminMi = true;
  }
  if (!sSaflar && !vSaflar) return ''; // hic baslangic verisi de yok

  function birimInfoLocal(uid) {
    var realId = (uid||'').replace(/^kule_/, '');
    var u = (typeof UNITS !== 'undefined') ? UNITS[realId] : null;
    return {
      name: u ? (u.name || realId) : realId,
      icon: u ? (u.icon || '⚔') : '⚔'
    };
  }

  function renderOneOrdu(saflar, adi, taraf) {
    if (!saflar || !Array.isArray(saflar)) {
      return '<div style="color:#666;padding:10px">Saf bilgisi yok (eski rapor)</div>';
    }
    var benim = (taraf === 'atk' && benimTaraf === 'saldiran') || (taraf === 'def' && benimTaraf === 'savunan');
    var rozet = benim
      ? '<span style="background:#2ecc71;color:#000;padding:1px 7px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">BENİM</span>'
      : '<span style="background:#c0392b;color:#fff;padding:1px 7px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">DÜŞMAN</span>';
    var renk = taraf === 'atk' ? '#e74c3c' : '#3498db';

    var satirlar = saflar.map(function(saf, i){
      var slotCount = SAF_LIMITS[i] || saf.length || 1;
      var slotsHTML = '';
      for (var s = 0; s < slotCount; s++) {
        var slot = saf[s];
        if (!slot) {
          slotsHTML += '<div style="width:96px;height:88px;border:1px dashed #2a2a2a;border-radius:6px;opacity:0.4"></div>';
        } else {
          var info = birimInfoLocal(slot.unite_id);
          var olenRenk = slot.olen > 0 ? '#e67e22' : '#2ecc71';
          var adetRow = slot.olen > 0
            ? '<div style="font-size:10px;color:' + olenRenk + '">' + fmt(slot.baslangic) + '→' + fmt(slot.kalan) + '</div>'
            : '<div style="font-size:10px;color:#2ecc71">' + fmt(slot.kalan) + '</div>';
          slotsHTML += '<div style="width:96px;height:88px;border:2px solid ' + renk + '44;border-radius:6px;background:rgba(0,0,0,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px">' +
            '<div style="font-size:22px;line-height:1">' + info.icon + '</div>' +
            '<div style="font-size:10px;color:#d4af37;text-align:center;margin-top:2px;line-height:1.1">' + info.name + '</div>' +
            adetRow +
          '</div>';
        }
      }
      return '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:6px">' +
        '<div style="min-width:54px;font-size:10px;color:#888;align-self:center;font-family:Cinzel,serif">' + (i+1) + '. SAF</div>' +
        slotsHTML +
      '</div>';
    }).join('');

    // v1.14.1.47 (FAZ 1.1): Kule snapshot ayri bolum (sehir savunmasi)
    var kuleler = (taraf === 'atk')
      ? (sonuc.ganimet?._kuleler_saldiran || sonuc.saldiran_kuleler || [])
      : (sonuc.ganimet?._kuleler_savunan  || sonuc.savunan_kuleler  || []);
    var kuleHTML = '';
    if (Array.isArray(kuleler) && kuleler.length > 0) {
      var kuleSlotsHTML = kuleler.map(function(k){
        var info = birimInfoLocal(k.unite_id);
        var olenRenk = k.olen > 0 ? '#e67e22' : '#9b59b6';
        var adetRow = k.olen > 0
          ? '<div style="font-size:10px;color:' + olenRenk + '">' + fmt(k.baslangic) + '→' + fmt(k.kalan) + '</div>'
          : '<div style="font-size:10px;color:#9b59b6">' + fmt(k.kalan) + '</div>';
        return '<div style="width:96px;height:88px;border:2px solid #9b59b644;border-radius:6px;background:rgba(155,89,182,0.08);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px">' +
          '<div style="font-size:22px;line-height:1">' + info.icon + '</div>' +
          '<div style="font-size:10px;color:#9b59b6;text-align:center;margin-top:2px;line-height:1.1">' + info.name + '</div>' +
          adetRow +
        '</div>';
      }).join('');
      kuleHTML = '<div style="display:flex;justify-content:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px dashed #9b59b633">' +
        '<div style="min-width:54px;font-size:10px;color:#9b59b6;align-self:center;font-family:Cinzel,serif">🏰 KULE</div>' +
        kuleSlotsHTML +
      '</div>';
    }

    return '<div style="flex:1;min-width:300px;background:rgba(0,0,0,0.25);border:1px solid #333;border-radius:8px;padding:12px">' +
      '<div style="text-align:center;margin-bottom:10px;font-family:Cinzel,serif;color:' + renk + ';font-size:13px">' +
        (taraf==='atk'?'⚔':'🛡') + ' ' + adi + rozet +
      '</div>' +
      satirlar +
      kuleHTML +
    '</div>';
  }

  var baslikEk = tahminMi ? ' <span style="color:#f39c12;font-size:11px;font-weight:normal">(Tahmini — eski rapor, gerçek dizilim saklanmadı)</span>' : '';
  var tahminUyari = tahminMi
    ? '<div style="margin:0 auto 12px;max-width:800px;padding:8px 14px;background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.3);border-radius:6px;font-size:11px;color:#f39c12;text-align:center">⚠️ Bu eski bir rapor — saf dizilimi kaydedilmedi. Gösterilen dizilim tier/tip bazında <b>tahminidir</b>. 2026-04-23 sonrası savaşlarda gerçek dizilim görünür.</div>'
    : '';
  return '<div class="sr-sec-title">🪖 SAF DİZİLİMİ (Başlangıç → Kalan)' + baslikEk + '</div>' +
    tahminUyari +
    '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">' +
      renderOneOrdu(sSaflar, saldiranAdi, 'atk') +
      renderOneOrdu(vSaflar, savunanAdi,  'def') +
    '</div>';
}
