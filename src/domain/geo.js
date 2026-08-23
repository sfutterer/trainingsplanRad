/* Geometrie auf der Kugel: Abstand, Kurs, Windanteil.

   Lag vorher in data/wetter.js, weil nur die Windbilanz es brauchte. Jetzt
   rechnet auch die Abschnittsauswertung damit, und die ist Domaene - sie darf
   nicht an einem Modul haengen, das Netzabrufe macht. */

const R = 6371000, RAD = Math.PI / 180;

export function abstand(a, b){
  const dLat = (b[0] - a[0]) * RAD, dLon = (b[1] - a[1]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/* Kurs zwischen zwei Punkten in Grad, 0 = Norden. */
export function peilung(a, b){
  const y = Math.sin((b[1] - a[1]) * RAD) * Math.cos(b[0] * RAD);
  const x = Math.cos(a[0] * RAD) * Math.sin(b[0] * RAD)
          - Math.sin(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.cos((b[1] - a[1]) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/* Windrichtung wird als Richtung angegeben, AUS der es weht. Gegenwind heisst
   also: der Kurs zeigt dorthin, wo der Wind herkommt. */
export function windAnteil(kurs, windAus){
  const diff = ((windAus - kurs + 540) % 360) - 180;   // -180..180
  return Math.cos(diff * RAD);                         // 1 = voll gegen, -1 = Ruecken
}

/* Abstand eines Punktes zu einer Strecke a-b, in Metern.

   Ueber eine ebene Naeherung: auf den paar hundert Metern, um die es beim
   Zuordnen eines Weges geht, ist die Kruemmung der Erde kleiner als die
   Genauigkeit des GPS. */
export function abstandZuStrecke(p, a, b){
  const mLat = 111320, mLon = 111320 * Math.cos(p[0] * RAD);
  const px = (p[1] - a[1]) * mLon, py = (p[0] - a[0]) * mLat;
  const bx = (b[1] - a[1]) * mLon, by = (b[0] - a[0]) * mLat;
  const laenge = bx * bx + by * by;
  if(!laenge) return Math.sqrt(px * px + py * py);
  let t = (px * bx + py * by) / laenge;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - t * bx, dy = py - t * by;
  return Math.sqrt(dx * dx + dy * dy);
}

/* Umschliessendes Rechteck einer Punktfolge, in Grad. */
export function rechteck(punkte){
  let latMin = 90, latMax = -90, lonMin = 180, lonMax = -180;
  for(const p of punkte){
    if(p[0] < latMin) latMin = p[0];
    if(p[0] > latMax) latMax = p[0];
    if(p[1] < lonMin) lonMin = p[1];
    if(p[1] > lonMax) lonMax = p[1];
  }
  return { latMin, latMax, lonMin, lonMax };
}
