// Tageszitate. Rein (ohne DOM), damit Node es testen kann.
import { diffDays } from './date.js';

export const QUOTES = [
  { t: 'Du steigst nicht auf das Niveau deiner Ziele. Du fällst auf das Niveau deiner Systeme.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Wenn du glaubst, du bist am Ende, bist du erst bei 40 Prozent.', a: 'David Goggins', b: "Can't Hurt Me" },
  { t: 'Das Hindernis auf dem Weg wird zum Weg.', a: 'Marc Aurel', b: 'Selbstbetrachtungen' },
  { t: 'Fang winzig an. So klein, dass du es auch an einem schlechten Tag schaffst.', a: 'BJ Fogg', b: 'Tiny Habits' },
  { t: 'Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.', a: 'Seneca', b: 'Briefe an Lucilius' },
  { t: 'Miss dich am Gestern, nicht am Ideal. Schau, wie weit du schon gekommen bist.', a: 'Dan Sullivan & Benjamin Hardy', b: 'The Gap and the Gain' },
  { t: 'Disziplin ist Freiheit.', a: 'Jocko Willink', b: 'Discipline Equals Freedom' },
  { t: 'Wer ein Warum zum Leben hat, erträgt fast jedes Wie.', a: 'Viktor Frankl', b: '…trotzdem Ja zum Leben sagen' },
  { t: 'Iss den Frosch zuerst: Erledige die schwerste Aufgabe als Erstes.', a: 'Brian Tracy', b: 'Eat That Frog' },
  { t: 'Beginne mit dem Ende im Kopf.', a: 'Stephen R. Covey', b: 'Die 7 Wege zur Effektivität' },
  { t: 'Jede Handlung ist eine Stimme für den Menschen, der du werden willst.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Tiefe Konzentration wird selten – und genau deshalb wertvoll.', a: 'Cal Newport', b: 'Deep Work' },
  { t: 'Lebe in abgeschlossenen Tagesabschnitten. Heute ist der Tag, der zählt.', a: 'Dale Carnegie', b: 'Sorge dich nicht – lebe!' },
  { t: 'Wir leiden öfter in der Vorstellung als in der Wirklichkeit.', a: 'Seneca', b: 'Briefe an Lucilius' },
  { t: 'Der Profi taucht jeden Tag auf – auch wenn er keine Lust hat.', a: 'Steven Pressfield', b: 'The War of Art' },
  { t: 'Du hast Macht über deinen Geist, nicht über die Ereignisse. Erkenne das, und du findest Stärke.', a: 'Marc Aurel', b: 'Selbstbetrachtungen' },
  { t: 'Weniger, aber besser.', a: 'Greg McKeown', b: 'Essentialism' },
  { t: 'Was ist das eine, durch das alles andere leichter oder überflüssig wird?', a: 'Gary Keller', b: 'The One Thing' },
  { t: 'Wachstum beginnt dort, wo es unbequem wird.', a: 'David Goggins', b: "Can't Hurt Me" },
  { t: 'Gewohnheiten sind der Zinseszins der Selbstverbesserung.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Begeisterung ist häufig. Ausdauer ist selten.', a: 'Angela Duckworth', b: 'Grit' },
  { t: 'Gewinne den Morgen, gewinne den Tag.', a: 'Robin Sharma', b: 'The 5AM Club' },
  { t: 'Nicht die Dinge beunruhigen uns, sondern unsere Meinungen über die Dinge.', a: 'Epiktet', b: 'Handbüchlein der Moral' },
  { t: 'Kleine, kluge Entscheidungen, beständig wiederholt, machen über die Zeit den großen Unterschied.', a: 'Darren Hardy', b: 'The Compound Effect' },
  { t: 'Übernimm die volle Verantwortung für alles in deiner Welt. Keine Ausreden.', a: 'Jocko Willink & Leif Babin', b: 'Extreme Ownership' },
  { t: 'Die besten Momente entstehen, wenn wir uns freiwillig bis an unsere Grenzen strecken.', a: 'Mihaly Csikszentmihalyi', b: 'Flow' },
  { t: 'Du kannst es noch nicht. Noch nicht heißt nicht nie.', a: 'Carol Dweck', b: 'Mindset' },
  { t: 'Wir haben nicht zu wenig Zeit, wir verschwenden zu viel davon.', a: 'Seneca', b: 'Von der Kürze des Lebens' },
  { t: 'Veränderung geht nicht immer schnell, aber fast jede Gewohnheit lässt sich umformen.', a: 'Charles Duhigg', b: 'Die Macht der Gewohnheit' },
  { t: 'Verpasse nie zweimal.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Vergleiche dich mit dem, der du gestern warst, nicht mit jemand anderem von heute.', a: 'Jordan B. Peterson', b: '12 Rules for Life' },
  { t: 'Übung allein macht nicht perfekt. Gezielte Übung macht besser.', a: 'Anders Ericsson', b: 'Peak' },
  { t: 'Rede nicht länger darüber, was ein guter Mensch ist. Sei einer.', a: 'Marc Aurel', b: 'Selbstbetrachtungen' },
  { t: 'Tu die Arbeit. Ob jemand zusieht oder nicht.', a: 'Ryan Holiday', b: 'Ego is the Enemy' },
  { t: 'Schmerz ist unvermeidlich. Leiden ist eine Option.', a: 'Haruki Murakami', b: 'Wovon ich rede, wenn ich vom Laufen rede' },
  { t: 'Erst formen wir unsere Gewohnheiten, dann formen sie uns.', a: 'James Clear', b: 'Atomic Habits' },
  { t: 'Glück lässt sich nicht jagen. Es stellt sich ein, wenn du einer Sache dienst, die größer ist als du.', a: 'Viktor Frankl', b: '…trotzdem Ja zum Leben sagen' },
  { t: 'Sei so gut, dass man dich nicht ignorieren kann.', a: 'Cal Newport', b: "So Good They Can't Ignore You" },
  { t: 'Wir sind, was wir wiederholt tun. Vortrefflichkeit ist keine Handlung, sondern eine Gewohnheit.', a: 'Will Durant', b: 'Die Geschichte der Philosophie' },
  { t: 'Das Geheimnis des Zinseszinses: Unterbrich ihn nicht.', a: 'Morgan Housel', b: 'Über die Psychologie des Geldes' },
  { t: 'Das Wichtigste ist, das Wichtigste wichtig zu nehmen.', a: 'Stephen R. Covey', b: 'Die 7 Wege zur Effektivität' },
  { t: 'Ein Tag ohne Fortschritt ist kein verlorener Tag, wenn du daraus lernst.', a: 'Dan Sullivan & Benjamin Hardy', b: 'The Gap and the Gain' },
  { t: 'Das Jetzt ist alles, was du je hast.', a: 'Eckhart Tolle', b: 'Jetzt! Die Kraft der Gegenwart' },
  { t: 'Disziplin ist Schicksal.', a: 'Ryan Holiday', b: 'Discipline Is Destiny' },
];

// Ein Zitat pro Kalendertag, der Reihe nach; erst nach allen wiederholt es sich.
// Reihenfolge so halten, dass benachbarte Einträge (auch Ende → Anfang) nie denselben Autor haben.
export function quoteFor(iso) {
  const n = QUOTES.length;
  return QUOTES[((diffDays('2026-01-01', iso) % n) + n) % n];
}
