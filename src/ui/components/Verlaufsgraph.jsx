/* Ein Verlauf als handgeschriebenes SVG, dazu die Karte, in der er steht.

   Keine Diagrammbibliothek: die kleinste taugliche waere groesser als die
   ganze App, und gebraucht werden hier eine Linie, ein paar Punkte und eine
   Gerade. Auch keine Canvas-Zeichnung - im SVG erben Linien und Flaechen die
   Themefarben ueber var(), und der Wechsel zwischen hell und dunkel kostet
   keine Zeile Code. Aus demselben Grund steht in dieser Datei kein einziger
   Farbwert.

   Der Graph traegt bewusst keine Achsenbeschriftung im ueblichen Sinn. Auf
   560 px Breite waeren fuenf Datumsangaben unter der Linie unleserlich; es
   stehen deshalb nur der erste und der letzte Punkt darunter, die Spanne der
   Werte links und rechts und der Endwert am letzten Punkt. Alles andere holt
   man sich durch Antippen - jeder Punkt hat eine Trefferflaeche von 24 px,
   auch wenn er nur 3 px gross gezeichnet ist.

   Die gestrichelte Gerade ist die Theil-Sen-Steigung, verankert im Median
   beider Achsen. Sie liegt hinter der Linie, damit die Messwerte oben liegen:
   die Gerade ist die Aussage, die Messwerte sind der Beleg. */

import { useState } from 'preact/hooks';
import { zahl } from '../../domain/zahlen.js';
import './verlauf.css';

const B = 320, H = 132;                       // Zeichenflaeche im viewBox
const L = 34, R = 42, O = 12, U = 22;         // Raender fuer Beschriftung

/* mindest gibt eine Untergrenze fuer die gezeigte Spanne vor.

   Ohne sie fuellt der Graph immer die ganze Hoehe, egal wie klein die
   Unterschiede sind - ein Watt zwischen zwei Schwellentests wird dann zu
   einem Ausschlag ueber die halbe Bildhoehe, also Messrauschen, gezeichnet
   wie Fortschritt. Wo die Werte eine natuerliche Groessenordnung haben
   (Prozentaenderung gegen den ersten Test), gehoert diese Grenze gesetzt. */
function spanne(werte, mindest){
  let min = Math.min(...werte), max = Math.max(...werte);
  if(!(max > min)){ min = min - 1; max = max + 1; }
  if(mindest && max - min < mindest){
    const mitte = (min + max) / 2;
    min = mitte - mindest / 2;
    max = mitte + mindest / 2;
  }
  const luft = (max - min) * 0.12;
  return { min: min - luft, max: max + luft };
}

export function Verlaufsgraph({ reihen, nachkomma, einheit, mindestSpanne }){
  const [gewaehlt, setGewaehlt] = useState(null);
  const echte = (reihen || []).filter(r => r && r.punkte && r.punkte.length);
  if(!echte.length) return null;

  const alle = [].concat(...echte.map(r => r.punkte));
  const ts = alle.map(p => p.t);
  const tVon = Math.min(...ts), tBis = Math.max(...ts);
  const y = spanne(alle.map(p => p.v), mindestSpanne);
  const nk = nachkomma == null ? 2 : nachkomma;

  const px = t => (tBis > tVon ? L + (t - tVon) / (tBis - tVon) * (B - L - R) : (B - R + L) / 2);
  const py = v => O + (y.max - v) / (y.max - y.min) * (H - O - U);

  const erster = alle.reduce((a, p) => (p.t < a.t ? p : a), alle[0]);
  const letzter = alle.reduce((a, p) => (p.t > a.t ? p : a), alle[0]);
  const zeigen = gewaehlt || null;

  return (
    <>
      <svg class="vgraph" viewBox={'0 0 ' + B + ' ' + H} role="img"
        aria-label={'Verlauf mit ' + alle.length + ' Messpunkten'}>
        <line x1={L} y1={py(y.min)} x2={B - R} y2={py(y.min)}
          stroke="var(--outline)" stroke-width="1" vector-effect="non-scaling-stroke" />

        {echte.map((r, ri) => {
          const p = r.punkte.slice().sort((a, b) => a.t - b.t);
          const farbe = r.farbe || 'var(--primary)';
          const tr = r.trend;
          /* Die Gerade nur, wo sie auch gelten darf. Eine Steigung durch drei
             Punkte zu zeichnen und daneben zu schreiben, sie sei nicht
             belastbar, waere ein Widerspruch, den das Auge nicht liest. */
          const gerade = tr && tr.belastbar && tr.proWoche !== null && Number.isFinite(tr.tMitte)
            ? [tVon, tBis].map(t => ({ t, v: tr.mitte + tr.proWoche / 7 * (t - tr.tMitte) }))
            : null;
          return (
            <g key={ri}>
              {gerade && (
                <line x1={px(gerade[0].t)} y1={py(gerade[0].v)}
                  x2={px(gerade[1].t)} y2={py(gerade[1].v)}
                  stroke={farbe} stroke-width="1.5" stroke-dasharray="4 4" opacity=".55"
                  vector-effect="non-scaling-stroke" />
              )}
              <polyline points={p.map(q => px(q.t) + ',' + py(q.v)).join(' ')}
                fill="none" stroke={farbe} stroke-width="2" stroke-linejoin="round"
                stroke-linecap="round" vector-effect="non-scaling-stroke" />
              {p.map((q, i) => (
                <g key={i}>
                  <circle cx={px(q.t)} cy={py(q.v)} r="3" fill={farbe} />
                  <circle cx={px(q.t)} cy={py(q.v)} r="12" fill="transparent"
                    class="vgtreffer" onClick={() => setGewaehlt(
                      zeigen && zeigen.t === q.t && zeigen.reihe === r.name ? null
                        : Object.assign({}, q, { reihe: r.name, farbe }))} />
                </g>
              ))}
            </g>
          );
        })}

        <text class="vgachse" x="2" y={py(y.max) + 4}>{zahl(y.max, nk)}</text>
        <text class="vgachse" x="2" y={py(y.min) + 4}>{zahl(y.min, nk)}</text>
        <text class="vgachse" x={L} y={H - 6}>{erster.marke}</text>
        <text class="vgachse ende" x={B - R + 4} y={py(letzter.v) + 4}>{zahl(letzter.v, nk)}</text>
        <text class="vgachse rechts" x={B - R} y={H - 6}>{letzter.marke}</text>
      </svg>

      {echte.length > 1 && (
        <div class="vgleg">
          {echte.map(r => (
            <span key={r.name}><i style={'background:' + (r.farbe || 'var(--primary)')}></i>{r.name}</span>
          ))}
        </div>
      )}

      <div class="vgpunkt">
        {zeigen
          ? (zeigen.reihe ? zeigen.reihe + ' · ' : '') + zeigen.marke + ' · ' +
            zahl(zeigen.v, nk) + (einheit ? ' ' + einheit : '') +
            (zeigen.titel ? ' · ' + zeigen.titel : '') + (zeigen.zusatz ? ' · ' + zeigen.zusatz : '')
          : 'Punkt antippen für Datum und Wert.'}
      </div>
    </>
  );
}

