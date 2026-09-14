import { Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useFavorites } from '../../context/FavoritesContext';
import { PropertyGrid } from '../../components/property/PropertyCard';
import { EmptyState } from '../../components/common/UI';
export default function Favorites() {
  const { properties } = useStore();
  const { ids } = useFavorites();
  const saved = properties.filter((p) => ids.includes(p.id));
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">KEEP THE GOOD ONES CLOSE</span>
        <h1>Saved properties</h1>
        <p>{saved.length} places on your shortlist. Tap the heart to remove a place.</p>
      </div>
      {saved.length ? (
        <PropertyGrid properties={saved} />
      ) : (
        <EmptyState
          title="Your shortlist starts here"
          description="Save the places you love and compare them in one place."
          action={
            <Link className="btn" to="/properties">
              Explore properties
            </Link>
          }
        />
      )}
    </>
  );
}
