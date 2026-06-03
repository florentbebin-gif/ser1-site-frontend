import { useState } from 'react';
import {
  SimActionButton,
  SimDisclosureButton,
  SimModalSectionNav,
  SimModalShell,
  SimPageStepper,
  SimSegmentedControl,
  SimViewSynthesisCTA,
} from '@/components/ui/sim';
import { modalSections, primitiveStates, snippets } from '../designSystemCatalog';
import { SettingsDesignSystemCodeSnippet } from '../SettingsDesignSystemCodeSnippet';
import { StateCell } from './InputPreview';

export function DesignSystemUiPreview() {
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
            labelClosed="Afficher le détail — 14 années"
            labelOpen="Masquer le détail — 14 années"
            controls="settings-design-system-ui-detail"
          />
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Barres séparatrices</h3>
          <div className="sim-divider" />
          <p className="settings-design-system__note">Sous-titre de carte</p>
          <div className="sim-divider sim-divider--soft" />
          <p className="settings-design-system__note">Séparation interne</p>
          <div className="sim-divider sim-divider--solid" />
          <p className="settings-design-system__note">Conclusion ou annexe</p>
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
          <div className="settings-design-system__modal-panels">
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

        <article className="settings-design-system__ui-card">
          <h3>Navigation simulateur optionnelle</h3>
          <SimPageStepper
            steps={[
              { id: 'settings-demo-societe', label: 'Société', status: 'done' },
              { id: 'settings-demo-parcours', label: 'Parcours', status: 'current' },
              { id: 'settings-demo-allocation', label: 'Allocation' },
            ]}
          />
          <p className="settings-design-system__note">
            Démo primitive uniquement : les simulateurs n’affichent pas ce repère par défaut.
          </p>
          <SimViewSynthesisCTA
            ready
            targetId="settings-demo-synthese"
            hint="Exemple de lien contextuel vers les KPI."
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
        <SettingsDesignSystemCodeSnippet label="Extrait actions">
          {snippets.actions}
        </SettingsDesignSystemCodeSnippet>
        <SettingsDesignSystemCodeSnippet label="Extrait modale">
          {snippets.modal}
        </SettingsDesignSystemCodeSnippet>
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
