import { useState } from 'react';
import { SimDisclosureButton } from '@/components/ui/sim';

export function PrevoyanceHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sim-hypotheses prevoyance-hypotheses">
      <SimDisclosureButton
        expanded={open}
        onToggle={() => setOpen((value) => !value)}
        className="sim-hypotheses__toggle"
        labelClosed="Hypothèses et limites"
        labelOpen="Hypothèses et limites"
        controls="prevoyance-hypotheses-panel"
      />

      {open ? (
        <ul id="prevoyance-hypotheses-panel" className="sim-hypotheses__body">
          <li>Les garanties du régime obligatoire proviennent des paramètres Prévoyance.</li>
          <li>
            Les contrats saisis représentent des hypothèses de couverture et doivent être rapprochés
            des notices contractuelles.
          </li>
          <li>
            Les résultats sont indicatifs et n’intègrent pas l’ensemble des exclusions, franchises
            ou clauses particulières.
          </li>
        </ul>
      ) : null}
    </div>
  );
}
