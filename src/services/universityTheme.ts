import type { UniversityConfig } from '../config/universities';
import { DEFAULT_UNIVERSITY, UNIVERSITIES } from '../config/universities';
import { setThemeColors } from './theme';

/**
 * Resolve a university by slug using static config.
 */
export function getUniversityBySlug(slug?: string | null): UniversityConfig {
  if (!slug) return DEFAULT_UNIVERSITY;
  const key = String(slug).toLowerCase();
  return UNIVERSITIES[key] ?? DEFAULT_UNIVERSITY;
}

/**
 * Apply the university's base colors to onboarding (CSS variables).
 * Respects optional background overlay.
 */
export function applyUniversityTheme(u: UniversityConfig): void {
  try {
    setThemeColors({
      primary: u.colors.primary,
      secondary: u.colors.secondary
    });
    if (typeof document !== 'undefined' && u.colors.backgroundOverlay) {
      document.documentElement.style.setProperty('--background-overlay', u.colors.backgroundOverlay);
    }
  } catch (e) {
    // Non-fatal: onboarding can still render
    console.warn('[UniversityTheme] Failed to apply theme:', e);
  }
}