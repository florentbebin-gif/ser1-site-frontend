export const LEGAL_TEXT = `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.`;

export const LIEN_LABELS: Record<string, string> = {
  conjoint: 'Conjoint',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  frere_soeur: 'Frère / Sœur',
  neveu_niece: 'Neveu / Nièce',
  autre: 'Autre',
};

export const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v);

export const fmtPct = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) +
  ' %';

export const compactCount = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);

export function orderLabel(order: 'epoux1' | 'epoux2'): string {
  return order === 'epoux1' ? 'Époux 1 puis Époux 2' : 'Époux 2 puis Époux 1';
}
