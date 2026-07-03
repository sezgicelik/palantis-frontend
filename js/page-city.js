/* ══════════════════════════════════
   SEHRIM — Bina Grid, Kuyruk, Insa
   Extracted from index.html
══════════════════════════════════ */

// v1.14.0.60: İnşaat modu banner — kilit/slot/usta durumu göster
function renderInsaatBanner() {
  const el = document.getElementById('insaat-mod-banner');
  if (!el) return;
  const info = window._insaatInfo;
  if (!info || info.mod === 'klasik') { el.style.display = 'none'; return; }
  el.style.display = 'block';
  let icerik = '';
  if (info.mod === 'kilit') {
    icerik = `<div style="padding:10px 14px;background:rgba(52,152,219,0.08);border:1px solid rgba(52,152,219,0.3);border-left:3px solid #3498db;border-radius:4px;font-size:12px;color:#6db3e0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span>🔒 <b>Kilit Modu</b> — İnşaat başladığında köylüler meşgul olur.</span>
      <span style="color:#aaa">Meşgul: <b style="color:#e67e22">${info.insaat_kilitli}</b> · Boş: <b style="color:#2ecc71">${info.bos_koylu_reel}</b></span>
    </div>`;
  } else if (info.mod === 'slot') {
    const aktif = info.slot_dolu || 0;
    const max = info.slot_sayisi || 2;
    icerik = `<div style="padding:10px 14px;background:rgba(155,89,182,0.08);border:1px solid rgba(155,89,182,0.3);border-left:3px solid #9b59b6;border-radius:4px;font-size:12px;color:#b894c9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span>⚙️ <b>Slot Modu</b> — Aynı anda birden fazla bina paralel yapılabilir.</span>
      <span style="color:#aaa">Slot: <b style="color:#d4a257">${aktif}/${max}</b> dolu ${aktif >= max ? '<span style="color:#e74c3c">(DOLU — yeni inşaat kuyruğa alınamaz)</span>' : ''}</span>
    </div>`;
  } else if (info.mod === 'hizlandirma') {
    icerik = `<div style="padding:10px 14px;background:rgba(230,126,34,0.08);border:1px solid rgba(230,126,34,0.3);border-left:3px solid #e67e22;border-radius:4px;font-size:12px;color:#e8a56b;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span>⚡ <b>Hızlandırma Modu</b> — Kuyrukta olan binaya ek köylü atayarak süreyi azaltabilirsin (%${info.hizlandirma_oran_yuzde}/köylü, max ${info.hizlandirma_max_koylu}).</span>
      <span style="color:#aaa">Meşgul: <b style="color:#e67e22">${info.insaat_kilitli}</b> · Boş: <b style="color:#2ecc71">${info.bos_koylu_reel}</b></span>
    </div>`;
  } else if (info.mod === 'usta_basi') {
    icerik = `<div style="padding:10px 14px;background:rgba(22,160,133,0.08);border:1px solid rgba(22,160,133,0.3);border-left:3px solid #16a085;border-radius:4px;font-size:12px;color:#48c9b0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span>🧔 <b>Usta Başı Modu</b> — Her inşaat 1 usta başı rezerve eder. Akademi ile yetiştir.</span>
      <span style="color:#aaa">Usta Başı: <b style="color:#d4a257">${info.usta_basi}/${info.usta_basi_max}</b> ${info.usta_basi === 0 ? '<span style="color:#e74c3c">(TÜKENDİ)</span>' : ''}</span>
    </div>`;
  }
  el.innerHTML = icerik;
}

