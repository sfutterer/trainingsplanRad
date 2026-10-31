/* Der Schwellentest als eigener Bereich.

   Bis hierher war der Test in der App an drei Stellen halb vorhanden: als
   Tageskarte im Plan, als Betriebsart des Intervalltimers und als Formular
   unter den Zonen. Keine davon beantwortete die Frage, die man am Testmorgen
   hat - was ist heute zu tun, woran halte ich mich waehrend der 20 Minuten,
   und was mache ich danach mit den Zahlen. Der Test ist aber die Messung, an
   der die Pulsbaender des ganzen Folgeblocks haengen: ein zu vorsichtig
   gefahrener Test verzerrt acht Wochen Training.

   Drei Ansichten, in der Reihenfolge, in der man sie braucht:

     Anleitung   Wo im Anlauf stehe ich, was gilt heute, wie wird gefahren,
                 was passiert mit dem Ergebnis. Das Go/No-Go steht am Testtag
                 oben und sonst weiter unten.
     Ablauf      Die Uhr - fuer den Test und fuer die beiden Anlaufeinheiten
                 mit Schrittfolge. Vorgewaehlt ist die von heute.
     Ergebnis    Ø-Watt und Ø-Puls der 20 Minuten hinein, FTP und LTHR heraus.

   Der Tempotest bekommt eine eigene Rolle. Aus seinen zwei mal sechs Minuten
   faellt die Leistung, auf die im Test gezielt wird; der Plan sagt
   ausdruecklich "notieren", und notiert wurde sie bisher nirgends.

   Er steht deshalb dreifach in der Anleitung, und jedes Mal mit einer anderen
   Frage: wie er gefahren wird (Schritt fuer Schritt aus plan.json, samt der
   Entscheidung in der Pause), was dabei herauskam (aus der Aufzeichnung geholt
   oder eingetippt) und was das fuer den Testtag bedeutet. Der letzte Teil ist
   der, den es vorher nirgends gab: eine notierte Wattzahl ist keine Vorgabe,
   solange nicht dasteht, dass genau sie das Ziel der zwanzig Minuten ist und
   welche FTP daraus faellt, wenn sie haelt.

   Seit dem 10.09.2026 ist die Ergebnisansicht die einzige Stelle, an der ein
   Test eingetragen wird. Daneben stand bis dahin ein zweites Formular unter
   "Zonen & Schwellenwerte", das denselben Speicher fuellte und dabei weniger
   fragte: Ø-Watt, Kadenz, Gewicht, Bedingungen - kein Ø-Puls, kein RPE. Wer
   den falschen der beiden Wege nahm, bekam einen Eintrag ohne LTHR und ohne
   Guetepruefung, also gerade ohne die Zahl, aus der alle Pulsbaender
   entstehen, und ohne den Hinweis, dass der Test nicht ausbelastet war.

   Der Zonen-Tab behaelt, was ihm gehoert: FTP, LTHR und HFmax von Hand zu
   korrigieren. Das ist etwas anderes als einen Test einzutragen - eine
   Korrektur ist keine Messung und gehoert nicht in die Testhistorie. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, testLog, testPrep, apiKey, settings,
         setTestPrep } from '../../../state/store.js';
import { aktuellerTermin, anlaufTage, testPhase, testAblaeufe,
         vorgewaehlterAblauf, terminSchluessel, tempoBloecke,
         testZiel, vo2maxTermin, vo2maxBezug, laengsteFahrt,
         ergebnisTermine, vorgewaehlterErgebnistag, FTP_FAKTOR }
  from '../../../domain/test.js';
import { isRide } from '../../../domain/analysis.js';
import { buildStepSequence, totalSeconds } from '../../../domain/timer/sequences.js';
import { hrBands, usesCoggan } from '../../../domain/zones.js';
import { ART_TEST } from '../../../domain/messwerte.js';
import { isoDayLocal, toMidnight, dayOffset, weekNumberFor,
         WEEKDAY_NAMES, datumText, tagUndMonat } from '../../../domain/week.js';
import { fetchActivities, fetchStreams, zahlenStrom } from '../../../data/icu.js';
import { Segmented } from '../../components/Segmented.jsx';
import { Baustein } from '../training/Baustein.jsx';
/* Ring, Vorschau und Zonenkarte teilt sich dieser Bereich mit dem
   Intervalltimer - siehe Schrittansicht.jsx. */
import { Schrittbuehne, Schrittvorschau, Zonenkarte } from '../../components/Schrittansicht.jsx';
import { mmss, dauerText, schrittDauer } from '../../../domain/zeit.js';
import { Zahlenfeld, Auswahlfeld } from '../../components/Feld.jsx';
import { Messwertsheet } from '../../components/Messwertsheet.jsx';
import { Testhistorie } from '../../components/Testhistorie.jsx';
import { useSchrittTimer } from '../../components/useSchrittTimer.js';
import { zahl } from '../../../domain/zahlen.js';
import '../../components/timer.css';
import './test.css';

