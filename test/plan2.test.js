/* Plan 2 (ab 07.12.2026) - Woche Montag bis Sonntag, Tage als Einheiten.

   Gebaut gegen die ausgelieferte plan.json und den echten Planbeginn von
   Plan 1 (15.08.2026): genau so, wie die App beide Plaene sieht. Geprueft
   wird, dass der Wechsel am richtigen Tag passiert, dass die Wochen am
   Montag beginnen, und dass die Zahlen der Wochentabelle aus Abschnitt 5 des
   Trainingsplans 2 ankommen. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan, schritteAusrollen } from '../src/domain/plan.js';
import { planValidate } from '../src/domain/schema.js';
import * as W from '../src/domain/week.js';
import * as D from '../src/domain/day.js';
import * as K from '../src/domain/kraft.js';
import { intervalDefaults } from '../src/domain/timer/sequences.js';
import { buildReport, weekTotals } from '../src/domain/analysis.js';
import { testTermine, testZiel } from '../src/domain/test.js';
import { wellnessMassnahmen } from '../src/domain/wellness.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const p2 = plan.folge;
const START = W.dayFromIso('2026-08-15');
const TH = { ftp: 223, lthr: 166, hrmax: 180 };
const tag = iso => W.dayFromIso(iso);
const info = iso => D.buildDayInfo(plan, TH, tag(iso), START, {});

describe('Die Datei', () => {
  it('besteht die Pruefung mit beiden Plaenen', () => {
    expect(planValidate(json)).toEqual([]);
  });

  it('meldet einen Beginn, der kein Montag ist', () => {
    const k = structuredClone(json);
    k.folgeplan.start = '2026-12-05';
    expect(planValidate(k).join(' ')).toContain('Montag');
  });

  it('meldet einen fehlenden Wochentag und eine unbekannte Einheit', () => {
    const k = structuredClone(json);
    delete k.folgeplan.weeks[0].tage.sa;
    k.folgeplan.weeks[1].tage.mo = [{ kind: 'yoga' }];
    const e = planValidate(k).join(' ');
    expect(e).toContain('tage.sa fehlt');
    expect(e).toContain('"yoga"');
  });

  it('meldet ein Video, das keine YouTube-Kennung ist', () => {
    const k = structuredClone(json);
    k.coreCircuit.exercises[0].video = 'assets/DeadBug.webp';
    expect(planValidate(k).join(' ')).toContain('YouTube');
  });

  it('nimmt einen alten eigenen Plan mit Bildern weiter an', () => {
    const k = structuredClone(json);
    const ex = k.mobilityFlow.exercises[0];
    delete ex.video;
    ex.image = 'assets/TiefeKniebeuge.webp';
    expect(planValidate(k)).toEqual([]);
    expect(createPlan(k).mobility.exercises[0].img).toBe('assets/TiefeKniebeuge.webp');
  });

  it('traegt fuer jede Uebung ein Video', () => {
    const alle = [...plan.circuit.exercises, ...plan.legs.exercises, ...plan.mobility.exercises,
                  ...plan.coordination.exercises, ...p2.circuit.exercises, ...p2.kraft.uebungen];
    for(const ex of alle) expect(ex.img).toMatch(/^[A-Za-z0-9_-]{11}$/);
  });
});

describe('Welcher Plan gilt', () => {
  it('Plan 1 bis zum 04.12., Plan 2 ab dem 05.12.', () => {
    expect(W.planAm(plan, tag('2026-12-04'), START).plan.kennung).toBe('p1');
    expect(W.planAm(plan, tag('2026-12-05'), START).plan.kennung).toBe('p2');
    expect(W.planAm(p2, tag('2026-11-20'), START).plan.kennung).toBe('p1');
  });

  it('zaehlt die Wochen von Plan 2 ab Montag, 07.12.2026', () => {
    expect(W.wocheAm(plan, tag('2026-12-07'), START)).toBe(1);
    expect(W.wocheAm(plan, tag('2026-12-13'), START)).toBe(1);
    expect(W.wocheAm(plan, tag('2026-12-14'), START)).toBe(2);
    expect(W.wocheAm(plan, tag('2027-02-28'), START)).toBe(12);
    /* Die Trainingswoche beginnt am Montag und endet am Sonntag. */
    const tage = W.trainingWeekDays(tag('2026-12-10'), p2.start);
    expect(tage[0].getDay()).toBe(1);
    expect(tage[6].getDay()).toBe(0);
  });

  it('fuehrt das Uebergangswochenende als Woche 0', () => {
    const sa = info('2026-12-05'), so = info('2026-12-06');
    expect(sa.planKennung).toBe('p2');
    expect(sa.week).toBe(0);
    expect(sa.vorStart).toBe(false);
    expect(sa.target).toEqual({ sport: 'rest' });
    expect(so.type).toBe('long');
    expect(so.target.minutes).toBe(150);
  });
});