function renderGrid(){
  const grid=document.getElementById('bg-grid');
  if(!grid)return;
  renderInsaatBanner();
  const inQ=new Set(QUEUE.map(q=>q.id));
  // v1.14.1.41: Gelisim alt sekmesi (gpsAlan) destegi
  const _gpsSub = (typeof window !== 'undefined' && window.activeGpsAlan) || 'all';
  const list=Object.values(BLDGS).filter(b => {
    if (activeCat !== 'all' && b.cat !== activeCat) return false;
    if (activeCat === 'gelisim' && _gpsSub !== 'all' && b.gpsAlan !== _gpsSub) return false;
    return true;
  });
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
    const limitLabel = cagSinirsiz ? '' : (cagLimiti > 0 ? `<span style="color:#888;font-size:11px"> (${b.lv}/${cagLimiti})</span>` : '');
    // v1.14.0.60: İnşaat modu — ek UI buton/badge
    const iInfo = window._insaatInfo || { mod: 'klasik' };
    const koyluMaliyet = iInfo.bina_koylu?.[b.id] || 0;
    const koyluBadge = (iInfo.mod !== 'klasik' && koyluMaliyet > 0)
      ? `<span style="font-size:9px;padding:1px 5px;background:rgba(52,152,219,0.15);color:#3498db;border:1px solid rgba(52,152,219,0.3);border-radius:3px;margin-left:3px" title="Bu bina ${koyluMaliyet} köylü meşgul eder">👷 ${koyluMaliyet}</span>`
      : '';
    const hizlandirBtn = (inC && iInfo.mod === 'hizlandirma')
      ? `<button class="btn-sm" style="margin-left:3px;padding:1px 6px;font-size:10px;background:rgba(230,126,34,0.15);border:1px solid rgba(230,126,34,0.4);color:#e67e22;border-radius:3px;cursor:pointer" onclick="hizlandirModal('${b.id}','${b.name.replace(/'/g,"\\'")}')">⚡ Hızlandır</button>`
      : '';

    let action;
    if(cagKilitli) {
      let acilisCag = 6;
      if(b.cagLimit) for(let c=1;c<=5;c++) if((b.cagLimit[c]||0)!==0){acilisCag=c;break;}
      action=`<span style="color:#e74c3c;font-size:10px;font-family:'Cinzel',serif">\ud83d\udd12 ${acilisCag}. Çağ gerekli</span>`;
    }
    else if(limitDoldu) action=`<span style="color:#f59e0b;font-size:10px;font-family:'Cinzel',serif">\u26a0\ufe0f Limit doldu (${cagLimiti})</span>`;
    // v1.13.42.2: Kuyrukta olsa bile INSA butonu aktif (kalan_insa artirabilmek icin)
    else if(isMergeOnly) action=`<span style="color:#888;font-size:10px">\ud83d\udd17 Birlestirme ile olusur</span>`;
    else if(inC) action=`<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap"><span style="color:#2ecc71;font-size:10px;font-family:'Cinzel',serif">\ud83d\udd28 Insada</span>${b._kilitKoylu > 0 ? `<span style="font-size:9px;padding:1px 5px;background:rgba(243,156,18,0.15);color:#e67e22;border-radius:3px">👷 ${b._kilitKoylu} meşgul</span>` : ''}<button class="btn-sm" ${afford?'':'disabled'} onclick="openModal('${b.id}')">+ INSA</button>${hizlandirBtn}</div>`;
    else action=`<button class="btn-sm" ${afford?'':'disabled'} onclick="openModal('${b.id}')">\ud83c\udfd7\ufe0f INSA</button>${koyluBadge}`;
    const mergeKural=BINA_BIRLESTIRME_FE[b.id];
    let mergeBtn='';
    if(mergeKural){
      const srcAdet=BLDGS[mergeKural.source]?.lv||0;
      const canMerge=srcAdet>=mergeKural.miktar;
      mergeBtn=`<button class="btn-sm" ${canMerge?'':'disabled'} onclick="mergeBina('${b.id}')" style="margin-top:4px;font-size:10px">\ud83d\udd17 BIRLESTIR (${srcAdet}/${mergeKural.miktar} ${mergeKural.source})</button>`;
    }

    const d=document.createElement('div');
    // v1.14.3.1: Flu (locked) mantigi tersine cevrildi (Sezgi):
    //   ESKI: lv===0 olan tum binalar flu (yeni baslayanlar tum binalari donuk goruyor)
    //   YENI: sadece cag-kilitli VEYA limit-dolu olan binalar flu.
    //         Yapilabilir ama henuz yapilmamis bina parlak gozukur (insa edebilirsin).
    const isFlu = cagKilitli || limitDoldu;
    d.className=`brow${inC?' building':''}${isFlu?' locked':''}`;
    // v1.14.0.54: data-codex-id — hover'da Codex tooltip
    d.innerHTML=`
      <div class="br-ico" style="background:${b.bg}" data-codex-id="${b.id}">${b.icon}</div>
      <div class="br-main">
        <div class="br-name" data-codex-id="${b.id}">${b.name} ${b.lv>0?`<span style="color:#2ecc71;font-size:10px">${b.lv} adet</span>`:''}${limitLabel}${(b._kalanInsa || 0) > 0 ? ` <span style="font-size:11px;padding:1px 7px;background:rgba(243,156,18,0.18);color:#f39c12;border:1px solid rgba(243,156,18,0.4);border-radius:10px;font-weight:600;margin-left:4px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px" title="Bu bina için sıralanmış ekstra emir sayısı — saatte 1 başlar">🏗️ +${b._kalanInsa} sırada<button onclick="iptalKuyruk('${b.id}','${b.name.replace(/'/g,"\\'")}',${b._kalanInsa});event.stopPropagation()" style="background:rgba(231,76,60,0.2);border:1px solid rgba(231,76,60,0.5);color:#e74c3c;border-radius:50%;width:16px;height:16px;font-size:10px;cursor:pointer;padding:0;line-height:1;display:flex;align-items:center;justify-content:center" title="Kuyruğu iptal et (mevcut inşaat devam eder)">✕</button></span>` : ''}</div>
        <div class="br-desc">${b.desc}</div>
      </div>
      <div class="br-lv">${b.lv} adet</div>
      ${b.lv > 0 && b._dayaniklilik !== undefined ? (() => {
        var d = b._dayaniklilik;
        var renk = d > 60 ? '#2ecc71' : d > 30 ? '#f39c12' : '#e74c3c';
        var lbl = d >= 100 ? '✓ Sağlam' : (d >= 60 ? 'İyi' : d >= 30 ? 'Hasarlı' : 'Kritik');
        var tamirHtml = '';
        if (d < 100) {
          tamirHtml = b._repairQueue
            ? `<span style="font-size:11px;padding:1px 6px;color:#f39c12;border:1px solid rgba(243,156,18,0.3);border-radius:3px;white-space:nowrap">🔧 Tamirde${b._repairGunKalan > 0 ? ' (' + fmtKalanSure(b._repairGunKalan * 3600) + ')' : ''}</span>`
            : `<button style="font-size:11px;padding:1px 6px;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);color:#2ecc71;border-radius:3px;cursor:pointer;white-space:nowrap" onclick="tamirBina('${b.id}')">🔧 Tamir</button>`;
        }
        return `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;font-size:11px">
          <span style="color:#888;font-size:10px;min-width:64px">🛡️ Dayanıklılık</span>
          <div style="flex:1;height:6px;background:#1a1a1a;border-radius:3px;overflow:hidden">
            <div style="width:${d}%;height:100%;background:${renk};border-radius:3px"></div>
          </div>
          <span style="color:${renk};min-width:74px;text-align:right;font-weight:600">${d}% ${lbl}</span>
          ${tamirHtml}
        </div>`;
      })() : ''}
      <div class="br-fx">${fx}</div>
      ${!isMergeOnly&&!inC?`<div class="br-cost">${costH}</div>`:'<div class="br-cost"></div>'}
      ${!isMergeOnly&&!inC?`<div class="br-time">\u23f1 ${fmtKalanSure(surePG * 3600)}</div>`:'<div class="br-time"></div>'}
      <div class="br-act" style="display:flex;flex-direction:column;gap:4px;align-items:stretch;min-width:120px">${action}${mergeBtn}${b.lv>0 && !isMergeOnly ? `<button class="btn-sm" style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.4);color:#e74c3c" onclick="yikBina('${b.id}')" title="Bu binadan yık (alan geri döner, kaynak iadesi YOK)">\ud83d\udd28 YIK</button>` : ''}</div>
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
    // v1.14.1.59: Kuyruk bilgisi daha net — "+20 daha · ~20 saat sonra biter"
    let kalanLabel = '';
    let iptalBtn = '';
    if (q.kalanInsa && q.kalanInsa > 0) {
      // Tahmini bitiş süresi: kalan × bina insa süresi (saat)
      const sureSaat = Math.ceil((q.dur / 1000 / 3600) * q.kalanInsa);
      const tahminEt = sureSaat < 24 ? `~${sureSaat}h` : `~${Math.ceil(sureSaat/24)}g`;
      kalanLabel = `<span style="color:#c8a96e;font-size:10px;white-space:nowrap" title="Toplu inşa: saatte 1 yeni başlıyor"> +${q.kalanInsa} sırada · <b style="color:#f39c12">${tahminEt}</b> sonra biter</span>`;
      // v1.14.3.9: Ana kuyruk listesinde de X iptal butonu (Sezgi: "iptal gelmedi")
      iptalBtn = `<button onclick="iptalKuyruk('${b.id}','${b.name.replace(/'/g,"\\'")}',${q.kalanInsa});event.stopPropagation()" style="background:rgba(231,76,60,0.2);border:1px solid rgba(231,76,60,0.5);color:#e74c3c;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;padding:0;line-height:1;margin-left:8px;flex-shrink:0;font-weight:700" title="Sırayı iptal et — %80 iade · %20 ceza">✕</button>`;
    }
    const d=document.createElement('div');d.className='q-item';
    d.innerHTML=`<div class="q-icon">${b.icon}</div><div class="q-info"><div class="q-name" style="display:flex;align-items:center;flex-wrap:wrap">${b.name} insa ediliyor${kalanLabel}${iptalBtn}</div><div class="q-bar"><div class="q-fill" id="qf-${b.id}" style="width:${pct}%"></div></div></div><div class="q-time" id="qt-${b.id}">${fmtT(rem)}</div>`;
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
  document.getElementById('mcost').innerHTML=Object.entries(cost).map(([r,a])=>`<span class="citem ${(RES[r]||0)>=a?'ok':'no'}">${RICONS[r]||'\ud83d\udce6'} ${a.toLocaleString()} <span style="color:#333;font-size:11px">(${(RES[r]||0).toLocaleString()} var)</span></span>`).join('');
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
  const adet=Math.max(1,Math.min(999,parseInt(document.getElementById('build-adet')?.value||'1')||1));
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
  const adet=Math.max(1,Math.min(999,parseInt(document.getElementById('build-adet')?.value||'1')||1));
  const nLv=b.lv+adet;
  const cost1=b.cost(1);
  const totalCost={};
  Object.entries(cost1).forEach(([r,a])=>{totalCost[r]=a*adet;});
  if(!canAfford(totalCost)){toast('Yetersiz kaynak!');return;}

  // v1.14.3.2: Cag limiti pre-check (Sezgi: 'kalan_insa hesaba katilmiyor')
  // Limit = max çağ-bazlı, kullanılan = seviye + insada(1) + kalan_insa
  if (b.cagLimit && typeof b.cagLimit === 'object') {
    const playerCag = OYUNCU?.cag || 1;
    const cagSinirsiz = b.cagLimit[playerCag] === -1;
    if (!cagSinirsiz) {
      const maxAdet = b.cagLimit[playerCag] ?? 999;
      // Mevcut + insada (queueEnd varsa) + kalan_insa
      const insada = (b._kalanInsa || 0) > 0 ? 1 : 0; // kalan_insa>0 ise insada da 1 var
      // Aslında kalan_insa zaten "şu an inşa edilen DAHIL DEĞİL, sıradakiler".
      // _kalanInsa=N ise: 1 şu an inşada + N sırada = N+1 toplam
      // Toplam = lv + (kalan_insa>0 ? kalan_insa+1 : 0) (1 inşada + N sırada)
      // Ama kart insada=true ise direkt göstermek için: lv + kalanInsa + (in_queue ? 1 : 0)
      // Basit yaklaşım: lv + max(_kalanInsa, 0) → backend zaten doğrusunu kontrol ediyor
      const mevcutToplam = b.lv + (b._kalanInsa || 0);
      if (mevcutToplam + adet > maxAdet) {
        const kullanilabilir = Math.max(0, maxAdet - mevcutToplam);
        const A = window.noxAlert || ((m) => { toast(m); });
        await A(
          `${b.name} bina limiti aşıldı.\n\n` +
          `${playerCag}. çağ max: ${maxAdet} adet\n` +
          `Mevcut + kuyrukta: ${mevcutToplam}\n` +
          `İstediğin: ${adet}\n\n` +
          `En fazla ${kullanilabilir} adet daha emir verebilirsin.`,
          '⚠️ Bina Limiti'
        );
        return;
      }
    }
  }

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

    // v1.14.3.2: Backend response kontrolu — hata varsa kullaniciya goster + kaynagi iade et
    const upResp = await fetch(API_BASE + '/api/game/buildings/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ binaId: b.id, adet })
    });
    if (!upResp.ok) {
      const upErr = await upResp.json().catch(() => ({}));
      const A = window.noxAlert || ((m) => { toast(m); });
      await A(upErr.error || 'İnşaat reddedildi (limit, alan veya başka sebep)', '⚠️ İnşa Hatası');
      // Kaynak iade — backend zaten resources/spend ile düşmüştü
      // En kolay yol: tekrar yükle (loadGameData kaynakları doğru gösterir)
      if (typeof loadGameData === 'function') await loadGameData();
      closeModal();
      return;
    }
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

  // tur/2026-07-03 (J5): son insaati hatirla -> "Tekrar Insa" cipi
  try { localStorage.setItem('noxara_son_insa', JSON.stringify({ id: b.id, adet: adet, ts: Date.now() })); } catch(e) {}
  renderSonInsaChip();
}

