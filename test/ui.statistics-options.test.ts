import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initStatisticsPage } from '~/ui/pages/Statistics/index';

function flush(times = 8) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI Statistics: display & toggles', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
    // seed statistics
    (background.tmp.storage.local as any).statistics = {
      containersDeleted: 3,
      cookiesDeleted: 5,
      cacheDeleted: 1024,
      deletesHistory: { containersDeleted: 1, cookiesDeleted: 2, urlsDeleted: 9 },
    };
    background.tmp.storage.local.preferences.deletesHistory.active = true;
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('statistics', initStatisticsPage);
    return ui;
  }

  it('shows statistics and toggles main stats collection', async () => {
    await setup();
    const tempCb = document.getElementById('collectTemporaryContainerStats') as HTMLInputElement;
    const previous = !!background.tmp.storage.local.preferences.statistics;
    tempCb.checked = !previous;
    tempCb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(background.tmp.storage.local.preferences.statistics).to.equal(!previous);
  });

  it('resets statistics via reset button', async () => {
    await setup();
    try {
      Object.defineProperty(window, 'confirm', { value: () => true, configurable: true });
    } catch {
      (window as any).confirm = () => true;
    }
    const original = browser.runtime.sendMessage;
    const captured: any[] = [];
    (browser.runtime as any).sendMessage = (msg: any) => {
      captured.push(msg);
      return original(msg);
    };
    (document.getElementById('resetStatistics') as HTMLButtonElement).click();
    await flush(12);
    expect(captured.some(c => c && c.method === 'resetStatistics')).to.equal(true);
  });
});
