import { SettingsIcon } from '@/components/settings/SettingsTitleWithIcon';
import type { BaseCgRetraiteContract, BaseCgRetraiteDocument } from '@/data/base-cg-retraite';
import type { ReactElement } from 'react';
import { COMPARTMENT_LABELS, TYPE_LABELS } from '../baseCgRetraiteOptions';
import { isRetraiteContractIncomplete } from '../utils/retirementContractCompleteness';
import CompanyLogo from './CompanyLogo';

interface BaseCgRetraiteContractCardsProps {
  compagnie: string;
  contracts: BaseCgRetraiteContract[];
  isAdmin: boolean;
  onEdit: (contract: BaseCgRetraiteContract) => void;
  onDelete: (contract: BaseCgRetraiteContract) => void;
  onDownload: (document: BaseCgRetraiteDocument) => void | Promise<void>;
}

function isCgDownloadable(document: BaseCgRetraiteDocument): boolean {
  if (!['conditions_generales', 'notice_information'].includes(document.type)) return false;
  if (!['linked', 'uploaded'].includes(document.status)) return false;
  return Boolean(document.sourceUrl || document.storagePath);
}

function firstCgDocument(contract: BaseCgRetraiteContract): BaseCgRetraiteDocument | null {
  return (contract.documents ?? []).find(isCgDownloadable) ?? null;
}

function ContractMeta({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <span className="base-cg-contract-meta">
      <span className="base-cg-contract-meta__label">{label}</span>
      <span className="base-cg-contract-meta__value">{value}</span>
    </span>
  );
}

export default function BaseCgRetraiteContractCards({
  compagnie,
  contracts,
  isAdmin,
  onEdit,
  onDelete,
  onDownload,
}: BaseCgRetraiteContractCardsProps): ReactElement {
  return (
    <div className="base-cg-contract-cards">
      {contracts.map((contract) => {
        const incomplete = isRetraiteContractIncomplete(contract);
        const document = firstCgDocument(contract);
        const tableRente = contract.phaseLiquidation.tableConversionRente ?? 'À compléter';

        return (
          <article
            key={contract.id}
            className={`base-cg-contract-card${incomplete ? ' is-incomplete' : ''}`}
            data-testid={`base-cg-contract-card-${contract.id}`}
          >
            <div className="base-cg-contract-card__main">
              <CompanyLogo company={compagnie} size={32} className="base-cg-contract-card__logo" />
              <div className="base-cg-contract-card__identity">
                <div className="base-cg-contract-card__title-row">
                  <span className="base-cg-contract-name__label">{contract.nomContrat}</span>
                  {incomplete ? (
                    <span className="base-cg-badge base-cg-badge--incomplete">À compléter</span>
                  ) : null}
                </div>
                <div className="base-cg-contract-card__meta">
                  <ContractMeta label="Type" value={TYPE_LABELS[contract.typeContrat]} />
                  <ContractMeta
                    label="Compartiment"
                    value={
                      contract.perCompartment ? COMPARTMENT_LABELS[contract.perCompartment] : '-'
                    }
                  />
                  <ContractMeta label="Table rente" value={tableRente} />
                </div>
              </div>
            </div>

            <div className="base-cg-contract-card__side">
              {document ? (
                <div className="base-cg-document-download">
                  <button
                    type="button"
                    className="base-cg-document-download__button"
                    onClick={() => void onDownload(document)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <SettingsIcon name="download" />
                    </svg>
                    Télécharger CG
                  </button>
                  {document.versionLabel ? (
                    <span className="base-cg-document-download__version">
                      Ref : {document.versionLabel}
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="base-cg-muted">CG non disponible</span>
              )}

              {isAdmin ? (
                <div className="base-cg-row-actions">
                  <button type="button" onClick={() => onEdit(contract)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="base-cg-row-actions__danger"
                    onClick={() => onDelete(contract)}
                  >
                    Supprimer
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
