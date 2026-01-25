// gramps-dashboard-collection.js
// Diese Datei bündelt alle drei Karten als Collection für Home Assistant (ähnlich Mushroom Collection)
import './gramps-dashboard.js';
import './gramps-anniversaries-dashboard.js';
import './gramps-todestage-dashboard.js';

// Optionale window.customCards-Registrierung für die Collection
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'gramps-dashboard-collection',
  name: 'Gramps Dashboard Collection',
  description: 'Sammlung: Geburtstage, Jahrestage, Todestage als Custom Cards für Home Assistant',
  preview: true,
  documentationURL: 'https://github.com/EdgarM73/gramps-dashboard-ha',
});

console.info(
  '%c GRAMPS-DASHBOARD-COLLECTION %c v1.0.0 ',
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);
