/* Abschnitte, Bilanz und Fazit.

   Die Zahlen hier sind gerechnet, nicht gemessen: eine Spur nach Norden mit
   bekannter Steigung und bekanntem Wind. Genau deshalb taugt sie zum Testen -
   bei echten Daten liesse sich nicht sagen, ob 9 % Steigung stimmen. */

import { describe, it, expect } from 'vitest';
import { abstand, peilung, windAnteil, abstandZuStrecke } from '../src/domain/geo.js';
import { baueAbschnitte, streckenBilanz, zeichenGruppen, klassifiziere,
         wegKlasse, untergrundAn, setzeUntergrund, markiereDoppelt,
         SCHWELLEN } from '../src/domain/strecke.js';
import { streckenFazit, umfeldLast } from '../src/domain/fazit.js';
import { stuetzpunkte, overpassAbfrage, wegeAus,
         untergrundCode, untergrundAusCode } from '../src/data/osm.js';
import { holen, ZEITGRENZE } from '../src/data/netz.js';

/* Spur nach Norden, 20 m je Punkt, 5 s je Punkt (14,4 km/h). */
function spurNord(n, steigungProzent){
  const p = [];
  for(let i = 0; i < n; i++){
    p.push({ ll: [48.1 + i * 0.00018, 11.5], hoehe: 500 + i * 20 * (steigungProzent || 0) / 100, sek: i * 5 });
  }
  return p;
}

describe('Geometrie', () => {
  it('rechnet Abstand und Kurs', () => {
    expect(Math.round(abstand([48.1, 11.5], [48.1009, 11.5]))).toBe(100);
    expect(Math.round(peilung([48.1, 11.5], [48.2, 11.5]))).toBe(0);
    expect(Math.round(peilung([48.1, 11.5], [48.1, 11.6]))).toBe(90);
  });

  it('nennt Gegenwind positiv und Rueckenwind negativ', () => {
    expect(windAnteil(0, 0)).toBeCloseTo(1);     // Kurs Nord, Wind aus Nord
    expect(windAnteil(0, 180)).toBeCloseTo(-1);  // Kurs Nord, Wind aus Sued
    expect(windAnteil(0, 90)).toBeCloseTo(0);
  });

  it('misst den Abstand zu einer Strecke, nicht zu ihren Enden', () => {
    expect(Math.round(abstandZuStrecke([48.1005, 11.5], [48.1, 11.49], [48.1, 11.51]))).toBe(56);
    expect(Math.round(abstandZuStrecke([48.1, 11.52], [48.1, 11.49], [48.1, 11.51]))).toBe(743);
  });
});

describe('Abschnitte', () => {
  it('schneidet in Stuecke von mindestens 150 m', () => {
    const a = baueAbschnitte(spurNord(100, 0), {});
    expect(a.length).toBeGreaterThan(5);
    /* Nur der Rest am Ende darf kuerzer sein - und auch der nur, wenn er noch
       lang genug fuer eine Aussage ist. */
    for(const s of a.slice(0, -1)) expect(s.meter).toBeGreaterThanOrEqual(150);
    expect(a[a.length - 1].meter).toBeGreaterThanOrEqual(150 * 0.4);
  });

  it('rechnet Steigung und Tempo aus Hoehe und Zeit', () => {
    const a = baueAbschnitte(spurNord(60, 8), {})[0];
    expect(a.steigung).toBeCloseTo(8, 0);
    expect(a.tempoKmh).toBeCloseTo(14.4, 0);
    expect(a.klasse).toBe('berg-stark');
  });

  it('nimmt den Wind der Stunde, in der der Abschnitt lag', () => {
    const wind = sek => (sek < 100 ? { aus: 0, kmh: 30 } : { aus: 180, kmh: 30 });
    const a = baueAbschnitte(spurNord(60, 0), { wind });
    expect(a[0].gegenKmh).toBeCloseTo(30, 0);
    expect(a[0].klasse).toBe('wind-stark');
    expect(a[a.length - 1].gegenKmh).toBeCloseTo(-30, 0);
    expect(a[a.length - 1].klasse).toBe('frei');
  });

  it('haelt Rauschen im Hoehenstream aus dem Berg heraus', () => {
    const p = spurNord(40, 0);
    p[10].hoehe = 900;   // 400 m Sprung auf 20 m Strecke
    const a = baueAbschnitte(p, {});
    for(const s of a) expect(Math.abs(s.steigung)).toBeLessThanOrEqual(SCHWELLEN.steigungMax);
  });

  it('laesst den Wind im Stand weg', () => {
    const p = spurNord(40, 0).map((x, i) => ({ ...x, sek: i * 60 }));  // 1,2 km/h
    const a = baueAbschnitte(p, { wind: () => ({ aus: 0, kmh: 40 }) });
    expect(a[0].windAnteil).toBe(null);
    expect(a[0].klasse).toBe('frei');
  });
});

