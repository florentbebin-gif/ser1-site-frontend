import type { ReactElement } from 'react';

import type { FichePaieAssimileSalarie, PersonInfo } from '@/domain/audit/types';
import { SimModalShell } from '@/components/ui/sim';

import { PercentField } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  emptyToUndefined,
  SelectField,
} from './auditCockpitShared';
import { BooleanSelectField, EuroField } from './professionDrawerInputs';
import {
  AFFILIATION_CAVEC_OPTIONS,
  ANCIENNETE_CNBF_OPTIONS,
  CNBF_RETRAITE_OPTIONS,
  EFFECTIF_SALARIE_OPTIONS,
  createDefaultFichePaieAssimileSalarie,
  normalizeFichePaieAssimileSalarie,
} from './professionFieldRules';

export function FichePaieAssimileModal({
  person,
  onChange,
  onClose,
}: {
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
  onClose: () => void;
}): ReactElement {
  const fichePaie = createDefaultFichePaieAssimileSalarie(person.fichePaieAssimileSalarie);

  const updateFichePaie = (next: FichePaieAssimileSalarie) =>
    onChange({
      ...person,
      fichePaieAssimileSalarie: normalizeFichePaieAssimileSalarie(next),
    });

  return (
    <SimModalShell
      title="Paramétrage de la fiche de paie"
      subtitle="Cotisations et affiliations propres à l’assimilé salarié."
      modalClassName="sim-modal--lg"
      onClose={onClose}
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Cotisations URSSAF">
          <AuditDrawerFieldGrid columns={3}>
            <PercentField
              label="Taux d’activité"
              value={fichePaie.tauxActivitePct}
              onChange={(tauxActivitePct) => updateFichePaie({ ...fichePaie, tauxActivitePct })}
            />
            <PercentField
              label="Accident du travail"
              value={fichePaie.accidentTravailPct}
              onChange={(accidentTravailPct) =>
                updateFichePaie({ ...fichePaie, accidentTravailPct })
              }
            />
            <PercentField
              label="Versement transport"
              value={fichePaie.versementTransportPct}
              onChange={(versementTransportPct) =>
                updateFichePaie({ ...fichePaie, versementTransportPct })
              }
            />
          </AuditDrawerFieldGrid>
          <AuditDrawerFieldGrid columns={3}>
            <BooleanSelectField
              label="Contribution à la formation"
              value={fichePaie.contributionFormation}
              onChange={(contributionFormation) =>
                updateFichePaie({ ...fichePaie, contributionFormation })
              }
            />
            <BooleanSelectField
              label="Taxe d’apprentissage"
              value={fichePaie.taxeApprentissage}
              onChange={(taxeApprentissage) => updateFichePaie({ ...fichePaie, taxeApprentissage })}
            />
            <BooleanSelectField
              label="Assurance chômage"
              value={fichePaie.assuranceChomage}
              onChange={(assuranceChomage) => updateFichePaie({ ...fichePaie, assuranceChomage })}
            />
            <BooleanSelectField
              label="Réduction générale"
              value={fichePaie.reductionGenerale}
              onChange={(reductionGenerale) => updateFichePaie({ ...fichePaie, reductionGenerale })}
            />
            <BooleanSelectField
              label="Taxe sur les salaires"
              value={fichePaie.taxeSalaires}
              onChange={(taxeSalaires) => updateFichePaie({ ...fichePaie, taxeSalaires })}
            />
            <BooleanSelectField
              label="Régime Alsace-Moselle"
              value={fichePaie.regimeAlsaceMoselle}
              onChange={(regimeAlsaceMoselle) =>
                updateFichePaie({ ...fichePaie, regimeAlsaceMoselle })
              }
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>

        <AuditDrawerSection title="Effectif et affiliations">
          <AuditDrawerFieldGrid columns={2}>
            <SelectField
              label="Effectif salarié"
              value={fichePaie.effectifSalarie ?? ''}
              options={EFFECTIF_SALARIE_OPTIONS}
              onChange={(effectifSalarie) =>
                updateFichePaie({
                  ...fichePaie,
                  effectifSalarie: emptyToUndefined(
                    effectifSalarie,
                  ) as FichePaieAssimileSalarie['effectifSalarie'],
                })
              }
            />
            <SelectField
              label="Affiliation CAVEC"
              value={fichePaie.affiliationCavec ?? ''}
              options={AFFILIATION_CAVEC_OPTIONS}
              onChange={(affiliationCavec) =>
                updateFichePaie({
                  ...fichePaie,
                  affiliationCavec: emptyToUndefined(
                    affiliationCavec,
                  ) as FichePaieAssimileSalarie['affiliationCavec'],
                })
              }
            />
            <BooleanSelectField
              label="Affiliation CNBF"
              value={fichePaie.affiliationCnbf}
              onChange={(affiliationCnbf) => updateFichePaie({ ...fichePaie, affiliationCnbf })}
            />
            <EuroField
              label="Avantages en nature (fiche de paie)"
              value={fichePaie.avantagesNatureFichePaie}
              onChange={(avantagesNatureFichePaie) =>
                updateFichePaie({ ...fichePaie, avantagesNatureFichePaie })
              }
            />
            {fichePaie.affiliationCnbf ? (
              <>
                <SelectField
                  label="Ancienneté CNBF"
                  value={fichePaie.ancienneteCnbf ?? ''}
                  options={ANCIENNETE_CNBF_OPTIONS}
                  onChange={(ancienneteCnbf) =>
                    updateFichePaie({
                      ...fichePaie,
                      ancienneteCnbf: emptyToUndefined(
                        ancienneteCnbf,
                      ) as FichePaieAssimileSalarie['ancienneteCnbf'],
                    })
                  }
                />
                <SelectField
                  label="Classe retraite CNBF"
                  value={fichePaie.classeRetraiteCnbf ?? ''}
                  options={CNBF_RETRAITE_OPTIONS}
                  onChange={(classeRetraiteCnbf) =>
                    updateFichePaie({
                      ...fichePaie,
                      classeRetraiteCnbf: emptyToUndefined(
                        classeRetraiteCnbf,
                      ) as FichePaieAssimileSalarie['classeRetraiteCnbf'],
                    })
                  }
                />
              </>
            ) : null}
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </SimModalShell>
  );
}
