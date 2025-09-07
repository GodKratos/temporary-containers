// Shared IsolationGlobal page logic for both options and popup menus
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

export async function initIsolationGlobalPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('isolation-global');
    if (!section) return;
    section.innerHTML = '';
    // Create form content
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
    const urlNavigationSelect = content.querySelector('#isolationGlobalUrlNavigation') as HTMLSelectElement;
    const leftClickSelect = content.querySelector('#isolationGlobalLeftClick') as HTMLSelectElement;
    const middleClickSelect = content.querySelector('#isolationGlobalMiddleClick') as HTMLSelectElement;
    const ctrlLeftClickSelect = content.querySelector('#isolationGlobalCtrlLeftClick') as HTMLSelectElement;
    if (urlNavigationSelect) urlNavigationSelect.value = isolationGlobal.navigation.action || 'never';
    if (leftClickSelect) leftClickSelect.value = isolationGlobal.mouseClick.left.action || 'always';
    if (middleClickSelect) middleClickSelect.value = isolationGlobal.mouseClick.middle.action || 'never';
    if (ctrlLeftClickSelect) ctrlLeftClickSelect.value = isolationGlobal.mouseClick.ctrlleft.action || 'never';
    // Add event listeners
    if (urlNavigationSelect) {
      urlNavigationSelect.addEventListener('change', async () => {
        preferences.isolation.global.navigation.action = urlNavigationSelect.value as any;
        await savePreferences(preferences);
        showSuccess('Saved!');
      });
    }
    if (leftClickSelect) {
      leftClickSelect.addEventListener('change', async () => {
        preferences.isolation.global.mouseClick.left.action = leftClickSelect.value as any;
        await savePreferences(preferences);
        showSuccess('Saved!');
      });
    }
    if (middleClickSelect) {
      middleClickSelect.addEventListener('change', async () => {
        preferences.isolation.global.mouseClick.middle.action = middleClickSelect.value as any;
        await savePreferences(preferences);
        showSuccess('Saved!');
      });
    }
    if (ctrlLeftClickSelect) {
      ctrlLeftClickSelect.addEventListener('change', async () => {
        preferences.isolation.global.mouseClick.ctrlleft.action = ctrlLeftClickSelect.value as any;
        await savePreferences(preferences);
        showSuccess('Saved!');
      });
    }

    // Excluded Containers logic
    const excludedContainersSelect = content.querySelector('#excludedContainersSelect') as HTMLSelectElement;
    const addExcludedContainerBtn = content.querySelector('#addExcludedContainer') as HTMLButtonElement;
    const excludedContainersDiv = content.querySelector('#excludedContainers') as HTMLElement;

    // Fetch all containers and filter out temp containers
    let permanentContainers: { id: string; name: string }[] = [];
    try {
      // @ts-ignore
      const allContainers = await browser.contextualIdentities.query({});
      // Get temp containers from storage
      const storage = await (await import('../../shared/utils')).initializeStorage();
      const tempContainers = storage.tempContainers || {};
      permanentContainers = allContainers
        .filter((container: any) => !tempContainers[container.cookieStoreId])
        .map((container: any) => ({ id: container.cookieStoreId, name: container.name }));
    } catch (e) {
      // fallback: empty list
      permanentContainers = [];
    }
    permanentContainers.forEach(container => {
      const option = document.createElement('option');
      option.value = container.id;
      option.textContent = container.name;
      excludedContainersSelect.appendChild(option);
    });
    // Render initial tags
    function renderExcludedContainers() {
      excludedContainersDiv.innerHTML = '';
      (preferences.isolation.global.excludedContainers || []).forEach((id: string) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = permanentContainers.find(c => c.id === id)?.name || id;
        const remove = document.createElement('button');
        remove.className = 'tag-remove';
        remove.textContent = '×';
        remove.addEventListener('click', async () => {
          preferences.isolation.global.excludedContainers = preferences.isolation.global.excludedContainers.filter((cid: string) => cid !== id);
          await savePreferences(preferences);
          renderExcludedContainers();
          showSuccess('Saved!');
        });
        tag.appendChild(remove);
        excludedContainersDiv.appendChild(tag);
      });
    }
    renderExcludedContainers();
    addExcludedContainerBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = excludedContainersSelect.value;
      if (id && !preferences.isolation.global.excludedContainers.includes(id)) {
        preferences.isolation.global.excludedContainers.push(id);
        await savePreferences(preferences);
        renderExcludedContainers();
        showSuccess('Saved!');
      }
    });

    // Ignored Domains logic
    const ignoredDomainsInput = content.querySelector('#ignoredDomainsInput') as HTMLInputElement;
    const ignoredDomainsDiv = content.querySelector('#ignoredDomains') as HTMLElement;
    function renderIgnoredDomains() {
      ignoredDomainsDiv.innerHTML = '';
      (preferences.ignoreRequests || []).forEach((domain: string) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = domain;
        const remove = document.createElement('button');
        remove.className = 'tag-remove';
        remove.textContent = '×';
        remove.addEventListener('click', async () => {
          preferences.ignoreRequests = preferences.ignoreRequests.filter((d: string) => d !== domain);
          await savePreferences(preferences);
          renderIgnoredDomains();
          showSuccess('Saved!');
        });
        tag.appendChild(remove);
        ignoredDomainsDiv.appendChild(tag);
      });
    }
    renderIgnoredDomains();
    ignoredDomainsInput?.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = ignoredDomainsInput.value.trim();
        if (value && !preferences.ignoreRequests.includes(value)) {
          preferences.ignoreRequests.push(value);
          await savePreferences(preferences);
          renderIgnoredDomains();
          ignoredDomainsInput.value = '';
          showSuccess('Saved!');
        }
      }
    });

  section.appendChild(content);
  } catch (error) {
    showError('Failed to load Isolation: Global settings');
  }
}
