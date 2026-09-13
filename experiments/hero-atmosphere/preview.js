'use strict';
const hero = document.querySelector('.hero');
const light = document.querySelector('#light');
const weather = document.querySelector('#weather');
const locale = document.querySelector('#locale');
const variants = [];
for (const lighting of HeroAtmosphere.lights) {
  for (const condition of HeroAtmosphere.weather) {
    const button = document.createElement('button');
    const number = variants.length + 1;
    const label = `${number}/20 · ${light.querySelector(`[value="${lighting}"]`).textContent} · ${weather.querySelector(`[value="${condition}"]`).textContent}`;
    button.type = 'button';
    button.className = 'lab-dot';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => {
      light.value = lighting;
      weather.value = condition;
      render();
    });
    document.querySelector('#variants').append(button);
    variants.push({ button, lighting, condition, label });
  }
}
function render() {
  const original = light.value === 'original';
  weather.disabled = original;
  if (original) {
    delete hero.dataset.light;
    delete hero.dataset.weather;
  } else {
    const state = HeroAtmosphere.normalize(light.value === 'auto' ? HeroAtmosphere.lightAt(new Date().getHours()) : light.value, weather.value);
    hero.dataset.light = state.light;
    hero.dataset.weather = state.weather;
  }
  hero.lang = locale.value;
  hero.querySelector('.hero-content').innerHTML = HERO_COPY[locale.value];
  let selected;
  for (const variant of variants) {
    const active = !original && variant.lighting === hero.dataset.light && variant.condition === hero.dataset.weather;
    variant.button.setAttribute('aria-pressed', String(active));
    if (active) selected = variant;
  }
  document.querySelector('#state').textContent = original ? 'Referencia: hero actual del sitio.' : selected.label;
}
document.querySelector('form').addEventListener('change', render);
document.querySelector('form').addEventListener('submit', event => event.preventDefault());
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
setInterval(() => { if (!document.hidden && light.value === 'auto') render(); }, 60000);
render();
