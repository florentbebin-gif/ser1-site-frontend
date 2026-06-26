import { describe, expect, it } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import { buildAuditLandingViewModel } from '../auditLandingViewModel';

const NOW = new Date('2026-06-09T10:00:00.000Z');

describe('progression audit — situation professionnelle', () => {
  it('ne marque pas la section complète si le libellé requis manque', () => {
    const audit = createEmptyDossier();
    audit.situationFamiliale.mr = {
      prenom: 'Jean',
      nom: 'Martin',
      dateNaissance: '1980-01-01',
      statutSocial: 'salarie_cadre_prive',
    };

    const vm = buildAuditLandingViewModel(
      buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
      { now: NOW },
    );

    expect(vm.progress).toContainEqual(
      expect.objectContaining({
        id: 'situation-professionnelle',
        status: 'partiel',
      }),
    );
  });
});
