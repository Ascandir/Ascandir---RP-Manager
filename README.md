# Ascandir RP-Manager

Werkzeug für Rollenspiel-Runden (früher „InteractiveMap“): eine **interaktive Karte** mit Zeitleiste – **Star Wars** als eingebaute Welt mit Fraktionen und ihren Einflussgebieten über die Jahrtausende, dazu **eigene Welten** (Sci-Fi oder Fantasy) mit eigenen Zeitlinien, Fraktionen, Orten und Routen. Rund um die Karte verwaltest du deine Runde: **Story-Chronik** mit Kapiteln, **Charakterakten**, **Weltregeln** und **Weltnotizen** – und ChatGPT/Claude können per **MCP** mitlesen und mitschreiben. Als Windows-App und als Docker-Server, auf Deutsch und Englisch.

## Installation & Updates

1. Unter **Releases** die Datei `Ascandir-RP-Manager-Setup-x.y.z.exe` (bis v0.21: `Ascandir-InteractiveMap-Setup-…`) herunterladen und ausführen.
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
| Zeitleiste zoomen / verschieben | Mausrad auf der Zeitleiste oder 🔍＋ / 🔍－; **Ziehen** verschiebt die Leiste, Klick setzt das Jahr, den gelben Marker kann man ziehen; *Zeitalter* zoomt auf das aktuelle Zeitalter, *Alles* (oder Doppelklick) zeigt die ganze Zeitlinie |
| Zeitalter springen | ⏮ ⏭ oder Bild↑ / Bild↓ |
| Vollbild | F11 |
| Rückgängig (Editor) | Strg+Z |

**Bereichsmenü oben rechts** (Knopf mit dem aktuellen Bereich, z. B. „🗺 Ansicht ▾“): Ansicht, Editor, Story, Charaktere, Housing, Welt, Einstellungen und die Sprache DE/EN.
- **Ansicht:** Filter für Objekte (Sonnen, Planeten, Monde, Stationen bzw. Hauptstädte, Städte, Dörfer, Festungen, Wahrzeichen), Einflussbereiche, Hyperraumrouten bzw. Routen, Regionen, Sektoren, Raster, Namen und einzelne Fraktionen
- **Story:** zeigt den Story-Text (RP-Stand) des aktuellen Zeitalters in voller Länge und alle Kapitel/Zeitalter zum Anklicken; mit Bearbeitungsrechten direkt editierbar (Leerzeile = Absatz, `**fett**`, `*kursiv*`)
- **Editor:** Zeitalter, Fraktionen, Routen und Werkzeuge (Zuweisen, Region, Einfluss malen, Radieren, Objekt anlegen, Route zeichnen)
- **Sprache:** Umschalter DE / EN unten im Bereichsmenü, gilt pro Betrachter (im Browser gespeichert)
- **Einstellungen:** Design (automatisch, Sci-Fi oder Fantasy), Updates, Einstellungen der aktuellen Welt (Name, Jahres-Kürzel wie „v. Z.“/„n. Z.“, Löschen), Datenordner

### Welten

- **Star Wars ★** ist eingebaut, mit über 230 Systemen, Sonnen, Monden, Stationen, 13 Hyperraumrouten, Sektoren, den Regionen von Tiefkern bis Unbekannte Regionen und 18 Zeitaltern vom Großen Galaktischen Krieg (3681 VSY) bis zur Endgültigen Ordnung (35 NSY). Sieben davon decken die SWTOR-Zeit ab (Legends; Jahreszahlen angenähert). Die Kanon-Zeitlinie ist schreibgeschützt; *Kopieren* erzeugt eine bearbeitbare Version.
- **＋ Welt** legt eine eigene Welt an:
  - **Sci-Fi:** Galaxie-Hintergrund mit Sonnen, Planeten, Monden und Stationen
  - **Fantasy:** Pergamentkarte mit Hauptstädten, Städten, Dörfern, Festungen und Wahrzeichen
- Das Design passt sich automatisch an den Welttyp an.
- **Kartenbild:** Unter *Einstellungen → Aktuelle Welt → Kartenbild* kannst du für eigene Welten ein Bild hochladen (z. B. einen gezeichneten Kontinent). Es liegt unter Grenzen, Orten und Routen; Deckkraft, Größe und Lage sind einstellbar. Transparente PNGs bleiben transparent. Das Bild wird verkleinert (max. 4096 px) in der Welt-Datei gespeichert.
- **Welt löschen:** über ⚙ in der Kopfzeile → *Welt löschen* oder unten in den Welt-Einstellungen (nur Admins, löscht auch alle Zeitlinien der Welt).

### Galaxie-Atlas (Star Wars)

Die Star-Wars-Welt enthält zusätzlich das komplette offizielle Systemverzeichnis mit **rund 6.750 Systemen**. Jedes System hat sein Rasterfeld (z. B. *R-16*), seine Region und seinen Sektor.

