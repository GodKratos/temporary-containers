# Testing Managed Storage Locally in Firefox

## Method 1: Using Firefox Policies (Recommended for Testing)

### Step 1: Create Policy File

Create a file at one of these locations:

**Windows:**

```
C:\Program Files\Mozilla Firefox\distribution\policies.json
```

**macOS:**

```
/Applications/Firefox.app/Contents/Resources/distribution/policies.json
```

**Linux:**

```
/usr/lib/firefox/distribution/policies.json
```

### Step 2: Policy File Content

```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "{1ea2fa75-677e-4702-b06a-50fc7d06fe7e}": {
          "preferences": {
            "automaticMode": {
              "active": true
            },
            "notifications": false,
            "container": {
              "namePrefix": "corp-tmp",
              "color": "blue"
            }
          },
          "locked_settings": ["automaticMode.active", "notifications", "container.namePrefix"],
          "policy_name": "Corporate IT Policy",
          "policy_description": "Enterprise settings for temporary containers"
        }
      }
    }
  }
}
```

### Step 3: Restart Firefox

After creating the policy file, restart Firefox completely.

## Method 2: Using about:config (Development)

1. Open `about:config` in Firefox
2. Create these preferences:

```
extensions.temporaryContainers.managed.preferences -> JSON string of preferences
extensions.temporaryContainers.managed.lockedSettings -> JSON array of locked settings
```

Example values:

```
extensions.temporaryContainers.managed.preferences: {"automaticMode":{"active":true},"notifications":false}
extensions.temporaryContainers.managed.lockedSettings: ["automaticMode.active","notifications"]
```

## Method 3: Local Development Testing

### Quick Test Script

Add this to your extension's background script temporarily:

```javascript
// Temporary testing - simulate managed storage
if (typeof browser !== 'undefined' && browser.storage && browser.storage.managed) {
  // Override the managed storage for testing
  const originalGet = browser.storage.managed.get;
  browser.storage.managed.get = async () => {
    return {
      preferences: {
        automaticMode: { active: true },
        notifications: false,
        container: { namePrefix: 'corp-tmp' },
      },
      locked_settings: ['automaticMode.active', 'notifications', 'container.namePrefix'],
      policy_name: 'Test Policy',
    };
  };
}
```

## Method 4: Extension Development Profile

Create a special Firefox profile for testing:

1. Create new profile: `firefox -P -no-remote`
2. Install your extension in developer mode
3. Apply one of the above methods to this profile only

## Testing Checklist

When testing, verify:

- [ ] Lock icons (🔒) appear next to managed settings
- [ ] Managed settings are disabled (grayed out)
- [ ] Tooltips show "This setting is managed by policy"
- [ ] Settings cannot be changed by user
- [ ] Non-managed settings remain editable
- [ ] Visual styling matches the design system

## Debugging

Check browser console for:

- Managed storage detection logs
- Indicator creation confirmations
- Any errors in the application flow

Use the test HTML page first to verify behavior, then apply the same managed storage setup to Firefox for full extension testing.

## Complete Policy Template: Lock All Settings

For comprehensive testing, here's a policy template that locks **all** extension settings:

### policies.json - Complete Lockdown Template

