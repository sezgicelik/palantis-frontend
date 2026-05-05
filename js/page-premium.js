/* ══════════════════════════════════
   PREMIUM SAYFASI — v1.13.9
   Paket listele, satin al (odeme baslat), siparis gecmisi
══════════════════════════════════ */

const PAKET_LABEL = {
  bronz: { isim: 'Bronz', renk: '#cd7f32', ikon: '🥉' },
  gumus: { isim: 'Gümüş', renk: '#c0c0c0', ikon: '🥈' },
  altin_paket: { isim: 'Altın', renk: '#d4af37', ikon: '🥇' }
};

const BONUS_LABEL = {
  ekstra_ordu: 'Ekstra ordu', altin_bonus: 'Altın bonus %', odun_bonus: 'Odun bonus %',
  metal_bonus: 'Metal bonus %', islenmis_bonus: 'İşlenmiş bonus %',
  kereste_bonus: 'Kereste bonus %', max_vergi: 'Max vergi', koloni_bonus: 'Koloni bonus %',
  ekstra_kervan: 'Ekstra kervan'
};

async function loadPaketler() {
  const grid = document.getElementById('prem-paket-grid');
  const mevcutWrap = document.getElementById('prem-mevcut-wrap');
  if (!grid) return;
  const token = getToken();
  if (!token) { grid.innerHTML = '<div style="grid-column:1/-1;color:#555">Giris yapinca gorunur.</div>'; return; }

  try {
    const resp = await fetch(API_BASE + '/api/premium/paketler', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { grid.innerHTML = '<div style="grid-column:1/-1;color:#a33">Yuklenemedi</div>'; return; }
    const data = await resp.json();

    // Mevcut premium
    if (data.mevcut) {
      const m = data.mevcut;
      const paketL = PAKET_LABEL[m.paket] || { isim: m.paket, renk: '#888', ikon: '⚜' };
      mevcutWrap.innerHTML = `
        <div class="mevcut-prem">
          <h3>${paketL.ikon} Aktif Premium — ${paketL.isim}</h3>
          <div style="color:#aaa;font-size:12px;line-height:1.8">
            Baslangic: ${new Date(m.baslangic).toLocaleDateString('tr-TR')} ·
            Bitis: <b style="color:#d4af37">${new Date(m.bitis).toLocaleDateString('tr-TR')}</b> ·
            Kalan: <b style="color:${m.kalan_gun > 7 ? '#2ecc71' : '#f39c12'}">${m.kalan_gun} gun</b>
          </div>
        </div>`;
    } else {
      mevcutWrap.innerHTML = '';
    }

    // Paketler
    if (!data.paketler?.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;color:#555">Paket tanimli degil</div>';
      return;
    }
    grid.innerHTML = data.paketler.map(p => {
      const l = PAKET_LABEL[p.id] || { isim: p.id, renk: '#888', ikon: '⚜' };
      const fiyatStr = p.fiyat_try > 0
        ? `<span class="fiyat">${p.fiyat_try.toFixed(2)} <small style="font-size:14px;color:#888">TL</small></span>`
        : `<span class="fiyat" style="color:#888;font-size:14px">Fiyat tanimli degil</span>`;

      const bonusHtml = Object.entries(p.bonus || {}).map(([k, v]) => {
        const label = BONUS_LABEL[k] || k;
        return `<div>• <b>${label}:</b> ${v}</div>`;
      }).join('') || '<div style="color:#555">— bonus tanimsiz —</div>';

      const btnDisabled = !p.aktif || p.fiyat_try <= 0;
      const ribbon = p.id === 'altin_paket' ? '<div class="ribbon">EN IYISI</div>' : '';

      return `
        <div class="prem-paket ${p.id}">
          ${ribbon}
          <h2>${l.ikon} ${l.isim}</h2>
          ${fiyatStr}
          <div class="sure">${p.sure_gun} gun</div>
          <div class="bonus">${bonusHtml}</div>
          <button class="btn-sat" onclick="satinAl('${p.id}')" ${btnDisabled ? 'disabled' : ''}>
            ${btnDisabled ? 'Yakinda' : 'Satin Al'}
          </button>
        </div>`;
    }).join('');

    // Provider uyarisi
    if (!data.provider_hazir && data.paketler.some(p => p.fiyat_try > 0)) {
      grid.insertAdjacentHTML('afterbegin',
        `<div style="grid-column:1/-1;background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.3);padding:10px 14px;border-radius:4px;font-size:11px;color:#f39c12">
          ⚠️ Odeme saglayicisi henuz yapilandirilmadi. Siparis acilir, admin manuel onaylar.
        </div>`);
    }
  } catch (e) {
    grid.innerHTML = '<div style="grid-column:1/-1;color:#a33">Baglanti hatasi</div>';
  }
}

async function satinAl(paketId) {
  const token = getToken();
  if (!token) return showToast('Giris yap', 'error');
  const l = PAKET_LABEL[paketId] || { isim: paketId };
  if (!await noxConfirm(`${l.isim} paketi icin siparis olusturulsun mu?`)) return;
  try {
    const r = await fetch(API_BASE + '/api/premium/odeme-baslat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ paket: paketId })
    });
    const data = await r.json();
    if (!r.ok) return showToast(data.error || 'Hata', 'error');

    if (data.redirect_url) {
      // Provider entegrasyonu aktif — checkout sayfasina git
      window.location.href = data.redirect_url;
    } else {
      showToast(data.mesaj || `Siparis #${data.siparis_id} olusturuldu`, 'success');
      setTimeout(loadSiparisler, 500);
    }
  } catch (e) {
    showToast('Baglanti hatasi', 'error');
  }
}

