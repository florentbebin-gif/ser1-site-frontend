/**
 * Button - Composant tokenisé avec couleurs sémantiques
 * 
 * Usage des tokens C1-C10 via getSemanticColors()
 * Aucune couleur hardcodée (sauf WHITE autorisé pour texte sur fond foncé)
 */

import React from 'react';
import { useTheme } from '../../settings/ThemeProvider';
import { getSemanticColors, pickTextColorForBackground } from '../../styles/semanticColors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  disabled,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  // Calculate text color based on background for contrast
  const getTextColor = (bgColor: string) => pickTextColorForBackground(bgColor);

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '13px', height: '32px' },
    md: { padding: '10px 16px', fontSize: '14px', height: '40px' },
    lg: { padding: '14px 24px', fontSize: '16px', height: '48px' },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: semantic['accent-line'],
      color: getTextColor(semantic['accent-line']),
    },
    secondary: {
      backgroundColor: semantic['surface-raised'],
      color: semantic['text-primary'],
    },
    outline: {
      backgroundColor: 'transparent',
      color: semantic['accent-line'],
      border: `1px solid ${semantic['border-strong']}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: semantic['text-primary'],
    },
    danger: {
      backgroundColor: semantic.danger,
      color: getTextColor(semantic.danger),
    },
  };

  const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: { filter: 'brightness(1.1)' },
    secondary: { backgroundColor: semantic['border-default'] },
    outline: { backgroundColor: semantic['surface-raised'] },
    ghost: { backgroundColor: semantic['surface-overlay'] },
    danger: { filter: 'brightness(1.1)' },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isHovered && !disabled ? hoverStyles[variant] : {}),
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
