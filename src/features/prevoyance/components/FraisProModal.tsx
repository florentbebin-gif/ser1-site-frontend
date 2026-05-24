import { SimModalShell } from '@/components/ui/sim';
import type { FraisGenerauxEstimateState, FraisGenerauxNumericKey } from '../defaults';
import { euro } from '../formatters';
import { NumberInput, SimFieldShell } from './FormPrimitives';

const FRAIS_PRO_CATEGORIES: Array<{
  key: FraisGenerauxNumericKey;
  label: string;
  description: string;
  accounts: string;
}> = [
  {
    key: 'loyers',
    label: 'Locaux, matériel et véhicules',
    description:
      'Loyers, charges locatives, crédit-bail, entretien, énergie, location et usage des véhicules professionnels.',
    accounts: '612, 613, 614, 615, 6061, 6135, 6155, 625',
  },
  {
    key: 'chargesExternes',
    label: 'Exploitation et gestion courante',
    description:
      'Télécom, internet, courrier, fournitures, documentation, publicité, honoraires et frais de gestion.',
    accounts: '6063, 6064, 618, 622, 6226, 623, 626, 628',
  },
  {
    key: 'salaires',
    label: 'Personnel et remplacement',
    description:
      'Salariés habituels, charges patronales, intérim, prestataire ou remplaçant temporaire du dirigeant.',
    accounts: '621, 622, 628, 641, 645',
  },
  {
    key: 'assurances',
    label: 'Assurances, cotisations et taxes',
    description:
      'Assurances professionnelles, cotisations sociales personnelles obligatoires et impôts professionnels.',
    accounts: '616, 631, 633, 635, 646',
  },
  {
    key: 'fraisBancaires',
    label: 'Frais financiers',
    description: 'Intérêts d’emprunts, agios, frais bancaires et coûts de financement.',
    accounts: '627, 661',
  },
  {
    key: 'amortissements',
    label: 'Amortissements et pertes prévues',
    description:
      'Dotations aux amortissements et dépréciations de matières consommables si le contrat les prévoit.',
    accounts: '603, 6811, 6817',
  },
];

export function FraisProModal({
  state,
  onClose,
  onValidate,
  onChange,
}: {
  state: FraisGenerauxEstimateState;
  onClose: () => void;
  onValidate: () => void;
  onChange: (patch: Partial<FraisGenerauxEstimateState>) => void;
}) {
  const total =
    state.chargesExternes +
    state.loyers +
    state.assurances +
    state.salaires +
    state.amortissements +
    state.fraisBancaires;

  return (
    <SimModalShell
      title="Frais généraux"
      subtitle="Estimation de l’assiette de charges permanentes à maintenir pendant l’arrêt du dirigeant."
      onClose={onClose}
      modalClassName="prevoyance-frais-modal"
      footer={
        <>
          <span className="prevoyance-frais-modal__total">
            Assiette estimée : <strong>{euro(total)}</strong>
          </span>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={onValidate}
          >
            Valider
          </button>
        </>
      }
    >
      <div className="prevoyance-frais-modal__intro">
        <strong>À relever dans le compte de résultat ou le grand livre.</strong>
        <span>
          Additionnez les charges récurrentes et incompressibles qui continuent même si l’activité
          baisse pendant l’incapacité temporaire. Cette assiette n’écrase pas la garantie saisie
          dans le contrat.
        </span>
      </div>
      <div className="prevoyance-frais-grid">
        {FRAIS_PRO_CATEGORIES.map((category) => (
          <div key={category.key} className="prevoyance-frais-category">
            <SimFieldShell label={category.label}>
              <NumberInput
                value={Number(state[category.key]) || 0}
                onChange={(value) => onChange({ [category.key]: value })}
                suffix="€"
                ariaLabel={category.label}
              />
            </SimFieldShell>
            <p>{category.description}</p>
            <span>Comptes indicatifs : {category.accounts}</span>
          </div>
        ))}
      </div>
    </SimModalShell>
  );
}
