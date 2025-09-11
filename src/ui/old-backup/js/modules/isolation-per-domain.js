/**
 * Shared module for Isolation Per Domain functionality
 * Based on the options menu implementation
 */

import { savePreferences, t, sendMessage } from '../utils.js';

/**
 * Create the Isolation Per Domain form content
 * @param {Object} preferences - The preferences object
 * @param {Function} onSave - Callback function when preferences are saved
 * @param {Object} options - Additional options
 * @param {string} options.currentDomain - The current domain for popup interface
 * @param {boolean} options.isPopup - Whether this is for popup interface
 * @returns {HTMLElement} The form content element
 */
export function createIsolationPerDomainContent(preferences, onSave, options = {}) {
  const { currentDomain, isPopup = false } = options;
  const content = document.createElement('div');
  content.className = 'form';

  // Current domain section (only for popup)
  if (isPopup && currentDomain) {
    const domainIsolation = preferences.isolation.domain.find(d => d.pattern === currentDomain);

    const currentDomainSection = document.createElement('div');
    currentDomainSection.className = 'field';
    currentDomainSection.innerHTML = `
      <h3><span data-i18n="currentDomain">Current Domain</span>: ${currentDomain}</h3>
      <div class="isolation-actions">
        ${
          domainIsolation
            ? `
          <button id="edit-domain-isolation" class="button-default" data-i18n="editDomainIsolation">Edit Domain Isolation</button>
          <button id="remove-domain-isolation" class="button-default button-ghost" data-i18n="remove">Remove</button>
        `
            : `
          <button id="add-domain-isolation" class="button-default button-primary" data-i18n="addDomainIsolation">Add Domain Isolation</button>
        `
        }
      </div>
    `;

    content.appendChild(currentDomainSection);
  }

  // Domain rules section
  const domainRulesSection = document.createElement('div');
  domainRulesSection.className = 'field';
  domainRulesSection.innerHTML = `
    <label for="domainIsolation" data-i18n="domainIsolation">Domain Isolation</label>
    <div class="domain-rules-container">
      <div class="domain-rule-add">
        <input type="text" id="domainRuleInput" placeholder="Domain pattern (e.g. *.example.com)" data-i18n-placeholder="domainPatternExampleCom" />
        <select id="domainRuleAction">
          <option value="always" data-i18n="alwaysIsolate">Always Isolate</option>
          <option value="never" data-i18n="neverIsolate">Never Isolate</option>
          <option value="global" data-i18n="useGlobalSetting">Use Global Setting</option>
        </select>
        <button id="addDomainRule" class="button-default" data-i18n="addRule">Add Rule</button>
      </div>
      <div id="domainRulesList" class="domain-rules-list">
        ${
          preferences.isolation.domain.length === 0
            ? `
          <p data-i18n="noDomainIsolationRulesConfigured">No domain isolation rules configured.</p>
        `
            : ''
        }
      </div>
    </div>
  `;

  content.appendChild(domainRulesSection);

  // Add domain list items
  const domainList = domainRulesSection.querySelector('#domainRulesList');

  preferences.isolation.domain.forEach(domain => {
    const domainItem = document.createElement('div');
    domainItem.className = 'domain-rule';
    domainItem.innerHTML = `
      <div class="domain-rule-domain">${domain.pattern}</div>
      <div class="domain-rule-action">${domain.action || 'global'}</div>
      <div class="domain-rule-buttons">
        <button class="button small edit-domain" data-domain="${domain.pattern}">
          <i class="icon-pencil"></i> Edit
        </button>
        <button class="button small danger remove-domain" data-domain="${domain.pattern}">
          <i class="icon-trash"></i> Delete
        </button>
      </div>
    `;

    domainList.appendChild(domainItem);
  });

  // Add event listeners
  setupIsolationPerDomainEventListeners(content, preferences, onSave, options);

  return content;
}

/**
 * Set up event listeners for the isolation per domain form
 * @param {HTMLElement} content - The content element
 * @param {Object} preferences - The preferences object
 * @param {Function} onSave - Callback function when preferences are saved
 * @param {Object} options - Additional options
 */
