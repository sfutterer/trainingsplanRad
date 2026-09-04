/* Abgleich der aufgezeichneten Aktivitaeten mit dem Plan.

   Uebernommen aus der Einzeldatei-Fassung. Zwei Aenderungen: plan, thresholds
   und die Zonenschluessel kommen als Parameter statt aus Modulvariablen, und
   buildDayInfo wird mit dem Modell aufgerufen statt global. Die Bewertung
   selbst ist unveraendert - sie ist im Trainingsplan-Dokument begruendet.

   Die Toleranzen stehen bewusst hier und nicht in plan.json: das ist
   Bewertungspolitik der App, nicht Trainingsplan. Die Saetze dazu stehen aus
   demselben Grund im Code, aber in texte.js - sie standen frueher mitten im
   Verzweigungsbaum und haben ihn unlesbar gemacht.

   Am 29.08.2026 aufgeraeumt: der Wellnessteil ist nach wellness.js gezogen
   (er stand in der zweiten Haelfte, ohne dass die beiden Haelften einander je
   aufriefen), und das Praefix "an" ist weg. Es stammte aus der Zeit, als alles
   in einer Datei lag und der Praefix den Namensraum ersetzte - das macht heute
   das Modul.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { buildDayInfo, weekPlanMinutes, weekCapMinutes } from './day.js';
import { legDoneRounds, legAborts } from './core.js';
import { isoDayLocal } from './week.js';
import { T } from './texte.js';
import { stundenText } from './zeit.js';

export function isRide(type){
  return /ride|cycl|bike|biking|spinning/i.test(type || '');
}

export function isStrength(type){
  return /weight|strength|core|workout|yoga|pilates|training/i.test(type || '');
}

export function localDay(iso){
  return (iso || '').slice(0, 10);
}

/* Die Aufzeichnungen nach Tagen gruppiert - juengster Tag zuerst, innerhalb
   des Tages in der Reihenfolge, in der gefahren wurde.

   Steht hier und nicht in der Anzeige, weil der Tag die Einheit der Bewertung
   ist: compareDay nimmt alle Aktivitaeten eines Tages zusammen, und die Liste,
   aus der man eine Auswertung oeffnet, muss dieselbe Einteilung treffen.
   Solange sie in der Anzeige stand, konnte sie eine andere treffen - und tat
   es: dort wurde je Fahrt geoeffnet und je Tag bewertet. */
export function tagesGruppen(activities){
  const nachTag = {};
  for(const a of activities || []){
    const tag = localDay(a && a.start_date_local);
    if(!tag) continue;
    (nachTag[tag] = nachTag[tag] || []).push(a);
  }
  return Object.keys(nachTag).sort().reverse().map(tag => ({
    tag,
    acts: nachTag[tag].slice().sort((x, y) =>
      (String(x.start_date_local) < String(y.start_date_local) ? -1 : 1))
  }));
}

export function recordingNote(z){
  if(!z) return null;
  const takt = z._takt ? (Math.round(z._takt * 10) / 10).toString().replace('.', ',') : null;
  if(z._method === 'annahme') return { kind:'', text: T.aufzeichnungAnnahme };
  if(z._method === 'skaliert') return { kind:'info', text: T.aufzeichnungSkaliert(takt, z._samples) };
  if(z._takt && z._takt >= 1.5) return { kind:'info', text: T.aufzeichnungGrob(takt, z._samples) };
  return null;
}

/* Weitergereicht aus zeit.js. Der Name bleibt: die Auswertung und ihre
   Tests kennen ihn seit der Einzeldatei-Fassung, und ein Umbenennen haette
   nur die Aufrufer angefasst, ohne etwas zu klaeren. */
export const fmtMin = stundenText;

