import { useState, type ReactNode } from 'react';
import '@/styles/sim/index.css';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
  SimActionButton,
  SimCollapsibleTable,
  SimDelta,
  SimDisclosureButton,
  SimEmptyState,
  SimInfoButton,
  SimKpiReference,
  SimMetric,
  SimModalSectionNav,
  SimModalShell,
  SimMobileStickyActions,
  SimSegmentedControl,
  SimSelect,
  SimSkeletonCard,
  SimSkeletonKpi,
  SimSkeletonText,
  SimSparkline,
  SimStatusBadge,
  SimTooltip,
} from '@/components/ui/sim';
import { CGP_GLOSSARY_ENTRIES } from '@/constants/cgpGlossary';
import {
  icons,
  modalSections,
  primitiveStates,
  selectOptions,
  snippets,
  tableRows,
  tokenGroups,
  type PrimitiveState,
} from './designSystemCatalog';

const ignoreNumberChange = (_value: number) => {};

function StateCell({
  label,
  state,
  children,
}: {
  label: string;
  state: PrimitiveState;
  children: ReactNode;
}) {
  return (
    <div
      className={`settings-design-system__state-cell settings-design-system__state-cell--${state}`}
    >
      <span className="settings-design-system__state-label">{label}</span>
      {children}
    </div>
  );
}

function CodeSnippet({ label, children }: { label: string; children: string }) {
  return (
    <figure className="settings-design-system__snippet">
      <figcaption>{label}</figcaption>
      <textarea aria-label={label} readOnly rows={children.split('\n').length} value={children} />
    </figure>
  );
}

function DesignSystemInputPreview() {
  const [montant, setMontant] = useState(250000);
  const [taux, setTaux] = useState(4.5);
  const [parts, setParts] = useState(2.5);
  const [profil, setProfil] = useState('equilibre');

  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__input-grid">
        <SimAmountInputEuro label="Montant euro" value={montant} onChange={setMontant} min={0} />
        <SimAmountInputPercent
          label="Taux décimal"
          value={taux}
          onChange={setTaux}
          min={0}
          max={20}
        />
        <SimAmountInputNumeric
          label="Nombre libre"
          unit="parts"
          value={parts}
          onChange={setParts}
          min={0}
        />
        <div className="settings-design-system__field-demo">
          <span className="sim-field__label">Profil investisseur</span>
          <SimSelect
            value={profil}
            onChange={setProfil}
            options={selectOptions}
            ariaLabel="Profil investisseur"
          />
        </div>
      </div>

      <article className="settings-design-system__ui-card">
        <h3>États inputs</h3>
        <div className="settings-design-system__state-grid">
          {primitiveStates.map(({ state, label }) => (
            <StateCell key={state} label={label} state={state}>
              <SimAmountInputEuro
                label={`Montant état ${label.toLowerCase()}`}
                value={125000}
                onChange={ignoreNumberChange}
                disabled={state === 'disabled'}
              />
            </StateCell>
          ))}
        </div>
      </article>

      <CodeSnippet label="Extrait inputs">{snippets.inputs}</CodeSnippet>
    </div>
  );
}

