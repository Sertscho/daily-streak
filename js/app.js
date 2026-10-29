import { render as renderHome } from './views/home.js';
import { render as renderReview } from './views/review.js';
import { open as openRitualSheet } from './views/ritual.js';
import { open as openSettingsSheet, checkReminder } from './views/settings.js';
import { createFire } from './ui/fire.js';
import { load } from './store.js';
import { rankInfo, stats } from './streak.js';
import { todayISO } from './date.js';

const DEFAULT_ROUTE = '/feuer';
const routes = {
  '/feuer': renderHome,
  '/rueckblick': renderReview,
};

const viewEl = document.getElementById('view');
const overlayEl = document.getElementById('overlay');

const app = {
  rerender,
  openRitual() { openRitualSheet(overlayEl, app); },
  openSettings() { openSettingsSheet(overlayEl, app); },
};

// Unbekannter oder leerer Hash fällt auf die Standardroute zurück
function currentRoute() {
  const path = location.hash.replace(/^#/, '') || DEFAULT_ROUTE;
  return routes[path] ? path : DEFAULT_ROUTE;
}

function setActiveTab(route) {
  for (const link of document.querySelectorAll('.tabbar a')) {
    if (link.getAttribute('href') === `#${route}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function rerender() {
  const route = currentRoute();
  routes[route](viewEl, app);
  setActiveTab(route);
}

// Kurzes Feuer beim Öffnen; Antippen überspringt. Bei reduzierter Bewegung kein Intro.
function intro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.className = 'intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<canvas></canvas>';
  document.body.append(el);
  const { tier } = rankInfo(stats(load().days, todayISO()).activeDays);
  createFire(el.firstChild, tier).burst();
  const end = () => { clearTimeout(timer); el.classList.add('is-out'); setTimeout(() => el.remove(), 450); };
  const timer = setTimeout(end, 1500);
  el.addEventListener('click', end, { once: true });
}

window.addEventListener('hashchange', rerender);
rerender();
intro();
checkReminder();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkReminder(); });
setInterval(checkReminder, 60_000);

if ('serviceWorker' in navigator) {
  // Neue Version aktiv (skipWaiting + claim im SW): einmal neu laden, damit sie sofort sichtbar ist.
  if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  navigator.serviceWorker.register('./sw.js')
    .catch((err) => console.error('Service Worker konnte nicht registriert werden', err));
}
