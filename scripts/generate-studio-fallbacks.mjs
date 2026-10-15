// Original vector fallback assets; no third-party artwork.
import { writeFileSync } from 'node:fs';
const faces = [];
const project = ([x, y, z]) => [400 + (x - z) * 63, 280 + (x + z) * 26 - y * 69];
for (let y = -1; y <= 1; y++)
  for (let z = -1; z <= 1; z++)
    for (let x = -1; x <= 1; x++) {
      const a = 0.46;
      const face = (pts, fill) => {
        const coords = pts
          .map(project)
          .map((p) => p.join(','))
          .join(' ');
        faces.push({
          depth: x + z + y * 0.01,
          svg: `<polygon points="${coords}" fill="${fill}" stroke="#4d5757" stroke-width=".65" stroke-linejoin="round"/>`,
        });
      };
      if (x === 1)
        face(
          [
            [x + a, y - a, z - a],
            [x + a, y + a, z - a],
            [x + a, y + a, z + a],
            [x + a, y - a, z + a],
          ],
          'url(#right)',
        );
      if (z === 1)
        face(
          [
            [x - a, y - a, z + a],
            [x - a, y + a, z + a],
            [x + a, y + a, z + a],
            [x + a, y - a, z + a],
          ],
          'url(#left)',
        );
      if (y === 1)
        face(
          [
            [x - a, y + a, z - a],
            [x + a, y + a, z - a],
            [x + a, y + a, z + a],
            [x - a, y + a, z + a],
          ],
          'url(#top)',
        );
    }
writeFileSync(
  'public/images/growora-cube-still.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560"><defs><linearGradient id="top" x2="1" y2="1"><stop stop-color="#45504f"/><stop offset="1" stop-color="#171d1b"/></linearGradient><linearGradient id="right" x2="1" y2="1"><stop stop-color="#252d2b"/><stop offset="1" stop-color="#0c100f"/></linearGradient><linearGradient id="left" x2="1" y2="1"><stop stop-color="#151b19"/><stop offset="1" stop-color="#313b39"/></linearGradient></defs>${faces
    .sort((a, b) => a.depth - b.depth)
    .map((f) => f.svg)
    .join('')}</svg>`,
);
writeFileSync(
  'public/images/growora-fluid-still.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500"><defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#153f50"/><stop offset=".3" stop-color="#98dbe8" stop-opacity=".8"/><stop offset=".52" stop-color="#237f9b" stop-opacity=".4"/><stop offset=".8" stop-color="#77c5d7"/><stop offset="1" stop-color="#204c60"/></linearGradient></defs><g transform="rotate(-25 300 250)"><path d="M160 240 C130 70 380 80 430 185 S290 425 195 335 S330 130 388 205 S240 395 170 265" fill="none" stroke="url(#r)" stroke-width="42"/><path d="M160 225 C150 92 370 91 417 186 S290 405 206 330" fill="none" stroke="#b5e7f1" stroke-opacity=".45" stroke-width="2"/></g></svg>`,
);
