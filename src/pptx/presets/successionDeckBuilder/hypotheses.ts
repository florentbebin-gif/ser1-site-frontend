import type { SuccessionHypothesesSlideSpec } from '@/pptx/theme/types';
import {
  buildSuccessionExportActiveHypotheses,
  buildSuccessionExportHypothesesGroups,
} from '@/utils/export/successionExportHypotheses';

import type { SuccessionData } from './types';

export function buildHypothesesSlide(
  assumptions?: string[],
  chronologie?: SuccessionData['predecesChronologie'],
): SuccessionHypothesesSlideSpec {
  const activeHypotheses = buildSuccessionExportActiveHypotheses(assumptions ?? [], chronologie);
  return {
    type: 'succession-hypotheses',
    title: 'Hypothèses retenues',
    subtitle: "Cadre de l'estimation",
    items:
      activeHypotheses.length > 0
        ? activeHypotheses
        : ["Aucune hypothèse spécifique n'a été ajoutée à cette simulation."],
    groups: buildSuccessionExportHypothesesGroups(activeHypotheses),
  };
}
