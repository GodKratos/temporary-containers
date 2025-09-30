# Enterprise Deployment Files

This directory contains all the files needed for enterprise deployment of the Temporary Containers extension.

## Files

- **[MANAGED_STORAGE.md](MANAGED_STORAGE.md)** - Complete setup and configuration guide
- **[managed-storage-schema.json](managed-storage-schema.json)** - JSON Schema for policy validation
- **[managed-storage-example.json](managed-storage-example.json)** - Example corporate policy

### Policy Templates

Pre-configured policy templates for common scenarios:

- **[basic-security.json](policy-templates/basic-security.json)** - Minimal security configuration
- **[high-security.json](policy-templates/high-security.json)** - Maximum security for sensitive environments
- **[development.json](policy-templates/development.json)** - Flexible settings for development teams

### Windows Group Policy (ADMX)

- **[TemporaryContainers.admx](admx/TemporaryContainers.admx)** - Group Policy template
- **[TemporaryContainers.adml](admx/en-US/TemporaryContainers.adml)** - English language resources

## Quick Deployment

### Windows (Group Policy)

1. Install Firefox ADMX templates
2. Configure `ExtensionSettings` policy with extension ID: `{1ea2fa75-677e-4702-b06a-50fc7d06fe7e}`
3. Use [`managed-storage-example.json`](managed-storage-example.json) as configuration reference

### macOS (Configuration Profile)

1. Create configuration profile with Firefox extension settings
2. Deploy via MDM (Jamf, Microsoft Intune, etc.)
3. Reference policy schema for available settings

### Linux (policies.json)

1. Place configuration in `/etc/firefox/policies/policies.json`
2. Use `3rdparty.Extensions` section for extension-specific settings

## Support

For enterprise support and deployment assistance, please refer to the [main documentation](MANAGED_STORAGE.md) or create an issue in the project repository.
