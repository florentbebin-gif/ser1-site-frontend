import { ModeToggleView } from '@/components/ModeToggle';
import { DossierRail } from '@/components/ui/dossier/DossierRail';
import { buildDossierRailViewModel } from '@/domain/dossier';

const railViewModel = buildDossierRailViewModel({
  kind: 'simulator',
  pathname: '/sim/succession',
  simulatorId: 'succession',
  routeId: 'succession',
  preferredJourneyId: 'transmission-privee',
});

export function DesignSystemRailPreview() {
  return (
    <div className="settings-design-system__ui-grid">
      <article className="settings-design-system__ui-card">
        <h3>Fil de parcours (rail dossier)</h3>
        <p className="settings-design-system__note">
          Repère discret de position dans le parcours : fil vertical à puces, étape courante seule
          mise en avant, aucune boîte par étape.
        </p>
        {railViewModel ? (
          <div className="settings-design-system__rail-demo">
            <DossierRail
              viewModel={railViewModel}
              onNavigate={() => undefined}
              resolveRoutePath={() => null}
            />
          </div>
        ) : null}
      </article>

      <article className="settings-design-system__ui-card">
        <h3>Bascule Mode expert</h3>
        <p className="settings-design-system__note">
          Switch binaire (on/off). L’état actif utilise la couleur d’action pour un contraste net.
        </p>
        <div className="settings-design-system__switch-row">
          <ModeToggleView isExpert={false} />
          <ModeToggleView isExpert />
          <ModeToggleView isExpert={false} disabled disabledReason="Indisponible dans cette vue" />
        </div>
      </article>
    </div>
  );
}
