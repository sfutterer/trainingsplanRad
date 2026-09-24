/* Die Wiederholungen einer Intervalleinheit und die Nachsteuerung ihres
   Zielbands.

   Anlass ist Fassung 11 des Trainingsplans, App-Punkt 33. Zwei
   Intervalleinheiten in Folge (17.09., 24.09.2026) haben das Pulskriterium
   "Ø HF der letzten 60 s >= LTHR" verfehlt, obwohl das Zielband gehalten
   wurde - bei 239 W lag der Puls der letzten Minute noch unter 163 bpm, und
   nach vier Wiederholungen kamen 268 W ueber 4 min. Das Band lag also zu
   tief, und die Zahl, an der das sichtbar wird, stand nirgends: die Analyse
   zaehlte nur "harte Minuten" ueber die ganze Einheit.

   Seit Fassung 11 steuert das Pulskriterium das Band direkt, in 5-W-Schritten
   (Ausfuehrungsregel 7). Diese Datei rechnet dafuer zwei Dinge:

     je Wiederholung   Ø-Leistung und der Ø-Puls der letzten 60 s
     daraus            ein Hinweis: naechstes Mal +5 W, -5 W, oder Band halten

   Was sie ausdruecklich nicht tut: plan.json aendern. Die Anpassung bleibt
   eine bewusste Entscheidung - so steht es in Punkt 33, und es ist dieselbe
   Regel wie beim Schwellentest, dessen Ergebnis auch nicht von selbst in die
   Zonen wandert.

   Die zweite Haelfte der Regel ist nicht messbar und wird deshalb nicht
   behauptet: "die Atmung am Limit" sieht keine Aufzeichnung. Wo der Puls
   allein fuer ein Zurueck spricht, sagt die App, dass die Atmung entscheidet -
   "Atmung sticht die Zahl" gilt auch fuer diese Zahl.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { fahrtProben, fensterBloecke, mittel, sekunden } from './abschnitte.js';

/* Bewertungspolitik der App, nicht Trainingsplan - dieselbe Begruendung wie
   bei den Toleranzen in analysis.js und abschnitte.js. Der Plan nennt den
   5-W-Schritt, die LTHR-Schwelle und die 5 % Leistungseinbruch; alles Weitere
   ist die Frage, wie eine Aufzeichnung ueberhaupt in Wiederholungen zerlegt
   wird, und die stellt sich nur der App. */
export const NACHSTEUER = {
  schrittWatt: 5,        // ein Schritt der Nachsteuerung
  dauerToleranz: 0.25,   // eine Runde gilt als Wiederholung bei +-25 % der Solldauer
  wattAnteil: 0.75,      // ... und ab so viel des Zielbandes an Ø-Leistung
  hfFensterSek: 60,      // das Pulskriterium liest die letzten 60 s
  maximalFaktor: 1.05,   // so weit ueber dem Band ist die letzte Wdh. ein "alles raus"
  einbruchFaktor: 0.95,  // so weit unter den Vorwiederholungen ist es ein Einbruch
  mindestWdh: 2          // unter zwei bewertbaren Wiederholungen kein Hinweis
};

/* Was die Zerlegung und der Hinweis aus dem Plan brauchen, an einer Stelle.

   `t` ist der Sollwert des Tages aus day.js - er traegt seit Fassung 11 das
   Zielband mit. Ohne Band gibt es nichts nachzusteuern: in Phase 1 gibt der
   Plan keine Leistung vor, und ein Hinweis auf 5 W mehr waere dort eine
   Vorgabe, die der Trainingsplan nicht macht.

   Ohne LTHR ebenso nicht: das Kriterium ist der Puls gegen die LTHR und nicht
   gegen die unbekannte HFmax - genau deshalb wurde es mit Fassung 7
   umgestellt (Punkt 27). Eine Schwelle aus einer Annahme waere dieselbe
   Wackelei, die der Plan dort abgeschafft hat. */
export function wiederholungsRahmen(t, th){
  if(!t || t.sport !== 'ride' || t.test) return null;
  if(!(t.reps > 0) || !(t.repMinutes > 0) || !t.band) return null;
  const lthr = th && th.lthr > 0 ? th.lthr : null;
  return {
    reps: t.reps, workSek: Math.round(t.repMinutes * 60), band: t.band, lthr,
    mindestWatt: Math.round(t.band.min * NACHSTEUER.wattAnteil)
  };
}

/* Die Wiederholungen aus den Runden der Aufzeichnung.

   Wer die Rundentaste drueckt, hat seine Wiederholungen selbst markiert, und
   das ist die genauere Quelle - dieselbe Rangfolge wie bei den
   Samstagsbloecken. Gefiltert wird nach Dauer und Leistung: die Pausen sind
   ebenso Runden und dauern hier zufaellig genauso lang wie die Belastung
   (4 min Intervall, 4 min Pause), also entscheidet die Leistung. */
