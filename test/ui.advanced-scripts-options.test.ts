import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initAdvancedScriptsPage } from '~/ui/pages/AdvancedScripts/index';

function flush(times = 8) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI AdvancedScripts: form & permission', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
    (background.tmp.storage.local.preferences as any).scripts = { active: false, domain: {} };
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('advanced-scripts', initAdvancedScriptsPage);
    return ui;
  }

  it('permission checkbox accepted path', async () => {
    (browser.permissions.request as sinon.SinonStub).resolves(true);
    await setup();
    const cb = document.getElementById('scriptsWarningRead') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    expect(cb.disabled).to.equal(true);
    expect(background.tmp.storage.local.preferences.scripts.active).to.equal(true);
  });

  it('permission checkbox denied path', async () => {
    (browser.permissions.request as sinon.SinonStub).resolves(false);
    await setup();
    const cb = document.getElementById('scriptsWarningRead') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    // Should have reverted to unchecked and not disabled
    expect(cb.checked).to.equal(false);
    expect(cb.disabled).to.equal(false);
    expect(background.tmp.storage.local.preferences.scripts.active).to.equal(false);
    const formSection = document.getElementById('scriptsFormSection') as HTMLElement;
    expect(formSection.style.cssText).to.contain('opacity: 0.3');
  });

  it('adds a script', async () => {
    (browser.permissions.request as sinon.SinonStub).resolves(true);
    await setup();
    const cb = document.getElementById('scriptsWarningRead') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    (document.getElementById('scriptDomainPattern') as HTMLInputElement).value = 'example.com';
    (document.getElementById('scriptCode') as HTMLTextAreaElement).value = 'console.log(1)';
    (document.getElementById('scriptForm') as HTMLFormElement).dispatchEvent(
      new (window as any).Event('submit', { bubbles: true, cancelable: true })
    );
    await flush();
    const scriptsPref = (background.tmp.storage.local.preferences as any).scripts.domain['example.com'];
    expect(scriptsPref).to.be.an('array');
    expect(scriptsPref[0].code).to.contain('console.log');
  });

  it('removes a script', async () => {
    (background.tmp.storage.local.preferences as any).scripts.domain['example.com'] = [{ code: 'x=1', runAt: 'document_idle' }];
    (browser.permissions.request as sinon.SinonStub).resolves(true);
    (global as any).confirm = () => true;
    await setup();
    // ensure active to avoid disabled overlay
    const cb = document.getElementById('scriptsWarningRead') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    (document.querySelector('.script-remove') as HTMLButtonElement).click();
    await flush();
    expect((background.tmp.storage.local.preferences as any).scripts.domain['example.com']).to.be.undefined;
  });
});
