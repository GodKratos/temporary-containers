// Proxies settings page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess, getPermissions } from '../../shared/utils';
import { ProxyEntry } from '../../../types';

type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5';

interface ParsedProxy {
  protocol?: ProxyProtocol;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  label?: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function parseProxyText(text: string): ParsedProxy[] {
  const results: ParsedProxy[] = [];
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  // Detect CSV: first non-comment line has multiple comma/semicolon separated fields
  const firstLine = lines[0] || '';
  const isCSV = /,|;/.test(firstLine);

  if (isCSV) {
    const separator = firstLine.includes(';') ? ';' : ',';
    const possibleHeader = firstLine.toLowerCase();
    const hasHeader = possibleHeader.includes('host') || possibleHeader.includes('protocol') || possibleHeader.includes('port');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const headerFields = hasHeader
      ? possibleHeader.split(separator).map(h => h.trim())
      : ['protocol', 'host', 'port', 'username', 'password', 'label'];

    dataLines.forEach(line => {
      const parts = line.split(separator).map(p => p.trim());
      const entry: ParsedProxy = {};
      headerFields.forEach((field, i) => {
        const val = parts[i] || '';
        if (field === 'host') entry.host = val || undefined;
        else if (field === 'port') entry.port = val ? parseInt(val, 10) : undefined;
        else if (field === 'protocol') entry.protocol = (val as ProxyProtocol) || undefined;
        else if (field === 'username') entry.username = val || undefined;
        else if (field === 'password') entry.password = val || undefined;
        else if (field === 'label') entry.label = val || undefined;
      });
      if (entry.host) results.push(entry);
    });
  } else {
    // Parse plain text lines: host:port, protocol://host:port, protocol://user:pass@host:port
    lines.forEach(line => {
      const entry: ParsedProxy = {};

      // Full URI format: protocol://[user:pass@]host:port
      const uriMatch = line.match(/^(https?|socks4?|socks5?):\/\/(?:([^:@]+):([^@]+)@)?([^:/]+)(?::(\d+))?/i);
      if (uriMatch) {
        const proto = uriMatch[1].toLowerCase();
        entry.protocol = proto === 'socks' ? 'socks5' : (proto as ProxyProtocol);
        if (uriMatch[2]) entry.username = uriMatch[2];
        if (uriMatch[3]) entry.password = uriMatch[3];
        entry.host = uriMatch[4];
        if (uriMatch[5]) entry.port = parseInt(uriMatch[5], 10);
        results.push(entry);
        return;
      }

      // Simple host:port format
      const hostPortMatch = line.match(/^([^:/]+):(\d+)$/);
      if (hostPortMatch) {
        entry.host = hostPortMatch[1];
        entry.port = parseInt(hostPortMatch[2], 10);
        results.push(entry);
        return;
      }

      // Host only
      if (line && !/\s/.test(line)) {
        entry.host = line;
        results.push(entry);
      }
    });
  }

  return results.filter(e => e.host);
}

export async function initProxiesPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const permissions = await getPermissions();
    const section = document.getElementById('proxies');
    if (!section) return;
    section.innerHTML = '';

    let editing = false;
    let editingId = '';
    let showPasteArea = false;

    if (!preferences.proxies) {
      preferences.proxies = { active: false, assignmentMode: 'random', entries: [] };
    }

    const content = document.createElement('div');
    content.className = 'form';

    const proxiesEnabled = permissions.proxy && preferences.proxies.active;
    const dimStyle = !proxiesEnabled ? 'style="opacity: 0.3; pointer-events: none;"' : '';

