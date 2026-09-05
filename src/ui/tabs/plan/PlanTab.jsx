/* Die Plan-Ansicht als Kalender.

   Vorher lief hier eine feste Schleife ueber sieben Tage ab heute. Das war
   kein Kalender, sondern ein Ausschnitt: die uebernaechste Woche liess sich
   nicht ansehen, die vergangene auch nicht, und der Sonntag stand je nach
   Wochentag mal an erster und mal an letzter Stelle. Jetzt gibt es einen
   Ankertag, den beide Ansichten teilen - die Wochenansicht zeigt die
   Trainingswoche, in der er liegt, die Monatsansicht den Monat. Wer im Monat
   einen Tag antippt und dann auf Woche umschaltet, landet in dessen Woche.

   Die Wochenansicht ist die Voreinstellung, weil die Trainingswoche die
   Einheit ist, in der geplant wird; der Monat beantwortet die seltenere Frage
   nach der Lage im Jahr.

   Aufgeklappt ist immer der heutige Tag, die uebrigen auf Tippen. Mehrere
   duerfen gleichzeitig offen sein - beim Vergleich von Donnerstag und Samstag
   war das Zuklappen des einen beim Oeffnen des anderen genau die Bewegung, die
   man nicht wollte.

   Die Statuskarte ganz oben ist zugeklappt voreingestellt und zeigt dann nur
   noch, in welcher Woche man steht. Phase, Zonenherkunft und Startdatum
   aendern sich innerhalb einer Woche nicht - man liest sie einmal und danach
   nie wieder, und bis dahin schoben sie zusammen mit den Hinweisen die erste
   Tageskarte fast aus dem Bild. Sie stehen weiter da, aber einen Tipp weit.

   Der heutige Tag bekommt keinen Klappknopf, sondern eine feste Kopfzeile. Ein
   Knopf, der nichts tut, oder ein deaktivierter Knopf ueber einem sichtbaren
   Inhalt waere ein Bedienelement ohne Bedienung; die uebrigen Tage sind
   dagegen echte <button> mit aria-expanded. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, week, varianten } from '../../../state/store.js';
import { buildDayInfo } from '../../../domain/day.js';
import { isoDayLocal, toMidnight, dayFromIso, addDays, phaseName,
         isWinterBlock, isRecoveryWeek, isTestWeek, testWeeks, testDateFor,
         trainingWeekDays, trainingWeekStart, weekNumberFor,
         datumText, tagUndMonat } from '../../../domain/week.js';
import { usesCoggan } from '../../../domain/zones.js';
import { useWellness, Tagesinhalt, Tageskopf } from './Tag.jsx';
import { Monatsansicht } from './Monatsansicht.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { KalenderNavi } from './KalenderNavi.jsx';
import './plan.css';

const ANSICHTEN = [
  { id: 'woche', label: 'Woche' },
  { id: 'monat', label: 'Monat' }
];

/* Die Ankuendigung des naechsten Tests.

   Das Fenster stand bis Fassung 2 fest auf 14 Tagen. Seit Fassung 3 gibt es
   einen verbindlichen Anlauf, und dessen Vorlauf steht in plan.json - beide
   Zahlen nebeneinander wuerden auseinanderlaufen. Die Tagesvorgaben des
   Anlaufs stehen bewusst nicht hier, sondern auf der Karte des Tages, fuer den
   sie gelten. */
function naechsterTest(p, heute, start){
  const vorlauf = p.testTaper ? p.testTaper.leadDays : 14;
  for(const w of testWeeks(p)){
    const d = testDateFor(p, w, start);
    const tage = Math.round((d - toMidnight(heute)) / 86400000);
    if(tage < 0) continue;
    if(tage === 0) return 'Heute ist Schwellentest (Woche ' + w + '). Danach FTP und LTHR unten eintragen.';
    if(tage <= vorlauf) return 'Nächster Schwellentest: ' + datumText(d) +
      ' (Woche ' + w + '), in ' + tage + (tage === 1 ? ' Tag' : ' Tagen') +
      '. Der Testanlauf läuft – die Vorgabe steht auf der jeweiligen Tageskarte.';
    return null;
  }
  return null;
}

