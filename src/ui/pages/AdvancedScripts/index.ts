// Advanced: Scripts page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema, Script } from '../../../types';

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
          <strong data-i18n="optionsAdvancedScriptsWarningTitle">Warning: Never add scripts from untrusted sources!</strong>
          <span data-i18n="optionsAdvancedScriptsWarning">Also keep in mind that Firefox Sync storage is limited to 100KB, so adding huge scripts here will prevent you from exporting preferences to Firefox Sync since the scripts are stored as preferences. The local storage limit is 5MB, so adding scripts exceeding that might prevent the Add-on from working at all.</span>
          <br/><br/>
          <strong>
            <label class="checkbox-field">
              <input type="checkbox" id="scriptsWarningRead" ${preferences.scripts?.active ? 'checked' : ''} ${preferences.scripts?.active ? 'disabled' : ''} />
              <span data-i18n="optionsAdvancedScriptsWarningAccept">I have read the warning and understand the implications that come with using "Scripts". When ticking the checkbox Firefox will ask you for "Access browser activity" permissions.</span>
            </label>
          </strong>
        </div>
        <div class="info-message">
          <span data-i18n="optionsAdvancedScriptsInfoMessage">This will call <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript" target="_blank">tabs.executeScript</a> if the tab url being loaded belongs to a Temporary Container and its domain matches the given pattern. Pro-tip: You can use <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Xray_vision#Waiving_Xray_vision" target="_blank">window.wrappedJSObject</a> to access the original window.</span>
        </div>
        
        <div id="scriptsFormSection" ${!preferences.scripts?.active ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>
          <form id="scriptForm">
            <div class="field">
              <label for="scriptDomainPattern" data-i18n="optionsAdvancedScriptsDomainPattern">Domain Pattern (e.g., *.example.com)</label>
              <input type="text" id="scriptDomainPattern" placeholder="Domain pattern" required />
            </div>
            
            <div class="field">
              <label for="scriptCode" data-i18n="optionsAdvancedScriptsCode">Code</label>
              <textarea id="scriptCode" rows="6" placeholder="JavaScript code" required></textarea>
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
              <button type="submit" id="scriptSubmit" class="button-primary" data-i18n="optionsAdvancedScriptsAddScript">Add Script</button>
              <button type="button" id="scriptCancel" class="button-secondary" style="display: none;" data-i18n="optionsAdvancedScriptsCancel">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="section" id="scriptsList" ${!preferences.scripts?.active ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>
        <h3 data-i18n="optionsAdvancedScriptsConfiguredScripts">Configured Scripts</h3>
        <div id="scriptsDisplay"></div>
      </div>
    `;
    
    section.appendChild(content);
    
    // Scripts warning checkbox handler
    const scriptsWarningCheckbox = document.getElementById('scriptsWarningRead') as HTMLInputElement;
    scriptsWarningCheckbox.addEventListener('change', async () => {
      if (!preferences.scripts) preferences.scripts = { active: false, domain: {} };
      preferences.scripts.active = scriptsWarningCheckbox.checked;
      
      // Update form sections visibility
      const formSection = document.getElementById('scriptsFormSection') as HTMLElement;
      const listSection = document.getElementById('scriptsList') as HTMLElement;
      const opacity = scriptsWarningCheckbox.checked ? '' : 'opacity: 0.3; pointer-events: none;';
      formSection.style.cssText = opacity;
      listSection.style.cssText = opacity;
      
      try {
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });
    
    function updateScriptDisplay() {
      const scriptsDisplay = document.getElementById('scriptsDisplay') as HTMLElement;
      const scriptsDomain = preferences.scripts?.domain || {};
      
      if (Object.keys(scriptsDomain).length === 0) {
        scriptsDisplay.innerHTML = `<p data-i18n="optionsAdvancedScriptsNoScripts">${browser.i18n.getMessage('optionsAdvancedScriptsNoScripts')}</p>`;
        return;
      }
      
      scriptsDisplay.innerHTML = '';
      
      for (const [domainPattern, scripts] of Object.entries(scriptsDomain)) {
        const domainSection = document.createElement('div');
        domainSection.className = 'script-domain-section';
        domainSection.innerHTML = `
          <h4>${domainPattern}</h4>
          <div class="script-list"></div>
        `;
        
        const scriptList = domainSection.querySelector('.script-list') as HTMLElement;
        
        scripts.forEach((script: Script, index: number) => {
          const scriptItem = document.createElement('div');
          scriptItem.className = 'script-item';
          
          const codePreview = script.code.length > 100 ? 
            script.code.substring(0, 100) + '...' : 
            script.code;
          
          scriptItem.innerHTML = `
            <div class="script-details">
              <div class="script-property"><strong data-i18n="optionsAdvancedScriptsRunAt">${browser.i18n.getMessage('optionsAdvancedScriptsRunAt')}:</strong> ${script.runAt}</div>
              <div class="script-property"><strong data-i18n="optionsAdvancedScriptsCode">${browser.i18n.getMessage('optionsAdvancedScriptsCode')}:</strong></div>
              <pre class="script-code">${codePreview}</pre>
            </div>
            <div class="script-actions">
              <button class="button-secondary script-edit" data-domain="${domainPattern}" data-index="${index}" data-i18n="optionsAdvancedScriptsEdit">${browser.i18n.getMessage('optionsAdvancedScriptsEdit')}</button>
              <button class="button-danger script-remove" data-domain="${domainPattern}" data-index="${index}" data-i18n="optionsAdvancedScriptsRemove">${browser.i18n.getMessage('optionsAdvancedScriptsRemove')}</button>
            </div>
          `;
          
          scriptList.appendChild(scriptItem);
        });
        
        scriptsDisplay.appendChild(domainSection);
      }
      
      // Attach event listeners to edit/remove buttons
      scriptsDisplay.querySelectorAll('.script-edit').forEach(button => {
        button.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const domain = target.dataset.domain!;
          const index = parseInt(target.dataset.index!);
          editScript(domain, index);
        });
      });
      
      scriptsDisplay.querySelectorAll('.script-remove').forEach(button => {
        button.addEventListener('click', (e) => {
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
      (document.getElementById('scriptSubmit') as HTMLButtonElement).textContent = browser.i18n.getMessage('optionsAdvancedScriptsAddScript');
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
      (document.getElementById('scriptSubmit') as HTMLButtonElement).textContent = browser.i18n.getMessage('optionsAdvancedScriptsSaveScript');
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
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    }
    
    // Form submission handler
    const form = document.getElementById('scriptForm') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const domainPattern = (document.getElementById('scriptDomainPattern') as HTMLInputElement).value.trim();
      const code = (document.getElementById('scriptCode') as HTMLTextAreaElement).value.trim();
      const runAt = (document.getElementById('scriptRunAt') as HTMLSelectElement).value as 'document_start' | 'document_end' | 'document_idle';
      
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
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });
    
    // Cancel button handler
    document.getElementById('scriptCancel')?.addEventListener('click', () => {
      resetForm();
    });
    
    // Initial display update
    updateScriptDisplay();
    
  } catch (error) {
    showError(browser.i18n.getMessage('errorFailedToLoadAdvancedScripts'));
  }
}
