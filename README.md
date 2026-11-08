# Ascandir InteractiveMap

Interaktive Desktop-Karte für Windows: **Star Wars** als eingebaute Welt mit Fraktionen und ihren Einflussgebieten über die Jahrtausende. Dazu kannst du **eigene Welten** (Sci-Fi oder Fantasy) mit eigenen Zeitlinien, Fraktionen, Orten und Routen anlegen. Die App gibt es auf Deutsch und Englisch.

## Installation & Updates

1. Unter **Releases** die Datei `Ascandir-InteractiveMap-Setup-x.y.z.exe` herunterladen und ausführen.
   Windows SmartScreen meldet eventuell „unbekannter Herausgeber“. Klicke dann auf *Weitere Informationen* und *Trotzdem ausführen*, denn die App ist nicht signiert.
2. Alles, was die App braucht, wird in den gewählten Ordner installiert. Es muss nichts zusätzlich installiert werden.
3. **Updates:** Ab Version 0.2.0 sucht die App beim Start auf GitHub nach neuen Versionen (abschaltbar unter *Einstellungen*). Dann erscheint oben rechts ein Hinweis mit den Knöpfen *Herunterladen* und *Neu starten & installieren*.

Deine Daten liegen im Unterordner `data` des Installationsordners:

```
<Installationsordner>\data\worlds\      eigene Welten
<Installationsordner>\data\timelines\   Zeitlinien (alle Welten)
```

Bei Updates bleibt der Ordner erhalten. Bei einer **Deinstallation wird er gelöscht**. Sichere deshalb wichtige Zeitlinien vorher mit *Datei → Exportieren*.
Installiere nicht nach `C:\Programme`, sonst weicht die App auf `%APPDATA%` aus.

## Bedienung

| Aktion | Steuerung |
|---|---|
| Karte zoomen | Mausrad (bis 120-fach; ab einer gewissen Stufe „fliegst“ du in Systeme mit Sonnen und Monden hinein) |
| Karte verschieben | Ziehen mit linker, mittlerer oder rechter Maustaste |
| Jahr wählen | auf die Zeitleiste klicken oder darauf ziehen, Jahr eintippen (z. B. `22 VSY`, `3 NSY`, `-500`), ◀ ▶ oder Pfeiltasten (Umschalt = 10 Jahre), Mausrad auf dem Jahresfeld |
| Zeitleiste zoomen / verschieben | Mausrad auf der Zeitleiste / Umschalt + Mausrad, Doppelklick zeigt alles |
| Zeitalter springen | ⏮ ⏭ oder Bild↑ / Bild↓ |
| Vollbild | F11 |
| Rückgängig (Editor) | Strg+Z |

**Reiter oben rechts:**
- **Ansicht:** Filter für Objekte (Sonnen, Planeten, Monde, Stationen bzw. Hauptstädte, Städte, Dörfer, Festungen, Wahrzeichen), Einflussbereiche, Hyperraumrouten bzw. Routen, Regionen, Sektoren, Raster, Namen und einzelne Fraktionen
- **Editor:** Zeitalter, Fraktionen, Routen und Werkzeuge (Zuweisen, Region, Einfluss malen, Radieren, Objekt anlegen, Route zeichnen)
- **Einstellungen:** Sprache (Deutsch/English), Design (automatisch, Sci-Fi oder Fantasy), Updates, Einstellungen der aktuellen Welt (Name, Jahres-Kürzel wie „v. Z.“/„n. Z.“, Löschen), Datenordner

### Welten

- **Star Wars ★** ist eingebaut, mit über 230 Systemen, Sonnen, Monden, Stationen, 13 Hyperraumrouten, Sektoren, den Regionen von Tiefkern bis Unbekannte Regionen und 12 Zeitaltern von der Alten Republik (3653 VSY, Legends/SWTOR) bis zur Endgültigen Ordnung (35 NSY). Die Kanon-Zeitlinie ist schreibgeschützt; *Kopieren* erzeugt eine bearbeitbare Version.
- **＋ Welt** legt eine eigene Welt an:
  - **Sci-Fi:** Galaxie-Hintergrund mit Sonnen, Planeten, Monden und Stationen
  - **Fantasy:** Pergamentkarte mit Hauptstädten, Städten, Dörfern, Festungen und Wahrzeichen
