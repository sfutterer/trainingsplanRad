/* Die Engine gegen eine gestellte Uhr. Genau der Fall, den die alte Fassung
   falsch gerechnet hat: Zeit vergeht, ohne dass ein Tick laeuft. */

import { describe, it, expect } from 'vitest';
import { createTimer } from '../src/domain/timer/engine.js';

function harness(){
  let t = 0;
  const ticks = [];
  const timer = createTimer({
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
