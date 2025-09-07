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
  createTagInput,
  initializeStorage
} from './utils.js';

import {
  CONTAINER_COLORS,
  CONTAINER_ICONS,
  CONTAINER_REMOVAL_DEFAULT,
  TOOLBAR_ICON_COLORS,
  REDIRECTOR_DOMAINS_DEFAULT,
} from './shared.js';

// State
/** @type {{
 *   initialized: boolean;
 *   preferences: PreferencesSchema | null;
 *   permissions: Permissions | null;
 *   statistics: any | null;
 *   domainRules: any[];
 *   activeSection: string;
 *   themeMode: 'light' | 'dark';
 *   storage: StorageLocal | null;
 * }} */
let app = {
  initialized: false,
  preferences: null,
  permissions: null,
  statistics: null,
  domainRules: [],
  activeSection: 'general',
  themeMode: 'light',
  storage: null
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
  //resetContainerNumber: document.getElementById('resetContainerNumber'),
  //containerCounter: document.getElementById('containerCounter'),
  iconColor: document.getElementById('iconColor'),
  
  // Isolation: Global
  isolationGlobalUrlNavigation: document.getElementById('isolationGlobalUrlNavigation'),
  isolationGlobalLeftClick: document.getElementById('isolationGlobalLeftClick'),
  isolationGlobalMiddleClick: document.getElementById('isolationGlobalMiddleClick'),
  isolationGlobalCtrlLeftClick: document.getElementById('isolationGlobalCtrlLeftClick'),
  ignoredDomainsInput: document.getElementById('ignoredDomainsInput'),
  ignoredDomains: document.getElementById('ignoredDomains'),
  excludedContainersSelect: document.getElementById('excludedContainersSelect'),
  addExcludedContainer: document.getElementById('addExcludedContainer'),
  excludedContainers: document.getElementById('excludedContainers'),
  
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
    
    // Apply localization to the page
    applyLocalization();
    
    // Detect theme mode
    detectThemeMode();
    
    // Initialize storage
    app.storage = await initializeStorage();
    
    // Get preferences from storage
    app.preferences = await getPreferences();
    
    // Get permissions
    app.permissions = await getPermissions();
    
    // Validate required data
    if (!app.storage || !app.preferences) {
      throw new Error('Failed to initialize storage or preferences');
    }
    
    // Initialize navigation
    initNavigation();
    
    // Initialize form elements
    initFormElements();
    
    // Initialize tag inputs
    initTagInputs();
    
    // Initialize domain rules
    initDomainRules();
    
    // Update statistics
    updateStatistics();
    
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
async function initFormElements() {
  // Ensure preferences object exists with defaults
  if (!app.preferences) app.preferences = {};
  
  // General settings
  elements.automaticMode.checked = app.preferences.automaticMode.active || false;
  elements.browserActionPopup.checked = app.preferences.browserActionPopup || false;
  elements.notificationsCheckbox.checked = app.preferences.notifications || false;
  elements.containerNamePrefix.value = app.preferences.container.namePrefix || 'tmp';
  elements.containerColorRandom.checked = app.preferences.container.colorRandom || false;
  elements.containerIconRandom.checked = app.preferences.container.iconRandom || false;
  elements.containerNumberMode.value = app.preferences.container.numberMode || 'keep';
  //elements.containerCounter.textContent = `Current container number: ${app.preferences.container.number || 1}`;
  
  // Populate container colors
  CONTAINER_COLORS.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = capitalize(color);
    elements.containerColor.appendChild(option);
  });
  elements.containerColor.value = app.preferences.container.color || CONTAINER_COLORS[8];
  
  // Populate container icons
  CONTAINER_ICONS.forEach(icon => {
    const option = document.createElement('option');
    option.value = icon;
    option.textContent = capitalize(icon);
    elements.containerIcon.appendChild(option);
  });
  elements.containerIcon.value = app.preferences.container.icon || CONTAINER_ICONS[4];
  
  // Populate toolbar icon colors
  TOOLBAR_ICON_COLORS.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = capitalize(color.replace('-', ' '));
    elements.iconColor.appendChild(option);
  });
  elements.iconColor.value = app.preferences.iconColor || TOOLBAR_ICON_COLORS[0];
  
  // Populate container removal options
  Object.entries(CONTAINER_REMOVAL_DEFAULT).forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.setAttribute('data-i18n', text[0]);
    option.textContent = text[1];
    elements.containerRemoval.appendChild(option);
  });
  elements.containerRemoval.value = app.preferences.container.removal || 900000;
  
  // Initialize multi-selects
  createMultiSelect(elements.containerColorRandomExcluded, CONTAINER_COLORS, app.preferences.container.colorRandomExcluded || []);
  createMultiSelect(elements.containerIconRandomExcluded, CONTAINER_ICONS, app.preferences.container.iconRandomExcluded || []);
  
  // Show/hide random excluded sections
  toggleRandomExcludedSections();
  
  // Get all permanent containers from Firefox
  const containers = await browser.contextualIdentities.query({});
  const select = elements.excludedContainersSelect;
  
  // Clear existing options
  select.innerHTML = '';
  
  // Add a blank option
  const blankOption = document.createElement('option');
  blankOption.value = '';
  blankOption.textContent = 'Select a container...';
  select.appendChild(blankOption);
  
  // Get existing excluded containers
  const excludedContainers = app.preferences?.isolation?.global?.excludedContainers || [];
  
  // Populate the select with permanent containers (excluding temporary ones)
  containers.forEach(container => {
    // Skip if it's a temporary container or already selected
    if (app.storage?.tempContainers?.[container.cookieStoreId] || excludedContainers.includes(container.cookieStoreId)) {
      return;
    }
    const option = document.createElement('option');
    option.value = container.cookieStoreId;
    option.textContent = container.name;
    select.appendChild(option);
  });

  // Initialize existing excluded containers
  if (app.preferences && app.preferences.isolation.global.excludedContainers) {
    app.preferences.isolation.global.excludedContainers.forEach(containerId => {
      const container = containers.find(c => c.cookieStoreId === containerId);
      if (container) {
        addExcludedContainer(container);
      }
    });
    // Refresh the dropdown once after all containers are added
    refreshContainerDropdown();
  }

  // Add event listeners for container selection
  elements.addExcludedContainer.addEventListener('click', async () => {
    const selectedValue = select.value;
    if (selectedValue) {
      const container = containers.find(c => c.cookieStoreId === selectedValue);
      if (container) {
        addExcludedContainer(container);
        select.value = '';
        // Refresh the dropdown after adding a container through the UI
        refreshContainerDropdown();
      }
    }
  });

  // Initialize tag removal functionality
  const excludedContainersDiv = elements.excludedContainers;
  excludedContainersDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('tag-remove')) {
      const tag = e.target.closest('.tag');
      const containerId = tag.dataset.containerId;
      removeExcludedContainer(containerId);
      // Refresh the dropdown after removing a container
      refreshContainerDropdown();
    }
  });
  
  // Isolation: Global
  elements.isolationGlobalUrlNavigation.value = app.preferences.isolation.global.navigation.action || 'never';
  elements.isolationGlobalLeftClick.value = app.preferences.isolation.global.mouseClick.left.action || 'always';
  elements.isolationGlobalMiddleClick.value = app.preferences.isolation.global.mouseClick.middle.action || 'never';
  elements.isolationGlobalCtrlLeftClick.value = app.preferences.isolation.global.mouseClick.ctrlleft.action || 'never';
  
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
    app.preferences.isolation.global.excluded,
    (domains) => {
      app.preferences.isolation.global.excluded = domains;
      savePreferences(app.preferences);
    }
  );
}

