import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initExportImportPage } from '~/ui/pages/ExportImport/index';

function flush(times = 8) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

function createSyncStorageMock(initialStore: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initialStore));
  const getUtf8Size = (value: string) => new Blob([value]).size;

  const get = async (arg?: string | string[] | Record<string, unknown>) => {
    if (typeof arg === 'string') {
      return store.has(arg) ? { [arg]: store.get(arg) } : {};
    }

    if (Array.isArray(arg)) {
      return arg.reduce<Record<string, unknown>>((accumulator, key) => {
        if (store.has(key)) {
          accumulator[key] = store.get(key);
        }
        return accumulator;
      }, {});
    }

    if (arg && typeof arg === 'object') {
      return Object.keys(arg).reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = store.has(key) ? store.get(key) : arg[key];
        return accumulator;
      }, {});
    }

    return Object.fromEntries(store.entries());
  };

  const set = async (items: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(items)) {
      const bytes = getUtf8Size(`${key}${JSON.stringify(value)}`);
      if (bytes > 8192) {
        throw new Error('QuotaExceededError: storage.sync API call exceeded its quota limitations.');
      }
    }

    for (const [key, value] of Object.entries(items)) {
      store.set(key, value);
    }
  };

  const remove = async (keys: string | string[]) => {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      store.delete(key);
    }
  };

  const clear = async () => {
    store.clear();
  };

  return {
    store,
    get,
    set,
    remove,
    clear,
  };
}

describe('UI ExportImport: core interactions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;
  let syncStorage: ReturnType<typeof createSyncStorageMock>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
    syncStorage = createSyncStorageMock();
    (browser.storage.sync.get as sinon.SinonStub).callsFake(syncStorage.get);
    (browser.storage.sync.set as sinon.SinonStub).callsFake(syncStorage.set);
    (browser.storage.sync.remove as sinon.SinonStub).callsFake(syncStorage.remove);
    (browser.storage.sync.clear as sinon.SinonStub).callsFake(syncStorage.clear);
  });

  async function setup() {
    const ui = await bootstrapOptionsUI(background);
    await ui.loadSection('export-import', initExportImportPage);
    return ui;
  }

  it('denies downloads permission and aborts file export', async () => {
    await setup();
    (browser.permissions.request as sinon.SinonStub).resolves(false);
    (browser.permissions.contains as sinon.SinonStub).resolves(false);
    const exportBtn = document.getElementById('exportSettings') as HTMLButtonElement;
    exportBtn.click();
    await flush(12);
    // preferences should be untouched
    expect(background.tmp.storage.local.preferences).to.be.ok;
    // scripts.active should remain default false; (sanity check some preference not altered by export)
    expect((background.tmp.storage.local.preferences as any).scripts?.active || false).to.equal(false);
  });

  it('exports to Firefox Sync successfully across multiple sync items', async () => {
    await setup();
    (background.tmp.storage.local.preferences as any).debugPayload = 'x'.repeat(12000);
    const btn = document.getElementById('exportToFirefoxSync') as HTMLButtonElement;
    btn.click();
    await flush(15);
    expect(syncStorage.store.has('exportMeta')).to.equal(true);
    expect(syncStorage.store.has('export')).to.equal(false);
    const chunkKeys = [...syncStorage.store.keys()].filter(key => key.startsWith('exportChunk_'));
    expect(chunkKeys.length).to.be.greaterThan(1);
    const exportMeta = syncStorage.store.get('exportMeta') as { chunkCount: number };
    expect(exportMeta.chunkCount).to.equal(chunkKeys.length);
  });

  it('imports from legacy Firefox Sync export with confirmation accepted', async () => {
    await setup();
    const now = Date.now();
    syncStorage.store.set('export', { date: now, version: '1.0', preferences: background.tmp.storage.local.preferences });
    try {
      Object.defineProperty(window, 'confirm', { value: () => true, configurable: true });
    } catch {
      (window as any).confirm = () => true;
    }
    const btn = document.getElementById('importFromFirefoxSync') as HTMLButtonElement;
    btn.click();
    await flush(12);
    // expect preferences object still valid (import path executed w/o error)
    expect(background.tmp.storage.local.preferences).to.be.ok;
  });

  it('wipe Firefox Sync export removes only export keys', async () => {
    const chunkedExport = {
      version: '1.2.3',
      date: Date.now(),
      preferences: { keep: true },
    };
    const serializedExport = JSON.stringify(chunkedExport);
    syncStorage.store.set('exportMeta', { date: chunkedExport.date, version: chunkedExport.version, chunkCount: 2 });
    syncStorage.store.set('exportChunk_0', serializedExport.slice(0, Math.ceil(serializedExport.length / 2)));
    syncStorage.store.set('exportChunk_1', serializedExport.slice(Math.ceil(serializedExport.length / 2)));
    syncStorage.store.set('otherKey', { preserved: true });

    await setup();
    await initExportImportPage();
    await flush(6);
    const info = document.getElementById('lastSyncExportInfo') as HTMLElement;
    expect(info.style.display).to.equal('block');
    const removeSpy = browser.storage.sync.remove as sinon.SinonStub;
    const clearSpy = browser.storage.sync.clear as sinon.SinonStub;
    try {
      Object.defineProperty(window, 'confirm', { value: () => true, configurable: true });
    } catch {
      (window as any).confirm = () => true;
    }
    const wipe = document.getElementById('wipeFirefoxSyncExport') as HTMLButtonElement;
    wipe?.click();
    await flush(10);
    expect(clearSpy.called).to.equal(false);
    expect(removeSpy.called).to.equal(true);
    expect(syncStorage.store.has('otherKey')).to.equal(true);
    expect(syncStorage.store.has('exportMeta')).to.equal(false);
    expect(syncStorage.store.has('exportChunk_0')).to.equal(false);
    expect(syncStorage.store.has('exportChunk_1')).to.equal(false);
    // re-init should have been triggered inside logic; ensure hidden
    await initExportImportPage();
    await flush(6);
    expect(info.style.display === 'none' || info.getAttribute('style')?.includes('display: none')).to.equal(true);
  });
});
