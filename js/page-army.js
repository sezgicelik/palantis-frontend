/* ══════════════════════════════════
   ORDU SiSTEMi — Sekmeler, Gelistirme, Egitim, Dizilim
   Extracted from index.html
══════════════════════════════════ */

// Unite gorsel helper: resim varsa img, yoksa emoji
// v1.13.68.3: Size paramini direkt px olarak uygula (inline kullanimi icin gerekli).
//             max 100% ile .uico container'dan tasmayi engelle. alt="" → broken img'de text duplikasyonu olmaz.
function unitIcon(u, size) {
  size = size || 32;
  if (u && u.img) return '<img src="' + u.img + '" alt="" style="width:' + size + 'px;height:' + size + 'px;max-width:100%;max-height:100%;object-fit:contain;vertical-align:middle;display:inline-block;flex-shrink:0">';
  return '<span style="font-size:' + Math.round(size*0.75) + 'px;line-height:1;display:inline-block;vertical-align:middle">' + (u ? u.icon || '⚔️' : '⚔️') + '</span>';
}

/* -- ORDU SEKMESi -- */
function armyTab(tab, el){
  document.querySelectorAll('.army-section').forEach(s=>s.style.display='none');
  const target = document.getElementById('atab-'+tab);
  if(target) target.style.display='block';

  document.querySelectorAll('.army-tabs .atab').forEach(b=>b.classList.remove('on'));
  const tbtn = document.getElementById('atab-btn-'+tab);
  if(tbtn) tbtn.classList.add('on');

  document.querySelectorAll('.army-sub').forEach(s=>s.classList.remove('on'));
  if(el && el.classList && el.classList.contains('army-sub')) {
    el.classList.add('on');
  } else {
    const match = document.querySelector('.army-sub[data-atab="'+tab+'"]');
    if(match) match.classList.add('on');
  }

  if(tab==='units') {
    renderSoldierPanel();
    const side = OYUNCU && OYUNCU.taraf === 'kotu' ? 'dark' : 'light';
    renderUnitGrid(side, 'ugrid-player');
  }
  if(tab==='armies') renderOrduListe();
  if(tab==='formation') {
    renderFormationGrid();
    const sel = document.getElementById('formation-army-select');
    if(sel) {
      sel.innerHTML = '<option value="">-- Ordu Sec --</option>';
      ORDULAR.forEach(o => {
        sel.innerHTML += '<option value="'+o.id+'">'+o.isim+'</option>';
      });
    }
  }
  if(tab==='upgrades') renderUpgrades();
}

/* -- GELISTIRME PANELI -- */
function renderUpgrades(){
  const panel = document.getElementById('atab-upgrades');
  if(!panel) return;
  const side = OYUNCU && OYUNCU.taraf === 'kotu' ? 'dark' : 'light';

  let html = `
  <div style="padding:15px">
    <h3 style="color:#f5f0e8;margin:0 0 15px">Global Gelistirmeler</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      <div style="background:#1a1a0a;border:1px solid #333;border-radius:8px;padding:12px;flex:1;min-width:200px">
        <div style="color:#f1c40f;font-weight:bold">Askeri Gelistirme</div>
        <div style="color:#aaa;font-size:11px;margin:4px 0">Ünite üretim altın maliyetini azaltır (%10/seviye)</div>
        <div style="color:#fff;margin:8px 0">Seviye: <b>${ASKERI_GEL_SEV}</b> / ${ASKERI_GEL_MAX}</div>
        <div style="color:#f1c40f;font-size:12px">İndirim: %${ASKERI_GEL_SEV*10}</div>
        ${ASKERI_GEL_SEV<ASKERI_GEL_MAX?`<button class="btn-action" onclick="upgradeGlobal('askeri')" style="margin-top:8px;padding:4px 12px;font-size:11px">Yükselt (${gelMaliyet('askeri')} Altın)</button>`:'<div style="color:#2ecc71;margin-top:8px">MAX SEVİYE</div>'}
      </div>
      <div style="background:#1a1a0a;border:1px solid #333;border-radius:8px;padding:12px;flex:1;min-width:200px">
        <div style="color:#f1c40f;font-weight:bold">Maaş Geliştirme</div>
        <div style="color:#aaa;font-size:11px;margin:4px 0">Tüm ünitelerin maaşını azaltır (%5/seviye)</div>
        <div style="color:#fff;margin:8px 0">Seviye: <b>${MAAS_GEL_SEV}</b> / ${MAAS_GEL_MAX}</div>
        <div style="color:#f1c40f;font-size:12px">İndirim: %${MAAS_GEL_SEV*5}</div>
        ${MAAS_GEL_SEV<MAAS_GEL_MAX?`<button class="btn-action" onclick="upgradeGlobal('maas')" style="margin-top:8px;padding:4px 12px;font-size:11px">Yükselt (${gelMaliyet('maas')} Altın)</button>`:'<div style="color:#2ecc71;margin-top:8px">MAX SEVİYE</div>'}
      </div>
    </div>

    <h3 style="color:#f5f0e8;margin:0 0 15px">Uniteye Ozel Gelistirmeler</h3>
    <div style="color:#aaa;font-size:11px;margin-bottom:10px">Her kademe ${GEL_MALIYET} altin. Gelistirmeler geri alinamaz!</div>
    <div style="display:flex;flex-direction:column;gap:8px">`;

  const playerUnits = Object.values(UNITS).filter(u=>u.side===side && u.producible !== false);
  playerUnits.forEach(u=>{
    const gel = UNIT_GEL[u.id] || {atk:0,def:0};
    const curAtk = realAtk(u.id);
    const curDef = realDef(u.id);
    const atkMax = gel.atk >= u.atkGelMax;
    const defMax = gel.def >= u.defGelMax;

    html += `
    <div style="background:#111;border:1px solid #222;border-radius:6px;padding:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="font-size:20px;width:30px;text-align:center">${u.icon}</div>
      <div style="min-width:100px"><b style="color:#e8e0d0">${u.name}</b><br><span style="color:#666;font-size:10px">ATK:${curAtk} DEF:${curDef}</span></div>
      <div style="flex:1;display:flex;gap:8px;flex-wrap:wrap">
        <div style="background:#1a0a0a;padding:6px 10px;border-radius:4px;border:1px solid #331111">
          <span style="color:#e74c3c;font-size:11px">ATK Gel.</span>
          <span style="color:#fff;font-size:11px"> ${gel.atk}/${u.atkGelMax}</span>
          <span style="color:#666;font-size:10px"> (+${u.atkGelArtis}/sv)</span>
          ${!atkMax?`<button onclick="upgradeUnit('${u.id}','atk')" style="margin-left:6px;padding:2px 8px;font-size:10px;background:#e74c3c;color:#fff;border:none;border-radius:3px;cursor:pointer">+</button>`:'<span style="color:#2ecc71;font-size:10px;margin-left:4px">MAX</span>'}
        </div>
        <div style="background:#0a0a1a;padding:6px 10px;border-radius:4px;border:1px solid #111133">
          <span style="color:#3498db;font-size:11px">DEF Gel.</span>
          <span style="color:#fff;font-size:11px"> ${gel.def}/${u.defGelMax}</span>
          <span style="color:#666;font-size:10px"> (+${u.defGelArtis}/sv)</span>
          ${!defMax?`<button onclick="upgradeUnit('${u.id}','def')" style="margin-left:6px;padding:2px 8px;font-size:10px;background:#3498db;color:#fff;border:none;border-radius:3px;cursor:pointer">+</button>`:'<span style="color:#2ecc71;font-size:10px;margin-left:4px">MAX</span>'}
        </div>
      </div>
    </div>`;
  });

  html += `</div>

    <h3 style="color:#f5f0e8;margin:20px 0 15px">Extra Kaynaklar</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">At/Kurt: <b style="color:#f1c40f">${EXTRA_RES.at||EXTRA_RES.kurt||0}</b></div>
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">Mana: <b style="color:#9b59b6">${EXTRA_RES.mana||0}</b></div>
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">Gizlilik: <b style="color:#2ecc71">${(EXTRA_RES.gizlilik||0).toFixed(1)}</b></div>
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">B.Yumurta: <b style="color:#e67e22">${(EXTRA_RES.buyulu_yumurta||0).toFixed(1)}</b></div>
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">Çiğ Et: <b style="color:#c0392b">${RES.cig_et||0}</b></div>
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">Pişmiş Et: <b style="color:#e67e22">${RES.pismis_et||0}</b></div>
    </div>
  </div>`;

  panel.innerHTML = html;
}

// Çağ bazlı max: her çağda +3 (max 15)
const ASKERI_GEL_MAX = Math.min((OYUNCU?.cag || 1) * 3, 15);
const MAAS_GEL_MAX = Math.min((OYUNCU?.cag || 1) * 3, 15);

function gelMaliyet(type) {
  const sev = type === 'askeri' ? ASKERI_GEL_SEV : MAAS_GEL_SEV;
  return GEL_MALIYET * (sev + 1); // Artan maliyet
}

async function upgradeGlobal(type){
  const maliyet = gelMaliyet(type);
  if((RES.altin||0) < maliyet){ toast('Yetersiz altın!'); return; }
  const maxSev = type === 'askeri' ? ASKERI_GEL_MAX : MAAS_GEL_MAX;
  const curSev = type === 'askeri' ? ASKERI_GEL_SEV : MAAS_GEL_SEV;
  if(curSev >= maxSev){ toast('Bu çağda max seviyeye ulaştın!'); return; }

  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/gelistir', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip: type })
    });
    const data = await resp.json();
    if(!resp.ok){ toast(data.error || 'Hata!'); return; }
    await loadArmyPool();
    await loadGameData();
    if(type === 'askeri') toast(`Askeri Geliştirme Seviye ${ASKERI_GEL_SEV}! Altın maliyeti -%${ASKERI_GEL_SEV*10}`);
    else toast(`Maaş Geliştirme Seviye ${MAAS_GEL_SEV}! Maaş -%${MAAS_GEL_SEV*5}`);
    renderUpgrades();
  } catch(e) { toast('Bağlantı hatası!'); }
}

async function upgradeUnit(unitId, stat){
  const u = UNITS[unitId]; if(!u) return;
  const gel = UNIT_GEL[unitId] || {atk:0,def:0};
  const curSev = stat === 'atk' ? gel.atk : gel.def;
  const maxSev = stat === 'atk' ? u.atkGelMax : u.defGelMax;
  if(curSev >= maxSev){ toast(`Max ${stat.toUpperCase()} seviye!`); return; }
  const maliyet = GEL_MALIYET * (curSev + 1);
  if((RES.altin||0) < maliyet){ toast(`Yetersiz altın! (${maliyet} gerekli)`); return; }

  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/gelistir', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip: 'unite_' + stat, unite_id: unitId })
    });
    const data = await resp.json();
    if(!resp.ok){ toast(data.error || 'Hata!'); return; }
    await loadArmyPool();
    await loadGameData();
    toast(`${u.name} ${stat.toUpperCase()} Geliştirme tamamlandı!`);
    renderUpgrades();
  } catch(e) { toast('Bağlantı hatası!'); }
}

