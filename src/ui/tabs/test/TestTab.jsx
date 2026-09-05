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

   Warum LTHR hier ein eigenes Feld hat und im Zonen-Tab nicht: das dortige
   Formular nimmt Ø-Watt, rechnet die FTP und laesst die LTHR von Hand
   eintragen - ausgerechnet die Zahl, aus der alle Pulsbaender entstehen. Wer
   sie vergisst, faehrt den Folgeblock weiter nach den Uebergangsbaendern und
   merkt es nicht. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, testLog, testPrep, apiKey, settings,
         setThresholds, addTestEntry, setTestPrep } from '../../../state/store.js';
import { aktuellerTermin, anlaufTage, testPhase, testAblaeufe,
         vorgewaehlterAblauf, testWerte, terminSchluessel, tempoBloecke,
         testZiel, vo2maxTermin, vo2maxBezug, baueTestEintrag, laengsteFahrt,
         FTP_FAKTOR, AUSBELASTET_RPE }
  from '../../../domain/test.js';
import { isRide } from '../../../domain/analysis.js';
import { buildStepSequence, totalSeconds } from '../../../domain/timer/sequences.js';
import { hrBands, usesCoggan } from '../../../domain/zones.js';
import { isoDayLocal, toMidnight, dayOffset, weekNumberFor, dayFromIso,
         WEEKDAY_NAMES, datumText, tagUndMonat } from '../../../domain/week.js';
import { fetchGewicht, fetchActivities, fetchStreams,
         zahlenStrom } from '../../../data/icu.js';
/* Der Schreibvorgang samt Rueckfrage liegt in state/gewicht.js - der
   Zonen-Tab schreibt dasselbe, und das Versprechen "der einzige Wert, den
   diese App jemals dorthin schreibt" darf nicht an zwei Stellen stehen. */
import { gewichtSchreiben } from '../../../state/gewicht.js';
import { Segmented } from '../../components/Segmented.jsx';
import { Baustein } from '../training/Baustein.jsx';
/* Ring, Vorschau und Zonenkarte teilt sich dieser Bereich mit dem
   Intervalltimer - siehe Schrittansicht.jsx. */
import { Schrittbuehne, Schrittvorschau, Zonenkarte } from '../../components/Schrittansicht.jsx';
import { mmss, dauerText, schrittDauer } from '../../../domain/zeit.js';
import { Zahlenfeld, Textfeld, Auswahlfeld } from '../../components/Feld.jsx';
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

/* Der Tempotest: wie er gefahren wird, was dabei herauskam, und wozu.

   Er steht in der Anleitung an dieser Stelle, weil er der einzige Schritt des
   Anlaufs mit einem Ergebnis ist. Die Schritte kommen aus plan.json - samt der
   Entscheidung in der Pause, die den ganzen Sinn der Einheit traegt: Block 1
   probiert ein Tempo, die Pause korrigiert es, Block 2 faehrt das korrigierte.
   Nur dessen Ø-Watt zaehlt. */
