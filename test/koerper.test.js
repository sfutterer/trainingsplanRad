/* Welche Uebung laeuft gegen die Uhr?

   Die Dosierung von Beweglichkeit und Koordination steht in plan.json als
   Text, der Timer braucht daraus eine Zahl. Der Test haelt beide Seiten fest:
   das Muster selbst, und dass die neun Uebungen im echten Plan genau so
   gelesen werden, wie sie gemeint sind. Kommt eine Uebung dazu oder wird eine
   Dosierung umformuliert, faellt hier auf, ob sie ihren Timer verliert. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import { zeitDosis, istZeitgesteuert, zeitSekunden } from '../src/domain/koerper.js';
import { buildHoldSequence } from '../src/domain/timer/sequences.js';
import { createTimer } from '../src/domain/timer/engine.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);

describe('Zeitdosierung lesen', () => {
  it('liest eine einzelne Haltezeit', () => {
    expect(zeitDosis('60 s')).toEqual({ saetze:1, sekunden:60, jeSeite:false, halten:1 });
  });

  it('liest Saetze mit dem Malzeichen aus dem Plan', () => {
    expect(zeitDosis('2 × 30 s')).toEqual({ saetze:2, sekunden:30, jeSeite:false, halten:2 });
    expect(zeitDosis('2 x 30 s')).toEqual({ saetze:2, sekunden:30, jeSeite:false, halten:2 });
  });

  it('nimmt bei einer Spanne das obere Ende - daran haengt die Freischaltregel', () => {
    expect(zeitDosis('3 × 20–30 s je Seite'))
      .toEqual({ saetze:3, sekunden:30, jeSeite:true, halten:6 });
  });

  it('erkennt Wiederholungen nicht als Zeit', () => {
    expect(zeitDosis('10 Wdh. je Seite')).toBe(null);
    expect(zeitDosis('8 Wdh. je Seite')).toBe(null);
    expect(zeitDosis('6 je Seite')).toBe(null);
  });

  /* Das grosse S von "Schritte" darf nicht als Sekundenzeichen durchgehen -
     genau deshalb ist das Muster nicht case-insensitive. */
  it('haelt "20 Schritte" fuer keine Zeitangabe', () => {
    expect(zeitDosis('20 Schritte')).toBe(null);
  });

  it('vertraegt fehlende und leere Angaben', () => {
    expect(zeitDosis(undefined)).toBe(null);
    expect(zeitDosis('')).toBe(null);
    expect(zeitDosis('0 s')).toBe(null);
  });
});

describe('Zeitdosierung im echten Plan', () => {
  it('Beweglichkeit: nur die tiefe Kniebeuge laeuft gegen die Uhr', () => {
    const mit = plan.mobility.exercises.filter(istZeitgesteuert).map(e => e.key);
    expect(mit).toEqual(['deepSquat']);
    expect(zeitSekunden(plan.mobility.exercises[0])).toBe(60);
  });

  it('Koordination: alles ausser dem Diagonalgang laeuft gegen die Uhr', () => {
    const mit = plan.coordination.exercises.filter(istZeitgesteuert).map(e => e.key);
    expect(mit).toEqual(['singleLegEyesClosed', 'singleLegHeadTurns', 'tandemUnstable']);
  });
});