```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "{1ea2fa75-677e-4702-b06a-50fc7d06fe7e}": {
          "preferences": {
            "automaticMode": {
              "active": true,
              "newTab": "created"
            },
            "notifications": false,
            "container": {
              "namePrefix": "enterprise-tmp",
              "color": "blue",
              "colorRandom": false,
              "colorRandomExcluded": ["red", "orange"],
              "icon": "briefcase",
              "iconRandom": false,
              "iconRandomExcluded": ["fingerprint", "dollar"],
              "numberMode": "keep",
              "removal": 900000
            },
            "isolation": {
              "reactivateDelay": 1000,
              "global": {
                "mouseClicks": {
                  "middle": {
                    "action": "never",
                    "container": "default"
                  },
                  "ctrlleft": {
                    "action": "never",
                    "container": "default"
                  },
                  "left": {
                    "action": "never",
                    "container": "default"
                  }
                },
                "navigation": {
                  "action": "never",
                  "container": "default"
                }
              },
              "domain": [],
              "mac": {
                "action": "disabled"
              }
            },
            "browserActionPopup": false,
            "pageAction": false,
            "contextMenu": false,
            "contextMenuBookmarks": false,
            "replaceTabs": false,
            "closeRedirectorTabs": {
              "active": false,
              "delay": 0,
              "domains": []
            },
            "ignoreRequests": ["localhost", "127.0.0.1"],
            "cookies": {
              "domain": {}
            },
            "scripts": {
              "active": false,
              "domain": {}
            },
            "deletesHistory": {
              "active": false,
              "automaticMode": "never",
              "contextMenu": false,
              "contextMenuBookmarks": false,
              "containerAlwaysPerDomain": "never",
              "containerIsolation": "never",
              "containerRemoval": 60000,
              "containerMouseClicks": "never",
              "statistics": false
            },
            "statistics": false,
            "ui": {
              "expandPreferences": false,
              "popupDefaultTab": "isolation-global"
            }
          },
          "locked_settings": [
            "automaticMode.active",
            "automaticMode.newTab",
            "notifications",
            "container.namePrefix",
            "container.color",
            "container.colorRandom",
            "container.colorRandomExcluded",
            "container.icon",
            "container.iconRandom",
            "container.iconRandomExcluded",
            "container.numberMode",
            "container.removal",
            "iconColor",
            "isolation.reactivateDelay",
            "isolation.global.mouseClicks.middle.action",
            "isolation.global.mouseClicks.middle.container",
            "isolation.global.mouseClicks.ctrlleft.action",
            "isolation.global.mouseClicks.ctrlleft.container",
            "isolation.global.mouseClicks.left.action",
            "isolation.global.mouseClicks.left.container",
            "isolation.global.navigation.action",
            "isolation.global.navigation.container",
            "isolation.domain",
            "isolation.mac.action",
            "browserActionPopup",
            "pageAction",
            "contextMenu",
            "contextMenuBookmarks",
            "replaceTabs",
            "closeRedirectorTabs.active",
            "closeRedirectorTabs.delay",
            "closeRedirectorTabs.domains",
            "ignoreRequests",
            "cookies.domain",
            "scripts.active",
            "scripts.domain",
            "deletesHistory.active",
            "deletesHistory.automaticMode",
            "deletesHistory.contextMenu",
            "deletesHistory.contextMenuBookmarks",
            "deletesHistory.containerAlwaysPerDomain",
            "deletesHistory.containerIsolation",
            "deletesHistory.containerRemoval",
            "deletesHistory.containerMouseClicks",
            "deletesHistory.statistics",
            "statistics",
            "ui.expandPreferences",
            "ui.popupDefaultTab"
          ],
          "policy_name": "Enterprise Complete Lockdown Policy",
          "policy_description": "Comprehensive enterprise policy that locks all Temporary Containers settings for security compliance"
        }
      }
    }
  }
}
```

### What This Policy Does:

**🔒 Global Lockdown:**

- **ALL settings are locked** and cannot be changed by users
- Users will see padlock icons (🔒) next to every setting
- All form fields will be disabled and grayed out
- Tooltips will show "This setting is managed by policy"

**⚙️ Enforced Configuration:**

- Automatic mode enabled with secure defaults
- Notifications disabled for silent operation
- Enterprise container naming (`enterprise-tmp`)
- Blue theme for corporate branding
- Conservative container management (15min removal)
- Isolation features disabled for security
- Statistics and history features disabled
- Context menus and shortcuts disabled

**🎯 Use Cases:**

- **Security Testing**: Verify no settings can be bypassed
- **UI Testing**: See complete visual lockdown effect
- **Enterprise Demo**: Show full managed deployment
- **Compliance Validation**: Ensure policy enforcement works

**🔧 Customization:**
To partially unlock settings, remove items from the `locked_settings` array while keeping the corresponding `preferences` values as defaults.
