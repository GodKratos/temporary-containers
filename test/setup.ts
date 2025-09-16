const preferencesTestSet = [
  {
    automaticMode: {
      active: false,
      newTab: 'created',
    },
  },
  {
    automaticMode: {
      active: true,
      newTab: 'created',
    },
  },
  {
    automaticMode: {
      active: true,
      newTab: 'navigation',
    },
  },
  {
    automaticMode: {
      active: false,
      newTab: 'navigation',
    },
  },
];

if (!process.listenerCount('unhandledRejection')) {
  process.on('unhandledRejection', r => {
    console.log('unhandledRejection', r);
  });
}

import * as chai from 'chai';
import chaiDeepMatch from 'chai-deep-match';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import jsdom from 'jsdom';
import { TemporaryContainers } from '~/background/tmp';
import { Helper } from './helper';
import { createBrowserMock, enhanceBrowserMock, BrowserMock } from './browser-mock';

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', console.error);
virtualConsole.on('warn', console.warn);
virtualConsole.on('info', console.info);
virtualConsole.on('log', console.log);
virtualConsole.on('jsdomError', error => {
  console.error(error);
});

const browser = enhanceBrowserMock(createBrowserMock());

const fakeBrowser = (): {
  browser: BrowserMock;
  clock: sinon.SinonFakeTimers;
} => {
  // Restore any existing fake timers before creating new ones
  if (sinon.clock && typeof sinon.clock.restore === 'function') {
    sinon.clock.restore();
  }

  const clock = sinon.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    now: new Date(),
  });
  const html = '<!DOCTYPE html><html><head></head><body></body></html>';

  const dom = new jsdom.JSDOM(html, {
    url: 'https://localhost',
    virtualConsole,
  });
  const window = dom.window as jsdom.DOMWindow;

  global.document = window.document;
  // FIXME

  // @ts-ignore
  global.window = window;
  global.AbortController = window.AbortController;

  browser.sinonSandbox.reset();
  // FIXME

  // @ts-ignore
  global.browser = browser;

  global.window._mochaTest = true;

  // Setup default return values for stubs that need them
  (global.browser.tabs.query as sinon.SinonStub).resolves([]);
  (global.browser.runtime.getManifest as sinon.SinonStub).returns({
    version: '0.1',
  });
  (global.browser.runtime.getBrowserInfo as sinon.SinonStub).resolves({
    name: 'Firefox',
    version: 67,
  });
  (global.browser.permissions.getAll as sinon.SinonStub).resolves({
    permissions: [],
  });
  (global.browser.management.getAll as sinon.SinonStub).resolves([
    {
      id: '@testpilot-containers',
      enabled: true,
      version: '6.0.0',
    },
  ]);

  return { browser, clock };
};

chai.should();
chai.use(chaiDeepMatch);
chai.use(sinonChai);

const { expect } = chai;
const nextTick = (): Promise<void> => {
  return new Promise(resolve => {
    process.nextTick(resolve);
  });
};

export interface Background {
  browser: BrowserMock;
  tmp: TemporaryContainers;
  clock: sinon.SinonFakeTimers;
  helper: Helper;
}

const loadBackground = async ({
  initialize = true,
  preferences = false,
  beforeCtor = false,
}: {
  initialize?: boolean;
  preferences?: false | Record<string, unknown>;
  beforeCtor?: false | ((browser: BrowserMock, clock: sinon.SinonFakeTimers) => Promise<void> | void);
} = {}): Promise<Background> => {
  const { browser, clock } = fakeBrowser();

  if (beforeCtor) {
    await beforeCtor(browser, clock);
  }

  const background = new TemporaryContainers();
  global.window.tmp = background;

  if (preferences) {
    Object.assign(background.preferences.defaults, preferences);
  }

  if (process.argv.includes('--tmp-debug')) {
    background.log.DEBUG = true;
  }

  if (initialize) {
    await background.initialize();
  }

  return {
    browser,
    tmp: background,
    clock,
    helper: new Helper(browser, background),
  };
};

export { preferencesTestSet, sinon, expect, nextTick, loadBackground, BrowserMock };
