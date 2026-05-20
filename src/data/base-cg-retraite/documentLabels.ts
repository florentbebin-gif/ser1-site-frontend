import type { BaseCgRetraiteDocument } from './types';

const DOCUMENT_TYPE_LABELS: Record<BaseCgRetraiteDocument['type'], string> = {
  conditions_generales: 'Conditions générales',
  notice_information: "Notice d'information",
  avenant: 'Avenant',
  autre: 'Autre document',
};

export function getBaseCgRetraiteDocumentTypeLabel(document: BaseCgRetraiteDocument): string {
  return DOCUMENT_TYPE_LABELS[document.type] ?? DOCUMENT_TYPE_LABELS.autre;
}

export function getBaseCgRetraiteDocumentVersionLabel(document: BaseCgRetraiteDocument): string {
  const versionLabel = document.versionLabel?.trim();
  return versionLabel ? `Version : ${versionLabel}` : 'Version à renseigner';
}

export function getBaseCgRetraiteDocumentAccessLabel(document: BaseCgRetraiteDocument): string {
  if (document.storagePath && (document.status === 'uploaded' || document.status === 'linked')) {
    return 'PDF importé - accès authentifié SER1';
  }
  if (document.sourceUrl) return 'Lien externe';
  return 'Source à compléter';
}

export function formatBaseCgRetraiteDocumentNotice(document: BaseCgRetraiteDocument): string {
  return [
    getBaseCgRetraiteDocumentTypeLabel(document),
    getBaseCgRetraiteDocumentVersionLabel(document),
    getBaseCgRetraiteDocumentAccessLabel(document),
  ].join(' - ');
}

export function formatBaseCgRetraiteDocumentsNotice(
  documents: BaseCgRetraiteDocument[] | undefined,
): string {
  if (!documents || documents.length === 0) {
    return 'Source Base CG : aucun document référencé - vérifier les CG officielles auprès de la compagnie.';
  }

  const firstDocument = documents[0];
  if (!firstDocument) {
    return 'Source Base CG : aucun document référencé - vérifier les CG officielles auprès de la compagnie.';
  }
  const otherDocuments = documents.slice(1);
  const otherDocumentsLabel =
    otherDocuments.length > 0
      ? ` (+ ${otherDocuments.length} autre${otherDocuments.length > 1 ? 's' : ''})`
      : '';

  return `Source Base CG : ${formatBaseCgRetraiteDocumentNotice(firstDocument)}${otherDocumentsLabel}`;
}
