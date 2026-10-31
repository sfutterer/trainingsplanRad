/* Zonen und Messwerte: womit gerechnet wird, woher es kommt, was es geändert
   hat.

   Die Seite beantwortet "mit welchen Zahlen rechne ich" - das schaut man alle
   paar Wochen an, nicht täglich. Bis zum 31.10.2026 beantwortete sie die
   Frage in neun Absätzen Fließtext und zeigte dabei keine einzige vergangene
   Messung: was gerade galt, stand in drei Eingabefeldern, die aussahen wie
   eine Einstellung, und was vorher galt, stand nirgends. Wer wissen wollte,
   seit wann die App mit 223 W rechnet, fand es nicht heraus.

   Jetzt zeigt sie:

     Womit gerechnet wird    die drei Werte, wer von ihnen steuert, die Zonen
     Was sich geändert hat   die letzte Messung mit ihren Folgen in Zahlen
     Verlauf                 FTP, LTHR und Gewicht über alle Messungen
     Messwerte               jeder Eintrag mit Datum, antippbar zum Ändern
     Sprechtest-Erhebung     unverändert, nur kürzer

   Die Erklärungen sind nicht verschwunden, sie stehen hinter den Begriffen
   (domain/glossar.js). Ein Tipp auf "FTP" sagt, was eine FTP ist - und wer es
   weiß, sieht nur die Zahl. */

import { useState } from 'preact/hooks';
import { plan, thresholds, week, messwerte, testLog, interimLog, startDate,
         addInterimEntry } from '../../../state/store.js';
import { isoDayLocal, toMidnight, dayFromIso, weekNumberFor, datumText,
         weekStartFor } from '../../../domain/week.js';
import { hrBands, zonenGrund, zoneBand, quelleVon } from '../../../domain/zones.js';
import { konsequenz, reihe, werteText, vorbelegtesDatum,
         ART_TEST, ART_HAND } from '../../../domain/messwerte.js';
import { sprechtestBezug, testTermine } from '../../../domain/test.js';
import { Zonenliste } from '../../components/Zonenliste.jsx';
import { Verlaufsgraph } from '../../components/Verlaufsgraph.jsx';
import { Messwertsheet } from '../../components/Messwertsheet.jsx';
import { Begriff } from '../../components/Begriff.jsx';
import { Zahlenfeld, Textfeld } from '../../components/Feld.jsx';
import './zonen.css';

/* Woher ein Wert kommt, in drei Worten. Ohne Vermerk kein Satz: eine geratene
   Herkunft stünde so bestimmt da wie eine vermerkte. */
function herkunftText(quelle){
  if(!quelle) return null;
  const tag = quelle.tag ? datumText(dayFromIso(quelle.tag)) : null;
  if(quelle.art === ART_HAND) return tag ? 'eingetragen am ' + tag : 'eingetragen';
  return tag ? 'Test vom ' + tag : 'Test';
}

const FELDNAME = { ftp: 'FTP', lthr: 'LTHR', hrmax: 'HFmax' };
const EINHEIT  = { ftp: 'W', lthr: 'bpm', hrmax: 'bpm' };

/* ---- Womit gerechnet wird ---- */

