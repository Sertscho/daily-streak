# Daily Streak – Spec

## Ziel
Eine Web-App (PWA) für die Übung „3 Gains pro Tag“ aus *The Gap and the Gain*: abends 3 Gains von heute aufschreiben und die 3 wichtigsten Gains für morgen festlegen. Jeder erledigte Abend lässt das Feuer (den Streak) wachsen. Läuft auf dem iPhone als Homescreen-App, nur auf Deutsch.

## Nicht-Ziele (MVP)
Kein Login, keine Synchronisierung, kein Server, kein Push über einen Server, keine Mehrsprachigkeit, kein Framework, kein Build-Schritt.

## Stack
Statisches HTML + CSS + JavaScript (ES-Module, Vanilla), kein Bundler. Läuft in Safari iOS 17+ und Chrome. Tests: `node --test` (Node 24) für die reine Logik. Hosting: GitHub Pages aus `main` (Root).

## Architektur
| Datei | Aufgabe |
|---|---|
| `index.html` | App-Shell: `<main id="view">`, Tab-Leiste (Feuer, Rückblick), `<div id="overlay">` |
| `js/app.js` | Start, Hash-Router (`#/feuer`, `#/rueckblick`), ruft `render(el)` der Views auf, registriert SW |
| `js/date.js` | Datumshilfen: `todayISO()`, `addDays(iso,n)`, `isoWeekKey(iso)` (lokale Zeit, nie UTC) |
| `js/streak.js` | Reine Logik, **ohne DOM**: `computeStreak`, `fireStage`, `isDayComplete` |
| `js/store.js` | localStorage lesen/schreiben, `exportJSON()`, `importJSON(text)` mit Validierung |
| `js/views/home.js` | Feuer-Screen |
| `js/views/ritual.js` | Abend-Ritual (Overlay mit Karten) |
| `js/views/review.js` | Rückblick-Screen |
| `js/views/settings.js` | Einstellungen (Sheet): Erinnerung, Kalender, Export/Import |
| `js/ui/fire.js` | Partikelfeuer mit Blitzen `createFire(canvas, tier)` |
| `js/ui/confetti.js` | Konfetti (Canvas) `burst()` |
| `css/base.css` + je eine CSS-Datei pro View | Tokens, Layout |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA, offline |

## Datenmodell (localStorage-Key `dailyStreak.v1`)
```json
{
  "version": 1,
  "days": {
    "2026-10-28": {
      "gains": ["Lauf gemacht", "Angebot verschickt", "Kapitel 5 gehört"],
      "goals": [{ "text": "Pitch vorbereiten", "done": false }],
      "completedAt": "2026-10-28T21:04:11.000Z"
    }
  },
  "settings": { "reminder": false, "reminderTime": "21:00", "lastNotified": null }
}
```
`goals` am Tag D sind die Ziele **für D+1**. Beim Ritual an D+1 werden sie abgehakt (`done`).

## Regeln
- **Tag erledigt** = `days[d]` existiert und hat ≥ 3 nicht leere Gains.
- **Streak**: zusammenhängende erledigte Tage, rückwärts gezählt ab heute. Ist heute noch nicht erledigt, wird ab gestern gezählt (der Streak bleibt bis Mitternacht erhalten).
- **Freeze**: ein einzelner verpasster Tag wird überbrückt, wenn in derselben ISO-Woche (Mo–So) noch kein anderer Tag überbrückt wurde. Zwei verpasste Tage hintereinander beenden den Streak. Überbrückte Tage zählen nicht als Streak-Tage, unterbrechen ihn aber nicht. Freezes werden nur berechnet, nicht gespeichert.
- **Erledigte Morgen-Ziele zählen als Gains**: Im Ritual stehen abgehakte Ziele von gestern als vorausgefüllte Gains bereit (sie bleiben änderbar).
- **Rang & Feuer** (`rankInfo(n)` in `js/streak.js`, n = erledigte Abende gesamt, fällt nie zurück): Rang E (0) · D Beständig (7) · C Glühend (30) · B Arkan (90) · A Sturm (180) · S Monarch (365). Jeder Rang ab D ist ein Titel. Das Feuer (`js/ui/fire.js`, Canvas-Partikel) hat 7 Stufen (0, 3, 7, 30, 90, 180, 365) mit eigener Farbe und Größe, ab B kommen Blitze dazu. Beim Rang-Aufstieg im Ritual: weißer Blitz, Blitzeinschläge, System-Fenster „Rang-Aufstieg X → Y“.