describe('Die Woche', () => {
  const woche1 = ['2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10',
                  '2026-12-11', '2026-12-12', '2026-12-13'].map(info);

  it('traegt an jedem Tag die Einheiten aus Abschnitt 3', () => {
    const [mo, di, mi, don, fr, sa, so] = woche1;
    expect(mo.target).toEqual({ sport: 'kraft', kraft: 'oberkoerper' });
    expect(di.einheiten.map(e => e.titel)).toEqual(['Rad – Pendeln, direkte Strecke',
      'Rad – VO2max 4 × 4 min + 6 Sprints']);
    expect(di.einheiten[1].zeit).toBe('abends');
    expect(mi.target.sport).toBe('core');
    expect(mi.target.rideMinutes).toBe(40);
    expect(mi.target.rounds).toBe(2);
    expect(don.einheiten[0].titel).toBe('Rad – HFmax-Test');
    expect(don.target.kraft).toBe('beine');
    expect(fr.target.sport).toBe('optional');
    expect(sa.target.sport).toBe('rest');
    expect(so.type).toBe('long');
    expect(so.target.minutes).toBe(195);
  });

  it('zaehlt die Sprints nicht als Wiederholungen des Hauptteils', () => {
    const di = info('2026-12-15');
    expect(di.target.reps).toBe(5);
    expect(di.target.repMinutes).toBe(4);
    expect(di.target.band.text).toBe('250–259 W');
    expect(di.kennzahlen.find(k => k.label === 'Sprints').wert).toBe('6× 10 s');
    /* Pendeln und Abendeinheit zusammen - die Analyse rechnet die Fahrten
       eines Tages zusammen. */
    expect(di.target.minutes).toBe(40 + 77);
  });

  it('steigert die Schwelle laenger statt haerter', () => {
    const dauer = ['2026-12-17', '2026-12-31', '2027-01-07', '2027-01-28', '2027-02-18']
      .map(iso => { const t = info(iso).target; return t.reps + 'x' + t.repMinutes; });
    expect(dauer).toEqual(['3x12', '3x12', '3x15', '2x20', '2x25']);
    expect(info('2026-12-17').target.band.text).toBe('201–212 W');
  });

  it('zeigt Hoehenmeter und Verpflegung an der langen Fahrt', () => {
    const so = info('2027-01-10');
    expect(so.kennzahlen.find(k => k.label === 'Höhenmeter').wert).toBe('650–750 hm');
    expect(so.kennzahlen.find(k => k.label === 'Verpflegung').wert).toContain('70 g KH');
  });

  it('nimmt die Wochensumme aus der Tabelle und rechnet den Deckel darauf', () => {
    const soll = [390, 428, 340, 443, 467, 365, 472, 482, 330, 492, 512, 400];
    soll.forEach((m, i) => {
      expect(D.weekPlanMinutes(p2, i + 1)).toBe(m);
      expect(D.weekCapMinutes(p2, i + 1)).toBe(Math.round(m * 1.1));
    });
  });

  it('kennt die Erholungswochen 3, 6, 9, 12 und die Testwochen', () => {
    expect([1, 2, 3, 6, 9, 12, 15].map(w => W.isRecoveryWeek(p2, w)))
      .toEqual([false, false, true, true, true, true, true]);
    expect(W.testWeeks(p2)).toEqual([9, 18, 27, 39]);
    expect(W.isoDayLocal(W.testDateFor(p2, 9, START))).toBe('2027-02-04');
  });

  it('fuehrt die Testwoche wie Abschnitt 4', () => {
    const mo = info('2027-02-01'), di = info('2027-02-02'), mi = info('2027-02-03'),
          don = info('2027-02-04'), fr = info('2027-02-05');
    expect(mo.target.sport).toBe('core');
    expect(di.einheiten.length).toBe(1);
    expect(mi.einheiten[0].titel).toBe('Rad – Pendeln mit Öffnern');
    expect(mi.showTimerBtn).toBeFalsy();
    expect(don.art).toBe('test');
    expect(don.target.test).toBe(true);
    expect(don.target.kraft).toBeUndefined();
    expect(don.checkliste.punkte.length).toBeGreaterThan(0);
    expect(fr.target).toEqual({ sport: 'rest' });
  });

  it('setzt das Wellness-Gate an beide Qualitaetstage, die Vorschau davor', () => {
    const rollen = ['2026-12-14', '2026-12-15', '2026-12-16', '2026-12-17', '2026-12-18']
      .map(iso => (info(iso).wellness || {}).rolle || null);
    expect(rollen).toEqual(['vorschau', 'entscheidung', 'vorschau', 'entscheidung', null]);
    expect(wellnessMassnahmen('qualitaet', false)[0]).toContain('60 min Z2');
  });

  it('zeigt nach Block 1 die Form der Wochen 11/12/9 und sagt das', () => {
    const b = info('2027-03-02');           // Woche 13, Dienstag
    const e = info('2027-03-16');           // Woche 15, Erholungswoche
    const t = info('2027-04-08');           // Woche 18, Testtag
    expect(b.week).toBe(13);
    expect(b.target.reps).toBe(5);
    expect(b.tagHinweise.join(' ')).toContain('noch nicht ausgearbeitet');
    expect(e.recovery).toBe(true);
    expect(e.target.reps).toBe(3);
    expect(t.art).toBe('test');
    expect(W.phaseOf(p2, 13)).toBe(2);
    expect(W.phaseName(p2, 25)).toBe('Spezifisch');
  });
});

