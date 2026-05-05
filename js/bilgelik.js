/* ═══════════════════════════════════════════════════════
   BİLGELİK KİTABI — Akıllı Rehber Paneli
   v1.14.2.1 (UPGRADE: 5 sekme + 35 kural + ROI + İnsights)
   ═══════════════════════════════════════════════════════
   - Floating button (FAB) sag alt — her sayfada
   - Tıklayınca bottom sheet (mobile) / side panel (desktop)
   - 5 sekme: Yol · Akıllı · Strateji · İnsights · Codex
   - Real-time progress bar
   - State-aware öneriler (window.RES, EXTRA_RES, OYUNCU global'lerinden okur)
   - Backend: /api/player/insights (siralama + trend + uyari)
   - Backend: /api/gorev/liste (resmi quest sistemi)
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if (window._noxBilgelik) return;
  window._noxBilgelik = true;

  // ──────────────────────────────────────────────
  // GLOBAL STATE OKUYUCU
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
  // ONBOARDING GÖREVLER (10 — yeni oyuncu için)
  // ──────────────────────────────────────────────
  var ONBOARDING = [
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
  // AKILLI KURALLAR — 35+ adet, tier (acil/orta/ileri)
  // ──────────────────────────────────────────────
  var AKILLI = [
    // ═══ ACIL — kritik durumlar ═══
    { id:'aclik_kritik', tier:'acil', tip:'warning',
      kosul: s => (s.O.aclik || 0) > 70,
      mesaj: () => '🔥 ACIL — Aclik %' + (getState().O.aclik || 0) + '! Koyluler suan kaciyor.',
      cozum:['Pisirme oranini hemen artir','Ciftlik/balikci kontrolu (population.html)','Pazardan bugday/balik al'] },

    { id:'savunmasiz', tier:'acil', tip:'warning',
      kosul: s => s.cag >= 2 && ((s.W.asker || 0) + ((window.armies||[]).reduce((a,b) => a + (b.toplam_unite||0), 0))) === 0,
      mesaj:'⚔️ ACIL — Hic askerin yok! Cag 2+ olarak saldiri yiyebilirsin.',
      cozum:['army.html → Asker Egitimi','En az 100-200 piyade bas','Surlar yapildi mi kontrol et'] },

    { id:'moral_kritik', tier:'acil', tip:'warning',
      kosul: s => {
        var max = ({1:1500, 2:2375, 3:3250, 4:4125, 5:5000})[s.cag] || 1500;
        return (s.O.sehir_morali || 0) < max * 0.20;
      },
      mesaj:'😡 ACIL — Sehir morali %20 altinda. Vergi alinamaz, koylu kacar.',
      cozum:['Festival baslat (festival.html)','Vergi oranini sifirla','GPS binalari (asma_bahceler/muze/koliseum)'] },

    { id:'kasa_negatif', tier:'acil', tip:'warning',
      kosul: s => (s.R.altin || 0) < 0,
      mesaj:'💸 ACIL — Altin negatif! Maas odenemiyor, ordu morali dusuyor.',
      cozum:['Pazardan kaynak sat','Vergi orani kontrol','Atil orduyu temizle'] },

    { id:'kale_yok_ileri_cag', tier:'acil', tip:'warning',
      kosul: s => s.cag >= 3 && s.binaAdet('surlar') === 0,
      mesaj:'🏰 Cag 3+ ama surlar yok! Savunmada %30 kale bonusu kacar.',
      cozum:['Sehir → Binalar → Surlar','Tum savunmaya +%30 carpan'] },

    // ═══ ORTA — strateji uyarilari ═══
    { id:'aclik_yuksek', tier:'orta', tip:'warning',
      kosul: s => (s.O.aclik || 0) > 50 && (s.O.aclik || 0) <= 70,
      mesaj: () => '🍞 Aclik %' + (getState().O.aclik || 0) + ' — kacis baslamak uzere.',
      cozum:['Tarla seviyesini artir','Ciftci atamasini kontrol et','Pisirme oranini ayarla'] },

    { id:'moral_dusuk', tier:'orta', tip:'warning',
      kosul: s => {
        var max = ({1:1500, 2:2375, 3:3250, 4:4125, 5:5000})[s.cag] || 1500;
        var m = s.O.sehir_morali || 0;
        return m >= max * 0.20 && m < max * 0.40;
      },
      mesaj:'😔 Sehir morali dusuk — uretim/vergi azalir, halk huzursuz.',
      cozum:['Yemek cesitliligi (3+ tip = +1/saat)','Festival baslat','GPS binalari'] },

    { id:'no_oduncu', tier:'orta', tip:'warning',
      kosul: s => s.binaAdet('oduncu') === 0,
      mesaj:'🪓 Hic oduncu binasi yok. Odun uretemezsin.',
      cozum:['Sehir → Binalar → Uretim → Oduncu Kampi','Maliyet az: 200 odun, 50 altin'] },

    { id:'no_tarla', tier:'orta', tip:'warning',
      kosul: s => s.binaAdet('tarla') === 0,
      mesaj:'🌾 Tarla yok — ciftci calistiramaz, bugday uretemezsin.',
      cozum:['Tarla yap (her tarla 50 ciftci kapasitesi)','Yeni oyuncu icin sart'] },

    { id:'no_meydan', tier:'orta', tip:'warning',
      kosul: s => s.binaAdet('sehir_meydani') === 0,
      mesaj:'💬 Sehir Meydani yok — chat yapamaz, ozel mesaj atamaz.',
      cozum:['Cag 1 oyuncularda zorunlu','Cok ucuz: 200 odun, 250 altin'] },

    { id:'tarla_dolu', tier:'orta', tip:'warning',
      kosul: s => {
        var t = s.binaAdet('tarla');
        var c = s.W.ciftci || 0;
        return t > 0 && c >= t * 50;
      },
      mesaj:'🌾 Tarla kapasiten dolu. Yeni tarla yap.',
      cozum:['Sehir → Tarla bina (her tarla +50 ciftci)','Bugday uretimini katlayabilirsin'] },

    { id:'pazar_yok_cag2', tier:'orta', tip:'warning',
      kosul: s => s.cag >= 2 && s.binaAdet('pazar') === 0,
      mesaj:'🏪 Pazar yok — kervan/buyu dukkani/PvP ticareti kullanamazsin.',
      cozum:['Sehir → Binalar → Pazar','Cag 1\'de kurulabilir'] },

    { id:'lonca_eksik', tier:'orta', tip:'warning',
      kosul: s => s.cag >= 2 && s.binaAdet('lonca') === 0,
      mesaj:'🎭 Lonca yok — gizlilik uretimi/casus egitimi sinirli.',
      cozum:['Sehir → Binalar → Lonca','+50 sehir morali pasif bonus'] },

    { id:'isleme_yok', tier:'orta', tip:'warning',
      kosul: s => s.binaAdet('oduncu') >= 2 && s.binaAdet('isleme') === 0,
      mesaj:'🪵 Oduncuya yatirim yaptin ama isleme yok — odun→kereste cevirilmiyor.',
      cozum:['Sehir → Binalar → Isleme atolyesi','Kereste savas/bina maliyetinde kritik'] },

    { id:'ocak_firin_yok', tier:'orta', tip:'warning',
      kosul: s => (s.binaAdet('ciftlik') >= 1 || (s.W.balikci||0) >= 5) && s.binaAdet('ocak') === 0 && s.binaAdet('firin') === 0,
      mesaj:'🍳 Ocak/Firin yok — yemekleri pisiremiyorsun (pismis 2x daha etkili).',
      cozum:['Ocak (et pisirme) veya Firin (ekmek)','Pismis = ham × 2 doyma'] },

    { id:'ahir_yok_cag2', tier:'orta', tip:'success',
      kosul: s => s.cag >= 2 && s.binaAdet('ahir') === 0,
      mesaj:'🐎 Ahir yok — at uretimi yok, suvari bas\'amazsin.',
      cozum:['Sehir → Binalar → Ahir','Cag 2 askeri unite icin gerekli'] },

    { id:'casus_yok', tier:'orta', tip:'success',
      kosul: s => s.cag >= 3 && s.binaAdet('istihbarat') >= 1 && (s.W.casus_sayisi || 0) === 0,
      mesaj:'🕵️ Istihbarat binan var ama casus yok.',
      cozum:['casus.html → Casus Egit','Dusman bilgisi savaslarda kritik'] },

    { id:'atil_kervan', tier:'orta', tip:'success',
      kosul: s => {
        var k = window.KERVANLAR || [];
        return k.length > 0 && k.some(x => !x.yolda);
      },
      mesaj:'🐪 Bos kervanin var — pazara gonder, ticarete sok!',
      cozum:['kervan.html','Hammadde sat veya kadim sehirden al'] },

    { id:'hazir_parsomen', tier:'orta', tip:'success',
      kosul: s => (window.PARSOMEN_SAYI || 0) > 0,
      mesaj:'✨ Bekleyen parsomenlerin var — buyu ac.',
      cozum:['Buyuler → Buyucu Kulesi → Parsomenler','Yeni buyu = guc artisi'] },

    { id:'bos_ws_kapasite', tier:'orta', tip:'success',
      kosul: s => {
        var w = s.W.worshipper || 0;
        var tap = s.binaAdet('rathe_tapinagi') + s.binaAdet('xegony_tapinagi') + s.binaAdet('fennin_tapinagi') + s.binaAdet('tunare_tapinagi');
        return tap > 0 && w < tap * 200;
      },
      mesaj:'🕯️ Tapinaklarinda bos worshipper kapasitesi var.',
      cozum:['Nufus → Worshipper olustur (renk seç)','Geri donusumsuz — strateji yap'] },

    { id:'bos_kuyruk', tier:'orta', tip:'success',
      kosul: s => s.cag >= 1 && ((window.BUILDINGS_DATA && window.BUILDINGS_DATA.queue && window.BUILDINGS_DATA.queue.length === 0) || false),
      mesaj:'🔨 Insaat kuyrugun bos. Bekleyen plan kontrolu.',
      cozum:['Sehir → Binalar — yeni plana basla','5 simultane insa hakki'] },

    { id:'koloni_az', tier:'orta', tip:'success',
      kosul: s => s.cag >= 2 && (s.O.koloni_sayisi || 0) < 2,
      mesaj:'🗺️ Az kolonin var. Koloniler bonus kaynak akisi saglar.',
      cozum:['map.html → Bos koloni bul','Ordu ile fethet (bina + asker tasi)'] },

    // ═══ ILERI — optimizasyon / endgame ═══
    { id:'cag3_artifact_yok', tier:'ileri', tip:'success',
      kosul: s => s.cag >= 3 && (window.ARTIFACT_DATA && window.ARTIFACT_DATA.aktif_sayi === 0),
      mesaj:'💎 Cag 3+ artifact kullanmiyorsun — buyuk bonus kaybi.',
      cozum:['artifact.html','30+ artifact, cag bazli etki'] },

    { id:'guild_yok_cag3', tier:'ileri', tip:'success',
      kosul: s => s.cag >= 3 && !s.O.guild_id,
      mesaj:'🏛️ Cag 3+ guild yok — guild bonusu, ortak ordu, kadim sehir holding kacar.',
      cozum:['guild.html → Guild bul/kur','Min 5 oyuncu gerekir'] },

    { id:'kadim_sayac_uyari', tier:'ileri', tip:'warning',
      kosul: s => {
        var k = window.KADIM_SAYAC || null;
        if (!k) return false;
        // 240 PG'den fazla geri sayim ilerledi mi
        return k.kalan_pg !== undefined && k.kalan_pg < 48 && k.kalan_pg > 0;
      },
      mesaj: () => {
        var k = window.KADIM_SAYAC || {};
        return '⏳ Kadim sehir saldirisi yaklasiyor (' + (k.kalan_pg || '?') + ' P.G.)!';
      },
      cozum:['Ordu hazirla — kadim NPC ordusu agir','Surlar/kuleler kontrol','Takviye iste guild\'den'] },

    { id:'premium_upsell', tier:'ileri', tip:'success',
      kosul: s => s.cag >= 3 && !s.premium,
      mesaj:'⚜ Premium ile +%30 uretim, +1 ordu, ekstra kervan.',
      cozum:['premium.html → bronz/gumus/altin paket','Cag 3 = 1.0x, cag 5 = 1.5x carpan'] },

    { id:'gpsile_moral_kazani', tier:'ileri', tip:'success',
      kosul: s => {
        var max = ({1:1500, 2:2375, 3:3250, 4:4125, 5:5000})[s.cag] || 1500;
        return s.cag >= 3 && (s.O.sehir_morali || 0) < max * 0.7;
      },
      mesaj:'😊 Sehir moralini hizla yukseltebilirsin — GPS binalari pasif +1 ila +6/saat.',
      cozum:['Asma Bahceler (cag 4): +100 bonus','Muze (cag 3): +80 bonus','GPS≥%100 → +6/saat recovery'] },

    { id:'serap_buyu', tier:'ileri', tip:'success',
      kosul: s => s.cag >= 3 && (window.AKTIF_BUYULER && !window.AKTIF_BUYULER.find(b => b.buyu_id === 'serap')),
      mesaj:'🌫️ Serap buyusu aktif degil — saldirida alan kaybi azalir.',
      cozum:['Buyucu Kulesi → Serap','Kademe x %3 alan koruma'] },

    { id:'ordu_morali_dusuk', tier:'ileri', tip:'warning',
      kosul: s => (s.O.ordu_morali || 100) < 50,
      mesaj: () => '⚔️ Ordu morali dusuk (' + (getState().O.ordu_morali || 0) + '/100) — ATK/DEF carpani azaldi.',
      cozum:['Maas oder durumda mi kontrol','Sadakat buyusu','Hipnoz etkisinde olabilir misin?'] },

    { id:'tatil_modu', tier:'ileri', tip:'success',
      kosul: s => s.O.tatil_modu === true,
      mesaj:'🛌 Tatil modu aktif — saldirilamazsin ama kazanc da yok.',
      cozum:['Aktif olunca kapat (ayarlar.html)','Tatil sirasinda cron uretim 0'] },

    { id:'kubbe_buyu', tier:'ileri', tip:'success',
      kosul: s => s.cag >= 4 && !(window.AKTIF_BUYULER && window.AKTIF_BUYULER.find(b => b.buyu_id === 'gorunmez_kubbe')),
      mesaj:'🛡️ Gorunmez Kubbe yok — artifact koruma kacirilan saldiri ihtimali.',
      cozum:['Buyucu Kulesi → Gorunmez Kubbe','Saldirida artifact bonus aktif'] },

    { id:'savas_simulator_dene', tier:'ileri', tip:'success',
      kosul: s => s.cag >= 3 && s.premium && (s.O.simulasyon_kullandi || 0) < 3,
      mesaj:'🎯 Savas simulatoru kullanmiyorsun — premium hakkin var.',
      cozum:['army.html → Simulator','Saf dizilimini test et'] },

    { id:'fazla_bos_alan', tier:'ileri', tip:'success',
      kosul: s => {
        var t = s.O.toplam_alan || 0;
        var k = s.O.kullanilan_alan || 0;
        return t > 100 && (t - k) > t * 0.4;
      },
      mesaj:'📐 Toplam alanin %40+ kullanilmiyor. Bina/koloni potansiyeli var.',
      cozum:['Yeni bina (uretim/askeri/sehir)','Kullanilmayan alan boş duruyor'] },

    { id:'mezarlik_bekleyen', tier:'ileri', tip:'success',
      kosul: s => (window.MEZARLIK_SAYI || 0) >= 5,
      mesaj: () => '⚰️ ' + (window.MEZARLIK_SAYI || 0) + ' mezar var — diriltebilirsin (%30 sans, 24h limit).',
      cozum:['mezarlik.html','Olen unitelerin yarisi geri gelir'] },

    { id:'cag_atlama_hazir', tier:'ileri', tip:'success',
      kosul: s => {
        // Cag atlama icin kabac criteria — gercek kontrolu cag.html yapar
        return s.cag < 5 && (s.R.altin || 0) > 100000 * s.cag && (s.O.toplam_alan || 0) > 50 * s.cag;
      },
      mesaj: () => '⬆️ Cag ' + (getState().cag + 1) + '\'a atlama hazir olabilirsin.',
      cozum:['cag.html → Cag atlama gereksinimleri','Yeni binalar/uniteler acilir'] },
  ];

  // ──────────────────────────────────────────────
  // STRATEJI — Çağ bazlı roadmap
  // ──────────────────────────────────────────────
  var STRATEJI_ROADMAP = {
    1: {
      baslik: 'Çağ 1: Temel Altyapı',
      asamalar: [
        '1️⃣ İlk 24 P.G.: Oduncu, Tarla, Şehir Meydanı, Ev',
        '2️⃣ Köyluleri ata: 5 oduncu + 5 ciftci + 3 madenci',
        '3️⃣ Asker eğitimi başlat (en az 50 piyade)',
        '4️⃣ Madencisi/balıkçı ile çeşitlilik (yemek bonusu)',
        '5️⃣ İlk koloniye saldır (kaynak akışı)',
        '🎯 Hedef: Çağ 2 atlamak (~150 P.G.)'
      ]
    },
    2: {
      baslik: 'Çağ 2: Askeri Yapılanma',
      asamalar: [
        '1️⃣ Tapınak (1 renk) + Worshipper üret',
        '2️⃣ Lonca + Ahır (suvari/at)',
        '3️⃣ Askeri gelisim (savaşçı, suvari, paladin)',
        '4️⃣ Pazar + Kervan (5 esek)',
        '5️⃣ Casus eğitimi (istihbarat binası)',
        '🎯 Hedef: 2 koloni + ilk PvP zafer'
      ]
    },
    3: {
      baslik: 'Çağ 3: Strateji & Diplomasi',
      asamalar: [
        '1️⃣ Surlar + 2 kule türü (okçu/mizrak)',
        '2️⃣ Büyücü Kulesi (mistik atak/defans)',
        '3️⃣ Guild kur veya katıl (5+ üye)',
        '4️⃣ Artifact toplama başla',
        '5️⃣ Kadim Şehir ticaret (240 PG plan!)',
        '🎯 Hedef: 5+ koloni + guild ordu'
      ]
    },
    4: {
      baslik: 'Çağ 4: Ekonomi Patlaması',
      asamalar: [
        '1️⃣ Üretim binaları MAX (oduncu 8+, tarla 10+)',
        '2️⃣ Asma Bahçeler (+100 moral, GPS booster)',
        '3️⃣ Opera Evi / Koliseum (kültür + eğlence)',
        '4️⃣ Premium düşün (+%30 üretim)',
        '5️⃣ Guild kuşatma katıl/lider',
        '🎯 Hedef: Sıralama top 50'
      ]
    },
    5: {
      baslik: 'Çağ 5: Endgame',
      asamalar: [
        '1️⃣ Tüm GPS binaları (5000 max moral!)',
        '2️⃣ Kadim Şehir holding (guild ile)',
        '3️⃣ Ejderha/elit unite üret',
        '4️⃣ Sezon rozeti hedefle',
        '5️⃣ Artifact tam set (+3 etki)',
        '🎯 Hedef: Top 10 + sezon kazanan'
      ]
    }
  };

  // ROI: Hangi binadan +1 yapsam en çok kar?
  function hesaplaROI(s) {
    var roi = [];

    // Oduncu — kademe başına +5 odun/saat
    var odSev = s.binaAdet('oduncu');
    if (odSev < 10) roi.push({
      bina:'Oduncu Kampı', kademe: odSev+1, etki:'+5 odun/saat',
      maliyet:'~'+(200*Math.pow(1.5,odSev))+' odun + '+(50*Math.pow(1.5,odSev))+' altın',
      oncelik: odSev < 3 ? 'YÜKSEK' : 'ORTA',
    });

    // Tarla
    var tSev = s.binaAdet('tarla');
    var ciftciSayisi = s.W.ciftci || 0;
    if (ciftciSayisi >= tSev * 50 - 10) roi.push({
      bina:'Tarla', kademe: tSev+1, etki:'+50 ciftci kapasitesi',
      maliyet:'~'+(150*Math.pow(1.4,tSev))+' odun',
      oncelik:'YÜKSEK',
    });

    // Ev/Köy/Kasaba — nüfus dolu mu?
    var nufus = s.O.nufus || 0;
    var nLimit = s.O.nufus_siniri || 100;
    if (nufus >= nLimit * 0.85) {
      roi.push({
        bina:'Ev/Köy/Kasaba', kademe:'+1', etki:'Nüfus tavanı +10/+100/+250',
        maliyet:'değişken',
        oncelik:'YÜKSEK — kapasite dolu',
      });
    }

    // Asker
    if (s.cag >= 2 && (s.W.asker || 0) < 200) roi.push({
      bina:'Asker Eğitimi', kademe:'army.html', etki:'Savunma + saldırı',
      maliyet:'1 köylü + altın/saat',
      oncelik:'YÜKSEK',
    });

    // GPS binaları — moral düşük + cağ uygun
    var max = ({1:1500, 2:2375, 3:3250, 4:4125, 5:5000})[s.cag] || 1500;
    if ((s.O.sehir_morali || 0) < max * 0.6 && s.cag >= 3) {
      roi.push({
        bina:'GPS Binası (asma_bahceler/muze/koliseum)', kademe:'+1', etki:'+50-100 moral pasif',
        maliyet:'altın+islenmis',
        oncelik:'YÜKSEK — moral kazanir',
      });
    }

    // Surlar
    if (s.cag >= 3 && s.binaAdet('surlar') < 3) {
      roi.push({
        bina:'Surlar', kademe: s.binaAdet('surlar')+1, etki:'+%30 savunma kale bonusu',
        maliyet:'kereste+islenmis',
        oncelik:'ORTA',
      });
    }

    return roi;
  }

  // ──────────────────────────────────────────────
  // CODEX — 25 giriş (eski 10'a + 15 yeni)
  // ──────────────────────────────────────────────
  var CODEX = [
    { baslik:'Kaynaklar', icerik:'Odun, metal, altin, bugday, balik temel. Kereste/islenmis isleme ile. Cig et/pismis et ciftlik+ocak ile.' },
    { baslik:'Nüfus', icerik:'Köylü = işçi/asker/worshipper kaynağı. Ev=10, Köy=100, Kasaba=250 kapasite. Açlık %50+ → kaçış.' },
    { baslik:'Şehir Morali', icerik:'Çağ bazlı max 1500-5000. Festival, GPS binaları (kademeli), Ejderha Sevinci, savaş zaferi (+10), yemek çeşitliliği (3+ tip) artırır. Vergi/açlık/yenilgi (-15) düşürür.' },
    { baslik:'Ordu Morali', icerik:'0-100. Maaş ödenir +5/saat, ödenmez -10. ATK çarpanı moral/100 (min 0.2).' },
    { baslik:'GPS (Populasyon Seviyesi)', icerik:'5 ilgi alanı (egitim/bilgi/kultur/eglence/sehir) ortalaması. ≥%50 → +1 moral/saat, %100 → +6.' },
    { baslik:'Yemek Çeşitliliği', icerik:'3+ tip (bugday/balik/cig_et/ekmek/pismis/pismis_et) → +1 moral/saat, 5+ tip → +2. Doyma ≥%50 ise.' },
    { baslik:'Vergi Sistemleri', icerik:'5 sistem: Klasik/GPS Kilitli/Progressive/Dinamik/Premium. Moral %20 altı → vergi sıfırlanır (tüm sistemlerde).' },
    { baslik:'Savaş Sistemi', icerik:'6 turlu, 4 saf (3-3-5-3 slot). Zırh birim-bazlı (Albion: 1/(1+zirh/50)). İska yüzdesel deterministik.' },
    { baslik:'Saf Dizilimi', icerik:'Saf 1-3: piyade/baltacı/savaşçı. Saf 4: okçu/buyücü/balista. Rahip her safta diriltir.' },
    { baslik:'Çağ Atlama', icerik:'1-5 aralık. Her çağ yeni binalar/üniteler. Atlama maliyeti exponential, geri dönüşsüz.' },
    { baslik:'Guild', icerik:'5+ oyuncu birlik. Guild binası gerekli. Kasa, ordu, market, araştırma. Faz 3b: kuşatma planlı.' },
    { baslik:'Pazar Ekonomisi', icerik:'10 hammadde (gümüş/mitril/...) + market kuru %70-130 dalgalı. PvP ilan + Kadim Şehirler NPC ticaret.' },
    { baslik:'Casus & Büyü', icerik:'28 büyü (10 kademe), 11 casus operasyon. Mistik atak/defans, hipnoz, sadakat — hepsi savaşta etkin.' },
    { baslik:'Bilge Sistemi', icerik:'4 Bilge — 168 P.G. cooldown, 2x mana etki. 336 P.G.\'de küresel bilge döngüsü.' },
    { baslik:'Kadim Şehirler', icerik:'Aurium (Işık) + Gorathul (Karanlık). Ticaret yap → 240 P.G. sonra çapraz NPC saldırı (3 P.G. yolculuk). Holding muafiyet.' },
    { baslik:'Artifact Sistemi', icerik:'30+ artifact, çağ bazlı etki. Ganimet/esir bonus saldırana, alan koruma savunana.' },
    { baslik:'Kervan Sistemi', icerik:'Max 5 (premium +1), 1-500 eşek, 5000 birim/eşek. Yolculuk sonraki gün varış.' },
    { baslik:'Premium Sistemi', icerik:'3 paket: bronz/gümüş/altın. Vergi limit, kervan +1, ekstra kaynak, simulasyon hakkı.' },
    { baslik:'Festival', icerik:'+15 / +40 / +100 saatlik moral bonus. Aktif festival kullanılan kaynak limit.' },
    { baslik:'Mezarlık', icerik:'Olen unitelerin %30\'u 24 saat içinde diriltilebilir (ücretli/ücretsiz).' },
    { baslik:'Sezon & Rozet', icerik:'Sezon başı/sonu rozet. Profilde gösterilir. Yeni sezon = oyun sıfırlama.' },
    { baslik:'Diplomasi', icerik:'Guild antlaşma/ittifak/savaş. İhanet → -%6 ATK/DEF debuff, 24h.' },
    { baslik:'Bina Dayanıklılık', icerik:'%0-100, doğal yıpranma 4 P.G./%0.5. %20 altı yıkım şansı. Hızlı tamir = altın x2 (anında).' },
    { baslik:'Tarla & Çiftçi', icerik:'1 tarla = 50 çiftçi kapasitesi. Tarla yoksa çiftçi atanamaz, buğday üretimi 0.' },
    { baslik:'Köprü/Yol', icerik:'Harita 200x50 grid, 9 bölge. Her bölgenin farklı kaynak bonusu.' },
  ];

  // ──────────────────────────────────────────────
  // STATE: dismiss, tab, sub-tab, insights cache
  // ──────────────────────────────────────────────
  var aktifTab = 'yol';
  var aktifSubTab = 'onboarding'; // yol için
  var aktifTier = 'hepsi'; // akilli için
  var panelAcik = false;
  var insightsCache = null;
  var questCache = null;

  var DISMISS_KEY = 'noxara_bilgelik_dismissed';
  function getDismissed() {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
  }
  function dismissRule(id) {
    var d = getDismissed();
    if (!d.includes(id)) d.push(id);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
  }
  function undismissAll() {
    localStorage.removeItem(DISMISS_KEY);
  }

  // ──────────────────────────────────────────────
  // BACKEND FETCH HELPERS
  // ──────────────────────────────────────────────
  function getApiBase() {
    if (typeof API_BASE !== 'undefined') return API_BASE;
    if (window.API_BASE) return window.API_BASE;
    return '';
  }
  async function fetchInsights() {
    try {
      var t = window.getToken && window.getToken();
      if (!t) return null;
      var r = await fetch(getApiBase() + '/api/player/insights', {
        headers: { Authorization: 'Bearer ' + t }
      });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }
  async function fetchQuests() {
    try {
      var t = window.getToken && window.getToken();
      if (!t) return null;
      var r = await fetch(getApiBase() + '/api/gorev/liste', {
        headers: { Authorization: 'Bearer ' + t }
      });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  // ──────────────────────────────────────────────
  // RENDER HELPERS
  // ──────────────────────────────────────────────
  function fmt(n) { return Math.floor(Number(n)||0).toLocaleString('tr-TR'); }
  function fmtSigned(n) {
    var x = Math.round(Number(n)||0);
    return (x >= 0 ? '+' : '') + x.toLocaleString('tr-TR');
  }
  function safeText(t) { return String(t || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }

  function progressYuzde() {
    var s = getState();
    var done = ONBOARDING.filter(g => { try { return g.bitti(s); } catch { return false; } }).length;
    return Math.round((done / ONBOARDING.length) * 100);
  }

  function aktifAkilliSayisi() {
    var s = getState();
    var dismissed = getDismissed();
    return AKILLI.filter(r => {
      if (dismissed.includes(r.id)) return false;
      try { return r.kosul(s); } catch { return false; }
    }).length;
  }

  // ──────────────────────────────────────────────
  // TAB: YOL (Onboarding + Quest)
  // ──────────────────────────────────────────────
  function renderYol() {
    var s = getState();
    var subTabs = ''
      + '<div class="bk-subtabs">'
      + '<button class="bk-subtab' + (aktifSubTab==='onboarding'?' active':'') + '" onclick="bilgelik.subtab(\'onboarding\')">Başlangıç (' + ONBOARDING.filter(g => { try {return g.bitti(s)} catch{return false} }).length + '/' + ONBOARDING.length + ')</button>'
      + '<button class="bk-subtab' + (aktifSubTab==='quest'?' active':'') + '" onclick="bilgelik.subtab(\'quest\')">Resmi Görevler</button>'
      + '</div>';

    if (aktifSubTab === 'onboarding') {
      var liste = ONBOARDING.map(function(g) {
        var bitti = false; try { bitti = g.bitti(s); } catch {}
        return '<div class="bk-task' + (bitti?' done':'') + '">'
          + '<div class="bk-check">' + (bitti?'✓':'!') + '</div>'
          + '<div class="bk-task-info">'
            + '<div class="bk-task-title">' + safeText(g.baslik) + '</div>'
            + '<div class="bk-task-desc">' + safeText(g.aciklama) + '</div>'
          + '</div>'
          + (bitti
              ? '<button class="bk-action done">Tamam</button>'
              : '<a href="' + g.link + '" class="bk-action">Git</a>')
          + '</div>';
      }).join('');
      return subTabs + liste;
    }

    // QUEST sub-tab
    if (!questCache) {
      return subTabs + '<div class="bk-loading">Resmi görevler yükleniyor…</div>';
    }
    // v1.14.2.4: Tamamlanip odul alinanlari default gizle (Sezgi: "yapilan gorevler gitmiyor")
    var quests = (questCache.gorevler || []).filter(q => !q.kilitli && q.durum !== 'odul_alindi');
    if (quests.length === 0) {
      var toplamBitmis = (questCache.gorevler || []).filter(q => q.durum === 'odul_alindi').length;
      var msg = toplamBitmis > 0
        ? `🎉 ${toplamBitmis} görev tamamlandı, ödülleri alındı! Yeni görev için çağ atla.`
        : 'Aktif görevin yok. Çağ atladıkça yeni görevler açılır.';
      return subTabs + '<div class="bk-success-box">' + msg + '</div>';
    }
    return subTabs + quests.map(function(q) {
      var pct = q.hedef ? Math.round((q.ilerleme / q.hedef) * 100) : 0;
      var hazir = q.durum === 'tamamlandi';
      var alindi = q.durum === 'odul_alindi';
      var oduller = [];
      if (q.odul) {
        for (var k in q.odul) if (q.odul[k]) oduller.push(fmt(q.odul[k]) + ' ' + k);
      }
      return '<div class="bk-quest' + (alindi?' done':(hazir?' ready':'')) + '">'
        + '<div class="bk-quest-head">'
          + '<b>' + safeText(q.baslik) + '</b>'
          + (alindi ? '<span class="bk-badge done">✓</span>' : (hazir ? '<span class="bk-badge ready">ÖDÜLE HAZIR</span>' : '<span class="bk-badge">' + pct + '%</span>'))
        + '</div>'
        + (q.aciklama ? '<div class="bk-quest-desc">' + safeText(q.aciklama) + '</div>' : '')
        + '<div class="bk-progress-bar small"><div class="bk-progress-fill" style="width:' + pct + '%"></div></div>'
        + '<div class="bk-quest-meta">'
          + '<span>' + fmt(q.ilerleme) + ' / ' + fmt(q.hedef) + '</span>'
          + (oduller.length ? '<span class="bk-rewards">🎁 ' + oduller.join(', ') + '</span>' : '')
        + '</div>'
        + (hazir ? '<a href="gorev.html" class="bk-action" style="display:block;text-align:center;margin-top:6px">Ödülü Al</a>' : '')
        + '</div>';
    }).join('');
  }

  // ──────────────────────────────────────────────
  // TAB: AKILLI (35 kural + tier filter + dismiss)
  // ──────────────────────────────────────────────
  function renderAkilli() {
    var s = getState();
    var dismissed = getDismissed();
    var rules = AKILLI.filter(r => {
      if (dismissed.includes(r.id)) return false;
      if (aktifTier !== 'hepsi' && r.tier !== aktifTier) return false;
      try { return r.kosul(s); } catch { return false; }
    });

    var tierFilter = ''
      + '<div class="bk-subtabs">'
      + ['hepsi','acil','orta','ileri'].map(function(t) {
        return '<button class="bk-subtab' + (aktifTier===t?' active':'') + '" onclick="bilgelik.tier(\'' + t + '\')">' + t.toUpperCase() + '</button>';
      }).join('')
      + (dismissed.length ? '<button class="bk-subtab reset" title="Tüm gizlenmiş kuralları geri getir" onclick="bilgelik.undismiss()">↻ ' + dismissed.length + '</button>' : '')
      + '</div>';

    // Hizli durum kart
    var max = ({1:1500, 2:2375, 3:3250, 4:4125, 5:5000})[s.cag] || 1500;
    var moralPct = Math.round(((s.O.sehir_morali || 0) / max) * 100);
    var durum = '<div class="bk-card">'
      + '<h4>📦 Hızlı Durum</h4>'
      + '<div class="bk-row"><span>Çağ</span><b>' + s.cag + '</b></div>'
      + '<div class="bk-row"><span>Açlık</span><b class="' + ((s.O.aclik||0) > 50 ? 'bad' : 'good') + '">%' + (s.O.aclik||0) + '</b></div>'
      + '<div class="bk-row"><span>Şehir Morali</span><b class="' + (moralPct < 30 ? 'bad' : (moralPct < 60 ? 'mid' : 'good')) + '">' + fmt(s.O.sehir_morali||0) + ' (%' + moralPct + ')</b></div>'
      + '<div class="bk-row"><span>Ordu Morali</span><b>' + (s.O.ordu_morali||100) + '/100</b></div>'
      + '<div class="bk-row"><span>Altın</span><b>' + fmt(s.R.altin||0) + '</b></div>'
      + '<div class="bk-row"><span>Buğday</span><b>' + fmt(s.R.bugday||0) + '</b></div>'
      + '</div>';

    if (rules.length === 0) {
      return tierFilter + durum + '<div class="bk-success-box">✅ Bu kategoride uyarı yok. Görevlere bak veya stratejine devam et.</div>';
    }

    var rulesHtml = rules.map(function(r) {
      var msg = (typeof r.mesaj === 'function') ? r.mesaj(s) : r.mesaj;
      var coz = (r.cozum || []).map(c => '<li>' + safeText(c) + '</li>').join('');
      var tierClass = r.tier === 'acil' ? 'warning' : (r.tier === 'orta' ? 'mid' : 'success');
      return '<div class="bk-' + tierClass + '-box rule">'
        + '<button class="bk-dismiss" onclick="bilgelik.dismiss(\'' + r.id + '\')" title="Bu kurali gizle">✕</button>'
        + '<b>' + safeText(msg) + '</b>'
        + (coz ? '<ol>' + coz + '</ol>' : '')
        + '</div>';
    }).join('');
    return tierFilter + durum + rulesHtml;
  }

  // ──────────────────────────────────────────────
  // TAB: STRATEJI (Roadmap + ROI)
  // ──────────────────────────────────────────────
  function renderStrateji() {
    var s = getState();
    var rm = STRATEJI_ROADMAP[s.cag] || STRATEJI_ROADMAP[1];
    var roi = hesaplaROI(s);

    var roadmap = '<div class="bk-card">'
      + '<h4>🗺️ ' + safeText(rm.baslik) + '</h4>'
      + '<ol class="bk-roadmap">'
      + rm.asamalar.map(a => '<li>' + safeText(a) + '</li>').join('')
      + '</ol>'
      + '</div>';

    var cagSec = '<div class="bk-cag-sec">'
      + 'Diğer çağlar: '
      + [1,2,3,4,5].filter(c => c !== s.cag).map(c =>
          '<button class="bk-cag-btn" onclick="bilgelik.cagPreview(' + c + ')">Çağ ' + c + '</button>'
        ).join(' ')
      + '</div>';

    var roiHtml = '';
    if (roi.length > 0) {
      roiHtml = '<div class="bk-card">'
        + '<h4>💰 Yatırım Önerileri (ROI)</h4>'
        + roi.map(function(r) {
          var pCol = r.oncelik.startsWith('YÜKSEK') ? 'high' : 'mid';
          return '<div class="bk-roi ' + pCol + '">'
            + '<div class="bk-roi-head"><b>' + safeText(r.bina) + '</b><span class="bk-priority">' + r.oncelik + '</span></div>'
            + '<div class="bk-roi-body">'
              + '<div>📈 ' + safeText(r.etki) + '</div>'
              + '<div>💸 ' + safeText(r.maliyet) + '</div>'
            + '</div>'
            + '</div>';
        }).join('')
        + '</div>';
    } else {
      roiHtml = '<div class="bk-success-box">📊 Tüm temel binalar dengede. Çağ ilerletmeye odaklan.</div>';
    }

    return roadmap + cagSec + roiHtml;
  }

  // ──────────────────────────────────────────────
  // TAB: INSIGHTS (siralama + trend + uyari)
  // ──────────────────────────────────────────────
  function renderInsights() {
    if (!insightsCache) {
      return '<div class="bk-loading">İnsights yükleniyor…</div>';
    }
    if (!insightsCache.ok) {
      return '<div class="bk-warning-box">İnsights alınamadı (' + safeText(insightsCache.error || '?') + ')</div>';
    }

    var ic = insightsCache;

    // Sıralama
    var siralama = '<div class="bk-card">'
      + '<h4>🏆 Sıralama</h4>';
    if (ic.ranking.ordu_gucu.rank) {
      siralama += '<div class="bk-row">'
        + '<span>Ordu Gücü</span>'
        + '<b>#' + ic.ranking.ordu_gucu.rank + '/' + ic.ranking.ordu_gucu.total + ' (üst %' + (100 - ic.ranking.ordu_gucu.percentile + 1) + ')</b>'
        + '</div>';
    }
    if (ic.ranking.cesaret.rank) {
      siralama += '<div class="bk-row">'
        + '<span>Cesaret</span>'
        + '<b>#' + ic.ranking.cesaret.rank + '/' + ic.ranking.cesaret.total + ' (' + fmt(ic.ranking.cesaret.benim) + ' puan)</b>'
        + '</div>';
    }
    siralama += '<div class="bk-row">'
      + '<span>Şehir Değeri</span>'
      + '<b>' + fmt(ic.ranking.sehir_deger.benim) + '</b>'
      + '</div>'
      + '</div>';

    // Trend 24h
    var trend24Html = '';
    if (ic.trend_24h) {
      var keys = ['altin','asker','total_worker','bugday','odun','metal'];
      trend24Html = '<div class="bk-card">'
        + '<h4>📈 Son 24 P.G. Trend</h4>'
        + keys.map(function(k) {
          var d = ic.trend_24h[k];
          if (!d) return '';
          var cls = d.delta > 0 ? 'good' : (d.delta < 0 ? 'bad' : 'mid');
          return '<div class="bk-row">'
            + '<span>' + ({altin:'Altın',asker:'Asker',total_worker:'Nüfus',bugday:'Buğday',odun:'Odun',metal:'Metal'}[k]||k) + '</span>'
            + '<b class="' + cls + '">' + fmtSigned(d.delta) + (d.yuzde !== null ? ' (' + fmtSigned(d.yuzde) + '%)' : '') + '</b>'
            + '</div>';
        }).join('')
        + '</div>';
    } else {
      trend24Html = '<div class="bk-card"><h4>📈 Trend</h4><div class="bk-row">Henüz yeterli snapshot yok (24 saat bekle).</div></div>';
    }

    // Trend 7 gün
    var trend7Html = '';
    if (ic.trend_7g) {
      trend7Html = '<div class="bk-card">'
        + '<h4>📊 Son 7 P.G. Trend</h4>'
        + ['altin','total_worker','asker'].map(function(k) {
          var d = ic.trend_7g[k];
          if (!d) return '';
          var cls = d.delta > 0 ? 'good' : (d.delta < 0 ? 'bad' : 'mid');
          return '<div class="bk-row">'
            + '<span>' + ({altin:'Altın',asker:'Asker',total_worker:'Nüfus'}[k]||k) + '</span>'
            + '<b class="' + cls + '">' + fmtSigned(d.delta) + (d.yuzde !== null ? ' (' + fmtSigned(d.yuzde) + '%)' : '') + '</b>'
            + '</div>';
        }).join('')
        + '</div>';
    }

    // Uyarılar
    var uyariHtml = '';
    if (ic.uyarilar && ic.uyarilar.length > 0) {
      uyariHtml = '<div class="bk-card">'
        + '<h4>⚠️ Öngörü Uyarıları</h4>'
        + ic.uyarilar.map(function(u) {
          var cls = u.seviye === 'acil' ? 'warning' : 'mid';
          return '<div class="bk-' + cls + '-box compact">'
            + '<b>' + safeText(u.mesaj) + '</b>'
            + (u.ipucu ? '<div class="bk-ipucu">💡 ' + safeText(u.ipucu) + '</div>' : '')
            + '</div>';
        }).join('')
        + '</div>';
    } else {
      uyariHtml = '<div class="bk-success-box">✅ Sistem sağlıklı. Aktif öngörü uyarısı yok.</div>';
    }

    return siralama + uyariHtml + trend24Html + trend7Html;
  }

  // ──────────────────────────────────────────────
  // TAB: CODEX
  // ──────────────────────────────────────────────
  function renderCodex() {
    return CODEX.map(function(c) {
      return '<div class="bk-task">'
        + '<div class="bk-check">?</div>'
        + '<div class="bk-task-info">'
          + '<div class="bk-task-title">' + safeText(c.baslik) + '</div>'
          + '<div class="bk-task-desc">' + safeText(c.icerik) + '</div>'
        + '</div>'
        + '</div>';
    }).join('') + '<a href="codex.html" style="display:block;text-align:center;color:#d4af37;font-size:11px;margin-top:10px;text-decoration:none">→ Tüm Codex (200+ giriş)</a>';
  }

  // ──────────────────────────────────────────────
  // PANEL RENDER
  // ──────────────────────────────────────────────
  function renderPanel() {
    var pct = progressYuzde();
    var akilliSayi = aktifAkilliSayisi();
    var icerik;
    switch (aktifTab) {
      case 'yol': icerik = renderYol(); break;
      case 'akilli': icerik = renderAkilli(); break;
      case 'strateji': icerik = renderStrateji(); break;
      case 'insights': icerik = renderInsights(); break;
      case 'codex': icerik = renderCodex(); break;
      default: icerik = renderYol();
    }

    var uyariSayi = (insightsCache && insightsCache.uyarilar) ? insightsCache.uyarilar.length : 0;

    return ''
      + '<div class="bk-header">'
        + '<h2>📘 Bilgelik Kitabı</h2>'
        + '<button class="bk-close" onclick="bilgelik.kapat()">✕</button>'
        + '<div class="bk-progress-text"><span>Başlangıç ilerlemesi</span><span>' + pct + '%</span></div>'
        + '<div class="bk-progress-bar"><div class="bk-progress-fill" style="width:' + pct + '%"></div></div>'
      + '</div>'
      + '<div class="bk-tabs">'
        + '<button class="bk-tab' + (aktifTab==='yol'?' active':'') + '" onclick="bilgelik.tab(\'yol\')" title="Yol — başlangıç + resmi görevler">🗺️</button>'
        + '<button class="bk-tab' + (aktifTab==='akilli'?' active':'') + '" onclick="bilgelik.tab(\'akilli\')" title="Akıllı uyarılar">💡'
          + (akilliSayi > 0 ? '<span class="bk-tab-badge">' + akilliSayi + '</span>' : '')
          + '</button>'
        + '<button class="bk-tab' + (aktifTab==='strateji'?' active':'') + '" onclick="bilgelik.tab(\'strateji\')" title="Çağ stratejisi + ROI">⚔️</button>'
        + '<button class="bk-tab' + (aktifTab==='insights'?' active':'') + '" onclick="bilgelik.tab(\'insights\')" title="Sıralama + trend">📊'
          + (uyariSayi > 0 ? '<span class="bk-tab-badge">' + uyariSayi + '</span>' : '')
          + '</button>'
        + '<button class="bk-tab' + (aktifTab==='codex'?' active':'') + '" onclick="bilgelik.tab(\'codex\')" title="Bilgi codex\'i">📚</button>'
      + '</div>'
      + '<div class="bk-content">' + icerik + '</div>';
  }

  function rerender() {
    var p = document.getElementById('bk-panel');
    if (p && panelAcik) p.innerHTML = renderPanel();
  }

  function panelAc() {
    panelAcik = true;
    var p = document.getElementById('bk-panel');
    if (p) {
      p.innerHTML = renderPanel();
      p.classList.add('open');
      var fab = document.getElementById('bk-fab');
      if (fab) fab.style.display = 'none';

      // v1.14.2.4: Her açılışta cache sıfırla (Sezgi: "yapilan gorevler gitmiyor" — eski cache vardi)
      // Cache 5dk geçerliydi, panel kapatıp açtığında eski liste gösteriliyordu.
      insightsCache = null;
      questCache = null;
      fetchInsights().then(d => { insightsCache = d || { ok:false, error:'fetch fail' }; rerender(); });
      fetchQuests().then(d => { questCache = d || { gorevler: [] }; rerender(); });
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
    rerender();
  }
  function subTabSec(t) {
    aktifSubTab = t;
    rerender();
  }
  function tierSec(t) {
    aktifTier = t;
    rerender();
  }
  function dismissAndRerender(id) {
    dismissRule(id);
    rerender();
  }
  function undismissAndRerender() {
    undismissAll();
    rerender();
  }
  function cagPreview(c) {
    // Geçici override + rerender
    var rm = STRATEJI_ROADMAP[c];
    if (!rm) return;
    var p = document.getElementById('bk-panel');
    if (!p) return;
    var content = p.querySelector('.bk-content');
    if (content) {
      content.innerHTML = '<div class="bk-card">'
        + '<h4>🗺️ ' + safeText(rm.baslik) + ' <span style="font-size:10px;color:#94a3b8">(önizleme)</span></h4>'
        + '<ol class="bk-roadmap">' + rm.asamalar.map(a => '<li>' + safeText(a) + '</li>').join('') + '</ol>'
        + '</div>'
        + '<button class="bk-action" onclick="bilgelik.tab(\'strateji\')" style="display:block;width:100%;margin-top:10px">← Geri (Çağ ' + getState().cag + ')</button>';
    }
  }

  // ──────────────────────────────────────────────
  // INIT — DOM + CSS
  // ──────────────────────────────────────────────
  function init() {
    if (document.getElementById('bk-fab')) return;
    if (!window.getToken || !window.getToken()) return;

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
      @media (min-width: 769px) { #bk-fab { bottom: 16px; } }

      #bk-panel {
        position: fixed; right: 0; top: 0; bottom: 0;
        width: 420px; max-width: 100vw;
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
          height: 88vh; border-left: none;
          border-top: 1px solid rgba(212,175,55,.5);
          border-radius: 16px 16px 0 0;
          transform: translateY(100%);
        }
        #bk-panel.open { transform: translateY(0); }
      }

      .bk-header {
        padding: 14px 16px; border-bottom: 1px solid rgba(148, 163, 184, .18);
        background: linear-gradient(135deg, #1e293b, #111827);
        position: relative; color: #f9fafb;
      }
      .bk-header h2 { margin: 0 0 4px; font-size: 18px; color: #d4af37; font-family: Cinzel, serif; }
      .bk-close {
        position: absolute; top: 10px; right: 10px;
        background: transparent; border: none; color: #cbd5e1;
        font-size: 20px; cursor: pointer; width: 32px; height: 32px;
        border-radius: 50%;
      }
      .bk-close:hover { background: rgba(255,255,255,0.1); }
      .bk-progress-text {
        display: flex; justify-content: space-between;
        font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 4px;
      }
      .bk-progress-bar {
        height: 6px; background: #1f2937; border-radius: 999px; overflow: hidden;
      }
      .bk-progress-bar.small { height: 4px; margin: 6px 0 4px; }
      .bk-progress-fill {
        height: 100%; background: linear-gradient(90deg, #22c55e, #fbbf24);
        transition: width .25s ease;
      }
      .bk-tabs {
        display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;
        padding: 8px; border-bottom: 1px solid rgba(148, 163, 184, .18);
        background: #0f172a;
      }
      .bk-tab {
        background: #1e293b; border: 1px solid rgba(148, 163, 184, .2);
        color: #e5e7eb; border-radius: 8px; padding: 10px 4px; cursor: pointer;
        font-size: 16px; font-weight: 500; position: relative;
      }
      .bk-tab.active { background: #d4af37; color: #111827; font-weight: 700; border-color: #d4af37; }
      .bk-tab-badge {
        position: absolute; top: -4px; right: -4px;
        background: #e74c3c; color: #fff; font-size: 9px; font-weight: bold;
        padding: 1px 5px; border-radius: 8px; min-width: 16px; text-align: center;
        border: 1.5px solid #0f172a;
      }
      .bk-subtabs {
        display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;
      }
      .bk-subtab {
        background: #1e293b; border: 1px solid rgba(148, 163, 184, .2);
        color: #cbd5e1; border-radius: 6px; padding: 5px 10px; cursor: pointer;
        font-size: 11px; font-weight: 500;
      }
      .bk-subtab.active { background: #d4af37; color: #111827; font-weight: 700; }
      .bk-subtab.reset { margin-left: auto; background: #4c1d95; color: #ddd6fe; }

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

      .bk-quest {
        background: #111827; border: 1px solid rgba(148, 163, 184, .18);
        border-radius: 10px; padding: 10px; margin-bottom: 8px;
      }
      .bk-quest.ready { border-color: rgba(251, 191, 36, .55); background: rgba(120, 53, 15, .15); }
      .bk-quest.done { border-color: rgba(34, 197, 94, .45); background: rgba(22, 101, 52, .12); }
      .bk-quest-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      .bk-quest-head b { font-size: 13px; color: #f9fafb; }
      .bk-quest-desc { font-size: 11px; color: #cbd5e1; margin: 4px 0; line-height: 1.4; }
      .bk-quest-meta { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px; }
      .bk-rewards { color: #fbbf24; }
      .bk-badge { font-size: 10px; padding: 3px 8px; border-radius: 999px;
        background: #1e293b; color: #cbd5e1; border: 1px solid rgba(148, 163, 184, .25); }
      .bk-badge.ready { background: #fbbf24; color: #111; border-color: #fbbf24; font-weight: 700; }
      .bk-badge.done { background: #22c55e; color: #052e16; border-color: #22c55e; }

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
      .mid { color: #fbbf24; font-weight: 700; }
      .good { color: #86efac; font-weight: 700; }

      .bk-warning-box, .bk-success-box, .bk-mid-box {
        border-radius: 10px; padding: 12px; margin-bottom: 10px;
        font-size: 12px; line-height: 1.5; position: relative;
      }
      .bk-warning-box {
        background: rgba(127, 29, 29, .35); border: 1px solid rgba(248, 113, 113, .35);
        color: #fecaca;
      }
      .bk-mid-box {
        background: rgba(120, 53, 15, .25); border: 1px solid rgba(251, 191, 36, .35);
        color: #fde68a;
      }
      .bk-success-box {
        background: rgba(20, 83, 45, .35); border: 1px solid rgba(34, 197, 94, .35);
        color: #bbf7d0;
      }
      .bk-warning-box.compact, .bk-mid-box.compact, .bk-success-box.compact {
        padding: 8px 10px; font-size: 11px; margin-bottom: 6px;
      }
      .bk-warning-box ol, .bk-success-box ol, .bk-mid-box ol {
        margin: 6px 0 0; padding-left: 18px; font-size: 11px;
      }
      .bk-warning-box ol li, .bk-success-box ol li, .bk-mid-box ol li { margin-bottom: 2px; }
      .bk-ipucu { margin-top: 4px; font-size: 11px; opacity: 0.85; font-style: italic; }
      .bk-dismiss {
        position: absolute; top: 4px; right: 6px;
        background: transparent; border: none; color: #94a3b8;
        font-size: 14px; cursor: pointer; width: 22px; height: 22px;
        border-radius: 50%; padding: 0; opacity: 0.6;
      }
      .bk-dismiss:hover { opacity: 1; background: rgba(255,255,255,0.1); }
      .rule { padding-right: 30px; }

      .bk-roadmap { margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.7; color: #e5e7eb; }
      .bk-roadmap li { margin-bottom: 4px; }
      .bk-cag-sec { margin: 8px 0 14px; font-size: 11px; color: #94a3b8; }
      .bk-cag-btn {
        background: #1e293b; color: #cbd5e1; border: 1px solid rgba(148, 163, 184, .25);
        border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 10px; margin-right: 4px;
      }
      .bk-cag-btn:hover { background: #334155; }

      .bk-roi {
        background: #1e293b; border-left: 3px solid #fbbf24;
        border-radius: 6px; padding: 8px 10px; margin-bottom: 8px;
      }
      .bk-roi.high { border-left-color: #ef4444; }
      .bk-roi.mid { border-left-color: #fbbf24; }
      .bk-roi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .bk-roi-head b { font-size: 12px; color: #f9fafb; }
      .bk-priority {
        font-size: 9px; padding: 2px 6px; border-radius: 999px;
        background: rgba(239, 68, 68, .2); color: #fca5a5; font-weight: 700;
      }
      .bk-roi.mid .bk-priority { background: rgba(251, 191, 36, .2); color: #fde68a; }
      .bk-roi-body { font-size: 11px; color: #cbd5e1; line-height: 1.5; }

      .bk-loading { text-align: center; padding: 30px; color: #94a3b8; font-size: 12px; }
    `;
    document.head.appendChild(style);

    // FAB
    var fab = document.createElement('button');
    fab.id = 'bk-fab';
    fab.innerHTML = '📘<span class="bk-fab-badge" id="bk-fab-badge" style="display:none">0</span>';
    fab.title = 'Bilgelik Kitabı';
    fab.onclick = panelAc;
    document.body.appendChild(fab);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'bk-panel';
    panel.innerHTML = renderPanel();
    document.body.appendChild(panel);

    // ESC ile kapat
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panelAcik) panelKapat();
    });

    // Akıllı badge — periyodik güncelle
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
    setInterval(badgeGuncelle, 30000);

    // İnsights & quest cache 5 dakikada bir yenile (panel açıkken)
    setInterval(function() {
      if (!panelAcik) return;
      fetchInsights().then(d => { if (d) { insightsCache = d; if (aktifTab === 'insights') rerender(); } });
      fetchQuests().then(d => { if (d) { questCache = d; if (aktifTab === 'yol' && aktifSubTab === 'quest') rerender(); } });
    }, 300000);
  }

  // Public API
  window.bilgelik = {
    ac: panelAc,
    kapat: panelKapat,
    tab: tabSec,
    subtab: subTabSec,
    tier: tierSec,
    dismiss: dismissAndRerender,
    undismiss: undismissAndRerender,
    cagPreview: cagPreview,
  };

  // Boot
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 1500);
  } else {
    window.addEventListener('DOMContentLoaded', function() { setTimeout(init, 1500); });
  }
})();