describe('Klassen', () => {
  it('gibt dem die Farbe, was mehr Watt kostet', () => {
    /* Steile Rampe bei maessigem Gegenwind: die Rampe gewinnt. */
    expect(klassifiziere({ steigung: 9, gegenKmh: 9, tempoKmh: 12 })).toBe('berg-stark');
    /* Leichte Welle bei Sturm auf die Nase: der Wind gewinnt. */
    expect(klassifiziere({ steigung: 3.2, gegenKmh: 25, tempoKmh: 28 })).toBe('wind-stark');
  });

  it('faerbt unbefestigt nur, wenn sonst nichts bremst', () => {
    expect(klassifiziere({ steigung: 0, gegenKmh: 0, untergrund: 'unbefestigt' })).toBe('weg');
    expect(klassifiziere({ steigung: 8, gegenKmh: 0, untergrund: 'unbefestigt', tempoKmh: 12 })).toBe('berg-stark');
  });

  it('nennt eine ruhige Strecke frei', () => {
    expect(klassifiziere({ steigung: 1, gegenKmh: 4, untergrund: 'fest' })).toBe('frei');
  });
});

describe('Bilanz', () => {
  const abschnitte = baueAbschnitte(spurNord(100, 4), { wind: () => ({ aus: 0, kmh: 20 }) });
  const b = streckenBilanz(abschnitte);

  it('summiert Strecke, Hoehe und Windlage', () => {
    expect(b.km).toBeCloseTo(1.98, 1);
    expect(Math.round(b.hoch)).toBeGreaterThan(70);
    expect(b.runter).toBe(0);
    expect(b.gegenProzent).toBe(100);
    expect(Math.round(b.gegenSchnitt)).toBe(20);
  });

  it('fasst gleiche Abschnitte zu einer Linie zusammen', () => {
    expect(zeichenGruppen(abschnitte).length).toBe(1);
    expect(zeichenGruppen(abschnitte)[0].ll.length).toBe(100);
  });

  it('trennt Gruppen, wenn der Untergrund wechselt', () => {
    const wechsel = abschnitte.map((a, i) => ({ ...a, untergrund: i < 5 ? 'unbefestigt' : 'fest' }));
    expect(zeichenGruppen(wechsel).length).toBe(2);
  });
});

describe('Untergrund aus OSM', () => {
  it('liest surface, tracktype und die Art des Weges', () => {
    expect(wegKlasse({ surface: 'gravel' })).toBe('unbefestigt');
    expect(wegKlasse({ surface: 'asphalt' })).toBe('fest');
    expect(wegKlasse({ surface: 'grass_paver' })).toBe('fest');
    expect(wegKlasse({ highway: 'track' })).toBe('unbefestigt');
    expect(wegKlasse({ highway: 'residential' })).toBe(null);
  });

  it('ordnet nur zu, was nah genug liegt', () => {
    const wege = [{ geom: [[48.1, 11.4999], [48.1, 11.5001]], tags: { surface: 'gravel' } }];
    expect(untergrundAn([48.1, 11.5], wege)).toBe('unbefestigt');
    expect(untergrundAn([48.2, 11.5], wege)).toBe(null);
  });

  it('duennt die Stuetzpunkte der Overpass-Abfrage aus', () => {
    const p = [];
    for(let i = 0; i < 3000; i++) p.push([48.1 + i * 0.00005, 11.5]);
    const st = stuetzpunkte(p);
    expect(st.length).toBeLessThanOrEqual(151);
    expect(overpassAbfrage(st)).toContain('["highway"]["surface"]');
  });

  it('nimmt aus der Antwort nur Wege mit Geometrie', () => {
    expect(wegeAus({ elements: [
      { type: 'way', id: 1, tags: {}, geometry: [{ lat: 1, lon: 2 }, { lat: 1.1, lon: 2.1 }] },
      { type: 'way', id: 2, tags: {}, geometry: [{ lat: 1, lon: 2 }] },
      { type: 'node', id: 3 }
    ] }).length).toBe(1);
  });
});

