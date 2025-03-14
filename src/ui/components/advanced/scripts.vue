<script lang="ts">
import { defineComponent, ref, reactive, onMounted, nextTick } from 'vue';
import DomainPattern from '../domainpattern.vue';
import { App } from '~/ui/root';
import { Script, PreferencesSchema } from '~/types';

const scriptDefaults = {
  code: '',
  runAt: 'document_idle',
};

export default defineComponent({
  components: {
    DomainPattern,
  },

  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },

  setup(props) {
    const preferences = props.app.preferences;
    const domainPattern = ref('');
    const domainPatternDisabled = ref(false);
    const script = reactive({ ...scriptDefaults });
    const editing = ref(false);
    const editingIndex = ref(-1);

    const resetForm = () => {
      editing.value = false;
      domainPattern.value = '';
      domainPatternDisabled.value = false;
      Object.assign(script, scriptDefaults);
      resetDropdowns();
    };

    const resetDropdowns = () => {
      $('#scriptForm .ui.dropdown').dropdown('destroy');
      nextTick(() => {
        $('#scriptForm .ui.dropdown').dropdown();
      });
    };

    const addScript = () => {
      const domain = preferences.scripts.domain;
      if (!domain[domainPattern.value]) {
        domain[domainPattern.value] = [];
      }
      domain[domainPattern.value].unshift({ ...script });
      resetForm();
    };

    const saveScript = () => {
      if (!editing.value) {
        return;
      }
      preferences.scripts.domain[domainPattern.value][editingIndex.value] = { ...script };
      resetForm();
    };

    const editScript = (scriptDomainPattern: string, index: number) => {
      if (!preferences.scripts.domain[scriptDomainPattern][index]) {
        return;
      }
      domainPatternDisabled.value = true;
      editing.value = true;
      editingIndex.value = index;
      domainPattern.value = scriptDomainPattern;
      Object.assign(script, preferences.scripts.domain[scriptDomainPattern][index]);
      resetDropdowns();
    };

    const removeScript = (scriptDomainPattern: string, index: number) => {
      if (!window.confirm('Remove script?')) {
        return;
      }
      preferences.scripts.domain[scriptDomainPattern].splice(index, 1);
      if (!preferences.scripts.domain[scriptDomainPattern].length) {
        delete preferences.scripts.domain[scriptDomainPattern];
      }
    };

    onMounted(() => {
      $('#scriptForm').form({
        fields: {
          scriptDomainPattern: 'empty',
          scriptCode: 'empty',
        },
        onSuccess: (event) => {
          event.preventDefault();
          if (!editing.value) {
            addScript();
          } else {
            saveScript();
          }
        },
      });
      $('#scriptForm .ui.dropdown').dropdown();
      $('#scriptForm .ui.checkbox').checkbox();
    });

    return {
      preferences,
      domainPattern,
      domainPatternDisabled,
      script,
      editing,
      editingIndex,
      addScript,
      saveScript,
      editScript,
      removeScript,
      resetForm,
      resetDropdowns,
    };
  },
});
</script>

<template>
  <div>
    <form id="scriptForm" class="ui form">
      <h4>
        Configure scripts to execute for certain domains in Temporary Containers
      </h4>
      <div class="ui small negative message">
        <strong>Warning: Never add scripts from untrusted sources!</strong>
        Also keep in mind that Firefox Sync storage is limited to 100KB, so
        adding huge scripts here will prevent you from exporting preferences to
        Firefox Sync since the scripts are stored as preferences. The local
        storage limit is 5MB, so adding scripts exceeding that might prevent the
        Add-on from working at all.
        <br /><br />
        <strong>
          <div id="scriptsContainerWarningRead" class="ui small checkbox">
            <input
              id="scriptsContainerWarningReadCheckbox"
              v-model="preferences.scripts.active"
              :disabled="preferences.scripts.active"
              type="checkbox"
            />
            <label>
              I have read the warning and understand the implications that come
              with using "Scripts". When ticking the checkbox Firefox will ask
              you for "Access browser activity" permissions.
            </label>
          </div>
        </strong>
      </div>
      <div class="ui small notice message">
        This will call
        <a
          href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript"
          target="_blank"
          >tabs.executeScript</a
        >
        if the tab url being loaded belongs to a Temporary Container and its
        domain matches the given pattern. Pro-tip: You can use
        <a
          href="https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Xray_vision#Waiving_Xray_vision"
          target="_blank"
          >window.wrappedJSObject</a
        >
        to access the original window.
      </div>
      <div
        :style="
          !preferences.scripts.active
            ? 'opacity: 0.3; pointer-events: none'
            : ''
        "
      >
        <domain-pattern
          id="scriptDomainPattern"
          :disabled="domainPatternDisabled"
          :glossary="true"
          v-model:domain-pattern="domainPattern"
        />
        <div class="field">
          <label>code</label>
          <textarea id="scriptCode" v-model="script.code"></textarea>
        </div>
        <div class="field">
          <label>runAt</label>
          <select v-model="script.runAt" class="ui fluid dropdown">
            <option value="document_start">document_start</option>
            <option value="document_end">document_end</option>
            <option value="document_idle">document_idle</option>
          </select>
        </div>
        <div class="field">
          <button class="ui button primary">
            {{ !editing ? 'Add' : 'Save' }}
          </button>
        </div>
      </div>
    </form>
    <div
      :style="
        !preferences.scripts.active ? 'opacity: 0.3; pointer-events: none' : ''
      "
    >
      <div style="margin-top: 30px;" :class="{ hidden: editing }">
        <h3>Scripts</h3>
        <div>
          <div v-if="!Object.keys(preferences.scripts.domain).length">
            No Scripts added
          </div>

          <div v-else>
            <div
              v-for="(scripts, scriptDomainPattern) in preferences.scripts
                .domain"
              :key="scriptDomainPattern"
              class="ui segments"
            >
              <div class="ui segment">
                <h5>{{ scriptDomainPattern }}</h5>
              </div>
              <div class="ui segments">
                <div
                  v-for="(domainScript, index) in scripts"
                  :key="index"
                  class="ui segment"
                >
                  <div class="item">
                    Script #{{ index }}
                    <button
                      class="ui right small primary button"
                      style="margin-top: 10px; margin-left: 10px;"
                      @click="editScript(scriptDomainPattern, index)"
                    >
                      <i class="icon-pencil" />
                      Edit
                    </button>
                    <button
                      class="ui right negative small button"
                      style="margin-top: 10px;"
                      @click="removeScript(scriptDomainPattern, index)"
                    >
                      <i class="icon-trash-empty" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
