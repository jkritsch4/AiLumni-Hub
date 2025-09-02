import { DEFAULT_UNIVERSITY, UNIVERSITIES, UniversityConfig } from '../config/universities';

export function getUniversityBySlug(slug?: string | null): UniversityConfig {
  if (!slug) return DEFAULT_UNIVERSITY;
  const key = String(slug).toLowerCase();
  return UNIVERSITIES[key] ?? DEFAULT_UNIVERSITY;
}

export function applyUniversityTheme(u: UniversityConfig): void {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', u.colors.primary);
  root.style.setProperty('--secondary-color', u.colors.secondary);

  // Helpful for translucent borders/gradients if your CSS uses these
  const [pr, pg, pb] = hexToRgb(u.colors.primary);
  const [sr, sg, sb] = hexToRgb(u.colors.secondary);
  root.style.setProperty('--primary-color-rgb', `${pr},${pg},${pb}`);
  root.style.setProperty('--secondary-color-rgb', `${sr},${sg},${sb}`);

  if (u.colors.backgroundOverlay) {
    root.style.setProperty('--background-overlay', u.colors.backgroundOverlay);
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  const bigint = parseInt(v.length === 3 ? v.split('').map(c => c + c).join('') : v, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}