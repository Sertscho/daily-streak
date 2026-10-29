// Tageszitate. Rein (ohne DOM), damit Node es testen kann.
import { diffDays } from './date.js';

export const QUOTES = [
  { t: 'Du steigst nicht auf das Niveau deiner Ziele. Du fällst auf das Niveau deiner Systeme.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Jede Handlung ist eine Stimme für den Menschen, der du werden willst.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Gewohnheiten sind der Zinseszins der Selbstverbesserung.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Verpasse nie zweimal.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Miss dich am Gestern, nicht am Ideal. Schau, wie weit du schon gekommen bist.', a: 'Dan Sullivan & Benjamin Hardy', b: 'The Gap and the Gain' },
  { t: 'Wenn du glaubst, du bist am Ende, bist du erst bei 40 Prozent.', a: 'David Goggins', b: "Can't Hurt Me" },
  { t: 'Wachstum beginnt dort, wo es unbequem wird.', a: 'David Goggins', b: "Can't Hurt Me" },
  { t: 'Das Hindernis auf dem Weg wird zum Weg.', a: 'Marc Aurel', b: 'Selbstbetrachtungen' },
  { t: 'Du hast Macht über deinen Geist, nicht über die Ereignisse. Erkenne das, und du findest Stärke.', a: 'Marc Aurel', b: 'Selbstbetrachtungen' },
  { t: 'Rede nicht länger darüber, was ein guter Mensch ist. Sei einer.', a: 'Marc Aurel', b: 'Selbstbetrachtungen' },
  { t: 'Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.', a: 'Seneca', b: 'Briefe an Lucilius' },
  { t: 'Wir leiden öfter in der Vorstellung als in der Wirklichkeit.', a: 'Seneca', b: 'Briefe an Lucilius' },
  { t: 'Wir haben nicht zu wenig Zeit, wir verschwenden zu viel davon.', a: 'Seneca', b: 'Von der Kürze des Lebens' },
  { t: 'Nicht die Dinge beunruhigen uns, sondern unsere Meinungen über die Dinge.', a: 'Epiktet', b: 'Handbüchlein der Moral' },
  { t: 'Wer ein Warum zum Leben hat, erträgt fast jedes Wie.', a: 'Viktor Frankl', b: '…trotzdem Ja zum Leben sagen' },
  { t: 'Glück lässt sich nicht jagen. Es stellt sich ein, wenn du einer Sache dienst, die größer ist als du.', a: 'Viktor Frankl', b: '…trotzdem Ja zum Leben sagen' },
  { t: 'Disziplin ist Freiheit.', a: 'Jocko Willink', b: 'Discipline Equals Freedom' },
  { t: 'Übernimm die volle Verantwortung für alles in deiner Welt. Keine Ausreden.', a: 'Jocko Willink & Leif Babin', b: 'Extreme Ownership' },
  { t: 'Beginne mit dem Ende im Kopf.', a: 'Stephen R. Covey', b: 'Die 7 Wege zur Effektivität' },
  { t: 'Das Wichtigste ist, das Wichtigste wichtig zu nehmen.', a: 'Stephen R. Covey', b: 'Die 7 Wege zur Effektivität' },
  { t: 'Tiefe Konzentration wird selten – und genau deshalb wertvoll.', a: 'Cal Newport', b: 'Deep Work' },
  { t: 'Weniger, aber besser.', a: 'Greg McKeown', b: 'Essentialism' },
  { t: 'Kleine, kluge Entscheidungen, beständig wiederholt, machen über die Zeit den großen Unterschied.', a: 'Darren Hardy', b: 'The Compound Effect' },
  { t: 'Begeisterung ist häufig. Ausdauer ist selten.', a: 'Angela Duckworth', b: 'Grit' },
  { t: 'Du kannst es noch nicht. Noch nicht heißt nicht nie.', a: 'Carol Dweck', b: 'Mindset' },
  { t: 'Vergleiche dich mit dem, der du gestern warst, nicht mit jemand anderem von heute.', a: 'Jordan B. Peterson', b: '12 Rules for Life' },
  { t: 'Wir sind, was wir wiederholt tun. Vortrefflichkeit ist keine Handlung, sondern eine Gewohnheit.', a: 'Will Durant', b: 'Die Geschichte der Philosophie' },
  { t: 'Tu die Arbeit. Ob jemand zusieht oder nicht.', a: 'Ryan Holiday', b: 'Ego is the Enemy' },
  { t: 'Ein Tag ohne Fortschritt ist kein verlorener Tag, wenn du daraus lernst.', a: 'Dan Sullivan & Benjamin Hardy', b: 'The Gap and the Gain' },
  { t: 'Erst formen wir unsere Gewohnheiten, dann formen sie uns.', a: 'James Clear', b: 'Atomic Habits' },
];

// Ein Zitat pro Kalendertag, der Reihe nach; erst nach allen wiederholt es sich.
export function quoteFor(iso) {
  const n = QUOTES.length;
  return QUOTES[((diffDays('2026-01-01', iso) % n) + n) % n];
}
