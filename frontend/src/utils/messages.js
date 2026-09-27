export function appendDeliveredMessage(conversation, message) {
  const messages = [...conversation.messages.filter((item) => item.id !== message.id), message];
  messages.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id),
  );
  return { ...conversation, messages, lastMessage: message.text, lastMessageAt: message.createdAt };
}

export function clearSubmittedDraft(drafts, conversationId, submitted) {
  if (drafts[conversationId] !== submitted) return drafts;
  const next = { ...drafts };
  delete next[conversationId];
  return next;
}
