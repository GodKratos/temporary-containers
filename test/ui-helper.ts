import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import { loadBackground } from './setup';

export interface LoadedUI {
  dispose: () => void;
}

export async function loadOptionsGeneral(providedBackground?: Awaited<ReturnType<typeof loadBackground>>) {
  const background = providedBackground || (await loadBackground({ initialize: true }));
  // Minimal HTML scaffold for the General page checkbox we care about.
  // In the real app this is dynamically injected; for the test we only need the element + script behavior.
  document.body.innerHTML = `
    <div id="content">
      <input type="checkbox" id="browserActionPopup" name="browserActionPopup" />
      <label for="browserActionPopup" data-i18n="optionsGeneralToolbarPopup">Show popup when clicking the toolbar icon</label>
    </div>`;

  // Stub i18n if not already
  if (!(browser.i18n.getMessage as any).isSinonProxy) {
    (browser.i18n.getMessage as sinon.SinonStub).callsFake(k => k);
  }

  // Import the real General page module (it attaches listeners)
  const mod = await import('~/ui/pages/General/index');
  // Simulate the app bootstrapping that sets preferences globally
  // Mirror how pages expect a global app with current preferences.
  (window as any).app = { preferences: background.tmp.pref };

  // Monkey-patch savePref used inside General page script if it reads from global scope.
  // If the module defines its own savePref we rely on that; otherwise provide a fallback
  if (!(window as any).savePref) {
    (window as any).savePref = async (key: string, value: any) => {
      const oldPreferences = { ...(background.tmp.pref as any) };
      (background.tmp.preferences.defaults as any)[key] = value;
      // Persist into storage mirror
      (background.tmp.storage.local.preferences as any)[key] = value;
      await background.tmp.storage.persist();
      await background.tmp.preferences.handleChanges({
        oldPreferences: oldPreferences as any,
        newPreferences: background.tmp.preferences.defaults as any,
      });
    };
  }

  // Patch runtime.sendMessage for getPreferences/savePreferences calls originating from UI shared utils
  if (!(browser.runtime.sendMessage as any)._uiPatchedGeneral) {
    const originalSend = browser.runtime.sendMessage as any;
    (browser.runtime.sendMessage as any)._uiPatchedGeneral = true;
    (browser.runtime.sendMessage as any) = async (msg: any) => {
      if (msg && msg.method === 'getPreferences') {
        return background.tmp.storage.local.preferences;
      }
      if (msg && msg.method === 'savePreferences') {
        const newPrefs = msg.payload.preferences;
        const oldPreferences = JSON.parse(JSON.stringify(background.tmp.storage.local.preferences));
        background.tmp.storage.local.preferences = newPrefs;
        await background.tmp.preferences.handleChanges({ oldPreferences, newPreferences: newPrefs });
        await background.tmp.storage.persist();
        return true;
      }
      return originalSend(msg);
    };
  }

  return { background, mod };
}
