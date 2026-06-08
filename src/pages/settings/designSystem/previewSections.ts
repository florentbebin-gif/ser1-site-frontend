import type { ComponentType } from 'react';
import { DesignSystemDataPreview } from './DataPreview';
import { DesignSystemInputPreview } from './InputPreview';
import { DesignSystemMobilePreview } from './MobilePreview';
import { DesignSystemModalPreview } from './ModalPreview';
import { DesignSystemModernityPreview } from './ModernityPreview';
import { DesignSystemRailPreview } from './RailPreview';
import { DesignSystemSurfacePreview } from './SurfacePreview';
import { DesignSystemUiPreview } from './UiPreview';
import { DesignSystemVizPreview } from './VizPreview';

export const previewSections: Array<{
  title: string;
  note?: string;
  Preview: ComponentType;
}> = [
  {
    title: 'Primitives inputs',
    note: 'Les variantes euro, pourcentage et numérique partagent SimAmountInputBase pour conserver le même cycle de saisie, formatage et validation.',
    Preview: DesignSystemInputPreview,
  },
  { title: 'Primitives UI', Preview: DesignSystemUiPreview },
  {
    title: 'Surfaces cockpit',
    note: 'Taxonomie à 4 niveaux carte / bande / ligne KPI / micro-tuile plate : aucune surface élevée dans une surface élevée. Contrat AUDIT_COCKPIT §10, garde-fou check:sim-cards.',
    Preview: DesignSystemSurfacePreview,
  },
  {
    title: 'Data-viz cockpit',
    note: 'Tokens --viz-* dérivés du thème (séries, radar, rampe séquentielle) et alerte découplée du cuivre. Contrat AUDIT_COCKPIT §4, garde-fou check:css-colors.',
    Preview: DesignSystemVizPreview,
  },
  {
    title: 'Modales',
    note: 'Anatomie canonique unique (largeurs, nav latérale, footer danger, close rond) partagée par /sim/* et Settings, drawer XL /audit inclus. Référence vivante de GOUVERNANCE §16d.',
    Preview: DesignSystemModalPreview,
  },
  {
    title: 'Rail & bascule de mode',
    note: 'Repère de parcours discret et switch Mode expert : surfaces partagées à toutes les pages simulateur.',
    Preview: DesignSystemRailPreview,
  },
  { title: 'Données CGP', Preview: DesignSystemDataPreview },
  { title: 'Modernité', Preview: DesignSystemModernityPreview },
  { title: 'Mobile 390', Preview: DesignSystemMobilePreview },
];
