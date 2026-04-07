import { TemporaryContainers } from './tmp';
import { ContainerOptions, Debug, PreferencesSchema, ProxyEntry } from '~/types';
import { Storage } from './storage';

interface ProxyInfo {
  type?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  proxyDNS?: boolean;
}

export class Proxy {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private storage!: Storage;
  private sequentialIndex = 0;
  private listenerRegistered = false;
  private readonly boundHandleProxy = (requestInfo: browser.proxy._OnRequestDetails): ProxyInfo => this.handleProxy(requestInfo);

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
  }

  initialize(): void {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    if (this.background.permissions.proxy && this.pref.proxies?.active) {
      this.registerListener();
    }
  }

  private registerListener(): void {
    if (this.listenerRegistered) return;
    browser.proxy.onRequest.addListener(this.boundHandleProxy as any, { urls: ['<all_urls>'] });
    this.listenerRegistered = true;
    this.debug('[proxy] listener registered');
  }

  private removeListener(): void {
    if (!this.listenerRegistered) return;
    browser.proxy.onRequest.removeListener(this.boundHandleProxy as any);
    this.listenerRegistered = false;
    this.debug('[proxy] listener removed');
  }

  handleProxy(requestInfo: browser.proxy._OnRequestDetails): ProxyInfo {
    if (requestInfo.tabId === -1) {
      return {};
    }

    const cookieStoreId = requestInfo.cookieStoreId;
    if (!cookieStoreId) {
      return {};
    }

    const containerOptions = this.storage.local.tempContainers[cookieStoreId];
    if (!containerOptions || !containerOptions.proxyId) {
      return {};
    }

    const entry = this.pref.proxies?.entries.find((e: ProxyEntry) => e.id === containerOptions.proxyId && e.enabled);
    if (!entry) {
      return {};
    }

    const proxyInfo: ProxyInfo = {
      type: entry.protocol,
      host: entry.host,
      port: entry.port,
    };
    if (entry.username) proxyInfo.username = entry.username;
    if (entry.password) proxyInfo.password = entry.password;
    if (entry.protocol === 'socks4' || entry.protocol === 'socks5') {
      proxyInfo.proxyDNS = true;
    }

    this.debug('[proxy] routing request via proxy', entry.id, requestInfo.url);
    return proxyInfo;
  }

  assignToContainer(containerOptions: ContainerOptions): void {
    if (!this.background.permissions.proxy || !this.pref.proxies?.active) {
      return;
    }
    const enabledEntries = this.pref.proxies.entries.filter((e: ProxyEntry) => e.enabled);
    if (enabledEntries.length === 0) {
      return;
    }

    let entry: ProxyEntry;
    if (this.pref.proxies.assignmentMode === 'sequential') {
      entry = enabledEntries[this.sequentialIndex % enabledEntries.length];
      this.sequentialIndex++;
    } else {
      entry = enabledEntries[Math.floor(Math.random() * enabledEntries.length)];
    }

    containerOptions.proxyId = entry.id;
    this.debug('[proxy] assigned proxy to new container', entry.id);
  }

  handlePreferencesChange(oldPrefs: PreferencesSchema, newPrefs: PreferencesSchema): void {
    const wasActive = oldPrefs.proxies?.active && this.background.permissions.proxy;
    const isActive = newPrefs.proxies?.active && this.background.permissions.proxy;

    if (!wasActive && isActive) {
      this.registerListener();
    } else if (wasActive && !isActive) {
      this.removeListener();
    }
  }
}
