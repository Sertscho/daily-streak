// Abend-Ritual: Vollbild-Overlay mit Karten. Speichert erst im letzten Schritt.
import { load, getDay, setDay } from '../store.js';
import { computeStreak, rankInfo, stats } from '../streak.js';
import { todayISO, addDays, formatDE } from '../date.js';
import { createFire } from '../ui/fire.js';
import { burst } from '../ui/confetti.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Reine Funktion: baut den Tag zum Speichern. done-Status übernimmt gleiche Zieltexte aus existing.
export function buildDay({ gains, goals, existing, now = new Date() }) {
  const old = existing?.goals ?? [];
  return {
    gains: gains.map((g) => g.trim()),
    goals: goals.map((t) => t.trim()).filter(Boolean)
      .map((text) => ({ text, done: old.some((o) => o.text === text && o.done) })),
    completedAt: now.toISOString(),
  };
}

export function open(overlayEl, app) {
  const state = load();
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const existing = getDay(state, today);
  const y = getDay(state, yesterday);
  const wasDone = computeStreak(state.days, today).todayDone;
  const oldStreak = computeStreak(state.days, today).current;
  const oldRank = rankInfo(stats(state.days, today).activeDays);

  const gains = [0, 1, 2].map((i) => existing?.gains?.[i] ?? '');
  const goals = [0, 1, 2].map((i) => existing?.goals?.[i]?.text ?? '');
  const yGoals = (y?.goals ?? []).map((g) => ({ ...g }));
  const steps = ['intro', ...(yGoals.length ? ['check'] : []), 'gains', 'goals'];
  let idx = 0;
  let dirty = false;
  let finished = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  overlayEl.innerHTML = `
    <div class="ritual" role="dialog" aria-modal="true" aria-label="Abend-Ritual">
      <div class="ritual-top">
        <div class="ritual-bars"></div>
        <button class="ritual-x" type="button" aria-label="Schließen">✕</button>
      </div>
      <div class="ritual-stage"></div>
    </div>`;
  const root = overlayEl.querySelector('.ritual');
  const bars = root.querySelector('.ritual-bars');
  const stage = root.querySelector('.ritual-stage');
  bars.innerHTML = steps.map(() => '<i><b></b></i>').join('');

  function close() {
    document.removeEventListener('keydown', onKey);
    overlayEl.innerHTML = '';
    app.rerender();
  }
  function requestClose() {
    if (!finished && dirty && !confirm('Ritual abbrechen? Deine Eingaben gehen verloren.')) return;
    close();
  }
  function onKey(e) { if (e.key === 'Escape') requestClose(); }
  document.addEventListener('keydown', onKey);
  root.querySelector('.ritual-x').addEventListener('click', requestClose);

  function fieldsHTML(arr, ph) {
    return arr.map((_, i) => `
      <label class="r-field"><span class="r-num" aria-hidden="true">${i + 1}</span>
        <input type="text" maxlength="120" enterkeyhint="${i < 2 ? 'next' : 'done'}" autocomplete="off" aria-label="${esc(ph)} ${i + 1}" placeholder="${esc(ph)}"></label>`).join('');
  }

  function navHTML(primary) {
    return `<div class="r-nav">${idx > 0 ? '<button class="btn btn-ghost" type="button" data-back>Zurück</button>' : '<span></span>'}
      <button class="btn btn-primary" type="button" data-next>${primary}</button></div>`;
  }

  // Zeigt Schritt idx; dir = 1 (vor) / -1 (zurück)
  function show(dir = 1) {
    const step = steps[idx];
    bars.querySelectorAll('i').forEach((el, i) => {
      el.classList.toggle('done', i < idx);
      el.classList.toggle('now', i === idx);
    });
    let html = '';
    if (step === 'intro') {
      html = `<p class="muted">${esc(formatDE(today, 'long'))}</p>
        <h2 class="r-h" tabindex="-1">Zeit für deine Gains</h2>
        <p class="r-text">Miss dich an dem, wo du heute Morgen standst – nicht an deinem Ideal. Was hast du heute gewonnen?</p>
        <div class="r-grow"></div>${navHTML('Los geht\'s')}`;
    } else if (step === 'check') {
      html = `<h2 class="r-h" tabindex="-1">Was hast du davon geschafft?</h2>
        <div class="r-list">${yGoals.map((g, i) => `
          <label class="r-check"><input type="checkbox" data-i="${i}"${g.done ? ' checked' : ''}>
            <span class="r-tick" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
            <span class="r-label">${esc(g.text)}</span></label>`).join('')}</div>
        <p class="muted r-hint">Erledigte Ziele zählen als Gains.</p>
        <div class="r-grow"></div>${navHTML('Weiter')}`;
    } else if (step === 'gains') {
      html = `<h2 class="r-h" tabindex="-1">Deine 3 Gains heute</h2>${fieldsHTML(gains, 'z. B. 10 km gelaufen')}
        <p class="r-err" role="alert"></p><div class="r-grow"></div>${navHTML('Weiter')}`;
    } else {
      html = `<h2 class="r-h" tabindex="-1">Deine 3 Gains für morgen</h2>${fieldsHTML(goals, 'Was soll morgen ein Gain werden?')}
        <p class="r-err" role="alert"></p><div class="r-grow"></div>${navHTML('Abschließen')}`;
    }
    const card = document.createElement('div');
    card.className = 'r-card ' + (dir > 0 ? 'from-right' : 'from-left');
    card.innerHTML = html;
    stage.replaceChildren(card);
    wire(card, step);
  }

  function wire(card, step) {
    card.querySelector('[data-back]')?.addEventListener('click', () => { idx--; show(-1); });
    card.querySelector('[data-next]').addEventListener('click', () => next(card, step));
    const inputs = [...card.querySelectorAll('.r-field input')];
    const arr = step === 'gains' ? gains : goals;
    inputs.forEach((inp, i) => {
      inp.value = arr[i]; // per .value, nie als HTML
      inp.addEventListener('input', () => { arr[i] = inp.value; dirty = true; });
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i < 2) inputs[i + 1].focus(); else next(card, step);
      });
    });
    card.querySelectorAll('.r-check input').forEach((cb) =>
      cb.addEventListener('change', () => { yGoals[cb.dataset.i].done = cb.checked; dirty = true; }));
    (inputs.find((x) => !x.value.trim()) ?? card.querySelector('.r-h')).focus({ preventScroll: true });
  }

  function next(card, step) {
    if (step === 'check') {
      for (const g of yGoals) {
        if (!g.done) continue;
        const t = g.text.trim();
        if (gains.some((x) => x.trim() === t)) continue;
        const free = gains.findIndex((x) => !x.trim());
        if (free >= 0) gains[free] = t;
      }
    }
    if (step === 'gains' || step === 'goals') {
      const arr = step === 'gains' ? gains : goals;
      const ok = step === 'gains' ? arr.every((x) => x.trim()) : arr.some((x) => x.trim());
      if (!ok) {
        card.querySelector('.r-err').textContent = step === 'gains'
          ? 'Schreib drei Gains auf – auch kleine zählen.' : 'Mindestens ein Ziel für morgen.';
        const inputs = [...card.querySelectorAll('.r-field input')];
        (inputs.find((x) => !x.value.trim()) ?? inputs[0]).focus();
        return;
      }
    }
    if (step === 'goals') return save();
    idx++;
    show(1);
  }

  function save() {
    const day = buildDay({ gains, goals, existing });
    setDay(state, today, day);
    if (yGoals.length) setDay(state, yesterday, { ...y, goals: yGoals });
    finished = true;
    const newStreak = computeStreak(state.days, today).current;
    showDone(newStreak, rankInfo(stats(state.days, today).activeDays));
  }

  function showDone(newStreak, newRank) {
    const rankUp = newRank.rank !== oldRank.rank;
    bars.querySelectorAll('i').forEach((el) => { el.classList.remove('now'); el.classList.add('done'); });
    const card = document.createElement('div');
    card.className = 'r-card r-done from-right';
    card.innerHTML = `
      <div class="r-fire" aria-hidden="true"><canvas></canvas></div>
      ${rankUp ? `<div class="sys r-rankup" role="status"><b>Rang-Aufstieg ${oldRank.rank.rank} → ${newRank.rank.rank}</b><span>Neuer Titel: ${newRank.rank.name}</span></div>` : ''}
      ${wasDone ? '<p class="r-saved">Gespeichert</p>' : `<div class="r-plus" aria-hidden="true">+1</div>
        <div class="r-count" aria-live="polite">${oldStreak}</div>
        <p class="r-text r-center">${newStreak === 1 ? 'Dein Feuer ist entfacht' : `Dein Feuer brennt seit ${newStreak} Tagen`}</p>`}
      <div class="r-grow"></div>
      <div class="r-nav"><span></span><button class="btn btn-primary" type="button" data-done>Fertig</button></div>`;
    stage.replaceChildren(card);
    card.querySelector('[data-done]').addEventListener('click', close);
    const fire = createFire(card.querySelector('.r-fire canvas'), oldRank.tier);
    card.style.setProperty('--tier-a', newRank.tier.c[0]);
    card.style.setProperty('--tier-b', newRank.tier.c[1]);
    setTimeout(() => {
      fire.set(newRank.tier);
      if (!wasDone || rankUp) fire.burst();
      if (rankUp) card.classList.add('rank-up');
    }, 400);
    if (!wasDone) {
      const count = card.querySelector('.r-count');
      if (reduced) count.textContent = newStreak;
      else {
        burst();
        const t0 = performance.now(), D = 700;
        setTimeout(function tick() {
          const p = Math.min(1, (performance.now() - t0 - 400) / D);
          count.textContent = Math.round(oldStreak + (newStreak - oldStreak) * Math.max(0, p));
          if (p < 1) requestAnimationFrame(tick);
        }, 400);
      }
    }
    card.querySelector('[data-done]').focus({ preventScroll: true });
  }

  show(1);
}
