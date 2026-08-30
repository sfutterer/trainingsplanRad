/* Fazit einer Fahrt: passt das zum Plan, und wenn nicht, was aendern?

   Die Tagesbewertung in analysis.js sagt, OB etwas abweicht - sie kennt aber
   nur Puls, Dauer und Zonen. Ob der Puls hoch lag, weil zu hart gefahren
   wurde, oder weil 60 % der Strecke gegen 25 km/h Wind ging, 400 Hoehenmeter
   drin waren und es 28 Grad hatte, steht dort nicht. Genau diese Luecke fuellt
   das Fazit: Urteil, Begruendung, und was daraus fuer die naechste Fahrt folgt.

   Bewertungspolitik, keine Trainingslehre aus dem Plandokument: die Schwellen
   hier sind Erfahrungswerte und stehen deshalb in der App, nicht in
   plan.json. */

import { zahl } from './zahlen.js';

export const LAST = {
  gegenViel: 55, gegenEtwas: 35,      // Prozent der Strecke gegen den Wind
  hmViel: 10, hmEtwas: 6,             // Hoehenmeter je Kilometer
  wegViel: 25,                        // Prozent unbefestigt
  heissViel: 27, heissEtwas: 24,      // Grad
  kalt: 3,
  regen: 1,                           // Millimeter in der Stunde
  boe: 45                             // km/h
};

/* Eine Stelle hinter dem Komma, deutsch geschrieben. Frueher hiess das hier
   ein() - genau wie eine zweite Funktion in Auswertung.jsx, die dasselbe
   versprach und 20 als "20,0" statt als "20" schrieb. Jetzt rechnen beide
   mit zahl(v, 1). */
const zahl1 = v => zahl(v, 1);

function kmh(v){ return Math.round(v) + ' km/h'; }
function pz(v){ return Math.round(v) + ' %'; }

/* Wie schwer waren die Bedingungen? Der Punktwert entscheidet nur darueber, ob
   eine Abweichung als erklaert durchgeht - er wird nirgends angezeigt. */