- Das Design passt sich automatisch an den Welttyp an.

### Zeitalter und Jahre

Ein Zeitalter gilt ab seinem Startjahr bis zum Beginn des nächsten. Objekte können zusätzlich ein *existiert ab/bis* haben (z. B. der Todesstern von 19 VSY bis 0 NSY) und erscheinen dann nur in diesen Jahren. Im Editor legt *＋ Jahr* ein neues Zeitalter ab dem eingestellten Jahr an; es übernimmt den aktuellen Stand.

## Daten per JSON / GeoJSON bearbeiten

Welten und Zeitlinien sind lesbare JSON-Dateien im Datenordner (*Datei → Datenordner öffnen*). Wenn du sie im Texteditor änderst, lädt die App die Änderungen automatisch neu. *Datei → Als JSON bearbeiten* öffnet einen Editor direkt in der App.

```jsonc
// data/worlds/Meine_Welt.json
{ "id": "w123", "name": "Meine Welt", "type": "fantasy", "yearFmt": { "neg": "v. Z.", "pos": "n. Z." } }

// data/timelines/Meine_Zeitlinie.json
{
  "id": "tl123", "world": "starwars", "name": "Meine Zeitlinie",
  "factions": [ { "id": "rep", "name": "Galaktische Republik", "color": "#e2b13c", "reach": 140 } ],
  "objects": [
    // x nach rechts, y nach unten. Star Wars: Galaxiezentrum bei 1150/950. Fantasy-Karte: 0..2300 × 0..1700
    { "id": "tatoo1", "name": "Tatoo I", "type": "sun", "x": 1758, "y": 1529, "region": "outerrim", "sector": "Arkanis" },
    { "id": "tatooine", "name": "Tatooine", "type": "planet", "parent": "tatoo1", "desc": "…" },
    { "id": "ds", "name": "Todesstern", "type": "station", "x": 1500, "y": 420, "from": -19, "to": 0 }
  ],
  "routes": [ { "id": "r1", "name": "Corellianischer Lauf", "kind": "major", "points": ["coruscant", "corellia", "ryloth"] } ],
  "eras": [
    {
      "id": "e1", "name": "Klonkriege", "year": -22, "desc": "…",
      "control": { "tatooine": "hutt" },                          // Objekt-ID -> Fraktions-ID
      "regionClaims": { "core": "rep" },                           // nur Star Wars: ganze Regionen
      "zones": [ { "faction": "kus", "x": 1820, "y": 640, "r": 150 },
                 { "faction": "rep", "poly": [[1000,800],[1100,800],[1050,900]] } ]
    }
  ]
}
```

- `type`: Sci-Fi `sun`, `planet`, `moon`, `station`; Fantasy `capital`, `city`, `village`, `fortress`, `landmark`
- Star-Wars-Regionen: `deepcore`, `core`, `colonies`, `innerrim`, `expansion`, `midrim`, `outerrim`, `wildspace`, `unknown`, `huttspace`
- Zeitlinien aus Version 0.1 (deutsche Regionsnamen) werden automatisch übernommen.

**GeoJSON:** *Datei → Exportieren → GeoJSON* erzeugt eine `FeatureCollection`, die du in geojson.io oder QGIS bearbeiten kannst. Darin sind:
- Objekte als Punkte
- Routen als Linien
- Einflussgebiete als Polygone oder Kreise

Ein neues Polygon mit den Properties `kind: "zone"`, `eraName` und `factionName` wird beim Import als Einflussgebiet übernommen.

## Hinweise

- Positionen und Einflussgebiete der Star-Wars-Welt sind **Annäherungen** an das bekannte Galaxie-Raster.
- Inoffizielles Fanprojekt ohne Verbindung zu Lucasfilm oder Disney. Es enthält keine offiziellen Karten, Logos oder Grafiken.

## Für Entwickler

```bash
npm install
npm start          # App starten
npm run dist       # Windows-Installer nach dist/ bauen
```

**Neue Version veröffentlichen:** `version` in `package.json` erhöhen und auf `main` pushen. GitHub Actions baut den Installer und legt automatisch den Tag `vX.Y.Z` und ein Release an, inklusive `latest.yml` für den Updater.
