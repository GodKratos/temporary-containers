<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { App } from '../root';
import { mixin } from '../mixin';
import { Permissions, PreferencesSchema } from '~/types';

interface ExportedPreferences {
  version: string;
  date: number;
  preferences: PreferencesSchema;
}

interface ImportedPreferences {
  version: string;
  preferences: PreferencesSchema;
}

export default defineComponent({
  mixins: [mixin],
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  setup(props) {
    const preferences = ref(props.app.preferences);
    const permissions = ref(props.app.permissions);
    const lastSyncExport = ref<false | { date: number; version: string }>(false);
    const lastFileExport = ref<false | { date: number; version: string }>(false);
    const download = ref<false | { id: number; date: number; version: string }>(false);
    const addonVersion = ref(browser.runtime.getManifest().version);

    onMounted(async () => {
      const { export: importPreferences } = await browser.storage.sync.get('export');
      if (importPreferences) {
        lastSyncExport.value = {
          date: importPreferences.date,
          version: importPreferences.version,
        };
      }
      const { lastFileExport: fileExport } = await browser.storage.local.get('lastFileExport');
      if (fileExport) {
        lastFileExport.value = fileExport;
      }

      browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync' || !changes.export || !changes.export.newValue) {
          return;
        }
        lastSyncExport.value = {
          date: changes.export.newValue.date,
          version: changes.export.newValue.version,
        };
      });

      if (permissions.value.downloads) {
        addDownloadListener();
      }
    });

    const getPreferences = (): ExportedPreferences => {
      const clonedPreferences = JSON.parse(JSON.stringify(preferences.value));
      clonedPreferences.isolation.global.excludedContainers = [];

      return {
        version: browser.runtime.getManifest().version,
        date: Date.now(),
        preferences: clonedPreferences,
      };
    };

    const exportPreferences = async (): Promise<void> => {
      if (!permissions.value.downloads) {
        permissions.value.downloads = await browser.permissions.request({
          permissions: ['downloads'],
        });
        if (!permissions.value.downloads) {
          return;
        }
        addDownloadListener();
      }

      const preferencesData = getPreferences();
      const exportedPreferences = JSON.stringify(preferencesData, null, 2);

      const date = new Date(preferencesData.date);
      const dateString = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ]
        .map((s) => s.toString().padStart(2, '0'))
        .join('-');
      const timeString = [date.getHours(), date.getMinutes(), date.getSeconds()]
        .map((s) => s.toString().padStart(2, '0'))
        .join('.');
      const blob = new Blob([exportedPreferences], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      try {
        download.value = {
          id: await browser.downloads.download({
            url,
            filename: `temporary_containers_preferences_${dateString}_${timeString}.json`,
            saveAs: true,
          }),
          date: preferencesData.date,
          version: preferencesData.version,
        };
      } catch (error) {
        this.$root.$emit(
          'showError',
          `Exporting to file failed: ${error.toString()}`,
          { close: true }
        );
      }
    };

    const exportPreferencesSync = async (): Promise<void> => {
      try {
        const { export: importPreferences } = await browser.storage.sync.get('export');
        if (
          importPreferences &&
          !window.confirm(`
          There's already an export in Firefox Sync:\n
          Date: ${new Date(importPreferences.date).toLocaleString()}\n
          Version: ${importPreferences.version}\n\n
          Overwrite Firefox Sync export?\n
        `)
        ) {
          return;
        }
        await browser.storage.sync.set({
          export: getPreferences(),
        });
        this.$root.$emit(
          'showMessage',
          'Successfully exported to Firefox Sync'
        );
      } catch (error) {
        this.$root.$emit(
          'showError',
          `Exporting to Firefox Sync failed: ${error.toString()}`
        );
      }
    };

    const importPreferencesSync = async (): Promise<void> => {
      try {
        const { export: importPreferences } = await browser.storage.sync.get('export');
        if (!importPreferences || !Object.keys(importPreferences).length) {
          this.$root.$emit(
            'showError',
            'No preferences found in Firefox Sync',
            { close: true }
          );
          return;
        }
        if (confirmedImportPreferences(importPreferences)) {
          saveImportedPreferences(importPreferences);
        }
      } catch (error) {
        this.$root.$emit(
          'showError',
          `Importing from Firefox Sync failed: ${error.toString()}`
        );
      }
    };

    const confirmedImportPreferences = (
      importPreferences: any,
      fileName?: string
    ): boolean => {
      return window.confirm(`
        ${
          fileName
            ? `Import preferences from ${fileName}?`
            : 'Import preferences?'
        }\n
        Date: ${new Date(importPreferences.date).toLocaleString()}\n
        Version: ${importPreferences.version}\n\n
        All existing preferences are overwritten.
      `);
    };

    const importPreferences = async ({
      target,
    }: {
      target: HTMLInputElement;
    }): Promise<void> => {
      const [file] = target.files as FileList;
      if (!file) {
        return;
      }

      const importPreferences: ImportedPreferences = await new Promise(
        (resolve) => {
          const reader = new FileReader();
          reader.readAsText(file, 'UTF-8');
          reader.onload = async (event): Promise<void> => {
            try {
              if (!event.target || typeof event.target.result !== 'string') {
                throw new Error('invalid input');
              }
              resolve(JSON.parse(event.target.result));
            } catch (error) {
              console.error('error while importing preferences', error);
              this.$root.$emit(
                'showError',
                'Error while importing preferences!'
              );
            }
          };
        }
      );

      if (confirmedImportPreferences(importPreferences, file.name)) {
        saveImportedPreferences(importPreferences);
      }
    };

    const saveImportedPreferences = async (
      importedPreferences: ImportedPreferences
    ): Promise<void> => {
      if (!permissions.value.notifications) {
        importedPreferences.preferences.notifications = false;
      }
      if (!permissions.value.bookmarks) {
        importedPreferences.preferences.contextMenuBookmarks = false;
        importedPreferences.preferences.deletesHistory.contextMenuBookmarks = false;
      }
      if (!permissions.value.history) {
        importedPreferences.preferences.deletesHistory.active = false;
      }
      if (!permissions.value.webNavigation) {
        importedPreferences.preferences.scripts.active = false;
      }

      await browser.runtime.sendMessage({
        method: 'importPreferences',
        payload: {
          preferences: importedPreferences.preferences,
          previousVersion: importedPreferences.version,
        },
      });

      this.$root.$emit('initialize', { showMessage: 'Preferences imported.' });
    };

    const wipePreferencesSync = async (): Promise<void> => {
      if (
        !window.confirm(`
        Wipe Firefox sync export?\n
        This can't be undone.
      `)
      ) {
        return;
      }

      try {
        await browser.storage.sync.clear();
        lastSyncExport.value = false;
        this.$root.$emit(
          'showMessage',
          'Successfully wiped Firefox Sync export'
        );
      } catch (error) {
        this.$root.$emit(
          'showError',
          `Wiping Firefox Sync failed: ${error.toString()}`
        );
      }
    };

    const addDownloadListener = (): void => {
      browser.downloads.onChanged.addListener(async (downloadDelta) => {
        console.log('downloadDelta', downloadDelta);
        if (
          !download.value ||
          download.value.id !== downloadDelta.id ||
          !downloadDelta.state ||
          downloadDelta.state.current !== 'complete'
        ) {
          return;
        }
        const lastFileExportData = {
          date: download.value.date,
          version: download.value.version,
        };
        lastFileExport.value = lastFileExportData;
        download.value = false;

        browser.runtime.sendMessage({
          method: 'lastFileExport',
          payload: { lastFileExport: lastFileExportData },
        });
      });
    };

    return {
      preferences,
      permissions,
      lastSyncExport,
      lastFileExport,
      download,
      addonVersion,
      exportPreferences,
      exportPreferencesSync,
      importPreferencesSync,
      importPreferences,
      wipePreferencesSync,
    };
  },
});
</script>

