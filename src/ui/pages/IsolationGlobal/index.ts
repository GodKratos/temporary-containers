// Shared IsolationGlobal page logic for both options and popup menus
import { getPreferences, getStorage, savePreferences, showError, showSuccess } from '../../shared/utils';

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
      <!-- Global Isolation -->
      <div class="section">
        <h3 data-i18n="optionsIsolationGlobalGlobalIsolation">Global Isolation</h3>
        <div class="field">
          <label for="isolationGlobalUrlNavigation" data-i18n="optionsIsolationGlobalUrlNavigation">URL Navigation</label>
          <div class="field-description" data-i18n="optionsIsolationGlobalUrlNavigationDescription">Global isolation rule for all URL navigation in existing tabs, new tabs, address bar and mouse clicks.</div>
          <select id="isolationGlobalUrlNavigation" name="isolationGlobalUrlNavigation" data-setting="isolation.global.navigation.action">
            <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
            <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
            <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
            <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
          </select>
        </div>
      </div>

      <!-- Mouse Navigation -->
      <div class="section">
        <h3 data-i18n="optionsIsolationGlobalMouseNavigation">Mouse Navigation</h3>
        <div class="field-description" data-i18n="optionsIsolationGlobalMouseDescription">Isolation rules for mouse click activities. When used with global or domain isolation enabled, any setting that enables isolation will be enforced.</div>
        <div class="field">
          <label for="isolationGlobalLeftClick" data-i18n="optionsIsolationGlobalLeftClick">Left Click</label>
          <select id="isolationGlobalLeftClick" name="isolationGlobalLeftClick" data-setting="isolation.global.mouseClick.left.action">
            <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
            <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
            <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
            <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
          </select>
        </div>
        <div class="field">
          <label for="isolationGlobalMiddleClick" data-i18n="optionsIsolationGlobalMiddleClick">Middle Click</label>
          <select id="isolationGlobalMiddleClick" name="isolationGlobalMiddleClick" data-setting="isolation.global.mouseClick.middle.action">
            <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
            <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
            <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
            <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
          </select>
        </div>
        <div class="field">
          <label for="isolationGlobalCtrlLeftClick" data-i18n="optionsIsolationGlobalCtrlLeftClick">Ctrl/Cmd + Left Click</label>
          <select id="isolationGlobalCtrlLeftClick" name="isolationGlobalCtrlLeftClick" data-setting="isolation.global.mouseClick.ctrlleft.action">
            <option value="never" data-i18n="optionsIsolationNever">Never Isolate</option>
            <option value="notsamedomainexact" data-i18n="optionsIsolationDomain">Isolate if target domain does not match exactly with current domain</option>
            <option value="notsamedomain" data-i18n="optionsIsolationSubdomain">Isolate if target domain does not match current domain or subdomains</option>
            <option value="always" data-i18n="optionsIsolationAlways">Always Isolate</option>
          </select>
        </div>
      </div>

      <!-- Exclusions -->
      <div class="section">
        <h3 data-i18n="optionsIsolationGlobalExclusions">Exclusions</h3>
        <div class="field">
          <label for="excludedContainers" data-i18n="optionsIsolationExcludeContainers">Exclude Permanent Containers</label>
          <div class="field-description" data-i18n="optionsIsolationExcludeContainersDescription">Disables isolation events for the selected containers.</div>
          <div class="tag-input-container">
            <select id="excludedContainersSelect" class="permanent-container-select">
              <option value="" data-i18n="optionsIsolationSelectContainer">Select a container...</option>
            </select>
            <button id="addExcludedContainer" class="small" data-i18n="optionsIsolationAddContainer">Add Container</button>
            <div id="excludedContainers" class="tag-list"></div>
          </div>
        </div>
        <div class="field">
          <label for="excludedDomains" data-i18n="optionsIsolationExcludeTargetDomains">Exclude Target Domains</label>
          <div class="field-description" data-i18n="optionsIsolationExcludeDomainsDescription">Domains that should not trigger isolation for this rule.</div>
          <div class="tag-input-container">
            <input type="text" id="excludedDomainsInput" placeholder="example.com or *.example.com" data-i18n-placeholder="optionsDomainPatternPlaceholder" data-i18n-title="optionsDomainPatternDescription" title="Use exact domains (example.com), subdomains (sub.example.com) or wildcards (*.example.com) to match URLs" />
            <button type="button" id="addExcludedDomain" class="small" data-i18n="optionsIsolationAddExclusion">Add Exclusion</button>
            <div id="excludedDomains" class="tag-list"></div>
          </div>
        </div>

      </div>
    `;
    if (!section.firstChild) section.appendChild(content);

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
        showSuccess(browser.i18n.getMessage('savedMessage'));
      });
    }
    if (leftClickSelect) {
      leftClickSelect.addEventListener('change', async () => {
        preferences.isolation.global.mouseClick.left.action = leftClickSelect.value as any;
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      });
    }
    if (middleClickSelect) {
      middleClickSelect.addEventListener('change', async () => {
        preferences.isolation.global.mouseClick.middle.action = middleClickSelect.value as any;
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      });
    }
    if (ctrlLeftClickSelect) {
      ctrlLeftClickSelect.addEventListener('change', async () => {
        preferences.isolation.global.mouseClick.ctrlleft.action = ctrlLeftClickSelect.value as any;
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
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
      const storage = await getStorage();
      const tempContainers = storage.tempContainers || {};
      permanentContainers = allContainers
        .filter((container: any) => !tempContainers[container.cookieStoreId])
        .map((container: any) => ({ id: container.cookieStoreId, name: container.name }));
    } catch (_error) {
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

      // Handle old object format: convert to array if needed
      let containersArray = preferences.isolation.global.excludedContainers;
      if (!Array.isArray(containersArray)) {
        console.warn('[IsolationGlobal] excludedContainers is not an array, converting from object format:', containersArray);
        containersArray = containersArray ? Object.keys(containersArray) : [];
        preferences.isolation.global.excludedContainers = containersArray;
        savePreferences(preferences).catch(err => console.error('Failed to save converted excludedContainers:', err));
      }

      (containersArray || []).forEach((id: string) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = permanentContainers.find(c => c.id === id)?.name || id;
        const remove = document.createElement('button');
        remove.className = 'tag-remove danger small';
        remove.textContent = '×';
        remove.addEventListener('click', async () => {
          preferences.isolation.global.excludedContainers = preferences.isolation.global.excludedContainers.filter(
            (cid: string) => cid !== id
          );
          await savePreferences(preferences);
          renderExcludedContainers();
          showSuccess(browser.i18n.getMessage('savedMessage'));
        });
        tag.appendChild(remove);
        excludedContainersDiv.appendChild(tag);
      });
    }
    renderExcludedContainers();
    addExcludedContainerBtn?.addEventListener('click', async e => {
      e.preventDefault();
      const id = excludedContainersSelect.value;
      if (id && !preferences.isolation.global.excludedContainers.includes(id)) {
        preferences.isolation.global.excludedContainers.push(id);
        await savePreferences(preferences);
        renderExcludedContainers();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      }
    });

    // Excluded Domains logic
    const excludedDomainsInput = content.querySelector('#excludedDomainsInput') as HTMLInputElement;
    const addExcludedDomainButton = content.querySelector('#addExcludedDomain') as HTMLButtonElement;
    const excludedDomainsDiv = content.querySelector('#excludedDomains') as HTMLElement;

    function renderExcludedDomains() {
      excludedDomainsDiv.innerHTML = '';

      // Handle old object format: convert to array if needed
      if (!preferences.isolation.global.excluded) {
        preferences.isolation.global.excluded = [];
      } else if (!Array.isArray(preferences.isolation.global.excluded)) {
        console.warn('[IsolationGlobal] excluded is not an array, converting from object format:', preferences.isolation.global.excluded);
        preferences.isolation.global.excluded = Object.keys(preferences.isolation.global.excluded);
        savePreferences(preferences).catch(err => console.error('Failed to save converted excluded:', err));
      }

      preferences.isolation.global.excluded.forEach((domain: string) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = domain;
        const remove = document.createElement('button');
        remove.className = 'tag-remove danger small';
        remove.textContent = '×';
        remove.addEventListener('click', async () => {
          preferences.isolation.global.excluded = preferences.isolation.global.excluded.filter((d: string) => d !== domain);
          await savePreferences(preferences);
          renderExcludedDomains();
          showSuccess(browser.i18n.getMessage('savedMessage'));
        });
        tag.appendChild(remove);
        excludedDomainsDiv.appendChild(tag);
      });
    }
    renderExcludedDomains();

    addExcludedDomainButton?.addEventListener('click', async () => {
      const domain = excludedDomainsInput.value.trim();
      if (!preferences.isolation.global.excluded) {
        preferences.isolation.global.excluded = [];
      }
      if (domain && !preferences.isolation.global.excluded.includes(domain)) {
        preferences.isolation.global.excluded.push(domain);
        await savePreferences(preferences);
        excludedDomainsInput.value = '';
        renderExcludedDomains();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      }
    });
  } catch (error) {
    console.error('[IsolationGlobal] Failed to load settings page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadIsolationGlobal'));
  }
}
