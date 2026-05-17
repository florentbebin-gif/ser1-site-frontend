/**
 * TresoProjectionDrawer.tsx — Tableau de projection annuelle.
 */

import { useMemo, useState } from 'react';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  TresoAssociateRevenueSource,
  TresoProjectionRow,
} from '../../../engine/tresorerie/types';
import { getTresoRevenueSourceLabel } from '../utils/tresorerieRevenueLabels';

interface Props {
  rows: TresoProjectionRow[];
  mode: 'resume' | 'detail';
  onModeChange: (v: 'resume' | 'detail') => void;
  ageActuel: number;
  ageRetraite: number;
  anneeCivileDebut?: number;
}

type RowGroup = 'resultat' | 'cca' | 'capi' | 'reserves' | 'revenus' | 'tresorerie';

interface RowDef {
  key: string;
  label: string;
  group?: RowGroup;
  emphasis?: 'subtotal' | 'total';
  italic?: boolean;
  warning?: (row: TresoProjectionRow) => boolean;
  format?: (row: TresoProjectionRow) => string;
}

type ProjectionRenderRow = { type: 'group'; group: RowGroup } | { type: 'row'; rowDef: RowDef };

const GROUP_LABELS: Record<RowGroup, string> = {
  resultat: 'Résultat',
  cca: 'CCA',
  capi: 'Capitalisation',
  reserves: 'Réserves',
  revenus: 'Revenus nets associés',
  tresorerie: 'Trésorerie',
};

