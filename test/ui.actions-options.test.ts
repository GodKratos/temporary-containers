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

  it('shows only the not-available message on non-http tab', async () => {
    await setupWithActiveTab({ url: 'about:addons' });
    expect(document.getElementById('action-reopen-tmp')).to.equal(null);
    expect(document.querySelector('[data-i18n="optionsActionsNotAvailable"]')).to.not.equal(null);
  });

  it('enables reopen button on normal http tab', async () => {
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-default' });
    expect((document.getElementById('action-reopen-tmp') as HTMLButtonElement).disabled).to.equal(false);
  });

  it('shows convert-permanent for a temp container and convert-temporary for a permanent container', async () => {
    // Simulate a temp container cookieStoreId existing in storage
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123' },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    expect(document.getElementById('action-convert-permanent')).to.not.equal(null);
    expect(document.getElementById('action-convert-temporary')).to.equal(null);
  });

  it('shows convert-temporary for a permanent (non-default) container and not convert-permanent', async () => {
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-456' });
    expect(document.getElementById('action-convert-temporary')).to.not.equal(null);
    expect(document.getElementById('action-convert-permanent')).to.equal(null);
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

  it('hides deletes-history buttons when history permission is not granted', async () => {
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123' },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    expect(document.getElementById('action-reopen-deleteshistory-tmp')).to.equal(null);
    expect(document.getElementById('action-convert-deleteshistory')).to.equal(null);
    expect(document.getElementById('action-convert-regular')).to.equal(null);
  });

  it('shows reopen-deleteshistory and convert-to-deleteshistory for a regular temp container when history permission is granted', async () => {
    (background as any)._mockPermissions = { history: true };
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123' },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    expect(document.getElementById('action-reopen-deleteshistory-tmp')).to.not.equal(null);
    expect(document.getElementById('action-convert-deleteshistory')).to.not.equal(null);
    expect(document.getElementById('action-convert-regular')).to.equal(null);
  });

  it('shows convert-regular but not convert-to-deleteshistory for a deletes-history temp container', async () => {
    (background as any)._mockPermissions = { history: true };
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123', deletesHistory: true },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    expect(document.getElementById('action-convert-regular')).to.not.equal(null);
    expect(document.getElementById('action-convert-deleteshistory')).to.equal(null);
  });

  it('clicking convert-regular sends convertDeletesHistoryToTempContainer message', async () => {
    (background as any)._mockPermissions = { history: true };
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123', deletesHistory: true },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    const btn = document.getElementById('action-convert-regular') as HTMLButtonElement;

    const spy = sinon.spy(browser.runtime, 'sendMessage');
    btn.click();
    await flush(3);
    const called = spy.getCalls().some(c => {
      const arg = c.args[0];
      return arg && typeof arg === 'object' && 'method' in arg && (arg as any).method === 'convertDeletesHistoryToTempContainer';
    });
    expect(called, 'Expected convertDeletesHistoryToTempContainer message').to.equal(true);
    spy.restore();
  });

  it('clicking convert-to-deleteshistory sends convertTempContainerToDeletesHistory message', async () => {
    (background as any)._mockPermissions = { history: true };
    background.tmp.storage.local.tempContainers = {
      'firefox-container-123': { id: 'firefox-container-123', name: 'tmp-container-123' },
    } as any;
    await setupWithActiveTab({ url: 'https://example.com', cookieStoreId: 'firefox-container-123' });
    const btn = document.getElementById('action-convert-deleteshistory') as HTMLButtonElement;

    const spy = sinon.spy(browser.runtime, 'sendMessage');
    btn.click();
    await flush(3);
    const called = spy.getCalls().some(c => {
      const arg = c.args[0];
      return arg && typeof arg === 'object' && 'method' in arg && (arg as any).method === 'convertTempContainerToDeletesHistory';
    });
    expect(called, 'Expected convertTempContainerToDeletesHistory message').to.equal(true);
    spy.restore();
  });
});
