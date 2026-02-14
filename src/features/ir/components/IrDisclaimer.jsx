import React from 'react';

export function IrDisclaimer({ isIsolated }) {
  return (
    <div className="ir-disclaimer">
      <strong>Hypothèses / simplifications</strong>
      <p>RCM au barème : abattement forfaitaire de 40% sur l&apos;assiette IR (simplifié).</p>
      <p>RFR (CEHR / CDHR) : revenu imposable + RCM au PFU (simplifié).</p>
      <p>CDHR : certains paramètres (décote / majorations) utilisent des valeurs par défaut si non paramétrés.</p>
      <p>
        Le simulateur ne prend pas en compte certaines situations particulières (enfants majeurs rattachés,
        pensions complexes, fiscalité étrangère, transfert de domicile en cours d'année, ...).
        <br />
        Ces situations peuvent nécessiter une analyse personnalisée.
      </p>
      {isIsolated && (
        <p>
          Règle clé : quotient familial (part pour enfant à charge) et déduction de pension alimentaire
          s&apos;excluent : un même enfant ne peut bénéficier des deux mécanismes.
        </p>
      )}
    </div>
  );
}
