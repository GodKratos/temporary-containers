# Temporary Containers Plus Firefox Add-on

https://addons.mozilla.org/en-GB/firefox/addon/temporary-containers-plus/

This is a continuation of the amazing addon [originally created and maintained by stoically](https://github.com/stoically/temporary-containers) who has since passed away.

Detailed information about the Add-on [can be found in the wiki](https://github.com/GodKratos/temporary-containers/wiki). There's also [this long-form article](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21) from the orignal developer, explain its features and how it works.

## Development

### Requirements

- Clone the repository
- `npm install --legacy-peer-deps`

### Available Scripts

#### Build Commands

- `npm run build` - Clean and build the extension for production
- `npm run clean` - Remove build artifacts and dist directory
- `npm run dev` - Start webpack development server

#### Testing Commands

- `npm test` - Run unit tests with coverage report
- `npm run test:functional` - Run functional tests
- `npm run watch:test` - Run tests in watch mode
- `npm run watch:test:verbose` - Run tests in watch mode with debug output

#### Linting and Formatting

- `npm run lint` - Run all linting checks (ESLint, TypeScript, localization)
- `npm run lint:eslint` - Run ESLint on JavaScript and TypeScript files
- `npm run lint:tsc` - Run TypeScript compiler checks
- `npm run lint:localization` - Validate localization files
- `npm run format` - Format code using Prettier

#### WebExtension Commands

- `npm run webext:build` - Build extension package
- `npm run webext:lint` - Lint extension using web-ext

### Run in Firefox

- `npm run dev:test`
  - builds the dist directory by running `npm run build`
  - then runs `npx web-ext run -s dist` which starts the default system Firefox with a temporary profile, loads the Add-on and watches for changes
  - run `npx web-ext run -s dist` with `-p profilename` appended to start Firefox with a specific profile

or

- Open `about:debugging` and `Load Temporary Add-on` which is located in the `dist` directory

Check `about:debugging` and click `Inspect` to the right of Temporary Containers to see the console.

### Git Hooks and Pre-commit Process

The project uses Husky for Git hooks with the following automated checks:

#### Pre-commit Hook

- Runs `lint-staged` which automatically:
  - Runs ESLint with auto-fix on `.ts` and `.js` files
  - Runs Prettier formatting on `.ts`, `.js`, `.html`, `.css`, `.json`, `.yml`, and `.md` files
  - Only processes staged files for better performance

#### Pre-push Hook

- Runs the full test suite (`npm test`)
- Validates the extension build (`npm run webext:lint`)
- Validates localization files (`npm run lint:localization`)

#### Commit Message Hook

- Validates commit messages using commitlint with conventional commit format

### Setup Development Environment

After cloning the repository:

1. Install dependencies: `npm install --legacy-peer-deps`
2. Install git hooks: `npm run prepare` (runs automatically after install)
3. Build the project: `npm run build`
4. Run in Firefox: `npm run dev:test`

### Release

#### Production Release Process

1. Ensure all tests pass: `npm test`
2. Ensure code is properly formatted: `npm run format`
3. Ensure all linting checks pass: `npm run lint`
4. Bump manifest version in `src/manifest.json` (version must be numbers only e.g. `1.0.0`)
5. Commit and tag:
   ```bash
   git commit -am "Release v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   ```
6. Build the extension: `npm run build`
7. Package the extension: `npm run webext:build`

#### AMO and GitHub

- Upload zip web-ext-artifact to AMO
- Download published AMO xpi
- Create and publish GitHub release with AMO xpi

#### Pre-Release on GitHub

1. Bump manifest version in `src/manifest.json` (version must be numbers only e.g. `1.0.0`)
2. Commit and push:
   ```bash
   git commit -am "Prepare beta v1.0.0"
   git push origin main
   ```
3. Create and push beta tag:
   ```bash
   git tag beta-1.0.0
   git push origin beta-1.0.0
   ```
   - This will trigger the release-beta.yml workflow to build and sign a beta version to add to the release
4. Generate release notes:
   ```bash
   git log $(git tag --sort=-version:refname | sed -n 2p)..HEAD --pretty=format:%s
   ```
5. Add release notes and publish

## License

MIT
