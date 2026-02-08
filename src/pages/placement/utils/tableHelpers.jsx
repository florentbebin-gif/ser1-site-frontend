/**
 * Placement Table Helpers — Colonnes, filtrage et renderers de tableau
 */

import React from 'react';
import { euro } from './formatters.js';
import { EPSILON } from './normalizers.js';

// ─── Constants ───────────────────────────────────────────────────────

export const structuralEpargneColumns = ['Âge', 'Capital début', 'Versement net', 'Gains année', 'Revenus nets appréhendés', 'Capital fin'];

export const columnResolvers = {
  'Âge': (row) => row.age,
  'Capital début': (row) => row.capitalDebut,
  'Versement net': (row) => row.versementNet,
  'Poche capi (fin)': (row) => row.capitalCapi,
  'Poche distrib (fin)': (row) => row.capitalDistrib,
  'Poche 0% / espèces': (row) => row.compteEspece0pct ?? row.compteEspece,
  'Gains année': (row) => row.gainsAnnee ?? (row.gains || 0) + (row.revaloDistrib || 0),
  'Revenus nets appréhendés': (row) => row.revenusNetsPercusAnnee ?? 0,
  'Revenus nets réinvestis': (row) => row.reinvestissement ?? row.reinvestissementDistribNetAnnee,
  'Capital décès dégressif': (row) => row.capitalDecesDegressif,
  'Capital fin': (row) => row.capitalFin,
};

export const baseEpargneColumns = [
  'Âge',
  'Capital début',
  'Versement net',
  'Poche capi (fin)',
  'Poche distrib (fin)',
  'Poche 0% / espèces',
  'Gains année',
  'Revenus nets appréhendés',
  'Revenus nets réinvestis',
  'Capital décès dégressif',
  'Capital fin',
];

// ─── Column filtering ────────────────────────────────────────────────

export function isColumnRelevant(rows, column) {
  if (structuralEpargneColumns.includes(column)) return true;
  const resolver = columnResolvers[column];
  if (!resolver) return false;
  return rows.some((row) => {
    const raw = resolver(row);
    if (raw === undefined || raw === null) return false;
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isNaN(value)) return !!raw;
    return Math.abs(value) > EPSILON;
  });
}

export function getRelevantColumnsEpargne(rows, baseColumns, showAllColumns) {
  if (showAllColumns || !rows || rows.length === 0) return baseColumns;
  return baseColumns.filter((col) => isColumnRelevant(rows, col));
}

export function buildColumns(produit) {
  const baseColumns = produit.envelope === 'SCPI'
    ? ['Âge', 'Capital', 'Loyers bruts', 'Fiscalité', 'Loyers nets', 'Capital fin']
    : ['CTO', 'PEA'].includes(produit.envelope)
      ? ['Âge', 'Capital', 'Cession brute', 'PV latente (début)', 'Fiscalité', 'Cession nette', 'PV latente (fin)', 'Capital fin']
      : ['Âge', 'Capital début', 'Retrait brut', 'Part intérêts', 'Part capital', 'Fiscalité', 'Retrait net', 'Capital fin'];
  
  // Ajouter la colonne "Capital décès théorique" pour les PER avec garantie active
  if (produit.envelope === 'PER' && produit?.versementConfig?.annuel?.garantieBonneFin?.active) {
    baseColumns.splice(baseColumns.length - 1, 0, 'Capital décès théorique');
  }
  
  return baseColumns;
}

export const hasDegressifData = (produit) =>
  produit?.epargne?.rows?.some((row) => Math.abs(row.capitalDecesDegressif || 0) > EPSILON);

export const shouldShowDegressifColumn = (produit) =>
  produit?.envelope === 'PER' &&
  produit?.versementConfig?.annuel?.garantieBonneFin?.active;

export function getBaseColumnsForProduct(produit) {
  if (!produit) return baseEpargneColumns;
  if (shouldShowDegressifColumn(produit) || hasDegressifData(produit)) return baseEpargneColumns;
  return baseEpargneColumns.filter((col) => col !== 'Capital décès dégressif');
}

