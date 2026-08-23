/* Abgleich der aufgezeichneten Aktivitaeten mit dem Plan.

   Uebernommen aus der Einzeldatei-Fassung. Zwei Aenderungen: plan, thresholds
   und die Zonenschluessel kommen als Parameter statt aus Modulvariablen, und
   buildDayInfo wird mit dem Modell aufgerufen statt global. Die Bewertung
   selbst ist unveraendert - sie ist im Trainingsplan-Dokument begruendet.

   Die Toleranzen stehen bewusst hier und nicht in plan.json: das ist
   Bewertungspolitik der App, nicht Trainingsplan. */

import { buildDayInfo } from './day.js';
import { legDoneRounds, legAborts } from './core.js';

export function anIsRide(type){
  return /ride|cycl|bike|biking|spinning/i.test(type || '');
}

export function anIsStrength(type){
  return /weight|strength|core|workout|yoga|pilates|training/i.test(type || '');
}

export function anLocalDay(iso){
  return (iso || '').slice(0, 10);
}

export function anRecordingNote(z){
  if(!z) return null;
  const takt = z._takt ? (Math.round(z._takt * 10) / 10).toString().replace('.', ',') : null;
  if(z._method === 'annahme'){
    return {kind:'', text:'Kein Zeit-Stream und keine Aufzeichnungsdauer verfügbar – Zonenzeiten mit einer Sekunde je Messwert gerechnet. Die Anteile stimmen, die absoluten Minuten können deutlich zu niedrig sein.'};
  }
  if(z._method === 'skaliert'){
    return {kind:'info', text:'Kein Zeit-Stream vorhanden – Zonenzeiten gleichmäßig auf ⌀ ' + takt + ' s je Messwert skaliert (' + z._samples + ' Messwerte).'};
  }
  if(z._takt && z._takt >= 1.5){
    return {kind:'info', text:'Aufzeichnung im ⌀ ' + takt + '-Sekunden-Takt (' + z._samples + ' Messwerte), zeitgewichtet ausgewertet.'};
  }
  return null;
}

export function anFmtMin(sec){
  const m = Math.round(sec / 60);
  if(m < 60) return m + ' min';
  return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ' h';
}

export function anPct(part, whole){
  if(!whole) return 0;
  return Math.round(part / whole * 100);
}

/* Toleranz auf die Dauer, bewusst unsymmetrisch.

   Zu kurz ist eine echte Abweichung, da fehlt Umfang. Laenger oder weiter zu
   fahren ist dagegen normal: exakt passende Strecken lassen sich kaum planen,
   und die Distanzangabe im Plan ist ohnehin nur aus einer angenommenen
   Geschwindigkeit geschaetzt - sie geht nirgends in die Bewertung ein.

   Das eigentliche Risiko einer laengeren Fahrt ist nicht die Dauer, sondern die
   Intensitaet. Die prueft der Zonenabschnitt weiter unten, und nur der darf eine
   zu harte Fahrt herabsetzen. Mehr Umfang allein bleibt "eingehalten". */
export const AN_DUR_TOL_SHORT = 0.15;
export const AN_DUR_TOL_LONG  = 0.35;

/* Setzt den Status herab und zieht das Badge mit. Ohne das behielte eine
   Einheit mit passender Dauer das Badge "erfuellt", obwohl die Zonenpruefung
   sie schon als abweichend markiert hat. */
export function anDowngrade(row, badge){
  if(row.status === 'miss') return;
  row.status = 'dev';
  row.badge = badge;
}


/* Aus der aufgezeichneten Dauer die Zahl der Runden schaetzen. Der Zirkel ist
   deterministisch: n Runden brauchen n*(8*Belastung + 7*Pause) plus die
   Rundenpausen dazwischen und 10 s Vorlauf. */
export function anEstimateRounds(sec, workSec, restSec, roundRestSec, prepSec, exCount){
  if(!workSec || !sec) return null;
  const ex = EXERCISES.length;
  const runde = ex * workSec + (ex - 1) * restSec;
  let best = null;
  for(let n = 1; n <= 6; n++){
    const soll = n * runde + (n - 1) * roundRestSec + prepSec;
    const abw = Math.abs(soll - sec);
    if(!best || abw < best.abw) best = {rounds: n, abw: abw};
  }
  /* Passt selbst die beste Zuordnung um mehr als eine halbe Runde nicht, war
     das etwas anderes als dieser Zirkel - dann lieber nichts behaupten. */
  if(!best || best.abw > runde * 0.5) return null;
  return best.rounds;
}

