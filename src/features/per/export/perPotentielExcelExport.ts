import type { PerPotentielResult } from '../../../engine/per';
import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '../../../utils/export/xlsxBuilder';
import type { XlsxCell, XlsxSheet } from '../../../utils/export/xlsxBuilder';

export interface PerPotentielExcelState {
  mode: 'versement-n' | 'declaration-n1' | null;
  avisIrConnu: boolean;
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  mutualisationConjoints: boolean;
  versementEnvisage: number;
}

const h = (value: string): XlsxCell => ({ v: value, style: 'sHeader' });
const sec = (value: string): XlsxCell => ({ v: value, style: 'sSection' });
const txt = (value: string): XlsxCell => ({ v: value, style: 'sText' });
const ctr = (value: string | number): XlsxCell => ({ v: value, style: 'sCenter' });
const money = (value: number): XlsxCell => ({ v: Math.round(value), style: 'sMoney' });
const pct = (value: number): XlsxCell => ({ v: value, style: 'sPercent' });

function modeLabel(mode: PerPotentielExcelState['mode']): string {
  return mode === 'declaration-n1'
    ? 'Declaration 2042 N-1'
    : 'Controle du potentiel epargne retraite';
}

function yesNo(value: boolean): string {
  return value ? 'Oui' : 'Non';
}

function pushPlafondRows(
  rows: XlsxCell[][],
  label: string,
  plafond: PerPotentielResult['plafond163Q']['declarant1'],
): void {
  rows.push([sec(label), sec('')]);
  rows.push([txt('Plafond calcule annee N'), money(plafond.plafondCalculeN)]);
  rows.push([txt('Report N-1'), money(plafond.nonUtiliseN1)]);
  rows.push([txt('Report N-2'), money(plafond.nonUtiliseN2)]);
  rows.push([txt('Report N-3'), money(plafond.nonUtiliseN3)]);
  rows.push([txt('Total disponible'), money(plafond.totalDisponible)]);
  rows.push([txt('Cotisations deja versees'), money(plafond.cotisationsDejaVersees)]);
  rows.push([txt('Disponible restant'), money(plafond.disponibleRestant)]);
  rows.push([txt('Depassement'), txt(yesNo(plafond.depassement))]);
}

function pushMadelinRows(
  rows: XlsxCell[][],
  label: string,
  plafond: NonNullable<PerPotentielResult['plafondMadelin']>['declarant1'],
): void {
  rows.push([sec(label), sec('')]);
  rows.push([txt('Assiette Madelin'), money(plafond.assiette)]);
  rows.push([txt('Enveloppe 15%'), money(plafond.enveloppe15)]);
  rows.push([txt('Enveloppe 10%'), money(plafond.enveloppe10)]);
  rows.push([txt('Potentiel total'), money(plafond.potentielTotal)]);
  rows.push([txt('Cotisations versees'), money(plafond.cotisationsVersees)]);
  rows.push([txt('Disponible restant'), money(plafond.disponibleRestant)]);
  rows.push([txt('Depassement'), txt(yesNo(plafond.depassement))]);
}

function buildSyntheseSheet(
  state: PerPotentielExcelState,
  result: PerPotentielResult,
): XlsxSheet {
  const rows: XlsxCell[][] = [
    [h('Champ'), h('Valeur')],
    [sec('Parcours'), sec('')],
    [txt('Mode'), txt(modeLabel(state.mode))],
    [txt('Avis IR disponible'), txt(yesNo(state.avisIrConnu))],
    [txt('Situation familiale'), txt(state.situationFamiliale === 'marie' ? 'Marie / Pacse' : 'Celibataire / Veuf / Divorce')],
    [txt('Nombre de parts'), ctr(state.nombreParts)],
    [txt('Parent isole'), txt(yesNo(state.isole))],
    [txt('Mutualisation des plafonds'), txt(yesNo(state.mutualisationConjoints))],
    [sec('Situation fiscale estimee'), sec('')],
    [txt('Revenu imposable declarant 1'), money(result.situationFiscale.revenuImposableD1)],
  ];

  if (result.situationFiscale.revenuImposableD2 > 0) {
    rows.push([txt('Revenu imposable declarant 2'), money(result.situationFiscale.revenuImposableD2)]);
  }

  rows.push([txt('Revenu fiscal de reference estime'), money(result.situationFiscale.revenuFiscalRef)]);
  rows.push([txt('TMI'), pct(result.situationFiscale.tmi)]);
  rows.push([txt('IR estime'), money(result.situationFiscale.irEstime)]);
  rows.push([txt('Decote'), money(result.situationFiscale.decote)]);
  rows.push([txt('CEHR'), money(result.situationFiscale.cehr)]);
  rows.push([txt('Marge dans la TMI'), money(result.situationFiscale.montantDansLaTMI)]);

  pushPlafondRows(rows, 'Plafond 163 quatervicies - Declarant 1', result.plafond163Q.declarant1);
  if (result.plafond163Q.declarant2) {
    pushPlafondRows(rows, 'Plafond 163 quatervicies - Declarant 2', result.plafond163Q.declarant2);
  }

  if (result.plafondMadelin?.declarant1) {
    pushMadelinRows(rows, 'Plafond Madelin 154 bis - Declarant 1', result.plafondMadelin.declarant1);
  }
  if (result.plafondMadelin?.declarant2) {
    pushMadelinRows(rows, 'Plafond Madelin 154 bis - Declarant 2', result.plafondMadelin.declarant2);
  }

  if (result.simulation) {
    rows.push([sec('Simulation de versement'), sec('')]);
    rows.push([txt('Versement envisage'), money(result.simulation.versementEnvisage)]);
    rows.push([txt('Versement deductible'), money(result.simulation.versementDeductible)]);
    rows.push([txt('Economie IR annuelle'), money(result.simulation.economieIRAnnuelle)]);
    rows.push([txt('Cout net apres fiscalite'), money(result.simulation.coutNetApresFiscalite)]);
    rows.push([txt('Plafond restant apres versement'), money(result.simulation.plafondRestantApres)]);
  } else if (state.mode === 'versement-n' && state.versementEnvisage > 0) {
    rows.push([sec('Simulation de versement'), sec('')]);
    rows.push([txt('Versement envisage'), money(state.versementEnvisage)]);
    rows.push([txt('Simulation disponible'), txt('Non')]);
  }

  if (result.warnings.length > 0) {
    rows.push([sec('Alertes'), sec('')]);
    result.warnings.forEach((warning, index) => {
      rows.push([txt(`Alerte ${index + 1}`), txt(warning.message)]);
    });
  }

  return {
    name: 'Synthèse',
    rows,
    columnWidths: [42, 24],
  };
}

