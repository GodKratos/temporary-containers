# Security Policy

## Supported Versions

Temporary Containers is a browser extension distributed through the Firefox
Add-ons store. Only the latest released version is supported with security
fixes. Users should always run the most recent version available from
[addons.mozilla.org](https://addons.mozilla.org/firefox/addon/temporary-containers/)
or the Firefox Add-ons auto-update mechanism.

## Reporting a Vulnerability

If you discover a security vulnerability in Temporary Containers, please
**do not** open a public GitHub issue or discuss it in public channels.

Instead, report it privately using one of the following methods:

1. **Preferred:** Use GitHub's
   [private vulnerability reporting](https://github.com/GodKratos/temporary-containers/security/advisories/new)
   feature (the "Report a vulnerability" button on the
   [Security tab](https://github.com/GodKratos/temporary-containers/security)).
   This creates a private advisory visible only to the maintainers until a fix
   is released.
2. If private reporting is unavailable to you, open a draft
   [security advisory](https://github.com/GodKratos/temporary-containers/security/advisories)
   or contact the maintainer directly through their
   [GitHub profile](https://github.com/GodKratos).

Please include as much detail as possible to help us triage the report
quickly:

- A description of the vulnerability and its potential impact
- Steps to reproduce, including affected settings/configuration
- The extension version and Firefox version used
- Any proof-of-concept code, screenshots, or logs

## What to Expect

- We aim to acknowledge reports within 7 days.
- Once a vulnerability is confirmed, we will work on a fix and coordinate a
  release timeline with you before any public disclosure.
- Credit will be given to reporters in the release notes, unless anonymity
  is requested.

## Automated Security Scanning

In addition to manually reported vulnerabilities, this repository uses
automated static analysis (Aikido) to continuously scan first-party code and
dependencies for known vulnerability patterns. Findings are triaged and fixed
by the maintainers as part of normal development.
