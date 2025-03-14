<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import { useMixin } from '~/ui/mixin';
import DomainPattern from '../domainpattern.vue';
import Settings from './settings.vue';
import { App } from '~/ui/root';

export default defineComponent({
  components: {
    DomainPattern,
    Settings,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  setup(props) {
    const preferences = ref(props.app.preferences);
    const storage = ref(props.app.storage);
    const popup = ref(props.app.popup);
    const show = ref(false);
    const excludeDomainPattern = ref('');

    onMounted(async () => {
      nextTick(() => {
        $('#isolationGlobal .ui.accordion').accordion({
          ...(popup.value
            ? {
                animateChildren: false,
                duration: 0,
              }
            : {}),
          exclusive: false,
        });
        $('#isolationGlobal .ui.dropdown').dropdown();
        $('#isolationGlobal .ui.checkbox').checkbox();

        $('#isolationGlobalAccordion').accordion('open', 0);

        if (
          preferences.value.isolation.global.mouseClick.middle.action !==
            'never' ||
          preferences.value.isolation.global.mouseClick.ctrlleft.action !==
            'never' ||
          preferences.value.isolation.global.mouseClick.left.action !== 'never'
        ) {
          $('#isolationGlobalAccordion').accordion('open', 1);
        }

        if (
          Object.keys(preferences.value.isolation.global.excludedContainers)
            .length
        ) {
          $('#isolationGlobalAccordion').accordion('open', 2);
        }

        if (Object.keys(preferences.value.isolation.global.excluded).length) {
          $('#isolationGlobalAccordion').accordion('open', 3);
        }

        show.value = true;
      });

      const excludeContainers: {
        name: string;
        value: string;
        selected: boolean;
      }[] = [];
      const containers = await browser.contextualIdentities.query({});
      containers.map((container) => {
        if (storage.value.tempContainers[container.cookieStoreId]) {
          return;
        }
        excludeContainers.push({
          name: container.name,
          value: container.cookieStoreId,
          selected: !!preferences.value.isolation.global.excludedContainers[
            container.cookieStoreId
          ],
        });
      });
      $('#isolationGlobalExcludeContainers').dropdown({
        placeholder: !popup.value
          ? t('optionsIsolationGlobalSelectExclusionContainers')
          : t('optionsIsolationGlobalExclusionPermanentContainers'),
        values: excludeContainers,
        onAdd: (addedContainer) => {
          if (
            preferences.value.isolation.global.excludedContainers[addedContainer]
          ) {
            return;
          }
          preferences.value.isolation.global.excludedContainers[addedContainer] = {};
        },
        onRemove: (removedContainer) => {
          delete preferences.value.isolation.global.excludedContainers[removedContainer];
        },
      });

      $('#isolationGlobalExcludeDomainsForm').form({
        fields: {
          isolationGlobalExcludeDomainPattern: 'empty',
        },
        onSuccess: (event) => {
          event.preventDefault();
          preferences.value.isolation.global.excluded[excludeDomainPattern.value] = {};
          excludeDomainPattern.value = '';
        },
      });
    });

    const removeExcludedDomain = (excludedDomainPattern: string) => {
      delete preferences.value.isolation.global.excluded[excludedDomainPattern];
    };

    return {
      preferences,
      storage,
      popup,
      show,
      excludeDomainPattern,
      removeExcludedDomain,
    };
  },
});
</script>

<template>
  <div v-show="show" id="isolationGlobal">
    <div class="ui form">
      <div id="isolationGlobalAccordion" class="ui accordion">
        <div class="field">
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
              :action.sync="preferences.isolation.global.navigation.action"
            />
          </div>
        </div>
        <div class="field">
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
              :action.sync="
                preferences.isolation.global.mouseClick.middle.action
              "
            />
            <settings
              :label="t('optionsIsolationMouseClickCtrlLeftMouse')"
              :action.sync="
                preferences.isolation.global.mouseClick.ctrlleft.action
              "
            />
            <settings
              :label="t('optionsIsolationMouseClickLeftMouse')"
              :action.sync="preferences.isolation.global.mouseClick.left.action"
            />
          </div>
        </div>
        <div class="field">
          <div class="title">
            <h4>
              <i class="dropdown icon" />
              {{ t('optionsIsolationGlobalExcludePermanentContainers') }}
            </h4>
          </div>
          <div
            class="content"
            :class="{ 'ui segment': !popup, 'popup-margin': popup }"
          >
            <div class="field">
              <div
                id="isolationGlobalExcludeContainers"
                class="ui dropdown fluid selection multiple"
                :style="popup ? 'max-width: 280px' : ''"
              >
                <div class="text" />
                <i class="dropdown icon" />
              </div>
            </div>
          </div>
        </div>
        <div class="field">
          <div class="title">
            <h4>
              <i class="dropdown icon" />
              {{ t('optionsIsolationExcludeTargetDomains') }}
            </h4>
          </div>
          <div
            class="content"
            :class="{ 'ui segment': !popup, 'popup-margin': popup }"
          >
            <div class="field">
              <form id="isolationGlobalExcludeDomainsForm" class="ui form">
                <domain-pattern
                  id="isolationGlobalExcludeDomainPattern"
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
                <div
                  v-if="
                    !Object.keys(preferences.isolation.global.excluded).length
                  "
                >
                  {{ t('optionsIsolationNoDomainsExcluded') }}
                </div>
                <div v-else>
                  <div
                    v-for="(_, excludedDomainPattern) in preferences.isolation
                      .global.excluded"
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
                      data-position="right center"
                      style="color: red; cursor: pointer;"
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
  </div>
</template>
