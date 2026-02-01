/**
 * IR (Impôt sur le Revenu) Deck Builder
 * 
 * Generates a StudyDeckSpec for IR simulation results using the Serenity template.
 * Now with KPI-style slides matching the design specification.
 */

import type { StudyDeckSpec, ChapterSlideSpec, IrSynthesisSlideSpec, IrAnnexeSlideSpec } from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';

// Debug flag for development (activable via VITE_DEBUG_PPTX=1 ou localStorage)
const DEBUG_PPTX = isDebugEnabled('pptx');

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
  
  // TMI details (from IR card - exact values)
  tmiBaseGlobal?: number;   // Montant des revenus dans cette TMI
  tmiMarginGlobal?: number; // Marge avant changement de TMI
  
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
    // eslint-disable-next-line no-console
    console.debug('[PPTX IR] Building deck with:');
    // eslint-disable-next-line no-console
    console.debug('  Theme colors:', {
      bgMain: uiSettings.c1,
      accent: uiSettings.c6,
      textBody: uiSettings.c10,
    });
    // eslint-disable-next-line no-console
    console.debug('  IR Data:', {
      taxableIncome: irData.taxableIncome,
      tmiRate: irData.tmiRate,
      totalTax: irData.totalTax,
    });
    // eslint-disable-next-line no-console
    console.debug('  Logo URL:', logoUrl || '(none)');
    // eslint-disable-next-line no-console
    console.debug('  Chapter images: ch-01.png, ch-03.png');
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
  
  // Build slides array with new premium slide types
  const slides: Array<ChapterSlideSpec | IrSynthesisSlideSpec | IrAnnexeSlideSpec> = [
    // Chapter 1: Objectifs et contexte
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Estimation de votre impôt sur le revenu',
      body: 'Vous souhaitez connaître le montant de votre impôt et comprendre les mécanismes de calcul qui s\'appliquent à votre situation.',
      chapterImageIndex: 1,
    },
    // Slide 3: Synthèse Premium (4 KPI + barre TMI + impôt central)
    {
      type: 'ir-synthesis',
      income1: irData.income1 || 0,
      income2: irData.income2 || 0,
      isCouple: irData.status === 'couple',
      taxableIncome: irData.taxableIncome,
      partsNb: irData.partsNb,
      tmiRate: irData.tmiRate,
      irNet: irData.irNet,
      taxablePerPart: irData.taxablePerPart,
      bracketsDetails: irData.bracketsDetails,
      // TMI details (exact values from IR card)
      tmiBaseGlobal: irData.tmiBaseGlobal,
      tmiMarginGlobal: irData.tmiMarginGlobal,
    },
    // Chapter 2: Annexes
    {
      type: 'chapter',
      title: 'Annexes',
      subtitle: 'Informations complémentaires',
      body: 'Retrouvez ci-après le détail des calculs appliqués à votre situation fiscale.',
      chapterImageIndex: 3,
    },
    // Slide 5: Annexe rédigée (détail calcul adapté au cas client)
    {
      type: 'ir-annexe',
      taxableIncome: irData.taxableIncome,
      partsNb: irData.partsNb,
      taxablePerPart: irData.taxablePerPart,
      tmiRate: irData.tmiRate,
      irNet: irData.irNet,
      totalTax: irData.totalTax,
      bracketsDetails: irData.bracketsDetails,
      decote: irData.decote,
      qfAdvantage: irData.qfAdvantage,
      creditsTotal: irData.creditsTotal,
      pfuIr: irData.pfuIr, // PFU 12.8% sur revenus du capital
      cehr: irData.cehr,
      cdhr: irData.cdhr,
      psFoncier: irData.psFoncier,
      psDividends: irData.psDividends,
      psTotal: irData.psTotal,
      isCouple: irData.status === 'couple',
      childrenCount: irData.childrenCount,
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
    // eslint-disable-next-line no-console
    console.debug('[PPTX IR] Deck spec built:', {
      coverTitle: spec.cover.title,
      coverSubtitle: spec.cover.subtitle,
      slidesCount: spec.slides.length,
      slideTypes: spec.slides.map(s => s.type),
    });
  }
  
  return spec;
}

export default buildIrStudyDeck;
