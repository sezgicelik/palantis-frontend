/* ══════════════════════════════════
   ANA EKRAN — Palantis Tarihi + Aktivite Ozeti
   Extracted from index.html
══════════════════════════════════ */

async function loadTakvimHome() {
  // Gercek saat goster
  const now = new Date();
  const saatStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  const saatEl = document.getElementById('home-real-saat');
  if (saatEl) saatEl.innerText = saatStr;

  // Palantis tarihi
  try {
    const resp = await fetch(API_BASE + '/api/takvim');
    if (resp.ok) {
      const t = await resp.json();
      const AYLAR = ['','Ocak','Subat','Mart','Nisan','Mayis','Haziran','Temmuz','Agustos','Eylul','Ekim','Kasim','Aralik'];
      const tarihStr = `${t.palantis_gun} ${AYLAR[t.palantis_ay]||t.palantis_ay} ${t.palantis_yil}`;
      const tarihEl = document.getElementById('home-tarih');
      if (tarihEl) tarihEl.innerText = tarihStr;
      const hudEl = document.getElementById('hud-takvim');
      if (hudEl) hudEl.innerText = tarihStr;
    }
  } catch(e) {}

  // Bugunku aktivite ozeti
  const token = getToken();
  const actEl = document.getElementById('home-activity');
  if (!token || !actEl) { if(actEl) actEl.innerHTML='<span style="color:#333">Giris yapinca gorunur.</span>'; return; }
  try {
    const resp2 = await fetch(API_BASE + '/api/game/activity', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp2.ok) { actEl.innerHTML='<span style="color:#333">\u2014</span>'; return; }
    const data = await resp2.json();
    const bugun = data.gunler?.[0];
    if (!bugun || !bugun.loglar?.length) {
      actEl.innerHTML = '<span style="color:#333">Bu gun icin henuz kayit yok.</span>';
      return;
    }
    actEl.innerHTML = bugun.loglar.slice(0,6).map(l =>
      `<div>${ACTIVITY_ICONS[l.event_type]||'\u2022'} ${l.mesaj}</div>`
    ).join('') +
    (bugun.loglar.length > 6
      ? `<div style="color:#444;margin-top:4px">+${bugun.loglar.length-6} daha... <a href="activity.html" style="color:#c8a96e">Tumunu gor</a></div>`
      : '');
  } catch(e) {
    actEl.innerHTML = '<span style="color:#333">\u2014</span>';
  }
}

// HUD saatini canli guncelle (1 dakikada bir)
setInterval(()=>{
  const now=new Date();
  const el=document.getElementById('home-real-saat');
  if(el) el.innerText=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
}, 60000);

