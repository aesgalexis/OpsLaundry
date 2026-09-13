(function (root) {
  'use strict';
  const ENDPOINT = 'https://wttr.in/?format=j2';
  const CACHE_KEY = 'opslaundry.hero-weather.v2';
  const TTL = 45 * 60 * 1000;
  const RETRY = 15 * 60 * 1000;
  // WWO codes used by wttr.in. Snow uses clouds: this hero has no snow effect.
  const groups = {
    clear: [113],
    cloudy: [116, 119, 122, 179, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371],
    fog: [143, 248, 260],
    rain: [176, 182, 185, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 320, 350, 353, 356, 359, 362, 365, 374, 377],
    storm: [200, 386, 389, 392, 395]
  };
  function conditionFor(code) {
    if (typeof code !== 'number' && !(typeof code === 'string' && /^\d{3}$/.test(code))) return null;
    return Object.keys(groups).find(name => groups[name].includes(Number(code))) || null;
  }
  function parseResponse(data) {
    const area = data?.nearest_area?.[0];
    const numeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));
    if (!area || !numeric(area.latitude) || !numeric(area.longitude) ||
        Math.abs(Number(area.latitude)) > 90 || Math.abs(Number(area.longitude)) > 180) return null;
    return conditionFor(data?.current_condition?.[0]?.weatherCode);
  }
  function signatureDetails(city, temperature) {
    const place = typeof city === 'string' ? city.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, 80) : '';
    const validTemperature = (typeof temperature === 'number' || (typeof temperature === 'string' && temperature.trim() !== '')) &&
      Number.isFinite(Number(temperature)) && Number(temperature) >= -90 && Number(temperature) <= 60;
    return place && validTemperature ? { city: place, temperature: Math.round(Number(temperature)) } : null;
  }
  function createClient({ fetcher = root.fetch.bind(root), storage, now = Date.now } = {}) {
    let cache = null;
    let retryAt = 0;
    let pending = null;
    let controller = null;
    const fresh = record => record && Object.hasOwn(groups, record.condition) &&
      Number.isFinite(record.expiresAt) && record.expiresAt > now() && record.expiresAt <= now() + TTL;
    try {
      storage?.removeItem('opslaundry.hero-weather.v1');
      const saved = JSON.parse(storage?.getItem(CACHE_KEY) || 'null');
      if (fresh(saved)) cache = { condition: saved.condition, expiresAt: saved.expiresAt, details: signatureDetails(saved.details?.city, saved.details?.temperature) };
      else storage?.removeItem(CACHE_KEY);
    } catch { /* Storage may be disabled; memory caching still works. */ }
    async function request() {
      const active = new AbortController();
      controller = active;
      const timeout = setTimeout(() => active.abort(), 6500);
      try {
        const response = await fetcher(ENDPOINT, {
          signal: active.signal, mode: 'cors', credentials: 'omit',
          referrerPolicy: 'no-referrer', cache: 'no-store'
        });
        if (!response.ok) throw new Error('Weather unavailable');
        const data = await response.json();
        const condition = parseResponse(data);
        if (!condition || active.signal.aborted) throw new Error('Invalid weather');
        const details = signatureDetails(data?.nearest_area?.[0]?.areaName?.[0]?.value, data?.current_condition?.[0]?.temp_C);
        cache = { condition, expiresAt: now() + TTL, details };
        try { storage?.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* Optional cache. */ }
        return condition;
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
        if (controller === active) controller = null;
      }
    }
    function get() {
      if (fresh(cache)) return Promise.resolve(cache.condition);
      cache = null;
      if (pending) return pending;
      if (now() < retryAt) return Promise.resolve(null);
      retryAt = now() + RETRY;
      pending = request().finally(() => { pending = null; });
      return pending;
    }
    function cancel() {
      controller?.abort();
      retryAt = 0;
    }
    return { get, cancel, getDetails: () => fresh(cache) ? cache.details : null };
  }
  const api = { createClient, conditionFor, parseResponse, signatureDetails, TTL, CACHE_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HeroWeather = api;
})(globalThis);
