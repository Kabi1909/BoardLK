import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, Share2, MessageCircle, Check, ArrowRight } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/store';
import { startConversation } from '../../services/actions';
import { money } from '../../utils/format';
import {
  Breadcrumbs,
  Avatar,
  RatingStars,
  StatusBadge,
  EmptyState,
} from '../../components/common/UI';
import ImageGallery from '../../components/property/ImageGallery';
import { FavoriteButton, PropertyGrid } from '../../components/property/PropertyCard';
import PropertyMap from '../../components/map/PropertyMap';
import BookingModal from '../../components/booking/BookingModal';
import { ReviewCard, ReviewForm } from '../../components/property/Reviews';
export default function PropertyDetails() {
  const { id } = useParams();
  const s = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [shared, setShared] = useState('');
  const p = s.properties.find((p) => p.id === id);
  useEffect(() => {
    if (!p) return;
    database.update((s) => ({
      ...s,
      properties: s.properties.map((x) => (x.id === id ? { ...x, views: x.views + 1 } : x)),
      recent: user
        ? {
            ...s.recent,
            [user.id]: [id, ...(s.recent[user.id] || []).filter((x) => x !== id)].slice(0, 8),
          }
        : s.recent,
    }));
  }, [id, user?.id]);
  if (!p || (p.status !== 'Published' && p.ownerId !== user?.id))
    return (
      <EmptyState
        title="Property unavailable"
        description="This listing may have been removed or unpublished."
        action={
          <Link className="btn" to="/properties">
            Explore available properties
          </Link>
        }
      />
    );
  const owner = s.users.find((u) => u.id === p.ownerId);
  const reviews = s.reviews.filter((r) => r.propertyId === id);
  const authorize = (fn) => {
    if (!user) navigate('/login', { state: { from: '/properties/' + id } });
    else if (user.role !== 'renter') navigate('/unauthorized');
    else fn();
  };
  return (
    <div className="container detail-page">
      <Breadcrumbs
        items={[
          { label: 'Find Boarding', to: '/properties' },
          { label: p.city, to: '/properties?q=' + p.city },
          { label: p.title },
        ]}
      />
      <div className="section-heading detail-title">
        <div>
          <StatusBadge
            status={
              p.spaces === 0
                ? 'Fully Occupied'
                : p.spaces === 1
                  ? 'Limited Availability'
                  : 'Available'
            }
          />
          <h1>{p.title}</h1>
          <p>
            <MapPin size={15} /> {p.address} <span>·</span> <RatingStars rating={p.rating} /> (
            {reviews.length} reviews)
          </p>
        </div>
        <div className="detail-actions">
          <FavoriteButton propertyId={id} />
          <button
            className="icon-button"
            aria-label="Share property"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setShared('Link copied!');
              } catch {
                setShared(window.location.href);
              }
            }}
          >
            <Share2 size={17} />
          </button>
          {shared && <small role="status">{shared}</small>}
        </div>
      </div>
      <ImageGallery images={p.images} title={p.title} />
      <div className="detail-layout">
        <div>
          <section className="detail-section">
            <h2>A place to make your own</h2>
            <div className="property-facts">
              {[
                ['Property', p.type],
                ['Room type', p.roomType],
                ['Rooms', p.rooms],
                ['Capacity', p.capacity],
                ['Available spaces', p.spaces],
                ['Preference', p.gender],
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p>{p.description}</p>
          </section>
          <section className="detail-section">
            <h2>Everything you need</h2>
            <div className="facility-grid">
              {p.facilities.map((f) => (
                <span key={f}>
                  <Check size={16} />
                  {f}
                </span>
              ))}
            </div>
          </section>
          <section className="detail-section">
            <h2>A few house rules</h2>
            <div className="property-facts">
              {[
                ['Smoking', p.smoking ? 'Allowed' : 'Not allowed'],
                ['Pets', p.pets ? 'Allowed' : 'Not allowed'],
                ['Visitors', p.visitors ? 'Allowed' : 'Not allowed'],
                ['Curfew', p.curfew || 'None'],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <p>{p.rules || 'Discuss house rules with the owner.'}</p>
          </section>
          <section className="detail-section">
            <h2>Get to know the neighbourhood</h2>
            <p>
              {p.address}, {p.district}
              <br />
              Near {p.nearby} · {p.landmark}
            </p>
            <div className="detail-map">
              <PropertyMap properties={[p]} focus />
            </div>
          </section>
          <section className="detail-section">
            <div className="section-heading">
              <h2>What renters say</h2>
              <RatingStars rating={p.rating} />
            </div>
            {reviews.length ? (
              reviews.map((r) => (
                <ReviewCard key={r.id} review={r} user={s.users.find((u) => u.id === r.renterId)} />
              ))
            ) : (
              <p>No reviews yet. Be the first to share your experience.</p>
            )}
            {user?.role === 'renter' && !reviews.some((r) => r.renterId === user.id) && (
              <ReviewForm property={p} />
            )}
          </section>
        </div>
        <aside>
          <div className="booking-card panel">
            <span className="eyebrow">YOUR NEXT HOME</span>
            <div className="detail-price">
              <strong>{money(p.rent)}</strong>
              <span> / month</span>
            </div>
            <div className="price-row">
              <span>Security deposit</span>
              <b>{money(p.deposit)}</b>
            </div>
            <div className="price-row">
              <span>Utility charges / month</span>
              <b>{money(p.utilities)}</b>
            </div>
            <div className="price-row">
              <span>Advance payment</span>
              <b>{p.advance} month(s)</b>
            </div>
            <div className="divider" />
            <button
              className="btn full-width"
              disabled={!p.spaces || p.status !== 'Published'}
              onClick={() => authorize(() => setBooking(true))}
            >
              Request booking <ArrowRight size={16} />
            </button>
            <button
              className="btn secondary full-width"
              onClick={() =>
                authorize(() =>
                  navigate('/renter/messages?conversation=' + startConversation(user, p)),
                )
              }
            >
              <MessageCircle size={16} />
              Contact owner
            </button>
            <p className="fine-print">You won’t be charged when sending a request.</p>
            <div className="divider" />
            <div className="person">
              <Avatar user={owner} />
              <div>
                <strong>{owner?.name || 'Property owner'}</strong>
                <small>Boarding owner · {p.city}</small>
              </div>
            </div>
            <p className="fine-print">Connect with the owner to arrange a viewing.</p>
          </div>
        </aside>
      </div>
      <section className="section">
        <div className="section-heading">
          <h2>You might also like</h2>
          <Link className="text-link" to={'/properties?q=' + p.city}>
            Explore {p.city} →
          </Link>
        </div>
        <PropertyGrid
          properties={s.properties
            .filter(
              (x) =>
                x.id !== id &&
                x.status === 'Published' &&
                (x.district === p.district || x.roomType === p.roomType),
            )
            .slice(0, 3)}
        />
      </section>
      {booking && <BookingModal property={p} onClose={() => setBooking(false)} />}
    </div>
  );
}
