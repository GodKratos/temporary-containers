/// <reference types="sinon-chai" />
/// <reference types="chai" />

import jsdom from 'jsdom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SinonStub } from 'sinon';
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

// Extend SinonStub with should interface
declare module 'sinon' {
  interface SinonStub {
    should: import('chai').Assertion;
  }
}

// Extend primitive types with should interface for chai
declare global {
  interface Object {
    should: import('chai').Assertion;
  }

  interface Function {
    should: import('chai').Assertion;
  }
}
