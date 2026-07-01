import { computeIrResult } from '@/engine/ir/compute';
import type { DossierAudit, RevenuCategorie, SituationFiscale } from '@/domain/audit/types';
import type { FiscalContext } from '@/hooks/useFiscalContext';

import { positive } from './auditCockpitShared';

// Résultat moteur IR (forme renvoyée par computeIrResult, non nulle).
export type AuditIrResult = NonNullable<ReturnType<typeof computeIrResult>>;

export type RevenuBeneficiaire = RevenuCategorie['beneficiaire'];

export interface AuditIrEstimate {
  // Sortie moteur (null tant qu'aucun revenu net n'est saisi).
  result: AuditIrResult | null;
  hasIncome: boolean;
  isCouple: boolean;
  parts: number;
  // Barème IR courant (chaîne fiscale) pour l'échelle TMI déclarative.
  tmiScale: FiscalContext['irScaleCurrent'];
  // Valeurs déclarées sur l'avis, pour la confrontation déclaré ↔ estimé.
  declaredIr: number;
  declaredRfr: number;
}

export interface AuditFiscalCoherence {
  indicativeParts: number | null;
  enteredParts: number;
  partsMismatch: boolean;
  declaredIr: number;
  estimatedIr: number;
  irDelta: number;
  hasDeclaredIr: boolean;
  hasEstimate: boolean;
  hasIrDelta: boolean;
  requiresReview: boolean;
}

interface EngineDeclarant {
  salaries: number;
  associes62: number;
  pensions: number;
  bic: number;
  fonciers: number;
  autres: number;
}

interface EngineIncomes {
  d1: EngineDeclarant;
  d2: EngineDeclarant;
  capital: { withPs: number; withoutPs: number };
  fonciersFoyer: number;
}

// Hypothèses simplificatrices assumées par l'estimation /audit (affichées dans l'UI).
// /sim/ir reste une surface autonome ; /audit ne l'expose pas comme pont de navigation.
export const AUDIT_IR_HYPOTHESES: string[] = [
  'Montants pris nets imposables tels que saisis (abattements déjà déduits).',
  'Nombre de parts saisi dans « Foyer fiscal » (quotient familial non recalculé depuis la filiation).',
  'Capitaux mobiliers imposés selon l’option choisie (PFU par défaut) ; revenus fonciers au régime réel.',
  'Résidence métropole, parent isolé non géré à ce stade.',
  'Barème de l’année courante issu des paramètres fiscaux centralisés.',
];

function emptyDeclarant(): EngineDeclarant {
  return { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 };
}

// Le client principal et le foyer alimentent le déclarant 1 ; le conjoint le
// déclarant 2 (uniquement en couple fiscal). L'assiette moteur somme d1 + d2,
// donc ce routage n'altère pas l'impôt, seulement la lisibilité par déclarant.
function declarantOf(beneficiaire: RevenuBeneficiaire, isCouple: boolean): 'd1' | 'd2' {
  return isCouple && beneficiaire === 'mme' ? 'd2' : 'd1';
}

function mapIncomes(revenus: RevenuCategorie[], isCouple: boolean): EngineIncomes {
  const incomes: EngineIncomes = {
    d1: emptyDeclarant(),
    d2: emptyDeclarant(),
    capital: { withPs: 0, withoutPs: 0 },
    fonciersFoyer: 0,
  };

  for (const revenu of revenus) {
    const net = positive(revenu.montantNet) ? revenu.montantNet : 0;
    if (net <= 0) continue;

    if (revenu.categorie === 'fonciers') {
      incomes.fonciersFoyer += net;
      continue;
    }
    if (revenu.categorie === 'capitaux_mobiliers') {
      incomes.capital.withPs += net;
      continue;
    }

    const target = incomes[declarantOf(revenu.beneficiaire, isCouple)];
    switch (revenu.categorie) {
      case 'salaires':
        target.salaries += net;
        break;
      case 'tns':
        target.bic += net;
        break;
      case 'pensions':
        target.pensions += net;
        break;
      case 'plus_values':
      case 'autres':
      default:
        target.autres += net;
        break;
    }
  }

  return incomes;
}

