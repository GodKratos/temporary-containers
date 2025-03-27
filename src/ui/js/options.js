/**
 * Options page for Temporary Containers
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
  createAccordionSystem,
  formatDate,
  t,
  capitalize,
  createMultiSelect,
  createTagInput
} from './utils.js';

import {
  CONTAINER_COLORS,
  CONTAINER_ICONS,
  TOOLBAR_ICON_COLORS,
  IGNORED_DOMAINS_DEFAULT,
  REDIRECTOR_DOMAINS_DEFAULT,
} from './shared.js';

// State
let app = {
  initialized: false,
  storage: null,
  preferences: null,
  permissions: null,
  currentTab: null,
};

// DOM Elements
const elements = {
  app: document.getElementById('app'),
  message: document.getElementById('message'),
  messageContainer: document.getElementById('message-container'),
  initializeLoader: document.getElementById('initialize-loader'),
  initializeError: document.getElementById('initialize-error'),
  containerCounter: document.getElementById('containerCounter'),
  resetContainerNumber: document.getElementById('resetContainerNumber'),
};

// Glossary data
const glossaryData = {
  'Automatic Mode': `
    <p>When enabled, Temporary Containers will automatically open new tabs in temporary containers.</p>
    <p>This applies to:</p>
    <ul>
      <li>Clicking the "+" button to open a new tab</li>
      <li>Middle-clicking or Ctrl+clicking on links (configurable in Isolation settings)</li>
    </ul>
  `,
  'Toolbar Popup': `
    <p>When enabled, clicking the Temporary Containers toolbar icon will open a popup with quick actions and settings.</p>
    <p>When disabled, clicking the toolbar icon will immediately open a new tab in a temporary container.</p>
  `,
};

/**
 * Initialize the options page
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
    
    // Update app state
    app = {
      initialized: true,
      storage,
      preferences: storage.preferences,
      permissions,
      currentTab,
    };
    
    // Initialize UI
    initializeUI();
    
    // Hide loader
    clearTimeout(loaderTimeout);
    if (initializeLoader) {
      hideInitializeLoader();
    }
    
    // Check for installed parameter
    if (window.location.search === '?installed') {
      showSuccess('Temporary Containers has been installed successfully!');
    }
  } catch (error) {
    clearTimeout(loaderTimeout);
    console.error('Initialization error:', error);
    showInitializeError(error);
  }
}

/**
 * Initialize the UI components
 */
