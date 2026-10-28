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

export function fireStage(n) {
  if (n <= 0) return 'glut';
  if (n <= 2) return 'funke';
  if (n <= 6) return 'flamme';
  if (n <= 29) return 'feuer';
  return 'lagerfeuer';
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
