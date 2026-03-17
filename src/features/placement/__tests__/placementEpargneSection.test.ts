import { describe, expect, it } from 'vitest';
import { formatVersementConfigSummary } from '../components/PlacementEpargneSection';

describe('formatVersementConfigSummary', () => {
  const formatter = (value: number) => `${value}EUR`;

  it('omits the annual suffix when no annual contribution is configured', () => {
    expect(formatVersementConfigSummary(10000, 0, formatter)).toBe('10000EUR');
  });

  it('keeps the annual summary when annual contributions are configured', () => {
    expect(formatVersementConfigSummary(10000, 1200, formatter)).toBe('10000EUR + 1200EUR/an');
  });
});
