/**
 * Card - Composant tokenisé avec couleurs sémantiques
 * 
 * Usage des tokens C1-C10 via getSemanticColors()
 * Aucune couleur hardcodée
 */

import React from 'react';
import { useTheme } from '../../settings/ThemeProvider';
import { getSemanticColors } from '../../styles/semanticColors';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  header,
  footer,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
  };

  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default: {
      backgroundColor: semantic['surface-card'],
      border: `1px solid ${semantic['border-default']}`,
      boxShadow: 'var(--shadow-sm)',
    },
    elevated: {
      backgroundColor: semantic['surface-raised'],
      border: `1px solid ${semantic['border-default']}`,
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${semantic['border-strong']}`,
    },
  };

  const headerStyles: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: `1px solid ${semantic['border-default']}`,
    backgroundColor: semantic['surface-card'],
  };

  const bodyStyles: React.CSSProperties = {
    padding: '20px',
    flex: 1,
    backgroundColor: variant === 'outlined' ? 'transparent' : semantic['surface-card'],
  };

  const footerStyles: React.CSSProperties = {
    padding: '12px 20px',
    borderTop: `1px solid ${semantic['border-default']}`,
    backgroundColor: semantic['surface-page'],
    color: semantic['text-secondary'],
    fontSize: '13px',
  };

  return (
    <div
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {header && <div style={headerStyles}>{header}</div>}
      <div style={bodyStyles}>{children}</div>
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
};

export default Card;
