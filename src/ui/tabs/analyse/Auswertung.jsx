/* Die Auswertung einer Fahrt: Wetterleiste, Zahlen, Begruendung, Fazit.

   Stand vorher als Wetterblock in AnalyseTab - vier Kacheln mit Temperatur,
   Wind, Regen und Feuchte. Vier Zahlen ohne Zusammenhang beantworten die Frage
   aber nicht, die man nach einer Fahrt hat: war das eine gute Einheit, und wenn
   nicht, woran lag es. Deshalb zusammen mit der Strecke ausgewertet und in
   einem Fazit zusammengefasst - eigene Datei, weil die Detailansicht sonst
   nicht mehr auf einen Blick lesbar ist. */

import { richtungKurz } from '../../../data/wetter.js';

const WETTER_ZEICHEN = {
  temp: 'M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zm-3-9c.6 0 1 .4 1 1v9.6a3 3 0 1 1-2 0V5c0-.6.4-1 1-1z',
  feuchte: 'M12 2.7C12 2.7 6 9.4 6 14a6 6 0 0 0 12 0c0-4.6-6-11.3-6-11.3zm0 17.3a4 4 0 0 1-4-4c0-2.6 2.7-6.4 4-8.1 1.3 1.7 4 5.5 4 8.1a4 4 0 0 1-4 4z',
  regen: 'M17.7 8.5A6 6 0 0 0 6.3 7.2 4.5 4.5 0 0 0 7 16h10.4a3.8 3.8 0 0 0 .3-7.5zM8.4 17.6l-1.2 3.1 1.4.5 1.2-3.1zm3.6 0-1.2 3.1 1.4.5 1.2-3.1zm3.6 0-1.2 3.1 1.4.5 1.2-3.1z'
};

/* Temperatur, Luftfeuchte, Niederschlag - ueber der Karte, weil sie den Blick
   auf die Strecke einordnen, und ohne Satz, weil drei Zahlen keinen brauchen. */
export function WetterLeiste({ wetter }){
  if(!wetter) return null;
  const zeichen = d => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
  );
  /* Drei Zeichen, drei Zahlen, kein Wort - auf einem Handy stehen sie
     nebeneinander, und jedes zusaetzliche Wort bricht die Zeile. Was die Werte
     bedeuten, steht in der Auswertung darunter. */
  return (
    <div class="wetterleiste">
      <div class="wetterpost" title="Temperatur">
        {zeichen(WETTER_ZEICHEN.temp)}<b>{Math.round(wetter.temp)} °C</b>
      </div>
      <div class="wetterpost" title="Luftfeuchte">
        {zeichen(WETTER_ZEICHEN.feuchte)}<b>{Math.round(wetter.feuchte)} %</b>
      </div>
      <div class="wetterpost" title="Niederschlag">
        {zeichen(WETTER_ZEICHEN.regen)}<b>{wetter.regen.toFixed(1).replace('.', ',')} mm</b>
      </div>
    </div>
  );
}

/* Das Fazit steht zweimal, aber nicht doppelt: oben in der Kopfkarte das
   Urteil mit den Massnahmen - das ist, was man wissen will, bevor man
   scrollt - und unten am Ende der Auswertung dasselbe samt der Zahlen, auf die
   es sich stuetzt. Die Begruendungen stehen nur dort. */
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

export function ein(v){ return (Math.round(v * 10) / 10).toFixed(1).replace('.', ','); }

/* Der ganze Wetterblock ist hier aufgegangen: Wetter allein sagt wenig, Wind
   allein auch. Was zaehlt, ist die Kombination aus Strecke und Bedingungen -
   und die steht jetzt in einer Auswertung statt in vier Kacheln. */
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
    posten.push({ k:'Schlaf', w: ein(v.sleepSecs / 3600) + ' h', warn: v.kurzeNaechte > 0,
                  t: v.kurzeNaechte === 2 ? 'zweite kurze Nacht' : null });
  }
  if(!posten.length) return null;
  return (
    <>
      <div class="row" style="margin-top:14px"><span>Verfassung am Fahrtag</span>
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

export function Auswertung({ bilanz, wetter, fazit, row, verfassung }){
  if(!bilanz) return null;
  const windGewertet = bilanz.windMeter > 0;
  return (
    <div class="card">
      <div class="row"><span>Auswertung</span>
        <b>{wetter ? 'Strecke und Wetter' : 'Strecke'}</b></div>

      <div class="anwerte">
        <div class="anwert"><b>{ein(bilanz.km)} km</b><span>gewertete Strecke</span></div>
        <div class="anwert"><b>{Math.round(bilanz.hoch)} hm</b>
          <span>{ein(bilanz.hmProKm)} hm/km · max {ein(bilanz.steilster)} %</span></div>
        {windGewertet && (
          <div class="anwert"><b>{bilanz.gegenProzent} %</b>
            <span>gegen den Wind · ⌀ {Math.round(bilanz.gegenSchnitt)} km/h</span></div>
        )}
        <div class="anwert">
          <b>{bilanz.untergrundBekannt ? bilanz.wegProzent + ' %' : '–'}</b>
          <span>{bilanz.untergrundBekannt ? 'unbefestigt' : 'Untergrund nicht erfasst'}</span></div>
      </div>

      {windGewertet && (
        <>
          <div class="row" style="margin-top:14px"><span>Wind zur Fahrtrichtung</span>
            <b>{bilanz.gegenProzent} % gegen</b></div>
          <div class="zbar">
            <span style={'width:' + bilanz.gegenProzent + '%;background:var(--z5)'}></span>
            <span style={'width:' + bilanz.querProzent + '%;background:var(--z3)'}></span>
            <span style={'width:' + bilanz.rueckProzent + '%;background:var(--z2)'}></span>
          </div>
          <div class="zleg">
            Gegen {bilanz.gegenProzent} % · quer {bilanz.querProzent} % ·
            Rücken {bilanz.rueckProzent} % · {ein(bilanz.windMeter / 1000)} km gewertet
            {wetter ? ' · Wind aus ' + richtungKurz(wetter.richtung) + ' mit ' +
              Math.round(wetter.wind) + ' km/h, Böen ' + Math.round(wetter.boe) : ''}
          </div>
        </>
      )}

      <VerfassungsLeiste verfassung={verfassung} />

      {row.notes.map((n, i) => <div class={'annote ' + (n.kind || '')} key={i}>{n.text}</div>)}

      <Fazit fazit={fazit} />

      <p class="hint">
        Ruhepuls, HRV, Schlaf und Gewicht aus der Wellness von intervals.icu.
        Wind, Temperatur und Niederschlag stundenweise von Open-Meteo, Untergrund aus
        OpenStreetMap über Overpass – beide ohne Schlüssel und ohne Konto. Für die Abfragen
        gehen die Koordinaten der Fahrt dorthin. Steigung aus dem Höhenstream der
        Aufzeichnung, Gegenwindanteil aus Fahrtrichtung und Windrichtung je Abschnitt.
      </p>
    </div>
  );
}
