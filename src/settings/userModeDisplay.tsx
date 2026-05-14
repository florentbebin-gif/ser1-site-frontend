import type { ReactNode } from 'react';
import type { UserMode } from './userMode';

export type DetailLevelKind = 'simple' | 'expert' | 'always';
export type UserModeOverride = UserMode | null | undefined;

interface ModeGateProps {
  mode: UserMode;
  children: ReactNode;
  fallback?: ReactNode;
}

interface DetailLevelProps extends ModeGateProps {
  level: DetailLevelKind;
}

export function resolveEffectiveUserMode(
  globalMode: UserMode,
  localOverride?: UserModeOverride,
): UserMode {
  return localOverride ?? globalMode;
}

export function shouldDisplayForDetailLevel(level: DetailLevelKind, mode: UserMode): boolean {
  if (level === 'always') return true;
  if (level === 'expert') return mode === 'expert';
  return mode === 'simplifie';
}

export function DetailLevel({
  level,
  mode,
  children,
  fallback = null,
}: DetailLevelProps): ReactNode {
  return shouldDisplayForDetailLevel(level, mode) ? children : fallback;
}

export function ExpertOnly({ mode, children, fallback = null }: ModeGateProps): ReactNode {
  return <DetailLevel level="expert" mode={mode} fallback={fallback}>{children}</DetailLevel>;
}

export function SimpleOnly({ mode, children, fallback = null }: ModeGateProps): ReactNode {
  return <DetailLevel level="simple" mode={mode} fallback={fallback}>{children}</DetailLevel>;
}
