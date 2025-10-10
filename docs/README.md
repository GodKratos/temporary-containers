# Documentation

This directory contains **technical and enterprise documentation** for the Temporary Containers extension that needs to be version-controlled with the source code.

## Documentation Structure

### Repository Documentation (`docs/`)

**Technical documentation that belongs with the source code:**

- [Development Guide](DEVELOPMENT.md) - Complete developer setup, workflows, and contribution guidelines
- Enterprise deployment guides and policies
- API references and schemas
- Build and release documentation
- [Addon Description](ADDON_DESCIPTION.md) - Description used on mozilla addon site for the product page

### Wiki Documentation

**User-facing documentation for end users:**

- [Getting Started](https://github.com/GodKratos/temporary-containers/wiki/Getting-Started)
- [Automatic Mode](https://github.com/GodKratos/temporary-containers/wiki/General-Settings#automatic-mode)
- [Global Isolation](https://github.com/GodKratos/temporary-containers/wiki/Global-Isolation)
- [Per-Domain Rules](https://github.com/GodKratos/temporary-containers/wiki/Per-Domain-Rules)
- [Advanced Features (Cookies, Scripts, History Deletion)](https://github.com/GodKratos/temporary-containers/wiki/Advanced)
- [Export & Import](https://github.com/GodKratos/temporary-containers/wiki/Export-Import)
- [Statistics](https://github.com/GodKratos/temporary-containers/wiki/Statistics)
- [Troubleshooting](https://github.com/GodKratos/temporary-containers/wiki/Troubleshooting)

## Enterprise Documentation

This repository contains comprehensive enterprise deployment documentation:

- **[Enterprise Setup Guide](enterprise/MANAGED_STORAGE.md)** - Complete guide for deploying Temporary Containers in enterprise environments
- **[Policy Schema](enterprise/managed-storage-schema.json)** - JSON Schema definition for managed storage policies
- **[Example Configuration](enterprise/managed-storage-example.json)** - Working enterprise policy configuration
- **[Policy Templates](enterprise/policy-templates/)** - Pre-built configurations for common security scenarios
- **[ADMX Templates](enterprise/admx/)** - Windows Group Policy templates

### Enterprise Features

- **Policy-based Configuration** - Configure extension settings through Firefox Enterprise Policy
- **Setting Lock Management** - Prevent users from modifying critical security settings
- **Centralized Deployment** - Deploy consistent configurations across organizations
- **Cross-platform Support** - Windows Group Policy, macOS profiles, and Linux policies.json
- **Real-time Updates** - Policy changes apply without extension restart

## Quick Links

- **[Main README](../README.md)** - Project overview and development setup
- **[User Wiki](https://github.com/GodKratos/temporary-containers/wiki)** - Complete user documentation and guides
- **[Enterprise Managed Storage](https://github.com/GodKratos/temporary-containers/wiki/Managed-Storage)** - Wiki page for enterprise managed storage overview
