/**
 * Popup page for Temporary Containers
 */
import {
  sendMessage,
  getPreferences,
  savePreferences,
  getPermissions,
  requestPermission,
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
} from './utils.js';

// Import shared constants if needed
import {
  CONTAINER_COLORS,
  CONTAINER_ICONS,
  TOOLBAR_ICON_COLORS
} from './shared.js';

// Import shared modules
import { initializeIsolationGlobalTab } from './modules/isolation-global.js';
import { initializeIsolationPerDomainTab } from './modules/isolation-per-domain.js';
import { initializeStatisticsTab, updateStatisticsDisplay } from './modules/statistics.js';

// State
let app = {
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

// Glossary data
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

/**
 * Initialize the popup page
 */
async function initialize() {
  let initializeLoader = false;
  
  if (window.location.search.startsWith('?error')) {
    showInitializeError();
    return;
  }
  
  // Show loader after a short delay if initialization takes time
  const loaderTimeout = setTimeout(() => {
    initializeLoader = true;
    showInitializeLoader();
  }, 500);
  
  try {
    // Check if background script is available
    const pong = await sendMessage('ping');
    if (pong !== 'pong') {
      clearTimeout(loaderTimeout);
      showInitializeError(new Error('Background script not responding'));
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
      showError(`Loading preferences failed, please try again. ${error.toString()}`);
      return;
    }
    
    // Get current tab
    const currentTab = await browser.tabs.getCurrent();
    
    // Get active tab
    const [activeTab] = await browser.tabs.query({
      currentWindow: true,
      active: true,
    });
    
    // Add parsed URL to active tab
    const parsedUrl = new URL(activeTab.url);
    
    // Update app state
    app = {
      initialized: true,
      popup: true,
      storage,
      preferences: storage.preferences,
      permissions,
      currentTab,
      activeTab: {
        ...activeTab,
        parsedUrl,
      },
    };
    
    // Apply localization to the page
    applyLocalization();
    
    // Initialize UI
    initializeUI();
    
    // Hide loader
    clearTimeout(loaderTimeout);
    if (initializeLoader) {
      hideInitializeLoader();
    }
  } catch (error) {
    clearTimeout(loaderTimeout);
    console.error('Initialization error:', error);
    showInitializeError(error);
  }
}

/**
 * Apply localization to all elements with data-i18n attributes
 */
function applyLocalization() {
  // Localize text content
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) {
      element.textContent = translation;
    }
  });
  
  // Localize titles/tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = t(key);
    if (translation) {
      element.setAttribute('title', translation);
    }
  });
  
  // Localize placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation) {
      element.setAttribute('placeholder', translation);
    }
  });
  
  // Update document title
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const key = titleElement.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) {
      document.title = translation;
    }
  }
}

/**
 * Initialize the UI components
 */
function initializeUI() {
  // Set up tab system for sidebar
  initializeSidebar();
  
  // Set up glossary system
  createGlossarySystem(glossaryData);
  
  // Initialize action buttons
  initializeActions();
  
  // Initialize tab content
  initializeTabContent();
  
  // Set up message listener for preference updates
  browser.runtime.onMessage.addListener(message => {
    if (typeof message !== 'object') {
      return;
    }
    
    if (
      message.info &&
      message.info === 'preferencesUpdated' &&
      (!message.fromTabId || message.fromTabId !== app.currentTab.id)
    ) {
      initialize();
    }
  });
}

/**
 * Initialize the sidebar
 */
