import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Map, SlidersHorizontal, X } from 'lucide-react';
import { usePropertySearch } from '../../hooks/usePropertySearch';

import SearchBar from '../../components/property/SearchBar';
import FilterSidebar, { SortDropdown } from '../../components/property/FilterSidebar';
import { PropertyGrid } from '../../components/property/PropertyCard';
import {
  Pagination,
  Breadcrumbs,
  Modal,
  LoadingSpinner,
  EmptyState,
} from '../../components/common/UI';
export default function Properties() {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(params);
  const [drawer, setDrawer] = useState(false);
  const search = usePropertySearch(filters);
  const result = search.items;
  const pages = search.pages;
  const page = Math.min(Math.max(1, Number(filters.page) || 1), pages || 1);
  const change = (f) =>
    setParams(Object.fromEntries(Object.entries({ ...f, page: '1' }).filter(([, v]) => v)));
  const reset = () => setParams({});
  return (
    <div className="muted-bg browse-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Find Boarding' }]} />
        <div className="page-heading">
          <span className="eyebrow">FIND A PLACE THAT FEELS LIKE YOU</span>
          <h1>Find your next home</h1>
          <p>Thoughtful spaces. Familiar neighbourhoods. A fresh start.</p>
        </div>
        <SearchBar key={params.toString()} initial={filters} compact />
        <div className="browse-layout">
          <div className="filter-desktop">
            <FilterSidebar filters={filters} onChange={change} onReset={reset} />
          </div>
          <div className="results">
            <div className="results-toolbar">
              <div>
                <h3>{search.total} boarding places</h3>
                <p>
                  {filters.q
                    ? 'Results for “' + filters.q + '”'
                    : 'Places to call home across Sri Lanka'}
                </p>
              </div>
              <div className="toolbar-actions">
                <button
                  className="btn secondary small filter-toggle"
                  onClick={() => setDrawer(true)}
                >
                  <SlidersHorizontal size={15} /> Filters
                </button>
                <Link
                  className="icon-button"
                  to={'/map?' + params}
                  aria-label="View results on map"
                >
                  <Map size={18} />
                </Link>
                <SortDropdown
                  value={filters.sort}
                  onChange={(sort) => change({ ...filters, sort })}
                />
              </div>
            </div>
            {Object.entries(filters).filter(([k, v]) => v && !['page', 'sort', 'q'].includes(k))
              .length > 0 && (
              <div className="filter-chips">
                {Object.entries(filters)
                  .filter(([k, v]) => v && !['page', 'sort', 'q'].includes(k))
                  .map(([k, v]) => (
                    <button key={k} onClick={() => change({ ...filters, [k]: '' })}>
                      {k}: {v}
                      <X size={11} />
                    </button>
                  ))}
                <button onClick={reset}>Clear all</button>
              </div>
            )}
            {search.loading ? (
              <LoadingSpinner />
            ) : search.error ? (
              <EmptyState
                title="Search unavailable"
                description={search.error}
                action={
                  <button className="btn" onClick={search.retry}>
                    Retry
                  </button>
                }
              />
            ) : (
              <PropertyGrid properties={result} />
            )}
            <Pagination
              page={page}
              pages={pages}
              onChange={(p) => {
                setParams({ ...filters, page: String(p) });
                window.scrollTo({ top: 250, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
        {drawer && (
          <Modal title="Refine your search" onClose={() => setDrawer(false)}>
            <FilterSidebar
              filters={filters}
              onChange={change}
              onReset={reset}
              onClose={() => setDrawer(false)}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
