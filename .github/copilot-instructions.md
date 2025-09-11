# Project Overview

This project is a Firefox extension for managing temporary containers. It allows users to open links in temporary containers, which are isolated from the main browsing context. This helps in maintaining privacy and preventing tracking across different browsing sessions.

## Folder Structure

- `/src`: Contains the source code for the extension.
- `/src/background`: Background scripts for managing container logic.
- `/src/ui`: scripts for user interface components.
  - `popup`: Code for the popup interface for the extension icon.
  - `options`: Code for the options/settings page.
  - `pages`: Settings pages accessed through options and popup interfaces.
  - `_locales`: Localization files for different languages.

## Libraries and Frameworks

- Typescript for type-safe JavaScript development.
- Webpack for module bundling.
- Fontello for iconography.

# General Instructions

- Update the README.md file with any significant changes to functionality or setup instructions.
- Follow the project's coding conventions and best practices.
- Write clear and concise commit messages.
- Include tests for new features and bug fixes.
- Keep the codebase clean and well-organized.

# Localisation

## Localisation Requirements

- Any text presented to users in HTML or code must use `data-i18n` attributes and reference message keys from `@src/_locales`.
- When adding new data-i18n attributes, ensure they reference existing message keys or add new keys as needed.
- Use the English locale as the main reference for all localisation strings. When adding or updating text, ensure the English version is correct and up-to-date.
- When adding new localisation fields, add equivalent translations in all supported languages in `@src/_locales`.
- Ensure the text in HTML/code files matches the related English localisation string. When either is modified, update both to match.
- Before adding a new message key, check if a field with the same string already exists and reuse it if appropriate.
- Use camelCase for message keys. Keys should identify where the string is used in the GUI and its purpose, following the style of existing keys.
- When editing code, suggest required localisation changes as inline edits.

## Example

- When adding a button labeled "Save":
  - Add a message key like `uiSaveButtonLabel` to all locale files.
  - Use `<button data-i18n="uiSaveButtonLabel"></button>` in HTML.
  - Ensure the English locale value is "Save" and other locales are translated.
