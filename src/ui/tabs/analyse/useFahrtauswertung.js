/* Die Auswertung einer Fahrt zusammentragen.

   Rund 130 Zeilen asynchrone Orchestrierung: Streams, Wellness, Wetter,
   Overpass, Zwischenspeicher, Abbruchbehandlung und vier Zwischenzustaende.
   Das stand bis zum 29.08.2026 mitten in der Anzeigekomponente. Die
   Reihenfolge und die Ausfallbehandlung sind sorgfaeltig durchdacht und
   ausfuehrlich begruendet - genau deshalb gehoeren sie in eine eigene,
   benennbare Einheit, die man auch fuer sich lesen kann. Die Komponente
   behaelt das Zeichnen.

   Der Zustand kommt als ein Objekt mit einem Feld `phase` zurueck und nicht
   als fuenf einzelne Zustaende: die Auswertung durchlaeuft Stufen, und fuenf
   useState nebeneinander koennen Zwischenstaende zeigen, die es nicht gibt -
   etwa eine Karte ohne Strecke, weil das eine Signal schon gesetzt war und das
   andere noch nicht.

   Die Stufen, und warum sie so liegen:

     1  Wellness laeuft neben allem anderen - sie haengt an nichts, was die
        Aufzeichnung liefert.
     2  Streams. Ohne sie gibt es nichts zu zeichnen, aber die Kopfkarte mit
        Plan und Dauer steht trotzdem: deshalb Meldung statt Fehlerseite.
     3  Wetter und Wellness zusammen - beide antworten in Millisekunden. Danach
        steht die Karte.
     4  Untergrund zuletzt, weil Overpass fuer eine lange Runde zwischen 9 und
        20 s braucht. Die Karte wartet nicht darauf.

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

/* Zwei Abrufe, die nichts voneinander wissen - also nebeneinander. Faellt einer
   aus, laeuft die Auswertung mit dem anderen weiter: ohne Wetter fehlt der
   Wind, ohne Overpass der Untergrund, und beides steht dann auch so da. */
function sicher(p){
  return p.then(v => ({ wert: v }), e => ({ fehler: e.message }));
}

