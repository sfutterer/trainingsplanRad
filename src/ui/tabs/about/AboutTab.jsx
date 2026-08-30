/* Was die App benutzt, und was dabei das Geraet verlaesst.

   Stand vorher in Schnipseln unter der Auswertung - ein Absatz Kleingedrucktes
   unter jedem Block, der eine Schnittstelle benutzt. Dort war er im Weg: nach
   einer Fahrt will man das Fazit lesen, nicht die Herkunft der Wetterdaten. An
   einer Stelle nachlesbar ist er trotzdem wichtig, denn bei drei der vier
   Dienste gehen Koordinaten der eigenen Fahrten hinaus. */

import { Gruppe, Zeile } from '../../components/SettingsList.jsx';
import { PLAN_SCHEMA_VERSION } from '../../../data/planSource.js';
import { planSource } from '../../../state/store.js';
import { ZEITGRENZE } from '../../../data/netz.js';

const QUELLE = 'https://github.com/sfutterer/trainingsplanRad';

const sek = ms => Math.round(ms / 1000) + ' s';

export function AboutTab(){
  const herkunft = planSource.value === 'override' ? 'eigene Fassung' : 'mitgelieferter Plan';

  return (
    <>
      <Gruppe titel="App">
        <Zeile titel="Version" wert={__APP_VERSION__ + ' · Stand ' + __BUILD_DATE__} />
        <Zeile titel="Trainingsplan" wert={'Schema ' + PLAN_SCHEMA_VERSION + ' · ' + herkunft} />
        <Zeile titel="Quellcode" wert="github.com/sfutterer/trainingsplanRad"
          onClick={() => window.open(QUELLE, '_blank', 'noreferrer')} />
      </Gruppe>

      <Gruppe titel="Schnittstellen">
        <Zeile titel="intervals.icu" wert="Aktivitäten, Streams, Wellness · Schlüssel nötig"
          hilfe={
            <>
              <p>Geholt werden die Aktivitätsliste des gewählten Zeitraums und beim Antippen
                 einer Fahrt deren Streams: Puls, Zeit, Position und Höhe.</p>
              <p>Die Abfragen gehen direkt vom Gerät an intervals.icu, mit deinem Schlüssel im
                 Kopf der Anfrage. Es gibt keinen Server dieser App dazwischen – der Schlüssel
                 verlässt das Gerät nur in diese eine Richtung.</p>
            </>
          } />
        <Zeile titel="Open-Meteo" wert="Wetter je Stunde · kein Schlüssel"
          hilfe={
            <>
              <p>Temperatur, gefühlte Temperatur, Luftfeuchte, Niederschlag, Windrichtung,
                 Windgeschwindigkeit und Böen – stundenweise für den Tag der Fahrt.</p>
              <p>Dorthin gehen die Koordinaten der Fahrtmitte (auf drei Stellen gerundet) und
                 das Datum. Kein Schlüssel, kein Konto.</p>
            </>
          } />
        <Zeile titel="Overpass (OpenStreetMap)" wert="Untergrund der Wege · kein Schlüssel"
          hilfe={
            <>
              <p>Kein Sensor misst, ob ein Kilometer Asphalt oder Schotter war. OpenStreetMap
                 weiß es, weil Menschen es eingetragen haben: <b>surface</b> am Weg, oder die
                 Art des Weges selbst.</p>
              <p>Abgefragt werden nur Wege entlang der Spur, und davon nur die, die etwas zum
                 Untergrund sagen. Dorthin gehen rund 60 Stützpunkte der Fahrt – die Strecke
                 also, grob aufgelöst.</p>
              <p>Das Ergebnis wird je Fahrt gespeichert; beim zweiten Ansehen fällt die
                 Abfrage weg.</p>
            </>
          } />
        <Zeile titel="Thunderforest" wert="Kartenkacheln · Schlüssel optional"
          hilfe={
            <>
              <p>Die Kartenstile Atlas, OpenCycleMap und Landscape. Ohne Schlüssel zeichnet die
                 App die Kacheln von OpenStreetMap.</p>
              <p>Der Kachelserver sieht dabei, welchen Ausschnitt du ansiehst – also die Gegend
                 der Fahrt. Der Stil steht in den Einstellungen unter Darstellung.</p>
            </>
          } />
        <Zeile titel="Google" wert="Anmeldung · Client-ID optional"
          hilfe={
            <>
              <p>Erst beim Antippen von „Anmelden“ wird das Skript von Google geladen – wer
                 sich nie anmeldet, spricht nie mit Google, und die App startet auch ohne Netz.</p>
              <p>Zurück kommt ein Token mit Kontokennung, Name, Mailadresse und Bild. Daraus
                 entsteht ein Profil auf diesem Gerät. <b>Es geht nichts hinaus</b> – keine
                 Trainingsdaten, keine Fahrten, keine Koordinaten.</p>
              <p>Die Anmeldung trennt Bestände, sie schützt sie nicht: ohne Server lässt sich
                 das Token nicht prüfen, und der Speicher dieses Browsers steht jedem offen,
                 der ihn aufmacht.</p>
            </>
          } />
      </Gruppe>

      <Gruppe titel="Wenn etwas nicht antwortet">
        <Zeile titel="Zeitgrenzen"
          wert={'intervals.icu ' + sek(ZEITGRENZE.icu) + ' · Open-Meteo ' + sek(ZEITGRENZE.wetter) +
                ' · Overpass ' + sek(ZEITGRENZE.osm)}
          hilfe={
            <>
              <p>Danach bricht die App die Abfrage ab und zeigt, was sie hat: ohne Wetter fehlt
                 der Wind auf der Karte, ohne Overpass der Untergrund. Was fehlt, steht kurz als
                 Meldung unten – die Auswertung bleibt sichtbar.</p>
              <p>Ohne die Aktivitäten von intervals.icu geht dagegen nichts, das ist die
                 Grundlage.</p>
            </>
          } />
      </Gruppe>

      <Gruppe titel="Auf dem Gerät">
        <Zeile titel="Was gespeichert wird"
          wert="Protokolle, Schwellenwerte, Einstellungen, Schlüssel"
          hilfe={
            <>
              <p>Alles im Speicher dieses Browserprofils, nichts in einer Cloud. Die Sicherung
                 unter Einstellungen schreibt eine JSON-Datei, die alles enthält – das ist die
                 einzige Kopie, die es sonst gibt.</p>
              <p>Ist ein Konto angemeldet, liegt jeder Bestand für sich, und die Sicherung
                 umfasst das Profil, das gerade offen ist. Zwei Konten heißt zwei Dateien.</p>
            </>
          } />
      </Gruppe>

      <Gruppe titel="Nachweise">
        <Zeile titel="Kartendaten" wert="© OpenStreetMap-Mitwirkende, ODbL"
          hilfe={<p>Kacheln von OpenStreetMap oder Thunderforest, Wegdaten über Overpass –
                    alles aus derselben Datenbasis.</p>} />
        <Zeile titel="Karte" wert="Leaflet · BSD 2-Clause" />
        <Zeile titel="Oberfläche" wert="Preact · MIT" />
      </Gruppe>
    </>
  );
}
