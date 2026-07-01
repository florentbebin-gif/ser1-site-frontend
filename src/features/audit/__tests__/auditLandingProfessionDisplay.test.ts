import { describe, expect, it } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import { buildAuditLandingViewModel } from '../auditLandingViewModel';

const NOW = new Date('2026-06-09T10:00:00.000Z');

describe('affichage des professions audit', () => {
  it('normalise les professions connues sans changer la donnée source', () => {
    const audit = createEmptyDossier();
    audit.situationFamiliale.mr = {
      prenom: 'Bernard',
      nom: 'Dupont',
      dateNaissance: '1970-01-01',
      profession: 'RADIOLOGUE',
    };
    audit.situationFamiliale.mme = {
      prenom: 'Tati',
      nom: 'Dupont',
      dateNaissance: '1974-01-01',
      profession: 'Caissiere',
    };
    audit.situationFamiliale.situationMatrimoniale = 'marie';

    const vm = buildAuditLandingViewModel(
      buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
      { now: NOW },
    );

    expect(audit.situationFamiliale.mr.profession).toBe('RADIOLOGUE');
    expect(audit.situationFamiliale.mme?.profession).toBe('Caissiere');
    expect(vm.synthese.principal?.profession).toBe('Radiologue');
    expect(vm.synthese.conjoint?.profession).toBe('Caissière');
  });
});
