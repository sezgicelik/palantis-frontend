/* ══════════════════════════════════
   ORDU SiSTEMi — Sekmeler, Gelistirme, Egitim, Dizilim
   Extracted from index.html
══════════════════════════════════ */

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
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">Cig Et: <b style="color:#c0392b">${RES.cig_et||0}</b></div>
      <div style="background:#111;padding:8px 14px;border-radius:6px;border:1px solid #333">Pismis Et: <b style="color:#e67e22">${RES.pismis_et||0}</b></div>
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
  setText('sm-miktar', SM_MIKTAR);
}

function smAdjust(d){
  const koylu = Math.max(0, population.free);
  SM_MIKTAR = Math.max(0, Math.min(SM_MIKTAR + d, koylu));
  setText('sm-miktar', SM_MIKTAR);
}

async function smConvert(){
  if(SM_MIKTAR <= 0){ document.getElementById('sm-msg').textContent = 'Donusturulecek koylu sayisini belirle.'; return; }
  const koylu = Math.max(0, population.free);
  if(SM_MIKTAR > koylu){ document.getElementById('sm-msg').textContent = 'Yeterli bos koylu yok!'; return; }

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
      ASKER_SAYISI = data.workers?.asker || (ASKER_SAYISI + SM_MIKTAR);
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
}

