import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { BaseCgTextField, BaseCgTextareaField } from './BaseCgRetraiteModalFields';
import { formatFieldValue, rateInputValue, updateText } from './baseCgRetraiteModalUtils';

type EpargneSetter = <K extends keyof BaseCgRetraiteContract['phaseEpargne']>(
  _key: K,
  _value: BaseCgRetraiteContract['phaseEpargne'][K],
) => void;

interface Props {
  draft: BaseCgRetraiteContract;
  gestionFees: Pick<
    BaseCgRetraiteContract['phaseEpargne'],
    'fraisGestionFondsEuro' | 'fraisGestionUc'
  >;
  onEpargneChange: EpargneSetter;
}

export function BaseCgRetraiteEpargneTab({ draft, gestionFees, onEpargneChange }: Props) {
  return (
    <>
      <BaseCgTextField
        label="Date de commercialisation"
        value={draft.phaseEpargne.dateCommercialisation ?? ''}
        onChange={(value) => onEpargneChange('dateCommercialisation', updateText(value))}
      />
      <BaseCgTextField
        label="Nombre de fonds"
        value={formatFieldValue(draft.phaseEpargne.nombreFonds)}
        onChange={(value) => onEpargneChange('nombreFonds', updateText(value))}
      />
      <BaseCgTextField
        label="TMG du contrat (fonds €)"
        value={rateInputValue(draft.phaseEpargne.rendementFondsEuro)}
        placeholder="Ex : 3,5 % avant le 31/12/2016"
        hint="Taux Minimum Garanti historique. Encadré par l'arrêté du 9 décembre 2016 (loi Sapin 2) et l'arrêté du 24 juillet 2018 (préparation loi PACTE). Les TMG anciens restent acquis aux versements antérieurs à la date de cessation."
        onChange={(value) => onEpargneChange('rendementFondsEuro', updateText(value))}
      />
      <BaseCgTextField
        label="Frais sur versements"
        value={rateInputValue(draft.phaseEpargne.fraisVersements)}
        onChange={(value) => onEpargneChange('fraisVersements', updateText(value))}
      />
      <BaseCgTextField
        label="Frais gestion fonds €"
        value={rateInputValue(gestionFees.fraisGestionFondsEuro)}
        onChange={(value) => onEpargneChange('fraisGestionFondsEuro', updateText(value))}
      />
      <BaseCgTextField
        label="Frais gestion UC"
        value={rateInputValue(gestionFees.fraisGestionUc)}
        onChange={(value) => onEpargneChange('fraisGestionUc', updateText(value))}
      />
      <BaseCgTextField
        label="Frais d'arbitrage"
        value={rateInputValue(draft.phaseEpargne.fraisArbitrage)}
        onChange={(value) => onEpargneChange('fraisArbitrage', updateText(value))}
      />
      <BaseCgTextField
        label="Taux frais transfert sortant"
        inputMode="decimal"
        value={rateInputValue(
          draft.phaseEpargne.fraisTransfertSortant ?? draft.phaseEpargne.fraisTransfertSortantRate,
        )}
        onChange={(value) => {
          onEpargneChange('fraisTransfertSortant', updateText(value));
          if (!value.trim()) {
            onEpargneChange('fraisTransfertSortantRate', null);
          }
        }}
      />
      <BaseCgTextareaField
        label="Modalités en cas de décès"
        className="base-cg-modal__wide"
        value={draft.phaseEpargne.clauseBeneficiaire ?? ''}
        onChange={(value) => onEpargneChange('clauseBeneficiaire', updateText(value))}
      />
      <BaseCgTextareaField
        label="Garanties complémentaires"
        className="base-cg-modal__wide"
        value={draft.phaseEpargne.garantiesComplementaires ?? ''}
        onChange={(value) => onEpargneChange('garantiesComplementaires', updateText(value))}
      />
    </>
  );
}