function Geltung(){
  const p = plan.value, th = thresholds.value, w = week.value, start = startDate.value;
  const { coggan, grund, abWoche } = zonenGrund(p, th, w);
  const abDatum = abWoche && start ? weekStartFor(abWoche, start) : null;
  const nachWatt = th.ftp > 0;

  return (
    <div class="card">
      <div class="row"><span>Womit gerechnet wird</span>
        <b>{nachWatt ? 'Watt steuert' : 'Puls steuert'}</b></div>

      <div class="ergebnis">
        <div class={'ergwert' + (nachWatt ? ' fuehrend' : '')}>
          <b>{th.ftp > 0 ? th.ftp + ' W' : '–'}</b>
          <span><Begriff id="ftp">FTP</Begriff></span>
        </div>
        <div class="ergwert">
          <b>{th.lthr > 0 ? th.lthr + ' bpm' : '–'}</b>
          <span><Begriff id="lthr">LTHR</Begriff></span>
        </div>
        <div class="ergwert">
          <b>{th.hrmax > 0 ? th.hrmax + ' bpm' : '–'}</b>
          <span><Begriff id="hrmax">HFmax</Begriff></span>
        </div>
      </div>

      {/* Je Wert eine Zeile: woher die Zahl kommt. Das ersetzt den früheren
          Absatz, der dasselbe in drei Sätzen sagte. */}
      <div class="herkunftzeile">
        {['ftp', 'lthr', 'hrmax'].filter(k => th[k] > 0).map(k => (
          <span key={k}>{FELDNAME[k]} · {herkunftText(quelleVon(th, k)) || 'ohne Vermerk'}</span>
        ))}
      </div>

      <Zonenliste bands={hrBands(p, th, w)} plan={p} thresholds={th} mitWatt />

      {nachWatt && (
        <p class="hint">
          Gesteuert wird über die Leistung, der Puls ist Kontrollgröße.
        </p>
      )}
      {grund === 'zu-frueh' && (
        <p class="hint good">
          Pulsbänder aus der LTHR ab Woche {abWoche}{abDatum ? ' (' + datumText(abDatum) + ')' : ''},
          bis dahin die <Begriff id="uebergang">Übergangsbänder</Begriff>.
          {th.ftp > 0 ? ' Wattzonen gelten sofort.' : ''}
        </p>
      )}
      {grund === 'kein-test' && w >= p.cogganFromWeek && (
        <p class="hint warn">
          Ab Woche {p.cogganFromWeek} ist <Begriff id="coggan">Coggan</Begriff> vorgesehen,
          die LTHR fehlt. Bis dahin gelten die <Begriff id="uebergang">Übergangsbänder</Begriff>.
        </p>
      )}
      <p class="hint">{coggan ? p.texts.zoneNoteCoggan : p.texts.zoneNoteTransition}</p>
    </div>
  );
}

/* ---- Was die letzte Messung geändert hat ----

   Die Zahl allein sagt wenig. 223 statt 192 W ist erst dann eine Aussage,
   wenn danebensteht, dass Z2 damit bei 123–167 W liegt statt bei 106–144 und
   die Schwellenblöcke der Phase 4 bei 201–212 W. Gerechnet wird das in
   domain/messwerte.js, hier steht nur die Darstellung. */
function Konsequenz(){
  const k = konsequenz(plan.value, messwerte.value, week.value);
  if(!k || !k.felder.length) return null;
  const e = k.eintrag;

  return (
    <div class="card">
      <div class="row"><span>Was sich damit geändert hat</span>
        <b>{e.art === ART_TEST ? 'Test' : 'Eintrag'}
          {e.day ? ' vom ' + datumText(dayFromIso(e.day)) : ''}</b></div>

      {k.felder.map(f => (
        <div class="listrow" key={f.feld}>
          <span>{FELDNAME[f.feld]}</span>
          <span>
            {f.von != null ? f.von + ' ' + EINHEIT[f.feld] + ' → ' : 'neu: '}
            <b>{f.auf} {EINHEIT[f.feld]}</b>
            {f.diff ? ' (' + (f.diff > 0 ? '+' : '−') + Math.abs(f.diff) + ')' : ''}
          </span>
        </div>
      ))}

      {k.folgen.length ? (
        <>
          <div class="listhead">Was daran hängt</div>
          {k.folgen.map(f => (
            <div class="listrow" key={f.titel}>
              <span>{f.titel}</span><span>{f.von} → <b>{f.auf}</b></span>
            </div>
          ))}
        </>
      ) : null}

      {k.pulsAbWoche && (
        <p class="hint">
          Pulsbänder aus dieser LTHR ab Woche {k.pulsAbWoche}, Wattzonen sofort.
        </p>
      )}
    </div>
  );
}

