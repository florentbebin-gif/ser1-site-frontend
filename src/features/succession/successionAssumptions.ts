import type { SuccessionFiscalSnapshot } from './successionFiscalContext';

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function buildSuccessionAssumptions({
  fiscalSnapshot,
  attentions,
  hasInterMassClaims,
  hasAffectedLiabilities,
  hasDonationsPartage,
}: {
  fiscalSnapshot: SuccessionFiscalSnapshot;
  attentions: string[];
  hasInterMassClaims: boolean;
  hasAffectedLiabilities: boolean;
  hasDonationsPartage?: boolean;
}): string[] {
  const staticAssumptions = [
    'Barèmes DMTG et abattements appliqués depuis les paramètres de l’application.',
    `Paramètres transmis au module : rappel fiscal donations ${fiscalSnapshot.donation.rappelFiscalAnnees} ans, AV décès 990 I ${fiscalSnapshot.avDeces.primesApres1998.allowancePerBeneficiary} EUR par bénéficiaire, AV après ${fiscalSnapshot.avDeces.agePivotPrimes} ans ${fiscalSnapshot.avDeces.apres70ans.globalAllowance} EUR (global).`,
    'La lecture civile repose sur le contexte familial, les masses patrimoniales saisies et les dispositions déclarées.',
    'Les capitaux décès d’assurance-vie et de PER assurance sont ventilés par bénéficiaire à partir des clauses saisies, avec une lecture simplifiée des régimes 990 I / 757 B.',
    'L’horizon de décès simulé s’applique aux valorisations dépendant de la date du décès, sans décalage calendaire distinct entre le 1er et le 2e décès.',
    'La chronologie 2 décès repose sur un chaînage simplifié avec warnings sur les cas non couverts.',
    'La dévolution légale est présentée en lecture civile simplifiée, sans gestion exhaustive des ordres successoraux.',
    'Les libéralités et avantages matrimoniaux sont qualifiés de façon indicative, sans recalcul automatique exhaustif des droits dans ce module.',
    'L’intégration chiffrée fine (rapport civil détaillé, réduction, liquidation notariale) n’est pas encore modélisée.',
    'Résultat indicatif, à confirmer par une analyse patrimoniale et notariale.',
  ];

  if (hasInterMassClaims) {
    staticAssumptions.push(
      'Les récompenses et créances entre masses sont appliquées comme transferts simplifiés entre poches patrimoniales, sans liquidation notariale exhaustive ni production automatique des preuves juridiques.',
    );
  }

  if (hasAffectedLiabilities) {
    staticAssumptions.push(
      'Les passifs détaillés rattachés à une poche sont traités comme passifs affectés dans la liquidation simplifiée et minoreront uniquement la masse concernée.',
    );
  }

  if (hasDonationsPartage) {
    staticAssumptions.push(
      'Donation(s)-partage présente(s) : valeur gelée au jour de l’acte (CCV 1078), non rapportable au partage civil. Imputation fine sur la réserve non modélisée — simplification documentée.',
    );
  }

  return uniqueStrings([
    ...attentions,
    ...staticAssumptions,
  ]);
}
