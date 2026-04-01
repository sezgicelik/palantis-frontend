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
      </div>

      <a href="home.html" class="menu-item${isActive('home.html')}" onclick="toggleSubMenu('submenu-home',this)">🏠 Ana Ekran</a>
      <div id="submenu-home" style="display:${page==='home.html'||page==='activity.html'?'block':'none'};background:#0a0a0a;border-left:2px solid #2a2a2a;margin:0">
        <a href="activity.html" class="menu-item sub-item${isActive('activity.html')}" style="padding:6px 6px 6px 28px;font-size:12px">📜 Şehirde Olanlar</a>
      </div>

      <a href="population.html" class="menu-item${isActive('population.html')}">👥 Nüfus & İşçiler</a>

      <a href="city.html" class="menu-item${isActive('city.html')}" onclick="toggleSubMenu('submenu-city',this)">🏙️ Şehrim</a>
      <div id="submenu-city" style="display:${page==='city.html'?'block':'none'};background:#0a0a0a;border-left:2px solid #2a2a2a;margin:0">
        <div class="menu-item sub-item" onclick="setFilter('all',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="all">🏛️ Tümü</div>
        <div class="menu-item sub-item" onclick="setFilter('uretim',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="uretim">⚒️ Üretim</div>
        <div class="menu-item sub-item" onclick="setFilter('askeri',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="askeri">⚔️ Askeri</div>
        <div class="menu-item sub-item" onclick="setFilter('gelisim',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="gelisim">📚 Gelişim</div>
        <div class="menu-item sub-item" onclick="setFilter('sosyal',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="sosyal">🏛️ Sosyal</div>
        <div class="menu-item sub-item" onclick="setFilter('sehir',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="sehir">🏙️ Şehir</div>
        <div class="menu-item sub-item" onclick="setFilter('ozel',this)" style="padding:6px 6px 6px 28px;font-size:12px" data-filter="ozel">✨ Özel</div>
      </div>

      <a href="land.html" class="menu-item${isActive('land.html')}">🧭 Arazi</a>

      <a href="army.html" class="menu-item${isActive('army.html')}" onclick="toggleSubMenu('submenu-army',this)">⚔️ Ordu & Savaş</a>
      <div id="submenu-army" style="display:${page==='army.html'?'block':'none'};background:#0a0a0a;border-left:2px solid #2a2a2a;margin:0">
        <div class="menu-item sub-item army-sub on" data-atab="units" onclick="armyTab('units',this)" style="padding:6px 6px 6px 28px;font-size:12px">🗡️ Asker Eğitimi</div>
        <div class="menu-item sub-item army-sub" data-atab="soldier" onclick="armyTab('soldier',this)" style="padding:6px 6px 6px 28px;font-size:12px">🪖 Asker Yönetimi</div>
        <div class="menu-item sub-item army-sub" data-atab="armies" onclick="armyTab('armies',this)" style="padding:6px 6px 6px 28px;font-size:12px">🏕️ Ordu Yönetimi</div>
        <div class="menu-item sub-item army-sub" data-atab="formation" onclick="armyTab('formation',this)" style="padding:6px 6px 6px 28px;font-size:12px">⚔️ Saf Dizilimi</div>
        <div class="menu-item sub-item army-sub" data-atab="upgrades" onclick="armyTab('upgrades',this)" style="padding:6px 6px 6px 28px;font-size:12px">📈 Geliştirmeler</div>
      </div>

      <a href="magic.html" class="menu-item${isActive('magic.html')}">🧙 Büyüler</a>
      <a href="guild.html" class="menu-item${isActive('guild.html')}">🏰 Guild</a>
      <a href="reports.html" class="menu-item${isActive('reports.html')}">📜 Raporlar</a>

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

  mount.innerHTML = `
  <div class="top-bar hudbar" id="hudbar">
    <!-- HAM MADDELEr -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">HAM</div>
      <div class="hud-res-row" id="hud-panel-ham">
        <div class="hud-res-item" data-tip="ODUN">🌳 <b id="hud-w">0</b><span class="hg"> +<span id="hud-wg">0</span></span></div>
        <div class="hud-res-item" data-tip="METAL"><svg width="15" height="11" viewBox="0 0 15 11" style="display:inline-block;vertical-align:-1px"><path d="M2,1 L13,1 L11,10 L4,10 Z" fill="#8a8a8a" stroke="#666" stroke-width="0.5"/><path d="M4,3 L11,3 L9.5,8.5 L5.5,8.5 Z" fill="#b0b0b0"/></svg> <b id="hud-m">0</b><span class="hg"> +<span id="hud-mg">0</span></span></div>
        <div class="hud-res-item" data-tip="BUĞDAY">🌾 <b id="hud-bu">0</b><span class="hg"> +<span id="hud-bug">0</span></span></div>
        <div class="hud-res-item" data-tip="BALIK">🎣 <b id="hud-ba">0</b><span class="hg"> +<span id="hud-bag">0</span></span></div>
        <div class="hud-res-item" data-tip="TAŞ">🪨 <b id="hud-t">0</b><span class="hg"> +<span id="hud-tg">0</span></span></div>
        <div class="hud-res-item" data-tip="ALTIN">💰 <b id="hud-g">0</b><span class="hg"> +<span id="hud-gg">0</span></span></div>
      </div>
    </div>
    <!-- İŞLENMİŞ -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">İŞL.</div>
      <div class="hud-res-row" id="hud-panel-islenmis">
        <div class="hud-res-item" data-tip="KERESTE">🪵 <b id="hud-ke">0</b></div>
        <div class="hud-res-item" data-tip="İŞLENMİŞ METAL">🔩 <b id="hud-is">0</b></div>
        <div class="hud-res-item" data-tip="EKMEK">🍞 <b id="hud-ek">0</b></div>
        <div class="hud-res-item" data-tip="PİŞMİŞ BALIK">🍳 <b id="hud-pb">0</b></div>
        <div class="hud-res-item" data-tip="ÇİĞ ET">🥩 <b id="hud-ce">0</b></div>
        <div class="hud-res-item" data-tip="PİŞMİŞ ET">🍖 <b id="hud-pe">0</b></div>
      </div>
    </div>
    <!-- GENEL -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">GENEL</div>
      <div class="hud-res-row" id="hud-panel-genel">
        <div class="hud-res-item" data-tip="ORDU MORALİ">😊 <b id="hud-moral">—</b></div>
        <div class="hud-res-item" data-tip="AÇLIK">🍽️ <b id="hud-hunger">—</b></div>
        <div class="hud-res-item" data-tip="KULLANILAN / TOPLAM">👥 <b><span id="hud-nufus">—</span>/<span id="hud-nufus-sinir">—</span></b></div>
        <div class="hud-res-item" data-tip="KULLANILAN ALAN">📐 <b><span id="hud-used">0</span>/<span id="hud-land">0</span></b></div>
        <div class="hud-res-item" data-tip="ÇAĞ LİMİTİ">🧱 <b id="hud-limit">—</b></div>
        <div class="hud-res-item" data-tip="PALANTİS TARİHİ">📅 <b id="hud-takvim">—</b></div>
        <div class="hud-res-item" data-tip="ŞU ANKİ SAAT">⏰ <b id="c-now">—</b></div>
        <div class="hud-res-item" data-tip="SONRAKİ P.G.">⏳ <b id="c-next">—</b></div>
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
}

/* Sayfa yuklenince otomatik cagir */
document.addEventListener('DOMContentLoaded', initLayout);
