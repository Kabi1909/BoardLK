import {createContext,useContext} from 'react';
import {useAuth} from './AuthContext';
import {useStore} from '../hooks/useStore';
import {database} from '../services/store';
const Context=createContext();
export function FavoritesProvider({children}){const {user}=useAuth();const s=useStore();const ids=s.favorites[user?.id]||[];const toggle=id=>{if(!user)return;database.update(s=>({...s,favorites:{...s.favorites,[user.id]:ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]}}));};return <Context.Provider value={{ids,toggle,isFavorite:id=>ids.includes(id)}}>{children}</Context.Provider>;}
export const useFavorites=()=>useContext(Context);
