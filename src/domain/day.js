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
  thursdayData, saturdayBlockData, dayOffset, testWeeks, testDateFor, thursdayDateFor
} from './week.js';
import {
  zoneText, zoneSpan, targetText, withCadence, wattText,
  distanceSuffix, estimateDistance, showsDistance, cadenceText
} from './zones.js';
import { coreWorkSeconds, coreRestSeconds, coreRounds, coreMinutes, legRounds,
         rundenText } from './core.js';

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

/* ---- Wochenumfang und Deckel ----

   Die Summe steht im Trainingsplan als Zeile "Soll" und wird hier gerechnet,
   nicht gepflegt. Der Deckel darueber ist seit Fassung 3 die erste
   Absicherung: er ersetzt die Ramp-Rate, die bei einer CTL um 10 nichts mehr
   aussagt - fuenf Punkte pro Woche sind dort eine Verdopplung der Grundlast.

   Der optionale Sonntag zaehlt mit, weil er in der Tabelle des Plans mitzaehlt.
   Der Freitag nicht: er ist eine Entscheidung, keine Vorgabe. */
export function weekPlanMinutes(plan, week){
  const w = plan.weeks[weekIndex(plan, week)];
  return w.tuesdayMinutes + w.wednesdayMinutes + thursdayPlan(plan, week).minutes
       + w.saturdayMinutes + w.sundayOptionalMinutes;
}

export function weekCapMinutes(plan, week){
  return Math.round(weekPlanMinutes(plan, week) * (1 + plan.volumeCapPercent / 100));
}

/* ---- Testanlauf ----

   Die Schritte haengen als Tagesabstand am Testtermin. Welcher Wochentag das
   ist, ergibt sich aus dem Startdatum - haette die Datei Wochentage genannt,
   liefen beide auseinander, sobald jemand den Planbeginn verschiebt.

   Rueckgabe auch am Testtag selbst, wo es keinen Schritt gibt: dort haengt die
   Go/No-Go-Liste dran. */
export function testTaperFor(plan, date, startDate){
  const tt = plan.testTaper;
  if(!tt || !Array.isArray(tt.steps)) return null;
  for(const w of testWeeks(plan)){
    const d = testDateFor(plan, w, startDate);
    const off = dayOffset(date, d);
    if(off > 1) continue;                 // dieser Test liegt zurueck
    if(off < -tt.leadDays) return null;   // der naechste ist noch zu weit weg
    return { week: w, date: d, offset: off,
             step: tt.steps.find(s => s.offsetDays === off) || null };
  }
  return null;
}

function deDatum(d){
  return String(d.getDate()).padStart(2, '0') + '.' +
         String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
}

function taperHinweis(plan, taper){
  const kopf = 'Testanlauf zum ' + deDatum(taper.date) + ' (Woche ' + taper.week + '): ';
  if(taper.step) return kopf + taper.step.label + ' – ' + taper.step.text;
  /* Am Testtag traegt die Karte die Go/No-Go-Liste, davor genuegt die
     Ankuendigung. Ein zweiter Satz daneben waere doppelt. */
  if(taper.offset < 0) return kopf + plan.testTaper.intro;
  return null;
}

/* "5,5 min" - der Erhaltungsreiz ist keine ganze Minute lang, und auf 6
   aufgerundet stuende in der Karte mehr, als der Plan verlangt. */
function minutenText(sek){
  return String(Math.round(sek / 6) / 10).replace('.', ',') + ' min';
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

/* Dauer eines Timerschritts. Die Datei darf "minutes" oder "seconds" nennen -
   ein Oeffner ueber 40 s laesst sich als 0,666 Minuten nicht hinschreiben. */
export function schrittSekunden(s){
  return typeof s.seconds === 'number' ? s.seconds : Math.round((s.minutes || 0) * 60);
}

/* Der Schwellentest steht in plan.json als Schrittliste fuer den Timer, und
   seit dem Anlauf tun es die Einheiten, die einen geplanten Tag ersetzen,
   ebenso. Fuer die Anzeige werden Wiederholungen wieder zu einer Zeile
   zusammengezogen - als sechs Einzelzeilen ist der Ablauf laenger als der Rest
   des Tages und verdeckt die Schritte, auf die es ankommt. */
function schrittBloecke(plan, th, week, steps){
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
        pause ? `${minutenText(schrittSekunden(pause))} locker (${testZone(plan, th, pause.zone, week)}) dazwischen.` : null,
        arbeit.note
      ].filter(Boolean).join(' ');
      out.push({
        label: `${s.reps}× ${ohneZaehler(arbeit.label)}`,
        wert: `${minutenText(schrittSekunden(arbeit))} · ${testZone(plan, th, arbeit.zone, week)}`,
        hinweis: hinweis || undefined
      });
      continue;
    }
    out.push({
      label: s.label,
      wert: `${minutenText(schrittSekunden(s))} · ${testZone(plan, th, s.zone, week)}`,
      hinweis: s.note || undefined
    });
    i += 1;
  }
  return out;
}

