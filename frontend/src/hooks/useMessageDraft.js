import { useState } from 'react';
import { clearSubmittedDraft } from '../utils/messages.js';

export function useMessageDraft(userId, conversationId) {
  const [state, setState] = useState({ userId, drafts: {} });
  const drafts = state.userId === userId ? state.drafts : {};
  const setText = (text) =>
    setState((current) => ({
      userId,
      drafts: { ...(current.userId === userId ? current.drafts : {}), [conversationId]: text },
    }));
  const clearSent = (id, submitted) =>
    setState((current) =>
      current.userId === userId
        ? { userId, drafts: clearSubmittedDraft(current.drafts, id, submitted) }
        : current,
    );
  return { text: drafts[conversationId] || '', setText, clearSent };
}
