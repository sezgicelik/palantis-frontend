/* ═══════════════════════════════════════════════════════
   unite-karsilastir.js — Ünite Karşılaştırma (tur/2026-07-03, J5)
   SADECE OKUMA/GOSTERIM — UNITS + realAtk/realDef/realMaas/realCost
   (gelistirme seviyesi dahil) verilerini yan yana gosterir.
   army.html'de tab barina "⚖️ Karşılaştır" butonu enjekte eder.
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function _num(n) { return Number(n || 0).toLocaleString('tr-TR'); }

  function _birimler() {
    var side = (typeof OYUNCU !== 'undefined' && OYUNCU && OYUNCU.taraf === 'kotu') ? 'dark' : 'light';
    return Object.values(UNITS).filter(function (u) {
      return (u.side === side || u.side === 'neutral') && u.producible !== false && !u.yardimci;
    });
  }

  function _kapat() {
    var ov = document.getElementById('uk-overlay');
    if (ov) ov.remove();
    document.removeEventListener('keydown', _escTusu);
  }
  function _escTusu(e) { if (e.key === 'Escape') _kapat(); }

  function uniteKarsilastirAc() {
    if (typeof UNITS === 'undefined') return;
    _kapat();
    var birimler = _birimler();
    if (birimler.length < 2) return;

    var opts = birimler.map(function (u) {
      return '<option value="' + u.id + '">' + _esc(u.icon + ' ' + u.name + ' (T' + u.tier + ')') + '</option>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'uk-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:12px';
    ov.innerHTML =
      '<div style="width:min(560px,96vw);max-height:88vh;overflow-y:auto;background:linear-gradient(180deg,#14100a,#0d0805);border:1px solid #d4af37;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,0.85);padding:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(212,175,55,0.25)">' +
          '<span style="font-family:Cinzel,serif;color:#d4af37;font-size:14px;font-weight:bold">⚖️ Ünite Karşılaştırma</span>' +
          '<button onclick="window.uniteKarsilastirKapat()" aria-label="Kapat" style="background:none;border:none;color:#888;cursor:pointer;font-size:20px;min-width:44px;min-height:44px">✕</button>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
          '<select id="uk-sec-a" onchange="window.uniteKarsilastirCiz()" style="flex:1;min-width:150px;padding:8px;background:#111;border:1px solid #333;color:#ddd;border-radius:6px;font-size:12px">' + opts + '</select>' +
          '<select id="uk-sec-b" onchange="window.uniteKarsilastirCiz()" style="flex:1;min-width:150px;padding:8px;background:#111;border:1px solid #333;color:#ddd;border-radius:6px;font-size:12px">' + opts + '</select>' +
        '</div>' +
        '<div id="uk-tablo"></div>' +
        '<div style="color:#666;font-size:10px;margin-top:8px">ATK/DEF değerleri geliştirme seviyeni içerir. Yeşil = o satırda daha iyi.</div>' +
      '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) _kapat(); });
    document.body.appendChild(ov);
    document.addEventListener('keydown', _escTusu);

    // Varsayilan: ilk iki farkli birim
    var selB = document.getElementById('uk-sec-b');
    if (selB && birimler.length > 1) selB.selectedIndex = 1;
    uniteKarsilastirCiz();
  }

  function _statlar(u) {
    var atk = (typeof realAtk === 'function') ? realAtk(u.id) : u.baseAtk;
    var def = (typeof realDef === 'function') ? realDef(u.id) : u.baseDef;
    var maas = (typeof realMaas === 'function') ? realMaas(u.maas) : u.maas;
    var cost = (typeof realCost === 'function') ? realCost(u.cost) : (u.cost || {});
    var altinMaliyet = cost.altin || 0;
    return {
      atk: atk, def: def, maas: maas, cost: cost,
      etkinAtk: atk * (u.saldiriCarpan || 1),
      atkPerMaas: maas > 0 ? (atk * (u.saldiriCarpan || 1)) / maas : null,
      defPerMaas: maas > 0 ? def / maas : null,
      atkPer1kAltin: altinMaliyet > 0 ? (atk * (u.saldiriCarpan || 1)) / (altinMaliyet / 1000) : null
    };
  }

  function _costHtml(cost, extraCost) {
    var RI = (typeof RICONS !== 'undefined') ? RICONS : {};
    var parca = Object.entries(cost || {}).map(function (e) {
      return (RI[e[0]] || '📦') + ' ' + _num(e[1]);
    });
    Object.entries(extraCost || {}).forEach(function (e) {
      parca.push(_esc(e[0]) + ': ' + _num(e[1]));
    });
    return parca.join('<br>') || '—';
  }

  function uniteKarsilastirCiz() {
    var tablo = document.getElementById('uk-tablo');
    var aId = document.getElementById('uk-sec-a')?.value;
    var bId = document.getElementById('uk-sec-b')?.value;
    if (!tablo || !aId || !bId) return;
    var a = UNITS[aId], b = UNITS[bId];
    if (!a || !b) return;
    var sa = _statlar(a), sb = _statlar(b);

    function fmtOran(x) { return x == null ? '—' : (Math.round(x * 100) / 100).toLocaleString('tr-TR'); }

    // satir: [etiket, aDeger, bDeger, sayisalA, sayisalB, yuksekMiIyi]
    var satirlar = [
      ['Tier', 'T' + a.tier, 'T' + b.tier, null, null, null],
      ['Rol', _esc(a.role || '—'), _esc(b.role || '—'), null, null, null],
      ['ATK (geliştirmeli)', _num(sa.atk), _num(sb.atk), sa.atk, sb.atk, true],
      ['Saldırı Çarpanı', '×' + (a.saldiriCarpan || 1), '×' + (b.saldiriCarpan || 1), a.saldiriCarpan || 1, b.saldiriCarpan || 1, true],
      ['Etkin ATK (çarpanlı)', _num(sa.etkinAtk), _num(sb.etkinAtk), sa.etkinAtk, sb.etkinAtk, true],
      ['DEF (geliştirmeli)', _num(sa.def), _num(sb.def), sa.def, sb.def, true],
      ['Zırh', _num(a.zirh), _num(b.zirh), a.zirh || 0, b.zirh || 0, true],
      ['Maaş / P.G.', _num(sa.maas), _num(sb.maas), sa.maas, sb.maas, false],
      ['Eğitim Süresi', (a.trainDays || 0) + ' P.G.', (b.trainDays || 0) + ' P.G.', a.trainDays || 0, b.trainDays || 0, false],
      ['Savaş Turları', (a.savasTurlari || []).join(', ') || '—', (b.savasTurlari || []).join(', ') || '—', null, null, null],
      ['Etkin ATK / Maaş', fmtOran(sa.atkPerMaas), fmtOran(sb.atkPerMaas), sa.atkPerMaas, sb.atkPerMaas, true],
      ['DEF / Maaş', fmtOran(sa.defPerMaas), fmtOran(sb.defPerMaas), sa.defPerMaas, sb.defPerMaas, true],
      ['Etkin ATK / 1000 altın', fmtOran(sa.atkPer1kAltin), fmtOran(sb.atkPer1kAltin), sa.atkPer1kAltin, sb.atkPer1kAltin, true],
      ['Maliyet', _costHtml(sa.cost, a.extraCost), _costHtml(sb.cost, b.extraCost), null, null, null]
    ];

    var html = '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
      '<thead><tr>' +
        '<th style="text-align:left;padding:6px;color:#888;border-bottom:1px solid #2a2a2a"></th>' +
        '<th style="text-align:center;padding:6px;color:#d4af37;border-bottom:1px solid #2a2a2a">' + _esc(a.icon + ' ' + a.name) + '</th>' +
        '<th style="text-align:center;padding:6px;color:#d4af37;border-bottom:1px solid #2a2a2a">' + _esc(b.icon + ' ' + b.name) + '</th>' +
      '</tr></thead><tbody>';

    satirlar.forEach(function (s) {
      var renkA = '#ccc', renkB = '#ccc';
      if (s[3] != null && s[4] != null && s[3] !== s[4] && s[5] !== null) {
        var aIyi = s[5] ? s[3] > s[4] : s[3] < s[4];
        renkA = aIyi ? '#2ecc71' : '#888';
        renkB = aIyi ? '#888' : '#2ecc71';
      }
      html += '<tr style="border-bottom:1px solid #1a1a1a">' +
        '<td style="padding:5px 6px;color:#888">' + s[0] + '</td>' +
        '<td style="padding:5px 6px;text-align:center;color:' + renkA + '">' + s[1] + '</td>' +
        '<td style="padding:5px 6px;text-align:center;color:' + renkB + '">' + s[2] + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    tablo.innerHTML = html;
  }

  // Tab barina buton enjekte et (army.html)
  function init() {
    var bar = document.getElementById('army-tab-bar');
    if (!bar || document.getElementById('uk-ac-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'uk-ac-btn';
    btn.className = 'atab';
    btn.innerHTML = '⚖️ Karşılaştır';
    btn.title = 'İki üniteyi yan yana karşılaştır';
    btn.onclick = uniteKarsilastirAc;
    bar.appendChild(btn);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.uniteKarsilastirAc = uniteKarsilastirAc;
  window.uniteKarsilastirCiz = uniteKarsilastirCiz;
  window.uniteKarsilastirKapat = _kapat;
})();
