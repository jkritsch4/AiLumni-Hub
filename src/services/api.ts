// Real AWS API Data Types based on the provided JSON structure
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

// Log successful API service initialization
debug.info(createDebugContext('API', 'initialization'), 'API service loaded successfully with all exports');

export interface TeamInfo {
  team_name: string;
  team_logo_url: string;
  primaryThemeColor: string;
  secondaryThemeColor: string;
  sport: string;
  conference_name?: string;
}

export interface Game {
  game_id: string;
  team_name: string;
  opponent_name: string;
  game_date: string; // mapped from start_time_utc
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
  standing_type?: string; // conference or grouping
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

// Team ID to team name mapping for URL parameters
const TEAM_ID_MAPPING: Record<string, string> = {
  'sf-state': 'SF State Baseball',
  'chico-state': 'Chico State Baseball',
  'cal-poly-pomona': 'Cal Poly Pomona Baseball',
  'ucsd': 'UCSD Baseball'
};

// Reverse mapping for team name to team ID
const TEAM_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_ID_MAPPING).map(([id, name]) => [name, id])
);

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
    team_name: "UCSD Men's Basketball",
    team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png',
    primaryThemeColor: '#182B49',
    secondaryThemeColor: '#FFCD00',
    sport: 'Basketball'
  },
  {
    team_name: "UCSD Men's Golf",
    team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png',
    primaryThemeColor: '#182B49',
    secondaryThemeColor: '#FFCD00',
    sport: 'Golf'
  }
];

// Normalize sport labels to reduce fragmentation
function normalizeSport(s?: string): string {
  const v = (s || '').toLowerCase().trim();
  if (!v) return 'Baseball';
  if (v === 'basketball' || v === "men's basketball" || v === 'mens basketball' || v === 'm basketball') return 'Basketball';
  if (v === 'golf' || v === "men's golf" || v === 'mens golf' || v === 'm golf') return 'Golf';
  if (v === 'baseball' || v === 'm baseball' || v === "men's baseball") return 'Baseball';
  return s!;
}

// Safe extract for multiple key spellings
function pick(obj: any, keys: string[], fallback?: any) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const rawData = await response.json();
    debug.info(context, `Received ${rawData.length} raw data items`);

    // Transform raw array data into structured format
    const teamInfoByKey = new Map<string, TeamInfo>(); // key: team_name|sport
    const gamesData: Game[] = [];
    const standingsData: Standing[] = [];

    for (const item of rawData) {
      const dataType = (item.dataType || item.datatype || '').toString().toLowerCase();
      const sportNorm = normalizeSport(item.sport);

      // TEAM INFO: Prefer explicit TeamInfo records for colors; fall back to first-seen game item if needed
      if (item.team_logo_url && item.team_name) {
        const key = `${item.team_name}|${sportNorm}`;
        const existing = teamInfoByKey.get(key);

        if (dataType === 'teaminfo') {
          // Strong source of truth for colors
          const ti: TeamInfo = {
            team_name: item.team_name,
            team_logo_url: item.team_logo_url,
            primaryThemeColor: pick(item, ['primaryThemeColor', 'primary_color', 'primaryColor'], '#182B49'),
            secondaryThemeColor: pick(item, ['secondaryThemeColor', 'secondary_color', 'secondaryColor'], '#FFCD00'),
            sport: sportNorm,
            conference_name: item.conference_name
          };
          teamInfoByKey.set(key, ti);
        } else if (!existing) {
          // Create minimal entry (without overriding colors later)
          const ti: TeamInfo = {
            team_name: item.team_name,
            team_logo_url: item.team_logo_url,
            primaryThemeColor: pick(item, ['primaryThemeColor', 'primary_color', 'primaryColor'], '#182B49'),
            secondaryThemeColor: pick(item, ['secondaryThemeColor', 'secondary_color', 'secondaryColor'], '#FFCD00'),
            sport: sportNorm,
            conference_name: item.conference_name
          };
          teamInfoByKey.set(key, ti);
        }
      }

      // GAMES
      if (item.start_time_utc && item.opponent_name) {
        const game: Game = {
          game_id: item.game_id || `${item.team_name}-${item.start_time_utc}-${item.opponent_name}`,
          team_name: item.team_name,
          opponent_name: item.opponent_name,
          game_date: item.start_time_utc,
          team_score: item.score_team,
          opponent_score: item.score_opponent,
          game_outcome: item.game_outcome === 'Pending' ? null : item.game_outcome,
          home_away: item.game_location && item.game_location.toLowerCase().includes('home') ? 'Home' : 'Away',
          sport: sportNorm,
          game_location: item.game_location,
          opponent_logo_url: item.opponent_logo_url
        };
        gamesData.push(game);
      }

      // STANDINGS: accept by dataType or by presence of win/loss fields in many variants
      const isStandingsType = dataType.includes('stand');
      const hasWinsLosses =
        item.conf_wins !== undefined || item.overall_wins !== undefined ||
        item.confWins !== undefined || item.overallWins !== undefined ||
        item.conference_wins !== undefined || item.conference_losses !== undefined ||
        item.overall_losses !== undefined;

      if (isStandingsType || hasWinsLosses) {
        const overallWins = parseInt(pick(item, ['overall_wins', 'overallWins'], '0')) || 0;
        const overallLosses = parseInt(pick(item, ['overall_losses', 'overallLosses'], '0')) || 0;
        const totalGames = overallWins + overallLosses;
        const winPercentage = totalGames > 0 ? overallWins / totalGames : 0;

        const standing: Standing = {
          team_name: item.team_name,
          wins: overallWins,
          losses: overallLosses,
          win_percentage: winPercentage,
          rank: parseInt(pick(item, ['rank', 'Rank'], '0')) || 0,
          sport: normalizeSport(pick(item, ['sport', 'Sport'], sportNorm)),
          conf_wins: pick(item, ['conf_wins', 'confWins', 'conference_wins']),
          conf_losses: pick(item, ['conf_losses', 'confLosses', 'conference_losses']),
          overall_wins: pick(item, ['overall_wins', 'overallWins']),
          overall_losses: pick(item, ['overall_losses', 'overallLosses']),
          standing_type: pick(item, ['standing_type', 'standingType', 'conference_name', 'SK']),
          streak: pick(item, ['streak', 'Streak'])
        };
        standingsData.push(standing);
      }
    }

    const teamInfoData = Array.from(teamInfoByKey.values());

    // Debug summary: how many standings per normalized sport
    const countsBySport = standingsData.reduce<Record<string, number>>((acc, s) => {
      const k = s.sport || 'Unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    debug.info(context, 'Successfully processed API data', {
      teamInfoCount: teamInfoData.length,
      gamesCount: gamesData.length,
      standingsCount: standingsData.length,
      standingsBySport: countsBySport
    });

    const data: APIResponse = {
      TeamInfo: teamInfoData,
      Games: gamesData,
      Standings: standingsData
    };

    // Cache the data
    apiDataCache = data;
    lastFetchTime = now;

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
  return TEAM_ID_MAPPING[teamId.toLowerCase()] || teamId;
};

