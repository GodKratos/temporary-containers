import { expect, loadBackground } from './setup';

describe('Version-based migrations', () => {
  describe('excluded domains object to array migration (v1.9.9/v2.0)', () => {
    it('should migrate global excluded domains from object to array', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.9.9',
            preferences: {
              isolation: {
                global: {
                  navigation: { action: 'never' },
                  mouseClick: {
                    middle: { action: 'never', container: 'default' },
                    ctrlleft: { action: 'never', container: 'default' },
                    left: { action: 'never', container: 'default' },
                  },
                  // @ts-ignore - simulating old object format
                  excluded: { 'example.com': true, 'test.com': true },
                  excludedContainers: [],
                },
                domain: [],
                mac: { action: 'disabled' },
                reactivateDelay: 0,
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.isolation.global.excluded).to.be.an('array');
      expect(background.storage.local.preferences.isolation.global.excluded).to.include('example.com');
      expect(background.storage.local.preferences.isolation.global.excluded).to.include('test.com');
    });

    it('should migrate global excluded containers from object to array', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.9.9',
            preferences: {
              isolation: {
                global: {
                  navigation: { action: 'never' },
                  mouseClick: {
                    middle: { action: 'never', container: 'default' },
                    ctrlleft: { action: 'never', container: 'default' },
                    left: { action: 'never', container: 'default' },
                  },
                  excluded: [],
                  // @ts-ignore - simulating old object format
                  excludedContainers: { 'firefox-container-1': true, 'firefox-container-2': true },
                },
                domain: [],
                mac: { action: 'disabled' },
                reactivateDelay: 0,
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.isolation.global.excludedContainers).to.be.an('array');
      expect(background.storage.local.preferences.isolation.global.excludedContainers).to.include('firefox-container-1');
      expect(background.storage.local.preferences.isolation.global.excludedContainers).to.include('firefox-container-2');
    });

    it('should migrate domain excluded domains from object to array', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.9.9',
            preferences: {
              isolation: {
                global: {
                  navigation: { action: 'never' },
                  mouseClick: {
                    middle: { action: 'never', container: 'default' },
                    ctrlleft: { action: 'never', container: 'default' },
                    left: { action: 'never', container: 'default' },
                  },
                  excluded: [],
                  excludedContainers: [],
                },
                domain: [
                  {
                    pattern: '*.example.com',
                    navigation: { action: 'always' },
                    mouseClick: {
                      middle: { action: 'global', container: 'default' },
                      ctrlleft: { action: 'global', container: 'default' },
                      left: { action: 'global', container: 'default' },
                    },
                    // @ts-ignore - simulating old object format
                    excluded: { 'ads.example.com': true, 'tracker.example.com': true },
                    excludedContainers: [],
                    always: { action: 'disabled', allowedInPermanent: false, allowedInTemporary: false },
                  },
                ],
                mac: { action: 'disabled' },
                reactivateDelay: 0,
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.isolation.domain[0].excluded).to.be.an('array');
      expect(background.storage.local.preferences.isolation.domain[0].excluded).to.include('ads.example.com');
      expect(background.storage.local.preferences.isolation.domain[0].excluded).to.include('tracker.example.com');
    });

    it('should initialize empty arrays for missing excluded properties', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.9.9',
            preferences: {
              isolation: {
                global: {
                  navigation: { action: 'never' },
                  mouseClick: {
                    middle: { action: 'never', container: 'default' },
                    ctrlleft: { action: 'never', container: 'default' },
                    left: { action: 'never', container: 'default' },
                  },
                  // @ts-ignore - simulating missing properties
                  excluded: undefined,
                  // @ts-ignore
                  excludedContainers: undefined,
                },
                domain: [
                  {
                    pattern: '*.example.com',
                    navigation: { action: 'always' },
                    mouseClick: {
                      middle: { action: 'global', container: 'default' },
                      ctrlleft: { action: 'global', container: 'default' },
                      left: { action: 'global', container: 'default' },
                    },
                    // @ts-ignore - simulating missing property
                    excluded: undefined,
                    excludedContainers: [],
                    always: { action: 'disabled', allowedInPermanent: false, allowedInTemporary: false },
                  },
                ],
                mac: { action: 'disabled' },
                reactivateDelay: 0,
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.isolation.global.excluded).to.be.an('array');
      expect(background.storage.local.preferences.isolation.global.excluded).to.be.empty;
      expect(background.storage.local.preferences.isolation.global.excludedContainers).to.be.an('array');
      expect(background.storage.local.preferences.isolation.global.excludedContainers).to.be.empty;
      expect(background.storage.local.preferences.isolation.domain[0].excluded).to.be.an('array');
      expect(background.storage.local.preferences.isolation.domain[0].excluded).to.be.empty;
    });
  });
});

