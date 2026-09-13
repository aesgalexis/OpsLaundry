const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lightAt, normalize, lights, weather } = require('./atmosphere.js');
test('clock boundaries and midnight remain deterministic', () => {
  for (const [hour, expected] of [[0,'night'],[5.99,'night'],[6,'dawn'],[8,'day'],[18,'sunset'],[21,'night'],[23.99,'night'],[NaN,'day'],[24,'day']]) assert.equal(lightAt(hour), expected);
});
test('all lighting and weather combinations remain independent', () => {
  for (const light of lights) for (const condition of weather) assert.deepEqual(normalize(light, condition), { light, weather: condition });
  assert.deepEqual(normalize('invalid', null), { light: 'day', weather: 'clear' });
});
