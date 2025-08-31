// Team aliases configuration for dynamic team routing
// This maps team IDs used in URLs to team information

export interface TeamAlias {
  name: string;
  conference?: string;
  // Note: colors are provided by the API feed, no manual overrides
}

export const TEAM_ALIASES: Record<string, TeamAlias> = {
  'ucsd-mens-basketball': {
    name: 'UCSD Men\'s Basketball',
    conference: 'Big West'
  },
  'sf-state': {
    name: 'SF State Baseball', 
    conference: 'CCAA'
  },
  'usd-baseball': {
    name: 'USD Baseball',
    conference: 'West Coast Conference'
  },
  'usf-basketball': {
    name: 'USF Basketball',
    conference: 'West Coast Conference'
    // Note: No manual color overrides - colors come from API feed
  }
};

// Helper function to get team name from ID
export function getTeamNameFromAlias(teamId: string): string {
  const alias = TEAM_ALIASES[teamId];
  return alias ? alias.name : teamId;
}

// Helper function to get conference from team ID  
export function getTeamConference(teamId: string): string | undefined {
  const alias = TEAM_ALIASES[teamId];
  return alias?.conference;
}

// Get all available team IDs
export function getAllTeamIds(): string[] {
  return Object.keys(TEAM_ALIASES);
}