/* -- ASKER YONETIMi -- */
function renderSoldierPanel(){
  const setText = (id,v) => { const e=document.getElementById(id); if(e) e.innerText=v; };
  const koylu = Math.max(0, population.free);
  setText('sm-koylu', koylu);
  setText('sm-asker', ASKER_SAYISI);
  // v1.13.67: sm-miktar artik input — value guncelle
  const inp = document.getElementById('sm-miktar');
  if (inp) inp.value = SM_MIKTAR;
}

function _smMax() {
  const koylu = Math.max(0, population.free);
  return Math.max(koylu, ASKER_SAYISI);
}

function smAdjust(d){
  SM_MIKTAR = Math.max(0, Math.min(SM_MIKTAR + d, _smMax()));
  renderSoldierPanel();
}

// v1.13.67: Input'a direkt yazinca cagrilir (onchange/oninput)
function smSet(v) {
  let n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) n = 0;
  SM_MIKTAR = Math.min(n, _smMax());
  // Input value'su zaten degisti, renderSoldierPanel cagirirsak tekrar atar — gerek yok
  // Sadece SM_MIKTAR degeri guncellendi
}

// v1.13.67: MAX butonu — yon bagimsiz, hangisi fazlaysa ona setler
function smMax() {
  SM_MIKTAR = _smMax();
  renderSoldierPanel();
  const msg = document.getElementById('sm-msg');
  if (msg) {
    const koylu = Math.max(0, population.free);
    const yon = koylu >= ASKER_SAYISI ? `Boş köylü: ${koylu}` : `Asker: ${ASKER_SAYISI}`;
    msg.textContent = `MAX → ${SM_MIKTAR} (${yon})`;
    msg.style.color = '#d4af37';
  }
}

async function smConvert(){
  const msgEl = document.getElementById('sm-msg');
  if(SM_MIKTAR <= 0){ msgEl.textContent = 'Donusturulecek koylu sayisini belirle.'; msgEl.style.color='#e74c3c'; return; }
  const koylu = Math.max(0, population.free);
  // v1.13.67: Net uyari — user 5500 yazdi, 100 koylu var ise clamp degil hata ver
  if(SM_MIKTAR > koylu){
    msgEl.textContent = `⚠️ Sadece ${koylu} boş köylün var, ${SM_MIKTAR} askere çeviremezsin!`;
    msgEl.style.color = '#e74c3c';
    return;
  }

  const token = getToken();
  if(token) {
    try {
      const resp = await fetch(API_BASE + '/api/game/soldiers/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ miktar: SM_MIKTAR, yon: 'askere' })
      });
      if(!resp.ok) {
        const err = await resp.json();
        document.getElementById('sm-msg').textContent = (err.error || 'Hata olustu');
        return;
      }
      const data = await resp.json();
      // v1.13.35: 0 falsy bug fix — asker 0 ise de dogru al
      if (data.workers && typeof data.workers.asker !== 'undefined') {
        ASKER_SAYISI = parseInt(data.workers.asker) || 0;
      } else {
        ASKER_SAYISI = ASKER_SAYISI + SM_MIKTAR;
      }
      population.free = Math.max(0, (population.free || 0) - SM_MIKTAR);
    } catch(e) {
      ASKER_SAYISI += SM_MIKTAR;
      population.free = Math.max(0, (population.free || 0) - SM_MIKTAR);
    }
  } else {
    ASKER_SAYISI += SM_MIKTAR;
    population.free = Math.max(0, (population.free || 0) - SM_MIKTAR);
  }

  document.getElementById('sm-msg').textContent = `${SM_MIKTAR} koylu askere cevrildi!`;
  SM_MIKTAR = 0;
  renderSoldierPanel();
  updateArmyStats();
  if (typeof updateBars === 'function') updateBars();
  // v1.13.35: Tek dogruluk kaynagi — backend'den yeniden cek
  if (typeof loadNufus === 'function') loadNufus();
}

async function smRelease(){
  const msgEl = document.getElementById('sm-msg');
  if(SM_MIKTAR <= 0){ msgEl.textContent = 'Koyluye cevrilecek asker sayisini belirle.'; msgEl.style.color='#e74c3c'; return; }
  if(SM_MIKTAR > ASKER_SAYISI){
    msgEl.textContent = `⚠️ Sadece ${ASKER_SAYISI} askerin var, ${SM_MIKTAR} köylüye çeviremezsin!`;
    msgEl.style.color = '#e74c3c';
    return;
  }

  const token = getToken();
  if(token) {
    try {
      const resp = await fetch(API_BASE + '/api/game/soldiers/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ miktar: SM_MIKTAR, yon: 'koylue' })
      });
      if(!resp.ok) {
        const err = await resp.json();
        document.getElementById('sm-msg').textContent = (err.error || 'Hata olustu');
        return;
      }
      const data = await resp.json();
      // v1.13.35: 0 falsy bug fix
      if (data.workers && typeof data.workers.asker !== 'undefined') {
        ASKER_SAYISI = parseInt(data.workers.asker) || 0;
      } else {
        ASKER_SAYISI = ASKER_SAYISI - SM_MIKTAR;
      }
      population.free = (population.free || 0) + SM_MIKTAR;
    } catch(e) {
      ASKER_SAYISI -= SM_MIKTAR;
      population.free = (population.free || 0) + SM_MIKTAR;
    }
  } else {
    ASKER_SAYISI -= SM_MIKTAR;
    population.free = (population.free || 0) + SM_MIKTAR;
  }

  document.getElementById('sm-msg').textContent = `${SM_MIKTAR} asker koyluye cevrildi.`;
  SM_MIKTAR = 0;
  renderSoldierPanel();
  updateArmyStats();
  if (typeof updateBars === 'function') updateBars();
  // v1.13.35: Tek dogruluk kaynagi — backend'den yeniden cek
  if (typeof loadNufus === 'function') loadNufus();
}

/* -- ORDU YONETIMi -- */
function orduYeniAc(){
  if(ORDULAR.length >= 5){ toast('Maksimum 5 ordu kurabilirsin!'); return; }
  ORDU_MIKTAR = 1;
  setText('ordu-miktar', ORDU_MIKTAR);
  document.getElementById('ordu-isim').value = '';
  document.getElementById('ordu-form-msg').textContent = '';
  document.getElementById('ordu-form').style.display = 'block';
}

function orduAdjust(d){
  ORDU_MIKTAR = Math.max(1, Math.min(ORDU_MIKTAR + d, 500, ASKER_SAYISI));
  setText('ordu-miktar', ORDU_MIKTAR);
}

async function orduKur(){
  const isim = document.getElementById('ordu-isim').value.trim();
  const msg = document.getElementById('ordu-form-msg');
  if(!isim){ msg.textContent = 'Ordu adı gir.'; return; }
  if(ORDU_MIKTAR < 1){ msg.textContent = 'En az 1 asker gerekli!'; return; }
  if(ORDULAR.length >= 5){ msg.textContent = 'Maksimum 5 ordu!'; return; }
  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/armies', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isim, raw_soldiers: ORDU_MIKTAR })
    });
    const data = await resp.json();
    if(!resp.ok){ msg.textContent = data.error || 'Hata!'; return; }
    document.getElementById('ordu-form').style.display = 'none';
    toast(`"${isim}" ordusu kuruldu! (${ORDU_MIKTAR} asker)`);
    await loadArmyPool();
    renderOrduListe();
  } catch(e) {
    msg.textContent = 'Bağlantı hatası!';
  }
}

async function orduSil(id){
  const ordu = ORDULAR.find(o=>o.id===id);
  if(!ordu) return;
  if(!confirm(`"${ordu.isim}" ordusunu dağıtmak istediğine emin misin?`)) return;
  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/armies/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!resp.ok){ toast('Ordu silinemedi!'); return; }
    toast(`"${ordu.isim}" ordusu dağıtıldı.`);
    await loadArmyPool();
    renderOrduListe();
  } catch(e) {
    toast('Bağlantı hatası!');
  }
}

