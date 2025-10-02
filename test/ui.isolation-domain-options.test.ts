import { expect } from 'chai';
import { loadBackground } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initIsolationPerDomainPage } from '~/ui/pages/IsolationPerDomain/index';

function flush(times = 10) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI IsolationPerDomain: rule lifecycle', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
    background.tmp.storage.local.preferences.isolation.domain = []; // start clean
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('isolation-domain', initIsolationPerDomainPage);
    return ui;
  }

  it('enables domain settings when pattern provided', async () => {
    await setup();
    const pattern = document.getElementById('domainPatternInput') as HTMLInputElement;
    const domainSettings = document.getElementById('domainSettings') as HTMLElement;
    pattern.value = 'example.com';
    pattern.dispatchEvent(new (window as any).Event('input', { bubbles: true }));
    await flush();
    expect(domainSettings.style.opacity === '' || domainSettings.style.opacity === '1').to.equal(true);
  });

  it('adds a new domain rule', async () => {
    await setup();
    (document.getElementById('domainPatternInput') as HTMLInputElement).value = 'example.com';
    (document.getElementById('domainPatternInput') as HTMLInputElement).dispatchEvent(
      new (window as any).Event('input', { bubbles: true })
    );
    await flush();
    (document.getElementById('alwaysAction') as HTMLSelectElement).value = 'enabled';
    (document.getElementById('alwaysAction') as HTMLSelectElement).dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    const saveBtn = document.getElementById('saveDomainRule') as HTMLButtonElement;
    saveBtn.click();
    await flush(20);
    expect(background.tmp.storage.local.preferences.isolation.domain.some(d => d.pattern === 'example.com')).to.equal(true);
  });

  it('edits and removes a domain rule', async () => {
    // Seed one rule
    background.tmp.storage.local.preferences.isolation.domain.push({
      pattern: 'edit.com',
      always: { action: 'disabled', allowedInPermanent: false, allowedInTemporary: false },
      navigation: { action: 'global' },
      mouseClick: {
        middle: { action: 'global', container: 'default' },
        ctrlleft: { action: 'global', container: 'default' },
        left: { action: 'global', container: 'default' },
      },
      excluded: [],
      excludedContainers: [],
    } as any);
    await setup();
    const editBtn = document.querySelector('.edit-domain') as HTMLButtonElement;
    editBtn.click();
    await flush(10);
    (document.getElementById('alwaysAction') as HTMLSelectElement).value = 'enabled';
    (document.getElementById('alwaysAction') as HTMLSelectElement).dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    (document.getElementById('saveDomainRule') as HTMLButtonElement).click();
    await flush(20);
    const updated = background.tmp.storage.local.preferences.isolation.domain.find(d => d.pattern === 'edit.com');
    expect(updated?.always.action).to.equal('enabled');
    // Remove
    try {
      Object.defineProperty(window, 'confirm', { value: () => true, configurable: true });
    } catch {
      (window as any).confirm = () => true;
    }
    const removeBtn = document.querySelector('.remove-domain') as HTMLButtonElement;
    removeBtn.click();
    await flush(15);
    expect(background.tmp.storage.local.preferences.isolation.domain.find(d => d.pattern === 'edit.com')).to.be.undefined;
  });
});
