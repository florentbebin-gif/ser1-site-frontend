// @ts-nocheck
import React from 'react';
import { DEFAULT_PS_SETTINGS } from '@/constants/settingsDefaults';
import { euro, formatPsMontant } from '../utils/formatters';
import { BENEFICIARY_OPTIONS } from '../utils/normalizers';
import { InputNumber } from './inputs';

export function PlacementTransmissionSection({
  state,
  setTransmission,
  produit1,
  produit2,
  dmtgSelectOptions,
  showDmtgDisclaimer,
  dmtgConsumptionPercentProduit1,
  dmtgConsumptionPercentProduit2,
  psSettings,
}) {
  const psDecesProduit1 = produit1?.transmission?.psDeces;
  const psDecesProduit2 = produit2?.transmission?.psDeces;
  const hasTransmissionData = Boolean(produit1 || produit2);

  return (
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
                    onChange={(value) => setTransmission({ ageAuDeces: value })}
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
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === 'conjoint') {
                      setTransmission({ beneficiaryType: value, nbBeneficiaires: 1 });
                      return;
                    }
                    setTransmission({ beneficiaryType: value });
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
                    onChange={(value) => setTransmission({ nbBeneficiaires: value })}
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
                  onChange={(event) => {
                    const nextValue = parseFloat(event.target.value);
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
  );
}

