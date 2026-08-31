/* Rahmen der App.

   Unten die vier Trainingsziele, oben eine schmale Leiste mit Hamburgermenue
   und Glocke. Der Drawer traegt alle Bereiche, auch die, fuer die unten kein
   Platz ist - so bleibt die Leiste bei vier Zielen, statt auf fuenf oder sechs
   anzuwachsen und dabei unlesbar zu werden.

   Die Zurueck-Geste ist auf Android die normale Handbewegung. Sie schliesst
   erst Overlays, dann geht sie einen Bereich zurueck - und erst danach aus der
   App heraus. */

import { useEffect, useState, useRef } from 'preact/hooks';
import { NavigationBar } from './ui/components/NavigationBar.jsx';
import { AppBar } from './ui/components/AppBar.jsx';
import { NavDrawer } from './ui/components/NavDrawer.jsx';
import { HeuteOverlay } from './ui/components/HeuteOverlay.jsx';
import { ProfilSheet } from './ui/components/ProfilSheet.jsx';
import { ready, planError, plan, apiKey, today, discardOwnPlanAndReload } from './state/store.js';
import { meldungsZahl, ladeMeldungen } from './state/meldungen.js';
import { profil } from './state/auth.js';
import { tab, gotoTab, tabId, BEREICHE, HAUPTZIELE } from './state/navigation.js';
import { overlayOffen, overlayZurueck } from './state/overlays.js';
import { PlanTab } from './ui/tabs/plan/PlanTab.jsx';
import { TrainingTab } from './ui/tabs/training/TrainingTab.jsx';
import { IntervalleTab } from './ui/tabs/intervalle/IntervalleTab.jsx';
import { UpdateBanner } from './ui/components/UpdateBanner.jsx';
import { Snackbar } from './ui/components/Snackbar.jsx';
import { Bestaetigung } from './ui/components/Bestaetigung.jsx';

/* Vier Bereiche kommen nachgeladen, drei nicht.

   Die Trennung folgt der Frage, was beim Start gebraucht wird. Plan, Training
   und Intervalle sind das, wofuer man die App oeffnet, und sie muessen sofort
   dastehen - beim Rumpfzirkel steht man schon auf der Matte. Analyse, Zonen,
   Einstellungen und Ueber die App ruft man dagegen bewusst auf und wartet
   dabei ohne Weiteres einen Wimpernschlag.

   Der Gewinn liegt fast ganz beim Analysebereich: er zieht verlauf.js,
   analysis.js, strecke.js, fazit.js, wellness.js und den OSM-Teil hinter sich
   her - zusammen der groesste Brocken nach Leaflet, und wer nur den Plan und
   den Zirkel benutzt, lud ihn bisher bei jedem Start mit.

   Ein Ladehinweis fehlt bewusst: die Dateien liegen nach dem ersten Start im
   Precache des Service Workers, der Wechsel dauert dann Millisekunden. Ein
   Spinner, der aufblitzt und sofort wieder geht, ist unruhiger als nichts.

   Von Hand statt mit lazy und Suspense aus preact/compat: die beiden gibt es
   im Kern nicht, und compat nur dafuer hereinzuziehen kostet mehr, als das
   Aufteilen einspart - dieselbe Rechnung, mit der auch die Diagramme ohne
   Bibliothek auskommen. Der geladene Bereich bleibt im Abschluss stehen, damit
   ein zweiter Besuch nicht wieder durch den leeren Zustand geht. */
function nachladen(laden){
  let geladen = null;
  return function Nachgeladen(props){
    const [, neu] = useState(0);
    useEffect(() => {
      if(geladen) return undefined;
      let weg = false;
      laden().then(k => { geladen = k; if(!weg) neu(x => x + 1); });
      return () => { weg = true; };
    }, []);
    const Bereich = geladen;
    return Bereich ? <Bereich {...props} /> : null;
  };
}

const AnalyseTab = nachladen(() =>
  import('./ui/tabs/analyse/AnalyseTab.jsx').then(m => m.AnalyseTab));
const ZonenTab = nachladen(() =>
  import('./ui/tabs/zonen/ZonenTab.jsx').then(m => m.ZonenTab));
const EinstellungenTab = nachladen(() =>
  import('./ui/tabs/einstellungen/EinstellungenTab.jsx').then(m => m.EinstellungenTab));
const AboutTab = nachladen(() =>
  import('./ui/tabs/about/AboutTab.jsx').then(m => m.AboutTab));

