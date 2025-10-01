import { PreferencesSchema, StorageLocal, Permissions } from '../../types';

/**
 * Send a message to the background script
 * @param method - The method to call
 * @param payload - The payload to send
 */
export async function sendMessage(method: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  try {
    return await browser.runtime.sendMessage({ method, payload });
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

/**
 * Initialize storage with current temporary containers
 */
export async function getStorage(): Promise<StorageLocal> {
  try {
    const storage = (await sendMessage('getStorage')) as StorageLocal;
    if (!storage) {
      throw new Error('Failed to initialize storage');
    }
    return storage;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
}

/**
 * Get the current preferences from storage
 */
export async function getPreferences(): Promise<PreferencesSchema> {
  try {
    const preferences = (await sendMessage('getPreferences')) as PreferencesSchema;
    if (!preferences) {
      throw new Error('Failed to get preferences');
    }
    return preferences;
  } catch (error) {
    console.error('Failed to get preferences:', error);
    throw error;
  }
}

/**
 * Save preferences to storage
 * @param preferences - The preferences to save
 */
export async function savePreferences(preferences: Partial<PreferencesSchema>): Promise<void> {
  try {
    await sendMessage('savePreferences', { preferences });
  } catch (error) {
    console.error('Failed to save preferences:', error);
    throw error;
  }
}

/**
 * Get browser permissions
 */
export async function getPermissions(): Promise<Permissions> {
  try {
    const permissions = (await sendMessage('getPermissions')) as Permissions;
    if (!permissions) {
      throw new Error('Failed to get permissions');
    }
    return permissions;
  } catch (error) {
    console.error('Failed to get permissions:', error);
    throw error;
  }
}

/**
 * Get managed storage information
 */
export async function getManagedStorageInfo(): Promise<import('../../types').ManagedStorageState> {
  try {
    const managedInfo = (await sendMessage('getManagedStorageInfo')) as import('../../types').ManagedStorageState;
    return managedInfo;
  } catch (error) {
    console.error('Failed to get managed storage info:', error);
    throw error;
  }
}

/**
 * Validate if a preference change is allowed by policy
 */
export async function validatePreferenceChange(settingPath: string, newValue: any): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const result = (await sendMessage('validatePreferenceChange', { settingPath, newValue })) as { allowed: boolean; reason?: string };
    return result;
  } catch (error) {
    console.error('Failed to validate preference change:', error);
    return { allowed: false, reason: 'Failed to validate against policy' };
  }
}

/**
 * Check if a setting is locked by managed storage policy
 */
export function isSettingLocked(managedStorage: import('../../types').ManagedStorageState, settingPath: string): boolean {
  return managedStorage.isManaged && managedStorage.lockedSettings.includes(settingPath);
}

/**
 * Add visual indicators for managed settings in the UI
 */
export function addManagedSettingIndicator(element: HTMLElement, isLocked: boolean, policyName?: string): void {
  // Remove any existing indicator first
  const existingIndicator = element.parentElement?.querySelector('.managed-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  if (isLocked) {
    element.classList.add('managed-setting');
    element.setAttribute('disabled', 'true');
    element.setAttribute(
      'title',
      policyName
        ? browser.i18n.getMessage('managedStoragePolicyName', [policyName])
        : browser.i18n.getMessage('managedStorageSettingLockedTooltip')
    );

    // Add a visual indicator
    const indicator = document.createElement('span');
    indicator.className = 'managed-indicator';
    indicator.textContent = '🔒';
    indicator.title = browser.i18n.getMessage('managedStorageSettingLockedTooltip');
    element.parentElement?.appendChild(indicator);
  } else {
    // Reset element state when not locked
    element.classList.remove('managed-setting');
    element.removeAttribute('disabled');
    element.removeAttribute('title');
  }
}

/**
 * Apply managed storage indicators to all form elements in the current page
 */
export async function applyManagedStorageIndicators(): Promise<void> {
  try {
    const managedInfo = await getManagedStorageInfo();

    if (managedInfo.isManaged) {
      // Find all form elements with data-setting attributes
      const formElements = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-setting]');

      formElements.forEach(element => {
        const setting = element.getAttribute('data-setting');
        if (setting && isSettingLocked(managedInfo, setting)) {
          const policyName = getManagedPolicyName(setting, managedInfo);
          addManagedSettingIndicator(element, true, policyName);
        }
      });
    }
  } catch (error) {
    console.error('Failed to apply managed storage indicators:', error);
  }
}

