import type PptxGenJS from 'pptxgenjs';

import type { DossierAudit } from '@/domain/audit/types';

import type { AuditDeckPalette } from './types';

export function addRecommendationsSlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
): void {
  const slideG = pptx.addSlide();
  slideG.addText('g) Pistes de réflexion', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const pistes: string[] = [];

  dossier.objectifs.forEach((obj) => {
    switch (obj) {
      case 'proteger_conjoint':
        pistes.push("• Vérifier les clauses bénéficiaires des contrats d'assurance-vie");
        pistes.push("• Étudier l'opportunité d'une donation au dernier vivant");
        break;
      case 'reduire_fiscalite':
        pistes.push("• Optimiser l'épargne retraite (PER) pour réduire l'IR");
        pistes.push('• Étudier les dispositifs de défiscalisation immobilière');
        break;
      case 'preparer_transmission':
        pistes.push('• Mettre en place des donations graduées');
        pistes.push('• Structurer le patrimoine pour optimiser la transmission');
        break;
      case 'developper_patrimoine':
        pistes.push('• Diversifier les placements financiers');
        pistes.push("• Étudier les opportunités d'investissement immobilier");
        break;
      case 'revenus_differes':
        pistes.push('• Préparer la retraite avec un PER');
        pistes.push('• Constituer une épargne en assurance-vie');
        break;
    }
  });

  if (pistes.length === 0) {
    pistes.push('• Définir les objectifs patrimoniaux du client');
    pistes.push('• Réaliser un bilan complet avant toute préconisation');
  }

  slideG.addText(pistes.slice(0, 8).join('\n'), {
    x: 0.5,
    y: 1,
    w: 9,
    h: 3.5,
    fontSize: 14,
    color: palette.c10,
    fontFace: 'Arial',
    valign: 'top',
  });

  slideG.addText(
    'Ces pistes sont données à titre indicatif et ne constituent pas un conseil personnalisé.',
    {
      x: 0.5,
      y: 4.8,
      w: 9,
      h: 0.3,
      fontSize: 10,
      color: palette.c9,
      fontFace: 'Arial',
      italic: true,
    },
  );
}
