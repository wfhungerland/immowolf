# Übergabe: immowolf ins GitHub-Repo

Dieses Paket ist fertig. Es muss nur noch auf GitHub liegen, dort veröffentlicht
und einmal eingerichtet werden. Alles geht im Browser, keine Kommandozeile nötig.

## Der Prompt für den neuen Chat

Kopiere den folgenden Absatz in einen neuen Chat und hänge die Dateien des Pakets an:

> Ich will das beiliegende Paket als GitHub-Repo „immowolf" veröffentlichen. Ich
> habe keine Erfahrung mit Git und arbeite nur im Browser. Führe mich Schritt für
> Schritt: Repo anlegen, Dateien hochladen, GitHub Pages einschalten, den
> monatlichen Lauf freigeben und einmal von Hand starten, die Bundesbank-Zeitreihe
> überprüfen und die fertige Adresse in meine Google Site einbetten. Sag mir vor
> jedem Schritt, was ich wo anklicke, und prüfe danach mit mir, ob es geklappt hat.
> Die Datei UEBERGABE.md im Paket beschreibt den Stand und die offenen Punkte.

## Was in dem Paket liegt

| Datei | Zweck |
|---|---|
| `index.html` | der ganze Rechner, läuft auch allein, ohne alles andere |
| `startwerte.json` | Startwerte und Herkunftstexte, die der Rechner beim Öffnen lädt |
| `aktualisieren.mjs` | holt Bauzins und Häuserpreisindex, schreibt sie in die JSON-Datei |
| `.github/workflows/startwerte.yml` | startet das Skript am 3. jedes Monats |
| `README.md` | kurze Beschreibung für das Repo |

## Die Schritte

1. **Repo anlegen.** Auf github.com oben rechts auf das Plus, „New repository",
   Name `immowolf`, Sichtbarkeit „Public" (nötig, damit GitHub Pages ohne
   Bezahlung funktioniert), kein Haken bei „Add a README file", dann „Create".

2. **Dateien hochladen.** Auf der leeren Repo-Seite „uploading an existing file"
   anklicken und die fünf Dateien hineinziehen. Wichtig: Der Ordner `.github`
   muss mitkommen; wenn das Hochladen ihn verschluckt, lege die Datei später über
   „Add file", „Create new file" mit dem Pfad
   `.github/workflows/startwerte.yml` an und füge den Inhalt ein. Unten „Commit
   changes".

3. **Seite veröffentlichen.** Im Repo auf „Settings", links „Pages", unter
   „Source" die Option „Deploy from a branch", Branch `main`, Ordner `/ (root)`,
   „Save". Nach ein paar Minuten steht dort die Adresse, etwa
   `https://<deinname>.github.io/immowolf/`.

4. **Monatlichen Lauf freigeben.** „Settings", links „Actions", „General", ganz
   unten unter „Workflow permissions" auf „Read and write permissions" stellen
   und speichern. Sonst darf der Lauf die Datei nicht zurückschreiben.

5. **Einmal von Hand starten.** Reiter „Actions", links „Startwerte nachführen",
   rechts „Run workflow". Danach das Protokoll öffnen und nachsehen, ob dort
   „Bauzins: … %" steht oder „nicht geholt". Im zweiten Fall weiter mit Schritt 6.

6. **Bundesbank-Zeitreihe prüfen.** Die im Skript eingetragene Reihe `SUD118`
   soll der Effektivzins für Wohnungsbaukredite an private Haushalte im
   Neugeschäft mit über zehn Jahren Zinsbindung sein. Öffne die Zeitreihensuche
   der Bundesbank, suche diese Reihe, vergleiche den aktuellen Wert mit dem, was
   das Protokoll ausgibt, und trage bei Abweichung den richtigen Schlüssel in
   `aktualisieren.mjs` ein, in der Zeile mit `ZINS_URL`.

7. **In die Google Site einbetten.** Seite bearbeiten, rechts „Einbetten",
   diesmal den Reiter „Per URL" statt „Code einbetten", die Pages-Adresse
   einfügen, einsetzen, den Kasten auf volle Breite und etwa 2.000 Pixel Höhe
   ziehen, veröffentlichen.

## Was weiterhin von Hand kommt

Einmal im Jahr, wenn die Quellen erscheinen:

- Preis je Quadratmeter und Angebotsmiete aus dem IBB Wohnungsmarktbericht,
  einzutragen in `startwerte.json` unter `werte.preisQm` und `werte.mieteQm`,
  samt der zugehörigen Sätze unter `herkunft`.
- Basiszins der Vorabpauschale aus dem Schreiben des Bundesfinanzministeriums,
  einzutragen unter `werte.basiszins`.

Beides geht auf github.com direkt im Browser: Datei öffnen, Stift anklicken,
ändern, „Commit changes".

## Stand der Technik im Paket

- Der Rechner lädt `startwerte.json` beim Öffnen. Scheitert der Abruf, etwa weil
  jemand die Datei einzeln öffnet, laufen die eingebauten Werte weiter; die Seite
  sagt das dann unter „So rechnet die Seite".
- Das Skript schreibt nur plausible Werte. Zins außerhalb von 0,5 bis 12 Prozent,
  abgebrochener Abruf, geänderte Schnittstelle: In all diesen Fällen bleibt der
  alte Wert stehen und das Protokoll nennt den Grund.
- Die Excel-Ausgabe des Rechners entsteht im Browser ohne fremde Bausteine, damit
  sie auch in einem eingebetteten Rahmen funktioniert.
- Geprüft ist der Rechner mit Eigenkapital über dem Kaufpreis, zu kleiner Rate,
  Anschlusszins bis 9 Prozent, kurzer Laufzeit, fallenden Preisen, Depotrendite
  null, Miete über den Wohnkosten und Inflation null.
