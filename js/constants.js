/* constants.js — Palantis game constants */

const LAND_PRICE_PER_TILE = 28;

const IRKLAR = {
  iyi: [
    { id:"insan", name:"İnsan", icon:"👑", color:"#f1c40f",
      bonuslar:["Altın +%2","Odun +%2","ATK +%2","DEF +%2"],
      desc:"Dengeli ırk. Her alanda hafif bonus." },
    { id:"elf", name:"Elf", icon:"🌿", color:"#2ecc71",
      bonuslar:["Odun +%5","Mana +%5","ATK +%5","Büyü Başarı +%5"],
      desc:"Doğa ve büyü ustası. Orman kaynaklarında güçlü." },
    { id:"cuce", name:"Cüce", icon:"⚒️", color:"#95a5a6",
      bonuslar:["Metal +%5","İşlenmiş Metal +%2","DEF +%5","Bina Fiyatları -%10"],
      desc:"Madenci ve zanaatkar ırkı. Savunmada güçlü." },
    { id:"bucukluk", name:"Buçukluk", icon:"🎭", color:"#9b59b6",
      bonuslar:["Altın +%7","Gizlilik +%5","İşçi Fiyatları -%5","Casus Başarı +%5"],
      desc:"Kurnaz tüccarlar. Casusluk ve ekonomide üstün." }
  ],
  kotu: [
    { id:"kara_elf", name:"Kara Elf", icon:"🖤", color:"#8e44ad",
      bonuslar:["Gizlilik +%8","Zehir ATK +%10","Mana +%5","Casus Başarı +%8"],
      desc:"Karanlık büyü ve zehir uzmanı." },
    { id:"ork", name:"Ork", icon:"💪", color:"#27ae60",
      bonuslar:["ATK +%8","Metal +%5","Bina Savunma +%5","Savaş Kızgınlığı +%5"],
      desc:"Ham güç ve savaş gücünde üstün." },
    { id:"ogre_irk", name:"Ogre", icon:"👹", color:"#e67e22",
      bonuslar:["ATK +%10","DEF +%5","Bina Yıkım +%15","Alan Kapasitesi +%5"],
      desc:"Dev güçlü, yavaş ama yıkıcı." },
    { id:"undead", name:"Undead", icon:"💀", color:"#7f8c8d",
      bonuslar:["İskelet Eğitim -%20","Orduyu Yenile +%5","Metal +%3","Savunma +%5"],
      desc:"Ölümsüzler ordusu. Sonsuz asker kaynağı." }
  ]
};

