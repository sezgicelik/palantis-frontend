/* =====================================================
   layout.js — Sidebar, HUD bar, Building Modal renderer
   Her sayfada initLayout() ile cagirilir
===================================================== */

// v1.14.1.51 (PWA): iOS Safari + Apple PWA meta taglari dinamik enjekte
//   Tum HTML sayfalarinda bu script yukleniyor — meta'lar bir kez eklenir.
(function _injectPwaMeta(){
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[name="apple-mobile-web-app-capable"]')) return; // zaten var
  const metas = [
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="Noxara">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="theme-color" content="#c8960c">',
    '<meta name="application-name" content="Noxara">',
    '<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png">',
    '<link rel="manifest" href="./manifest.json">',
  ];
  document.head.insertAdjacentHTML('beforeend', metas.join('\n'));
})();

function renderSidebar(){
  const mount = document.getElementById('sidebar-mount');
  if(!mount) return;

  // Mevcut sayfayi tespit et
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'home.html';

  function isActive(target){
    return page === target ? ' on' : '';
  }

  // Hamburger butonu ekle (mobil icin)
  if(!document.getElementById('hamburger-btn')){
    const hb = document.createElement('button');
    hb.id = 'hamburger-btn';
    hb.className = 'hamburger-btn';
    hb.innerHTML = '☰';
    hb.onclick = function(){ toggleMobileSidebar(); };
    document.body.prepend(hb);
  }
  // Overlay ekle
  if(!document.getElementById('sidebar-overlay')){
    const ov = document.createElement('div');
    ov.id = 'sidebar-overlay';
    ov.className = 'sidebar-overlay';
    ov.onclick = function(){ toggleMobileSidebar(); };
    document.body.prepend(ov);
  }

  // v1.14.0.49: 8 ana grup — temizlendi
  // Krallığım / Ordu & Savaş / Büyüler / Ticaret / Harita & Dünya / Sosyal & Eğlence
  // + Top-level: Guild, Raporlar (TEK link), Sıralamalar, Artifactlar, Görevler, Premium, Ayarlar
  const krallikPages = ['city.html','population.html','festival.html','land.html'];
  const ordusavasPages = ['army.html','mezarlik.html','casus.html','simulator.html'];
  const buyulerPages = ['magic.html','buyucu-kulesi.html'];
  const ticPages     = ['market.html','kervan.html','pazar.html','buyu-dukkani.html'];
  const dunyaPages   = ['map.html','cag.html'];
  // v1.14.1.54: Sidebar reorg — Sıralamalar -> Sosyal, Artifact -> Premium, IconMockup -> Ayarlar
  const sosyalPages  = ['meydan.html','bocek-yarisi.html','sandik.html','siralama.html'];
  const premiumPages = ['premium.html','artifact.html'];
  const ayarlarPages = ['ayarlar.html','icon-mockup.html'];

  const isKrallik  = krallikPages.includes(page);
  const isOrduSavas= ordusavasPages.includes(page);
  const isBuyuler  = buyulerPages.includes(page);
  const isTic      = ticPages.includes(page);
  const isDunya    = dunyaPages.includes(page);
  const isSosyal   = sosyalPages.includes(page);
  const isPremium  = premiumPages.includes(page);
  const isAyarlar  = ayarlarPages.includes(page);

  // Hizli Erisim pinli menuler (localStorage, max 5)
  let hizliMenuler = [];
  try {
    const raw = localStorage.getItem('noxara_hizli_menu');
    if (raw) hizliMenuler = (JSON.parse(raw) || []).slice(0, 5);
  } catch(e) {}

  mount.innerHTML = `
    <div class="sidebar" id="sidebar">
      <!-- v1.14.1.27: Sidebar uzerindeki NOXARA + Kral/Irk/Cag/Koord bloğu kaldirildi.
           Ayni bilgi home.html dashboard'unda gorunuyor (user talebi, duplikasyon). -->

      <a href="home.html" class="menu-item${isActive('home.html')}">🏠 Ana Ekran</a>

      ${hizliMenuler.length > 0 ? `
      <div style="padding:6px 14px 4px;font-size:11px;color:#666;letter-spacing:1.5px;border-top:1px solid #1a1a1a;margin-top:4px">★ HIZLI ERİŞİM</div>
      ${hizliMenuler.map(h => `<a href="${h.href}" class="menu-item${isActive(h.href)}" style="padding-left:18px;border-left:2px solid #d4af37;font-size:12px">${h.icon||'⭐'} ${h.label}</a>`).join('')}
      <div style="border-bottom:1px solid #1a1a1a;margin:4px 0"></div>
      ` : ''}

      <a href="city.html" class="menu-item${isKrallik?' on':''}">🏰 Krallığım</a>
      <div class="submenu" style="display:${isKrallik?'block':'none'}">
        <a href="city.html" class="menu-item sub-item${isActive('city.html')}">🏗️ Şehrim</a>
        ${page==='city.html' ? `
        <a href="city.html?tab=binalar" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 🏗️ Binalar</a>
        <a href="city.html?tab=gelistirmeler" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 📈 Geliştirmeler</a>
        <a href="city.html?tab=mutluluk" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 😊 Mutluluk & GPS</a>
        ` : ''}
        <a href="population.html" class="menu-item sub-item${isActive('population.html')}">👥 Nüfus & İşçiler</a>
        <a href="land.html" class="menu-item sub-item${isActive('land.html')}">🧭 Arazi</a>
        <a href="festival.html" class="menu-item sub-item${isActive('festival.html')}">🎉 Festival</a>
      </div>

      <a href="army.html" class="menu-item${isOrduSavas?' on':''}">⚔️ Ordu & Savaş</a>
      <div class="submenu" style="display:${isOrduSavas?'block':'none'}">
        <a href="army.html" class="menu-item sub-item${isActive('army.html')}">🗡️ Ordu</a>
        ${page==='army.html' ? `
        <a href="army.html?tab=units" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 🗡️ Asker Eğitimi</a>
        <a href="army.html?tab=armies" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 🏕️ Ordu Yönetimi</a>
        <a href="army.html?tab=formation" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ ⚔️ Saf Dizilimi</a>
        <a href="army.html?tab=upgrades" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 📈 Geliştirmeler</a>
        ` : ''}
        <a href="casus.html" class="menu-item sub-item${isActive('casus.html')}">🕵️ Casuslar</a>
        <a href="mezarlik.html" class="menu-item sub-item${isActive('mezarlik.html')}">💀 Mezarlık</a>
        <a id="menu-simulator" href="simulator.html" class="menu-item sub-item${isActive('simulator.html')}" target="_blank" style="display:none">🧪 Simülatör <span style="color:#d4af37;font-size:11px;margin-left:4px">⚜</span></a>
      </div>

      <a href="magic.html" class="menu-item${isBuyuler?' on':''}">🔮 Büyüler</a>
      <div class="submenu" style="display:${isBuyuler?'block':'none'}">
        <a href="magic.html" class="menu-item sub-item${isActive('magic.html')}">🕯️ Tapınak & Mana</a>
        <a href="buyucu-kulesi.html" class="menu-item sub-item${isActive('buyucu-kulesi.html')}">🗼 Büyücü Kulesi</a>
        ${page==='buyucu-kulesi.html' ? `
        <a href="buyucu-kulesi.html?tab=kitap" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 📖 Büyü Kitabı</a>
        <a href="buyucu-kulesi.html?tab=parsomen" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 📜 Parşömenler</a>
        <a href="buyucu-kulesi.html?tab=aktif" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ ✨ Aktif Büyüler</a>
        <a href="buyucu-kulesi.html?tab=cooldown" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ ⏱️ Cooldownlar</a>
        <a href="buyucu-kulesi.html?tab=bilge" class="menu-item sub-item" style="padding-left:38px;font-size:11px;color:#aaa">↳ 🧙 Bilge Seçimi</a>
        ` : ''}
      </div>

      <a href="market.html" class="menu-item${isTic?' on':''}">💰 Ticaret</a>
      <div class="submenu" style="display:${isTic?'block':'none'}">
        <a href="market.html" class="menu-item sub-item${isActive('market.html')}">🏪 Market</a>
        <a href="kervan.html" class="menu-item sub-item${isActive('kervan.html')}">🐪 Kervan</a>
        <a href="pazar.html" class="menu-item sub-item${isActive('pazar.html')}">🤝 Oyuncu Pazarı</a>
        <a href="buyu-dukkani.html" class="menu-item sub-item${isActive('buyu-dukkani.html')}">🔮 Büyü Dükkanı</a>
      </div>

      <a href="map.html" class="menu-item${isDunya?' on':''}">🗺️ Harita & Dünya</a>
      <div class="submenu" style="display:${isDunya?'block':'none'}">
        <a href="map.html" class="menu-item sub-item${isActive('map.html')}">🗺️ Harita</a>
        <a href="cag.html" class="menu-item sub-item${isActive('cag.html')}">📅 Çağ Atlama</a>
      </div>

      <a id="menu-guild" href="guild.html" class="menu-item${isActive('guild.html')}" style="display:none">🏰 Guild</a>
      <!-- v1.14.1.15: Savaslarim ayri link kaldirildi — reports.html icinde zaten tab olarak var -->
      <a href="reports.html" class="menu-item${isActive('reports.html')}">📊 Raporlar <span style="color:#888;font-size:10px">(Şehir · Savaş · Casus · Guild)</span></a>
      <a href="gorev.html" class="menu-item${isActive('gorev.html')}">📜 Görevler <span id="gorev-badge" style="display:none;background:#e74c3c;color:#fff;font-size:11px;padding:1px 5px;border-radius:8px;margin-left:4px"></span></a>

      <a href="meydan.html?tab=ozel" class="menu-item${isSosyal?' on':''}">🎭 Sosyal & Eğlence <span id="ozel-mesaj-badge-ana" style="display:none;background:#e74c3c;color:#fff;font-size:11px;padding:1px 6px;border-radius:8px;margin-left:4px;font-weight:bold"></span></a>
      <div class="submenu" style="display:${isSosyal?'block':'none'}">
        <a href="meydan.html" class="menu-item sub-item${isActive('meydan.html')}">💬 Şehir Meydanı</a>
        <a href="meydan.html?tab=ozel" class="menu-item sub-item">✉️ Özel Mesajlar <span id="ozel-mesaj-badge" style="display:none;background:#e74c3c;color:#fff;font-size:11px;padding:1px 5px;border-radius:8px;margin-left:4px"></span></a>
        <a href="siralama.html" class="menu-item sub-item${isActive('siralama.html')}">🏆 Sıralamalar</a>
        <a href="bocek-yarisi.html" class="menu-item sub-item${isActive('bocek-yarisi.html')}">🪲 Böcek Yarışı</a>
        <a href="sandik.html" class="menu-item sub-item${isActive('sandik.html')}">📦 Kader Sandıkları</a>
      </div>

      <!-- v1.14.1.54: Premium altinda Artifactlar + v1.14.3.19: Koloni Bulucu link -->
      <a href="premium.html" class="menu-item${isPremium?' on':''}" style="color:#d4af37">⚜ Premium</a>
      <div class="submenu" style="display:${isPremium?'block':'none'}">
        <a href="premium.html" class="menu-item sub-item${isActive('premium.html')}">⚜ Premium Paketler</a>
        <a href="artifact.html" class="menu-item sub-item${isActive('artifact.html')}">🧰 Artifactlar</a>
        <a href="map.html?koloniBulucu=1" class="menu-item sub-item" onclick="setTimeout(()=>{if(typeof kolBulucuAc==='function')kolBulucuAc()},800)">⭐ Koloni Bulucu</a>
      </div>

      <a href="bug-bildir.html" class="menu-item${isActive('bug-bildir.html')}" style="color:#e74c3c">🐛 Bug Bildir</a>
      <a href="codex.html" class="menu-item${isActive('codex.html')}" style="color:#d4a257">📖 Codex</a>

      <!-- v1.14.1.54: Ayarlar altinda Icon Mockup -->
      <a href="ayarlar.html" class="menu-item${isAyarlar?' on':''}">⚙️ Ayarlar</a>
      <div class="submenu" style="display:${isAyarlar?'block':'none'}">
        <a href="ayarlar.html" class="menu-item sub-item${isActive('ayarlar.html')}">⚙️ Hesap Ayarları</a>
        <a href="icon-mockup.html" class="menu-item sub-item${isActive('icon-mockup.html')}" style="color:#9b59b6">🎨 İkon Mockup</a>
      </div>

      <!-- Logout — sticky bottom -->
      <div style="position:sticky;bottom:0;padding:10px;border-top:1px solid #1a1a1a;background:inherit;z-index:10">
        <button onclick="logoutGame()" style="width:100%;padding:9px;background:#1a0a0a;border:1px solid #3a1a1a;color:#c0392b;border-radius:4px;cursor:pointer;font-size:13px;letter-spacing:0.5px;transition:background .2s"
          onmouseover="this.style.background='#2a0d0d'" onmouseout="this.style.background='#1a0a0a'">
          🚪 Oyundan Çık
        </button>
      </div>
    </div>

    <!-- v1.14.1.55: Mobile Bottom Nav — sadece <=768px goster -->
    <!-- v1.14.1.56 polish: same-page click → scroll top + badge (Sosyal/Ordu) -->
    <nav class="bottom-nav-mobile">
      <a href="home.html" class="bn-item${isActive('home.html')}" data-bn="home" onclick="return bnClick(event,'home.html')">
        <span class="bn-icon">🏠</span><span>Ana</span>
      </a>
      <a href="city.html" class="bn-item${isKrallik?' on':''}" data-bn="city" onclick="return bnClick(event,'city.html')">
        <span class="bn-icon">🏰</span><span>Şehir</span>
      </a>
      <a href="army.html" class="bn-item${isOrduSavas?' on':''}" data-bn="army" onclick="return bnClick(event,'army.html')">
        <span class="bn-icon">⚔️</span><span>Ordu</span>
        <span id="bn-army-badge" class="bn-badge" style="display:none">0</span>
      </a>
      <a href="map.html" class="bn-item${isDunya?' on':''}" data-bn="map" onclick="return bnClick(event,'map.html')">
        <span class="bn-icon">🗺️</span><span>Harita</span>
      </a>
      <a href="meydan.html" class="bn-item${isSosyal?' on':''}" data-bn="sosyal" onclick="return bnClick(event,'meydan.html')">
        <span class="bn-icon">🎭</span><span>Sosyal</span>
        <span id="bn-sosyal-badge" class="bn-badge" style="display:none">0</span>
      </a>
    </nav>
  `;
  // Mobile bottom nav var — body'ye class ekle (CSS padding-bottom)
  document.body.classList.add('has-bottom-nav');
}

