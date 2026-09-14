import * as seed from '../data/mockData';
const key='boardlk-data-v1';
const initial=()=>({properties:seed.properties,users:[...seed.owners,...seed.renters],bookings:seed.bookings,reviews:seed.reviews,conversations:seed.conversations,notifications:seed.notifications,favorites:{},recent:{}});
let state;
try { state=JSON.parse(localStorage.getItem(key))||initial(); } catch { state=initial(); }
const listeners=new Set();
export const database={get:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},update:fn=>{const next=fn(state);try{localStorage.setItem(key,JSON.stringify(next));}catch{throw new Error('Browser storage is full. Remove some uploaded photos and try again.');}state=next;listeners.forEach(fn=>fn());return next;}};
export const collection=name=>({list:()=>database.get()[name],add:item=>database.update(s=>({...s,[name]:[item,...s[name]]})),update:(id,patch)=>database.update(s=>({...s,[name]:s[name].map(x=>x.id===id?{...x,...patch}:x)})),remove:id=>database.update(s=>({...s,[name]:s[name].filter(x=>x.id!==id)}))});
