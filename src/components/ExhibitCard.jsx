import { Link } from 'react-router-dom';
import { catalogLabel } from '../lib/format.js';

// Үзмэрийг музейн ханын шошго (wall label) хэлбэрээр харуулна.
export default function ExhibitCard({ exhibit }) {
  return (
    <article className="exhibit-card">
      <Link to={`/exhibits/${exhibit.id}`} className="exhibit-link">
        <div className="exhibit-frame">
          {exhibit.image_url ? (
            <img src={exhibit.image_url} alt="" loading="lazy" />
          ) : (
            <div className="img-empty" aria-hidden="true">{exhibit.title.slice(0, 1)}</div>
          )}
        </div>
        <div className="wall-label">
          <p className="catalog">{catalogLabel(exhibit)}</p>
          <h3>{exhibit.title}</h3>
          <p className="label-meta">
            {exhibit.creator?.display_name}, {exhibit.year_created}
          </p>
          <p className="label-medium">{exhibit.technology_stack.join(' · ')}</p>
        </div>
      </Link>
    </article>
  );
}