- Die bekannten Welten mit Beschreibung und Eckdaten liegen jetzt auf ihren offiziellen Rasterfeldern.
- Die übrigen ~6.500 Systeme bilden eine leichte Zusatzebene. Beim Hineinzoomen erscheinen sie als Punkte und dann mit Namen. Suche, Reiseplaner, API und MCP finden sie alle.
- Ein Klick zeigt Region, Sektor, Rasterfeld und die Fraktion laut berechneten Grenzen. Mit *In Zeitlinie übernehmen* wird das System zu einem normalen, bearbeitbaren Objekt deiner Zeitlinie.
- Die genaue Lage innerhalb eines Rasterfelds ist gestreut und damit angenähert.
- Ein- und ausblenden: links *Anzeige → Atlas-Systeme*.
- Der neue **Kartenstil „Atlas“** (Standard) zeigt die Galaxie in Nachtblau mit getönten Regionsringen, gebogener Regionsbeschriftung und Rasterleiste am Bildrand. Unter *Einstellungen → Design → Kartenstil* kannst du zurück zu „Klassisch“ wechseln. Die Grenzen kommen weiterhin aus dem Territorien-Verfahren.
- **Ältere eigene Zeitlinien** (erstellt vor v0.12) nutzen noch die alten, geschätzten Positionen. Unter *Einstellungen → Aktuelle Welt → Zeitlinie an den Atlas angleichen* werden die eingebauten Welten und die mitgelieferten Einflusszonen auf die neuen Positionen verschoben. Vorher wird automatisch eine Sicherungskopie angelegt. Eigene Orte, Texte, Fraktionen und die Story bleiben unverändert.

### Territorien

Gebiete werden als echte Territorien mit Grenzlinien dargestellt: Jeder Bereich gehört der Fraktion mit dem nächstgelegenen kontrollierten Ort (Reichweite je Fraktion einstellbar), beanspruchte Regionen und gemalte Gebiete fließen mit ein. Wo zwei Mächte aufeinandertreffen, entsteht eine klare Grenze. Der alte Stil mit Einfluss-Blasen ist unter *Einstellungen → Darstellung der Gebiete* wählbar.

### Reiseplaner

*🧭 Reiseplaner* (links oben) plant eine Route wie ein Navi: Start, Ziel und beliebig viele Zwischenstopps eintippen oder mit 📍 auf der Karte wählen, dazu Hyperantrieb-Klasse (0,5 bis 20) und Aufenthalt pro Stopp. Hyperraumrouten werden bevorzugt, abseits davon geht es langsamer. Ergebnis: Gesamtdauer, Lichtjahre, Sprünge und jede Etappe mit Route; die Strecke wird auf der Karte eingezeichnet und lässt sich als Text kopieren. In Fantasy-Welten wählt man stattdessen die Reiseart (zu Fuß, Pferd, Kutsche, Schiff, Flugtier) und den Maßstab (km je Karteneinheit).
Die Zeiten sind eine spielfreundliche Schätzung (Klasse 1 auf einer Hauptroute ≈ 225 Karteneinheiten ≈ 11.700 Lichtjahre pro Tag).

### Eckdaten und Planetenbilder

Ein Klick auf einen Ort zeigt rechts seine Eckdaten: Biom, Temperatur, Bevölkerung, Klima, Gelände, Bewohner, Hauptort und Besonderheiten. Für die bekannten Star-Wars-Welten sind sie vorausgefüllt (angenähert; Kanon und Legends weichen teils ab). Planeten und Monde zeigen ein **automatisch erzeugtes Bild passend zum Biom** (Wüste, Eis, Ozean, Dschungel, Vulkan, Gasriese, Stadtplanet usw.). Das ist eine künstlerische Darstellung, keine offizielle Abbildung. Im Editor kannst du Biom, Temperatur und alle Eckdaten ändern und eigene Zeilen ergänzen, etwa „Herrscher“ oder „Handelsgüter“, und **ein eigenes Bild hochladen** (wird auf 512 px verkleinert und in der Zeitlinie gespeichert). Bei Zeitlinien, die vor Version 0.3 kopiert wurden, ergänzt die App fehlende Eckdaten automatisch aus dem Kanon.

### Zeitalter und Jahre

Ein Zeitalter gilt ab seinem Startjahr bis zum Beginn des nächsten. Objekte können zusätzlich ein *existiert ab/bis* haben (z. B. der Todesstern von 19 VSY bis 0 NSY) und erscheinen dann nur in diesen Jahren. Im Editor legt *＋ Jahr* ein neues Zeitalter ab dem eingestellten Jahr an; es übernimmt den aktuellen Stand.

### Story-Abschnitte

