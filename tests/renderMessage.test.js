const { describe, test } = require('node:test');
const assert = require('node:assert');
require('./setup');
const { renderMessage } = require('../script');

describe('renderMessage', () => {
  test('message utilisateur', () => {
    const msg = { role: 'user', content: 'Bonjour', createdAt: '2026-07-26T10:00:00Z' };
    const r = renderMessage(msg, 0);
    assert.strictEqual(r.includes('class="message user"'), true);
    assert.strictEqual(r.includes('<span class="msg-role">👤 Vous</span>'), true);
    assert.strictEqual(r.includes('>Bonjour</p>'), true);
    assert.strictEqual(r.includes('class="msg-time"'), true);
    assert.strictEqual(r.includes('msg-model'), false);
    assert.strictEqual(r.includes('msg-thinking'), false);
  });

  test('message assistant sans modèle', () => {
    const msg = { role: 'assistant', content: 'Voilà.' };
    const r = renderMessage(msg, 1);
    assert.strictEqual(r.includes('class="message assistant"'), true);
    assert.strictEqual(r.includes('🤖 Assistant'), true);
    assert.strictEqual(r.includes('msg-time'), false);
  });

  test('message assistant avec modèle et timestamp', () => {
    const msg = {
      role: 'assistant',
      content: 'Réponse.',
      model: 'claude-sonnet-4-20250514',
      createdAt: '2026-07-26T10:01:00Z',
    };
    const r = renderMessage(msg, 1);
    assert.strictEqual(r.includes('class="message assistant"'), true);
    assert.strictEqual(r.includes('msg-model'), true);
    assert.strictEqual(r.includes('claude-sonnet-4-20250514'), true);
    assert.strictEqual(r.includes('msg-time'), true);
  });

  test('message assistant avec bloc raisonnement', () => {
    const msg = {
      role: 'assistant',
      content: '<think>Réflexion</think>\nVoici la réponse.',
      model: 'claude',
    };
    const r = renderMessage(msg, 1);
    assert.strictEqual(r.includes('class="msg-thinking"'), true);
    assert.strictEqual(r.includes('💭 Raisonnement'), true);
    assert.strictEqual(r.includes('>Réflexion</p>'), true);
    assert.strictEqual(r.includes('>Voici la réponse.</p>'), true);
  });

  test('message assistant sans raisonnement', () => {
    const msg = {
      role: 'assistant',
      content: 'Pas de réflexion ici.',
      model: 'gpt-4',
    };
    const r = renderMessage(msg, 1);
    assert.strictEqual(r.includes('msg-thinking'), false);
  });

  test('message système', () => {
    const msg = { role: 'system', content: 'Règle du jeu.', model: 'system' };
    const r = renderMessage(msg, 2);
    assert.strictEqual(r.includes('class="message system"'), true);
    assert.strictEqual(r.includes('⚙️ Système'), true);
    assert.strictEqual(r.includes('msg-model'), false);
  });

  test('contenu vide', () => {
    const msg = { role: 'user', content: '' };
    const r = renderMessage(msg, 0);
    assert.strictEqual(r.includes('class="message user"'), true);
    assert.strictEqual(r.includes('<div class="msg-content"></div>'), true);
  });

  test('contenu null', () => {
    const msg = { role: 'assistant', content: null };
    const r = renderMessage(msg, 1);
    assert.strictEqual(r.includes('<div class="msg-content"></div>'), true);
  });

  test('modèle XSS échappé dans le badge', () => {
    const msg = {
      role: 'assistant',
      content: 'Bonjour',
      model: '<script>alert("xss")</script>',
    };
    const r = renderMessage(msg, 1);
    assert.strictEqual(r.includes('<script>'), false);
    assert.strictEqual(r.includes('&lt;script&gt;'), true);
  });

  test('timestamp XSS échappé', () => {
    const msg = {
      role: 'user',
      content: 'Bonjour',
      createdAt: '<script>',
    };
    const r = renderMessage(msg, 0);
    assert.strictEqual(r.includes('<script>'), false);
  });
});