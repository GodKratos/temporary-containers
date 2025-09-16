// Advanced: Cookies page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema, Cookie } from '../../../types';

interface CookieDefaults {
  domain: string;
  expirationDate: string;
  firstPartyDomain: string;
  httpOnly: string;
  name: string;
  path: string;
  sameSite: string;
  secure: string;
  url: string;
  value: string;
}

const cookieDefaults: CookieDefaults = {
  domain: '',
  expirationDate: '',
  firstPartyDomain: '',
  httpOnly: '',
  name: '',
  path: '',
  sameSite: '',
  secure: '',
  url: '',
  value: '',
};

export async function initAdvancedCookiesPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('advanced-cookies');
    if (!section) return;
    section.innerHTML = '';

    let editing = false;
    let editingIndex = -1;
    let currentDomainPattern = '';
    let currentCookie: CookieDefaults = { ...cookieDefaults };

    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="section">
        <h3 data-i18n="optionsAdvancedCookiesTitle">Configure cookies to be set on certain domains in Temporary Containers</h3>
        <div class="warning-message">
          <strong data-i18n="optionsAdvancedCookiesWarningTitle">Warning:</strong> <span data-i18n="optionsAdvancedCookiesWarning">Setting cookies can make you easier fingerprintable. Especially when they contain user/session-specific data. Avoid setting cookies if you can.</span>
        </div>
        <div class="info-message">
          <span data-i18n="optionsAdvancedCookiesInfoMessage">This will call the cookie API and add the cookie to the header (if allowed) during request processing if the request belongs to a Temporary Container and the domain matches the given pattern.</span>
          <br>
          <small>Technical details: Uses <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/cookies/set" target="_blank" data-i18n="optionsAdvancedCookiesAPICookiesSet">cookies.set</a> API during <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders" target="_blank" data-i18n="optionsAdvancedCookiesAPIWebRequestOnBeforeSendHeaders">webRequest.onBeforeSendHeaders</a> events.</small>
        </div>
        
        <form id="cookieForm">
          <div class="field">
            <label for="cookieDomainPattern" data-i18n="optionsAdvancedCookiesDomainPattern">Domain Pattern</label>
            <small data-i18n="optionsAdvancedCookiesDomainPatternDescription">Use exact domains (example.com), subdomains (sub.example.com) or wildcards (*.example.com) to match URLs</small>
            <input type="text" id="cookieDomainPattern" data-i18n-placeholder="optionsAdvancedCookiesDomainPatternPlaceholder" placeholder="Domain pattern" required />
          </div>
          
          <div class="field">
            <label for="cookieName" data-i18n="optionsAdvancedCookiesName">Name</label>
            <input type="text" id="cookieName" data-i18n-placeholder="optionsAdvancedCookiesNamePlaceholder" placeholder="Cookie name" required />
          </div>
          
          <div class="field">
            <label for="cookieValue" data-i18n="optionsAdvancedCookiesValue">Value</label>
            <input type="text" id="cookieValue" data-i18n-placeholder="optionsAdvancedCookiesValuePlaceholder" placeholder="Cookie value" required />
          </div>
          
          <div class="field">
            <label for="cookieDomain" data-i18n="optionsAdvancedCookiesDomain">Domain</label>
            <input type="text" id="cookieDomain" data-i18n-placeholder="optionsAdvancedCookiesDomainPlaceholder" placeholder="Cookie domain" />
          </div>
          
          <div class="field">
            <label for="cookieUrl" data-i18n="optionsAdvancedCookiesUrl">URL</label>
            <input type="text" id="cookieUrl" data-i18n-placeholder="optionsAdvancedCookiesUrlPlaceholder" placeholder="Cookie URL" required />
          </div>
          
          <div class="collapsible-section">
            <h4 class="collapsible-header" data-i18n="optionsAdvancedCookiesAdvancedOptions">▶ Advanced Options</h4>
            <div class="collapsible-content" style="display: none;">
              <div class="field">
                <label for="cookieExpirationDate" data-i18n="optionsAdvancedCookiesExpirationDate">Expiration Date</label>
                <input type="text" id="cookieExpirationDate" data-i18n-placeholder="optionsAdvancedCookiesExpirationDatePlaceholder" placeholder="Expiration date" />
              </div>
              
              <div class="field">
                <label for="cookieFirstPartyDomain" data-i18n="optionsAdvancedCookiesFirstPartyDomain">First Party Domain</label>
                <input type="text" id="cookieFirstPartyDomain" data-i18n-placeholder="optionsAdvancedCookiesFirstPartyDomainPlaceholder" placeholder="First party domain" />
              </div>
              
              <div class="field">
                <label for="cookieHttpOnly" data-i18n="optionsAdvancedCookiesHttpOnly">HTTP Only</label>
                <select id="cookieHttpOnly">
                  <option value="" data-i18n="optionsAdvancedCookiesNotSet">Not set</option>
                  <option value="false" data-i18n="optionsAdvancedCookiesFalse">false</option>
                  <option value="true" data-i18n="optionsAdvancedCookiesTrue">true</option>
                </select>
              </div>
              
              <div class="field">
                <label for="cookiePath" data-i18n="optionsAdvancedCookiesPath">Path</label>
                <input type="text" id="cookiePath" data-i18n-placeholder="optionsAdvancedCookiesPathPlaceholder" placeholder="Cookie path" />
              </div>
              
              <div class="field">
                <label for="cookieSameSite" data-i18n="optionsAdvancedCookiesSameSite">Same Site</label>
                <select id="cookieSameSite">
                  <option value="" data-i18n="optionsAdvancedCookiesNotSet">Not set</option>
                  <option value="no_restriction" data-i18n="optionsAdvancedCookiesSameSiteNoRestriction">no_restriction</option>
                  <option value="lax" data-i18n="optionsAdvancedCookiesSameSiteLax">lax</option>
                  <option value="strict" data-i18n="optionsAdvancedCookiesSameSiteStrict">strict</option>
                </select>
              </div>
              
              <div class="field">
                <label for="cookieSecure" data-i18n="optionsAdvancedCookiesSecure">Secure</label>
                <select id="cookieSecure">
                  <option value="" data-i18n="optionsAdvancedCookiesNotSet">Not set</option>
                  <option value="false" data-i18n="optionsAdvancedCookiesFalse">false</option>
                  <option value="true" data-i18n="optionsAdvancedCookiesTrue">true</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="field">
            <button type="submit" id="cookieSubmit" class="button-primary" data-i18n="optionsAdvancedCookiesAddCookie">Add Cookie</button>
            <button type="button" id="cookieCancel" class="button-secondary" style="display: none;" data-i18n="optionsAdvancedCookiesCancel">Cancel</button>
          </div>
        </form>
      </div>
      
      <div class="section" id="cookiesList">
        <h3 data-i18n="optionsAdvancedCookiesConfiguredCookies">Configured Cookies</h3>
        <div id="cookiesDisplay"></div>
      </div>
    `;

    section.appendChild(content);

    // Setup collapsible advanced options
    const collapsibleHeader = content.querySelector('.collapsible-header') as HTMLElement;
    const collapsibleContent = content.querySelector('.collapsible-content') as HTMLElement;
    collapsibleHeader.addEventListener('click', () => {
      const isHidden = collapsibleContent.style.display === 'none';
      collapsibleContent.style.display = isHidden ? 'block' : 'none';
      collapsibleHeader.textContent = isHidden
        ? browser.i18n.getMessage('optionsAdvancedCookiesAdvancedOptions2')
        : browser.i18n.getMessage('optionsAdvancedCookiesAdvancedOptions1');
    });

    function updateCookieDisplay() {
      const cookiesDisplay = document.getElementById('cookiesDisplay') as HTMLElement;
      const cookiesDomain = preferences.cookies?.domain || {};

      if (Object.keys(cookiesDomain).length === 0) {
        cookiesDisplay.innerHTML = `<p data-i18n="optionsAdvancedCookiesNoCookies">${browser.i18n.getMessage(
          'optionsAdvancedCookiesNoCookies'
        )}</p>`;
        return;
      }

      cookiesDisplay.innerHTML = '';

      for (const [domainPattern, cookies] of Object.entries(cookiesDomain)) {
        const domainSection = document.createElement('div');
        domainSection.className = 'cookie-domain-section';
        domainSection.innerHTML = `
          <h4>${domainPattern}</h4>
          <div class="cookie-list"></div>
        `;

        const cookieList = domainSection.querySelector('.cookie-list') as HTMLElement;

        cookies.forEach((cookie: Cookie, index: number) => {
          const cookieItem = document.createElement('div');
          cookieItem.className = 'cookie-item';

          const cookieDetails = Object.entries(cookie)
            .filter(([key, value]) => value !== '')
            .map(([key, value]) => `<span class="cookie-property"><strong>${key}:</strong> ${value}</span>`)
            .join('');

          cookieItem.innerHTML = `
            <div class="cookie-details">${cookieDetails}</div>
            <div class="cookie-actions">
              <button class="button-secondary cookie-edit" data-domain="${domainPattern}" data-index="${index}" data-i18n="optionsAdvancedCookiesEdit">${browser.i18n.getMessage(
                'optionsAdvancedCookiesEdit'
              )}</button>
              <button class="button-danger cookie-remove" data-domain="${domainPattern}" data-index="${index}" data-i18n="optionsAdvancedCookiesRemove">${browser.i18n.getMessage(
                'optionsAdvancedCookiesRemove'
              )}</button>
            </div>
          `;

          cookieList.appendChild(cookieItem);
        });

        cookiesDisplay.appendChild(domainSection);
      }

      // Attach event listeners to edit/remove buttons
      cookiesDisplay.querySelectorAll('.cookie-edit').forEach(button => {
        button.addEventListener('click', e => {
          const target = e.target as HTMLElement;
          const domain = target.dataset.domain!;
          const index = parseInt(target.dataset.index!);
          editCookie(domain, index);
        });
      });

      cookiesDisplay.querySelectorAll('.cookie-remove').forEach(button => {
        button.addEventListener('click', e => {
          const target = e.target as HTMLElement;
          const domain = target.dataset.domain!;
          const index = parseInt(target.dataset.index!);
          removeCookie(domain, index);
        });
      });
    }

    function resetForm() {
      editing = false;
      editingIndex = -1;
      currentDomainPattern = '';
      currentCookie = { ...cookieDefaults };

      // Reset form fields
      (document.getElementById('cookieDomainPattern') as HTMLInputElement).value = '';
      (document.getElementById('cookieDomainPattern') as HTMLInputElement).disabled = false;
      (document.getElementById('cookieName') as HTMLInputElement).value = '';
      (document.getElementById('cookieValue') as HTMLInputElement).value = '';
      (document.getElementById('cookieDomain') as HTMLInputElement).value = '';
      (document.getElementById('cookieUrl') as HTMLInputElement).value = '';
      (document.getElementById('cookieExpirationDate') as HTMLInputElement).value = '';
      (document.getElementById('cookieFirstPartyDomain') as HTMLInputElement).value = '';
      (document.getElementById('cookieHttpOnly') as HTMLSelectElement).value = '';
      (document.getElementById('cookiePath') as HTMLInputElement).value = '';
      (document.getElementById('cookieSameSite') as HTMLSelectElement).value = '';
      (document.getElementById('cookieSecure') as HTMLSelectElement).value = '';

      // Reset button states
      (document.getElementById('cookieSubmit') as HTMLButtonElement).textContent =
        browser.i18n.getMessage('optionsAdvancedCookiesAddCookie');
      (document.getElementById('cookieCancel') as HTMLButtonElement).style.display = 'none';
    }

    function editCookie(domainPattern: string, index: number) {
      const cookies = preferences.cookies?.domain?.[domainPattern];
      if (!cookies || !cookies[index]) return;

      editing = true;
      editingIndex = index;
      currentDomainPattern = domainPattern;
      currentCookie = { ...cookies[index] };

      // Fill form with cookie data
      (document.getElementById('cookieDomainPattern') as HTMLInputElement).value = domainPattern;
      (document.getElementById('cookieDomainPattern') as HTMLInputElement).disabled = true;
      (document.getElementById('cookieName') as HTMLInputElement).value = currentCookie.name;
      (document.getElementById('cookieValue') as HTMLInputElement).value = currentCookie.value;
      (document.getElementById('cookieDomain') as HTMLInputElement).value = currentCookie.domain;
      (document.getElementById('cookieUrl') as HTMLInputElement).value = currentCookie.url;
      (document.getElementById('cookieExpirationDate') as HTMLInputElement).value = currentCookie.expirationDate;
      (document.getElementById('cookieFirstPartyDomain') as HTMLInputElement).value = currentCookie.firstPartyDomain;
      (document.getElementById('cookieHttpOnly') as HTMLSelectElement).value = currentCookie.httpOnly;
      (document.getElementById('cookiePath') as HTMLInputElement).value = currentCookie.path;
      (document.getElementById('cookieSameSite') as HTMLSelectElement).value = currentCookie.sameSite;
      (document.getElementById('cookieSecure') as HTMLSelectElement).value = currentCookie.secure;

      // Update button states
      (document.getElementById('cookieSubmit') as HTMLButtonElement).textContent =
        browser.i18n.getMessage('optionsAdvancedCookiesSaveCookie');
      (document.getElementById('cookieCancel') as HTMLButtonElement).style.display = 'inline-block';

      // Scroll to form
      document.getElementById('cookieForm')?.scrollIntoView({ behavior: 'smooth' });
    }

    async function removeCookie(domainPattern: string, index: number) {
      if (!confirm(browser.i18n.getMessage('optionsAdvancedCookiesRemoveConfirm'))) return;

      if (!preferences.cookies) preferences.cookies = { domain: {} };
      if (!preferences.cookies.domain) preferences.cookies.domain = {};
      if (!preferences.cookies.domain[domainPattern]) return;

      preferences.cookies.domain[domainPattern].splice(index, 1);

      // Remove domain if no cookies left
      if (preferences.cookies.domain[domainPattern].length === 0) {
        delete preferences.cookies.domain[domainPattern];
      }

      try {
        await savePreferences(preferences);
        updateCookieDisplay();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    }

    // Form submission handler
    const form = document.getElementById('cookieForm') as HTMLFormElement;
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const domainPattern = (document.getElementById('cookieDomainPattern') as HTMLInputElement).value.trim();
      const name = (document.getElementById('cookieName') as HTMLInputElement).value.trim();
      const value = (document.getElementById('cookieValue') as HTMLInputElement).value.trim();
      const domain = (document.getElementById('cookieDomain') as HTMLInputElement).value.trim();
      const url = (document.getElementById('cookieUrl') as HTMLInputElement).value.trim();

      if (!domainPattern || !name || !url) {
        showError(browser.i18n.getMessage('optionsAdvancedCookiesValidationError'));
        return;
      }

      const cookie: Cookie = {
        name,
        value,
        domain,
        url,
        expirationDate: (document.getElementById('cookieExpirationDate') as HTMLInputElement).value.trim(),
        firstPartyDomain: (document.getElementById('cookieFirstPartyDomain') as HTMLInputElement).value.trim(),
        httpOnly: (document.getElementById('cookieHttpOnly') as HTMLSelectElement).value as '' | 'true' | 'false',
        path: (document.getElementById('cookiePath') as HTMLInputElement).value.trim(),
        sameSite: (document.getElementById('cookieSameSite') as HTMLSelectElement).value as '' | 'no_restriction' | 'lax' | 'strict',
        secure: (document.getElementById('cookieSecure') as HTMLSelectElement).value as '' | 'true' | 'false',
      };

      // Initialize cookies structure if needed
      if (!preferences.cookies) preferences.cookies = { domain: {} };
      if (!preferences.cookies.domain) preferences.cookies.domain = {};

      if (editing) {
        // Update existing cookie
        if (preferences.cookies.domain[currentDomainPattern]) {
          preferences.cookies.domain[currentDomainPattern][editingIndex] = cookie;
        }
      } else {
        // Add new cookie
        if (!preferences.cookies.domain[domainPattern]) {
          preferences.cookies.domain[domainPattern] = [];
        }
        preferences.cookies.domain[domainPattern].unshift(cookie);
      }

      try {
        await savePreferences(preferences);
        updateCookieDisplay();
        resetForm();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    // Cancel button handler
    document.getElementById('cookieCancel')?.addEventListener('click', () => {
      resetForm();
    });

    // Initial display update
    updateCookieDisplay();
  } catch (error) {
    showError(browser.i18n.getMessage('errorFailedToLoadAdvancedCookies'));
  }
}
