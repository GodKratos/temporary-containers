// Shared IsolationPerDomain page logic for both options and popup menus
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema, IsolationDomain } from '../../../types';

interface DomainEditState {
  editing: boolean;
  editIndex: number;
  domain: IsolationDomain;
}

let editState: DomainEditState = {
  editing: false,
  editIndex: -1,
  domain: createDefaultDomain(),
};

function createDefaultDomain(): IsolationDomain {
  return {
    pattern: '',
    always: {
      action: 'disabled',
      allowedInPermanent: false,
      allowedInTemporary: false,
    },
    navigation: {
      action: 'global',
    },
    mouseClick: {
      middle: { action: 'global', container: 'default' },
      ctrlleft: { action: 'global', container: 'default' },
      left: { action: 'global', container: 'default' },
    },
    excluded: [],
    excludedContainers: [],
  };
}

export async function initIsolationPerDomainPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('isolation-domain');
    if (!section) return;

    // If opened from popup (popup.html) prepopulate the domain pattern with the active tab's hostname when it's an http(s) URL.
    if (!editState.editing && !editState.domain.pattern) {
      const isPopupContext = /\/popup\.html$/i.test(window.location.pathname);
      if (isPopupContext && typeof browser !== 'undefined' && browser.tabs && browser.tabs.query) {
        try {
          const [activeTab] = await browser.tabs.query({ currentWindow: true, active: true });
          const url = activeTab && typeof activeTab.url === 'string' ? activeTab.url : '';
          if (/^https?:/i.test(url)) {
            try {
              const parsed = new URL(url);
              if (parsed.hostname) {
                editState.domain.pattern = parsed.hostname;
              }
            } catch (_e) {
              // ignore invalid URL
            }
          }
        } catch (_e) {
          // ignore tab query errors (e.g., missing permissions in tests)
        }
      }
    }
    section.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'form';

    content.innerHTML = `
      <div class="domain-pattern-form">
        <!-- Domain Settings -->
        <div class="section">
          <h3 data-i18n="optionsIsolationPerDomainDomainSettings">Domain Settings</h3>
          <div class="field">
            <label for="domainPatternInput" data-i18n="optionsDomainPattern">Domain Pattern</label>
            <div class="field-description" data-i18n="optionsIsolationPerDomainPatternDescription">Enter a domain pattern to configure isolation rules for specific domains.</div>
            <input type="text" id="domainPatternInput" placeholder="example.com or *.example.com" value="${
              editState.domain.pattern
            }" data-i18n-placeholder="optionsDomainPatternPlaceholder" data-i18n-title="optionsDomainPatternDescription" title="Use exact domains (example.com), subdomains (sub.example.com) or wildcards (*.example.com) to match URLs" />
          </div>
        </div>
        
        <div id="domainSettings" class="domain-settings" ${editState.domain.pattern ? '' : 'style="opacity: 0.3; pointer-events: none;"'}>
          <!-- Always Open In Settings -->
          <div class="section">
            <h4 data-i18n="optionsIsolationPerDomainAlwaysOpenIn">Always Open In Temporary Container</h4>
            <div class="field">
              <label for="alwaysAction" data-i18n="optionsIsolationPerDomainAction">Action</label>
              <select id="alwaysAction">
                <option value="disabled" ${
                  editState.domain.always.action === 'disabled' ? 'selected' : ''
                } data-i18n="optionsIsolationDisabled">Disabled</option>
                <option value="enabled" ${
                  editState.domain.always.action === 'enabled' ? 'selected' : ''
                } data-i18n="optionsIsolationEnabled">Enabled</option>
              </select>
            </div>
            <div id="alwaysOptions" ${editState.domain.always.action === 'enabled' ? '' : 'style="display: none;"'}>
              <div class="field checkbox-field">
                <input type="checkbox" id="allowedInPermanent" ${editState.domain.always.allowedInPermanent ? 'checked' : ''} />
                <label for="allowedInPermanent" data-i18n="optionsIsolationPerDomainDisableIfNavPermContainer">Disable if navigating from a Permanent Container</label>
              </div>
              <div class="field checkbox-field">
                <input type="checkbox" id="allowedInTemporary" ${editState.domain.always.allowedInTemporary ? 'checked' : ''} />
                <label for="allowedInTemporary" data-i18n="optionsIsolationPerDomainDisableIfNavTempContainer">Disable if navigating from a Temporary Container</label>
              </div>
            </div>
          </div>

          <!-- Navigation Settings -->
          <div class="section">
            <h4 data-i18n="optionsIsolationNavigation">URL Navigation</h4>
            <div class="field">
              <label for="navigationAction" data-i18n="optionsIsolationNavigationAction">Navigation Action</label>
              <select id="navigationAction">
                <option value="global" ${
                  editState.domain.navigation.action === 'global' ? 'selected' : ''
                } data-i18n="useGlobalSetting">Use Global Setting</option>
                <option value="never" ${
                  editState.domain.navigation.action === 'never' ? 'selected' : ''
                } data-i18n="optionsIsolationNever">Never Isolate</option>
                <option value="notsamedomainexact" ${
                  editState.domain.navigation.action === 'notsamedomainexact' ? 'selected' : ''
                } data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly</option>
                <option value="notsamedomain" ${
                  editState.domain.navigation.action === 'notsamedomain' ? 'selected' : ''
                } data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
                <option value="always" ${
                  editState.domain.navigation.action === 'always' ? 'selected' : ''
                } data-i18n="optionsIsolationAlways">Always Isolate</option>
              </select>
            </div>
          </div>

          <!-- Mouse Click Settings -->
          <div class="section">
            <h4 data-i18n="optionsIsolationMouseClick">Mouse Click Navigation</h4>
            <div class="field">
              <label for="middleClickAction" data-i18n="optionsIsolationGlobalMiddleClick">Middle Click</label>
              <select id="middleClickAction">
                <option value="global" ${
                  editState.domain.mouseClick.middle.action === 'global' ? 'selected' : ''
                } data-i18n="useGlobalSetting">Use Global Setting</option>
                <option value="never" ${
                  editState.domain.mouseClick.middle.action === 'never' ? 'selected' : ''
                } data-i18n="optionsIsolationNever">Never Isolate</option>
                <option value="notsamedomainexact" ${
                  editState.domain.mouseClick.middle.action === 'notsamedomainexact' ? 'selected' : ''
                } data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly</option>
                <option value="notsamedomain" ${
                  editState.domain.mouseClick.middle.action === 'notsamedomain' ? 'selected' : ''
                } data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
                <option value="always" ${
                  editState.domain.mouseClick.middle.action === 'always' ? 'selected' : ''
                } data-i18n="optionsIsolationAlways">Always Isolate</option>
              </select>
            </div>
            <div class="field">
              <label for="ctrlLeftClickAction" data-i18n="optionsIsolationGlobalCtrlLeftClick">Ctrl/Cmd + Left Click</label>
              <select id="ctrlLeftClickAction">
                <option value="global" ${
                  editState.domain.mouseClick.ctrlleft.action === 'global' ? 'selected' : ''
                } data-i18n="useGlobalSetting">Use Global Setting</option>
                <option value="never" ${
                  editState.domain.mouseClick.ctrlleft.action === 'never' ? 'selected' : ''
                } data-i18n="optionsIsolationNever">Never Isolate</option>
                <option value="notsamedomainexact" ${
                  editState.domain.mouseClick.ctrlleft.action === 'notsamedomainexact' ? 'selected' : ''
                } data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly</option>
                <option value="notsamedomain" ${
                  editState.domain.mouseClick.ctrlleft.action === 'notsamedomain' ? 'selected' : ''
                } data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
                <option value="always" ${
                  editState.domain.mouseClick.ctrlleft.action === 'always' ? 'selected' : ''
                } data-i18n="optionsIsolationAlways">Always Isolate</option>
              </select>
            </div>
            <div class="field">
              <label for="leftClickAction" data-i18n="optionsIsolationGlobalLeftClick">Left Click</label>
              <select id="leftClickAction">
                <option value="global" ${
                  editState.domain.mouseClick.left.action === 'global' ? 'selected' : ''
                } data-i18n="useGlobalSetting">Use Global Setting</option>
                <option value="never" ${
                  editState.domain.mouseClick.left.action === 'never' ? 'selected' : ''
                } data-i18n="optionsIsolationNever">Never Isolate</option>
                <option value="notsamedomainexact" ${
                  editState.domain.mouseClick.left.action === 'notsamedomainexact' ? 'selected' : ''
                } data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly</option>
                <option value="notsamedomain" ${
                  editState.domain.mouseClick.left.action === 'notsamedomain' ? 'selected' : ''
                } data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
                <option value="always" ${
                  editState.domain.mouseClick.left.action === 'always' ? 'selected' : ''
                } data-i18n="optionsIsolationAlways">Always Isolate</option>
              </select>
            </div>
          </div>

          <!-- Excluded Domains -->
          <div class="section">
            <h4 data-i18n="optionsIsolationExcludeTargetDomains">Exclude Target Domains</h4>
            <div class="field">
              <label for="excludeDomainInput" data-i18n="optionsIsolationAddExcludedDomain">Add Excluded Domain</label>
              <div class="field-description" data-i18n="optionsIsolationExcludeDomainsDescription">Domains that should not trigger isolation for this rule.</div>
              <div class="input-group">
                <input type="text" id="excludeDomainInput" placeholder="example.com or *.example.com" data-i18n-placeholder="optionsDomainPatternPlaceholder" data-i18n-title="optionsDomainPatternDescription" title="Use exact domains (example.com), subdomains (sub.example.com) or wildcards (*.example.com) to match URLs" />
                <button type="button" id="addExcludedDomain" class="small" data-i18n="optionsIsolationAddExclusion">Add Exclusion</button>
              </div>
            </div>
            <div id="excludedDomainsList" class="excluded-domains-list">
              ${
                editState.domain.excluded.length === 0
                  ? '<p data-i18n="optionsIsolationNoExcludedDomains">No domains excluded.</p>'
                  : editState.domain.excluded
                      .map(
                        excludedDomain =>
                          `<div class="excluded-domain-item">
                    <span>${excludedDomain}</span>
                    <button type="button" class="small danger remove-excluded-domain" data-domain="${excludedDomain}" data-i18n="remove">Remove</button>
                  </div>`
                      )
                      .join('')
              }
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" id="saveDomainRule" class="button-primary" ${!editState.domain.pattern.trim() ? 'disabled' : ''}>
            ${
              editState.editing
                ? browser.i18n.getMessage('optionsIsolationPerDomainSaveChanges', editState.domain.pattern)
                : browser.i18n.getMessage('optionsIsolationPerDomainAddRule')
            }
          </button>
          ${
            editState.editing
              ? '<button type="button" id="cancelEdit" class="button-secondary" data-i18n="optionsIsolationPerDomainCancel">Cancel</button>'
              : ''
          }
        </div>
      </div>

      <div class="config-list">
        <h3 data-i18n="optionsIsolationPerDomainConfiguredRules">Configured Domain Rules</h3>
        <div id="domainsDisplay"></div>
      </div>
    `;

    if (!section.firstChild) section.appendChild(content);

    // Populate domain rules list
    const domainsDisplay = document.getElementById('domainsDisplay') as HTMLElement;

    domainsDisplay.innerHTML = '';

    if (preferences.isolation.domain.length > 0) {
      preferences.isolation.domain.forEach((domain, index) => {
        // Handle old object format: convert to array if needed
        if (domain.excluded && !Array.isArray(domain.excluded)) {
          console.warn(
            '[IsolationPerDomain] domain.excluded is not an array, converting from object format for pattern:',
            domain.pattern,
            domain.excluded
          );
          domain.excluded = Object.keys(domain.excluded);
          savePreferences(preferences).catch(err => console.error('Failed to save converted domain excluded:', err));
        } else if (!domain.excluded) {
          domain.excluded = [];
        }

        if (domain.excludedContainers && !Array.isArray(domain.excludedContainers)) {
          console.warn(
            '[IsolationPerDomain] domain.excludedContainers is not an array, converting from object format for pattern:',
            domain.pattern,
            domain.excludedContainers
          );
          domain.excludedContainers = Object.keys(domain.excludedContainers);
          savePreferences(preferences).catch(err => console.error('Failed to save converted domain excludedContainers:', err));
        } else if (!domain.excludedContainers) {
          domain.excludedContainers = [];
        }

        const domainSection = document.createElement('div');
        domainSection.className = 'config-group';
        domainSection.innerHTML = `
          <h4>${domain.pattern}</h4>
        `;

        const domainItem = document.createElement('div');
        domainItem.className = 'config-item';
        domainItem.innerHTML = `
          <div class="config-item-details">
            <div><strong data-i18n="optionsIsolationPerDomainAlways">Always Open:</strong> ${domain.always.action}</div>
            <div><strong data-i18n="optionsIsolationPerDomainNavigation">URL Navigation:</strong> ${domain.navigation.action}</div>
            <div><strong data-i18n="optionsIsolationPerDomainExclude">Excluded Domains:</strong> ${domain.excluded.length} domains</div>
          </div>
          <div class="config-item-actions">
            <button type="button" class="small edit-domain" data-index="${index}" data-i18n="optionsIsolationPerDomainEdit">Edit</button>
            <button type="button" class="small danger remove-domain" data-index="${index}" data-i18n="optionsIsolationPerDomainRemove">Remove</button>
          </div>
        `;

        domainSection.appendChild(domainItem);
        domainsDisplay.appendChild(domainSection);
      });
    } else {
      domainsDisplay.innerHTML = '<p data-i18n="optionsIsolationNoRulesConfigured">No domain isolation rules configured.</p>';
    }

    // Set up event listeners
    setupEventListeners(content, preferences);
  } catch (error) {
    console.error('[IsolationPerDomain] Failed to load settings page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadIsolationPerDomain'));
  }
}

