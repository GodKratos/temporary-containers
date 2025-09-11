/**
 * Shared module for Statistics functionality
 * Based on the options menu implementation
 */

import { t, sendMessage } from '../utils.js';

/**
 * Create the Statistics content
 * @param {Object} statistics - The statistics object
 * @param {Function} onReset - Callback function when statistics are reset
 * @param {Object} options - Additional options
 * @param {boolean} options.showResetButton - Whether to show the reset button
 * @returns {HTMLElement} The statistics content element
 */
export function createStatisticsContent(statistics, onReset, options = {}) {
  const { showResetButton = true } = options;
  const content = document.createElement('div');

  if (!statistics) {
    content.innerHTML = `
      <div class="statistics-container">
        <p data-i18n="noStatisticsAvailable">No statistics available.</p>
      </div>
    `;
    return content;
  }

  // Create statistics container
  const statisticsContainer = document.createElement('div');
  statisticsContainer.className = 'statistics-container';

  // Statistics items (based on options menu)
  const statisticsItems = [
    {
      key: 'containersCreated',
      label: 'containersCreated',
      value: statistics.containersCreated || 0,
    },
    {
      key: 'containersActive',
      label: 'containersActive',
      value: statistics.containersActive || 0,
    },
    {
      key: 'containersRemoved',
      label: 'containersRemoved',
      value: statistics.containersRemoved || 0,
    },
    {
      key: 'isolationPrevented',
      label: 'isolationPrevented',
      value: statistics.isolationPrevented || 0,
    },
  ];

  // Create statistics HTML (same format as options menu)
  let statisticsHTML = '<div class="statistics-container">';
  statisticsItems.forEach(item => {
    statisticsHTML += `
      <div class="statistic-item">
        <div class="statistic-label" data-i18n="${item.label}">${t(item.label)}</div>
        <div id="${item.key}" class="statistic-value">${item.value}</div>
      </div>
    `;
  });
  statisticsHTML += '</div>';

  statisticsContainer.innerHTML = statisticsHTML;
  content.appendChild(statisticsContainer);

  // Add reset button if requested
  if (showResetButton) {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.innerHTML = `
      <button id="resetStatistics" class="button-default" data-i18n="resetStatistics">Reset Statistics</button>
    `;

    // Add event listener for reset button
    const resetButton = buttonGroup.querySelector('#resetStatistics');
    if (resetButton && onReset) {
      resetButton.addEventListener('click', onReset);
    }

    content.appendChild(buttonGroup);
  }

  return content;
}

/**
 * Update statistics display
 * @param {HTMLElement} content - The content element
 * @param {Object} statistics - The statistics object
 */
export function updateStatisticsDisplay(content, statistics) {
  if (!content || !statistics) return;

  // Update individual statistic values
  const statisticElements = content.querySelectorAll('.statistic-value');
  statisticElements.forEach(element => {
    const key = element.id;
    if (key) {
      let value = 0;

      switch (key) {
        case 'containersCreated':
          value = statistics.containersCreated || 0;
          break;
        case 'containersActive':
          value = statistics.containersActive || 0;
          break;
        case 'containersRemoved':
          value = statistics.containersRemoved || 0;
          break;
        case 'isolationPrevented':
          value = statistics.isolationPrevented || 0;
          break;
      }

      element.textContent = value;
    }
  });
}

/**
 * Initialize the statistics tab
 * @param {HTMLElement} tabElement - The tab element to populate
 * @param {Object} statistics - The statistics object
 * @param {Function} onReset - Callback function when statistics are reset
 * @param {Object} options - Additional options
 */
export function initializeStatisticsTab(tabElement, statistics, onReset, options = {}) {
  if (tabElement) {
    const content = createStatisticsContent(statistics, onReset, options);
    tabElement.appendChild(content);
  }
}
