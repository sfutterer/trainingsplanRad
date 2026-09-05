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

   Drei Aenderungen dagegen, alle hier:

     Der Kopf ist von 206 px auf 64 px geschrumpft. Der Wechsel Woche/Monat
     sitzt jetzt in der Blaetterleiste (siehe KalenderNavi), die Statuskarte
     steht unter den Tagen statt darueber. Zugeklappt sagte sie ohnehin nur die
     Wochennummer - dieselbe Zahl, die als Titel in der Blaetterleiste steht.

     Die zurueckliegenden Tage der laufenden Woche stehen als eine Zeile da
     statt als fuenf Karten - siehe Rueckblick weiter unten. Aus den 425 px
     werden 66, und die Zeile sagt dabei mehr, als die Karten sagten.

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
import { tagesrueckschau } from '../../../state/meldungen.js';
import { isoDayLocal, toMidnight, dayFromIso, addDays, phaseName,
         isWinterBlock, isRecoveryWeek, isTestWeek, testWeeks, testDateFor,
         trainingWeekDays, trainingWeekStart, weekNumberFor,
         datumText, tagUndMonat, WEEKDAY_SHORT } from '../../../domain/week.js';
import { usesCoggan } from '../../../domain/zones.js';
import { useWellness, Tagesinhalt, Tageskopf, tagesArten } from './Tag.jsx';
import { Monatsansicht } from './Monatsansicht.jsx';
import { KalenderNavi } from './KalenderNavi.jsx';
import { Einheitssymbol } from '../../components/Einheitssymbol.jsx';
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

/* Wie viele der zurueckliegenden Tage ihre Vorgabe erfuellt haben.

   Gezaehlt wird nur, was eine Vorgabe hatte: ein Ruhetag ist nichts, was man
   erledigt, und "4 von 6" mit zwei Ruhetagen darin waere eine Zahl, die zu
   schlecht aussieht. "extra" - eine Fahrt am Ruhetag - zaehlt aus demselben
   Grund nicht mit: sie stand nicht im Plan.

   Ohne Rueckschau (kein Schluessel, Abruf gescheitert) kommt null heraus und
   die Zeile schweigt dazu. Eine Null waere eine Behauptung ueber Tage, ueber
   die nichts bekannt ist. */
function erledigtStand(tage, infos, status){
  if(!status) return null;
  let geplant = 0, erledigt = 0;
  tage.forEach((d, i) => {
    const info = infos[i];
    if(info.vorStart || info.type === 'rest' || info.type === 'restopt') return;
    const s = status[isoDayLocal(d)];
    if(!s) return;
    geplant++;
    if(s === 'ok') erledigt++;
  });
  return geplant ? { geplant, erledigt } : null;
}

/* Die Rueckschau als Nachschlagewerk nach Tag. null bleibt null - siehe
   tagesrueckschau in state/meldungen.js. */
function statusNachTag(rueckschau){
  if(!rueckschau) return null;
  const raus = {};
  for(const r of rueckschau){ if(r && r.date) raus[isoDayLocal(r.date)] = r.status; }
  return raus;
}

/* Die zurueckliegenden Tage der laufenden Woche als eine Zeile.

   An einem Samstag lagen hier fuenf ganze Tageskarten, rund 425 px, die man
   jeden Tag aufs Neue durchscrollte, um beim heutigen anzukommen. Sie
   wegzulassen kam nicht in Frage: die Woche ist der Block, in dem geplant
   wird, und eine Woche, die am Mittwoch anfaengt, ist keine.

   Also zusammengefasst statt weggenommen - und die Zusammenfassung beantwortet
   dabei eine Frage, die fuenf zugeklappte Karten nicht beantworteten: wie viel
   von der Woche schon hinter einem liegt. Jeder Tag steht mit Kuerzel und dem
   Zeichen seiner Einheitsart da, erledigte in der Bestaetigungsfarbe,
   verpasste in der Warnfarbe.

   Ein Tipp klappt die Tage wieder als volle Karten aus, jede einzeln weiter
   auf- und zuklappbar wie zuvor. Die Zeile bleibt dabei stehen: sie ist der
   Weg zurueck.

   Nur in der laufenden Woche. In einer vergangenen gibt es keinen heutigen
   Tag, den man schuetzen muesste, und alle sieben Tage sind gleich viel wert.

   Der Knopf traegt kein aria-expanded und ist trotzdem eines: die Tage stehen
   als Geschwister darunter und nicht in ihm - aria-controls waere die richtige
   Verbindung, braeuchte aber sieben Kennungen fuer eine Liste, die ohnehin
   direkt darauf folgt. aria-expanded allein, ohne Bezug, verspricht der
   Sprachausgabe einen Inhalt, den sie im Knopf sucht und nicht findet. */
