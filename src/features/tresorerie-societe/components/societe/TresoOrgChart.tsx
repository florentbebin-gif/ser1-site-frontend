import type { AssociateInput, CompanyInput, SubsidiaryInput } from '@/engine/tresorerie/types';
import {
  getCapitalPct,
  getCompanyKindCode,
  getCompanyKindLabel,
} from '../../utils/tresorerieSocieteModel';

interface TresoOrgChartProps {
  company: CompanyInput;
  selectedAssociateId: string;
  onCompanyClick: () => void;
  onAssociateClick: (associate: AssociateInput) => void;
  onSubsidiaryClick: (subsidiary: SubsidiaryInput) => void;
}

function fmtPct(value: number | undefined): string {
  const safeValue = Math.round((value ?? 0) * 100) / 100;
  return `${safeValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
}

function sortSubsidiaries(subsidiaries: SubsidiaryInput[]): SubsidiaryInput[] {
  return [...subsidiaries].sort((a, b) => {
    const orderA = a.displayOrder ?? 0;
    const orderB = b.displayOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.label.localeCompare(b.label, 'fr');
  });
}

function SubsidiaryBranch({
  parentId,
  subsidiaries,
  onSubsidiaryClick,
}: {
  parentId: string;
  subsidiaries: SubsidiaryInput[];
  onSubsidiaryClick: (subsidiary: SubsidiaryInput) => void;
}) {
  const children = sortSubsidiaries(
    subsidiaries.filter(subsidiary => (subsidiary.parentEntityId ?? 'societe') === parentId),
  );

  if (children.length === 0) return null;

  return (
    <div className="ts-org-subsidiary-branch">
      {children.map(subsidiary => (
        <div key={subsidiary.id} className="ts-org-subsidiary-wrap">
          <button
            type="button"
            className="ts-org-subsidiary"
            onClick={() => onSubsidiaryClick(subsidiary)}
            aria-label={`Paramétrer ${subsidiary.label}`}
          >
            <span>{subsidiary.label}</span>
            <strong>{fmtPct(subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct)}</strong>
          </button>
          <SubsidiaryBranch
            parentId={subsidiary.id}
            subsidiaries={subsidiaries}
            onSubsidiaryClick={onSubsidiaryClick}
          />
        </div>
      ))}
    </div>
  );
}

export function TresoOrgChart({
  company,
  selectedAssociateId,
  onCompanyClick,
  onAssociateClick,
  onSubsidiaryClick,
}: TresoOrgChartProps) {
  const kindLabel = getCompanyKindLabel(company);
  const kindCode = getCompanyKindCode(company);

  return (
    <div className="ts-org-chart" aria-label="Schéma société">
      <div className="ts-org-associates" aria-label="Associés">
        {company.associates.map(associate => (
          <button
            key={associate.id}
            type="button"
            className={`ts-org-associate${associate.id === selectedAssociateId ? ' is-active' : ''}`}
            onClick={() => onAssociateClick(associate)}
            aria-label={`Paramétrer ${associate.label}`}
          >
            <span>{associate.label}</span>
            <strong>{fmtPct(getCapitalPct(associate))}</strong>
            <em>{associate.kind === 'pm' ? 'PM' : 'PP'}</em>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="ts-org-node"
        onClick={onCompanyClick}
        aria-label="Paramétrer la société"
      >
        <span className="ts-org-node__label">
          {company.creationType === 'newco' ? 'Société à créer' : 'Société existante'}
        </span>
        <strong>{kindLabel}</strong>
        <span className="ts-org-node__meta">
          <b>{kindCode}</b> · {company.legalForm.toUpperCase()}
        </span>
      </button>

      <SubsidiaryBranch
        parentId="societe"
        subsidiaries={company.subsidiaries}
        onSubsidiaryClick={onSubsidiaryClick}
      />
    </div>
  );
}