// v1.14.1.56: Bottom nav click handler — ayni sayfadayken scroll top, farkli ise normal git
function bnClick(ev, hedefSayfa) {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'home.html';
  if (page === hedefSayfa) {
    // Ayni sayfada — scroll top + opsiyonel haptic
    ev.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Haptic feedback (destekleyen telefonlar)
    if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
    return false;
  }
  return true; // farkli sayfa — normal navigation
}
window.bnClick = bnClick;

// v1.14.0.54: Codex palette + tooltip global yukleme
(function loadCodexGlobal() {
  if (window._codexGlobalLoaded) return;
  window._codexGlobalLoaded = true;
  const load = (src) => {
    const s = document.createElement('script');
    s.src = src + '?v=13454';
    s.async = true;
    document.head.appendChild(s);
  };
  // Sadece codex.html'de zaten yüklenmediyse
  if (!document.querySelector('script[src*="codex-data.js"]')) load('js/codex-data.js');
  load('js/codex-palette.js');
  load('js/codex-tooltip.js');
})();

function renderHUD(){
  const mount = document.getElementById('hudbar-mount');
  if(!mount) return;

  // stat-box helper: ikon + isim + miktar + rate
  function sb(tip, icon, label, amountId, rateId) {
    const rateHtml = rateId
      ? `<span class="res-rate pos" id="${rateId}">+0</span>`
      : '';
    return `<div class="stat-box" data-tip="${tip}">
      <span class="res-icon">${icon}</span>
      <div class="res-details">
        <span class="res-label">${label}</span>
        <span class="res-amount" id="${amountId}">0</span>
        ${rateHtml}
      </div>
    </div>`;
  }

  const metalSvg = '<svg width="13" height="10" viewBox="0 0 15 11" style="display:inline-block;vertical-align:-1px"><path d="M2,1 L13,1 L11,10 L4,10 Z" fill="#8a8a8a" stroke="#666" stroke-width="0.5"/><path d="M4,3 L11,3 L9.5,8.5 L5.5,8.5 Z" fill="#b0b0b0"/></svg>';
  const islSvg = '<svg width="13" height="10" viewBox="0 0 15 11" style="display:inline-block;vertical-align:-1px"><path d="M2,1 L13,1 L11,10 L4,10 Z" fill="#2471a3" stroke="#1a5276" stroke-width="0.5"/><path d="M4,3 L11,3 L9.5,8.5 L5.5,8.5 Z" fill="#5dade2"/></svg>';

  mount.innerHTML = `
  <div class="hudbar" id="hudbar">
    <!-- Ateşkes / Tatil Banner -->
    <div id="hud-ateskes-banner" style="display:none;background:rgba(231,76,60,0.15);border-bottom:1px solid rgba(231,76,60,0.3);padding:3px 10px;text-align:center;font-size:11px;color:#e74c3c;font-family:Cinzel,serif;letter-spacing:1px">⚔️ ATEŞKES AKTİF</div>
    <div id="hud-tatil-banner" style="display:none;background:rgba(46,204,113,0.15);border-bottom:1px solid rgba(46,204,113,0.3);padding:3px 10px;text-align:center;font-size:11px;color:#2ecc71;font-family:Cinzel,serif;letter-spacing:1px">🏖️ TATİL MODU</div>
    <!-- v1.14.0.80: Kadim banner kaldirildi, HAM satirina K.SALDIRI kutu olarak tasindi -->
    <div id="hud-kadim-banner" style="display:none"></div>
    <!-- v1.13.61: YENI HUD — 1 sticky HAM satiri + 4 satir overlay detay -->
    <!-- HAM (sticky, her zaman gorunur): Odun · Kereste · Metal · Isl.Metal · Altın · Tarih + ▼ Detay -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">HAM</div>
      <div class="hud-res-row hud-aligned">
        ${sb('ODUN','🌳','Odun','hud-w','hud-wg')}
        ${sb('KERESTE','🪵','Kereste','hud-ke','hud-keg')}
        <div class="stat-box" data-tip="METAL"><span class="res-icon">${metalSvg}</span><div class="res-details"><span class="res-label">Metal</span><span class="res-amount" id="hud-m">0</span><span class="res-rate pos" id="hud-mg">+0</span></div></div>
        <div class="stat-box" data-tip="İŞL.METAL"><span class="res-icon">${islSvg}</span><div class="res-details"><span class="res-label">İşl.Metal</span><span class="res-amount" id="hud-is">0</span><span class="res-rate pos" id="hud-isg">+0</span></div></div>
        ${sb('ALTIN','💰','Altın','hud-g','hud-gg')}
        <!-- v1.14.0.80: K.SALDIRI kutu (kadim sehir geri sayim) — banner yerine compact HUD -->
        <div id="hud-ksaldiri-box" class="stat-box" data-tip="KADİM SALDIRI — tıkla → pazar.html" style="display:none;cursor:pointer;border-left:2px solid #9b59b6" onclick="window.location.href='pazar.html?tab=kadim'">
          <span class="res-icon">⚔️</span>
          <div class="res-details">
            <span class="res-label" style="color:#d4a257">K.Saldırı</span>
            <span class="res-amount" id="hud-ksaldiri-pg" style="color:#9b59b6;font-weight:bold">—</span>
            <span class="res-rate" id="hud-ksaldiri-sehir" style="color:#888;font-size:9px"></span>
          </div>
        </div>
        <!-- Overlay toggle butonu -->
        <button id="hud-detay-toggle" onclick="toggleHudDetay()" style="margin-left:auto;background:linear-gradient(135deg,#d4af37,#c8a96e);color:#0a0604;border:none;padding:3px 10px;cursor:pointer;font-size:10px;font-weight:700;border-radius:3px;white-space:nowrap;font-family:Cinzel,serif;letter-spacing:1px" title="Detay panelini aç/kapa">▼ DETAY</button>
      </div>
    </div>

    <!-- OVERLAY DETAY — position:absolute, sayfa itilmez; toggle ile acilir -->
    <div id="hud-detay-overlay" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:9000;background:linear-gradient(180deg,#14100a,#0a0604);box-shadow:0 8px 24px rgba(0,0,0,0.85);border-bottom:2px solid #d4af37">
      <!-- YIYECEK -->
      <div class="hud-row-wrap">
        <div class="hud-row-lbl">YİYECEK</div>
        <div class="hud-res-row hud-aligned">
          ${sb('BUĞDAY','🌾','Buğday','hud-bu','hud-bug')}
          ${sb('EKMEK','🍞','Ekmek','hud-ek',null)}
          ${sb('BALIK','🎣','Balık','hud-ba','hud-bag')}
          ${sb('PİŞ.BALIK','🍳','Piş.Balık','hud-pb',null)}
          ${sb('ÇİĞ ET','🥩','Çiğ Et','hud-ce',null)}
          ${sb('PİŞ.ET','🍖','Piş.Et','hud-pe',null)}
        </div>
      </div>
      <!-- MANA -->
      <div class="hud-row-wrap">
        <div class="hud-row-lbl">MANA</div>
        <div class="hud-res-row">
          <div class="stat-box mana-box" data-tip="BEYAZ MANA" style="border-left:2px solid #f0e8d8"><span class="res-icon">🤍</span><div class="res-details"><span class="res-label" style="color:#f0e8d8">B.Mana</span><span class="res-amount" id="hud-mana-beyaz">0</span><span class="res-rate" id="hud-mana-beyaz-g"></span></div></div>
          <div class="stat-box mana-box" data-tip="KIRMIZI MANA" style="border-left:2px solid #e74c3c"><span class="res-icon">❤️</span><div class="res-details"><span class="res-label" style="color:#e74c3c">K.Mana</span><span class="res-amount" id="hud-mana-kirmizi">0</span><span class="res-rate" id="hud-mana-kirmizi-g"></span></div></div>
          <div class="stat-box mana-box" data-tip="MAVİ MANA" style="border-left:2px solid #3498db"><span class="res-icon">💙</span><div class="res-details"><span class="res-label" style="color:#3498db">M.Mana</span><span class="res-amount" id="hud-mana-mavi">0</span><span class="res-rate" id="hud-mana-mavi-g"></span></div></div>
          <div class="stat-box mana-box" data-tip="YEŞİL MANA" style="border-left:2px solid #2ecc71"><span class="res-icon">💚</span><div class="res-details"><span class="res-label" style="color:#2ecc71">Y.Mana</span><span class="res-amount" id="hud-mana-yesil">0</span><span class="res-rate" id="hud-mana-yesil-g"></span></div></div>
          ${sb('EŞEK','🫏','Eşek','hud-essek',null)}
          ${sb('TARİH','📅','Tarih','hud-takvim',null)}
        </div>
      </div>
      <!-- GUILD (sadece guilddeyse gorunur) -->
      <div class="hud-row-wrap" id="hud-guild-row" style="display:none">
        <div class="hud-row-lbl">GUILD</div>
        <div class="hud-res-row hud-aligned" id="hud-guild-stats"></div>
      </div>
      <!-- ISTATISTIK -->
      <div class="hud-row-wrap">
        <div class="hud-row-lbl">İSTATİSTİK</div>
        <div class="hud-res-row">
          ${sb('MUTLULUK','😊','Mutluluk','hud-sehir-moral',null)}
          ${sb('O.MORAL','⚔️','O.Moral','hud-moral',null)}
          ${sb('AÇLIK','🍽️','Açlık','hud-hunger',null)}
          ${sb('NÜFUS','👥','Nüfus','hud-nufus-box',null)}
          ${sb('ALAN','📐','Alan','hud-alan-box',null)}
          ${sb('ŞEHİR','🏰','Ş.Değeri','hud-sehir-deger',null)}
          ${sb('SAAT','⏰','Saat','c-now',null)}
        </div>
      </div>
      <!-- v1.14.2.0 (FAZ X.4): KP/GP — Gelisim kaynaklari -->
      <div class="hud-row-wrap">
        <div class="hud-row-lbl">GELİŞİM</div>
        <div class="hud-res-row">
          <div class="stat-box" data-tip="GELISIM PUANI (Katiplerden uretir)" style="border-left:2px solid #3498db"><span class="res-icon">📚</span><div class="res-details"><span class="res-label" style="color:#3498db">G.Puani</span><span class="res-amount" id="hud-gp">0</span></div></div>
          <div class="stat-box" data-tip="KULTUR PUANI (GPS %80+ x 2 PG / Buyu / Casus / Artifact)" style="border-left:2px solid #f1c40f"><span class="res-icon">📜</span><div class="res-details"><span class="res-label" style="color:#f1c40f">K.Puani</span><span class="res-amount" id="hud-kp">0</span></div></div>
        </div>
      </div>
      <!-- ORDU — Ordularim + tehdit/destek rozetleri + rehber -->
      <div class="hud-row-wrap">
        <div class="hud-row-lbl">ORDU</div>
        <div class="hud-res-row">
          <div id="hud-ordularim-btn" class="stat-box" data-tip="ORDULARIM (Sehirde/Toplam)" onclick="toggleOrdularimPanel()" style="cursor:pointer;border-left:2px solid #d4af37;background:rgba(212,175,55,0.08)">
            <span class="res-icon">🏇</span>
            <div class="res-details">
              <span class="res-label" style="color:#d4af37">Ordularım</span>
              <span class="res-amount" id="hud-ordularim-sayi" style="color:#d4af37">0/0</span>
            </div>
          </div>
          <div id="hud-sald-btn" class="stat-box" data-tip="GELEN SALDIRI ORDUSU" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #e74c3c;background:rgba(231,76,60,0.08)">
            <span class="res-icon">⚔️</span>
            <div class="res-details">
              <span class="res-label" style="color:#e74c3c">Saldırı</span>
              <span class="res-amount" id="hud-sald-sayi" style="color:#e74c3c">0</span>
            </div>
          </div>
          <!-- v1.14.0.15: Kadim sehirden gelen saldiri (240 PG geri sayim) -->
          <div id="hud-kadim-btn" class="stat-box" data-tip="KADIM SEHIR ORDUSU (TOPLANIYOR/YOLDA)" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #9b59b6;background:rgba(155,89,182,0.08)">
            <span class="res-icon">🏛️</span>
            <div class="res-details">
              <span class="res-label" style="color:#9b59b6">Kadim</span>
              <span class="res-amount" id="hud-kadim-sayi" style="color:#9b59b6">0</span>
            </div>
          </div>
          <div id="hud-takv-btn" class="stat-box" data-tip="GELEN DESTEK ORDUSU" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #2ecc71;background:rgba(46,204,113,0.08)">
            <span class="res-icon">🛡️</span>
            <div class="res-details">
              <span class="res-label" style="color:#2ecc71">Destek</span>
              <span class="res-amount" id="hud-takv-sayi" style="color:#2ecc71">0</span>
            </div>
          </div>
          <div id="hud-buagr-btn" class="stat-box" data-tip-below="USTUMDEKI AGRESIF BUYULER" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #c0392b;background:rgba(192,57,43,0.08)">
            <span class="res-icon">🔮</span>
            <div class="res-details">
              <span class="res-label" style="color:#c0392b">A.Büyü</span>
              <span class="res-amount" id="hud-buagr-sayi" style="color:#c0392b">0</span>
            </div>
          </div>
          <div id="hud-budef-btn" class="stat-box" data-tip-below="USTUMDEKI DESTEK BUYULER" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #3498db;background:rgba(52,152,219,0.08)">
            <span class="res-icon">✨</span>
            <div class="res-details">
              <span class="res-label" style="color:#3498db">D.Büyü</span>
              <span class="res-amount" id="hud-budef-sayi" style="color:#3498db">0</span>
            </div>
          </div>
          <!-- v1.13.21: Rehber butonu -->
          <div id="hud-rehber-btn" class="stat-box rehber-hud-btn" data-tip="REHBER" onclick="rehberHudTikla()" style="display:none;cursor:pointer;border-left:2px solid #c8a96e;background:rgba(200,169,110,0.06)">
            <span class="res-icon">📜</span>
            <div class="res-details">
              <span class="res-label" style="color:#c8a96e">Rehber</span>
              <span class="res-amount" id="hud-rehber-adim" style="color:#f0d050">—</span>
            </div>
          </div>
        </div>
      </div>
    </div><!-- /hud-detay-overlay -->
    <!-- v1.13.42.2: Gelen ordular detay paneli HUD'un altinda + sayfada scroll olabilir (yukarı taşmaz) -->
    <div id="hud-gelen-panel" style="display:none;position:fixed;top:50px;right:10px;width:360px;max-width:92vw;max-height:calc(100vh - 180px);overflow-y:auto;background:linear-gradient(180deg,#1a0e06,#110804);border:1px solid #c0392b;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.8);z-index:99998;padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(231,76,60,0.3)">
        <span style="font-family:'Cinzel',serif;color:#e74c3c;font-size:13px;font-weight:bold">🎯 Şehrime Gelen Ordular</span>
        <button onclick="toggleGelenOrdular()" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px">✕</button>
      </div>
      <div id="hud-gelen-liste" style="font-size:11px;color:#aaa">Yukleniyor...</div>
    </div>
    <!-- v1.13.58: Ordularim detay paneli (sehirdeki + yoldaki + kolonideki) -->
    <div id="hud-ordularim-panel" style="display:none;position:fixed;top:50px;right:10px;width:380px;max-width:92vw;max-height:calc(100vh - 180px);overflow-y:auto;background:linear-gradient(180deg,#14100a,#0e0b07);border:1px solid #d4af37;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.8);z-index:99998;padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(212,175,55,0.3)">
        <span style="font-family:'Cinzel',serif;color:#d4af37;font-size:13px;font-weight:bold">🏇 Ordularım</span>
        <button onclick="toggleOrdularimPanel()" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px">✕</button>
      </div>
      <div id="hud-ordularim-liste" style="font-size:11px;color:#aaa">Yukleniyor...</div>
    </div>
    <button class="hud-toggle-btn" onclick="(function(btn){var h=document.getElementById('hudbar');if(!h)return;h.classList.toggle('expanded');btn.textContent=h.classList.contains('expanded')?'▲':'▼';})(this)">▼</button>
  </div>
  `;
}

