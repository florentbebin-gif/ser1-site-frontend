import type { HeritiersInput, LienParente } from '../../../../engine/succession';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDonationEntry,
} from '../../successionDraft';
import type { SuccessionDonationSettings } from '../../successionFiscalContext';

interface OfficialSource {
  label: string;
  url: string;
  consultedAt: string;
}

interface ExpectedSuccessionDetail {
  lien: LienParente;
  partBrute?: number;
  abattement: number;
  baseImposable: number;
  droits: number;
}

export interface SuccessionNotarialReference {
  id: string;
  title: string;
  sources: OfficialSource[];
  engineInput: {
    actifNetSuccession: number;
    heritiers: HeritiersInput[];
  };
  expected: {
    totalDroits: number;
    details: ExpectedSuccessionDetail[];
  };
  directDisplay?: {
    civil?: Partial<SuccessionCivilContext>;
    heirs?: Array<Pick<HeritiersInput, 'lien' | 'partSuccession'>>;
    heirIds?: string[];
    donations?: SuccessionDonationEntry[];
    donationSettings?: SuccessionDonationSettings;
    referenceDate?: string;
  };
}

const CONSULTED_AT = '2026-04-29';

const SOURCES = {
  servicePublicDroits: {
    label: 'Service-Public F35794 - droits de succession par lien avec le défunt',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F35794',
    consultedAt: CONSULTED_AT,
  },
  cgi777: {
    label: 'CGI art. 777 - barèmes DMTG',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030061736',
    consultedAt: CONSULTED_AT,
  },
  cgi779: {
    label: 'CGI art. 779 - abattements enfants, frères / sœurs, neveux / nièces',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000026292566',
    consultedAt: CONSULTED_AT,
  },
  cgi784: {
    label: 'CGI art. 784 - rappel fiscal des donations antérieures',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033809289',
    consultedAt: CONSULTED_AT,
  },
  cgi757B: {
    label: 'CGI art. 757 B - primes assurance-vie versées après 70 ans',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047288569',
    consultedAt: CONSULTED_AT,
  },
  cgi990I: {
    label: 'CGI art. 990 I - capitaux assurance-vie versés avant 70 ans',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033817392',
    consultedAt: CONSULTED_AT,
  },
  cgi7960Bis: {
    label: 'CGI art. 796-0 bis - exonération conjoint / partenaire PACS',
    url: 'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006305480',
    consultedAt: CONSULTED_AT,
  },
} satisfies Record<string, OfficialSource>;

export const SUCCESSION_DONATION_SETTINGS: SuccessionDonationSettings = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
};

