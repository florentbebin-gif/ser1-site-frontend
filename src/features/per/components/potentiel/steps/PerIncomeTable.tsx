import React, { useState } from 'react';
import {
  SimAmountInputEuro,
  SimFieldShell,
  SimInfoButton,
  SimModalShell,
  SimSelect,
} from '@/components/ui/sim';
import { IconFileText, IconTable, IconUsers } from '@/icons/ui';
import { computeAbattement10 } from '@/engine/ir/abattement10';
import type { DeclarantRevenus } from '@/engine/per';
import { formatInteger } from '@/utils/numbers';
import type { PerDeclarantPatch } from '@/features/per/hooks/usePerPotentiel';

export type PerIncomeFilters = {
  pension: boolean;
  foncier: boolean;
};

export interface PerAbattementConfig {
  plafond?: number | string | null;
  plancher?: number | string | null;
}

function formatReadonlyAmount(value: number): string {
  return formatInteger(Math.max(0, Math.round(value || 0)));
}

function formatReadonlyMoney(value: number): string {
  return `${formatReadonlyAmount(value)} €`;
}

function SectionIcon({ kind }: { kind: 'foyer' | 'revenus' | 'versements' }): React.ReactElement {
  if (kind === 'foyer') return <IconUsers />;
  if (kind === 'revenus') return <IconTable />;
  return <IconFileText />;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon: 'foyer' | 'revenus' | 'versements';
  eyebrow?: string;
  actions?: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <div className="sim-card__header sim-card__header--bleed per-section-header">
        <div className="per-section-header-row">
          <div className="sim-card__title-row">
            <div className="sim-card__icon">
              <SectionIcon kind={icon} />
            </div>
            <div className="per-section-title-block">
              {eyebrow ? <p className="premium-section-title">{eyebrow}</p> : null}
              <h3 className="sim-card__title">{title}</h3>
            </div>
          </div>
          {actions ? <div className="per-section-header-actions">{actions}</div> : null}
        </div>
        {subtitle ? <p className="per-section-subtitle">{subtitle}</p> : null}
      </div>
      <div className="sim-divider" />
    </>
  );
}

function ReadonlyAmountInput({
  value,
  ariaLabel,
}: {
  value: number;
  ariaLabel: string;
}): React.ReactElement {
  return (
    <SimFieldShell className="per-table-input" rowClassName="per-table-input__row">
      <input
        type="text"
        readOnly
        aria-label={ariaLabel}
        value={formatReadonlyAmount(value)}
        className="sim-field__control per-table-input__control per-table-input__control--readonly"
      />
      <span className="per-table-input__unit sim-field__unit" aria-hidden="true">
        €
      </span>
    </SimFieldShell>
  );
}

function PerTableAmountInput({
  value,
  ariaLabel,
  onChange,
  disabled = false,
}: {
  value: number;
  ariaLabel: string;
  onChange: (_value: number) => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <SimAmountInputEuro
      value={value}
      ariaLabel={ariaLabel}
      fieldClassName="per-table-input"
      rowClassName="per-table-input__row"
      className="per-table-input__control"
      unitClassName="per-table-input__unit"
      disabled={disabled}
      onChange={onChange}
    />
  );
}

function buildTnsTogglePatch(enabled: boolean): Partial<DeclarantRevenus> {
  if (enabled) {
    return { statutTns: true };
  }

  return {
    statutTns: false,
    art62: 0,
    bic: 0,
    cotisationsMadelin154bis: 0,
    cotisationsMadelinRetraite: 0,
    cotisationsPrevo: 0,
  };
}

export function buildTnsFoyerTogglePatches({
  isCouple,
  declarant1,
  declarant2,
}: {
  isCouple: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
}): PerDeclarantPatch[] {
  const isActive = declarant1.statutTns || (isCouple && declarant2.statutTns);
  const patch = buildTnsTogglePatch(!isActive);

  return [{ decl: 1 as const, patch }, ...(isCouple ? [{ decl: 2 as const, patch }] : [])];
}

function DividerRow({ isCouple }: { isCouple: boolean }): React.ReactElement {
  return (
    <tr className="per-divider-row">
      <td colSpan={isCouple ? 3 : 2}>
        <div className="sim-divider sim-divider--soft" />
      </td>
    </tr>
  );
}

