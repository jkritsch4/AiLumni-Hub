interface TeamData {
  team_name: string;
  team_logo_url: string;
  game_outcome?: string;
  sport?: string;
}

const API_ENDPOINT = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

export async function getTeamData(): Promise<TeamData[]> {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
}