function DesignSystemUiPreview() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('identite');
  const [period, setPeriod] = useState<'mensuel' | 'annuel'>('mensuel');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Actions</h3>
          <div className="settings-design-system__action-row">
            <SimActionButton variant="add" mode="text" label="Ajouter une ligne" />
            <SimActionButton variant="edit" mode="icon" label="Modifier" ariaLabel="Modifier" />
            <SimActionButton
              variant="duplicate"
              mode="icon"
              label="Dupliquer"
              ariaLabel="Dupliquer"
            />
            <SimActionButton
              variant="delete"
              mode="icon"
              label="Supprimer"
              ariaLabel="Supprimer"
              danger
            />
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Disclosure</h3>
          <SimDisclosureButton
            expanded={detailsOpen}
            onToggle={() => setDetailsOpen((open) => !open)}
            labelClosed="Afficher le détail"
            labelOpen="Masquer le détail"
            controls="settings-design-system-ui-detail"
          />
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Contrôle segmenté</h3>
          <SimSegmentedControl
            value={period}
            onChange={setPeriod}
            ariaLabel="Période de démonstration"
            options={[
              { value: 'mensuel', label: 'Mensuel' },
              { value: 'annuel', label: 'Annuel' },
            ]}
          />
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Navigation modale</h3>
          <SimModalSectionNav
            sections={modalSections}
            activeId={activeSection}
            ariaLabel="Rubriques de modale"
            onChange={setActiveSection}
          />
          <div className="settings-design-system__nav-panels">
            <p id="settings-ui-identite">Identité du foyer de démonstration.</p>
            <p id="settings-ui-revenus">Revenus et enveloppes de démonstration.</p>
            <p id="settings-ui-sortie">Sortie client et restitution de démonstration.</p>
          </div>
          <SimActionButton
            variant="add"
            mode="text"
            label="Ouvrir la modale bottom-sheet"
            onClick={() => setModalOpen(true)}
          />
        </article>
      </div>

      <article className="settings-design-system__ui-card">
        <h3>États actions</h3>
        <div className="settings-design-system__state-grid">
          {primitiveStates.map(({ state, label }) => (
            <StateCell key={state} label={label} state={state}>
              <SimActionButton
                variant="add"
                mode="text"
                label={`Ajouter ${label.toLowerCase()}`}
                disabled={state === 'disabled'}
              />
            </StateCell>
          ))}
        </div>
      </article>

      <div className="settings-design-system__snippet-grid">
        <CodeSnippet label="Extrait actions">{snippets.actions}</CodeSnippet>
        <CodeSnippet label="Extrait modale">{snippets.modal}</CodeSnippet>
      </div>

      {modalOpen ? (
        <SimModalShell
          title="Versement programmé"
          subtitle="Aperçu du shell partagé"
          mobileVariant="bottom-sheet"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="sim-modal-btn sim-modal-btn--ghost">
                Annuler
              </button>
              <button type="button" className="sim-modal-btn sim-modal-btn--primary">
                Valider
              </button>
            </>
          }
        >
          <SimModalSectionNav
            sections={modalSections}
            activeId={activeSection}
            ariaLabel="Rubriques de la modale ouverte"
            onChange={setActiveSection}
          />
        </SimModalShell>
      ) : null}
    </div>
  );
}

function DesignSystemDataPreview() {
  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Métriques</h3>
          <SimMetric
            variant="hero"
            label="Impôt estimé"
            value="12 400"
            unit="€"
            note={
              <span className="sim-kpi-note">
                <SimSparkline />
                <SimKpiReference kind="ir" />
              </span>
            }
          />
          <SimMetric
            variant="secondary"
            label="Avancement"
            value="42"
            unit="%"
            delta={<SimDelta value={2} unit="pts" precision={0} />}
          />
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Statuts</h3>
          <div className="settings-design-system__action-row">
            <SimStatusBadge variant="optimal">Optimal</SimStatusBadge>
            <SimStatusBadge variant="attention">À revoir</SimStatusBadge>
            <SimStatusBadge variant="info">Info</SimStatusBadge>
          </div>
          <div className="settings-design-system__action-row">
            <SimDelta value={4.8} unit="%" />
            <SimDelta value={-1200} formatValue={(value) => `${value.toLocaleString('fr-FR')} €`} />
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Table repliable</h3>
          <SimCollapsibleTable
            title="Projection repliable"
            rows={tableRows}
            columns={['Année', 'Versement', 'Impact']}
            defaultOpen
            tableAriaLabel="Projection repliable design system"
            renderRow={(row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{row.versement}</td>
                <td>{row.impact}</td>
              </tr>
            )}
          />
        </article>
      </div>
      <CodeSnippet label="Extrait données">{snippets.data}</CodeSnippet>
    </div>
  );
}

function DesignSystemModernityPreview() {
  return (
    <div className="settings-design-system__modernity-grid">
      <article className="settings-design-system__ui-card">
        <h3>Squelette page</h3>
        <SimSkeletonCard />
      </article>
      <article className="settings-design-system__ui-card">
        <h3>Squelette KPI</h3>
        <SimSkeletonKpi />
      </article>
      <article className="settings-design-system__ui-card">
        <h3>Texte en attente</h3>
        <SimSkeletonText lines={3} />
      </article>
      <article className="settings-design-system__ui-card">
        <h3>État vide</h3>
        <SimEmptyState
          illustration="chart"
          title="Synthèse indisponible"
          description="Complétez les hypothèses pour afficher les indicateurs."
          cta={<SimActionButton variant="add" mode="text" label="Compléter" />}
        />
      </article>
    </div>
  );
}

