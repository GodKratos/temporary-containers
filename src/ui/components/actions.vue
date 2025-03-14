<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { Popup } from '../root';

export default defineComponent({
  props: {
    app: {
      type: Object as () => Popup,
      required: true,
    },
  },
  setup(props) {
    const preferences = ref(props.app.preferences);
    const permissions = ref(props.app.permissions);
    const activeTab = ref(props.app.activeTab);
    const isHttpTab = computed(() => activeTab.value.url.startsWith('http'));

    const openInTmp = () => {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: activeTab.value.url,
        },
      });
      window.close();
    };

    const openInDeletesHistoryTmp = () => {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: activeTab.value.url,
          deletesHistory: true,
        },
      });
      window.close();
    };

    const convertToRegular = () => {
      browser.runtime.sendMessage({
        method: 'convertTempContainerToRegular',
        payload: {
          cookieStoreId: activeTab.value.cookieStoreId,
          tabId: activeTab.value.id,
          url: activeTab.value.url,
        },
      });
      window.close();
    };

    const convertToPermanent = () => {
      browser.runtime.sendMessage({
        method: 'convertTempContainerToPermanent',
        payload: {
          cookieStoreId: activeTab.value.cookieStoreId,
          tabId: activeTab.value.id,
          name: activeTab.value.parsedUrl.hostname,
          url: activeTab.value.url,
        },
      });
      window.close();
    };

    const convertToTemporary = () => {
      browser.runtime.sendMessage({
        method: 'convertPermanentToTempContainer',
        payload: {
          cookieStoreId: activeTab.value.cookieStoreId,
          tabId: activeTab.value.id,
          url: activeTab.value.url,
        },
      });
      window.close();
    };

    return {
      preferences,
      permissions,
      activeTab,
      isHttpTab,
      openInTmp,
      openInDeletesHistoryTmp,
      convertToRegular,
      convertToPermanent,
      convertToTemporary,
    };
  },
});
</script>

<template>
  <div class="ui segment">
    <div v-if="!isHttpTab" class="ui small message">
      Actions aren't available in this tab
    </div>

    <button class="ui primary button" :disabled="!isHttpTab" @click="openInTmp">
      Open tab URL in new Temporary Container
    </button>
    <br /><br />
    <button
      class="ui negative button"
      :disabled="
        !isHttpTab || !app.storage.tempContainers[activeTab.cookieStoreId]
      "
      @click="convertToPermanent"
    >
      Convert Temporary to Permanent Container
    </button>
    <br /><br />
    <button
      class="ui negative button"
      :disabled="
        !isHttpTab ||
        activeTab.cookieStoreId === 'firefox-default' ||
        app.storage.tempContainers[activeTab.cookieStoreId]
      "
      @click="convertToTemporary"
    >
      Convert Permanent to Temporary Container
    </button>
    <br /><br />
    <button
      v-if="permissions.history"
      class="ui negative button"
      :disabled="
        !isHttpTab ||
        !app.storage.tempContainers[activeTab.cookieStoreId] ||
        !app.storage.tempContainers[activeTab.cookieStoreId].deletesHistory
      "
      @click="convertToRegular"
    >
      Convert from "Deletes History" to Regular Temporary Container
    </button>
    <br /><br />
    <button
      v-if="permissions.history"
      class="ui negative button"
      :disabled="!isHttpTab"
      @click="openInDeletesHistoryTmp"
    >
      Open tab URL in new "Deletes History Temporary Container"
    </button>
  </div>
</template>
