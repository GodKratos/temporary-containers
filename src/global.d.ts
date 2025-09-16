import { TemporaryContainers } from './background/tmp';
import { Log } from './background/log';
import { Browser } from 'firefox-webext-browser';
import './web-globals';

declare global {
  const browser: Browser;

  interface Window {
    tmp?: TemporaryContainers;
    log: Log;
    _mochaTest?: boolean;
    debug: any;
    migrationLegacy: any;
  }
}
