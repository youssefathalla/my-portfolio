import { beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { of } from 'rxjs';

// Setup MatIconRegistry testing mock
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: MatIconRegistry,
        useValue: {
          addSvgIcon: vi.fn(),
          getNamedSvgIcon: vi.fn().mockReturnValue(
            of(
              (() => {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 24 24');
                return svg;
              })(),
            ),
          ),
          addSvgIconSetInNamespace: vi.fn(),
          registerFontClassAlias: vi.fn(),
          classNameForFontAlias: vi.fn().mockReturnValue(''),
          getDefaultFontSetClass: vi.fn().mockReturnValue(['material-icons']),
        },
      },
    ],
  });
});

// Basic Polyfills for environments lacking browser APIs (like Node.js for SSR tests)

// Mock matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };

// Mock IntersectionObserver
globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ||
  class {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    takeRecords = vi.fn();
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
