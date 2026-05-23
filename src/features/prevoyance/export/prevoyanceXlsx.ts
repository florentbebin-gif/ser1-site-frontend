import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '@/utils/export/xlsxBuilder';
import type { XlsxCell, XlsxSheet } from '@/utils/export/xlsxBuilder';
import type { PrevoyanceExportData } from './prevoyanceExportData';

function h(text: string): XlsxCell {
  return { v: text, style: 'sHeader' };
}

function sec(text: string): XlsxCell {
  return { v: text, style: 'sSection' };
}

function money(value: number): XlsxCell {
  return { v: value, style: 'sMoney' };
}

function pct(value: number): XlsxCell {
  return { v: value / 100, style: 'sPercent' };
}

function text(value: string): XlsxCell {
  return { v: value, style: 'sText' };
}

function buildSituationSheet(data: PrevoyanceExportData): XlsxSheet {
  const s = data.situation;
  return {
    name: 'Situation',
    rows: [
      [h('Champ'), h('Valeur')],
      ['Parcours', text(s.kindLabel)],
      ['Régime obligatoire', text(s.regimeLabel)],
      ['Situation familiale', text(s.familyStatus)],
      ["Nombre d'enfants", s.childrenCount],
      ['Revenu imposable', money(s.revenuImposable)],
      ['Salaire brut annuel', money(s.salaireBrutAnnuel)],
      ['Salaire net imposable', money(s.salaireNetImposable)],
      ['Ancienneté', s.ancienneteYears],
      ['Revenu cible export', money(s.referenceAnnual)],
    ],
    columnWidths: [30, 28],
  };
}

function buildContractsSheet(data: PrevoyanceExportData): XlsxSheet {
  const rows: XlsxSheet['rows'] = [
    [
      h('Contrat'),
      h('Type'),
      h('Indemnisation'),
      h('Arrêt de travail'),
      h('Invalidité'),
      h('Capital décès'),
      h('Frais professionnels'),
    ],
  ];

  for (const contract of data.contracts) {
    rows.push([
      text(contract.name),
      text(contract.kind),
      text(contract.indemnisationLabel),
      text(contract.arretSummary),
      text(contract.invaliditeSummary),
      money(contract.decesCapital),
      text(contract.fraisProSummary),
    ]);
  }

  return { name: 'Contrats', rows, columnWidths: [22, 16, 20, 42, 42, 18, 34] };
}

function buildCoverageSheet(data: PrevoyanceExportData): XlsxSheet {
  const rows: XlsxSheet['rows'] = [
    [sec('Arrêt de travail'), sec(''), sec(''), sec('')],
    [h('Période'), h('Couverture totale'), h('Régime obligatoire'), h('Contrats')],
  ];

  for (const bar of data.coverage.arret) {
    const ro = bar.segments.find((segment) => segment.kind === 'ro')?.valuePct ?? 0;
    const contrat = bar.segments.find((segment) => segment.kind === 'contrat')?.valuePct ?? 0;
    rows.push([text(bar.label), pct(bar.totalPct), pct(ro), pct(contrat)]);
  }

  rows.push([]);
  rows.push([sec('Invalidité'), sec(''), sec(''), sec('')]);
  rows.push([h('Seuil'), h('Couverture totale'), h('Régime obligatoire'), h('Contrats')]);

  for (const bar of data.coverage.invalidite) {
    const ro = bar.segments.find((segment) => segment.kind === 'ro')?.valuePct ?? 0;
    const contrat = bar.segments.find((segment) => segment.kind === 'contrat')?.valuePct ?? 0;
    rows.push([text(bar.label), pct(bar.totalPct), pct(ro), pct(contrat)]);
  }

  rows.push([]);
  rows.push([sec('Décès'), sec(''), sec(''), sec('')]);
  rows.push(['Cible décès', money(data.coverage.decesTarget), '', '']);
  rows.push(['Capital décès couvert', money(data.coverage.decesCapital), '', '']);
  rows.push([]);
  rows.push([sec('Frais professionnels'), sec(''), sec(''), sec('')]);
  rows.push(['Frais estimés', money(data.coverage.fraisProEstimated), '', '']);
  rows.push(['Frais couverts', money(data.coverage.fraisProCovered), '', '']);

  return { name: 'Couverture', rows, columnWidths: [26, 20, 22, 18] };
}

function buildCotisationsSheet(data: PrevoyanceExportData): XlsxSheet {
  const rows: XlsxSheet['rows'] = [
    [h('Contrat'), h('Cotisation annuelle'), h('dont Madelin'), h('Détail')],
  ];
  for (const contract of data.contracts) {
    rows.push([
      text(contract.name),
      money(contract.cotisationAnnual),
      money(contract.cotisationDontMadelin),
      text(contract.cotisationSummary),
    ]);
  }
  return { name: 'Cotisations', rows, columnWidths: [24, 20, 18, 48] };
}

function buildHypothesesSheet(data: PrevoyanceExportData): XlsxSheet {
  return {
    name: 'Hypothèses',
    rows: [[h('Hypothèse')], ...data.assumptions.map((assumption) => [text(assumption)])],
    columnWidths: [90],
  };
}

export function buildPrevoyanceXlsxSheets(data: PrevoyanceExportData): XlsxSheet[] {
  return [
    buildSituationSheet(data),
    buildContractsSheet(data),
    buildCoverageSheet(data),
    buildCotisationsSheet(data),
    buildHypothesesSheet(data),
  ];
}

export async function buildPrevoyanceXlsxBlob(
  data: PrevoyanceExportData,
  headerFill: string,
  sectionFill: string,
): Promise<Blob> {
  return buildXlsxBlob({
    sheets: buildPrevoyanceXlsxSheets(data),
    headerFill,
    sectionFill,
  });
}

export async function exportPrevoyanceXlsx(
  data: PrevoyanceExportData,
  headerFill: string,
  sectionFill: string,
): Promise<void> {
  const blob = await buildPrevoyanceXlsxBlob(data, headerFill, sectionFill);
  if (!(await validateXlsxBlob(blob))) {
    throw new Error('Export Excel Prévoyance invalide.');
  }
  const dateStr = new Date().toISOString().split('T')[0] ?? 'date';
  downloadXlsx(blob, `simulation-prevoyance-${dateStr}.xlsx`);
}
