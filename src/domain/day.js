/* Was an einem Tag ansteht - als Struktur fuer die Anzeige und als Zahlen fuer
   die Auswertung.

   Beides entsteht hier nebeneinander, damit der Abgleich mit intervals.icu
   keinen Fliesstext parsen muss. Die Fachtexte kommen aus plan.json; nur die
   Satzgerueste mit eingerechneten Zahlen stehen hier - sie in die Datei zu
   heben haette eine Vorlagensprache gebraucht und damit JavaScript nachgebaut.

   Bis zum 04.09.2026 entstand die Beschreibung doppelt: `detail` als ein
   Satzband, wie es die erste Fassung geschrieben hat, und daneben
   `kennzahlen` / `bloecke` / `zusatz` / `hinweise` als Struktur. Das Satzband
   blieb stehen, weil test/domain.test.js Pruefsummen darueber bildete und es
   der einzige Regressionsschutz des Projekts war - es aufzugeben hiesse, ihn
   aufzugeben.

   Der Ausweg war, die Pruefsummen umzuhaengen statt sie zu verlieren: sie
   liegen jetzt auf der Struktur, und die ist der staerkere Nachweis. Sie
   traegt jede Zahl, die im Satzband stand, und zusaetzlich, an welcher
   Einheit sie haengt, zu welcher Tageszeit und mit welchem Timer. Umgehaengt
   wurde vor dem Entfernen; die Abzuege danach waren Zeichen fuer Zeichen
   dieselben - der Beweis, dass das Satzband reine Doppelarbeit war.

   Zwanzig Erzeugungsstellen gegen einen Leser: `detail` wurde in der ganzen
   App nur noch von der Glocke gelesen, und dort stand der Zirkel des
   Mittwochs als Nebensatz am Ende. Genau dieser Fall war der Anlass, die
   Einheiten ueberhaupt einzufuehren.

   `bloecke` ist bewusst eine flache Liste benannter Abschnitte und keine feste
   Form aus Aufwaermen / Belastung / Ausfahren. Die spaeteren Wochen bringen
   VO2max-Serien, Schwellenbloecke ueber 10 bis 12 Minuten, Z3-Bloecke
   innerhalb der langen Ausfahrt und den Schwellentest mit zwoelf Schritten
   mit; eine Liste traegt alle davon, eine feste Form haette fuer jeden Fall
   ein eigenes Feld gebraucht.

   Seit dem 03.09.2026 steht ueber diesen Listen die `einheiten` eines Tages.
   Vier Tage der Woche tragen mehr als eine: der Dienstag ab Woche 11 die
   Fahrt und abends den Beinblock, der Mittwoch die Fahrt und abends den
   Zirkel, der Sonntag Zirkel, Beinblock und davor die optionale Fahrt.
   Bis dahin standen sie als ein Satzteil im Titel ("+ Rumpf") und als eine
   Zeile unter vier anderen im Ablauf - und wurden genau deshalb uebersehen.
   Eine zweite Einheit am selben Tag ist aber keine Fussnote der ersten: sie
   hat eine eigene Tageszeit, eine eigene Dauer, einen eigenen Timer und faellt
   aus, ohne dass die erste es merkt.

   `kennzahlen`, `bloecke` und `hinweise` des Tages entstehen deshalb nicht
   von Hand, sondern durch Aneinanderhaengen der Einheiten. Es gibt sie nur
   einmal, und keine Einheit kann in der einen Liste stehen und in der
   anderen fehlen. */

import {
  weekNumberFor, weekIndex, phaseOf, isRecoveryWeek, isWinterBlock,
  thursdayData, saturdayBlockData, tagDaten, dayOffset, testWeeks, testDateFor,
  thursdayDateFor, isoDayLocal
} from './week.js';
import {
  zoneText, zoneSpan, targetText, withCadence, wattText,
  estimateDistance, showsDistance, cadenceText
} from './zones.js';
import { coreWorkSeconds, coreRestSeconds, coreRounds, coreMinutes, legRounds,
         rundenText } from './core.js';
/* Die Zeitformate stehen seit dem 04.09.2026 in zeit.js - dieselben, die der
   Testbereich und die Auswertung benutzen. schrittSekunden und
   schritteMinuten werden hier weitergereicht, weil die Aufrufer sie bis
   hierher aus day.js geholt haben und sie inhaltlich zum Planschritt
   gehoeren. */
import { minutenText, schrittSekunden, schritteMinuten } from './zeit.js';
export { schrittSekunden, schritteMinuten };

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

/* Die Variante eines Donnerstags - eine zweite zulaessige Form desselben Tages.

   Im ausgelieferten Plan gibt es genau eine: die VO2max-Referenz in Woche 5.
   Der Trainingsplan verlegt den 5-min-Maximalversuch aus dem Schwellentest
   dorthin, wo er als erste Wiederholung der ersten Intervalleinheit
   mitgefahren wird - und laesst zugleich offen, ob er ueberhaupt erhoben wird
   ("Kuer, nicht Pflicht").

   Deshalb eine Variante neben dem Regelfall und kein zweiter Donnerstag: der
   Tag hat zwei zulaessige Formen, und welche gilt, entscheidet der Nutzer am
   Tag selbst. Ohne Entscheidung gilt der Regelfall. */
