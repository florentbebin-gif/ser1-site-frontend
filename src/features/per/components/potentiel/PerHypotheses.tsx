import { useState } from 'react';
import { SimDisclosureButton } from '@/components/ui/sim';

const PER_ASSUMPTIONS: string[] = [
  "Plafonds de déduction calculés selon l'art. 163 quatervicies du CGI.",
  'PASS retenu : valeur administrée dans les paramètres fiscaux (Settings > Prélèvements).',
  'Plafond Madelin (art. 154 bis) : 10 % du bénéfice imposable plafonné à 8 PASS, majoré de 15 % entre 1 et 8 PASS.',
  'Les versements obligatoires employeur (art. 83 / PERO / PEROB) viennent en déduction du plafond 163 quatervicies.',
  'La mutualisation des plafonds entre conjoints (case 6QR) suppose une imposition commune.',
  "Les revenus projetés pour l'année en cours sont estimatifs et ne remplacent pas la déclaration définitive.",
  'L’estimation 2026 utilise le dernier barème IR disponible dans Settings > Impôts (barème 2026 sur revenus 2025) ; elle devra être actualisée lorsque le barème suivant sera connu.',
  "Date limite de versement déductible : 31 décembre de l'année fiscale en cours.",
];

export function PerHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="per-hypotheses">
      <SimDisclosureButton
        expanded={open}
        onToggle={() => setOpen((prev) => !prev)}
        labelOpen="Hypothèses et limites"
        labelClosed="Hypothèses et limites"
        controls="per-hypotheses-list"
        className="per-hypotheses__toggle"
      />
      {open && (
        <ul id="per-hypotheses-list" className="per-hypotheses__list">
          {PER_ASSUMPTIONS.map((assumption, index) => (
            <li key={`per-hyp-${index}`}>{assumption}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