export function umfeldLast(bilanz, wetter, verfassung){
  const teile = [];
  let punkte = 0;

  if(bilanz && bilanz.windMeter){
    if(bilanz.gegenProzent >= LAST.gegenViel){
      punkte += 2;
      teile.push({ art: 'wind', text: pz(bilanz.gegenProzent) + ' der Strecke gegen den Wind, im Schnitt ' +
        kmh(bilanz.gegenSchnitt) + ' auf die Nase, in Spitzen ' + kmh(bilanz.staerksterGegenwind) + '.' });
    } else if(bilanz.gegenProzent >= LAST.gegenEtwas){
      punkte += 1;
      teile.push({ art: 'wind', text: pz(bilanz.gegenProzent) + ' der Strecke gegen den Wind, ' +
        pz(bilanz.rueckProzent) + ' mit Rückenwind.' });
    } else {
      teile.push({ art: 'wind', text: 'Wind kaum ein Faktor: ' + pz(bilanz.gegenProzent) + ' gegen, ' +
        pz(bilanz.rueckProzent) + ' im Rücken.' });
    }
  }

  if(bilanz && bilanz.km >= 1){
    const hm = Math.round(bilanz.hoch);
    if(bilanz.hmProKm >= LAST.hmViel){
      punkte += 2;
      teile.push({ art: 'berg', text: hm + ' Höhenmeter auf ' + zahl1(bilanz.km) + ' km (' +
        zahl1(bilanz.hmProKm) + ' hm/km) – ' + pz(bilanz.bergProzent) + ' der Strecke ging bergauf.' });
    } else if(bilanz.hmProKm >= LAST.hmEtwas){
      punkte += 1;
      teile.push({ art: 'berg', text: hm + ' Höhenmeter auf ' + zahl1(bilanz.km) + ' km (' +
        zahl1(bilanz.hmProKm) + ' hm/km), steilster Abschnitt ' + zahl1(bilanz.steilster) + ' %.' });
    } else {
      teile.push({ art: 'berg', text: 'Flach: ' + hm + ' Höhenmeter auf ' + zahl1(bilanz.km) + ' km.' });
    }
  }

  if(bilanz && bilanz.untergrundBekannt && bilanz.wegProzent >= LAST.wegViel){
    punkte += 1;
    teile.push({ art: 'weg', text: pz(bilanz.wegProzent) + ' unbefestigt. Auf Schotter liegt der Puls bei ' +
      'gleichem Tempo höher – das ist Rollwiderstand, keine Ermüdung.' });
  }

  if(wetter){
    if(wetter.temp >= LAST.heissViel){
      punkte += 2;
      teile.push({ art: 'hitze', text: Math.round(wetter.temp) + ' °C, gefühlt ' + Math.round(wetter.gefuehlt) +
        ' °C. Über ' + LAST.heissEtwas + ' °C driftet der Puls um 5–10 bpm nach oben.' });
    } else if(wetter.temp >= LAST.heissEtwas){
      punkte += 1;
      teile.push({ art: 'hitze', text: Math.round(wetter.temp) + ' °C – warm genug, dass der Puls oben ' +
        'mitgeht, ohne dass die Belastung steigt.' });
    } else if(wetter.temp <= LAST.kalt){
      punkte += 1;
      teile.push({ art: 'kaelte', text: Math.round(wetter.temp) + ' °C, gefühlt ' + Math.round(wetter.gefuehlt) +
        ' °C. In der Kälte kommt der Puls langsamer hoch, die ersten Kilometer zählen kaum.' });
    }
    if(wetter.regen >= LAST.regen){
      punkte += 1;
      teile.push({ art: 'regen', text: zahl1(wetter.regen) + ' mm Niederschlag in der Stunde.' });
    }
    if(wetter.boe >= LAST.boe){
      punkte += 1;
      teile.push({ art: 'boe', text: 'Böen bis ' + Math.round(wetter.boe) + ' km/h.' });
    }
  }

  /* Die Verfassung zaehlt wie das Wetter, weil sie dasselbe tut: bei erhoehtem
     Ruhepuls landet dieselbe Leistung in einer hoeheren Zone. Die Urteile
     kommen fertig aus analysis.js - die Schwellen duerfen nicht zweimal
     irgendwo stehen, sonst bewerten Gate und Fazit denselben Tag verschieden. */
  if(verfassung){
    if(verfassung.rhrHoch){
      punkte += 2;
      teile.push({ art: 'verfassung', text: 'Ruhepuls am Morgen ' + Math.round(verfassung.restingHR) +
        ' bpm gegen ' + Math.round(verfassung.rhrAvg) + ' bpm im Schnitt. Der Puls startet erhöht in ' +
        'die Fahrt und bleibt es – dieselbe Leistung landet dann eine Zone höher.' });
    }
    if(verfassung.hrvNiedrig){
      punkte += 1;
      teile.push({ art: 'verfassung', text: 'HRV ' + Math.round(verfassung.hrv) + ' gegen ' +
        Math.round(verfassung.hrvAvg) + ' im Schnitt – der Körper war an dem Tag nicht erholt.' });
    }
    if(verfassung.kurzeNaechte >= 2){
      punkte += 2;
      teile.push({ art: 'verfassung', text: 'Zwei Nächte unter 6 h Schlaf vor dieser Fahrt.' });
    } else if(verfassung.kurzeNaechte === 1){
      punkte += 1;
      teile.push({ art: 'verfassung', text: 'Die Nacht davor blieb unter 6 h (' +
        zahl1(verfassung.sleepSecs / 3600) + ' h).' });
    }
  }

  return { punkte, teile };
}

/* Die Massnahmen, die sich allein aus den Bedingungen ergeben - unabhaengig
   davon, ob der Plan eingehalten wurde. Hoechstens zwei, sonst liest sie
   niemand. */
function umfeldMassnahmen(bilanz, wetter, ziel, verfassung){
  const m = [];
  if(verfassung && verfassung.rot){
    m.push('Das Wellness-Gate stand an dem Tag auf rot. Die Fahrt ist damit nicht das Problem – ' +
      'die Entscheidung davor war es. An solchen Tagen kostet ein Qualitätstag mehr Erholung, ' +
      'als er Reiz bringt.');
  }
  if(wetter && wetter.temp >= LAST.heissEtwas){
    m.push('In der Wärme nach Puls fahren, nicht nach Tempo: die 5–10 bpm Drift sind Kühlung, kein Trainingsreiz. Früher starten hält ' +
      (ziel || 'die Zielzone') + ' fahrbar.');
  }
  if(bilanz && bilanz.untergrundBekannt && bilanz.wegProzent >= LAST.wegViel){
    m.push('Für Zonenarbeit die feste Runde nehmen – ' + pz(bilanz.wegProzent) + ' Schotter kosten Puls ohne Gegenwert. ' +
      'Für Kraftausdauer ist genau das erwünscht.');
  }
  if(bilanz && bilanz.gegenProzent >= LAST.gegenViel){
    m.push('Bei diesem Wind die Runde umdrehen: den Gegenwind auf die erste Hälfte legen, solange die Beine frisch sind.');
  }
  return m.slice(0, 2);
}

