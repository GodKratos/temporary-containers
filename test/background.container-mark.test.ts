import { sinon, expect, loadBackground } from './setup';
import { CONTAINER_MARK } from '~/shared';

describe('container mark (%NEW_TEMP_CONTAINER%)', () => {
  it('should convert a container created with the marker name into a temp container', async () => {
    const { browser, tmp: background } = await loadBackground();

    const fakeCookieStoreId = 'firefox-container-mark-1';

    browser.contextualIdentities.update.resolves({
      cookieStoreId: fakeCookieStoreId,
      name: 'tmp1',
      color: 'blue',
      icon: 'fingerprint',
    });

    // Simulate external creation of a container named %NEW_TEMP_CONTAINER%
    const [promise] = browser.contextualIdentities.onCreated.addListener.yield({
      contextualIdentity: {
        cookieStoreId: fakeCookieStoreId,
        name: CONTAINER_MARK,
        color: 'toolbar',
        icon: 'fingerprint',
      },
    }) as unknown as any[];
    await promise;

    // Should have called update to rename the container
    browser.contextualIdentities.update.should.have.been.calledOnce;
    const [updateId, updateDetails] = browser.contextualIdentities.update.firstCall.args;
    expect(updateId).to.equal(fakeCookieStoreId);
    expect(updateDetails.name).to.not.equal(CONTAINER_MARK);
    expect(updateDetails.name).to.be.a('string');
    expect(updateDetails.color).to.be.a('string');
    expect(updateDetails.icon).to.be.a('string');

    // Should be tracked as a temporary container
    expect(background.storage.local.tempContainers[fakeCookieStoreId]).to.exist;
    expect(background.storage.local.tempContainers[fakeCookieStoreId].clean).to.be.true;
  });

  it('should ignore containers created with regular names', async () => {
    const { browser } = await loadBackground();

    const [promise] = browser.contextualIdentities.onCreated.addListener.yield({
      contextualIdentity: {
        cookieStoreId: 'firefox-container-regular-1',
        name: 'My Personal Container',
        color: 'blue',
        icon: 'fingerprint',
      },
    }) as unknown as any[];
    await promise;

    // Should NOT have called update
    browser.contextualIdentities.update.should.not.have.been.called;
  });

  it('should ignore containers with names that contain but do not exactly match the marker', async () => {
    const { browser } = await loadBackground();

    const [promise] = browser.contextualIdentities.onCreated.addListener.yield({
      contextualIdentity: {
        cookieStoreId: 'firefox-container-partial-1',
        name: `prefix-${CONTAINER_MARK}-suffix`,
        color: 'blue',
        icon: 'fingerprint',
      },
    }) as unknown as any[];
    await promise;

    browser.contextualIdentities.update.should.not.have.been.called;
  });
});
