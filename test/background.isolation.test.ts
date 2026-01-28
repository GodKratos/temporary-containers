import { preferencesTestSet, loadBackground, Background, expect } from './setup';
import { Tab, IsolationDomain, WebRequestOnBeforeRequestDetails } from '~/types';

preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    let bg: Background, tab: Tab;

    const defaultIsolationDomainPreferences: IsolationDomain = {
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
          container: 'default',
        },
        ctrlleft: {
          action: 'global',
          container: 'default',
        },
        left: {
          action: 'global',
          container: 'default',
        },
      },
      excluded: [],
      excludedContainers: [],
    };

    ['tmp', 'permanent'].map(originContainerType => {
      describe(`originContainerType: ${originContainerType}`, () => {
        ['sametab.global', 'sametab.perdomain', 'newtab.global', 'newtab.perdomain'].map(navigatingIn => {
          describe(`navigatingIn: ${navigatingIn}`, () => {
            const navigateTo = async (url: string): Promise<void> => {
              bg.tmp.container.markUnclean(tab.id);

              switch (navigatingIn) {
                case 'sametab.global':
                case 'sametab.perdomain':
                  return bg.browser.tabs._update(tab.id, {
                    url,
                  });

                case 'newtab.global':
                case 'newtab.perdomain':
                  return bg.browser.tabs._create({
                    cookieStoreId: tab.cookieStoreId,
                    openerTabId: tab.id,
                    url,
                  });
              }
            };

            describe('Isolation', () => {
              beforeEach(async () => {
                bg = await loadBackground({ preferences });

                const url = 'https://example.com';
                if (originContainerType === 'permanent') {
                  tab = await bg.browser.tabs._create({
                    active: true,
                    url,
                    cookieStoreId: 'firefox-container-1',
                  });
                } else {
                  tab = (await bg.tmp.container.createTabInTempContainer({
                    url,
                  })) as Tab;
                  bg.browser.tabs.create.resetHistory();
                }
              });

              describe('navigating with preference "never"', () => {
                beforeEach(async () => {
                  switch (navigatingIn) {
                    case 'sametab.global':
                    case 'newtab.global':
                      bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'never';
                      break;

                    case 'sametab.perdomain':
                    case 'newtab.perdomain':
                      bg.tmp.storage.local.preferences.isolation.domain = [
                        {
                          ...defaultIsolationDomainPreferences,
                          pattern: 'example.com',
                          navigation: {
                            action: 'never',
                          },
                        },
                      ];
                      break;
                  }
                });

                describe('if its the exact same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://example.com/moo');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://sub.example.com');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its not the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://notexample.com');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });
              });

              describe('navigating with preference "always"', () => {
                beforeEach(async () => {
                  switch (navigatingIn) {
                    case 'sametab.global':
                    case 'newtab.global':
                      bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'always';
                      break;

                    case 'sametab.perdomain':
                    case 'newtab.perdomain':
                      bg.tmp.storage.local.preferences.isolation.domain = [
                        {
                          ...defaultIsolationDomainPreferences,
                          pattern: 'example.com',
                          navigation: {
                            action: 'always',
                          },
                        },
                      ];
                      break;
                  }
                });

                describe('if its the exact same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://example.com/moo');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });

                describe('if its the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://sub.example.com');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });

                describe('if its not the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://notexample.com');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });

                describe('if the target domain is excluded', () => {
                  beforeEach(async () => {
                    switch (navigatingIn) {
                      case 'sametab.global':
                      case 'newtab.global':
                        bg.tmp.storage.local.preferences.isolation.global.excluded.push('excluded.com');
                        break;

                      case 'sametab.perdomain':
                      case 'newtab.perdomain':
                        bg.tmp.storage.local.preferences.isolation.domain = [
                          {
                            ...defaultIsolationDomainPreferences,
                            pattern: 'example.com',
                            excluded: ['excluded.com'],
                          },
                        ];
                        break;
                    }

                    await navigateTo('https://excluded.com');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });
              });

              describe('navigating with preference "notsamedomain"', () => {
                beforeEach(() => {
                  switch (navigatingIn) {
                    case 'sametab.global':
                    case 'newtab.global':
                      bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'notsamedomain';
                      break;

                    case 'sametab.perdomain':
                    case 'newtab.perdomain':
                      bg.tmp.storage.local.preferences.isolation.domain = [
                        {
                          ...defaultIsolationDomainPreferences,
                          pattern: 'example.com',
                          navigation: {
                            action: 'notsamedomain',
                          },
                        },
                      ];
                      break;
                  }
                });

                describe('if its the exact same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://example.com/moo');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://sub.example.com');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its not the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://notexample.com');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });

                describe('if its not the same domain after a redirect', () => {
                  beforeEach(async () => {
                    bg.browser.tabs._registerRedirects('https://out.example.com', ['https://notexample.com']);
                    await navigateTo('https://out.example.com');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });
              });

              describe('navigating with preference "notsamedomainexact"', () => {
                beforeEach(() => {
                  switch (navigatingIn) {
                    case 'sametab.global':
                    case 'newtab.global':
                      bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'notsamedomainexact';
                      break;

                    case 'sametab.perdomain':
                    case 'newtab.perdomain':
                      bg.tmp.storage.local.preferences.isolation.domain = [
                        {
                          ...defaultIsolationDomainPreferences,
                          pattern: 'example.com',
                          navigation: {
                            action: 'notsamedomainexact',
                          },
                        },
                      ];
                      break;
                  }
                });

                describe('if its the exact same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://example.com/moo');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://sub.example.com');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });

                describe('if its not the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://notexample.com');
                  });

                  it('should open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });

                describe('follow-up redirects to the exact same domain after isolating', () => {
                  beforeEach(async () => {
                    bg.browser.tabs._registerRedirects('http://notexample.com', ['https://notexample.com']);
                    await navigateTo('http://notexample.com');
                  });

                  it('should not open two Temporary Containers', async () => {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  });
                });
              });

              describe('toggle isolation off', () => {
                beforeEach(async () => {
                  bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'always';
                  bg.tmp.storage.local.isolation.active = true;
                  bg.browser.commands.onCommand.addListener.yield('toggle_isolation');
                });

                describe('if its the exact same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://example.com/moo');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://sub.example.com');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });

                describe('if its not the same domain', () => {
                  beforeEach(async () => {
                    await navigateTo('https://notexample.com');
                  });

                  it('should not open a new Temporary Container', async () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });
              });

              describe('when auto-enable isolation is turned on with action = always', () => {
                beforeEach(async () => {
                  bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'always';
                  bg.tmp.storage.local.preferences.isolation.reactivateDelay = 3;
                  bg.tmp.storage.local.isolation.active = true;
                });

                describe('when isolation is deactivated', () => {
                  beforeEach(async () => {
                    bg.browser.commands.onCommand.addListener.yield('toggle_isolation');
                  });

                  it('should not open a Temporary Container when navigating before auto-isolate triggers', async () => {
                    bg.clock.tick(1000);
                    bg.tmp.storage.local.isolation.active.should.equal(false);
                    await navigateTo('https://example.com/moo');
                    bg.browser.tabs.create.should.not.have.been.called;
                  });

                  it('should open a Temporary Container when navigating after auto-isolate triggers', async () => {
                    bg.clock.tick(5000);
                    bg.tmp.storage.local.isolation.active.should.equal(true);
                    await navigateTo('https://example.com/moo');
                    bg.browser.tabs.create.should.have.been.called;
                  });
                });
              });
            });

            describe('Multi-Account Containers Isolation', () => {
              describe('navigating in a permanent container', () => {
                beforeEach(async () => {
                  bg = await loadBackground({ preferences });
                  tab = await bg.browser.tabs._create({
                    active: true,
                    url: 'https://example.com',
                    cookieStoreId: 'firefox-container-1',
                  });
                });

                describe('with "enabled"', () => {
                  beforeEach(async () => {
                    bg.tmp.storage.local.preferences.isolation.mac.action = 'enabled';
                  });
                  describe('if the navigation target isnt assigned to the current container', () => {
                    beforeEach(async () => {
                      bg.browser.runtime.sendMessage.resolves({
                        userContextId: '1',
                        neverAsk: false,
                      });
                      await navigateTo('https://assigned.com');
                    });

                    it('should not open a new Temporary Container', () => {
                      bg.browser.tabs.create.should.not.have.been.called;
                    });
                  });

                  describe('if the navigation target isnt assigned to the current container', () => {
                    beforeEach(async () => {
                      bg.browser.runtime.sendMessage.resolves(null);
                      await navigateTo('https://notassigned.com');
                    });

                    it('should open a new Temporary Container', () => {
                      bg.browser.tabs.create.should.have.been.calledOnce;
                    });
                  });
                });
              });

              describe('navigating in a temporary container', () => {
                beforeEach(async () => {
                  bg = await loadBackground({ preferences });
                  tab = (await bg.tmp.container.createTabInTempContainer({})) as Tab;
                  bg.browser.tabs.create.resetHistory();
                });

                describe('with "enabled" and target domain not assigned with MAC', () => {
                  beforeEach(async () => {
                    bg.tmp.storage.local.preferences.isolation.mac.action = 'enabled';
                    bg.browser.runtime.sendMessage.resolves(null);
                    await navigateTo('http://example.com');
                  });

                  it('should not open a new Temporary Container', () => {
                    bg.browser.tabs.create.should.not.have.been.called;
                  });
                });
              });
            });

            describe('Always open in', () => {
              beforeEach(async () => {
                bg = await loadBackground({ preferences });
                const url = 'https://example.com';
                if (originContainerType === 'permanent') {
                  tab = await bg.browser.tabs._create({
                    active: true,
                    url,
                    cookieStoreId: 'firefox-container-1',
                  });
                } else {
                  tab = (await bg.tmp.container.createTabInTempContainer({
                    url,
                  })) as Tab;
                  bg.browser.tabs.create.resetHistory();
                }
              });

              it('should not open in a new temporary container if the opener tab url belonging to the request matches the pattern', async () => {
                bg.tmp.storage.local.preferences.isolation.domain = [
                  {
                    ...defaultIsolationDomainPreferences,
                    pattern: 'example.com',
                    always: {
                      action: 'enabled',
                      allowedInPermanent: false,
                      allowedInTemporary: false,
                    },
                  },
                ];

                await bg.browser.tabs._create({
                  url: 'https://example.com',
                  openerTabId: tab.id,
                  cookieStoreId: tab.cookieStoreId,
                });

                switch (originContainerType) {
                  case 'tmp':
                    bg.browser.tabs.create.should.not.have.been.called;
                    break;

                  case 'permanent':
                    bg.browser.tabs.create.should.have.been.calledOnce;
                    break;
                }
              });
            });
          });
        });
      });

      describe('Cloudflare challenge navigation', () => {
        const buildCloudflareRequest = (currentTab: Tab): WebRequestOnBeforeRequestDetails => ({
          requestId: `cloudflare-${Date.now()}`,
          tabId: currentTab.id,
          url: 'https://example.com/',
          originUrl: currentTab.url,
          method: 'POST',
          type: 'main_frame',
          timeStamp: Date.now(),
          frameId: 0,
          parentFrameId: -1,
          cookieStoreId: currentTab.cookieStoreId,
          thirdParty: false,
        });

        beforeEach(async () => {
          bg = await loadBackground({ preferences });
          tab = (await bg.tmp.container.createTabInTempContainer({
            url: 'https://example.com/?__cf_chl_rt_tk=test',
          })) as Tab;
          tab.url = 'https://example.com/?__cf_chl_rt_tk=test';
          bg.browser.tabs.create.resetHistory();
          bg.tmp.storage.local.preferences.isolation.domain = [];
          bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'global';
        });

        it('should not re-isolate same-domain POST when global navigation action is "always"', async () => {
          bg.tmp.storage.local.preferences.isolation.global.navigation.action = 'always';

          const shouldIsolate = await bg.tmp.isolation.shouldIsolateNavigation({
            tab,
            request: buildCloudflareRequest(tab),
          });

          shouldIsolate.should.equal(false);
        });

        it('should not re-isolate same-domain POST when per-domain navigation action is "always"', async () => {
          bg.tmp.storage.local.preferences.isolation.domain = [
            {
              ...defaultIsolationDomainPreferences,
              pattern: 'example.com',
              navigation: {
                action: 'always',
              },
            },
          ];

          const shouldIsolate = await bg.tmp.isolation.shouldIsolateNavigation({
            tab,
            request: buildCloudflareRequest(tab),
          });

          shouldIsolate.should.equal(false);
        });
      });

      describe('Mouse click opener fallback', () => {
        const targetUrl = 'https://en.wikipedia.org/wiki/Main_Page';
        const originUrl = 'https://www.wikipedia.org/';
        let requestTab: Tab;
        let storedTab: Tab;
        let mouseClickRequest: WebRequestOnBeforeRequestDetails;

        const seedMouseClickState = (): void => {
          bg.tmp.mouseclick.isolated[targetUrl] = {
            clickType: 'left',
            tab: storedTab,
            count: 1,
            abortController: new AbortController(),
          };
        };

        beforeEach(async () => {
          bg = await loadBackground({ preferences });
          bg.tmp.storage.local.preferences.isolation.global.mouseClick.left.action = 'always';

          storedTab = bg.helper.fakeTab({
            id: 10,
            url: originUrl,
            windowId: 3,
            pinned: true,
          });

          requestTab = bg.helper.fakeTab({
            id: 27,
            openerTabId: 27,
            windowId: 3,
            url: targetUrl,
          });

          mouseClickRequest = {
            requestId: `mouseclick-${Date.now()}`,
            tabId: requestTab.id,
            url: targetUrl,
            originUrl,
            method: 'GET',
            type: 'main_frame',
            timeStamp: Date.now(),
            frameId: 0,
            parentFrameId: -1,
            cookieStoreId: requestTab.cookieStoreId,
            thirdParty: false,
            urlClassification: {
              firstParty: [],
              thirdParty: [],
            },
          } as WebRequestOnBeforeRequestDetails;
        });

        it('isolates when opener ids differ but originUrl matches the recorded tab url', () => {
          seedMouseClickState();

          const result = bg.tmp.isolation.shouldIsolateMouseClick({
            request: mouseClickRequest,
            tab: requestTab,
            openerTab: requestTab,
          });

          expect(result).to.deep.equal({ reload: true });
          expect(bg.tmp.mouseclick.isolated[targetUrl]).to.be.undefined;
        });

        it('skips isolation when opener ids differ and the originUrl does not match the recorded tab url', () => {
          seedMouseClickState();
          mouseClickRequest.originUrl = 'https://news.ycombinator.com/';

          const result = bg.tmp.isolation.shouldIsolateMouseClick({
            request: mouseClickRequest,
            tab: requestTab,
            openerTab: requestTab,
          });

          expect(result).to.equal(false);
          expect(bg.tmp.mouseclick.isolated[targetUrl]).to.have.property('count', 1);
        });
      });
    });
  });
});
