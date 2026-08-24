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
import { tab, ready, planError, plan } from './state/store.js';
import { PlanTab } from './ui/tabs/plan/PlanTab.jsx';
import { KraftTab } from './ui/tabs/kraft/KraftTab.jsx';
import { IntervalleTab } from './ui/tabs/intervalle/IntervalleTab.jsx';
import { AnalyseTab } from './ui/tabs/analyse/AnalyseTab.jsx';
import { ZonenTab } from './ui/tabs/zonen/ZonenTab.jsx';
import { EinstellungenTab } from './ui/tabs/einstellungen/EinstellungenTab.jsx';
import { AboutTab } from './ui/tabs/about/AboutTab.jsx';
import { UpdateBanner } from './ui/components/UpdateBanner.jsx';
import { Snackbar } from './ui/components/Snackbar.jsx';

const TABS = {
  plan:          { komp: PlanTab,          titel: 'Plan' },
  kraft:         { komp: KraftTab,         titel: 'Kraft' },
  intervalle:    { komp: IntervalleTab,    titel: 'Intervalle' },
  analyse:       { komp: AnalyseTab,       titel: 'Analyse' },
  zonen:         { komp: ZonenTab,         titel: 'Zonen & Schwellenwerte' },
  einstellungen: { komp: EinstellungenTab, titel: 'Einstellungen' },
  about:         { komp: AboutTab,         titel: 'Über die App' }
};

function gotoTab(id, push){
  if(!TABS[id] || tab.value === id) return;
  tab.value = id;
  if(push) history.pushState({ tab: id }, '', '#' + id);
  const c = document.querySelector('.content');
  if(c) c.scrollTop = 0;
}

export function App(){
  const [drawer, setDrawer] = useState(false);
  const [glocke, setGlocke] = useState(false);
  const [erhoben, setErhoben] = useState(false);

  /* Echte Refs, keine frisch gebauten Objekte: der popstate-Handler wird
     einmal registriert und saehe sonst dauerhaft die Werte des ersten
     Durchlaufs. */
  const drawerRef = useRef(false);
  const glockeRef = useRef(false);
  drawerRef.current = drawer;
  glockeRef.current = glocke;

  useEffect(() => {
    /* Ein unbekannter Anker landet auf dem Plan statt in einem Zustand, den
       es nicht gibt - etwa ein alter Lesezeichen-Link aus der Zeit, als der
       Bereich noch "heute" hiess. */
    const start = (location.hash || '').replace('#', '');
    tab.value = TABS[start] ? start : 'plan';
    history.replaceState({ tab: tab.value }, '', '#' + tab.value);

    const onPop = e => {
      /* Offene Overlays fangen die Geste ab. Sonst springt man aus einem
         Dialog gleich zwei Ebenen zurueck. */
      if(drawerRef.current){ setDrawer(false); history.pushState({ tab: tab.value }, '', '#' + tab.value); return; }
      if(glockeRef.current){ setGlocke(false); history.pushState({ tab: tab.value }, '', '#' + tab.value); return; }
      const id = (e.state && e.state.tab) || 'plan';
      if(TABS[id]) gotoTab(id, false);
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
      </div>
    );
  }

  if(!ready.value || !plan.value) return null;

  const eintrag = TABS[tab.value] || TABS.plan;
  const Aktiv = eintrag.komp;
  const imUntermenue = ['plan','kraft','intervalle','analyse'].includes(tab.value);

  return (
    <div class="shell">
      <AppBar
        erhoben={erhoben}
        titel={eintrag.titel}
        onMenu={() => { setDrawer(true); history.pushState({ tab: tab.value, overlay:'drawer' }, '', '#' + tab.value); }}
        onGlocke={() => { setGlocke(true); history.pushState({ tab: tab.value, overlay:'glocke' }, '', '#' + tab.value); }}
        glockeAktiv={glocke}
      />
      <main class={'content' + (imUntermenue ? '' : ' ohne-leiste')}>
        <div class="page"><Aktiv /></div>
      </main>

      <UpdateBanner />
      <Snackbar />

      {imUntermenue && <NavigationBar active={tab.value} onSelect={id => gotoTab(id, true)} />}

      <NavDrawer offen={drawer} aktiv={tab.value}
        onClose={() => setDrawer(false)}
        onSelect={id => { setDrawer(false); gotoTab(id, true); }} />

      {glocke && <HeuteOverlay
        onClose={() => setGlocke(false)}
        onZumPlan={() => { setGlocke(false); gotoTab('plan', true); }} />}
    </div>
  );
}

export { gotoTab };
