import { useEffect, useState, type ReactElement } from 'react';

import { type DossierAudit, type PersonInfo } from '@/domain/audit/types';

import { AuditDrawerXL } from '../components/AuditDrawerXL';
import { FoyerAvatarBadge } from '../components/FoyerAvatarBadge';
import { FichePaieAssimileModal } from './FichePaieAssimileModal';
import { PercentField, TagRow, TagToggle } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  DrawerFooter,
  emptyToUndefined,
  fullName,
  SelectField,
  TextField,
} from './auditCockpitShared';
import { BooleanSelectField, EuroField } from './professionDrawerInputs';
import {
  STATUT_SOCIAL_OPTIONS,
  buildProfessionFieldRules,
  createDefaultFichePaieAssimileSalarie,
  normalizeProfessionProfile,
} from './professionFieldRules';

export function ProfessionDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (mr: PersonInfo, mme: PersonInfo | undefined) => void;
}): ReactElement {
  const [mr, setMr] = useState(() => normalizeProfessionProfile(dossier.situationFamiliale.mr));
  const [mme, setMme] = useState(() =>
    dossier.situationFamiliale.mme
      ? normalizeProfessionProfile(dossier.situationFamiliale.mme)
      : undefined,
  );

  useEffect(() => {
    if (!open) return;
    setMr(normalizeProfessionProfile(dossier.situationFamiliale.mr));
    setMme(
      dossier.situationFamiliale.mme
        ? normalizeProfessionProfile(dossier.situationFamiliale.mme)
        : undefined,
    );
  }, [dossier.situationFamiliale.mme, dossier.situationFamiliale.mr, open]);

  return (
    <AuditDrawerXL
      open={open}
      title="Situation professionnelle"
      subtitle="Statut professionnel, affiliation et paramètres d’activité par personne."
      onClose={onClose}
      footer={
        <DrawerFooter
          onCancel={onClose}
          onSave={() =>
            onSave(
              normalizeProfessionProfile(mr),
              mme ? normalizeProfessionProfile(mme) : undefined,
            )
          }
        />
      }
    >
      <div className="audit-drawer-form">
        <div
          className="audit-profession-columns"
          data-columns={dossier.situationFamiliale.mme ? 2 : 1}
        >
          <ProfessionalProfileFields
            fallbackTitle="Client principal"
            fallbackKind="homme"
            person={mr}
            onChange={setMr}
          />
          {mme ? (
            <ProfessionalProfileFields
              fallbackTitle="Conjoint"
              fallbackKind="femme"
              person={mme}
              onChange={setMme}
            />
          ) : null}
        </div>
      </div>
    </AuditDrawerXL>
  );
}

