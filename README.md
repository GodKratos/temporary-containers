# Temporary Containers Plus Firefox Add-on

https://addons.mozilla.org/en-GB/firefox/addon/temporary-containers-plus/

This is a continuation of the amazing addon [originally created and maintained by stoically](https://github.com/stoically/temporary-containers) who has since passed away.

Detailed information about the Add-on [can be found in the wiki](https://github.com/GodKratos/temporary-containers/wiki). There's also [this long-form article](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21) from the orignal developer, explain its features and how it works.

## Development

### Requirements

- Clone the repository
- `npm install --legacy-peer-deps`
- `npm run dev`

### Run in Firefox

- `npm run dev:test`
  - builds the dist directory by running `npm run build`
  - then runs `npx web-ext run -s dist` which starts the default system Firefox with a temporary profile, loads the Add-on and watches for changes
  - run `npx web-ext run -s dist` with `-p profilename` appended to start Firefox with a specific profile

or

- Open `about:debugging` and `Load Temporary Add-on` which is located in the `dist` directory

Check `about:debugging` and click `Inspect` to the right of Temporary Containers to see the console.

### Run the tests

- Once: `npm test`
  - Shows a coverage summary and generates a detailed report in the `coverage` directory
- Watcher: `npm run watch:test`

### Release

- Bump manifest version
- Commit, tag and push
- Build and package the extension
- `npm run build`
- `npm run webext:build`

#### AMO and GitHub

- Upload zip web-ext-artifact to AMO
- Download published AMO xpi
- Create and publish GitHub release with AMO xpi

#### Pre-Release on GitHub

- Bump manifest version
- Commit and push
- git tag beta-1.0.0
- git push origin beta-1.0.0
  - This will trigger the release-beta.yml workflow to build and sign a beta version to add to the release
- git log \$(git tag --sort=-version:refname | sed -n 2p)..HEAD --pretty=format:%s
- Add release notes and publish

## License

MIT