function renderBuildingModal(){
  const mount = document.getElementById('building-modal-mount');
  if(!mount) return;

  mount.innerHTML = `
  <div id="building-modal" class="modal-bg" onclick="closeModalOut(event)">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h2 id="mtitle">—</h2>
      <p class="msub" id="msub">—</p>
      <div class="modal-sec">
        <h4>Adet Durumu</h4>
        <div class="lvc" id="mlvc"></div>
      </div>
      <div class="modal-sec">
        <h4>İnşaat Maliyeti <span style="font-size:10px;color:#444;font-weight:normal">(1 adet)</span></h4>
        <div class="cost-row" id="mcost"></div>
        <div style="margin-top:10px;color:#666;font-size:13px" id="mtime"></div>
      </div>
      <div class="modal-sec">
        <h4>Kaç Adet?</h4>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="number" id="build-adet" min="1" max="999" value="1"
            oninput="updateBuildTotal()"
            style="width:80px;padding:6px 10px;background:#111;border:1px solid #333;color:#f0e8d8;border-radius:3px;font-size:14px">
          <span style="color:#555;font-size:12px">adet (her biri 1 P.G. sürer)</span>
        </div>
        <div id="build-total-cost" style="margin-top:8px;font-size:12px;color:#c8a96e;min-height:16px"></div>
      </div>
      <div class="modal-sec" style="border-bottom:none">
        <button class="btn" id="mbtn" style="width:100%" onclick="confirmBuild()">🏗️ İnşa Et</button>
      </div>
    </div>
  </div>
  `;
}

