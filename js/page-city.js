/* ══════════════════════════════════
   SEHRIM — Bina Grid, Kuyruk, Insa
   Extracted from index.html
══════════════════════════════════ */

function renderGrid(){
  const grid=document.getElementById('bg-grid');
  if(!grid)return;
  const inQ=new Set(QUEUE.map(q=>q.id));
  const list=Object.values(BLDGS).filter(b=>activeCat==='all'||b.cat===activeCat);
  grid.innerHTML='';
  const oyuncuCag = OYUNCU?.cag || 1;

  // Çağ bazlı gruplama (sadece 'all' filtresinde)
  if (activeCat === 'all') {
    const cagGruplari = {1:[], 2:[], 3:[], 4:[], 5:[]};
    list.forEach(b => {
      let acilisCag = 1;
      if (b.cagLimit) {
        for (let c = 1; c <= 5; c++) {
          if ((b.cagLimit[c] || 0) !== 0) { acilisCag = c; break; }
        }
      }
      cagGruplari[acilisCag].push(b);
    });
    const CAG_ROMA = {1:'I',2:'II',3:'III',4:'IV',5:'V'};
    const CAG_IKON = {1:'🏛️',2:'⚔️',3:'🏰',4:'🐉',5:'👑'};
    for (let c = 1; c <= 5; c++) {
      if (cagGruplari[c].length === 0) continue;
      const kilitli = c > oyuncuCag;
      const baslik = document.createElement('div');
      baslik.className = 'cag-baslik';
      baslik.style.cssText = 'padding:12px 16px;margin:16px 0 8px;border-left:3px solid ' +
        (kilitli ? '#333' : '#d4af37') + ';color:' + (kilitli ? '#555' : '#c8a96e') +
        ';font-family:Cinzel,serif;font-size:15px;background:' + (kilitli ? '#0a0a0a' : '#111100') + ';border-radius:0 6px 6px 0;';
      baslik.innerHTML = CAG_IKON[c] + ' ' + CAG_ROMA[c] + '. Çağ Binaları' +
        (kilitli ? ' <span style="color:#e74c3c;font-size:11px">🔒 Kilitli</span>' : ' <span style="color:#2ecc71;font-size:11px">✓ Açık</span>') +
        ' <span style="color:#444;font-size:11px">(' + cagGruplari[c].length + ' bina)</span>';
      grid.appendChild(baslik);
      cagGruplari[c].forEach(b => renderBinaRow(grid, b, inQ, oyuncuCag));
    }
    updateBars();
    updateCityStats();
    return;
  }

  list.forEach(b => renderBinaRow(grid, b, inQ, oyuncuCag));
  updateBars();
  updateCityStats();
}