/* ═══════════════════════════════════════════════════════
   tur/2026-07-03 (J5): TEKRAR INSA cipi
   Son baslatilan insaati filtre barinin ustunde tek tikla tekrar acar.
   Direkt insa ETMEZ — modal acilir, adet on-dolu gelir (maliyet/limit
   kontrolleri mevcut confirmBuild akisinda kalir). Sadece kisayol.
═══════════════════════════════════════════════════════ */
function renderSonInsaChip() {
  const bar = document.getElementById('city-filter-bar');
  if (!bar) return;
  let son = null;
  try { son = JSON.parse(localStorage.getItem('noxara_son_insa') || 'null'); } catch(e) {}
  let chip = document.getElementById('son-insa-chip');
  if (!son || !son.id || !BLDGS[son.id]) { if (chip) chip.remove(); return; }
  const b = BLDGS[son.id];
  const adet = Math.max(1, parseInt(son.adet) || 1);
  const cost1 = b.cost(1);
  const totalCost = {};
  Object.entries(cost1).forEach(([r, a]) => { totalCost[r] = a * adet; });
  const afford = canAfford(totalCost);
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'son-insa-chip';
    chip.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px';
    bar.parentNode.insertBefore(chip, bar);
  }
  chip.innerHTML =
    '<button onclick="sonInsaTekrar()" ' +
      'style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;min-height:36px;background:' + (afford ? 'rgba(46,204,113,0.08)' : 'rgba(255,255,255,0.03)') + ';' +
      'border:1px solid ' + (afford ? 'rgba(46,204,113,0.4)' : '#333') + ';border-radius:6px;cursor:pointer;color:' + (afford ? '#2ecc71' : '#888') + ';font-size:12px" ' +
      'title="Son inşaatı tekrar başlat (modal açılır, onay senin)">' +
      '🔁 Tekrar İnşa: ' + b.icon + ' ' + b.name + (adet > 1 ? ' ×' + adet : '') +
      (afford ? '' : ' <span style="font-size:10px;color:#e74c3c">(kaynak yetersiz)</span>') +
    '</button>' +
    '<button onclick="sonInsaTemizle()" title="Cipi kaldır" style="background:none;border:none;color:#555;cursor:pointer;font-size:14px;padding:4px 8px">✕</button>';
}
function sonInsaTekrar() {
  let son = null;
  try { son = JSON.parse(localStorage.getItem('noxara_son_insa') || 'null'); } catch(e) {}
  if (!son || !son.id || !BLDGS[son.id]) return;
  openModal(son.id);
  const adetInput = document.getElementById('build-adet');
  if (adetInput) { adetInput.value = Math.max(1, parseInt(son.adet) || 1); }
  if (typeof updateBuildTotal === 'function') updateBuildTotal();
}
function sonInsaTemizle() {
  try { localStorage.removeItem('noxara_son_insa'); } catch(e) {}
  const chip = document.getElementById('son-insa-chip');
  if (chip) chip.remove();
}

