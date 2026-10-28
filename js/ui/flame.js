// Animiertes SVG-Feuer. Styles/Animationen: css/home.css (global geladen, alles unter .flame).
let uid = 0;

const NAMES = { glut: 'Glut', funke: 'Funke', flamme: 'Flamme', feuer: 'Feuer', lagerfeuer: 'Lagerfeuer' };

// Zungen von außen nach innen: [Farbe, Pfad, Dauer, Verzögerung]
const TONGUES = [
  ['#E8432E', 'M100 18C112 52 150 84 156 138C160 182 134 212 100 212C66 212 40 182 44 138C48 100 78 82 84 52C90 66 94 40 100 18Z', 1.7, -0.4],
  ['#FF7A1A', 'M100 56C110 84 140 106 143 148C145 184 124 210 100 210C76 210 55 184 57 148C60 116 86 100 92 78C96 88 98 70 100 56Z', 1.3, -0.9],
  ['#FFB547', 'M100 96C108 114 130 128 130 158C130 188 116 208 100 208C84 208 70 188 70 158C70 134 90 124 96 110C98 114 99 104 100 96Z', 1.1, -0.2],
  ['#FFF1C9', 'M100 140C106 152 118 160 118 178C118 196 110 206 100 206C90 206 82 196 82 178C82 162 94 156 100 140Z', 0.9, -0.6],
];

const SPARKS = [
  [84, 190, -18, 2.6, -0.3], [118, 186, 22, 3.1, -1.4], [100, 190, 8, 2.2, -0.9], [130, 192, -26, 3.4, -2.1],
  [74, 188, 14, 2.9, -1.8], [110, 190, -10, 2.4, -0.1], [92, 192, 28, 3.6, -2.7], [124, 188, -16, 2.8, -1.1],
];

const COALS = [[80, 206, 22, 9, '#E8432E', 0], [112, 208, 26, 10, '#FF7A1A', -1.2], [96, 200, 16, 7, '#E8432E', -2.1], [128, 204, 14, 6, '#FF7A1A', -0.6]];

export function flameSVG(stage) {
  const id = `fl${++uid}`;
  const logs = stage === 'feuer' || stage === 'lagerfeuer';
  const sparks = !logs ? [] : SPARKS.slice(0, stage === 'lagerfeuer' ? 8 : 4);
  const glowR = stage === 'lagerfeuer' ? 110 : 80;

  const glow = `<defs><radialGradient id="${id}-g"><stop offset="0" stop-color="#FFB547" stop-opacity=".55"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient></defs>
<circle class="flame__glow" cx="100" cy="170" r="${glowR}" fill="url(#${id}-g)"/>`;

  const log = logs
    ? `<g class="flame__logs" fill="#5A3A26" stroke="#3B2618" stroke-width="3">
<rect x="36" y="206" width="128" height="22" rx="11" transform="rotate(10 100 217)"/>
<rect x="36" y="206" width="128" height="22" rx="11" transform="rotate(-10 100 217)"/></g>`
    : '';

  const body = stage === 'glut'
    ? COALS.map(([cx, cy, rx, ry, c, d]) =>
      `<ellipse class="flame__coal" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" style="animation-delay:${d}s"/>`).join('')
    : `<g class="flame__fire">${TONGUES.map(([c, d, dur, del]) =>
      `<path class="flame__tongue" d="${d}" fill="${c}" style="animation-duration:${dur}s;animation-delay:${del}s"/>`).join('')}</g>`;

  const sp = sparks.map(([cx, cy, dx, dur, del]) =>
    `<circle class="flame__spark" cx="${cx}" cy="${cy}" r="2.5" fill="#FFB547" style="--dx:${dx}px;animation-duration:${dur}s;animation-delay:${del}s"/>`).join('');

  return `<svg class="flame flame--${stage}" viewBox="0 0 200 240" role="img" aria-label="Feuer: ${NAMES[stage] ?? stage}" xmlns="http://www.w3.org/2000/svg">${glow}${log}${body}${sp}</svg>`;
}
