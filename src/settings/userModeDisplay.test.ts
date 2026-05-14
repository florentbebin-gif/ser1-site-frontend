import { describe, expect, it } from 'vitest';
import {
  resolveEffectiveUserMode,
  shouldDisplayForDetailLevel,
} from './userModeDisplay';

describe('userModeDisplay', () => {
  it('priorise un override local sans modifier le mode global', () => {
    expect(resolveEffectiveUserMode('simplifie', 'expert')).toBe('expert');
    expect(resolveEffectiveUserMode('expert', 'simplifie')).toBe('simplifie');
  });

  it('retombe sur le mode global sans override local', () => {
    expect(resolveEffectiveUserMode('simplifie', null)).toBe('simplifie');
    expect(resolveEffectiveUserMode('expert', undefined)).toBe('expert');
  });

  it('résout les niveaux de détail attendus', () => {
    expect(shouldDisplayForDetailLevel('always', 'simplifie')).toBe(true);
    expect(shouldDisplayForDetailLevel('always', 'expert')).toBe(true);
    expect(shouldDisplayForDetailLevel('simple', 'simplifie')).toBe(true);
    expect(shouldDisplayForDetailLevel('simple', 'expert')).toBe(false);
    expect(shouldDisplayForDetailLevel('expert', 'expert')).toBe(true);
    expect(shouldDisplayForDetailLevel('expert', 'simplifie')).toBe(false);
  });
});
