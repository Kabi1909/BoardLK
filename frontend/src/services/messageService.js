import api,{isMock} from './api';
import {collection,database} from './store';
export const messageService={async list(){return isMock?database.get().conversations:(await api.get('/conversations')).data;},async create(data){return isMock?collection('conversations').add(data):(await api.post('/conversations',data)).data;},async update(id,data){return isMock?collection('conversations').update(id,data):(await api.patch('/conversations/'+id,data)).data;},async remove(id){return isMock?collection('conversations').remove(id):api.delete('/conversations/'+id);}};

