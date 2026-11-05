import { friendlyError } from '../lib/api.js';

export function Loading({ label = 'Ачаалж байна…' }) {
  return <p className="state" role="status">{label}</p>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p className="state-title">Өгөгдлийг ачаалж чадсангүй</p>
      <p>{friendlyError(error)}</p>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Дахин оролдох</button>}
    </div>
  );
}

export function Message({ title, children }) {
  return (
    <div className="state">
      <p className="state-title">{title}</p>
      {children && <div>{children}</div>}
    </div>
  );
}

// Ачаалах, алдаа, хоосон төлвийг нэг дор зохицуулна.
export function LoadBoundary({ load, emptyTitle, emptyText, children }) {
  if (load.loading && !load.data) return <Loading />;
  if (load.error) return <ErrorState error={load.error} onRetry={load.reload} />;
  const empty = !load.data || (Array.isArray(load.data) && load.data.length === 0);
  if (empty) return <Message title={emptyTitle}>{emptyText}</Message>;
  return children(load.data);
}
