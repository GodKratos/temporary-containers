// Shared Statistics page logic for both options and popup menus
import { getStorage, showError, showSuccess } from '../../shared/utils';
import { StorageLocal } from '../../../types';
import { formatBytes } from '../../../shared';

export async function initStatisticsPage(): Promise<void> {
  try {
    const storage = await getStorage();
    const section = document.getElementById('statistics');
    if (!section) return;
    section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'statistics-container';
    const stats = storage.statistics;
    
    content.innerHTML = `
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
        ${stats.deletesHistory ? `
        <div class="statistic-section">
          <h4 data-i18n="optionsStatisticsDeletesHistoryStatistics">Deletes History Statistics</h4>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsDeletesHistoryContainers">Deletes History Containers</div>
            <div class="statistic-value">${stats.deletesHistory.containersDeleted || 0}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsDeletesHistoryCookies">Deletes History Cookies</div>
            <div class="statistic-value">${stats.deletesHistory.cookiesDeleted || 0}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-label" data-i18n="optionsStatisticsUrlsDeletedFromHistory">URLs Deleted from History</div>
            <div class="statistic-value">${stats.deletesHistory.urlsDeleted || 0}</div>
          </div>
        </div>
        ` : ''}
      </div>
      <div class="button-group">
        <button id="resetStatistics" class="button-default" data-i18n="resetStatistics">Reset Statistics</button>
      </div>
    `;
    
    if (!section.firstChild) section.appendChild(content);

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
