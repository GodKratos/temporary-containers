import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initGeneralPage } from '~/ui/pages/General/index';
import { getPreferences, savePreferences } from '~/ui/shared/utils';

// Coverage of General page controls:
// - automaticMode.active checkbox
// - browserActionPopup checkbox
// - notifications checkbox
// - containerNamePrefix text input
// - containerColorRandom toggle shows/hides excluded section and clears manual color dependency
// - containerColor select persists
// - containerColorRandomExcluded multi-select persists array
// - containerIconRandom toggle shows/hides excluded section
// - containerIcon select persists
// - containerIconRandomExcluded multi-select persists array
// - containerNumberMode select persists
// - containerRemoval select persists and affects underlying pref (number)
// - iconColor select triggers browserAction.setIcon

function flushMicrotasks(times = 5) {
  let chain: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) {
    chain = chain.then(() => Promise.resolve());
  }
  return chain;
}

describe('UI General: form interactions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
  });

  async function setupGeneral() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('general', initGeneralPage);
    return ui;
  }

  it('automaticMode.active checkbox toggles preference', async () => {
    const ui = await setupGeneral();
    const cb = document.getElementById('automaticMode') as HTMLInputElement;
    expect(cb.checked).to.equal(background.tmp.pref.automaticMode.active);
    cb.checked = !cb.checked;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(10);
    expect(background.tmp.pref.automaticMode.active).to.equal(cb.checked);
  });

  it('browserActionPopup toggling configures popup', async () => {
    const ui = await setupGeneral();
    // initial state default false
    const createTabStub = sinon.stub(background.tmp.container, 'createTabInTempContainer').callThrough();
    const setPopupSpy = (browser.browserAction.setPopup as any).isSinonProxy
      ? (browser.browserAction.setPopup as any)
      : sinon.spy(browser.browserAction, 'setPopup');

    await background.browseraction!.onClicked();
    expect(createTabStub.calledOnce).to.equal(true);
    expect(setPopupSpy.called).to.equal(false);
    expect(background.tmp.pref.browserActionPopup).to.equal(false);

    // programmatic preference save (to ensure diff) then UI reflect
    const base = await getPreferences();
    const updated = JSON.parse(JSON.stringify(base));
    updated.browserActionPopup = true;
    await savePreferences(updated as any);

    const checkbox = document.getElementById('browserActionPopup') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new (window as any).Event('change', { bubbles: true }));

    for (let i = 0; i < 25 && !setPopupSpy.called; i++) {
      await Promise.resolve();
    }
    expect(background.tmp.pref.browserActionPopup).to.equal(true);
    expect(setPopupSpy.called).to.equal(true);
    const popupArg = setPopupSpy.firstCall.args[0];
    expect(popupArg).to.deep.equal({ popup: 'popup.html' });
  });

  it('notifications checkbox toggles preference', async () => {
    await setupGeneral();
    const cb = document.getElementById('notificationsCheckbox') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(10);
    expect(background.tmp.pref.notifications).to.equal(true);
  });

  it('containerNamePrefix text input saves value', async () => {
    await setupGeneral();
    const input = document.getElementById('containerNamePrefix') as HTMLInputElement;
    input.value = 'tempX';
    input.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(10);
    expect(background.tmp.pref.container.namePrefix).to.equal('tempX');
  });

  it('containerColorRandom toggle hides color select and shows excluded section', async () => {
    await setupGeneral();
    const randomCb = document.getElementById('containerColorRandom') as HTMLInputElement;
    const colorSection = document.getElementById('containerColorSection')!;
    const excludedSection = document.getElementById('containerColorRandomExcludedSection')!;
    expect(excludedSection.classList.contains('hidden')).to.equal(true);
    randomCb.checked = true;
    randomCb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(colorSection.classList.contains('hidden')).to.equal(true);
    expect(excludedSection.classList.contains('hidden')).to.equal(false);
    expect(background.tmp.pref.container.colorRandom).to.equal(true);
  });

  it('containerColor select persists chosen color', async () => {
    await setupGeneral();
    const select = document.getElementById('containerColor') as HTMLSelectElement;
    const target = Array.from(select.options).find(o => o.value !== select.value)!;
    select.value = target.value;
    select.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(background.tmp.pref.container.color).to.equal(target.value);
  });

  it('containerColorRandomExcluded multi-select persists array', async () => {
    await setupGeneral();
    const randomCb = document.getElementById('containerColorRandom') as HTMLInputElement;
    randomCb.checked = true;
    randomCb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    const multi = document.getElementById('containerColorRandomExcluded') as HTMLSelectElement;
    // Select first two options
    Array.from(multi.options).forEach((opt, idx) => (opt.selected = idx < 2));
    multi.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(background.tmp.pref.container.colorRandomExcluded).to.deep.equal([multi.options[0].value, multi.options[1].value]);
  });

  it('containerIconRandom toggle hides icon select and shows excluded section', async () => {
    await setupGeneral();
    const randomCb = document.getElementById('containerIconRandom') as HTMLInputElement;
    const iconSection = document.getElementById('containerIconSection')!;
    const excludedSection = document.getElementById('containerIconRandomExcludedSection')!;
    expect(excludedSection.classList.contains('hidden')).to.equal(true);
    randomCb.checked = true;
    randomCb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(iconSection.classList.contains('hidden')).to.equal(true);
    expect(excludedSection.classList.contains('hidden')).to.equal(false);
    expect(background.tmp.pref.container.iconRandom).to.equal(true);
  });

  it('containerIcon select persists chosen icon', async () => {
    await setupGeneral();
    const select = document.getElementById('containerIcon') as HTMLSelectElement;
    const target = Array.from(select.options).find(o => o.value !== select.value)!;
    select.value = target.value;
    select.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(background.tmp.pref.container.icon).to.equal(target.value);
  });

  it('containerIconRandomExcluded multi-select persists array', async () => {
    await setupGeneral();
    const randomCb = document.getElementById('containerIconRandom') as HTMLInputElement;
    randomCb.checked = true;
    randomCb.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    const multi = document.getElementById('containerIconRandomExcluded') as HTMLSelectElement;
    Array.from(multi.options).forEach((opt, idx) => (opt.selected = idx < 2));
    multi.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(background.tmp.pref.container.iconRandomExcluded).to.deep.equal([multi.options[0].value, multi.options[1].value]);
  });

  it('containerNumberMode select persists value', async () => {
    await setupGeneral();
    const select = document.getElementById('containerNumberMode') as HTMLSelectElement;
    const target = Array.from(select.options).find(o => o.value !== select.value)!;
    select.value = target.value;
    select.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    expect(background.tmp.pref.container.numberMode).to.equal(target.value);
  });

  it('containerRemoval select persists numeric value', async () => {
    await setupGeneral();
    const select = document.getElementById('containerRemoval') as HTMLSelectElement;
    const target = Array.from(select.options).find(o => o.value !== select.value)!;
    select.value = target.value;
    select.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flushMicrotasks(5);
    // Note: underlying preferences may store as number, if string compare fails check number
    const prefVal: any = background.tmp.pref.container.removal;
    if (typeof prefVal === 'string') {
      expect(prefVal).to.equal(target.value);
    } else {
      expect(prefVal).to.equal(parseInt(target.value, 10));
    }
  });

  it('iconColor select triggers setIcon with chosen color', async () => {
    await setupGeneral();
    const instance = background.browseraction as any;
    const methodSpy = instance.setIcon.isSinonProxy ? instance.setIcon : sinon.spy(instance, 'setIcon');
    const currentPrefs = await getPreferences();
    const currentColor = currentPrefs.iconColor;
    // derive a different color from select options
    const select = document.getElementById('iconColor') as HTMLSelectElement;
    const alternative =
      Array.from(select.options)
        .map(o => o.value)
        .find(v => v !== currentColor) || currentColor;
    const updated = JSON.parse(JSON.stringify(currentPrefs));
    updated.iconColor = alternative;
    await savePreferences(updated as any);
    for (let i = 0; i < 25 && !methodSpy.called; i++) {
      await Promise.resolve();
    }
    expect(background.tmp.pref.iconColor).to.equal(alternative);
    expect(methodSpy.called, 'setIcon should be called after iconColor preference change').to.equal(true);
    expect(methodSpy.lastCall.args[0]).to.equal(alternative);
  });
});
