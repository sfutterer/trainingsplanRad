/* Fazit einer Fahrt: passt das zum Plan, und unter welchen Bedingungen?

   Die Tagesbewertung in analysis.js sagt, OB etwas abweicht - sie kennt aber
   nur Puls, Dauer und Zonen. Wind, Hoehenmeter, Untergrund, Wetter und
   Verfassung stehen hier daneben, als Zahlen.

   Seit dem 31.10.2026 ohne Deutung. Bis dahin sagte das Fazit, die
   Bedingungen "erklaerten" eine Abweichung, und gab Ratschlaege dazu ("die
   Runde umdrehen", "die Entscheidung davor war das Problem"). Ob der Wind der
   Grund war, weiss die App nicht - sie weiss nur, dass er da war. Geblieben
   ist eine Planregel, wo der Plan eine hat: fehlende Minuten zaehlen gegen
   die Wochensumme.

   Bewertungspolitik, keine Trainingslehre aus dem Plandokument: die Schwellen
   hier sind Erfahrungswerte und stehen deshalb in der App, nicht in
   plan.json. */

import { zahl } from './zahlen.js';
import { T } from './texte.js';

const LAST = {
  gegenViel: 55, gegenEtwas: 35,      // Prozent der Strecke gegen den Wind
  hmViel: 10, hmEtwas: 6,             // Hoehenmeter je Kilometer
  wegViel: 25,                        // Prozent unbefestigt
  heissViel: 27, heissEtwas: 24,      // Grad
  kalt: 3,
  regen: 1,                           // Millimeter in der Stunde
  boe: 45                             // km/h
};

const zahl1 = v => zahl(v, 1);

function kmh(v){ return Math.round(v) + ' km/h'; }
function pz(v){ return Math.round(v) + ' %'; }

/* Wie schwer waren die Bedingungen? Der Punktwert entscheidet nur darueber, ob
   das Fazit "erschwerte Bedingungen" nennt - er wird nirgends angezeigt. */
export function umfeldLast(bilanz, wetter, verfassung){
  const teile = [];
  let punkte = 0;

  if(bilanz && bilanz.windMeter){
    if(bilanz.gegenProzent >= LAST.gegenViel){
      punkte += 2;
      teile.push({ art: 'wind', text: pz(bilanz.gegenProzent) + ' der Strecke Gegenwind, Ø ' +
        kmh(bilanz.gegenSchnitt) + ', Spitze ' + kmh(bilanz.staerksterGegenwind) + '.' });
    } else if(bilanz.gegenProzent >= LAST.gegenEtwas){
      punkte += 1;
      teile.push({ art: 'wind', text: pz(bilanz.gegenProzent) + ' der Strecke Gegenwind, ' +
        pz(bilanz.rueckProzent) + ' Rückenwind.' });
    } else {
      teile.push({ art: 'wind', text: pz(bilanz.gegenProzent) + ' Gegenwind, ' +
        pz(bilanz.rueckProzent) + ' Rückenwind.' });
    }
  }

  if(bilanz && bilanz.km >= 1){
    const hm = Math.round(bilanz.hoch);
    if(bilanz.hmProKm >= LAST.hmViel){
      punkte += 2;
      teile.push({ art: 'berg', text: hm + ' hm auf ' + zahl1(bilanz.km) + ' km (' +
        zahl1(bilanz.hmProKm) + ' hm/km), ' + pz(bilanz.bergProzent) + ' bergauf.' });
    } else if(bilanz.hmProKm >= LAST.hmEtwas){
      punkte += 1;
      teile.push({ art: 'berg', text: hm + ' hm auf ' + zahl1(bilanz.km) + ' km (' +
        zahl1(bilanz.hmProKm) + ' hm/km), max. ' + zahl1(bilanz.steilster) + ' %.' });
    } else {
      teile.push({ art: 'berg', text: hm + ' hm auf ' + zahl1(bilanz.km) + ' km.' });
    }
  }

  if(bilanz && bilanz.untergrundBekannt && bilanz.wegProzent >= LAST.wegViel){
    punkte += 1;
    teile.push({ art: 'weg', text: pz(bilanz.wegProzent) + ' unbefestigt.' });
  }

  if(wetter){
    if(wetter.temp >= LAST.heissViel){
      punkte += 2;
      teile.push({ art: 'hitze', text: Math.round(wetter.temp) + ' °C, gefühlt ' +
        Math.round(wetter.gefuehlt) + ' °C.' });
    } else if(wetter.temp >= LAST.heissEtwas){
      punkte += 1;
      teile.push({ art: 'hitze', text: Math.round(wetter.temp) + ' °C.' });
    } else if(wetter.temp <= LAST.kalt){
      punkte += 1;
      teile.push({ art: 'kaelte', text: Math.round(wetter.temp) + ' °C, gefühlt ' +
        Math.round(wetter.gefuehlt) + ' °C.' });
    }
    if(wetter.regen >= LAST.regen){
      punkte += 1;
      teile.push({ art: 'regen', text: zahl1(wetter.regen) + ' mm Niederschlag je Stunde.' });
    }
    if(wetter.boe >= LAST.boe){
      punkte += 1;
      teile.push({ art: 'boe', text: 'Böen bis ' + Math.round(wetter.boe) + ' km/h.' });
    }
  }

  /* Die Verfassung zaehlt wie das Wetter. Die Urteile kommen fertig aus
     analysis.js - die Schwellen duerfen nicht zweimal irgendwo stehen, sonst
     bewerten Gate und Fazit denselben Tag verschieden. */
  if(verfassung){
    if(verfassung.rhrHoch){
      punkte += 2;
      teile.push({ art: 'verfassung', text: 'Ruhepuls ' + Math.round(verfassung.restingHR) +
        ' bpm (Schnitt ' + Math.round(verfassung.rhrAvg) + ' bpm).' });
    }
    if(verfassung.hrvNiedrig){
      punkte += 1;
      teile.push({ art: 'verfassung', text: 'HRV ' + Math.round(verfassung.hrv) + ' (Schnitt ' +
        Math.round(verfassung.hrvAvg) + ').' });
    }
    if(verfassung.kurzeNaechte >= 2){
      punkte += 2;
      teile.push({ art: 'verfassung', text: 'Zwei Nächte unter 6 h Schlaf davor.' });
    } else if(verfassung.kurzeNaechte === 1){
      punkte += 1;
      teile.push({ art: 'verfassung', text: 'Nacht davor ' +
        zahl1(verfassung.sleepSecs / 3600) + ' h Schlaf.' });
    }
  }

  return { punkte, teile };
}

