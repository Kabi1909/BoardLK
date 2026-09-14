export const emailValid=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||'');
export const phoneValid=s=>/^(?:\+94|0)[0-9]{9}$/.test((s||'').replace(/[\s-]/g,''));
export const passwordValid=s=>s.length>=8&&/[A-Z]/.test(s)&&/[a-z]/.test(s)&&/[0-9]/.test(s);
export function validateProperty(p,step) {
const e={}; const required=(k,min=1)=>{if(String(p[k]??'').trim().length<min)e[k]='Please enter at least '+min+' characters.';};
if(step===0){required('title',5);required('description',30);required('type');}
if(step===1){['district','city','address'].forEach(k=>required(k));if(!Number.isFinite(Number(p.lat))||Number(p.lat)<5||Number(p.lat)>10)e.lat='Enter a Sri Lankan latitude (5–10).';if(!Number.isFinite(Number(p.lng))||Number(p.lng)<79||Number(p.lng)>82)e.lng='Enter a Sri Lankan longitude (79–82).';}
if(step===2){['roomType','gender'].forEach(k=>required(k));['rooms','capacity'].forEach(k=>{if(!Number.isInteger(Number(p[k]))||p[k]<1)e[k]='Enter a positive whole number.';});if(!Number.isInteger(Number(p.spaces))||p.spaces<0||Number(p.spaces)>Number(p.capacity))e.spaces='Spaces must be between 0 and capacity.';}
if(step===3){if(!(Number(p.rent)>0))e.rent='Enter a monthly rent greater than zero.';['deposit','utilities','advance'].forEach(k=>{if(!Number.isFinite(Number(p[k]))||Number(p[k])<0)e[k]='Enter zero or a positive amount.';});}
if(step===6&&!p.images.length)e.images='Add at least one property photo.';
return e;
}
