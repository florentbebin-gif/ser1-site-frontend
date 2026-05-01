/**
 * Succession Deck Builder (P1-02)
 *
 * Génère un StudyDeckSpec pour les résultats de simulation succession.
 * Structure : Cover → Chapitre → Synthèse → Chronologie → Chapitre → Hypothèses → End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  SuccessionFamilyContextSlideSpec,
  SuccessionSynthesisSlideSpec,
  SuccessionChronologySlideSpec,
  SuccessionChronologyStepSummary,
  SuccessionHypothesesSlideSpec,
  SuccessionAnnexTableSlideSpec,
  SuccessionAssetAnnexSlideSpec,
  SuccessionAnnexBeneficiaryRow,
  SuccessionAnnexStep,
  SuccessionBeneficiarySummary,
  LogoPlacement,
} from '../theme/types';
import { buildSuccessionExportActiveHypotheses } from '@/features/succession/export/successionExportHypotheses';
import { isDebugEnabled } from '../../utils/debugFlags';
import { pickChapterImage } from '../designSystem/serenity';

const DEBUG_PPTX = isDebugEnabled('pptx');

interface SuccessionChronologieBeneficiary {
  label: string;
  brut: number;
  droits: number;
  net: number;
  capitauxDecesNets?: number;
  droitsAssuranceVie990I?: number;
  droitsSuccession?: number;
  transmissionNetteSuccession?: number;
  exonerated?: boolean;
}

interface SuccessionChronologieStep {
  actifTransmis: number;
  assuranceVieTransmise?: number;
  perTransmis?: number;
  prevoyanceTransmise?: number;
  masseTotaleTransmise?: number;
  droitsAssuranceVie?: number;
  droitsPer?: number;
  droitsPrevoyance?: number;
  partConjoint: number;
  partEnfants: number;
  droitsEnfants: number;
  beneficiaries?: SuccessionChronologieBeneficiary[];
}

export interface SuccessionData {
  actifNetSuccession: number;
  totalDroits: number;
  tauxMoyenGlobal: number;
  heritiers: Array<{
    lien: string;
    partBrute: number;
    abattement: number;
    baseImposable: number;
    droits: number;
    tauxMoyen: number;
  }>;
  predecesChronologie?: {
    applicable: boolean;
    order: 'epoux1' | 'epoux2';
    firstDecedeLabel: string;
    secondDecedeLabel: string;
    step1: SuccessionChronologieStep | null;
    step2: SuccessionChronologieStep | null;
    societeAcquets?: {
      configured: boolean;
      totalValue: number;
      firstEstateContribution: number;
      survivorShare: number;
      preciputAmount: number;
      survivorAttributionAmount: number;
      liquidationMode: 'quotes' | 'attribution_survivant';
      deceasedQuotePct: number;
      survivorQuotePct: number;
      attributionIntegrale: boolean;
    } | null;
    participationAcquets?: {
      configured: boolean;
      active: boolean;
      useCurrentAssetsAsFinalPatrimony: boolean;
      patrimoineOriginaireEpoux1: number;
      patrimoineOriginaireEpoux2: number;
      patrimoineFinalEpoux1: number;
      patrimoineFinalEpoux2: number;
      acquetsEpoux1: number;
      acquetsEpoux2: number;
      creditor: 'epoux1' | 'epoux2' | null;
      debtor: 'epoux1' | 'epoux2' | null;
      quoteAppliedPct: number;
      creanceAmount: number;
      firstEstateAdjustment: number;
    } | null;
    interMassClaims?: {
      configured: boolean;
      totalRequestedAmount: number;
      totalAppliedAmount: number;
      claims: Array<{
        id: string;
        kind: 'recompense' | 'creance';
        label?: string;
        fromPocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage' | 'indivision_separatiste';
        toPocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage' | 'indivision_separatiste';
        requestedAmount: number;
        appliedAmount: number;
      }>;
    } | null;
    affectedLiabilities?: {
      totalAmount: number;
      byPocket: Array<{
        pocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage' | 'indivision_separatiste';
        amount: number;
      }>;
    } | null;
    preciput?: {
      mode: 'global' | 'cible' | 'none';
      requestedAmount: number;
      appliedAmount: number;
      usesGlobalFallback: boolean;
      selections: Array<{
        id: string;
        label: string;
        requestedAmount: number;
        appliedAmount: number;
      }>;
    } | null;
    assuranceVieTotale?: number;
    perTotale?: number;
    prevoyanceTotale?: number;
    totalDroits: number;
    warnings?: string[];
  };
  annexBeneficiarySteps?: SuccessionAnnexStep[];
  assetAnnex?: Omit<SuccessionAssetAnnexSlideSpec, 'type' | 'title' | 'subtitle'>;
  familyContext?: Omit<SuccessionFamilyContextSlideSpec, 'type' | 'title' | 'subtitle'>;
  assumptions?: string[];
  clientName?: string;
}

export interface AdvisorInfo {
  name?: string;
  title?: string;
  office?: string;
}

export interface UiSettingsForPptx {
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

const LEGAL_TEXT = `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.`;

const LIEN_LABELS: Record<string, string> = {
  conjoint: 'Conjoint',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  frere_soeur: 'Frère / Sœur',
  neveu_niece: 'Neveu / Nièce',
  autre: 'Autre',
};

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %';

const compactCount = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);

function orderLabel(order: 'epoux1' | 'epoux2'): string {
  return order === 'epoux1'
    ? 'Époux 1 puis Époux 2'
    : 'Époux 2 puis Époux 1';
}

function droitsHorsSuccession(step: SuccessionChronologieStep): number {
  return (step.droitsAssuranceVie ?? 0) + (step.droitsPer ?? 0) + (step.droitsPrevoyance ?? 0);
}

function buildBeneficiarySummaries(
  beneficiaries: SuccessionChronologieBeneficiary[] | undefined,
  limit = 4,
): SuccessionBeneficiarySummary[] {
  return (beneficiaries ?? []).slice(0, limit).map((beneficiary) => ({
    label: beneficiary.label,
    gross: fmt(beneficiary.brut),
    tax: beneficiary.exonerated ? 'Exonéré' : fmt(beneficiary.droits),
    net: fmt(beneficiary.net),
    exonerated: beneficiary.exonerated,
  }));
}

function buildSynthesisSlide(data: SuccessionData): SuccessionSynthesisSlideSpec {
  const beneficiaryCount =
    data.heritiers.length ||
    data.predecesChronologie?.step1?.beneficiaries?.length ||
    0;

  return {
    type: 'succession-synthesis',
    title: 'Synthèse de votre simulation',
    subtitle: 'Principaux indicateurs successoraux',
    heroLabel: 'Droits estimés',
    heroValue: fmt(data.totalDroits),
    heroCaption: data.predecesChronologie?.applicable
      ? 'Total cumulé sur la chronologie simulée'
      : 'Estimation sur la succession directe simulée',
    kpis: [
      { icon: 'money', label: 'Masse transmise', value: fmt(data.actifNetSuccession) },
      { icon: 'balance', label: 'Droits cumulés', value: fmt(data.totalDroits) },
      { icon: 'percent', label: 'Taux moyen', value: fmtPct(data.tauxMoyenGlobal) },
      { icon: 'checklist', label: 'Bénéficiaires', value: compactCount(beneficiaryCount) },
    ],
  };
}

function buildFamilyContextSlide(
  familyContext: SuccessionData['familyContext'],
): SuccessionFamilyContextSlideSpec | null {
  if (!familyContext) return null;
  return {
    type: 'succession-family-context',
    title: 'Contexte familial et dispositions',
    subtitle: 'Situation civile, régime matrimonial et filiation',
    ...familyContext,
  };
}

function buildChronologyStep(
  title: string,
  subtitle: string,
  step: SuccessionChronologieStep,
): SuccessionChronologyStepSummary {
  const horsSuccession = droitsHorsSuccession(step);
  return {
    title,
    subtitle,
    masseTransmise: fmt(step.masseTotaleTransmise ?? step.actifTransmis),
    partConjoint: fmt(step.partConjoint),
    autresBeneficiaires: fmt(step.partEnfants),
    droitsSuccession: fmt(step.droitsEnfants),
    droitsHorsSuccession: horsSuccession > 0 ? fmt(horsSuccession) : undefined,
    beneficiaries: buildBeneficiarySummaries(step.beneficiaries),
  };
}

function buildDirectChronologyStep(data: SuccessionData): SuccessionChronologyStepSummary {
  const partConjoint = data.heritiers
    .filter((heir) => heir.lien === 'conjoint')
    .reduce((sum, heir) => sum + heir.partBrute, 0);
  const masseTransmise = data.heritiers.reduce((sum, heir) => sum + heir.partBrute, 0)
    || data.actifNetSuccession;
  const autresBeneficiaires = Math.max(0, masseTransmise - partConjoint);

  return {
    title: 'Succession directe',
    subtitle: 'Transmission issue de la situation simulée',
    masseTransmise: fmt(masseTransmise),
    partConjoint: fmt(partConjoint),
    autresBeneficiaires: fmt(autresBeneficiaires),
    droitsSuccession: fmt(data.totalDroits),
    beneficiaries: data.heritiers.slice(0, 4).map((heir) => ({
      label: LIEN_LABELS[heir.lien] ?? heir.lien,
      gross: fmt(heir.partBrute),
      tax: heir.droits === 0 ? 'Exonéré' : fmt(heir.droits),
      net: fmt(Math.max(0, heir.partBrute - heir.droits)),
      exonerated: heir.droits === 0,
    })),
  };
}

function buildChronologySlide(data: SuccessionData): SuccessionChronologySlideSpec {
  const chronologie = data.predecesChronologie;
  if (!chronologie || !chronologie.applicable || !chronologie.step1 || !chronologie.step2) {
    return {
      type: 'succession-chronology',
      title: 'Chronologie des décès',
      subtitle: 'Succession directe simulée',
      applicable: false,
      orderLabel: chronologie ? orderLabel(chronologie.order) : 'Chronologie non transmise',
      steps: [buildDirectChronologyStep(data)],
      totalDroits: fmt(data.totalDroits),
      notes: chronologie?.warnings?.slice(0, 4) ?? [
        "La chronologie en deux décès n'est pas retenue pour cette situation.",
      ],
    };
  }

  return {
    type: 'succession-chronology',
    title: 'Chronologie des décès',
    subtitle: 'Simulation du premier décès puis du second décès',
    applicable: true,
    orderLabel: orderLabel(chronologie.order),
    steps: [
      buildChronologyStep(`1er décès — ${chronologie.firstDecedeLabel}`, 'Transmission initiale', chronologie.step1),
      buildChronologyStep(`2e décès — ${chronologie.secondDecedeLabel}`, 'Transmission finale', chronologie.step2),
    ],
    totalDroits: fmt(chronologie.totalDroits),
    notes: chronologie.warnings?.slice(0, 4) ?? [],
  };
}

function buildHypothesesSlide(
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
  };
}

function stepToBeneficiaryRows(
  step: SuccessionChronologieStep,
): SuccessionAnnexBeneficiaryRow[] {
  return (step.beneficiaries ?? []).map((b) => ({
    label: b.label,
    capitauxDecesNets: b.capitauxDecesNets ?? 0,
    droitsAssuranceVie990I: b.droitsAssuranceVie990I ?? 0,
    droitsSuccession: b.droitsSuccession ?? b.droits,
    transmissionNetteSuccession: b.transmissionNetteSuccession ?? b.net,
    exonerated: b.exonerated,
  }));
}

function totalRow(rows: SuccessionAnnexBeneficiaryRow[]): SuccessionAnnexBeneficiaryRow {
  return {
    label: 'Total',
    capitauxDecesNets: rows.reduce((s, b) => s + b.capitauxDecesNets, 0),
    droitsAssuranceVie990I: rows.reduce((s, b) => s + b.droitsAssuranceVie990I, 0),
    droitsSuccession: rows.reduce((s, b) => s + b.droitsSuccession, 0),
    transmissionNetteSuccession: rows.reduce((s, b) => s + b.transmissionNetteSuccession, 0),
    isTotal: true,
  };
}

function buildAnnexTableSlide(data: SuccessionData): SuccessionAnnexTableSlideSpec {
  if (data.annexBeneficiarySteps && data.annexBeneficiarySteps.length > 0) {
    return {
      type: 'succession-annex-table',
      title: 'Détail des droits par bénéficiaire',
      subtitle: 'Répartition par décès et par bénéficiaire',
      steps: data.annexBeneficiarySteps,
    };
  }

  const chronologie = data.predecesChronologie;
  const steps: SuccessionAnnexStep[] = [];

  if (chronologie?.applicable && chronologie.step1 && chronologie.step2) {
    const s1 = stepToBeneficiaryRows(chronologie.step1);
    steps.push({
      title: `1er décès — ${chronologie.firstDecedeLabel}`,
      beneficiaries: [...s1, totalRow(s1)],
    });
    const s2 = stepToBeneficiaryRows(chronologie.step2);
    steps.push({
      title: `2e décès — ${chronologie.secondDecedeLabel}`,
      beneficiaries: [...s2, totalRow(s2)],
    });
  } else {
    const rows: SuccessionAnnexBeneficiaryRow[] = data.heritiers.map((h) => ({
      label: LIEN_LABELS[h.lien] ?? h.lien,
      capitauxDecesNets: 0,
      droitsAssuranceVie990I: 0,
      droitsSuccession: h.droits,
      transmissionNetteSuccession: Math.max(0, h.partBrute - h.droits),
    }));
    steps.push({
      title: 'Succession directe simulée',
      beneficiaries: [...rows, totalRow(rows)],
    });
  }

  return {
    type: 'succession-annex-table',
    title: 'Détail des droits par bénéficiaire',
    subtitle: 'Répartition par décès et par bénéficiaire',
    steps,
  };
}

function buildAssetAnnexSlide(
  assetAnnex: SuccessionData['assetAnnex'],
): SuccessionAssetAnnexSlideSpec | null {
  if (!assetAnnex || assetAnnex.columns.length === 0 || assetAnnex.rows.length === 0) return null;
  return {
    type: 'succession-annex-assets',
    title: 'Détail des actifs saisis',
    subtitle: 'Répartition par personne et par masse patrimoniale',
    ...assetAnnex,
  };
}

export function buildSuccessionStudyDeck(
  data: SuccessionData,
  _uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
  advisor?: AdvisorInfo,
): StudyDeckSpec {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const clientSubtitle = data.clientName || 'NOM Prénom';
  const advisorMeta = advisor?.name || 'NOM Prénom';

  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX Succession] Building deck:', {
      actif: data.actifNetSuccession,
      droits: data.totalDroits,
      heritiers: data.heritiers.length,
    });
  }

  const slides: Array<
    | ChapterSlideSpec
    | SuccessionFamilyContextSlideSpec
    | SuccessionSynthesisSlideSpec
    | SuccessionChronologySlideSpec
    | SuccessionAnnexTableSlideSpec
    | SuccessionAssetAnnexSlideSpec
    | SuccessionHypothesesSlideSpec
  > = [
      {
        type: 'chapter',
        title: 'Objectifs et contexte',
        subtitle: 'Estimation des droits de succession',
        body: 'Vous souhaitez estimer les droits de mutation à titre gratuit applicables à votre situation patrimoniale.',
        chapterImageIndex: pickChapterImage('succession', 0),
      },
    ];

  const familyContextSlide = buildFamilyContextSlide(data.familyContext);
  if (familyContextSlide) slides.push(familyContextSlide);

  const assetAnnexSlide = buildAssetAnnexSlide(data.assetAnnex);

  slides.push(
    buildSynthesisSlide(data),
    buildChronologySlide(data),
    {
      type: 'chapter',
      title: 'Annexes',
      subtitle: 'Informations complémentaires',
      body: 'Retrouvez ci-après le détail des droits, les hypothèses retenues et la ventilation des actifs saisis.',
      chapterImageIndex: pickChapterImage('succession', 1),
    },
    buildAnnexTableSlide(data),
  );

  if (assetAnnexSlide) {
    slides.push(assetAnnexSlide);
  }

  slides.push(buildHypothesesSlide(data.assumptions, data.predecesChronologie));

  return {
    cover: {
      type: 'cover',
      title: 'Simulation Succession',
      subtitle: clientSubtitle,
      logoUrl,
      logoPlacement,
      leftMeta: dateStr,
      rightMeta: advisorMeta,
    },
    slides,
    end: {
      type: 'end',
      legalText: LEGAL_TEXT,
    },
  };
}

export default buildSuccessionStudyDeck;
