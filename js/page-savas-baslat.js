/* ═══════════════════════════════════════════════════════
   NOXARA — SAVAŞ BAŞLAT SAYFA JS (v1.9.3)
   js/page-savas-baslat.js
   v1.9.3: Relay saldırı desteği
═══════════════════════════════════════════════════════ */

let _sbHedef = null;       // { id, kral, sehir, koord_x, koord_y }
let _sbSure = null;        // { ham_sure, efektif_sure, hiz_bonus, mesafe }
let _sbOrdular = [];       // armies listesi
let _sbHareketTimer = null;
let _sbRelayArmyId = null; // v1.9.3: relay saldırı için army ID

// ── Sayfa init ──
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadGameData === 'function') await loadGameData();

  // v1.9.3: Relay mode check (army.html'den yönlendirme)
  const params = new URLSearchParams(window.location.search);
  const relayId = params.get('relay');
  if (relayId) {
    _sbRelayArmyId = parseInt(relayId);
  }

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

      // v1.13.55: Zenginlestirilmis kart — cag, kubbe, tatil, deger araligi, saldiri uygun mu
      wrap.innerHTML = data.slice(0, 10).map(p => {
        const pData = JSON.stringify({ id: p.id, kral: p.kullanici_adi, koord_x: p.koord_x, koord_y: p.koord_y, irk: p.irk, taraf: p.taraf }).replace(/'/g, "&#39;");
        const uygun = p.saldiri_uygun !== false;
        const opacity = uygun ? '1' : '0.55';
        const cursor = uygun ? 'pointer' : 'not-allowed';
        const onclick = uygun ? `onclick='sbHedefSec(${pData})'` : `onclick='showToast("Saldiri uygun degil: ${(p.red_sebebi||"").replace(/"/g,"&quot;")}", "error")'`;
        const borderColor = uygun ? '#3a3a3a' : '#c0392b';

        // Cag rozeti — 1. cag kirmizi, digerleri gri
        const cagRenk = (p.cag === 1) ? '#c0392b' : '#5a8fcb';
        const cagRozet = `<span style="background:${cagRenk};color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600">C${p.cag||'?'}</span>`;

        // Durum ikonlari
        const ikonlar = [];
        if (p.tatil_modu) ikonlar.push('<span title="Tatil modunda" style="color:#f39c12">🏖️</span>');
        if (p.kubbe_aktif) ikonlar.push('<span title="Gorunmez Kubbe aktif" style="color:#9b59b6">🛡️</span>');
        if (p.cag === 1) ikonlar.push('<span title="1. Cag koruma" style="color:#c0392b">🔒</span>');
        if (p.deger_araligi && !p.deger_araligi.gecerli) ikonlar.push(`<span title="Deger araligi disi: ${p.deger_araligi.alt}-${p.deger_araligi.ust}" style="color:#e67e22">⚖️</span>`);

        const redMsg = uygun ? '' : `<div style="color:#e74c3c;font-size:10px;margin-top:3px">⛔ ${p.red_sebebi || 'Saldiri uygun degil'}</div>`;
        const degerStr = p.sehir_deger != null ? `Deger: ${p.sehir_deger.toLocaleString('tr-TR')}` : '';

        return `
        <div class="hareket-card" style="cursor:${cursor};padding:8px 12px;margin-bottom:4px;opacity:${opacity};border-left:3px solid ${borderColor}"
             ${onclick}>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <span style="color:#f0e8d8;font-weight:600">${p.kullanici_adi || 'Bilinmeyen'}</span>
            <span style="display:flex;gap:4px;align-items:center">
              ${cagRozet}
              ${ikonlar.join('')}
              <span style="color:#888;font-size:12px">${p.koord_x || '?'}:${p.koord_y || '?'}</span>
            </span>
          </div>
          <div style="color:#888;font-size:11px;margin-top:2px">${p.irk || ''} — ${p.taraf || ''} · ${degerStr}</div>
          ${redMsg}
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
    // v1.9.3: Relay army ise kaynakX parametresi ekle
    let url = `${API_BASE}/api/savas/sure-hesapla?hedefPlayerId=${hedefPlayerId}`;
    const armyId = parseInt(document.getElementById('sb-ordu-select').value);
    const ordu = _sbOrdular.find(a => a.id === armyId);
    if (ordu && ordu.takviye && ordu.konum_tipi === 'korumada') {
      url += `&kaynakX=${ordu.takviye.konum_x}`;
    }
    const res = await fetch(url, {
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
      const konum = a.konum_tipi === 'korumada' ? ' [Korumada]' : '';
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.isim || 'Ordu #' + a.id} — ${a.total_units || 0} unite${konum}${busy}`;
      opt.disabled = a.is_busy;
      sel.appendChild(opt);
    });

    // v1.9.3: Relay mode — otomatik ordu sec
    if (_sbRelayArmyId) {
      sel.value = _sbRelayArmyId;
      sbOrduDegisti();
    }
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
    let konumStr = '';
    if (ordu.konum_tipi === 'korumada' && ordu.takviye) {
      var tkLbl = ordu.takviye.hedef_kral || ordu.takviye.koloni_isim || 'Konuslandi';
      konumStr = ` | <span style="color:#9b59b6">📍 Korumada: ${tkLbl} (${ordu.takviye.konum_x}:${ordu.takviye.konum_y})</span>`;
    }
    detay.innerHTML = `<span style="color:#c8a96e">${ordu.total_units || 0}</span> unite | ` +
      `ATK: <span style="color:#e74c3c">${ordu.atk || 0}</span> | ` +
      `DEF: <span style="color:#3498db">${ordu.def || 0}</span>${konumStr}`;
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

  // v1.9.3: Relay mode buton metni
  const isRelay = ordu && ordu.konum_tipi === 'korumada';
  btn.textContent = isRelay ? 'Relay Saldiri' : 'Orduyu Gonder';
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

  // v1.9.3: Konuşlanan ordu ise relay endpoint kullan
  const ordu = _sbOrdular.find(a => a.id === armyId);
  const isRelay = ordu && ordu.konum_tipi === 'korumada';
  const endpoint = isRelay ? `${API_BASE}/api/takviye/rolu-saldir` : `${API_BASE}/api/savas/saldir`;

  try {
    const res = await fetch(endpoint, {
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
      btn.textContent = isRelay ? 'Relay Saldiri' : 'Orduyu Gonder';
      return;
    }

    showToast(`${data.mesaj} Tahmini varis: ${data.efektif_sure} PG`, 'success');

    // UI guncelle
    sbHedefTemizle();
    sbOrdulariYukle();
    sbHareketleriYukle();
    btn.textContent = isRelay ? 'Relay Saldiri' : 'Orduyu Gonder';
    // v1.13.58: HUD ordularim rozeti + kuyruk widget anlik yenile
    if (typeof window.refreshOrdularim === 'function') window.refreshOrdularim();
    if (typeof window.refreshKuyruk === 'function') window.refreshKuyruk();
  } catch(e) {
    showToast('Sunucu hatasi', 'error');
    btn.disabled = false;
    btn.textContent = isRelay ? 'Relay Saldiri' : 'Orduyu Gonder';
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
              <b style="color:#c8a96e">${Math.max(0, (h.efektif_sure||0) - (h.kalan_saat||0))}/${h.efektif_sure||0}</b> PG
              ${h.hiz_bonus > 0 ? ` · Hiz: %${h.hiz_bonus}` : ''}
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
