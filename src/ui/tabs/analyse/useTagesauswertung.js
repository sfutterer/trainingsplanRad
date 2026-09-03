/* Die Auswertung eines Tages zusammentragen.

   Hiess bis zum 03.09.2026 useFahrtauswertung und wertete genau eine
   Aufzeichnung aus. Das war die falsche Einheit. Der Plan macht seine Vorgabe
   je Tag - "80 min Z2", "5 x 5 min Z4 mit Ein- und Ausfahren" -, und wer sie
   auf zwei Fahrten verteilt, weil der Arbeitsweg zweimal am Tag anfaellt,
   bekam sie zweimal gegen dasselbe Soll gerechnet: Hinweg 40 min gegen 80 min
   Vorgabe ist "kuerzer", Rueckweg ebenso, und beide zusammen waren genau
   richtig. Dieselbe Rechnung steckt schon in compareDay, das immer alle
   Aktivitaeten eines Tages nimmt - nur bekam es aus dieser Ansicht immer nur
   eine davon.

   Jetzt kommen alle Aufzeichnungen des Tages herein. Was daraus entsteht:

     zonenById   je Aufzeichnung die Zonenzeiten, damit compareDay sie selbst
                 zusammenfuehren kann - dort steht schon die Regel, dass bei
                 mehreren Fahrten das unzuverlaessigste Verfahren gilt.
     fahrten     je Fahrt Spur, Streckenbilanz und Wetter - die Karte bleibt
                 eine je Fahrt, zwei Runden in einer Karte waeren ein Knaeuel.
     bilanz      die Summe ueber alle Fahrten, fuer das Fazit des Tages.
     wetter      das der laengsten Fahrt. Die Bedingungen eines Tages lassen
                 sich nicht mitteln - 25 Grad am Nachmittag und 12 am Morgen
                 ergeben nicht 18 -, und die laengste Fahrt praegt den Tag.

   Die Stufen, und warum sie so liegen:

     1  Wellness laeuft neben allem anderen - sie haengt an nichts, was die
        Aufzeichnung liefert, und gilt fuer den ganzen Tag.
     2  Streams je Fahrt. Ohne sie gibt es nichts zu zeichnen, aber die
        Kopfkarte mit Plan und Dauer steht trotzdem: deshalb Meldung statt
        Fehlerseite.
     3  Wetter je Fahrt und die Wellness zusammen - alle antworten in
        Millisekunden. Danach steht die Karte.
     4  Untergrund zuletzt, weil Overpass fuer eine lange Runde zwischen 9 und
        20 s braucht. Die Karten warten nicht darauf.

   Ausgefallene Abrufe brechen die Auswertung nie ab; was fehlt, kommt am Ende
   der schnellen Runde als eine Meldung. */

import { useEffect, useState } from 'preact/hooks';
import { apiKey, plan, thresholds, startDate, store } from '../../../state/store.js';
import { fetchStreams, spurMitHoehe, fetchWellness } from '../../../data/icu.js';
import { ladeWetter, stundenIndex, windZurZeit } from '../../../data/wetter.js';
import { ladeWege, untergrundCode, untergrundAusCode } from '../../../data/osm.js';
import { baueAbschnitte, zeichenGruppen, streckenBilanz, untergrundAn,
         setzeUntergrund, markiereDoppelt } from '../../../domain/strecke.js';
import { zoneSeconds, hrBands } from '../../../domain/zones.js';
import { isoDayLocal, toMidnight, weekNumberFor } from '../../../domain/week.js';
import { isRide } from '../../../domain/analysis.js';
import { verfassungAus } from '../../../domain/wellness.js';
import { melde } from '../../../state/snackbar.js';

/* Mehr Punkte braucht weder die Auswertung noch die Karte: bei 2000 Punkten
   liegen auf einem 150-m-Abschnitt noch ein Dutzend Messwerte, und die Linie
   sieht aus wie die Aufzeichnung. */
const MAX_PUNKTE = 2000;

function duenne(spur, max){
  const grenze = max || MAX_PUNKTE;
  if(spur.length <= grenze) return spur;
  const schritt = Math.ceil(spur.length / grenze);
  const raus = spur.filter((_, i) => i % schritt === 0);
  if(raus[raus.length - 1] !== spur[spur.length - 1]) raus.push(spur[spur.length - 1]);
  return raus;
}

/* Abrufe, die nichts voneinander wissen - also nebeneinander. Faellt einer
   aus, laeuft die Auswertung mit dem anderen weiter: ohne Wetter fehlt der
   Wind, ohne Overpass der Untergrund, und beides steht dann auch so da. */
