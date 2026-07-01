import type { CSSProperties } from 'react';

type SwatchStyle = CSSProperties & {
  '--settings-color-swatch'?: string;
};

const categoricalTokens = [
  '--viz-1',
  '--viz-2',
  '--viz-3',
  '--viz-4',
  '--viz-5',
  '--viz-6',
  '--viz-7',
  '--viz-8',
];

const sequentialTokens = [
  '--viz-sequential-1',
  '--viz-sequential-2',
  '--viz-sequential-3',
  '--viz-sequential-4',
  '--viz-sequential-5',
];

const radarTokens = [
  { token: '--viz-current', label: 'Situation actuelle' },
  { token: '--viz-scenario', label: 'Scénario testé' },
];

const statusTokens = [
  { token: '--accent-signature', label: 'Signature — marque / version active' },
  { token: '--state-warning', label: 'Attention — alerte' },
];

const familyBranchTokens = [
  { token: '--audit-family-branch-client', label: 'Branche client' },
  { token: '--audit-family-branch-conjoint', label: 'Branche conjoint' },
];

function VizSwatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="settings-design-system__viz-swatch">
      <span
        aria-hidden="true"
        className="settings-design-system__color-swatch"
        style={{ '--settings-color-swatch': `var(${token})` } as SwatchStyle}
      />
      <code>{token}</code>
      {label ? <span className="settings-design-system__note">{label}</span> : null}
    </div>
  );
}

function FamilyBranchPreview() {
  return (
    <div className="settings-design-system__family-preview" aria-label="Aperçu branches famille">
      <div className="settings-design-system__family-card">
        <span
          className="settings-design-system__family-avatar"
          data-tone="neutral"
          aria-hidden="true"
        />
        <span>Enfant commun</span>
      </div>
      {familyBranchTokens.map(({ token, label }) => (
        <div
          className="settings-design-system__family-card"
          key={token}
          style={{ '--settings-family-branch': `var(${token})` } as CSSProperties}
        >
          <span
            className="settings-design-system__family-avatar"
            data-tone="branch"
            aria-hidden="true"
          />
          <span>{label}</span>
          <code>{token}</code>
        </div>
      ))}
    </div>
  );
}

export function DesignSystemVizPreview() {
  return (
    <div className="settings-design-system__stack">
      <p className="settings-design-system__note">
        Tokens data-viz du cockpit `/audit` : dérivés de C1-C10, sans hex runtime. Toute couleur de
        graphe passe par `--viz-*` ou `--state-*`. Garde-fou : `check:css-colors`.
      </p>

      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Séries catégorielles</h3>
          <p className="settings-design-system__note">
            `--viz-1` à `--viz-8` : séries d’un graphe multi-séries.
          </p>
          <div className="settings-design-system__viz-row">
            {categoricalTokens.map((token) => (
              <VizSwatch key={token} token={token} />
            ))}
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Radar — actuel vs scénario</h3>
          <p className="settings-design-system__note">
            Deux séries seulement. Le cuivre (`--accent-signature`) n’entre pas dans le radar.
          </p>
          <div className="settings-design-system__viz-row">
            {radarTokens.map(({ token, label }) => (
              <VizSwatch key={token} token={token} label={label} />
            ))}
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Rampe séquentielle</h3>
          <p className="settings-design-system__note">
            `--viz-sequential-1` à `-5` : mono-teinte pour anneaux de complétude et jauges.
          </p>
          <div className="settings-design-system__viz-row settings-design-system__viz-row--ramp">
            {sequentialTokens.map((token) => (
              <VizSwatch key={token} token={token} />
            ))}
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Alerte distincte de la signature</h3>
          <p className="settings-design-system__note">
            `--state-warning` est découplé de `--accent-signature` : l’alerte reste saillante, le
            cuivre reste un accent de marque, jamais un statut.
          </p>
          <div className="settings-design-system__viz-row">
            {statusTokens.map(({ token, label }) => (
              <VizSwatch key={token} token={token} label={label} />
            ))}
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Branches familiales audit</h3>
          <p className="settings-design-system__note">
            Les familles recomposées utilisent des aliases dérivés de C1-C10. Les couleurs restent
            sur les traits, liserés, anneaux et badges texte, jamais comme fond de carte.
          </p>
          <FamilyBranchPreview />
        </article>
      </div>
    </div>
  );
}
