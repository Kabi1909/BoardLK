import SafeImage from '../common/SafeImage.jsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Heart, Wifi, BedDouble, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { money } from '../../utils/format';
import { RatingStars, StatusBadge, EmptyState } from '../common/UI';
export function FavoriteButton({ propertyId }) {
  const { user } = useAuth();
  const { toggle, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = isFavorite(propertyId);
  return (
    <button
      className={'favorite-button ' + (saved ? 'saved' : '')}
      aria-label={saved ? 'Remove favorite' : 'Save favorite'}
      aria-pressed={saved}
      onClick={() => {
        if (!user) navigate('/login', { state: { from: location.pathname } });
        else if (user.role === 'renter') toggle(propertyId);
        else navigate('/unauthorized');
      }}
    >
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
export default function PropertyCard({ property }) {
  const p = property;
  return (
    <article className="property-card card">
      <div className="property-cover">
        <Link to={'/properties/' + p.id}>
          <SafeImage src={p.images[0]} alt={p.title} loading="lazy" />
        </Link>
        <StatusBadge
          status={
            p.spaces === 0
              ? 'Fully Occupied'
              : p.spaces === 1
                ? 'Limited Availability'
                : 'Available'
          }
        />
        <FavoriteButton propertyId={p.id} />
        <span className="cover-type">{p.type}</span>
      </div>
      <div className="property-content">
        <div className="property-meta">
          <span>
            {p.roomType} room · {p.gender}
          </span>
          <RatingStars rating={p.rating} />
        </div>
        <Link to={'/properties/' + p.id}>
          <h3>{p.title}</h3>
        </Link>
        <p className="location-line">
          <MapPin size={13} />
          {p.city}, {p.district}
        </p>
        <div className="facility-line">
          <span>
            <Wifi size={13} />
            {p.facilities.includes('Wi-Fi') ? 'Wi-Fi' : 'No Wi-Fi'}
          </span>
          <span>
            <BedDouble size={13} />
            {p.spaces} spaces
          </span>
          <span>
            <ShieldCheck size={13} />
            Security
          </span>
        </div>
        <div className="property-bottom">
          <div>
            <strong>{money(p.rent)}</strong>
            <small> / month</small>
          </div>
          <Link
            className="card-detail"
            to={'/properties/' + p.id}
            aria-label={'View details for ' + p.title}
          >
            View details <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function PropertyGrid({ properties }) {
  return properties.length ? (
    <div className="grid-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No boarding places found"
      description="Try another location or adjust your filters."
    />
  );
}
