/* ══════════════════════════════════
   SEHIRDE OLANLAR — Aktivite Logu
   Extracted from index.html
══════════════════════════════════ */

const ACTIVITY_ICONS = {
  isci_uretim: '\u2692\ufe0f',
  bina_tamam:  '\ud83c\udfd7\ufe0f',
  egitim_tamam:'\u2694\ufe0f',
  pisirme:     '\ud83d\udd25',
  nufus:       '\ud83d\udc65',
  yemek:       '\ud83c\udf7d\ufe0f',
  bina_uretim: '\ud83d\udd25',
  maas:        '\ud83d\udcb0',
};

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
      const gunSayisi = data.gunler.length;
      list.innerHTML = `<p style="color:#444;font-size:11px;margin-bottom:16px">Son ${gunSayisi} Palantis gunu gosteriliyor</p>` +
      data.gunler.map(g => `
        <div style="margin-bottom:24px">
          <div style="color:#c8a96e;font-family:'Cinzel',serif;font-size:13px;
               border-bottom:1px solid #2a2a1a;padding-bottom:6px;margin-bottom:10px;
               display:flex;justify-content:space-between;align-items:center">
            <span>${g.tarih}</span>
            <span style="font-size:10px;color:#333">${g.loglar.length} olay</span>
          </div>
          ${g.loglar.map(l => `
            <div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #111;font-size:12px;color:#bbb">
              <span style="width:20px;text-align:center;flex-shrink:0">${ACTIVITY_ICONS[l.event_type]||'\u2022'}</span>
              <span>${l.mesaj}</span>
            </div>
          `).join('')}
        </div>
      `).join('');
    }
  } catch(e) {
    if (loading) { loading.style.display='block'; loading.innerText='Baglanti hatasi.'; }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadActivity();
});