/* v1.13.69: Kosullu menu gorunurlugu (premium + guild_binasi)
   loadGameData icinde /api/player/me yaniti geldikten sonra cagirilir */
function updateConditionalMenus(player) {
  try {
    // Simulator: sadece premium aktifse
    const simEl = document.getElementById('menu-simulator');
    if (simEl) {
      const premiumAktif = !!(player && player.premium && player.premium.aktif);
      simEl.style.display = premiumAktif ? '' : 'none';
    }
    // Guild: sadece guild_binasi varsa
    const guildEl = document.getElementById('menu-guild');
    if (guildEl) {
      const hasGuildBina = !!(player && player.has_guild_binasi);
      guildEl.style.display = hasGuildBina ? '' : 'none';
    }
  } catch(e) { /* sessiz */ }
}
if (typeof window !== 'undefined') window.updateConditionalMenus = updateConditionalMenus;

/* Mobil sidebar toggle */
function toggleMobileSidebar(){
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if(!sb) return;
  sb.classList.toggle('open');
  if(ov) ov.classList.toggle('open');
}

function initLayout(){
  // Auth kontrolu — dogru key: palantis_token
  const token = getToken ? getToken() : localStorage.getItem('palantis_token');
  if(!token){
    window.location.href = 'index.html';
    return;
  }

  // Layout parcalarini render et
  renderSidebar();
  renderHUD();
  renderBuildingModal();

  // Kayitli oyuncu verisini uygula — dogru key: palantis_player
  const playerRaw = localStorage.getItem('palantis_player');
  if(playerRaw){
    try {
      const player = JSON.parse(playerRaw);
      if(typeof obApplyPlayer === 'function') obApplyPlayer(player);
      if(typeof applyTheme === 'function') applyTheme(player.irk || player.race);
    } catch(e){
      console.warn('Player parse hatasi:', e);
    }
  }

  // Oyun verisini yukle
  if(typeof loadGameData === 'function') loadGameData();

  // Tatil + Ateşkes artık loadGameData içinde kontrol ediliyor (60sn aralık)

  // Timer intervalleri
  if(typeof updateTopTimers === 'function'){
    setInterval(updateTopTimers, 1000);
    updateTopTimers();
  }
  if(typeof updateBars === 'function'){
    setInterval(updateBars, 1000);
  }

  // Otomatik yenileme
  if(typeof loadGameData === 'function'){
    setInterval(loadGameData, 60000);
  }

  // v1.13.22: Gelen ordular polling (30sn)
  loadGelenOrdular();
  setInterval(loadGelenOrdular, 30000);

  // v1.13.30: Kuyruk widget mount + polling (v1.13.58: 30sn — ordu hareketleri daha reaktif)
  renderKuyrukMount();
  loadKuyrukOzet();
  setInterval(loadKuyrukOzet, 30000);
  // Global tetikleyici — ordu gonder/casus/kervan sonrasi anlik refresh icin kullanilir
  if (typeof window !== 'undefined') window.refreshKuyruk = loadKuyrukOzet;

  // v1.13.58: Ordularim HUD rozet polling (30sn)
  loadOrdularim();
  setInterval(loadOrdularim, 30000);

  // v1.2.0: Gün geçişi sistemi
  initDayTransition();
}

/* ═══════════════════════════════════════════
   GÜN GEÇİŞİ SİSTEMİ
   XX:59 — overlay göster, butonları kilitle
   XX:01 — overlay kaldır, veriyi yenile
═══════════════════════════════════════════ */
function initDayTransition() {
  // Overlay HTML oluştur
  const overlay = document.createElement('div');
  overlay.id = 'day-transition-overlay';
  overlay.innerHTML = `
    <div id="dt-sun" style="width:80px;height:80px;border-radius:50%;margin-bottom:24px;opacity:0"></div>
    <div style="font-family:'Cinzel',serif;font-size:24px;color:#c8a96e;letter-spacing:2px;margin-bottom:8px" id="dt-title"></div>
    <div style="font-family:'Crimson Pro',serif;font-size:14px;color:#888" id="dt-subtitle"></div>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes dtSunSet { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(100px);opacity:0} }
    @keyframes dtSunRise { 0%{transform:translateY(100px);opacity:0} 50%{opacity:1} 100%{transform:translateY(0);opacity:1} }
    #day-transition-overlay {
      display:none; position:fixed; inset:0; z-index:99999; pointer-events:all;
      flex-direction:column; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.92); transition:opacity 1s ease; opacity:0;
    }
    #day-transition-overlay.active { display:flex; opacity:1; }
    #day-transition-overlay.fade-out { opacity:0; }
    body.dt-locked .btn-action, body.dt-locked button:not(.atab) { pointer-events:none!important;opacity:0.5!important; }
    .dt-sunset { background:radial-gradient(circle,#e74c3c,#c0392b,#7b241c)!important; box-shadow:0 0 60px #e74c3c,0 0 120px #c0392b55!important; animation:dtSunSet 3s ease-in forwards!important; }
    .dt-sunrise { background:radial-gradient(circle,#f1c40f,#e67e22,#d35400)!important; box-shadow:0 0 60px #f39c12,0 0 120px #e67e2255!important; animation:dtSunRise 3s ease-out forwards!important; }
  `;
  document.head.appendChild(style);

  let dtActive = false;
  let dtDismissed = false;
  let lastCheckedHour = -1;
  let dtPhase = 'none'; // 'none' | 'sunset' | 'sunrise'

  function showOverlay(bg) {
    overlay.style.background = bg;
    overlay.classList.add('active');
    document.body.classList.add('dt-locked');
  }

  function hideOverlay() {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.remove('active', 'fade-out');
      document.body.classList.remove('dt-locked');
      dtActive = false;
      dtPhase = 'none';
      dtDismissed = true;
      if (typeof loadGameData === 'function') loadGameData();
    }, 1500);
  }

  setInterval(() => {
    const now = new Date();
    const min = now.getMinutes();
    const hour = now.getHours();

    // Saat değişti — reset dismiss flag
    if (hour !== lastCheckedHour) {
      dtDismissed = false;
      lastCheckedHour = hour;
    }

    // XX:59 — GÜN BATIMI
    if (min === 59 && !dtActive && !dtDismissed) {
      dtActive = true;
      dtPhase = 'sunset';
      showOverlay('rgba(20,5,0,0.95)');
      const sun = document.getElementById('dt-sun');
      if (sun) { sun.className = 'dt-sunset'; sun.style.opacity = '1'; }
      const titleEl = document.getElementById('dt-title');
      if (titleEl) { titleEl.textContent = '🌅 Gün Batıyor...'; titleEl.style.color = '#e67e22'; }
      const subEl = document.getElementById('dt-subtitle');
      if (subEl) subEl.textContent = 'Noxara gecesi yaklaşıyor...';
    }

    // XX:00 — GECE (geçiş anı)
    if (min === 0 && !dtDismissed) {
      if (!dtActive) {
        // Sayfa XX:00'da açıldıysa doğrudan gece göster
        dtActive = true;
      }
      if (dtPhase !== 'night') {
        dtPhase = 'night';
        showOverlay('rgba(0,0,8,0.97)');
        const sun = document.getElementById('dt-sun');
        if (sun) { sun.className = ''; sun.style.opacity = '0'; }
        const titleEl = document.getElementById('dt-title');
        if (titleEl) { titleEl.textContent = '🌙 Yeni Gün Başlıyor'; titleEl.style.color = '#8888bb'; }
        const subEl = document.getElementById('dt-subtitle');
        if (subEl) subEl.textContent = 'Kaynaklar hesaplanıyor...';
      }
    }

    // XX:01 — GÜN DOĞUMU (sonra kapanır)
    if (min === 1 && !dtDismissed) {
      if (!dtActive) {
        // Sayfa XX:01'de açıldıysa doğrudan sunrise göster
        dtActive = true;
      }
      if (dtPhase !== 'sunrise') {
        dtPhase = 'sunrise';
        showOverlay('rgba(10,5,0,0.92)');
        const sun = document.getElementById('dt-sun');
        if (sun) { sun.className = 'dt-sunrise'; }
        const titleEl = document.getElementById('dt-title');
        if (titleEl) { titleEl.textContent = '☀️ Güneş Doğuyor!'; titleEl.style.color = '#f1c40f'; }
        const subEl = document.getElementById('dt-subtitle');
        if (subEl) subEl.textContent = 'Kaynaklar güncellendi';

        // 45 saniye sonra kapat
        setTimeout(() => hideOverlay(), 45000);
      }
    }

    // XX:02+ — overlay hala açıksa kapat (güvenlik)
    if (min >= 2 && dtActive) {
      hideOverlay();
    }
  }, 1000);
}

