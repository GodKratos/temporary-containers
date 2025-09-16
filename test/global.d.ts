/// <reference types="sinon-chai" />

import jsdom from 'jsdom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserMock } from './browser-mock';

declare global {
  interface GlobalWindow extends jsdom.DOMWindow {
    _mochaTest?: boolean;
    tmp?: any;
  }

  const browser: BrowserMock;
  const document: Document;
  const window: GlobalWindow;
  const AbortController: {
    new (): AbortController;
    prototype: AbortController;
  };

  namespace NodeJS {
    interface Global {
      document: Document;
      window: GlobalWindow;
      browser: BrowserMock;
      AbortController: {
        new (): AbortController;
        prototype: AbortController;
      };
    }
  }
}
