/**
 * CreditLoanForm.jsx - Formulaire de saisie d'un prêt (réutilisable)
 *
 * Accepte les données d'un prêt et ses callbacks de mutation.
 * Utilisé pour Prêt 1, 2 et 3 de manière identique.
 *
 * PR2: Prop isExpert → progressive disclosure (type, date, assurance avancée)
 */

import React from 'react';
import {
  InputEuro,
  InputPct,
  InputNumber,
  InputMonth,
  Select,
} from './CreditInputs.jsx';
import './CreditV2.css';

export function CreditLoanForm({
  pretNum,
  pretData,
  rawValues,
  globalStartYM,
  globalAssurMode,
  globalCreditType,
  mensualiteHorsAssurance,
  onPatch,
  formatTauxRaw,
  isExpert = true,
}) {
  if (!pretData) return null;

  const raw = rawValues || {};

  // Guidage séquentiel : premier champ non saisi (capital → duree → taux)
  const guideField =
    (pretData.capital || 0) === 0 ? 'capital' :
    (pretData.duree || 0) === 0 ? 'duree' :
    (pretData.taux || 0) === 0 ? 'taux' :
    null;

  return (
    <div className="cv2-loan-form" data-testid={`credit-form-pret${pretNum}`}>
      <div className="cv2-loan-form__grid">
        {/* Expert uniquement : type de crédit */}
        {isExpert && (
          <Select
            label="Type de crédit"
            value={pretData.type || globalCreditType}
            onChange={(v) => onPatch({ type: v })}
            options={[
              { value: 'amortissable', label: 'Amortissable' },
              { value: 'infine', label: 'In fine' },
            ]}
            testId={`credit-pret${pretNum}-type`}
          />
        )}
        {/* Expert uniquement : date de souscription */}
        {isExpert && (
          <InputMonth
            label="Date de souscription"
            value={pretData.startYM || globalStartYM}
            onChange={(v) => onPatch({ startYM: v })}
            testId={`credit-pret${pretNum}-start`}
          />
        )}
        <InputEuro
          label="Montant emprunté"
          value={pretData.capital}
          onChange={(v) => onPatch({ capital: v })}
          testId={`credit-pret${pretNum}-capital`}
          dataTestId={pretNum === 0 ? 'credit-capital-input' : undefined}
          highlight={guideField === 'capital'}
        />
        <InputNumber
          label="Durée"
          value={pretData.duree}
          onChange={(v) => onPatch({ duree: v })}
          unit="mois"
          min={1}
          max={600}
          testId={`credit-pret${pretNum}-duree`}
          highlight={guideField === 'duree'}
        />
        <InputPct
          label="Taux annuel (crédit)"
          rawValue={raw.taux || formatTauxRaw(pretData.taux)}
          onBlur={(v) => onPatch({ taux: v })}
          testId={`credit-pret${pretNum}-taux`}
          highlight={guideField === 'taux'}
        />
        {mensualiteHorsAssurance !== undefined && (
          <InputEuro
            label="Mensualité"
            value={Math.round(mensualiteHorsAssurance)}
            onChange={() => {}}
            disabled
            hint="Hors assurance"
            testId={`credit-pret${pretNum}-mensu`}
          />
        )}
      </div>

      {/* Bloc Assurance — masqué en mode simplifié (item 4) */}
      {isExpert && (
        <div className="cv2-loan-form__section" data-testid={pretNum === 0 ? 'credit-assurance-section' : undefined}>
          <div className="cv2-loan-form__section-title">Assurance emprunteur</div>
          <div className="cv2-loan-form__grid">
            <Select
              label="Mode de calcul"
              value={pretData.assurMode || globalAssurMode}
              onChange={(v) => onPatch({ assurMode: v })}
              options={[
                { value: 'CI', label: 'Sur capital initial' },
                { value: 'CRD', label: 'Sur capital restant dû' },
              ]}
              testId={`credit-pret${pretNum}-assurmode`}
            />
            <InputPct
              label="Taux annuel (assurance)"
              rawValue={raw.tauxAssur || formatTauxRaw(pretData.tauxAssur)}
              onBlur={(v) => onPatch({ tauxAssur: v })}
              testId={`credit-pret${pretNum}-tauxassur`}
            />
            <InputNumber
              label="Quotité assurée"
              value={pretData.quotite}
              onChange={(v) => onPatch({ quotite: v })}
              unit="%"
              min={0}
              max={100}
              testId={`credit-pret${pretNum}-quotite`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
