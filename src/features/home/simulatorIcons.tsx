import type { ReactElement } from 'react';

import type { SimulatorSpace } from '@/domain/simulators/types';
import {
  IconActivity,
  IconArrowLeftRight,
  IconBarChart,
  IconBriefcase,
  IconBuilding,
  IconClock,
  IconFileText,
  IconGauge,
  IconGift,
  IconHome,
  IconLayers,
  IconNetwork,
  IconPieChart,
  IconShield,
  IconTable,
  IconTransfer,
  IconUsers,
} from '@/icons/ui';

export type IconComponent = (_props: { className?: string }) => ReactElement;

export const ICONS_BY_SPACE: Record<SimulatorSpace, IconComponent> = {
  foyer: IconHome,
  societe: IconBuilding,
};

const ICONS_BY_SIMULATOR_ID: Partial<Record<string, IconComponent>> = {
  filiation: IconUsers,
  'regime-matrimonial': IconShield,
  'donations-anterieures': IconFileText,
  'actif-passif': IconTable,
  budget: IconActivity,
  ir: IconTable,
  ifi: IconBuilding,
  retraite: IconGauge,
  per: IconClock,
  'per-potentiel': IconClock,
  'per-transfert': IconArrowLeftRight,
  placement: IconPieChart,
  credit: IconBarChart,
  'investissement-locatif': IconBuilding,
  'revenus-fonciers': IconFileText,
  'lmnp-lmp': IconBuilding,
  scpi: IconLayers,
  sci: IconNetwork,
  'plus-values-immobilieres': IconArrowLeftRight,
  'arbitrage-reemploi': IconArrowLeftRight,
  prevoyance: IconShield,
  succession: IconTransfer,
  'donation-demembrement': IconGift,
  'organigramme-societe': IconNetwork,
  'valorisation-titres': IconBriefcase,
  'projection-comptable': IconBarChart,
  'tresorerie-societe': IconBuilding,
  remuneration: IconActivity,
  'epargne-salariale': IconBriefcase,
  'cession-titres': IconArrowLeftRight,
  'sortie-capitaux': IconArrowLeftRight,
  holding: IconLayers,
  'pacte-dutreil': IconShield,
};

/** Icône d'un simulateur, avec repli sur une icône neutre. */
export function getSimulatorIcon(id: string): IconComponent {
  return ICONS_BY_SIMULATOR_ID[id] ?? IconTable;
}