// Tamir fonksiyonu — v1.14.3.0 site-içi modal
async function tamirBina(binaId) {
  const b = BLDGS[binaId];
  const A = window.noxAlert || ((m) => noxAlert(m));
  const C = window.noxChoice || ((m, s1, s2) => Promise.resolve(confirm(`${m}\n${s1} = OK, ${s2} = İptal`) ? 0 : 1));
  if (!b || b._dayaniklilik >= 100) { await A('Bu bina tamir gerektirmiyor.'); return; }

  const secim = await C(
    `${b.name} (%${b._dayaniklilik}) tamiri için yöntem seç:\n\n• Hızlı: anında bitir, 2x altın\n• Normal: kuyruğa al, 1x altın`,
    '⚡ Hızlı', '🔧 Normal',
    '🔧 Tamir Yöntemi'
  );
  if (secim === null) return; // iptal
  const hizli = secim === 0;
  const endpoint = hizli ? '/api/game/buildings/repair' : '/api/game/buildings/repair-queue';

  try {
    const token = getToken();
    const resp = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ binaId })
    });
    const data = await resp.json();
    if (resp.ok) {
      toast(hizli ? `⚡ Hızlı tamir! ${data.maliyet} altın harcandı.` : `🔧 Tamir kuyruğa alındı (${data.tamir_suresi_pg} PG)`);
      if (typeof loadGameData === 'function') await loadGameData();
      renderGrid();
    } else {
      await A(data.error || 'Tamir hatası');
    }
  } catch(e) { await A('Sunucu hatası: ' + e.message); }
}

