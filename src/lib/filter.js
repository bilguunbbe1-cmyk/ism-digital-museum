// Үзмэрийн хайлт, шүүлтийн цэвэр функцүүд (React-аас хамааралгүй, тестлэхэд хялбар).

export function filterExhibits(exhibits, { q = '', category = '', year = '', tech = '' } = {}) {
  const needle = q.trim().toLocaleLowerCase('mn');
  return exhibits.filter((e) => {
    if (category && e.category?.id !== category) return false;
    if (year && String(e.year_created) !== String(year)) return false;
    if (tech && !e.technology_stack.includes(tech)) return false;
    if (!needle) return true;
    const haystack = [
      e.title,
      e.description,
      e.creator?.display_name,
      e.category?.name,
      String(e.year_created),
      ...e.technology_stack,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('mn');
    return haystack.includes(needle);
  });
}

export function filterOptions(exhibits) {
  const years = [...new Set(exhibits.map((e) => e.year_created))].sort((a, b) => b - a);
  const techs = [...new Set(exhibits.flatMap((e) => e.technology_stack))].sort((a, b) => a.localeCompare(b));
  const categories = new Map();
  exhibits.forEach((e) => e.category && categories.set(e.category.id, e.category.name));
  return {
    years,
    techs,
    categories: [...categories].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
