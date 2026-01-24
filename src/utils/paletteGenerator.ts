/**
 * Palette generator utilities for Settings V3.1
 * - Generates coherent color palettes from a base color (c1)
 * - Maintains visual harmony with SER1 Classic reference palette
 */

// SER1 Classic reference palette (baseline for deltas)
const SER1_CLASSIC = {
  c1: '#2B3E37',
  c2: '#709B8B',
  c3: '#9FBDB2',
  c4: '#CFDED8',
  c5: '#788781',
  c6: '#CEC1B6',
  c7: '#F5F3F0',
  c8: '#D9D9D9',
  c9: '#7F7F7F',
  c10: '#000000',
};

/**
 * Convert hex to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Clamp values to safe ranges
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a complete palette from base color (c1)
 * Uses SER1 Classic deltas as reference, with safety clamps
 * Returns palette in color1..color10 format for Settings.jsx compatibility
 */
export function recalculatePaletteFromC1(baseC1: string): Record<string, string> {
  // Validate and normalize hex input
  const normalizedHex = baseC1.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(normalizedHex)) {
    console.warn('[paletteGenerator] Invalid hex color, using fallback:', baseC1);
    return {
      color1: '#2B3E37',
      color2: '#709B8B',
      color3: '#9FBDB2',
      color4: '#CFDED8',
      color5: '#788781',
      color6: '#CEC1B6',
      color7: '#F5F3F0',
      color8: '#D9D9D9',
      color9: '#7F7F7F',
      color10: '#000000',
    };
  }

  const baseHsl = hexToHsl(normalizedHex);
  const refHsl = hexToHsl(SER1_CLASSIC.c1);

  // Calculate deltas from reference
  const deltaH = baseHsl.h - refHsl.h;
  const deltaS = baseHsl.s - refHsl.s;
  const deltaL = baseHsl.l - refHsl.l;

  // Apply deltas to reference colors with safety clamps
  const applyDelta = (refHex: string, hMod: number = 0, sMod: number = 1, lMod: number = 1) => {
    const ref = hexToHsl(refHex);
    const newH = (ref.h + deltaH + hMod + 360) % 360;
    const newS = clamp(ref.s + deltaS * sMod, 0, 65); // Avoid fluorescent saturation
    const newL = clamp(ref.l + deltaL * lMod, 10, 95); // Avoid pure white/black extremes
    return hslToHex(newH, newS, newL).toUpperCase();
  };

  return {
    color1: normalizedHex,
    color2: applyDelta(SER1_CLASSIC.c2, 0, 0.8, 0.9),
    color3: applyDelta(SER1_CLASSIC.c3, 0, 0.6, 0.8),
    color4: applyDelta(SER1_CLASSIC.c4, 0, 0.4, 0.7),
    color5: applyDelta(SER1_CLASSIC.c5, 0, 0.9, 0.8),
    color6: applyDelta(SER1_CLASSIC.c6, 0, 0.3, 0.6),
    color7: applyDelta(SER1_CLASSIC.c7, 0, 0.2, 0.5),
    color8: applyDelta(SER1_CLASSIC.c8, 0, 0.1, 0.4),
    color9: applyDelta(SER1_CLASSIC.c9, 0, 0, 0.3),
    color10: SER1_CLASSIC.c10, // Keep black stable
  };
}
