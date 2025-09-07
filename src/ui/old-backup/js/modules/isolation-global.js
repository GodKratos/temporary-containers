/**
 * Shared module for Isolation Global functionality
 * Based on the options menu implementation
 */

import { savePreferences, t } from '../utils.js';

/**
 * Create the Isolation Global form content
 * @param {Object} preferences - The preferences object
 * @param {Function} onSave - Callback function when preferences are saved
 * @returns {HTMLElement} The form content element
 */
export function createIsolationGlobalContent(preferences, onSave) {
  const content = document.createElement('div');
  content.className = 'form';
  
  const isolationGlobal = preferences.isolation.global;
  
  content.innerHTML = `
    <div class="field">
      <label for="isolationGlobalUrlNavigation" data-i18n="optionsIsolationGlobalUrlNavigation">URL Navigation</label>
      <select id="isolationGlobalUrlNavigation" name="isolationGlobalUrlNavigation">
        <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
        <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
        <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
        <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
      </select>
      <div class="field-description" data-i18n="optionsIsolationGlobalUrlNavigationDescription">Global isolation rule for all URL navigation in existing tabs, new tabs, address bar and mouse clicks.</div>
    </div>

    <div class="field">
      <label for="isolationGlobalMouseNavigation" data-i18n="optionsIsolationGlobalMouseNavigation">Mouse Navigation</label>
      <div class="field-description" data-i18n="optionsIsolationGlobalMouseDescription">Global isolation rule for mouse click activities. When used with global or domain isolation enabled, any setting that enables isolation will be enforced.</div>
      <label for="isolationGlobalLeftClick" data-i18n="optionsIsolationGlobalLeftClick">Left Click</label>
      <select id="isolationGlobalLeftClick" name="isolationGlobalLeftClick">
        <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
        <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
        <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
        <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
      </select>
      <label for="isolationGlobalMiddleClick" data-i18n="optionsIsolationGlobalMiddleClick">Middle Click</label>
      <select id="isolationGlobalMiddleClick" name="isolationGlobalMiddleClick">
        <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
        <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
        <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
        <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
      </select>
      <label for="isolationGlobalCtrlLeftClick" data-i18n="optionsIsolationGlobalCtrlLeftClick">Ctrl/Cmd + Left Click</label>
      <select id="isolationGlobalCtrlLeftClick" name="isolationGlobalCtrlLeftClick">
        <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
        <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
        <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
        <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
      </select>
    </div>
    
    <div class="field">
      <label for="excludedContainers" data-i18n="optionsIsolationExcludeContainers">Exclude Permanent Containers</label>
      <div class="tag-input-container">
        <select id="excludedContainersSelect" class="permanent-container-select">
          <option value="">Select a container...</option>
        </select>
        <button id="addExcludedContainer" class="small">Add Container</button>
        <div id="excludedContainers" class="tag-list"></div>
      </div>
      <div class="field-description" data-i18n="optionsIsolationExcludeContainersDescription">Disables isolation events for the selected containers.</div>
    </div>
    
    <div class="field">
      <label for="ignoredDomains" data-i18n="optionsIsolationIgnoredDomains">Ignored Domains</label>
      <div class="tag-input-container">
        <input type="text" id="ignoredDomainsInput" placeholder="Add domain and press Enter" data-i18n-placeholder="addDomainAndPressEnter" />
        <div id="ignoredDomains" class="tag-list"></div>
      </div>
      <div class="field-description" data-i18n="optionsIsolationIgnoredDomainsDescription">Ignored domains will not be isolated.</div>
    </div>
  `;
  
  // Set initial values
  const urlNavigationSelect = content.querySelector('#isolationGlobalUrlNavigation');
  const leftClickSelect = content.querySelector('#isolationGlobalLeftClick');
  const middleClickSelect = content.querySelector('#isolationGlobalMiddleClick');
  const ctrlLeftClickSelect = content.querySelector('#isolationGlobalCtrlLeftClick');
  
  if (urlNavigationSelect) urlNavigationSelect.value = isolationGlobal.navigation.action || 'never';
  if (leftClickSelect) leftClickSelect.value = isolationGlobal.mouseClick.left.action || 'always';
  if (middleClickSelect) middleClickSelect.value = isolationGlobal.mouseClick.middle.action || 'never';
  if (ctrlLeftClickSelect) ctrlLeftClickSelect.value = isolationGlobal.mouseClick.ctrlleft.action || 'never';
  
  // Add event listeners
  setupIsolationGlobalEventListeners(content, preferences, onSave);
  
  return content;
}

/**
 * Set up event listeners for the isolation global form
 * @param {HTMLElement} content - The content element
 * @param {Object} preferences - The preferences object
 * @param {Function} onSave - Callback function when preferences are saved
 */
function setupIsolationGlobalEventListeners(content, preferences, onSave) {
  // URL Navigation
  const urlNavigationSelect = content.querySelector('#isolationGlobalUrlNavigation');
  if (urlNavigationSelect) {
    urlNavigationSelect.addEventListener('change', () => {
      preferences.isolation.global.navigation.action = urlNavigationSelect.value;
      onSave(preferences);
    });
  }
  
  // Left Click
  const leftClickSelect = content.querySelector('#isolationGlobalLeftClick');
  if (leftClickSelect) {
    leftClickSelect.addEventListener('change', () => {
      preferences.isolation.global.mouseClick.left.action = leftClickSelect.value;
      onSave(preferences);
    });
  }
  
  // Middle Click
  const middleClickSelect = content.querySelector('#isolationGlobalMiddleClick');
  if (middleClickSelect) {
    middleClickSelect.addEventListener('change', () => {
      preferences.isolation.global.mouseClick.middle.action = middleClickSelect.value;
      onSave(preferences);
    });
  }
  
  // Ctrl+Left Click
  const ctrlLeftClickSelect = content.querySelector('#isolationGlobalCtrlLeftClick');
  if (ctrlLeftClickSelect) {
    ctrlLeftClickSelect.addEventListener('change', () => {
      preferences.isolation.global.mouseClick.ctrlleft.action = ctrlLeftClickSelect.value;
      onSave(preferences);
    });
  }
}

/**
 * Initialize the isolation global tab
 * @param {HTMLElement} tabElement - The tab element to populate
 * @param {Object} preferences - The preferences object
 * @param {Function} onSave - Callback function when preferences are saved
 */
export function initializeIsolationGlobalTab(tabElement, preferences, onSave) {
  if (tabElement) {
    const content = createIsolationGlobalContent(preferences, onSave);
    tabElement.appendChild(content);
  }
}