function renderBinaRow(grid, b, inQ, oyuncuCag) {
    const inC=inQ.has(b.id);
    const isMergeOnly=!!b.mergeOnly;
    const cost=isMergeOnly?{}:b.cost(1);

    const cagLimiti = b.cagLimit ? (b.cagLimit[oyuncuCag] ?? 0) : 999;
    const cagKilitli = cagLimiti === 0;
    const cagSinirsiz = cagLimiti === -1;
    const limitDoldu = !cagSinirsiz && !cagKilitli && b.lv >= cagLimiti;

    const afford=!isMergeOnly&&!cagKilitli&&!limitDoldu&&canAfford(cost);
    const fx=b.fx(b.lv>0?b.lv:1).map(e=>`<span class="etag ${e.t==='pos'?'pos':'neg'}">${e.s}</span>`).join('');
    const costH=Object.entries(cost).map(([r,a])=>{
      const have=RES[r]||0;
      return `<span class="citem ${have>=a?'ok':'no'}">${RICONS[r]||'\ud83d\udce6'} ${a.toLocaleString()} <small style="color:#555">(${have.toLocaleString()})</small></span>`;
    }).join('');
    const sureSaniye = isMergeOnly ? 0 : (typeof b.time === 'function' ? b.time(1) : b.time || 3600);
    const surePG = sureSaniye / 3600;
    const limitLabel = cagSinirsiz ? '' : (cagLimiti > 0 ? `<span style="color:#888;font-size:9px"> (${b.lv}/${cagLimiti})</span>` : '');
    let action;
    if(cagKilitli) {
      let acilisCag = 6;
      if(b.cagLimit) for(let c=1;c<=5;c++) if((b.cagLimit[c]||0)!==0){acilisCag=c;break;}
      action=`<span style="color:#e74c3c;font-size:10px;font-family:'Cinzel',serif">\ud83d\udd12 ${acilisCag}. Çağ gerekli</span>`;
    }
    else if(limitDoldu) action=`<span style="color:#f59e0b;font-size:10px;font-family:'Cinzel',serif">\u26a0\ufe0f Limit doldu (${cagLimiti})</span>`;
    else if(inC) action=`<span style="color:#2ecc71;font-size:11px;font-family:'Cinzel',serif">\ud83d\udd28 Insada</span>`;
    else if(isMergeOnly) action=`<span style="color:#888;font-size:10px">\ud83d\udd17 Birlestirme ile olusur</span>`;
    else action=`<button class="btn-sm" ${afford?'':'disabled'} onclick="openModal('${b.id}')">\ud83c\udfd7\ufe0f INSA</button>`;
    const mergeKural=BINA_BIRLESTIRME_FE[b.id];
    let mergeBtn='';
    if(mergeKural){
      const srcAdet=BLDGS[mergeKural.source]?.lv||0;
      const canMerge=srcAdet>=mergeKural.miktar;
      mergeBtn=`<button class="btn-sm" ${canMerge?'':'disabled'} onclick="mergeBina('${b.id}')" style="margin-top:4px;font-size:10px">\ud83d\udd17 BIRLESTIR (${srcAdet}/${mergeKural.miktar} ${mergeKural.source})</button>`;
    }

    const d=document.createElement('div');
    d.className=`brow${inC?' building':''}${b.lv===0&&!inC?' locked':''}`;
    d.innerHTML=`
      <div class="br-ico" style="background:${b.bg}">${b.icon}</div>
      <div class="br-main">
        <div class="br-name">${b.name} ${b.lv>0?`<span style="color:#2ecc71;font-size:10px">${b.lv} adet</span>`:''}${limitLabel}</div>
        <div class="br-desc">${b.desc}</div>
      </div>
      <div class="br-lv">${b.lv} adet</div>
      ${b.lv > 0 && b._dayaniklilik !== undefined && b._dayaniklilik < 100 ?
        `<div style="display:flex;align-items:center;gap:4px;margin:2px 0">
          <div style="flex:1;height:6px;background:#1a1a1a;border-radius:3px;overflow:hidden">
            <div style="width:${b._dayaniklilik}%;height:100%;background:${b._dayaniklilik > 60 ? '#2ecc71' : b._dayaniklilik > 30 ? '#f39c12' : '#e74c3c'};border-radius:3px"></div>
          </div>
          <span style="font-size:8px;color:${b._dayaniklilik > 60 ? '#2ecc71' : b._dayaniklilik > 30 ? '#f39c12' : '#e74c3c'}">${b._dayaniklilik}%</span>
          <button style="font-size:8px;padding:1px 6px;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);color:#2ecc71;border-radius:3px;cursor:pointer" onclick="tamirBina('${b.id}')">🔧 Tamir</button>
        </div>` : ''}
      <div class="br-fx">${fx}</div>
      ${!isMergeOnly&&!inC?`<div class="br-cost">${costH}</div>`:'<div class="br-cost"></div>'}
      ${!isMergeOnly&&!inC?`<div class="br-time">\u23f1 ${surePG.toFixed(1)} P.G.</div>`:'<div class="br-time"></div>'}
      <div class="br-act">${action}${mergeBtn}</div>
      ${inC?`<div class="br-building-lbl">\ud83d\udd28 Insa ediliyor... <span id="bpct-${b.id}">\u2014</span></div><div class="br-prog"><div class="br-prog-fill" id="bfill-${b.id}" style="width:0%"></div></div>`:''}
    `;
    grid.appendChild(d);
}

