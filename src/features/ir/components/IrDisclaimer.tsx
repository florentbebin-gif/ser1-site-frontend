import { useState } from 'react';
import { IconChevronDown } from '@/icons/ui';

interface IrDisclaimerProps {
  isIsolated: boolean;
}

export function IrDisclaimer({ isIsolated }: IrDisclaimerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ir-hypotheses">
      <button
        type="button"
        className="ir-hypotheses__toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        data-testid="ir-hypotheses-toggle"
      >
        <span className="ir-hypotheses__title">Hypothèses et limites</span>
        <IconChevronDown className={`ir-hypotheses__chevron${isOpen ? ' is-open' : ''}`} />
      </button>
      {isOpen && (
        <ul>
          <li>
            RCM au barème : abattement forfaitaire de 40&nbsp;% sur l&apos;assiette IR (simplifié).
          </li>
          <li>RFR (CEHR / CDHR) : revenu imposable + RCM au PFU (simplifié).</li>
          <li>
            CDHR : certains paramètres (décote / majorations) utilisent des valeurs par défaut si
            non paramétrés.
          </li>
          <li>
            Le simulateur ne prend pas en compte certaines situations particulières (enfants majeurs
            rattachés, pensions complexes, fiscalité étrangère, transfert de domicile en cours
            d&apos;année, …). Ces situations peuvent nécessiter une analyse personnalisée.
          </li>
          {isIsolated && (
            <li>
              Règle clé : quotient familial (part pour enfant à charge) et déduction de pension
              alimentaire s&apos;excluent — un même enfant ne peut bénéficier des deux mécanismes.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