// Couple fiscal = déclaration commune (marié / pacsé). Le concubinage reste deux
// foyers fiscaux distincts côté IR.
export function isFiscalCouple(dossier: DossierAudit): boolean {
  const statut = dossier.situationFamiliale.situationMatrimoniale;
  return statut === 'marie' || statut === 'pacse';
}

export function hasDeclaredIncome(situationFiscale: SituationFiscale): boolean {
  return situationFiscale.revenus.some((revenu) => positive(revenu.montantNet));
}

// Adapter central dossier → moteur IR. Aucune règle fiscale n'est dupliquée ici :
// la chaîne fiscale fournit le barème, le moteur `computeIrResult` calcule.
export function buildAuditIrEstimate(
  dossier: DossierAudit,
  fiscalContext: FiscalContext,
): AuditIrEstimate {
  const situationFiscale = dossier.situationFiscale;
  const isCouple = isFiscalCouple(dossier);
  const parts = positive(situationFiscale.nombreParts) ? situationFiscale.nombreParts : 1;
  const hasIncome = hasDeclaredIncome(situationFiscale);
  const personsAChargeCount = dossier.situationFamiliale.enfants.filter(
    (enfant) => enfant.fiscalementACharge,
  ).length;

  const result = hasIncome
    ? computeIrResult({
        yearKey: 'current',
        status: isCouple ? 'couple' : 'single',
        isIsolated: false,
        parts,
        location: 'metropole',
        incomes: mapIncomes(situationFiscale.revenus, isCouple),
        deductions: positive(situationFiscale.chargesDeductibles)
          ? situationFiscale.chargesDeductibles
          : 0,
        credits: positive(situationFiscale.reductionsCredits)
          ? situationFiscale.reductionsCredits
          : 0,
        taxSettings: fiscalContext._raw_tax,
        psSettings: fiscalContext._raw_ps,
        capitalMode: situationFiscale.rcmOption === 'bareme' ? 'bareme' : 'pfu',
        personsAChargeCount,
      })
    : null;

  return {
    result,
    hasIncome,
    isCouple,
    parts,
    tmiScale: fiscalContext.irScaleCurrent,
    declaredIr: positive(situationFiscale.impotRevenu) ? situationFiscale.impotRevenu : 0,
    declaredRfr: positive(situationFiscale.revenuFiscalReference)
      ? situationFiscale.revenuFiscalReference
      : 0,
  };
}

export function buildFiscalCoherence(
  estimate: AuditIrEstimate,
  indicativeParts: number | null | undefined,
): AuditFiscalCoherence {
  const enteredParts = estimate.parts;
  const normalizedIndicativeParts =
    typeof indicativeParts === 'number' && indicativeParts > 0 ? indicativeParts : null;
  const estimatedIr = estimate.result?.totalTax ?? 0;
  const declaredIr = estimate.declaredIr;
  const irDelta = estimatedIr - declaredIr;
  const hasDeclaredIr = declaredIr > 0;
  const hasEstimate = estimate.result != null;
  const hasIrDelta = hasDeclaredIr && hasEstimate && Math.abs(irDelta) > 0;
  const partsMismatch =
    normalizedIndicativeParts != null && Math.abs(normalizedIndicativeParts - enteredParts) >= 0.01;

  return {
    indicativeParts: normalizedIndicativeParts,
    enteredParts,
    partsMismatch,
    declaredIr,
    estimatedIr,
    irDelta,
    hasDeclaredIr,
    hasEstimate,
    hasIrDelta,
    requiresReview: partsMismatch || hasIrDelta,
  };
}

