/* Kalender, Wochen und Phasen.

   Bewusst ohne Date.now(): jede Funktion bekommt den Zeitpunkt uebergeben.
   Sonst laesst sich der Plan nicht ueber 16 Wochen durchtesten, ohne die
   Systemuhr zu stellen.

   Der zweite Abschnitt unten traegt das Kalenderraster der Plan-Ansicht. Er
   rechnet nur mit Tagen und Monaten und weiss nichts vom Trainingsinhalt -
   deshalb steht er hier und nicht in day.js. Gerechnet wird durchgehend auf
   lokalen Mitternachtsdaten und ueber Date.setDate(), weil das die
   Sommerzeitumstellung mitnimmt; eine Addition von 86400000 ms tut das nicht
   und verschiebt zweimal im Jahr einen ganzen Tag. */

export const WEEKDAY_NAMES = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
export const WEEKDAY_SHORT = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August',
                            'September','Oktober','November','Dezember'];

/* Lokaler Kalendertag als YYYY-MM-DD. toISOString() waere falsch: es rechnet
   nach UTC um und liefert oestlich von Greenwich den Vortag. */
export function isoDayLocal(d){
  const x = toMidnight(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return x.getFullYear() + '-' + m + '-' + day;
}

export function toMidnight(d){
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function weekNumberFor(date, startDate){
  const diffDays = Math.floor((toMidnight(date) - toMidnight(startDate)) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

/* Nach der letzten Planwoche bleiben die Werte der letzten stehen. Der
   Winterblock bekommt keine eigene Progression - er haengt an Fragen, die der
   Plan offen laesst (Rolle? Zieltermin?). Die Anzeige sagt das ausdruecklich. */
export function weekIndex(plan, week){
  return Math.min(Math.max(week, 1), plan.weekCount) - 1;
}

function planWeek(plan, week){
  return plan.weeks[weekIndex(plan, week)];
}

/* Erholungswochen stehen einzeln in plan.json.

   Bis Fassung 2 rechnete diese Funktion week % recoveryEveryNthWeek === 0. Der
   3:1-Rhythmus war im Trainingsplan selbst als Risiko benannt, mit der
   Begruendung, die Formel halte die App-Logik einfach - kein Trainingsargument.
   Fassung 3 faehrt ab Woche 5 im 2:1-Rhythmus, und der laesst sich mit keinem
   Modulo schreiben, weil die erste Erholungswoche noch aus dem 3:1-Teil stammt.

   Ein Nebeneffekt der Liste ist gewollt: nach der letzten Planwoche gibt es
   keine Erholungswochen mehr. Die Formel haette dort weitergezaehlt und im
   Winterblock beliebige Wochen als Erholung ausgewiesen. */
export function isRecoveryWeek(plan, week){
  return plan.recoveryWeeks.indexOf(week) >= 0;
}

export function isWinterBlock(plan, week){
  return week > plan.weekCount;
}

export function phaseOf(plan, week){
  return isWinterBlock(plan, week) ? plan.winterBlock.phase : planWeek(plan, week).phase;
}

export function phaseName(plan, week){
  return plan.phaseNames[String(phaseOf(plan, week))] || '';
}

/* Was an einem Wochentag dieser Woche steht - unter seinem Kuerzel: di, mi,
   do, sa, so. Montag und Freitag fehlen, weil an ihnen nichts von der Woche
   abhaengt.

   Im Winterblock greift dessen eigener Abschnitt, sonst rechnete die App mit
   der rohen Wochennummer weiter - was in der Einzeldatei-Fassung ein stiller
   Fehler war. Ein Tag, den der Winterblock nennt, ersetzt den der letzten
   Planwoche vollstaendig; einen, den er nicht nennt, erbt er von ihr.

   Bis Fassung 2 gab es dafuer zwei benannte Zugriffe - thursdayData und
   saturdayBlockData -, weil nur diese beiden Tage im Winterblock ueberhaupt
   eine Entsprechung hatten. Alle uebrigen las day.js roh aus plan.weeks[i],
   an der Winterlogik vorbei. */
export function tagDaten(plan, week, tag){
  const winter = isWinterBlock(plan, week) ? plan.winterBlock.tage : null;
  return (winter && winter[tag]) || planWeek(plan, week).tage[tag];
}

export function thursdayData(plan, week){
  return tagDaten(plan, week, 'do');
}

export function saturdayBlockData(plan, week){
  if(isRecoveryWeek(plan, week)) return null;
  return tagDaten(plan, week, 'sa').bloecke || null;
}

export function isTestWeek(plan, week){
  return thursdayData(plan, week).kind === 'test';
}

/* Abgeleitet statt als zweite Liste gefuehrt - sonst laufen die beiden
   auseinander, sobald jemand eine Testwoche verschiebt. */
export function testWeeks(plan){
  const out = [];
  for(let w = 1; w <= plan.weekCount; w++) if(isTestWeek(plan, w)) out.push(w);
  return out;
}

/* Der Donnerstag der Trainingswoche. Die Woche beginnt am Samstag, der
   Qualitaetstag ist also der erste Donnerstag ab Wochenbeginn.

   testDateFor ist derselbe Kalender unter dem Namen, unter dem ihn der Test
   sucht: der Testtermin ist der Donnerstag seiner Woche und kein zweites
   Datum daneben. Seit der Anlauf auch die Donnerstage ausserhalb der
   Testwochen betrifft, wird derselbe Tag auch ohne Test gebraucht. */
export function thursdayDateFor(plan, week, startDate){
  const d = toMidnight(startDate);
  d.setDate(d.getDate() + (week - 1) * 7);
  while(d.getDay() !== 4) d.setDate(d.getDate() + 1);
  return d;
}

export const testDateFor = thursdayDateFor;

/* ---- Kalenderraster ---- */

export function addDays(date, n){
  const x = toMidnight(date);
  x.setDate(x.getDate() + n);
  return x;
}

/* Abstand in ganzen Kalendertagen. Gerundet, nicht abgeschnitten: an den
   Umstellungswochenenden liegen zwischen zwei Mitternachten 23 oder 25
   Stunden, und ein Math.floor haette daraus 0 statt 1 Tag gemacht. */
export function dayOffset(date, from){
  return Math.round((toMidnight(date) - toMidnight(from)) / 86400000);
}

export function dayFromIso(iso){
  const [j, m, t] = String(iso).split('-').map(Number);
  return new Date(j, m - 1, t);
}

/* ---- Rechnen auf dem ISO-String ----

   Die Eintraege aus intervals.icu und aus dem eigenen Protokoll tragen ihren
   Tag als "2026-08-15". Daraus jedes Mal ein Date zu bauen, nur um zwei Tage
   voneinander abzuziehen, geht ueber die Zeitzone und die Sommerzeit - und
   genau dort entstehen die Fehler um einen Tag. Die Tagesnummer rechnet in
   UTC und ist damit von beidem unabhaengig.

   Stand dreimal da: als tagNummer in analysis.js, als tagNr in verlauf.js -
   zeichengleiche Rumpfe unter verschiedenen Namen - und ein drittes Mal als
   lokale Hilfsfunktion im Test. Hier ist die Stelle dafuer: der Kalender. */

export function tagNr(iso){
  const t = String(iso || '').slice(0, 10).split('-').map(Number);
  if(t.length !== 3 || t.some(v => !Number.isFinite(v))) return null;
  return Math.round(Date.UTC(t[0], t[1] - 1, t[2]) / 86400000);
}

export function tagPlus(iso, delta){
  const n = tagNr(iso);
  if(n === null) return null;
  return new Date((n + delta) * 86400000).toISOString().slice(0, 10);
}

/* "15.08." - fuer die Achsenbeschriftung, wo das Jahr keinen Platz hat und
   auch nichts entscheidet. */
export function kurzTag(iso){
  const s = String(iso || '').slice(0, 10);
  return s.length === 10 ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' : s;
}

/* Der erste Tag der Trainingswoche, in der ein Datum liegt.

   Abgeleitet aus dem Startdatum statt auf Samstag festgenagelt. Beide Wege
   liefern beim ausgelieferten Plan dasselbe, aber nur dieser bleibt mit
   weekNumberFor in einer Linie, wenn jemand den Beginn auf einen anderen
   Wochentag legt - sonst zeigte die Wochenansicht sieben Tage an, die zu zwei
   verschiedenen Wochennummern gehoeren. */
export function trainingWeekStart(date, startDate){
  return addDays(startDate, Math.floor(dayOffset(date, startDate) / 7) * 7);
}

export function trainingWeekDays(date, startDate){
  const a = trainingWeekStart(date, startDate);
  const out = [];
  for(let i = 0; i < 7; i++) out.push(addDays(a, i));
  return out;
}

export function startOfMonth(date){
  const x = toMidnight(date);
  x.setDate(1);
  return x;
}

/* Immer vom Monatsersten aus rechnen. setMonth() auf einem 31. liefert sonst
   fuer kurze Monate den Folgemonat - aus dem 31. Januar wird der 3. Maerz. */
export function addMonths(date, n){
  const x = startOfMonth(date);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function monthLabel(date){
  return MONTH_NAMES[date.getMonth()] + ' ' + date.getFullYear();
}

/* Das Monatsraster: volle Wochen vom Wochenbeginn vor dem Monatsersten bis zum
   Wochenende nach dem Monatsletzten, damit das Gitter rechteckig bleibt.
   firstDay ist der getDay()-Wert der ersten Spalte. Die Zahl der Zeilen wird
   gerechnet und nicht auf sechs gesetzt: ein Februar, der an einem Montag
   beginnt, braucht vier - eine leere Zeile waere sichtbar. */
export function monthGrid(date, firstDay){
  const erster = startOfMonth(date);
  const vor = (((erster.getDay() - firstDay) % 7) + 7) % 7;
  const tage = dayOffset(addMonths(erster, 1), erster);
  const zellen = Math.ceil((vor + tage) / 7) * 7;
  const out = [];
  for(let i = 0; i < zellen; i++) out.push(addDays(erster, i - vor));
  return out;
}

/* Die Kopfzeile des Monatsrasters in derselben Spaltenfolge wie monthGrid. */
export function weekdayColumns(firstDay){
  const out = [];
  for(let i = 0; i < 7; i++) out.push(WEEKDAY_SHORT[(firstDay + i) % 7]);
  return out;
}
