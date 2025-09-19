// Shared Statistics page logic for both options and popup menus
import { getPreferences, getStorage, savePreferences, showError, showSuccess } from '../../shared/utils';
import { formatBytes } from '../../../shared';

export async function initStatisticsPage(): Promise<void> {
  try {
    const storage = await getStorage();
    const preferences = await getPreferences();
    const section = document.getElementById('statistics');
    if (!section) return;
    section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'statistics-container';
    const stats = storage.statistics;

    content.innerHTML = `
      <div class="section">
        <h3 data-i18n="optionsStatisticsTemporaryContainerStatistics">Temporary Container Statistics</h3>
        <div class="statistics-grid">
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="containersRemoved">Containers Removed</div>
            <div class="statistic-value">${stats.containersDeleted || 0}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="containersActive">Containers Active</div>
            <div class="statistic-value">${Object.keys(storage.tempContainers || {}).length}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsCookiesDeleted">Cookies Deleted</div>
            <div class="statistic-value">${stats.cookiesDeleted || 0}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsCacheDeleted">Cache Deleted</div>
            <div class="statistic-value">${formatBytes(stats.cacheDeleted || 0)}</div>
          </div>
        </div>
        <div class="field checkbox-field">
          <input type="checkbox" id="collectTemporaryContainerStats" name="collectTemporaryContainerStats" />
          <label for="collectTemporaryContainerStats" data-i18n="optionsStatisticsCollectTemporaryContainerStats">Collect local statistics for Temporary Containers</label>
        </div>
      </div>
      ${
        preferences.deletesHistory.active && stats.deletesHistory
          ? `
      <div class="section">
        <h4 data-i18n="optionsStatisticsDeletesHistoryStatistics">Deletes History Statistics</h4>
        <div class="statistics-grid">
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsDeletesHistoryContainers">Deletes History Containers Removed</div>
            <div class="statistic-value">${stats.deletesHistory.containersDeleted || 0}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsDeletesHistoryCookies">Deletes History Cookies Deleted</div>
            <div class="statistic-value">${stats.deletesHistory.cookiesDeleted || 0}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsUrlsDeletedFromHistory">URLs Deleted from History</div>
            <div class="statistic-value">${stats.deletesHistory.urlsDeleted || 0}</div>
          </div>
        </div>
        <div class="field checkbox-field">
          <input type="checkbox" id="collectDeletesHistoryStats" name="collectDeletesHistoryStats" />
          <label for="collectDeletesHistoryStats" data-i18n="optionsStatisticsCollectDeletesHistoryStats">Collect local statistics for Deletes History containers</label>
        </div>
      </div>
      `
          : ''
      }
      <div class="button-group">
        <button id="resetStatistics" class="button-default" data-i18n="resetStatistics">Reset Statistics</button>
      </div>
    `;

    if (!section.firstChild) section.appendChild(content);

    // Initialize checkboxes state & bind events
    const tempStatsCheckbox = document.getElementById('collectTemporaryContainerStats') as HTMLInputElement | null;
    if (tempStatsCheckbox && !tempStatsCheckbox.hasAttribute('data-listener')) {
      tempStatsCheckbox.checked = !!preferences.statistics || false;
      tempStatsCheckbox.setAttribute('data-listener', 'true');
      tempStatsCheckbox.addEventListener('change', async () => {
        try {
          preferences.statistics = tempStatsCheckbox.checked;
          await savePreferences(preferences);
          showSuccess(browser.i18n.getMessage('savedMessage'));
        } catch (e) {
          console.error('Failed to toggle statistics preference', e);
          showError(browser.i18n.getMessage('errorFailedToSave'));
          // revert UI
          tempStatsCheckbox.checked = !tempStatsCheckbox.checked;
        }
      });
    }

    const deletesHistoryStatsCheckbox = document.getElementById('collectDeletesHistoryStats') as HTMLInputElement | null;
    if (deletesHistoryStatsCheckbox && !deletesHistoryStatsCheckbox.hasAttribute('data-listener')) {
      deletesHistoryStatsCheckbox.checked = !!preferences.deletesHistory?.statistics || false;
      deletesHistoryStatsCheckbox.setAttribute('data-listener', 'true');
      deletesHistoryStatsCheckbox.addEventListener('change', async () => {
        try {
          preferences.deletesHistory = {
            ...(preferences.deletesHistory || {}),
            statistics: deletesHistoryStatsCheckbox.checked,
          };
          await savePreferences(preferences);
          showSuccess(browser.i18n.getMessage('savedMessage'));
        } catch (e) {
          console.error('Failed to toggle deletesHistory statistics preference', e);
          showError(browser.i18n.getMessage('errorFailedToSave'));
          deletesHistoryStatsCheckbox.checked = !deletesHistoryStatsCheckbox.checked;
        }
      });
    }

    // Bind reset statistics event
    const resetButton = document.getElementById('resetStatistics');
    if (resetButton && !resetButton.hasAttribute('data-listener')) {
      resetButton.setAttribute('data-listener', 'true');
      resetButton.addEventListener('click', async () => {
        if (!window.confirm('Reset statistics?')) {
          return;
        }

        try {
          await browser.runtime.sendMessage({
            method: 'resetStatistics',
          });
          showSuccess(browser.i18n.getMessage('optionsStatisticsResetSuccess'));
          // Refresh the page to show updated stats
          await initStatisticsPage();
        } catch (error) {
          console.error('Error resetting statistics:', error);
          showError(browser.i18n.getMessage('optionsStatisticsResetError'));
        }
      });
    }
  } catch (error) {
    console.error('Error initializing statistics page:', error);
    showError(browser.i18n.getMessage('errorFailedToLoadStatistics'));
  }
}