function renderOrduListe(){
  const el = document.getElementById('ordu-liste');
  if(!el) return;
  const yeniBtn = document.getElementById('ordu-yeni-btn');
  if(yeniBtn) yeniBtn.style.display = ORDULAR.length >= 5 ? 'none' : 'inline-block';
  if(ORDULAR.length === 0){
    el.innerHTML = '<div class="card" style="text-align:center;color:#555;padding:32px">Henuz ordu kurulmamis. Once askere koylu cevir, sonra ordu kur.</div>';
    return;
  }
  const side = OYUNCU && OYUNCU.taraf === 'kotu' ? 'dark' : 'light';
  const playerUnits = Object.values(UNITS).filter(function(u){ return u.side === side && u.tier < 4; });
  const fmt = function(n){ return (n||0).toLocaleString('tr-TR'); };

  el.innerHTML = ORDULAR.map(function(o){
    // Tum unite tipleri listesi (taraf bazli)
    var allUnits = playerUnits.slice();
    // Ejderhalar da ekle
    var dragonUnits = Object.values(UNITS).filter(function(u){ return u.side === side && u.tier === 4; });
    allUnits = allUnits.concat(dragonUnits);

    // Ordudaki unite map
    var unitMap = {};
    (o.units||[]).forEach(function(u){ unitMap[u.unite_id] = u.adet; });

    // Sag taraf: tum uniteler listesi
    var uniteListeHTML = allUnits.map(function(u){
      var adet = unitMap[u.id] || 0;
      var renk = adet > 0 ? '#d4af37' : '#444';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:11px">' +
        '<span style="display:flex;align-items:center;gap:4px;color:' + (adet > 0 ? '#ccc' : '#555') + '">' + unitIcon(u, 20) + ' ' + u.name + '</span>' +
        '<span style="color:' + renk + ';font-weight:' + (adet > 0 ? 'bold' : 'normal') + '">' + fmt(adet) + '</span>' +
      '</div>';
    }).join('');

    // Ordu maasi hesapla
    var toplamMaas = 0;
    (o.units||[]).forEach(function(u){
      var def = UNITS[u.unite_id];
      if(def) toplamMaas += (def.maas||0) * u.adet;
    });

    // Havuzdan eklenebilir uniteler
    var poolUnits = playerUnits.filter(function(u){ return u.count > 0; });
    var poolDragons = dragonUnits.filter(function(u){ return u.count > 0; });
    var allPool = poolUnits.concat(poolDragons);

    // Konum bilgisi hesapla — v1.14.0.2: 4 durum: sehirde / yolda / korumada / kolonide
    var konumLabel = '';
    var konumRenk = '#2ecc71';
    var konumKoord = (typeof OYUNCU !== 'undefined' && OYUNCU ? (OYUNCU.koord_x||'?') + ':' + (OYUNCU.koord_y||'?') : '?:?');
    var korumada = o.konum_tipi === 'korumada';
    if (o.is_busy && o.aktif_gorev) {
      // v1.14.0.2 FIX: Yoldaysa gercek hedef goster, "Sehirde" deme
      var g = o.aktif_gorev;
      var tipKisa = g.tip === 'saldiri' ? '⚔️ Saldiri' : g.tip === 'takviye' ? '🛡️ Takviye' :
        g.tip === 'donus' ? '🏠 Donus' : g.tip.startsWith('donus') ? '🏠 Donus' :
        g.tip === 'koloni' ? '🏰 Koloni' : g.tip.startsWith('rolu') ? '🔀 Relay' : '🚀';
      konumLabel = tipKisa;
      konumKoord = (g.hedef_x||'?') + ':' + (g.hedef_y||'?');
      konumRenk = g.tip.startsWith('donus') ? '#27ae60' : '#e67e22';
    } else if (korumada && o.takviye) {
      var tkLabel = o.takviye.hedef_kral ? o.takviye.hedef_kral + '\'de' : (o.takviye.koloni_isim ? o.takviye.koloni_isim + ' Ussu' : 'Konuslandi');
      konumLabel = '📍 Korumada: ' + tkLabel;
      konumKoord = o.takviye.konum_x + ':' + o.takviye.konum_y;
      konumRenk = '#9b59b6';
    } else if (korumada) {
      konumLabel = '📍 Korumada';
      konumRenk = '#9b59b6';
    } else if (o.konum_tipi === 'koloni' || o.konum === 'kolonide') {
      konumLabel = '🏕️ Kolonide';
      konumKoord = o.koloni_bilgi ? (o.koloni_bilgi.x + ':' + o.koloni_bilgi.y) : '?:?';
      konumRenk = '#3498db';
    } else {
      konumLabel = '🏠 Sehirde';
      konumRenk = '#2ecc71';
    }
    var mesgulBadge = o.is_busy ? '<span style="background:#e74c3c22;color:#e74c3c;padding:1px 6px;border-radius:3px;font-size:11px;margin-left:6px">YOLDA</span>' : '';

    return '<div class="card" style="padding:0;margin-bottom:14px;border:1px solid #333;border-radius:8px;overflow:hidden">' +
      // Baslik bar
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(212,175,55,.08);border-bottom:1px solid #333;flex-wrap:wrap;gap:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-family:Cinzel,serif;font-size:14px;font-weight:bold;color:#d4af37">' + o.isim + '</span>' +
          mesgulBadge +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<span style="font-size:10px;color:' + konumRenk + ';background:' + konumRenk + '15;padding:2px 8px;border-radius:4px;border:1px solid ' + konumRenk + '33">' + konumLabel + ' <b>' + konumKoord + '</b></span>' +
          '<span style="font-size:11px;color:#aaa">ATK: <span style="color:#e74c3c">' + fmt(o.atk) + '</span> DEF: <span style="color:#3498db">' + fmt(o.def) + '</span></span>' +
          '<span style="font-size:11px;color:#d4af37">' + fmt(o.total_units) + ' asker</span>' +
        '</div>' +
      '</div>' +
      // Icerik: 3 sutun
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:0">' +
        // Sol: Ordu Bilgileri
        '<div style="padding:10px 12px;border-right:1px solid #222">' +
          '<div style="font-size:10px;color:#888;margin-bottom:6px;font-weight:bold">Ordu Bilgileri</div>' +
          '<div style="font-size:11px;color:#ccc;line-height:1.8">' +
            '<div>⚔️ ATK: <span style="color:#e74c3c;font-weight:bold">' + fmt(o.atk) + '</span></div>' +
            '<div>🛡️ DEF: <span style="color:#3498db;font-weight:bold">' + fmt(o.def) + '</span></div>' +
            '<div>👥 Toplam Asker: <span style="color:#d4af37">' + fmt(o.total_units) + '</span></div>' +
            '<div>💰 Maas/Gun: <span style="color:#f1c40f">' + fmt(toplamMaas) + '</span></div>' +
            '<div>📍 Konum: <span style="color:' + konumRenk + '">' + konumLabel + ' ' + konumKoord + '</span></div>' +
            '<div>📊 Reyting: <span style="color:#f1c40f">%' + (o.reyting||0) + '</span></div>' +
          '</div>' +
        '</div>' +
        // Orta: Aksiyon butonlari — v1.9.3 unified UX
        '<div style="padding:10px 12px;border-right:1px solid #222;min-width:130px">' +
          '<div style="font-size:10px;color:#888;margin-bottom:6px;font-weight:bold">Islemler</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px">' +
            '<button class="btn ghost" style="font-size:10px;padding:5px 8px" onclick="toggleFormationPanel(' + o.id + ')">⚔️ Saf Dizilimi</button>' +
            '<button class="btn ghost" style="font-size:10px;padding:5px 8px" onclick="toggleUniteYonetimi(' + o.id + ')">🗡️ Unite Yonetimi</button>' +
            (!o.is_busy && o.total_units >= 100 ?
              '<button class="btn ghost" style="font-size:10px;padding:5px 8px;color:#d4af37;border-color:#d4af3744" onclick="toggleOrduGonderPanel(' + o.id + ',\'' + (korumada ? 'korumada' : 'sehir') + '\')">📤 Ordu Gonder</button>'
            : '') +
            (korumada && !o.is_busy ?
              '<button class="btn ghost" style="font-size:10px;padding:5px 8px;color:#e74c3c;border-color:#e74c3c44" onclick="orduGeriCagir(' + o.id + ')">🏠 Geri Cagir</button>'
            : '') +
          '</div>' +
          '<div style="margin-top:10px"><button class="btn ghost" style="font-size:10px;padding:4px 8px;width:100%" onclick="orduSil(' + o.id + ')">Ordumu Sil</button></div>' +
        '</div>' +
        // Sag: Unite listesi
        '<div style="padding:10px 12px">' +
          '<div style="font-size:10px;color:#888;margin-bottom:6px;font-weight:bold">Uniteler</div>' +
          uniteListeHTML +
        '</div>' +
      '</div>' +
      // Alt: Unite yonetimi (gizli, toggle ile acilir)
      '<div id="unite-yon-' + o.id + '" style="display:none;padding:10px 12px;border-top:1px solid #333;background:rgba(0,0,0,.2)">' +
        '<div style="font-size:10px;color:#888;margin-bottom:6px;font-weight:bold">Havuzdan Unite Ekle / Cikar</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
          allPool.map(function(u){
            // v1.14.0.89: Input + preset butonlari (10, 100, 1K, MAX) + ✓ Ekle
            var inpId = 'uekle-' + o.id + '-' + u.id;
            return '<div style="display:flex;align-items:center;gap:3px;background:#111;border:1px solid #333;border-radius:4px;padding:4px 6px;flex-wrap:wrap">' +
              '<span style="display:flex;align-items:center;gap:2px;font-size:10px;color:#ccc;min-width:100px">' + unitIcon(u, 16) + ' ' + u.name + ' <b style="color:#c8a96e">(' + u.count + ')</b></span>' +
              '<input type="number" id="' + inpId + '" min="1" max="' + u.count + '" value="1" style="width:64px;padding:2px 4px;background:#0a0a0a;border:1px solid #2a2a2a;color:#fff;border-radius:3px;font-size:10px" />' +
              '<button style="background:#1a1a1a;border:1px solid #333;color:#aaa;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px" onclick="uksStepInp(\'' + inpId + '\',10,' + u.count + ')">+10</button>' +
              '<button style="background:#1a1a1a;border:1px solid #333;color:#aaa;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px" onclick="uksStepInp(\'' + inpId + '\',100,' + u.count + ')">+100</button>' +
              '<button style="background:#1a1a1a;border:1px solid #333;color:#aaa;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px" onclick="uksStepInp(\'' + inpId + '\',1000,' + u.count + ')">+1K</button>' +
              '<button style="background:#1a1a1a;border:1px solid #555;color:#c8a96e;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px;font-weight:bold" onclick="uksSetMax(\'' + inpId + '\',' + u.count + ')">MAX</button>' +
              '<button style="background:#1a3a1a;border:1px solid #2ecc71;color:#2ecc71;cursor:pointer;font-size:10px;padding:3px 8px;border-radius:3px;font-weight:bold" onclick="uksEkleInp(' + o.id + ',\'' + u.id + '\',\'' + inpId + '\')" title="Girilen adeti orduya ekle">✓ Ekle</button>' +
            '</div>';
          }).join('') +
          (allPool.length === 0 ? '<span style="color:#555;font-size:10px">Havuzda unite yok</span>' : '') +
        '</div>' +
        // Ordudaki uniteleri cikarma
        ((o.units||[]).filter(function(u){return u.adet>0;}).length > 0 ?
          '<div style="margin-top:8px;font-size:10px;color:#888;margin-bottom:4px">Ordudan Cikar:</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
            (o.units||[]).filter(function(u){return u.adet>0;}).map(function(u){
              var def = UNITS[u.unite_id];
              // v1.14.0.89: Input + preset + ✗ Cikar
              var cinpId = 'ucik-' + o.id + '-' + u.unite_id;
              return '<div style="display:flex;align-items:center;gap:3px;background:#111;border:1px solid #333;border-radius:4px;padding:4px 6px;flex-wrap:wrap">' +
                '<span style="display:flex;align-items:center;gap:2px;font-size:10px;color:#ccc;min-width:100px">' + unitIcon(def, 16) + ' ' + (def?.name||u.unite_id) + ' <b style="color:#c8a96e">(' + u.adet + ')</b></span>' +
                '<input type="number" id="' + cinpId + '" min="1" max="' + u.adet + '" value="1" style="width:64px;padding:2px 4px;background:#0a0a0a;border:1px solid #2a2a2a;color:#fff;border-radius:3px;font-size:10px" />' +
                '<button style="background:#1a1a1a;border:1px solid #333;color:#aaa;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px" onclick="uksStepInp(\'' + cinpId + '\',10,' + u.adet + ')">+10</button>' +
                '<button style="background:#1a1a1a;border:1px solid #333;color:#aaa;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px" onclick="uksStepInp(\'' + cinpId + '\',100,' + u.adet + ')">+100</button>' +
                '<button style="background:#1a1a1a;border:1px solid #333;color:#aaa;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px" onclick="uksStepInp(\'' + cinpId + '\',1000,' + u.adet + ')">+1K</button>' +
                '<button style="background:#1a1a1a;border:1px solid #555;color:#c8a96e;cursor:pointer;font-size:9px;padding:2px 5px;border-radius:3px;font-weight:bold" onclick="uksSetMax(\'' + cinpId + '\',' + u.adet + ')">MAX</button>' +
                '<button style="background:#3a1a1a;border:1px solid #c0392b;color:#e74c3c;cursor:pointer;font-size:10px;padding:3px 8px;border-radius:3px;font-weight:bold" onclick="uksCikarInp(' + o.id + ',\'' + u.unite_id + '\',\'' + cinpId + '\')" title="Girilen adeti havuza geri koy">✗ Çıkar</button>' +
              '</div>';
            }).join('') +
          '</div>' : '') +
      '</div>' +
      // v1.14.0.90: Inline saf dizilimi paneli (gizli, toggle ile acilir)
      '<div id="formation-panel-' + o.id + '" style="display:none;padding:12px;border-top:1px solid #333;background:rgba(0,0,0,.25)">' +
        (o.is_busy || (o.konum_tipi && o.konum_tipi !== 'sehir')
          ? '<div style="padding:12px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:12px">🔒 Saf dizilimi sadece ordu <b>Sehirde</b> iken duzenlenebilir. Bu ordu su an yolda/konuslanmis.</div>'
          : '<div id="formation-body-' + o.id + '"><div style="color:#888;font-size:11px;padding:10px">Yukleniyor...</div></div>'
        ) +
      '</div>' +
      // v1.9.3: Yoldaki görev bilgi barı
      (o.is_busy && o.aktif_gorev ? (function(){
        var g = o.aktif_gorev;
        var tipLabel = g.tip === 'saldiri' ? '⚔️ Saldiri' : g.tip === 'takviye' ? '🛡️ Takviye' :
          g.tip === 'koloni_us' ? '🏰 Koloni Us' : g.tip === 'rolu_saldiri' ? '⚔️ Relay Saldiri' :
          g.tip === 'donus' ? '🏠 Eve Donus' : g.tip === 'donus_takviye' ? '🏠 Eve Donus' :
          g.tip === 'donus_koloni_us' ? '🏠 Eve Donus' : g.tip === 'donus_rolu' ? '📍 Konuslanmaya Donus' : '🚀 ' + g.tip;
        var varisDate = g.varis ? new Date(g.varis) : null;
        var kalanMs = varisDate ? varisDate.getTime() - Date.now() : 0;
        var kalanStr = '';
        if (kalanMs > 0) {
          var kalanSaat = Math.floor(kalanMs / 3600000);
          var kalanDk = Math.floor((kalanMs % 3600000) / 60000);
          kalanStr = kalanSaat > 0 ? kalanSaat + 's ' + kalanDk + 'dk' : kalanDk + 'dk';
        } else {
          kalanStr = 'Variyor...';
        }
        return '<div style="padding:8px 12px;border-top:1px solid #e74c3c33;background:rgba(231,76,60,.06);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="color:#e74c3c;font-size:11px;font-weight:bold">' + tipLabel + '</span>' +
            '<span style="color:#888;font-size:10px">' + (g.kaynak_x||'?') + ':' + (g.kaynak_y||'?') + ' → ' + (g.hedef_x||'?') + ':' + (g.hedef_y||'?') + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="color:#f39c12;font-size:10px">' + (g.efektif_sure||'?') + ' PG</span>' +
            '<span style="color:#2ecc71;font-size:11px;font-weight:bold">⏱ ' + kalanStr + '</span>' +
          '</div>' +
        '</div>';
      })() : '') +
      // v1.9.3: Ordu Gonder paneli — koordinat girişli (gizli, toggle ile açılır)
      '<div id="ordu-gonder-panel-' + o.id + '" style="display:none;padding:12px;border-top:1px solid #d4af3744;background:rgba(212,175,55,.04)">' +
        '<div style="font-size:11px;color:#d4af37;font-weight:bold;margin-bottom:8px">📤 Ordu Gonder — ' + o.isim + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px">' +
          '<div>' +
            '<label style="color:#aaa;font-size:10px;display:block;margin-bottom:3px">X Koordinat</label>' +
            '<input id="og-x-' + o.id + '" type="number" min="1" max="200" placeholder="X" ' +
              'style="width:70px;background:#1a1a1a;border:1px solid #444;color:#eee;padding:6px 8px;border-radius:5px;font-size:12px;text-align:center">' +
          '</div>' +
          '<span style="color:#555;font-size:16px;padding-bottom:4px">:</span>' +
          '<div>' +
            '<label style="color:#aaa;font-size:10px;display:block;margin-bottom:3px">Y Koordinat</label>' +
            '<input id="og-y-' + o.id + '" type="number" min="1" max="50" placeholder="Y" ' +
              'style="width:70px;background:#1a1a1a;border:1px solid #444;color:#eee;padding:6px 8px;border-radius:5px;font-size:12px;text-align:center">' +
          '</div>' +
          '<button class="btn ghost" style="font-size:11px;padding:6px 14px;color:#d4af37;border-color:#d4af3744" onclick="orduGonderAra(' + o.id + ')">Ara</button>' +
        '</div>' +
        '<div id="og-sonuc-' + o.id + '" style="font-size:11px;color:#888;min-height:20px"></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function toggleUniteYonetimi(armyId) {
  var el = document.getElementById('unite-yon-' + armyId);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// v1.14.0.89: Unite ekle/cikar input helpers (preset +10/+100/+1K/MAX + input bazli)
function uksStepInp(inputId, delta, max) {
  var el = document.getElementById(inputId);
  if (!el) return;
  var cur = parseInt(el.value) || 0;
  el.value = Math.min(max, Math.max(1, cur + delta));
}
function uksSetMax(inputId, max) {
  var el = document.getElementById(inputId);
  if (el) el.value = max;
}
function uksEkleInp(armyId, uniteId, inputId) {
  var el = document.getElementById(inputId);
  var adet = parseInt(el?.value) || 0;
  if (adet <= 0) { if (typeof showToast === 'function') showToast('Gecerli miktar girin', 'error'); return; }
  orduUniteEkle(armyId, uniteId, adet);
}
function uksCikarInp(armyId, uniteId, inputId) {
  var el = document.getElementById(inputId);
  var adet = parseInt(el?.value) || 0;
  if (adet <= 0) { if (typeof showToast === 'function') showToast('Gecerli miktar girin', 'error'); return; }
  orduUniteCircar(armyId, uniteId, adet);
}
if (typeof window !== 'undefined') {
  window.uksStepInp = uksStepInp;
  window.uksSetMax = uksSetMax;
  window.uksEkleInp = uksEkleInp;
  window.uksCikarInp = uksCikarInp;
}

async function orduUniteEkle(armyId, uniteId, adet){
  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/armies/' + armyId + '/units', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unite_id: uniteId, adet })
    });
    const data = await resp.json();
    if(!resp.ok){ toast(data.error || 'Hata!'); return; }
    toast(`${UNITS[uniteId]?.name||uniteId} eklendi.`);
    await loadArmyPool();
    renderOrduListe();
  } catch(e) { toast('Bağlantı hatası!'); }
}