/**
 * Convert team name to team ID
 */
export const getTeamIdFromName = (teamName: string): string => {
  return TEAM_NAME_TO_ID[teamName] || teamName.toLowerCase().replace(/\s+/g, '-');
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
    const teamInfo = data.TeamInfo.find(team => team.team_name === targetTeam);
    
    if (!teamInfo) {
      debug.warn(context, `Team info not found for: ${targetTeam}, using fallback`);
      return FALLBACK_TEAM_INFO.find(team => team.team_name === targetTeam) || FALLBACK_TEAM_INFO[0];
    }
    
    debug.info(context, `Successfully found team info for: ${targetTeam}`, teamInfo);
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

    if (!data || !data.Games || !Array.isArray(data.Games)) {
      debug.warn(context, 'Invalid or missing Games data structure', { data });
      return [];
    }

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

    if (!data || !data.Games || !Array.isArray(data.Games)) {
      debug.warn(context, 'Invalid or missing Games data structure', { data });
      return [];
    }

    const recentGames = data.Games
      .filter(game => game && game.team_name === targetTeam && game.game_outcome && game.game_outcome !== 'Pending')
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
      .slice(0, 10);

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

    if (!data || !data.Standings || !Array.isArray(data.Standings)) {
      debug.warn(context, 'Invalid or missing Standings data structure', { data });
      return [];
    }

    // Accept any normalized variant
    const variants = new Set<string>([
      normalizeSport(sport),
      'Basketball', "Men's Basketball", 'Mens Basketball', 'M Basketball',
      'Baseball', 'Golf'
    ]);

    const standings = data.Standings
      .filter(standing => standing && variants.has(normalizeSport(standing.sport)))
      .sort((a, b) => (b.win_percentage || 0) - (a.win_percentage || 0));

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
      return { primaryColor: '#182B49', secondaryColor: '#FFCD00' };
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
    return { primaryColor: '#182B49', secondaryColor: '#FFCD00' };
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
  return { ...data, primaryColor: colors.primaryColor, secondaryColor: colors.secondaryColor };
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
    if (cachedData) return JSON.parse(cachedData);
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
  return { primaryColor: '#182B49', secondaryColor: '#FFCD00' };
};