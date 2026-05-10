/* ══════════════════════════════════════════════════════════
   Noxara — EPIK OLAY ANIMASYONU (v1.14.3.65)
   Tam ekran 60 saniyelik gosterim:
     0-30 sn: yumurta sahnesi (bebek ejder yumurtadan cikiyor)
     30-60 sn: buyuk hali (yetiskin ejder hazinede)
   Tetikleyici: bildirim-popup.js — bildirim tipi 'epik_ejderha'
   Image asset: img/events/altin_ejder_yumurta.jpg + altin_ejder_buyuk.jpg
   Kullanici tikla = atla (skip).
   ══════════════════════════════════════════════════════════ */

(function() {
  if (window.__epikOlayLoaded) return;
  window.__epikOlayLoaded = true;

  // CSS bir kez enjekte
  if (!document.getElementById('epik-olay-style')) {
    var st = document.createElement('style');
    st.id = 'epik-olay-style';
    st.textContent = [
      '#epik-overlay {',
      '  position:fixed; inset:0; z-index:100000; display:none;',
      '  align-items:center; justify-content:center; flex-direction:column;',
      '  background:#000; opacity:0; transition:opacity 0.8s ease;',
      '  cursor:pointer;',
      '}',
      '#epik-overlay.active { display:flex; opacity:1; }',
      '#epik-overlay.fadeout { opacity:0; }',
      '#epik-bg {',
      '  position:absolute; inset:0; width:100%; height:100%;',
      '  background-size:cover; background-position:center; opacity:0;',
      '  transition:opacity 1.5s ease, transform 30s linear;',
      '  filter:brightness(0.85);',
      '}',
      '#epik-bg.show { opacity:1; }',
      '#epik-bg.zoom { transform:scale(1.08); }',
      '#epik-overlay::before {',
      '  content:""; position:absolute; inset:0; pointer-events:none;',
      '  background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%);',
      '  z-index:1;',
      '}',
      '#epik-content {',
      '  position:relative; z-index:2; text-align:center; padding:20px;',
      '  max-width:90vw; pointer-events:none;',
      '}',
      '#epik-title {',
      '  font-family:Cinzel, Georgia, serif; font-size:48px; font-weight:bold;',
      '  color:#f5d07a; text-shadow:0 0 30px #c9a84c, 0 4px 12px #000;',
      '  margin-bottom:14px; letter-spacing:3px;',
      '  animation:epikTitleIn 1.2s ease-out forwards;',
      '}',
      '#epik-subtitle {',
      '  font-size:18px; color:#e8d699; text-shadow:0 2px 6px #000;',
      '  margin-bottom:8px; opacity:0;',
      '  animation:epikFadeIn 1.5s ease-out 0.6s forwards;',
      '}',
      '#epik-mesaj {',
      '  font-size:14px; color:#ccc; opacity:0;',
      '  animation:epikFadeIn 1.5s ease-out 1.1s forwards;',
      '}',
      '#epik-skip {',
      '  position:absolute; bottom:20px; right:24px; z-index:3;',
      '  color:#888; font-size:12px; padding:6px 12px;',
      '  border:1px solid #444; border-radius:4px;',
      '  background:rgba(0,0,0,0.5);',
      '}',
      '#epik-progress {',
      '  position:absolute; bottom:0; left:0; right:0; z-index:3;',
      '  height:3px; background:rgba(255,255,255,0.1);',
      '}',
      '#epik-progress-bar {',
      '  height:100%; width:0%; background:linear-gradient(90deg,#c9a84c,#f5d07a,#c9a84c);',
      '  box-shadow:0 0 10px #c9a84c; transition:width 1s linear;',
      '}',
      '@keyframes epikTitleIn {',
      '  0% { transform:translateY(-30px) scale(0.8); opacity:0; }',
      '  100% { transform:translateY(0) scale(1); opacity:1; }',
      '}',
      '@keyframes epikFadeIn {',
      '  from { opacity:0; transform:translateY(10px); }',
      '  to { opacity:1; transform:translateY(0); }',
      '}',
      '@keyframes epikGlow {',
      '  0%, 100% { text-shadow:0 0 30px #c9a84c, 0 4px 12px #000; }',
      '  50% { text-shadow:0 0 60px #f5d07a, 0 0 20px #fff, 0 4px 12px #000; }',
      '}',
      '#epik-title.glowing { animation:epikTitleIn 1.2s ease-out forwards, epikGlow 3s ease-in-out 1.5s infinite; }',
      '@media (max-width:600px) {',
      '  #epik-title { font-size:28px; letter-spacing:1px; }',
      '  #epik-subtitle { font-size:14px; }',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  // DOM bir kez olustur
  function ensureDom() {
    var ov = document.getElementById('epik-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'epik-overlay';
    ov.innerHTML =
      '<div id="epik-bg"></div>' +
      '<div id="epik-content">' +
        '<div id="epik-title" class="glowing">🐲 EFSANE!</div>' +
        '<div id="epik-subtitle">Mağarana bir ejderha geldi</div>' +
        '<div id="epik-mesaj"></div>' +
      '</div>' +
      '<div id="epik-skip">Atlamak için tıkla</div>' +
      '<div id="epik-progress"><div id="epik-progress-bar"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function() { kapat(); });
    return ov;
  }

  var _aktif = false;
  var _timers = [];

  function clearTimers() {
    _timers.forEach(function(t) { clearTimeout(t); });
    _timers = [];
  }

  function kapat() {
    if (!_aktif) return;
    _aktif = false;
    clearTimers();
    var ov = document.getElementById('epik-overlay');
    if (!ov) return;
    ov.classList.add('fadeout');
    setTimeout(function() {
      ov.classList.remove('active', 'fadeout');
      // Body scroll geri ac
      document.body.style.overflow = '';
    }, 800);
  }

  // v1.14.3.65b: Ejderhaya ozel lore metinleri
  // 4 ejderha + ortak fallback. Faz 1 = yumurta, Faz 2 = buyuk hali.
  var EJDERHA_LORE = {
    altin_ejderha: {
      renk: '#f5d07a',   // altin glow
      hue: 0,            // CSS filter (hue-rotate)
      faz1: {
        title: '🥚 EFSANEVİ BİR YUMURTA ÇATLIYOR',
        subtitle: 'Aurium\'un binlerce yıllık uykusunda bir kıvılcım uyandı...',
        mesaj: 'Tapınakların derinliklerinde altın bir ışık huzmesi belirdi.'
      },
      faz2: {
        title: '🐲 ALTIN EJDERHA UYANDI!',
        subtitle: 'Aurium\'un kayıp ihtişamı geri döndü — Aydınlığın efsanesi geldi.',
        mesaj: 'Mağaradan zafer naralı bir kükreyiş yükseldi, gökyüzü altınla doldu.'
      }
    },
    mavi_ejderha: {
      renk: '#5fb8e3',
      hue: 180,
      faz1: {
        title: '🥚 BİR YUMURTA KIPIRDIYOR',
        subtitle: 'Mağaranın derinliklerinden serin bir nefes esti...',
        mesaj: 'Mavi bir alev yumurtanın çatlaklarından sızmaya başladı.'
      },
      faz2: {
        title: '🐲 MAVİ EJDERHA UYANDI!',
        subtitle: 'Gökyüzü ile bir kez daha buluştu — sadık bir koruyucu doğdu.',
        mesaj: 'Aydınlık taraf güçlü bir müttefik kazandı.'
      }
    },
    siyah_ejderha: {
      renk: '#a06be0',
      hue: 250,
      faz1: {
        title: '🥚 LANETLİ BİR YUMURTA',
        subtitle: 'Mağaradan bir inilti bütün Noxara\'da yankılandı...',
        mesaj: 'Gorathul\'un karanlık efsanesi yeniden uyanmaya başladı.'
      },
      faz2: {
        title: '🐲 SİYAH EJDERHA UYANDI!',
        subtitle: 'Karanlığın en güçlü silahı ölüm uykusundan kalktı.',
        mesaj: 'Gece kanat çırpıyor — düşmanların kalbinde korku başladı.'
      }
    },
    kirmizi_ejderha: {
      renk: '#e35f5f',
      hue: 330,
      faz1: {
        title: '🥚 KIZIL BİR KOR PARLIYOR',
        subtitle: 'Mağaranın taşlarına ateşten çatlaklar düşüyor...',
        mesaj: 'Yumurtanın içinden alev nefesi sızdı.'
      },
      faz2: {
        title: '🐲 KIZIL EJDERHA UYANDI!',
        subtitle: 'Alevden doğdu, intikam istiyor — Karanlık tarafa savaş kuvveti geldi.',
        mesaj: 'Magaranın duvarları kıpkırmızı parlıyor.'
      }
    }
  };

  function gosterEpikEjderha(bildirim) {
    if (_aktif) return;  // zaten aktifse skip
    _aktif = true;

    var ov = ensureDom();
    var bg = document.getElementById('epik-bg');
    var titleEl = document.getElementById('epik-title');
    var subEl = document.getElementById('epik-subtitle');
    var mesajEl = document.getElementById('epik-mesaj');
    var bar = document.getElementById('epik-progress-bar');

    var ekstra = bildirim.ekstra || {};
    var ejderhaId = ekstra.ejderha_id || 'altin_ejderha';
    var lore = EJDERHA_LORE[ejderhaId] || EJDERHA_LORE.altin_ejderha;

    // Title rengini ejderhaya gore ayarla
    titleEl.style.color = lore.renk;
    titleEl.style.textShadow = '0 0 30px ' + lore.renk + ', 0 4px 12px #000';

    // BG hue rotation (altin gorseli renk degisikligi)
    bg.style.filter = 'brightness(0.85) hue-rotate(' + lore.hue + 'deg)';

    // FAZ 1: Yumurta (0-30 sn)
    titleEl.textContent = lore.faz1.title;
    titleEl.className = 'glowing';
    subEl.textContent = lore.faz1.subtitle;
    mesajEl.textContent = lore.faz1.mesaj;

    // BG yumurta
    bg.style.backgroundImage = 'url(img/events/altin_ejder_yumurta.jpg)';
    bg.classList.remove('show', 'zoom');

    // Body scroll kapali (animasyon bozulmasin)
    document.body.style.overflow = 'hidden';

    // Overlay aktif et
    requestAnimationFrame(function() {
      ov.classList.add('active');
      requestAnimationFrame(function() {
        bg.classList.add('show', 'zoom');
      });
    });

    // Progress bar (60 sn boyunca dolar)
    setTimeout(function() { bar.style.transition = 'width 60s linear'; bar.style.width = '100%'; }, 100);

    // FAZ 2: Buyuk hal (30 sn sonra)
    var t1 = setTimeout(function() {
      titleEl.textContent = lore.faz2.title;
      subEl.textContent = lore.faz2.subtitle;
      mesajEl.textContent = lore.faz2.mesaj;

      // BG fade -> buyuk
      bg.classList.remove('show', 'zoom');
      setTimeout(function() {
        bg.style.backgroundImage = 'url(img/events/altin_ejder_buyuk.jpg)';
        bg.classList.add('show', 'zoom');
      }, 400);
    }, 30000);
    _timers.push(t1);

    // FAZ 3: Otomatik kapat (60 sn sonra)
    var t2 = setTimeout(function() { kapat(); }, 60000);
    _timers.push(t2);
  }

  // Public API
  window.nxEpikEjderhaGoster = gosterEpikEjderha;
  window.nxEpikEjderhaKapat = kapat;

  // Test fonksiyonu (console'dan: nxEpikTest())
  window.nxEpikTest = function() {
    gosterEpikEjderha({
      tip: 'epik_ejderha',
      mesaj: 'Mağaranda bir Altın Ejderha bulundu! Hazinene eklendi.',
      ekstra: { ejderha_id: 'altin_ejderha', nadir: true }
    });
  };
})();