function renderQueue(){
  const wrap=document.getElementById('queue-wrap');
  const list=document.getElementById('queue-list');
  if(!wrap||!list)return;
  if(QUEUE.length===0){wrap.style.display='none';return;}
  wrap.style.display='block';
  list.innerHTML='';
  QUEUE.forEach(q=>{
    const b=BLDGS[q.id];if(!b)return;
    const el=Date.now()-q.start;
    const pct=Math.min(100,el/q.dur*100);
    const rem=Math.max(0,Math.ceil((q.dur-el)/1000));
    const kalanLabel=(q.kalanInsa&&q.kalanInsa>0)?`<span style="color:#c8a96e;font-size:10px"> +${q.kalanInsa} daha bekliyor</span>`:'';
    const d=document.createElement('div');d.className='q-item';
    d.innerHTML=`<div class="q-icon">${b.icon}</div><div class="q-info"><div class="q-name">${b.name} insa ediliyor${kalanLabel}</div><div class="q-bar"><div class="q-fill" id="qf-${b.id}" style="width:${pct}%"></div></div></div><div class="q-time" id="qt-${b.id}">${fmtT(rem)}</div>`;
    list.appendChild(d);
  });
}

function setFilter(cat,el){
  activeCat=cat;
  document.querySelectorAll('#submenu-city .sub-item').forEach(b=>b.classList.remove('on'));
  if(el && el.classList) el.classList.add('on');
  document.querySelectorAll('#submenu-city .sub-item').forEach(b=>{
    if(b.dataset.filter===cat) b.classList.add('on');
  });
  renderGrid();
}

function toggleSubMenu(id, el){
  const allMenus = ['submenu-city', 'submenu-army'];
  allMenus.forEach(menuId => {
    if(menuId !== id) {
      const m = document.getElementById(menuId);
      if(m) m.style.display = 'none';
    }
  });
  const sm = document.getElementById(id);
  if(!sm) return;
  sm.style.display = sm.style.display === 'none' ? 'block' : 'none';
}

function openModal(id){
  const b=BLDGS[id];if(!b)return;
  modalId=id;
  const nLv=b.lv+1;
  const cost=b.cost(1);
  const afford=canAfford(cost);
  document.getElementById('mtitle').innerText=`${b.icon} ${b.name}`;
  document.getElementById('msub').innerText=b.desc;
  const curFx=b.lv>0?b.fx(1).map(e=>`<div class="lv">${e.s}</div>`).join(''):'<div class="lv" style="color:#333">Henuz insa edilmedi</div>';
  const nxtFx=b.fx(1).map(e=>`<div class="lv">${e.s}</div>`).join('');
  document.getElementById('mlvc').innerHTML=`<div class="lvc-col"><div class="lt">Mevcut Adet: ${b.lv}</div>${curFx}</div><div class="lvc-arr">\u279c</div><div class="lvc-col next"><div class="lt">Yeni Adet: ${nLv}</div>${nxtFx}</div>`;
  document.getElementById('mcost').innerHTML=Object.entries(cost).map(([r,a])=>`<span class="citem ${(RES[r]||0)>=a?'ok':'no'}">${RICONS[r]||'\ud83d\udce6'} ${a.toLocaleString()} <span style="color:#333;font-size:9px">(${(RES[r]||0).toLocaleString()} var)</span></span>`).join('');
  document.getElementById('mtime').innerText=`\u23f1 ${fmtT(b.time(1))} / adet`;
  const btn=document.getElementById('mbtn');
  btn.disabled=!afford;
  btn.innerText=`\ud83c\udfd7\ufe0f ${b.name} Insa Et`;
  const adetInput=document.getElementById('build-adet');
  if(adetInput){adetInput.value=1;}
  document.getElementById('build-total-cost').innerHTML='';
  document.getElementById('building-modal').classList.add('open');
}

