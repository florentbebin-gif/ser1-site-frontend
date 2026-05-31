import type { XlsxCell, XlsxSheet } from '@/utils/export/xlsxBuilder';
import {
  getSuccessionInterMassClaimKindLabel,
  getSuccessionPocketLabel,
} from '../successionInterMassClaims';
import type {
  SuccessionChronologieBeneficiary,
  SuccessionChronologieXlsxData,
} from './successionXlsx';
import { formatMoney, h, money, sec } from './successionXlsxCells';

function orderLabel(order: 'epoux1' | 'epoux2'): string {
  return order === 'epoux1' ? 'Époux 1 décède en premier' : 'Époux 2 décède en premier';
}

function liquidationModeLabel(mode: 'quotes' | 'attribution_survivant'): string {
  return mode === 'attribution_survivant'
    ? 'Attribution prealable au survivant'
    : 'Quotes contractuelles';
}

function appendBeneficiaryRows(
  rows: Array<Array<XlsxCell | string | number>>,
  beneficiaries?: SuccessionChronologieBeneficiary[],
): void {
  if (!beneficiaries || beneficiaries.length === 0) return;

  rows.push([h('Bénéficiaire réel'), h('Part brute')]);
  beneficiaries.forEach((beneficiary) => {
    rows.push([
      beneficiary.exonerated
        ? `${beneficiary.label} (exonéré)`
        : `${beneficiary.label} - droits ${formatMoney(beneficiary.droits)}`,
      money(beneficiary.brut),
    ]);
  });
}

