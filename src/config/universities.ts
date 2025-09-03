export type SportsGroups = {
  mens: string[];
  womens: string[];
};

export type UniversityConfig = {
  slug: string;
  name: string;
  logo: string; // absolute or public/ path
  colors: {
    primary: string;   // hex
    secondary: string; // hex
    backgroundOverlay?: string; // optional rgba
  };
  sports?: string[];
  sportsGroups?: SportsGroups;
  teamPrefix?: string;
};

export const UNIVERSITIES: Record<string, UniversityConfig> = {
  ucsd: {
    slug: 'ucsd',
    name: 'UC San Diego',
    logo: '/images/ucsd-trident.svg',
    colors: {
      primary: '#182B49',
      secondary: '#FFCD00',
      backgroundOverlay: 'rgba(24, 43, 73, 0.85)'
    },
    teamPrefix: 'UCSD',
    sportsGroups: {
      mens: [
        'Baseball',
        'Basketball',
        'Cross Country',
        'Fencing',
        'Golf',
        'Rowing',
        'Soccer',
        'Swimming',
        'Tennis',
        'Track & Field',
        'Volleyball',
        'Water Polo'
      ],
      womens: [
        'Basketball',
        'Cross Country',
        'Fencing',
        'Indoor Track',
        'Rowing',
        'Soccer',
        'Softball',
        'Swimming',
        'Tennis',
        'Track & Field',
        'Volleyball',
        'Water Polo'
      ]
    }
  },

  // San Francisco State
  sfsu: {
    slug: 'sfsu',
    name: 'San Francisco State',
    logo: '/images/sfsu-gators.svg',
    colors: {
      primary: '#3A1A6A',   // Purple
      secondary: '#FDB515', // Gold
      backgroundOverlay: 'rgba(35, 20, 60, 0.85)'
    },
    teamPrefix: 'SF State',
    sportsGroups: {
      mens: ['Basketball', 'Cross Country', 'Track & Field', 'Wrestling'],
      womens: ['Basketball', 'Cross Country', 'Soccer', 'Softball', 'Track & Field', 'Volleyball']
    }
  },

  // University of San Diego
  usd: {
    slug: 'usd',
    name: 'University of San Diego',
    logo: '/images/default-logo.png',
    colors: {
      primary: '#0C5DA5',
      secondary: '#7FB1E0',
      backgroundOverlay: 'rgba(12, 93, 165, 0.85)'
    },
    teamPrefix: 'USD',
    sportsGroups: {
      mens: ['Baseball', 'Basketball', 'Cross Country', 'Football', 'Golf', 'Rowing', 'Soccer', 'Tennis'],
      womens: ['Basketball', 'Beach Volleyball', 'Cross Country', 'Rowing', 'Soccer', 'Softball', 'Swimming & Diving', 'Tennis', 'Track', 'Volleyball']
    }
  },

  // University of San Francisco
  usf: {
    slug: 'usf',
    name: 'University of San Francisco',
    logo: '/images/default-logo.png',
    colors: {
      primary: '#006747',   // USF Green
      secondary: '#FDBB30', // USF Gold
      backgroundOverlay: 'rgba(0, 103, 71, 0.85)'
    },
    teamPrefix: 'USF',
    sportsGroups: {
      mens: ['Baseball', 'Basketball', 'Cross Country', 'Golf', 'Soccer', 'Track & Field'],
      womens: ['Basketball', 'Beach Volleyball', 'Cross Country', 'Golf', 'Soccer', 'Track & Field', 'Triathlon', 'Volleyball']
    }
  }
};

export const DEFAULT_UNIVERSITY: UniversityConfig = {
  slug: 'default',
  name: 'AI Alumni Hub',
  logo: '/images/ucsd-trident.svg',
  colors: {
    primary: '#182B49',
    secondary: '#FFCD00',
    backgroundOverlay: 'rgba(24, 43, 73, 0.85)'
  },
  sportsGroups: {
    mens: ['Baseball', 'Basketball', 'Soccer'],
    womens: ['Basketball', 'Soccer', 'Softball']
  },
  sports: [
    'Baseball',
    "Basketball (Men's)",
    "Basketball (Women's)",
    "Soccer (Men's)",
    "Soccer (Women's)",
    'Softball'
  ]
};

/**
 * Normalize basic sports arrays into grouped sports if sportsGroups is not provided.
 * Recognizes "(Men's)" and "(Women's)" suffixes; otherwise places items into mens by default.
 */
export function getSportsGroups(uni: UniversityConfig): SportsGroups {
  if (uni.sportsGroups) return uni.sportsGroups;

  const mens: string[] = [];
  const womens: string[] = [];

  for (const raw of uni.sports ?? []) {
    const s = String(raw || '').trim();
    if (!s) continue;

    const m = s.match(/\((men|men's)\)/i);
    const w = s.match(/\((women|women's)\)/i);

    const base = s.replace(/\s*\((men|men's|women|women's)\)\s*$/i, '').trim();

    if (w) womens.push(base);
    else if (m) mens.push(base);
    else mens.push(base); // default bucket when unspecified
  }

  return { mens, womens };
}