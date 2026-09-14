import { useEffect, useRef, useId, Component } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, Star, LoaderCircle, ChevronLeft, ChevronRight, Home } from 'lucide-react';
export function LoadingSpinner() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Loading…
    </div>
  );
}
export function SkeletonCard() {
  return (
    <div className="card skeleton">
      <div />
      <p />
      <p />
    </div>
  );
}
export function EmptyState({
  title = 'Nothing here yet',
  description = 'Try changing your filters or check back later.',
  action,
}) {
  return (
    <div className="empty">
      <Search size={36} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function StatusBadge({ status }) {
  return (
    <span
      className={
        'badge ' +
        (status === 'Rejected' || status === 'Fully Occupied'
          ? 'red'
          : status === 'Pending' || status === 'Limited Availability' || status === 'Draft'
            ? 'amber'
            : 'green')
      }
    >
      {status}
    </span>
  );
}
export function RatingStars({ rating = 0 }) {
  return (
    <span className="rating" aria-label={rating + ' out of 5 stars'}>
      <Star size={14} fill="currentColor" />
      <strong>{Number(rating).toFixed(1)}</strong>
    </span>
  );
}
export function Avatar({ user }) {
  return user?.photo ? (
    <img className="avatar" src={user.photo} alt={user.name} />
  ) : (
    <span className="avatar">
      {(user?.name || 'BoardLK')
        .split(' ')
        .slice(0, 2)
        .map((s) => s[0])
        .join('')}
    </span>
  );
}
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = ref.current.querySelectorAll('button,a,input,select,textarea,[tabindex="0"]');
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className={'modal ' + (wide ? 'wide' : '')}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="section-heading">
          <h2 id={id}>{title}</h2>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function ConfirmDialog({ title, description, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{description}</p>
      <div className="actions">
        <button className="btn secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}
export function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Pagination" className="pagination">
      <button
        className="icon-button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button
          aria-current={page === i + 1 ? 'page' : undefined}
          className={page === i + 1 ? 'active' : ''}
          key={i}
          onClick={() => onChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button
        className="icon-button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </button>
    </nav>
  );
}
export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">
        <Home size={14} /> Home
      </Link>
      {items.map((item, i) => (
        <span key={i}>/ {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}</span>
      ))}
    </nav>
  );
}
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Something went wrong</h1>
        <p>{this.state.error.message}</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