/* ═══════════════════════════════════════════
   HIZLI ERİŞİM API — v1.13.13
   Oyuncu sidebar'a max 5 menu pinler. localStorage'da saklanır.
═══════════════════════════════════════════ */

// Pin edilebilir tum sayfalar (menu katalogu)
const HIZLI_MENU_KATALOG = [
  { href: 'city.html',          label: 'Şehrim',           icon: '🏗️', grup: 'Krallığım' },
  { href: 'population.html',    label: 'Nüfus & İşçiler',  icon: '👥', grup: 'Krallığım' },
  { href: 'land.html',          label: 'Arazi',            icon: '🧭', grup: 'Krallığım' },
  { href: 'festival.html',      label: 'Festival',         icon: '🎉', grup: 'Krallığım' },
  { href: 'army.html',          label: 'Ordu',             icon: '🗡️', grup: 'Savaş' },
  { href: 'mezarlik.html',      label: 'Mezarlık',         icon: '💀', grup: 'Savaş' },
  { href: 'casus.html',         label: 'Casuslar',         icon: '🕵️', grup: 'Savaş' },
  { href: 'magic.html',         label: 'Tapınak & Mana',   icon: '🕯️', grup: 'Savaş' },
  { href: 'buyucu-kulesi.html', label: 'Büyücü Kulesi',    icon: '🗼', grup: 'Savaş' },
  { href: 'market.html',        label: 'Market',           icon: '🏪', grup: 'Ticaret' },
  { href: 'kervan.html',        label: 'Kervan',           icon: '🐪', grup: 'Ticaret' },
  { href: 'pazar.html',         label: 'Oyuncu Pazarı',    icon: '🤝', grup: 'Ticaret' },
  { href: 'buyu-dukkani.html',  label: 'Büyü Dükkanı',     icon: '🔮', grup: 'Ticaret' },
  { href: 'map.html',           label: 'Harita',           icon: '🗺️', grup: 'Dünya' },
  { href: 'guild.html',         label: 'Guild',            icon: '🏰', grup: 'Dünya' },
  { href: 'cag.html',           label: 'Çağ Atlama',       icon: '📅', grup: 'Dünya' },
  { href: 'gorev.html',         label: 'Görevler',         icon: '📜', grup: 'Aktivite' },
  { href: 'reports.html?tab=sehir', label: 'Şehir Raporları',  icon: '🏙️', grup: 'Aktivite' },
  { href: 'reports.html',       label: 'Raporlar',         icon: '📊', grup: 'Aktivite' },
  { href: 'siralama.html',      label: 'Sıralamalar',      icon: '🏆', grup: 'Aktivite' },
  { href: 'artifact.html',      label: 'Artifactlar',      icon: '🧰', grup: 'Aktivite' },
  { href: 'meydan.html',        label: 'Şehir Meydanı',    icon: '💬', grup: 'Aktivite' },
  { href: 'bocek-yarisi.html',  label: 'Böcek Yarışı',     icon: '🪲', grup: 'Eğlence' },
  { href: 'sandik.html',        label: 'Kader Sandıkları', icon: '📦', grup: 'Eğlence' },
  { href: 'premium.html',       label: 'Premium',          icon: '⚜',  grup: 'Diğer' }
];
const HIZLI_MAX = 5;

function getHizliMenu() {
  try {
    const raw = localStorage.getItem('noxara_hizli_menu');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, HIZLI_MAX) : [];
  } catch(e) { return []; }
}

function setHizliMenu(list) {
  const clean = (list || []).slice(0, HIZLI_MAX).map(h => ({
    href: String(h.href || '').slice(0, 50),
    label: String(h.label || '').slice(0, 30),
    icon: String(h.icon || '⭐').slice(0, 4)
  }));
  localStorage.setItem('noxara_hizli_menu', JSON.stringify(clean));
  // Sidebar'i yenile
  if (typeof renderSidebar === 'function') renderSidebar();
}

function hizliMenuEkle(href) {
  const cur = getHizliMenu();
  if (cur.length >= HIZLI_MAX) return { ok: false, hata: `Max ${HIZLI_MAX} menu pinlenebilir` };
  if (cur.find(x => x.href === href)) return { ok: false, hata: 'Zaten pinli' };
  const kat = HIZLI_MENU_KATALOG.find(k => k.href === href);
  if (!kat) return { ok: false, hata: 'Sayfa tanimli degil' };
  cur.push({ href: kat.href, label: kat.label, icon: kat.icon });
  setHizliMenu(cur);
  return { ok: true };
}

function hizliMenuCikar(href) {
  setHizliMenu(getHizliMenu().filter(x => x.href !== href));
  return { ok: true };
}

function hizliMenuSirala(href, yon) {
  const list = getHizliMenu();
  const i = list.findIndex(x => x.href === href);
  if (i < 0) return;
  const j = yon === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  setHizliMenu(list);
}

/* ═══════════════════════════════════════════
   KUYRUK WIDGET (v1.13.30) — Yuzen guncel is listesi
═══════════════════════════════════════════ */
let KUYRUK_CACHE = null;

async function loadKuyrukOzet() {
  const token = getToken && getToken();
  if (!token || typeof API_BASE === 'undefined') return;
  try {
    const r = await fetch(API_BASE + '/api/game/kuyruk-ozet', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) return;
    KUYRUK_CACHE = await r.json();
    renderKuyrukWidget();
  } catch(e) {}
}

async function renderKuyrukWidget() {
  if (!KUYRUK_CACHE) return;
  const d = KUYRUK_CACHE;
  // v1.14.1.13: Kisisel toplam — guild kategorileri cikarildi
  const kisiselCats = ['bina','tamir','unite','kervan','ordu','casus','buyu','ws'];
  const KAT_ICON = { bina:'🏗️', tamir:'🔧', unite:'⚔️', kervan:'🐪', ordu:'🛡️', casus:'🕵️', buyu:'✨', ws:'🙏' };
  let toplam = 0;
  const breakdown = [];
  for (const k of kisiselCats) {
    const len = ((d.kategoriler||{})[k]||[]).length;
    toplam += len;
    if (len > 0) breakdown.push({ k, len });
  }

  // v2.0: Anomali tespiti — bir kategori > 50 ise console'a uyari
  // (Kullanici "kuyrugum 600+" derse bu log'da hangi kategori sismis gorunur)
  if (toplam > 100) {
    console.warn('[KUYRUK ANOMALI] Toplam:', toplam, '— Kategori dagilimi:',
      breakdown.map(b => `${b.k}=${b.len}`).join(', '));
  }

  const toplamEl = document.getElementById('kuyruk-toplam');
  const aciciSayi = document.getElementById('kuyruk-acici-sayi');
  if (toplamEl) toplamEl.textContent = toplam;
  if (aciciSayi) aciciSayi.textContent = toplam;

  // v2.0: Header altinda kategori breakdown (anomali varsa kirmizi)
  const breakdownEl = document.getElementById('kuyruk-breakdown');
  if (breakdownEl) {
    if (breakdown.length === 0) {
      breakdownEl.innerHTML = '';
    } else {
      breakdownEl.innerHTML = breakdown.map(b => {
        const isAnomaly = b.len > 50;
        const color = isAnomaly ? '#e74c3c' : '#888';
        const warn = isAnomaly ? ' ⚠' : '';
        return `<span style="color:${color}" title="${b.k}: ${b.len} satir">${KAT_ICON[b.k]||''}${b.len}${warn}</span>`;
      }).join(' · ');
    }
  }

  // v1.14.1.13: Guild kuyruklari 'Kuyrugum' widget'inden ayrildi.
  //   Guild bina/unite sadece guild.html'de gorunur — 'Kuyrugum' sadece kisisel.
  //   Sebep: Guild uyeleri birbirinin ordu basma sirasini gormuyordu ama widget'te
  //   goruyordu (izleniyor hissi). Ayri mantikli.
  const cats = [
    { key:'bina',        label:'🏗️ Binalar',       link:'city.html' },
    { key:'tamir',       label:'🔧 Tamir',          link:'city.html' },
    { key:'unite',       label:'⚔️ Üniteler',       link:'army.html' },
    { key:'kervan',      label:'🐪 Kervan',         link:'kervan.html' },
    { key:'ordu',        label:'⚔️ Ordu Görevi',   link:'army.html' },
    { key:'casus',       label:'🕵️ Casus',         link:'casus.html' },
    { key:'buyu',        label:'✨ Aktif Büyü',    link:'buyucu-kulesi.html' },
    { key:'ws',          label:'🙏 Worshipper',   link:'magic.html' }
  ];

  const icerik = document.getElementById('kuyruk-icerik');
  if (!icerik) return;

  let html = '';
  for (const c of cats) {
    const liste = (d.kategoriler || {})[c.key] || [];
    if (liste.length === 0) continue;
    html += '<a href="' + c.link + '" style="display:block;padding:8px 4px;border-bottom:1px solid rgba(200,169,110,0.1);text-decoration:none;color:inherit">' +
      '<div style="color:#c8a96e;font-size:11px;font-weight:bold;margin-bottom:4px">' + c.label + ' (' + liste.length + ')</div>';
    for (const it of liste.slice(0, 3)) {
      const kalanFmt = (typeof fmtKalanSure === 'function') ? fmtKalanSure(it.kalan_sn) : (it.kalan_sn + ' sn');
      // v1.14.3.8: Bina kategorisinde kalan_insa>0 ise X iptal butonu
      const iptalBtn = (c.key === 'bina' && it.kalan_insa > 0)
        ? `<button onclick="event.preventDefault();event.stopPropagation();kuyrukIptalQuick('${it.bina_id}','${(it.bina_ad||'').replace(/'/g,'')}',${it.kalan_insa})" style="background:rgba(231,76,60,0.2);border:1px solid rgba(231,76,60,0.5);color:#e74c3c;border-radius:50%;width:16px;height:16px;font-size:9px;cursor:pointer;padding:0;line-height:1;margin-left:4px;flex-shrink:0" title="Sırayı iptal et (+${it.kalan_insa} emir)">✕</button>`
        : '';
      html += '<div style="font-size:10px;color:#999;padding:2px 0;display:flex;justify-content:space-between;align-items:center;gap:8px">' +
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + it.ad + '</span>' +
        '<span style="color:#d4af37;flex-shrink:0;display:flex;align-items:center">' + kalanFmt + iptalBtn + '</span>' +
      '</div>';
    }
    if (liste.length > 3) {
      html += '<div style="font-size:11px;color:#555;text-align:right">+' + (liste.length - 3) + ' daha…</div>';
    }
    html += '</a>';
  }

  // v1.14.3.8: Quick iptal — widget'ten cagrilir, page-city'de degilsin yine calisir
  if (!window.kuyrukIptalQuick) {
    window.kuyrukIptalQuick = async function(binaId, binaAd, kalan) {
      const C = window.noxConfirm || ((m) => Promise.resolve(confirm(m)));
      const ok = await C(`⚠️ ${binaAd} — ${kalan} sıradaki emir iptal\n\n• Mevcut inşaat devam eder.\n• %80 iade · %20 vazgeçme cezası.\n\nİptal et?`);
      if (!ok) return;
      try {
        const tk = (window.getToken || (()=>'') )();
        const r = await fetch(API_BASE + '/api/game/buildings/iptal-kuyruk', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + tk },
          body: JSON.stringify({ bina_id: binaId })
        });
        const d = await r.json();
        if (r.ok && d.success) {
          const iadeStr = d.iade && Object.keys(d.iade).length > 0
            ? ' İade: ' + Object.entries(d.iade).map(([k,v]) => v.toLocaleString()+' '+k).join(', ')
            : '';
          const msg = `✓ ${d.iptal} emir iptal — %${Math.round((d.iade_orani||0.8)*100)} iade.${iadeStr}`;
          if (window.NoxToast) NoxToast.coin(msg);
          else if (window.showToast) showToast(msg, 'success');
          if (window.refreshKuyruk) window.refreshKuyruk();
          if (window.loadGameData) window.loadGameData();
        } else {
          (window.noxAlert || alert)(d.error || 'Iptal basarisiz');
        }
      } catch(e) { (window.noxAlert || alert)('Sunucu hatasi: ' + e.message); }
    };
  }
  if (!html) html = '<div style="color:#555;font-size:11px;text-align:center;padding:20px">Bekleyen iş yok.</div>';
  icerik.innerHTML = html;
}

