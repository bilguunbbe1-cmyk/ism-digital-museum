import { useState } from 'react';
import { deleteRow, friendlyError, removeStoredImage, saveRow } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import ImageUpload from './ImageUpload.jsx';
import { LoadBoundary } from './States.jsx';

const toFormValue = (field, row) => {
  const value = row?.[field.name];
  if (field.type === 'list') return (value || []).join(', ');
  return value ?? '';
};

const toDbValue = (field, value) => {
  if (field.type === 'list') return value.split(',').map((v) => v.trim()).filter(Boolean);
  if (field.type === 'number') return Number(value);
  if (typeof value === 'string') return value.trim() || null;
  return value;
};

// Багш, арга хэмжээ, түүх, ангилал гэсэн админы хэсгүүд ижил бүтэцтэй тул
// талбарын тохиргоогоор ажилладаг нэг компонент ашиглав.
export default function CrudSection({ title, table, load: loader, fields, rowTitle, rowMeta, renderExtra }) {
  const load = useLoad(loader);
  const [editing, setEditing] = useState(null); // null | 'new' | мөр
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const imageFields = fields.filter((f) => f.type === 'image');

  function open(row) {
    setEditing(row);
    setError(null);
    const source = row === 'new' ? null : row;
    setForm(Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, source)])));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !String(form[f.name]).trim());
    if (missing) return setError(`"${missing.label}" талбарыг бөглөнө үү.`);
    const values = Object.fromEntries(fields.map((f) => [f.name, toDbValue(f, form[f.name])]));
    setBusy(true);
    setError(null);
    try {
      const isNew = editing === 'new';
      const saved = await saveRow(table, isNew ? null : editing.id, values);
      if (!isNew) {
        await Promise.all(
          imageFields
            .filter((f) => editing[f.name] !== values[f.name])
            .map((f) => removeStoredImage(editing[f.name])),
        );
      }
      await load.reload();
      // Шинэ бичлэг хадгалсны дараа зурагт цомог гэх мэт нэмэлтийг бөглөх боломжтой байлгана.
      if (renderExtra) open(saved);
      else setEditing(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row) {
    if (!window.confirm(`"${rowTitle(row)}" бичлэгийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    setError(null);
    try {
      await deleteRow(table, row.id);
      await Promise.all(imageFields.map((f) => removeStoredImage(row[f.name])));
      if (editing?.id === row.id) setEditing(null);
      await load.reload();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <section>
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        <button type="button" className="btn btn-primary" onClick={() => open('new')}>Шинээр нэмэх</button>
      </div>

      {editing && (
        <div className="panel admin-form">
          <form className="form" onSubmit={onSubmit} noValidate>
            <h3>{editing === 'new' ? 'Шинэ бичлэг' : `Засах: ${rowTitle(editing)}`}</h3>
            {fields.map((f) => {
              const id = `${table}-${f.name}`;
              if (f.type === 'image') {
                return (
                  <ImageUpload key={f.name} id={id} label={f.label} value={form[f.name]}
                    onChange={(url) => setForm((prev) => ({ ...prev, [f.name]: url }))} />
                );
              }
              const common = {
                id,
                value: form[f.name],
                onChange: (e) => setForm({ ...form, [f.name]: e.target.value }),
              };
              return (
                <div className="field" key={f.name}>
                  <label htmlFor={id}>{f.label}{f.required ? ' *' : ''}</label>
                  {f.type === 'textarea' ? (
                    <textarea rows={4} {...common} />
                  ) : (
                    <input type={f.type === 'list' || !f.type ? 'text' : f.type} {...common} />
                  )}
                  {f.type === 'list' && <p className="hint">Таслалаар тусгаарлана.</p>}
                </div>
              );
            })}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="row-actions">
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Хадгалж байна…' : 'Хадгалах'}</button>
              <button type="button" className="btn" onClick={() => setEditing(null)}>Болих</button>
            </div>
          </form>
          {renderExtra && editing !== 'new' && renderExtra(editing)}
        </div>
      )}

      {!editing && error && <p className="form-error" role="alert">{error}</p>}

      <LoadBoundary load={load} emptyTitle="Бичлэг алга" emptyText="Шинээр нэмэх товчоор эхлүүлнэ үү.">
        {(rows) => (
          <ul className="manage-list">
            {rows.map((row) => (
              <li key={row.id}>
                <div>
                  <p className="manage-title">{rowTitle(row)}</p>
                  {rowMeta && <p className="muted">{rowMeta(row)}</p>}
                </div>
                <div className="row-actions">
                  <button type="button" className="text-button" onClick={() => open(row)}>Засах</button>
                  <button type="button" className="text-button danger" onClick={() => onDelete(row)}>Устгах</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </LoadBoundary>
    </section>
  );
}
