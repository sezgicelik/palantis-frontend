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

document.addEventListener('DOMContentLoaded', () => {
  loadTakvimHome();
});
