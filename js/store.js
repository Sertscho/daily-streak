// Persistenz in localStorage + Export/Import. Kein Zugriff auf Modulebene.
const KEY = 'dailyStreak.v1';
const BAD_FILE = 'Die Datei ist kein gültiges Daily-Streak-Backup.';
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function defaultState() {
  return { version: 1, days: {}, settings: { reminder: false, reminderTime: '21:00', lastNotified: null } };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function parseState(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { throw new Error(BAD_FILE); }
  if (!isObj(raw) || raw.version !== 1 || !isObj(raw.days)) throw new Error(BAD_FILE);

  const days = {};
  for (const [iso, d] of Object.entries(raw.days)) {
    if (!ISO_RE.test(iso) || !isObj(d)) throw new Error(BAD_FILE);
    if (!Array.isArray(d.gains) || !d.gains.every((g) => typeof g === 'string')) throw new Error(BAD_FILE);
    const day = { gains: d.gains };
    if (d.goals !== undefined) {
      if (!Array.isArray(d.goals) || !d.goals.every((g) => isObj(g) && typeof g.text === 'string' && typeof g.done === 'boolean')) {
        throw new Error(BAD_FILE);
      }
      day.goals = d.goals.map((g) => ({ text: g.text, done: g.done }));
    }
    if (typeof d.completedAt === 'string') day.completedAt = d.completedAt;
    days[iso] = day;
  }

  const def = defaultState().settings;
  const s = isObj(raw.settings) ? raw.settings : {};
  const settings = {
    reminder: typeof s.reminder === 'boolean' ? s.reminder : def.reminder,
    reminderTime: typeof s.reminderTime === 'string' ? s.reminderTime : def.reminderTime,
    lastNotified: typeof s.lastNotified === 'string' ? s.lastNotified : def.lastNotified,
  };
  return { version: 1, days, settings };
}

export function load() {
  try {
    const ls = globalThis.localStorage;
    const text = ls?.getItem(KEY);
    if (text == null) return defaultState();
    try {
      return parseState(text);
    } catch {
      ls.setItem(`${KEY}.corrupt`, text); // Rohdaten retten, nicht überschreiben
      return defaultState();
    }
  } catch {
    return defaultState();
  }
}

export function save(state) {
  globalThis.localStorage.setItem(KEY, JSON.stringify(state));
}

export function getDay(state, iso) {
  return state.days[iso] ?? null;
}

export function setDay(state, iso, day) {
  state.days[iso] = day;
  save(state);
  return state;
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const state = parseState(text);
  save(state);
  return state;
}