Im Reiter *Story* gibt es beliebig viele **Abschnitte**, gruppiert in **Kapitel mit Titel** (und optionaler Kurzbeschreibung). Umschaltbar: *Ganze Story* oder nur *Dieses Zeitalter*. Abschnitte haben Titel, Jahr, beteiligte Orte und Text mit **fett**/*kursiv*. Du kannst sie selbst anlegen (＋ Abschnitt hinzufügen) oder von der KI schreiben lassen:

- **MCP (ChatGPT/Claude):** `list_story` liest (z. B. `last: 5` für die letzten fünf), `add_story_entry` legt einen neuen Abschnitt an, `update_story_entry` ändert oder ergänzt (`append: true`), `delete_story_entry` löscht.
- **REST:** `GET /api/v1/story?timeline=…&format=text`, `POST/PATCH/DELETE /api/v1/story` (mit Token).
- `get_summary` nennt automatisch die letzten Abschnitte, damit die KI weiß, wo die Geschichte steht.
- **Zuklappen:** Ein Klick auf den Titel eines Abschnitts oder Kapitels klappt ihn zu (nur noch Titel sichtbar); ▸▸/▾▾ klappt alles zu bzw. auf. Das merkt sich jeder Browser für sich.
- **Kapitel per KI:** `upsert_chapter` (Titel, `newTitle`, `summary`, Position `after`, `sections` zum Zuordnen), `reorder_chapters`, `delete_chapter`; beim Abschnitt legt `chapter` das Kapitel fest (ohne Angabe: Kapitel des vorherigen Abschnitts).
- **Reihenfolge:** Abschnitte sind nach Jahr sortiert, innerhalb eines Jahres nach ihrer Position. Die KI kann mit `reorder_story` (ids in chronologischer Reihenfolge, optional `adjustYears`) neu sortieren und mit `after` einen Abschnitt gezielt hinter einen anderen einfügen oder verschieben. Im Story-Reiter gehen die Pfeile ↑/↓ innerhalb desselben Jahres.

Die Abschnitte werden in der Zeitlinien-Datei unter `"story"` gespeichert.

### Welt: Regeln und Notizen

Der Reiter *Welt* hat zwei Bereiche:

**📜 Regeln** – feste Vorgaben für die Zeitlinie, die **immer gelten und Vorrang haben** (z. B. Erzählstil, Kanon-Vorgaben, Machtsystem, Tabus). Regeln sind nicht an Jahre gebunden, nummeriert, sortierbar (↑/↓) und lassen sich deaktivieren, ohne sie zu löschen. ChatGPT bekommt die aktiven Regeln bei jeder Lageabfrage (`get_summary`) automatisch mitgeliefert und wird angewiesen, sie zu Beginn zu lesen und einzuhalten.
- **MCP:** `list_rules`, `upsert_rule` (Titel/id, `text`, `active`, Position `after`), `delete_rule` – ändern soll die KI Regeln nur auf deinen ausdrücklichen Wunsch.
- **REST:** `GET /api/v1/rules`, `POST/DELETE /api/v1/rule`.

**🗒 Notizen** – siehe unten.

#### Weltnotizen

Der Reiter *Welt* beschreibt den **aktuellen Zustand der Welt** – unabhängig von deiner eigenen Story. Drei getrennte Quellen ergänzen sich:

- **Story-Chronik:** Was ist passiert? (chronologisch, wird fortgeschrieben)
- **Charakterakten:** Wer ist wer, wo ist die Person, was weiß sie?
- **Weltnotizen:** Wie sieht die Welt gerade aus? (werden aktualisiert statt ständig neu angelegt)

Notizen sind nach Kategorien gegliedert (empfohlen: Galaktische Lage, Sith-Imperium, Galaktische Republik, Planeten & Regionen, Organisationen, Offene Handlungsstränge, Gesicherte Erkenntnisse – eigene Kategorien sind möglich). Jede Notiz hat eine Einstufung *gesichert*, *Vermutung* oder *Gerücht*, betroffene Orte (mit der Karte verknüpft) und das Datum der letzten Aktualisierung.

**An Jahre gebunden:** Jede Notiz hat Stände pro Jahr („gilt ab“, optional „bis“). Angezeigt wird der Stand zum eingestellten Jahr – stellst du die Zeitleiste zurück, siehst du die Welt, wie sie damals war. Ändert sich etwas, entsteht ein neuer Stand ab dem neuen Jahr; der alte bleibt im *Verlauf* erhalten. Umschaltbar auf *Neuester Stand*. Für die KI ist das Standardjahr das Jahr des neuesten Story-Abschnitts. Notizen und Kategorien lassen sich zuklappen.

Wichtig: Was in den Weltnotizen steht, weiß **nicht** automatisch jeder Charakter – dafür ist das Feld *Wissen* in den Charakterakten da.

- **MCP:** `list_world_notes` (Stand zu `year`, `history` für den Verlauf, Filter: Kategorie, Suchtext, Ort), `upsert_world_note` (per Titel oder id aktualisieren, `year` = gilt ab, `until`, `append` hängt an, `certainty`), `delete_world_note`.
- **REST:** `GET /api/v1/worldnotes`, `POST/DELETE /api/v1/worldnote`.

### Charaktere

Der Reiter *Charaktere* verwaltet die Figuren einer Zeitlinie. Der Steckbrief ist so gegliedert:

| Bereich | Inhalt |
|---|---|
| Identität | Name, Spezies, Alter, Geschlecht, Herkunftswelt |
| Erscheinungsbild | Gesicht, Haare, Augen, Körperbau, Kleidung |
| Persönlichkeit | Charakterzüge, Verhalten, Eigenheiten |
| Hintergrund | Herkunft, Ausbildung, Vergangenheit |
| Zugehörigkeit | Fraktion, Rang, Organisation, Meister |
| Fähigkeiten | Machtfähigkeiten, Kampfstil, Fachwissen |
| Besitz & Inventar | Geld (Credits/Gold) mit **Verlauf** (Klick auf den Betrag: Zeitpunkt, RP-Jahr, Änderung, Stand, Grund), Ausrüstung, die der Charakter bei sich trägt, und Eigentum (Schiff, Wohnung …) – storyrelevante Gegenstände mit ⭐ |
| Beziehungen | Verbündete, Feinde, Familie, Kontakte (farbig markiert) |
| Wissen | Was weiß die Person über Tim und andere? |
| Aktueller Stand | Aufenthaltsort, Status, laufende Handlungsstränge |

Dazu kommen Tags, Notizen, ein Porträt und eine Bildergalerie.

- **Gruppen** (z. B. „Crew der Trailblazer“, „Sith-Orden“) haben eine eigene Farbe. Die Liste ist danach gegliedert und lässt sich filtern; jeder Charakter trägt die Gruppe als farbiges Etikett. Bearbeiten über *⚙ Gruppen*.
- Aufenthaltsort und Herkunftswelt sind mit der Karte verknüpft; im Infofeld eines Ortes stehen die Charaktere, die dort sind. Namen in Beziehungen und beim Meister sind anklickbar, wenn es den Charakter gibt.
- **MCP (ChatGPT/Claude):** `list_characters` (Filter u. a. nach Gruppe), `get_character` (kompletter Steckbrief als Text), `upsert_character` (nur angegebene Felder werden geändert; `append` hängt an, z. B. an Wissen oder Handlungsstränge; `addRelations` ergänzt einzelne Beziehungen; `money`/`moneyDelta` setzt bzw. ändert das Geld (mit `moneyReason` als Grund im Verlauf), `inventory` legt Gegenstände an oder ändert sie (Menge per `qtyDelta`, Menge 0 entfernt), `removeItems` entfernt sie; `group` legt die Gruppe bei Bedarf an), `add_character_image` (Bild per Link – wird heruntergeladen und dauerhaft unter `images/` im Datenordner gespeichert – oder Base64; `portrait: true` setzt es als Porträt), `delete_character`.
- **REST:** `GET /api/v1/characters`, `GET /api/v1/character?name=…`, `POST/DELETE /api/v1/character`, `POST /api/v1/character/image`.
- Selbst hochgeladene Bilder werden verkleinert direkt in der Zeitlinien-Datei gespeichert.

### Konfliktzonen

Nicht jede Grenze bedeutet Krieg. Direkte Kämpfe (Front, Belagerung, umkämpftes System) markierst du als **Konfliktzone**: eine rot gestrichelte, schraffierte Fläche mit „⚔ Name“.

- **Im Editor:** Werkzeug **⚔ Konfliktzone**, vom Mittelpunkt aus einen Kreis aufziehen, dann Name, beteiligte Fraktionen, Beschreibung, Farbe und Laufzeit eintragen. Ein Klick in eine bestehende Zone öffnet sie zum Bearbeiten, darin gibt es auch „Im aktuellen Jahr beenden“.
- **Laufzeit:** Jede Zone hat ein eigenes *von* und *bis einschließlich* (leer = andauernd). Sie hängt also nicht an den Zeitaltern und erscheint auf der Zeitleiste nur in ihren Jahren.
- Klickst du einen Ort an, der in einer Zone liegt, zeigt das Infofeld die Konfliktzone und die Parteien an. Unter *Anzeige* lassen sich die Zonen ausblenden.
- **ChatGPT:**
  - `upsert_conflict` markiert eine Zone selbstständig. Die Fläche ergibt sich aus Orts- oder Systemnamen (`places`, Größe `small`/`medium`/`large`) oder aus `x`/`y`/`radius`.
  - `end_conflict` beendet einen Konflikt zu einem Jahr, `delete_conflict` löscht ihn ganz.
  - `list_conflicts` zeigt die aktiven Zonen. In `get_summary` stehen die aktiven Konfliktzonen ebenfalls, ausdrücklich getrennt von den Grenzen.

### Housing (Raumschiffe, Häuser, Basen)

Im Bereich **🏠 Housing** legst du pro Zeitlinie eigene Raumschiffe, Häuser, Basen, Stationen oder Fahrzeuge an. Jedes Objekt kann Besitzer (Charaktere) und einen Ort der Karte haben und besteht aus einem oder mehreren **Decks bzw. Etagen**.

- **Eigener Grundriss im Raster:** Mit **▭ Raum** ein Rechteck aufziehen. Mit **＋▭ Fläche** weitere Rechtecke an den ausgewählten Raum anfügen, so entstehen L- oder U-Formen (keine Rundungen). Wände werden automatisch gezeichnet.
- **Wände verschieben:** Raum auswählen und eine Kante (blauer Griff) ziehen. Angrenzende Räume wandern mit, mit gedrückter **Alt**-Taste nur der eine Raum. Ganze Räume verschiebst du durch Ziehen.
- **Vorhandener Grundriss als Vorlage:** In den Deck-Einstellungen **🖼 Bild als Vorlage** wählen (z. B. ein offizieller Deckplan). Das Raster passt sich dem Bild an. Darauf zeichnest du Räume als Flächen nach oder markierst sie mit **📍 Markierung**. Die Deckkraft ist einstellbar.
- **Räume beschreiben:** Name, Farbe, Beschreibung, Einrichtung, Gegenstände (mit Notiz) und Notizen.
- Rechte Maustaste bzw. Mausrad schiebt und zoomt, ⌂ zeigt den ganzen Plan. Unten rechts steht das Feld unter der Maus (z. B. „Feld x 12, y 5“), praktisch für Absprachen mit ChatGPT. Strg+Z macht rückgängig.
- Gespeichert wird in der Zeitlinie (`housing`). Schreibrechte wie bei der Zeitlinie, Kanon bleibt schreibgeschützt.

**ChatGPT (MCP):**

| Werkzeug | Zweck |
|---|---|
| `list_housing`, `get_housing` | Übersicht bzw. alles zu einem Objekt (Decks, Räume mit Flächen-Koordinaten, Einrichtung, Gegenstände) |
| `upsert_housing` | Objekt anlegen oder ändern (Name, Art, Beschreibung, Besitzer, Ort) |
| `upsert_deck` | Deck/Etage anlegen oder ändern (Name, Rastergröße, Maßeinheit) |
| `set_deck_image` | Grundriss-Bild per Link oder Base64 setzen. GPT kann online einen Deckplan suchen und den Link übergeben. Bei Webseiten-Links (z. B. Wiki-Dateiseite) nimmt der Server das Haupt- bzw. Vorschaubild |
| `upsert_room` | Raum anlegen oder ändern: Flächen `[x, y, Breite, Höhe]` im Raster oder Markierung `pin`, dazu Beschreibung, Einrichtung, Gegenstände, Notizen |
| `move_wall` | Wand eines Raums verschieben (`side` left/right/top/bottom, `by` Felder). Nachbarräume wandern mit |
| `delete_room`, `delete_deck`, `delete_housing` | Löschen (nur exakter Name oder id) |

Beispiel: *„Such einen Deckplan der Ebon Hawk und leg ihn als Grundriss für mein Schiff in Sith Story RP an. Markiere die Räume und beschreib den Frachtraum.“* oder *„Mach die Lounge zwei Felder breiter.“*

### Weltbild per ChatGPT

Eigene Welten können ein Bild als Hintergrund haben, z. B. eine gemalte Kontinentkarte. Du kannst es in den Einstellungen hochladen, oder ChatGPT setzt es mit `set_world_image` (öffentliche Bild-URL oder Base64, PNG/JPEG/WebP/GIF bis 10 MB; `clear: true` entfernt es). Das dürfen nur Admins der Welt.

Hochgeladene Bilder (Weltbild, Charakterbilder) werden am Inhalt geprüft. Es werden nur echte Bilddateien gespeichert. Downloads aus dem lokalen Netz (z. B. `192.168…`, `localhost`) lehnt der Server ab.

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
    { "id": "tatooine", "name": "Tatooine", "type": "planet", "parent": "tatoo1", "desc": "…", "biome": "desert",
      "facts": { "pop": "ca. 200.000", "temp": "bis 60 °C", "species": "Menschen, Jawas", "capital": "Mos Eisley", "notable": "Zwei Sonnen",
                 "extra": [["Herrscher", "Jabba der Hutte"]] } },
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
- `biome`: desert, reddesert, ice, tundra, ocean, islands, forest, redforest, jungle, swamp, grassland, mountains, volcanic, city, gas, gasblue, barren, salt, toxic, crystal, storm, machine
- Zeitlinien aus Version 0.1 (deutsche Regionsnamen) werden automatisch übernommen.

**GeoJSON:** *Datei → Exportieren → GeoJSON* erzeugt eine `FeatureCollection`, die du in geojson.io oder QGIS bearbeiten kannst. Darin sind:
- Objekte als Punkte
- Routen als Linien
- Einflussgebiete als Polygone oder Kreise

Ein neues Polygon mit den Properties `kind: "zone"`, `eraName` und `factionName` wird beim Import als Einflussgebiet übernommen.

## Server-Version (Docker / Portainer / Cloudflare-Tunnel)

> **Desktop-App mit dem Server verbinden:** In der installierten App unter *Einstellungen → Mit Server verbinden* die Adresse (z. B. `https://map.ascandir.com`) eintragen. Die App zeigt dann dieselben Daten wie die Browser-Version, Änderungen erscheinen live auf beiden Seiten; Anmeldung wie im Browser über *🔒 Anmelden*. Oben rechts zeigt ☁ die Verbindung, ein Klick darauf trennt sie wieder (dann erscheinen die lokalen Daten). Ist der Server nicht erreichbar, startet die App mit den lokalen Daten und einem Hinweis. Lokale Zeitlinien überträgt man per *Datei → Exportieren* und auf dem Server *Datei → Importieren*.

Die Karte läuft auch als Webserver im Browser, z. B. auf einem Heimserver mit Portainer und über einen Cloudflare-Tunnel von überall erreichbar. Alle Daten liegen im Docker-Volume `/data`; mehrere offene Browserfenster aktualisieren sich live.

### 1. Stack in Portainer anlegen

*Stacks → Add stack → Web editor* und Folgendes einfügen (Passwort und Token anpassen):

```yaml
services:
  interactivemap:
    image: ghcr.io/ascandir/ascandir---swgm:latest
    container_name: interactivemap
    restart: unless-stopped
    ports:
      - "8085:8080"
    environment:
      IAM_USER: "admin"
      IAM_PASSWORD: "dein-passwort"
      IAM_API_TOKEN: "langer-zufaelliger-schluessel"
    volumes:
      - interactivemap-data:/data
volumes:
  interactivemap-data:
```

| Variable | Bedeutung |
|---|---|
| `IAM_USER` / `IAM_PASSWORD` | Anmeldung zum **Bearbeiten** und für die **Einstellungen** (leer = alles offen, nicht empfohlen bei Tunnel) |
| `IAM_PUBLIC_VIEW` | `true` (Standard): Gäste können die Karte ohne Anmeldung ansehen, Welt/Zeitlinie/Jahr wählen und exportieren. `false`: auch zum Ansehen ist eine Anmeldung nötig. |
| `IAM_API_TOKEN` | Optionaler **Master-Token** mit vollem Zugriff auf alles. Normalerweise reichen die persönlichen Tokens der Benutzer (siehe unten). |
| `IAM_READONLY` | `true` = nur lesen |
| `IAM_UPDATE_WEBHOOK` / `IAM_UPDATE_WEBHOOK_TOKEN` | Optional: Update per Knopfdruck in den Einstellungen (siehe unten) |

**Update:** In Portainer beim Stack *Update the stack* mit eingeschaltetem **„Re-pull image and redeploy“** ausführen. Jede neue Version auf GitHub erzeugt automatisch ein neues Image (ca. 1–2 Minuten nach dem Release). Ist ein neueres Image verfügbar, zeigt die App das angemeldeten Admins an (abschaltbar mit `IAM_UPDATE_CHECK=false`). Alternativ eine feste Version eintragen, z. B. `ghcr.io/ascandir/ascandir---swgm:0.8.1`.

**Update per Knopfdruck (ohne Portainer):** Ein Container kann sich nicht selbst ersetzen – dafür kommt ein kleiner Updater-Container in den Stack ([nickfedor/watchtower](https://github.com/nicholas-fedor/watchtower), gepflegter Nachfolger des archivierten Watchtower). Er aktualisiert **nur** den Karten-Container (Label) und **nur**, wenn ein Admin unter *Einstellungen → Updates* auf **„Jetzt aktualisieren & neu starten“** klickt (oder im Hinweis-Banner). Die Seite wartet dann, bis die neue Version läuft, und lädt neu. Ergänzungen im Stack (fertig in `docker-compose.yml`):

```yaml
services:
  interactivemap:
    # … wie oben, zusätzlich:
    environment:
      IAM_UPDATE_WEBHOOK: "http://interactivemap-updater:8080/v1/update"
      IAM_UPDATE_WEBHOOK_TOKEN: "zweiter-zufalls-token"
    labels:
      com.centurylinklabs.watchtower.enable: "true"
    networks:
      - updater          # zusätzlich zu bestehenden Netzen (z. B. macvlan_net)
  interactivemap-updater:
    image: nickfedor/watchtower:latest
    container_name: interactivemap-updater
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_HTTP_API_UPDATE: "true"
      WATCHTOWER_HTTP_API_TOKEN: "zweiter-zufalls-token"   # gleicher Wert wie oben
      WATCHTOWER_LABEL_ENABLE: "true"
      WATCHTOWER_CLEANUP: "true"
    networks:
      - updater
networks:
  updater:
```

Der Updater hat über `docker.sock` Zugriff auf Docker, ist aber von außen nicht erreichbar (kein Port) und nur mit dem Token ansprechbar. `IAM_UPDATE_WEBHOOK` kann alternativ auf jeden anderen Webhook zeigen, der ein POST annimmt (z. B. einen Portainer-Webhook).

**Speicher:** Unter *Einstellungen → Speicher* siehst du, wie viel Platz die Daten belegen – pro Welt und Zeitlinie (inkl. Charakterbilder), jeweils nur für das, worauf du Zugriff hast. Admins sehen zusätzlich die Gesamtgröße des Datenordners und den freien Platz auf dem Laufwerk.

**Gäste und Anmeldung:** Ohne Anmeldung sieht man die Karte nur an. Oben rechts gibt es *🔒 Anmelden*, danach sind Editor, Einstellungen, neue Welten/Zeitlinien, Import und JSON-Bearbeitung freigeschaltet. Die Anmeldung bleibt 30 Tage gespeichert; abmelden geht unter *Einstellungen → Konto*.

**Benutzer & Rechte:** Unter *Einstellungen → 👥 Benutzer* (nur für Haupt-Admins) legst du Benutzer an – als **Admin** (darf alles) oder **Benutzer**. Jeder Benutzer bekommt pro Welt und pro Zeitlinie eine von vier Stufen:

| Stufe | Bedeutung |
|---|---|
| kein Zugriff | sieht die Welt/Zeitlinie nicht |
| Lesen | ansehen |
| Schreiben | bearbeiten |
| Admin | zusätzlich: Zeitlinien anlegen und löschen, Welt-Einstellungen (Name, Kartenbild …) und **Rechte vergeben** |

- Zeitlinien erben die Stufe ihrer Welt, Welten die Stufe „Alle Welten“. **Admin einer Welt** ist automatisch Admin aller ihrer Zeitlinien.
- Neue Zeitlinien darf nur ein **Admin der Welt** anlegen; wer eine Zeitlinie anlegt, wird automatisch ihr Admin.
- Welt- und Zeitlinien-Admins verwalten die Rechte selbst unter *Einstellungen → Rechte in „Welt“*: Welt-Admins für die Welt und alle Zeitlinien, Zeitlinien-Admins nur für ihre Zeitlinien. Haupt-Admins brauchen keine Rechte und erscheinen dort nicht.
- **Gäste** (nicht angemeldet) können höchstens lesen; so lassen sich z. B. private Zeitlinien verstecken.
- Neue Welten anlegen und Benutzer anlegen/löschen bleibt den Haupt-Admins vorbehalten. Der Benutzer aus `IAM_USER`/`IAM_PASSWORD` ist immer Haupt-Admin.
- Der Server prüft die Rechte bei jedem Zugriff – auch über API und MCP (persönlicher Token = Rechte des Benutzers, ohne Token = Gast-Rechte). Die Benutzer liegen (mit verschlüsselten Passwörtern) in `/data/users.json`.

**Handy & Tablet:** Die Browser-Version passt sich an kleine Bildschirme an: ein Finger verschiebt, zwei Finger zoomen, Tippen wählt einen Ort. Filter liegen in der Schublade ☰, Infos/Reiseplaner/Editor öffnen sich als Panel von unten (ℹ, 🧭). JSON lässt sich über *Datei → Importieren* (Dateiauswahl des Handys) oder *Datei → Als JSON bearbeiten* (Text einfügen) einspielen. Tipp: Im Handy-Browser „Zum Startbildschirm hinzufügen“ – dann startet die Karte wie eine App.

### 2. Cloudflare-Tunnel

In Cloudflare Zero Trust beim Tunnel einen *Public Hostname* anlegen, z. B. `karte.deine-domain.de` → Service `http://<IP-des-Servers>:8085`. Läuft `cloudflared` als Container im selben Docker-Netzwerk, geht auch `http://interactivemap:8080`.
Nutzt du *Cloudflare Access*, setze für den Pfad `/api/v1/*` eine Bypass-Regel, damit KI-Dienste mit ihrem Token durchkommen.

### 3. Story-KI anbinden (Lese-API)

Lesende Aufrufe sind bei `IAM_PUBLIC_VIEW=true` ohne Schlüssel möglich (mit den Gastrechten), sonst mit `Authorization: Bearer <Token>` oder `?token=<Token>`. Schreibende Aufrufe brauchen immer einen Token mit Bearbeitungsrechten.

### Persönliche API-Tokens (pro Benutzer)

Jeder angemeldete Benutzer erzeugt sich unter *Einstellungen → Mein API-Zugang* einen eigenen Token. Der Token **hängt an den Rechten des Benutzers**:

- Sichtbar sind nur die Welten und Zeitlinien, die der Benutzer sehen darf; *Bearbeiten*-Rechte erlauben auch Schreiben, *Ansehen* nur Lesen.
- Beispiel: Benutzer 1 hat Rechte auf Star Wars / „Sith Story RP“, Benutzer 2 auf DnD / „Nancy“, Benutzer 3 auf beides – jeder richtet in ChatGPT einen eigenen Connector `https://…/mcp/<sein-Token>` ein und sieht genau seine Zeitlinien.
- Ändert der Admin die Rechte, gilt das sofort auch für den Token. Der Token wird nur einmal angezeigt (gespeichert ist nur ein Hash); „Neuen Token erzeugen“ macht den alten ungültig. Admins sehen in der Benutzerverwaltung, wer einen Token hat, und können ihn löschen.
- Der Master-Token aus `IAM_API_TOKEN` hat weiterhin vollen Zugriff.

| Aufruf | Liefert |
|---|---|
| `GET /api/v1/summary?year=3640 BBY&timeline=Meine Zeitlinie&place=Tatooine&lang=de` | **Fertigen Text** für den KI-Kontext: Jahr, Zeitalter, Mächte mit Gebieten, Eckdaten zu den genannten Orten |
| `GET /api/v1/state?year=…` | dasselbe als JSON |
| `GET /api/v1/place?name=Dromund Kaas&year=…` | Eckdaten und Kontrolle eines Ortes |
| `GET /api/v1/travel?from=Nar Shaddaa&to=Dromund Kaas&via=Taris&class=1.5&format=text` | Reiseplaner: Route und Reisezeit |
| `GET /api/v1/search?q=…` · `/timelines` · `/worlds` · `/timeline` | Suche, Listen, komplette Zeitlinie |

Jahre gehen als `3640 VSY`, `3640 BBY`, `-3640` oder `4 NSY`. Ohne `timeline` wird die Kanon-Zeitlinie genutzt. In der App unter *Einstellungen → API für Story-KI* steht die passende Adresse für dein aktuelles Jahr.

### 4. ChatGPT oder Claude als Plugin anbinden (MCP)

Der Container enthält einen MCP-Server, wie ihn ChatGPT-Plugins und Claude-Connectors erwarten:

| Adresse | Werkzeuge |
|---|---|
| `https://karte.deine-domain.de/mcp` | nur lesen: `get_summary`, `get_state`, `get_place`, `search_places`, `plan_travel`, `list_timelines` |
| `https://karte.deine-domain.de/mcp/<Token>` | persönlicher Token (Rechte des Benutzers) oder Master-Token; zusätzlich schreiben: `copy_timeline`, `upsert_place`, `delete_place`, `upsert_faction`, `upsert_era`, `set_control` |

**ChatGPT:** *Plugins* öffnen (chatgpt.com/plugins) → **＋** → **Add custom MCP server** → Name „RP-Manager“ → bei *Connection* die Adresse mit Token eintragen → *Authentication*: **No authentication** → Warnhinweis bestätigen → **Create as a plugin** → das Plugin unter „Meine Plugins“ **installieren**. Im Chat das Plugin auswählen und loslegen. Schreibende Aktionen fragt ChatGPT vorher zur Bestätigung ab. Nach einem Update im Plugin auf *Refresh* klicken, damit neue Werkzeuge erscheinen.
Der Token steckt geheim in der Adresse – die Adresse also nicht weitergeben. Bei Cloudflare Access braucht `/mcp*` eine Bypass-Regel.

**Claude:** *Einstellungen → Connectors → Add custom connector* → dieselbe Adresse eintragen.

Beispiele im Chat:
- „Kopiere den Kanon als ‚Darians Story‘“
- „Lege den Planeten Neu-Taris bei Taris an, Inselwelt, 2 Mio. Einwohner“
- „Neu-Taris gehört ab 3639 BBY der Schwarzen Sonne“
- „Wie lange brauche ich von Nar Shaddaa nach Dromund Kaas mit Hyperantrieb Klasse 2?“

Die REST-API (`/api/v1/…`, OpenAPI unter `/api/v1/openapi.json`) bleibt für andere Werkzeuge erhalten (z. B. SillyTavern-Erweiterungen oder eigene Skripte; Schreiben mit `Authorization: Bearer <Token>`).

Die Kanon-Zeitlinie bleibt schreibgeschützt; Änderungen landen immer in einer eigenen Zeitlinie und erscheinen sofort in allen offenen Browserfenstern.

## Hinweise

- Rasterfelder, Regionen und Sektoren stammen aus dem offiziellen Star-Wars-Galaxy-Map-Gazetteer (nur als Faktenliste übernommen). Die Lage innerhalb eines Rasterfelds und die Einflussgebiete sind **Annäherungen**.
- Inoffizielles Fanprojekt ohne Verbindung zu Lucasfilm oder Disney. Es enthält keine offiziellen Karten, Logos oder Grafiken.

## Für Entwickler

```bash
npm install
npm start          # App starten
npm run dist       # Windows-Installer nach dist/ bauen
node server/server.js   # Server-Version lokal starten (Port 8080, Daten in ./data)
npm test           # Tests (Server/MCP), ohne zusätzliche Pakete
```

**Neue Version veröffentlichen:** `version` in `package.json` erhöhen und auf `main` pushen. GitHub Actions baut den Installer und legt automatisch den Tag `vX.Y.Z` und ein Release an, inklusive `latest.yml` für den Updater. Parallel entsteht das Docker-Image `ghcr.io/ascandir/ascandir---swgm` (`latest` und Versionsnummer).
