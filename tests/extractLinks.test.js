const { describe, test } = require('node:test');
const assert = require('node:assert');
require('./setup');
const { extractLinks, sanitizeFilename } = require('../script');

describe('extractLinks', () => {
  test('URL simple', () => {
    const r = extractLinks('Voir https://example.com');
    assert.deepStrictEqual(r, ['https://example.com']);
  });

  test('URL avec ponctuation finale', () => {
    const r = extractLinks('Visitez https://example.com.');
    assert.deepStrictEqual(r, ['https://example.com']);
  });

  test('URL avec parenthese finale', () => {
    const r = extractLinks('(https://example.com)');
    assert.deepStrictEqual(r, ['https://example.com']);
  });

  test('URL avec point-virgule final', () => {
    const r = extractLinks('Test https://example.com; fin');
    assert.deepStrictEqual(r, ['https://example.com']);
  });

  test('URL multiples', () => {
    const r = extractLinks('A https://a.com et B https://b.com');
    assert.deepStrictEqual(r, ['https://a.com', 'https://b.com']);
  });

  test('URL dupliquees', () => {
    const r = extractLinks('https://a.com et https://a.com');
    assert.deepStrictEqual(r, ['https://a.com']);
  });

  test('URL avec parametres de requete', () => {
    const r = extractLinks('Voir https://example.com?q=test&lang=fr');
    assert.deepStrictEqual(r, ['https://example.com?q=test&lang=fr']);
  });

  test('URL avec fragment', () => {
    const r = extractLinks('Lien https://example.com/page#section');
    assert.deepStrictEqual(r, ['https://example.com/page#section']);
  });

  test('URL dans un texte long', () => {
    const r = extractLinks('Consultez https://docs.example.com/api/v2/users?page=1&limit=10#results pour les détails.');
    assert.deepStrictEqual(r, ['https://docs.example.com/api/v2/users?page=1&limit=10#results']);
  });

  test('pas d URL', () => {
    assert.deepStrictEqual(extractLinks('pas de lien'), []);
  });

  test('texte vide', () => {
    assert.deepStrictEqual(extractLinks(''), []);
  });

  test('null/undefined', () => {
    assert.deepStrictEqual(extractLinks(null), []);
    assert.deepStrictEqual(extractLinks(undefined), []);
  });
});

describe('sanitizeFilename', () => {
  test('titre normal', () => {
    assert.strictEqual(sanitizeFilename('Ma Conversation', null), 'ma-conversation.md');
  });

  test('titre avec accents', () => {
    assert.strictEqual(sanitizeFilename('Conversation privee', null), 'conversation-privee.md');
  });

  test('titre avec caracteres speciaux', () => {
    assert.strictEqual(sanitizeFilename('Hello World! @#$', null), 'hello-world.md');
  });

  test('titre vide sans id', () => {
    assert.strictEqual(sanitizeFilename('', null), 'sans-titre.md');
  });

  test('titre vide avec id', () => {
    assert.strictEqual(sanitizeFilename('', 'abc123'), 'abc123.md');
  });

  test('titre null avec id', () => {
    assert.strictEqual(sanitizeFilename(null, 'my-id'), 'my-id.md');
  });

  test('titre tres long tronque a 80', () => {
    const long = 'a'.repeat(100);
    const r = sanitizeFilename(long, null);
    assert.strictEqual(r.length <= 83, true);
    assert.ok(r.endsWith('.md'));
    assert.strictEqual(r, 'a'.repeat(80) + '.md');
  });

  test('titre ne contenant que des separaters', () => {
    assert.strictEqual(sanitizeFilename('---', 'fallback'), 'fallback.md');
  });
});
