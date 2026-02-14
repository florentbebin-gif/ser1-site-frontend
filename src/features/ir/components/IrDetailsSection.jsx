import React from 'react';

export function IrDetailsSection({ showDetails, result, euro0, fmtPct, pfuRateIR }) {
  if (!(showDetails && result)) return null;

  return (
    <div className="ir-details">
      <h3>Détail du calcul</h3>

      <h4>Barème de l&apos;impôt sur le revenu</h4>
      <table className="ir-table premium-table">
        <thead>
          <tr>
            <th>Tranche</th>
            <th>Base (par part)</th>
            <th>Taux</th>
            <th>Impôt (par part)</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(result.bracketsDetails) ? result.bracketsDetails : []).map((row, idx) => (
            <tr key={idx}>
              <td>{row.label}</td>
              <td>{euro0(row.base)}</td>
              <td>{row.rate} %</td>
              <td>{euro0(row.tax)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="ir-table premium-table">
        <tbody>
          <tr>
            <td>Base imposable du foyer</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.taxableIncome)}</td>
          </tr>
          <tr>
            <td>Impôt avant quotient familial</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.irBeforeQfBase || 0)}</td>
          </tr>
          <tr>
            <td>Quotient familial</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.qfAdvantage || 0)}</td>
          </tr>
          <tr>
            <td>Impôt après quotient familial</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.irAfterQf || 0)}</td>
          </tr>
          {(result.domAbatementAmount || 0) > 0 && (
            <tr>
              <td>Abattement DOM</td>
              <td style={{ textAlign: 'right' }}>- {euro0(result.domAbatementAmount)}</td>
            </tr>
          )}
          <tr>
            <td>Impôt après abattement DOM</td>
            <td style={{ textAlign: 'right' }}>
              {euro0(Math.max(0, (result.irAfterQf || 0) - (result.domAbatementAmount || 0)))}
            </td>
          </tr>
          <tr>
            <td>Réductions et crédits d&apos;impôt</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.creditsTotal || 0)}</td>
          </tr>
          <tr>
            <td>Décote</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.decote || 0)}</td>
          </tr>
          <tr>
            <td>Impôt après réductions, crédits d&apos;impôt et décote</td>
            <td style={{ textAlign: 'right' }}>{euro0(result.irNet || 0)}</td>
          </tr>
        </tbody>
      </table>

      <h4>CEHR</h4>
      {result.cehrDetails && result.cehrDetails.length > 0 ? (
        <table className="ir-table premium-table">
          <thead>
            <tr>
              <th>Tranche RFR</th>
              <th>Base</th>
              <th>Taux</th>
              <th>CEHR</th>
            </tr>
          </thead>
          <tbody>
            {result.cehrDetails.map((row, idx) => (
              <tr key={idx}>
                <td>{row.label}</td>
                <td>{euro0(row.base)}</td>
                <td>{row.rate} %</td>
                <td>{euro0(row.tax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucune CEHR due.</p>
      )}

      <h4>CDHR</h4>
      {result.cdhrDetails ? (
        <table className="ir-table premium-table">
          <tbody>
            <tr>
              <td>Assiette (RFR)</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.assiette)}</td>
            </tr>

            <tr>
              <td>Terme A (avant décote) : {result.cdhrDetails.minRatePercent}% × assiette</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.termA_beforeDecote)}</td>
            </tr>

            <tr>
              <td>Décote CDHR appliquée</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.decoteApplied)}</td>
            </tr>

            <tr>
              <td><strong>Terme A (après décote)</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{euro0(result.cdhrDetails.termA_afterDecote)}</strong></td>
            </tr>

            <tr>
              <td>Terme B : IR retenu</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.irRetenu)}</td>
            </tr>

            <tr>
              <td>+ PFU {fmtPct(pfuRateIR)}% (part IR)</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.pfuIr)}</td>
            </tr>

            <tr>
              <td>+ CEHR</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.cehr)}</td>
            </tr>

            <tr>
              <td>+ Majorations (couple + charges) — charges : {result.cdhrDetails.personsAChargeCount}</td>
              <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.majorations)}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: 18, opacity: 0.85 }}>• Majoration couple</td>
              <td style={{ textAlign: 'right', opacity: 0.85 }}>{euro0(result.cdhrDetails.majCouple)}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: 18, opacity: 0.85 }}>• Majoration personnes à charge</td>
              <td style={{ textAlign: 'right', opacity: 0.85 }}>{euro0(result.cdhrDetails.majCharges)}</td>
            </tr>

            <tr>
              <td><strong>CDHR = max(0, Terme A (après décote) − Terme B)</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{euro0(result.cdhr || 0)}</strong></td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>Aucune CDHR due.</p>
      )}
    </div>
  );
}
