import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onResetEvent, triggerPageReset } from './reset';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

function restoreGlobalProperty(key: 'window' | 'sessionStorage', descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) {
    Object.defineProperty(globalThis, key, descriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, key);
}

describe('reset', () => {
  let removedKeys: string[];

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

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: eventTarget,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: storage,
    });
  });

  afterEach(() => {
    restoreGlobalProperty('window', originalWindow);
    restoreGlobalProperty('sessionStorage', originalSessionStorage);
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
});
