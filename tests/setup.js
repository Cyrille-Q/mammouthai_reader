const path = require('path');
const marked = require('../vendor/marked.umd.js');

marked.setOptions({ gfm: true, breaks: true });
globalThis.marked = marked;

globalThis.DOMPurify = {
  _hooks: [],
  addHook(hookName, callback) {
    if (hookName === 'afterSanitizeAttributes') {
      this._hooks.push(callback);
    }
  },
  sanitize(html, options = {}) {
    let result = html;

    // Supprimer les balises FORBID_TAGS
    const forbidTags = options.FORBID_TAGS || [];
    for (const tag of forbidTags) {
      result = result.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
      result = result.replace(new RegExp(`</${tag}>`, 'gi'), '');
    }

    // Prévenir XSS : supprimer les balises <script>
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    result = result.replace(/<script[^>]*\/>/gi, '');

    // Supprimer les gestionnaires d'événements inline
    result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // Appliquer le hook afterSanitizeAttributes aux balises <a>
    if (this._hooks.length > 0) {
      result = result.replace(/(<a\s)([^>]*)(>)/gi, (match, open, attrs, close) => {
        if (!/\btarget\s*=\s*["']_blank["']/.test(attrs)) {
          attrs += ' target="_blank"';
        }
        if (!/\brel\s*=\s*/.test(attrs)) {
          attrs += ' rel="noopener noreferrer"';
        }
        return open + attrs + close;
      });
    }

    return result;
  },
};

globalThis.document = {
  getElementById: () => null,
  createElement: (tag) => {
    let _text = '';
    return {
      tagName: tag.toUpperCase(),
      get textContent() { return _text; },
      set textContent(v) { _text = String(v); },
      get innerHTML() {
        return _text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      },
      set innerHTML(v) {},
      setAttribute: () => {},
    };
  },
};