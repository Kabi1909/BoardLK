import {useSyncExternalStore} from 'react';
import {database} from '../services/store';
export const useStore=()=>useSyncExternalStore(database.subscribe,database.get);