// v1.14.3.8: Toplu insa kuyrugunu iptal et + %80 IADE + uyari
// Sezgi: "inşaat iptal edilince 80% i verelim ve uyarı gösterelim"
async function iptalKuyruk(binaId, binaIsim, kalan) {
  const A = window.noxAlert || ((m) => noxAlert(m));
  const C = window.noxConfirm || ((m) => Promise.resolve(confirm(m)));
  const ok = await C(
    `⚠️ ${binaIsim} — ${kalan} sıradaki emir iptal\n\n` +
    `• Mevcut inşaat (varsa) devam eder.\n` +
    `• Kaynaklar %80 oranında iade edilir.\n` +
    `• %20 vazgeçme cezası kesilir.\n\n` +
    `İptal et?`
  );
  if (!ok) return;
  try {
    const r = await fetch(API_BASE + '/api/game/buildings/iptal-kuyruk', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + getToken() },
      body: JSON.stringify({ bina_id: binaId })
    });
    const d = await r.json();
    if (r.ok && d.success) {
      const iadeStr = d.iade && Object.keys(d.iade).length > 0
        ? ' İade: ' + Object.entries(d.iade).map(([k,v]) => `${v.toLocaleString()} ${k}`).join(', ')
        : '';
      const cezaStr = d.ceza && Object.keys(d.ceza).length > 0
        ? ' (Ceza: ' + Object.entries(d.ceza).map(([k,v]) => `${v.toLocaleString()} ${k}`).join(', ') + ')'
        : '';
      const msg = `✓ ${d.iptal} emir iptal — %${Math.round((d.iade_orani||0.8)*100)} iade.${iadeStr}${cezaStr}`;
      if (window.NoxToast) NoxToast.coin(msg);
      else if (window.showToast) showToast(msg, 'success');
      await loadGameData();
      if (window.refreshKuyruk) window.refreshKuyruk();
    } else {
      await A(d.error || 'İptal başarısız');
    }
  } catch(e) {
    await A('Sunucu hatası: ' + e.message);
  }
}

