import { z } from 'zod';
import { isOfficialUrl } from '@/domain/legal-references';

const amountSchema = z.number().finite().nonnegative();
const percentSchema = z.number().finite().min(0).max(100);
const assietteSchema = z.enum(['TA', 'TA-TB', 'TA-TB-TC']);
const PREVOYANCE_INSTITUTIONAL_DOMAINS = ['carmf.fr', 'cnbf.fr'] as const;
const officialUrlSchema = z
  .string()
  .min(1)
  .refine((url) => isOfficialUrl(url, PREVOYANCE_INSTITUTIONAL_DOMAINS), {
    message: 'URL officielle obligatoire.',
  });

const amountRuleSchema = z
  .object({
    mode: z.enum([
      'fixed_eur_day',
      'fixed_eur_month',
      'fixed_eur_year',
      'percent_income',
      'percent_salary',
      'formula',
    ]),
    value: amountSchema.nullable(),
    label: z.string().optional(),
    unit: z.string().optional(),
    assiette: assietteSchema.optional(),
  })
  .strict();

const arretPalierSchema = z
  .object({
    fromDay: amountSchema,
    toDay: amountSchema.nullable(),
    label: z.string().min(1),
    amount: amountRuleSchema,
  })
  .strict();

const arretSchema = z
  .object({
    carences: z
      .object({
        maladie: amountSchema,
        accident: amountSchema,
        hospitalisation: amountSchema,
      })
      .strict(),
    maxDurationDays: amountSchema,
    paliers: z.array(arretPalierSchema),
    notes: z.array(z.string()).optional(),
  })
  .strict();

const invaliditePalierSchema = z
  .object({
    fromRate: percentSchema,
    toRate: percentSchema.nullable(),
    label: z.string().min(1),
    amount: amountRuleSchema,
    category: z.string().optional(),
  })
  .strict();

const invaliditeSchema = z
  .object({
    paliers: z.array(invaliditePalierSchema),
    notes: z.array(z.string()).optional(),
  })
  .strict();

const decesSchema = z
  .object({
    capital: amountRuleSchema,
    doublementAccident: z.boolean(),
    doubleEffet: z.boolean(),
    renteConjoint: amountRuleSchema.nullable().optional(),
    renteEducation: amountRuleSchema.nullable().optional(),
    notes: z.array(z.string()).optional(),
  })
  .strict();

const cotisationsSchema = z
  .object({
    mode: z.enum(['fixed_eur', 'percent_income', 'percent_salary', 'formula', 'none']),
    value: amountSchema.nullable(),
    assiette: assietteSchema.optional(),
    min: amountSchema.nullable().optional(),
    max: amountSchema.nullable().optional(),
    repartition: z
      .object({
        employeur: percentSchema,
        salarie: percentSchema,
      })
      .strict()
      .nullable()
      .optional(),
    madelinEligible: z.boolean().optional(),
    notes: z.array(z.string()).optional(),
  })
  .strict();

const compositionSchema = z
  .object({
    componentCodes: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const prevoyanceSourcesSchema = z
  .object({
    references: z
      .array(
        z
          .object({
            organisme: z.string().min(1),
            titre: z.string().min(1),
            url: officialUrlSchema,
            datePublication: z.string().min(1).optional(),
            dateConsultation: z.string().min(1),
            rubrique: z.string().min(1).optional(),
            articleCode: z.string().min(1).optional(),
            pagePdf: z.number().int().positive().optional(),
            valeursCouvertes: z.array(z.string().min(1)).min(1),
            confiance: z.enum(['haute', 'moyenne', 'faible']),
            noteAdmin: z.string().min(1).optional(),
          })
          .strict(),
      )
      .min(1),
    noteAdmin: z.string().min(1).optional(),
  })
  .strict();

export const prevoyanceRegimeDataSchema = z
  .object({
    arret: arretSchema,
    invalidite: invaliditeSchema,
    deces: decesSchema,
    cotisations: cotisationsSchema,
    composition: compositionSchema.optional(),
  })
  .strict();

export const prevoyanceRegimeSettingsSchema = z
  .object({
    code: z.string().min(1),
    label: z.string().min(1),
    caisse: z.string().min(1),
    population: z.enum(['salarie', 'tns', 'liberal', 'exploitant_agricole', 'avocat']),
    defaultContractKind: z.enum(['individuel', 'collectif']),
    year: z.number().int().positive(),
    data: prevoyanceRegimeDataSchema,
    sources: prevoyanceSourcesSchema,
    updatedAt: z.string().nullable().optional(),
  })
  .strict();

export const maintienEmployeurDataSchema = z
  .object({
    maintienEmployeur: z
      .object({
        carenceDays: amountSchema,
        minAncienneteYears: amountSchema,
        paliers: z.array(
          z
            .object({
              fromAncienneteYears: amountSchema,
              toAncienneteYears: amountSchema.nullable(),
              firstPeriodDays: amountSchema,
              firstPeriodRate: percentSchema,
              secondPeriodDays: amountSchema,
              secondPeriodRate: percentSchema,
            })
            .strict(),
        ),
        notes: z.array(z.string()).optional(),
      })
      .strict(),
  })
  .strict();

export const prevoyanceMaintienEmployeurSettingsSchema = z
  .object({
    code: z.string().min(1),
    label: z.string().min(1),
    year: z.number().int().positive(),
    data: maintienEmployeurDataSchema,
    sources: prevoyanceSourcesSchema,
    updatedAt: z.string().nullable().optional(),
  })
  .strict();

export type PrevoyanceRegimeSettingsSchema = z.infer<typeof prevoyanceRegimeSettingsSchema>;
export type PrevoyanceMaintienEmployeurSettingsSchema = z.infer<
  typeof prevoyanceMaintienEmployeurSettingsSchema
>;

export function formatPrevoyanceSchemaError(result: { success: false; error: z.ZodError }) {
  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path.join('.') || 'payload';
  return `Erreur de validation Prévoyance (${path}) : valeur absente ou invalide.`;
}
