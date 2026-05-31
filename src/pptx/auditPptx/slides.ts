import type PptxGenJS from 'pptxgenjs';

import type { DossierAudit } from '@/domain/audit/types';
import { calculatePredecesSenarios } from '@/engine/succession';
import { REGIMES_MATRIMONIAUX } from '@/engine/succession/civil';

import { toTableRows } from './tables';
import type { AuditDeckPalette } from './types';

export function addAuditTitleSlide(
  pptx: PptxGenJS,
  clientName: string,
  palette: AuditDeckPalette,
  logoBase64?: string,
): void {
  const slideTitre = pptx.addSlide();
  slideTitre.background = { color: palette.c1 };

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
    color: palette.c4,
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
}

export function addFamilySlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
): void {
  const slideA = pptx.addSlide();
  slideA.addText('a) Situation familiale', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const famInfo = [];
  famInfo.push(['Situation', dossier.situationFamiliale.situationMatrimoniale]);
  famInfo.push([
    'Monsieur',
    `${dossier.situationFamiliale.mr.prenom} ${dossier.situationFamiliale.mr.nom}`,
  ]);
  if (dossier.situationFamiliale.mme) {
    famInfo.push([
      'Madame',
      `${dossier.situationFamiliale.mme.prenom} ${dossier.situationFamiliale.mme.nom}`,
    ]);
  }
  famInfo.push(['Enfants', `${dossier.situationFamiliale.enfants.length}`]);

  slideA.addTable(toTableRows(famInfo), {
    x: 0.5,
    y: 1,
    w: 9,
    h: 2,
    fontSize: 14,
    color: palette.c10,
    fill: { color: palette.c7 },
    border: { type: 'solid', color: palette.c4, pt: 1 },
  });
}

export function addCivilSlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
): void {
  const slideB = pptx.addSlide();
  slideB.addText('b) Situation civile - Régime matrimonial', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const regime = dossier.situationCivile.regimeMatrimonial
    ? REGIMES_MATRIMONIAUX[dossier.situationCivile.regimeMatrimonial]
    : null;

  if (regime) {
    slideB.addText(regime.label, {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.4,
      fontSize: 18,
      color: palette.c2,
      bold: true,
      fontFace: 'Arial',
    });

    slideB.addText(regime.description, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 0.6,
      fontSize: 12,
      color: palette.c10,
      fontFace: 'Arial',
    });

    slideB.addText('Avantages :', {
      x: 0.5,
      y: 2.2,
      w: 4,
      h: 0.3,
      fontSize: 14,
      color: palette.c1,
      bold: true,
      fontFace: 'Arial',
    });
    slideB.addText(regime.avantages.map((a) => `• ${a}`).join('\n'), {
      x: 0.5,
      y: 2.5,
      w: 4,
      h: 1.5,
      fontSize: 11,
      color: palette.c10,
      fontFace: 'Arial',
    });

    slideB.addText('Limites :', {
      x: 5,
      y: 2.2,
      w: 4.5,
      h: 0.3,
      fontSize: 14,
      color: palette.c1,
      bold: true,
      fontFace: 'Arial',
    });
    slideB.addText(regime.limites.map((l) => `• ${l}`).join('\n'), {
      x: 5,
      y: 2.5,
      w: 4.5,
      h: 1.5,
      fontSize: 11,
      color: palette.c10,
      fontFace: 'Arial',
    });
  } else {
    slideB.addText('Régime matrimonial non renseigné', {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: palette.c10,
      fontFace: 'Arial',
    });
  }

  slideB.addText('Abattements transmission enfants : selon les paramètres fiscaux en vigueur', {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: palette.c10,
    fontFace: 'Arial',
  });
}

