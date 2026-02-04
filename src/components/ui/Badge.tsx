/**
 * Badge - Composant tokenisé avec couleurs sémantiques
 * 
 * Usage des tokens C1-C10 via getSemanticColors()
 * Aucune couleur hardcodée (sauf WHITE autorisé pour texte sur fond foncé)
 */

import React from 'react';
import { useTheme } from '../../settings/ThemeProvider';
import { getSemanticColors, pickTextColorForBackground } from '../../styles/semanticColors';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  };

  const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: {
      padding: '2px 8px',
      fontSize: '11px',
      height: '20px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '12px',
      height: '24px',
    },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: semantic['surface-raised'],
          color: semantic['text-secondary'],
          border: `1px solid ${semantic['border-default']}`,
        };
      case 'primary':
        return {
          backgroundColor: semantic['accent-line'],
          color: pickTextColorForBackground(semantic['accent-line']),
        };
      case 'success':
        return {
          backgroundColor: semantic.success,
          color: pickTextColorForBackground(semantic.success),
        };
      case 'warning':
        return {
          backgroundColor: semantic.warning,
          color: pickTextColorForBackground(semantic.warning),
        };
      case 'danger':
        return {
          backgroundColor: semantic.danger,
          color: pickTextColorForBackground(semantic.danger),
        };
      case 'info':
        return {
          backgroundColor: semantic.info,
          color: pickTextColorForBackground(semantic.info),
        };
      default:
        return {};
    }
  };

  return (
    <span
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
