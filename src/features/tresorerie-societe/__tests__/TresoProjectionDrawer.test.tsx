// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TresoProjectionDrawer } from '../components/TresoProjectionDrawer';

const ROW = {
  year: 1,
  apportCCA: 0,
  ccaCumule: 100000,
  ccaRestant: 70000,
  retraitsCCA: 30000,
  capitalDistrib: 0,
  revenuDistrib: 4000,
  capitalCapi: 0,
  valeurCapi: 120000,
  gainCapiN: 20000,
  isLatentCapi: 3000,
  montantRachatCapi: 0,
  dividendesFiliales: 50000,
  dividendesFilialesExoneres: 0,
  quotePartTaxable: 0,
  chargesStructure: 12000,
  interetsCCA: 0,
  interetsCCADeductibles: 0,
  interetsCCANonDeductibles: 0,
  interetsCreditIS: 0,
  resultatComptableAvantIS: 62000,
  resultatFiscalAvantIS: 62000,
  baseIS: 62000,
  is: 9000,
  resultatNetComptable: 53000,
  dividendesBrutsCreditIRDemandes: 0,
  dividendesComplementairesBrutsDemandes: 0,
  dividendesDemandesTotaux: 20000,
  dividendesAssociesBruts: 20000,
  pfu: 6000,
  reservesDebut: 10000,
  capaciteDistribuable: 43000,
  miseEnReserve: 33000,
  reservesFin: 43000,
  alerteDividendesSuperieursCapacite: false,
  annuiteCreditIS: 0,
  revenusActifFinance: 0,
  revenusNets: 44000,
  deltaBesoin: -6000,
  revenusParAssocie: [
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: 'remuneration',
      grossDividends: 0,
      dividendTax: 0,
      tnsSocialCharges: 0,
      netRevenue: 30000,
      ccaRepaid: 0,
    },
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: 'charges_sociales_tns',
      grossDividends: 0,
      dividendTax: 0,
      tnsSocialCharges: 3000,
      netRevenue: 0,
      ccaRepaid: 0,
    },
  ],
  tresorerieDebut: 100000,
  tresorerieFin: 82000,
  tresorerieBanqueDebut: 70000,
  tresorerieBanqueFin: 52000,
  tresorerieDisponible: 17000,
  soldeMinimumCompteBancaire: 20000,
  bfr: 15000,
  montantInvestiInitial: 30000,
  montantBalayeAnnuel: 8000,
  montantReinvestiAuTerme: 5000,
  deficitTresorerieBancaire: 12000,
  alerteTresorerieBancaireInsuffisante: true,
};

describe('TresoProjectionDrawer', () => {
  it('structure le détail comptable par groupes et met en avant les lignes fortes', () => {
    render(
      <TresoProjectionDrawer
        rows={[ROW as any]}
        mode="detail"
        onModeChange={vi.fn()}
        ageActuel={50}
        ageRetraite={65}
        anneeCivileDebut={2026}
      />,
    );

    expect(screen.getByText('Résultat')).toBeInTheDocument();
    expect(screen.getByText('CCA')).toBeInTheDocument();
    expect(screen.getByText('Trésorerie')).toBeInTheDocument();
    expect(screen.getByText('Trésorerie bancaire disponible')).toBeInTheDocument();
    expect(screen.getByText('Solde minimum à conserver')).toBeInTheDocument();
    expect(screen.getByText('Besoin en fonds de roulement')).toBeInTheDocument();
    expect(screen.getByText('Trésorerie placée (poches)')).toBeInTheDocument();
    expect(screen.getByText('Trésorerie consolidée')).toBeInTheDocument();
    expect(screen.getByText('Résultat net comptable estimé').closest('tr')).toHaveClass('ts-proj-row--total');
    expect(screen.getByText('Trésorerie consolidée').closest('tr')).toHaveClass('ts-proj-row--total');
    expect(screen.getByText('Montant investi automatiquement vers placements')).toBeInTheDocument();
  });

  it('affiche les charges sociales TNS en négatif dans le détail filtré par associé', () => {
    render(
      <TresoProjectionDrawer
        rows={[ROW as any]}
        mode="detail"
        onModeChange={vi.fn()}
        ageActuel={50}
        ageRetraite={65}
        anneeCivileDebut={2026}
      />,
    );

    fireEvent.click(screen.getByLabelText('Filtrer les revenus par associé'));
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Associé 1' }));

    expect(screen.getByText('Charges sociales TNS — Associé 1')).toBeInTheDocument();
    expect(screen.getByText('-3 000 €')).toBeInTheDocument();
  });
});
