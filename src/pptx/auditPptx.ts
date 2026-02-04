/**
 * Génération PPTX Audit Patrimonial
 * 
 * Structure obligatoire :
 * 1. Slide titre (fond c1 + nom/prénom + logo)
 * a. Schéma situation familiale
 * b. CIVIL : régimes matrimoniaux
 * c. Actifs : tableau
 * d. Passif : tableau emprunts
 * e. Fiscalité : revenus, TMI, CEHR, IFI
 * f. Succession : coût prédécès
 * g. Pistes de réflexion
 */

import PptxGenJS from 'pptxgenjs';
import type { ThemeColors } from '../settings/ThemeProvider';
import { DEFAULT_COLORS } from '../settings/ThemeProvider';
import type { DossierAudit } from '../features/audit/types';
import { REGIMES_MATRIMONIAUX } from '../engine/civil';
import { calculatePredecesSenarios } from '../engine/succession';

// Type pour les lignes de tableau (compatible PptxGenJS)
type TableData = Array<Array<{ text: string }>>;

// Helper pour convertir string[][] en format PptxGenJS
function toTableRows(data: string[][]): TableData {
  return data.map(row => row.map(cell => ({ text: cell })));
}

interface AuditPptxOptions {
  dossier: DossierAudit;
  colors?: ThemeColors;
  logoBase64?: string;
}

/**
 * Génère le PPTX d'audit complet
 */