// Duyurular yukle
async function loadDuyurular() {
  const el = document.getElementById('home-duyurular'); if (!el) return;
  try {
    const r = await fetch(API_BASE + '/api/game/duyurular');
    const data = await r.json();
    if (!data.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = data.map(d =>
      `<div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-left:3px solid #c9a84c;border-radius:4px;padding:8px 12px;margin-bottom:6px">
        <div style="font-family:Cinzel,serif;font-size:11px;color:#c9a84c;font-weight:bold">📢 ${d.baslik}</div>
        <div style="font-size:10px;color:#999;margin-top:3px">${d.mesaj}</div>
        <div style="font-size:8px;color:#555;margin-top:2px">${new Date(d.created_at).toLocaleString('tr-TR')}</div>
      </div>`
    ).join('');
  } catch(e) { el.style.display = 'none'; }
}

/* ══════════════════════════════════
   SEHIR GORUNUMU — v1.13.8 (izometrik bina karti)
══════════════════════════════════ */
const HOME_BINA_META = {
  // ad + ikon SVG rengi (rol bazli). Admin panelinde aciklama degisebilir, biz sadece adet gosteriyoruz.
  oduncu:{ad:'Oduncu',col:'#4a8a3a',ico:'🪓'}, kereste_atolyesi:{ad:'Kereste Atolyesi',col:'#8a6034',ico:'🏭'},
  tarla:{ad:'Tarla',col:'#b0a030',ico:'🌾'}, ciftlik:{ad:'Ciftlik',col:'#906040',ico:'🐄'},
  balikci:{ad:'Balikci',col:'#4080a0',ico:'🎣'}, isleme:{ad:'Isleme',col:'#a06030',ico:'⚙️'},
  ocak:{ad:'Ocak',col:'#c06020',ico:'🔥'}, firin:{ad:'Firin',col:'#c08040',ico:'🍞'},
  surlar:{ad:'Surlar',col:'#6a6a7a',ico:'🧱'}, ev:{ad:'Ev',col:'#8a6040',ico:'🏠'},
  koy:{ad:'Koy',col:'#a08050',ico:'🏘️'}, kasaba:{ad:'Kasaba',col:'#9a7040',ico:'🏛️'},
  pazar:{ad:'Pazar',col:'#b08030',ico:'💰'}, ahir:{ad:'Ahir',col:'#704020',ico:'🐴'},
  lonca:{ad:'Lonca',col:'#6040a0',ico:'🗡️'}, buyulu_tarla:{ad:'Buyulu Tarla',col:'#a040a0',ico:'🌸'},
  buyu_kulesi:{ad:'Buyu Kulesi',col:'#8050c0',ico:'🔮'}, kule:{ad:'Kule',col:'#7a7a7a',ico:'🗼'},
  magara:{ad:'Magara',col:'#505050',ico:'⛰️'}, istihbarat:{ad:'Istihbarat',col:'#606060',ico:'🕵️'},
  akademi:{ad:'Akademi',col:'#5080c0',ico:'🎓'}, sehir_meydani:{ad:'Sehir Meydani',col:'#d4af37',ico:'⛲'},
  guild_binasi:{ad:'Guild Binasi',col:'#9b59b6',ico:'🏰'},
  rathe_tapinagi:{ad:'Rathe Tapinagi',col:'#d0a040',ico:'⛪'},
  xegony_tapinagi:{ad:'Xegony Tapinagi',col:'#d04040',ico:'⛪'},
  fennin_tapinagi:{ad:'Fennin Tapinagi',col:'#4040d0',ico:'⛪'},
  tunare_tapinagi:{ad:'Tunare Tapinagi',col:'#40d040',ico:'⛪'},
  okul:{ad:'Okul',col:'#5080b0',ico:'📚'}, universite:{ad:'Universite',col:'#4060a0',ico:'🎓'},
  kutuphane:{ad:'Kutuphane',col:'#806040',ico:'📖'}, tiyatro:{ad:'Tiyatro',col:'#a04060',ico:'🎭'},
  arena:{ad:'Arena',col:'#a03030',ico:'🏟️'}, asma_bahceler:{ad:'Asma Bahceler',col:'#60a060',ico:'🌿'},
  muze:{ad:'Muze',col:'#806020',ico:'🏛️'}, noxara_hani:{ad:'Noxara Hani',col:'#b07030',ico:'🏨'},
  taverna:{ad:'Taverna',col:'#c08050',ico:'🍺'}
};

function homeBinaSVG(col) {
  return '<svg width="42" height="38" viewBox="0 0 42 38">' +
    '<polygon points="21,3 38,14 38,30 21,37 4,30 4,14" fill="' + col + '" opacity="0.9"/>' +
    '<polygon points="21,3 38,14 21,22 4,14" fill="' + col + '" opacity="1"/>' +
    '<polygon points="38,14 38,30 21,37 21,22" fill="rgba(0,0,0,0.25)"/>' +
    '<rect x="16" y="24" width="5" height="8" fill="rgba(0,0,0,0.55)"/>' +
    '<rect x="10" y="18" width="3" height="4" fill="rgba(0,0,0,0.5)"/>' +
    '<rect x="24" y="18" width="3" height="4" fill="rgba(0,0,0,0.5)"/>' +
    '</svg>';
}

async function loadSehirGorunum() {
  const grid = document.getElementById('home-sehir-grid');
  if (!grid) return;
  const token = getToken();
  if (!token) { grid.innerHTML = '<div style="grid-column:1/-1;color:#444;font-size:11px;text-align:center;padding:20px 0">Giris yapinca gorunur.</div>'; return; }
  try {
    const resp = await fetch(API_BASE + '/api/game/buildings', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { grid.innerHTML = '<div style="grid-column:1/-1;color:#444">Yuklenemedi</div>'; return; }
    const buildings = await resp.json();
    const aktif = [];
    let toplam = 0;
    for (const [id, data] of Object.entries(buildings)) {
      const lv = parseInt(data.seviye) || 0;
      if (lv <= 0) continue;
      aktif.push({ id, lv });
      toplam += lv;
    }
    // En cok olan en basta
    aktif.sort((a,b) => b.lv - a.lv);
    document.getElementById('hsc-total').textContent = toplam;
    document.getElementById('hsc-tip').textContent = aktif.length;
    const alanEl = document.getElementById('hud-used');
    const alanBox = document.getElementById('hud-alan-box');
    document.getElementById('hsc-alan').textContent = alanBox?.textContent || (alanEl?.textContent || '—');
    if (!aktif.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;color:#444;font-size:11px;text-align:center;padding:20px 0">Henuz bina yok — <a href="city.html" style="color:#c8a96e">sehrinde</a> ilk binalari insa et.</div>';
      return;
    }
    grid.innerHTML = aktif.map(function(b) {
      const meta = HOME_BINA_META[b.id] || { ad: b.id, col: '#8a6034', ico: '🏗️' };
      return '<a href="city.html" title="' + meta.ad + ' · ' + b.lv + ' adet" ' +
        'style="display:flex;flex-direction:column;align-items:center;text-decoration:none;padding:6px 4px;border-radius:4px;background:rgba(20,14,6,0.6);border:1px solid rgba(138,98,24,0.15);transition:all .15s;cursor:pointer" ' +
        'onmouseover="this.style.borderColor=\'#c9a020\';this.style.background=\'rgba(40,28,10,0.8)\'" ' +
        'onmouseout="this.style.borderColor=\'rgba(138,98,24,0.15)\';this.style.background=\'rgba(20,14,6,0.6)\'">' +
        '<div style="position:relative;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7))">' + homeBinaSVG(meta.col) +
          '<span style="position:absolute;top:-3px;right:-5px;background:#d4af37;color:#1a1005;font:bold 9px Cinzel,serif;min-width:18px;height:16px;border-radius:8px;padding:0 4px;display:flex;align-items:center;justify-content:center;border:1px solid #f0d050">' + b.lv + '</span>' +
        '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:9px;color:#c8a96e;margin-top:4px;text-align:center;letter-spacing:.3px">' + meta.ad + '</div>' +
        '</a>';
    }).join('');
  } catch(e) {
    grid.innerHTML = '<div style="grid-column:1/-1;color:#a33;font-size:10px">Baglanti hatasi</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTakvimHome();
  setTimeout(loadDuyurular, 400);
  setTimeout(loadSehirGorunum, 600);
});
