const { describe, test } = require('node:test');
const assert = require('node:assert');
require('./setup');
const { renderContent, conversationToMarkdown } = require('../script');

describe('renderContent', () => {
  test('texte simple', () => {
    assert.strictEqual(renderContent('Bonjour'), '<p>Bonjour</p>\n');
  });

  test('gras et italique', () => {
    const r = renderContent('**gras** et *italique*');
    assert.strictEqual(r.includes('<strong>gras</strong>'), true);
    assert.strictEqual(r.includes('<em>italique</em>'), true);
  });

  test('lien Markdown avec target blank et rel', () => {
    const r = renderContent('[clic](https://example.com)');
    assert.strictEqual(r.includes('href="https://example.com"'), true);
    assert.strictEqual(r.includes('target="_blank"'), true);
    assert.strictEqual(r.includes('rel="noopener noreferrer"'), true);
  });

  test('bloc de code fencé', () => {
    const r = renderContent('```js\nconst x = 1;\n```');
    assert.strictEqual(r.includes('</code>'), true);
    assert.strictEqual(r.includes('const x = 1;'), true);
  });

  test('code inline', () => {
    const r = renderContent('Utilise `code()` ici');
    assert.strictEqual(r.includes('<code>code()</code>'), true);
  });

  test('citation blockquote', () => {
    const r = renderContent('> Une citation');
    assert.strictEqual(r.includes('<blockquote>'), true);
    assert.strictEqual(r.includes('<p>Une citation</p>'), true);
  });

  test('liste non ordonnée', () => {
    const r = renderContent('- item 1\n- item 2');
    assert.strictEqual(r.includes('<ul>'), true);
    assert.strictEqual(r.includes('<li>item 1</li>'), true);
    assert.strictEqual(r.includes('<li>item 2</li>'), true);
  });

  test('liste ordonnée', () => {
    const r = renderContent('1. premier\n2. deuxième');
    assert.strictEqual(r.includes('<ol>'), true);
    assert.strictEqual(r.includes('<li>premier</li>'), true);
    assert.strictEqual(r.includes('<li>deuxième</li>'), true);
  });

  test('ligne horizontale', () => {
    const r = renderContent('---');
    assert.strictEqual(r.includes('<hr'), true);
  });

  test('retour à la ligne (breaks)', () => {
    const r = renderContent('ligne 1\nligne 2');
    assert.strictEqual(r.includes('<br>'), true);
  });

  test('barré (strikethrough GFM)', () => {
    const r = renderContent('~~barré~~');
    assert.strictEqual(r.includes('<del>'), true);
    assert.strictEqual(r.includes('barré'), true);
  });

  test('tableau GFM', () => {
    const r = renderContent('| A | B |\n|---|---|\n| 1 | 2 |');
    assert.strictEqual(r.includes('<table>'), true);
    assert.strictEqual(r.includes('<th>A</th>'), true);
    assert.strictEqual(r.includes('<td>1</td>'), true);
  });

  test('titre heading', () => {
    const r = renderContent('## Titre');
    assert.strictEqual(r.includes('<h2'), true);
    assert.strictEqual(r.includes('Titre'), true);
  });

  test('supprime les balises img (FORBID_TAGS)', () => {
    const r = renderContent('<img src="x" onerror="alert(1)">');
    assert.strictEqual(r.includes('<img'), false);
  });

  test('supprime les balises script (XSS)', () => {
    const r = renderContent('<script>alert("xss")</script>');
    assert.strictEqual(r.includes('<script>'), false);
    assert.strictEqual(r.includes('alert'), false);
  });

  test('supprime les event handlers inline', () => {
    const r = renderContent('<a href="#" onclick="alert(1)">clic</a>');
    assert.strictEqual(r.includes('onclick'), false);
  });

  test('contenu avec chevrons echappé par marked', () => {
    const r = renderContent('x < y');
    assert.strictEqual(r.includes('<p>x &lt; y</p>'), true);
  });

  test('texte vide', () => {
    assert.strictEqual(renderContent(''), '');
    assert.strictEqual(renderContent(null), '');
    assert.strictEqual(renderContent(undefined), '');
  });
});

describe('conversationToMarkdown', () => {
  test('messages user assistant system', () => {
    const ot = '<think>';
    const ct = "</think>";
    const conv = {
      id: 'c1',
      title: 'Test',
      createdAt: '2026-07-26T10:00:00Z',
      messages: [
        { role: 'user', content: 'Salut' },
        { role: 'assistant', content: ot + 'Reflexion' + ct + '\nReponse', model: 'claude' },
        { model: 'system', content: 'Regle' },
      ],
    };
    const r = conversationToMarkdown(conv);
    assert.strictEqual(r.includes('Test'), true);
    assert.strictEqual(r.includes('Utilisateur'), true);
    assert.strictEqual(r.includes('Assistant'), true);
    assert.strictEqual(r.includes('Syst'), true); // Système
    assert.strictEqual(r.includes('Raisonnement'), true);
    assert.strictEqual(r.includes('Reflexion'), true);
    assert.strictEqual(r.includes('claude'), true);
    assert.strictEqual(r.includes('---'), true);
  });

  test('titre sans titre', () => {
    const r = conversationToMarkdown({ id: 'x', messages: [] });
    assert.strictEqual(r.includes('Sans titre'), true);
  });

  test('aucun message', () => {
    const r = conversationToMarkdown({ id: 'x', title: 'Vide', messages: [] });
    assert.strictEqual(r.includes('aucun message'), true);
  });

  test('section liens', () => {
    const conv = {
      id: 'x',
      title: 'Liens',
      messages: [
        { role: 'user', content: 'Regarde https://example.com' },
      ],
    };
    const r = conversationToMarkdown(conv);
    assert.strictEqual(r.includes('Liens'), true);
    assert.strictEqual(r.includes('https://example.com'), true);
  });
});