import { useState } from 'react';
import { SimFieldShell, SimModalSectionNav, SimModalShell, SimSelect } from '@/components/ui/sim';
import { IconClose } from '@/icons/ui';
import { modalSections } from '../designSystemCatalog';

const WIDTH_BUCKETS = [
  { token: 'sim-modal--sm', size: '520 px', usage: 'Saisie simple (≤ 6 champs, sans nav)' },
  { token: 'sim-modal--md', size: '620 px', usage: 'Famille / formulaire élargi' },
  { token: 'sim-modal--lg', size: '720 px', usage: 'Nav latérale + formulaire (défaut)' },
  { token: 'sim-modal--xl', size: '1200 px', usage: 'Contenu réellement large justifié' },
];

const selectOptions = [
  { value: 'option-a', label: 'Option A' },
  { value: 'option-b', label: 'Option B' },
];

export function DesignSystemModalPreview() {
  const [activeSection, setActiveSection] = useState('identite');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="settings-design-system__stack">
      <p className="settings-design-system__note">
        Toute modale, `/sim/*` ou administration Settings, suit la même anatomie. Deux familles
        visuelles seulement : normale sans menu gauche, ou avec menu gauche. Voir GOUVERNANCE §16d.
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
          <h3>Famille avec menu gauche</h3>
          <p className="settings-design-system__note">
            Layout partagé `sim-modal-layout--with-nav` : la feature peut ajuster la largeur de
            colonne, jamais le fond, la bordure ou le rayon du menu. Les champs y sont blancs via
            `--sim-input-bg`.
          </p>
          <div className="settings-design-system__modal-layout-demo sim-modal-layout--with-nav">
            <SimModalSectionNav
              sections={modalSections}
              activeId={activeSection}
              ariaLabel="Rubriques de modale"
              className="sim-modal-layout__nav"
              onChange={setActiveSection}
            />
            <div className="settings-design-system__modal-panels sim-modal-layout__content">
              <p>Contenu de section avec champs via primitives Sim*.</p>
            </div>
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Famille normale</h3>
          <p className="settings-design-system__note">
            Pas de menu gauche : header, corps, footer. `sim-modal--lg` par défaut, `xl` uniquement
            pour une vraie surface dense. Sur fond blanc, les champs restent gris.
          </p>
          <div className="settings-design-system__modal-panels">
            <SimFieldShell label="Champ texte">
              <input
                className="sim-field__control sim-field__control--left"
                value="Valeur"
                readOnly
              />
            </SimFieldShell>
            <SimFieldShell label="Menu déroulant">
              <SimSelect value="option-a" options={selectOptions} onChange={() => undefined} />
            </SimFieldShell>
          </div>
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
            rayon, padding et inputs blancs pour toutes les modales.
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
            Famille « menu gauche + formulaire » : shell partagé, nav gauche, footer avec destructif
            à gauche, champs par primitives.
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

      <article className="settings-design-system__ui-card">
        <h3>Drawer XL (/audit)</h3>
        <p className="settings-design-system__note">
          Variante de l’anatomie modale ancrée à droite : header, nav gauche optionnelle, corps,
          panneau sources optionnel, footer stable (`Annuler` + `Enregistrer`, destructif à gauche).
          Largeur canonique `sim-drawer` / `sim-drawer--xl`, aucune largeur locale
          (`check:modal-canon`).
        </p>
        <div className="settings-design-system__drawer-frame">
          <aside
            className="sim-drawer sim-drawer--xl"
            role="group"
            aria-label="Anatomie du drawer XL"
          >
            <header className="sim-modal__header">
              <div className="sim-modal__header-content">
                <div>
                  <h4 className="sim-modal__title">Détail d’axe</h4>
                  <p className="sim-modal__subtitle">Drawer XL ancré à droite</p>
                </div>
              </div>
              <button type="button" className="sim-modal__close" aria-label="Fermer le drawer">
                <IconClose aria-hidden="true" />
              </button>
            </header>

            <div className="sim-drawer__layout">
              <div className="sim-drawer__main sim-modal-layout--with-nav">
                <SimModalSectionNav
                  sections={modalSections}
                  activeId={activeSection}
                  ariaLabel="Rubriques du drawer"
                  className="sim-modal-layout__nav"
                  onChange={setActiveSection}
                />
                <div className="settings-design-system__modal-panels sim-modal-layout__content">
                  <p>
                    Tableau de bord d’axe : lignes KPI, micro-tuiles plates, champs via primitives
                    Sim*.
                  </p>
                </div>
              </div>
              <aside className="sim-drawer__sources" aria-label="Panneau sources">
                <span className="settings-design-system__surface-tag">Sources</span>
                <p className="settings-design-system__note">
                  Preuve discrète (`SourceRef`). Aucune confiance numérique sur une donnée saisie
                  manuellement.
                </p>
              </aside>
            </div>

            <div className="sim-modal__footer">
              <button type="button" className="sim-modal-btn sim-modal-btn--danger">
                Supprimer
              </button>
              <button type="button" className="sim-modal-btn sim-modal-btn--ghost">
                Annuler
              </button>
              <button type="button" className="sim-modal-btn sim-modal-btn--primary">
                Enregistrer
              </button>
            </div>
          </aside>
        </div>
      </article>

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
          <div className="settings-design-system__modal-layout-demo sim-modal-layout--with-nav">
            <SimModalSectionNav
              sections={modalSections}
              activeId={activeSection}
              ariaLabel="Rubriques de la modale ouverte"
              className="sim-modal-layout__nav"
              onChange={setActiveSection}
            />
            <div className="settings-design-system__modal-panels sim-modal-layout__content">
              <SimFieldShell label="Libellé">
                <input
                  className="sim-field__control sim-field__control--left"
                  value="Contrat canonique"
                  readOnly
                />
              </SimFieldShell>
              <SimFieldShell label="Choix">
                <SimSelect value="option-a" options={selectOptions} onChange={() => undefined} />
              </SimFieldShell>
            </div>
          </div>
        </SimModalShell>
      ) : null}
    </div>
  );
}
