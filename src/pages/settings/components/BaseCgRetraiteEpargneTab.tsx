import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
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
      <label>
        Date de commercialisation
        <input
          value={draft.phaseEpargne.dateCommercialisation ?? ''}
          onChange={(event) =>
            onEpargneChange('dateCommercialisation', updateText(event.target.value))
          }
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
        TMG du contrat (fonds €)
        <input
          value={rateInputValue(draft.phaseEpargne.rendementFondsEuro)}
          onChange={(event) =>
            onEpargneChange('rendementFondsEuro', updateText(event.target.value))
          }
          placeholder="Ex : 3,5 % avant le 31/12/2016"
        />
        <small className="base-cg-modal__hint">
          Taux Minimum Garanti historique. Encadré par l'arrêté du 9 décembre 2016 (loi Sapin 2) et
          l'arrêté du 24 juillet 2018 (préparation loi PACTE). Les TMG anciens restent acquis aux
          versements antérieurs à la date de cessation.
        </small>
      </label>
      <label>
        Frais sur versements
        <input
          value={rateInputValue(draft.phaseEpargne.fraisVersements)}
          onChange={(event) => onEpargneChange('fraisVersements', updateText(event.target.value))}
        />
      </label>
      <label>
        Frais gestion fonds €
        <input
          value={rateInputValue(gestionFees.fraisGestionFondsEuro)}
          onChange={(event) =>
            onEpargneChange('fraisGestionFondsEuro', updateText(event.target.value))
          }
        />
      </label>
      <label>
        Frais gestion UC
        <input
          value={rateInputValue(gestionFees.fraisGestionUc)}
          onChange={(event) => onEpargneChange('fraisGestionUc', updateText(event.target.value))}
        />
      </label>
      <label>
        Frais d'arbitrage
        <input
          value={rateInputValue(draft.phaseEpargne.fraisArbitrage)}
          onChange={(event) => onEpargneChange('fraisArbitrage', updateText(event.target.value))}
        />
      </label>
      <label>
        Taux frais transfert sortant
        <input
          inputMode="decimal"
          value={rateInputValue(
            draft.phaseEpargne.fraisTransfertSortant ??
              draft.phaseEpargne.fraisTransfertSortantRate,
          )}
          onChange={(event) => {
            onEpargneChange('fraisTransfertSortant', updateText(event.target.value));
            if (!event.target.value.trim()) {
              onEpargneChange('fraisTransfertSortantRate', null);
            }
          }}
        />
      </label>
      <label className="base-cg-modal__wide">
        Modalités en cas de décès
        <textarea
          value={draft.phaseEpargne.clauseBeneficiaire ?? ''}
          onChange={(event) =>
            onEpargneChange('clauseBeneficiaire', updateText(event.target.value))
          }
          rows={3}
        />
      </label>
      <label className="base-cg-modal__wide">
        Garanties complémentaires
        <textarea
          value={draft.phaseEpargne.garantiesComplementaires ?? ''}
          onChange={(event) =>
            onEpargneChange('garantiesComplementaires', updateText(event.target.value))
          }
          rows={3}
        />
      </label>
    </>
  );
}
