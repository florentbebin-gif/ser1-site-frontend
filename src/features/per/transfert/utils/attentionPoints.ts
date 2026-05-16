import type { BaseCgRetraiteContract } from '@/data/basecg';
import {
  formatBaseCgRetraiteRateField,
  hasBaseCgRetraiteValue,
} from '@/data/basecg';

export type PerTransfertAttentionLevel = 'high' | 'medium' | 'neutral';

export interface PerTransfertAttentionPoint {
  level: PerTransfertAttentionLevel;
  label: string;
  detail: string;
}

export interface PerTransfertAttentionContext {
  subscriptionDate?: string | null;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function hasGuaranteedWording(value: unknown): boolean {
  return /\b(garanti|garantie|tmg|adhésion|adhesion|tprv|tpg)\b/i.test(asText(value));
}

export function extractPercentValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = asText(value).replace(',', '.');
  const match = text.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed / 100 : null;
}

function subscriptionYear(subscriptionDate?: string | null): number | null {
  if (!subscriptionDate) return null;
  const match = subscriptionDate.match(/^(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isInteger(year) ? year : null;
}

function commercializationRange(value: unknown): { start: number | null; end: number | null; parseable: boolean } {
  const years = Array.from(asText(value).matchAll(/\b(19\d{2}|20\d{2})\b/g))
    .map((match) => Number(match[1]))
    .filter((year) => Number.isInteger(year));
  if (years.length === 0) return { start: null, end: null, parseable: false };
  return {
    start: Math.min(...years),
    end: years.length >= 2 ? Math.max(...years) : null,
    parseable: true,
  };
}

function datePoint(contract: BaseCgRetraiteContract, context: PerTransfertAttentionContext): PerTransfertAttentionPoint | null {
  const year = subscriptionYear(context.subscriptionDate);
  if (!year) return null;
  const label = contract.phaseEpargne.dateCommercialisation;
  if (!hasBaseCgRetraiteValue(label)) {
    return {
      level: 'medium',
      label: 'Date de souscription à vérifier',
      detail: 'Plage de commercialisation absente de la fiche Base CG.',
    };
  }
  const range = commercializationRange(label);
  if (!range.parseable) {
    return {
      level: 'medium',
      label: 'Date de souscription à vérifier',
      detail: `Plage Base CG non structurée : ${asText(label)}.`,
    };
  }
  if ((range.start !== null && year < range.start) || (range.end !== null && year > range.end)) {
    return {
      level: 'medium',
      label: 'Date de souscription à vérifier',
      detail: `Souscription ${year}, fiche Base CG : ${asText(label)}.`,
    };
  }
  return null;
}

export function buildPerTransfertAttentionPoints(
  contract: BaseCgRetraiteContract | null,
  context: PerTransfertAttentionContext,
): PerTransfertAttentionPoint[] {
  if (!contract) {
    return [{
      level: 'neutral',
      label: 'Base CG non sélectionnée',
      detail: 'Sélectionner un contrat pour afficher les points de vigilance.',
    }];
  }

  const points: PerTransfertAttentionPoint[] = [];
  const tableGarantie = contract.phaseLiquidation.tableGarantieAdhesion;
  if (hasBaseCgRetraiteValue(tableGarantie) && (/oui/i.test(asText(tableGarantie)) || hasGuaranteedWording(tableGarantie))) {
    points.push({
      level: 'high',
      label: 'Table de mortalité garantie',
      detail: asText(tableGarantie),
    });
  }

  const dateAttention = datePoint(contract, context);
  if (dateAttention) points.push(dateAttention);

  const tauxTechnique = contract.phaseLiquidation.tauxTechnique;
  const tauxTechniqueValue = extractPercentValue(tauxTechnique);
  if ((tauxTechniqueValue !== null && tauxTechniqueValue > 0) || hasGuaranteedWording(tauxTechnique)) {
    points.push({
      level: 'high',
      label: 'Taux technique garanti',
      detail: hasBaseCgRetraiteValue(tauxTechnique)
        ? asText(tauxTechnique)
        : formatBaseCgRetraiteRateField(tauxTechniqueValue),
    });
  }

  const fondsGarantis = contract.phaseEpargne.fondsEuroGarantis;
  const rendement = contract.phaseEpargne.rendementFondsEuro;
  const rendementValue = extractPercentValue(rendement);
  if (
    hasBaseCgRetraiteValue(fondsGarantis)
    || hasGuaranteedWording(rendement)
    || (rendementValue !== null && rendementValue > 0.02)
  ) {
    points.push({
      level: 'medium',
      label: 'Taux garantis fonds €',
      detail: hasBaseCgRetraiteValue(fondsGarantis) ? asText(fondsGarantis) : asText(rendement),
    });
  }

  const garanties = contract.phaseEpargne.garantiesComplementaires;
  if (hasBaseCgRetraiteValue(garanties)) {
    points.push({
      level: 'medium',
      label: 'Garanties prévoyance',
      detail: asText(garanties),
    });
  }

  if (points.length === 0) {
    points.push({
      level: 'neutral',
      label: 'Aucun point majeur',
      detail: 'Aucun avantage contractuel sensible détecté dans la fiche Base CG.',
    });
  }

  return points;
}