function setupEventListeners(content: HTMLElement, preferences: PreferencesSchema): void {
  // Domain pattern input changes
  const domainPatternInput = content.querySelector('#domainPatternInput') as HTMLInputElement;
  const domainSettings = content.querySelector('#domainSettings') as HTMLElement;
  const saveDomainRuleButton = content.querySelector('#saveDomainRule') as HTMLButtonElement;

  domainPatternInput?.addEventListener('input', () => {
    editState.domain.pattern = domainPatternInput.value.trim();
    updateDomainSettingsVisibility(domainSettings, saveDomainRuleButton, editState.domain.pattern);
  });

  // Always action change
  const alwaysAction = content.querySelector('#alwaysAction') as HTMLSelectElement;
  const alwaysOptions = content.querySelector('#alwaysOptions') as HTMLElement;

  alwaysAction?.addEventListener('change', () => {
    editState.domain.always.action = alwaysAction.value as any;
    alwaysOptions.style.display = alwaysAction.value === 'enabled' ? '' : 'none';
  });

  // Always options checkboxes
  const allowedInPermanent = content.querySelector('#allowedInPermanent') as HTMLInputElement;
  const allowedInTemporary = content.querySelector('#allowedInTemporary') as HTMLInputElement;

  allowedInPermanent?.addEventListener('change', () => {
    editState.domain.always.allowedInPermanent = allowedInPermanent.checked;
  });

  allowedInTemporary?.addEventListener('change', () => {
    editState.domain.always.allowedInTemporary = allowedInTemporary.checked;
  });

  // Navigation action
  const navigationAction = content.querySelector('#navigationAction') as HTMLSelectElement;
  navigationAction?.addEventListener('change', () => {
    editState.domain.navigation.action = navigationAction.value as any;
  });

  // Mouse click actions
  const middleClickAction = content.querySelector('#middleClickAction') as HTMLSelectElement;
  const ctrlLeftClickAction = content.querySelector('#ctrlLeftClickAction') as HTMLSelectElement;
  const leftClickAction = content.querySelector('#leftClickAction') as HTMLSelectElement;

  middleClickAction?.addEventListener('change', () => {
    editState.domain.mouseClick.middle.action = middleClickAction.value as any;
  });

  ctrlLeftClickAction?.addEventListener('change', () => {
    editState.domain.mouseClick.ctrlleft.action = ctrlLeftClickAction.value as any;
  });

  leftClickAction?.addEventListener('change', () => {
    editState.domain.mouseClick.left.action = leftClickAction.value as any;
  });

  // Add excluded domain
  const excludeDomainInput = content.querySelector('#excludeDomainInput') as HTMLInputElement;
  const addExcludedDomainButton = content.querySelector('#addExcludedDomain') as HTMLButtonElement;

  addExcludedDomainButton?.addEventListener('click', () => {
    const excludedDomain = excludeDomainInput.value.trim();
    if (excludedDomain && !editState.domain.excluded.includes(excludedDomain)) {
      editState.domain.excluded.push(excludedDomain);
      excludeDomainInput.value = '';
      updateExcludedDomainsList(content);
    }
  });

  // Save domain rule
  saveDomainRuleButton?.addEventListener('click', async () => {
    await saveDomainRule(preferences);
  });

  // Cancel edit
  const cancelEditButton = content.querySelector('#cancelEdit') as HTMLButtonElement;
  cancelEditButton?.addEventListener('click', () => {
    resetEditState();
    initIsolationPerDomainPage();
  });

  // Domain rule actions (edit/remove)
  setupDomainRuleActions(content, preferences);

  // Set up excluded domain removal
  setupExcludedDomainRemoval(content);
}

