/* Die Abschnitte einer Fahrt mit Leistungsmesser - und was sich je Abschnitt
   daraus rechnen laesst.

   Anlass war die Samstagsausfahrt vom 19.09.2026: Decoupling im Z2-Teil
   -1,2 %, beide Bloecke mit 172 und 171 W im Ziel, und trotzdem "zu hart".
   Die Auswertung zaehlte jede Sekunde ueber 144 W gegen die Fahrt - die 24
   geplanten Blockminuten genauso wie die Kuppe und den Antritt nach der
   Schotterpassage. Eine Zahl ueber die ganze Fahrt kann nicht unterscheiden,
   ob Zeit ueber Z2 gewollt war oder nicht. Deshalb wird die Fahrt zuerst
   zerlegt und erst dann bewertet:

     ein     die ersten 15 min, Einfahren - nicht bewertet
     aus     die letzten 10 min, Ausrollen - nicht bewertet
     block   geplante Bloecke, nur in Blockwochen - gegen ihr eigenes Ziel
     pause   das lockere Rollen nach einem Block - nur ein Hinweis
     z2      der Rest - das, woran "zu hart" haengt

   In dieser Reihenfolge: was im Einfahren liegt, ist Einfahren, auch wenn es
   in eine Runde faellt.

   Stillstand - 0 W und unter 2 km/h - faellt aus allen Rechnungen heraus. Die
   Zeitachse der Abschnitte ist die Bewegungszeit: "die ersten 15 min" sind 15
   gefahrene Minuten, nicht 15 Minuten, von denen fuenf an der Ampel standen.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { gleitenderMittel, WATT_FENSTER_SEK, z2WattBand, blockWattBand } from './zones.js';
import { saturdayBlockData } from './week.js';

/* Bewertungspolitik der App, nicht Trainingsplan - dieselbe Begruendung wie
   bei den Toleranzen in analysis.js. Einfahren, Ausrollen und Blockpause
   kommen aus plan.json, sobald sie dort stehen. */
export const ABSCHNITT = {
  stillKmh: 2,          // darunter und bei 0 W: Stillstand
  rundeMinSek: 10 * 60, // eine Runde ist ein Block, wenn sie 10-14 min dauert
  rundeMaxSek: 14 * 60,
  rundeMinWatt: 160,    // ... und im Schnitt mindestens so viel Leistung hat
  ueberZ2Anteil: 0.10,  // mehr Zeit ueber Z2 im Z2-Anteil ist "zu hart"
  entkopplungMinSek: 20 * 60  // darunter keine Haelften, die etwas sagen
};

/* Abstand bis zum naechsten Messwert, gedeckelt wie in zones.js: eine Luecke
   in der Aufzeichnung ist keine Fahrzeit. */
function dtAn(zeit, i){
  const d = i + 1 < zeit.length ? zeit[i + 1] - zeit[i] : 1;
  if(!(d > 0)) return 0;
  return d > 60 ? 60 : d;
}

function mittel(proben, feld, nurPositiv){
  let s = 0, n = 0;
  for(const p of proben){
    const v = p[feld];
    if(!Number.isFinite(v) || (nurPositiv && !(v > 0))) continue;
    s += v * p.dt; n += p.dt;
  }
  return n > 0 ? s / n : null;
}

function sekunden(proben){
  return proben.reduce((n, p) => n + p.dt, 0);
}

/* Aus einer Runde von intervals.icu einen Bereich auf der Bewegungszeit.
   start_time und end_time stehen in Sekunden der Aufzeichnung, also auf
   derselben Achse wie der time-Stream. */
function rundenBloecke(proben, runden){
  const out = [];
  for(const r of runden || []){
    if(!r || !Number.isFinite(r.start_time) || !Number.isFinite(r.end_time)) continue;
    const dauer = r.moving_time || r.elapsed_time || (r.end_time - r.start_time);
    if(dauer < ABSCHNITT.rundeMinSek || dauer > ABSCHNITT.rundeMaxSek) continue;
    if(!(r.average_watts >= ABSCHNITT.rundeMinWatt)) continue;
    const drin = proben.filter(p => p.zeit >= r.start_time && p.zeit < r.end_time);
    if(!drin.length) continue;
    out.push({ von: drin[0].t, bis: drin[drin.length - 1].t + drin[drin.length - 1].dt,
               quelle: 'runden' });
  }
  return out.sort((a, b) => a.von - b.von);
}

