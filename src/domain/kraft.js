/* Krafttraining mit Saetzen - neu in Plan 2.

   Plan 1 kannte zwei Kraftformen: den Rumpfzirkel gegen die Uhr und den
   Beinblock als Zirkel mit kurzen Pausen. Plan 2 laesst den Zirkel nur noch
   als kurze Erhaltung am Mittwoch stehen und trainiert die Kraft in
   einzelnen Saetzen mit voller Pause - Begruendung im Trainingsplan,
   Abschnitt 7: im Zirkel leidet die Technik mit der Ermuedung, und die Last
   soll steigen.

   Zwei Programme stehen in plan.json unter folgeplan.kraft.programme:
     beine        Donnerstagabend, Saetze nacheinander, 2-3 min Pause
     oberkoerper  Montag, Supersaetze: A1 und A2 im Wechsel, Pause nach dem
                  Paar, drei Runden je Paar, zum Schluss das Koffertragen

   Hier entsteht daraus der Ablauf als Liste von Saetzen - jeder mit Uebung,
   Satznummer, Ziel und der Pause danach. Der Satz selbst endet, wenn er zu
   Ende ist (Taste "Erledigt"); gezaehlt wird nur die Pause - aus demselben
   Grund wie im Beinblock: ein Satz mit 3 s Absenken laesst sich nicht gegen
   eine Uhr fahren.

   Rein: kein DOM, keine Uhr. */

import { planWoche, isRecoveryWeek } from './week.js';

export function kraftUebung(plan, key){
  const k = plan && plan.kraft;
  return k ? (k.uebungen.find(u => u.key === key) || null) : null;
}

export function kraftProgramm(plan, key){
  const k = plan && plan.kraft;
  return k && k.programme ? (k.programme[key] || null) : null;
}

/* Die Kraftphase einer Woche: K1 (Technik) oder K2 (Kraft). Sie steht je
   Woche in der Datei, weil der Wechsel an einer Woche haengt (ab Woche 5) und
   nicht an einer Rechnung. */
export function kraftPhase(plan, week){
  if(!plan || plan.format !== 2) return null;
  return planWoche(plan, week).kraftPhase || 'K1';
}

function jePhase(wert, phase){
  if(wert && typeof wert === 'object') return wert[phase] != null ? wert[phase] : wert.K1;
  return wert;
}

/* Die Dosis eines Programms in einer Woche.

   `saetze` aus der Einheit des Tages sticht die Phase: in Erholungswochen
   stehen dort 2 Saetze bei gleichem Gewicht. Fehlt die Angabe, gilt sie in
   einer Erholungswoche trotzdem - der Trainingsplan nennt sie als Regel fuer
   jede Erholungswoche, und eine Regel, die nur gilt, wenn jemand sie in jede
   Woche abschreibt, gilt irgendwann nicht mehr. */
export function kraftDosis(plan, week, programmKey, einheit){
  const prog = kraftProgramm(plan, programmKey);
  if(!prog) return null;
  const phase = kraftPhase(plan, week) || 'K1';
  const erholung = isRecoveryWeek(plan, week);
  const ueber = einheit && einheit.saetze > 0 ? einheit.saetze : (erholung ? 2 : null);

  const zeile = (f, standardSaetze) => {
    const ex = kraftUebung(plan, f.uebung);
    const voll = jePhase(f.saetze, phase) || standardSaetze;
    return {
      key: f.uebung, name: ex ? ex.name : f.uebung, ex,
      saetze: f.abschluss ? voll : (ueber || voll),
      saetzeText: jePhase(f.saetzeText, phase) || null,
      wdh: jePhase(f.wdh, phase) || '',
      einheit: ex ? (ex.einheit || 'wdh') : 'wdh',
      jeSeite: !!(ex && ex.jeSeite),
      gewicht: !!(ex && ex.gewicht),
      stufenleiter: ex ? (ex.stufenleiter || null) : null,
      abschluss: !!f.abschluss
    };
  };

  const gruppen = [];
  for(const f of prog.folge){
    if(f.paar){
      gruppen.push({ paar: f.paar, runden: ueber || prog.runden || 1,
                     uebungen: f.uebungen.map(u => zeile(u, ueber || prog.runden || 1)) });
    } else {
      const z = zeile(f, 3);
      gruppen.push({ paar: null, runden: z.saetze, uebungen: [z] });
    }
  }
  return {
    key: programmKey, titel: prog.titel, dauer: prog.dauer || null, phase,
    phaseInfo: (plan.kraft.phasen || {})[phase] || null,
    erholung, reduziert: !!ueber,
    pauseSek: prog.pauseSekunden, pauseText: prog.pauseText || null,
    aufwaermen: prog.aufwaermen || null,
    aufwaermUebungen: (prog.aufwaermUebungen || []).map(k => kraftUebung(plan, k)).filter(Boolean),
    hinweise: prog.hinweise || [],
    gruppen
  };
}