describe('Haltefolge einer Uebung', () => {
  const einbein = plan.coordination.exercises.find(e => e.key === 'singleLegEyesClosed');

  it('macht aus drei Saetzen je Seite sechs Haltezeiten und ein Ende', () => {
    const seq = buildHoldSequence(einbein);
    expect(seq.length).toBe(7);
    expect(seq.filter(s => s.type === 'hold').length).toBe(6);
    expect(seq[seq.length - 1].type).toBe('done');
    expect(seq.every(s => s.type !== 'hold' || s.duration === 30)).toBe(true);
  });

  it('wechselt die Seite innerhalb des Satzes, nicht danach', () => {
    const holds = buildHoldSequence(einbein).filter(s => s.type === 'hold');
    expect(holds.map(s => s.satz + '/' + s.seite))
      .toEqual(['1/1', '1/2', '2/1', '2/2', '3/1', '3/2']);
  });

  /* Kein Zirkel: die Folge endet mit der Uebung. Keine naechste Uebung, keine
     erfundene Satzpause. */
  it('enthaelt keinen Schritt, der ueber die Uebung hinausfuehrt', () => {
    const seq = buildHoldSequence(einbein);
    expect(seq.every(s => s.type === 'hold' || s.type === 'done')).toBe(true);
    expect(seq.every(s => s.type !== 'hold' || s.label === einbein.name)).toBe(true);
  });

  it('laesst eine Uebung ohne Zeitdosierung ohne Folge', () => {
    const gehen = plan.coordination.exercises.find(e => e.key === 'crossCrawl');
    expect(buildHoldSequence(gehen)).toBe(null);
  });

  it('gibt einer einzelnen Haltezeit weder Satz- noch Seitenzaehler', () => {
    const holds = buildHoldSequence(plan.mobility.exercises[0]).filter(s => s.type === 'hold');
    expect(holds.length).toBe(1);
    expect(holds[0].saetze).toBe(1);
    expect(holds[0].seite).toBe(null);
  });
});

/* Der Satzwechsel haengt an einem Zusammenspiel, das man der Engine nicht
   ansieht: Koerperablauf.jsx ruft pause() aus dem step-Abonnenten heraus - also
   waehrend die Engine gerade in den naechsten Schritt eingetreten ist. Bricht
   das, laeuft die Uhr durch alle Saetze durch und der Ablauf ist doch ein
   Zirkel. Deshalb hier gegen eine gestellte Uhr nachgestellt. */
describe('Satzwechsel haelt an', () => {
  function harness(){
    let t = 0;
    const ticks = [];
    const timer = createTimer({
      now: () => t,
      setInterval: fn => { ticks.push(fn); return ticks.length; },
      clearInterval: () => { ticks.length = 0; }
    });
    return { timer, advance: ms => { t += ms; }, tick: () => ticks.slice().forEach(f => f()) };
  }

  function ablauf(ex){
    const h = harness();
    const gesehen = [];
    h.timer.on('step', ({ step, index }) => {
      gesehen.push(step.type === 'hold' ? 'Satz ' + step.satz + '/Seite ' + step.seite : step.type);
      if(step.type === 'hold' && index > 0) h.timer.pause();
    });
    h.timer.load(buildHoldSequence(ex));
    return { ...h, gesehen };
  }

  const einbein = plan.coordination.exercises.find(e => e.key === 'singleLegEyesClosed');

  it('bleibt nach dem ersten Satz mit voller Restzeit stehen', () => {
    const a = ablauf(einbein);
    a.timer.start();
    a.advance(30000); a.tick();
    expect(a.gesehen).toEqual(['Satz 1/Seite 1', 'Satz 1/Seite 2']);
    expect(a.timer.running).toBe(false);
    expect(a.timer.secondsLeft()).toBe(30);
  });

  it('laeuft nicht von selbst weiter, auch wenn Zeit vergeht', () => {
    const a = ablauf(einbein);
    a.timer.start();
    a.advance(30000); a.tick();
    a.advance(600000); a.tick();
    expect(a.gesehen.length).toBe(2);
    expect(a.timer.secondsLeft()).toBe(30);
  });

  it('nimmt den angehaltenen Satz mit voller Dauer wieder auf', () => {
    const a = ablauf(einbein);
    a.timer.start();
    a.advance(30000); a.tick();
    a.advance(120000);
    a.timer.start();
    expect(a.timer.running).toBe(true);
    expect(a.timer.secondsLeft()).toBe(30);
    a.advance(29000); a.tick();
    expect(a.timer.secondsLeft()).toBe(1);
  });

  it('endet nach dem letzten Satz mit done und ohne naechste Uebung', () => {
    const a = ablauf(einbein);
    a.timer.start();
    for(let i = 0; i < 6; i++){
      a.advance(30000); a.tick();
      if(i < 5) a.timer.start();     // Satzwechsel geht nur von Hand weiter
    }
    expect(a.gesehen).toEqual(['Satz 1/Seite 1', 'Satz 1/Seite 2', 'Satz 2/Seite 1',
                               'Satz 2/Seite 2', 'Satz 3/Seite 1', 'Satz 3/Seite 2', 'done']);
    expect(a.timer.running).toBe(false);
  });
});
