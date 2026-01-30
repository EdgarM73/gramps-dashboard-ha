// Editor für Anniversaries Dashboard Card
class GrampsAnniversariesDashboardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  localize(key) {
    const lang = this._hass?.locale?.language || this._hass?.language || 'de';
    const langCode = lang.split('-')[0];
    return TRANSLATIONS[langCode]?.[key] || TRANSLATIONS['de'][key] || key;
  }

  set hass(hass) {
    this._hass = hass;
    this._updatePickers();
  }

  setConfig(config) {
    this._config = {
      title: config?.title || '',
      show_header: config?.show_header !== false,
      theme: config?.theme || 'default',
      name_entity: config?.name_entity || '',
      age_entity: config?.age_entity || '',
      anniversary_entity: config?.anniversary_entity || '',
      picture_entity_1: config?.picture_entity_1 || '',
      picture_entity_2: config?.picture_entity_2 || '',
      entities: Array.isArray(config?.entities) ? JSON.parse(JSON.stringify(config.entities)) : [],
    };
    this.render();
    this._setupEventListeners();
    this._updatePickers();
  }

  render() {
    const styles = `
      :host { display: block; }
      .editor {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 8px;
      }
      .full { grid-column: 1 / -1; }
      fieldset {
        border: 1px solid var(--divider-color, rgba(0,0,0,0.1));
        border-radius: 8px;
        padding: 12px;
      }
      legend { font-weight: 600; }
      label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
      input, select { padding: 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.2); }
      ha-entity-picker { width: 100%; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .entities { display: flex; flex-direction: column; gap: 12px; }
      .entity-card { border: 1px solid var(--divider-color, rgba(0,0,0,0.1)); border-radius: 8px; padding: 12px; }
      .actions { display: flex; gap: 8px; }
      button { padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.2); cursor: pointer; }
    `;
    const editor = document.createElement('div');
    editor.className = 'editor';
    editor.innerHTML = `
      <style>${styles}</style>
      <fieldset class="full">
        <legend>${this.localize('general')}</legend>
        <div class="row">
          <label>
            ${this.localize('title')}
            <input id="title" type="text" value="${this._config.title || ''}" placeholder="${this.localize('anniversaries')}" />
          </label>
          <label>
            ${this.localize('theme')}
            <select id="theme" value="${this._config.theme}">
              <option value="default" ${this._config.theme === 'default' ? 'selected' : ''}>${this.localize('default')}</option>
              <option value="dark" ${this._config.theme === 'dark' ? 'selected' : ''}>${this.localize('dark')}</option>
            </select>
          </label>
        </div>
        <label class="full" style="margin-top:8px;">
          <input id="show_header" type="checkbox" ${this._config.show_header ? 'checked' : ''} /> ${this.localize('show_header')}
        </label>
      </fieldset>

      <fieldset class="full">
        <legend>${this.localize('persons')}</legend>
        <div class="entities" id="entities">
          <!-- Entities will be rendered here -->
        </div>
        <div class="actions" style="margin-top:8px; display: flex; gap: 8px;">
          <label style="flex: 1;">
            ${this.localize('add_person')}
            <select id="person-selector" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.2);">
              <option value="">${this.localize('select_person')}</option>
            </select>
          </label>
          <button id="add-all-btn" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.2); cursor: pointer; background: var(--primary-color, #03A9F4); color: white; font-weight: 600; height: 42px; margin-top: 24px;">${this.localize('add_all')}</button>
        </div>
      </fieldset>
    `;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(editor);
    this._populatePersonSelector();
    this._updateEntityList();
  }

  _populatePersonSelector() {
    if (!this._hass) return;
    const selector = this.shadowRoot.getElementById('person-selector');
    if (!selector) return;
    const nameSensors = Object.keys(this._hass.states)
      .filter(entityId => entityId.match(/^sensor\.next_anniversary_(\d+)_name$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });
    selector.innerHTML = `<option value="">${this.localize('select_person')}</option>`;
    nameSensors.forEach(entityId => {
      const match = entityId.match(/^sensor\.next_anniversary_(\d+)_name$/);
      if (match) {
        const number = match[1];
        const state = this._hass.states[entityId];
        const name = state?.state || `Person ${number}`;
        const alreadyAdded = this._config.entities.some(e => e.name_entity === entityId);
        if (!alreadyAdded) {
          const option = document.createElement('option');
          option.value = number;
          option.textContent = `${number} - ${name}`;
          selector.appendChild(option);
        }
      }
    });
  }

  _addPersonByNumber(number) {
    this._config.entities = this._config.entities || [];
    this._config.entities.push({
      name_entity: `sensor.next_anniversary_${number}_name`,
      age_entity: `sensor.next_anniversary_${number}_age`,
      anniversary_entity: `sensor.next_anniversary_${number}_date`,
      picture_entity_1: `sensor.next_anniversary_${number}_image_person_1`,
      picture_entity_2: `sensor.next_anniversary_${number}_image_person_2`
    });
    this._updateEntityList();
    this._populatePersonSelector();
    this._fireConfigChanged();
  }

  _addAllPersons() {
    if (!this._hass) return;
    const nameSensors = Object.keys(this._hass.states)
      .filter(entityId => entityId.match(/^sensor\.next_anniversary_(\d+)_name$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });
    let addedCount = 0;
    nameSensors.forEach(entityId => {
      const match = entityId.match(/^sensor\.next_anniversary_(\d+)_name$/);
      if (match) {
        const number = match[1];
        const alreadyAdded = this._config.entities.some(e => e.name_entity === entityId);
        if (!alreadyAdded) {
          this._config.entities.push({
            name_entity: `sensor.next_anniversary_${number}_name`,
            age_entity: `sensor.next_anniversary_${number}_age`,
            anniversary_entity: `sensor.next_anniversary_${number}_date`,
            picture_entity_1: `sensor.next_anniversary_${number}_image_person_1`,
            picture_entity_2: `sensor.next_anniversary_${number}_image_person_2`
          });
          addedCount++;
        }
      }
    });
    if (addedCount > 0) {
      this._updateEntityList();
      this._populatePersonSelector();
      this._fireConfigChanged();
    }
  }

  _updateEntityList() {
    const entitiesContainer = this.shadowRoot?.getElementById('entities');
    if (!entitiesContainer) return;
    entitiesContainer.innerHTML = this._config.entities.map((e, idx) => {
      const nameEntity = e.name_entity || '';
      const match = nameEntity.match(/next_anniversary_(\d+)_name/);
      const personId = match ? match[1] : idx + 1;
      const personName = this._hass?.states[nameEntity]?.state || this.localize('unknown');
      return `
        <div class="entity-card" data-index="${idx}" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <strong>${this.localize('person')} ${personId}</strong> - ${personName}
            </div>
            <button class="remove" data-index="${idx}" style="margin-left: 12px;">${this.localize('remove')}</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <label style="flex:1;">
              Bild 1 Entity
              <input type="text" value="${e.picture_entity_1 || ''}" data-idx="${idx}" data-key="picture_entity_1" placeholder="sensor.next_anniversary_${personId}_image_person_1" />
            </label>
            <label style="flex:1;">
              Bild 2 Entity
              <input type="text" value="${e.picture_entity_2 || ''}" data-idx="${idx}" data-key="picture_entity_2" placeholder="sensor.next_anniversary_${personId}_image_person_2" />
            </label>
          </div>
        </div>
      `;
    }).join('');
    const removeButtons = this.shadowRoot.querySelectorAll('.remove');
    removeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this._removeEntity(idx);
      });
    });
    // Listen for image entity input changes
    const imageInputs = this.shadowRoot.querySelectorAll('input[data-key]');
    imageInputs.forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const key = e.target.dataset.key;
        this._updateEntity(idx, key, e.target.value);
      });
    });
  }

  _setupEventListeners() {
    const titleEl = this.shadowRoot.getElementById('title');
    const themeEl = this.shadowRoot.getElementById('theme');
    const headerEl = this.shadowRoot.getElementById('show_header');
    if (titleEl) {
      titleEl.addEventListener('input', (e) => {
        this._updateValue('title', e.target.value);
      });
    }
    if (themeEl) {
      themeEl.addEventListener('change', (e) => {
        this._updateValue('theme', e.target.value);
      });
    }
    if (headerEl) {
      headerEl.addEventListener('change', (e) => {
        this._updateValue('show_header', e.target.checked);
      });
    }

    const personSelector = this.shadowRoot.getElementById('person-selector');
    if (personSelector) {
      personSelector.addEventListener('change', (e) => {
        if (e.target.value) {
          this._addPersonByNumber(e.target.value);
          e.target.value = '';
        }
      });
    }

    const addAllBtn = this.shadowRoot.getElementById('add-all-btn');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', () => {
        this._addAllPersons();
      });
    }
  }

  _updatePickers() {
    if (!this._hass || !this.shadowRoot) return;
    const entitiesContainer = this.shadowRoot.getElementById('entities');
    if (!entitiesContainer) return;
    entitiesContainer.querySelectorAll('.entity-card').forEach((card) => {
      const idx = parseInt(card.dataset.index, 10);
      const removeBtn = card.querySelector('.remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => this._removeEntity(idx), { once: true });
      }
    });
  }

  _updateValue(key, value) {
    this._config[key] = value;
    this._fireConfigChanged();
  }

  _updateEntity(index, key, value) {
    if (!this._config.entities[index]) return;
    this._config.entities[index][key] = value;
    this._fireConfigChanged();
  }

  _removeEntity(index) {
    if (!Array.isArray(this._config.entities)) return;
    this._config.entities.splice(index, 1);
    this._updateEntityList();
    this._populatePersonSelector();
    this._fireConfigChanged();
  }

  _fireConfigChanged() {
    const cfg = { type: 'custom:gramps-anniversaries-dashboard-card', ...this._config };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg } }));
  }
}

customElements.define('gramps-anniversaries-dashboard-editor', GrampsAnniversariesDashboardEditor);
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
          grid-template-columns: 1fr;
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
          picture_entity_1: 'sensor.next_anniversary_1_image_person_1',
          picture_entity_2: 'sensor.next_anniversary_1_image_person_2'
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

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'gramps-anniversaries-dashboard-card',
  name: 'Gramps Anniversaries Dashboard Card',
  description: 'Ein anpassbares Jahrestage-Dashboard-Template für Home Assistant',
  preview: true,
  documentationURL: 'https://github.com/EdgarM73/gramps-dashboard-ha',
});
