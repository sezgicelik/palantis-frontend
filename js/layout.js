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

  // v1.13.13: 6 ana grup (Kralligim / Savas / Ticaret / Dunya / Aktivite / Eglence)
  const krallikPages = ['city.html','population.html','festival.html','land.html'];
  const savasPages   = ['army.html','savas-baslat.html','mezarlik.html','casus.html','magic.html','buyucu-kulesi.html'];
  const ticPages     = ['market.html','kervan.html','pazar.html','buyu-dukkani.html'];
  const dunyaPages   = ['map.html','guild.html','cag.html'];
  const aktivitePages= ['gorev.html','reports.html','activity.html','siralama.html','artifact.html','meydan.html'];
  const funPages     = ['bocek-yarisi.html','sandik.html'];

  const isKrallik  = krallikPages.includes(page);
  const isSavas    = savasPages.includes(page);
  const isTic      = ticPages.includes(page);
  const isDunya    = dunyaPages.includes(page);
  const isAktivite = aktivitePages.includes(page);
  const isFun      = funPages.includes(page);

  // Hizli Erisim pinli menuler (localStorage, max 5)
  let hizliMenuler = [];
  try {
    const raw = localStorage.getItem('noxara_hizli_menu');
    if (raw) hizliMenuler = (JSON.parse(raw) || []).slice(0, 5);
  } catch(e) {}

  mount.innerHTML = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">NOXARA</div>
      <div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;line-height:1.8">
        <div id="sidebar-kral" style="color:#ccc;font-family:'Cinzel',serif;font-size:12px">— Kral —</div>
        <div id="sidebar-irk" style="font-size:10px;color:#444">Irk seçilmedi</div>
        <div id="sidebar-cag" style="font-size:10px;color:#444">I. Çağ</div>
        <div id="sidebar-koord" style="font-size:10px;color:#555">📍 —</div>
      </div>

      <a href="home.html" class="menu-item${isActive('home.html')}">🏠 Ana Ekran</a>

      ${hizliMenuler.length > 0 ? `
      <div style="padding:6px 14px 4px;font-size:9px;color:#666;letter-spacing:1.5px;border-top:1px solid #1a1a1a;margin-top:4px">★ HIZLI ERİŞİM</div>
      ${hizliMenuler.map(h => `<a href="${h.href}" class="menu-item${isActive(h.href)}" style="padding-left:18px;border-left:2px solid #d4af37;font-size:12px">${h.icon||'⭐'} ${h.label}</a>`).join('')}
      <div style="border-bottom:1px solid #1a1a1a;margin:4px 0"></div>
      ` : ''}

      <a href="city.html" class="menu-item${isKrallik?' on':''}">🏰 Krallığım</a>
      <div class="submenu" style="display:${isKrallik?'block':'none'}">
        <a href="city.html" class="menu-item sub-item${isActive('city.html')}">🏗️ Şehrim</a>
        <a href="population.html" class="menu-item sub-item${isActive('population.html')}">👥 Nüfus & İşçiler</a>
        <a href="land.html" class="menu-item sub-item${isActive('land.html')}">🧭 Arazi</a>
        <a href="festival.html" class="menu-item sub-item${isActive('festival.html')}">🎉 Festival</a>
      </div>

      <a href="army.html" class="menu-item${isSavas?' on':''}">⚔️ Savaş & Askeri</a>
      <div class="submenu" style="display:${isSavas?'block':'none'}">
        <a href="army.html" class="menu-item sub-item${isActive('army.html')}">🗡️ Ordu</a>
        <a href="savas-baslat.html" class="menu-item sub-item${isActive('savas-baslat.html')}">🏹 Savaş Başlat</a>
        <a href="mezarlik.html" class="menu-item sub-item${isActive('mezarlik.html')}">💀 Mezarlık</a>
        <a href="casus.html" class="menu-item sub-item${isActive('casus.html')}">🕵️ Casuslar</a>
        <a href="magic.html" class="menu-item sub-item${isActive('magic.html')}">🕯️ Tapınak & Mana</a>
        <a href="buyucu-kulesi.html" class="menu-item sub-item${isActive('buyucu-kulesi.html')}">🗼 Büyücü Kulesi</a>
      </div>

      <a href="market.html" class="menu-item${isTic?' on':''}">💰 Ticaret</a>
      <div class="submenu" style="display:${isTic?'block':'none'}">
        <a href="market.html" class="menu-item sub-item${isActive('market.html')}">🏪 Market</a>
        <a href="kervan.html" class="menu-item sub-item${isActive('kervan.html')}">🐪 Kervan</a>
        <a href="pazar.html" class="menu-item sub-item${isActive('pazar.html')}">🤝 Oyuncu Pazarı</a>
        <a href="buyu-dukkani.html" class="menu-item sub-item${isActive('buyu-dukkani.html')}">🔮 Büyü Dükkanı</a>
      </div>

      <a href="map.html" class="menu-item${isDunya?' on':''}">🌍 Dünya</a>
      <div class="submenu" style="display:${isDunya?'block':'none'}">
        <a href="map.html" class="menu-item sub-item${isActive('map.html')}">🗺️ Harita</a>
        <a href="guild.html" class="menu-item sub-item${isActive('guild.html')}">🏰 Guild</a>
        <a href="cag.html" class="menu-item sub-item${isActive('cag.html')}">📅 Çağ Atlama</a>
      </div>

      <a href="gorev.html" class="menu-item${isAktivite?' on':''}">📊 Aktivite</a>
      <div class="submenu" style="display:${isAktivite?'block':'none'}">
        <a href="gorev.html" class="menu-item sub-item${isActive('gorev.html')}">📜 Görevler <span id="gorev-badge" style="display:none;background:#e74c3c;color:#fff;font-size:8px;padding:1px 5px;border-radius:8px;margin-left:4px"></span></a>
        <a href="activity.html" class="menu-item sub-item${isActive('activity.html')}">🏙️ Şehir Raporları</a>
        <a href="reports.html?tab=askeri" class="menu-item sub-item">⚔️ Askeri Raporlar</a>
        <a href="reports.html?tab=koloni" class="menu-item sub-item">🏰 Koloni Raporları</a>
        <a href="reports.html?tab=ekonomi" class="menu-item sub-item">💰 Ekonomi Raporları</a>
        <a href="siralama.html" class="menu-item sub-item${isActive('siralama.html')}">🏆 Sıralamalar</a>
        <a href="artifact.html" class="menu-item sub-item${isActive('artifact.html')}">🧰 Artifactlar</a>
        <a href="meydan.html" class="menu-item sub-item${isActive('meydan.html')}">💬 Şehir Meydanı</a>
      </div>

      <a href="bocek-yarisi.html" class="menu-item${isFun?' on':''}">🪲 Eğlence</a>
      <div class="submenu" style="display:${isFun?'block':'none'}">
        <a href="bocek-yarisi.html" class="menu-item sub-item${isActive('bocek-yarisi.html')}">🪲 Böcek Yarışı</a>
        <a href="sandik.html" class="menu-item sub-item${isActive('sandik.html')}">📦 Kader Sandıkları</a>
        <a href="simulator.html" class="menu-item sub-item" target="_blank">⚔️ Savaş Simülatörü</a>
      </div>

      <a href="premium.html" class="menu-item${isActive('premium.html')}" style="color:#d4af37">⚜ Premium</a>
      <a href="ayarlar.html" class="menu-item${isActive('ayarlar.html')}">⚙️ Ayarlar</a>

      <!-- Logout — sticky bottom -->
      <div style="position:sticky;bottom:0;padding:10px;border-top:1px solid #1a1a1a;background:inherit;z-index:10">
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
    <!-- Ateşkes / Tatil Banner -->
    <div id="hud-ateskes-banner" style="display:none;background:rgba(231,76,60,0.15);border-bottom:1px solid rgba(231,76,60,0.3);padding:3px 10px;text-align:center;font-size:9px;color:#e74c3c;font-family:Cinzel,serif;letter-spacing:1px">⚔️ ATEŞKES AKTİF</div>
    <div id="hud-tatil-banner" style="display:none;background:rgba(46,204,113,0.15);border-bottom:1px solid rgba(46,204,113,0.3);padding:3px 10px;text-align:center;font-size:9px;color:#2ecc71;font-family:Cinzel,serif;letter-spacing:1px">🏖️ TATİL MODU</div>
    <!-- HAM: Odun Metal Bugday Balik CigEt Altin -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">HAM</div>
      <div class="hud-res-row hud-aligned">
        ${sb('ODUN','🌳','Odun','hud-w','hud-wg')}
        <div class="stat-box" data-tip="METAL"><span class="res-icon">${metalSvg}</span><div class="res-details"><span class="res-label">Metal</span><span class="res-amount" id="hud-m">0</span><span class="res-rate pos" id="hud-mg">+0</span></div></div>
        ${sb('BUĞDAY','🌾','Buğday','hud-bu','hud-bug')}
        ${sb('BALIK','🎣','Balık','hud-ba','hud-bag')}
        ${sb('ÇİĞ ET','🥩','Çiğ Et','hud-ce',null)}
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
    <!-- MANA (v1.13.22: Genel'in ustune alindi) -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">MANA</div>
      <div class="hud-res-row">
        <div class="stat-box mana-box" data-tip="BEYAZ MANA" style="border-left:2px solid #f0e8d8"><span class="res-icon">🤍</span><div class="res-details"><span class="res-label" style="color:#f0e8d8">B.Mana</span><span class="res-amount" id="hud-mana-beyaz">0</span><span class="res-rate" id="hud-mana-beyaz-g"></span></div></div>
        <div class="stat-box mana-box" data-tip="KIRMIZI MANA" style="border-left:2px solid #e74c3c"><span class="res-icon">❤️</span><div class="res-details"><span class="res-label" style="color:#e74c3c">K.Mana</span><span class="res-amount" id="hud-mana-kirmizi">0</span><span class="res-rate" id="hud-mana-kirmizi-g"></span></div></div>
        <div class="stat-box mana-box" data-tip="MAVİ MANA" style="border-left:2px solid #3498db"><span class="res-icon">💙</span><div class="res-details"><span class="res-label" style="color:#3498db">M.Mana</span><span class="res-amount" id="hud-mana-mavi">0</span><span class="res-rate" id="hud-mana-mavi-g"></span></div></div>
        <div class="stat-box mana-box" data-tip="YEŞİL MANA" style="border-left:2px solid #2ecc71"><span class="res-icon">💚</span><div class="res-details"><span class="res-label" style="color:#2ecc71">Y.Mana</span><span class="res-amount" id="hud-mana-yesil">0</span><span class="res-rate" id="hud-mana-yesil-g"></span></div></div>
        ${sb('EŞEK','🫏','Eşek','hud-essek',null)}
      </div>
    </div>
    <!-- GUILD (v1.13.2 — sadece guilddeyse goster) -->
    <div class="hud-row-wrap" id="hud-guild-row" style="display:none">
      <div class="hud-row-lbl">GUILD</div>
      <div class="hud-res-row hud-aligned" id="hud-guild-stats"></div>
    </div>
    <!-- GENEL (v1.13.22: Mana'nin altina alindi) -->
    <div class="hud-row-wrap">
      <div class="hud-row-lbl">GENEL</div>
      <div class="hud-res-row">
        ${sb('MUTLULUK','😊','Mutluluk','hud-sehir-moral',null)}
        ${sb('O.MORAL','⚔️','O.Moral','hud-moral',null)}
        ${sb('AÇLIK','🍽️','Açlık','hud-hunger',null)}
        ${sb('NÜFUS','👥','Nüfus','hud-nufus-box',null)}
        ${sb('ALAN','📐','Alan','hud-alan-box',null)}
        ${sb('ŞEHİR','🏰','Ş.Değeri','hud-sehir-deger',null)}
        ${sb('TARİH','📅','Tarih','hud-takvim',null)}
        ${sb('SAAT','⏰','Saat','c-now',null)}
        <!-- v1.13.33: 4 tehdit/destek gostergesi (sadece > 0 iken gorunur) -->
        <!-- 1. Gelen Saldiri Ordusu -->
        <div id="hud-sald-btn" class="stat-box" data-tip="GELEN SALDIRI ORDUSU" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #e74c3c;background:rgba(231,76,60,0.08)">
          <span class="res-icon">⚔️</span>
          <div class="res-details">
            <span class="res-label" style="color:#e74c3c">Saldırı</span>
            <span class="res-amount" id="hud-sald-sayi" style="color:#e74c3c">0</span>
          </div>
        </div>
        <!-- 2. Gelen Destek Ordusu -->
        <div id="hud-takv-btn" class="stat-box" data-tip="GELEN DESTEK ORDUSU" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #2ecc71;background:rgba(46,204,113,0.08)">
          <span class="res-icon">🛡️</span>
          <div class="res-details">
            <span class="res-label" style="color:#2ecc71">Destek</span>
            <span class="res-amount" id="hud-takv-sayi" style="color:#2ecc71">0</span>
          </div>
        </div>
        <!-- 3. Ustumdeki Agresif Buyu -->
        <div id="hud-buagr-btn" class="stat-box" data-tip-below="USTUMDEKI AGRESIF BUYULER" onclick="toggleGelenOrdular()" style="display:none;cursor:pointer;border-left:2px solid #c0392b;background:rgba(192,57,43,0.08)">
          <span class="res-icon">🔮</span>
          <div class="res-details">
            <span class="res-label" style="color:#c0392b">A.Büyü</span>
            <span class="res-amount" id="hud-buagr-sayi" style="color:#c0392b">0</span>
          </div>
        </div>
        <!-- 4. Ustumdeki Defansif Buyu -->
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
    <!-- v1.13.42.2: Gelen ordular detay paneli HUD'un altinda + sayfada scroll olabilir (yukarı taşmaz) -->
    <div id="hud-gelen-panel" style="display:none;position:fixed;top:160px;right:10px;width:360px;max-width:92vw;max-height:calc(100vh - 180px);overflow-y:auto;background:linear-gradient(180deg,#1a0e06,#110804);border:1px solid #c0392b;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.8);z-index:99998;padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(231,76,60,0.3)">
        <span style="font-family:'Cinzel',serif;color:#e74c3c;font-size:13px;font-weight:bold">🎯 Şehrime Gelen Ordular</span>
        <button onclick="toggleGelenOrdular()" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px">✕</button>
      </div>
      <div id="hud-gelen-liste" style="font-size:11px;color:#aaa">Yukleniyor...</div>
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

  // v1.13.30: Kuyruk widget mount + polling (60sn)
  renderKuyrukMount();
  loadKuyrukOzet();
  setInterval(loadKuyrukOzet, 60000);

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
  { href: 'savas-baslat.html',  label: 'Savaş Başlat',     icon: '🏹', grup: 'Savaş' },
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
  { href: 'activity.html',      label: 'Şehir Raporları',  icon: '🏙️', grup: 'Aktivite' },
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

function renderKuyrukWidget() {
  if (!KUYRUK_CACHE) return;
  const d = KUYRUK_CACHE;
  const toplam = d.toplam || 0;
  const toplamEl = document.getElementById('kuyruk-toplam');
  const aciciSayi = document.getElementById('kuyruk-acici-sayi');
  if (toplamEl) toplamEl.textContent = toplam;
  if (aciciSayi) aciciSayi.textContent = toplam;

  // Kategori sırası + icon
  const cats = [
    { key:'bina',        label:'🏗️ Binalar',       link:'city.html' },
    { key:'tamir',       label:'🔧 Tamir',          link:'city.html' },
    { key:'unite',       label:'⚔️ Üniteler',       link:'army.html' },
    { key:'guild_bina',  label:'🏰 Guild Bina',     link:'guild.html' },
    { key:'guild_unite', label:'🛡️ Guild Ordu',    link:'guild.html' },
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
      html += '<div style="font-size:10px;color:#999;padding:2px 0;display:flex;justify-content:space-between;gap:8px">' +
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + it.ad + '</span>' +
        '<span style="color:#d4af37;flex-shrink:0">' + kalanFmt + '</span>' +
      '</div>';
    }
    if (liste.length > 3) {
      html += '<div style="font-size:9px;color:#555;text-align:right">+' + (liste.length - 3) + ' daha…</div>';
    }
    html += '</a>';
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
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #3a3020;background:#0f0a06;border-radius:8px 8px 0 0">' +
        '<span style="color:#c8a96e;font-size:12px;font-weight:bold">⏳ Kuyruğum <span id="kuyruk-toplam" style="color:#d4af37">0</span></span>' +
        '<div style="display:flex;gap:2px">' +
          '<button onclick="kuyrukWidgetToggle()" style="background:none;border:1px solid #3a3020;color:#888;font-size:14px;cursor:pointer;width:24px;height:22px;border-radius:3px" title="Sımarla/Aç">−</button>' +
          '<button onclick="kuyrukWidgetKapat()" style="background:none;border:1px solid #3a3020;color:#888;font-size:14px;cursor:pointer;width:24px;height:22px;border-radius:3px" title="Kapat">✕</button>' +
        '</div>' +
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

function renderGelenOrdularPanel() {
  const wrap = document.getElementById('hud-gelen-liste');
  if (!wrap) return;
  const d = _gelenOrdularCache;
  const ordular = d?.ordular || [];
  const buyuler = d?.ustume_buyu_detay || [];
  if (ordular.length === 0 && buyuler.length === 0) {
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
