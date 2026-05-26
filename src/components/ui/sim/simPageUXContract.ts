import type { ReactNode } from 'react';
import type { SimEmptyStateIllustration } from './SimEmptyState';

export type SimPageReadinessStatus = 'waiting' | 'ready';
export type SimPageStepStatus = 'todo' | 'current' | 'done';

export interface SimPageReadiness {
  status: SimPageReadinessStatus;
  reasons?: string[];
}

export interface SimPageEmptyStateConfig {
  illustration: SimEmptyStateIllustration;
  title: ReactNode;
  description?: ReactNode;
  cta?: ReactNode;
}

export interface SimPageStep {
  id: string;
  label: string;
  targetId?: string;
  status?: SimPageStepStatus;
  disabled?: boolean;
}

export interface SimPageSectionContract {
  id: string;
  label: string;
  targetId: string;
  optional?: boolean;
}

export interface SimPageUXContract {
  readiness: SimPageReadiness;
  emptyState?: SimPageEmptyStateConfig;
  stepperSteps?: SimPageStep[];
  synthesisReady: boolean;
  synthesisTargetId?: string;
  sections?: SimPageSectionContract[];
}

export function isSimPageReady(readiness: SimPageReadiness): boolean {
  return readiness.status === 'ready';
}
