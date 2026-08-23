/* Rahmen der App: ein Bereich zur Zeit, Navigation unten.

   Die Zurueck-Geste ist auf Android die normale Handbewegung. Ohne
   History-Eintraege schliesst sie die App - deshalb bekommt jeder Wechsel
   einen Eintrag, und popstate fuehrt zurueck statt hinaus. */

import { useEffect } from 'preact/hooks';
import { NavigationBar } from './ui/components/NavigationBar.jsx';
import { tab, ready, planError, plan } from './state/store.js';
import { HeuteTab } from './ui/tabs/heute/HeuteTab.jsx';
import { RumpfTab } from './ui/tabs/rumpf/RumpfTab.jsx';
import { IntervalleTab } from './ui/tabs/intervalle/IntervalleTab.jsx';
import { AnalyseTab } from './ui/tabs/analyse/AnalyseTab.jsx';
import { PlanTab } from './ui/tabs/plan/PlanTab.jsx';
import { UpdateBanner } from './ui/components/UpdateBanner.jsx';

const TABS = {
  heute: HeuteTab,
  rumpf: RumpfTab,
  intervalle: IntervalleTab,
  analyse: AnalyseTab,
  plan: PlanTab
};

function gotoTab(id, push){
  if(tab.value === id) return;
  tab.value = id;
  if(push) history.pushState({ tab: id }, '', '#' + id);
  /* Jeder Bereich beginnt oben - ein uebernommener Scrollstand aus dem
     vorigen Tab wirkt wie ein Fehler. */
  const c = document.querySelector('.content');
  if(c) c.scrollTop = 0;
}

export function App(){
  useEffect(() => {
    const start = (location.hash || '').replace('#', '');
    if(TABS[start]) tab.value = start;
    history.replaceState({ tab: tab.value }, '', '#' + tab.value);

    const onPop = e => {
      const id = (e.state && e.state.tab) || 'heute';
      if(TABS[id]) gotoTab(id, false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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

  const Aktiv = TABS[tab.value] || HeuteTab;

  return (
    <div class="shell">
      <main class="content">
        <div class="page"><Aktiv /></div>
      </main>
      <UpdateBanner />
      <NavigationBar active={tab.value} onSelect={id => gotoTab(id, true)} />
    </div>
  );
}

export { gotoTab };
