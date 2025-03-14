<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import Draggable from 'vuedraggable';
import DomainPattern from '../domainpattern.vue';
import Settings from './settings.vue';
import { App } from '~/ui/root';
import { mixin } from '~/ui/mixin';
import { IsolationDomain } from '~/types';

const domainDefaults = {
  pattern: '',
  always: {
    action: 'disabled',
    allowedInPermanent: false,
    allowedInTemporary: false,
  },
  navigation: {
    action: 'global',
  },
  mouseClick: {
    middle: {
      action: 'global',
    },
    ctrlleft: {
      action: 'global',
    },
    left: {
      action: 'global',
    },
  },
  excluded: {},
};

interface UIIsolationDomain extends IsolationDomain {
  _index: number;
}

export default defineComponent({
  components: {
    DomainPattern,
    Settings,
    Draggable,
  },

  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },

  setup(props) {
    const preferences = props.app.preferences;
    const popup = props.app.popup;
    const domain = ref({ ...domainDefaults });
    const excludeDomainPattern = ref('');
    const isolationDomainFilter = ref('');
    const editing = ref(false);
    const show = ref(false);
    const saved = ref(false);
    const empty = ref(true);
    const editClicked = ref(false);

    const isolationDomains = computed(() => {
      return preferences.isolation.domain.reduce(
        (accumulator: UIIsolationDomain[], isolated, index) => {
          if (!isolated.pattern.includes(isolationDomainFilter.value)) {
            return accumulator;
          }
          accumulator.push({ ...isolated, _index: index });
          return accumulator;
        },
        []
      );
    });

    watch(domain, (newDomain) => {
      if (editing.value && !newDomain.pattern.trim()) {
        editing.value = false;
        domain.value = { ...domainDefaults };
        const domainIndex = preferences.isolation.domain.findIndex(
          (isolatedDomain) => !isolatedDomain.pattern.trim()
        );
        preferences.isolation.domain.splice(domainIndex, 1);
      } else if (
        !editing.value &&
        preferences.isolation.domain.find(
          (_domain) => _domain.pattern === newDomain.pattern
        )
      ) {
        $('#isolationDomainForm').form('validate form');
      } else if (editing.value) {
        if (editClicked.value) {
          editClicked.value = false;
        } else {
          saved.value = true;
          setTimeout(() => {
            saved.value = false;
          }, 1500);
        }
      }
      empty.value = false;
    }, { deep: true });

    const reset = () => {
      domain.value = { ...domainDefaults };
      domain.value.pattern = '';
      nextTick(() => {
        empty.value = true;
      });

      if (!preferences.ui.expandPreferences) {
        $('#isolationPerDomainAccordion').accordion('close', 0);
        $('#isolationPerDomainAccordion').accordion('close', 1);
        $('#isolationPerDomainAccordion').accordion('close', 2);
        $('#isolationPerDomainAccordion').accordion('close', 3);
      }
      resetDropdowns();
    };

    const resetDropdowns = () => {
      $('#isolationDomain .ui.dropdown').dropdown('destroy');
      nextTick(() => {
        $('#isolationDomain .ui.dropdown').dropdown();
      });
    };

    const edit = (index: number) => {
      editClicked.value = true;
      editing.value = true;
      domain.value = preferences.isolation.domain[index];
      resetDropdowns();

      if (!preferences.ui.expandPreferences) {
        domain.value.always.action === domainDefaults.always.action
          ? $('#isolationPerDomainAccordion').accordion('close', 0)
          : $('#isolationPerDomainAccordion').accordion('open', 0);

        domain.value.navigation.action === domainDefaults.navigation.action
          ? $('#isolationPerDomainAccordion').accordion('close', 1)
          : $('#isolationPerDomainAccordion').accordion('open', 1);

        domain.value.mouseClick.middle.action ===
          domainDefaults.mouseClick.middle.action &&
        domain.value.mouseClick.ctrlleft.action ===
          domainDefaults.mouseClick.ctrlleft.action &&
        domain.value.mouseClick.left.action ===
          domainDefaults.mouseClick.left.action
          ? $('#isolationPerDomainAccordion').accordion('close', 2)
          : $('#isolationPerDomainAccordion').accordion('open', 2);

        !Object.keys(domain.value.excluded).length
          ? $('#isolationPerDomainAccordion').accordion('close', 3)
          : $('#isolationPerDomainAccordion').accordion('open', 3);
      }
    };

    const remove = (index: number, pattern: string) => {
      if (
        window.confirm(
          t('optionsIsolationPerDomainRemoveConfirmation', pattern)
        )
      ) {
        preferences.isolation.domain.splice(index, 1);
        if (editing.value && domain.value.pattern === pattern) {
          reset();
          editing.value = false;
        }
      }
    };

    const removeExcludedDomain = (excludedDomainPattern: string) => {
      delete domain.value.excluded[excludedDomainPattern];
    };

    const expandIsolationDomainFilter = (event: Event) => {
      if (!popup) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (
        $('#isolationDomainsAccordion > div > div.title').hasClass('active')
      ) {
        return;
      }
      setTimeout(() => {
        $('#isolationDomainsAccordion').accordion('open', 0);
      }, 200);
    };

    const move = (event: { moved: { oldIndex: number; newIndex: number } }) => {
      if (event.moved) {
        preferences.isolation.domain.splice(
          event.moved.newIndex,
          0,
          preferences.isolation.domain.splice(event.moved.oldIndex, 1)[0]
        );
      }
    };

    const focusIsolationDomainFilter = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      (refs.isolationDomainFilter as HTMLElement).focus();
    };

    return {
      preferences,
      popup,
      domain,
      excludeDomainPattern,
      isolationDomainFilter,
      editing,
      show,
      saved,
      empty,
      editClicked,
      isolationDomains,
      reset,
      resetDropdowns,
      edit,
      remove,
      removeExcludedDomain,
      expandIsolationDomainFilter,
      move,
      focusIsolationDomainFilter,
    };
  },

  mounted() {
    nextTick(() => {
      $('#isolationDomain .ui.accordion').accordion({
        ...(this.popup
          ? {
              animateChildren: false,
              duration: 0,
            }
          : {}),
        exclusive: false,
      });

      $('#isolationDomain .ui.dropdown').dropdown();
      $('#isolationDomain .ui.checkbox').checkbox();

      this.show = true;
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    $(document).form.settings.rules!.domainPattern = (
      value: string
    ): boolean => {
      if (this.editing) {
        this.reset();
        return true;
      } else {
        return !this.preferences.isolation.domain.find(
          (domain) => domain.pattern === value
        );
      }
    };

    $('#isolationDomainForm').form({
      inline: true,
      fields: {
        isolationDomainPattern: {
          rules: [
            {
              type: 'empty',
              prompt: this.t('optionsIsolationPerDomainPatternNoEmpty'),
            },
            {
              type: 'domainPattern',
              prompt: this.t('optionsIsolationPerDomainPatternExists'),
            },
          ],
        },
      },
      onSuccess: (event) => {
        if (event) {
          event.preventDefault();
        }

        if (this.editing) {
          this.reset();
          this.editing = false;
        } else {
          this.domain.pattern = this.domain.pattern.trim();
          this.preferences.isolation.domain.push(this.clone(this.domain));
          this.reset();
        }
      },
    });

    $('#isolationDomainExcludeDomainsForm').form({
      fields: {
        isolationDomainExcludeDomainPattern: 'empty',
      },
      onSuccess: (event) => {
        event.preventDefault();
        this.$set(this.domain.excluded, this.excludeDomainPattern, {});
        this.excludeDomainPattern = '';
      },
    });

    if (this.popup) {
      if (!this.app.activeTab?.url.startsWith('http')) {
        return;
      }
      const isolationDomainIndex = this.preferences.isolation.domain.findIndex(
        (domain) => domain.pattern === this.app.activeTab?.parsedUrl.hostname
      );
      if (isolationDomainIndex >= 0) {
        this.edit(isolationDomainIndex);
      } else {
        this.domain.pattern = this.app.activeTab.parsedUrl.hostname;
      }
    }
  },

});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <div v-show="show" id="isolationDomain">
    <div class="ui form">
      <form id="isolationDomainForm">
        <domain-pattern
          id="isolationDomainPattern"
          :tooltip="!popup ? undefined : { hidden: true }"
          v-model:domain-pattern="domain.pattern"
        />
      </form>
      <div
        id="isolationPerDomainAccordion"
        style="margin-top: 15px;"
        :style="empty ? 'opacity: 0.3; pointer-events: none' : ''"
        class="ui accordion"
      >
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ t('optionsIsolationPerDomainAlwaysOpenIn') }}
          </h4>
        </div>
        <div
          class="content"
          :class="{ 'ui segment': !popup, 'popup-margin': popup }"
        >
          <div>
            <select
              id="isolationDomainAlways"
              v-model="domain.always.action"
              class="ui fluid dropdown"
            >
              <option value="disabled">
                {{ t('optionsIsolationDisabled') }}
              </option>
              <option value="enabled">
                {{ t('optionsIsolationEnabled') }}
              </option>
            </select>
            <div v-show="domain.always.action === 'enabled'">
              <div class="ui checkbox" style="margin-top: 14px;">
                <input
                  v-model="domain.always.allowedInPermanent"
                  type="checkbox"
                />
                <label>
                  {{
                    !popup
                      ? t('optionsIsolationPerDomainDisableIfNavPermContainer')
                      : t('optionsIsolationPerDomainDisableIfPermContainer')
                  }}
                </label>
              </div>
              <div />
              <div class="ui checkbox" style="margin-top: 14px;">
                <input
                  v-model="domain.always.allowedInTemporary"
                  type="checkbox"
                />
                <label>
                  {{
                    !popup
                      ? t('optionsIsolationPerDomainDisableIfNavTempContainer')
                      : t('optionsIsolationPerDomainDisableIfTempContainer')
                  }}
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ t('optionsIsolationNavigation') }}
          </h4>
        </div>
        <div
          class="content"
          :class="{ 'ui segment': !popup, 'popup-margin': popup }"
        >
          <settings
            :label="t('optionsIsolationTargetDomain')"
            :perdomain="true"
            v-model:action="domain.navigation.action"
          />
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ t('optionsIsolationMouseClick') }}
          </h4>
        </div>
        <div
          class="content"
          :class="{ 'ui segment': !popup, 'popup-margin': popup }"
        >
          <settings
            :label="t('optionsIsolationMouseClickMiddleMouse')"
            :perdomain="true"
            v-model:action="domain.mouseClick.middle.action"
          />
          <settings
            :label="t('optionsIsolationMouseClickCtrlLeftMouse')"
            :perdomain="true"
            v-model:action="domain.mouseClick.ctrlleft.action"
          />
          <settings
            :label="t('optionsIsolationMouseClickLeftMouse')"
            :perdomain="true"
            v-model:action="domain.mouseClick.left.action"
          />
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ t('optionsIsolationExcludeTargetDomains') }}
          </h4>
        </div>
        <div
          class="content popup-exclude-margin"
          :class="{ 'ui segment': !popup, 'popup-margin': popup }"
        >
          <div>
            <div class="field">
              <form id="isolationDomainExcludeDomainsForm" class="ui form">
                <domain-pattern
                  id="isolationDomainExcludeDomainPattern"
                  :tooltip="
                    !popup ? { position: 'top left' } : { hidden: true }
                  "
                  v-model:domain-pattern="excludeDomainPattern"
                  :exclusion="true"
                />
                <div class="field">
                  <button class="ui button primary">
                    {{ t('optionsIsolationExclude') }}
                  </button>
                </div>
              </form>
              <div style="margin-top: 20px;">
                <div v-if="!Object.keys(domain.excluded).length">
                  {{ t('optionsIsolationNoDomainsExcluded') }}
                </div>
                <div v-else>
                  <div
                    v-for="(_, excludedDomainPattern) in domain.excluded"
                    :key="excludedDomainPattern"
                  >
                    <div style="margin-top: 5px;" />
                    <span
                      :data-tooltip="
                        t(
                          'optionsIsolationPerDomainRemove',
                          excludedDomainPattern
                        )
                      "
                      style="margin-top: 10px; color: red; cursor: pointer;"
                      @click="removeExcludedDomain(excludedDomainPattern)"
                    >
                      <i class="icon-trash-empty" />
                    </span>
                    {{ excludedDomainPattern }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br />
    <div class="field">
      <button
        form="isolationDomainForm"
        class="ui button primary"
        :disabled="!domain.pattern.trim()"
      >
        <span v-if="editing">
          <transition name="fade">
            <span>
              <span v-if="saved">
                <i class="check circle icon" />
                Saved
              </span>
              <span v-if="!saved">
                {{ t('optionsIsolationPerDomainDoneEditing', domain.pattern) }}
              </span>
            </span>
          </transition>
        </span>
        <span v-else>
          {{ t('optionsIsolationPerDomainAdd', domain.pattern) }}
        </span>
      </button>
    </div>
    <br />
    <div id="isolationDomainsAccordion" :class="{ 'ui accordion': popup }">
      <div
        v-if="!Object.keys(isolationDomains).length && !isolationDomainFilter"
        style="margin-top: 10px;"
        :class="{ content: popup }"
      >
        {{ t('optionsIsolationPerDomainNoIsolatedDomainsAdded') }}
      </div>
      <div v-else :class="{ content: popup }">
        <div :class="{ title: popup }">
          <i v-if="popup" class="dropdown icon" />
          <span
            v-if="
              Object.keys(isolationDomains).length > 1 || isolationDomainFilter
            "
            class="ui icon mini input"
            style="margin-right: 10px;"
          >
            <input
              ref="isolationDomainFilter"
              v-model="isolationDomainFilter"
              type="text"
              size="15"
              :placeholder="t('optionsIsolationPerDomainFilterIsolatedDomains')"
              @focus="expandIsolationDomainFilter"
              @click="expandIsolationDomainFilter"
            />
            <i
              class="circular search link icon"
              @click="focusIsolationDomainFilter"
            />
          </span>
          <span v-else>
            <strong>{{ t('optionsIsolationPerDomainIsolatedDomains') }}</strong>
          </span>
        </div>
        <div :class="{ content: popup }">
          <div style="margin-top: 5px;" />
          <draggable
            v-model="isolationDomains"
            group="isolationDomains"
            @change="move"
          >
            <div
              v-for="isolatedDomain in isolationDomains"
              :key="isolatedDomain.pattern"
            >
              <span
                :data-tooltip="
                  t('optionsIsolationPerDomainEdit', isolatedDomain.pattern)
                "
                style="cursor: pointer;"
                data-position="right center"
                @click="edit(isolatedDomain._index)"
              >
                <i class="icon-pencil" style="color: #2185d0;" />
              </span>
              <span
                :data-tooltip="
                  t('optionsIsolationPerDomainRemove', isolatedDomain.pattern)
                "
                data-position="right center"
                style="color: red; cursor: pointer;"
                @click="remove(isolatedDomain._index, isolatedDomain.pattern)"
              >
                <i class="icon-trash-empty" />
              </span>
              <span
                :data-tooltip="
                  !popup && isolationDomains.length > 1
                    ? t('optionsIsolationPerDomainDragTooltip')
                    : undefined
                "
                data-position="right center"
                :style="isolationDomains.length > 1 ? 'cursor: grab' : ''"
              >
                <i
                  v-if="isolationDomains.length > 1"
                  class="hand rock icon"
                  style="color: #2185d0; margin-left: 3px; opacity: 0.8;"
                />
              </span>
              {{ isolatedDomain.pattern }}
            </div>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>
