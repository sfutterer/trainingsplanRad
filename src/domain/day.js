/* Was an einem Tag ansteht - als Text fuer die Anzeige und als Zahlen fuer die
   Auswertung.

   Beides entsteht hier nebeneinander, damit der Abgleich mit intervals.icu
   keinen Fliesstext parsen muss. Die Fachtexte kommen aus plan.json; nur die
   Satzgerueste mit eingerechneten Zahlen stehen hier - sie in die Datei zu
   heben haette eine Vorlagensprache gebraucht und damit JavaScript nachgebaut. */

import {
  weekNumberFor, weekIndex, phaseOf, isRecoveryWeek, isWinterBlock,
  thursdayData, saturdayBlockData
} from './week.js';
import {
  zoneText, zoneSpan, targetText, withCadence, wattText,
  distanceSuffix, estimateDistance
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

export function buildDayInfo(plan, th, date, startDate){
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
      break;

    case 2: {
      const dur = w.tuesdayMinutes;
      info = { type:'ride', title:'Rad – Grundlagenausdauer (Z2)',
        detail:`${dur} min${distanceSuffix(plan, dur, week)} · ${z2()}. ${T.tuesdayCommute}` };
      break;
    }

    case 3: {
      const dur = w.wednesdayMinutes;
      const rounds = plan.circuit.wednesdayRounds;
      const rumpf = `Abends Rumpf-Zirkel verkürzt: ${rounds} Runden à ${exCount} Übungen ` +
        `(${coreWorkSeconds(plan, week)} s Belastung / ${coreRestSeconds(plan, week)} s Pause), ` +
        `ca. ${coreMinutes(plan, week, rounds)} min. Kein Beinblock.`;
      if(dur > 0){
        const lockerer = phase === 3 ? T.wednesdayEasyPhase3 : T.wednesdayEasyDefault;
        info = { type:'ride', title:'Rad – kurzes Z2 (Arbeitsweg) + Rumpf',
          detail:`Mindestens ${dur} min direkte Strecke${distanceSuffix(plan, dur, week)} · ${z2()}. ` +
                 `${T.wednesdayMinimum} ${lockerer} ${rumpf}`,
          showTimerBtn:true };
      } else {
        info = { type:'core', title:'Rumpf/Oberkörper-Stabilität',
          detail:`${T.wednesdayNoRide} ${rumpf}`, showTimerBtn:true };
      }
      break;
    }

    case 4: {
      const t = thursdayPlan(plan, week);
      if(t.kind === 'test'){
        info = { type:'interval', title:t.title, detail:T.thursdayTest, showIntervalBtn:true };
      } else if(t.kind === 'z2'){
        info = { type:'ride', title:t.title,
          detail:`${t.minutes} min${distanceSuffix(plan, t.minutes, week)} · ${z2()}. ${T.thursdayBaseDay}` };
      } else {
        const zt = withCadence(plan, targetText(plan, th, t.zone, week), t.zone, week);
        const pw = t.power ? ` (${t.power})` : '';
        info = { type:'interval', title:t.title,
          detail:`Nach ${plan.interval.warmupMinutes} min Einfahren (${zoneSpan(plan, th, 'z1', 'z2', week)}): ` +
                 `${t.reps}× ${t.workMin} min ${zt}${pw}, je ${t.restMin} min locker (${zoneText(plan, th, 'z1', week)}) dazwischen. ` +
                 `Danach ${plan.interval.cooldownMinutes} min Ausrollen. Rollender Start, Bewertungsfenster ab Minute ${t.phase === 1 ? 3 : 2}. ` +
                 T.thursdayIntervalTail,
          showIntervalBtn:true };
      }
      info.wellness = true;
      break;
    }

    case 5: {
      const fo = plan.fridayOptional;
      info = { type:'restopt', title:'Ruhetag oder lockere Fahrt',
        detail:`Optional ${fo.minMinutes}–${fo.maxMinutes} min ${zoneText(plan, th, fo.zone, week)}, sonst frei.` };
      break;
    }

    case 6: {
      const dur = w.saturdayMinutes;
      const bl = saturdayBlocks(plan, week);
      const sr = plan.saturdayRide;
      let extra;
      if(recovery){
        extra = `${T.saturdayRecovery} (${zoneSpan(plan, th, 'z1', 'z2', week)}).`;
      } else if(bl){
        const bz = wattText(plan, th, 'z3')
          ? `${zoneText(plan, th, 'z3', week)} · 80–88 % FTP`
          : zoneText(plan, th, 'z3', week);
        extra = `Dazu ${bl.reps}× ${bl.minutes} min ${bz} in der zweiten Hälfte der Fahrt, ` +
                `mit ${bl.restMinutes} min lockerem Rollen dazwischen.`;
      } else {
        extra = T.saturdayPureZ2;
      }
      info = { type:'long', title:'Lange Ausfahrt',
        detail:`${dur} min${distanceSuffix(plan, dur, week)} · Basis ${z2()}. ` +
               `${sr.warmupMinutes} min Einfahren, ${sr.cooldownMinutes} min Ausrollen. ${extra}` };
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
      break;
    }
  }

  info.week = week;
  info.phase = phase;
  info.recovery = recovery;
  info.winter = winter;
  info.target = buildDayTarget(plan, date, week);
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
