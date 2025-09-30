# Managed Storage Configuration for Temporary Containers

This document explains how to configure Temporary Containers extension using managed storage for enterprise environments.

## Overview

Managed storage allows system administrators to configure Firefox extensions through policies, enabling centralized management of extension settings across an organization.

## Setup Instructions

### 1. Firefox Policy Configuration

#### Windows (Group Policy)

##### Option 1: Using Custom ADMX Template (Recommended)

1. **Install the Temporary Containers ADMX template**:
   - Copy [`admx/TemporaryContainers.admx`](admx/TemporaryContainers.admx) to `%SystemRoot%\PolicyDefinitions\`
   - Copy [`admx/en-US/TemporaryContainers.adml`](admx/en-US/TemporaryContainers.adml) to `%SystemRoot%\PolicyDefinitions\en-US\`

2. **Configure the policy**:
   - Navigate to: `Computer Configuration → Administrative Templates → Mozilla → Firefox → Temporary Containers`
   - Enable `Configure Temporary Containers Settings`
   - Enter your JSON configuration in the policy text field

##### Option 2: Using Generic Firefox Extension Policy

1. **Install Firefox ADMX templates** if not already installed
2. **Enable managed storage** in Group Policy:
   - Navigate to: `Computer Configuration → Administrative Templates → Mozilla → Firefox → Extensions`
   - Enable `Configure extension storage managed by an administrator`

3. **Configure the extension policy**:
   - Navigate to: `Computer Configuration → Administrative Templates → Mozilla → Firefox → Extensions`
   - Enable `Extensions to configure`
   - Add the extension ID: `{1ea2fa75-677e-4702-b06a-50fc7d06fe7e}`
   - Set the configuration JSON (see example below)

#### macOS

1. **Create a configuration profile** with the following structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>org.mozilla.firefox</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>ExtensionSettings</key>
            <dict>
                <key>{1ea2fa75-677e-4702-b06a-50fc7d06fe7e}</key>
                <dict>
                    <key>storage</key>
                    <dict>
                        <!-- Configuration goes here -->
                    </dict>
                </dict>
            </dict>
        </dict>
    </array>
</dict>
</plist>
```

#### Linux

1. **Create a policies.json file** in one of these locations:
   - `/etc/firefox/policies/policies.json` (system-wide)
   - `/usr/lib/firefox/distribution/policies.json` (distribution)

2. **Add the extension configuration**:

```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "{1ea2fa75-677e-4702-b06a-50fc7d06fe7e}": {
          // Configuration goes here
        }
      }
    }
  }
}
```

### 2. Configuration Schema

The managed storage configuration follows this structure:

```json
{
  "version": "1.0.0",
  "policy_name": "Corporate Temporary Containers Policy",
  "policy_description": "Enterprise policy configuration for Temporary Containers extension",
  "locked_settings": ["automaticMode.active", "isolation.global.navigation.action", "deletesHistory.active"],
  "preferences": {
    // Extension preferences (see full schema below)
  }
}
```

#### Key Fields

- **version**: Version identifier for the policy configuration
- **policy_name**: Human-readable name for the policy
- **policy_description**: Description of what the policy configures
- **locked_settings**: Array of setting paths that users cannot modify
- **preferences**: Extension preferences to be enforced

#### Locked Settings

Settings can be locked to prevent user modification. Use dot notation to specify nested settings:

- `"automaticMode.active"` - Locks the automatic mode toggle
- `"container.namePrefix"` - Locks the container name prefix
- `"isolation.global.navigation.action"` - Locks navigation isolation behavior
- `"deletesHistory.active"` - Locks history deletion feature

## Configuration Examples

### Pre-built Templates

For common deployment scenarios, use these pre-configured templates:

- **[Basic Security](policy-templates/basic-security.json)** - Minimal security configuration
- **[High Security](policy-templates/high-security.json)** - Maximum security for sensitive environments
- **[Development](policy-templates/development.json)** - Flexible settings for development teams

