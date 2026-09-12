const validConv = { id: 'conv1', title: 'Bonjour', messages: [{ role: 'user', content: 'Salut' }] };
const validConvWithUnderscoreId = { _id: 'abc', title: 'Test', messages: [] };
const invalidConvNull = null;
const invalidConvNoId = { title: 'Pas d id' };
const invalidConvNoTitleNoMessages = { id: 'x' };

const mammouthExport = [
  {
    type: 'customMammoth',
    chats: [
      { id: 'm1', title: 'Chat 1', messages: [{ content: 'Hello' }] },
      { id: 'm2', title: 'Chat 2', messages: [{ content: 'Hi' }] },
    ],
  },
];

const chatsObject = {
  chats: [
    { id: 'c1', title: 'Direct chats', messages: [] },
  ],
};

const conversationsObject = {
  conversations: [
    { id: 'r1', title: 'From conversations key', messages: [] },
  ],
};

const documentWrapper = {
  document: {
    conversations: [
      { id: 'd1', title: 'Wrapped', messages: [] },
    ],
  },
};

const toolResultData = { tool_result: 'some result', iteration_start: 'start' };

function makeAssistantMessage(overrides = {}) {
  return {
    role: 'assistant',
    content: 'Voici ma réponse.',
    model: 'claude-sonnet-4-20250514',
    createdAt: '2026-07-26T10:00:00Z',
    ...overrides,
  };
}

function makeUserMessage(overrides = {}) {
  return {
    role: 'user',
    content: 'Quelle est la capitale de la France ?',
    createdAt: '2026-07-26T09:59:00Z',
    ...overrides,
  };
}

function makeSystemMessage(overrides = {}) {
  return {
    role: 'system',
    content: 'Tu es un assistant utile.',
    model: 'system',
    ...overrides,
  };
}

module.exports = {
  validConv,
  validConvWithUnderscoreId,
  invalidConvNull,
  invalidConvNoId,
  invalidConvNoTitleNoMessages,
  mammouthExport,
  chatsObject,
  conversationsObject,
  documentWrapper,
  toolResultData,
  makeAssistantMessage,
  makeUserMessage,
  makeSystemMessage,
};