// ─── Indicateur IFI (assujettissement, sans montant) ──────────────────────────

export type IfiStatus = 'assujetti' | 'proche' | 'non-assujetti' | 'a-qualifier';

export interface AuditIfiIndicator {
  status: IfiStatus;
  assietteImmoNette: number;
  seuil: number;
  hasImmo: boolean;
}

// Actifs entrant dans l'assiette IFI (immobilier détenu).
const IFI_ASSET_TYPES = new Set([
  'residence_principale',
  'residence_secondaire',
  'locatif',
  'scpi',
  'autre_immo',
]);

// Seuil de vigilance : on signale « proche » à partir de 80 % du seuil d'assujettissement.
const IFI_VIGILANCE_RATIO = 0.8;

// Indicateur d'assujettissement IFI lu depuis Actifs / Passifs. Aucun montant d'IFI
// n'est calculé (pas de moteur IFI) : seuil et abattement RP viennent de la chaîne
// fiscale, jamais codés en dur.
export function buildIfiIndicator(
  dossier: DossierAudit,
  fiscalContext: FiscalContext,
): AuditIfiIndicator {
  const ifi = fiscalContext.ifi.current;
  const seuil = ifi.threshold;
  const abattementRp = (ifi.residencePrincipaleAbattementRate ?? 0) / 100;

  const immoActifs = dossier.actifs.filter((actif) => IFI_ASSET_TYPES.has(actif.type));
  const hasImmo = immoActifs.length > 0;

  const brut = immoActifs.reduce((total, actif) => {
    const valeur = positive(actif.valeur) ? actif.valeur : 0;
    const abattue = actif.type === 'residence_principale' ? valeur * (1 - abattementRp) : valeur;
    return total + abattue;
  }, 0);

  const detteImmo = dossier.passif.emprunts.reduce((total, emprunt) => {
    const crd = positive(emprunt.capitalRestantDu) ? emprunt.capitalRestantDu : 0;
    return total + (emprunt.type === 'immobilier' ? crd : 0);
  }, 0);

  const assietteImmoNette = Math.max(0, brut - detteImmo);

  const status: IfiStatus = !hasImmo
    ? 'a-qualifier'
    : assietteImmoNette >= seuil
      ? 'assujetti'
      : assietteImmoNette >= seuil * IFI_VIGILANCE_RATIO
        ? 'proche'
        : 'non-assujetti';

  return { status, assietteImmoNette, seuil, hasImmo };
}

// ─── Synthèse budgétaire (capacité d'épargne après impôts) ────────────────────

export interface AuditBudgetSynthese {
  ressources: number;
  charges: number;
  empruntsAnnuels: number;
  impots: number;
  capacite: number;
  tauxEndettement: number | null;
  hasBudget: boolean;
}

// Capacité d'épargne = ressources − charges courantes − emprunts − imposition estimée.
export function buildBudgetSynthese(
  dossier: DossierAudit,
  impositionTotale: number,
): AuditBudgetSynthese {
  const budget = dossier.budget;
  const ressources = positive(budget?.ressourcesAnnuelles) ? budget!.ressourcesAnnuelles : 0;
  const charges = positive(budget?.chargesAnnuelles) ? budget!.chargesAnnuelles : 0;
  const empruntsAnnuels = dossier.passif.emprunts.reduce((total, emprunt) => {
    const mensualite = positive(emprunt.mensualite) ? emprunt.mensualite : 0;
    return total + mensualite * 12;
  }, 0);
  const impots = Math.max(0, impositionTotale);
  const tauxEndettement = ressources > 0 ? (empruntsAnnuels / ressources) * 100 : null;

  return {
    ressources,
    charges,
    empruntsAnnuels,
    impots,
    capacite: ressources - charges - empruntsAnnuels - impots,
    tauxEndettement,
    hasBudget: ressources > 0 || charges > 0 || empruntsAnnuels > 0,
  };
}