async function smRelease(){
  if(SM_MIKTAR <= 0){ document.getElementById('sm-msg').textContent = 'Koyluye cevrilecek asker sayisini belirle.'; return; }
  if(SM_MIKTAR > ASKER_SAYISI){ document.getElementById('sm-msg').textContent = 'Bu kadar asker yok!'; return; }

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
      ASKER_SAYISI = data.workers?.asker || (ASKER_SAYISI - SM_MIKTAR);
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
    el.innerHTML = '<div class="card" style="text-align:center;color:#555;padding:32px">Henüz ordu kurulmamış. Önce askere köylü çevir, sonra ordu kur.</div>';
    return;
  }
  const side = OYUNCU && OYUNCU.taraf === 'kotu' ? 'dark' : 'light';
  const playerUnits = Object.values(UNITS).filter(u => u.side === side && u.producible !== false);

  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' + ORDULAR.map(o => {
    // Ordudaki üniteleri dikey listele
    const unitsHTML = (o.units||[]).filter(u=>u.adet>0).map(u => {
      const def = UNITS[u.unite_id];
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1a1a1a">
        <span style="font-size:11px;color:#ccc">${def?.icon||'?'} ${def?.name||u.unite_id}</span>
        <span style="display:flex;align-items:center;gap:4px">
          <span style="font-size:11px;color:#d4af37;font-weight:bold">×${u.adet}</span>
          <button style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:12px;padding:0 2px" onclick="orduUniteCircar(${o.id},'${u.unite_id}',1)" title="1 çıkar">−</button>
        </span>
      </div>`;
    }).join('');

    // Havuzdan eklenebilir üniteler
    const poolUnits = playerUnits.filter(u => u.count > 0);
    const poolHTML = poolUnits.length > 0 ? `
      <div style="margin-top:6px;border-top:1px solid #222;padding-top:6px">
        <div style="color:#888;font-size:9px;margin-bottom:4px">Havuzdan ekle:</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${poolUnits.map(u => `
          <button class="btn ghost" style="font-size:9px;padding:2px 6px" onclick="orduUniteEkle(${o.id},'${u.id}',1)">
            ${u.icon} ${u.name} (${u.count})
          </button>
        `).join('')}
        </div>
      </div>` : '';

    return `
    <div class="card" style="padding:12px;border-left:3px solid #d4af37;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:8px">
        <div style="font-size:14px;font-weight:bold;color:#d4af37">${o.isim}</div>
        <div style="display:flex;gap:4px">
          <button class="btn ghost" style="font-size:10px;padding:3px 8px" onclick="armyTab('formation');document.getElementById('formation-army-select').value='${o.id}';loadFormationForArmy()">Dizilim</button>
          <button class="btn ghost" style="font-size:10px;padding:3px 8px;border-color:#c0392b;color:#c0392b" onclick="orduSil(${o.id})">Dagit</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;font-size:11px;color:#aaa;margin-bottom:6px;flex-wrap:wrap">
        <span style="color:#e74c3c">ATK: ${(o.atk||0).toLocaleString()}</span>
        <span style="color:#3498db">DEF: ${(o.def||0).toLocaleString()}</span>
        <span>👥 ${o.total_units||0}</span>
        <span style="color:#f1c40f;font-weight:bold">%${window._palantisReyting||0}</span>
      </div>
      <div style="flex:1">
        ${unitsHTML || '<div style="color:#555;font-size:11px">Unite yok</div>'}
      </div>
      ${poolHTML}
    </div>`;
  }).join('') + '</div>';
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

    div.innerHTML = `
      <div class="uico" style="background:${bgCol};width:34px;height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${u.icon}</div>
      <div style="min-width:140px;flex-shrink:0">
        <div style="font-family:'Cinzel',serif;font-size:12px;color:#eee;font-weight:600">
          ${u.name} ${u.saldiriCarpan>1?`<span style="color:#e74c3c;font-size:10px">\u00d7${u.saldiriCarpan}</span>`:''}
          <span class="utier ${tierCl}" style="position:static;display:inline;margin-left:4px;font-size:9px">${tierLbl}</span>
        </div>
        <div style="font-size:10px;color:#555">${u.role||''}</div>
      </div>
      <div style="width:130px;flex-shrink:0;display:flex;gap:8px;font-size:11px">
        <span style="color:#e74c3c">ATK:${uAtk}</span>
        <span style="color:#3498db">DEF:${uDef}</span>
        <span style="color:#f1c40f">${uMaas}/g</span>
      </div>
      <div class="ucost" style="flex:1;display:flex;flex-wrap:wrap;gap:4px">${askerHTML}${costHTML}${extraHTML}</div>
      <div style="width:68px;flex-shrink:0;text-align:center;font-size:10px;color:#555">\u23f1 ${trainDays} P.G.</div>
      <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
        <button class="ucount-btn" onclick="changeCount('${u.id}',-1)">\u2212</button>
        <input class="ucount-inp" id="cnt-${u.id}" value="${u.count}" type="number" min="0" style="width:44px;text-align:center" onchange="setCount('${u.id}',this.value)">
        <button class="ucount-btn" onclick="changeCount('${u.id}',1)">+</button>
      </div>
      <button class="utrain-btn" style="flex-shrink:0" ${afford?'':'disabled'} onclick="trainUnit('${u.id}')">EGIT</button>
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
  const askerGerekliToplam = ({ 1:1, 2:2, 3:3, 4:0 }[u.tier] || 0) * adet;
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
      setText('hud-w', RES.odun); setText('hud-m', RES.metal); setText('hud-t', RES.tas);
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
    setText('hud-w', RES.odun); setText('hud-m', RES.metal); setText('hud-t', RES.tas);
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
        dizilim: { saflar: [a.formation?.on_saf || [], a.formation?.arka_saf || [], [], []] }
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
  list.innerHTML = queue.map(q=>{
    const gun = parseFloat(q.gunKalan)||0;
    const unitName = UNITS[q.uniteId]?.name || q.uniteId;
    const icon = UNITS[q.uniteId]?.icon || '\u2694\ufe0f';
    return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #333">
      <span style="font-size:18px">${icon}</span>
      <span style="min-width:120px;color:#d4af37;font-weight:bold">${unitName}</span>
      <span style="color:#aaa">\u00d7${q.adet}</span>
      <span style="margin-left:auto;color:#88aaff">\u23f1 ${gun > 0 ? gun.toFixed(2)+' P.G.' : 'Tamamlandi'}</span>
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
  // Reyting (backend'den gelir)
  if (window._palantisReyting !== undefined) {
    setText('as-reyting', '%' + window._palantisReyting);
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
        slot.innerHTML = '<div class="slot-unit">' + (unitData ? unitData.icon || unitId : unitId) + '<br><small>' + unitId + '</small></div>';
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

  renderFormationPool();
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
    // Kaç tanesi zaten saflarda?
    let placed = 0;
    FORMATION_STATE.forEach(row => row.forEach(u => { if (u === uid) placed++; }));
    const kalan = au.adet - placed;
    const chip = document.createElement('div');
    chip.className = 'formation-unit-chip';
    chip.style.opacity = kalan > 0 ? '1' : '0.3';
    chip.textContent = (UNITS[uid].icon || '') + ' ' + UNITS[uid].name + ' (' + kalan + '/' + au.adet + ')';
    if (kalan > 0) {
      (function(u){ chip.onclick = function(){ placeUnitInSaf(u); }; })(uid);
    }
    pool.appendChild(chip);
  });
}

function placeUnitInSaf(unitId) {
  // Ordudaki bu üniteden kaç tane var?
  const army = ORDULAR.find(o => o.id === FORMATION_ARMY_ID);
  const armyUnit = army ? (army.units || []).find(u => u.unite_id === unitId) : null;
  const ordudaVar = armyUnit ? armyUnit.adet : 0;

  // Saflarda kaç tane zaten yerleştirilmiş?
  let yerlestirilen = 0;
  FORMATION_STATE.forEach(row => row.forEach(uid => { if (uid === unitId) yerlestirilen++; }));

  if (yerlestirilen >= ordudaVar) {
    toast(`${UNITS[unitId]?.name || unitId}: orduda ${ordudaVar} adet var, hepsi yerleştirilmiş!`);
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
        on_saf: [...FORMATION_STATE[0], ...FORMATION_STATE[1]],
        arka_saf: [...FORMATION_STATE[2], ...FORMATION_STATE[3]]
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
