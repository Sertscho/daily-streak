// Abhak-Glut: kurze Flamme im Haken + aufsteigende Glutfunken (Entwurf C, drafts/abhak-feuer.html).
export const FLAME_SVG = '<svg viewBox="0 0 24 32" aria-hidden="true"><path fill="#FF7A1A" d="M12 1c1 6 9 10 9 19a9 9 0 0 1-18 0c0-4 2-7 4-9 0 3 1 5 3 6-1-5 0-11 2-16z"/><path fill="#FFE6A8" d="M12 14c1 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-6 0 2 1 3 2 3-1-2-1-5 0-7z"/></svg>';

let cv = null, parts = [];

export function ignite(tick) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = document.createElement('span');
  f.className = 'r-flame';
  f.innerHTML = FLAME_SVG;
  tick.append(f);
  f.animate([
    { transform: 'scale(.2)', opacity: 0 },
    { transform: 'scale(1.1, 1)', opacity: 1, offset: .3 },
    { transform: 'scale(.9, 1.1)', offset: .55 },
    { transform: 'translateY(-2px) scale(0)', opacity: 0 },
  ], { duration: 520, easing: 'ease-out' }).finished.catch(() => {}).finally(() => f.remove());
  const r = tick.getBoundingClientRect();
  embers(r.left + r.width / 2, r.top + r.height / 2);
}

function embers(x, y) {
  const now = performance.now();
  for (let i = 0; i < 12; i++) parts.push({
    x: x + (Math.random() - .5) * 10, y: y - 4, vx: (Math.random() - .5) * 1.4, vy: -(1.2 + Math.random() * 1.6),
    r: 1.4 + Math.random() * 1.8, t0: now + Math.random() * 120, life: 700 + Math.random() * 450,
  });
  if (cv) return; // läuft schon, neue Funken fliegen einfach mit
  const dpr = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
  cv = document.createElement('canvas');
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.globalCompositeOperation = 'lighter';
  (function frame(t) {
    ctx.clearRect(0, 0, w, h);
    parts = parts.filter((p) => t - p.t0 < p.life);
    if (!parts.length) { cv.remove(); cv = null; return; }
    for (const p of parts) {
      const k = (t - p.t0) / p.life;
      if (k < 0) continue;
      p.vy *= .97; p.vx += (Math.random() - .5) * .12; p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = `hsla(${45 - 37 * k}, 100%, ${84 - 34 * k}%, ${1 - k * k})`; // kühlt von Gelb zu Rot ab
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - k * .6), 0, 7); ctx.fill();
    }
    requestAnimationFrame(frame);
  })(now);
}