// v1.14.3.0: Yıkma — site-içi modal (tarayıcı popup yerine)
async function yikBina(binaId) {
  const b = BLDGS[binaId];
  const A = window.noxAlert || ((m) => { noxAlert(m); });
  const P = window.noxPrompt || ((m, d) => Promise.resolve(prompt(m, d)));
  const CD = window.noxConfirmDanger || ((m) => Promise.resolve(confirm(m)));

  if (!b || b.lv <= 0) { await A('Bu bina yıkılamaz (zaten yok).'); return; }
  if (b.mergeOnly) { await A(`${b.name} yıkılamaz — birleştirme ile oluşur.`); return; }

  // Kaç adet input
  const adetStr = await P(
    `${b.name} kaç adet yıkılsın? (1-${b.lv})\n⚠ Kaynak iadesi YOK, sadece alan geri döner.`,
    '1',
    `🔨 ${b.name} Yıkımı`
  );
  if (!adetStr) return;
  const adet = parseInt(adetStr);
  if (!adet || adet < 1 || adet > b.lv) { await A('Geçersiz adet.'); return; }

  const alanGeri = adet * (typeof binaAlanFE === 'function' ? binaAlanFE(binaId) : 1);
  const onayli = await CD(
    `${adet} adet ${b.name} yıkılacak.\n\n• Alan geri dönüşü: ${alanGeri}\n• Kaynak iadesi: YOK\n\nDevam etmek istiyor musun?`,
    '⚠️ Yıkım Onayı',
    `🔨 Yık (${adet})`
  );
  if (!onayli) return;

  try {
    const token = getToken();
    const resp = await fetch(API_BASE + '/api/game/buildings/yik', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ binaId, adet })
    });
    const data = await resp.json();
    if (resp.ok) {
      toast(data.mesaj || `${adet} ${b.name} yıkıldı, ${alanGeri} alan geri döndü`);
      if (typeof loadGameData === 'function') await loadGameData();
      if (typeof loadBuildingsFromBackend === 'function') await loadBuildingsFromBackend();
      renderGrid();
    } else {
      await A(data.error || 'Yıkım hatası');
    }
  } catch(e) { await A('Sunucu hatası: ' + e.message); }
}

