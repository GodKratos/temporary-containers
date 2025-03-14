import { Debug } from '~/types';

export class Log {
  private DEBUG = false;
  private stringify = true;
  private checkedLocalStorage = false;
  private checkLocalStoragePromise: Promise<void>;

  constructor() {
    this.checkLocalStoragePromise = this.checkLocalStorage();
    this.debug = this.debug.bind(this);
    browser.runtime.onInstalled.addListener(this.onInstalledListener.bind(this));
  }

  public debug: Debug = async (...args: any[]): Promise<void> => {
    let date;
    if (!this.checkedLocalStorage && !window._mochaTest) {
      date = new Date().toUTCString();
      await this.checkLocalStoragePromise;
    }

    if (!this.DEBUG) return;

    if (!date) {
      date = new Date().toUTCString();
    }

    args = args.map((arg) => {
      if (typeof arg === 'object' && arg.favIconUrl) {
        arg = JSON.parse(JSON.stringify(arg));
        delete arg.favIconUrl;
        return arg;
      }
      return arg;
    });

    if (this.stringify && !window._mochaTest) {
      console.log(date, ...args.map((value) => JSON.stringify(value)));
      console.log('------------------------------------------');
    } else {
      console.log(date, ...args.slice(0));
    }
  };

  private processArg(arg: unknown): unknown {
    if (typeof arg === 'object' && arg && 'favIconUrl' in arg) {
      const { favIconUrl, ...rest } = arg as { favIconUrl: string };
      return rest;
    }
    return arg;
  }

  private async checkLocalStorage(): Promise<void> {
    if (this.DEBUG) return;

    await new Promise<void>(resolve => 
      setTimeout(() => {
        this.handleDebugSettings();
        resolve();
      })
    );
  }

  private handleDebugSettings(): void {
    if (localStorage.getItem('debug-dev') === 'true') {
      this.enableDebug(false);
      this.debug('[log] enabled debug-dev because of localstorage item');
    } else if (localStorage.getItem('debug') === 'true') {
      this.enableDebug(true);
      this.debug('[log] enabled debug because of localstorage item');
    }
  }

  private enableDebug(stringify: boolean): void {
    this.DEBUG = true;
    this.stringify = stringify;
    this.checkedLocalStorage = true;
  }

  onInstalledListener(details: any): void {
    browser.runtime.onInstalled.removeListener(this.onInstalledListener);

    if (!this.DEBUG && details.temporary) {
      this.DEBUG = true;
      this.stringify = false;

      if (details.reason === 'update') {
        browser.tabs.create({
          url: browser.runtime.getURL('options.html'),
        });
      }

      this.debug(
        '[log] enabled debug-dev because of temporary install',
        details
      );
    }
  }
}