// Advanced: Scripts page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess, getPermissions } from '../../shared/utils';
import { Script } from '../../../types';

interface ScriptDefaults {
  code: string;
  runAt: 'document_start' | 'document_end' | 'document_idle';
}

const scriptDefaults: ScriptDefaults = {
  code: '',
  runAt: 'document_idle',
};

export async function initAdvancedScriptsPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const permissions = await getPermissions();
    const section = document.getElementById('advanced-scripts');
    if (!section) return;
    section.innerHTML = '';

    let editing = false;
    let editingIndex = -1;
    let currentDomainPattern = '';
    let currentScript: ScriptDefaults = { ...scriptDefaults };

    const content = document.createElement('div');
    content.className = 'form';

    content.innerHTML = `
      <div class="section">
        <h3 data-i18n="optionsAdvancedScriptsTitle">Configure scripts to execute for certain domains in Temporary Containers</h3>
        <div class="warning-message">
          <strong data-i18n="optionsAdvancedScriptsWarningTitle">Security Warning</strong>
          <br/>
          <span data-i18n="optionsAdvancedScriptsWarning">Scripts have full access to the web page and can read sensitive data, modify content, or perform actions on your behalf. ONLY ADD SCRIPTS FROM TRUSTED SOURCES!</span>
          <br/><br/>
          <strong data-i18n="optionsAdvancedScriptsWarningTitle2">Storage Limits & Sync Considerations</strong>
          <br/>
          <span data-i18n="optionsAdvancedScriptsWarning2">Firefox Sync is limited to 100KB total. Large scripts may prevent preference syncing across devices. Local Storage is limited to 5MB maximum. Exceeding this limit may cause the add-on to malfunction.</span>
          <br/><br/>
          <strong>
            <label class="checkbox-field">
              <input type="checkbox" id="scriptsWarningRead" ${permissions.webNavigation ? 'checked' : ''} ${permissions.webNavigation ? 'disabled' : ''} />
              <span data-i18n="optionsAdvancedScriptsWarningAccept">I understand and want to enable script injection (requires "Access browser activity" permission)</span>
            </label>
          </strong>
        </div>
        <div class="info-message">
          <span data-i18n="optionsAdvancedScriptsInfoMessage">This will call the script API if the tab url being loaded belongs to a Temporary Container and its domain matches the given pattern.</span>
          <br>
          <small>Technical details: Uses <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript" target="_blank" data-i18n="optionsAdvancedScriptsAPITabsExecuteScript">tabs.executeScript</a> API. Pro-tip: Use <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Xray_vision#Waiving_Xray_vision" target="_blank" data-i18n="optionsAdvancedScriptsAPIWindowWrappedJSObject">window.wrappedJSObject</a> to access the original window.</small>
        </div>
        
        <div id="scriptsFormSection" ${!permissions.webNavigation ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>
          <form id="scriptForm">
            <div class="field">
              <label for="scriptDomainPattern" data-i18n="optionsDomainPattern">Domain Pattern (e.g., *.example.com)</label>
              <input type="text" id="scriptDomainPattern" data-i18n-placeholder="optionsDomainPatternPlaceholder" placeholder="example.com or *.example.com" data-i18n-title="optionsDomainPatternDescription" title="Use exact domains (example.com), subdomains (sub.example.com) or wildcards (*.example.com) to match URLs" required />
            </div>
            
            <div class="field">
              <label for="scriptCode" data-i18n="optionsAdvancedScriptsCode">Code</label>
              <small data-i18n="optionsAdvancedScriptsCodeDescription">Enter the JavaScript code to execute when the domain pattern matches</small>
              <textarea id="scriptCode" rows="6" data-i18n-placeholder="optionsAdvancedScriptsCodePlaceholder" placeholder="console.log('Hello from temporary container!');" required></textarea>
            </div>
            
            <div class="field">
              <label for="scriptRunAt" data-i18n="optionsAdvancedScriptsRunAt">Run At</label>
              <select id="scriptRunAt">
                <option value="document_start" data-i18n="optionsAdvancedScriptsDocumentStart">document_start</option>
                <option value="document_end" data-i18n="optionsAdvancedScriptsDocumentEnd">document_end</option>
                <option value="document_idle" data-i18n="optionsAdvancedScriptsDocumentIdle">document_idle</option>
              </select>
            </div>
            
            <div class="field">
              <button type="submit" id="scriptSubmit" class="button-primary" data-i18n="optionsAdvancedScriptsAdd">Add Script</button>
              <button type="button" id="scriptCancel" class="button-secondary" style="display: none;" data-i18n="optionsAdvancedScriptsCancel">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="config-list" id="scriptsList" ${!permissions.webNavigation ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>
        <h3 data-i18n="optionsAdvancedScriptsConfiguredScripts">Configured Scripts</h3>
        <div id="scriptsDisplay"></div>
      </div>
    `;

    if (!section.firstChild) section.appendChild(content);

    // Scripts warning checkbox handler
    const scriptsWarningCheckbox = document.getElementById('scriptsWarningRead') as HTMLInputElement;
    scriptsWarningCheckbox.addEventListener('change', async () => {
      if (!preferences.scripts) preferences.scripts = { active: false, domain: {} };

      if (scriptsWarningCheckbox.checked) {
        // Request permission if not already granted
        try {
          const granted = await browser.permissions.request({ permissions: ['webNavigation'] });
          if (!granted) {
            scriptsWarningCheckbox.checked = false; // Revert UI
            showError(browser.i18n.getMessage('errorFailedToSave'));
            return;
          }
        } catch (e) {
          console.error('Failed to request webNavigation permission', e);
          scriptsWarningCheckbox.checked = false;
          showError(browser.i18n.getMessage('errorFailedToSave'));
          return;
        }
      }

      preferences.scripts.active = scriptsWarningCheckbox.checked;
      scriptsWarningCheckbox.disabled = scriptsWarningCheckbox.checked;

      // Update form/list sections visibility
      const formSection = document.getElementById('scriptsFormSection') as HTMLElement;
      const listSection = document.getElementById('scriptsList') as HTMLElement;
      const opacity = scriptsWarningCheckbox.checked ? '' : 'opacity: 0.3; pointer-events: none;';
      formSection.style.cssText = opacity;
      listSection.style.cssText = opacity;

      try {
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    function updateScriptDisplay() {
      const scriptsDisplay = document.getElementById('scriptsDisplay') as HTMLElement;
      const scriptsDomain = preferences.scripts?.domain || {};

      if (Object.keys(scriptsDomain).length === 0) {
        scriptsDisplay.innerHTML = `<p data-i18n="optionsAdvancedScriptsNoScripts">No scripts configured</p>`;
        return;
      }

      scriptsDisplay.innerHTML = '';

      for (const [domainPattern, scripts] of Object.entries(scriptsDomain)) {
        const domainSection = document.createElement('div');
        domainSection.className = 'config-group';
        domainSection.innerHTML = `
          <h4>${domainPattern}</h4>
        `;

        scripts.forEach((script: Script, index: number) => {
          const scriptItem = document.createElement('div');
          scriptItem.className = 'config-item';

          const codePreview = script.code.length > 100 ? script.code.substring(0, 100) + '...' : script.code;

          scriptItem.innerHTML = `
            <div class="config-item-details">
              <div><strong data-i18n="optionsAdvancedScriptsRunAt">Execute At:</strong> ${script.runAt}</div>
              <div><strong data-i18n="optionsAdvancedScriptsCode">JavaScript Code:</strong></div>
              <pre class="script-code">${codePreview}</pre>
            </div>
            <div class="config-item-actions">
              <button class="small script-edit" data-domain="${domainPattern}" data-index="${index}" data-i18n="optionsAdvancedScriptsEdit">Edit Script</button>
              <button class="small danger script-remove" data-domain="${domainPattern}" data-index="${index}" data-i18n="optionsAdvancedScriptsRemove">Remove</button>
            </div>
          `;

          domainSection.appendChild(scriptItem);
        });

        scriptsDisplay.appendChild(domainSection);
      }

      // Attach event listeners to edit/remove buttons
      scriptsDisplay.querySelectorAll('.script-edit').forEach(button => {
        button.addEventListener('click', e => {
          const target = e.target as HTMLElement;
          const domain = target.dataset.domain!;
          const index = parseInt(target.dataset.index!);
          editScript(domain, index);
        });
      });

      scriptsDisplay.querySelectorAll('.script-remove').forEach(button => {
        button.addEventListener('click', e => {
          const target = e.target as HTMLElement;
          const domain = target.dataset.domain!;
          const index = parseInt(target.dataset.index!);
          removeScript(domain, index);
        });
      });
    }

    function resetForm() {
      editing = false;
      editingIndex = -1;
      currentDomainPattern = '';
      currentScript = { ...scriptDefaults };

      // Reset form fields
      (document.getElementById('scriptDomainPattern') as HTMLInputElement).value = '';
      (document.getElementById('scriptDomainPattern') as HTMLInputElement).disabled = false;
      (document.getElementById('scriptCode') as HTMLTextAreaElement).value = '';
      (document.getElementById('scriptRunAt') as HTMLSelectElement).value = 'document_idle';

      // Reset button states
      (document.getElementById('scriptSubmit') as HTMLButtonElement).textContent = browser.i18n.getMessage('optionsAdvancedScriptsAdd');
      (document.getElementById('scriptCancel') as HTMLButtonElement).style.display = 'none';
    }

    function editScript(domainPattern: string, index: number) {
      const scripts = preferences.scripts?.domain?.[domainPattern];
      if (!scripts || !scripts[index]) return;

      editing = true;
      editingIndex = index;
      currentDomainPattern = domainPattern;
      currentScript = { ...scripts[index] };

      // Fill form with script data
      (document.getElementById('scriptDomainPattern') as HTMLInputElement).value = domainPattern;
      (document.getElementById('scriptDomainPattern') as HTMLInputElement).disabled = true;
      (document.getElementById('scriptCode') as HTMLTextAreaElement).value = currentScript.code;
      (document.getElementById('scriptRunAt') as HTMLSelectElement).value = currentScript.runAt;

      // Update button states
      (document.getElementById('scriptSubmit') as HTMLButtonElement).textContent = browser.i18n.getMessage('optionsAdvancedScriptsSave');
      (document.getElementById('scriptCancel') as HTMLButtonElement).style.display = 'inline-block';

      // Scroll to form
      document.getElementById('scriptForm')?.scrollIntoView({ behavior: 'smooth' });
    }

    async function removeScript(domainPattern: string, index: number) {
      if (!confirm(browser.i18n.getMessage('optionsAdvancedScriptsRemoveConfirm'))) return;

      if (!preferences.scripts) preferences.scripts = { active: false, domain: {} };
      if (!preferences.scripts.domain) preferences.scripts.domain = {};
      if (!preferences.scripts.domain[domainPattern]) return;

      preferences.scripts.domain[domainPattern].splice(index, 1);

      // Remove domain if no scripts left
      if (preferences.scripts.domain[domainPattern].length === 0) {
        delete preferences.scripts.domain[domainPattern];
      }

      try {
        await savePreferences(preferences);
        updateScriptDisplay();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    }

    // Form submission handler
    const form = document.getElementById('scriptForm') as HTMLFormElement;
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const domainPattern = (document.getElementById('scriptDomainPattern') as HTMLInputElement).value.trim();
      const code = (document.getElementById('scriptCode') as HTMLTextAreaElement).value.trim();
      const runAt = (document.getElementById('scriptRunAt') as HTMLSelectElement).value as
        | 'document_start'
        | 'document_end'
        | 'document_idle';

      if (!domainPattern || !code) {
        showError(browser.i18n.getMessage('optionsAdvancedScriptsValidationError'));
        return;
      }

      const script: Script = {
        code,
        runAt,
      };

      // Initialize scripts structure if needed
      if (!preferences.scripts) preferences.scripts = { active: false, domain: {} };
      if (!preferences.scripts.domain) preferences.scripts.domain = {};

      if (editing) {
        // Update existing script
        if (preferences.scripts.domain[currentDomainPattern]) {
          preferences.scripts.domain[currentDomainPattern][editingIndex] = script;
        }
      } else {
        // Add new script
        if (!preferences.scripts.domain[domainPattern]) {
          preferences.scripts.domain[domainPattern] = [];
        }
        preferences.scripts.domain[domainPattern].unshift(script);
      }

      try {
        await savePreferences(preferences);
        updateScriptDisplay();
        resetForm();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    // Cancel button handler
    document.getElementById('scriptCancel')?.addEventListener('click', () => {
      resetForm();
    });

    // Initial display update
    updateScriptDisplay();
  } catch (_error) {
    showError(browser.i18n.getMessage('errorFailedToLoadAdvancedScripts'));
  }
}
