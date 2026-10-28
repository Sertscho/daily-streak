import { load, getDay } from '../store.js';
import { computeStreak, fireStage } from '../streak.js';
import { todayISO, addDays } from '../date.js';
import { flameSVG } from '../ui/flame.js';

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
const SNOW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>';

export function render(el, app) {
  const state = load();
  const today = todayISO();
  const s = computeStreak(state.days, today);
  const day = getDay(state, today);
  const prevGoals = (getDay(state, addDays(today, -1))?.goals ?? []).filter((g) => String(g?.text ?? '').trim());
  const showHint = !s.todayDone && (new Date().getHours() >= 18 || s.current > 0);

  const sections = [];
  sections.push(`<header class="home-head"><span class="home-title">Daily Streak</span><button type="button" class="icon-btn" aria-label="Einstellungen" data-action="settings">${GEAR}</button></header>`);
  sections.push(`<div class="home-flame">${flameSVG(fireStage(s.current))}</div>`);
  sections.push(`<div class="home-count"><div class="home-num">${s.current}</div><p class="muted">${s.current === 0 ? 'Zünde dein Feuer heute Abend an' : s.current === 1 ? 'Tag in Folge' : 'Tage in Folge'}</p></div>`);
  sections.push(`<span class="freeze-chip" title="Einen verpassten Abend pro Woche fängt der Freeze auf.">${SNOW}${s.freezeAvailable ? 'Freeze verfügbar' : 'Freeze diese Woche genutzt'}</span>`);
  if (showHint) sections.push('<p class="muted home-hint">Heute noch offen – dein Feuer wartet</p>');
  if (prevGoals.length) {
    sections.push(`<section class="card"><h2>Heute vorgenommen</h2><ul>${prevGoals.map((g) =>
      `<li class="${g.done ? 'done' : ''}"><span class="mark">${g.done ? '✓' : ''}</span><span>${esc(g.text)}</span></li>`).join('')}</ul></section>`);
  }
  if (!s.todayDone) {
    sections.push('<button type="button" class="btn btn-primary" data-action="ritual">Abend-Ritual starten</button>');
  } else {
    const gains = (day?.gains ?? []).filter((g) => String(g).trim());
    const goals = (day?.goals ?? []).filter((g) => String(g?.text ?? '').trim());
    sections.push(`<section class="card"><h2>Deine Gains heute</h2><ol>${gains.map((g, i) =>
      `<li><span class="mark">${i + 1}</span><span>${esc(g)}</span></li>`).join('')}</ol>`
      + (goals.length ? `<h3>Für morgen</h3><ul>${goals.map((g) => `<li><span class="mark"></span><span>${esc(g.text)}</span></li>`).join('')}</ul>` : '')
      + '<button type="button" class="btn btn-ghost" data-action="ritual">Bearbeiten</button></section>');
  }

  el.innerHTML = `<div class="home">${sections.map((h, i) => h.replace(/^<(\w+)/, `<$1 style="--i:${i}"`)).join('')}</div>`;
  el.querySelector('[data-action="settings"]').addEventListener('click', () => app.openSettings());
  el.querySelectorAll('[data-action="ritual"]').forEach((b) => b.addEventListener('click', () => app.openRitual()));
}
