import type { BaseCgRetraiteDocument } from '@/data/base-cg-retraite';

function updateText(value: string): string | null {
  return value.trim() ? value : null;
}

interface Props {
  documents: BaseCgRetraiteDocument[];
  uploadError: string | null;
  uploadingDocId: string | null;
  onAdd: () => void;
  onRemove: (_id: string) => void;
  onChange: <K extends keyof BaseCgRetraiteDocument>(
    _id: string,
    _key: K,
    _value: BaseCgRetraiteDocument[K],
  ) => void;
  onUpload: (_id: string, _file: File) => void;
}

export function BaseCgRetraiteDocumentsTab({
  documents,
  uploadError,
  uploadingDocId,
  onAdd,
  onRemove,
  onChange,
  onUpload,
}: Props) {
  return (
    <div className="base-cg-documents">
      <div className="base-cg-documents__header">
        <div>
          <h4>Documents contractuels</h4>
          <p>
            Les PDF sont uploadés dans le bucket privé Supabase Storage. Le chemin proposé suit le
            pattern <code>compagnie/contrat/version.pdf</code>.
          </p>
        </div>
        <button type="button" className="base-cg-button" onClick={onAdd}>
          Ajouter un document
        </button>
      </div>

      {uploadError ? (
        <p className="base-cg-documents__error" role="alert">
          {uploadError}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <p className="base-cg-documents__empty">Aucun document référencé.</p>
      ) : null}

      {documents.map((document) => (
        <div className="base-cg-document-row" key={document.id}>
          <label>
            Libellé du document
            <input
              value={document.label}
              onChange={(event) => onChange(document.id, 'label', event.target.value)}
            />
          </label>
          <label>
            Nature
            <select
              value={document.type}
              onChange={(event) =>
                onChange(document.id, 'type', event.target.value as BaseCgRetraiteDocument['type'])
              }
            >
              <option value="conditions_generales">Conditions Générales</option>
              <option value="notice_information">Notice d'information</option>
              <option value="avenant">Avenant</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label className="base-cg-modal__wide">
            Version CG
            <input
              value={document.versionLabel ?? ''}
              onChange={(event) =>
                onChange(document.id, 'versionLabel', updateText(event.target.value))
              }
            />
          </label>
          <div className="base-cg-modal__wide base-cg-document-row__upload">
            <label>
              Upload PDF (PDF uniquement, 50 Mo max)
              <input
                type="file"
                accept="application/pdf"
                disabled={uploadingDocId === document.id}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(document.id, file);
                  event.target.value = '';
                }}
              />
            </label>
            {uploadingDocId === document.id ? (
              <span className="base-cg-document-row__status">Upload en cours...</span>
            ) : document.status === 'uploaded' && document.storagePath ? (
              <span className="base-cg-document-row__status base-cg-document-row__status--ok">
                Stocké : {document.fileName ?? document.storagePath}
              </span>
            ) : null}
          </div>
          <label className="base-cg-modal__wide">
            Chemin Supabase Storage
            <input
              value={document.storagePath ?? ''}
              onChange={(event) =>
                onChange(document.id, 'storagePath', updateText(event.target.value))
              }
            />
          </label>
          <label className="base-cg-modal__wide">
            URL externe
            <input
              value={document.sourceUrl ?? ''}
              onChange={(event) =>
                onChange(document.id, 'sourceUrl', updateText(event.target.value))
              }
            />
          </label>
          <div className="base-cg-document-row__actions">
            <button type="button" onClick={() => onRemove(document.id)}>
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
