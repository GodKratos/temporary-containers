import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { History } from './history';
import { delay, PQueue } from './lib';
import { Statistics } from './statistics';
import { Storage } from './storage';
import { PreferencesSchema, CookieStoreId, Permissions, Debug } from '~/types';
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
      this.debug('[addToRemoveQueue] container already in queue', cookieStoreId);
      return;
    }
    this.queued.add(cookieStoreId);

    const containerRemovalDelay = tracked ? this.container.getRemovalDelay(cookieStoreId) : 0;
    if (containerRemovalDelay && !skipDelay) {
      this.debug('[addToRemoveQueue] waiting before adding container removal to queue', containerRemovalDelay, cookieStoreId);
      await delay(containerRemovalDelay);
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

  async cleanup(startup = false): Promise<void> {
    if (startup && (await browser.tabs.query({ url: 'about:sessionrestore' })).length) {
      this.debug("[cleanup] canceling because there's a about:sessionrestore tab");
      return;
    }

    this.container.getAllIds().map(cookieStoreId => this.addToRemoveQueue(cookieStoreId, startup));

    // Orphans are containers synced in from another profile via Firefox
    // Container Sync, which never made it into storage.local.tempContainers.
    // They're swept independently of whether any tracked containers exist.
    if (this.pref.container.orphanSweep.active) {
      const orphanIds = await this.findOrphanContainers();
      this.debug('[cleanup] queuing orphaned containers for removal', orphanIds);
      orphanIds.forEach(cookieStoreId =>
        this.addToRemoveQueue(cookieStoreId, true, false).catch(error =>
          this.debug('[cleanup] error while queuing orphan container removal', cookieStoreId, error)
        )
      );
    }
  }

  private async findOrphanContainers(): Promise<CookieStoreId[]> {
    const matcher = this.container.buildOrphanNameMatcher();
    if (!matcher) {
      return [];
    }

    let allContainers: any[];
    try {
      // @ts-ignore
      allContainers = await browser.contextualIdentities.query({});
    } catch (error) {
      this.debug('[findOrphanContainers] failed to query contextualIdentities', error);
      return [];
    }
    if (!Array.isArray(allContainers)) {
      return [];
    }

    const candidates: CookieStoreId[] = [];
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
        continue;
      }
      this.debug('[findOrphanContainers] found orphan candidate with no open tabs', cookieStoreId, identity.name);
      candidates.push(cookieStoreId);
    }
    return candidates;
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
