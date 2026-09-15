import { createContext, useContext, useState } from 'react';
import { getSession, saveSession, clearSession, SESSION_KEY } from '../services/session';
import { authService } from '../services/authService';
import { collection } from '../services/store';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession);

  function persist(nextSession, remember) {
    saveSession(nextSession, remember);
    setSession(nextSession);
    return nextSession;
  }

  async function login(form) {
    return persist(await authService.login(form), form.remember);
  }

  async function register(form) {
    return persist(await authService.register(form), false);
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  function updateUser(patch) {
    const { id, role, passwordHash, ...profile } = patch;
    collection('users').update(session.user.id, profile);
    persist(
      { ...session, user: { ...session.user, ...profile } },
      !!localStorage.getItem(SESSION_KEY),
    );
  }

  return (
    <AuthContext.Provider value={{ user: session?.user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
