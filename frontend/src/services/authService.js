import api from './api.js';
import { userFromApi } from './adapters.js';
import { saveSession, getSession, SESSION_KEY } from './session.js';
const sessionFromResponse = ({ data }) => ({ ...data, user: userFromApi(data.user) });
export const authService = {
  async login({ email, password }) {
    return sessionFromResponse((await api.post('/auth/login', { email, password })).data);
  },
  async register({ name, email, phone, password, confirm, role }) {
    return sessionFromResponse(
      (
        await api.post('/auth/register', {
          name,
          email,
          phone: phone.replace(/\s/g, ''),
          password,
          confirmPassword: confirm,
          role,
        })
      ).data,
    );
  },
  async changePassword(id, current, password) {
    const result = sessionFromResponse(
      (
        await api.put('/auth/change-password', {
          currentPassword: current,
          newPassword: password,
          confirmPassword: password,
        })
      ).data,
    );
    saveSession(
      { ...result, user: { ...getSession().user, ...result.user } },
      !!localStorage.getItem(SESSION_KEY),
    );
  },
  async forgot(email) {
    await api.post('/auth/forgot-password', { email });
  },
  async reset(token, password) {
    await api.post('/auth/reset-password/' + token, { password, confirmPassword: password });
  },
};
