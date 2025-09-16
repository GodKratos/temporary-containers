// Advanced: Delete History page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

export async function initAdvancedDeleteHistoryPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('advanced-delete-history');
    if (!section) return;
    section.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="section">
        <h3 data-i18n="optionsAdvancedDeleteHistoryTitle">"Deletes History Temporary Containers"</h3>
        <div class="warning-message">
          <strong data-i18n="optionsAdvancedDeleteHistoryWarningTitle">Warning:</strong> 
          <span data-i18n="optionsAdvancedDeleteHistoryWarning">Every website URL that you visit in a "Deletes History Temporary Container" will get deleted from your entire history. This means if you visited the same website URL in another Container, Temporary Container or in the Default Container before or while visiting it in a "Deletes History Temporary Container" then those visits will get deleted from history too. This is true until Firefox supports a special history for container tabs.</span>
          <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1283320" target="_blank" data-i18n="optionsAdvancedDeleteHistoryBugLink">The related Firefox bug can be found here</a>.<br/><br/>
          <span data-i18n="optionsAdvancedDeleteHistoryCareful">Be careful. You have been warned. "Deletes History Temporary Containers" tabs have a "-deletes-history" suffix in the container name to remind you.</span>
          <br/><br/>
          <strong>
            <label class="checkbox-field">
              <input type="checkbox" id="deletesHistoryWarningRead" ${preferences.deletesHistory?.active ? 'checked' : ''} ${
                preferences.deletesHistory?.active ? 'disabled' : ''
              } />
              <span data-i18n="optionsAdvancedDeleteHistoryWarningAccept">I have read the Warning and understand the implications that come with using "Deletes History Temporary Containers". When ticking the checkbox Firefox will ask you for "Access browsing history" permissions.</span>
            </label>
          </strong>
        </div>
        <div class="info-message">
          <span data-i18n="optionsAdvancedDeleteHistoryInfoMessage">You can open "Deletes History Temporary Containers" - also with the keyboard shortcut (default: Alt+P) - after you read the Warning and ticked the checkbox.</span><br/><br/>
          <span data-i18n="optionsAdvancedDeleteHistoryUrlInfo">The deletion applies to the full website URL, not only the domain. That means, if you e.g. open a news article on your favorite news site in a "Deletes History Temporary Container" it won't delete all your previous visits to other news articles that you made outside of "Deletes History Temporary Containers" because the full website URLs are different.</span><br/><br/>
          <span data-i18n="optionsAdvancedDeleteHistoryDeletionInfo">"Deletes History Temporary Containers" will delete history when the "Deletes History Temporary Container" itself gets deleted after the last tab in it closes.</span>
        </div>
      </div>
      
      <div class="section" id="deletesHistoryOptions" ${
        !preferences.deletesHistory?.active ? 'style="opacity: 0.3; pointer-events: none;"' : ''
      }>
        <div class="field">
          <label for="deletesHistoryAutomaticMode" data-i18n="optionsAdvancedDeleteHistoryAutomaticMode">Automatically create "Deletes History Temporary Containers"</label>
          <select id="deletesHistoryAutomaticMode">
            <option value="never" data-i18n="optionsAdvancedDeleteHistoryAutomaticModeNever">Don't automatically create "Deletes History Temporary Containers" instead of normal Temporary Containers (default)</option>
            <option value="automatic" data-i18n="optionsAdvancedDeleteHistoryAutomaticModeAlways">Automatically create "Deletes History Temporary Containers" instead of normal Temporary Containers</option>
          </select>
          <div class="field-description" data-i18n="optionsAdvancedDeleteHistoryAutomaticModeDescription">This affects Automatic Mode, Toolbar Icon and the right-click context menu entry</div>
        </div>
        
        <div class="field checkbox-field">
          <input type="checkbox" id="deletesHistoryContextMenu" />
          <label for="deletesHistoryContextMenu" data-i18n="optionsAdvancedDeleteHistoryContextMenu">Show additional "Deletes History Temporary Containers" entry in the right click on links context menu</label>
        </div>
        
        <div class="field checkbox-field">
          <input type="checkbox" id="deletesHistoryContextMenuBookmarks" />
          <label for="deletesHistoryContextMenuBookmarks" data-i18n="optionsAdvancedDeleteHistoryContextMenuBookmarks">Show additional "Deletes History Temporary Containers" entry in the right click on bookmarks context menu</label>
        </div>
        
        <div class="field">
          <label for="deletesHistoryContainerRemoval" data-i18n="optionsAdvancedDeleteHistoryContainerRemoval">Delete no longer needed "Deletes History Temporary Containers"</label>
          <select id="deletesHistoryContainerRemoval">
            <option value="900000" data-i18n="optionsAdvancedDeleteHistoryContainerRemoval15min">15 minutes after the last tab in it closes</option>
            <option value="0" data-i18n="optionsAdvancedDeleteHistoryContainerRemovalImmediate">After the last tab in it closes (default)</option>
          </select>
          <div class="field-description" data-i18n="optionsAdvancedDeleteHistoryContainerRemovalDescription">"15minutes" lets you "Undo Close Tab" in that timeframe</div>
        </div>
        
        <div class="field">
          <label for="deletesHistoryAlwaysPerDomain" data-i18n="optionsAdvancedDeleteHistoryAlwaysPerDomain">Isolation - Always per domain</label>
          <select id="deletesHistoryAlwaysPerDomain">
            <option value="never" data-i18n="default">Default</option>
            <option value="automatic" data-i18n="optionsAdvancedDeleteHistoryAlwaysPerDomainAutomatic">Open new "Deletes History Temporary Containers" for Domains configured "Isolation Always" instead of normal Temporary Containers</option>
          </select>
        </div>
        
        <div class="field">
          <label for="deletesHistoryContainerIsolation" data-i18n="optionsAdvancedDeleteHistoryContainerIsolation">Isolation - Navigating in tabs</label>
          <select id="deletesHistoryContainerIsolation">
            <option value="never" data-i18n="default">Default</option>
            <option value="automatic" data-i18n="optionsAdvancedDeleteHistoryContainerIsolationAutomatic">Open new "Deletes History Temporary Containers" when "Navigating in tabs Isolation" takes place instead of normal Temporary Containers</option>
          </select>
        </div>
        
        <div class="field">
          <label for="deletesHistoryMouseClicks" data-i18n="optionsAdvancedDeleteHistoryMouseClicks">Isolation - Mouse clicks in "Deletes History Temporary Containers"</label>
          <select id="deletesHistoryMouseClicks">
            <option value="never" data-i18n="default">Default</option>
            <option value="automatic" data-i18n="optionsAdvancedDeleteHistoryMouseClicksAutomatic">Open new "Deletes History Temporary Containers" with Mouse clicks on links in "Deletes History Temporary Containers" instead of normal Temporary Containers</option>
          </select>
        </div>
        
        <div class="field">
          <label for="deletesHistoryMiddleClick" data-i18n="optionsAdvancedDeleteHistoryMiddleClick">Isolation - Middle Mouse Click in Temporary Containers</label>
          <select id="deletesHistoryMiddleClick">
            <option value="default" data-i18n="default">Default</option>
            <option value="deleteshistory" data-i18n="optionsAdvancedDeleteHistoryMiddleClickDeletesHistory">Open new "Deletes History Temporary Containers" with Middle Mouse clicks instead of Temporary Containers</option>
          </select>
        </div>
        
        <div class="field">
          <label for="deletesHistoryCtrlLeftClick" data-i18n="optionsAdvancedDeleteHistoryCtrlLeftClick">Isolation - Ctrl/Cmd+Left Mouse Click in Temporary Containers</label>
          <select id="deletesHistoryCtrlLeftClick">
            <option value="default" data-i18n="default">Default</option>
            <option value="deleteshistory" data-i18n="optionsAdvancedDeleteHistoryCtrlLeftClickDeletesHistory">Open new "Deletes History Temporary Containers" with Ctrl/Cmd+Left Mouse clicks instead of Temporary Containers</option>
          </select>
        </div>
        
        <div class="field">
          <label for="deletesHistoryLeftClick" data-i18n="optionsAdvancedDeleteHistoryLeftClick">Isolation - Left Mouse Click in Temporary Containers</label>
          <select id="deletesHistoryLeftClick">
            <option value="default" data-i18n="default">Default</option>
            <option value="deleteshistory" data-i18n="optionsAdvancedDeleteHistoryLeftClickDeletesHistory">Open new "Deletes History Temporary Containers" with Left Mouse clicks instead of Temporary Containers</option>
          </select>
        </div>
      </div>
    `;

    section.appendChild(content);

    // Load initial values
    if (preferences.deletesHistory) {
      (document.getElementById('deletesHistoryAutomaticMode') as HTMLSelectElement).value =
        preferences.deletesHistory.automaticMode || 'never';
      (document.getElementById('deletesHistoryContextMenu') as HTMLInputElement).checked = preferences.deletesHistory.contextMenu || false;
      (document.getElementById('deletesHistoryContextMenuBookmarks') as HTMLInputElement).checked =
        preferences.deletesHistory.contextMenuBookmarks || false;
      (document.getElementById('deletesHistoryContainerRemoval') as HTMLSelectElement).value = String(
        preferences.deletesHistory.containerRemoval || 0
      );
      (document.getElementById('deletesHistoryAlwaysPerDomain') as HTMLSelectElement).value =
        preferences.deletesHistory.containerAlwaysPerDomain || 'never';
      (document.getElementById('deletesHistoryContainerIsolation') as HTMLSelectElement).value =
        preferences.deletesHistory.containerIsolation || 'never';
      (document.getElementById('deletesHistoryMouseClicks') as HTMLSelectElement).value =
        preferences.deletesHistory.containerMouseClicks || 'never';
    }

    // Load mouse click preferences
    if (preferences.isolation?.global?.mouseClick) {
      (document.getElementById('deletesHistoryMiddleClick') as HTMLSelectElement).value =
        preferences.isolation.global.mouseClick.middle?.container || 'default';
      (document.getElementById('deletesHistoryCtrlLeftClick') as HTMLSelectElement).value =
        preferences.isolation.global.mouseClick.ctrlleft?.container || 'default';
      (document.getElementById('deletesHistoryLeftClick') as HTMLSelectElement).value =
        preferences.isolation.global.mouseClick.left?.container || 'default';
    }

    // Warning checkbox handler
    const warningCheckbox = document.getElementById('deletesHistoryWarningRead') as HTMLInputElement;
    warningCheckbox.addEventListener('change', async () => {
      if (!preferences.deletesHistory) {
        preferences.deletesHistory = {
          active: false,
          automaticMode: 'never',
          contextMenu: false,
          contextMenuBookmarks: false,
          containerAlwaysPerDomain: 'never',
          containerIsolation: 'never',
          containerRemoval: 0,
          containerMouseClicks: 'never',
          statistics: true,
        };
      }
      preferences.deletesHistory.active = warningCheckbox.checked;

      // Update options section visibility
      const optionsSection = document.getElementById('deletesHistoryOptions') as HTMLElement;
      optionsSection.style.cssText = warningCheckbox.checked ? '' : 'opacity: 0.3; pointer-events: none;';

      try {
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    });

    // Helper function to save preference
    async function savePref(path: string, value: any) {
      const keys = path.split('.');
      let obj: any = preferences;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;

      try {
        await savePreferences(preferences);
        showSuccess(browser.i18n.getMessage('savedMessage'));
      } catch (error) {
        showError(browser.i18n.getMessage('errorFailedToSave'));
      }
    }

    // Event listeners for all form fields
    document.getElementById('deletesHistoryAutomaticMode')?.addEventListener('change', e => {
      savePref('deletesHistory.automaticMode', (e.target as HTMLSelectElement).value);
    });

    document.getElementById('deletesHistoryContextMenu')?.addEventListener('change', e => {
      savePref('deletesHistory.contextMenu', (e.target as HTMLInputElement).checked);
    });

    document.getElementById('deletesHistoryContextMenuBookmarks')?.addEventListener('change', e => {
      savePref('deletesHistory.contextMenuBookmarks', (e.target as HTMLInputElement).checked);
    });

    document.getElementById('deletesHistoryContainerRemoval')?.addEventListener('change', e => {
      savePref('deletesHistory.containerRemoval', parseInt((e.target as HTMLSelectElement).value));
    });

    document.getElementById('deletesHistoryAlwaysPerDomain')?.addEventListener('change', e => {
      savePref('deletesHistory.containerAlwaysPerDomain', (e.target as HTMLSelectElement).value);
    });

    document.getElementById('deletesHistoryContainerIsolation')?.addEventListener('change', e => {
      savePref('deletesHistory.containerIsolation', (e.target as HTMLSelectElement).value);
    });

    document.getElementById('deletesHistoryMouseClicks')?.addEventListener('change', e => {
      savePref('deletesHistory.containerMouseClicks', (e.target as HTMLSelectElement).value);
    });

    document.getElementById('deletesHistoryMiddleClick')?.addEventListener('change', e => {
      savePref('isolation.global.mouseClick.middle.container', (e.target as HTMLSelectElement).value);
    });

    document.getElementById('deletesHistoryCtrlLeftClick')?.addEventListener('change', e => {
      savePref('isolation.global.mouseClick.ctrlleft.container', (e.target as HTMLSelectElement).value);
    });

    document.getElementById('deletesHistoryLeftClick')?.addEventListener('change', e => {
      savePref('isolation.global.mouseClick.left.container', (e.target as HTMLSelectElement).value);
    });
  } catch (error) {
    showError(browser.i18n.getMessage('errorFailedToLoadAdvancedDeleteHistory'));
  }
}