function setupIsolationPerDomainEventListeners(content, preferences, onSave, options = {}) {
  const { currentDomain, isPopup = false } = options;

  // Current domain actions (popup only)
  if (isPopup && currentDomain) {
    const domainIsolation = preferences.isolation.domain.find(d => d.pattern === currentDomain);

    if (domainIsolation) {
      const editButton = content.querySelector('#edit-domain-isolation');
      const removeButton = content.querySelector('#remove-domain-isolation');

      if (editButton) {
        editButton.addEventListener('click', () => {
          // Open edit dialog (to be implemented)
          alert(t('editDomainIsolationFor', currentDomain));
        });
      }

      if (removeButton) {
        removeButton.addEventListener('click', () => {
          if (confirm(t('removeIsolationRuleFor', currentDomain))) {
            const index = preferences.isolation.domain.findIndex(d => d.pattern === currentDomain);

            if (index !== -1) {
              preferences.isolation.domain.splice(index, 1);
              onSave(preferences);

              // Reload the content
              if (options.onReload) {
                options.onReload();
              }
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
            action: 'global',
            navigation: { ...preferences.isolation.global.navigation },
            mouseClick: {
              middle: { ...preferences.isolation.global.mouseClick.middle },
              ctrlleft: { ...preferences.isolation.global.mouseClick.ctrlleft },
              left: { ...preferences.isolation.global.mouseClick.left },
            },
            excluded: {},
            excludedContainers: {},
            always: {
              action: 'disabled',
              allowedInPermanent: false,
              allowedInTemporary: false,
            },
          };

          preferences.isolation.domain.push(newDomainRule);
          onSave(preferences);

          // Reload the content
          if (options.onReload) {
            options.onReload();
          }
        });
      }
    }
  }

  // Add domain rule
  const addDomainRuleButton = content.querySelector('#addDomainRule');
  const domainRuleInput = content.querySelector('#domainRuleInput');
  const domainRuleAction = content.querySelector('#domainRuleAction');

  if (addDomainRuleButton) {
    addDomainRuleButton.addEventListener('click', async () => {
      const domain = domainRuleInput.value.trim();
      const action = domainRuleAction.value;

      if (!domain) {
        alert('Please enter a domain');
        return;
      }

      try {
        // Add rule
        preferences.isolation.domain.push({
          pattern: domain,
          action: action,
        });

        // Save rules
        await sendMessage('saveDomainRules', { domainRules: preferences.isolation.domain });

        // Clear input
        domainRuleInput.value = '';

        // Reload the content
        if (options.onReload) {
          options.onReload();
        }
      } catch (error) {
        console.error('Error adding domain rule:', error);
        alert(`Error adding domain rule: ${error.toString()}`);
      }
    });
  }

  // Domain list item actions
  const editButtons = content.querySelectorAll('.edit-domain');
  const removeButtons = content.querySelectorAll('.remove-domain');

  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      const domainPattern = button.dataset.domain;
      // Open edit dialog (to be implemented)
      alert(t('editDomainIsolationFor', domainPattern));
    });
  });

  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const domainPattern = button.dataset.domain;

      if (confirm(t('removeIsolationRuleFor', domainPattern))) {
        const index = preferences.isolation.domain.findIndex(d => d.pattern === domainPattern);

        if (index !== -1) {
          preferences.isolation.domain.splice(index, 1);
          onSave(preferences);

          // Reload the content
          if (options.onReload) {
            options.onReload();
          }
        }
      }
    });
  });
}

/**
 * Initialize the isolation per domain tab
 * @param {HTMLElement} tabElement - The tab element to populate
 * @param {Object} preferences - The preferences object
 * @param {Function} onSave - Callback function when preferences are saved
 * @param {Object} options - Additional options
 */
export function initializeIsolationPerDomainTab(tabElement, preferences, onSave, options = {}) {
  if (tabElement) {
    const content = createIsolationPerDomainContent(preferences, onSave, options);
    tabElement.appendChild(content);
  }
}
