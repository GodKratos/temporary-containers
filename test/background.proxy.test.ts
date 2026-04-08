import { expect, loadBackground } from './setup';
import { sinon } from './setup';
import { ProxyEntry } from '~/types';

function makeEntry(overrides: Partial<ProxyEntry> = {}): ProxyEntry {
  return {
    id: overrides.id || 'entry-1',
    enabled: overrides.enabled !== undefined ? overrides.enabled : true,
    protocol: overrides.protocol || 'http',
    host: overrides.host || 'proxy.example.com',
    port: overrides.port || 8080,
    username: overrides.username,
    password: overrides.password,
    label: overrides.label,
  };
}

describe('Proxy', () => {
  describe('assignToContainer', () => {
    it('should not assign when proxy feature is disabled', async () => {
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: false, assignmentMode: 'random', entries: [makeEntry()] } },
      });
      const containerOptions: any = { name: 'tmp1', color: 'toolbar', icon: 'circle', number: 1, clean: true };
      background.proxy.assignToContainer(containerOptions);
      expect(containerOptions.proxyId).to.be.undefined;
    });

    it('should not assign when proxy permission is not granted', async () => {
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [makeEntry()] } },
      });
      // permissions.proxy defaults to false (empty permissions list in mock)
      const containerOptions: any = { name: 'tmp1', color: 'toolbar', icon: 'circle', number: 1, clean: true };
      background.proxy.assignToContainer(containerOptions);
      expect(containerOptions.proxyId).to.be.undefined;
    });

    it('should not assign when entry list is empty', async () => {
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      const containerOptions: any = { name: 'tmp1', color: 'toolbar', icon: 'circle', number: 1, clean: true };
      background.proxy.assignToContainer(containerOptions);
      expect(containerOptions.proxyId).to.be.undefined;
    });

    it('should not assign from disabled entries only', async () => {
      const entry = makeEntry({ enabled: false });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      const containerOptions: any = { name: 'tmp1', color: 'toolbar', icon: 'circle', number: 1, clean: true };
      background.proxy.assignToContainer(containerOptions);
      expect(containerOptions.proxyId).to.be.undefined;
    });

    it('should assign a proxyId in random mode', async () => {
      const entries = [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })];
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      const containerOptions: any = { name: 'tmp1', color: 'toolbar', icon: 'circle', number: 1, clean: true };
      background.proxy.assignToContainer(containerOptions);
      expect(['e1', 'e2']).to.include(containerOptions.proxyId);
    });

    it('should assign entries sequentially in sequential mode', async () => {
      const entries = [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' }), makeEntry({ id: 'e3' })];
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'sequential', entries } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();

      const c1: any = {};
      const c2: any = {};
      const c3: any = {};
      const c4: any = {};
      background.proxy.assignToContainer(c1);
      background.proxy.assignToContainer(c2);
      background.proxy.assignToContainer(c3);
      background.proxy.assignToContainer(c4);

      expect(c1.proxyId).to.equal('e1');
      expect(c2.proxyId).to.equal('e2');
      expect(c3.proxyId).to.equal('e3');
      expect(c4.proxyId).to.equal('e1'); // wraps around
    });

    it('should skip disabled entries in sequential mode', async () => {
      const entries = [
        makeEntry({ id: 'e1', enabled: true }),
        makeEntry({ id: 'e2', enabled: false }),
        makeEntry({ id: 'e3', enabled: true }),
      ];
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'sequential', entries } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();

      const c1: any = {};
      const c2: any = {};
      background.proxy.assignToContainer(c1);
      background.proxy.assignToContainer(c2);

      expect(c1.proxyId).to.equal('e1');
      expect(c2.proxyId).to.equal('e3');
    });
  });

  describe('handleProxy', () => {
    it('should return empty object for tabId -1 (no-tab requests)', async () => {
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [makeEntry({ id: 'e1' })] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();

      const result = background.proxy.handleProxy({ tabId: -1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({});
    });

    it('should return empty object when cookieStoreId is not a temp container', async () => {
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [makeEntry({ id: 'e1' })] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-default', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({});
    });

    it('should return empty object when container has no proxy assigned', async () => {
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [makeEntry({ id: 'e1' })] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({});
    });

    it('should return ProxyInfo for a container with an assigned http proxy', async () => {
      const entry = makeEntry({ id: 'e1', protocol: 'http', host: 'proxy.example.com', port: 8080 });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e1',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({ type: 'http', host: 'proxy.example.com', port: 8080 });
    });

    it('should set proxyDNS true for socks5 proxies', async () => {
      const entry = makeEntry({ id: 'e1', protocol: 'socks5', host: 'socks.example.com', port: 1080 });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e1',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({ type: 'socks5', host: 'socks.example.com', port: 1080, proxyDNS: true });
    });

    it('should set proxyDNS true for socks4 proxies', async () => {
      const entry = makeEntry({ id: 'e1', protocol: 'socks4', host: 'socks.example.com', port: 1080 });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e1',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({ type: 'socks4', host: 'socks.example.com', port: 1080, proxyDNS: true });
    });

    it('should not set proxyDNS for https proxies', async () => {
      const entry = makeEntry({ id: 'e1', protocol: 'https', host: 'proxy.example.com', port: 443 });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e1',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.not.have.property('proxyDNS');
    });

    it('should include credentials when proxy entry has username and password', async () => {
      const entry = makeEntry({ id: 'e1', protocol: 'http', host: 'proxy.example.com', port: 8080, username: 'user', password: 'pass' });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e1',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      // HTTP/HTTPS proxies use a pre-encoded Proxy-Authorization header; username/password are not passed directly
      expect(result).to.deep.equal({ type: 'http', host: 'proxy.example.com', port: 8080, proxyAuthorizationHeader: 'Basic dXNlcjpwYXNz' });
    });

    it('should include credentials directly for socks5 proxies', async () => {
      const entry = makeEntry({ id: 'e2', protocol: 'socks5', host: 'socks.example.com', port: 1080, username: 'user', password: 'pass' });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e2',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({
        type: 'socks5',
        host: 'socks.example.com',
        port: 1080,
        username: 'user',
        password: 'pass',
        proxyDNS: true,
      });
    });

    it('should return empty object when proxy entry is disabled', async () => {
      const entry = makeEntry({ id: 'e1', enabled: false });
      const { tmp: background } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [entry] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();
      background.storage.local.tempContainers['firefox-container-1'] = {
        name: 'tmp1',
        color: 'toolbar',
        icon: 'circle',
        number: 1,
        clean: true,
        proxyId: 'e1',
      };

      const result = background.proxy.handleProxy({ tabId: 1, cookieStoreId: 'firefox-container-1', url: 'https://example.com' } as any);
      expect(result).to.deep.equal({});
    });
  });

  describe('handlePreferencesChange', () => {
    it('should register listener when feature is activated with proxy permission', async () => {
      const { tmp: background, browser } = await loadBackground({
        preferences: { proxies: { active: false, assignmentMode: 'random', entries: [makeEntry()] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize();

      const oldPrefs = { proxies: { active: false, assignmentMode: 'random', entries: [] } } as any;
      const newPrefs = { proxies: { active: true, assignmentMode: 'random', entries: [] } } as any;
      background.proxy.handlePreferencesChange(oldPrefs, newPrefs);

      expect((browser.proxy.onRequest.addListener as sinon.SinonStub).called).to.be.true;
    });

    it('should remove listener when feature is deactivated', async () => {
      const { tmp: background, browser } = await loadBackground({
        preferences: { proxies: { active: true, assignmentMode: 'random', entries: [makeEntry()] } },
      });
      background.permissions.proxy = true;
      background.proxy.initialize(); // registers listener

      const oldPrefs = { proxies: { active: true, assignmentMode: 'random', entries: [] } } as any;
      const newPrefs = { proxies: { active: false, assignmentMode: 'random', entries: [] } } as any;
      background.proxy.handlePreferencesChange(oldPrefs, newPrefs);

      expect((browser.proxy.onRequest.removeListener as sinon.SinonStub).called).to.be.true;
    });

    it('should not register listener when proxy permission is not granted', async () => {
      const { tmp: background, browser } = await loadBackground({
        preferences: { proxies: { active: false, assignmentMode: 'random', entries: [] } },
      });
      // permissions.proxy is false by default

      const oldPrefs = { proxies: { active: false, assignmentMode: 'random', entries: [] } } as any;
      const newPrefs = { proxies: { active: true, assignmentMode: 'random', entries: [] } } as any;
      background.proxy.handlePreferencesChange(oldPrefs, newPrefs);

      expect((browser.proxy.onRequest.addListener as sinon.SinonStub).called).to.be.false;
    });
  });
});