/* Exakte Auswertung aus dem eigenen Protokoll. */
export function anCoreLogNotes(row, sessions, t){
  const notes = [];
  const ses = sessions[sessions.length - 1];
  const exCount = ses.exCount || 8;
  const voll = Math.floor((ses.sets || 0) / exCount);
  const soll = ses.plannedRounds || t.rounds || 0;

  if(ses.finished && voll >= soll){
    row.status = 'ok'; row.badge = 'erledigt';
    notes.push({kind:'good', text:'Alle ' + soll + ' Runden komplett durchgezogen.'});
  } else {
    anDowngrade(row, voll + '/' + soll + ' Runden');
    notes.push({kind:'', text:'Rumpf-Timer: ' + voll + ' von ' + soll + ' Runden' +
      (ses.finished ? '' : ' – Einheit vorzeitig beendet') +
      (ses.lastExercise ? ', zuletzt ' + ses.lastExercise.name + ' in Runde ' + ses.lastExercise.round : '') + '.'});
  }

  if(ses.skips && ses.skips.length){
    const je = {};
    for(const sk of ses.skips) je[sk.name] = (je[sk.name] || 0) + 1;
    const liste = Object.keys(je).sort((a, b) => je[b] - je[a])
      .map(n => n + (je[n] > 1 ? ' (' + je[n] + '×)' : '')).join(', ');
    notes.push({kind:'', text: ses.skips.length + (ses.skips.length === 1 ? ' Satz' : ' Sätze') +
      ' vorzeitig weitergedrückt: ' + liste + '.'});
  }
  if(sessions.length > 1){
    notes.push({kind:'', text: sessions.length + ' Einheiten an diesem Tag protokolliert, bewertet ist die letzte.'});
  }
  return notes;
}

/* Nur eine Garmin-Aufzeichnung da: aus der Dauer schaetzen. */
export function anCoreEstimateNotes(row, strength, t, roundRestSec, prepSec, exCount){
  const notes = [];
  const sec = strength.reduce((n, a) => n + (a.elapsed_time || a.moving_time || 0), 0);
  const min = Math.round(sec / 60);
  const est = anEstimateRounds(sec, t.workSec, t.restSec, roundRestSec, prepSec, exCount);
  const soll = t.rounds || 0;

  if(est == null){
    row.status = 'ok'; row.badge = 'erledigt';
    notes.push({kind:'good', text:'Krafteinheit aufgezeichnet: ' + min + ' min. Die Dauer passt zu keiner Rundenzahl dieses Zirkels, daher keine Schätzung.'});
  } else if(est >= soll){
    row.status = 'ok'; row.badge = 'erledigt';
    notes.push({kind:'good', text:'Krafteinheit aufgezeichnet: ' + min + ' min, geschätzt etwa ' + est + ' von ' + soll + ' Runden.'});
  } else {
    anDowngrade(row, 'ca. ' + est + '/' + soll + ' Runden');
    notes.push({kind:'', text:'Krafteinheit aufgezeichnet: ' + min + ' min, geschätzt etwa ' + est +
      ' von ' + soll + ' Runden – geplant waren ' + t.minutes + ' min. Geschätzt aus der Dauer, weil intervals.icu keine Sätze speichert.'});
  }
  return notes;
}

/* Optionale und nicht geplante Fahrten werden bewertet, aber nicht am Umfang
   gemessen: kuerzer oder gar nicht ist bei einer freiwilligen Einheit kein
   Fehler. Zu hart gefahren dagegen schon - eine Erholungsfahrt in Z3 frisst
   genau die Erholung, fuer die sie da ist. */
export function anEasyRideNotes(row, sollMin){
  const notes = [];
  const ist = Math.round(row.rideSec / 60);
  const km = row.rideKm >= 1 ? ' (' + row.rideKm.toFixed(1) + ' km)' : '';
  notes.push({kind:'', text: sollMin
    ? 'Optionale Fahrt: ' + ist + ' min' + km + ' gefahren, vorgesehen sind ' + sollMin + ' min Z1.'
    : 'Nicht eingeplante Fahrt: ' + ist + ' min' + km + '.'});

  const z = row.zones;
  if(z && z._total > 300){
    const locker = anPct((z.unter || 0) + (z.z1 || 0) + (z.z2 || 0), z._total);
    const hart = anPct((z.z3 || 0) + (z.z4 || 0) + (z.z5 || 0), z._total);
    if(hart > 25){
      anDowngrade(row, 'zu hart');
      notes.push({kind:'bad', text: hart + ' % der Zeit über Z2. Für eine locker gemeinte Fahrt zu hart – sie soll Erholung bringen, nicht kosten.'});
    } else {
      notes.push({kind:'good', text: locker + ' % locker (bis Z2). Passt für eine Erholungsfahrt.'});
    }
    const aufz = anRecordingNote(z);
    if(aufz) notes.push(aufz);
  }
  return notes;
}

/* Beinblock aus dem eigenen Protokoll. intervals.icu sieht davon nichts:
   ohne Timer gibt es keine Aufzeichnung, und selbst mit waere dort nur Dauer
   und Puls gespeichert. */
