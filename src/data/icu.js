/* intervals.icu, direkt aus dem Browser mit dem Schluessel des Nutzers.
   Kein Backend dazwischen - der Schluessel verlaesst das Geraet nur Richtung
   intervals.icu. */

export const ICU_BASE = 'https://intervals.icu/api/v1';

/* Nur die Felder, die der Abgleich braucht - die Activity hat 183. */
export const ICU_FIELDS = [
  'id','start_date_local','type','name','moving_time','elapsed_time',
  'distance','average_heartrate','max_heartrate','has_heartrate',
  'icu_training_load','icu_intensity','icu_recording_time'
].join(',');

function authHeader(key){
  return 'Basic ' + btoa('API_KEY:' + key);
}

export async function icuFetch(path, key){
  let res;
  try {
    res = await fetch(ICU_BASE + path, {
      headers: { Authorization: authHeader(key), Accept: 'application/json' }
    });
  } catch(e){
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

/* Diagnose: welche Stroeme und Felder liefert dieses Konto tatsaechlich?
   Routen- und Wetterauswertung haengen daran, und das steht in keiner
   Dokumentation - es muss gemessen werden. */
export async function probeCapabilities(key, activityId){
  const out = { streams: {}, weatherFields: [], error: null };
  try {
    const s = await fetchStreams(key, activityId, 'latlng,altitude,watts,cadence,heartrate,time');
    for(const st of (s || [])){
      out.streams[st.type] = Array.isArray(st.data) ? st.data.length : 0;
    }
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