function rundenWdh(proben, runden, rahmen){
  const out = [];
  for(const r of runden || []){
    if(!r || !Number.isFinite(r.start_time) || !Number.isFinite(r.end_time)) continue;
    const dauer = r.moving_time || r.elapsed_time || (r.end_time - r.start_time);
    const tol = rahmen.workSek * NACHSTEUER.dauerToleranz;
    if(dauer < rahmen.workSek - tol || dauer > rahmen.workSek + tol) continue;
    if(!(r.average_watts >= rahmen.mindestWatt)) continue;
    const drin = proben.filter(p => p.zeit >= r.start_time && p.zeit < r.end_time);
    if(!drin.length) continue;
    const letzte = drin[drin.length - 1];
    out.push({ von: drin[0].t, bis: letzte.t + letzte.dt });
  }
  return out.sort((a, b) => a.von - b.von);
}

/* Ohne Runden: die staerksten nicht ueberlappenden Fenster der Solldauer,
   ueber die ganze Fahrt.

   Anders als am Samstag nicht auf die zweite Fahrthaelfte beschraenkt - die
   Intervalle liegen am Donnerstag gleich nach dem Einfahren, und der letzte
   liegt vor dem Ausrollen. Ein Fenster, das zur Haelfte in der Pause liegt,
   bleibt draussen, weil ein anderes mit derselben Laenge mehr Leistung hat. */
function fensterWdh(proben, bewegt, rahmen){
  if(bewegt < rahmen.workSek) return [];
  const w = fensterBloecke(proben, rahmen.reps, rahmen.workSek, 0, bewegt);
  return w.map(x => ({ von: x.von, bis: x.bis }));
}

/* Eine Wiederholung ausrechnen: Ø-Leistung ueber die ganze, Ø-Puls ueber die
   letzten 60 s.

   Der Puls am Ende und nicht im Mittel: er hinkt dem Tritt nachher, und ueber
   vier Minuten zieht die erste Minute das Mittel nach unten. Genau darum
   nennt der Plan "die letzten 60 s" und nicht "im Intervall". */
function rechne(proben, nr, von, bis, quelle){
  const drin = proben.filter(p => p.t >= von && p.t < bis);
  const ende = drin.filter(p => p.t >= bis - NACHSTEUER.hfFensterSek);
  return {
    nr, von, bis, quelle,
    sek: sekunden(drin),
    watt: mittel(drin, 'watt'),
    hf: mittel(drin, 'hf', true),
    hfEnde: mittel(ende.length ? ende : drin, 'hf', true),
    hfMax: drin.reduce((m, p) => (p.hf > m ? p.hf : m), 0) || null
  };
}

/* Die Nachsteuerung nach Ausfuehrungsregel 7 des Trainingsplans.

   Die Regel im Wortlaut, und daneben, was die App davon sehen kann:

     "Erreichen die letzten zwei Wiederholungen die 163 bpm nicht, obwohl das
      Band gehalten wurde" -> +5 W. Vollstaendig messbar.

     "Liegt der Puls schon ab Wdh. 2 darueber und ist die Atmung am Limit" ->
      -5 W. Die Atmung sieht die App nicht; sie nennt den Befund und legt die
      Entscheidung zurueck.

     "oder bricht die Leistung zur letzten Wiederholung um mehr als 5 % ein"
      -> -5 W. Messbar.

     "Die Wiederholungen 1 und 2 duerfen unter 163 bpm bleiben - der Puls
      steigt ueber die Serie ohnehin an." Deshalb die letzten zwei und nicht
      der Schnitt.

     "Eine gewollte schnellere Schlusswiederholung (alles raus) ist erlaubt,
      fliesst aber nicht in die Nachsteuerung ein. Bewertet werden dann die
      Wiederholungen 3 und 4." Erkannt an der Leistung: mehr als 5 % ueber der
      Bandobergrenze, und nur die letzte. Ein Maximalversuch mitten in der
      Serie ist keiner, sondern ein zu hoch angefahrenes Intervall. */