function ProfessionalProfileFields({
  fallbackTitle,
  fallbackKind,
  person,
  onChange,
}: {
  fallbackTitle: string;
  fallbackKind: Parameters<typeof FoyerAvatarBadge>[0]['kind'];
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
}): ReactElement {
  const [fichePaieOpen, setFichePaieOpen] = useState(false);
  const rules = buildProfessionFieldRules(person);
  const updatePerson = (next: PersonInfo) => onChange(normalizeProfessionProfile(next));
  const profileTitle = fullName(person) || fallbackTitle;
  const avatarKind = person.avatarKind ?? fallbackKind;
  const density = isSimpleProfessionProfile(rules) ? 'simple' : 'rich';

  const openFichePaie = () => {
    updatePerson({
      ...person,
      fichePaieAssimileSalarie: createDefaultFichePaieAssimileSalarie(
        person.fichePaieAssimileSalarie,
      ),
    });
    setFichePaieOpen(true);
  };

  return (
    <AuditDrawerSection
      className="audit-profession-card"
      density={density}
      title={
        <span className="audit-ddv-card__identity audit-profession-identity">
          <FoyerAvatarBadge
            label={profileTitle}
            kind={avatarKind}
            appearance={person.avatarAppearance}
          />
          <span>
            <span className="audit-ddv-card__title">{profileTitle}</span>
            <span className="audit-ddv-card__subtitle">{fallbackTitle}</span>
          </span>
        </span>
      }
    >
      <AuditDrawerFieldGrid columns={2}>
        <SelectField
          label="Statut social"
          value={person.statutSocial ?? ''}
          options={STATUT_SOCIAL_OPTIONS}
          onChange={(statutSocial) =>
            updatePerson({
              ...person,
              statutSocial: emptyToUndefined(statutSocial) as PersonInfo['statutSocial'],
              professionLiberaleReglementee: undefined,
              professionLiberaleCategorie: undefined,
            })
          }
        />
        {rules.showProfession ? (
          <TextField
            label="Profession (libellé)"
            value={person.profession ?? ''}
            onChange={(profession) =>
              updatePerson({ ...person, profession: emptyToUndefined(profession) })
            }
          />
        ) : null}
      </AuditDrawerFieldGrid>

      {rules.showModeExercice || rules.showCaisseRetraite ? (
        <AuditDrawerFieldGrid columns={2}>
          {rules.showModeExercice ? (
            <SelectField
              label="Mode d’exercice"
              value={person.modeExercice ?? ''}
              options={rules.modeExerciceOptions}
              onChange={(modeExercice) =>
                updatePerson({
                  ...person,
                  modeExercice: emptyToUndefined(modeExercice) as PersonInfo['modeExercice'],
                })
              }
            />
          ) : null}
          {rules.showRemunerationMandatPct ? (
            <PercentField
              label="% rémunération du mandat"
              value={person.remunerationMandatPct}
              onChange={(remunerationMandatPct) =>
                updatePerson({ ...person, remunerationMandatPct })
              }
            />
          ) : null}
          {rules.showCaisseRetraite ? (
            <SelectField
              label="Caisse d’affiliation"
              value={person.caisseRetraite ?? ''}
              options={rules.caisseRetraiteOptions}
              forced={Boolean(rules.forcedCaisseRetraite)}
              onChange={(caisseRetraite) =>
                updatePerson({
                  ...person,
                  caisseRetraite: emptyToUndefined(caisseRetraite) as PersonInfo['caisseRetraite'],
                  professionLiberaleReglementee: undefined,
                  professionLiberaleCategorie: undefined,
                })
              }
            />
          ) : null}
          {rules.showProfessionLiberaleReglementeeControl ? (
            <div className="audit-profession-plr-toggle">
              <TagRow>
                <TagToggle
                  label="PLR"
                  checked={person.professionLiberaleReglementee === true}
                  tone="impact"
                  onChange={(professionLiberaleReglementee) =>
                    updatePerson({
                      ...person,
                      professionLiberaleReglementee: professionLiberaleReglementee
                        ? true
                        : undefined,
                      professionLiberaleCategorie: professionLiberaleReglementee
                        ? person.professionLiberaleCategorie
                        : undefined,
                    })
                  }
                />
              </TagRow>
            </div>
          ) : null}
          {rules.showProfessionLiberaleReglementeeControl &&
          person.professionLiberaleReglementee === true ? (
            <SelectField
              label="Catégorie PLR"
              value={person.professionLiberaleCategorie ?? ''}
              options={rules.professionLiberaleCategorieOptions}
              onChange={(professionLiberaleCategorie) =>
                updatePerson({
                  ...person,
                  professionLiberaleCategorie: emptyToUndefined(
                    professionLiberaleCategorie,
                  ) as PersonInfo['professionLiberaleCategorie'],
                })
              }
            />
          ) : null}
          {rules.showProfessionLiberaleReglementeeBadge ? (
            <div className="audit-profession-badge-row">
              {rules.professionLiberaleReglementeeBadgeLabels.map((label) => (
                <span
                  key={label}
                  className="audit-status-badge"
                  aria-label={
                    label === 'PLR' ? 'Badge Profession libérale réglementée' : `Badge ${label}`
                  }
                  title={label === 'PLR' ? 'Profession libérale réglementée' : label}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </AuditDrawerFieldGrid>
      ) : null}

      {rules.showStatutConventionnel || rules.showTauxPriseEnChargeCpam ? (
        <AuditDrawerFieldGrid columns={2}>
          {rules.showStatutConventionnel ? (
            <SelectField
              label="Conventionné"
              value={person.statutConventionnel ?? ''}
              options={rules.statutConventionnelOptions}
              onChange={(statutConventionnel) =>
                updatePerson({
                  ...person,
                  statutConventionnel: emptyToUndefined(
                    statutConventionnel,
                  ) as PersonInfo['statutConventionnel'],
                })
              }
            />
          ) : null}
          {rules.showTauxPriseEnChargeCpam ? (
            <PercentField
              label="Taux de prise en charge CPAM"
              value={person.tauxPriseEnChargeCpam}
              onChange={(tauxPriseEnChargeCpam) =>
                updatePerson({ ...person, tauxPriseEnChargeCpam })
              }
            />
          ) : null}
        </AuditDrawerFieldGrid>
      ) : null}

      {rules.showClassePrevoyance ||
      rules.showClasseRetraite ||
      rules.showBiologisteConventionne ? (
        <AuditDrawerFieldGrid columns={2}>
          {rules.showClassePrevoyance ? (
            <SelectField
              label="Classe prévoyance"
              value={person.classePrevoyance ?? ''}
              options={rules.classePrevoyanceOptions}
              onChange={(classePrevoyance) =>
                updatePerson({
                  ...person,
                  classePrevoyance: emptyToUndefined(
                    classePrevoyance,
                  ) as PersonInfo['classePrevoyance'],
                })
              }
            />
          ) : null}
          {rules.showBiologisteConventionne ? (
            <BooleanSelectField
              label="Biologiste conventionné"
              value={person.biologisteConventionne}
              onChange={(biologisteConventionne) =>
                updatePerson({ ...person, biologisteConventionne })
              }
            />
          ) : null}
          {rules.showClasseRetraite ? (
            <SelectField
              label="Classe retraite"
              value={person.classeRetraite ?? ''}
              options={rules.classeRetraiteOptions}
              onChange={(classeRetraite) =>
                updatePerson({
                  ...person,
                  classeRetraite: emptyToUndefined(classeRetraite) as PersonInfo['classeRetraite'],
                })
              }
            />
          ) : null}
        </AuditDrawerFieldGrid>
      ) : null}

      {rules.showAncienneteCnbf || rules.showCrnFields ? (
        <AuditDrawerFieldGrid columns={2}>
          {rules.showAncienneteCnbf ? (
            <SelectField
              label="Ancienneté"
              value={person.ancienneteCnbf ?? ''}
              options={rules.ancienneteCnbfOptions}
              onChange={(ancienneteCnbf) =>
                updatePerson({
                  ...person,
                  ancienneteCnbf: emptyToUndefined(ancienneteCnbf) as PersonInfo['ancienneteCnbf'],
                })
              }
            />
          ) : null}
          {rules.showCrnFields ? (
            <>
              <BooleanSelectField
                label="Prestation de serment avant 2014"
                value={person.prestationSermentAvant2014}
                onChange={(prestationSermentAvant2014) =>
                  updatePerson({ ...person, prestationSermentAvant2014 })
                }
              />
              <BooleanSelectField
                label="Régime de Colmar et Metz"
                value={person.regimeColmarMetz}
                onChange={(regimeColmarMetz) => updatePerson({ ...person, regimeColmarMetz })}
              />
              <EuroField
                label="Moyenne des produits de l’étude"
                value={person.moyenneProduitsEtude}
                onChange={(moyenneProduitsEtude) =>
                  updatePerson({ ...person, moyenneProduitsEtude })
                }
              />
            </>
          ) : null}
        </AuditDrawerFieldGrid>
      ) : null}

      {rules.showCommissionsBrutes || rules.showAtexa ? (
        <AuditDrawerFieldGrid columns={2}>
          {rules.showCommissionsBrutes ? (
            <EuroField
              label="Commissions brutes"
              value={person.commissionsBrutes}
              onChange={(commissionsBrutes) => updatePerson({ ...person, commissionsBrutes })}
            />
          ) : null}
          {rules.showAtexa ? (
            <SelectField
              label="ATEXA"
              value={person.atexa ?? ''}
              options={rules.atexaOptions}
              onChange={(atexa) =>
                updatePerson({
                  ...person,
                  atexa: emptyToUndefined(atexa) as PersonInfo['atexa'],
                })
              }
            />
          ) : null}
        </AuditDrawerFieldGrid>
      ) : null}

      {rules.showFichePaieButton ? (
        <div className="audit-drawer-actions">
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--ghost"
            onClick={openFichePaie}
          >
            Paramétrage de la fiche de paie
          </button>
        </div>
      ) : null}

      {fichePaieOpen && person.statutSocial === 'assimile_salarie' ? (
        <FichePaieAssimileModal
          person={person}
          onChange={updatePerson}
          onClose={() => setFichePaieOpen(false)}
        />
      ) : null}
    </AuditDrawerSection>
  );
}

function isSimpleProfessionProfile(rules: ReturnType<typeof buildProfessionFieldRules>): boolean {
  return !(
    rules.showModeExercice ||
    rules.showRemunerationMandatPct ||
    rules.showCaisseRetraite ||
    rules.showStatutConventionnel ||
    rules.showTauxPriseEnChargeCpam ||
    rules.showClassePrevoyance ||
    rules.showClasseRetraite ||
    rules.showBiologisteConventionne ||
    rules.showAncienneteCnbf ||
    rules.showCrnFields ||
    rules.showCommissionsBrutes ||
    rules.showAtexa ||
    rules.showFichePaieButton
  );
}