const ANSICHTEN = [
  { id: 'anleitung', label: 'Anleitung' },
  { id: 'ablauf',    label: 'Ablauf' },
  { id: 'ergebnis',  label: 'Ergebnis' }
];

function kurzDatum(d){
  return WEEKDAY_NAMES[d.getDay()].slice(0, 2) + ', ' + tagUndMonat(d);
}

/* ---------- Anleitung ---------- */

/* Der Kopf beantwortet die Frage, mit der man den Bereich oeffnet: wann, und
   wie weit ist es noch. Alles Weitere steht darunter. */
function LageKarte({ termin, phase, tage, prep }){
  const satz = {
    heute:  'Heute ist Schwellentest.',
    danach: 'Der Test war gestern. Ergebnis eintragen, heute Ruhe oder höchstens 30 min Z1.',
    anlauf: 'Der Testanlauf läuft.',
    fern:   'Der nächste Schwellentest ist noch nicht in Sicht.',
    vorbei: 'Alle Testtermine des Plans liegen zurück.'
  }[phase] || 'Dieser Plan sieht keinen Schwellentest vor.';

  return (
    <div class="card">
      <div class="row"><span>Schwellentest</span>
        <b>{termin
          ? datumText(termin.datum) + ' · Woche ' + termin.week
          : 'kein Termin'}</b></div>
      {termin && phase !== 'heute' && phase !== 'vorbei' && (
        <div class="row"><span>{tage > 0 ? 'Noch' : 'Vergangen'}</span>
          <b>{Math.abs(tage)} {Math.abs(tage) === 1 ? 'Tag' : 'Tage'}</b></div>
      )}
      <p class="hint">{satz}</p>
      {/* Die Zielleistung aus dem Tempotest gehoert nach ganz oben, sobald es
          sie gibt: sie ist die einzige Zahl, die man am Testtag vorher wissen
          muss. */}
      {prep && prep.zielWatt > 0 && (
        <div class="testziel">
          <b>{prep.zielWatt} W</b>
          <span>Zielleistung aus dem Tempotest{prep.zielPuls > 0 ? ' · dabei ⌀ ' + prep.zielPuls + ' bpm' : ''}</span>
        </div>
      )}
    </div>
  );
}

/* Der Anlauf als Zeitleiste. Zehn Tage untereinander, der heutige markiert -
   das ist die Ansicht, in der man sieht, dass der Sonntag davor den Beinblock
   verliert, ohne dafuer durch die Wochenansicht blaettern zu muessen. */