async function orduUniteCircar(armyId, uniteId, adet){
  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/armies/' + armyId + '/units', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unite_id: uniteId, adet })
    });
    const data = await resp.json();
    if(!resp.ok){ toast(data.error || 'Hata!'); return; }
    toast(`${UNITS[uniteId]?.name||uniteId} havuza geri verildi.`);
    await loadArmyPool();
    renderOrduListe();
  } catch(e) { toast('Bağlantı hatası!'); }
}

/* -- UNITE GRID -- */
function renderUnitGrid(side, gridId){
  const id = gridId || ('ugrid-'+side);
  const grid = document.getElementById(id);
  if(!grid) return;
  const units = Object.values(UNITS).filter(u=>u.side===side && u.producible !== false);
  grid.innerHTML = '';

  units.forEach(u=>{
    const rc = realCost(u.cost);
    const TIER_ASKER = { 1:1, 2:1, 3:1, 4:0 };
    const askerGerekli = TIER_ASKER[u.tier] || 0;
    const askerVar = population.asker || 0;
    const askerOk = askerGerekli === 0 || askerVar >= askerGerekli;
    const afford = canAfford(rc) && canAffordExtra(u.extraCost) && askerOk;
    const askerHTML = askerGerekli > 0
      ? `<span class="ucost-i ${askerOk?'ok':'no'}">Asker: ${askerGerekli}</span>`
      : '';
    const costHTML = Object.entries(rc).map(([r,a])=>{
      const have = RES[r]||0;
      return `<span class="ucost-i ${have>=a?'ok':'no'}">${RICONS[r]||'\ud83d\udce6'} ${a.toLocaleString()}</span>`;
    }).join('');
    const extraHTML = Object.entries(u.extraCost||{}).map(([r,a])=>{
      const icons = {at:'\ud83d\udc34',kurt:'\ud83d\udc3a',mana:'\ud83d\udd2e',gizlilik:'\ud83c\udfaf',buyulu_yumurta:'\ud83e\udd5a'};
      const names = {at:'At',kurt:'Kurt',mana:'Mana',gizlilik:'Gizlilik',buyulu_yumurta:'B.Yumurta'};
      const have = EXTRA_RES[r]||0;
      // v1.13.41: mana icin secili bilge rengini goster (orn. "5 Yesil Mana")
      if (r === 'mana') {
        var _kisi = null;
        try { _kisi = localStorage.getItem('noxara_kisisel_bilge'); } catch {}
        var _tr = (typeof loadPlayer === 'function') ? (loadPlayer()?.taraf) : null;
        var _renk = (_kisi && ['beyaz','kirmizi','mavi','yesil'].includes(_kisi)) ? _kisi
                  : (_tr === 'kotu' ? 'kirmizi' : 'beyaz');
        var RENK_AD = { beyaz:'Beyaz', kirmizi:'Kırmızı', mavi:'Mavi', yesil:'Yeşil' };
        return `<span class="ucost-i ${have>=a?'ok':'no'}" title="Secili bilge: ${_renk}">🔮 ${a} ${RENK_AD[_renk]} Mana</span>`;
      }
      return `<span class="ucost-i ${have>=a?'ok':'no'}">${icons[r]||'\ud83d\udce6'} ${a} ${names[r]||r}</span>`;
    }).join('');
    const tierCl = u.tier===1?'tier1':u.tier===2?'tier2':u.tier===3?'tier3':'tier4';
    const tierLbl = u.tier===1?'T1':u.tier===2?'T2':u.tier===3?'T3':'T4';
    const bgCol = side==='light' ? '#141200' : '#100010';
    const uAtk = realAtk(u.id);
    const uDef = realDef(u.id);
    const uMaas = realMaas(u.maas);
    const trainDays = u.trainDays || (u.tier===1?1:u.tier===2?2:3);

    const div = document.createElement('div');
    div.className = `urow ${side}-unit`;
    div.draggable = true;
    div.dataset.unitId = u.id;
    div.addEventListener('dragstart', e=>{ e.dataTransfer.setData('unitId', u.id); div.style.opacity='.5'; });
    div.addEventListener('dragend', ()=>div.style.opacity='1');

    // v1.13.68.1: Travian Klasik layout — body = 2-line nested div
    div.innerHTML = `
      <div class="uico" style="background:${bgCol}">${unitIcon(u, 48)}</div>
      <div class="u-body">
        <div class="u-line1">
          <span class="u-name">${u.name}</span>
          <span class="u-meta">${tierLbl} · ${u.role||''}${u.saldiriCarpan>1?' · ×'+u.saldiriCarpan:''}</span>
        </div>
        <div class="u-line2">${askerHTML}${costHTML}${extraHTML}</div>
      </div>
      <div class="u-stats">
        <span style="color:#e74c3c">ATK ${uAtk}</span>
        <span style="color:#3498db">DEF ${uDef}</span>
        <span style="color:#f1c40f">${uMaas}/g</span>
        <span style="color:#888">⏱ ${trainDays}PG</span>
      </div>
      <div class="u-ctrl">
        <button class="ucount-btn" onclick="changeCount('${u.id}',-1)">−</button>
        <input class="ucount-inp" id="cnt-${u.id}" value="${u.count}" type="number" min="0" onchange="setCount('${u.id}',this.value)">
        <button class="ucount-btn" onclick="changeCount('${u.id}',1)">+</button>
      </div>
      <button class="utrain-btn" ${afford?'':'disabled'} onclick="trainUnit('${u.id}')">EGIT</button>
    `;
    grid.appendChild(div);
  });

  updateArmyStats();
}

