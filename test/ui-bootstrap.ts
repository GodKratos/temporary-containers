import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { loadBackground } from './setup';
import { getPreferences as uiGetPreferences, savePreferences as uiSavePreferences } from '~/ui/shared/utils';

export interface OptionsTestEnvironment {
  background: Awaited<ReturnType<typeof loadBackground>>;
  ensureSection: (id: string) => HTMLElement;
  loadSection: (id: string, init: () => Promise<void>) => Promise<void>;
  getPreferences: typeof uiGetPreferences;
  savePreferences: typeof uiSavePreferences;
  toggleCheckbox: (id: string, value: boolean) => Promise<void>;
  setSelectValue: (id: string, value: string) => Promise<void>;
  initAllOptionPages: () => Promise<void>;
  loadOptionPage: (pageId: string) => Promise<void>;
}

// Generic bootstrap for any options page UI. Creates a predictable DOM root, stubs i18n,
// and patches runtime messaging so shared utils (getPreferences/savePreferences) operate
// against the in-memory background preference/state objects while still invoking
// preferences.handleChanges for side effects (icon updates, popup toggle, etc.).
export async function bootstrapOptionsUI(providedBackground?: Awaited<ReturnType<typeof loadBackground>>): Promise<OptionsTestEnvironment> {
  const background = providedBackground || (await loadBackground({ initialize: true }));

  // Base DOM scaffold (can be extended by pages). Keep id="options-root" for future styling/tests.
  if (!document.getElementById('options-root')) {
    document.body.innerHTML = '<div id="options-root"></div>';
  }

  // Stub i18n once – return key if not found so assertions can still reference keys.
  if (!(browser.i18n.getMessage as any).isSinonProxy) {
    (browser.i18n.getMessage as sinon.SinonStub).callsFake((k: string) => k);
  }

  // Patch runtime.sendMessage only once for preferences interaction.
  if (!(browser.runtime.sendMessage as any)._uiPatched) {
    const originalSend = browser.runtime.sendMessage as any;
    (browser.runtime.sendMessage as any)._uiPatched = true;
    (browser.runtime.sendMessage as any) = async (msg: any) => {
      if (msg && msg.method === 'getPreferences') {
        return background.tmp.storage.local.preferences;
      }
      if (msg && msg.method === 'savePreferences') {
        const newPrefs = msg.payload.preferences;
        const oldPreferences = JSON.parse(JSON.stringify(background.tmp.storage.local.preferences));
        background.tmp.storage.local.preferences = newPrefs;
        // keep background.tmp.pref in sync (mirrors real runtime handler order)
        (background.tmp as any).pref = newPrefs;
        await background.tmp.preferences.handleChanges({ oldPreferences, newPreferences: newPrefs });
        await background.tmp.storage.persist();
        return true;
      }
      if (msg && msg.method === 'getStorage') {
        // Return complete storage.local snapshot similar to background runtime handler
        return background.tmp.storage.local;
      }
      if (msg && msg.method === 'getPermissions') {
        // Return mock permissions for testing
        return {
          bookmarks: false,
          downloads: false,
          history: false,
          notifications: false,
          webNavigation: false,
        };
      }
      return originalSend(msg);
    };
  }

  function ensureSection(id: string): HTMLElement {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.getElementById('options-root')!.appendChild(el);
    } else {
      el.innerHTML = '';
    }
    return el;
  }

  async function loadSection(id: string, init: () => Promise<void>): Promise<void> {
    ensureSection(id);
    await init();
  }

  async function toggleCheckbox(id: string, value: boolean): Promise<void> {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) throw new Error(`Checkbox #${id} not found`);
    if (el.checked !== value) {
      el.checked = value;
      el.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    }
  }

  async function setSelectValue(id: string, value: string): Promise<void> {
    const el = document.getElementById(id) as HTMLSelectElement | null;
    if (!el) throw new Error(`Select #${id} not found`);
    if (el.value !== value) {
      el.value = value;
      el.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    }
  }

  return {
    background,
    ensureSection,
    loadSection,
    getPreferences: uiGetPreferences,
    savePreferences: uiSavePreferences,
    toggleCheckbox,
    setSelectValue,
    initAllOptionPages: async () => {
      const pagesDir = path.join(process.cwd(), 'src', 'ui', 'pages');
      if (!fs.existsSync(pagesDir)) return;
      const entries = fs.readdirSync(pagesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const dirName = entry.name; // e.g. General, IsolationGlobal, etc.
        const modulePath = `~/ui/pages/${dirName}/index`;
        try {
          const mod: any = await import(modulePath);
          for (const exportName of Object.keys(mod)) {
            if (/^init.+Page$/.test(exportName)) {
              const pageBase = exportName.replace(/^init/, '').replace(/Page$/, '');
              const elementId = pageBase.charAt(0).toLowerCase() + pageBase.slice(1); // General -> general
              ensureSection(elementId);
              await mod[exportName]();
            }
          }
        } catch (_e) {
          // ignore missing index modules or load errors silently for now
        }
      }
    },
    loadOptionPage: async (pageId: string) => {
      // pageId should match element id e.g. 'general'
      const dirName = pageId.charAt(0).toUpperCase() + pageId.slice(1);
      const modulePath = `~/ui/pages/${dirName}/index`;
      const mod: any = await import(modulePath);
      const initExport = Object.keys(mod).find(k => k.toLowerCase() === `init${pageId.toLowerCase()}page`);
      if (!initExport) throw new Error(`No init function found for page '${pageId}'`);
      ensureSection(pageId);
      await mod[initExport]();
    },
  };
}
