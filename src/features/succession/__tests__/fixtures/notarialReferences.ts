import type { HeritiersInput, LienParente } from '../../../../engine/succession';
import type {
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
    taxable757B: 69500,
    droits757B: 40744,
    droits990I: 0,
    totalDroits: 40744,
  },
  expectedTotalDroits: 40744,
};
