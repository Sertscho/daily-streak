// Konfetti-Burst auf einem Canvas. Entfernt sich nach ca. 1,8 s selbst.
const COLORS = ['#FFB020', '#FF7A1A', '#E8431A', '#FFF1C9'];

export function burst() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dpr = window.devicePixelRatio || 1;
  const w = innerWidth, h = innerHeight;
  const cv = document.createElement('canvas');
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: 120 }, () => {
    const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 10;
    return {
      x: w / 2, y: h * 0.35, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      s: 5 + Math.random() * 6, c: COLORS[(Math.random() * COLORS.length) | 0], round: Math.random() < 0.4,
    };
  });
  const T = 1800, t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    if (t >= T) { cv.remove(); return; }
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.min(1, (T - t) / 500);
    for (const p of parts) {
      p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.35; // Luftwiderstand + Schwerkraft
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  })(t0);
}
