/**
 * PER Export Smoke Tests
 *
 * Verifies that Excel blob generates a valid ZIP (PK header).
 */

import { describe, it, expect } from 'vitest';
import { exportPerXlsx } from '../perXlsx';
import { calculatePER } from '../../../engine/per';
import { DEFAULT_COLORS } from '../../../settings/theme';

const THEME_COLORS = DEFAULT_COLORS;

describe('PER Excel Export', () => {
  it('generates a valid XLSX blob (PK header)', async () => {
    const result = calculatePER({
      versementAnnuel: 5000,
      dureeAnnees: 20,
      tmi: 30,
      rendementAnnuel: 3,
      fraisGestion: 0.8,
    });

    const blob = await exportPerXlsx(
      {
        versementAnnuel: 5000,
        dureeAnnees: 20,
        tmi: 30,
        rendementAnnuel: 3,
        fraisGestion: 0.8,
      },
      result.result,
      THEME_COLORS.c1,
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    // Verify PK zip header
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 2));
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
  });
});