function fmtE(n: number): string {
  if (!n && n !== 0) return '—';
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

function fmtOptionalE(n: number | undefined): string {
  return n == null ? '—' : fmtE(n);
}

function sourceLabel(source: TresoAssociateRevenueSource): string {
  return getTresoRevenueSourceLabel(source);
}

function getTresoreriePlacee(row: TresoProjectionRow): number {
  return row.capitalDistrib + row.valeurCapi;
}

function getTresorerieConsolidee(row: TresoProjectionRow): number {
  return (row.tresorerieBanqueFin ?? row.tresorerieFin) + getTresoreriePlacee(row);
}

const RESUME_ROWS: RowDef[] = [
  {
    key: 'apportCCA',
    label: "Apports en compte courant d'associé",
    format: (r) => fmtE(r.apportCCA),
  },
  {
    key: 'revenuDistrib',
    label: 'Revenus de la poche de distribution',
    format: (r) => fmtE(r.revenuDistrib),
  },
  { key: 'is', label: 'Impôt sur les sociétés', format: (r) => fmtE(r.is) },
  { key: 'revenusNets', label: 'Total revenus nets annuels', format: (r) => fmtE(r.revenusNets) },
  {
    key: 'deltaBesoin',
    label: 'Écart annuel avec le besoin de revenus',
    format: (r) => fmtE(r.deltaBesoin),
    warning: (r) => r.deltaBesoin < 0,
  },
];

const DETAIL_ROWS: RowDef[] = [
  {
    key: 'revenuDistrib',
    label: 'Revenus — poche de distribution',
    group: 'resultat',
    format: (r) => fmtE(r.revenuDistrib),
  },
  {
    key: 'dividendesFiliales',
    label: 'Dividendes filiales reçus',
    group: 'resultat',
    format: (r) => fmtE(r.dividendesFiliales),
  },
  {
    key: 'gainCapiN',
    label: 'Gain de capitalisation (sortie)',
    group: 'resultat',
    format: (r) => fmtE(r.gainCapiN),
  },
  {
    key: 'chargesStructure',
    label: 'Charges de la structure',
    group: 'resultat',
    format: (r) => fmtE(r.chargesStructure),
  },
  {
    key: 'interetsCreditIS',
    label: 'Intérêts crédit IS',
    group: 'resultat',
    format: (r) => fmtE(r.interetsCreditIS),
  },
  {
    key: 'resultatFiscalAvantIS',
    label: 'Résultat fiscal avant IS',
    group: 'resultat',
    emphasis: 'subtotal',
    format: (r) => fmtE(r.resultatFiscalAvantIS),
  },
  {
    key: 'is',
    label: 'Impôt sur les sociétés',
    group: 'resultat',
    emphasis: 'total',
    format: (r) => fmtE(r.is),
  },
  {
    key: 'apportCCA',
    label: "Apports en compte courant d'associé",
    group: 'cca',
    format: (r) => fmtE(r.apportCCA),
  },
  {
    key: 'ccaCumule',
    label: 'CCA total constitué',
    group: 'cca',
    format: (r) => fmtE(r.ccaCumule),
  },
  {
    key: 'retraitsCCA',
    label: 'Remboursements CCA (sans PFU)',
    group: 'cca',
    format: (r) => fmtE(r.retraitsCCA),
  },
  {
    key: 'ccaRestant',
    label: 'CCA net restant dû',
    group: 'cca',
    emphasis: 'total',
    format: (r) => fmtE(r.ccaRestant),
  },
  {
    key: 'valeurCapi',
    label: 'Valeur de la poche de capitalisation',
    group: 'capi',
    format: (r) => fmtE(r.valeurCapi),
  },
  {
    key: 'isLatentCapi',
    label: 'IS latent — non décaissé',
    group: 'capi',
    italic: true,
    format: (r) => (r.isLatentCapi > 0 ? fmtE(r.isLatentCapi) : '—'),
  },
  {
    key: 'reservesDebut',
    label: "Réserves en début d'exercice",
    group: 'reserves',
    format: (r) => fmtE(r.reservesDebut),
  },
  {
    key: 'resultatNetComptable',
    label: 'Résultat net comptable estimé',
    group: 'reserves',
    emphasis: 'total',
    format: (r) => fmtE(r.resultatNetComptable),
  },
  {
    key: 'dividendesAssociesBruts',
    label: 'Dividendes versés aux associés',
    group: 'reserves',
    format: (r) => fmtE(r.dividendesAssociesBruts),
  },
  {
    key: 'reservesFin',
    label: "Réserves en fin d'exercice",
    group: 'reserves',
    format: (r) => fmtE(r.reservesFin),
  },
  {
    key: 'capaciteDistribuable',
    label: 'Capacité distribuable',
    group: 'reserves',
    emphasis: 'subtotal',
    format: (r) => fmtE(r.capaciteDistribuable),
    warning: (r) => r.alerteDividendesSuperieursCapacite,
  },
  { key: 'pfu', label: 'Fiscalité dividendes (PFU)', group: 'revenus', format: (r) => fmtE(r.pfu) },
  {
    key: 'revenusNets',
    label: 'Total revenus nets annuels',
    group: 'revenus',
    emphasis: 'total',
    format: (r) => fmtE(r.revenusNets),
  },
  {
    key: 'deltaBesoin',
    label: 'Écart annuel avec le besoin de revenus',
    group: 'revenus',
    emphasis: 'total',
    format: (r) => fmtE(r.deltaBesoin),
    warning: (r) => r.deltaBesoin < 0,
  },
  {
    key: 'tresorerieBanqueDebut',
    label: 'Compte bancaire début',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.tresorerieBanqueDebut),
  },
  {
    key: 'soldeMinimumCompteBancaire',
    label: 'Solde minimum à conserver',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.soldeMinimumCompteBancaire),
  },
  {
    key: 'bfr',
    label: 'Besoin en fonds de roulement',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.bfr),
  },
  {
    key: 'tresorerieDisponible',
    label: 'Trésorerie bancaire disponible',
    group: 'tresorerie',
    emphasis: 'subtotal',
    format: (r) => fmtOptionalE(r.tresorerieDisponible),
  },
  {
    key: 'montantInvestiInitial',
    label: 'Montant investi initialement',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.montantInvestiInitial),
  },
  {
    key: 'montantBalayeAnnuel',
    label: 'Montant investi automatiquement vers placements',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.montantBalayeAnnuel),
  },
  {
    key: 'montantReinvestiAuTerme',
    label: 'Montant réinvesti au terme',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.montantReinvestiAuTerme),
  },
  {
    key: 'tresoreriePlacee',
    label: 'Trésorerie placée (poches)',
    group: 'tresorerie',
    emphasis: 'subtotal',
    format: (r) => fmtE(getTresoreriePlacee(r)),
  },
  {
    key: 'tresorerieBanqueFin',
    label: 'Compte bancaire fin',
    group: 'tresorerie',
    format: (r) => fmtOptionalE(r.tresorerieBanqueFin),
  },
  {
    key: 'deficitTresorerieBancaire',
    label: 'Déficit bancaire vs solde minimum + BFR',
    group: 'tresorerie',
    emphasis: 'total',
    format: (r) => fmtOptionalE(r.deficitTresorerieBancaire),
    warning: (r) => (r.deficitTresorerieBancaire ?? 0) > 0,
  },
  {
    key: 'tresorerieConsolidee',
    label: 'Trésorerie consolidée',
    group: 'tresorerie',
    emphasis: 'total',
    format: (r) => fmtE(getTresorerieConsolidee(r)),
  },
];

