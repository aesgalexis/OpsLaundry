const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createClient, conditionFor, parseResponse, signatureDetails, TTL, CACHE_KEY } = require('../site/features/hero-atmosphere/weather.js');
const { lightAt } = require('../site/features/hero-atmosphere/atmosphere.js');
const fixture = code => ({ current_condition: [{ weatherCode: code, temp_C: '23' }], nearest_area: [{ latitude: '39.7', longitude: '3.0', areaName: [{value: 'Muro'}] }] });
const response = code => ({ ok: true, json: async () => fixture(code) });
function memoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
}

test('WWO conditions map to the intended effects without inventing unknown weather', () => {
  for (const [code, expected] of [[113, 'clear'], [116, 'cloudy'], [143, 'fog'], [296, 'rain'], [389, 'storm'], [338, 'cloudy']]) {
    assert.equal(conditionFor(code), expected);
    assert.equal(parseResponse(fixture(String(code))), expected);
  }
  for (const invalid of [null, '', {}, 999, '113bad']) assert.equal(conditionFor(invalid), null);
  assert.equal(parseResponse({ current_condition: [{ weatherCode: 113 }] }), null);
  assert.equal(parseResponse({ ...fixture(113), nearest_area: [{ latitude: '', longitude: 3 }] }), null);
  assert.equal(parseResponse({ ...fixture(113), nearest_area: [{ latitude: 91, longitude: 3 }] }), null);
});

test('device-clock lighting handles day boundaries independently of weather', () => {
  for (const [hour, expected] of [[0, 'night'], [5, 'night'], [6, 'dawn'], [8, 'day'], [18, 'sunset'], [21, 'night'], [23, 'night'], [NaN, 'day']]) assert.equal(lightAt(hour), expected);
});

test('signature accepts zero and negative temperatures but hides missing or invalid data', () => {
  assert.deepEqual(signatureDetails('Muro', '0'), { city: 'Muro', temperature: 0 });
  assert.deepEqual(signatureDetails('Muro', '-4.2'), { city: 'Muro', temperature: -4 });
  for (const invalid of [null, undefined, '', ' ', 'unknown', 100, false]) assert.equal(signatureDetails('Muro', invalid), null);
  assert.equal(signatureDetails('', 23), null);
  assert.equal(signatureDetails(null, 23), null);
});

test('one IP-based request is shared, cached for 45 minutes with only the signature details', async () => {
  let now = 1000;
  let calls = 0;
  const storage = memoryStorage();
  const client = createClient({ storage, now: () => now, fetcher: async (url, options) => {
    calls += 1;
    assert.equal(url, 'https://wttr.in/?format=j2');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    return response(296);
  } });
  assert.deepEqual(await Promise.all([client.get(), client.get()]), ['rain', 'rain']);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(storage.getItem(CACHE_KEY)), { condition: 'rain', expiresAt: now + TTL, details: {city: 'Muro', temperature: 23} });
  now += TTL - 1;
  assert.equal(await client.get(), 'rain');
  assert.equal(calls, 1);
  now += 1;
  assert.equal(await client.get(), 'rain');
  assert.equal(calls, 2);
  const restored = createClient({ storage, now: () => now, fetcher: () => { throw new Error('Should use cache'); } });
  assert.equal(await restored.get(), 'rain');
});

test('blocked storage, invalid JSON and service outages safely fall back with cooldown', async () => {
  let now = 1000;
  let calls = 0;
  const storage = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Denied'); } };
  const client = createClient({ storage, now: () => now, fetcher: async () => {
    calls += 1;
    if (calls === 1) return { ok: true, json: async () => { throw new Error('Not JSON'); } };
    return response(113);
  } });
  assert.equal(await client.get(), null);
  assert.equal(await client.get(), null);
  assert.equal(calls, 1);
  now += 15 * 60 * 1000;
  assert.equal(await client.get(), 'clear');
  assert.equal(await client.get(), 'clear');
  assert.equal(calls, 2);
  assert.equal(await createClient({ fetcher: async () => ({ ok: false }) }).get(), null);
  assert.equal(await createClient({ fetcher: async () => response(999) }).get(), null);
});

test('expired, malformed and future cache entries trigger a fresh request', async () => {
  for (const saved of ['{bad', 'null', JSON.stringify({ condition: 'storm', expiresAt: 1 }), JSON.stringify({ condition: 'storm', expiresAt: 999999999 }), JSON.stringify({ condition: 'invalid', expiresAt: 2000 })]) {
    const client = createClient({ storage: memoryStorage({ [CACHE_KEY]: saved }), now: () => 1000, fetcher: async () => response(248) });
    assert.equal(await client.get(), 'fog');
  }
});

test('page teardown aborts the pending request and permits a later retry', async () => {
  let calls = 0;
  const client = createClient({ fetcher: async (url, { signal }) => {
    calls += 1;
    if (calls > 1) return response(119);
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }));
  } });
  const pending = client.get();
  client.cancel();
  assert.equal(await pending, null);
  assert.equal(await client.get(), 'cloudy');
});

test('hero runs automatically without test controls in all locales', async () => {
  for (const lang of ['es', 'en', 'it', 'el']) {
    const element = () => ({ children: [], dataset: {}, attrs: {}, events: {}, style: { setProperty() {} },
      append(...items) { this.children.push(...items); }, after(...items) { this.siblings = items; },
      setAttribute(key, value) { this.attrs[key] = value; }, addEventListener(key, value) { this.events[key] = value; }
    });
    const hero = element();
    const document = { hidden: false, documentElement: { lang }, events: {}, querySelector: () => hero,
      createElement: element, addEventListener(key, value) { this.events[key] = value; } };
    let resolveWeather;
    let requested = 0;
    let tick;
    let start;
    const context = vm.createContext({ document, window: { addEventListener() {} }, Date,
      setTimeout(fn) { start = fn; }, clearTimeout() {}, setInterval(fn) { tick = fn; }, clearInterval() {},
      HeroAtmosphere: require('../site/features/hero-atmosphere/atmosphere.js'),
      HeroWeather: { createClient: () => ({ get() { requested += 1; return new Promise(resolve => { resolveWeather = resolve; }); }, getDetails: () => ({city: 'Muro', temperature: 23}), cancel() {} }) }
    });
    vm.runInContext(fs.readFileSync(require.resolve('../site/features/hero-atmosphere/hero.js'), 'utf8'), context);
    assert.equal(requested, 0, 'initial render must not wait for weather');
    assert.equal(hero.siblings, undefined, 'no test controls below the hero');
    const signature = hero.children.find(item => item.className === 'hero-weather-signature');
    assert.equal(signature.hidden, true);
    start();
    assert.equal(requested, 1);
    resolveWeather('rain');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(hero.dataset.weather, 'rain');
    tick();
    resolveWeather('storm');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(hero.dataset.weather, 'storm');
    assert.equal(signature.hidden, false);
    assert.match(signature.textContent, /Muro · 23 °C/);
    document.hidden = true;
    document.events.visibilitychange();
    assert.equal(hero.dataset.paused, 'true');
    assert.equal(requested, 2, 'hidden tabs must not poll');
  }
});
