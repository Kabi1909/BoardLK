import {createContext,useContext,useState} from 'react';
import {getSession} from '../services/api';
import {authService} from '../services/authService';
import {collection} from '../services/store';
const Context=createContext();
export function AuthProvider({children}){const [session,setSession]=useState(getSession);const persist=(s,remember)=>{localStorage.removeItem('boardlk-auth');sessionStorage.removeItem('boardlk-auth');(remember?localStorage:sessionStorage).setItem('boardlk-auth',JSON.stringify(s));setSession(s);};return <Context.Provider value={{user:session?.user,login:async(f)=>persist(await authService.login(f),f.remember),register:async(f)=>persist(await authService.register(f),false),logout:()=>{localStorage.removeItem('boardlk-auth');sessionStorage.removeItem('boardlk-auth');setSession(null);},updateUser:patch=>{collection('users').update(session.user.id,patch);persist({...session,user:{...session.user,...patch}},!!localStorage.getItem('boardlk-auth'));}}}>{children}</Context.Provider>;}
export const useAuth=()=>useContext(Context);