/* "Zuegig 1 / 3" heisst in der zusammengezogenen Zeile nur noch "Zuegig" - der
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

  /* Der Knochenreiz haengt am Mobility-Flow und ist ausdruecklich keine eigene
     Einheit: er zaehlt in der Wochenrechnung nicht mit und erzeugt keine
     messbare Erholungslast. Ausgelassen wird er an den Tagen, die die Datei
     nennt - im ausgelieferten Plan der Mittwoch, weil danach der Qualitaetstag
     kommt. */
  const bone = plan.bone;
  if(bone && (bone.skipWeekdays || []).indexOf(date.getDay()) < 0){
    out.push({
      label: bone.label,
      wert: bone.dosage,
      hinweis: `${bone.frequency} ${bone.note}`
    });
  }

  return out;
}

/* ---- Ein Tag je Funktion ----

   buildDayInfo war 255 Zeilen: ein switch ueber sieben Wochentage, jeder mit
   eigener Verzweigung nach Testwoche, Erholungswoche und Winterblock. Die
   Bausteinfunktionen darueber (rideKennzahlen, circuitBlock, testBloecke)
   zeigten schon, wohin die Reise geht - der Rest ist ihn jetzt gegangen.

   Alle sieben bekommen denselben Zusammenhang c und liefern dasselbe zurueck:
   ein info-Objekt mit type, title, detail und den drei Listen. Was danach fuer
   alle gilt - Woche, Phase, Sollwerte, Zusatzbloecke - fuellt buildDayInfo
   auf, damit kein Tag es vergessen kann. */

/* Montag ist die Invariante des Plans: er bleibt frei. */
function montag(c){
  return {
    type:'rest', title:'Ruhetag', detail:c.T.mondayRest,
    kennzahlen: [{ label:'Umfang', wert:'frei' }],
    bloecke: [],
    hinweise: [c.T.mondayRest]
  };
}

/* Dienstag: verlaengerter Arbeitsweg, gesteuert ueber die Zeit.

   Ab Woche 11 kommt abends die zweite Beineinheit dazu. Sie steht je Woche in
   plan.json und nicht als Phasenregel hier: massgeblich ist der Abstand zum
   Qualitaetstag, und der haengt daran, was am Donnerstag steht. */
function dienstag(c){
  const { plan, th, week, T, z2 } = c;
  const dur = c.w.tuesdayMinutes;
  const beine = c.w.tuesdayLegRounds || 0;

  const info = {
    type:'ride',
    title: beine > 0 ? 'Rad – Grundlagenausdauer (Z2) + Beinblock' : 'Rad – Grundlagenausdauer (Z2)',
    detail:`${dur} min${distanceSuffix(plan, dur, week)} · ${z2()}. ${T.tuesdayCommute}`,
    kennzahlen: rideKennzahlen(plan, th, week, dur, 'z2'),
    bloecke: [
      { label:'Grundlagenfahrt', wert:`${dur} min · ${z2()}`, hinweis:T.tuesdayCommute }
    ]
  };

  if(beine > 0){
    const nachsatz = `${T.legNoTimer}, ${plan.legs.durationHint}. ${T.legTuesdayNote}`;
    info.detail += ` Abends Beinblock: ${rundenText(beine)} ${plan.legs.shortList} – ${nachsatz}`;
    info.kennzahlen.push({ label:'Beinblock', wert:`${rundenText(beine)} (abends)` });
    info.bloecke.push({ label:'Beinblock (abends)',
      wert:`${rundenText(beine)} ${plan.legs.shortList}`, hinweis: nachsatz });
    info.showLegBtn = true;
  }
  return info;
}

