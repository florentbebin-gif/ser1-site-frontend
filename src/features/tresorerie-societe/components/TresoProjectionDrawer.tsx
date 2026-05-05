/**
 * TresoProjectionDrawer.tsx — Tableau de projection annuelle
 *
 * Tableau horizontal (années en colonnes), overflow-x: auto obligatoire.
 * Toggle interne Résumé (5 lignes) / Détail comptable (18 lignes).
 *
 * Groupes en vue Détail :
 *   Résultat, CCA, Capitalisation, Crédits, Réserves, Revenus nets
 */

import { useMemo, useState } from 'react';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type { TresoProjectionRow } from '../../../engine/tresorerie/types';

interface Props {
  rows: TresoProjectionRow[];
  mode: 'resume' | 'detail';
  onModeChange: (v: 'resume' | 'detail') => void;
  ageActuel: number;
  ageRetraite: number;
  anneeCivileDebut?: number;
}

function fmtE(n: number): string {
  if (!n && n !== 0) return '—';
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}


interface RowDef {
  key: string;
  label: string;
  italic?: boolean;
  warning?: (row: TresoProjectionRow) => boolean;
  format?: (row: TresoProjectionRow) => string;
}

function sourceLabel(source: string): string {
  if (source === 'remuneration') return 'Rémunération';
  if (source === 'cca') return 'Remboursement CCA';
  if (source === 'dividendes') return 'Dividendes nets';
  if (source === 'charges_sociales_tns') return 'Charges sociales TNS';
  return source;
}

const RESUME_ROWS: RowDef[] = [
  { key: 'apportCCA', label: "Apports en compte courant d'associé", format: r => fmtE(r.apportCCA) },
  { key: 'revenuDistrib', label: 'Revenus de la poche de distribution', format: r => fmtE(r.revenuDistrib) },
  { key: 'is', label: 'Impôt sur les sociétés', format: r => fmtE(r.is) },
  { key: 'revenusNets', label: 'Total revenus nets annuels', format: r => fmtE(r.revenusNets) },
  { key: 'deltaBesoin', label: 'Écart annuel avec le besoin de revenus', format: r => fmtE(r.deltaBesoin), warning: r => r.deltaBesoin < 0 },
];

const DETAIL_ROWS: RowDef[] = [
  // Résultat
  { key: 'revenuDistrib', label: 'Revenus — poche de distribution', format: r => fmtE(r.revenuDistrib) },
  { key: 'dividendesFiliales', label: 'Dividendes filiales reçus', format: r => fmtE(r.dividendesFiliales) },
  { key: 'gainCapiN', label: 'Gain de capitalisation (sortie)', format: r => fmtE(r.gainCapiN) },
  { key: 'chargesStructure', label: 'Charges de la structure', format: r => fmtE(r.chargesStructure) },
  { key: 'interetsCreditIS', label: 'Intérêts crédit IS', format: r => fmtE(r.interetsCreditIS) },
  { key: 'resultatFiscalAvantIS', label: 'Résultat fiscal avant IS', format: r => fmtE(r.resultatFiscalAvantIS) },
  { key: 'is', label: 'Impôt sur les sociétés', format: r => fmtE(r.is) },
  // CCA
  { key: 'apportCCA', label: "Apports en compte courant d'associé", format: r => fmtE(r.apportCCA) },
  { key: 'ccaCumule', label: 'CCA total constitué', format: r => fmtE(r.ccaCumule) },
  { key: 'retraitsCCA', label: 'Remboursements CCA (sans PFU)', format: r => fmtE(r.retraitsCCA) },
  { key: 'ccaRestant', label: 'CCA net restant dû', format: r => fmtE(r.ccaRestant) },
  // Capitalisation
  { key: 'valeurCapi', label: 'Valeur de la poche de capitalisation', format: r => fmtE(r.valeurCapi) },
  {
    key: 'isLatentCapi',
    label: 'IS latent — non décaissé',
    italic: true,
    format: r => r.isLatentCapi > 0 ? fmtE(r.isLatentCapi) : '—',
  },
  // Réserves
  { key: 'reservesDebut', label: "Réserves en début d'exercice", format: r => fmtE(r.reservesDebut) },
  { key: 'resultatNetComptable', label: 'Résultat net comptable', format: r => fmtE(r.resultatNetComptable) },
  { key: 'dividendesAssociesBruts', label: 'Dividendes versés aux associés', format: r => fmtE(r.dividendesAssociesBruts) },
  { key: 'reservesFin', label: "Réserves en fin d'exercice", format: r => fmtE(r.reservesFin) },
  { key: 'capaciteDistribuable', label: 'Capacité distribuable', format: r => fmtE(r.capaciteDistribuable), warning: r => r.alerteDividendesSuperieursCapacite },
  // Revenus nets
  { key: 'pfu', label: 'Fiscalité dividendes (PFU)', format: r => fmtE(r.pfu) },
  { key: 'revenusNets', label: 'Total revenus nets annuels', format: r => fmtE(r.revenusNets) },
  { key: 'deltaBesoin', label: 'Écart annuel avec le besoin de revenus', format: r => fmtE(r.deltaBesoin), warning: r => r.deltaBesoin < 0 },
  // Trésorerie
  { key: 'tresorerieFin', label: "Trésorerie fin d'année", format: r => fmtE(r.tresorerieFin) },
];

