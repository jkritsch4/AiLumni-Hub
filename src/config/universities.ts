export type UniversityConfig = {
  slug: string;
  name: string;
  logo: string; // absolute or public/ path
  colors: {
    primary: string;   // hex
    secondary: string; // hex
    backgroundOverlay?: string; // optional rgba
  };
  sports: string[];
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
    sports: [
      'Baseball',
      "Basketball (Men's)",
      "Basketball (Women's)",
      "Soccer (Men's)",
      "Soccer (Women's)",
      'Softball'
    ]
  },
  sfsu: {
    slug: 'sfsu',
    name: 'San Francisco State',
    logo: '/images/sfsu-gators.svg',
    colors: {
      primary: '#3A1A6A',
      secondary: '#FDB515',
      backgroundOverlay: 'rgba(35, 20, 60, 0.85)'
    },
    sports: [
      'Baseball',
      'Basketball (Men\'s)',
      'Basketball (Women\'s)',
      'Volleyball',
      'Soccer (Men\'s)'
    ]
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
  sports: [
    'Baseball',
    "Basketball (Men's)",
    "Basketball (Women's)",
    "Soccer (Men's)",
    "Soccer (Women's)",
    'Softball'
  ]
};