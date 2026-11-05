export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${y} оны ${m}-р сарын ${d}`;
}

// Музейн каталогийн дугаар, жишээ нь ISM.2024.007
export const catalogLabel = (exhibit) =>
  `ISM.${exhibit.year_created}.${String(exhibit.catalog_no).padStart(3, '0')}`;

export const initials = (name = '') =>
  name
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/)
    .slice(-1)[0]
    ?.slice(0, 2) || '?';

export const STATUS_LABELS = {
  pending: 'Хяналтад',
  published: 'Нийтлэгдсэн',
  rejected: 'Татгалзсан',
};
