/* Was an einem Tag ansteht - als Text fuer die Anzeige und als Zahlen fuer die
   Auswertung.

   Beides entsteht hier nebeneinander, damit der Abgleich mit intervals.icu
   keinen Fliesstext parsen muss. Die Fachtexte kommen aus plan.json; nur die
   Satzgerueste mit eingerechneten Zahlen stehen hier - sie in die Datei zu
   heben haette eine Vorlagensprache gebraucht und damit JavaScript nachgebaut.

   Die Beschreibung entsteht seit dem Kalenderumbau doppelt: `detail` als ein
   Satzband, wie es die erste Fassung geschrieben hat, und daneben
   `kennzahlen` / `bloecke` / `zusatz` / `hinweise` als Struktur. Die Anzeige
   liest die Struktur, `detail` bleibt Wort fuer Wort stehen. Der naheliegende
   Weg - `detail` durch die Struktur ersetzen - haette den einzigen
   Regressionsschutz des Projekts entwertet: test/domain.test.js bildet
   Pruefsummen ueber genau diese Saetze, ueber 18 Wochen und beide
   Zonenmodelle. Solange beides nebeneinander steht, faellt jede ungewollte
   Aenderung an den Zahlen weiterhin auf.

   `bloecke` ist bewusst eine flache Liste benannter Abschnitte und keine feste
   Form aus Aufwaermen / Belastung / Ausfahren. Die spaeteren Wochen bringen
   VO2max-Serien, Schwellenbloecke ueber 10 bis 12 Minuten, Z3-Bloecke
   innerhalb der langen Ausfahrt und den Schwellentest mit zwoelf Schritten
   mit; eine Liste traegt alle davon, eine feste Form haette fuer jeden Fall
   ein eigenes Feld gebraucht. */

import {
  weekNumberFor, weekIndex, phaseOf, isRecoveryWeek, isWinterBlock,
  thursdayData, saturdayBlockData, dayOffset
} from './week.js';
import {
  zoneText, zoneSpan, targetText, withCadence, wattText,
  distanceSuffix, estimateDistance, showsDistance, cadenceText
} from './zones.js';
import { coreWorkSeconds, coreRestSeconds, coreRounds, coreMinutes, legRounds } from './core.js';

/* Der Donnerstag je Woche. Die Wiederholungsformel aus Fassung 1 ist entfallen;
   massgeblich ist die Tabelle in plan.json. Die Gesamtdauer wird gerechnet,
   nicht gepflegt - sonst laufen zwei Zahlen auseinander. */
export function thursdayPlan(plan, week){
  const t = thursdayData(plan, week);
  const phase = phaseOf(plan, week);

  if(t.kind === 'test'){
    return { kind:'test', week, phase, minutes: t.minutes, title: t.title, zone: t.zone };
  }
  if(t.kind === 'z2'){
    return { kind:'z2', phase, zone: t.zone, minutes: t.minutes, title: t.title };
  }
  return {
    kind:'intervals', phase, zone: t.zone,
    reps: t.reps, workMin: t.workMinutes, restMin: t.restMinutes,
    title: t.title,
    power: t.power == null ? null : t.power,
    minutes: plan.interval.warmupMinutes + t.reps * t.workMinutes +
             (t.reps - 1) * t.restMinutes + plan.interval.cooldownMinutes
  };
}

export function saturdayBlocks(plan, week){
  const b = saturdayBlockData(plan, week);
  if(!b) return null;
  return { reps: b.reps, minutes: b.minutes, restMinutes: b.restMinutes,
           hardMinutes: b.reps * b.minutes };
}

/* ---- Bausteine der strukturierten Beschreibung ---- */

/* Die Eckwerte einer Radeinheit in immer derselben Reihenfolge: zuerst, was
   man vor dem Losfahren wissen muss, dann was nur eine Schaetzung ist. */
function rideKennzahlen(plan, th, week, minutes, zone){
  const out = [
    { label:'Dauer',    wert: minutes + ' min' },
    { label:'Zielzone', wert: targetText(plan, th, zone, week) }
  ];
  const cad = cadenceText(plan, zone, week);
  if(cad) out.push({ label:'Trittfrequenz', wert: cad });
  if(showsDistance(plan, week)){
    out.push({ label:'Distanz', wert:'ca. ' + estimateDistance(plan, minutes, week) + ' km' });
  }
  return out;
}

