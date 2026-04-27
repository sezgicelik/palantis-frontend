/* ═══════════════════════════════════════════════════════
   BİLGELİK KİTABI — Akıllı Rehber Paneli
   v1.14.1.57 (Mockup → Production adapte)
   ═══════════════════════════════════════════════════════
   - Floating button (FAB) sag alt — her sayfada
   - Tıklayınca bottom sheet (mobile) / side panel (desktop)
   - 3 sekme: Görevler · Akıllı · Codex
   - Real-time progress bar
   - State-aware öneriler (window.RES, EXTRA_RES, OYUNCU global'lerinden okur)
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if (window._noxBilgelik) return;
  window._noxBilgelik = true;

  // ──────────────────────────────────────────────
  // GLOBAL STATE OKUYUCU (Noxara'nın gerçek değişkenlerinden)
  // ──────────────────────────────────────────────
  function getState() {
    var R = window.RES || {};
    var E = window.EXTRA_RES || {};
    var O = window.OYUNCU || {};
    var W = window.workers || window.population || {};
    var N = window.NUFUS_DATA || null;
    var bina = window.BUILDINGS_DATA || null;

    var binaAdet = function(id) {
      if (!bina || !bina.binalar) return 0;
      var b = bina.binalar.find(x => x.bina_id === id);
      return b ? (b.seviye || 0) : 0;
    };

    return {
      R: R, E: E, O: O, W: W, N: N,
      binaAdet: binaAdet,
      cag: O.cag || 1,
      taraf: O.taraf || 'iyi',
      premium: !!(O.premium && O.premium.aktif),
    };
  }

  // ──────────────────────────────────────────────
  // GÖREVLER (basit, başlangıç oyuncu için)
  // ──────────────────────────────────────────────
  var GOREV_LISTE = [
    { id:'oduncu', baslik:'Oduncu kampi yap', aciklama:'Odun uretimi temel — en az 1 oduncu kur.',
      bitti: s => s.binaAdet('oduncu') >= 1, link:'city.html?tab=binalar&filter=uretim' },
    { id:'tarla', baslik:'Tarla yap', aciklama:'Tarla olmadan ciftci calistiramaz, bugday uretemezsin.',
      bitti: s => s.binaAdet('tarla') >= 1, link:'city.html?tab=binalar&filter=uretim' },
    { id:'isci_ata', baslik:'Isci ata', aciklama:'Koyluleri oduncu/madenci/ciftci yap.',
      bitti: s => (s.W.oduncu||0) + (s.W.madenci||0) + (s.W.ciftci||0) >= 5,
      link:'population.html' },
    { id:'sehir_meydani', baslik:'Sehir Meydani kur', aciklama:'Diger oyuncularla chatlesmek icin gerekli.',
      bitti: s => s.binaAdet('sehir_meydani') >= 1, link:'city.html?tab=binalar' },
    { id:'asker', baslik:'Ilk askerini bas', aciklama:'Koylu sayisindan asker secip sehrini koru.',
      bitti: s => (s.W.asker||0) >= 5, link:'army.html?tab=units' },
    { id:'ordu_kur', baslik:'Ordu olustur', aciklama:'Askerleri orduya ata, savaslara hazirla.',
      bitti: s => (s.O.aktif_ordu_sayisi||0) >= 1 || (window.armies||[]).length >= 1, link:'army.html?tab=armies' },
    { id:'tapinak', baslik:'Tapinak yap', aciklama:'Worshipperlara mana uretmesi icin.',
      bitti: s => s.binaAdet('rathe_tapinagi') + s.binaAdet('xegony_tapinagi') + s.binaAdet('fennin_tapinagi') + s.binaAdet('tunare_tapinagi') >= 1,
      link:'city.html?tab=binalar&filter=askeri' },
    { id:'pazar', baslik:'Pazar kur', aciklama:'Kervan + buyu dukkani + oyuncu pazarina giris.',
      bitti: s => s.binaAdet('pazar') >= 1, link:'city.html?tab=binalar' },
    { id:'koloni', baslik:'Ilk kolonini fethet', aciklama:'Haritada bos koloni bul, ordu ile fethet.',
      bitti: s => (s.O.koloni_sayisi || 0) >= 1, link:'map.html' },
    { id:'cag2', baslik:'2. Caga gec', aciklama:'Daha fazla bina/unite acilir.',
      bitti: s => s.cag >= 2, link:'cag.html' },
  ];

  // ──────────────────────────────────────────────
  // AKILLI KURALLAR (state-aware öneri)
  // ──────────────────────────────────────────────
  var AKILLI = [
    // Üretim eksiklikleri
    { id:'no_oduncu', tip:'warning',
      kosul: s => s.binaAdet('oduncu') === 0,
      mesaj:'🪓 Hic oduncu binasi yok. Odun uretemezsin.',
      cozum:['Sehir → Binalar → Uretim → Oduncu Kampi','Maliyet az: 200 odun, 50 altin'] },

    { id:'no_tarla', tip:'warning',
      kosul: s => s.binaAdet('tarla') === 0,
      mesaj:'🌾 Tarla yok — ciftci calistiramaz, bugday uretemezsin.',
      cozum:['Tarla yap (her tarla 50 ciftci kapasitesi)','Tarla 1 — yeni oyuncu icin sart'] },

    // Aclik
    { id:'aclik_yuksek', tip:'warning',
      kosul: s => (s.O.aclik || 0) > 50,
      mesaj: () => '🍞 Aclik %' + (getState().O.aclik || 0) + ' — halkin kacacak!',
      cozum:['Tarla seviyesini artir','Ciftci atamasini kontrol et','Pisirme oranini ayarla (population.html)'] },

    // Sehir morali
    { id:'dusuk_moral', tip:'warning',
      kosul: s => {
        var max = ({1:1500, 2:2375, 3:3250, 4:4125, 5:5000})[s.cag] || 1500;
        return (s.O.sehir_morali || 0) < max * 0.4;
      },
      mesaj:'😡 Sehir morali dusuk — vergi azalir, koylu kacar.',
      cozum:['Festival baslat (festival.html)','GPS binalari yap (asma_bahceler/muze)','Vergi oranini gec dur'] },

    // Asker yok savunmasiz
    { id:'savunmasiz', tip:'warning',
      kosul: s => s.cag >= 2 && ((s.W.asker || 0) + ((window.armies||[]).reduce((a,b) => a + (b.toplam_unite||0), 0))) === 0,
      mesaj:'⚔️ Hic askerin yok! Cag 2+ oldugun icin saldiri yiyebilirsin.',
      cozum:['army.html → Asker Egitimi','En az 100-200 piyade bas','Surlar yapildi mi kontrol et'] },

    // Bina kuyrugu bos — bos zaman
    { id:'bos_kuyruk', tip:'success',
      kosul: s => s.cag >= 1 && ((window.BUILDINGS_DATA && window.BUILDINGS_DATA.queue && window.BUILDINGS_DATA.queue.length === 0) || false),
      mesaj:'🔨 Insaat kuyrugun bos. Yapacak bir sey var mi?',
      cozum:['Sehir → Binalar — bekleyen plan kontrolu','5 simultane insa hakki'] },

    // Atil kervan
    { id:'atil_kervan', tip:'success',
      kosul: s => {
        var k = window.KERVANLAR || [];
        return k.length > 0 && k.some(x => !x.yolda);
      },
      mesaj:'🐪 Bos kervanin var — pazara gidip ticarete gonder!',
      cozum:['Pazar → Kervanlar (kervan.html)','Hammadde sat veya kadim sehirden al'] },

    // Hazir parsomen
    { id:'hazir_parsomen', tip:'success',
      kosul: s => (window.PARSOMEN_SAYI || 0) > 0,
      mesaj:'✨ Bekleyen parsomenlerin var — buyu kulesinden ac.',
      cozum:['Buyuler → Buyucu Kulesi → Parsomenler','Yeni buyu acmak guc kazandirir'] },

    // Yeni oyuncu - sehir meydani yok
    { id:'no_meydan', tip:'warning',
      kosul: s => s.binaAdet('sehir_meydani') === 0,
      mesaj:'💬 Sehir Meydani yok — chat yapamaz, ozel mesaj atamaz, takvim okuyamazsin.',
      cozum:['Cag 1 oyuncularda zorunlu ilk binalardan','Cok ucuz: 200 odun, 250 altin'] },

    // Premium upsell (cag 3+)
    { id:'premium_upsell', tip:'success',
      kosul: s => s.cag >= 3 && !s.premium,
      mesaj:'⚜ Premium ile +%30 uretim, +1 ordu, ekstra kervan.',
      cozum:['premium.html → bronz/gumus/altin paket','Cag bazli carpan: cag 3 = 1.0x, cag 5 = 1.5x'] },

    // Bos worshipper kapasitesi
    { id:'bos_ws_kapasite', tip:'success',
      kosul: s => {
        var w = s.W.worshipper || 0;
        var tap = s.binaAdet('rathe_tapinagi') + s.binaAdet('xegony_tapinagi') + s.binaAdet('fennin_tapinagi') + s.binaAdet('tunare_tapinagi');
        return tap > 0 && w < tap * 200;
      },
      mesaj:'🕯️ Tapinaklarinda bos worshipper kapasitesi var. Mana uretimini artir.',
      cozum:['Nufus → Worshipper olustur (renk seç)','Worshipper geri donusumsuz — strateji yap'] },

    // Mevcut bina kapasitesi
    { id:'tarla_dolu', tip:'warning',
      kosul: s => {
        var t = s.binaAdet('tarla');
        var c = s.W.ciftci || 0;
        return t > 0 && c >= t * 50;
      },
      mesaj:'🌾 Tarla kapasiten dolu. Yeni tarla yap ki daha cok ciftci atayabilesin.',
      cozum:['Sehir → Tarla bina (her tarla +50 ciftci)','Ciftci sayisi tarla × 50 sinirli'] },

    // Casus var mi
    { id:'casus_yok', tip:'success',
      kosul: s => s.cag >= 3 && s.binaAdet('istihbarat') >= 1 && (s.W.casus_sayisi || 0) === 0,
      mesaj:'🕵️ Istihbarat binan var ama casus yok. Egitebilir, dusman bilgisi alabilirsin.',
      cozum:['army.html → Casus','Casus bilgisi sehir saldirisinda kritik'] },
  ];

  // ──────────────────────────────────────────────
  // CODEX (mevcut codex'ten subset — hızlı erişim)
  // ──────────────────────────────────────────────
  var CODEX = [
    { baslik:'Kaynaklar', icerik:'Odun, metal, altin, bugday, balik temel kaynaklar. Kereste/islenmis isleme binasi ile uretilir. Cig et/pismis et ciftlik+ocak ile.' },
    { baslik:'Nufus Sistemi', icerik:'Koylu = isci/asker/worshipper kaynagi. Ev/koy/kasaba ile kapasite artar. Aclik %50+ → koylu kacis.' },
    { baslik:'Sehir Morali', icerik:'Cag bazli max 1500-5000. Festival, GPS binalari, ejderha sevinci buyusu artirir. Vergi/aclik dusurur.' },
    { baslik:'Ordu Morali', icerik:'0-100. Maas odenirse +5/saat, odenmezse -10. ATK carpani moral/100 (min 0.2).' },
    { baslik:'Savas Sistemi', icerik:'6 turlu, 4 saf yapilanmasi (3-3-5-3 slot). Rahip diriltme: hangi safta olursa olsun olmedikce yapar.' },
    { baslik:'Cag Atlama', icerik:'Cag 1-5 aralik. Her cag yeni binalar/uniteler acar. Cag atlama maliyetli ve agir karar.' },
    { baslik:'Guild', icerik:'5+ oyuncu birlik. Guild binasi gerekli. Guild kasa, ordu, market, arastirma sahip.' },
    { baslik:'Pazar Ekonomisi', icerik:'Hammadde dinamik fiyat (arz/talep). PvP ilan + Kadim Sehirler NPC ticaret.' },
    { baslik:'Casus & Buyu', icerik:'28 buyu, 11 casus operasyon. Mistik atak/defans gibi savaslarda etkin.' },
    { baslik:'Kadim Sehirler', icerik:'Aurium (Isik) + Gorathul (Karanlik). Ticaret yap → 360 PG sonra capraz NPC saldiri.' },
  ];

  // ──────────────────────────────────────────────
  // RENDER FUNCTIONS
  // ──────────────────────────────────────────────
  var aktifTab = 'gorev';
  var panelAcik = false;

  function fmt(n) { return Math.floor(Number(n)||0).toLocaleString('tr-TR'); }

  function progressYuzde() {
    var s = getState();
    var done = GOREV_LISTE.filter(g => { try { return g.bitti(s); } catch { return false; } }).length;
    return Math.round((done / GOREV_LISTE.length) * 100);
  }

  function aktifAkilliSayisi() {
    var s = getState();
    return AKILLI.filter(r => { try { return r.kosul(s); } catch { return false; } }).length;
  }

  function renderGorevler() {
    var s = getState();
    return GOREV_LISTE.map(function(g) {
      var bitti = false; try { bitti = g.bitti(s); } catch {}
      return '<div class="bk-task' + (bitti?' done':'') + '">'
        + '<div class="bk-check">' + (bitti?'✓':'!') + '</div>'
        + '<div class="bk-task-info">'
          + '<div class="bk-task-title">' + g.baslik + '</div>'
          + '<div class="bk-task-desc">' + g.aciklama + '</div>'
        + '</div>'
        + (bitti
            ? '<button class="bk-action done">Tamam</button>'
            : '<a href="' + g.link + '" class="bk-action">Git</a>')
        + '</div>';
    }).join('');
  }

  function renderAkilli() {
    var s = getState();
    var rules = AKILLI.filter(r => { try { return r.kosul(s); } catch { return false; } });

    // Hizli durum kart
    var durum = '<div class="bk-card">'
      + '<h4>📦 Hızlı Durum</h4>'
      + '<div class="bk-row"><span>Çağ</span><b>' + s.cag + '</b></div>'
      + '<div class="bk-row"><span>Açlık</span><b class="' + ((s.O.aclik||0) > 50 ? 'bad' : 'good') + '">%' + (s.O.aclik||0) + '</b></div>'
      + '<div class="bk-row"><span>Şehir Morali</span><b>' + fmt(s.O.sehir_morali||0) + '</b></div>'
      + '<div class="bk-row"><span>Ordu Morali</span><b>' + (s.O.ordu_morali||100) + '/100</b></div>'
      + '<div class="bk-row"><span>Altın</span><b>' + fmt(s.R.altin||0) + '</b></div>'
      + '<div class="bk-row"><span>Buğday</span><b>' + fmt(s.R.bugday||0) + '</b></div>'
      + '</div>';

    if (rules.length === 0) {
      return durum + '<div class="bk-success-box">✅ Şu an büyük bir sorun yok. Görevlerden ilerlemeye devam et.</div>';
    }

    var rulesHtml = rules.map(function(r) {
      var msg = (typeof r.mesaj === 'function') ? r.mesaj(s) : r.mesaj;
      var coz = (r.cozum || []).map(c => '<li>' + c + '</li>').join('');
      return '<div class="bk-' + r.tip + '-box">'
        + '<b>' + msg + '</b>'
        + (coz ? '<ol>' + coz + '</ol>' : '')
        + '</div>';
    }).join('');
    return durum + rulesHtml;
  }

  function renderCodex() {
    return CODEX.map(function(c) {
      return '<div class="bk-task">'
        + '<div class="bk-check">?</div>'
        + '<div class="bk-task-info">'
          + '<div class="bk-task-title">' + c.baslik + '</div>'
          + '<div class="bk-task-desc">' + c.icerik + '</div>'
        + '</div>'
        + '</div>';
    }).join('') + '<a href="codex.html" style="display:block;text-align:center;color:#d4af37;font-size:11px;margin-top:10px;text-decoration:none">→ Tüm Codex (200+ giriş)</a>';
  }

  function renderPanel() {
    var pct = progressYuzde();
    var akilliSayi = aktifAkilliSayisi();
    var icerik = aktifTab === 'gorev' ? renderGorevler() : (aktifTab === 'akilli' ? renderAkilli() : renderCodex());
    return ''
      + '<div class="bk-header">'
        + '<h2>📘 Bilgelik Kitabı</h2>'
        + '<button class="bk-close" onclick="bilgelik.kapat()">✕</button>'
        + '<div class="bk-progress-text"><span>Başlangıç ilerlemesi</span><span>' + pct + '%</span></div>'
        + '<div class="bk-progress-bar"><div class="bk-progress-fill" style="width:' + pct + '%"></div></div>'
      + '</div>'
      + '<div class="bk-tabs">'
        + '<button class="bk-tab' + (aktifTab==='gorev'?' active':'') + '" onclick="bilgelik.tab(\'gorev\')">Görevler</button>'
        + '<button class="bk-tab' + (aktifTab==='akilli'?' active':'') + '" onclick="bilgelik.tab(\'akilli\')">Akıllı'
          + (akilliSayi > 0 ? '<span class="bk-tab-badge">' + akilliSayi + '</span>' : '')
          + '</button>'
        + '<button class="bk-tab' + (aktifTab==='codex'?' active':'') + '" onclick="bilgelik.tab(\'codex\')">Codex</button>'
      + '</div>'
      + '<div class="bk-content">' + icerik + '</div>';
  }

  function panelAc() {
    panelAcik = true;
    var p = document.getElementById('bk-panel');
    if (p) {
      p.innerHTML = renderPanel();
      p.classList.add('open');
      var fab = document.getElementById('bk-fab');
      if (fab) fab.style.display = 'none';
    }
  }
  function panelKapat() {
    panelAcik = false;
    var p = document.getElementById('bk-panel');
    if (p) p.classList.remove('open');
    var fab = document.getElementById('bk-fab');
    if (fab) fab.style.display = 'flex';
  }
  function tabSec(t) {
    aktifTab = t;
    var p = document.getElementById('bk-panel');
    if (p && panelAcik) p.innerHTML = renderPanel();
  }

  // FAB ve panel'i DOM'a ekle (her sayfada bir kez)
  function init() {
    if (document.getElementById('bk-fab')) return;
    if (!window.getToken || !window.getToken()) return; // login degilse gosterme

    // CSS inject
    var style = document.createElement('style');
    style.textContent = `
      #bk-fab {
        position: fixed; right: 16px; bottom: 80px; z-index: 9997;
        width: 52px; height: 52px; border-radius: 50%;
        background: linear-gradient(135deg, #d4af37, #b08f4d);
        border: 2px solid #5a4a2a; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        transition: transform .15s;
      }
      #bk-fab:hover { transform: scale(1.08); }
      #bk-fab:active { transform: scale(0.95); }
      #bk-fab .bk-fab-badge {
        position: absolute; top: -4px; right: -4px;
        background: #e74c3c; color: #fff; font-size: 10px; font-weight: bold;
        padding: 2px 6px; border-radius: 10px; min-width: 18px;
        text-align: center; border: 2px solid #050505;
      }
      @media (min-width: 769px) {
        #bk-fab { bottom: 16px; }
      }

      #bk-panel {
        position: fixed; right: 0; top: 0; bottom: 0;
        width: 390px; max-width: 100vw;
        background: #0f172a;
        border-left: 1px solid rgba(148, 163, 184, .25);
        z-index: 9998; display: flex; flex-direction: column;
        transform: translateX(100%); transition: transform .3s ease;
        box-shadow: -18px 0 55px rgba(0,0,0,.45);
        font-family: system-ui, -apple-system, sans-serif;
      }
      #bk-panel.open { transform: translateX(0); }
      @media (max-width: 768px) {
        #bk-panel {
          left: 0; right: 0; top: auto;
          width: 100%; max-width: 100%;
          height: 85vh; border-left: none;
          border-top: 1px solid rgba(212,175,55,.5);
          border-radius: 16px 16px 0 0;
          transform: translateY(100%);
        }
        #bk-panel.open { transform: translateY(0); }
      }

      .bk-header {
        padding: 16px; border-bottom: 1px solid rgba(148, 163, 184, .18);
        background: linear-gradient(135deg, #1e293b, #111827);
        position: relative; color: #f9fafb;
      }
      .bk-header h2 { margin: 0 0 4px; font-size: 18px; color: #d4af37; font-family: Cinzel, serif; }
      .bk-close {
        position: absolute; top: 12px; right: 12px;
        background: transparent; border: none; color: #cbd5e1;
        font-size: 20px; cursor: pointer; width: 32px; height: 32px;
        border-radius: 50%;
      }
      .bk-close:hover { background: rgba(255,255,255,0.1); }
      .bk-progress-text {
        display: flex; justify-content: space-between;
        font-size: 11px; color: #cbd5e1; margin-top: 10px; margin-bottom: 4px;
      }
      .bk-progress-bar {
        height: 6px; background: #1f2937; border-radius: 999px; overflow: hidden;
      }
      .bk-progress-fill {
        height: 100%; background: linear-gradient(90deg, #22c55e, #fbbf24);
        transition: width .25s ease;
      }
      .bk-tabs {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
        padding: 10px; border-bottom: 1px solid rgba(148, 163, 184, .18);
        background: #0f172a;
      }
      .bk-tab {
        background: #1e293b; border: 1px solid rgba(148, 163, 184, .2);
        color: #e5e7eb; border-radius: 8px; padding: 8px 4px; cursor: pointer;
        font-size: 12px; font-weight: 500; position: relative;
      }
      .bk-tab.active { background: #d4af37; color: #111827; font-weight: 700; border-color: #d4af37; }
      .bk-tab-badge {
        position: absolute; top: -4px; right: -4px;
        background: #e74c3c; color: #fff; font-size: 9px; font-weight: bold;
        padding: 1px 5px; border-radius: 8px; min-width: 16px; text-align: center;
        border: 1.5px solid #0f172a;
      }
      .bk-content {
        padding: 12px; overflow-y: auto; flex: 1;
        background: #0f172a; color: #f9fafb;
        -webkit-overflow-scrolling: touch;
      }

      .bk-task {
        display: grid; grid-template-columns: 28px 1fr auto;
        gap: 10px; align-items: start;
        padding: 10px; background: #111827;
        border: 1px solid rgba(148, 163, 184, .18);
        border-radius: 10px; margin-bottom: 8px;
      }
      .bk-task.done { border-color: rgba(34, 197, 94, .45); background: rgba(22, 101, 52, .15); }
      .bk-check {
        width: 24px; height: 24px; border-radius: 50%;
        display: grid; place-items: center;
        background: #334155; color: #94a3b8; font-weight: bold; font-size: 12px;
      }
      .bk-task.done .bk-check { background: #22c55e; color: #052e16; }
      .bk-task-info { min-width: 0; }
      .bk-task-title { font-weight: 700; font-size: 13px; color: #f9fafb; margin-bottom: 3px; }
      .bk-task-desc { font-size: 11px; color: #cbd5e1; line-height: 1.4; }
      .bk-action {
        white-space: nowrap; font-size: 11px; padding: 6px 10px;
        border-radius: 6px; border: none; cursor: pointer;
        background: #d4af37; color: #111827; font-weight: 600;
        text-decoration: none; align-self: center;
      }
      .bk-action.done { background: #14532d; color: #86efac; pointer-events: none; }

      .bk-card {
        background: #111827; border: 1px solid rgba(148, 163, 184, .18);
        border-radius: 10px; padding: 12px; margin-bottom: 10px;
      }
      .bk-card h4 { margin: 0 0 8px; font-size: 13px; color: #d4af37; }
      .bk-row {
        display: flex; justify-content: space-between;
        padding: 5px 0; border-bottom: 1px solid rgba(148, 163, 184, .12);
        font-size: 12px;
      }
      .bk-row:last-child { border-bottom: none; }
      .bad { color: #fca5a5; font-weight: 700; }
      .good { color: #86efac; font-weight: 700; }

      .bk-warning-box, .bk-success-box {
        border-radius: 10px; padding: 12px; margin-bottom: 10px;
        font-size: 12px; line-height: 1.5;
      }
      .bk-warning-box {
        background: rgba(127, 29, 29, .35); border: 1px solid rgba(248, 113, 113, .35);
        color: #fecaca;
      }
      .bk-success-box {
        background: rgba(20, 83, 45, .35); border: 1px solid rgba(34, 197, 94, .35);
        color: #bbf7d0;
      }
      .bk-warning-box ol, .bk-success-box ol {
        margin: 6px 0 0; padding-left: 18px; font-size: 11px;
      }
      .bk-warning-box ol li, .bk-success-box ol li { margin-bottom: 2px; }
    `;
    document.head.appendChild(style);

    // FAB butonu
    var fab = document.createElement('button');
    fab.id = 'bk-fab';
    fab.innerHTML = '📘<span class="bk-fab-badge" id="bk-fab-badge" style="display:none">0</span>';
    fab.title = 'Bilgelik Kitabi';
    fab.onclick = panelAc;
    document.body.appendChild(fab);

    // Panel container
    var panel = document.createElement('div');
    panel.id = 'bk-panel';
    panel.innerHTML = renderPanel();
    document.body.appendChild(panel);

    // ESC ile kapat
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panelAcik) panelKapat();
    });

    // Akıllı badge (FAB üzerinde) — periyodik güncelle
    function badgeGuncelle() {
      var akilliSayi = aktifAkilliSayisi();
      var badge = document.getElementById('bk-fab-badge');
      if (badge) {
        if (akilliSayi > 0) {
          badge.textContent = akilliSayi;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
    badgeGuncelle();
    setInterval(badgeGuncelle, 30000); // 30 sn'de bir
  }

  // Public API
  window.bilgelik = {
    ac: panelAc,
    kapat: panelKapat,
    tab: tabSec,
  };

  // DOMContentLoaded sonrası başlat
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 1500);
  } else {
    window.addEventListener('DOMContentLoaded', function() { setTimeout(init, 1500); });
  }
})();
