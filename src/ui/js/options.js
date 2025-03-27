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
  preferences: null,
  permissions: null,
  statistics: null,
  domainRules: [],
  activeSection: 'general',
  themeMode: 'light'
};

// DOM Elements
const elements = {
  // Navigation buttons
  navButtons: document.querySelectorAll('.nav-button'),
  
  // Content sections
  contentSections: document.querySelectorAll('.content-section'),
  
  // General settings
  automaticMode: document.getElementById('automaticMode'),
  browserActionPopup: document.getElementById('browserActionPopup'),
  notificationsCheckbox: document.getElementById('notificationsCheckbox'),
  containerNamePrefix: document.getElementById('containerNamePrefix'),
  containerColorRandom: document.getElementById('containerColorRandom'),
  containerColor: document.getElementById('containerColor'),
  containerColorSection: document.getElementById('containerColorSection'),
  containerColorRandomExcluded: document.getElementById('containerColorRandomExcluded'),
  containerColorRandomExcludedSection: document.getElementById('containerColorRandomExcludedSection'),
  containerIconRandom: document.getElementById('containerIconRandom'),
  containerIcon: document.getElementById('containerIcon'),
  containerIconSection: document.getElementById('containerIconSection'),
  containerIconRandomExcluded: document.getElementById('containerIconRandomExcluded'),
  containerIconRandomExcludedSection: document.getElementById('containerIconRandomExcludedSection'),
  containerNumberMode: document.getElementById('containerNumberMode'),
  containerRemoval: document.getElementById('containerRemoval'),
  resetContainerNumber: document.getElementById('resetContainerNumber'),
  containerCounter: document.getElementById('containerCounter'),
  iconColor: document.getElementById('iconColor'),
  
  // Isolation: Global
  isolation: document.getElementById('isolation'),
  defaultIsolation: document.getElementById('defaultIsolation'),
  ignoredDomainsInput: document.getElementById('ignoredDomainsInput'),
  ignoredDomains: document.getElementById('ignoredDomains'),
  macConfirmPage: document.getElementById('macConfirmPage'),
  
  // Isolation: Per Domain
  domainRuleInput: document.getElementById('domainRuleInput'),
  domainRuleAction: document.getElementById('domainRuleAction'),
  addDomainRule: document.getElementById('addDomainRule'),
  domainRulesList: document.getElementById('domainRulesList'),
  
  // Advanced: Container
  containerCleanup: document.getElementById('containerCleanup'),
  containerTimeout: document.getElementById('containerTimeout'),
  containerHistory: document.getElementById('containerHistory'),
  
  // Advanced: Cookies
  deleteCookies: document.getElementById('deleteCookies'),
  cookieStoreId: document.getElementById('cookieStoreId'),
  cookieBehavior: document.getElementById('cookieBehavior'),
  
  // Advanced: Misc
  contextMenu: document.getElementById('contextMenu'),
  keyboardShortcuts: document.getElementById('keyboardShortcuts'),
  debug: document.getElementById('debug'),
  
  // Statistics
  containersCreated: document.getElementById('containersCreated'),
  containersActive: document.getElementById('containersActive'),
  containersRemoved: document.getElementById('containersRemoved'),
  isolationPrevented: document.getElementById('isolationPrevented'),
  resetStatistics: document.getElementById('resetStatistics'),
  
  // Export/Import
  exportSettings: document.getElementById('exportSettings'),
  importFile: document.getElementById('importFile'),
  importSettings: document.getElementById('importSettings')
};

/**
 * Initialize the options page
 */
