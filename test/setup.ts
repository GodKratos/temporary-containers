const preferencesTestSet = [
  {
    automaticMode: {
      active: false,
      newTab: 'created',
    },
  },
  {
    automaticMode: {
      active: true,
      newTab: 'created',
    },
  },
  {
    automaticMode: {
      active: true,
      newTab: 'navigation',
    },
  },
  {
    automaticMode: {
      active: false,
      newTab: 'navigation',
    },
  },
];

if (!process.listenerCount('unhandledRejection')) {
  process.on('unhandledRejection', r => {
    console.log('unhandledRejection', r);
  });
}

import * as chai from 'chai';
import chaiDeepMatch from 'chai-deep-match';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import jsdom from 'jsdom';
import { TemporaryContainers } from '~/background/tmp';
import { Helper } from './helper';
import { createBrowserMock, enhanceBrowserMock, BrowserMock } from './browser-mock';

// Global redirect registry used by helper _registerRedirects to simulate webRequest redirect chains
const redirectRegistry = new Map<string, string[]>();

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', console.error);
virtualConsole.on('warn', console.warn);
virtualConsole.on('info', console.info);
virtualConsole.on('log', console.log);
virtualConsole.on('jsdomError', error => {
  console.error(error);
});

const browser = enhanceBrowserMock(createBrowserMock());

