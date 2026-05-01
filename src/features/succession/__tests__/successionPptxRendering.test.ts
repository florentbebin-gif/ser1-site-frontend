import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { describe, expect, it } from 'vitest';
import { buildSuccessionFamilyContext } from '@/pptx/slides/buildSuccessionFamilyContext';
import { defineSlideMasters } from '@/pptx/template/loadBaseTemplate';
import { getPptxThemeFromUiSettings } from '@/pptx/theme/getPptxThemeFromUiSettings';
import type { ExportContext, SuccessionFamilyContextSlideSpec } from '@/pptx/theme/types';
import { DEFAULT_COLORS } from '@/settings/theme';

const theme = getPptxThemeFromUiSettings(DEFAULT_COLORS);

function buildContext(): ExportContext {
  return {
    theme,
    locale: 'fr-FR',
    generatedAt: new Date('2026-01-01T00:00:00.000Z'),
    footerDisclaimer: '',
    showSlideNumbers: true,
  };
}

describe('Succession PPTX rendering', () => {
  it('rend les traits de filiation sans dimensions OpenXML négatives', async () => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    defineSlideMasters(pptx, theme);

    const spec: SuccessionFamilyContextSlideSpec = {
      type: 'succession-family-context',
      title: 'Contexte familial et dispositions',
      subtitle: 'Situation civile, régime matrimonial et filiation',
      situationLabel: 'Marié(e)',
      regimeLabel: 'Séparation de biens',
      dispositions: ['Donation entre époux : Totalité en usufruit'],
      filiation: {
        nodes: [
          { id: 'epoux1', label: 'Époux 1', x: 190, y: 20, kind: 'epoux' },
          { id: 'enfant-1', label: 'E1', x: 60, y: 100, kind: 'enfant_autre' },
        ],
        edges: [
          { x1: 230, y1: 44, x2: 100, y2: 100 },
        ],
        groups: [],
        svgWidth: 320,
        svgHeight: 160,
      },
    };

    buildSuccessionFamilyContext(pptx, spec, buildContext(), 3);

    const blob = await pptx.write({ outputType: 'blob' }) as Blob;
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const slideXml = await zip.file('ppt/slides/slide1.xml')?.async('string');

    expect(slideXml).toBeDefined();
    expect(slideXml).not.toMatch(/\bc[xy]="-/);
    expect(slideXml).not.toContain('Convention PACS');
  });
});
