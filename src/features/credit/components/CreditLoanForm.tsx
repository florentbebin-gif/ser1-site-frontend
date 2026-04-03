/**
 * CreditLoanForm.tsx - Formulaire de saisie d'un prêt (réutilisable)
 */

import {
  InputEuro,
  InputPct,
  InputNumber,
  InputMonth,
  Select,
} from './CreditInputs';
import type {
  CreditAssurMode,
  CreditLoanFormProps,
  CreditType,
} from '../types';

export function CreditLoanForm({
  pretNum,
  pretData,
  rawValues,
  globalStartYM,
  globalAssurMode,
  globalCreditType,
  onPatch,
  formatTauxRaw,
  isExpert = true,
}: CreditLoanFormProps) {
  if (!pretData) return null;

  const raw = rawValues;

  return (
    <div className="cv2-loan-form" data-testid={`credit-form-pret${pretNum}`}>
      {/* Montant + Durée — toujours visibles */}
      <div className="cv2-loan-form__grid">
        <InputEuro
          label="Montant emprunté"
          value={pretData.capital}
          onChange={(value) => onPatch({ capital: value })}
          testId={`credit-pret${pretNum}-capital`}
          dataTestId={pretNum === 0 ? 'credit-capital-input' : undefined}
        />
        <InputNumber
          label="Durée"
          value={pretData.duree}
          onChange={(value) => onPatch({ duree: value })}
          unit="mois"
          min={1}
          max={600}
          testId={`credit-pret${pretNum}-duree`}
        />
      </div>

      {/* Taux + Type + Date — 3 colonnes en expert, taux seul en simplifié */}
      {isExpert ? (
        <div className="cv2-loan-form__grid--3">
          <InputPct
            label="Taux annuel (crédit)"
            rawValue={raw?.taux || formatTauxRaw(pretData.taux)}
            onBlur={(value) => onPatch({ taux: value })}
            testId={`credit-pret${pretNum}-taux`}
          />
          <Select<CreditType>
            label="Type de crédit"
            value={pretData.type || globalCreditType}
            onChange={(value) => onPatch({ type: value })}
            options={[
              { value: 'amortissable', label: 'Amortissable' },
              { value: 'infine', label: 'In fine' },
            ]}
            testId={`credit-pret${pretNum}-type`}
          />
          <InputMonth
            label="Date de souscription"
            value={pretData.startYM || globalStartYM}
            onChange={(value) => onPatch({ startYM: value })}
            testId={`credit-pret${pretNum}-start`}
          />
        </div>
      ) : (
        <InputPct
          label="Taux annuel (crédit)"
          rawValue={raw?.taux || formatTauxRaw(pretData.taux)}
          onBlur={(value) => onPatch({ taux: value })}
          testId={`credit-pret${pretNum}-taux`}
        />
      )}

      {isExpert && (
        <>
          <div className="cv2-loan-card__divider" />
          <div className="cv2-loan-form__section cv2-loan-form__section--no-border" data-testid={pretNum === 0 ? 'credit-assurance-section' : undefined}>
            <div className="cv2-loan-form__section-title">Assurance emprunteur</div>
            <div className="cv2-loan-form__grid--3">
              <Select<CreditAssurMode>
                label="Mode de calcul"
                value={pretData.assurMode || globalAssurMode}
                onChange={(value) => onPatch({ assurMode: value })}
                options={[
                  { value: 'CI', label: 'Sur capital initial' },
                  { value: 'CRD', label: 'Sur capital restant dû' },
                ]}
                testId={`credit-pret${pretNum}-assurmode`}
              />
              <InputPct
                label="Taux annuel (assurance)"
                rawValue={raw?.tauxAssur || formatTauxRaw(pretData.tauxAssur)}
                onBlur={(value) => onPatch({ tauxAssur: value })}
                testId={`credit-pret${pretNum}-tauxassur`}
              />
              <InputNumber
                label="Quotité assurée"
                value={pretData.quotite}
                onChange={(value) => onPatch({ quotite: value })}
                unit="%"
                min={0}
                max={100}
                testId={`credit-pret${pretNum}-quotite`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
