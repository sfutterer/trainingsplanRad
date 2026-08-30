/* Ablaeufe aller Timer. Reine Datenerzeugung - was daraus wird, entscheidet
   die Engine. */

import { repTarget } from '../core.js';
import { zeitDosis } from '../koerper.js';
import { thursdayPlan } from '../day.js';
import { zoneText, zoneSpan, wattText } from '../zones.js';

/* Ein Zonenetikett fuer die Anzeige im Timer. z12 ist die Spanne beim
   Einfahren und hat kein eigenes Band. */
function timerZone(plan, th, key, week){
  if(key === 'z12') return { label: zoneSpan(plan, th, 'z1', 'z2', week), cls: 'z2', key: 'z12' };
  const w = wattText(plan, th, key);
  return { label: zoneText(plan, th, key, week) + (w ? ' · ' + w : ''), cls: key, key };
}

export function buildCircuitSequence(plan, { workSec, restSec, roundRestSec, rounds }){
  const ex = plan.circuit.exercises;
  const seq = [{ type:'prep', label:'Bereit machen', duration: plan.circuit.prepSeconds }];
  for(let r = 1; r <= rounds; r++){
    ex.forEach((e, i) => {
      seq.push({ type:'work', label:e.name, reps:repTarget(e, workSec),
                 duration:workSec, round:r, exIndex:i });
      if(i !== ex.length - 1) seq.push({ type:'rest', label:'Pause', duration:restSec, round:r });
    });
    if(r < rounds) seq.push({ type:'roundrest', label:'Rundenpause', duration:roundRestSec, round:r });
  }
  seq.push({ type:'done', label:'Fertig!', duration:0 });
  return seq;
}

/* Eine Uebung aus Beweglichkeit oder Koordination, ihre Haltezeiten.

   Zwei Unterschiede zum Zirkel, beide beabsichtigt. Erstens endet die Folge
   mit der Uebung: in der naechsten steht man erst, wenn Weiter gedrueckt wird.
   Zweitens stehen zwischen den Saetzen keine Pausenschritte - im Plan steht
   keine Satzpause, also erfindet die App auch keine. Der Ablauf haelt
   stattdessen nach jedem Satz an und wartet auf einen Tipp; die Zeit zum
   Seitenwechsel nimmt sich jeder selbst.

   Liefert null, wenn die Dosierung in Wiederholungen steht - dann gibt es
   nichts zu zaehlen. */
export function buildHoldSequence(ex){
  const d = zeitDosis(ex && ex.dosage);
  if(!d) return null;
  const seiten = d.jeSeite ? 2 : 1;
  const seq = [];
  for(let satz = 1; satz <= d.saetze; satz++){
    for(let seite = 1; seite <= seiten; seite++){
      seq.push({ type:'hold', label: ex.name, duration: d.sekunden,
                 satz, saetze: d.saetze,
                 seite: d.jeSeite ? seite : null, seiten: d.jeSeite ? seiten : null });
    }
  }
  seq.push({ type:'done', label:'Fertig!', duration:0 });
  return seq;
}

/* Fester Ablauf aus plan.json. Ein Test, der sich verstellen laesst, ist kein
   Vergleichsmassstab mehr - deshalb kommen die Schritte aus der Datei und
   nicht aus den Eingabefeldern. */
export function buildTestSequence(plan, th, week){
  const Zn = k => timerZone(plan, th, k, week);
  const seq = [{ type:'prep', label:'Bereit machen', short:'Bereit machen',
                 duration: plan.interval.prepSeconds, zone: Zn('z1') }];
  for(const s of plan.thresholdTest.steps){
    seq.push({ type:s.type, label:s.label, short:s.short, duration:s.minutes * 60,
               zone:Zn(s.zone), rep:s.rep, reps:s.reps, note:s.note });
  }
  seq.push({ type:'done', label:'Fertig!', short:'Fertig', duration:0, zone:Zn('z1') });
  return seq;
}

export function buildIntervalSequence(plan, th, week, { warmMin, workMin, restMin, coolMin, reps, zoneKey }){
  const Zn = k => timerZone(plan, th, k, week);
  const warm = Math.round(warmMin * 60), work = Math.round(workMin * 60);
  const rest = Math.round(restMin * 60), cool = Math.round(coolMin * 60);
  const n = Math.max(1, Math.round(reps));
  const wz = Zn(zoneKey), z1 = Zn('z1');

  const seq = [{ type:'prep', label:'Bereit machen', short:'Bereit machen',
                 duration: plan.interval.prepSeconds, zone: z1 }];
  if(warm > 0) seq.push({ type:'warm', label:'Einfahren', short:'Einfahren', duration:warm, zone:Zn('z12') });
  for(let r = 1; r <= n; r++){
    seq.push({ type:'work', label:'Intervall ' + r, short:'Intervall ' + r + '/' + n,
               duration:work, zone:wz, rep:r, reps:n });
    if(r < n) seq.push({ type:'rest', label:'Erholung', short:'Erholung ' + r + '/' + (n - 1),
                         duration:rest, zone:z1, rep:r, reps:n });
  }
  if(cool > 0) seq.push({ type:'cool', label:'Ausrollen', short:'Ausrollen', duration:cool, zone:z1 });
  seq.push({ type:'done', label:'Fertig!', short:'Fertig', duration:0, zone:z1 });
  return seq;
}

/* Vorgaben des Donnerstags fuer den Intervalltimer. */
export function intervalDefaults(plan, week){
  const t = thursdayPlan(plan, week);
  if(t.kind === 'test') return { mode:'test', plan:t };
  if(t.kind === 'z2')   return { mode:'z2',   plan:t };
  return {
    mode:'intervals', plan:t,
    warmMin: plan.interval.warmupMinutes,
    coolMin: plan.interval.cooldownMinutes,
    reps: t.reps, workMin: t.workMin, restMin: t.restMin, zoneKey: t.zone
  };
}

export function totalSeconds(seq){
  return seq.reduce((n, s) => n + s.duration, 0);
}

export function remainingAfter(seq, index){
  let sum = 0;
  for(let i = index + 1; i < seq.length; i++) sum += seq[i].duration;
  return sum;
}

/* Eine einzelne Pause des Beinblocks.

   Der Beinblock zaehlt Wiederholungen, keine Sekunden - eine Kniebeuge mit 3 s
   Absenken laesst sich nicht gegen eine Uhr fahren, ohne genau das Tempo zu
   verlieren, das den Reiz ausmacht. Die Pausen dazwischen stehen dagegen als
   Zahlen im Plan und wurden bisher nur als Fliesstext angezeigt.

   Deshalb keine Folge ueber den ganzen Block, sondern eine Uhr je Pause: der
   Satz selbst endet, wenn der Nutzer "Erledigt" drueckt, und erst danach hat
   die Uhr etwas zu zaehlen. Eine durchgehende Sequenz haette die Saetze mit
   einer erfundenen Dauer versehen muessen. */
export function buildLegRestSequence(seconds, label){
  return [
    { type:'rest', label: label || 'Pause', duration: Math.max(1, Math.round(seconds)) },
    { type:'done', label:'Weiter', duration: 0 }
  ];
}