function StatusKarte(){
  const p = plan.value, w = week.value, start = startDate.value, th = thresholds.value;
  const winter = isWinterBlock(p, w);
  const [offen, setOffen] = useState(false);

  const hinweise = [];
  if(winter) hinweise.push(p.winterBlock.note);
  if(isTestWeek(p, w)) hinweise.push('Testwoche: der Donnerstag ist Schwellentest, kein Intervalltag.');
  const tn = naechsterTest(p, today.value, start);
  if(tn && !isTestWeek(p, w)) hinweise.push(tn);
  if(w >= p.cogganFromWeek && !(th.lthr > 0)){
    hinweise.push('Ab Woche ' + p.cogganFromWeek + ' rechnet der Plan mit Coggan-Zonen aus der LTHR. ' +
      'Solange kein Testwert eingetragen ist, laufen die Übergangsbänder weiter – die Zonenauswertung ist dann nur eine Näherung.');
  }

  return (
    <div class="card klappkarte">
      <button class="klappzeile" type="button" aria-expanded={offen ? 'true' : 'false'}
        onClick={() => setOffen(o => !o)}>
        <span>Trainingswoche</span>
        <b>Woche {w}{winter ? '' : ' von ' + p.weekCount}</b>
        <span class={'chevron' + (offen ? ' auf' : '')} aria-hidden="true" />
      </button>
      {offen && (
        <div class="klappinhalt">
          <div class="row"><span>Phase</span><b>
            {winter ? p.winterBlock.name : 'Phase ' + p.weeks[Math.min(w, p.weekCount) - 1].phase + ' · ' + phaseName(p, w)}
            {isRecoveryWeek(p, w) && !winter ? ' · Erholungswoche' : ''}
          </b></div>
          <div class="row"><span>Pulszonen</span><b>
            {usesCoggan(p, th, w) ? 'Coggan aus LTHR ' + th.lthr + ' bpm' : 'Übergangsbänder (bis zum Test)'}
          </b></div>
          <div class="row"><span>Beginn Woche 1</span><b>{datumText(start)}</b></div>
          {hinweise.map((h, i) => <p class="hint" key={i}>{h}</p>)}
        </div>
      )}
    </div>
  );
}

function Wochenzeile({ datum, info, istHeute, offen, umschalten, serie }){
  return (
    <div class={'card day type-' + info.type + (istHeute ? ' heute' : '')}>
      {istHeute
        ? <div class="dayzeile fest"><Tageskopf datum={datum} info={info} istHeute /></div>
        : <button class="dayzeile" type="button" aria-expanded={offen ? 'true' : 'false'}
            onClick={umschalten}>
            <Tageskopf datum={datum} info={info} mitKurz={!offen} />
            <span class={'chevron' + (offen ? ' auf' : '')} aria-hidden="true" />
          </button>}
      {(istHeute || offen) && (
        <div class="dayinhalt">
          <Tagesinhalt info={info} datum={datum} istHeute={istHeute} serie={serie} />
        </div>
      )}
    </div>
  );
}

function Wochenansicht({ anker, setzeAnker, serie }){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const heute = toMidnight(today.value);
  const heuteIso = isoDayLocal(heute);

  /* Offen gehaltene Tage stehen als ISO-Datum, nicht als Index in der Woche -
     sonst waere beim Blaettern derselbe Wochentag der naechsten Woche
     mitaufgeklappt. */
  const [offen, setOffen] = useState(() => []);
  const umschalten = iso => setOffen(o => o.includes(iso) ? o.filter(x => x !== iso) : o.concat(iso));

  const tage = trainingWeekDays(anker, start);
  const nummer = Math.max(weekNumberFor(anker, start), 1);
  const inDieserWoche = isoDayLocal(trainingWeekStart(heute, start)) === isoDayLocal(tage[0]);

  const spanne = tagUndMonat(tage[0]) + '–' + tagUndMonat(tage[6]);

  return (
    <>
      <div class="card kalnavi-karte">
        <KalenderNavi
          titel={'Woche ' + nummer} unter={spanne}
          zurueckLabel="Vorige Woche" vorLabel="Nächste Woche"
          onZurueck={() => setzeAnker(addDays(tage[0], -7))}
          onVor={() => setzeAnker(addDays(tage[0], 7))}
          onHeute={() => setzeAnker(heute)}
          heuteVersteckt={inDieserWoche} />
      </div>

      {tage.map(d => {
        const iso = isoDayLocal(d);
        return (
          <Wochenzeile key={iso} datum={d} info={buildDayInfo(p, th, d, start, varianten.value)}
            istHeute={iso === heuteIso} offen={offen.includes(iso)}
            umschalten={() => umschalten(iso)} serie={serie} />
        );
      })}
    </>
  );
}

export function PlanTab(){
  const [ansicht, setAnsicht] = useState('woche');
  const [ankerIso, setAnkerIso] = useState(() => isoDayLocal(toMidnight(today.value)));
  const anker = dayFromIso(ankerIso);
  const setzeAnker = d => setAnkerIso(isoDayLocal(d));
  const serie = useWellness();

  return (
    <>
      <StatusKarte />

      <Segmented ziele={ANSICHTEN} aktiv={ansicht} onWaehlen={setAnsicht}
        klasse="ansichtwahl" label="Ansicht" />

      {ansicht === 'woche'
        ? <Wochenansicht anker={anker} setzeAnker={setzeAnker} serie={serie} />
        : <Monatsansicht anker={anker} setzeAnker={setzeAnker} serie={serie} />}
    </>
  );
}
