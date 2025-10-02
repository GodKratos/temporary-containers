import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initAdvancedMiscPage } from '~/ui/pages/AdvancedMisc/index';

function flush(times = 6) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI AdvancedMisc: core interactions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('advanced-misc', initAdvancedMiscPage);
    return ui;
  }

  it('toggles contextMenu checkbox', async () => {
    await setup();
    const cb = document.getElementById('contextMenu') as HTMLInputElement;
    cb.checked = !cb.checked;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(background.tmp.storage.local.preferences.contextMenu).to.equal(cb.checked);
  });

  it('adds and removes ignored domain', async () => {
    await setup();
    (document.getElementById('ignoredDomainsInput') as HTMLInputElement).value = 'example.com';
    (document.getElementById('addIgnoredDomain') as HTMLButtonElement).click();
    await flush();
    expect((background.tmp.storage.local.preferences.ignoreRequests || []).includes('example.com')).to.equal(true);
    // remove the tag we added (last one)
    const tags = Array.from(document.querySelectorAll('#ignoredDomains .tag'));
    const targetTag = tags.find(t => t.textContent?.includes('example.com')) as HTMLElement;
    const removeBtn = targetTag.querySelector('button') as HTMLButtonElement;
    removeBtn.click();
    await flush();
    expect(background.tmp.storage.local.preferences.ignoreRequests || []).to.not.include('example.com');
  });

  it('changes isolationMac select', async () => {
    await setup();
    const sel = document.getElementById('isolationMac') as HTMLSelectElement;
    sel.value = sel.value === 'disabled' ? 'enabled' : 'disabled';
    sel.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(background.tmp.storage.local.preferences.isolation.mac.action).to.equal(sel.value);
  });

  it('reset storage success path', async () => {
    await setup();
    // Override confirm for jsdom (not implemented by default)
    try {
      Object.defineProperty(window, 'confirm', { value: () => true, configurable: true });
    } catch {
      (window as any).confirm = () => true;
    }
    (global as any).confirm = () => true;
    const original = browser.runtime.sendMessage;
    const captured: any[] = [];
    (browser.runtime as any).sendMessage = (msg: any) => {
      captured.push(msg);
      if (msg && msg.method === 'resetStorage') {
        return Promise.resolve(true);
      }
      return original(msg);
    };
    (document.getElementById('resetStorage') as HTMLButtonElement).click();
    await flush(20);
    expect(captured.some(c => c && c.method === 'resetStorage')).to.equal(true);
    // We intentionally don't assert on window.location.reload due to jsdom restriction
  });
});