export function addAssetsSlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
): number {
  const slideC = pptx.addSlide();
  slideC.addText('c) Actifs', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const actifsRows: string[][] = [['Libellé', 'Valeur', 'Propriétaire']];
  let totalActifs = 0;
  dossier.actifs.forEach((actif) => {
    actifsRows.push([
      actif.libelle || 'Actif',
      `${actif.valeur.toLocaleString('fr-FR')} €`,
      actif.proprietaire === 'mr'
        ? 'Monsieur'
        : actif.proprietaire === 'mme'
          ? 'Madame'
          : actif.proprietaire === 'commun'
            ? 'Communauté'
            : 'Indivision',
    ]);
    totalActifs += actif.valeur;
  });
  actifsRows.push(['TOTAL', `${totalActifs.toLocaleString('fr-FR')} €`, '']);

  slideC.addTable(toTableRows(actifsRows), {
    x: 0.5,
    y: 1,
    w: 9,
    fontSize: 12,
    color: palette.c10,
    fill: { color: palette.c7 },
    border: { type: 'solid', color: palette.c4, pt: 1 },
    colW: [4, 2.5, 2.5],
  });

  return totalActifs;
}

export function addPassifSlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
  totalActifs: number,
): void {
  const slideD = pptx.addSlide();
  slideD.addText('d) Passif', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const passifRows: string[][] = [['Emprunt', 'CRD', 'Mensualité', 'Fin']];
  let totalPassif = 0;
  dossier.passif.emprunts.forEach((emprunt) => {
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
    x: 0.5,
    y: 1,
    w: 9,
    fontSize: 12,
    color: palette.c10,
    fill: { color: palette.c7 },
    border: { type: 'solid', color: palette.c4, pt: 1 },
    colW: [3.5, 2, 2, 1.5],
  });

  slideD.addText(`Patrimoine net : ${(totalActifs - totalPassif).toLocaleString('fr-FR')} €`, {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });
}

export function addFiscalSlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
): void {
  const slideE = pptx.addSlide();
  slideE.addText('e) Fiscalité', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const fiscRows: string[][] = [
    [
      'Revenu fiscal de référence',
      `${dossier.situationFiscale.revenuFiscalReference.toLocaleString('fr-FR')} €`,
    ],
    ['Nombre de parts', `${dossier.situationFiscale.nombreParts}`],
    ['Impôt sur le revenu', `${dossier.situationFiscale.impotRevenu.toLocaleString('fr-FR')} €`],
    ['TMI', `${dossier.situationFiscale.tmi} %`],
  ];

  if (dossier.situationFiscale.ifi) {
    fiscRows.push(['IFI', `${dossier.situationFiscale.ifi.toLocaleString('fr-FR')} €`]);
  }

  slideE.addTable(toTableRows(fiscRows), {
    x: 0.5,
    y: 1,
    w: 6,
    fontSize: 14,
    color: palette.c10,
    fill: { color: palette.c7 },
    border: { type: 'solid', color: palette.c4, pt: 1 },
    colW: [3.5, 2.5],
  });
}

export function addSuccessionSlide(
  pptx: PptxGenJS,
  dossier: DossierAudit,
  palette: AuditDeckPalette,
): void {
  const slideF = pptx.addSlide();
  slideF.addText('f) Succession - Scénarios prédécès', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: palette.c1,
    bold: true,
    fontFace: 'Arial',
  });

  const isMarie = dossier.situationFamiliale.situationMatrimoniale === 'marie';
  const regime2 = dossier.situationCivile.regimeMatrimonial || 'communaute_legale';
  const actifsMr = dossier.actifs
    .filter((a) => a.proprietaire === 'mr')
    .reduce((s, a) => s + a.valeur, 0);
  const actifsMme = dossier.actifs
    .filter((a) => a.proprietaire === 'mme')
    .reduce((s, a) => s + a.valeur, 0);
  const actifsCommun = dossier.actifs
    .filter((a) => a.proprietaire === 'commun')
    .reduce((s, a) => s + a.valeur, 0);

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
      [
        'Si Monsieur décède',
        `${scenariosResult.result.scenarioMrDecede.actifTransmis.toLocaleString('fr-FR')} €`,
        `${scenariosResult.result.scenarioMrDecede.droitsSuccession.toLocaleString('fr-FR')} €`,
      ],
      [
        'Si Madame décède',
        `${scenariosResult.result.scenarioMmeDecede.actifTransmis.toLocaleString('fr-FR')} €`,
        `${scenariosResult.result.scenarioMmeDecede.droitsSuccession.toLocaleString('fr-FR')} €`,
      ],
    ];

    slideF.addTable(toTableRows(succRows), {
      x: 0.5,
      y: 1,
      w: 9,
      fontSize: 14,
      color: palette.c10,
      fill: { color: palette.c7 },
      border: { type: 'solid', color: palette.c4, pt: 1 },
      colW: [3, 3, 3],
    });

    if (scenariosResult.warnings.length > 0) {
      slideF.addText(scenariosResult.warnings.map((w) => `⚠️ ${w.message}`).join('\n'), {
        x: 0.5,
        y: 3,
        w: 9,
        h: 0.8,
        fontSize: 10,
        color: '996600',
        fontFace: 'Arial',
      });
    }
  } else {
    slideF.addText('Données insuffisantes pour calculer les scénarios de prédécès.', {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: palette.c10,
      fontFace: 'Arial',
    });
  }
}