function circuitBlock(plan, week, rounds, label, nachsatz){
  const ex = plan.circuit.exercises.length;
  return {
    label,
    wert: `${rounds} Runden à ${ex} Übungen · ca. ${coreMinutes(plan, week, rounds)} min`,
    hinweis: `${coreWorkSeconds(plan, week)} s Belastung / ${coreRestSeconds(plan, week)} s Pause.` +
             (nachsatz ? ' ' + nachsatz : '')
  };
}

/* Der Schwellentest steht in plan.json als Schrittliste fuer den Timer. Fuer
   die Anzeige werden die drei Oeffnungsintervalle wieder zu einer Zeile
   zusammengezogen - als sechs Einzelzeilen ist der Ablauf laenger als der Rest
   des Tages und verdeckt die beiden Schritte, auf die es ankommt. */
function testBloecke(plan, th, week){
  const steps = plan.thresholdTest?.steps ?? [];
  const out = [];
  let i = 0;
  while(i < steps.length){
    const s = steps[i];
    if(s.reps > 1){
      const gruppe = [];
      while(i < steps.length && steps[i].reps === s.reps){ gruppe.push(steps[i]); i += 1; }
      const arbeit = gruppe.find(g => g.type === 'work') || gruppe[0];
      const pause  = gruppe.find(g => g.type === 'rest');
      const hinweis = [
        pause ? `${pause.minutes} min locker (${testZone(plan, th, pause.zone, week)}) dazwischen.` : null,
        arbeit.note
      ].filter(Boolean).join(' ');
      out.push({
        label: `${s.reps}× ${ohneZaehler(arbeit.label)}`,
        wert: `${arbeit.minutes} min · ${testZone(plan, th, arbeit.zone, week)}`,
        hinweis: hinweis || undefined
      });
      continue;
    }
    out.push({
      label: s.label,
      wert: `${s.minutes} min · ${testZone(plan, th, s.zone, week)}`,
      hinweis: s.note || undefined
    });
    i += 1;
  }
  return out;
}

/* "Zügig 1 / 3" heisst in der zusammengezogenen Zeile nur noch "Zügig" - der
   Zaehler steht dann schon im Faktor davor. */
function ohneZaehler(label){
  return String(label).replace(/\s*\d+\s*\/\s*\d+\s*$/, '').trim();
}

/* Der Timer kennt die Sammelzone z12 fuer das Einfahren; die Baender kennen
   sie nicht. */
function testZone(plan, th, zone, week){
  if(zone === 'z12') return zoneSpan(plan, th, 'z1', 'z2', week);
  return zoneText(plan, th, zone, week);
}

/* Beweglichkeit und Koordination haengen an keiner Woche und an keiner Phase.

   "Jeder zweite Tag" laesst sich nicht als feste Wochentage schreiben: sieben
   ist ungerade, ein Zweitagestakt verschiebt sich also von Woche zu Woche.
   Deshalb wird ab dem Planbeginn durchgezaehlt - dieselbe Rechnung, aus der
   auch die Wochennummer entsteht. */
export function isCoordinationDay(plan, date, startDate){
  const n = plan.coordination?.everyNthDay;
  if(!(n > 0)) return false;
  const tage = dayOffset(date, startDate);
  return (((tage % n) + n) % n) === 0;
}

/* Defensiv gelesen: die beiden Bloecke sind spaeter in plan.json gekommen und
   koennen in einer aelteren Datei ganz fehlen. */
function zusatzBloecke(plan, date, startDate){
  const out = [];

  const mob = plan.mobility;
  const mobEx = mob?.exercises ?? [];
  if(mobEx.length){
    out.push({
      label:'Mobility-Flow',
      wert: mob.durationHint || (mobEx.length + ' Übungen'),
      hinweis:`Täglich, auch am Ruhetag. ${mobEx.length} Übungen.`
    });
  }

  const ko = plan.coordination;
  const koEx = ko?.exercises ?? [];
  if(koEx.length && isCoordinationDay(plan, date, startDate)){
    const n = ko.everyNthDay;
    out.push({
      label:'Koordination',
      wert: ko.durationHint || (koEx.length + ' Übungen'),
      hinweis:`${n === 2 ? 'Jeder zweite Tag' : 'Alle ' + n + ' Tage'}. ${koEx.length} Übungen.`
    });
  }

  return out;
}

