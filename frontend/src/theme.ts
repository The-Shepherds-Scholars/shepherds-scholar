// Each route's saint palette. The NavBar, links, and ScholarDefinition all read these
// through CSS variables set on <html>, so a page's colors live in one place.
export interface Theme {
  accent: string; // nav bar, buttons, underlines
  ground: string; // page background
  saint: string; // whose palette this is, for reference
}

const JESUS_CRIMSON: Theme = { accent: '#8E1B2B', ground: '#F7F5F2', saint: 'Jesus (red robe)' };
const JESUS_BLUE: Theme = { accent: '#1F3A6B', ground: '#F7F5F2', saint: 'Jesus (blue mantle)' };
const GUADALUPE_TEAL: Theme = { accent: '#1F5F5B', ground: '#FAF6F3', saint: 'Our Lady of Guadalupe (mantle)' };
const GUADALUPE_ROSE: Theme = { accent: '#A8394C', ground: '#FBF6F5', saint: 'Our Lady of Guadalupe (gown)' };
const MICHAEL_RED: Theme = { accent: '#A3282E', ground: '#EEF1F4', saint: 'St. Michael (cloak)' };
const MICHAEL_STEEL: Theme = { accent: '#2E4A6B', ground: '#EEF1F4', saint: 'St. Michael (armor)' };
const MICHAEL_NIGHT: Theme = { accent: '#1B2A41', ground: '#EEF1F5', saint: 'St. Michael (night)' };
const EUCHARIST_GOLD: Theme = { accent: '#7A5C14', ground: '#FAF7EF', saint: 'The Eucharist' };
const UNSTYLED: Theme = { accent: '#2F5D7C', ground: '#F4F5F2', saint: 'Not chosen yet' };

// First matching prefix wins, so list longer paths before shorter ones.
const ROUTE_THEMES: Array<[string, Theme]> = [
  ['/contact', JESUS_BLUE],
  ['/about', GUADALUPE_TEAL],
  ['/miracles', GUADALUPE_ROSE],
  ['/parish', MICHAEL_RED],
  ['/sources', MICHAEL_STEEL],
  ['/angels', MICHAEL_NIGHT],
  ['/mass', EUCHARIST_GOLD],
  ['/map', UNSTYLED], // to be styled later
  ['/timeline', UNSTYLED], // palettes for these are "to choose" in the blueprint
  ['/events', UNSTYLED],
  ['/readings', UNSTYLED],
  ['/search', UNSTYLED],
  ['/pathways', UNSTYLED],
  ['/', JESUS_CRIMSON],
];

export function themeFor(pathname: string): Theme {
  const hit = ROUTE_THEMES.find(([prefix]) => (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)));
  return hit ? hit[1] : UNSTYLED;
}
