/* Die Buehne: was zur laufenden Uebung gehoert, an einer festen Stelle und mit
   einer festen Tastenbelegung.

   Lag bis zum 29.08.2026 in Baustein.jsx, also beim Trainings-Tab. Genau
   deshalb hielt sich der Intervall-Timer nicht daran: er baute seine Reihe
   selbst und belegte links "Reset" statt "Zurueck" - ausgerechnet die Reihe,
   die man auf dem Rad blind trifft. Als gemeinsame Komponente gilt die Regel
   jetzt fuer alle fuenf Timer der App.

     links   Zurueck   - immer einen Schritt oder eine Uebung zurueck
     Mitte   gross     - immer die Haupthandlung dieser Uebung
     rechts  Weiter    - immer einen Schritt oder eine Uebung vor
     darunter          - Beenden, unbetont, weil es die seltenste Handlung ist

   Die Mitte war der schlimmste Bruch der alten Fassung: im Zirkel startete sie
   die Uhr, im gefuehrten Ablauf blaetterte sie bei Wiederholungsuebungen eine
   Uebung weiter. Jetzt gilt: wo eine Uhr ist, startet die Mitte die Uhr; wo
   keine ist, heisst sie "Erledigt" und quittiert die Uebung. Beides ist die
   Haupthandlung, beides liegt am selben Fleck.

   Ohne Uhr tritt die Dosierung an die Stelle des Rings. Ein leerer Ring oder
   ein Ring, der auf 0 steht, waere ein Versprechen auf eine Zeit, die der Plan
   an dieser Uebung nicht vorgibt.

   Der Block begrenzt seine Hoehe auf den Platz zwischen den Leisten: Anzeige,
   Bild und Bedienung muessen ohne Scrollen zusammen sichtbar sein. Wird es
   eng, gibt das Bild nach - es ist der einzige Teil, der Groesse verliert,
   ohne unlesbar zu werden, und ein Tipp darauf oeffnet es ohnehin gross.

   Beenden steht ausserhalb des Blocks. In ihm haette es dem Bild 60 px
   abgenommen, und zwar dauerhaft - dabei ist es die seltenste Handlung des
   ganzen Tabs und darf einen Wisch weit unten liegen. */

import { ProgressRing } from './ProgressRing.jsx';
import { Uebungsbild } from '../tabs/training/Uebungsbild.jsx';

export function Buehne({ ring, dosis, bild, zurueck, haupt, weiter, ende }){
  return (
    <>
    <div class="uebungsblock">
      {ring ? (
        <ProgressRing
          fraction={ring.fraction} color={ring.color} phase={ring.phase}
          time={ring.time} exercise={ring.exercise} meta={ring.meta}
          zone={ring.zone}
          onTap={haupt && !haupt.disabled ? haupt.onClick : undefined} />
      ) : dosis ? (
        <div class="dosisbuehne">
          <span class="phase">{dosis.phase}</span>
          <b>{dosis.wert}</b>
          <span class="ex">{dosis.exercise}</span>
          {dosis.meta ? <small>{dosis.meta}</small> : null}
          {dosis.kinder || null}
        </div>
      ) : null}

      {bild ? (
        <div class={'illu' + (bild.vorschau ? ' vorschau' : '')}>
          <Uebungsbild src={bild.src} name={bild.name} onClick={bild.onClick} />
          {bild.cap ? (
            <div class="cap">
              {bild.vorschau ? <span class="tag">Als Nächstes</span> : null}
              {bild.cap}
            </div>
          ) : null}
        </div>
      ) : null}

      <div class="controls">
        <button class="btn secondary" onClick={zurueck && zurueck.onClick}
          disabled={!zurueck || zurueck.disabled}>{(zurueck && zurueck.label) || 'Zurück'}</button>
        <button class="btn gross" onClick={haupt && haupt.onClick}
          disabled={!haupt || haupt.disabled}>{(haupt && haupt.label) || 'Start'}</button>
        <button class="btn secondary" onClick={weiter && weiter.onClick}
          disabled={!weiter || weiter.disabled}>{(weiter && weiter.label) || 'Weiter'}</button>
      </div>
    </div>

    {ende ? (
      <button class="btn secondary block ablaufende" onClick={ende.onClick}>{ende.label}</button>
    ) : null}
    </>
  );
}

