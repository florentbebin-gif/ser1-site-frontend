import type { ReactNode } from 'react';

import type { RevenuCategorie, SituationFiscale } from '@/domain/audit/types';
import { IconBriefcase, IconBuilding, IconFileText, IconGauge } from '@/icons/ui';

import {
  formatEuro,
  formatNumber,
  positive,
  sumPositive,
  type SummaryCardData,
} from './auditCockpitShared';
import type { AuditBudgetSynthese } from './auditIrAdapter';

// Drawers de la page : 3 blocs de saisie « 2042 » + le budget.
export type FiscalDrawerId = 'activite' | 'capital' | 'charges' | 'budget';

// Regroupement des catégories de revenus par bloc de saisie, façon 2042.
export const ACTIVITE_CATEGORIES: RevenuCategorie['categorie'][] = [
  'salaires',
  'tns',
  'pensions',
  'autres',
];
export const CAPITAL_CATEGORIES: RevenuCategorie['categorie'][] = [
  'capitaux_mobiliers',
  'plus_values',
  'fonciers',
];

export function revenusForCategories(
  revenus: RevenuCategorie[],
  categories: RevenuCategorie['categorie'][],
): RevenuCategorie[] {
  return revenus.filter((revenu) => categories.includes(revenu.categorie));
}

export function totalRevenusNets(situationFiscale: SituationFiscale): number {
  return sumPositive(situationFiscale.revenus.map((revenu) => revenu.montantNet));
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count > 1 ? 's' : ''}`;
}

const TILE_ICONS: Record<FiscalDrawerId, ReactNode> = {
  activite: <IconBriefcase />,
  capital: <IconBuilding />,
  charges: <IconFileText />,
  budget: <IconGauge />,
};

// Tuiles de saisie en bas de page (style « Saisie du foyer ») : 3 blocs 2042 + budget.
export function buildFiscaliteTiles(
  situationFiscale: SituationFiscale,
  budget: AuditBudgetSynthese,
  openDrawer: (drawer: FiscalDrawerId) => void,
): SummaryCardData[] {
  const activiteRevenus = revenusForCategories(situationFiscale.revenus, ACTIVITE_CATEGORIES);
  const capitalRevenus = revenusForCategories(situationFiscale.revenus, CAPITAL_CATEGORIES);
  const activiteNet = sumPositive(activiteRevenus.map((revenu) => revenu.montantNet));
  const capitalNet = sumPositive(capitalRevenus.map((revenu) => revenu.montantNet));
  const charges = positive(situationFiscale.chargesDeductibles)
    ? (situationFiscale.chargesDeductibles ?? 0)
    : 0;
  const credits = positive(situationFiscale.reductionsCredits)
    ? (situationFiscale.reductionsCredits ?? 0)
    : 0;

  const hasFoyer =
    positive(situationFiscale.revenuFiscalReference) || positive(situationFiscale.impotRevenu);
  const hasActivite = activiteRevenus.length > 0 || hasFoyer;
  const hasCapital = capitalRevenus.length > 0;
  const hasCharges = charges > 0 || credits > 0;

  const tile = (
    id: FiscalDrawerId,
    title: string,
    filled: boolean,
    summaryLine: string,
    known: string[],
    missing: string[],
  ): SummaryCardData => ({
    id,
    title,
    status: filled ? 'partiel' : 'vide',
    badgeLabel: 'Déclaratif',
    summaryLine,
    known,
    missing,
    icon: TILE_ICONS[id],
    ctaLabel: filled ? 'Modifier' : 'Compléter',
    ctaTone: filled ? undefined : 'required',
    onAction: () => openDrawer(id),
  });

  return [
    tile(
      'activite',
      'Revenus d’activité & foyer fiscal',
      hasActivite,
      hasActivite
        ? [
            `Année ${situationFiscale.anneeReference}`,
            `${formatNumber(situationFiscale.nombreParts)} part${situationFiscale.nombreParts > 1 ? 's' : ''}`,
            activiteRevenus.length > 0 ? `activité ${formatEuro(activiteNet)}` : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Salaires, TNS, pensions et parts à renseigner',
      activiteRevenus.length > 0 ? [`Revenus d’activité nets : ${formatEuro(activiteNet)}`] : [],
      hasActivite ? [] : ['Revenus d’activité du foyer'],
    ),
    tile(
      'capital',
      'Revenus du capital & patrimoine',
      hasCapital,
      hasCapital
        ? [plural(capitalRevenus.length, 'source'), `net ${formatEuro(capitalNet)}`].join(' · ')
        : 'RCM, plus-values et fonciers à renseigner',
      hasCapital ? [`Revenus du capital nets : ${formatEuro(capitalNet)}`] : [],
      hasCapital ? [] : ['Revenus du capital / patrimoine'],
    ),
    tile(
      'charges',
      'Charges, déductions & réductions',
      hasCharges,
      hasCharges
        ? [
            charges > 0 ? `Déductions ${formatEuro(charges)}` : '',
            credits > 0 ? `Réductions/crédits ${formatEuro(credits)}` : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Déductions du revenu et crédits d’impôt à renseigner',
      [
        charges > 0 ? `Déductions : ${formatEuro(charges)}` : '',
        credits > 0 ? `Réductions/crédits : ${formatEuro(credits)}` : '',
      ].filter(Boolean),
      hasCharges ? [] : ['Charges déductibles ou réductions'],
    ),
    tile(
      'budget',
      'Budget & capacité',
      budget.hasBudget,
      budget.hasBudget
        ? [
            `Ressources ${formatEuro(budget.ressources)}`,
            `solde ${formatEuro(budget.capacite)}`,
          ].join(' · ')
        : 'Ressources, charges et capacité à renseigner',
      budget.hasBudget
        ? [
            `Ressources annuelles : ${formatEuro(budget.ressources)}`,
            `Charges courantes : ${formatEuro(budget.charges)}`,
            `Charges d’emprunt : ${formatEuro(budget.empruntsAnnuels)}`,
            `Solde budgétaire : ${formatEuro(budget.capacite)}`,
          ]
        : [],
      budget.hasBudget ? [] : ['Budget annuel du foyer'],
    ),
  ];
}
