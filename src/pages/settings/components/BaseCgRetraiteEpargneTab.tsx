import type { BaseCgRetraiteContract } from '@/data/basecg';
import {
  commitRate,
  formatFieldValue,
  formatRateLabel,
  formatRatePercent,
  parseOptionalInteger,
  parseRatePercent,
  rateInputValue,
  updateText,
} from './baseCgRetraiteModalUtils';

type EpargneSetter = <K extends keyof BaseCgRetraiteContract['phaseEpargne']>(
  _key: K,
  _value: BaseCgRetraiteContract['phaseEpargne'][K],
) => void;

interface Props {
  draft: BaseCgRetraiteContract;
  gestionFees: Pick<BaseCgRetraiteContract['phaseEpargne'], 'fraisGestionFondsEuro' | 'fraisGestionUc'>;
  onEpargneChange: EpargneSetter;
}

export function BaseCgRetraiteEpargneTab({ draft, gestionFees, onEpargneChange }: Props) {
  return (
    <>
      <label>
        Date de commercialisation
        <input
          value={draft.phaseEpargne.dateCommercialisation ?? ''}
          onChange={(event) => onEpargneChange('dateCommercialisation', updateText(event.target.value))}
        />
      </label>
      <label>
        Nombre de fonds
        <input
          value={formatFieldValue(draft.phaseEpargne.nombreFonds)}
          onChange={(event) => onEpargneChange('nombreFonds', updateText(event.target.value))}
        />
      </label>
      <label>
        Nombre d'UC
        <input
          inputMode="numeric"
          value={formatFieldValue(draft.phaseEpargne.nombreSupportsUc)}
          onChange={(event) => onEpargneChange('nombreSupportsUc', parseOptionalInteger(event.target.value))}
        />
      </label>
      <label>
        Répartition UC / fonds €
        <input
          value={draft.phaseEpargne.repartitionUcEuro ?? ''}
          onChange={(event) => onEpargneChange('repartitionUcEuro', updateText(event.target.value))}
        />
      </label>
      <label>
        TMG du contrat (fonds €)
        <input
          value={rateInputValue(draft.phaseEpargne.rendementFondsEuro)}
          onChange={(event) => onEpargneChange('rendementFondsEuro', commitRate(event.target.value))}
          placeholder="Ex : 3,5 % avant le 31/12/2016"
        />
        <small className="base-cg-modal__hint">
          Taux Minimum Garanti historique. Encadré par l'arrêté du 9 décembre 2016 (loi Sapin 2)
          et l'arrêté du 24 juillet 2018 (préparation loi PACTE). Les TMG anciens restent acquis
          aux versements antérieurs à la date de cessation.
        </small>
      </label>
      <label>
        Fonds € garantis
        <input
          value={rateInputValue(draft.phaseEpargne.fondsEuroGarantis)}
          onChange={(event) => onEpargneChange('fondsEuroGarantis', commitRate(event.target.value))}
        />
      </label>
      <label>
        Frais sur versements
        <input
          value={rateInputValue(draft.phaseEpargne.fraisVersements)}
          onChange={(event) => onEpargneChange('fraisVersements', commitRate(event.target.value))}
        />
      </label>
      <label>
        Frais gestion fonds €
        <input
          value={rateInputValue(gestionFees.fraisGestionFondsEuro)}
          onChange={(event) => onEpargneChange('fraisGestionFondsEuro', commitRate(event.target.value))}
        />
      </label>
      <label>
        Frais gestion UC
        <input
          value={rateInputValue(gestionFees.fraisGestionUc)}
          onChange={(event) => onEpargneChange('fraisGestionUc', commitRate(event.target.value))}
        />
      </label>
      <label>
        Frais d'arbitrage
        <input
          value={rateInputValue(draft.phaseEpargne.fraisArbitrage)}
          onChange={(event) => onEpargneChange('fraisArbitrage', commitRate(event.target.value))}
        />
      </label>
      <label>
        Taux frais transfert sortant
        <input
          type="number"
          value={formatRatePercent(draft.phaseEpargne.fraisTransfertSortantRate)}
          onChange={(event) => {
            const rate = parseRatePercent(event.target.value);
            onEpargneChange('fraisTransfertSortantRate', rate);
            onEpargneChange('fraisTransfertSortant', formatRateLabel(rate));
          }}
        />
      </label>
      <label className="base-cg-modal__wide">
        Modalités en cas de décès
        <textarea
          value={draft.phaseEpargne.clauseBeneficiaire ?? ''}
          onChange={(event) => onEpargneChange('clauseBeneficiaire', updateText(event.target.value))}
          rows={3}
        />
      </label>
      <label className="base-cg-modal__wide">
        Garanties complémentaires
        <textarea
          value={draft.phaseEpargne.garantiesComplementaires ?? ''}
          onChange={(event) => onEpargneChange('garantiesComplementaires', updateText(event.target.value))}
          rows={3}
        />
      </label>
    </>
  );
}