async function initialize() {
  try {
    showInitializeLoader();
    
    // Initialize app state with defaults
    app = {
      initialized: false,
      preferences: {},
      permissions: {},
      statistics: { containersCreated: 0, cookiesDeleted: 0 },
      domainRules: [],
      activeSection: 'general',
      themeMode: 'light'
    };
    
    // Detect theme mode
    detectThemeMode();
    
    // Get preferences
    app.preferences = await getPreferences();
    
    // Get permissions
    app.permissions = await getPermissions();
    
    // Get statistics
    try {
      app.statistics = await sendMessage('getStatistics');
      if (!app.statistics) {
        app.statistics = { containersCreated: 0, cookiesDeleted: 0 };
      }
    } catch (error) {
      console.error('Error getting statistics:', error);
      app.statistics = { containersCreated: 0, cookiesDeleted: 0 };
    }
    
    // Initialize UI
    initNavigation();
    initFormElements();
    toggleRandomExcludedSections();
    initTagInputs();
    
    // Initialize domain rules
    try {
      app.domainRules = await sendMessage('getDomainRules');
      if (!app.domainRules || !Array.isArray(app.domainRules)) {
        app.domainRules = [];
      }
    } catch (error) {
      console.error('Error getting domain rules:', error);
      app.domainRules = [];
    }
    
    // Render domain rules
    renderDomainRules();
    
    // Add event listener for adding new domain rules
    elements.addDomainRule.addEventListener('click', addDomainRule);
    
    // Initialize event listeners
    initEventListeners();
    
    // Mark as initialized
    app.initialized = true;
    
    // Hide loader
    hideInitializeLoader();
    
    // Show app
    document.getElementById('app').classList.remove('hidden');
  } catch (error) {
    console.error('Error initializing options page:', error);
    showInitializeError(error);
  }
}

/**
 * Detect and set theme mode based on browser preferences
 */
function detectThemeMode() {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  app.themeMode = prefersDarkMode ? 'dark' : 'light';
  
  // Listen for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    app.themeMode = e.matches ? 'dark' : 'light';
  });
}

/**
 * Initialize navigation
 */
function initNavigation() {
  elements.navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const section = button.dataset.section;
      setActiveSection(section);
    });
  });
}

/**
 * Set active section
 * @param {string} section - Section ID
 */
function setActiveSection(section) {
  // Update active section in state
  app.activeSection = section;
  
  // Update active button
  elements.navButtons.forEach(button => {
    if (button.dataset.section === section) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update active content section
  elements.contentSections.forEach(contentSection => {
    if (contentSection.id === section) {
      contentSection.classList.remove('hidden');
    } else {
      contentSection.classList.add('hidden');
    }
  });
}

/**
 * Initialize form elements
 */
function initFormElements() {
  // Ensure preferences object exists with defaults
  if (!app.preferences) app.preferences = {};
  
  // General settings
  elements.automaticMode.checked = app.preferences.automaticMode || false;
  elements.browserActionPopup.checked = app.preferences.browserActionPopup || false;
  elements.notificationsCheckbox.checked = app.preferences.notifications || false;
  elements.containerNamePrefix.value = app.preferences.containerNamePrefix || '';
  elements.containerColorRandom.checked = app.preferences.containerColorRandom || false;
  elements.containerIconRandom.checked = app.preferences.containerIconRandom || false;
  elements.containerNumberMode.value = app.preferences.containerNumberMode || 'keep';
  elements.containerRemoval.value = app.preferences.containerRemoval || 0;
  elements.containerCounter.textContent = `Current container number: ${app.preferences.containerNumber || 1}`;
  
  // Populate container colors
  CONTAINER_COLORS.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = capitalize(color);
    elements.containerColor.appendChild(option);
  });
  elements.containerColor.value = app.preferences.containerColor || CONTAINER_COLORS[0];
  
  // Populate container icons
  CONTAINER_ICONS.forEach(icon => {
    const option = document.createElement('option');
    option.value = icon;
    option.textContent = capitalize(icon);
    elements.containerIcon.appendChild(option);
  });
  elements.containerIcon.value = app.preferences.containerIcon || CONTAINER_ICONS[0];
  
  // Populate toolbar icon colors
  TOOLBAR_ICON_COLORS.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = capitalize(color.replace('-', ' '));
    elements.iconColor.appendChild(option);
  });
  elements.iconColor.value = app.preferences.iconColor || TOOLBAR_ICON_COLORS[0];
  
  // Initialize multi-selects
  createMultiSelect(elements.containerColorRandomExcluded, CONTAINER_COLORS, app.preferences.containerColorRandomExcluded || []);
  createMultiSelect(elements.containerIconRandomExcluded, CONTAINER_ICONS, app.preferences.containerIconRandomExcluded || []);
  
  // Show/hide random excluded sections
  toggleRandomExcludedSections();
  
  // Isolation: Global
  elements.isolation.checked = app.preferences.isolation || false;
  elements.defaultIsolation.value = app.preferences.defaultIsolation || 'default';
  elements.macConfirmPage.value = (app.preferences.macConfirmPage !== undefined ? app.preferences.macConfirmPage : true).toString();
  
  // Advanced: Container
  elements.containerCleanup.checked = app.preferences.containerCleanup || false;
  elements.containerTimeout.value = app.preferences.containerTimeout || 0;
  elements.containerHistory.checked = app.preferences.containerHistory || false;
  
  // Advanced: Cookies
  elements.deleteCookies.checked = app.preferences.deleteCookies || false;
  elements.cookieStoreId.checked = app.preferences.cookieStoreId || false;
  elements.cookieBehavior.value = app.preferences.cookieBehavior || 'default';
  
  // Advanced: Misc
  elements.contextMenu.checked = app.preferences.contextMenu || false;
  elements.keyboardShortcuts.checked = app.preferences.keyboardShortcuts || false;
  elements.debug.checked = app.preferences.debug || false;
  
  // Statistics
  updateStatistics();
}

