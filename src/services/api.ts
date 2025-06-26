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
  
  // If in test mode, use environment variables
  if (TEST_MODE) {
    const envTeamName = import.meta.env.VITE_TEAM_NAME;
    if (envTeamName) {
      console.debug('[API] Test mode active, using environment team:', envTeamName);
      
      return {
        team_name: envTeamName,
        team_logo_url: import.meta.env.VITE_TEAM_LOGO_URL || getTeamConfig(envTeamName).defaultLogo,
        primaryThemeColor: import.meta.env.VITE_TEAM_PRIMARY_COLOR || getTeamConfig(envTeamName).primaryColor,
        secondaryThemeColor: import.meta.env.VITE_TEAM_SECONDARY_COLOR || getTeamConfig(envTeamName).secondaryColor,
        sport: import.meta.env.VITE_TEAM_SPORT || getTeamConfig(envTeamName).sport,
        standing_type: import.meta.env.VITE_TEAM_CONFERENCE || getTeamConfig(envTeamName).conference
      };
    }
  }
  
  return MOCK_TEAMS[teamName] || MOCK_TEAMS.default;
};

export const fetchTeamData = async (teamName: string = 'UCSD Baseball'): Promise<TeamData[]> => {
  // If we're in test mode, use environment variables if available
  if (TEST_MODE) {
    const envTeamName = import.meta.env.VITE_TEAM_NAME;
    if (envTeamName) {
      console.log('[API] Test mode active, returning mock data for environment team:', envTeamName);
      return generateTestData(envTeamName);
    }
    
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
  
  // Get conference from environment variable if in test mode
  const conference = import.meta.env.VITE_TEST_MODE === 'true' && import.meta.env.VITE_TEAM_CONFERENCE
    ? import.meta.env.VITE_TEAM_CONFERENCE
    : teamConfig.conference;
  
  // For standings, use the appropriate name format
  // For USD, use "San Diego" in standings to match what's shown in the screenshot
  const standingsTeamName = teamName.includes('USD') ? 'San Diego' : teamName;
  
  console.log(`[API] Generating mock data for ${teamName} (${standingsTeamName} in standings) in conference: ${conference}`);
  
  // Add team info with standings data
  mockData.push({
    team_name: standingsTeamName,
    team_logo_url: teamConfig.defaultLogo,
    primaryThemeColor: teamConfig.primaryColor,
    secondaryThemeColor: teamConfig.secondaryColor,
    sport: teamConfig.sport,
    standing_type: conference,
    dataType: 'standings',
    overall_wins: '26',
    overall_losses: '29',
    conf_wins: '19',
    conf_losses: '5',
    streak: 'L1'
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
  
  // Generate appropriate teams based on conference
  let conferenceTeams: string[] = [];
  
  // Use different mock teams based on conference
  if (conference === 'West Coast Conference') {
    // For USD, add "San Diego" as the first team to match standings format
    if (teamName.includes('USD')) {
      conferenceTeams = [
        'San Diego', 'Gonzaga', 'Saint Mary\'s', 'LMU',
        'Portland', 'Santa Clara', 'BYU', 'Pacific', 'San Francisco'
      ];
    } else {
      conferenceTeams = [
        'Gonzaga', 'Saint Mary\'s', 'San Diego', 'LMU',
        'Portland', 'Santa Clara', 'BYU', 'Pacific', 'San Francisco'
      ];
    }
  } else if (conference === 'Mountain West Conference') {
    conferenceTeams = [
      'San Diego State', 'Nevada', 'Fresno State', 'UNLV',
      'New Mexico', 'Air Force', 'Colorado State', 'Wyoming', 'Boise State'
    ];
  } else if (conference === 'Pac-12 Conference') {
    conferenceTeams = [
      'USC', 'Stanford', 'Oregon', 'Arizona',
      'Washington', 'Arizona State', 'Oregon State', 'UCLA', 'California'
    ];
  } else { // Default to Big West Conference teams
    conferenceTeams = [
      'UC Irvine', 'Cal Poly', 'Cal State Fullerton', 'UC Santa Barbara',
      'Hawaii', 'Long Beach State', 'UC San Diego', 'UC Davis', 'CSUN'
    ];
  }
  
  conferenceTeams.forEach((name, index) => {
    mockData.push({
      team_name: name,
      team_logo_url: '/images/default-logo.png',
      sport: teamConfig.sport,
      standing_type: conference,
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
  // If in test mode, use environment variable if available
  if (TEST_MODE && import.meta.env.VITE_TEAM_LOGO_URL) {
    console.debug('[API] Test mode active, using environment logo:', import.meta.env.VITE_TEAM_LOGO_URL);
    return import.meta.env.VITE_TEAM_LOGO_URL;
  }
  
  try {
    const data = await fetchTeamData(teamName);
    const team = data.find(item => item.team_name === teamName);
    return team?.team_logo_url || '/images/default-logo.png';
  } catch (error) {
    console.error('Error getting team logo:', error);
    return '/images/default-logo.png';
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
  // If in test mode, use environment variables if available
  if (TEST_MODE) {
    const primaryColor = import.meta.env.VITE_TEAM_PRIMARY_COLOR;
    const secondaryColor = import.meta.env.VITE_TEAM_SECONDARY_COLOR;
    
    if (primaryColor && secondaryColor) {
      console.debug('[API] Test mode active, using environment colors:', primaryColor, secondaryColor);
      return { primaryColor, secondaryColor };
    }
    
    // If we have a team name from env but no colors, use config
    const envTeamName = import.meta.env.VITE_TEAM_NAME;
    if (envTeamName) {
      const config = getTeamConfig(envTeamName);
      return {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor
      };
    }
  }
  
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
