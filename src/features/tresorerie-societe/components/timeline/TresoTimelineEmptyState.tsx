import { SimActionButton } from '@/components/ui/sim';

export function TresoTimelineEmptyState() {
  const openSociety = () => {
    window.dispatchEvent(new CustomEvent('ts:open-society-panel', { detail: 'identite' }));
  };

  return (
    <div className="ts-timeline-empty">
      <strong>Compléter la société et l’associé</strong>
      <p>
        Le parcours devient disponible dès que la société et l’âge de l’associé personne physique
        sont renseignés.
      </p>
      <SimActionButton
        variant="edit"
        mode="text"
        label="Compléter la société"
        onClick={openSociety}
      />
    </div>
  );
}