function DesignSystemMobilePreview() {
  const [value, setValue] = useState(18000);
  const [period, setPeriod] = useState<'annee' | 'mois'>('annee');

  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__mobile-frame" aria-label="Mobile 390">
        <div className="settings-design-system__mobile-topbar">390 px</div>
        <div className="settings-design-system__mobile-body">
          <SimAmountInputEuro label="Versement mobile" value={value} onChange={setValue} min={0} />
          <SimSegmentedControl
            value={period}
            onChange={setPeriod}
            ariaLabel="Période mobile"
            options={[
              { value: 'annee', label: 'Année' },
              { value: 'mois', label: 'Mois' },
            ]}
          />
          <SimEmptyState
            illustration="table"
            title="Aucun scénario"
            description="Ajoutez une ligne pour lancer la comparaison."
          />
          <SimMobileStickyActions ariaLabel="Actions mobiles 390">
            <button type="button" className="sim-modal-btn sim-modal-btn--ghost">
              Annuler
            </button>
            <button type="button" className="sim-modal-btn sim-modal-btn--primary">
              Valider
            </button>
          </SimMobileStickyActions>
        </div>
      </div>
      <CodeSnippet label="Extrait mobile">{snippets.mobile}</CodeSnippet>
    </div>
  );
}

function DesignSystemGlossaryPreview() {
  return (
    <div className="settings-design-system__glossary-grid">
      {CGP_GLOSSARY_ENTRIES.map((entry) => (
        <article className="settings-design-system__ui-card" key={entry.id}>
          <SimTooltip label={entry.label} description={entry.description} />
          <p className="settings-design-system__glossary-description">{entry.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function SettingsDesignSystem() {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <main className="settings-design-system" data-testid="settings-design-system">
      <section className="settings-premium-card">
        <header className="settings-premium-header">
          <div className="settings-action-text settings-design-system__hero-copy">
            <h1 className="settings-premium-title settings-design-system__hero-title">
              <SettingsTitleWithIcon icon="sparkles">
                Design system simulateurs
              </SettingsTitleWithIcon>
            </h1>
            <p className="settings-premium-subtitle">
              Référence runtime complète des fondations SIM SER1 2026.
            </p>
          </div>
          <SimInfoButton
            ariaLabel="Informations sur la page design system"
            onClick={() => setInfoOpen(true)}
          />
        </header>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Tokens</h2>
        <div className="settings-design-system__token-groups">
          {tokenGroups.map((group) => (
            <article className="settings-design-system__token-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="settings-design-system__token-grid">
                {group.tokens.map((token) => (
                  <div className="settings-design-system__token" key={token}>
                    <span className="settings-design-system__token-sample" />
                    <code>{token}</code>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Icônes</h2>
        <div className="settings-design-system__icon-grid" aria-label="Catalogue icônes UI">
          {icons.map(([label, Icon]) => (
            <figure className="settings-design-system__icon-item" key={label}>
              <Icon className="settings-design-system__icon" />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Primitives inputs</h2>
        <p className="settings-design-system__note">
          Les variantes euro, pourcentage et numérique partagent SimAmountInputBase pour conserver
          le même cycle de saisie, formatage et validation.
        </p>
        <DesignSystemInputPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Primitives UI</h2>
        <DesignSystemUiPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Données CGP</h2>
        <DesignSystemDataPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Modernité</h2>
        <DesignSystemModernityPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Mobile 390</h2>
        <DesignSystemMobilePreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h2 className="settings-design-system__title">Glossaire</h2>
        <DesignSystemGlossaryPreview />
      </section>

      {infoOpen ? (
        <SimModalShell
          title="À quoi sert cette page ?"
          subtitle="Aide admin"
          onClose={() => setInfoOpen(false)}
          footer={
            <button
              type="button"
              className="sim-modal-btn sim-modal-btn--primary"
              onClick={() => setInfoOpen(false)}
            >
              Compris
            </button>
          }
        >
          <p className="settings-design-system__info-text">
            Cette page permet de vérifier rapidement les composants communs des simulateurs :
            champs, boutons, modales, tableaux, états et affichages mobiles. Elle sert de référence
            pour garder les pages sim/* cohérentes après une évolution du design system.
          </p>
        </SimModalShell>
      ) : null}
    </main>
  );
}
