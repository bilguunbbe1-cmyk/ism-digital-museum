import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEvent } from '../lib/api.js';
import { formatDate } from '../lib/format.js';
import { useLoad } from '../hooks/useLoad.js';
import Lightbox from '../components/Lightbox.jsx';
import { LoadBoundary, Message } from '../components/States.jsx';

export default function EventDetailPage() {
  const { id } = useParams();
  const load = useLoad(() => fetchEvent(id), [id]);
  const [active, setActive] = useState(null);

  return (
    <div className="page">
      <Link to="/events" className="text-link">← Арга хэмжээ рүү буцах</Link>
      <LoadBoundary load={load} emptyTitle="Арга хэмжээ олдсонгүй" emptyText="Энэ арга хэмжээ устгагдсан байж магадгүй.">
        {(e) => (
          <>
            <header className="page-head">
              <p className="eyebrow">{formatDate(e.event_date)}</p>
              <h1>{e.title}</h1>
              {e.description && <p className="lead">{e.description}</p>}
            </header>
            {e.photos.length === 0 ? (
              <Message title="Зурагт цомог хоосон байна" />
            ) : (
              <ul className="photo-grid">
                {e.photos.map((p, i) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => setActive(i)} aria-label={`Томруулах: ${p.caption || `зураг ${i + 1}`}`}>
                      <img src={p.image_url} alt={p.caption || ''} loading="lazy" />
                    </button>
                    {p.caption && <p className="photo-caption">{p.caption}</p>}
                  </li>
                ))}
              </ul>
            )}
            {active !== null && (
              <Lightbox photos={e.photos} index={active} onChange={setActive} onClose={() => setActive(null)} />
            )}
          </>
        )}
      </LoadBoundary>
    </div>
  );
}