/* Aus Tagesbewertung, Strecke und Wetter das Fazit.

   row kommt aus compareDay - status, badge und notes sind dort schon
   entschieden. Hier wird nichts umbewertet: eine zu harte Fahrt bleibt zu
   hart. Das Urteil "erklaert" heisst nur noch: abgewichen, aber unter
   erschwerten Bedingungen - es faerbt die Karte, es behauptet keinen Grund. */
export function streckenFazit(row, bilanz, wetter, verfassung){
  const last = umfeldLast(bilanz, wetter, verfassung);
  const badge = (row && row.badge) || '';
  const schlecht = ((row && row.notes) || []).filter(n => n.kind === 'bad');
  const erschwert = last.punkte >= 3;
  const zusatz = erschwert ? ' Erschwerte Bedingungen.' : '';
  const massnahmen = [];
  let urteil = 'passt', satz = '';

  if(/zu hart/.test(badge)){
    urteil = erschwert ? 'erklaert' : 'abweichung';
    satz = 'Über der Vorgabe.' + zusatz;
  } else if(/kürzer|Fahrt fehlt|ausgefallen/.test(badge)){
    const wetterGrund = wetter && (wetter.regen >= LAST.regen || wetter.temp <= LAST.kalt || wetter.boe >= LAST.boe);
    urteil = wetterGrund || erschwert ? 'erklaert' : 'abweichung';
    satz = badge === 'ausgefallen' ? 'Einheit ausgefallen.' : 'Kürzer als geplant.' + zusatz;
    massnahmen.push('Gewertet wird die Z2-Summe der Woche, nicht der einzelne Tag.');
  } else if(/zu locker/.test(badge)){
    urteil = 'abweichung';
    satz = 'Unter der Vorgabe.' + zusatz;
  } else if(/Intervalle kurz|Test kurz/.test(badge)){
    urteil = erschwert ? 'erklaert' : 'abweichung';
    satz = 'Harte Zeit unter der Vorgabe.' + zusatz;
  } else if(schlecht.length){
    urteil = 'abweichung';
    satz = schlecht[0].text;
  } else if(row && row.pruefHinweis){
    /* Der Arbeitsweg lag ueber der 20-%-Marke. Seit dem 15.09.2026 kein
       Urteil mehr, aber auch kein gruenes "passt". */
    urteil = 'erklaert';
    satz = T.pruefFazit(row.pruefHinweis.ueber);
  } else if(row && row.umfangUeber){
    /* Der Tag ist nicht falsch gefahren, aber deutlich laenger als
       vorgesehen. Kein Befund, aber auch kein gruenes Fazit. */
    urteil = 'erklaert';
    satz = T.umfangFazit(row.umfangUeber.kum, row.umfangUeber.soll);
  } else if(!row || !row.zones){
    urteil = 'offen';
    satz = 'Ohne Zonenzeiten: nur die Dauer bewertet, sie passt.';
  } else {
    urteil = 'passt';
    satz = 'Passt zum Plan.' + zusatz;
  }

  return {
    urteil,
    satz,
    /* Ab Woche 5 ohne Leistung gewertet - die Bewertung laeuft dann auf der
       Hilfsgroesse und sagt das sichtbar. */
    vorlaeufig: !!(row && row.vorlaeufig),
    last: last.punkte,
    gruende: last.teile,
    planNotizen: ((row && row.notes) || []).slice(),
    massnahmen
  };
}
