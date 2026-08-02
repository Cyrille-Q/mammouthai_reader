# AGENTS.md – mammouth.ai Reader

Compact instructions for OpenCode sessions. Focus on repo-specific details that agents might otherwise miss.

## Project Overview

- Static web app for viewing mammouth.ai conversation exports (JSON).
- No build system, dependencies, or package manager.
- Just open `index.html` in a browser—no dev server needed.

## Development Commands

- No `npm`, `yarn`, `pnpm`, or `bun` scripts.
- No lint, test, or type‑check commands.
- Open `index.html` directly—no local server required.

## Design Guidelines

- Font: **Plus Jakarta Sans** (already loaded via Google Fonts).
- Primary text color: `#311A17` (brown‑950 in CSS variables).
- Color palette defined in `style.css` using CSS custom properties.
- Follow branding rules in `docs/charte_graphique/charte.md`.
- Logo usage: only in “Powered by mammouth.ai” footer; do not modify.

## Code Notes

- `script.js` expects mammouth.ai export format:
  - Alternating user/assistant messages (even index = user, odd = assistant).
  - Thinking blocks delimited by `<think>`…`</think>` tags.
  - Model field indicates conversation‑wide model, not per‑message role.
- Supports fallback JSON structures (`chats`, `conversations`, direct array).
- No external libraries—vanilla ES6.
- No polyfills; targets modern browsers only.

## OpenCode Configuration

- `mammouth.json` sets LSP enabled and `bash: "ask"`.
- Always ask before running any bash command.
- No other OpenCode plugins or skills.

## What to Ignore

- No `.gitignore`, `.editorconfig`, or formatter config.
- No CI/CD workflows.
- No tests or snapshots.
- No generated files or build artifacts.

## Quick Start

1. Open `index.html` in a browser.
2. Load a mammouth.ai export JSON file.
3. Conversations appear in the sidebar; click to view.

That’s it—the whole app is three files (`index.html`, `style.css`, `script.js`).