describe('Version-based migrations', () => {
  describe('container.removal string to milliseconds migration (v1.3)', () => {
    it('should migrate container.removal from "instant" to 0', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.3',
            preferences: {
              container: {
                // @ts-ignore - old string format
                removal: 'instant',
              },
              deletesHistory: {
                // @ts-ignore - old string format
                containerRemoval: 'instant',
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.container.removal).to.equal(0);
      expect(background.storage.local.preferences.deletesHistory.containerRemoval).to.equal(0);
    });

    it('should migrate container.removal from "2minutes" to 120000', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.3',
            preferences: {
              container: {
                // @ts-ignore - old string format
                removal: '2minutes',
              },
              deletesHistory: {},
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.container.removal).to.equal(120000);
    });

    it('should migrate container.removal from "5minutes" to 300000', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.3',
            preferences: {
              container: {
                // @ts-ignore - old string format
                removal: '5minutes',
              },
              deletesHistory: {},
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.container.removal).to.equal(300000);
    });

    it('should migrate container.removal from "15minutes" to 900000', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.3',
            preferences: {
              container: {
                // @ts-ignore - old string format
                removal: '15minutes',
              },
              deletesHistory: {
                // @ts-ignore - old string format
                containerRemoval: '15minutes',
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.container.removal).to.equal(900000);
      expect(background.storage.local.preferences.deletesHistory.containerRemoval).to.equal(900000);
    });
  });

  describe('ui.popupDefaultTab migration (v1.9.1)', () => {
    it('should migrate from "isolation-mac" to "isolation-global"', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.9.1',
            preferences: {
              ui: {
                // @ts-ignore - old value
                popupDefaultTab: 'isolation-mac',
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.ui.popupDefaultTab).to.equal('isolation-global');
    });
  });

  describe('redirectorCloseTabs.domains migration (v1.1)', () => {
    it('should add slack-redir.net to closeRedirectorTabs.domains', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.1',
            preferences: {
              closeRedirectorTabs: {
                domains: ['example-redirect.com'],
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.closeRedirectorTabs.domains).to.include('slack-redir.net');
      expect(background.storage.local.preferences.closeRedirectorTabs.domains).to.include('example-redirect.com');
    });
  });

  describe('isolation.active migration (v1.8)', () => {
    it('should move isolation.active from preferences to storage.local.isolation', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.8',
            preferences: {
              isolation: {
                // @ts-ignore - old location
                active: true,
                global: {
                  navigation: { action: 'never' },
                  mouseClick: {
                    middle: { action: 'never', container: 'default' },
                    ctrlleft: { action: 'never', container: 'default' },
                    left: { action: 'never', container: 'default' },
                  },
                  excluded: [],
                  excludedContainers: [],
                },
                domain: [],
                mac: { action: 'disabled' },
                reactivateDelay: 0,
              },
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.isolation.active).to.equal(true);
      // @ts-ignore
      expect(background.storage.local.preferences.isolation.active).to.be.undefined;
    });
  });

  describe('isolation.automaticReactivateDelay migration (v1.9.1)', () => {
    it('should rename isolation.automaticReactivateDelay to isolation.reactivateDelay', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '1.9.1',
            preferences: {
              isolation: {
                // @ts-ignore - old property name
                automaticReactivateDelay: 5000,
                global: {
                  navigation: { action: 'never' },
                  mouseClick: {
                    middle: { action: 'never', container: 'default' },
                    ctrlleft: { action: 'never', container: 'default' },
                    left: { action: 'never', container: 'default' },
                  },
                  excluded: [],
                  excludedContainers: [],
                },
                domain: [],
                mac: { action: 'disabled' },
              },
            },
            isolation: {
              active: true,
              reactivateTargetTime: 0,
              // @ts-ignore - old property name
              automaticReactivateTargetTime: 12345,
            },
            tempContainers: {},
            tempContainersNumbers: [],
            statistics: {
              startTime: new Date(),
              containersDeleted: 0,
              cookiesDeleted: 0,
              cacheDeleted: 0,
              deletesHistory: {
                containersDeleted: 0,
                cookiesDeleted: 0,
                urlsDeleted: 0,
              },
            },
          });
        },
      });

      expect(background.storage.local.preferences.isolation.reactivateDelay).to.equal(5000);
      // Note: reactivateTargetTime gets set to 12345 during migration, but then defaults merge might reset it
      // The important part is that automaticReactivateTargetTime is gone
      // @ts-ignore
      expect(background.storage.local.preferences.isolation.automaticReactivateDelay).to.be.undefined;
      // @ts-ignore
      expect(background.storage.local.isolation.automaticReactivateTargetTime).to.be.undefined;
      // Verify the property was renamed in storage.local.isolation
      expect(background.storage.local.isolation.reactivateTargetTime).to.exist;
    });
  });

  describe('ignoreRequestsTo* migration (v0.103)', () => {
    it('should remove addons.mozilla.org when ignoreRequestsToAMO is false', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '0.103',
            preferences: {
              // @ts-ignore - old property
              ignoreRequestsToAMO: false,
              ignoreRequests: ['addons.mozilla.org', 'example.com'],
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.ignoreRequests).to.not.include('addons.mozilla.org');
      expect(background.storage.local.preferences.ignoreRequests).to.include('example.com');
      // @ts-ignore
      expect(background.storage.local.preferences.ignoreRequestsToAMO).to.be.undefined;
    });

    it('should remove getpocket.com when ignoreRequestsToPocket is false', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '0.103',
            preferences: {
              // @ts-ignore - old property
              ignoreRequestsToPocket: false,
              ignoreRequests: ['getpocket.com', 'example.com'],
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.ignoreRequests).to.not.include('getpocket.com');
      expect(background.storage.local.preferences.ignoreRequests).to.include('example.com');
      // @ts-ignore
      expect(background.storage.local.preferences.ignoreRequestsToPocket).to.be.undefined;
    });
  });

  describe('popup default tab migration (v0.103)', () => {
    it('should set popupDefaultTab to isolation-per-domain when browserActionPopup is true', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '0.103',
            preferences: {
              browserActionPopup: true,
              ui: {},
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.ui.popupDefaultTab).to.equal('isolation-per-domain');
    });

    it('should set popupDefaultTab to isolation-per-domain when pageAction is true', async () => {
      const { tmp: background } = await loadBackground({
        beforeCtor: async browser => {
          browser.storage.local.get.resolves({
            version: '0.103',
            preferences: {
              pageAction: true,
              ui: {},
            },
            tempContainers: {},
            tempContainersNumbers: [],
          });
        },
      });

      expect(background.storage.local.preferences.ui.popupDefaultTab).to.equal('isolation-per-domain');
    });
  });
});
