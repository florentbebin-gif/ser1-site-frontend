import { describe, expect, it } from 'vitest';

import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { createEmptyDossier, type DossierAudit, type RevenuCategorie } from '@/domain/audit/types';
import type { FiscalContext } from '@/hooks/useFiscalContext';

import {
  buildAuditIrEstimate,
  buildBudgetSynthese,
  buildIfiIndicator,
} from '../cockpit/auditIrAdapter';

function fiscalContext(): FiscalContext {
  return {
    irScaleCurrent: DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    ifi: DEFAULT_TAX_SETTINGS.ifi,
    _raw_tax: DEFAULT_TAX_SETTINGS,
    _raw_ps: DEFAULT_PS_SETTINGS,
  } as unknown as FiscalContext;
}

function revenu(partial: Partial<RevenuCategorie>): RevenuCategorie {
  return {
    id: `r-${Math.random().toString(36).slice(2)}`,
    categorie: 'salaires',
    montantBrut: 0,
    montantNet: 0,
    beneficiaire: 'foyer',
    ...partial,
  };
}

function dossierWith(
  revenus: RevenuCategorie[],
  overrides: Partial<DossierAudit['situationFiscale']> = {},
  matrimoniale: DossierAudit['situationFamiliale']['situationMatrimoniale'] = 'celibataire',
): DossierAudit {
  const base = createEmptyDossier();
  return {
    ...base,
    situationFamiliale: { ...base.situationFamiliale, situationMatrimoniale: matrimoniale },
    situationFiscale: { ...base.situationFiscale, revenus, ...overrides },
  };
}

describe('buildAuditIrEstimate', () => {
  it('ne calcule rien tant qu’aucun revenu net n’est saisi', () => {
    const estimate = buildAuditIrEstimate(dossierWith([]), fiscalContext());
    expect(estimate.hasIncome).toBe(false);
    expect(estimate.result).toBeNull();
  });

  it('célibataire 36 000 € de salaires → irNet aligné sur le barème par défaut', () => {
    const estimate = buildAuditIrEstimate(
      dossierWith([revenu({ categorie: 'salaires', montantNet: 36000, beneficiaire: 'mr' })], {
        nombreParts: 1,
      }),
      fiscalContext(),
    );

    expect(estimate.isCouple).toBe(false);
    expect(estimate.result).not.toBeNull();
    expect(estimate.result!.taxableIncome).toBe(36000);
    // Même fourchette que le test moteur (src/engine/ir/__tests__/compute.test.ts).
    expect(estimate.result!.irNet).toBeGreaterThanOrEqual(3900);
    expect(estimate.result!.irNet).toBeLessThanOrEqual(4100);
  });

  it('couple marié : revenus M. + Mme additionnés dans l’assiette', () => {
    const estimate = buildAuditIrEstimate(
      dossierWith(
        [
          revenu({ categorie: 'salaires', montantNet: 60000, beneficiaire: 'mr' }),
          revenu({ categorie: 'salaires', montantNet: 30000, beneficiaire: 'mme' }),
        ],
        { nombreParts: 2 },
        'marie',
      ),
      fiscalContext(),
    );

    expect(estimate.isCouple).toBe(true);
    expect(estimate.result!.taxableIncome).toBe(90000);
  });

  it('hors couple fiscal, les revenus du conjoint restent dans l’assiette du foyer', () => {
    const estimate = buildAuditIrEstimate(
      dossierWith(
        [revenu({ categorie: 'salaires', montantNet: 40000, beneficiaire: 'mme' })],
        { nombreParts: 1 },
        'concubinage',
      ),
      fiscalContext(),
    );

    expect(estimate.isCouple).toBe(false);
    expect(estimate.result!.taxableIncome).toBe(40000);
  });

  it('revenus fonciers → prélèvements sociaux fonciers, capitaux mobiliers → PFU', () => {
    const fonciers = buildAuditIrEstimate(
      dossierWith([revenu({ categorie: 'fonciers', montantNet: 20000, beneficiaire: 'foyer' })]),
      fiscalContext(),
    );
    expect(fonciers.result!.psFoncier).toBeGreaterThan(0);

    const rcm = buildAuditIrEstimate(
      dossierWith([
        revenu({ categorie: 'capitaux_mobiliers', montantNet: 20000, beneficiaire: 'foyer' }),
      ]),
      fiscalContext(),
    );
    expect(rcm.result!.pfuIr).toBeGreaterThan(0);
  });

  it('consomme les déductions, crédits et option RCM saisis dans le dossier', () => {
    const base = dossierWith(
      [
        revenu({ categorie: 'salaires', montantNet: 50000, beneficiaire: 'mr' }),
        revenu({ categorie: 'capitaux_mobiliers', montantNet: 20000, beneficiaire: 'foyer' }),
      ],
      { nombreParts: 1 },
    );
    const sansCharges = buildAuditIrEstimate(base, fiscalContext());
    const avecCharges = buildAuditIrEstimate(
      {
        ...base,
        situationFiscale: {
          ...base.situationFiscale,
          chargesDeductibles: 3000,
          reductionsCredits: 500,
        },
      },
      fiscalContext(),
    );
    const auBareme = buildAuditIrEstimate(
      { ...base, situationFiscale: { ...base.situationFiscale, rcmOption: 'bareme' } },
      fiscalContext(),
    );

    expect(avecCharges.result!.taxableIncome).toBe(sansCharges.result!.taxableIncome - 3000);
    expect(avecCharges.result!.creditsTotal).toBe(500);
    expect(sansCharges.result!.pfuIr).toBeGreaterThan(0);
    expect(auBareme.result!.pfuIr).toBe(0);
  });

  it('confronte les valeurs déclarées sur l’avis', () => {
    const estimate = buildAuditIrEstimate(
      dossierWith([revenu({ categorie: 'salaires', montantNet: 36000, beneficiaire: 'mr' })], {
        impotRevenu: 4200,
        revenuFiscalReference: 36000,
        nombreParts: 1,
      }),
      fiscalContext(),
    );
    expect(estimate.declaredIr).toBe(4200);
    expect(estimate.declaredRfr).toBe(36000);
  });
});

