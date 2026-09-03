import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { History } from './history';
import { delay, PQueue } from './lib';
import { Statistics } from './statistics';
import { Storage } from './storage';
import { PreferencesSchema, CookieStoreId, Permissions, Debug, OrphanSweepResult } from '~/types';
import { Tabs } from './tabs';

export class Cleanup {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private storage!: Storage;
  private container!: Container;
  private history!: History;
  private statistics!: Statistics;
  private permissions!: Permissions;
  private tabs!: Tabs;

  private queued = new Set();
  private queue = new PQueue({ concurrency: 1 });
  // Containers currently waiting out their pre-queue removal delay, keyed by
  // cookieStoreId, with a resolver that skips the rest of that wait. Lets an
  // explicit "clean up now" call expedite a container that automatic cleanup
  // (tabs.onRemoved) already queued but is still delaying.
  private pendingDelayResolvers = new Map<CookieStoreId, () => void>();

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;

    setInterval(() => {
      this.debug('[interval] container cleanup interval');
      this.cleanup();
    }, 600000);
  }

  initialize(): void {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.history = this.background.history;
    this.statistics = this.background.statistics;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;
  }

  async addToRemoveQueue(cookieStoreId: CookieStoreId, skipDelay = false, tracked = true): Promise<void> {
    if (this.queued.has(cookieStoreId)) {
      if (skipDelay) {
        const resolvePendingDelay = this.pendingDelayResolvers.get(cookieStoreId);
        if (resolvePendingDelay) {
          this.debug('[addToRemoveQueue] container already in queue, expediting its removal delay', cookieStoreId);
          resolvePendingDelay();
        } else {
          this.debug('[addToRemoveQueue] container already in queue', cookieStoreId);
        }
      } else {
        this.debug('[addToRemoveQueue] container already in queue', cookieStoreId);
      }
      return;
    }
    this.queued.add(cookieStoreId);

    const containerRemovalDelay = tracked ? this.container.getRemovalDelay(cookieStoreId) : 0;
    if (containerRemovalDelay && !skipDelay) {
      this.debug('[addToRemoveQueue] waiting before adding container removal to queue', containerRemovalDelay, cookieStoreId);
      await new Promise<void>(resolve => {
        this.pendingDelayResolvers.set(cookieStoreId, resolve);
        setTimeout(resolve, containerRemovalDelay);
      });
      this.pendingDelayResolvers.delete(cookieStoreId);
    }

    this.debug('[addToRemoveQueue] queuing container removal', cookieStoreId);

    await this.queue
      .add(async () => {
        const containerRemoved = await this.tryToRemove(cookieStoreId, tracked);
        if (containerRemoved) {
          this.debug('[addToRemoveQueue] container removed, waiting 2s', cookieStoreId);
          await delay(2500);
        }
      })
      .finally(() => {
        this.queued.delete(cookieStoreId);

        if (this.queue.pending) {
          return;
        }

        this.debug('[addToRemoveQueue] queue empty');
        this.statistics.finish();
        this.container.cleanupNumbers();
      });
  }

  async tryToRemove(cookieStoreId: CookieStoreId, tracked = true): Promise<boolean> {
    const containerTabs = this.tabs.containerTabs.get(cookieStoreId);
    if (containerTabs?.size) {
      this.debug('[tryToRemove] not removing container because it still has tabs', cookieStoreId, containerTabs.size);
      return false;
    }

    const historyClearedCount = tracked ? this.history.maybeClearHistory(cookieStoreId) : 0;
    this.statistics.update(historyClearedCount, cookieStoreId);
    if (tracked) {
      this.container.cleanupNumber(cookieStoreId);
    }

    if (!(await this.removeContainer(cookieStoreId, tracked))) {
      if (tracked) {
        await this.storage.persist();
      }
    }
    return true;
  }

  async removeContainer(cookieStoreId: CookieStoreId, updateStorage = true): Promise<boolean> {
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId);
      if (!contextualIdentity) {
        this.debug('[removeContainer] couldnt find container to remove, probably already removed', cookieStoreId);
      } else {
        this.debug('[removeContainer] container removed', cookieStoreId);
      }
      if (updateStorage) {
        await this.container.removeFromStorage(cookieStoreId);
      }
      return true;
    } catch (error) {
      this.debug('[removeContainer] error while removing container', cookieStoreId, error);
      return false;
    }
  }

  async cleanup(startup = false, forceImmediate = false): Promise<OrphanSweepResult> {
    const emptyResult: OrphanSweepResult = { removedTracked: 0, removedOrphans: 0, skippedHasTabs: 0 };
    if (startup && (await browser.tabs.query({ url: 'about:sessionrestore' })).length) {
      this.debug("[cleanup] canceling because there's a about:sessionrestore tab");
      return emptyResult;
    }

    let removedTracked = 0;
    let skippedHasTabs = 0;
    for (const cookieStoreId of this.container.getAllIds()) {
      let tabsInContainer;
      try {
        tabsInContainer = await browser.tabs.query({ cookieStoreId });
      } catch (error) {
        this.debug('[cleanup] failed tabs query', cookieStoreId, error);
        continue;
      }
      if (tabsInContainer.length) {
        skippedHasTabs++;
        continue;
      }
      removedTracked++;
      // Fire-and-forget: queuing (and the pacing delay between successive
      // removals) happens in the background; the counts below are computed
      // from the fresh pre-check, not a post-hoc confirmation, so callers
      // get a prompt result instead of waiting out the queue's pacing delay.
      this.addToRemoveQueue(cookieStoreId, startup || forceImmediate).catch(error =>
        this.debug('[cleanup] error while queuing container removal', cookieStoreId, error)
      );
    }

    // Orphan sweep runs regardless of whether any tracked containers exist -
    // e.g. a fresh profile with containers synced in from another device via
    // Firefox Container Sync may have no tracked containers at all.
    let removedOrphans = 0;
    if (this.pref.container.orphanSweep.active) {
      const { candidates: orphanIds, skippedHasTabs: orphanSkipped } = await this.findOrphanContainers();
      skippedHasTabs += orphanSkipped;
      removedOrphans = orphanIds.length;
      orphanIds.forEach(cookieStoreId =>
        this.addToRemoveQueue(cookieStoreId, true, false).catch(error =>
          this.debug('[cleanup] error while queuing orphan container removal', cookieStoreId, error)
        )
      );
    }

    const result = { removedTracked, removedOrphans, skippedHasTabs };
    this.debug('[cleanup] queued containers for removal', result);
    return result;
  }

  async cleanupNow(): Promise<OrphanSweepResult> {
    return this.cleanup(false, true);
  }

  private async findOrphanContainers(): Promise<{ candidates: CookieStoreId[]; skippedHasTabs: number }> {
    const matcher = this.container.buildOrphanNameMatcher();
    if (!matcher) {
      return { candidates: [], skippedHasTabs: 0 };
    }

    let allContainers: any[];
    try {
      // @ts-ignore
      allContainers = await browser.contextualIdentities.query({});
    } catch (error) {
      this.debug('[findOrphanContainers] failed to query contextualIdentities', error);
      return { candidates: [], skippedHasTabs: 0 };
    }
    if (!Array.isArray(allContainers)) {
      return { candidates: [], skippedHasTabs: 0 };
    }

    const candidates: CookieStoreId[] = [];
    let skippedHasTabs = 0;
    for (const identity of allContainers) {
      const cookieStoreId = identity.cookieStoreId;
      if (cookieStoreId === `${this.background.containerPrefix}-default`) {
        continue;
      }
      if (this.container.isTemporary(cookieStoreId)) {
        continue;
      }
      if (!matcher.test(identity.name)) {
        continue;
      }
      let tabsInContainer;
      try {
        tabsInContainer = await browser.tabs.query({ cookieStoreId });
      } catch (error) {
        this.debug('[findOrphanContainers] failed tabs query', cookieStoreId, error);
        continue;
      }
      if (tabsInContainer.length) {
        this.debug(
          '[findOrphanContainers] skipping orphan candidate, browser reports open tabs',
          cookieStoreId,
          identity.name,
          tabsInContainer.map(tab => ({ id: tab.id, windowId: tab.windowId, discarded: tab.discarded, url: tab.url }))
        );
        skippedHasTabs++;
        continue;
      }
      this.debug('[findOrphanContainers] found orphan candidate with no open tabs', cookieStoreId, identity.name);
      candidates.push(cookieStoreId);
    }
    return { candidates, skippedHasTabs };
  }

  maybeShowNotification(message: string): void {
    if (!this.pref.notifications || !this.permissions.notifications) {
      return;
    }

    this.debug('[maybeShowNotification] showing notification');

    // Guard against missing optional permission (notifications is optional in manifest).
    if (!browser.notifications || typeof browser.notifications.create !== 'function') {
      this.debug('[maybeShowNotification] notifications API unavailable - permission likely not granted');
      return;
    }

    browser.notifications.create({
      type: 'basic',
      title: 'Temporary Containers',
      iconUrl: 'icons/page-w-32.svg',
      message,
    });
  }
}
