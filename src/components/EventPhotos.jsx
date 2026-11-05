import { useState } from 'react';
import { deleteRow, fetchEventPhotos, friendlyError, removeStoredImage, saveRow, uploadImage, validateImage } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useAuth } from '../context/AuthContext.jsx';

// Админ хэсэг дэх арга хэмжээний зурагт цомгийн удирдлага.
export default function EventPhotos({ eventId }) {
  const { user } = useAuth();
  const load = useLoad(() => fetchEventPhotos(eventId), [eventId]);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(e) {
    const files = [...e.target.files];
    e.target.value = '';
    const problem = files.map(validateImage).find(Boolean);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      for (const file of files) {
        const image_url = await uploadImage(file, user.id);
        await saveRow('event_photos', null, { event_id: eventId, image_url, caption: caption.trim() || null });
      }
      setCaption('');
      await load.reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(photo) {
    if (!window.confirm('Энэ зургийг цомгоос устгах уу?')) return;
    try {
      await deleteRow('event_photos', photo.id);
      await removeStoredImage(photo.image_url);
      await load.reload();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="album-admin">
      <h3>Зурагт цомог</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor="photo-caption">Зургийн тайлбар</label>
          <input id="photo-caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="photo-files">Зураг нэмэх</label>
          <input id="photo-files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFiles} disabled={busy} />
          <p className="hint">{busy ? 'Оруулж байна…' : 'Олон зураг зэрэг сонгож болно.'}</p>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <ul className="album-thumbs">
        {(load.data || []).map((p) => (
          <li key={p.id}>
            <img src={p.image_url} alt={p.caption || ''} />
            <button type="button" className="text-button danger" onClick={() => onDelete(p)}>Устгах</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
