import { createBrowserMock, enhanceBrowserMock, BrowserMock } from './browser-mock';
import { expect } from 'chai';

describe('Browser Mock', () => {
  let browserMock: BrowserMock;

  beforeEach(() => {
    browserMock = enhanceBrowserMock(createBrowserMock());
  });

  it('should create a browser mock with runtime API', () => {
    expect(browserMock.runtime).to.exist;
    expect(browserMock.runtime.getManifest).to.exist;
    expect(browserMock.runtime.getBrowserInfo).to.exist;
  });

  it('should create stubs that can be configured', () => {
    browserMock.runtime.getManifest.returns({ version: '1.0.0' });

    const result = browserMock.runtime.getManifest();
    expect(result).to.deep.equal({ version: '1.0.0' });
  });

  it('should support event listener yielding', () => {
    const callback = (data: any) => data;
    browserMock.runtime.onMessage.addListener(callback);

    const results = (browserMock.runtime.onMessage.addListener as any).yield('test-data');
    expect(results).to.deep.equal(['test-data']);
  });

  it('should have tabs API with custom _create method', () => {
    expect(browserMock.tabs._create).to.exist;
    expect(browserMock.tabs.create).to.exist;
  });

  it('should reset history correctly', () => {
    browserMock.runtime.getManifest();
    expect(browserMock.runtime.getManifest.called).to.be.true;

    browserMock._resetHistory();
    expect(browserMock.runtime.getManifest.called).to.be.false;
  });
});
