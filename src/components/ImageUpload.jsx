import { useState } from 'react';
import { friendlyError, uploadImage, validateImage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Зургийг Supabase Storage-д шууд хадгалж, нийтийн URL-ийг onChange-ээр буцаана.
export default function ImageUpload({ label, value, onChange, onError, id }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateImage(file);
    setError(problem);
    if (problem) {
      onError?.(problem);
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadImage(file, user.id));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {value && (
        <div className="upload-preview">
          <img src={value} alt="Оруулсан зураг" />
          <button type="button" className="text-button" onClick={() => onChange('')}>Зураг хасах</button>
        </div>
      )}
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} disabled={busy} />
      <p className="hint">{busy ? 'Зураг оруулж байна…' : 'JPG, PNG, WEBP, GIF. 5 MB хүртэл.'}</p>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
