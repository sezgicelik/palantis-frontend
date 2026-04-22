/* ═══════════════════════════════════════════════════════════════════════
   cache-fetch.js  (v1.13.36)
   Global fetch cache + request dedup + performance logger
   Ayni URL'i 15 sn icinde 2. kez cagirirsan DB'ye gitmez, cache'ten doner.
   Ayni anda ayni URL'e 2 istek ayni anda giderse, ikisi de tek response alir.

   KULLANIM:
     const data = await cachedFetch('/api/game/workers');
     const data = await cachedFetch('/api/game/workers', {force:true}); // cache bypass
     NOXARA_CACHE.invalidate();                  // hepsini sil
     NOXARA_CACHE.invalidate('/api/army');        // bu pattern'e uyan hepsi
     NOXARA_CACHE.stats();                        // console'a rapor bas
═══════════════════════════════════════════════════════════════════════ */

(function() {
  const TTL_DEFAULT_MS = 15000;  // 15 saniye
  const TTL_OVERRIDE = {
    '/api/takvim':                   60000,  // 1 dk
    '/api/game/bina-maliyetler':     60000,  // 1 dk (config degismez)
    '/api/game/ateskes':             30000,  // 30 sn
    '/api/game/tatil':               30000,
    '/api/game/gelen-ordular':       5000,   // 5 sn (saldiri-duyarli)
    '/api/game/kuyruk-ozet':         10000,  // 10 sn (kuyruk ilerliyor)
  };

  const cache = new Map();        // url -> {ts, data, etag}
  const inflight = new Map();     // url -> Promise (dedup)

  const stats = {
    hit: 0,
    miss: 0,
    dedup: 0,
    network_ms_total: 0,
    pages: {},   // {pagePath: {hit, miss, total_ms, start_ts}}
  };

  function ttlFor(url) {
    for (const prefix in TTL_OVERRIDE) {
      if (url.indexOf(prefix) !== -1) return TTL_OVERRIDE[prefix];
    }
    return TTL_DEFAULT_MS;
  }

  function normalizeUrl(u) {
    return (u.indexOf('http') === 0) ? u : u;
  }

  async function cachedFetch(url, opts) {
    opts = opts || {};
    const key = normalizeUrl(url);
    const now = Date.now();
    const force = !!opts.force;

    // 1) Cache hit
    const hit = cache.get(key);
    if (!force && hit && (now - hit.ts) < ttlFor(key)) {
      stats.hit++;
      return hit.data;
    }

    // 2) In-flight dedup — ayni URL zaten cagrildi, ayni Promise'i ver
    if (!force && inflight.has(key)) {
      stats.dedup++;
      return inflight.get(key);
    }

    // 3) Network fetch — v1.14.0.84: retry on 500/503/timeout (Railway cold start)
    stats.miss++;
    const t0 = performance.now();
    const fetchOpts = Object.assign({}, opts);
    delete fetchOpts.force;

    async function attempt(tryNo) {
      try {
        const r = await fetch(key, fetchOpts);
        if (!r.ok) {
          // 500/502/503/504 gecici hata -> retry. 401 auth -> donderik (retry yok)
          if ((r.status >= 500) && tryNo < 2) {
            await new Promise(res => setTimeout(res, 400 + tryNo * 800));
            return attempt(tryNo + 1);
          }
          // v1.14.0.84: Son denemede de fail ise stale cache varsa onu don
          if (hit) { stats.stale_fallback = (stats.stale_fallback || 0) + 1; return hit.data; }
          return null;
        }
        const data = await r.json();
        const t1 = performance.now();
        stats.network_ms_total += (t1 - t0);
        cache.set(key, { ts: Date.now(), data });
        return data;
      } catch(e) {
        // Network hata -> retry
        if (tryNo < 2) {
          await new Promise(res => setTimeout(res, 400 + tryNo * 800));
          return attempt(tryNo + 1);
        }
        // Stale fallback
        if (hit) { stats.stale_fallback = (stats.stale_fallback || 0) + 1; return hit.data; }
        return null;
      }
    }

    const p = attempt(0).finally(() => { inflight.delete(key); });

    inflight.set(key, p);
    return p;
  }

  function invalidate(pattern) {
    if (!pattern) {
      cache.clear();
      return;
    }
    for (const k of Array.from(cache.keys())) {
      if (k.indexOf(pattern) !== -1) cache.delete(k);
    }
  }

  function reportStats() {
    const toplam = stats.hit + stats.miss + stats.dedup;
    const hitRate = toplam > 0 ? (stats.hit / toplam * 100).toFixed(1) : 0;
    console.log(
      `%c[NOXARA_CACHE] Hit: ${stats.hit} | Miss: ${stats.miss} | Dedup: ${stats.dedup} | Hit rate: ${hitRate}% | Network toplam: ${stats.network_ms_total.toFixed(0)}ms`,
      'color:#c8a96e;font-weight:bold'
    );
    return stats;
  }

  // Sayfa degisirse cache gorunsun diye localStorage'a yaz
  window.addEventListener('beforeunload', () => {
    try {
      const snapshot = {};
      for (const [k, v] of cache.entries()) {
        // Sadece 15 sn'lik verileri sakla
        if (Date.now() - v.ts < 15000) snapshot[k] = v;
      }
      sessionStorage.setItem('noxara_cache_snapshot', JSON.stringify(snapshot));
    } catch(e) {}
  });

  // Sayfa aciliyorsa snapshot'tan yukle
  try {
    const snap = sessionStorage.getItem('noxara_cache_snapshot');
    if (snap) {
      const parsed = JSON.parse(snap);
      for (const k in parsed) {
        const v = parsed[k];
        if (Date.now() - v.ts < ttlFor(k)) {
          cache.set(k, v);
        }
      }
      sessionStorage.removeItem('noxara_cache_snapshot');
    }
  } catch(e) {}

  // ────── PERFORMANS LOGGER ──────
  const pagePath = (location.pathname.split('/').pop() || 'index.html');
  const pageStartTs = performance.now();
  stats.pages[pagePath] = { start_ts: pageStartTs, hit: 0, miss: 0 };

  window.addEventListener('load', () => {
    setTimeout(() => {
      const elapsed = performance.now() - pageStartTs;
      console.log(
        `%c[NOXARA_PERF] ${pagePath} yuklendi: ${elapsed.toFixed(0)}ms — Cache hit: ${stats.hit}, Network: ${stats.miss}, Dedup: ${stats.dedup}`,
        'color:#2ecc71;font-weight:bold'
      );
    }, 2500); // Tum initial fetch'ler bitsin diye 2.5 sn bekle
  });

  // Global export
  window.NOXARA_CACHE = {
    fetch: cachedFetch,
    invalidate,
    stats: reportStats,
    _cache: cache,
    _stats: stats,
  };
  window.cachedFetch = cachedFetch;
})();
