import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createExhibit,
  fetchCategories,
  fetchExhibit,
  friendlyError,
  removeStoredImage,
  updateExhibit,
} from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { ErrorState, Loading, Message } from '../components/States.jsx';

const THIS_YEAR = new Date().getFullYear();
const EMPTY = {
  title: '',
  description: '',
  image_url: '',
  category_id: '',
  technology_stack: '',
  year_created: String(THIS_YEAR),
  demo_url: '',
  github_url: '',
};

const isHttpUrl = (v) => {
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

export function validateExhibit(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Нэрээ оруулна уу.';
  if (!form.description.trim()) errors.description = 'Тайлбар оруулна уу.';
  const year = Number(form.year_created);
  if (!Number.isInteger(year) || year < 1990 || year > THIS_YEAR + 1) {
    errors.year_created = `Он 1990-${THIS_YEAR + 1} хооронд байна.`;
  }
  if (form.demo_url && !isHttpUrl(form.demo_url)) errors.demo_url = 'http:// эсвэл https://-ээр эхэлсэн холбоос оруулна уу.';
  if (form.github_url && !isHttpUrl(form.github_url)) errors.github_url = 'http:// эсвэл https://-ээр эхэлсэн холбоос оруулна уу.';
  return errors;
}

export default function ExhibitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const categories = useLoad(fetchCategories);
  const existing = useLoad(() => (id ? fetchExhibit(id) : Promise.resolve(null)), [id]);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const e = existing.data;
    if (!e) return;
    setForm({
      title: e.title,
      description: e.description,
      image_url: e.image_url || '',
      category_id: e.category_id || '',
      technology_stack: e.technology_stack.join(', '),
      year_created: String(e.year_created),
      demo_url: e.demo_url || '',
      github_url: e.github_url || '',
    });
  }, [existing.data]);

  if (existing.loading) return <div className="page"><Loading /></div>;
  if (existing.error) return <div className="page"><ErrorState error={existing.error} onRetry={existing.reload} /></div>;
  if (id && (!existing.data || (!isAdmin && existing.data.creator_id !== user.id))) {
    return <div className="page"><Message title="Энэ бүтээлийг засах боломжгүй">Бүтээл олдсонгүй эсвэл танд засах эрх алга.</Message></div>;
  }

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const found = validateExhibit(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const values = {
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url || null,
      category_id: form.category_id || null,
      technology_stack: [...new Set(form.technology_stack.split(',').map((t) => t.trim()).filter(Boolean))],
      year_created: Number(form.year_created),
      demo_url: form.demo_url.trim() || null,
      github_url: form.github_url.trim() || null,
    };

    setBusy(true);
    setSubmitError(null);
    try {
      const saved = id
        ? await updateExhibit(id, values)
        : await createExhibit({ ...values, creator_id: user.id });
      if (id && existing.data.image_url !== values.image_url) await removeStoredImage(existing.data.image_url);
      navigate(`/exhibits/${saved.id}`);
    } catch (err) {
      setSubmitError(friendlyError(err));
      setBusy(false);
    }
  }

  const fieldError = (name) => errors[name] && <p className="field-error" role="alert">{errors[name]}</p>;

  return (
    <div className="page narrow">
      <Link to="/dashboard" className="text-link">← Миний бүтээл рүү буцах</Link>
      <header className="page-head">
        <h1>{id ? 'Бүтээл засах' : 'Шинэ бүтээл'}</h1>
        {!isAdmin && (
          <p className="lead">Бүтээл админы хяналтын дараа нийтлэгдэнэ. Нийтлэгдсэн бүтээлээ засвал дахин хяналтад орно.</p>
        )}
      </header>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="title">Нэр *</label>
          <input id="title" maxLength={120} value={form.title} onChange={set('title')} aria-invalid={!!errors.title} />
          {fieldError('title')}
        </div>
        <div className="field">
          <label htmlFor="description">Тайлбар *</label>
          <textarea id="description" rows={6} maxLength={5000} value={form.description} onChange={set('description')} aria-invalid={!!errors.description} />
          {fieldError('description')}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="year_created">Он *</label>
            <input id="year_created" type="number" inputMode="numeric" value={form.year_created} onChange={set('year_created')} aria-invalid={!!errors.year_created} />
            {fieldError('year_created')}
          </div>
          <div className="field">
            <label htmlFor="category_id">Ангилал</label>
            <select id="category_id" value={form.category_id} onChange={set('category_id')}>
              <option value="">Сонгоогүй</option>
              {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="technology_stack">Ашигласан технологи</label>
          <input id="technology_stack" value={form.technology_stack} onChange={set('technology_stack')} placeholder="React, Supabase, PostgreSQL" />
          <p className="hint">Таслалаар тусгаарлана.</p>
        </div>
        <ImageUpload id="image" label="Зураг" value={form.image_url}
          onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
        <div className="field-row">
          <div className="field">
            <label htmlFor="demo_url">Demo холбоос</label>
            <input id="demo_url" type="url" value={form.demo_url} onChange={set('demo_url')} aria-invalid={!!errors.demo_url} />
            {fieldError('demo_url')}
          </div>
          <div className="field">
            <label htmlFor="github_url">GitHub холбоос</label>
            <input id="github_url" type="url" value={form.github_url} onChange={set('github_url')} aria-invalid={!!errors.github_url} />
            {fieldError('github_url')}
          </div>
        </div>
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Хадгалж байна…' : 'Хадгалах'}</button>
      </form>
    </div>
  );
}
