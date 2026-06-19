import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import type {
  PrevoyanceAmountRule,
  PrevoyanceRegimeData,
  PrevoyanceRegimeSettings,
  PrevoyanceSources,
} from '@/domain/prevoyance/types';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import { EditModal, type EditorTarget } from '../PrevoyanceRegimesEditModal';
import { usePrevoyanceContext } from '../PrevoyanceRegimes/PrevoyanceProvider';
import type { MementoEntrySectionProps } from './mementoEntrySections';
import '../styles/prevoyance-regimes.css';

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
function formatAmountLabel(value: PrevoyanceAmountRule | null | undefined): string {
  if (!value) return 'Non prévu';
  if (value.label) return value.label;
  if (value.value === null || value.value === undefined) return 'Formule régime';
  if (value.mode.startsWith('fixed_eur')) return formatEuro(value.value);
  if (value.mode.startsWith('percent')) return `${value.value} %`;
  return `${value.value}`;
}
function formatCotisationLabel(cotisations: PrevoyanceRegimeData['cotisations']): string {
  if (cotisations.notes?.[0]) return cotisations.notes[0];
  if (cotisations.mode === 'none') return 'Aucune cotisation obligatoire renseignée.';
  if (cotisations.value === null) return 'Cotisation calculée selon formule caisse.';
  if (cotisations.mode === 'fixed_eur') return `Forfait ${formatEuro(cotisations.value)}`;
  return `${cotisations.value} % de l'assiette documentée.`;
}
function formatRange(from: number, to: number | null): string {
  return `${from} % à ${to ?? '+'} %`;
}
function formatConfidence(confidence: string): string {
  if (confidence === 'haute') return 'C1 - Source qualité : vérifiée';
  if (confidence === 'moyenne') return 'C1 - Source qualité : à vérifier';
  return 'C1 - Source qualité : non vérifiée';
}
function RuleCard({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div className="settings-reference-rule-card">
      <div className="settings-reference-rule-card__title">{title}</div>
      {children}
    </div>
  );
}
function RuleList({ items }: { items: string[] }): ReactElement {
  return (
    <ul className="settings-reference-rule-card__list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
function getCoveredValuesLabel(sources: PrevoyanceSources): string {
  const values = Array.from(
    new Set(sources.references.flatMap((reference) => reference.valeursCouvertes)),
  );
  return values.length === 0 ? 'à compléter' : values.join(', ');
}
function getCotisationItems(cotisations: PrevoyanceRegimeData['cotisations']): string[] {
  return [
    formatCotisationLabel(cotisations),
    ...(cotisations.assiette ? [`Assiette : ${cotisations.assiette}`] : []),
    ...(cotisations.repartition
      ? [
          `Répartition : ${cotisations.repartition.employeur} % employeur / ${cotisations.repartition.salarie} % salarié`,
        ]
      : []),
  ];
}
function PhaseColumn({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'constitution' | 'sortie' | 'deces';
  children: ReactNode;
}): ReactElement {
  return (
    <section className="settings-reference-phase">
      <div className={`settings-reference-phase__title settings-reference-phase__title--${tone}`}>
        {title}
      </div>
      {children}
    </section>
  );
}
function RegimeMetaCard({
  sources,
  cotisations,
  showAdminNotes,
}: {
  sources: PrevoyanceSources;
  cotisations: PrevoyanceRegimeData['cotisations'];
  showAdminNotes: boolean;
}): ReactElement | null {
  const cotisationItems = getCotisationItems(cotisations);
  if (sources.references.length === 0) {
    return (
      <RuleCard title="Références">
        <div className="prevoyance-settings-meta-card">
          <div className="settings-reference-empty-card__body">
            {showAdminNotes && sources.noRefReason
              ? sources.noRefReason
              : 'Références à compléter.'}
          </div>
          <div className="prevoyance-settings-meta-card__section">
            <span className="settings-reference-rule-meta__label">Cotisations</span>
            <RuleList items={cotisationItems} />
          </div>
        </div>
      </RuleCard>
    );
  }
  const firstReference = sources.references[0];
  if (!firstReference) return null;
  return (
    <RuleCard title="Références">
      <div className="prevoyance-settings-meta-card">
        {showAdminNotes ? (
          <div className="prevoyance-settings-meta-card__section">
            <span
              className={`settings-reference-confidence settings-reference-confidence--${firstReference.confiance}`}
            >
              {formatConfidence(firstReference.confiance)}
            </span>
          </div>
        ) : null}
        <div className="prevoyance-settings-meta-card__section">
          <span className="settings-reference-rule-meta__label">Sources</span>
          <ul className="settings-reference-rule-meta__list prevoyance-settings-source-list">
            {sources.references.slice(0, 3).map((reference) => (
              <li key={`${reference.organisme}-${reference.titre}-${reference.url ?? ''}`}>
                {reference.url ? (
                  <a href={reference.url} target="_blank" rel="noreferrer">
                    {reference.organisme}
                  </a>
                ) : (
                  <span>{reference.organisme}</span>
                )}{' '}
                - {reference.titre}
                {reference.rubrique ? ` (${reference.rubrique})` : ''}
                {showAdminNotes ? ` consulté le ${reference.dateConsultation}` : ''}
              </li>
            ))}
          </ul>
          {showAdminNotes ? (
            <span className="prevoyance-settings-covered-values">
              <strong>Valeurs couvertes :</strong> {getCoveredValuesLabel(sources)}
            </span>
          ) : null}
        </div>
        <div className="prevoyance-settings-meta-card__section">
          <span className="settings-reference-rule-meta__label">Cotisations</span>
          <RuleList items={cotisationItems} />
        </div>
      </div>
    </RuleCard>
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
}): ReactElement {
  const firstArret = regime.data.arret.paliers[0];
  const invaliditePaliers = regime.data.invalidite.paliers.slice(0, 3);
  return (
    <article className="fisc-acc-item prevoyance-settings-regime">
      <button
        type="button"
        className="fisc-acc-header fisc-acc-header--with-icon prevoyance-settings-regime__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="prevoyance-settings-regime__heading">
          <strong>{regime.label}</strong>
          <span>{regime.caisse}</span>
        </span>
        <span className="settings-reference-badges prevoyance-settings-regime__meta">
          <span className="settings-reference-badge">{formatRegimeType(regime)}</span>
          <span className="settings-reference-badge settings-reference-badge--muted">
            {regime.year}
          </span>
        </span>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>
      {isOpen ? (
        <div className="fisc-acc-body prevoyance-settings-regime__body">
          <div className="settings-reference-rules prevoyance-settings-rules">
            <div className="settings-reference-rules__grid prevoyance-settings-main-grid">
              <PhaseColumn title="Arrêt de travail" tone="constitution">
                <RuleCard title={firstArret?.label ?? 'Aucun palier renseigné'}>
                  <RuleList
                    items={[
                      `Indemnisation : ${formatAmountLabel(firstArret?.amount)}`,
                      `Carence maladie : ${regime.data.arret.carences.maladie} j`,
                      `Durée max : ${regime.data.arret.maxDurationDays} j`,
                    ]}
                  />
                </RuleCard>
              </PhaseColumn>
              <PhaseColumn title="Invalidité" tone="sortie">
                {invaliditePaliers.length === 0 ? (
                  <div className="settings-reference-empty-card">
                    <div className="settings-reference-empty-card__title">
                      Aucun seuil renseigné
                    </div>
                  </div>
                ) : (
                  invaliditePaliers.map((palier, palierIndex) => (
                    <RuleCard
                      key={`${palier.fromRate}-${palier.toRate ?? 'plus'}-${
                        palier.category ?? palier.label ?? palierIndex
                      }`}
                      title={palier.label}
                    >
                      <RuleList
                        items={[
                          `Taux : ${formatRange(palier.fromRate, palier.toRate)}`,
                          `Montant : ${formatAmountLabel(palier.amount)}`,
                          ...(palier.category ? [`Catégorie : ${palier.category}`] : []),
                        ]}
                      />
                    </RuleCard>
                  ))
                )}
              </PhaseColumn>
              <PhaseColumn title="Décès" tone="deces">
                <RuleCard title="Capital décès">
                  <RuleList
                    items={[
                      `Capital : ${formatAmountLabel(regime.data.deces.capital)}`,
                      `Doublement accident : ${
                        regime.data.deces.doublementAccident ? 'Oui' : 'Non'
                      }`,
                      `Double effet : ${regime.data.deces.doubleEffet ? 'Oui' : 'Non'}`,
                      ...(regime.data.deces.renteConjoint
                        ? [`Rente conjoint : ${formatAmountLabel(regime.data.deces.renteConjoint)}`]
                        : []),
                      ...(regime.data.deces.renteEducation
                        ? [
                            `Rente éducation : ${formatAmountLabel(
                              regime.data.deces.renteEducation,
                            )}`,
                          ]
                        : []),
                    ]}
                  />
                </RuleCard>
              </PhaseColumn>
            </div>
            <div className="prevoyance-settings-meta-block">
              <RegimeMetaCard
                sources={regime.sources}
                cotisations={regime.data.cotisations}
                showAdminNotes={canEdit}
              />
            </div>
          </div>
          {canEdit ? (
            <div className="prevoyance-settings-regime__actions">
              <button type="button" className="settings-reference-admin-action" onClick={onEdit}>
                Modifier
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
function EmptySection({ label }: { label: string }): ReactElement {
  return (
    <div className="settings-premium-card prevoyance-settings-state">
      Aucun repère prévoyance disponible pour {label}.
    </div>
  );
}
function RegimeListSection({
  title,
  regimes,
}: {
  title: string;
  regimes: PrevoyanceRegimeSettings[];
}): ReactElement {
  const { isAdmin, applyEditorTarget } = usePrevoyanceContext();
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  return (
    <section className="prevoyance-settings-page">
      <div className="settings-stack settings-stack--spacious">
        <div className="settings-reference-header">
          <div className="settings-reference-header__copy">
            <h6>{title}</h6>
          </div>
          <span className="settings-reference-badge">{regimes.length} régimes</span>
        </div>
        {regimes.length === 0 ? (
          <EmptySection label={title.toLowerCase()} />
        ) : (
          <div className="fisc-accordion prevoyance-settings-list">
            {regimes.map((regime) => (
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
      </div>
      {editorTarget ? (
        <EditModal
          target={editorTarget}
          onClose={() => setEditorTarget(null)}
          onApply={applyEditorTarget}
        />
      ) : null}
    </section>
  );
}
function MaintienSection(): ReactElement {
  const { isAdmin, maintien, applyEditorTarget } = usePrevoyanceContext();
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const maintienLegal =
    maintien.find((item) => item.code === PREVOYANCE_MAINTIEN_LEGAL_CODE) ?? maintien[0] ?? null;
  if (!maintienLegal) return <EmptySection label="le maintien employeur" />;
  const maintienData = maintienLegal.data.maintienEmployeur;
  return (
    <section className="prevoyance-settings-page">
      <div className="settings-stack settings-stack--spacious">
        <div className="settings-reference-header">
          <div className="settings-reference-header__copy">
            <h6>Maintien employeur légal</h6>
            <p className="settings-premium-subtitle">
              {maintienLegal.label} - millésime {maintienLegal.year}
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              className="settings-reference-admin-action"
              onClick={() => setEditorTarget({ type: 'maintien', value: maintienLegal })}
            >
              Modifier
            </button>
          ) : null}
        </div>
        <div className="settings-reference-rules prevoyance-settings-rules">
          <div className="settings-reference-rules__grid prevoyance-settings-main-grid">
            <PhaseColumn title="Conditions" tone="constitution">
              <RuleCard title="Accès">
                <RuleList
                  items={[
                    `Carence : ${maintienData.carenceDays} j`,
                    `Ancienneté minimale : ${maintienData.minAncienneteYears} an(s)`,
                  ]}
                />
              </RuleCard>
            </PhaseColumn>
            <PhaseColumn title="Maintien" tone="sortie">
              {maintienData.paliers.length === 0 ? (
                <div className="settings-reference-empty-card">
                  <div className="settings-reference-empty-card__title">Aucun palier renseigné</div>
                </div>
              ) : (
                maintienData.paliers.map((palier) => (
                  <RuleCard
                    key={`${palier.fromAncienneteYears}-${palier.toAncienneteYears ?? 'plus'}`}
                    title={`${palier.fromAncienneteYears} à ${palier.toAncienneteYears ?? '+'} ans`}
                  >
                    <RuleList
                      items={[
                        `${palier.firstPeriodDays} j à ${palier.firstPeriodRate} %`,
                        `${palier.secondPeriodDays} j à ${palier.secondPeriodRate} %`,
                      ]}
                    />
                  </RuleCard>
                ))
              )}
            </PhaseColumn>
            <PhaseColumn title="Références" tone="deces">
              <RegimeMetaCard
                sources={maintienLegal.sources}
                cotisations={{
                  mode: 'none',
                  value: null,
                  notes: maintienData.notes,
                }}
                showAdminNotes={isAdmin}
              />
            </PhaseColumn>
          </div>
        </div>
      </div>
      {editorTarget ? (
        <EditModal
          target={editorTarget}
          onClose={() => setEditorTarget(null)}
          onApply={applyEditorTarget}
        />
      ) : null}
    </section>
  );
}
function ContractsSection(): ReactElement {
  return (
    <section className="prevoyance-settings-page">
      <div className="settings-reference-rules prevoyance-settings-rules">
        <RuleCard title="Contrats assurantiels">
          <RuleList
            items={[
              'Les contrats décès, arrêt de travail et invalidité sont détaillés dans la partie Produits & enveloppes réglementés.',
              'Cette entrée garde le lien métier entre garanties privées, régimes obligatoires et simulateur prévoyance.',
              'Les règles contractuelles restent administrées dans Base-Contrat ; aucun paramètre prévoyance supplémentaire n’est dupliqué ici.',
            ]}
          />
        </RuleCard>
      </div>
    </section>
  );
}
export default function MementoPrevoyanceEntrySection({
  entryKey,
}: MementoEntrySectionProps): ReactElement | null {
  const { loading, regimes } = usePrevoyanceContext();
  const grouped = useMemo(
    () => ({
      salaries: regimes.filter((regime) => regime.population === 'salarie'),
      independants: regimes.filter(
        (regime) => regime.population === 'tns' || regime.population === 'exploitant_agricole',
      ),
      caisses: regimes.filter(
        (regime) => regime.population === 'liberal' || regime.population === 'avocat',
      ),
    }),
    [regimes],
  );
  if (loading) return <p className="settings-memento-empty">Chargement de la prévoyance...</p>;
  if (entryKey === 'prevoyance.maintien-employeur') return <MaintienSection />;
  if (entryKey === 'prevoyance.regimes-salaries') {
    return <RegimeListSection title="Régimes salariés" regimes={grouped.salaries} />;
  }
  if (entryKey === 'prevoyance.regimes-independants') {
    return <RegimeListSection title="Régimes indépendants" regimes={grouped.independants} />;
  }
  if (entryKey === 'prevoyance.affiliation-caisses') {
    return <RegimeListSection title="Affiliation aux caisses" regimes={grouped.caisses} />;
  }
  if (entryKey === 'prevoyance.contrats-assurantiels') return <ContractsSection />;

  return null;
}
