import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initAdvancedCookiesPage } from '~/ui/pages/AdvancedCookies/index';

function flush(times = 8) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI AdvancedCookies: form interactions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
    // Ensure empty initial cookies pref
    (background.tmp.storage.local.preferences as any).cookies = { domain: {} };
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('advanced-cookies', initAdvancedCookiesPage);
    return ui;
  }

  it('shows no cookies message initially', async () => {
    await setup();
    const display = document.querySelector('#cookiesDisplay') as HTMLElement;
    // i18n stub returns key; fallback text is already English; accept either
    expect(/No cookies configured|optionsAdvancedCookiesNoCookies/.test(display.textContent || '')).to.equal(true);
  });

  it('adds a minimal cookie', async () => {
    await setup();
    (document.getElementById('cookieDomainPattern') as HTMLInputElement).value = 'example.com';
    (document.getElementById('cookieName') as HTMLInputElement).value = 'sess';
    (document.getElementById('cookieValue') as HTMLInputElement).value = 'abc';
    (document.getElementById('cookieUrl') as HTMLInputElement).value = 'https://example.com/';
    (document.getElementById('cookieForm') as HTMLFormElement).dispatchEvent(
      new (window as any).Event('submit', { bubbles: true, cancelable: true })
    );
    await flush();
    const cookiesPref = ((await background.tmp.storage.local.preferences) as any).cookies.domain['example.com'];
    expect(cookiesPref).to.be.an('array');
    expect(cookiesPref[0].name).to.equal('sess');
  });

  it('edits an existing cookie', async () => {
    // Pre-populate
    (background.tmp.storage.local.preferences as any).cookies.domain['example.com'] = [
      {
        name: 'a',
        value: '1',
        domain: '',
        url: 'https://example.com/',
        expirationDate: '',
        firstPartyDomain: '',
        httpOnly: '',
        path: '',
        sameSite: '',
        secure: '',
      },
    ];
    await setup();
    const editBtn = document.querySelector('.cookie-edit') as HTMLButtonElement;
    editBtn.click();
    await flush();
    (document.getElementById('cookieValue') as HTMLInputElement).value = '2';
    (document.getElementById('cookieForm') as HTMLFormElement).dispatchEvent(
      new (window as any).Event('submit', { bubbles: true, cancelable: true })
    );
    await flush();
    const updated = (background.tmp.storage.local.preferences as any).cookies.domain['example.com'][0];
    expect(updated.value).to.equal('2');
  });

  it('removes a cookie', async () => {
    (background.tmp.storage.local.preferences as any).cookies.domain['example.com'] = [
      {
        name: 'a',
        value: '1',
        domain: '',
        url: 'https://example.com/',
        expirationDate: '',
        firstPartyDomain: '',
        httpOnly: '',
        path: '',
        sameSite: '',
        secure: '',
      },
    ];
    (global as any).confirm = () => true;
    await setup();
    (document.querySelector('.cookie-remove') as HTMLButtonElement).click();
    await flush();
    const domainEntry = (background.tmp.storage.local.preferences as any).cookies.domain['example.com'];
    expect(domainEntry).to.be.undefined;
  });
});
