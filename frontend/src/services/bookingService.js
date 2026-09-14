import api,{isMock} from './api';
import {collection,database} from './store';
export const bookingService={async list(){return isMock?database.get().bookings:(await api.get('/bookings')).data;},async create(data){return isMock?collection('bookings').add(data):(await api.post('/bookings',data)).data;},async update(id,data){return isMock?collection('bookings').update(id,data):(await api.patch('/bookings/'+id,data)).data;},async remove(id){return isMock?collection('bookings').remove(id):api.delete('/bookings/'+id);}};

