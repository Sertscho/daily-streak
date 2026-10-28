// Reine Streak-Logik: kein DOM, kein localStorage.
import { addDays, diffDays, isoWeekKey } from './date.js';

export function isDayComplete(day) {
  return Array.isArray(day?.gains) && day.gains.filter((g) => String(g).trim() !== '').length >= 3;
}

export function computeStreak(days, today) {
  const keys = Object.keys(days ?? {}).sort();
  const todayDone = isDayComplete(days?.[today]);
  const bridgedWeeks = new Set();
  const bridged = [];
  let run = 0;
  let best = 0;

  if (keys.length && keys[0] <= today) {
    const n = diffDays(keys[0], today);
    for (let i = 0; i <= n; i++) {
      const d = addDays(keys[0], i);
      if (isDayComplete(days[d])) {
        run++;
        best = Math.max(best, run);
      } else if (d === today) {
        // Tag läuft noch.
      } else {
        const next = addDays(d, 1);
        const week = isoWeekKey(d);
        if (run > 0 && isDayComplete(days[addDays(d, -1)]) && !bridgedWeeks.has(week)
            && (next === today || isDayComplete(days[next]))) {
          bridged.push(d);
          bridgedWeeks.add(week);
        } else {
          run = 0;
        }
      }
    }
  }

  return {
    current: run,
    best,
    todayDone,
    bridged,
    freezeAvailable: !bridgedWeeks.has(isoWeekKey(today)),
  };
}

// Feuer-Stufen nach erledigten Abenden gesamt (fällt nie zurück, auch wenn der Streak reißt)
export const TIERS = [
  { d: 0,   rank: 'E', name: 'Erwacht',   c: ['#e8432e', '#ff7a1a', '#ffb547'], size: .55, bolts: 0, boltC: '#ffd27a' },
  { d: 3,   rank: 'E', name: 'Erwacht',   c: ['#e8432e', '#ff7a1a', '#ffd27a'], size: .65, bolts: 0, boltC: '#ffd27a' },
  { d: 7,   rank: 'D', name: 'Beständig', c: ['#ff6a00', '#ffb547', '#fff1c9'], size: .78, bolts: 0, boltC: '#ffd27a' },
  { d: 30,  rank: 'C', name: 'Glühend',   c: ['#1e6bff', '#38bdf8', '#e0f7ff'], size: .88, bolts: 0, boltC: '#bfe9ff' },
  { d: 90,  rank: 'B', name: 'Arkan',     c: ['#7c3aed', '#c084fc', '#fae8ff'], size: .96, bolts: 1, boltC: '#e9d5ff' },
  { d: 180, rank: 'A', name: 'Sturm',     c: ['#0ea5e9', '#67e8f9', '#ffffff'], size: 1.04, bolts: 2, boltC: '#a5f3fc' },
  { d: 365, rank: 'S', name: 'Monarch',   c: ['#f59e0b', '#fde68a', '#ffffff'], size: 1.12, bolts: 4, boltC: '#fff7d6' },
];
export const RANKS = TIERS.filter((t, i) => i === TIERS.findIndex((x) => x.rank === t.rank));

// n = erledigte Abende gesamt
export function rankInfo(n) {
  const tier = TIERS.filter((t) => n >= t.d).at(-1);
  const rank = RANKS.filter((r) => n >= r.d).at(-1);
  const next = RANKS.find((r) => r.d > n) ?? null;
  return {
    tier, rank, next,
    toNext: next ? next.d - n : 0,
    progress: next ? (n - rank.d) / (next.d - rank.d) : 1,
    titles: RANKS.slice(1).map((r) => ({ name: r.name, rank: r.rank, d: r.d, unlocked: n >= r.d })),
  };
}

export function stats(days, today) {
  const { current, best } = computeStreak(days, today);
  const all = Object.values(days ?? {});
  return {
    totalGains: all.reduce((sum, d) => sum + (d?.gains ?? []).filter((g) => String(g).trim() !== '').length, 0),
    activeDays: all.filter(isDayComplete).length,
    current,
    best,
  };
}
