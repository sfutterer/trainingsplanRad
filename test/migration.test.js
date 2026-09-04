/* Die Migration eines gespeicherten Plans.

   Sie ist der einzige Weg, auf dem ein eigener Plan einen Schemawechsel
   ueberlebt. Ohne sie wird er beim naechsten Start abgelehnt, die App zeigt
   den Fehlerbildschirm, und der einzige Weg zurueck ist "auf Default
   zuruecksetzen" - also ihn wegwerfen.

   Geprueft wird gegen die echte Fassung 2, wie sie bis zum 04.09.2026
   ausgeliefert wurde: test/plan-v2.json ist der letzte Stand vor dem Umbau.
   Das ist die Datei, die in den Sicherungen der Nutzer liegt.

   Der Nachweis laeuft ueber die Zahlen und nicht ueber die Form: fuer jede
   Woche und jeden Tag muss nach der Migration derselbe Wert herauskommen wie
   vorher. Ein Feld, das die Migration vergisst, faellt damit auf, auch wenn
   die Datei danach gueltig aussieht. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { migriere, migriere2zu3 } from '../src/domain/migration.js';
import { planValidate, PLAN_SCHEMA_VERSION } from '../src/domain/schema.js';
import { createPlan } from '../src/domain/plan.js';
import { loadPlan } from '../src/data/planSource.js';
import * as W from '../src/domain/week.js';
import * as C from '../src/domain/core.js';
import * as D from '../src/domain/day.js';

const v2 = JSON.parse(fs.readFileSync(new URL('./plan-v2.json', import.meta.url), 'utf8'));
const v3 = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));

describe('Fassung 2 auf 3', () => {
  const gehoben = migriere(structuredClone(v2));

  it('hebt die Schemafassung', () => {
    expect(v2.schemaVersion).toBe(2);
    expect(gehoben.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
  });

  it('erzeugt einen Plan, den die Pruefung annimmt', () => {
    expect(planValidate(gehoben)).toEqual([]);
  });

  /* Der schaerfste Nachweis: die ausgelieferte Datei IST das Ergebnis der
     Migration. Sie wurde damit erzeugt, und dieser Test haelt fest, dass das
     so bleibt - eine Migration, die sich von der Datei entfernt, waere
     genau die stille Abweichung, die niemand bemerkt. */
  it('liefert die ausgelieferte plan.json', () => {
    expect(gehoben).toEqual(v3);
  });

  it('laesst alles ausserhalb der Wochen unberuehrt', () => {
    for(const k of ['planName', 'recoveryWeeks', 'weeklyVolumeCapPercent', 'phaseNames',
                    'heartRateZones', 'powerZones', 'cadenceTargets', 'speedEstimate',
                    'saturdayRide', 'fridayOptional', 'intervalTimer', 'thresholdTest',
                    'testTaper', 'coreCircuit', 'legBlock', 'mobilityFlow', 'coordination',
                    'boneStimulus', 'texts']){
      expect(gehoben[k]).toEqual(v2[k]);
    }
  });
});

/* Jede Zahl, die vorher an einem Wochentag hing, haengt nachher am selben Tag.
   Verglichen wird ueber die Zugriffe der App, nicht ueber die Feldnamen. */
