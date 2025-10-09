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
      <!-- Automatic Mode Configuration -->
      <div class="section">
        <h3 data-i18n="optionsAdvancedMiscAutomaticMode">Automatic Mode</h3>
        <div class="field">
          <label for="automaticModeNewTab" data-i18n="optionsAdvancedMiscAutomaticModeNewTab">When to create Temporary Containers for new tabs:</label>
          <select id="automaticModeNewTab" data-setting="automaticMode.newTab">
            <option value="created" data-i18n="optionsAdvancedMiscAutomaticModeNewTabCreated" ${
              preferences.automaticMode?.newTab === 'created' ? 'selected' : ''
            }>On Tab Creation (default - best cookie protection)</option>
            <option value="navigation" data-i18n="optionsAdvancedMiscAutomaticModeNewTabNavigation" ${
              preferences.automaticMode?.newTab === 'navigation' ? 'selected' : ''
            }>On Tab Navigation (typed address protection)</option>
          </select>
        </div>
      </div>

      <!-- Context Menu -->
      <div class="section">
        <h3 data-i18n="contextMenu">Context Menu</h3>
        <div class="field checkbox-field">
          <input type="checkbox" id="contextMenu" data-setting="contextMenu" ${preferences.contextMenu ? 'checked' : ''} />
          <label for="contextMenu" data-i18n="optionsAdvancedMiscContextMenuLinks">Show Temporary Container entry in the right click on links context menu</label>
        </div>
        <div class="field checkbox-field">
          <input type="checkbox" id="contextMenuBookmarks" data-setting="contextMenuBookmarks" ${preferences.contextMenuBookmarks ? 'checked' : ''} />
          <label for="contextMenuBookmarks" data-i18n="optionsAdvancedMiscContextMenuBookmarks">Show Temporary Container entry in the right click on bookmarks context menu</label>
        </div>
      </div>

      <!-- Isolation Settings -->
      <div class="section">
        <h3 data-i18n="optionsAdvancedMiscIsolation">Isolation</h3>
        <div class="field checkbox-field">
          <input type="checkbox" id="replaceTabs" data-setting="replaceTabs" ${preferences.replaceTabs ? 'checked' : ''} />
          <label for="replaceTabs" data-i18n="optionsAdvancedMiscReplaceTabs">Instead of creating a new tab replace the current tab in case of Isolation</label>
        </div>

        <div class="field checkbox-field" data-i18n-title="optionsAdvancedMiscCloseRedirectorTabsDescription" title="Closes tabs from: t.co (Twitter), outgoing.prod.mozaws.net (AMO), slack-redir.net (Slack), away.vk.com (VK)">
          <input type="checkbox" id="closeRedirectorTabs" data-setting="closeRedirectorTabs.active" ${preferences.closeRedirectorTabs?.active ? 'checked' : ''} />
          <label for="closeRedirectorTabs" data-i18n="optionsAdvancedMiscCloseRedirectorTabs">Automatically close leftover redirector tabs after 2 seconds</label>
        </div>
        
        <div class="field">
          <label for="reactivateDelay" data-i18n="optionsAdvancedMiscReactivateDelay">Automatically re-enable Isolation after n seconds (0 = disabled)</label>
          <input type="number" id="reactivateDelay" data-setting="isolation.reactivateDelay" min="0" value="${preferences.isolation?.reactivateDelay || 0}" />
        </div>
        
        <div class="field">
          <label for="isolationMac" data-i18n="optionsAdvancedMiscIsolationMac">Multi-Account Containers</label>
          <select id="isolationMac" data-setting="isolation.mac.action">
            <option value="disabled" ${
              preferences.isolation?.mac?.action === 'disabled' ? 'selected' : ''
            } data-i18n="optionsIsolationDisabled">Disabled</option>
            <option value="enabled" ${
              preferences.isolation?.mac?.action === 'enabled' ? 'selected' : ''
            } data-i18n="optionsAdvancedMiscIsolationMacEnabled">Isolate Non-MAC</option>
          </select>
        </div>
        
        <div class="field">
          <label for="ignoredDomains" data-i18n="optionsIsolationIgnoredDomains">Ignored Target Domains</label>
          <div class="field-description" data-i18n="optionsIsolationIgnoredDomainsDescription">Ignored domains will not be isolated.</div>
          <div class="tag-input-container">
            <input type="text" id="ignoredDomainsInput" placeholder="example.com or *.example.com" data-i18n-placeholder="optionsDomainPatternPlaceholder" data-i18n-title="optionsDomainPatternDescription" title="Use exact domains (example.com), subdomains (sub.example.com) or wildcards (*.example.com) to match URLs" />
            <button type="button" id="addIgnoredDomain" class="small" data-i18n="add">Add</button>
            <div id="ignoredDomains" class="tag-list"></div>
          </div>
        </div>
      </div>

      <!-- UI Settings -->
      <div class="section">
        <h3 data-i18n="optionsAdvancedMiscUI">User Interface</h3>
        <div class="field checkbox-field">
          <input type="checkbox" id="pageAction" data-setting="pageAction" ${preferences.pageAction ? 'checked' : ''} />
          <label for="pageAction" data-i18n="optionsAdvancedMiscPageAction">Show popup menu icon in the address bar</label>
        </div>
        
        <div class="field">
          <label for="popupDefaultTab" data-i18n="optionsAdvancedMiscPopupDefaultTab">Default Popup Tab</label>
          <select id="popupDefaultTab" data-setting="ui.popupDefaultTab">
            <option value="isolation-global" ${
              preferences.ui?.popupDefaultTab === 'isolation-global' ? 'selected' : ''
            } data-i18n="optionsIsolationTabGlobal">Isolation: Global</option>
            <option value="isolation-per-domain" ${
              preferences.ui?.popupDefaultTab === 'isolation-per-domain' ? 'selected' : ''
            } data-i18n="optionsIsolationTabPerDomain">Isolation: Per Domain</option>
            <option value="actions" ${
              preferences.ui?.popupDefaultTab === 'actions' ? 'selected' : ''
            } data-i18n="optionsNavActions">Actions</option>
            <option value="statistics" ${
              preferences.ui?.popupDefaultTab === 'statistics' ? 'selected' : ''
            } data-i18n="optionsNavStatistics">Statistics</option>
          </select>
        </div>
      </div>

      <!-- Reset Storage -->
      <div class="section">
        <h3 data-i18n="optionsAdvancedMiscResetStorage">Reset Storage</h3>
        <div class="field">
          <button type="button" id="resetStorage" class="danger" data-i18n="optionsAdvancedMiscResetStorageButton">Wipe local storage and reset it to default</button>
          <div class="field-description" data-i18n="optionsAdvancedMiscResetStorageDescription">This action cannot be undone. All settings will be lost.</div>
        </div>
      </div>
    `;

    if (!section.firstChild) section.appendChild(content);

    // Set up event listeners
    setupEventListeners(content, preferences, permissions);
  } catch (error) {
    console.error('Error initializing advanced misc page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadAdvancedMisc'));
  }
}

function setupEventListeners(content: HTMLElement, preferences: PreferencesSchema, _permissions: any): void {
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

  // Automatic mode new tab behavior setting
  const automaticModeNewTabSelect = content.querySelector('#automaticModeNewTab') as HTMLSelectElement;

  automaticModeNewTabSelect?.addEventListener('change', async () => {
    if (!preferences.automaticMode) preferences.automaticMode = { active: false, newTab: 'created' };
    preferences.automaticMode.newTab = automaticModeNewTabSelect.value as 'created' | 'navigation';
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
        domains: ['t.co', 'outgoing.prod.mozaws.net', 'slack-redir.net', 'away.vk.com'],
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
  const pageActionCheckbox = content.querySelector('#pageAction') as HTMLInputElement;
  const popupDefaultTabSelect = content.querySelector('#popupDefaultTab') as HTMLSelectElement;

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

  // Ignored Domains logic
  const ignoredDomainsInput = content.querySelector('#ignoredDomainsInput') as HTMLInputElement;
  const addIgnoredDomainButton = content.querySelector('#addIgnoredDomain') as HTMLButtonElement;
  const ignoredDomainsDiv = content.querySelector('#ignoredDomains') as HTMLElement;

  function renderIgnoredDomains() {
    ignoredDomainsDiv.innerHTML = '';
    (preferences.ignoreRequests || []).forEach((domain: string) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = domain;
      const remove = document.createElement('button');
      remove.className = 'tag-remove danger small';
      remove.textContent = '×';
      remove.addEventListener('click', async () => {
        preferences.ignoreRequests = preferences.ignoreRequests.filter((d: string) => d !== domain);
        await savePreferences(preferences);
        renderIgnoredDomains();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      });
      tag.appendChild(remove);
      ignoredDomainsDiv.appendChild(tag);
    });
  }
  renderIgnoredDomains();

  addIgnoredDomainButton?.addEventListener('click', async () => {
    const domain = ignoredDomainsInput.value.trim();
    if (domain && !preferences.ignoreRequests?.includes(domain)) {
      if (!preferences.ignoreRequests) preferences.ignoreRequests = [];
      preferences.ignoreRequests.push(domain);
      await savePreferences(preferences);
      ignoredDomainsInput.value = '';
      renderIgnoredDomains();
      showSuccess(browser.i18n.getMessage('savedMessage'));
    }
  });

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
