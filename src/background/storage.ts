import { TemporaryContainers } from './tmp';
import { StorageLocal, Debug, ManagedStorageManifest, ManagedStorageState, PreferencesSchema } from '~/types';

export class Storage {
  public local!: StorageLocal;
  public installed: boolean;
  public defaults: StorageLocal;
  public managedStorage!: ManagedStorageState;

  private background: TemporaryContainers;
  private debug: Debug;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
    this.installed = false;

    this.defaults = {
      containerPrefix: false,
      tempContainerCounter: 0,
      tempContainers: {},
      tempContainersNumbers: [],
      statistics: {
        startTime: new Date(),
        containersDeleted: 0,
        cookiesDeleted: 0,
        cacheDeleted: 0,
        deletesHistory: {
          containersDeleted: 0,
          cookiesDeleted: 0,
          urlsDeleted: 0,
        },
      },
      isolation: {
        active: true,
        reactivateTargetTime: 0,
      },
      preferences: background.preferences.defaults,
      lastFileExport: false,
      version: false,
      managedStorage: {
        isManaged: false,
        lastChecked: 0,
        overrides: {},
        lockedSettings: [],
      },
    };

    this.managedStorage = {
      isManaged: false,
      lastChecked: 0,
      overrides: {},
      lockedSettings: [],
    };
  }

  async initialize(): Promise<boolean> {
    this.local = (await browser.storage.local.get()) as StorageLocal;

    // empty storage *should* mean new install
    if (!this.local || !Object.keys(this.local).length) {
      return this.install();
    }

    // check for managed preferences
    await this.checkManagedStorage();

    this.debug('[initialize] storage initialized', this.local);
    if (
      this.background.utils.addMissingKeys({
        defaults: this.defaults,
        source: this.local,
      })
    ) {
      await this.persist();
    }

    // migrate if currently running version is different from version in storage
    if (this.local.version && this.background.version !== this.local.version) {
      try {
        await this.background.migration.migrate({
          preferences: this.local.preferences,
          previousVersion: this.local.version,
        });
      } catch (error) {
        this.debug('[initialize] migration failed', (error as Error).toString());
      }
    }

    // Initialize managed storage monitoring
    this.initializeManagedStorageMonitoring();

    return true;
  }

  async persist(): Promise<boolean> {
    try {
      if (!this.local || !Object.keys(this.local).length) {
        this.debug('[persist] tried to persist corrupt storage', this.local);
        return false;
      }
      await browser.storage.local.set(this.local);
      this.debug('[persist] storage persisted');
      return true;
    } catch (error) {
      this.debug('[persist] something went wrong while trying to persist the storage', error);
      return false;
    }
  }

  async install(): Promise<boolean> {
    this.debug('[install] installing storage');

    this.local = this.background.utils.clone(this.defaults);
    this.local.version = this.background.version;

    // Check for managed storage even during initial install
    await this.checkManagedStorage();

    if (!(await this.persist())) {
      throw new Error('[install] something went wrong while installing');
    }
    this.debug('[install] storage installed', this.local);
    this.installed = true;
    return true;
  }

  /**
   * Check for and apply managed storage policies
   */
  async checkManagedStorage(): Promise<void> {
    try {
      const managed = (await browser.storage.managed.get()) as ManagedStorageManifest;

      if (!managed || !Object.keys(managed).length) {
        this.debug('[checkManagedStorage] no managed storage configuration found');
        this.managedStorage.isManaged = false;
        return;
      }

      this.debug('[checkManagedStorage] found managed storage configuration', managed);

      // Update managed storage state
      this.managedStorage = {
        isManaged: true,
        version: managed.version,
        lastChecked: Date.now(),
        overrides: managed.preferences || {},
        lockedSettings: managed.locked_settings || [],
      };

      // Apply managed preferences
      if (managed.preferences) {
        this.applyManagedPreferences(managed.preferences);
      }

      // Store managed state in local storage
      this.local.managedStorage = this.managedStorage;
      await this.persist();
    } catch (error) {
      this.debug('[checkManagedStorage] accessing managed storage failed:', (error as Error).toString());
      this.managedStorage.isManaged = false;
    }
  }

  /**
   * Apply managed preferences to current preferences
   */
  private applyManagedPreferences(managedPreferences: Partial<PreferencesSchema>): void {
    this.debug('[applyManagedPreferences] applying managed preferences', managedPreferences);

    // Deep merge managed preferences into current preferences
    this.local.preferences = this.background.utils.deepMerge(this.local.preferences, managedPreferences) as PreferencesSchema;
  }

  /**
   * Check if a specific preference setting is locked by policy
   */
  isSettingLocked(settingPath: string): boolean {
    return this.managedStorage.isManaged && this.managedStorage.lockedSettings.includes(settingPath);
  }

  /**
   * Get managed storage information for UI display
   */
  getManagedStorageInfo(): ManagedStorageState {
    return { ...this.managedStorage };
  }

  /**
   * Validate preference changes against managed storage policies
   */
  validatePreferenceChange(settingPath: string, _newValue: any): { allowed: boolean; reason?: string } {
    if (this.isSettingLocked(settingPath)) {
      return {
        allowed: false,
        reason: browser.i18n.getMessage('managedStorageSettingLockedTooltip'),
      };
    }
    return { allowed: true };
  }

  /**
   * Refresh managed storage configuration (call periodically)
   */
  async refreshManagedStorage(): Promise<boolean> {
    const oldManagedState = { ...this.managedStorage };
    await this.checkManagedStorage();

    // Check if managed storage configuration changed
    const hasChanged = JSON.stringify(oldManagedState) !== JSON.stringify(this.managedStorage);

    if (hasChanged) {
      this.debug('[refreshManagedStorage] managed storage configuration changed');
      // Notify UI about policy changes if needed
      try {
        browser.runtime.sendMessage({
          method: 'managedStorageChanged',
          payload: this.managedStorage,
        });
      } catch (_error) {
        // Ignore if no listeners
      }
    }

    return hasChanged;
  }

  /**
   * Initialize periodic managed storage checks
   */
  initializeManagedStorageMonitoring(): void {
    // Check for managed storage changes every 5 minutes
    setInterval(
      () => {
        this.refreshManagedStorage().catch(error => {
          this.debug('[managedStorageMonitoring] error refreshing managed storage:', error);
        });
      },
      5 * 60 * 1000
    );
  }
}
