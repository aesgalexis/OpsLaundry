(() => {
  'use strict';
  const hero = document.querySelector('.home-page .hero');
  if (!hero || !globalThis.HeroAtmosphere) return;
  const signatureLabels = {
    es: ['Cerca de', 'El cielo sigue la hora de tu dispositivo y el tiempo aproximado de tu zona.'],
    en: ['Near', 'The sky follows your device time and the approximate weather in your area.'],
    it: ['Vicino a', "Il cielo segue l’ora del dispositivo e il meteo approssimativo della tua zona."],
    el: ['Κοντά σε', 'Ο ουρανός ακολουθεί την ώρα της συσκευής σου και τον καιρό κατά προσέγγιση στην περιοχή σου.']
  }[document.documentElement.lang] || ['Near', 'Approximate local weather and device time.'];
  const signature = document.createElement('small');
  signature.className = 'hero-weather-signature';
  signature.hidden = true;
  signature.title = signatureLabels[1];
  hero.append(signature);
  for (const layer of ['light', 'celestial', 'weather', 'veil']) {
    const element = document.createElement('div');
    element.className = `atmosphere-${layer}`;
    element.setAttribute('aria-hidden', 'true');
    if (layer === 'weather') {
      const rain = document.createElement('div');
      rain.className = 'atmosphere-rain';
      // Fixed, irregular spacing avoids a repeating curtain and layout randomness.
      for (let index = 0; index < 32; index += 1) {
        const drop = document.createElement('span');
        drop.style.setProperty('--drop-x', `${(index * 37) % 101}%`);
        drop.style.setProperty('--drop-delay', `${-((index * 17) % 31) / 10}s`);
        drop.style.setProperty('--drop-duration', `${1.1 + (index % 7) * .17}s`);
        drop.style.setProperty('--drop-length', `${12 + (index % 5) * 5}px`);
        rain.append(drop);
      }
      element.append(rain);
    }
    hero.append(element);
  }
  let currentWeather = null;
  let weatherClient = null;
  let stopped = false;
  let started = false;
  try {
    let storage;
    try { storage = window.localStorage; } catch { /* Browser storage is optional. */ }
    weatherClient = globalThis.HeroWeather?.createClient({ storage });
  } catch { /* Keep the local-clock hero if fetch is unavailable. */ }
  function select(light, weather) {
    hero.dataset.light = light;
    hero.dataset.weather = weather;
    const details = currentWeather && weatherClient?.getDetails?.();
    signature.hidden = !details;
    signature.textContent = details ? `${signatureLabels[0]} ${details.city} · ${details.temperature} °C` : '';
  }
  function updateClock() {
    hero.dataset.paused = String(document.hidden);
    if (!document.hidden) select(HeroAtmosphere.lightAt(new Date().getHours()), currentWeather || 'clear');
  }
  async function updateWeather() {
    if (!started || stopped || document.hidden || !weatherClient) return;
    const condition = await weatherClient.get();
    if (stopped) return;
    currentWeather = condition;
    updateClock();
  }
  function tick() {
    updateClock();
    void updateWeather();
  }
  let timer;
  let startTimer;
  function resume() {
    stopped = false;
    clearInterval(timer);
    clearTimeout(startTimer);
    tick();
    // Give the initial HTML and CSS a chance to paint before contacting the provider.
    startTimer = setTimeout(() => { started = true; void updateWeather(); }, 1200);
    timer = setInterval(tick, 60000);
  }
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('pagehide', () => {
    stopped = true;
    clearInterval(timer);
    clearTimeout(startTimer);
    weatherClient?.cancel();
  });
  window.addEventListener('pageshow', resume);
  resume();
})();
