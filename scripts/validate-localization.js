#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Localization Validation Script
 * Ensures all UI text is properly localized and all locale files are synchronized
 */

class LocalizationValidator {
  constructor() {
    this.localesDir = path.join(__dirname, '..', 'src', '_locales');
    this.uiDir = path.join(__dirname, '..', 'src', 'ui');
    this.sharedFile = path.join(__dirname, '..', 'src', 'shared.ts');
    this.supportedLocales = ['en', 'ru', 'tr'];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Main validation function
   */
  async validate() {
    console.log('🔍 Validating localization...');

    try {
      // Load all locale messages
      const messages = this.loadAllMessages();

      // Extract UI keys
      const uiKeys = this.extractUIKeys();

      // Validate consistency
      this.validateKeyConsistency(messages, uiKeys);
      this.validateLocaleCompleteness(messages);
      this.validateKeyUsage(messages, uiKeys);
      this.validateHardcodedStrings();

      // Report results
      this.reportResults();

      return this.errors.length === 0;
    } catch (error) {
      console.error('❌ Validation failed with error:', error.message);
      return false;
    }
  }

  /**
   * Load messages from all locale files
   */
  loadAllMessages() {
    const messages = {};

    for (const locale of this.supportedLocales) {
      const filePath = path.join(this.localesDir, locale, 'messages.json');

      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing locale file: ${locale}/messages.json`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        messages[locale] = JSON.parse(content);
      } catch (error) {
        this.errors.push(`Invalid JSON in ${locale}/messages.json: ${error.message}`);
      }
    }

    return messages;
  }

  /**
   * Extract all localization keys used in UI code
   */
  extractUIKeys() {
    const uiKeys = new Set();

    // Process UI directory
    this.processDirectory(this.uiDir, uiKeys);

    // Process shared.ts for constants
    if (fs.existsSync(this.sharedFile)) {
      const content = fs.readFileSync(this.sharedFile, 'utf8');
      // Extract keys from CONTAINER_REMOVAL_DEFAULT and similar constants
      const matches = content.match(/['"`]([a-zA-Z][a-zA-Z0-9_]*(?:15Minutes|2Minutes|5Minutes|Instant)?)['"`]/g);
      if (matches) {
        matches.forEach(match => {
          const key = match.slice(1, -1);
          if (key.startsWith('options') || key.startsWith('action') || key.startsWith('error')) {
            uiKeys.add(key);
          }
        });
      }
    }

    return uiKeys;
  }

  /**
   * Process directory recursively for localization keys
   */
  processDirectory(dir, uiKeys) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Skip old-backup directory
        if (item !== 'old-backup') {
          this.processDirectory(itemPath, uiKeys);
        }
      } else if (item.endsWith('.html') || item.endsWith('.ts')) {
        this.processFile(itemPath, uiKeys);
      }
    }
  }

  /**
   * Process individual file for localization keys
   */
  processFile(filePath, uiKeys) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract data-i18n keys
    const dataI18nMatches = content.match(/data-i18n(?:-title|-placeholder)?="([^"]+)"/g);
    if (dataI18nMatches) {
      dataI18nMatches.forEach(match => {
        const key = match.match(/"([^"]+)"/)[1];
        uiKeys.add(key);
      });
    }

    // Extract browser.i18n.getMessage keys
    const i18nMessageMatches = content.match(/browser\.i18n\.getMessage\(['"`]([^'"`]+)['"`]\)/g);
    if (i18nMessageMatches) {
      i18nMessageMatches.forEach(match => {
        const key = match.match(/['"`]([^'"`]+)['"`]/)[1];
        uiKeys.add(key);
      });
    }

    // Extract dynamic setAttribute keys
    const setAttributeMatches = content.match(/setAttribute\(['"`]data-i18n(?:-title|-placeholder)?['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g);
    if (setAttributeMatches) {
      setAttributeMatches.forEach(match => {
        const keyMatch = match.match(/,\s*['"`]([^'"`]+)['"`]/);
        if (keyMatch) {
          uiKeys.add(keyMatch[1]);
        }
      });
    }
  }

  /**
   * Validate key consistency between English and other locales
   */
  validateKeyConsistency(messages, uiKeys) {
    if (!messages.en) {
      this.errors.push('English locale (en) is missing');
      return;
    }

    const enKeys = new Set(Object.keys(messages.en));

    // Check for missing keys in UI
    const missingInUI = [...enKeys].filter(key => !uiKeys.has(key));
    if (missingInUI.length > 0) {
      this.warnings.push(`Keys in English but not used in UI: ${missingInUI.join(', ')}`);
    }

    // Check for missing keys in English
    const missingInEn = [...uiKeys].filter(key => !enKeys.has(key));
    if (missingInEn.length > 0) {
      this.errors.push(`Keys used in UI but missing in English: ${missingInEn.join(', ')}`);
    }
  }

  /**
   * Validate that all locales have the same keys as English
   */
  validateLocaleCompleteness(messages) {
    if (!messages.en) return;

    const enKeys = new Set(Object.keys(messages.en));

    for (const locale of this.supportedLocales) {
      if (locale === 'en' || !messages[locale]) continue;

      const localeKeys = new Set(Object.keys(messages[locale]));

      // Check for missing keys
      const missingKeys = [...enKeys].filter(key => !localeKeys.has(key));
      if (missingKeys.length > 0) {
        this.errors.push(`${locale}: Missing keys: ${missingKeys.join(', ')}`);
      }

      // Check for extra keys
      const extraKeys = [...localeKeys].filter(key => !enKeys.has(key));
      if (extraKeys.length > 0) {
        this.warnings.push(`${locale}: Extra keys (should be removed): ${extraKeys.join(', ')}`);
      }

      // Check for placeholder translations
      for (const key of enKeys) {
        if (messages[locale][key] && messages[locale][key].message) {
          const message = messages[locale][key].message;
          if (message.startsWith(`[${locale.toUpperCase()}]`)) {
            this.warnings.push(`${locale}: Placeholder translation for key '${key}': ${message}`);
          }
        }
      }
    }
  }

  /**
   * Validate key usage patterns
   */
  validateKeyUsage(messages, uiKeys) {
    // Check for keys with empty messages
    for (const locale of this.supportedLocales) {
      if (!messages[locale]) continue;

      for (const [key, data] of Object.entries(messages[locale])) {
        if (!data.message || data.message.trim() === '') {
          this.errors.push(`${locale}: Empty message for key '${key}'`);
        }
      }
    }
  }

  /**
   * Validate for hardcoded strings in UI files
   */
  validateHardcodedStrings() {
    this.scanForHardcodedStrings(this.uiDir);
  }

  /**
   * Scan directory for potential hardcoded strings
   */
  scanForHardcodedStrings(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (item !== 'old-backup' && item !== 'vendor') {
          this.scanForHardcodedStrings(itemPath);
        }
      } else if (item.endsWith('.ts')) {
        this.scanFileForHardcodedStrings(itemPath);
      }
    }
  }

  /**
   * Scan individual file for hardcoded strings
   */
  scanFileForHardcodedStrings(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Look for common hardcoded string patterns
    const patterns = [
      // showError/showSuccess with literal strings
      /(?:showError|showSuccess)\s*\(\s*['"`]([^'"`]{10,})['"`]\s*\)/g,
      // textContent assignments with literal strings
      /\.textContent\s*=\s*['"`]([^'"`]{5,})['"`]/g,
      // innerHTML with literal text (not HTML)
      /\.innerHTML\s*=\s*['"`]([A-Z][^'"`<>]{10,})['"`]/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1];
        // Skip if it looks like code, HTML, or is very short
        if (!text.includes('<') && !text.includes('(') && text.length > 5) {
          this.warnings.push(`${relativePath}: Potential hardcoded string: "${text}"`);
        }
      }
    }
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log('\n📊 Validation Results:');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All localization checks passed!');
      return;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n💡 Localization errors must be fixed before committing.');
      process.exit(1);
    } else {
      console.log('\n✅ No critical localization issues found.');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new LocalizationValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = LocalizationValidator;
