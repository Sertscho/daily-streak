// Platzhalter für das Abend-Ritual (Overlay)
export function open(overlayEl, app) {
  overlayEl.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ritual-title">
      <div class="card">
        <h2 class="h1" id="ritual-title">Ritual</h2>
        <button class="btn btn-ghost" type="button" data-action="close">Schließen</button>
      </div>
    </div>
  `;
  overlayEl.querySelector('[data-action="close"]').addEventListener('click', () => {
    overlayEl.innerHTML = '';
  });
}
