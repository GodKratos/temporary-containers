import {
  sendMessage,
  getPreferences,
  savePreferences,
  getPermissions,
  showMessage,
  showError,
  showSuccess,
  showInitializeLoader,
  hideInitializeLoader,
  showInitializeError,
  createTabSystem,
  createGlossarySystem,
  t,
  capitalize
} from './shared/utils';
import { initIsolationGlobalPage } from './pages/IsolationGlobal';
import { initIsolationPerDomainPage } from './pages/IsolationPerDomain';
import { initStatisticsPage } from './pages/Statistics';
import { initActionsPage } from './pages/Actions';

// State
let app: any = {
  initialized: false,
  popup: true,
  storage: null,
  preferences: null,
  permissions: null,
  currentTab: null,
  activeTab: null,
};

// DOM Elements
const elements = {
  app: document.getElementById('app'),
  sidebar: document.getElementById('sidebar'),
  toggleSidebar: document.getElementById('toggle-sidebar'),
  toggleIsolation: document.getElementById('toggle-isolation'),
  openPreferences: document.getElementById('open-preferences'),
  createDeletesHistoryContainer: document.getElementById('create-deletes-history-container'),
  createTmpContainer: document.getElementById('create-tmp-container'),
};

const pageInitializers: Record<string, () => Promise<void>> = {
  'isolation-global': async () => {
    const tab = document.getElementById('isolation-global');
    if (tab) await initIsolationGlobalPage();
  },
  'isolation-domain': async () => {
    const tab = document.getElementById('isolation-domain');
    if (tab) await initIsolationPerDomainPage();
  },
  'statistics': async () => {
    const tab = document.getElementById('statistics');
    if (tab) await initStatisticsPage();
  },
  'actions': async () => {
    const tab = document.getElementById('actions');
    if (tab) await initActionsPage();
  },
};

const glossaryData = {
  'Isolation': `
    <p>Isolation prevents websites from tracking you across different containers.</p>
    <p>When enabled, Temporary Containers will:</p>
    <ul>
      <li>Open websites in new temporary containers based on your isolation settings</li>
      <li>Prevent websites from sharing data between containers</li>
    </ul>
  `,
};

function applyLocalization() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key!);
    if (translation) element.textContent = translation;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = t(key!);
    if (translation) element.setAttribute('title', translation);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = t(key!);
    if (translation) element.setAttribute('placeholder', translation);
  });
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const key = titleElement.getAttribute('data-i18n');
    const translation = t(key!);
    if (translation) document.title = translation;
  }
}

function updateIsolationIcon() {
  if (!elements.toggleIsolation || !app.storage?.isolation) return;
  if (app.storage.isolation.active) {
    elements.toggleIsolation.title = 'Disable Isolation';
    elements.toggleIsolation.setAttribute('data-i18n-title', 'disableIsolation');
    elements.toggleIsolation.innerHTML = '<i class="icon-toggle-on"></i>';
  } else {
    elements.toggleIsolation.title = 'Enable Isolation';
    elements.toggleIsolation.setAttribute('data-i18n-title', 'enableIsolation');
    elements.toggleIsolation.innerHTML = '<i class="icon-toggle-off"></i>';
  }
  applyLocalization();
}

function setupSidebarToggle() {
  if (!elements.sidebar || !elements.toggleSidebar) return;
  // Remove any previous event listeners by replacing with a clone ONCE
  const orig = elements.toggleSidebar;
  const clone = orig.cloneNode(true) as HTMLElement;
  orig.parentNode?.replaceChild(clone, orig);
  elements.toggleSidebar = clone;
  elements.toggleSidebar.addEventListener('click', () => {
    elements.sidebar!.classList.toggle('visible');
    let overlay = document.getElementById('sidebar-overlay');
    if (elements.sidebar!.classList.contains('visible')) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
          elements.sidebar!.classList.remove('visible');
          overlay!.classList.remove('visible');
        });
        const popupContent = document.querySelector('.popup-content');
        if (popupContent) popupContent.appendChild(overlay);
      }
      setTimeout(() => overlay!.classList.add('visible'), 10);
    } else if (overlay) {
      overlay.classList.remove('visible');
    }
  });
}

