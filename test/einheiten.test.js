/* Die Einheitsarten - was der Plan vorgibt und was aufgezeichnet wurde.

   Die Art traegt in beiden Ansichten ein Zeichen und eine Farbe. Faellt die
   Einordnung falsch aus, sieht man das nicht als Fehler, sondern als eine
   Woche, die anders aussieht als sie ist - deshalb steht sie hier und nicht
   nur in der Anzeige.

   Geprueft wird beides an seiner Grenze: der Plan an den Tagen, an denen die
   Art nicht am Typ haengt (Testtag), die Aufzeichnung an der langen Ausfahrt
   mit Bloecken - der Fall, in dem Dauer und Haerte auseinandergehen. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import * as W from '../src/domain/week.js';
import * as Z from '../src/domain/zones.js';
import { buildDayInfo } from '../src/domain/day.js';
import { artDerAktivitaet } from '../src/domain/einheiten.js';
import { EINHEITSARTEN } from '../src/ui/components/Einheitssymbol.jsx';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const start = W.toMidnight(new Date('2026-08-15'));

const artAm = d => buildDayInfo(plan, Z.NO_THRESHOLDS, d, start).art;

/* start ist ein Samstag - der erste Tag der Trainingswoche 1. */
function tagDerWoche(woche, versatz){
  return W.addDays(start, (woche - 1) * 7 + versatz);
}

function fahrt(felder){
  return { type:'Ride', moving_time: 60 * 60, ...felder };
}

describe('Einheitsart im Plan', () => {
  it('gibt jedem Tag der Woche seine Art', () => {
    const arten = [0, 1, 2, 3, 4, 5, 6].map(v => artAm(tagDerWoche(1, v)));
    /* Samstag bis Freitag. Woche 1 faehrt mittwochs nicht (0 min), der Tag
       ist dort reiner Zirkel; der Donnerstag traegt Tempo-Intervalle. */
    expect(arten).toEqual(['lang', 'rumpf', 'ruhe', 'z2', 'rumpf', 'intervalle', 'locker']);
  });

  it('nennt den Intervalltag Intervalle und den Testtag Test', () => {
    /* Woche 4 ist Testwoche, Woche 5 traegt Intervalle - beide am Donnerstag,
       beide vom Typ 'interval'. Am Typ allein waeren sie nicht zu trennen. */
    const test = W.testDateFor(plan, 4, start);
    expect(artAm(test)).toBe('test');
    expect(artAm(W.addDays(test, 7))).toBe('intervalle');
  });

  it('laesst einen Tag vor Planbeginn nicht ohne Art durchlaufen', () => {
    const info = buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(start, -3), start);
    expect(info.vorStart).toBe(true);
    expect(EINHEITSARTEN[info.art]).toBeTruthy();
  });

  it('kennt zu jeder Art des Plans ein Zeichen', () => {
    for(let d = 0; d < 18 * 7; d++){
      expect(EINHEITSARTEN[artAm(W.addDays(start, d))]).toBeTruthy();
    }
  });
});

