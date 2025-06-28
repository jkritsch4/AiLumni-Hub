// Theme service for dynamic color implementation
export const themeColors = {
  primary: '#182B49',    // Default UCSD Blue
  secondary: '#ffcd00',  // Default UCSD Gold
  background: '#182B49',
  text: '#ffffff',
  accent: '#ffb300'
};

export function setThemeColors(colors: Partial<typeof themeColors>) {
  Object.assign(themeColors, colors);
  
  // Apply CSS custom properties for dynamic theming
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    // Core theme colors
    root.style.setProperty('--primary-color', themeColors.primary);
    root.style.setProperty('--secondary-color', themeColors.secondary);
    
    // Background overlay with primary color and transparency
    root.style.setProperty('--background-overlay', `${themeColors.primary}dd`);
    root.style.setProperty('--background-overlay-light', `${themeColors.primary}aa`);
    root.style.setProperty('--background-overlay-dark', `${themeColors.primary}ee`);
    
    // FAB Menu button colors (secondary color)
    root.style.setProperty('--fab-color', themeColors.secondary);
    root.style.setProperty('--fab-hover-color', adjustColorBrightness(themeColors.secondary, 20));
    
    // Interactive elements and accents (secondary color)
    root.style.setProperty('--accent-color', themeColors.secondary);
    root.style.setProperty('--accent-hover-color', adjustColorBrightness(themeColors.secondary, -20));
    root.style.setProperty('--border-accent-color', themeColors.secondary);
    
    // Progress bars and highlights
    root.style.setProperty('--progress-color', themeColors.secondary);
    root.style.setProperty('--highlight-color', themeColors.secondary);
    
    console.log('[Theme] Applied dynamic colors:', {
      primary: themeColors.primary,
      secondary: themeColors.secondary,
      backgroundOverlay: `${themeColors.primary}dd`,
      fabColor: themeColors.secondary
    });
  }
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB components
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Adjust brightness
  const newR = Math.min(255, Math.max(0, r + (r * percent / 100)));
  const newG = Math.min(255, Math.max(0, g + (g * percent / 100)));
  const newB = Math.min(255, Math.max(0, b + (b * percent / 100)));
  
  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

// Initialize theme with default UCSD colors
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

// Load team-specific theme colors from DynamoDB data
export function loadTeamTheme(teamData?: { primaryThemeColor?: string; secondaryThemeColor?: string } | string) {
  console.log('[Theme] Loading team theme:', teamData);
  
  if (typeof teamData === 'string') {
    // Legacy support: if team name is passed, use default colors
    console.log('[Theme] Team name passed, using default UCSD colors');
    initializeTheme();
    return;
  }
  
  if (teamData && typeof teamData === 'object' && (teamData.primaryThemeColor || teamData.secondaryThemeColor)) {
    // Use the dynamic colors from DynamoDB
    const primaryColor = teamData.primaryThemeColor || '#182B49';
    const secondaryColor = teamData.secondaryThemeColor || '#FFCD00';
    
    console.log('[Theme] Applying dynamic team colors:', {
      primary: primaryColor,
      secondary: secondaryColor
    });
    
    setThemeColors({
      primary: primaryColor,
      secondary: secondaryColor,
      background: primaryColor,  // Use primary color for background overlay
      text: '#ffffff',
      accent: secondaryColor     // Use secondary color for accents
    });
  } else {
    // Fallback to default UCSD theme
    console.log('[Theme] No team colors found, using default UCSD theme');
    initializeTheme();
  }
}

// Dynamic theme loader that fetches team data and applies colors
export async function loadDynamicTeamTheme(teamName: string) {
  try {
    console.log('[Theme] Loading dynamic theme for team:', teamName);
    
    // Import here to avoid circular dependencies
    const { getTeamData } = await import('./api');
    const teamData = await getTeamData(teamName);
    
    if (teamData && (teamData.primaryThemeColor || teamData.secondaryThemeColor)) {
      loadTeamTheme({
        primaryThemeColor: teamData.primaryThemeColor,
        secondaryThemeColor: teamData.secondaryThemeColor
      });
      
      return {
        primary: teamData.primaryThemeColor || '#182B49',
        secondary: teamData.secondaryThemeColor || '#FFCD00'
      };
    } else {
      console.warn('[Theme] No color data found for team:', teamName);
      initializeTheme();
      return null;
    }
  } catch (error) {
    console.error('[Theme] Error loading dynamic theme:', error);
    initializeTheme();
    return null;
  }
}

// Test function to demonstrate dynamic team theming
export async function switchTeamTheme(teamName: string) {
  console.log('[Theme] Switching to team theme:', teamName);
  try {
    const { getTeamData } = await import('./api');
    const teamData = await getTeamData(teamName);
    
    if (teamData) {
      console.log('[Theme] Found team data:', teamData);
      loadTeamTheme({
        primaryThemeColor: teamData.primaryThemeColor,
        secondaryThemeColor: teamData.secondaryThemeColor
      });
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
  
  // Add global function for testing (development only)
  if (process.env.NODE_ENV === 'development') {
    (window as any).switchTeamTheme = switchTeamTheme;
    (window as any).availableTeams = ['UCSD Baseball', 'SF State Baseball', 'UCLA Baseball', 'Stanford Baseball'];
    console.log('[Theme] Development mode: Use switchTeamTheme("Team Name") to test dynamic theming');
    console.log('[Theme] Available teams:', (window as any).availableTeams);
  }
}