/**
 * Toggle random excluded sections based on checkbox state
 */
function toggleRandomExcludedSections() {
  if (elements.containerColorRandom.checked) {
    elements.containerColorSection.classList.add('hidden');
    elements.containerColorRandomExcludedSection.classList.remove('hidden');
  } else {
    elements.containerColorSection.classList.remove('hidden');
    elements.containerColorRandomExcludedSection.classList.add('hidden');
  }
  
  if (elements.containerIconRandom.checked) {
    elements.containerIconSection.classList.add('hidden');
    elements.containerIconRandomExcludedSection.classList.remove('hidden');
  } else {
    elements.containerIconSection.classList.remove('hidden');
    elements.containerIconRandomExcludedSection.classList.add('hidden');
  }
}

/**
 * Initialize tag inputs
 */
function initTagInputs() {
  // Initialize ignored domains tag input
  createTagInput(
    elements.ignoredDomainsInput,
    elements.ignoredDomains,
    app.preferences.ignoredDomains || IGNORED_DOMAINS_DEFAULT,
    (domains) => {
      app.preferences.ignoredDomains = domains;
      savePreferences(app.preferences);
    }
  );
}

/**
 * Initialize domain rules
 */
async function initDomainRules() {
  // Get domain rules
  app.domainRules = await sendMessage('getDomainRules');
  
  // Render domain rules
  renderDomainRules();
  
  // Add event listener for adding new domain rules
  elements.addDomainRule.addEventListener('click', addDomainRule);
}

/**
 * Render domain rules
 */
function renderDomainRules() {
  // Clear existing rules
  elements.domainRulesList.innerHTML = '';
  
  // Ensure domainRules exists
  if (!app.domainRules || !Array.isArray(app.domainRules)) {
    app.domainRules = [];
    return;
  }
  
  // Add each rule
  app.domainRules.forEach((rule, index) => {
    const ruleElement = document.createElement('div');
    ruleElement.className = 'domain-rule';
    
    const domainElement = document.createElement('div');
    domainElement.className = 'domain-rule-domain';
    domainElement.textContent = rule.domain;
    
    const actionElement = document.createElement('div');
    actionElement.className = 'domain-rule-action';
    actionElement.textContent = rule.action;
    
    const buttonsElement = document.createElement('div');
    buttonsElement.className = 'domain-rule-buttons';
    
    const editButton = document.createElement('button');
    editButton.className = 'button small';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => editDomainRule(index));
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'button small danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteDomainRule(index));
    
    buttonsElement.appendChild(editButton);
    buttonsElement.appendChild(deleteButton);
    
    ruleElement.appendChild(domainElement);
    ruleElement.appendChild(actionElement);
    ruleElement.appendChild(buttonsElement);
    
    elements.domainRulesList.appendChild(ruleElement);
  });
}

