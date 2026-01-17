/**
 * IR (Impôt sur le Revenu) Deck Builder
 * 
 * Generates a StudyDeckSpec for IR simulation results using the Serenity template.
 * Now with KPI-style slides matching the design specification.
 */

import type { StudyDeckSpec, ContentSlideSpec, ChapterSlideSpec, IconPlacement } from '../theme/types';

// Debug flag for development
export const DEBUG_PPTX = false;

/**
 * IR Simulation Data (matches result from irEngine)
 */
export interface IrData {
  // Core results
  taxableIncome: number;
  partsNb: number;
  taxablePerPart: number;
  tmiRate: number;
  irNet: number;
  totalTax: number;
  
  // Income breakdown (for KPI display)
  income1?: number; // Déclarant 1
  income2?: number; // Déclarant 2
  
  // Detailed breakdown
  pfuIr?: number;
  cehr?: number;
  cdhr?: number;
  psFoncier?: number;
  psDividends?: number;
  psTotal?: number;
  
  // Foyer info
  status?: 'single' | 'couple';
  childrenCount?: number;
  location?: 'metropole' | 'gmr' | 'guyane';
  
  // Additional details
  decote?: number;
  qfAdvantage?: number;
  creditsTotal?: number;
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  
  // Client info
  clientName?: string; // NOM Prénom for cover
}

/**
 * UI Settings (ThemeProvider format)
 */
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

/**
 * Advisor info (optional)
 */
export interface AdvisorInfo {
  name?: string;
  title?: string;
  office?: string;
}

/**
 * Format number as Euro
 */
function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

/**
 * Format percentage
 */