function Rueckblick({ tage, infos, status, stand, offen, umschalten, karte }){
  const spanne = WEEKDAY_SHORT[tage[0].getDay()] +
    (tage.length > 1 ? '–' + WEEKDAY_SHORT[tage[tage.length - 1].getDay()] : '');

  return (
    <div class="card rueckblick" ref={karte}>
      <button class="rueckzeile" type="button" onClick={umschalten}>
        <span class="dayzeile-oben">
          <span class="tagname">Zurückliegend · {spanne}</span>
          <span class="tagmarke">
            {stand ? stand.erledigt + ' von ' + stand.geplant + ' erledigt' : ''}
          </span>
        </span>
        <span class="rucktage">
          {tage.map((d, i) => {
            const iso = isoDayLocal(d);
            const s = status ? status[iso] : null;
            return (
              <span class={'rucktag' + (s ? ' st-' + s : '')} key={iso}>
                <b>{WEEKDAY_SHORT[d.getDay()]}</b>
                <span class="ruckarten">
                  {!infos[i].vorStart && tagesArten(infos[i]).map(a =>
                    <Einheitssymbol art={a} klasse="rucksym" key={a} />)}
                </span>
              </span>
            );
          })}
        </span>
        <span class={'chevron' + (offen ? ' auf' : '')} aria-hidden="true" />
      </button>
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

  /* Aufgeklappt bleibt der Rueckblick, bis man ihn zuklappt. Er gehoert
     ohnehin nur zur laufenden Woche - in jeder anderen steht er gar nicht. */
  const [rueckOffen, setRueckOffen] = useState(false);

  const tage = trainingWeekDays(anker, start);
  const nummer = Math.max(weekNumberFor(anker, start), 1);
  const inDieserWoche = isoDayLocal(trainingWeekStart(heute, start)) === isoDayLocal(tage[0]);

  const spanne = tagUndMonat(tage[0]) + '–' + tagUndMonat(tage[6]);

  const infos = tage.map(d => buildDayInfo(p, th, d, start, varianten.value));

  /* Die Tage vor heute stehen zusammengefasst - aber nur in der laufenden
     Woche, und nur wenn es welche gibt. Am ersten Tag der Woche ist der
     heutige schon der erste, und eine Zeile ueber null Tage waere ein Knopf
     ohne Inhalt. */
  const heuteIndex = inDieserWoche ? tage.findIndex(d => isoDayLocal(d) === heuteIso) : -1;
  const zurueck = heuteIndex > 0 ? tage.slice(0, heuteIndex) : [];
  const status = statusNachTag(tagesrueckschau.value);
  const stand = zurueck.length
    ? erledigtStand(zurueck, infos.slice(0, heuteIndex), status) : null;
  /* Zugeklappt faengt die Liste beim heutigen Tag an, aufgeklappt und in jeder
     anderen Woche bei ihrem ersten. */
  const abIndex = zurueck.length && !rueckOffen ? heuteIndex : 0;

  /* Der Sprung an den Anfang der Woche.

     Ziel ist das erste, was von der Woche zaehlt: der zugeklappte Rueckblick,
     wenn es einen gibt - er ist die Vergangenheit in 66 px, und darunter steht
     sofort der heutige Tag. Ohne ihn der heutige Tag selbst, und in einer
     fremden Woche deren erster: in eine Woche mitten hinein zu scrollen waere
     genau die Bewegung, die hier abgeschafft wird.

     Der Rueckblick als Ziel und nicht der heutige Tag darunter: sonst
     verschwaende der Sprung genau die Zeile, die sagt, wie viel von der Woche
     hinter einem liegt - und um die 66 px, die sie kostet, ginge es dann auch
     nicht mehr. Aufgeklappt faellt das Ziel wieder auf den heutigen Tag, sonst
     landete man vor sechs Karten, die man sich gerade angesehen hat.

     Der Sprung haengt an der gezeigten Woche und nicht am Aufbau der Ansicht:
     er soll auch dann kommen, wenn man aus der Woche davor zurueckblaettert
     oder "Heute" antippt.

     Ohne Bewegung, weil es keine ist, die man mit den Augen verfolgt, sondern
     die Stelle, an der die Ansicht anfaengt. Wohin genau, sagt das
     scroll-margin-top in plan.css - sonst schoebe der Sprung die Karte unter
     die klebende Blaetterleiste. */
  const zielKarte = useRef(null);
  const wochenIso = isoDayLocal(tage[0]);
  const zielIstRueckblick = zurueck.length > 0 && !rueckOffen;
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

      {zurueck.length > 0 && (
        <Rueckblick tage={zurueck} infos={infos.slice(0, heuteIndex)}
          status={status} stand={stand} offen={rueckOffen}
          karte={zielIstRueckblick ? zielKarte : undefined}
          umschalten={() => setRueckOffen(o => !o)} />
      )}

      {tage.slice(abIndex).map((d, i) => {
        const iso = isoDayLocal(d);
        const istHeute = iso === heuteIso;
        return (
          <Wochenzeile key={iso} datum={d} info={infos[abIndex + i]}
            istHeute={istHeute} offen={offen.includes(iso)}
            karte={!zielIstRueckblick && iso === zielIso ? zielKarte : undefined}
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
