// Entry point for the Popup UI (TypeScript)
import { initIsolationGlobalPage } from './pages/IsolationGlobal';
import { initIsolationPerDomainPage } from './pages/IsolationPerDomain';
import { initStatisticsPage } from './pages/Statistics';
import { initActionsPage } from './pages/Actions';
import { createTabSystem, showInitializeLoader, hideInitializeLoader, showInitializeError } from './shared/utils';

// Map tab IDs to page initializers
const pageInitializers: Record<string, () => Promise<void>> = {
  'isolation-global': initIsolationGlobalPage,
  'isolation-per-domain': initIsolationPerDomainPage,
  'statistics': initStatisticsPage,
  'actions': initActionsPage,
};

async function initializePopupUI() {
  try {
    showInitializeLoader();
    // Setup tab system
    createTabSystem('.tab-button', '.tab-panel', async (tabId) => {
      if (pageInitializers[tabId]) {
        await pageInitializers[tabId]();
      }
    });
    // Initialize the default tab (Isolation: Global)
    await initIsolationGlobalPage();
    hideInitializeLoader();
  } catch (error) {
    showInitializeError(error instanceof Error ? error.message : String(error));
  }
}

document.addEventListener('DOMContentLoaded', initializePopupUI);
