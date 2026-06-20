import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onResetEvent, triggerPageReset } from './reset';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

function restoreGlobalProperty(
  key: 'window' | 'sessionStorage' | 'localStorage',
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, key, descriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, key);
}

describe('reset', () => {
  let removedKeys: string[];
  let removedLocalKeys: string[];

  beforeEach(() => {
    const eventTarget = new EventTarget();
    removedKeys = [];
    const storage: Storage = {
      get length() {
        return 0;
      },
      clear: () => undefined,
      getItem: () => null,
      key: () => null,
      removeItem: (key: string) => {
        removedKeys.push(key);
      },
      setItem: () => undefined,
    };
    const localStorage: Storage = {
      get length() {
        return 0;
      },
      clear: () => undefined,
      getItem: () => null,
      key: () => null,
      removeItem: (key: string) => {
        removedLocalKeys.push(key);
      },
      setItem: () => undefined,
    };

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: eventTarget,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: storage,
    });
    removedLocalKeys = [];
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorage,
    });
  });

  afterEach(() => {
    restoreGlobalProperty('window', originalWindow);
    restoreGlobalProperty('sessionStorage', originalSessionStorage);
    restoreGlobalProperty('localStorage', originalLocalStorage);
  });

  it('déclenche un reset ciblé depuis la topbar', () => {
    const handler = vi.fn();
    const off = onResetEvent(handler);

    triggerPageReset('per-potentiel');

    expect(removedKeys).toContain('ser1:sim:per-potentiel');
    expect(handler).toHaveBeenCalledWith({ simId: 'per-potentiel' });

    off();
    triggerPageReset('per-potentiel');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('purge l’historique local snapshot au reset global audit', () => {
    triggerPageReset('audit');

    expect(removedLocalKeys).toContain('ser1:snapshot:saveHistory');
  });
});
