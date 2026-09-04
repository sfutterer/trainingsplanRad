/* Der Bildschirm einer Schrittfolge: Ring, Tastenreihe, Ablaufvorschau.

   Zwei Bereiche zeigen ihn - der Intervalltimer und der Ablauf im
   Testbereich. Bis zum 04.09.2026 hatte jeder seine eigene Abschrift, und
   zwar keine ungefaehre: der Requisitenblock des Rings stand in beiden
   Dateien Zeile fuer Zeile gleich da, die Vorschauliste ebenso, und die Regel
   "welche Farbe traegt ein Schritt" viermal woertlich - je zweimal je Datei,
   einmal fuer den Ring und einmal fuer die Liste daneben.

   Das ist dieselbe Begruendung, aus der schon useSchrittTimer.js entstanden
   ist: dort lag die Uhr samt Ansagen zweimal, hier ihre Anzeige. Beide Male
   waeren es zwei Gelegenheiten gewesen, dieselbe Sache auseinanderlaufen zu
   lassen - und auf dem Rad ist genau diese Anzeige das, worauf man schaut.

   Was hier liegt, ist das Gemeinsame: die Uhr, die Farben, die Vorschau, die
   Tastenbelegung. Was jeder Bereich fuer sich behaelt, ist die Frage, wie die
   Belastung heisst (im Intervalltimer nach Zone - Tempo, Schwelle, VO2max -,
   im Testbereich nach Ablauf) und wie das Beenden heisst. Beides kommt als
   Requisite herein. */

import { Buehne } from './Buehne.jsx';
import { Zonenliste } from './Zonenliste.jsx';
import { mmss, dauerText } from '../../domain/zeit.js';
import { remainingAfter } from '../../domain/timer/sequences.js';

/* Die Farbe eines Schritts.

   Belastung in Z5 traegt die harte Farbe, jede andere Belastung die mittlere;
   das Einfahren ist das einzige Blau, weil es das einzige ist, bei dem man
   noch nichts leistet und trotzdem faehrt. Alles Uebrige - Pause, Ausrollen,
   Bereitmachen, Fertig - ist gedaempft.

   Nicht als Tabelle nach step.type: Z5 und Z4 sind derselbe Typ und tragen
   verschiedene Farben, eine Tabelle koennte das nicht ausdruecken. */
export function schrittFarbe(step){
  if(!step) return 'var(--prep)';
  if(step.type === 'work'){
    return step.zone && step.zone.key === 'z5' ? 'var(--hard)' : 'var(--rest)';
  }
  return step.type === 'warm' ? 'var(--work)' : 'var(--prep)';
}

const PHASEN = { warm:'Einfahren', rest:'Erholung', cool:'Ausrollen', done:'Fertig' };

/* Die Ueberschrift ueber der Zahl im Ring.

   `arbeit` benennt die Belastung und ist das Einzige, was die beiden Bereiche
   unterscheidet: eine Zeichenkette, oder eine Funktion ueber den Schritt, wo
   der Name an der Zone haengt. */
export function schrittPhase(step, arbeit){
  if(!step) return 'Bereit';
  if(step.type === 'work'){
    return (typeof arbeit === 'function' ? arbeit(step) : arbeit) || 'Belastung';
  }
  return PHASEN[step.type] || 'Bereit';
}

/* Der Ablauf als Liste, mit der laufenden Zeile markiert.

   Bereitmachen und Fertig bleiben draussen: das eine ist kein Schritt des
   Plans, das andere kein Schritt mehr. */
export function Schrittvorschau({ sequenz, index }){
  return (
    <div class="seglist">
      {sequenz.map((s, i) => {
        if(s.type === 'done' || s.type === 'prep') return null;
        const band = s.zone && s.zone.label ? s.zone.label.split(' · ')[0] : '';
        return (
          <div class={'seg' + (i === index ? ' aktiv' : (index > i ? ' fertig' : ''))} key={i}>
            <span><i class="dot" style={'background:' + schrittFarbe(s)}></i>{s.label}</span>
            <span class="dur">{mmss(s.duration)} · {band}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Die Buehne einer Schrittfolge.

   Vor dem Start zeigt der Ring die Dauer des ersten echten Schritts -
   vorschau[1], denn vorschau[0] ist das Bereitmachen. Eine leere Uhr oder
   eine auf 0 waere ein Ring, der nichts verspricht. */
export function Schrittbuehne({ uhr, vorschau, arbeit, endeLabel }){
  const timer = uhr.timer;
  const step = timer.step;
  const sec = timer.secondsLeft();
  const naechster = vorschau[1];

  return (
    <Buehne
      ring={{
        fraction: timer.fraction(),
        color: schrittFarbe(step),
        phase: schrittPhase(step, arbeit),
        time: step ? (step.type === 'done' ? '0:00' : mmss(sec))
                   : mmss(naechster ? naechster.duration : 0),
        exercise: step ? step.label : 'Tippen zum Starten',
        meta: step && step.type !== 'done'
          ? 'noch ' + dauerText(remainingAfter(timer.sequence, timer.index) + sec) : '',
        zone: step ? step.zone : (naechster && naechster.zone)
      }}
      zurueck={{ onClick: uhr.zurueck, disabled: !step || timer.index <= 0 }}
      haupt={{ label: timer.running ? 'Pause'
                      : (step && step.type !== 'done' ? 'Fortsetzen' : 'Start'),
               onClick: uhr.starten }}
      weiter={{ onClick: uhr.weiter, disabled: !step || step.type === 'done' }}
      ende={step ? { label: endeLabel, onClick: uhr.beenden } : null} />
  );
}

/* Die Pulsbaender unter dem Ablauf.

   Stehen in beiden Bereichen, mit demselben Kopf und demselben Inhalt - nur
   der Satz darunter unterscheidet sich, und im Intervalltimer gibt es keinen.
   Die Baender sind hier ohne Wattbereich: die Vorgabe fuer heute steht schon
   ueber der Ablaufliste, hier geht es nur um den Puls. */
export function Zonenkarte({ bands, plan, thresholds, coggan, woche, children }){
  return (
    <div class="card">
      <div class="row"><span>Pulszonen Woche {woche}</span>
        <b>{coggan ? 'Coggan aus LTHR' : 'Übergangsbänder'}</b></div>
      <Zonenliste bands={bands} plan={plan} thresholds={thresholds} />
      {children}
    </div>
  );
}
