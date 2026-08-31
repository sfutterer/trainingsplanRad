/* Was die Glocke zu melden hat.

   Drei Anlaesse, mehr nicht:

     1  Einmal am Tag, was heute ansteht.
     2  Ein rotes Wellness-Gate - die Vorgabe muss dann heruntergestuft werden.
     3  Ein Tag, an dem das Trainingsziel nicht erfuellt wurde.

   Die Auswahl ist bewusst knapp. Eine Glocke, an der staendig eine Zahl
   klebt, wird nicht gelesen, sondern weggetippt; danach geht auch die eine
   Meldung unter, auf die es ankam. Deshalb keine Meldung fuer erfuellte Tage,
   keine fuer ein gruenes Gate und keine fuer den Gewichtstrend - der steht auf
   der Tageskarte und ist eine Aussage ueber Wochen, kein Ereignis.

   Jede Meldung traegt eine Kennung aus Art und Tag. Sie ist der ganze Trick
   hinter "einmal taeglich": die Meldung entsteht bei jedem Start neu, aber
   sobald ihre Kennung als gelesen vermerkt ist, faellt sie hier heraus. Ein
   neuer Tag ergibt eine neue Kennung und damit eine neue Meldung.

   Rein: kein DOM, kein fetch, keine Uhr. Was "heute" ist, kommt herein. */

import { buildDayInfo } from './day.js';
import { isoDayLocal } from './week.js';
import { wellnessMassnahmen } from './wellness.js';

/* So weit zurueck wird nach verpassten Zielen gesucht.

   Eine Woche, weil der Plan in Wochen denkt: was laenger her ist, laesst sich
   nicht mehr nachholen und gehoert in die Auswertung, nicht in eine Meldung.
   Der heutige Tag bleibt aussen vor - er ist noch nicht vorbei. */
export const RUECKSCHAU_TAGE = 7;

/* Nicht jede Abweichung ist eine Meldung wert. "dev" heisst unter anderem "35 %
   laenger gefahren" - das ist keine verpasste Vorgabe. Gemeldet wird, was
   ausgefallen ist oder zu kurz kam; alles Feinere steht in der Analyse. */
const VERPASST = { miss: true, dev: true };

/* Was heute ansteht - der taegliche Anlass.

   Bewusst nur Titel und die ersten Eckwerte: die Meldung soll den Blick auf
   den Plan ersetzen, wenn nichts weiter ansteht, und ihn ausloesen, wenn doch.
   Der ganze Ablauf steht zwei Antipper entfernt auf der Tageskarte. */
export function trainingsMeldung(plan, th, heute, startDate){
  const tag = isoDayLocal(heute);
  const info = buildDayInfo(plan, th, heute, startDate);
  /* Vor dem Planbeginn gibt es keine Vorgabe, ueber die sich etwas melden
     liesse - buildDayInfo klemmt dort auf Woche 1. */
  if(info.vorStart) return null;

  const zeilen = info.kennzahlen.slice(0, 3).map(k => k.label + ': ' + k.wert);
  if(!zeilen.length && info.hinweise.length) zeilen.push(info.hinweise[0]);

  return { id: 'training:' + tag, art: 'training', ton: 'info', tag,
           titel: info.title, zeilen };
}

/* Das rote Gate.

   Die Massnahmen haengen daran, was der Donnerstag vorsieht - und das weiss
   nur buildDayInfo, und auch nur am Mittwoch und am Donnerstag. An den
   uebrigen Tagen bleibt es bei den Gruenden: ein erhoehter Ruhepuls ist auch
   am Sonntag eine Nachricht, aber "Donnerstag wird 60 min Z2" waere dort eine
   Anweisung fuer einen Tag, ueber den heute nichts entschieden wird. */
export function gateMeldung(serie, plan, th, heute, startDate){
  if(!serie || !serie.heute || !serie.heute.rot) return null;

  const gate = serie.heute;
  const tag = gate.heute.id;
  const info = buildDayInfo(plan, th, heute, startDate);
  const rolle = info.wellness ? info.wellness.rolle : null;

  const zeilen = [gate.gruende.join(' · ') + '.'];
  if(rolle === 'vorschau'){
    zeilen.push('Entscheidend ist der Wert morgen früh – bleibt es dabei:');
  }
  if(rolle) zeilen.push(...wellnessMassnahmen(info.wellness.donnerstag, serie.zweiRot));

  return { id: 'gate:' + tag, art: 'gate', ton: 'warn', tag,
           titel: 'Wellness-Gate rot' + (rolle === 'vorschau' ? ' (Stand heute)' : ''),
           zeilen };
}

/* Die verpassten Ziele aus der Rueckschau.

   Eine Meldung je Tag, nicht je Einheit: der Tag ist die Einheit, in der der
   Plan eine Vorgabe macht, und zwei Zeilen fuer denselben Donnerstag waeren
   zweimal dieselbe Nachricht. Der juengste Tag zuerst - er ist der einzige,
   der sich noch verschieben laesst. */
export function zielMeldungen(rows){
  return (rows || [])
    .filter(r => r && !r.plan.vorStart && VERPASST[r.status])
    .map(r => {
      const tag = isoDayLocal(r.date);
      const zeilen = r.notes.filter(n => n.kind === 'bad').map(n => n.text);
      if(!zeilen.length && r.badge) zeilen.push(r.badge);
      return { id: 'ziel:' + tag, art: 'ziel', ton: 'warn', tag,
               titel: r.plan.title, badge: r.badge, zeilen };
    })
    .sort((a, b) => (a.tag < b.tag ? 1 : a.tag > b.tag ? -1 : 0));
}

/* Alle Meldungen in der Reihenfolge, in der sie gelesen werden sollen.

   Zuerst, was eine Entscheidung verlangt: das rote Gate stuft den heutigen
   oder morgigen Qualitaetstag herunter, ein verpasster Tag verschiebt
   moeglicherweise die Woche. Was heute ansteht, steht darunter - es ist die
   Meldung, die immer da ist, und deshalb die, die sich nach unten sortieren
   laesst, ohne verloren zu gehen. */
export function baueMeldungen({ plan, th, heute, startDate, serie, rows }){
  const liste = [];
  const gate = gateMeldung(serie, plan, th, heute, startDate);
  if(gate) liste.push(gate);
  liste.push(...zielMeldungen(rows));
  const training = trainingsMeldung(plan, th, heute, startDate);
  if(training) liste.push(training);
  return liste;
}

/* Was davon noch offen ist. Eigene Funktion und kein Filter beim Bauen: die
   Liste der gelesenen Kennungen gehoert dem Speicher, nicht der Regel. */
export function offeneMeldungen(alle, gelesen){
  const weg = new Set(gelesen || []);
  return (alle || []).filter(m => !weg.has(m.id));
}