export function buildPredecesSheet(
  chronologie?: SuccessionChronologieXlsxData,
  sheetName = 'Chronologie',
): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [[h('Indicateur'), h('Valeur')]];

  if (!chronologie) {
    rows.push(['Module de chronologie', "Donnee non transmise a l'export"]);
    return { name: sheetName, rows, columnWidths: [42, 35] };
  }

  rows.push(['Ordre simulé', orderLabel(chronologie.order)]);
  rows.push([
    'Chronologie retenue comme source principale',
    chronologie.applicable ? 'Oui' : 'Non',
  ]);
  rows.push([]);

  if (chronologie.societeAcquets && chronologie.societeAcquets.totalValue > 0) {
    rows.push([sec("Societe d'acquets"), sec('')]);
    rows.push(['Valeur nette de la poche', money(chronologie.societeAcquets.totalValue)]);
    rows.push([
      'Part integree au 1er deces',
      money(chronologie.societeAcquets.firstEstateContribution),
    ]);
    rows.push(['Part conservee par le survivant', money(chronologie.societeAcquets.survivorShare)]);
    rows.push([
      'Mode de liquidation',
      liquidationModeLabel(chronologie.societeAcquets.liquidationMode),
    ]);
    rows.push([
      'Quotes retenues',
      `${Math.round(chronologie.societeAcquets.deceasedQuotePct)} % / ${Math.round(chronologie.societeAcquets.survivorQuotePct)} %`,
    ]);
    if (chronologie.societeAcquets.preciputAmount > 0) {
      rows.push(['Preciput preleve', money(chronologie.societeAcquets.preciputAmount)]);
    }
    if (chronologie.societeAcquets.survivorAttributionAmount > 0) {
      rows.push([
        'Attribution prealable au survivant',
        money(chronologie.societeAcquets.survivorAttributionAmount),
      ]);
    }
    if (chronologie.societeAcquets.attributionIntegrale) {
      rows.push(['Attribution integrale du reliquat', 'Oui']);
    }
    rows.push([]);
  }

  if (
    chronologie.preciput &&
    (chronologie.preciput.appliedAmount > 0 || chronologie.preciput.selections.length > 0)
  ) {
    rows.push([sec('Preciput'), sec('')]);
    rows.push(['Mode retenu', chronologie.preciput.mode === 'cible' ? 'Cible' : 'Global']);
    rows.push(['Montant preleve', money(chronologie.preciput.appliedAmount)]);
    if (chronologie.preciput.usesGlobalFallback) {
      rows.push(['Fallback global active', 'Oui']);
    }
    chronologie.preciput.selections.forEach((selection) => {
      rows.push([`Bien preleve - ${selection.label}`, money(selection.appliedAmount)]);
    });
    rows.push([]);
  }

  if (chronologie.participationAcquets) {
    rows.push([sec('Participation aux acquets'), sec('')]);
    rows.push(['Configuration active', chronologie.participationAcquets.active ? 'Oui' : 'Non']);
    if (chronologie.participationAcquets.active) {
      rows.push([
        'Patrimoine originaire Epoux 1 / Epoux 2',
        `${formatMoney(chronologie.participationAcquets.patrimoineOriginaireEpoux1)} / ${formatMoney(chronologie.participationAcquets.patrimoineOriginaireEpoux2)}`,
      ]);
      rows.push([
        'Patrimoine final Epoux 1 / Epoux 2',
        `${formatMoney(chronologie.participationAcquets.patrimoineFinalEpoux1)} / ${formatMoney(chronologie.participationAcquets.patrimoineFinalEpoux2)}`,
      ]);
      rows.push([
        'Acquets nets Epoux 1 / Epoux 2',
        `${formatMoney(chronologie.participationAcquets.acquetsEpoux1)} / ${formatMoney(chronologie.participationAcquets.acquetsEpoux2)}`,
      ]);
      rows.push([
        'Creance de participation',
        money(chronologie.participationAcquets.creanceAmount),
      ]);
      if (chronologie.participationAcquets.creditor && chronologie.participationAcquets.debtor) {
        rows.push([
          'Creancier / debiteur',
          `${chronologie.participationAcquets.creditor} / ${chronologie.participationAcquets.debtor}`,
        ]);
        rows.push([
          'Quote appliquee',
          `${Math.round(chronologie.participationAcquets.quoteAppliedPct)} %`,
        ]);
      }
    }
    rows.push([]);
  }

  if (chronologie.interMassClaims && chronologie.interMassClaims.totalAppliedAmount > 0) {
    rows.push([sec('Recompenses / creances entre masses'), sec('')]);
    rows.push(['Montant applique', money(chronologie.interMassClaims.totalAppliedAmount)]);
    chronologie.interMassClaims.claims
      .filter((claim) => claim.appliedAmount > 0)
      .forEach((claim) => {
        rows.push([
          `${claim.label ?? getSuccessionInterMassClaimKindLabel(claim.kind)} - ${getSuccessionPocketLabel(claim.fromPocket)} vers ${getSuccessionPocketLabel(claim.toPocket)}`,
          money(claim.appliedAmount),
        ]);
      });
    rows.push([]);
  }

  if (chronologie.affectedLiabilities && chronologie.affectedLiabilities.totalAmount > 0) {
    rows.push([sec('Passif affecte'), sec('')]);
    rows.push(['Total des passifs rattaches', money(chronologie.affectedLiabilities.totalAmount)]);
    chronologie.affectedLiabilities.byPocket.forEach((entry) => {
      rows.push([getSuccessionPocketLabel(entry.pocket), money(entry.amount)]);
    });
    rows.push([]);
  }

  if (chronologie.applicable && chronologie.step1 && chronologie.step2) {
    rows.push([sec(`Étape 1 - décès ${chronologie.firstDecedeLabel}`), sec('')]);
    rows.push([
      'Masse transmise totale',
      money(chronologie.step1.masseTotaleTransmise ?? chronologie.step1.actifTransmis),
    ]);
    if ((chronologie.step1.assuranceVieTransmise ?? 0) > 0) {
      rows.push(['Dont assurance-vie', money(chronologie.step1.assuranceVieTransmise ?? 0)]);
    }
    if ((chronologie.step1.perTransmis ?? 0) > 0) {
      rows.push(['Dont PER assurance', money(chronologie.step1.perTransmis ?? 0)]);
    }
    if ((chronologie.step1.prevoyanceTransmise ?? 0) > 0) {
      rows.push(['Dont prévoyance décès', money(chronologie.step1.prevoyanceTransmise ?? 0)]);
    }
    if ((chronologie.step1.droitsAssuranceVie ?? 0) > 0) {
      rows.push(['Droits assurance-vie', money(chronologie.step1.droitsAssuranceVie ?? 0)]);
    }
    if ((chronologie.step1.droitsPer ?? 0) > 0) {
      rows.push(['Droits PER', money(chronologie.step1.droitsPer ?? 0)]);
    }
    if ((chronologie.step1.droitsPrevoyance ?? 0) > 0) {
      rows.push(['Droits prévoyance', money(chronologie.step1.droitsPrevoyance ?? 0)]);
    }
    rows.push(['Masse successorale civile', money(chronologie.step1.actifTransmis)]);
    rows.push(['Part conjoint / partenaire', money(chronologie.step1.partConjoint)]);
    rows.push(['Part autres bénéficiaires', money(chronologie.step1.partEnfants)]);
    rows.push(['Droits succession', money(chronologie.step1.droitsEnfants)]);
    appendBeneficiaryRows(rows, chronologie.step1.beneficiaries);
    rows.push([]);

    rows.push([sec(`Étape 2 - décès ${chronologie.secondDecedeLabel}`), sec('')]);
    rows.push([
      'Masse transmise totale',
      money(chronologie.step2.masseTotaleTransmise ?? chronologie.step2.actifTransmis),
    ]);
    if ((chronologie.step2.assuranceVieTransmise ?? 0) > 0) {
      rows.push(['Dont assurance-vie', money(chronologie.step2.assuranceVieTransmise ?? 0)]);
    }
    if ((chronologie.step2.perTransmis ?? 0) > 0) {
      rows.push(['Dont PER assurance', money(chronologie.step2.perTransmis ?? 0)]);
    }
    if ((chronologie.step2.prevoyanceTransmise ?? 0) > 0) {
      rows.push(['Dont prévoyance décès', money(chronologie.step2.prevoyanceTransmise ?? 0)]);
    }
    if ((chronologie.step2.droitsAssuranceVie ?? 0) > 0) {
      rows.push(['Droits assurance-vie', money(chronologie.step2.droitsAssuranceVie ?? 0)]);
    }
    if ((chronologie.step2.droitsPer ?? 0) > 0) {
      rows.push(['Droits PER', money(chronologie.step2.droitsPer ?? 0)]);
    }
    if ((chronologie.step2.droitsPrevoyance ?? 0) > 0) {
      rows.push(['Droits prévoyance', money(chronologie.step2.droitsPrevoyance ?? 0)]);
    }
    rows.push(['Masse successorale civile', money(chronologie.step2.actifTransmis)]);
    rows.push(['Part conjoint / partenaire', money(chronologie.step2.partConjoint)]);
    rows.push(['Part autres bénéficiaires', money(chronologie.step2.partEnfants)]);
    rows.push(['Droits succession', money(chronologie.step2.droitsEnfants)]);
    appendBeneficiaryRows(rows, chronologie.step2.beneficiaries);
    rows.push([]);

    rows.push(['Total cumulé des droits (2 décès)', money(chronologie.totalDroits)]);
    if (typeof chronologie.assuranceVieTotale === 'number' && chronologie.assuranceVieTotale > 0) {
      rows.push(['Capitaux assurance-vie saisis', money(chronologie.assuranceVieTotale)]);
    }
    if (typeof chronologie.perTotale === 'number' && chronologie.perTotale > 0) {
      rows.push(['Capitaux PER assurance saisis', money(chronologie.perTotale)]);
    }
    if (typeof chronologie.prevoyanceTotale === 'number' && chronologie.prevoyanceTotale > 0) {
      rows.push(['Capitaux prévoyance décès saisis', money(chronologie.prevoyanceTotale)]);
    }
  } else {
    rows.push([
      'Statut',
      'Chronologie 2 décès non retenue comme source principale pour la situation saisie',
    ]);
  }

  if (chronologie.warnings && chronologie.warnings.length > 0) {
    rows.push([]);
    rows.push([sec('Avertissements'), sec('')]);
    chronologie.warnings.forEach((warning) => {
      rows.push([warning, '']);
    });
  }

  return { name: sheetName, rows, columnWidths: [42, 35] };
}