/**
 * Add a new domain rule
 */
async function addDomainRule() {
  const domain = elements.domainRuleInput.value.trim();
  const action = elements.domainRuleAction.value;
  
  if (!domain) {
    showError('Please enter a domain');
    return;
  }
  
  try {
    // Ensure app.domainRules is initialized
    if (!app.domainRules || !Array.isArray(app.domainRules)) {
      app.domainRules = [];
    }
    
    // Add rule
    app.domainRules.push({
      domain,
      action
    });
    
    // Save rules
    await sendMessage('saveDomainRules', { domainRules: app.domainRules });
    
    // Clear input
    elements.domainRuleInput.value = '';
    
    // Render rules
    renderDomainRules();
    
    // Show success message
    showSuccess(`Added rule for ${domain}`);
  } catch (error) {
    console.error('Error adding domain rule:', error);
    showError(`Error adding domain rule: ${error.toString()}`);
  }
}

/**
 * Edit a domain rule
 * @param {number} index - Rule index
 */
async function editDomainRule(index) {
  // Ensure app.domainRules is initialized and index is valid
  if (!app.domainRules || !Array.isArray(app.domainRules) || index < 0 || index >= app.domainRules.length) {
    showError('Invalid domain rule');
    return;
  }
  
  const rule = app.domainRules[index];
  
  // Populate input fields
  elements.domainRuleInput.value = rule.domain;
  elements.domainRuleAction.value = rule.action;
  
  // Remove the rule
  app.domainRules.splice(index, 1);
  
  // Render rules
  renderDomainRules();
}

/**
 * Delete a domain rule
 * @param {number} index - Rule index
 * @param {boolean} showNotification - Whether to show notification
 */
async function deleteDomainRule(index, showNotification = true) {
  // Ensure app.domainRules is initialized and index is valid
  if (!app.domainRules || !Array.isArray(app.domainRules) || index < 0 || index >= app.domainRules.length) {
    showError('Invalid domain rule');
    return;
  }
  
  const rule = app.domainRules[index];
  
  try {
    // Remove rule
    app.domainRules.splice(index, 1);
    
    // Save rules
    await sendMessage('saveDomainRules', { domainRules: app.domainRules });
    
    // Render rules
    renderDomainRules();
    
    if (showNotification) {
      showSuccess(`Removed rule for ${rule.domain}`);
    }
  } catch (error) {
    console.error('Error removing domain rule:', error);
    showError(`Error removing domain rule: ${error.toString()}`);
  }
}

/**
 * Update statistics display
 */
function updateStatistics() {
  if (!app.statistics) return;
  
  elements.containersCreated.textContent = app.statistics.containersCreated;
  elements.containersActive.textContent = app.statistics.containersActive;
  elements.containersRemoved.textContent = app.statistics.containersRemoved;
  elements.isolationPrevented.textContent = app.statistics.isolationPrevented;
}

/**
 * Reset statistics
 */
async function resetStatistics() {
  try {
    await sendMessage('resetStatistics');
    
    // Refresh statistics
    app.statistics = await sendMessage('getStatistics');
    updateStatistics();
    
    showSuccess('Statistics reset successfully');
  } catch (error) {
    console.error('Error resetting statistics:', error);
    showError(`Error resetting statistics: ${error.toString()}`);
  }
}

/**
 * Export settings
 */