## Design
Lagerfeuer-Look, dunkel und warm, mobil zuerst (375 px), sichere Bereiche (`env(safe-area-inset-*)`).
- Tokens: bg `#14110F`, surface `#211B17`, surface-2 `#2D2520`, line `#3A302A`, text `#FFF4E6`, muted `#B5A595`, amber `#FFB547`, orange `#FF7A1A`, ember `#E8432E`, ice `#8FD3FF` (Freeze).
- Schrift: `ui-rounded, "SF Pro Rounded", system-ui, sans-serif`. Streak-Zahl 72 px/800, Überschriften 22 px/700, Text 16 px.
- Radius 20 px für Karten, 14 px für Buttons. Primär-Button: amber Fläche, Text `#2A1600`.
- Animationen: Feuer flackert (CSS-Keyframes auf SVG-Pfaden, transform + opacity), Karten gleiten seitlich mit Feder-Ease `cubic-bezier(.2,.9,.3,1.2)`, Konfetti am Ende. Unter `prefers-reduced-motion: reduce` nur Überblendungen, kein Flackern, kein Konfetti.
- Tab-Leiste unten, 2 Tabs mit Icon und Text, Touch-Ziele ≥ 44 px.

## Abläufe
**Feuer-Screen**: Zahnrad oben rechts (Einstellungen) · großes Feuer (Stufe aus Streak) · Zahl + „Tage in Folge“ · Freeze-Chip (❄ nur wenn gestern verpasst und vom Freeze überbrückt wurde) · Karte „Heute vorgenommen“ (gestrige Ziele, falls vorhanden) · ist heute nicht erledigt: Primär-Button „Abend-Ritual starten“; ist heute erledigt: Karte mit den 3 Gains und den Zielen für morgen, Button „Bearbeiten“.

**Abend-Ritual** (Vollbild-Overlay, oben Story-Fortschrittsbalken, ✕ schließt nach Rückfrage, falls etwas eingegeben wurde):
1. Intro: „Zeit für deine Gains“ und ein kurzer Satz zum Gap und Gain.
2. Nur falls gestern Ziele gesetzt wurden: „Was hast du davon geschafft?“, eine Checkliste.
3. „Deine 3 Gains heute“: 3 Eingabefelder, abgehakte Ziele sind vorausgefüllt. Weiter erst bei 3 nicht leeren Feldern (Inline-Hinweis).
4. „Deine 3 Gains für morgen“: 3 Felder, mindestens 1 Pflicht.
5. Abschluss: Konfetti, Feuer wächst, „+1“, neue Streak-Zahl, Button „Fertig“.
Navigation über „Weiter“/„Zurück“, Enter springt ins nächste Feld. Speichert erst bei Schritt 5.

**Rückblick**: 4 Kennzahlen (Gains gesamt, aktueller Streak, bester Streak, aktive Tage) · Heatmap der letzten 26 Wochen (Spalten = Wochen, Zeilen = Mo–So, Farbe: kein Eintrag / erledigt / mit Freeze überbrückt in ice) · Karte „Heute vor einem Jahr“ (sonst „vor einem Monat“, sonst ausgeblendet) · Liste der letzten 14 Tage (Datum + Gains), antippbar zum Aufklappen.

**Einstellungen** (Bottom-Sheet): Schalter „Erinnerung um 21:00“ (Notification API: fragt nach Erlaubnis; nach dem Öffnen der App wird ab 21:00 einmal pro Tag benachrichtigt, falls der Tag nicht erledigt ist; Hinweistext: Auf dem iPhone geht das nur als Homescreen-App und nur, wenn die App geöffnet war) · Button „Erinnerung in Kalender eintragen“ (lädt eine `.ics` mit täglicher Wiederholung um 21:00 und Alarm, die zuverlässige Variante) · „Daten exportieren“ (JSON-Download) · „Daten importieren“ (Datei, Validierung, Rückfrage vor dem Überschreiben).

## Fertig, wenn
Alle Abläufe funktionieren in einer mobilen Browseransicht, `node --test` ist grün, die App funktioniert nach dem ersten Laden offline, ist zum Homescreen hinzufügbar und läuft auf GitHub Pages.
