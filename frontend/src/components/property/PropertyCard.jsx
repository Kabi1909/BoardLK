import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Heart, Wifi, BedDouble, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useStore } from '../../hooks/useStore';
import { money } from '../../utils/format';
import { RatingStars, StatusBadge, EmptyState, Modal } from '../common/UI';
import SafeImage from '../common/SafeImage';

export function FavoriteButton({ propertyId }) {
  const { user } = useAuth();
  const { toggle, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saved = isFavorite(propertyId);

  async function handleFavorite() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (user.role !== 'renter') {
      navigate('/unauthorized');
      return;
    }
    setBusy(true);
    try {
      await toggle(propertyId);
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={'favorite-button ' + (saved ? 'saved' : '')}
        aria-label={saved ? 'Remove favorite' : 'Save favorite'}
        aria-pressed={saved}
        disabled={busy}
        onClick={handleFavorite}
      >
        <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
      </button>
      {error && (
        <Modal title="Could not update favorites" onClose={() => setError('')}>
          <p role="alert">{error}</p>
          <button className="btn" onClick={handleFavorite} disabled={busy}>
            Retry
          </button>
        </Modal>
      )}
    </>
  );
}

export default function PropertyCard({ property }) {
  const { reviews } = useStore();
  const reviewCount = reviews.filter((review) => review.propertyId === property.id).length;
  const status =
    property.status !== 'Published'
      ? property.status
      : property.spaces === 0
        ? 'Fully Occupied'
        : property.spaces === 1
          ? 'Limited Availability'
          : 'Available';

  return (
    <article className="property-card card">
      <div className="property-cover">
        <Link to={'/properties/' + property.id}>
          <SafeImage src={property.images[0]} alt={property.title} loading="lazy" />
        </Link>
        <StatusBadge status={status} />
        <FavoriteButton propertyId={property.id} />
        <span className="cover-type">{property.type}</span>
      </div>
      <div className="property-content">
        <div className="property-meta">
          <span>
            {property.roomType} room · {property.gender}
          </span>
          <span>
            <RatingStars rating={property.rating} />{' '}
            <span aria-label={reviewCount + ' reviews'}>({reviewCount})</span>
          </span>
        </div>
        <Link to={'/properties/' + property.id}>
          <h3>{property.title}</h3>
        </Link>
        <p className="location-line">
          <MapPin size={13} />
          {property.city}, {property.district}
        </p>
        <div className="facility-line">
          {property.facilities.includes('Wi-Fi') && (
            <span>
              <Wifi size={13} />
              Wi-Fi
            </span>
          )}
          <span>
            <BedDouble size={13} />
            {property.spaces} {property.spaces === 1 ? 'space' : 'spaces'}
          </span>
          {property.facilities.includes('Security') && (
            <span>
              <ShieldCheck size={13} />
              Security
            </span>
          )}
        </div>
        <div className="property-bottom">
          <div>
            <strong>{money(property.rent)}</strong>
            <small> / month</small>
          </div>
          <Link
            className="card-detail"
            to={'/properties/' + property.id}
            aria-label={'View details for ' + property.title}
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
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No boarding places found"
      description="Try another location or adjust your filters."
    />
  );
}
