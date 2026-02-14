import { describe, it, expect } from 'vitest';
import { resolvePlacementBaseContratFlag } from '../placementFeatureFlag';

describe('resolvePlacementBaseContratFlag (P1-06)', () => {
  it('defaults to ON when env var is undefined', () => {
    expect(resolvePlacementBaseContratFlag(undefined)).toBe(true);
  });

  it('defaults to ON when env var is empty', () => {
    expect(resolvePlacementBaseContratFlag('')).toBe(true);
  });

  it('is OFF only when explicitly set to false', () => {
    expect(resolvePlacementBaseContratFlag('false')).toBe(false);
    expect(resolvePlacementBaseContratFlag(' FALSE ')).toBe(false);
  });

  it('is ON for true and any non-false value', () => {
    expect(resolvePlacementBaseContratFlag('true')).toBe(true);
    expect(resolvePlacementBaseContratFlag('1')).toBe(true);
    expect(resolvePlacementBaseContratFlag('on')).toBe(true);
  });
});
