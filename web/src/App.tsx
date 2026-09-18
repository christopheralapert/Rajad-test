import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { FilterPage } from './pages/FilterPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { VideoPage } from './pages/VideoPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  // If the app is hosted in a subfolder (e.g. https://domain.ee/Rajad/),
  // Vite sets import.meta.env.BASE_URL accordingly ("/Rajad/" in production).
  // BrowserRouter expects basename without a trailing slash.
  const baseUrl = import.meta.env.BASE_URL;
  const basename = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/filter" element={<FilterPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/video" element={<VideoPage />} />
        </Routes>

        <footer className="border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="text-sm text-gray-600">© {new Date().getFullYear()} Estonia Trails</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/video" className="text-green-700 hover:underline">Video</Link>
              <a
                href="https://rmk-loodusegakoos-veebikaart.rmk.ee/#/"
                target="_blank"
                rel="noreferrer"
                className="text-green-700 hover:underline"
              >
                RMK Map
              </a>
            </div>
          </div>
        </footer>

        <Toaster />
      </div>
    </BrowserRouter>
  );
}
