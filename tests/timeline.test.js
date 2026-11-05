import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, nearestYearIndex } from '../src/lib/timeline.js';

const input = {
  milestones: [{ id: 'm', year: 2018, title: 'Нээгдэв' }],
  events: [{ id: 'e', event_date: '2020-05-01', title: 'Өдөрлөг' }],
  exhibits: [
    { id: 'a', year_created: 2020, technology_stack: ['PHP', 'MySQL'] },
    { id: 'b', year_created: 2022, technology_stack: ['PHP', 'React'] },
  ],
};

test('гурван эх сурвалжийг оноор нь эрэмбэлж нэгтгэнэ', () => {
  const t = buildTimeline(input);
  assert.deepEqual(t.map((y) => y.year), [2018, 2020, 2022]);
  assert.equal(t[1].events.length, 1);
  assert.equal(t[1].exhibits.length, 1);
});

test('тухайн онд анх гарсан технологийг ялгана', () => {
  const t = buildTimeline(input);
  assert.deepEqual(t[1].newTechnologies, ['MySQL', 'PHP']);
  assert.deepEqual(t[2].newTechnologies, ['React']);
});

test('технологийн хэрэглээг он дараалан хуримтлуулна', () => {
  const t = buildTimeline(input);
  assert.deepEqual(t[0].topTechnologies, []);
  assert.deepEqual(t[2].topTechnologies[0], { name: 'PHP', count: 2 });
});

test('хоосон өгөгдөлд хоосон үр дүн', () => {
  assert.deepEqual(buildTimeline({}), []);
  assert.equal(nearestYearIndex([], 2020), -1);
});

test('өгөгдөлгүй оны хувьд хамгийн ойрын оныг олно', () => {
  const t = buildTimeline(input);
  assert.equal(nearestYearIndex(t, 2021), 1);
  assert.equal(nearestYearIndex(t, 1990), 0);
  assert.equal(nearestYearIndex(t, 2030), 2);
});
