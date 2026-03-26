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
}: {
  fiscalSnapshot: SuccessionFiscalSnapshot;
  attentions: string[];
  hasInterMassClaims: boolean;
  hasAffectedLiabilities: boolean;
}): string[] {
  const staticAssumptions = [
    'Baremes DMTG et abattements appliques depuis les parametres de l\'application.',
    `Parametres transmis au module: rappel fiscal donations ${fiscalSnapshot.donation.rappelFiscalAnnees} ans, AV deces 990 I ${fiscalSnapshot.avDeces.primesApres1998.allowancePerBeneficiary} EUR par beneficiaire, AV apres ${fiscalSnapshot.avDeces.agePivotPrimes} ans ${fiscalSnapshot.avDeces.apres70ans.globalAllowance} EUR (global).`,
    'La lecture civile repose sur le contexte familial, les masses patrimoniales saisies et les dispositions declarees.',
    'Les capitaux deces d\'assurance-vie et de PER assurance sont ventiles par beneficiaire a partir des clauses saisies, avec une lecture simplifiee des regimes 990 I / 757 B.',
    "L'horizon de deces simule s'applique aux valorisations dependant de la date du deces, sans decalage calendaire distinct entre le 1er et le 2e deces.",
    'La chronologie 2 deces repose sur un chainage simplifie avec warnings sur les cas non couverts.',
    'La devolution legale est presentee en lecture civile simplifiee, sans gestion exhaustive des ordres successoraux.',
    'Les liberalites et avantages matrimoniaux sont qualifies de facon indicative, sans recalcul automatique exhaustif des droits dans ce module.',
    "L'integration chiffree fine (rapport civil detaille, reduction, liquidation notariale) n'est pas encore modelisee.",
    'Resultat indicatif, a confirmer par une analyse patrimoniale et notariale.',
  ];

  if (hasInterMassClaims) {
    staticAssumptions.push(
      'Les recompenses et creances entre masses sont appliquees comme transferts simplifies entre poches patrimoniales, sans liquidation notariale exhaustive ni production automatique des preuves juridiques.',
    );
  }

  if (hasAffectedLiabilities) {
    staticAssumptions.push(
      'Les passifs detailles rattaches a une poche sont traites comme passifs affectes dans la liquidation simplifiee et minoreront uniquement la masse concernee.',
    );
  }

  return uniqueStrings([
    ...attentions,
    ...staticAssumptions,
  ]);
}
