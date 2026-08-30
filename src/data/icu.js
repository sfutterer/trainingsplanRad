/* intervals.icu, direkt aus dem Browser mit dem Schluessel des Nutzers.
   Kein Backend dazwischen - der Schluessel verlaesst das Geraet nur Richtung
   intervals.icu. */

import { holen, ZEITGRENZE } from './netz.js';

export const ICU_BASE = 'https://intervals.icu/api/v1';

/* Nur die Felder, die der Abgleich braucht - die Activity hat 183. */
export const ICU_FIELDS = [
  'id','start_date_local','type','name','moving_time','elapsed_time',
  'distance','average_heartrate','max_heartrate','has_heartrate',
  'icu_training_load','icu_intensity','icu_recording_time',
  /* Fuer die Verlaufsansicht. Die vier kosten keinen zusaetzlichen Abruf, sie
     haengen an derselben Aktivitaetsliste - und ohne sie muesste die Analyse
     fuer jede Fahrt die Streams nachladen, nur um eine Kurve zu zeichnen.
     Fehlt eines der Felder im Konto, sagt die Ansicht das, statt eine leere
     Kurve wie fehlendes Training aussehen zu lassen. */
  'average_watts','icu_weighted_avg_watts','decoupling','icu_hr_zone_times'
].join(',');

function authHeader(key){
  return 'Basic ' + btoa('API_KEY:' + key);
}

export async function icuFetch(path, key){
  let res;
  try {
    res = await holen(ICU_BASE + path, {
      headers: { Authorization: authHeader(key), Accept: 'application/json' }
    }, ZEITGRENZE.icu, 'intervals.icu');
  } catch(e){
    if(/nicht geantwortet/.test(e.message)) throw e;
    throw new Error('Keine Verbindung zu intervals.icu. Offline oder Netz blockiert?');
  }
  if(res.status === 401 || res.status === 403){
    throw new Error('API-Key wurde abgelehnt (' + res.status + '). Stimmt der Key aus Settings → Developer Settings?');
  }
  if(res.status === 429){
    throw new Error('intervals.icu bremst gerade (429). Kurz warten und erneut versuchen.');
  }
  if(!res.ok) throw new Error('intervals.icu antwortete mit ' + res.status + '.');
  return res.json();
}

export function fetchActivities(key, fromIso, toIso){
  return icuFetch('/athlete/0/activities?oldest=' + fromIso + '&newest=' + toIso + '&fields=' + ICU_FIELDS, key);
}

export function fetchStreams(key, id, types){
  return icuFetch('/activity/' + id + '/streams.json?types=' + (types || 'heartrate,time'), key);
}

export function fetchWellness(key, fromIso, toIso){
  return icuFetch('/athlete/0/wellness?oldest=' + fromIso + '&newest=' + toIso, key);
}

/* Der einzige schreibende Aufruf der App.

   Gewicht am Testtag gehoert laut Trainingsplan in die Wellness - sonst sind
   die Testwerte spaeter nicht einzuordnen. Es zweimal von Hand zu pflegen, in
   der App und auf intervals.icu, geht genau so lange gut, bis man es einmal
   vergisst. PUT setzt nur die uebergebenen Felder, der Rest des Tages bleibt
   stehen. */
export async function putWellness(key, dayIso, felder){
  let res;
  try {
    res = await fetch(ICU_BASE + '/athlete/0/wellness/' + dayIso, {
      method: 'PUT',
      headers: { Authorization: authHeader(key), Accept: 'application/json',
                 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dayIso, ...felder })
    });
  } catch(e){
    throw new Error('Keine Verbindung zu intervals.icu. Offline oder Netz blockiert?');
  }
  if(res.status === 401 || res.status === 403){
    throw new Error('intervals.icu hat das Schreiben abgelehnt (' + res.status + '). Der Key braucht Schreibrechte.');
  }
  if(!res.ok) throw new Error('intervals.icu antwortete mit ' + res.status + '.');
  return res.json().catch(() => ({}));
}

/* Was das Konto in der Wellness tatsaechlich fuehrt.

   Dieselbe Frage wie bei den Streams, dieselbe Antwort: es steht in keiner
   Dokumentation, welche Felder die verknuepfte Uhr befuellt. Ruhepuls, HRV und
   Schlaf entscheiden ueber das Gate, Gewicht ueber den Abnehmhinweis - und ob
   intervals.icu zusaetzlich ctl, atl und rampRate mitliefert, sieht man erst
   hier. Kein Aktivitaets-Schluessel noetig, deshalb eigener Aufruf. */
export async function probeWellness(key, fromIso, toIso){
  const out = { tage: 0, felder: [], neueste: null, error: null };
  try {
    const rows = await fetchWellness(key, fromIso, toIso);
    const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
    out.tage = list.length;
    const zaehler = {};
    for(const r of list){
      for(const k of Object.keys(r)){
        if(r[k] === null || r[k] === undefined || r[k] === '') continue;
        zaehler[k] = (zaehler[k] || 0) + 1;
      }
    }
    out.felder = Object.keys(zaehler).sort()
      .map(k => k + ': ' + zaehler[k] + ' von ' + list.length + ' Tagen');
    const letzte = list[list.length - 1];
    if(letzte) out.neueste = letzte.id || null;
  } catch(e){ out.error = e.message; }
  return out;
}

/* Diagnose: welche Stroeme und Felder liefert dieses Konto tatsaechlich?
   Routen- und Wetterauswertung haengen daran, und das steht in keiner
   Dokumentation - es muss gemessen werden. */
