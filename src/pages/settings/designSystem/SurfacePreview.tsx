const flatTiles = [
  { label: 'Objectifs', value: 'à compléter' },
  { label: 'Alertes', value: 'à venir' },
  { label: 'Pistes', value: 'à venir' },
];

export function DesignSystemSurfacePreview() {
  return (
    <div className="settings-design-system__stack">
      <p className="settings-design-system__note">
        Taxonomie à 4 niveaux (`docs/AUDIT_COCKPIT.md` §10) : carte élevée → bande → ligne KPI →
        micro-tuile plate. Aucune surface élevée dans une surface élevée. Garde-fou :
        `check:sim-cards`.
      </p>

      <article className="premium-card settings-design-system__surface-demo">
        <div className="sim-card__header">
          <span className="sim-card__title">Carte — surface élevée</span>
          <span className="sim-card__subtitle">
            Bordure + rayon + ombre. Aucune carte élevée imbriquée à l’intérieur.
          </span>
        </div>

        <div className="sim-band sim-band--first">
          <span className="settings-design-system__surface-tag">
            Bande — section sans élévation, filet discret
          </span>
          <div className="sim-kpi-line">
            <span className="sim-kpi-line__label">Patrimoine net</span>
            <span className="sim-kpi-line__value">à compléter</span>
          </div>
          <div className="sim-kpi-line">
            <span className="sim-kpi-line__label">Complétude F1</span>
            <span className="sim-kpi-line__value">partielle</span>
          </div>
        </div>

        <div className="sim-band">
          <span className="settings-design-system__surface-tag">
            Micro-tuiles plates — fond muted, sans ombre ni bordure forte
          </span>
          <div className="settings-design-system__tile-row">
            {flatTiles.map(({ label, value }) => (
              <div className="sim-tile-flat" key={label}>
                <span className="sim-tile-flat__label">{label}</span>
                <span className="sim-tile-flat__value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
