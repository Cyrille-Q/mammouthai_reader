# AGENTS.md – mammouth.ai Reader

Compact instructions for OpenCode sessions. Focus on repo-specific details that agents might otherwise miss.

## Project Overview

- Static web app for viewing mammouth.ai conversation exports (JSON).
- No build system or package manager; external libraries are vendored locally in `vendor/`.
- Just open `index.html` in a browser—no dev server needed.
- UI language is French (headers, buttons, empty states, error messages).
- Sample data lives in `exports/`; branding rules in `docs/charte_graphique/charte.md`.

## Development Commands

- No `npm`, `yarn`, `pnpm`, or `bun` scripts.
- No lint, test, or type‑check commands.
- Open `index.html` directly—no local server required.

## Design Guidelines

- Font: **Plus Jakarta Sans** (loaded via Google Fonts, weights 400/500/800).
- Color palette defined in `style.css` as CSS custom properties, in two scales:
  - brown scale `--color-brown-10`…`--color-brown-950` (`#311a17` is the primary text/signature color, `--color-brown-950`).
  - grey scale `--color-grey-10`…`--color-grey-950`.
  - Semantic aliases re-map these onto `--ui-*` and `--bg-*`/`--text-*` tokens (e.g. `--ui-text-primary`, `--ui-accent`, `--ui-message-*-bg`).
- Do not invent new hex colors; reuse existing CSS variables when styling `index.html`/`style.css`.
- Follow branding rules in `docs/charte_graphique/charte.md`.
- Logo usage: `logo.svg` appears in the app header **and** in the “Powered by mammouth.ai” footer. Never modify the logo file or its colors.

## Code Notes

- `script.js` is vanilla ES6, split into: state, DOM refs, file handling, conversation extraction/display, message rendering, search, Markdown export, and utilities.
- `index.html`/`script.js` use French ARIA labels and placeholders; keep them in French.

### Conversation extraction (`extractConversations`)
- Supports several JSON shapes: mammouth export (array of `{ chats: [...] }` items, flat-mapped),
  `{ chats: [...] }`, `{ conversations: [...] }`, direct array of conversations, and a recursive `document` wrapper.
- A conversation is valid only if it has an `id`/`_id` and either `messages` or `title` (`isValidConversation`).

### Message roles (`getRole`)
- `model` value decides the role first: `user`/`human`/`me` → user, `system`/`tool` → system, anything else → assistant.
- If no recognizable `model`, roles fall back to index alternation for mammouth exports (even index = user, odd = assistant).
- `model` often carries a display badge on assistant messages (which model replied), not the sender identity.
- A `createdAt` may render a timestamp per message.

### Thinking blocks (`splitThinking`, `renderMessage`)
- Assistant reasoning is delimited by `<think>…</think>` tags at the start of the content.
- `splitThinking` strips them; the reason is shown in a collapsible `<details class="msg-thinking">` “Raisonnement” block.

### Content rendering (`renderContent`)
- Markdown complet (GitHub Flavored Markdown) via `marked` (GFM, breaks).
- HTML sécurisé via `DOMPurify` (supprime les images, ajoute `target="_blank" rel="noopener noreferrer" aux liens).
- Les blocs de code (```lang …```) et code inline (`code`) sont rendus avec les styles existants.
- Les retours à la ligne sont convertis en `<br>` (option `breaks: true`).
- Les bibliothèques sont hébergées localement dans `vendor/` (marked v18.x, DOMPurify 3.x). La coloration syntaxique via highlight.js est planifiée pour une future passe.

### Search (`handleSearch`)
- Filters conversations by **title and/or message content** (case-insensitive) when `#search-input` is non‑empty; otherwise restores the full list.

### Errors
- Invalid/unreadable file or JSON parse failure shows the `#error-banner` via `showError`/`hideError`.

### Markdown export (`exportConversation`)
- Every `.conversation-item` has an export button (`.btn-export`, `aria-label` in French, `⬇`) whose click calls `exportConversation` with `stopPropagation` so it does not select the conversation.
- `conversationToMarkdown` builds a readable doc: title + metadata (dates, message count), then per message a role heading (`👤 Utilisateur`/`🤖 Assistant`/`⚙️ Système`), the model badge and timestamp on assistant answers, the « 💭 Raisonnement » block as a quoted (`>`) section, the content, and a « 🔗 Liens détectés » list (`- [url](url)`).
- `extractLinks` collects unique URLs via an `https?://…` regex, stripping trailing punctuation.
- `sanitizeFilename` turns the title into a safe ASCII slug (NFD, allowed chars), falling back to the `id` or `sans-titre`, suffixed `.md`.
- **Storage**: `saveFileWithPicker` (File System Access API, `showSaveFilePicker`) opens the native save/destination dialog **only in a secure context** (HTTPS or `localhost`, not `file://`). Otherwise `downloadMarkdown` (Blob + `<a download>`) is the automatic fallback. Errors surface via `showError`; dialog cancellation (`AbortError`) is silent.

## OpenCode Configuration

- `mammouth.json` (root) sets `lsp: true` and `permission.bash: "ask"`.
- Always ask before running any bash command (also set in `AGENTS.md` development expectations).
- Project `opencode.json` does not exist; `.opencode/` holds repository-scoped OpenCode files:
  - `.opencode/command/` – custom OpenCode commands (e.g. `exemple.md`).
  - `.opencode/.gitignore` – local ignore list (node_modules, package manifests, root `.gitignore`).
- When adding commands/agents/skills, prefer files under `.opencode/` over inlining in `opencode.json`, and restart OpenCode for changes to apply.

## What to Ignore

- No root `.gitignore`, `.editorconfig`, or formatter config (only the local `.opencode/.gitignore`).
- No CI/CD workflows.
- No tests or snapshots.
- No generated build artifacts.

## Quick Start

1. Open `index.html` in a browser.
2. Load a mammouth.ai export JSON file.
3. Conversations appear in the sidebar; search filters them; click to view; each item has an export-to-Markdown button.

That’s it—the whole app is three files (`index.html`, `style.css`, `script.js`), with branding docs in `docs/` and sample exports in `exports/`.