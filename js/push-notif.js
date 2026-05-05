/* ═══════════════════════════════════════════════════════
   PUSH NOTIF — Web Push Notification Subscribe Flow
   v1.14.1.50 (PWA Asama 1)
   ═══════════════════════════════════════════════════════
   Public API:
     pushNotif.istegi()        → permission iste (kullanici buton tikinca cagir)
     pushNotif.durum()         → mevcut izin durumu ('granted' | 'denied' | 'default' | 'unsupported')
     pushNotif.kapat()         → unsubscribe + DB sil
     pushNotif.test()          → test bildirim gonder (debugging)
     pushNotif.setupBanner()   → "Bildirimleri Ac" banner'ini gerekirse goster
═══════════════════════════════════════════════════════ */

(function(){
  'use strict';

  const NS_KEY_DISMISSED = 'noxara_push_banner_dismissed';
  const API = (typeof API_BASE !== 'undefined') ? API_BASE : '';

  // urlBase64 → Uint8Array (VAPID key formatla)
  function urlBase64ToUint8Array(base64) {
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
    return out;
  }

  function tokenAl() {
    if (typeof getToken === 'function') return getToken();
    try { return localStorage.getItem('palantis_token'); } catch { return null; }
  }

  /* ── Mevcut izin durumu ── */
  function durum() {
    if (!('Notification' in window)) return 'unsupported';
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('PushManager' in window)) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }

  /* ── Public key backend'den al ── */
  async function _vapidKeyAl() {
    const r = await fetch(API + '/api/push/vapid-key');
    if (!r.ok) throw new Error('VAPID key alinamadi');
    const d = await r.json();
    return d.publicKey;
  }

  /* ── Subscribe + backend'e kaydet ── */
  async function istegi() {
    if (durum() === 'unsupported') {
      noxAlert('Bu tarayici push bildirimleri desteklemiyor.');
      return false;
    }
    if (durum() === 'denied') {
      noxAlert('Bildirim izni reddedildi. Tarayici ayarlarindan acmaniz gerekiyor.');
      return false;
    }

    try {
      // 1. Permission iste (kullanici prompt'u gorur)
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return false;
      }

      // 2. Service Worker hazir mi
      const reg = await navigator.serviceWorker.ready;

      // 3. Mevcut subscription var mi
      let sub = await reg.pushManager.getSubscription();

      // 4. Yoksa yeni olustur
      if (!sub) {
        const publicKey = await _vapidKeyAl();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // 5. Backend'e kaydet
      const token = tokenAl();
      if (!token) {
        console.warn('[push] Login yok, subscription kaydedilmedi (yine de browser kayitli)');
        return false;
      }
      const subJson = sub.toJSON();
      const r = await fetch(API + '/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys
        })
      });
      if (!r.ok) {
        const err = await r.json().catch(()=>({error:'?'}));
        console.warn('[push] subscribe fail:', err);
        return false;
      }
      console.log('[push] Subscription kaydedildi');
      try { localStorage.setItem('noxara_push_active', '1'); } catch {}
      return true;
    } catch (e) {
      console.warn('[push] istegi hata:', e.message);
      return false;
    }
  }

  /* ── Unsubscribe ── */
  async function kapat() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const token = tokenAl();
        if (token) {
          await fetch(API + '/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ endpoint })
          }).catch(()=>{});
        }
      }
      try { localStorage.removeItem('noxara_push_active'); } catch {}
      return true;
    } catch (e) {
      console.warn('[push] kapat hata:', e.message);
      return false;
    }
  }

  /* ── Test bildirim ── */
  async function test() {
    const token = tokenAl();
    if (!token) { noxAlert('Once giris yap'); return; }
    const r = await fetch(API + '/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ mesaj: 'Test bildirimi calisti!' })
    });
    return r.json();
  }

  /* ── Setup Banner — sadece login olmus + permission='default' iken goster ── */
  async function setupBanner() {
    if (durum() !== 'default') return;       // izin verilmis veya reddedilmis
    if (!tokenAl()) return;                   // login degil
    try {
      if (localStorage.getItem(NS_KEY_DISMISSED) === '1') return;
    } catch {}

    // Banner olustur (zaten varsa cikarma)
    if (document.getElementById('push-banner')) return;
    const div = document.createElement('div');
    div.id = 'push-banner';
    div.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;max-width:420px;margin:0 auto;'
      + 'background:linear-gradient(135deg,#1a1a2e,#0a0a1a);border:1px solid #d4af37;border-radius:8px;'
      + 'padding:12px 16px;z-index:99999;display:flex;gap:10px;align-items:center;'
      + 'box-shadow:0 4px 16px rgba(0,0,0,0.6);font-family:system-ui,sans-serif';
    div.innerHTML =
      '<div style="font-size:24px">🔔</div>'
      + '<div style="flex:1;font-size:11px;color:#e0e0e0">'
      +   '<b style="color:#d4af37">Bildirimleri Ac</b><br>'
      +   '<span style="color:#aaa">Saldiri / kervan / savas raporu icin push al</span>'
      + '</div>'
      + '<button id="push-banner-ok"  style="padding:6px 12px;background:#d4af37;color:#000;border:none;border-radius:4px;font-weight:bold;cursor:pointer;font-size:11px">AC</button>'
      + '<button id="push-banner-no"  style="padding:6px 8px;background:transparent;color:#888;border:1px solid #333;border-radius:4px;cursor:pointer;font-size:11px">Sonra</button>';
    document.body.appendChild(div);

    document.getElementById('push-banner-ok').onclick = async () => {
      div.remove();
      const ok = await istegi();
      if (ok) {
        noxAlert('🔔 Bildirimleri actin! Saldiri/kervan haberleri telefonunuza gelecek.');
      }
    };
    document.getElementById('push-banner-no').onclick = () => {
      try { localStorage.setItem(NS_KEY_DISMISSED, '1'); } catch {}
      div.remove();
    };
  }

  // ── Public API ──
  window.pushNotif = { istegi, durum, kapat, test, setupBanner };

  // Auto-setup: sayfa yuklendikten 5 saniye sonra banner goster
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(setupBanner, 5000);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(setupBanner, 5000));
  }
})();
