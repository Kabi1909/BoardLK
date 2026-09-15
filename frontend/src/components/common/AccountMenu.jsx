import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AccountMenu.css';

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const toggle = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    function dismiss(event) {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      } else if (event.type === 'pointerdown' && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, []);
  const links = [
    ['dashboard', 'Dashboard'],
    ...(user.role === 'owner'
      ? [
          ['properties', 'My properties'],
          ['bookings', 'Booking requests'],
        ]
      : [
          ['favorites', 'Favorites'],
          ['bookings', 'Bookings'],
        ]),
    ['messages', 'Messages'],
    ['profile', 'Profile'],
  ];
  return (
    <div className="account-menu desktop-only" ref={container}>
      <button
        ref={toggle}
        className="btn small secondary"
        aria-expanded={open}
        aria-controls="account-links"
        onClick={() => setOpen(!open)}
      >
        {user.name.split(' ')[0]} <ChevronDown size={14} />
      </button>
      {open && (
        <nav id="account-links" className="account-links" aria-label="Your account">
          {links.map(([path, label]) => (
            <Link key={path} to={'/' + user.role + '/' + path} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <button
            onClick={() => {
              logout();
              setOpen(false);
              navigate('/');
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </nav>
      )}
    </div>
  );
}
