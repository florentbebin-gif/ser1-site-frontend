export interface PublicationTestLike {
  id?: string;
}

export interface PublicationGateInput {
  tests?: PublicationTestLike[] | null;
}

export interface PublicationGateResult {
  blocked: boolean;
  testsCount: number;
  blockMessage: string | null;
  warningMessage: string | null;
}

export const P0_10_BLOCK_MESSAGE =
  '⚠ Publication impossible : aucun test validé. Importez et exécutez au moins un test avec résultat PASS avant de publier.';

export const P0_10_WARNING_MESSAGE =
  '⚠ Vérification recommandée : des tests sont importés mais aucun statut de run homogène n\'est encore disponible (v1 non bloquant).';

export function evaluatePublicationGate(input: PublicationGateInput): PublicationGateResult {
  const testsCount = Array.isArray(input.tests) ? input.tests.length : 0;
  const blocked = testsCount === 0;

  return {
    blocked,
    testsCount,
    blockMessage: blocked ? P0_10_BLOCK_MESSAGE : null,
    warningMessage: blocked ? null : P0_10_WARNING_MESSAGE,
  };
}
