// Rückblick: Kennzahlen, Heatmap (26 Wochen), Erinnerung, letzte Tage.
import { load, getDay } from '../store.js';
import { stats, computeStreak, isDayComplete } from '../streak.js';
import { todayISO, addDays, weekdayMon0, formatDE } from '../date.js';

const WEEKS = 26;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const gainsOf = (day) => (day?.gains ?? []).filter((g) => String(g).trim() !== '');
const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Reine Datenaufbereitung: 26 Spalten (Wochen, älteste zuerst) × 7 Zeilen (Mo–So).
export function heatmapCells(days, today, bridged = []) {
  const bridgedSet = new Set(bridged);
  const start = addDays(today, -weekdayMon0(today) - (WEEKS - 1) * 7);
  return Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, r) => {
      const iso = addDays(start, w * 7 + r);
      const n = gainsOf(days?.[iso]).length;
      let level = 'none';
      if (iso > today) level = 'future';
      else if (bridgedSet.has(iso)) level = 'bridged';
      else if (isDayComplete(days?.[iso])) level = n >= 4 ? 'strong' : 'done';
      else if (n > 0) level = 'partial';
      return { iso, level, isToday: iso === today };
    }));
}

// Gleiches Datum in einem früheren Jahr/Monat; fehlender Tag → letzter Tag des Monats.
function shiftedDate(today, months) {
  const [y, m, d] = today.split('-').map(Number);
  const t = y * 12 + (m - 1) - months;
  const ty = Math.floor(t / 12), tm = t % 12;
  const dim = new Date(ty, tm + 1, 0).getDate();
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(Math.min(d, dim)).padStart(2, '0')}`;
}

const FLAKE = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/></svg>`;
const GLUT = `<svg viewBox="0 0 120 60" width="120" height="60" aria-hidden="true"><ellipse cx="60" cy="42" rx="46" ry="10" fill="#E8432E" opacity=".35"/><ellipse cx="60" cy="38" rx="32" ry="8" fill="#FF7A1A" opacity=".6"/><ellipse cx="60" cy="34" rx="16" ry="5" fill="#FFB547"/></svg>`;

