/*
  immowolf: Startwerte nachführen.

  Holt die Zahlen, die sich am laufenden Rand ändern, und schreibt sie nach
  startwerte.json. Alles, was nicht geholt werden kann, bleibt unverändert
  stehen. Das Skript schreibt nur, wenn mindestens ein Wert plausibel ankam.

  Aufruf:
    node aktualisieren.mjs          holt und schreibt
    node aktualisieren.mjs --probe  holt und zeigt nur an, schreibt nichts

  Braucht Node 20 oder neuer, weil fetch eingebaut ist. Keine Pakete nötig.
*/

import { readFile, writeFile } from "node:fs/promises";

const DATEI = new URL("./startwerte.json", import.meta.url);
const NUR_ZEIGEN = process.argv.includes("--probe");

/* ------------------------------------------------------------------ Quellen */

/* Bauzins: Effektivzins der deutschen Banken für Wohnungsbaukredite an private
   Haushalte, Neugeschäft, anfängliche Zinsbindung über zehn Jahre.
   Reihe SUD119, in der Schnittstelle BBIM1.M.DE.B.A2C.P.R.A.2250.EUR.N.
   Achtung: SUD118 ist die Reihe für fünf bis zehn Jahre. */
const ZINS_URL =
  "https://api.statistiken.bundesbank.de/rest/download/BBIM1/M.DE.B.A2C.P.R.A.2250.EUR.N?format=csv&lang=de";

/* Häuserpreisindex Deutschland, Veränderung zum Vorjahr, aus der frei
   zugänglichen Eurostat-Schnittstelle. Nur zur Anzeige im Text, nicht als
   Startwert für die Wertsteigerung: Vergangenheit ist keine Annahme. */
const HPI_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hpi_q" +
  "?format=JSON&lang=DE&geo=DE&unit=RCH_A&purchase=TOTAL&lastTimePeriod=1";

/* ------------------------------------------------------------------ Helfer */

const log = (...t) => console.log(...t);

async function holen(url, wie = "text") {
  const antwort = await fetch(url, { headers: { "user-agent": "immowolf" } });
  if (!antwort.ok) throw new Error("Abruf fehlgeschlagen, Status " + antwort.status);
  return wie === "json" ? antwort.json() : antwort.text();
}

/* Letzte belegte Zeile einer Bundesbank-CSV: Datum und Zahl. */
function letzterCsvWert(csv) {
  const zeilen = csv.split(/\r?\n/).filter(z => z.trim() !== "");
  for (let i = zeilen.length - 1; i >= 0; i--) {
    /* Die deutsche CSV trennt mit Semikolon und schreibt das Komma als
       Dezimalzeichen. Nur wenn kein Semikolon vorkommt, ist das Komma Trenner. */
    const trenner = zeilen[i].includes(";") ? ";" : ",";
    const teile = zeilen[i].split(trenner).map(t => t.trim().replace(/^"|"$/g, ""));
    if (teile.length < 2) continue;
    const datum = teile[0];
    const roh = trenner === ";" ? teile[1].replace(/\./g, "").replace(",", ".") : teile[1];
    const wert = Number.parseFloat(roh);
    if (/^\d{4}(-\d{2})?/.test(datum) && Number.isFinite(wert)) return { datum, wert };
  }
  throw new Error("keine auswertbare Zeile gefunden");
}

/* Eurostat liefert JSON-stat: ein Wert, ein Zeitstempel. */
function letzterEurostatWert(daten) {
  const werte = daten?.value ?? {};
  const schluessel = Object.keys(werte);
  if (!schluessel.length) throw new Error("keine Werte enthalten");
  const wert = Number(werte[schluessel[schluessel.length - 1]]);
  const zeit = daten?.dimension?.time?.category?.label ?? {};
  const perioden = Object.values(zeit);
  return { datum: perioden[perioden.length - 1] ?? "", wert };
}

let fehlgeschlagen = 0;
const plausibel = (wert, min, max) => Number.isFinite(wert) && wert >= min && wert <= max;
const deutsch = x => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ------------------------------------------------------------------ Ablauf */

const datei = JSON.parse(await readFile(DATEI, "utf8"));
let geaendert = false;

/* 1. Bauzins */
try {
  const { datum, wert } = letzterCsvWert(await holen(ZINS_URL));
  if (!plausibel(wert, 0.5, 12)) throw new Error("Wert außerhalb des Erwartbaren: " + wert);
  const gerundet = Math.round(wert * 10) / 10;
  log(`Bauzins: ${deutsch(gerundet)} % (Stand ${datum})`);
  if (gerundet !== datei.werte.zins) {
    datei.werte.zins = gerundet;
    datei.werte.zins2 = gerundet;
    datei.herkunft.zins =
      `Startwert ${deutsch(gerundet)} %: Durchschnitt der deutschen Banken für Wohnungsbaukredite ` +
      `mit über zehn Jahren Zinsbindung, MFI-Zinsstatistik der Deutschen Bundesbank, Stand ${datum.replace(/^(\d{4})-(\d{2}).*/, "$2.$1")}.`;
    datei.herkunft.zins2 =
      `Startwert ${deutsch(gerundet)} %: wie der erste Zins, der Rechner unterstellt also von sich aus keine Wende.`;
    const q = datei.quellen.find(q => q.feld === "zins");
    if (q) q.stand = datum;
    geaendert = true;
  }
} catch (fehler) {
  log("Bauzins nicht geholt, alter Wert bleibt stehen:", fehler.message);
  fehlgeschlagen++;
}

/* 2. Häuserpreisindex, nur zur Beobachtung */
try {
  const { datum, wert } = letzterEurostatWert(await holen(HPI_URL, "json"));
  if (!plausibel(wert, -30, 30)) throw new Error("Wert außerhalb des Erwartbaren: " + wert);
  const gerundet = Math.round(wert * 10) / 10;
  log(`Häuserpreisindex: ${deutsch(gerundet)} % zum Vorjahr (Stand ${datum})`);
  const b = datei.beobachtet?.hpiJahresrate;
  if (b && (b.wert !== gerundet || b.stand !== datum)) {
    b.wert = gerundet;
    b.stand = datum;
    geaendert = true;
  }
} catch (fehler) {
  log("Häuserpreisindex nicht geholt, alter Wert bleibt stehen:", fehler.message);
  fehlgeschlagen++;
}

/* 3. Schreiben */
const heute = new Date().toISOString().slice(0, 10);
if (NUR_ZEIGEN) {
  log("\nProbelauf, nichts geschrieben.");
  process.exit(fehlgeschlagen ? 1 : 0);
}
if (!geaendert) {
  log("Keine Änderung an den Zahlen. Nur das Prüfdatum wird gesetzt.");
}
datei.stand = heute;
await writeFile(DATEI, JSON.stringify(datei, null, 2) + "\n", "utf8");
log("startwerte.json geschrieben, Stand " + heute + ".");

/* Ein gescheiterter Abruf lässt den Lauf rot enden. GitHub schickt dann eine
   Mail, und der Schritt danach schreibt nichts fest. */
if (fehlgeschlagen) {
  log(`${fehlgeschlagen} Abruf(e) gescheitert, Lauf endet mit Fehler.`);
  process.exitCode = 1;
}