function updateBuildTotal(){
  if(!modalId)return;
  const b=BLDGS[modalId];if(!b)return;
  const adet=Math.max(1,Math.min(999,parseInt(document.getElementById('build-adet')?.value)||1));
  const cost1=b.cost(1);
  if(adet<=1){document.getElementById('build-total-cost').innerHTML='';
    const btn=document.getElementById('mbtn');if(btn)btn.disabled=!canAfford(cost1);return;}
  const totalCost={};
  Object.entries(cost1).forEach(([r,a])=>{totalCost[r]=a*adet;});
  const afford=canAfford(totalCost);
  const html=Object.entries(totalCost).map(([r,a])=>`<span class="citem ${(RES[r]||0)>=a?'ok':'no'}">${RICONS[r]||'\ud83d\udce6'} ${a.toLocaleString()}</span>`).join('');
  document.getElementById('build-total-cost').innerHTML=`<span style="color:#888">${adet} adet toplam:</span> ${html}`;
  const btn=document.getElementById('mbtn');if(btn)btn.disabled=!afford;
}

function closeModal(){document.getElementById('building-modal').classList.remove('open');modalId=null;}
function closeModalOut(e){if(e.target===document.getElementById('building-modal'))closeModal();}

async function confirmBuild(){
  if(!modalId)return;
  const b=BLDGS[modalId];if(!b)return;
  const adet=Math.max(1,Math.min(999,parseInt(document.getElementById('build-adet')?.value)||1));
  const nLv=b.lv+adet;
  const cost1=b.cost(1);
  const totalCost={};
  Object.entries(cost1).forEach(([r,a])=>{totalCost[r]=a*adet;});
  if(!canAfford(totalCost)){toast('Yetersiz kaynak!');return;}

  const token = getToken();
  if(!token){toast('Oturum bulunamadi!');return;}

  let backendSuccess = false;
  try {
    const resResp = await fetch(API_BASE + '/api/game/resources/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ cost: totalCost })
    });
    if (resResp.ok) {
      const resData = await resResp.json();
      if (resData.resources) {
        Object.entries(resData.resources).forEach(([k,v]) => { if(RES[k] !== undefined) RES[k] = parseInt(v)||0; });
      }
      backendSuccess = true;
    } else {
      const err = await resResp.json();
      toast(err.error || 'Yetersiz kaynak!');
      return;
    }

    await fetch(API_BASE + '/api/game/buildings/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ binaId: b.id, adet })
    });
  } catch(e) {
    if(!backendSuccess) spendCost(totalCost);
  }

  setText('hud-w', RES.odun); setText('hud-m', RES.metal);
  setText('hud-g', RES.altin); setText('hud-bu', RES.bugday); setText('hud-ba', RES.balik);

  QUEUE.push({id:b.id,targetLv:b.lv+1,start:Date.now(),dur:b.time(1)*1000,kalanInsa:adet-1});

  const usedArea = Object.values(BLDGS).reduce((s,bl)=>s+bl.lv*binaAlanFE(bl.id),0) + binaAlanFE(b.id);
  setText('hud-used', usedArea);

  closeModal();renderGrid();renderQueue();
  const adetMsg = adet > 1 ? ` (${adet} adet siralandi)` : '';
  toast(`${b.name} insaati basladi!${adetMsg}`);
}

// Tamir fonksiyonu
async function tamirBina(binaId) {
  const b = BLDGS[binaId];
  if (!b || b._dayaniklilik >= 100) { alert('Bu bina tamir gerektirmiyor.'); return; }

  const secim = confirm('Hızlı tamir (anında, pahalı) için OK\nNormal tamir (kuyrukta, ucuz) için İptal');
  const endpoint = secim ? '/api/game/buildings/repair' : '/api/game/buildings/repair-queue';

  try {
    const token = getToken();
    const resp = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ binaId })
    });
    const data = await resp.json();
    if (resp.ok) {
      toast(secim ? `Hizli tamir! ${data.maliyet} altin harcandi.` : `Tamir kuyruga alindi (${data.tamir_suresi_pg} PG)`);
      if (typeof loadGameData === 'function') await loadGameData();
      renderGrid();
    } else {
      alert(data.error || 'Tamir hatasi');
    }
  } catch(e) { alert('Sunucu hatasi'); }
}

document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  renderQueue();
});
