import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Mass from './pages/Mass';
import Contact from './pages/Contact';
import Miracles from './pages/Miracles';
import Angels from './pages/Angels';
import Sources from './pages/Sources';
import Readings from './pages/Readings';
import Parish from './pages/Parish';
import About from './pages/About';
import MapPage from './pages/MapPage';
import {
  EventDetail, NotFound, Pathway, Search, Timeline,
} from './pages/Stubs';

// Routes match the route table in the blueprint and the numbered wireframes.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="events/:slug" element={<EventDetail />} />
          <Route path="map" element={<MapPage />} />
          <Route path="readings" element={<Readings />} />
          <Route path="search" element={<Search />} />
          <Route path="mass" element={<Mass />} />
          <Route path="miracles" element={<Miracles />} />
          <Route path="angels" element={<Angels />} />
          <Route path="pathways/:slug" element={<Pathway />} />
          <Route path="about" element={<About />} />
          <Route path="parish" element={<Parish />} />
          <Route path="sources" element={<Sources />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
