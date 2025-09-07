// General page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
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
      // ...bind fields to preferences and handle save events...
      section.appendChild(content);
  } catch (error) {
    showError('Failed to load General settings');
  }
}