/**
 * Add a container to the excluded list
 */
function addExcludedContainer(container) {
  const excludedContainersDiv = elements.excludedContainers;
  const existingTag = document.querySelector(`[data-container-id="${container.cookieStoreId}"]`);
  
  if (!existingTag) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.dataset.containerId = container.cookieStoreId;
    tag.textContent = container.name;
    
    // Create remove button
    const removeButton = document.createElement('button');
    removeButton.className = 'small tag-remove';
    removeButton.type = 'button';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => removeExcludedContainer(container.cookieStoreId));
    tag.appendChild(removeButton);
    
    // Add tag to container
    excludedContainersDiv.appendChild(tag);
    
    // Update preferences
    if (!app.preferences.isolation.global.excludedContainers) {
      app.preferences.isolation.global.excludedContainers = [];
    }
    // Only add if not already present
    if (!app.preferences.isolation.global.excludedContainers.includes(container.cookieStoreId)) {
      app.preferences.isolation.global.excludedContainers.push(container.cookieStoreId);
      savePreferences(app.preferences);
    }
  }
}

/**
 * Remove a container from the excluded list
 */
function removeExcludedContainer(containerId) {
  const tag = document.querySelector(`[data-container-id="${containerId}"]`);
  if (tag) {
    tag.remove();
    
    // Update preferences
    const index = app.preferences.isolation.global.excludedContainers.indexOf(containerId);
    if (index > -1) {
      app.preferences.isolation.global.excludedContainers.splice(index, 1);
      savePreferences(app.preferences);
    }
  }
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
 * Function to refresh container dropdown
 */
async function refreshContainerDropdown() {
  const select = elements.excludedContainersSelect;
  
  // Clear existing options
  select.innerHTML = '';
  
  // Add a blank option
  const blankOption = document.createElement('option');
  blankOption.value = '';
  blankOption.textContent = 'Select a container...';
  select.appendChild(blankOption);
  
  // Get existing excluded containers
  const excludedContainers = app.preferences?.isolation?.global?.excludedContainers || [];
  
  // Get all permanent containers from Firefox
  const containers = await browser.contextualIdentities.query({});
  
  // Populate the select with permanent containers (excluding temporary ones)
  containers.forEach(container => {
    // Skip if it's a temporary container or already selected
    if (app.storage?.tempContainers?.[container.cookieStoreId] || excludedContainers.includes(container.cookieStoreId)) {
      return;
    }
    const option = document.createElement('option');
    option.value = container.cookieStoreId;
    option.textContent = container.name;
    select.appendChild(option);
  });
}

/**
 * Request permissions when needed for specific features
 * @param {string} key - The preference key
 * @param {any} value - The preference value
 * @returns {Promise<boolean>} - Whether the permission was granted
 */
async function checkPermissions(key, value) {
  if (key === 'notifications' && value && !app.permissions.notifications) {
    const granted = await browser.permissions.request({
      permissions: ['notifications']
    });
    app.permissions.notifications = granted;
    return granted;
  }
  
  if (key === 'contextMenuBookmarks' && value && !app.permissions.bookmarks) {
    const granted = await browser.permissions.request({
      permissions: ['bookmarks']
    });
    app.permissions.bookmarks = granted;
    return granted;
  }
  
  if (key === 'deletesHistory.contextMenuBookmarks' && value && !app.permissions.bookmarks) {
    const granted = await browser.permissions.request({
      permissions: ['bookmarks']
    });
    app.permissions.bookmarks = granted;
    return granted;
  }
  
  if (key === 'deletesHistory.active' && value && !app.permissions.history) {
    const granted = await browser.permissions.request({
      permissions: ['history']
    });
    app.permissions.history = granted;
    return granted;
  }
  
  if (key === 'scripts.active' && value && !app.permissions.webNavigation) {
    const granted = await browser.permissions.request({
      permissions: ['webNavigation']
    });
    app.permissions.webNavigation = granted;
    return granted;
  }
  
  return true;
}

/**
 * Save a preference and update the UI
 * @param {string} key - The preference key
 * @returns {Function} - Event handler function
 */
function savePreference(key) {
  return async (e) => {
    try {
      let value;
      if (e.target.type === 'checkbox') {
        value = e.target.checked;
      } else if (e.target.type === 'select-multiple') {
        value = Array.from(e.target.selectedOptions).map(option => option.value);
      } else {
        value = e.target.value;
      }
        
      // Check permissions if needed
      if (e.target.type === 'checkbox' && value) {
        const permissionGranted = await checkPermissions(key, value);
        if (!permissionGranted) {
          // If permission was denied, revert the checkbox
          e.target.checked = false;
          return;
        }
      }
    
      // Ensure preferences object exists
      if (!app.preferences) {
        app.preferences = {};
      }
      
      // handle sub keys with multiple levels
      if (key.includes('.')) {
        const keys = key.split('.');
        let current = app.preferences;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
      } else {
        app.preferences[key] = value;
      }
      
      // Save preferences
      const success = await savePreferences(app.preferences);
      
      if (success) {
        console.log(`Saved preference: ${key} = ${value}`);
      }
    } catch (error) {
      console.error(`Error saving preference ${key}:`, error);
      showError(`Error saving preference: ${error.toString()}`);
    }
  };
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // General settings
  elements.automaticMode.addEventListener('change', savePreference('automaticMode.active'));
  elements.browserActionPopup.addEventListener('change', savePreference('browserActionPopup'));
  elements.notificationsCheckbox.addEventListener('change', savePreference('notifications'));
  elements.containerNamePrefix.addEventListener('change', savePreference('container.namePrefix'));
  elements.containerColorRandom.addEventListener('change', (e) => {
    savePreference('container.colorRandom')(e);
    toggleRandomExcludedSections();
  });
  elements.containerColor.addEventListener('change', savePreference('container.color'));
  elements.containerIconRandom.addEventListener('change', (e) => {
    savePreference('container.iconRandom')(e);
    toggleRandomExcludedSections();
  });
  elements.containerIcon.addEventListener('change', savePreference('container.icon'));
  elements.containerNumberMode.addEventListener('change', savePreference('container.numberMode'));
  elements.containerRemoval.addEventListener('change', savePreference('container.removal'));
  elements.iconColor.addEventListener('change', savePreference('iconColor'));
  
  /*// Reset container number - Blocked out for now
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
  */
  
  // Multi-select changes
  elements.containerColorRandomExcluded.addEventListener('change', () => {
    const selected = Array.from(elements.containerColorRandomExcluded.selectedOptions).map(option => option.value);
    app.preferences.container.colorRandomExcluded = selected;
    savePreferences(app.preferences);
  });
  
  elements.containerIconRandomExcluded.addEventListener('change', () => {
    const selected = Array.from(elements.containerIconRandomExcluded.selectedOptions).map(option => option.value);
    app.preferences.container.iconRandomExcluded = selected;
    savePreferences(app.preferences);
  });
  
  // Isolation: Global
  elements.isolationGlobalUrlNavigation.addEventListener('change', savePreference('isolation.global.navigation.action'));
  elements.isolationGlobalLeftClick.addEventListener('change', savePreference('isolation.global.mouseClick.left.action'));
  elements.isolationGlobalMiddleClick.addEventListener('change', savePreference('isolation.global.mouseClick.middle.action'));
  elements.isolationGlobalCtrlLeftClick.addEventListener('change', savePreference('isolation.global.mouseClick.ctrlleft.action'));
  
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
  elements.debug.addEventListener('change', savePreference('debug'));
  
  // Statistics
  elements.resetStatistics.addEventListener('click', resetStatistics);
  
  // Export/Import
  elements.exportSettings.addEventListener('click', exportSettings);
  elements.importSettings.addEventListener('click', importSettings);
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
