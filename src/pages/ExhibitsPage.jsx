import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPublishedExhibits } from '../lib/api.js';
import { filterExhibits, filterOptions } from '../lib/filter.js';
import { useLoad } from '../hooks/useLoad.js';
import ExhibitCard from '../components/ExhibitCard.jsx';
import { LoadBoundary, Message } from '../components/States.jsx';

export default function ExhibitsPage() {
  const load = useLoad(fetchPublishedExhibits);
  // Шүүлтийг URL-д хадгалснаар холбоос хуваалцах, буцах товч ажиллана.
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    year: params.get('year') || '',
    tech: params.get('tech') || '',
  };
  const hasFilters = Object.values(filters).some(Boolean);

  const options = useMemo(() => filterOptions(load.data || []), [load.data]);
  const results = useMemo(
    () => filterExhibits(load.data || [], filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [load.data, filters.q, filters.category, filters.year, filters.tech],
  );

  function setFilter(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Танхим 01</p>
        <h1>Дижитал үзэсгэлэн</h1>
        <p className="lead">Оюутнуудын бүтээл, судалгаа, технологийн төслүүд.</p>
      </header>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="filter-search">
          <span>Хайх</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Нэр, бүтээгч, он, технологи…"
          />
        </label>
        <label>
          <span>Ангилал</span>
          <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">Бүгд</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          <span>Он</span>
          <select value={filters.year} onChange={(e) => setFilter('year', e.target.value)}>
            <option value="">Бүгд</option>
            {options.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          <span>Технологи</span>
          <select value={filters.tech} onChange={(e) => setFilter('tech', e.target.value)}>
            <option value="">Бүгд</option>
            {options.techs.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </form>

      <LoadBoundary
        load={load}
        emptyTitle="Үзэсгэлэн одоогоор хоосон байна"
        emptyText="Нийтлэгдсэн үзмэр нэмэгдэхэд энд харагдана."
      >
        {() =>
          results.length ? (
            <>
              <p className="result-count" aria-live="polite">{results.length} үзмэр олдлоо</p>
              <div className="exhibit-grid">
                {results.map((e) => <ExhibitCard key={e.id} exhibit={e} />)}
              </div>
            </>
          ) : (
            <Message title="Хайлтад тохирох үзмэр олдсонгүй">
              <p>Өөр үгээр хайх эсвэл шүүлтүүрээ цэвэрлэж үзнэ үү.</p>
              {hasFilters && (
                <button type="button" className="btn" onClick={() => setParams({}, { replace: true })}>
                  Шүүлтүүр цэвэрлэх
                </button>
              )}
            </Message>
          )
        }
      </LoadBoundary>
    </div>
  );
}