function TempotestKarte({ ablauf, prep, onNotiz, laden, kompakt }){
  const [suche, setSuche] = useState(null);
  const notiert = prep && prep.zielWatt > 0;

  async function holen(){
    setSuche({ phase: 'laedt' });
    try {
      const treffer = await laden(ablauf);
      setSuche({ phase: 'fertig', ...treffer });
    } catch(e){
      setSuche({ phase: 'fehler', text: e.message });
    }
  }

  function uebernehmen(b){
    onNotiz({ zielWatt: b.watt, zielPuls: b.puls || null });
    setSuche(null);
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
          Die Einheit, aus der die Zielleistung für den Test fällt. Zwei Blöcke im
          angestrebten Testtempo, dazwischen die Entscheidung, ob korrigiert wird –
          gesteuert wird nach {ablauf.steering || 'Anstrengung'}.
        </p>
        <div class="listhead">Ablauf</div>
        <Schrittliste steps={ablauf.steps} />
        <div class="listhead">Ergebnis</div>
      </>}
      <p class="hint">
        Maßgeblich ist der <b>zweite</b> Block: er fährt die korrigierte Leistung, und genau
        die ist das Ziel im Test. Aus der Aufzeichnung geholt sucht die App die beiden
        stärksten Sechs-Minuten-Fenster der Fahrt und nimmt das spätere – beide stehen
        danach nebeneinander, damit die Zuordnung nachprüfbar bleibt.
      </p>
      <Zahlenfeld titel="Ø-Watt Block 2 (W)" wert={prep ? prep.zielWatt : null} min={1}
        onWert={v => onNotiz({ zielWatt: v })} />
      <Zahlenfeld titel="Ø-Puls Block 2 (bpm)" wert={prep ? prep.zielPuls : null} min={1}
        onWert={v => onNotiz({ zielPuls: v })} />
      <button class="btn block secondary" type="button"
        disabled={!apiKey.value || (suche && suche.phase === 'laedt')}
        onClick={holen}>
        {suche && suche.phase === 'laedt' ? 'Wird gesucht …' : 'Aus der Aufzeichnung holen'}
      </button>
      {!apiKey.value && <p class="hint">
        Ohne Zugang zu intervals.icu bleibt das Eintippen – die Zahl steht in der Auswertung
        des Intervalls auf der Uhr.
      </p>}
      {suche && suche.phase === 'fehler' &&
        <div class="meldung fehler"><b>{suche.text}</b></div>}
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
  const [suche, setSuche] = useState(null);
  if(!termin) return null;
  const wert = prep && prep.vo2max5 > 0 ? prep.vo2max5 : null;
  const bezug = vo2maxBezug(wert, ftp);

  async function holen(){
    setSuche({ phase: 'laedt' });
    try { setSuche({ phase: 'fertig', ...(await laden(termin)) }); }
    catch(e){ setSuche({ phase: 'fehler', text: e.message }); }
  }

  return (
    <div class="card">
      <div class="row"><span>VO2max-Referenz am {kurzDatum(termin.datum)}</span>
        <b>{wert ? wert + ' W' : 'Kür, offen'}</b></div>
      <p class="hint">
        Der 5-Minuten-Wert wird nicht mehr am Testtag erhoben, sondern als erste Wiederholung
        der ersten Intervalleinheit – der Maximalversuch ist selbst ein VO2max-Reiz und kostet
        so weder einen Tag noch zusätzliche Erholung. Frisch gefahren ist er außerdem
        aussagekräftiger als nach 20 min Maximalbelastung. Ob er erhoben wird, wird auf der
        Tageskarte des {kurzDatum(termin.datum)} entschieden.
      </p>
      <Zahlenfeld titel="Ø-Watt der 5 min (W)" wert={wert} min={1}
        onWert={v => onNotiz({ vo2max5: v })} />
      <button class="btn block secondary" type="button"
        disabled={!apiKey.value || (suche && suche.phase === 'laedt')}
        onClick={holen}>
        {suche && suche.phase === 'laedt' ? 'Wird gesucht …' : 'Aus der Aufzeichnung holen'}
      </button>
      {suche && suche.phase === 'fehler' && <div class="meldung fehler"><b>{suche.text}</b></div>}
      {suche && suche.phase === 'fertig' && (
        <div class="blockzeile">
          <span class="blockname">Bestes 5-min-Fenster</span>
          <span class="blockwert">{suche.block.watt} W{suche.block.puls ? ' · ⌀ ' + suche.block.puls + ' bpm' : ''}</span>
          <span class="blockzeit">ab {mmss(suche.block.vonSek)}</span>
          <button class="btn klein" type="button"
            onClick={() => { onNotiz({ vo2max5: suche.block.watt }); setSuche(null); }}>Übernehmen</button>
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
        Die Gegenprobe braucht die FTP des Tests – sie steht, sobald das Testergebnis
        eingetragen ist.
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
          Solange aus dem Tempotest keine Leistung notiert ist, gibt es für die 20 Minuten
          keine Zahl, sondern nur die Anstrengung: ein Tempo, das sich 20 min halten ließe,
          Sprechtest drei bis fünf Worte am Stück. Das ist ohne Leistungsmesser der normale
          Fall – der Puls wird dabei mitgeschrieben und nicht angesteuert.
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
        Im Tempotest lag der Puls dabei bei ⌀ {ziel.puls} bpm. Das ist die Gegenprobe für
        danach und keine Vorgabe: die LTHR entsteht erst aus dem Ø-Puls der 20 Minuten.
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
        Beide gehören auch nach intervals.icu: Settings → Ride, Power Zones und HR Zones auf
        Coggan, Load Priority auf Power, FTP von automatisch auf manuell. Sonst rechnet die
        Auswertung dort mit anderen Zonen als der Plan hier.
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
          Der Ablauf steht fest und lässt sich nicht verstellen – ein Test, der sich anpassen
          lässt, ist kein Vergleichsmaßstab mehr, und eine Probe mit anderen Zahlen probt
          etwas anderes.
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
            Vorgewählt ist der Ablauf des heutigen Tages. Umschalten muss nur, wer einen
            Anlaufschritt verschoben hat.
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
          Während des Tests ist der Puls Ergebnis und keine Vorgabe – die Bänder stehen hier
          nur, damit Einfahren und Ausrollen eine Obergrenze haben.
        </p>
      </Zonenkarte>
    </Baustein>
  );
}

/* ---------- Ergebnis ---------- */

function ErgebnisAnsicht({ p, th, termin }){
  const [f, setF] = useState({ w20:null, hr20:null, kadenz:null, rpe:null, kg:null, bed:'' });
  const [meldung, setMeldung] = useState(null);
  const werte = testWerte({ w20:f.w20, hr20:f.hr20, kadenz:f.kadenz, rpe:f.rpe, gewicht:f.kg });
  const tagIso = isoDayLocal(toMidnight(today.value));
  const bereit = werte.ftp != null || werte.lthr != null;

  /* Das Gewicht steht meist schon in der Wellness - dann muss es niemand
     abtippen und die beiden Quellen koennen nicht auseinanderlaufen. */
  async function gewichtHolen(){
    const key = apiKey.value;
    if(!key){ setMeldung({ art:'fehler', text:'Kein Zugang zu intervals.icu hinterlegt.' }); return; }
    try {
      const kg = await fetchGewicht(key, tagIso);
      if(kg) setF(x => ({ ...x, kg }));
      else setMeldung({ art:'fehler', text:'Für heute steht dort kein Gewicht.' });
    } catch(e){ setMeldung({ art:'fehler', text:'Nicht abrufbar: ' + e.message }); }
  }

  async function speichern(){
    const neu = {
      ftp:   werte.ftp  != null ? werte.ftp  : th.ftp,
      lthr:  werte.lthr != null ? werte.lthr : th.lthr,
      hrmax: th.hrmax
    };
    await addTestEntry(baueTestEintrag({
      tagIso, week: weekNumberFor(dayFromIso(tagIso), startDate.value),
      werte, ftp: neu.ftp, lthr: neu.lthr, bedingungen: f.bed, plan: p
    }));
    /* Anders als im Zonen-Tab werden beide Werte uebernommen und nicht nur die
       FTP, wenn noch keine dastand. Ein Test, dessen LTHR man danach von Hand
       nachtragen muss, hat den halben Zweck verfehlt - und der Rueckweg steht
       offen: unter Zonen lassen sich beide Zahlen jederzeit korrigieren. */
    await setThresholds(neu);
    setMeldung({ art:'ok', text:'Test gespeichert. FTP ' + (neu.ftp || '–') +
      ' W, LTHR ' + (neu.lthr || '–') + ' bpm – die Zonen rechnen ab sofort damit.' });

    const g = await gewichtSchreiben(tagIso, werte.weight);
    if(g.art === 'fehler'){
      setMeldung({ art:'fehler', text:'Gewicht nicht geschrieben: ' + g.text +
        ' Der Test ist trotzdem gespeichert.' });
    }
  }

  return (
    <>
      <div class="card">
        <div class="row"><span>Ergebnis eintragen</span>
          <b>{termin ? datumText(termin.datum) : 'ohne Termin'}</b></div>
        {/* Die gerechneten Zahlen stehen schon da, waehrend man tippt - so
            sieht man vor dem Speichern, was daraus wird. */}
        <div class="ergebnis">
          <div class="ergwert"><b>{werte.ftp != null ? werte.ftp + ' W' : '–'}</b><span>FTP</span></div>
          <div class="ergwert"><b>{werte.lthr != null ? werte.lthr + ' bpm' : '–'}</b><span>LTHR</span></div>
          <div class="ergwert"><b>{werte.wkg != null ? zahl(werte.wkg, 2) : '–'}</b><span>W/kg</span></div>
        </div>
        <Zahlenfeld titel="Ø-Watt der 20 min" wert={f.w20} min={1}
          onWert={v => setF({ ...f, w20: v })} />
        <Zahlenfeld titel="Ø-Puls der 20 min (bpm)" wert={f.hr20} min={1}
          onWert={v => setF({ ...f, hr20: v })} />
        {/* Kadenz statt der 5-min-Leistung: die entsteht seit Fassung 4 an
            einem anderen Tag und steht in ihrer eigenen Karte. Die Kadenz
            gehoert dagegen zum Test - zwei Tests bei 78 und bei 92 U/min sind
            nicht dasselbe. */}
        <Zahlenfeld titel="Ø-Kadenz der 20 min (U/min)" wert={f.kadenz} min={1}
          onWert={v => setF({ ...f, kadenz: v })} />
        {/* Das einzige Feld, das etwas ueber die Guete des Messwerts sagt.
            Der Trainingsplan verlangt es ausdruecklich: RPE der letzten fuenf
            Minuten, unter 9 heisst nicht ausbelastet. */}
        <Zahlenfeld titel="RPE der letzten 5 min (1–10)" wert={f.rpe} min={1} max={10}
          onWert={v => setF({ ...f, rpe: v })} />
        {werte.ausbelastet === false && (
          <p class="hint warn">
            Unter {AUSBELASTET_RPE} heißt: nicht ausbelastet. Dann ist die FTP eher zu niedrig –
            gemessen wurde nicht die Schwelle, sondern die Bereitschaft, an sie heranzugehen.
            Der Wert gilt trotzdem als Untergrenze; die eFTP und die VO2max-Referenz bleiben
            die Gegenproben.
          </p>
        )}
        <Zahlenfeld titel="Gewicht (kg)" wert={f.kg} min={1} dezimal schritt="0.1"
          onWert={v => setF({ ...f, kg: v })} />
        <Textfeld titel="Bedingungen" wert={f.bed} onWert={v => setF({ ...f, bed: v })}
          platzhalter="Temperatur, Wind, Strecke, Rad" />
        <div class="buttons">
          <button class="btn" disabled={!bereit} onClick={speichern}>Speichern</button>
          <button class="btn secondary" disabled={!apiKey.value} onClick={gewichtHolen}>Gewicht holen</button>
        </div>
        <p class="hint">
          Ø-Watt und Ø-Puls stehen in der Aufzeichnung als Werte des 20-min-Intervalls. Ohne
          Leistungsmesser genügt der Puls – die LTHR allein trägt die Pulsbänder, die
          Wattzonen bleiben dann leer.
        </p>
        {meldung && <div class={'meldung ' + meldung.art}><b>{meldung.text}</b></div>}
      </div>

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
        <ErgebnisAnsicht p={p} th={th} termin={termin} />
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
