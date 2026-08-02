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
const fileInput = document.getElementById('file-input');
const fileButton = document.getElementById('file-button');
const fileNameLabel = document.getElementById('file-name');
const conversationsList = document.getElementById('conversations-list');
const conversationContent = document.getElementById('conversation-content');
const conversationCount = document.getElementById('conversation-count');
const searchInput = document.getElementById('search-input');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');

// ===== Événements =====
fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
searchInput.addEventListener('input', handleSearch);

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

    item.innerHTML = `
      <div class="item-title">${escapeHtml(conv.title || 'Sans titre')}</div>
      <div class="item-meta">
        ${dateStr ? `<span class="item-date">📅 ${dateStr}</span>` : ''}
        <span class="item-msg-count">${msgCount} msg</span>
      </div>
    `;

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
  const model = (msg.model || '').toLowerCase();
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
 * Rendu du contenu d'un message :
 * - Échappe le HTML pour la sécurité
 * - Détecte et formate les blocs de code
 * - Détecte et formate le code inline
 * - Préserve les retours à la ligne
 */
function renderContent(text) {
  let escaped = escapeHtml(text);

  // Blocs de code
  const codeFence = '```';
  const codeRegex = new RegExp(codeFence + '(\\w*)\\n?([\\s\\S]*?)' + codeFence, 'g');
  escaped = escaped.replace(codeRegex, (match, lang, code) => {
    return '<pre><code>' + code.trim() + '</code></pre>';
  });

  // Code inline
  escaped = escaped.replace(/`([^`\n]+)`/g, (match, code) => '<code>' + code + '</code>');

  return escaped;
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