function changeCount(id, delta){
  const u = UNITS[id]; if(!u) return;
  u.count = Math.max(0, Math.min(u.maxCount, u.count + delta));
  const inp = document.getElementById('cnt-'+id); if(inp) inp.value = u.count;
  updateArmyStats();
}

function setCount(id, val){
  const u = UNITS[id]; if(!u) return;
  u.count = Math.max(0, Math.min(u.maxCount, parseInt(val)||0));
  updateArmyStats();
}

async function trainUnit(id){
  const u = UNITS[id]; if(!u) return;
  if(u.producible === false){ toast('Bu unite uretilemez!'); return; }
  const adet = u.count || 1;
  if(adet < 1){ toast('Egitilecek adet 0!'); return; }
  const baseCostOne = realCost(u.cost);
  const rc = {}; Object.entries(baseCostOne).forEach(([k,v])=>rc[k]=v*adet);
  // v1.13.35: Backend SOLDIER_COST ile senkron — tier 2/3 de 1 asker/unit (eskiden yanlis 2 ve 3 yaziyordu)
  const askerGerekliToplam = ({ 1:1, 2:1, 3:1, 4:0 }[u.tier] || 0) * adet;
  if(askerGerekliToplam > 0 && (population.asker || 0) < askerGerekliToplam){
    toast(`Yetersiz asker! ${askerGerekliToplam} asker gerekli, ${population.asker||0} var.`); return;
  }
  if(!canAfford(rc)){ toast('Yetersiz hammadde!'); return; }
  if(!canAffordExtra(u.extraCost)){
    const missing = Object.entries(u.extraCost).filter(([r,a])=>(EXTRA_RES[r]||0)<a*adet).map(([r])=>r).join(', ');
    toast('Yetersiz: ' + missing); return;
  }

  const token = getToken();
  if(token) {
    try {
      const resp = await fetch(API_BASE + '/api/game/army/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ uniteId: id, adet })
      });
      if(!resp.ok) {
        const err = await resp.json().catch(()=>({}));
        toast(err.error || 'Egitim baslatilamadi!');
        return;
      }
      spendExtra(u.extraCost);
      await loadGameData();
      setText('hud-w', RES.odun); setText('hud-m', RES.metal);
      setText('hud-g', RES.altin); setText('hud-bu', RES.bugday); setText('hud-ba', RES.balik);
      u.count = 0;
      const inp = document.getElementById('cnt-'+id); if(inp) inp.value = 0;
      updateArmyStats();
      const playerSide = loadPlayer()?.taraf === 'kotu' ? 'dark' : 'light';
      renderUnitGrid(playerSide);
      toast(`${adet}x ${u.name} egitim kuyruguna eklendi! (${u.trainDays} P.G.)`);
      loadTrainingQueue();
    } catch(e) {
      toast('Sunucuya baglanamadi.');
    }
  } else {
    const extraRc = {}; Object.entries(u.extraCost).forEach(([k,v])=>extraRc[k]=v*adet);
    spendCost(rc);
    spendExtra(extraRc);
    setText('hud-w', RES.odun); setText('hud-m', RES.metal);
    setText('hud-g', RES.altin); setText('hud-bu', RES.bugday); setText('hud-ba', RES.balik);
    u.count = 0;
    const inp = document.getElementById('cnt-'+id); if(inp) inp.value = 0;
    updateArmyStats();
    const playerSide = loadPlayer()?.taraf === 'kotu' ? 'dark' : 'light';
    renderUnitGrid(playerSide);
    toast(`${adet}x ${u.name} egitildi (offline mod).`);
  }
}

async function loadArmyPool(){
  const token = getToken(); if(!token) return;
  try {
    // v1.2.0: /api/army/state — tek seferde tum ordu verisi
    const resp = await fetch(API_BASE + '/api/army/state', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!resp.ok) return;
    const data = await resp.json();

    // Unite havuzu (egitilmis ama orduya atanmamis uniteler)
    if(data.unit_pool) {
      // Once hepsini sifirla
      Object.values(UNITS).forEach(u => u.count = 0);
      data.unit_pool.forEach(u => {
        if(UNITS[u.unite_id]) UNITS[u.unite_id].count = parseInt(u.adet) || 0;
      });
    }

    // Ordular listesi
    if(data.armies) {
      ORDULAR = data.armies.map(a => ({
        id: a.id,
        isim: a.isim,
        asker: a.raw_soldiers || 0,
        durum: a.durum,
        is_busy: a.is_busy,
        units: a.units || [],
        total_units: a.total_units || 0,
        atk: a.atk || 0,
        def: a.def || 0,
        dizilim: { saflar: [a.formation?.saf_1 || a.formation?.on_saf || [], a.formation?.saf_2 || [], a.formation?.saf_3 || [], a.formation?.saf_4 || a.formation?.arka_saf || []] }
      }));
    }

    // Gelistirmeler
    if(data.gelistirmeler) {
      ASKERI_GEL_SEV = data.gelistirmeler.askeri_gel_sev || 0;
      MAAS_GEL_SEV = data.gelistirmeler.maas_gel_sev || 0;
    }

    // Unite gelistirmeleri
    if(data.unite_gel) {
      UNIT_GEL = {};
      Object.entries(data.unite_gel).forEach(([uid, g]) => {
        UNIT_GEL[uid] = { atk: g.atk_sev || 0, def: g.def_sev || 0 };
      });
    }

    // Moral
    if(data.ordu_morali !== undefined) {
      const moralEl = document.getElementById('hud-moral');
      if(moralEl) moralEl.textContent = data.ordu_morali;
    }

    // Asker sayisi (workers.asker)
    if(data.workers) {
      ASKER_SAYISI = parseInt(data.workers.asker) || 0;
      population.asker = ASKER_SAYISI;
    }

    updateArmyStats();
    const playerSide = loadPlayer()?.taraf === 'kotu' ? 'dark' : 'light';
    renderUnitGrid(playerSide);
  } catch(e) {
    console.error('[loadArmyPool]', e);
  }
}

async function loadTrainingQueue(){
  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/game/army/queue', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(!resp.ok) return;
    const data = await resp.json();
    renderTrainingQueue(data.queue || []);
  } catch(e) {}
}

