import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initAdvancedDeleteHistoryPage } from '~/ui/pages/AdvancedDeleteHistory/index';

function flush(times = 6) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI AdvancedDeleteHistory: interactions & permissions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('advanced-delete-history', initAdvancedDeleteHistoryPage);
    return ui;
  }

  it('warning checkbox grants permission path', async () => {
    (browser.permissions.request as sinon.SinonStub).resolves(true);
    await setup();
    const cb = document.getElementById('deletesHistoryWarningRead') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(cb.disabled).to.equal(true);
    expect(background.tmp.storage.local.preferences.deletesHistory.active).to.equal(true);
  });

  it('denied permission reverts checkbox', async () => {
    (browser.permissions.request as sinon.SinonStub).resolves(false);
    await setup();
    const cb = document.getElementById('deletesHistoryWarningRead') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(cb.checked).to.equal(false);
  });

  it('updates automatic mode select', async () => {
    // Skip permission gating by pre-setting active
    (background.tmp.storage.local.preferences as any).deletesHistory = { active: true };
    await setup();
    const sel = document.getElementById('deletesHistoryAutomaticMode') as HTMLSelectElement;
    sel.value = 'automatic';
    sel.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(background.tmp.storage.local.preferences.deletesHistory.automaticMode).to.equal('automatic');
  });
});
