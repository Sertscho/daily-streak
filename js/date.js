// Datumshilfen in lokaler Zeit. Tage sind immer 'YYYY-MM-DD' (nie toISOString).
const pad = (n) => String(n).padStart(2, '0');

export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Lokaler Mittag, damit Sommerzeitwechsel keine Tage verschieben.
export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function diffDays(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

// 0 = Montag … 6 = Sonntag
export function weekdayMon0(iso) {
  return (parseISO(iso).getDay() + 6) % 7;
}

// ISO-8601: Woche gehört zum Jahr ihres Donnerstags.
export function isoWeekKey(iso) {
  const thursday = addDays(iso, 3 - weekdayMon0(iso));
  const year = thursday.slice(0, 4);
  const week = Math.floor(diffDays(`${year}-01-01`, thursday) / 7) + 1;
  return `${year}-W${pad(week)}`;
}

const FORMATS = {
  short: { weekday: 'short', day: 'numeric', month: 'short' },
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
};

export function formatDE(iso, style = 'short') {
  return new Intl.DateTimeFormat('de-DE', FORMATS[style]).format(parseISO(iso));
}
