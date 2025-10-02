import { expect } from 'chai';
import { loadBackground } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initIsolationGlobalPage } from '~/ui/pages/IsolationGlobal/index';

function flush(times = 8) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI IsolationGlobal: core interactions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('isolation-global', initIsolationGlobalPage);
    return ui;
  }

  it('changes global navigation action', async () => {
    await setup();
    const sel = document.getElementById('isolationGlobalUrlNavigation') as HTMLSelectElement;
    const newValue = sel.value === 'never' ? 'always' : 'never';
    sel.value = newValue;
    sel.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(background.tmp.storage.local.preferences.isolation.global.navigation.action).to.equal(newValue);
  });

  it('adds and removes excluded domain', async () => {
    await setup();
    const input = document.getElementById('excludedDomainsInput') as HTMLInputElement;
    input.value = 'example.com';
    (document.getElementById('addExcludedDomain') as HTMLButtonElement).click();
    await flush();
    expect(background.tmp.storage.local.preferences.isolation.global.excluded).to.include('example.com');
    const tag = Array.from(document.querySelectorAll('#excludedDomains .tag')).find(t =>
      t.textContent?.includes('example.com')
    ) as HTMLElement;
    const btn = tag.querySelector('button') as HTMLButtonElement;
    btn.click();
    await flush();
    expect(background.tmp.storage.local.preferences.isolation.global.excluded).to.not.include('example.com');
  });
});
