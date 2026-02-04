/**
 * Génération PPTX Stratégie Patrimoniale
 * 
 * Structure :
 * 1. Slide titre
 * 2. Projection situation actuelle (baseline)
 * 3. Projection stratégie CGP
 * 4. Comparaison visuelle
 * 5. Conclusion : objectifs ↔ réponses
 * 6. Annexe : hypothèses & calculs
 */

import PptxGenJS from 'pptxgenjs';
import type { ThemeColors } from '../settings/theme';
import { DEFAULT_COLORS } from '../settings/theme';
import type { DossierAudit } from '../features/audit/types';
import { OBJECTIFS_CLIENT_LABELS } from '../features/audit/types';
import type { Strategie, ComparaisonScenarios } from '../features/strategy/types';

// Type pour les lignes de tableau
type TableData = Array<Array<{ text: string }>>;

function toTableRows(data: string[][]): TableData {
  return data.map(row => row.map(cell => ({ text: cell })));
}

interface StrategyPptxOptions {
  dossier: DossierAudit;
  strategie: Strategie;
  comparaison: ComparaisonScenarios;
  colors?: ThemeColors;
}

/**
 * Génère le PPTX de stratégie complet
 */
export async function generateStrategyPptx(options: StrategyPptxOptions): Promise<void> {
  const { dossier, strategie, comparaison, colors = DEFAULT_COLORS } = options;

  const pptx = new PptxGenJS();
  pptx.title = 'Stratégie Patrimoniale';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1.replace('#', '');
  const c2 = colors.c2.replace('#', '');
  const c4 = colors.c4.replace('#', '');
  const c7 = colors.c7.replace('#', '');
  const c9 = colors.c9.replace('#', '');
  const c10 = colors.c10.replace('#', '');

  const clientName = `${dossier.situationFamiliale.mr.prenom} ${dossier.situationFamiliale.mr.nom}`.trim() || 'Client';

  // ========== SLIDE 1 : TITRE ==========
  const slide1 = pptx.addSlide();
  slide1.background = { color: c1 };

  slide1.addText('Stratégie Patrimoniale', {
    x: '10%', y: '30%', w: '80%', h: '15%',
    fontSize: 40, color: 'FFFFFF', align: 'center', bold: true, fontFace: 'Arial',
  });

  slide1.addText(clientName, {
    x: '10%', y: '45%', w: '80%', h: '10%',
    fontSize: 28, color: c4, align: 'center', fontFace: 'Arial',
  });

  slide1.addText('Recommandations et projections', {
    x: '10%', y: '58%', w: '80%', h: '8%',
    fontSize: 18, color: c9, align: 'center', fontFace: 'Arial',
  });

  slide1.addText(new Date().toLocaleDateString('fr-FR'), {
    x: '10%', y: '70%', w: '80%', h: '6%',
    fontSize: 14, color: c9, align: 'center', fontFace: 'Arial',
  });

  // ========== SLIDE 2 : SITUATION ACTUELLE (BASELINE) ==========
  const slide2 = pptx.addSlide();
  slide2.addText('Projection : Situation actuelle', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  slide2.addText('Sans intervention du CGP', {
    x: 0.5, y: 0.8, w: 9, h: 0.3,
    fontSize: 14, color: c9, fontFace: 'Arial', italic: true,
  });

  const baselineRows: string[][] = [
    ['Année', 'Patrimoine', 'Actifs', 'IR annuel'],
  ];
  
  [0, 5, 10].forEach(annee => {
    const proj = comparaison.baseline.projections[annee];
    if (proj) {
      baselineRows.push([
        `Année ${annee}`,
        `${Math.round(proj.patrimoineTotal).toLocaleString('fr-FR')} €`,
        `${Math.round(proj.actifs).toLocaleString('fr-FR')} €`,
        `${Math.round(proj.impotRevenu).toLocaleString('fr-FR')} €`,
      ]);
    }
  });

  slide2.addTable(toTableRows(baselineRows), {
    x: 0.5, y: 1.3, w: 9,
    fontSize: 14,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [2, 2.5, 2.5, 2],
  });

  slide2.addText('Hypothèses :', {
    x: 0.5, y: 3.2, w: 9, h: 0.3,
    fontSize: 12, color: c1, bold: true, fontFace: 'Arial',
  });

  slide2.addText(comparaison.baseline.hypotheses.map(h => `• ${h}`).join('\n'), {
    x: 0.5, y: 3.5, w: 9, h: 1.5,
    fontSize: 11, color: c9, fontFace: 'Arial',
  });

  // ========== SLIDE 3 : PROJECTION STRATÉGIE ==========
  const slide3 = pptx.addSlide();
  slide3.addText('Projection : Stratégie CGP', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  slide3.addText('Avec mise en place des préconisations', {
    x: 0.5, y: 0.8, w: 9, h: 0.3,
    fontSize: 14, color: c2, fontFace: 'Arial', italic: true,
  });

  const strategieRows: string[][] = [
    ['Année', 'Patrimoine', 'Actifs', 'IR annuel'],
  ];

  [0, 5, 10].forEach(annee => {
    const proj = comparaison.strategie.projections[annee];
    if (proj) {
      strategieRows.push([
        `Année ${annee}`,
        `${Math.round(proj.patrimoineTotal).toLocaleString('fr-FR')} €`,
        `${Math.round(proj.actifs).toLocaleString('fr-FR')} €`,
        `${Math.round(proj.impotRevenu).toLocaleString('fr-FR')} €`,
      ]);
    }
  });

  slide3.addTable(toTableRows(strategieRows), {
    x: 0.5, y: 1.3, w: 9,
    fontSize: 14,
    color: c10,
    fill: { color: c4 },
    border: { type: 'solid', color: c2, pt: 1 },
    colW: [2, 2.5, 2.5, 2],
  });

  // Produits sélectionnés
  if (strategie.produitsSelectionnes.length > 0) {
    slide3.addText('Produits mis en place :', {
      x: 0.5, y: 3.2, w: 9, h: 0.3,
      fontSize: 12, color: c1, bold: true, fontFace: 'Arial',
    });

    const produitsText = strategie.produitsSelectionnes.map(p => {
      let details = `• ${p.libelle}`;
      if (p.versementsProgrammes) {
        details += ` - ${p.versementsProgrammes} €/mois`;
      }
      if (p.montantInitial) {
        details += ` - Apport initial: ${p.montantInitial.toLocaleString('fr-FR')} €`;
      }
      return details;
    }).join('\n');

    slide3.addText(produitsText, {
      x: 0.5, y: 3.5, w: 9, h: 1.5,
      fontSize: 11, color: c10, fontFace: 'Arial',
    });
  }

  // ========== SLIDE 4 : COMPARAISON ==========
  const slide4 = pptx.addSlide();
  slide4.addText('Comparaison des scénarios', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const fin = comparaison.baseline.projections.length - 1;
  const baselineFin = comparaison.baseline.projections[fin];
  const strategieFin = comparaison.strategie.projections[fin];

  const compRows: string[][] = [
    ['', 'Situation actuelle', 'Avec stratégie', 'Écart'],
    [
      'Patrimoine à 10 ans',
      `${Math.round(baselineFin.patrimoineTotal).toLocaleString('fr-FR')} €`,
      `${Math.round(strategieFin.patrimoineTotal).toLocaleString('fr-FR')} €`,
      `${comparaison.ecarts.patrimoineTotal > 0 ? '+' : ''}${Math.round(comparaison.ecarts.patrimoineTotal).toLocaleString('fr-FR')} €`,
    ],
    [
      'IR cumulé (10 ans)',
      `${Math.round(comparaison.baseline.projections.reduce((s, p) => s + p.impotRevenu, 0)).toLocaleString('fr-FR')} €`,
      `${Math.round(comparaison.strategie.projections.reduce((s, p) => s + p.impotRevenu, 0)).toLocaleString('fr-FR')} €`,
      `${comparaison.ecarts.economieImpots > 0 ? '+' : ''}${Math.round(comparaison.ecarts.economieImpots).toLocaleString('fr-FR')} €`,
    ],
  ];

  slide4.addTable(toTableRows(compRows), {
    x: 0.5, y: 1, w: 9,
    fontSize: 14,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [2.5, 2.2, 2.2, 2.1],
  });

  // Résumé gains
  slide4.addText('Gains de la stratégie sur 10 ans', {
    x: 0.5, y: 3, w: 9, h: 0.4,
    fontSize: 18, color: c1, bold: true, fontFace: 'Arial',
  });

  const gainsText = [];
  if (comparaison.ecarts.patrimoineTotal > 0) {
    gainsText.push(`✓ Patrimoine supérieur de ${Math.round(comparaison.ecarts.patrimoineTotal).toLocaleString('fr-FR')} €`);
  }
  if (comparaison.ecarts.economieImpots > 0) {
    gainsText.push(`✓ Économie d'impôts de ${Math.round(comparaison.ecarts.economieImpots).toLocaleString('fr-FR')} €`);
  }

  slide4.addText(gainsText.join('\n') || 'Stratégie à affiner selon les paramètres', {
    x: 0.5, y: 3.5, w: 9, h: 1,
    fontSize: 14, color: c2, fontFace: 'Arial',
  });

  // ========== SLIDE 5 : CONCLUSION OBJECTIFS ==========
  const slide5 = pptx.addSlide();
  slide5.addText('Réponse aux objectifs', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  // Tableau objectifs ↔ réponses
  const objectifsRows: string[][] = [['Objectif client', 'Réponse apportée']];

  dossier.objectifs.forEach(obj => {
    const label = OBJECTIFS_CLIENT_LABELS[obj];
    let reponse = 'À définir';

    // Mapping objectifs → réponses selon les produits
    const produits = strategie.produitsSelectionnes.map(p => p.type);
    
    if (obj === 'reduire_fiscalite' && produits.includes('per')) {
      reponse = 'PER pour déduction fiscale';
    } else if (obj === 'proteger_conjoint' && produits.includes('assurance_vie')) {
      reponse = 'Assurance-vie avec clause bénéficiaire';
    } else if (obj === 'preparer_transmission' && (produits.includes('donation') || produits.includes('assurance_vie'))) {
      reponse = 'Donations anticipées et/ou AV';
    } else if (obj === 'developper_patrimoine' && (produits.includes('pea') || produits.includes('scpi'))) {
      reponse = 'Diversification PEA/SCPI';
    } else if (obj === 'revenus_differes' && produits.includes('per')) {
      reponse = 'Épargne retraite PER';
    } else if (obj === 'revenus_immediats' && (produits.includes('scpi') || produits.includes('immobilier_locatif'))) {
      reponse = 'Investissement immobilier/SCPI';
    } else if (strategie.produitsSelectionnes.length > 0) {
      reponse = 'Contribution indirecte via la stratégie globale';
    }

    objectifsRows.push([label, reponse]);
  });

  if (objectifsRows.length > 1) {
    slide5.addTable(toTableRows(objectifsRows), {
      x: 0.5, y: 1, w: 9,
      fontSize: 13,
      color: c10,
      fill: { color: c7 },
      border: { type: 'solid', color: c4, pt: 1 },
      colW: [5, 4],
    });
  } else {
    slide5.addText('Aucun objectif défini dans l\'audit.', {
      x: 0.5, y: 1, w: 9, h: 0.5,
      fontSize: 14, color: c9, fontFace: 'Arial', italic: true,
    });
  }

  // ========== SLIDE 6 : ANNEXE HYPOTHÈSES ==========
  const slide6 = pptx.addSlide();
  slide6.addText('Annexe : Hypothèses et calculs', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  slide6.addText('Hypothèses de projection', {
    x: 0.5, y: 0.9, w: 9, h: 0.3,
    fontSize: 14, color: c1, bold: true, fontFace: 'Arial',
  });

  const allHypotheses = [
    ...comparaison.baseline.hypotheses.map(h => `[Baseline] ${h}`),
    ...comparaison.strategie.hypotheses.map(h => `[Stratégie] ${h}`),
  ];

  slide6.addText(allHypotheses.map(h => `• ${h}`).join('\n'), {
    x: 0.5, y: 1.2, w: 9, h: 2.5,
    fontSize: 10, color: c10, fontFace: 'Arial',
  });

  slide6.addText('Avertissement', {
    x: 0.5, y: 4, w: 9, h: 0.3,
    fontSize: 12, color: c1, bold: true, fontFace: 'Arial',
  });

  slide6.addText(
    'Les projections présentées sont des estimations basées sur des hypothèses qui peuvent ne pas se réaliser. ' +
    'Les performances passées ne préjugent pas des performances futures. ' +
    'Ce document ne constitue pas un conseil personnalisé et ne se substitue pas à l\'analyse approfondie d\'un conseiller.',
    {
      x: 0.5, y: 4.3, w: 9, h: 1,
      fontSize: 9, color: c9, fontFace: 'Arial', italic: true,
    }
  );

  // Téléchargement
  const filename = `Strategie_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
