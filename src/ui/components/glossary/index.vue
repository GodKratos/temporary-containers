<script lang="ts">
import { defineComponent, ref, onMounted, watch, nextTick, getCurrentInstance } from 'vue';
import GlossaryLink from './link.vue';

interface GlossaryDefaults {
  origin: string;
  active: string;
  section: string;
  history: string[];
  historyPosition: number;
}

const glossaryDefaults = (): GlossaryDefaults => ({
  origin: '',
  active: '',
  section: '',
  history: [],
  historyPosition: 0,
});

export default defineComponent({
  components: {
    GlossaryLink,
  },
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const createdElements = ref<HTMLSpanElement[]>([]);
    const origin = ref('');
    const active = ref('');
    const section = ref('');
    const history = ref<string[]>([]);
    const historyPosition = ref(0);

    const initialize = () => {
      $('[data-glossary]').each((idx, element) => {
        if (element.dataset.glossaryLabel !== '' && element.dataset.glossary) {
          const infoText = document.createElement('span');
          infoText.textContent =
            element.dataset.glossaryLabel || element.dataset.glossary;
          if (infoText.textContent) {
            infoText.id = 'glossaryText';
            element.appendChild(infoText);
          }
          createdElements.value.push(infoText);
        }

        const infoIcon = document.createElement('i');
        infoIcon.className =
          'icon-info-circled opaque-info-circle glossary-help';
        element.appendChild(infoIcon);
        createdElements.value.push(infoIcon);

        let iconHovered = false;
        $(infoIcon).hover(
          () => {
            iconHovered = true;
            $(element).popup('show');
          },
          () => {
            iconHovered = false;
          }
        );
        $(infoIcon).click((event) => {
          event.stopPropagation();
          event.preventDefault();

          $(element).popup('show');
        });

        $(element).popup({
          popup: '.glossary.ui.popup',
          hoverable: true,
          position: 'bottom left',

          onShow: (popupElement) => {
            if (!iconHovered) {
              return false;
            }

            const glossary = ((popupElement as unknown) as HTMLElement).dataset
              .glossary;
            if (!glossary) {
              return;
            }
            origin.value = active.value = glossary;

            const glossaryRef = document.querySelector('.glossary') as HTMLElement;
            const glossaryContainer = document.querySelector('.glossary-container') as HTMLElement;

            if (['Automatic Mode', 'Toolbar Popup'].includes(origin.value)) {
              glossaryRef.style.minHeight = 'unset';
              glossaryRef.style.maxHeight = 'unset';
              glossaryContainer.style.minWidth = '450px';
              glossaryContainer.style.maxWidth = '450px';
            } else {
              glossaryRef.style.minHeight = '';
              glossaryRef.style.maxHeight = '';
              glossaryContainer.style.minWidth = '';
              glossaryContainer.style.maxWidth = '';
            }
          },

          onVisible: () => {
            if (['Global', 'Per Domain'].includes(origin.value)) {
              section.value = origin.value;
            } else if (element.dataset.glossarySection) {
              section.value = element.dataset.glossarySection;
            }

            history.value.push(origin.value);

            nextTick(() => {
              $(element).popup('reposition');
            });
          },

          onHidden: () => {
            Object.assign({ origin, active, section, history, historyPosition }, glossaryDefaults());
          },
        });
      });
    };

    const show = (target: string) => {
      if (history.value.length - 1 > historyPosition.value) {
        history.value.splice(historyPosition.value + 1);
      }
      history.value.push(target);
      historyPosition.value = history.value.length - 1;

      active.value = target;
    };

    const historyBack = () => {
      active.value = history.value[--historyPosition.value];
    };

    const historyForward = () => {
      active.value = history.value[++historyPosition.value];
    };

    const external = (url: string) => {
      browser.tabs.create({
        url,
      });
    };

    const stop = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
    };

    const cleanup = () => {
      createdElements.value.map((created) => {
        created.remove();
      });
    };

    watch(
      () => props.app,
      (newApp) => {
        if (!newApp.initialized) {
          cleanup();
          return;
        }

        nextTick(() => {
          window.setTimeout(() => {
            initialize();
          }, 100);
        });
      }
    );

    onMounted(() => {
      const root = getCurrentInstance()?.proxy;
      root?.$root.$on('show', (target: string) => {
        show(target);
      });
    });

    return {
      createdElements,
      origin,
      active,
      section,
      history,
      historyPosition,
      initialize,
      show,
      historyBack,
      historyForward,
      external,
      stop,
      cleanup,
    };
  },
});
</script>

<style>
.glossary {
  min-height: 360px;
  max-height: 360px;
  cursor: auto;
  user-select: text;
}
.glossary-container {
  min-width: 320px;
  max-width: 320px;
}
.glossary-help {
  cursor: help;
}
.glossary-link {
  cursor: pointer;
  color: #2185d0;
}
.glossary-history-btn {
  cursor: pointer;
  opacity: 1 !important;
}
.glossary-history-btn-inactive {
  opacity: 0.2 !important;
}
.glossary-header {
  display: flex;
  font-size: 12px;
  padding: 10px 10px 5px 10px;
}
.glossary-header-title {
  font-weight: bold;
  flex-grow: 1;
}
.glossary-content {
  padding: 10px;
}
ul {
  margin-left: 10px;
  padding-left: 10px;
}
.opaque-info-circle {
  color: #2185d0;
  opacity: 0.6;
}
.opaque-info-circle:hover {
  opacity: 1;
}
</style>