<template>
  <div class="ui form">
    <div class="ui two column very relaxed grid">
      <div class="column">
        <div class="field">
          <label>Export Preferences</label>
        </div>
        <div class="ui small notice message">
          Preferences that include permanent containers are stripped from the
          export since it's not possible to make sure that those containers
          exist when importing, which would lead to unexpected behavior.
          <br /><br />
          <i
            >Installed Add-on version: <strong>{{ addonVersion }}</strong></i
          >
        </div>
        <div class="field">
          <button class="ui button primary" @click="exportPreferences">
            Export to local file
          </button>
        </div>
        <div v-if="lastFileExport" class="field" style="margin-bottom: 30px;">
          <h5>Last local file export</h5>
          <div>
            <ul>
              <li>
                Date: {{ new Date(lastFileExport.date).toLocaleString() }}
              </li>
              <li>Version: {{ lastFileExport.version }}</li>
            </ul>
          </div>
        </div>
        <div class="field">
          <button class="ui button primary" @click="exportPreferencesSync">
            Export to Firefox Sync
          </button>
        </div>
        <div v-if="lastSyncExport" class="field">
          <button
            class="ui button negative primary"
            @click="wipePreferencesSync"
          >
            Wipe Firefox Sync export
          </button>
        </div>
        <div v-if="lastSyncExport" class="field">
          <h5>Last Firefox Sync export</h5>
          <div>
            <ul>
              <li>
                Date: {{ new Date(lastSyncExport.date).toLocaleString() }}
              </li>
              <li>Version: {{ lastSyncExport.version }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label>Import Preferences</label>
        </div>
        <div class="ui small notice message">
          Currently it's not possible to request permissions while importing, so
          if you have notifications, bookmarks context menu, or deletes history
          preferences in your import, those will get ignored and you have to
          reconfigure them.
        </div>
        <div class="field">
          <label>
            <input
              id="importPreferences"
              type="file"
              class="hidden"
              @change="importPreferences"
            />
            <div class="ui button primary">
              Import from local file
            </div>
          </label>
        </div>
        <div class="field">
          <button class="ui button primary" @click="importPreferencesSync">
            Import from Firefox Sync
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
