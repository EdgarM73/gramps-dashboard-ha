// gramps-dashboard-collection.js
// Diese Datei bündelt alle drei Karten als Collection für Home Assistant (ähnlich Mushroom Collection)
import './gramps-dashboard.js';
import './gramps-anniversaries-dashboard.js';
import './gramps-todestage-dashboard.js';

// Keine eigene Collection-Registrierung und keine doppelte Todestage-Registrierung mehr


console.info(
  '%c GRAMPS-DASHBOARD-COLLECTION %c v1.0.0 ',
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);

// Minimal custom element definition for the collection
class GrampsDashboardCollection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<div>Gramps Dashboard Collection loaded.</div>`;
  }
}
customElements.define('gramps-dashboard-collection', GrampsDashboardCollection);
