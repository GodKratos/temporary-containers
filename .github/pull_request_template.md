## Pull Request Checklist

Please ensure your PR meets the following requirements:

### Commit Message Format

- [ ] All commit messages follow the conventional commit format: `type: description`
- [ ] Valid types:
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

### Code Quality

- [ ] Code has been formatted with Prettier
- [ ] All linting checks pass
- [ ] All tests pass
- [ ] New features include appropriate tests

### Localization (if applicable)

- [ ] New user-facing text uses `data-i18n` attributes
- [ ] Localization keys added to all supported languages in `src/_locales`
- [ ] Follow camelCase naming for localization keys

## Description

Describe your changes here.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

Describe how you tested your changes:

## Screenshots (if applicable)

Add screenshots to help explain your changes.
