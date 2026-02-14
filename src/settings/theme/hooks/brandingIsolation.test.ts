/* eslint-disable ser1-colors/no-hardcoded-colors -- Explicit hex fixtures are required here to prove A/B palette isolation deterministically. */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCabinetLogoFromCache,
  getCabinetThemeFromCache,
  saveCabinetLogoToCache,
  saveCabinetThemeToCache,
} from './useThemeCache';
import {
  getThemeSourceStorageKey,
  readThemeSourceFromStorage,
  writeThemeSourceToStorage,
} from '../themeSourceStorage';
import { resolvePptxColors } from '../../../pptx/theme/resolvePptxColors';

type StorageMap = Map<string, string>;

function createLocalStorageMock(store: StorageMap) {
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe('P0-03 branding isolation', () => {
  let store: StorageMap;

  beforeEach(() => {
    store = new Map();
    Object.defineProperty(globalThis, 'localStorage', {
      value: createLocalStorageMock(store),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: globalThis.localStorage },
      configurable: true,
      writable: true,
    });
  });

  it('isolates cabinet theme/logo cache entries by cabinetBrandingKey', () => {
    const colorsA = {
      c1: '#111111', c2: '#121212', c3: '#131313', c4: '#141414', c5: '#151515',
      c6: '#161616', c7: '#171717', c8: '#181818', c9: '#191919', c10: '#1A1A1A',
    };
    const colorsB = {
      c1: '#AA0000', c2: '#BB0000', c3: '#CC0000', c4: '#DD0000', c5: '#EE0000',
      c6: '#FF0000', c7: '#AA1111', c8: '#BB1111', c9: '#CC1111', c10: '#DD1111',
    };

    saveCabinetThemeToCache(colorsA, 'cabinet:A');
    saveCabinetThemeToCache(colorsB, 'cabinet:B');
    saveCabinetLogoToCache('data:image/png;base64,AAA', 'cabinet:A');
    saveCabinetLogoToCache('data:image/png;base64,BBB', 'cabinet:B');

    expect(getCabinetThemeFromCache('cabinet:A')).toEqual(colorsA);
    expect(getCabinetThemeFromCache('cabinet:B')).toEqual(colorsB);
    expect(getCabinetLogoFromCache('cabinet:A')).toBe('data:image/png;base64,AAA');
    expect(getCabinetLogoFromCache('cabinet:B')).toBe('data:image/png;base64,BBB');
  });

  it('isolates themeSource storage by cabinet key and keeps A/B independent', () => {
    writeThemeSourceToStorage('cabinet:A', 'custom');
    writeThemeSourceToStorage('cabinet:B', 'cabinet');

    expect(readThemeSourceFromStorage('cabinet:A')).toBe('custom');
    expect(readThemeSourceFromStorage('cabinet:B')).toBe('cabinet');
    expect(getThemeSourceStorageKey('cabinet:A')).not.toBe(getThemeSourceStorageKey('cabinet:B'));
  });

  it('resolves different PPTX colors for cabinet A and B without cache reuse', () => {
    const webColors = {
      c1: '#010101', c2: '#020202', c3: '#030303', c4: '#040404', c5: '#050505',
      c6: '#060606', c7: '#070707', c8: '#080808', c9: '#090909', c10: '#101010',
    };
    const cabinetA = {
      c1: '#A10000', c2: '#A20000', c3: '#A30000', c4: '#A40000', c5: '#A50000',
      c6: '#A60000', c7: '#A70000', c8: '#A80000', c9: '#A90000', c10: '#AA0000',
    };
    const cabinetB = {
      c1: '#00B100', c2: '#00B200', c3: '#00B300', c4: '#00B400', c5: '#00B500',
      c6: '#00B600', c7: '#00B700', c8: '#00B800', c9: '#00B900', c10: '#00BA00',
    };

    const pptxA = resolvePptxColors(webColors, 'all', cabinetA, null);
    const pptxB = resolvePptxColors(webColors, 'all', cabinetB, null);

    expect(pptxA).toEqual(cabinetA);
    expect(pptxB).toEqual(cabinetB);
    expect(pptxA).not.toEqual(pptxB);
  });
});
