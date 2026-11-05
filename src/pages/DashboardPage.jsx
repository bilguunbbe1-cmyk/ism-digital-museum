import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteExhibit, fetchExhibitsByCreator, friendlyError, removeStoredImage, updateProfile } from '../lib/api.js';
import { STATUS_LABELS } from '../lib/format.js';
import { useLoad } from '../hooks/useLoad.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { LoadBoundary } from '../components/States.jsx';

function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ display_name: '', bio: '', avatar_url: '' });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({ display_name: profile.display_name, bio: profile.bio || '', avatar_url: profile.avatar_url || '' });
    }
  }, [profile]);

  async function onSubmit(e) {
    e.preventDefault();
    const name = form.display_name.trim();
    if (!name) return setStatus({ error: 'Нэрээ оруулна уу.' });
    setStatus(null);
    try {
      await updateProfile(user.id, {
        display_name: name,
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url || null,
      });
      if (profile.avatar_url !== form.avatar_url) await removeStoredImage(profile.avatar_url);
      await refreshProfile();
      setStatus({ ok: 'Профайл хадгалагдлаа.' });
    } catch (err) {
      setStatus({ error: friendlyError(err) });
    }
  }

  return (
    <form className="form panel" onSubmit={onSubmit}>
      <h2>Миний профайл</h2>
      <div className="field">
        <label htmlFor="display_name">Нэр</label>
        <input id="display_name" required maxLength={80} value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="bio">Товч танилцуулга</label>
        <textarea id="bio" rows={3} maxLength={1000} value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <ImageUpload id="avatar" label="Профайл зураг" value={form.avatar_url}
        onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))} />
      {status?.error && <p className="form-error" role="alert">{status.error}</p>}
      {status?.ok && <p className="form-ok" role="status">{status.ok}</p>}
      <button className="btn btn-primary">Хадгалах</button>
    </form>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const load = useLoad(() => fetchExhibitsByCreator(user.id), [user.id]);
  const [error, setError] = useState(null);

  async function onDelete(exhibit) {
    if (!window.confirm(`"${exhibit.title}" бүтээлийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    setError(null);
    try {
      await deleteExhibit(exhibit);
      await load.reload();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Миний бүтээл</h1>
      </header>
      <div className="dashboard">
        <section aria-labelledby="my-exhibits">
          <div className="section-head">
            <h2 id="my-exhibits" className="section-title">Бүтээлүүд</h2>
            <Link to="/dashboard/new" className="btn btn-primary">Бүтээл нэмэх</Link>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <LoadBoundary load={load} emptyTitle="Танд бүтээл алга байна" emptyText="Эхний бүтээлээ нэмээд музейд байршуулаарай.">
            {(rows) => (
              <ul className="manage-list">
                {rows.map((e) => (
                  <li key={e.id}>
                    <div>
                      <Link to={`/exhibits/${e.id}`} className="manage-title">{e.title}</Link>
                      <p className="muted">{e.year_created}{e.category ? ` · ${e.category.name}` : ''}</p>
                    </div>
                    <span className={`badge badge-${e.status}`}>{STATUS_LABELS[e.status]}</span>
                    <div className="row-actions">
                      <Link className="text-button" to={`/dashboard/${e.id}/edit`}>Засах</Link>
                      <button type="button" className="text-button danger" onClick={() => onDelete(e)}>Устгах</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </LoadBoundary>
        </section>
        <ProfileForm />
      </div>
    </div>
  );
}
