// Theme service for dynamic color implementation with feed-first logic
import { reactive } from 'vue';
import type { UniversityConfig } from '../config/universities';
import { DEFAULT_UNIVERSITY, UNIVERSITIES } from '../config/universities';

// Reactive colors so computed(() => themeColors.primary) updates across the app
export const themeColors = reactive({
  primary: '#182B49',    // Default UCSD Blue
  secondary: '#FFCD00',  // Default UCSD Gold
  background: '#182B49',
  text: '#ffffff',
  accent: '#FFB300',
  // Optional overlay; when set, applyCssVars will use this exact value
  backgroundOverlay: '' as string | undefined
});

/** Global switch to suppress team theme while in onboarding routes */
function isTeamThemeSuppressed(): boolean {
  try {
    return typeof window !== 'undefined' && (window as any).__suppressTeamTheme === true;
  } catch {
    return false;
  }
}

/** Resolve a university by slug using static config. */
export function getUniversityBySlug(slug?: string | null): UniversityConfig {
  if (!slug) return DEFAULT_UNIVERSITY;
  const key = String(slug).toLowerCase();
  return UNIVERSITIES[key] ?? DEFAULT_UNIVERSITY;
}

/** Apply a base university theme (safe defaults) */
export function applyUniversityTheme(u: UniversityConfig): void {
  setThemeVars({
    primary: u.colors.primary,
    secondary: u.colors.secondary,
    backgroundOverlay: u.colors.backgroundOverlay,
  });
}

/**
 * Convert a hex color to an "r, g, b" string for rgba() usage.
 */
function hexToRgbString(hex?: string | null): string {
  const value = String(hex ?? '').trim();
  if (!value || !value.startsWith('#')) {
    // default for #182B49
    return '24, 43, 73';
  }
  let m = value.slice(1);
  if (m.length === 3) m = m.split('').map((ch) => ch + ch).join('');
  const int = parseInt(m, 16);
  if (!Number.isFinite(int)) return '24, 43, 73';
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r}, ${g}, ${b}`;
}

/** Low-level: set CSS variables for the current theme. */
export function setThemeVars(opts: {
  primary: string;
  secondary: string;
  backgroundOverlay?: string;
}) {
  // Delegate to setThemeColors so all CSS tokens remain consistent
  setThemeColors({
    primary: opts.primary,
    secondary: opts.secondary,
    // carry through an explicit overlay if provided
    ...(opts.backgroundOverlay ? { backgroundOverlay: opts.backgroundOverlay } : {})
  });
}

/**
 * Helper function to adjust color brightness
 */
function adjustColorBrightness(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, Math.max(0, r + (r * percent / 100)));
  const newG = Math.min(255, Math.max(0, g + (g * percent / 100)));
  const newB = Math.min(255, Math.max(0, b + (b * percent / 100)));

  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

/**
 * WCAG relative luminance for hex colors; higher = lighter
 */
function getLuminance(hex?: string | null): number {
  try {
    const value = String(hex ?? '').trim();
    if (!value || !value.startsWith('#')) return 1; // treat invalid as light
    let m = value.slice(1);
    if (m.length === 3) m = m.split('').map((ch) => ch + ch).join('');
    const r = parseInt(m.substring(0, 2), 16) / 255;
    const g = parseInt(m.substring(2, 4), 16) / 255;
    const b = parseInt(m.substring(4, 6), 16) / 255;
    const fn = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const R = fn(r), G = fn(g), B = fn(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  } catch {
    return 1;
  }
}

/** Normalize hex to #RRGGBB; return null if invalid */
function normalizeHex(hex: string): string | null {
  if (!hex) return null;
  let v = hex.trim();
  if (!v.startsWith('#')) v = `#${v}`;
  const ok = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
  if (!ok) return null;
  if (v.length === 4) {
    // #abc -> #aabbcc
    v = '#' + v.slice(1).split('').map((c) => c + c).join('');
  }
  return v.toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const v = normalizeHex(hex);
  if (!v) return [0, 0, 0];
  const bigint = parseInt(v.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1: string, hex2: string): number {
  const L1 = luminance(hexToRgb(hex1));
  const L2 = luminance(hexToRgb(hex2));
  const bright = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (bright + 0.05) / (dark + 0.05);
}

/**
 * Apply CSS custom properties for dynamic theming
 */
