import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  ['/exhibits', 'Үзэсгэлэн'],
  ['/time-machine', 'Time Machine'],
  ['/history', 'Түүх'],
  ['/teachers', 'Багш нар'],
  ['/events', 'Арга хэмжээ'],
  ['/creators', 'ISM Creators'],
];

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Хуудас солигдоход цэсийг хааж, дээшээ гүйлгэнэ.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Үндсэн агуулга руу очих</a>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">ISM</span>
          <span>Digital Museum</span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Хаах' : 'Цэс'}
        </button>
        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Үндсэн цэс">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
          <span className="nav-divider" aria-hidden="true" />
          {user ? (
            <>
              <NavLink to="/dashboard">Миний бүтээл</NavLink>
              {isAdmin && <NavLink to="/admin">Админ</NavLink>}
              <button type="button" className="nav-button" onClick={() => signOut()}>Гарах</button>
            </>
          ) : (
            <NavLink to="/login">Нэвтрэх</NavLink>
          )}
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p className="footer-title">ISM Digital Museum</p>
        <p>Мэдээллийн Системийн Менежментийн Тэнхим · Интернет програмчлал, гэрийн даалгавар №1</p>
        <p className="sample-note">
          Одоогоор музейд байгаа нэр, огноо, түүх, зураг нь жишээ өгөгдөл бөгөөд бодит хүн, үйл явдлыг заагаагүй.
        </p>
      </footer>
    </>
  );
}