/**
 * Get the policy name that manages a specific setting
 */
function getManagedPolicyName(settingPath: string, managedState: import('../../types').ManagedStorageState): string | undefined {
  // Check if this setting is in the locked settings
  if (managedState.lockedSettings.includes(settingPath)) {
    return 'Enterprise Policy';
  }

  // Check if the setting has an override value (which means it's managed)
  const pathParts = settingPath.split('.');
  let current: any = managedState.overrides;

  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  // If we found an override value, it's managed
  return current !== undefined ? 'Enterprise Policy' : undefined;
}

/**
 * Wrapper function to enhance page initializers with managed storage support
 */
export function withManagedStorage<T extends (...args: any[]) => Promise<void>>(initFunction: T): T {
  return (async (...args: Parameters<T>) => {
    // Call the original initialization function
    await initFunction(...args);

    // Apply managed storage indicators after page is loaded
    await applyManagedStorageIndicators();
  }) as T;
}

/**
 * Format bytes to human readable string
 * @param bytes - The number of bytes
 * @param decimals - Number of decimal places
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Show a message to the user.
 *
 * If the duration is negative, then the message is shown indefinitely until
 * overwritten by another message.
 *
 * @param message - The message to show
 * @param type - The type of message (error, success, warning)
 * @param duration - Time in milliseconds to show the message
 */
export function showMessage(message: string, type = '', duration = 3000): void {
  const container = document.getElementById('message-container');
  const messageEl = document.getElementById('message');

  if (!container || !messageEl) {
    return;
  }

  messageEl.textContent = message;
  container.className = `message-container ${type}`;
  container.classList.remove('hidden');

  if (duration >= 0) {
    setTimeout(() => {
      container.classList.add('hidden');
    }, duration);
  }
}

/**
 * Show an error message
 *
 * If the duration is negative, then the message is shown indefinitely until
 * overwritten by another message.
 *
 * @param message - The error message
 * @param duration - Time in milliseconds to show the error
 */
export function showError(message: string, duration = 5000): void {
  showMessage(message, 'error', duration);
}

/**
 * Show a success message
 * @param message - The success message
 */
export function showSuccess(message: string): void {
  showMessage(message, 'success');
}

/**
 * Show the initialize loader
 */
export function showInitializeLoader(): void {
  const loader = document.getElementById('initialize-loader');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

/**
 * Hide the initialize loader
 */
export function hideInitializeLoader(): void {
  const loader = document.getElementById('initialize-loader');
  if (loader) {
    loader.classList.add('hidden');
  }
}

/**
 * Show the initialize error and hide the loader
 * @param message - The error message to show
 */
export function showInitializeError(message: string): void {
  showError(message);
  const loader = document.getElementById('initialize-loader');
  if (loader) {
    loader.classList.add('hidden');
  }
}

/**
 * Create a tab system
 * @param tabsSelector - Selector for the tab buttons
 * @param panelsSelector - Selector for the tab panels
 * @param onChange - Callback when the tab changes
 */
export function createTabSystem(tabsSelector: string, panelsSelector: string, onChange: ((tabId: string) => void) | null = null): void {
  const tabs = document.querySelectorAll<HTMLElement>(tabsSelector);
  const panels = document.querySelectorAll<HTMLElement>(panelsSelector);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.section;
      if (!tabId) return;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(panel => {
        if (panel.id === tabId) {
          panel.classList.remove('hidden');
          panel.classList.add('active');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('active');
        }
      });
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', `#${tabId}`);
      } else {
        window.location.hash = tabId;
      }
      if (onChange) {
        onChange(tabId);
      }
    });
  });
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tab = document.querySelector<HTMLElement>(`[data-section="${hash}"]`);
    if (tab) {
      tab.click();
    }
  }
}

/**
 * Create a glossary system
 * @param glossaryData - The glossary data
 */
