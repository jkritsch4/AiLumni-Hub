interface TeamData {
  team_name: string;
  team_logo_url: string;
  game_outcome?: string;
  sport?: string;
}

const API_ENDPOINT = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

export async function getTeamData(): Promise<TeamData[]> {
  console.log('[TeamService] Starting API call');
  try {
    const response = await fetch(API_ENDPOINT);
    console.log('[TeamService] API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[TeamService] Data received:', data);
    return data;
  } catch (error) {
    console.error('[TeamService] Error:', error);
    throw error; // Propagate error to component for proper error handling
  }
}