function updateDomainSettingsVisibility(domainSettings: HTMLElement, saveDomainRuleButton: HTMLButtonElement, pattern: string): void {
  if (pattern) {
    domainSettings.style.opacity = '1';
    domainSettings.style.pointerEvents = 'auto';
    saveDomainRuleButton.disabled = false;
  } else {
    domainSettings.style.opacity = '0.3';
    domainSettings.style.pointerEvents = 'none';
    saveDomainRuleButton.disabled = true;
  }
  updateSaveButtonText(saveDomainRuleButton);
}

function updateSaveButtonText(saveDomainRuleButton: HTMLButtonElement): void {
  if (editState.editing) {
    saveDomainRuleButton.textContent = browser.i18n.getMessage('optionsIsolationPerDomainSaveChanges', editState.domain.pattern);
  } else {
    saveDomainRuleButton.textContent = browser.i18n.getMessage('optionsIsolationPerDomainAddRule');
  }
}

function updateExcludedDomainsList(content: HTMLElement): void {
  const excludedDomainsList = content.querySelector('#excludedDomainsList') as HTMLElement;
  const excludedDomains = editState.domain.excluded;

  if (excludedDomains.length === 0) {
    excludedDomainsList.innerHTML = '<p data-i18n="optionsIsolationNoExcludedDomains">No domains excluded.</p>';
  } else {
    excludedDomainsList.innerHTML = excludedDomains
      .map(
        excludedDomain =>
          `<div class="excluded-domain-item">
        <span>${excludedDomain}</span>
        <button type="button" class="small danger remove-excluded-domain" data-domain="${excludedDomain}" data-i18n="remove">Remove</button>
      </div>`
      )
      .join('');
  }

  setupExcludedDomainRemoval(content);
}

