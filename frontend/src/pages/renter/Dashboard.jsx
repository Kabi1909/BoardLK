import { Link } from 'react-router-dom';
import { Heart, Clock, CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { useFavorites } from '../../context/FavoritesContext';
import { StatCard } from '../../components/dashboard/DashboardComponents';
import { PropertyGrid } from '../../components/property/PropertyCard';
import { StatusBadge, EmptyState } from '../../components/common/UI';
export default function RenterDashboard() {
  const { user } = useAuth();
  const s = useStore();
  const { ids } = useFavorites();
  const bookings = s.bookings.filter((b) => b.renterId === user.id);
  const conversations = s.conversations.filter((c) => c.renterId === user.id);
  const recent = (s.recent[user.id] || [])
    .map((id) => s.properties.find((p) => p.id === id))
    .filter((p) => p?.status === 'Published');
  return (
    <>
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p>Let’s find a place that feels like home.</p>
        </div>
        <Link className="btn" to="/properties">
          Find boarding <ArrowRight size={16} />
        </Link>
      </div>
      <div className="stats-grid">
        {[
          [Heart, 'Saved Properties', ids.length],
          [Clock, 'Pending Requests', bookings.filter((b) => b.status === 'Pending').length],
          [
            CheckCircle,
            'Accepted Requests',
            bookings.filter((b) => b.status === 'Accepted').length,
          ],
          [
            MessageSquare,
            'Unread Messages',
            conversations.filter((c) => !c.readBy?.includes(user.id) && c.messages.length).length,
          ],
        ].map(([icon, label, value]) => (
          <StatCard key={label} icon={icon} label={label} value={value} />
        ))}
      </div>
      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Picked for your next move</h2>
          <Link className="text-link" to="/properties">
            Explore all →
          </Link>
        </div>
        <PropertyGrid
          properties={s.properties
            .filter(
              (p) =>
                p.status === 'Published' &&
                p.spaces > 0 &&
                (!user.preferredDistrict || p.district === user.preferredDistrict),
            )
            .slice(0, 3)}
        />
      </section>
      <div className="grid-2">
        <section className="panel">
          <div className="section-heading">
            <h3>Recent booking requests</h3>
            <Link className="text-link" to="/renter/bookings">
              View all
            </Link>
          </div>
          {bookings.slice(0, 4).map((b) => (
            <Link className="compact-row" to="/renter/bookings" key={b.id}>
              <div>
                <strong>
                  {s.properties.find((p) => p.id === b.propertyId)?.title || 'Removed property'}
                </strong>
                <small>Move-in: {b.moveIn}</small>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
          {!bookings.length && (
            <EmptyState
              title="Your next stay starts here"
              description="Send a booking request from a property you love."
            />
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>Recent messages</h3>
            <Link className="text-link" to="/renter/messages">
              Open inbox
            </Link>
          </div>
          {conversations.slice(0, 4).map((c) => (
            <Link className="compact-row" key={c.id} to={'/renter/messages?conversation=' + c.id}>
              <div>
                <strong>{s.users.find((u) => u.id === c.ownerId)?.name}</strong>
                <small>{c.messages.at(-1)?.text || 'Start a conversation'}</small>
              </div>
              <MessageSquare size={17} />
            </Link>
          ))}
          {!conversations.length && (
            <EmptyState
              title="Say hello"
              description="Contact a property owner to start a conversation."
            />
          )}
        </section>
      </div>
      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Recently viewed</h2>
        </div>
        {recent.length ? (
          <PropertyGrid properties={recent.slice(0, 3)} />
        ) : (
          <EmptyState
            title="A fresh start"
            description="The properties you explore will appear here."
            action={
              <Link className="text-link" to="/properties">
                Browse boarding places →
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}
