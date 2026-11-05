import { Link, useParams } from 'react-router-dom';
import { fetchExhibit } from '../lib/api.js';
import { catalogLabel, STATUS_LABELS } from '../lib/format.js';
import { useLoad } from '../hooks/useLoad.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadBoundary } from '../components/States.jsx';

export default function ExhibitDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const load = useLoad(() => fetchExhibit(id), [id]);

  return (
    <div className="page">
      <Link to="/exhibits" className="text-link">← Үзэсгэлэн рүү буцах</Link>
      <LoadBoundary
        load={load}
        emptyTitle="Үзмэр олдсонгүй"
        emptyText="Энэ үзмэр устгагдсан эсвэл нийтлэгдээгүй байж магадгүй."
      >
        {(e) => (
          <article className="exhibit-detail">
            <div className="detail-frame">
              {e.image_url ? <img src={e.image_url} alt={e.title} /> : <div className="img-empty">{e.title.slice(0, 1)}</div>}
            </div>
            <div className="detail-body">
              <p className="catalog">{catalogLabel(e)}</p>
              <h1>{e.title}</h1>
              {e.status !== 'published' && <p className={`badge badge-${e.status}`}>{STATUS_LABELS[e.status]}</p>}
              <p className="detail-description">{e.description}</p>
              <dl className="detail-meta">
                <div>
                  <dt>Зохиогч</dt>
                  <dd><Link to={`/creators/${e.creator_id}`}>{e.creator?.display_name}</Link></dd>
                </div>
                <div><dt>Он</dt><dd>{e.year_created}</dd></div>
                {e.category && <div><dt>Ангилал</dt><dd>{e.category.name}</dd></div>}
                {e.technology_stack.length > 0 && (
                  <div>
                    <dt>Технологи</dt>
                    <dd className="chips">
                      {e.technology_stack.map((t) => (
                        <Link key={t} className="chip" to={`/exhibits?tech=${encodeURIComponent(t)}`}>{t}</Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="hero-actions">
                {e.demo_url && <a className="btn btn-primary" href={e.demo_url} target="_blank" rel="noreferrer noopener">Demo үзэх</a>}
                {e.github_url && <a className="btn" href={e.github_url} target="_blank" rel="noreferrer noopener">GitHub</a>}
                {(isAdmin || user?.id === e.creator_id) && <Link className="btn" to={`/dashboard/${e.id}/edit`}>Засах</Link>}
              </div>
            </div>
          </article>
        )}
      </LoadBoundary>
    </div>
  );
}