/* ── BİNA DB ── */
const BLDGS = {
  oduncu:{id:'oduncu',cat:'uretim',icon:'🌳',name:'Oduncu Kampı',bg:'#0a160a',desc:"Günlük odun üretir.",maxLv:10,lv:3,fx:l=>[{t:'pos',s:`+${l*40} Odun/gün`}],cost:l=>({odun:l*200,tas:l*100,altin:l*50}),time:l=>l*3600},
  tas_ocagi:{id:'tas_ocagi',cat:'uretim',icon:'🪨',name:'Taş Ocağı',bg:'#16140a',desc:"Taş çıkarır.",maxLv:10,lv:2,fx:l=>[{t:'pos',s:`+${l*30} Taş/gün`}],cost:l=>({odun:l*150,altin:l*80}),time:l=>l*3600},
  demir_madeni:{id:'demir_madeni',cat:'uretim',icon:'🪨',name:'Demir Madeni',bg:'#101018',desc:"Ham metal üretir.",maxLv:10,lv:2,fx:l=>[{t:'pos',s:`+${l*25} Metal/gün`}],cost:l=>({odun:l*200,tas:l*150,altin:l*100}),time:l=>l*3600},
  tarla:{id:'tarla',cat:'uretim',icon:'🌾',name:'Tarla',bg:'#161400',desc:"Buğday üretir.",maxLv:10,lv:5,fx:l=>[{t:'pos',s:`+${l*60} Buğday/gün`},{t:'pos',s:`Açlık -%${l*2}`}],cost:l=>({odun:l*100,altin:l*40}),time:l=>l*3600},
  balikci:{id:'balikci',cat:'uretim',icon:'🎣',name:'Balıkçı Limanı',bg:'#001616',desc:"Balık üretir. Hasat günü 2x.",maxLv:5,lv:1,fx:l=>[{t:'pos',s:`+${l*20} Balık/gün`},{t:'pos',s:'Hasat: 2x'}],cost:l=>({odun:l*300,tas:l*200,altin:l*120}),time:l=>l*3600},
  isleme:{id:'isleme',cat:'uretim',icon:'🔩',name:'İşleme Atölyesi',bg:'#141000',desc:"Ham → İşlenmiş ürün dönüştürür.",maxLv:8,lv:2,fx:l=>[{t:'pos',s:`İşleme +${l*10}%`},{t:'pos',s:`Kapasite ${l*500}`}],cost:l=>({odun:l*250,metal:l*150,altin:l*200}),time:l=>l*3600},
  kisla:{id:'kisla',cat:'askeri',icon:'⚔️',name:'Kışla',bg:'#180a0a',desc:"Piyade ve temel birimleri eğitir.",maxLv:10,lv:3,fx:l=>[{t:'pos',s:`${l} birim tipi`},{t:'pos',s:`Eğitim +${l*8}%`}],cost:l=>({odun:l*300,tas:l*200,metal:l*100,altin:l*150}),time:l=>l*3600},
  ahar:{id:'ahar',cat:'askeri',icon:'🐴',name:'Ahır',bg:'#161000',desc:"Süvari birliklerini eğitir.",maxLv:8,lv:0,fx:l=>[{t:'pos',s:`Süvari ATK +${l*5}%`},{t:'pos',s:`Hız +${l*3}%`}],cost:l=>({odun:l*400,metal:l*200,altin:l*200}),time:l=>l*3600},
  surlar:{id:'surlar',cat:'askeri',icon:'🛡️',name:'Surlar',bg:'#0a0a18',desc:"Şehir savunmasını güçlendirir.",maxLv:10,lv:4,fx:l=>[{t:'pos',s:`DEF +${l*12}%`},{t:'pos',s:`Hasar -%${l*3}`}],cost:l=>({tas:l*400,metal:l*200,altin:l*100}),time:l=>l*3600},
  okcu_kulesi:{id:'okcu_kulesi',cat:'askeri',icon:'🏹',name:'Okçu Kulesi',bg:'#180d00',desc:"Savaşlarda otomatik atış yapar.",maxLv:6,lv:0,fx:l=>[{t:'pos',s:`${l} Okçu/tur`},{t:'pos',s:`ATK ${l*50}`}],cost:l=>({odun:l*500,tas:l*500,metal:l*300,altin:l*300}),time:l=>l*3600},
  akademi:{id:'akademi',cat:'gelisim',icon:'📚',name:'Akademi',bg:'#0a0a18',desc:"Araştırma ve teknoloji merkezi.",maxLv:8,lv:2,fx:l=>[{t:'pos',s:`Araştırma +${l*10}%`},{t:'pos',s:`${l} teknoloji slotu`}],cost:l=>({odun:l*300,altin:l*300}),time:l=>l*3600},
  buyucu_kulesi:{id:'buyucu_kulesi',cat:'gelisim',icon:'🔮',name:'Büyücü Kulesi',bg:'#150015',desc:"Büyü slotları ve güç artışı.",maxLv:10,lv:1,fx:l=>[{t:'pos',s:`${l*2} büyü slotu`},{t:'pos',s:`Büyü +${l*5}%`}],cost:l=>({altin:l*500,metal:l*200}),time:l=>l*3600},
  kutuphane:{id:'kutuphane',cat:'gelisim',icon:'📖',name:'Kütüphane',bg:'#0a1200',desc:"Üretim verimliliği ve araştırma indirgesi.",maxLv:6,lv:0,fx:l=>[{t:'pos',s:`Verimlilik +${l*3}%`},{t:'pos',s:`Araştırma -%${l*5}%`}],cost:l=>({odun:l*400,altin:l*400}),time:l=>l*3600},
  sehir_meydani:{id:'sehir_meydani',cat:'sosyal',icon:'🏛️',name:'Şehir Meydanı',bg:'#141400',desc:"Moral ve mutluluk merkezi.",maxLv:5,lv:1,fx:l=>[{t:'pos',s:`Moral +${l*5}`},{t:'pos',s:'Etkinlik slotu'}],cost:l=>({odun:l*200,tas:l*200,altin:l*100}),time:l=>l*3600},
  pazar:{id:'pazar',cat:'sosyal',icon:'💰',name:'Pazar',bg:'#160e00',desc:"Oyuncularla kaynak ticareti.",maxLv:8,lv:2,fx:l=>[{t:'pos',s:`${l*2} ticaret slotu`},{t:'pos',s:`Altın +${l*15}/gün`}],cost:l=>({odun:l*250,altin:l*200}),time:l=>l*3600},
  guild_binasi:{id:'guild_binasi',cat:'sosyal',icon:'🏰',name:'Guild Binası',bg:'#100018',desc:"Guild kurma ve yönetim merkezi.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`${l*10} üye kapasitesi`},{t:'pos',s:`Guild bonus +${l*5}%`}],cost:l=>({odun:l*600,tas:l*400,altin:l*500}),time:l=>l*3600},
  hazine:{id:'hazine',cat:'ozel',icon:'🏦',name:'Hazine',bg:'#141000',desc:"Depolama kapasitesi ve yağma koruması.",maxLv:10,lv:3,fx:l=>[{t:'pos',s:`Depo ${l*5000}`},{t:'pos',s:`Koruma %${l*5}`}],cost:l=>({odun:l*300,tas:l*300,metal:l*100,altin:l*100}),time:l=>l*3600},
  istihbarat:{id:'istihbarat',cat:'ozel',icon:'🕵️',name:'İstihbarat',bg:'#001510',desc:"Casusluk başarısı ve slotlar.",maxLv:6,lv:0,fx:l=>[{t:'pos',s:`Casus +${l*10}%`},{t:'pos',s:`${l} casus slotu`}],cost:l=>({altin:l*700,metal:l*300}),time:l=>l*3600},

  /* ── ŞEHİR BİNALARI ── */
  okul:{id:'okul',cat:'sehir',icon:'🏫',name:'Okul',bg:'#0a1200',desc:"Nüfus eğitimi ve kültür artışı.",maxLv:8,lv:0,fx:l=>[{t:'pos',s:`Eğitim +${l*5}%`},{t:'pos',s:`Nüfus sınırı +${l*50}`}],cost:l=>({odun:l*200,tas:l*100,altin:l*150}),time:l=>l*3600},
  asma_bahceler:{id:'asma_bahceler',cat:'sehir',icon:'🌺',name:'Asma Bahçeler',bg:'#0a1400',desc:"Mutluluk ve moral artışı.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Mutluluk +${l*8}`},{t:'pos',s:`Moral +${l*4}`}],cost:l=>({odun:l*300,altin:l*200}),time:l=>l*3600},
  muze:{id:'muze',cat:'sehir',icon:'🏛️',name:'Müze',bg:'#140e00',desc:"Kültür puanı ve prestij artışı.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Kültür +${l*10}%`},{t:'pos',s:`Prestij +${l*20}`}],cost:l=>({odun:l*400,tas:l*400,altin:l*500}),time:l=>l*3600},
  universite:{id:'universite',cat:'sehir',icon:'🎓',name:'Üniversite',bg:'#100a18',desc:"İleri araştırma ve teknoloji hızlanması.",maxLv:6,lv:0,fx:l=>[{t:'pos',s:`Araştırma +${l*15}%`},{t:'pos',s:`Bilim +${l*10}`}],cost:l=>({odun:l*500,tas:l*300,altin:l*600}),time:l=>l*3600},
  tiyatro:{id:'tiyatro',cat:'sehir',icon:'🎭',name:'Tiyatro',bg:'#14000e',desc:"Eğlence ve mutluluk merkezi.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Mutluluk +${l*6}`},{t:'pos',s:`Eğlence +${l*10}%`}],cost:l=>({odun:l*350,altin:l*300}),time:l=>l*3600},
  arena:{id:'arena',cat:'sehir',icon:'⚔️',name:'Arena',bg:'#180a0a',desc:"Savaş eğitimi ve gladyatör dövüşleri.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`ATK eğitim +${l*5}%`},{t:'pos',s:`Moral +${l*5}`}],cost:l=>({odun:l*400,tas:l*400,metal:l*200,altin:l*400}),time:l=>l*3600},
  uras_tapinagi:{id:'uras_tapinagi',cat:'sehir',icon:'🏯',name:'Uras Tapınağı',bg:'#140014',desc:"Tanrı Uras\u2019a adanm\u0131\u015f. Büyü gücü artırır.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Büyü +${l*10}%`},{t:'pos',s:`Mana regen +${l*2}`}],cost:l=>({odun:l*600,tas:l*500,altin:l*800}),time:l=>l*3600},
  ejderha_heykeli:{id:'ejderha_heykeli',cat:'sehir',icon:'🐉',name:'Ejderha Heykeli',bg:'#180a00',desc:"Prestij ve korku aracı. Savunma bonusu.",maxLv:3,lv:0,fx:l=>[{t:'pos',s:`Prestij +${l*50}`},{t:'pos',s:`Savunma korkusu +${l*8}%`}],cost:l=>({odun:l*1000,tas:l*800,metal:l*500,altin:l*1500}),time:l=>l*3600},

  /* ── ASKERİ TAPINAKLAR ── */
  rathe_tapinagi:{id:'rathe_tapinagi',cat:'askeri',icon:'⚔️',name:'Rathe Tapınağı',bg:'#180000',desc:"Savaş tanrısı Rathe'ye adanmış. ATK artışı.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`ATK +${l*8}%`},{t:'pos',s:`Savaşçı eğitim -%${l*5}`}],cost:l=>({odun:l*500,metal:l*400,altin:l*600}),time:l=>l*3600},
  xegony_tapinagi:{id:'xegony_tapinagi',cat:'askeri',icon:'💫',name:'Xegony Tapınağı',bg:'#000018',desc:"Büyü savaşı tapınağı. Büyücü gücü artırır.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Büyü ATK +${l*10}%`},{t:'pos',s:`Mana +${l*20}`}],cost:l=>({metal:l*300,altin:l*800}),time:l=>l*3600},
  fennin_tapinagi:{id:'fennin_tapinagi',cat:'askeri',icon:'🔥',name:'Fennin Ro Tapınağı',bg:'#180800',desc:"Ateş ve büyü tanrısına adanmış.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Ateş büyüsü +${l*12}%`},{t:'pos',s:`Hasar +${l*6}%`}],cost:l=>({metal:l*400,altin:l*700}),time:l=>l*3600},
  tunare_tapinagi:{id:'tunare_tapinagi',cat:'askeri',icon:'🌿',name:'Tunare Tapınağı',bg:'#001800',desc:"Doğa tanrıçasına adanmış. Savunma güçlendirir.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`DEF +${l*8}%`},{t:'pos',s:`İyileştirme +${l*5}%`}],cost:l=>({odun:l*600,altin:l*500}),time:l=>l*3600},
  mizrak_kulesi:{id:'mizrak_kulesi',cat:'askeri',icon:'🗼',name:'Mızrak Kulesi',bg:'#120a00',desc:"Savunma burcu. Saldıranlara hasar verir.",maxLv:8,lv:0,fx:l=>[{t:'pos',s:`${l*3} Mızrakçı/tur`},{t:'pos',s:`DEF +${l*30}`}],cost:l=>({odun:l*400,tas:l*600,metal:l*200,altin:l*200}),time:l=>l*3600},
  rahip_tapinagi:{id:'rahip_tapinagi',cat:'askeri',icon:'⛪',name:'Rahip Tapınağı',bg:'#0a0a14',desc:"Worshipper üretim merkezi. Büyü savaşı için.",maxLv:8,lv:0,fx:l=>[{t:'pos',s:`Worshipper +${l*250} kapasite`},{t:'pos',s:`Mana regen +${l*5}`}],cost:l=>({odun:l*300,tas:l*200,altin:l*400}),time:l=>l*3600},
  balista_kulesi:{id:'balista_kulesi',cat:'askeri',icon:'🏹',name:'Balista Kulesi',bg:'#180800',desc:"Uzun menzilli savunma. Büyük hasar.",maxLv:6,lv:0,fx:l=>[{t:'pos',s:`${l} Balista/tur`},{t:'pos',s:`Menzil hasar +${l*80}`}],cost:l=>({odun:l*600,metal:l*500,altin:l*400}),time:l=>l*3600},
  buyulu_tarlalar:{id:'buyulu_tarlalar',cat:'askeri',icon:'✨',name:'Büyülü Tarlalar',bg:'#0a0014',desc:"Büyü enerjisi toplar. Mana pasif üretir.",maxLv:6,lv:0,fx:l=>[{t:'pos',s:`+${l*10} Mana/gün`},{t:'pos',s:`Büyü gücü +${l*3}%`}],cost:l=>({odun:l*200,altin:l*500}),time:l=>l*3600},
  magara:{id:'magara',cat:'askeri',icon:'🐲',name:'Mağara',bg:'#1a0000',desc:"Ejderha çıkma şansı verir. Her mağara %0.01 şans ekler. Mağara yoksa ejderha çıkamaz.",maxLv:10,lv:0,fx:l=>[{t:'pos',s:`Ejderha şansı %${(l*0.01).toFixed(2)}`}],cost:l=>({tas:l*500,metal:l*300,altin:l*1000}),time:l=>l*3600},

  /* ── EĞLENCe ── */
  palantis_hani:{id:'palantis_hani',cat:'sosyal',icon:'🍺',name:'Palantis Hanı',bg:'#160e00',desc:"Böcek dövüşleri ve eğlence. Moral artırır.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`Moral +${l*5}`},{t:'pos',s:`Gelir +${l*10} altın/gün`}],cost:l=>({odun:l*250,altin:l*200}),time:l=>l*3600},
  taverna:{id:'taverna',cat:'sosyal',icon:'🎪',name:'Taverna (RP)',bg:'#14000a',desc:"Role-play alanı. Oyuncu etkileşimi.",maxLv:3,lv:0,fx:l=>[{t:'pos',s:`Prestij +${l*10}`},{t:'pos',s:`Sosyal bonus +${l*5}%`}],cost:l=>({odun:l*200,altin:l*150}),time:l=>l*3600},

  /* ═══ YENİ ASKERİ BİNALAR ═══ */
  ahir:{id:'ahir',cat:'askeri',icon:'🐴',name:'Ahır / Hara',bg:'#0d1200',desc:"At (Aydınlık) veya Kurt (Karanlık) üretir. Her bina günde 5 adet üretir. At/Kurt buğday tüketir.",maxLv:10,lv:0,fx:l=>[{t:'pos',s:`${l*5} At-Kurt/gün`},{t:'neg',s:`Buğday tüketir`}],cost:l=>({odun:l*300,metal:l*100,altin:l*500}),time:l=>l*3600},

  lonca:{id:'lonca',cat:'askeri',icon:'🎯',name:'Lonca',bg:'#0a0014',desc:"Gizlilik Puanı üretir. Her lonca günde 0.1 gizlilik üretir.",maxLv:10,lv:0,fx:l=>[{t:'pos',s:`${(l*0.1).toFixed(1)} Gizlilik/gün`}],cost:l=>({odun:l*200,metal:l*150,altin:l*400}),time:l=>l*3600},

  buyulu_tarla:{id:'buyulu_tarla',cat:'askeri',icon:'🥚',name:'Büyülü Tarla',bg:'#140014',desc:"Büyülü Yumurta üretir. Her tarla günde 0.1 yumurta üretir.",maxLv:100,lv:0,fx:l=>[{t:'pos',s:`${(l*0.1).toFixed(1)} B.Yumurta/gün`}],cost:l=>({odun:l*100,altin:l*300}),time:l=>l*3600},

  demirci:{id:'demirci',cat:'uretim',icon:'🔨',name:'Demirci',bg:'#1a0a00',desc:"Metal'i İşlenmiş Metal'e dönüştürür.",maxLv:5,lv:0,fx:l=>[{t:'pos',s:`${l*2} İşl.Metal/gün`}],cost:l=>({odun:l*150,metal:l*200,altin:l*300}),time:l=>l*3600},

  ocak:{id:'ocak',cat:'uretim',icon:'🔥',name:'Ocak',bg:'#1a0800',desc:"Çiğ eti pişirir. Her gün adet×15 çiğ et → pişmiş ete dönüştürür. 10 ocak → 1 fırın birleştirilebilir.",maxLv:999,lv:0,fx:l=>[{t:'pos',s:`${l*15} Pişmiş Et/gün`},{t:'neg',s:`${l*15} Çiğ Et tüketir`}],cost:l=>({odun:200,tas:100,altin:150}),time:l=>3600},

  /* ── KONUT BİNALARI ── */
  ev:{id:'ev',cat:'sehir',icon:'🏠',name:'Ev',bg:'#141414',desc:"Nüfus sınırını artırır. 10 ev → 1 köy birleştirilebilir. Her ev 1 alan kaplar.",maxLv:999,lv:0,fx:l=>[{t:'pos',s:`+50 Nüfus sınırı/ev`}],cost:l=>({odun:100,tas:50,altin:20}),time:l=>3600},
  koy:{id:'koy',cat:'sehir',icon:'🏘️',name:'Köy',bg:'#1a1200',desc:"10 ev birleştirince oluşur. 5 alan kaplar. +500 nüfus sınırı.",maxLv:999,lv:0,mergeOnly:true,fx:l=>[{t:'pos',s:`+500 Nüfus sınırı/köy`}],cost:l=>({}),time:l=>0},
  kasaba:{id:'kasaba',cat:'sehir',icon:'🏙️',name:'Kasaba',bg:'#1a1600',desc:"10 köy birleştirince oluşur. 25 alan kaplar. +5000 nüfus sınırı.",maxLv:999,lv:0,mergeOnly:true,fx:l=>[{t:'pos',s:`+5000 Nüfus sınırı/kasaba`}],cost:l=>({}),time:l=>0},

  /* ── BİRLEŞİK ÜRETİM ── */
  firin:{id:'firin',cat:'uretim',icon:'🍞',name:'Fırın',bg:'#1a0a00',desc:"10 ocak birleştirince oluşur. 5 alan kaplar. Buğday→Ekmek ve Balık→Pişmiş Balık dönüştürür.",maxLv:999,lv:0,mergeOnly:true,fx:l=>[{t:'pos',s:`${l*20} Ekmek/gün`},{t:'neg',s:`${l*20} Buğday tüketir`}],cost:l=>({}),time:l=>0},
};

// Bina alan maliyetleri (frontend mirror of BINA_ALAN backend)
const BINA_ALAN_FE = { koy: 5, kasaba: 25, firin: 5 };
function binaAlanFE(id) { return BINA_ALAN_FE[id] || 1; }

// Bina birleştirme kuralları (frontend mirror of BINA_BIRLESTIRME backend)
const BINA_BIRLESTIRME_FE = {
  koy:    { source: 'ev',   miktar: 10 },
  kasaba: { source: 'koy',  miktar: 10 },
  firin:  { source: 'ocak', miktar: 10 },
};

const RES={odun:2400,metal:1850,bugday:3200,balik:640,tas:1100,altin:5840,kereste:820,islenmis:310,ekmek:920,pismis:180,cig_et:0,pismis_et:0};
const _METAL_SVG = '<svg width="15" height="11" viewBox="0 0 15 11" style="display:inline-block;vertical-align:-1px"><path d="M2,1 L13,1 L11,10 L4,10 Z" fill="#8a8a8a" stroke="#666" stroke-width="0.5"/><path d="M4,3 L11,3 L9.5,8.5 L5.5,8.5 Z" fill="#b0b0b0"/></svg>';
const _ISLENMIS_SVG = '<svg width="15" height="11" viewBox="0 0 15 11" style="display:inline-block;vertical-align:-1px"><path d="M2,1 L13,1 L11,10 L4,10 Z" fill="#2471a3" stroke="#1a5276" stroke-width="0.5"/><path d="M4,3 L11,3 L9.5,8.5 L5.5,8.5 Z" fill="#5dade2"/></svg>';
const RICONS={odun:'🌳',metal:_METAL_SVG,bugday:'🌾',balik:'🎣',tas:'🪨',altin:'💰',kereste:'🪵',islenmis:_ISLENMIS_SVG,ekmek:'🍞',pismis:'🍳',cig_et:'🥩',pismis_et:'🍖',mana:'🔮',at:'🐴',kurt:'🐺',gizlilik:'🎯',buyulu_yumurta:'🥚'};

const UNITS = {
  /* ═══════════ AYDINLIK ═══════════ */
  piyade:{id:'piyade',side:'light',icon:'🗡️',name:'Piyade',role:'Hafif Piyade',tier:1,trainDays:1,
    baseAtk:2,baseDef:10,maas:20,
    atkGelArtis:0.5,defGelArtis:0.5,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[4,5,6],
    cost:{altin:3000,odun:75,islenmis:50},
    extraCost:{},
    traits:['Ön saf uzmanı','Ucuz birim'],
    trainTime:60,maxCount:99999,count:0,
    desc:"Temel piyade. Ucuz, hızlı üretilir. 4-5-6. turlarda savaşır."},

  baltaci:{id:'baltaci',side:'light',icon:'🪓',name:'Baltacı',role:'Hafif Saldırgan',tier:1,trainDays:1,
    baseAtk:2,baseDef:7,maas:15,
    atkGelArtis:0.5,defGelArtis:0.5,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[4,5,6],
    cost:{altin:2000,odun:75,metal:50},
    extraCost:{},
    traits:['Ucuz saldırı','Hafif zırh'],
    trainTime:90,maxCount:99999,count:0,
    desc:"Ucuz saldırı birimi. 4-5-6. turlarda savaşır."},

  okcu:{id:'okcu',side:'light',icon:'🏹',name:'Okçu',role:'Menzilli',tier:1,trainDays:1,
    baseAtk:5,baseDef:12,maas:28,
    atkGelArtis:0.5,defGelArtis:0.5,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[1,2,3],
    cost:{altin:6000,odun:300,islenmis:50},
    extraCost:{},
    traits:['Menzilli','İlk 3 turda saldırır'],
    trainTime:120,maxCount:99999,count:0,
    desc:"Menzilli saldırı. 1-2-3. turlarda savaşır."},

  savasci:{id:'savasci',side:'light',icon:'⚔️',name:'Savaşçı',role:'Ağır Piyade',tier:2,trainDays:2,
    baseAtk:6,baseDef:18,maas:32,
    atkGelArtis:0.5,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[2,3,4,5,6],
    cost:{altin:7500,odun:100,metal:50,islenmis:100},
    extraCost:{},
    traits:['Dengeli','5 turda savaşır'],
    trainTime:180,maxCount:99999,count:0,
    desc:"Dengeli saldırı ve savunma. 2-3-4-5-6. turlarda savaşır."},

  sovalye:{id:'sovalye',side:'light',icon:'🛡️',name:'Şovalye',role:'Zırhlı Tank',tier:2,trainDays:2,
    baseAtk:6,baseDef:22,maas:35,
    atkGelArtis:1,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[3,4,5,6],
    cost:{altin:10000,metal:120,islenmis:80},
    extraCost:{},
    traits:['Çok yüksek DEF','Kalkan'],
    trainTime:240,maxCount:99999,count:0,
    desc:"Ağır zırhlı savunma birimi. 3-4-5-6. turlarda savaşır."},

  suvari:{id:'suvari',side:'light',icon:'🐴',name:'Süvari',role:'Atlı Saldırı',tier:2,trainDays:2,
    baseAtk:8,baseDef:26,maas:40,
    atkGelArtis:1,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[3,4,5,6],
    cost:{altin:11500,metal:80,islenmis:120},
    extraCost:{at:1},
    traits:['At gerekli','Güçlü saldırı'],
    trainTime:300,maxCount:99999,count:0,
    desc:"Atlı saldırı birimi. 1 At gerektirir. 3-4-5-6. turlarda savaşır."},

  paladin:{id:'paladin',side:'light',icon:'✨',name:'Paladin',role:'Kutsal Savaşçı',tier:3,trainDays:3,
    baseAtk:9,baseDef:33,maas:52,
    atkGelArtis:1,defGelArtis:2,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[3,4,5,6],
    cost:{altin:16000,odun:150,metal:100,islenmis:150},
    extraCost:{at:1},
    traits:['At gerekli','Yüksek DEF','Kutsal zırh'],
    trainTime:480,maxCount:99999,count:0,
    desc:"Aydınlığın elit savaşçısı. 1 At gerektirir. 3-4-5-6. turlarda savaşır."},

  kolcu:{id:'kolcu',side:'light',icon:'🎯',name:'Kolcu',role:'Gizli Elit',tier:2,trainDays:2,
    baseAtk:10,baseDef:30,maas:76,
    atkGelArtis:1,defGelArtis:2,atkGelMax:10,defGelMax:10,
    saldiriCarpan:2, savasTurlari:[2,3,4,5,6],
    cost:{altin:32000,odun:120,metal:150,islenmis:200},
    extraCost:{gizlilik:1},
    traits:['x2 saldırı çarpanı','Gizlilik gerekli'],
    trainTime:300,maxCount:99999,count:0,
    desc:"Her saldırısı x2 ile çarpılır. 1 Gizlilik Puanı gerektirir. 2-3-4-5-6. turlarda."},

  buyucu:{id:'buyucu',side:'light',icon:'🔮',name:'Büyücü',role:'Büyü Saldırısı',tier:3,trainDays:3,
    baseAtk:11,baseDef:18,maas:120,
    atkGelArtis:1,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:2, savasTurlari:[1,2,3],
    cost:{altin:25000},
    extraCost:{mana:5},
    traits:['x2 saldırı çarpanı','5 Mana gerekli'],
    trainTime:600,maxCount:99999,count:0,
    desc:"Büyü saldırısı. Her saldırı x2. 5 Mana gerektirir. 1-2-3. turlarda."},

  isin_savasci:{id:'isin_savasci',side:'light',icon:'⚡',name:'Işığın Savaşçısı',role:'Efsanevi',tier:3,trainDays:3,
    baseAtk:40,baseDef:100,maas:250,
    atkGelArtis:2,defGelArtis:2,atkGelMax:10,defGelMax:10,
    saldiriCarpan:3, savasTurlari:[1,2,3,4,5],
    cost:{altin:50000,odun:1000,metal:300,islenmis:500},
    extraCost:{buyulu_yumurta:1},
    traits:['x3 saldırı çarpanı','Büyülü Yumurta gerekli','Efsanevi'],
    trainTime:1200,maxCount:99999,count:0,
    desc:"Aydınlığın en güçlüsü. x3 çarpan. 1 Büyülü Yumurta gerekli. 1-2-3-4-5. turlarda."},

  /* ─── AYDINLIK EJDERHALAR (üretilemez) ─── */
  mavi_ejderha:{id:'mavi_ejderha',side:'light',icon:'🐲',name:'Mavi Ejderha',role:'Ejderha',tier:4,
    baseAtk:750,baseDef:2500,maas:0,
    atkGelArtis:0,defGelArtis:0,atkGelMax:0,defGelMax:0,
    saldiriCarpan:1, savasTurlari:[1,2,3,4,5,6],
    cost:{},extraCost:{},
    traits:['Mağaradan çıkar','Maaş almaz','Üretilemez'],
    trainTime:0,maxCount:99999,count:0,producible:false,
    desc:"Mağaradan rastgele çıkar. Üretilemez. Her turda savaşır."},

  altin_ejderha:{id:'altin_ejderha',side:'light',icon:'🐉',name:'Altın Ejderha',role:'Ejderha',tier:4,
    baseAtk:1000,baseDef:5000,maas:0,
    atkGelArtis:0,defGelArtis:0,atkGelMax:0,defGelMax:0,
    saldiriCarpan:1, savasTurlari:[1,2,3,4,5,6],
    cost:{},extraCost:{},
    traits:['Mağaradan çıkar','Maaş almaz','Üretilemez','Efsanevi'],
    trainTime:0,maxCount:99999,count:0,producible:false,
    desc:"Mağaradan çok nadir çıkar. Üretilemez. Her turda savaşır."},

  /* ═══════════ KARANLIK ═══════════ */
  iskelet:{id:'iskelet',side:'dark',icon:'💀',name:'İskelet',role:'Hafif Piyade',tier:1,trainDays:1,
    baseAtk:1,baseDef:8,maas:15,
    atkGelArtis:0.5,defGelArtis:0.5,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[4,5,6],
    cost:{altin:3000,odun:75,islenmis:50},
    extraCost:{},
    traits:['Ölümsüz','Ucuz birim'],
    trainTime:60,maxCount:99999,count:0,
    desc:"Ölümsüz piyade. Ucuz, hızlı üretilir. 4-5-6. turlarda savaşır."},

  goblin:{id:'goblin',side:'dark',icon:'👺',name:'Goblin',role:'Hafif Saldırgan',tier:1,trainDays:1,
    baseAtk:3,baseDef:9,maas:20,
    atkGelArtis:0.5,defGelArtis:0.5,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[4,5,6],
    cost:{altin:3000,odun:75,islenmis:50},
    extraCost:{},
    traits:['Hızlı','Sinsi'],
    trainTime:90,maxCount:99999,count:0,
    desc:"Hızlı ve sinsi saldırgan. 4-5-6. turlarda savaşır."},

  iskelet_okcu:{id:'iskelet_okcu',side:'dark',icon:'🏹',name:'İskelet Okçu',role:'Menzilli',tier:1,trainDays:1,
    baseAtk:6,baseDef:11,maas:32,
    atkGelArtis:0.5,defGelArtis:0.5,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[1,2,3],
    cost:{altin:6500,odun:300,islenmis:50},
    extraCost:{},
    traits:['Menzilli','Ölümsüz','İlk 3 turda saldırır'],
    trainTime:120,maxCount:99999,count:0,
    desc:"Ölümsüz menzilli. 1-2-3. turlarda savaşır."},

  ogre:{id:'ogre',side:'dark',icon:'👹',name:'Ogre Savaşçı',role:'Ağır Piyade',tier:2,trainDays:2,
    baseAtk:5,baseDef:19,maas:28,
    atkGelArtis:0.5,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[2,3,4,5,6],
    cost:{altin:7000,odun:150,metal:50,islenmis:100},
    extraCost:{},
    traits:['Devasa güç','5 turda savaşır'],
    trainTime:180,maxCount:99999,count:0,
    desc:"Devasa saldırı gücü. 2-3-4-5-6. turlarda savaşır."},

  troll:{id:'troll',side:'dark',icon:'🧌',name:'Troll',role:'Zırhlı Tank',tier:2,trainDays:2,
    baseAtk:7,baseDef:21,maas:35,
    atkGelArtis:1,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[3,4,5,6],
    cost:{altin:10500,metal:120,islenmis:80},
    extraCost:{},
    traits:['Çok yüksek DEF','Taş derisi'],
    trainTime:360,maxCount:99999,count:0,
    desc:"Ağır zırhlı savunma. 3-4-5-6. turlarda savaşır."},

  ork:{id:'ork',side:'dark',icon:'🐺',name:'Ork',role:'Kurtlu Saldırı',tier:2,trainDays:2,
    baseAtk:8,baseDef:24,maas:40,
    atkGelArtis:1,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[3,4,5,6],
    cost:{altin:11500,metal:80,islenmis:120},
    extraCost:{kurt:1},
    traits:['Kurt gerekli','Güçlü saldırı'],
    trainTime:300,maxCount:99999,count:0,
    desc:"Kurtlu saldırı birimi. 1 Kurt gerektirir. 3-4-5-6. turlarda savaşır."},

  golem:{id:'golem',side:'dark',icon:'🪨',name:'Golem',role:'Elite Tank',tier:3,trainDays:3,
    baseAtk:9,baseDef:29,maas:80,
    atkGelArtis:1,defGelArtis:2,atkGelMax:10,defGelMax:10,
    saldiriCarpan:1, savasTurlari:[3,4,5,6],
    cost:{altin:33000,odun:250,metal:150,islenmis:150},
    extraCost:{kurt:1},
    traits:['Kurt gerekli','Yüksek ATK & DEF'],
    trainTime:900,maxCount:99999,count:0,
    desc:"Karanlığın elit tankı. 1 Kurt gerektirir. 3-4-5-6. turlarda savaşır."},

  kara_sovalye:{id:'kara_sovalye',side:'dark',icon:'🖤',name:'Kara Şovalye',role:'Gizli Elit',tier:2,trainDays:2,
    baseAtk:8,baseDef:36,maas:48,
    atkGelArtis:1,defGelArtis:2,atkGelMax:10,defGelMax:10,
    saldiriCarpan:2, savasTurlari:[2,3,4,5,6],
    cost:{altin:15250,odun:150,metal:100,islenmis:150},
    extraCost:{gizlilik:1},
    traits:['x2 saldırı çarpanı','Gizlilik gerekli'],
    trainTime:480,maxCount:99999,count:0,
    desc:"Her saldırısı x2. 1 Gizlilik Puanı gerektirir. 2-3-4-5-6. turlarda."},

  kara_elf:{id:'kara_elf',side:'dark',icon:'🧝',name:'Kara Elf',role:'Büyü Saldırısı',tier:3,trainDays:3,
    baseAtk:10,baseDef:19,maas:120,
    atkGelArtis:1,defGelArtis:1,atkGelMax:10,defGelMax:10,
    saldiriCarpan:2, savasTurlari:[1,2,3],
    cost:{altin:24500},
    extraCost:{mana:5},
    traits:['x2 saldırı çarpanı','5 Mana gerekli'],
    trainTime:720,maxCount:99999,count:0,
    desc:"Karanlık büyücü. Her saldırı x2. 5 Mana gerektirir. 1-2-3. turlarda."},

  golge_savasci:{id:'golge_savasci',side:'dark',icon:'🌑',name:'Gölge Savaşçı',role:'Efsanevi',tier:3,trainDays:3,
    baseAtk:40,baseDef:100,maas:250,
    atkGelArtis:2,defGelArtis:2,atkGelMax:10,defGelMax:10,
    saldiriCarpan:3, savasTurlari:[1,2,3,4,5],
    cost:{altin:50000,odun:1000,metal:300,islenmis:500},
    extraCost:{buyulu_yumurta:1},
    traits:['x3 saldırı çarpanı','Büyülü Yumurta gerekli','Efsanevi'],
    trainTime:1500,maxCount:99999,count:0,
    desc:"Karanlığın en güçlüsü. x3 çarpan. 1 Büyülü Yumurta gerekli. 1-2-3-4-5. turlarda."},

  /* ─── KARANLIK EJDERHALAR (üretilemez) ─── */
  kirmizi_ejderha:{id:'kirmizi_ejderha',side:'dark',icon:'🐲',name:'Kırmızı Ejderha',role:'Ejderha',tier:4,
    baseAtk:750,baseDef:2500,maas:0,
    atkGelArtis:0,defGelArtis:0,atkGelMax:0,defGelMax:0,
    saldiriCarpan:1, savasTurlari:[1,2,3,4,5,6],
    cost:{},extraCost:{},
    traits:['Mağaradan çıkar','Maaş almaz','Üretilemez'],
    trainTime:0,maxCount:99999,count:0,producible:false,
    desc:"Mağaradan rastgele çıkar. Üretilemez. Her turda savaşır."},

  siyah_ejderha:{id:'siyah_ejderha',side:'dark',icon:'🐉',name:'Siyah Ejderha',role:'Ejderha',tier:4,
    baseAtk:1000,baseDef:5000,maas:0,
    atkGelArtis:0,defGelArtis:0,atkGelMax:0,defGelMax:0,
    saldiriCarpan:1, savasTurlari:[1,2,3,4,5,6],
    cost:{},extraCost:{},
    traits:['Mağaradan çıkar','Maaş almaz','Üretilemez','Efsanevi'],
    trainTime:0,maxCount:99999,count:0,producible:false,
    desc:"Mağaradan çok nadir çıkar. Üretilemez. Her turda savaşır."},
};

let EXTRA_RES = { at: 0, kurt: 0, mana: 0, gizlilik: 0, buyulu_yumurta: 0, cig_et: 0 };

const GEL_MALIYET = 1000; // her kademe 1000 altin

const ACTIVITY_ICONS = {
  isci_uretim: '⚒️',
  bina_tamam:  '🏗️',
  egitim_tamam:'⚔️',
  pisirme:     '🔥',
  nufus:       '👥',
  yemek:       '🍽️',
  bina_uretim: '🔥',
  maas:        '💰',
};

const SAF_LIMITS = [3, 3, 5, 3]; // 14 total slots
