import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { date } from '../../utils/format';
import { EmptyState } from './UI';
export default function NotificationsPage() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  return (
    <>
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">STAY IN THE LOOP</span>
          <h1>Notifications</h1>
          <p>{unread ? unread + ' unread updates to catch up on.' : 'You’re all caught up.'}</p>
        </div>
        <button className="btn secondary" onClick={markAllRead} disabled={!unread}>
          <CheckCheck size={16} />
          Mark all as read
        </button>
      </div>
      <div className="notifications-list panel">
        {notifications.map((n) => (
          <article className={'notification-row ' + (!n.read ? 'unread' : '')} key={n.id}>
            <span className="notification-icon">
              <Bell size={20} />
            </span>
            <Link to={n.path} onClick={() => markRead(n.id)}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <time>{date(n.createdAt)}</time>
            </Link>
            {!n.read && (
              <button
                className="icon-button"
                aria-label={'Mark ' + n.title + ' as read'}
                onClick={() => markRead(n.id)}
              >
                <Check size={16} />
              </button>
            )}
          </article>
        ))}
        {!notifications.length && (
          <EmptyState
            title="A quiet moment"
            description="We’ll let you know when there’s a new message, booking update, or review."
          />
        )}
      </div>
    </>
  );
}
