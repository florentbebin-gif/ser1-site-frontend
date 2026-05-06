interface SuccessionExportChronologieHypothesesData {
  applicable?: boolean;
  warnings?: readonly string[];
  societeAcquets?: {
    configured?: boolean;
    totalValue?: number;
  } | null;
  participationAcquets?: {
    configured?: boolean;
    active?: boolean;
  } | null;
  interMassClaims?: {
    configured?: boolean;
    totalAppliedAmount?: number;
  } | null;
  affectedLiabilities?: {
    totalAmount?: number;
  } | null;
  preciput?: {
    mode?: string;
    appliedAmount?: number;
    usesGlobalFallback?: boolean;
    selections?: readonly unknown[];
  } | null;
}

export interface SuccessionExportHypothesesGroup {
  title: string;
  items: string[];
}

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function includesAny(value: string, patterns: string[]): boolean {
  const normalized = value.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

function groupTitleForItem(item: string): string {
  if (includesAny(item, [
    'ignoré',
    'manquante',
    'absence',
    'non retenue',
    'avertissement',
    'warning',
    'repli',
  ])) {
    return 'Points d’attention';
  }

  if (includesAny(item, [
    'cgi',
    'ccv',
    'barème',
    'barèmes',
    'dmtg',
    'abattement',
    '990 i',
    '757 b',
    'usufruit',
    'donation',
  ])) {
    return 'Hypothèses fiscales';
  }

  if (includesAny(item, [
    'simplifi',
    'non modélis',
    'non exhaustive',
    'indicatif',
    'confirmer',
    'horizon',
    'dévolution',
    'liquidation notariale',
  ])) {
    return 'Limites de l’étude';
  }

  return 'Cadre de calcul';
}

export function buildSuccessionExportHypothesesGroups(
  items: readonly string[],
): SuccessionExportHypothesesGroup[] {
  const byTitle = new Map<string, string[]>();
  for (const item of uniqueStrings(items)) {
    const title = groupTitleForItem(item);
    byTitle.set(title, [...(byTitle.get(title) ?? []), item]);
  }

  return [
    'Points d’attention',
    'Hypothèses fiscales',
    'Limites de l’étude',
    'Cadre de calcul',
  ]
    .map((title) => ({ title, items: byTitle.get(title) ?? [] }))
    .filter((group) => group.items.length > 0);
}

export function buildSuccessionExportActiveHypotheses(
  assumptions: readonly string[] = [],
  chronologie?: SuccessionExportChronologieHypothesesData | null,
): string[] {
  const activeHypotheses: string[] = [];

  if (chronologie && !chronologie.applicable) {
    activeHypotheses.push(
      'Pour cette situation, la chronologie 2 décès n’est pas retenue comme source principale ; l’export restitue la succession directe affichée.',
    );
  }

  if (chronologie?.societeAcquets?.configured && (chronologie.societeAcquets.totalValue ?? 0) > 0) {
    activeHypotheses.push(
      'Société d’acquêts : liquidation simplifiée de la poche dédiée, sans liquidation notariale exhaustive du contrat matrimonial.',
    );
  }

  if (chronologie?.participationAcquets?.configured && chronologie.participationAcquets.active) {
    activeHypotheses.push(
      'Participation aux acquêts : la créance simplifiée est calculée à partir des patrimoines déclarés, sans liquidation notariale exhaustive.',
    );
  }

  if (chronologie?.interMassClaims?.configured && (chronologie.interMassClaims.totalAppliedAmount ?? 0) > 0) {
    activeHypotheses.push(
      'Les récompenses et créances entre masses sont appliquées comme transferts simplifiés entre poches patrimoniales.',
    );
  }

  if ((chronologie?.affectedLiabilities?.totalAmount ?? 0) > 0) {
    activeHypotheses.push(
      'Les passifs affectés minorent uniquement la masse patrimoniale à laquelle ils sont rattachés dans la saisie détaillée.',
    );
  }

  const preciput = chronologie?.preciput;
  if (preciput && ((preciput.appliedAmount ?? 0) > 0 || (preciput.selections?.length ?? 0) > 0)) {
    activeHypotheses.push(
      preciput.mode === 'cible'
        ? 'Clause de préciput cible : les biens compatibles sélectionnés sont prélevés avant partage, avec repli global si aucune sélection n’est exploitable.'
        : 'Clause de préciput globale : le montant appliqué est prélevé avant partage successoral dans le modèle simplifié.',
    );
  }

  return uniqueStrings([
    ...assumptions,
    ...activeHypotheses,
    ...(chronologie?.warnings ?? []),
  ]);
}
