/* Zonen, Schwellenwerte und die Erhebung der Uebergangszeit.

   Standen frueher unter den Tageskarten. Das war die falsche Stelle: der Plan
   beantwortet "was mache ich heute", diese Seite beantwortet "mit welchen
   Zahlen rechne ich". Das eine schaut man taeglich an, das andere alle paar
   Wochen. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, week, testLog, interimLog, apiKey,
         setThresholds, addTestEntry, addInterimEntry } from '../../../state/store.js';
import { fetchWellness, putWellness } from '../../../data/icu.js';
import { isoDayLocal, toMidnight, dayFromIso, weekNumberFor, tagNr, kurzTag } from '../../../domain/week.js';
import { hrBands, usesCoggan, zoneBand } from '../../../domain/zones.js';
import { sprechtestBezug } from '../../../domain/test.js';
import { zahl } from '../../../domain/zahlen.js';
import { bestaetige } from '../../../state/dialog.js';
import { Zonenliste } from '../../components/Zonenliste.jsx';
import { Verlaufsgraph } from '../../components/Verlaufsgraph.jsx';
import { Zahlenfeld, Textfeld } from '../../components/Feld.jsx';
import './zonen.css';

function ZonenKarte(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const bands = hrBands(p, th, w);
  const coggan = usesCoggan(p, th, w);
  return (
    <div class="card">
      <div class="row"><span>Zonenmodell</span><b>
        {coggan ? 'Coggan, % LTHR (' + th.lthr + ' bpm)' + (th.ftp > 0 ? ' · Watt aus FTP ' + th.ftp + ' W' : '')
                : 'Übergangsbänder, Arbeitsannahme'}
      </b></div>
      <Zonenliste bands={bands} plan={p} thresholds={th} mitWatt />
      <p class="hint">{coggan ? p.texts.zoneNoteCoggan : p.texts.zoneNoteTransition}</p>
    </div>
  );
}

/* Zwei Verlaeufe, kein W/kg.

   W/kg waere die naheliegende Zahl und ist hier die falsche: waehrend einer
   Abnehmphase bewegen sich Zaehler und Nenner gleichzeitig, ein steigender
   Quotient sagt dann nichts darueber, ob der Motor groesser geworden ist.
   Getrennt gezeichnet beantworten die beiden Linien genau das - und eine
   flache FTP-Linie ueber einer fallenden Gewichtslinie ist kein Stillstand,
   sondern gehaltene Leistung bei weniger Energie.

   Beide auf einer gemeinsamen Prozentachse, nicht jede auf ihren eigenen
   Bereich normiert. Eigene Bereiche waren der erste Entwurf und machten aus
   einem Watt Unterschied zwischen zwei Tests einen Ausschlag ueber die halbe
   Bildhoehe - Messrauschen, gezeichnet wie Fortschritt.

   Gezeichnet wird jetzt mit Verlaufsgraph und nicht mehr mit einem eigenen
   SVG. Die Begruendung oben rechtfertigt eine andere Aufbereitung der Daten -
   eben die Umrechnung auf Prozent gegen den ersten Test - und nicht eine
   zweite Zeichenroutine: die alte Fassung brachte eigene Skalierung, eigene
   Legende und eigene Trefferflaechen mit, also drei Dinge, die es schon gab,
   nur kleiner und ohne antippbare Punkte. Die Mindestspanne, die das Rauschen
   klein haelt, ist als Eigenschaft dorthin gewandert. */
const VERLAUF_MIN_SPANNE = 4;   // Prozent, damit Rauschen nicht das Bild fuellt

/* Aus einer Testreihe die Prozentaenderung gegen den ersten Wert. Der absolute
   Wert bleibt als Zusatz am Punkt haengen - beim Antippen steht dort "215 W"
   und nicht nur "+3,9 %". */
function prozentReihe(eintraege, feld, einheit, nk){
  const echte = eintraege.filter(e => e[feld] > 0);
  if(echte.length < 2) return null;
  const erster = echte[0][feld];
  return {
    erster, letzter: echte[echte.length - 1][feld],
    punkte: echte.map(e => ({
      t: tagNr(e.day),
      v: (e[feld] - erster) / erster * 100,
      marke: kurzTag(e.day),
      zusatz: zahl(e[feld], nk) + ' ' + einheit
    }))
  };
}

function delta(reihe, einheit, nk){
  const d = reihe.letzter - reihe.erster;
  const vz = d >= 0 ? '+' : '−';
  return vz + zahl(Math.abs(d), nk) + ' ' + einheit +
         ' (' + vz + zahl(Math.abs(d / reihe.erster * 100), 1) + ' %)';
}

