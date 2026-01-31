/**
 * Demo Export Function for Testing
 * 
 * Generates a sample Serenity PPTX with all slide types for validation.
 * DEV-ONLY: Use for testing the PPTX generation system.
 */

import type { StudyDeckSpec } from '../theme/types';
import { exportAndDownloadStudyDeck } from './exportStudyDeck';

/**
 * Demo theme colors (Serenity defaults)
 * These match the DEFAULT_COLORS from ThemeProvider
 */
const DEMO_THEME = {
  c1: '#2B3E37',
  c2: '#709B8B',
  c3: '#9FBDB2',
  c4: '#CFDED8',
  c5: '#788781',
  c6: '#CEC1B6',
  c7: '#F5F3F0',
  c8: '#D9D9D9',
  c9: '#7F7F7F',
  c10: '#000000',
};

/**
 * Demo deck specification
 */
const DEMO_DECK: StudyDeckSpec = {
  cover: {
    type: 'cover',
    title: 'Audit Patrimonial',
    subtitle: 'Étude personnalisée',
    // logoUrl: undefined, // No logo for demo (or set a test URL)
    leftMeta: 'Janvier 2026',
    rightMeta: 'Jean DUPONT / Conseiller en Gestion de Patrimoine / Paris',
  },
  slides: [
    {
      type: 'chapter',
      title: 'Situation Familiale',
      subtitle: 'Analyse de votre environnement personnel',
      body: 'Cette section présente une analyse détaillée de votre situation familiale, incluant votre régime matrimonial, vos enfants et personnes à charge, ainsi que les implications patrimoniales associées.',
      chapterImageIndex: 1,
    },
    {
      type: 'content',
      title: 'Analyse du Patrimoine',
      subtitle: 'Vue d\'ensemble de vos actifs',
      body: 'Votre patrimoine est constitué de différents actifs répartis entre immobilier, financier et professionnel. Cette analyse permet d\'identifier les forces et les axes d\'optimisation.',
      icons: [
        { name: 'bank', x: 10, y: 3, w: 0.75, h: 0.75, colorRole: 'accent' },
        { name: 'calculator', x: 11, y: 3, w: 0.75, h: 0.75, colorRole: 'textMain' },
      ],
    },
    {
      type: 'chapter',
      title: 'Stratégie Recommandée',
      subtitle: 'Optimisation patrimoniale',
      body: 'Sur la base de l\'analyse de votre situation et de vos objectifs, nous vous proposons une stratégie d\'optimisation adaptée à votre profil.',
      chapterImageIndex: 2,
    },
    {
      type: 'content',
      title: 'Plan d\'Action',
      subtitle: 'Étapes de mise en œuvre',
      body: '1. Restructuration de l\'épargne existante\n2. Optimisation fiscale\n3. Préparation de la transmission\n4. Protection du conjoint',
      icons: [
        { name: 'checklist', x: 10.5, y: 2.5, w: 1, h: 1, colorRole: 'accent' },
      ],
    },
  ],
  end: {
    type: 'end',
    legalText: `MENTIONS LÉGALES

Ce document est établi à titre informatif et ne constitue pas un conseil personnalisé. Les informations contenues dans ce document sont basées sur les éléments communiqués par le client et les dispositions légales, fiscales et sociales en vigueur à la date d'établissement.

Les projections et simulations présentées sont établies sur la base d'hypothèses qui peuvent évoluer. Elles ne constituent pas une garantie de résultats futurs.

Avant toute décision d'investissement, il est recommandé de consulter un professionnel qualifié.

Document établi le ${new Date().toLocaleDateString('fr-FR')}`,
  },
};

/**
 * Export a demo PPTX for testing
 * 
 * Call this function from the browser console or a test button:
 * ```
 * import { exportSerenityDemoPptx } from './pptx/export/demoExport';
 * exportSerenityDemoPptx();
 * ```
 */
export async function exportSerenityDemoPptx(): Promise<void> {
  try {
    await exportAndDownloadStudyDeck(
      DEMO_DECK,
      DEMO_THEME,
      'serenity-demo-export.pptx',
      {
        locale: 'fr-FR',
        showSlideNumbers: true,
        coverLeftMeta: 'Janvier 2026',
        coverRightMeta: 'Cabinet Serenity / CGP',
      }
    );
  } catch (error) {
    console.error('[PPTX Demo] ❌ Export failed:', error);
    throw error;
  }
}

/**
 * Export demo with custom theme (for testing theme integration)
 */
export async function exportSerenityDemoWithTheme(
  themeColors: typeof DEMO_THEME
): Promise<void> {
  try {
    await exportAndDownloadStudyDeck(
      DEMO_DECK,
      themeColors,
      'serenity-custom-theme-export.pptx'
    );
  } catch (error) {
    console.error('[PPTX Demo] ❌ Export failed:', error);
    throw error;
  }
}

// Make available on window for easy console testing
if (typeof window !== 'undefined') {
  (window as any).exportSerenityDemoPptx = exportSerenityDemoPptx;
  (window as any).exportSerenityDemoWithTheme = exportSerenityDemoWithTheme;
}

export default {
  exportSerenityDemoPptx,
  exportSerenityDemoWithTheme,
  DEMO_THEME,
  DEMO_DECK,
};
