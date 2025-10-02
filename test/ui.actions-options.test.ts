import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initActionsPage } from '~/ui/pages/Actions/index';

function flush(times = 5) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI Actions: buttons state & messaging', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
  });

  async function setupWithActiveTab(tab: Partial<browser.tabs.Tab>) {
    (browser.tabs.query as sinon.SinonStub).resolves([
      {
        id: 1,
        active: true,
        pinned: false,
        incognito: false,
        highlighted: true,
        windowId: 1,
        index: 0,
        url: 'https://example.com',
        cookieStoreId: 'firefox-default',
        ...tab,
      },
    ]);
    // Ensure tempContainers structure exists
    if (!background.tmp.storage.local.tempContainers) {
      background.tmp.storage.local.tempContainers = {} as any;
    }
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('actions', initActionsPage);
    return ui;
  }

  it('disables all buttons on non-http tab', async () => {
    await setupWithActiveTab({ url: 'about:addons' });
    expect((document.getElementById('action-reopen-tmp') as HTMLButtonElement).disabled).to.equal(true);
  });

  it('enables reopen button on normal http tab', async () => {
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-default' });
    expect((document.getElementById('action-reopen-tmp') as HTMLButtonElement).disabled).to.equal(false);
  });

  it('convert permanent/temporary buttons state reflect temp & permanent', async () => {
    // Simulate a temp container cookieStoreId existing in storage
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123' },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    expect((document.getElementById('action-convert-permanent') as HTMLButtonElement).disabled).to.equal(false);
    expect((document.getElementById('action-convert-temporary') as HTMLButtonElement).disabled).to.equal(true);
  });

  it('clicking reopen sends createTabInTempContainer message', async () => {
    // Spy on the current runtime.sendMessage implementation (may be wrapped by bootstrap)
    const spy = sinon.spy(browser.runtime, 'sendMessage');
    await setupWithActiveTab({ url: 'https://example.com' });
    (document.getElementById('action-reopen-tmp') as HTMLButtonElement).click();
    await flush(3);
    const called = spy.getCalls().some(c => {
      const arg = c.args[0];
      return arg && typeof arg === 'object' && 'method' in arg && (arg as any).method === 'createTabInTempContainer';
    });
    expect(called, 'Expected createTabInTempContainer message').to.equal(true);
    spy.restore();
  });
});
