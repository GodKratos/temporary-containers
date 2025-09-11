// Advanced: Misc page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess, getPermissions } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

export async function initAdvancedMiscPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const permissions = await getPermissions();
    const section = document.getElementById('advanced-misc');
    if (!section) return;
    section.innerHTML = '';
    
    const content = document.createElement('div');
    content.className = 'form';
    
    content.innerHTML = `
      <!-- Context Menu -->
      <details class="collapsible-section">
        <summary data-i18n="contextMenu">Context Menu</summary>
        <div class="collapsible-content">
          <div class="field checkbox-field">
            <input type="checkbox" id="contextMenu" ${preferences.contextMenu ? 'checked' : ''} />
            <label for="contextMenu" data-i18n="optionsAdvancedMiscContextMenuLinks">Show Temporary Container entry in the right click on links context menu</label>
          </div>
          <div class="field checkbox-field">
            <input type="checkbox" id="contextMenuBookmarks" ${preferences.contextMenuBookmarks ? 'checked' : ''} />
            <label for="contextMenuBookmarks" data-i18n="optionsAdvancedMiscContextMenuBookmarks">Show Temporary Container entry in the right click on bookmarks context menu</label>
          </div>
        </div>
      </details>

      <!-- Isolation Settings -->
      <details class="collapsible-section">
        <summary data-i18n="optionsAdvancedMiscIsolation">Isolation</summary>
        <div class="collapsible-content">
          <div class="field checkbox-field">
            <input type="checkbox" id="replaceTabs" ${preferences.replaceTabs ? 'checked' : ''} />
            <label for="replaceTabs" data-i18n="optionsAdvancedMiscReplaceTabs">Instead of creating a new tab replace the current tab in case of Isolation</label>
          </div>
          
          <div class="field checkbox-field">
            <input type="checkbox" id="closeRedirectorTabs" ${preferences.closeRedirectorTabs?.active ? 'checked' : ''} />
            <label for="closeRedirectorTabs" data-i18n="optionsAdvancedMiscCloseRedirectorTabs">Automatically close leftover redirector tabs after 2 seconds</label>
            <div class="field-description" data-i18n="optionsAdvancedMiscCloseRedirectorTabsDescription">Closes tabs from: t.co (Twitter), outgoing.prod.mozaws.net (AMO), slack-redir.net (Slack), away.vk.com (VK)</div>
          </div>
          
          <div class="field">
            <label for="reactivateDelay" data-i18n="optionsAdvancedMiscReactivateDelay">Automatically re-enable Isolation after n seconds (0 = disabled)</label>
            <input type="number" id="reactivateDelay" min="0" value="${preferences.isolation?.reactivateDelay || 0}" />
          </div>
          
          <div class="field">
            <label for="isolationMac" data-i18n="optionsAdvancedMiscIsolationMac">Multi-Account Containers</label>
            <select id="isolationMac">
              <option value="disabled" ${preferences.isolation?.mac?.action === 'disabled' ? 'selected' : ''} data-i18n="optionsIsolationDisabled">Disabled</option>
              <option value="enabled" ${preferences.isolation?.mac?.action === 'enabled' ? 'selected' : ''} data-i18n="optionsAdvancedMiscIsolationMacEnabled">Isolate Non-MAC</option>
            </select>
          </div>
        </div>
      </details>

      <!-- Ignoring Requests -->
      <details class="collapsible-section">
        <summary data-i18n="optionsAdvancedMiscIgnoringRequests">Ignoring Requests</summary>
        <div class="collapsible-content">
          <div class="field-description" data-i18n="optionsAdvancedMiscIgnoringRequestsDescription">Domains on the about:config extensions.webextensions.restrictedDomains list can't be unignored. You should never change that list.</div>
          
          <div class="field">
            <label for="ignoreRequestsInput" data-i18n="optionsAdvancedMiscAddIgnoredDomain">Add Ignored Domain</label>
            <div class="input-group">
              <input type="text" id="ignoreRequestsInput" placeholder="example.com" data-i18n-placeholder="domainPatternExampleCom" />
              <button type="button" id="addIgnoredDomain" class="button-default" data-i18n="add">Add</button>
            </div>
          </div>
          
          <div id="ignoredDomainsList" class="ignored-domains-list">
            ${preferences.ignoreRequests?.length === 0 ? 
              '<p data-i18n="optionsAdvancedMiscNoIgnoredDomains">No domains ignored.</p>' : 
              (preferences.ignoreRequests || []).map(ignoredDomain => 
                `<div class="ignored-domain-item">
                  <span>${ignoredDomain}</span>
                  <button type="button" class="button-small button-danger remove-ignored-domain" data-domain="${ignoredDomain}" data-i18n="remove">Remove</button>
                </div>`
              ).join('')
            }
          </div>
        </div>
      </details>

      <!-- UI Settings -->
      <details class="collapsible-section">
        <summary data-i18n="optionsAdvancedMiscUI">User Interface</summary>
        <div class="collapsible-content">
          <div class="field checkbox-field">
            <input type="checkbox" id="expandPreferences" ${preferences.ui?.expandPreferences ? 'checked' : ''} />
            <label for="expandPreferences" data-i18n="optionsAdvancedMiscExpandPreferences">Expand all preferences by default</label>
          </div>
          
          <div class="field checkbox-field">
            <input type="checkbox" id="pageAction" ${preferences.pageAction ? 'checked' : ''} />
            <label for="pageAction" data-i18n="optionsAdvancedMiscPageAction">Show icon in the address bar that reveals the popup</label>
          </div>
          
          <div class="field">
            <label for="popupDefaultTab" data-i18n="optionsAdvancedMiscPopupDefaultTab">Default Popup Tab</label>
            <select id="popupDefaultTab">
              <option value="isolation-global" ${preferences.ui?.popupDefaultTab === 'isolation-global' ? 'selected' : ''} data-i18n="optionsIsolationTabGlobal">Isolation: Global</option>
              <option value="isolation-per-domain" ${preferences.ui?.popupDefaultTab === 'isolation-per-domain' ? 'selected' : ''} data-i18n="optionsIsolationTabPerDomain">Isolation: Per Domain</option>
              <option value="actions" ${preferences.ui?.popupDefaultTab === 'actions' ? 'selected' : ''} data-i18n="optionsNavActions">Actions</option>
              <option value="statistics" ${preferences.ui?.popupDefaultTab === 'statistics' ? 'selected' : ''} data-i18n="optionsNavStatistics">Statistics</option>
            </select>
          </div>
        </div>
      </details>

      <!-- Reset Storage -->
      <details class="collapsible-section">
        <summary data-i18n="optionsAdvancedMiscResetStorage">Reset Storage</summary>
        <div class="collapsible-content">
          <div class="field">
            <button type="button" id="resetStorage" class="button-danger" data-i18n="optionsAdvancedMiscResetStorageButton">Wipe local storage and reset it to default</button>
            <div class="field-description" data-i18n="optionsAdvancedMiscResetStorageDescription">This action cannot be undone. All settings will be lost.</div>
          </div>
        </div>
      </details>
    `;
    
    if (!section.firstChild) section.appendChild(content);

    // Set up event listeners
    setupEventListeners(content, preferences, permissions);

  } catch (error) {
    console.error('Error initializing advanced misc page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadAdvancedMisc'));
  }
}

