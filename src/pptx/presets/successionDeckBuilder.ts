/**
 * Succession Deck Builder (P1-02)
 *
 * Generates a StudyDeckSpec for succession simulation results.
 * Structure: Cover -> Chapter -> Synthesis -> Chronologie -> Chapter -> Content (hypotheses) -> End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  ContentSlideSpec,
  SuccessionSynthesisSlideSpec,
  LogoPlacement,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';
import { pickChapterImage } from '../designSystem/serenity';

const DEBUG_PPTX = isDebugEnabled('pptx');

interface SuccessionChronologieBeneficiary {
  label: string;
  brut: number;
  droits: number;
  net: number;
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

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function orderLabel(order: 'epoux1' | 'epoux2'): string {
  return order === 'epoux1'
    ? 'Époux 1 puis Époux 2'
    : 'Époux 2 puis Époux 1';
}

function liquidationModeLabel(mode: 'quotes' | 'attribution_survivant'): string {
  return mode === 'attribution_survivant'
    ? 'attribution prealable au survivant'
    : 'quotes contractuelles';
}

function buildChronologieBeneficiaryLines(
  stepLabel: string,
  beneficiaries?: SuccessionChronologieBeneficiary[],
): string[] {
  if (!beneficiaries || beneficiaries.length === 0) return [];

  const lines = [`• ${stepLabel} - Bénéficiaires réels:`];
  beneficiaries.slice(0, 6).forEach((beneficiary) => {
    lines.push(
      `  - ${beneficiary.label}: ${fmt(beneficiary.brut)}${beneficiary.exonerated ? ' (exonéré)' : `, droits ${fmt(beneficiary.droits)}`}`,
    );
  });
  if (beneficiaries.length > 6) {
    lines.push(`  - ${beneficiaries.length - 6} autre(s) bénéficiaire(s) non affiché(s)`);
  }

  return lines;
}

function buildChronologieBody(data?: SuccessionData['predecesChronologie']): string {
  if (!data) {
    return [
      '- Chronologie non transmise dans cette exportation',
      '- Utiliser la page simulateur pour consulter les droits des 2 etapes',
    ].join('\n');
  }

  const lines: string[] = [
    `- Ordre simule: ${orderLabel(data.order)}`,
    `- Chronologie retenue comme source principale: ${data.applicable ? 'Oui' : 'Non'}`,
  ];

  if (data.societeAcquets && data.societeAcquets.totalValue > 0) {
    lines.push(
      `- Societe d'acquets: valeur nette ${fmt(data.societeAcquets.totalValue)}, ` +
      `part 1er deces ${fmt(data.societeAcquets.firstEstateContribution)}, ` +
      `part survivant ${fmt(data.societeAcquets.survivorShare)}, ` +
      `mode ${liquidationModeLabel(data.societeAcquets.liquidationMode)}, ` +
      `quotes ${Math.round(data.societeAcquets.deceasedQuotePct)}% / ${Math.round(data.societeAcquets.survivorQuotePct)}%`,
    );
    if (data.societeAcquets.preciputAmount > 0) {
      lines.push(`- Societe d'acquets: preciput preleve ${fmt(data.societeAcquets.preciputAmount)}`);
    }
    if (data.societeAcquets.survivorAttributionAmount > 0) {
      lines.push(`- Societe d'acquets: attribution prealable ${fmt(data.societeAcquets.survivorAttributionAmount)}`);
    }
    if (data.societeAcquets.attributionIntegrale) {
      lines.push("- Societe d'acquets: attribution integrale du reliquat au survivant.");
    }
  }

  if (data.preciput && (data.preciput.appliedAmount > 0 || data.preciput.selections.length > 0)) {
    lines.push(
      `- Preciput ${data.preciput.mode === 'cible' ? 'cible' : 'global'}: montant preleve ${fmt(data.preciput.appliedAmount)}`,
    );
    if (data.preciput.usesGlobalFallback) {
      lines.push("- Preciput: mode de repli global actif faute de selection ciblee compatible.");
    }
    data.preciput.selections.forEach((selection) => {
      lines.push(`- Preciput: ${selection.label} preleve pour ${fmt(selection.appliedAmount)}`);
    });
  }

  if (data.participationAcquets) {
    if (!data.participationAcquets.active) {
      lines.push("- Participation aux acquets: configuration inactive, calcul conserve en separation de biens.");
    } else {
      lines.push(
        `- Participation aux acquets: patrimoines originaires ${fmt(data.participationAcquets.patrimoineOriginaireEpoux1)} / ${fmt(data.participationAcquets.patrimoineOriginaireEpoux2)}, ` +
        `patrimoines finals ${fmt(data.participationAcquets.patrimoineFinalEpoux1)} / ${fmt(data.participationAcquets.patrimoineFinalEpoux2)}, ` +
        `acquets nets ${fmt(data.participationAcquets.acquetsEpoux1)} / ${fmt(data.participationAcquets.acquetsEpoux2)}, ` +
        `creance ${fmt(data.participationAcquets.creanceAmount)}`,
      );
      if (data.participationAcquets.creditor && data.participationAcquets.debtor) {
        lines.push(
          `- Participation aux acquets: ${data.participationAcquets.debtor} doit ${fmt(data.participationAcquets.creanceAmount)} a ${data.participationAcquets.creditor} (quote ${Math.round(data.participationAcquets.quoteAppliedPct)}%).`,
        );
      }
    }
  }

  if (data.interMassClaims && data.interMassClaims.totalAppliedAmount > 0) {
    lines.push(
      `- Recompenses / creances entre masses: ${fmt(data.interMassClaims.totalAppliedAmount)} appliques sur ${data.interMassClaims.claims.filter((claim) => claim.appliedAmount > 0).length} ecriture(s).`,
    );
    data.interMassClaims.claims
      .filter((claim) => claim.appliedAmount > 0)
      .slice(0, 4)
      .forEach((claim) => {
        lines.push(
          `- ${claim.label ?? claim.kind}: ${fmt(claim.appliedAmount)} de ${claim.fromPocket} vers ${claim.toPocket}.`,
        );
      });
  }

  if (data.affectedLiabilities && data.affectedLiabilities.totalAmount > 0) {
    lines.push(`- Passif affecte: ${fmt(data.affectedLiabilities.totalAmount)} rattaches a une ou plusieurs masses.`);
  }

  if (data.applicable && data.step1 && data.step2) {
    lines.push(
      `- Étape 1 (${data.firstDecedeLabel}) - masse totale ${fmt(data.step1.masseTotaleTransmise ?? data.step1.actifTransmis)}, ` +
      `dont assurance-vie ${fmt(data.step1.assuranceVieTransmise ?? 0)}, ` +
      `dont PER assurance ${fmt(data.step1.perTransmis ?? 0)}, ` +
      `dont prévoyance décès ${fmt(data.step1.prevoyanceTransmise ?? 0)}, ` +
      `part conjoint/partenaire ${fmt(data.step1.partConjoint)}, autres bénéficiaires ${fmt(data.step1.partEnfants)}, droits succession ${fmt(data.step1.droitsEnfants)}` +
      `${(data.step1.droitsAssuranceVie ?? 0) > 0 ? `, droits assurance-vie ${fmt(data.step1.droitsAssuranceVie ?? 0)}` : ''}` +
      `${(data.step1.droitsPer ?? 0) > 0 ? `, droits PER ${fmt(data.step1.droitsPer ?? 0)}` : ''}` +
      `${(data.step1.droitsPrevoyance ?? 0) > 0 ? `, droits prévoyance ${fmt(data.step1.droitsPrevoyance ?? 0)}` : ''}`,
    );
    lines.push(...buildChronologieBeneficiaryLines(`Étape 1 (${data.firstDecedeLabel})`, data.step1.beneficiaries));
    lines.push(
      `- Étape 2 (${data.secondDecedeLabel}) - masse totale ${fmt(data.step2.masseTotaleTransmise ?? data.step2.actifTransmis)}, ` +
      `dont assurance-vie ${fmt(data.step2.assuranceVieTransmise ?? 0)}, ` +
      `dont PER assurance ${fmt(data.step2.perTransmis ?? 0)}, ` +
      `dont prévoyance décès ${fmt(data.step2.prevoyanceTransmise ?? 0)}, ` +
      `part conjoint/partenaire ${fmt(data.step2.partConjoint)}, autres bénéficiaires ${fmt(data.step2.partEnfants)}, droits succession ${fmt(data.step2.droitsEnfants)}` +
      `${(data.step2.droitsAssuranceVie ?? 0) > 0 ? `, droits assurance-vie ${fmt(data.step2.droitsAssuranceVie ?? 0)}` : ''}` +
      `${(data.step2.droitsPer ?? 0) > 0 ? `, droits PER ${fmt(data.step2.droitsPer ?? 0)}` : ''}` +
      `${(data.step2.droitsPrevoyance ?? 0) > 0 ? `, droits prévoyance ${fmt(data.step2.droitsPrevoyance ?? 0)}` : ''}`,
    );
    lines.push(...buildChronologieBeneficiaryLines(`Étape 2 (${data.secondDecedeLabel})`, data.step2.beneficiaries));
    lines.push(`- Total cumulé des droits (2 décès): ${fmt(data.totalDroits)}`);
    if (typeof data.assuranceVieTotale === 'number' && data.assuranceVieTotale > 0) {
      lines.push(`- Capitaux assurance-vie saisis: ${fmt(data.assuranceVieTotale)}`);
    }
    if (typeof data.perTotale === 'number' && data.perTotale > 0) {
      lines.push(`- Capitaux PER assurance saisis: ${fmt(data.perTotale)}`);
    }
    if (typeof data.prevoyanceTotale === 'number' && data.prevoyanceTotale > 0) {
      lines.push(`- Capitaux prévoyance décès saisis: ${fmt(data.prevoyanceTotale)}`);
    }
  } else {
    lines.push('- Chronologie 2 décès non retenue comme source principale pour la situation saisie');
  }

  if (data.warnings && data.warnings.length > 0) {
    lines.push('');
    lines.push('Avertissements:');
    data.warnings.slice(0, 4).forEach((warning) => lines.push(`- ${warning}`));
  }

  return lines.join('\n');
}

function buildAssumptionsBody(assumptions?: string[]): string {
  const fallback = [
    '- Bareme des droits de mutation a titre gratuit en vigueur (CGI Art. 777)',
    '- Abattement en ligne directe: 100 000 EUR par enfant (CGI Art. 779)',
    '- Exoneration totale du conjoint survivant (CGI Art. 796-0 bis)',
    '- Estimation hors donations anterieures; assurance-vie et PER assurance ajoutes a la masse transmise affichee',
    "- Les montants sont arrondis a l'euro le plus proche",
  ];

  const lines = assumptions && assumptions.length > 0
    ? assumptions.map((assumption) => `- ${assumption}`)
    : fallback;

  return lines.join('\n');
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

  const slides: Array<ChapterSlideSpec | SuccessionSynthesisSlideSpec | ContentSlideSpec> = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Estimation des droits de succession',
      body: 'Vous souhaitez estimer les droits de mutation à titre gratuit applicables à votre situation patrimoniale.',
      chapterImageIndex: pickChapterImage('succession', 0),
    },
    {
      type: 'succession-synthesis',
      actifNetSuccession: data.actifNetSuccession,
      totalDroits: data.totalDroits,
      tauxMoyenGlobal: data.tauxMoyenGlobal,
      heritiers: data.heritiers,
    },
    {
      type: 'content',
      title: 'Chronologie des décès',
      subtitle: 'Simulation du 1er décès puis du 2e décès',
      body: buildChronologieBody(data.predecesChronologie),
    },
    {
      type: 'chapter',
      title: 'Hypothèses et limites',
      subtitle: 'Cadre de l\'estimation',
      body: 'Les résultats ci-dessus reposent sur les hypothèses détaillées ci-après.',
      chapterImageIndex: pickChapterImage('succession', 1),
    },
    {
      type: 'content',
      title: 'Hypothèses retenues',
      subtitle: 'Barème DMTG 2024',
      body: [
        '- Barème des droits de mutation à titre gratuit en vigueur (CGI Art. 777)',
        '- Abattement en ligne directe : 100 000 EUR par enfant (CGI Art. 779)',
        '- Exonération totale du conjoint survivant (CGI Art. 796-0 bis)',
        '- Estimation hors donations antérieures ; assurance-vie et PER assurance ajoutés à la masse transmise affichée',
        '- Les montants sont arrondis à l\'euro le plus proche',
      ].join('\n'),
    },
  ];

  const lastSlide = slides[slides.length - 1];
  if (lastSlide?.type === 'content') {
    lastSlide.body = buildAssumptionsBody(data.assumptions);
  }

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
