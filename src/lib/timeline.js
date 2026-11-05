// ISM Time Machine-ийн өгөгдлийн логик: гурван хүснэгтийг он жилээр нэгтгэнэ.

export function buildTimeline({ milestones = [], events = [], exhibits = [] }) {
  const years = new Map();
  const yearEntry = (year) => {
    if (!years.has(year)) years.set(year, { year, milestones: [], events: [], exhibits: [] });
    return years.get(year);
  };

  milestones.forEach((m) => yearEntry(m.year).milestones.push(m));
  events.forEach((e) => yearEntry(new Date(e.event_date).getUTCFullYear()).events.push(e));
  exhibits.forEach((e) => yearEntry(e.year_created).exhibits.push(e));

  const seen = new Set();
  const usage = new Map();

  return [...years.values()]
    .sort((a, b) => a.year - b.year)
    .map((entry) => {
      const technologies = [...new Set(entry.exhibits.flatMap((e) => e.technology_stack))].sort((a, b) =>
        a.localeCompare(b),
      );
      const newTechnologies = technologies.filter((t) => !seen.has(t));
      technologies.forEach((t) => seen.add(t));
      entry.exhibits.forEach((e) =>
        e.technology_stack.forEach((t) => usage.set(t, (usage.get(t) || 0) + 1)),
      );
      // Тухайн он хүртэлх хуримтлагдсан хэрэглээ: хамгийн их ашиглагдсан технологиуд.
      const topTechnologies = [...usage]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 6);
      return { ...entry, technologies, newTechnologies, topTechnologies };
    });
}

// Сонгосон оноос хамгийн ойрхон, өгөгдөлтэй оны индекс.
export function nearestYearIndex(timeline, year) {
  if (!timeline.length) return -1;
  let best = 0;
  timeline.forEach((entry, i) => {
    if (Math.abs(entry.year - year) < Math.abs(timeline[best].year - year)) best = i;
  });
  return best;
}
