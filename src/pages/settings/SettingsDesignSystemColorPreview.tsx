import type { CSSProperties } from 'react';
import { COLOR_USAGE_GUIDELINES } from '@/settings/theme/colorUsageGuidelines';
import { DEFAULT_COLORS, type ThemeColors } from '@/settings/theme';
import { formatContrastRatio, getContrastRating, getContrastRatio } from './designSystemContrast';

const themeColorKeys = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'] as const;
type ThemeColorKey = (typeof themeColorKeys)[number];

type SwatchStyle = CSSProperties & {
  '--settings-color-swatch'?: string;
  '--settings-contrast-fg'?: string;
  '--settings-contrast-bg'?: string;
};

const semanticAliases = [
  { token: '--surface-page', source: 'var(--color-c7)', usage: 'Fond global' },
  { token: '--surface-card', source: 'color-mix(C7, blanc)', usage: 'Cartes et modales' },
  { token: '--surface-muted', source: 'color-mix(C7, blanc)', usage: 'Zones douces' },
  { token: '--surface-elevated', source: 'color-mix(C7, blanc)', usage: 'Surfaces élevées' },
  { token: '--text-primary', source: 'var(--color-c10)', usage: 'Texte principal' },
  { token: '--text-secondary', source: 'var(--color-c9)', usage: 'Labels et meta' },
  { token: '--text-muted', source: 'var(--color-c5)', usage: 'Texte discret' },
  { token: '--text-on-action', source: 'var(--color-c7)', usage: 'Texte sur action' },
  { token: '--border-default', source: 'var(--color-c8)', usage: 'Bordures' },
  { token: '--border-strong', source: 'var(--color-c3)', usage: 'Bordures actives' },
  { token: '--border-subtle', source: 'color-mix(C8, C7)', usage: 'Séparateurs doux' },
  { token: '--action-primary', source: 'var(--color-c2)', usage: 'Action principale' },
  { token: '--action-primary-hover', source: 'color-mix(C2, C1)', usage: 'Survol action' },
  { token: '--action-secondary', source: 'var(--color-c1)', usage: 'Action secondaire' },
  { token: '--state-success', source: 'var(--color-c2)', usage: 'Succès' },
  { token: '--state-warning', source: 'var(--color-c6)', usage: 'Attention' },
  { token: '--state-danger', source: 'var(--color-c1)', usage: 'Danger' },
  { token: '--state-info', source: 'var(--color-c3)', usage: 'Information' },
  { token: '--overlay-modal', source: 'color-mix(C10, transparent)', usage: 'Overlay' },
  { token: '--focus-ring-color', source: 'var(--color-c3)', usage: 'Focus visible' },
] as const;

const contrastChecks = [
  { label: 'Texte primaire / surface', foreground: 'c10', background: 'c7' },
  { label: 'Texte secondaire / surface', foreground: 'c9', background: 'c7' },
  { label: 'Ancrage / surface', foreground: 'c1', background: 'c7' },
  { label: 'Action primaire / surface', foreground: 'c2', background: 'c7' },
  { label: 'Danger / surface', foreground: 'c1', background: 'c7' },
  { label: 'Succès / surface', foreground: 'c2', background: 'c7' },
  { label: 'Attention / surface', foreground: 'c6', background: 'c7' },
] as const satisfies Array<{
  label: string;
  foreground: ThemeColorKey;
  background: ThemeColorKey;
}>;

function readLiveThemeColors(): ThemeColors {
  if (typeof window === 'undefined') {
    return DEFAULT_COLORS;
  }
  const styles = window.getComputedStyle(document.documentElement);
  const colors = { ...DEFAULT_COLORS };
  for (const key of themeColorKeys) {
    const cssValue = styles.getPropertyValue(`--color-${key}`).trim();
    if (cssValue) {
      colors[key] = cssValue;
    }
  }
  return colors;
}

export function SettingsDesignSystemColorPreview() {
  const colors = readLiveThemeColors();

  return (
    <div className="settings-design-system__stack">
      <article className="settings-design-system__ui-card">
        <h3>Palette C1-C10</h3>
        <div className="settings-design-system__palette-grid">
          {COLOR_USAGE_GUIDELINES.map((guide) => {
            const key = guide.themeKey as ThemeColorKey;
            return (
              <div className="settings-design-system__color-token" key={guide.token}>
                <span
                  aria-hidden="true"
                  className="settings-design-system__color-swatch"
                  style={{ '--settings-color-swatch': `var(--color-${key})` } as SwatchStyle}
                />
                <div>
                  <strong>{guide.token}</strong>
                  <code>{colors[key]}</code>
                  <p>{guide.usage}</p>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="settings-design-system__ui-card">
        <h3>Alias sémantiques</h3>
        <div className="settings-design-system__alias-grid">
          {semanticAliases.map((alias) => (
            <div className="settings-design-system__alias-token" key={alias.token}>
              <code>{alias.token}</code>
              <span>{alias.source}</span>
              <p>{alias.usage}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Contrastes informatifs</h3>
          <div className="settings-design-system__contrast-grid">
            {contrastChecks.map((check) => {
              const ratio = getContrastRatio(colors[check.foreground], colors[check.background]);
              const rating = getContrastRating(ratio);
              return (
                <div className="settings-design-system__contrast-row" key={check.label}>
                  <span
                    aria-hidden="true"
                    className="settings-design-system__contrast-sample"
                    style={
                      {
                        '--settings-contrast-fg': `var(--color-${check.foreground})`,
                        '--settings-contrast-bg': `var(--color-${check.background})`,
                      } as SwatchStyle
                    }
                  >
                    Aa
                  </span>
                  <div>
                    <strong>{check.label}</strong>
                    <span>
                      {formatContrastRatio(ratio)} · {rating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Usages couleurs</h3>
          <div className="settings-design-system__rule-grid">
            <div>
              <strong>Autorisé</strong>
              <ul>
                <li>Alias sémantiques dérivés de C1-C10.</li>
                <li>Primitives Sim* et tokens partagés.</li>
                <li>Blanc pur seulement pour cartes, modales et chips.</li>
              </ul>
            </div>
            <div>
              <strong>Interdit</strong>
              <ul>
                <li>Nouvel hex local dans une page ou un graphe.</li>
                <li>Statut ou overlay sans token.</li>
                <li>Texte gris sur fond gris sans contraste vérifié.</li>
              </ul>
            </div>
          </div>
        </article>
      </div>

      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Settings UI vs Simulator UI</h3>
          <div className="settings-design-system__boundary-grid">
            <div>
              <strong>Settings UI</strong>
              <p>Administration dense : tables, cartes settings, champs natifs autorisés.</p>
            </div>
            <div>
              <strong>Simulator UI</strong>
              <p>Expérience conseiller : SimPageShell, primitives Sim*, KPI et états guidés.</p>
            </div>
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Composants manquants ou non canoniques</h3>
          <div className="settings-design-system__missing-list" aria-label="Composants à cadrer">
            {[
              'Checkbox',
              'Switch',
              'Radio',
              'Textarea',
              'Date',
              'Alert / toast',
              'Drawer',
              'Tabs / accordion',
            ].map((label) => (
              <span className="settings-design-system__missing-pill" key={label}>
                {label}
              </span>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
