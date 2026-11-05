import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterExhibits, filterOptions } from '../src/lib/filter.js';

const data = [
  { title: 'Номын санч', description: 'Дотоод систем', year_created: 2016, technology_stack: ['PHP', 'MySQL'], category: { id: 'web', name: 'Вэб систем' }, creator: { display_name: 'Тэмүүлэн' } },
  { title: 'Цэвэр агаар', description: 'Дашборд', year_created: 2020, technology_stack: ['Python'], category: { id: 'data', name: 'Өгөгдөл' }, creator: { display_name: 'Номин' } },
  { title: 'Ангилалгүй', description: 'x', year_created: 2020, technology_stack: [], category: null, creator: null },
];
const titles = (rows) => rows.map((r) => r.title);

test('шүүлтгүй бол бүгдийг буцаана', () => {
  assert.equal(filterExhibits(data).length, 3);
});

test('том жижиг үсэг ялгахгүй нэрээр хайна', () => {
  assert.deepEqual(titles(filterExhibits(data, { q: 'НОМЫН' })), ['Номын санч']);
});

test('бүтээгч, он, технологиор текстээр хайна', () => {
  assert.deepEqual(titles(filterExhibits(data, { q: 'номин' })), ['Цэвэр агаар']);
  assert.deepEqual(titles(filterExhibits(data, { q: '2016' })), ['Номын санч']);
  assert.deepEqual(titles(filterExhibits(data, { q: 'python' })), ['Цэвэр агаар']);
});

test('ангилал, он, технологийн шүүлтүүрүүд хамтдаа ажиллана', () => {
  assert.deepEqual(titles(filterExhibits(data, { category: 'data', year: '2020' })), ['Цэвэр агаар']);
  assert.deepEqual(titles(filterExhibits(data, { tech: 'PHP', year: '2020' })), []);
});

test('үр дүнгүй хайлт хоосон массив буцаана', () => {
  assert.deepEqual(filterExhibits(data, { q: 'байхгүй үг' }), []);
});

test('шүүлтүүрийн сонголтыг давхардалгүй гаргана', () => {
  const o = filterOptions(data);
  assert.deepEqual(o.years, [2020, 2016]);
  assert.deepEqual(o.techs, ['MySQL', 'PHP', 'Python']);
  assert.equal(o.categories.length, 2);
});