function kuyrukWidgetToggle() {
  const ic = document.getElementById('kuyruk-icerik');
  if (!ic) return;
  ic.style.display = ic.style.display === 'none' ? 'block' : 'none';
}

function kuyrukWidgetKapat() {
  localStorage.setItem('noxara_kuyruk_gizli', '1');
  const w = document.getElementById('kuyruk-widget');
  const a = document.getElementById('kuyruk-acici');
  if (w) w.style.display = 'none';
  if (a) a.style.display = 'flex';
}

function kuyrukWidgetAc() {
  localStorage.removeItem('noxara_kuyruk_gizli');
  const w = document.getElementById('kuyruk-widget');
  const a = document.getElementById('kuyruk-acici');
  if (w) w.style.display = 'flex';
  if (a) a.style.display = 'none';
}

function renderKuyrukMount() {
  if (document.getElementById('kuyruk-widget')) return; // zaten var
  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div id="kuyruk-widget" style="position:fixed;bottom:10px;right:10px;width:300px;max-width:calc(100vw - 20px);max-height:65vh;background:linear-gradient(180deg,#1a140a,#120c06);border:1px solid #c8a96e;border-radius:8px;box-shadow:0 6px 25px rgba(0,0,0,0.75);z-index:9998;font-family:Cinzel,serif;color:#f0e8d8;flex-direction:column;display:none">' +
      '<div style="padding:8px 12px;border-bottom:1px solid #3a3020;background:#0f0a06;border-radius:8px 8px 0 0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span style="color:#c8a96e;font-size:12px;font-weight:bold">⏳ Kuyruğum <span id="kuyruk-toplam" style="color:#d4af37">0</span></span>' +
          '<div style="display:flex;gap:2px">' +
            '<button onclick="kuyrukWidgetToggle()" style="background:none;border:1px solid #3a3020;color:#888;font-size:14px;cursor:pointer;width:24px;height:22px;border-radius:3px" title="Sımarla/Aç">−</button>' +
            '<button onclick="kuyrukWidgetKapat()" style="background:none;border:1px solid #3a3020;color:#888;font-size:14px;cursor:pointer;width:24px;height:22px;border-radius:3px" title="Kapat">✕</button>' +
          '</div>' +
        '</div>' +
        '<div id="kuyruk-breakdown" style="font-size:10px;color:#888;margin-top:4px;letter-spacing:0.5px;display:flex;flex-wrap:wrap;gap:4px"></div>' +
      '</div>' +
      '<div id="kuyruk-icerik" style="max-height:55vh;overflow-y:auto;padding:4px 12px"></div>' +
    '</div>' +
    '<button id="kuyruk-acici" onclick="kuyrukWidgetAc()" style="position:fixed;bottom:10px;right:10px;z-index:9997;background:linear-gradient(145deg,#1a140a,#0f0a06);border:1px solid #c8a96e;color:#c8a96e;padding:8px 14px;border-radius:20px;cursor:pointer;font-family:Cinzel,serif;font-size:12px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.6);display:none;align-items:center;gap:6px" title="Kuyruğu aç">⏳ <span id="kuyruk-acici-sayi">0</span></button>';
  document.body.appendChild(wrap);
  // Baslangic durumu: gizli mi?
  const gizli = localStorage.getItem('noxara_kuyruk_gizli') === '1';
  if (gizli) kuyrukWidgetKapat();
  else kuyrukWidgetAc();
}

/* ═══════════════════════════════════════════
   GELEN ORDULAR (v1.13.22) — Sehrime gelen saldiri/takviye
═══════════════════════════════════════════ */
let _gelenOrdularCache = null;

async function loadGelenOrdular() {
  const token = getToken ? getToken() : null;
  if (!token || typeof API_BASE === 'undefined') return;
  try {
    const r = await fetch(API_BASE + '/api/game/gelen-ordular', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) return;
    const data = await r.json();
    if (!data.ok) return;
    _gelenOrdularCache = data;

    // v1.13.33: 4 ayri stat-box (sadece > 0 iken gorunur)
    const show = (btnId, sayiId, count) => {
      const btn = document.getElementById(btnId);
      const sayi = document.getElementById(sayiId);
      if (!btn || !sayi) return;
      if (count > 0) { btn.style.display = 'flex'; sayi.textContent = count; }
      else { btn.style.display = 'none'; }
    };
    show('hud-sald-btn',  'hud-sald-sayi',  data.saldiri_sayisi || 0);
    show('hud-kadim-btn', 'hud-kadim-sayi', data.kadim_saldiri_sayisi || 0);
    show('hud-takv-btn',  'hud-takv-sayi',  data.takviye_sayisi || 0);
    show('hud-buagr-btn', 'hud-buagr-sayi', data.ustume_buyu_agresif || 0);
    show('hud-budef-btn', 'hud-budef-sayi', data.ustume_buyu_defansif || 0);

    // Panel acikssa icerigini de guncelle
    const panel = document.getElementById('hud-gelen-panel');
    if (panel && panel.style.display === 'block') renderGelenOrdularPanel();
  } catch(e) { /* sessiz */ }
}

function toggleGelenOrdular() {
  const panel = document.getElementById('hud-gelen-panel');
  if (!panel) return;
  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    renderGelenOrdularPanel();
  }
}

// v1.13.58: Ordularim HUD rozeti + detay paneli
let _ordularimCache = null;

async function loadOrdularim() {
  const token = getToken ? getToken() : null;
  if (!token || typeof API_BASE === 'undefined') return;
  try {
    const r = await fetch(API_BASE + '/api/army/state', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) return;
    const data = await r.json();
    _ordularimCache = data;

    const ordular = data.armies || [];
    const sehirde = ordular.filter(a => !a.is_busy && (a.konum === 'sehirde' || a.konum_tipi === 'sehir')).length;
    const toplam = ordular.length;

    const sayi = document.getElementById('hud-ordularim-sayi');
    if (sayi) {
      sayi.textContent = `${sehirde}/${toplam}`;
      // Renk: hepsi şehirde = yesil, hepsi yolda = kirmizi, karisik = sari
      if (toplam === 0) sayi.style.color = '#888';
      else if (sehirde === toplam) sayi.style.color = '#27ae60';
      else if (sehirde === 0) sayi.style.color = '#e74c3c';
      else sayi.style.color = '#f39c12';
    }

    const panel = document.getElementById('hud-ordularim-panel');
    if (panel && panel.style.display === 'block') renderOrdularimPanel();
  } catch(e) { /* sessiz */ }
}

function toggleOrdularimPanel() {
  const panel = document.getElementById('hud-ordularim-panel');
  if (!panel) return;
  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    renderOrdularimPanel();
  }
}

// v1.13.61: HUD detay overlay toggle (YIYECEK, MANA, GUILD, ISTATISTIK, ORDU satirlari)
function toggleHudDetay() {
  const panel = document.getElementById('hud-detay-overlay');
  const btn = document.getElementById('hud-detay-toggle');
  if (!panel) return;
  const acik = panel.style.display === 'block';
  panel.style.display = acik ? 'none' : 'block';
  if (btn) btn.innerHTML = acik ? '▼ DETAY' : '▲ KAPAT';
  // LocalStorage persist
  try { localStorage.setItem('noxara_hud_detay_acik', acik ? '0' : '1'); } catch(e) {}
}