export function createGlossarySystem(glossaryData: Record<string, string>): void {
  const glossaryElement = document.getElementById('glossary');
  const glossaryTitleElement = document.getElementById('glossary-title');
  const glossaryBodyElement = document.getElementById('glossary-body');
  const glossaryCloseElement = document.getElementById('glossary-close');
  if (!glossaryElement || !glossaryTitleElement || !glossaryBodyElement || !glossaryCloseElement) return;
  document.querySelectorAll<HTMLElement>('[data-glossary]').forEach(element => {
    element.style.cursor = 'help';
    element.style.borderBottom = '1px dotted var(--grey-50)';
    element.addEventListener('click', () => {
      const term = element.dataset.glossary;
      const label = element.dataset.glossaryLabel || term;
      if (term && glossaryData[term]) {
        glossaryTitleElement.textContent = label || '';
        glossaryBodyElement.innerHTML = glossaryData[term];
        glossaryElement.classList.remove('hidden');
      }
    });
  });
  glossaryCloseElement.addEventListener('click', () => {
    glossaryElement.classList.add('hidden');
  });
  glossaryElement.addEventListener('click', event => {
    if (event.target === glossaryElement) {
      glossaryElement.classList.add('hidden');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !glossaryElement.classList.contains('hidden')) {
      glossaryElement.classList.add('hidden');
    }
  });
}

/**
 * Create an accordion system
 * @param selector - Selector for the accordion elements
 */
export function createAccordionSystem(selector: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach(accordion => {
    const header = accordion.querySelector<HTMLElement>('.accordion-header');
    if (!header) return;
    header.addEventListener('click', () => {
      accordion.classList.toggle('collapsed');
    });
  });
}

/**
 * Format a date
 * @param date - The date to format
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleString();
}

/**
 * Translate a string
 * @param key - The translation key
 */
export function t(key: string): string | null {
  // @ts-ignore
  return (browser.i18n && browser.i18n.getMessage(key)) || null;
}

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Apply localization to elements with data-i18n, data-i18n-title, data-i18n-placeholder attributes.
 * @param root - Optional root element to localize within (defaults to document.body)
 */
export function applyLocalization(root: HTMLElement = document.body): void {
  root.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key!);
    if (translation) element.textContent = translation;
  });
  root.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = t(key!);
    if (translation) element.setAttribute('title', translation);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = t(key!);
    if (translation) element.setAttribute('placeholder', translation);
  });
  // Localize <title> if present in root
  if (root instanceof Document || root === document.body) {
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
      const key = titleElement.getAttribute('data-i18n');
      const translation = t(key!);
      if (translation) document.title = translation;
    }
  }
}

/**
 * Create a multi-select dropdown
 */
export function createMultiSelect(
  selectElement: HTMLSelectElement,
  options: Array<{ id: string; text: string } | string>,
  selectedValues: string[] = [],
  onAdd?: (value: string) => void,
  onRemove?: (value: string) => void
): void {
  selectElement.innerHTML = '';
  const formattedOptions = Array.isArray(options)
    ? options.map(option => (typeof option === 'object' ? option : { id: option, text: option }))
    : [];
  const selected = Array.isArray(selectedValues) ? selectedValues : [];
  formattedOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.id;
    optionElement.textContent = option.text;
    optionElement.selected = selected.includes(option.id);
    selectElement.appendChild(optionElement);
  });
  selectElement.addEventListener('change', () => {
    const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
    selectedOptions.forEach(value => {
      if (!selected.includes(value) && onAdd) {
        onAdd(value);
      }
    });
    selected.forEach(value => {
      if (!selectedOptions.includes(value) && onRemove) {
        onRemove(value);
      }
    });
  });
}

/**
 * Create a tag input system
 */
export function createTagInput(
  inputElement: HTMLInputElement,
  tagContainer: HTMLElement,
  initialTags: string[] = [],
  onChange: ((tags: string[]) => void) | null = null
): void {
  const tags = Array.isArray(initialTags) ? [...initialTags] : [];
  renderTags();
  inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = inputElement.value.trim();
      if (value && !tags.includes(value)) {
        tags.push(value);
        renderTags();
        inputElement.value = '';
        if (onChange) {
          onChange(tags);
        }
      }
    }
  });
  tagContainer.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tag-remove')) {
      const tag = target.parentElement?.querySelector('.tag-text')?.textContent;
      if (!tag) return;
      const index = tags.indexOf(tag);
      if (index !== -1) {
        tags.splice(index, 1);
        renderTags();
        if (onChange) {
          onChange(tags);
        }
      }
    }
  });
  function renderTags() {
    tagContainer.innerHTML = '';
    tags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'tag';
      const tagText = document.createElement('span');
      tagText.className = 'tag-text';
      tagText.textContent = tag;
      const tagRemove = document.createElement('span');
      tagRemove.className = 'tag-remove';
      tagRemove.textContent = '×';
      tagElement.appendChild(tagText);
      tagElement.appendChild(tagRemove);
      tagContainer.appendChild(tagElement);
    });
  }
}