// ─── Liquidation column filtering ────────────────────────────────────

export function getRelevantColumns(rows, baseColumns, showAllColumns) {
  if (showAllColumns || !rows || rows.length === 0) return baseColumns;

  const guaranteedColumns = baseColumns.slice(0, Math.min(3, baseColumns.length));
  guaranteedColumns.push('Capital fin');

  const relevantColumns = new Set(guaranteedColumns);

  baseColumns.forEach((col) => {
    const hasNonZeroValue = rows.some((row) => {
      const valueMap = {
        'Capital': row.capitalDebut ?? row.capital ?? 0,
        'Capital début': row.capitalDebut,
        'Capital fin': row.capitalFin,
        'Fiscalité': row.fiscaliteTotal,
        'Loyers bruts': row.retraitBrut,
        'Loyers nets': row.retraitNet,
        'Cession brute': row.retraitBrut,
        'PV latente (début)': row.pvLatenteDebut,
        'Cession nette': row.retraitNet,
        'PV latente (fin)': row.pvLatenteFin,
        'Retrait brut': row.retraitBrut,
        'Part intérêts': row.partGains,
        'Part capital': row.partCapital,
        'Retrait net': row.retraitNet,
        'Capital décès théorique': row.capitalDecesTheorique,
      };

      const value = valueMap[col];
      return value !== undefined && value !== null && Math.abs(value) > EPSILON;
    });

    if (hasNonZeroValue) {
      relevantColumns.add(col);
    }
  });

  return baseColumns.filter((col) => relevantColumns.has(col));
}

// ─── Cell renderers ──────────────────────────────────────────────────

export function renderEpargneCell(column, row, produit) {
  switch (column) {
    case 'Âge':
      return `${row.age} ans`;
    case 'Capital début':
      return euro(row.capitalDebut);
    case 'Versement net':
      return (
        <>
          {euro(row.versementNet)}
          <div className="pl-detail-cumul">Cumul : {euro(row.cumulVersementsNets)}</div>
        </>
      );
    case 'Poche capi (fin)':
      return euro(row.capitalCapi || 0);
    case 'Poche distrib (fin)':
      return (
        <>
          {euro(row.capitalDistrib || 0)}
          {(row.revaloDistrib || 0) !== 0 && (
            <div className="pl-detail-cumul">Revalo : {euro(row.revaloDistrib)}</div>
          )}
        </>
      );
    case 'Poche 0% / espèces':
      return euro(row.compteEspece0pct ?? row.compteEspece ?? 0);
    case 'Gains année': {
      const gainsValue = row.gainsAnnee ?? (row.gains || 0) + (row.revaloDistrib || 0);
      return (
        <>
          {euro(gainsValue)}
          <div className="pl-detail-cumul">Cumul : {euro(row.cumulGains ?? row.cumulInterets ?? 0)}</div>
        </>
      );
    }
    case 'Revenus nets appréhendés':
      return euro(row.revenusNetsPercusAnnee ?? 0);
    case 'Revenus nets réinvestis':
      return (
        <>
          {euro(row.reinvestissement ?? 0)}
          <div className="pl-detail-cumul">
            {produit.envelope === 'SCPI' ? 'Loyer net N (réinvesti N+1)' : 'Coupon net N (réinvesti N+1)'} :{' '}
            {euro(row.reinvestissementDistribNetAnnee ?? 0)}
          </div>
        </>
      );
    case 'Capital décès dégressif':
      return euro(row.capitalDecesDegressif || 0);
    case 'Capital fin':
      return euro(row.capitalFin);
    default:
      return null;
  }
}

export const renderEpargneRow = (produit, columns) => (row, index) => (
  <tr key={index} className={row.cessionProduit ? 'pl-row-cession' : ''}>
    {columns.map((col) => (
      <td key={`${index}-${col}`}>{renderEpargneCell(col, row, produit)}</td>
    ))}
  </tr>
);
