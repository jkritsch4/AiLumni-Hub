import { DEFAULT_TEAM, getTeamConfig, TEAM_CONFIGS, TEST_MODE, generateMockTeamData } from '../config';

export interface TeamData {
  team_name: string;
  team_logo_url: string;
  game_outcome?: string;
  game_date?: string;
  opponent_name?: string;
  sport?: string;
  primaryThemeColor?: string;
  secondaryThemeColor?: string;
  standing_type?: string;
}

const API_ENDPOINT = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

// Dynamically generate mock teams based on configurations
const generateMockTeams = (): Record<string, TeamData> => {
  const teams: Record<string, TeamData> = {};
  
  // Generate entries for each pre-configured team
  Object.keys(TEAM_CONFIGS).forEach(teamName => {
    const config = getTeamConfig(teamName);
    teams[teamName] = {
      team_name: teamName,
      team_logo_url: config.defaultLogo,
      primaryThemeColor: config.primaryColor,
      secondaryThemeColor: config.secondaryColor,
      sport: config.sport,
      standing_type: config.conference
    };
  });
  
  // Set default team
  teams['default'] = {
    team_name: DEFAULT_TEAM,
    team_logo_url: getTeamConfig(DEFAULT_TEAM).defaultLogo,
    primaryThemeColor: getTeamConfig(DEFAULT_TEAM).primaryColor,
    secondaryThemeColor: getTeamConfig(DEFAULT_TEAM).secondaryColor,
    sport: getTeamConfig(DEFAULT_TEAM).sport,
    standing_type: getTeamConfig(DEFAULT_TEAM).conference
  };
  
  return teams;
};

// Create mock teams
const MOCK_TEAMS: Record<string, TeamData> = generateMockTeams();

export const getTeamData = async (teamName: string = 'UCSD Baseball'): Promise<TeamData> => {
  console.debug('[API] getTeamData called for team:', teamName);
  return MOCK_TEAMS[teamName] || MOCK_TEAMS.default;
};

export const fetchTeamData = async (teamName: string = 'UCSD Baseball'): Promise<TeamData[]> => {
  // If we're in test mode, return mock data
  if (TEST_MODE) {
    console.log('[API] Test mode active, returning mock data for:', teamName);
    return generateTestData(teamName);
  }
  
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team data:', error);
    // If API fails, fall back to mock data
    return generateTestData(DEFAULT_TEAM);
  }
};

// Generate test data for the specified team
const generateTestData = (teamName: string): TeamData[] => {
  const teamConfig = getTeamConfig(teamName);
  const mockData: TeamData[] = [];
  
  // Add team info with standings data
  mockData.push({
    team_name: teamName,
    team_logo_url: teamConfig.defaultLogo,
    primaryThemeColor: teamConfig.primaryColor,
    secondaryThemeColor: teamConfig.secondaryColor,
    sport: teamConfig.sport,
    standing_type: teamConfig.conference,
    dataType: 'standings',
    overall_wins: '27',
    overall_losses: '28',
    conf_wins: '15',
    conf_losses: '15',
    streak: 'W2'
  } as any);
  
  // Add some upcoming games data
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  mockData.push({
    team_name: teamName,
    team_logo_url: teamConfig.defaultLogo,
    opponent_name: 'Test Opponent',
    opponent_logo_url: '/images/default-logo.png',
    sport: teamConfig.sport,
    game_location: 'Home Stadium, City, State',
    start_time_utc: tomorrow.toISOString(),
    dataType: 'games'
  } as any);
  
  // Add some recent results
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  mockData.push({
    team_name: teamName,
    team_logo_url: teamConfig.defaultLogo,
    opponent_name: 'Previous Opponent',
    opponent_logo_url: '/images/default-logo.png',
    sport: teamConfig.sport,
    game_location: 'Away Stadium, Other City, State',
    start_time_utc: yesterday.toISOString(),
    game_result: 'W 5-3',
    game_outcome: 'W',
    dataType: 'results'
  } as any);
  
  // Add 9 more teams to the standings (sample conference standings)
  const conferenceTeams = [
    'Team A', 'Team B', 'Team C', 'Team D', 
    'Team E', 'Team F', 'Team G', 'Team H', 'Team I'
  ];
  
  conferenceTeams.forEach((name, index) => {
    mockData.push({
      team_name: name,
      team_logo_url: '/images/default-logo.png',
      sport: teamConfig.sport,
      standing_type: teamConfig.conference,
      dataType: 'standings',
      overall_wins: `${30 - index}`,
      overall_losses: `${20 + index}`,
      conf_wins: `${20 - index}`,
      conf_losses: `${10 + index}`,
      streak: index % 2 === 0 ? 'W1' : 'L1'
    } as any);
  });
  
  return mockData;
};

export const getTeamLogo = async (teamName: string = 'UCSD Baseball'): Promise<string> => {
  try {
    const data = await fetchTeamData(teamName);
    const team = data.find(item => item.team_name === teamName);
    return team?.team_logo_url || '/images/ucsd-trident.svg';
  } catch (error) {
    console.error('Error getting team logo:', error);
    return '/images/ucsd-trident.svg';
  }
};

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

export const getTeamColors = async (teamName: string = 'UCSD Baseball'): Promise<{ primaryColor: string, secondaryColor: string }> => {
  try {
    const data = await fetchTeamData(teamName);
    const team = data.find(item => item.team_name === teamName);
    
    // Return the team colors if they exist, otherwise return UCSD default colors
    return {
      primaryColor: team?.primaryThemeColor || '#182B49', // Default to UCSD Blue
      secondaryColor: team?.secondaryThemeColor || '#FFCD00' // Default to UCSD Gold
    };
  } catch (error) {
    console.error('Error getting team colors:', error);
    return {
      primaryColor: '#182B49', // Default to UCSD Blue
      secondaryColor: '#FFCD00' // Default to UCSD Gold
    };
  }
};

// This is a helper to get both the team data and colors in one call
export const getTeamDataWithColors = async (teamName: string = 'UCSD Baseball'): Promise<TeamData & { primaryColor: string, secondaryColor: string }> => {
  const data = await getTeamData(teamName);
  const colors = await getTeamColors(teamName);
  
  return {
    ...data,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor
  };
};

// This allows getting the cached team colors from localStorage
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