/* Ohne Runden: die staerksten nicht ueberlappenden Fenster in der zweiten
   Fahrthaelfte. Dort liegen die Bloecke laut Plan - und wer sie ohne
   Rundentaste gefahren hat, hat sie trotzdem gefahren.

   Bis zum Beginn des Ausrollens, wenn dafuer Platz ist; sonst bis zum Ende.
   Zwei Zeiger ueber die Bewegungszeit, die Fensterenergie als Differenz zweier
   Praefixsummen - linear ueber die Fahrt. */
function fensterBloecke(proben, anzahl, fensterSek, von, bis){
  const kandidaten = [];
  const n = proben.length;
  const praefix = new Array(n + 1);
  praefix[0] = 0;
  for(let i = 0; i < n; i++){
    const w = Number.isFinite(proben[i].watt) ? proben[i].watt : 0;
    praefix[i + 1] = praefix[i] + w * proben[i].dt;
  }
  let j = 0;
  for(let i = 0; i < n; i++){
    const a = proben[i].t;
    if(a < von) continue;
    if(a + fensterSek > bis) break;
    if(j < i) j = i;
    while(j < n && proben[j].t < a + fensterSek) j++;
    const dauer = (j < n ? proben[j].t : proben[n - 1].t + proben[n - 1].dt) - a;
    if(dauer <= 0) continue;
    kandidaten.push({ von: a, bis: a + fensterSek, watt: (praefix[j] - praefix[i]) / dauer });
  }
  kandidaten.sort((x, y) => y.watt - x.watt);
  const gewaehlt = [];
  for(const k of kandidaten){
    if(gewaehlt.length >= anzahl) break;
    if(gewaehlt.some(g => k.von < g.bis && g.von < k.bis)) continue;
    gewaehlt.push({ von: k.von, bis: k.bis, quelle: 'fenster' });
  }
  return gewaehlt.sort((a, b) => a.von - b.von);
}

/* Pw:HR ueber den Z2-Anteil, Haelften nach Bewegungszeit.

   (P/HF erste Haelfte - P/HF zweite Haelfte) / P/HF erste Haelfte * 100.
   Positiv heisst: spaeter mehr Puls fuer dieselbe Leistung. */
export function entkopplung(proben){
  const mitHf = proben.filter(p => p.hf > 0 && Number.isFinite(p.watt));
  const gesamt = sekunden(mitHf);
  if(gesamt < ABSCHNITT.entkopplungMinSek) return null;
  const h = [[], []];
  let kum = 0;
  for(const p of mitHf){
    h[kum + p.dt / 2 < gesamt / 2 ? 0 : 1].push(p);
    kum += p.dt;
  }
  const teil = t => {
    const watt = mittel(t, 'watt'), hf = mittel(t, 'hf');
    return { watt, hf, ef: watt / hf, sek: sekunden(t) };
  };
  const a = teil(h[0]), b = teil(h[1]);
  if(!(a.ef > 0) || !(b.ef > 0)) return null;
  return { prozent: (a.ef - b.ef) / a.ef * 100, erste: a, zweite: b, sek: gesamt };
}

/* Die Fahrt zerlegen und je Abschnitt rechnen.

     zeit, watt, puls, tempoMs, kadenz   die Streams, gleich lang; nur zeit
                                         und watt sind Pflicht
     runden        icu_intervals der Aktivitaet, oder null
     bloecke       { reps, minutes, restMinutes } aus dem Plan, oder null -
                   ohne Blockwoche gibt es keine Bloecke, auch wenn Runden da
                   sind
     einfahrenSek, ausrollenSek
     z2Max         Obergrenze Z2 in Watt, gegen die der Z2-Anteil zaehlt

   null, wenn es keinen Leistungsstrom gibt. */