// v1.14.3.0: Toplu tamir — site-içi modal
async function topluTamir() {
  const A = window.noxAlert || ((m) => noxAlert(m));
  const P = window.noxPrompt || ((m, d) => Promise.resolve(prompt(m, d)));
  const C = window.noxChoice || ((m, s1, s2) => Promise.resolve(confirm(`${m}\n${s1} = OK, ${s2} = İptal`) ? 0 : 1));

  const esikStr = await P(
    'Dayanıklılık yüzdesi kaçın altındakiler tamir edilsin?\n(Örn: 30 → %30 altı olanlar)',
    '30',
    '🔧 Toplu Tamir'
  );
  if (!esikStr) return;
  const esik = parseInt(esikStr);
  if (!esik || esik < 1 || esik > 99) { await A('Geçersiz yüzde (1-99).'); return; }

  const secim = await C(
    'Tamir tipini seç:\n\n• Hızlı: anında bitir, 2x altın\n• Normal: kuyruğa al, 1x altın',
    '⚡ Hızlı', '🔧 Normal',
    'Tamir Tipi'
  );
  if (secim === null) return;
  const tip = secim === 0 ? 'hizli' : 'normal';

  try {
    const token = getToken();
    const resp = await fetch(API_BASE + '/api/game/buildings/tamir-toplu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ tip, min_esik: esik })
    });
    const data = await resp.json();
    if (resp.ok) {
      if (data.tamir_edilen === 0) {
        toast(`Dayanıklılık %${esik} altında bina yok.`);
      } else {
        toast(`${data.tamir_edilen} bina tamir edildi, toplam ${data.toplam_maliyet.toLocaleString('tr-TR')} altın harcandı (${tip})`);
      }
      if (typeof loadGameData === 'function') await loadGameData();
      if (typeof loadBuildingsFromBackend === 'function') await loadBuildingsFromBackend();
      renderGrid();
    } else {
      await A(data.error || 'Toplu tamir hatası');
    }
  } catch(e) { await A('Sunucu hatası: ' + e.message); }
}

