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

   ---- Der Weg zum heutigen Tag ----

   An einem Samstag standen bis zum 05.09.2026 gut 600 px ueber der heutigen
   Karte: 206 px Kopf und fuenf zurueckliegende Tage. Man musste sich in den
   eigenen Tag hineinscrollen, und zwar jeden Tag aufs Neue. Die Wochentrennung
   selbst ist dabei nicht das Problem, sondern erwuenscht - sie ist der Grund,
   warum die Woche ueberhaupt als Block dasteht.

   Zwei Aenderungen dagegen, beide hier:

     Der Kopf ist von 206 px auf 64 px geschrumpft. Der Wechsel Woche/Monat
     sitzt jetzt in der Blaetterleiste (siehe KalenderNavi), die Statuskarte
     steht unter den Tagen statt darueber. Zugeklappt sagte sie ohnehin nur die
     Wochennummer - dieselbe Zahl, die als Titel in der Blaetterleiste steht.

     Enthaelt die gezeigte Woche den heutigen Tag, holt die Ansicht ihn beim
     Aufschlagen an den oberen Rand. Ohne Bewegung: es ist kein Sprung, den man
     mit den Augen verfolgt, sondern die Stelle, an der die Ansicht anfaengt.
     Wer nach oben wischt, ist sofort wieder am Wochenanfang.

   Die Blaetterleiste klebt dabei oben fest. Sie traegt die einzige Angabe, die
   sich nicht aus den Karten darunter ergibt - welche Woche das hier ist -, und
   sie traegt die Pfeile: wer unten am Sonntag angekommen ist, blaettert
   weiter, ohne erst zurueckzuwischen. Dass sie ueberhaupt kleben kann, hat
   app.css moeglich gemacht: der Rahmen war bis dahin so hoch wie sein Inhalt,
   und gescrollt wurde das Dokument.

   Der heutige Tag bekommt keinen Klappknopf, sondern eine feste Kopfzeile. Ein
   Knopf, der nichts tut, oder ein deaktivierter Knopf ueber einem sichtbaren
   Inhalt waere ein Bedienelement ohne Bedienung; die uebrigen Tage sind
   dagegen echte <button> mit aria-expanded. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, week, varianten } from '../../../state/store.js';
import { buildDayInfo } from '../../../domain/day.js';
import { isoDayLocal, toMidnight, dayFromIso, addDays, phaseName,
         isWinterBlock, isRecoveryWeek, isTestWeek, testWeeks, testDateFor,
         trainingWeekDays, trainingWeekStart, weekNumberFor,
         datumText, tagUndMonat } from '../../../domain/week.js';
import { usesCoggan } from '../../../domain/zones.js';
import { useWellness, Tagesinhalt, Tageskopf } from './Tag.jsx';
import { Monatsansicht } from './Monatsansicht.jsx';
import { KalenderNavi } from './KalenderNavi.jsx';
import './plan.css';

/* Der Knopf rechts in der Blaetterleiste nennt immer die jeweils andere
   Ansicht - er ist ein Ziel, kein Zustand. */
const ANDERE_ANSICHT = { woche: 'monat', monat: 'woche' };
const ANSICHT_NAME = { woche: 'Woche', monat: 'Monat' };

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

function Wochenzeile({ datum, info, istHeute, offen, umschalten, serie, karte }){
  return (
    <div class={'card day type-' + info.type + (istHeute ? ' heute' : '')} ref={karte}>
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

function Wochenansicht({ anker, setzeAnker, serie, ansichtLabel, onAnsicht }){
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

  /* Der Sprung an den Anfang der Woche.

     Das ist der heutige Tag, wenn er in der gezeigten Woche liegt, sonst deren
     erster Tag. Zwei Faelle, ein Weg: die Woche faengt oben an. In eine fremde
     Woche mitten hinein zu scrollen waere genau die Bewegung, die hier gerade
     abgeschafft wird.

     Der Sprung haengt an der gezeigten Woche und nicht am Aufbau der Ansicht:
     er soll auch dann kommen, wenn man aus der Woche davor zurueckblaettert
     oder "Heute" antippt.

     Ohne Bewegung, weil es keine ist, die man mit den Augen verfolgt, sondern
     die Stelle, an der die Ansicht anfaengt. Wohin genau, sagt das
     scroll-margin-top in plan.css - sonst schoebe der Sprung die Karte unter
     die klebende Blaetterleiste. */
  const zielKarte = useRef(null);
  const wochenIso = isoDayLocal(tage[0]);
  const zielIso = inDieserWoche ? heuteIso : wochenIso;
  useEffect(() => {
    if(zielKarte.current) zielKarte.current.scrollIntoView({ block: 'start' });
  }, [wochenIso]);

  return (
    <>
      <div class="card kalnavi-karte">
        <KalenderNavi
          titel={'Woche ' + nummer} unter={spanne}
          zurueckLabel="Vorige Woche" vorLabel="Nächste Woche"
          onZurueck={() => setzeAnker(addDays(tage[0], -7))}
          onVor={() => setzeAnker(addDays(tage[0], 7))}
          onHeute={() => setzeAnker(heute)}
          heuteVersteckt={inDieserWoche}
          ansichtLabel={ansichtLabel} onAnsicht={onAnsicht} />
      </div>

      {tage.map(d => {
        const iso = isoDayLocal(d);
        const istHeute = iso === heuteIso;
        return (
          <Wochenzeile key={iso} datum={d} info={buildDayInfo(p, th, d, start, varianten.value)}
            istHeute={istHeute} offen={offen.includes(iso)}
            karte={iso === zielIso ? zielKarte : undefined}
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

  const andere = ANDERE_ANSICHT[ansicht];
  const wechsel = { ansichtLabel: ANSICHT_NAME[andere], onAnsicht: () => setAnsicht(andere) };

  return (
    <>
      {ansicht === 'woche'
        ? <Wochenansicht anker={anker} setzeAnker={setzeAnker} serie={serie} {...wechsel} />
        : <Monatsansicht anker={anker} setzeAnker={setzeAnker} serie={serie} {...wechsel} />}

      <StatusKarte />
    </>
  );
}
