import { expect } from 'chai';
import { loadBackground } from './setup';

describe('Managed Storage', () => {
  it('should initialize with default managed storage state', async () => {
    const { tmp: background } = await loadBackground();

    expect(background.storage.managedStorage).to.exist;
    expect(background.storage.managedStorage.isManaged).to.be.false;
    expect(background.storage.managedStorage.lockedSettings).to.be.an('array').that.is.empty;
    expect(background.storage.managedStorage.overrides).to.be.an('object').that.is.empty;
  });

  it('should detect managed storage configuration', async () => {
    const { tmp: background, browser } = await loadBackground({
      initialize: false,
    });

    // Mock managed storage response
    const mockManagedConfig = {
      version: '1.0.0',
      policy_name: 'Test Policy',
      locked_settings: ['automaticMode.active', 'container.namePrefix'],
      preferences: {
        automaticMode: {
          active: true,
          newTab: 'created',
        },
        container: {
          namePrefix: 'test-tmp',
        },
      },
    };

    browser.storage.managed.get.resolves(mockManagedConfig);

    await background.initialize();

    expect(background.storage.managedStorage.isManaged).to.be.true;
    expect(background.storage.managedStorage.version).to.equal('1.0.0');
    expect(background.storage.managedStorage.lockedSettings).to.include('automaticMode.active');
    expect(background.storage.managedStorage.lockedSettings).to.include('container.namePrefix');

    // Check that managed preferences were applied
    expect(background.storage.local.preferences.automaticMode.active).to.be.true;
    expect(background.storage.local.preferences.container.namePrefix).to.equal('test-tmp');
  });

  it('should validate preference changes against locked settings', async () => {
    const { tmp: background } = await loadBackground();

    // Set up managed storage state
    background.storage.managedStorage = {
      isManaged: true,
      version: '1.0.0',
      lastChecked: Date.now(),
      lockedSettings: ['automaticMode.active', 'container.namePrefix'],
      overrides: {},
    };

    // Test locked setting validation
    expect(background.storage.isSettingLocked('automaticMode.active')).to.be.true;
    expect(background.storage.isSettingLocked('container.namePrefix')).to.be.true;
    expect(background.storage.isSettingLocked('notifications')).to.be.false;

    // Test validation method
    const lockedValidation = background.storage.validatePreferenceChange('automaticMode.active', false);
    expect(lockedValidation.allowed).to.be.false;
    expect(lockedValidation.reason).to.contain('managed by your organization policy');

    const allowedValidation = background.storage.validatePreferenceChange('notifications', true);
    expect(allowedValidation.allowed).to.be.true;
  });

  it('should handle managed storage errors gracefully', async () => {
    const { tmp: background, browser } = await loadBackground({
      initialize: false,
    });

    // Mock managed storage error
    browser.storage.managed.get.rejects(new Error('Access denied'));

    await background.initialize();

    expect(background.storage.managedStorage.isManaged).to.be.false;
  });

  it('should deep merge managed preferences correctly', async () => {
    const { tmp: background, browser } = await loadBackground({
      initialize: false,
    });

    // Mock partial managed configuration
    const mockManagedConfig = {
      version: '1.0.0',
      preferences: {
        container: {
          namePrefix: 'corp-tmp',
          color: 'blue',
          // Note: other container properties should remain as defaults
        },
        isolation: {
          global: {
            navigation: {
              action: 'always',
            },
            // Note: mouseClick settings should remain as defaults
          },
        },
      },
    };

    browser.storage.managed.get.resolves(mockManagedConfig);

    await background.initialize();

    // Check that managed preferences were merged with defaults
    expect(background.storage.local.preferences.container.namePrefix).to.equal('corp-tmp');
    expect(background.storage.local.preferences.container.color).to.equal('blue');
    expect(background.storage.local.preferences.container.removal).to.equal(background.preferences.defaults.container.removal);

    expect(background.storage.local.preferences.isolation.global.navigation.action).to.equal('always');
    expect(background.storage.local.preferences.isolation.global.mouseClick).to.deep.equal(
      background.preferences.defaults.isolation.global.mouseClick
    );
  });
});
