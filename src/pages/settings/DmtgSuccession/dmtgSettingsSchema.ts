import { z } from 'zod';
import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';

type TaxSettingsData = typeof DEFAULT_TAX_SETTINGS & {
  donation?: typeof DEFAULT_TAX_SETTINGS.donation;
};
type DmtgSettings = typeof DEFAULT_TAX_SETTINGS.dmtg;
type DmtgCategory = DmtgSettings['ligneDirecte'];

type JsonRecord = Record<string, unknown>;

const amountSchema = z.number().finite().nonnegative();
const percentSchema = z.number().finite().min(0).max(100);

const dmtgScaleRowSchema = z.object({
  from: amountSchema,
  to: amountSchema.nullable(),
  rate: percentSchema,
}).strict();

const dmtgCategorySchema = z.object({
  abattement: amountSchema,
  scale: z.array(dmtgScaleRowSchema).min(1),
}).strict();

export const dmtgSettingsSchema = z.object({
  ligneDirecte: dmtgCategorySchema,
  frereSoeur: dmtgCategorySchema,
  neveuNiece: dmtgCategorySchema,
  autre: dmtgCategorySchema,
}).strict();

const donationSettingsSchema = z.object({
  rappelFiscalAnnees: amountSchema,
  donFamilial790G: z.object({
    montant: amountSchema,
    conditions: z.string(),
  }).passthrough(),
}).passthrough();

const avDecesBracketSchema = z.object({
  upTo: amountSchema.nullable(),
  ratePercent: percentSchema,
}).strict();

const assuranceVieDecesSchema = z.object({
  contratAvantDate: z.string(),
  contratApresDate: z.string(),
  agePivotPrimes: z.number().finite().min(0).max(120),
  primesAvant1998: z.object({
    taxRatePercent: percentSchema,
    note: z.string().optional(),
  }).passthrough(),
  primesApres1998: z.object({
    allowancePerBeneficiary: amountSchema,
    brackets: z.array(avDecesBracketSchema).min(1),
    note: z.string().optional(),
  }).passthrough(),
  apres70ans: z.object({
    globalAllowance: amountSchema,
    taxationMode: z.string().optional(),
    note: z.string().optional(),
  }).passthrough(),
}).passthrough();

const dmtgTaxPayloadSchema = z.object({
  dmtg: dmtgSettingsSchema,
  donation: donationSettingsSchema.optional(),
}).passthrough();

const dmtgFiscalityPayloadSchema = z.object({
  assuranceVie: z.object({
    deces: assuranceVieDecesSchema,
  }).passthrough(),
}).passthrough();

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeDonation(rawDonation: unknown): typeof DEFAULT_TAX_SETTINGS.donation {
  if (!isRecord(rawDonation)) return DEFAULT_TAX_SETTINGS.donation;

  const rawDonFamilial = isRecord(rawDonation.donFamilial790G)
    ? rawDonation.donFamilial790G
    : {};
  const candidate = {
    ...DEFAULT_TAX_SETTINGS.donation,
    ...rawDonation,
    donFamilial790G: {
      ...DEFAULT_TAX_SETTINGS.donation.donFamilial790G,
      ...rawDonFamilial,
    },
  };
  const parsed = donationSettingsSchema.safeParse(candidate);

  return parsed.success ? parsed.data as typeof DEFAULT_TAX_SETTINGS.donation : DEFAULT_TAX_SETTINGS.donation;
}

function normalizeCategory(rawCategory: unknown, fallback: DmtgCategory): DmtgCategory {
  if (!isRecord(rawCategory)) return fallback;

  const candidate = {
    abattement: rawCategory.abattement ?? fallback.abattement,
    scale: Array.isArray(rawCategory.scale) ? rawCategory.scale : fallback.scale,
  };
  const parsed = dmtgCategorySchema.safeParse(candidate);

  return parsed.success ? parsed.data as DmtgCategory : fallback;
}

function normalizeDmtgSettings(rawDmtg: unknown): DmtgSettings {
  const source = isRecord(rawDmtg) ? rawDmtg : {};
  const legacyLigneDirecte = {
    abattement: source.abattementLigneDirecte,
    scale: source.scale,
  };
  const ligneDirecteSource = source.ligneDirecte ?? legacyLigneDirecte;
  const candidate = {
    ligneDirecte: normalizeCategory(ligneDirecteSource, DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte),
    frereSoeur: normalizeCategory(source.frereSoeur, DEFAULT_TAX_SETTINGS.dmtg.frereSoeur),
    neveuNiece: normalizeCategory(source.neveuNiece, DEFAULT_TAX_SETTINGS.dmtg.neveuNiece),
    autre: normalizeCategory(source.autre, DEFAULT_TAX_SETTINGS.dmtg.autre),
  };

  return dmtgSettingsSchema.parse(candidate) as DmtgSettings;
}

export function normalizeDmtgTaxSettingsForLoad(data: unknown): Partial<TaxSettingsData> | null {
  if (!isRecord(data)) return null;

  return {
    ...data,
    dmtg: normalizeDmtgSettings(data.dmtg),
    donation: mergeDonation(data.donation),
  } as Partial<TaxSettingsData>;
}

export function validateDmtgTaxPayload(payload: unknown) {
  return dmtgTaxPayloadSchema.safeParse(payload);
}

export function validateDmtgFiscalityPayload(payload: unknown) {
  return dmtgFiscalityPayloadSchema.safeParse(payload);
}

export function formatDmtgSchemaError(...results: Array<ReturnType<typeof validateDmtgTaxPayload> | ReturnType<typeof validateDmtgFiscalityPayload>>): string {
  const failed = results.find((result) => !result.success);
  if (!failed || failed.success) return '';

  const firstIssue = failed.error.issues[0];
  const path = firstIssue?.path.join('.') || 'payload';

  return `Erreur de validation du schéma DMTG (${path}) : valeur absente ou invalide.`;
}