export const SUCCESSION_NOTARIAL_REFERENCES: SuccessionNotarialReference[] = [
  {
    id: 'ligne-directe-enfant-service-public-150k',
    title: 'Enfant unique, part successorale 150 kEUR',
    sources: [SOURCES.servicePublicDroits, SOURCES.cgi777, SOURCES.cgi779],
    engineInput: {
      actifNetSuccession: 150000,
      heritiers: [{ lien: 'enfant', partSuccession: 150000 }],
    },
    expected: {
      totalDroits: 8194,
      details: [{ lien: 'enfant', partBrute: 150000, abattement: 100000, baseImposable: 50000, droits: 8194 }],
    },
  },
  {
    id: 'conjoint-deux-enfants-600k',
    title: 'Conjoint exonéré et deux enfants, répartition 300 kEUR / 150 kEUR / 150 kEUR',
    sources: [SOURCES.servicePublicDroits, SOURCES.cgi777, SOURCES.cgi779, SOURCES.cgi7960Bis],
    engineInput: {
      actifNetSuccession: 600000,
      heritiers: [
        { lien: 'conjoint', partSuccession: 300000 },
        { lien: 'enfant', partSuccession: 150000 },
        { lien: 'enfant', partSuccession: 150000 },
      ],
    },
    expected: {
      totalDroits: 16388,
      details: [
        { lien: 'conjoint', partBrute: 300000, abattement: 300000, baseImposable: 0, droits: 0 },
        { lien: 'enfant', partBrute: 150000, abattement: 100000, baseImposable: 50000, droits: 8194 },
        { lien: 'enfant', partBrute: 150000, abattement: 100000, baseImposable: 50000, droits: 8194 },
      ],
    },
    directDisplay: {
      civil: { situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_legale' },
    },
  },
  {
    id: 'donation-rappelable-enfant-150k-donation-80k',
    title: 'Enfant avec donation de 80 kEUR rappelable dans le délai de 15 ans',
    sources: [SOURCES.cgi777, SOURCES.cgi779, SOURCES.cgi784],
    engineInput: {
      actifNetSuccession: 150000,
      heritiers: [{
        lien: 'enfant',
        partSuccession: 150000,
        baseHistoriqueTaxee: 80000,
        droitsDejaAcquittes: 0,
      }],
    },
    expected: {
      totalDroits: 24194,
      details: [{ lien: 'enfant', partBrute: 150000, abattement: 100000, baseImposable: 130000, droits: 24194 }],
    },
    directDisplay: {
      heirs: [{ lien: 'enfant', partSuccession: 150000 }],
      heirIds: ['enfant-donataire'],
      donations: [{
        id: 'don-rappelable',
        type: 'rapportable',
        montant: 80000,
        valeurDonation: 80000,
        date: '2020-06',
        donateur: 'epoux1',
        donataire: 'enfant-donataire',
      }],
      donationSettings: SUCCESSION_DONATION_SETTINGS,
      referenceDate: '2026-01-01T00:00:00Z',
    },
  },
  {
    id: 'donation-hors-rappel-enfant-150k-donation-80k',
    title: 'Enfant avec donation de 80 kEUR hors délai de rappel fiscal',
    sources: [SOURCES.cgi777, SOURCES.cgi779, SOURCES.cgi784],
    engineInput: {
      actifNetSuccession: 150000,
      heritiers: [{ lien: 'enfant', partSuccession: 150000 }],
    },
    expected: {
      totalDroits: 8194,
      details: [{ lien: 'enfant', partBrute: 150000, abattement: 100000, baseImposable: 50000, droits: 8194 }],
    },
    directDisplay: {
      heirs: [{ lien: 'enfant', partSuccession: 150000 }],
      heirIds: ['enfant-donataire'],
      donations: [{
        id: 'don-hors-rappel',
        type: 'rapportable',
        montant: 80000,
        valeurDonation: 80000,
        date: '2010-12',
        donateur: 'epoux1',
        donataire: 'enfant-donataire',
      }],
      donationSettings: SUCCESSION_DONATION_SETTINGS,
      referenceDate: '2026-01-01T00:00:00Z',
    },
  },
  {
    id: 'frere-soeur-200k',
    title: 'Frère ou sœur, part successorale 200 kEUR',
    sources: [SOURCES.servicePublicDroits, SOURCES.cgi777, SOURCES.cgi779],
    engineInput: {
      actifNetSuccession: 200000,
      heritiers: [{ lien: 'frere_soeur', partSuccession: 200000 }],
    },
    expected: {
      totalDroits: 80388,
      details: [{ lien: 'frere_soeur', partBrute: 200000, abattement: 15932, baseImposable: 184068, droits: 80388 }],
    },
  },
  {
    id: 'neveu-niece-100k',
    title: 'Neveu ou nièce, part successorale 100 kEUR',
    sources: [SOURCES.servicePublicDroits, SOURCES.cgi777, SOURCES.cgi779],
    engineInput: {
      actifNetSuccession: 100000,
      heritiers: [{ lien: 'neveu_niece', partSuccession: 100000 }],
    },
    expected: {
      totalDroits: 50618,
      details: [{ lien: 'neveu_niece', partBrute: 100000, abattement: 7967, baseImposable: 92033, droits: 50618 }],
    },
  },
  {
    id: 'tiers-50k',
    title: 'Personne non parente, part successorale 50 kEUR',
    sources: [SOURCES.servicePublicDroits, SOURCES.cgi777],
    engineInput: {
      actifNetSuccession: 50000,
      heritiers: [{ lien: 'autre', partSuccession: 50000 }],
    },
    expected: {
      totalDroits: 29044,
      details: [{ lien: 'autre', partBrute: 50000, abattement: 1594, baseImposable: 48406, droits: 29044 }],
    },
  },
];

/**
 * Golden notarial AV 757 B - tiers beneficiaire.
 *
 * Detail du calcul :
 * - Primes versees apres 70 ans : 100 000 EUR (entry.versementsApres70).
 * - Abattement specifique 757 B (CGI art. 757 B alinea 1) : 30 500 EUR global.
 *   → Base fiscale 757 B : 100 000 - 30 500 = 69 500 EUR.
 * - L'art. 757 B precise que ces sommes "donnent ouverture aux droits de
 *   mutation par deces suivant le degre de parente entre le beneficiaire a
 *   titre gratuit et l'assure".
 * - Application des regles de droit commun (BOFiP BOI-ENR-DMTG-10-10-20-20
 *   §260) : abattement personnel residuel art. 788 IV pour un beneficiaire
 *   tiers sans autre abattement = 1 594 EUR.
 *   → Base imposable apres abattement personnel : 69 500 - 1 594 = 67 906 EUR.
 * - Bareme tiers art. 777 (60 % au-dela des seuils en ligne directe etendue
 *   ou tiers) : 67 906 × 60 % = 40 743,60 EUR ≈ 40 744 EUR.
 *
 * Sources :
 * - CGI art. 757 B : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047288569
 * - CGI art. 777 (bareme tiers) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030061736
 * - CGI art. 788 IV (abattement personnel residuel) : applique en droit commun
 * - BOFiP BOI-ENR-DMTG-10-10-20-20 §260 : coordination 757 B + abattements
 *   personnels en droit commun.
 * - Service-Public F35794 : taux 60 % beneficiaire tiers.
 */
export const ASSURANCE_VIE_757B_NOTARIAL_REFERENCE = {
  id: 'assurance-vie-757b-tiers-100k',
  title: 'Assurance-vie 757 B, bénéficiaire tiers, 100 kEUR de primes après 70 ans',
  sources: [SOURCES.cgi757B, SOURCES.cgi777, SOURCES.servicePublicDroits],
  entry: {
    id: 'av-757b-tiers',
    typeContrat: 'personnalisee',
    souscripteur: 'epoux1',
    assure: 'epoux1',
    clauseBeneficiaire: 'CUSTOM:autre:100',
    capitauxDeces: 100000,
    versementsApres70: 100000,
    versementsAvant13101998: 0,
  } satisfies SuccessionAssuranceVieEntry,
  expectedLine: {
    id: 'autre',
    lien: 'autre',
    capitauxAvant70: 0,
    capitauxApres70: 100000,
    baseFiscale757B: 100000,
    taxable757B: 69500, // 100 000 - 30 500 (abattement 757 B)
    droits757B: 40744, // (69 500 - 1 594) × 60 %, cf. detail dans le commentaire
    droits990I: 0,
    totalDroits: 40744,
  },
  expectedTotalDroits: 40744,
};

/**
 * Corpus de references notariales pour l'assurance-vie (PR-F2).
 *
 * Chaque scenario fige le calcul du moteur SER1 contre des sources publiques
 * (Legifrance + BOFiP + Service-Public). Les valeurs attendues sont detaillees
 * dans le commentaire de chaque scenario.
 *
 * Les scenarios couvrent :
 * - 990 I (versements avant 70 ans) avec abattement 152 500 EUR par beneficiaire
 * - 757 B (versements apres 70 ans) avec abattement global 30 500 EUR + droit
 *   commun (CGI 788 IV) pour le bareme final
 * - exoneration CGI 796-0 bis pour le conjoint et le partenaire pacse
 */
export interface AssuranceVieNotarialReference {
  id: string;
  title: string;
  sources: OfficialSource[];
  entry: SuccessionAssuranceVieEntry;
  civil?: Partial<SuccessionCivilContext>;
  familyMembers?: FamilyMember[];
  expectedLine: {
    id: string;
    lien: LienParente;
    capitauxAvant70: number;
    capitauxApres70: number;
    baseFiscale990I?: number;
    baseFiscale757B?: number;
    taxable990I: number;
    taxable757B: number;
    droits990I: number;
    droits757B: number;
    totalDroits: number;
  };
  expectedTotalDroits: number;
}

export const ASSURANCE_VIE_NOTARIAL_REFERENCES: AssuranceVieNotarialReference[] = [
  /**
   * Scenario 1 - AV 100 kEUR tiers, 100 % de versements avant 70 ans.
   *
   * Detail du calcul :
   * - capitauxDeces = 100 000, versementsApres70 = 0.
   * - Tout est ventile sur le regime CGI 990 I.
   * - Abattement 990 I = 152 500 EUR par beneficiaire (CGI art. 990 I al. 2).
   * - Base taxable 990 I = max(0, 100 000 - 152 500) = 0.
   * - Droits = 0 EUR (abattement non epuise).
   *
   * Ce golden fige l'invariant "AV 990 I sous le seuil d'abattement = 0 droit".
   */
  {
    id: 'av-tiers-100k-pre-70',
    title: 'AV 100 kEUR tiers, versements avant 70 ans (990 I, abattement non epuise)',
    sources: [SOURCES.cgi990I, SOURCES.servicePublicDroits],
    entry: {
      id: 'av-pre70-tiers',
      typeContrat: 'personnalisee',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      clauseBeneficiaire: 'CUSTOM:autre:100',
      capitauxDeces: 100000,
      versementsApres70: 0,
      versementsAvant13101998: 0,
    },
    expectedLine: {
      id: 'autre',
      lien: 'autre',
      capitauxAvant70: 100000,
      capitauxApres70: 0,
      taxable990I: 0,
      taxable757B: 0,
      droits990I: 0,
      droits757B: 0,
      totalDroits: 0,
    },
    expectedTotalDroits: 0,
  },

  /**
   * Scenario 2 - AV 100 kEUR tiers, mix 60 kEUR avant 70 + 40 kEUR apres 70.
   *
   * Detail du calcul :
   * - Tranche avant 70 : 60 000 → 990 I.
   *   Abattement 152 500 → base 0 → droits 0.
   * - Tranche apres 70 : 40 000 → 757 B.
   *   Abattement 757 B = 30 500 → base 9 500.
   *   Beneficiaire tiers (lien='autre') : abattement personnel CGI 788 IV =
   *   1 594 EUR.
   *   Base imposable finale : 9 500 - 1 594 = 7 906.
   *   Bareme tiers CGI 777 = 60 %.
   *   Droits 757 B : 7 906 × 60 % = 4 743,60 ≈ 4 744 EUR.
   * - Total = 0 + 4 744 = 4 744 EUR.
   *
   * Ce golden fige le calcul mixte 990 I / 757 B sur un meme contrat.
   */
  {
    id: 'av-tiers-100k-mix-60-40',
    title: 'AV 100 kEUR tiers, 60 kEUR avant 70 + 40 kEUR apres 70',
    sources: [SOURCES.cgi990I, SOURCES.cgi757B, SOURCES.cgi777, SOURCES.servicePublicDroits],
    entry: {
      id: 'av-mix-tiers',
      typeContrat: 'personnalisee',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      clauseBeneficiaire: 'CUSTOM:autre:100',
      capitauxDeces: 100000,
      versementsApres70: 40000,
      versementsAvant13101998: 0,
    },
    expectedLine: {
      id: 'autre',
      lien: 'autre',
      capitauxAvant70: 60000,
      capitauxApres70: 40000,
      taxable990I: 0,
      taxable757B: 9500,
      droits990I: 0,
      droits757B: 4744,
      totalDroits: 4744,
    },
    expectedTotalDroits: 4744,
  },

  /**
   * Scenario 3 - AV 100 kEUR frere/soeur, 100 % de versements apres 70 ans.
   *
   * Detail du calcul :
   * - Tout est ventile sur 757 B.
   * - Abattement 757 B = 30 500 → base 69 500.
   * - Beneficiaire frere/soeur : abattement personnel CGI 779 IV = 15 932 EUR.
   *   Base imposable finale : 69 500 - 15 932 = 53 568.
   * - Bareme frere/soeur CGI 777 : 35 % jusqu'a 24 430, 45 % au-dela.
   *   24 430 × 35 % = 8 550,5
   *   (53 568 - 24 430) × 45 % = 29 138 × 45 % = 13 112,1
   *   Total = 21 662,6 ≈ 21 663 EUR.
   *
   * Sources : CGI 757 B, CGI 779 IV (abattement 15 932), CGI 777 (bareme 35/45 %),
   * Service-Public F35794 (taux frere/soeur).
   */
  {
    id: 'av-frere-soeur-100k-post-70',
    title: 'AV 100 kEUR frere/soeur, 100 kEUR de primes apres 70 ans',
    sources: [SOURCES.cgi757B, SOURCES.cgi779, SOURCES.cgi777, SOURCES.servicePublicDroits],
    entry: {
      id: 'av-frere-soeur',
      typeContrat: 'personnalisee',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      clauseBeneficiaire: 'CUSTOM:F1:100',
      capitauxDeces: 100000,
      versementsApres70: 100000,
      versementsAvant13101998: 0,
    },
    familyMembers: [{ id: 'F1', type: 'frere_soeur', branch: 'epoux1' }],
    expectedLine: {
      id: 'F1',
      lien: 'frere_soeur',
      capitauxAvant70: 0,
      capitauxApres70: 100000,
      baseFiscale757B: 100000,
      taxable990I: 0,
      taxable757B: 69500,
      droits990I: 0,
      droits757B: 21663,
      totalDroits: 21663,
    },
    expectedTotalDroits: 21663,
  },

  /**
   * Scenario 4 - AV 100 kEUR conjoint, 100 % de versements apres 70 ans.
   *
   * Detail du calcul :
   * - Tout est ventile sur 757 B.
   * - Beneficiaire conjoint : exoneration totale CGI 796-0 bis (s'applique aux
   *   sommes 757 B selon BOFiP BOI-ENR-DMTG-10-10-20-20 §380).
   * - Droits = 0 EUR.
   *
   * Le contexte civil doit etre marie pour que la clause "conjoint" soit
   * resolue avec exoneration (cf. successionAvFiscal.findMember).
   */
  {
    id: 'av-conjoint-100k-post-70-exonere',
    title: 'AV 100 kEUR conjoint, exoneration CGI 796-0 bis (conjoint marie)',
    sources: [SOURCES.cgi757B, SOURCES.cgi7960Bis],
    entry: {
      id: 'av-conjoint',
      typeContrat: 'personnalisee',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      clauseBeneficiaire: 'CUSTOM:conjoint:100',
      capitauxDeces: 100000,
      versementsApres70: 100000,
      versementsAvant13101998: 0,
    },
    civil: { situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_legale' },
    expectedLine: {
      id: 'conjoint',
      lien: 'conjoint',
      capitauxAvant70: 0,
      capitauxApres70: 100000,
      taxable990I: 0,
      taxable757B: 0,
      droits990I: 0,
      droits757B: 0,
      totalDroits: 0,
    },
    expectedTotalDroits: 0,
  },
];
