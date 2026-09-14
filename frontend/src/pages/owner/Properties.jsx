import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Power, BedDouble, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { database, collection } from '../../services/store';
import { money, uid } from '../../utils/format';
import { StatusBadge, ConfirmDialog, EmptyState } from '../../components/common/UI';
export default function OwnerProperties() {
  const { user } = useAuth();
  const s = useStore();
  const [filter, setFilter] = useState('All');
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const own = s.properties.filter(
    (p) => p.ownerId === user.id && (filter === 'All' || p.status === filter),
  );
  function action(p, type) {
    setError('');
    try {
      if (type === 'delete') {
        database.update((s) => {
          if (s.bookings.some((b) => b.propertyId === p.id && b.status === 'Accepted'))
            throw new Error('This property has an accepted booking. Disable the listing instead.');
          return {
            ...s,
            properties: s.properties.filter((x) => x.id !== p.id),
            bookings: s.bookings.map((b) =>
              b.propertyId === p.id && b.status === 'Pending'
                ? { ...b, status: 'Cancelled', response: 'The owner removed this listing.' }
                : b,
            ),
            favorites: Object.fromEntries(
              Object.entries(s.favorites).map(([id, ids]) => [id, ids.filter((id) => id !== p.id)]),
            ),
            notifications: [
              ...s.bookings
                .filter((b) => b.propertyId === p.id && b.status === 'Pending')
                .map((b) => ({
                  id: uid(),
                  userId: b.renterId,
                  title: 'Property unavailable',
                  body: p.title + ' was removed by the owner.',
                  path: '/renter/bookings',
                  read: false,
                  createdAt: new Date().toISOString(),
                })),
              ...s.notifications,
            ],
          };
        });
      } else if (type === 'occupied') {
        collection('properties').update(p.id, { spaces: 0 });
      } else {
        collection('properties').update(p.id, {
          status: p.status === 'Published' ? 'Disabled' : 'Published',
        });
      }
      setConfirm(null);
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    }
  }
  return (
    <>
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">SPACES YOU SHARE</span>
          <h1>My properties</h1>
          <p>Keep your listings fresh and help your next renter find you.</p>
        </div>
        <Link className="btn" to="/owner/properties/new">
          <Plus size={16} />
          Add property
        </Link>
      </div>
      <div className="tabs">
        {['All', 'Published', 'Draft', 'Disabled'].map((t) => (
          <button className={filter === t ? 'active' : ''} onClick={() => setFilter(t)} key={t}>
            {t}
          </button>
        ))}
      </div>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <div className="owner-property-list">
        {own.map((p) => (
          <article className="owner-property panel" key={p.id}>
            <Link to={'/properties/' + p.id}>
              <img src={p.images[0]} alt={p.title} />
            </Link>
            <div className="owner-property-info">
              <div className="section-heading">
                <div>
                  <h3>{p.title}</h3>
                  <p className="location-line">
                    <MapPin size={13} />
                    {p.city}, {p.district}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <strong className="rent">
                {money(p.rent)}
                <small> / month</small>
              </strong>
              <div className="booking-facts">
                <span>
                  <BedDouble size={14} />
                  {p.spaces} spaces
                </span>
                <span>
                  <Eye size={14} />
                  {p.views} views
                </span>
                <span>{s.bookings.filter((b) => b.propertyId === p.id).length} requests</span>
              </div>
              <div className="property-management-actions">
                <Link className="btn small secondary" to={'/properties/' + p.id}>
                  <Eye size={13} />
                  View
                </Link>
                <Link className="btn small secondary" to={'/owner/properties/' + p.id + '/edit'}>
                  <Pencil size={13} />
                  Edit
                </Link>
                {p.status !== 'Draft' && (
                  <button className="btn small secondary" onClick={() => action(p, 'toggle')}>
                    <Power size={13} />
                    {p.status === 'Published' ? 'Disable' : 'Enable'}
                  </button>
                )}
                {p.spaces > 0 && (
                  <button
                    className="btn small secondary"
                    onClick={() => setConfirm({ p, type: 'occupied' })}
                  >
                    Mark fully occupied
                  </button>
                )}
                <button
                  className="icon-button delete-button"
                  aria-label={'Delete ' + p.title}
                  onClick={() => setConfirm({ p, type: 'delete' })}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!own.length && (
        <EmptyState
          title={
            filter === 'All'
              ? 'Make room for someone’s next chapter'
              : 'No ' + filter.toLowerCase() + ' properties'
          }
          description="Create a listing with photos, room details and the things that make your space special."
          action={
            <Link className="btn" to="/owner/properties/new">
              Add your first property
            </Link>
          }
        />
      )}{' '}
      {confirm && (
        <ConfirmDialog
          title={confirm.type === 'delete' ? 'Delete this property?' : 'Mark as fully occupied?'}
          description={
            confirm.type === 'delete'
              ? 'This removes the listing and cancels its pending requests. Accepted bookings must be resolved first.'
              : 'Available spaces will be set to zero. You can change availability in Edit property.'
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => action(confirm.p, confirm.type)}
        />
      )}
    </>
  );
}
