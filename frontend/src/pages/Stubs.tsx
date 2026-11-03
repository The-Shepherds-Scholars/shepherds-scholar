import PageStub from '../components/PageStub';

// Screens still to build. Each points to its numbered wireframe.
export const Timeline = () => (
  <PageStub title="Timeline" wireframe={2} intro="Browse eras and events in order, from the Patriarchs to the early Church." />
);
export const EventDetail = () => (
  <PageStub title="Event" wireframe={3} intro="One event: what Scripture says, what history shows, and how it connects." />
);
export const MapPage = () => (
  <PageStub title="The Holy Land, then and now" wireframe={4} intro="Drag the divider to compare the Roman-era map with today’s." />
);
export const Readings = () => (
  <PageStub title="Daily readings" wireframe={5} intro="Today’s Mass readings as references, each opening in the Douay-Rheims." />
);
export const Search = () => (
  <PageStub title="Search" wireframe={6} intro="Find events, people, and places in one box." />
);
export const Pathway = () => (
  <PageStub title="Guided pathway" wireframe={8} intro="A curated journey through events, one step at a time." />
);
export const About = () => (
  <PageStub title="About me" wireframe={9} intro="Hi, I’m Lupe. [Your story goes here, in your own words.]" />
);
export const Parish = () => (
  <PageStub title="Support the Church near you" wireframe={10} intro="This site doesn’t take donations. Consider giving to a local parish or a Catholic charity instead.">
    <a className="button" href="https://www.google.com/maps/search/catholic+church+near+me">Find Catholic churches near me</a>
  </PageStub>
);
export const Sources = () => (
  <PageStub title="Sources and APIs" wireframe={11} intro="Every text, dataset, and service behind the site, with its license." />
);
export const NotFound = () => (
  <main>
    <h1>Page not found</h1>
    <p className="lead">That page doesn’t exist. Try the menu, or head back home.</p>
  </main>
);
