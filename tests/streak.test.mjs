import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, parseISO, addDays, diffDays, weekdayMon0, isoWeekKey, formatDE } from '../js/date.js';
import { isDayComplete, computeStreak, rankInfo, stats } from '../js/streak.js';
import { defaultState, parseState, load, save, getDay, setDay, exportJSON, importJSON } from '../js/store.js';

const done = { gains: ['a', 'b', 'c'] };
// Hilfsfunktion: Tage relativ zu "today" als erledigt markieren.
const mk = (today, offsets) => Object.fromEntries(offsets.map((o) => [addDays(today, o), done]));
const T = '2026-10-28'; // Mittwoch

test('date: todayISO lokal, parseISO Mittag, diffDays, Wochentag', () => {
  assert.equal(todayISO(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(parseISO('2026-10-28').getHours(), 12);
  assert.equal(diffDays('2026-03-28', '2026-03-30'), 2);
  assert.equal(weekdayMon0('2026-10-28'), 2);
  assert.equal(weekdayMon0('2026-11-01'), 6);
});

test('date: isoWeekKey an Jahresgrenzen', () => {
  assert.equal(isoWeekKey('2026-12-31'), '2026-W53');
  assert.equal(isoWeekKey('2027-01-01'), '2026-W53');
  assert.equal(isoWeekKey('2024-12-30'), '2025-W01');
  assert.equal(isoWeekKey('2026-10-28'), '2026-W44');
});

test('date: addDays über Monat, Jahr und Sommerzeit', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(addDays('2026-03-28', 1), '2026-03-29');
  assert.equal(addDays('2026-03-29', 1), '2026-03-30');
  assert.equal(addDays('2026-10-24', 2), '2026-10-26');
  assert.equal(addDays('2026-10-25', 1), '2026-10-26');
  assert.equal(diffDays('2026-10-24', '2026-10-26'), 2);
});

test('date: formatDE', () => {
  assert.equal(formatDE('2026-10-28', 'short'), 'Mi., 28. Okt.');
  assert.equal(formatDE('2026-10-28', 'long'), 'Mittwoch, 28. Oktober 2026');
});

test('streak: leer', () => {
  assert.deepEqual(computeStreak({}, T), { current: 0, best: 0, todayDone: false, bridged: [], freezeAvailable: true });
});

test('streak: 3 Tage am Stück inkl. heute', () => {
  const r = computeStreak(mk(T, [-2, -1, 0]), T);
  assert.equal(r.current, 3);
  assert.equal(r.todayDone, true);
  assert.deepEqual(r.bridged, []);
});

test('streak: heute offen, Streak von gestern bleibt', () => {
  const r = computeStreak(mk(T, [-3, -2, -1]), T);
  assert.equal(r.current, 3);
  assert.equal(r.todayDone, false);
});

test('streak: nur 2 Gains zählen nicht', () => {
  assert.equal(isDayComplete({ gains: ['a', 'b'] }), false);
  assert.equal(isDayComplete({ gains: ['a', 'b', '  '] }), false);
  assert.equal(isDayComplete(undefined), false);
  const days = { ...mk(T, [-1]), [T]: { gains: ['a', 'b'] } };
  const r = computeStreak(days, T);
  assert.equal(r.todayDone, false);
  assert.equal(r.current, 1);
});

test('streak: ein verpasster Tag wird überbrückt', () => {
  // Mo 26.10 fehlt nicht; wir lassen Di 27.10 aus: So 25, Mo 26 erledigt, Di fehlt, Mi heute erledigt
  const days = mk(T, [-3, -2, 0]); // 25., 26., 28.
  const r = computeStreak(days, T);
  assert.deepEqual(r.bridged, ['2026-10-27']);
  assert.equal(r.current, 3);
  assert.equal(r.freezeAvailable, false);
});

test('streak: 2 verpasste Tage hintereinander -> 0', () => {
  const r = computeStreak(mk(T, [-4, -3, 0]), T); // 24., 25. erledigt; 26., 27. fehlen; heute erledigt
  assert.equal(r.current, 1);
  assert.deepEqual(r.bridged, []);
  assert.equal(r.best, 2);
});

test('streak: zweiter Fehltag in derselben Woche -> Reset', () => {
  // Mo 26 erledigt, Di 27 fehlt, Mi 28 erledigt, Do 29 fehlt, Fr 30 erledigt
  const today = '2026-10-30';
  const days = { '2026-10-25': done, '2026-10-26': done, '2026-10-28': done, '2026-10-30': done };
  // 25.10. ist Sonntag der Vorwoche; 27. wird überbrückt, 29. nicht mehr
  const r = computeStreak(days, today);
  assert.deepEqual(r.bridged, ['2026-10-27']);
  assert.equal(r.current, 1);
  assert.equal(r.best, 3);
});

test('streak: Fehltage in zwei verschiedenen Wochen -> beide überbrückt', () => {
  // Do 22 fehlt (W43), Di 27 fehlt (W44)
  const days = {
    '2026-10-20': done, '2026-10-21': done, '2026-10-23': done, '2026-10-24': done,
    '2026-10-25': done, '2026-10-26': done, '2026-10-28': done,
  };
  const r = computeStreak(days, T);
  assert.deepEqual(r.bridged, ['2026-10-22', '2026-10-27']);
  assert.equal(r.current, 7);
  assert.equal(r.freezeAvailable, false);
});

test('streak: gestern verpasst + heute offen -> Streak lebt (gestern überbrückt)', () => {
  const r = computeStreak(mk(T, [-3, -2]), T); // 25., 26. erledigt; 27. fehlt; heute offen
  assert.deepEqual(r.bridged, ['2026-10-27']);
  assert.equal(r.current, 2);
  assert.equal(r.todayDone, false);
});

test('streak: best bleibt nach Reset erhalten', () => {
  const r = computeStreak(mk(T, [-10, -9, -8, -7, -6, -1, 0]), T);
  assert.equal(r.best, 5);
  assert.equal(r.current, 2);
});

test('rankInfo: Ränge an den Grenzen', () => {
  const exp = { 0: 'E', 6: 'E', 7: 'D', 29: 'D', 30: 'C', 89: 'C', 90: 'B', 179: 'B', 180: 'A', 364: 'A', 365: 'S', 900: 'S' };
  for (const [n, r] of Object.entries(exp)) assert.equal(rankInfo(Number(n)).rank.rank, r, `n=${n}`);
  assert.equal(rankInfo(2).tier.d, 0);
  assert.equal(rankInfo(3).tier.d, 3);
});

test('rankInfo: Fortschritt, Rest und Titel', () => {
  const r = rankInfo(10);
  assert.equal(r.next.rank, 'C');
  assert.equal(r.toNext, 20);
  assert.ok(Math.abs(r.progress - 3 / 23) < 1e-9);
  assert.deepEqual(r.titles.filter((t) => t.unlocked).map((t) => t.name), ['Beständig']);
  const s = rankInfo(400);
  assert.equal(s.next, null);
  assert.equal(s.progress, 1);
  assert.equal(s.titles.every((t) => t.unlocked), true);
});

test('stats', () => {
  const days = { ...mk(T, [-1, 0]), '2026-10-01': { gains: ['x', '', ' '] } };
  assert.deepEqual(stats(days, T), { totalGains: 7, activeDays: 2, current: 2, best: 2 });
});

test('parseState: gültig mit Defaults und verworfenen Feldern', () => {
  const s = parseState(JSON.stringify({
    version: 1, foo: 1,
    days: { '2026-10-28': { gains: ['a', 'b', 'c'], goals: [{ text: 'x', done: false, extra: 1 }], zzz: 1 } },
  }));
  assert.deepEqual(s, {
    version: 1,
    days: { '2026-10-28': { gains: ['a', 'b', 'c'], goals: [{ text: 'x', done: false }] } },
    settings: defaultState().settings,
  });
});

test('parseState: ungültige Eingaben werfen deutsche Meldung', () => {
  const msg = /kein gültiges Daily-Streak-Backup/;
  assert.throws(() => parseState('{kaputt'), msg);
  assert.throws(() => parseState(JSON.stringify({ version: 2, days: {} })), msg);
  assert.throws(() => parseState(JSON.stringify({ version: 1, days: { '28.10.2026': { gains: [] } } })), msg);
  assert.throws(() => parseState(JSON.stringify({ version: 1, days: { '2026-10-28': { gains: 'abc' } } })), msg);
  assert.throws(() => parseState(JSON.stringify({ version: 1, days: { '2026-10-28': { gains: [], goals: [{ text: 1, done: true }] } } })), msg);
});

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
}