describe('Die Zahlen bleiben', () => {
  const plan = createPlan(migriere(structuredClone(v2)));
  const start = W.dayFromIso('2026-08-15');

  it('Wochenumfaenge und Deckel', () => {
    for(let w = 1; w <= v2.weeks.length; w++){
      const alt = v2.weeks[w - 1];
      const soll = alt.tuesdayMinutes + alt.wednesdayMinutes
        + (alt.thursday.variante
            ? D.schritteMinuten(alt.thursday.variante.steps)
            : D.thursdayPlan(plan, w).minutes)
        + alt.saturdayMinutes + alt.sundayOptionalMinutes;
      expect(D.weekPlanMinutes(plan, w)).toBe(soll);
    }
  });

  it('Zirkel und Beinblock je Woche', () => {
    for(let w = 1; w <= v2.weeks.length; w++){
      const alt = v2.weeks[w - 1];
      expect(C.coreWorkSeconds(plan, w)).toBe(alt.coreWorkSeconds);
      expect(C.coreRestSeconds(plan, w)).toBe(alt.coreRestSeconds);
      expect(C.coreRounds(plan, w)).toBe(alt.coreRounds);
      expect(C.legRounds(plan, w)).toBe(alt.legRounds);
      expect(C.tuesdayLegRounds(plan, w)).toBe(alt.tuesdayLegRounds || 0);
    }
  });

  it('Donnerstag, Samstagsbloecke und Mittwochsreiz', () => {
    for(let w = 1; w <= v2.weeks.length; w++){
      const alt = v2.weeks[w - 1];
      expect(W.thursdayData(plan, w)).toEqual(alt.thursday);
      expect(W.saturdayBlockData(plan, w))
        .toEqual(W.isRecoveryWeek(plan, w) ? null : (alt.saturdayBlocks || null));
      expect(plan.weeks[w - 1].tage.mi.extra).toEqual(alt.wednesdayExtra ?? null);
    }
  });

  /* Der Winterblock nennt die Tage, die er aendert. Die Samstagsdauer stand in
     Fassung 2 nicht bei ihm, sondern kam aus der letzten Planwoche - sie
     wandert deshalb als Zahl mit hinein und muss genau diese sein. */
  it('Winterblock', () => {
    const letzte = v2.weeks[v2.weeks.length - 1];
    const nachDemPlan = v2.weeks.length + 2;
    expect(W.isWinterBlock(plan, nachDemPlan)).toBe(true);
    expect(W.thursdayData(plan, nachDemPlan)).toEqual(v2.winterBlock.thursday);
    expect(W.saturdayBlockData(plan, nachDemPlan)).toBe(v2.winterBlock.saturdayBlocks);
    expect(W.tagDaten(plan, nachDemPlan, 'sa').minutes).toBe(letzte.saturdayMinutes);
    /* Die uebrigen Tage erbt er weiter von der letzten Planwoche. */
    expect(W.tagDaten(plan, nachDemPlan, 'di').minutes).toBe(letzte.tuesdayMinutes);
    expect(W.tagDaten(plan, nachDemPlan, 'so').legRounds).toBe(letzte.legRounds);
  });

  /* Der Beweis ueber alles auf einmal: die Tageskarten aus dem migrierten Plan
     sind dieselben wie die aus der ausgelieferten Datei. */
  it('erzeugt dieselben Tageskarten wie die ausgelieferte Datei', () => {
    const aus = createPlan(v3);
    for(let d = 0; d < 18 * 7; d++){
      const date = W.addDays(start, d);
      const a = D.buildDayInfo(plan, { ftp:null, lthr:null, hrmax:null }, date, start);
      const b = D.buildDayInfo(aus,  { ftp:null, lthr:null, hrmax:null }, date, start);
      expect(a).toEqual(b);
    }
  });
});

describe('Was die Migration nicht anfasst', () => {
  /* Eine Fassung, fuer die es keinen Schritt gibt, geht unveraendert weiter in
     die Pruefung. Sie dort mit einer Zahl abzulehnen ist ehrlicher, als
     Felder zu raten. */
  it('laesst eine unbekannte Fassung stehen', () => {
    const k = { schemaVersion: 1, weeks: [] };
    expect(migriere(k)).toBe(k);
  });

  it('laesst eine zu neue Fassung stehen', () => {
    const k = { schemaVersion: 99, weeks: [] };
    expect(migriere(k)).toBe(k);
  });

  it('laesst die aktuelle Fassung stehen', () => {
    expect(migriere(v3)).toBe(v3);
  });

  it('stolpert nicht ueber Unfug', () => {
    expect(migriere(null)).toBe(null);
    expect(migriere('kein Plan')).toBe('kein Plan');
    expect(migriere([])).toEqual([]);
  });
});