function setupExcludedDomainRemoval(content: HTMLElement): void {
  const removeButtons = content.querySelectorAll('.remove-excluded-domain');
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const domain = (button as HTMLElement).dataset.domain;
      if (domain) {
        const index = editState.domain.excluded.indexOf(domain);
        if (index > -1) {
          editState.domain.excluded.splice(index, 1);
          updateExcludedDomainsList(content);
        }
      }
    });
  });
}

function setupDomainRuleActions(content: HTMLElement, preferences: PreferencesSchema): void {
  // Edit buttons
  const editButtons = content.querySelectorAll('.edit-domain');
  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt((button as HTMLElement).dataset.index || '0');
      editDomainRule(index, preferences);
    });
  });

  // Remove buttons
  const removeButtons = content.querySelectorAll('.remove-domain');
  removeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const index = parseInt((button as HTMLElement).dataset.index || '0');
      await removeDomainRule(index, preferences);
    });
  });
}

function editDomainRule(index: number, preferences: PreferencesSchema): void {
  const domain = preferences.isolation.domain[index];
  if (domain) {
    // Handle old object format: convert to array if needed before editing
    if (domain.excluded && !Array.isArray(domain.excluded)) {
      console.warn('[IsolationPerDomain] Converting domain.excluded from object to array for editing:', domain.pattern);
      domain.excluded = Object.keys(domain.excluded);
    } else if (!domain.excluded) {
      domain.excluded = [];
    }

    if (domain.excludedContainers && !Array.isArray(domain.excludedContainers)) {
      console.warn('[IsolationPerDomain] Converting domain.excludedContainers from object to array for editing:', domain.pattern);
      domain.excludedContainers = Object.keys(domain.excludedContainers);
    } else if (!domain.excludedContainers) {
      domain.excludedContainers = [];
    }

    editState.editing = true;
    editState.editIndex = index;
    editState.domain = JSON.parse(JSON.stringify(domain)); // Deep clone
    initIsolationPerDomainPage();
  }
}