const fakeBrowser = (): {
  browser: BrowserMock;
  clock: sinon.SinonFakeTimers;
} => {
  // Restore any existing fake timers before creating new ones
  if (sinon.clock && typeof sinon.clock.restore === 'function') {
    sinon.clock.restore();
  }

  const clock = sinon.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    now: new Date(),
  });
  const html = '<!DOCTYPE html><html><head></head><body></body></html>';

  const dom = new jsdom.JSDOM(html, {
    url: 'https://localhost',
    virtualConsole,
  });
  const window = dom.window as jsdom.DOMWindow;

  global.document = window.document;
  // FIXME

  // @ts-ignore
  global.window = window;
  global.AbortController = window.AbortController;

  browser.sinonSandbox.reset();
  // FIXME

  // @ts-ignore
  global.browser = browser;

  global.window._mochaTest = true;

  // Setup default return values for stubs that need them
  (global.browser.tabs.query as sinon.SinonStub).callsFake((queryInfo = {}) => {
    // If looking for active tab, return the most recently created tab or a default one
    if (queryInfo.active === true || queryInfo.currentWindow === true) {
      const allTabs = Array.from(tabRegistry.values());
      if (allTabs.length > 0) {
        // Return the most recently created tab as the "active" one
        const activeTab = allTabs[allTabs.length - 1];
        return Promise.resolve([{ ...activeTab, active: true }]);
      } else {
        // Return a default active tab if no tabs are registered yet
        const defaultActiveTab = {
          id: 1,
          cookieStoreId: 'firefox-default',
          url: 'https://example.com',
          active: true,
        };
        return Promise.resolve([defaultActiveTab]);
      }
    }
    // If no specific filters, return all tabs (used during initialization)
    if (!Object.keys(queryInfo).length) {
      return Promise.resolve(Array.from(tabRegistry.values()));
    }
    return Promise.resolve([]);
  });

  // Implement remove to keep internal registry in sync (important for tests relying on tab enumeration)
  (global.browser.tabs.remove as sinon.SinonStub).callsFake(async (tabId: number | number[]) => {
    const ids = Array.isArray(tabId) ? tabId : [tabId];
    for (const id of ids) {
      tabRegistry.delete(id);
      const onRemoved = global.browser.tabs.onRemoved.addListener as any;
      if (onRemoved && onRemoved.yield) {
        onRemoved.yield(id, { isWindowClosing: false });
      }
    }
    return Promise.resolve();
  });
  (global.browser.runtime.getManifest as sinon.SinonStub).returns({
    version: '0.1',
  });
  (global.browser.runtime.getBrowserInfo as sinon.SinonStub).resolves({
    name: 'Firefox',
    version: 67,
  });
  (global.browser.permissions.getAll as sinon.SinonStub).resolves({
    permissions: [],
  });
  (global.browser.management.getAll as sinon.SinonStub).resolves([
    {
      id: '@testpilot-containers',
      enabled: true,
      version: '6.0.0',
    },
  ]);

  // Setup default container creation mocks with an internal registry so that
  // browser.contextualIdentities.get returns previously created identities.
  const containerRegistry = new Map<string, any>();
  let containerCounter = 1;
  (global.browser.contextualIdentities.create as sinon.SinonStub).callsFake((details = {}) => {
    const cookieStoreId = `firefox-container-${containerCounter++}`;
    const identity = {
      cookieStoreId,
      name: (details as any).name || `tmp${containerCounter - 1}`,
      color: (details as any).color || 'toolbar',
      icon: (details as any).icon || 'fingerprint',
    };
    containerRegistry.set(cookieStoreId, identity);
    return Promise.resolve(identity);
  });
  (global.browser.contextualIdentities.get as sinon.SinonStub).callsFake((cookieStoreId: string) => {
    let identity = containerRegistry.get(cookieStoreId);
    if (!identity && (global as any).window?.tmp?.storage?.local?.tempContainers) {
      // Attempt to reconstruct identity from extension storage for temp containers
      const stored = (global as any).window.tmp.storage.local.tempContainers[cookieStoreId];
      if (stored) {
        identity = {
          cookieStoreId,
          name: stored.name,
          color: stored.color || 'toolbar',
          icon: stored.icon || 'fingerprint',
        };
        containerRegistry.set(cookieStoreId, identity);
      }
    }
    if (!identity) {
      // As a last resort, synthesize an identity for temporary containers if storage knows about it
      if ((global as any).window?.tmp?.storage?.local?.tempContainers?.[cookieStoreId]) {
        const stored = (global as any).window.tmp.storage.local.tempContainers[cookieStoreId];
        identity = {
          cookieStoreId,
          name: stored.name,
          color: stored.color || 'toolbar',
          icon: stored.icon || 'fingerprint',
        };
        containerRegistry.set(cookieStoreId, identity);
      } else if (/^firefox-container-\d+$/.test(cookieStoreId)) {
        // Synthetic fallback: derive tmp name from numeric suffix to allow assertions
        const match = cookieStoreId.match(/(\d+)$/);
        if (match) {
          identity = {
            cookieStoreId,
            name: `tmp${match[1]}`,
            color: 'toolbar',
            icon: 'fingerprint',
          };
          containerRegistry.set(cookieStoreId, identity);
        }
      }
    }
    return Promise.resolve(identity);
  });
  (global.browser.contextualIdentities.remove as sinon.SinonStub).callsFake((cookieStoreId: string) => {
    containerRegistry.delete(cookieStoreId);
    return Promise.resolve();
  });

  // Tab tracking system (per fake browser instance)
  const tabRegistry = new Map<number, any>();
  let tabIdCounter = 1;
  (global.browser.tabs.create as sinon.SinonStub).callsFake(async (createProperties = {}) => {
    const requestedUrl = createProperties.url && createProperties.url !== 'about:blank' ? createProperties.url : undefined;
    // Only treat http(s) as navigation targets that go through webRequest simulation.
    const targetUrl = requestedUrl && /^https?:/.test(requestedUrl) ? requestedUrl : undefined;
    const tab = {
      id: tabIdCounter++,
      cookieStoreId: createProperties.cookieStoreId || 'firefox-default',
      // Start with about:blank to allow navigation isolation to compare opener domain
      url: 'about:blank',
      ...createProperties,
    };
    // ensure caller still sees no premature target url before navigation events
    if (targetUrl) tab.url = 'about:blank';

    // Register the tab in our tracking system
    tabRegistry.set(tab.id, tab);

    // Simulate real browser events: onCreated then (after navigation) onUpdated
    const onCreated = global.browser.tabs.onCreated.addListener as any;
    if (onCreated && onCreated.yield) {
      onCreated.yield(tab);
    }

    // Trigger webRequest.onBeforeRequest only for http(s) targets to mimic real browser behavior
    if (targetUrl) {
      const addListener = global.browser.webRequest.onBeforeRequest.addListener as any;
      if (addListener.yield) {
        const requestEvent = {
          tabId: tab.id,
          url: targetUrl,
          method: 'GET',
          type: 'main_frame',
          timeStamp: Date.now(),
          frameId: 0,
          parentFrameId: -1,
          requestId: `create-${tab.id}-${Date.now()}-${Math.random()}`,
          cookieStoreId: tab.cookieStoreId,
        };
        let results = addListener.yield(requestEvent) || [];
        // Await async listeners so isolation logic finishes before test assertions
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }

        // Simulate redirects for created tab
        const redirects = redirectRegistry.get(requestEvent.url) || [];
        for (const redirectUrl of redirects) {
          const redirectEvent = {
            ...requestEvent,
            url: redirectUrl,
            // Reuse requestId for same-domain (eTLD+1) redirects to avoid double isolation; new id for cross-domain
            requestId: ((): string => {
              try {
                const origHost = new URL(requestEvent.url).hostname.split('.').slice(-2).join('.');
                const redirHost = new URL(redirectUrl).hostname.split('.').slice(-2).join('.');
                return origHost === redirHost ? requestEvent.requestId : `${requestEvent.requestId}-redir-${Math.random()}`;
              } catch {
                return `${requestEvent.requestId}-redir-${Math.random()}`;
              }
            })(),
          };
          results = addListener.yield(redirectEvent) || [];
          const asyncRedirects = results.filter((r: any) => r && typeof r.then === 'function');
          if (asyncRedirects.length) {
            await Promise.all(asyncRedirects).catch(() => {});
          }
        }
      }

      // Fire onUpdated with url change & completion
      const onUpdated = global.browser.tabs.onUpdated.addListener as any;
      if (onUpdated && onUpdated.yield) {
        tab.url = targetUrl; // finalize navigation
        const results = onUpdated.yield(tab.id, { url: targetUrl, status: 'complete' }, tab) || [];
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }
      }
    }

    // If the original requestedUrl was an about:home/newtab (non-http) finalize it now and emit onUpdated
    if (!targetUrl && requestedUrl && /^(about:home|about:newtab)$/.test(requestedUrl)) {
      tab.url = requestedUrl;
      const onUpdated = global.browser.tabs.onUpdated.addListener as any;
      if (onUpdated && onUpdated.yield) {
        const results = onUpdated.yield(tab.id, { url: requestedUrl, status: 'complete' }, tab) || [];
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }
      }
    }

    return tab;
  });

  // Also set up _create to do the same as create (test helper method)
  ((global.browser.tabs as any)._create as sinon.SinonStub).callsFake(async (createProperties = {}) => {
    const requestedUrl = createProperties.url && createProperties.url !== 'about:blank' ? createProperties.url : undefined;
    const targetUrl = requestedUrl && /^https?:/.test(requestedUrl) ? requestedUrl : undefined;
    const tab = {
      id: tabIdCounter++,
      cookieStoreId: createProperties.cookieStoreId || 'firefox-default',
      url: 'about:blank',
      ...createProperties,
    };
    // IMPORTANT: keep about:blank during request phase so navigation isolation logic
    // can correctly determine the origin (using openerTab.url) just like real Firefox
    // where the initial tab.url is about:blank until the navigation commits.
    if (targetUrl) tab.url = 'about:blank';

    // Register the tab in our tracking system
    tabRegistry.set(tab.id, tab);

    // Simulate events for helper-created tab
    const onCreated = global.browser.tabs.onCreated.addListener as any;
    if (onCreated && onCreated.yield) {
      onCreated.yield(tab);
    }

    // Trigger webRequest.onBeforeRequest only for http(s) targets
    if (targetUrl) {
      const addListener = global.browser.webRequest.onBeforeRequest.addListener as any;
      if (addListener.yield) {
        const requestEvent = {
          tabId: tab.id,
          url: targetUrl,
          method: 'GET',
          type: 'main_frame',
          timeStamp: Date.now(),
          frameId: 0,
          parentFrameId: -1,
          requestId: `helper-create-${tab.id}-${Date.now()}-${Math.random()}`,
          cookieStoreId: tab.cookieStoreId,
        };
        let results = addListener.yield(requestEvent) || [];
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }

        // Simulate redirects for helper-created tab
        const redirects = redirectRegistry.get(requestEvent.url) || [];
        for (const redirectUrl of redirects) {
          const redirectEvent = {
            ...requestEvent,
            url: redirectUrl,
            requestId: ((): string => {
              try {
                const origHost = new URL(requestEvent.url).hostname.split('.').slice(-2).join('.');
                const redirHost = new URL(redirectUrl).hostname.split('.').slice(-2).join('.');
                return origHost === redirHost ? requestEvent.requestId : `${requestEvent.requestId}-redir-${Math.random()}`;
              } catch {
                return `${requestEvent.requestId}-redir-${Math.random()}`;
              }
            })(),
          };
          results = addListener.yield(redirectEvent) || [];
          const asyncRedirects = results.filter((r: any) => r && typeof r.then === 'function');
          if (asyncRedirects.length) {
            await Promise.all(asyncRedirects).catch(() => {});
          }
        }
      }

      // Fire onUpdated with url change & completion
      const onUpdated = global.browser.tabs.onUpdated.addListener as any;
      if (onUpdated && onUpdated.yield) {
        tab.url = targetUrl;
        const results = onUpdated.yield(tab.id, { url: targetUrl, status: 'complete' }, tab) || [];
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }
      }
    }

    // If the requestedUrl was about:home/newtab (non-http) finalize and emit onUpdated
    if (!targetUrl && requestedUrl && /^(about:home|about:newtab)$/.test(requestedUrl)) {
      tab.url = requestedUrl;
      const onUpdated = global.browser.tabs.onUpdated.addListener as any;
      if (onUpdated && onUpdated.yield) {
        const results = onUpdated.yield(tab.id, { url: requestedUrl, status: 'complete' }, tab) || [];
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }
      }
    }

    return tab;
  });

  // Set up _update to also trigger web request events (test helper method)
  ((global.browser.tabs as any)._update as sinon.SinonStub).callsFake(async (tabId, updateProperties) => {
    // Get current tab state BEFORE navigation (origin URL)
    const existingTab = tabRegistry.get(tabId) || { id: tabId, cookieStoreId: 'firefox-container-1', url: 'https://example.com' };

    // Trigger webRequest first (tab.url still old) so isolation logic sees origin vs target
    if (updateProperties.url) {
      const addListener = global.browser.webRequest.onBeforeRequest.addListener as any;
      if (addListener.yield) {
        const requestEvent = {
          tabId: tabId,
          url: updateProperties.url,
          method: 'GET',
          type: 'main_frame',
          timeStamp: Date.now(),
          frameId: 0,
          parentFrameId: -1,
          requestId: `update-${tabId}-${Date.now()}-${Math.random()}`,
          cookieStoreId: existingTab.cookieStoreId,
        };
        let results = addListener.yield(requestEvent) || [];
        const asyncs = results.filter((r: any) => r && typeof r.then === 'function');
        if (asyncs.length) {
          await Promise.all(asyncs).catch(() => {});
        }

        // Simulate redirects for update navigation BEFORE updating tab url
        const redirects = redirectRegistry.get(requestEvent.url) || [];
        for (const redirectUrl of redirects) {
          const redirectEvent = {
            ...requestEvent,
            url: redirectUrl,
            requestId: ((): string => {
              try {
                const origHost = new URL(requestEvent.url).hostname.split('.').slice(-2).join('.');
                const redirHost = new URL(redirectUrl).hostname.split('.').slice(-2).join('.');
                return origHost === redirHost ? requestEvent.requestId : `${requestEvent.requestId}-redir-${Math.random()}`;
              } catch {
                return `${requestEvent.requestId}-redir-${Math.random()}`;
              }
            })(),
          };
          results = addListener.yield(redirectEvent) || [];
          const asyncRedirects = results.filter((r: any) => r && typeof r.then === 'function');
          if (asyncRedirects.length) {
            await Promise.all(asyncRedirects).catch(() => {});
          }
        }
      }
    }

    // Now update registry to new URL and emit onUpdated
    const updatedTab = { ...existingTab, ...updateProperties };
    tabRegistry.set(tabId, updatedTab);

    if (updateProperties.url) {
      const onUpdated = global.browser.tabs.onUpdated.addListener as any;
      if (onUpdated && onUpdated.yield) {
        onUpdated.yield(tabId, { url: updateProperties.url, status: 'complete' }, updatedTab);
      }
    }
    return updatedTab;
  });

  (global.browser.tabs.get as sinon.SinonStub).callsFake(tabId => {
    // Return the registered tab if it exists, otherwise create a default one
    const registeredTab = tabRegistry.get(tabId);
    if (registeredTab) {
      return Promise.resolve(registeredTab);
    }

    // Default fallback tab
    const defaultTab = {
      id: tabId,
      cookieStoreId: `firefox-container-1`,
      url: 'https://example.com',
    };
    tabRegistry.set(tabId, defaultTab);
    return Promise.resolve(defaultTab);
  });

  // Per-instance helper to register redirects mapping originalUrl -> [redirectUrls]
  ((global.browser.tabs as any)._registerRedirects as sinon.SinonStub).callsFake((origin: string, redirects: string[]) => {
    redirectRegistry.set(origin, redirects);
  });

  return { browser, clock };
};