// Sayfa yuklendiginde localStorage'dan eski tercih
function _hudDetayRestore() {
  try {
    const acik = localStorage.getItem('noxara_hud_detay_acik') === '1';
    const panel = document.getElementById('hud-detay-overlay');
    const btn = document.getElementById('hud-detay-toggle');
    if (acik && panel) {
      panel.style.display = 'block';
      if (btn) btn.innerHTML = '▲ KAPAT';
    }
  } catch(e) {}
}
if (typeof window !== 'undefined') {
  window.toggleHudDetay = toggleHudDetay;
  // DOMContentLoaded sonrasi restore (hudbar render sonrasi)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(_hudDetayRestore, 100));
  } else {
    setTimeout(_hudDetayRestore, 100);
  }
}

function renderOrdularimPanel() {
  const wrap = document.getElementById('hud-ordularim-liste');
  if (!wrap) return;
  const ordular = _ordularimCache?.armies || [];
  if (ordular.length === 0) {
    wrap.innerHTML = '<div style="color:#555;text-align:center;padding:14px">Henuz ordu kurmadin — <a href="army.html" style="color:#d4af37">Ordu Kur</a></div>';
    return;
  }
  const fmtK = (typeof fmtKalanSure === 'function') ? fmtKalanSure : sn => sn + ' sn';
  const fmtN = (typeof fmt === 'function') ? fmt : n => (n||0).toLocaleString('tr-TR');

  const html = ordular.map(o => {
    let durum, renk, detay = '';
    if (o.is_busy && o.aktif_gorev) {
      const g = o.aktif_gorev;
      const kalanSn = g.varis ? Math.max(0, Math.floor((new Date(g.varis) - Date.now()) / 1000)) : 0;
      const tipTr = g.tip === 'saldiri' ? '⚔️ Saldırı' : (g.tip === 'takviye' ? '🛡️ Takviye' : (g.tip === 'donus' ? '↩️ Dönüş' : g.tip));
      renk = '#f39c12';
      durum = `${tipTr} → ${g.hedef_x}:${g.hedef_y}`;
      detay = `<span style="color:#d4af37">${fmtK(kalanSn)}</span>`;
    } else if (o.konum === 'kolonide' || o.konum_tipi === 'koloni') {
      renk = '#3498db';
      durum = `🏕️ Kolonide ${o.koloni_bilgi?.x || '?'}:${o.koloni_bilgi?.y || '?'}`;
    } else if (o.konum_tipi === 'korumada' && o.takviye) {
      renk = '#2ecc71';
      durum = `🛡️ Koruma ${o.takviye.konum_x}:${o.takviye.konum_y}`;
    } else {
      renk = '#27ae60';
      durum = '🏠 Şehirde';
    }

    return `<div style="padding:8px;margin-bottom:6px;background:rgba(212,175,55,0.04);border-left:2px solid ${renk};border-radius:3px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:#f0e8d8;font-weight:600">${o.isim || 'Ordu ' + o.id}</span>
        <span style="color:#888;font-size:10px">${fmtN(o.total_units)} asker</span>
      </div>
      <div style="color:${renk};font-size:11px;margin-top:3px;display:flex;justify-content:space-between">
        <span>${durum}</span>${detay}
      </div>
      <div style="color:#777;font-size:10px;margin-top:2px">
        ATK ${fmtN(o.atk)} · DEF ${fmtN(o.def)} · Reyting %${o.reyting || 0}
      </div>
    </div>`;
  }).join('');

  wrap.innerHTML = html;
}

// Global trigger — ordu gonder sonrasi anlik refresh icin
if (typeof window !== 'undefined') window.refreshOrdularim = loadOrdularim;

function renderGelenOrdularPanel() {
  const wrap = document.getElementById('hud-gelen-liste');
  if (!wrap) return;
  const d = _gelenOrdularCache;
  const ordular = d?.ordular || [];
  const buyuler = d?.ustume_buyu_detay || [];
  const kadim = (d?.kadim_saldiri_detay || []).filter(k => k.faz === 'yolda' || k.faz === 'uyari' || k.faz === 'geri_sayim');
  if (ordular.length === 0 && buyuler.length === 0 && kadim.length === 0) {
    wrap.innerHTML = '<div style="color:#555;text-align:center;padding:14px">Hiç bir şey yok</div>';
    return;
  }
  const fmtK = (typeof fmtKalanSure === 'function') ? fmtKalanSure : sn => sn + ' sn';

  let html = '';
  // Gelen ordular
  if (ordular.length > 0) {
    html += '<div style="font-size:10px;color:#c8a96e;margin-bottom:4px;font-weight:bold">🎯 GELEN ORDULAR</div>';
    html += ordular.map(o => {
      const isSald = o.tip === 'saldiri';
      const renk = isSald ? '#e74c3c' : '#2ecc71';
      const ikon = isSald ? '⚔️' : '🛡️';
      const ad = o.saldiran_kral || 'Bilinmeyen';
      const sehir = o.saldiran_sehir ? ` (${o.saldiran_sehir})` : '';
      const koord = o.kaynak ? `📍 ${o.kaynak} →` : '';
      return `<div style="padding:8px 10px;margin-bottom:6px;background:rgba(0,0,0,0.3);border-left:3px solid ${renk};border-radius:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="color:${renk};font-weight:bold;font-size:12px">${ikon} ${isSald ? 'SALDIRI' : 'TAKVİYE'}</span>
          <span style="color:#c8a96e;font-size:10px;font-weight:bold">${fmtK(o.kalan_saniye)}</span>
        </div>
        <div style="color:#ccc;font-size:11px">${ad}${sehir}</div>
        <div style="color:#666;font-size:10px;margin-top:2px">${koord} ${o.ordu_isim || 'Ordu'}</div>
      </div>`;
    }).join('');
  }
  // v1.14.0.15: Kadim sehir saldirilari
  if (kadim.length > 0) {
    html += '<div style="font-size:10px;color:#9b59b6;margin:10px 0 4px;font-weight:bold;padding-top:8px;border-top:1px dashed #3a3020">🏛️ KADIM SEHIR ORDULARI</div>';
    html += kadim.map(k => {
      const yolda = k.faz === 'yolda';
      const uyari = k.faz === 'uyari';
      const renk = yolda ? '#e74c3c' : (uyari ? '#f39c12' : '#9b59b6');
      const ikon = yolda ? '⚔️' : (uyari ? '⚠️' : '⏳');
      const fazStr = yolda ? 'YOLDA' : (uyari ? 'HAREKETE HAZIR' : 'GERI SAYIM');
      const altin = (k.tahmini_altin || 0).toLocaleString('tr-TR');
      return `<div style="padding:8px 10px;margin-bottom:6px;background:rgba(0,0,0,0.3);border-left:3px solid ${renk};border-radius:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="color:${renk};font-weight:bold;font-size:12px">${ikon} ${fazStr}</span>
          <span style="color:#c8a96e;font-size:10px;font-weight:bold">${k.kalan_pg!=null?k.kalan_pg+' PG':'?'}</span>
        </div>
        <div style="color:#ccc;font-size:11px">${k.saldiran_sehir} → sana saldiriyor</div>
        <div style="color:#666;font-size:10px;margin-top:2px">Tetikleyici: ${k.ticaret_sehri} ticareti · Butce: ~${altin} altin</div>
      </div>`;
    }).join('');
  }
  // Ustumdeki buyuler
  if (buyuler.length > 0) {
    html += '<div style="font-size:10px;color:#c8a96e;margin:10px 0 4px;font-weight:bold;padding-top:8px;border-top:1px dashed #3a3020">🔮 ÜSTÜMDEKİ BÜYÜLER</div>';
    html += buyuler.map(b => {
      const agr = b.kategori === 'dusmana';
      const renk = agr ? '#c0392b' : '#3498db';
      const ikon = agr ? '🔮⚔️' : '✨';
      const atan = b.atan_kral ? ` · ${b.atan_kral}` : '';
      return `<div style="padding:6px 10px;margin-bottom:4px;background:rgba(0,0,0,0.3);border-left:3px solid ${renk};border-radius:4px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:${renk};font-weight:bold;font-size:11px">${ikon} ${b.isim} K${b.kademe}</span>
          <span style="color:#c8a96e;font-size:10px">${fmtK(b.kalan_saniye)}</span>
        </div>
        <div style="color:#888;font-size:10px">${agr ? 'Agresif' : 'Destek/Savunma'}${atan}</div>
      </div>`;
    }).join('');
  }
  wrap.innerHTML = html;
}

/* Sayfa yuklenince otomatik cagir */
document.addEventListener('DOMContentLoaded', initLayout);

