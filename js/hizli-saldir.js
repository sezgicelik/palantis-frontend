/* ═══════════════════════════════════════════════════════
   hizli-saldir.js — Hızlı Saldır (tur/2026-07-03, J3)
   Sıralama ve Meydan satırından tek tıkla saldırı.
   Backend değişikliği YOK — mevcut endpointler:
     GET  /api/player/ara?isim=   → hedef doğrulama (saldiri_uygun, red_sebebi)
     GET  /api/army/state         → ordu listesi (şehirde/korumada, combat_units)
     POST /api/savas/saldir       → şehirdeki ordu ile saldırı
     POST /api/takviye/rolu-saldir→ korumadaki (relay) ordu ile saldırı
   Kullanım: hizliSaldirAc('KralIsmi')
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MIN_SAVAS_UNITE = 100; // backend orduSehirCikisKontrol ile ayni esik (gosterim amacli)

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _num(n) { return Number(n || 0).toLocaleString('tr-TR'); }
  function _toast(msg, tip) {
    if (typeof showToast === 'function') showToast(msg, tip || 'info');
    else if (typeof toast === 'function') toast(msg);
  }

  /* ── Overlay iskeleti ── */
  function _kapat() {
    var ov = document.getElementById('hs-overlay');
    if (ov) ov.remove();
    document.removeEventListener('keydown', _escKapat);
  }
  function _escKapat(e) { if (e.key === 'Escape') _kapat(); }

  function _overlayAc(icHtml) {
    _kapat();
    var ov = document.createElement('div');
    ov.id = 'hs-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:12px';
    ov.innerHTML =
      '<div id="hs-box" style="width:min(440px,96vw);max-height:86vh;overflow-y:auto;background:linear-gradient(180deg,#171009,#0d0805);border:1px solid #d4af37;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,0.85);padding:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(212,175,55,0.25)">' +
          '<span style="font-family:Cinzel,serif;color:#e74c3c;font-size:14px;font-weight:bold">⚔️ Hızlı Saldır</span>' +
          '<button onclick="window.hizliSaldirKapat()" aria-label="Kapat" style="background:none;border:none;color:#888;cursor:pointer;font-size:20px;min-width:44px;min-height:44px">✕</button>' +
        '</div>' +
        '<div id="hs-icerik">' + icHtml + '</div>' +
      '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) _kapat(); });
    document.body.appendChild(ov);
    document.addEventListener('keydown', _escKapat);
  }
  function _icerik(html) {
    var el = document.getElementById('hs-icerik');
    if (el) el.innerHTML = html;
  }

  /* ── Ana giriş: hedef ismiyle aç ── */
  var _hedef = null; // { id, kullanici_adi, koord_x, koord_y, ... }

  async function hizliSaldirAc(hedefIsim) {
    if (!hedefIsim) return;
    var token = (typeof getToken === 'function') ? getToken() : null;
    if (!token) { _toast('Oturum bulunamadı', 'error'); return; }

    if (typeof OYUNCU !== 'undefined' && OYUNCU && OYUNCU.kral === hedefIsim) {
      _toast('Kendinize saldıramazsınız', 'error');
      return;
    }

    _overlayAc('<div style="color:#888;font-size:12px;padding:16px;text-align:center">Hedef doğrulanıyor...</div>');

    // 1) Hedefi doğrula (/api/player/ara — saldiri_uygun + red_sebebi döner)
    var hedef = null;
    try {
      var r = await fetch(API_BASE + '/api/player/ara?isim=' + encodeURIComponent(hedefIsim), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var list = await r.json();
      if (Array.isArray(list)) {
        hedef = list.find(function (p) {
          return (p.kullanici_adi || '').toLowerCase() === hedefIsim.toLowerCase();
        }) || null;
      }
    } catch (e) { /* aşağıda hata gösterilir */ }

    if (!hedef) {
      _icerik('<div style="color:#e74c3c;font-size:12px;padding:12px">Oyuncu bulunamadı: <b>' + _esc(hedefIsim) + '</b></div>');
      return;
    }
    _hedef = hedef;

    var hedefBilgi =
      '<div style="background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.3);border-radius:6px;padding:8px 10px;margin-bottom:10px">' +
        '<div style="font-size:13px"><b style="color:#e74c3c">' + _esc(hedef.kullanici_adi) + '</b>' +
          ' <span style="color:#888;font-size:11px">Çağ ' + (hedef.cag || 1) + ' · ' + _esc(hedef.taraf || '?') + ' · ' + (hedef.koord_x || '?') + ':' + (hedef.koord_y || '?') + '</span></div>' +
        '<div style="color:#c8b896;font-size:11px;margin-top:2px">Şehir Değeri: ' + _num(hedef.sehir_deger) + '</div>' +
      '</div>';

    // 2) Saldırı uygun mu?
    if (hedef.saldiri_uygun === false) {
      _icerik(hedefBilgi +
        '<div style="color:#e74c3c;font-size:12px;padding:8px;background:rgba(231,76,60,0.06);border-radius:6px">🚫 ' + _esc(hedef.red_sebebi || 'Bu oyuncuya şu an saldırılamaz') + '</div>');
      return;
    }

    _icerik(hedefBilgi + '<div style="color:#888;font-size:12px;padding:8px;text-align:center">Ordular yükleniyor...</div>');

    // 3) Ordu listesi
    var armies = [];
    try {
      var ar = await fetch(API_BASE + '/api/army/state?_cb=' + Date.now(), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var ad = await ar.json();
      armies = (ad && ad.armies) || [];
    } catch (e) {
      _icerik(hedefBilgi + '<div style="color:#e74c3c;font-size:12px;padding:8px">Ordular yüklenemedi. Bağlantı hatası.</div>');
      return;
    }

    var uygunlar = armies.filter(function (a) {
      return !a.is_busy && (a.konum_tipi === 'sehir' || a.konum_tipi === 'korumada');
    });

    if (!uygunlar.length) {
      _icerik(hedefBilgi +
        '<div style="color:#c8b896;font-size:12px;padding:8px">Gönderilebilir ordu yok (hepsi görevde veya ordu kurulmamış).</div>' +
        '<a href="army.html" class="btn" style="display:inline-block;margin-top:8px;font-size:12px;padding:10px 16px;min-height:44px;box-sizing:border-box">🏇 Ordu Sayfasına Git</a>');
      return;
    }

    var satirlar = uygunlar.map(function (a) {
      var combat = (a.combat_units != null ? a.combat_units : a.total_units) || 0;
      var yeterli = combat >= MIN_SAVAS_UNITE;
      var relay = a.konum_tipi === 'korumada';
      var konum = relay ? '🛡️ Korumada (relay)' : '🏰 Şehirde';
      var altYazi = 'ATK ' + _num(a.atk) + ' · DEF ' + _num(a.def) + ' · ' + _num(combat) + ' savaş birimi';
      var uyari = yeterli ? '' : '<div style="color:#e74c3c;font-size:11px;margin-top:2px">Min ' + MIN_SAVAS_UNITE + ' savaş birimi gerekli</div>';
      return '<button ' + (yeterli ? '' : 'disabled ') +
        'onclick="window.hizliSaldirGonder(' + a.id + ',' + (relay ? 'true' : 'false') + ')" ' +
        'style="display:block;width:100%;text-align:left;margin-bottom:6px;padding:10px 12px;min-height:44px;background:' + (yeterli ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)') + ';border:1px solid ' + (yeterli ? 'rgba(212,175,55,0.35)' : '#2a2a2a') + ';border-radius:6px;cursor:' + (yeterli ? 'pointer' : 'not-allowed') + ';color:#f0e8d8;opacity:' + (yeterli ? '1' : '0.55') + '">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><b>' + _esc(a.isim || ('Ordu #' + a.id)) + '</b><span style="color:#888;font-size:11px">' + konum + '</span></div>' +
          '<div style="color:#c8b896;font-size:11px;margin-top:2px">' + altYazi + '</div>' +
          uyari +
        '</button>';
    }).join('');

    _icerik(hedefBilgi +
      '<div style="color:#c8b896;font-size:11px;margin-bottom:6px">Hangi ordu saldırsın?</div>' +
      satirlar +
      '<div style="color:#666;font-size:10px;margin-top:6px">Büyülü saldırı / saf düzeni için <a href="army.html" style="color:#d4af37">Ordu sayfasını</a> kullanın.</div>');
  }

  /* ── Saldırıyı gönder ── */
  async function hizliSaldirGonder(orduId, relay) {
    if (!_hedef) return;
    var token = (typeof getToken === 'function') ? getToken() : null;
    if (!token) return;

    var onay = await noxConfirm(
      _hedef.kullanici_adi + ' (' + (_hedef.koord_x || '?') + ':' + (_hedef.koord_y || '?') + ') hedefine saldırı gönderilsin mi?',
      '⚔️ Saldırı Onayı'
    );
    if (!onay) return;

    var url = relay ? '/api/takviye/rolu-saldir' : '/api/savas/saldir';
    try {
      var r = await fetch(API_BASE + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ orduId: orduId, hedefPlayerId: _hedef.id })
      });
      var data = await r.json();
      if (!r.ok) {
        _toast(data.error || 'Saldırı gönderilemedi', 'error');
        return;
      }
      _kapat();
      _toast(data.mesaj || 'Ordu saldırıya yola çıktı!', 'success');
      if (typeof loadGameData === 'function') { try { loadGameData(); } catch (e) {} }
    } catch (e) {
      _toast('Bağlantı hatası', 'error');
    }
  }

  window.hizliSaldirAc = hizliSaldirAc;
  window.hizliSaldirGonder = hizliSaldirGonder;
  window.hizliSaldirKapat = _kapat;
})();