// v1.14.3.0: Hızlandırma — site-içi modal
async function hizlandirModal(binaId, binaName) {
  const A = window.noxAlert || ((m) => noxAlert(m));
  const P = window.noxPrompt || ((m, d) => Promise.resolve(prompt(m, d)));
  const info = window._insaatInfo || {};
  const maxKoylu = Math.min(info.hizlandirma_max_koylu || 20, info.bos_koylu_reel || 0);
  if (maxKoylu <= 0) { await A('Boş köylün yok — hızlandırma için köylü gerekli.'); return; }
  const oran = info.hizlandirma_oran_yuzde || 5;
  const girdi = await P(
    `Her ek köylü: %${oran} süre azaltır\n` +
    `Maksimum: ${maxKoylu} köylü (%${Math.min(100, maxKoylu*oran)} hızlanma)\n` +
    `Boş köylün: ${info.bos_koylu_reel}\n\n` +
    `Kaç köylü atamak istersin? (1-${maxKoylu})`,
    String(Math.min(5, maxKoylu)),
    `⚡ ${binaName} İnşaat Hızlandır`
  );
  const ek = parseInt(girdi);
  if (!ek || ek < 1 || ek > maxKoylu) return;
  try {
    const resp = await fetch(API_BASE + '/api/game/buildings/hizlandir', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ bina_id: binaId, ek_koylu: ek })
    });
    const data = await resp.json();
    if (data.success) {
      toast(`⚡ ${ek} köylü atandı — süre %${data.azaltma_yuzde} azaldı`);
      if (typeof loadBuildingsFromBackend === 'function') await loadBuildingsFromBackend();
      if (typeof loadNufus === 'function') loadNufus();
      renderGrid();
      renderQueue();
    } else {
      await A(data.error || 'Hızlandırma hatası');
    }
  } catch(e) { await A('Sunucu hatası: ' + e.message); }
}

document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  renderQueue();
  // tur/2026-07-03 (J5): BLDGS backend'den dolunca "Tekrar Insa" cipini ciz
  let _sicAttempts = 0;
  const _sicCheck = setInterval(() => {
    _sicAttempts++;
    const hazir = Object.values(BLDGS || {}).some(b => (b.lv || 0) > 0) || _sicAttempts > 20;
    if (hazir) {
      clearInterval(_sicCheck);
      try { renderSonInsaChip(); } catch(e) {}
    }
  }, 500);
});
