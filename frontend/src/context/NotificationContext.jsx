import {createContext,useContext} from 'react';
import {useAuth} from './AuthContext';
import {useStore} from '../hooks/useStore';
import {database} from '../services/store';
const Context=createContext();
export function NotificationProvider({children}){const {user}=useAuth();const s=useStore();const notifications=s.notifications.filter(n=>n.userId===user?.id);const markRead=id=>database.update(s=>({...s,notifications:s.notifications.map(n=>n.userId===user?.id&&(!id||n.id===id)?{...n,read:true}:n)}));return <Context.Provider value={{notifications,unread:notifications.filter(n=>!n.read).length,markRead,markAllRead:()=>markRead()}}>{children}</Context.Provider>;}
export const useNotifications=()=>useContext(Context);
