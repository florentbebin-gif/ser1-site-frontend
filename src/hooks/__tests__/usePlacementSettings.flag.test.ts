import { describe, it, expect } from 'vitest';
import { resolvePlacementBaseContratFlag } from '../placementFeatureFlag';

describe('resolvePlacementBaseContratFlag (P1-06)', () => {
  it('env absent => ON (default)', () => {
    expect(resolvePlacementBaseContratFlag(undefined)).toBe(true);
    expect(resolvePlacementBaseContratFlag('')).toBe(true);
  });

  it('env "false" => OFF', () => {
    expect(resolvePlacementBaseContratFlag('false')).toBe(false);
    expect(resolvePlacementBaseContratFlag(' FALSE ')).toBe(false);
  });

  it('env "true" => ON', () => {
    expect(resolvePlacementBaseContratFlag('true')).toBe(true);
    expect(resolvePlacementBaseContratFlag(' TRUE ')).toBe(true);
  });

  it('is ON for any non-false value', () => {
    expect(resolvePlacementBaseContratFlag('1')).toBe(true);
    expect(resolvePlacementBaseContratFlag('on')).toBe(true);
  });
});
