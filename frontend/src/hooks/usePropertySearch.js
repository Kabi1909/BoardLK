import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { facilityNames, propertyFromApi } from '../services/adapters.js';
export function searchParams(filters, limit = 9) {
  const params = {
    page: filters.page || 1,
    limit,
    sort: (filters.sort || 'latest').replace('-', '_'),
  };
  const fields = {
    q: 'search',
    min: 'minRent',
    max: 'maxRent',
    type: 'propertyType',
    gender: 'genderPreference',
    rating: 'minRating',
    available: 'availableNow',
    district: 'district',
    city: 'city',
    roomType: 'roomType',
  };
  for (const [from, to] of Object.entries(fields)) if (filters[from]) params[to] = filters[from];
  for (const label of (filters.facilities || '').split(',')) {
    const entry = Object.entries(facilityNames).find(([, value]) => value === label);
    if (entry) params[entry[0]] = 'true';
  }
  return params;
}
export function usePropertySearch(filters, { map = false } = {}) {
  const [state, setState] = useState({ items: [], total: 0, pages: 0, loading: true, error: '' });
  const [retry, setRetry] = useState(0),
    key = JSON.stringify(filters);
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    const timer = setTimeout(() => {
      api
        .get(map ? '/properties/map' : '/properties', {
          params: searchParams({ ...JSON.parse(key), ...(map ? { page: 1 } : {}) }, map ? 100 : 9),
          signal: controller.signal,
        })
        .then(async ({ data }) => {
          const items = [...data.data];
          if (map) {
            for (let page = 2; page <= data.pagination.totalPages; page++) {
              const next = await api.get('/properties/map', {
                params: searchParams({ ...JSON.parse(key), page }, 100),
                signal: controller.signal,
              });
              items.push(...next.data.data);
            }
          }
          if (controller.signal.aborted) return;
          setState({
            items: items.map(propertyFromApi),
            total: data.pagination.totalItems,
            pages: data.pagination.totalPages,
            loading: false,
            error: '',
          });
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setState((s) => ({ ...s, loading: false, error: error.message }));
        });
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, map, retry]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
