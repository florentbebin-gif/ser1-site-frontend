import type { BaseCgRetraiteDocument } from '@/data/base-cg-retraite';
import { SimFieldShell } from '@/components/ui/sim';
import { BaseCgSelectField, BaseCgTextField } from './BaseCgRetraiteModalFields';

function updateText(value: string): string | null {
  return value.trim() ? value : null;
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'conditions_generales', label: 'Conditions Générales' },
  { value: 'notice_information', label: "Notice d'information" },
  { value: 'avenant', label: 'Avenant' },
  { value: 'autre', label: 'Autre' },
];

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
          <BaseCgTextField
            label="Libellé du document"
            value={document.label}
            onChange={(value) => onChange(document.id, 'label', value)}
          />
          <BaseCgSelectField
            label="Nature"
            value={document.type}
            options={DOCUMENT_TYPE_OPTIONS}
            onChange={(value) =>
              onChange(document.id, 'type', value as BaseCgRetraiteDocument['type'])
            }
          />
          <BaseCgTextField
            label="Version CG"
            className="base-cg-modal__wide"
            value={document.versionLabel ?? ''}
            onChange={(value) => onChange(document.id, 'versionLabel', updateText(value))}
          />
          <div className="base-cg-modal__wide base-cg-document-row__upload">
            <SimFieldShell
              label="Upload PDF (PDF uniquement, 50 Mo max)"
              controlId={`base-cg-doc-upload-${document.id}`}
              className="base-cg-modal-field"
            >
              <input
                id={`base-cg-doc-upload-${document.id}`}
                className="sim-field__control sim-field__control--left base-cg-file-input"
                type="file"
                accept="application/pdf"
                disabled={uploadingDocId === document.id}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(document.id, file);
                  event.target.value = '';
                }}
              />
            </SimFieldShell>
            {uploadingDocId === document.id ? (
              <span className="base-cg-document-row__status">Upload en cours...</span>
            ) : document.status === 'uploaded' && document.storagePath ? (
              <span className="base-cg-document-row__status base-cg-document-row__status--ok">
                Stocké : {document.fileName ?? document.storagePath}
              </span>
            ) : null}
          </div>
          <BaseCgTextField
            label="Chemin Supabase Storage"
            className="base-cg-modal__wide"
            value={document.storagePath ?? ''}
            onChange={(value) => onChange(document.id, 'storagePath', updateText(value))}
          />
          <BaseCgTextField
            label="URL externe"
            className="base-cg-modal__wide"
            value={document.sourceUrl ?? ''}
            onChange={(value) => onChange(document.id, 'sourceUrl', updateText(value))}
          />
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
