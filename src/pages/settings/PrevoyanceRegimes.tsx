import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceRegimeData,
  PrevoyanceRegimeSettings,
  PrevoyanceSources,
} from '@/domain/prevoyance/types';
import { usePrevoyanceSettings } from '@/hooks/usePrevoyanceSettings';
import { EditModal, type EditorTarget } from './PrevoyanceRegimesEditModal';
import './styles/prevoyance-regimes.css';

function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRegimeType(regime: PrevoyanceRegimeSettings): string {
  return regime.defaultContractKind === 'collectif'
    ? 'Salarié collectif'
    : 'Individuel TNS/libéral';
}

function formatAmountLabel(value: { label?: string; value?: number | null } | null | undefined) {
  if (!value) return 'Non prévu';
  if (value.label) return value.label;
  return value.value === null || value.value === undefined ? 'Formule régime' : `${value.value}`;
}

function formatCotisationLabel(cotisations: PrevoyanceRegimeData['cotisations']): string {
  if (cotisations.notes?.[0]) return cotisations.notes[0];
  if (cotisations.mode === 'none') return 'Aucune cotisation obligatoire renseignée.';
  if (cotisations.value === null) return 'Cotisation calculée selon formule caisse.';
  if (cotisations.mode === 'fixed_eur') return `Forfait ${formatEuro(cotisations.value)}`;
  return `${cotisations.value}% de l'assiette documentée.`;
}

function sourceSummary(sources: PrevoyanceSources): string {
  if (sources.references.length === 0) return 'Références à compléter';
  return sources.references
    .slice(0, 2)
    .map((reference) => `${reference.organisme} - ${reference.titre}`)
    .join(', ');
}

function RegimeColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="prevoyance-settings-column">
      <div className="prevoyance-settings-column__title">{title}</div>
      <div className="prevoyance-settings-column__body">{children}</div>
    </div>
  );
}