/* ---- Verlauf ----

   Drei Linien auf einer gemeinsamen Prozentachse: FTP, LTHR und Gewicht,
   jeweils als Änderung gegen den ersten Wert. Gemeinsame Achse, weil eigene
   Bereiche aus einem Watt Unterschied einen Ausschlag über die halbe
   Bildhöhe machen - Messrauschen, gezeichnet wie Fortschritt.

   Kein W/kg: während einer Abnehmphase bewegen sich Zähler und Nenner
   gleichzeitig, und ein steigender Quotient sagt dann nichts über die Form.
   Getrennt gezeichnet beantworten die Linien genau das.

   Die LTHR ist neu dabei. Sie stand nie in einer Kurve, obwohl sie sich
   zwischen zwei Tests genauso ändert wie die FTP - und obwohl eine LTHR, die
   bei steigender Leistung gleich bleibt, genau die Aussage ist, die man
   sucht. */
const VERLAUF_MIN_SPANNE = 4;   // Prozent, damit Rauschen nicht das Bild füllt

const REIHEN = [
  { feld: 'ftp',    name: 'FTP',     einheit: 'W',   nk: 0, cls: 'z4' },
  { feld: 'lthr',   name: 'LTHR',    einheit: 'bpm', nk: 0, cls: 'z3' },
  { feld: 'weight', name: 'Gewicht', einheit: 'kg',  nk: 1, cls: 'z1' }
];

function delta(r, einheit, nk){
  const d = r.letzter - r.erster;
  const vz = d >= 0 ? '+' : '−';
  const abs = Math.abs(d);
  return vz + (nk ? abs.toFixed(nk).replace('.', ',') : Math.round(abs)) + ' ' + einheit;
}

function Verlauf(){
  const liste = messwerte.value;
  const gezeichnet = REIHEN
    .map(r => ({ ...r, reihe: reihe(liste, r.feld, r.einheit, r.nk) }))
    .filter(r => r.reihe);
  if(!gezeichnet.length) return null;

  return (
    <div class="card">
      <div class="row"><span>Verlauf</span><b>seit der ersten Messung</b></div>
      <Verlaufsgraph
        reihen={gezeichnet.map(r => ({ name: r.name, farbe: 'var(--' + r.cls + ')',
                                       punkte: r.reihe.punkte }))}
        einheit="%" nachkomma={1} mindestSpanne={VERLAUF_MIN_SPANNE} />
      <div class="verlaufleg">
        {gezeichnet.map(r => (
          <span key={r.feld}><i class={r.cls}></i>{r.name} {delta(r.reihe, r.einheit, r.nk)}</span>
        ))}
      </div>
      <p class="hint">
        Änderung gegenüber dem ersten Wert, gemeinsame Achse, getrennt statt als
          {' '}<Begriff id="wkg">W/kg</Begriff>.
      </p>
    </div>
  );
}

/* ---- Die Messwerte selbst ---- */

function Messwertliste({ onOeffnen }){
  const liste = messwerte.value.slice().reverse();
  const th = thresholds.value;
  /* Welcher Eintrag gerade einen Wert trägt - er bekommt die Markierung. */
  const traegt = new Set(['ftp', 'lthr', 'hrmax']
    .map(k => quelleVon(th, k)).filter(Boolean).map(q => q.id));

  return (
    <div class="card">
      <div class="row"><span><Begriff id="messwert">Messwerte</Begriff></span>
        <b>{liste.length ? liste.length + (liste.length === 1 ? ' Eintrag' : ' Einträge')
                         : 'noch keiner'}</b></div>

      {liste.map(e => (
        <button class={'messzeile' + (traegt.has(e.id) ? ' gilt' : '')} key={e.id}
          type="button" onClick={() => onOeffnen(e)}>
          <span class="messtag">
            {e.day ? datumText(dayFromIso(e.day)) : 'ohne Datum'}
            <small>{e.art === ART_TEST ? 'Schwellentest' : 'eingetragen'}
              {e.week ? ' · W' + e.week : ''}</small>
          </span>
          <span class="messzahl">
            {werteText(e) || '–'}
            {e.art === ART_TEST && e.w20
              ? <small>20 min {e.w20} W{e.kadenz ? ' · ' + e.kadenz + ' U/min' : ''}
                  {e.rpe ? ' · RPE ' + e.rpe : ''}</small>
              : null}
            {e.note ? <small>{e.note}</small> : null}
          </span>
        </button>
      ))}

      <button class="btn block" type="button" onClick={() => onOeffnen(null)}>Neuer Wert</button>

      {liste.length > 0 && (
        <p class="hint">
          Je Größe gilt der jüngste Eintrag (markiert). Antippen zum Ändern oder Löschen.
        </p>
      )}
    </div>
  );
}

