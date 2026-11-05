import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { friendlyError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Message } from '../components/States.jsx';

export default function RegisterPage() {
  const { user, signUp } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) return setError('Нууц үг дор хаяж 8 тэмдэгттэй байна.');
    if (form.password !== form.confirm) return setError('Нууц үгнүүд таарахгүй байна.');
    setBusy(true);
    setError(null);
    try {
      const { session, user: created } = await signUp(form);
      // Supabase бүртгэлтэй имэйлийг ил гаргахгүйн тулд хоосон identities буцаадаг.
      if (created?.identities?.length === 0) setError('Энэ имэйлээр бүртгэл үүссэн байна.');
      else if (!session) setNeedsConfirmation(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  if (needsConfirmation) {
    return (
      <div className="page auth-page">
        <Message title="Имэйлээ шалгана уу">
          <p>{form.email} хаяг руу баталгаажуулах холбоос илгээлээ. Холбоосыг дарсны дараа нэвтэрнэ үү.</p>
        </Message>
      </div>
    );
  }

  return (
    <div className="page auth-page">
      <h1>Бүртгүүлэх</h1>
      <p className="lead">Бүртгүүлснээр өөрийн бүтээлээ музейд нэмэх боломжтой болно.</p>
      <form onSubmit={onSubmit} className="form">
        <div className="field">
          <label htmlFor="displayName">Нэр</label>
          <input id="displayName" autoComplete="name" required maxLength={80} value={form.displayName} onChange={set('displayName')} />
        </div>
        <div className="field">
          <label htmlFor="email">Имэйл</label>
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Нууц үг</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
          <p className="hint">Дор хаяж 8 тэмдэгт.</p>
        </div>
        <div className="field">
          <label htmlFor="confirm">Нууц үг давтах</label>
          <input id="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Бүртгэж байна…' : 'Бүртгүүлэх'}</button>
      </form>
      <p>Бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link></p>
    </div>
  );
}
