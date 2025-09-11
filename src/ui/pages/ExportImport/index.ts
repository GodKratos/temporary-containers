// Export/Import page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

function formatDate(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function initExportImportPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('export-import');
    if (!section) return;
    
    section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="field">
        <label data-i18n="exportSettings">Export Settings</label>
        <div class="button-group">
          <button id="exportSettings" class="button-default" data-i18n="exportSettings">Export Settings</button>
        </div>
        <div class="field-description" data-i18n="exportSettingsDescription">Export settings to a file.</div>
      </div>
      <div class="field">
        <label data-i18n="importSettings">Import Settings</label>
        <div class="file-input-container">
          <input type="file" id="importFile" accept=".json" />
          <button id="importSettings" class="button-default" data-i18n="importSettings">Import Settings</button>
        </div>
        <div class="field-description" data-i18n="importSettingsDescription">Import settings from a file.</div>
      </div>
    `;
    
    if (!section.firstChild) section.appendChild(content);

    // Bind export/import events
    const exportButton = document.getElementById('exportSettings');
    const importButton = document.getElementById('importSettings');
    const importFile = document.getElementById('importFile') as HTMLInputElement;

    if (exportButton) {
      exportButton.addEventListener('click', handleExport);
    }

    if (importButton && importFile) {
      importButton.addEventListener('click', () => handleImport(importFile));
    }
  } catch (error) {
    console.error('Error initializing export/import page:', error);
    showError(`Error initializing export/import page: ${error?.toString() ?? 'Unknown error'}`);
  }
}

async function handleExport(): Promise<void> {
  try {
    const [preferences, { domainRules }, { statistics }] = await Promise.all([
      getPreferences(),
      browser.runtime.sendMessage({ method: 'getDomainRules' }) as Promise<{ domainRules: any[] }>,
      browser.storage.local.get('statistics') as Promise<{ statistics: any }>
    ]);

    const settings = {
      preferences,
      domainRules,
      statistics
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `temporary-containers-settings-${formatDate(new Date())}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showSuccess(browser.i18n.getMessage('optionsExportImportExportSuccess'));
  } catch (error) {
    console.error('Error exporting settings:', error);
    showError(`Error exporting settings: ${error?.toString() ?? 'Unknown error'}`);
  }
}

async function handleImport(fileInput: HTMLInputElement): Promise<void> {
  const file = fileInput.files?.[0];
  
  if (!file) {
    showError(browser.i18n.getMessage('errorImportFileNotFound'));
    return;
  }
  
  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    
    // Validate settings
    if (!settings.preferences) {
      throw new Error(`Import error: Invalid file`);
    }
    
    // Save preferences
    await savePreferences(settings.preferences as PreferencesSchema);
    
    // Import domain rules if available
    if (settings.domainRules) {
      await browser.runtime.sendMessage({
        method: 'saveDomainRules',
        domainRules: settings.domainRules
      });
    }
    
    // Import statistics if available
    if (settings.statistics) {
      await browser.storage.local.set({ statistics: settings.statistics });
    }
    
    // Reset file input
    fileInput.value = '';
    
    showSuccess(browser.i18n.getMessage('optionsExportImportImportSuccess'));
  } catch (error) {
    console.error('Error importing settings:', error);
    showError(`Error importing settings: ${error?.toString() ?? 'Unknown error'}`);
  }
}
