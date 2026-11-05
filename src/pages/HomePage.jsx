import { Link } from 'react-router-dom';
import { fetchPublishedExhibits, fetchStats } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import ExhibitCard from '../components/ExhibitCard.jsx';
import { ErrorState, Loading } from '../components/States.jsx';

const HALLS = [
  ['/exhibits', 'Дижитал үзэсгэлэн', 'Оюутнуудын бүтээл, судалгаа, технологийн төслүүд'],
  ['/time-machine', 'ISM Time Machine', 'Он жилүүдээр аялж, тэнхимийн хөгжлийг үзэх'],
  ['/history', 'Тэнхимийн түүх', 'Хөгжлийн үе шат, онцлох үйл явдлууд'],
  ['/teachers', 'Багш нар', 'Тэнхимийн багш нарын танилцуулга'],
  ['/events', 'Өдөрлөг, арга хэмжээ', 'Семинар, тэмцээн, өдөрлөгийн зурагт цомог'],
  ['/creators', 'ISM Creators', 'Бүтээлийнх нь ард буй оюутнууд'],
];

export default function HomePage() {
  const stats = useLoad(fetchStats);
  const exhibits = useLoad(fetchPublishedExhibits);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Мэдээллийн Системийн Менежментийн Тэнхим</p>
        <h1>Тэнхимийн түүх, бүтээл нэг дор хадгалагдах музей</h1>
        <p className="hero-lead">
          Анхны дотоод системээс хиймэл оюуны туслах хүртэл: оюутан, багш нарын бүтээсэн бүхнийг он цагаар нь аялж үзээрэй.
        </p>
        <div className="hero-actions">
          <Link to="/exhibits" className="btn btn-primary">Үзэсгэлэн үзэх</Link>
          <Link to="/time-machine" className="btn">Цаг хугацаагаар аялах</Link>
        </div>
        {stats.data && (
          <dl className="hero-stats">
            <div><dt>Үзмэр</dt><dd>{stats.data.exhibits}</dd></div>
            <div><dt>Багш</dt><dd>{stats.data.teachers}</dd></div>
            <div><dt>Арга хэмжээ</dt><dd>{stats.data.events}</dd></div>
          </dl>
        )}
      </section>

      <section className="page halls" aria-labelledby="halls-title">
        <h2 id="halls-title" className="section-title">Танхимууд</h2>
        <ol className="hall-list">
          {HALLS.map(([to, title, text], i) => (
            <li key={to}>
              <Link to={to}>
                <span className="hall-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="hall-title">{title}</span>
                <span className="hall-text">{text}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="page" aria-labelledby="latest-title">
        <div className="section-head">
          <h2 id="latest-title" className="section-title">Шинэ үзмэрүүд</h2>
          <Link to="/exhibits" className="text-link">Бүх үзмэр →</Link>
        </div>
        {exhibits.loading && <Loading />}
        {exhibits.error && <ErrorState error={exhibits.error} onRetry={exhibits.reload} />}
        {exhibits.data && (
          <div className="exhibit-grid">
            {exhibits.data.slice(0, 3).map((e) => <ExhibitCard key={e.id} exhibit={e} />)}
          </div>
        )}
      </section>
    </>
  );
}