export function buildDayInfo(plan, th, date, startDate){
  /* Vor dem Planbeginn klemmt weekNumberFor auf Woche 1 und liefert damit
     einen vollstaendigen Trainingstag fuer ein Datum, an dem der Plan noch
     gar nicht lief. In der alten Ansicht fiel das nie auf, weil sie nur
     sieben Tage ab heute zeigte; der Kalender laesst sich beliebig weit
     zurueckblaettern. Die Klemmung bleibt - alle uebrigen Felder haengen an
     einer gueltigen Wochennummer -, aber der Tag wird als solcher markiert
     und von der Anzeige neutral dargestellt. */
  const vorStart = weekNumberFor(date, startDate) < 1;
  const week = Math.max(weekNumberFor(date, startDate), 1);
  const idx = weekIndex(plan, week);
  const w = plan.weeks[idx];
  const phase = phaseOf(plan, week);
  const recovery = isRecoveryWeek(plan, week);
  const winter = isWinterBlock(plan, week);
  const T = plan.texts;
  const exCount = plan.circuit.exercises.length;
  const dow = date.getDay();

  const z2 = () => withCadence(plan, targetText(plan, th, 'z2', week), 'z2', week);

  let info;
  switch(dow){
    case 1:
      info = { type:'rest', title:'Ruhetag', detail:T.mondayRest };
      info.kennzahlen = [{ label:'Umfang', wert:'frei' }];
      info.bloecke = [];
      info.hinweise = [T.mondayRest];
      break;

    case 2: {
      const dur = w.tuesdayMinutes;
      info = { type:'ride', title:'Rad – Grundlagenausdauer (Z2)',
        detail:`${dur} min${distanceSuffix(plan, dur, week)} · ${z2()}. ${T.tuesdayCommute}` };
      info.kennzahlen = rideKennzahlen(plan, th, week, dur, 'z2');
      info.bloecke = [
        { label:'Grundlagenfahrt', wert:`${dur} min · ${z2()}`, hinweis:T.tuesdayCommute }
      ];
      break;
    }

    case 3: {
      const dur = w.wednesdayMinutes;
      const rounds = plan.circuit.wednesdayRounds;
      const rumpf = `Abends Rumpf-Zirkel verkürzt: ${rounds} Runden à ${exCount} Übungen ` +
        `(${coreWorkSeconds(plan, week)} s Belastung / ${coreRestSeconds(plan, week)} s Pause), ` +
        `ca. ${coreMinutes(plan, week, rounds)} min. Kein Beinblock.`;
      const zirkel = circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (verkürzt)',
        'Abends. Kein Beinblock.');
      if(dur > 0){
        const lockerer = phase === 3 ? T.wednesdayEasyPhase3 : T.wednesdayEasyDefault;
        info = { type:'ride', title:'Rad – kurzes Z2 (Arbeitsweg) + Rumpf',
          detail:`Mindestens ${dur} min direkte Strecke${distanceSuffix(plan, dur, week)} · ${z2()}. ` +
                 `${T.wednesdayMinimum} ${lockerer} ${rumpf}`,
          showTimerBtn:true };
        info.kennzahlen = rideKennzahlen(plan, th, week, dur, 'z2');
        /* Die Dauer ist eine Untergrenze, keine Vorgabe - das muss schon in der
           Kennzahl stehen und nicht erst im Hinweis darunter. */
        info.kennzahlen[0] = { label:'Dauer', wert:`mindestens ${dur} min` };
        info.bloecke = [
          { label:'Fahrt (Arbeitsweg)', wert:`mindestens ${dur} min direkte Strecke · ${z2()}`,
            hinweis:`${T.wednesdayMinimum} ${lockerer}` },
          zirkel
        ];
      } else {
        info = { type:'core', title:'Rumpf/Oberkörper-Stabilität',
          detail:`${T.wednesdayNoRide} ${rumpf}`, showTimerBtn:true };
        info.kennzahlen = [
          { label:'Dauer',  wert:'ca. ' + coreMinutes(plan, week, rounds) + ' min' },
          { label:'Umfang', wert:`${rounds} Runden à ${exCount} Übungen` },
          { label:'Takt',   wert:`${coreWorkSeconds(plan, week)} s / ${coreRestSeconds(plan, week)} s` }
        ];
        info.bloecke = [zirkel];
        info.hinweise = [T.wednesdayNoRide];
      }
      /* Das Wellness-Gate schon am Mittwoch, wie im Trainingsplan vorgesehen:
         wer erst Donnerstag frueh schaut, kann den Tag nur noch absagen. Die
         Art des Donnerstags haengt dran, weil sie entscheidet, was ein rotes
         Gate ueberhaupt bedeutet - ein Test wird verschoben, ein Intervalltag
         heruntergestuft, ein Z2-Tag gekuerzt. */
      info.wellness = { rolle:'vorschau', donnerstag: thursdayPlan(plan, week).kind };
      break;
    }

    case 4: {
      const t = thursdayPlan(plan, week);
      if(t.kind === 'test'){
        info = { type:'interval', title:t.title, detail:T.thursdayTest, showIntervalBtn:true };
        info.kennzahlen = [
          { label:'Dauer',      wert: t.minutes + ' min' },
          { label:'Testfenster', wert:'20 min gleichmäßig maximal' },
          { label:'Zielzone',   wert: targetText(plan, th, t.zone, week) }
        ];
        info.bloecke = testBloecke(plan, th, week);
        info.hinweise = [T.thursdayTest];
      } else if(t.kind === 'z2'){
        info = { type:'ride', title:t.title,
          detail:`${t.minutes} min${distanceSuffix(plan, t.minutes, week)} · ${z2()}. ${T.thursdayBaseDay}` };
        info.kennzahlen = rideKennzahlen(plan, th, week, t.minutes, 'z2');
        info.bloecke = [
          { label:'Grundlagenfahrt', wert:`${t.minutes} min · ${z2()}`, hinweis:T.thursdayBaseDay }
        ];
      } else {
        const zt = withCadence(plan, targetText(plan, th, t.zone, week), t.zone, week);
        const pw = t.power ? ` (${t.power})` : '';
        info = { type:'interval', title:t.title,
          detail:`Nach ${plan.interval.warmupMinutes} min Einfahren (${zoneSpan(plan, th, 'z1', 'z2', week)}): ` +
                 `${t.reps}× ${t.workMin} min ${zt}${pw}, je ${t.restMin} min locker (${zoneText(plan, th, 'z1', week)}) dazwischen. ` +
                 `Danach ${plan.interval.cooldownMinutes} min Ausrollen. Rollender Start, Bewertungsfenster ab Minute ${t.phase === 1 ? 3 : 2}. ` +
                 T.thursdayIntervalTail,
          showIntervalBtn:true };
        info.kennzahlen = [
          { label:'Dauer',           wert: t.minutes + ' min' },
          { label:'Wiederholungen',  wert:`${t.reps} × ${t.workMin} min` },
          { label:'Zielzone',        wert: targetText(plan, th, t.zone, week) }
        ];
        if(t.power) info.kennzahlen.push({ label:'Leistung', wert: t.power });
        const cad = cadenceText(plan, t.zone, week);
        if(cad) info.kennzahlen.push({ label:'Trittfrequenz', wert: cad });
        info.bloecke = [
          { label:'Einfahren',
            wert:`${plan.interval.warmupMinutes} min · ${zoneSpan(plan, th, 'z1', 'z2', week)}` },
          { label:`${t.reps}× ${t.workMin} min Belastung`, wert:`${zt}${pw}`,
            hinweis:`Rollender Start, Bewertungsfenster ab Minute ${t.phase === 1 ? 3 : 2}. ` +
                    T.thursdayIntervalTail },
          { label:'Pause',
            wert:`je ${t.restMin} min locker · ${zoneText(plan, th, 'z1', week)}`,
            hinweis:'Zwischen den Wiederholungen.' },
          { label:'Ausrollen', wert:`${plan.interval.cooldownMinutes} min` }
        ];
      }
      info.wellness = { rolle:'entscheidung', donnerstag: t.kind };
      break;
    }

    case 5: {
      const fo = plan.fridayOptional;
      info = { type:'restopt', title:'Ruhetag oder lockere Fahrt',
        detail:`Optional ${fo.minMinutes}–${fo.maxMinutes} min ${zoneText(plan, th, fo.zone, week)}, sonst frei.` };
      info.kennzahlen = [
        { label:'Umfang',   wert:`optional ${fo.minMinutes}–${fo.maxMinutes} min` },
        { label:'Zielzone', wert: targetText(plan, th, fo.zone, week) }
      ];
      info.bloecke = [
        { label:'Lockere Fahrt (optional)',
          wert:`${fo.minMinutes}–${fo.maxMinutes} min · ${zoneText(plan, th, fo.zone, week)}`,
          hinweis:'Sonst frei.' }
      ];
      break;
    }

    case 6: {
      const dur = w.saturdayMinutes;
      const bl = saturdayBlocks(plan, week);
      const sr = plan.saturdayRide;
      const bz = bl
        ? (wattText(plan, th, 'z3')
            ? `${zoneText(plan, th, 'z3', week)} · 80–88 % FTP`
            : zoneText(plan, th, 'z3', week))
        : null;
      let extra;
      if(recovery){
        extra = `${T.saturdayRecovery} (${zoneSpan(plan, th, 'z1', 'z2', week)}).`;
      } else if(bl){
        extra = `Dazu ${bl.reps}× ${bl.minutes} min ${bz} in der zweiten Hälfte der Fahrt, ` +
                `mit ${bl.restMinutes} min lockerem Rollen dazwischen.`;
      } else {
        extra = T.saturdayPureZ2;
      }
      info = { type:'long', title:'Lange Ausfahrt',
        detail:`${dur} min${distanceSuffix(plan, dur, week)} · Basis ${z2()}. ` +
               `${sr.warmupMinutes} min Einfahren, ${sr.cooldownMinutes} min Ausrollen. ${extra}` };

      info.kennzahlen = rideKennzahlen(plan, th, week, dur, 'z2');
      if(bl){
        info.kennzahlen.push({ label:'Blöcke',
          wert:`${bl.reps} × ${bl.minutes} min ${zoneText(plan, th, 'z3', week)}` });
      }
      const lang = [{ label:'Einfahren', wert:`${sr.warmupMinutes} min` }];
      if(recovery){
        lang.push({ label:'Basis', wert:`${dur} min · ${zoneSpan(plan, th, 'z1', 'z2', week)}`,
                    hinweis:`${T.saturdayRecovery}.` });
      } else {
        lang.push({ label:'Basis', wert:`${dur} min · ${z2()}`,
                    hinweis: bl ? undefined : T.saturdayPureZ2 });
        if(bl){
          lang.push({ label:`${bl.reps}× ${bl.minutes} min Block`, wert: bz,
            hinweis:`In der zweiten Hälfte der Fahrt, ${bl.restMinutes} min lockeres Rollen dazwischen.` });
        }
      }
      lang.push({ label:'Ausrollen', wert:`${sr.cooldownMinutes} min` });
      info.bloecke = lang;

      /* Die Hoehenmeter-Regel steht am Samstag, weil der Plan genau hier den
         Einstieg vorsieht: Watt- und Sprechtestkontrolle sind vorhanden, und
         es gibt keinen Ankunftsdruck wie auf dem Pendelweg. Vor Woche 5 ist
         die Aussage eine andere als danach - flach fahren gegen ersetzen statt
         addieren -, deshalb zwei Texte statt eines.

         Der Umschaltpunkt ist cogganFromWeek und nicht zufaellig derselbe wie
         beim Zonenmodell: beide haengen am Schwellentest. Bis dahin soll der
         Datensatz flach bleiben, danach wird ueber Watt gesteuert. */
      info.hinweise = [ week < plan.cogganFromWeek ? T.elevationIntro : T.elevationRule ];
      break;
    }

    case 0: {
      const dur = w.sundayOptionalMinutes;
      const rounds = coreRounds(plan, week);
      info = { type:'sun', title:'Rumpf-Zirkel (voll) + Beinblock',
        detail:`Rumpf-Zirkel: ${rounds} Runden à ${exCount} Übungen ` +
               `(${coreWorkSeconds(plan, week)} s Belastung / ${coreRestSeconds(plan, week)} s Pause), ` +
               `ca. ${coreMinutes(plan, week, rounds)} min. Direkt im Anschluss der Beinblock: ` +
               `${legRounds(plan, week)} Runden ${plan.legs.shortList} – ${T.legNoTimer}, ${plan.legs.durationHint}. ` +
               `${T.sundayLegOrder} ` +
               `Optional davor ${dur} min ${zoneText(plan, th, 'z1', week)} – ${T.sundayRideFirst}.`,
        showTimerBtn:true, showLegBlock:true };
      info.kennzahlen = [
        { label:'Dauer',     wert:'ca. ' + coreMinutes(plan, week, rounds) + ' min Zirkel' },
        { label:'Zirkel',    wert:`${rounds} Runden à ${exCount} Übungen` },
        { label:'Beinblock', wert:`${legRounds(plan, week)} Runden` },
        { label:'Takt',      wert:`${coreWorkSeconds(plan, week)} s / ${coreRestSeconds(plan, week)} s` }
      ];
      info.bloecke = [
        circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (voll)', T.sundayLegOrder),
        { label:'Beinblock', wert:`${legRounds(plan, week)} Runden ${plan.legs.shortList}`,
          hinweis:`${T.legNoTimer}, ${plan.legs.durationHint}.` },
        { label:'Rad (optional)', wert:`${dur} min · ${zoneText(plan, th, 'z1', week)}`,
          hinweis:`Davor – ${T.sundayRideFirst}.` }
      ];
      break;
    }
  }

  info.week = week;
  info.vorStart = vorStart;
  info.phase = phase;
  info.recovery = recovery;
  info.winter = winter;
  info.target = buildDayTarget(plan, date, week);

  /* Nach dem Schalter aufgefuellt, damit die Anzeige nie auf undefined
     stoesst - und damit ein spaeter ergaenzter Tagestyp nicht stillschweigend
     ohne Struktur durchlaeuft. */
  info.kennzahlen = info.kennzahlen ?? [];
  info.bloecke = info.bloecke ?? [];
  info.hinweise = info.hinweise ?? [];
  info.zusatz = zusatzBloecke(plan, date, startDate);
  return info;
}

