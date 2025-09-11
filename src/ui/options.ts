// Entry point for the Options UI (TypeScript)
import { initGeneralPage } from './pages/General';
import { initIsolationGlobalPage } from './pages/IsolationGlobal';
import { initIsolationPerDomainPage } from './pages/IsolationPerDomain';
import { initAdvancedMiscPage } from './pages/AdvancedMisc';
import { initAdvancedCookiesPage } from './pages/AdvancedCookies';
import { initStatisticsPage } from './pages/Statistics';
import { initExportImportPage } from './pages/ExportImport';
import { createTabSystem, showInitializeLoader, showInitializeError, hideInitializeLoader, applyLocalization } from './shared/utils';

// Map tab IDs to page initializers
const pageInitializers: Record<string, () => Promise<void>> = {
  'general': initGeneralPage,
  'isolation-global': initIsolationGlobalPage,
  'isolation-domain': initIsolationPerDomainPage,
  'advanced-misc': initAdvancedMiscPage,
  'advanced-cookies': initAdvancedCookiesPage,
  'statistics': initStatisticsPage,
  'export-import': initExportImportPage,
};

async function initializeOptionsUI() {
  try {
    showInitializeLoader();
    // Setup tab system
    createTabSystem('.nav-button', '.content-section', async (tabId) => {
      if (pageInitializers[tabId]) {
        await pageInitializers[tabId]();
      }
      // Apply localization after tab/page change
      applyLocalization();
    });
    // Initialize the default tab (General)
    await initGeneralPage();
    applyLocalization();
    hideInitializeLoader();
  } catch (error) {
    showInitializeError(error instanceof Error ? error.message : String(error));
  }
}

document.addEventListener('DOMContentLoaded', initializeOptionsUI);
