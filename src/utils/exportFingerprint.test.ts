import { describe, expect, it } from 'vitest';
import {
  fingerprintPptxExport,
  fingerprintXlsxExport,
  hashStringForFingerprint,
  normalizeFilenameForFingerprint,
} from './exportFingerprint';

describe('exportFingerprint', () => {
  it('returns same fingerprint for same PPTX manifest', () => {
    const manifest = {
      filename: normalizeFilenameForFingerprint('simulation-ir-2026-02-14.pptx'),
      slidesCount: 4,
      slideTypes: ['cover', 'chapter', 'content', 'end'],
      palette: { c1: '112233', c2: '445566' },
      logoHash: hashStringForFingerprint('https://cdn.ser1.test/logo.png'),
    };

    const first = fingerprintPptxExport(manifest);
    const second = fingerprintPptxExport({ ...manifest });

    expect(first).toBe(second);
  });

  it('changes fingerprint when a key PPTX field changes', () => {
    const base = {
      filename: 'simulation-credit-<date>.pptx',
      slidesCount: 5,
      slideTypes: ['cover', 'chapter', 'content', 'content', 'end'],
      palette: { c1: 'AA0000', c2: '00AA00' },
      logoHash: hashStringForFingerprint('data:image/png;base64,AAAA'),
    };

    const a = fingerprintPptxExport(base);
    const b = fingerprintPptxExport({ ...base, slidesCount: 6 });

    expect(a).not.toBe(b);
  });

  it('returns same fingerprint for same XLSX structural manifest', () => {
    const manifest = {
      kind: 'xlsx-ooxml',
      sheetCount: 2,
      sheets: [
        {
          name: 'Paramètres',
          rowCount: 12,
          colCount: 2,
          keyCells: [
            { ref: '1:1', value: 'Champ', style: 'sHeader' },
            { ref: '1:2', value: 'Valeur', style: 'sHeader' },
          ],
        },
        {
          name: 'Synthèse',
          rowCount: 8,
          colCount: 3,
          keyCells: [{ ref: '8:2', value: 120000, style: 'sMoney' }],
        },
      ],
      headerFill: '112233',
      sectionFill: 'CCDDEE',
    };

    const first = fingerprintXlsxExport(manifest);
    const second = fingerprintXlsxExport(JSON.parse(JSON.stringify(manifest)));

    expect(first).toBe(second);
  });

  it('changes fingerprint when a key XLSX field changes', () => {
    const base = {
      kind: 'xlsx-ooxml',
      sheetCount: 1,
      sheets: [{ name: 'Résultats', rowCount: 20, colCount: 4, keyCells: [] }],
      headerFill: '334455',
      sectionFill: 'AABBCC',
    };

    const a = fingerprintXlsxExport(base);
    const b = fingerprintXlsxExport({ ...base, headerFill: '334456' });

    expect(a).not.toBe(b);
  });
});
