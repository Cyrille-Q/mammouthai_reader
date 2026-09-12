/**
 * Lecteur de Conversations JSON
 * Application vanilla JS pour visualiser des conversations extraites d'un fichier JSON.
 */

// État global de l'application
const state = {
  conversations: [],
  selectedId: null,
  filteredConversations: [],
};

// ===== Références DOM =====
const fileInput = typeof document !== 'undefined' ? document.getElementById('file-input') : null;
const fileButton = typeof document !== 'undefined' ? document.getElementById('file-button') : null;
const fileNameLabel = typeof document !== 'undefined' ? document.getElementById('file-name') : null;
const conversationsList = typeof document !== 'undefined' ? document.getElementById('conversations-list') : null;
const conversationContent = typeof document !== 'undefined' ? document.getElementById('conversation-content') : null;
const conversationCount = typeof document !== 'undefined' ? document.getElementById('conversation-count') : null;
const searchInput = typeof document !== 'undefined' ? document.getElementById('search-input') : null;
const errorBanner = typeof document !== 'undefined' ? document.getElementById('error-banner') : null;
const errorMessage = typeof document !== 'undefined' ? document.getElementById('error-message') : null;

// ===== Événements =====
if (typeof document !== 'undefined' && fileButton) {
  fileButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  searchInput.addEventListener('input', handleSearch);
}

// ===== Rendu Markdown =====
if (typeof marked !== 'undefined') {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
}

// Ajouter target="_blank" et rel="noopener noreferrer" aux liens
if (typeof DOMPurify !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// ===== Gestion du fichier =====

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  fileNameLabel.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const raw = e.target.result;
      const data = JSON.parse(raw);
      const conversations = extractConversations(data);

      if (conversations.length === 0) {
        showError('Aucune conversation trouvée dans ce fichier. Vérifiez le format du JSON.');
        return;
      }

      state.conversations = conversations;
      state.filteredConversations = [...conversations];
      state.selectedId = null;

      displayConversations(state.filteredConversations);
      conversationCount.textContent = conversations.length;

      if (conversations.length > 0) {
        selectConversation(conversations[0].id);
      }

      hideError();
    } catch (err) {
      showError('Erreur de parsing JSON : ' + err.message);
    }
  };
  reader.onerror = () => {
    showError('Impossible de lire le fichier.');
  };
  reader.readAsText(file);
}

/**
 * Extrait les conversations du JSON en gérant plusieurs structures possibles :
 * - [ { type: "customMammoth", chats: [...] }, ... ] (export Mammouth)
 * - { chats: [...] } (structure standard)
 * - [ { id, title, messages, ... }, ... ] (tableau direct de conversations)
 * - { document: { ... } } (structure wrapper)
 * - { conversations: [...] }
 */
function extractConversations(data) {
  let chats = [];

  if (!data || typeof data !== 'object') {
    return [];
  }

  if (Array.isArray(data)) {
    // Export Mammouth : tableau d'objets avec chacun un sous-tableau chats
    if (data.length > 0 && data[0].chats && Array.isArray(data[0].chats)) {
      chats = data.flatMap((item) => item.chats || []);
    } else {
      chats = data;
    }
  } else if (data.chats && Array.isArray(data.chats)) {
    chats = data.chats;
  } else if (data.conversations && Array.isArray(data.conversations)) {
    chats = data.conversations;
  } else if (data.document && typeof data.document === 'object') {
    return extractConversations(data.document);
  } else if (data.tool_result || data.iteration_start) {
    return [];
  }

  return chats.filter(isValidConversation);
}

function isValidConversation(item) {
  return (
    item &&
    typeof item === 'object' &&
    (item.id !== undefined || item._id !== undefined) &&
    (item.messages !== undefined || item.title !== undefined)
  );
}

// ===== Affichage de la liste des conversations =====

