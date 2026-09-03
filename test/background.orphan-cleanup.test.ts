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

  describe('Cleanup.cleanupNow (manual "clean up now" action)', () => {
    it('removes an untracked orphan container with no open tabs', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const result = await background.cleanup.cleanupNow();
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnceWith('firefox-tmp7');
      expect(background.storage.local.tempContainers['firefox-tmp7']).to.equal(undefined);
      expect(result.removedOrphans).to.equal(1);
      expect(result.removedTracked).to.equal(0);
    });

    it('skips an untracked orphan container that still has open tabs', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([{ id: 99 }]);

      const result = await background.cleanup.cleanupNow();

      browser.contextualIdentities.remove.should.not.have.been.called;
      expect(result.skippedHasTabs).to.equal(1);
      expect(result.removedOrphans).to.equal(0);
    });

    it('never touches an untracked container whose name does not match the pattern', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-work', name: 'work-stuff' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-work' }).resolves([]);

      const result = await background.cleanup.cleanupNow();

      browser.contextualIdentities.remove.should.not.have.been.called;
      expect(result.removedOrphans).to.equal(0);
      expect(result.skippedHasTabs).to.equal(0);
    });

    it('does not sweep orphans when the preference is disabled', async () => {
      const { tmp: background, browser } = await loadBackground();
      background.storage.local.preferences.container.orphanSweep.active = false;
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([]);

      const result = await background.cleanup.cleanupNow();

      browser.contextualIdentities.query.should.not.have.been.called;
      browser.contextualIdentities.remove.should.not.have.been.called;
      expect(result.removedOrphans).to.equal(0);
    });

    it('removes an empty tracked container instantly, bypassing the removal delay', async () => {
      const { tmp: background, browser, helper } = await loadBackground();
      background.storage.local.preferences.container.removal = 900000;
      await helper.openNewTmpTab({ createsTabId: 2, createsContainer: 'firefox-tmp1' });

      browser.contextualIdentities.query.resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp1' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const result = await background.cleanup.cleanupNow();
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnceWith('firefox-tmp1');
      expect(result.removedTracked).to.equal(1);
    });

    it('skips a tracked container that still has open tabs', async () => {
      const { tmp: background, browser, helper } = await loadBackground();
      await helper.openNewTmpTab({ createsTabId: 2, createsContainer: 'firefox-tmp1' });

      browser.contextualIdentities.query.resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp1' }).resolves([{ id: 2 }]);

      const result = await background.cleanup.cleanupNow();

      browser.contextualIdentities.remove.should.not.have.been.called;
      expect(result.removedTracked).to.equal(0);
      expect(result.skippedHasTabs).to.equal(1);
    });

    it('expedites a container already queued by the automatic removal delay, instead of silently no-opping', async () => {
      const { tmp: background, browser, helper, clock } = await loadBackground();
      background.storage.local.preferences.container.removal = 900000;
      await helper.openNewTmpTab({ createsTabId: 2, createsContainer: 'firefox-tmp1' });

      browser.contextualIdentities.query.resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp1' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      // Tab closes: this is what actually happens first in real usage - the
      // automatic removal path (tabs.onRemoved -> addToRemoveQueue) queues the
      // container and starts waiting out the full 15-minute removal delay.
      browser.tabs.onRemoved.addListener.yield(2);
      await nextTick();
      browser.contextualIdentities.remove.should.not.have.been.called;

      // User clicks "Clean up empty temporary containers" well before that
      // delay elapses. It must expedite the already-queued removal instead of
      // silently no-opping because the container is already marked "queued".
      const result = await background.cleanup.cleanupNow();
      expect(result.removedTracked).to.equal(1);
      await clock.tickAsync(3000);

      browser.contextualIdentities.remove.should.have.been.calledOnceWith('firefox-tmp1');
    });

    it('removes every container in a multi-container batch, not just the first', async () => {
      const { tmp: background, browser, helper, clock } = await loadBackground();
      await helper.openNewTmpTab({ tabId: 1, createsTabId: 2, createsContainer: 'firefox-tmp1' });
      await helper.openNewTmpTab({ tabId: 1, createsTabId: 3, createsContainer: 'firefox-tmp2' });
      await helper.openNewTmpTab({ tabId: 1, createsTabId: 4, createsContainer: 'firefox-tmp3' });

      browser.contextualIdentities.query.resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp1' }).resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp2' }).resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp3' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const result = await background.cleanup.cleanupNow();
      expect(result.removedTracked).to.equal(3);

      // The shared PQueue (concurrency 1) processes removals one at a time with a
      // 2.5s pacing delay after each success before starting the next, so a 3-item
      // batch needs the fake clock fully drained, not just a single tick/nextTick.
      await clock.tickAsync(3 * 2500 + 1000);

      browser.contextualIdentities.remove.should.have.been.calledWith('firefox-tmp1');
      browser.contextualIdentities.remove.should.have.been.calledWith('firefox-tmp2');
      browser.contextualIdentities.remove.should.have.been.calledWith('firefox-tmp3');
      expect(browser.contextualIdentities.remove.callCount).to.equal(3);
    });

    it('reports a combined tracked + orphan sweep result', async () => {
      const { tmp: background, browser, helper } = await loadBackground();
      await helper.openNewTmpTab({ createsTabId: 2, createsContainer: 'firefox-tmp1' });

      browser.contextualIdentities.query.resolves([
        { cookieStoreId: 'firefox-tmp7', name: 'tmp7' },
        { cookieStoreId: 'firefox-tmp8', name: 'tmp8' },
        { cookieStoreId: 'firefox-work', name: 'work-stuff' },
      ]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp1' }).resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp8' }).resolves([{ id: 42 }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-work' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const result = await background.cleanup.cleanupNow();

      expect(result).to.deep.equal({ removedTracked: 1, removedOrphans: 1, skippedHasTabs: 1 });
    });
  });

  describe('runtime.onMessage cleanupEmptyTemporaryContainers', () => {
    it('resolves with the cleanupNow result', async () => {
      const { tmp: background, browser } = await loadBackground();
      browser.contextualIdentities.query.resolves([{ cookieStoreId: 'firefox-tmp7', name: 'tmp7' }]);
      browser.tabs.query.withArgs({ cookieStoreId: 'firefox-tmp7' }).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const result = await background.runtime.onMessage({ method: 'cleanupEmptyTemporaryContainers' } as any, {});

      expect(result).to.deep.equal({ removedTracked: 0, removedOrphans: 1, skippedHasTabs: 0 });
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
