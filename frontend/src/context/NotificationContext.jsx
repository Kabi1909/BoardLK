import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useStore } from '../hooks/useStore';
import { mutate } from '../services/remoteStore';
const Context = createContext();
export function NotificationProvider({ children }) {
  const { user } = useAuth(),
    s = useStore();
  const notifications = s.notifications.filter((n) => n.userId === user?.id);
  const markRead = (id) =>
    mutate('patch', id ? '/notifications/' + id + '/read' : '/notifications/read-all').catch(
      (error) =>
        window.dispatchEvent(new CustomEvent('boardlk-api-error', { detail: error.message })),
    );
  return (
    <Context.Provider
      value={{
        notifications,
        unread: notifications.filter((n) => !n.read).length,
        markRead,
        markAllRead: () => markRead(),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useNotifications = () => useContext(Context);