function displayConversations(conversations) {
  if (conversations.length === 0) {
    conversationsList.innerHTML = '<p class="placeholder">Aucune conversation trouvée.</p>';
    return;
  }

  conversationsList.innerHTML = '';
  conversationsList.setAttribute('role', 'list');

  conversations.forEach((conv) => {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', conv.title || 'Conversation sans titre');
    item.dataset.id = conv.id;
    item.addEventListener('click', () => selectConversation(conv.id));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectConversation(conv.id);
      }
    });

    const msgCount = conv.messages ? conv.messages.length : 0;
    const dateStr = conv.createdAt ? formatDate(conv.createdAt) : '';

    const title = conv.title || 'Sans titre';
    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${escapeHtml(title)}</div>
        <button type="button" class="btn-export" aria-label="Exporter la conversation en Markdown" title="Exporter en Markdown">⬇</button>
      </div>
      <div class="item-meta">
        ${dateStr ? `<span class="item-date">📅 ${dateStr}</span>` : ''}
        <span class="item-msg-count">${msgCount} msg</span>
      </div>
    `;

    const exportBtn = item.querySelector('.btn-export');
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportConversation(conv);
    });

    conversationsList.appendChild(item);
  });
}

// ===== Sélection et affichage d'une conversation =====

function selectConversation(id) {
  state.selectedId = id;

  document.querySelectorAll('.conversation-item').forEach((el) => {
    if (el.dataset.id == id) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });

  const conv = state.conversations.find((c) => c.id == id);
  if (conv) {
    displayConversation(conv);
  }
}

function displayConversation(conv) {
  const messages = conv.messages || [];
  const dateStr = conv.createdAt ? formatDate(conv.createdAt) : '';
  const updatedStr = conv.updatedAt ? formatDate(conv.updatedAt) : '';

  let html = `
    <div class="conversation-header">
      <h2>${escapeHtml(conv.title || 'Sans titre')}</h2>
      <div class="conv-meta">
        ${dateStr ? `<span>📅 Créée le ${dateStr}</span>` : ''}
        ${updatedStr ? `<span>🔄 Modifiée le ${updatedStr}</span>` : ''}
        <span>💬 ${messages.length} message${messages.length > 1 ? 's' : ''}</span>
      </div>
    </div>
    <div class="messages-container">
  `;

  if (messages.length === 0) {
    html += '<p class="empty-conversation">Cette conversation ne contient aucun message.</p>';
  } else {
    messages.forEach((msg, index) => {
      html += renderMessage(msg, index);
    });
  }

  html += '</div>';
  conversationContent.innerHTML = html;
  conversationContent.scrollTop = 0;
}

/**
 * Détermine le rôle d'un message.
 * Dans l'export Mammouth, les messages alternent : index pair = utilisateur,
 * index impair = assistant. Le champ model indique le modèle utilisé pour
 * la conversation entière, pas l'expéditeur du message.
 * On garde aussi une détection basée sur model pour les autres formats.
 */
function getRole(msg, index) {
  const rawModel = msg && msg.model;
  const model = typeof rawModel === 'string' ? rawModel.toLowerCase() : '';
  if (model === 'user' || model === 'human' || model === 'me') return 'user';
  if (model === 'system' || model === 'tool') return 'system';

  // Export Mammouth : alternance par index (pair = user, impair = assistant)
  if (typeof index === 'number') {
    return index % 2 === 0 ? 'user' : 'assistant';
  }

  return 'assistant';
}

/**
 * Sépare le bloc de raisonnement du contenu principal.
 * Dans l'export Mammouth, les réponses de l'assistant commencent par un
 * bloc de réflexion délimité par les balises think.
 */
function splitThinking(text) {
  if (text === null || text === undefined) {
    return { thinking: '', content: '' };
  }

  const result = { thinking: '', content: text };
  const openTag = String.fromCharCode(60) + 'think' + String.fromCharCode(62);
  const closeTag = String.fromCharCode(60) + '/think' + String.fromCharCode(62);

  if (text.startsWith(openTag)) {
    const closeIdx = text.indexOf(closeTag);
    if (closeIdx !== -1) {
      result.thinking = text.slice(openTag.length, closeIdx).trim();
      result.content = text.slice(closeIdx + closeTag.length).trim();
    }
  }
  return result;
}

function renderMessage(msg, index) {
  const rawContent = msg.content || '';
  const model = msg.model || '';
  const role = getRole(msg, index);
  const roleLabel = role === 'user' ? '👤 Vous' : role === 'system' ? '⚙️ Système' : '🤖 Assistant';
  const modelBadge = role === 'assistant' && model
    ? `<span class="msg-model">${escapeHtml(model)}</span>`
    : '';

  // Séparer le raisonnement du contenu pour les messages assistant
  const { thinking, content } = role === 'assistant'
    ? splitThinking(rawContent)
    : { thinking: '', content: rawContent };

  const renderedContent = renderContent(content);

  // Bloc de raisonnement repliable
  let thinkingHtml = '';
  if (thinking) {
    thinkingHtml = `
      <details class="msg-thinking">
        <summary>💭 Raisonnement</summary>
        <div class="thinking-content">${renderContent(thinking)}</div>
      </details>
    `;
  }

  let timeStr = '';
  if (msg.createdAt) {
    timeStr = `<span class="msg-time">${escapeHtml(formatDate(msg.createdAt))}</span>`;
  }

  return `
    <div class="message ${role}">
      <div class="msg-header">
        <span class="msg-role">${roleLabel}</span>
        ${modelBadge}
      </div>
      ${thinkingHtml}
      <div class="msg-content">${renderedContent}</div>
      ${timeStr}
    </div>
  `;
}

/**
 * Rendu du contenu d'un message en Markdown :
 * - Utilise marked (GFM, breaks) pour convertir le Markdown en HTML
 * - Purifie le HTML avec DOMPurify (supprime les images, ajoute target="_blank" aux liens)
 * - Retourne l'HTML sécurisé
 */
function renderContent(text) {
  if (!text) return '';
  const rawHtml = marked.parse(text);
  return DOMPurify.sanitize(rawHtml, { FORBID_TAGS: ['img'] });
}

// ===== Recherche =====

function handleSearch(event) {
  const query = event.target.value.toLowerCase().trim();

  if (!query) {
    state.filteredConversations = [...state.conversations];
  } else {
    state.filteredConversations = state.conversations.filter((conv) => {
      const title = (conv.title || '').toLowerCase();
      const messages = conv.messages || [];
      const inMessages = messages.some(
        (m) => (m.content || '').toLowerCase().includes(query)
      );
      return title.includes(query) || inMessages;
    });
  }

  displayConversations(state.filteredConversations);
}

// ===== Export Markdown =====

async function exportConversation(conv) {
  const markdown = conversationToMarkdown(conv);
  const filename = sanitizeFilename(conv.title, conv.id);
  if ('showSaveFilePicker' in window) {
    await saveFileWithPicker(filename, markdown);
  } else {
    downloadMarkdown(filename, markdown);
  }
}

/**
 * Enregistre le fichier via la boîte de dialogue native de choix de destination
 * (File System Access API, supportée par Chromium). En cas d'annulation, ne fait
 * rien ; en cas d'erreur, affiche la bannière d'erreur.
 */
async function saveFileWithPicker(filename, content) {
  let handle;
  try {
    handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
    });
  } catch (err) {
    if (err.name === 'AbortError') return;
    showError("Impossible d'ouvrir la boîte de dialogue : " + err.message);
    return;
  }

  try {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err) {
    showError("Erreur d'enregistrement : " + err.message);
  }
}

/**
 * Génère une représentation Markdown claire et lisible de la conversation :
 * titre et métadonnées, puis chaque message identifié par son rôle (utilisateur,
 * raisonnement, assistant, système), le modèle utilisé et une liste de liens.
 */
function conversationToMarkdown(conv) {
  const messages = conv.messages || [];
  const dateStr = conv.createdAt ? formatDate(conv.createdAt) : '';
  const updatedStr = conv.updatedAt ? formatDate(conv.updatedAt) : '';

  const metaParts = [];
  if (dateStr) metaParts.push(`Créée le ${dateStr}`);
  if (updatedStr) metaParts.push(`Modifiée le ${updatedStr}`);
  metaParts.push(`${messages.length} message${messages.length > 1 ? 's' : ''}`);

  const lines = [];
  lines.push(`# ${conv.title || 'Sans titre'}`);
  lines.push('');
  lines.push(`> ${metaParts.join(' · ')}`);
  lines.push('');

  if (messages.length === 0) {
    lines.push('_Cette conversation ne contient aucun message._');
  } else {
    messages.forEach((msg, index) => {
      const role = getRole(msg, index);
      const timeStr = msg.createdAt ? escapeHtml(formatDate(msg.createdAt)) : '';
      const model = msg.model ? escapeHtml(msg.model) : '';

      const headParts = [];
      if (timeStr) headParts.push(timeStr);
      if (role === 'assistant' && model) headParts.push(`modèle : ${model}`);
      const headSuffix = headParts.length ? ` · ${headParts.join(' · ')}` : '';

      if (index > 0) lines.push('---');
      lines.push('');

      if (role === 'user') {
        lines.push(`## 👤 Utilisateur${headSuffix}`);
      } else if (role === 'system') {
        lines.push(`## ⚙️ Système${headSuffix}`);
      } else {
        lines.push(`## 🤖 Assistant${headSuffix}`);
      }
      lines.push('');

      const rawContent = msg.content || '';

      if (role === 'assistant') {
        const { thinking, content } = splitThinking(rawContent);
        if (thinking) {
          lines.push('### 💭 Raisonnement');
          lines.push('');
          lines.push('> ' + thinking.replace(/\s*\n\s*/g, '\n> '));
          lines.push('');
        }
        lines.push(content.trim());
      } else if (role === 'system') {
        lines.push(`_${rawContent.trim()}_`);
      } else {
        lines.push(rawContent);
      }
      lines.push('');

      const links = extractLinks(rawContent);
      if (links.length > 0) {
        lines.push('### 🔗 Liens détectés');
        lines.push('');
        links.forEach((url) => lines.push(`- [${url}](${url})`));
        lines.push('');
      }
    });
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Extrait les URL présentes dans le contenu d'un message (liste unique et ordonnée).
 */
function extractLinks(text) {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s<>"'`]+/g;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map((url) => url.replace(/[.,;:!?)\]}]+$/, '')))];
}

/**
 * Transforme un titre en nom de fichier sûr (slug), avec repli sur l'identifiant
 * ou "sans-titre" si aucun titre valide n'est disponible.
 */
function sanitizeFilename(title, id) {
  let base = (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) base = id ? String(id).replace(/[^a-zA-Z0-9-_]+/g, '-') : 'sans-titre';
  return `${base.slice(0, 80) || 'conversation'}.md`;
}

/**
 * Télécharge un contenu Markdown en ouvrant le dialogue natif "Enregistrer sous".
 */
function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== Utilitaires =====

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractConversations,
    isValidConversation,
    getRole,
    splitThinking,
    renderContent,
    renderMessage,
    conversationToMarkdown,
    extractLinks,
    sanitizeFilename,
    escapeHtml,
    formatDate,
    showError,
    hideError,
    downloadMarkdown,
  };
}
