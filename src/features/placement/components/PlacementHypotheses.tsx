import { useState } from 'react';
import { IconChevronDown } from '@/icons/ui';

export function PlacementHypotheses() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pl-hypotheses">
      <button
        type="button"
        className="pl-hypotheses__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="placement-hypotheses-toggle"
      >
        <span className="pl-hypotheses__title">Hypothèses et limites</span>
        <IconChevronDown className={`pl-hypotheses__chevron${open ? ' is-open' : ''}`} />
      </button>
      {open && (
        <ul>
          <li>Les résultats sont indicatifs et ne constituent pas un conseil en investissement.</li>
          <li>
            Les rendements (capitalisation, distribution, liquidation) sont supposés constants sur
            toute la durée de la simulation.
          </li>
          <li>
            Les frais d&apos;entrée et de gestion sont pris en compte selon les paramètres saisis ;
            les frais d&apos;arbitrage ne sont pas inclus.
          </li>
          <li>
            La fiscalité est appliquée selon le TMI et le taux PFU paramétrés dans
            l&apos;application ; les situations particulières (IFI, revenus étrangers, reports de
            déficit) ne sont pas modélisées.
          </li>
          <li>
            Les prélèvements sociaux sont calculés selon le taux en vigueur paramétré dans
            l&apos;application.
          </li>
          <li>
            La transmission est simulée avec un taux DMTG fixe sélectionné, sans intégration des
            règles de rappel fiscal ni actualisation des règles fiscales futures.
          </li>
        </ul>
      )}
    </div>
  );
}
