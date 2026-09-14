import { Link } from 'react-router-dom';
import { House, CheckCircle, BedDouble, Clock, Eye, Star, Plus, MessageSquare } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { StatCard } from '../../components/dashboard/DashboardComponents';
import { StatusBadge, EmptyState, RatingStars } from '../../components/common/UI';
export default function OwnerDashboard() {
  const { user } = useAuth();
  const s = useStore();
  const own = s.properties.filter((p) => p.ownerId === user.id);
  const ids = own.map((p) => p.id);
  const bookings = s.bookings.filter((b) => b.ownerId === user.id);
  const reviews = s.reviews.filter((r) => ids.includes(r.propertyId));
  const conversations = s.conversations.filter((c) => c.ownerId === user.id);
  const views = own.reduce((a, p) => a + p.views, 0);
  const chart = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => ({
    month,
    views: Math.round(views * [0.08, 0.11, 0.15, 0.18, 0.22, 0.26][i]),
    requests: bookings.filter((b) => new Date(b.createdAt).getMonth() === i + 3).length,
  }));
  const stats = [
    [House, 'Total Properties', own.length],
    [CheckCircle, 'Active Listings', own.filter((p) => p.status === 'Published').length],
    [
      BedDouble,
      'Available Spaces',
      own.filter((p) => p.status === 'Published').reduce((a, p) => a + Number(p.spaces), 0),
    ],
    [Clock, 'Pending Requests', bookings.filter((b) => b.status === 'Pending').length],
    [CheckCircle, 'Accepted Requests', bookings.filter((b) => b.status === 'Accepted').length],
    [Eye, 'Total Views', views],
    [
      Star,
      'Average Rating',
      reviews.length
        ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
        : '—',
    ],
  ];
  return (
    <>
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">A LITTLE OVERVIEW</span>
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p>Here’s how your properties are doing.</p>
        </div>
        <Link className="btn" to="/owner/properties/new">
          <Plus size={17} />
          Add property
        </Link>
      </div>
      <div className="stats-grid owner-stats">
        {stats.map(([icon, label, value]) => (
          <StatCard key={label} icon={icon} label={label} value={value} />
        ))}
      </div>
      <div className="grid-2 dashboard-section">
        <section className="panel">
          <h3>Property views per month</h3>
          <p className="fine-print">Illustrative monthly distribution of total mock views</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#70a982" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#70a982" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ede5" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} width={40} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#438865"
                  fill="url(#viewsFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <h3>Booking requests per month</h3>
          <p className="fine-print">Based on your booking request dates</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ede5" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="requests" fill="#7ba284" radius={[5, 5, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <div className="grid-2">
        <section className="panel">
          <div className="section-heading">
            <h3>Recent booking requests</h3>
            <Link className="text-link" to="/owner/bookings">
              View all
            </Link>
          </div>
          {bookings.slice(0, 5).map((b) => (
            <Link className="compact-row" key={b.id} to="/owner/bookings">
              <div>
                <strong>{s.users.find((u) => u.id === b.renterId)?.name}</strong>
                <small>
                  {s.properties.find((p) => p.id === b.propertyId)?.title || 'Removed property'}
                </small>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
          {!bookings.length && <EmptyState title="No requests yet" />}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>Most viewed properties</h3>
            <Link className="text-link" to="/owner/properties">
              Manage
            </Link>
          </div>
          {[...own]
            .sort((a, b) => b.views - a.views)
            .slice(0, 4)
            .map((p) => (
              <Link className="compact-row" to={'/properties/' + p.id} key={p.id}>
                <img src={p.images[0]} alt={p.title} />
                <div>
                  <strong>{p.title}</strong>
                  <small>{p.city}</small>
                </div>
                <span className="view-count">
                  <Eye size={13} />
                  {p.views}
                </span>
              </Link>
            ))}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>Recent messages</h3>
            <Link className="text-link" to="/owner/messages">
              Open inbox
            </Link>
          </div>
          {conversations.slice(0, 3).map((c) => (
            <Link className="compact-row" key={c.id} to={'/owner/messages?conversation=' + c.id}>
              <div>
                <strong>{s.users.find((u) => u.id === c.renterId)?.name}</strong>
                <small>{c.messages.at(-1)?.text || 'Start a conversation'}</small>
              </div>
              <MessageSquare size={16} />
            </Link>
          ))}
          {!conversations.length && <EmptyState title="Your inbox is quiet" />}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>Latest reviews</h3>
            <Link className="text-link" to="/owner/reviews">
              View all
            </Link>
          </div>
          {reviews.slice(0, 3).map((r) => (
            <div className="compact-row" key={r.id}>
              <div>
                <strong>{s.users.find((u) => u.id === r.renterId)?.name}</strong>
                <small>{r.comment}</small>
              </div>
              <RatingStars rating={r.rating} />
            </div>
          ))}
          {!reviews.length && <EmptyState title="No reviews yet" />}
        </section>
      </div>
    </>
  );
}
