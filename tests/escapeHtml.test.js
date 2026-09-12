const { describe, test } = require('node:test');
const assert = require('node:assert');
require('./setup');
const { escapeHtml, formatDate } = require('../script');

describe('escapeHtml', () => {
  test('& en entite', () => {
    assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
  });

  test('< en entite', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
  });

  test('> en entite', () => {
    assert.strictEqual(escapeHtml('a > b'), 'a &gt; b');
  });

  test('guillemets en entite', () => {
    assert.strictEqual(escapeHtml('"hello"'), '&quot;hello&quot;');
  });

  test('apostrophe en entite', () => {
    assert.strictEqual(escapeHtml("l'avion"), 'l&#x27;avion');
  });

  test('null → chaine vide', () => {
    assert.strictEqual(escapeHtml(null), '');
  });

  test('undefined → chaine vide', () => {
    assert.strictEqual(escapeHtml(undefined), '');
  });

  test('nombre converti en string', () => {
    assert.strictEqual(escapeHtml(42), '42');
  });
});

describe('formatDate', () => {
  test('date ISO valide format fr-FR', () => {
    const r = formatDate('2026-07-26T10:30:00Z');
    assert.strictEqual(typeof r, 'string');
    assert.strictEqual(r.includes('2026'), true);
    assert.strictEqual(r.includes(':'), true);
    assert.strictEqual(/^\d{1,2}\s/.test(r), true);
  });

  test('date invalide retourne la chaine', () => {
    assert.strictEqual(formatDate('pas-une-date'), 'pas-une-date');
  });

  test('chaine vide retourne vide', () => {
    assert.strictEqual(formatDate(''), '');
  });

  test('timestamp numerique', () => {
    const r = formatDate(1721989800000);
    assert.strictEqual(typeof r, 'string');
    assert.strictEqual(r.length > 0, true);
    assert.strictEqual(r.includes(':'), true);
  });

  test('null converti en timestamp epoch', () => {
    const r = formatDate(null);
    assert.strictEqual(typeof r, 'string');
    assert.strictEqual(r.length > 0, true);
  });
});
