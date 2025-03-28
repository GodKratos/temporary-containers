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
    elements.toggleIsolation.innerHTML = '<i class="icon-toggle-on"></i>';
  } else {
    elements.toggleIsolation.title = 'Enable Isolation';
    elements.toggleIsolation.innerHTML = '<i class="icon-toggle-off"></i>';
  }
}

/**
 * Initialize the tab content
 */
function initializeTabContent() {
  // Initialize isolation global tab
  initializeIsolationGlobal();
  
  // Initialize isolation per domain tab
  initializeIsolationPerDomain();
  
  // Initialize actions tab
  initializeActionsTab();
  
  // Initialize statistics tab
  initializeStatisticsTab();
}

/**
 * Initialize the isolation global tab
 */
function initializeIsolationGlobal() {
  const isolationGlobalTab = document.getElementById('isolation-global');
  
  if (isolationGlobalTab) {
    const isolationGlobal = app.preferences.isolation.global;
    
    // Create content
    const content = document.createElement('div');
    content.className = 'isolation-section';
    
    // Navigation section
    const navigationSection = document.createElement('div');
    navigationSection.className = 'isolation-section';
    navigationSection.innerHTML = `
      <h3>Navigation</h3>
      <div class="isolation-options">
        <div class="isolation-option">
          <label>
            <input type="radio" name="navigation-action" value="never" ${isolationGlobal.navigation.action === 'never' ? 'checked' : ''}>
            Never
          </label>
        </div>
        <div class="isolation-option">
          <label>
            <input type="radio" name="navigation-action" value="notsamedomain" ${isolationGlobal.navigation.action === 'notsamedomain' ? 'checked' : ''}>
            Not Same Domain
          </label>
        </div>
        <div class="isolation-option">
          <label>
            <input type="radio" name="navigation-action" value="notsamedomainexact" ${isolationGlobal.navigation.action === 'notsamedomainexact' ? 'checked' : ''}>
            Not Same Domain Exact
          </label>
        </div>
        <div class="isolation-option">
          <label>
            <input type="radio" name="navigation-action" value="always" ${isolationGlobal.navigation.action === 'always' ? 'checked' : ''}>
            Always
          </label>
        </div>
      </div>
    `;
    
    // Mouse click section
    const mouseClickSection = document.createElement('div');
    mouseClickSection.className = 'isolation-section';
    mouseClickSection.innerHTML = `
      <h3>Mouse Click</h3>
      
      <div class="isolation-subsection">
        <h4>Middle Click</h4>
        <div class="isolation-options">
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-action" value="never" ${isolationGlobal.mouseClick.middle.action === 'never' ? 'checked' : ''}>
              Never
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-action" value="notsamedomain" ${isolationGlobal.mouseClick.middle.action === 'notsamedomain' ? 'checked' : ''}>
              Not Same Domain
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-action" value="notsamedomainexact" ${isolationGlobal.mouseClick.middle.action === 'notsamedomainexact' ? 'checked' : ''}>
              Not Same Domain Exact
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-action" value="always" ${isolationGlobal.mouseClick.middle.action === 'always' ? 'checked' : ''}>
              Always
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-action" value="global" ${isolationGlobal.mouseClick.middle.action === 'global' ? 'checked' : ''}>
              Global
            </label>
          </div>
        </div>
        
        <div class="isolation-container-type">
          <h5>Container Type</h5>
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-container" value="default" ${isolationGlobal.mouseClick.middle.container === 'default' ? 'checked' : ''}>
              Default
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="middle-container" value="deleteshistory" ${isolationGlobal.mouseClick.middle.container === 'deleteshistory' ? 'checked' : ''}>
              Deletes History
            </label>
          </div>
        </div>
      </div>
      
      <div class="isolation-subsection">
        <h4>Ctrl+Left Click</h4>
        <div class="isolation-options">
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-action" value="never" ${isolationGlobal.mouseClick.ctrlleft.action === 'never' ? 'checked' : ''}>
              Never
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-action" value="notsamedomain" ${isolationGlobal.mouseClick.ctrlleft.action === 'notsamedomain' ? 'checked' : ''}>
              Not Same Domain
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-action" value="notsamedomainexact" ${isolationGlobal.mouseClick.ctrlleft.action === 'notsamedomainexact' ? 'checked' : ''}>
              Not Same Domain Exact
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-action" value="always" ${isolationGlobal.mouseClick.ctrlleft.action === 'always' ? 'checked' : ''}>
              Always
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-action" value="global" ${isolationGlobal.mouseClick.ctrlleft.action === 'global' ? 'checked' : ''}>
              Global
            </label>
          </div>
        </div>
        
        <div class="isolation-container-type">
          <h5>Container Type</h5>
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-container" value="default" ${isolationGlobal.mouseClick.ctrlleft.container === 'default' ? 'checked' : ''}>
              Default
            </label>
          </div>
          <div class="isolation-option">
            <label>
              <input type="radio" name="ctrlleft-container" value="deleteshistory" ${isolationGlobal.mouseClick.ctrlleft.container === 'deleteshistory' ? 'checked' : ''}>
              Deletes History
            </label>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for navigation options
    content.appendChild(navigationSection);
    content.appendChild(mouseClickSection);
    isolationGlobalTab.appendChild(content);
    
    // Add event listeners
    const navigationRadios = content.querySelectorAll('input[name="navigation-action"]');
    navigationRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          app.preferences.isolation.global.navigation.action = radio.value;
          savePreferences(app.preferences);
        }
      });
    });
    
    const middleActionRadios = content.querySelectorAll('input[name="middle-action"]');
    middleActionRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          app.preferences.isolation.global.mouseClick.middle.action = radio.value;
          savePreferences(app.preferences);
        }
      });
    });
    
    const middleContainerRadios = content.querySelectorAll('input[name="middle-container"]');
    middleContainerRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          app.preferences.isolation.global.mouseClick.middle.container = radio.value;
          savePreferences(app.preferences);
        }
      });
    });
    
    const ctrlLeftActionRadios = content.querySelectorAll('input[name="ctrlleft-action"]');
    ctrlLeftActionRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          app.preferences.isolation.global.mouseClick.ctrlleft.action = radio.value;
          savePreferences(app.preferences);
        }
      });
    });
    
    const ctrlLeftContainerRadios = content.querySelectorAll('input[name="ctrlleft-container"]');
    ctrlLeftContainerRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          app.preferences.isolation.global.mouseClick.ctrlleft.container = radio.value;
          savePreferences(app.preferences);
        }
      });
    });
  }
}

/**
 * Initialize the isolation per domain tab
 */
function initializeIsolationPerDomain() {
  const isolationPerDomainTab = document.getElementById('isolation-per-domain');
  
  if (isolationPerDomainTab) {
    // Create content
    const content = document.createElement('div');
    
    // Current domain section
    const currentDomain = app.activeTab.parsedUrl.hostname;
    const domainIsolation = app.preferences.isolation.domain.find(d => d.pattern === currentDomain);
    
    if (currentDomain) {
      const currentDomainSection = document.createElement('div');
      currentDomainSection.className = 'isolation-section';
      currentDomainSection.innerHTML = `
        <h3>Current Domain: ${currentDomain}</h3>
        <div class="isolation-actions">
          ${domainIsolation ? `
            <button id="edit-domain-isolation" class="button-default">Edit Domain Isolation</button>
            <button id="remove-domain-isolation" class="button-default button-ghost">Remove</button>
          ` : `
            <button id="add-domain-isolation" class="button-default button-primary">Add Domain Isolation</button>
          `}
        </div>
      `;
      
      content.appendChild(currentDomainSection);
    }
    
    // Domain list
    const domainListSection = document.createElement('div');
    domainListSection.className = 'isolation-section';
    domainListSection.innerHTML = `
      <h3>Domain Isolation Rules</h3>
      <div id="domain-list" class="domain-list">
        ${app.preferences.isolation.domain.length === 0 ? `
          <p>No domain isolation rules configured.</p>
        ` : ''}
      </div>
    `;
    
    content.appendChild(domainListSection);
    
    // Add domain list items
    const domainList = domainListSection.querySelector('#domain-list');
    
    app.preferences.isolation.domain.forEach(domain => {
      const domainItem = document.createElement('div');
      domainItem.className = 'domain-item';
      domainItem.innerHTML = `
        <div class="domain-pattern">${domain.pattern}</div>
        <div class="domain-actions">
          <button class="button-icon edit-domain" data-domain="${domain.pattern}">
            <i class="icon-pencil"></i>
          </button>
          <button class="button-icon remove-domain" data-domain="${domain.pattern}">
            <i class="icon-trash"></i>
          </button>
        </div>
      `;
      
      domainList.appendChild(domainItem);
    });
    
    isolationPerDomainTab.appendChild(content);
    
    // Add event listeners
    if (currentDomain) {
      if (domainIsolation) {
        const editButton = content.querySelector('#edit-domain-isolation');
        const removeButton = content.querySelector('#remove-domain-isolation');
        
        if (editButton) {
          editButton.addEventListener('click', () => {
            // Open edit dialog (to be implemented)
            alert('Edit domain isolation for ' + currentDomain);
          });
        }
        
        if (removeButton) {
          removeButton.addEventListener('click', () => {
            if (confirm(`Remove isolation rule for ${currentDomain}?`)) {
              const index = app.preferences.isolation.domain.findIndex(d => d.pattern === currentDomain);
              
              if (index !== -1) {
                app.preferences.isolation.domain.splice(index, 1);
                savePreferences(app.preferences);
                
                // Reload the tab
                initialize();
              }
            }
          });
        }
      } else {
        const addButton = content.querySelector('#add-domain-isolation');
        
        if (addButton) {
          addButton.addEventListener('click', () => {
            // Create new domain isolation rule based on global settings
            const newDomainRule = {
              pattern: currentDomain,
              navigation: { ...app.preferences.isolation.global.navigation },
              mouseClick: {
                middle: { ...app.preferences.isolation.global.mouseClick.middle },
                ctrlleft: { ...app.preferences.isolation.global.mouseClick.ctrlleft },
                left: { ...app.preferences.isolation.global.mouseClick.left },
              },
              excluded: {},
              excludedContainers: {},
              always: {
                action: 'disabled',
                allowedInPermanent: false,
                allowedInTemporary: false,
              },
            };
            
            app.preferences.isolation.domain.push(newDomainRule);
            savePreferences(app.preferences);
            
            // Reload the tab
            initialize();
          });
        }
      }
    }
    
    // Add event listeners for domain list items
    const editButtons = content.querySelectorAll('.edit-domain');
    const removeButtons = content.querySelectorAll('.remove-domain');
    
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const domainPattern = button.dataset.domain;
        // Open edit dialog (to be implemented)
        alert('Edit domain isolation for ' + domainPattern);
      });
    });
    
    removeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const domainPattern = button.dataset.domain;
        
        if (confirm(`Remove isolation rule for ${domainPattern}?`)) {
          const index = app.preferences.isolation.domain.findIndex(d => d.pattern === domainPattern);
          
          if (index !== -1) {
            app.preferences.isolation.domain.splice(index, 1);
            savePreferences(app.preferences);
            
            // Reload the tab
            initialize();
          }
        }
      });
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
          <div class="action-label">New Temporary Container</div>
        </div>
        
        ${app.permissions.history ? `
          <div class="action-card" id="action-new-history-tmp">
            <div class="action-icon">
              <i class="icon-user-secret"></i>
            </div>
            <div class="action-label">New Deletes History Container</div>
          </div>
        ` : ''}
        
        <div class="action-card" id="action-open-preferences">
          <div class="action-icon">
            <i class="icon-cog-alt"></i>
          </div>
          <div class="action-label">Open Preferences</div>
        </div>
        
        <div class="action-card" id="action-toggle-isolation">
          <div class="action-icon">
            ${app.storage.isolation.active ? 
              '<i class="icon-toggle-on"></i>' : 
              '<i class="icon-toggle-off"></i>'
            }
          </div>
          <div class="action-label">
            ${app.storage.isolation.active ? 'Disable Isolation' : 'Enable Isolation'}
          </div>
        </div>
      </div>
    `;
    
    actionsTab.appendChild(content);
    
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
        label.textContent = 'Disable Isolation';
      } else {
        icon.innerHTML = '<i class="icon-toggle-off"></i>';
        label.textContent = 'Enable Isolation';
      }
      
      // Update header icon
      updateIsolationIcon();
    });
  }
}