export async function probeCapabilities(key, activityId){
  const out = { streams: {}, spur: null, spurForm: null, weatherFields: [], error: null };
  try {
    const s = await fetchStreams(key, activityId, 'latlng,altitude,watts,cadence,heartrate,time');
    for(const st of (s || [])){
      out.streams[st.type] = Array.isArray(st.data) ? st.data.length : 0;
    }
    /* Nicht nur, ob latlng ankommt, sondern ob daraus Punkte werden. Beides
       auseinanderzuhalten war genau die Luecke: Stream da, Karte leer. */
    out.spur = spurPunkte(s).length;
    out.spurForm = spurForm(s);
  } catch(e){ out.error = e.message; }
  try {
    const a = await icuFetch('/activity/' + activityId, key);
    out.weatherFields = Object.keys(a || {})
      .filter(k => /wind|temp|weather|humid|precip|gust|headwind|tailwind/i.test(k))
      .filter(k => a[k] !== null && a[k] !== undefined)
      .map(k => k + '=' + JSON.stringify(a[k]));
  } catch(e){ if(!out.error) out.error = e.message; }
  return out;
}

/* ---------- Spur aus den Streams ---------- */

/* intervals.icu liefert latlng nicht in einer Form, sondern je nach Quelle
   der Aufzeichnung in mehreren: als Paare [lat, lng], als Objekte mit lat/lng,
   oder aufgeteilt in data (Breite) und data2 (Laenge). Die Diagnose zaehlt nur
   data - deshalb sah der Stream dort schon nach Daten aus, wo die Karte leer
   blieb, weil ein einzelner Breitenwert kein Paar ist.

   Statt eine Form zu raten, werden alle erkannt und auf [lat, lng] gebracht:
   Leaflet und die Abschnittsauswertung rechnen mit Paaren.

   Die Rohfassung behaelt die Luecken als null. Nur so passen Hoehe und Zeit
   noch zum Punkt - die kommen als eigene Stroeme, Index fuer Index. */
function latlngRoh(streams){
  const list = Array.isArray(streams) ? streams : [];
  const hol = t => list.find(s => s && s.type === t);

  const ll = hol('latlng');
  if(ll && Array.isArray(ll.data)){
    if(Array.isArray(ll.data2)) return paare(ll.data, ll.data2);
    const punkte = ll.data.map(einPunkt);
    if(punkte.some(Boolean)) return punkte;
  }

  /* Getrennte Stroeme - je nach Konto unter verschiedenen Namen. */
  const lat = hol('lat') || hol('latitude');
  const lng = hol('lng') || hol('lon') || hol('longitude');
  if(lat && lng && Array.isArray(lat.data) && Array.isArray(lng.data)){
    return paare(lat.data, lng.data);
  }
  return [];
}

export function spurPunkte(streams){
  return latlngRoh(streams).filter(Boolean);
}

/* Die Spur mit allem, was die Abschnittsauswertung braucht: Punkt, Hoehe und
   die Sekunde seit dem Start. Fehlt ein Strom, bleibt das Feld null - die
   Auswertung laesst dann weg, was sie ohne ihn nicht sagen kann. */
export function spurMitHoehe(streams){
  const roh = latlngRoh(streams);
  const hoehe = zahlenStrom(streams, 'altitude');
  const zeit  = zahlenStrom(streams, 'time');
  const raus = [];
  for(let i = 0; i < roh.length; i++){
    if(!roh[i]) continue;
    raus.push({
      ll: roh[i],
      hoehe: hoehe && Number.isFinite(hoehe[i]) ? hoehe[i] : null,
      sek:   zeit  && Number.isFinite(zeit[i])  ? zeit[i]  : null
    });
  }
  return raus;
}

function zahlenStrom(streams, typ){
  const s = (Array.isArray(streams) ? streams : []).find(x => x && x.type === typ);
  return s && Array.isArray(s.data) ? s.data.map(v => (v == null ? NaN : Number(v))) : null;
}

function paare(lats, lngs){
  const out = [];
  const n = Math.max(lats.length, lngs.length);
  for(let i = 0; i < n; i++) out.push(gueltig(lats[i], lngs[i]));
  return out;
}

function einPunkt(p){
  if(Array.isArray(p) && p.length >= 2) return gueltig(p[0], p[1]);
  if(p && typeof p === 'object'){
    const lat = p.lat !== undefined ? p.lat : p.latitude;
    const lng = p.lng !== undefined ? p.lng
              : p.lon !== undefined ? p.lon
              : p.long !== undefined ? p.long : p.longitude;
    return gueltig(lat, lng);
  }
  if(typeof p === 'string' && p.indexOf(',') > 0){
    const teile = p.split(',');
    return gueltig(parseFloat(teile[0]), parseFloat(teile[1]));
  }
  return null;
}

/* Nur echte Koordinaten. Aussetzer der Aufzeichnung kommen als null oder als
   0/0 zurueck - Punkt null im Atlantik verzieht sonst die ganze Karte. */
function gueltig(lat, lng){
  const a = Number(lat), b = Number(lng);
  if(!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if(Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  if(a === 0 && b === 0) return null;
  return [a, b];
}

/* Wie der latlng-Stream tatsaechlich aussieht, in einer Zeile. Ohne das bleibt
   bei einer leeren Karte offen, ob die Daten fehlen oder nur anders liegen. */
export function spurForm(streams){
  const ll = (Array.isArray(streams) ? streams : []).find(s => s && s.type === 'latlng');
  if(!ll) return 'kein latlng-Stream';
  if(!Array.isArray(ll.data)) return 'latlng ohne data-Feld';
  const erster = ll.data.find(p => p !== null && p !== undefined);
  return 'erster Wert ' + JSON.stringify(erster) +
         (Array.isArray(ll.data2) ? ', Laenge in data2 (' + ll.data2.length + ')' : '');
}
