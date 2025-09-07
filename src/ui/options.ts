// Entry point for the Options UI (TypeScript)
import { initGeneralPage } from './pages/General';
import { initIsolationGlobalPage } from './pages/IsolationGlobal';
import { initIsolationPerDomainPage } from './pages/IsolationPerDomain';
import { initAdvancedContainerPage } from './pages/AdvancedContainer';
import { initAdvancedCookiesPage } from './pages/AdvancedCookies';
import { initAdvancedMiscPage } from './pages/AdvancedMisc';
import { initStatisticsPage } from './pages/Statistics';
import { initExportImportPage } from './pages/ExportImport';
import { createTabSystem, showInitializeLoader, showInitializeError, hideInitializeLoader } from './shared/utils';

// Map tab IDs to page initializers
const pageInitializers: Record<string, () => Promise<void>> = {
  'general': initGeneralPage,
  'isolation-global': initIsolationGlobalPage,
  'isolation-per-domain': initIsolationPerDomainPage,
  'advanced-container': initAdvancedContainerPage,
  'advanced-cookies': initAdvancedCookiesPage,
  'advanced-misc': initAdvancedMiscPage,
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
    });
    // Initialize the default tab (General)
    await initGeneralPage();
    hideInitializeLoader();
  } catch (error) {
    showInitializeError(error instanceof Error ? error.message : String(error));
  }
}

document.addEventListener('DOMContentLoaded', initializeOptionsUI);