/* ---- Sprechtest ----

   Bleibt, wie er war: ein Puls, eine Notiz, und der Vergleich mit der
   Z2-Obergrenze über alle Erhebungen seit dem letzten Test. Nur der
   Erklärtext ist weg - er steht jetzt am Begriff. */
function Erhebung(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const [f, setF] = useState({ talk: null, note: '' });
  const log = interimLog.value;

  const z2 = zoneBand(p, th, 'z2', w);
  const bezug = sprechtestBezug(log, testLog.value, z2);
  const leer = !(f.talk > 0) && !f.note.trim();

  async function eintragen(){
    if(leer) return;
    const heute = toMidnight(new Date());
    await addInterimEntry({
      day: isoDayLocal(heute),
      week: weekNumberFor(heute, startDate.value),
      talkHr: f.talk > 0 ? f.talk : null,
      note: f.note.trim()
    });
    setF({ talk: null, note: '' });
  }

  return (
    <div class="card">
      <div class="row"><span><Begriff id="sprechtest">Sprechtest-Erhebung</Begriff></span>
        <b>{log.length ? log.length + (log.length === 1 ? ' Eintrag' : ' Einträge')
                       : 'noch nichts erfasst'}</b></div>
      <Zahlenfeld titel="Sprechtest-Puls (bpm)" wert={f.talk} min={1}
        onWert={v => setF({ ...f, talk: v })} />
      <Textfeld titel="Notiz" wert={f.note} platzhalter="Knie, Schlaf, Erkältung, Rad"
        onWert={v => setF({ ...f, note: v })} />
      <button class="btn block" disabled={leer} onClick={eintragen}>Eintragen</button>

      {bezug && (
        <p class={'hint ' + (bezug.zuHoch ? 'warn' : 'good')}>
          Ø {bezug.schnitt} bpm aus {bezug.anzahl}{' '}
          {bezug.anzahl === 1 ? 'Erhebung' : 'Erhebungen'}
          {bezug.seit ? ' seit dem Test vom ' + datumText(dayFromIso(bezug.seit)) : ''},
          Z2-Obergrenze {bezug.max} bpm.{' '}
          {bezug.zuHoch
            ? 'Mehr als ' + bezug.abstand + ' bpm darunter.'
            : 'Abstand höchstens ' + bezug.abstand + ' bpm.'}
        </p>
      )}
      {log.slice(-4).reverse().map((e, i) => (
        <div class="listrow datum" key={i}>
          <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
          <span>{e.talkHr ? 'Sprechtest ' + e.talkHr + ' bpm' : '–'}{e.note ? ' · ' + e.note : ''}</span>
        </div>
      ))}
    </div>
  );
}

export function ZonenTab(){
  /* null heisst zu. Sonst steht im Zustand, was im Sheet liegt: ein Eintrag
     zum Ändern oder null für einen neuen. */
  const [sheet, setSheet] = useState(null);

  const termine = testTermine(plan.value, startDate.value).map(t => isoDayLocal(t.datum));
  const heute = isoDayLocal(toMidnight(new Date()));

  return (
    <>
      <Geltung />
      <Konsequenz />
      <Verlauf />
      <Messwertliste onOeffnen={e => setSheet({ eintrag: e })} />
      <Erhebung />

      {sheet && (
        <Messwertsheet
          eintrag={sheet.eintrag}
          vorgabe={{ day: vorbelegtesDatum(termine, heute), art: ART_TEST }}
          onClose={() => setSheet(null)} />
      )}
    </>
  );
}