function setupEventListeners(content: HTMLElement, preferences: PreferencesSchema, permissions: any): void {
  // Context Menu settings
  const contextMenuCheckbox = content.querySelector('#contextMenu') as HTMLInputElement;
  const contextMenuBookmarksCheckbox = content.querySelector('#contextMenuBookmarks') as HTMLInputElement;
  
  contextMenuCheckbox?.addEventListener('change', async () => {
    preferences.contextMenu = contextMenuCheckbox.checked;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });
  
  contextMenuBookmarksCheckbox?.addEventListener('change', async () => {
    preferences.contextMenuBookmarks = contextMenuBookmarksCheckbox.checked;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });

  // Isolation settings
  const replaceTabsCheckbox = content.querySelector('#replaceTabs') as HTMLInputElement;
  const closeRedirectorTabsCheckbox = content.querySelector('#closeRedirectorTabs') as HTMLInputElement;
  const reactivateDelayInput = content.querySelector('#reactivateDelay') as HTMLInputElement;
  const isolationMacSelect = content.querySelector('#isolationMac') as HTMLSelectElement;
  
  replaceTabsCheckbox?.addEventListener('change', async () => {
    preferences.replaceTabs = replaceTabsCheckbox.checked;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });
  
  closeRedirectorTabsCheckbox?.addEventListener('change', async () => {
    if (!preferences.closeRedirectorTabs) {
      preferences.closeRedirectorTabs = { 
        active: false, 
        delay: 2000, 
        domains: ['t.co', 'outgoing.prod.mozaws.net', 'slack-redir.net', 'away.vk.com'] 
      };
    }
    preferences.closeRedirectorTabs.active = closeRedirectorTabsCheckbox.checked;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });
  
  reactivateDelayInput?.addEventListener('change', async () => {
    if (!preferences.isolation) preferences.isolation = {} as any;
    preferences.isolation.reactivateDelay = parseInt(reactivateDelayInput.value) || 0;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });
  
  isolationMacSelect?.addEventListener('change', async () => {
    if (!preferences.isolation) preferences.isolation = {} as any;
    if (!preferences.isolation.mac) preferences.isolation.mac = { action: 'disabled' };
    preferences.isolation.mac.action = isolationMacSelect.value as any;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });

  // UI settings
  const expandPreferencesCheckbox = content.querySelector('#expandPreferences') as HTMLInputElement;
  const pageActionCheckbox = content.querySelector('#pageAction') as HTMLInputElement;
  const popupDefaultTabSelect = content.querySelector('#popupDefaultTab') as HTMLSelectElement;
  
  expandPreferencesCheckbox?.addEventListener('change', async () => {
    if (!preferences.ui) preferences.ui = {} as any;
    preferences.ui.expandPreferences = expandPreferencesCheckbox.checked;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });
  
  pageActionCheckbox?.addEventListener('change', async () => {
    preferences.pageAction = pageActionCheckbox.checked;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });
  
  popupDefaultTabSelect?.addEventListener('change', async () => {
    if (!preferences.ui) preferences.ui = {} as any;
    preferences.ui.popupDefaultTab = popupDefaultTabSelect.value as any;
    await savePreferences(preferences);
    showSuccess(browser.i18n.getMessage('savedMessage'));
  });

  // Ignored domains
  const ignoreRequestsInput = content.querySelector('#ignoreRequestsInput') as HTMLInputElement;
  const addIgnoredDomainButton = content.querySelector('#addIgnoredDomain') as HTMLButtonElement;
  
  addIgnoredDomainButton?.addEventListener('click', async () => {
    const domain = ignoreRequestsInput.value.trim();
    if (domain && !preferences.ignoreRequests?.includes(domain)) {
      if (!preferences.ignoreRequests) preferences.ignoreRequests = [];
      preferences.ignoreRequests.push(domain);
      await savePreferences(preferences);
      ignoreRequestsInput.value = '';
      await initAdvancedMiscPage(); // Refresh to show the new domain
      showSuccess(browser.i18n.getMessage('savedMessage'));
    }
  });

  // Set up ignored domain removal
  setupIgnoredDomainRemoval(content, preferences);

  // Reset storage
  const resetStorageButton = content.querySelector('#resetStorage') as HTMLButtonElement;
  resetStorageButton?.addEventListener('click', async () => {
    if (!window.confirm(browser.i18n.getMessage('optionsAdvancedMiscResetStorageConfirm'))) {
      return;
    }

    try {
      const reset = await browser.runtime.sendMessage({
        method: 'resetStorage',
      });

      if (!reset) {
        showError(browser.i18n.getMessage('optionsAdvancedMiscResetStorageFailed'));
      } else {
        showSuccess(browser.i18n.getMessage('optionsAdvancedMiscResetStorageSuccess'));
        // Refresh the entire page to show reset settings
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Error resetting storage:', error);
      showError(browser.i18n.getMessage('optionsAdvancedMiscResetStorageFailed'));
    }
  });
}

function setupIgnoredDomainRemoval(content: HTMLElement, preferences: PreferencesSchema): void {
  const removeButtons = content.querySelectorAll('.remove-ignored-domain');
  removeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const domain = (button as HTMLElement).dataset.domain;
      if (domain && preferences.ignoreRequests) {
        const index = preferences.ignoreRequests.indexOf(domain);
        if (index > -1) {
          preferences.ignoreRequests.splice(index, 1);
          await savePreferences(preferences);
          await initAdvancedMiscPage(); // Refresh to remove the domain from display
          showSuccess(browser.i18n.getMessage('savedMessage'));
        }
      }
    });
  });
}
