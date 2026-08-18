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
  // v1.14.0.90: 'formation' tab kaldirildi — saf dizilimi ordu karti icinde inline
  if(tab==='upgrades') renderUpgrades();
}

/* -- GELISTIRME PANELI -- */
function renderUpgrades(){
  const panel = document.getElementById('atab-upgrades');
  if(!panel) return;
  const side = OYUNCU && OYUNCU.taraf === 'kotu' ? 'dark' : 'light';

  // v1.14.3.30: Kaynak ozeti UST kisimda (gelistirme yaparken hangi kaynakta ne kadar var?)
  // At/Kurt kaldirildi (gelistirme bunlari kullanmiyor — sadece GP/KP/Islenmis/Altin)
  const _f = (typeof fmt==='function') ? fmt : (n => Math.floor(Number(n)||0).toLocaleString('tr-TR'));
  const kaynakOzet = `
    <div style="background:linear-gradient(90deg,rgba(212,175,55,0.06),transparent);border:1px solid #2a2820;border-radius:8px;padding:10px 14px;margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span style="color:#888;font-size:11px;margin-right:4px">📊 Mevcut kaynaklar:</span>
      <span style="background:#0a0a0a;padding:6px 12px;border-radius:5px;border:1px solid #333;font-size:12px">💰 Altın: <b style="color:#f1c40f">${_f(RES.altin||0)}</b></span>
      <span style="background:#0a0a0a;padding:6px 12px;border-radius:5px;border:1px solid #333;font-size:12px">🔧 Gelişim Puanı: <b style="color:#3498db">${_f(RES.gelisim_puani||0)}</b></span>
      <span style="background:#0a0a0a;padding:6px 12px;border-radius:5px;border:1px solid #333;font-size:12px">🎭 Kültür Puanı: <b style="color:#e67e22">${_f(RES.kultur_puani||0)}</b></span>
      <span style="background:#0a0a0a;padding:6px 12px;border-radius:5px;border:1px solid #333;font-size:12px">⚙️ İşlenmiş: <b style="color:#95a5a6">${_f(RES.islenmis||0)}</b></span>
    </div>`;

  // v1.14.3.33: TUM YAZILAR ACIK RENK (#e8d4a8 / #f5f0e8) — eski #aaa #888 #fff koyu zemin uzerinde okunmuyordu
  let html = `
  <div style="padding:15px;color:#e0d6c0">
    ${kaynakOzet}
    <h3 style="color:#d4af37;margin:0 0 15px;font-family:Cinzel,serif;letter-spacing:1px">⚔️ Global Geliştirmeler</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      <div style="background:#1a1a0a;border:1px solid #3a3020;border-radius:8px;padding:14px;flex:1;min-width:220px">
        <div style="color:#f1c40f;font-weight:bold;font-size:14px">Askeri Geliştirme</div>
        <div style="color:#c8b896;font-size:12px;margin:6px 0">Ünite üretim altın maliyetini azaltır (%10/seviye)</div>
        <div style="color:#e8d4a8;margin:8px 0;font-size:13px">Seviye: <b style="color:#fff">${ASKERI_GEL_SEV}</b> <span style="color:#888">/ ${ASKERI_GEL_MAX}</span></div>
        <div style="color:#2ecc71;font-size:13px;font-weight:bold">İndirim: %${ASKERI_GEL_SEV*10}</div>
        ${ASKERI_GEL_SEV<ASKERI_GEL_MAX?`<button class="btn-action" onclick="upgradeGlobal('askeri')" style="margin-top:10px;padding:6px 14px;font-size:12px">Yükselt (${gelMaliyet('askeri')} Altın)</button>`:'<div style="color:#2ecc71;margin-top:10px;font-weight:bold">✓ MAX SEVİYE</div>'}
      </div>
      <div style="background:#1a1a0a;border:1px solid #3a3020;border-radius:8px;padding:14px;flex:1;min-width:220px">
        <div style="color:#f1c40f;font-weight:bold;font-size:14px">Maaş Geliştirme</div>
        <div style="color:#c8b896;font-size:12px;margin:6px 0">Tüm ünitelerin maaşını azaltır (%5/seviye)</div>
        <div style="color:#e8d4a8;margin:8px 0;font-size:13px">Seviye: <b style="color:#fff">${MAAS_GEL_SEV}</b> <span style="color:#888">/ ${MAAS_GEL_MAX}</span></div>
        <div style="color:#2ecc71;font-size:13px;font-weight:bold">İndirim: %${MAAS_GEL_SEV*5}</div>
        ${MAAS_GEL_SEV<MAAS_GEL_MAX?`<button class="btn-action" onclick="upgradeGlobal('maas')" style="margin-top:10px;padding:6px 14px;font-size:12px">Yükselt (${gelMaliyet('maas')} Altın)</button>`:'<div style="color:#2ecc71;margin-top:10px;font-weight:bold">✓ MAX SEVİYE</div>'}
      </div>
    </div>

    <h3 style="color:#d4af37;margin:0 0 8px;font-family:Cinzel,serif;letter-spacing:1px">🎯 Üniteye Özel Geliştirmeler</h3>
    <div style="color:#c8b896;font-size:12px;margin-bottom:12px">Her kademe ${GEL_MALIYET} altın + GP/KP/işlenmiş gerektirir. Geliştirmeler geri alınamaz!</div>
    <div style="display:flex;flex-direction:column;gap:8px">`;

  const playerUnits = Object.values(UNITS).filter(u=>u.side===side && u.producible !== false);
  playerUnits.forEach(u=>{
    const gel = UNIT_GEL[u.id] || {atk:0,def:0};
    const curAtk = realAtk(u.id);
    const curDef = realDef(u.id);
    const atkMax = gel.atk >= u.atkGelMax;
    const defMax = gel.def >= u.defGelMax;

    html += `
    <div style="background:#141008;border:1px solid #2a2820;border-radius:6px;padding:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="font-size:24px;width:34px;text-align:center">${u.icon}</div>
      <div style="min-width:120px"><b style="color:#e8d4a8;font-size:13px">${u.name}</b><br><span style="color:#a89880;font-size:11px">ATK:${curAtk} DEF:${curDef}</span></div>
      <div style="flex:1;display:flex;gap:8px;flex-wrap:wrap">
        <div style="background:#2a0a0a;padding:8px 12px;border-radius:5px;border:1px solid #5a2020">
          <span style="color:#ff7060;font-size:12px;font-weight:bold">⚔️ ATK</span>
          <span style="color:#fff;font-size:12px;margin-left:4px"> ${gel.atk}/${u.atkGelMax}</span>
          <span style="color:#a89880;font-size:11px"> (+${u.atkGelArtis}/sv)</span>
          ${!atkMax?`<button onclick="upgradeUnit('${u.id}','atk')" style="margin-left:8px;padding:3px 10px;font-size:11px;background:#e74c3c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold">+</button>`:'<span style="color:#2ecc71;font-size:11px;margin-left:6px;font-weight:bold">✓ MAX</span>'}
        </div>
        <div style="background:#0a0a2a;padding:8px 12px;border-radius:5px;border:1px solid #20305a">
          <span style="color:#5dade2;font-size:12px;font-weight:bold">🛡️ DEF</span>
          <span style="color:#fff;font-size:12px;margin-left:4px"> ${gel.def}/${u.defGelMax}</span>
          <span style="color:#a89880;font-size:11px"> (+${u.defGelArtis}/sv)</span>
          ${!defMax?`<button onclick="upgradeUnit('${u.id}','def')" style="margin-left:8px;padding:3px 10px;font-size:11px;background:#3498db;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold">+</button>`:'<span style="color:#2ecc71;font-size:11px;margin-left:6px;font-weight:bold">✓ MAX</span>'}
        </div>
      </div>
    </div>`;
  });

  html += `</div>

    <!-- v1.14.3.33: "Diger Stratejik Kaynaklar" sectionu user istegi ile tamamen kaldirildi.
         Bu kaynaklar zaten "Ordu" sekmesinde "Unite Egitim Kaynaklari" basligi altinda gosteriliyor. -->
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
  // v1.14.2.0 (FAZ X.4): Maliyet GP+KP+islenmis (altin yok)
  const sonraki = curSev + 1;
  const gpGerek = 10 * sonraki, kpGerek = 5 * sonraki, isGerek = 100 * sonraki;
  const gpVar = parseInt(RES.gelisim_puani || 0);
  const kpVar = parseInt(RES.kultur_puani || 0);
  const isVar = parseInt(RES.islenmis || 0);
  if(gpVar < gpGerek || kpVar < kpGerek || isVar < isGerek){
    toast(`Yetersiz: ${gpGerek} GP + ${kpGerek} KP + ${isGerek} işlenmiş gerekli`);
    return;
  }

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
  if(SM_MIKTAR <= 0){ msgEl.textContent = 'Köylüye çevrilecek asker sayısını belirle.'; msgEl.style.color='#e74c3c'; return; }
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

// v1.14.3.57: Hizli yardimci birim ekleme (train + assign tek akista)
window.hizliEsekEkle = async function(orduId) {
  return _hizliYardimciEkle(orduId, 'essek', 'Eşek', '🫏');
};
window.hizliKoyluEkle = async function(orduId) {
  return _hizliYardimciEkle(orduId, 'koylu', 'Köylü', '👨‍🌾');
};
async function _hizliYardimciEkle(orduId, uniteId, isim, ikon) {
  const ordu = ORDULAR.find(o => o.id === orduId);
  if (!ordu) return;
  const aciklama = uniteId === 'essek'
    ? `${ikon} Bu orduya kaç ${isim.toLowerCase()} eklensin?\n\n(Eşekler şehir havuzundan alınır — pazardan satın alınır veya ahır binası üretir)\n\nOrdu: ${ordu.isim}`
    : `${ikon} Bu orduya kaç ${isim.toLowerCase()} eklensin?\n\n(Boş köylüler şehir nüfusundan alınır — geri dönüşsüz, kalıcı transfer)\n\nOrdu: ${ordu.isim}`;
  const adetStr = await noxPrompt(aciklama, '10');
  if (adetStr === null) return;
  const adet = Math.max(0, parseInt(adetStr) || 0);
  if (adet <= 0) return;
  const token = getToken(); if (!token) return;
  try {
    // v1.14.3.70: INSTANT transfer — egitim DEGIL.
    // Esek: resources.essek havuzundan (kervan ile paylasilir)
    // Koylu: workers.bos_koylu'dan (geri donusumsuz, kalici)
    const r = await fetch(API_BASE + '/api/army/' + orduId + '/yardimci-ekle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ tip: uniteId, adet })
    });
    const d = await r.json();
    if (!r.ok) {
      if (typeof showToast === 'function') showToast('❌ ' + (d.error || 'Hata'), 'error');
      else toast(d.error || 'Hata');
      return;
    }
    if (typeof showToast === 'function') showToast(`✓ ${ikon} +${adet} ${isim} → "${ordu.isim}" ordusuna katildi`, 'success');
    else toast(`+${adet} ${isim} → ${ordu.isim}`);
    await loadArmyPool();
    if (typeof loadGameData === 'function') await loadGameData();
    renderOrduListe();
  } catch (e) {
    if (typeof showToast === 'function') showToast('Bağlantı hatası: ' + e.message, 'error');
    else toast('Bağlantı hatası');
  }
}

async function orduSil(id){
  const ordu = ORDULAR.find(o=>o.id===id);
  if(!ordu) return;
  if (!await noxConfirm(`"${ordu.isim}" ordusunu dağıtmak istediğine emin misin?`)) return;
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
    // v1.14.0.95: default konumKoord bos (sehirdeki ordu icin "?:?" gostermeyelim)
    var konumLabel = '';
    var konumRenk = '#2ecc71';
    var konumKoord = '';
    var korumada = o.konum_tipi === 'korumada';
    if (o.is_busy && o.aktif_gorev) {
      // v1.14.0.2 FIX: Yoldaysa gerçek hedef göster, "Şehirde" deme
      var g = o.aktif_gorev;
      var tipKisa = g.tip === 'saldiri' ? '⚔️ Saldırı' : g.tip === 'takviye' ? '🛡️ Takviye' :
        g.tip === 'donus' ? '🏠 Dönüş' : g.tip.startsWith('donus') ? '🏠 Dönüş' :
        g.tip === 'koloni' ? '🏰 Koloni' : g.tip.startsWith('rolu') ? '🔀 Relay' : '🚀';
      // v1.14.0.92: N/M PG progress gosterimi
      // v1.14.1.00 FIX: +1 kaldirildi — ilk dakikalarda 0/3 gostersin (zaten 1 saat gecmeden 1/3 olamaz)
      var toplamPG = parseInt(g.efektif_sure) || parseInt(g.ham_sure) || 1;
      var gecenMs = Date.now() - new Date(g.baslangic || Date.now()).getTime();
      var gecenPG = Math.max(0, Math.min(toplamPG, Math.floor(gecenMs / 3600000)));
      konumLabel = tipKisa + ' ' + gecenPG + '/' + toplamPG + ' PG';
      konumKoord = (g.hedef_x||'?') + ':' + (g.hedef_y||'?');
      konumRenk = g.tip.startsWith('donus') ? '#27ae60' : '#e67e22';
    } else if (o.is_busy) {
      // is_busy=TRUE ama aktif_gorev null (cron catch-up sirasinda gorev silinebilir)
      konumLabel = '⚠️ Meşgul (görev bilgisi yok)';
      konumKoord = '';
      konumRenk = '#e74c3c';
    } else if (korumada && o.takviye) {
      var tkLabel = o.takviye.hedef_kral ? o.takviye.hedef_kral + '\'de' : (o.takviye.koloni_isim ? o.takviye.koloni_isim + ' Üssü' : 'Konuşlandı');
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
    // v1.14.1.00: Geri Cagir butonu — saldiri/takviye/kolonide yoldayken (donus HARIC)
    var geriCagirBtn = '';
    if (o.is_busy && o.aktif_gorev && o.aktif_gorev.id && !(o.aktif_gorev.tip || '').startsWith('donus')) {
      geriCagirBtn = '<button onclick="event.stopPropagation();orduGeriCagir(' + o.aktif_gorev.id + ',\'' + (o.isim||'Ordu').replace(/'/g,"\\'") + '\')" style="padding:3px 10px;background:linear-gradient(180deg,#c0392b,#8b1a1a);color:#fff;border:1px solid #5a0f0f;border-radius:3px;cursor:pointer;font-family:Cinzel,serif;font-size:10px;font-weight:700;letter-spacing:.5px;margin-left:6px" title="Orduyu geri cagir (donus yolu olusur)">🔙 GERI CAGIR</button>';
    }

    // v1.14.0.92: Collapsible — varsayilan kapali (sadece ozet). Tikla -> expand
    // v1.14.0.93: state mantigi duzeltildi (true=acik, false/undefined=kapali)
    var acik = !!(window._orduCollapse && window._orduCollapse[o.id]);
    var bodyDisplay = acik ? 'grid' : 'none';
    return '<div class="card ordu-card" data-ordu-id="' + o.id + '" style="padding:0;margin-bottom:14px;border:1px solid #333;border-radius:8px;overflow:hidden">' +
      // Baslik bar — TIKLANABİLİR, toggle
      '<div onclick="orduCardToggle(' + o.id + ')" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(212,175,55,.08);border-bottom:' + (acik?'1px solid #333':'none') + ';flex-wrap:wrap;gap:6px;cursor:pointer" onmouseover="this.style.background=\'rgba(212,175,55,.14)\'" onmouseout="this.style.background=\'rgba(212,175,55,.08)\'">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="color:#d4af37;font-size:12px;width:14px;transition:transform .2s;transform:rotate(' + (acik?'90':'0') + 'deg)">▶</span>' +
          '<span style="font-family:Cinzel,serif;font-size:14px;font-weight:bold;color:#d4af37">' + o.isim + '</span>' +
          mesgulBadge + geriCagirBtn +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<span style="font-size:10px;color:' + konumRenk + ';background:' + konumRenk + '15;padding:2px 8px;border-radius:4px;border:1px solid ' + konumRenk + '33">' + konumLabel + (konumKoord ? ' <b>' + konumKoord + '</b>' : '') + '</span>' +
          '<span style="font-size:11px;color:#aaa">ATK: <span style="color:#e74c3c">' + fmt(o.atk) + '</span> DEF: <span style="color:#3498db">' + fmt(o.def) + '</span></span>' +
          '<span style="font-size:11px;color:#d4af37">' + fmt(o.total_units) + ' asker</span>' +
          '<span style="font-size:11px;color:#f39c12">📊 %' + (o.reyting || 0) + '</span>' +
        '</div>' +
      '</div>' +
      // Icerik: 3 sutun (varsayilan gizli)
      '<div class="ordu-card-body" style="display:' + bodyDisplay + ';grid-template-columns:1fr auto 1fr;gap:0">' +
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
            (function(){
              var fOpen = !!(window._openFormation && window._openFormation[o.id]);
              var fStyle = fOpen ? 'background:#2ecc7122;border-color:#2ecc71;color:#2ecc71' : '';
              return '<button class="btn ghost" style="font-size:10px;padding:5px 8px;' + fStyle + '" onclick="toggleFormationPanel(' + o.id + ')">⚔️ Saf Dizilimi ' + (fOpen ? '▲' : '▼') + '</button>';
            })() +
            (function(){
              var uOpen = !!(window._openUniteYon && window._openUniteYon[o.id]);
              var uStyle = uOpen ? 'background:#2ecc7122;border-color:#2ecc71;color:#2ecc71' : '';
              return '<button class="btn ghost" style="font-size:10px;padding:5px 8px;' + uStyle + '" onclick="toggleUniteYonetimi(' + o.id + ')">🗡️ Unite Yonetimi ' + (uOpen ? '▲' : '▼') + '</button>';
            })() +
            (!o.is_busy && o.total_units >= 100 ?
              (function(){
                var gOpen = !!(window._openOrduGonder && window._openOrduGonder[o.id]);
                var gStyle = gOpen ? 'background:#d4af3722;border-color:#d4af37;color:#d4af37' : 'color:#d4af37;border-color:#d4af3744';
                return '<button class="btn ghost" style="font-size:10px;padding:5px 8px;' + gStyle + '" onclick="toggleOrduGonderPanel(' + o.id + ',\'' + (korumada ? 'korumada' : 'sehir') + '\')">📤 Ordu Gonder ' + (gOpen ? '▲' : '▼') + '</button>';
              })()
            : '') +
            (korumada && !o.is_busy ?
              '<button class="btn ghost" style="font-size:10px;padding:5px 8px;color:#e74c3c;border-color:#e74c3c44" onclick="orduGeriCagir(' + o.id + ')">🏠 Geri Cagir</button>'
            : '') +
          '</div>' +
          // v1.14.3.57: Hizli Esek/Koylu ekleme butonlari (Sezgi: Islemler altina ekle)
          '<div style="margin-top:8px;display:flex;gap:4px">' +
            '<button class="btn ghost" style="font-size:10px;padding:4px 6px;flex:1;color:#d4af37;border-color:#d4af3744" onclick="hizliEsekEkle(' + o.id + ')" title="Bu orduya esek ekle (resources.essek\'ten dusulur)">🫏 Eşek Ekle</button>' +
            '<button class="btn ghost" style="font-size:10px;padding:4px 6px;flex:1;color:#2ecc71;border-color:#2ecc7144" onclick="hizliKoyluEkle(' + o.id + ')" title="Bu orduya koylu ekle (workers bos koyluden dusulur)">👨‍🌾 Köylü Ekle</button>' +
          '</div>' +
          '<div style="margin-top:6px"><button class="btn ghost" style="font-size:10px;padding:4px 8px;width:100%" onclick="orduSil(' + o.id + ')">Ordumu Sil</button></div>' +
        '</div>' +
        // Sag: Unite listesi
        '<div style="padding:10px 12px">' +
          '<div style="font-size:10px;color:#888;margin-bottom:6px;font-weight:bold">Uniteler</div>' +
          uniteListeHTML +
        '</div>' +
      '</div>' +
      // Alt: Unite yonetimi (gizli, toggle ile acilir) — v1.14.1.43 tek satir uygula UX
      '<div id="unite-yon-' + o.id + '" style="display:' + ((window._openUniteYon && window._openUniteYon[o.id]) ? 'block' : 'none') + ';padding:10px 12px;border-top:1px solid #333;background:rgba(0,0,0,.2)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<div style="font-size:10px;color:#888;font-weight:bold">Unite Yonetimi (yeni adet gir, Uygula)</div>' +
          '<button class="btn ghost" style="font-size:11px;padding:2px 8px;color:#e74c3c;border-color:#e74c3c44" onclick="toggleUniteYonetimi(' + o.id + ')" title="Paneli kapat">✕ Kapat</button>' +
        '</div>' +
        // v1.14.1.43: Ordu yolda/koloninde iken duzenleme YASAK — formation paneliyle ayni kural
        ((o.is_busy || (o.konum_tipi && o.konum_tipi !== 'sehir'))
          ? '<div style="padding:12px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:12px">🔒 Ünite ekleme/çıkarma sadece ordu <b>Şehirde</b> iken yapılabilir. Bu ordu şu an yolda/konuşlanmış.</div>'
          : (function(){
              // ARMY+POOL birlestirilmis liste: ordudaki uniteler + havuzdaki uretilebilir uniteler
              var orduMap = {};
              (o.units||[]).forEach(function(u){ orduMap[u.unite_id] = u.adet || 0; });
              var poolMap = {};
              allPool.forEach(function(p){ poolMap[p.id] = p.count || 0; });
              // Tum unite tipleri (orduda var olanlar + havuzda var olanlar)
              var tumIds = {};
              Object.keys(orduMap).forEach(function(k){ if (orduMap[k] > 0) tumIds[k] = true; });
              Object.keys(poolMap).forEach(function(k){ if (poolMap[k] > 0) tumIds[k] = true; });
              var ids = Object.keys(tumIds);
              if (ids.length === 0) {
                return '<div style="color:#555;font-size:11px;padding:6px">Orduda veya havuzda unite yok.</div>';
              }
              return '<div style="display:flex;flex-direction:column;gap:4px">' +
                ids.map(function(uid){
                  var def = UNITS[uid] || { name: uid, icon: '⚔' };
                  var orduda = orduMap[uid] || 0;
                  var havuzda = poolMap[uid] || 0;
                  var maxHedef = orduda + havuzda;
                  var inpId = 'uhedef-' + o.id + '-' + uid;
                  return '<div style="display:flex;align-items:center;gap:6px;background:#111;border:1px solid #333;border-radius:4px;padding:5px 8px">' +
                    '<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#ccc;min-width:160px">' + unitIcon(def, 16) + ' ' + def.name + '</span>' +
                    '<span style="font-size:10px;color:#888;min-width:130px">Orduda: <b style="color:#c8a96e">' + orduda + '</b> · Havuzda: <b style="color:#888">' + havuzda + '</b></span>' +
                    '<input type="number" id="' + inpId + '" min="0" max="' + maxHedef + '" value="' + orduda + '" style="width:80px;padding:3px 5px;background:#0a0a0a;border:1px solid #2a2a2a;color:#fff;border-radius:3px;font-size:11px" />' +
                    '<button style="background:#1a1a1a;border:1px solid #555;color:#c8a96e;cursor:pointer;font-size:10px;padding:3px 8px;border-radius:3px" onclick="uksSetMax(\'' + inpId + '\',' + maxHedef + ')" title="Tum havuz + orduda olanlar">MAX</button>' +
                    '<button style="background:#1a3a1a;border:1px solid #2ecc71;color:#2ecc71;cursor:pointer;font-size:11px;padding:4px 12px;border-radius:3px;font-weight:bold" onclick="uksUygulaHedef(' + o.id + ',\'' + uid + '\',\'' + inpId + '\',' + orduda + ')" title="Yeni adete getir (artikta ekle, eksilirse cikar)">✓ Uygula</button>' +
                  '</div>';
                }).join('') +
              '</div>';
            })()
        ) +
      '</div>' +
      // v1.14.0.90: Inline saf dizilimi paneli (gizli, toggle ile acilir)
      '<div id="formation-panel-' + o.id + '" style="display:' + ((window._openFormation && window._openFormation[o.id]) ? 'block' : 'none') + ';padding:12px;border-top:1px solid #333;background:rgba(0,0,0,.25)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<div style="font-size:11px;color:#d4af37;font-weight:bold">⚔️ Saf Dizilimi — ' + o.isim + '</div>' +
          '<button class="btn ghost" style="font-size:11px;padding:2px 8px;color:#e74c3c;border-color:#e74c3c44" onclick="toggleFormationPanel(' + o.id + ')" title="Paneli kapat">✕ Kapat</button>' +
        '</div>' +
        (o.is_busy || (o.konum_tipi && o.konum_tipi !== 'sehir')
          ? '<div style="padding:12px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:12px">🔒 Saf dizilimi sadece ordu <b>Şehirde</b> iken düzenlenebilir. Bu ordu şu an yolda/konuşlanmış.</div>'
          : '<div id="formation-body-' + o.id + '"><div style="color:#888;font-size:11px;padding:10px">Yükleniyor...</div></div>'
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
      // v1.9.3: Ordu Gonder paneli — koordinat + v1.14.0.92 oyuncu ara
      '<div id="ordu-gonder-panel-' + o.id + '" style="display:' + ((window._openOrduGonder && window._openOrduGonder[o.id]) ? 'block' : 'none') + ';padding:12px;border-top:1px solid #d4af3744;background:rgba(212,175,55,.04)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<div style="font-size:11px;color:#d4af37;font-weight:bold">📤 Ordu Gonder — ' + o.isim + '</div>' +
          '<button class="btn ghost" style="font-size:11px;padding:2px 8px;color:#e74c3c;border-color:#e74c3c44" onclick="toggleOrduGonderPanel(' + o.id + ',\'' + (korumada ? 'korumada' : 'sehir') + '\')" title="Paneli kapat">✕ Kapat</button>' +
        '</div>' +
        // Sekme: Oyuncu Ara / Koordinat
        '<div style="display:flex;gap:4px;margin-bottom:10px">' +
          '<button class="btn ghost" id="og-tab-oyuncu-' + o.id + '" onclick="orduGonderTab(' + o.id + ',\'oyuncu\')" style="font-size:10px;padding:4px 10px;background:#d4af3722">🔍 Oyuncu Ara</button>' +
          '<button class="btn ghost" id="og-tab-koord-' + o.id + '" onclick="orduGonderTab(' + o.id + ',\'koord\')" style="font-size:10px;padding:4px 10px">📍 Koordinat</button>' +
        '</div>' +
        // Oyuncu ara
        '<div id="og-panel-oyuncu-' + o.id + '" style="display:block">' +
          '<input id="og-oyuncu-' + o.id + '" type="text" placeholder="Oyuncu adi (min 2 harf)" oninput="orduGonderOyuncuAra(' + o.id + ',this.value)" style="width:100%;background:#1a1a1a;border:1px solid #444;color:#eee;padding:6px 10px;border-radius:5px;font-size:12px;margin-bottom:4px">' +
          '<div id="og-oyuncu-sonuc-' + o.id + '" style="max-height:200px;overflow-y:auto"></div>' +
        '</div>' +
        // Koordinat
        '<div id="og-panel-koord-' + o.id + '" style="display:none">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">' +
            '<div>' +
              '<label style="color:#aaa;font-size:10px;display:block;margin-bottom:3px">X</label>' +
              '<input id="og-x-' + o.id + '" type="number" min="1" max="200" placeholder="X" style="width:70px;background:#1a1a1a;border:1px solid #444;color:#eee;padding:6px 8px;border-radius:5px;font-size:12px;text-align:center">' +
            '</div>' +
            '<span style="color:#555;font-size:16px;padding-bottom:4px">:</span>' +
            '<div>' +
              '<label style="color:#aaa;font-size:10px;display:block;margin-bottom:3px">Y</label>' +
              '<input id="og-y-' + o.id + '" type="number" min="1" max="50" placeholder="Y" style="width:70px;background:#1a1a1a;border:1px solid #444;color:#eee;padding:6px 8px;border-radius:5px;font-size:12px;text-align:center">' +
            '</div>' +
            '<button class="btn ghost" style="font-size:11px;padding:6px 14px;color:#d4af37;border-color:#d4af3744" onclick="orduGonderAra(' + o.id + ')">🔍 Ara</button>' +
          '</div>' +
        '</div>' +
        '<div id="og-sonuc-' + o.id + '" style="font-size:11px;color:#888;min-height:20px;margin-top:8px"></div>' +
        // v1.14.1.14 — SAVAS BUYULERI (opsiyonel)
        renderOrduBuyuSecici(o.id) +
      '</div>' +
    '</div>';
  }).join('');
}

/* v1.14.1.14 — Savas buyuleri secici HTML (ordu gonder panelinde) */
function renderOrduBuyuSecici(orduId) {
  // SAVAS_BUYULERI lokal tanim (frontend constants'a eklenebilir)
  const BUYULER = (typeof SAVAS_BUYULERI !== 'undefined') ? SAVAS_BUYULERI : {
    battle_cry:   { isim:'Battle Cry',   ikon:'⚡', aciklama:'ATK +%25 / DEF -%15 (1 tur)',   cag_min:1, mana_baz:50, cd_pg:24, kategori:'destek' },
    kutsal_kalkan:{ isim:'Kutsal Kalkan',ikon:'🛡️', aciklama:'DEF +%30 / ATK -%15 (1 tur)',  cag_min:2, mana_baz:60, cd_pg:24, kategori:'savunma' },
    sis_perdesi:  { isim:'Sis Perdesi',  ikon:'🌀', aciklama:'Gelen hasar -%50 / ATK -%10',    cag_min:2, mana_baz:40, cd_pg:24, kategori:'savunma' },
    ates_topu:    { isim:'Ates Topu',    ikon:'🔥', aciklama:'Dusmana +%50 hasar / kendi +%15', cag_min:3, mana_baz:80, cd_pg:48, kategori:'saldiri' },
    uyku:         { isim:'Uyku',         ikon:'😴', aciklama:'Dusman 1 tur saldiramaz',        cag_min:3, mana_baz:100,cd_pg:72, kategori:'kontrol' },
  };
  const oyuncuCag = (typeof OYUNCU !== 'undefined' && OYUNCU) ? (OYUNCU.cag || 1) : 1;
  var html = '<div style="margin-top:10px;border-top:1px solid rgba(212,175,55,0.2);padding-top:8px">' +
    '<div style="font-size:11px;color:#d4af37;font-weight:bold;margin-bottom:6px;cursor:pointer" onclick="document.getElementById(\'og-buyuler-' + orduId + '\').style.display = document.getElementById(\'og-buyuler-' + orduId + '\').style.display===\'none\' ? \'block\' : \'none\'">✨ Savaş Büyüleri (max 3, opsiyonel) — tıkla aç ▼</div>' +
    '<div id="og-buyuler-' + orduId + '" style="display:none">';
  for (const [bid, b] of Object.entries(BUYULER)) {
    const kullanılabilir = oyuncuCag >= b.cag_min;
    const sb = kullanılabilir ? '#1a1a1a' : '#0a0a0a';
    const renk = kullanılabilir ? '#ccc' : '#555';
    html += '<label style="display:flex;align-items:center;gap:6px;padding:4px 8px;margin-bottom:3px;background:' + sb + ';border:1px solid #333;border-radius:3px;cursor:' + (kullanılabilir?'pointer':'not-allowed') + ';font-size:11px;color:' + renk + '">' +
      '<input type="checkbox" ' + (kullanılabilir?'':'disabled') + ' data-buyu-id="' + bid + '" data-ordu-id="' + orduId + '" onchange="orduBuyuToggle(' + orduId + ')" style="margin:0">' +
      '<span style="font-size:14px">' + b.ikon + '</span>' +
      '<span style="flex:1">' +
        '<b>' + b.isim + '</b> <span style="color:#888;font-size:10px">Çağ ' + b.cag_min + '</span>' +
        '<div style="font-size:10px;color:#888">' + b.aciklama + '</div>' +
      '</span>' +
      '<div style="text-align:right;font-size:10px">' +
        '<div style="color:#9b59b6">' + b.mana_baz + ' mana</div>' +
        '<div style="color:#666">' + b.cd_pg + ' PG CD</div>' +
      '</div>' +
    '</label>';
  }
  html += '<div style="font-size:10px;color:#666;margin-top:6px">Büyüler saldırı sırasında 1. tur atılır. Mana ordu gönderildiğinde düşer.</div>';
  html += '</div></div>';
  return html;
}

function orduBuyuToggle(orduId) {
  const panel = document.getElementById('og-buyuler-' + orduId);
  if (!panel) return;
  const seci = panel.querySelectorAll('input[type="checkbox"]:checked');
  if (seci.length > 3) {
    // Son tıklananı geri al
    const tumu = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
    for (const c of tumu) { if (!c.checked) continue; /* skip */ }
    // Basit: fazla seçileni uncheck et
    seci[seci.length - 1].checked = false;
    if (typeof showToast === 'function') showToast('Max 3 büyü seçebilirsin', 'error');
  }
}

if (typeof window !== 'undefined') {
  window.renderOrduBuyuSecici = renderOrduBuyuSecici;
  window.orduBuyuToggle = orduBuyuToggle;
}

window._openUniteYon = window._openUniteYon || {};
function toggleUniteYonetimi(armyId) {
  window._openUniteYon = window._openUniteYon || {};
  window._openUniteYon[armyId] = !window._openUniteYon[armyId];
  if (typeof renderOrduListe === 'function') renderOrduListe();
}

// v1.14.0.92/93: Ordu kartini genislet/daralt (true=acik, false/undefined=kapali)
window._orduCollapse = window._orduCollapse || {};
function orduCardToggle(armyId) {
  window._orduCollapse[armyId] = !window._orduCollapse[armyId];
  // Yeniden render
  if (typeof renderOrduListe === 'function') renderOrduListe();
}
if (typeof window !== 'undefined') window.orduCardToggle = orduCardToggle;

/* v1.14.1.00: Ordu geri cagir — POST /api/savas/iptal */
async function orduGeriCagir(gorevId, orduIsim) {
  if (!gorevId) return;
  if (!await noxConfirm('🔙 "' + orduIsim + '" ordusunu geri cagirmak istiyor musun?\n\nOrdu simdiye kadar gittigi mesafe kadar donus yolunda olacak. Donus yolundayken iptal edilemez.')) return;
  const token = getToken();
  if (!token) return;
  try {
    const r = await fetch(API_BASE + '/api/savas/iptal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ gorevId: gorevId })
    });
    const d = await r.json();
    if (r.ok && d.basarili) {
      if (typeof showToast === 'function') showToast('🔙 Ordu geri cagrildi — ' + (d.efektif_sure||'?') + ' PG sonra evde', 'success');
      else noxAlert('Ordu geri cagrildi!');
      await loadArmyPool();
      if (typeof renderOrduListe === 'function') renderOrduListe();
      if (typeof refreshOrdularim === 'function') refreshOrdularim();
    } else {
      noxAlert('Hata: ' + (d.error || 'Bilinmeyen'));
    }
  } catch(e) {
    noxAlert('Baglanti hatasi: ' + e.message);
  }
}
if (typeof window !== 'undefined') window.orduGeriCagir = orduGeriCagir;

// v1.14.0.89: Unite adet input helper (MAX butonu)
function uksSetMax(inputId, max) {
  var el = document.getElementById(inputId);
  if (el) el.value = max;
}
if (typeof window !== 'undefined') {
  window.uksSetMax = uksSetMax;
}

// v1.14.1.43: Tek satir hedef adete getir — fark kadar ekle veya cikar
function uksUygulaHedef(armyId, uniteId, inputId, mevcutOrdu) {
  var el = document.getElementById(inputId);
  var hedef = parseInt(el?.value);
  if (isNaN(hedef) || hedef < 0) {
    if (typeof showToast === 'function') showToast('Gecerli adet gir', 'error');
    return;
  }
  var fark = hedef - mevcutOrdu;
  if (fark === 0) {
    if (typeof showToast === 'function') showToast('Adet ayni — degisiklik yok', 'info');
    return;
  }
  if (fark > 0) {
    orduUniteEkle(armyId, uniteId, fark);
  } else {
    orduUniteCircar(armyId, uniteId, -fark);
  }
}
if (typeof window !== 'undefined') window.uksUygulaHedef = uksUygulaHedef;

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
  // v1.14.3.56: Yardimci birimler (essek/koylu) side='neutral' — her iki tarafta gozukur
  const units = Object.values(UNITS).filter(u=>(u.side===side || u.side==='neutral') && u.producible !== false);
  grid.innerHTML = '';

  // v1.14.0.94: Sablon seciminden gore render
  var sablon = 'klasik';
  try { sablon = localStorage.getItem('noxara_asker_egitim_sablon') || 'klasik'; } catch(e) {}
  if (sablon === 'accordion') {
    return renderUnitGridAccordion(units, grid, side);
  }

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
          <span class="u-meta">${tierLbl} · ${u.role||''}${u.saldiriCarpan>1?' · ×'+u.saldiriCarpan:''}${typeof unitSafEtiket==='function'?' · '+unitSafEtiket(u):''}</span>
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

/* ═══════════════════════════════════════════════════════════
   v1.14.0.94: Asker Egitim Sablon 2 — Altin Cerceveli Accordion
═══════════════════════════════════════════════════════════ */
function renderUnitGridAccordion(units, grid, side) {
  grid.className = 'ugrid-accordion';
  const catLabel = side === 'light' ? 'AYDINLIK BİRLİKLER' : 'KARANLIK BİRLİKLER';
  var html = '<div class="t9-cat">⚔ ' + catLabel + '</div>' +
    '<div class="t9-head">' +
      '<span class="t9-title">Üniteler</span>' +
      '<span class="t9-count">' + units.length + ' ünite</span>' +
    '</div>' +
    '<div class="t9-list">';

  units.forEach(function(u) {
    const rc = realCost(u.cost);
    const TIER_ASKER = { 1:1, 2:1, 3:1, 4:0 };
    const askerGerekli = TIER_ASKER[u.tier] || 0;
    const askerVar = population.asker || 0;
    const askerOk = askerGerekli === 0 || askerVar >= askerGerekli;
    const afford = canAfford(rc) && canAffordExtra(u.extraCost) && askerOk;
    const uAtk = realAtk(u.id);
    const uDef = realDef(u.id);
    const uMaas = realMaas(u.maas);
    const trainDays = u.trainDays || (u.tier===1?1:u.tier===2?2:3);
    const tierLbl = 'T' + u.tier;

    // Maliyet satiri
    var costParts = [];
    Object.entries(rc).forEach(function(e){
      var r = e[0], a = e[1];
      var have = RES[r] || 0;
      costParts.push('<b class="' + (have>=a?'cost-ok':'cost-no') + '">' + a.toLocaleString('tr-TR') + '</b> ' + (r==='islenmis'?'işl.metal':r));
    });
    if (askerGerekli > 0) costParts.push('<b class="' + (askerOk?'cost-ok':'cost-no') + '">' + askerGerekli + '</b> asker');
    Object.entries(u.extraCost || {}).forEach(function(e){
      var r = e[0], a = e[1];
      var have = EXTRA_RES[r] || 0;
      costParts.push('<b class="' + (have>=a?'cost-ok':'cost-no') + '">' + a + '</b> ' + r);
    });
    var priceHTML = costParts.join('<span class="sep">·</span>');

    html += '<div class="t9-row" data-uid="' + u.id + '">' +
      '<div class="t9-head-row" onclick="t9Toggle(event, \'' + u.id + '\')">' +
        '<div class="t9-ico">' + (u.icon || '⚔') + '</div>' +
        '<div class="t9-info">' +
          '<div class="t9-name">' + u.name + '</div>' +
          '<div class="t9-meta">' + tierLbl + ' · ATK <b>' + uAtk + '</b> · DEF <b>' + uDef + '</b> · Maaş <b>' + uMaas + '</b> · ⏱ ' + trainDays + ' PG</div>' +
        '</div>' +
        '<span class="t9-toggle">▾</span>' +
      '</div>' +
      '<div class="t9-body">' +
        '<div class="t9-price">Maliyet: ' + priceHTML + '</div>' +
        '<div class="t9-ctrl">' +
          '<button class="minus" onclick="changeCount(\'' + u.id + '\',-1)">−</button>' +
          '<input id="cnt-' + u.id + '" value="' + u.count + '" type="number" min="0" onchange="setCount(\'' + u.id + '\',this.value)">' +
          '<button class="plus" onclick="changeCount(\'' + u.id + '\',1)">+</button>' +
          '<button class="t9-btn" ' + (afford?'':'disabled') + ' onclick="trainUnit(\'' + u.id + '\')">EGIT</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  grid.innerHTML = html;
  updateArmyStats();
}

// Accordion toggle (input/button tiklamasinda propagate etmez)
function t9Toggle(ev, uid) {
  if (ev && ev.target) {
    var tag = ev.target.tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
  }
  var row = ev?.currentTarget?.closest('.t9-row');
  if (row) row.classList.toggle('open');
}
if (typeof window !== 'undefined') window.t9Toggle = t9Toggle;

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
    // v1.14.0.93: cache-bust + no-store (ETag 304 stale bug)
    const resp = await fetch(API_BASE + '/api/army/state?_cb=' + Date.now(), {
      headers: { 'Authorization': 'Bearer ' + token, 'Cache-Control': 'no-cache' },
      cache: 'no-store'
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
    // v1.14.0.95 FIX: aktif_gorev / reyting / konum_tipi / takviye alanlari backend'den geliyor
    // ama map'te drop ediliyordu — "Mesgul (gorev bilgisi yok)" ve "Reyting %0" bug'inin kaynagi.
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
        // v1.14.0.95: eksik alanlar eklendi
        aktif_gorev: a.aktif_gorev || null,
        reyting: a.reyting || 0,
        guc_base: a.guc_base || 0,
        konum_tipi: a.konum_tipi || 'sehir',
        konum: a.konum || null,
        takviye: a.takviye || null,
        koloni_bilgi: a.koloni_bilgi || null,
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
  // v1.14.1.16 FIX: Istatistikler HAVUZ + ORDULAR toplamini gostersin (sadece havuz degil).
  // Eski kod: UNITS.count (havuz) uzerinden hesapliyordu — tum birimler orduya atanmissa 0 cikiyordu.
  // Yeni: Havuz (UNITS.count) + her ordu (ORDULAR[i].units[*].adet) toplam.
  const all = Object.values(UNITS);
  let poolAtk = 0, poolDef = 0, poolUnits = 0, poolMaas = 0;
  for (const u of all) {
    poolAtk   += realAtk(u.id) * u.count * u.saldiriCarpan;
    poolDef   += realDef(u.id) * u.count;
    poolUnits += u.count;
    poolMaas  += realMaas(u.maas) * u.count;
  }
  let armyAtk = 0, armyDef = 0, armyUnits = 0, armyMaas = 0;
  for (const ordu of (window.ORDULAR || [])) {
    // Backend zaten ATK/DEF'i hesaplamis (moral + gelistirme + saldiri carpan dahil) — direkt kullan
    armyAtk   += ordu.atk || 0;
    armyDef   += ordu.def || 0;
    armyUnits += ordu.total_units || 0;
    for (const u of (ordu.units || [])) {
      const def = UNITS[u.unite_id];
      if (def) armyMaas += realMaas(def.maas) * (u.adet || 0);
    }
  }
  const totalAtk = poolAtk + armyAtk;
  const totalDef = poolDef + armyDef;
  const totalUnits = poolUnits + armyUnits;
  const totalMaas = poolMaas + armyMaas;
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
    // v1.14.3.33 — Beyaz mana koyu zeminde okunmuyordu. Altin/krem rengine cevirildi
    var RENK_RENK = { beyaz:'#d4af37', kirmizi:'#e74c3c', mavi:'#5dade2', yesil:'#2ecc71' };
    var el = document.getElementById('ax-mana-renk');
    if (el) { el.textContent = RENK_AD[_renk]; el.style.color = RENK_RENK[_renk]; }
    var ax = document.getElementById('ax-mana');
    if (ax) { ax.style.color = RENK_RENK[_renk]; ax.style.textShadow = '0 0 4px rgba(0,0,0,0.7)'; ax.style.fontWeight = 'bold'; }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  // loadGameData tamamlaninca ordu verisini yukle
  async function initArmy() {
    // v1.14.1.15 FIX: loadArmyPool() ilk yuklemede cagrilmiyordu — UNITS.count ve ORDULAR
    // bos kaliyordu, HUD stats bar (ATK/DEF/units/maas) ve ekstra kaynaklar 0 gorunuyordu.
    await loadArmyPool();
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

// v1.14.0.92: Ordu Gonder tab switch (oyuncu/koord) + oyuncu ara
function orduGonderTab(armyId, tab) {
  var oy = document.getElementById('og-panel-oyuncu-' + armyId);
  var ko = document.getElementById('og-panel-koord-' + armyId);
  var tOy = document.getElementById('og-tab-oyuncu-' + armyId);
  var tKo = document.getElementById('og-tab-koord-' + armyId);
  if (tab === 'oyuncu') {
    oy.style.display = 'block'; ko.style.display = 'none';
    if (tOy) tOy.style.background = '#d4af3722';
    if (tKo) tKo.style.background = '';
  } else {
    oy.style.display = 'none'; ko.style.display = 'block';
    if (tOy) tOy.style.background = '';
    if (tKo) tKo.style.background = '#d4af3722';
  }
}
window._ogAraTimer = window._ogAraTimer || {};
async function orduGonderOyuncuAra(armyId, q) {
  clearTimeout(window._ogAraTimer[armyId]);
  var sonuc = document.getElementById('og-oyuncu-sonuc-' + armyId);
  if (!sonuc) return;
  if (!q || q.length < 2) { sonuc.innerHTML = ''; return; }
  window._ogAraTimer[armyId] = setTimeout(async function(){
    try {
      var token = getToken();
      var r = await fetch(API_BASE + '/api/player/ara?isim=' + encodeURIComponent(q), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) { sonuc.innerHTML = '<div style="color:#e74c3c;font-size:11px">Arama hatasi</div>'; return; }
      var data = await r.json();
      if (!data.length) {
        sonuc.innerHTML = '<div style="color:#888;font-size:11px;padding:6px">Sonuc yok</div>';
        return;
      }
      sonuc.innerHTML = data.slice(0, 8).map(function(p){
        var uygun = p.saldiri_uygun !== false;
        var renk = uygun ? '#2ecc71' : '#c0392b';
        var detay = p.red_sebebi ? ' <span style="color:#c0392b;font-size:9px">(' + p.red_sebebi + ')</span>' : '';
        return '<div style="padding:6px 8px;margin-bottom:3px;background:#1a1a1a;border:1px solid ' + renk + '33;border-radius:4px;cursor:' + (uygun?'pointer':'not-allowed') + ';opacity:' + (uygun?'1':'0.55') + ';font-size:11px" ' +
          (uygun ? 'onclick="orduGonderOyuncuSec(' + armyId + ',' + p.id + ',' + p.koord_x + ',' + p.koord_y + ',\'' + (p.kullanici_adi||'').replace(/\'/g,'') + '\')"' : '') + '>' +
          '<b style="color:' + renk + '">' + (p.kullanici_adi||'?') + '</b> ' +
          '<span style="color:#888;font-size:9px">· C' + (p.cag||'?') + ' · ' + (p.taraf||'?') + ' · ' + (p.koord_x||'?') + ':' + (p.koord_y||'?') + '</span>' +
          detay +
        '</div>';
      }).join('');
    } catch(e) {
      sonuc.innerHTML = '<div style="color:#e74c3c;font-size:11px">Hata: ' + e.message + '</div>';
    }
  }, 350);
}
function orduGonderOyuncuSec(armyId, hedefId, x, y, kral) {
  // Secilen oyuncunun koordinati X/Y inputlarina yaz + auto ara
  var xEl = document.getElementById('og-x-' + armyId);
  var yEl = document.getElementById('og-y-' + armyId);
  if (xEl) xEl.value = x;
  if (yEl) yEl.value = y;
  var sonuc = document.getElementById('og-sonuc-' + armyId);
  if (sonuc) sonuc.innerHTML = '<span style="color:#2ecc71">🎯 Hedef: ' + (kral||'?') + ' (' + x + ':' + y + ')</span>';
  // Oyuncu tabindayken auto-ara
  if (typeof orduGonderAra === 'function') orduGonderAra(armyId);
}
if (typeof window !== 'undefined') {
  window.orduGonderTab = orduGonderTab;
  window.orduGonderOyuncuAra = orduGonderOyuncuAra;
  window.orduGonderOyuncuSec = orduGonderOyuncuSec;
}

window._openOrduGonder = window._openOrduGonder || {};
function toggleOrduGonderPanel(armyId, konumTipi) {
  // Diger ordu gonder panelleri kapat (state)
  for (var k in window._openOrduGonder) {
    if (parseInt(k) !== armyId) window._openOrduGonder[k] = false;
  }
  var nowOpen = !window._openOrduGonder[armyId];
  window._openOrduGonder[armyId] = nowOpen;
  if (nowOpen) {
    _ogAramaSonuc[armyId] = null;
    window._ogKonumTipi = window._ogKonumTipi || {};
    window._ogKonumTipi[armyId] = konumTipi || 'sehir';
  }
  if (typeof renderOrduListe === 'function') renderOrduListe();
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
  if (!await noxConfirm('Bu orduyu guild uyenize takviye olarak gondermek istiyor musunuz?')) return;
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
  // v1.14.1.14 — Secili buyuleri topla
  var buyuler = [];
  var panel = document.getElementById('og-buyuler-' + armyId);
  if (panel) {
    panel.querySelectorAll('input[type="checkbox"]:checked').forEach(function(cb){
      buyuler.push({ id: cb.dataset.buyuId, tur: 1 }); // tur: varsayilan 1 (1. tur)
    });
  }
  var buyuOzet = buyuler.length > 0 ? '\n\nBüyüler: ' + buyuler.map(b => b.id).join(', ') : '';
  if (!await noxConfirm('Bu orduyu saldiriya gondermek istiyor musunuz?' + buyuOzet)) return;
  var token = getToken(); if (!token) return;
  try {
    var res = await fetch(API_BASE + '/api/savas/saldir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orduId: armyId, hedefPlayerId: hedefPlayerId, buyuler: buyuler })
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
  if (!await noxConfirm('Bu orduyu konuslandigi yerden saldiriya gondermek istiyor musunuz?')) return;
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
  if (!await noxConfirm('Bu orduyu koloni ussune gondermek istiyor musunuz?')) return;
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
  if (!await noxConfirm('Bu orduyu geri cagirmak istediginize emin misiniz? Ordu sehrinize donecektir.')) return;
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

window._openFormation = window._openFormation || {};
function toggleFormationPanel(armyId) {
  var wasOpen = !!window._openFormation[armyId];
  // Tum formation panellerini kapali isaretle (sadece bir tane acik olsun)
  for (var k in window._openFormation) window._openFormation[k] = false;
  if (!wasOpen) {
    window._openFormation[armyId] = true;
    FORMATION_ARMY_ID = armyId;
    FORMATION_STATE = [[], [], [], []];
    var army = ORDULAR.find(function(o){ return o.id === armyId; });
    if (army && army.dizilim && army.dizilim.saflar) {
      for (var i = 0; i < 4; i++) FORMATION_STATE[i] = (army.dizilim.saflar[i] || []).slice();
    }
  }
  if (typeof renderOrduListe === 'function') renderOrduListe();
  if (window._openFormation[armyId]) {
    var army2 = ORDULAR.find(function(o){ return o.id === armyId; });
    if (army2 && !army2.is_busy && (!army2.konum_tipi || army2.konum_tipi === 'sehir')) {
      renderInlineFormation(armyId);
    }
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