export function fahrtAbschnitte(o){
  const zeit = o.zeit, watt = o.watt;
  const n = Array.isArray(watt) ? watt.length : 0;
  if(!n || !Array.isArray(zeit) || zeit.length !== n) return null;
  const hat = s => Array.isArray(s) && s.length === n;
  const puls = hat(o.puls) ? o.puls : null;
  const tempo = hat(o.tempoMs) ? o.tempoMs : null;
  const kadenz = hat(o.kadenz) ? o.kadenz : null;

  /* Stillstand heraus, Bewegungszeit aufbauen. Ohne Tempostrom laesst sich
     Stillstand nicht von Rollen unterscheiden - dann bleibt alles drin. */
  const proben = [];
  let t = 0, stillSek = 0;
  for(let i = 0; i < n; i++){
    const dt = dtAn(zeit, i);
    if(!dt) continue;
    const w = watt[i];
    const steht = !(w > 0) && tempo && Number.isFinite(tempo[i]) && tempo[i] * 3.6 < ABSCHNITT.stillKmh;
    if(steht){ stillSek += dt; continue; }
    proben.push({ zeit: zeit[i], t, dt, watt: Number.isFinite(w) ? w : 0,
                  hf: puls ? puls[i] : null, kadenz: kadenz ? kadenz[i] : null });
    t += dt;
  }
  const bewegt = t;
  if(!proben.length) return null;

  /* Geglaettet auf der Bewegungszeit - ein Stillstand an der Ampel zieht so
     das Mittel davor und danach nicht auf null. */
  const glatt = gleitenderMittel(proben.map(p => p.watt), proben.map(p => p.t), WATT_FENSTER_SEK);
  proben.forEach((p, i) => { p.glatt = glatt[i]; });

  const einEnde = Math.min(o.einfahrenSek || 0, bewegt);
  const ausAnfang = Math.max(einEnde, bewegt - (o.ausrollenSek || 0));

  let bloecke = [];
  let blockQuelle = null;
  const soll = o.bloecke;
  if(soll && soll.reps > 0){
    bloecke = rundenBloecke(proben, o.runden);
    if(bloecke.length) blockQuelle = 'runden';
    else {
      const fenster = soll.minutes * 60;
      const bedarf = soll.reps * fenster;
      const bis = ausAnfang - bewegt / 2 >= bedarf ? ausAnfang : bewegt;
      if(bis - bewegt / 2 >= bedarf){
        bloecke = fensterBloecke(proben, soll.reps, fenster, bewegt / 2, bis);
        if(bloecke.length) blockQuelle = 'fenster';
      }
    }
  }
  const pausenSek = soll ? (soll.restMinutes || 0) * 60 : 0;
  const pausen = bloecke.slice(0, -1).map((b, i) => ({
    von: b.bis, bis: Math.min(b.bis + pausenSek, bloecke[i + 1].von)
  })).filter(p => p.bis > p.von);

  const art = p => {
    if(p.t < einEnde) return 'ein';
    if(p.t >= ausAnfang) return 'aus';
    if(bloecke.some(b => p.t >= b.von && p.t < b.bis)) return 'block';
    if(pausen.some(b => p.t >= b.von && p.t < b.bis)) return 'pause';
    return 'z2';
  };
  for(const p of proben) p.art = art(p);

  const z2 = proben.filter(p => p.art === 'z2');
  const z2Sek = sekunden(z2);
  const ueberSek = o.z2Max > 0
    ? z2.reduce((s, p) => s + (Math.floor(p.glatt) > o.z2Max ? p.dt : 0), 0) : 0;

  /* Das Decoupling nur ueber den zusammenhaengenden Z2-Teil vor dem ersten
     Block - danach sind die Beine andere, und ein Puls, der nach 24 min Z3
     nicht mehr ganz zurueckkommt, ist keine Aussage ueber die Grundlage. */
  const driftEnde = bloecke.length ? bloecke[0].von : ausAnfang;
  const driftProben = z2.filter(p => p.t < driftEnde);

  const abschnitt = (von, bis, extra) => {
    const drin = proben.filter(p => p.t >= von && p.t < bis);
    return Object.assign({
      von, bis, sek: sekunden(drin),
      watt: mittel(drin, 'watt'), hf: mittel(drin, 'hf', true), kadenz: mittel(drin, 'kadenz', true)
    }, extra);
  };

  return {
    bewegtSek: bewegt, stillSek,
    einfahrenSek: sekunden(proben.filter(p => p.art === 'ein')),
    ausrollenSek: sekunden(proben.filter(p => p.art === 'aus')),
    z2: {
      sek: z2Sek, ueberSek,
      watt: mittel(z2, 'watt'), hf: mittel(z2, 'hf', true), kadenz: mittel(z2, 'kadenz', true)
    },
    entkopplung: puls ? entkopplung(driftProben) : null,
    driftSek: sekunden(driftProben),
    bloecke: bloecke.map(b => abschnitt(b.von, b.bis, { quelle: b.quelle })),
    blockQuelle,
    pausen: pausen.map(p => abschnitt(p.von, p.bis))
  };
}

