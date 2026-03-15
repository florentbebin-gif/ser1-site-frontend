/**
 * Placement Excel Export Smoke Tests
 *
 * Verifies that the XLSX blob generates a valid ZIP (PK header).
 */

import { describe, it, expect } from 'vitest';
import { buildPlacementXlsxBlob } from '../export/placementExcelExport';
import { DEFAULT_STATE } from '../utils/normalizers';
import { DEFAULT_COLORS } from '../../../settings/theme';
import type { CompareResult } from '../../../engine/placement/types';

const THEME = DEFAULT_COLORS;

// Minimal CompareResult for smoke testing (fields not used by the builder default to 0)
const minimalResults = {
  produit1: {
    envelope: 'AV',
    epargne: {
      rows: [{ capitalDebut: 10000, capitalFin: 10500 }],
      capitalFin: 10500,
    },
    liquidation: {
      rows: [{ age: 65, capitalDebut: 10500, capitalFin: 10000 }],
      totalRetraits: 10000,
      totalFiscalite: 500,
    },
    transmission: {
      capitalTransmis: 10000,
      abattement: 0,
      assiette: 10000,
      psDeces: null,
      taxeForfaitaire: 0,
      taxeDmtg: 0,
      taxe: 0,
      capitalTransmisNet: 10000,
    },
  },
  produit2: {
    envelope: 'PER',
    epargne: {
      rows: [{ capitalDebut: 5000, capitalFin: 5200 }],
      capitalFin: 5200,
    },
    liquidation: {
      rows: [{ age: 65, capitalDebut: 5200, capitalFin: 4900 }],
      totalRetraits: 4900,
      totalFiscalite: 300,
    },
    transmission: {
      capitalTransmis: 4900,
      abattement: 0,
      assiette: 4900,
      psDeces: null,
      taxeForfaitaire: 0,
      taxeDmtg: 0,
      taxe: 0,
      capitalTransmisNet: 4900,
    },
  },
} as unknown as CompareResult;

describe('Placement Excel Export', () => {
  it('generates a valid XLSX blob (PK header)', async () => {
    const blob = await buildPlacementXlsxBlob(
      DEFAULT_STATE,
      minimalResults,
      THEME.c1,
      THEME.c7,
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
