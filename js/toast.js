/* toast.js — Palantis toast notification (v1.13.55: showToast wrapper eklendi) */

let toastT;

// Temel toast — sadece mesaj gosterir (geriye uyumluluk)
function toast(msg){
  const t = document.getElementById('toast');
  if (!t) { console.warn('[toast] #toast element yok:', msg); return; }
  t.innerText = msg;
  t.style.opacity = '1';
  t.style.background = '';  // reset renk
  clearTimeout(toastT);
  toastT = setTimeout(() => t.style.opacity = '0', 3200);
}

// v1.13.55: showToast — tipe gore renk + hata toleransi
// Tum sayfalar (page-savas-baslat, bocek-yarisi, buyu-dukkani, map vs.) bunu cagiriyordu
// ama tanimli degildi -> ReferenceError -> button "Gonderiliyor..." takili kalma bug
function showToast(msg, type){
  const t = document.getElementById('toast');
  if (!t) { console.warn('[showToast] #toast element yok:', msg); return; }
  t.innerText = msg;
  t.style.opacity = '1';
  // Tip bazli renk
  const renkler = {
    success: '#27ae60',
    error:   '#c0392b',
    warning: '#e67e22',
    info:    '#2980b9'
  };
  t.style.background = renkler[type] || renkler.info;
  t.style.color = '#fff';
  clearTimeout(toastT);
  toastT = setTimeout(() => t.style.opacity = '0', 3200);
}

// Global erisim (modul sistemleri icin)
if (typeof window !== 'undefined') {
  window.toast = toast;
  window.showToast = showToast;
}