export function TresoProjectionDrawer({ rows, mode, onModeChange, ageActuel, ageRetraite, anneeCivileDebut }: Props) {
  const [associateFilter, setAssociateFilter] = useState('all');
  const anneeCivile = anneeCivileDebut ?? new Date().getFullYear();

  const associateOptions = useMemo(() => {
    const associates = new Map<string, string>();
    rows.forEach(row => {
      row.revenusParAssocie.forEach(revenue => {
        associates.set(revenue.associateId, revenue.label);
      });
    });
    return [
      { value: 'all', label: 'Tous les associés' },
      ...Array.from(associates, ([value, label]) => ({ value, label })),
    ];
  }, [rows]);

  const associateRows = useMemo<RowDef[]>(() => {
    const keys = new Map<string, string>();
    rows.forEach(row => {
      row.revenusParAssocie.forEach(revenue => {
        if (associateFilter !== 'all' && revenue.associateId !== associateFilter) return;
        const key = associateFilter === 'all'
          ? revenue.associateId
          : `${revenue.associateId}:${revenue.source}`;
        const label = associateFilter === 'all'
          ? `Revenus nets — ${revenue.label}`
          : `${sourceLabel(revenue.source)} — ${revenue.label}`;
        keys.set(key, label);
      });
    });
    return Array.from(keys, ([key, label]) => ({
      key: `associe:${key}`,
      label,
      format: row => {
        const total = row.revenusParAssocie
          .filter(revenue => {
            if (associateFilter === 'all') return revenue.associateId === key;
            return `${revenue.associateId}:${revenue.source}` === key;
          })
          .reduce((sum, revenue) => sum + revenue.netRevenue, 0);
        return total === 0 ? '—' : fmtE(total);
      },
    }));
  }, [associateFilter, rows]);

  const activeRows = mode === 'resume'
    ? RESUME_ROWS
    : [...DETAIL_ROWS, ...associateRows];

  if (rows.length === 0) {
    return (
      <div className="ts-drawer__empty">
        Renseignez les paramètres pour afficher la projection comptable.
      </div>
    );
  }

  return (
    <div className="ts-drawer">
      {/* Contrôles */}
      <div className="ts-drawer__controls">
        <div className="ts-drawer__mode-toggle">
          <button
            type="button"
            className={`ts-drawer__mode-btn${mode === 'resume' ? ' is-active' : ''}`}
            onClick={() => onModeChange('resume')}
          >
            Résumé
          </button>
          <button
            type="button"
            className={`ts-drawer__mode-btn${mode === 'detail' ? ' is-active' : ''}`}
            onClick={() => onModeChange('detail')}
          >
            Détail comptable
          </button>
        </div>
        {mode === 'detail' && associateOptions.length > 1 && (
          <div className="ts-drawer__associate-filter">
            <SimSelect
              value={associateFilter}
              onChange={setAssociateFilter}
              options={associateOptions}
              ariaLabel="Filtrer les revenus par associé"
            />
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="ts-drawer__table-wrapper">
        <table className="ts-projection-table">
          <thead>
            <tr>
              <th className="ts-proj-th ts-proj-th--label">Indicateur</th>
              {rows.map(row => {
                const age = ageActuel + row.year - 1;
                const isRetraite = age >= ageRetraite;
                return (
                  <th
                    key={row.year}
                    className={`ts-proj-th${isRetraite ? ' ts-proj-th--retraite' : ''}`}
                  >
                    <div className="ts-proj-th__year">{anneeCivile + row.year - 1}</div>
                    <div className="ts-proj-th__age">{age} ans</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeRows.map(rowDef => (
              <tr key={rowDef.key} className={rowDef.italic ? 'ts-proj-row--italic' : ''}>
                <td className="ts-proj-td ts-proj-td--label">
                  {rowDef.label}
                  {rowDef.italic && (
                    <span className="ts-proj-td__badge">non décaissé</span>
                  )}
                </td>
                {rows.map(row => {
                  const isWarning = rowDef.warning?.(row) ?? false;
                  return (
                    <td
                      key={row.year}
                      className={`ts-proj-td${isWarning ? ' ts-proj-td--warning' : ''}`}
                    >
                      {rowDef.format ? rowDef.format(row) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note taux */}
      <p className="ts-drawer__note">
        Trésorerie en fin d'année — Convention Option A : les dividendes sortent en brut unique.
        {' '}IS latent capitalisation : affiché pour information, non décaissé.
      </p>
    </div>
  );
}