export function PerIncomeTable({
  isCouple,
  declarant1,
  declarant2,
  incomeFilters,
  abat10SalCfg,
  abat10RetCfg,
  onToggleIncomeFilter,
  onUpdateDeclarant,
  onUpdateDeclarants,
}: {
  isCouple: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  incomeFilters: PerIncomeFilters;
  abat10SalCfg: PerAbattementConfig;
  abat10RetCfg: PerAbattementConfig;
  onToggleIncomeFilter: (_key: keyof PerIncomeFilters) => void;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
  onUpdateDeclarants: (_patches: PerDeclarantPatch[]) => void;
}): React.ReactElement {
  const [revenueInfoOpen, setRevenueInfoOpen] = useState(false);
  const showTnsRows = declarant1.statutTns || (isCouple && declarant2.statutTns);
  const showPensionRows = incomeFilters.pension === true;
  const showFoncierRow = incomeFilters.foncier === true;
  const toggleTns = () => {
    onUpdateDeclarants(buildTnsFoyerTogglePatches({ isCouple, declarant1, declarant2 }));
  };

  const abat10SalD1 = computeAbattement10(
    (declarant1.salaires || 0) + (declarant1.art62 || 0),
    abat10SalCfg,
  );
  const abat10SalD2 = computeAbattement10(
    (declarant2.salaires || 0) + (declarant2.art62 || 0),
    abat10SalCfg,
  );
  const abat10PensionsFoyer = computeAbattement10(
    (declarant1.retraites || 0) + (isCouple ? declarant2.retraites || 0 : 0),
    abat10RetCfg,
  );

  return (
    <>
      <div className="premium-card premium-card--guide sim-card--guide per-income-table-card">
        <SectionHeader
          title="Revenus imposables"
          icon="revenus"
          actions={
            <>
              <SimInfoButton
                ariaLabel="Comprendre les revenus imposables"
                onClick={() => setRevenueInfoOpen(true)}
              />
              <div
                className="per-income-filters"
                role="group"
                aria-label="Filtres des lignes de revenus imposables"
              >
                <button
                  type="button"
                  className={`per-income-filter-btn${showTnsRows ? ' is-active' : ''}`}
                  onClick={toggleTns}
                  aria-pressed={showTnsRows}
                  data-testid="per-toggle-tns"
                >
                  TNS
                </button>
                <button
                  type="button"
                  className={`per-income-filter-btn${showPensionRows ? ' is-active' : ''}`}
                  onClick={() => onToggleIncomeFilter('pension')}
                  aria-pressed={showPensionRows}
                  data-testid="per-filter-pension"
                >
                  Pension
                </button>
                <button
                  type="button"
                  className={`per-income-filter-btn${showFoncierRow ? ' is-active' : ''}`}
                  onClick={() => onToggleIncomeFilter('foncier')}
                  aria-pressed={showFoncierRow}
                  data-testid="per-filter-foncier"
                >
                  Foncier
                </button>
              </div>
            </>
          }
        />

        <div className="per-income-table-wrap">
          <table
            className={`per-income-table${isCouple ? '' : ' per-income-table--single'}`}
            aria-label="Revenus imposables"
          >
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <thead>
              <tr>
                <th aria-label="Catégorie"></th>
                <th>Déclarant 1</th>
                <th>Déclarant 2</th>
              </tr>
            </thead>
            <tbody>
              <DividerRow isCouple={isCouple} />
              <tr>
                <td>Traitements et salaires</td>
                <td data-column-label="Déclarant 1">
                  <PerTableAmountInput
                    value={declarant1.salaires}
                    ariaLabel="Traitements et salaires déclarant 1"
                    onChange={(value) => onUpdateDeclarant(1, { salaires: value })}
                  />
                </td>
                <td data-column-label="Déclarant 2">
                  <PerTableAmountInput
                    value={declarant2.salaires}
                    ariaLabel="Traitements et salaires déclarant 2"
                    onChange={(value) => onUpdateDeclarant(2, { salaires: value })}
                  />
                </td>
              </tr>
              {showTnsRows && (
                <tr>
                  <td>Revenus des associés / gérants</td>
                  <td data-column-label="Déclarant 1">
                    <PerTableAmountInput
                      value={declarant1.art62}
                      ariaLabel="Revenus des associés ou gérants déclarant 1"
                      disabled={!declarant1.statutTns}
                      onChange={(value) => onUpdateDeclarant(1, { art62: value })}
                    />
                  </td>
                  <td data-column-label="Déclarant 2">
                    <PerTableAmountInput
                      value={declarant2.art62}
                      ariaLabel="Revenus des associés ou gérants déclarant 2"
                      disabled={!declarant2.statutTns}
                      onChange={(value) => onUpdateDeclarant(2, { art62: value })}
                    />
                  </td>
                </tr>
              )}
              <tr className="per-income-table-row-title">
                <td>Frais réels ou abattement 10 %</td>
                <td data-column-label="Déclarant 1">
                  <div className="per-income-real-cell">
                    <SimSelect
                      value={declarant1.fraisReels ? 'reels' : 'abat10'}
                      onChange={(value) => onUpdateDeclarant(1, { fraisReels: value === 'reels' })}
                      options={[
                        { value: 'reels', label: 'FR' },
                        { value: 'abat10', label: '10%' },
                      ]}
                      className="per-income-real-select"
                    />
                    {declarant1.fraisReels ? (
                      <PerTableAmountInput
                        value={declarant1.fraisReelsMontant}
                        ariaLabel="Montant des frais réels déclarant 1"
                        onChange={(value) => onUpdateDeclarant(1, { fraisReelsMontant: value })}
                      />
                    ) : (
                      <ReadonlyAmountInput
                        value={abat10SalD1}
                        ariaLabel="Abattement 10 % déclarant 1"
                      />
                    )}
                  </div>
                </td>
                <td data-column-label="Déclarant 2">
                  <div className="per-income-real-cell">
                    <SimSelect
                      value={declarant2.fraisReels ? 'reels' : 'abat10'}
                      onChange={(value) => onUpdateDeclarant(2, { fraisReels: value === 'reels' })}
                      options={[
                        { value: 'reels', label: 'FR' },
                        { value: 'abat10', label: '10%' },
                      ]}
                      className="per-income-real-select"
                    />
                    {declarant2.fraisReels ? (
                      <PerTableAmountInput
                        value={declarant2.fraisReelsMontant}
                        ariaLabel="Montant des frais réels déclarant 2"
                        onChange={(value) => onUpdateDeclarant(2, { fraisReelsMontant: value })}
                      />
                    ) : (
                      <ReadonlyAmountInput
                        value={abat10SalD2}
                        ariaLabel="Abattement 10 % déclarant 2"
                      />
                    )}
                  </div>
                </td>
              </tr>
              <DividerRow isCouple={isCouple} />
              {showTnsRows && (
                <tr>
                  <td>BIC / BNC / BA imposables</td>
                  <td data-column-label="Déclarant 1">
                    <PerTableAmountInput
                      value={declarant1.bic}
                      ariaLabel="BIC BNC BA imposables déclarant 1"
                      disabled={!declarant1.statutTns}
                      onChange={(value) => onUpdateDeclarant(1, { bic: value })}
                    />
                  </td>
                  <td data-column-label="Déclarant 2">
                    <PerTableAmountInput
                      value={declarant2.bic}
                      ariaLabel="BIC BNC BA imposables déclarant 2"
                      disabled={!declarant2.statutTns}
                      onChange={(value) => onUpdateDeclarant(2, { bic: value })}
                    />
                  </td>
                </tr>
              )}
              <tr>
                <td>Autres revenus imposables</td>
                <td data-column-label="Déclarant 1">
                  <PerTableAmountInput
                    value={declarant1.autresRevenus}
                    ariaLabel="Autres revenus imposables déclarant 1"
                    onChange={(value) => onUpdateDeclarant(1, { autresRevenus: value })}
                  />
                </td>
                <td data-column-label="Déclarant 2">
                  <PerTableAmountInput
                    value={declarant2.autresRevenus}
                    ariaLabel="Autres revenus imposables déclarant 2"
                    onChange={(value) => onUpdateDeclarant(2, { autresRevenus: value })}
                  />
                </td>
              </tr>
              {(showPensionRows || showFoncierRow) && <DividerRow isCouple={isCouple} />}

              {showPensionRows && (
                <>
                  <tr>
                    <td>Pensions, retraites et rentes</td>
                    <td data-column-label="Déclarant 1">
                      <PerTableAmountInput
                        value={declarant1.retraites}
                        ariaLabel="Pensions retraites et rentes déclarant 1"
                        onChange={(value) => onUpdateDeclarant(1, { retraites: value })}
                      />
                    </td>
                    <td data-column-label="Déclarant 2">
                      <PerTableAmountInput
                        value={declarant2.retraites}
                        ariaLabel="Pensions retraites et rentes déclarant 2"
                        onChange={(value) => onUpdateDeclarant(2, { retraites: value })}
                      />
                    </td>
                  </tr>
                  <tr className="per-income-table-row-title">
                    <td>Abattement 10 % pensions (foyer)</td>
                    <td
                      colSpan={2}
                      className="per-income-table-value-cell per-income-table-value-cell--center"
                    >
                      {formatReadonlyMoney(abat10PensionsFoyer)}
                    </td>
                  </tr>
                </>
              )}

              {showPensionRows && showFoncierRow && <DividerRow isCouple={isCouple} />}

              {showFoncierRow && (
                <tr>
                  <td>Revenus fonciers nets</td>
                  <td data-column-label="Déclarant 1">
                    <PerTableAmountInput
                      value={declarant1.fonciersNets}
                      ariaLabel="Revenus fonciers nets déclarant 1"
                      onChange={(value) => onUpdateDeclarant(1, { fonciersNets: value })}
                    />
                  </td>
                  <td data-column-label="Déclarant 2">
                    <PerTableAmountInput
                      value={declarant2.fonciersNets}
                      ariaLabel="Revenus fonciers nets déclarant 2"
                      onChange={(value) => onUpdateDeclarant(2, { fonciersNets: value })}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {revenueInfoOpen ? (
        <SimModalShell
          title="Revenus imposables"
          subtitle="Aide de saisie PER"
          onClose={() => setRevenueInfoOpen(false)}
          bodyClassName="sim-info-modal-content"
        >
          <p>
            Renseignez uniquement les catégories utiles au calcul du plafond PER. Le filtre TNS
            affiche les revenus professionnels nécessaires au parcours Madelin 154 bis.
          </p>
        </SimModalShell>
      ) : null}
    </>
  );
}