describe('Schrittgruppen', () => {
  it('rollt Wiederholungen aus, ohne nach dem letzten Durchgang zu pausieren', () => {
    const s = schritteAusrollen([{ wiederhole: 3,
      steps: [{ type: 'work', label: 'Sprint', seconds: 10, zone: 'z5' }],
      zwischen: [{ type: 'rest', label: 'Locker', minutes: 3, zone: 'z1' }] }]);
    expect(s.map(x => x.type)).toEqual(['work', 'rest', 'work', 'rest', 'work']);
    expect(s[2].label).toBe('Sprint 2 / 3');
    expect(s[2].rep).toBe(2);
    expect(s[2].reps).toBe(3);
  });

  it('zaehlt verschachtelte Serien je Serie und laesst die Serienpause ungezaehlt', () => {
    const s = schritteAusrollen([{ wiederhole: 2,
      steps: [{ wiederhole: 3, steps: [{ type: 'work', label: 'Hart', seconds: 30, zone: 'z5' }],
                zwischen: [{ type: 'rest', label: 'Locker', seconds: 15, zone: 'z1' }] }],
      zwischen: [{ type: 'rest', label: 'Serienpause', minutes: 3, zone: 'z1' }] }]);
    expect(s.length).toBe(5 + 1 + 5);
    expect(s[5].label).toBe('Serienpause');
    expect(s[5].rep).toBeUndefined();
    expect(s[6].label).toBe('Hart 1 / 3');
  });
});

describe('Intervalltimer', () => {
  it('zaehlt am Dienstag die VO2max-Einheit und am Mittwoch die naechste, die Schwelle', () => {
    const di = intervalDefaults(p2, 2, START, tag('2026-12-15'), {});
    const mi = intervalDefaults(p2, 2, START, tag('2026-12-16'), {});
    expect(di.mode).toBe('steps');
    expect(di.feste.title).toContain('VO2max');
    expect(mi.feste.title).toContain('Schwelle');
  });

  it('fuehrt am Testtag in den Testbereich', () => {
    expect(intervalDefaults(p2, 9, START, tag('2027-02-04'), {}).mode).toBe('test');
  });
});

