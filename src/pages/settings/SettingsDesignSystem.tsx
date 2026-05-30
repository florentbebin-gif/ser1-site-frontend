import { useState } from 'react';
import '@/styles/sim/index.css';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { SimInfoButton } from '@/components/ui/sim';
import { icons, tokenGroups } from './designSystemCatalog';
import { previewSections } from './designSystem/previewSections';
import { DesignSection } from './designSystem/Section';
import { SettingsDesignSystemColorPreview } from './SettingsDesignSystemColorPreview';
import { SettingsDesignSystemGlossaryPreview } from './SettingsDesignSystemGlossaryPreview';
import { SettingsDesignSystemInfoModal } from './SettingsDesignSystemInfoModal';
import { SettingsDesignSystemTokenSample } from './SettingsDesignSystemTokenSample';

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
              <SimInfoButton
                ariaLabel="Informations sur la page design system"
                onClick={() => setInfoOpen(true)}
              />
            </h1>
            <p className="settings-premium-subtitle">
              Référence runtime des fondations simulateurs : primitives, navigation, états vides et
              conventions d’affichage.
            </p>
          </div>
        </header>
      </section>

      <DesignSection title="Tokens">
        <div className="settings-design-system__token-groups">
          {tokenGroups.map((group) => (
            <article className="settings-design-system__token-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="settings-design-system__token-grid">
                {group.tokens.map((token) => (
                  <div className="settings-design-system__token" key={token}>
                    <SettingsDesignSystemTokenSample kind={group.kind} token={token} />
                    <code>{token}</code>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Couleurs runtime">
        <p className="settings-design-system__note">
          La palette live vient de C1-C10 ; les alias sont dérivés et changent avec le thème actif.
        </p>
        <SettingsDesignSystemColorPreview />
      </DesignSection>

      <DesignSection title="Icônes">
        <div className="settings-design-system__icon-grid" aria-label="Catalogue icônes UI">
          {icons.map(([label, Icon]) => (
            <figure className="settings-design-system__icon-item" key={label}>
              <Icon className="settings-design-system__icon" />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </DesignSection>

      {previewSections.map(({ title, note, Preview }) => (
        <DesignSection title={title} key={title}>
          {note ? <p className="settings-design-system__note">{note}</p> : null}
          <Preview />
        </DesignSection>
      ))}

      <DesignSection title="Glossaire">
        <SettingsDesignSystemGlossaryPreview />
      </DesignSection>

      {infoOpen ? <SettingsDesignSystemInfoModal onClose={() => setInfoOpen(false)} /> : null}
    </main>
  );
}