describe('buildIfiIndicator', () => {
  it('qualifie l’assujettissement IFI depuis Actifs / Passifs et le seuil fiscal centralisé', () => {
    const context = fiscalContext();
    const base = createEmptyDossier();
    const abattementRp = context.ifi.current.residencePrincipaleAbattementRate / 100;
    const valeurResidencePrincipale = Math.ceil(
      context.ifi.current.threshold / (1 - abattementRp) + 1,
    );

    const indicator = buildIfiIndicator(
      {
        ...base,
        actifs: [
          {
            id: 'immo-1',
            type: 'residence_principale',
            libelle: 'Résidence principale',
            valeur: valeurResidencePrincipale,
            proprietaire: 'commun',
          },
        ],
        passif: { ...base.passif, emprunts: [] },
      },
      context,
    );

    expect(indicator.seuil).toBe(context.ifi.current.threshold);
    expect(indicator.assietteImmoNette).toBeGreaterThanOrEqual(context.ifi.current.threshold);
    expect(indicator.status).toBe('assujetti');
  });

  it('reste à qualifier quand aucun actif immobilier n’est saisi', () => {
    const indicator = buildIfiIndicator(createEmptyDossier(), fiscalContext());

    expect(indicator.hasImmo).toBe(false);
    expect(indicator.assietteImmoNette).toBe(0);
    expect(indicator.status).toBe('a-qualifier');
  });
});

describe('buildBudgetSynthese', () => {
  it('calcule la capacité d’épargne annuelle après impôts', () => {
    const base = createEmptyDossier();
    base.passif.emprunts = [
      {
        id: 'pret-1',
        libelle: 'Résidence principale',
        type: 'immobilier',
        capitalInitial: 300000,
        capitalRestantDu: 240000,
        mensualite: 1500,
        tauxInteret: 2.1,
        dateDebut: '2020-01-01',
        dateFin: '2040-01-01',
      },
    ];
    const synthese = buildBudgetSynthese(
      { ...base, budget: { ressourcesAnnuelles: 120000, chargesAnnuelles: 70000 } },
      12500,
    );

    expect(synthese).toMatchObject({
      ressources: 120000,
      charges: 70000,
      empruntsAnnuels: 18000,
      impots: 12500,
      capacite: 19500,
      tauxEndettement: 15,
      hasBudget: true,
    });
  });
});