function sicher(p){
  return p.then(v => ({ wert: v }), e => ({ fehler: e.message }));
}

function sekunden(a){
  return a.moving_time || a.elapsed_time || 0;
}

/* Die Kennung des Tages als Abhaengigkeit des Ladelaufs.

   Vorher stand dort act.id - eine Zahl. Jetzt sind es mehrere, und ein Array
   waere bei jedem Zeichnen ein neues Objekt: die Kette aus vier Abrufen liefe
   samt der 25 Sekunden fuer Overpass bei jeder Signalaenderung neu. Die
   Kennungen aneinandergehaengt sind dagegen eine Zeichenkette und vergleichen
   sich wie eine. */
function tagesKennung(acts){
  return (acts || []).map(a => a.id).join(',');
}

export function useTagesauswertung(acts){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [zustand, setZustand] = useState({ phase: 'laedt' });
  const kennung = tagesKennung(acts);

  useEffect(() => {
    let weg = false;
    setZustand({ phase: 'laedt' });

    (async () => {
      const key = apiKey.value;
      /* Was ausgefallen ist, kommt am Ende der schnellen Runde als eine
         Meldung - nicht drei hintereinander, von denen nur die letzte zu
         sehen waere. */
      const fehlt = [];
      const liste = acts || [];
      if(!liste.length){ setZustand({ phase: 'fertig', fahrten: [], zonenById: {} }); return; }

      /* Laeuft neben den Streams, nicht dahinter: die Verfassung am Fahrtag
         haengt an nichts, was die Aufzeichnung liefert. */
      const tagIso = isoDayLocal(toMidnight(new Date(liste[0].start_date_local)));
      const wellVon = toMidnight(new Date(tagIso));
      wellVon.setDate(wellVon.getDate() - 8);
      const wellness = sicher(fetchWellness(key, isoDayLocal(wellVon), tagIso));
      const holeVerfassung = async () => {
        const wl = await wellness;
        if(wl.wert) return verfassungAus(wl.wert, tagIso);
        fehlt.push('Wellness (' + wl.fehler + ')');
        return null;
      };

      const fahrten = liste.filter(a => isRide(a.type));
      if(!fahrten.length){
        const verfassung = await holeVerfassung();
        if(weg) return;
        if(fehlt.length) melde('Nicht abrufbar: ' + fehlt.join(' · '));
        setZustand({ phase: 'fertig', verfassung, fahrten: [], zonenById: {} });
        return;
      }

      /* Streams je Fahrt. Nacheinander und nicht nebeneinander: intervals.icu
         beantwortet drei gleichzeitige Stream-Abfragen langsamer als drei
         hintereinander, und die erste Fahrt soll so frueh wie moeglich
         dastehen. */
      const zonenById = {};
      const teile = [];
      const wk = Math.max(weekNumberFor(new Date(liste[0].start_date_local), start), 1);
      const baender = hrBands(p, th, wk);

      for(const a of fahrten){
        let streams = null;
        try {
          streams = await fetchStreams(key, a.id, 'heartrate,time,latlng,altitude');
        } catch(e){
          fehlt.push('Streams zu „' + (a.name || a.type) + '" (' + e.message + ')');
        }
        if(weg) return;

        const hol = t => (streams || []).find(s => s.type === t);
        const hr = hol('heartrate'), tm = hol('time');
        if(hr && Array.isArray(hr.data)){
          zonenById[a.id] = zoneSeconds(baender, hr.data,
            tm && Array.isArray(tm.data) ? tm.data : null,
            a.icu_recording_time || a.elapsed_time || a.moving_time || 0);
        }

        /* Die Form des latlng-Streams liegt nicht fest - das Umrechnen auf
           Paare steckt deshalb in icu.js, wo auch die Diagnose es nutzt. */
        const spur = streams ? duenne(spurMitHoehe(streams)) : [];
        teile.push({ act: a, zonen: zonenById[a.id] || null, spur });
      }

      /* Wetter je Fahrt und die Wellness zusammen: alle antworten in
         Millisekunden, Overpass braucht Sekunden. Auf den warten die Karten
         nicht. */
      const mitSpur = teile.filter(t => t.spur.length >= 2);
      const wetterAbrufe = mitSpur.map(t => {
        const mitte = t.spur[Math.floor(t.spur.length / 2)].ll;
        return sicher(ladeWetter(mitte[0], mitte[1], t.act.start_date_local));
      });
      const [verfassung, ...wetterErgebnisse] = await Promise.all([
        holeVerfassung(), ...wetterAbrufe
      ]);
      if(weg) return;

      mitSpur.forEach((t, i) => {
        const w = wetterErgebnisse[i];
        if(!w.wert){
          if(fehlt.indexOf('Wetter') < 0) fehlt.push('Wetter (' + w.fehler + ')');
          return;
        }
        const idx = stundenIndex(w.wert, t.act.start_date_local);
        t.wetter = {
          temp: w.wert.temperature_2m[idx], gefuehlt: w.wert.apparent_temperature[idx],
          wind: w.wert.wind_speed_10m[idx], boe: w.wert.wind_gusts_10m[idx],
          richtung: w.wert.wind_direction_10m[idx], regen: w.wert.precipitation[idx],
          feuchte: w.wert.relative_humidity_2m[idx]
        };
        t.wind = sek => windZurZeit(w.wert, t.act.start_date_local, sek);
      });

      if(!mitSpur.length){
        melde('Kein GPS-Stream zu diesem Tag – unter Einstellungen → Diagnose steht, was das Konto liefert.', 9000);
      } else if(fehlt.length){
        melde('Nicht abrufbar: ' + fehlt.join(' · '));
      }

      /* Doppelt gefahrene Abschnitte einmal je Fahrt bestimmen: die Geometrie
         aendert sich durch den Untergrund nicht mehr. Ueber zwei Fahrten
         hinweg wird nicht verglichen - Hin- und Rueckweg desselben
         Arbeitswegs sind zwei Fahrten und keine Schleife. */
      for(const t of mitSpur){
        t.abschnitte = markiereDoppelt(baueAbschnitte(t.spur, { wind: t.wind }));
      }

      const bauZustand = () => ({
        phase: 'fertig', verfassung, zonenById,
        fahrten: mitSpur.map(t => ({
          act: t.act, zonen: t.zonen, wetter: t.wetter || null,
          latlng: t.spur.map(x => x.ll),
          gruppen: zeichenGruppen(t.abschnitte),
          bilanz: streckenBilanz(t.abschnitte)
        })),
        ohneSpur: teile.filter(t => t.spur.length < 2).map(t => t.act),
        /* Die Summe ueber alle Fahrten. streckenBilanz zaehlt nur ueber
           Abschnitte - aneinandergehaengt ergibt das genau die Tagesbilanz,
           ohne dass hier eine zweite Rechnung danebensteht. */
        bilanz: streckenBilanz(mitSpur.flatMap(t => t.abschnitte)),
        wetter: (mitSpur.slice().sort((a, b) => sekunden(b.act) - sekunden(a.act))[0] || {}).wetter || null,
        untergrundLaeuft: true
      });
      setZustand(bauZustand());

      /* Untergrund zuletzt, und beim zweiten Ansehen aus dem
         Zwischenspeicher: dieselbe Fahrt hat morgen denselben Schotter. */
      const merker = await store.untergrund();
      let geaendert = false;
      for(const t of mitSpur){
        const schluessel = t.act.id + ':' + t.abschnitte.length;
        let quelle = merker[schluessel] ? untergrundAusCode(merker[schluessel]) : null;
        if(!quelle){
          const o = await sicher(ladeWege(t.spur.map(x => x.ll)));
          if(weg) return;
          if(!o.wert){ melde('Untergrund nicht abrufbar: ' + o.fehler); continue; }
          quelle = ll => untergrundAn(ll, o.wert);
        }
        t.abschnitte = setzeUntergrund(t.abschnitte, quelle);
        if(!merker[schluessel]){ merker[schluessel] = untergrundCode(t.abschnitte); geaendert = true; }
        if(weg) return;
        setZustand({ ...bauZustand(), untergrundLaeuft: true });
      }
      if(weg) return;
      setZustand(z => Object.assign({}, z, { untergrundLaeuft: false }));
      if(geaendert) store.setUntergrund(merker);
    })();

    return () => { weg = true; };
    /* Nur die Kennungen des Tages: der ganze Ladelauf gehoert zu genau diesen
       Aufzeichnungen. Plan, Schwellenwerte und die uebrigen Felder aendern
       sich waehrend einer offenen Auswertung nicht, und stuenden sie in der
       Liste, liefe die Kette aus vier Abrufen bei jeder Signalaenderung neu -
       samt der 25 Sekunden fuer Overpass. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kennung]);

  return zustand;
}