export function anLegNotes(row, legSessions, t){
  const notes = [];
  const soll = t.legRounds || 0;
  if(!soll) return notes;

  if(!legSessions || !legSessions.length){
    notes.push({kind:'', text:'Beinblock nicht protokolliert. Er steht im Rumpf-Tab unter „Beinblock“ – ' +
      'ohne Eintrag ist er die einzige Trainingskomponente ohne jede Erfassung.'});
    return notes;
  }

  const e = legSessions[legSessions.length - 1];
  const voll = legDoneRounds(e);
  const ab = legAborts(e);
  const gesamt = e.exercises.reduce((n, ex) => n + ex.reps.filter(v => v > 0).length, 0);

  if(voll >= soll){
    notes.push({kind:'good', text:'Beinblock: ' + voll + ' von ' + soll + ' Runden komplett, ' + gesamt + ' Sätze.'});
  } else if(gesamt > 0){
    anDowngrade(row, 'Beine ' + voll + '/' + soll);
    notes.push({kind:'', text:'Beinblock: ' + voll + ' von ' + soll + ' Runden komplett (' + gesamt + ' Sätze protokolliert).'});
  } else {
    notes.push({kind:'', text:'Beinblock angelegt, aber keine Wiederholungen eingetragen.'});
  }

  if(ab){
    const liste = e.exercises
      .filter(ex => ex.reps.some(v => v != null && v > 0 && v < ex.target))
      .map(ex => ex.name).join(', ');
    notes.push({kind:'', text: ab + (ab === 1 ? ' Satz' : ' Sätze') + ' unter dem Wiederholungsziel: ' + liste +
      '. Im ersten Block zählt Bewegungsqualität, nicht Maximalkraft – das ist eine Beobachtung, kein Fehler.'});
  }
  return notes;
}

/* Pendelfahrten am Dienstag und Mittwoch: die Solldauer ist eine Untergrenze.
   Zu lang ist kein Fehler und darf keine Warnung ausloesen. Bewertet wird
   stattdessen die Intensitaet - ueber 20 % der Zeit oberhalb Z2 heisst, der
   Weg wurde unter Zeitdruck gefahren. */
export function anCommuteIntensityNotes(row, zones){
  const notes = [];
  if(!zones || !zones._total || zones._total <= 300) return notes;
  const ueber = anPct((zones.z3 || 0) + (zones.z4 || 0) + (zones.z5 || 0), zones._total);
  if(ueber > 20){
    anDowngrade(row, 'zu hart');
    notes.push({kind:'bad', text: ueber + ' % der Zeit über Z2. Auf dem Arbeitsweg heißt das meist Zeitdruck – ' +
      'der Ankunftspuffer von 15 min ist Teil des Trainings, nicht Komfort.'});
  } else {
    notes.push({kind:'good', text: anPct(zones.z2 || 0, zones._total) + ' % in Z2, ' + ueber + ' % darüber. Passt für den Arbeitsweg.'});
  }
  return notes;
}