export function useFahrtauswertung(act){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [zustand, setZustand] = useState({ phase: 'laedt' });

  useEffect(() => {
    let weg = false;
    setZustand({ phase: 'laedt' });

    (async () => {
      const key = apiKey.value;
      /* Was ausgefallen ist, kommt am Ende der schnellen Runde als eine
         Meldung - nicht drei hintereinander, von denen nur die letzte zu
         sehen waere. */
      const fehlt = [];

      /* Laeuft neben den Streams, nicht dahinter: die Verfassung am Fahrtag
         haengt an nichts, was die Aufzeichnung liefert. */
      const tagIso = isoDayLocal(toMidnight(new Date(act.start_date_local)));
      const wellVon = toMidnight(new Date(tagIso));
      wellVon.setDate(wellVon.getDate() - 8);
      const wellness = sicher(fetchWellness(key, isoDayLocal(wellVon), tagIso));
      const verfassungAus_ = wl => {
        if(wl.wert) return verfassungAus(wl.wert, tagIso);
        fehlt.push('Wellness (' + wl.fehler + ')');
        return null;
      };

      if(!isRide(act.type)){
        const wl = await wellness;
        if(weg) return;
        const verfassung = verfassungAus_(wl);
        if(fehlt.length) melde('Nicht abrufbar: ' + fehlt.join(' · '));
        setZustand({ phase: 'fertig', verfassung });
        return;
      }

      /* Ohne die Streams gibt es nichts zu zeichnen - aber die Kopfkarte mit
         Plan und Dauer steht trotzdem. Deshalb Meldung statt Fehlerseite. */
      let streams = null;
      try {
        streams = await fetchStreams(key, act.id, 'heartrate,time,latlng,altitude');
      } catch(e){
        if(weg) return;
        const wl = await wellness;
        melde('Streams nicht abrufbar: ' + e.message);
        setZustand({ phase: 'fertig', verfassung: wl.wert ? verfassungAus(wl.wert, tagIso) : null });
        return;
      }
      if(weg) return;

      const hol = t => (streams || []).find(s => s.type === t);
      const hr = hol('heartrate'), tm = hol('time');
      let zonen = null;
      if(hr && Array.isArray(hr.data)){
        const wk = Math.max(weekNumberFor(new Date(act.start_date_local), start), 1);
        zonen = zoneSeconds(hrBands(p, th, wk), hr.data,
          tm && Array.isArray(tm.data) ? tm.data : null,
          act.icu_recording_time || act.elapsed_time || act.moving_time || 0);
      }

      /* Die Form des latlng-Streams liegt nicht fest - das Umrechnen auf
         Paare steckt deshalb in icu.js, wo auch die Diagnose es nutzt. */
      const spur = duenne(spurMitHoehe(streams));
      if(spur.length < 2){
        const wl = await wellness;
        if(weg) return;
        melde('Kein GPS-Stream zu dieser Fahrt – unter Einstellungen → Diagnose steht, was das Konto liefert.', 9000);
        setZustand({ phase: 'fertig', zonen, verfassung: verfassungAus_(wl) });
        return;
      }
      const latlng = spur.map(x => x.ll);

      /* Die beiden schnellen Abrufe zusammen, der langsame danach: Wetter und
         Wellness antworten in Millisekunden, Overpass braucht Sekunden. Auf den
         wartet die Karte nicht. */
      const mitte = spur[Math.floor(spur.length / 2)].ll;
      const [w, wl] = await Promise.all([
        sicher(ladeWetter(mitte[0], mitte[1], act.start_date_local)),
        wellness
      ]);
      if(weg) return;
      const verfassung = verfassungAus_(wl);

      let wetter = null, wind = null;
      if(w.wert){
        const i = stundenIndex(w.wert, act.start_date_local);
        wetter = {
          temp: w.wert.temperature_2m[i], gefuehlt: w.wert.apparent_temperature[i],
          wind: w.wert.wind_speed_10m[i], boe: w.wert.wind_gusts_10m[i],
          richtung: w.wert.wind_direction_10m[i], regen: w.wert.precipitation[i],
          feuchte: w.wert.relative_humidity_2m[i]
        };
        wind = sek => windZurZeit(w.wert, act.start_date_local, sek);
      } else {
        fehlt.push('Wetter (' + w.fehler + ')');
      }
      if(fehlt.length) melde('Nicht abrufbar: ' + fehlt.join(' · '));

      /* Doppelt gefahrene Abschnitte einmal bestimmen: die Geometrie aendert
         sich durch den Untergrund nicht mehr. */
      let abschnitte = markiereDoppelt(baueAbschnitte(spur, { wind }));
      setZustand({
        phase: 'fertig', zonen, latlng, wetter, verfassung,
        gruppen: zeichenGruppen(abschnitte), bilanz: streckenBilanz(abschnitte),
        untergrundLaeuft: true
      });

      /* Untergrund zuletzt, und beim zweiten Ansehen aus dem Zwischenspeicher:
         dieselbe Fahrt hat morgen denselben Schotter. */
      const merker = await store.untergrund();
      const schluessel = act.id + ':' + abschnitte.length;
      let quelle = merker[schluessel] ? untergrundAusCode(merker[schluessel]) : null;

      if(!quelle){
        const o = await sicher(ladeWege(latlng));
        if(weg) return;
        if(o.wert){
          quelle = ll => untergrundAn(ll, o.wert);
        } else {
          melde('Untergrund nicht abrufbar: ' + o.fehler);
          setZustand(z => Object.assign({}, z, { untergrundLaeuft: false }));
          return;
        }
      }

      abschnitte = setzeUntergrund(abschnitte, quelle);
      if(weg) return;
      setZustand(z => Object.assign({}, z, {
        gruppen: zeichenGruppen(abschnitte), bilanz: streckenBilanz(abschnitte),
        untergrundLaeuft: false
      }));

      if(!merker[schluessel]){
        merker[schluessel] = untergrundCode(abschnitte);
        store.setUntergrund(merker);
      }
    })();

    return () => { weg = true; };
    /* Nur die Aktivitaets-ID: der ganze Ladelauf gehoert zu genau einer Fahrt.
       Plan, Schwellenwerte und die uebrigen Felder der Aktivitaet aendern sich
       waehrend einer offenen Auswertung nicht, und stuenden sie in der Liste,
       liefe die Kette aus vier Abrufen bei jeder Signalaenderung neu - samt der
       25 Sekunden fuer Overpass. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act.id]);

  return zustand;
}