/**
 * Initialize the statistics tab
 */
function initializeStatisticsTab() {
  const statisticsTab = document.getElementById('statistics');
  
  if (statisticsTab && app.storage.statistics) {
    const stats = app.storage.statistics;
    
    // Create content
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="statistics-list">
        <div class="statistic-item">
          <div class="statistic-name">Containers Deleted</div>
          <div class="statistic-count">${stats.containersDeleted || 0}</div>
        </div>
        <div class="statistic-item">
          <div class="statistic-name">Cookies Deleted</div>
          <div class="statistic-count">${stats.cookiesDeleted || 0}</div>
        </div>
        <div class="statistic-item">
          <div class="statistic-name">Cache Deleted</div>
          <div class="statistic-count">${stats.cacheDeleted || 0}</div>
        </div>
        <div class="statistic-item">
          <div class="statistic-name">History Containers Deleted</div>
          <div class="statistic-count">${stats.deletesHistory?.containersDeleted || 0}</div>
        </div>
        <div class="statistic-item">
          <div class="statistic-name">History Cookies Deleted</div>
          <div class="statistic-count">${stats.deletesHistory?.cookiesDeleted || 0}</div>
        </div>
        <div class="statistic-item">
          <div class="statistic-name">URLs Deleted</div>
          <div class="statistic-count">${stats.deletesHistory?.urlsDeleted || 0}</div>
        </div>
      </div>
    `;
    
    statisticsTab.appendChild(content);
  }
}

// Initialize the popup page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
