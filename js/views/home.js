// Platzhalter: zeigt, dass das Routing funktioniert
export function render(el, app) {
  el.innerHTML = `
    <h1 class="h1">Feuer</h1>
    <button class="btn btn-primary" type="button" data-action="ritual">Abend-Ritual starten</button>
    <button type="button" aria-label="Einstellungen" data-action="settings">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>
      </svg>
    </button>
  `;
  el.querySelector('[data-action="ritual"]').addEventListener('click', () => app.openRitual());
  el.querySelector('[data-action="settings"]').addEventListener('click', () => app.openSettings());
}
