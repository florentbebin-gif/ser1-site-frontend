import type { CSSProperties } from 'react';
import type { TokenGroupKind } from './designSystemCatalog';

type TokenSampleStyle = CSSProperties & {
  '--settings-token-motion-duration'?: string;
  '--settings-token-motion-easing'?: string;
};

export function SettingsDesignSystemTokenSample({
  kind,
  token,
}: {
  kind: TokenGroupKind;
  token: string;
}) {
  if (kind === 'space') {
    return (
      <span
        aria-hidden="true"
        className="settings-design-system__token-sample settings-design-system__token-sample--space"
        data-token-sample={token}
        style={{ width: `var(${token})`, height: `var(${token})` }}
      />
    );
  }

  if (kind === 'radius') {
    return (
      <span
        aria-hidden="true"
        className="settings-design-system__token-sample settings-design-system__token-sample--radius"
        data-token-sample={token}
        style={{ borderRadius: `var(${token})` }}
      />
    );
  }

  if (kind === 'typo') {
    return (
      <span
        aria-hidden="true"
        className="settings-design-system__token-sample settings-design-system__token-sample--typo"
        data-token-sample={token}
        style={{ fontSize: `var(${token})` }}
      >
        Ag
      </span>
    );
  }

  const motionStyle: TokenSampleStyle = {
    '--settings-token-motion-duration':
      token === '--easing-standard' ? 'var(--transition-base)' : `var(${token})`,
    '--settings-token-motion-easing':
      token === '--easing-standard' ? `var(${token})` : 'var(--easing-standard)',
  };

  if (token === '--easing-standard') {
    return (
      <span
        aria-hidden="true"
        className="settings-design-system__token-sample settings-design-system__token-sample--motion settings-design-system__token-sample--motion-easing"
        data-token-sample={token}
        style={motionStyle}
      >
        <span className="settings-design-system__token-motion-dot settings-design-system__token-motion-dot--linear" />
        <span className="settings-design-system__token-motion-dot settings-design-system__token-motion-dot--standard" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="settings-design-system__token-sample settings-design-system__token-sample--motion"
      data-token-sample={token}
      style={motionStyle}
    />
  );
}