function initializeUI() {
  // Set up tab system
  createTabSystem('.tab-button', '.tab-panel');
  
  // Set up glossary system
  createGlossarySystem(glossaryData);
  
  // Set up accordion system
  createAccordionSystem('.accordion');
  
  // Initialize form fields
  initializeFormFields();
  
  // Initialize statistics
  initializeStatistics();
  
  // Initialize export/import
  initializeExportImport();
  
  // Initialize isolation settings
  initializeIsolation();
  
  // Initialize advanced settings
  initializeAdvanced();
  
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
 * Initialize the form fields with values from preferences
 */
function initializeFormFields() {
  // General settings
  const prefs = app.preferences;
  
  // Automatic mode
  const automaticMode = document.getElementById('automaticMode');
  automaticMode.checked = prefs.automaticMode.active;
  automaticMode.addEventListener('change', () => {
    prefs.automaticMode.active = automaticMode.checked;
    savePreferences(prefs);
  });
  
  // Browser action popup
  const browserActionPopup = document.getElementById('browserActionPopup');
  browserActionPopup.checked = prefs.browserActionPopup;
  browserActionPopup.addEventListener('change', () => {
    prefs.browserActionPopup = browserActionPopup.checked;
    savePreferences(prefs);
  });
  
  // Notifications
  const notificationsCheckbox = document.getElementById('notificationsCheckbox');
  notificationsCheckbox.checked = prefs.notifications;
  notificationsCheckbox.addEventListener('change', async () => {
    if (notificationsCheckbox.checked && !app.permissions.notifications) {
      const granted = await requestPermission('notifications');
      if (granted) {
        app.permissions.notifications = true;
        prefs.notifications = true;
      } else {
        notificationsCheckbox.checked = false;
        prefs.notifications = false;
      }
    } else {
      prefs.notifications = notificationsCheckbox.checked;
    }
    savePreferences(prefs);
  });
  
  // Container name prefix
  const containerNamePrefix = document.getElementById('containerNamePrefix');
  containerNamePrefix.value = prefs.container.namePrefix;
  containerNamePrefix.addEventListener('change', () => {
    prefs.container.namePrefix = containerNamePrefix.value;
    savePreferences(prefs);
  });
  
  // Container color random
  const containerColorRandom = document.getElementById('containerColorRandom');
  containerColorRandom.checked = prefs.container.colorRandom;
  containerColorRandom.addEventListener('change', () => {
    prefs.container.colorRandom = containerColorRandom.checked;
    
    // Toggle visibility of color sections
    const colorSection = document.getElementById('containerColorSection');
    const colorRandomExcludedSection = document.getElementById('containerColorRandomExcludedSection');
    
    if (containerColorRandom.checked) {
      colorSection.classList.add('hidden');
      colorRandomExcludedSection.classList.remove('hidden');
    } else {
      colorSection.classList.remove('hidden');
      colorRandomExcludedSection.classList.add('hidden');
    }
    
    savePreferences(prefs);
  });
  
  // Container color
  const containerColor = document.getElementById('containerColor');
  const containerColors = CONTAINER_COLORS.map(color => ({
    id: color,
    text: t(`optionsGeneralContainerColor${capitalize(color)}`) || capitalize(color),
  }));
  
  containerColors.forEach(color => {
    const option = document.createElement('option');
    option.value = color.id;
    option.textContent = color.text;
    containerColor.appendChild(option);
  });
  
  containerColor.value = prefs.container.color;
  containerColor.addEventListener('change', () => {
    prefs.container.color = containerColor.value;
    savePreferences(prefs);
  });
  
  // Container color random excluded
  const containerColorRandomExcluded = document.getElementById('containerColorRandomExcluded');
  createMultiSelect(
    containerColorRandomExcluded,
    containerColors,
    prefs.container.colorRandomExcluded,
    (addedColor) => {
      if (!prefs.container.colorRandomExcluded.includes(addedColor)) {
        prefs.container.colorRandomExcluded.push(addedColor);
        savePreferences(prefs);
      }
    },
    (removedColor) => {
      const index = prefs.container.colorRandomExcluded.findIndex(color => color === removedColor);
      if (index !== -1) {
        prefs.container.colorRandomExcluded.splice(index, 1);
        savePreferences(prefs);
      }
    }
  );
  
  // Container icon random
  const containerIconRandom = document.getElementById('containerIconRandom');
  containerIconRandom.checked = prefs.container.iconRandom;
  containerIconRandom.addEventListener('change', () => {
    prefs.container.iconRandom = containerIconRandom.checked;
    
    // Toggle visibility of icon sections
    const iconSection = document.getElementById('containerIconSection');
    const iconRandomExcludedSection = document.getElementById('containerIconRandomExcludedSection');
    
    if (containerIconRandom.checked) {
      iconSection.classList.add('hidden');
      iconRandomExcludedSection.classList.remove('hidden');
    } else {
      iconSection.classList.remove('hidden');
      iconRandomExcludedSection.classList.add('hidden');
    }
    
    savePreferences(prefs);
  });
  
  // Container icon
  const containerIcon = document.getElementById('containerIcon');
  const containerIcons = CONTAINER_ICONS.map(icon => ({
    id: icon,
    text: t(`optionsGeneralContainerIcon${capitalize(icon)}`) || capitalize(icon),
  }));
  
  containerIcons.forEach(icon => {
    const option = document.createElement('option');
    option.value = icon.id;
    option.textContent = icon.text;
    containerIcon.appendChild(option);
  });
  
  containerIcon.value = prefs.container.icon;
  containerIcon.addEventListener('change', () => {
    prefs.container.icon = containerIcon.value;
    savePreferences(prefs);
  });
  
  // Container icon random excluded
  const containerIconRandomExcluded = document.getElementById('containerIconRandomExcluded');
  createMultiSelect(
    containerIconRandomExcluded,
    containerIcons,
    prefs.container.iconRandomExcluded,
    (addedIcon) => {
      if (!prefs.container.iconRandomExcluded.includes(addedIcon)) {
        prefs.container.iconRandomExcluded.push(addedIcon);
        savePreferences(prefs);
      }
    },
    (removedIcon) => {
      const index = prefs.container.iconRandomExcluded.findIndex(icon => icon === removedIcon);
      if (index !== -1) {
        prefs.container.iconRandomExcluded.splice(index, 1);
        savePreferences(prefs);
      }
    }
  );
  
  // Container number mode
  const containerNumberMode = document.getElementById('containerNumberMode');
  containerNumberMode.value = prefs.container.numberMode;
  containerNumberMode.addEventListener('change', () => {
    prefs.container.numberMode = containerNumberMode.value;
    
    // Toggle visibility of container number reset section
    const containerNumberResetSection = document.getElementById('containerNumberResetSection');
    if (prefs.container.numberMode === 'keep') {
      containerNumberResetSection.classList.remove('hidden');
    } else {
      containerNumberResetSection.classList.add('hidden');
    }
    
    savePreferences(prefs);
  });
  
  // Container counter
  if (elements.containerCounter) {
    elements.containerCounter.textContent = app.storage.tempContainerCounter || 0;
  }
  
  // Reset container number
  if (elements.resetContainerNumber) {
    elements.resetContainerNumber.addEventListener('click', () => {
      if (confirm(`Reset current number ${app.storage.tempContainerCounter} to 0?`)) {
        sendMessage('resetContainerNumber');
        app.storage.tempContainerCounter = 0;
        elements.containerCounter.textContent = 0;
      }
    });
  }
  
  // Container removal
  const containerRemoval = document.getElementById('containerRemoval');
  containerRemoval.value = prefs.container.removal;
  containerRemoval.addEventListener('change', () => {
    prefs.container.removal = parseInt(containerRemoval.value, 10);
    savePreferences(prefs);
  });
  
  // Icon color
  const iconColor = document.getElementById('iconColor');
  const toolbarIconColors = TOOLBAR_ICON_COLORS.map(color => ({
    id: color,
    text: t(`optionsGeneralToolbarIconColor${capitalize(color).replace('-s', 'S')}`) || capitalize(color).replace('-', ' '),
  }));
  
  toolbarIconColors.forEach(color => {
    const option = document.createElement('option');
    option.value = color.id;
    option.textContent = color.text;
    iconColor.appendChild(option);
  });
  
  iconColor.value = prefs.iconColor;
  iconColor.addEventListener('change', () => {
    prefs.iconColor = iconColor.value;
    savePreferences(prefs);
  });
  
  // Set initial visibility based on preferences
  if (prefs.container.colorRandom) {
    document.getElementById('containerColorSection').classList.add('hidden');
    document.getElementById('containerColorRandomExcludedSection').classList.remove('hidden');
  } else {
    document.getElementById('containerColorSection').classList.remove('hidden');
    document.getElementById('containerColorRandomExcludedSection').classList.add('hidden');
  }
  
  if (prefs.container.iconRandom) {
    document.getElementById('containerIconSection').classList.add('hidden');
    document.getElementById('containerIconRandomExcludedSection').classList.remove('hidden');
  } else {
    document.getElementById('containerIconSection').classList.remove('hidden');
    document.getElementById('containerIconRandomExcludedSection').classList.add('hidden');
  }
  
  if (prefs.container.numberMode === 'keep') {
    document.getElementById('containerNumberResetSection').classList.remove('hidden');
  } else {
    document.getElementById('containerNumberResetSection').classList.add('hidden');
  }
}

/**
 * Initialize the statistics tab
 */
function initializeStatistics() {
  // This will be implemented in a future update
  const statisticsTab = document.getElementById('statistics');
  
  if (statisticsTab && app.storage.statistics) {
    const stats = app.storage.statistics;
    
    statisticsTab.innerHTML = `
      <div class="statistics-grid">
        <div class="statistic-card">
          <div class="statistic-value">${stats.containersDeleted || 0}</div>
          <div class="statistic-label">Containers Deleted</div>
        </div>
        <div class="statistic-card">
          <div class="statistic-value">${stats.cookiesDeleted || 0}</div>
          <div class="statistic-label">Cookies Deleted</div>
        </div>
        <div class="statistic-card">
          <div class="statistic-value">${stats.cacheDeleted || 0}</div>
          <div class="statistic-label">Cache Deleted</div>
        </div>
        <div class="statistic-card">
          <div class="statistic-value">${stats.deletesHistory?.containersDeleted || 0}</div>
          <div class="statistic-label">History Containers Deleted</div>
        </div>
        <div class="statistic-card">
          <div class="statistic-value">${stats.deletesHistory?.cookiesDeleted || 0}</div>
          <div class="statistic-label">History Cookies Deleted</div>
        </div>
        <div class="statistic-card">
          <div class="statistic-value">${stats.deletesHistory?.urlsDeleted || 0}</div>
          <div class="statistic-label">URLs Deleted</div>
        </div>
      </div>
      <div class="start-time">
        <p>Statistics collected since: ${formatDate(stats.startTime)}</p>
      </div>
    `;
  }
}

/**
 * Initialize the export/import tab
 */
function initializeExportImport() {
  // This will be implemented in a future update
  const exportImportTab = document.getElementById('export-import');
  
  if (exportImportTab) {
    exportImportTab.innerHTML = `
      <div class="export-import-buttons">
        <button id="exportButton" class="button-default">Export Preferences</button>
        <button id="importButton" class="button-default">Import Preferences</button>
      </div>
      <div id="importArea" class="hidden">
        <p>Paste your exported preferences below:</p>
        <textarea id="importTextarea" class="import-area"></textarea>
        <div class="import-actions">
          <button id="confirmImport" class="button-default button-primary">Import</button>
          <button id="cancelImport" class="button-default button-ghost">Cancel</button>
        </div>
      </div>
    `;
    
    // Export button
    const exportButton = document.getElementById('exportButton');
    exportButton.addEventListener('click', () => {
      const exportData = JSON.stringify(app.preferences, null, 2);
      
      // Create a download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temporary-containers-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Preferences exported successfully');
    });
    
    // Import button
    const importButton = document.getElementById('importButton');
    const importArea = document.getElementById('importArea');
    const importTextarea = document.getElementById('importTextarea');
    const confirmImport = document.getElementById('confirmImport');
    const cancelImport = document.getElementById('cancelImport');
    
    importButton.addEventListener('click', () => {
      importArea.classList.remove('hidden');
    });
    
    cancelImport.addEventListener('click', () => {
      importArea.classList.add('hidden');
      importTextarea.value = '';
    });
    
    confirmImport.addEventListener('click', () => {
      try {
        const importData = JSON.parse(importTextarea.value);
        
        // Validate import data
        if (!importData || typeof importData !== 'object') {
          throw new Error('Invalid import data');
        }
        
        // Update preferences
        app.preferences = importData;
        savePreferences(app.preferences);
        
        // Hide import area
        importArea.classList.add('hidden');
        importTextarea.value = '';
        
        // Show success message
        showSuccess('Preferences imported successfully');
        
        // Reload page to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        showError(`Import failed: ${error.message}`);
      }
    });
  }
}

/**
 * Initialize the isolation tab
 */
function initializeIsolation() {
  // This will be implemented in a future update
  // For now, we'll just add a placeholder
  const isolationTab = document.getElementById('isolation');
  
  if (isolationTab) {
    isolationTab.innerHTML = `
      <p>Isolation settings will be loaded dynamically.</p>
    `;
  }
}

/**
 * Initialize the advanced tab
 */
function initializeAdvanced() {
  // This will be implemented in a future update
  // For now, we'll just add a placeholder
  const advancedTab = document.getElementById('advanced');
  
  if (advancedTab) {
    advancedTab.innerHTML = `
      <p>Advanced settings will be loaded dynamically.</p>
    `;
  }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