/* Alle Uebungen eines Programms in der Reihenfolge des Ablaufs, jede einmal. */
export function kraftUebungen(dosis){
  return dosis ? dosis.gruppen.flatMap(g => g.uebungen) : [];
}

/* Der Ablauf als flache Liste von Saetzen.

   Ein Paar laeuft Runde fuer Runde: A1, A2, Pause - dreimal -, dann B. Die
   Pause steht nach dem Paar und nicht nach jeder Uebung; zwischen A1 und A2
   wird gewechselt, nicht gewartet. Nach dem letzten Satz des Programms steht
   keine Pause mehr. */
export function kraftAblauf(dosis){
  if(!dosis) return [];
  const out = [];
  for(const g of dosis.gruppen){
    for(let r = 1; r <= g.runden; r++){
      g.uebungen.forEach((u, i) => {
        const letzteImPaar = i === g.uebungen.length - 1;
        out.push({
          key: u.key, name: u.name, satz: r, saetze: g.runden, paar: g.paar,
          paarIndex: g.paar ? i + 1 : null,
          wdh: u.wdh, einheit: u.einheit, jeSeite: u.jeSeite, gewicht: u.gewicht,
          stufenleiter: u.stufenleiter,
          pauseNach: letzteImPaar ? (u.abschluss ? 60 : dosis.pauseSek) : 0
        });
      });
    }
  }
  if(out.length) out[out.length - 1].pauseNach = 0;
  return out;
}

/* Das Ziel eines Satzes als eine Zeile: "8–10 Wdh. je Seite", "20–40 s". */
export function satzZiel(s){
  if(!s) return '';
  const w = String(s.wdh || '').trim();
  const einheit = /\b(s|m|Wdh\.?)\b/.test(w) ? '' : (s.einheit === 's' ? ' s' : s.einheit === 'm' ? ' m' : ' Wdh.');
  return w + einheit + (s.jeSeite && !/je Seite/.test(w) ? ' je Seite' : '');
}

/* Die untere Zahl einer Spanne als Vorschlag fuer das Eingabefeld. */
export function zielZahl(s){
  const m = String((s && s.wdh) || '').match(/\d+/);
  return m ? Number(m[0]) : 0;
}

export function einheitKurz(s){
  return s && s.einheit === 's' ? 's' : s && s.einheit === 'm' ? 'm' : 'Wdh.';
}

/* ---- Stufenleitern ----

   Liegestuetz, Unterarmstuetz, Seitstuetz und Klimmzug steigen nicht ueber
   das Gewicht, sondern ueber die Stufe. Welche Stufe gerade gilt, steht im
   Speicher des Geraets (store.stufen) - nicht in plan.json, denn sie ist ein
   Stand und keine Vorgabe. */
export function stufenleiter(plan, key){
  const l = plan && plan.kraft && plan.kraft.stufenleitern;
  return l ? (l[key] || null) : null;
}

/* Die Stufe als Text. Ohne gespeicherten Stand die erste - die Startstufe
   wird am ersten Montag bestimmt, bis dahin ist die leichteste die sichere
   Annahme. */
export function stufeText(plan, key, stufen){
  const l = stufenleiter(plan, key);
  if(!l) return null;
  const i = Math.min(Math.max((stufen && stufen[key]) || 0, 0), l.stufen.length - 1);
  return { index: i, anzahl: l.stufen.length, text: l.stufen[i], name: l.name };
}

/* ---- Protokoll ----

   Ein Eintrag je Tag und Programm in coreLog, kind 'kraft'. Je Satz die
   Wiederholungen (oder Sekunden, Meter) und das Gewicht - das ist, was
   intervals.icu von einer Krafteinheit nicht weiss, und was die doppelte
   Progression braucht: erst mehr Wiederholungen, dann mehr Gewicht. */
export function kraftEintragId(programm, tagIso){
  return 'kraft-' + programm + '-' + tagIso;
}

export function kraftSaetzeErledigt(eintrag){
  if(!eintrag || !Array.isArray(eintrag.saetze)) return 0;
  return eintrag.saetze.filter(s => s && s.wert > 0).length;
}

/* Der letzte Wert einer Uebung vor einem Tag - als Vorschlag fuer das
   Gewicht. Wer am Donnerstag mit 12 kg aufgehoert hat, faengt naechste Woche
   nicht bei null an. */
export function letztesGewicht(log, uebung, vorTagIso){
  const eintraege = (log || [])
    .filter(e => e && e.kind === 'kraft' && e.day < vorTagIso && Array.isArray(e.saetze))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
  for(const e of eintraege){
    const s = e.saetze.filter(x => x && x.uebung === uebung && x.gewicht > 0).pop();
    if(s) return s.gewicht;
  }
  return null;
}
