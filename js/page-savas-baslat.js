/* ═══════════════════════════════════════════════════════
   NOXARA — SAVAŞ BAŞLAT SAYFA JS (v1.9.2)
   js/page-savas-baslat.js
═══════════════════════════════════════════════════════ */

let _sbHedef = null;       // { id, kral, sehir, koord_x, koord_y }
let _sbSure = null;        // { ham_sure, efektif_sure, hiz_bonus, mesafe }
let _sbOrdular = [];       // armies listesi
let _sbHareketTimer = null;

// ── Sayfa init ──
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadGameData === 'function') await loadGameData();
  sbOrdulariYukle();
  sbHareketleriYukle();

  // 60 saniyede bir otomatik güncelle
  _sbHareketTimer = setInterval(sbHareketleriYukle, 60000);
});

// ══════════════════════════════════
//   HEDEF ARAMA
// ══════════════════════════════════

let _sbAramaTimeout = null;
function sbHedefAra() {
  const val = document.getElementById('sb-hedef-ara').value.trim();
  if (val.length < 2) {
    document.getElementById('sb-arama-sonuc').style.display = 'none';
    return;
  }

  clearTimeout(_sbAramaTimeout);
  _sbAramaTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/player/ara?isim=${encodeURIComponent(val)}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('palantis_token') }
      });
      if (!res.ok) return;
      const data = await res.json();

      const wrap = document.getElementById('sb-arama-sonuc');
      if (!data.length) {
        wrap.innerHTML = '<div style="color:#666;padding:8px">Sonuc bulunamadi</div>';
        wrap.style.display = 'block';
        return;
      }

      // API: { id, kullanici_adi, koord_x, koord_y, cag, taraf, irk }
      wrap.innerHTML = data.slice(0, 10).map(p => {
        const pData = JSON.stringify({ id: p.id, kral: p.kullanici_adi, koord_x: p.koord_x, koord_y: p.koord_y, irk: p.irk, taraf: p.taraf }).replace(/'/g, "&#39;");
        return `
        <div class="hareket-card" style="cursor:pointer;padding:8px 12px;margin-bottom:4px"
             onclick='sbHedefSec(${pData})'>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:#f0e8d8;font-weight:600">${p.kullanici_adi || 'Bilinmeyen'}</span>
            <span style="color:#888;font-size:12px">${p.koord_x || '?'}:${p.koord_y || '?'}</span>
          </div>
          <div style="color:#666;font-size:11px">${p.irk || ''} — ${p.taraf || ''}</div>
        </div>`;
      }).join('');
      wrap.style.display = 'block';
    } catch(e) {
      console.error('Arama hata:', e);
    }
  }, 300);
}

async function sbHedefSec(player) {
  _sbHedef = player;
  document.getElementById('sb-arama-sonuc').style.display = 'none';
  document.getElementById('sb-hedef-ara').value = player.kral || player.sehir || '';

  // Hedef bilgi kartını göster
  document.getElementById('sb-hedef-bilgi').style.display = 'block';
  document.getElementById('sb-hedef-isim').textContent = player.kral || player.sehir || 'Bilinmeyen';
  document.getElementById('sb-hedef-koord').textContent = `${player.koord_x}:${player.koord_y}`;

  // Süre hesapla
  await sbSureHesapla(player.id);
  sbGonderBtnGuncelle();
}

function sbHedefTemizle() {
  _sbHedef = null;
  _sbSure = null;
  document.getElementById('sb-hedef-ara').value = '';
  document.getElementById('sb-arama-sonuc').style.display = 'none';
  document.getElementById('sb-hedef-bilgi').style.display = 'none';
  sbGonderBtnGuncelle();
}

// ══════════════════════════════════
//   SÜRE HESAPLAMA
// ══════════════════════════════════

async function sbSureHesapla(hedefPlayerId) {
  try {
    const res = await fetch(`${API_BASE}/api/savas/sure-hesapla?hedefPlayerId=${hedefPlayerId}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('palantis_token') }
    });
    if (!res.ok) {
      const err = await res.json();
      document.getElementById('sb-ham-sure').textContent = 'Hata';
      return;
    }
    const data = await res.json();
    _sbSure = data;

    document.getElementById('sb-hedef-mesafe').textContent = `${data.mesafe} birim`;
    document.getElementById('sb-ham-sure').textContent = `${data.ham_sure} PG`;
    document.getElementById('sb-hiz-bonus').textContent = data.hiz_bonus > 0
      ? `%${data.hiz_bonus} hiz`
      : 'Yok';
    document.getElementById('sb-hiz-bonus').style.color = data.hiz_bonus > 0 ? '#27ae60' : '#666';
    document.getElementById('sb-efektif-sure').textContent = `${data.efektif_sure} PG`;
  } catch(e) {
    console.error('Sure hesapla hata:', e);
  }
}

// ══════════════════════════════════
//   ORDU SEÇİMİ
// ══════════════════════════════════

async function sbOrdulariYukle() {
  try {
    const res = await fetch(`${API_BASE}/api/army/state`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('palantis_token') }
    });
    if (!res.ok) return;
    const data = await res.json();
    _sbOrdular = data.armies || [];

    const sel = document.getElementById('sb-ordu-select');
    sel.innerHTML = '<option value="">-- Ordu Sec --</option>';

    _sbOrdular.forEach(a => {
      const busy = a.is_busy ? ' (Gorevde)' : '';
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.isim || 'Ordu #' + a.id} — ${a.total_units || 0} unite${busy}`;
      opt.disabled = a.is_busy;
      sel.appendChild(opt);
    });
  } catch(e) {
    console.error('Ordulari yukle hata:', e);
  }
}

