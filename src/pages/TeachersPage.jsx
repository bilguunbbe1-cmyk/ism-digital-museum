import { fetchTeachers } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import Avatar from '../components/Avatar.jsx';
import { LoadBoundary } from '../components/States.jsx';

export default function TeachersPage() {
  const load = useLoad(fetchTeachers);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Танхим 04</p>
        <h1>Тэнхимийн багш нар</h1>
      </header>
      <LoadBoundary load={load} emptyTitle="Багшийн мэдээлэл алга" emptyText="Мэдээлэл нэмэгдэхэд энд харагдана.">
        {(teachers) => (
          <div className="people-grid">
            {teachers.map((t) => (
              <article key={t.id} className="person-card">
                <Avatar name={t.name} src={t.photo_url} size="lg" />
                <div>
                  <h2>{t.name}</h2>
                  <p className="person-role">{t.position}</p>
                  {t.bio && <p>{t.bio}</p>}
                  {t.courses.length > 0 && (
                    <>
                      <p className="mini-title">Заадаг хичээл</p>
                      <ul className="plain-list">
                        {t.courses.map((c) => <li key={c}>{c}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </LoadBoundary>
    </div>
  );
}
