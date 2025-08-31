// Real AWS API Data Types based on the provided JSON structure
import { debug, createDebugContext, handleComponentError } from '../utils/debug';
import { TEAM_ID_TO_NAME, TEAM_NAME_TO_ID, getOverridesForTeam, slugifyTeamName } from '../config/team-aliases';

// Log successful API service initialization
debug.info(createDebugContext('API', 'initialization'), 'API service loaded successfully with all exports');

export interface TeamInfo {
  team_name: string;
  team_logo_url: string;
  primaryThemeColor: string;
  secondaryThemeColor: string;
  sport: string;
  conference?: string; // NEW optional
}

export interface Game {
  game_id: string;
  team_name: string;
  opponent_name: string;
  game_date: string; // We'll map from start_time_utc
  game_outcome: 'W' | 'L' | 'T' | 'Pending' | null;
  team_score?: number;
  opponent_score?: number;
  home_away: 'Home' | 'Away';
  sport: string;
  game_location?: string;
  opponent_logo_url?: string;
}

export interface Standing {
  team_name: string;
  wins: number;
  losses: number;
  win_percentage: number;
  rank?: number;
  sport: string;
  conf_wins?: string;
  conf_losses?: string;
  overall_wins?: string;
  overall_losses?: string;
  standing_type?: string;
  streak?: string;
}

export interface APIResponse {
  TeamInfo: TeamInfo[];
  Games: Game[];
  Standings: Standing[];
}

// AWS API Configuration
const API_ENDPOINT = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

// Global state for current team and cached data
let currentSelectedTeam = 'UCSD Baseball';
let apiDataCache: APIResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fallback data for development
const FALLBACK_TEAM_INFO: TeamInfo[] = [
  {
    team_name: 'UCSD Baseball',
    team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png',
    primaryThemeColor: '#182B49',
    secondaryThemeColor: '#FFCD00',
    sport: 'Baseball'
  },
  {
    team_name: 'UCSD Men\'s Basketball',
    team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png',
    primaryThemeColor: '#182B49',
    secondaryThemeColor: '#FFCD00',
    sport: 'Basketball'
  },
  {
    team_name: 'UCSD Men\'s Golf',
    team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png',
    primaryThemeColor: '#182B49',
    secondaryThemeColor: '#FFCD00',
    sport: 'Golf'
  }
];

/**
 * Fetch data from AWS API
 */
