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
        'Basketball',              // UCSD Men's Basketball resolves via teamPrefix + "Men's Basketball"
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

  // IMPORTANT: teamPrefix changed to match feed strings like "SF State Baseball"
  sfsu: {
    slug: 'sfsu',
    name: 'San Francisco State',
    logo: '/images/sfsu-gators.svg',
    colors: {
      primary: '#3A1A6A',
      secondary: '#FDB515',
      backgroundOverlay: 'rgba(35, 20, 60, 0.85)'
    },
    teamPrefix: 'SF State',
    sports: [
      'Baseball',                  // SF State Baseball
      "Basketball (Men's)",
      "Basketball (Women's)",
      'Volleyball',
      "Soccer (Men's)"
    ]
  },

  // University of San Diego (USD) – ensure "USD Baseball" matches
  usd: {
    slug: 'usd',
    name: 'University of San Diego',
    logo: '/images/default-logo.png',
    colors: {
      // neutral defaults; team colors from feed can still override in-theme flows
      primary: '#182B49',
      secondary: '#FFCD00',
      backgroundOverlay: 'rgba(24, 43, 73, 0.85)'
    },
    teamPrefix: 'USD',
    sportsGroups: {
      mens: [
        'Baseball',                // USD Baseball
        'Basketball'
      ],
      womens: [
        'Basketball',
        'Soccer'
      ]
    }
  },

  // University of San Francisco (USF) – ensure "USF Basketball" matches
  usf: {
    slug: 'usf',
    name: 'University of San Francisco',
    logo: '/images/default-logo.png',
    colors: {
      // neutral defaults; team colors from feed can still override in-theme flows
      primary: '#182B49',
      secondary: '#FFCD00',
      backgroundOverlay: 'rgba(24, 43, 73, 0.85)'
    },
    teamPrefix: 'USF',
    sportsGroups: {
      mens: [
        'Basketball'               // USF Basketball
      ],
      womens: [
        'Basketball'
      ]
    }
  }

  // Add more universities here (one-time setup)
};

// Reasonable defaults if an unknown slug is used
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
    mens: [
      'Baseball',
      'Basketball',
      'Soccer'
    ],
    womens: [
      'Basketball',
      'Soccer',
      'Softball'
    ]
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

// Helper to normalize to Men’s/Women’s groups no matter how the university was defined
export function getSportsGroups(u: UniversityConfig): SportsGroups {
  if (u.sportsGroups) return u.sportsGroups;

  const arr = u.sports ?? DEFAULT_UNIVERSITY.sports ?? [];
  const mens: string[] = [];
  const womens: string[] = [];

  for (const s of arr) {
    const lower = s.toLowerCase();
    if (lower.includes("(men")) {
      mens.push(s.replace(/\s*\(men.*\)\s*/i, '').trim());
    } else if (lower.includes("(women")) {
      womens.push(s.replace(/\s*\(women.*\)\s*/i, '').trim());
    } else {
      // unisex fallback → list under men's by default
      mens.push(s);
    }
  }
  return { mens, womens };
}