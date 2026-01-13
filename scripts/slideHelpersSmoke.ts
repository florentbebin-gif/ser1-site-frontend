/**
 * Usage:
 *   npx ts-node scripts/slideHelpersSmoke.ts
 *
 * Simple verification that we can load an SVG icon
 * and render a KPI row without crashing.
 */

import PptxGenJS from 'pptxgenjs';
import { drawKpiRow, loadIconAsDataUri, STYLE } from '../src/pptx/slideHelpers';

async function run() {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();

  const icon = await loadIconAsDataUri('public/ppt-assets/icons/icon-money.svg');

  drawKpiRow(slide, {
    y: STYLE.MARGIN,
    kpis: [
      { label: 'Capital acquis', value: '612 340 €', iconDataUri: icon ?? undefined },
      { label: 'Versements', value: '290 000 €' },
    ],
  });

  console.log('[slideHelpersSmoke] slide ready, not writing file.');
}

run().catch(err => {
  console.error('[slideHelpersSmoke] failed', err);
  process.exitCode = 1;
});
