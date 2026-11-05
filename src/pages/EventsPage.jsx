import { Link } from 'react-router-dom';
import { fetchEvents } from '../lib/api.js';
import { formatDate } from '../lib/format.js';
import { useLoad } from '../hooks/useLoad.js';
import { LoadBoundary } from '../components/States.jsx';

export default function EventsPage() {
  const load = useLoad(fetchEvents);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Танхим 05</p>
        <h1>Өдөрлөг ба арга хэмжээ</h1>
      </header>
      <LoadBoundary load={load} emptyTitle="Арга хэмжээ бүртгэгдээгүй байна" emptyText="Шинэ арга хэмжээ нэмэгдэхэд энд харагдана.">
        {(events) => (
          <div className="event-list">
            {events.map((e) => (
              <article key={e.id} className="event-row">
                <Link to={`/events/${e.id}`}>
                  <div className="event-cover">
                    {e.cover_image_url ? <img src={e.cover_image_url} alt="" loading="lazy" /> : <div className="img-empty" aria-hidden="true">{e.title.slice(0, 1)}</div>}
                  </div>
                  <div>
                    <p className="catalog">{formatDate(e.event_date)}</p>
                    <h2>{e.title}</h2>
                    {e.description && <p>{e.description}</p>}
                    <span className="text-link">Зурагт цомог үзэх →</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </LoadBoundary>
    </div>
  );
}
