import { useState } from 'react';
import { SimModalSectionNav, SimModalShell } from '@/components/ui/sim';
import { modalSections } from '../designSystemCatalog';

const WIDTH_BUCKETS = [
  { token: 'sim-modal--sm', size: '520 px', usage: 'Saisie simple (≤ 6 champs, sans nav)' },
  { token: 'sim-modal--md', size: '620 px', usage: 'Famille / formulaire élargi' },
  { token: 'sim-modal--lg', size: '720 px', usage: 'Nav latérale + formulaire (défaut)' },
  { token: 'sim-modal--xl', size: '1200 px', usage: 'Contenu réellement large (table, graphe)' },
];

export function DesignSystemModalPreview() {
  const [activeSection, setActiveSection] = useState('identite');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="settings-design-system__stack">
      <p className="settings-design-system__note">
        Toute modale, `/sim/*` ou administration Settings, suit la même anatomie (shell, header,
        close rond, nav latérale, footer, largeur canonique). Voir GOUVERNANCE §16d.
      </p>

      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Largeurs canoniques</h3>
          <p className="settings-design-system__note">
            Une seule échelle, par classe `sim-modal--*` ou `size` de SettingsModalShell. Garde-fou
            : `check:modal-canon`.
          </p>
          <ul className="settings-design-system__width-list">
            {WIDTH_BUCKETS.map(({ token, size, usage }) => (
              <li key={token}>
                <code>{token}</code>
                <span className="settings-design-system__width-size">{size}</span>
                <span>{usage}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Navigation de sections</h3>
          <p className="settings-design-system__note">
            Famille « nav latérale » : primitive unique `SimModalSectionNav` (actif gris via tokens
            partagés), latérale sur desktop, segments en haut sur mobile.
          </p>
          <SimModalSectionNav
            sections={modalSections}
            activeId={activeSection}
            ariaLabel="Rubriques de modale"
            onChange={setActiveSection}
          />
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Footer canonique</h3>
          <p className="settings-design-system__note">
            Action destructive à gauche (`--danger`), Annuler/Valider à droite. En édition live : un
            seul `Fermer` (`--primary`). Jamais de footer absent ni de `Terminer` ambigu.
          </p>
          <div className="sim-modal__footer settings-design-system__footer-demo">
            <button type="button" className="sim-modal-btn sim-modal-btn--danger">
              Supprimer
            </button>
            <button type="button" className="sim-modal-btn sim-modal-btn--ghost">
              Annuler
            </button>
            <button type="button" className="sim-modal-btn sim-modal-btn--primary">
              Valider
            </button>
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Panneau de section</h3>
          <p className="settings-design-system__note">
            Source unique `--sim-modal-panel-*` / `.sim-modal-section-panel` : même fond, bordure,
            rayon et padding pour toutes les modales.
          </p>
          <div className="sim-modal-section-panel">
            <p className="settings-design-system__note">
              Groupe de champs ou résumé, sans carte décorative divergente.
            </p>
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Modale complète (lg)</h3>
          <p className="settings-design-system__note">
            Famille « nav latérale + formulaire » : shell partagé, nav gauche, footer avec
            destructif à gauche.
          </p>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={() => setModalOpen(true)}
          >
            Ouvrir l’exemple canonique
          </button>
        </article>
      </div>

      {modalOpen ? (
        <SimModalShell
          title="Exemple canonique"
          subtitle="Nav latérale + footer danger"
          modalClassName="sim-modal--lg"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="sim-modal-btn sim-modal-btn--danger">
                Supprimer
              </button>
              <button
                type="button"
                className="sim-modal-btn sim-modal-btn--ghost"
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="sim-modal-btn sim-modal-btn--primary"
                onClick={() => setModalOpen(false)}
              >
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
          <div className="settings-design-system__nav-panels">
            <p>Contenu de section : champs via primitives Sim*, sans carte imbriquée.</p>
          </div>
        </SimModalShell>
      ) : null}
    </div>
  );
}