function renderTrainingQueue(queue){
  const wrap = document.getElementById('training-queue-wrap');
  const list = document.getElementById('training-queue-list');
  if(!wrap||!list) return;
  if(!queue.length){ wrap.style.display='none'; return; }
  wrap.style.display='block';

  // v1.13.41.1: Ayni uniteId icin siralari birlestir (adet topla, en uzak queue_end'i al)
  const merged = {};
  for (const q of queue) {
    const k = q.uniteId;
    if (!merged[k]) {
      merged[k] = { ...q, adetToplam: 0, parca: 0, maxSure: 0, minKalan: Infinity };
    }
    merged[k].adetToplam += parseInt(q.adet) || 0;
    merged[k].parca += 1;
    merged[k].maxSure = Math.max(merged[k].maxSure, parseFloat(q.surGun) || 0);
    merged[k].minKalan = Math.min(merged[k].minKalan, parseFloat(q.gunKalan) || 0);
    // Son bitis zamani (goruntulenen kalan sure) - en uzun bekleyen
    if (!merged[k].sonKalan || parseFloat(q.gunKalan) > parseFloat(merged[k].sonKalan)) {
      merged[k].sonKalan = parseFloat(q.gunKalan) || 0;
    }
  }

  list.innerHTML = Object.values(merged).map(q => {
    const kalan = parseFloat(q.sonKalan) || 0;        // Tum partilerin en uzak bitisi
    const toplam = parseFloat(q.maxSure) || 0;        // Bir parti suresi (referans)
    const yuzde = toplam > 0 ? Math.max(0, Math.min(100, Math.round((1 - (q.minKalan / toplam)) * 100))) : 0;
    const unitName = UNITS[q.uniteId]?.name || q.uniteId;
    const icon = UNITS[q.uniteId]?.icon || '\u2694\ufe0f';
    const parcaInfo = q.parca > 1 ? ` <span style="color:#f39c12;font-size:10px">(${q.parca} parti birlesti)</span>` : '';
    return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #333">
      <span style="font-size:18px">${icon}</span>
      <span style="min-width:140px;color:#d4af37;font-weight:bold">${unitName}${parcaInfo}</span>
      <span style="color:#aaa">\u00d7${q.adetToplam.toLocaleString()}</span>
      <span style="margin-left:auto;color:#88aaff">\u23f1 ${kalan.toFixed(1)} / ${toplam.toFixed(0)} P.G. <span style="color:#666">(%${yuzde})</span></span>
    </div>`;
  }).join('');
}

function updateArmyStats(){
  const all = Object.values(UNITS);
  const totalAtk = all.reduce((s,u)=>s+realAtk(u.id)*u.count*u.saldiriCarpan,0);
  const totalDef = all.reduce((s,u)=>s+realDef(u.id)*u.count,0);
  const totalUnits = all.reduce((s,u)=>s+u.count,0);
  const totalMaas = all.reduce((s,u)=>s+realMaas(u.maas)*u.count,0);
  setText('as-atk', Math.round(totalAtk).toLocaleString());
  setText('as-def', Math.round(totalDef).toLocaleString());
  setText('as-units', totalUnits.toLocaleString());
  setText('as-maas', totalMaas.toLocaleString());
  // Ordu morali
  if (window._palantisOrduMorali !== undefined) {
    setText('as-moral', window._palantisOrduMorali);
  }
  // v1.13.41.1: Ekstra kaynak kart — aydinlik=at, karanlik=kurt (taraf bazli tek gosterim)
  if (typeof EXTRA_RES !== 'undefined') {
    var _tr = (typeof loadPlayer === 'function') ? (loadPlayer()?.taraf) : null;
    // Binek
    var binekAdet = _tr === 'kotu' ? (EXTRA_RES.kurt || 0) : (EXTRA_RES.at || 0);
    var binekIkon = _tr === 'kotu' ? '🐺' : '🐎';
    var binekAd   = _tr === 'kotu' ? 'Kurt' : 'At';
    setText('ax-binek', Math.floor(binekAdet).toLocaleString());
    setText('ax-binek-ikon', binekIkon);
    setText('ax-binek-ad', binekAd);

    setText('ax-yumurta',(EXTRA_RES.buyulu_yumurta || 0).toLocaleString());
    setText('ax-gizli',  Math.floor(EXTRA_RES.gizlilik || 0).toLocaleString());
    setText('ax-mana',   Math.floor(EXTRA_RES.mana || 0).toLocaleString());

    // Mana renk ikonu + adi
    var _kisi = null;
    try { _kisi = localStorage.getItem('noxara_kisisel_bilge'); } catch {}
    var _renk = (_kisi && ['beyaz','kirmizi','mavi','yesil'].includes(_kisi)) ? _kisi
              : (_tr === 'kotu' ? 'kirmizi' : 'beyaz');
    var RENK_AD = { beyaz:'Beyaz', kirmizi:'Kırmızı', mavi:'Mavi', yesil:'Yeşil' };
    var RENK_RENK = { beyaz:'#f0e8d8', kirmizi:'#e74c3c', mavi:'#3498db', yesil:'#2ecc71' };
    var el = document.getElementById('ax-mana-renk');
    if (el) { el.textContent = RENK_AD[_renk]; el.style.color = RENK_RENK[_renk]; }
    var ax = document.getElementById('ax-mana');
    if (ax) ax.style.color = RENK_RENK[_renk];
  }
}

/* -- SAF DİZİLİMİ (4 saf: 3-3-5-3) -- */
// SAF_LIMITS constants.js'de tanimli

function loadFormationForArmy() {
  const sel = document.getElementById('formation-army-select');
  FORMATION_ARMY_ID = sel.value ? parseInt(sel.value) : null;
  FORMATION_STATE = [[], [], [], []];
  // Mevcut dizilimi yükle (backend'den gelen veri)
  if (FORMATION_ARMY_ID) {
    const army = ORDULAR.find(o => o.id === FORMATION_ARMY_ID);
    if (army && army.dizilim && army.dizilim.saflar) {
      for (let i = 0; i < 4; i++) {
        FORMATION_STATE[i] = (army.dizilim.saflar[i] || []).slice();
      }
    }
  }
  renderFormationGrid();
}

function renderFormationGrid() {
  const army = ORDULAR.find(o => o.id === FORMATION_ARMY_ID);

  // Ordudaki unite adetleri (dizilim goruntuleme icin)
  var unitAdetMap = {};
  if (army) (army.units||[]).forEach(function(u){ unitAdetMap[u.unite_id] = u.adet; });

  for (let i = 0; i < 4; i++) {
    const container = document.getElementById('saf-' + (i+1));
    if (!container) continue;
    const row = container.closest('.saf-row');
    container.innerHTML = '';

    const prevFull = i === 0 || FORMATION_STATE[i-1].length >= SAF_LIMITS[i-1];
    if (row) {
      row.classList.toggle('locked', !prevFull);
    }

    for (let j = 0; j < SAF_LIMITS[i]; j++) {
      const slot = document.createElement('div');
      slot.className = 'saf-slot' + (FORMATION_STATE[i][j] ? ' filled' : '');
      if (FORMATION_STATE[i][j]) {
        const unitId = FORMATION_STATE[i][j];
        const unitData = typeof UNITS !== 'undefined' ? UNITS[unitId] : null;
        const adet = unitAdetMap[unitId] || 0;
        slot.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;cursor:pointer">' +
          '<div style="line-height:1">' + unitIcon(unitData, 40) + '</div>' +
          '<div style="font-size:11px;color:#d4af37;font-weight:bold;margin-top:2px">(' + adet.toLocaleString('tr-TR') + ')</div>' +
          '<div style="font-size:11px;color:#aaa;margin-top:1px">' + (unitData ? unitData.name : unitId) + '</div>' +
        '</div>';
        (function(si, sj){ slot.onclick = function(){ removeFromSaf(si, sj); }; })(i, j);
      } else {
        slot.textContent = '+';
        if (prevFull || i === 0) {
          (function(si, sj){ slot.onclick = function(){ showUnitPicker(si, sj); }; })(i, j);
        }
      }
      container.appendChild(slot);
    }
  }

  // Dizilim ozet bilgisi
  renderFormationSummary(army, unitAdetMap);
  renderFormationPool();
}

function renderFormationSummary(army, unitAdetMap) {
  var summaryEl = document.getElementById('formation-summary');
  if (!summaryEl) {
    // Olustur
    var parent = document.getElementById('formation-units-pool');
    if (!parent) return;
    summaryEl = document.createElement('div');
    summaryEl.id = 'formation-summary';
    parent.parentNode.insertBefore(summaryEl, parent);
  }
  if (!army) { summaryEl.innerHTML = ''; return; }

  var toplamUnite = 0, toplamAtk = 0, toplamDef = 0;
  FORMATION_STATE.forEach(function(row){
    row.forEach(function(uid){
      if (!uid) return;
      var adet = unitAdetMap[uid] || 0;
      var u = UNITS[uid];
      if (u && adet > 0) {
        toplamUnite += adet;
        toplamAtk += u.baseAtk * adet * (u.saldiriCarpan||1);
        toplamDef += u.baseDef * adet;
      }
    });
  });

  summaryEl.innerHTML = '<div style="display:flex;justify-content:center;gap:16px;padding:8px;margin-bottom:8px;background:rgba(212,175,55,.06);border-radius:6px;font-size:11px">' +
    '<span>⚔️ <span style="font-size:13px;font-weight:bold;color:#d4af37">' + toplamUnite.toLocaleString('tr-TR') + '</span> unite</span>' +
    '<span>ATK: <span style="color:#e74c3c;font-weight:bold">' + toplamAtk.toLocaleString('tr-TR') + '</span></span>' +
    '<span>DEF: <span style="color:#3498db;font-weight:bold">' + toplamDef.toLocaleString('tr-TR') + '</span></span>' +
  '</div>';
}

function showUnitPicker(safIndex, slotIndex) {
  PICKING_SAF = safIndex;
  PICKING_SLOT = slotIndex;
  renderFormationPool();
}

function renderFormationPool() {
  const pool = document.getElementById('formation-units-pool');
  if (!pool) return;
  pool.innerHTML = '';

  const army = ORDULAR.find(o => o.id === FORMATION_ARMY_ID);
  if (!army) {
    pool.innerHTML = '<p style="color:#666">Once bir ordu secin.</p>';
    return;
  }

  const placed = {};
  FORMATION_STATE.forEach(function(row){ row.forEach(function(uid){
    if (uid) placed[uid] = (placed[uid] || 0) + 1;
  }); });

  const unitTypes = Object.keys(typeof UNITS !== 'undefined' ? UNITS : {});
  const side = OYUNCU.taraf === 'iyi' ? 'light' : 'dark';

  // Ordudaki üniteleri göster (sadece orduda olanlar)
  const armyObj = ORDULAR.find(o => o.id === FORMATION_ARMY_ID);
  const armyUnits = armyObj ? (armyObj.units || []) : [];

  armyUnits.filter(au => au.adet > 0).forEach(function(au){
    const uid = au.unite_id;
    if (!UNITS[uid] || UNITS[uid].side !== side) return;
    // Bu tip zaten saflarda mi?
    let zatenYerlesti = false;
    FORMATION_STATE.forEach(row => row.forEach(u => { if (u === uid) zatenYerlesti = true; }));
    const chip = document.createElement('div');
    chip.className = 'formation-unit-chip';
    chip.style.opacity = zatenYerlesti ? '0.3' : '1';
    chip.innerHTML = unitIcon(UNITS[uid], 20) + ' ' + UNITS[uid].name + (zatenYerlesti ? ' ✓' : '');
    if (!zatenYerlesti) {
      (function(u){ chip.onclick = function(){ placeUnitInSaf(u); }; })(uid);
    }
    pool.appendChild(chip);
  });
}

function placeUnitInSaf(unitId) {
  // Her ünite tipi 1 kere yerleştirilebilir
  let zatenVar = false;
  FORMATION_STATE.forEach(row => row.forEach(uid => { if (uid === unitId) zatenVar = true; }));

  if (zatenVar) {
    toast(`${UNITS[unitId]?.name || unitId} zaten saflarda! Her tip 1 kere yerleşir.`);
    return;
  }

  if (PICKING_SAF === null) {
    for (let i = 0; i < 4; i++) {
      if (i > 0 && FORMATION_STATE[i-1].length < SAF_LIMITS[i-1]) break;
      if (FORMATION_STATE[i].length < SAF_LIMITS[i]) {
        FORMATION_STATE[i].push(unitId);
        renderFormationGrid();
        return;
      }
    }
    return;
  }
  // Onceki saf dolu mu kontrol et
  if (PICKING_SAF > 0 && FORMATION_STATE[PICKING_SAF-1].length < SAF_LIMITS[PICKING_SAF-1]) {
    toast(`Onceki saf (${PICKING_SAF}. saf) dolu degil! Once onu doldur.`);
    PICKING_SAF = null; PICKING_SLOT = null;
    return;
  }
  FORMATION_STATE[PICKING_SAF][PICKING_SLOT] = unitId;
  PICKING_SAF = null;
  PICKING_SLOT = null;
  renderFormationGrid();
}

function removeFromSaf(safIndex, slotIndex) {
  FORMATION_STATE[safIndex].splice(slotIndex, 1);
  renderFormationGrid();
}

async function saveFormation() {
  if (!FORMATION_ARMY_ID) {
    document.getElementById('formation-msg').textContent = 'Önce bir ordu seç!';
    return;
  }
  const total = FORMATION_STATE.reduce(function(s, r){ return s + r.length; }, 0);
  if (total === 0) {
    document.getElementById('formation-msg').textContent = 'En az 1 ünite yerleştir!';
    return;
  }
  const token = getToken(); if(!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/army/armies/' + FORMATION_ARMY_ID + '/formation', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saf_1: FORMATION_STATE[0].slice(),
        saf_2: FORMATION_STATE[1].slice(),
        saf_3: FORMATION_STATE[2].slice(),
        saf_4: FORMATION_STATE[3].slice()
      })
    });
    const data = await resp.json();
    if(!resp.ok){ document.getElementById('formation-msg').textContent = data.error || 'Hata!'; return; }
    // Lokal state güncelle
    const army = ORDULAR.find(o => o.id === FORMATION_ARMY_ID);
    if (army) {
      army.dizilim = { saflar: [FORMATION_STATE[0].slice(), FORMATION_STATE[1].slice(), FORMATION_STATE[2].slice(), FORMATION_STATE[3].slice()] };
    }
    document.getElementById('formation-msg').textContent = 'Dizilim kaydedildi! (' + total + ' ünite)';
    toast('Saf dizilimi DB\'ye kaydedildi!');
  } catch(e) {
    document.getElementById('formation-msg').textContent = 'Bağlantı hatası!';
  }
}

function resetFormation() {
  FORMATION_STATE = [[], [], [], []];
  renderFormationGrid();
  document.getElementById('formation-msg').textContent = 'Dizilim sifirlandi.';
}

document.addEventListener('DOMContentLoaded', () => {
  // loadGameData tamamlaninca ordu verisini yukle
  function initArmy() {
    const side = OYUNCU && OYUNCU.taraf === 'kotu' ? 'dark' : 'light';
    renderUnitGrid(side, 'ugrid-player');
    updateArmyStats();
    armyTab('units', null);
  }
  // loadGameData bitene kadar bekle (polling)
  let attempts = 0;
  const check = setInterval(() => {
    attempts++;
    if (OYUNCU?.kral || attempts > 20) {
      clearInterval(check);
      initArmy();
    }
  }, 500);
});

// ═══════════════════════════════════
//   v1.9.3: ORDU GONDER FONKSİYONLARI
//   Koordinat girişli birleşik UX
// ═══════════════════════════════════

let _ogAramaSonuc = {}; // { armyId: { oyuncu, koloni, ... } }

function toggleOrduGonderPanel(armyId, konumTipi) {
  // Tüm diğer panelleri kapat
  document.querySelectorAll('[id^="ordu-gonder-panel-"]').forEach(function(el) {
    if (el.id !== 'ordu-gonder-panel-' + armyId) el.style.display = 'none';
  });
  var el = document.getElementById('ordu-gonder-panel-' + armyId);
  if (!el) return;
  var visible = el.style.display !== 'none';
  el.style.display = visible ? 'none' : 'block';
  if (!visible) {
    _ogAramaSonuc[armyId] = null;
    var sonucEl = document.getElementById('og-sonuc-' + armyId);
    if (sonucEl) sonucEl.innerHTML = '<span style="color:#555">Koordinat girip "Ara" ya basin</span>';
    // Store konum tipi for later use
    el.dataset.konumTipi = konumTipi || 'sehir';
  }
}

async function orduGonderAra(armyId) {
  var xEl = document.getElementById('og-x-' + armyId);
  var yEl = document.getElementById('og-y-' + armyId);
  var sonucEl = document.getElementById('og-sonuc-' + armyId);
  if (!xEl || !yEl || !sonucEl) return;

  var x = parseInt(xEl.value);
  var y = parseInt(yEl.value);
  if (!x || !y || x < 1 || x > 200 || y < 1 || y > 50) {
    sonucEl.innerHTML = '<span style="color:#e74c3c">Gecersiz koordinat! X: 1-200, Y: 1-50</span>';
    return;
  }

  // Kendi koordinatına gönderemez
  if (typeof OYUNCU !== 'undefined' && OYUNCU && x === OYUNCU.koord_x && y === OYUNCU.koord_y) {
    sonucEl.innerHTML = '<span style="color:#e74c3c">Kendi sehrinize ordu gonderemezsiniz!</span>';
    return;
  }

  sonucEl.innerHTML = '<span style="color:#888">Araniyor...</span>';
  var token = getToken(); if (!token) return;

  try {
    var res = await fetch(API_BASE + '/api/map/ara?koord=' + x + ':' + y, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await res.json();
    if (!res.ok) { sonucEl.innerHTML = '<span style="color:#e74c3c">' + (data.error || 'Hata') + '</span>'; return; }

    _ogAramaSonuc[armyId] = data;
    var panelEl = document.getElementById('ordu-gonder-panel-' + armyId);
    var konumTipi = panelEl ? panelEl.dataset.konumTipi : 'sehir';
    var isRelay = konumTipi === 'korumada';

    var html = '';

    if (data.oyuncu) {
      var oy = data.oyuncu;
      if (oy.ayni_guild) {
        // Guild üyesi → takviye gönder
        html += '<div style="background:#9b59b622;border:1px solid #9b59b644;border-radius:6px;padding:8px 12px;margin-top:6px">' +
          '<div style="color:#9b59b6;font-size:12px">🛡️ <b>' + oy.kral + '</b> — Guild Uyeniz</div>' +
          '<div style="color:#888;font-size:10px;margin:4px 0">' + oy.str + ' | ' + (oy.taraf||'') + ' | Cag ' + (oy.cag||1) + (data.mesafe ? ' | Mesafe: ' + data.mesafe : '') + '</div>' +
          (isRelay ?
            '<span style="color:#e74c3c;font-size:10px">Korumadaki ordu ile guild uyesine takviye gonderilemez. Once geri cagirin.</span>'
          :
            '<button class="btn" style="font-size:11px;padding:5px 14px;background:#9b59b6;margin-top:4px" onclick="orduGonderTakviye(' + armyId + ',' + oy.id + ')">🛡️ Takviye Gonder</button>'
          ) +
        '</div>';
      } else {
        // Düşman → saldırı gönder
        html += '<div style="background:#e74c3c22;border:1px solid #e74c3c44;border-radius:6px;padding:8px 12px;margin-top:6px">' +
          '<div style="color:#e74c3c;font-size:12px">⚔️ <b>' + oy.kral + '</b> — Dusman</div>' +
          '<div style="color:#888;font-size:10px;margin:4px 0">' + oy.str + ' | ' + (oy.taraf||'') + ' | Cag ' + (oy.cag||1) + (data.mesafe ? ' | Mesafe: ' + data.mesafe : '') + '</div>' +
          (isRelay ?
            '<button class="btn" style="font-size:11px;padding:5px 14px;background:#e74c3c;margin-top:4px" onclick="orduGonderRelaySaldiri(' + armyId + ',' + oy.id + ')">⚔️ Saldiri Gonder</button>'
          :
            '<button class="btn" style="font-size:11px;padding:5px 14px;background:#e74c3c;margin-top:4px" onclick="orduGonderSaldiri(' + armyId + ',' + oy.id + ')">⚔️ Saldiri Gonder</button>'
          ) +
        '</div>';
      }
    }

    if (data.koloni) {
      var kol = data.koloni;
      if (kol.benim) {
        // Kendi kolonisi → üs kur
        html += '<div style="background:#e67e2222;border:1px solid #e67e2244;border-radius:6px;padding:8px 12px;margin-top:6px">' +
          '<div style="color:#e67e22;font-size:12px">🏰 <b>' + (kol.isim||'Koloni') + '</b> — Sizin Koloniniz</div>' +
          (isRelay ?
            '<span style="color:#e74c3c;font-size:10px">Korumadaki ordu ile us kurulamaz. Once geri cagirin.</span>'
          :
            '<button class="btn" style="font-size:11px;padding:5px 14px;background:#e67e22;margin-top:4px" onclick="orduGonderKoloni(' + armyId + ',' + kol.id + ')">🏰 Us Kur</button>'
          ) +
        '</div>';
      } else {
        // Başkasının kolonisi → baskın
        html += '<div style="background:#e74c3c22;border:1px solid #e74c3c44;border-radius:6px;padding:8px 12px;margin-top:6px">' +
          '<div style="color:#e74c3c;font-size:12px">⚔️ <b>' + (kol.isim||'Koloni') + '</b> — ' + (kol.sahip_kral||'Bilinmeyen') + ' Kolonisi</div>' +
          '<div style="color:#888;font-size:10px;margin:2px 0">Koloni baskini: Savas yapilir, fetih icin 2 esek + 100 koylu gerekir.</div>' +
          (isRelay ?
            '<button class="btn" style="font-size:11px;padding:5px 14px;background:#e74c3c;margin-top:4px" onclick="orduGonderRelaySaldiri(' + armyId + ',' + kol.sahip_player_id + ')">⚔️ Baskin Gonder</button>'
          :
            '<button class="btn" style="font-size:11px;padding:5px 14px;background:#e74c3c;margin-top:4px" onclick="orduGonderSaldiri(' + armyId + ',' + kol.sahip_player_id + ')">⚔️ Baskin Gonder</button>'
          ) +
        '</div>';
      }
    }

    if (!data.oyuncu && !data.koloni) {
      html = '<div style="color:#555;font-size:11px;padding:4px">Bu koordinat bos. Kimse yok.</div>';
    }

    sonucEl.innerHTML = html;
  } catch(e) {
    console.error('Ordu gonder arama hata:', e);
    sonucEl.innerHTML = '<span style="color:#e74c3c">Baglanti hatasi</span>';
  }
}

// Takviye gönder (guild üyesine)
async function orduGonderTakviye(armyId, hedefPlayerId) {
  if (!confirm('Bu orduyu guild uyenize takviye olarak gondermek istiyor musunuz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var res = await fetch(API_BASE + '/api/takviye/gonder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orduId: armyId, hedefPlayerId: hedefPlayerId })
    });
    var data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    showToast(data.mesaj || 'Takviye yola cikti!', 'success');
    if (typeof loadGameData === 'function') await loadGameData();
    renderOrduListe();
  } catch(e) { showToast('Baglanti hatasi', 'error'); }
}

// Saldırı gönder (şehirden)
async function orduGonderSaldiri(armyId, hedefPlayerId) {
  if (!confirm('Bu orduyu saldiriya gondermek istiyor musunuz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var res = await fetch(API_BASE + '/api/savas/saldir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orduId: armyId, hedefPlayerId: hedefPlayerId })
    });
    var data = await res.json();
    if (!res.ok) {
      if (data.guild_takviye) {
        showToast('Ayni guildesiniz! Takviye gonderin.', 'error');
      } else {
        showToast(data.error || 'Hata', 'error');
      }
      return;
    }
    showToast(data.mesaj || 'Ordu saldiriya yola cikti!', 'success');
    if (typeof loadGameData === 'function') await loadGameData();
    renderOrduListe();
  } catch(e) { showToast('Baglanti hatasi', 'error'); }
}

// Relay saldırı (korumadaki ordu ile)
async function orduGonderRelaySaldiri(armyId, hedefPlayerId) {
  if (!confirm('Bu orduyu konuslandigi yerden saldiriya gondermek istiyor musunuz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var res = await fetch(API_BASE + '/api/takviye/rolu-saldir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orduId: armyId, hedefPlayerId: hedefPlayerId })
    });
    var data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    showToast(data.mesaj || 'Relay saldiri basladi!', 'success');
    if (typeof loadGameData === 'function') await loadGameData();
    renderOrduListe();
  } catch(e) { showToast('Baglanti hatasi', 'error'); }
}

// Koloni üs kur
async function orduGonderKoloni(armyId, koloniId) {
  if (!confirm('Bu orduyu koloni ussune gondermek istiyor musunuz?')) return;
  var token = getToken(); if (!token) return;
  try {
    var res = await fetch(API_BASE + '/api/takviye/koloni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orduId: armyId, koloniId: koloniId })
    });
    var data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    showToast(data.mesaj || 'Ordu koloniye yola cikti!', 'success');
    if (typeof loadGameData === 'function') await loadGameData();
    renderOrduListe();
  } catch(e) { showToast('Baglanti hatasi', 'error'); }
}

// Geri çağır (korumadaki ordu)
async function orduGeriCagir(armyId) {
  if (!confirm('Bu orduyu geri cagirmak istediginize emin misiniz? Ordu sehrinize donecektir.')) return;
  var token = getToken(); if (!token) return;
  try {
    var res = await fetch(API_BASE + '/api/takviye/geri-cagir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orduId: armyId })
    });
    var data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    showToast(data.mesaj || 'Ordu geri cagriliyor!', 'success');
    if (typeof loadGameData === 'function') await loadGameData();
    renderOrduListe();
  } catch(e) { showToast('Baglanti hatasi', 'error'); }
}

/* ═══════════════════════════════════════════════════════════
   v1.14.0.90: INLINE SAF DIZILIMI (ordu karti icinde)
═══════════════════════════════════════════════════════════ */

function toggleFormationPanel(armyId) {
  var panel = document.getElementById('formation-panel-' + armyId);
  if (!panel) return;
  var isOpen = panel.style.display === 'block';
  document.querySelectorAll('[id^="formation-panel-"]').forEach(function(el){ el.style.display = 'none'; });
  if (isOpen) return;
  panel.style.display = 'block';

  FORMATION_ARMY_ID = armyId;
  FORMATION_STATE = [[], [], [], []];
  var army = ORDULAR.find(function(o){ return o.id === armyId; });
  if (army && army.dizilim && army.dizilim.saflar) {
    for (var i = 0; i < 4; i++) FORMATION_STATE[i] = (army.dizilim.saflar[i] || []).slice();
  }
  if (army && !army.is_busy && (!army.konum_tipi || army.konum_tipi === 'sehir')) {
    renderInlineFormation(armyId);
  }
}

function renderInlineFormation(armyId) {
  var host = document.getElementById('formation-body-' + armyId);
  if (!host) return;
  var army = ORDULAR.find(function(o){ return o.id === armyId; });
  if (!army) { host.innerHTML = '<div style="color:#888">Ordu bulunamadi</div>'; return; }

  var unitAdetMap = {};
  (army.units || []).forEach(function(u){ unitAdetMap[u.unite_id] = u.adet; });

  var html = '<div style="display:flex;flex-direction:column;gap:10px">';
  for (var i = 0; i < 4; i++) {
    var prevFull = i === 0 || FORMATION_STATE[i-1].length >= SAF_LIMITS[i-1];
    html += '<div class="saf-row' + (!prevFull ? ' locked' : '') + '">' +
      '<div class="saf-label" style="font-size:11px;color:' + (prevFull ? '#d4a257' : '#555') + ';margin-bottom:4px">' + (i+1) + '. SAF (' + SAF_LIMITS[i] + ' birim)</div>' +
      '<div class="saf-slots" style="display:flex;gap:8px;flex-wrap:wrap">';
    for (var j = 0; j < SAF_LIMITS[i]; j++) {
      var uid = FORMATION_STATE[i][j];
      if (uid) {
        var udata = UNITS[uid];
        var adet = unitAdetMap[uid] || 0;
        html += '<div class="saf-slot filled" style="width:90px;height:110px;border:2px solid #d4a257;border-radius:6px;background:#1a1510;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer" onclick="inlineFormRemove(' + armyId + ',' + i + ',' + j + ')" title="Kaldirmak icin tikla">' +
          '<div style="line-height:1">' + unitIcon(udata, 36) + '</div>' +
          '<div style="font-size:10px;color:#d4af37;font-weight:bold;margin-top:2px">(' + adet.toLocaleString('tr-TR') + ')</div>' +
          '<div style="font-size:9px;color:#aaa;margin-top:1px;text-align:center;padding:0 2px">' + (udata ? udata.name : uid) + '</div>' +
        '</div>';
      } else {
        html += '<div class="saf-slot" style="width:90px;height:110px;border:2px dashed ' + (prevFull ? '#555' : '#2a2a2a') + ';border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;color:' + (prevFull ? '#888' : '#333') + ';' + (prevFull ? 'cursor:pointer' : '') + '"' + (prevFull ? ' onclick="inlineFormPick(' + armyId + ',' + i + ',' + j + ')"' : '') + '>+</div>';
      }
    }
    html += '</div></div>';
  }
  html += '</div>';

  var placed = {};
  FORMATION_STATE.forEach(function(r){ r.forEach(function(u){ placed[u] = true; }); });
  var available = (army.units || []).filter(function(u){ return u.adet > 0 && !placed[u.unite_id]; });
  if (available.length) {
    html += '<div style="margin-top:14px"><div style="font-size:11px;color:#d4a257;font-weight:bold;margin-bottom:6px">Kullanilabilir Uniteler (tikla ekle):</div><div style="display:flex;gap:6px;flex-wrap:wrap">';
    available.forEach(function(u){
      var udata = UNITS[u.unite_id];
      if (!udata) return;
      html += '<div onclick="inlineFormAddAuto(' + armyId + ',\'' + u.unite_id + '\')" style="padding:6px 10px;background:#1a1a1a;border:1px solid #333;border-radius:4px;cursor:pointer;font-size:11px;color:#ccc;display:flex;align-items:center;gap:4px">' +
        unitIcon(udata, 20) + ' ' + udata.name + ' <b style="color:#d4af37">(' + u.adet.toLocaleString('tr-TR') + ')</b>' +
      '</div>';
    });
    html += '</div></div>';
  }

  html += '<div style="margin-top:14px;display:flex;gap:8px">' +
    '<button class="btn" onclick="inlineFormSave(' + armyId + ')" style="flex:1">💾 Dizilimi Kaydet</button>' +
    '<button class="btn ghost" onclick="inlineFormReset(' + armyId + ')">🔄 Sifirla</button>' +
  '</div>';
  html += '<div id="inline-form-msg-' + armyId + '" style="margin-top:8px;font-size:11px;color:#888;min-height:16px"></div>';

  host.innerHTML = html;
}

function inlineFormAddAuto(armyId, unitId) {
  var zaten = false;
  FORMATION_STATE.forEach(function(r){ if (r.indexOf(unitId) !== -1) zaten = true; });
  if (zaten) { if (typeof toast === 'function') toast('Bu unite zaten saflarda'); return; }
  for (var i = 0; i < 4; i++) {
    if (i > 0 && FORMATION_STATE[i-1].length < SAF_LIMITS[i-1]) break;
    if (FORMATION_STATE[i].length < SAF_LIMITS[i]) {
      FORMATION_STATE[i].push(unitId);
      renderInlineFormation(armyId);
      return;
    }
  }
  if (typeof toast === 'function') toast('Saf dolu');
}

function inlineFormRemove(armyId, saf, slot) {
  FORMATION_STATE[saf].splice(slot, 1);
  renderInlineFormation(armyId);
}

function inlineFormPick(armyId, saf, slot) {
  var army = ORDULAR.find(function(o){ return o.id === armyId; });
  if (!army) return;
  var placed = {};
  FORMATION_STATE.forEach(function(r){ r.forEach(function(u){ placed[u] = true; }); });
  var firstFree = (army.units || []).find(function(u){ return u.adet > 0 && !placed[u.unite_id]; });
  if (!firstFree) { if (typeof toast === 'function') toast('Musait unite yok'); return; }
  FORMATION_STATE[saf].splice(slot, 0, firstFree.unite_id);
  if (FORMATION_STATE[saf].length > SAF_LIMITS[saf]) FORMATION_STATE[saf].pop();
  renderInlineFormation(armyId);
}

async function inlineFormSave(armyId) {
  var msg = document.getElementById('inline-form-msg-' + armyId);
  if (msg) { msg.textContent = 'Kaydediliyor...'; msg.style.color = '#888'; }
  try {
    var token = getToken();
    var r = await fetch(API_BASE + '/api/army/armies/' + armyId + '/formation', {
      method: 'PUT',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
      body: JSON.stringify({
        saf_1: FORMATION_STATE[0],
        saf_2: FORMATION_STATE[1],
        saf_3: FORMATION_STATE[2],
        saf_4: FORMATION_STATE[3]
      })
    });
    var d = await r.json();
    if (!r.ok) {
      if (msg) { msg.textContent = 'X ' + (d.error || 'Hata'); msg.style.color = '#e74c3c'; }
      return;
    }
    if (msg) { msg.textContent = 'Dizilim kaydedildi'; msg.style.color = '#2ecc71'; }
    setTimeout(function(){ if (typeof loadOrdular === 'function') loadOrdular(); }, 700);
  } catch(e) {
    if (msg) { msg.textContent = 'Sunucu hatasi: ' + e.message; msg.style.color = '#e74c3c'; }
  }
}

function inlineFormReset(armyId) {
  FORMATION_STATE = [[], [], [], []];
  renderInlineFormation(armyId);
}

if (typeof window !== 'undefined') {
  window.toggleFormationPanel = toggleFormationPanel;
  window.renderInlineFormation = renderInlineFormation;
  window.inlineFormAddAuto = inlineFormAddAuto;
  window.inlineFormRemove = inlineFormRemove;
  window.inlineFormPick = inlineFormPick;
  window.inlineFormSave = inlineFormSave;
  window.inlineFormReset = inlineFormReset;
}