function dayRow(state, iso, bridgedSet) {
  const day = getDay(state, iso);
  const n = gainsOf(day).length;
  const goals = (day?.goals ?? []).filter((g) => String(g?.text ?? '').trim() !== '');
  const right = n ? `${n} Gains` : `${FLAKE} überbrückt`;
  const body = (n ? `<ul class="rv-gains">${gainsOf(day).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '<p class="muted">Dieser Tag wurde überbrückt.</p>')
    + (goals.length ? `<p class="rv-sub">Ziele für den Folgetag</p><ul class="rv-goals">${goals.map((g) => `<li>${g.done ? '✓' : '○'} ${esc(g.text)}</li>`).join('')}</ul>` : '');
  return `<div class="rv-row" data-iso="${iso}">
    <button type="button" class="rv-head" aria-expanded="false" aria-controls="rv-b-${iso}"><span>${esc(formatDE(iso, 'short'))}</span><span class="muted">${right}</span></button>
    <div class="rv-body" id="rv-b-${iso}"><div><div class="rv-inner">${body}</div></div></div></div>`;
}

function countUp(el) {
  const to = Number(el.dataset.to);
  if (reduced() || !to) return;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / 600);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = '0';
  requestAnimationFrame(tick);
}

export function render(el, app) {
  const state = load();
  const today = todayISO();
  const { bridged } = computeStreak(state.days, today);
  const bridgedSet = new Set(bridged);
  const s = stats(state.days, today);
  const entryDays = Object.keys(state.days).filter((d) => gainsOf(state.days[d]).length).sort().reverse();
  const head = `<h1 class="h1">Rückblick</h1><p class="muted">Miss dich am Gain, nicht am Gap.</p>`;

  if (!entryDays.length && !bridged.length) {
    el.innerHTML = `${head}<div class="card rv-empty">${GLUT}<p><strong>Dein Rückblick füllt sich mit jedem Abend.</strong></p><p class="muted">Starte heute dein erstes Abend-Ritual.</p><a class="btn btn-primary" href="#/feuer">Zum Feuer</a></div>`;
    return;
  }

  const tile = (label, n, cls = '') => `<div class="rv-tile"><div class="rv-label">${label}</div><div class="rv-num ${cls}" data-to="${n}">${n}</div></div>`;
  const cols = heatmapCells(state.days, today, bridged);
  const monthName = (iso) => new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, 15)).replace('.', '');
  let lastLabel = -9, prevMonth = '';
  const months = cols.map((c, i) => {
    const m = c[0].iso.slice(0, 7);
    const show = m !== prevMonth && i - lastLabel >= 3;
    if (m !== prevMonth && show) lastLabel = i;
    prevMonth = m;
    return show ? `<span style="grid-column:${i + 1}">${esc(monthName(c[0].iso))}</span>` : '';
  }).join('');
  const cells = cols.map((c, w) => c.map((d) => {
    if (d.level === 'future') return `<span class="rv-cell" style="visibility:hidden"></span>`;
    const n = gainsOf(state.days[d.iso]).length;
    const label = `${formatDE(d.iso, 'short')}: ${d.level === 'bridged' ? 'überbrückt' : `${n} Gains`}`;
    return `<button type="button" class="rv-cell lv-${d.level}${d.isToday ? ' is-today' : ''}" style="--i:${w}" data-iso="${d.iso}" aria-label="${esc(label)}"></button>`;
  }).join('')).join('');

  const ago = [['Heute vor einem Jahr', 12], ['Heute vor einem Monat', 1]]
    .map(([title, m]) => ({ title, iso: shiftedDate(today, m) }))
    .find((x) => gainsOf(getDay(state, x.iso)).length);
  const memory = ago ? `<section class="card rv-memory"><h2 class="rv-h2">${ago.title}</h2><p class="muted">${esc(formatDE(ago.iso, 'long'))}</p><ul>${gainsOf(getDay(state, ago.iso)).map((g) => `<li>${esc(g)}</li>`).join('')}</ul></section>` : '';

  const listDays = [...new Set([...entryDays.slice(0, 14), ...bridged])].sort().reverse().filter((d) => entryDays.includes(d) || bridgedSet.has(d)).slice(0, 14);

  el.innerHTML = `${head}
    <div class="rv-grid">${tile('Gains gesamt', s.totalGains)}${tile('Aktueller Streak', s.current, 'rv-amber')}${tile('Bester Streak', s.best)}${tile('Aktive Tage', s.activeDays)}</div>
    <section class="card"><h2 class="rv-h2">Letzte 26 Wochen</h2>
      <div class="rv-map"><span></span><div class="rv-months">${months}</div>
        <div class="rv-rows"><span>Mo</span><span></span><span>Mi</span><span></span><span>Fr</span><span></span><span></span></div>
        <div class="rv-cells">${cells}</div></div>
      <div class="rv-legend"><span>Weniger</span><i class="lv-none"></i><i class="lv-partial"></i><i class="lv-done"></i><i class="lv-strong"></i><span>Mehr</span><span class="rv-freeze"><i class="lv-bridged"></i>${FLAKE} Freeze</span></div>
    </section>
    ${memory}
    <h2 class="rv-h2 rv-list-h">Deine letzten Tage</h2>
    <div class="rv-list">${listDays.map((d) => dayRow(state, d, bridgedSet)).join('')}</div>`;

  el.querySelectorAll('.rv-num').forEach(countUp);
  const list = el.querySelector('.rv-list');
  const toggle = (row, open) => {
    const b = row.querySelector('.rv-head');
    const v = open ?? b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(v));
    row.classList.toggle('open', v);
  };
  list.addEventListener('click', (e) => { const h = e.target.closest('.rv-head'); if (h) toggle(h.parentElement); });
  el.querySelector('.rv-cells').addEventListener('click', (e) => {
    const iso = e.target.closest('[data-iso]')?.dataset.iso;
    if (!iso || !(entryDays.includes(iso) || bridgedSet.has(iso))) return;
    let row = list.querySelector(`[data-iso="${iso}"]`);
    if (!row) { // älterer Tag: an passender Stelle einfügen
      list.insertAdjacentHTML('beforeend', dayRow(state, iso, bridgedSet));
      row = list.lastElementChild;
    }
    toggle(row, true);
    row.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  });
}