export const fetchAPIData = async (): Promise<APIResponse> => {
  const context = createDebugContext('API', 'fetchAPIData');
  
  // Check cache first
  const now = Date.now();
  if (apiDataCache && (now - lastFetchTime) < CACHE_DURATION) {
    debug.info(context, 'Using cached data');
    return apiDataCache;
  }

  try {
    debug.info(context, 'Fetching data from AWS API...');
    const response = await fetch(API_ENDPOINT);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();
    debug.info(context, `Received ${rawData.length} raw data items`);
    
    // Transform raw array data into structured format
    const teamInfoData: TeamInfo[] = [];
    const gamesData: Game[] = [];
    const standingsData: Standing[] = [];
    
    for (const item of rawData) {
      // Check if this item has team info (team_logo_url indicates team info)
      if (item.team_logo_url && item.team_name) {
        const teamInfo: TeamInfo = {
          team_name: item.team_name,
          team_logo_url: item.team_logo_url,
          primaryThemeColor: item.primaryThemeColor || '#182B49',
          secondaryThemeColor: item.secondaryThemeColor || '#FFCD00',
          sport: item.sport || 'Baseball'
        };
        // Avoid duplicates
        if (!teamInfoData.find(t => t.team_name === teamInfo.team_name && t.sport === teamInfo.sport)) {
          teamInfoData.push(teamInfo);
        }
      }
      
      // Check if this item is a game (has start_time_utc and opponent)
      if (item.start_time_utc && item.opponent_name) {
        // Debug raw API data for opponent logo
        console.log('[API] Raw game item opponent logo data:', {
          opponent_name: item.opponent_name,
          opponent_logo_url: item.opponent_logo_url,
          opponent_logo_type: typeof item.opponent_logo_url,
          opponent_logo_raw: JSON.stringify(item.opponent_logo_url),
          all_keys: Object.keys(item)
        });
        
        // Log raw API data for debugging recent games date sorting
        if (item.team_name === 'UCSD Baseball' && item.game_outcome && item.game_outcome !== 'Pending') {
          console.log('[API Debug] Raw completed game data:', {
            opponent: item.opponent_name,
            start_time_utc: item.start_time_utc,
            game_outcome: item.game_outcome,
            parsedDate: new Date(item.start_time_utc).toLocaleDateString()
          });
        }
        
        const game: Game = {
          game_id: item.game_id || `${item.team_name}-${item.start_time_utc}-${item.opponent_name}`,
          team_name: item.team_name,
          opponent_name: item.opponent_name,
          game_date: item.start_time_utc, // Map from start_time_utc
          team_score: item.score_team,
          opponent_score: item.score_opponent,
          game_outcome: item.game_outcome === 'Pending' ? null : item.game_outcome,
          home_away: item.game_location && item.game_location.toLowerCase().includes('ucsd') ? 'Home' : 'Away',
          sport: item.sport || 'Baseball',
          game_location: item.game_location,
          opponent_logo_url: item.opponent_logo_url
        };
        gamesData.push(game);
      }
      
      // Check if this item is standings data (has wins/losses)
      if (item.conf_wins !== undefined || item.overall_wins !== undefined) {
        const overallWins = parseInt(item.overall_wins) || 0;
        const overallLosses = parseInt(item.overall_losses) || 0;
        const totalGames = overallWins + overallLosses;
        const winPercentage = totalGames > 0 ? overallWins / totalGames : 0;
        
        const standing: Standing = {
          team_name: item.team_name,
          wins: overallWins,
          losses: overallLosses,
          win_percentage: winPercentage,
          rank: parseInt(item.rank) || 0,
          sport: item.sport || 'Baseball',
          conf_wins: item.conf_wins,
          conf_losses: item.conf_losses,
          overall_wins: item.overall_wins,
          overall_losses: item.overall_losses,
          standing_type: item.standing_type,
          streak: item.streak
        };
        standingsData.push(standing);
      }
    }
    
    const data: APIResponse = {
      TeamInfo: teamInfoData,
      Games: gamesData,
      Standings: standingsData
    };
    
    // Cache the data
    apiDataCache = data;
    lastFetchTime = now;
    
    debug.info(context, 'Successfully processed API data', {
      teamInfoCount: data.TeamInfo.length,
      gamesCount: data.Games.length,
      standingsCount: data.Standings.length
    });
    return data;
    
  } catch (error) {
    handleComponentError(context, error);
    
    // Return fallback data
    debug.warn(context, 'Using fallback data due to API error');
    return {
      TeamInfo: FALLBACK_TEAM_INFO,
      Games: [],
      Standings: []
    };
  }
};

/**
 * Get current selected team name
 */
export const getCurrentTeam = (): string => {
  return currentSelectedTeam;
};

/**
 * Set current selected team
 */
export const setCurrentTeam = (teamName: string): void => {
  currentSelectedTeam = teamName;
  console.debug('[API] Current team set to:', teamName);
};

/**
 * Convert team ID to team name
 */
export const getTeamNameFromId = (teamId: string): string => {
  const normalized = teamId.toLowerCase();
  if (TEAM_ID_TO_NAME[normalized]) return TEAM_ID_TO_NAME[normalized];
  
  // Fallback: try slug match against known team names from cached data
  try {
    if (apiDataCache?.TeamInfo?.length) {
      const match = apiDataCache.TeamInfo.find(t => slugifyTeamName(t.team_name) === normalized);
      if (match) return match.team_name;
    }
  } catch (e) {
    console.warn('[API] Error during slug match for team id:', teamId, e);
  }
  console.warn('[API] Unknown team_id, using raw id as name (may not match TeamInfo):', teamId);
  return teamId;
};

/**
 * Convert team name to team ID
 */
export const getTeamIdFromName = (teamName: string): string => {
  return TEAM_NAME_TO_ID[teamName] || slugifyTeamName(teamName);
};

/**
 * Set current team by team ID (for URL parameters)
 */
export const setCurrentTeamById = (teamId: string): void => {
  const teamName = getTeamNameFromId(teamId);
  setCurrentTeam(teamName);
};

/**
 * Get team info for a specific team
 */