function initializeSidebar() {
  // Toggle sidebar
  elements.toggleSidebar.addEventListener('click', () => {
    elements.sidebar.classList.toggle('visible');
    
    // Add overlay when sidebar is visible
    if (elements.sidebar.classList.contains('visible')) {
      // Create overlay if it doesn't exist
      let overlay = document.getElementById('sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
          elements.sidebar.classList.remove('visible');
          overlay.classList.remove('visible');
        });
        document.querySelector('.popup-content').appendChild(overlay);
      }
      // Show overlay
      setTimeout(() => {
        overlay.classList.add('visible');
      }, 10);
    } else {
      // Hide overlay
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) {
        overlay.classList.remove('visible');
      }
    }
  });
  
  // Set up tab navigation
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      
      // Update active sidebar item
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Update active panel
      tabPanels.forEach(panel => {
        if (panel.id === tabId) {
          panel.classList.remove('hidden');
          panel.classList.add('active');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('active');
        }
      });
      
      // Hide sidebar after selection
      elements.sidebar.classList.remove('visible');
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) {
        overlay.classList.remove('visible');
      }
    });
  });
  
  // Set default active tab based on preferences
  if (app.preferences.ui && app.preferences.ui.popupDefaultTab) {
    const defaultTab = document.querySelector(`[data-tab="${app.preferences.ui.popupDefaultTab}"]`);
    if (defaultTab) {
      defaultTab.click();
    }
  } else {
    // Set first tab as active by default
    const firstTab = document.querySelector('.sidebar-item');
    if (firstTab) {
      firstTab.classList.add('active');
    }
  }
}

/**
 * Initialize the action buttons
 */
function initializeActions() {
  // Toggle isolation
  elements.toggleIsolation.addEventListener('click', () => {
    app.storage.isolation.active = !app.storage.isolation.active;
    updateIsolationIcon();
    
    sendMessage('saveIsolation', {
      isolation: app.storage.isolation,
    });
  });
  
  // Update isolation icon
  updateIsolationIcon();
  
  // Open preferences
  elements.openPreferences.addEventListener('click', async () => {
    const [tab] = await browser.tabs.query({
      url: browser.runtime.getURL('options.html'),
    });
    
    if (tab && tab.id && tab.windowId) {
      await browser.tabs.update(tab.id, { active: true });
      await browser.tabs.reload(tab.id);
      
      if (tab.windowId !== browser.windows.WINDOW_ID_CURRENT) {
        await browser.windows.update(tab.windowId, { focused: true });
      }
    } else {
      await browser.tabs.create({
        url: browser.runtime.getURL('options.html'),
      });
    }
    
    window.close();
  });
  
  // Create deletes history container
  if (app.permissions.history) {
    elements.createDeletesHistoryContainer.classList.remove('hidden');
    elements.createDeletesHistoryContainer.addEventListener('click', () => {
      sendMessage('createTabInTempContainer', {
        deletesHistory: true,
      });
      
      window.close();
    });
  }
  
  // Create temporary container
  elements.createTmpContainer.addEventListener('click', () => {
    sendMessage('createTabInTempContainer');
    window.close();
  });
}

/**
 * Update the isolation icon based on current state
 */
