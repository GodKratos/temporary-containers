import sinon from 'sinon';

export interface BrowserMock {
  sinonSandbox: sinon.SinonSandbox;
  runtime: {
    getManifest: sinon.SinonStub;
    getBrowserInfo: sinon.SinonStub;
    onMessage: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onMessageExternal: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    sendMessage: sinon.SinonStub;
    onInstalled: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onStartup: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    getURL: sinon.SinonStub;
    id: string;
  };
  tabs: {
    create: sinon.SinonStub;
    update: sinon.SinonStub;
    remove: sinon.SinonStub;
    get: sinon.SinonStub;
    query: sinon.SinonStub;
    reload: sinon.SinonStub;
    onCreated: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onUpdated: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onRemoved: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onActivated: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    // Test helper methods
    _create: sinon.SinonStub;
    _navigate: sinon.SinonStub;
    _update: sinon.SinonStub;
    _registerRedirects: sinon.SinonStub;
  };
  contextualIdentities: {
    create: sinon.SinonStub;
    remove: sinon.SinonStub;
    update: sinon.SinonStub;
    get: sinon.SinonStub;
    query: sinon.SinonStub;
    onCreated: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onRemoved: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onUpdated: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  storage: {
    local: {
      get: sinon.SinonStub;
      set: sinon.SinonStub;
      remove: sinon.SinonStub;
      clear: sinon.SinonStub;
      onChanged: {
        addListener: sinon.SinonStub;
        removeListener: sinon.SinonStub;
        hasListener: sinon.SinonStub;
      };
    };
    sync: {
      get: sinon.SinonStub;
      set: sinon.SinonStub;
      remove: sinon.SinonStub;
      clear: sinon.SinonStub;
      onChanged: {
        addListener: sinon.SinonStub;
        removeListener: sinon.SinonStub;
        hasListener: sinon.SinonStub;
      };
    };
  };
  webRequest: {
    onBeforeRequest: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onBeforeSendHeaders: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onHeadersReceived: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onCompleted: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onErrorOccurred: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  permissions: {
    contains: sinon.SinonStub;
    getAll: sinon.SinonStub;
    request: sinon.SinonStub;
    remove: sinon.SinonStub;
    onAdded: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onRemoved: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  browserAction: {
    onClicked: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    setTitle: sinon.SinonStub;
    getTitle: sinon.SinonStub;
    setIcon: sinon.SinonStub;
    setPopup: sinon.SinonStub;
    getPopup: sinon.SinonStub;
    setBadgeText: sinon.SinonStub;
    getBadgeText: sinon.SinonStub;
    setBadgeBackgroundColor: sinon.SinonStub;
    getBadgeBackgroundColor: sinon.SinonStub;
    enable: sinon.SinonStub;
    disable: sinon.SinonStub;
  };
  pageAction: {
    show: sinon.SinonStub;
    hide: sinon.SinonStub;
    setTitle: sinon.SinonStub;
    getTitle: sinon.SinonStub;
    setIcon: sinon.SinonStub;
    setPopup: sinon.SinonStub;
    getPopup: sinon.SinonStub;
    onClicked: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  contextMenus: {
    create: sinon.SinonStub;
    update: sinon.SinonStub;
    remove: sinon.SinonStub;
    removeAll: sinon.SinonStub;
    onClicked: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onShown: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  commands: {
    getAll: sinon.SinonStub;
    onCommand: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  cookies: {
    get: sinon.SinonStub;
    getAll: sinon.SinonStub;
    set: sinon.SinonStub;
    remove: sinon.SinonStub;
    getAllCookieStores: sinon.SinonStub;
    onChanged: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  management: {
    get: sinon.SinonStub;
    getAll: sinon.SinonStub;
    getSelf: sinon.SinonStub;
    install: sinon.SinonStub;
    uninstall: sinon.SinonStub;
    onInstalled: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onUninstalled: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onEnabled: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onDisabled: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  history: {
    search: sinon.SinonStub;
    getVisits: sinon.SinonStub;
    addUrl: sinon.SinonStub;
    deleteUrl: sinon.SinonStub;
    deleteRange: sinon.SinonStub;
    deleteAll: sinon.SinonStub;
    onVisited: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onVisitRemoved: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  i18n: {
    getMessage: sinon.SinonStub;
    getAcceptLanguages: sinon.SinonStub;
    getUILanguage: sinon.SinonStub;
    detectLanguage: sinon.SinonStub;
  };
  extension: {
    getURL: sinon.SinonStub;
    getViews: sinon.SinonStub;
    getBackgroundPage: sinon.SinonStub;
    isAllowedIncognitoAccess: sinon.SinonStub;
    isAllowedFileSchemeAccess: sinon.SinonStub;
    setUpdateUrlData: sinon.SinonStub;
  };
  windows: {
    get: sinon.SinonStub;
    getCurrent: sinon.SinonStub;
    getLastFocused: sinon.SinonStub;
    getAll: sinon.SinonStub;
    create: sinon.SinonStub;
    update: sinon.SinonStub;
    remove: sinon.SinonStub;
    onCreated: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onRemoved: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
    onFocusChanged: {
      addListener: sinon.SinonStub;
      removeListener: sinon.SinonStub;
      hasListener: sinon.SinonStub;
    };
  };
  _reset: () => void;
  _resetHistory: () => void;
  _restore: () => void;
  _create: sinon.SinonStub;
}

/**
 * Creates a mock browser object with all WebExtensions API methods as sinon stubs.
 * This replaces the abandoned webextensions-api-fake/mock packages.
 */
export function createBrowserMock(): BrowserMock {
  const sandbox = sinon.createSandbox();

  // Create a mock browser object with the most commonly used WebExtensions APIs
  const browserMock = {
    sinonSandbox: sandbox,

    // Runtime API
    runtime: {
      getManifest: sandbox.stub(),
      getBrowserInfo: sandbox.stub(),
      onMessage: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onMessageExternal: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      sendMessage: sandbox.stub(),
      onInstalled: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onStartup: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      getURL: sandbox.stub(),
      id: 'test-extension-id',
    },

    // Tabs API
    tabs: {
      create: sandbox.stub(),
      update: sandbox.stub(),
      remove: sandbox.stub(),
      get: sandbox.stub(),
      query: sandbox.stub(),
      reload: sandbox.stub(),
      onCreated: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onUpdated: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onRemoved: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onActivated: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      // Test helper methods
      _create: sandbox.stub(),
      _navigate: sandbox.stub(),
      _update: sandbox.stub(),
      _registerRedirects: sandbox.stub(),
    },

    // Contextual Identities API (Container tabs)
    contextualIdentities: {
      create: sandbox.stub(),
      remove: sandbox.stub(),
      update: sandbox.stub(),
      get: sandbox.stub(),
      query: sandbox.stub(),
      onCreated: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onRemoved: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onUpdated: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Storage API
    storage: {
      local: {
        get: sandbox.stub(),
        set: sandbox.stub(),
        remove: sandbox.stub(),
        clear: sandbox.stub(),
        onChanged: {
          addListener: sandbox.stub(),
          removeListener: sandbox.stub(),
          hasListener: sandbox.stub(),
        },
      },
      sync: {
        get: sandbox.stub(),
        set: sandbox.stub(),
        remove: sandbox.stub(),
        clear: sandbox.stub(),
        onChanged: {
          addListener: sandbox.stub(),
          removeListener: sandbox.stub(),
          hasListener: sandbox.stub(),
        },
      },
    },

    // Web Request API
    webRequest: {
      onBeforeRequest: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onBeforeSendHeaders: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onHeadersReceived: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onCompleted: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onErrorOccurred: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Permissions API
    permissions: {
      contains: sandbox.stub(),
      getAll: sandbox.stub(),
      request: sandbox.stub(),
      remove: sandbox.stub(),
      onAdded: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onRemoved: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Browser Action API
    browserAction: {
      onClicked: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      setTitle: sandbox.stub(),
      getTitle: sandbox.stub(),
      setIcon: sandbox.stub(),
      setPopup: sandbox.stub(),
      getPopup: sandbox.stub(),
      setBadgeText: sandbox.stub(),
      getBadgeText: sandbox.stub(),
      setBadgeBackgroundColor: sandbox.stub(),
      getBadgeBackgroundColor: sandbox.stub(),
      enable: sandbox.stub(),
      disable: sandbox.stub(),
    },

    // Page Action API
    pageAction: {
      show: sandbox.stub(),
      hide: sandbox.stub(),
      setTitle: sandbox.stub(),
      getTitle: sandbox.stub(),
      setIcon: sandbox.stub(),
      setPopup: sandbox.stub(),
      getPopup: sandbox.stub(),
      onClicked: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Context Menus API
    contextMenus: {
      create: sandbox.stub(),
      update: sandbox.stub(),
      remove: sandbox.stub(),
      removeAll: sandbox.stub(),
      onClicked: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onShown: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Commands API
    commands: {
      getAll: sandbox.stub(),
      onCommand: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Cookies API
    cookies: {
      get: sandbox.stub(),
      getAll: sandbox.stub(),
      set: sandbox.stub(),
      remove: sandbox.stub(),
      getAllCookieStores: sandbox.stub(),
      onChanged: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Management API
    management: {
      get: sandbox.stub(),
      getAll: sandbox.stub(),
      getSelf: sandbox.stub(),
      install: sandbox.stub(),
      uninstall: sandbox.stub(),
      onInstalled: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onUninstalled: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onEnabled: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onDisabled: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // History API
    history: {
      search: sandbox.stub(),
      getVisits: sandbox.stub(),
      addUrl: sandbox.stub(),
      deleteUrl: sandbox.stub(),
      deleteRange: sandbox.stub(),
      deleteAll: sandbox.stub(),
      onVisited: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onVisitRemoved: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // I18n API
    i18n: {
      getMessage: sandbox.stub(),
      getAcceptLanguages: sandbox.stub(),
      getUILanguage: sandbox.stub(),
      detectLanguage: sandbox.stub(),
    },

    // Extension API
    extension: {
      getURL: sandbox.stub(),
      getViews: sandbox.stub(),
      getBackgroundPage: sandbox.stub(),
      isAllowedIncognitoAccess: sandbox.stub(),
      isAllowedFileSchemeAccess: sandbox.stub(),
      setUpdateUrlData: sandbox.stub(),
    },

    // Windows API
    windows: {
      get: sandbox.stub(),
      getCurrent: sandbox.stub(),
      getLastFocused: sandbox.stub(),
      getAll: sandbox.stub(),
      create: sandbox.stub(),
      update: sandbox.stub(),
      remove: sandbox.stub(),
      onCreated: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onRemoved: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
      onFocusChanged: {
        addListener: sandbox.stub(),
        removeListener: sandbox.stub(),
        hasListener: sandbox.stub(),
      },
    },

    // Custom method to reset all stubs (equivalent to sinonSandbox.reset())
    _reset: () => sandbox.reset(),
    _resetHistory: () => sandbox.resetHistory(),
    _restore: () => sandbox.restore(),
    _create: sandbox.stub(),
  };

  return browserMock as BrowserMock;
}

/**
 * Adds support for event listener yielding (trigger event callbacks)
 * This mimics the .yield() functionality from webextensions-api-fake
 */
export function addEventListenerSupport(stub: sinon.SinonStub): sinon.SinonStub {
  // Add a yield method to simulate triggering event listeners
  (stub as any).yield = (...args: any[]) => {
    const callbacks = stub.getCalls().map((call: any) => call.args[0]);
    return callbacks.map((callback: any) => callback(...args));
  };

  return stub;
}

// Apply event listener support to all event listener stubs
export function enhanceBrowserMock(browserMock: BrowserMock): BrowserMock {
  // Runtime events
  addEventListenerSupport(browserMock.runtime.onMessage.addListener);
  addEventListenerSupport(browserMock.runtime.onInstalled.addListener);
  addEventListenerSupport(browserMock.runtime.onStartup.addListener);

  // Tabs events
  addEventListenerSupport(browserMock.tabs.onCreated.addListener);
  addEventListenerSupport(browserMock.tabs.onUpdated.addListener);
  addEventListenerSupport(browserMock.tabs.onRemoved.addListener);
  addEventListenerSupport(browserMock.tabs.onActivated.addListener);

  // Contextual Identities events
  addEventListenerSupport(browserMock.contextualIdentities.onCreated.addListener);
  addEventListenerSupport(browserMock.contextualIdentities.onRemoved.addListener);
  addEventListenerSupport(browserMock.contextualIdentities.onUpdated.addListener);

  // Browser Action events
  addEventListenerSupport(browserMock.browserAction.onClicked.addListener);

  // Page Action events
  addEventListenerSupport(browserMock.pageAction.onClicked.addListener);

  // Context Menus events
  addEventListenerSupport(browserMock.contextMenus.onClicked.addListener);

  // Commands events
  addEventListenerSupport(browserMock.commands.onCommand.addListener);

  // Web Request events
  addEventListenerSupport(browserMock.webRequest.onBeforeRequest.addListener);
  addEventListenerSupport(browserMock.webRequest.onBeforeSendHeaders.addListener);
  addEventListenerSupport(browserMock.webRequest.onHeadersReceived.addListener);
  addEventListenerSupport(browserMock.webRequest.onCompleted.addListener);

  // Storage events
  addEventListenerSupport(browserMock.storage.local.onChanged.addListener);
  addEventListenerSupport(browserMock.storage.sync.onChanged.addListener);

  // Permissions events
  addEventListenerSupport(browserMock.permissions.onAdded.addListener);
  addEventListenerSupport(browserMock.permissions.onRemoved.addListener);

  // Cookies events
  addEventListenerSupport(browserMock.cookies.onChanged.addListener);

  // Management events
  addEventListenerSupport(browserMock.management.onInstalled.addListener);
  addEventListenerSupport(browserMock.management.onUninstalled.addListener);
  addEventListenerSupport(browserMock.management.onEnabled.addListener);
  addEventListenerSupport(browserMock.management.onDisabled.addListener);

  // History events
  addEventListenerSupport(browserMock.history.onVisited.addListener);
  addEventListenerSupport(browserMock.history.onVisitRemoved.addListener);

  // Windows events
  addEventListenerSupport(browserMock.windows.onCreated.addListener);
  addEventListenerSupport(browserMock.windows.onRemoved.addListener);
  addEventListenerSupport(browserMock.windows.onFocusChanged.addListener);

  return browserMock;
}