/* v1.14.1.17 — Build stamp footer (hard refresh testi icin gorunur)
   Sayfanin sag-alt kosesinde sabit bir rozet — tarayicidaki gercek surum
   burada gorunur. Hard refresh sonrasi guncellenmediyse cache catili.
*/
// v1.14.3.9: Build stamp — tiklanabilir, cache temizleyip yenileme yapar
(function buildStamp(){
  const BUILD = 'v1.14.3.47';
  const TS    = '2026-05-10 Izci/Katip maas+dashboard UI fix + 7 SAVEPOINT bug (cron uretim)';
  function mount(){
    if (document.getElementById('build-stamp')) return;
    const div = document.createElement('div');
    div.id = 'build-stamp';
    div.style.cssText = 'position:fixed;left:8px;bottom:6px;z-index:9000;font:10px/1.2 "Cinzel",serif;color:#c8a96e;background:rgba(20,18,14,0.85);border:1px solid #3a3020;border-radius:4px;padding:3px 8px;letter-spacing:.5px;cursor:pointer;opacity:0.75;user-select:none;transition:all .15s';
    div.title = 'Tıkla: cache temizle + hard refresh (yeni deploy geldiyse görmek için)';
    div.innerHTML = '🔄 ' + BUILD + ' · ' + TS;
    div.addEventListener('mouseenter', () => { div.style.opacity = '1'; div.style.borderColor = '#d4af37'; });
    div.addEventListener('mouseleave', () => { div.style.opacity = '0.75'; div.style.borderColor = '#3a3020'; });
    div.addEventListener('click', async () => {
      div.innerHTML = '⏳ Cache temizleniyor...';
      try {
        // Service Worker unregister
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
        }
        // Cache Storage temizle
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch(e) {}
      // Hard reload (cache yoksay)
      location.reload(true);
    });
    document.body.appendChild(div);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* ═══════════════════════════════════════════════════════
   v1.14.3.36 — GLOBAL OZEL MESAJ BILDIRIM POLLING
   ═══════════════════════════════════════════════════════
   Her sayfada arka planda calisir.
   - 30 saniyede bir okunmamis ozel mesaj sayisini ceker
   - Sidebar'da #ozel-mesaj-badge'i gunceller (sayi gosterir)
   - Yeni mesaj geldiginde toast bildirimi cikarir
   - Browser sekmesi titreşir (favicon/title flash)
   - Notification API destekliyse desktop bildirim
   ═══════════════════════════════════════════════════════ */
(function _ozelMesajPolling() {
  if (typeof window === 'undefined') return;
  if (window._ozelMesajPollingActive) return;
  window._ozelMesajPollingActive = true;

  let lastOkunmamis = -1; // ilk fetch'te bildirim cikartmamak icin
  let originalTitle = document.title;
  let titleFlashInterval = null;

  function getApi() {
    return (typeof API_BASE !== 'undefined') ? API_BASE : 'https://palantis-backend-production.up.railway.app';
  }
  function getTok() {
    return localStorage.getItem('palantis_token');
  }

  function startTitleFlash(count) {
    if (titleFlashInterval) clearInterval(titleFlashInterval);
    let toggle = false;
    titleFlashInterval = setInterval(() => {
      toggle = !toggle;
      document.title = toggle ? `(${count} ✉) Yeni Mesaj — Noxara` : originalTitle;
    }, 1500);
    // Sayfa focus alinca dur
    window.addEventListener('focus', stopTitleFlash, { once: true });
  }
  function stopTitleFlash() {
    if (titleFlashInterval) { clearInterval(titleFlashInterval); titleFlashInterval = null; }
    document.title = originalTitle;
  }

  async function pollOzelMesaj() {
    const tok = getTok();
    if (!tok) return; // login degil
    try {
      const r = await fetch(getApi() + '/api/meydan/ozel', {
        headers: { 'Authorization': 'Bearer ' + tok }
      });
      if (!r.ok) return;
      const d = await r.json();
      const okunmamis = parseInt(d.okunmamis) || 0;

      // Sidebar badge guncelle (alt menu + ana menu)
      ['ozel-mesaj-badge', 'ozel-mesaj-badge-ana'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        if (okunmamis > 0) {
          b.style.display = 'inline-block';
          b.textContent = okunmamis;
          b.style.animation = 'pulseOzel 2s infinite';
        } else {
          b.style.display = 'none';
        }
      });

      // Yeni mesaj geldi mi? (ilk fetch'te lastOkunmamis=-1, bildirim verme)
      if (lastOkunmamis >= 0 && okunmamis > lastOkunmamis) {
        const yeni = okunmamis - lastOkunmamis;
        const yeniMesaj = (d.mesajlar || []).find(m => !m.okundu);
        const gonderen = yeniMesaj?.gonderen_adi ? String(yeniMesaj.gonderen_adi).slice(0, 30) : 'biri';
        // Toast bildirim (varsa) — toast.js showToast(msg, type) imzasi
        try {
          const toastMsg = `✉️ ${gonderen} size özel mesaj gönderdi!${yeni > 1 ? ' (+' + (yeni-1) + ' daha)' : ''}`;
          if (typeof showToast === 'function') showToast(toastMsg, 'info');
          else if (typeof toast === 'function') toast(toastMsg);
        } catch {}
        // Browser tab title flash
        startTitleFlash(okunmamis);
        // Desktop notification (kullanici izin verirse)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Noxara — Yeni Özel Mesaj', {
              body: `${gonderen} size mesaj gönderdi`,
              icon: '/icons/icon-192.svg',
              tag: 'noxara-ozel'
            });
          } catch {}
        }
      }

      lastOkunmamis = okunmamis;
    } catch (e) { /* sessiz fail */ }
  }

  // CSS ekle (badge pulse animasyon)
  if (!document.getElementById('ozel-mesaj-anim-css')) {
    const s = document.createElement('style');
    s.id = 'ozel-mesaj-anim-css';
    s.textContent = `
      @keyframes pulseOzel {
        0%,100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.6); }
        50%     { box-shadow: 0 0 0 6px rgba(231,76,60,0); }
      }
    `;
    document.head.appendChild(s);
  }

  // Notification permission iste (sadece bir kez, kullanici tetiklemesinden sonra)
  function notifPermBir() {
    if ('Notification' in window && Notification.permission === 'default') {
      // Kullanici etkilesimi sonra iste — agresif olmasin
      document.addEventListener('click', () => {
        if (Notification.permission === 'default') {
          try { Notification.requestPermission(); } catch {}
        }
      }, { once: true });
    }
  }

  // Init
  function init() {
    pollOzelMesaj(); // ilk fetch
    setInterval(pollOzelMesaj, 30000); // 30sn'de bir
    notifPermBir();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1500));
  } else {
    setTimeout(init, 1500);
  }
})();

/* ═══════════════════════════════════════════════════════
   v1.14.3.39 — Bot Koruma: nox-captcha.js'i dinamik yukle
   ═══════════════════════════════════════════════════════
   Her sayfada otomatik yuklenir (layout.js zaten her sayfada).
   Boylece tum HTML'lere tek tek <script> eklemek gerekmez.
   ═══════════════════════════════════════════════════════ */
(function _yukleNoxCaptcha() {
  if (typeof window === 'undefined') return;
  if (window.NoxCaptcha) return;
  const s = document.createElement('script');
  // js/ dizininde — relatif yol
  s.src = (location.pathname.includes('/') ? './js/' : 'js/') + 'nox-captcha.js?v=14390';
  s.async = false; // diger script'lerden once yuklensin
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════
   v1.14.3.38 — OTOMATIK GUNCELLEME UYARISI
   ═══════════════════════════════════════════════════════
   Hard refresh sorununu cozer: oyuncu sayfayi acik tutarken
   biz deploy yaparsak, 60 saniye icinde "Güncelleme var, Yenile" toast'u cikar.
   Tek tikla SW unregister + cache temizle + reload.

   Calisma mantigi:
   1. Sayfa yuklenince /api/version cek, ilk versiyonu localStorage'a yaz
   2. Her 60 saniyede /api/version yeniden cek
   3. Versiyon degisirse → goster:
      - Toast: "🔄 Yeni güncelleme — Tıkla yenile"
      - Sidebar/HUD'da kalici banner
   4. Banner'a/toast'a tiklayinca otomatik:
      - SW unregister + caches.delete + location.reload(true)
   ═══════════════════════════════════════════════════════ */
(function _versiyonPolling() {
  if (typeof window === 'undefined') return;
  if (window._noxVersionPollingActive) return;
  window._noxVersionPollingActive = true;

  const STORAGE_KEY = 'noxara_backend_version';
  let _bilinenVersiyon = null; // null = henuz ilk fetch yapilmadi
  let _bannerGosterildi = false;

  function getApi() {
    return (typeof API_BASE !== 'undefined') ? API_BASE : 'https://palantis-backend-production.up.railway.app';
  }

  async function temizleVeYenile() {
    try {
      // SW unregister
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      // Cache Storage temizle
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch(e) {}
    // Hard reload
    location.reload(true);
  }

  function bannerGoster(yeniVer) {
    if (_bannerGosterildi) return;
    _bannerGosterildi = true;

    // Sayfa ustunde sticky banner (yenilemeyi gormezden gelinemez)
    const banner = document.createElement('div');
    banner.id = 'nox-update-banner';
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0;
      background:linear-gradient(90deg,#d4af37,#b8941d);
      color:#0a0604; font-family:Cinzel,serif; font-weight:bold;
      padding:10px 16px; text-align:center; z-index:99998;
      cursor:pointer; box-shadow:0 2px 12px rgba(212,175,55,0.4);
      letter-spacing:0.5px; font-size:13px;
      animation:slideDownBanner 0.4s ease-out;
    `;
    banner.innerHTML = `🔄 <span style="margin:0 8px">YENİ GÜNCELLEME GELDİ</span>
      <span style="background:#0a0604;color:#d4af37;padding:3px 10px;border-radius:4px;margin-left:8px;font-size:11px">Tıkla → Otomatik Yenile</span>
      <span style="float:right;cursor:pointer;padding:0 8px" title="Şimdi değil — sonra yenilersin" onclick="event.stopPropagation();this.parentElement.remove();window._noxBannerGosterildi=false">✕</span>`;
    banner.onclick = temizleVeYenile;
    document.body.appendChild(banner);

    // Animation CSS
    if (!document.getElementById('nox-update-banner-css')) {
      const s = document.createElement('style');
      s.id = 'nox-update-banner-css';
      s.textContent = `
        @keyframes slideDownBanner {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `;
      document.head.appendChild(s);
    }

    // Toast (varsa) — banner ile beraber
    try {
      if (typeof showToast === 'function') {
        showToast('🔄 Yeni versiyon: ' + yeniVer + ' — Üst banner\'a tıkla', 'info');
      }
    } catch {}
  }

  async function checkVersion() {
    try {
      const r = await fetch(getApi() + '/api/version', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const ver = d.version;
      if (!ver) return;

      const localBilenen = localStorage.getItem(STORAGE_KEY);

      if (_bilinenVersiyon === null) {
        // Ilk fetch — localStorage ile karsilastir
        _bilinenVersiyon = ver;
        if (localBilenen && localBilenen !== ver) {
          // Sayfa yuklenirken zaten yeni versiyon varsa kullaniciya bildir (asset'leri eski olabilir)
          bannerGoster(ver);
        }
        localStorage.setItem(STORAGE_KEY, ver);
      } else if (ver !== _bilinenVersiyon) {
        // Sayfa acikken yeni deploy oldu
        _bilinenVersiyon = ver;
        localStorage.setItem(STORAGE_KEY, ver);
        bannerGoster(ver);
      }
    } catch (e) { /* sessiz fail */ }
  }

  function init() {
    checkVersion(); // ilk fetch
    setInterval(checkVersion, 60000); // 60 sn'de bir
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 3000));
  } else {
    setTimeout(init, 3000);
  }
})();
