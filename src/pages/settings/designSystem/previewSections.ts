import type { ComponentType } from 'react';
import { DesignSystemDataPreview } from './DataPreview';
import { DesignSystemInputPreview } from './InputPreview';
import { DesignSystemMobilePreview } from './MobilePreview';
import { DesignSystemModernityPreview } from './ModernityPreview';
import { DesignSystemRailPreview } from './RailPreview';
import { DesignSystemUiPreview } from './UiPreview';

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
    title: 'Rail & bascule de mode',
    note: 'Repère de parcours discret et switch Mode expert : surfaces partagées à toutes les pages simulateur.',
    Preview: DesignSystemRailPreview,
  },
  { title: 'Données CGP', Preview: DesignSystemDataPreview },
  { title: 'Modernité', Preview: DesignSystemModernityPreview },
  { title: 'Mobile 390', Preview: DesignSystemMobilePreview },
];
