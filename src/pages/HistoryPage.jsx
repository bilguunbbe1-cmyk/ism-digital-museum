import { Link } from 'react-router-dom';
import { fetchMilestones } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { LoadBoundary } from '../components/States.jsx';

export default function HistoryPage() {
  const load = useLoad(fetchMilestones);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="eyebrow">Танхим 03</p>
        <h1>Тэнхимийн түүх</h1>
        <p className="lead">
          Тэнхимийн хөгжлийн үе шатууд. Эдгээрийг бүтээл, арга хэмжээтэй нь хамт үзэхийг хүсвэл{' '}
          <Link to="/time-machine">Time Machine</Link> руу орно уу.
        </p>
      </header>
      <LoadBoundary load={load} emptyTitle="Түүхийн мэдээлэл алга" emptyText="Мэдээлэл нэмэгдэхэд энд харагдана.">
        {(items) => (
          <ol className="history-list">
            {items.map((m) => (
              <li key={m.id}>
                <Link to={`/time-machine?year=${m.year}`} className="history-year">{m.year}</Link>
                <div>
                  <h2>{m.title}</h2>
                  {m.description && <p>{m.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </LoadBoundary>
    </div>
  );
}
