/* Die Bausteine der Tagesauswertung: Wetterleiste, Verfassung, Streckenzahlen,
   Fazit.

   Standen vorher als Wetterblock in AnalyseTab - vier Kacheln mit Temperatur,
   Wind, Regen und Feuchte. Vier Zahlen ohne Zusammenhang beantworten die Frage
   aber nicht, die man nach einer Fahrt hat: war das eine gute Einheit, und wenn
   nicht, woran lag es. Deshalb zusammen mit der Strecke ausgewertet und in
   einem Fazit gebuendelt - eigene Datei, weil die Detailansicht sonst nicht
   mehr auf einen Blick lesbar ist.

   Bis zum 04.09.2026 stand hier eine Karte "Auswertung", die Strecke,
   Hoehenmeter und Wind ueber alle Fahrten des Tages zusammenrechnete und
   darunter saemtliche Bewertungssaetze am Stueck zeigte. Bei zwei Fahrten war
   das die falsche Zusammenfassung: "62 km, 340 hm, 40 % gegen den Wind" ist
   keine Fahrt, die jemand gefahren ist, und welcher der beiden Saetze zu
   welcher Fahrt gehoerte, stand nirgends. Die Zahlen stehen seitdem je Fahrt
   (Streckenwerte), die Bewertung ebenso - hier bleiben die Teile, die
   tatsaechlich dem ganzen Tag gehoeren. */

import { richtungKurz } from '../../../data/wetter.js';
import { zahl } from '../../../domain/zahlen.js';
import { Icon } from '../../components/Icon.jsx';

/* Eine Stelle hinter dem Komma. Hiess frueher ein() und war exportiert - es
   gab aber eine zweite Funktion desselben Namens in fazit.js, die 20 als
   "20" statt als "20,0" schrieb. Beide rechnen jetzt mit zahl(v, 1). */
const zahl1 = v => zahl(v, 1);

/* Temperatur, Luftfeuchte, Niederschlag - ueber der Karte, weil sie den Blick
   auf die Strecke einordnen, und ohne Satz, weil drei Zahlen keinen brauchen. */
export function WetterLeiste({ wetter }){
  if(!wetter) return null;
  /* Drei Zeichen, drei Zahlen, kein Wort - auf einem Handy stehen sie
     nebeneinander, und jedes zusaetzliche Wort bricht die Zeile. Was die Werte
     bedeuten, steht in der Auswertung darunter; das title-Attribut nennt es
     denen, die den Zeiger daraufhalten. */
  return (
    <div class="wetterleiste">
      <div class="wetterpost" title="Temperatur">
        <Icon name="temperatur" /><b>{Math.round(wetter.temp)} °C</b>
      </div>
      <div class="wetterpost" title="Luftfeuchte">
        <Icon name="feuchte" /><b>{Math.round(wetter.feuchte)} %</b>
      </div>
      <div class="wetterpost" title="Niederschlag">
        <Icon name="regen" /><b>{zahl1(wetter.regen)} mm</b>
      </div>
    </div>
  );
}

/* Das Fazit des Tages: Urteil, Begruendung, Massnahmen.

   Stand bis zum 04.09.2026 zweimal auf der Seite - oben kompakt und unten am
   Ende der Zusammenfassung noch einmal mit Begruendungen. Mit der
   Zusammenfassung ist die zweite Fassung entfallen; `kompakt` bleibt fuer den
   Fall, dass nur das Urteil gebraucht wird. */