/* Die ersten Ziffern eines Kadenztexts: "80–85 rpm" -> [80, 85]. */
function rpmSpanne(text){
  const m = typeof text === 'string' ? text.match(/(\d+)\s*[–-]\s*(\d+)/) : null;
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/* Was die Zerlegung und das Urteil aus dem Plan brauchen, an einer Stelle:
   Z2 aus der Test-FTP, das Blockziel aus der Arbeits-FTP, die Bloecke nur in
   einer Blockwoche und nur am Samstag, Einfahren und Ausrollen aus
   saturdayRide, die Kadenzziele des Cube. Eine Fahrt mit Leistungsmesser ist
   eine Fahrt auf dem Cube - das Trekkingrad hat keinen. */
export function abschnittsRahmen(plan, th, week, istSamstag){
  const z2Band = z2WattBand(plan, th);
  if(!z2Band) return null;
  const b = istSamstag ? saturdayBlockData(plan, week) : null;
  const sr = plan.saturdayRide || {};
  const z2Kad = rpmSpanne(plan.cadence && plan.cadence.byZone && plan.cadence.byZone.z2);
  const blockKad = rpmSpanne(sr.blockCadence);
  return {
    z2Band,
    blockBand: b ? blockWattBand(plan, th) : null,
    bloeckeSoll: b ? { reps: b.reps, minutes: b.minutes, restMinutes: b.restMinutes } : null,
    einfahrenSek: (sr.warmupMinutes || 0) * 60,
    ausrollenSek: (sr.cooldownMinutes || 0) * 60,
    kadenzZiel: {
      z2: z2Kad ? plan.cadence.byZone.z2 : null, z2Min: z2Kad ? z2Kad[0] : null,
      block: blockKad ? sr.blockCadence : null,
      blockMin: blockKad ? blockKad[0] : null, blockMax: blockKad ? blockKad[1] : null
    }
  };
}

/* Zerlegen und den Rahmen dazulegen - das, was an den Zonen einer Fahrt als
   _abschnitte haengt und was analysis.js liest. null, wenn es nichts zu
   bewerten gibt: kein Leistungsstrom, oder ein Z2-Anteil unter fuenf Minuten.
   Dann bewertet analysis.js wie bisher aus den Zonen. */
export function abschnittsAuswertung(rahmen, streams, runden){
  if(!rahmen) return null;
  const a = fahrtAbschnitte({
    zeit: streams.zeit, watt: streams.watt, puls: streams.puls,
    tempoMs: streams.tempoMs, kadenz: streams.kadenz, runden,
    bloecke: rahmen.bloeckeSoll,
    einfahrenSek: rahmen.einfahrenSek, ausrollenSek: rahmen.ausrollenSek,
    z2Max: rahmen.z2Band.max
  });
  if(!a || a.z2.sek < 5 * 60 || !(a.z2.watt >= 0)) return null;
  return Object.assign(a, {
    z2Band: rahmen.z2Band, blockBand: rahmen.blockBand, bloeckeSoll: rahmen.bloeckeSoll,
    kadenzZiel: rahmen.kadenzZiel
  });
}