/* Mittwoch: verkuerzter Zirkel, dazu in den meisten Wochen eine kurze Fahrt.

   Das Wellness-Gate steht schon hier, wie im Trainingsplan vorgesehen: wer
   erst Donnerstag frueh schaut, kann den Tag nur noch absagen. Die Art des
   Donnerstags haengt dran, weil sie entscheidet, was ein rotes Gate ueberhaupt
   bedeutet - ein Test wird verschoben, ein Intervalltag heruntergestuft, ein
   Z2-Tag gekuerzt. */
function mittwoch(c){
  const { plan, th, week, phase, exCount, T, z2 } = c;
  const dur = c.w.wednesdayMinutes;
  const rounds = plan.circuit.wednesdayRounds;
  const rumpf = `Abends Rumpf-Zirkel verkürzt: ${rounds} Runden à ${exCount} Übungen ` +
    `(${coreWorkSeconds(plan, week)} s Belastung / ${coreRestSeconds(plan, week)} s Pause), ` +
    `ca. ${coreMinutes(plan, week, rounds)} min. Kein Beinblock.`;
  const zirkel = circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (verkürzt)',
    'Abends. Kein Beinblock.');

  let info;
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

    /* Der Erhaltungsreiz der Phase 3 haengt an der Mittwochsfahrt und steht
       deshalb zwischen Fahrt und Zirkel, nicht als Fussnote darunter. */
    const extra = c.w.wednesdayExtra;
    if(extra){
      const sek = extra.reps * extra.workSeconds + (extra.reps - 1) * extra.restSeconds;
      const ablauf = `${extra.reps}× ${extra.workSeconds} s ${extra.effort} / ` +
                     `${extra.restSeconds} s ${extra.restEffort}`;
      info.detail += ` Dazu ${extra.label}: ${ablauf}, zusammen ca. ${minutenText(sek)}.`;
      info.kennzahlen.push({ label: extra.label, wert:`${extra.reps} × ${extra.workSeconds} s` });
      info.bloecke.splice(1, 0, { label: extra.label,
        wert:`${ablauf} · ca. ${minutenText(sek)}`, hinweis: extra.note });
    }
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
  info.wellness = { rolle:'vorschau', donnerstag: thursdayPlan(plan, week).kind };
  return info;
}

/* Donnerstag ist der Qualitaetstag - und je nach Woche ein Schwellentest, ein
   dritter Grundlagentag oder Intervalle. */
