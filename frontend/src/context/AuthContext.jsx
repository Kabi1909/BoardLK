import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, saveSession, clearSession, SESSION_KEY } from '../services/session.js';
import { authService } from '../services/authService.js';
import api from '../services/api.js';
import { profileFromApi, userFromApi } from '../services/adapters.js';
import { refreshRemote } from '../services/remoteStore.js';
import { database } from '../services/store.js';
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession);
  useEffect(() => {
    const expired = () => {
      clearSession();
      database.clear();
      setSession(null);
    };
    window.addEventListener('boardlk-session-expired', expired);
    return () => window.removeEventListener('boardlk-session-expired', expired);
  }, []);
  useEffect(() => {
    if (!getSession()) return;
    let active = true;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (active)
          setSession((current) =>
            current
              ? { ...current, user: { ...current.user, ...userFromApi(data.data.user) } }
              : null,
          );
      })
      .catch((error) => {
        if (active && error.status === 401) {
          clearSession();
          database.clear();
          setSession(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  function persist(next, remember) {
    if (next.user.id !== getSession()?.user.id) database.clear();
    saveSession(next, remember);
    setSession(next);
    return next;
  }
  async function login(form) {
    return persist(await authService.login(form), form.remember);
  }
  async function register(form) {
    return persist(await authService.register(form), false);
  }
  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* Local sign-out still works when the server is unreachable. */
    }
    clearSession();
    database.clear();
    setSession(null);
  }
  async function updateUser(patch) {
    const common = { name: patch.name, email: patch.email, phone: patch.phone.replace(/\s/g, '') };
    const extra =
      session.user.role === 'owner'
        ? { nic: patch.nic, address: patch.address }
        : {
            gender: patch.gender,
            dateOfBirth: patch.dob || undefined,
            universityOrWorkplace: patch.workplace,
            preferredDistrict: patch.preferredDistrict,
            preferredCity: patch.preferredCity,
            monthlyBudget: Number(patch.budget || 0),
            preferredRoomType: patch.preferredRoomType,
            bio: patch.bio,
          };
    await api.put('/' + session.user.role + '/profile', { ...common, ...extra });
    if (patch.photo?.startsWith('data:')) {
      const blob = await (await fetch(patch.photo)).blob(),
        form = new FormData();
      form.append(
        'image',
        blob,
        'profile.' +
          (blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'),
      );
      await api.post('/' + session.user.role + '/profile/photo', form);
    }
    const profile = profileFromApi((await api.get('/' + session.user.role + '/profile')).data.data);
    persist({ ...getSession(), user: profile }, !!localStorage.getItem(SESSION_KEY));
    await refreshRemote();
  }
  return (
    <AuthContext.Provider value={{ user: session?.user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
