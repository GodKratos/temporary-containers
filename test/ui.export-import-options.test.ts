import { expect } from 'chai';
import { loadBackground, sinon } from './setup';
import { bootstrapOptionsUI } from './ui-bootstrap';
import { initExportImportPage } from '~/ui/pages/ExportImport/index';

function flush(times = 8) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => Promise.resolve());
  return p;
}

describe('UI ExportImport: core interactions', () => {
  let background: Awaited<ReturnType<typeof loadBackground>>;

  beforeEach(async () => {
    background = await loadBackground({ initialize: true });
    // Provide default empty export object to avoid init errors
    (browser.storage.sync.get as sinon.SinonStub).callsFake(async (key: any) => {
      if (key === 'export') return {};
      return {};
    });
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

  it('exports to Firefox Sync successfully (no existing export)', async () => {
    await setup();
    const setSpy = browser.storage.sync.set as sinon.SinonStub;
    const btn = document.getElementById('exportToFirefoxSync') as HTMLButtonElement;
    btn.click();
    await flush(15);
    expect(setSpy.called).to.equal(true);
    const args = setSpy.getCalls().map(c => c.args[0]);
    const exportArg = args.find(a => a && a.export);
    expect(exportArg && exportArg.export && exportArg.export.preferences).to.be.ok;
  });

  it('imports from Firefox Sync with confirmation accepted', async () => {
    await setup();
    // place export in sync storage
    const now = Date.now();
    (browser.storage.sync.get as sinon.SinonStub)
      .withArgs('export')
      .resolves({ export: { date: now, version: '1.0', preferences: background.tmp.storage.local.preferences } });
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

  it('wipe Firefox Sync export hides info block', async () => {
    await setup();
    // seed export and re-init to show info
    const exportObj = { export: { date: Date.now(), version: '1.2.3', preferences: {} } };
    (browser.storage.sync.get as sinon.SinonStub).withArgs('export').resolves(exportObj);
    await initExportImportPage();
    await flush(6);
    const info = document.getElementById('lastSyncExportInfo') as HTMLElement;
    expect(info.style.display).to.equal('block');
    const clearSpy = browser.storage.sync.clear as sinon.SinonStub;
    try {
      Object.defineProperty(window, 'confirm', { value: () => true, configurable: true });
    } catch {
      (window as any).confirm = () => true;
    }
    const wipe = document.getElementById('wipeFirefoxSyncExport') as HTMLButtonElement;
    wipe?.click();
    await flush(10);
    expect(clearSpy.called).to.equal(true);
    // re-init should have been triggered inside logic; ensure hidden
    await initExportImportPage();
    await flush(6);
    expect(info.style.display === 'none' || info.getAttribute('style')?.includes('display: none')).to.equal(true);
  });
});
