/* Sicherung aller Nutzerdaten.

   Der wichtigste Knopf der App: core-session-log und interim-log existieren
   nur in diesem einen Browserprofil. Ein "Browserdaten loeschen", ein
   Geraetewechsel - und die Historie ist weg. Kein Backend heisst auch: keine
   Sicherung ausser dieser. */

import { KEYS } from './storage.js';

const EXPORT_VERSION = 1;

export class SicherungError extends Error {
  constructor(titel, zeilen){
    super(titel);
    this.titel = titel;
    this.zeilen = zeilen || [];
  }
}

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

const istListe  = v => Array.isArray(v);
const istObjekt = v => !!v && typeof v === 'object' && !Array.isArray(v);

function alsJson(roh, passt, erwartet){
  let v;
  try { v = JSON.parse(roh); } catch(e){ return 'ist kein gültiges JSON'; }
  return passt(v) ? null : erwartet;
}

/* Je Schluessel ein Klarname und die Frage, was drinstehen muss.

   Der Klarname, weil "core-session-log" dem Nutzer nichts sagt und er beim
   Einspielen lesen koennen muss, was uebernommen und was geraeumt wurde.

   Die Pruefung, weil createRepos jeden Parse-Fehler abfaengt und den
   Ersatzwert liefert: ohne sie meldete der Import "eingespielt", und die
   Historie waere trotzdem weg. Startdatum und die beiden Zugangsschluessel
   liegen als nackte Zeichenkette im Speicher, alles andere als JSON.

   Ein neuer Schluessel in KEYS gehoert auch hier hinein - der Test in
   test/sicherung.test.js faellt sonst. */
export const EINTRAEGE = {
  [KEYS.startDate]:    { name: 'Startdatum',
    pruef: r => /^\d{4}-\d{2}-\d{2}$/.test(r) ? null : 'ist kein Datum im Format JJJJ-MM-TT' },
  [KEYS.apiKey]:       { name: 'intervals.icu-Schlüssel',        pruef: () => null },
  [KEYS.mapKey]:       { name: 'Kartenschlüssel',                pruef: () => null },
  [KEYS.coreLog]:      { name: 'Trainingsprotokolle',            pruef: r => alsJson(r, istListe,  'ist keine Liste') },
  [KEYS.testLog]:      { name: 'Testhistorie',                   pruef: r => alsJson(r, istListe,  'ist keine Liste') },
  [KEYS.interimLog]:   { name: 'Erhebungen',                     pruef: r => alsJson(r, istListe,  'ist keine Liste') },
  [KEYS.thresholds]:   { name: 'Schwellenwerte',                 pruef: r => alsJson(r, istObjekt, 'ist kein Objekt') },
  [KEYS.settings]:     { name: 'Einstellungen',                  pruef: r => alsJson(r, istObjekt, 'ist kein Objekt') },
  [KEYS.planOverride]: { name: 'eigener Plan',                   pruef: r => alsJson(r, istObjekt, 'ist kein Objekt') },
  [KEYS.untergrund]:   { name: 'Untergrund-Zwischenspeicher',    pruef: r => alsJson(r, istObjekt, 'ist kein Objekt') },
  [KEYS.gelesen]:      { name: 'Gelesene Meldungen',              pruef: r => alsJson(r, istListe,  'ist keine Liste') }
};

export function benenne(key){
  return EINTRAEGE[key] ? EINTRAEGE[key].name : key;
}

/* Ganz oder gar nicht: erst wird die vollstaendige Datei geprueft, dann
   geschrieben. Eine halb eingespielte Sicherung waere schlimmer als gar keine.

   Deshalb bricht auch ein einzelner Eintrag, den der Import nicht versteht,
   das Ganze ab statt uebersprungen zu werden: die Datei ist massgeblich, und
   was in ihr fehlt, wird auf dem Geraet geloescht. Ein uebersprungener Eintrag
   wuerde also den zugehoerigen Bestand raeumen - genau das Gegenteil dessen,
   wofuer der Knopf da ist.

   Dass die Datei massgeblich ist und nicht der Speicher, ist der zweite Punkt:
   ein eigener Plan oder ein fremder API-Schluessel ueberlebte das Einspielen
   sonst, und das Geraet zeigte eine Mischung aus zwei Staenden - genau das,
   was die Rueckfrage ausschliesst.

   Gibt zurueck, was uebernommen und was geraeumt wurde - der Aufrufer soll es
   benennen koennen. */
export async function importAll(store, parsed){
  if(!parsed || typeof parsed !== 'object' || parsed.format !== 'trainingsplanRad-backup'){
    throw new SicherungError('Das ist keine Sicherung dieser App.');
  }
  if(!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)){
    throw new SicherungError('Die Sicherung enthält keine Daten.');
  }
  if(parsed.version > EXPORT_VERSION){
    throw new SicherungError('Die Sicherung stammt aus einer neueren Fassung der App (Version ' + parsed.version + ').');
  }

  const beanstandet = [];
  const eintraege = [];
  for(const [k, v] of Object.entries(parsed.data)){
    const eintrag = EINTRAEGE[k];
    if(!eintrag){ beanstandet.push('„' + k + '" kennt diese Fassung der App nicht.'); continue; }
    if(typeof v !== 'string'){ beanstandet.push(eintrag.name + ': steht nicht als Text in der Datei.'); continue; }
    const fehler = eintrag.pruef(v);
    if(fehler){ beanstandet.push(eintrag.name + ': ' + fehler + '.'); continue; }
    eintraege.push([k, v]);
  }
  if(beanstandet.length){
    const kopf = beanstandet.slice(0, 12);
    if(beanstandet.length > kopf.length) kopf.push('… und ' + (beanstandet.length - kopf.length) + ' weitere Beanstandungen.');
    throw new SicherungError('Die Sicherung ist beschädigt – es wurde nichts geändert.', kopf);
  }
  if(!eintraege.length) throw new SicherungError('Die Sicherung enthielt keinen bekannten Eintrag.');

  const uebernommen = [];
  for(const [k, v] of eintraege){
    await store.set(k, v);
    uebernommen.push(k);
  }
  const drin = new Set(uebernommen);
  const geraeumt = [];
  for(const k of Object.values(KEYS)){
    if(drin.has(k)) continue;
    if((await store.get(k)) == null) continue;
    await store.remove(k);
    geraeumt.push(k);
  }
  return { uebernommen, geraeumt };
}
