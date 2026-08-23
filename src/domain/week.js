/* Kalender, Wochen und Phasen.

   Bewusst ohne Date.now(): jede Funktion bekommt den Zeitpunkt uebergeben.
   Sonst laesst sich der Plan nicht ueber 16 Wochen durchtesten, ohne die
   Systemuhr zu stellen. */

export const WEEKDAY_NAMES = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

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

export function planWeek(plan, week){
  return plan.weeks[weekIndex(plan, week)];
}

export function isRecoveryWeek(plan, week){
  return week % plan.recoveryEveryNthWeek === 0;
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

/* Donnerstag und Samstagsbloecke stehen je Woche in der Datei. Im Winterblock
   greift der eigene Abschnitt, sonst rechnete die App mit der rohen
   Wochennummer weiter - was in der Einzeldatei-Fassung ein stiller Fehler war. */
export function thursdayData(plan, week){
  return isWinterBlock(plan, week) ? plan.winterBlock.thursday : planWeek(plan, week).thursday;
}

export function saturdayBlockData(plan, week){
  if(isRecoveryWeek(plan, week)) return null;
  return (isWinterBlock(plan, week) ? plan.winterBlock.saturdayBlocks : planWeek(plan, week).saturdayBlocks) || null;
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
   Testtermin ist also der erste Donnerstag ab Wochenbeginn. */
export function testDateFor(plan, week, startDate){
  const d = toMidnight(startDate);
  d.setDate(d.getDate() + (week - 1) * 7);
  while(d.getDay() !== 4) d.setDate(d.getDate() + 1);
  return d;
}
