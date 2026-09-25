// Actions page logic for popup menu
import { getStorage, getPermissions, showError } from '../../shared/utils';

interface ActionButton {
  id: string;
  method: string;
  payload: Record<string, unknown>;
}

// Literal data-i18n keys per button id, kept as static strings so the localization validator can find them.
function renderButtonHtml(id: string, marginBottom: boolean): string {
  const style = `width:100%;${marginBottom ? 'margin-bottom:12px;' : ''}`;
  switch (id) {
    case 'action-reopen-tmp':
      return `<button id="action-reopen-tmp" class="action-card" data-i18n="optionsActionsNewTemporaryContainer" style="${style}">Reopen Tab in a new Temporary Container</button>`;
    case 'action-reopen-deleteshistory-tmp':
      return `<button id="action-reopen-deleteshistory-tmp" class="action-card" data-i18n="optionsActionsNewDeletesHistoryContainer" style="${style}">Reopen Tab in a new "Deletes History Temporary Container"</button>`;
    case 'action-convert-permanent':
      return `<button id="action-convert-permanent" class="action-card" data-i18n="optionsActionsConvertPermanent" style="${style}">Convert Temporary Container to Permanent</button>`;
    case 'action-convert-deleteshistory':
      return `<button id="action-convert-deleteshistory" class="action-card" data-i18n="optionsActionsConvertDeletesHistory" style="${style}">Convert Temporary Container to a "Deletes History Temporary Container"</button>`;
    case 'action-convert-regular':
      return `<button id="action-convert-regular" class="action-card" data-i18n="optionsActionsConvertRegular" style="${style}">Convert "Deletes History Temporary Container" to Regular Temporary Container</button>`;
    case 'action-convert-temporary':
      return `<button id="action-convert-temporary" class="action-card" data-i18n="optionsActionsConvertTemporary" style="${style}">Convert Permanent Container to Temporary</button>`;
    default:
      return '';
  }
}

export async function initActionsPage(): Promise<void> {
  try {
    const storage = await getStorage();
    const permissions = await getPermissions();
    const section = document.getElementById('actions');
    if (!section) return;
    section.innerHTML = '';

    const [activeTab] = await browser.tabs.query({ currentWindow: true, active: true });
    let parsedUrl = undefined;
    if (activeTab && activeTab.url) {
      try {
        parsedUrl = new URL(activeTab.url);
      } catch (_error) {
        // Invalid URL, parsedUrl remains undefined
      }
    }

    // Determine the current tab/container type
    const isHttpTab = !!(activeTab && typeof activeTab.url === 'string' && activeTab.url.startsWith('http'));
    const tempContainers = storage.tempContainers || {};
    const activeContainer = tempContainers[activeTab && activeTab.cookieStoreId ? activeTab.cookieStoreId : ''];
    const isTemp = isHttpTab && !!activeContainer;
    const isPermanent = isHttpTab && activeTab && activeTab.cookieStoreId !== 'firefox-default' && !activeContainer;
    const isDeletesHistory = isTemp && !!activeContainer.deletesHistory;

    // Only include the buttons that are relevant for the active tab/container
    const buttons: ActionButton[] = [];
    if (isHttpTab) {
      buttons.push({
        id: 'action-reopen-tmp',
        method: 'createTabInTempContainer',
        payload: { url: activeTab.url },
      });
      if (permissions.history) {
        buttons.push({
          id: 'action-reopen-deleteshistory-tmp',
          method: 'createTabInTempContainer',
          payload: { url: activeTab.url, deletesHistory: true },
        });
      }
      if (isTemp) {
        buttons.push({
          id: 'action-convert-permanent',
          method: 'convertTempContainerToPermanent',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            name: parsedUrl && parsedUrl.hostname,
            url: activeTab.url,
          },
        });
        if (permissions.history && !isDeletesHistory) {
          buttons.push({
            id: 'action-convert-deleteshistory',
            method: 'convertTempContainerToDeletesHistory',
            payload: { cookieStoreId: activeTab.cookieStoreId, tabId: activeTab.id, url: activeTab.url },
          });
        }
        if (permissions.history && isDeletesHistory) {
          buttons.push({
            id: 'action-convert-regular',
            method: 'convertDeletesHistoryToTempContainer',
            payload: { cookieStoreId: activeTab.cookieStoreId, tabId: activeTab.id, url: activeTab.url },
          });
        }
      } else if (isPermanent) {
        buttons.push({
          id: 'action-convert-temporary',
          method: 'convertPermanentToTempContainer',
          payload: { cookieStoreId: activeTab.cookieStoreId, tabId: activeTab.id, url: activeTab.url },
        });
      }
    }

    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="actions-grid">
        ${
          buttons.length === 0
            ? '<div class="action-label message error" data-i18n="optionsActionsNotAvailable">Actions are not available in this tab</div>'
            : buttons.map((button, index) => renderButtonHtml(button.id, index < buttons.length - 1)).join('')
        }
      </div>
    `;
    if (!section.firstChild) section.appendChild(content);

    for (const button of buttons) {
      const el = document.getElementById(button.id);
      if (el && !el.hasAttribute('data-listener')) {
        el.addEventListener('click', () => {
          browser.runtime.sendMessage({ method: button.method, payload: button.payload });
          window.close();
        });
        el.setAttribute('data-listener', 'true');
      }
    }
  } catch (error) {
    console.error('[Actions] Failed to load settings page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadActions'));
  }
}
