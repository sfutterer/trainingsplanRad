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
   ausdruecklich "notieren", und notiert wurde sie bisher nirgends. Jetzt steht
   ein Feld dafuer unter seinem Ablauf, und die Zahl steht sieben Tage spaeter
   ueber dem Test.

   Warum LTHR hier ein eigenes Feld hat und im Zonen-Tab nicht: das dortige
   Formular nimmt Ø-Watt, rechnet die FTP und laesst die LTHR von Hand
   eintragen - ausgerechnet die Zahl, aus der alle Pulsbaender entstehen. Wer
   sie vergisst, faehrt den Folgeblock weiter nach den Uebergangsbaendern und
   merkt es nicht. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, testLog, testPrep, apiKey, settings,
         setThresholds, addTestEntry, setTestPrep } from '../../../state/store.js';
import { aktuellerTermin, anlaufTage, testPhase, testAblaeufe,
         vorgewaehlterAblauf, testWerte, terminSchluessel, FTP_FAKTOR }
  from '../../../domain/test.js';
import { buildStepSequence, totalSeconds, remainingAfter } from '../../../domain/timer/sequences.js';
import { hrBands, usesCoggan } from '../../../domain/zones.js';
import { isoDayLocal, toMidnight, dayOffset, weekNumberFor, dayFromIso,
         WEEKDAY_NAMES } from '../../../domain/week.js';
import { fetchWellness, putWellness } from '../../../data/icu.js';
import { bestaetige } from '../../../state/dialog.js';
import { Segmented } from '../../components/Segmented.jsx';
import { Buehne } from '../../components/Buehne.jsx';
import { Baustein } from '../training/Baustein.jsx';
import { Zonenliste } from '../../components/Zonenliste.jsx';
import { Zahlenfeld, Textfeld, Auswahlfeld } from '../../components/Feld.jsx';
import { useSchrittTimer } from '../../components/useSchrittTimer.js';
import { zahl } from '../../../domain/zahlen.js';
import '../../components/timer.css';
import './test.css';

const ANSICHTEN = [
  { id: 'anleitung', label: 'Anleitung' },
  { id: 'ablauf',    label: 'Ablauf' },
  { id: 'ergebnis',  label: 'Ergebnis' }
];

