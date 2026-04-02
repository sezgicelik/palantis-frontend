/* ══════════════════════════════════
   WORSHIPPER & MANA SiSTEMi
   Tapinak bazli WS uretimi
   Rathe=Kirmizi, Xegony=Mavi, Fennin=Beyaz, Uras(Tunare)=Yesil
══════════════════════════════════ */

// Tapinak -> mana renk eslesmesi
const TAPINAK_RENK = {
  rathe_tapinagi:   'kirmizi',
  xegony_tapinagi:  'mavi',
  fennin_tapinagi:  'beyaz',
  tunare_tapinagi:  'yesil'
};

const WS_MALIYET_ALTIN = 1000;
const WS_SURE_PG = 4;
const WS_KAPASITE_PER_BINA = 200;

let WS_MIKTAR = 0;

function wsInit() {
  // Tapinakların bina seviyelerinden kapasite hesapla
  const toplamKapasite =
    (BLDGS.rathe_tapinagi?.lv || 0) * WS_KAPASITE_PER_BINA +
    (BLDGS.xegony_tapinagi?.lv || 0) * WS_KAPASITE_PER_BINA +
    (BLDGS.fennin_tapinagi?.lv || 0) * WS_KAPASITE_PER_BINA +
    (BLDGS.tunare_tapinagi?.lv || 0) * WS_KAPASITE_PER_BINA;

  const toplamWS = (population.worshipper || 0);
  const bosKoylu = Math.max(0, population.free || 0);

  setText('ws-total', toplamWS);
  setText('ws-kapasite', toplamKapasite);
  setText('ws-koylu', bosKoylu);
  setText('ws-altin', RES.altin || 0);

  // WS Dagilim (workers tablosundan)
  const wBeyaz = parseInt(population.worshipper_beyaz) || 0;
  const wKirmizi = parseInt(population.worshipper_kirmizi) || 0;
  const wMavi = parseInt(population.worshipper_mavi) || 0;
  const wYesil = parseInt(population.worshipper_yesil) || 0;
  setText('ws-beyaz', wBeyaz);
  setText('ws-kirmizi', wKirmizi);
  setText('ws-mavi', wMavi);
  setText('ws-yesil', wYesil);
  setText('ws-beyaz-mana', Math.floor(wBeyaz * 0.1));
  setText('ws-kirmizi-mana', Math.floor(wKirmizi * 0.1));
  setText('ws-mavi-mana', Math.floor(wMavi * 0.1));
  setText('ws-yesil-mana', Math.floor(wYesil * 0.1));

  // Mana degerler
  setText('mana-beyaz-val', Math.floor(RES.mana_beyaz || 0));
  setText('mana-kirmizi-val', Math.floor(RES.mana_kirmizi || 0));
  setText('mana-mavi-val', Math.floor(RES.mana_mavi || 0));
  setText('mana-yesil-val', Math.floor(RES.mana_yesil || 0));

  // Dropdown seceneklerini guncelle (bina yoksa disable)
  const select = document.getElementById('ws-tapinak-select');
  if (select) {
    Array.from(select.options).forEach(opt => {
      if (!opt.value) return;
      const binaLv = BLDGS[opt.value]?.lv || 0;
      opt.disabled = binaLv === 0;
      if (binaLv === 0) opt.textContent = opt.textContent.replace(/ \(.*\)$/, '') + ' (Bina yok!)';
    });
  }

  WS_MIKTAR = 0;
  setText('ws-miktar', 0);
  wsUpdateUI();
}

