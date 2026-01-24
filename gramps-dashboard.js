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

    // Ensure Lovelace keeps type when editor updates config
    this.config.type = config.type || 'custom:gramps-dashboard-card';

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

  static getConfigElement() {
    return document.createElement('gramps-dashboard-editor');
  }

  getConfigElement() {
    return GrampsDashboardCard.getConfigElement();
  }
}

customElements.define('gramps-dashboard-card', GrampsDashboardCard);

class GrampsDashboardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
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
      image_entity: config?.image_entity || '',
      name_entity: config?.name_entity || '',
      age_entity: config?.age_entity || '',
      birthdate_entity: config?.birthdate_entity || '',
      entities: Array.isArray(config?.entities) ? JSON.parse(JSON.stringify(config.entities)) : [],
    };
    this.render();
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
        <legend>Allgemein</legend>
        <div class="row">
          <label>
            Titel
            <input id="title" type="text" value="${this._config.title}" />
          </label>
          <label>
            Theme
            <select id="theme" value="${this._config.theme}">
              <option value="default" ${this._config.theme === 'default' ? 'selected' : ''}>Default</option>
              <option value="dark" ${this._config.theme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </label>
        </div>
        <label class="full" style="margin-top:8px;">
          <input id="show_header" type="checkbox" ${this._config.show_header ? 'checked' : ''} /> Header anzeigen
        </label>
      </fieldset>

      <fieldset class="full">
        <legend>Globale Entitäten</legend>
        <div class="row">
          <label>
            Bild-Entität
            <ha-entity-picker id="image_entity"></ha-entity-picker>
          </label>
          <label>
            Namens-Entität
            <ha-entity-picker id="name_entity"></ha-entity-picker>
          </label>
        </div>
        <div class="row">
          <label>
            Alters-Entität
            <ha-entity-picker id="age_entity"></ha-entity-picker>
          </label>
          <label>
            Geburtsdatum-Entität
            <ha-entity-picker id="birthdate_entity"></ha-entity-picker>
          </label>
        </div>
      </fieldset>

      <fieldset class="full">
        <legend>Personen</legend>
        <div class="entities" id="entities">
          ${this._config.entities.map((e, idx) => `
            <div class="entity-card" data-index="${idx}">
              <div class="row">
                <label>
                  Person-Entität
                  <ha-entity-picker class="entity"></ha-entity-picker>
                </label>
                <label>
                  Bild-Entität (optional)
                  <ha-entity-picker class="image_entity"></ha-entity-picker>
                </label>
              </div>
              <div class="row">
                <label>
                  Namens-Entität (optional)
                  <ha-entity-picker class="name_entity"></ha-entity-picker>
                </label>
                <label>
                  Alters-Entität (optional)
                  <ha-entity-picker class="age_entity"></ha-entity-picker>
                </label>
              </div>
              <div class="row">
                <label>
                  Geburtsdatum-Entität (optional)
                  <ha-entity-picker class="birthdate_entity"></ha-entity-picker>
                </label>
                <div class="actions" style="align-items:end;">
                  <button class="remove" data-index="${idx}">Entfernen</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="actions" style="margin-top:8px;">
          <button id="add">Person hinzufügen</button>
        </div>
      </fieldset>
    `;

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(editor);

    // General inputs
    const titleEl = this.shadowRoot.getElementById('title');
    const themeEl = this.shadowRoot.getElementById('theme');
    const headerEl = this.shadowRoot.getElementById('show_header');
    if (titleEl) titleEl.addEventListener('input', (e) => this._updateValue('title', e.target.value));
    if (themeEl) themeEl.addEventListener('change', (e) => this._updateValue('theme', e.target.value));
    if (headerEl) headerEl.addEventListener('change', (e) => this._updateValue('show_header', e.target.checked));

    // Add entity button
    const addBtn = this.shadowRoot.getElementById('add');
    if (addBtn) addBtn.addEventListener('click', () => this._addEntity());
  }

  _updatePickers() {
    if (!this._hass || !this.shadowRoot) return;

    // Update global entity pickers
    const globalPickers = ['image_entity','name_entity','age_entity','birthdate_entity'];
    globalPickers.forEach((id) => {
      const el = this.shadowRoot.getElementById(id);
      if (el) {
        el.hass = this._hass;
        el.value = this._config[id] || '';
        // Suggest appropriate domains
        if (id === 'image_entity') el.includeDomains = ['image','camera','sensor'];
        if (id === 'name_entity') el.includeDomains = ['input_text','sensor'];
        if (id === 'age_entity') el.includeDomains = ['sensor','input_number'];
        if (id === 'birthdate_entity') el.includeDomains = ['sensor','input_text'];
        el.addEventListener('value-changed', (ev) => this._updateValue(id, ev.detail.value), { once: true });
      }
    });

    // Update person entity pickers
    const entitiesContainer = this.shadowRoot.getElementById('entities');
    if (!entitiesContainer) return;

    entitiesContainer.querySelectorAll('.entity-card').forEach((card) => {
      const idx = parseInt(card.dataset.index, 10);
      
      // Person picker
      const personPicker = card.querySelector('.entity');
      if (personPicker) {
        personPicker.hass = this._hass;
        personPicker.includeDomains = ['person'];
        personPicker.value = this._config.entities[idx]?.entity || '';
        personPicker.addEventListener('value-changed', (ev) => this._updateEntity(idx, 'entity', ev.detail.value), { once: true });
      }

      // Other pickers
      const imgPicker = card.querySelector('.image_entity');
      const namePicker = card.querySelector('.name_entity');
      const agePicker = card.querySelector('.age_entity');
      const birthPicker = card.querySelector('.birthdate_entity');
      
      [imgPicker, namePicker, agePicker, birthPicker].forEach((el, i) => {
        if (el) {
          const key = ['image_entity','name_entity','age_entity','birthdate_entity'][i];
          el.hass = this._hass;
          el.value = this._config.entities[idx]?.[key] || '';
          // Domain suggestions per field
          if (key === 'image_entity') el.includeDomains = ['image','camera','sensor'];
          if (key === 'name_entity') el.includeDomains = ['input_text','sensor'];
          if (key === 'age_entity') el.includeDomains = ['sensor','input_number'];
          if (key === 'birthdate_entity') el.includeDomains = ['sensor','input_text'];
          el.addEventListener('value-changed', (ev) => this._updateEntity(idx, key, ev.detail.value), { once: true });
        }
      });

      // Remove button
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

  _addEntity() {
    this._config.entities = this._config.entities || [];
    this._config.entities.push({ entity: '' });
    this.render();
    this._updatePickers();
    this._fireConfigChanged();
  }

  _removeEntity(index) {
    if (!Array.isArray(this._config.entities)) return;
    this._config.entities.splice(index, 1);
    this.render();
    this._updatePickers();
    this._fireConfigChanged();
  }

  _fireConfigChanged() {
    // Always include type to avoid Lovelace editor errors
    const cfg = { type: 'custom:gramps-dashboard-card', ...this._config };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg } }));
  }
}

customElements.define('gramps-dashboard-editor', GrampsDashboardEditor);

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
