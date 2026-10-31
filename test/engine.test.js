/* Die Engine gegen eine gestellte Uhr. Genau der Fall, den die alte Fassung
   falsch gerechnet hat: Zeit vergeht, ohne dass ein Tick laeuft. */

import { describe, it, expect } from 'vitest';
import { createTimer } from '../src/domain/timer/engine.js';
import { buildNeutralSequence } from '../src/domain/timer/sequences.js';

function harness(opt){
  let t = 0;
  const ticks = [];
  const timer = createTimer({
    ...opt,
    now: () => t,
    setInterval: (fn) => { ticks.push(fn); return ticks.length; },
    clearInterval: () => {}
  });
  return { timer, advance: ms => { t += ms; }, tick: () => ticks.forEach(f => f()), now: () => t };
}

const seq = () => ([
  { type:'prep', label:'Bereit', duration:10 },
  { type:'work', label:'A', duration:30 },
  { type:'rest', label:'Pause', duration:20 },
  { type:'done', label:'Fertig', duration:0 }
]);

describe('Timer-Engine', () => {
  it('rechnet die Restzeit aus der Uhr, nicht aus der Zahl der Ticks', () => {
    const h = harness();
    h.timer.load(seq());
    h.timer.start();
    expect(h.timer.secondsLeft()).toBe(10);
    /* Sechs Sekunden Wanduhr, kein einziger Tick - die alte Fassung haette
       hier noch 10 angezeigt und die Zeit nie aufgeholt. */
    h.advance(6000);
    h.tick();
    expect(h.timer.secondsLeft()).toBe(4);
  });

  it('haelt die Restzeit waehrend der Pause an', () => {
    const h = harness();
    h.timer.load(seq());
    h.timer.start();
    h.advance(4000); h.tick();
    expect(h.timer.secondsLeft()).toBe(6);
    h.timer.pause();
    h.advance(60000);
    expect(h.timer.secondsLeft()).toBe(6);
    h.timer.start();
    expect(h.timer.secondsLeft()).toBe(6);
  });

  it('geht bei abgelaufener Zeit in den naechsten Schritt', () => {
    const h = harness();
    const gesehen = [];
    h.timer.on('step', ({ step }) => gesehen.push(step.label));
    h.timer.load(seq());
    h.timer.start();
    h.advance(10000); h.tick();
    expect(gesehen).toEqual(['Bereit', 'A']);
    expect(h.timer.secondsLeft()).toBe(30);
  });

  it('ueberspringt auch mehrere Sekunden am Stueck ohne einen Schritt zu verlieren', () => {
    const h = harness();
    const gesehen = [];
    h.timer.on('step', ({ step }) => gesehen.push(step.label));
    h.timer.load(seq());
    h.timer.start();
    h.advance(11000); h.tick();     // prep vorbei
    h.advance(31000); h.tick();     // A vorbei
    expect(gesehen).toEqual(['Bereit', 'A', 'Pause']);
  });

  it('meldet beim Weiterdruecken die offene Restzeit', () => {
    const h = harness();
    const verlassen = [];
    h.timer.on('leave', e => verlassen.push({ label: e.step.label, rest: e.restSeconds }));
    h.timer.load(seq());
    h.timer.start();
    h.advance(10000); h.tick();     // in Schritt A
    h.advance(9000);  h.tick();     // 21 s offen
    h.timer.skip();
    expect(verlassen[verlassen.length - 1]).toEqual({ label:'A', rest:21 });
  });

  it('haelt am Ende an und meldet done', () => {
    const h = harness();
    let fertig = false;
    h.timer.on('done', () => { fertig = true; });
    h.timer.load(seq());
    h.timer.start();
    h.advance(10000); h.tick();
    h.advance(30000); h.tick();
    h.advance(20000); h.tick();
    expect(fertig).toBe(true);
    expect(h.timer.running).toBe(false);
  });

  /* Der neutrale Timer: Uebung und Pause im Wechsel, ohne 'done' und ohne
     Rundenzahl. Genau das, was die Engine vor dem 31.10.2026 nicht konnte -
     hinter dem letzten Schritt stand sie still, der Takt lief weiter und die
     Anzeige blieb auf der letzten Ziffer stehen. */
  it('faengt im Endlosbetrieb hinter dem letzten Schritt wieder vorne an', () => {
    const h = harness({ endlos: true });
    const gesehen = [];
    h.timer.on('step', ({ step }) => gesehen.push(step.label));
    h.timer.load([
      { type:'work', label:'Übung', duration:60 },
      { type:'rest', label:'Pause', duration:30 }
    ]);
    h.timer.start();
    h.advance(60000); h.tick();
    h.advance(30000); h.tick();
    h.advance(60000); h.tick();
    expect(gesehen).toEqual(['Übung', 'Pause', 'Übung', 'Pause']);
    expect(h.timer.running).toBe(true);
    expect(h.timer.secondsLeft()).toBe(30);
  });

  it('laeuft ohne endlos weiter auf das Ende zu', () => {
    const h = harness();
    const gesehen = [];
    h.timer.on('step', ({ step }) => gesehen.push(step.label));
    h.timer.load(seq());
    h.timer.start();
    h.advance(10000); h.tick();
    h.advance(30000); h.tick();
    h.advance(20000); h.tick();
    expect(gesehen).toEqual(['Bereit', 'A', 'Pause', 'Fertig']);
    expect(h.timer.running).toBe(false);
  });

  it('laesst einen fehlerhaften Abonnenten den Ablauf nicht anhalten', () => {
    const h = harness();
    h.timer.on('tick', () => { throw new Error('kaputt'); });
    h.timer.load(seq());
    h.timer.start();
    h.advance(6000);
    expect(() => h.tick()).not.toThrow();
    expect(h.timer.secondsLeft()).toBe(4);
  });
});

/* Die Folge des neutralen Timers. Zwei Schritte, kein 'done' - das Ende
   besorgt der Nutzer, nicht die Datei. */
describe('Neutrale Folge', () => {
  it('wechselt Uebung und Pause und endet nicht von selbst', () => {
    const seq = buildNeutralSequence({ workSec: 60, restSec: 30 });
    expect(seq.map(s => [s.type, s.duration])).toEqual([['work', 60], ['rest', 30]]);
    expect(seq.some(s => s.type === 'done')).toBe(false);
  });

  it('nimmt die kurze Dauer genauso', () => {
    expect(buildNeutralSequence({ workSec: 30, restSec: 30 })[0].duration).toBe(30);
  });

  /* Eine Dauer von null Sekunden gibt es nicht: der Schritt waere in
     demselben Takt vorbei, in dem er beginnt, und die Ansagen ueberschlugen
     sich. */
  it('laesst keinen Schritt auf null fallen', () => {
    const seq = buildNeutralSequence({ workSec: 0, restSec: -5 });
    expect(seq.map(s => s.duration)).toEqual([1, 1]);
  });
});