async function removeDomainRule(index: number, preferences: PreferencesSchema): Promise<void> {
  const domain = preferences.isolation.domain[index];
  if (domain && window.confirm(browser.i18n.getMessage('optionsIsolationPerDomainRemoveConfirm', domain.pattern))) {
    try {
      preferences.isolation.domain.splice(index, 1);
      await savePreferences(preferences);
      resetEditState();
      await initIsolationPerDomainPage();
      showSuccess(browser.i18n.getMessage('optionsIsolationPerDomainRuleRemoved'));
    } catch (error) {
      console.error('Error removing domain rule:', error);
      showError(browser.i18n.getMessage('errorFailedToSave'));
    }
  }
}

async function saveDomainRule(preferences: PreferencesSchema): Promise<void> {
  try {
    if (!editState.domain.pattern.trim()) {
      showError(browser.i18n.getMessage('optionsIsolationPerDomainPatternRequired'));
      return;
    }

    // Check for duplicates (except when editing the same domain)
    const existingIndex = preferences.isolation.domain.findIndex(d => d.pattern === editState.domain.pattern);
    if (existingIndex !== -1 && (!editState.editing || existingIndex !== editState.editIndex)) {
      showError(browser.i18n.getMessage('optionsIsolationPerDomainPatternExists'));
      return;
    }

    const domainRule = JSON.parse(JSON.stringify(editState.domain)); // Deep clone

    if (editState.editing) {
      preferences.isolation.domain[editState.editIndex] = domainRule;
    } else {
      preferences.isolation.domain.push(domainRule);
    }

    await savePreferences(preferences);
    resetEditState();
    await initIsolationPerDomainPage();
    showSuccess(
      editState.editing
        ? browser.i18n.getMessage('optionsIsolationPerDomainRuleUpdated')
        : browser.i18n.getMessage('optionsIsolationPerDomainRuleAdded')
    );
  } catch (error) {
    console.error('Error saving domain rule:', error);
    showError(browser.i18n.getMessage('errorFailedToSave'));
  }
}

function resetEditState(): void {
  editState.editing = false;
  editState.editIndex = -1;
  editState.domain = createDefaultDomain();
}