/* Der Trendsatz ueber dem Graphen. Vier Zustaende, nicht zwei: besser,
   schlechter, unveraendert - und der vierte, der die anderen drei ueberhaupt
   erst ehrlich macht, naemlich "dazu ist noch nichts zu sagen". Der bekommt
   keine Farbe, weil er keine Bewertung ist. */
export function TrendZeile({ trend, was }){
  if(!trend) return null;
  if(!trend.belastbar){
    return (
      <div class="vtrend offen">
        <span class="vpfeil">?</span>
        <span>{trend.grund}</span>
      </div>
    );
  }
  const pfeil = trend.richtung === 'steigt' ? '↑' : trend.richtung === 'faellt' ? '↓' : '→';
  return (
    <div class={'vtrend ' + (trend.urteil || 'offen')}>
      <span class="vpfeil">{pfeil}</span>
      <span>{(was ? was + ' ' : '') + trend.aussage} · {trend.n} Punkte über {zahl(trend.wochen, 1)} Wochen</span>
    </div>
  );
}

/* Mehrere Reihen in einer Karte haben je einen eigenen Trendsatz. Solange
   keine Daten da sind, ist dieser Satz fuer alle derselbe - die Karte
   "Zonenverteilung" zeigte ihn dreimal untereinander. Gleichlautende
   Nicht-Aussagen werden deshalb zu einer zusammengezogen; sobald sich die
   Gruende unterscheiden, stehen wieder alle da. */
function Trendsaetze({ trend, weitere }){
  const alle = [{ trend, was: null }].concat(weitere || []).filter(x => x.trend);
  const gruende = new Set(alle.map(x => x.trend.belastbar ? null : x.trend.grund));
  if(alle.length > 1 && gruende.size === 1 && !alle[0].trend.belastbar){
    return <TrendZeile trend={alle[0].trend} />;
  }
  return <>{alle.map((x, i) => <TrendZeile key={i} trend={x.trend} was={x.was} />)}</>;
}

/* Karte, Trendsatz, Graph, Regel - in dieser Reihenfolge, weil die Frage
   "geht es aufwaerts" vor der Kurve beantwortet gehoert und die Filterregel
   erst danach interessiert. Sie muss aber sichtbar bleiben: ein
   Effizienzfaktor ohne die Angabe, welche Fahrten hineingerechnet wurden, ist
   eine Zahl ohne Bedeutung. */
export function IndikatorKarte({ titel, wert, reihen, trend, weitere, einheit, nachkomma,
                                 regel, hinweis, warnung, kinder }){
  return (
    <div class="card">
      <div class="row"><span>{titel}</span>{wert ? <b>{wert}</b> : null}</div>
      <Trendsaetze trend={trend} weitere={weitere} />
      <Verlaufsgraph reihen={reihen} einheit={einheit} nachkomma={nachkomma} />
      {kinder}
      {warnung && <div class="annote bad">{warnung}</div>}
      {hinweis && <div class="annote">{hinweis}</div>}
      {regel && <p class="hint">{regel}</p>}
    </div>
  );
}