describe('Einheitsart einer Aufzeichnung', () => {
  it('trennt Rad, Kraft und alles Uebrige', () => {
    expect(artDerAktivitaet(fahrt({}))).toBe('z2');
    expect(artDerAktivitaet({ type:'WeightTraining', moving_time: 1800 })).toBe('rumpf');
    expect(artDerAktivitaet({ type:'Swim', moving_time: 1800 })).toBe('sonstige');
    expect(artDerAktivitaet(null)).toBe('sonstige');
  });

  it('nennt eine Fahrt ab zwei Stunden die lange Ausfahrt', () => {
    expect(artDerAktivitaet(fahrt({ moving_time: 119 * 60 }))).toBe('z2');
    expect(artDerAktivitaet(fahrt({ moving_time: 120 * 60 }))).toBe('lang');
  });

  it('erkennt den Intervalltag am Anteil oberhalb Z2', () => {
    /* 75 min: 20 in Z1, 35 in Z2, 20 hart - ein knappes Viertel. */
    const hart = fahrt({ moving_time: 75 * 60,
      icu_hr_zone_times: [1200, 2100, 900, 300, 0] });
    const locker = fahrt({ moving_time: 75 * 60,
      icu_hr_zone_times: [1200, 3000, 300, 0, 0] });
    expect(artDerAktivitaet(hart)).toBe('intervalle');
    expect(artDerAktivitaet(locker)).toBe('z2');
  });

  it('laesst die lange Ausfahrt mit Z3-Bloecken eine Ausfahrt bleiben', () => {
    /* 150 min mit 3 x 10 min in Z3 - ueber der Schwelle fuer "hart", aber
       kein Intervalltag: die Bloecke stecken in einer langen Fahrt. */
    const samstag = fahrt({ moving_time: 150 * 60,
      icu_hr_zone_times: [1800, 5400, 1800, 0, 0] });
    expect(artDerAktivitaet(samstag)).toBe('lang');
  });

  it('faellt ohne Zonenzeiten auf die Grundlagenfahrt zurueck', () => {
    expect(artDerAktivitaet(fahrt({ icu_hr_zone_times: null }))).toBe('z2');
    expect(artDerAktivitaet(fahrt({ icu_hr_zone_times: [0, 0, 0] }))).toBe('z2');
  });
});

/* Das Sprungziel der Tageskarte.

   Der Knopf unter einer Einheit springt dorthin, wo ihre Uhr steht. Rumpf und
   Beinblock liegen beide im Trainingsbereich, der Bereich allein genuegt
   deshalb nicht - ohne den Baustein landete der Sprung dort, wo man zuletzt
   war. Aufgefallen ist das erst, als der Beinblock auf den Dienstag und der
   Zirkel auf den Mittwoch fiel: "Beinblock öffnen" fuehrte in den Rumpf,
   "Rumpf-Timer öffnen" am Tag darauf in die Beine. */
describe('Sprungziel der Tageskarte', () => {
  const einheitenAm = d => buildDayInfo(plan, Z.NO_THRESHOLDS, d, start).einheiten || [];

  /* Alle Einheiten des ganzen Plans, Tag fuer Tag. */
  function alle(){
    const liste = [];
    for(let d = 0; d < 18 * 7; d++){
      const tag = W.addDays(start, d);
      einheitenAm(tag).forEach(e => liste.push({ tag, e }));
    }
    return liste;
  }

  it('nennt bei jedem Sprung in den Trainingsbereich auch den Baustein', () => {
    const ohne = alle()
      .filter(x => x.e.timer && x.e.timer.ziel === 'training' && !x.e.timer.baustein)
      .map(x => x.e.titel);
    expect(ohne).toEqual([]);
  });

  it('schickt den Beinblock in die Beine und den Zirkel in den Rumpf', () => {
    const beine = alle().filter(x => x.e.titel === 'Beinblock');
    const rumpf = alle().filter(x => /^Rumpf/.test(x.e.titel));
    expect(beine.length).toBeGreaterThan(0);
    expect(rumpf.length).toBeGreaterThan(0);
    beine.forEach(x => expect(x.e.timer.baustein).toBe('leg'));
    rumpf.forEach(x => expect(x.e.timer.baustein).toBe('core'));
  });

  /* Der Fall, der den Fehler sichtbar gemacht hat: ein Tag mit Beinblock und
     ohne Zirkel. Solange beide auf denselben Tag fielen, war das falsche Ziel
     nur ein Segment daneben. */
  it('kennt Tage, an denen der Beinblock allein steht', () => {
    const allein = alle().filter(x => x.e.titel === 'Beinblock')
      .filter(x => !einheitenAm(x.tag).some(e => /^Rumpf/.test(e.titel)));
    expect(allein.length).toBeGreaterThan(0);
    allein.forEach(x => expect(x.e.timer.baustein).toBe('leg'));
  });
});
