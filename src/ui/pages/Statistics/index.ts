// Shared Statistics page logic for both options and popup menus
import { getStorage, showError } from '../../shared/utils';
import { StorageLocal } from '../../../types';

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
      <div class="statistic-item">
        <div class="statistic-label" data-i18n="containersCreated">Containers Created</div>
        <div class="statistic-value">${stats.containersDeleted}</div>
      </div>
      <div class="statistic-item">
        <div class="statistic-label" data-i18n="containersActive">Containers Active</div>
        <div class="statistic-value">${Object.keys(storage.tempContainers).length}</div>
      </div>
      <div class="statistic-item">
        <div class="statistic-label" data-i18n="containersRemoved">Containers Removed</div>
        <div class="statistic-value">${stats.deletesHistory.containersDeleted}</div>
      </div>
      <div class="statistic-item">
        <div class="statistic-label" data-i18n="isolationPrevented">Isolation Prevented</div>
        <div class="statistic-value">0</div>
      </div>
      <div class="button-group">
        <button id="resetStatistics" class="button-default" data-i18n="resetStatistics">Reset Statistics</button>
      </div>
    `;
    // ...bind reset event...
  section.appendChild(content);
  } catch (error) {
    showError('Failed to load statistics');
  }
}
