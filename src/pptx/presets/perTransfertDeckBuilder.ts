import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import {
  BASE_CG_RETRAITE_LEGAL_NOTICE,
  formatBaseCgRetraiteDocumentsNotice,
  formatBaseCgRetraiteRateField,
  normalizeBaseCgRetraiteGestionFees,
} from '@/data/base-cg-retraite';
import {
  computeCumulativeRent,
  type PerTransfertInput,
  type PerTransfertResult,
} from '@/engine/per';
import type {
  ContentSlideSpec,
  LogoPlacement,
  PerTransfertAuditContractSlideSpec,
  PerTransfertSynthesisSlideSpec,
  StudyDeckSpec,
} from '../theme/types';
import { pickChapterImage } from '../designSystem/serenity';

export interface PerTransfertDeckData {
  input: PerTransfertInput;
  result: PerTransfertResult;
  selectedContract: BaseCgRetraiteContract | null;
  clientName?: string;
}

export interface PerTransfertUiSettingsForPptx {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

export interface PerTransfertAdvisorInfo {
  name?: string;
}

const LEGAL_TEXT = `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des informations communiquées, du référentiel contrat disponible et des paramètres fiscaux chargés dans SER1 à la date de génération.

${BASE_CG_RETRAITE_LEGAL_NOTICE}`;

function euro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function percent(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function signedEuro(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0 €';
  const absolute = euro(Math.abs(value));
  return `${value > 0 ? '+' : '-'} ${absolute}`;
}

function baseCgRate(value: string | number | null | undefined): string {
  return formatBaseCgRetraiteRateField(value) || 'à compléter';
}

function currentDateLong(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function advisorMeta(advisor?: PerTransfertAdvisorInfo): string {
  return advisor?.name
    ? `${advisor.name}\nConseiller en gestion de patrimoine`
    : 'Conseiller en gestion de patrimoine';
}

function content(title: string, subtitle: string, body: string): ContentSlideSpec {
  return { type: 'content', title, subtitle, body };
}

function buildSynthesisSlide(
  input: PerTransfertInput,
  result: PerTransfertResult,
): PerTransfertSynthesisSlideSpec {
  const short = result.capitalExit.shortHorizon;
  const long = result.capitalExit.longHorizon;
  const newPerCumulShort = computeCumulativeRent(
    result.newPerFiscal.netAnnualRent,
    input.projection.newRentRevaluationRate,
    short.years,
  );
  const newPerCumulLong = computeCumulativeRent(
    result.newPerFiscal.netAnnualRent,
    input.projection.newRentRevaluationRate,
    long.years,
  );
  const keep = result.keepScenario.currentRent;

  return {
    type: 'per-transfert-synthesis',
    title: 'Synthèse financière',
    subtitle: 'Contrat actuel versus nouveau PER',
    rows: [
      {
        label: 'Taux de conversion',
        keepScenario: percent(result.currentConversionRate),
        transferScenario: percent(result.newPerRent.apparentRate),
        difference: '-',
      },
      {
        label: 'Rente brute annuelle',
        keepScenario: euro(keep.grossAnnualRent),
        transferScenario: euro(result.newPerRent.grossAnnualRent),
        difference: signedEuro(result.newPerRent.grossAnnualRent - keep.grossAnnualRent),
      },
      {
        label: 'Rente nette annuelle',
        keepScenario: euro(keep.netAnnualRent),
        transferScenario: euro(result.newPerFiscal.netAnnualRent),
        difference: signedEuro(result.newPerFiscal.netAnnualRent - keep.netAnnualRent),
      },
      {
        label: 'Capital projeté à la retraite',
        keepScenario: euro(result.keepScenario.capitalAtLiquidation),
        transferScenario: euro(result.capitalAtLiquidation),
        difference: signedEuro(
          result.capitalAtLiquidation - result.keepScenario.capitalAtLiquidation,
        ),
      },
      {
        label: `Cumul net ${short.horizonAge} ans`,
        keepScenario: euro(keep.cumulativeToShortHorizon),
        transferScenario: euro(Math.max(newPerCumulShort, short.cumulativeNetWithdrawals)),
        difference: signedEuro(
          Math.max(newPerCumulShort, short.cumulativeNetWithdrawals) -
            keep.cumulativeToShortHorizon,
        ),
      },
      {
        label: `Cumul net ${long.horizonAge} ans`,
        keepScenario: euro(keep.cumulativeToLongHorizon),
        transferScenario: euro(Math.max(newPerCumulLong, long.cumulativeNetWithdrawals)),
        difference: signedEuro(
          Math.max(newPerCumulLong, long.cumulativeNetWithdrawals) - keep.cumulativeToLongHorizon,
        ),
      },
      {
        label: 'Capital unique',
        keepScenario: '-',
        transferScenario: euro(result.capitalExit.unique.netIRPS),
        difference: '-',
      },
      {
        label: `Capital fractionné ${short.horizonAge} ans`,
        keepScenario: '-',
        transferScenario: euro(short.cumulativeNetWithdrawals),
        difference: '-',
      },
      {
        label: `Capital fractionné ${long.horizonAge} ans`,
        keepScenario: '-',
        transferScenario: euro(long.cumulativeNetWithdrawals),
        difference: '-',
      },
      {
        label: `Sans retrait à ${long.horizonAge} ans`,
        keepScenario: '-',
        transferScenario: euro(result.capitalExit.withoutWithdrawalToLongHorizon),
        difference: '-',
      },
    ],
    legalNote:
      '*En cas de sortie en capital d’un PER, les intérêts sont fiscalisés selon les paramètres fiscaux chargés dans SER1.',
  };
}

function buildAuditSlide(contract: BaseCgRetraiteContract): PerTransfertAuditContractSlideSpec {
  return {
    type: 'per-transfert-audit-contract',
    title: 'Audit complet du contrat actuel',
    subtitle: `${contract.compagnie} - ${contract.nomContrat}`,
    contract,
    documentNotice: formatBaseCgRetraiteDocumentsNotice(contract.documents),
    legalNote:
      'Base CG indicative : vérifier auprès de la compagnie les Conditions Générales, notices et avenants officiels applicables avant recommandation.',
  };
}

export function buildPerTransfertStudyDeck(
  data: PerTransfertDeckData,
  _uiSettings: PerTransfertUiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
  advisor?: PerTransfertAdvisorInfo,
): StudyDeckSpec {
  const { input, result, selectedContract } = data;
  const contractLabel = selectedContract
    ? `${selectedContract.compagnie} - ${selectedContract.nomContrat}`
    : 'Contrat renseigné manuellement';
  const selectedGestionFees = selectedContract
    ? normalizeBaseCgRetraiteGestionFees(selectedContract.phaseEpargne)
    : null;
  const short = result.capitalExit.shortHorizon;
  const long = result.capitalExit.longHorizon;
  const warningText =
    result.warnings.length > 0
      ? result.warnings.join('\n')
      : 'Aucun point bloquant détecté dans les hypothèses saisies.';

  return {
    cover: {
      type: 'cover',
      title: 'Étude - Transfert épargne retraite',
      subtitle: data.clientName || contractLabel,
      logoUrl,
      logoPlacement,
      leftMeta: currentDateLong(),
      rightMeta: advisorMeta(advisor),
    },
    slides: [
      {
        type: 'chapter',
        title: 'Objectif de l’étude',
        subtitle: 'Comparer le maintien du contrat actuel et le transfert vers un nouveau PER',
        body: 'L’étude reprend la logique de devoir de conseil : analyse des garanties du contrat actuel, affectation dans le bon compartiment PER, projection de la rente et des sorties en capital.',
        chapterImageIndex: pickChapterImage('per', 0),
      },
      content(
        'Contrat analysé',
        contractLabel,
        [
          `Type d'origine : ${input.originalContractType}`,
          `Compartiment cible : ${result.compartment}`,
          `Capital acquis : ${euro(input.capitalAcquis)}`,
          `Rente brute annuelle relevée : ${euro(input.renteActuelleAnnuelleBrute)}`,
        ].join('\n'),
      ),
      content(
        'Grille devoir de conseil - phase épargne',
        'Données reprises du référentiel Base CG lorsque le contrat est connu',
        [
          `Commercialisation : ${selectedContract?.phaseEpargne.dateCommercialisation ?? 'à compléter'}`,
          `Frais gestion fonds € : ${baseCgRate(selectedGestionFees?.fraisGestionFondsEuro)}`,
          `Frais gestion UC : ${baseCgRate(selectedGestionFees?.fraisGestionUc)}`,
          `Frais de transfert sortant : ${selectedContract?.phaseEpargne.fraisTransfertSortant ?? 'à compléter'}`,
          `Garanties : ${selectedContract?.phaseEpargne.garantiesComplementaires ?? 'à compléter'}`,
        ].join('\n'),
      ),
      content(
        'Grille devoir de conseil - phase liquidation',
        'Rente, capital, table de mortalité et options',
        [
          `Sortie capital : ${selectedContract?.phaseLiquidation.sortieCapitalRetraite ?? 'à compléter'}`,
          `Table de conversion : ${selectedContract?.phaseLiquidation.tableConversionRente ?? input.annuityOptions.mortalityTable}`,
          `Frais sur arrérages : ${selectedContract?.phaseLiquidation.fraisArrerages ?? 'à compléter'}`,
          `Réversion : ${selectedContract?.phaseLiquidation.reversionPossible ?? 'à compléter'}`,
        ].join('\n'),
      ),
      ...(selectedContract ? [buildAuditSlide(selectedContract)] : []),
      content(
        'Taux de rente actuel',
        'Rente indiquée au relevé rapportée au capital acquis',
        [
          `Capital acquis : ${euro(input.capitalAcquis)}`,
          `Rente brute annuelle : ${euro(input.renteActuelleAnnuelleBrute)}`,
          `Taux de rente actuel : ${percent(result.currentConversionRate)}`,
          `Rente nette estimée après fiscalité : ${euro(result.currentRent.netAnnualRent)}`,
        ].join('\n'),
      ),
      content(
        'Transfert vers le PER',
        'Capital net transféré puis projeté jusqu’à la liquidation',
        [
          `Capital après frais de transfert : ${euro(result.capitalAfterTransfer)}`,
          `Capital à la liquidation : ${euro(result.capitalAtLiquidation)}`,
          `Capital affecté à la rente : ${euro(result.capitalExit.capitalConvertedToRent)}`,
          `Capital affecté à la sortie capital : ${euro(result.capitalExit.capitalAvailableAtLiquidation)}`,
        ].join('\n'),
      ),
      content(
        'Conversion en rente du nouveau PER',
        `Table ${input.annuityOptions.mortalityTable}`,
        [
          `Facteur actuariel : ${result.newPerRent.annuityFactor.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}`,
          `Rente brute annuelle : ${euro(result.newPerRent.grossAnnualRent)}`,
          `Rente nette annuelle avant fiscalité : ${euro(result.newPerRent.netAnnualRent)}`,
          `Taux apparent : ${percent(result.newPerRent.apparentRate)}`,
        ].join('\n'),
      ),
      content(
        'Fiscalité des rentes',
        `Famille fiscale ${result.newPerFiscal.family}`,
        [
          `Fraction imposable : ${percent(result.newPerFiscal.taxableFraction)}`,
          `Assiette imposable : ${euro(result.newPerFiscal.taxableIncome)}`,
          `Impôt estimé : ${euro(result.newPerFiscal.incomeTax)}`,
          `Prélèvements sociaux estimés : ${euro(result.newPerFiscal.socialContributions)}`,
        ].join('\n'),
      ),
      content(
        'Sortie en capital',
        'Hypothèse de fractionnement retenue dans SER1',
        [
          `Part sortie capital : ${percent(result.capitalExit.shareRate)}`,
          `Capital disponible : ${euro(result.capitalExit.capitalAvailableAtLiquidation)}`,
          `Capital unique net IR+PS : ${euro(result.capitalExit.unique.netIRPS)}`,
          `Seuil petite rente : ${result.smallAnnuityCapitalExitEligible ? 'éligible' : 'non éligible'}`,
        ].join('\n'),
      ),
      content(
        `Fractionnement jusqu’à ${short.horizonAge} ans`,
        'Retrait annuel constant',
        [
          `Durée : ${short.years} ans`,
          `Retrait annuel : ${euro(short.annualWithdrawal)}`,
          `Cumul net des retraits : ${euro(short.cumulativeNetWithdrawals)}`,
        ].join('\n'),
      ),
      content(
        `Fractionnement jusqu’à ${long.horizonAge} ans`,
        'Retrait annuel constant',
        [
          `Durée : ${long.years} ans`,
          `Retrait annuel : ${euro(long.annualWithdrawal)}`,
          `Cumul net des retraits : ${euro(long.cumulativeNetWithdrawals)}`,
        ].join('\n'),
      ),
      buildSynthesisSlide(input, result),
      content(
        'Cas Préfon et contrats en points',
        'Calcul distinct du modèle actuariel capital',
        input.prefon.enabled
          ? 'Le contrat sélectionné relève du modèle en points. SER1 utilise les points saisis lorsqu’ils sont disponibles ; sinon, le capital net est converti en points à partir de la valeur d’acquisition et du coefficient d’âge.'
          : 'Le contrat sélectionné n’est pas traité comme un contrat en points dans cette simulation.',
      ),
      content('Points de vigilance', 'Éléments à valider avant recommandation finale', warningText),
      content(
        'Conclusion de travail',
        'Décision à documenter dans le devoir de conseil',
        'La recommandation finale doit rapprocher le gain financier projeté, la perte éventuelle de garanties anciennes, la souplesse de sortie capital et la situation fiscale prévisible à la retraite.',
      ),
    ],
    end: {
      type: 'end',
      legalText: LEGAL_TEXT,
    },
  };
}
