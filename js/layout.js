/* =====================================================
   layout.js — Sidebar, HUD bar, Building Modal renderer
   Her sayfada initLayout() ile cagirilir
===================================================== */

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

  mount.innerHTML = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">PALANTIS</div>
      <div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;line-height:1.8">
        <div id="sidebar-kral" style="color:#ccc;font-family:'Cinzel',serif;font-size:12px">— Kral —</div>
        <div id="sidebar-irk" style="font-size:10px;color:#444">Irk seçilmedi</div>
        <div id="sidebar-cag" style="font-size:10px;color:#444">I. Çağ</div>
        <div id="sidebar-koord" style="font-size:10px;color:#555">📍 —</div>
      </div>

      <a href="home.html" class="menu-item${isActive('home.html')}">🏠 Ana Ekran</a>
      <a href="population.html" class="menu-item${isActive('population.html')||isActive('market.html')||isActive('cag.html')||isActive('festival.html')}">👥 Nüfus & İşçiler</a>
      <div class="submenu" id="submenu-population" style="display:${page==='population.html'||page==='market.html'||page==='cag.html'||page==='festival.html'?'block':'none'}">
        <a href="population.html" class="menu-item sub-item${isActive('population.html')}">👷 İşçi Dağılımı</a>
        <a href="market.html" class="menu-item sub-item${isActive('market.html')}">🏪 Market</a>
        <a href="cag.html" class="menu-item sub-item${isActive('cag.html')}">⬆️ Çağ Atla</a>
        <a href="festival.html" class="menu-item sub-item${isActive('festival.html')}">🎉 Festival</a>
      </div>

      <a href="city.html" class="menu-item${isActive('city.html')}">🏙️ Şehrim</a>
      <div class="submenu" id="submenu-city" style="display:${page==='city.html'?'block':'none'}">
        <div class="menu-item sub-item" onclick="setFilter('all',this)" data-filter="all">🏛️ Tümü</div>
        <div class="menu-item sub-item" onclick="setFilter('uretim',this)" data-filter="uretim">⚒️ Üretim</div>
        <div class="menu-item sub-item" onclick="setFilter('askeri',this)" data-filter="askeri">⚔️ Askeri</div>
        <div class="menu-item sub-item" onclick="setFilter('gelisim',this)" data-filter="gelisim">📚 Gelişim</div>
        <div class="menu-item sub-item" onclick="setFilter('sosyal',this)" data-filter="sosyal">🏛️ Sosyal</div>
        <div class="menu-item sub-item" onclick="setFilter('sehir',this)" data-filter="sehir">🏙️ Şehir</div>
        <div class="menu-item sub-item" onclick="setFilter('ozel',this)" data-filter="ozel">✨ Özel</div>
      </div>

      <a href="land.html" class="menu-item${isActive('land.html')}">🧭 Arazi</a>
      <a href="map.html" class="menu-item${isActive('map.html')}">🗺️ Harita</a>

      <a href="army.html" class="menu-item${isActive('army.html')}">⚔️ Ordu & Savaş</a>
      <div class="submenu" id="submenu-army" style="display:${page==='army.html'?'block':'none'}">
        <div class="menu-item sub-item army-sub on" data-atab="units" onclick="armyTab('units',this)">🗡️ Asker Eğitimi</div>
        <div class="menu-item sub-item army-sub" data-atab="armies" onclick="armyTab('armies',this)">🏕️ Ordu Yönetimi</div>
        <div class="menu-item sub-item army-sub" data-atab="formation" onclick="armyTab('formation',this)">⚔️ Saf Dizilimi</div>
        <div class="menu-item sub-item army-sub" data-atab="upgrades" onclick="armyTab('upgrades',this)">📈 Geliştirmeler</div>
      </div>

      <a href="magic.html" class="menu-item${isActive('magic.html')}">🧙 Büyüler</a>
      <a href="guild.html" class="menu-item${isActive('guild.html')}">🏰 Guild</a>

      <a href="reports.html" class="menu-item${isActive('reports.html')||isActive('activity.html')}">📜 Raporlar</a>
      <div class="submenu" id="submenu-reports" style="display:${page==='reports.html'||page==='activity.html'?'block':'none'}">
        <a href="activity.html" class="menu-item sub-item${isActive('activity.html')}">🏙️ Şehir Raporları</a>
        <a href="reports.html?tab=askeri" class="menu-item sub-item">⚔️ Askeri Raporlar</a>
        <a href="reports.html?tab=koloni" class="menu-item sub-item">🏰 Koloni Raporları</a>
        <a href="reports.html?tab=ekonomi" class="menu-item sub-item">💰 Ekonomi Raporları</a>
      </div>

      <!-- Logout -->
      <div style="margin-top:auto;padding:12px 10px;border-top:1px solid #1a1a1a">
        <button onclick="logoutGame()" style="width:100%;padding:9px;background:#1a0a0a;border:1px solid #3a1a1a;color:#c0392b;border-radius:4px;cursor:pointer;font-size:13px;letter-spacing:0.5px;transition:background .2s"
          onmouseover="this.style.background='#2a0d0d'" onmouseout="this.style.background='#1a0a0a'">
          🚪 Oyundan Çık
        </button>
      </div>
    </div>
  `;
}

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
    <!-- HAM: Odun Metal Bugday Balik CigEt Tas Altin -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">HAM</div>
      <div class="hud-res-row hud-aligned">
        ${sb('ODUN','🌳','Odun','hud-w','hud-wg')}
        <div class="stat-box" data-tip="METAL"><span class="res-icon">${metalSvg}</span><div class="res-details"><span class="res-label">Metal</span><span class="res-amount" id="hud-m">0</span><span class="res-rate pos" id="hud-mg">+0</span></div></div>
        ${sb('BUĞDAY','🌾','Buğday','hud-bu','hud-bug')}
        ${sb('BALIK','🎣','Balık','hud-ba','hud-bag')}
        ${sb('ÇİĞ ET','🥩','Çiğ Et','hud-ce',null)}
        ${sb('TAŞ','🪨','Taş','hud-t','hud-tg')}
        ${sb('ALTIN','💰','Altın','hud-g','hud-gg')}
      </div>
    </div>
    <!-- ISL: Kereste IslMetal Ekmek PisBal PisEt (bos) (bos) — ayni sirada -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">İŞL.</div>
      <div class="hud-res-row hud-aligned">
        ${sb('KERESTE','🪵','Kereste','hud-ke',null)}
        <div class="stat-box" data-tip="İŞL.METAL"><span class="res-icon">${islSvg}</span><div class="res-details"><span class="res-label">İşl.Metal</span><span class="res-amount" id="hud-is">0</span></div></div>
        ${sb('EKMEK','🍞','Ekmek','hud-ek',null)}
        ${sb('PİŞ.BALIK','🍳','Piş.Balık','hud-pb',null)}
        ${sb('PİŞ.ET','🍖','Piş.Et','hud-pe',null)}
        <div class="stat-box stat-empty"></div>
        <div class="stat-box stat-empty"></div>
      </div>
    </div>
    <!-- GENEL -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">GENEL</div>
      <div class="hud-res-row">
        ${sb('MUTLULUK','😊','Mutluluk','hud-sehir-moral',null)}
        ${sb('O.MORAL','⚔️','O.Moral','hud-moral',null)}
        ${sb('AÇLIK','🍽️','Açlık','hud-hunger',null)}
        ${sb('NÜFUS','👥','Nüfus','hud-nufus-box',null)}
        ${sb('ALAN','📐','Alan','hud-alan-box',null)}
        ${sb('ÇAĞ','🧱','Çağ','hud-limit',null)}
        ${sb('ŞEHİR','🏰','Ş.Değeri','hud-sehir-deger',null)}
        <div class="stat-box mana-box" data-tip="BEYAZ MANA" style="border-left:2px solid #f0e8d8"><span class="res-icon">🤍</span><div class="res-details"><span class="res-label" style="color:#f0e8d8">B.Mana</span><span class="res-amount" id="hud-mana-beyaz">0</span><span class="res-rate" id="hud-mana-beyaz-g"></span></div></div>
        <div class="stat-box mana-box" data-tip="KIRMIZI MANA" style="border-left:2px solid #e74c3c"><span class="res-icon">❤️</span><div class="res-details"><span class="res-label" style="color:#e74c3c">K.Mana</span><span class="res-amount" id="hud-mana-kirmizi">0</span><span class="res-rate" id="hud-mana-kirmizi-g"></span></div></div>
        <div class="stat-box mana-box" data-tip="MAVİ MANA" style="border-left:2px solid #3498db"><span class="res-icon">💙</span><div class="res-details"><span class="res-label" style="color:#3498db">M.Mana</span><span class="res-amount" id="hud-mana-mavi">0</span><span class="res-rate" id="hud-mana-mavi-g"></span></div></div>
        <div class="stat-box mana-box" data-tip="YEŞİL MANA" style="border-left:2px solid #2ecc71"><span class="res-icon">💚</span><div class="res-details"><span class="res-label" style="color:#2ecc71">Y.Mana</span><span class="res-amount" id="hud-mana-yesil">0</span><span class="res-rate" id="hud-mana-yesil-g"></span></div></div>
        ${sb('TARİH','📅','Tarih','hud-takvim',null)}
        ${sb('SAAT','⏰','Saat','c-now',null)}
        ${sb('P.G.','⏳','P.G.','c-next',null)}
      </div>
    </div>
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
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;pointer-events:all;' +
    'background:rgba(0,0,0,0.92);transition:opacity 1s ease;opacity:0;' +
    'display:none;flex-direction:column;align-items:center;justify-content:center;';
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
    #day-transition-overlay.active { display:flex!important;opacity:1; }
    #day-transition-overlay.fade-out { opacity:0; }
    body.dt-locked .btn-action, body.dt-locked button:not(.atab) { pointer-events:none!important;opacity:0.5!important; }
    .dt-sunset { background:radial-gradient(circle,#e74c3c,#c0392b,#7b241c)!important; box-shadow:0 0 60px #e74c3c,0 0 120px #c0392b55!important; animation:dtSunSet 3s ease-in forwards!important; }
    .dt-sunrise { background:radial-gradient(circle,#f1c40f,#e67e22,#d35400)!important; box-shadow:0 0 60px #f39c12,0 0 120px #e67e2255!important; animation:dtSunRise 3s ease-out forwards!important; }
  `;
  document.head.appendChild(style);

  let dtActive = false;
  let dtDismissed = false;
  let lastCheckedHour = -1;

  setInterval(() => {
    const now = new Date();
    const min = now.getMinutes();
    const hour = now.getHours();

    // Saat değişti — reset dismiss flag
    if (hour !== lastCheckedHour) {
      dtDismissed = false;
      lastCheckedHour = hour;
    }

    // XX:59 — gün dönüyor
    // XX:59 — GÜN BATIMI başlat
    if (min >= 59 && !dtActive && !dtDismissed) {
      dtActive = true;
      document.body.classList.add('dt-locked');
      overlay.style.display = 'flex';
      overlay.style.background = 'rgba(20,5,0,0.95)';
      requestAnimationFrame(() => overlay.classList.add('active'));
      // Güneş batıyor
      const sun = document.getElementById('dt-sun');
      if (sun) { sun.className = 'dt-sunset'; sun.style.opacity = '1'; }
      const titleEl = document.getElementById('dt-title');
      if (titleEl) { titleEl.textContent = '🌅 Gün Batıyor...'; titleEl.style.color = '#e67e22'; }
      const subEl = document.getElementById('dt-subtitle');
      if (subEl) subEl.textContent = 'Gece yaklaşıyor';
    }

    // XX:01 — GÜN DOĞUMU + kapat
    if (min >= 1 && min <= 2 && dtActive) {
      overlay.style.background = 'rgba(0,0,0,0.92)';
      const sun = document.getElementById('dt-sun');
      if (sun) { sun.className = 'dt-sunrise'; }
      const titleEl = document.getElementById('dt-title');
      if (titleEl) { titleEl.textContent = '☀️ Güneş Doğdu!'; titleEl.style.color = '#f1c40f'; }
      const subEl = document.getElementById('dt-subtitle');
      if (subEl) subEl.textContent = 'Kaynaklar güncellendi';

      setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.classList.remove('active', 'fade-out');
          overlay.style.display = 'none';
          document.body.classList.remove('dt-locked');
          dtActive = false;
          dtDismissed = true;
          if (typeof loadGameData === 'function') loadGameData();
        }, 1200);
      }, 3000);
    }
  }, 1000);
}

/* Sayfa yuklenince otomatik cagir */
document.addEventListener('DOMContentLoaded', initLayout);
