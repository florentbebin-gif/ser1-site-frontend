import type { ReactElement } from 'react';

import type {
  AuditPersonRef,
  SituationCivile,
  SituationFamiliale,
  TestamentInfo,
} from '@/domain/audit/types';
import { SimAmountInputPercent } from '@/components/ui/sim';

import { FoyerAvatarBadge } from '../components/FoyerAvatarBadge';
import { TagToggle } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  createTestament,
  DateField,
  emptyToUndefined,
  SelectField,
  TextField,
  updateAt,
} from './auditCockpitShared';
import {
  labelForAuditPersonRef,
  type AuditPersonOption,
  type AuditTransmissionPersonOptions,
} from './transmissionPersonOptions';

const TESTAMENT_TYPE_OPTIONS = [
  { value: 'olographe', label: 'Olographe' },
  { value: 'authentique', label: 'Authentique' },
  { value: 'mystique', label: 'Mystique' },
] satisfies Array<{ value: TestamentInfo['type']; label: string }>;

const TESTAMENT_DISPOSITION_OPTIONS = [
  { value: '', label: 'Disposition à préciser' },
  { value: 'legs_universel', label: 'Legs universel' },
  { value: 'legs_titre_universel', label: 'Legs à titre universel' },
  { value: 'legs_particulier', label: 'Legs particulier' },
];

export function TestamentSection({
  form,
  situationFamiliale,
  personOptions,
  includeConjoint,
  onChange,
}: {
  form: SituationCivile;
  situationFamiliale: SituationFamiliale;
  personOptions: AuditTransmissionPersonOptions;
  includeConjoint: boolean;
  onChange: (updater: (previous: SituationCivile) => SituationCivile) => void;
}): ReactElement {
  const heads: AuditPersonOption[] = [
    personOptions.all.find((option) => option.value === 'client'),
    includeConjoint ? personOptions.all.find((option) => option.value === 'conjoint') : undefined,
  ].filter((option): option is AuditPersonOption => Boolean(option));

  return (
    <AuditDrawerSection
      title="Testament"
      description="Dispositions déclarées par personne, sans calcul de dévolution dans l’audit."
    >
      <div className="audit-testament-grid" data-columns={heads.length > 1 ? 2 : 1}>
        {heads.map((head) => (
          <TestamentCard
            key={head.value}
            testateur={head}
            testament={findTestamentFor(form.testaments, head.value)}
            beneficiaryOptions={personOptions.all}
            fallbackTestament={createTestament(head.value)}
            onChange={(nextTestament) =>
              onChange((previous) => ({
                ...previous,
                testaments: upsertTestament(previous.testaments, head.value, nextTestament),
              }))
            }
          />
        ))}
      </div>
      {situationFamiliale.situationMatrimoniale === 'celibataire' ? (
        <p className="audit-drawer-hint">
          Les bénéficiaires sont issus de Filiation &amp; proches.
        </p>
      ) : null}
    </AuditDrawerSection>
  );
}

function TestamentCard({
  testateur,
  testament,
  fallbackTestament,
  beneficiaryOptions,
  onChange,
}: {
  testateur: AuditPersonOption;
  testament: TestamentInfo | undefined;
  fallbackTestament: TestamentInfo;
  beneficiaryOptions: AuditPersonOption[];
  onChange: (testament: TestamentInfo) => void;
}): ReactElement {
  const current = testament ?? fallbackTestament;
  const active = Boolean(current.actif);
  const beneficiarySelectOptions = [
    { value: '', label: 'Bénéficiaire à préciser' },
    ...beneficiaryOptions.map((option) => ({ value: option.value, label: option.label })),
  ];

  return (
    <article className="audit-testament-card">
      <header className="audit-testament-card__head">
        <span className="audit-ddv-card__identity">
          <FoyerAvatarBadge
            label={testateur.label}
            kind={testateur.kind}
            appearance={testateur.appearance}
          />
          <span>
            <span className="audit-ddv-card__title">{testateur.label}</span>
            <span className="audit-ddv-card__subtitle">Testateur</span>
          </span>
        </span>
        <TagToggle
          label="Testament actif"
          checked={active}
          onChange={(actif) => onChange({ ...current, actif, testateur: testateur.value })}
        />
      </header>
      {active ? (
        <div className="audit-testament-card__body">
          <AuditDrawerFieldGrid columns={3}>
            <SelectField
              label="Type d’acte"
              value={current.type}
              options={TESTAMENT_TYPE_OPTIONS}
              onChange={(type) => onChange({ ...current, type: type as TestamentInfo['type'] })}
            />
            <DateField
              label="Date"
              value={current.date}
              onChange={(date) => onChange({ ...current, date })}
            />
            <SimAmountInputPercent
              label="Quote-part"
              value={current.quotePartPct ?? 0}
              min={0}
              max={100}
              maximumFractionDigits={2}
              onChange={(quotePartPct) => onChange({ ...current, quotePartPct })}
              onEmpty={() => onChange({ ...current, quotePartPct: undefined })}
            />
          </AuditDrawerFieldGrid>
          <AuditDrawerFieldGrid columns={2}>
            <SelectField
              label="Disposition"
              value={current.dispositionType ?? ''}
              options={TESTAMENT_DISPOSITION_OPTIONS}
              onChange={(dispositionType) =>
                onChange({
                  ...current,
                  dispositionType: emptyToUndefined(
                    dispositionType,
                  ) as TestamentInfo['dispositionType'],
                })
              }
            />
            <SelectField
              label="Bénéficiaire"
              value={current.beneficiaire ?? ''}
              options={beneficiarySelectOptions}
              onChange={(beneficiaire) =>
                onChange({
                  ...current,
                  beneficiaire: emptyToUndefined(beneficiaire) as AuditPersonRef | undefined,
                })
              }
            />
          </AuditDrawerFieldGrid>
          <TextField
            label="Description"
            value={current.description ?? ''}
            onChange={(description) =>
              onChange({ ...current, description: emptyToUndefined(description) })
            }
          />
          {current.beneficiaire ? (
            <p className="audit-testament-card__caption">
              Bénéficiaire relié :{' '}
              {labelForAuditPersonRef(beneficiaryOptions, current.beneficiaire)}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="audit-ddv-card__empty">Aucun testament déclaré pour cette personne.</p>
      )}
    </article>
  );
}

function findTestamentFor(
  testaments: TestamentInfo[],
  testateur: AuditPersonRef,
): TestamentInfo | undefined {
  return (
    testaments.find((testament) => testament.testateur === testateur) ??
    (testateur === 'client' ? testaments.find((testament) => !testament.testateur) : undefined)
  );
}

function upsertTestament(
  testaments: TestamentInfo[],
  testateur: AuditPersonRef,
  testament: TestamentInfo,
): TestamentInfo[] {
  const normalized = { ...testament, testateur };
  const existingIndex = testaments.findIndex(
    (item) => item.id === testament.id || item.testateur === testateur,
  );
  if (existingIndex === -1) return [...testaments, normalized];
  return updateAt(testaments, existingIndex, normalized);
}