function Verlauf({ eintraege }){
  const sortiert = eintraege.slice().sort((a, b) => (a.day < b.day ? -1 : 1));
  const ftp = prozentReihe(sortiert, 'ftp', 'W', 0);
  const kg = prozentReihe(sortiert, 'weight', 'kg', 1);
  if(!ftp && !kg) return null;

  const reihen = [];
  if(ftp) reihen.push({ name: 'FTP', farbe: 'var(--z4)', punkte: ftp.punkte });
  if(kg)  reihen.push({ name: 'Gewicht', farbe: 'var(--z1)', punkte: kg.punkte });

  return (
    <>
      <div class="listhead">Verlauf</div>
      <Verlaufsgraph reihen={reihen} einheit="%" nachkomma={1}
        mindestSpanne={VERLAUF_MIN_SPANNE} />
      <div class="verlaufleg">
        {ftp && <span><i class="z4"></i>FTP {delta(ftp, 'W', 0)}</span>}
        {kg && <span><i class="z1"></i>Gewicht {delta(kg, 'kg', 1)}</span>}
      </div>
      <p class="hint">
        Änderung gegenüber dem ersten Test, beide Linien auf derselben Achse. Bewusst
        getrennt statt als W/kg: sinkt das Gewicht gewollt, sagt ein steigender Quotient
        nichts über die Form. Eine flache FTP-Linie bei fallendem Gewicht ist gehaltene
        Leistung bei weniger Energie – kein Stillstand.
      </p>
    </>
  );
}

/* Das Testformular klappt an der Stelle der Tastenreihe auf.

   Vorher fragten vier prompt() nacheinander nach den Werten. Das liess sich
   nicht korrigieren und nicht abbrechen, ohne alles zu verlieren: wer beim
   dritten Fenster merkte, dass er die 20-min-Watt falsch abgelesen hatte,
   fing von vorn an. Ein Formular zeigt alle vier Felder gleichzeitig, laesst
   sie in beliebiger Reihenfolge ausfuellen und hat einen Abbrechen-Knopf.

   Die gerechnete FTP steht schon in der Kopfzeile, waehrend man tippt - so
   sieht man vor dem Speichern, welche Zahl daraus wird. */
function TestFormular({ tagIso, vorschlag, onSpeichern, onAbbrechen }){
  const [w20, setW20] = useState(null);
  const [kadenz, setKadenz] = useState(null);
  const [kg, setKg] = useState(vorschlag);
  const [bed, setBed] = useState('');

  return (
    <>
      <div class="row"><span>Test vom {dayFromIso(tagIso).toLocaleDateString('de-DE')}</span>
        <b>{w20 > 0 ? 'FTP ' + Math.round(w20 * 0.95) + ' W' : 'Ø-Watt eintragen'}</b></div>
      <Zahlenfeld titel="Ø-Watt der 20 min" wert={w20} min={1} onWert={setW20} />
      {/* Seit Fassung 4 die Kadenz statt der 5-min-Leistung: die entsteht an
          einem anderen Tag und steht im Testbereich unter „VO2max-Referenz". */}
      <Zahlenfeld titel="Ø-Kadenz der 20 min" wert={kadenz} min={1} onWert={setKadenz} />
      <Zahlenfeld titel="Gewicht (kg)" wert={kg} min={1} dezimal schritt="0.1" onWert={setKg} />
      <Textfeld titel="Bedingungen" wert={bed} onWert={setBed}
        platzhalter="Temperatur, Wind, Strecke, Rad" />
      <div class="buttons">
        <button class="btn" onClick={() => onSpeichern({ w20, kadenz, kg, bed: bed.trim() })}>Speichern</button>
        <button class="btn secondary" onClick={onAbbrechen}>Abbrechen</button>
      </div>
      <p class="hint">
        Nur die 20-min-Watt werden gebraucht; alles andere ist freiwillig.
        {vorschlag != null && kg === vorschlag
          ? ' Das Gewicht ist aus der Wellness von intervals.icu übernommen.' : ''}
      </p>
    </>
  );
}

