// Advanced: Container page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

export async function initAdvancedContainerPage(): Promise<void> {
  try {
  const preferences = await getPreferences();
  const section = document.getElementById('advanced-container');
  if (!section) return;
  section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="field checkbox-field">
        <input type="checkbox" id="containerCleanup" name="containerCleanup" />
        <label for="containerCleanup" data-i18n="containerCleanup">Container Cleanup</label>
        <div class="field-description" data-i18n="containerCleanupDescription">Cleanup containers on exit.</div>
      </div>
      <div class="field">
        <label for="containerTimeout" data-i18n="containerTimeout">Container Timeout</label>
        <input type="number" id="containerTimeout" name="containerTimeout" min="0" />
        <div class="field-description" data-i18n="containerTimeoutDescription">Timeout for containers in seconds.</div>
      </div>
    `;
    // ...bind fields to preferences and handle save events...
  section.appendChild(content);
  } catch (error) {
    showError('Failed to load Advanced: Container settings');
  }
}
