export const SESSION_KEY = 'boardlk-auth';

export function getSession() {
  try {
    const value = JSON.parse(
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null',
    );
    if (!value?.token || !value.user?.id || !['renter', 'owner'].includes(value.user.role))
      return null;
    return value;
  } catch {
    return null;
  }
}

export function saveSession(session, remember) {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  // Write first: a storage failure must not erase an existing valid session.
  target.setItem(SESSION_KEY, JSON.stringify(session));
  other.removeItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
