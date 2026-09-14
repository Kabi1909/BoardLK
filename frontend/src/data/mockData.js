export const photos = [
'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'];
const ownerNames=['Nimal Perera','Kavitha Selvarajah','Dilani Fernando','Ruwan Jayasinghe','Fathima Rizna'];
const renterNames=['Kavindu Silva','Nethmi Perera','Arun Thiruchelvam','Amaya Fernando','Tharindu Kumara','Sajini Herath','Mohamed Azeem','Pavithra Rajan','Dinuka Bandara','Hiruni Wijesinghe'];
export const owners=ownerNames.map((name,i)=>({id:'o'+(i+1),name,email:i?'owner'+(i+1)+'@boardlk.demo':'owner@boardlk.demo',phone:'077123456'+i,role:'owner',joined:'2025-01-10'}));
export const renters=renterNames.map((name,i)=>({id:'r'+(i+1),name,email:i?'renter'+(i+1)+'@boardlk.demo':'renter@boardlk.demo',phone:'076123456'+i,role:'renter'}));
const places=[
['Colombo','Colombo',6.9271,79.8612,'University of Colombo'],
['Kandy','Kandy',7.2906,80.6337,'University of Peradeniya'],
['Vavuniya','Vavuniya',8.7542,80.4982,'University of Vavuniya'],
['Jaffna','Jaffna',9.6615,80.0255,'University of Jaffna'],
['Galle','Galle',6.0535,80.221,'Galle Teaching Hospital'],
['Kurunegala','Kurunegala',7.4863,80.3647,'Wayamba University'],
['Gampaha','Gampaha',7.084,79.999,'Gampaha Hospital'],
['Nugegoda','Colombo',6.8649,79.8997,'University of Sri Jayewardenepura'],
['Maharagama','Colombo',6.848,79.926,'Apeksha Hospital'],
['Dehiwala','Colombo',6.851,79.865,'Dehiwala Business Centre'],
['Batticaloa','Batticaloa',7.717,81.7,'Eastern University']];
const titles=['The Palm Residence','Hanthana Hillside Rooms','Maple Student Residence','Nallur Garden House','Southern Coast Living','Greenway Boarding','The Courtyard','Urban Nest','Serene Student Annex','Seabreeze Rooms','Lagoon View Hostel'];
export const properties=Array.from({length:24},(_,i)=>{
const [city,district,lat,lng,nearby]=places[i%places.length];
return {id:'p'+(i+1),ownerId:owners[i%5].id,title:titles[i%11]+(i>10?' • '+(i%3+1):''),city,district,lat:lat+(i>10?.008:0),lng,address:(12+i)+' Temple Road, '+city,nearby,landmark:'Near the main bus stop',rent:[18000,16500,14500,12000,25000,18500,22000,35000][i%8],type:['Boarding House','Room','Annex','Apartment','Hostel','Shared House'][i%6],roomType:i%11===2?'Single':['Single','Shared','Double','Triple','Dormitory'][i%5],gender:['Any','Female Only','Male Only'][i%3],rooms:4,capacity:8,spaces:i%9===8?0:i%4+1,deposit:20000,utilities:1500,advance:1,facilities:['Wi-Fi','Bed','Study Table','Security',...(i%2?['Kitchen','Furnished','Parking']:['Attached Bathroom','Meals Available','Fan']),...(i%4===0?['Air Conditioning']:[])],images:[photos[i%5],photos[(i+1)%5],photos[(i+2)%5]],status:'Published',rating:4.3+(i%7)/10,views:120+i*37,createdAt:new Date(2026,7,1+i).toISOString(),description:'A bright, comfortable place to feel at home in '+city+'. Enjoy a peaceful neighbourhood with convenient public transport, local shops and easy access to '+nearby+'. Thoughtfully furnished spaces are ideal for students and working professionals. Contact the owner to arrange a visit and discuss your requirements.',smoking:false,pets:false,visitors:true,curfew:'10:00 PM',rules:'Keep shared spaces tidy. Please respect quiet hours after 10 PM.'};});
export const bookings=Array.from({length:12},(_,i)=>({id:'b'+i,propertyId:properties[i].id,renterId:renters[i%10].id,ownerId:properties[i].ownerId,moveIn:'2026-10-'+String(10+i).padStart(2,'0'),occupants:1,duration:'6 months',message:'Hello! I am looking for a quiet place close to my university. May I arrange a visit?',createdAt:'2026-09-10T08:00:00Z',status:['Pending','Accepted','Pending','Rejected','Cancelled','Completed'][i%6],response:i%6===1?'You are welcome to visit this weekend.':''}));
export const reviews=Array.from({length:24},(_,i)=>({id:'v'+i,propertyId:properties[i%24].id,renterId:renters[i%10].id,rating:i%3===0?4:5,comment:['Comfortable rooms and a very helpful owner. Easy to get to campus.','A peaceful neighbourhood with everything I need nearby.','Good value for money. The shared spaces are kept clean.'][i%3],createdAt:'2026-08-20T10:00:00Z',reply:i%3===0?'Thank you! We are happy you enjoyed your stay.':''}));
export const conversations=Array.from({length:8},(_,i)=>({id:'c'+i,propertyId:properties[i].id,ownerId:properties[i].ownerId,renterId:renters[i%4].id,messages:[{id:'m'+i,senderId:renters[i%4].id,text:'Hello, is this room still available?',createdAt:'2026-09-13T09:00:00Z'},{id:'n'+i,senderId:properties[i].ownerId,text:'Hi! Yes, it is. You are welcome to arrange a visit.',createdAt:'2026-09-13T09:05:00Z'}],readBy:[]}));
export const notifications=Array.from({length:24},(_,i)=>({id:'n'+i,userId:i%2?owners[Math.floor(i/2)%5].id:renters[Math.floor(i/2)%10].id,title:i%2?'New booking request':'Booking status updated',body:i%2?'A renter is interested in your property.':'Open your bookings to see the latest response.',path:i%2?'/owner/bookings':'/renter/bookings',read:false,createdAt:'2026-09-13T09:00:00Z'}));
