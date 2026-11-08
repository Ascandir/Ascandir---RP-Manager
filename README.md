# Ascandir – Star Wars Galaxiekarte

Interaktive Desktop-Karte der Star-Wars-Galaxis für Windows. Sie zeigt Fraktionen und ihre Einflussgebiete über die Zeitalter hinweg und lässt dich eigene Zeitlinien mit eigenen Fraktionen und Himmelskörpern anlegen.

## Installation

1. Unter **Releases** (rechts auf der GitHub-Seite) die Datei `Ascandir-Galaxiekarte-Setup-x.y.z.exe` herunterladen.
   Alternativ: **Actions → letzter Lauf → Artefakt „Ascandir-Galaxiekarte-Setup“**.
2. Ausführen und den Installationsordner wählen. Windows SmartScreen meldet eventuell „unbekannter Herausgeber“ → *Weitere Informationen → Trotzdem ausführen* (die App ist nicht signiert).
3. Alles, was die App braucht, wird in den gewählten Ordner installiert. Es muss nichts zusätzlich installiert werden.

Deine Daten liegen im Unterordner `data` des Installationsordners:

```
<Installationsordner>\data\timelines\Meine_Zeitlinie.json
```

Bei einem Update bleibt dieser Ordner erhalten. Bei einer **Deinstallation wird er gelöscht**. Sichere deine Zeitlinien vorher mit *Export*.
Tipp: Installiere nicht nach `C:\Programme`, sonst kann die App dort nicht schreiben und weicht auf `%APPDATA%` aus. Der Standardordner des Installers ist passend.

## Bedienung

| Aktion | Steuerung |
|---|---|
| Zoomen | Mausrad (bis 120-fach; ab einer gewissen Stufe „fliegst“ du in die Systeme mit Sonnen und Monden hinein) |
| Karte verschieben | Ziehen mit der linken, mittleren oder rechten Maustaste |
| Zeitalter wechseln | Regler unten, ◀ ▶ oder Pfeiltasten ← → |
| Vollbild | F11 |
| Rückgängig (Editor) | Strg+Z |

**Filter (links):** Sonnen, Planeten, Monde und Stationen ein- oder ausblenden, außerdem Einflussbereiche, Regionen, Raster und Namen. Jede Fraktion lässt sich einzeln ausblenden.

**Editor (oben rechts):** Die Kanon-Zeitlinie ist schreibgeschützt. Mit *Bearbeitbare Kopie anlegen* oder *＋ Neu* bekommst du eine eigene Zeitlinie. Darin kannst du:

- **Zeitalter** anlegen (übernimmt das aktuelle), umbenennen, datieren (negativ = VSY) und löschen
- **Fraktionen** mit Farbe und Einflussradius anlegen. Ein Klick auf eine Fraktion macht sie zur *aktiven Fraktion*.
- **Werkzeuge:**
  - *System zuweisen*: Ein Klick auf einen Planeten gibt ihn der aktiven Fraktion.
  - *Region zuweisen*: Ein Klick in eine Region (z. B. Äußerer Rand) gibt die ganze Region der Fraktion.
  - *Einfluss malen* und *Radieren*: Einflussgebiete frei pinseln
  - *Objekt anlegen*: neue Planeten, Sonnen, Monde und Stationen setzen (Monde hängen sich automatisch an einen nahen Planeten)
  - *Auswählen/Verschieben*: Objekte verschieben und rechts alle Eigenschaften bearbeiten, inklusive „existiert von/bis“

## Daten per JSON / GeoJSON bearbeiten

### JSON (vollständig)

Jede eigene Zeitlinie ist eine lesbare JSON-Datei in `data\timelines\`. Über **📂 Ordner** öffnest du sie im Explorer und kannst sie mit einem Texteditor (z. B. Notepad++ oder VS Code) bearbeiten. **Die App lädt gespeicherte Änderungen automatisch neu.** Dateien, die du in den Ordner kopierst, erscheinen ebenfalls sofort.

Alternativ öffnet **{ } JSON** einen Editor direkt in der App. Fehler werden vor dem Übernehmen angezeigt.

```jsonc
{
  "id": "tl123",
  "name": "Meine Zeitlinie",
  "factions": [
    { "id": "rep", "name": "Galaktische Republik", "color": "#e2b13c", "reach": 140 }
  ],
  "objects": [
    // x nach rechts, y nach unten; Galaxiezentrum bei x=1150, y=950; Rand ca. 1150 Einheiten
    { "id": "tatoo1", "name": "Tatoo I", "type": "sun", "x": 1758, "y": 1529, "region": "Äußerer Rand", "parent": null },
    { "id": "tatooine", "name": "Tatooine", "type": "planet", "parent": "tatoo1", "region": "Äußerer Rand", "desc": "…" },
    { "id": "ds", "name": "Todesstern", "type": "station", "x": 1500, "y": 420, "from": -19, "to": 0 }
  ],
  "eras": [
    {
      "id": "era1", "name": "Klonkriege", "year": -20, "desc": "…",
      "control": { "tatooine": "hutt", "geonosis": "kus" },        // Objekt-ID -> Fraktions-ID
      "regionClaims": { "Kern": "rep", "Kolonien": "rep" },        // ganze Regionen
      "zones": [
        { "faction": "kus", "x": 1820, "y": 640, "r": 150 },       // Kreis
        { "faction": "rep", "poly": [[1000,800],[1100,800],[1050,900]] } // Polygon
      ]
    }
  ]
}
```

- `type`: `sun`, `planet`, `moon`, `station`
- `parent`: Objekt, das umkreist wird (Planet → Sonne, Mond → Planet). Kinder brauchen kein x/y.
- `from` / `to`: Jahr, ab bzw. bis zu dem das Objekt existiert (`null` = immer)
- Regionen: Tiefkern, Kern, Kolonien, Innerer Rand, Expansionsregion, Mittlerer Rand, Äußerer Rand, Wilder Raum, Unbekannte Regionen, Huttenraum

### GeoJSON (für geojson.io, QGIS & Co.)

**Export → GeoJSON** erzeugt eine `FeatureCollection`:

- Himmelskörper sind `Point`-Features mit `properties.kind = "object"`.
- Gemalte Einflussgebiete sind `kind = "zone"`, entweder als `Polygon` oder als `Point` mit `radius`.
- Fraktionen, Zeitalter und System-Kontrolle stehen im Zusatzfeld `swgm`.

Koordinaten sind so skaliert, dass sie als Längen- und Breitengrade gültig sind: Zentrum = 0/0, Norden = oben, 1 Einheit = 15 Kartenpunkte. Du kannst die Datei z. B. in **geojson.io** öffnen, dort Polygone zeichnen und ihnen die Properties `kind: "zone"`, `eraName: "<Name des Zeitalters>"` und `factionName: "<Fraktion>"` geben. Anschließend importierst du sie mit **Import** wieder. Unbekannte Fraktionsnamen werden dabei automatisch als neue Fraktion angelegt (Farbe aus `fill`).

## Hinweise

- Positionen und Einflussgebiete der Kanon-Zeitlinie sind **Annäherungen** an das bekannte Galaxie-Raster und vereinfachen die Geschichte.
- Inoffizielles Fanprojekt ohne Verbindung zu Lucasfilm oder Disney. Es enthält keine offiziellen Karten, Logos oder Grafiken.

## Für Entwickler

```bash
npm install
npm start          # App starten
npm run dist       # Windows-Installer nach dist/ bauen
```

GitHub Actions baut bei jedem Push auf `main` einen Installer (als Artefakt). Bei einem Tag `v*` wird zusätzlich ein Release angelegt.
