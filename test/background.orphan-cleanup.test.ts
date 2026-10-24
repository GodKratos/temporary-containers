import { expect, loadBackground, nextTick } from './setup';

describe('Orphan Container Cleanup', () => {
  describe('Container.buildOrphanNameMatcher', () => {
    it('returns null when namePrefix contains %domain%', async () => {
      const { tmp: background } = await loadBackground();
      background.storage.local.preferences.container.namePrefix = 'tmp-%domain%';
      expect(background.container.buildOrphanNameMatcher()).to.equal(null);
    });

    it('returns null when namePrefix contains %fulldomain%', async () => {
      const { tmp: background } = await loadBackground();
      background.storage.local.preferences.container.namePrefix = 'tmp-%fulldomain%';
      expect(background.container.buildOrphanNameMatcher()).to.equal(null);
    });

    it('matches generated names for a static prefix', async () => {
      const { tmp: background } = await loadBackground();
      background.storage.local.preferences.container.namePrefix = 'tmp';
      const matcher = background.container.buildOrphanNameMatcher();
      expect(matcher).to.not.equal(null);
      expect(matcher!.test('tmp12')).to.be.true;
      expect(matcher!.test('tmp')).to.be.true;
      expect(matcher!.test('tmp3-deletes-history')).to.be.true;
      expect(matcher!.test('work')).to.be.false;
      expect(matcher!.test('other12')).to.be.false;
    });

    it('falls back to matching literal "tmp" when namePrefix is empty and numberMode is hide', async () => {
      const { tmp: background } = await loadBackground();
      background.storage.local.preferences.container.namePrefix = '   ';
      background.storage.local.preferences.container.numberMode = 'hide';
      const matcher = background.container.buildOrphanNameMatcher();
      expect(matcher).to.not.equal(null);
      expect(matcher!.test('tmp')).to.be.true;
    });

    it('returns null when namePrefix is empty and numberMode is not hide', async () => {
      const { tmp: background } = await loadBackground();
      background.storage.local.preferences.container.namePrefix = '';
      background.storage.local.preferences.container.numberMode = 'keep';
      expect(background.container.buildOrphanNameMatcher()).to.equal(null);
    });
  });

  describe('Cleanup.cleanup orphan sweep', () => {
    it('removes an untracked orphan container with no open tabs', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      await background.cleanup.cleanup();
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnceWith('firefox-tmp7');
      expect(background.storage.local.tempContainers['firefox-tmp7']).to.equal(undefined);
    });

    it('skips an untracked orphan container that still has open tabs', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([{ id: 1 }]);

      await background.cleanup.cleanup();
      await nextTick();

      browser.contextualIdentities.remove.should.not.have.been.called;
    });

    it('never touches an untracked container whose name does not match the pattern', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-container-1', name: 'Work' }]);
      browser.tabs.query.resolves([]);

      await background.cleanup.cleanup();
      await nextTick();

      browser.contextualIdentities.remove.should.not.have.been.called;
    });

    it('does not sweep orphans when the preference is disabled', async () => {
      const { tmp: background, browser } = await loadBackground();
      background.storage.local.preferences.container.orphanSweep.active = false;
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.resolves([]);

      await background.cleanup.cleanup();
      await nextTick();

      browser.contextualIdentities.remove.should.not.have.been.called;
    });
  });

  describe('automatic orphan sweep (folded into the regular periodic cleanup)', () => {
    it('defaults to active', async () => {
      const { tmp: background } = await loadBackground();
      expect(background.storage.local.preferences.container.orphanSweep.active).to.equal(true);
    });

    it('sweeps orphans as part of the regular periodic cleanup interval when active (default)', async () => {
      const { browser, clock } = await loadBackground();
      browser.contextualIdentities.query.resolves([]);

      // Cleanup.constructor sets up a single 10-minute interval that now
      // covers both tracked-container cleanup and, when enabled, the orphan
      // sweep - there is no separate orphan-sweep scheduler anymore.
      clock.tick(600000);
      await nextTick();

      browser.contextualIdentities.query.should.have.been.called;
    });

    it('does not sweep orphans during periodic cleanup when the preference is turned off', async () => {
      const { tmp: background, browser, clock } = await loadBackground();
      background.storage.local.preferences.container.orphanSweep.active = false;
      browser.contextualIdentities.query.resolves([]);

      clock.tick(600000);
      await nextTick();

      browser.contextualIdentities.query.should.not.have.been.called;
    });
  });

  describe('runtime.onStartup', () => {
    it('sweeps orphans 10s after startup when the preference is active (default)', async () => {
      const { tmp: background, browser, clock } = await loadBackground();
      browser.contextualIdentities.query.resolves([]);
      browser.tabs.query.withArgs({ url: 'about:sessionrestore' }).resolves([]);

      await background.runtime.onStartup();
      browser.contextualIdentities.query.should.not.have.been.called;

      clock.tick(10000);
      await nextTick();
      browser.contextualIdentities.query.should.have.been.called;
    });

    it('does not sweep orphans on startup when the preference is inactive', async () => {
      const { tmp: background, browser, clock } = await loadBackground();
      background.storage.local.preferences.container.orphanSweep.active = false;
      browser.contextualIdentities.query.resolves([]);
      browser.tabs.query.withArgs({ url: 'about:sessionrestore' }).resolves([]);

      await background.runtime.onStartup();
      clock.tick(10000);
      await nextTick();

      browser.contextualIdentities.query.should.not.have.been.called;
    });

    it('bails out of cleanup (including the orphan sweep) if an about:sessionrestore tab is open', async () => {
      const { tmp: background, browser, clock } = await loadBackground();
      browser.tabs.query.withArgs({ url: 'about:sessionrestore' }).resolves([{ id: 2, url: 'about:sessionrestore' }]);
      browser.contextualIdentities.query.resolves([]);

      await background.runtime.onStartup();
      clock.tick(10000);
      await nextTick();

      browser.contextualIdentities.query.should.not.have.been.called;
    });
  });
});