/* Nur die Zuordnung Bereich zu Komponente. Die Namen und die Frage, welche
   Kennung gueltig ist, stehen in state/navigation.js - sonst muessten die
   Bereiche den Rahmen kennen, um zueinander springen zu koennen. */
const KOMPONENTEN = {
  plan:          PlanTab,
  training:      TrainingTab,
  intervalle:    IntervalleTab,
  analyse:       AnalyseTab,
  zonen:         ZonenTab,
  einstellungen: EinstellungenTab,
  about:         AboutTab
};

/* Die beiden Bereiche mit Uhr bleiben montiert, sobald sie einmal offen waren.

   Alles andere haengt aus und wird beim naechsten Besuch neu gebaut - das ist
   fuer Plan, Analyse, Zonen und Einstellungen genau richtig, sie lesen ihren
   Zustand ohnehin aus den Signalen. Die Timer nicht: sie leben in einem Ref
   der Komponente, und mit ihnen haengen Rundenzahl, Protokolleintrag,
   gewaehltes Segment und die halbe Zelle des Beinblocks am selben Baum.

   Ein Blick auf den Plan mitten im Zirkel warf bisher alles davon weg. Es
   liess sich nicht einmal bemerken: die Uhr war beim Zurueckkommen einfach
   wieder auf "Start", und der angefangene Satz stand nur noch halb im
   Protokoll. Genau dieselbe Begruendung, aus der schon die vier Bausteine
   innerhalb des Trainings-Tabs nur versteckt und nicht ausgehaengt werden -
   sie gilt eine Ebene hoeher weiter.

   Deshalb versteckt statt ausgehaengt, und deshalb erst ab dem ersten Besuch:
   wer nur den Plan aufschlaegt, zeichnet die beiden nie. */
const MIT_UHR = ['training', 'intervalle'];

