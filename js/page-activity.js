/* ══════════════════════════════════
   SEHIRDE OLANLAR — Aktivite Logu (v1.8.0)
   Tarih + Tip gruplama, filtre butonları
══════════════════════════════════ */

// v1.13.44: eksik event'ler eklendi (askeri/casus_hedefi/kadim_saldiri/takviye/kadim_ticaret/bocek_yarisi/premium/sandik)
// v1.13.45: casus_hedefi + kadim_saldiri hem Askeri hem Sehir'de (sehrine zarar/etki)
const KATEGORI_MAP = {
  sehir: { isim:'Şehir', renk:'#c9a84c', tipler:['bina_tamam','nufus','kacis','yemek','sehir_morali','festival','arazi','essek','kervan','bocek_yarisi','casus_hedefi','kadim_saldiri'] },
  askeri: { isim:'Askeri', renk:'#e74c3c', tipler:['egitim_tamam','maas','savas','casus','casus_hedefi','askeri','kadim_saldiri','takviye'] },
  ekonomi: { isim:'Ekonomi', renk:'#2ecc71', tipler:['isci_uretim','ekonomi','pisirme','bolge_bonus','irk_bonus','mana_uretim','vergi'] },
  ticaret: { isim:'Ticaret', renk:'#3498db', tipler:['market_satis','buyu_alisveris','pazar_ilan','pazar_alisveris','guild_ambar','guild_bagis','kadim_ticaret'] },
  koloni: { isim:'Koloni', renk:'#9b59b6', tipler:['koloni_fetih','koloni_cekil','koloni_kaynak'] },
  diger: { isim:'Diğer', renk:'#888', tipler:['admin','artifact','gorev','premium','sandik'] },
};

let aktifFiltre = 'hepsi'; // hepsi veya kategori key
let aktifGruplama = 'tarih_tip'; // tarih | tarih_tip

