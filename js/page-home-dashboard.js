/* ═══════════════════════════════════════════════════════════
   HOME DASHBOARD — 12 panel dolumu (Klanlar overview tarzi)
   js/page-home-dashboard.js  v1.14.1.00
   home.html dashboard yapisini canli API verileri ile doldurur
═══════════════════════════════════════════════════════════ */

const _HP_FMT = (n) => (n || 0).toLocaleString('tr-TR');
const _HP_FMTK = (typeof fmtK === 'function') ? (n) => fmtK(n, 0) : _HP_FMT;

function _hpSet(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function _hpText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

/* ── 1) Sehir Basligi — OYUNCU global + HUD deger elementlerinden ── */
function hpLoadBaslik() {
  try {
    const p = (typeof OYUNCU !== 'undefined' && OYUNCU) ? OYUNCU : {};
    const cagRoman = ['','I','II','III','IV','V'][p.cag || 1] || p.cag;
    const tarafIkon = p.taraf === 'iyi' ? '☀' : '🌑';
    _hpText('hp-sehir-baslik', '🏰 ' + (p.sehir || p.kral || 'Noxara') + ' ' + tarafIkon);
    _hpText('hp-irk', (p.irk_ad || p.irk || '—'));
    _hpText('hp-cag', cagRoman + '. Çağ');
    _hpText('hp-koord', (p.koord_x || '?') + ':' + (p.koord_y || '?'));
    // Sehir degeri — HUD'daki hud-sehir-deger'den
    const sdEl = document.getElementById('hud-sehir-deger');
    if (sdEl && sdEl.textContent && sdEl.textContent !== '0') _hpText('hp-sehir-deger', sdEl.textContent);
    // Mutluluk — HUD'daki hud-sehir-moral'den
    const smEl = document.getElementById('hud-sehir-moral');
    if (smEl && smEl.textContent) _hpText('hp-mutluluk', smEl.textContent);
    // Ordu morali — HUD'daki hud-moral'den
    const omEl = document.getElementById('hud-moral');
    if (omEl && omEl.textContent) _hpText('hp-ordu-moral', '%' + omEl.textContent);
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

/* ── 4) Üretim ── */
// v1.14.1.22: prod global scope'a game-data.js'te `window.prod` olarak expose edildi.
// Eski kod: typeof prod !== 'undefined' — module/strict scope'ta window.prod'i
// yakalamiyordu, panel hep `—` kaliyordu. Simdi direkt window.prod okuyoruz +
// fallback olarak /api/game/uretim endpoint'ine ham fetch.
async function hpLoadUretim() {
  try {
    let prod = (typeof window !== 'undefined' && window.prod) ? window.prod : null;
    // Fallback: game-data henuz yuklenmediyse direkt endpoint
    if (!prod || Object.keys(prod).length === 0) {
      const token = getToken(); if (!token) return;
      const r = await fetch(API_BASE + '/api/game/uretim?_cb=' + Date.now(), {
        headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
      });
      if (!r.ok) return;
      const d = await r.json();
      prod = d.toplam || d || {};
    }
    _hpText('hp-prod-odun',   '+' + _HP_FMT(prod.odun   || 0));
    _hpText('hp-prod-metal',  '+' + _HP_FMT(prod.metal  || 0));
    _hpText('hp-prod-bugday', '+' + _HP_FMT(prod.bugday || 0));
    _hpText('hp-prod-balik',  '+' + _HP_FMT(prod.balik  || 0));
    _hpText('hp-prod-altin',  '+' + _HP_FMT(prod.altin  || 0));
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
    const entries = Object.entries(total).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!entries.length) { el.innerHTML = '<div style="color:#555;text-align:center">Ünite yok</div>'; return; }
    el.innerHTML = entries.map(([id, adet]) => {
      const uDef = (typeof UNITS !== 'undefined') ? UNITS[id] : null;
      const ad = uDef?.name || id;
      const icon = uDef?.icon || '⚔';
      return '<div class="kv"><span class="lbl">' + icon + ' ' + ad + '</span><span class="val">' + _HP_FMT(adet) + '</span></div>';
    }).join('');
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