    content.innerHTML = `
      <div class="section">
        <h3 data-i18n="optionsProxiesTitle">Proxy Configuration</h3>
        <div class="warning-message">
          <strong data-i18n="optionsProxiesWarningTitle">Permission &amp; Security Notice</strong>
          <br/>
          <span data-i18n="optionsProxiesWarningText">Proxy configuration requires the "Access browser proxy settings" permission. Proxy credentials are stored locally in plain text — only configure proxies you trust.</span>
          <br/><br/>
          <strong>
            <label class="checkbox-field">
              <input type="checkbox" id="proxiesEnabled" ${permissions.proxy && preferences.proxies.active ? 'checked' : ''} ${permissions.proxy && preferences.proxies.active ? 'disabled' : ''} />
              <span data-i18n="optionsProxiesWarningAccept">I understand and want to enable proxy assignment (requires "Access browser proxy settings" permission)</span>
            </label>
          </strong>
        </div>
      </div>

      <div id="proxiesSettingsSection" ${dimStyle}>
        <div class="section">
          <h3 data-i18n="optionsProxiesAssignmentMode">Assignment Mode</h3>
          <div class="field">
            <select id="proxiesAssignmentMode">
              <option value="random" data-i18n="optionsProxiesAssignmentModeRandom">Random (assign a random proxy to each new container)</option>
              <option value="sequential" data-i18n="optionsProxiesAssignmentModeSequential">Sequential (assign proxies in order from the list)</option>
            </select>
          </div>
        </div>

        <div class="section">
          <h3 id="proxyFormTitle" data-i18n="optionsProxiesAddProxy">Add Proxy</h3>
          <form id="proxyForm">
            <div class="field">
              <label for="proxyProtocol" data-i18n="optionsProxiesProtocol">Protocol</label>
              <select id="proxyProtocol">
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            <div class="field">
              <label for="proxyHost" data-i18n="optionsProxiesHost">Host</label>
              <input type="text" id="proxyHost" data-i18n-placeholder="optionsProxiesHostPlaceholder" placeholder="proxy.example.com or 192.168.1.1" required />
            </div>
            <div class="field">
              <label for="proxyPort" data-i18n="optionsProxiesPort">Port</label>
              <input type="number" id="proxyPort" min="1" max="65535" placeholder="8080" required />
            </div>
            <div class="field">
              <label for="proxyUsername" data-i18n="optionsProxiesUsername">Username (optional)</label>
              <input type="text" id="proxyUsername" autocomplete="off" />
            </div>
            <div class="field">
              <label for="proxyPassword" data-i18n="optionsProxiesPassword">Password (optional)</label>
              <input type="text" id="proxyPassword" autocomplete="off" />
            </div>
            <div class="field">
              <label for="proxyLabel" data-i18n="optionsProxiesLabel">Label (optional)</label>
              <input type="text" id="proxyLabel" data-i18n-placeholder="optionsProxiesLabelPlaceholder" placeholder="e.g. US VPN or Work Proxy" />
            </div>
            <div class="field">
              <button type="submit" id="proxySubmit" class="button-primary" data-i18n="optionsProxiesAddProxy">Add Proxy</button>
              <button type="button" id="proxyCancel" class="button-secondary" style="display: none;" data-i18n="optionsProxiesCancel">Cancel</button>
            </div>
          </form>
        </div>

        <div class="section">
          <h3 data-i18n="optionsProxiesImportTitle">Import Proxies</h3>
          <div class="field">
            <div class="button-group">
              <button type="button" id="proxyImportFile" class="button" data-i18n="optionsProxiesImportFromFile">Import from File</button>
              <button type="button" id="proxyImportPaste" class="button" data-i18n="optionsProxiesImportPaste">Paste Proxies</button>
            </div>
            <input type="file" id="proxyImportFileInput" accept=".csv,.txt" style="display: none;" />
          </div>
          <div id="proxyPasteArea" style="display: none;">
            <div class="field">
              <label for="proxyPasteText" data-i18n="optionsProxiesImportPasteLabel">Paste proxy list (one per line: host:port, protocol://host:port, or protocol://user:pass@host:port)</label>
              <textarea id="proxyPasteText" rows="6" style="width: 100%;"></textarea>
              <button type="button" id="proxyPasteSubmit" class="button-primary" data-i18n="optionsProxiesImportParsePaste">Parse &amp; Preview</button>
            </div>
          </div>
          <div id="proxyImportPreview" style="display: none;">
            <h4 data-i18n="optionsProxiesImportPreviewTitle">Import Preview</h4>
            <div class="field">
              <label for="proxyImportDefaultProtocol" data-i18n="optionsProxiesImportDefaultProtocol">Default Protocol (for entries without protocol)</label>
              <select id="proxyImportDefaultProtocol">
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            <div id="proxyImportTable"></div>
            <div class="field">
              <button type="button" id="proxyImportConfirm" class="button-primary" data-i18n="optionsProxiesImportConfirm">Add Proxies</button>
              <button type="button" id="proxyImportCancel" class="button-secondary" data-i18n="optionsProxiesImportCancel">Cancel Import</button>
            </div>
          </div>
        </div>
      </div>

      <div id="proxiesList" ${dimStyle}>
        <div class="section">
          <h3 data-i18n="optionsProxiesConfiguredProxies">Configured Proxies</h3>
          <div id="proxiesDisplay"></div>
        </div>
      </div>
    `;

    if (!section.firstChild) section.appendChild(content);

