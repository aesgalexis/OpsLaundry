(function (root) {
  'use strict';
  const lights = ['dawn', 'day', 'sunset', 'night'];
  const weather = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
  // Approximate device-clock lighting. Solar times will replace these fixed bands.
  function lightAt(hour) {
    if (!Number.isFinite(hour) || hour < 0 || hour >= 24) return 'day';
    if (hour >= 6 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'sunset';
    return 'night';
  }
  function normalize(light, condition) {
    return { light: lights.includes(light) ? light : 'day', weather: weather.includes(condition) ? condition : 'clear' };
  }
  const api = { lights, weather, lightAt, normalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HeroAtmosphere = api;
})(globalThis);
