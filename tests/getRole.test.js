const { describe, test } = require('node:test');
const assert = require('node:assert');
require('./setup');
const { getRole, splitThinking } = require('../script');

describe('getRole', () => {
  test('model user', () => assert.strictEqual(getRole({ model: 'user' }), 'user'));
  test('model human', () => assert.strictEqual(getRole({ model: 'human' }), 'user'));
  test('model me', () => assert.strictEqual(getRole({ model: 'me' }), 'user'));
  test('model system', () => assert.strictEqual(getRole({ model: 'system' }), 'system'));
  test('model tool', () => assert.strictEqual(getRole({ model: 'tool' }), 'system'));
  test('model claude', () => assert.strictEqual(getRole({ model: 'claude' }), 'assistant'));
  test('model gpt4', () => assert.strictEqual(getRole({ model: 'gpt-4' }), 'assistant'));
  test('model vide', () => assert.strictEqual(getRole({ model: '' }), 'assistant'));
  test('model manquant', () => assert.strictEqual(getRole({}), 'assistant'));
  test('index pair 0', () => assert.strictEqual(getRole({}, 0), 'user'));
  test('index pair 2', () => assert.strictEqual(getRole({}, 2), 'user'));
  test('index impair 1', () => assert.strictEqual(getRole({}, 1), 'assistant'));
  test('index impair 3', () => assert.strictEqual(getRole({}, 3), 'assistant'));
  test('model user ecrase index', () => assert.strictEqual(getRole({ model: 'user' }, 1), 'user'));
  test('model non-string (nombre) ne leve pas d erreur', () => assert.strictEqual(getRole({ model: 123 }), 'assistant'));
  test('model non-string (objet) ne leve pas d erreur', () => assert.strictEqual(getRole({ model: { x: 1 } }), 'assistant'));
  test('model null', () => assert.strictEqual(getRole({ model: null }), 'assistant'));
  test('msg null avec index', () => assert.strictEqual(getRole(null, 0), 'user'));
  test('msg undefined sans index', () => assert.strictEqual(getRole(undefined), 'assistant'));
});

describe('splitThinking', () => {
const ot = '<think>';
  const ct = '</think>';

  test('sans balises', () => {
    const r = splitThinking('Bonjour');
    assert.strictEqual(r.thinking, '');
    assert.strictEqual(r.content, 'Bonjour');
  });

  test('avec balises completes', () => {
    const r = splitThinking(ot + 'Je reflechis' + ct + 'Voici la reponse');
    assert.strictEqual(r.thinking, 'Je reflechis');
    assert.strictEqual(r.content, 'Voici la reponse');
  });

  test('multiligne', () => {
    const r = splitThinking(ot + 'Ligne 1\nLigne 2' + ct + '\nReponse finale.');
    assert.strictEqual(r.thinking, 'Ligne 1\nLigne 2');
    assert.strictEqual(r.content, 'Reponse finale.');
  });

  test('balise ouvrante seule', () => {
    const input = ot + 'Pas ferme';
    const r = splitThinking(input);
    assert.strictEqual(r.thinking, '');
    assert.strictEqual(r.content, input);
  });

  test('balises vides', () => {
    const r = splitThinking(ot + ct + 'Contenu');
    assert.strictEqual(r.thinking, '');
    assert.strictEqual(r.content, 'Contenu');
  });

  test('rien apres balise fermante', () => {
    const r = splitThinking(ot + 'Pensee' + ct);
    assert.strictEqual(r.thinking, 'Pensee');
    assert.strictEqual(r.content, '');
  });

  test('texte vide', () => {
    const r = splitThinking('');
    assert.strictEqual(r.thinking, '');
    assert.strictEqual(r.content, '');
  });

  test('null ne leve pas d erreur', () => {
    const r = splitThinking(null);
    assert.strictEqual(r.thinking, '');
    assert.strictEqual(r.content, '');
  });

  test('undefined ne leve pas d erreur', () => {
    const r = splitThinking(undefined);
    assert.strictEqual(r.thinking, '');
    assert.strictEqual(r.content, '');
  });
});
