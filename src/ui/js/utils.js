/**
 * Utility functions for the Temporary Containers UI
 */

/**
 * Send a message to the background script
 * @param {string} method - The method to call
 * @param {Object} payload - The payload to send
 * @returns {Promise<any>} - The response from the background script
 */
export async function sendMessage(method, payload = {}) {
  return browser.runtime.sendMessage({
    method,
    payload,
  });
}

/**
 * Get the current preferences from storage
 * @returns {Promise<Object>} - The current preferences
 */
export async function getPreferences() {
  const storage = await browser.storage.local.get();
  return storage.preferences || {};
}

/**
 * Save preferences to storage
 * @param {Object} preferences - The preferences to save
 * @returns {Promise<void>}
 */
export async function savePreferences(preferences) {
  try {
    await sendMessage('savePreferences', { preferences });
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    showError(`Error saving preferences: ${error.toString()}`);
    return false;
  }
}

/**
 * Get browser permissions
 * @returns {Promise<Object>} - The current permissions
 */
export async function getPermissions() {
  const bookmarks = await browser.permissions.contains({ permissions: ['bookmarks'] });
  const downloads = await browser.permissions.contains({ permissions: ['downloads'] });
  const history = await browser.permissions.contains({ permissions: ['history'] });
  const notifications = await browser.permissions.contains({ permissions: ['notifications'] });
  const webNavigation = await browser.permissions.contains({ permissions: ['webNavigation'] });

  return {
    bookmarks,
    downloads,
    history,
    notifications,
    webNavigation,
  };
}

/**
 * Request a permission
 * @param {string} permission - The permission to request
 * @returns {Promise<boolean>} - Whether the permission was granted
 */
export async function requestPermission(permission) {
  return browser.permissions.request({
    permissions: [permission],
  });
}

/**
 * Show a message to the user
 * @param {string} message - The message to show
 * @param {string} type - The type of message (error, success, warning)
 */
export function showMessage(message, type = '') {
  const messageContainer = document.getElementById('message-container');
  const messageElement = document.getElementById('message');
  
  messageElement.textContent = message;
  messageContainer.className = 'message-container';
  
  if (type) {
    messageContainer.classList.add(type);
  }
  
  messageContainer.classList.remove('hidden');
  
  // Hide the message after 5 seconds
  setTimeout(() => {
    messageContainer.classList.add('hidden');
  }, 5000);
}

/**
 * Show an error message
 * @param {string} message - The error message
 */
export function showError(message) {
  showMessage(message, 'error');
}

/**
 * Show a success message
 * @param {string} message - The success message
 */
export function showSuccess(message) {
  showMessage(message, 'success');
}

/**
 * Show the initialize loader
 */
export function showInitializeLoader() {
  document.getElementById('initialize-loader').classList.remove('hidden');
}

/**
 * Hide the initialize loader
 */
export function hideInitializeLoader() {
  document.getElementById('initialize-loader').classList.add('hidden');
}

/**
 * Show an initialization error
 * @param {Error} error - The error that occurred
 */
export function showInitializeError(error) {
  const errorElement = document.getElementById('initialize-error');
  const errorDetailsElement = document.getElementById('initialize-error-details');
  
  if (error) {
    errorDetailsElement.textContent = error.toString();
  }
  
  errorElement.classList.remove('hidden');
}

/**
 * Create a tab system
 * @param {string} tabsSelector - Selector for the tab buttons
 * @param {string} panelsSelector - Selector for the tab panels
 * @param {Function} onChange - Callback when the tab changes
 */
export function createTabSystem(tabsSelector, panelsSelector, onChange = null) {
  const tabs = document.querySelectorAll(tabsSelector);
  const panels = document.querySelectorAll(panelsSelector);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active panel
      panels.forEach(panel => {
        if (panel.id === tabId) {
          panel.classList.remove('hidden');
          panel.classList.add('active');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('active');
        }
      });
      
      // Update URL hash
      if (window.history && window.history.pushState) {
        window.history.pushState(null, null, `#${tabId}`);
      } else {
        window.location.hash = tabId;
      }
      
      // Call onChange callback if provided
      if (onChange) {
        onChange(tabId);
      }
    });
  });
  
  // Check for hash in URL
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tab = document.querySelector(`[data-tab="${hash}"]`);
    if (tab) {
      tab.click();
    }
  }
}

/**
 * Create a glossary system
 * @param {Object} glossaryData - The glossary data
 */
