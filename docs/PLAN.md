# Plan

| # | Aufgabe | Tier | Wartet auf | Status |
|---|---|---|---|---|
| 1 | Grundgerüst | Light | – | offen |
| 2 | Logik + Tests | Careful | 1 | offen |
| 3 | Feuer-Screen + Flamme | Medium | 2 | offen |
| 4 | Abend-Ritual + Konfetti | Medium | 2 | offen |
| 5 | Rückblick | Medium | 2 | offen |
| 6 | Einstellungen | Medium | 2 | offen |
| 7 | Veröffentlichen (Pages) | Director | 3–6 | offen |

1. **Grundgerüst**: alle Dateien aus der Architektur in SPEC.md anlegen. `index.html` (Shell, Viewport mit `viewport-fit=cover`, Apple-Meta-Tags, Manifest-Link), `css/base.css` (Tokens, Reset, Tab-Leiste, Buttons, Karten, Sheet-Grundstil), `js/app.js` (Router + Tab-Leiste + SW-Registrierung), die Views und UI-Module als Platzhalter mit fester Export-Signatur, `sw.js` (Cache-first für alle App-Dateien, Versionsname), `manifest.webmanifest`, Icons (SVG + PNG 180/192/512, mit Python ohne Zusatzpakete erzeugt), `.gitignore`. Prüfen: lokaler Server, beide Tabs erreichbar, keine Konsolenfehler.
2. **Logik + Tests**: `js/date.js`, `js/streak.js`, `js/store.js` nach den Regeln in SPEC.md; `tests/streak.test.mjs` mit Randfällen (heute offen, Freeze, zwei verpasste Tage, Wochengrenze, Jahreswechsel, Import ungültig). Prüfen: `node --test`.
3–6. Je eine View mit eigener CSS-Datei nach SPEC.md (Design + Abläufe). Nur die eigenen Dateien anfassen. Prüfen: im Browser in mobiler Ansicht.
7. Pages aktivieren, Homepage-Feld setzen, auf dem Live-Link testen.
