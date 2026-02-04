/**
 * Alert - Composant tokenisé avec couleurs sémantiques
 * 
 * Usage des tokens C1-C10 via getSemanticColors()
 * Aucune couleur hardcodée (sauf WHITE autorisé pour texte sur fond foncé)
 */

import React from 'react';
import { useTheme } from '../../settings/ThemeProvider';
import { getSemanticColors, pickTextColorForBackground } from '../../styles/semanticColors';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid',
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'info':
        return {
          backgroundColor: semantic.info + '20', // 20 = ~12% opacity
          borderColor: semantic.info,
          color: semantic['text-primary'],
        };
      case 'success':
        return {
          backgroundColor: semantic.success + '20',
          borderColor: semantic.success,
          color: semantic['text-primary'],
        };
      case 'warning':
        return {
          backgroundColor: semantic.warning + '20',
          borderColor: semantic.warning,
          color: pickTextColorForBackground(semantic.warning),
        };
      case 'error':
        return {
          backgroundColor: semantic.danger + '20',
          borderColor: semantic.danger,
          color: semantic['text-primary'],
        };
      default:
        return {};
    }
  };

  const iconStyles: React.CSSProperties = {
    width: '20px',
    height: '20px',
    flexShrink: 0,
    marginTop: '2px',
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
  };

  const titleStyles: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '4px',
  };

  const messageStyles: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.5',
  };

  const closeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  };

  const icons: Record<AlertVariant, string> = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  };

  return (
    <div
      style={{
        ...baseStyles,
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      <span style={iconStyles}>{icons[variant]}</span>
      <div style={contentStyles}>
        {title && <div style={titleStyles}>{title}</div>}
        <div style={messageStyles}>{children}</div>
      </div>
      {onClose && (
        <button
          style={closeButtonStyles}
          onClick={onClose}
          aria-label="Fermer"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