export const getTeamInfo = async (teamName?: string): Promise<TeamInfo | null> => {
  const context = createDebugContext('API', 'getTeamInfo', { teamName });
  
  try {
    const targetTeam = teamName || currentSelectedTeam;
    debug.info(context, `Fetching team info for: ${targetTeam}`);
    
    const data = await fetchAPIData();
    let teamInfo = data.TeamInfo.find(team => team.team_name === targetTeam) || null;
    
    if (!teamInfo) {
      debug.warn(context, `Team info not found for: ${targetTeam}, using fallback`);
      teamInfo = FALLBACK_TEAM_INFO.find(team => team.team_name === targetTeam) || FALLBACK_TEAM_INFO[0] || null;
    }

    if (teamInfo) {
      const overrides = getOverridesForTeam(teamInfo.team_name);
      if (overrides?.colors) {
        teamInfo = {
          ...teamInfo,
          primaryThemeColor: teamInfo.primaryThemeColor || overrides.colors.primary,
          secondaryThemeColor: teamInfo.secondaryThemeColor || overrides.colors.secondary,
        };
      }
      if (overrides?.conference && !teamInfo.conference) {
        teamInfo = { ...teamInfo, conference: overrides.conference };
      }
      debug.info(context, `Successfully found team info for: ${targetTeam}`, teamInfo);
    }

    return teamInfo;
  } catch (error) {
    handleComponentError(context, error);
    return FALLBACK_TEAM_INFO[0];
  }
};

/**
 * Get all available teams
 */
export const getAllTeams = async (): Promise<TeamInfo[]> => {
  const context = createDebugContext('API', 'getAllTeams');
  
  try {
    debug.info(context, 'Fetching all teams');
    const data = await fetchAPIData();
    debug.info(context, `Found ${data.TeamInfo.length} teams`);
    return data.TeamInfo;
  } catch (error) {
    handleComponentError(context, error);
    return FALLBACK_TEAM_INFO;
  }
};

/**
 * Get upcoming games for a team
 */
export const getUpcomingGames = async (teamName?: string): Promise<Game[]> => {
  const context = createDebugContext('API', 'getUpcomingGames', { teamName });
  
  try {
    const targetTeam = teamName || currentSelectedTeam;
    debug.info(context, `Fetching upcoming games for: ${targetTeam}`);
    
    const data = await fetchAPIData();
    
    // Defensive check for data structure
    if (!data || !data.Games || !Array.isArray(data.Games)) {
      debug.warn(context, 'Invalid or missing Games data structure', { data });
      return [];
    }
    
    // Filter games where game_outcome is null or 'Pending' (upcoming) and team matches
    const upcomingGames = data.Games
      .filter(game => game && game.team_name === targetTeam && (game.game_outcome === null || game.game_outcome === 'Pending'))
      .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());
    
    debug.info(context, `Found ${upcomingGames.length} upcoming games for: ${targetTeam}`);
    return upcomingGames;
  } catch (error) {
    handleComponentError(context, error);
    return [];
  }
};

/**
 * Get recent games for a team
 */
export const getRecentGames = async (teamName?: string): Promise<Game[]> => {
  const context = createDebugContext('API', 'getRecentGames', { teamName });
  
  try {
    const targetTeam = teamName || currentSelectedTeam;
    debug.info(context, `Fetching recent games for: ${targetTeam}`);
    
    const data = await fetchAPIData();
    
    // Defensive check for data structure
    if (!data || !data.Games || !Array.isArray(data.Games)) {
      debug.warn(context, 'Invalid or missing Games data structure', { data });
      return [];
    }
    
    // Filter games where game_outcome is not null/Pending (completed) and team matches
    const recentGames = data.Games
      .filter(game => game && game.team_name === targetTeam && game.game_outcome && game.game_outcome !== 'Pending')
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
      .slice(0, 10); // Get last 10 games
    
    debug.info(context, `Found ${recentGames.length} recent games for: ${targetTeam}`);
    debug.info(context, 'Recent games with dates (most recent first):', 
      recentGames.slice(0, 5).map(game => ({
        opponent: game.opponent_name,
        date: game.game_date,
        outcome: game.game_outcome,
        parsedDate: new Date(game.game_date).toLocaleDateString()
      }))
    );
    return recentGames;
  } catch (error) {
    handleComponentError(context, error);
    return [];
  }
};

/**
 * Get standings for a team's sport/conference
 */
export const getStandings = async (sport: string): Promise<Standing[]> => {
  const context = createDebugContext('API', 'getStandings', { sport });
  
  try {
    debug.info(context, `Fetching standings for sport: ${sport}`);
    const data = await fetchAPIData();
    
    // Defensive check for data structure
    if (!data || !data.Standings || !Array.isArray(data.Standings)) {
      debug.warn(context, 'Invalid or missing Standings data structure', { data });
      return [];
    }
    
    // Filter standings by sport and sort by win percentage
    const standings = data.Standings
      .filter(standing => standing && standing.sport === sport)
      .sort((a, b) => {
        const aWinPct = a.win_percentage || 0;
        const bWinPct = b.win_percentage || 0;
        return bWinPct - aWinPct;
      });
    
    debug.info(context, `Found ${standings.length} standings for sport: ${sport}`);
    return standings;
  } catch (error) {
    handleComponentError(context, error);
    return [];
  }
};