describe('Kraft', () => {
  it('dosiert die Beine nach Kraftphase und Erholungswoche', () => {
    const k1 = K.kraftDosis(p2, 2, 'beine');
    const k2 = K.kraftDosis(p2, 5, 'beine');
    const e = K.kraftDosis(p2, 6, 'beine');
    expect(k1.phase).toBe('K1');
    expect(k1.gruppen[0].uebungen[0].wdh).toBe('8–10');
    expect(k2.phase).toBe('K2');
    expect(k2.gruppen[0].uebungen[0].wdh).toBe('6–8');
    expect(k2.gruppen[0].uebungen[0].saetzeText).toBe('3–4');
    expect(e.gruppen.map(g => g.runden)).toEqual([2, 2, 2, 2]);
    expect(K.kraftAblauf(k1).length).toBe(12);
  });

  it('laeuft Supersaetze Paar fuer Paar, mit Pause nach dem Paar', () => {
    const d = K.kraftDosis(p2, 1, 'oberkoerper');
    const a = K.kraftAblauf(d);
    expect(a.slice(0, 4).map(x => x.key + x.satz)).toEqual(
      ['unterarmstuetz1', 'klimmzug1', 'unterarmstuetz2', 'klimmzug2']);
    expect(a[0].pauseNach).toBe(0);
    expect(a[1].pauseNach).toBe(75);
    expect(a.filter(x => x.key === 'koffertragen').length).toBe(2);
    expect(a[a.length - 1].pauseNach).toBe(0);
    expect(K.satzZiel(a[0])).toBe('20–40 s');
    expect(K.satzZiel(a[1])).toBe('3–5 Wdh.');
  });

  it('kennt die Stufenleitern mit der leichtesten Stufe als Voreinstellung', () => {
    expect(K.stufeText(p2, 'liegestuetz', {}).text).toBe('Hände auf der Arbeitsplatte');
    expect(K.stufeText(p2, 'klimmzug', { klimmzug: 2 }).text).toBe('Frei');
    expect(K.stufeText(p2, 'klimmzug', { klimmzug: 9 }).index).toBe(2);
  });

  it('schlaegt das letzte Gewicht einer Uebung vor', () => {
    const log = [
      { kind: 'kraft', day: '2026-12-10', saetze: [{ uebung: 'rdl', satz: 1, wert: 10, gewicht: 10 }] },
      { kind: 'kraft', day: '2026-12-17', saetze: [{ uebung: 'rdl', satz: 3, wert: 10, gewicht: 12 }] }
    ];
    expect(K.letztesGewicht(log, 'rdl', '2026-12-24')).toBe(12);
    expect(K.letztesGewicht(log, 'rdl', '2026-12-17')).toBe(10);
  });
});

describe('Testtermine und Analyse ueber die Plangrenze', () => {
  it('kennt alle sieben Termine', () => {
    expect(testTermine(plan, START).map(t => W.isoDayLocal(t.datum))).toEqual([
      '2026-09-10', '2026-10-22', '2026-12-03',
      '2027-02-04', '2027-04-08', '2027-06-10', '2027-09-02']);
  });

  it('trennt die Wochensummen nach Plan', () => {
    const rows = buildReport(plan, TH, START, tag('2026-11-28'), tag('2026-12-13'), [], null, []);
    const w = weekTotals(rows, plan);
    expect(w.map(x => x.plan + ':' + x.week)).toEqual(['p1:16', 'p2:0', 'p2:1']);
    const w1 = w.find(x => x.plan === 'p2' && x.week === 1);
    expect(w1.planMin).toBe(390);
    expect(w1.capMin).toBe(429);
    expect(w1.vollstaendig).toBe(true);
  });

  it('bewertet einen Krafttag aus dem Protokoll des Kraft-Timers', () => {
    const log = [{ kind: 'kraft', id: 'kraft-oberkoerper-2026-12-07', day: '2026-12-07',
                   programm: 'oberkoerper', geplanteSaetze: 20,
                   saetze: Array.from({ length: 20 }, (_, i) => ({ uebung: 'x', satz: i, wert: 8 })) }];
    const [row] = buildReport(plan, TH, START, tag('2026-12-07'), tag('2026-12-07'), [], null, log);
    expect(row.status).toBe('ok');
    expect(row.notes.map(n => n.text).join(' ')).toContain('alle 20 Sätze');
    const [leer] = buildReport(plan, TH, START, tag('2026-12-14'), tag('2026-12-14'), [], null, []);
    expect(leer.status).toBe('dev');
  });
});

describe('Pacing ohne Tempotest (Fassung 13)', () => {
  it('nimmt den Ø-Wert des letzten Tests, solange nichts notiert ist', () => {
    const vortest = { day: '2026-10-22', w20: 234.7 };
    const z = testZiel(null, { ftp: 223 }, vortest);
    expect(z.watt).toBe(235);
    expect(z.quelle).toBe('vortest');
    expect(z.vortestTag).toBe('2026-10-22');
    const n = testZiel({ zielWatt: 240 }, { ftp: 223 }, vortest);
    expect(n.watt).toBe(240);
    expect(n.quelle).toBe('notiert');
    expect(testZiel(null, { ftp: 223 }, null)).toBe(null);
  });
});
