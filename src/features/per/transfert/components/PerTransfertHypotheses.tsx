import { useState } from 'react';
import { SimDisclosureButton } from '@/components/ui/sim';
import { BASE_CG_RETRAITE_LEGAL_NOTICE } from '@/data/base-cg-retraite';

const HYPOTHESES_ID = 'per-transfert-hypotheses-list';

export function PerTransfertHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <section className="sim-hypotheses per-transfert-hypotheses">
      <SimDisclosureButton
        expanded={open}
        onToggle={() => setOpen((current) => !current)}
        labelClosed="Afficher les hypothèses et limites"
        labelOpen="Masquer les hypothèses et limites"
        controls={HYPOTHESES_ID}
        className="sim-hypotheses__toggle"
      />

      {open ? (
        <ul className="sim-hypotheses__body" id={HYPOTHESES_ID}>
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
