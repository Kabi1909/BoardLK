import api from './api.js';
import { mutate, markConversationRead, sendRemoteMessage } from './remoteStore.js';
export const messageService = {
  list: async (params) => (await api.get('/conversations', { params })).data,
  create: (data) => mutate('post', '/conversations', data),
  messages: async (id, params) => (await api.get('/messages/' + id, { params })).data,
  send: sendRemoteMessage,
  markRead: markConversationRead,
};