function sbOrduDegisti() {
  const sel = document.getElementById('sb-ordu-select');
  const armyId = parseInt(sel.value);
  const ordu = _sbOrdular.find(a => a.id === armyId);
  const detay = document.getElementById('sb-ordu-detay');

  if (ordu) {
    detay.innerHTML = `<span style="color:#c8a96e">${ordu.total_units || 0}</span> unite | ` +
      `ATK: <span style="color:#e74c3c">${ordu.atk || 0}</span> | ` +
      `DEF: <span style="color:#3498db">${ordu.def || 0}</span>`;
  } else {
    detay.innerHTML = '';
  }
  sbGonderBtnGuncelle();
}

function sbGonderBtnGuncelle() {
  const btn = document.getElementById('sb-gonder-btn');
  const armyId = parseInt(document.getElementById('sb-ordu-select').value);
  const ordu = _sbOrdular.find(a => a.id === armyId);
  const hazir = _sbHedef && ordu && !ordu.is_busy && _sbSure;
  btn.disabled = !hazir;
  btn.style.opacity = hazir ? '1' : '0.4';
}

// ══════════════════════════════════
//   ORDU GÖNDER
// ══════════════════════════════════

async function sbOrduGonder() {
  if (!_sbHedef) return showToast('Hedef seciniz', 'error');
  const armyId = parseInt(document.getElementById('sb-ordu-select').value);
  if (!armyId) return showToast('Ordu seciniz', 'error');

  const btn = document.getElementById('sb-gonder-btn');
  btn.disabled = true;
  btn.textContent = 'Gonderiliyor...';

  try {
    const res = await fetch(`${API_BASE}/api/savas/saldir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('palantis_token'),
      },
      body: JSON.stringify({ orduId: armyId, hedefPlayerId: _sbHedef.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Hata', 'error');
      btn.disabled = false;
      btn.textContent = 'Orduyu Gonder';
      return;
    }

    showToast(`${data.mesaj} Tahmini varis: ${data.efektif_sure} PG`, 'success');

    // UI guncelle
    sbHedefTemizle();
    sbOrdulariYukle();
    sbHareketleriYukle();
    btn.textContent = 'Orduyu Gonder';
  } catch(e) {
    showToast('Sunucu hatasi', 'error');
    btn.disabled = false;
    btn.textContent = 'Orduyu Gonder';
  }
}

// ══════════════════════════════════
//   AKTİF HAREKETLER
// ══════════════════════════════════

async function sbHareketleriYukle() {
  const wrap = document.getElementById('sb-hareketler');
  try {
    const res = await fetch(`${API_BASE}/api/savas/hareketler`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('palantis_token') }
    });
    if (!res.ok) {
      wrap.innerHTML = '<span style="color:#666">Yuklenemedi</span>';
      return;
    }
    const hareketler = await res.json();

    if (!hareketler.length) {
      wrap.innerHTML = '<span style="color:#555">Aktif hareket yok</span>';
      return;
    }

    wrap.innerHTML = hareketler.map(h => {
      const tipIcon = h.tip.startsWith('donus_') ? '🏠' : (h.tip === 'koloni' ? '🏰' : '⚔️');
      const tipLabel = h.tip.startsWith('donus_') ? 'Donus' : (h.tip === 'koloni' ? 'Koloni' : 'Saldiri');
      const hedefStr = h.hedef_kral || h.hedef_sehir || h.hedef_koord || '—';
      const yuzde = h.ilerleme_yuzde;
      const barRenk = h.tip.startsWith('donus_') ? '#27ae60' : '#e74c3c';

      return `
        <div class="hareket-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="color:#f0e8d8;font-weight:600">${tipIcon} ${tipLabel} → ${hedefStr}</span>
            <span style="color:#888;font-size:11px">${h.ordu_isim}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <div class="hareket-progress" style="flex:1">
              <div class="hareket-progress-bar" style="width:${yuzde}%;background:${barRenk}"></div>
            </div>
            <span style="color:#c8a96e;font-size:12px;min-width:36px">${yuzde}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:#666;font-size:11px">
              Kalan: ${h.kalan_saat} PG | Sure: ${h.efektif_sure} PG
              ${h.hiz_bonus > 0 ? ` | Hiz: %${h.hiz_bonus}` : ''}
            </span>
            ${h.iptal_edilebilir ? `<button class="btn ghost" style="font-size:10px;padding:2px 10px" onclick="sbGorevIptal(${h.id})">Iptal</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch(e) {
    wrap.innerHTML = '<span style="color:#666">Hata</span>';
    console.error('Hareketler hata:', e);
  }
}

async function sbGorevIptal(gorevId) {
  if (!confirm('Bu gorevi iptal etmek istediginize emin misiniz? Ordu geri donecektir.')) return;

  try {
    const res = await fetch(`${API_BASE}/api/savas/iptal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('palantis_token'),
      },
      body: JSON.stringify({ gorevId }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Iptal hatasi', 'error');
      return;
    }
    showToast(data.mesaj || 'Gorev iptal edildi', 'success');
    sbHareketleriYukle();
    sbOrdulariYukle();
  } catch(e) {
    showToast('Sunucu hatasi', 'error');
  }
}