<template>
  <div
    v-if="app.initialized"
    ref="glossary"
    class="ui popup glossary"
    style="padding: 0;"
    @click="stop"
  >
    <div ref="glossaryContainer" class="glossary-container">
      <div class="glossary-header">
        <span class="glossary-header-title">{{ active || origin }}</span>
        <span v-if="!['Automatic Mode', 'Toolbar Popup'].includes(origin)">
          <i
            v-if="historyPosition"
            class="angle left icon glossary-history-btn"
            @click="historyBack"
          />
          <i v-else class="angle left icon glossary-history-btn-inactive" />
          <i
            v-if="history.length > 1 && historyPosition < history.length - 1"
            class="angle right icon glossary-history-btn"
            @click="historyForward"
          />
          <i v-else class="angle right icon glossary-history-btn-inactive" />
        </span>
      </div>
      <div class="ui divider" style="margin: 0;" />
      <div class="glossary-content">
        <div v-show="active === 'Navigation'">
          Opening <GlossaryLink to="Target Domain" text="Target Domains" /> in
          tabs, or new tabs, through e.g. address bar or
          <GlossaryLink to="Mouse Click" />
          <ul>
            <li v-if="section === 'Per Domain'">
              <GlossaryLink to="Use Global" />
            </li>
            <li><GlossaryLink to="Never" /></li>
            <li>
              <GlossaryLink to="Different from Tab Domain & Subdomains" />
            </li>
            <li><GlossaryLink to="Different from Tab Domain" /></li>
            <li><GlossaryLink to="Always" /></li>
          </ul>
        </div>

        <div v-show="active === 'Mouse Click'">
          Clicking links on websites in <GlossaryLink to="Current Tab" /> which
          result in <GlossaryLink to="Navigation" /> to
          <GlossaryLink to="Target Domain" /><br />
          <ul>
            <li v-if="section === 'Per Domain'">
              <GlossaryLink to="Use Global" />
            </li>
            <li><GlossaryLink to="Never" /></li>
            <li>
              <GlossaryLink to="Different from Tab Domain & Subdomains" />
            </li>
            <li><GlossaryLink to="Different from Tab Domain" /></li>
            <li><GlossaryLink to="Always" /></li>
          </ul>
          <div style="font-size: 12px;">
            Note: With Navigation Isolation configured, you don't need to
            configure Mouse Click additionally. Also, not every Mouse Click can
            get catched, since some websites execute arbitrary logic
            (JavaScript) on Mouse Click
          </div>
        </div>

        <div v-show="active === 'Current Tab'">
          Active/Selected tab
        </div>

        <div v-show="active === 'Target Domain'">
          <GlossaryLink to="Domain" /> which a tab
          <GlossaryLink to="Navigation" text="navigates" /> to
        </div>
        <div v-show="active === 'Isolation'">
          Cancel <GlossaryLink to="Navigation" /> and open
          <GlossaryLink to="Target Domain" /> in new Temporary Container tab
        </div>

        <div v-show="active === 'Global'">
          Configurations apply to all tabs and result in
          <GlossaryLink to="Isolation" /> if they match
          <ul>
            <li><GlossaryLink to="Navigation" /></li>
            <li><GlossaryLink to="Mouse Click" /></li>
            <li><GlossaryLink to="Exclude Permanent Containers" /></li>
            <li><GlossaryLink to="Exclude Target Domains" /></li>
          </ul>
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Global-Isolation'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Per Domain'">
          Configurations that apply if the
          <GlossaryLink to="Target Domain" /> matches the
          <GlossaryLink to="Domain Pattern" />
          <ul>
            <li><GlossaryLink to="Always open in" /></li>
          </ul>
          <br />
          Configurations that apply if the
          <GlossaryLink to="Tab Domain" /> matches the
          <GlossaryLink to="Domain Pattern" />
          <ul>
            <li><GlossaryLink to="Navigation" /></li>
            <li><GlossaryLink to="Mouse Click" /></li>
            <li><GlossaryLink to="Exclude Target Domains" /></li>
          </ul>
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Domain'">
          "Web address", e.g. "example.com" or "www.example.com"
        </div>

        <div v-show="active === 'Subdomain'">
          "Deeper levels" of a <GlossaryLink to="Domain" />, e.g.
          "sub.example.com" or "foo.bar.example.com"
        </div>

        <div v-show="active === 'Tab Domain'">
          <GlossaryLink to="Domain" /> currently loaded in a tab
        </div>

        <div v-show="active === 'Never'">
          Never matches and hence never results in
          <GlossaryLink to="Isolation" />
        </div>

        <div v-show="active === 'Different from Tab Domain & Subdomains'">
          <GlossaryLink to="Target Domain" /> is different from the
          <GlossaryLink to="Tab Domain" /> and its
          <GlossaryLink to="Subdomain" text="Subdomains" />
        </div>

        <div v-show="active === 'Different from Tab Domain'">
          <GlossaryLink to="Target Domain" /> is different from the
          <GlossaryLink to="Tab Domain" />
        </div>

        <div v-show="active === 'Always'">
          Matches every <GlossaryLink to="Navigation" /><br />
          <br />
          <div style="font-size: 12px;">
            Note: Not every on-website navigation is an actual navigation that
            can be detected by the Add-on. This happens if websites load content
            dynamically (with JavaScript), which is done often nowadays.
          </div>
        </div>

        <div v-show="['Domain Pattern', 'Exclusion Pattern'].includes(active)">
          Can be one of <GlossaryLink to="Domain" />,
          <GlossaryLink to="Subdomain" />,
          <GlossaryLink to="Glob/Wildcard" /> or (advanced)
          <GlossaryLink to="RegExp" />
        </div>

        <div v-show="active === 'Permanent Containers'">
          All containers that are neither Temporary nor the
          <GlossaryLink to="Default Container" />
        </div>

        <div v-show="active === 'Default Container'">
          "No Container"
        </div>

        <div v-show="active === 'Use Global'">
          Use the Global configuration accordingly
        </div>

        <div v-show="active === 'Exclude Permanent Containers'">
          <GlossaryLink to="Navigation" text="Navigations" /> in
          <GlossaryLink to="Permanent Containers" /> added here will
          <GlossaryLink to="Never" /> result in
          <GlossaryLink to="Isolation" />
        </div>

        <div v-show="active === 'Exclude Target Domains'">
          <GlossaryLink to="Navigation" text="Navigations" /> to
          <GlossaryLink to="Target Domain" text="Target Domains" /> matching
          the
          <GlossaryLink to="Exclusion Pattern" text="Exclusion Patterns" />
          added here will <GlossaryLink to="Never" /> result in
          <GlossaryLink to="Isolation" />
        </div>

        <div v-show="active === 'Glob/Wildcard'">
          e.g. <strong>*.example.com</strong> - means all example.com subdomains
          <br /><br />
          <strong>*.example.com</strong> would not match
          <strong>example.com</strong>, so you might need two
          <GlossaryLink to="Domain Pattern" text="Domain Patterns" />.
        </div>

        <div v-show="active === 'RegExp'">
          Parsed as RegExp when<br />
          <strong>/pattern/flags</strong><br />
          is given and matches the full URL instead of just
          <GlossaryLink to="Domain" />.
        </div>

        <div v-show="active === 'Always open in'">
          <strong>Enabled:</strong>
          <GlossaryLink to="Navigation" text="Navigations" /> where any of the
          following matches will get
          <GlossaryLink to="Isolation" text="isolated" />
          <ul>
            <li>Originates from a new tab</li>
            <li>
              <GlossaryLink to="Target Domain" /> doesn't match Domain Pattern
              and is different from the
              <GlossaryLink to="Tab Domain" />
            </li>
            <li>
              Current container is <GlossaryLink to="Default Container" />
            </li>
          </ul>
          <br />
          <strong>Disabled:</strong> No effect
        </div>

        <div v-show="active === 'Multi-Account Containers'">
          This applies to the
          <a
            href="#"
            @click="
              external(
                'https://addons.mozilla.org/firefox/addon/multi-account-containers/'
              )
            "
          >
            MAC Add-on <i class="linkify icon" /> </a
          >, which needs to be installed and configured for this to work. It's
          not related to Per Domain Always open in.
          <br />
          <br />
          <strong>Enabled:</strong>
          <GlossaryLink to="Navigation" text="Navigations" /> in
          <GlossaryLink to="Permanent Containers" /> whose
          <GlossaryLink to="Target Domain" /> isn't MAC-"Always open in"
          assigned to that container get
          <GlossaryLink to="Isolation" text="isolated" />
          <br />
          <br />
          <strong>Disabled:</strong> No effect
          <br />
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Multi-Account-Containers-Isolation'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Toolbar Popup'">
          The popup lets you
          <ul>
            <li>Open new Temporary Container</li>
            <li>Open Preferences/Options</li>
            <li>Configure Isolation</li>
            <li>Disable/Enable Isolation globally</li>
            <li>Open current tab URL in new Temporary Container</li>
            <li>Convert Temporary to Permanent Container</li>
            <li>Convert Permanent to Temporary Container</li>
            <li>View Statistics</li>
            <li v-show="app.permissions.history">
              Open current tab URL in new "Deletes History Temporary Container"
            </li>
            <li v-show="app.permissions.history">
              Open new "Deletes History Temporary Container
            </li>
          </ul>
          <span style="font-size: 13px;">
            Note: You can change the default popup tab in the Advanced
            preferences
          </span>
        </div>

        <div v-show="active === 'Automatic Mode'">
          Automatically reopen tabs in new Temporary Containers when
          <ul>
            <li>Opening a new tab</li>
            <li>Tab tries to load a website in no container</li>
            <li>External program opens a link in the browser</li>
          </ul>
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Automatic-Mode'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
