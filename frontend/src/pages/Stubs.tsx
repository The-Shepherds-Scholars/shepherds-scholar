import PageStub from '../components/PageStub';
import ScholarDefinition from '../components/ScholarDefinition';

// Screens still to build. Each shows "Coming soon" and points (in code) to its numbered wireframe.
export const Timeline = () => (
  <PageStub
    title="Timeline"
    wireframe={2}
    intro={<>Browse eras and events in order, from the <ScholarDefinition term="patriarchs">Patriarchs</ScholarDefinition> to the early Church.</>}
    coming="Events, with honest date ranges and their sources, are being researched one at a time."
  />
);
export const EventDetail = () => (
  <PageStub
    title="Event"
    wireframe={3}
    intro="One event: what Scripture says, what history shows, and how it connects."
    coming="Each event will list its statements with their labels and sources."
  />
);
export const Search = () => (
  <PageStub
    title="Search"
    wireframe={6}
    intro="Find events, people, and places in one box."
    coming="Search across events and people is on the way. Places can already be searched on the map."
  />
);
export const Pathway = () => (
  <PageStub
    title="Guided pathway"
    wireframe={8}
    intro="A curated journey through events, one step at a time."
    coming="Guided pathways need the timeline’s events first."
  />
);
export const NotFound = () => (
  <main>
    <h1>Page not found</h1>
    <p className="lead">That page doesn’t exist. Try the menu, or head back home.</p>
  </main>
);