describe('Fazit', () => {
  const schwer = { km: 42, windMeter: 42000, gegenProzent: 58, rueckProzent: 22, querProzent: 20,
    gegenSchnitt: 14, staerksterGegenwind: 24, hoch: 380, hmProKm: 9, bergProzent: 28,
    steilster: 9.2, wegProzent: 31, wegMeter: 13000, untergrundBekannt: true, klassen: {} };
  const leicht = { km: 30, windMeter: 30000, gegenProzent: 20, rueckProzent: 30, querProzent: 50,
    gegenSchnitt: 2, staerksterGegenwind: 8, hoch: 120, hmProKm: 4, bergProzent: 5,
    steilster: 3.5, wegProzent: 5, wegMeter: 1500, untergrundBekannt: true, klassen: {} };
  const warm = { temp: 28, gefuehlt: 30, regen: 0, boe: 38 };
  const mild = { temp: 18, gefuehlt: 17, regen: 0, boe: 20 };

  it('erklaert eine zu harte Fahrt, wenn die Bedingungen es tragen', () => {
    const f = streckenFazit({ badge: 'zu hart', status: 'dev', target: { zone: 'z2' },
      zones: { _total: 5000 }, notes: [{ kind: 'bad', text: '34 % der Zeit über Z2.' }] }, schwer, warm);
    expect(f.urteil).toBe('erklaert');
    expect(f.massnahmen.length).toBeGreaterThan(0);
    expect(f.gruende.some(g => g.art === 'wind')).toBe(true);
  });

  it('erklaert sie nicht, wenn es ruhig und flach war', () => {
    const f = streckenFazit({ badge: 'zu hart', status: 'dev', target: { zone: 'z2' },
      zones: { _total: 5000 }, notes: [{ kind: 'bad', text: '34 % der Zeit über Z2.' }] }, leicht, mild);
    expect(f.urteil).toBe('abweichung');
  });

  it('bleibt bei passt, wenn nichts abweicht', () => {
    const f = streckenFazit({ badge: 'erfüllt', status: 'ok', target: { zone: 'z2' },
      zones: { _total: 5000 }, notes: [{ kind: 'good', text: '71 % in Z2. Passt.' }] }, leicht, mild);
    expect(f.urteil).toBe('passt');
    expect(f.massnahmen).toEqual([]);
  });

  it('haengt an eine kuerzere Fahrt die Wochensumme als Massnahme', () => {
    const f = streckenFazit({ badge: 'kürzer', status: 'dev', target: { zone: 'z2' },
      zones: { _total: 5000 }, notes: [{ kind: 'bad', text: '22 % kürzer als geplant.' }] }, leicht,
      { temp: 6, gefuehlt: 3, regen: 3, boe: 30 });
    expect(f.urteil).toBe('erklaert');
    expect(f.massnahmen[0]).toContain('Woche');
  });

  it('zaehlt die Last aus Wind, Hoehe, Untergrund und Waerme', () => {
    expect(umfeldLast(schwer, warm).punkte).toBeGreaterThanOrEqual(5);
    expect(umfeldLast(leicht, mild).punkte).toBe(0);
  });

  it('kommt ohne Strecke und Wetter aus', () => {
    const f = streckenFazit({ badge: 'erfüllt', status: 'ok', notes: [] }, null, null);
    expect(f.urteil).toBe('offen');
    expect(f.gruende).toEqual([]);
  });
});

describe('Zeitgrenzen', () => {
  it('bricht ab, wenn niemand antwortet, und sagt welcher Dienst', async () => {
    const alt = globalThis.fetch;
    globalThis.fetch = (url, opts) => new Promise((_, ab) => {
      opts.signal.addEventListener('abort', () => {
        const e = new Error('aborted'); e.name = 'AbortError'; ab(e);
      });
    });
    try {
      await expect(holen('https://beispiel.test', null, 30, 'Overpass'))
        .rejects.toThrow(/Overpass hat nach 0 s nicht geantwortet/);
    } finally { globalThis.fetch = alt; }
  });

  it('gibt eine Antwort innerhalb der Grenze unveraendert zurueck', async () => {
    const alt = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    try {
      expect((await holen('https://beispiel.test', null, 500, 'Test')).status).toBe(200);
    } finally { globalThis.fetch = alt; }
  });

  it('setzt fuer jeden Dienst eine Grenze', () => {
    for(const k of ['icu', 'wetter', 'osm']){
      expect(ZEITGRENZE[k]).toBeGreaterThan(0);
      expect(ZEITGRENZE[k]).toBeLessThanOrEqual(30000);
    }
  });
});

