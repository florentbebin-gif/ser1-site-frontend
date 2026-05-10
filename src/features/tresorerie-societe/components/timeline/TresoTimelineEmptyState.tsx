export function TresoTimelineEmptyState() {
  const openSociety = () => {
    window.dispatchEvent(new CustomEvent('ts:open-society-panel', { detail: 'identite' }));
  };

  return (
    <div className="ts-timeline-empty">
      <strong>Compléter la société et l’associé</strong>
      <p>
        Le parcours devient disponible dès que la société et l’âge de l’associé personne physique sont renseignés.
      </p>
      <button type="button" className="ts-secondary-btn" onClick={openSociety}>
        Compléter la société
      </button>
    </div>
  );
}
