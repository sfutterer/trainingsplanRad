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

   Der heutige Tag bekommt keinen Klappknopf, sondern eine feste Kopfzeile. Ein
   Knopf, der nichts tut, oder ein deaktivierter Knopf ueber einem sichtbaren
   Inhalt waere ein Bedienelement ohne Bedienung; die uebrigen Tage sind
   dagegen echte <button> mit aria-expanded. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, week } from '../../../state/store.js';
import { buildDayInfo } from '../../../domain/day.js';
import { isoDayLocal, toMidnight, dayFromIso, addDays, phaseName,
         isWinterBlock, isRecoveryWeek, isTestWeek, testWeeks, testDateFor,
         trainingWeekDays, trainingWeekStart, weekNumberFor } from '../../../domain/week.js';
import { usesCoggan } from '../../../domain/zones.js';
import { useWellness, Tagesinhalt, Tageskopf } from './Tag.jsx';
import { Monatsansicht } from './Monatsansicht.jsx';
import './plan.css';

function naechsterTest(p, heute, start){
  for(const w of testWeeks(p)){
    const d = testDateFor(p, w, start);
    const tage = Math.round((d - toMidnight(heute)) / 86400000);
    if(tage < 0) continue;
    if(tage === 0) return 'Heute ist Schwellentest (Woche ' + w + '). Danach FTP und LTHR unten eintragen.';
    if(tage <= 14) return 'Nächster Schwellentest: ' + d.toLocaleDateString('de-DE') +
      ' (Woche ' + w + '), in ' + tage + (tage === 1 ? ' Tag' : ' Tagen') + '.';
    return null;
  }
  return null;
}

function StatusKarte(){
  const p = plan.value, w = week.value, start = startDate.value, th = thresholds.value;
  const winter = isWinterBlock(p, w);

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
    <div class="card">
      <div class="row"><span>Trainingswoche</span><b>Woche {w}{winter ? '' : ' / ' + p.weekCount}</b></div>
      <div class="row"><span>Phase</span><b>
        {winter ? p.winterBlock.name : 'Phase ' + p.weeks[Math.min(w, p.weekCount) - 1].phase + ' · ' + phaseName(p, w)}
        {isRecoveryWeek(p, w) && !winter ? ' · Erholungswoche' : ''}
      </b></div>
      <div class="row"><span>Pulszonen</span><b>
        {usesCoggan(p, th, w) ? 'Coggan aus LTHR ' + th.lthr + ' bpm' : 'Übergangsbänder (bis zum Test)'}
      </b></div>
      <div class="row"><span>Beginn Woche 1</span><b>{start.toLocaleDateString('de-DE')}</b></div>
      {hinweise.map((h, i) => <p class="hint" key={i}>{h}</p>)}
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
          <Tagesinhalt info={info} istHeute={istHeute} serie={serie} />
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

  const spanne = tage[0].toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }) +
    '–' + tage[6].toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });

  return (
    <>
      <div class="card kalnavi-karte">
        <div class="kalnavi">
          <div class={'kalnavi-heute' + (inDieserWoche ? ' leer' : '')}>
            <button class="btn tonal heute-sprung" type="button"
              onClick={() => setzeAnker(heute)}>Heute</button>
          </div>
          <button class="iconbtn" type="button" aria-label="Vorige Woche"
            onClick={() => setzeAnker(addDays(tage[0], -7))}><span aria-hidden="true">‹</span></button>
          <div class="kalnavi-titel"><b>Woche {nummer}</b><span>{spanne}</span></div>
          <button class="iconbtn" type="button" aria-label="Nächste Woche"
            onClick={() => setzeAnker(addDays(tage[0], 7))}><span aria-hidden="true">›</span></button>
          <div class="kalnavi-heute spiegel" aria-hidden="true">
            <button class="btn tonal heute-sprung" type="button" tabIndex={-1}>Heute</button>
          </div>
        </div>
      </div>

      {tage.map(d => {
        const iso = isoDayLocal(d);
        return (
          <Wochenzeile key={iso} datum={d} info={buildDayInfo(p, th, d, start)}
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

      <div class="segmented ansichtwahl" role="group" aria-label="Ansicht">
        <button class={'segbtn' + (ansicht === 'woche' ? ' an' : '')} type="button"
          aria-pressed={ansicht === 'woche' ? 'true' : 'false'}
          onClick={() => setAnsicht('woche')}>Woche</button>
        <button class={'segbtn' + (ansicht === 'monat' ? ' an' : '')} type="button"
          aria-pressed={ansicht === 'monat' ? 'true' : 'false'}
          onClick={() => setAnsicht('monat')}>Monat</button>
      </div>

      {ansicht === 'woche'
        ? <Wochenansicht anker={anker} setzeAnker={setzeAnker} serie={serie} />
        : <Monatsansicht anker={anker} setzeAnker={setzeAnker} serie={serie} />}
    </>
  );
}