function exportSettings() {
  const settings = {
    preferences: app.preferences,
    domainRules: app.domainRules,
    statistics: app.statistics
  };
  
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `temporary-containers-settings-${formatDate(new Date())}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  
  showSuccess('Settings exported successfully');
}

/**
 * Import settings
 */
async function importSettings() {
  const file = elements.importFile.files[0];
  
  if (!file) {
    showError('Please select a file to import');
    return;
  }
  
  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    
    // Validate settings
    if (!settings.preferences) {
      throw new Error('Invalid settings file: missing preferences');
    }
    
    // Import preferences
    app.preferences = settings.preferences;
    await savePreferences(app.preferences);
    
    // Import domain rules
    if (settings.domainRules) {
      await sendMessage('saveDomainRules', { domainRules: settings.domainRules });
      app.domainRules = settings.domainRules;
      renderDomainRules();
    }
    
    // Refresh UI
    initFormElements();
    
    showSuccess('Settings imported successfully');
  } catch (error) {
    console.error('Error importing settings:', error);
    showError(`Error importing settings: ${error.toString()}`);
  }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // General settings
  elements.automaticMode.addEventListener('change', savePreference('automaticMode'));
  elements.browserActionPopup.addEventListener('change', savePreference('browserActionPopup'));
  elements.notificationsCheckbox.addEventListener('change', savePreference('notifications'));
  elements.containerNamePrefix.addEventListener('change', savePreference('containerNamePrefix'));
  elements.containerColorRandom.addEventListener('change', (e) => {
    savePreference('containerColorRandom')(e);
    toggleRandomExcludedSections();
  });
  elements.containerColor.addEventListener('change', savePreference('containerColor'));
  elements.containerIconRandom.addEventListener('change', (e) => {
    savePreference('containerIconRandom')(e);
    toggleRandomExcludedSections();
  });
  elements.containerIcon.addEventListener('change', savePreference('containerIcon'));
  elements.containerNumberMode.addEventListener('change', savePreference('containerNumberMode'));
  elements.containerRemoval.addEventListener('change', savePreference('containerRemoval'));
  elements.iconColor.addEventListener('change', savePreference('iconColor'));
  
  // Reset container number
  elements.resetContainerNumber.addEventListener('click', async () => {
    try {
      app.preferences.containerNumber = 1;
      await savePreferences(app.preferences);
      elements.containerCounter.textContent = `Current container number: 1`;
      showSuccess('Container number reset to 1');
    } catch (error) {
      console.error('Error resetting container number:', error);
      showError(`Error resetting container number: ${error.toString()}`);
    }
  });
  
  // Multi-select changes
  elements.containerColorRandomExcluded.addEventListener('change', () => {
    const selected = Array.from(elements.containerColorRandomExcluded.selectedOptions).map(option => option.value);
    app.preferences.containerColorRandomExcluded = selected;
    savePreferences(app.preferences);
  });
  
  elements.containerIconRandomExcluded.addEventListener('change', () => {
    const selected = Array.from(elements.containerIconRandomExcluded.selectedOptions).map(option => option.value);
    app.preferences.containerIconRandomExcluded = selected;
    savePreferences(app.preferences);
  });
  
  // Isolation: Global
  elements.isolation.addEventListener('change', savePreference('isolation'));
  elements.defaultIsolation.addEventListener('change', savePreference('defaultIsolation'));
  elements.macConfirmPage.addEventListener('change', (e) => {
    app.preferences.macConfirmPage = e.target.value === 'true';
    savePreferences(app.preferences);
  });
  
  // Advanced: Container
  elements.containerCleanup.addEventListener('change', savePreference('containerCleanup'));
  elements.containerTimeout.addEventListener('change', savePreference('containerTimeout'));
  elements.containerHistory.addEventListener('change', savePreference('containerHistory'));
  
  // Advanced: Cookies
  elements.deleteCookies.addEventListener('change', savePreference('deleteCookies'));
  elements.cookieStoreId.addEventListener('change', savePreference('cookieStoreId'));
  elements.cookieBehavior.addEventListener('change', savePreference('cookieBehavior'));
  
  // Advanced: Misc
  elements.contextMenu.addEventListener('change', savePreference('contextMenu'));
  elements.keyboardShortcuts.addEventListener('change', savePreference('keyboardShortcuts'));
  elements.debug.addEventListener('change', savePreference('debug'));
  
  // Statistics
  elements.resetStatistics.addEventListener('click', resetStatistics);
  
  // Export/Import
  elements.exportSettings.addEventListener('click', exportSettings);
  elements.importSettings.addEventListener('click', importSettings);
}

/**
 * Create a function to save a preference
 * @param {string} key - Preference key
 * @returns {Function} - Event handler
 */
function savePreference(key) {
  return async (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    app.preferences[key] = value;
    await savePreferences(app.preferences);
  };
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
