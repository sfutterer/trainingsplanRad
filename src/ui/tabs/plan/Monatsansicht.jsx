/* Der Monat als Raster, wie ihn jeder Android-Kalender zeigt.

   Die Spalten beginnen am MONTAG, obwohl die Trainingswoche am Samstag
   beginnt. Das ist eine bewusste Entscheidung gegen die naheliegende: ein
   Monatsraster ist eine Landkarte des Kalenders, und der Nutzer vergleicht es
   im Kopf mit der Systemuhr, dem Kalender des Telefons und einem Wandkalender
   - alle drei stehen im deutschen Sprachraum auf Montag. Begaenne die erste
   Spalte am Samstag, laege jeder Wochentag eine bis zwei Spalten neben der
   Stelle, an der er ueberall sonst steht, und die Ansicht waere im Augenwinkel
   nicht mehr lesbar. Die Trainingswoche geht dadurch nicht verloren: der erste
   Tag jeder Trainingswoche bekommt eine Kante nach links, die Grenze ist also
   sichtbar, ohne das Raster zu verbiegen. Gerechnet wird sie aus dem
   Startdatum und nicht aus dem Wochentag, damit sie mit weekNumberFor
   zusammenfaellt.

   Der angetippte Tag oeffnet einen Bereich UNTER dem Raster, keinen Dialog.
   Auf einem Handy verdeckt ein Dialog das Raster, aus dem man gerade kommt,
   und kostet zwei Bedienschritte statt keinem; der Bereich darunter laesst
   Raster und Tag gleichzeitig stehen. */

import { plan, thresholds, startDate, today } from '../../../state/store.js';
import { buildDayInfo } from '../../../domain/day.js';
import {
  toMidnight, isoDayLocal, dayOffset, addMonths, startOfMonth, monthGrid,
  monthLabel, weekdayColumns, WEEKDAY_NAMES
} from '../../../domain/week.js';
import { Tagesinhalt, Tageskopf } from './Tag.jsx';

/* getDay()-Wert der ersten Spalte. Siehe Begruendung im Dateikopf. */
const ERSTE_SPALTE = 1;

function gleicherMonat(a, b){
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function langesDatum(d){
  return WEEKDAY_NAMES[d.getDay()] + ', ' +
    d.toLocaleDateString('de-DE', { day:'2-digit', month:'long', year:'numeric' });
}

export function Monatsansicht({ anker, setzeAnker, serie }){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const heute = toMidnight(today.value);
  const heuteIso = isoDayLocal(heute);
  const ankerIso = isoDayLocal(anker);

  const monat = startOfMonth(anker);
  const zellen = monthGrid(monat, ERSTE_SPALTE);
  const koepfe = weekdayColumns(ERSTE_SPALTE);

  /* Beim Blaettern den heutigen Tag waehlen, sobald er im Zielmonat liegt -
     sonst den Monatsersten. Den Tag des Monats mitzunehmen ginge auch, faende
     aber am 31. keinen Platz. */
  function blaettern(n){
    const ziel = addMonths(monat, n);
    setzeAnker(gleicherMonat(ziel, heute) ? heute : ziel);
  }

  const info = buildDayInfo(p, th, anker, start);
  const istHeute = ankerIso === heuteIso;

  return (
    <>
      <div class="card kalender">
        <div class="kalnavi">
          <button class="iconbtn" type="button" aria-label="Voriger Monat"
            onClick={() => blaettern(-1)}><span aria-hidden="true">‹</span></button>
          <div class="kalnavi-titel"><b>{monthLabel(monat)}</b></div>
          <button class="iconbtn" type="button" aria-label="Nächster Monat"
            onClick={() => blaettern(1)}><span aria-hidden="true">›</span></button>
          {!gleicherMonat(monat, heute) && (
            <button class="btn tonal klein" type="button"
              onClick={() => setzeAnker(heute)}>Heute</button>
          )}
        </div>

        <div class="kalkopf" aria-hidden="true">
          {koepfe.map(k => <span key={k}>{k}</span>)}
        </div>

        <div class="kalgitter">
          {zellen.map(d => {
            const iso = isoDayLocal(d);
            const tinfo = buildDayInfo(p, th, d, start);
            const klassen = ['kaltag'];
            if(!gleicherMonat(d, monat)) klassen.push('fremd');
            if(iso === heuteIso) klassen.push('istheute');
            if((((dayOffset(d, start) % 7) + 7) % 7) === 0) klassen.push('wochenstart');
            /* Vor dem Planbeginn traegt der Tag keine Trainingsart, also auch
               keinen Farbpunkt - sonst behauptet das Raster eine Einheit fuer
               einen Zeitraum, in dem der Plan noch nicht lief. */
            return (
              <button class={klassen.join(' ')} type="button" key={iso}
                aria-pressed={iso === ankerIso ? 'true' : 'false'}
                aria-label={langesDatum(d) + (tinfo.vorStart ? ' – vor Planbeginn' : ' – ' + tinfo.title)}
                onClick={() => setzeAnker(d)}>
                <span class="kalzahl">{d.getDate()}</span>
                {!tinfo.vorStart &&
                  <span class={'kalpunkt type-' + tinfo.type} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      <div class={'card day type-' + info.type + (istHeute ? ' heute' : '')}>
        <div class="dayzeile fest">
          <Tageskopf datum={anker} info={info} istHeute={istHeute} />
        </div>
        <div class="dayinhalt">
          <Tagesinhalt info={info} istHeute={istHeute} serie={serie} />
        </div>
      </div>
    </>
  );
}