export function App(){
  const [drawer, setDrawer] = useState(false);
  const [glocke, setGlocke] = useState(false);
  const [profilOffen, setProfilOffen] = useState(false);
  const [erhoben, setErhoben] = useState(false);

  /* Welche Bereiche schon offen waren. Ein Ref und kein Zustand: der Eintrag
     entsteht waehrend derselben Zeichnung, in der der Bereich zum ersten Mal
     gebraucht wird - ueber setState waere es ein zweiter Durchlauf fuer eine
     Liste, die niemand ausser dieser Zeile liest. */
  const montiert = useRef({});

  /* Der Drawer ist kein Sheet und meldet sich deshalb hier selbst an. Die drei
     Sheets - Glocke, Profil, Rueckfrage - tun das in Sheet.jsx, und der
     Uebungsdialog tief im Trainings-Tab damit ebenso. */
  useEffect(() => {
    if(!drawer) return undefined;
    return overlayOffen(() => setDrawer(false));
  }, [drawer]);

  useEffect(() => {
    /* Ein unbekannter Anker landet auf dem Plan statt in einem Zustand, den
       es nicht gibt - etwa ein alter Lesezeichen-Link aus der Zeit, als der
       Bereich noch "heute" hiess. */
    tab.value = tabId((location.hash || '').replace('#', '')) || 'plan';
    history.replaceState({ tab: tab.value }, '', '#' + tab.value);

    const onPop = e => {
      /* Offene Overlays fangen die Geste ab - das oberste zuerst. Sonst
         springt man aus einem Dialog gleich zwei Ebenen zurueck, und im
         Trainings-Tab hiess das bisher: raus aus der Anleitung, raus aus dem
         Bereich, und die laufende Uebung hinterher. */
      if(overlayZurueck()) return;
      gotoTab((e.state && e.state.tab) || 'plan', false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* Die Meldungen der Glocke.

     Erst wenn der Plan steht - ohne ihn gibt es keine Tagesvorgabe, gegen die
     sich etwas melden liesse. Danach bei jedem Tageswechsel neu: eine PWA
     laeuft ueber Nacht weiter, und die Meldung von gestern ist am naechsten
     Morgen die falsche. Und beim Wechsel des Schluessels, weil erst mit ihm
     Wellness und Aufzeichnungen dazukommen.

     Fehler bleiben still: die Glocke zeigt dann weniger an, die App laeuft
     weiter. Ein Fehlerbanner fuer eine ausgefallene Nebenaussage waere lauter
     als der Verlust. */
  useEffect(() => {
    if(!ready.value || !plan.value) return;
    ladeMeldungen().catch(() => {});
    /* Die drei Signalwerte sind Absicht und keine ueberfluessigen
       Abhaengigkeiten: der Linter kennt Signals nicht und haelt jeden Zugriff
       ausserhalb der Komponente fuer unveraenderlich. Genau diese drei fallen
       hier aber um - der Plan wird fertig, ein Schluessel kommt dazu, der Tag
       wechselt -, und jedes Mal ist die Meldungsliste eine andere. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.value, apiKey.value, today.value]);

  useEffect(() => {
    const c = document.querySelector('.content');
    if(!c) return;
    const auf = () => setErhoben(c.scrollTop > 4);
    c.addEventListener('scroll', auf, { passive: true });
    return () => c.removeEventListener('scroll', auf);
    /* ready.value ist Absicht und keine ueberfluessige Abhaengigkeit: .content
       gibt es erst, wenn der Plan geladen ist. Der Linter kennt Signals nicht
       und haelt jeden Zugriff ausserhalb der Komponente fuer unveraenderlich -
       hier faellt aber genau dieser Wert von false auf true, und erst danach
       findet querySelector etwas. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.value]);

  if(planError.value){
    const e = planError.value;
    return (
      <div class="planerror">
        <h2>Plandaten fehlen</h2>
        <p>{e.titel}</p>
        {e.zeilen && e.zeilen.length ? <ul>{e.zeilen.map((z, i) => <li key={i}>{z}</li>)}</ul> : null}
        <p class="hint">
          Solange das nicht behoben ist, zeigt die App keine Trainingsvorgaben –
          lieber gar keine Zahl als eine falsche.
        </p>
        {/* Nur bei einem kaputten eigenen Plan: dieser Bildschirm ersetzt die
            ganze App, der Knopf in den Einstellungen ist von hier aus nicht
            erreichbar. Ohne diesen Ausweg bliebe die App verriegelt. */}
        {e.istEigener && <button class="btn" type="button" onClick={discardOwnPlanAndReload}>
          Eigenen Plan verwerfen und Default laden
        </button>}
      </div>
    );
  }

  if(!ready.value || !plan.value) return null;

  const aktuell = KOMPONENTEN[tab.value] ? tab.value : 'plan';
  const Aktiv = KOMPONENTEN[aktuell];
  const imUntermenue = HAUPTZIELE.includes(aktuell);

  /* Ab dem ersten Besuch bleibt ein Bereich mit Uhr stehen. Die Zeile steht
     bewusst vor der Zeichnung: der Bereich soll in derselben Zeichnung
     erscheinen, in der er gebraucht wird, und nicht erst eine spaeter. */
  if(MIT_UHR.includes(aktuell)) montiert.current[aktuell] = true;
  const dauernd = MIT_UHR.filter(id => montiert.current[id]);

  return (
    <div class="shell">
      <AppBar
        erhoben={erhoben}
        titel={BEREICHE[aktuell]}
        onMenu={() => setDrawer(true)}
        onGlocke={() => setGlocke(true)}
        glockeAktiv={glocke}
        meldungen={meldungsZahl.value}
        profil={profil.value}
        onProfil={() => setProfilOffen(true)}
      />
      <main class={'content' + (imUntermenue ? '' : ' ohne-leiste')}>
        <div class="page">
          {/* Die Bereiche mit Uhr stehen dauerhaft im Baum und werden nur
              versteckt; alle uebrigen kommen und gehen wie bisher. */}
          {dauernd.map(id => {
            const Bereich = KOMPONENTEN[id];
            return <div key={id} hidden={id !== aktuell}><Bereich /></div>;
          })}
          {MIT_UHR.includes(aktuell) ? null : <Aktiv />}
        </div>
      </main>

      <UpdateBanner />
      <Snackbar />
      <Bestaetigung />

      {imUntermenue && <NavigationBar active={tab.value} onSelect={id => gotoTab(id, true)} />}

      <NavDrawer offen={drawer} aktiv={tab.value}
        onClose={() => setDrawer(false)}
        onSelect={id => { setDrawer(false); gotoTab(id, true); }} />

      {glocke && <HeuteOverlay
        onClose={() => setGlocke(false)}
        onZumPlan={() => { setGlocke(false); gotoTab('plan', true); }} />}

      {profilOffen && <ProfilSheet onClose={() => setProfilOffen(false)} />}
    </div>
  );
}
