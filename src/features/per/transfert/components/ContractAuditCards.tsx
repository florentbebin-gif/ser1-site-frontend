import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import {
  formatBaseCgRetraiteDocumentNotice,
  formatBaseCgRetraiteRateField,
  formatBaseCgRetraiteValue,
  hasBaseCgRetraiteValue,
  normalizeBaseCgRetraiteGestionFees,
} from '@/data/base-cg-retraite';

interface ContractAuditCardsProps {
  contract: BaseCgRetraiteContract | null;
}

function display(value: unknown, format?: 'rate'): string {
  if (value === null || value === undefined || value === '') return 'Non renseigné';
  if (format === 'rate') return formatBaseCgRetraiteRateField(value as string | number | null);
  if (typeof value === 'number') return formatBaseCgRetraiteValue(value);
  return String(value);
}

function AuditRow({ label, value, format }: { label: string; value: unknown; format?: 'rate' }) {
  if (!hasBaseCgRetraiteValue(value)) return null;
  return (
    <div className="per-transfert-audit-row">
      <dt>{label}</dt>
      <dd>{display(value, format)}</dd>
    </div>
  );
}

export function ContractAuditCards({ contract }: ContractAuditCardsProps) {
  if (!contract) {
    return (
      <div className="per-transfert-empty-analysis">
        Aucun contrat Base CG sélectionné : la grille de devoir de conseil reste à compléter avec
        les hypothèses du relevé et des conditions générales.
      </div>
    );
  }

  const documents = contract.documents ?? [];
  const gestionFees = normalizeBaseCgRetraiteGestionFees(contract.phaseEpargne);
  const epargneRows = [
    contract.phaseEpargne.dateCommercialisation,
    contract.phaseEpargne.nombreFonds,
    contract.phaseEpargne.nombreSupportsUc,
    contract.phaseEpargne.repartitionUcEuro,
    contract.phaseEpargne.rendementFondsEuro,
    contract.phaseEpargne.fondsEuroGarantis,
    contract.phaseEpargne.fraisVersements,
    gestionFees.fraisGestionFondsEuro,
    gestionFees.fraisGestionUc,
    contract.phaseEpargne.fraisArbitrage,
    contract.phaseEpargne.fraisTransfertSortant,
    contract.phaseEpargne.clauseBeneficiaire,
    contract.phaseEpargne.garantiesComplementaires,
  ];
  const liquidationRows = [
    contract.phaseLiquidation.ageLimiteLiquidation,
    contract.phaseLiquidation.sortieCapitalRetraite,
    contract.phaseLiquidation.fractionnementCapital,
    contract.phaseLiquidation.rachatLibre,
    contract.phaseLiquidation.tableConversionRente,
    contract.phaseLiquidation.tableGarantieAdhesion,
    contract.phaseLiquidation.tauxTechnique,
    contract.phaseLiquidation.fraisArrerages,
    contract.phaseLiquidation.annuitesGaranties,
    contract.phaseLiquidation.reversionPossible,
    contract.phaseLiquidation.reversionIncluse,
    contract.phaseLiquidation.renteEstimee,
  ];
  const hasEpargne = epargneRows.some(hasBaseCgRetraiteValue);
  const hasLiquidation = liquidationRows.some(hasBaseCgRetraiteValue);
  const hasDocuments = documents.length > 0;

  if (!hasEpargne && !hasLiquidation && !hasDocuments) {
    return (
      <div className="per-transfert-empty-analysis">
        La grille de devoir de conseil reste à compléter avec les hypothèses du relevé et des
        conditions générales.
      </div>
    );
  }

  return (
    <div className="per-transfert-contract-audit">
      {hasEpargne ? (
        <section className="per-transfert-contract-audit__phase">
          <h4>Phase épargne</h4>
          <dl>
            <AuditRow
              label="Date de commercialisation"
              value={contract.phaseEpargne.dateCommercialisation}
            />
            <AuditRow label="Nombre de supports" value={contract.phaseEpargne.nombreFonds} />
            <AuditRow label="Nombre d’UC" value={contract.phaseEpargne.nombreSupportsUc} />
            <AuditRow
              label="Répartition UC / Fonds €"
              value={contract.phaseEpargne.repartitionUcEuro}
            />
            <AuditRow
              label="TMG du contrat (fonds €)"
              value={contract.phaseEpargne.rendementFondsEuro}
              format="rate"
            />
            <AuditRow
              label="Fonds € garantis"
              value={contract.phaseEpargne.fondsEuroGarantis}
              format="rate"
            />
            <AuditRow
              label="Frais sur versements"
              value={contract.phaseEpargne.fraisVersements}
              format="rate"
            />
            <AuditRow
              label="Frais gestion fonds €"
              value={gestionFees.fraisGestionFondsEuro}
              format="rate"
            />
            <AuditRow label="Frais gestion UC" value={gestionFees.fraisGestionUc} format="rate" />
            <AuditRow
              label="Frais d'arbitrage"
              value={contract.phaseEpargne.fraisArbitrage}
              format="rate"
            />
            <AuditRow
              label="Frais de transfert sortant"
              value={contract.phaseEpargne.fraisTransfertSortant}
              format="rate"
            />
            <AuditRow
              label="Modalités en cas de décès"
              value={contract.phaseEpargne.clauseBeneficiaire}
            />
            <AuditRow
              label="Garanties complémentaires"
              value={contract.phaseEpargne.garantiesComplementaires}
            />
          </dl>
        </section>
      ) : null}

      {hasLiquidation ? (
        <section className="per-transfert-contract-audit__phase">
          <h4>Phase liquidation</h4>
          <dl>
            <AuditRow
              label="Âge limite de liquidation"
              value={contract.phaseLiquidation.ageLimiteLiquidation}
            />
            <AuditRow
              label="Sortie capital à la retraite"
              value={contract.phaseLiquidation.sortieCapitalRetraite}
            />
            <AuditRow
              label="Fractionnement du capital"
              value={contract.phaseLiquidation.fractionnementCapital}
            />
            <AuditRow label="Rachat libre" value={contract.phaseLiquidation.rachatLibre} />
            <AuditRow
              label="Table de mortalité utilisée"
              value={contract.phaseLiquidation.tableConversionRente}
            />
            <AuditRow
              label="Table garantie à l'adhésion"
              value={contract.phaseLiquidation.tableGarantieAdhesion}
            />
            <AuditRow
              label="Taux technique"
              value={contract.phaseLiquidation.tauxTechnique}
              format="rate"
            />
            <AuditRow
              label="Frais sur arrérages"
              value={contract.phaseLiquidation.fraisArrerages}
              format="rate"
            />
            <AuditRow
              label="Annuités garanties"
              value={contract.phaseLiquidation.annuitesGaranties}
            />
            <AuditRow
              label="Réversion possible"
              value={contract.phaseLiquidation.reversionPossible}
            />
            <AuditRow
              label="Réversion incluse"
              value={contract.phaseLiquidation.reversionIncluse}
            />
            <AuditRow label="Rente estimée" value={contract.phaseLiquidation.renteEstimee} />
          </dl>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section className="per-transfert-contract-audit__documents">
          <h4>Conditions Générales</h4>
          <ul>
            {documents.map((document) => (
              <li key={document.id}>
                {document.sourceUrl ? (
                  <a href={document.sourceUrl} target="_blank" rel="noreferrer">
                    {formatBaseCgRetraiteDocumentNotice(document)}
                  </a>
                ) : (
                  formatBaseCgRetraiteDocumentNotice(document)
                )}
              </li>
            ))}
          </ul>
          <p className="per-transfert-contract-audit__documents-note">
            Il faut vérifier auprès de la compagnie la version officielle applicable avant
            recommandation.
          </p>
        </section>
      ) : null}
    </div>
  );
}
