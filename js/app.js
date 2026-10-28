import { render as renderHome } from './views/home.js';
import { render as renderReview } from './views/review.js';
import { open as openRitualSheet } from './views/ritual.js';
import { open as openSettingsSheet, checkReminder } from './views/settings.js';

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

window.addEventListener('hashchange', rerender);
rerender();
checkReminder();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkReminder(); });
setInterval(checkReminder, 60_000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .catch((err) => console.error('Service Worker konnte nicht registriert werden', err));
}
