# Gramps Dashboard

Ein anpassbares Dashboard-Template für Home Assistant.

## Installation

### HACS (empfohlen)

1. Öffne HACS im Home Assistant
2. Gehe zu "Frontend"
3. Klicke auf das Menü (drei Punkte) oben rechts
4. Wähle "Benutzerdefinierte Repositories"
5. Füge die URL dieses Repositories hinzu: `https://github.com/EdgarM73/gramps-dashboard-ha`
6. Wähle "Lovelace" als Kategorie
7. Klicke auf "Hinzufügen"
8. Suche nach "Gramps Dashboard" und installiere es
9. **Wichtig**: Nach der Installation führe einen Hard-Refresh durch (Strg+F5 / Cmd+Shift+R)

### Manuelle Installation

1. Lade `gramps-dashboard.js` herunter
2. Kopiere die Datei nach `<config>/www/gramps-dashboard.js`
3. Füge die Ressource in Home Assistant hinzu:
   - Gehe zu Einstellungen → Dashboards → Rechts oben auf Menü → Ressourcen
   - Klicke auf "+ Ressource hinzufügen"
   - URL: `/local/gramps-dashboard.js`
   - Ressourcentyp: **JavaScript-Modul**
4. **Wichtig**: Führe einen Hard-Refresh im Browser durch (Strg+F5 / Cmd+Shift+R)

## Verwendung

Nachdem die Installation abgeschlossen ist, kannst du das Template in deinen Dashboard-Karten verwenden.

**Wichtig bei Updates**: Nach jedem Update der Karte (z.B. über HACS), führe einen **Hard-Refresh** im Browser durch:
- **Windows/Linux**: Strg + F5 oder Strg + Shift + R
- **macOS**: Cmd + Shift + R

Dies stellt sicher, dass der Browser die neueste Version der JavaScript-Datei lädt.

### Mit dem visuellen Editor

1. Öffne dein Dashboard im Bearbeitungsmodus
2. Klicke auf "+ Karte hinzufügen"
3. Suche nach "Gramps Dashboard"
4. Konfiguriere die Karte über den visuellen Editor:
   - **Allgemein**: Titel, Theme, Header anzeigen
   - **Globale Entitäten**: Standard-Entitäten für Bild, Name, Alter, Geburtsdatum
   - **Personen**: Füge Personen hinzu und überschreibe optional die globalen Entitäten

### Mit YAML

```yaml
type: custom:gramps-dashboard-card
title: Mein Dashboard
entities:
  - entity: sensor.temperature
  - entity: light.living_room
```

## Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `type` | string | **Erforderlich** | `custom:gramps-dashboard-card` |
| `title` | string | Optional | Titel der Karte |
| `entities` | list | **Erforderlich** | Liste der anzuzeigenden Personen |
| `theme` | string | `default` | Theme-Name (`default`, `dark`) |
| `show_header` | boolean | `true` | Header anzeigen |
| `image_entity` | string | Optional | Entity für Profilbild (global) |
| `name_entity` | string | Optional | Entity für Name (global) - **Erforderlich pro Person** |
| `age_entity` | string | Optional | Entity für Alter (global) |
| `birthdate_entity` | string | Optional | Entity für Geburtsdatum (global) |

## Entity-Konfiguration

Jede Person benötigt mindestens eine `name_entity`. Optionale Felder können individuell oder global gesetzt werden:

```yaml
entities:
  - name_entity: sensor.next_birthday_1_name
    age_entity: sensor.next_birthday_1_age
    birthdate_entity: sensor.next_birthday_1_date
    image_entity: sensor.next_birthday_1_picture
```

Die `entity` Eigenschaft ist optional und wird nur für den Click-Handler verwendet (öffnet More-Info Dialog).

## Beispiele

### Gramps Integration (empfohlen)

Wenn du Gramps-Sensoren verwendest (z.B. `next_birthday_*`):

Im visuellen Editor filtern die Picker automatisch auf `sensor.next_birthday_*`, damit du die richtigen Sensoren schneller findest.

```yaml
type: custom:gramps-dashboard-card
title: Nächste Geburtstage
entities:
  - name_entity: sensor.next_birthday_1_name
    age_entity: sensor.next_birthday_1_age
    birthdate_entity: sensor.next_birthday_1_date
    image_entity: sensor.next_birthday_1_picture
  - name_entity: sensor.next_birthday_2_name
    age_entity: sensor.next_birthday_2_age
    birthdate_entity: sensor.next_birthday_2_date
    image_entity: sensor.next_birthday_2_picture
  - name_entity: sensor.next_birthday_3_name
    age_entity: sensor.next_birthday_3_age
    birthdate_entity: sensor.next_birthday_3_date
    image_entity: sensor.next_birthday_3_picture
```

### Mit Home Assistant Personen

```yaml
type: custom:gramps-dashboard-card
title: Familie
entities:
  - entity: person.max
    name_entity: input_text.max_name
    age_entity: sensor.max_age
    birthdate_entity: sensor.max_birthdate
```

### Mit globalen Einstellungen

Wenn alle Sensoren dem gleichen Muster folgen, kannst du globale Werte setzen:

```yaml
type: custom:gramps-dashboard-card
title: Meine Familie
theme: dark
show_header: true
entities:
  - name_entity: sensor.person_1_name
    age_entity: sensor.person_1_age
```

### Layout-Ergebnis

Jede Person wird als Button angezeigt:
- **3 Zeilen hoch** und **6 Spalten breit** (auf Desktops)
- **Oben links**: Profilbild der Person
- **Oben rechts**: Name der Person
- **Unten**: Alter und Geburtsdatum in separaten Details
 
Hinweis: Das Geburtsdatum wird im Format `dd.mm.yyyy` angezeigt.

## Support

Bei Problemen oder Feature-Wünschen öffne bitte ein Issue auf GitHub.

## Lizenz

MIT License
