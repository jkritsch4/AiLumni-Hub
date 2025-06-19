export interface TeamData {
  team_name: string;
  team_logo_url: string;
  game_outcome?: string;
  game_date?: string;
  opponent_name?: string;
  sport?: string;
}

const API_ENDPOINT = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

// Mock data to use while API is not available
const MOCK_TEAMS: Record<string, TeamData> = {
  'UCSD Baseball': {
    team_name: 'UCSD Baseball',
    team_logo_url: '/images/ucsd-trident.svg'
  },
  'default': {
    team_name: 'UCSD Baseball',
    team_logo_url: '/images/ucsd-trident.svg'
  }
};

export const getTeamData = async (teamName: string = 'UCSD Baseball'): Promise<TeamData> => {
  console.debug('[API] getTeamData called for team:', teamName);
  return MOCK_TEAMS[teamName] || MOCK_TEAMS.default;
};

export const fetchTeamData = async (teamName: string = 'UCSD Baseball'): Promise<TeamData[]> => {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
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