async function loadActivity() {
  const token = getToken();
  if (!token) return;
  const loading = document.getElementById('activity-loading');
  const list    = document.getElementById('activity-list');
  const empty   = document.getElementById('activity-empty');
  if (loading) loading.style.display = 'block';
  if (list)    list.style.display    = 'none';
  if (empty)   empty.style.display   = 'none';
  try {
    const resp = await fetch(API_BASE + '/api/game/activity', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) { if (loading) loading.style.display='none'; return; }
    const data = await resp.json();
    if (loading) loading.style.display = 'none';
    if (!data.gunler || data.gunler.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (list) {
      list.style.display = 'block';
      renderActivity(data.gunler);
    }
  } catch(e) {
    if (loading) { loading.style.display='block'; loading.innerText='Baglanti hatasi.'; }
  }
}

function getKategori(eventType) {
  for (const [key, kat] of Object.entries(KATEGORI_MAP)) {
    if (kat.tipler.includes(eventType)) return key;
  }
  return 'diger';
}

function renderActivity(gunler) {
  const list = document.getElementById('activity-list');

  // Filtre butonları
  let filtreBtnHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">' +
    '<button onclick="setFiltre(\'hepsi\')" style="padding:3px 10px;font-size:10px;border-radius:3px;cursor:pointer;border:1px solid ' + (aktifFiltre==='hepsi'?'#c9a84c':'#333') + ';background:' + (aktifFiltre==='hepsi'?'rgba(201,168,76,0.15)':'#111') + ';color:' + (aktifFiltre==='hepsi'?'#c9a84c':'#888') + '">Hepsi</button>';
  for (const [key, kat] of Object.entries(KATEGORI_MAP)) {
    filtreBtnHtml += '<button onclick="setFiltre(\'' + key + '\')" style="padding:3px 10px;font-size:10px;border-radius:3px;cursor:pointer;border:1px solid ' + (aktifFiltre===key?kat.renk:'#333') + ';background:' + (aktifFiltre===key?kat.renk+'22':'#111') + ';color:' + (aktifFiltre===key?kat.renk:'#666') + '">' + kat.isim + '</button>';
  }
  filtreBtnHtml += '</div>';

  // Gruplama toggle
  let gruplamaHtml = '<div style="display:flex;gap:6px;margin-bottom:12px;font-size:10px">' +
    '<span style="color:#555">Gruplama:</span>' +
    '<button onclick="setGruplama(\'tarih\')" style="padding:2px 8px;border-radius:3px;cursor:pointer;border:1px solid ' + (aktifGruplama==='tarih'?'#c9a84c':'#333') + ';background:' + (aktifGruplama==='tarih'?'rgba(201,168,76,0.1)':'none') + ';color:' + (aktifGruplama==='tarih'?'#c9a84c':'#666') + '">Tarih</button>' +
    '<button onclick="setGruplama(\'tarih_tip\')" style="padding:2px 8px;border-radius:3px;cursor:pointer;border:1px solid ' + (aktifGruplama==='tarih_tip'?'#c9a84c':'#333') + ';background:' + (aktifGruplama==='tarih_tip'?'rgba(201,168,76,0.1)':'none') + ';color:' + (aktifGruplama==='tarih_tip'?'#c9a84c':'#666') + '">Tarih + Tip</button>' +
  '</div>';

  let contentHtml = '';

  gunler.forEach(g => {
    // Filtre uygula
    let loglar = g.loglar;
    if (aktifFiltre !== 'hepsi') {
      const katTipler = KATEGORI_MAP[aktifFiltre]?.tipler || [];
      loglar = loglar.filter(l => katTipler.includes(l.event_type));
    }
    if (!loglar.length) return;

    contentHtml += '<div style="margin-bottom:18px">';
    contentHtml += '<div style="color:#c8a96e;font-family:Cinzel,serif;font-size:12px;border-bottom:1px solid #2a2a1a;padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between"><span>' + g.tarih + '</span><span style="font-size:9px;color:#444">' + loglar.length + ' olay</span></div>';

    if (aktifGruplama === 'tarih_tip') {
      // Tip bazlı gruplama
      const gruplar = {};
      loglar.forEach(l => {
        const tip = l.event_type || 'diger';
        if (!gruplar[tip]) gruplar[tip] = [];
        gruplar[tip].push(l);
      });

      for (const [tip, items] of Object.entries(gruplar)) {
        const kat = getKategori(tip);
        const katRenk = KATEGORI_MAP[kat]?.renk || '#888';
        const ikon = (typeof ACTIVITY_ICONS !== 'undefined' && ACTIVITY_ICONS[tip]) || '•';
        contentHtml += '<div style="margin:4px 0 6px;padding-left:4px;border-left:2px solid ' + katRenk + '">';
        contentHtml += '<div style="font-size:10px;color:' + katRenk + ';font-weight:bold;margin-bottom:2px">' + ikon + ' ' + tip.replace(/_/g,' ').toUpperCase() + ' (' + items.length + ')</div>';
        items.forEach(l => {
          contentHtml += '<div style="font-size:11px;color:#999;padding:1px 0 1px 8px">' + l.mesaj + '</div>';
        });
        contentHtml += '</div>';
      }
    } else {
      // Düz liste
      loglar.forEach(l => {
        const ikon = (typeof ACTIVITY_ICONS !== 'undefined' && ACTIVITY_ICONS[l.event_type]) || '•';
        contentHtml += '<div style="display:flex;gap:6px;padding:2px 0;font-size:11px;color:#999">' +
          '<span style="width:18px;text-align:center;flex-shrink:0">' + ikon + '</span>' +
          '<span>' + l.mesaj + '</span></div>';
      });
    }

    contentHtml += '</div>';
  });

  list.innerHTML = filtreBtnHtml + gruplamaHtml + contentHtml;
}

// Global filtre/gruplama değiştirme
window._activityData = null;
function setFiltre(f) {
  aktifFiltre = f;
  reloadActivityView();
}
function setGruplama(g) {
  aktifGruplama = g;
  reloadActivityView();
}
async function reloadActivityView() {
  if (!window._activityData) {
    const token = getToken();
    const resp = await fetch(API_BASE + '/api/game/activity', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await resp.json();
    window._activityData = data.gunler || [];
  }
  renderActivity(window._activityData);
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) return;
  const loading = document.getElementById('activity-loading');
  const list = document.getElementById('activity-list');
  const empty = document.getElementById('activity-empty');
  if (loading) loading.style.display = 'block';
  try {
    const resp = await fetch(API_BASE + '/api/game/activity', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await resp.json();
    if (loading) loading.style.display = 'none';
    if (!data.gunler?.length) { if (empty) empty.style.display = 'block'; return; }
    window._activityData = data.gunler;
    if (list) { list.style.display = 'block'; renderActivity(data.gunler); }
  } catch(e) {
    if (loading) { loading.style.display = 'block'; loading.innerText = 'Baglanti hatasi.'; }
  }
});