/* Aus Tagesbewertung, Strecke und Wetter das Fazit.

   row kommt aus compareDay - status, badge und notes sind dort schon
   entschieden. Hier wird nichts umbewertet: eine zu harte Fahrt bleibt zu
   hart. Nur die Erklaerung kommt dazu, und die Frage, was daraus folgt. */
export function streckenFazit(row, bilanz, wetter, verfassung){
  const last = umfeldLast(bilanz, wetter, verfassung);
  const ziel = row && row.target && row.target.zone ? row.target.zone.toUpperCase() : null;
  const badge = (row && row.badge) || '';
  const schlecht = ((row && row.notes) || []).filter(n => n.kind === 'bad');
  const erklaerbar = last.punkte >= 3;
  const massnahmen = [];
  let urteil = 'passt', satz = '';

  if(/zu hart/.test(badge)){
    if(erklaerbar){
      urteil = 'erklaert';
      satz = 'Zu hart für diese Einheit – aber die Bedingungen erklären den größten Teil davon.';
      massnahmen.push('Nicht das Tempo als Maß nehmen, sondern den Puls: gegen den Wind und am Berg liegt ' +
        (ziel || 'die Zielzone') + ' bei deutlich weniger Geschwindigkeit.');
    } else {
      urteil = 'abweichung';
      satz = 'Zu hart für diese Einheit, und die Bedingungen erklären es nicht.';
      massnahmen.push('Auf der Grundlagenfahrt bewusst Tempo abgeben. Der Reiz kommt aus der Dauer in ' +
        (ziel || 'der Zielzone') + ', nicht aus einzelnen harten Abschnitten – die kosten die Erholung für den Qualitätstag.');
    }
    if(bilanz && bilanz.bergProzent >= 25){
      massnahmen.push('Für Grundlagenfahrten eine flachere Runde: auf ' + pz(bilanz.bergProzent) +
        ' der Strecke ging es bergauf, dort lässt sich ' + (ziel || 'die Zielzone') + ' kaum halten.');
    }
  } else if(/kürzer|Fahrt fehlt|ausgefallen/.test(badge)){
    const wetterGrund = wetter && (wetter.regen >= LAST.regen || wetter.temp <= LAST.kalt || wetter.boe >= LAST.boe);
    urteil = wetterGrund || erklaerbar ? 'erklaert' : 'abweichung';
    satz = badge === 'ausgefallen'
      ? 'Die Einheit ist ausgefallen.'
      : 'Kürzer als geplant' + (wetterGrund ? ' – bei diesem Wetter nachvollziehbar.' : '.');
    massnahmen.push('Die fehlenden Minuten in der Woche nachholen, nicht am nächsten Tag: die Z2-Summe der Woche ist die Kennzahl, der einzelne Tag nicht.');
  } else if(/zu locker/.test(badge)){
    urteil = 'abweichung';
    satz = 'Zu locker für diese Einheit.';
    massnahmen.push('Der Reiz kommt aus ' + (ziel || 'der Zielzone') + '. Wenn der Puls dort nicht ankommt, ' +
      'liegt es meist an Rollpausen und Abfahrten – im Zweifel eine Runde mit weniger Verkehr und weniger Gefälle.');
  } else if(/Intervalle kurz|Test kurz/.test(badge)){
    urteil = erklaerbar ? 'erklaert' : 'abweichung';
    satz = 'Die harte Zeit blieb unter der Vorgabe.';
    massnahmen.push('Intervalle auf einen flachen, windgeschützten Abschnitt legen. Gegen den Wind und am Berg ' +
      'kippt die Zielzone, und dann bricht das Intervall ab, statt zu wirken.');
  } else if(schlecht.length){
    urteil = 'abweichung';
    satz = schlecht[0].text;
  } else if(!row || !row.zones){
    urteil = 'offen';
    satz = 'Ohne Zonenzeiten lässt sich nur die Dauer beurteilen – die passt.';
  } else {
    urteil = 'passt';
    satz = erklaerbar
      ? 'Die Einheit passt zum Plan – und das bei ordentlichem Widerstand.'
      : 'Die Einheit passt zum Plan.';
  }

  for(const m of umfeldMassnahmen(bilanz, wetter, ziel, verfassung)){
    if(massnahmen.length < 3) massnahmen.push(m);
  }

  return {
    urteil,
    satz,
    last: last.punkte,
    gruende: last.teile,
    planNotizen: ((row && row.notes) || []).slice(),
    massnahmen
  };
}
