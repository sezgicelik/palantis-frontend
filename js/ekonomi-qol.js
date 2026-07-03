/* ═══════════════════════════════════════════════════════
   ekonomi-qol.js — Ekonomi QoL (tur/2026-07-03, J5)
   SADECE OKUMA/GOSTERIM — denge sayilarina dokunmaz.
   1) Gunluk net ozet karti (home dashboard)  ← /api/game/ekonomi-ozet?saat=24
   2) Maas/moral dusus uyarilari              ← /api/player/insights + maas/gelir orani
   Mount noktasi: home.html #hp-eko-ozet + #hp-eko-uyari
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KAYNAK_IKON = {
    altin: '💰', odun: '🌳', metal: '⛏️', kereste: '🪵', islenmis: '⚙️',
    bugday: '🌾', balik: '🎣', cig_et: '🥩', ekmek: '🍞', pismis: '🍳', pismis_et: '🍖'
  };
  var KAYNAK_AD = {
    altin: 'Altın', odun: 'Odun', metal: 'Metal', kereste: 'Kereste', islenmis: 'İşlenmiş',
    bugday: 'Buğday', balik: 'Balık', cig_et: 'Çiğ Et', ekmek: 'Ekmek', pismis: 'Piş.Balık', pismis_et: 'Piş.Et'
  };

  function _num(n) { return Math.round(Number(n) || 0).toLocaleString('tr-TR'); }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function uyariChip(seviye, metin) {
    var renk = seviye === 'acil' ? '#e74c3c' : '#e67e22';
    return '<div style="display:flex;align-items:flex-start;gap:6px;padding:6px 8px;margin-bottom:5px;' +
      'background:' + renk + '14;border:1px solid ' + renk + '44;border-left:3px solid ' + renk + ';border-radius:5px;font-size:11px;color:#ddd">' +
      '<span>' + (seviye === 'acil' ? '🚨' : '⚠️') + '</span><span>' + metin + '</span></div>';
  }

  async function yukleEkonomiOzet(token) {
    var ozetEl = document.getElementById('hp-eko-ozet');
    if (!ozetEl) return;
    try {
      var r = await fetch(API_BASE + '/api/game/ekonomi-ozet?saat=24', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || 'Hata');

      var net = d.net || {};
      var gelir = d.toplam_gelir || {};
      var gider = d.toplam_gider || {};

      // Onemli kaynaklarin net satirlari (hareket olanlar)
      var sira = ['altin', 'bugday', 'balik', 'odun', 'metal', 'kereste', 'islenmis', 'ekmek', 'pismis', 'pismis_et', 'cig_et'];
      var satirlar = sira.filter(function (k) { return net[k] !== undefined; }).slice(0, 6).map(function (k) {
        var n = net[k] || 0;
        var renk = n > 0 ? '#2ecc71' : (n < 0 ? '#e74c3c' : '#888');
        var isaret = n > 0 ? '+' : '';
        return '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px">' +
          '<span style="color:#aaa">' + (KAYNAK_IKON[k] || '📦') + ' ' + (KAYNAK_AD[k] || k) + '</span>' +
          '<span style="color:' + renk + ';font-weight:bold" title="Gelir ' + _num(gelir[k]) + ' − Gider ' + _num(gider[k]) + '">' + isaret + _num(n) + '</span>' +
        '</div>';
      }).join('');

      // Maas toplami (giderler icinden "Maas" gecen kategoriler)
      var maasAltin = 0;
      (d.giderler || []).forEach(function (row) {
        if (/maas/i.test(row.isim || '')) maasAltin += (row.toplamlar && row.toplamlar.altin) || 0;
      });
      var maasSatir = maasAltin > 0
        ? '<div style="display:flex;justify-content:space-between;padding:3px 0;margin-top:4px;border-top:1px dashed #222;font-size:11px">' +
            '<span style="color:#aaa">🧾 Toplam Maaş (24 P.G.)</span>' +
            '<span style="color:#f1c40f;font-weight:bold">-' + _num(maasAltin) + ' altın</span>' +
          '</div>'
        : '';

      if (!satirlar && !maasSatir) {
        ozetEl.innerHTML = '<div style="color:#666;font-size:11px">Son 24 P.G. ekonomik hareket yok.</div>';
      } else {
        ozetEl.innerHTML = satirlar + maasSatir +
          '<div style="color:#555;font-size:10px;margin-top:4px">Son 24 P.G. · ' + (d.log_sayisi || 0) + ' kayıt</div>';
      }

      // Maas uyarisi: maas gideri altin GELIRINI asiyorsa hazine eriyor demektir
      var uyariEl = document.getElementById('hp-eko-uyari');
      if (uyariEl && maasAltin > 0 && maasAltin > (gelir.altin || 0)) {
        uyariEl.innerHTML += uyariChip('orta',
          '<b>Maaş gideri altın gelirini aşıyor</b> (' + _num(maasAltin) + ' &gt; ' + _num(gelir.altin) +
          '). Hazine eriyor — işçi/ordu maaşlarını veya vergi gelirini gözden geçir.');
      }
      // Net altin negatifse ayrica goster
      if (uyariEl && (net.altin || 0) < 0) {
        uyariEl.innerHTML += uyariChip('orta',
          '<b>24 P.G. altın bilançosu negatif</b> (' + _num(net.altin) + '). Pazar satışı veya vergi ayarı düşün.');
      }
    } catch (e) {
      ozetEl.innerHTML = '<div style="color:#e74c3c;font-size:11px">Özet yüklenemedi: ' + _esc(e.message) + '</div>';
    }
  }

  async function yukleUyarilar(token) {
    var uyariEl = document.getElementById('hp-eko-uyari');
    if (!uyariEl) return;
    try {
      var r = await fetch(API_BASE + '/api/player/insights', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var d = await r.json();
      if (!r.ok || !d.ok) return; // sessiz — uyari paneli opsiyonel
      var uyarilar = d.uyarilar || [];
      if (!uyarilar.length) return;
      // acil once
      uyarilar.sort(function (a, b) {
        return (a.seviye === 'acil' ? 0 : 1) - (b.seviye === 'acil' ? 0 : 1);
      });
      uyariEl.innerHTML = uyarilar.map(function (u) {
        var ipucu = u.ipucu ? '<br><span style="color:#888;font-size:10px">💡 ' + _esc(u.ipucu) + '</span>' : '';
        return uyariChip(u.seviye, _esc(u.mesaj) + ipucu);
      }).join('') + uyariEl.innerHTML;
    } catch (e) { /* sessiz */ }
  }

  function init() {
    if (!document.getElementById('hp-eko-ozet')) return; // sadece home
    var token = (typeof getToken === 'function') ? getToken() : null;
    if (!token) return;
    yukleUyarilar(token);
    yukleEkonomiOzet(token);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
