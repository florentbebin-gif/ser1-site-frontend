// @generated - ne pas éditer manuellement. Lancez npm run logos:generate.

export type CompanyLogoBackground = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6';

export interface CompanyLogoAssetConfig {
  file: string;
  displayOverrides?: {
    scale?: number;
    background?: CompanyLogoBackground;
  };
}

export const COMPANY_LOGO_ASSETS = {
  abeille: {
    file: 'abeille.svg',
  },
  afer: {
    file: 'afer.png',
  },
  'ag2r-la-mondiale': {
    file: 'ag2r-la-mondiale.svg',
  },
  ageas: {
    file: 'ageas.svg',
  },
  agipi: {
    file: 'agipi.png',
  },
  allianz: {
    file: 'allianz.svg',
  },
  alptis: {
    file: 'alptis.svg',
  },
  apicil: {
    file: 'apicil.png',
  },
  april: {
    file: 'april.svg',
  },
  areas: {
    file: 'areas.svg',
  },
  axa: {
    file: 'axa.svg',
    displayOverrides: {
      scale: 62,
    },
  },
  'banque-populaire': {
    file: 'banque-populaire.png',
  },
  bnp: {
    file: 'bnp.svg',
  },
  'caisse-d-epargne': {
    file: 'caisse-d-epargne.svg',
  },
  cardif: {
    file: 'cardif.svg',
  },
  'credit-agricole': {
    file: 'credit-agricole.svg',
  },
  'credit-mutuel': {
    file: 'credit-mutuel.svg',
  },
  epartim: {
    file: 'epartim.svg',
  },
  epsor: {
    file: 'epsor.svg',
  },
  eres: {
    file: 'eres.png',
  },
  gan: {
    file: 'gan.png',
  },
  garance: {
    file: 'garance.svg',
    displayOverrides: {
      scale: 72,
      background: 'c1',
    },
  },
  generali: {
    file: 'generali.svg',
  },
  groupama: {
    file: 'groupama.svg',
  },
  'harmonie-mutuelle': {
    file: 'harmonie-mutuelle.svg',
  },
  hsbc: {
    file: 'hsbc.svg',
  },
  'la-banque-postale': {
    file: 'la-banque-postale.svg',
  },
  'la-medicale': {
    file: 'la-medicale.png',
  },
  lcl: {
    file: 'lcl.svg',
  },
  'lpa-prevoyance': {
    file: 'lpa-prevoyance.png',
    displayOverrides: {
      background: 'c1',
    },
  },
  maaf: {
    file: 'maaf.svg',
  },
  macif: {
    file: 'macif.svg',
  },
  macsf: {
    file: 'macsf.svg',
  },
  maif: {
    file: 'maif.svg',
  },
  'malakoff-humanis': {
    file: 'malakoff-humanis.png',
  },
  mapa: {
    file: 'mapa.svg',
  },
  matmut: {
    file: 'matmut.svg',
  },
  medicis: {
    file: 'medicis.webp',
  },
  mma: {
    file: 'mma.svg',
  },
  nortia: {
    file: 'nortia.svg',
  },
  oradea: {
    file: 'oradea.svg',
  },
  prefon: {
    file: 'prefon.png',
  },
  prevoir: {
    file: 'prevoir.svg',
  },
  'pro-btp': {
    file: 'pro-btp.svg',
  },
  'sma-btp': {
    file: 'sma-btp.png',
  },
  'societe-generale': {
    file: 'societe-generale.svg',
  },
  swisslife: {
    file: 'swisslife.svg',
  },
  uff: {
    file: 'uff.svg',
  },
  umr: {
    file: 'umr.png',
  },
} as const satisfies Record<string, CompanyLogoAssetConfig>;