export async function generateAuditPptx(options: AuditPptxOptions): Promise<void> {
  const { dossier, colors = DEFAULT_COLORS, logoBase64 } = options;
  
  const pptx = new PptxGenJS();
  pptx.title = 'Audit Patrimonial';
  pptx.author = 'SER1 - Cabinet CGP';
  pptx.company = 'Cabinet CGP';

  const c1 = colors.c1.replace('#', '');
  const c2 = colors.c2.replace('#', '');
  const c4 = colors.c4.replace('#', '');
  const c7 = colors.c7.replace('#', '');
  const c9 = colors.c9.replace('#', '');
  const c10 = colors.c10.replace('#', '');

  // Nom client
  const clientName = `${dossier.situationFamiliale.mr.prenom} ${dossier.situationFamiliale.mr.nom}`.trim() || 'Client';

  // ========== SLIDE 1 : TITRE ==========
  const slideTitre = pptx.addSlide();
  slideTitre.background = { color: c1 };
  
  slideTitre.addText(clientName, {
    x: '10%',
    y: '40%',
    w: '80%',
    h: '15%',
    fontSize: 40,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial',
    bold: true,
  });

  slideTitre.addText('Audit Patrimonial', {
    x: '10%',
    y: '55%',
    w: '80%',
    h: '10%',
    fontSize: 24,
    color: c4,
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial',
  });

  if (logoBase64) {
    slideTitre.addImage({
      data: logoBase64,
      x: '40%',
      y: '70%',
      w: '20%',
      h: '15%',
    });
  }

  // ========== SLIDE A : SITUATION FAMILIALE ==========
  const slideA = pptx.addSlide();
  slideA.addText('a) Situation familiale', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const famInfo = [];
  famInfo.push(['Situation', dossier.situationFamiliale.situationMatrimoniale]);
  famInfo.push(['Monsieur', `${dossier.situationFamiliale.mr.prenom} ${dossier.situationFamiliale.mr.nom}`]);
  if (dossier.situationFamiliale.mme) {
    famInfo.push(['Madame', `${dossier.situationFamiliale.mme.prenom} ${dossier.situationFamiliale.mme.nom}`]);
  }
  famInfo.push(['Enfants', `${dossier.situationFamiliale.enfants.length}`]);

  slideA.addTable(toTableRows(famInfo), {
    x: 0.5, y: 1, w: 9, h: 2,
    fontSize: 14,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
  });

  // ========== SLIDE B : SITUATION CIVILE ==========
  const slideB = pptx.addSlide();
  slideB.addText('b) Situation civile - Régime matrimonial', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const regime = dossier.situationCivile.regimeMatrimonial 
    ? REGIMES_MATRIMONIAUX[dossier.situationCivile.regimeMatrimonial]
    : null;

  if (regime) {
    slideB.addText(regime.label, {
      x: 0.5, y: 1, w: 9, h: 0.4,
      fontSize: 18, color: c2, bold: true, fontFace: 'Arial',
    });

    slideB.addText(regime.description, {
      x: 0.5, y: 1.5, w: 9, h: 0.6,
      fontSize: 12, color: c10, fontFace: 'Arial',
    });

    slideB.addText('Avantages :', {
      x: 0.5, y: 2.2, w: 4, h: 0.3,
      fontSize: 14, color: c1, bold: true, fontFace: 'Arial',
    });
    slideB.addText(regime.avantages.map(a => `• ${a}`).join('\n'), {
      x: 0.5, y: 2.5, w: 4, h: 1.5,
      fontSize: 11, color: c10, fontFace: 'Arial',
    });

    slideB.addText('Limites :', {
      x: 5, y: 2.2, w: 4.5, h: 0.3,
      fontSize: 14, color: c1, bold: true, fontFace: 'Arial',
    });
    slideB.addText(regime.limites.map(l => `• ${l}`).join('\n'), {
      x: 5, y: 2.5, w: 4.5, h: 1.5,
      fontSize: 11, color: c10, fontFace: 'Arial',
    });
  } else {
    slideB.addText('Régime matrimonial non renseigné', {
      x: 0.5, y: 1, w: 9, h: 0.5,
      fontSize: 14, color: c10, fontFace: 'Arial',
    });
  }

  // Abattements transmission
  slideB.addText('Abattements transmission enfants : 100 000 € par enfant', {
    x: 0.5, y: 4.2, w: 9, h: 0.3,
    fontSize: 12, color: c10, fontFace: 'Arial',
  });

  // ========== SLIDE C : ACTIFS ==========
  const slideC = pptx.addSlide();
  slideC.addText('c) Actifs', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const actifsRows: string[][] = [['Libellé', 'Valeur', 'Propriétaire']];
  let totalActifs = 0;
  dossier.actifs.forEach(actif => {
    actifsRows.push([
      actif.libelle || 'Actif',
      `${actif.valeur.toLocaleString('fr-FR')} €`,
      actif.proprietaire === 'mr' ? 'Monsieur' 
        : actif.proprietaire === 'mme' ? 'Madame' 
        : actif.proprietaire === 'commun' ? 'Communauté' 
        : 'Indivision',
    ]);
    totalActifs += actif.valeur;
  });
  actifsRows.push(['TOTAL', `${totalActifs.toLocaleString('fr-FR')} €`, '']);

  slideC.addTable(toTableRows(actifsRows), {
    x: 0.5, y: 1, w: 9,
    fontSize: 12,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [4, 2.5, 2.5],
  });

  // ========== SLIDE D : PASSIF ==========
  const slideD = pptx.addSlide();
  slideD.addText('d) Passif', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const passifRows: string[][] = [['Emprunt', 'CRD', 'Mensualité', 'Fin']];
  let totalPassif = 0;
  dossier.passif.emprunts.forEach(emprunt => {
    passifRows.push([
      emprunt.libelle || 'Emprunt',
      `${emprunt.capitalRestantDu.toLocaleString('fr-FR')} €`,
      `${emprunt.mensualite.toLocaleString('fr-FR')} €`,
      emprunt.dateFin || '-',
    ]);
    totalPassif += emprunt.capitalRestantDu;
  });
  passifRows.push(['TOTAL CRD', `${totalPassif.toLocaleString('fr-FR')} €`, '', '']);

  slideD.addTable(toTableRows(passifRows), {
    x: 0.5, y: 1, w: 9,
    fontSize: 12,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [3.5, 2, 2, 1.5],
  });

  // Patrimoine net
  slideD.addText(`Patrimoine net : ${(totalActifs - totalPassif).toLocaleString('fr-FR')} €`, {
    x: 0.5, y: 4, w: 9, h: 0.4,
    fontSize: 16, color: c1, bold: true, fontFace: 'Arial',
  });

  // ========== SLIDE E : FISCALITÉ ==========
  const slideE = pptx.addSlide();
  slideE.addText('e) Fiscalité', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const fiscRows: string[][] = [
    ['Revenu fiscal de référence', `${dossier.situationFiscale.revenuFiscalReference.toLocaleString('fr-FR')} €`],
    ['Nombre de parts', `${dossier.situationFiscale.nombreParts}`],
    ['Impôt sur le revenu', `${dossier.situationFiscale.impotRevenu.toLocaleString('fr-FR')} €`],
    ['TMI', `${dossier.situationFiscale.tmi} %`],
  ];

  if (dossier.situationFiscale.ifi) {
    fiscRows.push(['IFI', `${dossier.situationFiscale.ifi.toLocaleString('fr-FR')} €`]);
  }

  slideE.addTable(toTableRows(fiscRows), {
    x: 0.5, y: 1, w: 6,
    fontSize: 14,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [3.5, 2.5],
  });

  // ========== SLIDE F : SUCCESSION ==========
  const slideF = pptx.addSlide();
  slideF.addText('f) Succession - Scénarios prédécès', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  // Calcul des scénarios si données suffisantes
  const isMarie = dossier.situationFamiliale.situationMatrimoniale === 'marie';
  const regime2 = dossier.situationCivile.regimeMatrimonial || 'communaute_legale';
  
  // Répartition simplifiée des actifs
  const actifsMr = dossier.actifs.filter(a => a.proprietaire === 'mr').reduce((s, a) => s + a.valeur, 0);
  const actifsMme = dossier.actifs.filter(a => a.proprietaire === 'mme').reduce((s, a) => s + a.valeur, 0);
  const actifsCommun = dossier.actifs.filter(a => a.proprietaire === 'commun').reduce((s, a) => s + a.valeur, 0);

  if (isMarie && dossier.situationFamiliale.enfants.length > 0) {
    const scenariosResult = calculatePredecesSenarios({
      actifMr: actifsMr,
      actifMme: actifsMme,
      actifCommun: actifsCommun,
      nbEnfants: dossier.situationFamiliale.enfants.length,
      regime: regime2 as 'communaute_legale' | 'separation_biens' | 'communaute_universelle',
    });

    const succRows: string[][] = [
      ['Scénario', 'Actif transmis', 'Droits estimés'],
      ['Si Monsieur décède', 
        `${scenariosResult.result.scenarioMrDecede.actifTransmis.toLocaleString('fr-FR')} €`,
        `${scenariosResult.result.scenarioMrDecede.droitsSuccession.toLocaleString('fr-FR')} €`],
      ['Si Madame décède', 
        `${scenariosResult.result.scenarioMmeDecede.actifTransmis.toLocaleString('fr-FR')} €`,
        `${scenariosResult.result.scenarioMmeDecede.droitsSuccession.toLocaleString('fr-FR')} €`],
    ];

    slideF.addTable(toTableRows(succRows), {
      x: 0.5, y: 1, w: 9,
      fontSize: 14,
      color: c10,
      fill: { color: c7 },
      border: { type: 'solid', color: c4, pt: 1 },
      colW: [3, 3, 3],
    });

    if (scenariosResult.warnings.length > 0) {
      slideF.addText(scenariosResult.warnings.map(w => `⚠️ ${w.message}`).join('\n'), {
        x: 0.5, y: 3, w: 9, h: 0.8,
        fontSize: 10, color: '996600', fontFace: 'Arial',
      });
    }
  } else {
    slideF.addText('Données insuffisantes pour calculer les scénarios de prédécès.', {
      x: 0.5, y: 1, w: 9, h: 0.5,
      fontSize: 14, color: c10, fontFace: 'Arial',
    });
  }

  // ========== SLIDE G : PISTES DE RÉFLEXION ==========
  const slideG = pptx.addSlide();
  slideG.addText('g) Pistes de réflexion', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  // Génération de pistes basées sur les objectifs
  const pistes: string[] = [];
  
  dossier.objectifs.forEach(obj => {
    switch (obj) {
      case 'proteger_conjoint':
        pistes.push('• Vérifier les clauses bénéficiaires des contrats d\'assurance-vie');
        pistes.push('• Étudier l\'opportunité d\'une donation au dernier vivant');
        break;
      case 'reduire_fiscalite':
        pistes.push('• Optimiser l\'épargne retraite (PER) pour réduire l\'IR');
        pistes.push('• Étudier les dispositifs de défiscalisation immobilière');
        break;
      case 'preparer_transmission':
        pistes.push('• Mettre en place des donations graduées');
        pistes.push('• Structurer le patrimoine pour optimiser la transmission');
        break;
      case 'developper_patrimoine':
        pistes.push('• Diversifier les placements financiers');
        pistes.push('• Étudier les opportunités d\'investissement immobilier');
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
    x: 0.5, y: 1, w: 9, h: 3.5,
    fontSize: 14, color: c10, fontFace: 'Arial',
    valign: 'top',
  });

  slideG.addText('Ces pistes sont données à titre indicatif et ne constituent pas un conseil personnalisé.', {
    x: 0.5, y: 4.8, w: 9, h: 0.3,
    fontSize: 10, color: c9, fontFace: 'Arial', italic: true,
  });

  // Téléchargement
  const filename = `Audit_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
