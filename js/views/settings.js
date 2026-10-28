import { load, save, exportJSON, importJSON } from '../store.js';
import { computeStreak } from '../streak.js';
import { todayISO } from '../date.js';

const enc = new TextEncoder();
const CLOSE_MS = 380;

// Zeilen > 75 Oktette nach RFC 5545 falten (nie mitten in einem UTF-8-Zeichen)
function fold(line) {
  const out = [];
  let cur = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      out.push(cur);
      cur = ' ';
      bytes = 1;
      limit = 75;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n');
}

export function buildICS(todayIso, nowDate = new Date()) {
  const day = todayIso.replaceAll('-', '');
  const stamp = nowDate.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const uid = `${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}@daily-streak`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daily Streak//DE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Berlin',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Berlin:${day}T210000`,
    `DTEND;TZID=Europe/Berlin:${day}T211500`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:🔥 Daily Streak – 3 Gains',
    'DESCRIPTION:Schreib deine 3 Gains von heute und deine 3 Ziele für morgen auf.',
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Daily Streak',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export async function checkReminder() {
  try {
    const state = load();
    const s = state.settings;
    const now = new Date();
    const today = todayISO(now);
    if (!s.reminder || !('Notification' in window) || Notification.permission !== 'granted') return;
    if (now.getHours() < 21 || s.lastNotified === today) return;
    if (computeStreak(state.days, today).todayDone) return;
    const title = 'Dein Feuer wartet 🔥';
    const opts = { body: 'Zeit für deine 3 Gains von heute.', icon: './icons/icon-192.png' };
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, opts);
    } catch {
      new Notification(title, opts);
    }
    s.lastNotified = today;
    save(state);
  } catch (err) {
    console.error('Erinnerung fehlgeschlagen', err);
  }
}

function download(name, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function open(overlayEl, app) {
  const opener = document.activeElement;
  overlayEl.innerHTML = `
    <div class="sheet settings-sheet" data-role="backdrop">
      <div class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="settings-grip" aria-hidden="true"></div>
        <header class="settings-head">
          <h2 id="settings-title" tabindex="-1">Einstellungen</h2>
          <button class="settings-close" type="button" aria-label="Schließen" data-action="close">✕</button>
        </header>

        <h3 class="settings-label">Erinnerung</h3>
        <div class="settings-group card">
          <div class="settings-row">
            <label for="reminder-toggle">Erinnerung um 21:00</label>
            <span class="switch">
              <input type="checkbox" role="switch" id="reminder-toggle">
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </div>
          <p class="settings-note" id="reminder-note" aria-live="polite"></p>
          <p class="settings-hint">Auf dem iPhone funktioniert das nur, wenn Daily Streak zum Home-Bildschirm hinzugefügt ist und du die App an dem Tag geöffnet hast. Zuverlässiger ist der Kalender-Eintrag.</p>
          <div class="settings-row settings-row-btn">
            <button class="btn btn-ghost" type="button" data-action="ics">Erinnerung in Kalender eintragen</button>
          </div>
        </div>

        <h3 class="settings-label">Daten</h3>
        <div class="settings-group card">
          <p class="settings-hint">Deine Einträge bleiben nur auf diesem Gerät.</p>
          <div class="settings-row settings-row-btn">
            <button class="btn btn-ghost" type="button" data-action="export">Daten exportieren</button>
          </div>
          <div class="settings-row settings-row-btn">
            <button class="btn btn-ghost" type="button" data-action="import">Daten importieren</button>
            <input type="file" accept="application/json,.json" hidden data-role="file">
          </div>
          <p class="settings-note" id="data-note" aria-live="polite"></p>
        </div>

        <p class="settings-foot">Daily Streak · nach ‚3 Gains pro Tag‘ aus The Gap and the Gain</p>
      </div>
    </div>
  `;

  const backdrop = overlayEl.firstElementChild;
  const panel = backdrop.querySelector('.settings-panel');
  const title = panel.querySelector('#settings-title');
  const toggle = panel.querySelector('#reminder-toggle');
  const reminderNote = panel.querySelector('#reminder-note');
  const dataNote = panel.querySelector('#data-note');
  const fileInput = panel.querySelector('[data-role="file"]');
  const say = (el, text, err = false) => {
    el.textContent = text;
    el.classList.toggle('is-error', err);
  };

  let closing = false;
  function close() {
    if (closing) return;
    closing = true;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      overlayEl.innerHTML = '';
      opener?.focus?.();
    }, CLOSE_MS);
  }

  function onKey(e) {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('button, input:not([hidden]), [tabindex="-1"]')]
      .filter((el) => !el.disabled && (el.tabIndex >= 0 || el === title));
    const focusable = f.filter((el) => el !== title);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!panel.contains(document.activeElement) || document.activeElement === title) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', onKey);

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  panel.querySelector('[data-action="close"]').addEventListener('click', close);

  toggle.checked = load().settings.reminder;
  toggle.addEventListener('change', async () => {
    say(reminderNote, '');
    const state = load();
    if (!toggle.checked) {
      state.settings.reminder = false;
      save(state);
      return;
    }
    toggle.checked = false;
    if (!('Notification' in window)) {
      say(reminderNote, 'Dein Browser unterstützt keine Benachrichtigungen. Nutze den Kalender-Eintrag.', true);
      return;
    }
    let perm = 'denied';
    try { perm = await Notification.requestPermission(); } catch { /* bleibt denied */ }
    if (perm !== 'granted') {
      say(reminderNote, 'Benachrichtigungen sind blockiert.', true);
      return;
    }
    toggle.checked = true;
    state.settings.reminder = true;
    save(state);
  });

  panel.querySelector('[data-action="ics"]').addEventListener('click', () => {
    download('daily-streak-erinnerung.ics', 'text/calendar;charset=utf-8', buildICS(todayISO()));
  });

  panel.querySelector('[data-action="export"]').addEventListener('click', () => {
    download(`daily-streak-backup-${todayISO()}.json`, 'application/json', exportJSON(load()));
  });

  panel.querySelector('[data-action="import"]').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    say(dataNote, '');
    try {
      const text = await file.text();
      if (!confirm('Import ersetzt alle aktuellen Einträge. Fortfahren?')) return;
      importJSON(text);
      say(dataNote, 'Import abgeschlossen');
      toggle.checked = load().settings.reminder;
      app.rerender();
    } catch (err) {
      say(dataNote, err.message, true);
    }
  });

  requestAnimationFrame(() => {
    backdrop.classList.add('is-open');
    title.focus();
  });
}
