// Shared IsolationPerDomain page logic for both options and popup menus
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

export async function initIsolationPerDomainPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('isolation-domain');
    if (!section) return;
    section.innerHTML = '';
    // Create form content
    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="field">
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
            ${preferences.isolation.domain.length === 0 ? `<p data-i18n="noDomainIsolationRulesConfigured">No domain isolation rules configured.</p>` : ''}
          </div>
        </div>
      </div>
    `;
    if (!section.firstChild) section.appendChild(content);

    // Add domain list items
    const domainList = content.querySelector('#domainRulesList') as HTMLElement;
    preferences.isolation.domain.forEach(domain => {
      const domainItem = document.createElement('div');
      domainItem.className = 'domain-rule';
      domainItem.innerHTML = `
        <div class="domain-rule-domain">${domain.pattern}</div>
        <div class="domain-rule-action">${domain.navigation?.action || 'global'}</div>
        <div class="domain-rule-buttons">
          <button class="button small edit-domain" data-domain="${domain.pattern}"><i class="icon-pencil"></i> Edit</button>
          <button class="button small danger remove-domain" data-domain="${domain.pattern}"><i class="icon-trash"></i> Delete</button>
        </div>
      `;
      domainList.appendChild(domainItem);
    });
    // Add event listeners
    const addDomainRuleButton = content.querySelector('#addDomainRule') as HTMLButtonElement;
    const domainRuleInput = content.querySelector('#domainRuleInput') as HTMLInputElement;
    const domainRuleAction = content.querySelector('#domainRuleAction') as HTMLSelectElement;
    addDomainRuleButton?.addEventListener('click', async () => {
      const domain = domainRuleInput.value.trim();
      const action = domainRuleAction.value;
      if (!domain) {
        alert('Please enter a domain');
        return;
      }
      try {
        preferences.isolation.domain.push({
          pattern: domain,
          always: {
            action: 'disabled',
            allowedInPermanent: false,
            allowedInTemporary: false,
          },
          navigation: {
            action: action as any,
          },
          mouseClick: {
            middle: { action: 'global', container: 'default' },
            ctrlleft: { action: 'global', container: 'default' },
            left: { action: 'global', container: 'default' },
          },
          excluded: [],
          excludedContainers: [],
        });
        await savePreferences(preferences);
        domainRuleInput.value = '';
        await initIsolationPerDomainPage(); // reload
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (error) {
        showError('Error adding domain rule: ' + error);
      }
    });
    // Domain list item actions
    const editButtons = content.querySelectorAll('.edit-domain');
    const removeButtons = content.querySelectorAll('.remove-domain');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const domainPattern = (button as HTMLElement).dataset.domain;
        alert('Edit domain isolation for: ' + domainPattern); // TODO: implement edit dialog
      });
    });
    removeButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const domainPattern = (button as HTMLElement).dataset.domain;
        if (confirm('Remove isolation rule for: ' + domainPattern + '?')) {
          const index = preferences.isolation.domain.findIndex(d => d.pattern === domainPattern);
          if (index !== -1) {
            preferences.isolation.domain.splice(index, 1);
            await savePreferences(preferences);
            await initIsolationPerDomainPage(); // reload
            showSuccess(browser.i18n.getMessage('savedMessage'));
          }
        }
      });
    });

  } catch (error) {
    showError(browser.i18n.getMessage('errorFailedToLoadIsolationPerDomain'));
  }
}
