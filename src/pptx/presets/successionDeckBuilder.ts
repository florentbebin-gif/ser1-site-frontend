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
    assuranceVieTotale?: number;
    perTotale?: number;
    prevoyanceTotale?: number;
    totalDroits: number;
    warnings?: string[];
  };
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