function applyCssVars() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Core theme colors
  root.style.setProperty('--primary-color', themeColors.primary);
  root.style.setProperty('--secondary-color', themeColors.secondary);

  // Main background token used by app shell and onboarding
  root.style.setProperty('--background-color', themeColors.primary);

  // RGB variants for effects
  const primaryRgb = hexToRgbString(themeColors.primary);
  const secondaryRgb = hexToRgbString(themeColors.secondary);
  root.style.setProperty('--primary-color-rgb', primaryRgb);
  root.style.setProperty('--secondary-color-rgb', secondaryRgb);

  // Alpha tokens for layered UI (surfaces, borders, shadows)
  root.style.setProperty('--primary-95a', `rgba(${primaryRgb}, 0.95)`);
  root.style.setProperty('--primary-90a', `rgba(${primaryRgb}, 0.90)`);
  root.style.setProperty('--primary-85a', `rgba(${primaryRgb}, 0.85)`);
  root.style.setProperty('--primary-70a', `rgba(${primaryRgb}, 0.70)`);
  root.style.setProperty('--primary-50a', `rgba(${primaryRgb}, 0.50)`);
  root.style.setProperty('--primary-40a', `rgba(${primaryRgb}, 0.40)`);
  root.style.setProperty('--primary-25a', `rgba(${primaryRgb}, 0.25)`);
  root.style.setProperty('--primary-12a', `rgba(${primaryRgb}, 0.12)`);

  root.style.setProperty('--secondary-60a', `rgba(${secondaryRgb}, 0.60)`);
  root.style.setProperty('--secondary-35a', `rgba(${secondaryRgb}, 0.35)`);
  root.style.setProperty('--secondary-25a', `rgba(${secondaryRgb}, 0.25)`);
  root.style.setProperty('--secondary-15a', `rgba(${secondaryRgb}, 0.15)`);
  root.style.setProperty('--secondary-10a', `rgba(${secondaryRgb}, 0.10)`);

  // Background overlay: prefer explicit overlay, else tint of primary
  const overlay =
    themeColors.backgroundOverlay && String(themeColors.backgroundOverlay).trim()
      ? String(themeColors.backgroundOverlay)
      : `${themeColors.primary}dd`;
  root.style.setProperty('--background-overlay', overlay);

  // FAB / accents (secondary color)
  root.style.setProperty('--fab-color', themeColors.secondary);
  root.style.setProperty('--fab-hover-color', adjustColorBrightness(themeColors.secondary, 20));

  // Accent usage (secondary)
  root.style.setProperty('--accent-color', themeColors.secondary);
  root.style.setProperty('--accent-hover-color', adjustColorBrightness(themeColors.secondary, -20));
  root.style.setProperty('--border-accent-color', themeColors.secondary);

  // Progress bars and highlights
  root.style.setProperty('--progress-color', themeColors.secondary);
  root.style.setProperty('--highlight-color', themeColors.secondary);

  // Shadows tinted with secondary
  root.style.setProperty('--shadow-secondary', `rgba(${secondaryRgb}, 0.28)`);
  root.style.setProperty('--ring-secondary', `rgba(${secondaryRgb}, 0.45)`);
  root.style.setProperty('--divider-color', `rgba(${secondaryRgb}, 0.22)`);
}

/** Mark that an explicit theme (university/team) has been applied */
function markExplicitThemeApplied() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  try {
    root.dataset.themeExplicit = 'true';
    root.style.setProperty('--theme-explicit', '1');
  } catch {}
}

/**
 * Public setter used by the app to update theme colors and CSS variables
 */
export function setThemeColors(colors: Partial<typeof themeColors>) {
  Object.assign(themeColors, colors);
  applyCssVars();
  // Flag so later default initialization cannot override explicit theme
  markExplicitThemeApplied();

  console.log('[Theme] Applied dynamic colors:', {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
  });
}

/** Extract primary/secondary colors from a team info-like object */
export function extractColorsFromInfo(info: any): { primary?: string; secondary?: string } {
  const p = info?.primaryThemeColor ?? info?.primaryColor ?? info?.primary ?? info?.primary_color ?? '';
  const s = info?.secondaryThemeColor ?? info?.secondaryColor ?? info?.secondary ?? info?.secondary_color ?? '';
  return { primary: String(p || ''), secondary: String(s || '') };
}

/**
 * Normalize a pair of colors such that the darker color becomes primary,
 * ensuring the app background remains dark. If contrast is very poor, fall back.
 */
export function normalizeBrandPair(
  teamName: string | undefined,
  primaryIn: string,
  secondaryIn: string
): { primary: string; secondary: string; reason: string } {
  const defaults = { primary: '#182B49', secondary: '#FFCD00' };

  const p = normalizeHex(primaryIn);
  const s = normalizeHex(secondaryIn);

  if (!p && !s) return { ...defaults, reason: 'both-missing' };
  if (!p) return { primary: defaults.primary, secondary: s || defaults.secondary, reason: 'primary-missing' };
  if (!s) return { primary: p, secondary: defaults.secondary, reason: 'secondary-missing' };
  if (p.toLowerCase() === s.toLowerCase()) return { ...defaults, reason: 'identical' };

  // Choose the darker color as primary so main background is dark
  const lumP = getLuminance(p);
  const lumS = getLuminance(s);
  const darkerIsPrimary = lumP <= lumS;

  let candidate = {
    primary: darkerIsPrimary ? p : s,
    secondary: darkerIsPrimary ? s : p,
    reason: darkerIsPrimary ? 'darker-as-primary' : 'swapped-darker-as-primary'
  };

  // If contrast is extremely poor, fall back to defaults
  const cr = contrastRatio(candidate.primary, candidate.secondary);
  if (cr < 1.6) {
    return { ...defaults, reason: 'poor-contrast-fallback' };
  }

  return candidate;
}

