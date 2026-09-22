/**
 * DeepFocus OS - Theme & Accent Color Utilities
 */

export const SIGNATURE_ACCENT_COLOR = '#1591DC'; // Signature DeepFocus Blue

export interface AccentColorPreset {
  id: string;
  name: string;
  hex: string;
  isSignature?: boolean;
}

export const PRESET_ACCENT_COLORS: AccentColorPreset[] = [
  { id: 'deepfocus-blue', name: 'DeepFocus Blue', hex: '#1591DC', isSignature: true },
  { id: 'sky-cyan', name: 'Electric Sky', hex: '#0ea5e9' },
  { id: 'monochrome-white', name: 'Pure Monochrome', hex: '#ffffff' },
  { id: 'emerald-growth', name: 'Emerald Growth', hex: '#10b981' },
  { id: 'cyber-violet', name: 'Cyber Violet', hex: '#8b5cf6' },
  { id: 'nordic-amber', name: 'Nordic Amber', hex: '#f59e0b' },
  { id: 'crimson-rose', name: 'Crimson Rose', hex: '#f43f5e' }
];

export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return `rgba(21, 145, 220, ${alpha})`;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 21;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 145;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 220;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyThemeAccent(hex: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const targetHex = hex || SIGNATURE_ACCENT_COLOR;
  
  root.style.setProperty('--theme-accent', targetHex);
  root.style.setProperty('--color-accent', targetHex);
  root.style.setProperty('--theme-color-primary', targetHex);

  let cleanHex = targetHex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 21;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 145;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 220;
  root.style.setProperty('--theme-accent-rgb', `${r}, ${g}, ${b}`);
}