function updateIsolationIcon() {
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

/**
 * Initialize the tab content
 */
function initializeTabContent() {
  // Initialize isolation global tab
  const isolationGlobalTab = document.getElementById('isolation-global');
  if (isolationGlobalTab) {
    initializeIsolationGlobalTab(isolationGlobalTab, app.preferences, async (preferences) => {
      await savePreferences(preferences);
    });
  }
  
  // Initialize isolation per domain tab
  const isolationPerDomainTab = document.getElementById('isolation-per-domain');
  if (isolationPerDomainTab) {
    initializeIsolationPerDomainTab(isolationPerDomainTab, app.preferences, async (preferences) => {
      await savePreferences(preferences);
    }, {
      currentDomain: app.activeTab?.parsedUrl?.hostname,
      isPopup: true,
      onReload: () => {
        // Reload the popup
        initialize();
      }
    });
  }
  
  // Initialize actions tab
  initializeActionsTab();
  
  // Initialize statistics tab
  const statisticsTab = document.getElementById('statistics');
  if (statisticsTab) {
    initializeStatisticsTab(statisticsTab, app.storage.statistics, async () => {
      try {
        await sendMessage('resetStatistics');
        app.storage.statistics = await sendMessage('getStatistics');
        // Reload the popup to refresh statistics
        initialize();
      } catch (error) {
        console.error('Error resetting statistics:', error);
        showError(`Error resetting statistics: ${error.toString()}`);
      }
    }, {
      showResetButton: false
    });
  }
}



/**
 * Initialize the actions tab
 */
function initializeActionsTab() {
  const actionsTab = document.getElementById('actions');
  
  if (actionsTab) {
    // Create content
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="actions-grid">
        <div class="action-card" id="action-new-tmp">
          <div class="action-icon">
            <i class="icon-plus"></i>
          </div>
          <div class="action-label" data-i18n="newTemporaryContainer">New Temporary Container</div>
        </div>
        
        ${app.permissions.history ? `
          <div class="action-card" id="action-new-history-tmp">
            <div class="action-icon">
              <i class="icon-user-secret"></i>
            </div>
            <div class="action-label" data-i18n="newDeletesHistoryContainer">New Deletes History Container</div>
          </div>
        ` : ''}
        
        <div class="action-card" id="action-open-preferences">
          <div class="action-icon">
            <i class="icon-cog-alt"></i>
          </div>
          <div class="action-label" data-i18n="openPreferences">Open Preferences</div>
        </div>
        
        <div class="action-card" id="action-toggle-isolation">
          <div class="action-icon">
            ${app.storage.isolation.active ? 
              '<i class="icon-toggle-on"></i>' : 
              '<i class="icon-toggle-off"></i>'
            }
          </div>
          <div class="action-label" data-i18n="${app.storage.isolation.active ? 'disableIsolation' : 'enableIsolation'}">
            ${app.storage.isolation.active ? 'Disable Isolation' : 'Enable Isolation'}
          </div>
        </div>
      </div>
    `;
    
    actionsTab.appendChild(content);
    
    // Apply localization to the new content
    applyLocalization();
    
    // Add event listeners
    const newTmpAction = content.querySelector('#action-new-tmp');
    const newHistoryTmpAction = content.querySelector('#action-new-history-tmp');
    const openPreferencesAction = content.querySelector('#action-open-preferences');
    const toggleIsolationAction = content.querySelector('#action-toggle-isolation');
    
    newTmpAction.addEventListener('click', () => {
      sendMessage('createTabInTempContainer');
      window.close();
    });
    
    if (newHistoryTmpAction) {
      newHistoryTmpAction.addEventListener('click', () => {
        sendMessage('createTabInTempContainer', {
          deletesHistory: true,
        });
        window.close();
      });
    }
    
    openPreferencesAction.addEventListener('click', async () => {
      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('options.html'),
      });
      
      if (tab && tab.id && tab.windowId) {
        await browser.tabs.update(tab.id, { active: true });
        await browser.tabs.reload(tab.id);
        
        if (tab.windowId !== browser.windows.WINDOW_ID_CURRENT) {
          await browser.windows.update(tab.windowId, { focused: true });
        }
      } else {
        await browser.tabs.create({
          url: browser.runtime.getURL('options.html'),
        });
      }
      
      window.close();
    });
    
    toggleIsolationAction.addEventListener('click', () => {
      app.storage.isolation.active = !app.storage.isolation.active;
      
      sendMessage('saveIsolation', {
        isolation: app.storage.isolation,
      });
      
      // Update UI
      const icon = toggleIsolationAction.querySelector('.action-icon');
      const label = toggleIsolationAction.querySelector('.action-label');
      
      if (app.storage.isolation.active) {
        icon.innerHTML = '<i class="icon-toggle-on"></i>';
        label.setAttribute('data-i18n', 'disableIsolation');
        label.textContent = 'Disable Isolation';
      } else {
        icon.innerHTML = '<i class="icon-toggle-off"></i>';
        label.setAttribute('data-i18n', 'enableIsolation');
        label.textContent = 'Enable Isolation';
      }
      
      // Update header icon
      updateIsolationIcon();
    });
  }
}


// Initialize the popup page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