/**
 * Load and apply team theme.
 * IMPORTANT: We now normalize to keep the darker color as primary.
 */
export async function loadTeamTheme(teamData: any): Promise<void> {
  console.log('[Theme] Loading team theme:', teamData);

  // Do not allow team theme to override onboarding university branding
  if (isTeamThemeSuppressed()) {
    console.log('[Theme] loadTeamTheme suppressed (onboarding route)');
    return;
  }

  try {
    let info: any = null;
    let teamName: string | undefined;

    if (typeof teamData === 'string') {
      teamName = teamData;
      try {
        const api = await import('./api');
        if (typeof (api as any).getTeamInfo === 'function') {
          info = await (api as any).getTeamInfo(teamData);
        } else if (typeof (api as any).getTeamData === 'function') {
          info = await (api as any).getTeamData(teamData);
        }
      } catch (e) {
        console.warn('[Theme] Could not import getTeamInfo/getTeamData; using defaults', e);
      }
    } else if (teamData && typeof teamData === 'object') {
      info = teamData;
      teamName = teamData.team_name;
    }

    const { primary, secondary } = extractColorsFromInfo(info ?? {});
    const inPrimary = (primary && String(primary).trim()) || '#182B49';
    const inSecondary = (secondary && String(secondary).trim()) || '#FFCD00';

    const normalized = normalizeBrandPair(teamName, inPrimary, inSecondary);

    // Clear explicit overlay to derive from the current primary unless a later call sets one
    setThemeColors({
      primary: normalized.primary,
      secondary: normalized.secondary,
      background: normalized.primary,
      text: '#ffffff',
      accent: normalized.secondary,
      backgroundOverlay: undefined
    });

    console.log('[Theme] Applied team theme colors', {
      team: teamName,
      primary_in: inPrimary,
      secondary_in: inSecondary,
      primary_applied: normalized.primary,
      secondary_applied: normalized.secondary,
      normalization: normalized.reason
    });
  } catch (err) {
    console.warn('[Theme] loadTeamTheme error; reverting to defaults', err);
    initializeTheme();
  }
}

/** Dynamic theme loader (kept for compatibility) */
export async function loadDynamicTeamTheme(teamName: string) {
  try {
    console.log('[Theme] Loading dynamic theme for team:', teamName);

    const api = await import('./api');
    let teamData: any = null;
    if (typeof (api as any).getTeamInfo === 'function') {
      teamData = await (api as any).getTeamInfo(teamName);
    } else if (typeof (api as any).getTeamData === 'function') {
      teamData = await (api as any).getTeamData(teamName);
    }

    const { primary, secondary } = extractColorsFromInfo(teamData ?? {});
    const inPrimary = (primary && String(primary).trim()) || '#182B49';
    const inSecondary = (secondary && String(secondary).trim()) || '#FFCD00';
    const normalized = normalizeBrandPair(teamName, inPrimary, inSecondary);

    await loadTeamTheme({ ...teamData, primaryThemeColor: normalized.primary, secondaryThemeColor: normalized.secondary });

    return { primary: normalized.primary, secondary: normalized.secondary };
  } catch (error) {
    console.error('[Theme] Error loading dynamic theme:', error);
    initializeTheme();
    return null;
  }
}

/** Example helper to switch team */
export async function switchTeamTheme(teamName: string) {
  console.log('[Theme] Switching to team theme:', teamName);
  try {
    const api = await import('./api');
    let teamData: any = null;
    if (typeof (api as any).getTeamInfo === 'function') {
      teamData = await (api as any).getTeamInfo(teamName);
    } else if (typeof (api as any).getTeamData === 'function') {
      teamData = await (api as any).getTeamData(teamName);
    }

    if (teamData) {
      const { primary, secondary } = extractColorsFromInfo(teamData ?? {});
      const inPrimary = (primary && String(primary).trim()) || '#182B49';
      const inSecondary = (secondary && String(secondary).trim()) || '#FFCD00';
      const normalized = normalizeBrandPair(teamName, inPrimary, inSecondary);

      await loadTeamTheme({ ...teamData, primaryThemeColor: normalized.primary, secondaryThemeColor: normalized.secondary });
      return teamData;
    }
  } catch (error) {
    console.error('[Theme] Error switching team theme:', error);
  }
  return null;
}

/** Initialize defaults (kept neutral; will be overridden after feed resolves) */
export function initializeTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  // If an explicit theme has already been applied, never override it with defaults
  if (root?.dataset?.themeExplicit === 'true') {
    console.log('[Theme] initializeTheme skipped (explicit theme already applied)');
    return;
  }

  console.log('[Theme] Initializing theme with default UCSD colors');
  setThemeColors({
    primary: '#182B49',
    secondary: '#FFCD00',
    background: '#182B49',
    text: '#ffffff',
    accent: '#FFCD00',
    backgroundOverlay: undefined
  });
}

// Initialize theme on load (idempotent: will skip if explicit theme already applied)
if (typeof document !== 'undefined') {
  initializeTheme();

  // Dev helpers
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    (window as any).switchTeamTheme = switchTeamTheme;
  }
}