const { describe, test } = require('node:test');
const assert = require('node:assert');
require('./setup');
const { isValidConversation, extractConversations } = require('../script');
const {
  validConv, validConvWithUnderscoreId,
  invalidConvNull, invalidConvNoId, invalidConvNoTitleNoMessages,
  mammouthExport, chatsObject, conversationsObject,
  documentWrapper, toolResultData,
} = require('./fixtures');

describe('isValidConversation', () => {
  test('valide avec id et title', () => {
    assert.strictEqual(isValidConversation(validConv), true);
  });

  test('valide avec _id et messages', () => {
    assert.strictEqual(isValidConversation(validConvWithUnderscoreId), true);
  });

  test('valide avec id et messages', () => {
    assert.strictEqual(isValidConversation({ id: '1', messages: [] }), true);
  });

  test('invalide null', () => {
    assert.ok(!isValidConversation(invalidConvNull));
  });

  test('invalide undefined', () => {
    assert.ok(!isValidConversation(undefined));
  });

  test('invalide pas un objet', () => {
    assert.strictEqual(isValidConversation('string'), false);
  });

  test('invalide pas d id', () => {
    assert.strictEqual(isValidConversation(invalidConvNoId), false);
  });

  test('invalide ni messages ni title', () => {
    assert.strictEqual(isValidConversation(invalidConvNoTitleNoMessages), false);
  });

  test('invalide objet vide', () => {
    assert.strictEqual(isValidConversation({}), false);
  });
});

describe('extractConversations', () => {
  test('tableau Mammouth', () => {
    const result = extractConversations(mammouthExport);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, 'm1');
    assert.strictEqual(result[1].id, 'm2');
  });

  test('objet chats', () => {
    const result = extractConversations(chatsObject);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'c1');
  });

  test('objet conversations', () => {
    const result = extractConversations(conversationsObject);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'r1');
  });

  test('tableau direct', () => {
    const arr = [
      { id: 'd1', title: 'A', messages: [] },
      { id: 'd2', title: 'B', messages: [{ content: 'x' }] },
    ];
    const result = extractConversations(arr);
    assert.strictEqual(result.length, 2);
  });

  test('document wrapper recursif', () => {
    const result = extractConversations(documentWrapper);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'd1');
  });

  test('tool_result retourne vide', () => {
    assert.strictEqual(extractConversations(toolResultData).length, 0);
  });

  test('objet vide', () => {
    assert.strictEqual(extractConversations({}).length, 0);
  });

  test('tableau vide', () => {
    assert.strictEqual(extractConversations([]).length, 0);
  });

  test('filtre invalides', () => {
    const arr = [
      { id: 'v', title: 'Valide', messages: [] },
      { title: 'Invalide' },
    ];
    assert.strictEqual(extractConversations(arr).length, 1);
  });

  test('null ne leve pas d erreur', () => {
    assert.deepStrictEqual(extractConversations(null), []);
  });

  test('undefined ne leve pas d erreur', () => {
    assert.deepStrictEqual(extractConversations(undefined), []);
  });

  test('nombre ne leve pas d erreur', () => {
    assert.deepStrictEqual(extractConversations(42), []);
  });

  test('chaine ne leve pas d erreur', () => {
    assert.deepStrictEqual(extractConversations('pas un objet'), []);
  });
});
