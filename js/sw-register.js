/* ═══════════════════════════════════════════════════════
   NOXARA — Service Worker global register (v1.14.0.67)
   Tum sayfalara dahil edilir, duplicate register guard var
═══════════════════════════════════════════════════════ */
(function() {
  if (window._noxSwRegistered) return;
  window._noxSwRegistered = true;
  if (!('serviceWorker' in navigator)) return;
  // Sayfa yuklendiginde sessizce kaydet
  const reg = () => {
    navigator.serviceWorker.register('./sw.js')
      .then(r => {
        // Update bulundu — yeni sw bekliyor olabilir
        r.addEventListener('updatefound', () => {
          const worker = r.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              // Yeni SW hazir — kullanici yenileyince aktif olacak
              console.log('[SW] Yeni surum hazir — sayfa yenilendiginde yuklenir');
            }
          });
        });
      })
      .catch(e => console.log('[SW] register failed:', e.message));
  };
  if (document.readyState === 'complete') reg();
  else window.addEventListener('load', reg);

  // v1.14.1.50: Push Notifications scriptini de dinamik yukle (SW register edilince)
  const pushScript = document.createElement('script');
  pushScript.src = './js/push-notif.js?v=14150';
  pushScript.async = true;
  document.head.appendChild(pushScript);

  // v1.14.1.51: Install Prompt UI dinamik yukle
  const installScript = document.createElement('script');
  installScript.src = './js/install-prompt.js?v=14151';
  installScript.async = true;
  document.head.appendChild(installScript);

  // v1.14.1.53: Badge poller (ozel mesaj okunmamis sayisi)
  const badgeScript = document.createElement('script');
  badgeScript.src = './js/badge-poller.js?v=14153';
  badgeScript.async = true;
  document.head.appendChild(badgeScript);
})();
