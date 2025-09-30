import { TemporaryContainers } from './tmp';
import { BrowserAction } from './browseraction';
import { Cleanup } from './cleanup';
import { Container } from './container';
import { ContextMenu } from './contextmenu';
import { Convert } from './convert';
import { Migration } from './migration';
import { MouseClick } from './mouseclick';
import { Preferences } from './preferences';
import { Storage } from './storage';
import { Isolation } from './isolation';
import { Utils } from './utils';
import { PreferencesSchema, Tab, Debug, RuntimeMessage } from '~/types';
import { delay } from './lib';

export class Runtime {
  private background: TemporaryContainers;
  private debug: Debug;
  private storage: Storage;
  private isolation!: Isolation;
  private pref!: PreferencesSchema;
  private preferences!: Preferences;
  private container!: Container;
  private mouseclick!: MouseClick;
  private browseraction!: BrowserAction;
  private migration!: Migration;
  private contextmenu!: ContextMenu;
  private cleanup!: Cleanup;
  private convert!: Convert;
  private utils!: Utils;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
    this.storage = background.storage;
  }

  initialize(): void {
    this.pref = this.background.pref;
    this.preferences = this.background.preferences;
    this.container = this.background.container;
    this.mouseclick = this.background.mouseclick;
    this.browseraction = this.background.browseraction;
    this.migration = this.background.migration;
    this.contextmenu = this.background.contextmenu;
    this.cleanup = this.background.cleanup;
    this.convert = this.background.convert;
    this.isolation = this.background.isolation;
    this.utils = this.background.utils;
  }

  async onMessage(message: RuntimeMessage, sender: browser.runtime.MessageSender): Promise<void | boolean | Tab | 'pong'> {
    this.debug('[onMessage] message received', message, sender);
    if (typeof message !== 'object') {
      return;
    }

    switch (message.method) {
      case 'linkClicked':
        this.debug('[onMessage] link clicked');
        this.mouseclick.linkClicked(message.payload, sender);
        return true;

      case 'saveIsolation':
        this.debug('[onMessage] saveIsolation');
        this.isolation.setActiveState(message.payload.isolation.active);
        return true;

      case 'savePreferences': {
        this.debug('[onMessage] savePreferences');

        // Validate changes against managed storage policies
        const validationErrors: string[] = [];
        const newPrefs = message.payload.preferences;

        // Check for locked settings (simplified flat check for now)
        if (this.storage.managedStorage.isManaged) {
          for (const lockedSetting of this.storage.managedStorage.lockedSettings) {
            // Simple path check - could be enhanced for nested objects
            if (this.hasSettingChanged(this.pref, newPrefs, lockedSetting)) {
              validationErrors.push(`Setting "${lockedSetting}" is managed by policy and cannot be changed.`);
            }
          }
        }

        if (validationErrors.length > 0) {
          throw new Error(`Policy validation failed: ${validationErrors.join('; ')}`);
        }

        await this.preferences.handleChanges({
          oldPreferences: this.pref,
          newPreferences: newPrefs,
        });
        this.storage.local.preferences = newPrefs;
        await this.storage.persist();

        if (
          (
            await browser.tabs.query({
              url: browser.runtime.getURL('options.html'),
            })
          ).length
        ) {
          browser.runtime.sendMessage({
            info: 'preferencesUpdated',
            fromTabId: sender && sender.tab && sender.tab.id,
          });
        }
        return true;
      }

      case 'importPreferences': {
        const oldPreferences = this.utils.clone(this.storage.local.preferences);
        if (
          this.background.utils.addMissingKeys({
            defaults: this.preferences.defaults,
            source: message.payload.preferences,
          })
        ) {
          await this.storage.persist();
        }
        await this.migration.migrate({
          preferences: message.payload.preferences,
          previousVersion: message.payload.previousVersion,
        });
        await this.preferences.handleChanges({
          oldPreferences,
          newPreferences: this.pref,
        });
        return true;
      }

      case 'resetStatistics':
        this.debug('[onMessage] resetting statistics');
        this.storage.local.statistics = this.utils.clone(this.storage.defaults.statistics);
        this.storage.local.statistics.startTime = new Date();
        await this.storage.persist();
        return true;

      case 'resetStorage':
        this.debug('[onMessage] resetting storage', message, sender);
        this.browseraction.unsetPopup();
        this.contextmenu.remove();
        this.browseraction.setIcon('default');
        await browser.storage.local.clear();
        return this.storage.install();

      case 'resetContainerNumber':
        this.debug('[onMessage] resetting container number', message, sender);
        this.storage.local.tempContainerCounter = 0;
        await this.storage.persist();
        return true;

      case 'createTabInTempContainer':
        return this.container.createTabInTempContainer({
          url: message.payload ? message.payload.url : undefined,
          deletesHistory: message.payload ? message.payload.deletesHistory : undefined,
        });

      case 'convertTempContainerToPermanent':
        return this.convert.convertTempContainerToPermanent({
          cookieStoreId: message.payload.cookieStoreId,
          tabId: message.payload.tabId,
          name: message.payload.name,
        });

      case 'convertTempContainerToRegular':
        return this.convert.convertTempContainerToRegular({
          cookieStoreId: message.payload.cookieStoreId,
          tabId: message.payload.tabId,
        });

      case 'convertPermanentToTempContainer':
        return this.convert.convertPermanentToTempContainer({
          cookieStoreId: message.payload.cookieStoreId,
          tabId: message.payload.tabId,
        });

      case 'lastFileExport':
        this.storage.local.lastFileExport = message.payload.lastFileExport;
        return this.storage.persist();

      case 'ping':
        return 'pong';

      case 'getPreferences': {
        const rawPrefs =
          this.storage.local.preferences && Object.keys(this.storage.local.preferences).length > 0
            ? this.storage.local.preferences
            : this.preferences.defaults;
        return rawPrefs as any;
      }

      case 'getStorage':
        // Return as any to satisfy the return type
        return this.storage.local as any;

      case 'getPermissions': {
        // Return as any to satisfy the return type
        const permissions = {
          bookmarks: await browser.permissions.contains({ permissions: ['bookmarks'] }),
          downloads: await browser.permissions.contains({ permissions: ['downloads'] }),
          history: await browser.permissions.contains({ permissions: ['history'] }),
          notifications: await browser.permissions.contains({ permissions: ['notifications'] }),
          webNavigation: await browser.permissions.contains({ permissions: ['webNavigation'] }),
        };
        return permissions as any;
      }

      case 'getManagedStorageInfo':
        return this.storage.getManagedStorageInfo() as any;

      case 'validatePreferenceChange':
        return this.storage.validatePreferenceChange(message.payload.settingPath, message.payload.newValue) as any;

      case 'refreshManagedStorage':
        return this.storage.refreshManagedStorage() as any;

      default:
        return false;
    }
  }

  async onMessageExternal(
    message: {
      method: string;
      url?: string;
      active?: boolean;
      cookieStoreId?: string;
    },
    sender: browser.runtime.MessageSender
  ): Promise<undefined | boolean | Tab> {
    this.debug('[onMessageExternal] got external message', message, sender);
    switch (message.method) {
      case 'createTabInTempContainer':
        return this.container.createTabInTempContainer({
          url: message.url || undefined,
          active: message.active,
          deletesHistory: this.pref.deletesHistory.automaticMode === 'automatic' ? true : false,
        });
      case 'isTempContainer':
        return message.cookieStoreId && this.storage.local.tempContainers[message.cookieStoreId] ? true : false;
      default:
        throw new Error('Unknown message.method');
    }
  }

  async onStartup(): Promise<void> {
    delay(10000).then(() => this.cleanup.cleanup(true));

    if (this.pref.container.numberMode === 'keepuntilrestart') {
      this.storage.local.tempContainerCounter = 0;
      this.storage.persist();
    }
  }

  /**
   * Check if a setting has changed between two preference objects
   */
  private hasSettingChanged(oldPrefs: any, newPrefs: any, settingPath: string): boolean {
    const pathParts = settingPath.split('.');

    let oldValue = oldPrefs;
    let newValue = newPrefs;

    for (const part of pathParts) {
      oldValue = oldValue?.[part];
      newValue = newValue?.[part];
    }

    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }
}
