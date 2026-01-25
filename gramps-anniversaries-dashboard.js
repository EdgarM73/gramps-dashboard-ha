const TRANSLATIONS = {
  de: {
    anniversaries: 'Jahrestage',
    years: 'Jahre',
    anniversary: 'Jahrestag',
    no_entities: 'Keine Personen konfiguriert',
    title: 'Titel',
    theme: 'Theme',
    show_header: 'Header anzeigen',
    persons: 'Personen',
    add_person: 'Person hinzufügen',
    add_all: 'Alle hinzufügen',
    select_person: '-- Wähle eine Person --',
    remove: 'Entfernen',
    person: 'Person',
    unknown: 'Unbekannt',
    general: 'Allgemein',
    default: 'Standard',
    dark: 'Dunkel'
  },
  en: {
    anniversaries: 'Anniversaries',
    years: 'years',
    anniversary: 'Anniversary',
    no_entities: 'No persons configured',
    title: 'Title',
    theme: 'Theme',
    show_header: 'Show header',
    persons: 'Persons',
    add_person: 'Add person',
    add_all: 'Add All',
    select_person: '-- Select a person --',
    remove: 'Remove',
    person: 'Person',
    unknown: 'Unknown',
    general: 'General',
    default: 'Default',
    dark: 'Dark'
  },
  fr: {
    anniversaries: 'Anniversaires',
    years: 'ans',
    anniversary: 'Anniversaire',
    no_entities: 'Aucune personne configurée',
    title: 'Titre',
    theme: 'Thème',
    show_header: "Afficher l'en-tête",
    persons: 'Personnes',
    add_person: 'Ajouter une personne',
    add_all: 'Ajouter tous',
    select_person: '-- Sélectionner une personne --',
    remove: 'Supprimer',
    person: 'Personne',
    unknown: 'Inconnu',
    general: 'Général',
    default: 'Par défaut',
    dark: 'Sombre'
  }
};

// Anniversaries Dashboard Card mit 2 Bildern pro Person
// (analog zu gramps-dashboard.js, aber mit 2 Bildern)

class GrampsAnniversariesDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this.config = {};
  }

  set hass(hass) {
    this._hass = hass;
    this.updateContent();
  }

  setConfig(config) {
    this.config = config;
    this.render();
    this.updateContent();
  }

  localize(key) {
    const lang = this._hass?.locale?.language || this._hass?.language || 'de';
    const langCode = lang.split('-')[0];
    return TRANSLATIONS[langCode]?.[key] || TRANSLATIONS['de'][key] || key;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'anniversaries-card';
    card.innerHTML = `
      <style>
        .card-header {
          font-size: 22px;
          font-weight: 700;
          padding: 16px 0 8px 0;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          margin-bottom: 16px;
        }
        .card-content {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .person-button {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr;
          align-items: center;
          background: var(--card-background-color, #fff);
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .person-button:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .person-image {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-right: 8px;
        }
        .person-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .person-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .person-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--gramps-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--gramps-primary-color);
        }
        .theme-dark .person-button {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .theme-dark .card-header {
          border-color: rgba(255, 255, 255, 0.1);
        }
        .theme-dark .person-image {
          background: rgba(255, 255, 255, 0.05);
        }
        @media (max-width: 1200px) {
          .card-content {
            grid-template-columns: repeat(3, 1fr);
          }
          .person-button {
            grid-column: span 3;
          }
        }
        @media (max-width: 768px) {
          .card-content {
            grid-template-columns: 1fr;
          }
          .person-button {
            grid-column: span 1;
            grid-row: span 1;
            grid-template-columns: 1fr 1fr 2fr;
          }
        }
      </style>
      ${this.config.show_header ? `<div class="card-header">${this.config.title || this.localize('anniversaries')}</div>` : ''}
      <div class="card-content ${this.config.theme === 'dark' ? 'theme-dark' : ''}" id="entities-container"></div>
    `;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(card);
  }

  updateContent() {
    if (!this._hass) return;
    const container = this.shadowRoot.getElementById('entities-container');
    if (!container) return;
    container.innerHTML = '';
    let hasValidEntities = false;
    this.config.entities.forEach((entityConf, index) => {
      const config = typeof entityConf === 'string' ? { entity: entityConf } : entityConf;
      const button = this.createPersonButton(config);
      if (button) {
        container.appendChild(button);
        hasValidEntities = true;
      }
    });
    if (!hasValidEntities && this.config.entities.length > 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--gramps-text-secondary);">
          <ha-icon icon="mdi:alert-circle-outline" style="width: 48px; height: 48px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;"></ha-icon>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Keine Entitäten gefunden</div>
          <div style="font-size: 14px; line-height: 1.5;">
            Die konfigurierten Entitäten existieren nicht in Home Assistant.<br>
            Bitte erstelle die Entitäten oder bearbeite die Karte im visuellen Editor.
          </div>
        </div>
      `;
    } else if (this.config.entities.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--gramps-text-secondary);">
          <ha-icon icon="mdi:account-group-outline" style="width: 48px; height: 48px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;"></ha-icon>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${this.localize('no_entities')}</div>
          <div style="font-size: 14px; line-height: 1.5;">
            Bearbeite diese Karte und füge Personen hinzu.
          </div>
        </div>`;
    }
  }

  createPersonButton(config) {
    // Zwei Bilder für Anniversaries
    const imageEntity1 = config.picture_entity_1 || config.image_entity_1 || this.config.picture_entity_1 || this.config.image_entity_1;
    const imageEntity2 = config.picture_entity_2 || config.image_entity_2 || this.config.picture_entity_2 || this.config.image_entity_2;
    const nameEntity = config.name_entity || this.config.name_entity;
    const ageEntity = config.age_entity || this.config.age_entity;
    const anniversaryEntity = config.anniversary_entity || this.config.anniversary_entity;

    if (!nameEntity) {
      console.warn(`Gramps Anniversaries Dashboard: name_entity fehlt in der Konfiguration`);
      return null;
    }

    const imageEntity1_obj = imageEntity1 ? this._hass.states[imageEntity1] : null;
    const imageEntity2_obj = imageEntity2 ? this._hass.states[imageEntity2] : null;
    const nameEntity_obj = this._hass.states[nameEntity];
    const ageEntity_obj = ageEntity ? this._hass.states[ageEntity] : null;
    const anniversaryEntity_obj = anniversaryEntity ? this._hass.states[anniversaryEntity] : null;

    if (!nameEntity_obj) {
      console.warn(`Gramps Anniversaries Dashboard: Namens-Entität ${nameEntity} nicht gefunden`);
      return null;
    }

    const button = document.createElement('div');
    button.className = 'person-button';

    const name = nameEntity_obj.state || nameEntity_obj.attributes?.friendly_name || this.localize('unknown');
    const imageUrl1 = imageEntity1_obj?.attributes?.entity_picture || null;
    const imageUrl2 = imageEntity2_obj?.attributes?.entity_picture || null;
    const age = ageEntity_obj?.state || '-';
    const anniversary = anniversaryEntity_obj?.state 
      ? this.formatDateGerman(anniversaryEntity_obj.state) 
      : '-';

    button.innerHTML = `
      <div class="person-image">
        ${imageUrl1 ? `<img src="${imageUrl1}" alt="${name} Bild 1" />` : `<ha-icon icon="mdi:account"></ha-icon>`}
      </div>
      <div class="person-image">
        ${imageUrl2 ? `<img src="${imageUrl2}" alt="${name} Bild 2" />` : `<ha-icon icon="mdi:account"></ha-icon>`}
      </div>
      <div class="person-details">
        <div class="person-name">${name}</div>
        <div class="detail-item">
          <div class="detail-label">${this.localize('years')}</div>
          <div class="detail-value">${age}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">${this.localize('anniversary')}</div>
          <div class="detail-value">${anniversary}</div>
        </div>
      </div>
    `;

    button.addEventListener('click', () => {
      this.fireEvent('hass-more-info', { entityId: config.entity || nameEntity });
    });

    return button;
  }

  formatDateGerman(dateStr) {
    if (!dateStr) return '-';
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}.${m}.${y}`;
    }
    const deMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr);
    if (deMatch) return dateStr;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }
    return dateStr;
  }

  fireEvent(type, detail) {
    const event = new Event(type, {
      bubbles: true,
      composed: true,
    });
    event.detail = detail;
    this.dispatchEvent(event);
  }

  getCardSize() {
    return this.config.show_header ? 4 : 3;
  }

  static getStubConfig() {
    return {
      entities: [
        {
          name_entity: 'sensor.next_anniversary_1_name',
          age_entity: 'sensor.next_anniversary_1_age',
          anniversary_entity: 'sensor.next_anniversary_1_date',
          picture_entity_1: 'sensor.next_anniversary_1_image_1',
          picture_entity_2: 'sensor.next_anniversary_1_image_2'
        }
      ],
      theme: 'default',
    };
  }

  static getConfigElement() {
    return document.createElement('gramps-anniversaries-dashboard-editor');
  }

  getConfigElement() {
    return GrampsAnniversariesDashboardCard.getConfigElement();
  }
}

customElements.define('gramps-anniversaries-dashboard-card', GrampsAnniversariesDashboardCard);

// Editor-Klasse und window.customCards-Registrierung können bei Bedarf ergänzt werden.