function SchwellenKarte(){
  const th = thresholds.value;
  const [f, setF] = useState({ ftp: th.ftp, lthr: th.lthr, hrmax: th.hrmax });
  const [meldung, setMeldung] = useState(null);
  const [test, setTest] = useState(null);

  const geaendert = f.ftp !== th.ftp || f.lthr !== th.lthr || f.hrmax !== th.hrmax;

  /* Das Gewicht steht meist schon in der Wellness - dann muss es niemand
     abtippen und die beiden Quellen koennen nicht auseinanderlaufen. */
  async function gewichtVorschlag(tagIso){
    const key = apiKey.value;
    if(!key) return null;
    try {
      const rows = await fetchWellness(key, tagIso, tagIso);
      const r = (Array.isArray(rows) ? rows : []).find(x => x && x.weight > 0);
      return r ? r.weight : null;
    } catch(e){ return null; }
  }

  async function testOeffnen(){
    const tagIso = isoDayLocal(toMidnight(new Date()));
    setTest({ tagIso, vorschlag: null, bereit: false });
    const vorschlag = await gewichtVorschlag(tagIso);
    /* Nur uebernehmen, wenn das Formular noch fuer denselben Tag offen ist -
       sonst schriebe eine spaete Antwort in ein Formular, das der Nutzer
       inzwischen geschlossen hat. */
    setTest(t => (t && t.tagIso === tagIso ? { tagIso, vorschlag, bereit: true } : t));
  }

  async function testSpeichern({ w20, kadenz, kg, bed }){
    const { tagIso, vorschlag } = test;
    setTest(null);

    /* Ohne eingetragene FTP die aus dem Test gerechnete uebernehmen - eine
       bereits gesetzte wird nicht ungefragt ueberschrieben. */
    let ftp = f.ftp;
    if(w20 > 0 && !ftp){
      ftp = Math.round(w20 * 0.95);
      setF({ ...f, ftp });
      await setThresholds({ ftp, lthr: f.lthr, hrmax: f.hrmax });
    }
    await addTestEntry({
      day: tagIso,
      week: weekNumberFor(dayFromIso(tagIso), startDate.value),
      w20: w20 > 0 ? w20 : null,
      kadenz: kadenz > 0 ? kadenz : null,
      ftp, lthr: f.lthr,
      weight: kg > 0 ? kg : null,
      conditions: bed,
      /* Auch hier: unter welchem Ablauf der Wert entstand. Ein Eintrag ohne
         Kennung liesse sich spaeter nicht mehr einordnen, und die Regel
         "identischer Ablauf ueber alle Termine" nicht mehr pruefen. */
      protokoll: plan.value.thresholdTest.id,
      protokollFassung: plan.value.thresholdTest.fassung
    });
    setMeldung({ art:'ok', text:'Test gespeichert.' });

    /* Der einzige Schreibvorgang der App, deshalb mit Rueckfrage - und nur,
       wenn der Wert nicht ohnehin von dort kam. */
    if(kg > 0 && apiKey.value && kg !== vorschlag){
      const ja = await bestaetige({
        titel: 'Gewicht nach intervals.icu schreiben?',
        text: kg + ' kg für den ' + dayFromIso(tagIso).toLocaleDateString('de-DE') + '. '
            + 'Das ist der einzige Wert, den diese App jemals dorthin schreibt – '
            + 'alles andere wird nur gelesen.',
        jaLabel: 'Schreiben'
      });
      if(!ja) return;
      try {
        await putWellness(apiKey.value, tagIso, { weight: kg });
        setMeldung({ art:'ok', text:'Gewicht nach intervals.icu geschrieben.' });
      } catch(e){
        setMeldung({ art:'fehler', text:'Nicht geschrieben: ' + e.message + ' Der Test ist trotzdem gespeichert.' });
      }
    }
  }

  const hist = testLog.value.slice().sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 4);

  return (
    <div class="card">
      <div class="row"><span>Schwellenwerte</span><b>{th.lthr > 0 ? 'aus Test übernommen' : 'noch kein Test'}</b></div>
      <Zahlenfeld titel="FTP (W)" wert={f.ftp} min={1} onWert={v => setF({ ...f, ftp: v })} />
      <Zahlenfeld titel="LTHR (bpm)" wert={f.lthr} min={1} onWert={v => setF({ ...f, lthr: v })} />
      <Zahlenfeld titel="HFmax (bpm)" wert={f.hrmax} min={1} onWert={v => setF({ ...f, hrmax: v })} />

      {test
        ? (test.bereit
            ? <TestFormular tagIso={test.tagIso} vorschlag={test.vorschlag}
                onSpeichern={testSpeichern} onAbbrechen={() => setTest(null)} />
            : <p class="hint">Gewicht wird aus der Wellness geholt …</p>)
        : (
          <div class="buttons">
            <button class="btn" disabled={!geaendert}
              onClick={() => setThresholds({ ftp: f.ftp, lthr: f.lthr, hrmax: f.hrmax })}>Übernehmen</button>
            <button class="btn secondary" onClick={testOeffnen}>Als Test speichern</button>
          </div>
        )}

      <p class="hint">
        FTP = Ø-Watt der 20 min × 0,95, LTHR = Ø-Puls der 20 min. Dieselben Werte gehören in
        intervals.icu unter Settings → Ride, Power Zones und HR Zones auf Coggan, Load Priority
        auf Power, FTP von automatisch auf manuell.
      </p>
      {meldung && <div class={'meldung ' + meldung.art}><b>{meldung.text}</b></div>}
      {testLog.value.length > 1 && <Verlauf eintraege={testLog.value} />}
      {hist.length > 0 && <>
        <div class="listhead">Testhistorie</div>
        {hist.map((e, i) => (
          <div class="listrow datum" key={i}>
            <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
            <span>FTP {e.ftp || '–'} W · LTHR {e.lthr || '–'} bpm{e.w20 ? ' · 20 min ' + e.w20 + ' W' : ''}{e.kadenz ? ' · ' + e.kadenz + ' U/min' : ''}{e.weight ? ' · ' + e.weight + ' kg' : ''}{e.conditions ? ' · ' + e.conditions : ''}</span>
          </div>
        ))}
      </>}
    </div>
  );
}