export function anCompareDay(plan, th, date, startDate, acts, zonesById, coreSessions, legSessions){
  const info = buildDayInfo(plan, th, date, startDate);
  const t = info.target || {sport:'rest'};
  const rides = acts.filter(a => anIsRide(a.type));
  const strength = acts.filter(a => !anIsRide(a.type) && anIsStrength(a.type));
  const row = {
    date: date, week: info.week, plan: info, target: t,
    acts: acts, rides: rides, strength: strength,
    coreSessions: coreSessions || [],
    legSessions: legSessions || [],
    notes: [], status: 'ok', badge: ''
  };

  const rideSec = rides.reduce((n, a) => n + (a.moving_time || a.elapsed_time || 0), 0);
  const rideKm  = rides.reduce((n, a) => n + (a.distance || 0), 0) / 1000;
  row.rideSec = rideSec;
  row.rideKm = rideKm;

  /* Geplante und optionale Fahrzeit getrennt fuehren. In Fassung 1 lief alles
     Gefahrene gegen nur die geplanten Radeinheiten, dadurch schoben optionale
     Fahrten die Kennzahl "Abweichung Fahrzeit" nach oben. */
  const istGeplant = t.sport === 'ride' || (t.sport === 'core' && t.rideMinutes);
  row.plannedRideSec  = istGeplant ? rideSec : 0;
  row.optionalRideSec = istGeplant ? 0 : rideSec;
  row.plannedMinutes  = t.sport === 'ride' ? (t.minutes || 0) : (t.rideMinutes || 0);

  /* Zonenzeiten aller Fahrten des Tages zusammenfassen. Die Angaben zur
     Aufzeichnung muessen mitwandern, sonst kann anRecordingNote nichts sagen.
     Bei mehreren Fahrten gilt das unzuverlaessigste Verfahren und der groebste
     Takt - eine Aussage soll nicht besser klingen als ihre schlechteste Quelle. */
  if(zonesById){
    const RANG = {zeitgewichtet: 0, skaliert: 1, annahme: 2};
    const merged = {}; let total = 0, method = null, takt = null, samples = 0;
    plan.zoneKeys.forEach(k => { merged[k] = 0; });
    for(const a of rides){
      const z = zonesById[a.id];
      if(!z) continue;
      plan.zoneKeys.forEach(k => { merged[k] += z[k] || 0; });
      total += z._total || 0;
      samples += z._samples || 0;
      if(z._method && (method === null || RANG[z._method] > RANG[method])) method = z._method;
      if(z._takt && (takt === null || z._takt > takt)) takt = z._takt;
    }
    if(total > 0){
      merged._total = total;
      merged._method = method;
      merged._takt = takt;
      merged._samples = samples;
      row.zones = merged;
    }
  }
  row.z2Sec   = row.zones ? (row.zones.z2 || 0) : 0;
  row.hardSec = row.zones ? ((row.zones.z3 || 0) + (row.zones.z4 || 0) + (row.zones.z5 || 0)) : 0;

  if(t.sport === 'rest'){
    if(rides.length){
      row.status = 'extra'; row.badge = 'Zusatz';
      row.notes.push({kind:'', text:'Ruhetag, trotzdem ' + anFmtMin(rideSec) + ' gefahren. Einmal ist kein Problem, regelmäßig frisst es die Erholung, die den Donnerstag trägt.'});
    } else {
      row.status = 'ok'; row.badge = 'Ruhetag';
    }
    return row;
  }

  if(t.sport === 'optional'){
    row.status = 'ok';
    if(rides.length){
      row.badge = 'optional gefahren';
      row.notes.push(...anEasyRideNotes(row, t.minutes));
    } else {
      row.badge = 'frei';
    }
    return row;
  }

  if(t.sport === 'core'){
    /* Das eigene Protokoll ist die genauere Quelle und hat Vorrang; die
       Schaetzung aus der Garmin-Dauer greift nur ohne Protokoll. */
    let rumpfBewertet = false;
    if(row.coreSessions && row.coreSessions.length){
      row.notes.push(...anCoreLogNotes(row, row.coreSessions, t));
      rumpfBewertet = true;
    } else if(strength.length){
      row.notes.push(...anCoreEstimateNotes(row, strength, t, plan.circuit.roundRestSeconds, plan.circuit.prepSeconds, plan.circuit.exercises.length));
      rumpfBewertet = true;
    }

    if(!rumpfBewertet){
      if(rides.length && !t.rideMinutes){
        if(t.optionalRideMinutes){
          row.status = 'ok'; row.badge = 'optional gefahren';
        } else {
          row.status = 'extra'; row.badge = 'Zusatz';
        }
      } else if(!rides.length || t.rideMinutes){
        row.status = 'dev'; row.badge = 'nicht erfasst';
        row.notes.push({kind:'', text:'Keine Krafteinheit gefunden. Rumpftraining landet nur in intervals.icu, wenn du es auf der Uhr als Aktivität aufzeichnest – oder du nutzt den Rumpf-Timer der App, der protokolliert von selbst.'});
      }
    }

    /* Beinblock nur am Sonntag; am Mittwoch steht keiner an. */
    row.notes.push(...anLegNotes(row, row.legSessions, t));

    /* Mittwoch: Rad UND Rumpf am selben Tag. Die Fahrt ist geplant, aber die
       Dauer ist eine Untergrenze - deshalb hier und nicht ueber den normalen
       Dauervergleich weiter unten. */
    if(t.rideMinutes){
      if(!rides.length){
        anDowngrade(row, 'Fahrt fehlt');
        row.notes.push({kind:'bad', text:'Keine Fahrt an diesem Tag. Vorgesehen sind mindestens ' + t.rideMinutes + ' min Z2 auf dem Arbeitsweg. Ersatzlos streichen ist in Ordnung – der Mittwoch ist der kleinste Beitrag der Woche.'});
      } else {
        const ist = Math.round(rideSec / 60);
        if(ist < t.rideMinutes * (1 - AN_DUR_TOL_SHORT)){
          anDowngrade(row, 'kürzer');
          row.notes.push({kind:'bad', text: ist + ' min gefahren, Untergrenze sind ' + t.rideMinutes + ' min.'});
        } else if(ist < t.rideMinutes){
          row.notes.push({kind:'info', text: ist + ' min gefahren statt ' + t.rideMinutes + ' min – innerhalb der Toleranz, gilt als eingehalten.'});
        } else {
          row.notes.push({kind:'good', text: ist + ' min gefahren, Untergrenze ' + t.rideMinutes + ' min – erfüllt. Länger ist kein Planverstoß.'});
        }
        row.notes.push(...anCommuteIntensityNotes(row, row.zones));
        const aufz = anRecordingNote(row.zones);
        if(aufz) row.notes.push(aufz);
      }
    } else if(rides.length){
      row.notes.push(...anEasyRideNotes(row, t.optionalRideMinutes));
    }
    return row;
  }

  /* Ab hier: Radeinheit mit messbarem Soll. */
  if(!rides.length){
    row.status = 'miss'; row.badge = 'ausgefallen';
    row.notes.push({kind:'bad', text: t.test
      ? 'Kein Test gefunden. Ein verschobener Test ist kein Problem – ein Test unter schlechten Bedingungen verzerrt die Zonen für acht Wochen.'
      : 'Keine Fahrt an diesem Tag gefunden.'});
    return row;
  }

  const sollSec = (t.minutes || 0) * 60;
  const diff = sollSec ? (rideSec - sollSec) / sollSec : 0;
  row.durDiff = diff;
  const pct = Math.abs(Math.round(diff * 100));
  if(diff < -AN_DUR_TOL_SHORT){
    row.status = 'dev'; row.badge = 'kürzer';
    row.notes.push({kind:'bad', text: pct + ' % kürzer als geplant.'});
  } else {
    row.status = 'ok'; row.badge = t.test ? 'Test gefahren' : 'erfüllt';
    if(diff > AN_DUR_TOL_SHORT){
      row.notes.push({kind:'info', text: pct + ' % länger als geplant – gilt als eingehalten.' +
        (diff > AN_DUR_TOL_LONG
          ? ' Dauerhaft deutlich mehr Umfang gehört in die Planprogression, nicht in einzelne Fahrten.'
          : '')});
    }
  }

  if(t.test){
    row.notes.push({kind:'info', text:'Testtag: Ø-Watt der 20 min notieren, FTP = Ø-Watt × 0,95, LTHR = Ø-Puls der 20 min. ' +
      'Beides im Tab „Heute“ unter Schwellenwerte eintragen und in intervals.icu übernehmen, danach Power Zones und HR Zones auf Coggan.'});
  }

  /* Der Dienstag ist Pendelweg: laenger ist normal, zu hart ist der Fehler. */
  if(t.commute && row.zones && row.zones._total > 300){
    row.notes.push(...anCommuteIntensityNotes(row, row.zones));
    const aufz = anRecordingNote(row.zones);
    if(aufz) row.notes.push(aufz);
    return row;
  }

  /* Zonen bewerten - nur wenn Streams geladen wurden. */
  if(row.zones && row.zones._total > 300){
    const total = row.zones._total;
    const target = t.zone;
    const inTarget = row.zones[target] || 0;
    const share = anPct(inTarget, total);
    row.zoneShare = share;
    const sehrHart = anPct((row.zones.z4 || 0) + (row.zones.z5 || 0), total);

    if(target === 'z2'){
      const base  = anPct((row.zones.z1 || 0) + (row.zones.z2 || 0), total);
      const unten = anPct((row.zones.unter || 0) + (row.zones.z1 || 0), total);
      /* Auf einer Grundlagenfahrt ist schon Z3 zu hart. Am Samstag sind in den
         Wochen 6, 10 und 14 Z3-Bloecke geplant, deren Anteil ist zusaetzlich
         erlaubt - in allen anderen Wochen ist der Samstag reines Z2. */
      const ueber = anPct((row.zones.z3 || 0) + (row.zones.z4 || 0) + (row.zones.z5 || 0), total);
      const erlaubt = 20 + (t.hardMinutes && t.minutes
        ? Math.round(t.hardMinutes / t.minutes * 100) : 0);

      if(ueber > erlaubt){
        anDowngrade(row, 'zu hart');
        row.notes.push({kind:'bad', text: ueber + ' % der Zeit über Z2' +
          (sehrHart >= 5 ? ' (davon ' + sehrHart + ' % in Z4/Z5)' : '') +
          ', vorgesehen sind hier rund ' + erlaubt + ' %. Das ist eine Grundlagenfahrt – zu hart gefahren kostet sie die Erholung für den Qualitätstag.'});
      } else if(unten > 35){
        anDowngrade(row, 'zu locker');
        row.notes.push({kind:'', text: unten + ' % der Zeit unter Z2. Für eine Grundlagenfahrt zu locker – der Reiz kommt aus Z2.'});
      } else {
        row.notes.push({kind:'good', text:share + ' % in Z2, ' + base + ' % in Z1–Z2. Passt.'});
      }
      if(t.hardMinutes){
        const z3min = Math.round((row.zones.z3 || 0) / 60);
        row.notes.push({kind: z3min >= t.hardMinutes * 0.7 ? 'good' : '',
          text:'Z3-Blockzeit: ' + z3min + ' min erreicht, geplant waren rund ' + t.hardMinutes + ' min.'});
      }
    } else {
      /* Intervalltag: die harte Zeit zaehlt, nicht der Anteil. Der Puls hinkt dem
         Tritt nachher, und man durchlaeuft die Zone darunter auf dem Weg nach oben.
         Nur die Zielzone zu zaehlen wuerde saubere Intervalle als Abbruch melden -
         deshalb zaehlt die Zone darunter mit, wird aber getrennt ausgewiesen.
         Ab Woche 5 waere die Zeit in der Watt-Zone der genauere Massstab; die
         steht erst mit dem Leistungsmesser zur Verfuegung. */
      const below = target === 'z5' ? 'z4' : target === 'z4' ? 'z3' : 'z2';
      const zielMin = Math.round((row.zones[target] || 0) / 60);
      const hardMin = Math.round(((row.zones[target] || 0) + (row.zones[below] || 0)) / 60);
      const soll = t.hardMinutes || 0;
      const plan = t.test ? '5 min all-out + 20 min maximal' : t.reps + '× ' + t.repMinutes + ' min';
      if(soll){
        if(hardMin >= soll * 0.7){
          row.notes.push({kind:'good', text:hardMin + ' min hart gefahren (davon ' + zielMin + ' min in ' + target.toUpperCase() + '), geplant ' + soll + ' min als ' + plan + '.'});
        } else {
          anDowngrade(row, t.test ? 'Test kurz' : 'Intervalle kurz');
          row.notes.push({kind:'bad', text:'Nur ' + hardMin + ' min hart gefahren (davon ' + zielMin + ' min in ' + target.toUpperCase() + '), geplant waren ' + soll + ' min als ' + plan + '. Intervalle abgebrochen oder Zone nicht erreicht?'});
        }
      }
    }

    const aufz = anRecordingNote(row.zones);
    if(aufz) row.notes.push(aufz);
  }

  return row;
}


