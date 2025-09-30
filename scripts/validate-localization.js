#!/usr/bin/env node
/* eslint-env node */
/* global require, module, __dirname */
// (Keep console output: this is a CLI utility)

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
    this.summary = [];
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
      this.validateKeyUsage(messages);
      this.validateHardcodedStrings();
      this.validateMissingLocalization();

      // Build summary (placed after validations so it reflects any changes/errors discovered)
      this.buildSummary(messages, uiKeys);

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
    const uiKeys = new Map(); // Change to Map to track file locations

    // Process UI directory
    this.processDirectory(this.uiDir, uiKeys);

    // Process manifest.json for __MSG_keyName__ references
    this.processManifest(uiKeys);

    // Process shared.ts for constants
    if (fs.existsSync(this.sharedFile)) {
      const content = fs.readFileSync(this.sharedFile, 'utf8');
      const relativePath = path.relative(process.cwd(), this.sharedFile);
      const lines = content.split('\n');

      // Extract keys from CONTAINER_REMOVAL_DEFAULT and similar constants
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        const location = `${relativePath}:${lineNum}`;

        const matches = line.matchAll(/['"`]([a-zA-Z][a-zA-Z0-9_]*(?:15Minutes|2Minutes|5Minutes|Instant)?)['"`]/g);
        for (const match of matches) {
          const key = match[1];
          if (key.startsWith('options') || key.startsWith('action') || key.startsWith('error')) {
            uiKeys.set(key, location);
          }
        }
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
        if (item !== 'vendor') {
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
    const relativePath = path.relative(process.cwd(), filePath);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const location = `${relativePath}:${lineNum}`;

      // Extract data-i18n keys
      const dataI18nMatches = line.matchAll(/data-i18n(?:-title|-placeholder)?="([^"]+)"/g);
      for (const match of dataI18nMatches) {
        const key = match[1];
        uiKeys.set(key, location);
      }

      // Extract browser.i18n.getMessage keys (with or without parameters)
      const i18nMessageMatches = line.matchAll(/browser\.i18n\.getMessage\(['"`]([^'"`]+)['"`][^)]*\)/g);
      for (const match of i18nMessageMatches) {
        const key = match[1];
        uiKeys.set(key, location);
      }

      // Extract dynamic setAttribute keys
      const setAttributeMatches = line.matchAll(/setAttribute\(['"`]data-i18n(?:-title|-placeholder)?['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g);
      for (const match of setAttributeMatches) {
        const keyMatch = match[0].match(/,\s*['"`]([^'"`]+)['"`]/);
        if (keyMatch) {
          const key = keyMatch[1];
          uiKeys.set(key, location);
        }
      }
    }
  }

  /**
   * Process manifest.json for __MSG_keyName__ references
   */
  processManifest(uiKeys) {
    const manifestPath = path.join(__dirname, '..', 'src', 'manifest.json');
    if (!fs.existsSync(manifestPath)) return;

    const content = fs.readFileSync(manifestPath, 'utf8');
    const relativePath = path.relative(process.cwd(), manifestPath);

    try {
      // Find all __MSG_keyName__ patterns in the manifest
      const msgMatches = content.matchAll(/__MSG_([a-zA-Z][a-zA-Z0-9_]*)__/g);
      for (const match of msgMatches) {
        const key = match[1];
        const location = `${relativePath}`;
        uiKeys.set(key, location);
      }
    } catch (error) {
      this.warnings.push(`Failed to parse manifest.json: ${error.message}`);
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
    const missingInEn = [...uiKeys.keys()].filter(key => !enKeys.has(key));
    if (missingInEn.length > 0) {
      // Report with file locations
      const missingKeysWithFiles = missingInEn.map(key => {
        const filePath = uiKeys.get(key);
        return `${filePath}: ${key}`;
      });
      this.errors.push(`Keys used in UI but missing in English:`);
      missingKeysWithFiles.forEach(keyWithFile => {
        this.errors.push(`  • ${keyWithFile}`);
      });
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
  validateKeyUsage(messages) {
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
        if (item !== 'vendor') {
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
    const lines = content.split('\n');

    // Look for common hardcoded string patterns
    const patterns = [
      // showError/showSuccess with literal strings
      /(?:showError|showSuccess)\s*\(\s*['"`]([^'"`]{10,})['"`]\s*\)/g,
      // textContent assignments with literal strings
      /\.textContent\s*=\s*['"`]([^'"`]{5,})['"`]/g,
      // innerHTML with literal text (not HTML)
      /\.innerHTML\s*=\s*['"`]([A-Z][^'"`<>]{10,})['"`]/g,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const pattern of patterns) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const text = match[1];
          // Skip if it looks like code, HTML, or is very short
          if (!text.includes('<') && !text.includes('(') && text.length > 5) {
            this.warnings.push(`${relativePath}:${lineNum}: Potential hardcoded string: "${text}"`);
          }
        }
      }
    }
  }

  /**
   * Validate that all user-facing text has localization attributes
   */
  validateMissingLocalization() {
    console.log('🔍 Scanning for missing localization attributes...');
    this.scanDirectoryForMissingLocalization(this.uiDir);
  }

  /**
   * Build a human-readable summary of localization coverage
   */
  buildSummary(messages, uiKeys) {
    try {
      const enMessages = messages.en || {};
      const enKeys = new Set(Object.keys(enMessages));
      const usedKeys = new Set([...uiKeys.keys()]);

      const unusedEnglishKeys = [...enKeys].filter(k => !usedKeys.has(k));
      const usedButMissingInEnglish = [...usedKeys].filter(k => !enKeys.has(k));

      this.summary.push('Localization Summary:');
      this.summary.push(`  UI keys used: ${usedKeys.size}`);
      this.summary.push(`  English keys: ${enKeys.size}`);
      if (unusedEnglishKeys.length) {
        this.summary.push(`    Unused English keys: ${unusedEnglishKeys.length}`);
      } else {
        this.summary.push('    Unused English keys: 0');
      }
      if (usedButMissingInEnglish.length) {
        this.summary.push(`    Keys used but missing in English: ${usedButMissingInEnglish.length}`);
      } else {
        this.summary.push('    Keys used but missing in English: 0');
      }

      // Per-locale stats relative to English
      this.summary.push('  Per-locale key counts:');
      for (const locale of this.supportedLocales) {
        const localeMessages = messages[locale] || {};
        const localeKeyCount = Object.keys(localeMessages).length;
        if (locale === 'en') {
          this.summary.push(`    en: ${localeKeyCount} (reference)`);
          continue;
        }
        const localeKeys = new Set(Object.keys(localeMessages));
        const missing = [...enKeys].filter(k => !localeKeys.has(k));
        const extra = [...localeKeys].filter(k => !enKeys.has(k));
        let line = `    ${locale}: ${localeKeyCount}`;
        const annotations = [];
        if (missing.length) annotations.push(`missing ${missing.length}`);
        if (extra.length) annotations.push(`extra ${extra.length}`);
        if (annotations.length) line += ` (${annotations.join(', ')})`;
        this.summary.push(line);
      }

      // Provide a refined coverage overview
      // Intersection of used keys that actually exist in English
      const validUsedCount = [...usedKeys].filter(k => enKeys.has(k)).length;
      const englishCoveragePercent = enKeys.size ? ((validUsedCount / enKeys.size) * 100).toFixed(1) : '0.0';
      const uiValidityPercent = usedKeys.size ? ((validUsedCount / usedKeys.size) * 100).toFixed(1) : '0.0';

      this.summary.push('  Coverage:');
      this.summary.push(`    English localization coverage: ${validUsedCount}/${enKeys.size} (${englishCoveragePercent}%)`);
      this.summary.push(`    UI codebase coverage (english): ${validUsedCount}/${usedKeys.size} (${uiValidityPercent}%)`);
    } catch (e) {
      this.summary.push(`  (Failed to build summary: ${e.message})`);
    }
  }

  /**
   * Scan directory for missing localization
   */
  scanDirectoryForMissingLocalization(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (item !== 'vendor') {
          this.scanDirectoryForMissingLocalization(itemPath);
        }
      } else if (item.endsWith('.html')) {
        this.scanHTMLForMissingLocalization(itemPath);
      } else if (item.endsWith('.ts')) {
        this.scanTypeScriptForMissingLocalization(itemPath);
      }
    }
  }

  /**
   * Scan HTML file for text content without localization attributes
   */
  scanHTMLForMissingLocalization(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Split content into lines for better error reporting
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Find HTML elements with text content - improved regex to handle more cases
      const elementMatches = line.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>([^<]+)<\/\1>/g);

      for (const match of elementMatches) {
        const [fullMatch, _tagName, textContent] = match;
        const trimmedText = textContent.trim();

        // Skip if:
        // - Text is too short (< 2 chars)
        // - Text is all whitespace, numbers, or symbols
        // - Text looks like a variable placeholder (contains {, $, etc.)
        // - Element already has data-i18n attribute (check more thoroughly)
        if (trimmedText.length < 2 || /^[\s\d\-_.,!?:;()[\]{}$%#@]+$/.test(trimmedText) || /[{$]/.test(trimmedText)) {
          continue;
        }

        // More thorough check for data-i18n attributes
        const hasDataI18n =
          fullMatch.includes('data-i18n="') ||
          fullMatch.includes("data-i18n='") ||
          fullMatch.includes('data-i18n-') ||
          // Handle case where there's a space before the closing >
          /data-i18n\s*=/.test(fullMatch);

        if (hasDataI18n) {
          continue;
        }

        // Check if text contains actual words (letters)
        if (/[a-zA-Z]{2,}/.test(trimmedText)) {
          // Special cases to skip
          const skipPatterns = [
            /^(ok|yes|no|on|off)$/i,
            /^[a-f0-9]{6,}$/i, // hex colors
            /^\d+(\.\d+)?(px|em|rem|%)?$/i, // CSS values
            /^#[a-zA-Z0-9_-]+$/i, // IDs
          ];

          const shouldSkip = skipPatterns.some(pattern => pattern.test(trimmedText));
          if (!shouldSkip) {
            this.errors.push(`${relativePath}:${lineNum}: Text content needs localization: "${trimmedText}"`);
          }
        }
      }

      // Check for input placeholders without data-i18n-placeholder
      const inputMatches = line.matchAll(/<input[^>]*placeholder\s*=\s*["']([^"']+)["'][^>]*>/g);
      for (const match of inputMatches) {
        const [fullMatch, placeholder] = match;
        if (placeholder.length > 1 && /[a-zA-Z]/.test(placeholder) && !fullMatch.includes('data-i18n-placeholder')) {
          this.errors.push(`${relativePath}:${lineNum}: Input placeholder needs localization: "${placeholder}"`);
        }
      }

      // Check for title attributes without data-i18n-title
      const titleMatches = line.matchAll(/<[^>]*title\s*=\s*["']([^"']+)["'][^>]*>/g);
      for (const match of titleMatches) {
        const [fullMatch, titleText] = match;
        if (titleText.length > 2 && /[a-zA-Z]{2,}/.test(titleText) && !fullMatch.includes('data-i18n-title')) {
          this.errors.push(`${relativePath}:${lineNum}: Title attribute needs localization: "${titleText}"`);
        }
      }
    }
  }

  /**
   * Scan TypeScript file for dynamic text assignment without localization
   */
  scanTypeScriptForMissingLocalization(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Split content into lines for better error reporting
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check for HTML content within template literals (common in TypeScript UI files)
      const htmlElementMatches = line.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>([^<]+)<\/\1>/g);

      for (const match of htmlElementMatches) {
        const [fullMatch, _tagName, textContent] = match;
        const trimmedText = textContent.trim();

        // Skip if text is too short or doesn't contain meaningful content
        if (trimmedText.length < 2 || /^[\s\d\-_.,!?:;()[\]{}$%#@]+$/.test(trimmedText) || /[{$]/.test(trimmedText)) {
          continue;
        }

        // Check for data-i18n attributes
        const hasDataI18n =
          fullMatch.includes('data-i18n="') ||
          fullMatch.includes("data-i18n='") ||
          fullMatch.includes('data-i18n-') ||
          /data-i18n\s*=/.test(fullMatch);

        if (hasDataI18n) {
          continue;
        }

        // Check if text contains actual words (letters)
        if (/[a-zA-Z]{2,}/.test(trimmedText)) {
          // Special cases to skip
          const skipPatterns = [
            /^(ok|yes|no|on|off)$/i,
            /^[a-f0-9]{6,}$/i, // hex colors
            /^\d+(\.\d+)?(px|em|rem|%)?$/i, // CSS values
            /^#[a-zA-Z0-9_-]+$/i, // IDs
          ];

          const shouldSkip = skipPatterns.some(pattern => pattern.test(trimmedText));
          if (!shouldSkip) {
            this.errors.push(`${relativePath}:${lineNum}: HTML text content in template literal needs localization: "${trimmedText}"`);
          }
        }
      }

      // Check for text assignments that should use i18n
      const patterns = [
        // textContent = "text"
        { pattern: /\.textContent\s*=\s*["']([^"']{3,})["']/, property: 'textContent' },
        // innerHTML = "text" (not HTML)
        { pattern: /\.innerHTML\s*=\s*["']([^"'<>]{5,})["']/, property: 'innerHTML' },
        // placeholder = "text"
        { pattern: /\.placeholder\s*=\s*["']([^"']{3,})["']/, property: 'placeholder' },
        // title = "text"
        { pattern: /\.title\s*=\s*["']([^"']{3,})["']/, property: 'title' },
        // setAttribute('placeholder', 'text')
        { pattern: /setAttribute\s*\(\s*["'](?:placeholder|title)["']\s*,\s*["']([^"']{3,})["']\s*\)/, property: 'setAttribute' },
      ];

      for (const { pattern, property } of patterns) {
        const match = line.match(pattern);
        if (match) {
          const text = match[1];

          // Skip if text looks like a variable, URL, or code
          const skipPatterns = [
            /^[a-z][a-zA-Z0-9_]*$/, // variable names
            /https?:\/\//, // URLs
            /[{}$]/, // template literals or variables
            /^\d+$/, // pure numbers
            /^[^a-zA-Z]*$/, // no letters
          ];

          const shouldSkip = skipPatterns.some(pattern => pattern.test(text));
          if (!shouldSkip && /[a-zA-Z]{2,}/.test(text)) {
            // Check if the line already uses browser.i18n.getMessage OR if there's a corresponding data-i18n-* setAttribute nearby
            const hasI18nMessage = line.includes('browser.i18n.getMessage');

            // Look for data-i18n-* setAttribute in the same function/block (next few lines)
            let hasDataI18nAttribute = false;
            if (property === 'title') {
              // For title assignments, check if there's a data-i18n-title setAttribute within a few lines
              for (let j = i; j < Math.min(i + 3, lines.length); j++) {
                if (lines[j].includes('setAttribute') && lines[j].includes('data-i18n-title')) {
                  hasDataI18nAttribute = true;
                  break;
                }
              }
            }

            if (!hasI18nMessage && !hasDataI18nAttribute) {
              this.errors.push(`${relativePath}:${lineNum}: ${property} assignment should use browser.i18n.getMessage: "${text}"`);
            }
          }
        }
      }
    }
  }

  /**
   * Report validation results
   */
  reportResults() {
    //console.log('\n📊 Validation Results:');

    if (this.summary.length) {
      console.log('\nℹ️  ' + this.summary.shift());
      this.summary.forEach(line => console.log(line));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All localization checks passed!');
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
