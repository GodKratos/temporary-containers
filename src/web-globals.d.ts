// Web API globals for WebExtension environment
declare global {
  // Browser APIs
  const URL: {
    new (url: string, base?: string): URL;
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
  };

  // Timing functions
  const setTimeout: (callback: () => void, ms?: number) => number;
  const clearTimeout: (id: number) => void;
  const setInterval: (callback: () => void, ms?: number) => number;
  const clearInterval: (id: number) => void;

  // DOM API
  const confirm: (message?: string) => boolean;

  // Modern Web APIs
  const AbortController: {
    new (): AbortController;
  };

  const Blob: {
    new (blobParts?: any[], options?: any): Blob;
  };
}

export {};
