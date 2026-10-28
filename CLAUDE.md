# Daily Streak

PWA, statisches HTML/CSS/Vanilla-JS (ES-Module), **kein Build-Schritt, keine npm-Abhängigkeiten**.

## Befehle
- Lokal starten: `python3 -m http.server 8080` → http://localhost:8080
- Tests: `node --test tests/`

## Regeln
- Spec: `docs/SPEC.md` (Datenmodell, Regeln, Design-Tokens). Plan: `docs/PLAN.md`. Navigation: `filemap.md`.
- UI-Texte nur auf Deutsch, du-Form.
- Datum immer als lokales `YYYY-MM-DD` über `js/date.js`, nie `toISOString()` für Tage (UTC-Fehler).
- `js/streak.js` bleibt frei von DOM und localStorage, damit Node es testen kann.
- Animationen nur über transform/opacity; `prefers-reduced-motion` immer beachten.
- Jede neue Datei kommt in die `ASSETS`-Liste in `sw.js`, und der Cache-Name wird erhöht.
- Neue oder verschobene Dateien in `filemap.md` eintragen.
