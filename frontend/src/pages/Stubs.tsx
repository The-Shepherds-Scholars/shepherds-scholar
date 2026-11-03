import PageStub from '../components/PageStub';
import ScholarDefinition from '../components/ScholarDefinition';

// Screens still to build. Each points to its numbered wireframe.
export const Timeline = () => (
  <PageStub title="Timeline" wireframe={2} intro={<>Browse eras and events in order, from the <ScholarDefinition term="patriarchs">Patriarchs</ScholarDefinition> to the early Church.</>} />
);
export const EventDetail = () => (
  <PageStub title="Event" wireframe={3} intro="One event: what Scripture says, what history shows, and how it connects." />
);
export const Search = () => (
  <PageStub title="Search" wireframe={6} intro="Find events, people, and places in one box." />
);
export const Pathway = () => (
  <PageStub title="Guided pathway" wireframe={8} intro="A curated journey through events, one step at a time." />
);
export const NotFound = () => (
  <main>
    <h1>Page not found</h1>
    <p className="lead">That page doesn’t exist. Try the menu, or head back home.</p>
  </main>
);