test('store: load/save/setDay/getDay/export/import mit Fake-localStorage', () => {
  const ls = fakeStorage();
  globalThis.localStorage = ls;
  try {
    assert.deepEqual(load(), defaultState());
    const st = defaultState();
    assert.equal(getDay(st, '2026-10-28'), null);
    setDay(st, '2026-10-28', { gains: ['a', 'b', 'c'] });
    assert.deepEqual(load(), st);
    assert.equal(getDay(load(), '2026-10-28').gains.length, 3);

    const text = exportJSON(st);
    assert.ok(text.includes('\n'));
    ls.m.clear();
    assert.deepEqual(importJSON(text), st);
    assert.deepEqual(load(), st);
    assert.throws(() => importJSON('nope'), /kein gültiges/);
    save(st);
  } finally {
    delete globalThis.localStorage;
  }
});

test('store: kaputte Daten werden gesichert, nicht überschrieben', () => {
  const ls = fakeStorage();
  ls.setItem('dailyStreak.v1', '{kaputt');
  globalThis.localStorage = ls;
  try {
    assert.deepEqual(load(), defaultState());
    assert.equal(ls.getItem('dailyStreak.v1'), '{kaputt');
    assert.equal(ls.getItem('dailyStreak.v1.corrupt'), '{kaputt');
  } finally {
    delete globalThis.localStorage;
  }
});

test('store: ohne localStorage -> defaultState', () => {
  assert.deepEqual(load(), defaultState());
});

test('quotes: ein Zitat pro Tag, Rotation ohne Wiederholung', async () => {
  const { QUOTES, quoteFor } = await import('../js/quotes.js');
  const seen = new Set(Array.from({ length: QUOTES.length }, (_, i) => quoteFor(addDays('2026-10-01', i))));
  assert.equal(seen.size, QUOTES.length);
  assert.equal(quoteFor('2026-10-01'), quoteFor(addDays('2026-10-01', QUOTES.length)));
  assert.ok(quoteFor('2020-02-29')); // vor dem Startdatum
  const who = (q) => q.a.split(' & ')[0];
  QUOTES.forEach((q, i) => assert.notEqual(who(q), who(QUOTES[(i + 1) % QUOTES.length]), `gleicher Autor an Tag ${i} und ${i + 1}`));
});

test('store: reminderTime wird geprüft', () => {
  const base = { version: 1, days: {} };
  assert.equal(parseState(JSON.stringify({ ...base, settings: { reminderTime: '07:30' } })).settings.reminderTime, '07:30');
  assert.equal(parseState(JSON.stringify({ ...base, settings: { reminderTime: '25:00' } })).settings.reminderTime, '21:00');
});
