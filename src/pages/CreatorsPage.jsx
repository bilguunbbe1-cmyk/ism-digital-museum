import { Link } from 'react-router-dom';
import { fetchCreators } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import Avatar from '../components/Avatar.jsx';
import { LoadBoundary } from '../components/States.jsx';

export default function CreatorsPage() {
  const load = useLoad(fetchCreators);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Танхим 06</p>
        <h1>ISM Creators</h1>
        <p className="lead">Үзмэрүүдийн ард буй оюутнууд. Бүтээлээ нэмэхийг хүсвэл бүртгүүлээрэй.</p>
      </header>
      <LoadBoundary load={load} emptyTitle="Бүтээгч алга" emptyText="Нийтлэгдсэн бүтээлтэй оюутан энд харагдана.">
        {(creators) => (
          <div className="people-grid">
            {creators.map((c) => (
              <article key={c.id} className="person-card">
                <Avatar name={c.display_name} src={c.avatar_url} size="lg" />
                <div>
                  <h2><Link to={`/creators/${c.id}`}>{c.display_name}</Link></h2>
                  {c.bio && <p>{c.bio}</p>}
                  <p className="mini-title">{c.exhibits.length} бүтээл</p>
                  <ul className="plain-list">
                    {c.exhibits.map((e) => (
                      <li key={e.id}><Link to={`/exhibits/${e.id}`}>{e.title}</Link>, {e.year_created}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}
      </LoadBoundary>
    </div>
  );
}
