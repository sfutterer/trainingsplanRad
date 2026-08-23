/* Speicher hinter einer Schnittstelle.

   Warum ueberhaupt: heute steckt alles in localStorage dieses einen
   Browserprofils. Das ist die einzige Kopie der Trainingsprotokolle. Ein Port
   erlaubt spaeter einen zweiten Adapter - IndexedDB fuer Aktivitaetsstroeme,
   sobald die Analyse sie zwischenspeichert, oder eine Host-Bruecke - ohne dass
   die Aufrufer davon etwas merken.

   Alles async, auch wenn localStorage synchron ist: sonst muesste jeder
   Aufrufer beim Adapterwechsel angefasst werden. */

export const KEYS = {
  startDate:  'training-start-date',
  apiKey:     'intervals-icu-api-key',
  coreLog:    'core-session-log',
  thresholds: 'training-thresholds',
  testLog:    'test-history',
  interimLog: 'interim-log',
  planOverride: 'plan-override',
  settings:   'app-settings'
};

export const CORE_LOG_MAX = 80;

export function localStorageAdapter(){
  return {
    async get(key){
      try { const v = localStorage.getItem(key); return v === null ? null : v; }
      catch(e){ return null; }
    },
    async set(key, value){
      try { localStorage.setItem(key, value); return true; }
      catch(e){ return false; }
    },
    async remove(key){
      try { localStorage.removeItem(key); return true; }
      catch(e){ return false; }
    },
    async keys(){
      try { return Object.keys(localStorage); } catch(e){ return []; }
    }
  };
}

export function memoryAdapter(seed){
  const m = new Map(Object.entries(seed || {}));
  return {
    async get(k){ return m.has(k) ? m.get(k) : null; },
    async set(k, v){ m.set(k, v); return true; },
    async remove(k){ m.delete(k); return true; },
    async keys(){ return [...m.keys()]; }
  };
}

/* Typisierte Zugriffe je Schluessel. JSON-Parsen an genau einer Stelle, damit
   eine kaputte Zeile nicht die halbe App mitnimmt. */
export function createRepos(store){
  const json = async (key, fallback) => {
    const raw = await store.get(key);
    if(raw == null) return fallback;
    try { return JSON.parse(raw); } catch(e){ return fallback; }
  };

  return {
    store,

    async startDate(){
      const v = await store.get(KEYS.startDate);
      return v ? v : null;
    },
    async setStartDate(iso){ return store.set(KEYS.startDate, iso); },

    async apiKey(){ return (await store.get(KEYS.apiKey)) || ''; },
    async setApiKey(k){
      return k ? store.set(KEYS.apiKey, k) : store.remove(KEYS.apiKey);
    },

    async thresholds(){
      const v = await json(KEYS.thresholds, null);
      const n = x => (x > 0 ? Math.round(x) : null);
      return v && typeof v === 'object'
        ? { ftp:n(v.ftp), lthr:n(v.lthr), hrmax:n(v.hrmax) }
        : { ftp:null, lthr:null, hrmax:null };
    },
    async setThresholds(t){ return store.set(KEYS.thresholds, JSON.stringify(t)); },

    async coreLog(){
      const v = await json(KEYS.coreLog, []);
      return Array.isArray(v) ? v : [];
    },
    async setCoreLog(list){
      return store.set(KEYS.coreLog, JSON.stringify(list.slice(-CORE_LOG_MAX)));
    },

    async testLog(){
      const v = await json(KEYS.testLog, []);
      return Array.isArray(v) ? v : [];
    },
    async setTestLog(list){ return store.set(KEYS.testLog, JSON.stringify(list.slice(-12))); },

    async interimLog(){
      const v = await json(KEYS.interimLog, []);
      return Array.isArray(v) ? v : [];
    },
    async setInterimLog(list){ return store.set(KEYS.interimLog, JSON.stringify(list.slice(-120))); },

    async planOverride(){ return json(KEYS.planOverride, null); },
    async setPlanOverride(p){ return store.set(KEYS.planOverride, JSON.stringify(p)); },
    async clearPlanOverride(){ return store.remove(KEYS.planOverride); },

    async settings(){ return json(KEYS.settings, {}); },
    async setSettings(s){ return store.set(KEYS.settings, JSON.stringify(s)); }
  };
}