export function nachsteuerung(wdh, band, lthr){
  const halten = (grund, extra) => Object.assign(
    { richtung: 'halten', schritt: 0, neu: null, grund, bewertet: [], maximalversuch: null,
      vorbehalt: false }, extra);

  if(!band) return halten('ohneBand');
  if(!lthr) return halten('ohneLthr');
  if(wdh.length < NACHSTEUER.mindestWdh) return halten('zuWenige');

  /* Die bewusst schnellere Schlusswiederholung aus der Bewertung nehmen. */
  const letzte = wdh[wdh.length - 1];
  const maximal = wdh.length > NACHSTEUER.mindestWdh &&
                  letzte.watt > band.max * NACHSTEUER.maximalFaktor ? letzte : null;
  const reihe = maximal ? wdh.slice(0, -1) : wdh;
  if(reihe.length < NACHSTEUER.mindestWdh){
    return halten('zuWenige', { maximalversuch: maximal ? maximal.nr : null });
  }

  const bewertet = reihe.slice(-NACHSTEUER.mindestWdh);
  const nummern = bewertet.map(x => x.nr);
  const stufe = (richtung, grund, extra) => Object.assign({
    richtung, grund, bewertet: nummern, maximalversuch: maximal ? maximal.nr : null,
    vorbehalt: false,
    schritt: richtung === 'plus' ? NACHSTEUER.schrittWatt
           : richtung === 'minus' ? -NACHSTEUER.schrittWatt : 0
  }, extra);
  const versetzt = s => ({ min: band.min + s, max: band.max + s });

  /* Ohne Puls in den bewerteten Wiederholungen entscheidet das Kriterium
     nichts - dann bleibt das Band, und der Grund steht dabei. */
  if(bewertet.some(x => !(x.hfEnde > 0))){
    return stufe('halten', 'ohnePuls', { neu: null });
  }

  /* Leistungseinbruch zur letzten Wiederholung. Gegen die vorigen und nicht
     gegen das Band: wer die ganze Serie ueber dem Band faehrt und am Ende
     einbricht, ist trotzdem eingebrochen. */
  const vorige = reihe.slice(0, -1).filter(x => x.watt > 0);
  const schluss = reihe[reihe.length - 1];
  const schnitt = vorige.length
    ? vorige.reduce((n, x) => n + x.watt, 0) / vorige.length : null;
  if(schnitt && schluss.watt < schnitt * NACHSTEUER.einbruchFaktor){
    return stufe('minus', 'einbruch',
      { neu: versetzt(-NACHSTEUER.schrittWatt), einbruch: { schnitt, letzte: schluss.watt } });
  }

  /* Puls ab der zweiten Wiederholung ueber der LTHR. Ab der zweiten, weil die
     erste laut Plan darunter bleiben darf. */
  const abZwei = reihe.filter(x => x.nr >= 2 && x.hfEnde > 0);
  if(abZwei.length && abZwei.every(x => x.hfEnde >= lthr)){
    return stufe('minus', 'pulsHoch',
      { neu: versetzt(-NACHSTEUER.schrittWatt), vorbehalt: true });
  }

  /* Das Kriterium verfehlt - aber nur, wenn das Band auch gehalten wurde.
     Wer 20 W darunter faehrt, hat kein zu tiefes Band, sondern die Vorgabe
     nicht getroffen. */
  if(bewertet.every(x => x.hfEnde < lthr)){
    if(bewertet.every(x => x.watt >= band.min)){
      return stufe('plus', 'pulsTief', { neu: versetzt(NACHSTEUER.schrittWatt) });
    }
    return stufe('halten', 'bandNichtGehalten', { neu: null });
  }

  return stufe('halten', 'imBand', { neu: null });
}

/* Zerlegen, rechnen, den Hinweis dazulegen - das, was an den Zonen einer
   Fahrt als _wiederholungen haengt und was analysis.js liest.

   null, wenn es nichts zu bewerten gibt: kein Zielband, kein
   Leistungsstrom, oder keine Wiederholung gefunden. Dann bewertet analysis.js
   wie bisher aus den harten Minuten. */
export function wiederholungsAuswertung(rahmen, streams, runden){
  if(!rahmen) return null;
  const gefahren = fahrtProben({
    zeit: streams.zeit, watt: streams.watt, puls: streams.puls,
    tempoMs: streams.tempoMs, kadenz: streams.kadenz
  });
  if(!gefahren) return null;
  const { proben, bewegt } = gefahren;

  let bereiche = rundenWdh(proben, runden, rahmen);
  let quelle = bereiche.length ? 'runden' : null;
  if(!bereiche.length){
    bereiche = fensterWdh(proben, bewegt, rahmen);
    if(bereiche.length) quelle = 'fenster';
  }
  if(!bereiche.length) return null;

  const wdh = bereiche.map((b, i) => rechne(proben, i + 1, b.von, b.bis, quelle));
  return {
    wdh, quelle, band: rahmen.band, lthr: rahmen.lthr, soll: rahmen.reps,
    hinweis: nachsteuerung(wdh, rahmen.band, rahmen.lthr)
  };
}
