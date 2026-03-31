/**
 * SynthesePotentielStep — Step 4: results display with plafonds, IR, and simulation.
 */

import React from 'react';
import type { PerPotentielResult } from '../../../../../engine/per';

interface SynthesePotentielStepProps {
  result: PerPotentielResult | null;
  isCouple: boolean;
  modeVersement: boolean;
  versementEnvisage: number;
  onSetVersement: (_v: number) => void;
}

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  `${(v <= 1 ? v * 100 : v).toFixed(1)} %`;

function PlafondTable({ label, p }: {
  label: string;
  p: { plafondCalculeN: number; nonUtiliseN1: number; nonUtiliseN2: number; nonUtiliseN3: number; totalDisponible: number; cotisationsDejaVersees: number; disponibleRestant: number; depassement: boolean };
}): React.ReactElement {
  return (
    <div className="per-plafond-block">
      <h4 className="per-section-label">{label}</h4>
      <table className="per-sortie-table">
        <tbody>
          <tr><td>Plafond calculé année N</td><td className="text-right">{fmt(p.plafondCalculeN)}</td></tr>
          {p.nonUtiliseN3 > 0 && <tr><td>Report N-3 (plus ancien)</td><td className="text-right">{fmt(p.nonUtiliseN3)}</td></tr>}
          {p.nonUtiliseN2 > 0 && <tr><td>Report N-2</td><td className="text-right">{fmt(p.nonUtiliseN2)}</td></tr>}
          {p.nonUtiliseN1 > 0 && <tr><td>Report N-1</td><td className="text-right">{fmt(p.nonUtiliseN1)}</td></tr>}
          <tr style={{ fontWeight: 600 }}><td>Total disponible</td><td className="text-right">{fmt(p.totalDisponible)}</td></tr>
          <tr><td>Cotisations déjà versées</td><td className="text-right">{fmt(p.cotisationsDejaVersees)}</td></tr>
          <tr style={{ fontWeight: 600, color: p.depassement ? 'var(--color-c1)' : undefined }}>
            <td>Disponible restant</td>
            <td className="text-right">{fmt(p.disponibleRestant)}{p.depassement ? ' ⚠' : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function SynthesePotentielStep({
  result, isCouple, modeVersement, versementEnvisage, onSetVersement,
}: SynthesePotentielStepProps): React.ReactElement {
  if (!result) {
    return (
      <div className="per-step">
        <p style={{ color: 'var(--color-c9)' }}>Complétez les étapes précédentes pour voir les résultats.</p>
      </div>
    );
  }

  const { situationFiscale: sf, plafond163Q, plafondMadelin, estTNS, declaration2042, simulation, warnings } = result;

  return (
    <div className="per-step">
      <h2 className="per-step-title">Synthèse du potentiel épargne retraite</h2>

      {/* Situation fiscale */}
      <div className="per-card">
        <h3 className="per-card-subtitle">Situation fiscale estimée</h3>
        <div className="per-kpis">
          <div className="per-kpi">
            <div className="per-kpi-label">TMI</div>
            <div className="per-kpi-value">{fmtPct(sf.tmi)}</div>
          </div>
          <div className="per-kpi">
            <div className="per-kpi-label">IR estimé</div>
            <div className="per-kpi-value">{fmt(sf.irEstime)}</div>
          </div>
          {sf.cehr > 0 && (
            <div className="per-kpi">
              <div className="per-kpi-label">CEHR</div>
              <div className="per-kpi-value">{fmt(sf.cehr)}</div>
            </div>
          )}
          {sf.montantDansLaTMI > 0 && (
            <div className="per-kpi">
              <div className="per-kpi-label">Marge dans la TMI</div>
              <div className="per-kpi-value">{fmt(sf.montantDansLaTMI)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Plafonds 163Q */}
      <div className="per-card">
        <h3 className="per-card-subtitle">Plafonds 163 quatervicies (personnel)</h3>
        <PlafondTable label="Déclarant 1" p={plafond163Q.declarant1} />
        {isCouple && plafond163Q.declarant2 && (
          <PlafondTable label="Déclarant 2" p={plafond163Q.declarant2} />
        )}
      </div>

      {/* Plafonds Madelin */}
      {estTNS && plafondMadelin && (
        <div className="per-card">
          <h3 className="per-card-subtitle">Plafonds Madelin 154 bis (TNS)</h3>
          {plafondMadelin.declarant1 && (
            <div className="per-plafond-block">
              <h4 className="per-section-label">Déclarant 1</h4>
              <table className="per-sortie-table">
                <tbody>
                  <tr><td>Assiette Madelin</td><td className="text-right">{fmt(plafondMadelin.declarant1.assiette)}</td></tr>
                  <tr><td>Enveloppe 15%</td><td className="text-right">{fmt(plafondMadelin.declarant1.enveloppe15)}</td></tr>
                  <tr><td>Enveloppe 10%</td><td className="text-right">{fmt(plafondMadelin.declarant1.enveloppe10)}</td></tr>
                  <tr style={{ fontWeight: 600 }}><td>Potentiel total</td><td className="text-right">{fmt(plafondMadelin.declarant1.potentielTotal)}</td></tr>
                  <tr><td>Cotisations versées</td><td className="text-right">{fmt(plafondMadelin.declarant1.cotisationsVersees)}</td></tr>
                  <tr style={{ fontWeight: 600 }}><td>Disponible restant</td><td className="text-right">{fmt(plafondMadelin.declarant1.disponibleRestant)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
          {isCouple && plafondMadelin.declarant2 && (
            <div className="per-plafond-block">
              <h4 className="per-section-label">Déclarant 2</h4>
              <table className="per-sortie-table">
                <tbody>
                  <tr><td>Assiette Madelin</td><td className="text-right">{fmt(plafondMadelin.declarant2.assiette)}</td></tr>
                  <tr><td>Enveloppe 15%</td><td className="text-right">{fmt(plafondMadelin.declarant2.enveloppe15)}</td></tr>
                  <tr><td>Enveloppe 10%</td><td className="text-right">{fmt(plafondMadelin.declarant2.enveloppe10)}</td></tr>
                  <tr style={{ fontWeight: 600 }}><td>Potentiel total</td><td className="text-right">{fmt(plafondMadelin.declarant2.potentielTotal)}</td></tr>
                  <tr><td>Cotisations versées</td><td className="text-right">{fmt(plafondMadelin.declarant2.cotisationsVersees)}</td></tr>
                  <tr style={{ fontWeight: 600 }}><td>Disponible restant</td><td className="text-right">{fmt(plafondMadelin.declarant2.disponibleRestant)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="per-card">
        <h3 className="per-card-subtitle">Cases 2042 simulées</h3>
        <table className="per-sortie-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Libellé</th>
              <th className="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>6NS</td><td>PER 163 quatervicies — Déclarant 1</td><td className="text-right">{fmt(declaration2042.case6NS)}</td></tr>
            {isCouple && <tr><td>6NT</td><td>PER 163 quatervicies — Déclarant 2</td><td className="text-right">{fmt(declaration2042.case6NT || 0)}</td></tr>}
            <tr><td>6RS</td><td>PERP et assimilés — Déclarant 1</td><td className="text-right">{fmt(declaration2042.case6RS)}</td></tr>
            {isCouple && <tr><td>6RT</td><td>PERP et assimilés — Déclarant 2</td><td className="text-right">{fmt(declaration2042.case6RT || 0)}</td></tr>}
            <tr><td>6QS</td><td>Art. 83 — Déclarant 1</td><td className="text-right">{fmt(declaration2042.case6QS)}</td></tr>
            {isCouple && <tr><td>6QT</td><td>Art. 83 — Déclarant 2</td><td className="text-right">{fmt(declaration2042.case6QT || 0)}</td></tr>}
            <tr><td>6OS</td><td>PER 154 bis — Déclarant 1</td><td className="text-right">{fmt(declaration2042.case6OS)}</td></tr>
            {isCouple && <tr><td>6OT</td><td>PER 154 bis — Déclarant 2</td><td className="text-right">{fmt(declaration2042.case6OT || 0)}</td></tr>}
            {isCouple && <tr><td>6QR</td><td>Mutualisation des plafonds</td><td className="text-right">{declaration2042.case6QR ? 'Oui' : 'Non'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Simulation versement */}
      {modeVersement && (
        <div className="per-card">
          <h3 className="per-card-subtitle">Simulation d'un versement</h3>
          <div className="per-fields" style={{ maxWidth: 300, marginBottom: '1rem' }}>
            <div className="per-field">
              <label>Versement envisagé (€)</label>
              <input type="number" min={0} value={versementEnvisage || ''} placeholder="Ex : 5 000"
                onChange={(e) => onSetVersement(Number(e.target.value) || 0)} />
            </div>
          </div>
          {simulation && (
            <div className="per-kpis">
              <div className="per-kpi">
                <div className="per-kpi-label">Versement déductible</div>
                <div className="per-kpi-value">{fmt(simulation.versementDeductible)}</div>
              </div>
              <div className="per-kpi">
                <div className="per-kpi-label">Économie IR</div>
                <div className="per-kpi-value">{fmt(simulation.economieIRAnnuelle)}</div>
              </div>
              <div className="per-kpi">
                <div className="per-kpi-label">Coût net</div>
                <div className="per-kpi-value">{fmt(simulation.coutNetApresFiscalite)}</div>
              </div>
              <div className="per-kpi">
                <div className="per-kpi-label">Plafond restant après</div>
                <div className="per-kpi-value">{fmt(simulation.plafondRestantApres)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="per-warnings">
          {warnings.map((w, i) => (
            <div key={i} className={`per-warning per-warning--${w.severity}`}>
              {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
