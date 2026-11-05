import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { friendlyError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(form);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  return (
    <div className="page auth-page">
      <h1>Нэвтрэх</h1>
      <form onSubmit={onSubmit} className="form">
        <div className="field">
          <label htmlFor="email">Имэйл</label>
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Нууц үг</label>
          <input id="password" type="password" autoComplete="current-password" required value={form.password} onChange={set('password')} />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Нэвтэрч байна…' : 'Нэвтрэх'}</button>
      </form>
      <p>Бүртгэлгүй юу? <Link to="/register">Бүртгүүлэх</Link></p>
    </div>
  );
}
