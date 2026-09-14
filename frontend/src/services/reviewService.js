import api,{isMock} from './api';
import {collection,database} from './store';
export const reviewService={async list(){return isMock?database.get().reviews:(await api.get('/reviews')).data;},async create(data){return isMock?collection('reviews').add(data):(await api.post('/reviews',data)).data;},async update(id,data){return isMock?collection('reviews').update(id,data):(await api.patch('/reviews/'+id,data)).data;},async remove(id){return isMock?collection('reviews').remove(id):api.delete('/reviews/'+id);}};