export function createGlossarySystem(glossaryData) {
  const glossaryElement = document.getElementById('glossary');
  const glossaryTitleElement = document.getElementById('glossary-title');
  const glossaryBodyElement = document.getElementById('glossary-body');
  const glossaryCloseElement = document.getElementById('glossary-close');
  
  // Add click event to all elements with data-glossary attribute
  document.querySelectorAll('[data-glossary]').forEach(element => {
    element.style.cursor = 'help';
    element.style.borderBottom = '1px dotted var(--grey-50)';
    
    element.addEventListener('click', () => {
      const term = element.dataset.glossary;
      const label = element.dataset.glossaryLabel || term;
      
      if (glossaryData[term]) {
        glossaryTitleElement.textContent = label;
        glossaryBodyElement.innerHTML = glossaryData[term];
        glossaryElement.classList.remove('hidden');
      }
    });
  });
  
  // Close glossary when close button is clicked
  glossaryCloseElement.addEventListener('click', () => {
    glossaryElement.classList.add('hidden');
  });
  
  // Close glossary when clicking outside the content
  glossaryElement.addEventListener('click', event => {
    if (event.target === glossaryElement) {
      glossaryElement.classList.add('hidden');
    }
  });
  
  // Close glossary when pressing Escape
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !glossaryElement.classList.contains('hidden')) {
      glossaryElement.classList.add('hidden');
    }
  });
}

/**
 * Create an accordion system
 * @param {string} selector - Selector for the accordion elements
 */
export function createAccordionSystem(selector) {
  document.querySelectorAll(selector).forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    
    header.addEventListener('click', () => {
      accordion.classList.toggle('collapsed');
    });
  });
}

/**
 * Format a date
 * @param {Date} date - The date to format
 * @returns {string} - The formatted date
 */
export function formatDate(date) {
  return new Date(date).toLocaleString();
}

/**
 * Translate a string
 * @param {string} key - The translation key
 * @returns {string} - The translated string
 */
export function t(key) {
  return browser.i18n.getMessage(key) || key;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create a multi-select dropdown
 * @param {HTMLSelectElement} selectElement - The select element
 * @param {Array} options - The options to add
 * @param {Array} selectedValues - The selected values
 * @param {Function} onAdd - Callback when an option is added
 * @param {Function} onRemove - Callback when an option is removed
 */
export function createMultiSelect(selectElement, options, selectedValues = [], onAdd, onRemove) {
  // Clear existing options
  selectElement.innerHTML = '';
  
  // Ensure options is an array of objects with id and text properties
  const formattedOptions = Array.isArray(options) 
    ? options.map(option => typeof option === 'object' ? option : { id: option, text: option })
    : [];
  
  // Ensure selectedValues is an array
  const selected = Array.isArray(selectedValues) ? selectedValues : [];
  
  // Add options
  formattedOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.id;
    optionElement.textContent = option.text;
    optionElement.selected = selected.includes(option.id);
    selectElement.appendChild(optionElement);
  });
  
  // Add change event listener
  selectElement.addEventListener('change', () => {
    const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
    
    // Find added options
    selectedOptions.forEach(value => {
      if (!selected.includes(value) && onAdd) {
        onAdd(value);
      }
    });
    
    // Find removed options
    selected.forEach(value => {
      if (!selectedOptions.includes(value) && onRemove) {
        onRemove(value);
      }
    });
  });
}

/**
 * Create a tag input system
 * @param {HTMLInputElement} inputElement - The input element
 * @param {HTMLElement} tagContainer - The container for tags
 * @param {Array} initialTags - The initial tags
 * @param {Function} onChange - Callback when tags change
 */
export function createTagInput(inputElement, tagContainer, initialTags = [], onChange = null) {
  // Ensure initialTags is an array
  const tags = Array.isArray(initialTags) ? [...initialTags] : [];
  
  // Render initial tags
  renderTags();
  
  // Add event listener for input
  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      const value = inputElement.value.trim();
      if (value && !tags.includes(value)) {
        tags.push(value);
        renderTags();
        inputElement.value = '';
        
        if (onChange) {
          onChange(tags);
        }
      }
    }
  });
  
  // Add event delegation for tag removal
  tagContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-remove')) {
      const tag = e.target.parentElement.querySelector('.tag-text').textContent;
      const index = tags.indexOf(tag);
      
      if (index !== -1) {
        tags.splice(index, 1);
        renderTags();
        
        if (onChange) {
          onChange(tags);
        }
      }
    }
  });
  
  // Render tags
  function renderTags() {
    // Clear container
    tagContainer.innerHTML = '';
    
    // Add tags
    tags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'tag';
      
      const tagText = document.createElement('span');
      tagText.className = 'tag-text';
      tagText.textContent = tag;
      
      const tagRemove = document.createElement('span');
      tagRemove.className = 'tag-remove';
      tagRemove.textContent = '×';
      
      tagElement.appendChild(tagText);
      tagElement.appendChild(tagRemove);
      tagContainer.appendChild(tagElement);
    });
  }
}
