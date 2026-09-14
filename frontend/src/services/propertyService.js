import api,{isMock} from './api';
import {collection,database} from './store';
export const propertyService={async list(){return isMock?database.get().properties:(await api.get('/properties')).data;},async create(data){return isMock?collection('properties').add(data):(await api.post('/properties',data)).data;},async update(id,data){return isMock?collection('properties').update(id,data):(await api.patch('/properties/'+id,data)).data;},async remove(id){return isMock?collection('properties').remove(id):api.delete('/properties/'+id);}};

