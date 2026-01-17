import React from 'react';
import { getBusinessIconSvg, type BusinessIconName } from '../../icons/business/businessIconLibrary';

interface BusinessIconProps {
  /** Nom de l'icône business */
  name: BusinessIconName;
  /** Taille de l'icône en pixels */
  size?: number;
  /** Couleur personnalisée (hex, rgb, var(--...)). Si non spécifié, utilise currentColor */
  color?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Style inline additionnel */
  style?: React.CSSProperties;
}

/**
 * Composant pour afficher une icône business
 * 
 * @example
 * <BusinessIcon name="bank" size={18} />
 * <BusinessIcon name="money" size={24} color="#3F6F63" />
 */
export const BusinessIcon: React.FC<BusinessIconProps> = ({
  name,
  size = 18,
  color,
  className = '',
  style = {}
}) => {
  try {
    // Obtenir le SVG avec la couleur personnalisée si spécifiée
    const svgString = getBusinessIconSvg(name, { color });
    
    // Injecter width/height dans la balise SVG
    const svgWithSize = svgString.replace(
      '<svg',
      `<svg width="${size}" height="${size}"`
    );
    
    return (
      <span
        className={`business-icon ${className}`}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: svgWithSize }}
      />
    );
  } catch (error) {
    console.error(`BusinessIcon: Erreur avec l'icône "${name}":`, error);
    
    // Fallback : afficher un placeholder simple
    return (
      <span
        className={`business-icon business-icon--error ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          fontSize: size * 0.6,
          color: 'var(--color-c9)',
          backgroundColor: 'var(--color-c7)',
          border: `1px solid var(--color-c8)`,
          borderRadius: '2px',
          ...style
        }}
        title={`Icône "${name}" indisponible`}
      >
        ?
      </span>
    );
  }
};

export default BusinessIcon;