/* Ein Wert mit Regel, dazu die Notiz, die ihn erklaert.

   Hier stand bis zum 04.09.2026 auch ein RPE je Einheit. Es hatte keinen
   Auftrag: der Trainingsplan verlangt Empfinden an zwei Stellen, und beide
   sind woanders verankert - das RPE der letzten fuenf Testminuten als
   Guetepruefung im Testformular, und der Sprechtest als oberste Instanz fuer
   Z2, erhoben als Puls und nicht als Zahl von eins bis zehn. Auch Coggan
   braucht es nicht: dort sind FTP und LTHR die Eingaben, und die RPE-Spalte
   der Zonentabelle ist beschreibend - sie sagt, wie sich eine Zone anfuehlen
   soll, damit man sie ohne Messgeraet findet. Eine Ausgabe des Modells, keine
   Eingabe.

   Dazu kam ein Fehler in der Reihe selbst: Z2-Fahrt und Intervalltag landeten
   in einer Kurve, ohne dass die Einheit mitgespeichert wurde. Ein Ausschlag
   nach oben hiess dort nicht "schlechte Form", sondern "das war ein
   Donnerstag". Bereits gespeicherte Eintraege behalten ihren rpe-Schluessel;
   die Sicherung reicht ihn unveraendert durch. */
function ErhebungsKarte(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const [f, setF] = useState({ talk: null, note: '' });
  const log = interimLog.value;

  /* Der Vergleich mit der Z2-Obergrenze liegt in domain/test.js: er ist Punkt
     6 der Checkliste nach jedem Test und zaehlt nur, was seit dem letzten Test
     erhoben wurde - davor galten andere Baender. */
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
      <div class="row"><span>Sprechtest-Erhebung</span>
        <b>{log.length ? log.length + (log.length === 1 ? ' Eintrag' : ' Einträge') : 'noch nichts erfasst'}</b></div>
      <Zahlenfeld titel="Sprechtest-Puls (bpm)" wert={f.talk} min={1}
        onWert={v => setF({ ...f, talk: v })} />
      {/* Der Platzhalter nennt nur noch, was die App nicht selbst herleitet.
          Er nannte "Wind, Knie, Strecke" - und Wind und Strecke rechnet das
          Fazit aus der Aufzeichnung genauer aus, als man sie tippen kann:
          Gegenwindanteil, Hoehenmeter, hm/km, steilster Abschnitt. Uebrig
          bleibt, was in keiner Datei steht. */}
      <Textfeld titel="Notiz" wert={f.note} platzhalter="Knie, Schlaf, Erkältung, Rad"
        onWert={v => setF({ ...f, note: v })} />
      <button class="btn block" disabled={leer} onClick={eintragen}>Eintragen</button>
      <p class="hint">
        Sprechtest: nach Atmung fahren. Sobald ganze Sätze anstrengend werden, Puls ablesen und
        hier notieren – nicht umgekehrt. Die Notiz gehört zu genau diesem Wert: sie steht
        in der Analyse am angetippten Punkt der Kurve und sagt dort, warum er so liegt.
      </p>
      {bezug && (
        <p class={'hint ' + (bezug.zuHoch ? 'warn' : 'good')}>
          Ø Sprechtest-Puls {bezug.schnitt} bpm aus {bezug.anzahl}{' '}
          {bezug.anzahl === 1 ? 'Erhebung' : 'Erhebungen'}
          {bezug.seit ? ' seit dem Test vom ' + dayFromIso(bezug.seit).toLocaleDateString('de-DE') : ''},
          Z2-Obergrenze {bezug.max} bpm.{' '}
          {bezug.zuHoch
            ? 'Mehr als ' + bezug.abstand + ' bpm darunter – Z2 gehört nach unten begrenzt. '
              + 'Das ist Punkt 6 der Checkliste nach dem Test: der Sprechtest sticht die Zahl.'
            : 'Die Bänder passen zur Atmung.'}
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
  return (
    <>
      <ZonenKarte />
      <SchwellenKarte />
      <ErhebungsKarte />
    </>
  );
}
