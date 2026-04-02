/* ══════════════════════════════════
   PAGE-FESTIVAL — Festival düzenleme
   v1.2.4
══════════════════════════════════ */

const FEST_IKONLAR = {
  kucuk: '🎪',
  buyuk: '🎊',
  kraliyet: '👑'
};
const FEST_RENKLER = {
  kucuk: '#2ecc71',
  buyuk: '#e67e22',
  kraliyet: '#9b59b6'
};

async function loadFestival() {
  const token = getToken();
  if (!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/game/festival', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) return;
    const data = await resp.json();
    renderFestival(data);
  } catch (e) {
    document.getElementById('fest-cards').innerHTML =
      '<div style="color:#e74c3c;text-align:center;padding:40px">Bağlantı hatası.</div>';
  }
}

function renderFestival(data) {
  // Üst bar
  const moralEl = document.getElementById('fest-moral');
  const maksEl = document.getElementById('fest-moral-maks');
  const altinEl = document.getElementById('fest-altin');
  const ekmekEl = document.getElementById('fest-ekmek');

  if (moralEl) moralEl.textContent = data.sehir_morali;
  if (maksEl) maksEl.textContent = data.moral_maks;
  if (altinEl) altinEl.textContent = (data.kaynaklar?.altin || 0).toLocaleString('tr-TR');
  if (ekmekEl) ekmekEl.textContent = (data.kaynaklar?.ekmek || 0).toLocaleString('tr-TR');

  // Moral rengi
  if (moralEl) {
    const yuzde = data.sehir_morali / data.moral_maks;
    moralEl.style.color = yuzde >= 0.5 ? '#2ecc71' : yuzde >= 0.25 ? '#e67e22' : '#e74c3c';
  }

  // Takvim
  const takvimEl = document.getElementById('fest-takvim');
  if (takvimEl && data.takvim) {
    takvimEl.textContent = `Palantis Takvimi: ${data.takvim.gun}. gün, ${data.takvim.ay}. ay, ${data.takvim.yil}. yıl`;
  }

  // Festival kartları
  const container = document.getElementById('fest-cards');
  if (!container) return;

  container.innerHTML = data.festivaller.map(f => {
    const ikon = FEST_IKONLAR[f.id] || '🎉';
    const renk = FEST_RENKLER[f.id] || '#c8a96e';
    const yetersizAltin = (data.kaynaklar?.altin || 0) < f.altin;
    const yetersizEkmek = (data.kaynaklar?.ekmek || 0) < f.ekmek;
    const cooldownAktif = f.cooldown_kalan > 0;
    const disabled = !f.kullanilabilir;

    return `
      <div class="card" style="border:1px solid ${disabled ? '#222' : renk + '44'};padding:20px;
           opacity:${disabled ? '0.6' : '1'};transition:.3s">
        <div style="font-size:28px;margin-bottom:8px">${ikon}</div>
        <div style="font-family:'Cinzel',serif;font-size:15px;color:${renk};font-weight:700;margin-bottom:12px">
          ${f.isim}
        </div>

        <div style="font-size:12px;color:#888;margin-bottom:12px;line-height:1.8">
          <div>💰 <b>${f.altin.toLocaleString('tr-TR')}</b> altın
            ${yetersizAltin ? '<span style="color:#e74c3c;font-size:10px"> (yetersiz)</span>' : ''}</div>
          <div>🍞 <b>${f.ekmek.toLocaleString('tr-TR')}</b> ekmek
            ${yetersizEkmek ? '<span style="color:#e74c3c;font-size:10px"> (yetersiz)</span>' : ''}</div>
          <div style="color:${renk};margin-top:4px">😊 +${f.moral_bonus} şehir morali</div>
        </div>

        ${cooldownAktif
          ? `<div style="color:#e67e22;font-size:11px;margin-bottom:10px">
               ⏳ ${f.cooldown_kalan} gün bekleme süresi
             </div>`
          : ''}

        <button class="btn-action" style="width:100%;padding:8px 0;font-size:12px;
          ${disabled ? 'opacity:0.4;cursor:not-allowed;' : ''}"
          ${disabled ? 'disabled' : `onclick="festivalBaslat('${f.id}','${f.isim}')"`}>
          ${cooldownAktif ? '⏳ Bekleniyor' : disabled ? '❌ Yetersiz Kaynak' : '🎉 Festival Düzenle'}
        </button>

        <div style="font-size:10px;color:#444;margin-top:8px;text-align:center">
          Cooldown: ${f.cooldown} Palantis günü
        </div>
      </div>
    `;
  }).join('');
}

async function festivalBaslat(tip, isim) {
  if (!confirm(`${isim} düzenlemek istediğinize emin misiniz?`)) return;
  const token = getToken();
  if (!token) return;
  try {
    const resp = await fetch(API_BASE + '/api/game/festival', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tip })
    });
    const data = await resp.json();
    if (!resp.ok) {
      showToast(data.error || 'Hata oluştu', 'error');
      return;
    }
    showToast(`${data.festival} düzenlendi! Moral +${data.moral_bonus}`, 'success');
    // Sayfayı yenile
    loadFestival();
    // HUD güncelle
    if (typeof loadGameData === 'function') loadGameData();
  } catch (e) {
    showToast('Bağlantı hatası', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof loadGameData === 'function') {
    loadGameData().then(loadFestival).catch(loadFestival);
  } else {
    setTimeout(loadFestival, 2000);
  }
});