async function loadSiparisler() {
  const wrap = document.getElementById('prem-siparisler');
  if (!wrap) return;
  const token = getToken();
  if (!token) { wrap.innerHTML = '<span style="color:#555">—</span>'; return; }
  try {
    const r = await fetch(API_BASE + '/api/premium/siparislerim', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) { wrap.innerHTML = '<span style="color:#a33">Yuklenemedi</span>'; return; }
    const data = await r.json();
    if (!data.siparisler?.length) {
      wrap.innerHTML = '<span style="color:#555;font-size:11px">Henuz siparis yok</span>';
      return;
    }
    wrap.innerHTML = `
      <table class="siparis-tbl">
        <thead><tr>
          <th>#</th><th>Paket</th><th>Fiyat</th><th>Sure</th><th>Provider</th><th>Durum</th><th>Tarih</th><th></th>
        </tr></thead>
        <tbody>
        ${data.siparisler.map(s => {
          const paket = PAKET_LABEL[s.paket] || { isim: s.paket, ikon: '⚜' };
          const fiyat = s.fiyat_try > 0 ? `${parseFloat(s.fiyat_try).toFixed(2)} TL` : '—';
          const iptalBtn = s.status === 'pending'
            ? `<button class="btn-action" style="padding:3px 8px;font-size:10px" onclick="iptalEt(${s.id})">Iptal</button>` : '';
          return `<tr>
            <td>${s.id}</td>
            <td>${paket.ikon} ${paket.isim}</td>
            <td>${fiyat}</td>
            <td>${s.sure_gun} gun</td>
            <td>${s.provider}</td>
            <td class="st-${s.status}">${s.status}</td>
            <td>${new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
            <td>${iptalBtn}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    wrap.innerHTML = '<span style="color:#a33">Baglanti hatasi</span>';
  }
}

async function iptalEt(siparisId) {
  if (!await noxConfirm(`Siparis #${siparisId} iptal edilsin mi?`)) return;
  const token = getToken();
  try {
    const r = await fetch(API_BASE + '/api/premium/iptal-siparis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ siparis_id: siparisId })
    });
    const data = await r.json();
    if (r.ok) { showToast('Iptal edildi', 'success'); loadSiparisler(); loadPaketler(); }
    else showToast(data.error || 'Hata', 'error');
  } catch (e) { showToast('Baglanti hatasi', 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { loadPaketler(); loadSiparisler(); }, 300);
});
