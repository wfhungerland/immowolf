# immowolf

Rechner zur Frage „Lohnt sich ein Immobilienkauf?". Eine Seite, kein Server,
keine fremden Bausteine: Die Seite rechnet im Browser, baut ihre Excel-Datei
selbst und lädt nichts aus dem Netz nach außer den eigenen Startwerten.

## Dateien

- `index.html` ist der ganze Rechner, Text, Rechenkern und Gestaltung in einer Datei.
- `startwerte.json` setzt die Startwerte und die Herkunftstexte darunter. Fehlt die
  Datei oder lässt sie sich nicht laden, laufen die im HTML eingebauten Werte weiter.
- `aktualisieren.mjs` holt die Zahlen, die sich laufend ändern, und schreibt sie in
  `startwerte.json`.
- `.github/workflows/startwerte.yml` startet das Skript am 3. jedes Monats.

## Was automatisch nachläuft

| Wert | Quelle | Weg |
|---|---|---|
| Bauzins | Deutsche Bundesbank, MFI-Zinsstatistik | automatisch, monatlich |
| Häuserpreisindex zum Vorjahr | Eurostat | automatisch, monatlich, nur zur Anzeige |
| Preis je Quadratmeter | IBB Wohnungsmarktbericht | von Hand, einmal im Jahr |
| Angebotsmiete je Quadratmeter | IBB Wohnungsmarktbericht | von Hand, einmal im Jahr |
| Basiszins der Vorabpauschale | Bundesfinanzministerium | von Hand, einmal im Jahr |

Das Skript schreibt nur, was es plausibel geholt hat. Ein Wert außerhalb des
Erwartbaren, ein Abbruch, eine geänderte Schnittstelle: In all diesen Fällen
bleibt der alte Wert stehen, und der Lauf meldet das im Protokoll.

## Von Hand prüfen

    node aktualisieren.mjs --probe

Holt die Zahlen und zeigt sie an, ohne etwas zu schreiben.

## Einbetten

Die Seite läuft über GitHub Pages unter einer eigenen Adresse. Auf einer Google
Site wird sie über „Einbetten" und „Per URL" eingefügt, nicht über das Code-Feld.
Der Kasten muss hoch genug gezogen werden, sonst scrollt die Seite in sich selbst.
