import type { BaseCgRetraiteContract } from '@/data/basecg';

interface ContractAuditCardsProps {
  contract: BaseCgRetraiteContract | null;
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Non renseigné';
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
  }
  return String(value);
}

function AuditRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="per-transfert-audit-row">
      <dt>{label}</dt>
      <dd>{display(value)}</dd>
    </div>
  );
}

export function ContractAuditCards({ contract }: ContractAuditCardsProps) {
  if (!contract) {
    return (
      <div className="per-transfert-empty-analysis">
        Aucun contrat Base CG sélectionné : la grille de devoir de conseil reste à compléter avec les hypothèses du relevé et des conditions générales.
      </div>
    );
  }

  const documents = contract.documents ?? [];

  return (
    <div className="per-transfert-contract-audit">
      <section className="per-transfert-contract-audit__phase">
        <h4>Phase épargne</h4>
        <dl>
          <AuditRow label="Date de commercialisation" value={contract.phaseEpargne.dateCommercialisation} />
          <AuditRow label="Nombre de supports" value={contract.phaseEpargne.nombreFonds} />
          <AuditRow label="Répartition UC / Fonds €" value={contract.phaseEpargne.repartitionUcEuro} />
          <AuditRow label="Rendement fonds € garanti / constaté" value={contract.phaseEpargne.rendementFondsEuro} />
          <AuditRow label="Frais sur versements" value={contract.phaseEpargne.fraisVersements} />
          <AuditRow label="Frais de gestion" value={contract.phaseEpargne.fraisGestion} />
          <AuditRow label="Frais d'arbitrage" value={contract.phaseEpargne.fraisArbitrage} />
          <AuditRow label="Frais de transfert sortant" value={contract.phaseEpargne.fraisTransfertSortant} />
          <AuditRow label="Clause bénéficiaire" value={contract.phaseEpargne.clauseBeneficiaire} />
          <AuditRow label="Garanties complémentaires" value={contract.phaseEpargne.garantiesComplementaires} />
        </dl>
      </section>

      <section className="per-transfert-contract-audit__phase">
        <h4>Phase liquidation</h4>
        <dl>
          <AuditRow label="Âge limite de liquidation" value={contract.phaseLiquidation.ageLimiteLiquidation} />
          <AuditRow label="Sortie capital à la retraite" value={contract.phaseLiquidation.sortieCapitalRetraite} />
          <AuditRow label="Fractionnement du capital" value={contract.phaseLiquidation.fractionnementCapital} />
          <AuditRow label="Rachat libre" value={contract.phaseLiquidation.rachatLibre} />
          <AuditRow label="Table de mortalité utilisée" value={contract.phaseLiquidation.tableConversionRente} />
          <AuditRow label="Table garantie à l'adhésion" value={contract.phaseLiquidation.tableGarantieAdhesion} />
          <AuditRow label="Taux technique" value={contract.phaseLiquidation.tauxTechnique} />
          <AuditRow label="Frais sur arrérages" value={contract.phaseLiquidation.fraisArrerages} />
          <AuditRow label="Annuités garanties" value={contract.phaseLiquidation.annuitesGaranties} />
          <AuditRow label="Réversion possible" value={contract.phaseLiquidation.reversionPossible} />
          <AuditRow label="Réversion incluse" value={contract.phaseLiquidation.reversionIncluse} />
        </dl>
      </section>

      {documents.length > 0 ? (
        <section className="per-transfert-contract-audit__documents">
          <h4>Conditions Générales</h4>
          <ul>
            {documents.map((document) => (
              <li key={document.id}>
                {document.sourceUrl ? (
                  <a href={document.sourceUrl} target="_blank" rel="noreferrer">{document.label}</a>
                ) : document.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
