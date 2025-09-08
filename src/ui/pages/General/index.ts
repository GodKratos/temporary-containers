// General page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess, capitalize } from '../../shared/utils';
import { CONTAINER_COLORS, CONTAINER_ICONS, TOOLBAR_ICON_COLORS, CONTAINER_REMOVAL_DEFAULT } from '~/shared';
import { PreferencesSchema } from '../../../types';

export async function initGeneralPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('general');
    if (!section) return;
    section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="field checkbox-field">
        <input type="checkbox" id="automaticMode" name="automaticMode" />
        <label for="automaticMode" data-i18n="optionsGeneralAutomaticMode">Enable Automatic Mode</label>
      </div>
      <div class="field checkbox-field">
        <input type="checkbox" id="browserActionPopup" name="browserActionPopup" />
        <label for="browserActionPopup" data-i18n="optionsGeneralToolbarPopup">Show popup when clicking the toolbar icon</label>
      </div>
      <div class="field checkbox-field">
        <input type="checkbox" id="notificationsCheckbox" name="notifications" />
        <label for="notificationsCheckbox" data-i18n="optionsGeneralNotifications">Notifications when deleting Temporary Containers</label>
      </div>
      <div class="field">
        <label for="containerNamePrefix" data-i18n="optionsGeneralContainerNamePrefix">Container Name Prefix</label>
        <input type="text" id="containerNamePrefix" name="containerNamePrefix" />
      </div>
      <div class="field">
        <div class="checkbox-field">
          <input type="checkbox" id="containerColorRandom" name="containerColorRandom" />
          <label for="containerColorRandom" data-i18n="optionsGeneralContainerRandomColor">Random Container Color</label>
        </div>
        <div id="containerColorSection" class="sub-field">
          <label for="containerColor" data-i18n="optionsGeneralContainerColor">Container Color</label>
          <select id="containerColor" name="containerColor"></select>
        </div>
        <div id="containerColorRandomExcludedSection" class="sub-field hidden">
          <label for="containerColorRandomExcluded" data-i18n="optionsGeneralContainerColorRandomExcluded">Excluded Colors for Random Container Color</label>
          <div class="multi-select-container">
            <select id="containerColorRandomExcluded" name="containerColorRandomExcluded" multiple></select>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="checkbox-field">
          <input type="checkbox" id="containerIconRandom" name="containerIconRandom" />
          <label for="containerIconRandom" data-i18n="optionsGeneralContainerIconRandom">Random Container Icon</label>
        </div>
        <div id="containerIconSection" class="sub-field">
          <label for="containerIcon" data-i18n="optionsGeneralContainerIcon">Container Icon</label>
          <select id="containerIcon" name="containerIcon"></select>
        </div>
        <div id="containerIconRandomExcludedSection" class="sub-field hidden">
          <label for="containerIconRandomExcluded" data-i18n="optionsGeneralContainerIconRandomExcluded">Excluded Icons for Random Container Icon</label>
          <div class="multi-select-container">
            <select id="containerIconRandomExcluded" name="containerIconRandomExcluded" multiple></select>
          </div>
        </div>
      </div>
      <div class="field">
        <label for="containerNumberMode" data-i18n="optionsGeneralContainerNumber">Container Number Mode</label>
        <select id="containerNumberMode" name="containerNumberMode">
          <option value="keep" data-i18n="optionsGeneralContainerNumberKeepCounting">Keep counting (default)</option>
          <option value="keepuntilrestart" data-i18n="optionsGeneralContainerNumberKeepCountingUntilRestart">Keep counting until browser restart</option>
          <option value="reuse" data-i18n="optionsGeneralContainerNumberReuseNumbers">Reuse available numbers</option>
          <option value="hide" data-i18n="optionsGeneralContainerNumberHide">Hide number</option>
        </select>
      </div>
      <div class="field">
        <label for="containerRemoval" data-i18n="optionsGeneralContainerRemoval">Delete no longer needed Temporary Containers</label>
        <select id="containerRemoval" name="containerRemoval"></select>
      </div>
      <div class="field">
        <label for="iconColor" data-i18n="optionsGeneralToolbarIconColor">Icon Color</label>
        <select id="iconColor" name="iconColor"></select>
      </div>
    `;
    if (!section.firstChild) section.appendChild(content);

    // Set initial values from preferences
    (document.getElementById('automaticMode') as HTMLInputElement).checked = preferences.automaticMode?.active || false;
    (document.getElementById('browserActionPopup') as HTMLInputElement).checked = preferences.browserActionPopup || false;
    (document.getElementById('notificationsCheckbox') as HTMLInputElement).checked = preferences.notifications || false;
    (document.getElementById('containerNamePrefix') as HTMLInputElement).value = preferences.container?.namePrefix || 'tmp';
    (document.getElementById('containerColorRandom') as HTMLInputElement).checked = preferences.container?.colorRandom || false;
    (document.getElementById('containerIconRandom') as HTMLInputElement).checked = preferences.container?.iconRandom || false;
    (document.getElementById('containerNumberMode') as HTMLSelectElement).value = preferences.container?.numberMode || 'keep';

    // Populate container colors
    const colorSelect = document.getElementById('containerColor') as HTMLSelectElement;
    colorSelect.innerHTML = '';
    CONTAINER_COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = capitalize(color);
      colorSelect.appendChild(option);
    });
    colorSelect.value = preferences.container?.color || CONTAINER_COLORS[8];

    // Populate container icons
    const iconSelect = document.getElementById('containerIcon') as HTMLSelectElement;
    iconSelect.innerHTML = '';
    CONTAINER_ICONS.forEach(icon => {
      const option = document.createElement('option');
      option.value = icon;
      option.textContent = capitalize(icon);
      iconSelect.appendChild(option);
    });
    iconSelect.value = preferences.container?.icon || CONTAINER_ICONS[4];

    // Populate toolbar icon colors
    const toolbarIconColorSelect = document.getElementById('iconColor') as HTMLSelectElement;
    toolbarIconColorSelect.innerHTML = '';
    TOOLBAR_ICON_COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = capitalize(color.replace('-', ' '));
      toolbarIconColorSelect.appendChild(option);
    });
    toolbarIconColorSelect.value = preferences.iconColor || TOOLBAR_ICON_COLORS[0];

    // Populate container removal options
    const removalSelect = document.getElementById('containerRemoval') as HTMLSelectElement;
    removalSelect.innerHTML = '';
    Object.entries(CONTAINER_REMOVAL_DEFAULT).forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.setAttribute('data-i18n', text[0]);
      option.textContent = text[1];
      removalSelect.appendChild(option);
    });
    removalSelect.value = (preferences.container?.removal !== undefined ? preferences.container.removal.toString() : '900000');

    // Populate multi-selects for random excluded
    const colorRandomExcluded = document.getElementById('containerColorRandomExcluded') as HTMLSelectElement;
    colorRandomExcluded.innerHTML = '';
    CONTAINER_COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = capitalize(color);
      colorRandomExcluded.appendChild(option);
    });
    if (preferences.container?.colorRandomExcluded) {
      Array.from(colorRandomExcluded.options).forEach(option => {
        if (preferences.container.colorRandomExcluded.includes(option.value)) {
          option.selected = true;
        }
      });
    }

    const iconRandomExcluded = document.getElementById('containerIconRandomExcluded') as HTMLSelectElement;
    iconRandomExcluded.innerHTML = '';
    CONTAINER_ICONS.forEach(icon => {
      const option = document.createElement('option');
      option.value = icon;
      option.textContent = capitalize(icon);
      iconRandomExcluded.appendChild(option);
    });
    if (preferences.container?.iconRandomExcluded) {
      Array.from(iconRandomExcluded.options).forEach(option => {
        if (preferences.container.iconRandomExcluded.includes(option.value)) {
          option.selected = true;
        }
      });
    }

    // Show/hide random excluded sections
    function toggleRandomExcludedSections() {
      const colorRandom = (document.getElementById('containerColorRandom') as HTMLInputElement).checked;
      const colorSection = document.getElementById('containerColorSection');
      const colorExcludedSection = document.getElementById('containerColorRandomExcludedSection');
      if (colorRandom) {
        colorSection?.classList.add('hidden');
        colorExcludedSection?.classList.remove('hidden');
      } else {
        colorSection?.classList.remove('hidden');
        colorExcludedSection?.classList.add('hidden');
      }
      const iconRandom = (document.getElementById('containerIconRandom') as HTMLInputElement).checked;
      const iconSection = document.getElementById('containerIconSection');
      const iconExcludedSection = document.getElementById('containerIconRandomExcludedSection');
      if (iconRandom) {
        iconSection?.classList.add('hidden');
        iconExcludedSection?.classList.remove('hidden');
      } else {
        iconSection?.classList.remove('hidden');
        iconExcludedSection?.classList.add('hidden');
      }
    }
    toggleRandomExcludedSections();

    // Save helpers
    function savePref(path: string, value: any) {
      // Deep set utility
      const keys = path.split('.');
      let obj: any = preferences;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      savePreferences(preferences).then(() => showSuccess('Saved')).catch(() => showError('Failed to save'));
    }

    // Event listeners for all fields
    (document.getElementById('automaticMode') as HTMLInputElement).addEventListener('change', e => {
      savePref('automaticMode.active', (e.target as HTMLInputElement).checked);
    });
    (document.getElementById('browserActionPopup') as HTMLInputElement).addEventListener('change', e => {
      savePref('browserActionPopup', (e.target as HTMLInputElement).checked);
    });
    (document.getElementById('notificationsCheckbox') as HTMLInputElement).addEventListener('change', e => {
      savePref('notifications', (e.target as HTMLInputElement).checked);
    });
    (document.getElementById('containerNamePrefix') as HTMLInputElement).addEventListener('change', e => {
      savePref('container.namePrefix', (e.target as HTMLInputElement).value);
    });
    (document.getElementById('containerColorRandom') as HTMLInputElement).addEventListener('change', e => {
      savePref('container.colorRandom', (e.target as HTMLInputElement).checked);
      toggleRandomExcludedSections();
    });
    (document.getElementById('containerColor') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.color', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('containerColorRandomExcluded') as HTMLSelectElement).addEventListener('change', e => {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value);
      savePref('container.colorRandomExcluded', selected);
    });
    (document.getElementById('containerIconRandom') as HTMLInputElement).addEventListener('change', e => {
      savePref('container.iconRandom', (e.target as HTMLInputElement).checked);
      toggleRandomExcludedSections();
    });
    (document.getElementById('containerIcon') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.icon', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('containerIconRandomExcluded') as HTMLSelectElement).addEventListener('change', e => {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value);
      savePref('container.iconRandomExcluded', selected);
    });
    (document.getElementById('containerNumberMode') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.numberMode', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('containerRemoval') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.removal', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('iconColor') as HTMLSelectElement).addEventListener('change', e => {
      savePref('iconColor', (e.target as HTMLSelectElement).value);
    });

  } catch (error) {
    showError('Failed to load General settings');
  }
}
