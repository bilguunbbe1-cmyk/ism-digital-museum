// Жишээ өгөгдөлд зориулсан хийсвэр зургуудыг public/seed/ руу үүсгэнэ.
// Бусдын зураг ашиглахгүйн тулд бүгдийг кодоор зурав.
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/seed/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 800;
const PALETTES = [
  ['#1533b8', '#f2efe6', '#e8b73a'],
  ['#16140f', '#f2efe6', '#1533b8'],
  ['#c8401f', '#16140f', '#f2efe6'],
  ['#0f6b5c', '#f2efe6', '#16140f'],
  ['#e8b73a', '#16140f', '#c8401f'],
  ['#f2efe6', '#1533b8', '#c8401f'],
];

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const COMPOSITIONS = {
  grid(r, [, fg, accent]) {
    let out = '';
    for (let x = 0; x < 12; x += 1) {
      for (let y = 0; y < 8; y += 1) {
        const v = r();
        if (v < 0.45) continue;
        out += `<rect x="${x * 100 + 8}" y="${y * 100 + 8}" width="84" height="84" fill="${v > 0.88 ? accent : fg}" />`;
      }
    }
    return out;
  },
  bars(r, [, fg, accent]) {
    let out = '';
    for (let x = 0; x < 16; x += 1) {
      const h = 120 + r() * 560;
      out += `<rect x="${x * 75 + 10}" y="${H - h}" width="56" height="${h}" fill="${x % 5 === 3 ? accent : fg}" />`;
    }
    return out;
  },
  rings(r, [, fg, accent]) {
    const cx = 300 + r() * 600;
    const cy = 200 + r() * 400;
    let out = '';
    for (let i = 14; i > 0; i -= 1) {
      out += `<circle cx="${cx}" cy="${cy}" r="${i * 62}" fill="none" stroke="${i % 4 === 0 ? accent : fg}" stroke-width="${i % 4 === 0 ? 22 : 8}" />`;
    }
    return out;
  },
  circuit(r, [, fg, accent]) {
    let out = '';
    for (let i = 0; i < 26; i += 1) {
      let x = Math.round(r() * 12) * 100;
      let y = Math.round(r() * 8) * 100;
      let d = `M${x} ${y}`;
      for (let s = 0; s < 4; s += 1) {
        if (r() > 0.5) x += (r() > 0.5 ? 1 : -1) * 200;
        else y += (r() > 0.5 ? 1 : -1) * 200;
        d += ` L${x} ${y}`;
      }
      out += `<path d="${d}" fill="none" stroke="${fg}" stroke-width="10" />`;
      out += `<circle cx="${x}" cy="${y}" r="22" fill="${accent}" />`;
    }
    return out;
  },
  stairs(r, [, fg, accent]) {
    let out = '';
    const n = 9;
    for (let i = 0; i < n; i += 1) {
      const y = i * (H / n);
      out += `<rect x="0" y="${y}" width="${(i + 1) * (W / n)}" height="${H / n}" fill="${i === Math.floor(r() * n) ? accent : fg}" />`;
    }
    return out;
  },
  waves(r, [, fg, accent]) {
    let out = '';
    for (let i = 0; i < 12; i += 1) {
      const y = 60 + i * 64;
      const a = 30 + r() * 60;
      const d = `M0 ${y} C 300 ${y - a}, 300 ${y + a}, 600 ${y} S 900 ${y - a}, 1200 ${y}`;
      out += `<path d="${d}" fill="none" stroke="${i % 5 === 2 ? accent : fg}" stroke-width="${i % 5 === 2 ? 26 : 10}" />`;
    }
    return out;
  },
};

function art(seed, composition) {
  const palette = PALETTES[seed % PALETTES.length];
  const body = COMPOSITIONS[composition](rng(seed * 7919 + 13), palette);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${palette[0]}"/>${body}</svg>\n`;
}

const names = Object.keys(COMPOSITIONS);
for (let i = 1; i <= 8; i += 1) {
  writeFileSync(new URL(`exhibit-${i}.svg`, OUT), art(i, names[i % names.length]));
}
for (let e = 1; e <= 4; e += 1) {
  for (let p = 1; p <= 4; p += 1) {
    writeFileSync(new URL(`event-${e}-${p}.svg`, OUT), art(e * 10 + p, names[(e + p) % names.length]));
  }
}
console.log('seed art written');
