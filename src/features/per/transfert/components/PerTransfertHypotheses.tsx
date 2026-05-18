import { useState } from 'react';
import { BASE_CG_RETRAITE_LEGAL_NOTICE } from '@/data/base-cg-retraite';

export function PerTransfertHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <section className="per-transfert-hypotheses">
      <button
        type="button"
        className="per-transfert-hypotheses__toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="per-transfert-hypotheses__title">Hypothèses et limites</span>
        <svg
          viewBox="0 0 12 8"
          className={`per-transfert-hypotheses__chevron${open ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <ul className="per-transfert-hypotheses__list">
          <li>
            Le scénario Conserver maintient le contrat actuel avec les performances, versements et
            revalorisations saisis.
          </li>
          <li>
            Le scénario Transférer applique les frais sortants puis les frais d’entrée du nouveau
            PER, sans fiscalité au transfert.
          </li>
          <li>
            La table du nouveau PER est TGH05 ou TGF05 selon le sexe assuré, sauf cas spécifique des
            contrats en points.
          </li>
          <li>
            La rente est fiscalisée selon le compartiment cible, les paramètres fiscaux chargés et
            l’âge de liquidation.
          </li>
          <li>
            La sortie capital du compartiment C3 reste neutralisée hors éligibilité petite rente.
          </li>
          <li>
            Les avantages contractuels du contrat actuel doivent être relus dans les conditions
            générales avant recommandation.
          </li>
          <li>
            {BASE_CG_RETRAITE_LEGAL_NOTICE} Il convient de se rapprocher de la compagnie pour
            confirmer la dernière version applicable.
          </li>
        </ul>
      ) : null}
    </section>
  );
}
