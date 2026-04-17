// Export/Import page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

interface SyncExportInfo {
  date: number;
  version: string;
}

interface ExportedPreferences {
  version: string;
  date: number;
  preferences: PreferencesSchema;
}

interface ChunkedSyncExportInfo extends SyncExportInfo {
  chunkCount: number;
}

const LEGACY_SYNC_EXPORT_KEY = 'export';
const SYNC_EXPORT_META_KEY = 'exportMeta';
const SYNC_EXPORT_CHUNK_PREFIX = 'exportChunk_';
const SYNC_EXPORT_CHUNK_MAX_BYTES = 6000;

let lastSyncExport: SyncExportInfo | null = null;

function formatDate(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function initExportImportPage(): Promise<void> {
  try {
    const section = document.getElementById('export-import');
    if (!section) return;

    // Initialize sync export info
    await initializeSyncExportInfo();

    section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="section">
        <h3 data-i18n="exportSettings">Export Settings</h3>
        <div class="field">
          <div class="info-message">
            <span data-i18n="">Preferences that include permanent containers are stripped from the export since it's not possible to make sure that those containers exist when importing, which would lead to unexpected behavior.</span>
          </div>
          <div class="button-group">
            <button id="exportSettings" class="button" data-i18n="exportSettings">Export to File</button>
            <button id="exportToFirefoxSync" class="button" data-i18n="exportToFirefoxSync">Export to Firefox Sync</button>
          </div>
          
          <div id="lastSyncExportInfo" class="sync-export-info" style="display: none;">
            <h4 data-i18n="lastSyncExport">Last Firefox Sync Export</h4>
            <ul>
              <li><span data-i18n="syncExportDate">Date</span>: <span id="syncExportDate"></span></li>
              <li><span data-i18n="syncExportVersion">Version</span>: <span id="syncExportVersion"></span></li>
            </ul>
            <button id="wipeFirefoxSyncExport" class="button danger" data-i18n="wipeFirefoxSyncExport">Wipe Firefox Sync Export</button>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 data-i18n="importSettings">Import Settings</h3>
        <div class="field">
          <div class="info-message">
            <span data-i18n="">Currently it's not possible to request permissions while importing, so if you have notifications, bookmarks context menu, or deletes history preferences in your import, those will get ignored and you have to reconfigure them.</span>
          </div>
          <div class="button-group">
            <button id="importSettings" class="button" data-i18n="importSettings">Import from File</button>
            <button id="importFromFirefoxSync" class="button" data-i18n="importFromFirefoxSync">Import from Firefox Sync</button>
          </div>
        </div>
      </div>
    `;

    if (!section.firstChild) section.appendChild(content);

    // Update sync export info display
    updateSyncExportDisplay();

    // Bind export/import events
    const exportButton = document.getElementById('exportSettings');
    const importButton = document.getElementById('importSettings');
    const exportSyncButton = document.getElementById('exportToFirefoxSync');
    const importSyncButton = document.getElementById('importFromFirefoxSync');
    const wipeSyncButton = document.getElementById('wipeFirefoxSyncExport');

    if (exportButton) {
      exportButton.addEventListener('click', handleExport);
    }

    if (importButton) {
      importButton.addEventListener('click', handleImportFromFile);
    }

    if (exportSyncButton) {
      exportSyncButton.addEventListener('click', handleExportToFirefoxSync);
    }

    if (importSyncButton) {
      importSyncButton.addEventListener('click', handleImportFromFirefoxSync);
    }

    if (wipeSyncButton) {
      wipeSyncButton.addEventListener('click', handleWipeFirefoxSync);
    }

    // Listen for sync storage changes
    browser.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName !== 'sync' || (!changes[SYNC_EXPORT_META_KEY] && !changes[LEGACY_SYNC_EXPORT_KEY])) {
        return;
      }

      try {
        lastSyncExport = await loadSyncExportInfo();
        updateSyncExportDisplay();
      } catch (error) {
        console.error('Error updating sync export info:', error);
      }
    });
  } catch (error) {
    console.error('[ExportImport] Failed to load settings page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadExportImport'));
  }
}

function handleExport(): void {
  browser.permissions
    .request({ permissions: ['downloads'] })
    .catch(err => {
      console.warn('downloads permission request error', err);
      return false as const;
    })
    .then(async granted => {
      // If API returned false (denied) attempt contains to see if already granted previously
      if (granted === false) {
        try {
          const already = await browser.permissions.contains({ permissions: ['downloads'] });
          if (!already) {
            showError(browser.i18n.getMessage('optionsExportImportExportPermissionDenied'));
            return;
          }
        } catch (_e) {
          showError(browser.i18n.getMessage('optionsExportImportExportPermissionDenied'));
          return;
        }
      }
      await performExportWithDownloads();
    });
}

async function performExportWithDownloads(): Promise<void> {
  try {
    const [preferences, { domainRules }, { statistics }] = await Promise.all([
      getPreferences(),
      browser.runtime.sendMessage({ method: 'getDomainRules' }) as Promise<{ domainRules: any[] }>,
      browser.storage.local.get('statistics') as Promise<{ statistics: any }>,
    ]);
    const settings = { preferences, domainRules, statistics };
    const filename = `temporary-containers-settings-${formatDate(new Date())}.json`;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    if (browser.downloads?.download) {
      try {
        const downloadId = await browser.downloads.download({ url, filename, saveAs: true, conflictAction: 'uniquify' });

        const cleanup = () => {
          try {
            URL.revokeObjectURL(url);
          } catch (_e) {
            /* noop */
          }
        };

        const listener = (delta: browser.downloads._OnChangedDownloadDelta) => {
          if (delta.id !== downloadId || !delta.state) return;

          const state = delta.state.current;
          if (state === 'complete') {
            browser.downloads.onChanged.removeListener(listener);
            cleanup();
            showSuccess(browser.i18n.getMessage('optionsExportImportExportSuccess'));
          } else if (state === 'interrupted') {
            browser.downloads.onChanged.removeListener(listener);
            // USER_CANCELED -> silent
            if (delta.error?.current && delta.error.current !== 'USER_CANCELED') {
              console.warn('Download interrupted:', delta.error.current);
            }
            cleanup();
          }
        };
        browser.downloads.onChanged.addListener(listener);

        // Safety timeout: if nothing happens (edge case), cleanup after 60s
        setTimeout(() => {
          if (browser.downloads.onChanged.hasListener(listener)) {
            browser.downloads.onChanged.removeListener(listener);
            cleanup();
          }
        }, 60000);
        return;
      } catch (err) {
        console.error('downloads.download threw before listener setup', err);
        URL.revokeObjectURL(url);
        return;
      }
    }

    // downloads API not available: fallback to anchor method
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess(browser.i18n.getMessage('optionsExportImportExportSuccess'));
  } catch (error) {
    console.error('Error exporting settings:', error);
    showError(`Error exporting settings: ${error?.toString() ?? 'Unknown error'}`);
  }
}

async function handleImportFromFile(): Promise<void> {
  // Create a temporary file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';

  // Handle file selection
  fileInput.addEventListener('change', async event => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

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
          domainRules: settings.domainRules,
        });
      }

      // Import statistics if available
      if (settings.statistics) {
        await browser.storage.local.set({ statistics: settings.statistics });
      }

      showSuccess(browser.i18n.getMessage('optionsExportImportImportSuccess'));
    } catch (error) {
      console.error('Error importing settings:', error);
      showError(`Error importing settings: ${error?.toString() ?? 'Unknown error'}`);
    } finally {
      // Clean up the temporary file input
      document.body.removeChild(fileInput);
    }
  });

  // Add to DOM temporarily and trigger click
  document.body.appendChild(fileInput);
  fileInput.click();
}

async function initializeSyncExportInfo(): Promise<void> {
  try {
    lastSyncExport = await loadSyncExportInfo();
  } catch (error) {
    console.error('Error initializing sync export info:', error);
  }
}

function updateSyncExportDisplay(): void {
  const syncInfo = document.getElementById('lastSyncExportInfo');
  const dateElement = document.getElementById('syncExportDate');
  const versionElement = document.getElementById('syncExportVersion');

  if (!syncInfo || !dateElement || !versionElement) return;

  if (lastSyncExport) {
    syncInfo.style.display = 'block';
    dateElement.textContent = new Date(lastSyncExport.date).toLocaleString();
    versionElement.textContent = lastSyncExport.version;
  } else {
    syncInfo.style.display = 'none';
  }
}

async function handleExportToFirefoxSync(): Promise<void> {
  try {
    // Check if there's already an export in Firefox Sync
    const existingExport = await loadSyncExportInfo();
    if (existingExport) {
      const confirmed = window.confirm(
        `${browser.i18n.getMessage('confirmSyncOverwrite')}\n\n` +
          `${browser.i18n.getMessage('syncExportDate')}: ${new Date(existingExport.date).toLocaleString()}\n` +
          `${browser.i18n.getMessage('syncExportVersion')}: ${existingExport.version}`
      );
      if (!confirmed) {
        return;
      }
    }

    // Get current preferences
    const preferences = await getPreferences();

    // Strip permanent containers from export (similar to the Vue component)
    const exportPreferences = { ...preferences };
    if (exportPreferences.isolation?.global?.excludedContainers) {
      exportPreferences.isolation.global.excludedContainers = [];
    }

    const exportData: ExportedPreferences = {
      version: browser.runtime.getManifest().version,
      date: Date.now(),
      preferences: exportPreferences,
    };

    await saveSyncExport(exportData);

    // Update local state
    lastSyncExport = {
      date: exportData.date,
      version: exportData.version,
    };

    updateSyncExportDisplay();
    showSuccess(browser.i18n.getMessage('exportToFirefoxSyncSuccess'));
  } catch (error) {
    console.error('Error exporting to Firefox Sync:', error);
    showError(`Error exporting to Firefox Sync: ${error?.toString() ?? 'Unknown error'}`);
  }
}

async function handleImportFromFirefoxSync(): Promise<void> {
  try {
    const storedExport = await loadSyncExport();

    if (!storedExport || !Object.keys(storedExport).length) {
      showError(browser.i18n.getMessage('noSyncExportFound'));
      return;
    }

    // Confirm import
    const confirmed = window.confirm(
      `${browser.i18n.getMessage('confirmSyncImport')}\n\n` +
        `${browser.i18n.getMessage('syncExportDate')}: ${new Date(storedExport.date).toLocaleString()}\n` +
        `${browser.i18n.getMessage('syncExportVersion')}: ${storedExport.version}\n\n` +
        'All existing preferences will be overwritten.'
    );

    if (!confirmed) {
      return;
    }

    // Import the preferences
    await saveImportedPreferences(storedExport);
    showSuccess(browser.i18n.getMessage('importFromFirefoxSyncSuccess'));
  } catch (error) {
    console.error('Error importing from Firefox Sync:', error);
    showError(`Error importing from Firefox Sync: ${error?.toString() ?? 'Unknown error'}`);
  }
}

async function handleWipeFirefoxSync(): Promise<void> {
  try {
    const confirmed = window.confirm(browser.i18n.getMessage('confirmSyncWipe'));

    if (!confirmed) {
      return;
    }

    await clearSyncExport();
    lastSyncExport = null;
    updateSyncExportDisplay();
    showSuccess(browser.i18n.getMessage('wipeFirefoxSyncSuccess'));
  } catch (error) {
    console.error('Error wiping Firefox Sync:', error);
    showError(`Error wiping Firefox Sync: ${error?.toString() ?? 'Unknown error'}`);
  }
}

async function saveImportedPreferences(importedPreferences: ExportedPreferences): Promise<void> {
  // Similar to the Vue component, we need to handle permissions restrictions
  // Firefox can't request permissions after async calls in user input handlers
  const preferences = { ...importedPreferences.preferences };

  // Note: In a real implementation, you'd want to check permissions first
  // For now, we'll just save the preferences and let the user reconfigure permissions manually

  await savePreferences(preferences);

  // Send import message to background script if needed for additional processing
  try {
    await browser.runtime.sendMessage({
      method: 'importPreferences',
      payload: {
        preferences: preferences,
        previousVersion: importedPreferences.version,
      },
    });
  } catch (error) {
    // This might fail if the background script doesn't handle this method yet
    console.warn('Background script import handling not available:', error);
  }
}

function getSyncExportChunkKey(index: number): string {
  return `${SYNC_EXPORT_CHUNK_PREFIX}${index}`;
}

function getUtf8Size(value: string): number {
  return new Blob([value]).size;
}

function splitIntoSyncExportChunks(serializedExport: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < serializedExport.length) {
    let low = start + 1;
    let high = serializedExport.length;
    let bestEnd = start;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const size = getUtf8Size(serializedExport.slice(start, mid));

      if (size <= SYNC_EXPORT_CHUNK_MAX_BYTES) {
        bestEnd = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (bestEnd === start) {
      throw new Error('Could not split Firefox Sync export into quota-safe chunks.');
    }

    chunks.push(serializedExport.slice(start, bestEnd));
    start = bestEnd;
  }

  return chunks;
}

async function loadSyncExportInfo(): Promise<SyncExportInfo | null> {
  const result = (await browser.storage.sync.get([SYNC_EXPORT_META_KEY, LEGACY_SYNC_EXPORT_KEY])) as Record<string, any>;
  const chunkedExport = result[SYNC_EXPORT_META_KEY] as ChunkedSyncExportInfo | undefined;

  if (chunkedExport?.date && chunkedExport?.version) {
    return {
      date: chunkedExport.date,
      version: chunkedExport.version,
    };
  }

  const legacyExport = result[LEGACY_SYNC_EXPORT_KEY] as ExportedPreferences | undefined;
  if (legacyExport?.date && legacyExport?.version) {
    return {
      date: legacyExport.date,
      version: legacyExport.version,
    };
  }

  return null;
}

async function loadSyncExport(): Promise<ExportedPreferences | null> {
  const result = (await browser.storage.sync.get([SYNC_EXPORT_META_KEY, LEGACY_SYNC_EXPORT_KEY])) as Record<string, any>;
  const chunkedExport = result[SYNC_EXPORT_META_KEY] as ChunkedSyncExportInfo | undefined;

  if (chunkedExport?.chunkCount) {
    const chunkKeys = Array.from({ length: chunkedExport.chunkCount }, (_, index) => getSyncExportChunkKey(index));
    const chunkResult = (await browser.storage.sync.get(chunkKeys)) as Record<string, unknown>;
    const serializedExport = chunkKeys
      .map(key => {
        const chunk = chunkResult[key];
        if (typeof chunk !== 'string') {
          throw new Error('Firefox Sync export is incomplete.');
        }
        return chunk;
      })
      .join('');

    return JSON.parse(serializedExport) as ExportedPreferences;
  }

  const legacyExport = result[LEGACY_SYNC_EXPORT_KEY] as ExportedPreferences | undefined;
  if (legacyExport && Object.keys(legacyExport).length) {
    return legacyExport;
  }

  return null;
}

async function saveSyncExport(exportData: ExportedPreferences): Promise<void> {
  const serializedExport = JSON.stringify(exportData);
  const exportChunks = splitIntoSyncExportChunks(serializedExport);
  const previousMetaResult = (await browser.storage.sync.get(SYNC_EXPORT_META_KEY)) as Record<string, any>;
  const previousMeta = previousMetaResult[SYNC_EXPORT_META_KEY] as ChunkedSyncExportInfo | undefined;
  const payload: Record<string, unknown> = {
    [SYNC_EXPORT_META_KEY]: {
      date: exportData.date,
      version: exportData.version,
      chunkCount: exportChunks.length,
    },
  };

  exportChunks.forEach((chunk, index) => {
    payload[getSyncExportChunkKey(index)] = chunk;
  });

  await browser.storage.sync.set(payload);

  const keysToRemove = new Set<string>([LEGACY_SYNC_EXPORT_KEY]);
  if (previousMeta?.chunkCount && previousMeta.chunkCount > exportChunks.length) {
    for (let index = exportChunks.length; index < previousMeta.chunkCount; index++) {
      keysToRemove.add(getSyncExportChunkKey(index));
    }
  }

  if (keysToRemove.size > 0) {
    await browser.storage.sync.remove([...keysToRemove]);
  }
}

async function clearSyncExport(): Promise<void> {
  const result = (await browser.storage.sync.get([SYNC_EXPORT_META_KEY, LEGACY_SYNC_EXPORT_KEY])) as Record<string, any>;
  const chunkedExport = result[SYNC_EXPORT_META_KEY] as ChunkedSyncExportInfo | undefined;
  const keysToRemove = new Set<string>([SYNC_EXPORT_META_KEY, LEGACY_SYNC_EXPORT_KEY]);

  if (chunkedExport?.chunkCount) {
    for (let index = 0; index < chunkedExport.chunkCount; index++) {
      keysToRemove.add(getSyncExportChunkKey(index));
    }
  }

  await browser.storage.sync.remove([...keysToRemove]);
}
