# Gramps Dashboard

Ein anpassbares Dashboard-Template für Home Assistant.

## Installation

### HACS (empfohlen)

1. Öffne HACS im Home Assistant
2. Gehe zu "Frontend"
3. Klicke auf das Menü (drei Punkte) oben rechts
4. Wähle "Benutzerdefinierte Repositories"
5. Füge die URL dieses Repositories hinzu
6. Wähle "Lovelace" als Kategorie
7. Klicke auf "Hinzufügen"
8. Suche nach "Gramps Dashboard" und installiere es

### Manuelle Installation

1. Lade `gramps-dashboard.js` herunter
2. Kopiere die Datei nach `<config>/www/gramps-dashboard.js`
3. Füge die Ressource in Home Assistant hinzu:
   - Gehe zu Einstellungen → Dashboards → Rechts oben auf Menü → Ressourcen
   - Klicke auf "+ Ressource hinzufügen"
   - URL: `/local/gramps-dashboard.js`
   - Ressourcentyp: JavaScript-Modul

## Verwendung

Nachdem die Installation abgeschlossen ist, kannst du das Template in deinen Dashboard-Karten verwenden:

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
| `name_entity` | string | Optional | Entity für Name (global) |
| `age_entity` | string | Optional | Entity für Alter (global) |
| `birthdate_entity` | string | Optional | Entity für Geburtsdatum (global) |

## Entity-Konfiguration

Jede Person kann mit individuellen Entitäten konfiguriert werden:

```yaml
entities:
  - entity: person.max
    name_entity: input_text.max_name
    age_entity: input_number.max_age
    birthdate_entity: input_text.max_birthdate
    image_entity: image.max_photo
```

## Beispiele

### Einfaches Beispiel

```yaml
type: custom:gramps-dashboard-card
title: Familie
entities:
  - entity: person.max
    name_entity: input_text.max_name
    age_entity: input_number.max_age
    birthdate_entity: input_text.max_birthdate
    image_entity: image.max_photo
```

### Mit globalen Einstellungen

```yaml
type: custom:gramps-dashboard-card
title: Meine Familie
theme: dark
show_header: true
image_entity: image.default_photo
name_entity: input_text.name
age_entity: input_number.age
birthdate_entity: input_text.birthdate
entities:
  - entity: person.max
  - entity: person.sarah
  - entity: person.kids
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
