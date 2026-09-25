import { loadBackground, sinon } from './setup';
import { expect } from 'chai';

describe('Convert: regular <-> deletes history temp container', () => {
  it('converts a regular temp container into a "Deletes History" container when history permission is granted', async () => {
    const background = await loadBackground({ initialize: true });
    background.tmp.permissions.history = true;
    background.tmp.storage.local.tempContainers['firefox-container-1'] = {
      name: 'tmp1',
      color: 'blue',
      icon: 'fingerprint',
      number: 1,
      clean: true,
    } as any;

    await background.tmp.convert.convertTempContainerToDeletesHistory({
      cookieStoreId: 'firefox-container-1',
      tabId: 1,
    });

    const container = background.tmp.storage.local.tempContainers['firefox-container-1'];
    expect(container.deletesHistory).to.equal(true);
    expect(container.name).to.equal('tmp1-deletes-history');
    expect(background.browser.contextualIdentities.update).to.have.been.calledWith('firefox-container-1', {
      name: 'tmp1-deletes-history',
    });
    expect(background.browser.tabs.reload).to.have.been.calledWith(1);
  });

  it('does not convert without the history permission', async () => {
    const background = await loadBackground({ initialize: true });
    background.tmp.permissions.history = false;
    background.tmp.storage.local.tempContainers['firefox-container-1'] = {
      name: 'tmp1',
      color: 'blue',
      icon: 'fingerprint',
      number: 1,
      clean: true,
    } as any;

    await background.tmp.convert.convertTempContainerToDeletesHistory({
      cookieStoreId: 'firefox-container-1',
      tabId: 1,
    });

    const container = background.tmp.storage.local.tempContainers['firefox-container-1'];
    expect(container.deletesHistory).to.not.equal(true);
    expect(container.name).to.equal('tmp1');
    expect(background.browser.contextualIdentities.update as sinon.SinonStub).to.not.have.been.called;
  });

  it('round-trips regular -> deletes history -> regular without accumulating name suffixes', async () => {
    const background = await loadBackground({ initialize: true });
    background.tmp.permissions.history = true;
    background.tmp.storage.local.tempContainers['firefox-container-1'] = {
      name: 'tmp1',
      color: 'blue',
      icon: 'fingerprint',
      number: 1,
      clean: true,
    } as any;

    await background.tmp.convert.convertTempContainerToDeletesHistory({
      cookieStoreId: 'firefox-container-1',
      tabId: 1,
    });
    await background.tmp.convert.convertDeletesHistoryToTempContainer({
      cookieStoreId: 'firefox-container-1',
      tabId: 1,
    });
    await background.tmp.convert.convertTempContainerToDeletesHistory({
      cookieStoreId: 'firefox-container-1',
      tabId: 1,
    });

    const container = background.tmp.storage.local.tempContainers['firefox-container-1'];
    expect(container.name).to.equal('tmp1-deletes-history');
  });
});
