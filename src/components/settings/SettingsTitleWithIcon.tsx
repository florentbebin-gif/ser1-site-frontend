import type { ReactElement, ReactNode } from 'react';

export type SettingsTitleIconName =
  | 'balance'
  | 'book'
  | 'briefcase'
  | 'building'
  | 'calendar-clock'
  | 'download'
  | 'file-signature'
  | 'file-text'
  | 'filter'
  | 'gift'
  | 'hand-heart'
  | 'home'
  | 'layers'
  | 'map-pin'
  | 'percent'
  | 'rings'
  | 'shield'
  | 'sparkles'
  | 'trending-up'
  | 'umbrella'
  | 'wallet';

interface SettingsIconProps {
  name: SettingsTitleIconName;
}

interface SettingsTitleWithIconProps {
  icon: SettingsTitleIconName;
  children: ReactNode;
  className?: string;
}

export function SettingsIcon({ name }: SettingsIconProps): ReactElement {
  switch (name) {
    case 'balance':
      return (
        <>
          <path d="M12 3v18" />
          <path d="M6 7h12" />
          <path d="M7 7 4 13h6L7 7Z" />
          <path d="m17 7-3 6h6l-3-6Z" />
          <path d="M8 21h8" />
        </>
      );
    case 'book':
      return (
        <>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" />
          <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
        </>
      );
    case 'briefcase':
      return (
        <>
          <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 12h18" />
        </>
      );
    case 'building':
      return (
        <>
          <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" />
          <path d="M9 21v-4h3v4" />
          <path d="M8 7h1M12 7h1M8 11h1M12 11h1" />
          <path d="M17 9h2a1 1 0 0 1 1 1v11" />
        </>
      );
    case 'calendar-clock':
      return (
        <>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18" />
          <circle cx="14" cy="15" r="3" />
          <path d="M14 13.5V15l1 1" />
        </>
      );
    case 'download':
      return (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </>
      );
    case 'file-signature':
      return (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 17c1.5-2 2.5-2 4 0 1.2 1.5 2.3 1.5 4 0" />
        </>
      );
    case 'file-text':
      return (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6M8 13h8M8 17h6" />
        </>
      );
    case 'filter':
      return (
        <>
          <path d="M4 5h16" />
          <path d="M7 12h10" />
          <path d="M10 19h4" />
        </>
      );
    case 'gift':
      return (
        <>
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13M3 12h18" />
          <path d="M7.5 8a2.5 2.5 0 1 1 4.5-1.5V8" />
          <path d="M16.5 8A2.5 2.5 0 1 0 12 6.5V8" />
        </>
      );
    case 'hand-heart':
      return (
        <>
          <path d="M3 17h4l4 3 5-3h5" />
          <path d="M7 17v-5a2 2 0 0 1 2-2h2" />
          <path d="M16.5 4.5a2.4 2.4 0 0 0-3.4 0L12 5.6l-1.1-1.1a2.4 2.4 0 0 0-3.4 3.4L12 12.4l4.5-4.5a2.4 2.4 0 0 0 0-3.4Z" />
        </>
      );
    case 'home':
      return (
        <>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v11h14V10" />
          <path d="M10 21v-6h4v6" />
        </>
      );
    case 'layers':
      return (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        </>
      );
    case 'map-pin':
      return (
        <>
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      );
    case 'percent':
      return (
        <>
          <path d="M19 5 5 19" />
          <circle cx="7" cy="7" r="2" />
          <circle cx="17" cy="17" r="2" />
        </>
      );
    case 'rings':
      return (
        <>
          <circle cx="9" cy="13" r="5" />
          <circle cx="15" cy="13" r="5" />
          <path d="M10 5h4l-2-3-2 3Z" />
        </>
      );
    case 'shield':
      return (
        <>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="M9 12l2 2 4-4" />
        </>
      );
    case 'sparkles':
      return (
        <>
          <path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
          <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
        </>
      );
    case 'trending-up':
      return (
        <>
          <path d="M3 17 9 11l4 4 7-7" />
          <path d="M14 8h6v6" />
        </>
      );
    case 'umbrella':
      return (
        <>
          <path d="M3 12a9 9 0 0 1 18 0Z" />
          <path d="M12 12v6a3 3 0 0 0 6 0" />
        </>
      );
    case 'wallet':
      return (
        <>
          <path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" />
          <path d="M16 13h5" />
          <circle cx="17.5" cy="13" r="1" />
        </>
      );
  }
}

export default function SettingsTitleWithIcon({
  icon,
  children,
  className,
}: SettingsTitleWithIconProps): ReactElement {
  return (
    <span className={`settings-title-with-icon${className ? ` ${className}` : ''}`}>
      <span className="settings-action-icon settings-action-icon--compact" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <SettingsIcon name={icon} />
        </svg>
      </span>
      <span className="settings-title-with-icon__text">{children}</span>
    </span>
  );
}
