class GrampsDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('Du musst Entitäten definieren');
    }

    this.config = {
      title: config.title || '',
      entities: config.entities || [],
      theme: config.theme || 'default',
      show_header: config.show_header !== false,
      image_entity: config.image_entity || null,
      name_entity: config.name_entity || null,
      age_entity: config.age_entity || null,
      birthdate_entity: config.birthdate_entity || null,
      ...config
    };

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateContent();
  }

  render() {
    const card = document.createElement('ha-card');
    card.innerHTML = `
      <style>
        :host {
          --gramps-primary-color: var(--primary-color, #03a9f4);
          --gramps-accent-color: var(--accent-color, #ff9800);
          --gramps-card-background: var(--card-background-color, #fff);
          --gramps-text-primary: var(--primary-text-color, #212121);
          --gramps-text-secondary: var(--secondary-text-color, #727272);
        }

        .card-header {
          padding: 16px;
          font-size: 20px;
          font-weight: 500;
          color: var(--gramps-text-primary);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .card-content {
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          grid-auto-rows: auto;
        }

        .person-button {
          grid-column: span 6;
          grid-row: span 3;
          display: grid;
          grid-template-columns: 1fr 2fr;
          grid-template-rows: auto auto;
          gap: 12px;
          padding: 16px;
          background: var(--gramps-card-background);
          border-radius: 12px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          overflow: hidden;
        }

        .person-button:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transform: translateY(-4px);
          border-color: var(--gramps-primary-color);
        }

        .person-image {
          grid-column: 1;
          grid-row: 1 / span 2;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .person-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .person-image ha-icon {
          width: 48px;
          height: 48px;
          color: var(--gramps-text-secondary);
        }

        .person-name {
          grid-column: 2;
          grid-row: 1;
          display: flex;
          align-items: center;
          font-size: 24px;
          font-weight: 700;
          color: var(--gramps-text-primary);
          word-break: break-word;
        }

        .person-details {
          grid-column: 2;
          grid-row: 2;
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
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
            grid-template-columns: 1fr 2fr;
          }
        }
      </style>

      ${this.config.show_header ? `<div class="card-header">${this.config.title}</div>` : ''}
      <div class="card-content ${this.config.theme === 'dark' ? 'theme-dark' : ''}" id="entities-container">
      </div>
    `;

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(card);
  }

  updateContent() {
    if (!this._hass) return;

    const container = this.shadowRoot.getElementById('entities-container');
    if (!container) return;

    container.innerHTML = '';

    this.config.entities.forEach((entityConf, index) => {
      const config = typeof entityConf === 'string' ? 
        { entity: entityConf } : 
        entityConf;

      const button = this.createPersonButton(config);
      if (button) {
        container.appendChild(button);
      }
    });
  }

  createPersonButton(config) {
    const imageEntity = config.image_entity || this.config.image_entity;
    const nameEntity = config.name_entity || this.config.name_entity;
    const ageEntity = config.age_entity || this.config.age_entity;
    const birthdateEntity = config.birthdate_entity || this.config.birthdate_entity;

    // Fallback auf entity Wert wenn spezifische nicht gesetzt
    const imageId = imageEntity || config.entity;
    const nameId = nameEntity || config.entity;
    const ageId = ageEntity;
    const birthdateId = birthdateEntity;

    const imageEntity_obj = this._hass.states[imageId];
    const nameEntity_obj = this._hass.states[nameId];
    const ageEntity_obj = ageId ? this._hass.states[ageId] : null;
    const birthdateEntity_obj = birthdateId ? this._hass.states[birthdateId] : null;

    if (!nameEntity_obj) {
      console.warn(`Namens-Entität ${nameId} nicht gefunden`);
      return null;
    }

    const button = document.createElement('div');
    button.className = 'person-button';

    const name = nameEntity_obj.state || 'Unbekannt';
    const imageUrl = imageEntity_obj?.attributes?.entity_picture || null;
    const age = ageEntity_obj?.state || 'N/A';
    const birthdate = birthdateEntity_obj?.state 
      ? this.formatDateGerman(birthdateEntity_obj.state) 
      : 'N/A';

    button.innerHTML = `
      <div class="person-image">
        ${imageUrl ? 
          `<img src="${imageUrl}" alt="${name}" />` : 
          `<ha-icon icon="mdi:account"></ha-icon>`
        }
      </div>
      <div class="person-name">${name}</div>
      <div class="person-details">
        <div class="detail-item">
          <div class="detail-label">Alter</div>
          <div class="detail-value">${age}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Geburtsdatum</div>
          <div class="detail-value">${birthdate}</div>
        </div>
      </div>
    `;

    button.addEventListener('click', () => {
      this.fireEvent('hass-more-info', { entityId: nameId });
    });

    return button;
  }

  formatDateGerman(dateStr) {
    if (!dateStr) return 'N/A';

    // ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}.${m}.${y}`;
    }

    // Already dd.mm.yyyy
    const deMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr);
    if (deMatch) return dateStr;

    // Fallback: Date parser
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }

    // If parsing failed, return original
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
      title: 'Gramps Dashboard',
      entities: [
        {
          entity: 'person.max',
          name_entity: 'input_text.max_name',
          age_entity: 'input_number.max_age',
          birthdate_entity: 'input_text.max_birthdate',
          image_entity: 'image.max_photo'
        }
      ],
      theme: 'default',
    };
  }
}

customElements.define('gramps-dashboard-card', GrampsDashboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'gramps-dashboard-card',
  name: 'Gramps Dashboard Card',
  description: 'Ein anpassbares Dashboard-Template für Home Assistant',
  preview: true,
  documentationURL: 'https://github.com/EdgarM73/gramps-dashboard-ha',
});

console.info(
  '%c GRAMPS-DASHBOARD-CARD %c v1.0.0 ',
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);