function RegimePanel({
  regime,
  isOpen,
  onToggle,
  onEdit,
  canEdit,
}: {
  regime: PrevoyanceRegimeSettings;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const firstArret = regime.data.arret.paliers[0];
  const firstInvalidite = regime.data.invalidite.paliers[1] ?? regime.data.invalidite.paliers[0];
  const sourceFooter =
    canEdit && regime.sources.noteAdmin ? regime.sources.noteAdmin : sourceSummary(regime.sources);

  return (
    <article className="prevoyance-settings-regime">
      <button
        type="button"
        className="prevoyance-settings-regime__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="prevoyance-settings-regime__heading">
          <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
          <span>
            <strong>{regime.label}</strong>
            <span>{regime.caisse}</span>
          </span>
        </span>
        <span className="prevoyance-settings-regime__meta">
          <span className="prevoyance-settings-badge">{formatRegimeType(regime)}</span>
          <span className="prevoyance-settings-badge prevoyance-settings-badge--muted">
            {regime.year}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="prevoyance-settings-regime__body">
          <div className="prevoyance-settings-grid">
            <RegimeColumn title="Arrêt de travail">
              <p>{firstArret?.label ?? 'Aucun palier renseigné.'}</p>
              <dl>
                <div>
                  <dt>Carence maladie</dt>
                  <dd>{regime.data.arret.carences.maladie} j</dd>
                </div>
                <div>
                  <dt>Durée max</dt>
                  <dd>{regime.data.arret.maxDurationDays} j</dd>
                </div>
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Invalidité">
              <p>{firstInvalidite?.label ?? 'Aucun seuil renseigné.'}</p>
              <dl>
                {regime.data.invalidite.paliers.slice(0, 3).map((palier) => (
                  <div key={`${palier.fromRate}-${palier.toRate ?? 'plus'}`}>
                    <dt>
                      {palier.fromRate} % à {palier.toRate ?? '+'} %
                    </dt>
                    <dd>{formatAmountLabel(palier.amount)}</dd>
                  </div>
                ))}
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Décès">
              <p>{formatAmountLabel(regime.data.deces.capital)}</p>
              <dl>
                <div>
                  <dt>Doublement accident</dt>
                  <dd>{regime.data.deces.doublementAccident ? 'Oui' : 'Non'}</dd>
                </div>
                <div>
                  <dt>Double effet</dt>
                  <dd>{regime.data.deces.doubleEffet ? 'Oui' : 'Non'}</dd>
                </div>
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Cotisations">
              <p>{formatCotisationLabel(regime.data.cotisations)}</p>
              <dl>
                {regime.data.cotisations.assiette ? (
                  <div>
                    <dt>Assiette</dt>
                    <dd>{regime.data.cotisations.assiette}</dd>
                  </div>
                ) : null}
                {regime.data.cotisations.repartition ? (
                  <div>
                    <dt>Répartition</dt>
                    <dd>
                      {regime.data.cotisations.repartition.employeur}% /{' '}
                      {regime.data.cotisations.repartition.salarie}%
                    </dd>
                  </div>
                ) : null}
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Références">
              <ul className="prevoyance-settings-sources">
                {regime.sources.references.slice(0, 3).map((reference) => (
                  <li key={`${reference.organisme}-${reference.titre}-${reference.url}`}>
                    <a href={reference.url} target="_blank" rel="noreferrer">
                      {reference.organisme}
                    </a>
                    <span>{reference.titre}</span>
                    <small>
                      {reference.rubrique ? `${reference.rubrique} - ` : ''}
                      consulté le {reference.dateConsultation}
                    </small>
                  </li>
                ))}
              </ul>
            </RegimeColumn>
          </div>

          <div className="prevoyance-settings-regime__footer">
            <span>{sourceFooter}</span>
            {canEdit ? (
              <button type="button" className="settings-action-btn" onClick={onEdit}>
                Modifier
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function PrevoyanceRegimes() {
  const { isAdmin } = useUserRole();
  const { regimes, maintien, loading, reload } = usePrevoyanceSettings();
  const [search, setSearch] = useState('');
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const maintienLegal =
    maintien.find((item) => item.code === PREVOYANCE_MAINTIEN_LEGAL_CODE) ?? null;

  useEffect(() => {
    setOpenCode((current) => current ?? regimes[0]?.code ?? null);
  }, [regimes]);

  const filteredRegimes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return regimes;
    return regimes.filter(
      (regime) =>
        regime.label.toLowerCase().includes(needle) ||
        regime.caisse.toLowerCase().includes(needle) ||
        regime.code.toLowerCase().includes(needle),
    );
  }, [regimes, search]);

  return (
    <div className="prevoyance-settings-page">
      <div className="premium-card prevoyance-settings-header-card">
        <div className="prevoyance-settings-header">
          <div>
            <h1 className="premium-title">
              <SettingsTitleWithIcon icon="umbrella">Prévoyance — régimes</SettingsTitleWithIcon>
            </h1>
            <p className="premium-subtitle">
              Référentiel des régimes obligatoires, des règles décès et du maintien employeur.
            </p>
          </div>
          <div className="prevoyance-settings-kpis" aria-label="Synthèse référentiel">
            <span>{regimes.length} régimes</span>
            <span>{maintien.length} maintien légal</span>
          </div>
        </div>
      </div>

      {!isAdmin ? <UserInfoBanner /> : null}

      <div className="prevoyance-settings-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un régime, une caisse ou un code"
          className="prevoyance-settings-input"
        />
        {maintienLegal && isAdmin ? (
          <button
            type="button"
            className="settings-action-btn"
            onClick={() => {
              setEditorTarget({ type: 'maintien', value: maintienLegal });
            }}
          >
            Maintien employeur
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="premium-card prevoyance-settings-state">Chargement...</div>
      ) : (
        <div className="prevoyance-settings-list">
          {filteredRegimes.map((regime) => (
            <RegimePanel
              key={regime.code}
              regime={regime}
              isOpen={openCode === regime.code}
              onToggle={() => setOpenCode(openCode === regime.code ? null : regime.code)}
              onEdit={() => setEditorTarget({ type: 'regime', value: regime })}
              canEdit={isAdmin}
            />
          ))}
        </div>
      )}

      {editorTarget ? (
        <EditModal target={editorTarget} onClose={() => setEditorTarget(null)} onSaved={reload} />
      ) : null}
    </div>
  );
}
