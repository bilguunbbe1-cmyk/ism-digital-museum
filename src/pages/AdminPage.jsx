import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteExhibit,
  fetchAllExhibits,
  fetchCategories,
  fetchEventPhotos,
  fetchEvents,
  fetchMilestones,
  fetchTeachers,
  friendlyError,
  updateExhibit,
} from '../lib/api.js';
import { formatDate, STATUS_LABELS } from '../lib/format.js';
import { useLoad } from '../hooks/useLoad.js';
import CrudSection from '../components/CrudSection.jsx';
import EventPhotos from '../components/EventPhotos.jsx';
import { LoadBoundary } from '../components/States.jsx';

function ExhibitReview() {
  const load = useLoad(fetchAllExhibits);
  const [error, setError] = useState(null);

  async function act(fn) {
    setError(null);
    try {
      await fn();
      await load.reload();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const onDelete = (e) => {
    if (window.confirm(`"${e.title}" үзмэрийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) act(() => deleteExhibit(e));
  };
  const pendingFirst = (rows) => [...rows].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1));

  return (
    <section>
      <h2 className="section-title">Үзмэрийн хяналт</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      <LoadBoundary load={load} emptyTitle="Үзмэр алга">
        {(rows) => (
          <ul className="manage-list">
            {pendingFirst(rows).map((e) => (
              <li key={e.id}>
                <div>
                  <Link className="manage-title" to={`/exhibits/${e.id}`}>{e.title}</Link>
                  <p className="muted">{e.creator?.display_name} · {e.year_created}</p>
                </div>
                <label className="status-select">
                  <span className="sr-only">Төлөв: {e.title}</span>
                  <select value={e.status} className={`badge-${e.status}`}
                    onChange={(ev) => act(() => updateExhibit(e.id, { status: ev.target.value }))}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
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
  );
}

const TABS = {
  exhibits: { label: 'Үзмэр', render: () => <ExhibitReview /> },
  teachers: {
    label: 'Багш',
    render: () => (
      <CrudSection
        title="Багш нар"
        table="teachers"
        load={fetchTeachers}
        rowTitle={(r) => r.name}
        rowMeta={(r) => r.position}
        fields={[
          { name: 'name', label: 'Нэр', required: true },
          { name: 'position', label: 'Албан тушаал', required: true },
          { name: 'courses', label: 'Заадаг хичээл', type: 'list' },
          { name: 'bio', label: 'Товч танилцуулга', type: 'textarea' },
          { name: 'photo_url', label: 'Зураг', type: 'image' },
        ]}
      />
    ),
  },
  events: {
    label: 'Арга хэмжээ',
    render: () => (
      <CrudSection
        title="Арга хэмжээ"
        table="events"
        load={fetchEvents}
        rowTitle={(r) => r.title}
        rowMeta={(r) => formatDate(r.event_date)}
        fields={[
          { name: 'title', label: 'Нэр', required: true },
          { name: 'event_date', label: 'Огноо', type: 'date', required: true },
          { name: 'description', label: 'Тайлбар', type: 'textarea' },
          { name: 'cover_image_url', label: 'Нүүр зураг', type: 'image' },
        ]}
        renderExtra={(row) => <EventPhotos eventId={row.id} />}
        relatedFiles={async (row) => (await fetchEventPhotos(row.id)).map((p) => p.image_url)}
      />
    ),
  },
  history: {
    label: 'Түүх',
    render: () => (
      <CrudSection
        title="Түүхийн үе шат"
        table="history_milestones"
        load={fetchMilestones}
        rowTitle={(r) => r.title}
        rowMeta={(r) => r.year}
        fields={[
          { name: 'year', label: 'Он', type: 'number', required: true },
          { name: 'title', label: 'Гарчиг', required: true },
          { name: 'description', label: 'Тайлбар', type: 'textarea' },
        ]}
      />
    ),
  },
  categories: {
    label: 'Ангилал',
    render: () => (
      <CrudSection
        title="Үзмэрийн ангилал"
        table="exhibition_categories"
        load={fetchCategories}
        rowTitle={(r) => r.name}
        rowMeta={(r) => r.description}
        fields={[
          { name: 'name', label: 'Нэр', required: true },
          { name: 'description', label: 'Тайлбар', type: 'textarea' },
        ]}
      />
    ),
  },
};

export default function AdminPage() {
  const [tab, setTab] = useState('exhibits');
  return (
    <div className="page">
      <header className="page-head">
        <h1>Админ хэсэг</h1>
        <p className="lead">Нийтэд харагдах үзмэр, тэнхимийн мэдээлэл, зурагт цомгийг удирдана.</p>
      </header>
      <div className="tabs" role="tablist" aria-label="Агуулгын төрөл">
        {Object.entries(TABS).map(([key, { label }]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      <div key={tab} role="tabpanel">{TABS[tab].render()}</div>
    </div>
  );
}
