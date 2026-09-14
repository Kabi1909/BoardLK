export function filterProperties(properties, filters={}) {
const q=(filters.q||'').trim().toLowerCase();
let result=properties.filter(p=>p.status==='Published' &&
(!q||[p.title,p.city,p.district,p.nearby,p.address].join(' ').toLowerCase().includes(q)) &&
(!filters.min||p.rent>=Number(filters.min))&&(!filters.max||p.rent<=Number(filters.max))&&
['district','city','type','roomType','gender'].every(k=>!filters[k]||p[k]===filters[k])&&
(!filters.available||p.spaces>0)&&(!filters.rating||p.rating>=Number(filters.rating))&&
(!filters.facilities||filters.facilities.split(',').filter(Boolean).every(f=>p.facilities.includes(f))));
return result.sort((a,b)=>filters.sort==='price-asc'?a.rent-b.rent:filters.sort==='price-desc'?b.rent-a.rent:filters.sort==='rating'?b.rating-a.rating:filters.sort==='popular'?b.views-a.views:new Date(b.createdAt)-new Date(a.createdAt));
}
