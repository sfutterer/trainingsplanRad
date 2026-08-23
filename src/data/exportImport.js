/* Sicherung aller Nutzerdaten.

   Der wichtigste Knopf der App: core-session-log und interim-log existieren
   nur in diesem einen Browserprofil. Ein "Browserdaten loeschen", ein
   Geraetewechsel - und die Historie ist weg. Kein Backend heisst auch: keine
   Sicherung ausser dieser. */

import { KEYS } from './storage.js';

const EXPORT_VERSION = 1;

export async function exportAll(store){
  const daten = {};
  for(const k of Object.values(KEYS)){
    const v = await store.get(k);
    if(v != null) daten[k] = v;
  }
  return {
    format: 'trainingsplanRad-backup',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: daten
  };
}

export function exportFilename(now){
  const d = now || new Date();
  const p = n => String(n).padStart(2, '0');
  return `trainingsplan-sicherung-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/* Gibt zurueck, was uebernommen wurde - der Aufrufer soll es benennen koennen.
   Bei fremdem Format wird nichts geschrieben: eine halb eingespielte Sicherung
   waere schlimmer als gar keine. */
export async function importAll(store, parsed){
  if(!parsed || typeof parsed !== 'object' || parsed.format !== 'trainingsplanRad-backup'){
    throw new Error('Das ist keine Sicherung dieser App.');
  }
  if(!parsed.data || typeof parsed.data !== 'object'){
    throw new Error('Die Sicherung enthält keine Daten.');
  }
  if(parsed.version > EXPORT_VERSION){
    throw new Error('Die Sicherung stammt aus einer neueren Fassung der App (Version ' + parsed.version + ').');
  }
  const erlaubt = new Set(Object.values(KEYS));
  const uebernommen = [];
  for(const [k, v] of Object.entries(parsed.data)){
    if(!erlaubt.has(k) || typeof v !== 'string') continue;
    await store.set(k, v);
    uebernommen.push(k);
  }
  if(!uebernommen.length) throw new Error('Die Sicherung enthielt keinen bekannten Eintrag.');
  return uebernommen;
}