function klok(sec){
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
function dauer(sec){
  const m = Math.round(sec / 60);
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min';
}
function kurzDatum(d){
  return WEEKDAY_NAMES[d.getDay()].slice(0, 2) + ', ' +
    d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
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
          ? termin.datum.toLocaleDateString('de-DE') + ' · Woche ' + termin.week
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

/* Wie gefahren wird, in der Reihenfolge des Ablaufs. Die Saetze stammen aus
   den Schritten des Plans und nicht aus einem zweiten Text daneben - sonst
   stuenden die Anweisungen zweimal da und liefen auseinander. */
function DurchfuehrungKarte({ p }){
  const t = p.thresholdTest;
  if(!t) return null;
  const mitNote = (t.steps || []).filter(s => s.note);
  return (
    <div class="card">
      <div class="row"><span>Durchführung</span>
        <b>{t.steering || 'fester Ablauf'}</b></div>
      <p class="hint">{p.texts.thresholdTestSummary}</p>
      <div class="listhead">Worauf es in den Schritten ankommt</div>
      <ul class="regelliste">
        {mitNote.map((s, i) => <li key={i}><b>{s.short || s.label}:</b> {s.note}</li>)}
      </ul>
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

function Ablaufansicht({ p, th, w, ablaeufe, gewaehlt, setGewaehlt, prep, onNotiz }){
  const s = settings.value;
  const a = ablaeufe.find(x => x.id === gewaehlt) || ablaeufe[0];
  const uhr = useSchrittTimer({
    kennung: 'test', voice: s.voice,
    sequenz: () => buildStepSequence(p, th, w, a.steps)
  });
  const timer = uhr.timer;

  const vorschau = timer.sequence.length ? timer.sequence : buildStepSequence(p, th, w, a.steps);
  const step = timer.step;
  const sec = timer.secondsLeft();

  const phase = !step ? 'Bereit'
    : step.type === 'work' ? (a.id === 'test' ? 'Test' : 'Belastung')
    : step.type === 'warm' ? 'Einfahren'
    : step.type === 'rest' ? 'Erholung'
    : step.type === 'cool' ? 'Ausrollen'
    : step.type === 'done' ? 'Fertig' : 'Bereit';

  const farbe = !step ? 'var(--prep)'
    : step.type === 'work' ? (step.zone && step.zone.key === 'z5' ? 'var(--hard)' : 'var(--rest)')
    : step.type === 'warm' ? 'var(--work)' : 'var(--prep)';

  return (
    <Baustein
      titel={a.titel.replace('Rad – ', '')}
      meta={dauer(totalSeconds(vorschau))}
      status={<p class="tagchip">
        {a.datum ? kurzDatum(a.datum) + ' · ' : ''}{a.steering || 'fester Ablauf'}
      </p>}
      buehne={
        <Buehne
          ring={{
            fraction: timer.fraction(),
            color: farbe,
            phase,
            time: step ? (step.type === 'done' ? '0:00' : klok(sec)) : klok(vorschau[1] ? vorschau[1].duration : 0),
            exercise: step ? step.label : 'Tippen zum Starten',
            meta: step && step.type !== 'done'
              ? 'noch ' + dauer(remainingAfter(timer.sequence, timer.index) + sec) : '',
            zone: step ? step.zone : (vorschau[1] && vorschau[1].zone)
          }}
          zurueck={{ onClick: uhr.zurueck, disabled: !step || timer.index <= 0 }}
          haupt={{ label: timer.running ? 'Pause'
                          : (step && step.type !== 'done' ? 'Fortsetzen' : 'Start'),
                   onClick: uhr.starten }}
          weiter={{ onClick: uhr.weiter, disabled: !step || step.type === 'done' }}
          ende={step ? { label: 'Ablauf beenden', onClick: uhr.beenden } : null} />
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

      {/* Der Tempotest hat als Einziger ein Ergebnis, das man mitnimmt. Das
          Feld steht deshalb unter seinem Ablauf und nirgends sonst. */}
      {a.tempo && (
        <div class="card">
          <div class="row"><span>Ergebnis des Tempotests</span>
            <b>{prep && prep.zielWatt > 0 ? prep.zielWatt + ' W' : 'noch nichts notiert'}</b></div>
          <Zahlenfeld titel="Ø-Watt Block 2 (W)" wert={prep ? prep.zielWatt : null} min={1}
            onWert={v => onNotiz({ zielWatt: v })} />
          <Zahlenfeld titel="Ø-Puls Block 2 (bpm)" wert={prep ? prep.zielPuls : null} min={1}
            onWert={v => onNotiz({ zielPuls: v })} />
          <p class="hint">
            Das ist die Zahl, auf die im Test gezielt wird. Sie steht danach oben im Bereich
            und am Testtag über der Uhr – aufgeschrieben statt erinnert, sieben Tage sind zu
            lang. Der Puls wird mitgeschrieben und nicht angesteuert; die LTHR liefert erst
            der Test.
          </p>
        </div>
      )}

      <div class="card">
        <div class="row"><span>Ablauf</span><b>{a.steps.length} Schritte</b></div>
        <div class="seglist">
          {vorschau.map((s2, i) => {
            if(s2.type === 'done' || s2.type === 'prep') return null;
            const farbe2 = s2.type === 'work' ? (s2.zone && s2.zone.key === 'z5' ? 'var(--hard)' : 'var(--rest)')
                         : s2.type === 'warm' ? 'var(--work)' : 'var(--prep)';
            return (
              <div class={'seg' + (i === timer.index ? ' aktiv' : (timer.index > i ? ' fertig' : ''))} key={i}>
                <span><i class="dot" style={'background:' + farbe2}></i>{s2.label}</span>
                <span class="dur">{klok(s2.duration)} · {(s2.zone && s2.zone.label ? s2.zone.label.split(' · ')[0] : '')}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div class="card">
        <div class="row"><span>Pulszonen Woche {w}</span>
          <b>{usesCoggan(p, th, w) ? 'Coggan aus LTHR' : 'Übergangsbänder'}</b></div>
        <Zonenliste bands={hrBands(p, th, w)} plan={p} thresholds={th} />
        <p class="hint">
          Während des Tests ist der Puls Ergebnis und keine Vorgabe – die Bänder stehen hier
          nur, damit Einfahren und Ausrollen eine Obergrenze haben.
        </p>
      </div>
    </Baustein>
  );
}

/* ---------- Ergebnis ---------- */

function ErgebnisAnsicht({ th, termin }){
  const [f, setF] = useState({ w20:null, hr20:null, w5:null, kg:null, bed:'' });
  const [meldung, setMeldung] = useState(null);
  const werte = testWerte({ w20:f.w20, hr20:f.hr20, w5:f.w5, gewicht:f.kg });
  const tagIso = isoDayLocal(toMidnight(today.value));
  const bereit = werte.ftp != null || werte.lthr != null;

  /* Das Gewicht steht meist schon in der Wellness - dann muss es niemand
     abtippen und die beiden Quellen koennen nicht auseinanderlaufen. */
  async function gewichtHolen(){
    const key = apiKey.value;
    if(!key){ setMeldung({ art:'fehler', text:'Kein Zugang zu intervals.icu hinterlegt.' }); return; }
    try {
      const rows = await fetchWellness(key, tagIso, tagIso);
      const r = (Array.isArray(rows) ? rows : []).find(x => x && x.weight > 0);
      if(r) setF(x => ({ ...x, kg: r.weight }));
      else setMeldung({ art:'fehler', text:'Für heute steht dort kein Gewicht.' });
    } catch(e){ setMeldung({ art:'fehler', text:'Nicht abrufbar: ' + e.message }); }
  }

  async function speichern(){
    const neu = {
      ftp:   werte.ftp  != null ? werte.ftp  : th.ftp,
      lthr:  werte.lthr != null ? werte.lthr : th.lthr,
      hrmax: th.hrmax
    };
    await addTestEntry({
      day: tagIso,
      week: weekNumberFor(dayFromIso(tagIso), startDate.value),
      w20: werte.w20, w5: werte.w5,
      ftp: neu.ftp, lthr: neu.lthr,
      weight: werte.weight,
      conditions: f.bed.trim()
    });
    /* Anders als im Zonen-Tab werden beide Werte uebernommen und nicht nur die
       FTP, wenn noch keine dastand. Ein Test, dessen LTHR man danach von Hand
       nachtragen muss, hat den halben Zweck verfehlt - und der Rueckweg steht
       offen: unter Zonen lassen sich beide Zahlen jederzeit korrigieren. */
    await setThresholds(neu);
    setMeldung({ art:'ok', text:'Test gespeichert. FTP ' + (neu.ftp || '–') +
      ' W, LTHR ' + (neu.lthr || '–') + ' bpm – die Zonen rechnen ab sofort damit.' });

    if(werte.weight > 0 && apiKey.value){
      const ja = await bestaetige({
        titel: 'Gewicht nach intervals.icu schreiben?',
        text: werte.weight + ' kg für den ' + dayFromIso(tagIso).toLocaleDateString('de-DE') + '. '
            + 'Das ist der einzige Wert, den diese App jemals dorthin schreibt – '
            + 'alles andere wird nur gelesen.',
        jaLabel: 'Schreiben'
      });
      if(!ja) return;
      try { await putWellness(apiKey.value, tagIso, { weight: werte.weight }); }
      catch(e){ setMeldung({ art:'fehler', text:'Gewicht nicht geschrieben: ' + e.message +
        ' Der Test ist trotzdem gespeichert.' }); }
    }
  }

  const hist = testLog.value.slice().sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 4);

  return (
    <>
      <div class="card">
        <div class="row"><span>Ergebnis eintragen</span>
          <b>{termin ? termin.datum.toLocaleDateString('de-DE') : 'ohne Termin'}</b></div>
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
        <Zahlenfeld titel="Ø-Watt der 5 min" wert={f.w5} min={1}
          onWert={v => setF({ ...f, w5: v })} />
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

      {hist.length > 0 && (
        <div class="card">
          <div class="row"><span>Testhistorie</span><b>{testLog.value.length} Einträge</b></div>
          {hist.map((e, i) => (
            <div class="listrow" key={i}>
              <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
              <span>FTP {e.ftp || '–'} W · LTHR {e.lthr || '–'} bpm{e.w20 ? ' · 20 min ' + e.w20 + ' W' : ''}</span>
            </div>
          ))}
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
          onNotiz={patch => setTestPrep(schluessel, patch)} />
      </>
    );
  }

  if(ansicht === 'ergebnis'){
    return (
      <>
        {umschalter}
        <ErgebnisAnsicht th={th} termin={termin} />
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
      <DurchfuehrungKarte p={p} />
      {phase !== 'heute' && goNoGo}
      <AuswertungsKarte th={th} />
    </>
  );
}