function buildDeclarationSheet(result: PerPotentielResult): XlsxSheet {
  const rows: XlsxCell[][] = [
    [h('Case'), h('Libelle'), h('Valeur')],
    [ctr('6NS'), txt('PER 163 quatervicies - Declarant 1'), money(result.declaration2042.case6NS)],
    [ctr('6RS'), txt('PERP et assimiles - Declarant 1'), money(result.declaration2042.case6RS)],
    [ctr('6QS'), txt('Art. 83 - Declarant 1'), money(result.declaration2042.case6QS)],
    [ctr('6OS'), txt('PER 154 bis - Declarant 1'), money(result.declaration2042.case6OS)],
  ];

  if (typeof result.declaration2042.case6NT === 'number') {
    rows.push([ctr('6NT'), txt('PER 163 quatervicies - Declarant 2'), money(result.declaration2042.case6NT)]);
  }
  if (typeof result.declaration2042.case6RT === 'number') {
    rows.push([ctr('6RT'), txt('PERP et assimiles - Declarant 2'), money(result.declaration2042.case6RT)]);
  }
  if (typeof result.declaration2042.case6QT === 'number') {
    rows.push([ctr('6QT'), txt('Art. 83 - Declarant 2'), money(result.declaration2042.case6QT)]);
  }
  if (typeof result.declaration2042.case6OT === 'number') {
    rows.push([ctr('6OT'), txt('PER 154 bis - Declarant 2'), money(result.declaration2042.case6OT)]);
  }

  rows.push([ctr('6QR'), txt('Mutualisation des plafonds'), txt(yesNo(result.declaration2042.case6QR))]);

  return {
    name: 'Cases 2042',
    rows,
    columnWidths: [12, 34, 18],
  };
}

function buildHypothesesSheet(state: PerPotentielExcelState): XlsxSheet {
  const rows: XlsxCell[][] = [
    [h('Hypothese'), h('Reference')],
    [txt('Historique PASS runtime lu via public.pass_history et administre dans Settings > Prelevements.'), txt('Chaine fiscale du repo')],
    [txt('DEFAULT_PASS_HISTORY dans settingsDefaults.ts ne sert que de fallback si Supabase ne repond pas.'), txt('Fallback documente')],
    [txt('Estimation IR deleguee au moteur IR du repo pour les parts, la decote, le quotient familial et la CEHR.'), txt('src/engine/ir/compute.ts')],
    [txt('Le parcours reprend la pedagogie du classeur 2025 tout en gardant le moteur fiscal du repo comme arbitre.'), txt('Parite workbook documentee')],
    [txt(`Mode exporte : ${modeLabel(state.mode)}.`), txt('Contexte de simulation')],
    [sec('Avertissement'), sec('')],
    [txt('Document etabli a titre indicatif pour un rendez-vous de conseil.'), txt('')],
    [txt('Les montants doivent etre confrontes aux justificatifs et a la declaration fiscale finale.'), txt('')],
  ];

  return {
    name: 'Hypothèses',
    rows,
    columnWidths: [54, 26],
  };
}

export async function buildPerPotentielXlsxBlob(
  state: PerPotentielExcelState,
  result: PerPotentielResult,
  headerFill?: string,
  sectionFill?: string,
): Promise<Blob> {
  const blob = await buildXlsxBlob({
    sheets: [
      buildSyntheseSheet(state, result),
      buildDeclarationSheet(result),
      buildHypothesesSheet(state),
    ],
    headerFill,
    sectionFill,
  });

  const isValid = await validateXlsxBlob(blob);
  if (!isValid) {
    throw new Error('XLSX invalide (signature PK manquante).');
  }

  return blob;
}

export async function exportPerPotentielExcel(
  state: PerPotentielExcelState,
  result: PerPotentielResult | null,
  headerFill?: string,
  sectionFill?: string,
): Promise<void> {
  if (!result) {
    alert('Les resultats ne sont pas disponibles.');
    return;
  }

  const blob = await buildPerPotentielXlsxBlob(state, result, headerFill, sectionFill);
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  downloadXlsx(blob, `simulation-per-potentiel-${dateStr}.xlsx`);
}
