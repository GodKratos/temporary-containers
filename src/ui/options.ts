// Entry point for the Options UI (TypeScript)
import { initGeneralPage } from './pages/General';
import { initIsolationGlobalPage } from './pages/IsolationGlobal';
import { initIsolationPerDomainPage } from './pages/IsolationPerDomain';
import { initAdvancedMiscPage } from './pages/AdvancedMisc';
import { initAdvancedCookiesPage } from './pages/AdvancedCookies';
import { initAdvancedScriptsPage } from './pages/AdvancedScripts';
import { initAdvancedDeleteHistoryPage } from './pages/AdvancedDeleteHistory';
import { initStatisticsPage } from './pages/Statistics';
import { initExportImportPage } from './pages/ExportImport';
import {
  createTabSystem,
  showInitializeLoader,
  showInitializeError,
  hideInitializeLoader,
  applyLocalization,
  withManagedStorage,
} from './shared/utils';

// Map tab IDs to page initializers (wrapped with managed storage support)
const pageInitializers: Record<string, () => Promise<void>> = {
  general: withManagedStorage(initGeneralPage),
  'isolation-global': withManagedStorage(initIsolationGlobalPage),
  'isolation-domain': withManagedStorage(initIsolationPerDomainPage),
  'advanced-misc': withManagedStorage(initAdvancedMiscPage),
  'advanced-cookies': withManagedStorage(initAdvancedCookiesPage),
  'advanced-scripts': withManagedStorage(initAdvancedScriptsPage),
  'advanced-delete-history': withManagedStorage(initAdvancedDeleteHistoryPage),
  statistics: withManagedStorage(initStatisticsPage),
  'export-import': withManagedStorage(initExportImportPage),
};

async function initializeOptionsUI() {
  try {
    showInitializeLoader();
    // Setup tab system
    createTabSystem('.nav-button', '.content-section', async tabId => {
      if (pageInitializers[tabId]) {
        await pageInitializers[tabId]();
      }
      // Apply localization after tab/page change
      applyLocalization();
    });
    // Initialize the default tab (General) with managed storage support
    await pageInitializers['general']();
    applyLocalization();
    hideInitializeLoader();
  } catch (error) {
    showInitializeError(error instanceof Error ? error.message : String(error));
  }
}

document.addEventListener('DOMContentLoaded', initializeOptionsUI);