/* Ein zweiter Lauf darf nichts mehr tun. Sonst wuerde ein Plan, der einmal
   gehoben und gespeichert wurde, bei jedem Start erneut umgeschrieben - und
   ein Fehler darin bliebe unbemerkt, weil er sich selbst reproduziert. */
describe('Zweimal migrieren', () => {
  it('aendert beim zweiten Mal nichts', () => {
    const einmal = migriere(structuredClone(v2));
    expect(migriere(structuredClone(einmal))).toEqual(einmal);
  });

  it('migriere2zu3 laesst die Eingabe unangetastet', () => {
    const k = structuredClone(v2);
    const kopie = structuredClone(k);
    migriere2zu3(k);
    expect(k).toEqual(kopie);
  });
});

/* ---- Der Weg, auf dem ein alter Plan wirklich ankommt ----

   Er liegt als Zeichenkette im Speicher des Geraets oder in einer Sicherung
   und laeuft beim Start durch loadPlan. Das ist die Stelle, an der die
   Migration greifen muss - nicht der direkte Aufruf, den nur der Test kennt.

   Bis hierher hatte loadPlan keinen Test. Das faellt genau dann auf, wenn es
   darauf ankommt: bei einem Schemawechsel. */
describe('loadPlan mit einem gespeicherten Plan der Fassung 2', () => {
  const repos = json => ({ planOverride: async () => json });

  it('hebt ihn und liefert die neue Fassung zurueck', async () => {
    const r = await loadPlan(repos(structuredClone(v2)));
    expect(r.source).toBe('override');
    expect(r.json.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
    /* Nicht die eingelesene Fassung: der Export soll die Datei liefern, mit
       der die App rechnet. */
    expect(r.json).toEqual(v3);
    expect(r.plan.weekCount).toBe(v2.weeks.length);
  });

  it('rechnet danach mit denselben Zahlen wie der ausgelieferte Plan', async () => {
    const r = await loadPlan(repos(structuredClone(v2)));
    for(let w = 1; w <= v2.weeks.length; w++){
      expect(D.weekPlanMinutes(r.plan, w)).toBe(D.weekPlanMinutes(createPlan(v3), w));
    }
  });

  /* Ein Plan, den auch die Migration nicht rettet, fuehrt weiterhin zum
     Fehlerbildschirm mit der Marke istEigener - nicht zu Ersatzwerten. */
  it('lehnt einen kaputten eigenen Plan weiterhin ab', async () => {
    const kaputt = structuredClone(v2);
    delete kaputt.weeks[3].thursday;
    await expect(loadPlan(repos(kaputt))).rejects.toMatchObject({ istEigener: true });
  });

  /* Ohne eigenen Plan wird die Datei aus dem Repo geholt. Auch sie laeuft
     durch die Migration - ein Repo, das noch die alte Fassung ausliefert,
     waere sonst der einzige Weg, die App zu blockieren. */
  it('migriert auch die Datei aus dem Repo', async () => {
    const fetchImpl = async () => ({ ok:true, json: async () => structuredClone(v2) });
    const r = await loadPlan({ planOverride: async () => null }, fetchImpl);
    expect(r.source).toBe('default');
    expect(r.json).toEqual(v3);
  });
});

/* ---- Wird einmal gehoben oder bei jedem Start? ----

   loadPlan meldet mit `gehoben`, ob die Migration etwas getan hat. boot()
   schreibt die gehobene Datei daraufhin einmal zurueck. Ohne diese Meldung
   laege im Speicher dauerhaft die alte Fassung - eine Migration, die nie
   fertig wird, ist eine, die man nicht mehr entfernen kann. */
describe('gehoben', () => {
  const repos = json => ({ planOverride: async () => json });

  it('meldet true fuer einen Plan der Fassung 2', async () => {
    expect((await loadPlan(repos(structuredClone(v2)))).gehoben).toBe(true);
  });

  it('meldet false fuer einen Plan, der schon die aktuelle Fassung hat', async () => {
    expect((await loadPlan(repos(structuredClone(v3)))).gehoben).toBe(false);
  });
});
