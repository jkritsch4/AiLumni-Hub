// Theme service for dynamic color implementation
import { reactive } from 'vue';

// Reactive colors so computed(() => themeColors.primary) updates across the app
export const themeColors = reactive({
  primary: '#182B49',    // Default UCSD Blue
  secondary: '#FFCD00',  // Default UCSD Gold
  background: '#182B49',
  text: '#ffffff',
  accent: '#FFB300'
});

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

/**
 * Optional brand overrides for known schools whose feeds invert colors.
 * Key is a substring match on team name (case-insensitive), e.g., 'ucsd'.
 */
const BRAND_PRIMARY_OVERRIDES: Array<{ match: RegExp; primary: string; secondary: string }> = [
  { match: /ucsd|uc san diego/i, primary: '#182B49', secondary: '#FFCD00' },
  // Add more if needed:
  // { match: /san francisco|usf/i, primary: '#006341', secondary: '#f4af27' },
];

/**
 * Normalize a color pair so that the darker color is used as primary (dominant background).
 * 1) If a brand override matches the team name, use it.
 * 2) Else, if primary is much lighter than secondary, swap them.
 */
function normalizeBrandPair(teamName: string | undefined, inPrimary: string, inSecondary: string) {
  // Team-specific override
  const override = BRAND_PRIMARY_OVERRIDES.find(o => teamName && o.match.test(teamName));
  if (override) {
    return { primary: override.primary, secondary: override.secondary, reason: 'brand_override' };
  }

  // Luminance-based swap (threshold tuned to avoid jitter)
  const lumP = getLuminance(inPrimary);
  const lumS = getLuminance(inSecondary);
  if (lumP > lumS + 0.10) {
    return { primary: inSecondary, secondary: inPrimary, reason: 'luminance_swap' };
  }
  return { primary: inPrimary, secondary: inSecondary, reason: 'as_is' };
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

  // Background overlay with primary color and transparency (used by page backdrop)
  root.style.setProperty('--background-overlay', `${themeColors.primary}dd`);

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

/**
 * Public setter used by the app to update theme colors and CSS variables
 */
export function setThemeColors(colors: Partial<typeof themeColors>) {
  Object.assign(themeColors, colors);
  applyCssVars();

  console.log('[Theme] Applied dynamic colors:', {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
  });
}

/**
 * Initialize theme with default UCSD colors
 */
export function initializeTheme() {
  console.log('[Theme] Initializing theme with default UCSD colors');
  setThemeColors({
    primary: '#182B49',    // UCSD Blue
    secondary: '#FFCD00',  // UCSD Gold
    background: '#182B49',
    text: '#ffffff',
    accent: '#FFCD00'
  });
}

/**
 * Extract primary/secondary colors from a TeamInfo-like object, supporting multiple field names.
 */
function extractColorsFromInfo(info: any): { primary?: string; secondary?: string } {
  const primary =
    info?.primaryThemeColor ??
    info?.primary_color ??
    info?.primaryColor ??
    info?.brandPrimary ??
    info?.PrimaryThemeColor;

  const secondary =
    info?.secondaryThemeColor ??
    info?.secondary_color ??
    info?.secondaryColor ??
    info?.brandSecondary ??
    info?.SecondaryThemeColor;

  return { primary, secondary };
}

/**
 * Load team-specific theme colors.
 * - If a string team name is provided, fetch TeamInfo and apply its colors.
 * - If an object with color fields is provided, apply directly.
 * - Fallback to defaults if no colors found.
 */
export async function loadTeamTheme(
  teamData?: { primaryThemeColor?: string; secondaryThemeColor?: string; team_name?: string; [k: string]: any } | string
): Promise<void> {
  console.log('[Theme] Loading team theme:', teamData);

  try {
    let info: any = null;
    let teamName: string | undefined;

    if (typeof teamData === 'string') {
      // Try to fetch TeamInfo for the given name
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

    setThemeColors({
      primary: normalized.primary,
      secondary: normalized.secondary,
      background: normalized.primary,
      text: '#ffffff',
      accent: normalized.secondary
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

/**
 * Dynamic theme loader that fetches team data and applies colors (returns applied colors).
 * Prefer loadTeamTheme(teamName) directly; this remains for compatibility.
 */
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

/**
 * Test function to demonstrate dynamic team theming
 */
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

// Initialize theme on load
if (typeof document !== 'undefined') {
  initializeTheme();

  // Add global helpers for quick verification (development only)
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    (window as any).switchTeamTheme = switchTeamTheme;
    (window as any).availableTeams = [
      'UCSD Baseball',
      'USD Baseball',
      "UCSD Men's Basketball",
      "UCSD Men's Golf",
      'USF Basketball',
      'SF State Baseball'
    ];
    (window as any).debugThemeVars = () => {
      const cs = getComputedStyle(document.documentElement);
      console.log('CSS Vars:', {
        primary: cs.getPropertyValue('--primary-color').trim(),
        secondary: cs.getPropertyValue('--secondary-color').trim(),
        backgroundOverlay: cs.getPropertyValue('--background-overlay').trim()
      });
    };
    console.log('[Theme] Development mode: Use switchTeamTheme("Team Name") to test dynamic theming');
    console.log('[Theme] Available teams:', (window as any).availableTeams);
  }
}