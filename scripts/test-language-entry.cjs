const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../site/shared/ui/language-entry.js'), 'utf8');
function destination(navigator, pathname = '/') {
  let target;
  vm.runInNewContext(source, { navigator, location: {
    pathname, search: '?campaign=mail', hash: '#contact', replace(value) { target = value; }
  } });
  return target;
}
test('entry selects the first supported browser language and preserves URL context', () => {
  for (const [languages, expected] of [[['it-IT', 'en'], 'it'], [['el-GR'], 'el'], [['en-US'], 'en'], [['es-ES'], 'es'], [['fr-FR', 'en-GB'], 'en'], [['de-DE'], 'es'], [[' IT_it '], 'it']]) {
    assert.equal(destination({ languages }), `/${expected}/?campaign=mail#contact`);
  }
  assert.equal(destination({ language: 'el-GR' }), '/el/?campaign=mail#contact');
  assert.equal(destination({}), '/es/?campaign=mail#contact');
  assert.equal(destination({ get languages() { throw new Error('Unavailable'); } }), '/es/?campaign=mail#contact');
});
test('direct localized routes cannot be overridden by browser preferences', () => {
  for (const path of ['/es/', '/en/', '/it/ricambi/', '/el/aporrito/']) assert.equal(destination({ languages: ['it'] }, path), undefined);
  assert.equal(destination({ languages: ['en'] }, '/index.html'), '/en/?campaign=mail#contact');
});
