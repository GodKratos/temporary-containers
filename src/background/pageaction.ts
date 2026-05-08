import { TemporaryContainers } from './tmp';
import { Storage } from './storage';
import { PreferencesSchema, ProxyEntry, Tab } from '~/types';

export class PageAction {
  private background: TemporaryContainers;
  private pref!: PreferencesSchema;
  private storage!: Storage;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  initialize(): void {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
  }

  async showOrHide(activatedTab?: Tab): Promise<void> {
    if (!activatedTab) {
      const [activeTab] = (await browser.tabs.query({
        currentWindow: true,
        active: true,
      })) as Tab[];
      activatedTab = activeTab;
    }

    let color;
    if (!this.background.isolation.getActiveState()) {
      color = 'warning-red';
    } else if (activatedTab.cookieStoreId === `${this.background.containerPrefix}-default`) {
      color = 'gray';
    } else if (
      this.storage.local.tempContainers[activatedTab.cookieStoreId] &&
      this.storage.local.tempContainers[activatedTab.cookieStoreId].color
    ) {
      color = this.storage.local.tempContainers[activatedTab.cookieStoreId].color;
    } else {
      try {
        const container = await browser.contextualIdentities.get(activatedTab.cookieStoreId);
        color = container.color;
      } catch (_error) {
        color = 'gray';
      }
    }
    if (activatedTab?.id) {
      browser.pageAction.setIcon({
        path: {
          '19': `icons/pageaction-${color}-19.svg`,
          '38': `icons/pageaction-${color}-38.svg`,
        },
        tabId: activatedTab.id,
      });

      let pageTitle = '';
      const containerOpts = this.storage.local.tempContainers[activatedTab.cookieStoreId];
      if (containerOpts?.proxyId && this.background.permissions.proxy && this.pref.proxies?.active) {
        const proxy = this.pref.proxies.entries.find((e: ProxyEntry) => e.id === containerOpts.proxyId && e.enabled);
        if (proxy) {
          const label = proxy.label || `${proxy.host}:${proxy.port}`;
          pageTitle = `Proxy: ${label} (${proxy.protocol.toUpperCase()})`;
        }
      }
      browser.pageAction.setTitle({ tabId: activatedTab.id, title: pageTitle });
      browser.browserAction.setTitle({ tabId: activatedTab.id, title: pageTitle });

      if (!this.pref.pageAction) {
        browser.pageAction.hide(activatedTab.id);
      } else {
        browser.pageAction.show(activatedTab.id);
      }
    }
  }
}
