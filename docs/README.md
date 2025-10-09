# Documentation

This directory contains **technical and enterprise documentation** for the Temporary Containers extension that needs to be version-controlled with the source code.

## Documentation Structure

### Repository Documentation (`docs/`)

**Technical documentation that belongs with the source code:**

- **[Development Guide](DEVELOPMENT.md)** - Complete developer setup, workflows, and contribution guidelines
- Enterprise deployment guides and policies
- API references and schemas
- Build and release documentation

### Wiki Documentation

**User-facing documentation for end users:**

- [Installation and setup guides](https://github.com/GodKratos/temporary-containers/wiki)
- [Feature explanations and tutorials](https://github.com/GodKratos/temporary-containers/wiki)
- [Troubleshooting and FAQ](https://github.com/GodKratos/temporary-containers/wiki)

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