export function Fazit({ fazit, kompakt }){
  if(!fazit) return null;
  return (
    <div class={'fazit ' + fazit.urteil}>
      <div class="fazit-kopf">Fazit</div>
      <div class="fazit-satz">{fazit.satz}</div>
      {!kompakt && fazit.gruende.length > 0 && (
        <ul>{fazit.gruende.map((g, i) => <li key={i}>{g.text}</li>)}</ul>
      )}
      {fazit.massnahmen.length > 0 && (
        <>
          <div class="fazit-mass">Was ändern</div>
          <ul>{fazit.massnahmen.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </>
      )}
    </div>
  );
}

/* Ruhepuls, HRV und Schlaf am Fahrtag - dieselbe Rolle wie die Wetterleiste
   ueber der Karte: drei Zahlen, die den Rest einordnen. Ohne sie liest sich
   eine harte Fahrt nach zwei kurzen Naechten wie mangelnde Disziplin. */
export function VerfassungsLeiste({ verfassung }){
  if(!verfassung) return null;
  const v = verfassung;
  const posten = [];
  if(v.restingHR > 0){
    posten.push({ k:'Ruhepuls', w: Math.round(v.restingHR) + ' bpm', warn: v.rhrHoch,
                  t: v.rhrAvg ? 'Schnitt ' + Math.round(v.rhrAvg) + ' bpm' : null });
  }
  if(v.hrv > 0){
    posten.push({ k:'HRV', w: String(Math.round(v.hrv)), warn: v.hrvNiedrig,
                  t: v.hrvAvg ? 'Schnitt ' + Math.round(v.hrvAvg) : null });
  }
  if(v.sleepSecs > 0){
    posten.push({ k:'Schlaf', w: zahl1(v.sleepSecs / 3600) + ' h', warn: v.kurzeNaechte > 0,
                  t: v.kurzeNaechte === 2 ? 'zweite kurze Nacht' : null });
  }
  if(!posten.length) return null;
  return (
    <>
      <div class="row"><span>Verfassung am Fahrtag</span>
        <b>{v.rot ? 'Gate rot' : 'Gate grün'}</b></div>
      <div class="anwerte">
        {posten.map(p => (
          <div class={'anwert' + (p.warn ? ' warn' : '')} key={p.k}>
            <b>{p.w}</b><span>{p.k}{p.t ? ' · ' + p.t : ''}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* Die Zahlen einer Fahrt: Strecke, Hoehenmeter, Wind, Untergrund.

   Je Fahrt und nicht je Tag. Ueber zwei Fahrten summiert entsteht eine Strecke,
   die niemand gefahren ist, und ein Windanteil, in dem sich Hin- und Rueckweg
   gegenseitig aufheben - genau die beiden, bei denen der Wind der Unterschied
   ist. */
export function Streckenwerte({ bilanz, wetter }){
  if(!bilanz) return null;
  const windGewertet = bilanz.windMeter > 0;
  return (
    <>
      <div class="anwerte">
        <div class="anwert"><b>{zahl1(bilanz.km)} km</b><span>gewertete Strecke</span></div>
        <div class="anwert"><b>{Math.round(bilanz.hoch)} hm</b>
          <span>{zahl1(bilanz.hmProKm)} hm/km · max {zahl1(bilanz.steilster)} %</span></div>
        {windGewertet && (
          <div class="anwert"><b>{bilanz.gegenProzent} %</b>
            <span>gegen den Wind · ⌀ {Math.round(bilanz.gegenSchnitt)} km/h</span></div>
        )}
        <div class="anwert">
          <b>{bilanz.untergrundBekannt ? bilanz.wegProzent + ' %' : '–'}</b>
          <span>{bilanz.untergrundBekannt ? 'unbefestigt' : 'Untergrund nicht erfasst'}</span></div>
      </div>

      {windGewertet && (
        <>
          <div class="row"><span>Wind zur Fahrtrichtung</span>
            <b>{bilanz.gegenProzent} % gegen</b></div>
          <div class="zbar">
            <span style={'width:' + bilanz.gegenProzent + '%;background:var(--z5)'}></span>
            <span style={'width:' + bilanz.querProzent + '%;background:var(--z3)'}></span>
            <span style={'width:' + bilanz.rueckProzent + '%;background:var(--z2)'}></span>
          </div>
          <div class="zleg">
            Gegen {bilanz.gegenProzent} % · quer {bilanz.querProzent} % ·
            Rücken {bilanz.rueckProzent} % · {zahl1(bilanz.windMeter / 1000)} km gewertet
            {wetter ? ' · Wind aus ' + richtungKurz(wetter.richtung) + ' mit ' +
              Math.round(wetter.wind) + ' km/h, Böen ' + Math.round(wetter.boe) : ''}
          </div>
        </>
      )}
    </>
  );
}

/* Bewertungssaetze, wie sie aus analysis.js kommen. */
export function Notizen({ notes }){
  if(!notes || !notes.length) return null;
  return notes.map((n, i) => <div class={'annote ' + (n.kind || '')} key={i}>{n.text}</div>);
}
