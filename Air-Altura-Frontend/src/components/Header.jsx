import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isHome    = location.pathname === '/';

  /* On homepage: start transparent, go opaque once user scrolls past ~80px */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    function onScroll() { setScrolled(window.scrollY > 80); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/');
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-10 h-16 transition-colors duration-300 select-none"
      style={{
        backgroundColor: transparent ? 'transparent' : '#FAF6F0',
        borderBottom:     transparent ? 'none'        : '1px solid #E8E2D6',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3.5 no-underline">
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path
            d="M12 78 Q28 22 88 18"
            stroke={transparent ? '#FAF6F0' : '#0E3B4D'}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ transition: 'stroke 300ms' }}
          />
          <circle cx="88" cy="18" r="6" fill="#C8754E" />
        </svg>
        <span>
          <span
            className="block font-body text-[11px] font-medium tracking-[0.32em] uppercase mb-0.5 transition-colors duration-300"
            style={{ color: transparent ? 'rgba(250,246,240,0.5)' : '#5C6670' }}
          >
            AIR
          </span>
          <span
            className="block font-display text-[28px] leading-none tracking-tight transition-colors duration-300"
            style={{ color: transparent ? '#FAF6F0' : '#0E3B4D' }}
          >
            Altura
          </span>
        </span>
      </Link>

      {/* Nav links */}
      <ul className="flex items-center gap-8 list-none m-0 p-0">
        <li className="hidden sm:block">
          <Link
            to="/bookings"
            className="font-body text-sm font-medium transition-colors duration-300 no-underline"
            style={{ color: transparent ? 'rgba(250,246,240,0.75)' : '#5C6670' }}
          >
            My Bookings
          </Link>
        </li>
        <li>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="font-body text-sm font-medium transition-colors duration-300 bg-transparent border-none cursor-pointer p-0"
              style={{ color: transparent ? 'rgba(250,246,240,0.75)' : '#5C6670' }}
            >
              Logout
            </button>
          ) : (
            <Link
              to="/auth"
              className="font-body text-sm font-medium transition-colors duration-300 no-underline"
              style={{ color: transparent ? 'rgba(250,246,240,0.75)' : '#5C6670' }}
            >
              Sign in
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
