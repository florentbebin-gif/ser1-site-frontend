import React from 'react';
import {
  ENVELOPE_LABELS,
} from '@/engine/placementEngine.js';
import { DEFAULT_PS_SETTINGS } from '@/constants/settingsDefaults';
import { computeDmtgConsumptionRatio, shouldShowDmtgDisclaimer } from '@/utils/transmissionDisclaimer.js';
import { euro, shortEuro, formatPsMontant } from '../utils/formatters.js';
import { BENEFICIARY_OPTIONS, getRendementLiquidation } from '../utils/normalizers.js';
import { InputEuro, InputPct, InputNumber, Select, Toggle } from './inputs.jsx';
import { CollapsibleTable } from './tables.jsx';
import { buildColumns, getRelevantColumns } from '../utils/tableHelpers.jsx';

export function PlacementInputsPanel({
  state,
  tmiOptions,
  setClient,
  setProduct,
  setLiquidation,
  setTransmission,
  updateProductOption,
  setModalOpen,
  showAllColumns,
  setShowAllColumns,
  produit1,
  produit2,
  detailRows1,
  detailRows2,
  columnsProduit1,
  columnsProduit2,
  renderEpargneRow,
  dmtgSelectOptions,
  selectedDmtgTrancheWidth,
  psSettings,
}) {
  const psDecesProduit1 = produit1?.transmission?.psDeces;
  const psDecesProduit2 = produit2?.transmission?.psDeces;
  const hasTransmissionData = Boolean(produit1 || produit2);

  const assietteDmtgProduit1 = (produit1?.transmission?.taxeDmtg || 0) > 0
    ? (produit1?.transmission?.assiette || 0)
    : 0;
  const assietteDmtgProduit2 = (produit2?.transmission?.taxeDmtg || 0) > 0
    ? (produit2?.transmission?.assiette || 0)
    : 0;

  const dmtgConsumptionRatioProduit1 = computeDmtgConsumptionRatio(
    assietteDmtgProduit1,
    selectedDmtgTrancheWidth,
  );
  const dmtgConsumptionRatioProduit2 = computeDmtgConsumptionRatio(
    assietteDmtgProduit2,
    selectedDmtgTrancheWidth,
  );

  const showDmtgDisclaimer =
    shouldShowDmtgDisclaimer(assietteDmtgProduit1, selectedDmtgTrancheWidth) ||
    shouldShowDmtgDisclaimer(assietteDmtgProduit2, selectedDmtgTrancheWidth);

  const dmtgConsumptionPercentProduit1 = Math.min(100, Math.round(dmtgConsumptionRatioProduit1 * 100));
  const dmtgConsumptionPercentProduit2 = Math.min(100, Math.round(dmtgConsumptionRatioProduit2 * 100));

  return (
    <div className="pl-ir-left">
      <div className="pl-ir-table-wrapper premium-card premium-section">
        <div className="pl-section-title premium-section-title">Profil client</div>
        <div className="pl-topgrid premium-grid-4">
          <InputNumber
            label="Âge actuel"
            value={state.client.ageActuel}
            onChange={(v) => setClient({ ageActuel: v })}
            unit="ans"
            min={18}
            max={90}
          />
          <Select
            label="TMI actuel"
            value={state.client.tmiEpargne}
            onChange={(v) => setClient({ tmiEpargne: parseFloat(v) })}
            options={tmiOptions}
          />
          <Select
            label="TMI retraite"
            value={state.client.tmiRetraite}
            onChange={(v) => setClient({ tmiRetraite: parseFloat(v) })}
            options={tmiOptions}
          />
          <Select
            label="Situation"
            value={state.client.situation}
            onChange={(v) => setClient({ situation: v })}
            options={[
              { value: 'single', label: 'Célibataire' },
              { value: 'couple', label: 'Marié / Pacsé' },
            ]}
          />
        </div>
      </div>

      {state.step === 'epargne' && (
        <div className="pl-ir-table-wrapper premium-card premium-section">
          <div className="pl-section-title premium-section-title">Phase d'épargne</div>
          <table className="pl-ir-table pl-table premium-table">
            <thead>
              <tr>
                <th></th>
                <th className="pl-colhead" aria-label="Produit 1">
                  <div className="pl-colbadge-wrapper">
                    <div className="pl-collabel pl-collabel--product1">{ENVELOPE_LABELS[state.products[0].envelope]}</div>
                  </div>
                </th>
                <th className="pl-colhead" aria-label="Produit 2">
                  <div className="pl-colbadge-wrapper">
                    <div className="pl-collabel pl-collabel--product2">{ENVELOPE_LABELS[state.products[1].envelope]}</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Enveloppe</td>
                {state.products.map((p, i) => (
                  <td key={i}>
                    <select
                      className="pl-select"
                      value={p.envelope}
                      onChange={(e) => setProduct(i, { envelope: e.target.value })}
                    >
                      {Object.entries(ENVELOPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Durée de la phase épargne</td>
                {state.products.map((p, i) => (
                  <td key={i}>
                    <InputNumber
                      value={p.dureeEpargne}
                      onChange={(v) => setProduct(i, { dureeEpargne: v })}
                      unit="ans"
                      min={1}
                      max={50}
                    />
                  </td>
                ))}
              </tr>
              {(state.products[0].envelope === 'PER' || state.products[1].envelope === 'PER') && (
                <tr>
                  <td>PER bancaire (CTO)</td>
                  {state.products.map((p, i) => (
                    <td key={i} style={{ textAlign: 'center' }}>
                      {p.envelope === 'PER' ? (
                        <Toggle
                          checked={p.perBancaire}
                          onChange={(v) => setProduct(i, { perBancaire: v })}
                          label=""
                        />
                      ) : (
                        <span className="pl-muted">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}
              {(state.products[0].envelope === 'CTO' || state.products[1].envelope === 'CTO') && (
                <tr>
                  <td>Option dividendes au barème IR</td>
                  {state.products.map((p, i) => (
                    <td key={i} style={{ textAlign: 'center' }}>
                      {p.envelope === 'CTO' ? (
                        <Toggle
                          checked={p.optionBaremeIR}
                          onChange={(v) => setProduct(i, { optionBaremeIR: v })}
                          label=""
                        />
                      ) : (
                        <span className="pl-muted">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}
              <tr>
                <td>
                  Paramétrer les versements
                  <div className="pl-detail-cumul">Initial, annuel, allocation, frais</div>
                </td>
                {state.products.map((p, i) => (
                  <td key={i}>
                    <button
                      className="pl-btn pl-btn--config"
                      onClick={() => setModalOpen(i)}
                    >
                      <span className="pl-btn__icon">⚙</span>
                      <span className="pl-btn__summary">
                        {shortEuro(p.versementConfig.initial.montant)} + {shortEuro(p.versementConfig.annuel.montant)}/an
                      </span>
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {produit1 && produit2 && (
            <div className="pl-details-section">
              <div className="pl-details-toolbar">
                <label className="pl-details-toggle">
                  <input
                    type="checkbox"
                    checked={showAllColumns}
                    onChange={(e) => setShowAllColumns(e.target.checked)}
                  />
                  Afficher toutes les colonnes
                </label>
              </div>
              <div className="pl-details-scroll">
                <CollapsibleTable
                  title={`Détail ${produit1.envelopeLabel}`}
                  rows={detailRows1}
                  columns={columnsProduit1}
                  renderRow={renderEpargneRow(produit1, columnsProduit1)}
                />
              </div>
              <div className="pl-details-scroll">
                <CollapsibleTable
                  title={`Détail ${produit2.envelopeLabel}`}
                  rows={detailRows2}
                  columns={columnsProduit2}
                  renderRow={renderEpargneRow(produit2, columnsProduit2)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {state.step === 'liquidation' && (
        <div className="pl-ir-table-wrapper premium-card premium-section">
          <div className="pl-section-title premium-section-title">Phase de liquidation</div>
          <table className="pl-ir-table pl-table premium-table">
            <tbody>
              <tr>
                <td>Stratégie de retraits</td>
                <td colSpan={2}>
                  <select
                    className="pl-select"
                    value={state.liquidation.mode}
                    onChange={(e) => setLiquidation({ mode: e.target.value })}
                  >
                    <option value="epuiser">Épuiser sur N années</option>
                    <option value="mensualite">Mensualité cible</option>
                    <option value="unique">Retrait unique</option>
                  </select>
                </td>
              </tr>
              {state.liquidation.mode === 'epuiser' && (
                <tr>
                  <td>Durée de liquidation</td>
                  <td colSpan={2}>
                    <InputNumber
                      value={state.liquidation.duree}
                      onChange={(v) => setLiquidation({ duree: v })}
                      unit="ans"
                      min={1}
                      max={50}
                      inline
                    />
                  </td>
                </tr>
              )}

              {(state.products[0].envelope !== 'SCPI' || state.products[1].envelope !== 'SCPI') && (
                <tr>
                  <td>
                    Rendement capitalisation (liquidation)
                    <div className="pl-detail-cumul">Valeur par défaut : rendement capitalisation du modal</div>
                  </td>
                  {state.products.map((p, i) => (
                    <td key={i} style={{ opacity: p.envelope === 'SCPI' ? 0.55 : 0.85 }}>
                      {p.envelope === 'SCPI' ? (
                        '—'
                      ) : (
                        <InputPct
                          value={getRendementLiquidation(p) || 0}
                          onChange={(v) => setProduct(i, { rendementLiquidationOverride: v })}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              )}
              {state.liquidation.mode === 'mensualite' && (
                <tr>
                  <td>Mensualité cible</td>
                  <td colSpan={2}>
                    <InputEuro
                      value={state.liquidation.mensualiteCible}
                      onChange={(v) => setLiquidation({ mensualiteCible: v })}
                    />
                  </td>
                </tr>
              )}
              {state.liquidation.mode === 'unique' && (
                <tr>
                  <td>Montant du retrait</td>
                  <td colSpan={2}>
                    <InputEuro
                      value={state.liquidation.montantUnique}
                      onChange={(v) => setLiquidation({ montantUnique: v })}
                    />
                  </td>
                </tr>
              )}
              {((produit1 && (produit1.envelope === 'CTO' || produit1.envelope === 'AV' || produit1.envelope === 'PEA')) ||
                (produit2 && (produit2.envelope === 'CTO' || produit2.envelope === 'AV' || produit2.envelope === 'PEA'))) ? (
                <tr>
                  <td>Option au barème IR</td>
                  <td style={{ textAlign: 'center' }}>
                    {produit1 && (produit1.envelope === 'CTO' || produit1.envelope === 'AV' || produit1.envelope === 'PEA') ? (
                      <Toggle
                        checked={produit1.liquidation.optionBaremeIR}
                        onChange={(v) => updateProductOption(0, 'liquidation.optionBaremeIR', v)}
                        label=""
                      />
                    ) : (
                      <span className="pl-muted">—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {produit2 && (produit2.envelope === 'CTO' || produit2.envelope === 'AV' || produit2.envelope === 'PEA') ? (
                      <Toggle
                        checked={produit2.liquidation.optionBaremeIR}
                        onChange={(v) => updateProductOption(1, 'liquidation.optionBaremeIR', v)}
                        label=""
                      />
                    ) : (
                      <span className="pl-muted">—</span>
                    )}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          {produit1 && produit2 && (
            <div className="pl-details-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-c1)' }}>Détail année par année</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-c9)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAllColumns}
                    onChange={(e) => setShowAllColumns(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  Afficher toutes les colonnes
                </label>
              </div>
              <CollapsibleTable
                title={`Détail ${produit1.envelopeLabel}`}
                rows={produit1.liquidation.rows.filter((r) => r.age <= produit1.liquidation.ageAuDeces)}
                columns={getRelevantColumns(produit1.liquidation.rows, buildColumns(produit1), showAllColumns)}
                renderRow={(r, i) => (
                  <tr key={i} className={r.isAgeAuDeces ? 'pl-row-deces' : ''}>
                    <td>{r.age} ans {r.isAgeAuDeces && '†'}</td>
                    {produit1.envelope === 'SCPI' ? (
                      <>
                        <td>{euro(r.capitalDebut)}</td>
                        <td>{euro(r.retraitBrut)}</td>
                        <td>{euro(r.fiscaliteTotal)}</td>
                        <td>{euro(r.retraitNet)}</td>
                        <td>{euro(r.capitalFin)}</td>
                      </>
                    ) : ['CTO', 'PEA'].includes(produit1.envelope) ? (
                      <>
                        <td>{euro(r.capitalDebut)}</td>
                        <td>{euro(r.retraitBrut)}</td>
                        <td>{euro(r.pvLatenteDebut ?? 0)}</td>
                        <td>{euro(r.fiscaliteTotal)}</td>
                        <td>{euro(r.retraitNet)}</td>
                        <td>{euro(r.pvLatenteFin ?? r.totalInteretsRestants ?? 0)}</td>
                        <td>{euro(r.capitalFin)}</td>
                      </>
                    ) : (
                      <>
                        <td>
                          {euro(r.capitalDebut)}
                          <div className="pl-detail-cumul">+{euro(r.gainsAnnee)} intérêts</div>
                          <div className="pl-detail-cumul">Cumul : {euro(r.cumulRevenusNetsPercus || 0)}</div>
                        </td>
                        <td>{euro(r.retraitBrut)}</td>
                        <td>
                          {euro(r.partGains)}
                          <div className="pl-detail-cumul">Reste : {euro(r.totalInteretsRestants)}</div>
                        </td>
                        <td>
                          {euro(r.partCapital)}
                          <div className="pl-detail-cumul">Reste : {euro(r.totalCapitalRestant)}</div>
                        </td>
                        <td>{euro(r.fiscaliteTotal)}</td>
                        <td>{euro(r.retraitNet)}</td>
                        {produit2.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active && (
                          <td>{euro(r.capitalDecesTheorique || 0)}</td>
                        )}
                        <td>{euro(r.capitalFin)}</td>
                      </>
                    )}
                  </tr>
                )}
              />
              <CollapsibleTable
                title={`Détail ${produit2.envelopeLabel}`}
                rows={produit2.liquidation.rows.filter((r) => r.age <= produit2.liquidation.ageAuDeces)}
                columns={getRelevantColumns(produit2.liquidation.rows, buildColumns(produit2), showAllColumns)}
                renderRow={(r, i) => (
                  <tr key={i} className={r.isAgeAuDeces ? 'pl-row-deces' : ''}>
                    <td>{r.age} ans {r.isAgeAuDeces && '†'}</td>
                    {produit2.envelope === 'SCPI' ? (
                      <>
                        <td>{euro(r.capitalDebut)}</td>
                        <td>{euro(r.retraitBrut)}</td>
                        <td>{euro(r.fiscaliteTotal)}</td>
                        <td>{euro(r.retraitNet)}</td>
                        <td>{euro(r.capitalFin)}</td>
                      </>
                    ) : ['CTO', 'PEA'].includes(produit2.envelope) ? (
                      <>
                        <td>{euro(r.capitalDebut)}</td>
                        <td>{euro(r.retraitBrut)}</td>
                        <td>{euro(r.pvLatenteDebut ?? 0)}</td>
                        <td>{euro(r.fiscaliteTotal)}</td>
                        <td>{euro(r.retraitNet)}</td>
                        <td>{euro(r.pvLatenteFin ?? r.totalInteretsRestants ?? 0)}</td>
                        <td>{euro(r.capitalFin)}</td>
                      </>
                    ) : (
                      <>
                        <td>
                          {euro(r.capitalDebut)}
                          <div className="pl-detail-cumul">+{euro(r.gainsAnnee)} intérêts</div>
                          <div className="pl-detail-cumul">Cumul : {euro(r.cumulRevenusNetsPercus || 0)}</div>
                        </td>
                        <td>{euro(r.retraitBrut)}</td>
                        <td>
                          {euro(r.partGains)}
                          <div className="pl-detail-cumul">Reste : {euro(r.totalInteretsRestants)}</div>
                        </td>
                        <td>
                          {euro(r.partCapital)}
                          <div className="pl-detail-cumul">Reste : {euro(r.totalCapitalRestant)}</div>
                        </td>
                        <td>{euro(r.fiscaliteTotal)}</td>
                        <td>{euro(r.retraitNet)}</td>
                        {produit2.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active && (
                          <td>{euro(r.capitalDecesTheorique || 0)}</td>
                        )}
                        <td>{euro(r.capitalFin)}</td>
                      </>
                    )}
                  </tr>
                )}
              />
            </div>
          )}
          <div className="pl-hint">
            <a href="/settings/base-contrat" style={{ color: 'var(--color-c2)', fontSize: 11 }}>Consulter la fiscalité des contrats →</a>
          </div>
        </div>
      )}

      {state.step === 'transmission' && (
        <>
          <div className="pl-ir-table-wrapper premium-card premium-section">
            <div className="pl-section-title premium-section-title">Transmission</div>
            <table className="pl-ir-table pl-table premium-table">
              <tbody>
                <tr>
                  <td>Âge au décès (simulation)</td>
                  <td colSpan={2}>
                    <div className="pl-field-container" style={{ alignItems: 'flex-end' }}>
                      <InputNumber
                        value={state.transmission.ageAuDeces}
                        onChange={(v) => setTransmission({ ageAuDeces: v })}
                        unit="ans"
                        min={state.client.ageActuel}
                        max={120}
                        inline
                      />
                      <div className="pl-field-help" style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
                        Minimum : {state.client.ageActuel} ans (âge actuel)
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Choix du bénéficiaire</td>
                  <td colSpan={2}>
                    <select
                      className="pl-select"
                      value={state.transmission.beneficiaryType || 'enfants'}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'conjoint') {
                          setTransmission({ beneficiaryType: value, nbBeneficiaires: 1 });
                        } else {
                          setTransmission({ beneficiaryType: value });
                        }
                      }}
                    >
                      {BENEFICIARY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                {state.transmission.beneficiaryType !== 'conjoint' && (
                  <tr>
                    <td>Nombre de bénéficiaires</td>
                    <td colSpan={2}>
                      <InputNumber
                        value={state.transmission.nbBeneficiaires}
                        onChange={(v) => setTransmission({ nbBeneficiaires: v })}
                        min={1}
                        max={10}
                        inline
                      />
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Tranche DMTG estimée</td>
                  <td colSpan={2}>
                    <select
                      className="pl-select"
                      value={state.transmission.dmtgTaux}
                      onChange={(e) => {
                        const nextValue = parseFloat(e.target.value);
                        if (Number.isNaN(nextValue)) return;
                        setTransmission({ dmtgTaux: nextValue });
                      }}
                    >
                      {dmtgSelectOptions.map((option) => (
                        <option key={option.key || option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                {showDmtgDisclaimer && (
                  <tr>
                    <td colSpan={3}>
                      <div className="pl-alert pl-alert--warning">
                        ⚠️ Consommation estimée de la tranche DMTG (sur l’assiette réellement soumise aux DMTG) <sup>(1)</sup> :
                        <div style={{ marginTop: 6 }}>
                          <div>Placement 1 : {dmtgConsumptionPercentProduit1}%</div>
                          <div>Placement 2 : {dmtgConsumptionPercentProduit2}%</div>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          Pensez à ajuster la tranche DMTG pour refléter l’ensemble du patrimoine.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pl-section-title premium-section-title" style={{ marginTop: 24 }}>Détail des droits de succession</div>
            <table className="pl-ir-table pl-detail-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Capital transmis</th>
                  <th>Abattement</th>
                  <th>Assiette</th>
                  <th>PS</th>
                  <th>Taxes (Forfaitaire + DMTG)</th>
                  <th>Net transmis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{produit1?.envelopeLabel || 'Produit 1'}</td>
                  <td>{euro(produit1?.transmission?.capitalTransmis || 0)}</td>
                  <td>{euro(produit1?.transmission?.abattement || 0)}</td>
                  <td>{euro(produit1?.transmission?.assiette || 0)}</td>
                  <td>{formatPsMontant(psDecesProduit1, euro)}</td>
                  <td>{euro((produit1?.transmission?.taxeForfaitaire || 0) + (produit1?.transmission?.taxeDmtg || 0))}</td>
                  <td><strong>{euro(produit1?.transmission?.capitalTransmisNet || 0)}</strong></td>
                </tr>
                <tr>
                  <td>{produit2?.envelopeLabel || 'Produit 2'}</td>
                  <td>{euro(produit2?.transmission?.capitalTransmis || 0)}</td>
                  <td>{euro(produit2?.transmission?.abattement || 0)}</td>
                  <td>{euro(produit2?.transmission?.assiette || 0)}</td>
                  <td>{formatPsMontant(psDecesProduit2, euro)}</td>
                  <td>{euro((produit2?.transmission?.taxeForfaitaire || 0) + (produit2?.transmission?.taxeDmtg || 0))}</td>
                  <td><strong>{euro(produit2?.transmission?.capitalTransmisNet || 0)}</strong></td>
                </tr>
                {!hasTransmissionData && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-c8)', fontStyle: 'italic' }}>
                      Aucune donnée à afficher - Configurez les paramètres de transmission ci-dessus
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pl-disclaimer pl-transmission-info-card">
            <strong>Régimes applicables :</strong>
            <ul>
              <li>AV : 990 I (versements avant 70 ans) ou 757 B (après 70 ans)</li>
              <li>PER assurance : 990 I (décès avant 70 ans) ou 757 B (décès ≥ 70 ans)</li>
              <li>PER bancaire / CTO / PEA / SCPI : intégration à l'actif successoral (DMTG)</li>
              <li>Conjoint / partenaire PACS : exonération du prélèvement 20 % et des DMTG</li>
            </ul>
            <p>
              <a href="/settings/impots" className="pl-transmission-info-card__link">Consulter le barème DMTG →</a>
            </p>
            <strong>Hypothèses PS décès :</strong>
            <p>
              Assurance-vie & PER simulés à 100 % en unités de compte (pas de fonds €). Les PS au décès sont appliqués au taux de {psSettings?.patrimony?.current?.totalRate ?? DEFAULT_PS_SETTINGS.patrimony.current.totalRate}% (<a href="/settings/prelevements" className="pl-transmission-info-card__link">paramétrable</a>), puis les montants nets alimentent les DMTG.
            </p>
            <p className="pl-transmission-info-card__note">
              La détermination de l’assiette taxable au prélèvement 990&nbsp;I s’effectue après imputation des PS dus sur les produits du contrat, prélevés par l’assureur au décès (BOI-TCAS-AUT-60).
            </p>
            <p className="pl-transmission-info-card__footnote"><sup>(1)</sup> Seuls les montants réellement soumis aux PS/DMTG sont utilisés pour les pourcentages affichés.</p>
          </div>
        </>
      )}
    </div>
  );
}
