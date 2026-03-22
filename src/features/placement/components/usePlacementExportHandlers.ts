import { useCallback, useState } from 'react';
import type { ThemeColors } from '@/settings/theme';
import type { LogoPlacement } from '@/pptx/theme/types';
import type { CompareResult } from '@/engine/placement/types';
import { buildPlacementStateForMode } from '../utils/normalizers';
import type { PlacementSimulatorState } from '../utils/normalizers';
import { exportPlacementExcel } from '../export/placementExcelExport';

interface UsePlacementExportHandlersParams {
  state: PlacementSimulatorState;
  isExpert: boolean;
  results: CompareResult | null;
  pptxColors: ThemeColors;
  cabinetLogo: string | undefined;
  logoPlacement: LogoPlacement | undefined;
}

export function usePlacementExportHandlers({
  state,
  isExpert,
  results,
  pptxColors,
  cabinetLogo,
  logoPlacement,
}: UsePlacementExportHandlersParams) {
  const [exportLoading, setExportLoading] = useState(false);

  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportPlacementExcel(buildPlacementStateForMode(state, isExpert), results, pptxColors.c1, pptxColors.c7);
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[ExcelExport] Export failed', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, isExpert, results, pptxColors]);

  const exportPptx = useCallback(async () => {
    if (!results) return;
    setExportLoading(true);
    try {
      const [{ buildPlacementStudyDeck }, { exportAndDownloadStudyDeck }] = await Promise.all([
        import('@/pptx/presets/placementDeckBuilder'),
        import('@/pptx/export/exportStudyDeck'),
      ]);
      const stateForCalc = buildPlacementStateForMode(state, isExpert);

      const buildProductConfig = (productIndex: number) => {
        const p = stateForCalc.products[productIndex];
        const vc = p.versementConfig;
        return {
          tmi: state.client.tmiEpargne,
          tmiRetraite: state.client.tmiRetraite,
          rendementCapi: vc.capitalisation.rendementAnnuel,
          rendementDistrib: vc.distribution.tauxDistribution ?? 0,
          tauxRevalorisation: vc.distribution.rendementAnnuel,
          repartitionCapi: vc.initial.pctCapitalisation ?? 100,
          strategieDistribution: vc.distribution.strategie ?? 'stocker',
          versementInitial: vc.initial.montant,
          versementAnnuel: vc.annuel.montant,
          ponctuels: (vc.ponctuels || []).map((pt: { annee: number; montant: number }) => ({ annee: pt.annee, montant: pt.montant })),
          fraisEntree: vc.initial.fraisEntree,
          optionBaremeIR: p.liquidation?.optionBaremeIR ?? false,
        };
      };

      const mapEpargneRows = (rows: typeof results.produit1.epargne.rows) =>
        rows.map(r => ({
          annee: r.annee,
          versementNet: r.versementNet,
          capitalDebut: r.capitalDebut,
          gainsAnnee: r.gainsAnnee,
          capitalFin: r.capitalFin,
          effortReel: r.effortReel,
          economieIR: r.economieIR,
        }));

      const mapLiquidationRows = (rows: typeof results.produit1.liquidation.rows) =>
        rows.map(r => ({
          annee: r.annee,
          capitalDebut: r.capitalDebut,
          gainsAnnee: r.gainsAnnee,
          retraitBrut: r.retraitBrut,
          fiscaliteTotal: r.fiscaliteTotal,
          retraitNet: r.retraitNet,
          capitalFin: r.capitalFin,
        }));

      const buildProductData = (productKey: 'produit1' | 'produit2', productIndex: number) => {
        const p = results[productKey];
        return {
          envelopeLabel: p.envelopeLabel,
          epargne: {
            capitalAcquis: p.epargne.capitalAcquis,
            cumulVersements: p.epargne.cumulVersements,
            cumulEffort: p.epargne.cumulEffort,
            cumulEconomieIR: p.epargne.cumulEconomieIR,
          },
          liquidation: {
            cumulRetraitsNets: p.liquidation.cumulRetraitsNets,
            revenuAnnuelMoyenNet: p.liquidation.revenuAnnuelMoyenNet,
            cumulFiscalite: p.liquidation.cumulFiscalite,
          },
          transmission: {
            capitalTransmisNet: p.transmission.capitalTransmisNet,
            taxe: p.transmission.taxe,
            regime: p.transmission.regime,
          },
          totaux: {
            effortReel: p.totaux.effortReel,
            revenusNetsEpargne: p.totaux.revenusNetsEpargne,
            revenusNetsLiquidation: p.totaux.revenusNetsLiquidation,
            fiscaliteTotale: p.totaux.fiscaliteTotale,
            capitalTransmisNet: p.totaux.capitalTransmisNet,
            revenusNetsTotal: p.totaux.revenusNetsTotal,
          },
          config: buildProductConfig(productIndex),
          epargneRows: mapEpargneRows(p.epargne.rows),
          liquidationRows: mapLiquidationRows(p.liquidation.rows),
        };
      };

      const data = {
        clientName: undefined as string | undefined,
        ageActuel: state.client.ageActuel ?? 0,
        dureeEpargne: state.products[0].dureeEpargne,
        ageAuDeces: state.transmission.ageAuDeces,
        liquidationMode: state.liquidation.mode,
        liquidationDuree: state.liquidation.duree,
        liquidationMensualiteCible: state.liquidation.mensualiteCible,
        liquidationMontantUnique: state.liquidation.montantUnique,
        beneficiaryType: state.transmission.beneficiaryType,
        nbBeneficiaires: state.transmission.nbBeneficiaires,
        dmtgTaux: state.transmission.dmtgTaux,
        produit1: buildProductData('produit1', 0),
        produit2: buildProductData('produit2', 1),
      };
      const deck = buildPlacementStudyDeck(data, pptxColors, cabinetLogo, logoPlacement);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      await exportAndDownloadStudyDeck(deck, pptxColors, `simulation-placement-${dateStr}.pptx`, {
        locale: 'fr-FR',
        showSlideNumbers: true,
      });
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[PlacementPPTX] Export failed', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier PowerPoint.');
    } finally {
      setExportLoading(false);
    }
  }, [results, state, isExpert, pptxColors, cabinetLogo, logoPlacement]);

  return { exportExcel, exportPptx, exportLoading };
}