function pct(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/**
 * Format number with 2 decimals
 */
function fmt2(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Build KPI summary body text (styled for visual presentation)
 * This creates the 4-column KPI layout content
 */
function buildKpiSummaryBody(irData: IrData): string {
  const lines: string[] = [];
  
  // KPI 1: Estimation de vos revenus
  lines.push('ESTIMATION DE VOS REVENUS');
  if (irData.status === 'couple' && (irData.income1 || irData.income2)) {
    lines.push(`Déclarant 1 : ${euro(irData.income1 || 0)}`);
    lines.push(`Déclarant 2 : ${euro(irData.income2 || 0)}`);
  } else {
    lines.push(`Total : ${euro(irData.taxableIncome)}`);
  }
  lines.push('');
  
  // KPI 2: Estimation du revenu imposable
  lines.push('ESTIMATION DU REVENU IMPOSABLE');
  lines.push(euro(irData.taxableIncome));
  lines.push('');
  
  // KPI 3: Nombre de parts fiscales
  lines.push('NOMBRE DE PARTS FISCALES');
  lines.push(fmt2(irData.partsNb));
  lines.push('');
  
  // KPI 4: TMI
  lines.push('TMI (TRANCHE MARGINALE D\'IMPOSITION)');
  lines.push(pct(irData.tmiRate));
  lines.push('');
  
  // Tax brackets bar representation
  lines.push('─────────────────────────────────────────');
  lines.push('BARÈME PROGRESSIF DE L\'IMPÔT');
  lines.push('0% │ 11% │ 30% │ 41% │ 45%');
  lines.push(`Votre TMI : ${pct(irData.tmiRate)}`);
  lines.push('─────────────────────────────────────────');
  lines.push('');
  
  // Final result
  lines.push('ESTIMATION DU MONTANT DE VOTRE IMPÔT SUR LE REVENU');
  lines.push(euro(irData.irNet));
  
  return lines.join('\n');
}

/**
 * Build detailed calculation body text
 */
function buildDetailedCalculationBody(irData: IrData): string {
  const lines: string[] = [];
  
  lines.push('DÉTAIL DU CALCUL DE L\'IMPÔT SUR LE REVENU');
  lines.push('');
  
  // Base imposable
  lines.push('▸ Revenu imposable du foyer');
  lines.push(`   ${euro(irData.taxableIncome)}`);
  lines.push('');
  
  // Quotient familial
  lines.push('▸ Quotient familial');
  lines.push(`   Nombre de parts : ${fmt2(irData.partsNb)}`);
  lines.push(`   Revenu par part : ${euro(irData.taxablePerPart)}`);
  lines.push('');
  
  // Barème progressif détaillé
  if (irData.bracketsDetails && irData.bracketsDetails.length > 0) {
    lines.push('▸ Application du barème progressif');
    for (const bracket of irData.bracketsDetails) {
      if (bracket.tax > 0) {
        lines.push(`   Tranche ${bracket.label} : ${euro(bracket.base)} × ${pct(bracket.rate)} = ${euro(bracket.tax)}`);
      }
    }
    lines.push('');
  }
  
  // TMI
  lines.push('▸ Tranche marginale d\'imposition (TMI)');
  lines.push(`   ${pct(irData.tmiRate)}`);
  lines.push('');
  
  // Impôt brut
  lines.push('▸ Impôt brut avant corrections');
  lines.push(`   ${euro(irData.irNet + (irData.decote || 0) + (irData.creditsTotal || 0))}`);
  lines.push('');
  
  // Corrections
  if (irData.decote && irData.decote > 0) {
    lines.push('▸ Décote');
    lines.push(`   -${euro(irData.decote)}`);
    lines.push('');
  }
  
  if (irData.qfAdvantage && irData.qfAdvantage > 0) {
    lines.push('▸ Avantage du quotient familial');
    lines.push(`   ${euro(irData.qfAdvantage)}`);
    lines.push('');
  }
  
  if (irData.creditsTotal && irData.creditsTotal > 0) {
    lines.push('▸ Réductions et crédits d\'impôt');
    lines.push(`   -${euro(irData.creditsTotal)}`);
    lines.push('');
  }
  
  // Impôt net
  lines.push('▸ IMPÔT SUR LE REVENU NET');
  lines.push(`   ${euro(irData.irNet)}`);
  lines.push('');
  
  // Prélèvements sociaux
  if ((irData.psFoncier && irData.psFoncier > 0) || (irData.psDividends && irData.psDividends > 0)) {
    lines.push('▸ Prélèvements sociaux');
    if (irData.psFoncier && irData.psFoncier > 0) {
      lines.push(`   Sur revenus fonciers : ${euro(irData.psFoncier)}`);
    }
    if (irData.psDividends && irData.psDividends > 0) {
      lines.push(`   Sur dividendes : ${euro(irData.psDividends)}`);
    }
    lines.push('');
  }
  
  // Contributions exceptionnelles
  if ((irData.cehr && irData.cehr > 0) || (irData.cdhr && irData.cdhr > 0)) {
    lines.push('▸ Contributions exceptionnelles');
    if (irData.cehr && irData.cehr > 0) {
      lines.push(`   CEHR : ${euro(irData.cehr)}`);
    }
    if (irData.cdhr && irData.cdhr > 0) {
      lines.push(`   CDHR : ${euro(irData.cdhr)}`);
    }
    lines.push('');
  }
  
  // Total
  lines.push('═══════════════════════════════════════');
  lines.push('▸ IMPOSITION TOTALE');
  lines.push(`   ${euro(irData.totalTax)}`);
  
  // Taux moyen
  if (irData.taxableIncome > 0) {
    const tauxMoyen = (irData.totalTax / irData.taxableIncome) * 100;
    lines.push(`   Taux moyen d'imposition : ${pct(tauxMoyen)}`);
  }
  
  return lines.join('\n');
}

/**
 * Build IR Study Deck Specification
 * 
 * Structure:
 * 1. Cover - "NOM Prénom" as subtitle
 * 2. Chapter "Objectifs et contexte" - short description only
 * 3. Content "Synthèse" - KPI style with icons
 * 4. Chapter "Annexes" 
 * 5. Content "Détail du calcul" - full calculation details
 * 6. End - legal mentions
 * 
 * @param irData - IR simulation results
 * @param uiSettings - Theme colors from ThemeProvider
 * @param logoUrl - Optional logo URL from Supabase Storage
 * @param advisor - Optional advisor information
 */
export function buildIrStudyDeck(
  irData: IrData,
  uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  advisor?: AdvisorInfo
): StudyDeckSpec {
  // Debug logging
  if (DEBUG_PPTX) {
    console.log('[PPTX IR] Building deck with:');
    console.log('  Theme colors:', {
      bgMain: uiSettings.c1,
      accent: uiSettings.c6,
      textBody: uiSettings.c10,
    });
    console.log('  IR Data:', {
      taxableIncome: irData.taxableIncome,
      tmiRate: irData.tmiRate,
      totalTax: irData.totalTax,
    });
    console.log('  Logo URL:', logoUrl || '(none)');
    console.log('  Chapter images: ch-01.png, ch-03.png');
  }
  
  // Format date
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Client name for subtitle (NOM Prénom format)
  const clientSubtitle = irData.clientName || 'NOM Prénom';
  
  // Advisor meta
  const advisorMeta = advisor?.name 
    ? advisor.name
    : 'NOM Prénom';
  
  // Icons for KPI content slide (matching the screenshot layout)
  const kpiIcons: IconPlacement[] = [
    { name: 'money', x: 1.5, y: 1.2, w: 0.8, h: 0.8, colorRole: 'accent' },
    { name: 'cheque', x: 4.5, y: 1.2, w: 0.8, h: 0.8, colorRole: 'accent' },
    { name: 'balance', x: 7.5, y: 1.2, w: 0.8, h: 0.8, colorRole: 'accent' },
    { name: 'percent', x: 10.5, y: 1.2, w: 0.8, h: 0.8, colorRole: 'accent' },
  ];
  
  // Build slides array
  const slides: Array<ChapterSlideSpec | ContentSlideSpec> = [
    // Chapter 1: Objectifs et contexte (title + short description only)
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Vous souhaitez estimer le montant de votre impôt sur le revenu',
      chapterImageIndex: 1,
    },
    // Content: Synthèse KPI style
    {
      type: 'content',
      title: 'Synthèse de votre simulation',
      subtitle: 'Principaux indicateurs fiscaux',
      body: buildKpiSummaryBody(irData),
      icons: kpiIcons,
    },
    // Chapter 2: Annexes
    {
      type: 'chapter',
      title: 'Annexes',
      subtitle: 'Détail des calculs et informations complémentaires',
      chapterImageIndex: 3,
    },
    // Content: Détail du calcul
    {
      type: 'content',
      title: 'Détail du calcul',
      subtitle: 'Méthode de calcul de l\'impôt sur le revenu',
      body: buildDetailedCalculationBody(irData),
    },
  ];
  
  // Build complete deck spec
  const spec: StudyDeckSpec = {
    cover: {
      type: 'cover',
      title: 'Simulation Impôt sur le Revenu',
      subtitle: clientSubtitle, // NOM Prénom instead of foyer description
      logoUrl,
      leftMeta: dateStr,
      rightMeta: advisorMeta,
    },
    slides,
    end: {
      type: 'end',
      legalText: `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.`,
    },
  };
  
  if (DEBUG_PPTX) {
    console.log('[PPTX IR] Deck spec built:', {
      coverTitle: spec.cover.title,
      coverSubtitle: spec.cover.subtitle,
      slidesCount: spec.slides.length,
      slideTypes: spec.slides.map(s => s.type),
    });
  }
  
  return spec;
}

export default buildIrStudyDeck;