function wsUpdateUI() {
  const select = document.getElementById('ws-tapinak-select');
  const info = document.getElementById('ws-tapinak-info');
  const btn = document.getElementById('ws-uret-btn');
  if (!select || !info) return;

  const binaId = select.value;
  if (!binaId) {
    info.innerHTML = '<span style="color:#888">Üstten tapınak seçin.</span>';
    if (btn) btn.disabled = true;
    return;
  }

  const binaLv = BLDGS[binaId]?.lv || 0;
  const renk = TAPINAK_RENK[binaId] || 'beyaz';
  const binaAdi = BLDGS[binaId]?.name || binaId;
  const kapasite = binaLv * WS_KAPASITE_PER_BINA;
  const mevcutWS = parseInt(population['worshipper_' + renk]) || 0;
  const bos = kapasite - mevcutWS;

  if (binaLv === 0) {
    info.innerHTML = `<span style="color:#e74c3c">❌ ${binaAdi} inşa edilmemiş! Önce binayı inşa et.</span>`;
    if (btn) btn.disabled = true;
    return;
  }

  const renkEmoji = {beyaz:'🤍',kirmizi:'❤️',mavi:'💙',yesil:'💚'}[renk] || '🙏';
  info.innerHTML = `
    ${renkEmoji} <b>${binaAdi}</b> — ${renk.charAt(0).toUpperCase()+renk.slice(1)} Mana<br>
    Seviye: <b style="color:var(--race-color)">${binaLv}</b> ·
    Kapasite: <b>${kapasite}</b> WS ·
    Mevcut: <b>${mevcutWS}</b> ·
    Boş: <b style="color:#2ecc71">${bos}</b>
  `;

  const canProduce = bos > 0 && (population.free || 0) > 0 && (RES.altin || 0) >= WS_MALIYET_ALTIN;
  if (btn) btn.disabled = !canProduce || WS_MIKTAR < 1;

  // Maliyet goster
  setText('ws-maliyet', WS_MIKTAR * WS_MALIYET_ALTIN);
  setText('ws-koylu-gerek', WS_MIKTAR);
  setText('ws-sure', WS_SURE_PG);
}

function wsAdjust(delta) {
  const select = document.getElementById('ws-tapinak-select');
  if (!select?.value) { toast('Önce tapınak seç!'); return; }

  const binaId = select.value;
  const binaLv = BLDGS[binaId]?.lv || 0;
  const renk = TAPINAK_RENK[binaId] || 'beyaz';
  const kapasite = binaLv * WS_KAPASITE_PER_BINA;
  const mevcutWS = parseInt(population['worshipper_' + renk]) || 0;
  const bosSlot = kapasite - mevcutWS;
  const bosKoylu = Math.max(0, population.free || 0);
  const maxAltin = Math.floor((RES.altin || 0) / WS_MALIYET_ALTIN);
  const max = Math.min(bosSlot, bosKoylu, maxAltin);

  WS_MIKTAR = Math.max(0, Math.min(WS_MIKTAR + delta, max));
  setText('ws-miktar', WS_MIKTAR);
  wsUpdateUI();
}

async function wsUret() {
  if (WS_MIKTAR < 1) { toast('Miktar gir!'); return; }
  const select = document.getElementById('ws-tapinak-select');
  if (!select?.value) { toast('Tapınak seç!'); return; }

  const binaId = select.value;
  const renk = TAPINAK_RENK[binaId] || 'beyaz';
  const token = getToken();
  if (!token) { toast('Giriş yapmalısın!'); return; }

  const msg = document.getElementById('ws-msg');

  try {
    const resp = await fetch(API_BASE + '/api/game/worshipper/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ miktar: WS_MIKTAR, renk })
    });
    const data = await resp.json();
    if (!resp.ok) {
      if (msg) { msg.style.color = '#e74c3c'; msg.textContent = '⚠️ ' + (data.error || 'Hata'); }
      return;
    }
    if (msg) { msg.style.color = '#2ecc71'; msg.textContent = '✅ ' + WS_MIKTAR + ' ' + renk + ' Worshipper eğitim kuyruğuna eklendi! (' + WS_SURE_PG + ' P.G.)'; }
    WS_MIKTAR = 0;
    // Verileri yenile
    await loadGameData();
    wsInit();
    setTimeout(() => { if(msg) msg.textContent = ''; }, 5000);
  } catch(e) {
    if (msg) { msg.style.color = '#e74c3c'; msg.textContent = '⚠️ Bağlantı hatası'; }
  }
}

// Eski fonksiyon uyumluluk
function setWorshippers(n) { /* artik kullanilmiyor */ }

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(wsInit, 1500);
});