describe('Zwischenspeicher Untergrund', () => {
  it('schreibt und liest den Untergrund je Abschnitt', () => {
    const a = baueAbschnitte(spurNord(60, 0), {});
    const mit = setzeUntergrund(a, (ll, i) => (i % 2 ? 'unbefestigt' : 'fest'));
    const code = untergrundCode(mit);
    expect(code).toMatch(/^[uf-]+$/);
    expect(code.length).toBe(a.length);
    const zurueck = setzeUntergrund(a, untergrundAusCode(code));
    expect(zurueck.map(x => x.klasse)).toEqual(mit.map(x => x.klasse));
  });

  it('faerbt nach, ohne die Karte neu zu bauen', () => {
    const a = baueAbschnitte(spurNord(60, 0), {});
    expect(a.every(x => x.klasse === 'frei')).toBe(true);
    const mit = setzeUntergrund(a, () => 'unbefestigt');
    expect(mit.every(x => x.klasse === 'weg')).toBe(true);
    expect(streckenBilanz(mit).wegProzent).toBe(100);
  });
});

describe('Doppelt gefahrene Abschnitte', () => {
  /* Hin und zurueck auf derselben Linie - der Intervallfall. */
  function hinUndZurueck(n){
    const hin = spurNord(n, 0);
    const rueck = hin.slice().reverse()
      .map((p, i) => ({ ll: p.ll, hoehe: p.hoehe, sek: n * 5 + i * 5 }));
    return hin.concat(rueck);
  }

  it('erkennt Hin- und Rueckweg als dieselbe Strecke', () => {
    const a = markiereDoppelt(baueAbschnitte(hinUndZurueck(120), {}));
    expect(a.length).toBeGreaterThan(4);
    expect(a.every(x => x.doppelt)).toBe(true);
    /* Gegenrichtung braucht keinen Versatz: jede Spur weicht nach rechts der
       eigenen Fahrtrichtung aus, und das sind zwei verschiedene Seiten. */
    expect(a.every(x => x.versatz === 0)).toBe(true);
  });

  it('staffelt eine zweimal in derselben Richtung gefahrene Runde', () => {
    const runde = [];
    for(let r = 0; r < 2; r++){
      for(let i = 0; i < 120; i++){
        const t = i / 120 * 2 * Math.PI;
        runde.push({ ll: [48.1 + 0.01 * Math.sin(t), 11.5 + 0.014 * Math.cos(t)],
                     hoehe: 500, sek: (r * 120 + i) * 6 });
      }
    }
    const a = markiereDoppelt(baueAbschnitte(runde, {}));
    expect(a.some(x => x.versatz === 1)).toBe(true);
    expect(a.every(x => x.versatz <= 1)).toBe(true);
  });

  it('laesst eine einfache Strecke unangetastet', () => {
    const a = markiereDoppelt(baueAbschnitte(spurNord(150, 2), {}));
    expect(a.some(x => x.doppelt)).toBe(false);
    expect(streckenBilanz(a).doppeltMeter).toBe(0);
  });

  it('haelt eine Kreuzung nicht fuer eine doppelte Strecke', () => {
    /* Nach Norden, dann rechtwinklig nach Osten quer darueber. */
    const p = [];
    for(let i = 0; i < 100; i++) p.push({ ll: [48.1 + i * 0.00018, 11.5], hoehe: 500, sek: i * 5 });
    for(let i = 0; i < 100; i++) p.push({ ll: [48.109, 11.494 + i * 0.00018], hoehe: 500, sek: 500 + i * 5 });
    const a = markiereDoppelt(baueAbschnitte(p, {}));
    expect(a.filter(x => x.doppelt).length).toBe(0);
  });

  it('trennt die Zeichengruppen nach Spur', () => {
    const a = markiereDoppelt(baueAbschnitte(hinUndZurueck(120), {}));
    const gemischt = a.map((x, i) => Object.assign({}, x, { versatz: i < 3 ? 1 : 0 }));
    const g = zeichenGruppen(gemischt);
    expect(g.length).toBe(2);
    expect(g[0].versatz).toBe(1);
    expect(g[0].doppelt).toBe(true);
  });

  it('zaehlt die doppelt gefahrene Strecke in der Bilanz', () => {
    const a = markiereDoppelt(baueAbschnitte(hinUndZurueck(120), {}));
    const b = streckenBilanz(a);
    expect(b.doppeltMeter).toBeCloseTo(b.meter, 0);
  });
});
