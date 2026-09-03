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
import { Tagesinhalt, Tageskopf, tagesArten } from './Tag.jsx';
import { KalenderNavi } from './KalenderNavi.jsx';
import { Einheitssymbol } from '../../components/Einheitssymbol.jsx';

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
        <KalenderNavi
          titel={monthLabel(monat)}
          zurueckLabel="Voriger Monat" vorLabel="Nächster Monat"
          onZurueck={() => blaettern(-1)}
          onVor={() => blaettern(1)}
          onHeute={() => setzeAnker(heute)}
          heuteVersteckt={gleicherMonat(monat, heute)} />

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
               kein Zeichen - sonst behauptet das Raster eine Einheit fuer
               einen Zeitraum, in dem der Plan noch nicht lief.

               Aus dem Farbstrich unter der Zahl ist das Zeichen der Einheitsart
               geworden. Die Farbe allein trug die Aussage nur fuer den, der sie
               gelernt hatte - und fuer niemanden, der Rot und Gruen nicht
               unterscheidet. Die Art steht ohnehin schon im aria-label des
               Knopfes; das Zeichen sagt sie jetzt auch dem Auge. */
            return (
              <button class={klassen.join(' ')} type="button" key={iso}
                aria-pressed={iso === ankerIso ? 'true' : 'false'}
                aria-label={langesDatum(d) + (tinfo.vorStart ? ' – vor Planbeginn' : ' – ' + tinfo.title)}
                onClick={() => setzeAnker(d)}>
                <span class="kalzahl">{d.getDate()}</span>
                {/* Ein Tag mit zwei Arten zeigt zwei Zeichen. Im Raster ist das
                    die einzige Stelle, an der ein zweiter Termin ueberhaupt
                    sichtbar werden kann - ein Titel steht hier nicht. */}
                {!tinfo.vorStart && (
                  <span class="kalarten">
                    {tagesArten(tinfo).map(a =>
                      <Einheitssymbol art={a} klasse="kalsym" key={a} />)}
                  </span>
                )}
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