export function thursdayVariante(plan, week){
  return thursdayData(plan, week).variante || null;
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
/* Die Wochensumme rechnet mit der Variante, wo es eine gibt.

   Nicht mit der Entscheidung des Nutzers: weekPlanMinutes ist eine reine
   Funktion ueber Plan und Wochennummer und kennt weder Datum noch Zustand.
   Sie davon abhaengig zu machen hiesse, den Umfangsdeckel von einer
   Tagesentscheidung abhaengig zu machen - fuer zwei Minuten, die unter seiner
   Aufloesung liegen. Der Trainingsplan nennt die Wochensumme ebenso mit
   Variante. */
export function weekPlanMinutes(plan, week){
  const tage = plan.weeks[weekIndex(plan, week)].tage;
  const v = thursdayVariante(plan, week);
  const donnerstag = v ? schritteMinuten(v.steps) : thursdayPlan(plan, week).minutes;
  return tage.di.minutes + tage.mi.minutes + donnerstag
       + tage.sa.minutes + tage.so.optionalMinutes;
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

/* Die Belastungen einer Schrittfolge in einem Satzteil: "2× 6 min", aber auch
   "5 min + 4× 4 min".

   Gebraucht, seit die VO2max-Variante ungleiche Bloecke hat: der
   Maximalversuch zaehlt als erste Wiederholung, ist aber eine Minute laenger
   als die vier danach. "5× 5 min" waere dort falsch, und genau das haette die
   Auswertung bis dahin geschrieben. */
function ablaufText(sekunden){
  const teile = [];
  for(const s of sekunden){
    const letzte = teile[teile.length - 1];
    if(letzte && letzte.sek === s) letzte.n += 1;
    else teile.push({ sek: s, n: 1 });
  }
  return teile.map(t => (t.n > 1 ? t.n + '× ' : '') + minutenText(t.sek)).join(' + ');
}

/* ---- Bausteine der strukturierten Beschreibung ---- */

/* Eine Einheit des Tages.

   `zeit` steht nur da, wo der Plan sie nennt - "abends" beim Zirkel und beim
   Beinblock, "davor" bei der optionalen Sonntagsfahrt. Eine erfundene
   Tageszeit an der Hauptfahrt waere eine Vorgabe, die der Plan nicht macht.

   `timer` nennt den Bereich, in dem die Uhr fuer diese Einheit steht, und die
   Art, damit die Tageskarte den Knopf an die richtige Einheit haengt. Vorher
   hingen die drei Knoepfe am Tag: der Mittwoch bot einen "Rumpf-Timer" unter
   einer Karte, die mit der Fahrt begann. */
function einheit(e){
  return {
    art: e.art, titel: e.titel, zeit: e.zeit || null,
    kennzahlen: e.kennzahlen || [], bloecke: e.bloecke || [],
    hinweise: (e.hinweise || []).filter(Boolean),
    timer: e.timer || null
  };
}

const TIMER_RUMPF      = { art:'rumpf',      ziel:'training',   label:'Rumpf-Timer öffnen' };
const TIMER_BEINE      = { art:'beine',      ziel:'training',   label:'Beinblock öffnen' };
const TIMER_INTERVALLE = { art:'intervalle', ziel:'intervalle', label:'Intervall-Timer öffnen' };
const TIMER_TEST       = { art:'test',       ziel:'test',       label:'Testablauf öffnen' };

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
        pause ? `${minutenText(schrittSekunden(pause))} locker (${schrittZiel(plan, th, pause, week)}) dazwischen.` : null,
        pause ? pause.note : null,
        arbeit.note
      ].filter(Boolean).join(' ');
      out.push({
        label: `${s.reps}× ${ohneZaehler(arbeit.label)}`,
        wert: `${minutenText(schrittSekunden(arbeit))} · ${schrittZiel(plan, th, arbeit, week)}`,
        hinweis: hinweis || undefined
      });
      continue;
    }
    out.push({
      label: s.label,
      wert: `${minutenText(schrittSekunden(s))} · ${schrittZiel(plan, th, s, week)}`,
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

/* Woran sich ein Schritt bemisst.

   Nennt er eine Anstrengung, steht sie da und nicht das Pulsband. Beim
   Schwellentest waere das Band zirkulaer - er erzeugt die LTHR, aus der es
   spaeter gerechnet wird -, und die Uebergangsbaender bis dahin stehen im
   Trainingsplan ausdruecklich als Arbeitsannahme aus einer ungeprueften
   HFmax. Bei sechs Minuten hinkt der Puls ohnehin hinterher, bei einer
   Minute sagt er gar nichts. Z4 traegt der Schritt weiterhin, aber als
   Beschreibung fuer Ringfarbe und Auswertung - das Dokument fuehrt die Zone
   als "im Plan nicht angesteuert", und angesteuert wird sie jetzt auch
   nicht mehr.

   Einfahren und Ausrollen behalten ihr Band: Z1 ist eine Obergrenze, die man
   einhalten kann und soll. */
function schrittZiel(plan, th, s, week){
  return s.effort || testZone(plan, th, s.zone, week);
}

/* Beweglichkeit und Koordination haengen an keiner Woche und an keiner Phase.

   "Jeder zweite Tag" laesst sich nicht als feste Wochentage schreiben: sieben
   ist ungerade, ein Zweitagestakt verschiebt sich also von Woche zu Woche.
   Deshalb wird ab dem Planbeginn durchgezaehlt - dieselbe Rechnung, aus der
   auch die Wochennummer entsteht. */
export function isCoordinationDay(plan, date, startDate){
  return koordinationsRest(plan, date, startDate) === 0;
}

/* Wie weit der heutige Tag vom Takt entfernt ist: 0 heisst "heute dran", n-1
   heisst "morgen wieder".

   Steht hier und nicht in der Ansicht. Die Koordinationskarte hat denselben
   Rest bis hierher selbst gerechnet - samt einer eigenen Fassung von
   dayOffset daneben -, und damit lag die Frage "ist heute Koordinationstag?"
   an zwei Stellen mit zwei Rechnungen. Sie muessen dieselbe Antwort geben:
   die Tageskarte haengt den Block an, die Karte sagt, ob er ansteht.

   null, wo sich nichts rechnen laesst - ohne Startdatum oder ohne Takt in der
   Datei. Die Ansicht sagt das dann und behauptet keinen Rhythmus. */
export function koordinationsRest(plan, date, startDate){
  const n = plan.coordination?.everyNthDay;
  if(!(n > 0) || !date || !startDate) return null;
  const tage = dayOffset(date, startDate);
  return (((tage % n) + n) % n);
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
   ein info-Objekt mit type, title und den Einheiten des Tages. Was
   danach fuer alle gilt - Woche, Phase, Sollwerte, Zusatzbloecke und die drei
   zusammengehaengten Listen - fuellt buildDayInfo auf, damit kein Tag es
   vergessen kann. */

/* Montag ist die Invariante des Plans: er bleibt frei. */
function montag(c){
  return {
    type:'rest', title:'Ruhetag',
    einheiten: [einheit({
      art:'ruhe', titel:'Ruhetag',
      kennzahlen: [{ label:'Umfang', wert:'frei' }],
      hinweise: [c.T.mondayRest]
    })],
    target: { sport:'rest' }
  };
}

/* Dienstag: verlaengerter Arbeitsweg, gesteuert ueber die Zeit.

   Ab Woche 11 kommt abends die zweite Beineinheit dazu. Sie steht je Woche in
   plan.json und nicht als Phasenregel hier: massgeblich ist der Abstand zum
   Qualitaetstag, und der haengt daran, was am Donnerstag steht. */
function dienstag(c){
  const { plan, th, week, T, z2 } = c;
  const tag = c.tag('di');
  const dur = tag.minutes;
  const beine = tag.legRounds || 0;

  const info = {
    type:'ride',
    title: beine > 0 ? 'Rad – Grundlagenausdauer (Z2) + Beinblock' : 'Rad – Grundlagenausdauer (Z2)',
    einheiten: [einheit({
      art:'z2', titel:'Rad – Grundlagenausdauer (Z2)',
      kennzahlen: rideKennzahlen(plan, th, week, dur, 'z2'),
      bloecke: [
        { label:'Grundlagenfahrt', wert:`${dur} min · ${z2()}`, hinweis:T.tuesdayCommute }
      ]
    })],
    /* legRounds steht auch am Dienstag im Soll, sobald die Woche eine zweite
       Beineinheit vorsieht - sonst waere sie in der Anzeige geplant und in
       der Auswertung nicht vorhanden. */
    target: { sport:'ride', minutes: dur, km: estimateDistance(plan, dur, week),
              zone:'z2', commute:true, legRounds: beine }
  };

  if(beine > 0){
    const nachsatz = `${T.legNoTimer}, ${plan.legs.durationHint}. ${T.legTuesdayNote}`;
    info.einheiten.push(beinEinheit(c, beine, nachsatz));
  }
  return info;
}

/* Der Beinblock als eigene Einheit - am Dienstagabend wie am Sonntag.

   Er stand bisher als eine Zeile im Ablauf der Fahrt, obwohl er Stunden
   spaeter stattfindet, kein Rad braucht und ohne Timer laeuft. */
function beinEinheit(c, runden, nachsatz, zeit){
  const { plan } = c;
  return einheit({
    art:'rumpf', titel:'Beinblock', zeit: zeit || 'abends',
    kennzahlen: [{ label:'Umfang', wert: rundenText(runden) }],
    bloecke: [{ label:'Beinblock',
      wert:`${rundenText(runden)} ${plan.legs.shortList}`, hinweis: nachsatz }],
    timer: TIMER_BEINE
  });
}

/* Mittwoch: verkuerzter Zirkel, dazu in den meisten Wochen eine kurze Fahrt.

   Das Wellness-Gate steht schon hier, wie im Trainingsplan vorgesehen: wer
   erst Donnerstag frueh schaut, kann den Tag nur noch absagen. Die Art des
   Donnerstags haengt dran, weil sie entscheidet, was ein rotes Gate ueberhaupt
   bedeutet - ein Test wird verschoben, ein Intervalltag heruntergestuft, ein
   Z2-Tag gekuerzt.

   "Kein Beinblock" stand bis zum 04.09.2026 als deutscher Satz in dieser
   Datei, obwohl plan.json ihn unter texts.legWednesdayNote fuehrt - dort
   ausfuehrlicher, samt der Regel, dass ein ausgefallener Sonntag nicht auf
   den Mittwoch nachgeholt wird. Der Text stand also in der Datei und wurde
   nirgends gelesen, waehrend der Code eine kuerzere Fassung davon
   nachbaute. Jetzt gilt der Plantext, und der Nachsatz am Block nennt nur
   noch die Tageszeit. */
function mittwoch(c){
  const { plan, th, week, phase, exCount, T, z2 } = c;
  const dur = c.tag('mi').minutes;
  const rounds = plan.circuit.wednesdayRounds;
  const zirkel = circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (verkürzt)', 'Abends.');

  /* Der Zirkel als eigene Einheit und nicht als letzte Zeile im Ablauf der
     Fahrt. Genau dieser Fall war der Anlass des Umbaus: unter einer Karte mit
     der Ueberschrift "Rad – kurzes Z2 (Arbeitsweg) + Rumpf" stand der Zirkel
     als eine von drei Ablaufzeilen und wurde uebersehen. */
  const zirkelEinheit = einheit({
    art:'rumpf', titel:'Rumpf-Zirkel (verkürzt)', zeit:'abends',
    kennzahlen: [
      { label:'Dauer',  wert:'ca. ' + coreMinutes(plan, week, rounds) + ' min' },
      { label:'Umfang', wert:`${rounds} Runden à ${exCount} Übungen` },
      { label:'Takt',   wert:`${coreWorkSeconds(plan, week)} s / ${coreRestSeconds(plan, week)} s` }
    ],
    bloecke: [zirkel],
    hinweise: [T.legWednesdayNote],
    timer: TIMER_RUMPF
  });

  let info;
  if(dur > 0){
    const lockerer = phase === 3 ? T.wednesdayEasyPhase3 : T.wednesdayEasyDefault;
    info = { type:'ride', title:'Rad – kurzes Z2 (Arbeitsweg) + Rumpf' };
    const kennzahlen = rideKennzahlen(plan, th, week, dur, 'z2');
    /* Die Dauer ist eine Untergrenze, keine Vorgabe - das muss schon in der
       Kennzahl stehen und nicht erst im Hinweis darunter. */
    kennzahlen[0] = { label:'Dauer', wert:`mindestens ${dur} min` };
    const bloecke = [
      { label:'Fahrt (Arbeitsweg)', wert:`mindestens ${dur} min direkte Strecke · ${z2()}`,
        hinweis:`${T.wednesdayMinimum} ${lockerer}` }
    ];

    /* Der Erhaltungsreiz der Phase 3 haengt an der Mittwochsfahrt und steht
       deshalb in ihrer Einheit, nicht als Fussnote unter dem Tag. */
    const extra = c.tag('mi').extra;
    if(extra){
      const sek = extra.reps * extra.workSeconds + (extra.reps - 1) * extra.restSeconds;
      const ablauf = `${extra.reps}× ${extra.workSeconds} s ${extra.effort} / ` +
                     `${extra.restSeconds} s ${extra.restEffort}`;
      kennzahlen.push({ label: extra.label, wert:`${extra.reps} × ${extra.workSeconds} s` });
      bloecke.push({ label: extra.label,
        wert:`${ablauf} · ca. ${minutenText(sek)}`, hinweis: extra.note });
    }

    /* Die Kadenzpyramide gehoert an das Einfahren dieser Fahrt - so steht sie
       im Plan ("als Teil des Einfahrens am Mittwoch, alle ein bis zwei
       Wochen"). Bis zum 04.09.2026 stand sie in plan.json und wurde von
       nirgendwo gelesen: ein Textbaustein, den die Planpruefung als Pflicht
       erzwang und den kein Nutzer je zu sehen bekam. */
    info.einheiten = [
      einheit({ art:'z2', titel:'Rad – kurzes Z2 (Arbeitsweg)', kennzahlen, bloecke,
                hinweise: [T.cadencePyramid] }),
      zirkelEinheit
    ];
  } else {
    info = { type:'core', title:'Rumpf/Oberkörper-Stabilität' };
    info.einheiten = [einheit({
      art:'rumpf', titel:'Rumpf/Oberkörper-Stabilität',
      kennzahlen: zirkelEinheit.kennzahlen,
      bloecke: zirkelEinheit.bloecke,
      /* Die Beinblock-Regel gilt auch am Mittwoch ohne Fahrt - sie haengt am
         Zirkel und nicht am Rad. Sie hier zu vergessen hiesse, den Hinweis
         genau an den Tagen fallen zu lassen, an denen der Zirkel allein
         dasteht. */
      hinweise: [T.wednesdayNoRide, ...zirkelEinheit.hinweise],
      timer: TIMER_RUMPF
    })];
  }

  /* Der Zirkel ist der Sollwert des Tages, die Fahrt kommt als Untergrenze
     dazu. Laenger zu fahren darf keine Warnung ausloesen; die Toleranz gilt
     nur nach unten. */
  info.target = { sport:'core', rounds, minutes: coreMinutes(plan, week, rounds),
                  workSec: coreWorkSeconds(plan, week),
                  restSec: coreRestSeconds(plan, week), legRounds: 0 };
  if(dur > 0){
    info.target.rideMinutes = dur;
    info.target.rideZone = 'z2';
    info.target.rideMinimum = true;
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
    info = { type:'interval', art:'test', title:t.title };
    /* Keine Zielzone auf der Karte des Tests: der Ø-Puls der 20 min ist sein
       Ergebnis. Ein Band als Vorgabe hiesse, auf die Zahl zu zielen, die
       gerade gemessen wird. */
    const steuer = plan.thresholdTest && plan.thresholdTest.steering;
    const hinweise = [T.thursdayTest];

    /* Die vier Punkte werden am Testmorgen abgehakt, nicht gelesen - deshalb
       eine eigene Liste und kein weiterer Absatz zwischen den Hinweisen. Der
       TSB steht bewusst nicht dabei: bei einer CTL um 10 waere er ein
       Kriterium, das den Test dauerhaft blockiert. */
    const tt = plan.testTaper;
    if(tt){
      info.checkliste = { titel: tt.goNoGoTitel, punkte: tt.goNoGo, note: tt.goNoGoNote };
      hinweise.push(tt.shiftRule);
    }

    /* Der Testtag fuehrt in den Testbereich und nicht in den Intervalltimer.
       Dort steht der Ablauf mit Anleitung, Go/No-Go und der Eingabe von FTP
       und LTHR - der Intervalltimer zaehlt nur die Schritte. */
    info.einheiten = [einheit({
      art:'test', titel:t.title,
      kennzahlen: [
        { label:'Dauer',       wert: t.minutes + ' min' },
        { label:'Testfenster', wert:'20 min gleichmäßig maximal' },
        steuer ? { label:'Steuergröße', wert: steuer }
               : { label:'Zielzone',    wert: targetText(plan, th, t.zone, week) }
      ],
      bloecke: schrittBloecke(plan, th, week, plan.thresholdTest?.steps ?? []),
      hinweise,
      timer: TIMER_TEST
    })];
  } else if(t.kind === 'z2'){
    info = { type:'ride', title:t.title };
    info.einheiten = [einheit({
      art:'z2', titel:t.title,
      kennzahlen: rideKennzahlen(plan, th, week, t.minutes, 'z2'),
      bloecke: [
        { label:'Grundlagenfahrt', wert:`${t.minutes} min · ${z2()}`, hinweis:T.thursdayBaseDay }
      ]
    })];
  } else {
    const zt = withCadence(plan, targetText(plan, th, t.zone, week), t.zone, week);
    const pw = t.power ? ` (${t.power})` : '';
    info = { type:'interval', title:t.title };
    const kennzahlen = [
      { label:'Dauer',           wert: t.minutes + ' min' },
      { label:'Wiederholungen',  wert:`${t.reps} × ${t.workMin} min` },
      { label:'Zielzone',        wert: targetText(plan, th, t.zone, week) }
    ];
    if(t.power) kennzahlen.push({ label:'Leistung', wert: t.power });
    const cad = cadenceText(plan, t.zone, week);
    if(cad) kennzahlen.push({ label:'Trittfrequenz', wert: cad });
    info.einheiten = [einheit({
      art:'intervalle', titel:t.title, kennzahlen,
      bloecke: [
        { label:'Einfahren',
          wert:`${plan.interval.warmupMinutes} min · ${zoneSpan(plan, th, 'z1', 'z2', week)}` },
        { label:`${t.reps}× ${t.workMin} min Belastung`, wert:`${zt}${pw}`,
          hinweis:`Rollender Start, Bewertungsfenster ab Minute ${t.phase === 1 ? 3 : 2}. ` +
                  T.thursdayIntervalTail },
        { label:'Pause',
          wert:`je ${t.restMin} min locker · ${zoneText(plan, th, 'z1', week)}`,
          hinweis:'Zwischen den Wiederholungen.' },
        { label:'Ausrollen', wert:`${plan.interval.cooldownMinutes} min` }
      ],
      timer: TIMER_INTERVALLE
    })];
  }
  /* Der Sollwert des Qualitaetstags haengt an seiner Art. Beim Test sind es
     seit Fassung 4 nur noch die 20 Minuten - der 5-min-All-out davor ist
     gestrichen, und 25 stehenzulassen hiesse, einen sauber gefahrenen Test
     als zu kurz zu melden. */
  if(t.kind === 'test'){
    info.target = { sport:'ride', zone:'z4', minutes: t.minutes, test:true,
                    hardMinutes:20, reps:1, repMinutes:20,
                    ablauf:'20 min gleichmäßig maximal' };
  } else if(t.kind === 'z2'){
    info.target = { sport:'ride', zone:'z2', minutes: t.minutes,
                    km: estimateDistance(plan, t.minutes, week) };
  } else {
    info.target = { sport:'ride', zone: t.zone, minutes: t.minutes,
                    hardMinutes: t.reps * t.workMin, reps: t.reps, repMinutes: t.workMin };
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
    einheiten: [einheit({
      art:'locker', titel:'Ruhetag oder lockere Fahrt',
      kennzahlen: [
        { label:'Umfang',   wert:`optional ${fo.minMinutes}–${fo.maxMinutes} min` },
        { label:'Zielzone', wert: targetText(plan, th, fo.zone, week) }
      ],
      bloecke: [
        { label:'Lockere Fahrt (optional)',
          wert:`${fo.minMinutes}–${fo.maxMinutes} min · ${zoneText(plan, th, fo.zone, week)}`,
          hinweis:'Sonst frei.' }
      ]
    })],
    target: { sport:'optional', minutes: fo.targetMinutes, zone: fo.zone }
  };
}

/* Samstag ist die lange Ausfahrt und der Beginn der Trainingswoche. */
function samstag(c){
  const { plan, th, week, recovery, T, z2 } = c;
  const dur = c.tag('sa').minutes;
  const bl = saturdayBlocks(plan, week);
  const sr = plan.saturdayRide;
  const bz = bl
    ? (wattText(plan, th, 'z3')
        ? `${zoneText(plan, th, 'z3', week)} · 80–88 % FTP`
        : zoneText(plan, th, 'z3', week))
    : null;

  const info = { type:'long', title:'Lange Ausfahrt' };

  const kennzahlen = rideKennzahlen(plan, th, week, dur, 'z2');
  if(bl){
    kennzahlen.push({ label:'Blöcke',
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

  /* Die Hoehenmeter stehen als Kennzahl neben Dauer und Zielzone, nicht als
     Absatz darunter. Als Fliesstext waren es vier bis fuenf Zeilen auf der
     ohnehin laengsten Karte des Plans - die Vorgabe ist aber ein einziger
     Wert, den man vor dem Losfahren abliest. Die Begruendung steht im
     Dokument, nicht auf der Karte.

     Der Umschaltpunkt ist cogganFromWeek und nicht zufaellig derselbe wie beim
     Zonenmodell: beide haengen am Schwellentest. Bis dahin soll der Datensatz
     flach bleiben, danach wird ueber Watt gesteuert. */
  const vorTest = week < plan.cogganFromWeek;
  kennzahlen.push({ label:'Höhenmeter', wert: vorTest ? 'flach' : '50–100 hm' });

  info.einheiten = [einheit({
    art:'lang', titel:'Lange Ausfahrt', kennzahlen, bloecke: lang,
    hinweise: vorTest ? [] : [T.elevationShort]
  })];
  /* In der Erholungswoche zaehlt keine harte Zeit - saturdayBlocks liefert
     dort ohnehin nichts, die Bedingung stand bis Fassung 3 trotzdem ein
     zweites Mal im Sollwert. */
  info.target = { sport:'ride', minutes: dur, km: estimateDistance(plan, dur, week),
                  zone:'z2', hardMinutes: bl ? bl.hardMinutes : 0, hardZone:'z3' };
  return info;
}

/* Sonntag: voller Zirkel, direkt danach der Beinblock. */
function sonntag(c){
  const { plan, th, week, exCount, T } = c;
  const dur = c.tag('so').optionalMinutes;
  const rounds = coreRounds(plan, week);

  /* Drei Einheiten und nicht eine: die optionale Fahrt liegt davor, der
     Zirkel danach, der Beinblock direkt im Anschluss. Der Sonntag ist der Tag,
     an dem die Reihenfolge selbst zur Vorgabe gehoert - deshalb steht die
     Fahrt zuerst und traegt ihre Tageszeit als "davor". */
  const einheiten = [];
  if(dur > 0){
    einheiten.push(einheit({
      art:'z2', titel:'Rad (optional)', zeit:'davor',
      kennzahlen: [
        { label:'Dauer',    wert:'optional ' + dur + ' min' },
        { label:'Zielzone', wert: targetText(plan, th, 'z1', week) }
      ],
      bloecke: [{ label:'Rad (optional)', wert:`${dur} min · ${zoneText(plan, th, 'z1', week)}`,
                  hinweis:`Davor – ${T.sundayRideFirst}.` }]
    }));
  }
  einheiten.push(einheit({
    art:'rumpf', titel:'Rumpf-Zirkel (voll)',
    kennzahlen: [
      { label:'Dauer',  wert:'ca. ' + coreMinutes(plan, week, rounds) + ' min' },
      { label:'Umfang', wert:`${rounds} Runden à ${exCount} Übungen` },
      { label:'Takt',   wert:`${coreWorkSeconds(plan, week)} s / ${coreRestSeconds(plan, week)} s` }
    ],
    bloecke: [circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (voll)', T.sundayLegOrder)],
    timer: TIMER_RUMPF
  }));
  einheiten.push(beinEinheit(c, legRounds(plan, week),
    `${T.legNoTimer}, ${plan.legs.durationHint}.`, 'direkt im Anschluss'));

  return {
    type:'sun', title:'Rumpf-Zirkel (voll) + Beinblock',
    showLegBlock:true,
    einheiten,
    target: { sport:'core', rounds,
              minutes: coreMinutes(plan, week, rounds),
              workSec: coreWorkSeconds(plan, week),
              restSec: coreRestSeconds(plan, week),
              legRounds: legRounds(plan, week),
              optionalRideMinutes: dur, optionalZone:'z1' }
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

/* Ein Tag, der als Schrittfolge dasteht: der Anlauf im Testtempo, die Oeffner
   am Vortag, die VO2max-Variante der Woche 5. Die Zahlen der Karte werden aus
   den Schritten gerechnet und nicht danebengeschrieben - sonst laufen Ablauf
   und Kennzahl auseinander.

   `timer` entscheidet, wohin der Knopf fuehrt: die Anlaufeinheiten gehoeren
   zum Test und stehen im Testbereich, die Variante ist eine Intervalleinheit
   und bleibt im Intervalltimer. */
function schrittTag(c, sess, timer){
  const { plan, th, week } = c;
  const arbeit = sess.steps.filter(x => x.type === 'work');
  const gesamt = sess.steps.reduce((n, x) => n + schrittSekunden(x), 0);
  const hart = arbeit.reduce((n, x) => n + schrittSekunden(x), 0);
  const zone = arbeit[0].zone;
  const bloecke = schrittBloecke(plan, th, week, sess.steps);

  const kennzahlen = [
    { label:'Dauer',     wert: Math.round(gesamt / 60) + ' min' },
    /* Nicht "5 × 5 min": die Bloecke der VO2max-Variante sind ungleich lang,
       und die Kennzahl ist die Zahl, die man vor dem Losfahren abliest. */
    { label:'Belastung', wert: ablaufText(arbeit.map(schrittSekunden)) },
    sess.steering
      ? { label:'Steuergröße', wert: sess.steering }
      : { label:'Zielzone',    wert: targetText(plan, th, zone, week) }
  ];
  const cad = sess.steering ? null : cadenceText(plan, zone, week);
  if(cad) kennzahlen.push({ label:'Trittfrequenz', wert: cad });

  return {
    type:'interval', art:'intervalle', title: sess.title,
    /* Die Anlaufeinheiten gehoeren zum Test und stehen deshalb im Testbereich:
       dort laeuft ihr Ablauf neben der Anleitung, und das Ergebnis des
       Tempoblocks - die Wattzahl, auf die im Test gezielt wird - wird gleich
       dort notiert. Der Intervalltimer kennt sie weiterhin, er ist nur nicht
       mehr die Stelle, an die die Tageskarte fuehrt. */
    einheiten: [einheit({
      art:'intervalle', titel: sess.title, kennzahlen, bloecke,
      hinweise: sess.note ? [sess.note] : [],
      timer
    })],
    target: { sport:'ride', zone, minutes: Math.round(gesamt / 60),
              hardMinutes: Math.round(hart / 60),
              reps: arbeit.length, repMinutes: schrittSekunden(arbeit[0]) / 60,
              ablauf: ablaufText(arbeit.map(schrittSekunden)) }
  };
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
    einheiten: [einheit({
      art:'z2', titel: sess.title,
      kennzahlen: rideKennzahlen(plan, th, week, min, zone),
      bloecke: [{ label:'Fahrt', wert:`${min} min · ${zText}`, hinweis: sess.note || undefined }]
    })],
    target: { ...zt, sport:'ride', minutes: min, zone, km: estimateDistance(plan, min, week) }
  };

  if(zt.legRounds > 0){
    const nachsatz = `${c.T.legNoTimer}, ${plan.legs.durationHint}. ${c.T.legTuesdayNote}`;
    info.einheiten.push(beinEinheit(c, zt.legRounds, nachsatz));
  }
  return info;
}

/* Ruhe heisst Ruhe. Der Freitag im Anlauf ist deshalb 'rest' und nicht
   'restopt': die optionale Fahrt ist genau das, was hier entfaellt. */
function anlaufRest(c, sess){
  return {
    type:'rest', title: sess.title,
    einheiten: [einheit({
      art:'ruhe', titel: sess.title,
      kennzahlen: [{ label:'Umfang', wert:'frei' }],
      hinweise: sess.note ? [sess.note] : []
    })],
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
    einheiten: [einheit({
      art:'rumpf', titel: sess.title,
      kennzahlen: [
        { label:'Dauer',  wert:'ca. ' + min + ' min' },
        { label:'Umfang', wert:`${rounds} Runden à ${exCount} Übungen` },
        { label:'Takt',   wert:`${work} s / ${rest} s` }
      ],
      bloecke: [circuitBlock(plan, week, rounds, 'Rumpf-Zirkel (voll)', sess.note)],
      timer: TIMER_RUMPF
    })],
    target: { sport:'core', rounds, minutes: min, workSec: work, restSec: rest, legRounds: 0 }
  };
}

const ANLAUF_ARTEN = { steps: (c, sess) => schrittTag(c, sess, TIMER_TEST),
                       ride: anlaufRide, rest: anlaufRest, core: anlaufCore };

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

/* ---- Die Variante eines Tages ----

   Ein Donnerstag mit `variante` hat zwei zulaessige Formen. Welche gilt,
   entscheidet der Nutzer am Tag selbst; bis dahin gilt der Regelfall.

   Die Wahl kommt als Tabelle von ISO-Tag auf Kennung herein - 'regel' heisst
   ausdruecklich abgewaehlt, ein fehlender Eintrag heisst unentschieden. Die
   beiden auseinanderzuhalten ist keine Feinheit: eine Karte, die nach einer
   Entscheidung weiter fragt, wird beim dritten Mal nicht mehr gelesen, und
   eine, die nie fragt, laesst den Wert ausfallen.

   Der Zustand bleibt draussen, day.js bleibt rein: gerechnet wird mit dem,
   was hereinkommt. */
export const VARIANTE_REGEL = 'regel';

export function varianteFuer(plan, date, week, wahlen){
  if(date.getDay() !== 4) return null;
  const def = thursdayVariante(plan, week);
  if(!def) return null;
  const wahl = (wahlen || {})[isoDayLocal(date)];
  return {
    def,
    gewaehlt: wahl === def.id ? true : (wahl === VARIANTE_REGEL ? false : null)
  };
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

export function buildDayInfo(plan, th, date, startDate, wahlen){
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
    /* Der Zugriff auf einen Wochentag laeuft ueber sein Kuerzel und ueber
       week.js - dort steckt die Regel, dass der Winterblock einzelne Tage
       ersetzt. Bis Fassung 2 las jede Tagesfunktion roh aus plan.weeks[i]
       und ging an dieser Regel vorbei; nur Donnerstag und Samstagsbloecke
       hatten dafuer einen eigenen benannten Zugriff. */
    tag: k => tagDaten(plan, week, k),
    phase: phaseOf(plan, week),
    recovery: isRecoveryWeek(plan, week),
    winter: isWinterBlock(plan, week),
    exCount: plan.circuit.exercises.length,
    T: plan.texts,
    z2: () => withCadence(plan, targetText(plan, th, 'z2', week), 'z2', week)
  };

  /* Jeder Tag bringt seinen Sollwert selbst mit.

     Bis Fassung 2 stand er in buildDayTarget, einem zweiten switch ueber
     date.getDay() neben der Tabelle TAGE darueber. Zwei Wochentagstabellen
     nebeneinander, beide lasen dieselben Felder, und keine von beiden wusste
     von der anderen: wer eine Zahl in der Anzeige aenderte, musste die zweite
     Stelle finden, an der sie in die Auswertung ging. */
  let geplant = TAGE[date.getDay()](c);

  /* Die Variante tritt an die Stelle des Regelfalls, wenn sie gewaehlt wurde -
     vor dem Anlauf, weil der Anlauf den ganzen Tag ersetzt und nicht eine
     seiner beiden Formen. Die Frage selbst bleibt am Tag stehen, auch wenn
     sie beantwortet ist: ein Tausch, den man nicht sieht, ist von einem
     Fehler nicht zu unterscheiden. */
  const variante = vorStart ? null : varianteFuer(plan, date, week, wahlen);
  if(variante && variante.gewaehlt){
    const regel = geplant;
    geplant = schrittTag(c, variante.def, TIMER_INTERVALLE);
    geplant.ersetzt = { titel: regel.title, grund: variante.def.title.replace(/^Rad – /, '') };
  }

  /* Der Anlauf kann den geplanten Tag ersetzen, und zwar bevor die
     gemeinsamen Felder gefuellt werden: sonst traegt die Ersatzeinheit die
     Einheitsart und die Sollwerte des Tages, den sie abloest. */
  const taper = vorStart ? null : testTaperFor(plan, date, startDate);
  const info = taper && taper.step && taper.step.session
    ? anlaufEinheit(c, taper, geplant)
    : geplant;

  info.week = week;
  info.vorStart = vorStart;
  if(variante) info.variante = variante;
  info.phase = c.phase;
  info.recovery = c.recovery;
  info.winter = c.winter;

  /* Hier aufgefuellt und nicht in den sieben Funktionen, damit die Anzeige nie
     auf undefined stoesst - und damit ein spaeter ergaenzter Tagestyp nicht
     stillschweigend ohne Struktur durchlaeuft. */
  info.art = info.art ?? ART_JE_TYP[info.type] ?? 'sonstige';

  /* Die drei Listen des Tages entstehen aus den Einheiten und nicht daneben.

     Sie bleiben, weil die Glocke sie liest und der Gleichheitsnachweis sie
     prueft - aber sie werden nicht mehr gepflegt: eine Einheit, die in
     `einheiten` steht, steht damit auch im Ablauf des Tages, und eine, die
     dort fehlt, fehlt ueberall. Vorher liess sich beides auseinanderbringen,
     und genau das war beim Mittwoch passiert. */
  info.einheiten = (info.einheiten ?? []).map(einheit);
  info.kennzahlen = info.einheiten.flatMap(e => e.kennzahlen);
  info.bloecke = info.einheiten.flatMap(e => e.bloecke);

  /* `tagHinweise` gilt fuer den ganzen Tag und nicht fuer eine seiner
     Einheiten - im ausgelieferten Plan ist das der Testanlauf. `hinweise`
     bleibt die Zusammenfassung beider, weil die Glocke und die Tests sie
     lesen. */
  info.tagHinweise = [];
  info.hinweise = info.einheiten.flatMap(e => e.hinweise);

  /* Die drei Knopfmarken bleiben abgeleitet stehen: sie sind seit dem Umbau
     eine Aussage ueber den Tag ("hier gibt es etwas zu zaehlen"), waehrend der
     Knopf selbst an seiner Einheit haengt. */
  const timerArt = a => info.einheiten.some(e => e.timer && e.timer.art === a);
  info.showTimerBtn    = timerArt('rumpf');
  info.showLegBtn      = timerArt('beine');
  info.showIntervalBtn = timerArt('intervalle');
  info.showTestBtn     = timerArt('test');

  info.zusatz = zusatzBloecke(plan, date, startDate);

  /* Der Testanlauf steht an dem Tag, fuer den er gilt, und nicht als Liste in
     der Statuskarte. Eine Vorgabe fuer den kommenden Dienstag nuetzt am
     Dienstag etwas, nicht heute. */
  if(taper){
    info.testTaper = taper;
    const satz = taperHinweis(plan, taper);
    if(satz){ info.tagHinweise.push(satz); info.hinweise.push(satz); }
  }
  return info;
}
