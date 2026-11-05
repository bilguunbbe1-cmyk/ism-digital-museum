import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchEvents, fetchMilestones, fetchPublishedExhibits } from '../lib/api.js';
import { buildTimeline, nearestYearIndex } from '../lib/timeline.js';
import { catalogLabel, formatDate } from '../lib/format.js';
import { useLoad } from '../hooks/useLoad.js';
import { LoadBoundary } from '../components/States.jsx';

const PLAY_INTERVAL_MS = 2200;

async function loadTimeline() {
  const [milestones, events, exhibits] = await Promise.all([
    fetchMilestones(),
    fetchEvents(),
    fetchPublishedExhibits(),
  ]);
  return buildTimeline({ milestones, events, exhibits });
}

function TechMeter({ entry }) {
  const max = Math.max(1, ...entry.topTechnologies.map((t) => t.count));
  if (!entry.topTechnologies.length) {
    return <p className="tm-empty">Энэ он хүртэл бүртгэгдсэн технологи алга.</p>;
  }
  return (
    <ul className="tm-meter">
      {entry.topTechnologies.map((t) => (
        <li key={t.name}>
          <span className="tm-meter-name">{t.name}</span>
          <span className="tm-meter-track" aria-hidden="true">
            <span style={{ width: `${(t.count / max) * 100}%` }} />
          </span>
          <span className="tm-meter-count">{t.count}</span>
        </li>
      ))}
    </ul>
  );
}

function Machine({ timeline }) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get('year'));
  const index = requested ? nearestYearIndex(timeline, requested) : timeline.length - 1;
  const entry = timeline[index];
  const [playing, setPlaying] = useState(false);

  const goTo = (i) => setParams({ year: String(timeline[i].year) }, { replace: true });

  // Автомат аялал: дуусмагц зогсоно.
  useEffect(() => {
    if (!playing) return undefined;
    if (index >= timeline.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => goTo(index + 1), PLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index]);

  function togglePlay() {
    if (!playing && index >= timeline.length - 1) goTo(0);
    setPlaying((p) => !p);
  }

  const counts = (e) => e.milestones.length + e.events.length + e.exhibits.length;
  const maxCount = Math.max(...timeline.map(counts));

  return (
    <>
      <div className="tm-console">
        <div className="tm-year-display" aria-live={playing ? 'off' : 'polite'}>
          <span className="tm-year" key={entry.year}>{entry.year}</span>
          <p className="tm-summary">
            {entry.milestones.length} үйл явдал · {entry.events.length} арга хэмжээ · {entry.exhibits.length} бүтээл
          </p>
        </div>
        <div className="tm-controls">
          <button type="button" onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0} aria-label="Өмнөх он">←</button>
          <button type="button" className="tm-play" onClick={togglePlay}>{playing ? 'Зогсоох' : 'Аялах'}</button>
          <button type="button" onClick={() => goTo(Math.min(timeline.length - 1, index + 1))} disabled={index === timeline.length - 1} aria-label="Дараагийн он">→</button>
        </div>
      </div>

      <div className="tm-dial">
        <div className="tm-ticks" aria-hidden="true">
          {timeline.map((e, i) => (
            <button
              key={e.year}
              type="button"
              tabIndex={-1}
              className={`tm-tick${i === index ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
            >
              <span className="tm-tick-bar" style={{ height: `${20 + (counts(e) / maxCount) * 80}%` }} />
              <span className="tm-tick-label">{e.year}</span>
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="tm-range">Он сонгох</label>
        <input
          id="tm-range"
          className="tm-range"
          type="range"
          min={0}
          max={timeline.length - 1}
          value={index}
          aria-valuetext={String(entry.year)}
          onChange={(e) => {
            setPlaying(false);
            goTo(Number(e.target.value));
          }}
        />
      </div>

      <div className="tm-room" key={entry.year}>
        <section>
          <h2>Тэнхимийн түүх</h2>
          {entry.milestones.length === 0 && <p className="tm-empty">Энэ онд бүртгэгдсэн үйл явдал алга.</p>}
          {entry.milestones.map((m) => (
            <article key={m.id} className="tm-item">
              <h3>{m.title}</h3>
              {m.description && <p>{m.description}</p>}
            </article>
          ))}
          {entry.events.map((e) => (
            <article key={e.id} className="tm-item">
              <p className="tm-meta">{formatDate(e.event_date)}</p>
              <h3><Link to={`/events/${e.id}`}>{e.title}</Link></h3>
              {e.description && <p>{e.description}</p>}
            </article>
          ))}
        </section>

        <section>
          <h2>Тухайн оны бүтээл</h2>
          {entry.exhibits.length === 0 && <p className="tm-empty">Энэ онд нийтлэгдсэн бүтээл алга.</p>}
          {entry.exhibits.map((e) => (
            <article key={e.id} className="tm-exhibit">
              {e.image_url && <img src={e.image_url} alt="" loading="lazy" />}
              <div>
                <p className="tm-meta">{catalogLabel(e)}</p>
                <h3><Link to={`/exhibits/${e.id}`}>{e.title}</Link></h3>
                <p>{e.creator?.display_name}</p>
              </div>
            </article>
          ))}
        </section>

        <section>
          <h2>Технологийн хувьсал</h2>
          {entry.newTechnologies.length > 0 && (
            <>
              <p className="tm-meta">Энэ онд анх гарсан</p>
              <ul className="tm-new">
                {entry.newTechnologies.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </>
          )}
          <p className="tm-meta">{entry.year} он хүртэлх нийт хэрэглээ</p>
          <TechMeter entry={entry} />
        </section>
      </div>
    </>
  );
}

export default function TimeMachinePage() {
  const load = useLoad(loadTimeline);
  const hasData = useMemo(() => (load.data || []).length > 0, [load.data]);

  return (
    <div className="time-machine">
      <div className="page">
        <header className="page-head">
          <p className="eyebrow">Танхим 02 · Бүтээлч шийдэл</p>
          <h1>ISM Time Machine</h1>
          <p className="lead">
            Тэнхимийн түүх, арга хэмжээ, оюутны бүтээл болон технологийн өөрчлөлтийг он цагаар нь нэг дэлгэцэд үзүүлнэ.
            Он сонгох эсвэл «Аялах» товчоор автоматаар аялаарай.
          </p>
        </header>
        <LoadBoundary load={load} emptyTitle="Цаг хугацааны машин хоосон байна" emptyText="Өгөгдөл нэмэгдэхэд он жилүүд гарч ирнэ.">
          {(timeline) => hasData && <Machine timeline={timeline} />}
        </LoadBoundary>
      </div>
    </div>
  );
}
