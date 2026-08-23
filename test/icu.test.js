/* Die Form des latlng-Streams von intervals.icu liegt nicht fest: manche
   Konten liefern Paare, manche Objekte, manche Breite in data und Laenge in
   data2. Genau daran blieb die Karte leer, obwohl die Diagnose Messwerte
   zaehlte - deshalb steht jede bekannte Form hier als Fall. */

import { describe, it, expect } from 'vitest';
import { spurPunkte, spurForm } from '../src/data/icu.js';

const ZWEI = [[48.1, 11.5], [48.2, 11.6]];

describe('spurPunkte', () => {
  it('nimmt Paare, wie Strava sie liefert', () => {
    expect(spurPunkte([{ type: 'latlng', data: [[48.1, 11.5], [48.2, 11.6]] }])).toEqual(ZWEI);
  });

  it('nimmt Breite in data und Laenge in data2', () => {
    expect(spurPunkte([{ type: 'latlng', data: [48.1, 48.2], data2: [11.5, 11.6] }])).toEqual(ZWEI);
  });

  it('nimmt Objekte, egal ob lng, lon oder longitude', () => {
    expect(spurPunkte([{ type: 'latlng', data: [
      { lat: 48.1, lng: 11.5 }, { lat: 48.2, lon: 11.6 }
    ] }])).toEqual(ZWEI);
    expect(spurPunkte([{ type: 'latlng', data: [
      { latitude: 48.1, longitude: 11.5 }, { latitude: 48.2, longitude: 11.6 }
    ] }])).toEqual(ZWEI);
  });

  it('nimmt getrennte Stroeme', () => {
    expect(spurPunkte([
      { type: 'lat', data: [48.1, 48.2] }, { type: 'lng', data: [11.5, 11.6] }
    ])).toEqual(ZWEI);
  });

  it('laesst Aussetzer weg, statt an Punkt null zu zeichnen', () => {
    expect(spurPunkte([{ type: 'latlng', data: [
      [48.1, 11.5], null, [0, 0], ['x', 'y'], [999, 11], [48.2, 11.6]
    ] }])).toEqual(ZWEI);
  });

  it('bleibt leer, wenn kein Stream da ist', () => {
    expect(spurPunkte([{ type: 'heartrate', data: [120, 130] }])).toEqual([]);
    expect(spurPunkte(null)).toEqual([]);
  });
});

describe('spurForm', () => {
  it('nennt den ersten echten Wert, damit die Diagnose die Form zeigt', () => {
    expect(spurForm([{ type: 'latlng', data: [null, [48.1, 11.5]] }])).toContain('[48.1,11.5]');
    expect(spurForm([{ type: 'latlng', data: [48.1], data2: [11.5] }])).toContain('data2');
    expect(spurForm([{ type: 'heartrate', data: [] }])).toBe('kein latlng-Stream');
  });
});
