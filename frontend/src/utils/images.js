export async function readImage(file) {
if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP image.');
if(file.size>5*1024*1024)throw new Error('Each image must be under 5 MB.');
const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read this image.'));reader.readAsDataURL(file);});
const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Unable to open this image.'));i.src=source;});
const canvas=document.createElement('canvas');const scale=Math.min(1,1000/img.width);canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.72);
}
