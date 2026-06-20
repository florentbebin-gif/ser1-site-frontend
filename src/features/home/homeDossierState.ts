import type { AuditLandingViewModel } from '@/features/audit';

export type HomePrimaryActionState =
  | 'new-analysis'
  | 'continue-dossier'
  | 'resume-strategy'
  | 'continue-scenario';

export interface HomeDossierProgress {
  /** Avancement 0..1. */
  ratio: number;
  /** Avancement arrondi 0..100. */
  percent: number;
  /** Libellé visible de la jauge. */
  label: string;
  /** Libellé accessible complet. */
  ariaLabel: string;
}

export interface HomeActionCopy {
  title: string;
  cta: string;
}

export interface HomeScanCopy extends HomeActionCopy {
  subtitle: string;
}

export interface HomeDossierState {
  hasDossier: boolean;
  hasObjectifs: boolean;
  hasScenarioInProgress: boolean;
  progress: HomeDossierProgress | null;
  primaryAction: HomeActionCopy & { state: HomePrimaryActionState };
  scanAction: HomeScanCopy;
}

interface HomeDossierStateInput {
  hasDossier: boolean;
  hasObjectifs: boolean;
  progress: HomeDossierProgress | null;
  hasScenarioInProgress?: boolean;
}

interface BuildHomeDossierStateOptions {
  hasScenarioInProgress?: boolean;
}

const STRUCTURATION_LABEL = 'Structuration du dossier';

const PRIMARY_ACTION_COPY: Record<HomePrimaryActionState, HomeActionCopy> = {
  'new-analysis': {
    title: 'Nouvelle analyse patrimoniale',
    cta: 'Démarrer',
  },
  'continue-dossier': {
    title: 'Continuer le dossier',
    cta: 'Continuer',
  },
  'resume-strategy': {
    title: 'Reprendre la stratégie',
    cta: 'Reprendre',
  },
  'continue-scenario': {
    title: 'Continuer le scénario',
    cta: 'Continuer',
  },
};

const SCAN_WITHOUT_DOSSIER: HomeScanCopy = {
  title: 'Scan documentaire',
  subtitle: 'Importez les documents du client pour pré-remplir le dossier.',
  cta: 'Importer',
};

const SCAN_WITH_DOSSIER: HomeScanCopy = {
  title: 'Ajouter des documents au dossier',
  subtitle:
    'Complétez ou vérifiez les données déjà structurées à partir de nouvelles pièces client.',
  cta: 'Ajouter des pièces',
};

export function buildHomeDossierState(
  vm: AuditLandingViewModel,
  options: BuildHomeDossierStateOptions = {},
): HomeDossierState {
  return deriveHomeDossierState({
    hasDossier: vm.hasDossier,
    hasObjectifs: vm.objectifs.objectifs.length > 0,
    hasScenarioInProgress: options.hasScenarioInProgress,
    progress: computeHomeDossierProgress(vm),
  });
}

export function deriveHomeDossierState(input: HomeDossierStateInput): HomeDossierState {
  const hasScenarioInProgress = input.hasScenarioInProgress ?? false;
  const primaryState = resolvePrimaryActionState({
    hasDossier: input.hasDossier,
    hasObjectifs: input.hasObjectifs,
    hasScenarioInProgress,
  });

  return {
    hasDossier: input.hasDossier,
    hasObjectifs: input.hasObjectifs,
    hasScenarioInProgress,
    progress: input.hasDossier ? input.progress : null,
    primaryAction: {
      state: primaryState,
      ...PRIMARY_ACTION_COPY[primaryState],
    },
    scanAction: input.hasDossier ? SCAN_WITH_DOSSIER : SCAN_WITHOUT_DOSSIER,
  };
}

function resolvePrimaryActionState({
  hasDossier,
  hasObjectifs,
  hasScenarioInProgress,
}: {
  hasDossier: boolean;
  hasObjectifs: boolean;
  hasScenarioInProgress: boolean;
}): HomePrimaryActionState {
  if (!hasDossier) return 'new-analysis';
  if (hasScenarioInProgress) return 'continue-scenario';
  if (hasObjectifs) return 'resume-strategy';
  return 'continue-dossier';
}

function computeHomeDossierProgress(vm: AuditLandingViewModel): HomeDossierProgress | null {
  if (!vm.hasDossier) {
    return null;
  }

  const etatCivil = vm.synthese.etatCivilCompletion;
  const objectifsRenseignes = vm.objectifs.objectifs.length > 0 ? 1 : 0;

  const completed = etatCivil.completed + objectifsRenseignes;
  const total = etatCivil.total + 1;

  return buildProgress(completed, total);
}

function buildProgress(completed: number, total: number): HomeDossierProgress {
  const ratio = total === 0 ? 0 : completed / total;
  const percent = Math.round(ratio * 100);
  return {
    ratio,
    percent,
    label: STRUCTURATION_LABEL,
    ariaLabel: `${STRUCTURATION_LABEL} : ${percent} %`,
  };
}
