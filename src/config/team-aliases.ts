export type TeamAlias = {
  name: string;
  sport?: string;
  conference?: string; // Optional override when API is missing/inconsistent
  colors?: { primary: string; secondary: string }; // Optional override when API is missing
};

export const TEAM_ALIASES: Record<string, TeamAlias> = {
  'ucsd': { 
    name: 'UCSD Baseball', 
    sport: 'Baseball', 
    conference: 'Big West', 
    colors: { primary: '#182B49', secondary: '#FFCD00' } 
  },
  'ucsd-mens-basketball': { 
    name: "UCSD Men's Basketball", 
    sport: 'Basketball', 
    conference: 'Big West', 
    colors: { primary: '#182B49', secondary: '#FFCD00' } 
  },
  'sf-state': { 
    name: 'SF State Baseball', 
    sport: 'Baseball', 
    conference: 'CCAA' 
  },
  'usd-baseball': { 
    name: 'USD Baseball', 
    sport: 'Baseball', 
    conference: 'West Coast Conference', 
    colors: { primary: '#002F6C', secondary: '#8BB8E8' } 
  },
  'usf-basketball': { 
    name: 'USF Basketball', 
    sport: 'Basketball', 
    conference: 'West Coast Conference', 
    colors: { primary: '#00543C', secondary: '#B9975B' } 
  },
  'cal-poly-pomona': { 
    name: 'Cal Poly Pomona Baseball', 
    sport: 'Baseball', 
    conference: 'CCAA' 
  }
};

export const TEAM_ID_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_ALIASES).map(([id, meta]) => [id, meta.name])
);

export const TEAM_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_ALIASES).map(([id, meta]) => [meta.name, id])
);

export function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

export function getOverridesForTeam(teamName: string): { colors?: { primary: string; secondary: string }, conference?: string } | null {
  const entry = Object.entries(TEAM_ALIASES).find(([, meta]) => meta.name === teamName)?.[1];
  if (!entry) return null;
  const { colors, conference } = entry;
  return { colors, conference };
}