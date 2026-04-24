/* ═══════════════════════════════════════════════════════════
   HOME DASHBOARD — 12 panel dolumu (Klanlar overview tarzi)
   js/page-home-dashboard.js  v1.14.1.00
   home.html dashboard yapisini canli API verileri ile doldurur
═══════════════════════════════════════════════════════════ */

const _HP_FMT = (n) => (n || 0).toLocaleString('tr-TR');
const _HP_FMTK = (typeof fmtK === 'function') ? (n) => fmtK(n, 0) : _HP_FMT;

function _hpSet(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function _hpText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

/* ── 1) Sehir Basligi — OYUNCU + DOGRUDAN API (HUD gecikirse bekleme yok) ── */
// v1.14.1.29: Sehir deger, mutluluk, ordu morali direkt endpoint'lerden okuyalim
// (eski: HUD elementlerinden; HUD gec dolunca "—" veya 0 kaliyordu).
async function hpLoadBaslik() {
  try {
    const p = (typeof OYUNCU !== 'undefined' && OYUNCU) ? OYUNCU : {};
    const cagRoman = ['','I','II','III','IV','V'][p.cag || 1] || p.cag;
    const tarafIkon = p.taraf === 'iyi' ? '☀' : '🌑';
    _hpText('hp-sehir-baslik', '🏰 ' + (p.sehir || p.kral || 'Noxara') + ' ' + tarafIkon);
    _hpText('hp-irk', (p.irk_ad || p.irk || '—'));
    _hpText('hp-cag', cagRoman + '. Çağ');
    _hpText('hp-koord', (p.koord_x || '?') + ':' + (p.koord_y || '?'));

    const token = getToken(); if (!token) return;
    // Paralel fetch: player/me, gps, army-state
    const [meR, gpsR, armyR] = await Promise.all([
      fetch(API_BASE + '/api/player/me?_cb=' + Date.now(), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' }).catch(()=>null),
      fetch(API_BASE + '/api/game/gps?_cb=' + Date.now(), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' }).catch(()=>null),
      fetch(API_BASE + '/api/army/state?_cb=' + Date.now(), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' }).catch(()=>null),
    ]);
    if (meR?.ok) {
      const me = await meR.json();
      if (me.toplam_alan) _hpText('hp-sehir-deger', _HP_FMT(me.toplam_alan));
    }
    if (gpsR?.ok) {
      const gps = await gpsR.json();
      // Sehir deger yoksa GPS.toplam_deger'den
      const sdEl = document.getElementById('hp-sehir-deger');
      if (sdEl && (!sdEl.textContent || sdEl.textContent === '—') && gps.sehir_deger) {
        _hpText('hp-sehir-deger', _HP_FMT(gps.sehir_deger));
      }
      // Mutluluk
      const ham = parseInt(gps.sehir_morali_ham ?? gps.ham_sehir_moral ?? 0) || 0;
      const bonus = parseInt(gps.bina_moral_bonus ?? 0) || 0;
      const max = parseInt(gps.moral_max ?? 5000) || 5000;
      if (ham || bonus) _hpText('hp-mutluluk', ham + ' / ' + max + (bonus ? ' +' + bonus : ''));
    }
    if (armyR?.ok) {
      const army = await armyR.json();
      if (army.ordu_morali !== undefined) _hpText('hp-ordu-moral', '%' + army.ordu_morali);
    }
    // Fallback: HUD elementleri daha guncel olabilir — uzerine yaz
    setTimeout(() => {
      const sdEl = document.getElementById('hud-sehir-deger');
      if (sdEl?.textContent && sdEl.textContent !== '0' && sdEl.textContent !== '—') _hpText('hp-sehir-deger', sdEl.textContent);
      const smEl = document.getElementById('hud-sehir-moral');
      if (smEl?.textContent && smEl.textContent !== '0') _hpText('hp-mutluluk', smEl.textContent);
      const omEl = document.getElementById('hud-moral');
      if (omEl?.textContent && omEl.textContent !== '0') _hpText('hp-ordu-moral', '%' + omEl.textContent);
    }, 2500);
  } catch(e) { console.warn('[hpBaslik]', e.message); }
}
// Eski ismi korurmek icin
async function hpLoadDeger() { hpLoadBaslik(); }

/* ── 2) Gelen Saldırı ── */
async function hpLoadGelen() {
  const el = document.getElementById('hp-gelen');
  if (!el) return;
  try {
    const token = getToken(); if (!token) { el.textContent = '—'; return; }
    const r = await fetch(API_BASE + '/api/game/gelen-ordular?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<span class="loading">API hata</span>'; return; }
    const d = await r.json();
    const ordular = d.ordular || [];
    const buyuler = d.ustume_buyu_detay || [];
    const kadim = (d.kadim_saldiri_detay || []).filter(k => k.faz === 'yolda' || k.faz === 'uyari');

    if (!ordular.length && !buyuler.length && !kadim.length) {
      el.innerHTML = '<div class="ok" style="text-align:center;padding:8px 0">✓ Gelen saldırı yok</div>';
      return;
    }
    let html = '';
    if (ordular.length) {
      html += '<div class="alert" style="margin-bottom:4px">⚠️ ' + ordular.length + ' ordu yolda!</div>';
      html += ordular.slice(0, 3).map(o => {
        const kalan = o.varis ? Math.max(0, Math.floor((new Date(o.varis) - Date.now()) / 60000)) : 0;
        const gelenIsim = o.saldiran_kral || o.saldiran_sehir || 'Bilinmeyen';
        return '<div class="kv"><span class="lbl">⚔️ ' + gelenIsim + '</span><span class="val alert">' + kalan + ' dk</span></div>';
      }).join('');
    }
    if (buyuler.length) {
      html += buyuler.slice(0, 2).map(b => '<div class="kv"><span class="lbl">🔮 ' + (b.buyu_ad || b.buyu_id) + '</span><span class="val">' + (b.kalan_pg || '?') + ' PG</span></div>').join('');
    }
    if (kadim.length) {
      html += kadim.slice(0, 1).map(k => '<div class="kv alert"><span>⚔️ Kadim Saldırı</span><span class="val">' + (k.kalan_pg || '?') + ' PG</span></div>').join('');
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<span class="loading">API hata</span>'; }
}

/* ── 3) Ordularım ── */
async function hpLoadOrdularim() {
  const el = document.getElementById('hp-ordularim');
  if (!el) return;
  try {
    const token = getToken(); if (!token) { el.textContent = '—'; return; }
    const r = await fetch(API_BASE + '/api/army/state?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<span class="loading">API hata</span>'; return; }
    const d = await r.json();
    const ordular = d.armies || [];
    if (!ordular.length) { el.innerHTML = '<div style="text-align:center;color:#888">Henüz ordu yok</div>'; return; }
    el.innerHTML = ordular.slice(0, 5).map(o => {
      let durum, renk;
      if (o.is_busy && o.aktif_gorev) {
        const g = o.aktif_gorev;
        const tip = g.tip === 'saldiri' ? '⚔️ Saldırı' : (g.tip === 'takviye' ? '🛡️ Takviye' : (g.tip.startsWith('donus') ? '🏠 Dönüş' : g.tip));
        durum = tip + ' → ' + (g.hedef_x || '?') + ':' + (g.hedef_y || '?');
        renk = g.tip.startsWith('donus') ? '#27ae60' : '#e67e22';
      } else if (o.konum_tipi === 'korumada') {
        durum = '🛡️ Korumada'; renk = '#9b59b6';
      } else {
        durum = '🏠 Şehirde'; renk = '#2ecc71';
      }
      return '<div class="kv"><span class="lbl">' + (o.isim || 'Ordu') + '</span><span style="color:' + renk + ';font-size:10px">' + durum + '</span></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<span class="loading">API hata</span>'; }
}

/* ── 4) Üretim (v1.14.1.30 — detay tablosu dashboard'a tasindi) ── */
async function hpLoadUretim() {
  // Detay tablosu (yeni)
  hpUretimDetayTablo();
  // Eski ozet tutucu (geriye uyumluluk — gizli elementler)
  return hpLoadUretimOzet();
}

async function hpUretimDetayTablo() {
  const host = document.getElementById('hp-uretim-detay');
  if (!host) return;
  try {
    const tok = getToken(); if (!tok) return;
    const r = await fetch(API_BASE + '/api/game/production?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store'
    });
    if (!r.ok) { host.innerHTML = '<span class="loading">API hata</span>'; return; }
    const d = await r.json();
    const baz = d.baz || {};
    const bolge = d.bolge_bonus || {};
    const irk = d.irk_bonus || {};
    const buyu = d.buyu_bonus || {};
    const toplam = d.toplam || {};

    const pData = (() => { try { return JSON.parse(localStorage.getItem('palantis_player') || 'null'); } catch { return null; } })();
    const premAktif = !!(pData?.premium?.aktif);
    const premYuzde = premAktif ? 10 : 0;

    const fmt = (n) => Math.floor(n || 0).toLocaleString('tr-TR');
    const hammadde = ['odun', 'metal', 'altin', 'kereste', 'islenmis'];
    const yiyecek = ['bugday', 'balik'];
    const kaynakIkon = {
      odun:'🌳 Odun', metal:'⛓ Metal', altin:'💰 Altın',
      bugday:'🌾 Buğday', balik:'🐟 Balık',
      kereste:'🪵 Kereste', islenmis:'🔩 İşlenmiş'
    };

    let rows = '';
    for (const [kaynak, label] of Object.entries(kaynakIkon)) {
      const bazMiktar = parseFloat(baz[kaynak]) || 0;
      const bolgeYuzde = parseFloat(bolge[kaynak]) || 0;
      const irkYuzde = parseFloat(irk[kaynak]) || 0;
      const buyuYuzde = hammadde.includes(kaynak) ? (parseFloat(buyu.hammadde)||0)
                     : yiyecek.includes(kaynak) ? (parseFloat(buyu.yiyecek)||0) : 0;
      const bolgeEk = Math.floor(bazMiktar * bolgeYuzde / 100);
      const irkEk = Math.floor(bazMiktar * irkYuzde / 100);
      const premEk = Math.floor(bazMiktar * premYuzde / 100);
      const buyuEk = Math.floor(bazMiktar * buyuYuzde / 100);
      const toplamDeger = parseFloat(toplam[kaynak]) || (bazMiktar + bolgeEk + irkEk + premEk + buyuEk);
      rows += '<tr style="border-bottom:1px solid #151515">' +
        '<td style="padding:4px 6px;color:#ccc">' + label + '</td>' +
        '<td style="padding:4px 4px;text-align:right;color:#aaa">' + fmt(bazMiktar) + '</td>' +
        '<td style="padding:4px 4px;text-align:right;color:#3498db">' + (bolgeEk > 0 ? '+' + fmt(bolgeEk) : '—') + '</td>' +
        '<td style="padding:4px 4px;text-align:right;color:#e67e22">' + (irkEk > 0 ? '+' + fmt(irkEk) : '—') + '</td>' +
        '<td style="padding:4px 4px;text-align:right;color:#f1c40f">' + (premEk > 0 ? '+' + fmt(premEk) : '—') + '</td>' +
        '<td style="padding:4px 4px;text-align:right;color:#9b59b6">' + (buyuEk > 0 ? '+' + fmt(buyuEk) : '—') + '</td>' +
        '<td style="padding:4px 6px;text-align:right;color:#2ecc71;font-weight:bold">' + fmt(toplamDeger) + '</td>' +
      '</tr>';
    }
    // Mana
    for (const renk of ['beyaz', 'kirmizi', 'mavi', 'yesil']) {
      const key = 'mana_' + renk;
      const val = parseFloat(toplam[key]) || 0;
      if (val > 0) {
        const rCol = { beyaz:'#f5f5f5', kirmizi:'#e74c3c', mavi:'#3498db', yesil:'#2ecc71' }[renk];
        rows += '<tr style="border-bottom:1px solid #151515">' +
          '<td style="padding:4px 6px;color:' + rCol + '">🔮 Mana ' + renk.charAt(0).toUpperCase()+renk.slice(1) + '</td>' +
          '<td colspan="5" style="padding:4px;text-align:right;color:#555;font-size:10px;font-style:italic">(bilge + yakariş dahil)</td>' +
          '<td style="padding:4px 6px;text-align:right;color:' + rCol + ';font-weight:bold">' + fmt(val) + '</td>' +
        '</tr>';
      }
    }

    host.innerHTML =
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;font-size:10.5px;min-width:480px">' +
        '<thead><tr style="background:rgba(212,175,55,0.06);border-bottom:1px solid #2a2010">' +
          '<th style="padding:5px 6px;text-align:left;color:#c8a96e;font-family:Cinzel,serif">Kaynak</th>' +
          '<th style="padding:5px 4px;text-align:right;color:#888">Baz</th>' +
          '<th style="padding:5px 4px;text-align:right;color:#3498db">Bölge</th>' +
          '<th style="padding:5px 4px;text-align:right;color:#e67e22">Irk</th>' +
          '<th style="padding:5px 4px;text-align:right;color:#f1c40f">Prem</th>' +
          '<th style="padding:5px 4px;text-align:right;color:#9b59b6">Büyü/Art.</th>' +
          '<th style="padding:5px 6px;text-align:right;color:#2ecc71">TOPLAM/sa</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  } catch(e) {
    host.innerHTML = '<span class="loading">Hata: ' + e.message + '</span>';
  }
}

// v1.14.1.30: Eski ozet fonksiyonu — geriye uyumluluk (gizli element guncelleme)
async function hpLoadUretimOzet() {
  try {
    let prod = (typeof window !== 'undefined' && window.prod) ? window.prod : null;
    // Fallback: game-data henuz yuklenmediyse direkt endpoint
    // v1.14.1.23 FIX: endpoint /api/game/production (uretim DEGIL)
    if (!prod || Object.keys(prod).length === 0) {
      const token = getToken(); if (!token) return;
      const r = await fetch(API_BASE + '/api/game/production?_cb=' + Date.now(), {
        headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
      });
      if (!r.ok) return;
      const d = await r.json();
      prod = d.toplam || d || {};
    }
    const stil0 = 'color:#e74c3c;font-weight:bold';
    function _hpProd(id, v) {
      const el = document.getElementById(id);
      if (!el) return;
      if (!v || v <= 0) {
        el.innerHTML = '<span style="' + stil0 + '">+0</span>';
      } else {
        el.textContent = '+' + _HP_FMT(v);
      }
    }
    _hpProd('hp-prod-odun',   prod.odun);
    _hpProd('hp-prod-metal',  prod.metal);
    _hpProd('hp-prod-bugday', prod.bugday);
    _hpProd('hp-prod-balik',  prod.balik);
    _hpProd('hp-prod-altin',  prod.altin);

    // v1.14.1.23: Butun ana kaynak uretimi 0 ise uyari banner ekle
    const toplamProd = (prod.odun||0) + (prod.metal||0) + (prod.bugday||0) + (prod.balik||0) + (prod.altin||0);
    const panel = document.querySelector('#hp-prod-odun')?.closest('.panel-body');
    if (panel && toplamProd === 0 && !panel.querySelector('.hp-uretim-uyari')) {
      const uyari = document.createElement('div');
      uyari.className = 'hp-uretim-uyari';
      uyari.style.cssText = 'margin-top:10px;padding:8px 10px;background:rgba(231,76,60,0.12);border:1px solid rgba(231,76,60,0.4);border-radius:5px;color:#e74c3c;font-size:11px;text-align:center';
      uyari.innerHTML = '⚠️ <b>Üretim durmuş!</b> İşçi atanmamış olabilir. <a href="population.html" style="color:#e74c3c;text-decoration:underline">Populasyon sayfasından işçi dağıt →</a>';
      panel.appendChild(uyari);
    }
  } catch(e) {}
}

/* ── 5) İnşa Kuyruğu ── */
async function hpLoadInsaat() {
  const el = document.getElementById('hp-insaat');
  if (!el) return;
  try {
    const token = getToken(); if (!token) return;
    // v1.14.1.01 FIX: /api/game/kuyruk-ozet dogru endpoint
    const r = await fetch(API_BASE + '/api/game/kuyruk-ozet?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<span class="loading">—</span>'; return; }
    const d = await r.json();
    const kuyruk = d.bina_kuyrugu || d.bina || [];
    if (!kuyruk.length) { el.innerHTML = '<div style="color:#555;text-align:center">Boş</div>'; return; }
    el.innerHTML = kuyruk.slice(0, 3).map(k => {
      const kalan = k.kalan_insa || k.kalan || 0;
      const sure = k.toplam_sure || k.insa_sure || 1;
      const yuzde = Math.min(100, Math.max(0, Math.round(((sure - kalan) / sure) * 100)));
      return '<div class="kv"><span class="lbl">' + (k.bina_adi || k.bina_id) + (k.yeni_seviye ? ' → Sv ' + k.yeni_seviye : '') + '</span><span class="val">%' + yuzde + '</span></div>' +
             '<div class="bar"><div class="bar-fill" style="width:' + yuzde + '%"></div></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<span class="loading">—</span>'; }
}

/* ── 6) Ünite Eğitimi ── */
async function hpLoadUniteKuyruk() {
  const el = document.getElementById('hp-unite-kuyruk');
  if (!el) return;
  try {
    const token = getToken(); if (!token) return;
    // v1.14.1.01 FIX: /api/game/army/queue dogru endpoint
    const r = await fetch(API_BASE + '/api/game/army/queue?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<span class="loading">—</span>'; return; }
    const d = await r.json();
    const kuyruk = Array.isArray(d) ? d : (d.kuyruk || d.queue || []);
    if (!kuyruk.length) { el.innerHTML = '<div style="color:#555;text-align:center">Boş</div>'; return; }
    el.innerHTML = kuyruk.slice(0, 3).map(k => {
      const uDef = (typeof UNITS !== 'undefined') ? UNITS[k.unite_id] : null;
      const ad = uDef?.name || k.unite_id || k.unite_adi || '?';
      return '<div class="kv"><span class="lbl">' + (uDef?.icon || '⚔') + ' ' + ad + '</span><span class="val">×' + _HP_FMT(k.adet || 0) + '</span></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<span class="loading">—</span>'; }
}

/* ── 7) Birimler (unit pool) ── */
async function hpLoadBirimler() {
  const el = document.getElementById('hp-birimler');
  if (!el) return;
  try {
    const token = getToken(); if (!token) return;
    const r = await fetch(API_BASE + '/api/army/state?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<span class="loading">API hata</span>'; return; }
    const d = await r.json();
    const havuz = d.unit_pool || [];
    // Ordudaki + havuzdaki toplam
    const total = {};
    havuz.forEach(u => { total[u.unite_id] = (total[u.unite_id] || 0) + (parseInt(u.adet) || 0); });
    (d.armies || []).forEach(a => {
      (a.units || []).forEach(u => {
        total[u.unite_id] = (total[u.unite_id] || 0) + (parseInt(u.adet) || 0);
      });
    });
    // v1.14.1.28: Tum birimler (havuz + ordular) — "V Daha fazla" ile expand
    const entries = Object.entries(total).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (!entries.length) { el.innerHTML = '<div style="color:#555;text-align:center">Ünite yok</div>'; return; }

    const renderSatir = ([id, adet]) => {
      const uDef = (typeof UNITS !== 'undefined') ? UNITS[id] : null;
      const ad = uDef?.name || id;
      const icon = uDef?.icon || '⚔';
      return '<div class="kv"><span class="lbl">' + icon + ' ' + ad + '</span><span class="val">' + _HP_FMT(adet) + '</span></div>';
    };

    const toplamBirim = entries.reduce((s, [_, v]) => s + v, 0);
    const ilk5 = entries.slice(0, 5).map(renderSatir).join('');
    const kalan = entries.slice(5);
    const totalRow = '<div class="kv" style="border-top:1px solid #333;margin-top:6px;padding-top:6px;font-weight:bold">' +
      '<span class="lbl" style="color:#d4af37">⚔️ TOPLAM</span>' +
      '<span class="val" style="color:#2ecc71">' + _HP_FMT(toplamBirim) + '</span></div>';

    let html = ilk5;
    if (kalan.length) {
      html += '<div id="hp-birim-kalan" style="display:none">' + kalan.map(renderSatir).join('') + '</div>';
      html += '<div style="text-align:center;margin-top:4px"><a href="#" class="ilink" onclick="var e=document.getElementById(\'hp-birim-kalan\'),b=this;if(e){e.style.display=e.style.display===\'none\'?\'block\':\'none\';b.textContent=e.style.display===\'none\'?\'▼ ' + kalan.length + ' daha →\':\'▲ Gizle\';}event.preventDefault();return false;" style="font-size:10px">▼ ' + kalan.length + ' daha →</a></div>';
    }
    html += totalRow;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<span class="loading">API hata</span>'; }
}

/* ── 8) Aktif Büyüler ── */
async function hpLoadBuyuler() {
  const el = document.getElementById('hp-buyuler');
  if (!el) return;
  try {
    const token = getToken(); if (!token) return;
    // v1.14.1.01 FIX: /api/buyucu-kulesi/aktif dogru endpoint
    const r = await fetch(API_BASE + '/api/buyucu-kulesi/aktif?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<div style="color:#555;text-align:center">—</div>'; return; }
    const d = await r.json();
    const aktif = (d.buyuler || d.aktif_buyuler || []).slice(0, 4);
    if (!aktif.length) { el.innerHTML = '<div style="color:#555;text-align:center">Aktif büyü yok</div>'; return; }
    el.innerHTML = aktif.map(b => {
      const kalan = b.kalan_pg || b.kalan_sure || 0;
      return '<div class="kv"><span class="lbl">' + (b.buyu_ad || b.buyu_id || '?') + '</span><span class="val">' + kalan + ' PG</span></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<div style="color:#555;text-align:center">—</div>'; }
}

/* ── 9) Aktif Etkiler ── */
function hpLoadEtkiler() {
  const el = document.getElementById('hp-etkiler');
  if (!el) return;
  // Basit: sabit etki goster (bonus özetinden devsirilebilir ileride)
  el.innerHTML = '<div style="color:#888;font-size:11px">Bölge · Irk · Çağ bonusları etkin</div>' +
                 '<div style="margin-top:4px;text-align:right"><a href="population.html" class="ilink">Detay →</a></div>';
}

/* ── 10) Son Raporlar ── */
async function hpLoadRaporlar() {
  const el = document.getElementById('hp-raporlar');
  if (!el) return;
  try {
    const token = getToken(); if (!token) return;
    // v1.14.1.01 FIX: /api/savas/gecmis dogru endpoint
    const r = await fetch(API_BASE + '/api/savas/gecmis?limit=3&_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<div style="color:#555;text-align:center">—</div>'; return; }
    const d = await r.json();
    const raporlar = d.savaslar || d.raporlar || (Array.isArray(d) ? d : []);
    if (!raporlar.length) { el.innerHTML = '<div style="color:#555;text-align:center">Henüz savaş yok</div>'; return; }
    const myId = d.benim_id;
    el.innerHTML = raporlar.slice(0, 3).map(rp => {
      const benSaldiran = rp.saldiran_id === myId;
      const benSavunan = rp.savunan_id === myId;
      const kazandi = rp.kazanan === 'saldiran' || rp.kazanan_id === rp.saldiran_id ? 'saldiran' : 'savunan';
      const benKazandi = (benSaldiran && kazandi === 'saldiran') || (benSavunan && kazandi === 'savunan');
      const hasim = benSaldiran ? (rp.savunan_kral || rp.savunan_sehir || '?') : (rp.saldiran_kral || rp.saldiran_sehir || '?');
      return '<div class="kv"><span class="' + (benKazandi ? 'ok' : 'alert') + '">' + (benKazandi ? '✓ Zafer' : '✗ Kayıp') +
             '</span><span style="font-size:10px;color:#888">' + hasim + '</span></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<div style="color:#555;text-align:center">—</div>'; }
}

/* ── 11) Guild ── */
async function hpLoadGuild() {
  const el = document.getElementById('hp-guild');
  if (!el) return;
  try {
    const token = getToken(); if (!token) return;
    const r = await fetch(API_BASE + '/api/guild/benim?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<div style="color:#555;text-align:center">Guild üyesi değilsin</div>'; return; }
    const d = await r.json();
    if (!d.guild) { el.innerHTML = '<div style="color:#555;text-align:center">Guild yok</div>'; return; }
    el.innerHTML =
      '<div><b class="val">' + (d.guild.isim || '—') + '</b></div>' +
      '<div class="kv"><span class="lbl">Unvan</span><span>' + (d.ben?.unvan || d.ben?.rutbe || '—') + '</span></div>' +
      '<div class="kv"><span class="lbl">Üye</span><span class="val">' + (d.uye_sayisi || '?') + '</span></div>' +
      '<div style="margin-top:4px;text-align:right"><a href="guild.html" class="ilink">Guild →</a></div>';
  } catch(e) { el.innerHTML = '<span class="loading">—</span>'; }
}

/* ═══ Ana load: tum panelleri paralel doldur ═══ */
function hpLoadAll() {
  hpLoadBaslik();
  hpLoadDeger();
  hpLoadGelen();
  hpLoadOrdularim();
  setTimeout(hpLoadUretim, 1500); // prod objesi game-data.js'ten sonra dolar
  hpLoadInsaat();
  hpLoadUniteKuyruk();
  hpLoadBirimler();
  hpLoadBuyuler();
  hpLoadEtkiler();
  hpLoadRaporlar();
  hpLoadGuild();
  hpLoadIsciTablo(); // v1.14.1.29
}

// v1.14.1.29 — İşçi + Esir + Toplam tablosu
async function hpLoadIsciTablo() {
  const el = document.getElementById('hp-isci-tablo');
  if (!el) return;
  try {
    const tok = getToken(); if (!tok) return;
    const r = await fetch(API_BASE + '/api/game/workers?_cb=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store'
    });
    if (!r.ok) { el.innerHTML = '<span class="loading">API hata</span>'; return; }
    const w = await r.json();
    const tipler = [
      { key: 'oduncu',  ad: '🌳 Oduncu' },
      { key: 'madenci', ad: '⛓ Madenci' },
      { key: 'ciftci',  ad: '🌾 Çiftçi' },
      { key: 'balikci', ad: '🎣 Balıkçı' },
      { key: 'tuccar',  ad: '💰 Tüccar' }
    ];
    let toplam_isci = 0, toplam_esir = 0;
    let rows = '';
    for (const t of tipler) {
      const isci = parseInt(w[t.key]) || 0;
      const esir = parseInt(w['esir_' + t.key]) || 0;
      const top = isci + esir;
      if (top === 0) continue;
      toplam_isci += isci;
      toplam_esir += esir;
      rows += '<tr style="border-bottom:1px solid #151515">' +
        '<td style="padding:3px 6px;color:#ccc">' + t.ad + '</td>' +
        '<td style="padding:3px 6px;text-align:right;color:#d4af37">' + isci.toLocaleString('tr-TR') + '</td>' +
        '<td style="padding:3px 6px;text-align:right;color:#9b59b6">' + (esir ? esir.toLocaleString('tr-TR') : '—') + '</td>' +
        '<td style="padding:3px 6px;text-align:right;color:#2ecc71;font-weight:bold">' + top.toLocaleString('tr-TR') + '</td>' +
      '</tr>';
    }
    if (!rows) {
      el.innerHTML = '<div style="color:#e74c3c;font-size:11px;text-align:center;padding:8px">⚠️ Hiç işçi yok — <a href="population.html" class="ilink">populasyon sayfasında dağıt</a></div>';
      return;
    }
    const toplamGenel = toplam_isci + toplam_esir;
    el.innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<thead><tr style="border-bottom:1px solid #2a2010">' +
          '<th style="text-align:left;padding:4px 6px;color:#c8a96e;font-family:Cinzel,serif">Tip</th>' +
          '<th style="text-align:right;padding:4px 6px;color:#d4af37">İşçi</th>' +
          '<th style="text-align:right;padding:4px 6px;color:#9b59b6">Esir</th>' +
          '<th style="text-align:right;padding:4px 6px;color:#2ecc71">Toplam</th>' +
        '</tr></thead><tbody>' + rows +
        '<tr style="border-top:2px solid #333;background:rgba(212,175,55,0.06)">' +
          '<td style="padding:4px 6px;font-weight:bold;color:#d4af37">TOPLAM</td>' +
          '<td style="text-align:right;padding:4px 6px;color:#d4af37;font-weight:bold">' + toplam_isci.toLocaleString('tr-TR') + '</td>' +
          '<td style="text-align:right;padding:4px 6px;color:#9b59b6;font-weight:bold">' + (toplam_esir ? toplam_esir.toLocaleString('tr-TR') : '—') + '</td>' +
          '<td style="text-align:right;padding:4px 6px;color:#2ecc71;font-weight:bold">' + toplamGenel.toLocaleString('tr-TR') + '</td>' +
        '</tr></tbody></table>';
  } catch(e) { el.innerHTML = '<span class="loading">API hata</span>'; }
}

// Sayfa yuklendiginde + 30 sn'de bir refresh
if (typeof window !== 'undefined') {
  window.hpLoadAll = hpLoadAll;
  window.hpToggle = window.hpToggle || function(head){
    const body = head.nextElementSibling;
    const tgl = head.querySelector('.panel-toggle');
    if (body.style.display === 'none') { body.style.display = ''; tgl.textContent = '▼'; }
    else { body.style.display = 'none'; tgl.textContent = '▶'; }
  };
  window.hpNotKaydet = window.hpNotKaydet || function(){
    try { localStorage.setItem('noxara_hp_not', document.getElementById('hp-not').value); } catch(e) {}
    if (typeof showToast === 'function') showToast('✓ Not kaydedildi', 'success');
  };

  // OYUNCU yuklendikten sonra dashboard'u doldur
  let _hpAttempts = 0;
  const _hpCheck = setInterval(function() {
    _hpAttempts++;
    if ((typeof OYUNCU !== 'undefined' && OYUNCU?.kral) || _hpAttempts > 25) {
      clearInterval(_hpCheck);
      hpLoadAll();
      // 60 sn'de bir paneli yeniden fetch (yeni veri icin)
      setInterval(hpLoadAll, 60000);
    }
  }, 500);
}
