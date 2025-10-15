import { psl } from './lib';
import { TemporaryContainers } from './tmp';
import { Debug } from '~/types';

export class Utils {
  private debug: Debug;

  constructor(background: TemporaryContainers) {
    this.debug = background.debug;
  }

  sameDomain(origin: string, target: string): boolean {
    // Helper function to extract hostname and port from a string
    const extractHostnameAndPort = (input: string): { hostname: string; port: string | null } => {
      try {
        // If it looks like a URL, use the URL constructor
        if (input.includes('://')) {
          const url = new URL(input);
          return { hostname: url.hostname, port: url.port || null };
        }
        // Otherwise, manually split on colon to extract port
        const colonIndex = input.lastIndexOf(':');
        if (colonIndex > 0 && /^\d+$/.test(input.slice(colonIndex + 1))) {
          return {
            hostname: input.slice(0, colonIndex),
            port: input.slice(colonIndex + 1),
          };
        }
        return { hostname: input, port: null };
      } catch {
        // If URL parsing fails, try manual parsing
        const colonIndex = input.lastIndexOf(':');
        if (colonIndex > 0 && /^\d+$/.test(input.slice(colonIndex + 1))) {
          return {
            hostname: input.slice(0, colonIndex),
            port: input.slice(colonIndex + 1),
          };
        }
        return { hostname: input, port: null };
      }
    };

    const originInfo = extractHostnameAndPort(origin);
    const targetInfo = extractHostnameAndPort(target);

    // Different ports mean different services, so they're different "domains" for our purposes
    if (originInfo.port !== targetInfo.port) {
      return false;
    }

    const parsedOrigin = psl.parse(originInfo.hostname);
    const parsedTarget = psl.parse(targetInfo.hostname);

    // Type guard to check if we have a valid ParsedDomain (no error)
    const isValidParsedDomain = (parsed: any): parsed is { domain: string | null; input: string; error?: undefined } => {
      return parsed && typeof parsed === 'object' && 'domain' in parsed && 'input' in parsed && !parsed.error;
    };

    if (!isValidParsedDomain(parsedOrigin) || !isValidParsedDomain(parsedTarget)) {
      return false;
    }

    // If both domains are valid PSL domains, compare them
    if (parsedOrigin.domain && parsedTarget.domain) {
      return parsedOrigin.domain === parsedTarget.domain;
    }

    // Handle special cases where PSL returns null domains:
    // - localhost
    // - IP addresses
    // - Other non-PSL domains
    if (!parsedOrigin.domain && !parsedTarget.domain) {
      // Both have null domains, compare the hostname directly
      // This handles localhost, IP addresses, and other special cases
      return originInfo.hostname === targetInfo.hostname;
    }

    // One has a domain, the other doesn't - they're different domains
    return false;
  }

  matchDomainPattern(url: string, domainPattern: string): boolean {
    if (domainPattern.startsWith('/')) {
      const regexp = domainPattern.match(/^\s*\/(.*)\/([gimsuy]+)?\s*$/);
      if (!regexp) {
        return false;
      }
      try {
        return new RegExp(regexp[1], regexp[2]).test(url);
      } catch (_error) {
        return false;
      }
    } else {
      const parsedUrl = url.startsWith('about:') || url.startsWith('moz-extension:') ? url : new URL(url).hostname;
      return parsedUrl === domainPattern || this.globToRegexp(domainPattern).test(parsedUrl);
    }
  }

  addMissingKeys({ defaults, source }: { defaults: any; source: any }): boolean {
    let addedMissing = false;
    const addKeys = (defaultsNode: any, sourceNode: any): void => {
      Object.keys(defaultsNode).map(key => {
        if (sourceNode[key] === undefined) {
          this.debug('[addMissingKeys] key not found, setting default', key, defaultsNode[key]);
          sourceNode[key] = defaultsNode[key];
          addedMissing = true;
        } else if (Array.isArray(sourceNode[key])) {
          return;
        } else if (typeof sourceNode[key] === 'object') {
          addKeys(defaultsNode[key], sourceNode[key]);
        }
      });
    };
    addKeys(defaults, source);

    return addedMissing;
  }

  clone(input: any): any {
    return JSON.parse(JSON.stringify(input));
  }

  globToRegexp(glob: string): RegExp {
    // --------------------------------------------------------------------------------
    // modified and simplified version of https://github.com/fitzgen/glob-to-regexp
    // version 0.4.0

    // Copyright (c) 2013, Nick Fitzgerald
    //
    // All rights reserved.
    //
    // Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    //
    //     Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    //
    //     Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    //
    // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    if (typeof glob !== 'string') {
      throw new TypeError('Expected a string');
    }

    const str = String(glob);

    // The regexp we are building, as a string.
    let reStr = '';

    // RegExp flags (eg "i" ) to pass in to RegExp constructor.
    const flags = 'i';

    let c;
    for (let i = 0, len = str.length; i < len; i++) {
      c = str[i];

      switch (c) {
        case '/':
        case '$':
        case '^':
        case '+':
        case '.':
        case '(':
        case ')':
        case '=':
        case '!':
        case '|':
        case ',':
          reStr += '\\' + c;
          break;

        case '*':
          reStr += '.*';
          break;

        default:
          reStr += c;
      }
    }

    return new RegExp('^' + reStr + '$', flags);
  }

  versionCompare(a: string, b: string): 1 | 0 | -1 {
    // https://github.com/substack/semver-compare
    // https://github.com/substack/semver-compare/pull/4

    // This software is released under the MIT license:
    //
    // Permission is hereby granted, free of charge, to any person obtaining a copy of
    // this software and associated documentation files (the "Software"), to deal in
    // the Software without restriction, including without limitation the rights to
    // use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    // the Software, and to permit persons to whom the Software is furnished to do so,
    // subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    // FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    // COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    // IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    // CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    const pa = a.split('.');
    const pb = b.split('.');
    for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
      const na = Number(pa[i]);
      const nb = Number(pb[i]);
      if (na > nb) {
        return 1;
      }
      if (nb > na) {
        return -1;
      }
      if (!isNaN(na) && isNaN(nb)) {
        return 1;
      }
      if (isNaN(na) && !isNaN(nb)) {
        return -1;
      }
    }
    return 0;
  }

  /**
   * Deep merge two objects, with the source object values taking precedence
   * @param target The target object
   * @param source The source object
   * @returns The merged object
   */
  deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') {
      return target;
    }

    const result = this.clone(target);

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          // Override with source value (including arrays and primitives)
          result[key] = source[key];
        }
      }
    }

    return result;
  }
}
