import jQuery from 'jquery';
declare global {
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
  }
}
window.$ = window.jQuery = jQuery;

import 'jquery-address';
import 'sortablejs';
import 'fomantic-ui';
import { createApp, Component, h } from 'vue';
import { getPermissions } from '~/shared';
import { Tab, Permissions, PreferencesSchema, StorageLocal } from '~/types';

interface Data {
  app: App | UninitializedApp;
  expandedPreferences: boolean;
}

interface UninitializedApp {
  initialized: false;
  popup: boolean;
}

interface ActiveTab extends Tab {
  parsedUrl: URL;
}

export interface App {
  initialized: boolean;
  popup: boolean;
  storage: StorageLocal;
  preferences: PreferencesSchema;
  permissions: Permissions;
  currentTab: Tab;
  activeTab?: ActiveTab;
}

export interface Popup extends App {
  activeTab: ActiveTab;
}

export interface InitializeOptions {
  showMessage?: string;
  showError?: string;
}

declare global {
  interface String {
    capitalize: () => string;
  }
  interface Array<T> {
    move: (from: number, to: number) => void;
  }
}

String.prototype.capitalize = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

Array.prototype.move = function (from: number, to: number): void {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

export default (AppComponent: Component, { popup = false }): void => {
  const app = createApp({
    data(): Data {
      return {
        app: {
          initialized: false,
          popup,
        },
        expandedPreferences: false,
      };
    },
    render() {
      return h(AppComponent, { app: this.app })
    },
    emits: ['initialize', 'showInitializeError', 'showInitializeLoader', 'hideInitializeLoader', 'showMessage', 'showError', 'hideMessage'],
    watch: {
      app: {
        async handler(app: App, oldApp: App): Promise<void> {
          if (!app.initialized) return;

          if (!oldApp.preferences) {
            this.maybeExpandPreferences(app);
            return;
          }

          if (!popup) {
            await this.checkPermissions(app);
          }

          try {
            await browser.runtime.sendMessage({
              method: 'savePreferences',
              payload: { preferences: app.preferences },
            });
          } catch (error) {
            console.error('error while saving preferences', error);
            this.$emit('showError', `Error while saving preferences: ${(error as Error).toString()}`);
            window.setTimeout(() => {
              this.$emit('initialize');
            }, 5000);
          }

          this.maybeExpandPreferences(app);
        },
        deep: true,
      },
    },
    mounted() {
      this.initialize();

      this.$emit('initialize', (options: InitializeOptions = {}) => {
        this.app = {
          initialized: false,
          popup,
        };
        this.expandedPreferences = false;
        this.$nextTick(() => {
          this.initialize(options);
        });
      });
    },
    methods: {
      async initialize(options: InitializeOptions = {}): Promise<void> {
        let pongError = false;
        let pongErrorMessage = "";
        let initializeLoader = false;

        if (window.location.search.startsWith('?error')) {
          this.$emit('showInitializeError');
          return;
        }

        setTimeout(() => {
          if (!this.app.initialized && !pongError) {
            initializeLoader = true;
            this.$emit('showInitializeLoader');
          }
        }, 500);

        try {
          const pong = await browser.runtime.sendMessage({ method: 'ping' });
          if (pong !== 'pong') {
            pongError = true;
          }
        } catch (error) {
          pongError = true;
          pongErrorMessage = (error as Error).toString();
        }

        if (pongError) {
          if (initializeLoader) {
            this.$emit('hideInitializeLoader');
          }
          this.$emit('showInitializeError', pongErrorMessage);
          return;
        }

        const permissions = await getPermissions();
        const storage = await this.loadStorage();
        if (!storage) return;

        const currentTab = await browser.tabs.getCurrent() as Tab;
        const app: App = {
          initialized: true,
          popup,
          storage,
          preferences: storage.preferences,
          permissions,
          currentTab,
        };

        if (popup) {
          const [tab] = await browser.tabs.query({
            currentWindow: true,
            active: true,
          }) as Tab[];
          app.activeTab = {
            ...tab,
            parsedUrl: new URL(tab.url),
          };
        }

        this.app = app;

        if (options.showMessage) {
          this.$nextTick(() => {
            this.$emit('showMessage', options.showMessage);
          });
        } else if (options.showError) {
          this.$nextTick(() => {
            this.$emit('showError', options.showError);
          });
        } else {
          this.$emit('hideMessage');
        }
        if (initializeLoader) {
          this.$emit('hideInitializeLoader');
        }
      },

      async loadStorage(): Promise<StorageLocal | null> {
        try {
          const storage = await browser.storage.local.get() as StorageLocal;
          if (!storage.preferences || !Object.keys(storage.preferences).length) {
            this.$emit('showError', 'Loading preferences failed, please try again');
            return null;
          }
          return storage;
        } catch (error) {
          this.$emit('showError', `Loading preferences failed, please try again. ${(error as Error).toString()}`);
          return null;
        }
      },

      async checkPermissions(app: App): Promise<void> {
        if (app.preferences.notifications && !app.permissions.notifications) {
          app.preferences.notifications = app.permissions.notifications = await browser.permissions.request({
            permissions: ['notifications'],
          });
        }

        if (app.preferences.contextMenuBookmarks && !app.permissions.bookmarks) {
          app.preferences.contextMenuBookmarks = app.permissions.bookmarks = await browser.permissions.request({
            permissions: ['bookmarks'],
          });
        }

        if (app.preferences.deletesHistory.contextMenuBookmarks && !app.permissions.bookmarks) {
          app.preferences.deletesHistory.contextMenuBookmarks = app.permissions.bookmarks = await browser.permissions.request({
            permissions: ['bookmarks'],
          });
        }

        if (app.preferences.deletesHistory.active && !app.permissions.history) {
          app.preferences.deletesHistory.active = app.permissions.history = await browser.permissions.request({
            permissions: ['history'],
          });
        }

        if (app.preferences.scripts.active && !app.permissions.webNavigation) {
          app.preferences.scripts.active = app.permissions.webNavigation = await browser.permissions.request({
            permissions: ['webNavigation'],
          });
        }
      },

      maybeExpandPreferences(app: App): void {
        this.$nextTick(() => {
          if (app.preferences.ui.expandPreferences && !this.expandedPreferences) {
            Array.from(Array(15)).forEach((_, idx) => {
              $('.ui.accordion:not(#glossaryAccordion)').accordion('open', idx);
            });
            this.expandedPreferences = true;
          } else if (!app.preferences.ui.expandPreferences && this.expandedPreferences) {
            this.expandedPreferences = false;
            this.$emit('initialize');
          }
        });
      },
    },
    template: '<AppComponent />',
  });

  app.component('AppComponent', AppComponent);
  app.mount('#app');
};