/* Maschinenlesbare Sollwerte je Tag. Dauer in Minuten, Distanz in km, zone als
   Schluessel aus den Pulsbaendern. */
export function buildDayTarget(plan, date, week){
  const idx = weekIndex(plan, week);
  const w = plan.weeks[idx];
  const recovery = isRecoveryWeek(plan, week);

  switch(date.getDay()){
    case 1:
      return { sport:'rest' };

    case 2:
      return { sport:'ride', minutes:w.tuesdayMinutes,
               km:estimateDistance(plan, w.tuesdayMinutes, week), zone:'z2', commute:true };

    case 3: {
      const rounds = plan.circuit.wednesdayRounds;
      const t = { sport:'core', rounds, minutes:coreMinutes(plan, week, rounds),
                  workSec:coreWorkSeconds(plan, week), restSec:coreRestSeconds(plan, week),
                  legRounds:0 };
      if(w.wednesdayMinutes > 0){
        /* Die Fahrt ist Plan, aber die Dauer ist eine Untergrenze. Laenger zu
           fahren darf keine Warnung ausloesen; die Toleranz gilt nur nach unten. */
        t.rideMinutes = w.wednesdayMinutes;
        t.rideZone = 'z2';
        t.rideMinimum = true;
      }
      return t;
    }

    case 4: {
      const t = thursdayPlan(plan, week);
      if(t.kind === 'test'){
        return { sport:'ride', zone:'z4', minutes:t.minutes, test:true,
                 hardMinutes:25, reps:1, repMinutes:20 };
      }
      if(t.kind === 'z2'){
        return { sport:'ride', zone:'z2', minutes:t.minutes,
                 km:estimateDistance(plan, t.minutes, week) };
      }
      return { sport:'ride', zone:t.zone, minutes:t.minutes,
               hardMinutes:t.reps * t.workMin, reps:t.reps, repMinutes:t.workMin };
    }

    case 5:
      return { sport:'optional', minutes:plan.fridayOptional.targetMinutes, zone:plan.fridayOptional.zone };

    case 6: {
      const bl = recovery ? null : saturdayBlocks(plan, week);
      return { sport:'ride', minutes:w.saturdayMinutes,
               km:estimateDistance(plan, w.saturdayMinutes, week),
               zone:'z2', hardMinutes: bl ? bl.hardMinutes : 0, hardZone:'z3' };
    }

    case 0:
      return { sport:'core', rounds:coreRounds(plan, week),
               minutes:coreMinutes(plan, week, coreRounds(plan, week)),
               workSec:coreWorkSeconds(plan, week), restSec:coreRestSeconds(plan, week),
               legRounds:legRounds(plan, week),
               optionalRideMinutes:w.sundayOptionalMinutes, optionalZone:'z1' };
  }
  return { sport:'rest' };
}

export function formatDate(d){
  return d.toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'2-digit' });
}
