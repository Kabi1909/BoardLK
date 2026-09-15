import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useStore } from '../hooks/useStore';
import { favoriteService } from '../services/favoriteService';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const state = useStore();
  const ids = state.favorites[user?.id] || [];

  async function toggle(propertyId) {
    if (user?.role !== 'renter') return;
    if (ids.includes(propertyId)) await favoriteService.remove(propertyId, user.id);
    else await favoriteService.create({ userId: user.id, propertyId });
  }

  return (
    <FavoritesContext.Provider value={{ ids, toggle, isFavorite: (id) => ids.includes(id) }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