function donnerstag(c){
  const { plan, th, week, T, z2 } = c;
  const t = thursdayPlan(plan, week);
  let info;

  if(t.kind === 'test'){
    /* Der Schwellentest ist im Typ ein Intervalltag - die Ansicht behandelt
       ihn seit dem Kalenderumbau ueberall so. Als Einheit ist er aber keiner:
       er misst, statt zu belasten, und traegt deshalb ein eigenes Zeichen. */
    info = { type:'interval', art:'test', title:t.title, detail:T.thursdayTest,
             showIntervalBtn:true };
    info.kennzahlen = [
      { label:'Dauer',      wert: t.minutes + ' min' },
      { label:'Testfenster', wert:'20 min gleichmäßig maximal' },
      { label:'Zielzone',   wert: targetText(plan, th, t.zone, week) }
    ];
    info.bloecke = schrittBloecke(plan, th, week, plan.thresholdTest?.steps ?? []);
    info.hinweise = [T.thursdayTest];

    /* Die vier Punkte werden am Testmorgen abgehakt, nicht gelesen - deshalb
       eine eigene Liste und kein weiterer Absatz zwischen den Hinweisen. Der
       TSB steht bewusst nicht dabei: bei einer CTL um 10 waere er ein
       Kriterium, das den Test dauerhaft blockiert. */
    const tt = plan.testTaper;
    if(tt){
      info.checkliste = { titel: tt.goNoGoTitel, punkte: tt.goNoGo, note: tt.goNoGoNote };
      info.hinweise.push(tt.shiftRule);
    }
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
  return info;
}

/* Freitag ist frei oder locker - eine Entscheidung, keine Vorgabe. */
function freitag(c){
  const { plan, th, week } = c;
  const fo = plan.fridayOptional;
  return {
    type:'restopt', title:'Ruhetag oder lockere Fahrt',
    detail:`Optional ${fo.minMinutes}–${fo.maxMinutes} min ${zoneText(plan, th, fo.zone, week)}, sonst frei.`,
    kennzahlen: [
      { label:'Umfang',   wert:`optional ${fo.minMinutes}–${fo.maxMinutes} min` },
      { label:'Zielzone', wert: targetText(plan, th, fo.zone, week) }
    ],
    bloecke: [
      { label:'Lockere Fahrt (optional)',
        wert:`${fo.minMinutes}–${fo.maxMinutes} min · ${zoneText(plan, th, fo.zone, week)}`,
        hinweis:'Sonst frei.' }
    ]
  };
}

/* Samstag ist die lange Ausfahrt und der Beginn der Trainingswoche. */
function samstag(c){
  const { plan, th, week, recovery, T, z2 } = c;
  const dur = c.w.saturdayMinutes;
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

  const info = { type:'long', title:'Lange Ausfahrt',
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

  /* Die Hoehenmeter stehen als Kennzahl neben Dauer und Zielzone, nicht als
     Absatz darunter. Als Fliesstext waren es vier bis fuenf Zeilen auf der
     ohnehin laengsten Karte des Plans - die Vorgabe ist aber ein einziger
     Wert, den man vor dem Losfahren abliest. Die Begruendung steht im
     Dokument, nicht auf der Karte.

     Der Umschaltpunkt ist cogganFromWeek und nicht zufaellig derselbe wie beim
     Zonenmodell: beide haengen am Schwellentest. Bis dahin soll der Datensatz
     flach bleiben, danach wird ueber Watt gesteuert. */
  const vorTest = week < plan.cogganFromWeek;
  info.kennzahlen.push({ label:'Höhenmeter', wert: vorTest ? 'flach' : '50–100 hm' });
  if(!vorTest) info.hinweise = [T.elevationShort];
  return info;
}

/* Sonntag: voller Zirkel, direkt danach der Beinblock. */
function sonntag(c){
  const { plan, th, week, exCount, T } = c;
  const dur = c.w.sundayOptionalMinutes;
  const rounds = coreRounds(plan, week);
  return {
    type:'sun', title:'Rumpf-Zirkel (voll) + Beinblock',
    detail:`Rumpf-Zirkel: ${rounds} Runden à ${exCount} Übungen ` +
           `(${coreWorkSeconds(plan, week)} s Belastung / ${coreRestSeconds(plan, week)} s Pause), ` +
           `ca. ${coreMinutes(plan, week, rounds)} min. Direkt im Anschluss der Beinblock: ` +
           `${legRounds(plan, week)} Runden ${plan.legs.shortList} – ${T.legNoTimer}, ${plan.legs.durationHint}. ` +
           `${T.sundayLegOrder} ` +
           `Optional davor ${dur} min ${zoneText(plan, th, 'z1', week)} – ${T.sundayRideFirst}.`,
    showTimerBtn:true, showLegBlock:true,
    kennzahlen: [
      { label:'Dauer',     wert:'ca. ' + coreMinutes(plan, week, rounds) + ' min Zirkel' },
      { label:'Zirkel',    wert:`${rounds} Runden à ${exCount} Übungen` },
      { label:'Beinblock', wert:`${legRounds(plan, week)} Runden` },
      { label:'Takt',      wert:`${coreWorkSeconds(plan, week)} s / ${coreRestSeconds(plan, week)} s` }
    ],
    bloecke: [
      circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (voll)', T.sundayLegOrder),
      { label:'Beinblock', wert:`${legRounds(plan, week)} Runden ${plan.legs.shortList}`,
        hinweis:`${T.legNoTimer}, ${plan.legs.durationHint}.` },
      { label:'Rad (optional)', wert:`${dur} min · ${zoneText(plan, th, 'z1', week)}`,
        hinweis:`Davor – ${T.sundayRideFirst}.` }
    ]
  };
}

/* ---- Der Anlauf ersetzt den Tag ----

   Ein Schritt des Anlaufs kann in plan.json eine eigene Einheit tragen. Traegt
   er keine, bleibt es beim Hinweis - die meisten Anlauftage stehen ohnehin
   schon so im Plan: der Montag ist Ruhetag, der Samstag einer Testwoche ist
   reines Z2. Traegt er eine, ersetzt sie den geplanten Tag vollstaendig:
   Titel, Kennzahlen, Ablauf, Timer und Sollwert.

   Vorher hing der Anlauf als Satz unter einer Karte, die weiter 5 x 5 min Z3
   verlangte. Dreimal derselbe Fehler aus derselben Ursache: auf dem Rad wird
   der Satz nicht gelesen, der Intervalltimer zaehlte die Einheit, die
   ausfaellt, und die Auswertung zaehlte den tatsaechlich gefahrenen Anlauf
   danach als verfehltes Soll.

   Was ersetzt wurde, bleibt als `ersetzt` am Tag stehen. Ein Tausch, den man
   nicht sieht, ist von einem Fehler nicht zu unterscheiden. */

/* Eine Schrittfolge wie der Schwellentest: Anlauf im Testtempo, Oeffner am
   Vortag. Die Zahlen der Karte werden aus den Schritten gerechnet und nicht
   danebengeschrieben - sonst laufen Ablauf und Kennzahl auseinander. */
function anlaufSteps(c, sess){
  const { plan, th, week } = c;
  const arbeit = sess.steps.filter(x => x.type === 'work');
  const gesamt = sess.steps.reduce((n, x) => n + schrittSekunden(x), 0);
  const hart = arbeit.reduce((n, x) => n + schrittSekunden(x), 0);
  const zone = arbeit[0].zone;
  const bloecke = schrittBloecke(plan, th, week, sess.steps);

  const info = {
    type:'interval', art:'intervalle', title: sess.title,
    detail: bloecke.map(b => `${b.label}: ${b.wert}${b.hinweis ? '. ' + b.hinweis : '.'}`).join(' '),
    showIntervalBtn: true,
    kennzahlen: [
      { label:'Dauer',     wert: Math.round(gesamt / 60) + ' min' },
      { label:'Belastung', wert: `${arbeit.length} × ${minutenText(schrittSekunden(arbeit[0]))}` },
      { label:'Zielzone',  wert: targetText(plan, th, zone, week) }
    ],
    bloecke,
    hinweise: sess.note ? [sess.note] : [],
    target: { sport:'ride', zone, minutes: Math.round(gesamt / 60),
              hardMinutes: Math.round(hart / 60),
              reps: arbeit.length, repMinutes: schrittSekunden(arbeit[0]) / 60 }
  };
  const cad = cadenceText(plan, zone, week);
  if(cad) info.kennzahlen.push({ label:'Trittfrequenz', wert: cad });
  return info;
}

/* Eine Fahrt in einer Zone, sonst nichts.

   Ohne `minutes` bleibt die Dauer des geplanten Tages stehen: der Anlauf
   aendert an diesem Dienstag die Ausfuehrung und nicht den Umfang, und eine
   hier festgenagelte Zahl liefe gegen die wachsenden Wochenumfaenge der
   Retests. Was am geplanten Tag sonst noch stand, bleibt stehen - der
   Beinblock am Dienstag der spaeten Phasen wird vom Anlauf nicht abgesagt. */
function anlaufRide(c, sess, geplant){
  const { plan, th, week } = c;
  const zt = geplant.target || {};
  const min = sess.minutes ?? zt.minutes ?? zt.rideMinutes;
  const zone = sess.zone;
  const zText = withCadence(plan, targetText(plan, th, zone, week), zone, week);

  const info = {
    type:'ride', title: sess.title,
    detail: `${min} min${distanceSuffix(plan, min, week)} · ${zText}. ${sess.note || ''}`.trim(),
    kennzahlen: rideKennzahlen(plan, th, week, min, zone),
    bloecke: [{ label:'Fahrt', wert:`${min} min · ${zText}`, hinweis: sess.note || undefined }],
    target: { ...zt, sport:'ride', minutes: min, zone, km: estimateDistance(plan, min, week) }
  };

  if(zt.legRounds > 0){
    const nachsatz = `${c.T.legNoTimer}, ${plan.legs.durationHint}. ${c.T.legTuesdayNote}`;
    info.kennzahlen.push({ label:'Beinblock', wert:`${rundenText(zt.legRounds)} (abends)` });
    info.bloecke.push({ label:'Beinblock (abends)',
      wert:`${rundenText(zt.legRounds)} ${plan.legs.shortList}`, hinweis: nachsatz });
    info.showLegBtn = true;
  }
  return info;
}

/* Ruhe heisst Ruhe. Der Freitag im Anlauf ist deshalb 'rest' und nicht
   'restopt': die optionale Fahrt ist genau das, was hier entfaellt. */
function anlaufRest(c, sess){
  return {
    type:'rest', title: sess.title,
    detail: sess.note || 'Ruhe.',
    kennzahlen: [{ label:'Umfang', wert:'frei' }],
    bloecke: [],
    hinweise: sess.note ? [sess.note] : [],
    target: { sport:'rest' }
  };
}

/* Zirkel ohne Beinblock. Die optionale Fahrt entfaellt mit: der Schritt heisst
   "nur Rumpf-Zirkel", und ein optionales Angebot daneben waere ein zweites. */
function anlaufCore(c, sess){
  const { plan, week, exCount } = c;
  const rounds = sess.rounds ?? coreRounds(plan, week);
  const work = coreWorkSeconds(plan, week), rest = coreRestSeconds(plan, week);
  const min = coreMinutes(plan, week, rounds);
  return {
    type:'core', title: sess.title,
    detail: `Rumpf-Zirkel: ${rounds} Runden à ${exCount} Übungen (${work} s Belastung / ${rest} s Pause), ` +
            `ca. ${min} min. ${sess.note || ''}`.trim(),
    showTimerBtn: true,
    kennzahlen: [
      { label:'Dauer',  wert:'ca. ' + min + ' min' },
      { label:'Umfang', wert:`${rounds} Runden à ${exCount} Übungen` },
      { label:'Takt',   wert:`${work} s / ${rest} s` }
    ],
    bloecke: [circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (voll)', sess.note)],
    target: { sport:'core', rounds, minutes: min, workSec: work, restSec: rest, legRounds: 0 }
  };
}

const ANLAUF_ARTEN = { steps: anlaufSteps, ride: anlaufRide, rest: anlaufRest, core: anlaufCore };

function anlaufEinheit(c, taper, geplant){
  const sess = taper.step.session;
  const bau = ANLAUF_ARTEN[sess.kind];
  /* Eine Art, die diese Fassung nicht kennt, laesst den geplanten Tag stehen.
     Der Hinweis darunter nennt den Anlauf weiterhin im Wortlaut - lieber der
     geplante Tag mit einem Satz daneben als eine leere Karte. */
  if(!bau) return geplant;
  const info = bau(c, sess, geplant);
  info.ersetzt = { titel: geplant.title, grund: 'Testanlauf zum ' + deDatum(taper.date) };
  /* Das Wellness-Gate haengt am Wochentag und nicht an der Einheit: der
     Mittwoch vor dem Test zeigt weiter die Vorschau, der Donnerstag die
     Entscheidung. */
  if(!info.wellness && geplant.wellness) info.wellness = geplant.wellness;
  return info;
}

/* Die Anlauffolge eines Tages - fuer den Intervalltimer. Nur Schrittfolgen:
   eine Ruhe- oder Zirkeleinheit hat im Intervalltimer nichts zu zaehlen. */
export function anlaufSchritte(plan, date, startDate){
  if(!date || !startDate) return null;
  const t = testTaperFor(plan, date, startDate);
  const sess = t && t.step && t.step.session;
  return sess && sess.kind === 'steps' ? { session: sess, taper: t } : null;
}

/* Dieselbe Folge am Donnerstag einer Woche, fuer den Timer, der seine Vorgabe
   an der Wochennummer holt und nicht an einem Datum. */
export function thursdayAnlauf(plan, week, startDate){
  if(!startDate) return null;
  return anlaufSchritte(plan, thursdayDateFor(plan, week, startDate), startDate);
}

/* Vom Tagestyp zur Einheitsart.

   Der Typ beschreibt, was die Ansicht mit dem Tag macht - 'ride' bekommt eine
   Fahrtkarte, 'rest' eine gedaempfte Ueberschrift. Die Art beschreibt, was
   trainiert wird, und das ist nicht dasselbe: Dienstag, Mittwoch und der
   Grundlagen-Donnerstag sind alle 'ride', aber ein Tag mit Intervallen ist es
   ebenso wenig wie der Schwellentest, der als 'interval' gefuehrt wird. Nur wo
   der Typ die Art nicht traegt, setzt der Tag sie selbst (siehe donnerstag).

   Sonntag traegt den vollen Zirkel und den Beinblock, Mittwoch den verkuerzten
   - beides ist Rumpf und Kraft, und zwei Zeichen dafuer wuerden einen
   Unterschied behaupten, den der Plan an dieser Stelle nicht macht. */
const ART_JE_TYP = {
  rest:     'ruhe',
  restopt:  'locker',
  ride:     'z2',
  long:     'lang',
  interval: 'intervalle',
  core:     'rumpf',
  sun:      'rumpf'
};

/* getDay() zaehlt ab Sonntag. */
const TAGE = [sonntag, montag, dienstag, mittwoch, donnerstag, freitag, samstag];

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

  const c = {
    plan, th, week,
    w: plan.weeks[weekIndex(plan, week)],
    phase: phaseOf(plan, week),
    recovery: isRecoveryWeek(plan, week),
    winter: isWinterBlock(plan, week),
    exCount: plan.circuit.exercises.length,
    T: plan.texts,
    z2: () => withCadence(plan, targetText(plan, th, 'z2', week), 'z2', week)
  };

  const geplant = TAGE[date.getDay()](c);
  geplant.target = buildDayTarget(plan, date, week);

  /* Der Anlauf kann den geplanten Tag ersetzen, und zwar bevor die
     gemeinsamen Felder gefuellt werden: sonst traegt die Ersatzeinheit die
     Einheitsart und die Sollwerte des Tages, den sie abloest. */
  const taper = vorStart ? null : testTaperFor(plan, date, startDate);
  const info = taper && taper.step && taper.step.session
    ? anlaufEinheit(c, taper, geplant)
    : geplant;

  info.week = week;
  info.vorStart = vorStart;
  info.phase = c.phase;
  info.recovery = c.recovery;
  info.winter = c.winter;

  /* Hier aufgefuellt und nicht in den sieben Funktionen, damit die Anzeige nie
     auf undefined stoesst - und damit ein spaeter ergaenzter Tagestyp nicht
     stillschweigend ohne Struktur durchlaeuft. */
  info.art = info.art ?? ART_JE_TYP[info.type] ?? 'sonstige';
  info.kennzahlen = info.kennzahlen ?? [];
  info.bloecke = info.bloecke ?? [];
  info.hinweise = info.hinweise ?? [];
  info.zusatz = zusatzBloecke(plan, date, startDate);

  /* Der Testanlauf steht an dem Tag, fuer den er gilt, und nicht als Liste in
     der Statuskarte. Eine Vorgabe fuer den kommenden Dienstag nuetzt am
     Dienstag etwas, nicht heute. */
  if(taper){
    info.testTaper = taper;
    const satz = taperHinweis(plan, taper);
    if(satz) info.hinweise.push(satz);
  }
  return info;
}


/* Maschinenlesbare Sollwerte je Tag. Dauer in Minuten, Distanz in km, zone als
   Schluessel aus den Pulsbaendern. */
function buildDayTarget(plan, date, week){
  const idx = weekIndex(plan, week);
  const w = plan.weeks[idx];
  const recovery = isRecoveryWeek(plan, week);

  switch(date.getDay()){
    case 1:
      return { sport:'rest' };

    case 2:
      /* legRounds steht auch am Dienstag im Soll, sobald die Woche eine zweite
         Beineinheit vorsieht - sonst waere sie in der Anzeige geplant und in
         der Auswertung nicht vorhanden. */
      return { sport:'ride', minutes:w.tuesdayMinutes,
               km:estimateDistance(plan, w.tuesdayMinutes, week), zone:'z2', commute:true,
               legRounds: w.tuesdayLegRounds || 0 };

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