/* Wochensummen. Bei getauschten Tagen ist die Tagesbewertung wertlos - sie
   meldet einen Tausch doppelt, einmal als fehlende und einmal als unerwartete
   Einheit. Gesamtdauer, Z2-Minuten und harte Zeit ueber die Woche sagen
   dagegen unabhaengig vom Wochentag, ob die Woche gestimmt hat. */
export function anWeekTotals(rows){
  const byWeek = {};
  for(const r of rows){
    const w = byWeek[r.week] = byWeek[r.week] || {week:r.week, sollMin:0, istSec:0, optSec:0, z2Sec:0, hardSec:0, tage:0};
    w.sollMin += r.plannedMinutes || 0;
    w.istSec  += (r.plannedRideSec || 0) + (r.optionalRideSec || 0);
    w.optSec  += r.optionalRideSec || 0;
    w.z2Sec   += r.z2Sec || 0;
    w.hardSec += r.hardSec || 0;
    if(r.acts.length) w.tage += 1;
  }
  return Object.keys(byWeek).map(k => byWeek[k]).sort((a, b) => a.week - b.week);
}

/* Bericht ueber einen Zeitraum. Rumpf- und Beinblock-Eintraege kommen getrennt
   herein; Eintraege ohne kind stammen aus der Zeit vor dem Beinblock und sind
   Rumpf. */
