# Wiki Synchronization Guide

This document outlines the process for keeping the GitHub wiki synchronized with repository documentation.

## Documentation Strategy

### Repository (`docs/`) - Technical Documentation

Keep these in the repository for version control with code:

- Enterprise deployment guides (`enterprise/`)
- Developer setup and contribution guides
- API references and schemas
- Build, test, and release documentation
- Configuration templates and examples

### Wiki - User Documentation

Keep these in the wiki for easy community editing:

- Installation guides for end users
- Feature explanations and tutorials
- Troubleshooting guides and FAQ
- User tips and community contributions
- Getting started guides

## Sync Process

### 1. Clone Wiki Repository

```bash
# Clone wiki alongside main repository
git clone https://github.com/GodKratos/temporary-containers.wiki.git
```

### 2. Regular Sync Workflow

**When updating enterprise features:**

1. Update technical docs in `docs/` during feature development
2. Update corresponding wiki overview pages after merge to main
3. Ensure cross-references between repo docs and wiki are maintained

**When updating user features:**

1. Update wiki pages directly for user-facing changes
2. Link to technical docs in repository when appropriate
