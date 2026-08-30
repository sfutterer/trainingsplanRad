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
import { ready, planError, plan, discardOwnPlanAndReload } from './state/store.js';
import { profil } from './state/auth.js';
import { tab, gotoTab, tabId, BEREICHE, HAUPTZIELE } from './state/navigation.js';
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

export function App(){
  const [drawer, setDrawer] = useState(false);
  const [glocke, setGlocke] = useState(false);
  const [profilOffen, setProfilOffen] = useState(false);
  const [erhoben, setErhoben] = useState(false);

  /* Echte Refs, keine frisch gebauten Objekte: der popstate-Handler wird
     einmal registriert und saehe sonst dauerhaft die Werte des ersten
     Durchlaufs. */
  const drawerRef = useRef(false);
  const glockeRef = useRef(false);
  const profilRef = useRef(false);
  drawerRef.current = drawer;
  glockeRef.current = glocke;
  profilRef.current = profilOffen;

  useEffect(() => {
    /* Ein unbekannter Anker landet auf dem Plan statt in einem Zustand, den
       es nicht gibt - etwa ein alter Lesezeichen-Link aus der Zeit, als der
       Bereich noch "heute" hiess. */
    tab.value = tabId((location.hash || '').replace('#', '')) || 'plan';
    history.replaceState({ tab: tab.value }, '', '#' + tab.value);

    const onPop = e => {
      /* Offene Overlays fangen die Geste ab. Sonst springt man aus einem
         Dialog gleich zwei Ebenen zurueck. */
      if(drawerRef.current){ setDrawer(false); history.pushState({ tab: tab.value }, '', '#' + tab.value); return; }
      if(glockeRef.current){ setGlocke(false); history.pushState({ tab: tab.value }, '', '#' + tab.value); return; }
      if(profilRef.current){ setProfilOffen(false); history.pushState({ tab: tab.value }, '', '#' + tab.value); return; }
      gotoTab((e.state && e.state.tab) || 'plan', false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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

  return (
    <div class="shell">
      <AppBar
        erhoben={erhoben}
        titel={BEREICHE[aktuell]}
        onMenu={() => { setDrawer(true); history.pushState({ tab: tab.value, overlay:'drawer' }, '', '#' + tab.value); }}
        onGlocke={() => { setGlocke(true); history.pushState({ tab: tab.value, overlay:'glocke' }, '', '#' + tab.value); }}
        glockeAktiv={glocke}
        profil={profil.value}
        onProfil={() => { setProfilOffen(true); history.pushState({ tab: tab.value, overlay:'profil' }, '', '#' + tab.value); }}
      />
      <main class={'content' + (imUntermenue ? '' : ' ohne-leiste')}>
        <div class="page"><Aktiv /></div>
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