chai.should();
chai.use(chaiDeepMatch);
chai.use(sinonChai);

const { expect } = chai;
const nextTick = (): Promise<void> => {
  return new Promise(resolve => {
    process.nextTick(resolve);
  });
};

export interface Background {
  browser: BrowserMock;
  tmp: TemporaryContainers;
  clock: sinon.SinonFakeTimers;
  helper: Helper;
}

const loadBackground = async ({
  initialize = true,
  preferences = false,
  beforeCtor = false,
}: {
  initialize?: boolean;
  preferences?: false | Record<string, unknown>;
  beforeCtor?: false | ((browser: BrowserMock, clock: sinon.SinonFakeTimers) => Promise<void> | void);
} = {}): Promise<Background> => {
  const { browser, clock } = fakeBrowser();

  if (beforeCtor) {
    await beforeCtor(browser, clock);
  }

  const background = new TemporaryContainers();
  global.window.tmp = background;

  if (preferences) {
    Object.assign(background.preferences.defaults, preferences);
  }

  // Speed up tests that rely on immediate container removal by setting removal delay to 0
  // so that reuse-number logic can reclaim freed numbers deterministically.
  background.preferences.defaults.container = {
    ...background.preferences.defaults.container,
    removal: 0,
  } as any;

  if (process.argv.includes('--tmp-debug')) {
    background.log.DEBUG = true;
  }

  if (initialize) {
    await background.initialize();
  }

  return {
    browser,
    tmp: background,
    clock,
    helper: new Helper(browser, background),
  };
};

export { preferencesTestSet, sinon, expect, nextTick, loadBackground, BrowserMock };