export function pct(part, whole){
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
export const DUR_TOL_SHORT = 0.15;
const DUR_TOL_LONG  = 0.35;

/* Setzt den Status herab und zieht das Badge mit. Ohne das behielte eine
   Einheit mit passender Dauer das Badge "erfuellt", obwohl die Zonenpruefung
   sie schon als abweichend markiert hat. */
export function downgrade(row, badge){
  if(row.status === 'miss') return;
  row.status = 'dev';
  row.badge = badge;
}

/* Aus der aufgezeichneten Dauer die Zahl der Runden schaetzen. Der Zirkel ist
   deterministisch: n Runden brauchen n*(ex*Belastung + (ex-1)*Pause) plus die
   Rundenpausen dazwischen und den Vorlauf.

   exCount kam schon immer als Parameter herein, wurde aber nicht benutzt: hier
   stand EXERCISES.length, eine Modulvariable aus der Einzeldatei-Fassung, die
   es in diesem Modul nie gab. Die Funktion warf also einen ReferenceError,
   sobald sie lief - und das tat sie genau dann, wenn jemand den Zirkel auf der
   Uhr statt mit dem App-Timer aufzeichnete. Aufgefallen ist es nie, weil diese
   Haelfte der Datei bis zum 29.08.2026 keinen Test hatte. */
export function estimateRounds(sec, workSec, restSec, roundRestSec, prepSec, exCount){
  if(!workSec || !sec || !exCount) return null;
  const runde = exCount * workSec + (exCount - 1) * restSec;
  let best = null;
  for(let n = 1; n <= 6; n++){
    const soll = n * runde + (n - 1) * roundRestSec + prepSec;
    const abw = Math.abs(soll - sec);
    if(!best || abw < best.abw) best = { rounds: n, abw: abw };
  }
  /* Passt selbst die beste Zuordnung um mehr als eine halbe Runde nicht, war
     das etwas anderes als dieser Zirkel - dann lieber nichts behaupten. */
  if(!best || best.abw > runde * 0.5) return null;
  return best.rounds;
}

/* Exakte Auswertung aus dem eigenen Protokoll. */
function coreLogNotes(row, sessions, t){
  const notes = [];
  const ses = sessions[sessions.length - 1];
  const exCount = ses.exCount || 8;
  const voll = Math.floor((ses.sets || 0) / exCount);
  const soll = ses.plannedRounds || t.rounds || 0;

  if(ses.finished && voll >= soll){
    row.status = 'ok'; row.badge = 'erledigt';
    notes.push({ kind:'good', text: T.rumpfKomplett(soll) });
  } else {
    downgrade(row, voll + '/' + soll + ' Runden');
    notes.push({ kind:'', text: T.rumpfTeilweise(voll, soll, ses.finished, ses.lastExercise) });
  }

  if(ses.skips && ses.skips.length){
    const je = {};
    for(const sk of ses.skips) je[sk.name] = (je[sk.name] || 0) + 1;
    const liste = Object.keys(je).sort((a, b) => je[b] - je[a])
      .map(n => n + (je[n] > 1 ? ' (' + je[n] + '×)' : '')).join(', ');
    notes.push({ kind:'', text: T.rumpfUebersprungen(ses.skips.length, liste) });
  }
  if(sessions.length > 1){
    notes.push({ kind:'', text: T.rumpfMehrfach(sessions.length) });
  }
  return notes;
}

/* Nur eine Garmin-Aufzeichnung da: aus der Dauer schaetzen. */
function coreEstimateNotes(row, strength, t, roundRestSec, prepSec, exCount){
  const notes = [];
  const sec = strength.reduce((n, a) => n + (a.elapsed_time || a.moving_time || 0), 0);
  const min = Math.round(sec / 60);
  const est = estimateRounds(sec, t.workSec, t.restSec, roundRestSec, prepSec, exCount);
  const soll = t.rounds || 0;

  if(est == null){
    row.status = 'ok'; row.badge = 'erledigt';
    notes.push({ kind:'good', text: T.rumpfOhneSchaetzung(min) });
  } else if(est >= soll){
    row.status = 'ok'; row.badge = 'erledigt';
    notes.push({ kind:'good', text: T.rumpfGeschaetztOk(min, est, soll) });
  } else {
    downgrade(row, 'ca. ' + est + '/' + soll + ' Runden');
    notes.push({ kind:'', text: T.rumpfGeschaetztKurz(min, est, soll, t.minutes) });
  }
  return notes;
}

/* Optionale und nicht geplante Fahrten werden bewertet, aber nicht am Umfang
   gemessen: kuerzer oder gar nicht ist bei einer freiwilligen Einheit kein
   Fehler. Zu hart gefahren dagegen schon - eine Erholungsfahrt in Z3 frisst
   genau die Erholung, fuer die sie da ist. */
/* ---- Die Fahrten eines Tages der Reihe nach ----

   Der Tag bleibt die Einheit der Bewertung: ob zu kurz oder zu lang, entscheidet
   die Summe und nicht die einzelne Fahrt. Wer den Arbeitsweg zweimal faehrt,
   soll nicht zweimal "kuerzer" lesen.

   Die Summe entsteht aber in einer Reihenfolge, und bis zum 04.09.2026 stand
   davon nichts da: zwei Fahrten, die einzeln schon ueber der Vorgabe lagen,
   ergaben eine Zahl und den Satz "erfuellt". Deshalb je Fahrt ein Laufstand,
   die Ueberschreitung an der Fahrt, die sie ausloest, und die Intensitaet aus
   den Zonen genau dieser Fahrt - gemittelt ueber beide verschwindet ein
   gehetzter Rueckweg hinter einem ruhigen Hinweg.

   Was in Minuten und nicht in Anteilen zaehlt, bleibt am Tag: die Intervallzeit
   und die Z3-Bloecke des Samstags. Sie auf zwei Fahrten aufzuteilen hiesse,
   dieselbe Vorgabe zweimal ganz zu verlangen - genau der Fehler, den der Umbau
   vom 03.09.2026 beseitigt hat. */
function fahrtTeile(rides, zonesById){
  let kum = 0;
  return rides.map((a, i) => {
    const sec = a.moving_time || a.elapsed_time || 0;
    const vorher = kum;
    kum += sec;
    return { act: a, nr: i + 1, sec, vorherSec: vorher, kumSec: kum,
             zones: zonesById ? (zonesById[a.id] || null) : null, notes: [] };
  });
}

/* Unter fuenf Minuten Aufzeichnung sagt eine Zonenverteilung nichts - dann
   soll auch nichts behauptet werden. */
function jeFahrt(fn){
  return f => (f.zones && f.zones._total > 300 ? fn(f.zones) : []);
}

function fahrtenNotizen(row, teile, sollMin, minimum, intensitaet){
  const mehrere = teile.length > 1;
  const grenze = sollMin ? sollMin * 60 * (1 + DUR_TOL_LONG) : 0;
  for(const f of teile){
    if(mehrere){
      f.notes.push({ kind:'', text: T.fahrtLaufstand(f.nr, Math.round(f.sec / 60),
                                                     Math.round(f.kumSec / 60), sollMin, minimum) });
    }
    /* Bei einer einzelnen Fahrt sagt T.dauerLang dasselbe schon - ausser auf
       den Tagen mit blosser Untergrenze, wo bisher gar nichts dazu stand. */
    if(grenze && (mehrere || minimum) && f.vorherSec < grenze && f.kumSec >= grenze){
      const kum = Math.round(f.kumSec / 60);
      f.notes.push({ kind:'info', text: T.fahrtUeberZiel(mehrere, kum, sollMin, minimum) });
    }
    if(intensitaet) f.notes.push(...intensitaet(f));
    const aufz = recordingNote(f.zones);
    if(aufz) f.notes.push(aufz);
  }
  const gesamt = teile.length ? teile[teile.length - 1].kumSec : 0;
  if(grenze && (mehrere || minimum) && gesamt >= grenze){
    row.umfangUeber = { kum: Math.round(gesamt / 60), soll: sollMin, minimum };
  }
}

/* row.notes bleibt die flache Liste aus Tages- und Fahrtnotizen: das Fazit
   sucht darin die schweren Befunde, und die Meldungen tun es ebenso. Die
   Anzeige liest stattdessen row.tagNotes und die Notizen je Fahrt - sonst
   stuende jeder Satz zweimal auf der Seite. */
function fertig(row){
  row.tagNotes = row.notes;
  row.notes = row.tagNotes.concat(...(row.fahrten || []).map(f => f.notes));
  return row;
}

function lockerNotes(row, z){
  const locker = pct((z.unter || 0) + (z.z1 || 0) + (z.z2 || 0), z._total);
  const hart = pct((z.z3 || 0) + (z.z4 || 0) + (z.z5 || 0), z._total);
  if(hart > 25){
    downgrade(row, 'zu hart');
    return [{ kind:'bad', text: T.lockerZuHart(hart) }];
  }
  return [{ kind:'good', text: T.lockerPasst(locker) }];
}

/* Die Tageszeile zur freiwilligen Fahrt; die Zonen stehen je Fahrt darunter.
   Ohne Umfangsvorgabe, deshalb ohne Laufstand: bei einer freiwilligen Einheit
   gibt es nichts zu erfuellen und nichts zu ueberschreiten. */
function easyRideNotes(row, teile, sollMin){
  const ist = Math.round(row.rideSec / 60);
  const km = row.rideKm >= 1 ? ' (' + row.rideKm.toFixed(1) + ' km)' : '';
  fahrtenNotizen(row, teile, 0, false, jeFahrt(z => lockerNotes(row, z)));
  return [{ kind:'', text: T.optionaleFahrt(ist, km, sollMin) }];
}

/* Beinblock aus dem eigenen Protokoll. intervals.icu sieht davon nichts:
   ohne Timer gibt es keine Aufzeichnung, und selbst mit waere dort nur Dauer
   und Puls gespeichert. */
function legNotes(row, legSessions, t){
  const notes = [];
  const soll = t.legRounds || 0;
  if(!soll) return notes;

  if(!legSessions || !legSessions.length){
    notes.push({ kind:'', text: T.beineNichtProtokolliert });
    return notes;
  }

  const e = legSessions[legSessions.length - 1];
  const voll = legDoneRounds(e);
  const ab = legAborts(e);
  const gesamt = e.exercises.reduce((n, ex) => n + ex.reps.filter(v => v > 0).length, 0);

  if(voll >= soll){
    notes.push({ kind:'good', text: T.beineKomplett(voll, soll, gesamt) });
  } else if(gesamt > 0){
    downgrade(row, 'Beine ' + voll + '/' + soll);
    notes.push({ kind:'', text: T.beineTeilweise(voll, soll, gesamt) });
  } else {
    notes.push({ kind:'', text: T.beineOhneWerte });
  }

  if(ab){
    const liste = e.exercises
      .filter(ex => ex.reps.some(v => v != null && v > 0 && v < ex.target))
      .map(ex => ex.name).join(', ');
    notes.push({ kind:'', text: T.beineUnterZiel(ab, liste) });
  }
  return notes;
}

/* Pendelfahrten am Dienstag und Mittwoch: die Solldauer ist eine Untergrenze.
   Zu lang ist kein Fehler und darf keine Warnung ausloesen. Bewertet wird
   stattdessen die Intensitaet - ueber 20 % der Zeit oberhalb Z2 heisst, der
   Weg wurde unter Zeitdruck gefahren. */
function commuteIntensityNotes(row, zones){
  const notes = [];
  if(!zones || !zones._total || zones._total <= 300) return notes;
  const ueber = pct((zones.z3 || 0) + (zones.z4 || 0) + (zones.z5 || 0), zones._total);
  if(ueber > 20){
    downgrade(row, 'zu hart');
    notes.push({ kind:'bad', text: T.pendelZuHart(ueber) });
  } else {
    notes.push({ kind:'good', text: T.pendelPasst(pct(zones.z2 || 0, zones._total), ueber) });
  }
  return notes;
}

/* Zonenzeiten aller Fahrten des Tages zusammenfassen. Die Angaben zur
   Aufzeichnung muessen mitwandern, sonst kann recordingNote nichts sagen.
   Bei mehreren Fahrten gilt das unzuverlaessigste Verfahren und der groebste
   Takt - eine Aussage soll nicht besser klingen als ihre schlechteste Quelle. */
function mergeZones(plan, rides, zonesById){
  const RANG = { zeitgewichtet: 0, skaliert: 1, annahme: 2 };
  const merged = {};
  let total = 0, method = null, takt = null, samples = 0;
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
  if(!(total > 0)) return null;
  merged._total = total;
  merged._method = method;
  merged._takt = takt;
  merged._samples = samples;
  return merged;
}

/* Die Zonen einer Grundlagenfahrt. Auf ihr ist schon Z3 zu hart; am Samstag
   sind in den Wochen 6, 10 und 14 Z3-Bloecke geplant, deren Anteil ist
   zusaetzlich erlaubt. */
function z2Notes(row, zones, t){
  const notes = [];
  const total = zones._total;
  const anteil = pct(zones.z2 || 0, total);
  const basis  = pct((zones.z1 || 0) + (zones.z2 || 0), total);
  const unten  = pct((zones.unter || 0) + (zones.z1 || 0), total);
  const ueber  = pct((zones.z3 || 0) + (zones.z4 || 0) + (zones.z5 || 0), total);
  const sehrHart = pct((zones.z4 || 0) + (zones.z5 || 0), total);
  const erlaubt = 20 + (t.hardMinutes && t.minutes
    ? Math.round(t.hardMinutes / t.minutes * 100) : 0);

  if(ueber > erlaubt){
    downgrade(row, 'zu hart');
    notes.push({ kind:'bad', text: T.z2ZuHart(ueber, sehrHart, erlaubt) });
  } else if(unten > 35){
    downgrade(row, 'zu locker');
    notes.push({ kind:'', text: T.z2ZuLocker(unten) });
  } else {
    notes.push({ kind:'good', text: T.z2Passt(anteil, basis) });
  }

  return notes;
}

/* Die geplanten Z3-Bloecke am Samstag zaehlen in Minuten und nicht in Anteilen.
   Deshalb bleiben sie am Tag: ueber zwei Fahrten verteilt sind zweimal "6 von
   15 min" zwei falsche Saetze, wo einer ueber 12 von 15 min richtig waere. */
function z3BlockNote(zones, t){
  if(!t.hardMinutes) return [];
  const z3min = Math.round((zones.z3 || 0) / 60);
  return [{ kind: z3min >= t.hardMinutes * 0.7 ? 'good' : '',
            text: T.z3Block(z3min, t.hardMinutes) }];
}

/* Intervalltag: die harte Zeit zaehlt, nicht der Anteil. Der Puls hinkt dem
   Tritt nachher, und man durchlaeuft die Zone darunter auf dem Weg nach oben.
   Nur die Zielzone zu zaehlen wuerde saubere Intervalle als Abbruch melden -
   deshalb zaehlt die Zone darunter mit, wird aber getrennt ausgewiesen.
   Ab Woche 5 waere die Zeit in der Watt-Zone der genauere Massstab; die steht
   erst mit dem Leistungsmesser zur Verfuegung. */
function intervallNotes(row, zones, t){
  const soll = t.hardMinutes || 0;
  if(!soll) return [];

  const ziel = t.zone;
  const darunter = ziel === 'z5' ? 'z4' : ziel === 'z4' ? 'z3' : 'z2';
  const zielMin = Math.round((zones[ziel] || 0) / 60);
  const hartMin = Math.round(((zones[ziel] || 0) + (zones[darunter] || 0)) / 60);
  /* Der Ablauf in einem Satzteil. Die Sollwerte aus einer Schrittfolge bringen
     ihn mit, weil ihre Bloecke ungleich lang sein duerfen - "5× 5 min" waere
     bei der VO2max-Variante falsch. Die uebrigen Intervalltage rechnen ihn
     weiterhin aus Wiederholung und Laenge. */
  const ablauf = t.ablauf || (t.reps + '× ' + t.repMinutes + ' min');
  const zone = ziel.toUpperCase();

  if(hartMin >= soll * 0.7){
    return [{ kind:'good', text: T.hartErreicht(hartMin, zielMin, zone, soll, ablauf) }];
  }
  downgrade(row, t.test ? 'Test kurz' : 'Intervalle kurz');
  return [{ kind:'bad', text: T.hartKurz(hartMin, zielMin, zone, soll, ablauf) }];
}

/* Der Rumpftag: Zirkel, Beinblock und am Mittwoch zusaetzlich die Fahrt. */
function coreDayNotes(plan, row, t, rides, strength, teile){
  const notes = [];

  /* Das eigene Protokoll ist die genauere Quelle und hat Vorrang; die
     Schaetzung aus der Garmin-Dauer greift nur ohne Protokoll. */
  let rumpfBewertet = false;
  if(row.coreSessions && row.coreSessions.length){
    notes.push(...coreLogNotes(row, row.coreSessions, t));
    rumpfBewertet = true;
  } else if(strength.length){
    notes.push(...coreEstimateNotes(row, strength, t, plan.circuit.roundRestSeconds,
                                    plan.circuit.prepSeconds, plan.circuit.exercises.length));
    rumpfBewertet = true;
  }

  if(!rumpfBewertet){
    if(rides.length && !t.rideMinutes){
      if(t.optionalRideMinutes){ row.status = 'ok'; row.badge = 'optional gefahren'; }
      else { row.status = 'extra'; row.badge = 'Zusatz'; }
    } else if(!rides.length || t.rideMinutes){
      row.status = 'dev'; row.badge = 'nicht erfasst';
      notes.push({ kind:'', text: T.rumpfNichtErfasst });
    }
  }

  /* Beinblock nur am Sonntag; am Mittwoch steht keiner an. */
  notes.push(...legNotes(row, row.legSessions, t));

  /* Mittwoch: Rad UND Rumpf am selben Tag. Die Fahrt ist geplant, aber die
     Dauer ist eine Untergrenze - deshalb hier und nicht ueber den normalen
     Dauervergleich weiter unten. */
  if(t.rideMinutes){
    if(!rides.length){
      downgrade(row, 'Fahrt fehlt');
      notes.push({ kind:'bad', text: T.mittwochFehlt(t.rideMinutes) });
    } else {
      const ist = Math.round(row.rideSec / 60);
      if(ist < t.rideMinutes * (1 - DUR_TOL_SHORT)){
        downgrade(row, 'kürzer');
        notes.push({ kind:'bad', text: T.mittwochKurz(ist, t.rideMinutes) });
      } else if(ist < t.rideMinutes){
        notes.push({ kind:'info', text: T.mittwochToleranz(ist, t.rideMinutes) });
      } else {
        notes.push({ kind: ist > t.rideMinutes * (1 + DUR_TOL_LONG) ? 'info' : 'good',
                     text: T.mittwochErfuellt(ist, t.rideMinutes) });
      }
    }
    fahrtenNotizen(row, teile, t.rideMinutes, true,
                   jeFahrt(z => commuteIntensityNotes(row, z)));
  } else if(rides.length){
    notes.push(...easyRideNotes(row, teile, t.optionalRideMinutes));
  }
  return notes;
}

/* `wahlen` traegt die gewaehlten Tagesvarianten herein - siehe day.js.

   Ohne sie bewertete die Auswertung den Regelfall, waehrend die Tageskarte die
   Variante zeigt: am Donnerstag der Woche 5 stuende dann "5× 4 min" im Soll,
   obwohl der Nutzer 5 min maximal und 4× 4 min gefahren hat. Zwei Minuten
   Unterschied, aber ein falscher Satz in der Begruendung. */
export function compareDay(plan, th, date, startDate, acts, zonesById, coreSessions, legSessions, wahlen){
  const info = buildDayInfo(plan, th, date, startDate, wahlen);
  const t = info.target || { sport:'rest' };
  const rides = acts.filter(a => isRide(a.type));
  const strength = acts.filter(a => !isRide(a.type) && isStrength(a.type));
  const row = {
    date: date, week: info.week, plan: info, target: t,
    acts: acts, rides: rides, strength: strength,
    coreSessions: coreSessions || [],
    legSessions: legSessions || [],
    notes: [], status: 'ok', badge: ''
  };

  /* Die Fahrten in der Reihenfolge, in der gefahren wurde, mit Laufstand und
     den Zonen genau dieser Fahrt. Die Notizen dazu haengen an der Fahrt und
     nicht am Tag; fertig() haengt beide Listen zusammen. */
  const teile = fahrtTeile(rides, zonesById);
  row.fahrten = teile;

  row.rideSec = rides.reduce((n, a) => n + (a.moving_time || a.elapsed_time || 0), 0);
  row.rideKm  = rides.reduce((n, a) => n + (a.distance || 0), 0) / 1000;

  /* Geplante und optionale Fahrzeit getrennt fuehren. In Fassung 1 lief alles
     Gefahrene gegen nur die geplanten Radeinheiten, dadurch schoben optionale
     Fahrten die Kennzahl "Abweichung Fahrzeit" nach oben. */
  const istGeplant = t.sport === 'ride' || (t.sport === 'core' && t.rideMinutes);
  row.plannedRideSec  = istGeplant ? row.rideSec : 0;
  row.optionalRideSec = istGeplant ? 0 : row.rideSec;
  row.plannedMinutes  = t.sport === 'ride' ? (t.minutes || 0) : (t.rideMinutes || 0);

  if(zonesById){
    const merged = mergeZones(plan, rides, zonesById);
    if(merged) row.zones = merged;
  }
  row.z2Sec   = row.zones ? (row.zones.z2 || 0) : 0;
  row.hardSec = row.zones ? ((row.zones.z3 || 0) + (row.zones.z4 || 0) + (row.zones.z5 || 0)) : 0;

  if(t.sport === 'rest'){
    if(rides.length){
      row.status = 'extra'; row.badge = 'Zusatz';
      row.notes.push({ kind:'', text: T.ruhetagGefahren(fmtMin(row.rideSec)) });
      fahrtenNotizen(row, teile, 0, false, null);
    } else {
      row.status = 'ok'; row.badge = 'Ruhetag';
    }
    return fertig(row);
  }

  if(t.sport === 'optional'){
    row.status = 'ok';
    if(rides.length){
      row.badge = 'optional gefahren';
      row.notes.push(...easyRideNotes(row, teile, t.minutes));
    } else {
      row.badge = 'frei';
    }
    return fertig(row);
  }

  if(t.sport === 'core'){
    row.notes.push(...coreDayNotes(plan, row, t, rides, strength, teile));
    return fertig(row);
  }

  /* Ab hier: Radeinheit mit messbarem Soll.

     Der Dienstag traegt ab Woche 11 abends eine zweite Beineinheit. Sie wird
     hier bewertet und nicht im Rumpftag-Zweig, weil der Dienstag ein Radtag
     ist und der Beinblock danebensteht. Vor der Rad-Auswertung, damit sie auch
     an einem Tag ohne Fahrt erhalten bleibt - der Zweig darunter kehrt dann
     zurueck.

     Die Rundenschaetzung aus der Garmin-Dauer greift hier bewusst nicht: sie
     laeuft nur auf Rumpftagen. Eine kurze Krafteinheit am Dienstagabend als
     Sonntagszirkel zu lesen, waere genau der Fehler, vor dem der
     Trainingsplan warnt. */
  if(t.legRounds){
    row.notes.push(...legNotes(row, row.legSessions, t));
  }

  if(!rides.length){
    row.status = 'miss'; row.badge = 'ausgefallen';
    row.notes.push({ kind:'bad', text: t.test ? T.testFehlt : T.fahrtFehlt });
    return fertig(row);
  }

  const sollSec = (t.minutes || 0) * 60;
  const diff = sollSec ? (row.rideSec - sollSec) / sollSec : 0;
  row.durDiff = diff;
  const abw = Math.abs(Math.round(diff * 100));
  if(diff < -DUR_TOL_SHORT){
    row.status = 'dev'; row.badge = 'kürzer';
    row.notes.push({ kind:'bad', text: T.dauerKurz(abw) });
  } else {
    row.status = 'ok'; row.badge = t.test ? 'Test gefahren' : 'erfüllt';
    if(diff > DUR_TOL_SHORT){
      row.notes.push({ kind:'info', text: T.dauerLang(abw, diff > DUR_TOL_LONG) });
    }
  }

  if(t.test) row.notes.push({ kind:'info', text: T.testtag });

  /* Was in Minuten zaehlt, bleibt am Tag: die harte Zeit eines Intervalltages
     und die Z3-Bloecke des Samstags. Was als Anteil zaehlt, geht je Fahrt -
     der Dienstag ist Pendelweg, dort ist laenger normal und zu hart der
     Fehler. */
  if(row.zones && row.zones._total > 300){
    row.zoneShare = pct(row.zones[t.zone] || 0, row.zones._total);
    if(!t.commute){
      row.notes.push(...(t.zone === 'z2'
        ? z3BlockNote(row.zones, t)
        : intervallNotes(row, row.zones, t)));
    }
  }

  fahrtenNotizen(row, teile, t.minutes || 0, false,
    t.commute ? jeFahrt(z => commuteIntensityNotes(row, z))
              : t.zone === 'z2' ? jeFahrt(z => z2Notes(row, z, t)) : null);

  return fertig(row);
}

/* Wochensummen. Bei getauschten Tagen ist die Tagesbewertung wertlos - sie
   meldet einen Tausch doppelt, einmal als fehlende und einmal als unerwartete
   Einheit. Gesamtdauer, Z2-Minuten und harte Zeit ueber die Woche sagen
   dagegen unabhaengig vom Wochentag, ob die Woche gestimmt hat. */
export function weekTotals(rows, plan){
  const byWeek = {};
  for(const r of rows){
    const w = byWeek[r.week] = byWeek[r.week] ||
      { week:r.week, sollMin:0, istSec:0, optSec:0, z2Sec:0, hardSec:0, tage:0, zeilen:0 };
    w.sollMin += r.plannedMinutes || 0;
    w.istSec  += (r.plannedRideSec || 0) + (r.optionalRideSec || 0);
    w.optSec  += r.optionalRideSec || 0;
    w.z2Sec   += r.z2Sec || 0;
    w.hardSec += r.hardSec || 0;
    w.zeilen  += 1;
    if(r.acts.length) w.tage += 1;
  }

  const liste = Object.keys(byWeek).map(k => byWeek[k]).sort((a, b) => a.week - b.week);

  /* Der Umfangsdeckel aus Fassung 3: zulaessig ist der Planwert plus
     weeklyVolumeCapPercent. Er ersetzt die Ramp-Rate als Fruehwarnung, solange
     die CTL unter 20 liegt - dort sind fuenf CTL-Punkte pro Woche eine
     Verdopplung der Grundlast und keine Obergrenze.

     planMin ist die Wochensumme des Plans, sollMin die Summe der Tage im
     abgefragten Zeitraum. Beide werden gebraucht: nur planMin ist mit der
     Tabelle im Trainingsplan vergleichbar, und nur sollMin bleibt richtig,
     wenn der Zeitraum mitten in einer Woche beginnt. Deshalb warnt der Deckel
     ausschliesslich bei vollstaendig erfassten Wochen - eine halbe Woche kann
     ihn nicht ueberschreiten, nur unterbieten. */
  if(plan){
    for(const w of liste){
      if(w.week < 1 || w.week > plan.weekCount) continue;
      w.planMin = weekPlanMinutes(plan, w.week);
      w.capMin = weekCapMinutes(plan, w.week);
      w.vollstaendig = w.zeilen >= 7;
      w.ueberDeckel = w.vollstaendig && Math.round(w.istSec / 60) > w.capMin;
    }
  }
  return liste;
}

/* Bericht ueber einen Zeitraum. Rumpf- und Beinblock-Eintraege kommen getrennt
   herein; Eintraege ohne kind stammen aus der Zeit vor dem Beinblock und sind
   Rumpf. */
export function buildReport(plan, th, startDate, from, to, activities, zonesById, logEntries, wahlen){
  const byDay = {};
  for(const a of (activities || [])){
    const d = localDay(a.start_date_local);
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
    const key = isoDayLocal(cur);
    rows.push(compareDay(plan, th, new Date(cur), startDate,
                         byDay[key] || [], zonesById, coreByDay[key] || [],
                         legByDay[key] || [], wahlen));
    cur.setDate(cur.getDate() + 1);
  }
  return rows;
}