/**
 * Get team colors for theming
 */
export const getTeamColors = async (teamName?: string): Promise<{ primaryColor: string, secondaryColor: string }> => {
  const context = createDebugContext('API', 'getTeamColors', { teamName });
  
  try {
    debug.info(context, `Fetching team colors for: ${teamName || currentSelectedTeam}`);
    const teamInfo = await getTeamInfo(teamName);
    
    if (!teamInfo) {
      debug.warn(context, 'Team info not found, using default colors');
      // Return default colors
      return {
        primaryColor: '#182B49',
        secondaryColor: '#FFCD00'
      };
    }
    
    debug.info(context, 'Successfully retrieved team colors', {
      primaryColor: teamInfo.primaryThemeColor,
      secondaryColor: teamInfo.secondaryThemeColor
    });
    
    return {
      primaryColor: teamInfo.primaryThemeColor,
      secondaryColor: teamInfo.secondaryThemeColor
    };
  } catch (error) {
    handleComponentError(context, error);
    return {
      primaryColor: '#182B49',
      secondaryColor: '#FFCD00'
    };
  }
};

/**
 * Get team logo URL
 */
export const getTeamLogo = async (teamName?: string): Promise<string> => {
  const context = createDebugContext('API', 'getTeamLogo', { teamName });
  
  try {
    debug.info(context, `Fetching team logo for: ${teamName || currentSelectedTeam}`);
    const teamInfo = await getTeamInfo(teamName);
    const logoUrl = teamInfo?.team_logo_url || '/images/default-logo.png';
    
    debug.info(context, 'Successfully retrieved team logo', { logoUrl });
    return logoUrl;
  } catch (error) {
    handleComponentError(context, error);
    return '/images/default-logo.png';
  }
};

/**
 * Legacy compatibility functions for existing code
 */
export interface TeamData {
  team_name: string;
  team_logo_url: string;
  game_outcome?: string;
  game_date?: string;
  opponent_name?: string;
  sport?: string;
  primaryThemeColor?: string;
  secondaryThemeColor?: string;
}

export const getTeamData = async (teamName: string = 'USD Baseball'): Promise<TeamData> => {
  const teamInfo = await getTeamInfo(teamName);
  
  if (!teamInfo) {
    return {
      team_name: teamName,
      team_logo_url: '/images/default-logo.png',
      primaryThemeColor: '#182B49',
      secondaryThemeColor: '#FFCD00',
      sport: 'Baseball'
    };
  }
  
  return {
    team_name: teamInfo.team_name,
    team_logo_url: teamInfo.team_logo_url,
    primaryThemeColor: teamInfo.primaryThemeColor,
    secondaryThemeColor: teamInfo.secondaryThemeColor,
    sport: teamInfo.sport
  };
};

export const getTeamDataWithColors = async (teamName: string = 'USD Baseball'): Promise<TeamData & { primaryColor: string, secondaryColor: string }> => {
  const data = await getTeamData(teamName);
  const colors = await getTeamColors(teamName);
  
  return {
    ...data,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor
  };
};

// Caching functions
export const cacheTeamData = (data: TeamData): void => {
  try {
    localStorage.setItem('teamData', JSON.stringify(data));
  } catch (error) {
    console.warn('[API] Error caching team data:', error);
  }
};

export const getCachedTeamData = (): TeamData | null => {
  try {
    const cachedData = localStorage.getItem('teamData');
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.warn('[API] Error reading cached team data:', error);
  }
  return null;
};

export const getCachedTeamColors = (): { primaryColor: string, secondaryColor: string } => {
  try {
    const cachedData = getCachedTeamData();
    if (cachedData) {
      return {
        primaryColor: cachedData.primaryThemeColor || '#182B49',
        secondaryColor: cachedData.secondaryThemeColor || '#FFCD00'
      };
    }
  } catch (error) {
    console.warn('[API] Error reading cached team colors:', error);
  }
  return {
    primaryColor: '#182B49',
    secondaryColor: '#FFCD00'
  };
};
