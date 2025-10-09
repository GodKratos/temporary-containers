# Developer Guide

This guide covers development setup, workflows, and contribution guidelines for the Temporary Containers extension.

## Quick Start

### Setup Development Environment

After cloning the repository:

1. Install dependencies: `npm install --legacy-peer-deps`
2. Install git hooks: `npm run prepare` (runs automatically after install)
3. Build the project: `npm run build`
4. Run in Firefox: `npm run dev:test`

### Run in Firefox

- `npm run dev:test`
  - builds the dist directory by running `npm run build`
  - then runs `npx web-ext run -s dist` which starts the default system Firefox with a temporary profile, loads the Add-on and watches for changes
  - run `npx web-ext run -s dist` with `-p profilename` appended to start Firefox with a specific profile

or

- Open `about:debugging` and `Load Temporary Add-on` which is located in the `dist` directory
- Check `about:debugging` and click `Inspect` to the right of Temporary Containers to see the console.

## Available Scripts

### Build Commands

- `npm run build` - Clean and build the extension for production
- `npm run clean` - Remove build artifacts and dist directory
- `npm run dev` - Start webpack development server

### Testing Commands

- `npm test` - Run unit tests with coverage report
- `npm run test:functional` - Run functional tests
- `npm run watch:test` - Run tests in watch mode
- `npm run watch:test:verbose` - Run tests in watch mode with debug output

### Linting and Formatting

- `npm run lint` - Run all linting checks (ESLint, TypeScript, localization)
- `npm run lint:eslint` - Run ESLint on JavaScript and TypeScript files
- `npm run lint:tsc` - Run TypeScript compiler checks
- `npm run lint:localization` - Validate localization files
- `npm run format` - Format code using Prettier

### WebExtension Commands

- `npm run webext:build` - Build extension package
- `npm run webext:lint` - Lint extension using web-ext

## Git Hooks and Pre-commit Process

The project uses Husky for Git hooks with the following automated checks for local development:

### For Local Development (Husky Hooks)

**Pre-commit Hook:**

- Runs ESLint with auto-fix on `.ts` and `.js` files
- Runs Prettier formatting on `.ts`, `.js`, `.html`, `.css`, `.json`, `.yml`, and `.md` files

**Pre-push Hook:**

- Runs the full test suite (`npm run test`)
- Runs a test build (`npm run build`)
- Runs all linting checks (ESLint, TypeScript, localization) (`npm run lint`)

**Commit Message Hook:**

- Validates commit messages using commitlint with conventional commit format (type: description)

### For Pull Requests (GitHub Actions)

Pull requests from forks are automatically validated using GitHub Actions, which enforces the same standards:

- Commit message validation using commitlint
- Full test suite execution
- Linting and formatting checks
- Successful build verification

**Note:** Contributors working on forks should run `npm install` to set up local git hooks, but PR validation will catch any issues regardless.

### Conventional Commit Types

Valid commit types for both local hooks and PR validation:

- **build**: Changes that affect the build system or external dependencies
- **chore**: Other changes that do not modify source or test files
- **ci**: Changes to CI configuration files and scripts
- **docs**: Changes are only to documentation
- **feat**: A new feature is introduced
- **fix**: A bug fix is implemented
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **revert**: For when a change has been reverted
- **style**: Code formatting, white-space, or other formatting changes
- **test**: Adding missing tests or correcting existing tests

## Release Process

The project uses automated GitHub Actions workflows for releases. All releases are triggered by pushing tags with specific formats.

### Tag Format Requirements

- **Beta releases**: `beta-X.Y.Z` (e.g., `beta-1.2.3`)
- **Production releases**: `release-X.Y.Z` (e.g., `release-1.2.3`)

### Production Release Process

1. Ensure all tests pass: `npm test`
2. Ensure code is properly formatted: `npm run format`
3. Ensure all linting checks pass: `npm run lint`
4. Bump manifest version in `src/manifest.json` (version must be numbers only e.g. `1.0.0`)
5. Commit and push:
   ```bash
   git commit -am "chore: prepare release v1.0.0"
   git push origin main
   ```
6. Create and push release tag:
   ```bash
   git tag release-1.0.0
   git push origin release-1.0.0
   ```
7. Generate release notes:
   ```bash
   git log $(git tag --sort=-creatordate | grep release | sed -n 2p)..HEAD --reverse --pretty=format:%s | grep -E "(fix|feat|perf):"
   ```
8. Update release notes on github after workflow completes

The GitHub Actions workflow will automatically:

- Run tests and linting checks
- Build and package the extension
- Sign the extension for **listed** distribution on AMO (becomes the latest public version)
- Create a GitHub release marked as **latest**
- Upload signed `.xpi` and source `.zip` files

### Beta Release Process

1. Ensure all tests pass: `npm test`
2. Ensure code is properly formatted: `npm run format`
3. Ensure all linting checks pass: `npm run lint`
4. Bump manifest version in `src/manifest.json` (version must be numbers only e.g. `1.0.0`)
5. Commit and push:
   ```bash
   git commit -am "chore: prepare beta v1.0.0"
   git push origin branch
   ```
6. Create and push beta tag:
   ```bash
   git tag beta-1.0.0
   git push origin beta-1.0.0
   ```
7. Generate release notes:
   ```bash
   git log $(git tag --sort=-creatordate | sed -n 2p)..HEAD --reverse --pretty=format:%s | grep -E "(fix|feat|perf):"
   ```
8. Update release notes on github after workflow completes

The GitHub Actions workflow will automatically:

- Run tests and linting checks
- Build and package the extension
- Sign the extension for **unlisted** distribution on AMO (manual install only)
- Create a GitHub release marked as **pre-release**
- Upload signed `.xpi` and source `.zip` files

### Manual Release Steps (if needed)

If you need to release manually or the automated workflow fails:

1. Build the extension: `npm run build`
2. Package the extension: `npm run webext:build`
3. Sign manually: `npm run beta` (for beta) or manual web-ext signing

### Release Differences

| Release Type   | AMO Channel | GitHub Release | Automatic Updates      | Tag Format      |
| -------------- | ----------- | -------------- | ---------------------- | --------------- |
| **Beta**       | Unlisted    | Pre-release    | ❌ Manual install only | `beta-X.Y.Z`    |
| **Production** | Listed      | Latest         | ✅ Automatic updates   | `release-X.Y.Z` |

## Project Structure

- `/src`: Contains the source code for the extension.
- `/src/background`: Background scripts for managing container logic.
- `/src/ui`: scripts for user interface components.
  - `popup`: Code for the popup interface for the extension icon.
  - `options`: Code for the options/settings page.
  - `pages`: Settings pages accessed through options and popup interfaces.
  - `_locales`: Localization files for different languages.
- `/test`: Contains test cases for the extension.

## Libraries and Frameworks

- Typescript for type-safe JavaScript development.
- Webpack for module bundling.
- Fontello for iconography.
- Sinon for mocking and stubbing in tests.

## Contributing Guidelines

- Follow the project's coding conventions and best practices.
- Write clear and concise commit messages using conventional commit format.
- Include tests for new features and bug fixes.
- Keep the codebase clean and well-organized.
- Apply consistent styling and formatting across the UI components, reusing CSS classes where applicable.

### Localization Requirements

- Any text presented to users in HTML or code must use `data-i18n` attributes and reference message keys from `src/_locales`.
- When adding new data-i18n attributes, ensure they reference existing message keys or add new keys as needed.
- Use the English locale as the main reference for all localisation strings.
- When adding new localisation fields, add equivalent translations in all supported languages.
- Use camelCase for message keys that identify where the string is used in the GUI and its purpose.