    // Set assignment mode value
    const assignmentModeSelect = document.getElementById('proxiesAssignmentMode') as HTMLSelectElement;
    assignmentModeSelect.value = preferences.proxies.assignmentMode || 'random';

    // Enable/disable toggle
    const proxiesEnabledCheckbox = document.getElementById('proxiesEnabled') as HTMLInputElement;
    proxiesEnabledCheckbox.addEventListener('change', async () => {
      if (!preferences.proxies) preferences.proxies = { active: false, assignmentMode: 'random', entries: [] };

      if (proxiesEnabledCheckbox.checked) {
        try {
          const granted = await browser.permissions.request({ permissions: ['proxy'] });
          if (!granted) {
            proxiesEnabledCheckbox.checked = false;
            showError(browser.i18n.getMessage('errorFailedToSave'));
            return;
          }
        } catch (e) {
          console.error('Failed to request proxy permission', e);
          proxiesEnabledCheckbox.checked = false;
          showError(browser.i18n.getMessage('errorFailedToSave'));
          return;
        }
      }

      preferences.proxies.active = proxiesEnabledCheckbox.checked;
      proxiesEnabledCheckbox.disabled = proxiesEnabledCheckbox.checked;

      const opacity = proxiesEnabledCheckbox.checked ? '' : 'opacity: 0.3; pointer-events: none;';
      (document.getElementById('proxiesSettingsSection') as HTMLElement).style.cssText = opacity;
      (document.getElementById('proxiesList') as HTMLElement).style.cssText = opacity;

      try {
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    // Assignment mode change
    assignmentModeSelect.addEventListener('change', async () => {
      if (!preferences.proxies) return;
      preferences.proxies.assignmentMode = assignmentModeSelect.value as 'random' | 'sequential';
      try {
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    // --- Proxy list rendering ---
    function updateProxyDisplay(): void {
      const proxiesDisplay = document.getElementById('proxiesDisplay') as HTMLElement;
      const entries = preferences.proxies?.entries || [];

      if (entries.length === 0) {
        proxiesDisplay.innerHTML = `<p data-i18n="optionsProxiesNoProxies">No proxies configured. Add a proxy above or import a list.</p>`;
        return;
      }

      proxiesDisplay.innerHTML = '';
      entries.forEach((entry: ProxyEntry) => {
        const item = document.createElement('div');
        item.className = 'config-item';
        const displayName = entry.label || `${entry.host}:${entry.port}`;
        const protocolBadge = `<span class="badge">${entry.protocol.toUpperCase()}</span>`;
        const hostPort = entry.label ? `<span class="config-secondary">${entry.host}:${entry.port}</span>` : '';
        const credentialsBadge = entry.username ? `<span class="badge">auth</span>` : '';

        item.innerHTML = `
          <div class="config-item-details">
            <label class="checkbox-field">
              <input type="checkbox" class="proxy-enable-toggle" data-id="${entry.id}" ${entry.enabled ? 'checked' : ''} />
              <span class="config-name">${displayName}</span>
            </label>
            ${hostPort}
            ${protocolBadge}${credentialsBadge}
          </div>
          <div class="config-item-actions">
            <button class="small proxy-edit" data-id="${entry.id}" data-i18n="optionsProxiesEdit">Edit</button>
            <button class="small danger proxy-remove" data-id="${entry.id}" data-i18n="optionsProxiesRemove">Remove</button>
          </div>
        `;
        proxiesDisplay.appendChild(item);
      });

      // Enable/disable toggles
      proxiesDisplay.querySelectorAll('.proxy-enable-toggle').forEach(el => {
        el.addEventListener('change', async e => {
          const checkbox = e.target as HTMLInputElement;
          const id = checkbox.dataset.id!;
          const entry = preferences.proxies!.entries.find((x: ProxyEntry) => x.id === id);
          if (entry) {
            entry.enabled = checkbox.checked;
            try {
              await savePreferences(preferences);
            } catch (_error) {
              showError(browser.i18n.getMessage('errorFailedToSave'));
            }
          }
        });
      });

      // Edit buttons
      proxiesDisplay.querySelectorAll('.proxy-edit').forEach(el => {
        el.addEventListener('click', e => {
          const id = (e.target as HTMLElement).dataset.id!;
          editProxy(id);
        });
      });

      // Remove buttons
      proxiesDisplay.querySelectorAll('.proxy-remove').forEach(el => {
        el.addEventListener('click', async e => {
          const id = (e.target as HTMLElement).dataset.id!;
          await removeProxy(id);
        });
      });
    }

    function resetForm(): void {
      editing = false;
      editingId = '';
      (document.getElementById('proxyProtocol') as HTMLSelectElement).value = 'http';
      (document.getElementById('proxyHost') as HTMLInputElement).value = '';
      (document.getElementById('proxyPort') as HTMLInputElement).value = '';
      (document.getElementById('proxyUsername') as HTMLInputElement).value = '';
      (document.getElementById('proxyPassword') as HTMLInputElement).value = '';
      (document.getElementById('proxyLabel') as HTMLInputElement).value = '';
      const submitBtn = document.getElementById('proxySubmit') as HTMLButtonElement;
      submitBtn.setAttribute('data-i18n', 'optionsProxiesAddProxy');
      submitBtn.textContent = browser.i18n.getMessage('optionsProxiesAddProxy') || 'Add Proxy';
      (document.getElementById('proxyCancel') as HTMLButtonElement).style.display = 'none';
      const title = document.getElementById('proxyFormTitle') as HTMLElement;
      title.setAttribute('data-i18n', 'optionsProxiesAddProxy');
      title.textContent = browser.i18n.getMessage('optionsProxiesAddProxy') || 'Add Proxy';
    }

    function editProxy(id: string): void {
      const entry = preferences.proxies!.entries.find((x: ProxyEntry) => x.id === id);
      if (!entry) return;

      editing = true;
      editingId = id;
      (document.getElementById('proxyProtocol') as HTMLSelectElement).value = entry.protocol;
      (document.getElementById('proxyHost') as HTMLInputElement).value = entry.host;
      (document.getElementById('proxyPort') as HTMLInputElement).value = String(entry.port);
      (document.getElementById('proxyUsername') as HTMLInputElement).value = entry.username || '';
      (document.getElementById('proxyPassword') as HTMLInputElement).value = entry.password || '';
      (document.getElementById('proxyLabel') as HTMLInputElement).value = entry.label || '';

      const submitBtn = document.getElementById('proxySubmit') as HTMLButtonElement;
      submitBtn.setAttribute('data-i18n', 'optionsProxiesSave');
      submitBtn.textContent = browser.i18n.getMessage('optionsProxiesSave') || 'Save';
      (document.getElementById('proxyCancel') as HTMLButtonElement).style.display = 'inline-block';

      const title = document.getElementById('proxyFormTitle') as HTMLElement;
      title.setAttribute('data-i18n', 'optionsProxiesEditProxy');
      title.textContent = browser.i18n.getMessage('optionsProxiesEditProxy') || 'Edit Proxy';

      document.getElementById('proxyForm')?.scrollIntoView({ behavior: 'smooth' });
    }

    async function removeProxy(id: string): Promise<void> {
      if (!confirm(browser.i18n.getMessage('optionsProxiesRemoveConfirm') || 'Remove this proxy?')) return;
      if (!preferences.proxies) return;
      preferences.proxies.entries = preferences.proxies.entries.filter((x: ProxyEntry) => x.id !== id);
      try {
        await savePreferences(preferences);
        updateProxyDisplay();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    }

    // Form submission
    const proxyForm = document.getElementById('proxyForm') as HTMLFormElement;
    proxyForm.addEventListener('submit', async e => {
      e.preventDefault();
      const protocol = (document.getElementById('proxyProtocol') as HTMLSelectElement).value as ProxyProtocol;
      const host = (document.getElementById('proxyHost') as HTMLInputElement).value.trim();
      const portRaw = (document.getElementById('proxyPort') as HTMLInputElement).value.trim();
      const username = (document.getElementById('proxyUsername') as HTMLInputElement).value.trim() || undefined;
      const password = (document.getElementById('proxyPassword') as HTMLInputElement).value || undefined;
      const label = (document.getElementById('proxyLabel') as HTMLInputElement).value.trim() || undefined;

      if (!host) {
        showError(browser.i18n.getMessage('optionsProxiesValidationErrorHost') || 'Host is required.');
        return;
      }
      const port = parseInt(portRaw, 10);
      if (!portRaw || isNaN(port) || port < 1 || port > 65535) {
        showError(browser.i18n.getMessage('optionsProxiesValidationErrorPort') || 'Port must be a number between 1 and 65535.');
        return;
      }

      if (!preferences.proxies) preferences.proxies = { active: false, assignmentMode: 'random', entries: [] };

      if (editing && editingId) {
        const idx = preferences.proxies.entries.findIndex((x: ProxyEntry) => x.id === editingId);
        if (idx !== -1) {
          preferences.proxies.entries[idx] = { ...preferences.proxies.entries[idx], protocol, host, port, username, password, label };
        }
      } else {
        const newEntry: ProxyEntry = { id: generateId(), enabled: true, protocol, host, port, username, password, label };
        preferences.proxies.entries.push(newEntry);
      }

      try {
        await savePreferences(preferences);
        updateProxyDisplay();
        resetForm();
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    document.getElementById('proxyCancel')?.addEventListener('click', () => resetForm());

    // --- Import section ---
    let pendingImport: ParsedProxy[] = [];

    function showImportPreview(parsed: ParsedProxy[]): void {
      if (parsed.length === 0) {
        showError(browser.i18n.getMessage('optionsProxiesImportParseError') || 'Could not parse any valid proxy entries.');
        return;
      }
      pendingImport = parsed;
      const table = document.getElementById('proxyImportTable') as HTMLElement;
      table.innerHTML = `
        <table style="width:100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr>
              <th style="text-align:left; padding: 4px 8px;">Protocol</th>
              <th style="text-align:left; padding: 4px 8px;">Host</th>
              <th style="text-align:left; padding: 4px 8px;">Port</th>
              <th style="text-align:left; padding: 4px 8px;">Username</th>
              <th style="text-align:left; padding: 4px 8px;">Label</th>
            </tr>
          </thead>
          <tbody>
            ${parsed
              .map(
                p => `
              <tr>
                <td style="padding: 4px 8px;">${p.protocol || '<em>default</em>'}</td>
                <td style="padding: 4px 8px;">${p.host || ''}</td>
                <td style="padding: 4px 8px;">${p.port || ''}</td>
                <td style="padding: 4px 8px;">${p.username || ''}</td>
                <td style="padding: 4px 8px;">${p.label || ''}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;

      const confirmBtn = document.getElementById('proxyImportConfirm') as HTMLButtonElement;
      const countLabel = browser.i18n.getMessage('optionsProxiesImportConfirm') || 'Add Proxies';
      confirmBtn.textContent = `${countLabel} (${parsed.length})`;

      (document.getElementById('proxyImportPreview') as HTMLElement).style.display = '';
    }

    // Import from file
    const fileInput = document.getElementById('proxyImportFileInput') as HTMLInputElement;
    document.getElementById('proxyImportFile')?.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        showImportPreview(parseProxyText(text || ''));
        fileInput.value = '';
      };
      reader.readAsText(file);
    });

    // Paste proxies toggle
    document.getElementById('proxyImportPaste')?.addEventListener('click', () => {
      showPasteArea = !showPasteArea;
      (document.getElementById('proxyPasteArea') as HTMLElement).style.display = showPasteArea ? '' : 'none';
    });

    document.getElementById('proxyPasteSubmit')?.addEventListener('click', () => {
      const text = (document.getElementById('proxyPasteText') as HTMLTextAreaElement).value;
      showImportPreview(parseProxyText(text));
    });

    // Confirm import
    document.getElementById('proxyImportConfirm')?.addEventListener('click', async () => {
      const defaultProtocol = (document.getElementById('proxyImportDefaultProtocol') as HTMLSelectElement).value as ProxyProtocol;
      if (!preferences.proxies) preferences.proxies = { active: false, assignmentMode: 'random', entries: [] };

      pendingImport.forEach(p => {
        const newEntry: ProxyEntry = {
          id: generateId(),
          enabled: true,
          protocol: p.protocol || defaultProtocol,
          host: p.host!,
          port: p.port || 8080,
          username: p.username,
          password: p.password,
          label: p.label,
        };
        preferences.proxies!.entries.push(newEntry);
      });

      try {
        await savePreferences(preferences);
        updateProxyDisplay();
        pendingImport = [];
        (document.getElementById('proxyImportPreview') as HTMLElement).style.display = 'none';
        (document.getElementById('proxyPasteArea') as HTMLElement).style.display = 'none';
        (document.getElementById('proxyPasteText') as HTMLTextAreaElement).value = '';
        showPasteArea = false;
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (_error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    document.getElementById('proxyImportCancel')?.addEventListener('click', () => {
      pendingImport = [];
      (document.getElementById('proxyImportPreview') as HTMLElement).style.display = 'none';
    });

    // Initial list render
    updateProxyDisplay();
  } catch (error) {
    console.error('[Proxies] Failed to load settings page:', error);
    showError(browser.i18n.getMessage('errorFailedToSave'));
  }
}