function buildTresoAccountingProjectionView(
  rows: TresoProjectionRow[],
  associateFilter: string,
): RowDef[] {
  const keys = new Map<string, { label: string; source?: TresoAssociateRevenueSource }>();
  rows.forEach((row) => {
    row.revenusParAssocie.forEach((revenue) => {
      if (associateFilter !== 'all' && revenue.associateId !== associateFilter) return;
      const key =
        associateFilter === 'all'
          ? revenue.associateId
          : `${revenue.associateId}:${revenue.source}`;
      const label =
        associateFilter === 'all'
          ? `Revenus nets — ${revenue.label}`
          : `${sourceLabel(revenue.source)} — ${revenue.label}`;
      keys.set(key, { label, source: associateFilter === 'all' ? undefined : revenue.source });
    });
  });
  return Array.from(keys, ([key, { label, source }]) => ({
    key: `associe:${key}`,
    label,
    group: 'revenus',
    format: (row) => {
      const total = row.revenusParAssocie
        .filter((revenue) => {
          if (associateFilter === 'all') return revenue.associateId === key;
          return `${revenue.associateId}:${revenue.source}` === key;
        })
        .reduce((sum, revenue) => {
          if (source === 'charges_sociales_tns') return sum - revenue.tnsSocialCharges;
          return sum + revenue.netRevenue;
        }, 0);
      return total === 0 ? '—' : fmtE(total);
    },
  }));
}

function withGroupHeaders(rowDefs: RowDef[]): ProjectionRenderRow[] {
  const seenGroups = new Set<RowGroup>();
  return rowDefs.flatMap((rowDef) => {
    if (!rowDef.group || seenGroups.has(rowDef.group)) {
      return [{ type: 'row', rowDef }];
    }
    seenGroups.add(rowDef.group);
    return [
      { type: 'group', group: rowDef.group },
      { type: 'row', rowDef },
    ];
  });
}

function getRowClass(rowDef: RowDef): string {
  return [
    rowDef.italic ? 'ts-proj-row--italic' : '',
    rowDef.emphasis === 'subtotal' ? 'ts-proj-row--subtotal' : '',
    rowDef.emphasis === 'total' ? 'ts-proj-row--total' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function TresoProjectionDrawer({
  rows,
  mode,
  onModeChange,
  ageActuel,
  ageRetraite,
  anneeCivileDebut,
}: Props) {
  const [associateFilter, setAssociateFilter] = useState('all');
  const anneeCivile = anneeCivileDebut ?? new Date().getFullYear();

  const associateOptions = useMemo(() => {
    const associates = new Map<string, string>();
    rows.forEach((row) => {
      row.revenusParAssocie.forEach((revenue) => {
        associates.set(revenue.associateId, revenue.label);
      });
    });
    return [
      { value: 'all', label: 'Tous les associés' },
      ...Array.from(associates, ([value, label]) => ({ value, label })),
    ];
  }, [rows]);

  const associateRows = useMemo(
    () => buildTresoAccountingProjectionView(rows, associateFilter),
    [associateFilter, rows],
  );

  const activeRows = mode === 'resume' ? RESUME_ROWS : [...DETAIL_ROWS, ...associateRows];
  const renderRows =
    mode === 'detail'
      ? withGroupHeaders(activeRows)
      : activeRows.map((rowDef) => ({ type: 'row' as const, rowDef }));

  if (rows.length === 0) {
    return (
      <div className="ts-drawer__empty">
        Renseignez les paramètres pour afficher la projection comptable.
      </div>
    );
  }

  return (
    <div className="ts-drawer">
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

      <div className="ts-drawer__table-wrapper">
        <table className="ts-projection-table">
          <thead>
            <tr>
              <th className="ts-proj-th ts-proj-th--label">Indicateur</th>
              {rows.map((row) => {
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
            {renderRows.map((renderRow) => {
              if (renderRow.type === 'group') {
                return (
                  <tr key={`group:${renderRow.group}`} className="ts-proj-group-row">
                    <td className="ts-proj-group-row__cell" colSpan={rows.length + 1}>
                      {GROUP_LABELS[renderRow.group]}
                    </td>
                  </tr>
                );
              }

              const { rowDef } = renderRow;
              return (
                <tr key={rowDef.key} className={getRowClass(rowDef)}>
                  <td className="ts-proj-td ts-proj-td--label">
                    {rowDef.label}
                    {rowDef.italic && <span className="ts-proj-td__badge">non décaissé</span>}
                  </td>
                  {rows.map((row) => {
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
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="ts-drawer__note">
        La trésorerie bancaire disponible correspond au compte bancaire après solde minimum et
        besoin en fonds de roulement. IS latent capitalisation : affiché pour information, non
        décaissé.
      </p>
    </div>
  );
}