function setupHeaderActions() {
  // Remove any previous event listeners by replacing the element with its clone
  function replaceWithClone(el: HTMLElement | null) {
    if (!el) return null;
    const clone = el.cloneNode(true) as HTMLElement;
    el.parentNode?.replaceChild(clone, el);
    return clone;
  }

  if (elements.toggleIsolation) {
    elements.toggleIsolation = replaceWithClone(elements.toggleIsolation) as HTMLElement;
    elements.toggleIsolation.addEventListener('click', async () => {
      if (!app.storage) return;
      app.storage.isolation = app.storage.isolation || {};
      app.storage.isolation.active = !app.storage.isolation.active;
      updateIsolationIcon();
      await sendMessage('saveIsolation', { isolation: app.storage.isolation });
    });
    updateIsolationIcon();
  }
  if (elements.openPreferences) {
    elements.openPreferences = replaceWithClone(elements.openPreferences) as HTMLElement;
    elements.openPreferences.addEventListener('click', async () => {
      if (typeof browser !== 'undefined' && browser.tabs) {
        const [tab] = await browser.tabs.query({ url: browser.runtime.getURL('options.html') });
        if (tab && tab.id && tab.windowId) {
          await browser.tabs.update(tab.id, { active: true });
          await browser.tabs.reload(tab.id);
          if (tab.windowId !== browser.windows.WINDOW_ID_CURRENT) {
            await browser.windows.update(tab.windowId, { focused: true });
          }
        } else {
          await browser.tabs.create({ url: browser.runtime.getURL('options.html') });
        }
        window.close();
      }
    });
  }
  if (elements.createDeletesHistoryContainer) {
    elements.createDeletesHistoryContainer = replaceWithClone(elements.createDeletesHistoryContainer) as HTMLElement;
    elements.createDeletesHistoryContainer.classList.remove('hidden');
    elements.createDeletesHistoryContainer.addEventListener('click', () => {
      sendMessage('createTabInTempContainer', { deletesHistory: true });
      window.close();
    });
  }
  if (elements.createTmpContainer) {
    elements.createTmpContainer = replaceWithClone(elements.createTmpContainer) as HTMLElement;
    elements.createTmpContainer.addEventListener('click', () => {
      sendMessage('createTabInTempContainer');
      window.close();
    });
  }
}

function setupSidebarTabs() {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const tabPanels = document.querySelectorAll('.tab-panel');
  sidebarItems.forEach(item => {
    item.addEventListener('click', async () => {
      const tabId = item.getAttribute('data-tab');
      if (!tabId) return;
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      tabPanels.forEach(panel => {
        if (panel.id === tabId) {
          panel.classList.remove('hidden');
          panel.classList.add('active');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('active');
        }
      });
      if (pageInitializers[tabId]) {
        await pageInitializers[tabId]();
      }
      // Hide sidebar after selection
      if (elements.sidebar) elements.sidebar.classList.remove('visible');
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.classList.remove('visible');
    });
  });
}

async function initialize() {
  let initializeLoader = false;
  if (window.location.search.startsWith('?error')) {
    showInitializeError('Initialization error');
    return;
  }
  const loaderTimeout = setTimeout(() => {
    initializeLoader = true;
    showInitializeLoader();
  }, 500);
  try {
    // Check if background script is available
    const pong = await sendMessage('ping');
    if (pong !== 'pong') {
      clearTimeout(loaderTimeout);
      showInitializeError('Background script not responding');
      return;
    }
    // Get permissions
    const permissions = await getPermissions();
    // Get storage data
    let storage;
    try {
      storage = await browser.storage.local.get();
      if (!storage.preferences || !Object.keys(storage.preferences).length) {
        clearTimeout(loaderTimeout);
        showError('Loading preferences failed, please try again');
        return;
      }
    } catch (error) {
      clearTimeout(loaderTimeout);
      showError(`Loading preferences failed, please try again. ${error}`);
      return;
    }
    // Get current tab
    const currentTab = await browser.tabs.getCurrent();
    // Get active tab
    const [activeTab] = await browser.tabs.query({ currentWindow: true, active: true });
    // Add parsed URL to active tab
    let parsedUrl: URL | undefined = undefined;
    if (activeTab.url) {
      parsedUrl = new URL(activeTab.url);
    }
    // Update app state
    app = {
      initialized: true,
      popup: true,
      storage,
      preferences: storage.preferences,
      permissions,
      currentTab,
      activeTab: { ...activeTab, parsedUrl },
    };
    // Apply localization
    applyLocalization();
    // Setup sidebar toggle and overlay
    setupSidebarToggle();
    // Setup header action buttons
    setupHeaderActions();
    // Setup sidebar tab navigation
    setupSidebarTabs();
    // Initialize glossary
    createGlossarySystem(glossaryData);
    // Set default tab based on preferences
    let defaultTab = 'isolation-global';
    if (app.preferences?.ui?.popupDefaultTab) {
      defaultTab = app.preferences.ui.popupDefaultTab;
    }
    const defaultTabBtn = document.querySelector(`.sidebar-item[data-tab="${defaultTab}"]`);
    if (defaultTabBtn) {
      (defaultTabBtn as HTMLElement).click();
    } else {
      const firstTab = document.querySelector('.sidebar-item');
      if (firstTab) (firstTab as HTMLElement).click();
    }
    clearTimeout(loaderTimeout);
    if (initializeLoader) hideInitializeLoader();
  } catch (error) {
    clearTimeout(loaderTimeout);
    showInitializeError(error instanceof Error ? error.message : String(error));
  }
}

document.addEventListener('DOMContentLoaded', initialize);