function AnlaufKarte({ tage, intro }){
  if(!tage.length) return null;
  return (
    <div class="card">
      <div class="row"><span>Anlauf</span><b>{tage.length} Tage</b></div>
      {intro && <p class="hint">{intro}</p>}
      <ol class="anlaufliste">
        {tage.map((z, i) => (
          <li key={i} class={(z.heute ? 'heute ' : '') + (z.vergangen ? 'weg ' : '') + (z.test ? 'test' : '')}>
            <span class="anlauf-kopf">
              <span class="anlauf-tag">{kurzDatum(z.datum)}</span>
              <span class="anlauf-label">{z.label}</span>
              {z.heute && <span class="anlauf-marke">heute</span>}
            </span>
            <span class="anlauf-text">
              {z.test ? 'Der Test. Go/No-Go am Morgen, dann der feste Ablauf.' : z.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* Die vier Punkte werden abgehakt, nicht gelesen - deshalb echte Kaestchen und
   keine Aufzaehlung. Die Haken haengen am Testtermin und ueberleben das
   Schliessen der App: wer morgens um sechs zwei Punkte prueft und dann
   fruehstueckt, soll nicht von vorn anfangen. */
function GoNoGo({ tt, schluessel, haken, onHaken }){
  if(!tt || !tt.goNoGo || !tt.goNoGo.length) return null;
  const gesetzt = haken || [];
  const alle = tt.goNoGo.every((_, i) => gesetzt.indexOf(i) >= 0);

  function umschalten(i){
    const neu = gesetzt.indexOf(i) >= 0 ? gesetzt.filter(x => x !== i) : gesetzt.concat(i);
    onHaken(neu.slice().sort((a, b) => a - b));
  }

  return (
    <div class="card">
      <div class="row"><span>{tt.goNoGoTitel}</span>
        <b class={alle ? 'go' : 'nogo'}>{alle ? 'Go' : gesetzt.length + '/' + tt.goNoGo.length}</b></div>
      <div class="hakenliste">
        {tt.goNoGo.map((p, i) => (
          <label class="haken" key={i}>
            <input type="checkbox" checked={gesetzt.indexOf(i) >= 0}
              disabled={!schluessel}
              onChange={() => umschalten(i)} />
            <span>{p}</span>
          </label>
        ))}
      </div>
      <p class="hint">{tt.goNoGoNote}</p>
      {!alle && <p class="hint warn">{tt.shiftRule}</p>}
    </div>
  );
}

/* Ein Ablauf Schritt fuer Schritt: Dauer, Vorgabe und der Satz, der dazu
   gehoert. Einmal geschrieben, vom Tempotest und vom Test benutzt - beide
   stehen als Schrittliste in plan.json, und zwei Darstellungen derselben Liste
   waeren zwei Gelegenheiten, sie auseinanderlaufen zu lassen. */
function Schrittliste({ steps }){
  return (
    <ol class="schrittliste">
      {steps.map((s, i) => (
        <li key={i}>
          <span class="schritt-kopf">
            <span class="schritt-label">{s.label}</span>
            <span class="schritt-wert">
              {schrittDauer(s)}{s.effort ? ' · ' + s.effort : ''}
            </span>
          </span>
          {s.note && <span class="schritt-note">{s.note}</span>}
        </li>
      ))}
    </ol>
  );
}

/* Eine Zahl aus der Aufzeichnung holen - zweimal dieselbe Bewegung.

   Tempotest und VO2max-Referenz suchen beide in einer Fahrt bei intervals.icu
   nach dem besten Fenster und bieten das Gefundene zur Uebernahme an. Was sie
   suchen, ist verschieden; wie sie dabei aussehen, war es nicht: derselbe
   Zustand mit den drei Phasen, derselbe Knopf, dieselbe Fehlerzeile.

   Der Zustand ist bewusst null, solange nichts gesucht wurde, und wird nach
   der Uebernahme wieder null - die gefundenen Bloecke stehen dann nicht mehr
   unter einem Feld, in dem die uebernommene Zahl schon steht. */
function useAufzeichnung(laden){
  const [suche, setSuche] = useState(null);

  async function holen(){
    setSuche({ phase: 'laedt' });
    try { setSuche({ phase: 'fertig', ...(await laden()) }); }
    catch(e){ setSuche({ phase: 'fehler', text: e.message }); }
  }

  return { suche, holen, verwerfen: () => setSuche(null) };
}

/* Der Knopf dazu. Ohne Zugang zu intervals.icu bleibt er tot - das Eintippen
   steht daneben und ist kein Notbehelf, sondern der Regelweg fuer alle, die
   die App ohne Konto benutzen. */
function HolenKnopf({ suche, onHolen }){
  const laedt = suche && suche.phase === 'laedt';
  return (
    <button class="btn block secondary" type="button"
      disabled={!apiKey.value || laedt} onClick={onHolen}>
      {laedt ? 'Wird gesucht …' : 'Aus der Aufzeichnung holen'}
    </button>
  );
}

function Suchfehler({ suche }){
  return suche && suche.phase === 'fehler'
    ? <div class="meldung fehler"><b>{suche.text}</b></div>
    : null;
}

/* Der Tempotest: wie er gefahren wird, was dabei herauskam, und wozu.

   Er steht in der Anleitung an dieser Stelle, weil er der einzige Schritt des
   Anlaufs mit einem Ergebnis ist. Die Schritte kommen aus plan.json - samt der
   Entscheidung in der Pause, die den ganzen Sinn der Einheit traegt: Block 1
   probiert ein Tempo, die Pause korrigiert es, Block 2 faehrt das korrigierte.
   Nur dessen Ø-Watt zaehlt. */
function TempotestKarte({ ablauf, prep, onNotiz, laden, kompakt }){
  const { suche, holen, verwerfen } = useAufzeichnung(() => laden(ablauf));
  const notiert = prep && prep.zielWatt > 0;

  function uebernehmen(b){
    onNotiz({ zielWatt: b.watt, zielPuls: b.puls || null });
    verwerfen();
  }

  return (
    <div class="card">
      <div class="row"><span>Tempotest am {kurzDatum(ablauf.datum)}</span>
        <b>{notiert ? prep.zielWatt + ' W notiert' : 'Ergebnis fehlt'}</b></div>
      {/* Der Ablauf steht nur in der Anleitung. In der Ablaufansicht liegt er
          schon als Schrittliste unter der Uhr - dort waere er ein zweites Mal
          dieselbe Folge. */}
      {!kompakt && <>
        <p class="hint">
          Zwei Blöcke im angestrebten Testtempo, gesteuert nach {ablauf.steering || 'Anstrengung'}.
          Daraus ergibt sich die Zielleistung für den Test.
        </p>
        <div class="listhead">Ablauf</div>
        <Schrittliste steps={ablauf.steps} />
        <div class="listhead">Ergebnis</div>
      </>}
      <p class="hint">
        Maßgeblich ist der <b>zweite</b> Block. Aus der Aufzeichnung nimmt die App das spätere
        der beiden stärksten 6-min-Fenster.
      </p>
      <Zahlenfeld titel="Ø-Watt Block 2 (W)" wert={prep ? prep.zielWatt : null} min={1}
        onWert={v => onNotiz({ zielWatt: v })} />
      <Zahlenfeld titel="Ø-Puls Block 2 (bpm)" wert={prep ? prep.zielPuls : null} min={1}
        onWert={v => onNotiz({ zielPuls: v })} />
      <HolenKnopf suche={suche} onHolen={holen} />
      {!apiKey.value && <p class="hint">
        Ohne Zugang zu intervals.icu: Wert aus der Intervallauswertung der Uhr eintippen.
      </p>}
      <Suchfehler suche={suche} />
      {suche && suche.phase === 'fertig' && (
        <>
          <div class="listhead">Gefunden in „{suche.act.name || suche.act.type}"</div>
          {[['Block 1', suche.bloecke.erster], ['Block 2', suche.bloecke.zweiter]].map(([name, b]) => (
            <div class="blockzeile" key={name}>
              <span class="blockname">{name}</span>
              <span class="blockwert">{b.watt} W{b.puls ? ' · ⌀ ' + b.puls + ' bpm' : ''}</span>
              <span class="blockzeit">ab {mmss(b.vonSek)}</span>
              <button class="btn klein" type="button"
                onClick={() => uebernehmen(b)}>Übernehmen</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* Die VO2max-Referenz - der 5-Minuten-Wert.

   Er stand bis Fassung 3 im Test selbst und ist seit Fassung 4 die erste
   Wiederholung der ersten Intervalleinheit danach. Genau deshalb braucht er
   hier eine Karte: er gehoert zum Test, findet aber eine Woche spaeter an
   einem anderen Tag statt, und ohne diese Karte stuende er nirgends im
   Zusammenhang mit der FTP, die er pruefen soll.

   Er haengt am Testtermin und nicht am Kalender - deshalb gibt es ihn zum
   ersten Test und nicht zu den Retests, ohne dass irgendwo "der erste Test"
   steht. */
function Vo2maxKarte({ termin, prep, onNotiz, ftp, laden }){
  const { suche, holen, verwerfen } = useAufzeichnung(() => laden(termin));
  if(!termin) return null;
  const wert = prep && prep.vo2max5 > 0 ? prep.vo2max5 : null;
  const bezug = vo2maxBezug(wert, ftp);

  return (
    <div class="card">
      <div class="row"><span>VO2max-Referenz am {kurzDatum(termin.datum)}</span>
        <b>{wert ? wert + ' W' : 'Kür, offen'}</b></div>
      <p class="hint">
        Der 5-Minuten-Wert wird als erste Wiederholung der ersten Intervalleinheit erhoben.
        Ob, entscheidet die Tageskarte des {kurzDatum(termin.datum)}.
      </p>
      <Zahlenfeld titel="Ø-Watt der 5 min (W)" wert={wert} min={1}
        onWert={v => onNotiz({ vo2max5: v })} />
      <HolenKnopf suche={suche} onHolen={holen} />
      <Suchfehler suche={suche} />
      {suche && suche.phase === 'fertig' && (
        <div class="blockzeile">
          <span class="blockname">Bestes 5-min-Fenster</span>
          <span class="blockwert">{suche.block.watt} W{suche.block.puls ? ' · ⌀ ' + suche.block.puls + ' bpm' : ''}</span>
          <span class="blockzeit">ab {mmss(suche.block.vonSek)}</span>
          <button class="btn klein" type="button"
            onClick={() => { onNotiz({ vo2max5: suche.block.watt }); verwerfen(); }}>Übernehmen</button>
        </div>
      )}
      {/* Die Gegenprobe des Trainingsplans. Sie ist der einzige Zweck des
          Wertes und steht deshalb als Ergebnis da, nicht als Fussnote. */}
      {bezug && (
        <div class={'formel' + (bezug.zuNiedrig ? ' warn' : '')}>
          <b>{bezug.prozent} % der Test-FTP ({bezug.ftp} W)</b>
          <span>
            {bezug.zuNiedrig
              ? 'Über ' + bezug.grenze + ' % – der Test lag zu niedrig. Der Retest rückt nach vorn, '
                + 'zusammen mit dem eFTP-Kriterium.'
              : 'Bis ' + bezug.grenze + ' % ist die 108–115-%-Vorgabe der Intervalle plausibel.'}
          </span>
        </div>
      )}
      {!bezug && wert && <p class="hint">
        Die Gegenprobe erscheint, sobald das Testergebnis eingetragen ist.
      </p>}
    </div>
  );
}

/* Was die notierte Zahl fuer den Testtag bedeutet.

   Ohne diese Karte war die Zielleistung eine Notiz ohne Anschluss: sie stand
   oben im Bereich und niemand sagte, dass genau sie die Vorgabe der zwanzig
   Minuten ist. Die FTP daneben ist keine Vorhersage, sondern die Formel des
   Plans auf das Ziel angewandt - haelt es, faellt genau diese Zahl heraus. */
function ZielKarte({ ziel, termin }){
  if(!termin) return null;
  const datum = datumText(termin.datum);
  if(!ziel){
    return (
      <div class="card">
        <div class="row"><span>Ziel für den {datum}</span><b>steht noch aus</b></div>
        <p class="hint">
          Ohne notierte Leistung aus dem Tempotest: nach Anstrengung fahren – ein Tempo, das
          sich 20 min halten ließe, Sprechtest drei bis fünf Worte. Der Puls wird
          mitgeschrieben, nicht angesteuert.
        </p>
      </div>
    );
  }
  return (
    <div class="card">
      <div class="row"><span>Ziel für den {datum}</span><b>{ziel.watt} W</b></div>
      <div class="formeln">
        <div class="formel"><b>{ziel.watt} W über 20 min</b>
          <span>Die Ø-Leistung von Block 2 des Tempotests – erste drei Minuten bewusst
            darunter, danach auf die Ø-Leistung der Runde schauen und nicht auf den
            Momentanwert.</span></div>
        <div class="formel"><b>ergibt FTP {ziel.ftp} W</b>
          <span>
            {ziel.watt} × {String(FTP_FAKTOR).replace('.', ',')}, wenn das Ziel über die
            vollen 20 min hält.
            {ziel.gegenAlt != null
              ? ' Gegenüber der eingetragenen FTP von ' + ziel.alteFtp + ' W sind das ' +
                (ziel.gegenAlt >= 0 ? '+' : '−') + Math.abs(ziel.gegenAlt) + ' %.'
              : ''}
          </span></div>
      </div>
      {ziel.puls && <p class="hint">
        Puls im Tempotest: ⌀ {ziel.puls} bpm. Gegenprobe, keine Vorgabe.
      </p>}
    </div>
  );
}

/* Wie gefahren wird, in der Reihenfolge des Ablaufs. Die Saetze stammen aus
   den Schritten des Plans und nicht aus einem zweiten Text daneben - sonst
   stuenden die Anweisungen zweimal da und liefen auseinander. */
function DurchfuehrungKarte({ p }){
  const t = p.thresholdTest;
  if(!t) return null;
  return (
    <div class="card">
      <div class="row"><span>Der Test selbst</span>
        <b>{t.steering || 'fester Ablauf'}</b></div>
      <p class="hint">{p.texts.thresholdTestSummary}</p>
      <div class="listhead">Ablauf</div>
      {/* Alle Schritte und nicht nur die mit einem Satz: die Karte soll den
          Test vollstaendig beschreiben, und ein Ablauf mit Luecken ist keine
          Beschreibung. */}
      <Schrittliste steps={t.steps || []} />
      <div class="listhead">Damit der Retest vergleichbar bleibt</div>
      <p class="hint">{p.texts.thursdayTest}</p>
    </div>
  );
}

function AuswertungsKarte({ th }){
  return (
    <div class="card">
      <div class="row"><span>Auswertung</span>
        <b>{th.lthr > 0 ? 'LTHR ' + th.lthr + ' bpm' : 'noch kein Wert'}</b></div>
      <div class="formeln">
        <div class="formel"><b>FTP = Ø-Watt der 20 min × {String(FTP_FAKTOR).replace('.', ',')}</b>
          <span>Die Zahl, aus der die Wattzonen entstehen.</span></div>
        <div class="formel"><b>LTHR = Ø-Puls der 20 min</b>
          <span>Die Zahl, aus der alle Pulsbänder des Folgeblocks entstehen.</span></div>
      </div>
      <p class="hint">
        In intervals.icu übernehmen: Settings → Ride, Power Zones und HR Zones auf Coggan,
        Load Priority auf Power, FTP auf manuell.
      </p>
    </div>
  );
}

/* ---------- Ablauf ---------- */

function Ablaufansicht({ p, th, w, ablaeufe, gewaehlt, setGewaehlt, prep, onNotiz, laden }){
  const s = settings.value;
  const a = ablaeufe.find(x => x.id === gewaehlt) || ablaeufe[0];
  const uhr = useSchrittTimer({
    kennung: 'test', voice: s.voice,
    sequenz: () => buildStepSequence(p, th, w, a.steps)
  });
  const timer = uhr.timer;

  const vorschau = timer.sequence.length ? timer.sequence : buildStepSequence(p, th, w, a.steps);
  /* Wie die Belastung heisst - das Einzige, was diese Buehne von der im
     Intervalltimer unterscheidet. Im Test sind es die zwanzig Minuten selbst,
     im Anlauf ein Block wie jeder andere. */
  const arbeitsname = a.id === 'test' ? 'Test' : 'Belastung';

  return (
    <Baustein
      titel={a.titel.replace('Rad – ', '')}
      meta={dauerText(totalSeconds(vorschau))}
      status={<p class="tagchip">
        {a.datum ? kurzDatum(a.datum) + ' · ' : ''}{a.steering || 'fester Ablauf'}
      </p>}
      buehne={
        <Schrittbuehne uhr={uhr} vorschau={vorschau} arbeit={arbeitsname}
          endeLabel="Ablauf beenden" />
      }
      hinweise={[a.note].filter(Boolean)}
      schluss={
        <p class="hint">
          Der Ablauf ist fest, damit die Tests vergleichbar bleiben.
        </p>
      }>

      {/* Die Zielleistung steht ueber der Uhr und nicht nur in der Anleitung:
          waehrend der 20 Minuten schaut man auf diesen Bildschirm. */}
      {a.id === 'test' && prep && prep.zielWatt > 0 && (
        <div class="card">
          <div class="row"><span>Ziel aus dem Tempotest</span><b>{prep.zielWatt} W</b></div>
          <p class="hint">
            Die ersten drei Minuten bewusst darunter, danach auf die Ø-Leistung der Runde
            schauen und nicht auf den Momentanwert.
          </p>
        </div>
      )}

      {ablaeufe.length > 1 && (
        <div class="card">
          <Auswahlfeld titel="Ablauf" wert={a.id} onWert={setGewaehlt}
            optionen={ablaeufe.map(x => ({ id: x.id,
              label: x.titel.replace('Rad – ', '') + (x.datum ? ' · ' + kurzDatum(x.datum) : '') }))} />
          <p class="hint">
            Vorgewählt ist der Ablauf des heutigen Tages.
          </p>
        </div>
      )}

      {/* Der Tempotest hat als Einziger ein Ergebnis, das man mitnimmt - und
          gleich nach dem Abstellen steht man mit dem Telefon daneben. Deshalb
          dieselbe Karte wie in der Anleitung, nur ohne den Ablauf: der steht
          hier schon unter der Uhr. */}
      {a.tempo && (
        <TempotestKarte ablauf={a} prep={prep} onNotiz={onNotiz} laden={laden} kompakt />
      )}

      <div class="card">
        <div class="row"><span>Ablauf</span><b>{a.steps.length} Schritte</b></div>
        <Schrittvorschau sequenz={vorschau} index={timer.index} />
      </div>

      <Zonenkarte woche={w} bands={hrBands(p, th, w)} plan={p} thresholds={th}
        coggan={usesCoggan(p, th, w)}>
        <p class="hint">
          Im Test ist der Puls Ergebnis, keine Vorgabe. Die Bänder begrenzen Einfahren und Ausrollen.
        </p>
      </Zonenkarte>
    </Baustein>
  );
}

/* ---------- Ergebnis ---------- */

/* Die Zahlen eines Termins, zum Nachschlagen.

   Eingetragen wird im Messwert-Sheet - derselben Komponente, die auch die
   Zonenseite oeffnet. Bis zum 31.10.2026 stand hier ein eigenes Formular, und
   unter Zonen ein zweites fuer dieselben Werte: eines rechnete FTP und LTHR
   aus Ø-Watt und Ø-Puls, das andere liess sie tippen. Dieselbe Groesse auf
   zwei Wegen, von denen einer das halbe Protokoll verlor.

   Was bleibt, ist die Ansicht: was steht in diesem Termin, und ein Knopf, der
   das Sheet damit oeffnet. */
function Ergebniskarte({ ziel, onOeffnen }){
  const e = ziel.eintrag;
  const wkg = e && e.ftp > 0 && e.weight > 0 ? e.ftp / e.weight : null;

  return (
    <div class="card">
      <div class="row"><span>{e ? 'Ergebnis' : 'Ergebnis eintragen'}</span>
        <b>{datumText(ziel.datum)}{ziel.week ? ' · Woche ' + ziel.week : ''}</b></div>

      <div class="ergebnis">
        <div class="ergwert"><b>{e && e.ftp ? e.ftp + ' W' : '–'}</b><span>FTP</span></div>
        <div class="ergwert"><b>{e && e.lthr ? e.lthr + ' bpm' : '–'}</b><span>LTHR</span></div>
        <div class="ergwert"><b>{wkg != null ? zahl(wkg, 2) : '–'}</b><span>W/kg</span></div>
      </div>

      {e ? (
        <>
          <div class="listrow"><span>Ø der 20 min</span>
            <span>{[e.w20 ? e.w20 + ' W' : null, e.hr20 ? e.hr20 + ' bpm' : null,
                    e.kadenz ? e.kadenz + ' U/min' : null].filter(Boolean).join(' · ') || '–'}</span></div>
          <div class="listrow"><span>Güte und Gewicht</span>
            <span>{[e.rpe ? 'RPE ' + e.rpe : null, e.weight ? e.weight + ' kg' : null]
                    .filter(Boolean).join(' · ') || '–'}</span></div>
          {e.conditions && <div class="listrow"><span>Bedingungen</span><span>{e.conditions}</span></div>}
        </>
      ) : (
        <p class="hint">
          Ø-Watt und Ø-Puls des 20-min-Intervalls. Mit intervals.icu-Schlüssel holt das Sheet
          sie aus der Aufzeichnung. Ohne Leistungsmesser genügt der Puls.
        </p>
      )}

      <button class="btn block" onClick={onOeffnen}>
        {e ? 'Ergebnis ändern' : 'Ergebnis eintragen'}</button>
    </div>
  );
}


/* Die Ergebnisansicht: erst welcher Termin, dann dessen Zahlen.

   Die Terminwahl steht oben und nicht unten. Sie beantwortet die Frage, mit
   der man herkommt - "was kam beim letzten Test heraus" ist genauso oft der
   Grund wie "ich will eintragen", und bis zum 10.09.2026 beantwortete diese
   Ansicht nur die zweite. */
function ErgebnisAnsicht({ p, termin, start }){
  const termine = ergebnisTermine(p, start, testLog.value, today.value);
  const [tag, setTag] = useState(() => vorgewaehlterErgebnistag(termine, termin, today.value));
  const [sheet, setSheet] = useState(false);

  /* Faellt der gemerkte Tag weg - etwa weil der Plan gewechselt hat -, gilt
     wieder die Vorauswahl. Kein Zustand, der auf ein Datum zeigt, das es
     nicht mehr gibt. */
  const ziel = termine.find(t => t.tagIso === tag)
    || termine.find(t => t.tagIso === vorgewaehlterErgebnistag(termine, termin, today.value));

  if(!ziel) return <div class="card"><p class="hint">Dieser Plan sieht keinen Schwellentest vor.</p></div>;

  const heuteIso = isoDayLocal(toMidnight(today.value));
  const optionen = termine.map(t => ({
    id: t.tagIso,
    label: datumText(t.datum)
      + (t.week ? ' · W' + t.week : '')
      + (t.eintrag ? ' · eingetragen' : (t.tagIso === heuteIso ? ' · heute' : ' · offen'))
  }));

  return (
    <>
      <div class="card">
        <div class="row"><span>Testtermin</span>
          <b>{termine.filter(t => t.eintrag).length} von {termine.length} eingetragen</b></div>
        <Auswahlfeld titel="Termin" wert={ziel.tagIso} onWert={setTag} optionen={optionen} />
        <p class="hint">
          Alle Termine des Plans und jeder Tag mit einem Test. Ein verschobener Test steht unter
          dem Tag, an dem er gefahren wurde.
        </p>
      </div>

      <Ergebniskarte ziel={ziel} onOeffnen={() => setSheet(true)} />

      {sheet && <Messwertsheet
        eintrag={ziel.eintrag || null}
        vorgabe={{ day: ziel.tagIso, art: ART_TEST }}
        onClose={() => setSheet(false)} />}

      {testLog.value.length > 0 && (
        <div class="card">
          <Testhistorie eintraege={testLog.value} mitKopf />
          <p class="hint">Der Verlauf über alle Tests steht unter „Zonen“ und in der Analyse.</p>
        </div>
      )}
    </>
  );
}

/* ---------- Rahmen ---------- */

export function TestTab(){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const heute = toMidnight(today.value);
  const [ansicht, setAnsicht] = useState('anleitung');

  const termin = aktuellerTermin(p, heute, start);
  const phase = testPhase(p, termin, heute);
  const tage = termin ? dayOffset(termin.datum, heute) : null;
  const anlauf = anlaufTage(p, termin, heute);
  const ablaeufe = testAblaeufe(p, termin, heute);
  const schluessel = terminSchluessel(termin);
  const prep = (schluessel && testPrep.value[schluessel]) || null;

  const [ablauf, setAblauf] = useState(() => vorgewaehlterAblauf(ablaeufe));

  const tempo = ablaeufe.find(a => a.tempo) || null;
  const ziel = testZiel(prep, th);

  /* Die VO2max-Referenz haengt am Test davor und nicht am aktuellen Termin -
     nach dem 10.09. rueckt der Blick auf den Retest, der 5-min-Wert bleibt
     aber der des ersten Tests. Deshalb ein eigener Schluessel. */
  const vo2 = vo2maxTermin(p, start);
  const vo2Schluessel = vo2 && vo2.test ? terminSchluessel(vo2.test) : null;
  const vo2Prep = (vo2Schluessel && testPrep.value[vo2Schluessel]) || null;
  const vo2Ftp = (() => {
    const eintrag = testLog.value.find(e => e.day === vo2Schluessel);
    return eintrag && eintrag.ftp > 0 ? eintrag.ftp : (th.ftp > 0 ? th.ftp : null);
  })();

  /* Die Leistungsbloecke einer Aufzeichnung holen - einmal fuer den
     Tempotest, einmal fuer die VO2max-Referenz.

     Beide standen bis zum 04.09.2026 als eigene Funktion da und
     unterschieden sich in drei Zeilen von neunzehn: der Fensterlaenge,
     welcher der beiden Bloecke gilt, und einem halben Satz in der
     Fehlermeldung. Die uebrigen sechzehn - Fahrten des Tages holen, die
     laengste nehmen, Streams laden, Fenster rechnen - waren Zeichen fuer
     Zeichen dieselben.

     Die Fehlermeldungen nennen weiterhin, was fehlt, und nicht nur dass
     etwas fehlte: eine Fahrt ohne Leistungsmesser ist ein anderer Fall als
     ein Tag ohne Fahrt, und im ersten hilft nur das Eintippen. "zuKurz"
     traegt den Unterschied - beim Tempotest kann die Fahrt auch schlicht zu
     kurz fuer zwei Bloecke sein. */
  async function ladeBloecke({ datum, sekunden, zuKurz }){
    const key = apiKey.value;
    const iso = isoDayLocal(datum);
    const fahrt = laengsteFahrt(await fetchActivities(key, iso, iso), isRide);
    if(!fahrt){
      throw new Error('Für den ' + datumText(datum) +
        ' liegt keine Radaufzeichnung vor.');
    }
    const streams = await fetchStreams(key, fahrt.id, 'watts,heartrate,time');
    const bloecke = tempoBloecke({
      watts: zahlenStrom(streams, 'watts'),
      puls:  zahlenStrom(streams, 'heartrate'),
      zeit:  zahlenStrom(streams, 'time'),
      sekunden
    });
    if(!bloecke){
      throw new Error('„' + (fahrt.name || fahrt.type) + '" enthält keinen ' +
        'Leistungsstrom' + (zuKurz ? ' oder ist zu kurz für zwei Blöcke' : '') +
        '. Ohne Watt bleibt das Eintippen.');
    }
    return { bloecke, act: fahrt };
  }

  /* Der Tempotest: beide Bloecke werden gezeigt, massgeblich ist der zweite. */
  function ladeTempotest(a){
    return ladeBloecke({ datum: a.datum, sekunden: a.blockSekunden, zuKurz: true });
  }

  /* Die VO2max-Referenz: dieselbe Fensterrechnung, aber nur ein Fenster
     zaehlt. Der eine Maximalversuch der Einheit ist die haerteste Stelle der
     Fahrt - deshalb das staerkste Fenster und nicht das spaetere. Eine
     Verwechslung wie beim Tempotest gibt es hier nicht, es gibt keinen
     zweiten Block. */
  async function ladeVo2max(t){
    const max = (t.variante.steps || []).find(x => x.type === 'work');
    const { bloecke, act } = await ladeBloecke({
      datum: t.datum,
      sekunden: max ? Math.round((max.minutes || 0) * 60) : 300
    });
    return { block: [bloecke.erster, bloecke.zweiter].sort((x, y) => y.watt - x.watt)[0], act };
  }

  /* Die Woche des Testtermins und nicht die heutige: die Baender im Ablauf
     sollen die des Tests sein, auch wenn man drei Tage vorher hineinsieht. */
  const w = termin ? Math.max(weekNumberFor(termin.datum, start), 1) : 1;

  const umschalter = (
    <Segmented ziele={ANSICHTEN} aktiv={ansicht} onWaehlen={setAnsicht}
      klasse="oben" label="Testansicht" />
  );

  if(ansicht === 'ablauf' && ablaeufe.length){
    return (
      <>
        {umschalter}
        <Ablaufansicht p={p} th={th} w={w} ablaeufe={ablaeufe}
          gewaehlt={ablauf} setGewaehlt={setAblauf} prep={prep}
          onNotiz={patch => setTestPrep(schluessel, patch)} laden={ladeTempotest} />
      </>
    );
  }

  if(ansicht === 'ergebnis'){
    return (
      <>
        {umschalter}
        <ErgebnisAnsicht p={p} termin={termin} start={start} />
      </>
    );
  }

  /* Am Testtag steht das Go/No-Go ganz oben: es ist die erste Entscheidung des
     Tages und faellt vor dem Fruehstueck, nicht nach dem Lesen der Anleitung. */
  const goNoGo = (
    <GoNoGo tt={p.testTaper} schluessel={schluessel} haken={prep ? prep.goNoGo : null}
      onHaken={h => setTestPrep(schluessel, { goNoGo: h })} />
  );

  return (
    <>
      {umschalter}
      <LageKarte termin={termin} phase={phase} tage={tage} prep={prep} />
      {phase === 'heute' && goNoGo}
      <AnlaufKarte tage={anlauf} intro={p.testTaper ? p.testTaper.intro : null} />
      {/* Erst der Tempotest, dann was aus ihm folgt, dann der Test selbst -
          das ist die Reihenfolge, in der die drei stattfinden. */}
      {tempo && (
        <TempotestKarte ablauf={tempo} prep={prep}
          onNotiz={patch => setTestPrep(schluessel, patch)} laden={ladeTempotest} />
      )}
      <ZielKarte ziel={ziel} termin={termin} />
      <DurchfuehrungKarte p={p} />
      <Vo2maxKarte termin={vo2} prep={vo2Prep} ftp={vo2Ftp} laden={ladeVo2max}
        onNotiz={patch => setTestPrep(vo2Schluessel, patch)} />
      {phase !== 'heute' && goNoGo}
      <AuswertungsKarte th={th} />
    </>
  );
}
