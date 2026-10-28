// Partikelfeuer mit Blitzen auf <canvas>. Farben/Größe/Blitze kommen aus TIERS (streak.js).
// Stoppt von selbst, sobald das Canvas aus dem DOM entfernt wird (z. B. beim Neurendern).
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function createFire(canvas, tier) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, parts = [], bolts = [], sprites = [], boost = 0, lastT = 0, warm = true;

  const fit = () => {
    const r = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * r; canvas.height = H * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas); fit();

  // 16 vorgerenderte Farbstufen statt eines Verlaufs pro Partikel (sonst zu langsam auf dem Handy)
  function buildSprites() {
    const [o, m, core] = tier.c.map(hex);
    sprites = Array.from({ length: 16 }, (_, i) => {
      const life = i / 15;
      const [r, g, b] = life < .5 ? mix(core, m, life * 2) : mix(m, o, (life - .5) * 2);
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
      gr.addColorStop(.4, `rgba(${r},${g},${b},.45)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      return c;
    });
  }

  function spawn() {
    const s = tier.size * (1 + boost * .3);
    parts.push({ x: W / 2 + (Math.random() - .5) * W * .22 * s, y: H * .84, vy: -(1.8 + Math.random() * 2) * s * (H / 300),
      r: (22 + Math.random() * 16) * s * (W / 300), life: 0, ttl: 45 + Math.random() * 35 });
  }

  function bolt() { // Mittelpunktverschiebung: gezackte Linie von oben in die Flamme
    let pts = [[W / 2 + (Math.random() - .5) * W * .9, -10], [W / 2 + (Math.random() - .5) * 30, H * .6]];
    for (let k = 0, off = W * .18; k < 5; k++, off /= 2) {
      const n = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = [pts[i - 1], pts[i]];
        n.push([(a[0] + b[0]) / 2 + (Math.random() - .5) * off, (a[1] + b[1]) / 2], b);
      }
      pts = n;
    }
    bolts.push({ pts, life: 12 });
  }

  function step() { // ein fester 60-Hz-Schritt
    const rate = Math.round(3 + 2 * tier.size + boost * 3);
    for (let i = 0; i < rate; i++) spawn();
    parts = parts.filter((p) => p.life < p.ttl);
    for (const p of parts) {
      p.life++;
      p.x += (W / 2 - p.x) * .035 + Math.sin((p.y + p.life * 3) * .045) * .9; // zur Mitte ziehen: Flammenspitze
      p.y += p.vy;
    }
    if (!reduce() && Math.random() < tier.bolts * .012 + boost * .15) bolt();
    bolts = bolts.filter((b) => b.life-- > 0);
    boost = Math.max(0, boost - .012);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(W / 2, H * .72, 0, W / 2, H * .72, W * .55 * tier.size * (1 + boost * .5));
    glow.addColorStop(0, `rgba(${hex(tier.c[1])},${.26 + boost * .3})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    for (const p of parts) {
      const t = p.life / p.ttl, r = p.r * (1 - t * .85);
      ctx.globalAlpha = .2 / (tier.size * tier.size) * (1 - t) * Math.min(1, p.life / 6); // große Stufen: mehr Partikel, daher weniger Deckkraft
      ctx.drawImage(sprites[Math.min(15, t * 16 | 0)], p.x - r, p.y - r, r * 2, r * 2);
    }
    for (const b of bolts) {
      ctx.strokeStyle = tier.boltC; ctx.shadowColor = tier.boltC; ctx.shadowBlur = 18;
      ctx.globalAlpha = b.life / 12; ctx.lineWidth = 1 + b.life / 5;
      ctx.beginPath(); b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  function frame(now) {
    if (!canvas.isConnected) { ro.disconnect(); return; }
    // zeitbasiert: gleich schnell auf 60 und 120 Hz; nach Pausen max. 1 s nachholen
    let n = lastT ? Math.min(60, Math.round((now - lastT) / 16.7)) : 1;
    if (warm) { n = 70; warm = false; } else if (reduce()) n = 0;
    lastT = now;
    for (let i = 0; i < n; i++) step();
    if (n) draw();
    requestAnimationFrame(frame);
  }

  buildSprites();
  requestAnimationFrame(frame);
  return {
    set(t) { if (t !== tier) { tier = t; buildSprites(); if (reduce()) { parts = []; warm = true; } } },
    burst() { boost = 1; if (!reduce()) for (let i = 0; i < 3; i++) bolt(); },
  };
}