### Custom Configuration Examples

#### Basic Corporate Policy

```json
{
  "version": "1.0.0",
  "policy_name": "Basic Corporate Security Policy",
  "policy_description": "Enforces basic security settings for temporary containers",
  "locked_settings": ["automaticMode.active", "deletesHistory.active", "statistics"],
  "preferences": {
    "automaticMode": {
      "active": true,
      "newTab": "created"
    },
    "container": {
      "namePrefix": "corp-tmp",
      "color": "blue",
      "removal": 300000
    },
    "isolation": {
      "global": {
        "navigation": {
          "action": "always"
        }
      }
    },
    "deletesHistory": {
      "active": true,
      "automaticMode": "automatic"
    },
    "statistics": false
  }
}
```

### High Security Environment

```json
{
  "version": "1.0.0",
  "policy_name": "High Security Policy",
  "policy_description": "Maximum isolation and security for sensitive environments",
  "locked_settings": ["automaticMode", "isolation", "deletesHistory", "contextMenu", "statistics"],
  "preferences": {
    "automaticMode": {
      "active": true,
      "newTab": "created"
    },
    "container": {
      "namePrefix": "secure-tmp",
      "color": "red",
      "removal": 60000
    },
    "isolation": {
      "global": {
        "navigation": {
          "action": "always"
        },
        "mouseClick": {
          "middle": {
            "action": "always",
            "container": "new"
          },
          "ctrlleft": {
            "action": "always",
            "container": "new"
          },
          "left": {
            "action": "never",
            "container": "default"
          }
        }
      }
    },
    "deletesHistory": {
      "active": true,
      "automaticMode": "automatic",
      "containerIsolation": "automatic",
      "containerMouseClicks": "automatic"
    },
    "contextMenu": false,
    "statistics": false,
    "notifications": false
  }
}
```

### Permissive Development Environment

```json
{
  "version": "1.0.0",
  "policy_name": "Development Environment Policy",
  "policy_description": "Flexible settings for development teams",
  "locked_settings": ["container.namePrefix"],
  "preferences": {
    "container": {
      "namePrefix": "dev-tmp",
      "colorRandom": true,
      "iconRandom": true,
      "removal": 1800000
    },
    "browserActionPopup": true,
    "contextMenu": true,
    "statistics": true
  }
}
```

## Available Settings

See `managed-storage-schema.json` for the complete configuration schema.

### Core Settings

- **automaticMode**: Controls automatic container creation
- **container**: Default container appearance and behavior
- **isolation**: Navigation and click isolation rules
- **deletesHistory**: History deletion for privacy
- **contextMenu**: Context menu availability
- **statistics**: Usage statistics collection

### Security Considerations

When deploying managed storage:

1. **Lock critical security settings** to prevent users from weakening security
2. **Set appropriate container removal times** based on your security requirements
3. **Consider disabling statistics** in sensitive environments
4. **Test policies** in a development environment before deployment
5. **Monitor policy compliance** through Firefox telemetry or logs

## Troubleshooting

### Verifying Policy Application

1. **Check Firefox about:policies** page to verify policies are loaded
2. **Open extension options** to see which settings are locked (they should be disabled/grayed out)
3. **Check browser console** for any managed storage errors

### Common Issues

- **Policy not applying**: Verify the extension ID is correct
- **Settings not locked**: Check the locked_settings array syntax
- **Invalid configuration**: Validate JSON syntax and schema compliance

### Debug Information

The extension logs managed storage activity to the browser console. Enable debug mode to see detailed information about policy application and validation.

## Schema Reference

For the complete configuration schema, refer to:

- [`managed-storage-schema.json`](managed-storage-schema.json) - JSON Schema definition
- [`managed-storage-example.json`](managed-storage-example.json) - Complete example configuration

## Support

For enterprise support and custom policy requirements, please contact the extension maintainers with your specific use case requirements.