export function anBuildReport(plan, th, startDate, from, to, activities, zonesById, logEntries){
  const byDay = {};
  for(const a of (activities || [])){
    const d = anLocalDay(a.start_date_local);
    if(!d) continue;
    (byDay[d] = byDay[d] || []).push(a);
  }
  const coreByDay = {}, legByDay = {};
  for(const e of (logEntries || [])){
    if(!e || !e.day) continue;
    if(e.kind === 'leg') (legByDay[e.day] = legByDay[e.day] || []).push(e);
    else (coreByDay[e.day] = coreByDay[e.day] || []).push(e);
  }
  const rows = [];
  const cur = new Date(from);
  while(cur <= to){
    const key = anIsoDayKey(cur);
    rows.push(anCompareDay(plan, th, new Date(cur), startDate,
                           byDay[key] || [], zonesById, coreByDay[key] || [], legByDay[key] || []));
    cur.setDate(cur.getDate() + 1);
  }
  return rows;
}

function anIsoDayKey(d){
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

/* ---- Wellness ----

   Ruhepuls, HRV und Schlaf lagen ueber die API ohnehin vor, wurden in Fassung 1
   aber nirgends verwendet. Bei dieser Aufbaurate die wichtigste Sicherung.
   Reine Regeln: die Daten kommen von aussen, hier wird nur gerechnet.

   Die Schwellen stehen wie die Toleranzen oben bewusst hier und nicht in
   plan.json - sie sind Bewertungspolitik der App, nicht Trainingsplan. Das gilt
   auch fuer die Massnahmentexte weiter unten: welcher Donnerstag wie
   heruntergestuft wird, haengt an der Bewertung, nicht am Plandokument. */
export const WELL = {
  rhrPlus: 5,                 // bpm ueber dem Schnitt
  hrvAnteil: 0.85,            // Anteil des Schnitts
  schlafKurzSec: 6 * 3600,
  fenster: 7,                 // Tage, aus denen der Schnitt kommt
  /* Abnehmen und Aufbauen ziehen gegeneinander. Ueber dieser Rate je Woche
     fehlt die Energie fuer genau die Anpassung, die der Plan aufbauen will -
     und das zeigt sich zuerst in den drei Werten darueber. Faustwert aus der
     Trainingslehre, nicht aus dem Plandokument. */
  abnehmProzentProWoche: 0.7,
  gewichtMinPunkte: 5,
  gewichtMinTage: 5
};

/* Tagesrechnen auf dem ISO-String, nicht auf Date: die Zeilen kommen als
   "JJJJ-MM-TT", und ein lokales Date daraus zu bauen verschiebt bei
   Sommerzeitwechseln den Tag. */
function tagNummer(iso){
  const t = String(iso || '').slice(0, 10).split('-').map(Number);
  if(t.length !== 3 || t.some(v => !Number.isFinite(v))) return null;
  return Math.round(Date.UTC(t[0], t[1] - 1, t[2]) / 86400000);
}

export function tagPlus(iso, delta){
  const n = tagNummer(iso);
  if(n === null) return null;
  return new Date((n + delta) * 86400000).toISOString().slice(0, 10);
}

/* Nur Zeilen mit Datum. intervals.icu fuehrt das Datum als id; ohne sie laesst
   sich weder "gestern" noch ein Schnitt bilden, und dann lieber gar keine
   Aussage als eine falsch verankerte. */
function wellnessZeilen(data){
  return (Array.isArray(data) ? data : [])
    .filter(r => r && tagNummer(r.id) !== null)
    .sort((a, b) => tagNummer(a.id) - tagNummer(b.id));
}

export function wellnessAvg(rows, feld){
  const v = (rows || []).map(r => r && r[feld]).filter(x => x > 0);
  if(v.length < 3) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/* Das Gate fuer einen Tag.

   streng entscheidet, was passiert, wenn fuer den gefragten Tag keine Zeile da
   ist. Morgens um sieben steht der heutige Datensatz oft noch nicht - dafuer
   faellt die Bewertung auf die neueste vorhandene Zeile zurueck. Fuer "gestern"
   und fuer eine zurueckliegende Fahrt darf sie das nicht, sonst wandert der
   heutige Wert auf einen fremden Tag. */
export function wellnessGate(data, todayIso, streng){
  const rows = wellnessZeilen(data);
  if(!rows.length) return null;

  const heute = rows.find(r => r.id === todayIso) || (streng ? null : rows[rows.length - 1]);
  if(!heute) return null;

  const heuteNr = tagNummer(heute.id);
  /* Der Schnitt kommt aus den sieben Tagen davor - nicht aus allem, was der
     Abruf hergibt. Das Fenster darf sich nicht mit der Fensterbreite des
     Aufrufers aendern. */
  const rest = rows.filter(r => tagNummer(r.id) < heuteNr).slice(-WELL.fenster);
  const rhrAvg = wellnessAvg(rest, 'restingHR');
  const hrvAvg = wellnessAvg(rest, 'hrv');

  const gestern = rows.find(r => tagNummer(r.id) === heuteNr - 1) || null;
  const kurz = s => s > 0 && s < WELL.schlafKurzSec;
  const kurzeNaechte = (kurz(heute.sleepSecs) ? 1 : 0) + (gestern && kurz(gestern.sleepSecs) ? 1 : 0);

  const rhrHoch = heute.restingHR > 0 && rhrAvg > 0 && heute.restingHR > rhrAvg + WELL.rhrPlus;
  const hrvNiedrig = heute.hrv > 0 && hrvAvg > 0 && heute.hrv < hrvAvg * WELL.hrvAnteil;

  const gruende = [];
  if(rhrHoch){
    gruende.push('Ruhepuls ' + Math.round(heute.restingHR) + ' bpm, ' + WELL.fenster +
      '-Tage-Schnitt ' + Math.round(rhrAvg) + ' bpm');
  }
  if(hrvNiedrig){
    gruende.push('HRV ' + Math.round(heute.hrv) + ', ' + WELL.fenster +
      '-Tage-Schnitt ' + Math.round(hrvAvg));
  }
  /* Zwei kurze Naechte hintereinander, nicht eine - und beide ueber das Datum
     bestimmt, nicht ueber die Position im Abruf. */
  if(kurzeNaechte === 2) gruende.push('zwei Nächte unter 6 h Schlaf');

  const fehlt = !(heute.restingHR > 0) && !(heute.hrv > 0) && !(heute.sleepSecs > 0);
  if(fehlt) return null;

  return { rot: gruende.length > 0, gruende, heute, rhrAvg, hrvAvg,
           rhrHoch, hrvNiedrig, kurzeNaechte };
}

/* Steigung des Gewichts in kg je Woche.

   Nicht erster gegen letzter Wert: Tagesgewicht ist ueberwiegend Wasser und
   Glykogen, zwei Einzelwerte tragen die Aussage nicht.

   Und auch keine Ausgleichsgerade, obwohl sie naeher laege. Bei ihr haben die
   Punkte am Rand des Fensters die groesste Hebelwirkung - und der juengste
   Punkt ist immer ein Rand. Ein einzelner schwerer Tag nach einer langen
   Ausfahrt kippt damit die Aussage ueber drei Wochen. Der Median aller
   paarweisen Steigungen (Theil-Sen) haelt das aus: erst wenn rund ein Viertel
   der Werte danebenliegt, wandert er ueberhaupt. Bei hoechstens drei Wochen
   Fenster sind das ein paar hundert Paare, das faellt nicht auf. */
function median(v){
  const s = v.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function gewichtTrend(data){
  const punkte = wellnessZeilen(data)
    .filter(r => r.weight > 0)
    .map(r => ({ t: tagNummer(r.id), kg: r.weight }));
  if(punkte.length < WELL.gewichtMinPunkte) return null;

  const tage = punkte[punkte.length - 1].t - punkte[0].t;
  if(tage < WELL.gewichtMinTage) return null;

  const steigungen = [];
  for(let i = 0; i < punkte.length; i++){
    for(let j = i + 1; j < punkte.length; j++){
      const dt = punkte[j].t - punkte[i].t;
      if(dt > 0) steigungen.push((punkte[j].kg - punkte[i].kg) / dt);
    }
  }
  if(!steigungen.length) return null;

  /* Auch der Bezugswert als Median: ein Ausreisser darf weder die Steigung
     noch die Prozentangabe verschieben. */
  const schnitt = median(punkte.map(p => p.kg));
  if(!(schnitt > 0)) return null;

  const proWoche = median(steigungen) * 7;
  return { punkte: punkte.length, tage, schnitt, proWoche,
           prozentProWoche: proWoche / schnitt * 100 };
}

/* Bewusst kein Grund fuer ein rotes Gate.

   Das Gate entscheidet ueber den heutigen Qualitaetstag. Eine zu schnelle
   Abnahme ist eine Aussage ueber Wochen - haenge man sie in dieselbe Liste,
   stuende das Gate waehrend einer Diaet wochenlang auf rot, und ein Warnlicht,
   das immer leuchtet, liest niemand mehr. Deshalb eigener Hinweis. */
export function abnehmHinweis(data){
  const t = gewichtTrend(data);
  if(!t) return null;
  const rate = -t.prozentProWoche;
  if(!(rate >= WELL.abnehmProzentProWoche)) return null;
  const kg = (Math.round(Math.abs(t.proWoche) * 10) / 10).toString().replace('.', ',');
  const pz = (Math.round(rate * 10) / 10).toString().replace('.', ',');
  return {
    ...t, rate,
    text: 'Gewicht −' + kg + ' kg je Woche (' + pz + ' % über ' + t.tage + ' Tage). ' +
      'Über ' + String(WELL.abnehmProzentProWoche).replace('.', ',') +
      ' % je Woche fehlt im Aufbau die Energie für die Anpassung – und es drückt zuerst ' +
      'auf genau die Werte, die das Gate liest.'
  };
}

/* Heute, gestern und der Gewichtstrend in einem Durchgang - ein Abruf, drei
   Aussagen. Die Zwei-Tage-Regel steht im Trainingsplan (Abschnitt 4.10) und
   brauchte bisher nur deshalb keine Daten, weil sie niemand ausgewertet hat. */
export function wellnessSerie(data, todayIso){
  const heute = wellnessGate(data, todayIso);
  /* Gestern relativ zu der Zeile, die tatsaechlich als "heute" gilt - sonst
     zaehlt bei fehlendem Tagesdatensatz der falsche Vortag. */
  const gestern = heute ? wellnessGate(data, tagPlus(heute.heute.id, -1), true) : null;
  return {
    heute, gestern,
    zweiRot: !!(heute && heute.rot && gestern && gestern.rot),
    abnehmen: abnehmHinweis(data)
  };
}

/* Was ein rotes Gate konkret heisst - abhaengig davon, was der Donnerstag
   ueberhaupt vorsieht.

   Vorher stand hier ein fester Satz: "Donnerstag wird 60 min Z2". An einem
   Testdonnerstag ist der falsch (ein Test wird verschoben, nicht
   heruntergestuft - ein Wert von einem roten Tag bestimmt danach jede Zone),
   und an einem Z2-Donnerstag ist er eine Nullaenderung. */
export function wellnessMassnahmen(donnerstag, zweiRot){
  const m = [];
  if(donnerstag === 'test'){
    m.push('Den Schwellentest heute nicht fahren. Ein Wert von einem roten Tag fällt zu niedrig aus ' +
      'und bestimmt danach jede Zone – lieber ein bis zwei Tage später testen, notfalls in der Folgewoche.');
  } else if(donnerstag === 'z2'){
    m.push('Der Donnerstag ist ohnehin Z2 – herunterstufen lässt sich da nichts. ' +
      'Stattdessen die Dauer kürzen und den Samstag ohne Blöcke fahren.');
  } else {
    m.push('Donnerstag wird 60 min Z2, Samstag ohne Blöcke.');
  }
  m.push(zweiRot
    ? 'Zweiter roter Tag in Folge – die ganze Woche als Erholungswoche fahren, unabhängig von der Wochennummer.'
    : 'Zwei rote Tage hintereinander → die ganze Woche als Erholungswoche.');
  return m;
}

/* Die Verfassung am Tag einer Fahrt, aufbereitet fuer das Fazit.

   Absichtlich schon als Urteil und nicht als Rohwert: die Schwellen gehoeren
   an eine Stelle. Saehe das Fazit die Zahlen selbst, koennten Gate und Fazit
   denselben Tag verschieden bewerten. */
export function verfassungAus(data, tagIso){
  const g = wellnessGate(data, tagIso, true);
  if(!g) return null;
  return {
    rhrHoch: g.rhrHoch, hrvNiedrig: g.hrvNiedrig, kurzeNaechte: g.kurzeNaechte,
    rot: g.rot,
    restingHR: g.heute.restingHR || 0, rhrAvg: g.rhrAvg,
    hrv: g.heute.hrv || 0, hrvAvg: g.hrvAvg,
    sleepSecs: g.heute.sleepSecs || 0
  };
}
