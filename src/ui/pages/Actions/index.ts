// Actions page logic for popup menu
import { getStorage, getPermissions, showError } from '../../shared/utils';

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

    // Compute disables
    const isHttpTab = !!(activeTab && typeof activeTab.url === 'string' && activeTab.url.startsWith('http'));
    const tempContainers = storage.tempContainers || {};
    const activeContainer = tempContainers[activeTab && activeTab.cookieStoreId ? activeTab.cookieStoreId : ''];
    const isTemp = isHttpTab && !!activeContainer;
    const isPermanent = isHttpTab && activeTab && activeTab.cookieStoreId !== 'firefox-default' && !activeContainer;
    const isDeletesHistory = isTemp && !!activeContainer.deletesHistory;

    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="actions-grid">
        ${
          !isHttpTab
            ? '<div class="action-label message error" data-i18n="optionsActionsNotAvailable" style="margin-bottom:12px;">Actions are not available in this tab</div>'
            : ''
        }
        <button id="action-reopen-tmp" class="action-card" data-i18n="optionsActionsNewTemporaryContainer" style="width:100%;margin-bottom:12px;"${
          !isHttpTab ? ' disabled' : ''
        }>
          Reopen Tab in a new Temporary Container
        </button>
        <button id="action-convert-permanent" class="action-card" data-i18n="optionsActionsConvertPermanent" style="width:100%;margin-bottom:12px;"${
          !isTemp ? ' disabled' : ''
        }>
          Convert Temporary Container to Permanent
        </button>
        <button id="action-convert-temporary" class="action-card" data-i18n="optionsActionsConvertTemporary" style="width:100%;${
          permissions.history ? 'margin-bottom:12px;' : ''
        }"${!isPermanent ? ' disabled' : ''}>
          Convert Permanent Container to Temporary
        </button>
        ${
          permissions.history
            ? `
        <button id="action-reopen-deleteshistory-tmp" class="action-card" data-i18n="optionsActionsNewDeletesHistoryContainer" style="width:100%;margin-bottom:12px;"${
          !isHttpTab ? ' disabled' : ''
        }>
          Reopen Tab in a new "Deletes History Temporary Container"
        </button>
        <button id="action-convert-regular" class="action-card" data-i18n="optionsActionsConvertRegular" style="width:100%;"${
          !isDeletesHistory ? ' disabled' : ''
        }>
          Convert "Deletes History Temporary Container" to Regular Temporary Container
        </button>
        `
            : ''
        }
      </div>
    `;
    if (!section.firstChild) section.appendChild(content);

    // Button 1: Reopen Tab in new Temporary Container
    const btnReopenTmp = document.getElementById('action-reopen-tmp');
    if (btnReopenTmp && !btnReopenTmp.hasAttribute('data-listener')) {
      btnReopenTmp.addEventListener('click', () => {
        browser.runtime.sendMessage({
          method: 'createTabInTempContainer',
          payload: {
            url: activeTab.url,
          },
        });
        window.close();
      });
      btnReopenTmp.setAttribute('data-listener', 'true');
    }
    // Button 2: Convert Temporary Container to Permanent
    const btnConvertPermanent = document.getElementById('action-convert-permanent');
    if (btnConvertPermanent && !btnConvertPermanent.hasAttribute('data-listener')) {
      btnConvertPermanent.addEventListener('click', () => {
        browser.runtime.sendMessage({
          method: 'convertTempContainerToPermanent',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            name: parsedUrl && parsedUrl.hostname,
            url: activeTab.url,
          },
        });
        window.close();
      });
      btnConvertPermanent.setAttribute('data-listener', 'true');
    }
    // Button 3: Convert Permanent Container to Temporary
    const btnConvertTemporary = document.getElementById('action-convert-temporary');
    if (btnConvertTemporary && !btnConvertTemporary.hasAttribute('data-listener')) {
      btnConvertTemporary.addEventListener('click', () => {
        browser.runtime.sendMessage({
          method: 'convertPermanentToTempContainer',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            url: activeTab.url,
          },
        });
        window.close();
      });
      btnConvertTemporary.setAttribute('data-listener', 'true');
    }
    // Button 4: Reopen Tab in new "Deletes History Temporary Container"
    const btnReopenDeletesHistoryTmp = document.getElementById('action-reopen-deleteshistory-tmp');
    if (btnReopenDeletesHistoryTmp && !btnReopenDeletesHistoryTmp.hasAttribute('data-listener')) {
      btnReopenDeletesHistoryTmp.addEventListener('click', () => {
        browser.runtime.sendMessage({
          method: 'createTabInTempContainer',
          payload: {
            url: activeTab.url,
            deletesHistory: true,
          },
        });
        window.close();
      });
      btnReopenDeletesHistoryTmp.setAttribute('data-listener', 'true');
    }
    // Button 5: Convert "Deletes History Temporary Container" to Regular Temporary Container
    const btnConvertRegular = document.getElementById('action-convert-regular');
    if (btnConvertRegular && !btnConvertRegular.hasAttribute('data-listener')) {
      btnConvertRegular.addEventListener('click', () => {
        browser.runtime.sendMessage({
          method: 'convertTempContainerToRegular',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            url: activeTab.url,
          },
        });
        window.close();
      });
      btnConvertRegular.setAttribute('data-listener', 'true');
    }
  } catch (error) {
    console.error('[Actions] Failed to load settings page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadActions'));
  }
}
